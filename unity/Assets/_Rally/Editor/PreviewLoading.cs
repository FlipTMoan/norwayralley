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
    /// <c>-previewLoading [-previewFreshCache]</c>: the road continuity survey <b>during loading</b>. From the moment play starts,
    /// a snapshot every 5 s for 60 s (longer, up to 180 s, until the car's own tile has its roads): coarse tiles with ground,
    /// tiles with roads drawn, and every drivable way's crossing of a drawn tile's border into a tile whose ground is shown
    /// but whose roads are not drawn (<b>loose</b>: the road visibly ends at the tile edge) or into a tile with no ground
    /// yet (<b>edge</b>: the end of the loaded world). Also drawn ribbon triangles over ground that is not loaded or more than 3 m
    /// over it (<b>floating</b>, DIR/loading_floating.csv),
    /// and the time until the car's tile (the link's start) has its roads. A shot of the game camera every 10 s.
    /// <c>-previewFreshCache</c> starts from an empty cache (a new folder under the output directory).
    /// Writes DIR/loading.txt (one line per snapshot) and DIR/loading_loose.csv (where the loose ends are).
    /// </summary>
    public static partial class PreviewShots
    {
        static bool loadingSurvey;
        static double loadT0, nextSnap, nextShot, carRoadsAt, firstRoadsAt, introAt, osmAllAt;
        static int maxLoose;
        static readonly StringBuilder loadingLog = new StringBuilder();
        static readonly StringBuilder floatCsv = new StringBuilder("t,tile,E,N,why,above\n");
        static readonly StringBuilder looseCsv = new StringBuilder("t,E,N,lat,lon,way,highway,from,to\n");

        static void LoadingArgs(string[] args)
        {
            loadingSurvey = Array.IndexOf(args, "-previewLoading") >= 0;
            // -previewOneMirror: only openstreetmap.fr answers (the others refuse at once), to compare with all healthy servers.
            if (Array.IndexOf(args, "-previewOneMirror") >= 0)
            {
                var eps = Rally.Geo.OverpassMirrors.Endpoints;
                for (int i = 0; i < eps.Length; i++) if (!eps[i].Contains("openstreetmap.fr")) eps[i] = "https://127.0.0.1:9/api/interpreter";
                Debug.Log("PreviewShots: one Overpass server (openstreetmap.fr)");
            }
            // -previewCacheDir DIR: this cache folder (a second run over the same folder shows what a cached area still asks for).
            if (Arg(args, "-previewCacheDir") != null) Rally.Geo.FileBackend.RootOverride = Path.GetFullPath(Arg(args, "-previewCacheDir"));
            else if (Array.IndexOf(args, "-previewFreshCache") >= 0)
            {
                string dir = Path.Combine(Path.GetFullPath(Arg(args, "-previewOut") ?? "Logs/preview"), "fresh-cache-" + DateTime.UtcNow.ToString("HHmmss"));
                Rally.Geo.FileBackend.RootOverride = dir;
                Debug.Log($"PreviewShots: empty cache at {dir}");
            }
        }

        /// <summary>Every editor frame while <c>-previewLoading</c>: the snapshots, then Finish.</summary>
        static void LoadingTick(double now)
        {
            if (!UnityEditor.EditorApplication.isPlaying) return;
            if (loadT0 == 0) { loadT0 = now; FrameProbe.Begin(); nextSnap = now + 5; nextShot = now + 10; loadingLog.Append($"# {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC  {(live ? "live " + query : "fake")}  cache {Rally.Geo.FileBackend.RootOverride ?? "usual"}\n# t  coarse-ready  roads-shown  loose  edge  floating  carRoads  graded-but-hidden  ends-at-a-hidden-bed\n"); }
            if (game == null) game = UnityEngine.Object.FindAnyObjectByType<GameController>();
            if (game == null) return;
            var gt = typeof(GameController);
            world = (TileWorld)gt.GetField("world", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            var roads = (RoadGraph)gt.GetField("roads", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            if (world == null || roads == null) return;
            var anchor = (Utm33)gt.GetField("anchor", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            var carTile = TileKey.At(TileKind.Coarse, anchor);
            double t = now - loadT0;
            var inputs = (IDictionary)Field(roads, "inputs");
            ribbonGos = (Dictionary<TileKey, GameObject>)gt.GetField("ribbons", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            if (firstRoadsAt == 0) foreach (var kv in ribbonGos) if (kv.Value != null && kv.Value.activeSelf) { firstRoadsAt = t; break; }
            if (carRoadsAt == 0 && Drawn(roads, carTile)) { carRoadsAt = t; Debug.Log($"PreviewShots loading: the car's tile has its roads after {t:0.0} s"); }
            if (introAt == 0 && game.Phase == Phase.Intro) introAt = t;
            if (osmAllAt == 0 && t > 5)
            {
                // Every coarse tile the world holds has its OSM roads and map features (the Overpass part of the start area).
                var overlays = (IDictionary)gt.GetField("overlays", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
                bool all = overlays.Count >= 9;
                foreach (DictionaryEntry e in overlays) { var d = (TileOverlay)e.Value; if (d.Roads == null || d.Features == null) { all = false; break; } }
                if (all) osmAllAt = t;
            }
            if (now >= nextShot && t <= 60)
            {
                nextShot += 10;
                cam = game.MainCamera != null ? game.MainCamera : Camera.main;
                if (cam != null)
                {
                    if (rt == null) rt = new RenderTexture(W, H, 24, RenderTextureFormat.ARGB32) { antiAliasing = 4 };
                    cam.targetTexture = rt; cam.Render();
                    Save($"loading_{t:000}s");
                }
            }
            spikeMarks.Add((t, FrameProbe.Spikes.Count));
            // Per tile: when its roads landed, were graded and were shown (the car's tile waits for its 8 neighbours).
            {
                var ovs = (IDictionary)gt.GetField("overlays", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
                foreach (DictionaryEntry e in ovs)
                {
                    var k = (TileKey)e.Key; var d = (TileOverlay)e.Value;
                    if (!tileTimes.TryGetValue(k, out var tt)) tileTimes[k] = tt = new double[] { -1, -1, -1, -1 };
                    if (tt[0] < 0 && d.Roads != null) tt[0] = t;
                    if (tt[3] < 0 && d.SurfacesTried) tt[3] = t;
                    if (tt[1] < 0 && roads.HasTile(k)) tt[1] = t;
                    if (tt[2] < 0 && ribbonGos.TryGetValue(k, out var rg) && rg != null && rg.activeSelf) tt[2] = t;
                }
            }
            // The queue state of the car's tile and its neighbours whenever it changes (why a tile with its roads in waits).
            {
                var res = (IEnumerable)gt.GetField("results", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
                var active = gt.GetField("activeOverlay", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
                var ovs = (IDictionary)gt.GetField("overlays", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
                string activeKey = active != null ? active.GetType().GetField("Key").GetValue(active).ToString() : "-";
                var sbq = new StringBuilder();
                foreach (DictionaryEntry e in ovs)
                {
                    var k = (TileKey)e.Key; var d = (TileOverlay)e.Value;
                    if (math.max(math.abs(k.I - carTile.I), math.abs(k.J - carTile.J)) > 1 || roads.HasTile(k)) continue;
                    int inQ = 0; bool stepping = false;
                    foreach (var r in res) if (r.GetType().GetField("Key").GetValue(r).Equals(k)) { inQ++; stepping |= (bool)r.GetType().GetField("Stepping").GetValue(r); }
                    sbq.Append($" {k.I}_{k.J}[{d.Pending} q{inQ}{(stepping ? " step" : "")}{(d.Queued ? " queued" : "")}{(world.Scheduler.IsReady(k) ? "" : " notready")}]");
                }
                string line = $"active {activeKey} queue {((ICollection)res).Count}:{sbq}";
                if (line != lastQueueLine) { queueLog.Append(string.Format(CultureInfo.InvariantCulture, "{0,6:0.0} {1}\n", t, line)); lastQueueLine = line; }
            }
            if (now < nextSnap) return;
            nextSnap += 5;
            Snapshot(t, roads, inputs, carTile);
            bool done = t >= 60 && (carRoadsAt > 0 && osmAllAt > 0 || t >= 180);
            if (!done) return;
            var inv = CultureInfo.InvariantCulture;
            loadingLog.Append(string.Format(inv, "# first roads anywhere {0:0.0} s; the car's tile {1}; the start screen (Intro) {2}; max loose {3}; OSM roads + features of every tile in {4}\n",
                firstRoadsAt, carRoadsAt > 0 ? carRoadsAt.ToString("0.0", inv) + " s" : "not in 180 s", introAt > 0 ? introAt.ToString("0.0", inv) + " s" : "not reached", maxLoose,
                osmAllAt > 0 ? osmAllAt.ToString("0.0", inv) + " s" : "not in the run"));
            File.WriteAllText(Path.Combine(outDir, "loading.txt"), loadingLog.ToString());
            File.WriteAllText(Path.Combine(outDir, "loading_loose.csv"), looseCsv.ToString());
            File.WriteAllText(Path.Combine(outDir, "loading_floating.csv"), floatCsv.ToString());
            // Where the main thread went while loading (FrameProbe sections, '.' = nested in another).
            var prof = new StringBuilder("# section  total_ms  calls\n");
            var tot = new List<KeyValuePair<string, (double ms, int calls)>>(FrameProbe.Totals);
            tot.Sort((a, b) => b.Value.ms.CompareTo(a.Value.ms));
            foreach (var kv in tot) prof.Append(string.Format(inv, "{0,-24} {1,9:0} {2,8}\n", kv.Key, kv.Value.ms, kv.Value.calls));
            File.WriteAllText(Path.Combine(outDir, "loading_profile.txt"), prof.ToString());
            var tl = new StringBuilder("tile,ring,landed,graded,shown,surfaces\n");
            var keys = new List<TileKey>(tileTimes.Keys);
            keys.Sort((a, b) => tileTimes[a][1].CompareTo(tileTimes[b][1]));
            foreach (var k in keys)
            {
                int ring = math.max(math.abs(k.I - carTile.I), math.abs(k.J - carTile.J));
                var tt = tileTimes[k];
                tl.Append(string.Format(inv, "{0}_{1},{2},{3:0.0},{4:0.0},{5:0.0},{6:0.0}\n", k.I, k.J, ring, tt[0], tt[1], tt[2], tt[3]));
            }
            File.WriteAllText(Path.Combine(outDir, "loading_tiles.csv"), tl.ToString());
            var sp = new StringBuilder();
            for (int i = 0, m = 0; i < FrameProbe.Spikes.Count; i++)
            {
                while (m < spikeMarks.Count && spikeMarks[m].count <= i) m++;
                sp.Append(string.Format(inv, "{0,6:0.0} s {1}\n", m < spikeMarks.Count ? spikeMarks[m].t : t, FrameProbe.Spikes[i]));
            }
            File.WriteAllText(Path.Combine(outDir, "loading_spikes.txt"), sp.ToString());
            File.WriteAllText(Path.Combine(outDir, "loading_queue.txt"), queueLog.ToString());
            FrameProbe.End();
            Debug.Log("PreviewShots loading:\n" + loadingLog);
            Finish(0);
        }

        static Dictionary<TileKey, GameObject> ribbonGos;
        static readonly Dictionary<TileKey, double[]> tileTimes = new Dictionary<TileKey, double[]>();
        static readonly List<(double t, int count)> spikeMarks = new List<(double, int)>();
        static readonly StringBuilder queueLog = new StringBuilder();
        static string lastQueueLine;

        /// <summary>The tile's roads are on screen: its ribbon is shown (a tile with roads and no ribbon has nothing to draw).</summary>
        static bool Drawn(RoadGraph roads, TileKey k)
            => ribbonGos.TryGetValue(k, out var go) && go != null ? go.activeSelf : roads.HasTile(k);

        static void Snapshot(double t, RoadGraph roads, IDictionary inputs, TileKey carTile)
        {
            int ready = 0, roadsIn = 0, loose = 0, edge = 0, floating = 0, hidden = 0, bed = 0;
            foreach (var kv in world.Tiles) if (kv.Key.Kind == TileKind.Coarse && world.Scheduler.IsReady(kv.Key)) ready++;
            var inv = CultureInfo.InvariantCulture;
            var seen = new HashSet<(long, long)>();
            foreach (DictionaryEntry e in inputs)
            {
                var key = (TileKey)e.Key;
                if (!roads.HasTile(key)) continue;
                if (!Drawn(roads, key)) { hidden++; continue; }
                roadsIn++;
                var data = (Rally.Geo.RoadGraphData)e.Value.GetType().GetField("Item1").GetValue(e.Value);
                if (data?.Ways == null) continue;
                var b = key.Bounds;
                foreach (var w in data.Ways)
                {
                    if (ProfileGrader.LaneSpecFor(w.Tags) == null || w.Nodes == null) continue;
                    for (int i = 0; i + 1 < w.Nodes.Count; i++)
                    {
                        var a = new double2(w.Nodes[i].E, w.Nodes[i].N); var c = new double2(w.Nodes[i + 1].E, w.Nodes[i + 1].N);
                        if (!Clip(a, c, b, out double t0, out double t1)) continue;
                        // Where the segment leaves (or enters) the tile, the tile on the other side.
                        for (int side = 0; side < 2; side++)
                        {
                            double tc = side == 0 ? t0 : t1;
                            if (side == 0 ? t0 <= 0 : t1 >= 1) continue;
                            var dir = math.normalizesafe(c - a) * (side == 0 ? -1 : 1);
                            var at = math.lerp(a, c, tc);
                            var beyond = at + dir * 0.5;
                            var other = TileKey.At(TileKind.Coarse, new Utm33(beyond.x, beyond.y));
                            if (other.Equals(key) || Drawn(roads, other)) continue;
                            long cell = ((long)math.round(at.x) << 24) ^ (long)math.round(at.y);
                            if (!seen.Add((w.Id, cell))) continue;
                            if (roads.HasTile(other)) bed++;   // the neighbour's roads are graded and carved, its ribbon not shown yet
                            else if (world.Scheduler.IsReady(other))
                            {
                                loose++;
                                var ll = Proj.ToLatLon(new Utm33(at.x, at.y));
                                looseCsv.Append(string.Format(inv, "{0:0},{1:0.0},{2:0.0},{3:0.000000},{4:0.000000},{5},{6},{7},{8}\n", t, at.x, at.y, ll.Lat, ll.Lon, w.Id, w.Tags["highway"], key, other));
                            }
                            else edge++;
                        }
                    }
                }
            }
            // Drawn ribbon triangles (every 8th, at its centre) over ground that is not shown, and more than 3 m over the shown
            // ground (decks are their own meshes; the ribbon lies on the carved ground).
            foreach (var kv in ribbonGos)
            {
                if (!kv.Value.activeSelf) continue;
                var mesh = kv.Value.GetComponent<MeshFilter>()?.sharedMesh;
                if (mesh == null) continue;
                var v = mesh.vertices; var tri = mesh.triangles; var p0 = kv.Value.transform.position;
                for (int i = 0; i + 2 < tri.Length; i += 24)
                {
                    var c = (v[tri[i]] + v[tri[i + 1]] + v[tri[i + 2]]) / 3f;
                    var xz = new float2(p0.x + c.x, p0.z + c.z);
                    bool off = !world.IsLoaded(xz);
                    float drawnGround = world.CarvedHeightAt(FloatingOrigin.ToUtm(xz));   // what the clipmap draws (HeightAt is the car's ground: tunnel floors too)
                    bool high = !off && p0.y + c.y - drawnGround > 3f;
                    if (!off && !high) continue;
                    floating++;
                    var u = FloatingOrigin.ToUtm(xz);
                    floatCsv.Append(string.Format(inv, "{0:0},{1},{2:0.0},{3:0.0},{4},{5:0.0}\n", t, $"{kv.Key.I}_{kv.Key.J}", u.E, u.N, off ? "no ground" : "high", off ? 0 : p0.y + c.y - drawnGround));
                }
            }
            maxLoose = math.max(maxLoose, loose);
            string line = string.Format(inv, "{0,5:0} {1,5} {2,5} {3,6} {4,5} {5,6}  {6,-4} {7,5} {8,6}\n", t, ready, roadsIn, loose, edge, floating, Drawn(roads, carTile) ? "yes" : "no", hidden, bed);
            loadingLog.Append(line);
            Debug.Log("PreviewShots loading snapshot: " + line.Trim());
            var mirrors = typeof(GameController).GetField("overpassMirrors", BindingFlags.NonPublic | BindingFlags.Instance)?.GetValue(game) as Rally.Geo.OverpassMirrors;
            if (mirrors != null) Debug.Log("PreviewShots loading mirrors: " + mirrors.Health());
        }

        /// <summary>Liang–Barsky: the part [t0, t1] of segment a→c inside the box, false when none.</summary>
        static bool Clip(double2 a, double2 c, Bounds25833 b, out double t0, out double t1)
        {
            t0 = 0; t1 = 1;
            var d = c - a;
            double[] p = { -d.x, d.x, -d.y, d.y }, q = { a.x - b.MinE, b.MaxE - a.x, a.y - b.MinN, b.MaxN - a.y };
            for (int i = 0; i < 4; i++)
            {
                if (math.abs(p[i]) < 1e-12) { if (q[i] < 0) return false; continue; }
                double r = q[i] / p[i];
                if (p[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
                else { if (r < t0) return false; if (r < t1) t1 = r; }
            }
            return t1 > t0;
        }
    }
}
