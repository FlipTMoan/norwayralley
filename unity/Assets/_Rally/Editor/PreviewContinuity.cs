using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Text;
using Rally.Core;
using Rally.Gameplay;
using Rally.Roads;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Editor
{
    /// <summary>
    /// <c>-previewContinuity</c>: the road continuity survey. Once the roads around the start are graded and drawn (the overlay
    /// queue idle), walks every fetched drivable OSM way of the loaded tiles every 2 m along its graded line and checks the drawn
    /// ribbon (raycast against temporary colliders of the ribbon meshes, ±1.5 m around the graded height): <b>gap</b> (no ribbon),
    /// <b>step</b> (the drawn height changes by more than 0.5 m over 2 m), <b>joint</b> (two ways sharing an OSM node graded more
    /// than 0.5 m apart there), <b>portal</b> (a tube end with neither ribbon nor ground within ±1.5 m of the floor 3 m outside),
    /// <b>bridge_end</b> (likewise beyond a deck's abutment), <b>dropped</b> (a fetched way never graded or never drawn), each
    /// flagged <c>seam</c> within 4 m of a coarse tile border. Only points whose coarse tile has its roads in are looked at.
    /// Writes DIR/continuity.csv, DIR/continuity.txt and DIR/continuity_spots.txt (the worst places, shot as cont_*);
    /// <c>-previewContSpots FILE</c> shoots those places instead, so a before and an after run look at the same road.
    /// </summary>
    public static partial class PreviewShots
    {
        static bool continuity;
        static string contSpotsFile;
        static double contWaitSince;

        /// <summary>Step 50: wait (at most 240 s) until no tile result or overlay is pending, then plan the shots and survey.</summary>
        static bool ContinuityReady(double now)
        {
            if (contWaitSince == 0) contWaitSince = now;
            var gt = typeof(GameController);
            var results = (ICollection)gt.GetField("results", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            var active = gt.GetField("activeOverlay", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            bool idle = results.Count == 0 && active == null;
            if (!idle && now - contWaitSince < 240) return false;
            Debug.Log($"PreviewShots continuity: overlay queue {(idle ? "idle" : "still busy")} after {now - contWaitSince:0} s");
            return true;
        }

        sealed class Finding { public string Kind; public long Way; public string Highway, Name; public double2 P; public float Metric, Y, Extra; public bool Seam; public double2 Dir; }

        static object Field(object o, string name) => o.GetType().GetField(name, BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.Instance).GetValue(o);

        static void ContinuityReport()
        {
            const int layer = 31;
            var roads = (RoadGraph)typeof(GameController).GetField("roads", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            var ribbonGos = (Dictionary<TileKey, GameObject>)typeof(GameController).GetField("ribbons", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            foreach (var go in ribbonGos.Values)
            {
                var mf = go.GetComponent<MeshFilter>();
                var mc = go.AddComponent<MeshCollider>(); mc.sharedMesh = mf.sharedMesh; go.layer = layer;
            }
            Physics.SyncTransforms();
            var graded = (IDictionary)Field(roads, "graded");
            var inputs = (IDictionary)Field(roads, "inputs");
            var nodeWays = (Dictionary<long, List<(long way, int sample)>>)Field(roads, "nodeWays");
            // The raw ways of every tile with its roads in, once each.
            var raw = new Dictionary<long, Rally.Geo.RoadWay>();
            int tiles = 0;
            foreach (DictionaryEntry e in inputs)
            {
                var key = (TileKey)e.Key;
                if (!roads.HasTile(key)) continue;
                tiles++;
                var data = (Rally.Geo.RoadGraphData)e.Value.GetType().GetField("Item1").GetValue(e.Value);
                if (data?.Ways == null) continue;
                foreach (var w in data.Ways) raw[w.Id] = w;
            }
            // A point counts when the tiles of everything within 6 m of it have their roads in: the ribbon piece over it may be
            // drawn by the neighbour (the tile holding the segment's middle), which at the edge of the loaded area is not in.
            bool Surveyed(double2 p)
            {
                for (int dj = -1; dj <= 1; dj++)
                    for (int di = -1; di <= 1; di++)
                        if (!roads.HasTile(TileKey.At(TileKind.Coarse, new Utm33(p.x + di * 6, p.y + dj * 6)))) return false;
                return true;
            }
            bool Seam(double2 p)
            {
                double s = TileScheduler.CoarseSize, fe = p.x - math.floor(p.x / s) * s, fn = p.y - math.floor(p.y / s) * s;
                return fe < 4 || fe > s - 4 || fn < 4 || fn > s - 4;
            }
            float Lift(float half) => RoadConstants.RoadLift + RoadConstants.SurfaceLift(0, half);
            bool Drawn(double2 p, float y, out float hitY)
            {
                var xz = FloatingOrigin.ToWorldXZ(new Utm33(p.x, p.y));
                hitY = float.NaN;
                if (!Physics.Raycast(new Vector3(xz.x, y + 1.5f, xz.y), Vector3.down, out var hit, 3f, 1 << layer)) return false;
                hitY = hit.point.y; return true;
            }
            var found = new List<Finding>();
            int waysDrivable = 0, waysGraded = 0, portals = 0, bridgeEnds = 0;
            double walked = 0;
            var gapLen = new List<float>();
            foreach (var w in raw.Values)
            {
                var spec = ProfileGrader.LaneSpecFor(w.Tags);
                if (spec == null) continue;
                waysDrivable++;
                string hw = w.Tags["highway"], name = w.Tags.TryGetValue("name", out var nm) ? nm : "";
                if (!graded.Contains(w.Id))
                {
                    if (w.Nodes.Count >= 2 && Surveyed(new double2(w.Nodes[0].E, w.Nodes[0].N)))
                        found.Add(new Finding { Kind = "dropped", Way = w.Id, Highway = hw, Name = name, P = new double2(w.Nodes[0].E, w.Nodes[0].N), Metric = 0, Dir = new double2(0, 1) });
                    continue;
                }
                waysGraded++;
                var g = graded[w.Id];
                var pts = (List<double2>)Field(g, "Points");
                var hs = (double[])Field(g, "Heights");
                var bridge = (bool[])Field(g, "Bridge");
                var tunnel = (TunnelKind)Field(g, "Tunnel");
                float half = spec.Value.Half, lift = Lift(half);
                // Walk every 2 m (from 0.5 m in to 0.5 m before the end).
                float prevY = float.NaN, prevExp = float.NaN; double2 prevP = default; bool inGap = false; Finding gap = null; int drawnAny = 0, looked = 0;
                double wayLen = LengthOf(pts), segStart = 0;
                int seg = 0;
                for (double sAt = 0.5; sAt <= wayLen - 0.5; sAt += 2)
                {
                    while (seg + 2 < pts.Count && segStart + math.distance(pts[seg], pts[seg + 1]) < sAt) { segStart += math.distance(pts[seg], pts[seg + 1]); seg++; }
                    double L = math.max(1e-6, math.distance(pts[seg], pts[seg + 1]));
                    double t = math.saturate((sAt - segStart) / L);
                    var p = math.lerp(pts[seg], pts[seg + 1], t);
                    if (!Surveyed(p)) { prevY = float.NaN; inGap = false; continue; }
                    looked++; walked += 2;
                    float y = (float)math.lerp(hs[seg], hs[seg + 1], t) + lift;
                    var dir = math.normalizesafe(pts[seg + 1] - pts[seg]);
                    if (!Drawn(p, y, out float hy))
                    {
                        if (!inGap) { gap = new Finding { Kind = "gap", Way = w.Id, Highway = hw, Name = name, P = p, Metric = 0, Y = y, Extra = (float)math.min(sAt, wayLen - sAt), Seam = Seam(p), Dir = dir }; found.Add(gap); inGap = true; }
                        gap.Metric += 2; gap.Seam |= Seam(p);
                        prevY = float.NaN;
                        continue;
                    }
                    drawnAny++;
                    inGap = false;
                    if (!float.IsNaN(prevY) && math.distance(p, prevP) < 2.5)
                    {
                        // A step in the drawn surface (against the way's own graded profile), or a graded profile that steep.
                        float drawnStep = math.abs((hy - prevY) - (y - prevExp)), grade = math.abs(y - prevExp);
                        if (drawnStep > 0.5f)
                            found.Add(new Finding { Kind = "step", Way = w.Id, Highway = hw, Name = name, P = p, Metric = drawnStep, Y = y, Seam = Seam(p), Dir = dir });
                        else if (grade > 0.5f)
                        {
                            var a = p - dir * 5; var b = p + dir * 5;
                            float groundGrade = math.abs(world.BaseHeightAt(new Utm33(b.x, b.y)) - world.BaseHeightAt(new Utm33(a.x, a.y))) / 5f;
                            found.Add(new Finding { Kind = "steep", Way = w.Id, Highway = hw, Name = name, P = p, Metric = grade, Y = y, Extra = groundGrade, Seam = Seam(p), Dir = dir });
                        }
                    }
                    prevY = hy; prevExp = y; prevP = p;
                }
                if (looked > 0 && drawnAny == 0)
                    found.Add(new Finding { Kind = "dropped", Way = w.Id, Highway = hw, Name = name, P = pts[0], Metric = (float)LengthOf(pts), Dir = math.normalizesafe(pts[pts.Count - 1] - pts[0]) });
                // Tube ends and deck abutments: 3 m beyond, a road or the ground at the floor / deck height.
                void EndCheck(string kind, int idx, int inner)
                {
                    var p0 = pts[idx];
                    if (!Surveyed(p0)) return;
                    var outward = math.normalizesafe(p0 - pts[inner]);
                    var q = p0 + outward * 3;
                    float y = (float)hs[idx] + lift;
                    float ground = world.CarvedHeightAt(new Utm33(q.x, q.y));
                    bool road = Drawn(q, y, out _);
                    if (kind == "portal") portals++; else bridgeEnds++;
                    if (!road && math.abs(ground - y) > 1.5f)
                        found.Add(new Finding { Kind = kind, Way = w.Id, Highway = hw, Name = name, P = p0, Metric = ground - y, Y = y, Seam = Seam(p0), Dir = -outward });
                }
                if (tunnel == TunnelKind.Tube && pts.Count >= 2) { EndCheck("portal", 0, 1); EndCheck("portal", pts.Count - 1, pts.Count - 2); }
                for (int i = 0; i < pts.Count; i++)
                {
                    if (!bridge[i]) continue;
                    bool start = i == 0 || !bridge[i - 1], end = i == pts.Count - 1 || !bridge[i + 1];
                    // Only where the deck ends with the way (inside a way the road goes on from the abutment by itself).
                    if (start && i == 0 && pts.Count > 1) EndCheck("bridge_end", 0, 1);
                    if (end && i == pts.Count - 1 && pts.Count > 1) EndCheck("bridge_end", i, i - 1);
                }
            }
            // Joints: ways sharing an OSM node graded apart there.
            foreach (var kv in nodeWays)
            {
                if (kv.Value.Count < 2) continue;
                double lo = double.MaxValue, hi = double.MinValue; long wl = 0; double2 at = default; float jy = 0;
                foreach (var (way, sample) in kv.Value)
                {
                    if (!graded.Contains(way)) continue;
                    var g = graded[way];
                    var pts = (List<double2>)Field(g, "Points"); var hs = (double[])Field(g, "Heights");
                    if (sample < 0 || sample >= hs.Length) continue;
                    // A deck or tube interior node passes over/under: only ground samples and way ends.
                    lo = math.min(lo, hs[sample]); if (hs[sample] > hi) { hi = hs[sample]; wl = way; at = pts[sample]; }
                    jy = (float)hs[sample];
                }
                if (hi - lo > 0.5 && Surveyed(at))
                {
                    raw.TryGetValue(wl, out var rw);
                    found.Add(new Finding { Kind = "joint", Way = wl, Highway = rw?.Tags["highway"] ?? "", Name = rw != null && rw.Tags.TryGetValue("name", out var n2) ? n2 : "", P = at, Metric = (float)(hi - lo), Y = jy, Seam = Seam(at), Dir = new double2(0, 1) });
                }
            }
            // Why the first gaps are gaps: the samples there (covered?) and the roads near (id, kind, distance, height).
            var why = new StringBuilder();
            int nWhy = 0;
            var nearestAny = typeof(RoadGraph).GetMethod("Nearest", BindingFlags.NonPublic | BindingFlags.Instance, null, new[] { typeof(Utm33), typeof(double), typeof(RoadLayer), typeof(long), typeof(RoadHit).MakeByRefType() }, null);
            foreach (var f in found)
            {
                if (f.Kind != "gap" || nWhy++ >= 40 || !graded.Contains(f.Way)) continue;
                var g = graded[f.Way];
                var pts = (List<double2>)Field(g, "Points"); var hs = (double[])Field(g, "Heights"); var cov = (bool[])Field(g, "Covered");
                int k = 0; double best = double.MaxValue;
                for (int i = 0; i < pts.Count; i++) { double dd = math.distance(pts[i], f.P); if (dd < best) { best = dd; k = i; } }
                why.Append(FormattableString.Invariant($"gap way {f.Way} {f.Highway} {f.Metric:0} m at {f.P.x:0.0} {f.P.y:0.0} (sample {k} of {pts.Count}):"));
                for (int i = math.max(0, k - 2); i < math.min(pts.Count, k + 4); i++)
                {
                    var args = new object[] { new Utm33(pts[i].x, pts[i].y), 8.0, RoadLayer.Any, f.Way, null };
                    bool hit = (bool)nearestAny.Invoke(roads, args);
                    var q = hit ? (RoadHit)args[4] : default;
                    raw.TryGetValue(q.Id, out var qw);
                    why.Append(FormattableString.Invariant($" [{i}{(cov[i] ? " C" : "")} y{hs[i]:0.00}{(hit ? $" near {q.Id} {qw?.Tags["highway"]} d{q.Distance:0.0} y{q.RoadY:0.00}{(q.Bridge ? " deck" : "")}{(q.Tunnel ? " tube" : "")}" : "")}]"));
                }
                why.Append('\n');
            }
            File.WriteAllText(Path.Combine(outDir, "continuity_why.txt"), why.ToString());
            // Report.
            var inv = CultureInfo.InvariantCulture;
            var csv = new StringBuilder("kind,way,highway,name,E,N,lat,lon,metric,seam,y,extra,ground\n");
            foreach (var f in found)
            {
                var ll = Proj.ToLatLon(new Utm33(f.P.x, f.P.y));
                csv.Append(string.Format(inv, "{0},{1},{2},\"{3}\",{4:0.0},{5:0.0},{6:0.000000},{7:0.000000},{8:0.00},{9},{10:0.0},{11:0.00},{12:0.0}\n", f.Kind, f.Way, f.Highway, f.Name.Replace("\"", "'"), f.P.x, f.P.y, ll.Lat, ll.Lon, f.Metric, f.Seam ? 1 : 0, f.Y, f.Extra, world.BaseHeightAt(new Utm33(f.P.x, f.P.y))));
            }
            File.WriteAllText(Path.Combine(outDir, "continuity.csv"), csv.ToString());
            var sb = new StringBuilder($"# {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC  {(live ? "live " + query : "fake")}\n");
            sb.Append(FormattableString.Invariant($"tiles with roads in: {tiles}; drivable ways {waysDrivable}, graded {waysGraded}; walked {walked / 1000:0.0} km; tube ends {portals}, deck ends at way ends {bridgeEnds}\n"));
            foreach (var kind in new[] { "gap", "step", "steep", "joint", "portal", "bridge_end", "dropped" })
            {
                int c = 0, seam = 0; float sum = 0, max = 0;
                foreach (var f in found) if (f.Kind == kind) { c++; if (f.Seam) seam++; sum += math.abs(f.Metric); max = math.max(max, math.abs(f.Metric)); }
                sb.Append(FormattableString.Invariant($"{kind}: {c} (at a tile seam {seam}), sum {sum:0.0}, max {max:0.00}\n"));
            }
            { int c = 0, flat = 0; foreach (var f in found) if (f.Kind == "steep") { c++; if (f.Extra < 0.15f) flat++; } sb.Append($"  steep graded where the ground under it is under 15 %: {flat} of {c}\n"); }
            var byClass = new SortedDictionary<string, (int n, float m)>();
            foreach (var f in found) if (f.Kind == "gap") { byClass.TryGetValue(f.Highway, out var v); byClass[f.Highway] = (v.n + 1, v.m + f.Metric); }
            foreach (var kv in byClass) sb.Append(FormattableString.Invariant($"  gaps on {kv.Key}: {kv.Value.n}, {kv.Value.m:0} m\n"));
            // The worst places: longest gaps, open portals and deck ends, biggest steps and joints.
            var spots = new List<Finding>();
            void Take(string kind, int n)
            {
                var l = found.FindAll(f => f.Kind == kind);
                l.Sort((a, b) => math.abs(b.Metric).CompareTo(math.abs(a.Metric)));
                foreach (var f in l)
                {
                    if (n == 0) break;
                    bool near = false; foreach (var s in spots) if (math.distance(s.P, f.P) < 40) near = true;
                    if (near) continue;
                    spots.Add(f); n--;
                }
            }
            Take("portal", 3); Take("bridge_end", 2); Take("gap", 4); Take("joint", 2); Take("step", 3);
            var spotText = new StringBuilder();
            foreach (var s in spots) spotText.Append(string.Format(inv, "{0} {1:0.00} {2:0.0} {3:0.0} {4:0.###} {5:0.###} {6} {7:0.0}\n", s.Kind, s.Metric, s.P.x, s.P.y, s.Dir.x, s.Dir.y, s.Way, s.Y));
            File.WriteAllText(Path.Combine(outDir, "continuity_spots.txt"), spotText.ToString());
            sb.Append("worst places (kind metric E N dirE dirN way roadY):\n").Append(spotText);
            File.WriteAllText(Path.Combine(outDir, "continuity.txt"), sb.ToString());
            Debug.Log("PreviewShots continuity:\n" + sb);
            foreach (var go in ribbonGos.Values) { UnityEngine.Object.Destroy(go.GetComponent<MeshCollider>()); go.layer = 0; }
            JoinReport(roads, raw, Surveyed, Seam);
            ContinuityShots(contSpotsFile != null && File.Exists(contSpotsFile) ? File.ReadAllText(contSpotsFile) : spotText.ToString());
        }

        static double LengthOf(List<double2> pts) { double s = 0; for (int i = 1; i < pts.Count; i++) s += math.distance(pts[i], pts[i - 1]); return s; }

        /// <summary>Two shots per place: along the road from 30 m back, 4 m up, and from 18 m to the side, 9 m up.</summary>
        static void ContinuityShots(string text)
        {
            var inv = CultureInfo.InvariantCulture;
            int i = 0;
            foreach (var line in text.Split('\n'))
            {
                var v = line.Trim().Split(' ');
                if (v.Length < 6) continue;
                var at = FloatingOrigin.ToWorldXZ(new Utm33(double.Parse(v[2], inv), double.Parse(v[3], inv)));
                var dir = math.normalizesafe(new float2(float.Parse(v[4], inv), float.Parse(v[5], inv)), new float2(0, 1));
                var side = new float2(dir.y, -dir.x);
                string name = $"cont_{i++:00}_{v[0]}";
                // At the road's height there (a deck over a gorge, a portal under a cliff), else over the ground.
                float y = v.Length > 7 ? float.Parse(v[7], inv) : float.NaN;
                if (float.IsNaN(y)) { shots.Enqueue(($"{name}_along", () => Look(at - dir * 30, 4f, at + dir * 8, 0f))); shots.Enqueue(($"{name}_side", () => Look(at + side * 18 - dir * 6, 9f, at, 0f))); continue; }
                void LookY(float2 from, float fy, float2 to, float ty) { ClearLineup(); var pf = new Vector3(from.x, fy, from.y); cam.transform.position = pf; cam.transform.rotation = Quaternion.LookRotation(new Vector3(to.x, ty, to.y) - pf, Vector3.up); }
                shots.Enqueue(($"{name}_along", () => LookY(at - dir * 30, y + 5f, at + dir * 8, y)));
                shots.Enqueue(($"{name}_side", () => LookY(at + side * 22 - dir * 8, y + 12f, at, y)));
            }
        }
    }
}
