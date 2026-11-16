using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>Port of legacy-js/tests/ground-contact.test.mjs (the triSample test belongs to the HeightGrid).</summary>
    public class GroundContactTests
    {
        [Test]
        public void WheelsNeverRenderBelowTheGroundOnOrOffTheRoad()
        {
            const float size = 800f;
            var ground = Worlds.Road(Worlds.Rough(size, 81), size, new Utm33(-300, -300), new Utm33(300, 300), 3.2f, Surface.Gravel, assignRoadY: true);
            float worst = float.NegativeInfinity;
            foreach (var kind in new[] { CarKind.Porsche, CarKind.Buggy })
            {
                var car = new TestCar(ground, kind);
                for (int i = 0; i < 60 * 25; i++)
                {
                    // Weave on and off the road so the wheels meet raw slopes too.
                    float steer = math.sin(i / 90f) * 0.8f;
                    car.Update(1f / 60f, TestCar.Input(0.9f, 0f, steer));
                    if (math.abs(car.S.Pos.x) > size / 2f - 20f || math.abs(car.S.Pos.z) > size / 2f - 20f) break;
                    for (int w = 0; w < 4; w++)
                    {
                        var v = car.WheelPivotWorld(w);
                        float bottom = v.y - car.Spec.WheelRadius;
                        worst = math.max(worst, car.GroundAt(v.x, v.z) - bottom);
                    }
                }
            }
            Assert.Less(worst, 0.12f, $"a wheel sank {worst:F3} m below the ground");
        }
    }
}
