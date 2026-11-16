using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>Port of legacy-js/tests/crash.test.mjs (the box test and the car against a wall; the index is World's).</summary>
    public class CrashTests
    {
        [Test]
        public void PushOutOfBoxRespectsTheBoxRotationAndPushesOutOfTheNearestWall()
        {
            // A 20 × 6 m house turned 90°: its long side now runs along z.
            var box = new WallBox { X = 0, Z = 0, Yaw = math.PI / 2f, Hl = 10f, Hw = 3f };
            Assert.IsFalse(box.PushOut(0f, 20f, 1f, out _, out _, out _), "clear beyond the gable");
            Assert.IsFalse(box.PushOut(6f, 0f, 1f, out _, out _, out _), "clear beside the long wall (turned)");
            Assert.IsTrue(box.PushOut(3.5f, 0f, 1f, out float nx, out float nz, out float depth), "overlapping the long wall");
            Assert.IsTrue(math.abs(nx - 1f) < 1e-6f && math.abs(nz) < 1e-6f, $"normal {nx},{nz}");
            Assert.Less(math.abs(depth - 0.5f), 1e-6f, $"depth {depth}");
        }

        [Test]
        public void TheCarCannotDriveThroughAHouseItStopsAtTheWallWithACrashImpulse()
        {
            var ground = Worlds.Road(Worlds.Sloped(2400f, 0f), 2400f, new Utm33(0, -1100), new Utm33(0, 1100), 3.4f, Surface.Asphalt);
            var car = new TestCar(ground) { Walls = new[] { new WallBox { X = 0, Z = -900, Yaw = 0, Hl = 6, Hw = 4 } } }; // across the road, 200 m ahead
            var drive = TestCar.Input(1f);
            float crash = 0f, peak = 0f;
            for (int i = 0; i < 60 * 15; i++)
            {
                car.Update(1f / 60f, drive);
                peak = math.max(peak, car.Speed);
                crash = math.max(crash, car.S.Crash);
            }
            Assert.Greater(peak, 15f, $"reached {peak:F1} m/s before the wall");
            Assert.Greater(crash, 5f, $"crash impulse {crash:F1} m/s");
            Assert.Less(car.S.Pos.z, -904f - 1f, $"stopped on the near side of the wall (z = {car.S.Pos.z:F1})");
            Assert.Less(car.Speed, 3f, $"held against the wall at {car.Speed:F1} m/s");
        }
    }
}
