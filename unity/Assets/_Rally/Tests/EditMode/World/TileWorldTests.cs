using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.World;
using Unity.Collections;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    /// <summary>car.js groundAt: on the road the car rides the ribbon; off it the carved ground.</summary>
    public class TileWorldTests
    {
        /// <summary>One straight single-lane road at E = 1000, northbound, graded at 100 m, no carve input.</summary>
        sealed class FakeRoads : IRoadQuery
        {
            public bool Nearest(Utm33 p, double limit, out RoadHit hit)
            {
                double d = math.abs(p.E - 1000);
                hit = new RoadHit { Distance = d, RoadY = 100, Half = RoadProfile.One.Half, Cut = RoadProfile.One.Cut, Surface = Surface.Gravel, Point = new double2(1000, p.N), Tangent = new double2(0, 1), Side = p.E < 1000 ? 1 : -1 };
                return d <= limit;
            }
            public bool Nearest(Utm33 p, double limit, RoadLayer layer, out RoadHit hit) { hit = default; return layer != RoadLayer.Deck && layer != RoadLayer.Tunnel && Nearest(p, limit, out hit); }
            public int BridgeSegmentCount => 0;
            public int TunnelSegmentCount => 0;
            public void TunnelSegmentsNear(Utm33 p, double radius, List<TunnelPiece> output) { }
            public void CollectCarveSegments(Bounds25833 bounds, Utm33 origin, List<CarveSegment> output) { }
            public void PointsNear(Utm33 p, double radius, List<Utm33> output) { }
        }

        [Test]
        public void HeightAt_RibbonLiftOnTheRoad_FadesAcrossTheShoulder_CarvedGroundElsewhere()
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var world = new TileWorld(null, null);   // no compute shader: CPU carve path, no scene materials
            try
            {
                world.Roads = new FakeRoads();
                var focus = new Utm33(1000, 1000);
                world.Scheduler.Update(focus, double2.zero, null);
                var key = TileKey.At(TileKind.Coarse, focus);
                var dtm = new NativeArray<float>(TileScheduler.Samples * TileScheduler.Samples, Allocator.Temp);
                for (int i = 0; i < dtm.Length; i++) dtm[i] = 100f;
                world.OnTileData(key, dtm, null, null, 60.0);
                dtm.Dispose();
                Assert.IsTrue(world.IsLoaded(new float2(1000, 1000)));
                float half = RoadProfile.One.Half;
                float top = RoadConstants.RoadRibbonLift + RoadConstants.RoadCrown;
                Assert.AreEqual(100 + RoadConstants.RoadLift + top, world.HeightAt(new float2(1000, 1000)), 1e-4, "centre line: profile + lift + crown");
                Assert.AreEqual(100 + RoadConstants.RoadLift + top, world.HeightAt(new float2(1000 + half, 1000)), 1e-4, "carriageway edge");
                float onShoulder = 1000 + half + RoadConstants.Shoulder * 0.5f;
                Assert.AreEqual(100 + RoadConstants.RoadLift + math.lerp(top, RoadConstants.RoadRibbonLift, 0.5f), world.HeightAt(new float2(onShoulder, 1000)), 1e-4, "half way across the shoulder");
                Assert.AreEqual(100, world.HeightAt(new float2(1000 + 30, 1000)), 1e-4, "30 m off the road: the carved ground, no lift");
                Assert.AreEqual(Surface.Gravel, world.SurfaceAt(new float2(1001, 1000)));
                Assert.AreEqual(Surface.Offroad, world.SurfaceAt(new float2(1030, 1000)));
                Assert.AreEqual(0, world.WaterAt(new float2(1030, 1000)).Depth, "100 m up: dry");
            }
            finally { world.Dispose(); }
        }
    }
}
