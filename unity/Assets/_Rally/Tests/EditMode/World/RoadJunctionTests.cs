using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;
using static Rally.Tests.World.RoadJoinTests;

namespace Rally.Tests.World
{
    /// <summary>
    /// "Join roads smoothly at crossings", P1 (plan_20261122_smooth_crossings): the junction table from the shared OSM nodes
    /// (<see cref="RoadJunctions"/>) and mouths cut from it. A side road's mouth used to be found only where grading had marked it
    /// covered by a road that outranks it: a side road graded before its main road (another tile), a main road split at the node,
    /// a split side street crossing the main road (each half "goes on" in the other) ran on into the main road, two coplanar surfaces
    /// (z-fight; 5 758 of 8 146 mouths in Lillehammer). And the main road's shoulder at a mouth was left out by an approximate taper in
    /// the shader; now its shoulder and skirt are not drawn between the side road's corners, which it shares exactly.
    /// </summary>
    public class RoadJunctionTests
    {
        static float Flat(Utm33 p) => 100f;
        static readonly TileKey Key = new TileKey(TileKind.Coarse, 0, 0);
        const float HalfM = RoadConstants.TwoLaneHalf, HalfS = RoadConstants.OneLaneHalf, Sh = RoadConstants.RoadShoulder;
        /// <summary>Probe grids are offset by this, off the row lines two strips share.</summary>
        const double Off = 0.0371;

        static RoadWay Way(long id, string kind, params double[] en)
        {
            var w = new RoadWay { Id = id };
            w.Tags["highway"] = kind;
            w.Tags["surface"] = "asphalt";
            for (int i = 0; i + 1 < en.Length; i += 2) w.Nodes.Add(new Utm33(en[i], en[i + 1]));
            return w;
        }

        static RoadGraphData Data(params RoadWay[] ways) { var d = new RoadGraphData(); d.Ways.AddRange(ways); return d; }

        /// <summary>Grading's covered marks off (the side road graded before its main road came in, in another tile).</summary>
        static void Uncover(List<RoadPolyline> lines)
        {
            foreach (var l in lines) { var s = l.Samples; for (int i = 0; i < s.Count; i++) { var q = s[i]; q.Covered = false; s[i] = q; } }
        }

        /// <summary>A side road from the north at <paramref name="deg"/>° to the main road, its end at (500, 500) on a secondary road west–east
        /// (one way through the node, or two ways ending there).</summary>
        static RoadGraphData Tee(bool splitMain, double deg)
        {
            var d = new double2(math.cos(math.radians(deg)), math.sin(math.radians(deg)));
            var far = new double2(500, 500) + d * 100; var mid = new double2(500, 500) + d * 50;
            var side = Way(9, "residential", far.x, far.y, mid.x, mid.y, 500, 500);
            if (!splitMain) return Data(Way(1, "secondary", 300, 500, 400, 500, 500, 500, 600, 500, 700, 500), side);
            return Data(Way(1, "secondary", 300, 500, 400, 500, 500, 500), Way(2, "secondary", 500, 500, 600, 500, 650, 500), side);
        }

        /// <summary>
        /// Across the mouth: one surface everywhere inside the main road's carriageway over the side road's width, on the main road's
        /// shoulder band between and beyond the side road's corners (no hole where the shoulder is left out, no shoulder under the
        /// side road), and along the side road out to 12 m.
        /// </summary>
        static void AssertOneSurface(Mesh[] meshes, TileKey[] keys, double deg, string what, double cx = 500, double cy = 500)
        {
            int Count(double2 p) { int c = 0; for (int i = 0; i < meshes.Length; i++) if (meshes[i] != null) c += At(meshes[i], keys[i].Origin, p).Count; return c; }
            var bad = new List<string>();
            var d = new double2(math.cos(math.radians(deg)), math.sin(math.radians(deg)));
            double reach = (HalfS + Sh + RibbonMesh.MouthRadius("residential")) / math.max(0.5, d.y) + 4;
            // The main road's carriageway and shoulder band, ±reach along it around the mouth.
            // Probes off the shared row lines (a point exactly on the edge two strips share is on both).
            for (double y = -HalfM + 0.1 + Off; y <= HalfM + Sh - 0.1; y += 0.2)
                for (double x = -reach + Off; x <= reach; x += 0.25)
                {
                    int c = Count(new double2(cx + x, cy + y));
                    if (c != 1) bad.Add($"{c}@({x:0.00}, {y:0.00})");
                }
            // Out along the side road past the shoulder band.
            var n = new double2(-d.y, d.x);
            for (double t = (HalfM + Sh + 0.1) / d.y + Off; t <= 12 + HalfM / d.y; t += 0.2)
                for (double o = -HalfS + 0.1 + Off; o <= HalfS - 0.1; o += 0.5)
                {
                    var p = d * t + n * o;
                    int c = Count(new double2(cx, cy) + p);
                    if (c != 1) bad.Add($"side {c}@({p.x:0.00}, {p.y:0.00})");
                }
            Assert.IsEmpty(bad, $"{what}: one surface across the mouth ({bad.Count} points, first {string.Join(" ", bad.GetRange(0, math.min(12, bad.Count)))})");
        }

        [TestCase(false, 90.0)]
        [TestCase(false, 65.0)]
        [TestCase(true, 90.0)]
        [TestCase(true, 65.0)]
        public void Tee_SideRoadEndsOnTheEdge_OneSurfaceAcrossTheMouth(bool splitMain, double deg)
        {
            var lines = new RoadGraph().SetTile(Key, Tee(splitMain, deg), Flat);
            Uncover(lines);   // the mouth comes from the shared node, not from grading's covered marks
            var js = RoadJunctions.Find(lines, null);
            Assert.AreEqual(1, js.Count);
            Assert.AreEqual(JunctionKind.Priority, js[0].Kind, js[0].Reason);
            Assert.AreEqual(3, js[0].Arms.Count);
            Assert.AreEqual(2, js[0].Arms.FindAll(a => a.Through && a.Class == 2).Count, "the secondary road is the through pair");
            var mesh = RibbonMesh.Build(lines, Key.Origin);
            try { AssertOneSurface(new[] { mesh }, new[] { Key }, deg, splitMain ? "main road split at the node" : "main road through the node"); }
            finally { Object.DestroyImmediate(mesh); }
        }

        [Test]
        public void Tee_MainRoadsEdgeLineBreaksOnlyBetweenTheCorners()
        {
            var lines = new RoadGraph().SetTile(Key, Tee(true, 90), Flat);
            var mesh = RibbonMesh.Build(lines, Key.Origin);
            try
            {
                float corner = HalfS + Sh + RibbonMesh.MouthRadius("residential");
                foreach (var dx in new[] { -corner - 0.5, -corner + 0.5, -1.0, 1.0, corner - 0.5, corner + 0.5 })
                {
                    var at = At(mesh, Key.Origin, new double2(500 + dx, 500 + HalfM - 0.35));
                    Assert.AreEqual(1, at.Count, $"one surface on the edge line at {dx}");
                    float m = at[0].U < 0.5f ? at[0].MouthNeg : at[0].MouthPos;
                    if (math.abs(dx) < corner) Assert.Less(math.abs(m), 1f, $"broken inside the mouth ({dx:0.0})");
                    else Assert.GreaterOrEqual(math.abs(m), 1f, $"painted past the corner ({dx:0.0})");
                }
                var far = At(mesh, Key.Origin, new double2(500, 500 - HalfM + 0.35));
                Assert.GreaterOrEqual(math.abs(far[0].U < 0.5f ? far[0].MouthNeg : far[0].MouthPos), 1f, "the far edge line goes on");
            }
            finally { Object.DestroyImmediate(mesh); }
        }

        /// <summary>
        /// A residential street split into two ways at the node crossing a secondary road: each half "went on" in the other, so neither
        /// was cut, and with grading's marks off both ran on over the main road (two surfaces across its whole carriageway).
        /// </summary>
        [Test]
        public void SplitStreetCrossingAMainRoad_BothHalvesEndOnItsEdges()
        {
            var data = Data(Way(1, "secondary", 300, 500, 400, 500, 500, 500, 600, 500, 700, 500),
                Way(8, "residential", 500, 400, 500, 450, 500, 500), Way(9, "residential", 500, 500, 500, 550, 500, 600));
            var lines = new RoadGraph().SetTile(Key, data, Flat);
            Uncover(lines);
            var js = RoadJunctions.Find(lines, null);
            Assert.AreEqual(JunctionKind.Priority, js[0].Kind, js[0].Reason);
            Assert.AreEqual(4, js[0].Arms.Count);
            var mesh = RibbonMesh.Build(lines, Key.Origin);
            try
            {
                var bad = new List<string>();
                for (double y = 500 - HalfM - Sh + 0.1 + Off; y <= 500 + HalfM + Sh - 0.1; y += 0.2)
                    for (double x = 500 - 6 + Off; x <= 500 + 6; x += 0.25)
                    {
                        int c = At(mesh, Key.Origin, new double2(x, y)).Count;
                        if (c != 1) bad.Add($"{c}@({x - 500:0.00}, {y - 500:0.00})");
                    }
                foreach (var y in new[] { 500 - HalfM - Sh - 3, 500 + HalfM + Sh + 3 })
                    if (At(mesh, Key.Origin, new double2(500, y)).Count != 1) bad.Add($"street at {y - 500}");
                Assert.IsEmpty(bad, $"one surface over the crossing ({bad.Count}: {string.Join(" ", bad.GetRange(0, math.min(12, bad.Count)))})");
            }
            finally { Object.DestroyImmediate(mesh); }
        }

        /// <summary>
        /// Two residential streets crossing, each split into two ways at the node (the Drammen case): the street with the longer way
        /// goes through, the other's halves end on its edges. Both used to be drawn through (two surfaces in the middle), and a rule that
        /// cut every arm back left the middle bare.
        /// </summary>
        [Test]
        public void CrossingOfSplitStreets_OneStreetThrough_OneSurfaceNoHole()
        {
            var data = Data(Way(1, "residential", 300, 500, 400, 500, 500, 500), Way(2, "residential", 500, 500, 600, 500, 650, 500),
                Way(3, "residential", 500, 200, 500, 350, 500, 500), Way(4, "residential", 500, 500, 500, 620, 500, 750));
            var lines = new RoadGraph().SetTile(Key, data, Flat);
            Uncover(lines);
            var js = RoadJunctions.Find(lines, null);
            Assert.AreEqual(JunctionKind.Priority, js[0].Kind, js[0].Reason);
            var through = js[0].Arms.FindAll(a => a.Through);
            Assert.AreEqual(2, through.Count);
            Assert.IsTrue(through.TrueForAll(a => a.Way == 3 || a.Way == 4), "the street with the longest way (3, 300 m) is the through road");
            var mesh = RibbonMesh.Build(lines, Key.Origin);
            try
            {
                var bad = new List<string>();
                float h = HalfS - 0.1f;
                for (double a = -10 + Off; a <= 10; a += 0.25)
                    for (double b = -h + Off; b <= h; b += 0.25)
                    {
                        int c1 = At(mesh, Key.Origin, new double2(500 + a, 500 + b)).Count, c2 = At(mesh, Key.Origin, new double2(500 + b, 500 + a)).Count;
                        if (c1 != 1) bad.Add($"{c1}@({a:0.00}, {b:0.00})");
                        if (c2 != 1) bad.Add($"{c2}@({b:0.00}, {a:0.00})");
                    }
                Assert.IsEmpty(bad, $"one surface on both streets through the crossing ({bad.Count}: {string.Join(" ", bad.GetRange(0, math.min(12, bad.Count)))})");
            }
            finally { Object.DestroyImmediate(mesh); }
        }

        /// <summary>The T 3 m west of a tile border, built by both tiles: the same junction in both tables, and one surface over the union.</summary>
        [Test]
        public void TeeNearATileBorder_BothTilesCutTheSame_OneSurfaceOverTheUnion()
        {
            var west = new TileKey(TileKind.Coarse, 2, 3); var east = new TileKey(TileKind.Coarse, 3, 3);
            double bx = east.Origin.E - 3, by = west.Origin.N + 1000, dx = bx - 500, dy = by - 500;
            var src = Tee(true, 65);
            foreach (var w in src.Ways) for (int i = 0; i < w.Nodes.Count; i++) w.Nodes[i] = new Utm33(w.Nodes[i].E + dx, w.Nodes[i].N + dy);
            var roads = new RoadGraph();
            var lw = roads.SetTile(west, src, Flat); var le = roads.SetTile(east, src, Flat);
            Uncover(lw); Uncover(le);
            RoadJunction jw = RoadJunctions.Find(lw, west.Bounds).Find(j => j.Kind == JunctionKind.Priority), je = RoadJunctions.Find(le, east.Bounds).Find(j => j.Kind == JunctionKind.Priority);
            Assert.IsNotNull(jw); Assert.IsNotNull(je);
            Assert.AreEqual(jw.Key, je.Key);
            Assert.AreEqual(jw.Arms.Count, je.Arms.Count);
            for (int i = 0; i < jw.Arms.Count; i++)
            {
                Assert.AreEqual(jw.Arms[i].Way, je.Arms[i].Way); Assert.AreEqual(jw.Arms[i].Through, je.Arms[i].Through);
                Assert.AreEqual(jw.Arms[i].Dir.x, je.Arms[i].Dir.x, 1e-9); Assert.AreEqual(jw.Arms[i].Dir.y, je.Arms[i].Dir.y, 1e-9);
            }
            var mw = RibbonMesh.Build(lw, west.Origin, west.Bounds); var me = RibbonMesh.Build(le, east.Origin, east.Bounds);
            try
            {
                AssertOneSurface(new[] { mw, me }, new[] { west, east }, 65, "a T 3 m from a tile border", bx, by);
            }
            finally { Object.DestroyImmediate(mw); Object.DestroyImmediate(me); }
        }

        /// <summary>
        /// A side road entering at 40° whose first OSM way ends 13 m out (past the shoulder line, 10.5 m), joined there to the next way: the cut's flare would start past
        /// that joint, so the joint's end sample was dropped between the cut's stations and a gap opened across the road at the joint
        /// (live survey: joint gaps 65 → 81 in Lillehammer). Such a node is left to the old mouths.
        /// </summary>
        [Test]
        public void ShortSideWayJoinedInsideItsCut_NoGapAtTheJoint()
        {
            var d = new double2(math.cos(math.radians(40)), math.sin(math.radians(40)));
            var joint = new double2(500, 500) + d * 13; var far = new double2(500, 500) + d * 80;
            var data = Data(Way(1, "secondary", 300, 500, 400, 500, 500, 500, 600, 500, 700, 500),
                Way(8, "residential", joint.x, joint.y, 500, 500), Way(9, "residential", far.x, far.y, joint.x, joint.y));
            var lines = new RoadGraph().SetTile(Key, data, Flat);
            var mesh = RibbonMesh.Build(lines, Key.Origin);
            try
            {
                var n = new double2(-d.y, d.x);
                var bad = new List<string>();
                for (double t = -1.5 + Off; t <= 1.5; t += 0.1)
                    for (double o = -HalfS + 0.15; o <= HalfS - 0.15; o += 0.5)
                        if (At(mesh, Key.Origin, joint + d * t + n * o).Count == 0) bad.Add($"({t:0.00}, {o:0.00})");
                Assert.IsEmpty(bad, "the side road is drawn across its joint");
            }
            finally { Object.DestroyImmediate(mesh); }
        }

        // ---- Fallbacks: built exactly as without the junction table ---------------------------------------------------------

        static void AssertSameAsWithoutTable(List<RoadPolyline> lines, string reason)
        {
            var js = RoadJunctions.Find(lines, null);
            Assert.IsTrue(js.Exists(j => j.Kind == JunctionKind.Fallback && j.Reason == reason), $"a Fallback node ({reason}): " + string.Join(", ", js.ConvertAll(j => $"{j.Kind} {j.Reason}")));
            Assert.IsFalse(js.Exists(j => j.Kind == JunctionKind.Priority));
            var bare = lines.ConvertAll(l => new RoadPolyline { Id = l.Id, Name = l.Name, Kind = l.Kind, Lanes = l.Lanes, Paved = l.Paved, Samples = l.Samples, Length = l.Length, WayLength = l.WayLength });
            var a = RibbonMesh.Build(lines, Key.Origin); var b = RibbonMesh.Build(bare, Key.Origin);
            try
            {
                CollectionAssert.AreEqual(b.vertices, a.vertices, "the same vertices as without the junction table");
                CollectionAssert.AreEqual(b.triangles, a.triangles, "the same triangles");
            }
            finally { Object.DestroyImmediate(a); Object.DestroyImmediate(b); }
        }

        [Test]
        public void Fallback_SevenArms_BuiltAsBefore()
        {
            var ways = new List<RoadWay>();
            for (int k = 0; k < 7; k++)
            {
                double a = k * 2 * math.PI / 7;
                ways.Add(Way(10 + k, "residential", 500 + 80 * math.cos(a), 500 + 80 * math.sin(a), 500 + 40 * math.cos(a), 500 + 40 * math.sin(a), 500, 500));
            }
            AssertSameAsWithoutTable(new RoadGraph().SetTile(Key, Data(ways.ToArray()), Flat), "more than 6 arms");
        }

        [Test]
        public void Fallback_MainRoadOnABridge_BuiltAsBefore()
        {
            var data = Tee(false, 90);
            data.Ways[0].Tags["bridge"] = "yes";
            AssertSameAsWithoutTable(new RoadGraph().SetTile(Key, data, Flat), "bridge or tunnel");
        }

        [Test]
        public void Fallback_SideRoadOffTheMainRoadsHeight_BuiltAsBefore()
        {
            var lines = new RoadGraph().SetTile(Key, Tee(false, 90), Flat);
            var side = lines.Find(l => l.Id == 9).Samples;
            for (int i = 0; i < side.Count; i++) { var q = side[i]; q.RoadY += 0.8f; side[i] = q; }
            AssertSameAsWithoutTable(lines, "height step");
        }

        [Test]
        public void RunsCarryTheirSharedNodes_AtTheirS()
        {
            var lines = new RoadGraph().SetTile(Key, Tee(false, 90), Flat);
            var main = lines.Find(l => l.Id == 1); var side = lines.Find(l => l.Id == 9);
            Assert.AreEqual(1, main.Nodes.Count, "the main road shares one node");
            Assert.AreEqual(1, side.Nodes.Count);
            Assert.AreEqual(RoadGraph.NodeKey(new Utm33(500, 500)), main.Nodes[0].Key);
            Assert.AreEqual(side.WayLength, side.Nodes[0].S, 1e-3, "the side road's node is its end");
            var at = RoadJunctions.PointAt(main.Samples, main.Nodes[0].S);
            Assert.Less(math.distance(at, new double2(500, 500)), 0.02, "S of the node on the main road puts it on the node");
        }
    }
}
