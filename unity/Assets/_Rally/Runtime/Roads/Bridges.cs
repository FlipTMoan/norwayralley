using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Roads
{
    /// <summary>A bridge span of a graded way: sample indices of its two abutments (both on the bank).</summary>
    public readonly struct BridgeSpan
    {
        public readonly int I0, I1;
        public BridgeSpan(int i0, int i1) { I0 = i0; I1 = i1; }
    }

    /// <summary>
    /// Bridges where roads cross water (port of legacy-js/src/bridges.js). A road sample is on a bridge when its OSM way
    /// is tagged <c>bridge=*</c> (not <c>no</c> / <c>culvert</c>, not a tunnel), or, for untagged data, when the road
    /// crosses water (OSM lake / river or the sea) for at least <see cref="MinSpan"/> metres with water on both sides and
    /// the DTM at water level (a causeway stands on higher ground and stays a road). The water core is widened by one
    /// sample at each end so a span runs from bank to bank (the abutments).
    /// Over a span the road is graded as if the gap were filled between the banks (<see cref="BridgeRaw"/>), then the deck
    /// gets a gentle arch and, where it would pass too close to the water, a lift with ramps either side
    /// (<see cref="ApplyProfile"/>). The terrain under a span is never carved (RoadGraph.CollectCarveSegments), the deck,
    /// rails and piers are drawn by <see cref="BridgeMesh"/>, and the car rides on the deck (TileWorld.HeightAt).
    /// </summary>
    public static class Bridges
    {
        public const double MinSpan = 6;            // metres of water before an untagged crossing becomes a bridge
        public const float WaterClearance = 2.5f;   // deck above the water (DTM, or the sea plane) under it
        public const float DryClearance = 0.8f;     // deck above dry ground under it
        public const double PierSpacing = 30;

        /// <summary>True when OSM tags make a way a bridge (<c>bridge=yes|viaduct|…</c>, not <c>no</c> / <c>culvert</c>, not a tunnel).</summary>
        public static bool IsBridgeTag(Dictionary<string, string> tags)
        {
            if (tags == null || !tags.TryGetValue("bridge", out var b) || string.IsNullOrEmpty(b) || b == "no" || b == "culvert") return false;
            return !tags.TryGetValue("tunnel", out var t) || t == "no";
        }

        /// <summary>A ford is a road through the water on purpose: never a bridge by the water rule.</summary>
        public static bool IsFord(Dictionary<string, string> tags) => tags != null && tags.TryGetValue("ford", out var f) && f != "no";

        static double Smoothstep(double t) { t = math.saturate(t); return t * t * (3 - 2 * t); }

        /// <summary>
        /// Samples where the road crosses water. The line is walked in 1 m steps; a step is wet when the centre and both
        /// probes <paramref name="lateral"/> metres to the sides are wet and the ground at the centre is no higher than the
        /// lower side + 1.5 m (a causeway is land). Wet stretches shorter than <see cref="MinSpan"/> (culverts, ditches,
        /// streams) stay road. <paramref name="wetAt"/> gets the centre test of every sample (for the deck clearance).
        /// </summary>
        public static bool[] WetCore(IReadOnlyList<double2> pts, double[] s, Func<double2, bool> wet, double lateral, Func<double2, float> ground, bool[] wetAt)
        {
            int n = pts.Count;
            var core = new bool[n];
            if (n < 2 || wet == null) return core;
            bool any = false;
            for (int i = 0; i < n; i++) { wetAt[i] = wet(pts[i]); any |= wetAt[i]; }
            if (!any) return core;   // the common case: no water near the road at all
            var intervals = new List<double2>();
            bool open = false; double a0 = 0, b0 = 0;
            for (int k = 0; k + 1 < n; k++)
            {
                bool near = wetAt[k] || wetAt[k + 1] || (k > 0 && wetAt[k - 1]) || (k + 2 < n && wetAt[k + 2]);
                if (!near)
                {
                    if (open) { intervals.Add(new double2(a0, b0)); open = false; }
                    continue;
                }
                double2 a = pts[k], b = pts[k + 1];
                double len = math.distance(a, b);
                if (len < 1e-6) continue;
                double2 t = (b - a) / len, nrm = new double2(-t.y, t.x);
                for (double d = 0; d < len; d += 1)
                {
                    double2 p = a + t * d, l = p + nrm * lateral, r = p - nrm * lateral;
                    bool w = wet(p) && wet(l) && wet(r);
                    if (w && ground != null) w = ground(p) <= math.min(ground(l), ground(r)) + 1.5f;
                    if (!w) continue;
                    double at = s[k] + d;
                    if (open && at - b0 <= 4) b0 = at;
                    else { if (open) intervals.Add(new double2(a0, b0)); open = true; a0 = b0 = at; }
                }
            }
            if (open) intervals.Add(new double2(a0, b0));
            foreach (var iv in intervals)
            {
                if (iv.y - iv.x + 1 < MinSpan) continue;
                for (int i = 0; i < n; i++) if (s[i] >= iv.x - 1 && s[i] <= iv.y + 1) core[i] = true;
            }
            return core;
        }

        /// <summary>
        /// A per-sample core (tag or water) into bridge spans: each run of core samples widened by one sample at both ends
        /// (the abutments), runs one sample apart merged. Fills <paramref name="bridge"/> and <paramref name="pier"/> (every
        /// ~30 m on spans over 24 m, away from the ends) and returns the spans.
        /// </summary>
        public static List<BridgeSpan> MarkSpans(double[] s, bool[] core, bool[] bridge, bool[] pier)
        {
            int n = s.Length;
            Array.Clear(bridge, 0, n); Array.Clear(pier, 0, n);
            for (int i = 0; i < n; i++)
            {
                if (!core[i]) continue;
                for (int k = math.max(0, i - 1); k <= math.min(n - 1, i + 1); k++) bridge[k] = true;
            }
            for (int i = 1; i + 1 < n; i++) if (!bridge[i] && bridge[i - 1] && bridge[i + 1]) bridge[i] = true;
            var spans = new List<BridgeSpan>();
            for (int i = 0; i < n;)
            {
                if (!bridge[i]) { i++; continue; }
                int j = i;
                while (j + 1 < n && bridge[j + 1]) j++;
                if (j > i) spans.Add(new BridgeSpan(i, j)); else bridge[i] = false;
                i = j + 1;
            }
            foreach (var sp in spans)
            {
                double s0 = s[sp.I0], L = s[sp.I1] - s0;
                if (L <= 24) continue;
                int count = math.max(1, (int)math.floor(L / PierSpacing));
                for (int k = 1; k <= count; k++)
                {
                    double target = s0 + L * k / (count + 1);
                    int best = sp.I0; double bestD = double.PositiveInfinity;
                    for (int i = sp.I0 + 1; i < sp.I1; i++) { double d = math.abs(s[i] - target); if (d < bestD) { bestD = d; best = i; } }
                    if (best > sp.I0 && best < sp.I1) pier[best] = true;
                }
            }
            return spans;
        }

        /// <summary>The raw ground along the road with every span replaced by a straight line between its two ends, so the grade runs bank to bank instead of dipping into the valley.</summary>
        public static void BridgeRaw(double[] raw, double[] s, List<BridgeSpan> spans)
        {
            foreach (var sp in spans)
            {
                double s0 = s[sp.I0], L = math.max(1e-6, s[sp.I1] - s0), y0 = raw[sp.I0], y1 = raw[sp.I1];
                for (int i = sp.I0 + 1; i < sp.I1; i++) raw[i] = math.lerp(y0, y1, (s[i] - s0) / L);
            }
        }

        /// <summary>
        /// Shape the graded <paramref name="roadY"/> over each span: a cubic between the abutment heights that leaves each one
        /// at the grade of the road beyond it, plus a gentle arch (2 % of the span, at most 1 m, starting level), lifted where
        /// needed so the deck clears the water (<see cref="WaterClearance"/> over the higher of the ground and the sea plane) or
        /// dry ground (<see cref="DryClearance"/>) under every sample. The lift ramps out over 15–90 m (≈ 3 %) either side and
        /// tapers to nothing at the line's own ends, so a bridge that is its own OSM way still meets the roads at its ends.
        /// </summary>
        public static void ApplyProfile(IReadOnlyList<double2> pts, double[] s, double[] roadY, List<BridgeSpan> spans, bool[] wetAt, Func<double2, float> ground)
        {
            int n = s.Length;
            if (n < 2) return;
            double total = s[n - 1] - s[0];
            double EndWeight(int i, double ramp) => Smoothstep(math.min(s[i] - s[0], total - (s[i] - s[0])) / ramp);
            foreach (var sp in spans)
            {
                int i0 = sp.I0, i1 = sp.I1;
                double s0 = s[i0], L = math.max(1e-6, s[i1] - s0), y0 = roadY[i0], y1 = roadY[i1];
                double chord = (y1 - y0) / L;
                double m0 = i0 > 0 ? (y0 - roadY[i0 - 1]) / math.max(1e-6, s[i0] - s[i0 - 1]) : chord;
                double m1 = i1 + 1 < n ? (roadY[i1 + 1] - y1) / math.max(1e-6, s[i1 + 1] - s[i1]) : chord;
                double arch = math.min(1, 0.02 * L), need = 0;
                for (int i = i0; i <= i1; i++)
                {
                    double t = (s[i] - s0) / L, t2 = t * t, t3 = t2 * t;
                    double hermite = (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * L * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * L * m1;
                    roadY[i] = hermite + arch * 16 * t2 * (1 - t) * (1 - t);
                    if (i == i0 || i == i1) continue;   // the abutments stand on the bank
                    double g = ground(pts[i]);
                    double req = wetAt[i] ? math.max(g, Water.SeaLevel) + WaterClearance : g + DryClearance;
                    need = math.max(need, req - roadY[i]);
                }
                if (need <= 1e-3) continue;
                double ramp = math.clamp(need * 30, 15, 90), endRamp = math.min(ramp, math.max(15, total / 2));
                double s1 = s[i1];
                for (int i = 0; i < n; i++)
                {
                    double off = s[i] < s0 ? s0 - s[i] : s[i] > s1 ? s[i] - s1 : 0;
                    if (off >= ramp) continue;
                    roadY[i] += need * (off > 0 ? Smoothstep(1 - off / ramp) : 1) * EndWeight(i, endRamp);
                }
            }
        }
    }

    /// <summary>
    /// "Is there water here?" for the bridge detection (bridges.js waterProbe): one tile's OSM lakes and rivers (culverts
    /// left out), the sea (natural ground at the DTM's sea value, only where a tile is loaded: an unloaded tile also reads
    /// 0) and, through <paramref name="more"/>, the water other loaded tiles already built.
    /// </summary>
    public sealed class WaterProbe
    {
        const double Cell = 32;
        readonly List<(List<double2> ring, double2 min, double2 max)> lakes = new List<(List<double2>, double2, double2)>();
        readonly Dictionary<long, List<(double2 a, double2 b, double half)>> buckets = new Dictionary<long, List<(double2, double2, double)>>();
        readonly Func<Utm33, float> ground;
        readonly Func<Utm33, bool> loaded, more;

        static long Key(int i, int j) => ((long)i << 32) ^ (uint)j;

        public WaterProbe(Features features, Func<Utm33, float> ground, Func<Utm33, bool> loaded = null, Func<Utm33, bool> more = null)
        {
            this.ground = ground; this.loaded = loaded; this.more = more;
            if (features == null) return;
            foreach (var a in features.Areas)
            {
                if (!a.IsWater || a.Rings == null || a.Rings.Count == 0 || a.Rings[0].Count < 3) continue;
                var ring = new List<double2>(a.Rings[0].Count);
                double2 lo = new double2(double.MaxValue), hi = new double2(double.MinValue);
                foreach (var p in a.Rings[0]) { var q = new double2(p.E, p.N); ring.Add(q); lo = math.min(lo, q); hi = math.max(hi, q); }
                lakes.Add((ring, lo, hi));
            }
            foreach (var w in features.Waterways)
            {
                if (w.Culvert || w.Points == null || w.Points.Count < 2) continue;
                double half = Water.RiverWidth(w) / 2;
                for (int i = 0; i + 1 < w.Points.Count; i++)
                {
                    var a = new double2(w.Points[i].E, w.Points[i].N); var b = new double2(w.Points[i + 1].E, w.Points[i + 1].N);
                    int i0 = (int)math.floor((math.min(a.x, b.x) - half) / Cell), i1 = (int)math.floor((math.max(a.x, b.x) + half) / Cell);
                    int j0 = (int)math.floor((math.min(a.y, b.y) - half) / Cell), j1 = (int)math.floor((math.max(a.y, b.y) + half) / Cell);
                    for (int j = j0; j <= j1; j++)
                        for (int k = i0; k <= i1; k++)
                        {
                            if (!buckets.TryGetValue(Key(k, j), out var list)) buckets[Key(k, j)] = list = new List<(double2, double2, double)>();
                            list.Add((a, b, half));
                        }
                }
            }
        }

        public bool Wet(double2 q)
        {
            var p = new Utm33(q.x, q.y);
            if (loaded != null && !loaded(p)) return false;
            if (ground != null && ground(p) < 0.1f) return true;   // the sea (DTM sea cells are 0)
            foreach (var (ring, lo, hi) in lakes)
                if (q.x >= lo.x && q.x <= hi.x && q.y >= lo.y && q.y <= hi.y && PointInRing(q, ring)) return true;
            if (buckets.TryGetValue(Key((int)math.floor(q.x / Cell), (int)math.floor(q.y / Cell)), out var segs))
                foreach (var (a, b, half) in segs)
                {
                    double2 ab = b - a;
                    double l2 = math.lengthsq(ab);
                    double t = l2 > 0 ? math.saturate(math.dot(q - a, ab) / l2) : 0;
                    if (math.distancesq(q, a + ab * t) <= half * half) return true;
                }
            return more != null && more(p);
        }

        static bool PointInRing(double2 p, List<double2> ring)
        {
            bool inside = false;
            for (int i = 0, j = ring.Count - 1; i < ring.Count; j = i++)
            {
                double2 a = ring[i], b = ring[j];
                if ((a.y > p.y) != (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
            }
            return inside;
        }
    }
}
