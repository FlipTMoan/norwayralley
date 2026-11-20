using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>Port of legacy-js/tests/gearbox.test.mjs.</summary>
    public class GearboxTests
    {
        static TestCar FlatRoad() => new TestCar(Worlds.FlatRoad(Surface.Asphalt, roadWidth: 3.2f));   // asphalt: gravel stops at 120 km/h (2026-11-20)

        [Test]
        public void AutomaticBoxRunsThe911GearSpansUpToA12000RpmRedline()
        {
            var car = FlatRoad();
            var input = TestCar.Input(1f);
            var seen = new Dictionary<int, float2>(); // gear → (min km/h, max km/h)
            float maxRpm = 0f, top = 0f;
            for (int i = 0; i < 60 * 45; i++)
            {
                car.Update(1f / 60f, input);
                if (car.S.Progress > 0.9f) break;
                float kmh = car.S.SpeedKmh;
                top = math.max(top, kmh);
                maxRpm = math.max(maxRpm, car.S.Rpm);
                int g = car.S.Gear;
                var r = seen.TryGetValue(g, out var v) ? v : new float2(float.PositiveInfinity, float.NegativeInfinity);
                seen[g] = new float2(math.min(r.x, kmh), math.max(r.y, kmh));
            }
            Assert.AreEqual(12000f, CarSpec.Porsche.Redline);
            Assert.LessOrEqual(maxRpm, 12001f, $"rpm ran to {maxRpm:F0}");
            Assert.Less(seen[1].y, 64f, $"1st held to {seen[1].y:F0} km/h");
            Assert.IsTrue(seen[2].x < 62f && seen[2].y < 104f, $"2nd spanned {seen[2].x:F0}–{seen[2].y:F0} km/h");
            Assert.Less(seen[3].y, 144f, $"3rd spanned {seen[3].x:F0}–{seen[3].y:F0} km/h");
            Assert.IsTrue(seen.ContainsKey(4), "reaches 4th on the flat");
            Assert.IsTrue(top > 150f && top < 230f, $"top speed {top:F0} km/h");
        }

        [Test]
        public void ManualBoxHoldsTheGearAndHitsTheRevLimiter()
        {
            var car = FlatRoad();
            car.S.AutoShift = false;
            var input = TestCar.Input(1f);
            float top = 0f; bool limited = false;
            for (int i = 0; i < 60 * 12; i++)
            {
                car.Update(1f / 60f, input);
                top = math.max(top, car.S.SpeedKmh);
                if (car.S.Limiter) limited = true;
            }
            Assert.AreEqual(1, car.S.Gear, "stays in first without shifting");
            Assert.IsTrue(limited, "limiter engages on the redline");
            Assert.IsTrue(top > 50f && top < 66f, $"first gear tops out at {top:F0} km/h");
        }

        [Test]
        public void LaunchIsTractionLimitedNotTorqueLimited()
        {
            var car = FlatRoad();
            var input = TestCar.Input(1f);
            float prev = 0f, maxAccel = 0f;
            for (int i = 0; i < 60 * 3; i++)
            {
                car.Update(1f / 60f, input);
                maxAccel = math.max(maxAccel, (car.S.VF - prev) * 60f);
                prev = car.S.VF;
            }
            Assert.Less(maxAccel, 7.5f, $"peak acceleration {maxAccel:F1} m/s² (tyre limit ≈ 6.2)");
            Assert.Greater(maxAccel, 3f, $"car does accelerate ({maxAccel:F1} m/s²)");
        }
    }
}
