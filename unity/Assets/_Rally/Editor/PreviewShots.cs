using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using Rally.Core;
using Rally.Gameplay;
using Rally.Presentation;
using Rally.World;
using Unity.Collections;
using Unity.Mathematics;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Rally.Editor
{
    /// <summary>
    /// Look-development screenshots without a human at the editor: opens the bootstrap scene, plays it with the fake
    /// sources or the live services, waits for the world and its forest, then moves the game camera to a few poses
    /// and saves PNGs — the chase view, a view across a hillside, an elevated view of the ground classes, one
    /// close-up of each species where the scatter actually put one, and a studio line-up of every species and LOD
    /// far below the world. The game camera itself is moved (the rig is paused) because the vegetation is culled
    /// against it.
    /// <c>DISPLAY=:0 Unity -batchmode -projectPath unity -executeMethod Rally.Editor.PreviewShots.Run [-previewLive] [-previewNoCompute] [-previewQuery "?drive=59.65,6.35"] -previewOut DIR</c>
    /// (no -quit: the editor exits when the shots are saved; no -nographics: it has to render).
    /// </summary>
    public static class PreviewShots
    {
        const int W = 1280, H = 720;
        static string outDir, query;
        static bool live, noCompute;
        static int step;
        static double waitUntil, started, treesSince;
        static readonly Queue<(string name, Action pose)> shots = new Queue<(string, Action)>();
        static RenderTexture rt;
        static string pending;
        static GameController game;
        static TileWorld world;
        static Camera cam;
        static bool oldOptionsEnabled, blurWasActive;
        static UnityEngine.Rendering.Universal.MotionBlur blur;
        static EnterPlayModeOptions oldOptions;

        public static void Run()
        {
            var args = Environment.GetCommandLineArgs();
            live = Array.IndexOf(args, "-previewLive") >= 0;
            noCompute = Array.IndexOf(args, "-previewNoCompute") >= 0;
            GpuCaps.ForceNoCompute = noCompute;   // the WebGL 2 path: CPU scatter, RenderMeshInstanced
            outDir = Arg(args, "-previewOut") ?? Path.GetFullPath("Logs/preview");
            query = Arg(args, "-previewQuery") ?? (live ? "?drive=59.65,6.35" : null);
            Directory.CreateDirectory(outDir);
            EditorSceneManager.OpenScene(SceneBuilder.ScenePath);
            var g = UnityEngine.Object.FindAnyObjectByType<GameController>();
            g.UseFakeSources = !live;
            if (query != null) g.EditorQuery = query;
            // No domain reload on entering play mode, so this class keeps its state and its update hook.
            oldOptionsEnabled = EditorSettings.enterPlayModeOptionsEnabled; oldOptions = EditorSettings.enterPlayModeOptions;
            EditorSettings.enterPlayModeOptionsEnabled = true;
            EditorSettings.enterPlayModeOptions = EnterPlayModeOptions.DisableDomainReload;
            step = 0;
            EditorApplication.update += Tick;
            EditorApplication.EnterPlaymode();
            Debug.Log($"PreviewShots: playing ({(live ? "live " + query : "fake sources")}), PNGs to {outDir}");
        }

        static string Arg(string[] a, string name) { int i = Array.IndexOf(a, name); return i >= 0 && i + 1 < a.Length ? a[i + 1] : null; }

        static void Tick()
        {
            double now = EditorApplication.timeSinceStartup;
            try
            {
                switch (step)
                {
                    case 0:   // wait for play mode and the stage
                        if (!EditorApplication.isPlaying) return;
                        if (started == 0) started = now;
                        game = UnityEngine.Object.FindAnyObjectByType<GameController>();
                        if (game == null || game.Phase != Phase.Intro) { if (now - started > 240) Fail("the stage did not load in 240 s"); return; }
                        world = (TileWorld)typeof(GameController).GetField("world", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
                        step = 1; treesSince = 0;
                        return;
                    case 1:   // wait for the forest (live: SR16 and Overpass answers), then a few seconds for the rest
                        if (world.Trees.Count > 0 && treesSince == 0) treesSince = now;
                        bool settled = treesSince > 0 && now - treesSince > (live ? 25 : 4);
                        if (!settled && now - started < (live ? 200 : 40)) return;
                        Debug.Log($"PreviewShots: {world.Trees.Count} trees indexed, shooting");
                        Plan();
                        step = 2;
                        return;
                    case 2:   // pose → render one frame into the target → read back
                        if (now < waitUntil) return;
                        if (pending != null)
                        {
                            Save(pending);
                            pending = null;
                        }
                        if (shots.Count == 0) { step = 3; return; }
                        var (name, pose) = shots.Dequeue();
                        pose();
                        cam.targetTexture = rt;
                        pending = name;
                        waitUntil = now + 0.6;   // a few frames: LOD, culling and shadows follow the camera
                        return;
                    case 3:
                        Finish(0);
                        return;
                }
            }
            catch (Exception e) { Fail(e.ToString()); }
        }

        static void Plan()
        {
            cam = game.MainCamera != null ? game.MainCamera : Camera.main;
            // Motion blur smears a camera that just jumped to a new pose; switch it off for the shots (restored in Finish).
            if (game.Style != null && game.Style.PostProfile != null && game.Style.PostProfile.TryGet<UnityEngine.Rendering.Universal.MotionBlur>(out var mb))
            { blur = mb; blurWasActive = mb.active; mb.active = false; }
            var rig = UnityEngine.Object.FindAnyObjectByType<CameraRig>();
            rt = new RenderTexture(W, H, 24, RenderTextureFormat.ARGB32) { antiAliasing = 4 };
            shots.Enqueue(("01_chase", () => { }));
            shots.Enqueue(("01_chase_capture", () => { if (rig != null) rig.enabled = false; }));
            var car = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>().transform;
            float3 c = car.position;
            float2 fwd = math.normalizesafe(((float3)car.forward).xz);
            // The hillside: the direction in which the ground 300–900 m away rises most.
            float best = float.MinValue; float2 hillDir = fwd;
            for (int k = 0; k < 16; k++)
            {
                float a = k / 16f * math.PI * 2; var d = new float2(math.sin(a), math.cos(a));
                float rise = 0;
                for (float r = 300; r <= 900; r += 150) rise += world.HeightAt(c.xz + d * r) - c.y;
                if (rise > best) { best = rise; hillDir = d; }
            }
            shots.Enqueue(("02_hillside", () => Look(c.xz - hillDir * 30, 4, c.xz + hillDir * 600, 0.45f)));
            shots.Enqueue(("03_overview", () => Look(c.xz - hillDir * 250, 120, c.xz + hillDir * 300, 0f)));
            shots.Enqueue(("04_forest_edge", () => Look(c.xz - fwd * 10, 2.5f, c.xz + fwd * 120, 0.15f)));
            // One close-up per species, of the nearest real tree.
            var hits = new NativeList<TreeHit>(4096, Allocator.Temp);
            world.Trees.Query(c.xz, 1200, hits);
            var names = new[] { "spruce", "pine", "birch", "mountain_birch", "shrub" };
            for (int s = 0; s < 5; s++)
            {
                TreeHit? nearest = null; double nd = double.MaxValue;
                foreach (var h in hits)
                {
                    if (h.Species != s) continue;
                    var xz = FloatingOrigin.ToWorldXZ(new Utm33(h.Position.x, h.Position.y));
                    double d = math.distance(xz, c.xz);
                    if (d < nd) { nd = d; nearest = h; }
                }
                if (nearest == null) { Debug.Log($"PreviewShots: no {names[s]} within 1200 m"); continue; }
                var t = nearest.Value;
                var p = FloatingOrigin.ToWorldXZ(new Utm33(t.Position.x, t.Position.y));
                float dist = math.max(8, t.Height * 1.3f);
                var from = p + math.normalizesafe(c.xz - p, new float2(1, 0)) * dist;
                shots.Enqueue(($"05_{s}_{names[s]}", () => Look(from, 1.7f, p, t.Height * 0.45f, t.GroundY)));
            }
            hits.Dispose();
            // Studio line-up far below the world: every species at LOD 0, 1, 2 and the impostor.
            shots.Enqueue(("06_lineup_lod0", () => Lineup(game.Style.Vegetation, 0)));
            shots.Enqueue(("06_lineup_lod1", () => Lineup(game.Style.Vegetation, 1)));
            shots.Enqueue(("06_lineup_lod2", () => Lineup(game.Style.Vegetation, 2)));
            shots.Enqueue(("06_lineup_impostor", () => Lineup(game.Style.Vegetation, 3)));
        }

        /// <summary>Camera at <paramref name="from"/> (height above the ground) looking at a target point (height above its ground).</summary>
        static void Look(float2 from, float up, float2 at, float atUp, float atGround = float.NaN)
        {
            ClearLineup();
            float y0 = world.HeightAt(from) + up;
            float y1 = (float.IsNaN(atGround) ? world.HeightAt(at) : atGround) + atUp;
            var p = new Vector3(from.x, y0, from.y);
            cam.transform.position = p;
            cam.transform.rotation = Quaternion.LookRotation(new Vector3(at.x, y1, at.y) - p, Vector3.up);
        }

        static readonly List<GameObject> lineup = new List<GameObject>();
        static void ClearLineup()
        {
            foreach (var g in lineup) UnityEngine.Object.Destroy(g);
            lineup.Clear();
        }

        /// <summary>Species side by side on a grass plane 3 km below the world, so nothing else is in the frame.</summary>
        static void Lineup(VegetationSetSO set, int lod)
        {
            ClearLineup();
            var origin = new Vector3(0, -3000, 0);
            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.transform.position = origin; ground.transform.localScale = new Vector3(20, 1, 20);
            var gm = new Material(Shader.Find("Universal Render Pipeline/Lit")); gm.SetColor("_BaseColor", new Color(0.30f, 0.36f, 0.18f));
            ground.GetComponent<Renderer>().sharedMaterial = gm;
            lineup.Add(ground);
            float x = -26;
            float[] gap = { 12, 12, 11, 8, 4 };
            for (int s = 0; s < set.Prototypes.Length; s++)
            {
                var p = set.Prototypes[s];
                var mesh = lod < 3 ? p.Lods[lod] : p.Billboard;
                var mat = lod < 3 ? p.Material : p.BillboardMaterial;
                var go = new GameObject("lineup " + p.Name);
                go.transform.position = origin + new Vector3(x, 0, 0);
                go.transform.rotation = Quaternion.Euler(0, 30 * s, 0);
                go.AddComponent<MeshFilter>().sharedMesh = mesh;
                var mr = go.AddComponent<MeshRenderer>();
                mr.sharedMaterial = mat;
                lineup.Add(go);
                x += gap[s] + (s + 1 < gap.Length ? gap[s + 1] : 0) * 0.5f;
            }
            cam.transform.position = origin + new Vector3(-4, 9, -48);
            cam.transform.rotation = Quaternion.LookRotation(new Vector3(0, 6, 0) + origin - cam.transform.position);
        }

        static void Save(string name)
        {
            if (name.EndsWith("_capture")) name = name.Substring(0, name.Length - 8);
            else if (name == "01_chase") { cam.targetTexture = null; return; }   // first frame: let the rig settle into the target
            var prev = RenderTexture.active;
            RenderTexture.active = rt;
            var tex = new Texture2D(W, H, TextureFormat.RGB24, false);
            tex.ReadPixels(new Rect(0, 0, W, H), 0, 0);
            tex.Apply();
            RenderTexture.active = prev;
            cam.targetTexture = null;
            string path = Path.Combine(outDir, (live ? "live_" : "fake_") + (noCompute ? "gl2_" : "") + name + ".png");
            File.WriteAllBytes(path, tex.EncodeToPNG());
            UnityEngine.Object.DestroyImmediate(tex);
            Debug.Log("PreviewShots: saved " + path);
        }

        static void Fail(string why) { Debug.LogError("PreviewShots: " + why); Finish(1); }

        static void Finish(int code)
        {
            EditorApplication.update -= Tick;
            ClearLineup();
            if (cam != null) cam.targetTexture = null;
            if (rt != null) rt.Release();
            if (blur != null) blur.active = blurWasActive;
            EditorApplication.ExitPlaymode();
            EditorSettings.enterPlayModeOptionsEnabled = oldOptionsEnabled;   // leave the project settings as they were
            EditorSettings.enterPlayModeOptions = oldOptions;
            EditorApplication.delayCall += () => EditorApplication.Exit(code);
        }
    }
}
