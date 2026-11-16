using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>Port of legacy-js/tests/road-physics.test.mjs (the carve staircase test belongs to the World's carve).</summary>
    public class RoadPhysicsTests
    {
        [Test]
        public void CarRidesOnTheRoadSurfaceWithoutSinkingOrSlidingOff()
        {
            var ground = Worlds.Road(Worlds.Sloped(1200f, 0.10f), 1200f, new Utm33(-150, -400), new Utm33(150, 400), 4.2f, Surface.Gravel);
            var car = new TestCar(ground);
            var input = TestCar.Input(1f);
            float worstSink = 0f, worstHover = 0f, maxSpeed = 0f; int offRoad = 0, simulated = 0;
            for (int i = 0; i < 60 * 25; i++)
            {
                car.Update(1f / 60f, input);
                simulated++;
                if (car.S.Progress > 0.9f) break; // stop before the car runs off the end
                float surface = car.GroundAt(car.S.Pos.x, car.S.Pos.z);
                worstSink = math.max(worstSink, surface - car.S.Pos.y);
                if (car.S.Grounded) worstHover = math.max(worstHover, car.S.Pos.y - surface);
                maxSpeed = math.max(maxSpeed, car.Speed);
                if (!car.S.OnRoad) offRoad++;
                for (int w = 0; w < 4; w++) Assert.IsTrue(car.S.WheelY[w] > 0.1f && car.S.WheelY[w] < 0.6f, "wheel travel stays in range");
            }
            float lateral = ground.Route.Nearest(car.S.Pos.xz).Distance;
            Assert.LessOrEqual(worstSink, 0.15f, $"body sank {worstSink:F3} m into the road");
            Assert.LessOrEqual(worstHover, 0.25f, $"body hovered {worstHover:F3} m above the road");
            Assert.Greater(maxSpeed, 30f, $"car only reached {maxSpeed * 3.6f:F0} km/h uphill");
            Assert.Less(offRoad, simulated * 0.02f, $"off the road for {offRoad} of {simulated} frames");
            Assert.Less(lateral, ground.Route.RoadWidth, $"drifted {lateral:F2} m from the centre line");
            Assert.Greater(car.S.RoadLift, 0.15f, "car rides on the ribbon lift when on the road");
        }
    }
}
