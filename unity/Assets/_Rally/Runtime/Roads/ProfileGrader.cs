using System;
using System.Collections.Generic;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Roads
{
    /// <summary>
    /// Road grading (port of corridor.js smoothRoadHeights / meanSpacing and roads.js smoothWay /
    /// resample / laneSpec / isPaved). A real road is graded: it does not copy every bump of the ground
    /// under it, so the raw ground heights along the line get three passes of a ±60 m running mean (≈ a
    /// Gaussian of σ 60 m) and the embankments and cuttings of the profile (<see cref="RoadProfile"/>)
    /// make up the difference. The constants (SHOULDER, FEATHER, ROAD_LIFT, LANES) live in
    /// <see cref="Rally.Core.RoadConstants"/> (the lane specs in <see cref="RoadProfile"/>) because the World layer and the car evaluate the same profile.
    /// </summary>
    public static class ProfileGrader
    {
        public const double GradeWindow = 60;   // corridor.js smoothRoadHeights window
        public const int GradePasses = 3;
        public const double SampleStep = 5;     // roads.js resample(world, 5)

        static readonly HashSet<string> RoadKinds = new HashSet<string> { "motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street", "service", "track" };
        static readonly HashSet<string> TwoLaneKinds = new HashSet<string> { "motorway", "trunk", "primary", "secondary", "tertiary" };
        static readonly HashSet<string> Unpaved = new HashSet<string> { "gravel", "unpaved", "dirt", "ground", "compacted", "fine_gravel", "earth", "grass", "sand", "mud", "pebblestone" };

        /// <summary>
        /// roads.js laneSpec: two-lane or single-lane from OSM `lanes` when tagged, else by class (the
        /// numbered network is two-lane, everything smaller single-lane). Null for a kind the game ignores.
        /// </summary>
        public static LaneSpec? LaneSpecFor(Dictionary<string, string> tags)
        {
            if (tags == null || !tags.TryGetValue("highway", out var kind) || !RoadKinds.Contains(kind)) return null;
            int lanes = tags.TryGetValue("lanes", out var ls) && int.TryParse(ls, out var l) ? l : 0;
            bool two = lanes >= 2 || (lanes < 1 && TwoLaneKinds.Contains(kind));
            return two ? RoadProfile.Two : RoadProfile.One;
        }

        /// <summary>roads.js isPaved: the `surface` tag decides; untagged tracks are gravel, everything else tarmac.</summary>
        public static bool IsPaved(Dictionary<string, string> tags)
        {
            if (tags != null && tags.TryGetValue("surface", out var s) && !string.IsNullOrEmpty(s)) return !Unpaved.Contains(s);
            return !(tags != null && tags.TryGetValue("highway", out var k) && k == "track");
        }

        /// <summary>
        /// corridor.js smoothRoadHeights: `passes` passes of a ±window running mean over the raw heights
        /// (prefix sums, edges shrink the window). Returns one road height per sample.
        /// With <paramref name="pinEnds"/> the window does not shrink at the ends: the heights are continued past each end by
        /// an odd reflection about the end sample, which leaves both ends exactly at their raw ground and keeps the slope there.
        /// The shrinking window pulled an end towards the way's own inside by up to the slope × the window: on a steep hillside
        /// two ways that meet end to end ended 10 m above and below the ground at their shared node, a 20 m step (2026-11-20).
        /// </summary>
        public static double[] SmoothRoadHeights(IReadOnlyList<double> raw, double spacing, double window = GradeWindow, int passes = GradePasses, bool pinEnds = false)
        {
            int n = raw.Count;
            int k = math.max(1, (int)math.round(window / math.max(0.5, spacing)));
            var cur = new double[n];
            for (int i = 0; i < n; i++) cur[i] = raw[i];
            if (pinEnds && n >= 2)
            {
                var ext = new double[n + 2 * k + 1];
                for (int p = 0; p < passes; p++)
                {
                    ext[0] = 0;
                    for (int j = -k; j < n + k; j++) ext[j + k + 1] = ext[j + k] + Reflected(cur, j);
                    var next = new double[n];
                    for (int i = 0; i < n; i++) next[i] = (ext[i + 2 * k + 1] - ext[i]) / (2 * k + 1);
                    cur = next;
                }
                return cur;
            }
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
            return cur;
        }

        /// <summary>Sample <paramref name="j"/> of <paramref name="v"/> continued past both ends by odd reflection (v(−j) = 2 v(0) − v(j), likewise at the far end).</summary>
        static double Reflected(double[] v, int j)
        {
            int n = v.Length;
            double add = 0, sign = 1;
            for (;;)
            {
                if (j < 0) { add += sign * 2 * v[0]; sign = -sign; j = -j; }
                else if (j > n - 1) { add += sign * 2 * v[n - 1]; sign = -sign; j = 2 * (n - 1) - j; }
                else return add + sign * v[j];
            }
        }

        /// <summary>corridor.js meanSpacing.</summary>
        public static double MeanSpacing(IReadOnlyList<double2> pts)
        {
            if (pts.Count < 2) return 1;
            double s = 0;
            for (int i = 1; i < pts.Count; i++) s += math.distance(pts[i], pts[i - 1]);
            return s / (pts.Count - 1);
        }

        /// <summary>
        /// roads.js smoothWay: Chaikin corner cutting (two rounds) so bends are curves, with junction
        /// vertices (<paramref name="pinned"/>, shared with other ways) and both ends kept exactly in place
        /// so roads still meet where OSM says they meet.
        /// </summary>
        public static List<double2> Chaikin(IReadOnlyList<double2> points, HashSet<int> pinned, int iterations = 2)
        {
            var outPts = new List<double2>(points.Count * 4);
            if (points.Count < 3) { outPts.AddRange(points); return outPts; }
            var piece = new List<double2> { points[0] };
            void Flush(double2 last)
            {
                var p = new List<double2>(piece);
                for (int k = 0; k < iterations && p.Count >= 3; k++)
                {
                    var q = new List<double2>(p.Count * 2) { p[0] };
                    for (int i = 0; i < p.Count - 1; i++)
                    {
                        q.Add(p[i] * 0.75 + p[i + 1] * 0.25);
                        q.Add(p[i] * 0.25 + p[i + 1] * 0.75);
                    }
                    q.Add(p[p.Count - 1]);
                    p = q;
                }
                if (outPts.Count > 0) p.RemoveAt(0);   // the joint is already there
                outPts.AddRange(p);
                piece = new List<double2> { last };
            }
            for (int i = 1; i < points.Count; i++)
            {
                piece.Add(points[i]);
                if (i < points.Count - 1 && pinned != null && pinned.Contains(i)) Flush(points[i]);
            }
            Flush(points[points.Count - 1]);
            return outPts;
        }

        /// <summary>
        /// The plan line of a network road: Chaikin over the whole way (no corner is kept, so there is no heading jump at
        /// a junction node either), then each pinned vertex pulled back onto its OSM position with the offset fading out
        /// over <paramref name="fadeM"/> metres on both sides, so roads still meet exactly where OSM says they meet.
        /// The ends stay where they are (Chaikin keeps them).
        /// </summary>
        public static List<double2> SmoothThrough(IReadOnlyList<double2> points, HashSet<int> pinned, int rounds, double fadeM = 40)
        {
            var p = Chaikin(points, null, rounds);
            if (pinned == null || pinned.Count == 0 || p.Count < 3) return p;
            var along = new double[p.Count];
            for (int i = 1; i < p.Count; i++) along[i] = along[i - 1] + math.distance(p[i], p[i - 1]);
            int from = 0;
            for (int k = 1; k < points.Count - 1; k++)
            {
                if (!pinned.Contains(k)) continue;
                int best = from; double bestD = double.PositiveInfinity;
                for (int i = from; i < p.Count; i++) { double d = math.distancesq(p[i], points[k]); if (d < bestD) { bestD = d; best = i; } }
                var offset = points[k] - p[best];
                for (int i = 0; i < p.Count; i++)
                {
                    double w = 1 - math.abs(along[i] - along[best]) / fadeM;
                    if (w > 0 && i > 0 && i < p.Count - 1) p[i] += offset * w;
                }
                p[best] = points[k];
                from = best;
            }
            return p;
        }

        /// <summary>Every `step` metres of arc length (the last point kept): even spacing however dense the input is.</summary>
        public static List<double2> ResampleEven(IReadOnlyList<double2> points, double step)
        {
            var o = new List<double2> { points[0] };
            double carry = 0;   // metres walked since the last emitted point
            for (int i = 1; i < points.Count; i++)
            {
                double2 a = points[i - 1], b = points[i];
                double len = math.distance(a, b), at = step - carry;
                while (at <= len) { o.Add(a + (b - a) * (at / len)); at += step; }
                carry = len - (at - step);
            }
            if (carry > step * 0.25) o.Add(points[points.Count - 1]);
            else o[o.Count - 1] = points[points.Count - 1];
            return o;
        }

        /// <summary>roads.js resample: every `step` metres, keeping the original vertices.</summary>
        public static List<double2> Resample(IReadOnlyList<double2> points, double step)
        {
            var o = new List<double2> { points[0] };
            for (int i = 1; i < points.Count; i++)
            {
                double2 a = points[i - 1], b = points[i];
                int n = math.max(1, (int)math.ceil(math.distance(a, b) / step));
                for (int k = 1; k <= n; k++) o.Add(a + (b - a) * ((double)k / n));
            }
            return o;
        }
    }
}
