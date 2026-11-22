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
    /// The join survey (part of <c>-previewContinuity</c>): how the drawn ribbons and their painted lines meet, measured on the
    /// shown ribbon meshes themselves (an own triangle index, so two ribbons of one mesh that overlap are both seen).
    /// <list type="bullet">
    /// <item><b>joint</b>: two ways meeting end to end at an OSM node (and <b>border</b>: a way crossing a coarse tile border,
    /// where two tile meshes meet). Across ±1.5 m along the road at five offsets: ribbon <b>gap</b> (no ribbon) and
    /// <b>overlap</b> (two ribbon surfaces within 0.15 m of height); the <b>edge lines</b>' side offset (from the u coordinate,
    /// as Rally/Road paints them, 0.3 m either side); the <b>centre dashes</b> (a dash or a gap straddling the node of the wrong
    /// length); the <b>height step</b>; a <b>line type change</b> (markings on one side only) that the map does not make.</item>
    /// <item><b>mouth</b>: a way ending on a road that outranks it (a T-junction or a crossing arm). Along the side road's
    /// centre and edges from the node out 20 m: <b>gap</b> past the main road's edge, <b>overlap</b> of two surfaces (z-fight),
    /// the side road's own surface (and lines) inside the main road's edge line, and whether the main road's edge line is
    /// painted across the mouth.</item>
    /// </list>
    /// Writes DIR/joins.txt, DIR/joins.csv and DIR/joins_spots.txt (a town junction, a T-junction on a main road, a joint in
    /// a bend, a tile border: the worst of each, shot as join_*); <c>-previewJoinSpots FILE</c> shoots those places instead.
    /// </summary>
    public static partial class PreviewShots
    {
        static string joinSpotsFile;

        sealed class RMesh { public double2[] P; public float[] Y; public Vector2[] Uv, Uv1, Uv2; public int TarmacIdx; public int[] Tri; }
        struct RHit { public float Y, U, V, Half, ML, MR; public bool Tarmac, Skirt; public int M, T; }
        const double JCell = 4;
        static List<RMesh> jMeshes;
        static Dictionary<long, List<(int m, int t)>> jGrid;
        static float dashShift;

        static long JKey(double2 p) => ((long)math.floor(p.x / JCell) << 32) ^ (uint)(long)math.floor(p.y / JCell);

        static void IndexRibbons(Dictionary<TileKey, GameObject> gos)
        {
            jMeshes = new List<RMesh>(); jGrid = new Dictionary<long, List<(int, int)>>();
            foreach (var kv in gos)
            {
                if (kv.Value == null) continue;   // hidden ones too: a ribbon waiting for its carve is drawn a moment later
                var mesh = kv.Value.GetComponent<MeshFilter>()?.sharedMesh;
                if (mesh == null) continue;
                var v = mesh.vertices;
                var rm = new RMesh { P = new double2[v.Length], Y = new float[v.Length], Tri = mesh.triangles };
                var uv = new List<Vector2>(); mesh.GetUVs(0, uv); rm.Uv = uv.ToArray();
                var uv1 = new List<Vector2>(); mesh.GetUVs(1, uv1); rm.Uv1 = uv1.ToArray();
                var uv2 = new List<Vector2>(); mesh.GetUVs(2, uv2); rm.Uv2 = uv2.Count == v.Length ? uv2.ToArray() : null;
                rm.TarmacIdx = (int)mesh.GetSubMesh(0).indexCount;
                for (int i = 0; i < v.Length; i++) { rm.P[i] = new double2(kv.Key.Origin.E + v[i].x, kv.Key.Origin.N + v[i].z); rm.Y[i] = v[i].y; }
                int mi = jMeshes.Count; jMeshes.Add(rm);
                for (int t = 0; t + 2 < rm.Tri.Length; t += 3)
                {
                    double2 a = rm.P[rm.Tri[t]], b = rm.P[rm.Tri[t + 1]], c = rm.P[rm.Tri[t + 2]];
                    double2 lo = math.min(a, math.min(b, c)), hi = math.max(a, math.max(b, c));
                    for (double x = math.floor(lo.x / JCell) * JCell; x <= hi.x; x += JCell)
                        for (double y = math.floor(lo.y / JCell) * JCell; y <= hi.y; y += JCell)
                        {
                            long k = JKey(new double2(x + 0.5, y + 0.5));
                            if (!jGrid.TryGetValue(k, out var l)) jGrid[k] = l = new List<(int, int)>(8);
                            l.Add((mi, t));
                        }
                }
            }
            // Rally/Road's centre dash: a 3 m dash every 12 m of the along coordinate, shifted by RibbonMesh.DashShift when the build has it.
            var f = typeof(RibbonMesh).GetField("DashShift", BindingFlags.Public | BindingFlags.Static);
            dashShift = f != null ? Convert.ToSingle(f.GetValue(null)) : 0f;
        }

        /// <summary>Every ribbon surface over the point (skirts flagged), with its attributes interpolated as the shader gets them.</summary>
        static List<RHit> HitsAt(double2 p, List<RHit> into)
        {
            into.Clear();
            if (!jGrid.TryGetValue(JKey(p), out var l)) return into;
            foreach (var (m, t) in l)
            {
                var rm = jMeshes[m];
                int i0 = rm.Tri[t], i1 = rm.Tri[t + 1], i2 = rm.Tri[t + 2];
                double2 a = rm.P[i0], b = rm.P[i1], c = rm.P[i2];
                double2 v0 = b - a, v1 = c - a, v2 = p - a;
                double den = v0.x * v1.y - v1.x * v0.y;
                if (math.abs(den) < 1e-9) continue;
                double w1 = (v2.x * v1.y - v1.x * v2.y) / den, w2 = (v0.x * v2.y - v2.x * v0.y) / den, w0 = 1 - w1 - w2;
                if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
                float f0 = (float)w0, f1 = (float)w1, f2 = (float)w2;
                var h = new RHit
                {
                    Y = rm.Y[i0] * f0 + rm.Y[i1] * f1 + rm.Y[i2] * f2,
                    U = rm.Uv[i0].x * f0 + rm.Uv[i1].x * f1 + rm.Uv[i2].x * f2,
                    V = rm.Uv[i0].y * f0 + rm.Uv[i1].y * f1 + rm.Uv[i2].y * f2,
                    Half = math.max(1f, rm.Uv1[i0].x * f0 + rm.Uv1[i1].x * f1 + rm.Uv1[i2].x * f2),
                    ML = rm.Uv2 != null ? rm.Uv2[i0].x * f0 + rm.Uv2[i1].x * f1 + rm.Uv2[i2].x * f2 : 99f,
                    MR = rm.Uv2 != null ? rm.Uv2[i0].y * f0 + rm.Uv2[i1].y * f1 + rm.Uv2[i2].y * f2 : 99f,
                    Tarmac = t < rm.TarmacIdx, M = m, T = t,
                };
                float s = RoadConstants.RoadShoulder / (2 * h.Half);
                h.Skirt = h.U < -s - 1e-3f || h.U > 1 + s + 1e-3f;
                // Rally/Road leaves out the shoulder and skirt in a junction mouth on that side: not drawn.
                if ((h.U < 0 || h.U > 1) && math.abs(h.U < 0.5f ? h.ML : h.MR) < MouthKeepAt(math.abs(Across(h)) - h.Half)) continue;
                // A point on an edge two triangles of one strip share is one surface, not two.
                bool same = false;
                foreach (var o in into) if (math.abs(o.Y - h.Y) < 1e-3f && math.abs(o.U - h.U) < 1e-3f && math.abs(o.V - h.V) < 1e-3f) { same = true; break; }
                if (!same) into.Add(h);
            }
            return into;
        }

        /// <summary>The top non-skirt surface within 1.5 m of <paramref name="y"/> (false when none).</summary>
        static bool Top(List<RHit> hits, float y, out RHit top)
        {
            top = default; bool any = false;
            foreach (var h in hits) if (!h.Skirt && math.abs(h.Y - y) < 1.5f && (!any || h.Y > top.Y)) { top = h; any = true; }
            return any;
        }

        /// <summary>Two non-skirt surfaces within 0.15 m of each other (coplanar ribbons: z-fight).</summary>
        static bool Overlap(List<RHit> hits, float y)
        {
            for (int i = 0; i < hits.Count; i++)
                for (int j = i + 1; j < hits.Count; j++)
                    if (!hits[i].Skirt && !hits[j].Skirt && math.abs(hits[i].Y - y) < 1.5f && math.abs(hits[i].Y - hits[j].Y) < 0.15f) return true;
            return false;
        }

        static bool Marked(RHit h) => h.Tarmac && h.Half > 3;
        /// <summary>RibbonMesh.MouthKeep when the build has it (the shoulder left out in a mouth narrows away from the edge), else 1.</summary>
        static float MouthKeepAt(float e)
        {
            var m = typeof(RibbonMesh).GetMethod("MouthKeep", BindingFlags.Public | BindingFlags.Static);
            return m != null ? (float)m.Invoke(null, new object[] { e }) : 1f;
        }
        static float Across(RHit h) => (h.U - 0.5f) * 2 * h.Half;
        /// <summary>The edge line is painted here (not broken for a mouth on that side).</summary>
        static bool EdgePainted(RHit h) => Marked(h) && math.abs(math.abs(Across(h)) - (h.Half - 0.35f)) < 0.08f && math.abs(h.U < 0.5f ? h.ML : h.MR) >= 1f;
        static bool Dash(RHit h) => math.frac((h.V * 4 + dashShift) / 12f) < 0.25f;

        sealed class Join
        {
            public string Kind; public long A, B; public double2 P, Dir; public float Y;
            public float Gap, Over, EdgeOff = -1, DashErr = -1, Step; public bool TypeChange, MapChange, Bend, Seam; public float Turn;
            // mouths
            public float MouthGap, MouthOver, SideInside; public bool EdgeAcross, MainMarked; public byte MainClass; public int Arms;
            public float Score; public string Why, GapWhy;
        }

        static string Tag(Rally.Geo.RoadWay w, string k) => w != null && w.Tags.TryGetValue(k, out var v) ? v : "";

        static void JoinReport(RoadGraph roads, Dictionary<long, Rally.Geo.RoadWay> raw, Func<double2, bool> surveyed, Func<double2, bool> seam)
        {
            IndexRibbons((Dictionary<TileKey, GameObject>)typeof(GameController).GetField("ribbons", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game));
            var graded = (IDictionary)Field(roads, "graded");
            var nodeWays = (Dictionary<long, List<(long way, int sample)>>)Field(roads, "nodeWays");
            var hits = new List<RHit>();
            var list = new List<Join>();
            List<double2> Pts(long id) => (List<double2>)Field(graded[id], "Points");
            double[] Hs(long id) => (double[])Field(graded[id], "Heights");
            float Lift(long id) => RoadConstants.RoadLift + RoadConstants.SurfaceLift(0, raw.TryGetValue(id, out var w) ? (ProfileGrader.LaneSpecFor(w.Tags)?.Half ?? 2.25f) : 2.25f);
            float HalfOf(long id) => raw.TryGetValue(id, out var w) ? (ProfileGrader.LaneSpecFor(w.Tags)?.Half ?? 2.25f) : 2.25f;
            // A point and direction along a polyline at distance d from one end (from the start when fromStart).
            double2 At(List<double2> pts, bool fromStart, double d, out double2 dir)
            {
                int n = pts.Count; double acc = 0;
                for (int k = 0; k + 1 < n; k++)
                {
                    int i = fromStart ? k : n - 1 - k, j = fromStart ? k + 1 : n - 2 - k;
                    double L = math.distance(pts[i], pts[j]);
                    if (acc + L >= d || k + 2 == n) { dir = math.normalizesafe(pts[j] - pts[i]); return pts[i] + dir * math.min(L, d - acc); }
                    acc += L;
                }
                dir = new double2(0, 1); return pts[0];
            }

            // ---- End-to-end joints and tile borders: A comes in along dirA to P, B leaves along dirB.
            void Measure(Join j, double2 p, double2 dirA, double2 dirB, float halfA, float halfB, float y)
            {
                double2 nA = new double2(-dirA.y, dirA.x), nB = new double2(-dirB.y, dirB.x);
                float half = math.min(halfA, halfB), outer = half + RoadConstants.RoadShoulder;
                double2 Pt(double x, double off) => x < 0 ? p + dirA * x + nA * off : p + dirB * x + nB * off;
                // Ribbon gap and overlap: the longest run of misses / double surfaces at five offsets, ±1.5 m along.
                foreach (var off in new[] { -(outer - 0.15), -half, 0.0, half, outer - 0.15 })
                {
                    float gapRun = 0, overRun = 0, g = 0, o = 0;
                    for (double x = -1.5; x <= 1.5 + 1e-9; x += 0.05)
                    {
                        HitsAt(Pt(x, off), hits);
                        if (!Top(hits, y, out _)) { g += 0.05f; gapRun = math.max(gapRun, g); if (g > 0.1f && j.GapWhy == null) { var w = new StringBuilder(FormattableString.Invariant($"x {x:0.00} off {off:0.00} y {y:0.00}:")); foreach (var h in hits) w.Append(FormattableString.Invariant($" [y{h.Y:0.000} u{h.U:0.000} v{h.V:0.00} half{h.Half:0.00}{(h.Skirt ? " skirt" : "")}]")); j.GapWhy = w.ToString(); } } else g = 0;
                        if (Overlap(hits, y)) { o += 0.05f; overRun = math.max(overRun, o); if (j.Why == null) { var w = new StringBuilder(FormattableString.Invariant($"x {x:0.00} off {off:0.00}:")); foreach (var h in hits) w.Append(FormattableString.Invariant($" [m{h.M} t{h.T} y{h.Y:0.000} u{h.U:0.000} v{h.V:0.00} half{h.Half:0.00}{(h.Skirt ? " skirt" : "")}]")); j.Why = w.ToString(); } } else o = 0;
                    }
                    j.Gap = math.max(j.Gap, gapRun); j.Over = math.max(j.Over, overRun);
                }
                // Height step: centre surface 0.3 m either side against the slope 1 m further out on each side.
                float Yc(double x) { HitsAt(Pt(x, 0), hits); return Top(hits, y, out var t) ? t.Y : float.NaN; }
                float a1 = Yc(-1.3), a0 = Yc(-0.3), b0 = Yc(0.3), b1 = Yc(1.3);
                if (!float.IsNaN(a1 + a0 + b0 + b1)) j.Step = math.abs((b0 - a0) - 0.5f * ((a0 - a1) + (b1 - b0)) * 0.6f);
                // Edge lines: their side offset across the node (lateral position from u at two offsets, 0.3 m either side).
                bool EdgeLines(double x, double2 n, out float l, out float r, out bool marked)
                {
                    l = r = 0; marked = false;
                    HitsAt(Pt(x, -1), hits); if (!Top(hits, y, out var h0)) return false;
                    HitsAt(Pt(x, 1), hits); if (!Top(hits, y, out var h1)) return false;
                    float a0x = Across(h0), slope = (Across(h1) - a0x) / 2f;
                    if (math.abs(math.abs(slope) - 1) > 0.25f) return false;
                    marked = Marked(h0) && Marked(h1);
                    float e = h0.Half - 0.35f;
                    l = (-e - a0x) / slope - 1; r = (e - a0x) / slope - 1;   // offsets (from the centre) where across = ∓e
                    if (l > r) (l, r) = (r, l);
                    return true;
                }
                if (EdgeLines(-0.3, nA, out var la, out var ra, out var ma) && EdgeLines(0.3, nB, out var lb, out var rb, out var mb))
                {
                    if (ma != mb) j.TypeChange = true;
                    else if (ma) j.EdgeOff = math.max(math.abs(la - lb), math.abs(ra - rb));
                    if (ma && mb)
                    {
                        // Centre dashes: the dash or gap that straddles the node must be one dash (3 m) or one gap (9 m) long, give or
                        // take the stretch either way's own pattern has (its along / metres), 0.3 m.
                        var on = new List<bool>(); var scale = new List<float>();
                        for (double x = -14; x <= 14 + 1e-9; x += 0.05)
                        {
                            HitsAt(Pt(x, 0), hits);
                            if (!Top(hits, y, out var h)) { on.Add(false); scale.Add(1); continue; }
                            on.Add(Dash(h)); scale.Add(1);
                        }
                        // Stretch either side: along metres per metre.
                        float Sc(double x0, double x1) { HitsAt(Pt(x0, 0), hits); Top(hits, y, out var h0); HitsAt(Pt(x1, 0), hits); Top(hits, y, out var h1); return math.abs((h1.V - h0.V) * 4 / (float)(x1 - x0)); }
                        float sA = Sc(-3, -1), sB = Sc(1, 3);
                        int mid = on.Count / 2, s0 = mid, s1 = mid;
                        while (s0 > 0 && on[s0 - 1] == on[mid]) s0--;
                        while (s1 < on.Count - 1 && on[s1 + 1] == on[mid]) s1++;
                        if (s0 > 0 && s1 < on.Count - 1 && sA > 0.3f && sB > 0.3f)
                        {
                            float run = (s1 - s0 + 1) * 0.05f, unit = on[mid] ? 3f : 9f;
                            float lo = unit / math.max(sA, sB) - 0.3f, hi = unit / math.min(sA, sB) + 0.3f;
                            j.DashErr = run < lo ? lo - run : run > hi ? run - hi : 0f;
                        }
                        else if (s0 == 0 && s1 == on.Count - 1) j.DashErr = 28;   // no dash at all over 28 m
                    }
                }
            }

            foreach (var kv in nodeWays)
            {
                if (kv.Value.Count != 2) continue;
                var (wa, sa) = kv.Value[0]; var (wb, sb) = kv.Value[1];
                if (wa == wb || !graded.Contains(wa) || !graded.Contains(wb) || !raw.TryGetValue(wa, out var ra) || !raw.TryGetValue(wb, out var rb)) continue;
                var pa = Pts(wa); var pb = Pts(wb);
                bool aEnd = sa == 0 || sa == pa.Count - 1, bEnd = sb == 0 || sb == pb.Count - 1;
                if (!aEnd || !bEnd) continue;
                var p = sa == 0 ? pa[0] : pa[pa.Count - 1];
                if (!surveyed(p)) continue;
                // A comes in: its far side first.
                At(pa, sa == 0, 2, out var outA); var dirA = -outA;
                At(pb, sb == 0, 2, out var dirB);
                float y = (float)Hs(wa)[sa] + Lift(wa);
                var j = new Join { Kind = "joint", A = wa, B = wb, P = p, Dir = dirA, Y = y, Seam = seam(p) };
                j.Turn = math.degrees((float)math.acos(math.clamp(math.dot(dirA, dirB), -1, 1)));
                j.Bend = j.Turn > 10;
                j.MapChange = Tag(ra, "highway") != Tag(rb, "highway") || Tag(ra, "lanes") != Tag(rb, "lanes") || Tag(ra, "surface") != Tag(rb, "surface") || Tag(ra, "bridge") != Tag(rb, "bridge") || Tag(ra, "tunnel") != Tag(rb, "tunnel");
                Measure(j, p, dirA, dirB, HalfOf(wa), HalfOf(wb), y);
                list.Add(j);
            }
            // Tile borders: every graded way where it crosses a coarse tile border.
            double S = TileScheduler.CoarseSize;
            foreach (var id in raw.Keys)
            {
                if (!graded.Contains(id)) continue;
                var pts = Pts(id); var hs = Hs(id);
                for (int i = 0; i + 1 < pts.Count; i++)
                {
                    double2 a = pts[i], b = pts[i + 1];
                    bool crossE = math.floor(a.x / S) != math.floor(b.x / S), crossN = math.floor(a.y / S) != math.floor(b.y / S);
                    if (!crossE && !crossN) continue;
                    double t = crossE ? (math.floor(math.max(a.x, b.x) / S) * S - a.x) / (b.x - a.x) : (math.floor(math.max(a.y, b.y) / S) * S - a.y) / (b.y - a.y);
                    var p = math.lerp(a, b, t);
                    if (!surveyed(p) || math.distance(p, pts[0]) < 3 || math.distance(p, pts[pts.Count - 1]) < 3) continue;
                    var d = math.normalizesafe(b - a);
                    float y = (float)math.lerp(hs[i], hs[i + 1], t) + Lift(id);
                    var j = new Join { Kind = "border", A = id, B = id, P = p, Dir = d, Y = y, Seam = true };
                    Measure(j, p, d, d, HalfOf(id), HalfOf(id), y);
                    list.Add(j);
                }
            }

            // The graded height (with the lift) of a way at distance d from one end.
            float YAlong(long id, bool fromStart, double d)
            {
                var pts = Pts(id); var hs = Hs(id); int n = pts.Count; double acc = 0;
                for (int k = 0; k + 1 < n; k++)
                {
                    int i = fromStart ? k : n - 1 - k, j2 = fromStart ? k + 1 : n - 2 - k;
                    double L = math.distance(pts[i], pts[j2]);
                    if (acc + L >= d || k + 2 == n) return (float)math.lerp(hs[i], hs[j2], L > 0 ? math.saturate((d - acc) / L) : 0) + Lift(id);
                    acc += L;
                }
                return (float)hs[0] + Lift(id);
            }

            // ---- Mouths: a way that ends on a road outranking it.
            byte Cls(long id) => raw.TryGetValue(id, out var w) ? RoadGraph.ClassOf(Tag(w, "highway")) : (byte)9;
            foreach (var kv in nodeWays)
            {
                if (kv.Value.Count < 2) continue;
                var arms = kv.Value;
                foreach (var (ws, ss) in arms)
                {
                    if (!graded.Contains(ws) || !raw.ContainsKey(ws)) continue;
                    var ps = Pts(ws);
                    if (ss != 0 && ss != ps.Count - 1) continue;
                    // The main road: the best-ranked other way there (class, then length), passing through or continued by another.
                    long main = 0; byte mc = 99; double ml = -1;
                    foreach (var (wm, sm) in arms)
                    {
                        if (wm == ws || !graded.Contains(wm) || !raw.TryGetValue(wm, out var rmw)) continue;
                        byte c = Cls(wm); double len = Pts(wm).Count;
                        if (c < mc || c == mc && len > ml) { main = wm; mc = c; ml = len; }
                    }
                    if (main == 0) continue;
                    byte sc = Cls(ws);
                    if (sc < mc || sc == mc && ps.Count > ml) continue;   // the side road outranks: it is the through road
                    var pm = Pts(main); int smi = -1;
                    foreach (var (wm, sm) in arms) if (wm == main) smi = sm;
                    bool through = smi > 0 && smi < pm.Count - 1;
                    if (!through)
                    {
                        // Continued by another way at the node (a main road split there): one of the other ends must not be the side road.
                        int ends = 0; foreach (var (wm, _) in arms) if (wm != ws) ends++;
                        if (ends < 2) continue;   // two ways end to end: a joint, not a mouth
                    }
                    var p = ss == 0 ? ps[0] : ps[ps.Count - 1];
                    if (!surveyed(p)) continue;
                    float halfS = HalfOf(ws), halfM = HalfOf(main);
                    float y = (float)Hs(main)[math.clamp(smi, 0, Hs(main).Length - 1)] + Lift(main);
                    // Every main-road way at the node: lateral distance from the main road (the nearest of them).
                    var mains = new List<List<double2>>();
                    foreach (var (wm, _) in arms) if (wm != ws && graded.Contains(wm) && Cls(wm) == mc && HalfOf(wm) == halfM) mains.Add(Pts(wm));
                    double Lat(double2 q)
                    {
                        double best = double.MaxValue;
                        foreach (var l in mains)
                            for (int i = 0; i + 1 < l.Count; i++)
                            {
                                double2 ab = l[i + 1] - l[i]; double L2 = math.lengthsq(ab); if (L2 == 0) continue;
                                double tt = math.saturate(math.dot(q - l[i], ab) / L2);
                                best = math.min(best, math.distance(q, l[i] + ab * tt));
                            }
                        return best;
                    }
                    var j = new Join { Kind = "mouth", A = ws, B = main, P = p, Y = y, Seam = seam(p), MainClass = mc, Arms = arms.Count, MainMarked = false };
                    At(ps, ss == 0, 2, out var outDir); j.Dir = -outDir;
                    double2 nS = new double2(-outDir.y, outDir.x);
                    float edge = halfM - 0.35f;
                    foreach (var off in new[] { 0.0, -(halfS - 0.15), halfS - 0.15 })
                    {
                        float gapRun = 0, g = 0, overRun = 0, o = 0;
                        bool crossedEdge = false;
                        for (double d = 0; d <= 20; d += 0.05)
                        {
                            var q = At(ps, ss == 0, d, out var dd) + new double2(-dd.y, dd.x) * off;
                            y = YAlong(ws, ss == 0, d);
                            double lat = Lat(q);
                            if (lat > 30) break;
                            HitsAt(q, hits);
                            bool any = Top(hits, y, out var top);
                            if (Overlap(hits, y)) { o += 0.05f; overRun = math.max(overRun, o); } else o = 0;
                            if (lat > halfM && !any) { g += 0.05f; gapRun = math.max(gapRun, g); } else g = 0;
                            if (off == 0 && any && lat < edge - 0.1)
                            {
                                // Inside the main road's edge line: is the top surface the side road's (its u says so)?
                                float uS = 0.5f, uM = (float)(0.5 + lat / (2 * halfM));
                                if (math.abs(top.U - uS) < math.min(math.abs(top.U - uM), math.abs(top.U - (1 - uM))) - 0.05f) j.SideInside += 0.05f;
                            }
                            if (off == 0 && !crossedEdge && lat >= edge)
                            {
                                crossedEdge = true;
                                // The main road's edge line where the side road's centre crosses it: painted on any surface there?
                                foreach (var h in hits) if (!h.Skirt && math.abs(h.Y - y) < 1.5f && Marked(h) && math.abs(h.Half - halfM) < 0.01f) j.MainMarked = true;
                                if (Top(hits, y, out var tp) && EdgePainted(tp)) j.EdgeAcross = true;
                                else foreach (var h in hits) if (!h.Skirt && math.abs(h.Y - (tp.Y)) < 0.15f && EdgePainted(h)) j.EdgeAcross = true;
                            }
                        }
                        j.MouthGap = math.max(j.MouthGap, gapRun); j.MouthOver = math.max(j.MouthOver, overRun);
                    }
                    list.Add(j);
                }
            }

            // ---- Report.
            var inv = CultureInfo.InvariantCulture;
            var csv = new StringBuilder("kind,a,b,E,N,lat,lon,gap,overlap,edge_off,dash_err,step,type_change,map_change,turn,seam,mouth_gap,mouth_over,side_inside,edge_across,main_marked,main_class,arms\n");
            foreach (var j in list)
            {
                var ll = Proj.ToLatLon(new Utm33(j.P.x, j.P.y));
                csv.Append(string.Format(inv, "{0},{1},{2},{3:0.0},{4:0.0},{5:0.000000},{6:0.000000},{7:0.00},{8:0.00},{9:0.00},{10:0.00},{11:0.00},{12},{13},{14:0},{15},{16:0.00},{17:0.00},{18:0.00},{19},{20},{21},{22}\n",
                    j.Kind, j.A, j.B, j.P.x, j.P.y, ll.Lat, ll.Lon, j.Gap, j.Over, j.EdgeOff, j.DashErr, j.Step, j.TypeChange ? 1 : 0, j.MapChange ? 1 : 0, j.Turn, j.Seam ? 1 : 0, j.MouthGap, j.MouthOver, j.SideInside, j.EdgeAcross ? 1 : 0, j.MainMarked ? 1 : 0, j.MainClass, j.Arms));
            }
            File.WriteAllText(Path.Combine(outDir, "joins.csv"), csv.ToString());
            var why = new StringBuilder();
            int nw = 0;
            foreach (var j in list) if (j.Why != null && j.Turn < 3 && nw++ < 30) why.Append(FormattableString.Invariant($"{j.Kind} {j.A} {j.B} at {j.P.x:0.0} {j.P.y:0.0} turn {j.Turn:0} over {j.Over:0.00}: {j.Why}\n"));
            nw = 0;
            foreach (var j in list) if (j.GapWhy != null && j.Kind == "joint" && nw++ < 30) why.Append(FormattableString.Invariant($"GAP {j.Kind} {j.A} {j.B} at {j.P.x:0.0} {j.P.y:0.0} turn {j.Turn:0} gap {j.Gap:0.00}: {j.GapWhy}\n"));
            File.WriteAllText(Path.Combine(outDir, "joins_why.txt"), why.ToString());
            var rep = new StringBuilder($"# {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC  {(live ? "live " + query : "fake")}  joins (dash shift {dashShift})\n");
            foreach (var kind in new[] { "joint", "border" })
            {
                var l = list.FindAll(x => x.Kind == kind);
                int gap = l.FindAll(x => x.Gap > 0.1f).Count, over = l.FindAll(x => x.Over > 0.1f).Count, edgeOff = l.FindAll(x => x.EdgeOff > 0.1f).Count, marked = l.FindAll(x => x.EdgeOff >= 0).Count;
                int dash = l.FindAll(x => x.DashErr > 0.3f).Count, dashN = l.FindAll(x => x.DashErr >= 0).Count, step = l.FindAll(x => x.Step > 0.05f).Count;
                int type = l.FindAll(x => x.TypeChange && !x.MapChange).Count, typeMap = l.FindAll(x => x.TypeChange && x.MapChange).Count, bend = l.FindAll(x => x.Bend).Count;
                int bad = l.FindAll(x => x.Gap > 0.1f || x.Over > 0.1f || x.EdgeOff > 0.1f || x.DashErr > 0.3f || x.Step > 0.05f || x.TypeChange && !x.MapChange).Count;
                rep.Append(FormattableString.Invariant($"{kind}s: {l.Count} (in a bend > 10°: {bend}); not joined: {bad}; ribbon gap > 0.1 m: {gap}; overlap > 0.1 m: {over}; edge lines offset > 0.1 m: {edgeOff} of {marked} marked; centre dashes broken: {dash} of {dashN}; height step > 5 cm: {step}; line type change without the map: {type} (with the map: {typeMap})\n"));
                var bendL = l.FindAll(x => x.Bend);
                if (kind == "joint" && bendL.Count > 0)
                    rep.Append(FormattableString.Invariant($"  in a bend: gap > 0.1 m {bendL.FindAll(x => x.Gap > 0.1f).Count}, overlap {bendL.FindAll(x => x.Over > 0.1f).Count}, edge offset {bendL.FindAll(x => x.EdgeOff > 0.1f).Count}; mean gap {Mean(bendL, x => x.Gap):0.00} m, mean overlap {Mean(bendL, x => x.Over):0.00} m\n"));
            }
            {
                var l = list.FindAll(x => x.Kind == "mouth");
                int gap = l.FindAll(x => x.MouthGap > 0.1f).Count, over = l.FindAll(x => x.MouthOver > 0.3f).Count, inside = l.FindAll(x => x.SideInside > 0.3f).Count;
                var marked = l.FindAll(x => x.MainMarked);
                int across = marked.FindAll(x => x.EdgeAcross).Count;
                int bad = l.FindAll(x => x.MouthGap > 0.1f || x.MouthOver > 0.3f || x.SideInside > 0.3f || x.EdgeAcross).Count;
                rep.Append(FormattableString.Invariant($"mouths: {l.Count} (on a marked main road {marked.Count}); not joined: {bad}; gap past the main edge > 0.1 m: {gap}; two surfaces (z-fight) > 0.3 m: {over}; side road's surface inside the main road's edge line > 0.3 m: {inside}; main edge line painted across the mouth: {across} of {marked.Count}\n"));
                rep.Append(FormattableString.Invariant($"  mean overlap {Mean(l, x => x.MouthOver):0.00} m, mean side surface inside {Mean(l, x => x.SideInside):0.00} m\n"));
            }
            // The four kinds for the before/after sheet: a town junction (most arms, residential), a T-junction on a main road
            // (class ≤ 3), a joint in a bend, a tile border — the worst of each.
            Join Worst(Predicate<Join> p, Func<Join, float> score)
            {
                Join best = null; float bs = -1;
                foreach (var j in list) if (p(j)) { float s = score(j); if (s > bs) { bs = s; best = j; } }
                return best;
            }
            var picks = new List<(string name, Join j)>
            {
                ("town_junction", Worst(j => j.Kind == "mouth" && j.Arms >= 4 && j.MainClass >= 4, j => j.MouthOver + j.SideInside + j.MouthGap + (j.EdgeAcross ? 2 : 0))),
                ("t_junction_main", Worst(j => j.Kind == "mouth" && j.MainClass <= 3 && j.MainMarked, j => j.MouthOver + j.SideInside + j.MouthGap + (j.EdgeAcross ? 2 : 0))),
                ("bend_joint", Worst(j => j.Kind == "joint" && j.Bend, j => j.Gap + j.Over + math.max(0, j.EdgeOff) + math.max(0, j.DashErr))),
                ("tile_edge", Worst(j => j.Kind == "border", j => j.Gap + j.Over + math.max(0, j.EdgeOff) + math.max(0, j.DashErr) + j.Step * 5)),
            };
            var spots = new StringBuilder();
            foreach (var (name, j) in picks)
                if (j != null) spots.Append(string.Format(inv, "{0} {1:0.0} {2:0.0} {3:0.###} {4:0.###} {5:0.0} {6} {7}\n", name, j.P.x, j.P.y, j.Dir.x, j.Dir.y, j.Y, j.A, j.B));
            File.WriteAllText(Path.Combine(outDir, "joins_spots.txt"), spots.ToString());
            rep.Append("spots (name E N dirE dirN roadY a b):\n").Append(spots);
            File.WriteAllText(Path.Combine(outDir, "joins.txt"), rep.ToString());
            Debug.Log("PreviewShots joins:\n" + rep);
            JoinShots(joinSpotsFile != null && File.Exists(joinSpotsFile) ? File.ReadAllText(joinSpotsFile) : spots.ToString());
            jMeshes = null; jGrid = null;
        }

        static float Mean(List<Join> l, Func<Join, float> f) { if (l.Count == 0) return 0; float s = 0; foreach (var j in l) s += f(j); return s / l.Count; }

        /// <summary>Two shots per join: low along the road from 14 m back, and from above at 16 m.</summary>
        static void JoinShots(string text)
        {
            var inv = CultureInfo.InvariantCulture;
            foreach (var line in text.Split('\n'))
            {
                var v = line.Trim().Split(' ');
                if (v.Length < 6) continue;
                var at = FloatingOrigin.ToWorldXZ(new Utm33(double.Parse(v[1], inv), double.Parse(v[2], inv)));
                var dir = math.normalizesafe(new float2(float.Parse(v[3], inv), float.Parse(v[4], inv)), new float2(0, 1));
                float y = float.Parse(v[5], inv);
                if (y == 0) y = world.HeightAt(at);   // a hand-made spot without the road height
                var side = new float2(dir.y, -dir.x);
                void LookY(float2 from, float fy, float2 to, float ty) { ClearLineup(); var pf = new Vector3(from.x, fy, from.y); cam.transform.position = pf; cam.transform.rotation = Quaternion.LookRotation(new Vector3(to.x, ty, to.y) - pf, Vector3.up); }
                shots.Enqueue(($"join_{v[0]}_along", () => LookY(at - dir * 14 + side * 1.5f, y + 2.2f, at + dir * 6, y)));
                shots.Enqueue(($"join_{v[0]}_above", () => LookY(at - dir * 9 + side * 4, y + 16f, at + dir * 1, y)));
            }
        }
    }
}
