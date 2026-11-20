using System.Collections.Generic;
using System.Linq;
using System.Text;
using Rally.Vehicle;
using UnityEditor;
using UnityEngine;

namespace Rally.Editor
{
    /// <summary>
    /// Puts the exhaust on the car prefab: a procedural puff texture, a Rally/Smoke material, one small particle system per
    /// tailpipe (children "ExhaustL/R" pointing backwards) and the <see cref="CarExhaust"/> component wired to them and to
    /// CarEffects.Exhaust (the upshift pop). The look itself (rates, sizes, colours) is set in code by CarExhaust.
    /// <c>Unity -batchmode -projectPath unity -executeMethod Rally.Editor.CarExhaustSetup.Run -quit</c>
    /// (<c>Probe</c> logs the rear-low vertex profile of the body that the pipe positions were read from).
    /// </summary>
    public static class CarExhaustSetup
    {
        const string Prefab = "Assets/_Rally/Prefabs/Car_Porsche911.prefab";
        const string Dir = "Assets/_Rally/Settings/Car";
        /// <summary>
        /// Tailpipe outlets in car space (x right, y up, z forward), read from the body mesh with <see cref="Probe"/>: the
        /// model's twin pipes are the rearmost vertices of the body (z −2.214), two tube rings at x ±0.326…0.382, y 0.38…0.44.
        /// </summary>
        public static readonly Vector3[] Pipes = { new Vector3(-0.354f, 0.41f, -2.23f), new Vector3(0.354f, 0.41f, -2.23f) };

        [MenuItem("Rally/Probe Car Tailpipes")]
        public static void Probe()
        {
            var root = AssetDatabase.LoadAssetAtPath<GameObject>(Prefab);
            var body = root.GetComponent<CarDamageVisual>().Body;
            var mesh = body.GetComponent<MeshFilter>().sharedMesh;
            var toCar = root.transform.worldToLocalMatrix * body.transform.localToWorldMatrix;
            var v = mesh.vertices.Select(p => toCar.MultiplyPoint3x4(p)).ToArray();
            float minZ = v.Min(p => p.z), maxZ = v.Max(p => p.z);
            var sb = new StringBuilder($"body z {minZ:0.000}..{maxZ:0.000}, x {v.Min(p => p.x):0.00}..{v.Max(p => p.x):0.00}\n");
            // Rear 40 cm, below 0.7 m: rearmost vertex per 4 cm x bin and the y range there.
            var bins = new SortedDictionary<int, (float z, float y0, float y1, int n)>();
            foreach (var p in v)
            {
                if (p.z > minZ + 0.4f || p.y > 0.7f) continue;
                int b = Mathf.FloorToInt(p.x / 0.04f);
                if (!bins.TryGetValue(b, out var e)) e = (9, 9, -9, 0);
                if (p.z < e.z - 0.01f) e = (p.z, p.y, p.y, e.n + 1);
                else if (p.z < e.z + 0.01f) e = (Mathf.Min(e.z, p.z), Mathf.Min(e.y0, p.y), Mathf.Max(e.y1, p.y), e.n + 1);
                else e.n++;
                bins[b] = e;
            }
            foreach (var kv in bins) sb.Append($"x {kv.Key * 0.04f:+0.00;-0.00}: rearmost z {kv.Value.z:0.000} (y {kv.Value.y0:0.00}..{kv.Value.y1:0.00}, {kv.Value.n} verts)\n");
            // Lowest rear vertices: y < 0.45 within 15 cm of the back.
            var low = v.Where(p => p.z < minZ + 0.15f && p.y < 0.45f).OrderBy(p => p.z).Take(40);
            foreach (var p in low) sb.Append($"low rear vertex {p.x:+0.000;-0.000} {p.y:0.000} {p.z:0.000}\n");
            Debug.Log("CarExhaustSetup probe:\n" + sb);
        }

        public static void Run() => Apply(Prefab, Pipes);

        /// <summary>The exhaust on any car prefab: one particle system per tailpipe (car space), the flash light, CarExhaust and CarEffects wired.</summary>
        public static void Apply(string prefab, Vector3[] pipes)
        {
            var tex = PuffTexture(Dir + "/ExhaustPuff.png");
            var mat = AssetDatabase.LoadAssetAtPath<Material>(Dir + "/ExhaustSmoke.mat");
            if (mat == null) { mat = new Material(Shader.Find("Rally/Smoke")); AssetDatabase.CreateAsset(mat, Dir + "/ExhaustSmoke.mat"); }
            mat.shader = Shader.Find("Rally/Smoke");
            mat.SetTexture("_MainTex", tex);
            mat.renderQueue = 3000;
            EditorUtility.SetDirty(mat);

            var root = PrefabUtility.LoadPrefabContents(prefab);
            try
            {
                if (!root.TryGetComponent<CarExhaust>(out var exhaust)) exhaust = root.AddComponent<CarExhaust>();
                var systems = new List<ParticleSystem>();
                for (int i = 0; i < pipes.Length; i++)
                {
                    string name = pipes.Length == 1 ? "Exhaust" : i == 0 ? "ExhaustL" : "ExhaustR";
                    var t = root.transform.Find(name);
                    if (t == null) { t = new GameObject(name).transform; t.SetParent(root.transform, false); }
                    t.gameObject.layer = root.layer;
                    t.localPosition = pipes[i];
                    t.localRotation = Quaternion.LookRotation(new Vector3(0f, 0.12f, -1f));   // backwards, a little up
                    if (!t.TryGetComponent<ParticleSystem>(out var ps)) ps = t.gameObject.AddComponent<ParticleSystem>();
                    var r = t.GetComponent<ParticleSystemRenderer>();
                    r.sharedMaterial = mat;
                    systems.Add(ps);
                }
                exhaust.Pipes = systems.ToArray();
                var flashT = root.transform.Find("ExhaustFlash");
                if (flashT == null) { flashT = new GameObject("ExhaustFlash").transform; flashT.SetParent(root.transform, false); }
                flashT.localPosition = pipes[0] + new Vector3(0f, 0f, -0.15f);
                if (!flashT.TryGetComponent<Light>(out var flash)) flash = flashT.gameObject.AddComponent<Light>();
                flash.type = LightType.Point; flash.range = 1.6f; flash.intensity = 2.5f; flash.color = new Color(1f, 0.55f, 0.2f);
                flash.shadows = LightShadows.None; flash.enabled = false;
                exhaust.Flash = flash;
                var fx = root.GetComponent<CarEffects>();
                if (fx != null) fx.Exhaust = systems[0];
                PrefabUtility.SaveAsPrefabAsset(root, prefab);
                Debug.Log($"CarExhaustSetup: {systems.Count} tailpipe(s) at {string.Join(", ", pipes.Select(p => p.ToString("F2")))}");
            }
            finally { PrefabUtility.UnloadPrefabContents(root); }
            AssetDatabase.SaveAssets();
        }

        /// <summary>A soft, lumpy round puff: radial falloff times fBm, so overlapping particles read as billows.</summary>
        static Texture2D PuffTexture(string path)
        {
            const int N = 64;
            var px = new Color[N * N];
            for (int y = 0; y < N; y++)
                for (int x = 0; x < N; x++)
                {
                    float u = (x + 0.5f) / N, w = (y + 0.5f) / N;
                    float r = Vector2.Distance(new Vector2(u, w), new Vector2(0.5f, 0.5f)) * 2f;
                    float fall = Mathf.Clamp01(1f - r); fall = fall * fall * (3f - 2f * fall);
                    float lump = 0.6f + 0.4f * (ProcTex.Fbm(u, w, 4, 3, 77) * 0.5f + 0.5f);
                    px[y * N + x] = new Color(1f, 1f, 1f, Mathf.Clamp01(fall * lump * 1.2f));
                }
            return ProcTex.SavePng(path, px, N, N, imp => { ProcTex.Colour(imp, 64, cutout: false, clamp: true); imp.alphaIsTransparency = true; });
        }
    }
}
