using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Gameplay;
using Rally.Geo;
using Rally.Roads;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Tests.World
{
    /// <summary>
    /// "The streets are still badly joined. Make sure lines etc are properly connected" (2026-11-22; the join survey,
    /// PreviewShots -previewContinuity, joins.txt). Each way was smoothed alone with its ends on its last OSM edge, and each
    /// run's ribbon ended square to its own last segment: two ways joined in a bend met at the OSM corner with a wedge open on
    /// the outside and two ribbons overlapping on the inside, edge lines crossing. The centre dashes restarted at every way.
    /// A side road's ribbon ran 0–5 m into the main road (coplanar: z-fight, its lines over the main road's) and the main
    /// road's edge line was painted across the mouth.
    /// </summary>
    public class RoadJoinTests
    {
        static float Flat(Utm33 p) => 100f;
        static readonly TileKey Key = new TileKey(TileKind.Coarse, 0, 0);

        static RoadWay Way(long id, string kind, params double[] en)
        {
            var w = new RoadWay { Id = id };
            w.Tags["highway"] = kind;
            w.Tags["surface"] = "asphalt";
            for (int i = 0; i + 1 < en.Length; i += 2) w.Nodes.Add(new Utm33(en[i], en[i + 1]));
            return w;
        }

        static RoadGraphData Data(params RoadWay[] ways) { var d = new RoadGraphData(); d.Ways.AddRange(ways); return d; }

        struct Surface { public float Y, U, V, MouthNeg, MouthPos; }

        /// <summary>
        /// Every ribbon surface drawn over the point (a point on an edge two triangles share counts once). Rally/Road leaves out
        /// a road's shoulder and skirt in a junction mouth on that side (|UV2| &lt; RibbonMesh.MouthKeep): not drawn.
        /// </summary>
        static List<Surface> At(Mesh m, Utm33 origin, double2 p)
        {
            var v = m.vertices; var t = m.triangles; var uv = m.uv;
            var uv2 = new List<Vector2>(); m.GetUVs(2, uv2);
            var uv1 = new List<Vector2>(); m.GetUVs(1, uv1);
            var list = new List<Surface>();
            for (int i = 0; i < t.Length; i += 3)
            {
                double2 a = new double2(origin.E + v[t[i]].x, origin.N + v[t[i]].z), b = new double2(origin.E + v[t[i + 1]].x, origin.N + v[t[i + 1]].z), c = new double2(origin.E + v[t[i + 2]].x, origin.N + v[t[i + 2]].z);
                double2 v0 = b - a, v1 = c - a, v2 = p - a;
                double den = v0.x * v1.y - v1.x * v0.y;
                if (math.abs(den) < 1e-12) continue;
                double w1 = (v2.x * v1.y - v1.x * v2.y) / den, w2 = (v0.x * v2.y - v2.x * v0.y) / den, w0 = 1 - w1 - w2;
                if (w0 < -1e-7 || w1 < -1e-7 || w2 < -1e-7) continue;
                float f0 = (float)w0, f1 = (float)w1, f2 = (float)w2;
                var s = new Surface
                {
                    Y = v[t[i]].y * f0 + v[t[i + 1]].y * f1 + v[t[i + 2]].y * f2,
                    U = uv[t[i]].x * f0 + uv[t[i + 1]].x * f1 + uv[t[i + 2]].x * f2,
                    V = uv[t[i]].y * f0 + uv[t[i + 1]].y * f1 + uv[t[i + 2]].y * f2,
                    MouthNeg = uv2.Count > 0 ? uv2[t[i]].x * f0 + uv2[t[i + 1]].x * f1 + uv2[t[i + 2]].x * f2 : RibbonMesh.NoMouth,
                    MouthPos = uv2.Count > 0 ? uv2[t[i]].y * f0 + uv2[t[i + 1]].y * f1 + uv2[t[i + 2]].y * f2 : RibbonMesh.NoMouth,
                };
                float half = uv1[t[i]].x, e = math.abs((s.U - 0.5f) * 2 * half) - half;
                if ((s.U < 0 || s.U > 1) && math.abs(s.U < 0.5f ? s.MouthNeg : s.MouthPos) < RibbonMesh.MouthKeep(e)) continue;
                bool same = false;
                foreach (var o in list) if (math.abs(o.Y - s.Y) < 1e-3f && math.abs(o.U - s.U) < 1e-3f && math.abs(o.V - s.V) < 1e-3f) same = true;
                if (!same) list.Add(s);
            }
            return list;
        }

        // ---- Two ways end to end in a bend --------------------------------------------------------------------

        /// <summary>A two-lane road bending 40° at the node where one OSM way ends and the next begins (nodes every 10 m).</summary>
        static RoadGraphData Bend(out double2 joint, out double2 dirIn, out double2 dirOut)
        {
            joint = new double2(500, 500);
            dirIn = new double2(1, 0);
            dirOut = new double2(math.cos(math.radians(40)), math.sin(math.radians(40)));
            var a = new List<double>(); var b = new List<double>();
            for (int i = 10; i >= 0; i--) { var p = joint - dirIn * (i * 10); a.Add(p.x); a.Add(p.y); }
            for (int i = 0; i <= 10; i++) { var p = joint + dirOut * (i * 10); b.Add(p.x); b.Add(p.y); }
            return Data(Way(1, "secondary", a.ToArray()), Way(2, "secondary", b.ToArray()));
        }

        [Test]
        public void TwoWaysInABend_OneSurfaceAcrossTheJoint_NoWedgeNoOverlap()
        {
            var lines = new RoadGraph().SetTile(Key, Bend(out var j, out var din, out var dout), Flat);
            var mesh = RibbonMesh.Build(lines, Key.Origin);
            try
            {
                // Across the whole width (shoulders too), 2 m either side of the joint along the bisector: one surface everywhere.
                var t = math.normalize(din + dout); var n = new double2(-t.y, t.x);
                float outer = RoadConstants.TwoLaneHalf + RoadConstants.RoadShoulder - 0.3f;
                int miss = 0, twice = 0;
                for (double x = -1; x <= 1; x += 0.1)
                    for (double o = -outer; o <= outer; o += 0.25)
                    {
                        int c = At(mesh, Key.Origin, j + t * x + n * o).Count;
                        if (c == 0) miss++; else if (c > 1) twice++;
                    }
                Assert.AreEqual(0, miss, "no wedge open on the outside of the bend");
                Assert.AreEqual(0, twice, "no two ribbons over each other on the inside");
            }
            finally { Object.DestroyImmediate(mesh); }
        }

        [Test]
        public void TwoWaysInABend_SmoothedTogether_NoCornerAtTheJoint()
        {
            var lines = new RoadGraph().SetTile(Key, Bend(out var j, out _, out _), Flat);
            RoadPolyline a = lines.Find(l => l.Id == 1), b = lines.Find(l => l.Id == 2);
            var sa = a.Samples; var sb = b.Samples;
            Assert.Less(math.distance(sa[sa.Count - 1].P, j), 1e-6, "the first way still ends on the node");
            Assert.Less(math.distance(sb[0].P, j), 1e-6, "the second way still starts on it");
            float Turn(double2 a, double2 b, double2 c) => math.degrees((float)math.acos(math.clamp(math.dot(math.normalize(b - a), math.normalize(c - b)), -1, 1)));
            float atJoint = Turn(sa[sa.Count - 2].P, j, sb[1].P);
            float around = 0;
            for (int i = math.max(1, sa.Count - 4); i < sa.Count - 1; i++) around = math.max(around, Turn(sa[i - 1].P, sa[i].P, sa[i + 1].P));
            for (int i = 1; i < math.min(sb.Count - 1, 4); i++) around = math.max(around, Turn(sb[i - 1].P, sb[i].P, sb[i + 1].P));
            Assert.Less(atJoint, 30f, "the 40° OSM corner is not kept at the joint (each way was smoothed alone, its end on its last OSM edge)");
            Assert.Greater(around, 3f, $"the turn is spread over the curve on both sides ({atJoint:0.0}° at the joint, {around:0.0}° next to it)");
        }

        // ---- Centre dashes across a join -----------------------------------------------------------------------

        [TestCase(false)]
        [TestCase(true)]
        public void CentreDashes_CentredOnEveryWayEnd(bool secondReversed)
        {
            // 107 m and 83 m: neither a whole number of 12 m dash periods.
            var a = Way(1, "secondary", 0, 300, 107, 300);
            var b = secondReversed ? Way(2, "secondary", 190, 300, 107, 300) : Way(2, "secondary", 107, 300, 190, 300);
            var lines = new RoadGraph().SetTile(Key, Data(a, b), Flat);
            var mesh = RibbonMesh.Build(lines, Key.Origin);
            try
            {
                // The along coordinate (v·4) at the joint, seen from either side, is a dash centre (DashShift into a dash period).
                foreach (var x in new[] { 106.95, 107.05 })
                {
                    var s = At(mesh, Key.Origin, new double2(x, 300));
                    Assert.AreEqual(1, s.Count);
                    float along = s[0].V * 4, phase = math.frac(along / RibbonMesh.DashPeriod);
                    Assert.Less(math.min(phase, 1 - phase) * RibbonMesh.DashPeriod, 0.2f, $"a dash centre at the joint ({x}: along {along:0.00})");
                }
                // And each way's pattern keeps close to 12 m (whole periods over its length).
                Assert.AreEqual(RibbonMesh.DashPeriod * 9 / 107f, RibbonMesh.AlongScale(107), 1e-4);
            }
            finally { Object.DestroyImmediate(mesh); }
        }

        // ---- Grading: the ways that took a way's height, from an index --------------------------------------------

        [Test]
        public void AWayGradedAgain_ItsFollowersFollow_AlsoAfterTheirTileWasDroppedAndSetAgain()
        {
            // RoadGraph found the ways that took a way's height by scanning every graded way for every way graded (2.8 s of the
            // 5 s of grading Lillehammer's 38 tiles); now an index kept as ways are graded, graded again and dropped.
            static float Hill(Utm33 p) => (float)(400 + 250 * math.sin(p.N / 1000) + 10 * math.sin(p.E / 300));
            static RoadWay Line(long id, double n0, double n1)
            {
                var w = new RoadWay { Id = id }; w.Tags["highway"] = "unclassified";
                for (double n = n0; n <= n1 + 1e-6; n += 20) w.Nodes.Add(new Utm33(1000, n));
                return w;
            }
            var w1 = Line(1, 100, 3000); var w2 = Line(2, 3000, 6000);
            bool northIn = false;
            bool Known(Utm33 p) => p.N < 2900 || northIn;
            var g = new RoadGraph();
            TileKey t0 = new TileKey(TileKind.Coarse, 0, 0), t1 = new TileKey(TileKind.Coarse, 0, 1), t2 = new TileKey(TileKind.Coarse, 0, 2);
            g.SetTile(t0, Data(w1), Hill, null, null, Known);
            g.SetTile(t2, Data(w2), Hill, null, null, Known);      // way 2 takes way 1's height at their node
            g.RemoveTile(t2);                                       // dropped …
            g.SetTile(t2, Data(w2), Hill, null, null, Known);      // … and graded again: taken from way 1 again
            northIn = true;
            g.SetTile(t1, Data(w1, w2), Hill, null, null, Known);  // way 1 graded again: way 2 must follow
            foreach (var d in g.TakeDirtyTiles()) g.Rebuild(d);
            foreach (var d in g.TakeDirtyTiles()) g.Rebuild(d);
            Assert.IsTrue(g.Nearest(new Utm33(1000, 2998.5), 3, out var a));
            Assert.IsTrue(g.Nearest(new Utm33(1000, 3001.5), 3, out var b));
            Assert.AreEqual(a.RoadY, b.RoadY, 1.0, $"one height at the node after the regrade ({a.RoadY:0.0} / {b.RoadY:0.0})");
        }

        [Test]
        public void WhileOtherTilesRoadsWait_SignsAndLightsWaitToo()
        {
            // Placing a town tile's signs took 0.1–0.7 s, in the start area's critical path (the car's tile shows its roads once
            // its 8 neighbours' are drawn): signs, lights, houses and forest go after the other tiles' roads.
            var later = GameController.AfterOtherRoads(OverlayData.Features | OverlayData.Signs, OverlayData.Signs | OverlayData.Lights);
            Assert.AreEqual(OverlayData.Features | OverlayData.Signs | OverlayData.Lights, later);
            Assert.AreEqual(OverlayData.None, GameController.AfterOtherRoads(OverlayData.Roads | OverlayData.Surfaces, OverlayData.None) & (OverlayData.Roads | OverlayData.Surfaces), "the roads never wait");
        }

        // ---- A side road meeting a main road -------------------------------------------------------------------

        /// <summary>A two-lane main road west–east and a residential road from the north ending on it at a shared node.</summary>
        static List<RoadPolyline> Tee(out RoadGraph g)
        {
            var main = Way(1, "secondary", 300, 500, 400, 500, 500, 500, 600, 500, 700, 500);
            var side = Way(2, "residential", 500, 600, 500, 550, 500, 500);
            g = new RoadGraph();
            return g.SetTile(Key, Data(main, side), Flat);
        }

        [Test]
        public void SideRoad_EndsOnTheMainRoadsEdge_NoOverlapNoGap()
        {
            var lines = Tee(out _);
            var mesh = RibbonMesh.Build(lines, Key.Origin);
            try
            {
                float halfM = RoadConstants.TwoLaneHalf, halfS = RoadConstants.OneLaneHalf;
                // Inside the main road's carriageway, across the side road's width: only the main road's surface.
                for (double y = 500 - halfM + 0.1; y <= 500 + halfM - 0.05; y += 0.1)
                    for (double x = 500 - halfS; x <= 500 + halfS; x += 0.25)
                        Assert.AreEqual(1, At(mesh, Key.Origin, new double2(x, y)).Count, $"one surface at {x:0.00}, {y:0.00}");
                // From the main road's edge out along the side road: drawn, one surface, no gap.
                for (double y = 500 + halfM + 0.02; y <= 500 + halfM + 12; y += 0.1)
                    for (double x = 500 - halfS + 0.1; x <= 500 + halfS - 0.1; x += 0.5)
                        Assert.AreEqual(1, At(mesh, Key.Origin, new double2(x, y)).Count, $"the side road at {x:0.00}, {y:0.00}");
            }
            finally { Object.DestroyImmediate(mesh); }
        }

        [Test]
        public void SideRoad_FlaresToTheCornerRadius_AndTheMainRoadsEdgeLineBreaks()
        {
            var lines = Tee(out _);
            var mesh = RibbonMesh.Build(lines, Key.Origin);
            try
            {
                float halfM = RoadConstants.TwoLaneHalf, halfS = RoadConstants.OneLaneHalf, r = RibbonMesh.MouthRadius("residential");
                // Just outside the main road's edge, the side road's carriageway is about r wider on each side (the kerb radius).
                double y = 500 + halfM + 0.05;
                Assert.AreEqual(1, At(mesh, Key.Origin, new double2(500 + halfS + r * 0.8, y)).Count, "the flare reaches out towards the radius");
                Assert.AreEqual(1, At(mesh, Key.Origin, new double2(500 - halfS - r * 0.8, y)).Count);
                // The main road's edge line (u side of the mouth): broken over the mouth, painted away from it; never on the far side.
                var mouth = At(mesh, Key.Origin, new double2(500, 500 + halfM - 0.35));
                Assert.AreEqual(1, mouth.Count);
                var s = mouth[0];
                float m = s.U < 0.5f ? s.MouthNeg : s.MouthPos, other = s.U < 0.5f ? s.MouthPos : s.MouthNeg;
                Assert.Less(math.abs(m), 1f, "the edge line on the side road's side is broken across the mouth");
                Assert.GreaterOrEqual(math.abs(other), 1f, "the other edge line goes on");
                var away = At(mesh, Key.Origin, new double2(530, 500 + halfM - 0.35))[0];
                Assert.GreaterOrEqual(math.abs(away.U < 0.5f ? away.MouthNeg : away.MouthPos), 1f, "30 m on the edge line is painted again");
            }
            finally { Object.DestroyImmediate(mesh); }
        }

        [Test]
        public void SideRoadCrossingTheMainRoad_TwoMouths_NotDrawnOverTheMainRoad()
        {
            var main = Way(1, "primary", 300, 500, 400, 500, 500, 500, 600, 500, 700, 500);
            var cross = Way(2, "residential", 500, 400, 500, 450, 500, 500, 500, 550, 500, 600);
            var lines = new RoadGraph().SetTile(Key, Data(main, cross), Flat);
            var mesh = RibbonMesh.Build(lines, Key.Origin);
            try
            {
                float halfM = RoadConstants.TwoLaneHalf;
                for (double y = 500 - halfM + 0.1; y <= 500 + halfM - 0.1; y += 0.2)
                {
                    var at = At(mesh, Key.Origin, new double2(500, y));
                    var cr = lines.Find(l => l.Id == 2);
                    Assert.AreEqual(1, at.Count, $"one surface on the main road at {y:0.0}: " + string.Join(" ", at.ConvertAll(q => $"[u {q.U:0.000} v {q.V:0.00} y {q.Y:0.00}]"))
                        + " crossing samples: " + string.Join(" ", cr.Samples.FindAll(q => q.P.y > 485 && q.P.y < 515).ConvertAll(q => $"{q.P.y:0.0}{(q.Covered ? "C" : "")}")));
                }
                Assert.AreEqual(1, At(mesh, Key.Origin, new double2(500, 500 + halfM + 1)).Count, "the crossing road north of the mouth");
                Assert.AreEqual(1, At(mesh, Key.Origin, new double2(500, 500 - halfM - 1)).Count, "and south of it");
            }
            finally { Object.DestroyImmediate(mesh); }
        }
    }
}
