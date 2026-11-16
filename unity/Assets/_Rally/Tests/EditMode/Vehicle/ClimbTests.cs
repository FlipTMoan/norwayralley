using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>Port of legacy-js/tests/climb.test.mjs.</summary>
    public class ClimbTests
    {
        const float Deg = math.PI / 180f;

        /// <summary>Full throttle straight up a uniform gravel slope of `degrees`; metres gained in `seconds`.</summary>
        static float Climb(CarKind kind, float degrees, float seconds = 8f)
        {
            var ground = Worlds.Road(Worlds.Sloped(1200f, math.tan(degrees * Deg)), 1200f, new Utm33(0, -500), new Utm33(0, 500), 3.4f, Surface.Gravel);
            var car = new TestCar(ground, kind);
            float z0 = car.S.Pos.z;
            var drive = TestCar.Input(1f);
            for (int i = 0; i < 60 * seconds; i++) car.Update(1f / 60f, drive);
            return car.S.Pos.z - z0;
        }

        [Test]
        public void ThePorscheClimbs25ButCannotClimb35()
        {
            float ok = Climb(CarKind.Porsche, 25f);
            float no = Climb(CarKind.Porsche, 35f);
            Assert.Greater(ok, 15f, $"25°: gained {ok:F1} m");
            Assert.Less(no, 3f, $"35°: gained {no:F1} m (should slide back)");
        }

        [Test]
        public void TheBuggyClimbs70ButCannotClimb85()
        {
            float ok = Climb(CarKind.Buggy, 70f);
            float no = Climb(CarKind.Buggy, 85f);
            Assert.Greater(ok, 15f, $"70°: gained {ok:F1} m");
            Assert.Less(no, 3f, $"85°: gained {no:F1} m (should slide back)");
        }

        [Test]
        public void BothCarsStillAccelerateNormallyOnTheFlatAndOnA10DegreeHill()
        {
            foreach (var kind in new[] { CarKind.Porsche, CarKind.Buggy })
            {
                Assert.Greater(Climb(kind, 0f, 4f), 25f, $"{kind} flat");
                Assert.Greater(Climb(kind, 10f, 4f), 12f, $"{kind} 10°");
            }
        }
    }
}
