using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Roads
{
    public struct RoadSample
    {
        public double2 P;      // EPSG:25833
        public float RoadY;    // graded carriageway height (no lift)
        public float S;        // metres along the run
        /// <summary>On another road's carriageway (a junction): that road's ribbon is drawn there, this one's is not.</summary>
        public bool Covered;
        /// <summary>On a bridge span (its two end samples are the abutments on the banks); <see cref="Pier"/>: a pier stands under it.</summary>
        public bool Bridge, Pier;
    }

    /// <summary>A prepared run of one OSM way inside a tile: what the carve, the ribbon and the index consume (roads.js finishRun).</summary>
    public sealed class RoadPolyline
    {
        public long Id;
        public string Name, Kind;
        public LaneSpec Lanes;
        public bool Paved;
        public Surface Surface => Paved ? Surface.Asphalt : Surface.Gravel;
        public List<RoadSample> Samples;
        public float Length;
    }

    /// <summary>
    /// One stretch of a way between two junction nodes (or a way end), both directions stored, for the
    /// endless-stage generator (Rally.Track.RoadWalk reads it through Rally.Track.RoadGraphEdges).
    /// <see cref="Points"/> are the graded 5 m samples from <see cref="From"/> to <see cref="To"/>, so a
    /// stage built from links follows the real bends, not the straight line between junctions.
    /// </summary>
    public sealed class RoadLink
    {
        public long Id;                 // OSM way
        public long From, To;           // node keys (RoadGraph.NodeKey)
        public float Length;            // m
        public float Curvature;         // mean |Δheading| per 100 m, radians
        public float Climb;             // |Δelevation| / Length
        public bool Paved, Barred;
        public byte RoadClass;          // 0 motorway/trunk, 1 primary, 2 secondary, 3 tertiary, 4 minor, 5 track
        public List<double2> Points;
        public float[] Heights;
    }

    /// <summary>Road metres of one tile (padded, as the ribbon) by material and by where the material came from.</summary>
    public struct SurfaceStats
    {
        public float AsphaltM, GravelM;
        public float NvdbM, OsmTagM, DefaultM;
        public int NvdbLines;                   // NVDB Vegdekke polylines passed to SetTile
        public override string ToString() => FormattableString.Invariant(
            $"surface {AsphaltM / 1000:0.0} km asphalt, {GravelM / 1000:0.0} km gravel; from NVDB {NvdbM / 1000:0.0} km ({NvdbLines} lines), OSM tag {OsmTagM / 1000:0.0} km, default {DefaultM / 1000:0.0} km");
    }

    /// <summary>A pose for the car: position in EPSG:25833, yaw = atan2(tangent.E, tangent.N) like stage.js.</summary>
    public readonly struct RoadPose
    {
        public readonly Utm33 Position;
        public readonly float Yaw;
        public RoadPose(Utm33 p, float yaw) { Position = p; Yaw = yaw; }
    }

    /// <summary>
    /// The real roads of the streamed world (port of roads.js prepareChunkRoads + RoadNetwork). Every
    /// tile's OSM ways become smoothed, 5 m-resampled, graded centre lines (grading on the coarse ground
    /// only and once per way, so every tile that holds a piece of a road computes the same heights and
    /// the copies agree where they overlap), then segments in 48 m buckets that the car, the trees, the
    /// houses and the signs query for "how far is the nearest road". In free drive the network *is* the
    /// route: <see cref="Nearest"/>, <see cref="RoadWidth"/>, <see cref="StartPose"/> and the HUD fields are what
    /// car.js / stage.js read from a StageRoute.
    /// </summary>
    public sealed class RoadGraph : IRoadQuery
    {
        public const double Cell = 48;          // roads.js RoadNetwork cell
        public const double TilePad = 60;       // roads.js prepareChunkRoads pad
        const int FadeJ = 12;                   // junction easing: ±12 samples = ±60 m
        /// <summary>Chaikin rounds for the plan line (roads.js uses 2, and kept junction nodes as corners): each round halves the
        /// turn at every vertex, so four leave a 90° OSM corner as sixteen ~6° steps instead of four ~22° kinks the car and
        /// the ribbon felt (ProfileGrader.SmoothThrough).</summary>
        public const int SmoothRounds = 4;
        /// <summary>Metres beyond another road's flat band over which a joining road keeps that road's height, then the
        /// length of the smoothstep back to its own grade (EaseOntoJunctions).</summary>
        public const double JunctionFlat = 6, JunctionRamp = 25;
        public const double SurfaceMaxDist = RoadSurfaceIndex.DefaultMaxDist;   // roads.js assignSurfaces maxDist
        public const int MinSurfaceRun = 4;     // samples (20 m): shorter NVDB surface flips are absorbed by their neighbour
        /// <summary>A bridge deck this far above or below another road's grade passes over it: no junction easing between them.</summary>
        public const double PassOver = 2.5;
        /// <summary>
        /// No road is graded from ground under this (the sea plane + 0.5 m): quay and shore roads over the DTM's sea cells (height 0)
        /// used to be graded to ~0.3 m and drawn under the 0.45 m sea plane (183 of 4143 live road points at Sand); a road that
        /// crosses the sea with water on both sides is a bridge instead (<see cref="Bridges"/>).
        /// </summary>
        public const double MinGradeGround = Water.SeaLevel + 0.5;
        enum SurfaceSource : byte { Nvdb, OsmTag, Default }

        sealed class Seg
        {
            public long Id; public double2 A, B; public float Ya, Yb; public LaneSpec Lanes; public bool Paved;
            /// <summary>Both ends on a bridge span.</summary>
            public bool Bridge;
        }
        sealed class GradedWay { public List<double2> Points; public double[] Heights; public bool[] Covered, Bridge, Pier; public int Refs; }

        readonly Dictionary<long, List<Seg>> buckets = new Dictionary<long, List<Seg>>();
        readonly Dictionary<TileKey, List<(long bucket, Seg seg)>> byTile = new Dictionary<TileKey, List<(long, Seg)>>();
        readonly Dictionary<TileKey, List<long>> waysByTile = new Dictionary<TileKey, List<long>>();
        readonly Dictionary<long, GradedWay> graded = new Dictionary<long, GradedWay>();
        // Junction graph (RoadLink): node key → outgoing links; links shared by overlapping tiles are ref-counted.
        readonly Dictionary<long, List<RoadLink>> links = new Dictionary<long, List<RoadLink>>();
        readonly Dictionary<long, Utm33> nodes = new Dictionary<long, Utm33>();
        readonly Dictionary<long, (RoadLink fwd, RoadLink back, int refs)> linkRefs = new Dictionary<long, (RoadLink, RoadLink, int)>();
        readonly Dictionary<TileKey, List<long>> linksByTile = new Dictionary<TileKey, List<long>>();
        readonly Dictionary<TileKey, SurfaceStats> surfaceByTile = new Dictionary<TileKey, SurfaceStats>();

        // StageRoute-compatible fields (roads.js RoadNetwork constructor).
        public string Name = "Free drive";
        public bool Free = true;
        public string Source = "osm";
        public float RoadWidth = 3.0f;          // default half width when no road is near
        public float Length = 0;
        public Utm33 Spawn;
        public float SpawnYaw;
        public int SegmentCount { get; private set; }
        public int BridgeSegmentCount { get; private set; }

        static long Key(int bx, int bz) => ((long)bx << 32) ^ (uint)bz;
        static long BucketOf(double2 p) => Key((int)math.floor(p.x / Cell), (int)math.floor(p.y / Cell));
        /// <summary>Node identity: the coordinate to the centimetre, so ways that share an OSM node share the key.</summary>
        public static long NodeKey(Utm33 p) => ((long)math.round(p.E * 100) << 32) ^ (uint)(long)math.round(p.N * 100);
        static long LinkKey(long from, long to) => unchecked((long)((ulong)from * 0x9E3779B97F4A7C15UL)) ^ to;

        /// <summary>RoadWalk's road class: 0 motorway/trunk … 4 minor roads, 5 tracks.</summary>
        public static byte ClassOf(string kind)
        {
            switch (kind)
            {
                case "motorway": case "trunk": return 0;
                case "primary": return 1;
                case "secondary": return 2;
                case "tertiary": return 3;
                case "track": return 5;
                default: return 4;
            }
        }

        /// <summary>Never part of a stage: tunnels, motorways, private roads (RoadWalk skips Barred links).</summary>
        public static bool IsBarred(Dictionary<string, string> tags)
        {
            if (tags == null) return false;
            if (tags.TryGetValue("tunnel", out var t) && t != "no") return true;
            if (tags.TryGetValue("access", out var a) && (a == "private" || a == "no")) return true;
            if (tags.TryGetValue("motorroad", out var m) && m == "yes") return true;
            return tags.TryGetValue("highway", out var k) && (k == "motorway" || k == "trunk");
        }

        /// <summary>The box to ask NVDB for a tile's surfaces: the padded tile plus the match distance, so every ribbon sample sees its polyline.</summary>
        public static Bounds25833 SurfaceQueryBounds(TileKey key)
        {
            var b = key.Bounds; double pad = TilePad + SurfaceMaxDist;
            return new Bounds25833(b.MinE - pad, b.MinN - pad, b.MaxE + pad, b.MaxN + pad);
        }

        /// <summary>The material split and its sources for a registered tile (default when unknown), for the overlay log.</summary>
        public SurfaceStats SurfaceStatsFor(TileKey key) => surfaceByTile.TryGetValue(key, out var st) ? st : default;

        /// <summary>
        /// Prepare and register a tile's ways. <paramref name="coarseGround"/> samples the untouched 8 m DTM.
        /// Returns the runs inside the padded tile (for the ribbon mesh); heights for a way already graded by
        /// another tile are reused, so overlapping copies agree exactly. <paramref name="surfaces"/> (NVDB Vegdekke,
        /// optional) sets the material per 5 m sample: the nearest polyline within <see cref="SurfaceMaxDist"/> wins,
        /// else the OSM tag / road class (<see cref="ProfileGrader.IsPaved"/>). A run is cut where the material changes
        /// (the pieces share the boundary sample), so each RoadPolyline, its segments and its links have one material.
        /// Bridges (<see cref="Bridges"/>): a way tagged <c>bridge=*</c> is a span end to end, any other way is one wherever
        /// it crosses <paramref name="wet"/> water (optional; no water rule without it).
        /// </summary>
        public List<RoadPolyline> SetTile(TileKey key, RoadGraphData data, Func<Utm33, float> coarseGround, IReadOnlyList<RoadSurfaceLine> surfaces = null, Func<double2, bool> wet = null)
        {
            RemoveTile(key);
            var lines = new List<RoadPolyline>();
            if (data == null || data.Ways == null) return lines;
            var surfaceIndex = surfaces != null && surfaces.Count > 0 ? new RoadSurfaceIndex(surfaces) : null;
            var stats = new SurfaceStats { NvdbLines = surfaces?.Count ?? 0 };
            var b = key.Bounds;
            double minE = b.MinE - TilePad, maxE = b.MaxE + TilePad, minN = b.MinN - TilePad, maxN = b.MaxN + TilePad;
            bool Inside(double2 p) => p.x >= minE && p.x <= maxE && p.y >= minN && p.y <= maxN;
            // Junction nodes: a coordinate that appears in more than one way (or more than once) stays put when smoothing.
            var nodeCount = new Dictionary<long, int>();
            foreach (var way in data.Ways)
            {
                if (ProfileGrader.LaneSpecFor(way.Tags) == null) continue;
                foreach (var p in way.Nodes) { var k = NodeKey(p); nodeCount[k] = nodeCount.TryGetValue(k, out var c) ? c + 1 : 1; }
            }
            var owned = new List<(long, Seg)>();
            var ways = new List<long>();
            var tileLinks = new List<long>();
            // Major roads first: a way is graded once and later ways ease onto the roads already graded
            // (EaseOntoJunctions), so at a junction the main road keeps its profile and the side road ramps to it.
            foreach (var way in System.Linq.Enumerable.OrderBy(data.Ways, w => w.Tags != null && w.Tags.TryGetValue("highway", out var hk) ? ClassOf(hk) : 9))
            {
                var spec = ProfileGrader.LaneSpecFor(way.Tags);
                if (spec == null || way.Nodes == null || way.Nodes.Count < 2) continue;
                var raw = new List<double2>(way.Nodes.Count);
                foreach (var p in way.Nodes) raw.Add(new double2(p.E, p.N));
                bool any = false;
                foreach (var p in raw) if (Inside(p)) { any = true; break; }
                if (!any) continue;
                if (!graded.TryGetValue(way.Id, out var g))
                {
                    var pinned = new HashSet<int>();
                    for (int i = 0; i < way.Nodes.Count; i++) if (nodeCount[NodeKey(way.Nodes[i])] > 1) pinned.Add(i);
                    var samples = ProfileGrader.ResampleEven(ProfileGrader.SmoothThrough(raw, pinned, SmoothRounds), ProfileGrader.SampleStep);
                    int n = samples.Count;
                    var ground = new double[n];
                    for (int i = 0; i < n; i++) ground[i] = math.max(MinGradeGround, coarseGround(new Utm33(samples[i].x, samples[i].y)));
                    var bridge = new bool[n]; var pier = new bool[n];
                    var spans = FindBridges(way, spec.Value, samples, coarseGround, wet, bridge, pier, out var along, out var wetAt);
                    double[] heights;
                    if (spans.Count == 0) heights = ProfileGrader.SmoothRoadHeights(ground, ProfileGrader.SampleStep);
                    else
                    {
                        Bridges.BridgeRaw(ground, along, spans);
                        heights = GradeBridgeWay(ground, samples, coarseGround, Bridges.IsBridgeTag(way.Tags));
                    }
                    var covered = new bool[n];
                    EaseOntoJunctions(way.Id, samples, heights, covered, bridge, spans);
                    if (spans.Count > 0) Bridges.ApplyProfile(samples, along, heights, spans, wetAt, p => coarseGround(new Utm33(p.x, p.y)));
                    g = new GradedWay { Points = samples, Heights = heights, Covered = covered, Bridge = bridge, Pier = pier };
                    graded[way.Id] = g;
                }
                g.Refs++;
                ways.Add(way.Id);
                bool osmPaved = ProfileGrader.IsPaved(way.Tags);
                var fallback = way.Tags != null && way.Tags.TryGetValue("surface", out var st) && !string.IsNullOrEmpty(st) ? SurfaceSource.OsmTag : SurfaceSource.Default;
                var paved = new bool[g.Points.Count];
                var source = new SurfaceSource[g.Points.Count];
                for (int i = 0; i < paved.Length; i++)
                {
                    var measured = surfaceIndex?.Nearest(g.Points[i], SurfaceMaxDist);
                    paved[i] = measured.HasValue ? measured.Value == Surface.Asphalt : osmPaved;
                    source[i] = measured.HasValue ? SurfaceSource.Nvdb : fallback;
                }
                AbsorbShortRuns(paved, MinSurfaceRun);
                string name = way.Tags != null && way.Tags.TryGetValue("name", out var nm) ? nm : null;
                string kind = way.Tags["highway"];
                AddLinks(way, g, nodeCount, paved, kind, tileLinks);
                // Split into runs inside the padded tile and at material changes; runs shorter than 3 samples are noise.
                var run = new List<RoadSample>();
                var runSource = new List<SurfaceSource>();
                bool runPaved = false;
                void Flush()
                {
                    if (run.Count >= 3)
                    {
                        var line = new RoadPolyline { Id = way.Id, Name = name, Kind = kind, Lanes = spec.Value, Paved = runPaved, Samples = run, Length = run[run.Count - 1].S - run[0].S };
                        lines.Add(line);
                        for (int k = 0; k + 1 < run.Count; k++)
                        {
                            var seg = new Seg { Id = way.Id, A = run[k].P, B = run[k + 1].P, Ya = run[k].RoadY, Yb = run[k + 1].RoadY, Lanes = spec.Value, Paved = runPaved, Bridge = run[k].Bridge && run[k + 1].Bridge };
                            if (seg.Bridge) BridgeSegmentCount++;
                            long bk = BucketOf((seg.A + seg.B) / 2);
                            if (!buckets.TryGetValue(bk, out var list)) buckets[bk] = list = new List<Seg>();
                            list.Add(seg);
                            owned.Add((bk, seg));
                            float m = run[k + 1].S - run[k].S;
                            if (runPaved) stats.AsphaltM += m; else stats.GravelM += m;
                            switch (runSource[k + 1])
                            {
                                case SurfaceSource.Nvdb: stats.NvdbM += m; break;
                                case SurfaceSource.OsmTag: stats.OsmTagM += m; break;
                                default: stats.DefaultM += m; break;
                            }
                        }
                    }
                    run = new List<RoadSample>();
                    runSource.Clear();
                }
                float s = 0;
                for (int i = 0; i < g.Points.Count; i++)
                {
                    var p = g.Points[i];
                    if (!Inside(p)) { Flush(); s = 0; continue; }
                    if (run.Count == 0) runPaved = paved[i];
                    else if (paved[i] != runPaved)
                    {
                        // Material change: close the run and start the next one at its last sample (S keeps counting, so the UVs run on).
                        var last = run[run.Count - 1]; var lastSource = runSource[runSource.Count - 1];
                        Flush();
                        run.Add(last); runSource.Add(lastSource);
                        runPaved = paved[i];
                    }
                    if (run.Count > 0) s += (float)math.distance(p, run[run.Count - 1].P);
                    run.Add(new RoadSample { P = p, RoadY = (float)g.Heights[i], S = s, Covered = g.Covered[i], Bridge = g.Bridge[i], Pier = g.Pier[i] });
                    runSource.Add(source[i]);
                }
                Flush();
            }
            byTile[key] = owned;
            waysByTile[key] = ways;
            linksByTile[key] = tileLinks;
            surfaceByTile[key] = stats;
            SegmentCount += owned.Count;
            return lines;
        }

        /// <summary>Runs of one material shorter than <paramref name="min"/> samples take the material before them (or after, at the start).</summary>
        static void AbsorbShortRuns(bool[] v, int min)
        {
            for (int i = 0; i < v.Length;)
            {
                int j = i;
                while (j < v.Length && v[j] == v[i]) j++;
                if (j - i < min && (i > 0 || j < v.Length))
                {
                    bool fill = i > 0 ? v[i - 1] : v[j];
                    for (int k = i; k < j; k++) v[k] = fill;
                }
                i = j;
            }
        }

        /// <summary>
        /// The bridge spans of a way (bridges.js, roads.js prepareChunkRoads): a tagged way end to end, else wherever it
        /// crosses water (a ford never). Fills the per-sample flags; <paramref name="along"/> is the distance along the
        /// samples, <paramref name="wetAt"/> which samples are over water (for the deck clearance).
        /// </summary>
        static List<BridgeSpan> FindBridges(RoadWay way, LaneSpec spec, List<double2> samples, Func<Utm33, float> ground, Func<double2, bool> wet,
            bool[] bridge, bool[] pier, out double[] along, out bool[] wetAt)
        {
            int n = samples.Count;
            along = new double[n];
            for (int i = 1; i < n; i++) along[i] = along[i - 1] + math.distance(samples[i], samples[i - 1]);
            wetAt = new bool[n];
            bool[] core;
            if (Bridges.IsBridgeTag(way.Tags))
            {
                core = new bool[n];
                for (int i = 0; i < n; i++) { core[i] = true; if (wet != null) wetAt[i] = wet(samples[i]); }
            }
            else if (wet != null && !Bridges.IsFord(way.Tags))
                core = Bridges.WetCore(samples, along, wet, spec.Cut + 4, p => ground(new Utm33(p.x, p.y)), wetAt);
            else return new List<BridgeSpan>();
            return Bridges.MarkSpans(along, core, bridge, pier);
        }

        /// <summary>
        /// The grade of a way with bridges: the raw heights already bridged bank to bank. A tagged bridge is usually its own
        /// short way: it is graded with 60 m of the ground straight on beyond both ends (as the roads it joins are), or its
        /// ends would sit in the valley.
        /// </summary>
        static double[] GradeBridgeWay(double[] raw, List<double2> samples, Func<Utm33, float> ground, bool tagged)
        {
            int n = samples.Count, ext = tagged && n >= 2 ? 12 : 0;
            if (ext == 0) return ProfileGrader.SmoothRoadHeights(raw, ProfileGrader.SampleStep);
            var all = new double[n + 2 * ext];
            double2 d0 = math.normalizesafe(samples[0] - samples[1]), d1 = math.normalizesafe(samples[n - 1] - samples[n - 2]);
            for (int k = 0; k < ext; k++)
            {
                var a = samples[0] + d0 * ProfileGrader.SampleStep * (ext - k);
                var b = samples[n - 1] + d1 * ProfileGrader.SampleStep * (k + 1);
                all[k] = ground(new Utm33(a.x, a.y));
                all[ext + n + k] = ground(new Utm33(b.x, b.y));
            }
            Array.Copy(raw, 0, all, ext, n);
            var smooth = ProfileGrader.SmoothRoadHeights(all, ProfileGrader.SampleStep);
            var outH = new double[n];
            Array.Copy(smooth, ext, outH, 0, n);
            return outH;
        }

        /// <summary>
        /// Split a graded way into junction-to-junction links (both directions). Junctions are the raw OSM
        /// nodes shared with another way; their graded sample is the nearest point, because Chaikin keeps
        /// pinned nodes in place but Resample's arithmetic is not bit-exact.
        /// </summary>
        void AddLinks(RoadWay way, GradedWay g, Dictionary<long, int> nodeCount, bool[] pavedAt, string kind, List<long> tileLinks)
        {
            var cuts = new List<(long node, int index)>();
            int from = 0;
            for (int i = 0; i < way.Nodes.Count; i++)
            {
                bool junction = i == 0 || i == way.Nodes.Count - 1 || nodeCount[NodeKey(way.Nodes[i])] > 1;
                if (!junction) continue;
                var p = new double2(way.Nodes[i].E, way.Nodes[i].N);
                int best = from; double bestD = double.PositiveInfinity;
                for (int k = from; k < g.Points.Count; k++) { double d = math.distancesq(g.Points[k], p); if (d < bestD) { bestD = d; best = k; } }
                cuts.Add((NodeKey(way.Nodes[i]), best));
                nodes[NodeKey(way.Nodes[i])] = way.Nodes[i];
                from = best;
            }
            bool barred = IsBarred(way.Tags);
            byte cls = ClassOf(kind);
            for (int c = 0; c + 1 < cuts.Count; c++)
            {
                var (a, ia) = cuts[c]; var (b, ib) = cuts[c + 1];
                if (ib <= ia || a == b) continue;
                long lk = LinkKey(math.min(a, b), math.max(a, b)) ^ way.Id;
                if (linkRefs.TryGetValue(lk, out var existing)) { linkRefs[lk] = (existing.fwd, existing.back, existing.refs + 1); tileLinks.Add(lk); continue; }
                var pts = g.Points.GetRange(ia, ib - ia + 1);
                var hs = new float[pts.Count];
                for (int i = 0; i < hs.Length; i++) hs[i] = (float)g.Heights[ia + i];
                float length = 0, turn = 0;
                for (int i = 1; i < pts.Count; i++)
                {
                    length += (float)math.distance(pts[i], pts[i - 1]);
                    if (i + 1 < pts.Count)
                    {
                        var u = pts[i] - pts[i - 1]; var v = pts[i + 1] - pts[i];
                        turn += (float)math.abs(math.atan2(u.x * v.y - u.y * v.x, math.dot(u, v)));
                    }
                }
                if (length < 1f) continue;
                int pavedCount = 0;
                for (int i = ia; i <= ib; i++) if (pavedAt[i]) pavedCount++;
                bool paved = pavedCount * 2 >= ib - ia + 1;   // a link carries its majority material
                var fwd = new RoadLink { Id = way.Id, From = a, To = b, Length = length, Curvature = turn / (length / 100f), Climb = math.abs(hs[hs.Length - 1] - hs[0]) / length, Paved = paved, Barred = barred, RoadClass = cls, Points = pts, Heights = hs };
                var backPts = new List<double2>(pts); backPts.Reverse();
                var backHs = (float[])hs.Clone(); System.Array.Reverse(backHs);
                var back = new RoadLink { Id = way.Id, From = b, To = a, Length = length, Curvature = fwd.Curvature, Climb = fwd.Climb, Paved = paved, Barred = barred, RoadClass = cls, Points = backPts, Heights = backHs };
                Outgoing(a).Add(fwd); Outgoing(b).Add(back);
                linkRefs[lk] = (fwd, back, 1);
                tileLinks.Add(lk);
            }
        }

        List<RoadLink> Outgoing(long node) { if (!links.TryGetValue(node, out var l)) links[node] = l = new List<RoadLink>(4); return l; }

        /// <summary>Links leaving a node (both directions of every way through it), or null for an unknown node.</summary>
        public IReadOnlyList<RoadLink> LinksFrom(long node) => links.TryGetValue(node, out var l) ? l : null;
        public bool TryNodePosition(long node, out Utm33 p) => nodes.TryGetValue(node, out p);

        /// <summary>The junction node nearest to a point within <paramref name="limit"/> m, or 0 when none (a walk's start).</summary>
        public long NearestNode(Utm33 p, double limit = 400)
        {
            long best = 0; double bestD = limit * limit;
            foreach (var kv in nodes)
            {
                var d = kv.Value.Minus(p); double d2 = math.lengthsq(d);
                if (d2 < bestD && links.ContainsKey(kv.Key)) { bestD = d2; best = kv.Key; }
            }
            return best;
        }

        /// <summary>True once a tile's road answer has been registered (even an empty one): the endless start waits for these.</summary>
        public bool HasTile(TileKey key) => byTile.ContainsKey(key);

        /// <summary>
        /// The junction-to-junction link nearest to a point within <paramref name="limit"/> m (barred links skipped),
        /// with the index of its closest graded sample. An endless stage starts here rather than at the nearest
        /// junction node: on a long rural road the junctions can be kilometres apart while the road is metres away.
        /// One pass over every link, so call it once per stage, not per frame.
        /// </summary>
        public RoadLink NearestLink(Utm33 p, double limit, out int sample)
        {
            RoadLink best = null; sample = 0;
            double bestD = limit * limit;
            var q = new double2(p.E, p.N);
            foreach (var r in linkRefs.Values)
            {
                var l = r.fwd;
                if (l.Barred) continue;
                for (int i = 0; i < l.Points.Count; i++)
                {
                    double d = math.distancesq(l.Points[i], q);
                    if (d < bestD) { bestD = d; best = l; sample = i; }
                }
            }
            return best;
        }

        /// <summary>
        /// roads.js junction easing: wherever this way meets a road already in the network (its ends,
        /// T-junctions, crossings) its height is eased onto that road over ±FadeJ samples (60 m), so roads
        /// meet without a step and the carve never has two heights for one spot.
        /// </summary>
        void EaseOntoJunctions(long wayId, List<double2> samples, double[] heights, bool[] covered, bool[] bridge, List<BridgeSpan> spans)
        {
            if (buckets.Count == 0) return;   // not SegmentCount: that is only summed when the tile is done, and ways of the same tile must ease onto each other too
            // A deck between its abutments never takes another road's height (that road passes under it), and a deck more
            // than PassOver above or below this way's grade is a road passing over or under it, not a junction.
            bool OnSpan(int i)
            {
                if (bridge == null || !bridge[i]) return false;
                foreach (var sp in spans) if (i > sp.I0 && i < sp.I1) return true;
                return false;
            }
            bool PassesOver(in RoadHit q, int i) => q.Bridge && math.abs(q.RoadY - heights[i]) > PassOver;
            int lastHit = -FadeJ;
            for (int i = 0; i < samples.Count; i++)
            {
                if (i - lastHit < 4 || OnSpan(i)) continue;   // one anchor per 20 m of shared road
                if (!Nearest(new Utm33(samples[i].x, samples[i].y), 4, out var q) || q.Distance > 2.5 || q.Id == wayId || PassesOver(q, i)) continue;
                double delta = q.RoadY - heights[i];
                lastHit = i;
                if (math.abs(delta) < 0.02) continue;
                for (int k = -FadeJ; k <= FadeJ; k++)
                {
                    int j = i + k;
                    if (j < 0 || j >= samples.Count) continue;
                    heights[j] += delta * (1 - math.abs(k) / (double)FadeJ);
                }
            }
            // Near another road (its flat band plus JunctionFlat) this way takes that road's height exactly (it is flat
            // across): the car's ground and the ribbon follow whichever centre line is nearest, so the two must agree
            // where their surfaces overlap or a junction is a step. Beyond, the way ramps back to its own grade over
            // JunctionRamp: the offset it took fades out with a smoothstep. Roads are graded major first, so it is the
            // side road that conforms.
            var ownBefore = (double[])heights.Clone();
            var conformed = new bool[samples.Count];
            var at = new double[samples.Count];
            bool any = false;
            for (int i = 0; i < samples.Count; i++)
            {
                if (i > 0) at[i] = at[i - 1] + math.distance(samples[i], samples[i - 1]);
                if (!OnSpan(i) && Nearest(new Utm33(samples[i].x, samples[i].y), 30, out var q) && q.Id != wayId && !PassesOver(q, i) && q.Distance <= RoadConstants.FlatHalf(q.Half) + RoadConstants.CarveApron + JunctionFlat)
                { heights[i] = q.RoadY; conformed[i] = true; any = true; covered[i] = q.Distance <= RoadConstants.FlatHalf(q.Half) && !q.Bridge; }   // a deck's ribbon does not reach back over the land: the road meeting it draws its own up to the abutment
            }
            if (!any) return;
            var own = (double[])heights.Clone();
            for (int i = 0; i < samples.Count; i++)
            {
                if (conformed[i]) continue;
                int nearest = -1; double gap = JunctionRamp;
                for (int j = i - 1; j >= 0 && at[i] - at[j] < gap; j--) if (conformed[j]) { nearest = j; gap = at[i] - at[j]; break; }
                for (int j = i + 1; j < samples.Count && at[j] - at[i] < gap; j++) if (conformed[j]) { nearest = j; gap = at[j] - at[i]; break; }
                if (nearest < 0) continue;
                // The offset the conformed sample took fades out (smoothstep), the way keeps its own grade under it.
                double t = gap / JunctionRamp; t = t * t * (3 - 2 * t);
                heights[i] = own[i] + (heights[nearest] - ownBefore[nearest]) * (1 - t);
            }
        }

        public void RemoveTile(TileKey key)
        {
            if (!byTile.TryGetValue(key, out var owned)) return;
            foreach (var (bk, seg) in owned)
            {
                if (seg.Bridge) BridgeSegmentCount--;
                if (!buckets.TryGetValue(bk, out var list)) continue;
                list.Remove(seg);
                if (list.Count == 0) buckets.Remove(bk);
            }
            SegmentCount -= owned.Count;
            byTile.Remove(key);
            surfaceByTile.Remove(key);
            foreach (var id in waysByTile[key]) if (graded.TryGetValue(id, out var g) && --g.Refs <= 0) graded.Remove(id);
            waysByTile.Remove(key);
            foreach (var lk in linksByTile[key])
            {
                if (!linkRefs.TryGetValue(lk, out var r)) continue;
                if (r.refs > 1) { linkRefs[lk] = (r.fwd, r.back, r.refs - 1); continue; }
                linkRefs.Remove(lk);
                if (links.TryGetValue(r.fwd.From, out var la)) { la.Remove(r.fwd); if (la.Count == 0) links.Remove(r.fwd.From); }
                if (links.TryGetValue(r.back.From, out var lb)) { lb.Remove(r.back); if (lb.Count == 0) links.Remove(r.back.From); }
            }
            linksByTile.Remove(key);
        }

        /// <summary>roads.js RoadNetwork.nearest: the closest segment in the buckets within `limit`; side from the left normal (−tz, tx).</summary>
        public bool Nearest(Utm33 p, double limit, out RoadHit hit) => Nearest(p, limit, RoadLayer.Any, out hit);

        /// <summary><see cref="Nearest(Utm33, double, out RoadHit)"/> over the roads on the ground or the bridge decks only.</summary>
        public bool Nearest(Utm33 p, double limit, RoadLayer layer, out RoadHit hit)
        {
            var q = new double2(p.E, p.N);
            int bx = (int)math.floor(q.x / Cell), bz = (int)math.floor(q.y / Cell), r = (int)math.ceil(limit / Cell);
            // Ranked by the distance past the road's flat band, not to its centre line: where two roads overlap (a
            // junction) the point belongs to the road whose flat surface it is on, so a wide road's shoulder is not
            // handed to a narrow side road's falling verge. Away from junctions this is the nearest road as before.
            Seg best = null; double bestD = double.PositiveInfinity, bestT = 0, bestScore = double.PositiveInfinity;
            for (int dj = -r; dj <= r; dj++)
                for (int di = -r; di <= r; di++)
                {
                    if (!buckets.TryGetValue(Key(bx + di, bz + dj), out var list)) continue;
                    for (int i = 0; i < list.Count; i++)
                    {
                        var seg = list[i];
                        if ((layer == RoadLayer.Ground && seg.Bridge) || (layer == RoadLayer.Deck && !seg.Bridge)) continue;
                        double2 ab = seg.B - seg.A;
                        double l2 = math.lengthsq(ab); if (l2 == 0) l2 = 1;
                        double t = math.clamp(math.dot(q - seg.A, ab) / l2, 0, 1);
                        double d = math.distance(q, seg.A + ab * t);
                        if (d > limit) continue;
                        double score = d - RoadConstants.FlatHalf(seg.Lanes.Half);
                        if (score < bestScore) { bestScore = score; bestD = d; best = seg; bestT = t; }
                    }
                }
            if (best == null || bestD > limit) { hit = default; return false; }
            double2 dir = best.B - best.A;
            double len = math.length(dir); if (len == 0) len = 1;
            dir /= len;
            double2 point = best.A + (best.B - best.A) * bestT;
            double side = (q.x - point.x) * -dir.y + (q.y - point.y) * dir.x;
            hit = new RoadHit
            {
                Id = best.Id, Distance = bestD, Point = point, Tangent = dir, RoadY = (float)math.lerp(best.Ya, best.Yb, bestT),
                Half = best.Lanes.Half, Cut = best.Lanes.Cut, Surface = best.Paved ? Surface.Asphalt : Surface.Gravel, Side = side >= 0 ? 1 : -1, Bridge = best.Bridge,
            };
            return true;
        }

        /// <summary>
        /// Carve input for a tile: every segment whose reach touches the bounds, tile-local, ROAD_LIFT + CarveLift added (roads.js
        /// carvePolylines; the lift puts the terrain at the ribbon edge). A bridge span is a CarveSegment.DeckOnly out to the
        /// deck's half width: it carves nothing, wins the cells nearer to it than to the approach roads and marks its footprint.
        /// </summary>
        public void CollectCarveSegments(Bounds25833 bounds, Utm33 origin, List<CarveSegment> output)
        {
            int bx0 = (int)math.floor((bounds.MinE - 32) / Cell), bx1 = (int)math.floor((bounds.MaxE + 32) / Cell);
            int bz0 = (int)math.floor((bounds.MinN - 32) / Cell), bz1 = (int)math.floor((bounds.MaxN + 32) / Cell);
            for (int bz = bz0; bz <= bz1; bz++)
                for (int bx = bx0; bx <= bx1; bx++)
                {
                    if (!buckets.TryGetValue(Key(bx, bz), out var list)) continue;
                    foreach (var seg in list)
                    {
                        float flat = RoadConstants.FlatHalf(seg.Lanes.Half) + RoadConstants.CarveApron, shoulder = RoadProfile.ShoulderFor(seg.Lanes.Half, seg.Lanes.Cut), reach = flat + math.max(shoulder, RoadConstants.MaxEarthwork);
                        double2 lo = math.min(seg.A, seg.B) - reach, hi = math.max(seg.A, seg.B) + reach;
                        if (hi.x < bounds.MinE || lo.x > bounds.MaxE || hi.y < bounds.MinN || lo.y > bounds.MaxN) continue;
                        output.Add(new CarveSegment
                        {
                            A = (float2)(seg.A - new double2(origin.E, origin.N)), B = (float2)(seg.B - new double2(origin.E, origin.N)),
                            Ha = seg.Ya + RoadConstants.RoadLift + RoadConstants.CarveLift, Hb = seg.Yb + RoadConstants.RoadLift + RoadConstants.CarveLift,
                            HalfWidth = seg.Bridge ? RoadConstants.DeckHalf(seg.Lanes.Half) : flat, Shoulder = seg.Bridge ? RoadConstants.MaxEarthwork : shoulder,
                            Flags = seg.Bridge ? CarveSegment.DeckOnly : 0u,
                        });
                    }
                }
        }

        /// <summary>roads.js segmentsNear: the start point of every segment in the buckets within `radius`.</summary>
        public void PointsNear(Utm33 p, double radius, List<Utm33> output)
        {
            int r = (int)math.ceil(radius / Cell), bx = (int)math.floor(p.E / Cell), bz = (int)math.floor(p.N / Cell);
            for (int dj = -r; dj <= r; dj++)
                for (int di = -r; di <= r; di++)
                {
                    if (!buckets.TryGetValue(Key(bx + di, bz + dj), out var list)) continue;
                    foreach (var seg in list) output.Add(new Utm33(seg.A.x, seg.A.y));
                }
        }

        /// <summary>roads.js poseNear: a pose on the nearest road within `limit`, facing along the way.</summary>
        public RoadPose? PoseNear(Utm33 p, double limit = 400)
        {
            if (!Nearest(p, limit, out var q)) return null;
            return new RoadPose(new Utm33(q.Point.x, q.Point.y), (float)math.atan2(q.Tangent.x, q.Tangent.y));
        }

        /// <summary>stage.js / roads.js startPose: the spawn the free drive was started with.</summary>
        public RoadPose StartPose() => new RoadPose(Spawn, SpawnYaw);
    }
}
