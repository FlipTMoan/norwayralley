using System.Collections.Generic;
using System.Runtime.InteropServices;
using Rally.Core;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.Roads
{
    /// <summary>
    /// The road surface mesh (port of stage.js buildRibbon as roads.js buildRoadMeshes uses it): six rows per
    /// station — skirt, shoulder, carriageway edge, carriageway edge, shoulder, skirt — and short skirts sloping
    /// off both shoulders so the road reads as a solid ribbon. Every row height is the car's own ground there (what
    /// TileWorld.HeightAt answers on the road: the graded road height + ROAD_LIFT + RoadConstants.SurfaceLift), so the
    /// drawn road and the wheel contact are one surface, straight across the carriageway. It used to sample the carved height grid instead, which is the 8 m coarse grid when a tile's
    /// roads arrive before its 1 m tiles: the ribbon then sat up to metres off the road the car drove on and the
    /// finer terrain cut through it in steps.
    /// UVs: u = −1 at the left skirt, 0..1 across the carriageway, 2 at the right skirt (markings in the
    /// material by u), v = the along coordinate / 4 (<see cref="AlongScale"/>); UV1.x = the carriageway half width (Rally/Road draws markings on two-lane
    /// asphalt only); UV1.y how far inside a road tunnel (<see cref="Tunnels.InsideWeight"/>: lamp light, not the sun);
    /// UV2 the junction mouths on the −normal / +normal side (<see cref="NoMouth"/> when none). Sub-mesh 0 is tarmac, 1 gravel.
    /// <para><b>Joins</b> (2026-11-22, "the streets are still badly joined"): two runs that end at the same point (two OSM ways
    /// end to end, or one way's material change) share their end cross-section: both are cut square to the bisector of
    /// their two directions (a mitre), so the ribbons, the edge lines and the centre line meet with no wedge in a bend.
    /// The centre dashes are centred on every way end (<see cref="AlongScale"/>, <see cref="DashShift"/>), so they run on
    /// across every join and every tile border. Where a side road meets a road that outranks it (its samples
    /// <see cref="RoadSample.Covered"/> there), its ribbon ends on the main road's carriageway edge, flared to a corner
    /// radius (<see cref="MouthRadius"/>); the main road's edge line is broken and its shoulder left out across the mouth
    /// (UV2, Rally/Road), so the two surfaces never overlap. It used to run on 0–5 m into the main road, both ribbons
    /// coplanar (z-fight), the side road's lines over the main road's and the main road's edge line across the mouth.</para>
    /// </summary>
    public static class RibbonMesh
    {
        /// <summary>Half-open ownership test: a point on a border belongs to the tile east / north of it.</summary>
        public static bool Owns(Bounds25833? own, double2 p) => !own.HasValue || (p.x >= own.Value.MinE && p.x < own.Value.MaxE && p.y >= own.Value.MinN && p.y < own.Value.MaxN);

        public const int Rows = 6;
        /// <summary>Skirts run SkirtOut beyond the shoulder edge and SkirtDrop down: buried in the terrain that meets the edge
        /// (RoadConstants.CarveLift), they show only where a coarse terrain ring sags, as an earth-coloured embankment face
        /// rather than the vertical wall and shadow line they used to draw.</summary>
        public const float SkirtDrop = 0.55f, SkirtOut = 0.5f;
        /// <summary>Rally/Road's centre line: a 3 m dash every <see cref="DashPeriod"/> m of the along coordinate, centred on
        /// its multiples (the shader shifts by <see cref="DashShift"/>), so a dash sits on every way end whichever way it runs.</summary>
        public const float DashPeriod = 12f, DashShift = 1.5f;
        /// <summary>UV2 where no mouth is near (the shader breaks the edge line where |UV2| &lt; 1).</summary>
        public const float NoMouth = 99f;

        /// <summary>
        /// Rally/Road leaves out a road's shoulder and skirt <paramref name="e"/> m past its carriageway edge where |UV2| is under
        /// this: the mouth narrows with the side road's kerb fillet (1 − √(e(2r − e)) / half length, bounded for r 3–10 m), so
        /// no notch of bare ground opens at the corners.
        /// </summary>
        public static float MouthKeep(float e) => 1f - 0.36f * math.sqrt(math.clamp(e, 0f, 1.6f));

        /// <summary>Along-coordinate metres per metre of a way: a whole number of dash periods over its length, so each of its
        /// ends sits on a dash centre and the dashes run on across a join to the next way (also one drawn by another tile).</summary>
        public static float AlongScale(float wayLength) => wayLength > 0.5f ? DashPeriod * math.max(1f, math.round(wayLength / DashPeriod)) / wayLength : 1f;

        /// <summary>The kerb radius where a side road of this kind meets a road that outranks it (by the side road's class).</summary>
        public static float MouthRadius(string kind)
        {
            switch (RoadGraph.ClassOf(kind))
            {
                case 0: case 1: return 10f;
                case 2: case 3: return 8f;
                case 5: return 3f;
                default: return 5f;
            }
        }

        [StructLayout(LayoutKind.Sequential)]
        struct Vertex { public float3 Pos; public float3 Normal; public float2 UV; public float2 UV1; public float2 UV2; }

        /// <summary>A cross-section of a strip: its rows lie along <see cref="N"/> (× <see cref="Scale"/> at a mitre), or at <see cref="Rows"/> on a mouth.</summary>
        struct Station
        {
            public double2 P, N; public float Y, S, Inside, Scale, Flare;
            public double2[] RowP; public float[] RowY;
            /// <summary>Near a mouth: no row past the main road's edge (the line through <see cref="EdgeP"/>, <see cref="EdgeIn"/> pointing into
            /// the main road); a row that would be is slid back along <see cref="Into"/> (the run's way into the main road) onto it.</summary>
            public bool Clip; public double2 EdgeP, EdgeIn, Into;
        }

        /// <summary>One run's stations, its drawn stretches (along S) and the mouths other runs open in its edges.</summary>
        sealed class Strip
        {
            public RoadPolyline Line; public List<RoadSample> Smp; public double2[] N; public float[] Scale;
            public List<(float a, float b)> Drawn = new List<(float, float)>();
            public List<(float s, Station x, float r, bool coveredAfter, double2 edgeIn, double2 into)> Cuts;
            public List<(float c, float h, int side)> Mouths;
        }

        /// <summary>
        /// Build one mesh for a tile's runs, in metres relative to <paramref name="origin"/>. A tile's runs reach TilePad into
        /// its neighbours (grading and carving need that context), so with <paramref name="own"/> only the segments whose
        /// middle lies inside the tile itself (half-open) are drawn: every stretch of road by exactly one tile. Two tiles used to
        /// draw the same 120 m at every border, from different meshes with V restarting at each run: z-fighting dashes.
        /// The joins and mouths are worked out from the runs alone, so the two tiles at a border build the same ones.
        /// </summary>
        public static Mesh Build(List<RoadPolyline> lines, Utm33 origin, Bounds25833? own = null)
        {
            var strips = new List<Strip>(lines.Count);
            foreach (var line in lines)
            {
                var s = line.Samples;
                if (s == null || s.Count < 2) continue;
                var st = new Strip { Line = line, Smp = s, N = new double2[s.Count], Scale = new float[s.Count] };
                for (int i = 0; i < s.Count; i++)
                {
                    double2 prev = s[math.max(0, i - 1)].P, next = s[math.min(s.Count - 1, i + 1)].P;
                    double2 t = math.normalizesafe(next - prev, new double2(1, 0));
                    st.N[i] = new double2(-t.y, t.x); st.Scale[i] = 1;
                    if (i + 1 < s.Count && !(s[i].Covered && s[i + 1].Covered)) AddDrawn(st.Drawn, s[i].S, s[i + 1].S);   // inside a junction the major road's ribbon is the surface
                }
                strips.Add(st);
            }
            Mitres(strips);
            Mouths(strips);

            var verts = new List<Vertex>(4096);
            var tarmac = new List<uint>(8192); var gravel = new List<uint>(8192);
            var stations = new List<Station>(64);
            foreach (var st in strips)
            {
                var line = st.Line;
                float half = line.Lanes.Half, shoulder = RoadConstants.RoadShoulder, along = AlongScale(line.WayLength);
                var idx = line.Paved ? tarmac : gravel;
                Stations(st, stations);
                int baseV = verts.Count;
                for (int i = 0; i < stations.Count; i++)
                {
                    var q = stations[i];
                    float mouthNeg = NoMouth, mouthPos = NoMouth;
                    if (st.Mouths != null)
                    {
                        float bn = float.MaxValue, bp = float.MaxValue;
                        foreach (var (c, h, side) in st.Mouths)
                        {
                            float d = q.S - c;
                            if (side < 0 && math.abs(d) < bn) { bn = math.abs(d); mouthNeg = d / h; }
                            if (side > 0 && math.abs(d) < bp) { bp = math.abs(d); mouthPos = d / h; }
                        }
                    }
                    for (int k = 0; k < Rows; k++)
                    {
                        float offset = k <= 2 ? -(k == 2 ? half : half + shoulder) : (k == 3 ? half : half + shoulder);
                        bool skirt = k == 0 || k == 5;
                        double2 p;
                        float y;
                        if (q.RowP != null) { p = q.RowP[k]; y = q.RowY[k]; }
                        else
                        {
                            float o = offset * q.Scale + math.sign(offset) * (q.Flare + (skirt ? SkirtOut : 0));
                            p = q.P + q.N * o;
                            if (q.Clip)
                            {
                                // A flared row of an oblique side road would reach past the main road's edge on the acute side.
                                double inside = math.dot(p - q.EdgeP, q.EdgeIn), toward = math.dot(q.Into, q.EdgeIn);
                                if (inside > 0 && toward > 0.2) p -= q.Into * (inside / toward);
                            }
                            // Skirts: from the shoulder edge out and down into the ground.
                            y = q.Y + RoadConstants.RoadLift + RoadConstants.SurfaceLift(math.abs(offset), half) - (skirt ? SkirtDrop : 0);
                        }
                        float u = k == 0 ? -1 : k == 1 ? -shoulder / (2 * half) : k == 2 ? 0 : k == 3 ? 1 : k == 4 ? 1 + shoulder / (2 * half) : 2;
                        verts.Add(new Vertex
                        {
                            Pos = new float3((float)(p.x - origin.E), y, (float)(p.y - origin.N)),
                            Normal = new float3(0, 1, 0), UV = new float2(u, q.S * along / 4f), UV1 = new float2(half, q.Inside), UV2 = new float2(mouthNeg, mouthPos),
                        });
                    }
                    if (i < stations.Count - 1 && IsDrawn(st.Drawn, (q.S + stations[i + 1].S) * 0.5f) && Owns(own, (q.P + stations[i + 1].P) * 0.5))
                    {
                        uint a = (uint)(baseV + i * Rows), b = (uint)(baseV + (i + 1) * Rows);
                        for (uint k = 0; k < Rows - 1; k++)
                        {
                            // Clockwise seen from above (Unity front face) — mirrored from the three.js winding.
                            idx.Add(a + k); idx.Add(a + k + 1); idx.Add(b + k);
                            idx.Add(a + k + 1); idx.Add(b + k + 1); idx.Add(b + k);
                        }
                    }
                }
            }
            if (verts.Count == 0 || tarmac.Count + gravel.Count == 0) return null;
            var data = Mesh.AllocateWritableMeshData(1);
            var md = data[0];
            md.SetVertexBufferParams(verts.Count,
                new VertexAttributeDescriptor(VertexAttribute.Position, VertexAttributeFormat.Float32, 3),
                new VertexAttributeDescriptor(VertexAttribute.Normal, VertexAttributeFormat.Float32, 3),
                new VertexAttributeDescriptor(VertexAttribute.TexCoord0, VertexAttributeFormat.Float32, 2),
                new VertexAttributeDescriptor(VertexAttribute.TexCoord1, VertexAttributeFormat.Float32, 2),
                new VertexAttributeDescriptor(VertexAttribute.TexCoord2, VertexAttributeFormat.Float32, 2));
            var vb = md.GetVertexData<Vertex>();
            for (int i = 0; i < verts.Count; i++) vb[i] = verts[i];
            md.SetIndexBufferParams(tarmac.Count + gravel.Count, IndexFormat.UInt32);
            var ib = md.GetIndexData<uint>();
            for (int i = 0; i < tarmac.Count; i++) ib[i] = tarmac[i];
            for (int i = 0; i < gravel.Count; i++) ib[tarmac.Count + i] = gravel[i];
            md.subMeshCount = 2;
            md.SetSubMesh(0, new SubMeshDescriptor(0, tarmac.Count), MeshUpdateFlags.DontRecalculateBounds);
            md.SetSubMesh(1, new SubMeshDescriptor(tarmac.Count, gravel.Count), MeshUpdateFlags.DontRecalculateBounds);
            var mesh = new Mesh { name = "RoadRibbon" };
            Mesh.ApplyAndDisposeWritableMeshData(data, mesh);
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        static void AddDrawn(List<(float a, float b)> drawn, float a, float b)
        {
            if (drawn.Count > 0 && math.abs(drawn[drawn.Count - 1].b - a) < 1e-4f) drawn[drawn.Count - 1] = (drawn[drawn.Count - 1].a, b);
            else drawn.Add((a, b));
        }

        static bool IsDrawn(List<(float a, float b)> drawn, float s)
        {
            foreach (var (a, b) in drawn) if (s > a && s < b) return true;
            return false;
        }

        /// <summary>Take (a, b) out of the drawn stretches.</summary>
        static void Undraw(List<(float a, float b)> drawn, float a, float b)
        {
            for (int i = drawn.Count - 1; i >= 0; i--)
            {
                var (x, y) = drawn[i];
                if (y <= a || x >= b) continue;
                drawn.RemoveAt(i);
                if (y > b) drawn.Insert(i, (b, y));
                if (x < a) drawn.Insert(i, (x, a));
            }
        }

        /// <summary>
        /// Runs that end at the same point (two ways end to end, a material change; where more end there, the two of one width
        /// that run on most nearly straight): both end stations are cut along the bisector of the two directions, widened by
        /// 1/cos of the half turn (a mitre).
        /// </summary>
        static void Mitres(List<Strip> strips)
        {
            var ends = new Dictionary<long, List<(int strip, bool start)>>();
            for (int i = 0; i < strips.Count; i++)
            {
                var s = strips[i].Smp;
                Add(ends, s[0].P, (i, true));
                Add(ends, s[s.Count - 1].P, (i, false));
            }
            foreach (var kv in ends)
            {
                var l = kv.Value;
                if (l.Count < 2) continue;
                int pa = 0, pb = 1;
                if (l.Count > 2)
                {
                    // A road split where a side road joins it (three or more ends at the node): the two ends of one width that
                    // run on most nearly straight, turning less than 60°, are the road; the others meet it (Mouths).
                    double best = 0.5; pa = -1;
                    for (int x = 0; x < l.Count; x++)
                        for (int y = x + 1; y < l.Count; y++)
                        {
                            if (l[x].strip == l[y].strip || strips[l[x].strip].Line.Lanes.Half != strips[l[y].strip].Line.Lanes.Half) continue;
                            double straight = -math.dot(Into(strips[l[x].strip].Smp, l[x].start), Into(strips[l[y].strip].Smp, l[y].start));
                            if (straight > best) { best = straight; pa = x; pb = y; }
                        }
                    if (pa < 0) continue;
                }
                var (ia, sa) = l[pa]; var (ib, sb) = l[pb];
                if (ia == ib) continue;   // a loop back to its own start
                double2 inA = Into(strips[ia].Smp, sa), inB = Into(strips[ib].Smp, sb);
                if (math.lengthsq(inA) < 1e-8 || math.lengthsq(inB) < 1e-8) continue;
                var t = inA - inB;     // the way through: in along A, out against B's way in
                if (math.lengthsq(t) < 1e-6) continue;   // a hairpin back onto itself
                t = math.normalize(t);
                Set(strips[ia], sa, inA, t); Set(strips[ib], sb, inB, t);
            }
        }

        static void Add(Dictionary<long, List<(int, bool)>> d, double2 p, (int, bool) e)
        {
            long k = ((long)math.round(p.x * 100) << 32) ^ (uint)(long)math.round(p.y * 100);
            if (!d.TryGetValue(k, out var l)) d[k] = l = new List<(int, bool)>(2);
            l.Add(e);
        }

        /// <summary>The unit direction of the run's end segment, pointing into its end point.</summary>
        static double2 Into(List<RoadSample> s, bool start)
            => start ? math.normalizesafe(s[0].P - s[1].P) : math.normalizesafe(s[s.Count - 1].P - s[s.Count - 2].P);

        static void Set(Strip st, bool start, double2 into, double2 through)
        {
            var own = start ? -into : into;                       // the run's own direction at that end
            var t = math.dot(through, own) >= 0 ? through : -through;
            int i = start ? 0 : st.Smp.Count - 1;
            st.N[i] = new double2(-t.y, t.x);
            st.Scale[i] = 1f / (float)math.max(0.5, math.dot(t, own));
        }

        /// <summary>
        /// Every place a run goes from drawn to covered (a side road reaching a road that outranks it, <see cref="RoadSample.Covered"/>):
        /// the run ends where its centre line crosses the main road's carriageway edge (drawn on, a flared end station on that
        /// edge), and the main road gets a mouth on that side over the side road's width.
        /// </summary>
        static void Mouths(List<Strip> strips)
        {
            // Segments of every run in 16 m cells.
            const double cell = 16;
            var grid = new Dictionary<long, List<(int strip, int seg)>>();
            long Key(int x, int z) => ((long)x << 32) ^ (uint)z;
            for (int si = 0; si < strips.Count; si++)
            {
                var s = strips[si].Smp;
                for (int i = 0; i + 1 < s.Count; i++)
                {
                    double2 lo = math.min(s[i].P, s[i + 1].P), hi = math.max(s[i].P, s[i + 1].P);
                    for (int x = (int)math.floor(lo.x / cell); x <= (int)math.floor(hi.x / cell); x++)
                        for (int z = (int)math.floor(lo.y / cell); z <= (int)math.floor(hi.y / cell); z++)
                        {
                            long k = Key(x, z);
                            if (!grid.TryGetValue(k, out var l)) grid[k] = l = new List<(int, int)>(4);
                            l.Add((si, i));
                        }
                }
            }
            for (int si = 0; si < strips.Count; si++)
            {
                var st = strips[si]; var s = st.Smp;
                for (int i = 0; i + 1 < s.Count; i++)
                {
                    if (s[i].Covered == s[i + 1].Covered) continue;
                    bool coveredAfter = s[i + 1].Covered;
                    int c = coveredAfter ? i + 1 : i, u = coveredAfter ? i : i + 1;
                    // The main road: the other run whose centre line is nearest the covered sample (projected inside a segment).
                    int mi = -1, mseg = -1; double best = double.MaxValue;
                    var pc = s[c].P;
                    const double reach = RoadConstants.TwoLaneHalf + RoadConstants.Shoulder + 1;
                    for (int gx = (int)math.floor((pc.x - reach) / cell); gx <= (int)math.floor((pc.x + reach) / cell); gx++)
                        for (int gz = (int)math.floor((pc.y - reach) / cell); gz <= (int)math.floor((pc.y + reach) / cell); gz++)
                        {
                            if (!grid.TryGetValue(Key(gx, gz), out var near)) continue;
                            foreach (var (oi, oseg) in near)
                            {
                                var o = strips[oi];
                                if (o.Line.Id == st.Line.Id) continue;
                                double2 a = o.Smp[oseg].P, b = o.Smp[oseg + 1].P, ab = b - a;
                                double l2 = math.lengthsq(ab); if (l2 < 1e-9) continue;
                                double t = math.dot(pc - a, ab) / l2;
                                if (t < -0.01 || t > 1.01) continue;
                                double d = math.distance(pc, a + ab * math.saturate(t));
                                if (d <= RoadConstants.FlatHalf(o.Line.Lanes.Half) + 0.5 && d < best) { best = d; mi = oi; mseg = oseg; }
                            }
                        }
                    if (mi < 0) continue;
                    var m = strips[mi];
                    float halfM = m.Line.Lanes.Half;
                    // The side of the main road the run comes from, and the main road's drawn carriageway edge there.
                    double2 ma = m.Smp[mseg].P, mb = m.Smp[mseg + 1].P, mn = new double2(-(mb - ma).y, (mb - ma).x);
                    int side = math.dot(s[u].P - ma, mn) >= 0 ? 1 : -1;
                    double2 Edge(int j) => m.Smp[j].P + m.N[j] * (side * halfM * m.Scale[j]);
                    // Walk the side road's centre from the covered sample outwards (up to four more segments) to the edge.
                    bool found = false; double2 x = default; float sx = 0; int ex = -1; double2 edgeDir = default;
                    int step = coveredAfter ? -1 : 1;
                    for (int k = c, n = 0; n < 5 && k + step >= 0 && k + step < s.Count && !found; k += step, n++)
                    {
                        if (n > 0 && s[k].Covered) break;
                        double2 p0 = s[k].P, p1 = s[k + step].P;
                        for (int j = math.max(0, mseg - 4); j + 1 < m.Smp.Count && j <= mseg + 4; j++)
                        {
                            if (!Cross(p0, p1, Edge(j), Edge(j + 1), out double tp)) continue;
                            x = math.lerp(p0, p1, tp); sx = math.lerp(s[k].S, s[k + step].S, (float)tp);
                            ex = j; edgeDir = math.normalizesafe(Edge(j + 1) - Edge(j)); found = true; break;
                        }
                    }
                    if (!found) continue;
                    // The end station: rows on the main road's edge line, flared to the corner radius.
                    float halfS = st.Line.Lanes.Half, r = MouthRadius(st.Line.Kind);
                    var ts = coveredAfter ? math.normalizesafe(s[c].P - s[u].P) : math.normalizesafe(s[u].P - s[c].P);   // the run's own direction
                    // A road merging at a shallow angle (a slip road, a fork) runs along the edge for metres: no mouth (a cut there
                    // left a hole between the two ribbons); it is drawn on to its covered sample as before.
                    double cosA = math.abs(math.dot(ts, edgeDir));
                    if (cosA > MergeCos) continue;
                    // The kerb radius shrinks to nothing as the road meets the edge more obliquely (under 60° to it): a full flare
                    // on a roundabout entry laid rows metres along the ring.
                    r *= (float)math.saturate((math.sqrt(1 - cosA * cosA) - 0.5) / 0.4);
                    double2 ns = new double2(-ts.y, ts.x);
                    var end = new Station { P = x, N = ns, Scale = 1, S = sx, Y = LerpY(s, sx), Inside = 0, RowP = new double2[Rows], RowY = new float[Rows] };
                    float mLo = float.MaxValue, mHi = float.MinValue;
                    for (int k = 0; k < Rows; k++)
                    {
                        float offset = k <= 2 ? -(k == 2 ? halfS : halfS + RoadConstants.RoadShoulder) : (k == 3 ? halfS : halfS + RoadConstants.RoadShoulder);
                        bool skirt = k == 0 || k == 5;
                        float o = offset + math.sign(offset) * (r + (skirt ? SkirtOut : 0));
                        // On the main road's drawn edge (its stations' edge points, near the crossing), else on its tangent there:
                        // x + ns·o + ts·λ on that line. A row put on the tangent of a bending main road reached into its carriageway.
                        double2 a0 = ns * o;
                        double lambda = double.NaN;
                        for (int j = math.max(0, ex - 6); j + 1 < m.Smp.Count && j <= ex + 6; j++)
                        {
                            double2 e0 = Edge(j), e1 = Edge(j + 1), ed = e1 - e0;
                            double den = ts.x * -ed.y + ed.x * ts.y;
                            if (math.abs(den) < 1e-9) continue;
                            double2 w = e0 - (x + a0);
                            double l = (w.x * -ed.y + ed.x * w.y) / den, mu = (ts.x * w.y - ts.y * w.x) / den;
                            if (mu < -1e-6 || mu > 1 + 1e-6) continue;
                            if (double.IsNaN(lambda) || math.abs(l) < math.abs(lambda)) lambda = l;
                        }
                        if (double.IsNaN(lambda))
                        {
                            double det = ts.x * -edgeDir.y + edgeDir.x * ts.y;
                            lambda = math.abs(det) > 0.2 ? -(a0.x * -edgeDir.y + edgeDir.x * a0.y) / det : 0;
                        }
                        lambda = math.clamp(lambda, -1.5 * math.abs(o), 1.5 * math.abs(o));
                        var p = x + a0 + ts * lambda;
                        end.RowP[k] = p;
                        // The main road's own surface height at that point (its carriageway: the side road meets it flush).
                        float ym = MainY(m, ex, p, out float sm);
                        end.RowY[k] = ym + RoadConstants.RoadLift + RoadConstants.SurfaceLift(0, halfM) - (skirt ? SkirtDrop : 0);
                        if (k == 1 || k == 4) { mLo = math.min(mLo, sm); mHi = math.max(mHi, sm); }
                    }
                    if (mHi <= mLo) continue;
                    var edgeIn = new double2(-edgeDir.y, edgeDir.x);
                    if (math.dot(edgeIn, m.Smp[ex].P - x) < 0) edgeIn = -edgeIn;
                    (st.Cuts ??= new List<(float, Station, float, bool, double2, double2)>()).Add((sx, end, r, coveredAfter, edgeIn, coveredAfter ? ts : -ts));
                    if (coveredAfter) Undraw(st.Drawn, sx, s[c].S); else Undraw(st.Drawn, s[c].S, sx);
                    (m.Mouths ??= new List<(float, float, int)>()).Add(((mLo + mHi) * 0.5f, (mHi - mLo) * 0.5f + 0.05f, side));
                }
            }
        }

        /// <summary>Segment p0→p1 crosses q0→q1: the parameter along p0→p1.</summary>
        static bool Cross(double2 p0, double2 p1, double2 q0, double2 q1, out double t)
        {
            t = 0;
            double2 r = p1 - p0, q = q1 - q0;
            double den = r.x * q.y - r.y * q.x;
            if (math.abs(den) < 1e-9) return false;
            double2 w = q0 - p0;
            t = (w.x * q.y - w.y * q.x) / den;
            double v = (w.x * r.y - w.y * r.x) / den;
            return t >= 0 && t <= 1 && v >= -1e-6 && v <= 1 + 1e-6;
        }

        static float LerpY(List<RoadSample> s, float at)
        {
            for (int i = 0; i + 1 < s.Count; i++)
                if (at >= math.min(s[i].S, s[i + 1].S) && at <= math.max(s[i].S, s[i + 1].S))
                {
                    float d = s[i + 1].S - s[i].S;
                    return math.abs(d) < 1e-6f ? s[i].RoadY : math.lerp(s[i].RoadY, s[i + 1].RoadY, (at - s[i].S) / d);
                }
            return at <= s[0].S ? s[0].RoadY : s[s.Count - 1].RoadY;
        }

        /// <summary>The main road's graded height at the point (projected on its centre line near segment <paramref name="seg"/>) and its S there.</summary>
        static float MainY(Strip m, int seg, double2 p, out float s)
        {
            double best = double.MaxValue; float y = m.Smp[seg].RoadY; s = m.Smp[seg].S;
            for (int j = math.max(0, seg - 4); j + 1 < m.Smp.Count && j <= seg + 4; j++)
            {
                double2 a = m.Smp[j].P, b = m.Smp[j + 1].P, ab = b - a;
                double l2 = math.lengthsq(ab); if (l2 < 1e-9) continue;
                double t = math.saturate(math.dot(p - a, ab) / l2);
                double d = math.distancesq(p, a + ab * t);
                if (d < best) { best = d; y = math.lerp(m.Smp[j].RoadY, m.Smp[j + 1].RoadY, (float)t); s = math.lerp(m.Smp[j].S, m.Smp[j + 1].S, (float)t); }
            }
            return y;
        }

        /// <summary>A side road meeting the main road's edge at less than ~32° merges along it: no mouth.</summary>
        const double MergeCos = 0.85;

        /// <summary>Flare stations before a mouth's end station, as fractions of the corner radius back from the main road's edge.</summary>
        static readonly float[] FlareAt = { 1f, 0.6f, 0.3f, 0.12f };

        /// <summary>The run's stations: its samples, plus each mouth's end station and the flare stations before it.</summary>
        static void Stations(Strip st, List<Station> output)
        {
            output.Clear();
            var s = st.Smp;
            var extra = new List<Station>();
            if (st.Cuts != null)
                foreach (var (sx, end, r, coveredAfter, edgeIn, into) in st.Cuts)
                {
                    extra.Add(end);
                    // Flare stations back from the edge (S decreasing when the road runs into the main road).
                    if (r >= 0.5f) foreach (var f in FlareAt)
                    {
                        float at = coveredAfter ? sx - r * f : sx + r * f;
                        if (!IsDrawn(st.Drawn, coveredAfter ? at + 0.01f : at - 0.01f)) continue;
                        var q = Interp(st, at);
                        float d = r * f;
                        q.Flare = r - math.sqrt(math.max(0f, d * (2 * r - d)));
                        q.Clip = true; q.EdgeP = end.P; q.EdgeIn = edgeIn; q.Into = into;
                        extra.Add(q);
                    }
                }
            int e = 0;
            extra.Sort((a, b) => a.S.CompareTo(b.S));
            bool ascending = s[s.Count - 1].S >= s[0].S;
            for (int i = 0; i < s.Count; i++)
            {
                if (ascending) while (e < extra.Count && extra[e].S < s[i].S - 1e-4f) output.Add(extra[e++]);
                // A sample inside a flare (between a flare station and the end) keeps its place but takes the flare there.
                var q = new Station { P = s[i].P, N = st.N[i], Scale = st.Scale[i], Y = s[i].RoadY, S = s[i].S, Inside = Tunnels.InsideWeight(s[i], st.Line.WayLength) };
                if (st.Cuts != null)
                    foreach (var (sx, end, r, coveredAfter, edgeIn, into) in st.Cuts)
                    {
                        float d = coveredAfter ? sx - q.S : q.S - sx;
                        if (d > 0 && d < r) { q.Flare = math.max(q.Flare, r - math.sqrt(math.max(0f, d * (2 * r - d)))); q.Clip = true; q.EdgeP = end.P; q.EdgeIn = edgeIn; q.Into = into; }
                    }
                output.Add(q);
            }
            while (e < extra.Count) output.Add(extra[e++]);
            if (!ascending) output.Sort((a, b) => a.S.CompareTo(b.S));
        }

        static Station Interp(Strip st, float at)
        {
            var s = st.Smp;
            for (int i = 0; i + 1 < s.Count; i++)
            {
                if (at < s[i].S || at > s[i + 1].S) continue;
                float d = s[i + 1].S - s[i].S, t = d > 1e-6f ? (at - s[i].S) / d : 0;
                var dir = math.normalizesafe(s[i + 1].P - s[i].P, new double2(1, 0));
                return new Station
                {
                    P = math.lerp(s[i].P, s[i + 1].P, t), N = new double2(-dir.y, dir.x), Scale = 1, Y = math.lerp(s[i].RoadY, s[i + 1].RoadY, t), S = at,
                    Inside = math.lerp(Tunnels.InsideWeight(s[i], st.Line.WayLength), Tunnels.InsideWeight(s[i + 1], st.Line.WayLength), t),
                };
            }
            var last = s[s.Count - 1];
            return new Station { P = last.P, N = st.N[s.Count - 1], Scale = 1, Y = last.RoadY, S = at };
        }
    }
}
