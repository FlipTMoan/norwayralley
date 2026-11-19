using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Rally.Actors;
using Rally.Gameplay;
using Rally.Net;
using Rally.Presentation;
using Rally.UI;
using Rally.Vehicle;
using Rally.World;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;
using UnityEngine.UIElements;

namespace Rally.Editor
{
    /// <summary>
    /// Everything SCENE.md asks a human to click, done by code so the project plays and builds straight after a
    /// clone: Rally → Build Bootstrap Scene, or headless
    /// <c>Unity -batchmode -nographics -projectPath unity -executeMethod Rally.Editor.SceneBuilder.Build -quit</c>.
    /// Idempotent: existing assets under Assets/_Rally/Settings and Prefabs are kept (so hand-tuned values survive),
    /// missing ones are created; the scene itself is regenerated every run. Placeholder art (trees, actors, terrain
    /// textures) is procedural so the world renders before real models exist; swap the slots on the assets later.
    /// </summary>
    public static class SceneBuilder
    {
        const string SettingsDir = "Assets/_Rally/Settings";
        const string PrefabsDir = "Assets/_Rally/Prefabs";
        const string ScenesDir = "Assets/_Rally/Scenes";
        public const string ScenePath = ScenesDir + "/Rally.unity";
        const string CarFbx = "Assets/_Rally/Art/Cars/porsche-911/source/SM_Porsche911.fbx";
        const string CarTextures = "Assets/_Rally/Art/Cars/porsche-911/textures/";
        const string CarPrefabPath = PrefabsDir + "/Car_Porsche911.prefab";
        const string HudUxml = "Assets/_Rally/Runtime/UI/Hud.uxml";
        const string CarveCompute = "Assets/_Rally/Runtime/World/Carve.compute";
        const string ScatterCompute = "Assets/_Rally/Runtime/World/Scatter.compute";

        [MenuItem("Rally/Build Bootstrap Scene")]
        public static void Build()
        {
            foreach (var d in new[] { SettingsDir, SettingsDir + "/Trees", SettingsDir + "/Actors", SettingsDir + "/Terrain", SettingsDir + "/Car", PrefabsDir, PrefabsDir + "/Actors", ScenesDir })
                EnsureFolder(d);

            ApplyProjectSettings();
            EnsureArrowSprite();
            CreatePipeline();
            var profile = CreateVolumeProfile();
            var panel = CreatePanelSettings();
            var (tarmac, gravel) = RoadMaterials();
            var style = CreateWorldStyle(profile);
            var actorSet = CreateActorSet();
            var car = CreateCarPrefab();
            BuildScene(profile, panel, style, actorSet, car, tarmac, gravel);
            AssetDatabase.SaveAssets();
            Debug.Log("SceneBuilder: done. Press Play (UseFakeSources is on) or run Rally → Build Web.");
        }

        // ---- project settings --------------------------------------------------------------------------

        /// <summary>Input System (CarController / CameraRig read Keyboard.current), linear colour, the names on the start screen.</summary>
        static void ApplyProjectSettings()
        {
            PlayerSettings.companyName = "Filip Tobias Moan";
            PlayerSettings.productName = "Retro Norway Rally";
            PlayerSettings.colorSpace = ColorSpace.Linear;
            // activeInputHandler: 0 = legacy Input Manager, 1 = Input System package, 2 = both. There is no public API;
            // the serialized field on ProjectSettings.asset is what the Player Settings UI writes. Takes effect on the
            // next editor start (this run is fine: nothing reads input while building).
            var so = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset")[0]);
            var prop = so.FindProperty("activeInputHandler");
            if (prop != null && prop.intValue != 1) { prop.intValue = 1; so.ApplyModifiedPropertiesWithoutUndo(); Debug.Log("SceneBuilder: Active Input Handling → Input System (restart the editor for it to apply)"); }
        }

        // ---- render pipeline ---------------------------------------------------------------------------

        /// <summary>
        /// URP asset + Universal Renderer: Forward+ (many small lights: headlights, houses), 4 cascades at 200 m (long low-sun
        /// shadows; WorldStyleSO.ApplyShadows rewrites both), HDR for bloom, no MSAA (the CRT feature / render scale own the
        /// look), the depth texture for the water shader (no opaque texture: nothing samples it, and the copy is a full-screen
        /// pass). Features: SSAO (realistic preset; half resolution from the depth prepass, which the trees take part in —
        /// they have no DepthNormals pass) and the CRT presenter, disabled = realistic. Assigned to Graphics and to every
        /// Quality level so no level falls back to Built-in.
        /// </summary>
        static UniversalRenderPipelineAsset CreatePipeline()
        {
            string rendererPath = SettingsDir + "/RallyURP_Renderer.asset", assetPath = SettingsDir + "/RallyURP.asset";
            var data = AssetDatabase.LoadAssetAtPath<UniversalRendererData>(rendererPath);
            if (data == null)
            {
                data = ScriptableObject.CreateInstance<UniversalRendererData>();
                data.renderingMode = RenderingMode.ForwardPlus;
                AssetDatabase.CreateAsset(data, rendererPath);
            }
            // What the Create → URP Asset menu does behind the scenes: the renderer needs the package's post-process data
            // and shader resources (internal API, hence reflection; ResourceReloader fills the rest).
            if (data.postProcessData == null)
            {
                var m = typeof(PostProcessData).GetMethod("GetDefaultPostProcessData", BindingFlags.Static | BindingFlags.NonPublic);
                data.postProcessData = m?.Invoke(null, null) as PostProcessData;
            }
            ResourceReloader.ReloadAllNullIn(data, UniversalRenderPipelineAsset.packagePath);
            AddRendererFeature<ScreenSpaceAmbientOcclusion>(data, "SSAO", null);
            foreach (var ssao in data.rendererFeatures.OfType<ScreenSpaceAmbientOcclusion>())
            {
                var so = new SerializedObject(ssao);
                so.FindProperty("m_Settings.Downsample").boolValue = true;
                so.FindProperty("m_Settings.Source").enumValueIndex = 0;   // Depth
                so.ApplyModifiedPropertiesWithoutUndo();
            }
            AddRendererFeature<CrtRenderFeature>(data, "CRT", f => { f.settings.Shader = Shader.Find("Rally/CRT"); f.SetActive(false); });
            EditorUtility.SetDirty(data);

            var asset = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(assetPath);
            if (asset == null)
            {
                asset = UniversalRenderPipelineAsset.Create(data);
                AssetDatabase.CreateAsset(asset, assetPath);
            }
            asset.supportsHDR = true;
            asset.msaaSampleCount = 1;
            asset.supportsCameraDepthTexture = true;
            asset.supportsCameraOpaqueTexture = false;
            asset.shadowCascadeCount = 4;
            asset.shadowDistance = 200f;
            EditorUtility.SetDirty(asset);

            GraphicsSettings.defaultRenderPipeline = asset;
            int level = QualitySettings.GetQualityLevel();
            for (int i = 0; i < QualitySettings.names.Length; i++) { QualitySettings.SetQualityLevel(i, false); QualitySettings.renderPipeline = asset; }
            QualitySettings.SetQualityLevel(level, false);
            return asset;
        }

        /// <summary>Adds a feature the way ScriptableRendererDataEditor.AddComponent does (sub-asset + the local-id map), once.</summary>
        static void AddRendererFeature<T>(ScriptableRendererData data, string name, Action<T> init) where T : ScriptableRendererFeature
        {
            if (data.rendererFeatures.Any(f => f is T)) return;
            var feature = ScriptableObject.CreateInstance<T>();
            feature.name = name;
            init?.Invoke(feature);
            AssetDatabase.AddObjectToAsset(feature, data);
            AssetDatabase.TryGetGUIDAndLocalFileIdentifier(feature, out _, out long localId);
            var so = new SerializedObject(data);
            var list = so.FindProperty("m_RendererFeatures"); var map = so.FindProperty("m_RendererFeatureMap");
            list.arraySize++; list.GetArrayElementAtIndex(list.arraySize - 1).objectReferenceValue = feature;
            map.arraySize++; map.GetArrayElementAtIndex(map.arraySize - 1).longValue = localId;
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        /// <summary>The global Volume's profile: Bloom, ACES, Vignette, Motion blur — WorldStyleSO.ApplyPostProcessing sets the values at Play.</summary>
        static VolumeProfile CreateVolumeProfile()
        {
            string path = SettingsDir + "/RallyPost.asset";
            var profile = AssetDatabase.LoadAssetAtPath<VolumeProfile>(path);
            if (profile != null) return profile;
            profile = ScriptableObject.CreateInstance<VolumeProfile>();
            AssetDatabase.CreateAsset(profile, path);
            var bloom = profile.Add<Bloom>(true); bloom.intensity.value = 0.35f;
            var tone = profile.Add<Tonemapping>(true); tone.mode.value = TonemappingMode.ACES;
            var vig = profile.Add<Vignette>(true); vig.intensity.value = 0.25f;
            var mb = profile.Add<MotionBlur>(true); mb.intensity.value = 0.3f;
            foreach (var c in profile.components) { c.name = c.GetType().Name; AssetDatabase.AddObjectToAsset(c, profile); }
            return profile;
        }

        /// <summary>UI Toolkit panel: 1280×720 "scale with screen size" (the JS HUD was laid out for that), default runtime theme.</summary>
        static PanelSettings CreatePanelSettings()
        {
            string tssPath = SettingsDir + "/UnityDefaultRuntimeTheme.tss", path = SettingsDir + "/RallyPanel.asset";
            if (!File.Exists(tssPath)) { File.WriteAllText(tssPath, "@import url(\"unity-theme://default\");\n"); AssetDatabase.ImportAsset(tssPath); }
            var panel = AssetDatabase.LoadAssetAtPath<PanelSettings>(path);
            if (panel == null) { panel = ScriptableObject.CreateInstance<PanelSettings>(); AssetDatabase.CreateAsset(panel, path); }
            panel.scaleMode = PanelScaleMode.ScaleWithScreenSize;
            panel.referenceResolution = new Vector2Int(1280, 720);
            panel.themeStyleSheet = AssetDatabase.LoadAssetAtPath<ThemeStyleSheet>(tssPath);
            EditorUtility.SetDirty(panel);
            return panel;
        }

        // ---- world style ------------------------------------------------------------------------------

        /// <summary>WorldStyle with the realistic preset (the asset's defaults) and every material slot filled with a placeholder that renders.</summary>
        static WorldStyleSO CreateWorldStyle(VolumeProfile profile)
        {
            var style = GetOrCreate<WorldStyleSO>(SettingsDir + "/WorldStyle.asset");
            style.Mode = WorldStyleSO.Preset.Realistic;
            style.PostProfile = profile;
            style.ScatterShader = AssetDatabase.LoadAssetAtPath<ComputeShader>(ScatterCompute);
            style.TerrainMaterial = TerrainMaterial();
            style.Vegetation = CreateVegetationSet();
            style.SkyMaterial = ShaderMaterial(SettingsDir + "/Sky.mat", "Rally/Sky", null);
            // Rally/Water needs the depth texture (set on the URP asset); if the shader did not compile fall back to a lit tint.
            var water = ShaderMaterial(SettingsDir + "/Lake.mat", "Rally/Water", m => { });
            style.LakeMaterial = water ?? LitMaterial(SettingsDir + "/Lake.mat", new Color(0.1f, 0.3f, 0.4f), 0.9f);
            style.RiverMaterial = ShaderMaterial(SettingsDir + "/River.mat", "Rally/Water", m => m.SetFloat("_Flow", 1f)) ?? style.LakeMaterial;
            style.SeaMaterial = ShaderMaterial(SettingsDir + "/Sea.mat", "Rally/Water", m => m.SetFloat("_SwellAmp", 0.25f)) ?? style.LakeMaterial;
            // Houses are vertex-coloured; URP Lit ignores COLOR, the URP particle Lit shader multiplies it in.
            style.BuildingMaterial = ShaderMaterial(SettingsDir + "/Buildings.mat", "Universal Render Pipeline/Particles/Lit", null)
                                     ?? LitMaterial(SettingsDir + "/Buildings.mat", new Color(0.75f, 0.7f, 0.6f), 0.2f);
            EditorUtility.SetDirty(style);
            return style;
        }

        /// <summary>
        /// Rally/TerrainClipmap with the nine procedural ground layers (Editor/GroundTextures, LandcoverSplat slice order).
        /// The 5-slice colour placeholders this replaced are deleted.
        /// </summary>
        static Material TerrainMaterial()
        {
            foreach (var old in new[] { SettingsDir + "/Terrain/Albedo.asset", SettingsDir + "/Terrain/Normals.asset" })
                if (AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(old) != null) AssetDatabase.DeleteAsset(old);
            var (albedo, normals) = GroundTextures.Build(SettingsDir + "/Terrain", ForceArt);
            var m = ShaderMaterial(SettingsDir + "/Terrain.mat", "Rally/TerrainClipmap", null) ?? LitMaterial(SettingsDir + "/Terrain.mat", new Color(0.3f, 0.4f, 0.2f), 0.1f);
            if (m.HasProperty("_Albedo")) { m.SetTexture("_Albedo", albedo); m.SetTexture("_Normals", normals); EditorUtility.SetDirty(m); }
            return m;
        }

        // ---- vegetation ------------------------------------------------------------------------------------

        /// <summary>
        /// The five species in the fixed index order (spruce, pine, birch, mountain birch, shrub), generated by
        /// Editor/TreeBuilder: 3 mesh LODs, a baked impostor, procedural bark and foliage textures, Rally/Tree materials
        /// (URP Lit would not read the indirect instance buffer and would draw every tree at the origin).
        /// </summary>
        static VegetationSetSO CreateVegetationSet()
        {
            var set = GetOrCreate<VegetationSetSO>(SettingsDir + "/VegetationSet.asset");
            if (AssetDatabase.LoadAssetAtPath<Mesh>(SettingsDir + "/Trees/Billboard.asset") != null) AssetDatabase.DeleteAsset(SettingsDir + "/Trees/Billboard.asset");   // the old shared quad
            TreeBuilder.Build(set, SettingsDir + "/Trees", ForceArt);
            return set;
        }

        /// <summary>Regenerate the tree and ground textures even when the PNGs exist (meshes and materials are always rebuilt).</summary>
        static bool ForceArt;

        [MenuItem("Rally/Rebuild Tree and Ground Art")]
        public static void RebuildArt()
        {
            ForceArt = true;
            try { Build(); } finally { ForceArt = false; }
        }

        // ---- actors ----------------------------------------------------------------------------------------

        /// <summary>A colour-coded capsule per ActorKind (sized from ActorSpec.Radius) on layer Actors with a kinematic Rigidbody, plus a grey fallback.</summary>
        static ActorSetSO CreateActorSet()
        {
            var set = GetOrCreate<ActorSetSO>(SettingsDir + "/ActorSet.asset");
            var colours = new Dictionary<ActorKind, Color>
            {
                { ActorKind.Moose, new Color(0.35f, 0.25f, 0.15f) }, { ActorKind.Deer, new Color(0.7f, 0.5f, 0.3f) }, { ActorKind.Sheep, new Color(0.95f, 0.95f, 0.9f) },
                { ActorKind.Reindeer, new Color(0.6f, 0.55f, 0.5f) }, { ActorKind.Pedestrian, new Color(0.9f, 0.2f, 0.2f) }, { ActorKind.Dog, new Color(0.2f, 0.2f, 0.2f) },
                { ActorKind.Cyclist, new Color(0.2f, 0.4f, 0.9f) }, { ActorKind.Tractor, new Color(0.2f, 0.7f, 0.2f) },
            };
            var entries = new List<ActorSetSO.Entry>();
            foreach (ActorKind kind in Enum.GetValues(typeof(ActorKind)))
            {
                var spec = ActorSpec.For(kind);
                float height = kind == ActorKind.Tractor ? 2.6f : kind == ActorKind.Moose ? 2.0f : Mathf.Max(0.6f, spec.Radius * 2.2f);
                entries.Add(new ActorSetSO.Entry { Kind = kind, Prefab = CapsulePrefab($"{PrefabsDir}/Actors/Actor_{kind}.prefab", spec.Radius, height, colours[kind]) });
            }
            set.Entries = entries.ToArray();
            set.Fallback = CapsulePrefab($"{PrefabsDir}/Actors/Actor_Fallback.prefab", 0.5f, 1.2f, Color.grey);
            EditorUtility.SetDirty(set);
            return set;
        }

        static GameObject CapsulePrefab(string path, float radius, float height, Color colour)
        {
            var existing = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (existing != null) return existing;
            var go = new GameObject(Path.GetFileNameWithoutExtension(path)) { layer = LayerMask.NameToLayer(RallyLayers.ActorsName) };
            var body = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            body.name = "Body";
            body.transform.SetParent(go.transform, false);
            body.transform.localPosition = new Vector3(0f, height * 0.5f, 0f);          // feet at the origin: ActorView puts y on the ground
            body.transform.localScale = new Vector3(radius * 2f, height * 0.5f, radius * 2f);
            body.layer = go.layer;
            UnityEngine.Object.DestroyImmediate(body.GetComponent<Collider>());
            body.GetComponent<MeshRenderer>().sharedMaterial = LitMaterial(SettingsDir + "/Actors/" + go.name + ".mat", colour, 0.3f);
            var cap = go.AddComponent<CapsuleCollider>();
            cap.radius = radius; cap.height = height; cap.center = new Vector3(0f, height * 0.5f, 0f);
            var rb = go.AddComponent<Rigidbody>();
            rb.isKinematic = true; rb.useGravity = false;
            var prefab = PrefabUtility.SaveAsPrefabAsset(go, path);
            UnityEngine.Object.DestroyImmediate(go);
            return prefab;
        }

        // ---- car ---------------------------------------------------------------------------------------------

        /// <summary>
        /// The Porsche prefab from the WoTiger FBX: the importer is scaled so the wheelbase (or, without separate wheels,
        /// the body length) matches CarSpec, the model is turned so its long axis is +Z and dropped so the tyres sit on y = 0
        /// (CarController places the root at ground level and the wheel pivots at WheelRadius), the wheel meshes are hung
        /// under four pivot/spin pairs at the CarSpec axle positions (cylinders when the FBX has none), and the vehicle
        /// components go on the root. Particle, light and trail slots stay empty: every component null-checks them.
        /// </summary>
        static GameObject CreateCarPrefab()
        {
            var spec = CarSpec.Porsche;
            var importer = AssetImporter.GetAtPath(CarFbx) as ModelImporter;
            if (importer == null) throw new Exception("Car FBX missing: " + CarFbx);
            // Read/Write: CarDamageVisual rewrites the body vertices where compute buffers are missing (WebGL 2, the editor's
            // no-compute paths), which needs a readable mesh. Applied every run so the setting survives a meta reset.
            if (!importer.isReadable || importer.materialImportMode != ModelImporterMaterialImportMode.ImportViaMaterialDescription || importer.materialLocation != ModelImporterMaterialLocation.InPrefab)
            {
                importer.isReadable = true;
                importer.materialImportMode = ModelImporterMaterialImportMode.ImportViaMaterialDescription;
                importer.materialLocation = ModelImporterMaterialLocation.InPrefab;
                importer.importBlendShapes = true;
                importer.SaveAndReimport();
            }
            var existing = AssetDatabase.LoadAssetAtPath<GameObject>(CarPrefabPath);
            if (existing != null) { Debug.Log("SceneBuilder: car prefab exists, kept"); return existing; }

            // Pass 1: measure. The model space long axis and the wheel positions decide the scale factor.
            var model = AssetDatabase.LoadAssetAtPath<GameObject>(CarFbx);
            var probe = (GameObject)PrefabUtility.InstantiatePrefab(model);
            var renderers = probe.GetComponentsInChildren<MeshRenderer>().Concat<Renderer>(probe.GetComponentsInChildren<SkinnedMeshRenderer>()).ToArray();
            var all = WorldBounds(renderers);
            bool longX = all.size.x > all.size.z;
            float length = Mathf.Max(all.size.x, all.size.z);
            var wheels = FindWheels(renderers, all, longX);
            foreach (var r in renderers) Debug.Log($"SceneBuilder: car part '{r.name}' bounds {r.bounds.center} size {r.bounds.size}, materials [{string.Join(", ", r.sharedMaterials.Select(m => m ? m.name + (m.mainTexture ? "(tex)" : "") : "null"))}]");
            float measuredBase = wheels.Count == 4 ? Mathf.Abs(Along(wheels[0].bounds.center, longX) - Along(wheels[2].bounds.center, longX)) : 0f;
            float factor = measuredBase > 0.5f ? spec.Wheelbase / measuredBase : 4.2f / length;
            UnityEngine.Object.DestroyImmediate(probe);
            Debug.Log($"SceneBuilder: car model bounds {all.size} (long axis {(longX ? "X" : "Z")}), {wheels.Count} wheel meshes, measured wheelbase {measuredBase:F3} m → importer scale ×{factor:F4}");
            if (Mathf.Abs(factor - 1f) > 0.01f)
            {
                importer.globalScale *= factor;
                importer.SaveAndReimport();
                model = AssetDatabase.LoadAssetAtPath<GameObject>(CarFbx);
            }

            // Pass 2: build.
            var root = new GameObject("Car_Porsche911") { layer = LayerMask.NameToLayer("Car") };
            var inst = (GameObject)PrefabUtility.InstantiatePrefab(model);
            PrefabUtility.UnpackPrefabInstance(inst, PrefabUnpackMode.Completely, InteractionMode.AutomatedAction);
            inst.name = "Model";
            inst.transform.SetParent(root.transform, false);
            if (longX) inst.transform.localRotation = Quaternion.Euler(0f, -90f, 0f);     // +X of the file → +Z (forward)
            renderers = inst.GetComponentsInChildren<MeshRenderer>().Concat<Renderer>(inst.GetComponentsInChildren<SkinnedMeshRenderer>()).ToArray();
            all = WorldBounds(renderers);
            wheels = FindWheels(renderers, all, false);
            float midZ = wheels.Count == 4 ? wheels.Average(w => w.bounds.center.z) : all.center.z;
            inst.transform.localPosition += new Vector3(-all.center.x, -all.min.y, (spec.FrontAxle - spec.Wheelbase * 0.5f) - midZ);
            all = WorldBounds(renderers);
            Debug.Log($"SceneBuilder: car after import scale: size {all.size} (length {all.size.z:F2} m, width {all.size.x:F2} m, height {all.size.y:F2} m)");
            foreach (var r in renderers) r.sharedMaterials = r.sharedMaterials.Select(CarMaterial).ToArray();

            var pivots = new Transform[4]; var spins = new Transform[4];
            bool cylinders = wheels.Count != 4;
            string[] names = { "WheelFL", "WheelFR", "WheelRL", "WheelRR" };
            for (int i = 0; i < 4; i++)
            {
                var w = CarSim.WheelOffset(spec, i);
                var pivot = new GameObject(names[i]).transform; pivot.SetParent(root.transform, false);
                var spin = new GameObject("Spin").transform; spin.SetParent(pivot, false);
                var wheel = cylinders ? null : wheels.OrderBy(r => Vector3.Distance(r.bounds.center, new Vector3(w.x, spec.WheelRadius, w.y))).First();
                if (wheel != null)
                {
                    wheels.Remove(wheel);
                    pivot.position = wheel.bounds.center;              // the spin axis through the wheel's own centre
                    wheel.transform.SetParent(spin, true);
                }
                else
                {
                    var cyl = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    UnityEngine.Object.DestroyImmediate(cyl.GetComponent<Collider>());
                    cyl.name = "Tyre"; cyl.transform.SetParent(spin, false);
                    cyl.transform.localRotation = Quaternion.Euler(0f, 0f, 90f);
                    cyl.transform.localScale = new Vector3(spec.WheelRadius * 2f, 0.11f, spec.WheelRadius * 2f);
                    cyl.GetComponent<MeshRenderer>().sharedMaterial = LitMaterial(SettingsDir + "/Car/Tyre.mat", new Color(0.08f, 0.08f, 0.08f), 0.3f);
                }
                pivot.localPosition = new Vector3(w.x, spec.WheelRadius, w.y);
                pivots[i] = pivot; spins[i] = spin;
            }
            if (cylinders) Debug.Log("SceneBuilder: the FBX has no four separate wheel meshes; cylinder tyres were added at the CarSpec axles");
            foreach (var t in root.GetComponentsInChildren<Transform>(true)) t.gameObject.layer = root.layer;

            var rb = root.AddComponent<Rigidbody>(); rb.isKinematic = true; rb.useGravity = false;
            var box = root.AddComponent<BoxCollider>();
            box.size = spec.BodySize; box.center = new Vector3(0f, spec.BodySize.y * 0.5f + 0.1f, spec.FrontAxle - spec.Wheelbase * 0.5f);
            var ctl = root.AddComponent<CarController>();
            ctl.Kind = CarKind.Porsche; ctl.WheelPivots = pivots; ctl.WheelSpins = spins;
            var dmg = root.AddComponent<CarDamageVisual>();
            var bodyRenderers = inst.GetComponentsInChildren<Renderer>().Where(r => !r.transform.IsChildOf(pivots[0]) && !r.transform.IsChildOf(pivots[1]) && !r.transform.IsChildOf(pivots[2]) && !r.transform.IsChildOf(pivots[3])).ToArray();
            dmg.Body = bodyRenderers.OrderByDescending(r => r.bounds.size.sqrMagnitude).FirstOrDefault();
            var fx = root.AddComponent<CarEffects>(); fx.DamageVisual = dmg;
            root.AddComponent<CarAudio>();
            Debug.Log($"SceneBuilder: car prefab: body renderer '{(dmg.Body ? dmg.Body.name : "none")}', wheels {(cylinders ? "cylinders" : "from the FBX")}");
            var prefab = PrefabUtility.SaveAsPrefabAsset(root, CarPrefabPath);
            UnityEngine.Object.DestroyImmediate(root);
            return prefab;
        }

        static float Along(Vector3 p, bool x) => x ? p.x : p.z;

        static Bounds WorldBounds(Renderer[] rs)
        {
            if (rs.Length == 0) return new Bounds(Vector3.zero, Vector3.one);
            var b = rs[0].bounds;
            foreach (var r in rs) b.Encapsulate(r.bounds);
            return b;
        }

        /// <summary>Four wheels by name (wheel / tire / tyre / rim), else the four small meshes nearest the ground at the corners; empty when there are not exactly four.</summary>
        static List<Renderer> FindWheels(Renderer[] rs, Bounds all, bool longX)
        {
            string[] keys = { "wheel", "tire", "tyre", "rim" };
            var byName = rs.Where(r => keys.Any(k => r.name.ToLowerInvariant().Contains(k)) && r.bounds.size.y < all.size.y * 0.6f).ToList();
            var picked = byName.Count == 4 ? byName : rs
                .Where(r => r.bounds.size.y < all.size.y * 0.5f && Mathf.Max(r.bounds.size.x, r.bounds.size.z) < all.size.z * 0.35f && r.bounds.min.y < all.min.y + 0.05f * all.size.y)
                .OrderBy(r => r.bounds.min.y).Take(4).ToList();
            if (picked.Count != 4) return new List<Renderer>();
            // Order: front pair first, left before right, measured along the long axis (front = larger coordinate is a guess; the scale only needs the spread).
            return picked.OrderByDescending(r => Along(r.bounds.center, longX)).ThenBy(r => longX ? r.bounds.center.z : r.bounds.center.x).ToList();
        }

        /// <summary>
        /// An editable copy of an FBX material under Settings/Car (the imported sub-asset is read-only). The material
        /// description rarely finds textures that live beside the source folder, so the WoTiger set is wired by hand.
        /// </summary>
        static Material CarMaterial(Material src)
        {
            if (src == null) return null;
            string path = $"{SettingsDir}/Car/{src.name}.mat";
            var m = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (m != null) return m;
            m = new Material(src);
            if (m.shader == null || !m.shader.name.Contains("Universal Render Pipeline")) m.shader = Shader.Find("Universal Render Pipeline/Lit");
            Texture2D Tex(string suffix) => AssetDatabase.LoadAssetAtPath<Texture2D>(CarTextures + "T_Porsche911_" + suffix + ".png");
            if (m.HasProperty("_BaseMap") && m.GetTexture("_BaseMap") == null)
            {
                var n = AssetImporter.GetAtPath(CarTextures + "T_Porsche911_N.png") as TextureImporter;
                if (n != null && n.textureType != TextureImporterType.NormalMap) { n.textureType = TextureImporterType.NormalMap; n.SaveAndReimport(); }
                m.SetTexture("_BaseMap", Tex("BC"));
                m.SetTexture("_BumpMap", Tex("N")); m.EnableKeyword("_NORMALMAP");
                m.SetTexture("_OcclusionMap", Tex("AO")); m.EnableKeyword("_OCCLUSIONMAP");
                m.SetFloat("_Smoothness", 0.6f); m.SetFloat("_Metallic", 0.2f);
            }
            AssetDatabase.CreateAsset(m, path);
            return m;
        }

        // ---- scene -------------------------------------------------------------------------------------------

        static void BuildScene(VolumeProfile profile, PanelSettings panel, WorldStyleSO style, ActorSetSO actors, GameObject car, Material tarmac, Material gravel)
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var camGo = new GameObject("Main Camera") { tag = "MainCamera" };
            var cam = camGo.AddComponent<Camera>();
            cam.nearClipPlane = 0.3f; cam.farClipPlane = 12000f;        // 12 km: the fjell on the horizon
            camGo.transform.position = new Vector3(0f, 6f, -12f);
            camGo.AddComponent<AudioListener>();
            var camData = cam.GetUniversalAdditionalCameraData();
            camData.renderPostProcessing = true;
            var rig = camGo.AddComponent<CameraRig>();

            var sunGo = new GameObject("Sun");
            var sun = sunGo.AddComponent<Light>();
            sun.type = LightType.Directional; sun.shadows = LightShadows.Soft; sun.intensity = 2.2f;
            sunGo.transform.rotation = Quaternion.Euler(35f, 200f, 0f);
            var sky = sunGo.AddComponent<SkyAndTime>(); sky.Sun = sun;
            RenderSettings.sun = sun;

            var skyGo = new GameObject("Sky");
            skyGo.AddComponent<SkyBinder>().SkyMaterial = style.SkyMaterial;
            RenderSettings.skybox = style.SkyMaterial;
            RenderSettings.ambientMode = AmbientMode.Flat;

            var volGo = new GameObject("Volume");
            var vol = volGo.AddComponent<Volume>(); vol.isGlobal = true; vol.sharedProfile = profile;

            var hudGo = new GameObject("HUD");
            var doc = hudGo.AddComponent<UIDocument>();
            doc.panelSettings = panel;
            doc.visualTreeAsset = AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(HudUxml);
            var hud = hudGo.AddComponent<HudController>();

            var ghostsGo = new GameObject("Ghosts");
            var ghosts = ghostsGo.AddComponent<GhostCarView>();
            ghosts.PorschePrefab = car; ghosts.BuggyPrefab = car;      // no buggy model yet: the same body, recoloured by the room paint

            var gameGo = new GameObject("Game");
            var game = gameGo.AddComponent<GameController>();
            game.Style = style;
            game.CarveShader = AssetDatabase.LoadAssetAtPath<ComputeShader>(CarveCompute);
            game.CarPrefab = car;
            game.ActorSet = actors;
            game.TarmacMaterial = tarmac; game.GravelMaterial = gravel;
            game.MainCamera = cam; game.Rig = rig; game.Sky = sky; game.Hud = hud; game.Ghosts = ghosts;
            game.UseFakeSources = true;                                  // first Play works offline; untick for live Kartverket / Overpass
            game.EditorQuery = "?drive=59.032,6.065";

            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };   // the only scene: BuildWeb builds every enabled one
            Debug.Log("SceneBuilder: scene saved to " + ScenePath);
        }

        /// <summary>Hud.uss shows the pace note with resource('UI/arrow'); a plain 64 px arrow until an artist replaces it.</summary>
        static void EnsureArrowSprite()
        {
            const string dir = "Assets/_Rally/Runtime/UI/Resources/UI", path = dir + "/arrow.png";
            if (File.Exists(path)) return;
            Directory.CreateDirectory(dir);
            const int n = 64;
            var tex = new Texture2D(n, n, TextureFormat.RGBA32, false);
            var px = new Color32[n * n];
            for (int y = 0; y < n; y++)
                for (int x = 0; x < n; x++)
                {
                    // Pointing up: a triangle head (top 55 %) over a shaft.
                    bool head = y >= n * 0.45f && Mathf.Abs(x - n * 0.5f) <= (n - y) * 0.9f;
                    bool shaft = y < n * 0.45f && Mathf.Abs(x - n * 0.5f) <= n * 0.14f && y > n * 0.08f;
                    px[y * n + x] = head || shaft ? new Color32(255, 196, 64, 255) : new Color32(0, 0, 0, 0);
                }
            tex.SetPixels32(px); tex.Apply();
            File.WriteAllBytes(path, tex.EncodeToPNG());
            UnityEngine.Object.DestroyImmediate(tex);
            AssetDatabase.ImportAsset(path);
            if (AssetImporter.GetAtPath(path) is TextureImporter ti) { ti.alphaIsTransparency = true; ti.mipmapEnabled = false; ti.SaveAndReimport(); }
        }

        // ---- helpers -----------------------------------------------------------------------------------------

        static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;
            AssetDatabase.CreateFolder(Path.GetDirectoryName(path).Replace('\\', '/'), Path.GetFileName(path));
        }

        static T GetOrCreate<T>(string path) where T : ScriptableObject
        {
            var a = AssetDatabase.LoadAssetAtPath<T>(path);
            if (a != null) return a;
            a = ScriptableObject.CreateInstance<T>();
            AssetDatabase.CreateAsset(a, path);
            return a;
        }

        static Mesh GetOrCreateMesh(string path, Func<Mesh> make)
        {
            var m = AssetDatabase.LoadAssetAtPath<Mesh>(path);
            if (m != null) return m;
            m = make(); m.name = Path.GetFileNameWithoutExtension(path);
            AssetDatabase.CreateAsset(m, path);
            return m;
        }

        /// <summary>
        /// The ribbon's two materials on Rally/Road (asphalt with markings, gravel). Existing assets are switched to the
        /// shader in place, so the scene's references survive (they were URP Lit flat colours before 2026-11-19).
        /// <c>Unity -batchmode -projectPath unity -executeMethod Rally.Editor.SceneBuilder.UpgradeRoadMaterials -quit</c>
        /// </summary>
        public static (Material tarmac, Material gravel) RoadMaterials()
        {
            var shader = Shader.Find("Rally/Road");
            EnsureFolder(SettingsDir + "/Road");
            var (detail, detailNormals) = RoadTextures.Build(SettingsDir + "/Road", ForceArt);
            Material Make(string name, float gravel)
            {
                string path = SettingsDir + "/" + name + ".mat";
                var m = AssetDatabase.LoadAssetAtPath<Material>(path);
                if (shader == null) return m != null ? m : LitMaterial(path, gravel > 0 ? new Color(0.55f, 0.5f, 0.42f) : new Color(0.22f, 0.22f, 0.23f), 0.2f);
                if (m == null) { m = new Material(shader); AssetDatabase.CreateAsset(m, path); }
                else m.shader = shader;
                m.SetFloat("_Gravel", gravel);
                m.SetColor("_Tint", Color.white);
                m.SetTexture("_Detail", detail);
                m.SetTexture("_DetailNormals", detailNormals);
                EditorUtility.SetDirty(m);
                return m;
            }
            var r = (Make("RoadTarmac", 0), Make("RoadGravel", 1));
            AssetDatabase.SaveAssets();
            return r;
        }

        public static void UpgradeRoadMaterials() => RoadMaterials();

        /// <summary>URP Lit material with a colour and smoothness; an existing asset is kept as is.</summary>
        static Material LitMaterial(string path, Color colour, float smoothness)
        {
            var m = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (m != null) return m;
            m = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            m.SetColor("_BaseColor", colour); m.SetFloat("_Smoothness", smoothness);
            AssetDatabase.CreateAsset(m, path);
            return m;
        }

        /// <summary>A material on a named shader, or null when the shader is missing or failed to compile (callers fall back to URP Lit).</summary>
        static Material ShaderMaterial(string path, string shaderName, Action<Material> init)
        {
            var existing = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (existing != null) return existing;
            var shader = Shader.Find(shaderName);
            if (shader == null || ShaderUtil.ShaderHasError(shader)) { Debug.LogWarning($"SceneBuilder: shader '{shaderName}' {(shader == null ? "not found" : "has errors")}; {path} falls back to URP Lit"); return null; }
            var m = new Material(shader);
            init?.Invoke(m);
            AssetDatabase.CreateAsset(m, path);
            return m;
        }
    }
}
