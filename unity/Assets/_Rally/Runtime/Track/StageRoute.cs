using System;
using System.Collections.Generic;
using Rally.Core;
using Unity.Mathematics;

namespace Rally.Track
{
    /// <summary>One sample of the stage line (stage.js:86). Planar position is EPSG:25833 (long-lived, see FloatingOrigin).</summary>
    public struct RouteSample
    {
        public double E, N;
        /// <summary>Ground height at the sample (JS y).</summary>
        public float Y;
        /// <summary>Cumulative metres from the start (JS s).</summary>
        public float S;
        /// <summary>Graded carriageway height (JS roadY), valid when <see cref="HasRoadY"/>.</summary>
        public float RoadY;
        public bool HasRoadY;
        /// <summary>Smoothed natural ground at the cut-through edges (JS edgeL / edgeR), valid when <see cref="HasEdges"/>.</summary>
        public float EdgeL, EdgeR;
        public bool HasEdges;
        public Surface Surface;

        public RouteSample(double e, double n, float s, float y = 0f, Surface surface = Surface.Gravel)
        {
            E = e; N = n; S = s; Y = y; Surface = surface;
            RoadY = 0f; HasRoadY = false; EdgeL = 0f; EdgeR = 0f; HasEdges = false;
        }

        public Utm33 Utm => new Utm33(E, N);
        public float2 World => FloatingOrigin.ToWorldXZ(new Utm33(E, N));
        /// <summary>JS `roadY ?? y`.</summary>
        public float Carriageway => HasRoadY ? RoadY : Y;
    }

    /// <summary>Start / finish gate placement (stage.js:941 buildGate).</summary>
    public struct GatePose
    {
        public float2 XZ;
        public float Y;
        public float Yaw;
        /// <summary>Post-to-post width: roadWidth · 2 + 2.6.</summary>
        public float Width;
    }

    /// <summary>A roadside marker post (stage.js:1154 buildPosts): white on one side, red on the other, every 26 m.</summary>
    public struct PostMarker
    {
        public float2 XZ;
        public float Y;
        public bool Red;
    }

    /// <summary>
    /// Port of stage.js:62 StageRoute: the stage line as 4–5 m samples with cumulative distance, a
    /// proximity query used for road grip, progress and the HUD, and the grading helpers of corridor.js.
    /// Unlike the JS (which scanned every sample), <see cref="Nearest"/> looks up 48 m buckets
    /// (stage.js:798 buildRouteIndex) and measures against the closest *segment* (roads.js:346), so the
    /// answer never steps by half a sample spacing; when nothing lies within the limit the whole line is
    /// scanned, because a stage is one line and progress must never be lost.
    /// </summary>
    public sealed class StageRoute : IRoute
    {
        /// <summary>Bucket size of the proximity index (stage.js:798 cell = 48).</summary>
        public const float BucketCell = 48f;

        public readonly RouteSample[] Samples;
        public string Name { get; set; }
        public string Source { get; set; }
        public float RoadWidth { get; set; }
        public float CutHalf { get; set; }
        public Surface Surface { get; set; }
        public float Length { get; private set; }
        public bool Free => false;

        readonly Dictionary<long, int2> buckets = new Dictionary<long, int2>(); // key → (start, count) into bucketSegments
        int[] bucketSegments = Array.Empty<int>();

        /// <summary>stage.js:63. Samples the ground at every point for the sample heights.</summary>
        public StageRoute(IReadOnlyList<Utm33> points, IGround ground, string name = "Rally stage", string source = "generated",
            float roadWidth = RoadConstants.OneLaneHalf, float cutHalf = -1f, Surface surface = Surface.Gravel)
        {
            Name = name; Source = source; RoadWidth = roadWidth; Surface = surface;
            // stage.js:68 — half width of the cut-through
            CutHalf = cutHalf >= 0f ? cutHalf : math.max(RoadConstants.OneLaneCut, RoadConstants.FlatHalf(roadWidth));
            Samples = PrepareSamples(points, ground, surface);
            Length = Samples.Length > 0 ? Samples[Samples.Length - 1].S : 0f;
            BuildIndex();
        }

        /// <summary>stage.js:77 prepareSamples: cumulative s and the ground height at every point.</summary>
        static RouteSample[] PrepareSamples(IReadOnlyList<Utm33> points, IGround ground, Surface surface)
        {
            var outp = new RouteSample[points.Count];
            double s = 0;
            for (int i = 0; i < points.Count; i++)
            {
                var p = points[i];
                if (i > 0) { var q = points[i - 1]; s += math.sqrt((p.E - q.E) * (p.E - q.E) + (p.N - q.N) * (p.N - q.N)); }
                outp[i] = new RouteSample(p.E, p.N, (float)s, ground.HeightAt(FloatingOrigin.ToWorldXZ(p)), surface);
            }
            return outp;
        }

        /// <summary>stage.js:91 at(index): clamped sample access.</summary>
        public ref RouteSample At(int index) => ref Samples[math.clamp(index, 0, Samples.Length - 1)];

        /* ---------------- proximity index (stage.js:798 buildRouteIndex, segments like roads.js) ---------------- */

        static long Key(int bx, int bz) => ((long)bx << 32) | (uint)bz;

        void BuildIndex()
        {
            buckets.Clear();
            int n = Samples.Length - 1;
            if (n < 1) { bucketSegments = Array.Empty<int>(); return; }
            var pairs = new List<(long key, int seg)>(n * 2);
            for (int k = 0; k < n; k++)
            {
                ref var a = ref Samples[k]; ref var b = ref Samples[k + 1];
                int i0 = (int)math.floor(math.min(a.E, b.E) / BucketCell), i1 = (int)math.floor(math.max(a.E, b.E) / BucketCell);
                int j0 = (int)math.floor(math.min(a.N, b.N) / BucketCell), j1 = (int)math.floor(math.max(a.N, b.N) / BucketCell);
                for (int j = j0; j <= j1; j++) for (int i = i0; i <= i1; i++) pairs.Add((Key(i, j), k));
            }
            pairs.Sort((p, q) => p.key != q.key ? p.key.CompareTo(q.key) : p.seg.CompareTo(q.seg));
            bucketSegments = new int[pairs.Count];
            int start = 0;
            for (int i = 0; i < pairs.Count; i++)
            {
                bucketSegments[i] = pairs[i].seg;
                if (i + 1 == pairs.Count || pairs[i + 1].key != pairs[i].key)
                {
                    buckets[pairs[i].key] = new int2(start, i + 1 - start);
                    start = i + 1;
                }
            }
        }

        void TestSegment(int k, double ex, double nz, ref double bestD2, ref int bestK, ref double bestT)
        {
            ref var a = ref Samples[k]; ref var b = ref Samples[k + 1];
            double dx = b.E - a.E, dz = b.N - a.N;
            double l2 = dx * dx + dz * dz;
            double t = l2 < 1e-12 ? 0 : math.clamp(((ex - a.E) * dx + (nz - a.N) * dz) / l2, 0, 1);
            double px = ex - (a.E + dx * t), pz = nz - (a.N + dz * t);
            double d2 = px * px + pz * pz;
            if (d2 < bestD2) { bestD2 = d2; bestK = k; bestT = t; }
        }

        /// <summary>Nearest segment to a world xz (stage.js:130 nearest / roads.js:346). No allocation.</summary>
        public RouteQuery Nearest(float2 xz, float limit = 120f)
        {
            if (Samples.Length < 2) return RouteQuery.None(xz);
            var u = FloatingOrigin.ToUtm(xz);
            int bx = (int)math.floor(u.E / BucketCell), bz = (int)math.floor(u.N / BucketCell);
            int r = (int)math.ceil(limit / BucketCell);
            double bestD2 = double.PositiveInfinity, bestT = 0; int bestK = -1;
            for (int dj = -r; dj <= r; dj++)
                for (int di = -r; di <= r; di++)
                {
                    if (!buckets.TryGetValue(Key(bx + di, bz + dj), out var range)) continue;
                    for (int i = range.x; i < range.x + range.y; i++) TestSegment(bucketSegments[i], u.E, u.N, ref bestD2, ref bestK, ref bestT);
                }
            if (bestK < 0)
                for (int k = 0; k + 1 < Samples.Length; k++) TestSegment(k, u.E, u.N, ref bestD2, ref bestK, ref bestT);

            ref var a = ref Samples[bestK]; ref var b = ref Samples[bestK + 1];
            double ddx = b.E - a.E, ddz = b.N - a.N;
            double l = math.sqrt(ddx * ddx + ddz * ddz);
            float tx = 0f, tz = 1f;
            if (l > 1e-9) { tx = (float)(ddx / l); tz = (float)(ddz / l); }
            float t = (float)bestT;
            double px = a.E + ddx * bestT, pz = a.N + ddz * bestT;
            var q = new RouteQuery
            {
                Distance = (float)math.sqrt(bestD2),
                // Which side of the road: the left normal is (−tz, tx), like the carve (car.js:814).
                Side = (float)((u.E - px) * -tz + (u.N - pz) * tx),
                T = t,
                RoadY = math.lerp(a.Carriageway, b.Carriageway, t),
                HalfWidth = RoadWidth,
                Surface = a.Surface,
                Heading = math.atan2(tx, tz),
                Segment = bestK,
                S = math.lerp(a.S, b.S, t),
                Point = FloatingOrigin.ToWorldXZ(new Utm33(px, pz)),
                Tangent = new float2(tx, tz),
                Cut = CutHalf,
                HasEdges = a.HasEdges && b.HasEdges,
            };
            q.Progress = Length > 0f ? q.S / Length : 0f;
            if (q.HasEdges) { q.EdgeL = math.lerp(a.EdgeL, b.EdgeL, t); q.EdgeR = math.lerp(a.EdgeR, b.EdgeR, t); }
            return q;
        }

        /// <summary>stage.js:185.</summary>
        public float DistanceTo(float2 xz) => Nearest(xz).Distance;

        /// <summary>stage.js:189 sampleAtDistance: binary search on s, linear between the two samples.</summary>
        public RoutePose SampleAtDistance(float distance)
        {
            float s = math.clamp(distance, 0f, Length);
            int lo = 0, hi = Samples.Length - 1;
            while (lo < hi - 1)
            {
                int mid = (lo + hi) >> 1;
                if (Samples[mid].S < s) lo = mid; else hi = mid;
            }
            ref var a = ref Samples[lo]; ref var b = ref Samples[hi];
            float t = (s - a.S) / math.max(0.0001f, b.S - a.S);
            double ex = a.E + (b.E - a.E) * t, nz = a.N + (b.N - a.N) * t;
            return new RoutePose
            {
                XZ = FloatingOrigin.ToWorldXZ(new Utm33(ex, nz)),
                Y = a.Y + (b.Y - a.Y) * t,
                Yaw = (float)math.atan2(b.E - a.E, b.N - a.N),
            };
        }

        /// <summary>stage.js:209 startPose: the first sample, facing the fifth.</summary>
        public RoutePose StartPose()
        {
            ref var p = ref Samples[0];
            ref var q = ref Samples[math.min(4, Samples.Length - 1)];
            return new RoutePose { XZ = p.World, Y = p.Y, Yaw = (float)math.atan2(q.E - p.E, q.N - p.N) };
        }

        /* ---------------- grading (stage.js:101 assignRoadY, corridor.js) ---------------- */

        /// <summary>
        /// stage.js:101 assignRoadY: smooth the natural ground along the route into a carriageway height
        /// (±window metres of running mean) so the road rides over dips on embankments and through crests
        /// in cuttings, then the rim heights at the cut-through edges. <paramref name="natural"/> must be the
        /// uncarved ground (JS sampleBase).
        /// </summary>
        public StageRoute AssignRoadY(IGround natural, float window = 45f)
        {
            var raw = new float[Samples.Length];
            for (int i = 0; i < raw.Length; i++) raw[i] = natural.HeightAt(Samples[i].World);
            var smooth = SmoothRoadHeights(raw, MeanSpacing(), window, 3);
            for (int i = 0; i < raw.Length; i++) { Samples[i].RoadY = smooth[i]; Samples[i].HasRoadY = true; }
            AssignEdgeHeights(natural, CutHalf, 30f);
            return this;
        }

        /// <summary>stage.js:112 snapToTerrain: re-read every sample's height (after a start pad carve) and the distances.</summary>
        public StageRoute SnapToTerrain(IGround ground)
        {
            double s = 0;
            for (int i = 0; i < Samples.Length; i++)
            {
                ref var p = ref Samples[i];
                if (i > 0) { ref var q = ref Samples[i - 1]; s += math.sqrt((p.E - q.E) * (p.E - q.E) + (p.N - q.N) * (p.N - q.N)); }
                p.Y = ground.HeightAt(p.World);
                p.S = (float)s;
            }
            Length = (float)s;
            return this;
        }

        /// <summary>corridor.js:124 meanSpacing.</summary>
        public float MeanSpacing()
        {
            if (Samples.Length < 2) return 1f;
            double s = 0;
            for (int i = 1; i < Samples.Length; i++)
            {
                double dx = Samples[i].E - Samples[i - 1].E, dz = Samples[i].N - Samples[i - 1].N;
                s += math.sqrt(dx * dx + dz * dz);
            }
            return (float)(s / (Samples.Length - 1));
        }

        /// <summary>
        /// corridor.js:105 smoothRoadHeights: a real road is graded, it does not copy every bump. Three passes
        /// of a ±window metre running mean (close to a Gaussian of σ ≈ window) over the raw heights.
        /// </summary>
        public static float[] SmoothRoadHeights(float[] raw, float spacing, float window = 60f, int passes = 3)
        {
            int n = raw.Length;
            int k = math.max(1, (int)math.round(window / math.max(0.5f, spacing)));
            var cur = new double[n];
            for (int i = 0; i < n; i++) cur[i] = raw[i];
            var prefix = new double[n + 1];
            for (int p = 0; p < passes; p++)
            {
                prefix[0] = 0;
                for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + cur[i];
                var next = new double[n];
                for (int i = 0; i < n; i++)
                {
                    int a = math.max(0, i - k), b = math.min(n - 1, i + k);
                    next[i] = (prefix[b + 1] - prefix[a]) / (b - a + 1);
                }
                cur = next;
            }
            var result = new float[n];
            for (int i = 0; i < n; i++) result[i] = (float)cur[i];
            return result;
        }

        /// <summary>
        /// corridor.js:73 assignEdgeHeights: natural ground at both cut-through edges of every sample, smoothed
        /// along the road (edgeL on the side of the left normal (−tz, tx)), so the terrace rims run smoothly.
        /// </summary>
        public void AssignEdgeHeights(IGround natural, float cut, float window = 30f)
        {
            int n = Samples.Length;
            if (n < 2) return;
            var left = new float[n]; var right = new float[n];
            for (int i = 0; i < n; i++)
            {
                ref var p = ref Samples[i];
                ref var prev = ref Samples[math.max(0, i - 1)];
                ref var next = ref Samples[math.min(n - 1, i + 1)];
                double tx = next.E - prev.E, tz = next.N - prev.N;
                double tl = math.sqrt(tx * tx + tz * tz); if (tl == 0) tl = 1;
                tx /= tl; tz /= tl;
                double nx = -tz, nz = tx;
                left[i] = natural.HeightAt(FloatingOrigin.ToWorldXZ(new Utm33(p.E + nx * cut, p.N + nz * cut)));
                right[i] = natural.HeightAt(FloatingOrigin.ToWorldXZ(new Utm33(p.E - nx * cut, p.N - nz * cut)));
            }
            float spacing = MeanSpacing();
            var sl = SmoothRoadHeights(left, spacing, window, 2);
            var sr = SmoothRoadHeights(right, spacing, window, 2);
            for (int i = 0; i < n; i++) { Samples[i].EdgeL = sl[i]; Samples[i].EdgeR = sr[i]; Samples[i].HasEdges = true; }
        }

        /* ---------------- gates and posts (data only; the World builds the meshes) ---------------- */

        /// <summary>stage.js:941 buildGate: the gate sits on the 4th sample (start) or the last (finish), facing along the line.</summary>
        public GatePose Gate(bool atStart, IGround ground)
        {
            int gateIndex = atStart ? math.min(3, Samples.Length - 1) : math.max(0, Samples.Length - 1);
            ref var sample = ref Samples[gateIndex];
            ref var near = ref Samples[atStart ? math.min(gateIndex + 3, Samples.Length - 1) : math.max(0, gateIndex - 3)];
            var xz = sample.World;
            return new GatePose
            {
                XZ = xz,
                Y = ground.HeightAt(xz) + 0.1f,
                Yaw = (float)math.atan2(near.E - sample.E, near.N - sample.N),
                Width = RoadWidth * 2f + 2.6f,
            };
        }

        /// <summary>stage.js:1154 buildPosts: a post every 26 m from 18 m in, alternating sides, 1.2 m outside the carriageway.</summary>
        public int Posts(List<PostMarker> into, IGround ground)
        {
            const float step = 26f;
            int count = 0;
            float half = RoadWidth;
            for (float d = 18f; d < Length - 12f; d += step)
            {
                var p = SampleAtDistance(d);
                var prev = SampleAtDistance(d - 3f);
                var next = SampleAtDistance(d + 3f);
                float tx = next.XZ.x - prev.XZ.x, tz = next.XZ.y - prev.XZ.y;
                float tl = math.length(new float2(tx, tz)); if (tl == 0f) tl = 1f;
                float nx = -tz / tl, nz = tx / tl;
                int side = ((int)math.floor(d / step + 0.5f)) % 2 != 0 ? 1 : -1;
                var xz = new float2(p.XZ.x + nx * (half + 1.2f) * side, p.XZ.y + nz * (half + 1.2f) * side);
                into.Add(new PostMarker { XZ = xz, Y = ground.HeightAt(xz) + 0.55f, Red = side > 0 });
                count++;
            }
            return count;
        }

        /* ---------------- makeRoute (stage.js:301): simplify → chaikin → resample ---------------- */

        /// <summary>stage.js:301 makeRoute: Douglas–Peucker (ε 2.5 m), two Chaikin passes, 4 m resampling, then the route.</summary>
        public static StageRoute Make(IReadOnlyList<Utm33> points, IGround ground, float spacing = 4f, int smooth = 2, bool simplify = true,
            float simplifyEpsilon = 2.5f, string name = "Rally stage", string source = "generated",
            float roadWidth = RoadConstants.OneLaneHalf, float cutHalf = -1f, Surface surface = Surface.Gravel)
        {
            var pts = new List<double2>(points.Count);
            for (int i = 0; i < points.Count; i++) pts.Add(new double2(points[i].E, points[i].N));
            var simplified = simplify ? Simplify(pts, simplifyEpsilon) : pts;
            var smoothed = Chaikin(simplified, smooth);
            var sampled = Resample(smoothed, spacing);
            var utm = new List<Utm33>(sampled.Count);
            for (int i = 0; i < sampled.Count; i++) utm.Add(new Utm33(sampled[i].x, sampled[i].y));
            return new StageRoute(utm, ground, name, source, roadWidth, cutHalf, surface);
        }

        /// <summary>stage.js:221 chaikin corner cutting.</summary>
        public static List<double2> Chaikin(List<double2> points, int iterations = 2)
        {
            var p = new List<double2>(points);
            for (int k = 0; k < iterations; k++)
            {
                if (p.Count < 3) break;
                var q = new List<double2>(p.Count * 2) { p[0] };
                for (int i = 0; i < p.Count - 1; i++)
                {
                    var a = p[i]; var b = p[i + 1];
                    q.Add(a * 0.75 + b * 0.25);
                    q.Add(a * 0.25 + b * 0.75);
                }
                q.Add(p[p.Count - 1]);
                p = q;
            }
            return p;
        }

        /// <summary>stage.js:238 resample to `spacing` metres (the last point kept when more than 1 m from the last sample).</summary>
        public static List<double2> Resample(List<double2> points, double spacing)
        {
            if (points.Count < 2) return points;
            var outp = new List<double2> { points[0] };
            double carry = 0;
            for (int i = 1; i < points.Count; i++)
            {
                var a = points[i - 1]; var b = points[i];
                var d = b - a;
                double len = math.length(d);
                if (len < 0.0001) continue;
                double t = (spacing - carry) / len;
                while (t <= 1)
                {
                    outp.Add(a + d * t);
                    t += spacing / len;
                }
                carry = (carry + len) % spacing;
            }
            var last = points[points.Count - 1];
            if (math.length(last - outp[outp.Count - 1]) > 1) outp.Add(last);
            return outp;
        }

        /// <summary>stage.js:263 simplify: iterative Douglas–Peucker.</summary>
        public static List<double2> Simplify(List<double2> points, double epsilon = 2.5)
        {
            if (points.Count < 3) return points;
            double sq = epsilon * epsilon;
            var keep = new bool[points.Count];
            keep[0] = true; keep[points.Count - 1] = true;
            var stack = new Stack<int2>();
            stack.Push(new int2(0, points.Count - 1));
            while (stack.Count > 0)
            {
                var range = stack.Pop();
                int first = range.x, last = range.y;
                double maxD = 0; int index = -1;
                var a = points[first]; var b = points[last];
                var ab = b - a;
                double len2 = math.lengthsq(ab);
                for (int i = first + 1; i < last; i++)
                {
                    var p = points[i];
                    double d;
                    if (len2 == 0) d = math.lengthsq(p - a);
                    else
                    {
                        double t = math.clamp(math.dot(p - a, ab) / len2, 0, 1);
                        d = math.lengthsq(p - (a + ab * t));
                    }
                    if (d > maxD) { maxD = d; index = i; }
                }
                if (maxD > sq && index > 0)
                {
                    keep[index] = true;
                    stack.Push(new int2(first, index));
                    stack.Push(new int2(index, last));
                }
            }
            var outp = new List<double2>();
            for (int i = 0; i < points.Count; i++) if (keep[i]) outp.Add(points[i]);
            return outp;
        }
    }
}
