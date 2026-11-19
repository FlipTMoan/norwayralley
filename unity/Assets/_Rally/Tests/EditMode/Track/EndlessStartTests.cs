using System.Collections.Generic;
using System.Threading;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.Track;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Track
{
    /// <summary>
    /// The endless start (GameController.CreateRoute, key N): on the fake world's road, whose junctions are 2 km
    /// apart, a pin 150 m beside the road must give a stage that starts on that road, facing along it, with pace
    /// notes. The old start looked for the nearest junction within 600 m and fell back to free drive off the road.
    /// </summary>
    public class EndlessStartTests
    {
        static RoadGraph FakeWorldRoads(params TileKey[] tiles)
        {
            var osm = new FakeSources.Osm { Wiggle = 40 };
            var g = new RoadGraph();
            foreach (var key in tiles)
                g.SetTile(key, osm.FetchRoads(key.Bounds, CancellationToken.None).Result, _ => 50f);
            return g;
        }

        [Test]
        public void StartsOnTheNearestRoadFacingAlongItWithPaceNotes()
        {
            var tiles = new[] { new TileKey(TileKind.Coarse, 0, 0), new TileKey(TileKind.Coarse, 1, 0), new TileKey(TileKind.Coarse, 2, 0) };
            var roads = FakeWorldRoads(tiles);
            foreach (var t in tiles) Assert.IsTrue(roads.HasTile(t));
            double e = 3072 + 100, roadN = 1024 + 40 * math.sin(2 * math.PI * e / 800);
            var pin = new Utm33(e, roadN + 150);
            Assert.AreEqual(0, roads.NearestNode(pin, 600), "precondition: no junction within the old 600 m search");

            var edges = new RoadGraphEdges(roads);
            Assert.IsTrue(edges.StartNear(pin, 1000, out var first, out int firstSample));
            var walk = new RoadWalk(edges, 0xC0FFEE, first);
            Assert.IsTrue(walk.ExtendSector());
            Assert.Greater(walk.Length, 2000f, "the walk carries on past the first link's junction");
            var points = new List<Utm33>();
            edges.AppendPoints(walk.LastSector, points, firstSample, null);

            var start = points[0];
            double closest = double.MaxValue;   // the road's closest approach to the pin, by brute force
            for (double x = e - 400; x <= e + 400; x += 0.5) closest = math.min(closest, math.length(new double2(x, 1024 + 40 * math.sin(2 * math.PI * x / 800)) - new double2(pin.E, pin.N)));
            Assert.AreEqual(closest, math.length(start.Minus(pin)), 3, "the stage starts at the road's closest point to the pin, not at a junction 1 km away");
            Assert.IsTrue(roads.Nearest(start, 10, out var hit));
            Assert.Less(hit.Distance, 0.5, "the start is on the road");

            var stage = StageRoute.Make(points, new FlatGround { Height = _ => 50f });
            var pose = stage.StartPose();
            var dir = new float2(math.sin(pose.Yaw), math.cos(pose.Yaw));
            Assert.Greater(math.abs(math.dot(dir, (float2)hit.Tangent)), 0.9f, "the car faces along the road");
            Assert.Greater(PaceNotes.FindTurns(stage.Samples).Count, 0, "the bends of the road give pace notes");
        }

        [Test]
        public void NoRoadWithinTheRadiusMeansNoStart()
        {
            var roads = FakeWorldRoads(new TileKey(TileKind.Coarse, 0, 0));
            Assert.IsFalse(new RoadGraphEdges(roads).StartNear(new Utm33(1024, 1024 + 1500), 1000, out _, out _));
        }
    }
}
