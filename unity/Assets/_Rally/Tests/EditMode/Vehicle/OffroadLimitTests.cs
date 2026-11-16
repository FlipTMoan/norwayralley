using NUnit.Framework;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>Port of legacy-js/tests/offroad-limit.test.mjs.</summary>
    public class OffroadLimitTests
    {
        static readonly CarInput FlatOut = TestCar.Input(1f);

        [Test]
        public void OffTheRoadACarTopsOutAt50OnTheRoadItGoesFaster()
        {
            foreach (var kind in new[] { CarKind.Porsche, CarKind.Buggy })
            {
                var car = new TestCar(Worlds.FlatRoad(), kind);
                car.Reset(80f, -1400f, 0f); // 80 m beside the road: open ground
                float top = 0f;
                for (int i = 0; i < 60 * 30; i++) { car.Update(1f / 60f, FlatOut); top = math.max(top, car.Speed); }
                Assert.IsFalse(car.S.OnRoad, $"{kind}: off the road");
                Assert.IsTrue(top * 3.6f <= 51f && top * 3.6f > 45f, $"{kind}: off-road top speed {top * 3.6f:F1} km/h");
            }
            var porsche = new TestCar(Worlds.FlatRoad());
            porsche.Reset(0f, -1400f, 0f);
            for (int i = 0; i < 60 * 20; i++) porsche.Update(1f / 60f, FlatOut);
            Assert.IsTrue(porsche.S.OnRoad && porsche.S.SpeedKmh > 80f, $"on the road: {porsche.S.SpeedKmh:F0} km/h");
        }

        [Test]
        public void ArrivingFastOnOpenGroundTheCarIsSlowedTo50()
        {
            var car = new TestCar(Worlds.FlatRoad(), CarKind.Buggy);
            car.Reset(80f, -1400f, 0f);
            car.S.VF = 40f; // 144 km/h along +z
            for (int i = 0; i < 60 * 6; i++) car.Update(1f / 60f, FlatOut);
            Assert.Less(math.abs(car.Speed - CarSim.OffroadMaxSpeed), 0.5f, $"settles at the limit: {car.S.SpeedKmh:F1} km/h");
        }
    }
}
