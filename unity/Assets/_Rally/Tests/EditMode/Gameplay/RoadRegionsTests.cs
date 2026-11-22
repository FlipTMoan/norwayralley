using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using Rally.Core;
using Rally.Gameplay;
using Rally.Geo;
using Rally.Tests.Geo;
using Rally.World;

namespace Rally.Tests.Gameplay
{
    /// <summary>
    /// OSM roads per road region of 3 × 3 tiles (plan_20261122_road_regions): neighbouring tiles share one answer, and a tile
    /// gets its roads only when the regions of the tile and its 8 neighbours are in, so no road ends at a tile edge because
    /// the neighbour's data has not come yet.
    /// </summary>
    public class RoadRegionsTests : NoSyncContext
    {
        static TileKey T(int i, int j) => new TileKey(TileKind.Coarse, i, j);

        [Test]
        public void RegionKeysOfATileAndItsNeighbours()
        {
            Assert.AreEqual(new RoadRegions.Key(0, 0), RoadRegions.Of(T(2, 2)));
            Assert.AreEqual(new RoadRegions.Key(1, 0), RoadRegions.Of(T(3, 2)));
            Assert.AreEqual(new RoadRegions.Key(-1, -1), RoadRegions.Of(T(-1, -3)), "a fixed grid also west / south of 0");
            Assert.AreEqual(new RoadRegions.Key(-2, 0), RoadRegions.Of(T(-4, 0)));
            CollectionAssert.AreEquivalent(new[] { new RoadRegions.Key(0, 0) }, RoadRegions.Around(T(1, 1)), "the middle tile: one region");
            CollectionAssert.AreEquivalent(new[] { new RoadRegions.Key(0, 0), new RoadRegions.Key(1, 0) }, RoadRegions.Around(T(2, 1)), "an edge tile: two");
            CollectionAssert.AreEquivalent(new[] { new RoadRegions.Key(0, 0), new RoadRegions.Key(-1, 0), new RoadRegions.Key(0, -1), new RoadRegions.Key(-1, -1) },
                RoadRegions.Around(T(0, 0)), "a corner tile: four");
            Assert.AreEqual(RoadRegions.Of(T(0, 0)), RoadRegions.Around(T(0, 0))[0], "its own first");
            var b = new RoadRegions.Key(1, 2).Bounds;
            Assert.AreEqual((3 * 2048.0, 6 * 2048.0, 6 * 2048.0, 9 * 2048.0), (b.MinE, b.MinN, b.MaxE, b.MaxN));
        }

        [Test]
        public void EachRegionIsCachedUnderItsOwnKey()
        {
            var a = LatLonBounds.Of(RoadRegions.Of(T(1, 3290)).Bounds);
            var b = LatLonBounds.Of(RoadRegions.Of(T(4, 3290)).Bounds);
            Assert.AreEqual(OverpassQuery.RoadsCacheKey(LatLonBounds.Of(RoadRegions.Of(T(2, 3289)).Bounds)), OverpassQuery.RoadsCacheKey(a), "two tiles of one region: one key");
            Assert.AreNotEqual(OverpassQuery.RoadsCacheKey(a), OverpassQuery.RoadsCacheKey(b));
        }

        /// <summary>A region's fake roads: one way along its south edge, 1 km into the region east of it (it crosses the region border).</summary>
        sealed class FakeRegions
        {
            public readonly Dictionary<RoadRegions.Key, TaskCompletionSource<RoadGraphData>> Asked = new Dictionary<RoadRegions.Key, TaskCompletionSource<RoadGraphData>>();
            public int Calls;
            public Task<RoadGraphData> Fetch(Bounds25833 b, CancellationToken ct)
            {
                Calls++;
                var k = new RoadRegions.Key((int)System.Math.Floor(b.MinE / b.Width), (int)System.Math.Floor(b.MinN / b.Height));
                var t = new TaskCompletionSource<RoadGraphData>();
                Asked[k] = t;
                return t.Task;
            }
            public static RoadGraphData Roads(RoadRegions.Key k)
            {
                var b = k.Bounds;
                var w = new RoadWay { Id = 1000 + k.I * 10 + k.J, Tags = { { "highway", "residential" } } };
                w.Nodes.Add(new Utm33(b.MinE + 100, b.MinN + 1000)); w.Nodes.Add(new Utm33(b.MaxE + 1000, b.MinN + 1000));
                return new RoadGraphData { Ways = { w } };
            }
            public void Answer(RoadRegions.Key k) => Asked[k].SetResult(Roads(k));
        }

        [Test]
        public void ATileWithANeighboursRegionMissingGetsNoRoadsUntilItIsIn()
        {
            var net = new FakeRegions();
            var regions = new RoadRegions(net.Fetch);
            var edge = T(2, 0);   // east column of region (0,0): its east neighbours are in region (1,0)
            var roads = regions.ForTile(edge, default);
            Assert.AreEqual(4, net.Calls, "its own region and the three around its neighbours (south too)");
            net.Answer(new RoadRegions.Key(0, 0));
            net.Answer(new RoadRegions.Key(0, -1));
            net.Answer(new RoadRegions.Key(1, -1));
            Assert.IsFalse(roads.IsCompleted, "its own region is in, an east neighbour's is not: no roads yet");
            Assert.IsFalse(regions.Ready(edge));
            net.Answer(new RoadRegions.Key(1, 0));
            Assert.IsTrue(roads.IsCompleted);
            Assert.IsTrue(regions.Ready(edge));
            var ids = roads.Result.Ways.Select(w => w.Id).ToList();
            CollectionAssert.Contains(ids, 1000L, "its own region's way (it crosses the tile)");
            CollectionAssert.DoesNotContain(ids, 1010L, "the east region's way starts 2 km east of the tile: not this tile's");
            Assert.AreEqual(ids.Count, ids.Distinct().Count(), "each way once");
            var again = regions.ForTile(T(1, 1), default);
            Assert.IsTrue(again.IsCompleted, "the middle tile shares the answer: no new request");
            Assert.AreEqual(4, net.Calls);
        }

        [Test]
        public void AWayFromTheNeighbourRegionReachingIntoTheTileIsIncluded()
        {
            var net = new FakeRegions();
            var regions = new RoadRegions(net.Fetch);
            var west = T(3, 0);   // west column of region (1,0)
            var roads = regions.ForTile(west, default);
            foreach (var k in net.Asked.Keys.ToList()) net.Answer(k);
            CollectionAssert.Contains(roads.Result.Ways.Select(w => w.Id).ToList(), 1000L, "region (0,0)'s way runs 1 km into region (1,0)");
        }

        /// <summary>A tile's drawn roads show only once every wanted neighbour's are drawn too; shown stays shown.</summary>
        [Test]
        public void DrawnRoadsShowOnlyWithTheirNeighbours()
        {
            var wanted = new HashSet<TileKey>();
            for (int j = 0; j < 3; j++) for (int i = 0; i < 4; i++) wanted.Add(T(i, j));   // a 4 × 3 loaded area
            var drawn = new List<TileKey> { T(0, 0), T(1, 0), T(2, 0), T(0, 1), T(1, 1), T(2, 1), T(0, 2), T(1, 2) };   // not (2,2) nor column 3
            var shown = new HashSet<TileKey>();
            var s = RoadRegions.Showable(drawn, shown, wanted.Contains, k => false);
            CollectionAssert.AreEquivalent(new[] { T(0, 0), T(1, 0), T(0, 1), T(0, 2) }, s,
                "shown: tiles whose wanted neighbours are all drawn (beyond the area nothing is wanted)");
            CollectionAssert.DoesNotContain(s, T(1, 1), "its neighbour (2,2) is not drawn yet");
            Assert.IsTrue(RoadRegions.Showable(drawn, new HashSet<TileKey> { T(1, 1) }, wanted.Contains, k => false).Contains(T(1, 1)), "a shown tile stays shown");
            Assert.IsTrue(RoadRegions.Showable(drawn, shown, wanted.Contains, k => k.Equals(T(2, 1))).Contains(T(2, 1)), "one that waited too long shows");
        }

        [Test]
        public void AFailedRegionIsNullAndAskedAgain()
        {
            var net = new FakeRegions();
            var regions = new RoadRegions(net.Fetch);
            var roads = regions.ForTile(T(1, 1), default);
            net.Asked[new RoadRegions.Key(0, 0)].SetResult(null);
            Assert.IsNull(roads.Result, "no answer: null (the lane asks again after Overpass's pause)");
            regions.ForTile(T(1, 1), default);
            Assert.AreEqual(2, net.Calls, "asked again");
        }
    }
}
