using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Rally.Vehicle;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.Editor
{
    /// <summary>
    /// The choosable cars besides the original 911 (SceneBuilder.CreateCarPrefab): one prefab per model in Art/Cars, built
    /// the same way for every FBX — parts of a second trim dropped, the file turned nose to +Z and scaled to the real car's
    /// length, wheel meshes hung under the four pivot/spin pairs at the CarSpec axles (a mesh that holds all four wheels is
    /// split into quadrants), the paint panels baked into one car-space mesh for the dents (CarDamageVisual works in the
    /// body's object space), editable material copies with the textures wired, the vehicle components, the body box from
    /// CarSpec and the exhaust on the tailpipes (CarExhaustSetup). <see cref="Pictures"/> renders the start-screen card of
    /// every car into Runtime/UI/Resources/UI/Cars.
    /// <c>Unity -batchmode -nographics -projectPath unity -executeMethod Rally.Editor.CarGarageBuilder.Build -quit</c> (rebuilds
    /// the new cars; BuildSceneAndPictures also the scene and the cards), <c>DISPLAY=:0 Unity -batchmode -projectPath unity -executeMethod Rally.Editor.CarGarageBuilder.Pictures -quit
    /// [-carShots DIR]</c> (cards, plus side / top / front / rear views of every car into DIR for checking).
    /// </summary>
    public static class CarGarageBuilder
    {
        const string Art = "Assets/_Rally/Art/Cars/";
        const string PrefabsDir = "Assets/_Rally/Prefabs";
        const string SettingsDir = "Assets/_Rally/Settings/Car";
        public const string PicturesDir = "Assets/_Rally/Runtime/UI/Resources/UI/Cars";
        public const string PorschePrefab = PrefabsDir + "/Car_Porsche911.prefab";

        sealed class Model
        {
            public CarKind Kind;
            public string Fbx;
            /// <summary>Overall length (m) of the real car; the file is scaled to it.</summary>
            public float Length;
            /// <summary>Degrees about +Y that turn the file's nose to +Z.</summary>
            public float Yaw;
            /// <summary>Parts to leave out, tested on the file as imported (the other trim of a two-car file).</summary>
            public Func<Renderer, bool> Drop = _ => false;
            /// <summary>One renderer per wheel (any order; sorted into FL FR RL RR by position).</summary>
            public string[] Wheels = new string[0];
            /// <summary>Renderers whose mesh holds all four wheels (or all four wheels' bolts): split into quadrants first.</summary>
            public string[] Split = new string[0];
            /// <summary>The paint panels: baked together into the one car-space Body mesh that CarDamageVisual dents.</summary>
            public Func<Renderer, bool> Body;
            /// <summary>Tailpipe outlets in car space (x right, y up, z forward), read off the built prefab with <see cref="Probe"/>.</summary>
            public Vector3[] Pipes;
            /// <summary>Textures the material description did not find: material name → (texture folder file prefix).</summary>
            public Action<Material> Textures = _ => { };
        }

        static string Folder(CarKind k) => $"{SettingsDir}/{k}";
        public static string PrefabPath(CarKind k) => k == CarKind.Porsche ? PorschePrefab : $"{PrefabsDir}/Car_{k}.prefab";

        static readonly Model[] Models =
        {
            new Model
            {
                Kind = CarKind.Carrera, Fbx = Art + "porsche-911-32-carrera-coupe/source/911Low.fbx", Length = 4.29f, Yaw = -90f,
                Split = new[] { "Car_wheels_Low1", "Car_bolts_Low1" },
                Wheels = new[] { "Car_wheels_Low1_FL", "Car_wheels_Low1_FR", "Car_wheels_Low1_RL", "Car_wheels_Low1_RR" },
                Body = r => r.name == "Car_body_Low1",
                Pipes = new[] { new Vector3(-0.55f, 0.31f, -2.08f) },
                Textures = m => Wire(m, Art + "porsche-911-32-carrera-coupe/textures/911Low_" + m.name + "_"),
            },
            new Model
            {
                Kind = CarKind.Turbo930, Fbx = Art + "911-turbo-930-improved/source/911 TURBO 930/911(930)_TURBO_FBX.fbx", Length = 4.29f, Yaw = 0f,
                Wheels = new[] { "Object_44", "Object_30", "Object_34", "Object_38" },
                Body = r => r.sharedMaterial != null && r.sharedMaterial.name == "Material.001" && r.bounds.size.magnitude > 0.5f,
                Pipes = new[] { new Vector3(-0.5f, 0.3f, -2.17f) },
            },
            new Model
            {
                Kind = CarKind.Volvo240, Fbx = Art + "volvo-240-styled-sedan-car-downloadable/source/volvo 240.fbx", Length = 4.85f, Yaw = 0f,
                Drop = r => r.bounds.center.x > -1.6f,                                // the GL trim at x = 0; the Turbo sits at x = -3.2
                Wheels = new[] { "Cylinder.004", "Cylinder.005", "Cylinder.006", "Cylinder.007" },
                Body = r => r.sharedMaterials.Any(m => m != null && m.name == "body2"),
                Pipes = new[] { new Vector3(-0.5f, 0.3f, -2.6f) },
            },
            new Model
            {
                Kind = CarKind.Ranger, Fbx = Art + "ford-ranger-offroad/source/untitled.fbx", Length = 5.36f, Yaw = 180f,
                Wheels = new[] { "wheel_lf.001", "wheel_rf.001", "wheel_lb.002", "wheel_rb.001" },
                Body = r => r.name == "chassis" || r.name == "bonnet" || r.name == "boot_ok" || r.name == "door_lf" || r.name == "door_rf",
                Pipes = new[] { new Vector3(-0.29f, 0.6f, -2.36f) },
            },
            new Model
            {
                Kind = CarKind.Mv6, Fbx = Art + "placeholder-mv6-83-low-poly-model/source/PLCHTR.fbx", Length = 3.6f, Yaw = 90f,
                Wheels = new[] { "PlaceholderMV683_WheelSport_FL", "PlaceholderMV683_WheelSport_FR", "PlaceholderMV683_WheelSport_RL", "PlaceholderMV683_WheelSport_RR" },
                Body = r => r.name == "PlaceholderMV683_RallyBody" || r.name == "PlaceholderMV683_Rally_Hood" || r.name == "PlaceholderMV683_Rally_Bumper_Front",
                Pipes = new[] { new Vector3(0.12f, 0.3f, -1.76f) },
            },
            // The buggies (plan "## Buggy"). Baja Bug: "Off Road 4X4 racer with 4 different skins" by duanesmind (skin TXTR4).
            new Model
            {
                Kind = CarKind.Baja, Fbx = Art + "off-road-4x4-racer-with-4-different-skins/source/Baja Bug.fbx", Length = 4.0f, Yaw = 0f,
                Wheels = new[] { "L_Front_Wheel", "R_Front_Wheel", "L_Back_Wheel", "R_Back_Wheel" },
                Body = r => r.name == "Baja Bug" || r.name.EndsWith("_Door") || r.name.EndsWith("_Fender"),
                Pipes = new[] { new Vector3(0f, 0.55f, -1.95f) },
                Textures = m => WireByName(m, Art + "off-road-4x4-racer-with-4-different-skins/textures/", new Dictionary<string, (string, string)>
                {
                    { "Exterior_Material", ("1K_Exterior_TXTR4.jpeg", null) }, { "Interior_Material", ("1K_Interior_TXTR4.jpeg", null) },
                    { "Tyre_Material", ("1K_Wheel-TXTR.jpeg", "2K_Wheel_NM.jpeg") }, { "Wheel_Rim_Material", ("1K_Wheel-TXTR.jpeg", "2K_Wheel_NM.jpeg") },
                    { "Suspension_Material", ("1K_Suspension-TXTR.jpeg", null) }, { "Engine_Material", ("1K_Engine_TXTR.jpeg", null) },
                    { "Floor_Material1", ("1K_Floor_TXTR.jpeg", null) }, { "Seat_blinn1", ("1K_Seat_TXTR.jpeg", "1K_Seat_NM.jpeg") },
                    { "Roll_Cage_Material", ("1K_Cage_Rack_Side_Pipes_TXTR.jpeg", null) }, { "Roof_Carier_Material", ("1K_Cage_Rack_Side_Pipes_TXTR.jpeg", null) },
                    { "Door_Fender_Material", ("1K_Door_Fender.jpeg", null) }, { "Lights_Pedal_Material", ("512K_Lights_Pedal_TXTR.png", null) },
                    { "Steering_Gear_Material", ("512K_Steering_Wheel_TXTR.png", null) }, { "Rev_Counter_Material", ("512k_Rev_TXTR.png", null) },
                    { "Speed_Counter_Material", ("512k_Speed_TXTR.png", null) },
                }),
            },
            // Buggy type 736 by Andre_rmntc (Skoda 736 beach buggy): all four wheels are one mesh.
            new Model
            {
                Kind = CarKind.Type736, Fbx = Art + "buggy-type-736/source/Buggy_Low_Sketchfab.fbx", Length = 3.3f, Yaw = 0f,
                Split = new[] { "wheels_Low" },
                Wheels = new[] { "wheels_Low_FL", "wheels_Low_FR", "wheels_Low_RL", "wheels_Low_RR" },
                Body = r => r.name == "cabin_Low",
                Pipes = new[] { new Vector3(0.3f, 0.3f, -1.75f) },
                Textures = m => WireByName(m, Art + "buggy-type-736/textures/", new Dictionary<string, (string, string)>
                {
                    { "Body", ("Body_Base_Color.png", "Body_Normal_OpenGL.png") }, { "Chasis", ("Chasis_Base_Color.png", "Chasis_Normal_OpenGL.png") },
                    { "interior", ("interior_Base_Color.png", "interior_Normal_OpenGL.png") }, { "Glass", ("Glass_Base_Color.png", null) },
                }),
            },
        };

        /// <summary>Every choosable car in start-screen order (the original 911 first): Garage.Choosable.</summary>
        static CarKind[] Order => Garage.Choosable;

        [MenuItem("Rally/Build Car Prefabs")]
        public static void Build() => BuildAll(true);

        /// <summary>Rebuild the cars, the bootstrap scene that lists them, and the card pictures (needs a display).</summary>
        public static void BuildSceneAndPictures() { BuildAll(true); SceneBuilder.Build(); Pictures(); }

        /// <summary>
        /// The garage prefabs in <see cref="Order"/>; with <paramref name="rebuild"/> false existing ones are kept (SceneBuilder).
        /// A car whose model file is not there is left out of the list (and so of the chooser).
        /// </summary>
        public static GameObject[] BuildAll(bool rebuild)
        {
            var list = new List<GameObject>();
            foreach (var kind in Order)
            {
                if (kind == CarKind.Porsche) { list.Add(AssetDatabase.LoadAssetAtPath<GameObject>(PorschePrefab)); continue; }
                var m = Models.First(x => x.Kind == kind);
                var existing = AssetDatabase.LoadAssetAtPath<GameObject>(PrefabPath(kind));
                if (existing != null && !rebuild) { list.Add(existing); continue; }
                if (!File.Exists(m.Fbx)) { Debug.Log($"CarGarageBuilder {kind}: no model file {m.Fbx}, left out of the garage"); continue; }
                list.Add(BuildCar(m));
            }
            AssetDatabase.SaveAssets();
            CompressTextures();
            return list.ToArray();
        }

        /// <summary>
        /// Every texture a new car's materials use (Settings/Car/KIND) at most 1024² and crunch-compressed: the 2K/4K sources
        /// nearly tripled the web build's data file. The original 911's textures are left as they were.
        /// <c>-executeMethod Rally.Editor.CarGarageBuilder.CompressTextures</c>
        /// </summary>
        public static void CompressTextures()
        {
            int changed = 0;
            foreach (var def in Models)
            {
                if (!AssetDatabase.IsValidFolder(Folder(def.Kind))) continue;
                foreach (var guid in AssetDatabase.FindAssets("t:Material", new[] { Folder(def.Kind) }))
                {
                    var m = AssetDatabase.LoadAssetAtPath<Material>(AssetDatabase.GUIDToAssetPath(guid));
                    foreach (var id in m.GetTexturePropertyNameIDs())
                    {
                        var tex = m.GetTexture(id);
                        string path = tex != null ? AssetDatabase.GetAssetPath(tex) : null;
                        if (path == null || !path.StartsWith(Art) || !(AssetImporter.GetAtPath(path) is TextureImporter ti)) continue;
                        if (ti.maxTextureSize <= 1024 && ti.crunchedCompression) continue;
                        ti.maxTextureSize = Math.Min(ti.maxTextureSize, 1024);
                        ti.crunchedCompression = true; ti.compressionQuality = 50;
                        ti.SaveAndReimport();
                        changed++;
                    }
                }
            }
            Debug.Log($"CarGarageBuilder: {changed} car texture(s) set to ≤ 1024² crunched");
        }

        static GameObject BuildCar(Model def)
        {
            var spec = CarSpec.For(def.Kind);
            var importer = AssetImporter.GetAtPath(def.Fbx) as ModelImporter;
            if (importer == null) throw new Exception("Car FBX missing: " + def.Fbx);
            if (!importer.isReadable || importer.importCameras || importer.importLights || importer.materialImportMode != ModelImporterMaterialImportMode.ImportViaMaterialDescription)
            {
                importer.isReadable = true;                                  // the wheel split and the body bake read the vertices
                importer.importCameras = false; importer.importLights = false;  // the Volvo file carries its own camera and lamp
                importer.materialImportMode = ModelImporterMaterialImportMode.ImportViaMaterialDescription;
                importer.SaveAndReimport();
            }
            EnsureFolder(Folder(def.Kind));
            foreach (var old in AssetDatabase.FindAssets("t:Mesh", new[] { Folder(def.Kind) })) AssetDatabase.DeleteAsset(AssetDatabase.GUIDToAssetPath(old));

            var root = new GameObject("Car_" + def.Kind) { layer = LayerMask.NameToLayer("Car") };
            var model = (GameObject)PrefabUtility.InstantiatePrefab(AssetDatabase.LoadAssetAtPath<GameObject>(def.Fbx));
            PrefabUtility.UnpackPrefabInstance(model, PrefabUnpackMode.Completely, InteractionMode.AutomatedAction);
            model.name = "Model";
            foreach (var r in model.GetComponentsInChildren<Renderer>(true).Where(def.Drop).ToArray()) UnityEngine.Object.DestroyImmediate(r.gameObject);
            foreach (var c in model.GetComponentsInChildren<Camera>(true)) UnityEngine.Object.DestroyImmediate(c);
            foreach (var l in model.GetComponentsInChildren<Light>(true)) UnityEngine.Object.DestroyImmediate(l);
            model.transform.SetParent(root.transform, false);
            model.transform.localRotation = Quaternion.Euler(0f, def.Yaw, 0f) * model.transform.localRotation;
            var all = Bounds(model);
            float factor = def.Length / all.size.z;
            model.transform.localScale *= factor;
            model.transform.localPosition -= Bounds(model).center;

            foreach (var name in def.Split) SplitQuadrants(Find(model, name), root.transform, model.transform, def.Kind);

            // Wheels → axle geometry, then the model moved so the front axle sits at FrontAxle, the wheel centres at their radius.
            var wheels = (def.Wheels.Length == 4 ? def.Wheels.Select(n => Find(model, n)) : AutoWheels(model)).OrderByDescending(r => r.bounds.center.z).ToList();
            var front = wheels.Take(2).OrderBy(r => r.bounds.center.x).ToList();
            var rear = wheels.Skip(2).OrderBy(r => r.bounds.center.x).ToList();
            wheels = new List<Renderer> { front[0], front[1], rear[0], rear[1] };
            float zF = (front[0].bounds.center.z + front[1].bounds.center.z) * 0.5f, zR = (rear[0].bounds.center.z + rear[1].bounds.center.z) * 0.5f;
            float track = (front[1].bounds.center.x - front[0].bounds.center.x + rear[1].bounds.center.x - rear[0].bounds.center.x) * 0.5f;
            float radius = wheels.Average(r => Mathf.Max(r.bounds.size.y, r.bounds.size.z)) * 0.5f;
            float midX = wheels.Average(r => r.bounds.center.x), midY = wheels.Average(r => r.bounds.center.y);
            float wheelbase = zF - zR;
            model.transform.localPosition += new Vector3(-midX, spec.WheelRadius - midY, spec.FrontAxle - zF);
            var body = Bounds(model, r => !wheels.Contains(r) && !IsNearWheel(r, wheels, radius));
            var sb = new StringBuilder($"CarGarageBuilder {def.Kind}: scale ×{factor:F4}, measured wheelbase {wheelbase:F3} m, track {track:F3} m, wheel radius {radius:F3} m"
                + $" (front {front.Average(r => r.bounds.size.y) * 0.5f:F3}, rear {rear.Average(r => r.bounds.size.y) * 0.5f:F3});"
                + $" body {body.size.x:F2} × {body.size.y:F2} × {body.size.z:F2} m, centre z {body.center.z:F3}, top {body.max.y:F3}, bottom {body.min.y:F3}"
                + $"\n  spec: wheelbase {spec.Wheelbase:F3}, track {spec.Track:F3}, radius {spec.WheelRadius:F3}, front axle {spec.FrontAxle:F3}, body {spec.Body}, body z {spec.BodyZ:F3}");
            if (Mathf.Abs(wheelbase - spec.Wheelbase) > 0.03f || Mathf.Abs(track - spec.Track) > 0.03f || Mathf.Abs(radius - spec.WheelRadius) > 0.03f)
                sb.Append("\n  WARNING: the CarSpec geometry does not match the model; copy the measured numbers into CarSpec");
            Debug.Log(sb.ToString());

            // The paint panels in car space, one mesh: dents and scratches land where the car was hit.
            var candidates = model.GetComponentsInChildren<Renderer>(true).Where(r => r is MeshRenderer && !wheels.Contains(r)).ToList();
            var bodyParts = def.Body != null ? candidates.Where(def.Body).ToList() : candidates.OrderByDescending(r => r.bounds.size.sqrMagnitude).Take(1).ToList();
            var bodyRenderer = BakeBody(bodyParts, root.transform, def.Kind);

            foreach (var r in root.GetComponentsInChildren<Renderer>(true)) r.sharedMaterials = r.sharedMaterials.Select(m => CarMaterial(m, def)).ToArray();

            var pivots = new Transform[4]; var spins = new Transform[4];
            string[] names = { "WheelFL", "WheelFR", "WheelRL", "WheelRR" };
            var others = model.GetComponentsInChildren<Renderer>(true).Where(r => !wheels.Contains(r)).ToList();
            for (int i = 0; i < 4; i++)
            {
                var w = CarSim.WheelOffset(spec, i);
                var pivot = new GameObject(names[i]).transform; pivot.SetParent(root.transform, false);
                var spin = new GameObject("Spin").transform; spin.SetParent(pivot, false);
                var wheel = wheels[i];
                var centre = wheel.bounds.center;
                pivot.position = centre;
                // Rims, discs, bolts and calipers around this wheel go with it; calipers and hubs steer but do not spin.
                foreach (var r in others.Where(r => r != null && Vector3.Distance(r.bounds.center, centre) < radius * 0.6f && r.bounds.size.magnitude < radius * 3.2f).ToList())
                {
                    string n = r.name.ToLowerInvariant();
                    bool still = n.Contains("caliper") || n.Contains("hub") || n.Contains("brake");
                    r.transform.SetParent(still ? pivot : spin, true);
                    others.Remove(r);
                }
                wheel.transform.SetParent(spin, true);
                pivot.localPosition = new Vector3(w.x, spec.WheelRadius, w.y);
                pivots[i] = pivot; spins[i] = spin;
            }
            foreach (var t in root.GetComponentsInChildren<Transform>(true)) t.gameObject.layer = root.layer;

            var rb = root.AddComponent<Rigidbody>(); rb.isKinematic = true; rb.useGravity = false;
            var box = root.AddComponent<BoxCollider>();
            box.size = spec.BodySize; box.center = new Vector3(0f, spec.BodySize.y * 0.5f + 0.1f, spec.BodyZ);
            var ctl = root.AddComponent<CarController>();
            ctl.Kind = def.Kind; ctl.WheelPivots = pivots; ctl.WheelSpins = spins;
            var dmg = root.AddComponent<CarDamageVisual>();
            dmg.Body = bodyRenderer;
            var fx = root.AddComponent<CarEffects>(); fx.DamageVisual = dmg;
            root.AddComponent<CarAudio>();
            string path = PrefabPath(def.Kind);
            Debug.Log($"CarGarageBuilder {def.Kind}: saving {path} (body '{(bodyRenderer ? bodyRenderer.name : "none")}' from {bodyParts.Count} part(s), {root.GetComponentsInChildren<Renderer>(true).Length} renderers)");
            PrefabUtility.SaveAsPrefabAsset(root, path);
            UnityEngine.Object.DestroyImmediate(root);
            CarExhaustSetup.Apply(path, def.Pipes);
            return AssetDatabase.LoadAssetAtPath<GameObject>(path);
        }

        /// <summary>The four biggest parts named like a wheel (wheel / tyre / tire / rim), for a model listed without wheel names.</summary>
        static IEnumerable<Renderer> AutoWheels(GameObject model)
        {
            string[] keys = { "wheel", "tyre", "tire", "rim" };
            var found = model.GetComponentsInChildren<Renderer>(true).Where(r => keys.Any(k => r.name.ToLowerInvariant().Contains(k)))
                .OrderByDescending(r => r.bounds.size.sqrMagnitude).Take(4).ToList();
            if (found.Count != 4) throw new Exception($"CarGarageBuilder: found {found.Count} wheel parts by name in {model.name}; list them in Model.Wheels");
            return found;
        }

        static bool IsNearWheel(Renderer r, List<Renderer> wheels, float radius)
            => wheels.Any(w => Vector3.Distance(r.bounds.center, w.bounds.center) < radius * 0.6f && r.bounds.size.magnitude < radius * 3.2f);

        static Renderer Find(GameObject model, string name)
        {
            var r = model.GetComponentsInChildren<Renderer>(true).FirstOrDefault(x => x.name == name);
            if (r == null) throw new Exception($"CarGarageBuilder: no renderer '{name}' in {model.name}");
            return r;
        }

        static Bounds Bounds(GameObject go, Func<Renderer, bool> filter = null)
        {
            var rs = go.GetComponentsInChildren<Renderer>(true).Where(r => filter == null || filter(r)).ToArray();
            var b = rs[0].bounds;
            foreach (var r in rs) b.Encapsulate(r.bounds);
            return b;
        }

        /// <summary>Positions, normals and tangents of a renderer's mesh in <paramref name="space"/>'s frame.</summary>
        static (Vector3[] v, Vector3[] n, Vector4[] t) InSpace(MeshRenderer r, Transform space)
        {
            var mesh = r.GetComponent<MeshFilter>().sharedMesh;
            var m = space.worldToLocalMatrix * r.transform.localToWorldMatrix;
            var nm = m.inverse.transpose;
            var v = mesh.vertices.Select(p => m.MultiplyPoint3x4(p)).ToArray();
            var n = mesh.normals.Select(p => nm.MultiplyVector(p).normalized).ToArray();
            var t = mesh.tangents.Select(p => { var d = m.MultiplyVector(new Vector3(p.x, p.y, p.z)).normalized; return new Vector4(d.x, d.y, d.z, p.w); }).ToArray();
            return (v, n, t);
        }

        /// <summary>
        /// A mesh that holds four wheels split into one mesh per quadrant (by triangle centroid about the mesh's own centre),
        /// in <paramref name="parent"/>'s frame, saved as assets; the new renderers are named NAME_FL / _FR / _RL / _RR.
        /// </summary>
        static void SplitQuadrants(Renderer src, Transform root, Transform parent, CarKind kind)
        {
            var mr = (MeshRenderer)src;
            var mesh = mr.GetComponent<MeshFilter>().sharedMesh;
            var (v, n, t) = InSpace(mr, root);
            var uv = mesh.uv;
            var centre = mr.bounds.center;   // root sits at the origin while building: world = root space
            string[] suffix = { "FL", "FR", "RL", "RR" };
            for (int q = 0; q < 4; q++)
            {
                var map = new Dictionary<int, int>();
                var verts = new List<Vector3>(); var norms = new List<Vector3>(); var tans = new List<Vector4>(); var uvs = new List<Vector2>();
                var subs = new List<List<int>>();
                for (int s = 0; s < mesh.subMeshCount; s++)
                {
                    var tris = mesh.GetTriangles(s);
                    var keep = new List<int>();
                    for (int i = 0; i < tris.Length; i += 3)
                    {
                        var c = (v[tris[i]] + v[tris[i + 1]] + v[tris[i + 2]]) / 3f;
                        int quad = (c.z > centre.z ? 0 : 2) + (c.x > centre.x ? 1 : 0);
                        if (quad != q) continue;
                        for (int k = 0; k < 3; k++)
                        {
                            int o = tris[i + k];
                            if (!map.TryGetValue(o, out int idx))
                            {
                                idx = verts.Count; map[o] = idx;
                                verts.Add(v[o]); if (n.Length > 0) norms.Add(n[o]); if (t.Length > 0) tans.Add(t[o]); if (uv.Length > 0) uvs.Add(uv[o]);
                            }
                            keep.Add(idx);
                        }
                    }
                    subs.Add(keep);
                }
                var part = new Mesh { name = $"{src.name}_{suffix[q]}", indexFormat = verts.Count > 65000 ? IndexFormat.UInt32 : IndexFormat.UInt16 };
                part.SetVertices(verts); if (norms.Count > 0) part.SetNormals(norms); if (tans.Count > 0) part.SetTangents(tans); if (uvs.Count > 0) part.SetUVs(0, uvs);
                part.subMeshCount = subs.Count;
                for (int s = 0; s < subs.Count; s++) part.SetTriangles(subs[s], s);
                part.RecalculateBounds();
                AssetDatabase.CreateAsset(part, $"{Folder(kind)}/{part.name}.asset");
                var go = new GameObject(part.name);
                go.transform.SetParent(root, false);
                go.AddComponent<MeshFilter>().sharedMesh = part;
                go.AddComponent<MeshRenderer>().sharedMaterials = mr.sharedMaterials;
                go.transform.SetParent(parent, true);
            }
            UnityEngine.Object.DestroyImmediate(src.gameObject);
        }

        /// <summary>
        /// The paint panels merged into one mesh in car space (one sub-mesh per material), as the root's child "Body"; the
        /// parts' own renderers are removed (their children stay where they were). CarDamageVisual dents this mesh.
        /// </summary>
        static Renderer BakeBody(List<Renderer> parts, Transform root, CarKind kind)
        {
            if (parts.Count == 0) return null;
            var verts = new List<Vector3>(); var norms = new List<Vector3>(); var tans = new List<Vector4>(); var uvs = new List<Vector2>();
            var byMat = new Dictionary<Material, List<int>>();
            foreach (MeshRenderer r in parts)
            {
                var mesh = r.GetComponent<MeshFilter>().sharedMesh;
                var (v, n, t) = InSpace(r, root);
                int b = verts.Count;
                verts.AddRange(v);
                norms.AddRange(n.Length == v.Length ? n : new Vector3[v.Length]);
                tans.AddRange(t.Length == v.Length ? t : new Vector4[v.Length]);
                var uv = mesh.uv; uvs.AddRange(uv.Length == v.Length ? uv : new Vector2[v.Length]);
                for (int s = 0; s < mesh.subMeshCount; s++)
                {
                    var mat = r.sharedMaterials[Mathf.Min(s, r.sharedMaterials.Length - 1)];
                    if (!byMat.TryGetValue(mat, out var list)) byMat[mat] = list = new List<int>();
                    list.AddRange(mesh.GetTriangles(s).Select(i => i + b));
                }
            }
            var baked = new Mesh { name = "Body", indexFormat = verts.Count > 65000 ? IndexFormat.UInt32 : IndexFormat.UInt16 };
            baked.SetVertices(verts); baked.SetNormals(norms); baked.SetTangents(tans); baked.SetUVs(0, uvs);
            var mats = byMat.Keys.ToArray();
            baked.subMeshCount = mats.Length;
            for (int s = 0; s < mats.Length; s++) baked.SetTriangles(byMat[mats[s]], s);
            baked.RecalculateBounds();
            AssetDatabase.CreateAsset(baked, $"{Folder(kind)}/Body.asset");
            var go = new GameObject("Body");
            go.transform.SetParent(root, false);
            go.AddComponent<MeshFilter>().sharedMesh = baked;
            var mr = go.AddComponent<MeshRenderer>();
            mr.sharedMaterials = mats;
            foreach (var r in parts)
            {
                UnityEngine.Object.DestroyImmediate(r.GetComponent<MeshFilter>());
                UnityEngine.Object.DestroyImmediate(r);
            }
            return mr;
        }

        /// <summary>An editable copy of an imported material under Settings/Car/KIND (URP Lit), with the model's texture hook.</summary>
        static Material CarMaterial(Material src, Model def)
        {
            if (src == null) return null;
            if (AssetDatabase.GetAssetPath(src).StartsWith(SettingsDir)) return src;
            string path = $"{Folder(def.Kind)}/{Safe(src.name)}.mat";
            var m = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (m != null) return m;
            m = new Material(src) { name = src.name };
            if (m.shader == null || !m.shader.name.Contains("Universal Render Pipeline")) m.shader = Shader.Find("Universal Render Pipeline/Lit");
            def.Textures(m);
            AssetDatabase.CreateAsset(m, path);
            return m;
        }

        static string Safe(string s) => string.Concat(s.Select(c => Path.GetInvalidFileNameChars().Contains(c) ? '_' : c));

        /// <summary>A BaseColor / Normal / Metallic set named PREFIX + suffix: base map, normal map (importer switched), metallic.</summary>
        static void Wire(Material m, string prefix)
        {
            Texture2D Tex(string s) => AssetDatabase.LoadAssetAtPath<Texture2D>(prefix + s + ".png");
            var bc = Tex("BaseColor");
            if (bc == null) return;
            m.SetTexture("_BaseMap", bc); m.SetColor("_BaseColor", Color.white);
            var n = AssetImporter.GetAtPath(prefix + "Normal.png") as TextureImporter;
            if (n != null)
            {
                if (n.textureType != TextureImporterType.NormalMap) { n.textureType = TextureImporterType.NormalMap; n.SaveAndReimport(); }
                m.SetTexture("_BumpMap", Tex("Normal")); m.EnableKeyword("_NORMALMAP");
            }
            m.SetFloat("_Smoothness", 0.45f); m.SetFloat("_Metallic", 0.1f);
        }

        /// <summary>
        /// Base map and optional normal map per material name, from a model's texture folder; every texture used is imported at
        /// most 1024² (the 4K sources would bloat the web build). Glass becomes transparent.
        /// </summary>
        static void WireByName(Material m, string dir, Dictionary<string, (string baseMap, string normal)> map)
        {
            if (m.name.ToLowerInvariant().Contains("glass")) Transparent(m, 0.35f);
            if (!map.TryGetValue(m.name, out var e)) return;
            Texture2D Load(string file, bool normal)
            {
                string path = dir + file;
                if (AssetImporter.GetAtPath(path) is TextureImporter ti && (ti.maxTextureSize > 1024 || normal != (ti.textureType == TextureImporterType.NormalMap)))
                {
                    ti.maxTextureSize = Math.Min(ti.maxTextureSize, 1024);
                    ti.textureType = normal ? TextureImporterType.NormalMap : TextureImporterType.Default;
                    ti.SaveAndReimport();
                }
                return AssetDatabase.LoadAssetAtPath<Texture2D>(path);
            }
            var bc = Load(e.baseMap, false);
            if (bc != null) { m.SetTexture("_BaseMap", bc); m.SetColor("_BaseColor", m.name.ToLowerInvariant().Contains("glass") ? new Color(1f, 1f, 1f, 0.35f) : Color.white); }
            if (e.normal != null) { var n = Load(e.normal, true); if (n != null) { m.SetTexture("_BumpMap", n); m.EnableKeyword("_NORMALMAP"); } }
            m.SetFloat("_Smoothness", 0.4f); m.SetFloat("_Metallic", 0.05f);
        }

        /// <summary>URP Lit switched to alpha-blended transparency with the given alpha.</summary>
        static void Transparent(Material m, float alpha)
        {
            m.SetFloat("_Surface", 1f); m.SetFloat("_Blend", 0f);
            m.SetFloat("_SrcBlend", (float)BlendMode.SrcAlpha); m.SetFloat("_DstBlend", (float)BlendMode.OneMinusSrcAlpha); m.SetFloat("_ZWrite", 0f);
            m.EnableKeyword("_SURFACE_TYPE_TRANSPARENT"); m.renderQueue = (int)RenderQueue.Transparent;
            var c = m.HasProperty("_BaseColor") ? m.GetColor("_BaseColor") : Color.white; c.a = alpha; m.SetColor("_BaseColor", c);
        }

        static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;
            EnsureFolder(Path.GetDirectoryName(path).Replace('\\', '/'));
            AssetDatabase.CreateFolder(Path.GetDirectoryName(path).Replace('\\', '/'), Path.GetFileName(path));
        }

        // ---- checks ------------------------------------------------------------------------------------------

        /// <summary>Logs, per built car, the rearmost low vertices of every part (where the tailpipes are) and its renderers.</summary>
        [MenuItem("Rally/Probe Car Prefabs")]
        public static void Probe()
        {
            foreach (var kind in Order)
            {
                var root = AssetDatabase.LoadAssetAtPath<GameObject>(PrefabPath(kind));
                if (root == null) continue;
                var sb = new StringBuilder($"CarGarageBuilder probe {kind}:\n");
                var pts = new List<(Vector3 p, string part)>();
                foreach (var mf in root.GetComponentsInChildren<MeshFilter>(true))
                {
                    var m = root.transform.worldToLocalMatrix * mf.transform.localToWorldMatrix;
                    foreach (var v in mf.sharedMesh.vertices) pts.Add((m.MultiplyPoint3x4(v), mf.name));
                }
                float minZ = pts.Min(p => p.p.z);
                sb.Append($"  z {minZ:0.00}..{pts.Max(p => p.p.z):0.00}, y {pts.Min(p => p.p.y):0.00}..{pts.Max(p => p.p.y):0.00}, x {pts.Min(p => p.p.x):0.00}..{pts.Max(p => p.p.x):0.00}\n");
                foreach (var g in pts.Where(p => p.p.z < minZ + 0.35f && p.p.y < 0.6f).GroupBy(p => p.part).OrderBy(g => g.Min(p => p.p.z)))
                    sb.Append($"  rear-low part {g.Key}: {g.Count()} verts, z {g.Min(p => p.p.z):0.000}, x {g.Min(p => p.p.x):0.00}..{g.Max(p => p.p.x):0.00}, y {g.Min(p => p.p.y):0.00}..{g.Max(p => p.p.y):0.00}\n");
                Debug.Log(sb.ToString());
            }
        }

        /// <summary>
        /// A new model file before it gets a builder entry: every node and renderer with its bounds and materials, to pick
        /// the wheels, the paint panels, the nose direction and the scale. <c>-executeMethod Rally.Editor.CarGarageBuilder.ProbeFbx -probeFbx PATH</c>
        /// </summary>
        public static void ProbeFbx()
        {
            var args = Environment.GetCommandLineArgs();
            int a = Array.IndexOf(args, "-probeFbx");
            string path = args[a + 1];
            var go = (GameObject)PrefabUtility.InstantiatePrefab(AssetDatabase.LoadAssetAtPath<GameObject>(path));
            var sb = new StringBuilder($"CarGarageBuilder probe file {path}\n");
            foreach (var t in go.GetComponentsInChildren<Transform>(true))
                sb.Append($"  node {t.name} (parent {(t.parent ? t.parent.name : "-")}) pos {t.localPosition:F3} rot {t.localEulerAngles:F0} scale {t.localScale:F3}\n");
            var all = Bounds(go);
            sb.Append($"  ALL c {all.center:F3} s {all.size:F3}\n");
            foreach (var r in go.GetComponentsInChildren<Renderer>(true))
                sb.Append($"  R {r.name} c {r.bounds.center:F3} s {r.bounds.size:F3} mats [{string.Join(", ", r.sharedMaterials.Select(m => m ? m.name + (m.mainTexture ? "(" + m.mainTexture.name + ")" : "") : "null"))}]\n");
            UnityEngine.Object.DestroyImmediate(go);
            Debug.Log(sb.ToString());
        }

        /// <summary>Start-screen card per car (Resources/UI/Cars/KIND.png, 3/4 front view); with -carShots DIR also check views.</summary>
        [MenuItem("Rally/Render Car Pictures")]
        public static void Pictures()
        {
            var args = Environment.GetCommandLineArgs();
            int i = Array.IndexOf(args, "-carShots");
            string shots = i >= 0 && i + 1 < args.Length ? args[i + 1] : null;
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var sun = new GameObject("Sun").AddComponent<Light>();
            sun.type = LightType.Directional; sun.intensity = 2.2f; sun.shadows = LightShadows.Soft;
            sun.transform.rotation = Quaternion.Euler(40f, 150f, 0f);
            RenderSettings.ambientMode = AmbientMode.Flat; RenderSettings.ambientLight = new Color(0.55f, 0.58f, 0.62f);
            RenderSettings.skybox = null;
            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.transform.localScale = Vector3.one * 3f;
            var gm = new Material(Shader.Find("Universal Render Pipeline/Lit")); gm.SetColor("_BaseColor", new Color(0.32f, 0.33f, 0.3f)); gm.SetFloat("_Smoothness", 0.1f);
            ground.GetComponent<MeshRenderer>().sharedMaterial = gm;
            var cam = new GameObject("Camera").AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor; cam.backgroundColor = new Color(0.16f, 0.18f, 0.2f, 1f);
            cam.fieldOfView = 30f; cam.nearClipPlane = 0.1f; cam.farClipPlane = 100f;
            EnsureFolder(PicturesDir);
            if (shots != null) Directory.CreateDirectory(shots);
            foreach (var kind in Order)
            {
                var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(PrefabPath(kind));
                if (prefab == null) continue;
                var car = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
                foreach (var l in car.GetComponentsInChildren<Light>(true)) l.enabled = false;
                var spec = CarSpec.For(kind);
                var c = new Vector3(0f, 0.6f, spec.BodyZ);
                float len = spec.BodySize.z;
                for (int pass = 0; pass < 2; pass++)   // the first render after loading a car comes out unlit (shaders, shadows warming up)
                    Shot(cam, c, Quaternion.Euler(14f, 215f, 0f), len * 1.75f, 384, 216, $"{PicturesDir}/{kind}.png", true);
                if (shots != null)
                {
                    Shot(cam, c, Quaternion.Euler(0f, 270f, 0f), len * 2.2f, 960, 480, $"{shots}/{kind}_side.png", false);
                    Shot(cam, c, Quaternion.Euler(89f, 0f, 0f), len * 2.4f, 960, 480, $"{shots}/{kind}_top.png", false);
                    Shot(cam, c, Quaternion.Euler(8f, 180f, 0f), len * 1.6f, 640, 480, $"{shots}/{kind}_front.png", false);
                    Shot(cam, c, Quaternion.Euler(12f, 25f, 0f), len * 1.9f, 640, 480, $"{shots}/{kind}_rear.png", false);
                }
                UnityEngine.Object.DestroyImmediate(car);
            }
            AssetDatabase.Refresh();
            foreach (var kind in Order)
                if (AssetImporter.GetAtPath($"{PicturesDir}/{kind}.png") is TextureImporter ti && (ti.mipmapEnabled || ti.textureType != TextureImporterType.Default || ti.npotScale != TextureImporterNPOTScale.None))
                { ti.textureType = TextureImporterType.Default; ti.mipmapEnabled = false; ti.npotScale = TextureImporterNPOTScale.None; ti.SaveAndReimport(); }
            Debug.Log("CarGarageBuilder: pictures saved to " + PicturesDir + (shots != null ? " and " + shots : ""));
        }

        static void Shot(Camera cam, Vector3 target, Quaternion look, float distance, int w, int h, string path, bool asset)
        {
            cam.transform.rotation = look;
            cam.transform.position = target - look * Vector3.forward * distance;
            var rt = new RenderTexture(w, h, 24, RenderTextureFormat.ARGB32) { antiAliasing = 8 };
            cam.targetTexture = rt;
            cam.aspect = (float)w / h;
            cam.Render();
            var prev = RenderTexture.active;
            RenderTexture.active = rt;
            var tex = new Texture2D(w, h, TextureFormat.RGB24, false);
            tex.ReadPixels(new Rect(0, 0, w, h), 0, 0); tex.Apply();
            RenderTexture.active = prev;
            cam.targetTexture = null;
            File.WriteAllBytes(path, tex.EncodeToPNG());
            UnityEngine.Object.DestroyImmediate(tex); rt.Release(); UnityEngine.Object.DestroyImmediate(rt);
        }
    }
}
