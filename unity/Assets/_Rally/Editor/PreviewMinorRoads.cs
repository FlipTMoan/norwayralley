using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text;
using Rally.Core;
using Rally.Gameplay;
using Rally.Roads;
using Rally.Track;
using Rally.Vehicle;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Editor
{
    /// <summary>
    /// <c>-previewMinor</c>: the minor-road speed survey. Once the world around the start is in, picks long road links of every
    /// class and surface from the road graph and, for every car, steps <see cref="CarSim"/> along each one from rest at full
    /// throttle against the live world and the game's route (synchronously, 60 Hz), and logs the top speed, how much of the run
    /// counted as on the road, the surface the sim used and which speed limit was binding. Writes DIR/minor_roads.txt.
    /// </summary>
    public static partial class PreviewShots
    {
        static bool minorSurvey;

        static void MinorRoadReport()
        {
            var roads = (RoadGraph)typeof(GameController).GetField("roads", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            var route = (IRoute)typeof(GameController).GetField("route", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            var links = (Dictionary<long, List<RoadLink>>)typeof(RoadGraph).GetField("links", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(roads);
            var sb = new StringBuilder($"# {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC  {(live ? "live " + query : "fake")}  route {route?.GetType().Name}\n");
            // Every link once (both directions are stored), longest first; up to 3 per (class, paved) that are on loaded ground.
            var seen = new HashSet<long>();
            var all = new List<RoadLink>();
            foreach (var l in links.Values) foreach (var k in l) if (k.Points != null && k.Points.Count > 1 && seen.Add(k.Id ^ (k.From * 31) ^ k.To) && seen.Add(k.Id ^ (k.To * 31) ^ k.From)) all.Add(k);
            all.Sort((a, b) => b.Length.CompareTo(a.Length));
            var pick = new List<RoadLink>();
            var per = new Dictionary<int, int>();
            var lengthBy = new Dictionary<int, float>();
            foreach (var k in all)
            {
                int key = k.RoadClass * 2 + (k.Paved ? 1 : 0);
                lengthBy[key] = (lengthBy.TryGetValue(key, out var lm) ? lm : 0) + k.Length;
                if (k.Length < 250 || k.Climb > 0.06f) continue;
                bool loaded = true;
                foreach (var p in k.Points) if (!world.IsLoaded(FloatingOrigin.ToWorldXZ(new Utm33(p.x, p.y)))) { loaded = false; break; }
                if (!loaded) continue;
                per.TryGetValue(key, out var c);
                if (c >= 3) continue;
                per[key] = c + 1; pick.Add(k);
            }
            foreach (var kv in lengthBy) sb.Append(FormattableString.Invariant($"graph class {kv.Key / 2} {(kv.Key % 2 == 1 ? "paved" : "gravel")}: {kv.Value / 1000:0.0} km\n"));
            var cars = new[] { CarKind.Porsche, CarKind.Carrera, CarKind.Turbo930, CarKind.Volvo240, CarKind.Mv6, CarKind.Ranger, CarKind.Baja, CarKind.Type736, CarKind.Buggy };
            var layered = world as ILayeredGround;
            foreach (var k in pick)
            {
                var pts = new List<float2>();
                foreach (var p in k.Points) pts.Add(FloatingOrigin.ToWorldXZ(new Utm33(p.x, p.y)));
                // The drawn road's steepest 4 m along the link (world.HeightAt every 2 m on the centre line).
                float maxGrade = 0; float2 maxAt = pts[0];
                for (int i = 0; i + 1 < pts.Count; i++)
                {
                    float L = math.distance(pts[i], pts[i + 1]);
                    for (float d = 0; d < L; d += 2f)
                    {
                        var a = math.lerp(pts[i], pts[i + 1], d / L); var dir = (pts[i + 1] - pts[i]) / L;
                        float g = math.abs(world.HeightAt(a + dir * 2f) - world.HeightAt(a - dir * 2f)) / 4f;
                        if (g > maxGrade) { maxGrade = g; maxAt = a; }
                    }
                }
                var mu = FloatingOrigin.ToUtm(maxAt);
                if (maxGrade > 0.5f)
                {
                    // Profile across the step: the drawn height (top surface and as a car at the previous height sees it) and the roads there.
                    int si = 0; float sd = float.MaxValue;
                    for (int i = 0; i + 1 < pts.Count; i++) { float dd = DistSeg(maxAt, pts[i], pts[i + 1]); if (dd < sd) { sd = dd; si = i; } }
                    var dir = math.normalizesafe(pts[si + 1] - pts[si]);
                    float prevY = float.NaN;
                    for (float d = -16; d <= 16; d += 1f)
                    {
                        var q = maxAt + dir * d; var qu = FloatingOrigin.ToUtm(q);
                        float top = world.HeightAt(q);
                        world.ReferenceY = float.IsNaN(prevY) ? top : prevY; float carY = world.HeightAt(q); world.ReferenceY = float.NaN;
                        prevY = carY;
                        string g = roads.Nearest(qu, 24, Rally.World.RoadLayer.Ground, out var gh) ? FormattableString.Invariant($"ground way {gh.Id} d {gh.Distance:0.0} roadY {gh.RoadY:0.00} half {gh.Half}") : "no ground road";
                        string dk = roads.Nearest(qu, 24, Rally.World.RoadLayer.Deck, out var dh) ? FormattableString.Invariant($"deck way {dh.Id} d {dh.Distance:0.0} roadY {dh.RoadY:0.00}") : "no deck";
                        sb.Append(FormattableString.Invariant($"\n   {d,4:0} m: top {top:0.00} car {carY:0.00} base {world.BaseHeightAt(qu):0.00} carved {world.CarvedHeightAt(qu):0.00} | {g} | {dk}"));
                    }
                }
                sb.Append(FormattableString.Invariant($"\nsteepest 4 m of the drawn road: {maxGrade * 100:0} % at E {mu.E:0} N {mu.N:0}"));
                sb.Append(FormattableString.Invariant($"\nlink way {k.Id} class {k.RoadClass} {(k.Paved ? "paved" : "gravel")} {k.Length:0} m curv {k.Curvature:0.00} climb {k.Climb:0.000}\n"));
                foreach (var kind in cars)
                {
                    var spec = CarSpec.For(kind);
                    var s = CarState.Create(spec, 1);
                    var d0 = pts[1] - pts[0];
                    CarSim.Reset(ref s, spec, world, pts[0], math.atan2(d0.x, d0.y));
                    int seg = 0, n = 0, onRoad = 0, offCap = 0, dmgCap = 0, worldRoad = 0, ribbonOff = 0, wet = 0;
                    var surf = new int[4];
                    float vmax = 0, maxDist = 0; float t = 0;
                    string firstOff = null, slow = null; float half = k.RoadClass <= 3 && k.RoadClass > 0 ? RoadConstants.TwoLaneHalf : RoadConstants.OneLaneHalf;
                    while (t < 60f)
                    {
                        // Pure pursuit along the link's polyline, braking for the bends ahead (lateral 6 m/s²).
                        while (seg < pts.Count - 2 && math.dot(s.Pos.xz - pts[seg + 1], pts[seg + 1] - pts[seg]) > 0) seg++;
                        if (seg >= pts.Count - 2 && math.dot(s.Pos.xz - pts[pts.Count - 1], pts[pts.Count - 1] - pts[pts.Count - 2]) > 0) break;
                        float look = 8f + s.Speed * 0.35f;
                        float2 target = pts[pts.Count - 1];
                        for (int i = seg + 1; i < pts.Count; i++) if (math.distance(s.Pos.xz, pts[i]) >= look) { target = pts[i]; break; }
                        float vSafe = 200f / 3.6f, run = 0;
                        for (int i = seg + 1; i + 1 < pts.Count && run < 250f; i++)
                        {
                            var a0 = math.normalizesafe(pts[i] - pts[i - 1]); var a1 = math.normalizesafe(pts[i + 1] - pts[i]);
                            float turn = math.acos(math.clamp(math.dot(a0, a1), -1f, 1f));
                            float segLen = math.max(2f, math.distance(pts[i], pts[i + 1]));
                            run += math.distance(pts[i - 1], pts[i]);
                            if (turn > 0.01f) { float r = segLen / turn; float vc = math.sqrt(6f * r); vSafe = math.min(vSafe, math.sqrt(vc * vc + 2f * 6f * run)); }
                        }
                        var to = target - s.Pos.xz;
                        float err = CarSim.WrapAngle(math.atan2(to.x, to.y) - s.Yaw);
                        var input = new CarInput { Throttle = s.Speed < vSafe ? 1f : 0f, Brake = s.Speed > vSafe + 3f ? 1f : 0f, Steer = math.clamp(err * 1.5f, -1f, 1f), GripMode = SlideMode.Minimal };
                        if (layered != null) layered.ReferenceY = s.Pos.y;
                        CarSim.Step(ref s, spec, input, world, route, ReadOnlySpan<WallBox>.Empty, 1f / 60f);
                        if (layered != null) layered.ReferenceY = float.NaN;
                        t += 1f / 60f;
                        float best = float.MaxValue;
                        for (int i = math.max(0, seg - 1); i < math.min(pts.Count - 1, seg + 3); i++) best = math.min(best, DistSeg(s.Pos.xz, pts[i], pts[i + 1]));
                        if (best > 25f) { firstOff = (firstOff ?? "") + " LOST"; break; }
                        if (t < 1f) continue;
                        n++;
                        if (s.OnRoad) onRoad++;
                        else if (firstOff == null) { var u = FloatingOrigin.ToUtm(s.Pos); roads.Nearest(u, 30, out var hh); firstOff = FormattableString.Invariant($"first off road at t {t:0.0} s E {u.E:0} N {u.N:0}: road {hh.Distance:0.0} m away half {hh.Half:0.00} id {hh.Id}"); }
                        if (!s.OnRoad && best <= half + RoadConstants.RoadShoulder) ribbonOff++;
                        if (s.WaterDepth > 0f) wet++;
                        surf[(int)s.SurfaceKind]++;
                        var gs = world.SurfaceAt(s.Pos.xz);
                        if (gs == Surface.Asphalt || gs == Surface.Gravel) worldRoad++;
                        if (!s.OnRoad && s.Speed >= spec.OffroadMax - 0.3f) offCap++;
                        if (s.Speed >= CarSim.DamageSpeedCapHealthy * (1f - s.Damage.Engine) - 0.3f) dmgCap++;
                        vmax = math.max(vmax, s.SpeedKmh);
                        if (slow == null && t > 8f && s.SpeedKmh < 30f && vSafe * 3.6f > 60f && input.Throttle > 0f)
                        { var u = FloatingOrigin.ToUtm(s.Pos); slow = FormattableString.Invariant($"  SLOW at t {t:0.0} E {u.E:0} N {u.N:0}: {s.SpeedKmh:0} km/h gear {s.Gear} rpm {s.Rpm:0} onRoad {s.OnRoad} {s.SurfaceKind} water {s.WaterDepth:0.00} grounded {s.Grounded} slip {s.WheelSlip:0.0} dist {best:0.0}"); }
                        maxDist = math.max(maxDist, best);
                    }
                    n = math.max(1, n);
                    sb.Append(FormattableString.Invariant($"  {kind,-9} top {spec.TopSpeed:0} offmax {spec.OffroadMax * 3.6f:0}: vmax {vmax:0} km/h in {t:0.0} s, onRoad {100f * onRoad / n:0}% worldRoad {100f * worldRoad / n:0}% asph {100f * surf[0] / n:0}% grav {100f * surf[1] / n:0}% off {100f * surf[2] / n:0}%, offroad cap bound {100f * offCap / n:0}%, damage cap {100f * dmgCap / n:0}% dmg {s.Damage.Total * 100:0}% maxDev {maxDist:0.0} m, on ribbon but off road {100f * ribbonOff / n:0}%, wet {100f * wet / n:0}%{(firstOff != null ? "  " + firstOff : "")}{slow}\n"));
                }
            }
            File.WriteAllText(Path.Combine(outDir, "minor_roads.txt"), sb.ToString());
            Debug.Log("PreviewShots minor roads:\n" + sb);
        }

        static float DistSeg(float2 p, float2 a, float2 b)
        {
            var ab = b - a; float t = math.saturate(math.dot(p - a, ab) / math.max(1e-6f, math.dot(ab, ab)));
            return math.distance(p, a + ab * t);
        }
    }
}
