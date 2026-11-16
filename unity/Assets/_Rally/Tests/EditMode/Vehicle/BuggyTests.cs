using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>Port of legacy-js/tests/buggy.test.mjs.</summary>
    public class BuggyTests
    {
        static TestCar OnRoad(CarKind kind, float grade = 0f, Surface surface = Surface.Gravel)
        {
            var ground = Worlds.Road(Worlds.Sloped(2400f, grade), 2400f, new Utm33(0, -1100), new Utm33(0, 1100), 3.4f, surface, assignRoadY: true);
            return new TestCar(ground, kind);
        }

        static float ZeroToHundred(TestCar car)
        {
            var input = TestCar.Input(1f);
            for (int i = 0; i < 60 * 30; i++)
            {
                car.Update(1f / 60f, input);
                if (car.S.SpeedKmh >= 100f) return i / 60f;
            }
            return float.PositiveInfinity;
        }

        static float TopSpeed(TestCar car)
        {
            var input = TestCar.Input(1f);
            float top = 0f;
            for (int i = 0; i < 60 * 20; i++) { car.Update(1f / 60f, input); top = math.max(top, car.S.SpeedKmh); if (car.S.Progress > 0.9f) break; }
            return top;
        }

        [Test]
        public void TheBuggyIsADifferentMachineBigWheels4WDLaunch1200Hp()
        {
            var buggy = OnRoad(CarKind.Buggy);
            var porsche = OnRoad(CarKind.Porsche);
            Assert.AreEqual(CarKind.Buggy, buggy.Spec.Key);
            Assert.AreEqual(CarSpec.Buggy.WheelRadius, buggy.S.WheelY[0]);
            Assert.IsTrue(CarSpec.Buggy.WheelRadius > 0.6f && CarSpec.Buggy.Power >= 890000f);
            float tb = ZeroToHundred(buggy);
            float tp = ZeroToHundred(porsche);
            Assert.Less(tb, 6f, $"buggy 0-100 on gravel in {tb:F1} s");
            Assert.Less(tb, tp, $"buggy {tb:F1} s vs porsche {tp:F1} s");
        }

        [Test]
        public void GravityBitesOnA25PercentClimbThe911SlowsTheBuggyPowersOn()
        {
            float flat911 = TopSpeed(OnRoad(CarKind.Porsche));
            float hill911 = TopSpeed(OnRoad(CarKind.Porsche, 0.25f));
            float hillBuggy = TopSpeed(OnRoad(CarKind.Buggy, 0.25f));
            Assert.Less(hill911, flat911 * 0.8f, $"911 top {hill911:F0} km/h uphill vs {flat911:F0} flat");
            Assert.Greater(hillBuggy, hill911 * 1.2f, $"buggy {hillBuggy:F0} km/h vs 911 {hill911:F0} km/h on the climb");
        }
    }
}
