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
        /// <summary>In a road tunnel (<see cref="Tunnels"/>), under an avalanche gallery's roof; <see cref="Portal"/>: an end of either (a way end, not a tile cut).</summary>
        public bool Tunnel, Gallery, Portal;
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
        /// <summary>Length of the whole OSM way (a run is the piece inside one tile; RoadSample.S counts from the way's start).</summary>
        public float WayLength;
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
        /// <summary>A road tunnel: stages may use it, the walk prefers open roads (RoadWalk.Score).</summary>
        public bool Tunnel;
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
        /// <summary>A bridge deck or tunnel this far above or below another road's grade passes over / under it: no junction easing between them.</summary>
        public const double PassOver = RoadConstants.PassOver;
        /// <summary>
        /// A way that meets an already graded way at a shared OSM node takes its height there exactly; the offset fades out over
        /// at least FadeJ samples, longer when it is large, so the ease adds no more than this grade.
        /// </summary>
        public const double NodeEaseGrade = 0.08;
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
            /// <summary>In a road tunnel; <see cref="PortalA"/> / <see cref="PortalB"/>: that end is a portal.</summary>
            public bool Tunnel, PortalA, PortalB;
        }
        sealed class GradedWay
        {
            public List<double2> Points; public double[] Heights; public bool[] Covered, Bridge, Pier, Unknown; public int Refs;
            public TunnelKind Tunnel;
            /// <summary>The OSM nodes of the way (node key, nearest sample) as registered in <see cref="nodeWays"/>.</summary>
            public List<(long node, int sample)> Nodes;
            /// <summary>Ways this one took its height from at a shared node: when one of them is graded again, so must this be.</summary>
            public HashSet<long> EasedOnto;
            /// <summary>A way it eased onto was graded again: grade this one again when a tile next sets it.</summary>
            public bool Regrade;
        }
        /// <summary>
        /// Every graded way's OSM nodes: node key → (way, nearest sample). A way graded later takes the height of an earlier one at
        /// every node they share (<see cref="EaseOntoNodes"/>), whatever tile either was graded in. The bucket easing only saw the
        /// roads registered near the junction; a way graded in a tile that held none of the junction (its other end was there)
        /// met the other way with a step (6 m and 20 m at Sauda, 2026-11-20).
        /// </summary>
        readonly Dictionary<long, List<(long way, int sample)>> nodeWays = new Dictionary<long, List<(long, int)>>();

        readonly Dictionary<long, List<Seg>> buckets = new Dictionary<long, List<Seg>>();
        readonly Dictionary<TileKey, List<(long bucket, Seg seg)>> byTile = new Dictionary<TileKey, List<(long, Seg)>>();
        readonly Dictionary<TileKey, List<long>> waysByTile = new Dictionary<TileKey, List<long>>();
        /// <summary>What each tile was set with, so a tile can be set again (<see cref="Rebuild"/>).</summary>
        readonly Dictionary<TileKey, (RoadGraphData data, Func<Utm33, float> ground, IReadOnlyList<RoadSurfaceLine> surfaces, Func<double2, bool> wet, Func<Utm33, bool> known)> inputs
            = new Dictionary<TileKey, (RoadGraphData, Func<Utm33, float>, IReadOnlyList<RoadSurfaceLine>, Func<double2, bool>, Func<Utm33, bool>)>();
        readonly HashSet<TileKey> dirty = new HashSet<TileKey>();

        /// <summary>
        /// Tiles whose segments and runs were cut from a grading that a later tile has replaced (a way graded again once ground
        /// that was missing came in): they must be set again (<see cref="Rebuild"/>) and their ribbon and carve redone, or
        /// two gradings of one road meet at the border and the carve takes either (load-order seams up to 20 m, 2026-11-20).
        /// </summary>
        public List<TileKey> TakeDirtyTiles()
        {
            var list = new List<TileKey>(dirty);
            dirty.Clear();
            return list;
        }

        /// <summary>
        /// Set a tile again from what it was set with (null when it is not registered). Its gradings are kept meanwhile: a way
        /// only this tile holds would otherwise be dropped and graded afresh, and a fresh grading can make the ways at its nodes
        /// follow it again (tiles setting each other again, 32 rounds at Svandalsflona before this).
        /// </summary>
        public List<RoadPolyline> Rebuild(TileKey key)
        {
            if (!inputs.TryGetValue(key, out var a)) return null;
            var keep = waysByTile.TryGetValue(key, out var held) ? new List<long>(held) : new List<long>();
            foreach (var id in keep) if (graded.TryGetValue(id, out var g)) g.Refs++;
            var lines = SetTile(key, a.data, a.ground, a.surfaces, a.wet, a.known);
            foreach (var id in keep) if (graded.TryGetValue(id, out var g) && --g.Refs <= 0) { graded.Remove(id); UnregisterNodes(id, g); }
            return lines;
        }
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
        public int TunnelSegmentCount { get; private set; }

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

        /// <summary>Never part of a stage: motorways, private roads (RoadWalk skips Barred links). Tunnels are drawn and driven now: allowed.</summary>
        public static bool IsBarred(Dictionary<string, string> tags)
        {
            if (tags == null) return false;
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
        /// <paramref name="known"/> (optional) tells where the ground is loaded: a way reaches far beyond the tile, and where no
        /// tile is in yet the ground reads 0 (the sea) — a mountain road was graded down to sea level there and carved a trench
        /// up to 340 m deep along it when that tile came in (seam survey 2026-11-20). Unknown samples take the nearest known
        /// sample's ground instead, and a later tile whose padded area holds samples that were unknown grades the way again.
        /// </summary>
        public List<RoadPolyline> SetTile(TileKey key, RoadGraphData data, Func<Utm33, float> coarseGround, IReadOnlyList<RoadSurfaceLine> surfaces = null, Func<double2, bool> wet = null, Func<Utm33, bool> known = null)
        {
            var lines = new List<RoadPolyline>();
            var steps = SetTileSteps(lines, key, data, coarseGround, surfaces, wet, known);
            while (steps.MoveNext()) { }
            return lines;
        }

        /// <summary>
        /// <see cref="SetTile"/> in steps: it pauses between ways whenever the frame's streaming budget is spent
        /// (<see cref="WorkBudget"/>; a dense tile graded for 330 ms in one frame). The tile is registered from the start, so
        /// <see cref="RemoveTile"/> in between removes what is in; the caller then stops stepping. Runs go into <paramref name="lines"/>.
        /// </summary>
        public System.Collections.IEnumerator SetTileSteps(List<RoadPolyline> lines, TileKey key, RoadGraphData data, Func<Utm33, float> coarseGround, IReadOnlyList<RoadSurfaceLine> surfaces = null, Func<double2, bool> wet = null, Func<Utm33, bool> known = null)
        {
            RemoveTile(key);
            inputs[key] = (data, coarseGround, surfaces, wet, known);
            dirty.Remove(key);
            if (data == null || data.Ways == null) { complete.Add(key); yield break; }
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
            // Portal nodes: the ends of the tubes in this answer. The DTM there runs up the rock face over the mouth.
            var portalNodes = new HashSet<long>();
            foreach (var way in data.Ways)
                if (way.Nodes != null && way.Nodes.Count >= 2 && Tunnels.KindOf(way.Tags) == TunnelKind.Tube)
                { portalNodes.Add(NodeKey(way.Nodes[0])); portalNodes.Add(NodeKey(way.Nodes[way.Nodes.Count - 1])); }
            var owned = new List<(long, Seg)>();
            var ways = new List<long>();
            var tileLinks = new List<long>();
            byTile[key] = owned;
            waysByTile[key] = ways;
            linksByTile[key] = tileLinks;
            surfaceByTile[key] = stats;
            // Major roads first: a way is graded once and later ways ease onto the roads already graded
            // (EaseOntoJunctions), so at a junction the main road keeps its profile and the side road ramps to it. Within a class
            // the longer way first (a 9 m connector between a bridge and a portal takes its ends from them, not they from it),
            // and tunnels last: a portal takes the height of the road outside it, graded on its own bed, since the DTM at a
            // portal node runs up the rock face.
            var order = System.Linq.Enumerable.ThenByDescending(System.Linq.Enumerable.ThenBy(System.Linq.Enumerable.OrderBy(data.Ways,
                    w => Tunnels.KindOf(w.Tags) == TunnelKind.Tube ? 1 : 0),
                    w => w.Tags != null && w.Tags.TryGetValue("highway", out var hk) ? ClassOf(hk) : 9),
                    RawLength);
            foreach (var way in order)
            {
                var spec = ProfileGrader.LaneSpecFor(way.Tags);
                if (spec == null || way.Nodes == null || way.Nodes.Count < 2) continue;
                var raw = new List<double2>(way.Nodes.Count);
                foreach (var p in way.Nodes) raw.Add(new double2(p.E, p.N));
                bool any = false;
                foreach (var p in raw) if (Inside(p)) { any = true; break; }
                if (!any) continue;
                bool Stale(GradedWay old)
                {
                    if (old.Regrade) return true;
                    if (old.Unknown == null || known == null) return false;
                    for (int i = 0; i < old.Points.Count; i++)
                        if (old.Unknown[i] && Inside(old.Points[i]) && known(new Utm33(old.Points[i].x, old.Points[i].y))) return true;
                    return false;
                }
                if (!graded.TryGetValue(way.Id, out var g) || Stale(g))
                {
                    int refs = g?.Refs ?? 0;
                    if (g != null)   // graded again: every other tile cut from the old grading must be set again
                    {
                        foreach (var kv in waysByTile)
                            if (!kv.Key.Equals(key) && kv.Value.Contains(way.Id)) dirty.Add(kv.Key);
                        UnregisterNodes(way.Id, g);
                    }
                    // Ways that took their height from this one at a shared node: not eased onto now; they follow it afterwards if
                    // the height at the node changed (FollowAtNodes).
                    var dependents = Dependents(way.Id);
                    long tg = FrameProbe.Start();
                    var pinned = new HashSet<int>();
                    for (int i = 0; i < way.Nodes.Count; i++) if (nodeCount[NodeKey(way.Nodes[i])] > 1) pinned.Add(i);
                    var samples = ProfileGrader.ResampleEven(ProfileGrader.SmoothThrough(raw, pinned, SmoothRounds), ProfileGrader.SampleStep);
                    int n = samples.Count;
                    var tunnel = Tunnels.KindOf(way.Tags);
                    bool tube = tunnel == TunnelKind.Tube;
                    var ground = new double[n];
                    for (int i = 0; i < n; i++) ground[i] = math.max(MinGradeGround, coarseGround(new Utm33(samples[i].x, samples[i].y)));
                    bool[] unknown = null;
                    if (known != null)
                    {
                        if (tube)
                        {
                            // A tube is graded from its two portals (and the sea under it): an unknown portal takes the other one's ground
                            // until it is in; any unknown sample grades the tube again when its ground comes (it may be the sea).
                            for (int i = 0; i < n; i++) if (!known(new Utm33(samples[i].x, samples[i].y))) (unknown ??= new bool[n])[i] = true;
                            bool k0 = unknown == null || !unknown[0], k1 = unknown == null || !unknown[n - 1];
                            if (!k0 && k1) ground[0] = ground[n - 1];
                            if (k0 && !k1) ground[n - 1] = ground[0];
                        }
                        else
                        {
                            for (int i = 0; i < n; i++) if (!known(new Utm33(samples[i].x, samples[i].y))) (unknown ??= new bool[n])[i] = true;
                            if (unknown != null) HoldKnownGround(ground, unknown);
                        }
                    }
                    FrameProbe.Stop(".grade.ground", tg); tg = FrameProbe.Start();
                    var bridge = new bool[n]; var pier = new bool[n];
                    double[] along;
                    bool[] wetAt;
                    List<BridgeSpan> spans;
                    if (tube)
                    {
                        spans = new List<BridgeSpan>();
                        along = new double[n]; wetAt = new bool[n];
                        for (int i = 1; i < n; i++) along[i] = along[i - 1] + math.distance(samples[i], samples[i - 1]);
                    }
                    else spans = FindBridges(way, spec.Value, samples, coarseGround, wet, bridge, pier, out along, out wetAt);
                    FrameProbe.Stop(".grade.bridges", tg); tg = FrameProbe.Start();
                    double[] heights;
                    if (tube)
                    {
                        var sea = new bool[n];
                        for (int i = 1; i + 1 < n; i++)
                        {
                            var u = new Utm33(samples[i].x, samples[i].y);
                            sea[i] = (known == null || known(u)) && coarseGround(u) < 0.1f;   // DTM sea cells are 0
                        }
                        // The DTM at a portal node runs up the rock face over the mouth (the 8 m grid smears it over a cell or two):
                        // read the portal's height from the ground outside it, where the road comes in.
                        // (Not when the ground outside falls away — a gorge, a fjord under the bridge that comes in: keep the portal's own.)
                        double PortalY(double raw, double outside) => raw - outside > RoadConstants.TunnelWall * 2 ? raw : math.min(raw, outside);
                        double y0 = PortalY(ground[0], OutsideGround(samples, true, coarseGround, known)), y1 = PortalY(ground[n - 1], OutsideGround(samples, false, coarseGround, known));
                        heights = Tunnels.Profile(along, math.max(MinGradeGround, y0), math.max(MinGradeGround, y1), sea);
                    }
                    else if (spans.Count == 0)
                    {
                        EndGround(ground, along);
                        PortalEnds(way, ground, along, portalNodes);
                        heights = ProfileGrader.SmoothRoadHeights(ground, ProfileGrader.SampleStep, pinEnds: true);
                    }
                    else
                    {
                        if (!bridge[0] && !bridge[n - 1]) EndGround(ground, along);
                        if (!bridge[0] && !bridge[n - 1]) PortalEnds(way, ground, along, portalNodes);
                        Bridges.BridgeRaw(ground, along, spans);
                        heights = ProfileGrader.SmoothRoadHeights(ground, ProfileGrader.SampleStep, pinEnds: true);
                    }
                    var covered = new bool[n];
                    FrameProbe.Stop(".grade.smooth", tg); tg = FrameProbe.Start();
                    var eased = EaseOntoNodes(way, samples, heights, bridge, spans, dependents, tube, out var tubesToFollow);
                    EaseOntoJunctions(way.Id, samples, heights, covered, bridge, spans, tube);
                    FrameProbe.Stop(".grade.ease", tg);
                    if (spans.Count > 0) Bridges.ApplyProfile(samples, along, heights, spans, wetAt, p => coarseGround(new Utm33(p.x, p.y)));
                    g = new GradedWay { Points = samples, Heights = heights, Covered = covered, Bridge = bridge, Pier = pier, Unknown = unknown, Refs = refs, Tunnel = tunnel, EasedOnto = eased };
                    graded[way.Id] = g;
                    RegisterNodes(way, g);
                    // Those, and a tube meeting this road at a portal graded before it (the tube follows the road, not the road the
                    // tube, so the joint is the road's height in any load order), are graded again where the heights now differ.
                    FollowAtNodes(g, dependents, key, ways);
                    FollowAtNodes(g, tubesToFollow, key, ways);
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
                float wayLength = 0;
                for (int i = 1; i < g.Points.Count; i++) wayLength += (float)math.distance(g.Points[i], g.Points[i - 1]);
                // Split into runs inside the padded tile and at material changes; runs shorter than 3 samples are noise.
                var run = new List<RoadSample>();
                var runSource = new List<SurfaceSource>();
                bool runPaved = false;
                void Flush()
                {
                    if (run.Count >= 3)
                    {
                        var line = new RoadPolyline { Id = way.Id, Name = name, Kind = kind, Lanes = spec.Value, Paved = runPaved, Samples = run, Length = run[run.Count - 1].S - run[0].S, WayLength = wayLength };
                        lines.Add(line);
                        for (int k = 0; k + 1 < run.Count; k++)
                        {
                            var seg = new Seg { Id = way.Id, A = run[k].P, B = run[k + 1].P, Ya = run[k].RoadY, Yb = run[k + 1].RoadY, Lanes = spec.Value, Paved = runPaved, Bridge = run[k].Bridge && run[k + 1].Bridge, Tunnel = run[k].Tunnel && run[k + 1].Tunnel, PortalA = run[k].Portal, PortalB = run[k + 1].Portal };
                            if (seg.Bridge) BridgeSegmentCount++;
                            if (seg.Tunnel) TunnelSegmentCount++;
                            long bk = BucketOf((seg.A + seg.B) / 2);
                            if (!buckets.TryGetValue(bk, out var list)) buckets[bk] = list = new List<Seg>();
                            list.Add(seg);
                            owned.Add((bk, seg));
                            SegmentCount++;
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
                    // S is the distance along the whole way, so the runs two tiles cut from it carry the same V (RibbonMesh).
                    if (i > 0) s += (float)math.distance(p, g.Points[i - 1]);
                    if (!Inside(p)) { Flush(); continue; }
                    if (run.Count == 0) runPaved = paved[i];
                    else if (paved[i] != runPaved)
                    {
                        // Material change: close the run and start the next one at its last sample (S keeps counting, so the UVs run on).
                        var last = run[run.Count - 1]; var lastSource = runSource[runSource.Count - 1];
                        Flush();
                        run.Add(last); runSource.Add(lastSource);
                        runPaved = paved[i];
                    }
                    run.Add(new RoadSample
                    {
                        P = p, RoadY = (float)g.Heights[i], S = s, Covered = g.Covered[i], Bridge = g.Bridge[i], Pier = g.Pier[i],
                        Tunnel = g.Tunnel == TunnelKind.Tube, Gallery = g.Tunnel == TunnelKind.Gallery, Portal = g.Tunnel != TunnelKind.None && (i == 0 || i == g.Points.Count - 1),
                    });
                    runSource.Add(source[i]);
                }
                Flush();
                if (byTile.TryGetValue(key, out var still) && still == owned) surfaceByTile[key] = stats;
                if (!WorkBudget.Left) yield return null;
            }
            if (byTile.TryGetValue(key, out var mine) && mine == owned) complete.Add(key);
        }

        /// <summary>
        /// The graded sample nearest to each OSM node of the way, in order (a node's sample is at or after the previous one's).
        /// The scan from the previous node's sample stops once the line has moved 30 m further away than the best so far.
        /// </summary>
        static List<(long node, int sample)> NodeSamples(RoadWay way, List<double2> samples)
        {
            var list = new List<(long, int)>(way.Nodes.Count);
            int from = 0;
            foreach (var node in way.Nodes)
            {
                var p = new double2(node.E, node.N);
                int best = from; double bestD = double.PositiveInfinity;
                for (int k = from; k < samples.Count; k++)
                {
                    double d = math.distance(samples[k], p);
                    if (d < bestD) { bestD = d; best = k; }
                    else if (d > bestD + 30) break;
                }
                list.Add((NodeKey(node), best));
                from = best;
            }
            return list;
        }

        void RegisterNodes(RoadWay way, GradedWay g)
        {
            g.Nodes = NodeSamples(way, g.Points);
            foreach (var (node, sample) in g.Nodes)
            {
                if (!nodeWays.TryGetValue(node, out var list)) nodeWays[node] = list = new List<(long, int)>(2);
                list.Add((way.Id, sample));
            }
        }

        void UnregisterNodes(long wayId, GradedWay g)
        {
            if (g.Nodes == null) return;
            foreach (var (node, _) in g.Nodes)
            {
                if (!nodeWays.TryGetValue(node, out var list)) continue;
                list.RemoveAll(e => e.way == wayId);
                if (list.Count == 0) nodeWays.Remove(node);
            }
            g.Nodes = null;
        }

        /// <summary>Ways that took their height from <paramref name="wayId"/> at a shared node (not eased onto while it is graded again).</summary>
        HashSet<long> Dependents(long wayId)
        {
            HashSet<long> found = null;
            foreach (var kv in graded)
                if (kv.Key != wayId && !kv.Value.Regrade && kv.Value.EasedOnto != null && kv.Value.EasedOnto.Contains(wayId)) (found ??= new HashSet<long>()).Add(kv.Key);
            return found;
        }

        /// <summary>
        /// Each of <paramref name="followers"/> whose height at a node it shares with the newly graded <paramref name="g"/> differs
        /// from <paramref name="g"/>'s by more than a centimetre is flagged to be graded again, and the tiles that hold it are set
        /// again (<see cref="TakeDirtyTiles"/>; this tile only if it already set that way). A grading that did not change the
        /// joint flags nothing, so tiles setting each other again always settle.
        /// </summary>
        void FollowAtNodes(GradedWay g, HashSet<long> followers, TileKey key, List<long> tileWays)
        {
            if (followers == null || g.Nodes == null) return;
            var at = new Dictionary<long, int>(g.Nodes.Count);
            foreach (var (node, sample) in g.Nodes) at[node] = sample;
            foreach (var id in followers)
            {
                if (!graded.TryGetValue(id, out var f) || f.Regrade || f.Nodes == null) continue;
                bool differs = false;
                foreach (var (node, sample) in f.Nodes)
                    if (at.TryGetValue(node, out var gs) && math.abs(f.Heights[sample] - g.Heights[gs]) > 0.01) { differs = true; break; }
                if (!differs) continue;
                f.Regrade = true;
                foreach (var t in waysByTile)
                    if (t.Value.Contains(id) && (!t.Key.Equals(key) || tileWays.Contains(id))) dirty.Add(t.Key);
            }
        }

        static double EaseFade(double dist, double len) { if (dist >= len) return 0; double t = 1 - dist / len; return t * t * (3 - 2 * t); }

        /// <summary>
        /// At every OSM node this way shares with a way graded before it, take that way's height there exactly (whatever tile
        /// either was graded in). The offsets are interpolated between neighbouring nodes and fade out beyond them over at least
        /// <see cref="FadeJ"/> samples, longer for large offsets (no more than <see cref="NodeEaseGrade"/> of added grade). Not on a
        /// bridge span between its abutments (the deck passes over), not onto ways about to be graded again (<paramref name="skip"/>).
        /// A road does not take a tube's height: the tubes it meets are returned in <paramref name="tubesToFollow"/> to be graded
        /// again onto it (portals take the road's height). Returns the ways it took heights from.
        /// </summary>
        HashSet<long> EaseOntoNodes(RoadWay way, List<double2> samples, double[] heights, bool[] bridge, List<BridgeSpan> spans, HashSet<long> skip, bool tube, out HashSet<long> tubesToFollow)
        {
            HashSet<long> eased = null;
            tubesToFollow = null;
            if (nodeWays.Count == 0) return null;
            var anchors = new List<(int i, double delta)>();
            foreach (var (node, i) in NodeSamples(way, samples))
            {
                if (!nodeWays.TryGetValue(node, out var list)) continue;
                if (anchors.Count > 0 && anchors[anchors.Count - 1].i == i) continue;
                bool onSpan = false;
                if (bridge[i]) foreach (var sp in spans) if (i > sp.I0 && i < sp.I1) onSpan = true;
                if (onSpan) continue;
                foreach (var (other, sample) in list)
                {
                    if (other == way.Id || (skip != null && skip.Contains(other)) || !graded.TryGetValue(other, out var og) || og.Regrade || sample >= og.Heights.Length) continue;
                    if (!tube && og.Tunnel == TunnelKind.Tube) { (tubesToFollow ??= new HashSet<long>()).Add(other); continue; }
                    anchors.Add((i, og.Heights[sample] - heights[i]));
                    (eased ??= new HashSet<long>()).Add(other);
                    break;
                }
            }
            if (anchors.Count == 0) return eased;
            int n = heights.Length;
            double Len(double delta) => math.max(FadeJ, math.ceil(math.abs(delta) / (NodeEaseGrade * ProfileGrader.SampleStep)));
            var corr = new double[n];
            for (int i = 0; i < n; i++)
            {
                int b = 0;
                while (b < anchors.Count && anchors[b].i < i) b++;
                if (b < anchors.Count && anchors[b].i == i) { corr[i] = anchors[b].delta; continue; }
                bool hasA = b > 0, hasB = b < anchors.Count;
                if (hasA && hasB)
                {
                    var (ia, da) = anchors[b - 1]; var (ib, db) = anchors[b];
                    if (ib - ia <= Len(da) + Len(db))
                    {
                        double t = (i - ia) / (double)(ib - ia); t = t * t * (3 - 2 * t);
                        corr[i] = da + (db - da) * t;
                    }
                    else corr[i] = da * EaseFade(i - ia, Len(da)) + db * EaseFade(ib - i, Len(db));
                }
                else if (hasA) corr[i] = anchors[b - 1].delta * EaseFade(i - anchors[b - 1].i, Len(anchors[b - 1].delta));
                else corr[i] = anchors[b].delta * EaseFade(anchors[b].i - i, Len(anchors[b].delta));
            }
            for (int i = 0; i < n; i++) heights[i] += corr[i];
            return eased;
        }

        static double RawLength(RoadWay w)
        {
            double l = 0;
            if (w.Nodes != null) for (int i = 1; i < w.Nodes.Count; i++) l += math.length(w.Nodes[i].Minus(w.Nodes[i - 1]));
            return l;
        }

        /// <summary>Distances from a way's end over which <see cref="EndGround"/> fits the ground it pins the end to.</summary>
        const double EndFitFrom = 10, EndFitTo = 30;

        /// <summary>A line through (x, y) pairs, read at x = 0 (NaN with fewer than three pairs).</summary>
        static double FitAtZero(List<double2> xy)
        {
            if (xy.Count < 3) return double.NaN;
            double sx = 0, sy = 0, sxx = 0, sxy = 0;
            foreach (var p in xy) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; }
            double m = xy.Count, den = m * sxx - sx * sx;
            if (math.abs(den) < 1e-9) return sy / m;
            double b = (m * sxy - sx * sy) / den;
            return (sy - b * sx) / m;
        }

        /// <summary>
        /// The ground a way's ends are pinned to (ProfileGrader.SmoothRoadHeights pinEnds): a line through the ground 10–30 m in
        /// from each end, read at the end, instead of the one DTM sample there. A way often ends at a tunnel portal, where the
        /// DTM sample runs up the rock face over the mouth, or on a bridge abutment's slope; the fitted ground keeps the trend.
        /// Ways shorter than 40 m keep their raw ends.
        /// </summary>
        static void EndGround(double[] ground, double[] along)
        {
            int n = ground.Length;
            if (n < 2 || along[n - 1] < 2 * EndFitTo) return;
            var xy = new List<double2>(8);
            for (int i = 0; i < n && along[i] <= EndFitTo; i++) if (along[i] >= EndFitFrom) xy.Add(new double2(along[i], ground[i]));
            double a = FitAtZero(xy);
            xy.Clear();
            double L = along[n - 1];
            for (int i = n - 1; i >= 0 && L - along[i] <= EndFitTo; i--) if (L - along[i] >= EndFitFrom) xy.Add(new double2(L - along[i], ground[i]));
            double b = FitAtZero(xy);
            if (!double.IsNaN(a)) ground[0] = math.max(MinGradeGround, a);
            if (!double.IsNaN(b)) ground[n - 1] = math.max(MinGradeGround, b);
        }

        /// <summary>
        /// A short way (under 60 m, too short for <see cref="EndGround"/>) that ends at a tunnel portal takes its other end's ground
        /// all along: the portal's DTM sample is on the rock face (a 9 m connector between a gorge bridge and a portal at Trolljuvet
        /// climbed 10 m, and the tunnel followed it).
        /// </summary>
        static void PortalEnds(RoadWay way, double[] ground, double[] along, HashSet<long> portalNodes)
        {
            int n = ground.Length;
            if (n < 2 || portalNodes.Count == 0 || along[n - 1] >= 2 * EndFitTo) return;
            bool p0 = portalNodes.Contains(NodeKey(way.Nodes[0])), p1 = portalNodes.Contains(NodeKey(way.Nodes[way.Nodes.Count - 1]));
            if (p0 == p1) return;
            double other = p0 ? ground[n - 1] : ground[0];
            for (int i = 0; i < n; i++) ground[i] = other;   // flat: the samples next to the portal are on the rock face too
        }

        /// <summary>
        /// The ground outside a tube's portal: a line through the ground 10–30 m out along the tube's end direction (where the road
        /// comes in), read at the portal; +∞ when that ground is not loaded or the tube is too short to have a direction.
        /// </summary>
        static double OutsideGround(List<double2> samples, bool start, Func<Utm33, float> ground, Func<Utm33, bool> known)
        {
            int n = samples.Count;
            if (n < 2) return double.PositiveInfinity;
            double2 end = start ? samples[0] : samples[n - 1], inner = start ? samples[1] : samples[n - 2];
            double2 dir = math.normalizesafe(end - inner);
            var xy = new List<double2>(5);
            for (double d = EndFitFrom; d <= EndFitTo + 1e-6; d += 5)
            {
                var q = end + dir * d;
                var u = new Utm33(q.x, q.y);
                if (known != null && !known(u)) return double.PositiveInfinity;
                xy.Add(new double2(d, ground(u)));
            }
            double v = FitAtZero(xy);
            return double.IsNaN(v) ? double.PositiveInfinity : v;
        }

        /// <summary>Samples over ground that is not loaded take the nearest loaded sample's ground (left alone if there is none).</summary>
        static void HoldKnownGround(double[] ground, bool[] unknown)
        {
            int n = ground.Length;
            var next = new int[n];
            for (int i = n - 1, k = -1; i >= 0; i--) { if (!unknown[i]) k = i; next[i] = k; }
            if (next[0] < 0) return;   // nothing known along the way
            var src = (double[])ground.Clone();
            for (int i = 0, last = -1; i < n; i++)
            {
                if (!unknown[i]) { last = i; continue; }
                int a = last, b = next[i];
                ground[i] = src[a < 0 ? b : b < 0 ? a : (i - a <= b - i ? a : b)];
            }
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
            bool barred = IsBarred(way.Tags), tunnel = g.Tunnel == TunnelKind.Tube;
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
                var fwd = new RoadLink { Id = way.Id, From = a, To = b, Length = length, Curvature = turn / (length / 100f), Climb = math.abs(hs[hs.Length - 1] - hs[0]) / length, Paved = paved, Barred = barred, Tunnel = tunnel, RoadClass = cls, Points = pts, Heights = hs };
                var backPts = new List<double2>(pts); backPts.Reverse();
                var backHs = (float[])hs.Clone(); System.Array.Reverse(backHs);
                var back = new RoadLink { Id = way.Id, From = b, To = a, Length = length, Curvature = fwd.Curvature, Climb = fwd.Climb, Paved = paved, Barred = barred, Tunnel = tunnel, RoadClass = cls, Points = backPts, Heights = backHs };
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
        /// <summary>The tile's roads are all in (graded to the end: <see cref="SetTileSteps"/> registers a tile when it starts).</summary>
        public bool HasTile(TileKey key) => complete.Contains(key);
        readonly HashSet<TileKey> complete = new HashSet<TileKey>();

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
        void EaseOntoJunctions(long wayId, List<double2> samples, double[] heights, bool[] covered, bool[] bridge, List<BridgeSpan> spans, bool tube)
        {
            if (buckets.Count == 0) return;   // not SegmentCount: that is only summed when the tile is done, and ways of the same tile must ease onto each other too
            // A deck between its abutments never takes another road's height (that road passes under it), and a deck more
            // than PassOver above or below this way's grade is a road passing over or under it, not a junction.
            // Likewise a tube between its portals: it passes under whatever is over it and meets roads only at its ends.
            bool OnSpan(int i)
            {
                if (tube) return i > 0 && i < samples.Count - 1;
                if (bridge == null || !bridge[i]) return false;
                foreach (var sp in spans) if (i > sp.I0 && i < sp.I1) return true;
                return false;
            }
            bool PassesOver(in RoadHit q, int i) => (q.Bridge || q.Tunnel) && math.abs(q.RoadY - heights[i]) > PassOver;
            int lastHit = -FadeJ;
            for (int i = 0; i < samples.Count; i++)
            {
                if (i - lastHit < 4 || OnSpan(i)) continue;   // one anchor per 20 m of shared road
                if (!Nearest(new Utm33(samples[i].x, samples[i].y), 4, RoadLayer.Any, wayId, out var q) || q.Distance > 2.5 || PassesOver(q, i) || (q.Tunnel && !tube)) continue;
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
                if (!OnSpan(i) && Nearest(new Utm33(samples[i].x, samples[i].y), 30, RoadLayer.Any, wayId, out var q) && !PassesOver(q, i) && (tube || !q.Tunnel) && q.Distance <= RoadConstants.FlatHalf(q.Half) + RoadConstants.CarveApron + JunctionFlat)
                { heights[i] = q.RoadY; conformed[i] = true; any = true; covered[i] = q.Distance <= RoadConstants.FlatHalf(q.Half) && !q.Bridge && !q.Tunnel; }   // a deck's / tunnel's ribbon does not reach back over the land: the road meeting it draws its own up to the abutment / portal
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
            complete.Remove(key);
            inputs.Remove(key);
            dirty.Remove(key);
            if (!byTile.TryGetValue(key, out var owned)) return;
            foreach (var (bk, seg) in owned)
            {
                if (seg.Bridge) BridgeSegmentCount--;
                if (seg.Tunnel) TunnelSegmentCount--;
                if (!buckets.TryGetValue(bk, out var list)) continue;
                list.Remove(seg);
                if (list.Count == 0) buckets.Remove(bk);
            }
            SegmentCount -= owned.Count;
            byTile.Remove(key);
            surfaceByTile.Remove(key);
            foreach (var id in waysByTile[key]) if (graded.TryGetValue(id, out var g) && --g.Refs <= 0) { graded.Remove(id); UnregisterNodes(id, g); }
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
        public bool Nearest(Utm33 p, double limit, RoadLayer layer, out RoadHit hit) => Nearest(p, limit, layer, 0, out hit);

        /// <summary>
        /// <see cref="Nearest(Utm33, double, RoadLayer, out RoadHit)"/> ignoring way <paramref name="exclude"/> (0: none). A way graded
        /// again still has its old segments in the buckets: its junction easing must look past them, or the old copy of itself
        /// hid the road it meets and the regraded way came out differently from a first grading (load-order seams).
        /// </summary>
        bool Nearest(Utm33 p, double limit, RoadLayer layer, long exclude, out RoadHit hit)
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
                        if (exclude != 0 && seg.Id == exclude) continue;
                        if ((layer == RoadLayer.Ground && (seg.Bridge || seg.Tunnel)) || (layer == RoadLayer.Deck && !seg.Bridge) || (layer == RoadLayer.Tunnel && !seg.Tunnel)) continue;
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
                Half = best.Lanes.Half, Cut = best.Lanes.Cut, Surface = best.Paved ? Surface.Asphalt : Surface.Gravel, Side = side >= 0 ? 1 : -1, Bridge = best.Bridge, Tunnel = best.Tunnel,
            };
            return true;
        }

        /// <summary>
        /// Carve input for a tile: every segment whose reach touches the bounds, tile-local, ROAD_LIFT + CarveLift added (roads.js
        /// carvePolylines; the lift puts the terrain at the ribbon edge). A bridge span is a CarveSegment.DeckOnly out to the
        /// deck's half width: it carves nothing, wins the cells nearer to it than to the approach roads and marks its footprint.
        /// A tunnel segment is a CarveSegment.TunnelOnly out to the tube's outer wall: the mountain over it stays.
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
                            HalfWidth = seg.Bridge ? RoadConstants.DeckHalf(seg.Lanes.Half) : seg.Tunnel ? RoadConstants.TunnelHalf(seg.Lanes.Half) + RoadConstants.TunnelWallThick : flat,
                            Shoulder = seg.Bridge || seg.Tunnel ? RoadConstants.MaxEarthwork : shoulder,
                            Flags = seg.Bridge ? CarveSegment.DeckOnly : seg.Tunnel ? CarveSegment.TunnelOnly : 0u,
                        });
                    }
                }
        }

        /// <summary>Every tunnel segment in the buckets within <paramref name="radius"/> of a point (TileWorld: the terrain's portal holes).</summary>
        public void TunnelSegmentsNear(Utm33 p, double radius, List<TunnelPiece> output)
        {
            if (TunnelSegmentCount == 0) return;
            int r = (int)math.ceil(radius / Cell), bx = (int)math.floor(p.E / Cell), bz = (int)math.floor(p.N / Cell);
            for (int dj = -r; dj <= r; dj++)
                for (int di = -r; di <= r; di++)
                {
                    if (!buckets.TryGetValue(Key(bx + di, bz + dj), out var list)) continue;
                    foreach (var seg in list)
                        if (seg.Tunnel) output.Add(new TunnelPiece { A = seg.A, B = seg.B, Ya = seg.Ya, Yb = seg.Yb, Half = seg.Lanes.Half, PortalA = seg.PortalA, PortalB = seg.PortalB });
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
