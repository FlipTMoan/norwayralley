using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    /// <summary>
    /// Ways that meet at a shared OSM node meet at one height (plan J, review of C/G): at Sauda two ways joined end to end were
    /// graded 704.2 m and 723.7 m at their common node (DTM 714.7 m), a 20 m step every car stalled at, and a road ending on
    /// another 6 m off it. Causes: the grade's running mean shrank at a way's end and pulled the end towards the way's inside
    /// by the slope × the window; and the junction easing only saw roads registered near the junction, while a way is graded
    /// once, in the first tile that holds any of it — often one that holds none of the junction.
    /// </summary>
    public class WayJoinTests
    {
        /// <summary>A steep hillside rising north (up to 25 %), as at Sauda.</summary>
        static float Hill(Utm33 p) => (float)(400 + 250 * math.sin(p.N / 1000) + 10 * math.sin(p.E / 300));

        static RoadWay Line(long id, string kind, double e0, double n0, double e1, double n1, double step = 20)
        {
            var w = new RoadWay { Id = id };
            w.Tags["highway"] = kind;
            int k = (int)math.ceil(math.distance(new double2(e0, n0), new double2(e1, n1)) / step);
            for (int i = 0; i <= k; i++) w.Nodes.Add(new Utm33(math.lerp(e0, e1, i / (double)k), math.lerp(n0, n1, i / (double)k)));
            return w;
        }

        static RoadGraphData Data(params RoadWay[] ways) { var d = new RoadGraphData(); d.Ways.AddRange(ways); return d; }

        /// <summary>Graded heights a little before and after a point along a north-going line (each side its own way).</summary>
        static (float south, float north) Across(RoadGraph g, double e, double n, double off = 1.5)
        {
            Assert.IsTrue(g.Nearest(new Utm33(e, n - off), 3, out var a));
            Assert.IsTrue(g.Nearest(new Utm33(e, n + off), 3, out var b));
            return (a.RoadY, b.RoadY);
        }

        [TestCase("ABJ")]
        [TestCase("BAJ")]
        [TestCase("JAB")]
        [TestCase("AJB")]
        public void TwoWaysEndToEnd_GradedInTilesThatMissTheJunction_MeetAtOneHeight(string order)
        {
            // Way 1 from N 100 to N 3000, way 2 on from N 3000 to N 6000 (unclassified + service, as at Sauda).
            // Tile A (N 0–2048) holds only way 1's south part, tile B (N 4096–6144) only way 2's north part, tile J the junction.
            var w1 = Line(616529092, "unclassified", 1000, 100, 1000, 3000);
            var w2 = Line(616529632, "service", 1000, 3000, 1000, 6000);
            var tiles = new Dictionary<char, (TileKey key, RoadGraphData data)>
            {
                ['A'] = (new TileKey(TileKind.Coarse, 0, 0), Data(w1)),
                ['B'] = (new TileKey(TileKind.Coarse, 0, 2), Data(w2)),
                ['J'] = (new TileKey(TileKind.Coarse, 0, 1), Data(w1, w2)),
            };
            var g = new RoadGraph();
            foreach (char c in order) g.SetTile(tiles[c].key, tiles[c].data, Hill);
            var (s, n) = Across(g, 1000, 3000);
            float slope = (float)(250 * math.cos(3000 / 1000.0) / 1000);   // the hill's grade at the node
            Assert.AreEqual(s, n, math.abs(slope) * 3 + 0.1f, $"order {order}: {s:0.0} m south of the node, {n:0.0} m north of it");
            Assert.AreEqual(Hill(new Utm33(1000, 3000)), (s + n) / 2, 1.0, "and at the ground there, not 10 m above or below it");
        }

        [Test]
        public void RoadEndingOnAnother_GradedInATileThatMissesTheJunction_TakesItsHeight()
        {
            // A primary road east–west along N 3000 and a tertiary from the north ending on one of its nodes (E 1000).
            var main = Line(517168907, "primary", -1500, 3000, 3500, 3000);
            var side = Line(238636705, "tertiary", 1000, 5500, 1000, 3000);
            var g = new RoadGraph();
            g.SetTile(new TileKey(TileKind.Coarse, 0, 2), Data(side), Hill);          // the side road first, far from the junction
            g.SetTile(new TileKey(TileKind.Coarse, -1, 1), Data(main), Hill);         // the main road, also away from it
            g.SetTile(new TileKey(TileKind.Coarse, 0, 1), Data(main, side), Hill);    // the junction tile: both already graded
            Assert.IsTrue(g.Nearest(new Utm33(1000, 3000 + 1.0), 4, out var onSide));
            Assert.IsTrue(g.Nearest(new Utm33(1000 + 20, 3000), 2, out var onMain) && onMain.Id == main.Id);
            Assert.IsTrue(g.Nearest(new Utm33(1000 - 20, 3000), 2, out var onMain2) && onMain2.Id == main.Id);
            float mainAtNode = (onMain.RoadY + onMain2.RoadY) / 2;
            Assert.AreEqual(mainAtNode, onSide.RoadY, 0.3, "the side road meets the main road's height");
        }

        [Test]
        public void AWayGradedAgain_TheWaysThatTookItsHeightFollow()
        {
            // Way 1 graded first while its north end's ground is unknown (held), way 2 takes its height at the node; then the
            // ground comes in, way 1 is graded again: way 2 must follow, not keep the old height.
            var w1 = Line(1, "unclassified", 1000, 100, 1000, 3000);
            var w2 = Line(2, "unclassified", 1000, 3000, 1000, 6000);
            bool northIn = false;
            bool Known(Utm33 p) => p.N < 2900 || northIn;
            var g = new RoadGraph();
            g.SetTile(new TileKey(TileKind.Coarse, 0, 0), Data(w1), Hill, null, null, Known);
            g.SetTile(new TileKey(TileKind.Coarse, 0, 2), Data(w2), Hill, null, null, Known);
            northIn = true;
            g.SetTile(new TileKey(TileKind.Coarse, 0, 1), Data(w1, w2), Hill, null, null, Known);   // way 1 graded again here
            foreach (var d in g.TakeDirtyTiles()) g.Rebuild(d);
            foreach (var d in g.TakeDirtyTiles()) g.Rebuild(d);
            var (s, n) = Across(g, 1000, 3000);
            Assert.AreEqual(s, n, 1.0, $"one height at the node after the regrade ({s:0.0} / {n:0.0})");
            Assert.AreEqual(0, g.TakeDirtyTiles().Count, "and it settles");
        }
    }
}
