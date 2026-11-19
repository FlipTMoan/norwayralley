using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    /// <summary>The ring logic of stream.js / fine.js: what loads and unloads as the car moves.</summary>
    public class TileSchedulerTests
    {
        static List<TileKey> Drain(TileScheduler s, TileKind kind)
        {
            var got = new List<TileKey>();
            while (s.TryDequeue(out var k)) { if (k.Kind == kind) got.Add(k); s.MarkReady(k); }
            return got;
        }

        [Test]
        public void CoarseTilesWithinLoadRadiusAreCreated_CentreFirst()
        {
            var s = new TileScheduler();
            var created = new List<TileKey>();
            s.Created += k => created.Add(k);
            var focus = new Utm33(1000, 1000);
            s.Update(focus, double2.zero, null);
            foreach (var k in created)
                if (k.Kind == TileKind.Coarse) Assert.LessOrEqual(k.RectDistance(focus), TileScheduler.LoadRadius, k.ToString());
            Assert.IsTrue(created.Contains(new TileKey(TileKind.Coarse, 0, 0)));
            Assert.IsTrue(created.Contains(new TileKey(TileKind.Coarse, 2, 0)), "4096 m east: within 4400 m of the edge");
            Assert.IsFalse(created.Contains(new TileKey(TileKind.Coarse, 3, 3)), "far corner is outside the load radius");
            // Fine tiles (under the car) dequeue before the coarse ones; the first coarse tile is the one under the car.
            Assert.IsTrue(s.TryDequeue(out var first));
            Assert.AreEqual(TileKind.Fine, first.Kind);
            s.MarkReady(first);
            var coarse = Drain(s, TileKind.Coarse);
            Assert.AreEqual(new TileKey(TileKind.Coarse, 0, 0), coarse[0]);
        }

        [Test]
        public void VelocityLeadsTheLoadPoint()
        {
            var led = TileScheduler.LedPoint(new Utm33(0, 0), new double2(40, 0));   // 40 m/s east → 140 m ahead (3.5 s)
            Assert.AreEqual(140, led.E, 1e-9);
            led = TileScheduler.LedPoint(new Utm33(0, 0), new double2(0, 5000));      // capped at LEAD_DISTANCE
            Assert.AreEqual(TileScheduler.LeadDistance, led.N, 1e-9);
        }

        [Test]
        public void TheViewRingReachesJustPastTheFogHorizonAndFitsTheAtlas()
        {
            float horizon = TileScheduler.HorizonFor(0.00035f, 12000f);
            Assert.AreEqual(5651f, horizon, 5f, "exp² fog at 0.00035 leaves 2 % of the colour at ~5.65 km");
            var s = new TileScheduler();
            s.SetHorizon(horizon);
            Assert.AreEqual(horizon + TileScheduler.HorizonMargin, s.ViewRadius, 1e-3f);
            var focus = new Utm33(1000, 1000);
            s.Update(focus, new double2(40, 0), null);          // 144 km/h east: lead ring 2.8 km ahead
            int coarse = 0;
            foreach (var k in s.Keys)
                if (k.Kind == TileKind.Coarse) coarse++;
            for (int a = 0; a < 360; a += 15)                   // every direction around the car is covered to the horizon
            {
                var p = focus + new double2(System.Math.Cos(a * System.Math.PI / 180) * horizon, System.Math.Sin(a * System.Math.PI / 180) * horizon);
                Assert.IsTrue(s.Contains(TileKey.At(TileKind.Coarse, p)), $"no tile at the horizon towards {a}°");
            }
            Assert.Less(coarse, TileWorld.CoarseSlices, "the rings must fit the coarse atlas");
            Assert.Greater(s.DropRadius, TileScheduler.LeadDistance + TileScheduler.LoadRadius, "ready tiles the lead ring wants are not dropped (no thrash)");
        }

        [Test]
        public void MovingFarDisposesReadyTilesBeyondKeepRadius()
        {
            var s = new TileScheduler();
            var disposed = new List<TileKey>();
            s.Disposed += k => disposed.Add(k);
            s.Update(new Utm33(1000, 1000), double2.zero, null);
            Drain(s, TileKind.Coarse);
            var far = new Utm33(1000 + 20000, 1000);
            s.Update(far, double2.zero, null);
            Assert.IsTrue(disposed.Contains(new TileKey(TileKind.Coarse, 0, 0)), "the tile left 20 km behind is dropped");
            foreach (var k in s.Keys) Assert.LessOrEqual(k.RectDistance(far), s.DropRadius + TileScheduler.CoarseSize, k.ToString());
            Assert.IsTrue(s.Contains(TileKey.At(TileKind.Coarse, far)));
        }

        [Test]
        public void FineTilesFollowTheRoadPointsAndCapAtMaxLive()
        {
            var s = new TileScheduler();
            var focus = new Utm33(5000, 5000);
            var road = new List<Utm33>();
            for (int i = 0; i < 400; i++) road.Add(new Utm33(5000 + i * 10, 5000));   // 4 km of road east
            s.Update(focus, double2.zero, road);
            int fine = 0;
            foreach (var k in s.Keys) if (k.Kind == TileKind.Fine) { fine++; Assert.LessOrEqual(k.RectDistance(focus), TileScheduler.FineKeep); }
            Assert.LessOrEqual(fine, TileScheduler.FineMaxLive);
            Assert.Greater(fine, 4, "the band around the road gives several tiles");
            Assert.IsTrue(s.Contains(TileKey.At(TileKind.Fine, focus)));
            Assert.IsFalse(s.Contains(TileKey.At(TileKind.Fine, new Utm33(5000, 5000 - 400))), "400 m off the road: outside the band");
        }

        [Test]
        public void HoleMaskMarksReadyFineTilesInTheirCoarseTile()
        {
            var s = new TileScheduler();
            var road = new List<Utm33> { new Utm33(2048 + 256 * 1 + 10, 256 * 3 + 10) };   // fine (9, 3) → coarse (1, 0), cell (1, 3)
            s.Update(new Utm33(2300, 800), double2.zero, road);
            Assert.AreEqual(0UL, s.HoleMask(1, 0));
            s.MarkReady(new TileKey(TileKind.Fine, 9, 3));
            Assert.AreNotEqual(0UL, s.HoleMask(1, 0) & (1UL << (1 + 8 * 3)));
            s.Update(new Utm33(2300 + 20000, 800), double2.zero, null);   // far away: the fine tile is dropped and the hole closes
            Assert.AreEqual(0UL, s.HoleMask(1, 0));
        }
    }
}
