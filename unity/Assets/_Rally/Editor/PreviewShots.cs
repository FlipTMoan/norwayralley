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
    /// <c>DISPLAY=:0 Unity -batchmode -projectPath unity -executeMethod Rally.Editor.PreviewShots.Run [-previewLive] [-previewNoCompute] [-previewBench] [-previewQuery "?drive=59.65,6.35"] -previewOut DIR</c>
    /// (no -quit: the editor exits when the shots are saved; no -nographics: it has to render).
    /// <c>-previewBench</c> first measures frames at 1920×1080 at the chase, hillside, overview and forest-edge poses (3 s
    /// each) and over a 60 s ScriptedDriver drive: frame time avg / p95, batches, SetPass calls, triangles, tree instances
    /// drawn and GC bytes per frame, written to DIR/bench.txt.
    /// </summary>
    public static class PreviewShots
    {
        const int W = 1280, H = 720;
        static string outDir, query;
        static bool live, noCompute, bench, roadDebug;
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
            bench = Array.IndexOf(args, "-previewBench") >= 0;
            roadDebug = Array.IndexOf(args, "-previewRoadDebug") >= 0;
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
                if (benchName != null && !benchArmed && now >= benchArmAt) BenchArm();
                if (benchArmed) BenchSample();
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
                        if (roadDebug) RoadReport();
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
                    case 3:   // shots done; the bench (if asked) measures from the same start pose
                        if (!bench) { Finish(0); return; }
                        BenchPlan();
                        step = 10;
                        return;
                    case 10:   // bench: next pose, 1 s to settle, 3 s measured; then the drive
                        if (now < waitUntil) return;
                        if (benchName != null) BenchReport(benchName);
                        if (benchPoses.Count > 0)
                        {
                            var (bn, bp) = benchPoses.Dequeue();
                            bp();
                            cam.targetTexture = benchRt;
                            benchName = bn; benchArmAt = now + 1.0; benchArmed = false;
                            waitUntil = now + 4.0;
                            return;
                        }
                        benchName = null;
                        ClearLineup();
                        var rig = UnityEngine.Object.FindAnyObjectByType<CameraRig>();
                        if (rig != null) rig.enabled = true;
                        var carc = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>();
                        carc.Driver = new Rally.Vehicle.ScriptedDriver { TargetKmh = 70f };
                        game.StartEngine();
                        cam.targetTexture = benchRt;
                        step = 11;
                        return;
                    case 11:   // wait for the countdown, then 60 s of driving
                        if (game.Phase != Phase.Racing) return;
                        benchName = "drive_60s"; benchArmAt = now; benchArmed = false;
                        waitUntil = now + 60.0;
                        step = 12;
                        return;
                    case 12:
                        if (now < waitUntil) return;
                        BenchReport(benchName);
                        benchName = null;
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
            if (blur == null && game.Style != null && game.Style.PostProfile != null && game.Style.PostProfile.TryGet<UnityEngine.Rendering.Universal.MotionBlur>(out var mb))
            { blur = mb; blurWasActive = mb.active; mb.active = false; }
            var rig = UnityEngine.Object.FindAnyObjectByType<CameraRig>();
            if (rt == null) rt = new RenderTexture(W, H, 24, RenderTextureFormat.ARGB32) { antiAliasing = 4 };
            shots.Enqueue(("01_chase", () => { }));
            shots.Enqueue(("01_chase_capture", () => { if (rig != null) rig.enabled = false; }));
            var car = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>().transform;
            float3 c = car.position;
            float2 fwd = math.normalizesafe(((float3)car.forward).xz);
            float2 hillDir = HillDir(c, fwd);
            shots.Enqueue(("02_hillside", () => Look(c.xz - hillDir * 30, 4, c.xz + hillDir * 600, 0.45f)));
            shots.Enqueue(("03_overview", () => Look(c.xz - hillDir * 250, 120, c.xz + hillDir * 300, 0f)));
            shots.Enqueue(("04_forest_edge", () => Look(c.xz - fwd * 10, 2.5f, c.xz + fwd * 120, 0.15f)));
            RoadShots(c);
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

        /// <summary>
        /// -previewRoadDebug: every road point within 600 m of the car — the car's ground (IGround.HeightAt), the drawn
        /// ribbon (raycast against temporary MeshColliders of the ribbon meshes) and the carved terrain (CarvedHeightAt,
        /// what the clipmap draws), written to DIR/road.txt; with -previewRoadMagenta the ribbons are tinted magenta for the shots.
        /// </summary>
        static void RoadReport()
        {
            const int layer = 31;
            var ribbons = new List<MeshFilter>();
            foreach (var mf in UnityEngine.Object.FindObjectsByType<MeshFilter>(FindObjectsSortMode.None))
                if (mf.name.StartsWith("Ribbon")) { var mc = mf.gameObject.AddComponent<MeshCollider>(); mc.sharedMesh = mf.sharedMesh; mf.gameObject.layer = layer; ribbons.Add(mf); }
            Physics.SyncTransforms();
            var car = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>().transform.position;
            var pts = new List<Utm33>();
            world.Roads.PointsNear(FloatingOrigin.ToUtm(car), 600, pts);
            var sb = new System.Text.StringBuilder("# x z  car  ribbon  carved  ribbon-car  carved-ribbon  fine\n");
            int n = 0, miss = 0, off = 0, above = 0; double sum = 0, worst = 0, worstAbove = 0;
            foreach (var u in pts)
            {
                var xz = FloatingOrigin.ToWorldXZ(u);
                // A little off the centre line too: the carriageway edges are where the terrain pokes through first.
                for (int k = -1; k <= 1; k++)
                {
                    var q = xz + new float2(k * 1.7f, k * 1.3f);
                    float carY = world.HeightAt(q), carved = world.CarvedHeightAt(FloatingOrigin.ToUtm(q));
                    if (!Physics.Raycast(new Vector3(q.x, carY + 50, q.y), Vector3.down, out var hit, 200, 1 << layer)) { miss++; continue; }
                    float rib = hit.point.y, d = rib - carY;
                    n++; sum += math.abs(d); worst = math.max(worst, math.abs(d));
                    if (math.abs(d) > 0.05f) off++;
                    if (carved > rib - 0.02f) { above++; worstAbove = math.max(worstAbove, carved - rib); }
                    bool fine = world.Tiles.ContainsKey(TileKey.At(TileKind.Fine, FloatingOrigin.ToUtm(q)));
                    sb.Append($"{q.x:0.0} {q.y:0.0}  {carY:0.00} {rib:0.00} {carved:0.00}  {d:+0.00;-0.00} {carved - rib:+0.00;-0.00}  {(fine ? 1 : 0)}\n");
                }
            }
            string head = $"road points {pts.Count}, samples {n}, ribbon missed {miss}; |ribbon−car| mean {sum / math.max(1, n):0.000} m, max {worst:0.00} m, {off} over 5 cm; carved terrain above the ribbon at {above} ({worstAbove:0.00} m worst)";
            File.WriteAllText(Path.Combine(outDir, "road.txt"), "# " + head + "\n" + sb);
            Debug.Log("PreviewShots road: " + head);
            var block = new MaterialPropertyBlock();
            block.SetColor("_BaseColor", Color.magenta);
            bool magenta = Array.IndexOf(Environment.GetCommandLineArgs(), "-previewRoadMagenta") >= 0;
            foreach (var mf in ribbons) { UnityEngine.Object.Destroy(mf.GetComponent<MeshCollider>()); mf.gameObject.layer = 0; if (magenta) mf.GetComponent<MeshRenderer>().SetPropertyBlock(block); }
        }

        /// <summary>
        /// Chase-height views of the road near the car: a gravel and an asphalt stretch, the sharpest bend and a junction
        /// (a node with three or more links), each seen from 10 m back along the road.
        /// </summary>
        static void RoadShots(float3 car)
        {
            if (!(world.Roads is Rally.Roads.RoadGraph g)) return;
            var pts = new List<Utm33>();
            g.PointsNear(FloatingOrigin.ToUtm(car), 500, pts);
            (float2 at, float2 dir)? gravel = null, asphalt = null, bend = null, junction = null;
            float bestTurn = 0;
            foreach (var u in pts)
            {
                if (!g.Nearest(u, 2, out var q)) continue;
                var p = FloatingOrigin.ToWorldXZ(new Utm33(q.Point.x, q.Point.y));
                var d = (float2)q.Tangent;
                if (q.Surface == Surface.Gravel && gravel == null && q.Half < 3) gravel = (p, d);
                if (q.Surface == Surface.Asphalt && asphalt == null && q.Half > 3) asphalt = (p, d);
                if (g.Nearest(new Utm33(q.Point.x + q.Tangent.x * 15, q.Point.y + q.Tangent.y * 15), 4, out var a2) && a2.Id == q.Id)
                {
                    float turn = (float)math.abs(math.atan2(q.Tangent.x * a2.Tangent.y - q.Tangent.y * a2.Tangent.x, math.dot(q.Tangent, a2.Tangent)));
                    if (turn > bestTurn) { bestTurn = turn; bend = (p, d); }
                }
                if (junction == null)
                {
                    long node = g.NearestNode(u, 3);
                    var links = node != 0 ? g.LinksFrom(node) : null;
                    if (links != null && links.Count >= 3) junction = (p, d);
                }
            }
            void Add(string name, (float2 at, float2 dir)? v)
            {
                if (v == null) { Debug.Log($"PreviewShots: no {name} within 500 m"); return; }
                var (at, dir) = v.Value;
                shots.Enqueue((name, () => Look(at - dir * 10, 2.6f, at + dir * 25, 0.3f)));
            }
            Add("07_road_gravel", gravel); Add("07_road_asphalt", asphalt);
            Add("08_bend", bend); Add("09_junction", junction);
        }

        /// <summary>The hillside: the direction in which the ground 300–900 m away rises most.</summary>
        static float2 HillDir(float3 c, float2 fwd)
        {
            float best = float.MinValue; float2 hillDir = fwd;
            for (int k = 0; k < 16; k++)
            {
                float a = k / 16f * math.PI * 2; var d = new float2(math.sin(a), math.cos(a));
                float rise = 0;
                for (float r = 300; r <= 900; r += 150) rise += world.HeightAt(c.xz + d * r) - c.y;
                if (rise > best) { best = rise; hillDir = d; }
            }
            return hillDir;
        }

        // ---- bench ----
        static void BenchPlan()
        {
            ClearLineup();
            var rig = UnityEngine.Object.FindAnyObjectByType<CameraRig>();
            if (rig != null) rig.enabled = true;
            benchRt = new RenderTexture(1920, 1080, 24, RenderTextureFormat.ARGB32) { antiAliasing = 1 };
            var benchCar = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>().transform;
            float3 bc = benchCar.position; float2 bf = math.normalizesafe(((float3)benchCar.forward).xz);
            float2 hd = HillDir(bc, bf);
            benchPoses.Enqueue(("chase", () => { }));
            benchPoses.Enqueue(("hillside", () => { if (rig != null) rig.enabled = false; Look(bc.xz - hd * 30, 4, bc.xz + hd * 600, 0.45f); }));
            benchPoses.Enqueue(("overview", () => Look(bc.xz - hd * 250, 120, bc.xz + hd * 300, 0f)));
            benchPoses.Enqueue(("forest_edge", () => Look(bc.xz - bf * 10, 2.5f, bc.xz + bf * 120, 0.15f)));
            File.WriteAllText(Path.Combine(outDir, "bench.txt"), $"# {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC  {(live ? "live " + query : "fake")}  {(noCompute ? "WebGL2 path (no compute)" : "compute path")}  {SystemInfo.graphicsDeviceName} {SystemInfo.graphicsDeviceType}\n"
                + "# pose            frames  avg_ms  p95_ms    draws  setpass  tris_k  trees  gc_B/frame\n");
        }

        static RenderTexture benchRt;
        static readonly Queue<(string, Action)> benchPoses = new Queue<(string, Action)>();
        static string benchName;
        static double benchArmAt, benchStartT;
        static bool benchArmed;
        static int benchStartFrame, treeSamples;
        static long treeSum;
        static int lastFrame;
        static long gcStart;
        static double batchSum, setPassSum, trisSum, lastT;
        static readonly List<double> frameMs = new List<double>();

        static void BenchArm()
        {
            benchArmed = true; benchStartFrame = lastFrame = Time.frameCount; benchStartT = lastT = Time.realtimeSinceStartupAsDouble;
            treeSum = 0; treeSamples = 0; batchSum = setPassSum = trisSum = 0; frameMs.Clear();
            gcStart = GC.GetAllocatedBytesForCurrentThread();   // C# runs on the main thread here
        }

        /// <summary>Once per editor tick: the frames since the last tick share the elapsed time; render stats of the last frame.</summary>
        static void BenchSample()
        {
            int f = Time.frameCount; double t = Time.realtimeSinceStartupAsDouble;
            if (f == lastFrame) return;
            double per = (t - lastT) * 1000 / (f - lastFrame);
            for (int i = lastFrame; i < f; i++) frameMs.Add(per);
            lastFrame = f; lastT = t;
            batchSum += UnityStats.drawCalls; setPassSum += UnityStats.setPassCalls; trisSum += UnityStats.triangles;
            treeSum += world?.Vegetation != null ? math.max(0, world.Vegetation.Drawn) : 0;
            treeSamples++;
        }

        static void BenchReport(string name)
        {
            if (!benchArmed) return;
            benchArmed = false;
            int frames = Time.frameCount - benchStartFrame;
            double secs = Time.realtimeSinceStartupAsDouble - benchStartT;
            frameMs.Sort();
            double p95 = frameMs.Count > 0 ? frameMs[Math.Min(frameMs.Count - 1, (int)Math.Ceiling(0.95 * frameMs.Count) - 1)] : 0;
            int n = math.max(1, treeSamples);
            long gc = (GC.GetAllocatedBytesForCurrentThread() - gcStart) / math.max(1, frames);
            string line = $"{name,-16} {frames,7} {secs * 1000 / math.max(1, frames),7:0.00} {p95,7:0.00} {batchSum / n,8:0} {setPassSum / n,8:0} {trisSum / n / 1000,7:0} {treeSum / n,6} {gc,11}";
            File.AppendAllText(Path.Combine(outDir, "bench.txt"), line + "\n");
            Debug.Log("PreviewShots bench: " + line);
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
            if (benchRt != null) benchRt.Release();
            if (blur != null) blur.active = blurWasActive;
            EditorApplication.ExitPlaymode();
            EditorSettings.enterPlayModeOptionsEnabled = oldOptionsEnabled;   // leave the project settings as they were
            EditorSettings.enterPlayModeOptions = oldOptions;
            // Straight away, not on delayCall: a script change made while playing recompiles on the way out and the
            // domain reload drops a pending delayCall, leaving a batchmode editor idling forever.
            EditorApplication.Exit(code);
        }
    }
}
