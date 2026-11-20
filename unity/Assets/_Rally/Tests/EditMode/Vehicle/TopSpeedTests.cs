using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>
    /// "The car does not go faster than 50 km/h": every car tops out near the real car's top speed on flat asphalt with the
    /// automatic box; a car on a drawn road wider than the one-lane stage line is on the road (it used to count as rough ground
    /// and was held at 50 km/h); off the road each car has its own limit, the buggies and the Ranger above the road cars.
    /// </summary>
    public class TopSpeedTests
    {
        /// <summary>The stage line's road plus a wider drawn road around it (a two-lane road the endless line runs along).</summary>
        sealed class WideRoad : IGround
        {
            public RoadGround Inner; public float DrawnHalf = 4f;
            public float HeightAt(float2 xz) => Inner.HeightAt(xz);
            public Surface SurfaceAt(float2 xz) => math.abs(xz.x) <= DrawnHalf ? Surface.Asphalt : Surface.Offroad;
            public WaterSample WaterAt(float2 xz) => WaterSample.Dry;
            public bool IsLoaded(float2 xz) => Inner.IsLoaded(xz);
        }

        static float Top(CarKind k, out float t100, out string end)
        {
            var ground = Worlds.Road(_ => 100f, 12000f, new Utm33(0, -5900), new Utm33(0, 5900), 3.4f, Surface.Asphalt);   // level: no crests to fly off at 250 km/h
            var car = new TestCar(ground, k);
            float top = 0f; t100 = float.PositiveInfinity;
            for (int i = 0; i < 60 * 150 && car.S.Progress < 0.97f; i++)
            {
                car.Update(1f / 60f, TestCar.Input(1f));
                top = math.max(top, car.S.SpeedKmh);
                if (t100 == float.PositiveInfinity && car.S.SpeedKmh >= 100f) t100 = i / 60f;
            }
            end = $"end: {car.S.SpeedKmh:F0} km/h gear {car.S.Gear} rpm {car.S.Rpm:F0} boost {car.S.Boost:F2} progress {car.S.Progress:F2} onroad {car.S.OnRoad}";
            return top;
        }

        [Test]
        public void EveryCarReachesItsRealTopSpeedOnFlatAsphalt()
        {
            foreach (var k in Garage.Choosable)
            {
                var spec = CarSpec.For(k);
                float top = Top(k, out float t100, out string end);
                Assert.That(top, Is.InRange(spec.TopSpeed * 0.9f, spec.TopSpeed * 1.1f), $"{k}: top {top:F0} km/h, the real car {spec.TopSpeed:F0}; {end}");
                if (spec.TopSpeed > 110f) Assert.Less(t100, 25f, $"{k}: 0-100 km/h in {t100:F1} s");
            }
        }

        [Test]
        public void OnADrawnTwoLaneRoadBesideTheStageLineTheCarIsOnTheRoad()
        {
            var inner = Worlds.FlatRoad(Surface.Asphalt, RoadConstants.OneLaneHalf, 3200f);
            var ground = new WideRoad { Inner = inner };
            var spec = CarSpec.Porsche;
            var s = CarState.Create(spec, 1);
            CarSim.Reset(ref s, spec, ground, new float2(3.6f, -1400f), 0f);   // the right lane of a 7–8 m road: 3.6 m off the line
            for (int i = 0; i < 60 * 25; i++) CarSim.Step(ref s, spec, TestCar.Input(1f), ground, inner.Route, System.ReadOnlySpan<WallBox>.Empty, 1f / 60f);
            Assert.IsTrue(s.OnRoad, "on the drawn road");
            Assert.AreEqual(Surface.Asphalt, s.SurfaceKind);
            Assert.Greater(s.SpeedKmh, 120f, $"not held at 50 km/h: {s.SpeedKmh:F0}");
        }

        [Test]
        public void OffTheRoadTheBuggiesAndTheRangerAreFasterThanThe911()
        {
            float OffTop(CarKind k)
            {
                var car = new TestCar(Worlds.FlatRoad(), k);
                car.Reset(80f, -1400f, 0f);
                float top = 0f;
                for (int i = 0; i < 60 * 30; i++) { car.Update(1f / 60f, TestCar.Input(1f)); top = math.max(top, car.S.SpeedKmh); }
                Assert.IsFalse(car.S.OnRoad);
                return top;
            }
            float porsche = OffTop(CarKind.Porsche);
            Assert.That(porsche, Is.InRange(45f, 51f), "the 911 keeps car.js's 50 km/h");
            foreach (var k in new[] { CarKind.Baja, CarKind.Ranger, CarKind.Type736, CarKind.Mv6 })
                Assert.Greater(OffTop(k), porsche + 15f, k.ToString());
        }
    }
}
