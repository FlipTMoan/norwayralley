using NUnit.Framework;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>CarDamage: hits map to systems, repair clears, and the sim reads the engine damage.</summary>
    public class DamageTests
    {
        [Test]
        public void AFrontalHitAt15MsWith450KgRaisesEngineAndLights()
        {
            var d = new CarDamage();
            d.Apply(new float3(0f, 0f, -1f), 15f, 450f); // the wall pushes the car back: normal −z in car space
            Assert.Greater(d.Engine, 0f);
            Assert.Greater(d.LightsL, 0f);
            Assert.Greater(d.LightsR, 0f);
            Assert.Greater(d.Radiator, 0f);
            Assert.AreEqual(0f, d.Steering);
            Assert.Greater(d.Total, 0f);
            Assert.IsFalse(d.Wrecked);
        }

        [Test]
        public void ALeftSideHitPullsTheSteeringLeftAndHurtsTheLeftSuspension()
        {
            var d = new CarDamage();
            d.Apply(new float3(1f, 0f, 0f), 10f, 1180f); // obstacle on the left pushes the car to +x
            Assert.Less(d.SteeringPull, 0f);
            Assert.Greater(d.Steering, 0f);
            Assert.Greater(d.SuspensionFL, 0f);
            Assert.Greater(d.SuspensionRL, 0f);
            Assert.AreEqual(0f, d.SuspensionFR);
            Assert.AreEqual(0f, d.SuspensionRR);
        }

        [Test]
        public void RepairClearsEverything()
        {
            var d = new CarDamage();
            d.Apply(new float3(0f, 0f, -1f), 30f, 1500f);
            d.Apply(new float3(-1f, 0f, 0f), 20f, 1500f);
            d.Apply(new float3(0f, 0f, 1f), 20f, 1500f);
            Assert.Greater(d.Total, 0.3f);
            d.Repair();
            Assert.AreEqual(0f, d.Total);
            Assert.AreEqual(0f, d.Engine);
            Assert.AreEqual(0f, d.SteeringPull);
            Assert.IsFalse(d.Wrecked);
        }

        static (float top, float at8s) Drive(float engineDamage)
        {
            var car = new TestCar(Worlds.FlatRoad());
            car.S.Damage.Engine = engineDamage;
            var input = TestCar.Input(1f);
            float top = 0f, at8 = 0f;
            for (int i = 0; i < 60 * 25; i++)
            {
                car.Update(1f / 60f, input);
                top = math.max(top, car.S.SpeedKmh);
                // Off the line both cars are tyre-limited (μ·DriveLoad·g ≈ 6.6 m/s² on asphalt); the weaker
                // engine only shows once power is the limit, above ~18 m/s for a 60 % damaged Porsche.
                if (i == 60 * 8) at8 = car.S.VF;
                if (car.S.Progress > 0.9f) break;
            }
            return (top, at8);
        }

        [Test]
        public void TopSpeedAndDriveForceDropWithEngineDamage()
        {
            var healthy = Drive(0f);
            var sick = Drive(0.6f);
            Assert.Less(sick.top, healthy.top * 0.8f, $"top {sick.top:F0} vs {healthy.top:F0} km/h");
            Assert.Less(sick.at8s, healthy.at8s, $"speed after 8 s {sick.at8s:F1} vs {healthy.at8s:F1} m/s");
        }

        [Test]
        public void AWreckedEngineStopsTheCar()
        {
            var car = new TestCar(Worlds.FlatRoad());
            var input = TestCar.Input(1f);
            for (int i = 0; i < 60 * 5; i++) car.Update(1f / 60f, input);
            Assert.Greater(car.Speed, 10f);
            car.S.Damage.Engine = 1f; car.S.Damage.Wrecked = true;
            for (int i = 0; i < 60 * 6; i++) car.Update(1f / 60f, input);
            Assert.Less(car.Speed, 0.5f, $"a wrecked car stops: {car.Speed:F2} m/s");
        }
    }
}
