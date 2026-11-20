using System;
using System.Collections.Generic;
using System.IO;
using Rally.World;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;
using Random = System.Random;

namespace Rally.Editor
{
    /// <summary>
    /// Generates the five tree prototypes of <see cref="VegetationSetSO"/> in code — Norway spruce, Scots pine, birch,
    /// mountain birch, shrub — with three mesh LODs, a baked billboard impostor and procedural bark / foliage textures,
    /// so every byte of the forest is ours (no downloaded assets) and rebuilds identically from fixed seeds.
    ///
    /// Meshes are bark tubes plus alpha-cut foliage cards in ONE submesh (Rally/Tree tells them apart by the vertex
    /// colour: r ambient occlusion, g branch flex, b 1 = foliage, a lower → upper bark), so a (species, LOD) bucket is
    /// still one indirect or instanced draw. Foliage normals point out of the crown so a crown shades as a volume.
    /// Budgets (triangles): LOD 0 ≤ ~3000, LOD 1 ~800, LOD 2 ~200, then the impostor quad (2).
    /// The impostor renders LOD 0 from <see cref="Frames"/> azimuths into a 4 × 2 atlas (albedo × AO and frame-space
    /// normals); without a graphics device (batch mode with -nographics) it falls back to two crossed quads of LOD 2's
    /// foliage, which the renderer draws like any mesh LOD.
    /// </summary>
    public static class TreeBuilder
    {
        public const int Frames = 8, FrameCols = 4, FrameRows = 2, FrameW = 128, FrameH = 256, Tex = 512;

        /// <summary>Species description: mesh height at scale 1, trunk radius, LOD switch distances.</summary>
        sealed class Spec
        {
            public string Name, File;
            public float Height, TrunkRadius;
            public Vector4 Lods;                 // LOD0 → 1, 1 → 2, 2 → impostor, max distance
            public Color Foliage = Color.white, Bark = Color.white, Translucency;
            public Func<int, MeshBuilder> Build;
            public string Textures;              // whose textures (mountain birch reuses birch; the shrub has its own leaves on birch bark)
        }

        public static void Build(VegetationSetSO set, string dir, bool force)
        {
            EnsureFolder(dir);
            var specs = new[]
            {
                new Spec { Name = "spruce", File = "spruce", Height = 22f, TrunkRadius = 0.3f, Lods = new Vector4(70, 170, 360, 1000), Textures = "spruce", Build = Spruce,
                           Translucency = new Color(0.35f, 0.45f, 0.15f) },
                new Spec { Name = "pine", File = "pine", Height = 19f, TrunkRadius = 0.3f, Lods = new Vector4(70, 170, 360, 1000), Textures = "pine", Build = Pine,
                           Translucency = new Color(0.45f, 0.55f, 0.2f) },
                new Spec { Name = "birch", File = "birch", Height = 15f, TrunkRadius = 0.18f, Lods = new Vector4(60, 150, 320, 900), Textures = "birch", Build = l => Birch(l, 101), Foliage = new Color(0.95f, 0.98f, 0.9f),
                           Translucency = new Color(0.65f, 0.8f, 0.25f) },
                new Spec { Name = "mountain birch", File = "mountain_birch", Height = 6f, TrunkRadius = 0.1f, Lods = new Vector4(45, 110, 240, 700), Textures = "birch", Build = MountainBirch,
                           Foliage = new Color(0.97f, 1f, 0.9f), Translucency = new Color(0.6f, 0.75f, 0.25f) },
                new Spec { Name = "shrub", File = "shrub", Height = 1.4f, TrunkRadius = 0.05f, Lods = new Vector4(25, 60, 140, 350), Textures = "shrub", Build = Shrub,
                           Foliage = new Color(0.62f, 0.7f, 0.55f), Bark = new Color(0.7f, 0.6f, 0.5f), Translucency = new Color(0.4f, 0.5f, 0.2f) },
            };
            var textures = new Dictionary<string, (Texture2D leaf, Texture2D leafN, Texture2D bark, Texture2D barkN)>();
            foreach (var name in new[] { "spruce", "pine", "birch" }) textures[name] = Textures(name, dir, force);
            var (shrubLeaf, shrubLeafN) = Foliage("shrub", dir, force);
            textures["shrub"] = (shrubLeaf, shrubLeafN, textures["birch"].bark, textures["birch"].barkN);
            if (set.Prototypes == null || set.Prototypes.Length != VegetationSetSO.SpeciesCount) set.Prototypes = new VegetationSetSO.Prototype[VegetationSetSO.SpeciesCount];
            bool canBake = SystemInfo.graphicsDeviceType != GraphicsDeviceType.Null && Shader.Find("Hidden/Rally/TreeBake") != null;
            for (int i = 0; i < specs.Length; i++)
            {
                var sp = specs[i];
                var p = set.Prototypes[i] ?? (set.Prototypes[i] = new VegetationSetSO.Prototype());
                p.Name = sp.Name; p.Height = sp.Height; p.TrunkRadius = sp.TrunkRadius; p.LodDistances = sp.Lods;
                var tx = textures[sp.Textures];
                p.Material = TreeMaterial($"{dir}/{sp.File}.mat", sp, tx, false, null, null);
                p.Lods = new Mesh[3];
                var info = new List<string>();
                for (int l = 0; l < 3; l++)
                {
                    var mb = sp.Build(l);
                    p.Lods[l] = SaveMesh($"{dir}/{sp.File}_lod{l}.asset", mb.ToMesh(sp.File + "_lod" + l));
                    info.Add($"LOD{l} {mb.Triangles} tris");
                }
                if (canBake)
                {
                    var (alb, nrm, w) = BakeImpostor(p.Lods[0], p.Material, sp, dir);
                    p.Billboard = SaveMesh($"{dir}/{sp.File}_impostor.asset", Quad(w, w * FrameH / FrameW, sp.File + "_impostor"));
                    p.BillboardMaterial = TreeMaterial($"{dir}/{sp.File}_billboard.mat", sp, tx, true, alb, nrm);
                    info.Add("impostor baked");
                }
                else
                {
                    p.Billboard = SaveMesh($"{dir}/{sp.File}_impostor.asset", CrossedQuads(sp).ToMesh(sp.File + "_impostor"));
                    p.BillboardMaterial = p.Material;
                    info.Add("impostor: crossed quads (no graphics device to bake)");
                }
                Debug.Log($"TreeBuilder: {sp.Name}: {string.Join(", ", info)}");
            }
            EditorUtility.SetDirty(set);
        }

        // ---- materials and assets ---------------------------------------------------------------------------------

        static Material TreeMaterial(string path, Spec sp, (Texture2D leaf, Texture2D leafN, Texture2D bark, Texture2D barkN) tx, bool billboard, Texture2D imp, Texture2D impN)
        {
            var shader = Shader.Find("Rally/Tree");
            var m = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (m == null) { m = new Material(shader); AssetDatabase.CreateAsset(m, path); }
            m.shader = shader;
            m.SetTexture("_BaseMap", tx.leaf); m.SetTexture("_LeafNormal", tx.leafN);
            m.SetTexture("_BarkMap", tx.bark); m.SetTexture("_BarkNormal", tx.barkN);
            m.SetColor("_Color", sp.Foliage); m.SetColor("_BarkColor", sp.Bark);
            m.SetColor("_TranslucencyColor", sp.Translucency);
            m.SetFloat("_TreeHeight", sp.Height);
            m.SetFloat("_Wind", sp.Height > 10 ? 0.35f : 0.12f);
            m.SetFloat("_Flutter", sp.Name.Contains("birch") ? 0.09f : 0.04f);
            m.SetFloat("_Cutoff", 0.4f);
            m.SetFloat("_Billboard", billboard ? 1 : 0);
            if (billboard)
            {
                m.SetTexture("_ImpostorMap", imp); m.SetTexture("_ImpostorNormal", impN);
                m.SetVector("_ImpostorFrames", new Vector4(FrameCols, FrameRows, Frames, 0));
                m.SetColor("_Color", Color.white);
            }
            m.enableInstancing = true;
            EditorUtility.SetDirty(m);
            return m;
        }

        static Mesh SaveMesh(string path, Mesh mesh)
        {
            var existing = AssetDatabase.LoadAssetAtPath<Mesh>(path);
            if (existing != null)
            {
                EditorUtility.CopySerialized(mesh, existing);
                existing.name = Path.GetFileNameWithoutExtension(path);
                UnityEngine.Object.DestroyImmediate(mesh);
                EditorUtility.SetDirty(existing);
                return existing;
            }
            mesh.name = Path.GetFileNameWithoutExtension(path);
            AssetDatabase.CreateAsset(mesh, path);
            return mesh;
        }

        static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;
            AssetDatabase.CreateFolder(Path.GetDirectoryName(path).Replace('\\', '/'), Path.GetFileName(path));
        }

        /// <summary>The impostor quad: x −w/2..w/2, y 0..h, uv 0..1 (the shader picks the atlas frame).</summary>
        static Mesh Quad(float w, float h, string name)
        {
            var mesh = new Mesh { name = name };
            mesh.SetVertices(new[] { new Vector3(-w / 2, 0, 0), new Vector3(w / 2, 0, 0), new Vector3(w / 2, h, 0), new Vector3(-w / 2, h, 0) });
            mesh.SetUVs(0, new[] { new Vector2(0, 0), new Vector2(1, 0), new Vector2(1, 1), new Vector2(0, 1) });
            mesh.SetNormals(new[] { Vector3.forward, Vector3.forward, Vector3.forward, Vector3.forward });
            mesh.SetTangents(new[] { new Vector4(1, 0, 0, 1), new Vector4(1, 0, 0, 1), new Vector4(1, 0, 0, 1), new Vector4(1, 0, 0, 1) });
            mesh.SetColors(new[] { Color.white, Color.white, Color.white, Color.white });
            mesh.SetTriangles(new[] { 0, 2, 1, 0, 3, 2 }, 0);
            mesh.RecalculateBounds();
            return mesh;
        }

        /// <summary>Fallback impostor: two crossed vertical foliage cards the size of the crown.</summary>
        static MeshBuilder CrossedQuads(Spec sp)
        {
            var mb = new MeshBuilder();
            float w = sp.Height * 0.4f;
            var c = new Vector3(0, sp.Height * 0.55f, 0);
            foreach (var d in new[] { Vector3.right, Vector3.forward })
                mb.Card(new Vector3(0, 0.1f * sp.Height, 0) - d * 0, Vector3.up, Vector3.Cross(Vector3.up, d), sp.Height * 0.9f, w * 2, 0, 1, new Rect(0, 0, 1, 0.5f), p => (p - c).normalized, 1f, 0.2f);
            return mb;
        }

        // ---- impostor bake ----------------------------------------------------------------------------------------

        static (Texture2D albedo, Texture2D normals, float width) BakeImpostor(Mesh mesh, Material treeMat, Spec sp, string dir)
        {
            var b = mesh.bounds;
            float radius = Mathf.Max(Mathf.Max(Mathf.Abs(b.min.x), Mathf.Abs(b.max.x)), Mathf.Max(Mathf.Abs(b.min.z), Mathf.Abs(b.max.z)));
            float height = b.max.y;
            float halfW = Mathf.Max(radius * 1.04f, height * 0.25f * 1.02f);   // frame aspect 1:2
            float halfH = halfW * FrameH / FrameW;
            var bake = new Material(Shader.Find("Hidden/Rally/TreeBake"));
            bake.SetTexture("_BaseMap", treeMat.GetTexture("_BaseMap"));
            bake.SetTexture("_BarkMap", treeMat.GetTexture("_BarkMap"));
            bake.SetColor("_Color", treeMat.GetColor("_Color"));
            bake.SetColor("_BarkColor", treeMat.GetColor("_BarkColor"));
            int W = FrameW * FrameCols, H = FrameH * FrameRows;
            var albedo = new Color[W * H];
            var normals = new Color[W * H];
            var rt = new RenderTexture(FrameW, FrameH, 24, RenderTextureFormat.ARGB32, RenderTextureReadWrite.Linear);
            var read = new Texture2D(FrameW, FrameH, TextureFormat.RGBA32, false, true);
            var cmd = new CommandBuffer { name = "TreeBake" };
            var camGo = new GameObject("TreeBakeCamera") { hideFlags = HideFlags.HideAndDontSave };
            var cam = camGo.AddComponent<Camera>();
            cam.enabled = false;
            cam.orthographic = true; cam.orthographicSize = halfH; cam.aspect = halfW / halfH;
            cam.nearClipPlane = 0.1f; cam.farClipPlane = 2 * (radius + 5);
            for (int k = 0; k < Frames; k++)
            {
                float a = k / (float)Frames * Mathf.PI * 2;
                var d = new Vector3(Mathf.Sin(a), 0, Mathf.Cos(a));
                var right = Vector3.Cross(Vector3.up, d);          // the shader's billboard right (= the bake camera's left: mirrored below)
                camGo.transform.SetPositionAndRotation(new Vector3(0, halfH, 0) + d * (radius + 5), Quaternion.LookRotation(-d, Vector3.up));
                bake.SetVector("_BakeRight", right);
                bake.SetVector("_BakeDir", d);
                for (int pass = 0; pass < 2; pass++)
                {
                    cmd.Clear();
                    cmd.SetRenderTarget(rt);
                    cmd.ClearRenderTarget(true, true, new Color(0, 0, 0, 0));
                    cmd.SetViewProjectionMatrices(cam.worldToCameraMatrix, cam.projectionMatrix);
                    cmd.DrawMesh(mesh, Matrix4x4.identity, bake, 0, pass);
                    Graphics.ExecuteCommandBuffer(cmd);
                    var prev = RenderTexture.active;
                    RenderTexture.active = rt;
                    read.ReadPixels(new Rect(0, 0, FrameW, FrameH), 0, 0);
                    read.Apply(false);
                    RenderTexture.active = prev;
                    var px = read.GetPixels();
                    int x0 = (k % FrameCols) * FrameW, y0 = (FrameRows - 1 - k / FrameCols) * FrameH;   // frame 0 top-left
                    var target = pass == 0 ? albedo : normals;
                    for (int y = 0; y < FrameH; y++)
                        for (int x = 0; x < FrameW; x++)
                            target[(y0 + y) * W + x0 + x] = px[y * FrameW + (FrameW - 1 - x)];   // camera right = −billboard right
                }
            }
            cmd.Release();
            UnityEngine.Object.DestroyImmediate(camGo);
            rt.Release();
            UnityEngine.Object.DestroyImmediate(rt); UnityEngine.Object.DestroyImmediate(read); UnityEngine.Object.DestroyImmediate(bake);
            for (int i = 0; i < normals.Length; i++) normals[i].a = albedo[i].a;
            ProcTex.Dilate(albedo, W, H, 6);
            ProcTex.Dilate(normals, W, H, 6);
            for (int i = 0; i < normals.Length; i++) normals[i].a = 1;
            var alb = ProcTex.SavePng($"{dir}/{sp.File}_impostor.png", albedo, W, H, imp => ProcTex.Colour(imp, 512, cutout: true, clamp: true));
            // Frame-space normals are data, not a tangent-space normal map: linear, uncompressed-ish, no NormalMap packing.
            var nrm = ProcTex.SavePng($"{dir}/{sp.File}_impostor_n.png", normals, W, H, imp => { ProcTex.Colour(imp, 512, clamp: true); imp.sRGBTexture = false; });
            return (alb, nrm, halfW * 2);
        }

        // ---- textures ---------------------------------------------------------------------------------------------

        static (Texture2D, Texture2D, Texture2D, Texture2D) Textures(string species, string dir, bool force)
        {
            string lp = $"{dir}/{species}_foliage.png", lnp = $"{dir}/{species}_foliage_n.png", bp = $"{dir}/{species}_bark.png", bnp = $"{dir}/{species}_bark_n.png";
            if (!force)
            {
                var a = AssetDatabase.LoadAssetAtPath<Texture2D>(lp); var b = AssetDatabase.LoadAssetAtPath<Texture2D>(lnp);
                var c = AssetDatabase.LoadAssetAtPath<Texture2D>(bp); var d = AssetDatabase.LoadAssetAtPath<Texture2D>(bnp);
                if (a && b && c && d) return (a, b, c, d);
            }
            var (leafTex, leafNTex) = Foliage(species, dir, true);
            var bark = BarkTextures.Make(species, out var barkH);
            var barkN = new Color[Tex * Tex];
            for (int half = 0; half < 2; half++)   // each half tiles on its own
            {
                var h = new float[256 * Tex];
                for (int y = 0; y < Tex; y++) for (int x = 0; x < 256; x++) h[y * 256 + x] = barkH[y * Tex + half * 256 + x];
                var n = ProcTex.NormalsFromHeight(h, 256, Tex, 4f);
                for (int y = 0; y < Tex; y++) for (int x = 0; x < 256; x++) barkN[y * Tex + half * 256 + x] = n[y * 256 + x];
            }
            return (leafTex, leafNTex,
                    ProcTex.SavePng(bp, bark, Tex, Tex, imp => ProcTex.Colour(imp, Tex)),
                    ProcTex.SavePng(bnp, barkN, Tex, Tex, imp => ProcTex.Normal(imp, Tex)));
        }

        /// <summary>The foliage atlas and its normal map; the shrub's is the birch sprays as they were before 2026-11-20 (same seed).</summary>
        static (Texture2D, Texture2D) Foliage(string species, string dir, bool force)
        {
            string lp = $"{dir}/{species}_foliage.png", lnp = $"{dir}/{species}_foliage_n.png";
            if (!force)
            {
                var a = AssetDatabase.LoadAssetAtPath<Texture2D>(lp); var b = AssetDatabase.LoadAssetAtPath<Texture2D>(lnp);
                if (a && b) return (a, b);
            }
            var leaf = new Canvas(Tex, Tex);
            var rnd = new Random((species == "shrub" ? "birch" : species).GetHashCode() & 0x7fffffff);
            switch (species)
            {
                case "spruce": FoliageAtlas.Spruce(leaf, rnd); break;
                case "pine": FoliageAtlas.Pine(leaf, rnd); break;
                case "shrub": FoliageAtlas.Shrub(leaf, rnd); break;
                default: FoliageAtlas.Birch(leaf, rnd); break;
            }
            var leafN = ProcTex.NormalsFromHeight(leaf.Height, Tex, Tex, 3f, wrap: false);
            ProcTex.Dilate(leaf.Px, Tex, Tex, 8);
            return (ProcTex.SavePng(lp, leaf.Px, Tex, Tex, imp => ProcTex.Colour(imp, Tex, cutout: true, clamp: true)),
                    ProcTex.SavePng(lnp, leafN, Tex, Tex, imp => ProcTex.Normal(imp, Tex, clamp: true)));
        }

        // ---- species ----------------------------------------------------------------------------------------------

        static float Smooth(float a, float b, float x) => Mathf.SmoothStep(0, 1, Mathf.InverseLerp(a, b, x));
        static float R(Random r, float a, float b) => a + (float)r.NextDouble() * (b - a);
        static Vector3 Horizontal(float az) => new Vector3(Mathf.Sin(az), 0, Mathf.Cos(az));
        const float Golden = 2.39996f;

        /// <summary>
        /// Norway spruce (gran): straight dark trunk, a dense conical crown to near the ground of drooping branch whorls,
        /// each branch a horizontal frond card plus a hanging "curtain" card (the comb-like hanging branchlets), tips
        /// upturned at the top, lengths jittered so the silhouette is not a perfect cone. 22 m at scale 1.
        /// </summary>
        static MeshBuilder Spruce(int lod)
        {
            var r = new Random(11);
            var mb = new MeshBuilder();
            const float H = 22f, crownBase = 1.0f;
            var trunk = new List<Vector3>(); var radii = new List<float>();
            int segs = lod == 0 ? 18 : lod == 1 ? 6 : 2;
            for (int i = 0; i <= segs; i++)
            {
                float y = H * i / segs;
                trunk.Add(new Vector3(Mathf.Sin(y * 0.37f) * 0.05f, y, Mathf.Cos(y * 0.29f) * 0.05f));
                radii.Add(0.30f * Mathf.Pow(1 - y / H, 0.9f) + 0.015f + 0.09f * Mathf.Exp(-y / 0.4f));
            }
            mb.Tube(trunk, radii, lod == 0 ? 9 : lod == 1 ? 6 : 4, y => Smooth(H * 0.45f, H * 0.75f, y), y => 0.35f + 0.65f * Smooth(0, H * 0.6f, y), y => 0.15f * y / H);
            Vector3 Axis(float y) => new Vector3(Mathf.Sin(y * 0.37f) * 0.05f, y, Mathf.Cos(y * 0.29f) * 0.05f);
            if (lod == 2)
            {
                // Skirts: tiers of six hanging cards, the cone's silhouette in ~150 triangles.
                for (float y = crownBase + 1.2f; y < H - 1.5f; y += 2.9f)
                {
                    float t = (y - crownBase) / (H - crownBase), L = 0.6f + 3.4f * (1 - t);
                    for (int k = 0; k < 6; k++)
                    {
                        float az = k * Mathf.PI / 3 + y * 1.3f;
                        var dir = (Horizontal(az) + Vector3.down * 0.45f).normalized;
                        var side = Vector3.Cross(Vector3.up, Horizontal(az)).normalized;
                        mb.Card(Axis(y + 0.8f), dir, side, L * 1.25f, 2.6f, 1, -0.35f, CellSpruce(k & 1), p => SpruceNormal(p, H), 0.75f, 0.5f);
                    }
                }
                mb.Card(Axis(H - 2.6f), Vector3.up, Vector3.right, 2.8f, 1.4f, 0, 0, CellSpruce(0), p => SpruceNormal(p, H), 1f, 0.4f);
                mb.Card(Axis(H - 2.6f), Vector3.up, Vector3.forward, 2.8f, 1.4f, 0, 0, CellSpruce(1), p => SpruceNormal(p, H), 1f, 0.4f);
                return mb;
            }
            float spacing = lod == 0 ? 0.8f : 1.45f;
            int perWhorl = lod == 0 ? 5 : 4;
            float az0 = 0;
            for (float y = crownBase; y < H - 1.0f; y += spacing * R(r, 0.85f, 1.15f))
            {
                float t = (y - crownBase) / (H - crownBase);
                int n = perWhorl + (lod == 0 && r.NextDouble() < 0.4 ? 1 : 0);
                az0 += Golden;
                for (int k = 0; k < n; k++)
                {
                    if (r.NextDouble() < 0.07 && t < 0.8f) continue;                     // a missing branch: irregular silhouette
                    float az = az0 + k * Mathf.PI * 2 / n + R(r, -0.3f, 0.3f);
                    float L = (0.45f + 3.7f * Mathf.Pow(1 - t, 0.95f)) * R(r, 0.8f, 1.2f);
                    float elev = Mathf.Lerp(-28f, 22f, t * t) + R(r, -8, 8);
                    var h = Horizontal(az);
                    var dir = (h * Mathf.Cos(elev * Mathf.Deg2Rad) + Vector3.up * Mathf.Sin(elev * Mathf.Deg2Rad)).normalized;
                    var side = Vector3.Cross(Vector3.up, h).normalized;
                    var start = Axis(y) + h * 0.05f;
                    if (lod == 0 && L > 1.4f)
                        mb.Tube(new List<Vector3> { start, start + dir * L * 0.5f, start + dir * L * 0.85f + Vector3.down * 0.05f * L }, new List<float> { 0.03f + 0.012f * L, 0.02f, 0.008f }, 3,
                            _ => 0.6f, _ => 0.45f, _ => 0.2f + 0.4f * t);
                    float bend = Mathf.Lerp(-0.22f, -0.05f, t);                               // fronds droop, more at the bottom
                    float sizeK = lod == 0 ? 1f : 1.3f;
                    float ao = 0.5f + 0.5f * t;
                    // Flat frond (seen from above and from the side as a dark layer) and the hanging curtain under it.
                    var flatSide = Quaternion.AngleAxis(R(r, -15, 15), dir) * side;
                    mb.Card(start, dir, flatSide, L * 1.05f, (0.45f * L + 0.35f) * sizeK, lod == 0 ? 2 : 1, bend, CellSpruce(r.Next(2)), p => SpruceNormal(p, H), ao, 0.85f);
                    var hang = (Quaternion.AngleAxis(65f + R(r, -10, 10), dir) * side).normalized;
                    mb.Card(start + Vector3.down * 0.05f, dir, hang, L, (0.38f * L + 0.35f) * sizeK * (lod == 0 ? 1f : 1.25f), lod == 0 ? 2 : 1, bend * 1.2f, CellSpruce(r.Next(2)), p => SpruceNormal(p, H), ao * 0.9f, 0.85f);
                }
            }
            // Leader: two crossed upright cards at the top.
            mb.Card(Axis(H - 1.6f), Vector3.up, Vector3.right, 1.8f, 0.9f, 0, 0, CellSpruce(0), p => SpruceNormal(p, H), 1f, 0.5f);
            mb.Card(Axis(H - 1.6f), Vector3.up, Vector3.forward, 1.8f, 0.9f, 0, 0, CellSpruce(1), p => SpruceNormal(p, H), 1f, 0.5f);
            return mb;
        }

        static Rect CellSpruce(int k) => new Rect(0, k * 0.5f, 1, 0.5f);
        /// <summary>Out of the cone: horizontal from the axis, tilted up as the cone does.</summary>
        static Vector3 SpruceNormal(Vector3 p, float H) => (new Vector3(p.x, 0, p.z).normalized + Vector3.up * 0.45f).normalized;

        /// <summary>
        /// Scots pine (furu): tall straight trunk, grey-brown plated below and orange-red above, no branches on the lower
        /// 62 %, a flattish irregular umbrella of upswept branches ending in tufts of needle clumps. 19 m at scale 1.
        /// </summary>
        static MeshBuilder Pine(int lod)
        {
            var r = new Random(23);
            var mb = new MeshBuilder();
            const float H = 19f, crownBase = 0.62f * H;
            Vector3 Axis(float y) => new Vector3(Mathf.Sin(y * 0.21f + 0.5f) * 0.22f * (y / H), y, Mathf.Sin(y * 0.17f + 2f) * 0.18f * (y / H));
            var trunk = new List<Vector3>(); var radii = new List<float>();
            int segs = lod == 0 ? 16 : lod == 1 ? 6 : 3;
            for (int i = 0; i <= segs; i++)
            {
                float y = H * 0.97f * i / segs;
                trunk.Add(Axis(y));
                radii.Add(0.30f * Mathf.Pow(1 - y / H, 0.75f) + 0.03f + 0.08f * Mathf.Exp(-y / 0.5f));
            }
            mb.Tube(trunk, radii, lod == 0 ? 9 : lod == 1 ? 6 : 4, y => Smooth(H * 0.35f, H * 0.6f, y), y => 0.4f + 0.6f * Smooth(0, H * 0.5f, y), y => 0.12f * y / H);
            var crownC = Axis(H * 0.82f);
            Func<Vector3, Vector3> nrm = p => { var d = p - crownC; d.y *= 1.8f; return (d.normalized + Vector3.up * 0.6f).normalized; };
            if (lod == 0)
                for (int k = 0; k < 4; k++)   // dead stubs on the bare stem
                {
                    float y = R(r, 3f, crownBase - 1f), az = R(r, 0, 6.28f);
                    var s = Axis(y);
                    mb.Tube(new List<Vector3> { s, s + (Horizontal(az) + Vector3.down * 0.2f).normalized * R(r, 0.3f, 0.7f) }, new List<float> { 0.03f, 0.01f }, 3, _ => 0.3f, _ => 0.4f, _ => 0f);
                }
            int branches = lod == 0 ? 11 : lod == 1 ? 8 : 5;
            float az0 = R(r, 0, 6.28f);
            for (int b = 0; b < branches; b++)
            {
                float t = (b + 0.5f) / branches, y = Mathf.Lerp(crownBase, H * 0.93f, t);
                az0 += Golden + R(r, -0.4f, 0.4f);
                var h = Horizontal(az0);
                float L = (1.6f + 3.4f * Mathf.Pow(1 - t, 0.7f)) * R(r, 0.75f, 1.2f);
                float elev = Mathf.Lerp(18f, 50f, t) + R(r, -8, 8);
                var dir = (h * Mathf.Cos(elev * Mathf.Deg2Rad) + Vector3.up * Mathf.Sin(elev * Mathf.Deg2Rad)).normalized;
                var s = Axis(y);
                var p1 = s + dir * L * 0.55f;
                var p2 = p1 + (h + Vector3.up * 0.35f).normalized * L * 0.45f;   // the tip turns up: the umbrella
                var path = new List<Vector3> { s, p1, p2 };
                float bk = lod == 0 ? 1f : 0.6f;   // thinner branches far away: bark must not outweigh the needles in a few pixels
                mb.Tube(path, new List<float> { (0.07f + 0.02f * L) * bk, 0.045f * bk, 0.02f * bk }, lod == 0 ? 5 : lod == 1 ? 4 : 3, _ => 0.5f, _ => 0.55f, _ => 0.4f);
                var tips = new List<(Vector3 at, Vector3 dir)>();
                int clumps = lod == 0 ? 7 : lod == 1 ? 4 : 2;
                for (int c = 0; c < clumps; c++)
                {
                    float u = Mathf.Lerp(0.45f, 1f, c / (float)Mathf.Max(1, clumps - 1));
                    var at = u < 0.55f ? Vector3.Lerp(s, p1, u / 0.55f) : Vector3.Lerp(p1, p2, (u - 0.55f) / 0.45f);
                    tips.Add((at, (dir + Vector3.up * 0.4f + RandomDir(r) * 0.4f).normalized));
                }
                if (lod == 0)
                    for (int sb = 0; sb < 3; sb++)   // side branches, each with its own tufts
                    {
                        var at = Vector3.Lerp(s, p1, R(r, 0.5f, 1f));
                        var sd = (Quaternion.AngleAxis(R(r, -70, 70), Vector3.up) * h + Vector3.up * R(r, 0.2f, 0.6f)).normalized;
                        float sl = L * R(r, 0.35f, 0.55f);
                        var end = at + sd * sl;
                        mb.Tube(new List<Vector3> { at, end }, new List<float> { 0.03f, 0.012f }, 3, _ => 0.5f, _ => 0.6f, _ => 0.6f);
                        tips.Add((Vector3.Lerp(at, end, 0.55f), (sd + Vector3.up * 0.5f).normalized));
                        tips.Add((end, (sd + Vector3.up * 0.3f + RandomDir(r) * 0.3f).normalized));
                    }
                foreach (var (at, td) in tips) PineClump(mb, r, at, td, lod, nrm, 0.55f + 0.45f * t);
            }
            for (int k = 0; k < (lod == 2 ? 1 : 3); k++) PineClump(mb, r, Axis(H * 0.96f), (Vector3.up + RandomDir(r) * 0.4f).normalized, lod, nrm, 1f);
            return mb;
        }

        /// <summary>A pine needle tuft: crossed cards from the twig outward, bigger and fewer at lower LODs.</summary>
        static void PineClump(MeshBuilder mb, Random r, Vector3 at, Vector3 dir, int lod, Func<Vector3, Vector3> nrm, float ao)
        {
            int cards = lod == 0 ? 3 : 2;
            float size = (lod == 0 ? 1.5f : lod == 1 ? 2.4f : 3.8f) * R(r, 0.8f, 1.2f);
            float spin = R(r, 0, 180);
            for (int c = 0; c < cards; c++)
            {
                var side = Quaternion.AngleAxis(spin + c * 180f / cards, dir) * Perp(dir);
                int cell = r.Next(4);
                mb.Card(at - dir * size * 0.15f, dir, side, size, size * 0.95f, 0, 0, new Rect((cell & 1) * 0.5f, (cell >> 1) * 0.5f, 0.5f, 0.5f), nrm, ao, 0.9f);
            }
        }

        /// <summary>
        /// Birch (bjørk): slender white trunk with a black base, leaning a little, an oval crown of ascending branches
        /// that arch over, each with side branches, all hung with drooping twig sprays (Betula pendula / pubescens) that
        /// overlap into a full crown; a few sprays in the crown's core so it does not read as sparse arms. 15 m at scale 1.
        /// </summary>
        static MeshBuilder Birch(int lod, int seed)
        {
            var r = new Random(seed);
            var mb = new MeshBuilder();
            const float H = 15f;
            float leanAz = R(r, 0, 6.28f), lean = R(r, 0.03f, 0.08f);
            Vector3 Axis(float y) => Horizontal(leanAz) * (lean * y + Mathf.Sin(y * 0.4f) * 0.12f) + Vector3.up * y;
            var trunk = new List<Vector3>(); var radii = new List<float>();
            int segs = lod == 0 ? 14 : lod == 1 ? 5 : 3;
            for (int i = 0; i <= segs; i++)
            {
                float y = H * 0.95f * i / segs;
                trunk.Add(Axis(y));
                radii.Add(0.16f * Mathf.Pow(1 - y / H, 0.9f) + 0.02f + 0.05f * Mathf.Exp(-y / 0.4f));
            }
            mb.Tube(trunk, radii, lod == 0 ? 9 : lod == 1 ? 6 : 4, y => Smooth(0.5f, 2.4f, y), y => 0.5f + 0.5f * Smooth(0, H * 0.4f, y), y => 0.2f * y / H);
            var crownC = Axis(H * 0.65f);
            Func<Vector3, Vector3> nrm = p => { var d = p - crownC; d.y *= 0.8f; return (d.normalized + Vector3.up * 0.25f).normalized; };
            int branches = lod == 0 ? 16 : lod == 1 ? 10 : 7;
            int twigs = lod == 0 ? 8 : lod == 1 ? 6 : 4;
            float size = lod == 0 ? 1.25f : lod == 1 ? 1.8f : 2.8f;
            float az0 = R(r, 0, 6.28f);
            // A drooping twig spray hanging from `at`, outward along `h`; LOD 0 and 1 add a second card across it.
            void Spray(Vector3 at, Vector3 h, float t, float k)
            {
                var hangDir = (h * R(r, 0.2f, 0.55f) + Vector3.down * 1f + RandomDir(r) * 0.25f).normalized;   // streamers: hang more steeply, long and narrow
                var side = Vector3.Cross(hangDir, h).normalized;
                if (side.sqrMagnitude < 0.01f) side = Perp(hangDir);
                float len = R(r, 1.5f, 2.4f) * size * k, wid = R(r, 0.65f, 0.9f) * size * k;
                int cell = r.Next(2);
                mb.Card(at, hangDir, side, len, wid, lod == 2 ? 0 : 1, 0.15f, CellBirch(cell), nrm, 0.7f + 0.3f * t, 1f);
                mb.Card(at, hangDir, (Quaternion.AngleAxis(R(r, 70, 100), hangDir) * side).normalized, len * 0.9f, wid * 0.85f, lod == 2 ? 0 : 1, 0.15f, CellBirch(1 - cell), nrm, 0.65f + 0.3f * t, 1f);
            }
            for (int b = 0; b < branches; b++)
            {
                float t = (b + 0.5f) / branches, y = Mathf.Lerp(H * 0.33f, H * 0.91f, t);
                az0 += Golden + R(r, -0.3f, 0.3f);
                var h = Horizontal(az0);
                float L = (2.2f + 2.8f * Mathf.Sin(Mathf.PI * (0.25f + 0.6f * (1 - t)))) * R(r, 0.8f, 1.15f) * (1 - 0.4f * t);
                float elev = Mathf.Lerp(45f, 70f, t) + R(r, -8, 8);
                var dir = (h * Mathf.Cos(elev * Mathf.Deg2Rad) + Vector3.up * Mathf.Sin(elev * Mathf.Deg2Rad)).normalized;
                var s = Axis(y);
                var p1 = s + dir * L * 0.55f;
                var p2 = p1 + (h * 1f + Vector3.down * 0.15f).normalized * L * 0.5f;   // arching over
                float bk = lod == 0 ? 1f : 0.7f;
                mb.Tube(new List<Vector3> { s, p1, p2 }, new List<float> { (0.045f + 0.01f * L) * bk, 0.025f * bk, 0.01f }, lod == 0 ? 4 : 3, _ => 1f, _ => 0.6f, _ => 0.5f);
                Vector3 On(float u) => u < 0.55f ? Vector3.Lerp(s, p1, u / 0.55f) : Vector3.Lerp(p1, p2, Mathf.Clamp01((u - 0.55f) / 0.45f));
                for (int k = 0; k < twigs; k++)
                {
                    float u = Mathf.Lerp(0.25f, 1f, k / (float)Mathf.Max(1, twigs - 1)) + R(r, -0.05f, 0.05f);
                    Spray(On(u), h, t, 1f);
                }
                // Side branches (LOD 0, 1): out of the arch at ±30–60°, drooping, each with its own sprays.
                int sides = lod == 0 ? 2 : lod == 1 ? 1 : 0;
                for (int k = 0; k < sides; k++)
                {
                    var at = On(R(r, 0.35f, 0.75f));
                    var sh = Quaternion.AngleAxis((k == 0 ? 1 : -1) * R(r, 30, 60), Vector3.up) * h;
                    float sl = L * R(r, 0.35f, 0.5f);
                    var end = at + (sh + Vector3.down * R(r, 0.1f, 0.4f)).normalized * sl;
                    if (lod == 0) mb.Tube(new List<Vector3> { at, end }, new List<float> { 0.018f, 0.007f }, 3, _ => 1f, _ => 0.65f, _ => 0.6f);
                    int n = lod == 0 ? 3 : 2;
                    for (int q = 0; q < n; q++) Spray(Vector3.Lerp(at, end, (q + 1f) / n), sh, t, 0.85f);
                }
            }
            // The crown's core: sprays on short shoots near the stem, so the crown is full from inside, not a few arms.
            int core = lod == 0 ? 10 : lod == 1 ? 5 : 3;
            for (int k = 0; k < core; k++)
            {
                float t = (k + 0.5f) / core, y = Mathf.Lerp(H * 0.42f, H * 0.85f, t);
                var h = Horizontal(az0 + k * Golden * 1.3f);
                Spray(Axis(y) + h * R(r, 0.4f, 1.2f) * (1.2f - 0.6f * t), h, t, 0.9f);
            }
            // Top of the crown: a few upright twig cards so it ends in fine twigs, not a branch stump.
            int top = lod == 0 ? 6 : lod == 1 ? 3 : 2;
            for (int k = 0; k < top; k++)
            {
                var d = (Vector3.up + RandomDir(r) * 0.6f).normalized;
                mb.Card(Axis(H * 0.88f), d, Perp(d), (lod == 2 ? 2.6f : 1.8f) * R(r, 0.8f, 1.1f), 1.1f * (lod == 2 ? 1.6f : 1f), 0, -0.1f, CellBirch(k & 1), nrm, 1f, 1f);
            }
            return mb;
        }

        static Rect CellBirch(int k) => new Rect(0, k * 0.5f, 1, 0.5f);

        /// <summary>
        /// Mountain birch (fjellbjørk): 3–4 twisted stems from one base, low and wide and bushy: each stem with short
        /// side branches, all set with the birch's drooping twig sprays, crossed so the bush is as full as the birch. 6 m.
        /// </summary>
        static MeshBuilder MountainBirch(int lod)
        {
            var r = new Random(37);
            var mb = new MeshBuilder();
            const float H = 6f;
            int stems = lod == 0 ? 4 : lod == 1 ? 3 : 2;
            var crownC = new Vector3(0, H * 0.65f, 0);
            Func<Vector3, Vector3> nrm = p => { var d = p - crownC; d.y *= 0.9f; return (d.normalized + Vector3.up * 0.3f).normalized; };
            float size = lod == 0 ? 1.3f : lod == 1 ? 1.8f : 2.7f;
            void Spray(Vector3 at, Vector3 o, float y, float h, float k, bool second)
            {
                var d = (o * R(r, 0.5f, 1f) + Vector3.down * R(r, 0.2f, 0.8f) + Vector3.up * (y > h * 0.8f ? 0.9f : 0)).normalized;
                var side = Vector3.Cross(d, o).sqrMagnitude > 0.01f ? Vector3.Cross(d, o).normalized : Perp(d);
                float len = R(r, 1.1f, 1.6f) * size * k, wid = R(r, 0.75f, 1.05f) * size * k;
                int cell = r.Next(2);
                mb.Card(at, d, side, len, wid, lod == 2 ? 0 : 1, 0.1f, CellBirch(cell), nrm, 0.6f + 0.4f * y / h, 1f);
                if (second) mb.Card(at, d, (Quaternion.AngleAxis(R(r, 70, 100), d) * side).normalized, len * 0.9f, wid * 0.85f, lod == 2 ? 0 : 1, 0.1f, CellBirch(1 - cell), nrm, 0.55f + 0.4f * y / h, 1f);
            }
            for (int s = 0; s < stems; s++)
            {
                float az = s * 6.28f / stems + R(r, -0.4f, 0.4f), tilt = R(r, 0.18f, 0.4f), ph = R(r, 0, 6.28f);
                float h = H * R(r, 0.75f, 1f);
                Vector3 P(float y) => Horizontal(az) * (tilt * y + Mathf.Sin(y * 1.3f + ph) * 0.18f) + Horizontal(az + 1.57f) * Mathf.Sin(y * 0.9f + ph) * 0.15f + Vector3.up * y;
                var pts = new List<Vector3>(); var rad = new List<float>();
                int segs = lod == 0 ? 7 : lod == 1 ? 4 : 2;
                for (int i = 0; i <= segs; i++) { float y = h * 0.9f * i / segs; pts.Add(P(y)); rad.Add(0.085f * (1 - 0.8f * y / h) + 0.01f); }
                mb.Tube(pts, rad, lod == 0 ? 6 : 4, y => Smooth(0.2f, 1.2f, y), y => 0.5f + 0.5f * Smooth(0, 3, y), y => 0.25f * y / H);
                int twigs = lod == 0 ? 14 : lod == 1 ? 8 : 5;
                for (int k = 0; k < twigs; k++)
                {
                    float y = Mathf.Lerp(h * 0.3f, h * 0.98f, k / (float)(twigs - 1));
                    Spray(P(y), Horizontal(az + R(r, -1.4f, 1.4f)), y, h, 1f, lod < 2 || (k & 1) == 0);
                }
                // Short side branches (LOD 0, 1): out and a little down, each ending in sprays — the bushy, wide shape.
                int sides = lod == 0 ? 3 : lod == 1 ? 2 : 0;
                for (int k = 0; k < sides; k++)
                {
                    float y = h * R(r, 0.35f, 0.75f);
                    var o = Horizontal(az + (k - (sides - 1) * 0.5f) * 1.3f + R(r, -0.3f, 0.3f));
                    var at = P(y);
                    var end = at + (o + Vector3.up * R(r, -0.1f, 0.35f)).normalized * R(r, 0.9f, 1.6f);
                    if (lod == 0) mb.Tube(new List<Vector3> { at, end }, new List<float> { 0.03f, 0.01f }, 3, _ => 1f, _ => 0.6f, _ => 0.4f);
                    Spray(Vector3.Lerp(at, end, 0.5f), o, y, h, 0.85f, true);
                    Spray(end, o, y, h, 0.9f, true);
                }
            }
            return mb;
        }

        /// <summary>Shrub above the tree line (dwarf birch / willow / juniper scrub): a low dome of leaf cards on a few twigs. 1.4 m.</summary>
        static MeshBuilder Shrub(int lod)
        {
            var r = new Random(41);
            var mb = new MeshBuilder();
            var c = new Vector3(0, 0.45f, 0);
            Func<Vector3, Vector3> nrm = p => (p - c * 0.6f).normalized;
            int cards = lod == 0 ? 22 : lod == 1 ? 10 : 5;
            if (lod == 0)
                for (int k = 0; k < 4; k++)
                {
                    var d = (Horizontal(k * 1.57f + 0.3f) * 0.6f + Vector3.up).normalized;
                    mb.Tube(new List<Vector3> { Vector3.zero, d * 0.9f }, new List<float> { 0.025f, 0.008f }, 3, _ => 0.3f, _ => 0.5f, _ => 0.3f);
                }
            for (int k = 0; k < cards; k++)
            {
                var o = Horizontal(k * Golden);
                var d = (o * R(r, 0.6f, 1f) + Vector3.up * R(r, 0.4f, 1f)).normalized;
                float size = (lod == 0 ? 0.75f : lod == 1 ? 1.0f : 1.4f) * R(r, 0.8f, 1.2f);
                mb.Card(new Vector3(0, R(r, 0.05f, 0.35f), 0) + o * 0.1f, d, Perp(d), size, size * 0.8f, 0, -0.1f, CellBirch(k & 1), nrm, 0.6f + 0.4f * d.y, 0.6f);
            }
            return mb;
        }

        static Vector3 RandomDir(Random r) => new Vector3(R(r, -1, 1), R(r, -1, 1), R(r, -1, 1)).normalized;
        static Vector3 Perp(Vector3 d) { var p = Vector3.Cross(d, Mathf.Abs(d.y) < 0.9f ? Vector3.up : Vector3.right); return p.normalized; }

        // ---- mesh assembly ----------------------------------------------------------------------------------------

        /// <summary>Vertices, colours and triangles of one LOD; tubes for bark, bent cards for foliage.</summary>
        public sealed class MeshBuilder
        {
            readonly List<Vector3> v = new List<Vector3>(), n = new List<Vector3>();
            readonly List<Vector4> tg = new List<Vector4>();
            readonly List<Vector2> uv = new List<Vector2>();
            readonly List<Color> col = new List<Color>();
            readonly List<int> tri = new List<int>();
            public int Triangles => tri.Count / 3;

            /// <summary>
            /// A bark tube along a polyline. u wraps around (repeats so a texel stays roughly square), v runs up in
            /// metres / tile; colour: r AO(y), g flex(y), b 0 (bark), a upper-bark blend(y).
            /// </summary>
            public void Tube(List<Vector3> pts, List<float> radii, int sides, Func<float, float> upper, Func<float, float> ao, Func<float, float> flex)
            {
                float circ = 2 * Mathf.PI * radii[0];
                int uRep = Mathf.Max(1, Mathf.RoundToInt(circ / 0.9f));
                float vTile = circ / uRep * 2f;            // the half-atlas is 1:2
                float len = 0;
                Vector3 prevSide = Vector3.zero;
                int baseIdx = v.Count;
                for (int i = 0; i < pts.Count; i++)
                {
                    if (i > 0) len += Vector3.Distance(pts[i], pts[i - 1]);
                    var dir = (i < pts.Count - 1 ? pts[i + 1] - pts[i] : pts[i] - pts[i - 1]).normalized;
                    if (i > 0 && i < pts.Count - 1) dir = ((pts[i + 1] - pts[i]).normalized + (pts[i] - pts[i - 1]).normalized).normalized;
                    var side = i == 0 ? Perp(dir) : Vector3.ProjectOnPlane(prevSide, dir).normalized;   // parallel transport: no twist
                    if (side.sqrMagnitude < 1e-4f) side = Perp(dir);
                    prevSide = side;
                    var other = Vector3.Cross(dir, side);
                    float y = pts[i].y;
                    for (int k = 0; k <= sides; k++)
                    {
                        float a = k / (float)sides * Mathf.PI * 2;
                        var radial = side * Mathf.Cos(a) + other * Mathf.Sin(a);
                        v.Add(pts[i] + radial * radii[i]);
                        n.Add(radial);
                        var t = Vector3.Cross(dir, radial).normalized;   // around the tube
                        tg.Add(new Vector4(t.x, t.y, t.z, 1));
                        uv.Add(new Vector2(k / (float)sides * uRep, len / vTile));
                        col.Add(new Color(ao(y), flex(y), 0, upper(y)));
                    }
                }
                int ring = sides + 1;
                for (int i = 0; i + 1 < pts.Count; i++)
                    for (int k = 0; k < sides; k++)
                    {
                        int a = baseIdx + i * ring + k, b = a + ring;
                        tri.Add(a); tri.Add(b); tri.Add(a + 1);
                        tri.Add(a + 1); tri.Add(b); tri.Add(b + 1);
                    }
            }

            /// <summary>
            /// A foliage card from <paramref name="at"/> along <paramref name="dir"/> (texture u: 0 at the twig base, 1 at
            /// the tip) and <paramref name="side"/> (v across, centred), in <paramref name="segments"/> + 1 pieces, each
            /// turned by <paramref name="bend"/> radians about the side axis (negative droops). Normal from
            /// <paramref name="normalOf"/> (out of the crown), AO and flex (more at the tip) in the colour, b = 1.
            /// </summary>
            public void Card(Vector3 at, Vector3 dir, Vector3 side, float length, float width, int segments, float bend, Rect cell, Func<Vector3, Vector3> normalOf, float ao, float flex)
            {
                int baseIdx = v.Count;
                side = side.normalized;
                var p = at; var d = dir.normalized;
                int pieces = segments + 1;
                float seg = length / pieces;
                for (int i = 0; i <= pieces; i++)
                {
                    float u = i / (float)pieces;
                    for (int s = 0; s < 2; s++)
                    {
                        var q = p + side * (s - 0.5f) * width * Mathf.Lerp(0.8f, 1f, u);
                        var nn = normalOf(q);
                        var t = Vector3.ProjectOnPlane(d, nn).normalized;
                        if (t.sqrMagnitude < 1e-4f) t = Perp(nn);
                        float w = Vector3.Dot(Vector3.Cross(nn, t), side) >= 0 ? 1 : -1;
                        v.Add(q); n.Add(nn); tg.Add(new Vector4(t.x, t.y, t.z, w));
                        uv.Add(new Vector2(cell.x + u * cell.width, cell.y + s * cell.height));
                        col.Add(new Color(Mathf.Lerp(ao * 0.75f, ao, u), flex * Mathf.Lerp(0.3f, 1f, u), 1, 0));
                    }
                    if (i < pieces)
                    {
                        p += d * seg;
                        var axis = Vector3.Cross(d, Vector3.up);
                        if (axis.sqrMagnitude > 1e-4f) d = Quaternion.AngleAxis(bend * Mathf.Rad2Deg, axis.normalized) * d;   // Unity: +angle about d × up lifts d
                    }
                }
                for (int i = 0; i < pieces; i++)
                {
                    int a = baseIdx + i * 2;
                    tri.Add(a); tri.Add(a + 2); tri.Add(a + 1);
                    tri.Add(a + 1); tri.Add(a + 2); tri.Add(a + 3);
                }
            }

            public Mesh ToMesh(string name)
            {
                var m = new Mesh { name = name };
                m.SetVertices(v); m.SetNormals(n); m.SetTangents(tg); m.SetUVs(0, uv); m.SetColors(col);
                m.SetTriangles(tri, 0);
                m.RecalculateBounds();
                return m;
            }
        }
    }
}
