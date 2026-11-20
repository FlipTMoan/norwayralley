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
    /// drawn and GC bytes per frame, written to DIR/bench.txt. <c>-previewDrive SECONDS [-previewDriveKmh K]</c> skips the shots
    /// and only drives (a trace line per second, the car's <c>collision:</c> lines in the log); <c>-previewCar ID</c> picks the car (Garage ids:
    /// porsche, carrera, turbo930, volvo240, mv6, ranger, baja, type736), and a drive saves its last chase frame; <c>-previewExhaust</c> adds
    /// exhaust shots at idle and under full throttle; <c>-previewMud</c> skips the shots and instead launches the car from rest
    /// off road, on gravel, on asphalt and in shallow water near the start (side and chase frames 0.9 s and 2 m in, wheelspin and mud); <c>-previewRoadDebug</c> also logs the edge fit and water-on-road survey.
    /// </summary>
    public static class PreviewShots
    {
        const int W = 1280, H = 720;
        static string outDir, query, carId;
        static bool live, noCompute, bench, roadDebug;
        static float driveSecs, driveKmh;
        static double nextTrace, exhaustT0;
        static bool exhaust, mud;
        static readonly Queue<string> mudRuns = new Queue<string>();
        static string mudRun;
        static double mudT0;
        static float2 mudSpot;
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
            exhaust = Array.IndexOf(args, "-previewExhaust") >= 0;
            mud = Array.IndexOf(args, "-previewMud") >= 0;
            driveSecs = float.TryParse(Arg(args, "-previewDrive"), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var ds) ? ds : 0f;
            driveKmh = float.TryParse(Arg(args, "-previewDriveKmh"), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var dk) ? dk : 70f;
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
            carId = Arg(args, "-previewCar");
            if (carId != null) Rally.Geo.BrowserDom.LocalSet("rally.car", carId);   // the start-screen choice (Garage ids), kept across play mode (no domain reload)
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
                        if (driveSecs > 0) { cam = game.MainCamera != null ? game.MainCamera : Camera.main; BenchPlan(); benchPoses.Clear(); step = 10; return; }   // -previewDrive: no shots, just the drive
                        if (mud) { MudPlan(); step = 30; return; }   // -previewMud: launches on each surface, no other shots
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
                    case 3:   // shots done; the exhaust under throttle (if asked); the bench (if asked) measures from the same start pose
                        if (exhaust && exhaustT0 == 0)
                        {
                            var ec = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>();
                            ec.Driver = new Rally.Vehicle.ScriptedDriver { TargetKmh = 150f };
                            game.StartEngine();
                            exhaustT0 = -1; step = 20;
                            return;
                        }
                        if (!bench) { Finish(0); return; }
                        BenchPlan();
                        step = 10;
                        return;
                    case 20:   // wait for the countdown, then the car floors it from rest
                        if (game.Phase != Phase.Racing) return;
                        exhaustT0 = now; step = 21;
                        return;
                    case 21:   // 0.7 s of full throttle from rest: a side view at the pipes, then one from behind
                    case 22:
                    case 23:
                    {
                        if (step == 21 && now < exhaustT0 + 0.7) return;
                        if (pending != null) { if (now < waitUntil) return; Save(pending); pending = null; }
                        if (step == 23) { step = 3; return; }
                        var et = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>().transform;
                        float3 ep = et.position; float2 ef = math.normalizesafe(((float3)et.forward).xz), er = new float2(ef.y, -ef.x);
                        if (step == 21) { Look(ep.xz + er * 4.5f - ef * 3.5f, 0.9f, ep.xz - ef * 3.5f, 0.5f); pending = "13_exhaust_throttle_side"; }
                        else { Look(ep.xz - ef * 7f, 1.9f, ep.xz + ef * 2f, 0.6f); pending = "13_exhaust_throttle_chase"; }
                        cam.targetTexture = rt; waitUntil = now + 0.05;
                        step++;
                        return;
                    }
                    case 30:   // -previewMud: wait for the countdown, then place the car for the next run and floor it
                    {
                        if (game.Phase != Phase.Racing) return;
                        if (pending != null) { if (now < waitUntil) return; Save(pending); pending = null; }
                        if (mudRuns.Count == 0) { Finish(0); return; }
                        mudRun = mudRuns.Dequeue();
                        var mc = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>();
                        if (!MudSpot(mudRun, mc.State.Pos.xz, out var spot, out float yaw)) { Debug.Log($"PreviewShots mud: no {mudRun} spot near the start"); return; }
                        mc.ResetTo(spot, yaw);
                        mudT0 = now; mudSpot = spot; step = 31;
                        return;
                    }
                    case 31:   // 0.9 s of full throttle from rest: a low side view at the rear wheel, then one from behind
                    case 32:
                    {
                        // 0.9 s, and 2 m driven (a far jump streams tiles and the first frames are long and capped)
                        if (step == 31 && (now < mudT0 + 0.9 || math.distance(UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>().State.Pos.xz, mudSpot) < 2f && now < mudT0 + 6)) return;
                        if (pending != null) { if (now < waitUntil) return; Save(pending); pending = null; }
                        var mc = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>();
                        ref var ms = ref mc.State;
                        var mt = mc.transform;
                        float3 mp = mt.position; float2 mf = math.normalizesafe(((float3)mt.forward).xz), mr = new float2(mf.y, -mf.x);
                        Debug.Log($"PreviewShots mud {mudRun}: {mc.Kind} {ms.SurfaceKind} onRoad {ms.OnRoad} water {ms.WaterDepth:0.00} {ms.SpeedKmh:0} km/h slip {ms.WheelSlip:0.0} m/s gear {ms.Gear} rpm {ms.Rpm:0}");
                        // Over water the camera keeps above the surface, not above the bed.
                        float2 sideFrom = mp.xz + mr * 5.5f - mf * 4.5f, chaseFrom = mp.xz - mf * 8f;
                        float Above(float2 at) { var w = world.WaterAt(at); return w.Depth > 0f ? w.Depth : 0f; }
                        if (step == 31) { Look(sideFrom, 1.0f + Above(sideFrom), mp.xz - mf * 2.5f, 0.7f, mp.y); pending = $"mud_{mc.Kind}_{mudRun}_side"; step = 32; }
                        else { Look(chaseFrom, 2.2f + Above(chaseFrom), mp.xz + mf * 1f, 0.8f, mp.y); pending = $"mud_{mc.Kind}_{mudRun}_chase"; step = 30; }
                        cam.targetTexture = rt; waitUntil = now + 0.05;
                        return;
                    }
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
                        carc.Driver = new Rally.Vehicle.ScriptedDriver { TargetKmh = driveKmh };
                        game.StartEngine();
                        cam.targetTexture = benchRt;
                        step = 11;
                        return;
                    case 11:   // wait for the countdown, then 60 s of driving
                        if (game.Phase != Phase.Racing) return;
                        benchName = "drive_60s"; benchArmAt = now; benchArmed = false;
                        waitUntil = now + (driveSecs > 0 ? driveSecs : 60.0);
                        step = 12;
                        return;
                    case 12:
                        if (now >= nextTrace)
                        {
                            nextTrace = now + 1.0;
                            var tc = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>();
                            ref var ts = ref tc.State;
                            var tu = FloatingOrigin.ToUtm(ts.Pos);
                            Debug.Log($"PreviewShots trace: {ts.SpeedKmh:0} km/h gear {ts.Gear} rpm {ts.Rpm:0} E {tu.E:0.0} N {tu.N:0.0} y {ts.Pos.y:0.00} ground {world.HeightAt(ts.Pos.xz):0.00} {ts.SurfaceKind} onRoad {ts.OnRoad} grounded {ts.Grounded} water {ts.WaterDepth:0.00} loaded {world.IsLoaded(ts.Pos.xz)} in T{tc.LastInput.Throttle:0.0} B{tc.LastInput.Brake:0.0} S{tc.LastInput.Steer:0.00} frozen {tc.Frozen} phase {game.Phase}");
                        }
                        if (now < waitUntil) return;
                        BenchReport(benchName);
                        benchName = null;
                        {
                            var dc = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>();
                            Debug.Log($"PreviewShots drive: {dc.Kind}, {dc.State.Distance:0} m driven, {dc.Diagnostics.Contacts} contacts, {dc.Diagnostics.SuddenStops} sudden slow-downs, damage {dc.Damage * 100:0} %");
                            // The chase view at the end of the drive (one frame of the game camera), named after the car.
                            if (rt == null) rt = new RenderTexture(W, H, 24, RenderTextureFormat.ARGB32) { antiAliasing = 4 };
                            cam.targetTexture = rt; cam.Render();
                            Save($"drive_{dc.Kind}_{dc.State.SpeedKmh:0}kmh");
                        }
                        Finish(0);
                        return;
                }
            }
            catch (Exception e) { Fail(e.ToString()); }
        }

        /// <summary>-previewMud: the runs, the camera off the rig, motion blur off, and the car on a straight-ahead full-throttle driver.</summary>
        static void MudPlan()
        {
            cam = game.MainCamera != null ? game.MainCamera : Camera.main;
            if (blur == null && game.Style != null && game.Style.PostProfile != null && game.Style.PostProfile.TryGet<UnityEngine.Rendering.Universal.MotionBlur>(out var mb))
            { blur = mb; blurWasActive = mb.active; mb.active = false; }
            var rig = UnityEngine.Object.FindAnyObjectByType<CameraRig>();
            if (rig != null) rig.enabled = false;
            if (rt == null) rt = new RenderTexture(W, H, 24, RenderTextureFormat.ARGB32) { antiAliasing = 4 };
            foreach (var r in new[] { "offroad", "gravel", "asphalt", "water" }) mudRuns.Enqueue(r);
            var ctl = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>();
            ctl.Driver = new Rally.Vehicle.ScriptedDriver { TargetKmh = 250f, SteerGain = 0f };   // flat out, straight ahead
            game.StartEngine();
        }

        /// <summary>A launch spot within 800 m: the surface wanted under the car and 20 m straight ahead, level, dry (or shallow water); off road no tree colliders just ahead.</summary>
        static bool MudSpot(string run, float2 near, out float2 spot, out float yaw)
        {
            bool Fits(float2 p)
            {
                var w = world.WaterAt(p);
                if (run == "water") return w.Depth > 0.2f && w.Depth < 0.6f;
                if (w.Depth > 0f || !world.IsLoaded(p)) return false;
                var want = run == "offroad" ? Surface.Offroad : run == "gravel" ? Surface.Gravel : Surface.Asphalt;
                return world.SurfaceAt(p) == want;
            }
            int trees = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>().TreeLayers.value;
            for (float rad = 10f; rad < 800f; rad += 7f)
                for (float a = 0f; a < 2f * math.PI; a += 7f / rad)
                {
                    var p = near + new float2(math.cos(a), math.sin(a)) * rad;
                    if (!Fits(p)) continue;
                    for (int k = 0; k < 16; k++)
                    {
                        float y = k * math.PI / 8f;
                        var f = new float2(math.sin(y), math.cos(y));
                        bool ok = true;
                        float h0 = world.HeightAt(p);
                        for (float d = 4f; d <= 20f && ok; d += 4f) ok = Fits(p + f * d) && math.abs(world.HeightAt(p + f * d) - h0) < d * 0.05f;
                        // Off road: room for the camera beside and behind (not into a hillside), no trees right ahead.
                        if (ok && run == "offroad") ok = !Physics.CheckSphere(new Vector3(p.x, h0 + 1.5f, p.y) + new Vector3(f.x, 0f, f.y) * 10f, 9f, trees, QueryTriggerInteraction.Ignore);
                        if (ok) { spot = p; yaw = y; return true; }
                    }
                }
            spot = near; yaw = 0f;
            return false;
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
            SignShots(c);
            if (exhaust)
            {
                // The exhaust at idle (the engine is cold for its first 30 s): from the side at the pipes, and from behind.
                var ct = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>().transform;
                float3 cp = ct.position; float2 cf = math.normalizesafe(((float3)ct.forward).xz), cr = new float2(cf.y, -cf.x);
                shots.Enqueue(("12_exhaust_idle_side", () => Look(cp.xz + cr * 4.2f - cf * 2.2f, 0.8f, cp.xz - cf * 2.6f, 0.45f)));
                shots.Enqueue(("12_exhaust_idle_chase", () => Look(cp.xz - cf * 7f, 1.9f, cp.xz + cf * 2f, 0.6f)));
            }
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
            head += "\n# " + EdgeFit(car, pts, layer);
            File.WriteAllText(Path.Combine(outDir, "road.txt"), "# " + head + "\n" + sb);
            Debug.Log("PreviewShots road: " + head);
            var block = new MaterialPropertyBlock();
            block.SetColor("_BaseColor", Color.magenta);
            bool magenta = Array.IndexOf(Environment.GetCommandLineArgs(), "-previewRoadMagenta") >= 0;
            foreach (var mf in ribbons) { UnityEngine.Object.Destroy(mf.GetComponent<MeshCollider>()); mf.gameObject.layer = 0; if (magenta) mf.GetComponent<MeshRenderer>().SetPropertyBlock(block); }
        }

        /// <summary>
        /// Does the terrain meet the ribbon edge? At every road point, on both sides: the ribbon edge (raycast just inside it)
        /// against the drawn terrain just outside it, modelled per clipmap ring by distance from the car (Clipmap.DrawnHeight,
        /// 2 m cells within 64 m, 4 m to 128 m, 8 m to 256 m, 16 m beyond) — floating = a gap over 10 cm under the edge,
        /// buried = terrain over the edge by 5 cm. Also the road points where the car would be in water.
        /// </summary>
        static string EdgeFit(Vector3 car, List<Utm33> pts, int layer)
        {
            int[] total = new int[4], floating = new int[4], buried = new int[4];
            int fill = 0, cut = 0, wet = 0, wetSea = 0, wetOther = 0, roadPts = 0;
            float H(float2 xz) => world.CarvedHeightAt(FloatingOrigin.ToUtm(xz));
            float M(float2 xz) => world.CarveMaskAt(FloatingOrigin.ToUtm(xz));
            foreach (var u in pts)
            {
                if (!world.Roads.Nearest(u, 2, out var q)) continue;
                roadPts++;
                var c = FloatingOrigin.ToWorldXZ(new Utm33(q.Point.x, q.Point.y));
                // Would the car be in water here? (the same test as CarSim.UpdateWater: the water above the wheels' ground)
                var ws = Water.WaterAt(world.WaterBodiesAt(FloatingOrigin.ToUtm(c)), FloatingOrigin.ToUtm(c), world.CarvedHeightAt(FloatingOrigin.ToUtm(c)));
                if (ws.Depth > 0f && world.HeightAt(c) <= ws.SurfaceY + 0.15f) { if (ws.SurfaceY == Water.SeaLevel) wetSea++; else wetOther++; }
                if (world.WaterAt(c).Depth > 0f) wet++;
                float dist = math.distance(c, new float2(car.x, car.z));
                int band = dist < 64 ? 0 : dist < 128 ? 1 : dist < 256 ? 2 : 3;
                float cell = 2f * (1 << band);
                var nrm = new float2(-(float)q.Tangent.y, (float)q.Tangent.x);
                float edge = q.Half + RoadConstants.RoadShoulder;
                for (int side = -1; side <= 1; side += 2)
                {
                    var inside = c + nrm * side * (edge - 0.05f);
                    var outside = c + nrm * side * (edge + 0.05f);
                    if (!Physics.Raycast(new Vector3(inside.x, 500, inside.y), Vector3.down, out var hit, 1000, 1 << layer)) continue;
                    float rib = hit.point.y;
                    float terr = Clipmap.DrawnHeight(outside, cell, H, M);
                    float natural = world.BaseHeightAt(FloatingOrigin.ToUtm(c + nrm * side * (edge + 4f)));
                    if (natural < rib - 0.5f) fill++; else if (natural > rib + 0.5f) cut++;
                    total[band]++;
                    if (rib - terr > 0.10f) floating[band]++;
                    if (terr - rib > 0.05f) buried[band]++;
                }
            }
            var sb = new System.Text.StringBuilder($"edge fit: {roadPts} road points ({fill} fill / {cut} cut edge samples), water under the car on the road at {wet} (the old rule: {wetSea} in the sea plane, {wetOther} in a river or lake); floating / buried by ring:");
            string[] names = { "<64 m (2 m)", "64–128 m (4 m)", "128–256 m (8 m)", ">256 m (16 m)" };
            int tf = 0, tt = 0;
            for (int b = 0; b < 4; b++) { sb.Append($"  {names[b]} {floating[b]}/{total[b]} = {100.0 * floating[b] / math.max(1, total[b]):0.0} % / {100.0 * buried[b] / math.max(1, total[b]):0.0} %"); tf += floating[b]; tt += total[b]; }
            sb.Append($"; all rings floating {100.0 * tf / math.max(1, tt):0.0} %");
            return sb.ToString();
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
            (float2 at, float2 dir, float2 nrm, float edge)? fill = null, cut = null;
            float bestTurn = 0, bestFill = 1.5f, bestCut = 1.5f;
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
                // Embankments and cuttings: the natural ground 4 m past the ribbon edge against the road, either side.
                float edge = q.Half + RoadConstants.RoadShoulder;
                var nrm = new float2(-d.y, d.x);
                for (int side = -1; side <= 1; side += 2)
                {
                    float natural = world.BaseHeightAt(FloatingOrigin.ToUtm(p + nrm * side * (edge + 4)));
                    if (q.RoadY - natural > bestFill) { bestFill = q.RoadY - natural; fill = (p, d, nrm * side, edge); }
                    if (natural - q.RoadY > bestCut) { bestCut = natural - q.RoadY; cut = (p, d, nrm * side, edge); }
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
            // Along the edge from the road, and the edge from out on the slope.
            if (fill != null)
            {
                var (at, dir, side, edge) = fill.Value;
                Debug.Log($"PreviewShots: fill {bestFill:0.0} m at {FloatingOrigin.ToUtm(at)}");
                shots.Enqueue(("10_fill_along", () => Look(at - dir * 9 + side * (edge - 1.5f), 2.2f, at + dir * 14 + side * (edge + 0.5f), 0f)));
                shots.Enqueue(("10_fill_side", () => Look(at + side * (edge + 9) - dir * 5, 1.7f, at + side * edge, 0.1f)));
            }
            if (cut != null)
            {
                var (at, dir, side, edge) = cut.Value;
                Debug.Log($"PreviewShots: cut {bestCut:0.0} m at {FloatingOrigin.ToUtm(at)}");
                shots.Enqueue(("11_cut_along", () => Look(at - dir * 9 + side * (edge - 1.5f), 2.2f, at + dir * 14 + side * (edge + 0.5f), 0f)));
            }
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
        /// <summary>
        /// The road signs (World/Signs): the nearest sign faces to the car, each from 6 m in front at eye height and the
        /// nearest two also from 30 m (the distance they are read at speed). Faces are found in the built sign meshes
        /// (vertex colour alpha 1), grouped per post.
        /// </summary>
        static void SignShots(float3 car)
        {
            var groups = new Dictionary<long, (Vector3 sum, Vector3 n, int count)>();
            foreach (var mf in UnityEngine.Object.FindObjectsByType<MeshFilter>(FindObjectsSortMode.None))
            {
                if (!mf.name.StartsWith("Signs") || mf.sharedMesh == null) continue;
                var m = mf.sharedMesh; var v = m.vertices; var n = m.normals; var col = m.colors;
                for (int i = 0; i < v.Length; i++)
                {
                    if (col[i].a < 0.5f) continue;
                    var w = mf.transform.TransformPoint(v[i]);
                    long key = ((long)Mathf.FloorToInt(w.x / 3f) << 32) ^ (uint)Mathf.FloorToInt(w.z / 3f) ^ ((long)Mathf.RoundToInt(Mathf.Atan2(n[i].x, n[i].z) * 2) << 56);
                    groups.TryGetValue(key, out var g);
                    groups[key] = (g.sum + w, n[i], g.count + 1);
                }
            }
            var list = new List<(Vector3 p, Vector3 n, float d)>();
            foreach (var g in groups.Values) { var p = g.sum / g.count; list.Add((p, g.n, math.distance(((float3)p).xz, car.xz))); }
            list.Sort((a, b) => a.d.CompareTo(b.d));
            Debug.Log($"PreviewShots: {list.Count} sign faces in the built sign meshes");
            for (int i = 0; i < math.min(6, list.Count); i++)
            {
                var (p, n, _) = list[i];
                float2 at = ((float3)p).xz, dir = math.normalizesafe(((float3)n).xz);
                float ground = world.HeightAt(at);
                shots.Enqueue(($"14_sign_{i}_near", () => Look(at + dir * 6f, 1.4f, at, p.y - ground)));
                if (i < 2) shots.Enqueue(($"14_sign_{i}_30m", () => Look(at + dir * 30f + new float2(dir.y, -dir.x) * 3f, 1.4f, at, p.y - ground)));
            }
        }

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
