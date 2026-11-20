using System;
using System.Collections.Generic;
using System.Globalization;
using System.Reflection;
using Rally.Core;
using Rally.Gameplay;
using Rally.Presentation;
using Rally.Track;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Editor
{
    /// <summary>
    /// <c>-previewStage "NAME|WHERE|CAM;…"</c>: shots of the car placed on the stage line (the engine started, so the race HUD
    /// state is live), the rig in camera CAM (1 overhead, 2 chase, 3 seat). WHERE is metres along the line, <c>end-N</c> (N m
    /// before the finish line), <c>bend</c> / <c>hairpin</c> (25 m before the first medium / hairpin pace note), <c>tunnel</c>
    /// (20 m into the first tube on the line), <c>tunnelin</c> (40 m before it), <c>bridge</c> (15 m before the first deck).
    /// A WHERE of <c>side-N</c> is a camera 16 m beside the line N m before the finish, looking across it (the gate's side view).
    /// Each shot logs where the car is, the surface it reads, and the road arrow / finish gate when the game has them.
    /// </summary>
    public static partial class PreviewShots
    {
        static string stageSpec;

        static readonly FieldInfo StageField = typeof(GameController).GetField("stage", BindingFlags.NonPublic | BindingFlags.Instance);
        static readonly FieldInfo TurnsField = typeof(GameController).GetField("turns", BindingFlags.NonPublic | BindingFlags.Instance);

        static float FinishS(StageRoute st)
        {
            var p = typeof(GameController).GetField("FinishBefore", BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.Static);
            return st.Length - (p != null ? (float)p.GetValue(null) : 6f);
        }

        static float Where(string where, StageRoute st, List<Turn> turns)
        {
            var inv = CultureInfo.InvariantCulture;
            if (where.StartsWith("end-")) return FinishS(st) - float.Parse(where.Substring(4), inv);
            if (where == "bend" || where == "hairpin")
            {
                var want = where == "bend" ? TurnSeverity.Medium : TurnSeverity.Hairpin;
                foreach (var t in turns) if (t.Severity == want && t.Entry > 40f) return t.Entry - 25f;
                return float.NaN;
            }
            if (where == "tunnel" || where == "tunnelin")
                for (float s = 0; s < st.Length; s += 2f)
                    if (world.TunnelAt(st.SampleAtDistance(s).XZ, out _)) return where == "tunnel" ? s + 20f : s - 40f;
            if (where == "bridge" && world.Roads != null)
                for (float s = 0; s < st.Length; s += 2f)
                    if (world.Roads.Nearest(FloatingOrigin.ToUtm(st.SampleAtDistance(s).XZ), 6, RoadLayer.Deck, out var h) && h.Distance < 3) return s - 15f;
            return float.TryParse(where, NumberStyles.Float, inv, out var v) ? v : float.NaN;
        }

        static void StageShots(CameraRig rig)
        {
            var st = (StageRoute)StageField.GetValue(game);
            var turns = (List<Turn>)TurnsField.GetValue(game);
            var car = UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>();
            var inv = CultureInfo.InvariantCulture;
            // "@LAT,LON,YAWDEG": a fixed place (free drive too)
            foreach (var spec in stageSpec.Split(';'))
            {
                var part = spec.Split('|');
                if (part.Length < 2 || !part[1].StartsWith("@")) continue;
                var v = part[1].Substring(1).Split(',');
                var atUtm = Proj.ToUtm(new LatLon(double.Parse(v[0], inv), double.Parse(v[1], inv)));   // world xz only when used: a reset rebases
                float yaw = math.radians(float.Parse(v[2], inv));
                int mode = part.Length > 2 ? int.Parse(part[2]) : 2;
                string name = part[0];
                shots.Enqueue(($"skip_{name}", () => { rig.enabled = true; rig.CurrentMode = (CameraRig.Mode)mode; car.ResetTo(FloatingOrigin.ToWorldXZ(atUtm), yaw); }));
                shots.Enqueue(($"skip2_{name}", () => { }));
                shots.Enqueue(($"20_{name}", () => Report(name, float.NaN, car)));
            }
            if (st == null) { Debug.Log("PreviewShots stage: no stage line (free drive?)"); return; }
            var sb = new System.Text.StringBuilder($"PreviewShots stage: {st.Length:0} m, finish line at {FinishS(st):0}, turns:");
            foreach (var t in turns) sb.Append(FormattableString.Invariant($" {t.Severity}@{t.Entry:0}({t.Angle:0})"));
            Debug.Log(sb.ToString());
            foreach (var spec in stageSpec.Split(';'))
            {
                var part = spec.Split('|');
                if (part.Length < 2 || part[1].StartsWith("@")) continue;
                string name = part[0], where = part[1];
                int mode = part.Length > 2 ? int.Parse(part[2]) : 2;
                bool side = where.StartsWith("side-");
                float s = Where(side ? "end-" + where.Substring(5) : where, st, turns);
                if (float.IsNaN(s)) { Debug.Log($"PreviewShots stage {name}: no '{where}' on this stage"); continue; }
                // Poses are read when the shot runs: every reset far away rebases the world frame.
                if (side)
                {
                    // the car 6 m before the gate, the camera beside the line, level with the banner
                    shots.Enqueue(($"skip_{name}", () => { var g = st.SampleAtDistance(FinishS(st)); rig.enabled = true; rig.CurrentMode = CameraRig.Mode.Chase; car.ResetTo(g.XZ - new float2(math.sin(g.Yaw), math.cos(g.Yaw)) * 6f, g.Yaw); }));
                    shots.Enqueue(($"skip2_{name}", () => { }));
                    shots.Enqueue(($"20_{name}", () =>
                    {
                        var g = st.SampleAtDistance(FinishS(st));
                        var f = new float2(math.sin(g.Yaw), math.cos(g.Yaw));
                        var r = new float2(f.y, -f.x);
                        rig.enabled = false; Look(g.XZ + r * 16f - f * 4f, 3f, g.XZ, 3f); Report(name, s, car);
                    }));
                    continue;
                }
                shots.Enqueue(($"skip_{name}", () => { var pose = st.SampleAtDistance(s); rig.enabled = true; rig.CurrentMode = (CameraRig.Mode)mode; car.ResetTo(pose.XZ, pose.Yaw); }));
                shots.Enqueue(($"skip2_{name}", () => { }));
                shots.Enqueue(($"20_{name}", () => Report(name, s, car)));
            }
        }

        static void Report(string name, float s, Rally.Vehicle.CarController car)
        {
            ref var cs = ref car.State;
            var u = FloatingOrigin.ToUtm(cs.Pos.xz);
            var line = FormattableString.Invariant($"PreviewShots stage {name}: s {s:0} E {u.E:0.0} N {u.N:0.0} y {cs.Pos.y:0.00} {cs.SurfaceKind} onRoad {cs.OnRoad} surfaceAt {world.SurfaceAt(cs.Pos.xz)} tunnel {world.TunnelAt(cs.Pos.xz, out _)} phase {game.Phase}");
            if (world.Roads != null && world.Roads.Nearest(u, 30, out var h)) line += FormattableString.Invariant($" road {h.Id} {h.Surface} d {h.Distance:0.0} tunnel {h.Tunnel} bridge {h.Bridge}");
            var info = typeof(GameController).GetMethod("DebugMarkers");
            if (info != null) line += " " + info.Invoke(game, null);
            Debug.Log(line);
        }
    }
}
