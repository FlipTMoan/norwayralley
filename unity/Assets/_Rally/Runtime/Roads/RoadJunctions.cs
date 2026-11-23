using System.Collections.Generic;
using Rally.Core;
using Unity.Mathematics;

namespace Rally.Roads
{
    /// <summary>How <see cref="RibbonMesh"/> joins the arms of a junction (plan_20261122_smooth_crossings §3.2).</summary>
    public enum JunctionKind : byte
    {
        /// <summary>A through pair (the main road) stays unbroken; every other arm ends on its carriageway edge.</summary>
        Priority,
        /// <summary>Drawn as before the junction table (<see cref="RoadJunction.Reason"/> says why): mouths found from <see cref="RoadSample.Covered"/>.</summary>
        Fallback,
    }

    /// <summary>One way leaving a junction node: a way through the node gives two arms, a way ending there one.</summary>
    public struct JunctionArm
    {
        /// <summary>Index (in the tile's lines) of the run that carries the arm next to the node.</summary>
        public int Line;
        public long Way;
        /// <summary>The arm leaves the node toward increasing S (else decreasing).</summary>
        public bool Forward;
        /// <summary>S of the node on this way, and the node on this way's line.</summary>
        public float S;
        public double2 At;
        /// <summary>Unit direction from the node to the way's line 3 m out (robust to the rounding of the plan line at the node).</summary>
        public double2 Dir;
        public float Half, Y;
        public byte Class;
        /// <summary>One of the through pair of a <see cref="JunctionKind.Priority"/> node.</summary>
        public bool Through;
    }

    /// <summary>A node of the tile's runs where three or more arms meet (a junction), with how the ribbon joins them.</summary>
    public sealed class RoadJunction
    {
        public long Key;
        public double2 P;
        public JunctionKind Kind;
        /// <summary>Why a node is <see cref="JunctionKind.Fallback"/> (null for Priority).</summary>
        public string Reason;
        public List<JunctionArm> Arms = new List<JunctionArm>(4);
    }

    /// <summary>
    /// The junction table of a tile (P1 of plan_20261122_smooth_crossings): every OSM node the tile's runs share
    /// (<see cref="RoadPolyline.Nodes"/>) with three or more arms, its arms and its kind. Built from the runs alone, from data within
    /// <see cref="ArmReach"/> of the node, in a fixed order (node key, way id), so the tiles on either side of a border build the same
    /// junction for every node either of them draws near. Mouths used to be found from <see cref="RoadSample.Covered"/> and the
    /// grading order: a side road graded before its main road, or off its height, or a main road split at the node, ran on into
    /// the main road (two surfaces, z-fight: 5 758 of 8 146 mouths in Lillehammer, 2026-11-23).
    /// </summary>
    public static class RoadJunctions
    {
        /// <summary>Nodes this far outside the tile's own bounds still get a junction: the cuts of a node just across a border reach in.</summary>
        public const double Reach = 25;
        /// <summary>Metres of each arm the table looks at (a tile's runs reach <see cref="RoadGraph.TilePad"/> beyond it: 60 ≥ 25 + 30).</summary>
        public const double ArmReach = 30;
        /// <summary>A through pair turns less than 60° (the rule of <see cref="RibbonMesh"/>'s mitres).</summary>
        public const double ThroughCos = 0.5;
        /// <summary>A side arm more than this off the main road's height at the node is left to the old mouths (CoverStep).</summary>
        public const float MaxStep = 0.3f;
        public const int MaxArms = 6;

        /// <summary>The node's position from its key (<see cref="RoadGraph.NodeKey"/>: centimetres of E in the high 32 bits, of N in the low).</summary>
        public static double2 KeyPos(long key) => new double2((key >> 32) / 100.0, (uint)(key & 0xffffffffL) / 100.0);

        /// <summary>The rank grading uses (RoadGraph: major class first, then the longer way, then the lower id).</summary>
        public static bool Outranks(RoadPolyline a, RoadPolyline b)
        {
            byte ca = RoadGraph.ClassOf(a.Kind), cb = RoadGraph.ClassOf(b.Kind);
            return ca != cb ? ca < cb : a.WayLength != b.WayLength ? a.WayLength > b.WayLength : a.Id < b.Id;
        }

        static int Cmp(RoadPolyline a, RoadPolyline b) => a.Id == b.Id ? 0 : Outranks(a, b) ? 1 : -1;

        public static List<RoadJunction> Find(List<RoadPolyline> lines, Bounds25833? own)
        {
            var byKey = new Dictionary<long, List<(int line, float s)>>();
            var byWay = new Dictionary<long, List<int>>();
            for (int li = 0; li < lines.Count; li++)
            {
                var l = lines[li];
                if (l.Samples == null || l.Samples.Count < 2) continue;
                if (!byWay.TryGetValue(l.Id, out var wl)) byWay[l.Id] = wl = new List<int>(2);
                wl.Add(li);
                if (l.Nodes == null) continue;
                foreach (var (k, s) in l.Nodes)
                {
                    if (!byKey.TryGetValue(k, out var e)) byKey[k] = e = new List<(int, float)>(3);
                    e.Add((li, s));
                }
            }
            var keys = new List<long>(byKey.Keys);
            keys.Sort();
            var result = new List<RoadJunction>();
            foreach (var key in keys)
            {
                var entries = byKey[key];
                if (entries.Count < 2) continue;
                var p = KeyPos(key);
                if (own.HasValue)
                {
                    var b = own.Value;
                    if (p.x < b.MinE - Reach || p.x >= b.MaxE + Reach || p.y < b.MinN - Reach || p.y >= b.MaxN + Reach) continue;
                }
                entries.Sort((x, y) => { var lx = lines[x.line]; var ly = lines[y.line]; return lx.Id != ly.Id ? lx.Id.CompareTo(ly.Id) : x.s != y.s ? x.s.CompareTo(y.s) : lx.Samples[0].S.CompareTo(ly.Samples[0].S); });
                var j = new RoadJunction { Key = key, P = p };
                int ways = 0; long lastWay = long.MinValue; float lastS = float.NaN;
                foreach (var (li, s) in entries)
                {
                    var l = lines[li];
                    if (l.Id == lastWay && math.abs(s - lastS) < 0.5f) continue;   // the same node of one way in two runs (a material change there)
                    if (l.Id != lastWay) ways++;
                    lastWay = l.Id; lastS = s;
                    for (int dir = -1; dir <= 1; dir += 2)
                    {
                        if (dir < 0 ? s < 0.05f : s > l.WayLength - 0.05f) continue;   // the way ends here
                        int run = -1;
                        foreach (var (lj, sj) in entries)
                        {
                            var o = lines[lj];
                            if (o.Id != l.Id || math.abs(sj - s) > 0.01f) continue;
                            var os = o.Samples;
                            if (dir > 0 ? os[os.Count - 1].S > s + 0.01f : os[0].S < s - 0.01f) { run = lj; break; }
                        }
                        if (run < 0) { j.Reason ??= "tile edge"; continue; }
                        var r = lines[run]; var rs = r.Samples;
                        var at = PointAt(rs, s);
                        var arm = new JunctionArm
                        {
                            Line = run, Way = l.Id, Forward = dir > 0, S = s, At = at, Dir = math.normalizesafe(PointAt(rs, s + dir * 3) - at, new double2(1, 0)),
                            Half = l.Lanes.Half, Y = YAt(rs, s), Class = RoadGraph.ClassOf(l.Kind),
                        };
                        // Bridges, tunnels and galleries have their own ends; a way whose runs stop short of ArmReach (not at the way's end)
                        // is cut by the tile's pad: the other tile may see more of it.
                        float far = s + dir * (float)ArmReach, lo = float.MaxValue, hi = float.MinValue;
                        bool structure = false;
                        float from = dir > 0 ? s - 0.01f : far, to = dir > 0 ? far : s + 0.01f;
                        foreach (var wi in byWay[l.Id])
                        {
                            var ws = lines[wi].Samples;   // S ascending
                            lo = math.min(lo, ws[0].S); hi = math.max(hi, ws[ws.Count - 1].S);
                            foreach (var q in ws)
                            {
                                if (q.S > to) break;
                                if (q.S >= from && (q.Bridge || q.Tunnel || q.Gallery || q.Portal)) { structure = true; break; }
                            }
                        }
                        if (dir > 0 ? hi < math.min(far, l.WayLength - 0.05f) : lo > math.max(far, 0.05f)) j.Reason ??= "tile edge";
                        if (structure) j.Reason ??= "bridge or tunnel";
                        j.Arms.Add(arm);
                    }
                }
                if (ways < 2 || j.Arms.Count < 3) continue;   // two ways end to end: a joint (RibbonMesh mitres it)
                result.Add(j);
                Classify(j, lines);
            }
            return result;
        }

        static void Classify(RoadJunction j, List<RoadPolyline> lines)
        {
            if (j.Reason != null) { j.Kind = JunctionKind.Fallback; return; }
            var a = j.Arms;
            if (a.Count > MaxArms) { Fall(j, "more than 6 arms"); return; }
            // The through pair: of the pairs of one width turning less than 60°, the one whose better way ranks highest, then its
            // other way, then the straighter (two arms of one way through the node rank alike).
            // A pair is drawn unbroken: one way through the node (its two arms), or two ways that both end there (mitred).
            bool Single(JunctionArm m) { foreach (var o in a) if (o.Way == m.Way && o.S == m.S && o.Forward != m.Forward) return false; return true; }
            int pa = -1, pb = -1; double bestStraight = 0;
            for (int x = 0; x < a.Count; x++)
                for (int y = x + 1; y < a.Count; y++)
                {
                    if (a[x].Half != a[y].Half) continue;
                    if (!(a[x].Way == a[y].Way && a[x].S == a[y].S || Single(a[x]) && Single(a[y]))) continue;
                    double straight = -math.dot(a[x].Dir, a[y].Dir);
                    if (straight <= ThroughCos) continue;
                    if (pa >= 0)
                    {
                        RoadPolyline bx = Better(lines, a[x], a[y], out var wx), by = Better(lines, a[pa], a[pb], out var wy);
                        int c = Cmp(bx, by);
                        if (c == 0) c = Cmp(wx, wy);
                        if (c < 0 || c == 0 && straight <= bestStraight) continue;
                    }
                    pa = x; pb = y; bestStraight = straight;
                }
            if (pa < 0) { Fall(j, "no through pair"); return; }
            byte worse = a[pa].Class > a[pb].Class ? a[pa].Class : a[pb].Class;
            float y0 = (a[pa].Y + a[pb].Y) * 0.5f;
            for (int k = 0; k < a.Count; k++)
            {
                if (k == pa || k == pb) continue;
                if (a[k].Class < worse) { Fall(j, "a side arm outranks the through road"); return; }
                if (math.abs(a[k].Y - y0) > MaxStep) { Fall(j, "height step"); return; }
            }
            var t = a[pa]; t.Through = true; a[pa] = t;
            t = a[pb]; t.Through = true; a[pb] = t;
            j.Kind = JunctionKind.Priority;
        }

        static RoadPolyline Better(List<RoadPolyline> lines, JunctionArm x, JunctionArm y, out RoadPolyline worse)
        {
            RoadPolyline lx = lines[x.Line], ly = lines[y.Line];
            if (Cmp(lx, ly) >= 0) { worse = ly; return lx; }
            worse = lx; return ly;
        }

        /// <summary>Mark the node Fallback (keeping the first reason).</summary>
        public static void Fall(RoadJunction j, string reason)
        {
            j.Kind = JunctionKind.Fallback;
            j.Reason ??= reason;
            for (int k = 0; k < j.Arms.Count; k++) { var t = j.Arms[k]; t.Through = false; j.Arms[k] = t; }
        }

        /// <summary>The run's centre line at S (clamped to the run).</summary>
        public static double2 PointAt(List<RoadSample> s, float at)
        {
            if (at <= s[0].S) return s[0].P;
            for (int i = 0; i + 1 < s.Count; i++)
                if (at <= s[i + 1].S)
                {
                    float d = s[i + 1].S - s[i].S;
                    return d > 1e-6f ? math.lerp(s[i].P, s[i + 1].P, (at - s[i].S) / d) : s[i + 1].P;
                }
            return s[s.Count - 1].P;
        }

        static float YAt(List<RoadSample> s, float at)
        {
            if (at <= s[0].S) return s[0].RoadY;
            for (int i = 0; i + 1 < s.Count; i++)
                if (at <= s[i + 1].S)
                {
                    float d = s[i + 1].S - s[i].S;
                    return d > 1e-6f ? math.lerp(s[i].RoadY, s[i + 1].RoadY, (at - s[i].S) / d) : s[i + 1].RoadY;
                }
            return s[s.Count - 1].RoadY;
        }
    }
}
