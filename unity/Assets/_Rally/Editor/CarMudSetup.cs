using System.Collections.Generic;
using Rally.Vehicle;
using UnityEditor;
using UnityEngine;

namespace Rally.Editor
{
    /// <summary>
    /// Puts the thrown mud on the car prefabs: a procedural lumpy clod texture, a Rally/Smoke material and one particle
    /// system per driven wheel (children "Mud_RL/RR", and "Mud_FL/FR" on a 4WD), just behind each tyre's contact patch,
    /// wired to <see cref="CarMud"/>. The look (rates, colours per surface) is set in code by CarMud.
    /// <c>Unity -batchmode -projectPath unity -executeMethod Rally.Editor.CarMudSetup.RunAll -quit</c>; CarGarageBuilder calls
    /// <see cref="Apply"/> for every car it builds.
    /// </summary>
    public static class CarMudSetup
    {
        const string Dir = "Assets/_Rally/Settings/Car";
        static readonly string[] Names = { "Mud_FL", "Mud_FR", "Mud_RL", "Mud_RR" };

        [MenuItem("Rally/Car Mud On All Prefabs")]
        public static void RunAll()
        {
            foreach (var k in Garage.Choosable) Apply(CarGarageBuilder.PrefabPath(k), CarSpec.For(k));
        }

        public static void Apply(string prefab, in CarSpec spec)
        {
            var mat = Material();
            var root = PrefabUtility.LoadPrefabContents(prefab);
            try
            {
                if (!root.TryGetComponent<CarMud>(out var mud)) mud = root.AddComponent<CarMud>();
                var systems = new List<ParticleSystem>();
                var index = new List<int>();
                for (int i = 0; i < 4; i++)
                {
                    var t = root.transform.Find(Names[i]);
                    bool driven = !CarSim.WheelIsFront(i) || spec.Drive == DriveType.All;
                    if (!driven) { if (t != null) Object.DestroyImmediate(t.gameObject); continue; }
                    if (t == null) { t = new GameObject(Names[i]).transform; t.SetParent(root.transform, false); }
                    t.gameObject.layer = root.layer;
                    var w = CarSim.WheelOffset(spec, i);
                    // Just behind the contact patch, a little above the ground: thrown up and back off the tread.
                    t.localPosition = new Vector3(w.x, spec.WheelRadius * 0.35f, w.y - spec.WheelRadius * 0.85f);
                    t.localRotation = Quaternion.LookRotation(new Vector3(0f, 0.6f, -1f));
                    if (!t.TryGetComponent<ParticleSystem>(out var ps)) ps = t.gameObject.AddComponent<ParticleSystem>();
                    t.GetComponent<ParticleSystemRenderer>().sharedMaterial = mat;
                    systems.Add(ps); index.Add(i);
                }
                mud.Wheels = systems.ToArray();
                mud.WheelIndex = index.ToArray();
                PrefabUtility.SaveAsPrefabAsset(root, prefab);
                Debug.Log($"CarMudSetup {spec.Key}: {systems.Count} driven wheel(s)");
            }
            finally { PrefabUtility.UnloadPrefabContents(root); }
            AssetDatabase.SaveAssets();
        }

        static Material Material()
        {
            var tex = ClodTexture(Dir + "/MudClod.png");
            var mat = AssetDatabase.LoadAssetAtPath<Material>(Dir + "/MudClod.mat");
            if (mat == null) { mat = new Material(Shader.Find("Rally/Smoke")); AssetDatabase.CreateAsset(mat, Dir + "/MudClod.mat"); }
            mat.shader = Shader.Find("Rally/Smoke");
            mat.SetTexture("_MainTex", tex);
            mat.renderQueue = 3000;
            EditorUtility.SetDirty(mat);
            return mat;
        }

        /// <summary>A lumpy, fairly hard-edged blob: reads as a clod or a stone when small and dark, as a puff when big and pale.</summary>
        static Texture2D ClodTexture(string path)
        {
            const int N = 32;
            var px = new Color[N * N];
            for (int y = 0; y < N; y++)
                for (int x = 0; x < N; x++)
                {
                    float u = (x + 0.5f) / N, v = (y + 0.5f) / N;
                    float a = Mathf.Atan2(v - 0.5f, u - 0.5f);
                    float edge = 0.78f + 0.18f * ProcTex.Fbm(Mathf.Repeat(a / (2f * Mathf.PI), 1f), 0.5f, 5, 1, 3, 31);
                    float r = Vector2.Distance(new Vector2(u, v), new Vector2(0.5f, 0.5f)) * 2f / edge;
                    float alpha = Mathf.Clamp01((1f - r) * 5f);
                    px[y * N + x] = new Color(1f, 1f, 1f, alpha);
                }
            return ProcTex.SavePng(path, px, N, N, imp => { ProcTex.Colour(imp, 32, cutout: false, clamp: true); imp.alphaIsTransparency = true; });
        }
    }
}
