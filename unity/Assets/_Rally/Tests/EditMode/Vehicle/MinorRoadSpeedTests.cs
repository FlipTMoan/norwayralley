using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.Track;
using Rally.Vehicle;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>
    /// "The car slows down when driving off on minor roads; full speed range for the car, but gravel roads max 120, only the car
    /// limits on asphalt" (2026-11-20). Level ground (lessons: no crests at speed). Asphalt: the car's own top; gravel:
    /// min(car, 120 km/h); a car with a wheel on a narrow road's ribbon is on the road; real off road keeps OffroadMax; every
    /// minor OSM road kind is a road the car is on.
    /// </summary>
    public class MinorRoadSpeedTests
    {
        static RoadGround Level(Surface surface, float half = 3.4f)
            => Worlds.Road(_ => 100f, 12000f, new Utm33(0, -5900), new Utm33(0, 5900), half, surface);

        static float Top(CarKind k, Surface surface, float x = 0f, float seconds = 150f, float startKmh = 0f)
        {
            var car = new TestCar(Level(surface), k);
            car.Reset(x, -5800f, 0f);
            if (startKmh > 0f) { car.S.Vel = new float2(0f, startKmh / 3.6f); CarSim.SyncBodyVelocity(ref car.S); car.S.Gear = car.Spec.Gears.Length; }
            float top = 0f;
            for (int i = 0; i < 60 * seconds && car.S.Pos.z < 5700f; i++) { car.Update(1f / 60f, TestCar.Input(1f)); top = math.max(top, car.S.SpeedKmh); }
            return startKmh > 0f ? car.S.SpeedKmh : top;
        }

        [Test]
        public void OnAsphaltOnlyTheCarLimitsOnGravelAtMost120()
        {
            foreach (var k in Garage.Choosable)
            {
                var spec = CarSpec.For(k);
                float asphalt = Top(k, Surface.Asphalt), gravel = Top(k, Surface.Gravel);
                Assert.That(asphalt, Is.InRange(spec.TopSpeed * 0.9f, spec.TopSpeed * 1.1f), $"{k} on asphalt: {asphalt:F0} km/h, the car {spec.TopSpeed:F0}");
                Assert.LessOrEqual(gravel, 120.5f, $"{k} on gravel: {gravel:F0} km/h");
                // A car slower than 120 on asphalt is a little slower again on loose gravel (rolling resistance), not held back.
                Assert.GreaterOrEqual(gravel, math.min(asphalt, 120f) * 0.85f, $"{k} on gravel: {gravel:F0} km/h, asphalt {asphalt:F0}");
                if (asphalt > 135f) Assert.Greater(gravel, 117f, $"{k} reaches the gravel limit: {gravel:F0} km/h");
            }
        }

        [Test]
        public void ArrivingOnGravelAbove120EasesBackToTheLimit()
        {
            float end = Top(CarKind.Turbo930, Surface.Gravel, 0f, 12f, 200f);
            Assert.That(end, Is.InRange(115f, 122f), $"after 12 s at full throttle: {end:F0} km/h");
        }

        [Test]
        public void ACarWithItsInsideWheelsOnANarrowRoadIsOnTheRoad()
        {
            // One-lane road: carriageway 2.25 m + 1.5 m shoulder = the drawn ribbon to 3.75 m. Centre 4.2 m out: the left
            // wheels (track/2 ≈ 0.7 m) still on the ribbon. It used to count as rough ground and was braked to 50 km/h.
            float x = RoadConstants.OneLaneHalf + RoadConstants.RoadShoulder + 0.45f;
            var car = new TestCar(Level(Surface.Asphalt, RoadConstants.OneLaneHalf), CarKind.Porsche);
            car.Reset(x, -5800f, 0f);
            bool always = true;
            for (int i = 0; i < 60 * 25; i++)
            {
                // Hold the line 4.2 m out (the carved shoulder beyond the ribbon slopes away).
                float want = math.atan2(x - car.S.Pos.x, 30f + car.S.Speed);   // aim at the line 30 m + 1 s ahead
                var input = TestCar.Input(1f, steer: math.clamp(CarSim.WrapAngle(want - car.S.Yaw) * 1.5f, -1f, 1f));
                car.Update(1f / 60f, input);
                if (i > 60) always &= car.S.OnRoad;
            }
            Assert.IsTrue(always, $"a wheel on the ribbon the whole way (x {car.S.Pos.x:F2})");
            Assert.Greater(car.S.SpeedKmh, 150f, $"not held at OffroadMax: {car.S.SpeedKmh:F0} km/h");

            // Real off road (every wheel off the ribbon) keeps the car's rough-ground limit.
            var off = new TestCar(Level(Surface.Asphalt, RoadConstants.OneLaneHalf), CarKind.Porsche);
            off.Reset(RoadConstants.OneLaneHalf + RoadConstants.RoadShoulder + off.Spec.Track * 0.5f + 1.5f, -5800f, 0f);
            float top = 0f;
            for (int i = 0; i < 60 * 25; i++) { off.Update(1f / 60f, TestCar.Input(1f)); top = math.max(top, off.S.SpeedKmh); }
            Assert.IsFalse(off.S.OnRoad);
            Assert.LessOrEqual(top, off.Spec.OffroadMax * 3.6f + 1f, $"off road: {top:F0} km/h");
        }

        [Test]
        public void EveryMinorRoadKindIsARoadTheCarIsOn()
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var kinds = new[] { ("unclassified", (string)null, Surface.Asphalt), ("residential", null, Surface.Asphalt), ("living_street", null, Surface.Asphalt),
                ("service", null, Surface.Asphalt), ("track", null, Surface.Gravel), ("track", "asphalt", Surface.Asphalt), ("unclassified", "gravel", Surface.Gravel),
                ("residential", "compacted", Surface.Gravel), ("tertiary", null, Surface.Asphalt) };
            var data = new RoadGraphData();
            for (int i = 0; i < kinds.Length; i++)
            {
                var w = new RoadWay { Id = i + 1 };
                w.Tags["highway"] = kinds[i].Item1;
                if (kinds[i].Item2 != null) w.Tags["surface"] = kinds[i].Item2;
                for (double n = 100; n <= 1900; n += 50) w.Nodes.Add(new Utm33(100 + i * 200, n));
                data.Ways.Add(w);
            }
            var roads = new RoadGraph();
            roads.SetTile(new TileKey(TileKind.Coarse, 0, 0), data, _ => 100f);
            var route = new RoadNetworkRoute(roads, default);
            var ground = new FlatGround { Height = _ => 100.12f, Surface = Surface.Offroad };
            for (int i = 0; i < kinds.Length; i++)
            {
                var spec = CarSpec.Porsche;
                var s = CarState.Create(spec, 1);
                // 1.5 m off the centre line, as a car on its own side of the road.
                CarSim.Reset(ref s, spec, ground, new float2(100 + i * 200 + 1.5f, 200f), 0f);
                for (int f = 0; f < 60 * 3; f++) CarSim.Step(ref s, spec, TestCar.Input(1f), ground, route, System.ReadOnlySpan<WallBox>.Empty, 1f / 60f);
                Assert.IsTrue(s.OnRoad, $"{kinds[i].Item1} {kinds[i].Item2}: on the road");
                Assert.AreEqual(kinds[i].Item3, s.SurfaceKind, $"{kinds[i].Item1} {kinds[i].Item2}: surface");
            }
        }
    }
}
