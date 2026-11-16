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

        sealed class Seg
        {
            public long Id; public double2 A, B; public float Ya, Yb; public LaneSpec Lanes; public bool Paved;
        }
        sealed class GradedWay { public List<double2> Points; public double[] Heights; public int Refs; }

        readonly Dictionary<long, List<Seg>> buckets = new Dictionary<long, List<Seg>>();
        readonly Dictionary<TileKey, List<(long bucket, Seg seg)>> byTile = new Dictionary<TileKey, List<(long, Seg)>>();
        readonly Dictionary<TileKey, List<long>> waysByTile = new Dictionary<TileKey, List<long>>();
        readonly Dictionary<long, GradedWay> graded = new Dictionary<long, GradedWay>();
        // Junction graph (RoadLink): node key → outgoing links; links shared by overlapping tiles are ref-counted.
        readonly Dictionary<long, List<RoadLink>> links = new Dictionary<long, List<RoadLink>>();
        readonly Dictionary<long, Utm33> nodes = new Dictionary<long, Utm33>();
        readonly Dictionary<long, (RoadLink fwd, RoadLink back, int refs)> linkRefs = new Dictionary<long, (RoadLink, RoadLink, int)>();
        readonly Dictionary<TileKey, List<long>> linksByTile = new Dictionary<TileKey, List<long>>();

        // StageRoute-compatible fields (roads.js RoadNetwork constructor).
        public string Name = "Free drive";
        public bool Free = true;
        public string Source = "osm";
        public float RoadWidth = 3.0f;          // default half width when no road is near
        public float Length = 0;
        public Utm33 Spawn;
        public float SpawnYaw;
        public int SegmentCount { get; private set; }

        static long Key(int bx, int bz) => ((long)bx << 32) ^ (uint)bz;
        static long BucketOf(double2 p) => Key((int)math.floor(p.x / Cell), (int)math.floor(p.y / Cell));
        /// <summary>Node identity: the coordinate to the centimetre, so ways that share an OSM node share the key.</summary>
        public static long NodeKey(Utm33 p) => ((long)math.round(p.E * 100) << 32) ^ (uint)(long)math.round(p.N * 100);
        static long LinkKey(long from, long to) => (from * 0x9E3779B97F4A7C15L) ^ to;

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

        /// <summary>
        /// Prepare and register a tile's ways. <paramref name="coarseGround"/> samples the untouched 8 m DTM.
        /// Returns the runs inside the padded tile (for the ribbon mesh); heights for a way already graded by
        /// another tile are reused, so overlapping copies agree exactly.
        /// </summary>
        public List<RoadPolyline> SetTile(TileKey key, RoadGraphData data, Func<Utm33, float> coarseGround)
        {
            RemoveTile(key);
            var lines = new List<RoadPolyline>();
            if (data == null || data.Ways == null) return lines;
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
            foreach (var way in data.Ways)
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
                    var samples = ProfileGrader.Resample(ProfileGrader.Chaikin(raw, pinned), ProfileGrader.SampleStep);
                    var ground = new double[samples.Count];
                    for (int i = 0; i < samples.Count; i++) ground[i] = coarseGround(new Utm33(samples[i].x, samples[i].y));
                    var heights = ProfileGrader.SmoothRoadHeights(ground, ProfileGrader.SampleStep);
                    EaseOntoJunctions(way.Id, samples, heights);
                    g = new GradedWay { Points = samples, Heights = heights };
                    graded[way.Id] = g;
                }
                g.Refs++;
                ways.Add(way.Id);
                bool paved = ProfileGrader.IsPaved(way.Tags);
                string name = way.Tags != null && way.Tags.TryGetValue("name", out var nm) ? nm : null;
                string kind = way.Tags["highway"];
                AddLinks(way, g, nodeCount, paved, kind, tileLinks);
                // Split into runs inside the padded tile; runs shorter than 3 samples are noise.
                var run = new List<RoadSample>();
                void Flush()
                {
                    if (run.Count >= 3)
                    {
                        var line = new RoadPolyline { Id = way.Id, Name = name, Kind = kind, Lanes = spec.Value, Paved = paved, Samples = run, Length = run[run.Count - 1].S };
                        lines.Add(line);
                        for (int k = 0; k + 1 < run.Count; k++)
                        {
                            var seg = new Seg { Id = way.Id, A = run[k].P, B = run[k + 1].P, Ya = run[k].RoadY, Yb = run[k + 1].RoadY, Lanes = spec.Value, Paved = paved };
                            long bk = BucketOf((seg.A + seg.B) / 2);
                            if (!buckets.TryGetValue(bk, out var list)) buckets[bk] = list = new List<Seg>();
                            list.Add(seg);
                            owned.Add((bk, seg));
                        }
                    }
                    run = new List<RoadSample>();
                }
                float s = 0;
                for (int i = 0; i < g.Points.Count; i++)
                {
                    var p = g.Points[i];
                    if (!Inside(p)) { Flush(); s = 0; continue; }
                    if (run.Count > 0) s += (float)math.distance(p, run[run.Count - 1].P);
                    run.Add(new RoadSample { P = p, RoadY = (float)g.Heights[i], S = s });
                }
                Flush();
            }
            byTile[key] = owned;
            waysByTile[key] = ways;
            linksByTile[key] = tileLinks;
            SegmentCount += owned.Count;
            return lines;
        }

        /// <summary>
        /// Split a graded way into junction-to-junction links (both directions). Junctions are the raw OSM
        /// nodes shared with another way; their graded sample is the nearest point, because Chaikin keeps
        /// pinned nodes in place but Resample's arithmetic is not bit-exact.
        /// </summary>
        void AddLinks(RoadWay way, GradedWay g, Dictionary<long, int> nodeCount, bool paved, string kind, List<long> tileLinks)
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

        /// <summary>
        /// roads.js junction easing: wherever this way meets a road already in the network (its ends,
        /// T-junctions, crossings) its height is eased onto that road over ±FadeJ samples (60 m), so roads
        /// meet without a step and the carve never has two heights for one spot.
        /// </summary>
        void EaseOntoJunctions(long wayId, List<double2> samples, double[] heights)
        {
            if (SegmentCount == 0) return;
            int lastHit = -FadeJ;
            for (int i = 0; i < samples.Count; i++)
            {
                if (i - lastHit < 4) continue;   // one anchor per 20 m of shared road
                if (!Nearest(new Utm33(samples[i].x, samples[i].y), 4, out var q) || q.Distance > 2.5 || q.Id == wayId) continue;
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
        }

        public void RemoveTile(TileKey key)
        {
            if (!byTile.TryGetValue(key, out var owned)) return;
            foreach (var (bk, seg) in owned)
            {
                if (!buckets.TryGetValue(bk, out var list)) continue;
                list.Remove(seg);
                if (list.Count == 0) buckets.Remove(bk);
            }
            SegmentCount -= owned.Count;
            byTile.Remove(key);
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
        public bool Nearest(Utm33 p, double limit, out RoadHit hit)
        {
            var q = new double2(p.E, p.N);
            int bx = (int)math.floor(q.x / Cell), bz = (int)math.floor(q.y / Cell), r = (int)math.ceil(limit / Cell);
            Seg best = null; double bestD = double.PositiveInfinity, bestT = 0;
            for (int dj = -r; dj <= r; dj++)
                for (int di = -r; di <= r; di++)
                {
                    if (!buckets.TryGetValue(Key(bx + di, bz + dj), out var list)) continue;
                    for (int i = 0; i < list.Count; i++)
                    {
                        var seg = list[i];
                        double2 ab = seg.B - seg.A;
                        double l2 = math.lengthsq(ab); if (l2 == 0) l2 = 1;
                        double t = math.clamp(math.dot(q - seg.A, ab) / l2, 0, 1);
                        double d = math.distance(q, seg.A + ab * t);
                        if (d < bestD) { bestD = d; best = seg; bestT = t; }
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
                Half = best.Lanes.Half, Cut = best.Lanes.Cut, Surface = best.Paved ? Surface.Asphalt : Surface.Gravel, Side = side >= 0 ? 1 : -1,
            };
            return true;
        }

        /// <summary>Carve input for a tile: every segment whose reach touches the bounds, tile-local, ROAD_LIFT added (roads.js carvePolylines).</summary>
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
                        float flat = RoadConstants.FlatHalf(seg.Lanes.Half), shoulder = RoadProfile.ShoulderFor(seg.Lanes.Half, seg.Lanes.Cut), reach = flat + shoulder;
                        double2 lo = math.min(seg.A, seg.B) - reach, hi = math.max(seg.A, seg.B) + reach;
                        if (hi.x < bounds.MinE || lo.x > bounds.MaxE || hi.y < bounds.MinN || lo.y > bounds.MaxN) continue;
                        output.Add(new CarveSegment
                        {
                            A = (float2)(seg.A - new double2(origin.E, origin.N)), B = (float2)(seg.B - new double2(origin.E, origin.N)),
                            Ha = seg.Ya + RoadConstants.RoadLift, Hb = seg.Yb + RoadConstants.RoadLift, HalfWidth = flat, Shoulder = shoulder,
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
