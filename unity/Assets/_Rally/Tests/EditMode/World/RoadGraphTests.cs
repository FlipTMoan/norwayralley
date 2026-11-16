using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    public class RoadGraphTests
    {
        static RoadWay Way(long id, string highway, double e, double n0, double n1, string surface = null)
        {
            var w = new RoadWay { Id = id };
            w.Tags["highway"] = highway;
            if (surface != null) w.Tags["surface"] = surface;
            for (double n = n0; n <= n1; n += 50) w.Nodes.Add(new Utm33(e, n));
            return w;
        }

        static RoadGraph Graph(params RoadWay[] ways)
        {
            var g = new RoadGraph();
            var data = new RoadGraphData(); data.Ways.AddRange(ways);
            g.SetTile(new TileKey(TileKind.Coarse, 0, 0), data, _ => 100f);
            return g;
        }

        [Test]
        public void NearestGivesDistanceSideWidthSurfaceAndHeight()
        {
            var g = Graph(Way(1, "tertiary", 1000, 0, 500));
            Assert.IsTrue(g.Nearest(new Utm33(1003, 250), 24, out var right));
            Assert.AreEqual(3, right.Distance, 1e-6);
            Assert.AreEqual(-1, right.Side, "east of a northbound road is the right-hand side (left normal is (−tz, tx))");
            Assert.AreEqual(RoadProfile.Two.Half, right.Half, "tertiary roads are two-lane");
            Assert.AreEqual(Surface.Asphalt, right.Surface);
            Assert.AreEqual(100, right.RoadY, 1e-4, "graded on flat ground");
            Assert.AreEqual(1, right.Tangent.y, 1e-9);
            Assert.AreEqual(250, right.Point.y, 1e-6);
            Assert.IsTrue(g.Nearest(new Utm33(997, 250), 24, out var left));
            Assert.AreEqual(1, left.Side);
            Assert.IsFalse(g.Nearest(new Utm33(1100, 250), 24, out _), "100 m away: nothing within the limit");
            Assert.IsTrue(g.Nearest(new Utm33(1100, 250), 120, out var farHit));
            Assert.AreEqual(100, farHit.Distance, 1e-6);
        }

        [Test]
        public void SurfaceAndLanesFromTags()
        {
            var g = Graph(Way(1, "track", 1000, 0, 500), Way(2, "primary", 2000, 0, 500, "gravel"), Way(3, "service", 3000, 0, 500, "asphalt"));
            Assert.IsTrue(g.Nearest(new Utm33(1000, 100), 10, out var track));
            Assert.AreEqual(Surface.Gravel, track.Surface, "untagged tracks are gravel");
            Assert.AreEqual(RoadProfile.One.Half, track.Half, "tracks are single-lane");
            Assert.IsTrue(g.Nearest(new Utm33(2000, 100), 10, out var primary));
            Assert.AreEqual(Surface.Gravel, primary.Surface, "surface tag wins over class");
            Assert.AreEqual(RoadProfile.Two.Half, primary.Half);
            Assert.IsTrue(g.Nearest(new Utm33(3000, 100), 10, out var service));
            Assert.AreEqual(Surface.Asphalt, service.Surface);
            Assert.AreEqual(RoadProfile.One.Half, service.Half);
            var footway = new RoadWay { Id = 9 }; footway.Tags["highway"] = "footway";
            Assert.IsNull(ProfileGrader.LaneSpecFor(footway.Tags), "footways are not roads");
        }

        [Test]
        public void CarveSegmentsAreTileLocalWithLift()
        {
            var g = Graph(Way(1, "residential", 1000, 0, 500));
            var segs = new List<CarveSegment>();
            g.CollectCarveSegments(new Bounds25833(0, 0, 2048, 2048), new Utm33(0, 0), segs);
            Assert.Greater(segs.Count, 50, "5 m samples over 500 m");
            Assert.AreEqual(100 + RoadConstants.RoadLift, segs[0].Ha, 1e-5);
            Assert.AreEqual(RoadConstants.FlatHalf(RoadProfile.One.Half), segs[0].HalfWidth, 1e-6);
            Assert.AreEqual(RoadConstants.Feather, segs[0].Shoulder, 1e-6, "single lane: the feather is the blend");
            Assert.AreEqual(1000, segs[0].A.x, 1e-3);
            segs.Clear();
            g.CollectCarveSegments(new Bounds25833(1500, 0, 2048, 2048), new Utm33(1500, 0), segs);
            Assert.AreEqual(0, segs.Count, "a road 500 m west of the box does not reach it");
        }

        [Test]
        public void RemoveTileEmptiesTheIndex_AndPoseFollowsTheRoad()
        {
            var g = Graph(Way(1, "tertiary", 1000, 0, 500));
            var pose = g.PoseNear(new Utm33(1010, 200));
            Assert.IsTrue(pose.HasValue);
            Assert.AreEqual(0, pose.Value.Yaw, 1e-6, "northbound: yaw 0 like stage.js atan2(dx, dz)");
            Assert.AreEqual(1000, pose.Value.Position.E, 1e-6);
            g.RemoveTile(new TileKey(TileKind.Coarse, 0, 0));
            Assert.AreEqual(0, g.SegmentCount);
            Assert.IsFalse(g.Nearest(new Utm33(1000, 200), 50, out _));
        }
    }
}
