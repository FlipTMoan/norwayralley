using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>
    /// Plan "Off road: wheelspin and mud": the driven wheels spin up when the drive asks for more than the ground gives
    /// (more power or less grip spins more; off road most, gravel less, asphalt only past the limit), each car differently
    /// (the 911 and the Volvo easily, the buggies and the Ranger less but still), the revs flare and the wheels turn faster
    /// than the ground, less power reaches the ground, and the mud thrown follows the slip — none on asphalt at steady speed.
    /// </summary>
    public class WheelspinTests
    {
        const float Dt = 1f / 60f;

        /// <summary>Full throttle from rest for <paramref name="secs"/>: the largest wheelspin seen (m/s).</summary>
        static float LaunchSlip(CarKind k, Surface surface, float secs = 1.5f, System.Action<TestCar> tweak = null)
        {
            var car = Launch(k, surface, tweak);
            float max = 0f;
            for (int i = 0; i < secs * 60; i++) { car.Update(Dt, TestCar.Input(1f)); max = math.max(max, math.abs(car.S.WheelSlip)); }
            return max;
        }

        /// <summary>A car at rest off the road (offroad), or on a straight road of that surface.</summary>
        static TestCar Launch(CarKind k, Surface surface, System.Action<TestCar> tweak = null)
        {
            var car = new TestCar(Worlds.FlatRoad(surface == Surface.Offroad ? Surface.Gravel : surface), k);
            tweak?.Invoke(car);
            car.Reset(surface == Surface.Offroad ? 80f : 0f, -1400f, 0f);
            car.Update(Dt, TestCar.Input(0f));
            Assert.AreEqual(surface, car.S.SurfaceKind, $"{k} starts on {surface}");
            return car;
        }

        [Test]
        public void SlipGrowsWithPowerAndFallsWithGripOnEverySurface()
        {
            var spec = CarSpec.Porsche;
            foreach (var surf in new[] { SurfaceModel.Asphalt, SurfaceModel.Gravel, SurfaceModel.Offroad })
            {
                Assert.AreEqual(0f, CarSim.SlipTarget(spec, surf, 0f, 5f), "no drive, no spin");
                Assert.AreEqual(0f, CarSim.SlipTarget(spec, surf, 2.5f, 5f), "well inside the grip, no spin");
                Assert.Greater(CarSim.SlipTarget(spec, surf, 20f, 5f), CarSim.SlipTarget(spec, surf, 10f, 5f), "more power spins more");
                Assert.Less(CarSim.SlipTarget(spec, surf, 10f, 8f), CarSim.SlipTarget(spec, surf, 10f, 5f), "more grip spins less");
            }
            // Loose ground lets go before the tyre's limit; asphalt only past it.
            Assert.AreEqual(0f, CarSim.SlipTarget(spec, SurfaceModel.Asphalt, 4.5f, 5f));
            Assert.Greater(CarSim.SlipTarget(spec, SurfaceModel.Offroad, 4.5f, 5f), CarSim.SlipTarget(spec, SurfaceModel.Gravel, 4.5f, 5f));
            Assert.Greater(CarSim.SlipTarget(spec, SurfaceModel.Gravel, 4.5f, 5f), 0f);
            Assert.Greater(CarSim.SlipTarget(spec, SurfaceModel.Gravel, 10f, 5f), CarSim.SlipTarget(spec, SurfaceModel.Asphalt, 10f, 5f));
            // Knobbly tyres spin less for the same ask.
            Assert.Less(CarSim.SlipTarget(CarSpec.Ranger, SurfaceModel.Offroad, 10f, 5f), CarSim.SlipTarget(spec, SurfaceModel.Offroad, 10f, 5f));
        }

        [Test]
        public void OffRoadThe911AndTheVolvoSpinEasilyTheBuggiesAndTheRangerLessButStill()
        {
            var slip = new System.Collections.Generic.Dictionary<CarKind, float>();
            var log = new System.Text.StringBuilder();
            foreach (var k in Garage.Choosable) { slip[k] = LaunchSlip(k, Surface.Offroad); log.Append($"{k} {slip[k]:F1}  "); }
            TestContext.WriteLine("off-road launch slip (m/s): " + log);
            foreach (var easy in new[] { CarKind.Porsche, CarKind.Volvo240 })
                foreach (var grippy in new[] { CarKind.Ranger, CarKind.Baja, CarKind.Type736 })
                    Assert.Greater(slip[easy], slip[grippy] * 1.5f, $"{easy} spins more than {grippy}: {log}");
            foreach (var k in Garage.Choosable) Assert.Greater(slip[k], 0.8f, $"{k} still spins off road: {log}");
        }

        [Test]
        public void EveryCarSpinsMostOffRoadLessOnGravelLeastOnAsphalt()
        {
            foreach (var k in Garage.Choosable)
            {
                float off = LaunchSlip(k, Surface.Offroad), gravel = LaunchSlip(k, Surface.Gravel), asphalt = LaunchSlip(k, Surface.Asphalt);
                string m = $"{k}: off road {off:F1}, gravel {gravel:F1}, asphalt {asphalt:F1} m/s";
                Assert.Greater(off, gravel, m);
                Assert.Greater(gravel, asphalt, m);
            }
        }

        [Test]
        public void WhileTheWheelsSpinTheRevsFlareAndTheWheelsTurnFasterThanTheGround()
        {
            var car = Launch(CarKind.Porsche, Surface.Offroad);
            float spin0 = car.S.RearSpin, front0 = car.S.WheelSpin;
            for (int i = 0; i < 40; i++) car.Update(Dt, TestCar.Input(1f));
            var spec = car.Spec;
            float groundRpm = math.abs(car.S.VF) / (2f * math.PI * spec.WheelRadius) * 60f * spec.GearRatio(car.S.Gear) * spec.FinalDrive;
            Assert.Greater(car.S.WheelSlip, 3f, "spinning");
            Assert.Greater(car.S.Rpm, groundRpm * 1.3f, $"revs {car.S.Rpm:F0} over the ground's {groundRpm:F0}");
            Assert.LessOrEqual(car.S.Rpm, spec.Redline, "never past the redline");
            float rear = car.S.RearSpin - spin0, front = car.S.WheelSpin - front0;
            Assert.Greater(rear, front * 1.3f, "the driven rears turn faster than the rolling fronts");
        }

        [Test]
        public void LessPowerReachesTheGroundWhileTheWheelsSpin()
        {
            float SpeedAfter(float spin)
            {
                var car = Launch(CarKind.Porsche, Surface.Offroad, c => c.Spec.Spin = spin);
                for (int i = 0; i < 90; i++) car.Update(Dt, TestCar.Input(1f));
                return car.S.Speed;
            }
            float grippy = SpeedAfter(0f), spinning = SpeedAfter(1f);
            Assert.Less(spinning, grippy * 0.99f, $"1.5 s off road: {spinning:F2} m/s spinning, {grippy:F2} without wheelspin");
            Assert.Greater(spinning, grippy * 0.88f, "still drives away");
        }

        [Test]
        public void NoSlipAndNoMudOnAsphaltAtSteadySpeed()
        {
            foreach (var k in Garage.Choosable)
            {
                var car = Launch(k, Surface.Asphalt);
                float maxSlip = 0f;
                for (int i = 0; i < 60 * 40; i++)
                {
                    // A steady part throttle that holds 100 km/h (ScriptedDriver.Cruise is full throttle in bursts).
                    car.Update(Dt, TestCar.Input(math.saturate(0.3f + (100f - car.S.SpeedKmh) * 0.1f)));
                    if (i > 60 * 30) maxSlip = math.max(maxSlip, math.abs(car.S.WheelSlip));
                }
                Assert.Less(math.abs(car.S.SpeedKmh - 100f), 8f, $"{k} cruising");
                Assert.Less(maxSlip, 0.01f, $"{k}: no wheelspin at a steady 100 km/h");
                var look = CarMud.Look(car.S.SurfaceKind, car.S.WheelSlip, car.S.VF + car.S.WheelSlip, car.S.WaterDepth, car.S.Spraying, car.S.Speed);
                Assert.AreEqual(0f, look.Rate, $"{k}: nothing thrown");
            }
            // Full throttle at speed (the power limit, not the tyres): no slip either.
            var fast = Launch(CarKind.Porsche, Surface.Asphalt);
            for (int i = 0; i < 60 * 30; i++) fast.Update(Dt, TestCar.Input(1f));
            Assert.Greater(fast.S.SpeedKmh, 150f);
            Assert.Less(math.abs(fast.S.WheelSlip), 0.01f, $"flat out at {fast.S.SpeedKmh:F0} km/h");
        }

        [Test]
        public void MudFollowsTheSlipAndTheGround()
        {
            foreach (var surf in new[] { Surface.Offroad, Surface.Gravel })
            {
                Assert.AreEqual(0f, CarMud.Look(surf, 0f, 15f, 0f, false, 15f).Rate, $"{surf}: rolling, no slip, nothing thrown");
                float a = CarMud.Look(surf, 2f, 6f, 0f, false, 4f).Rate, b = CarMud.Look(surf, 6f, 10f, 0f, false, 4f).Rate;
                Assert.Greater(a, 0f, surf.ToString()); Assert.Greater(b, a, $"{surf}: more slip, more mud");
                Assert.LessOrEqual(CarMud.Look(surf, 40f, 60f, 0f, false, 20f).Rate, CarMud.MaxRate, "capped");
            }
            Assert.AreEqual(CarMud.Kind.Mud, CarMud.Look(Surface.Offroad, 5f, 8f, 0f, false, 3f).Kind);
            Assert.AreEqual(CarMud.Kind.Stones, CarMud.Look(Surface.Gravel, 5f, 8f, 0f, false, 3f).Kind);
            Assert.Greater(CarMud.Look(Surface.Offroad, 5f, 8f, 0f, false, 3f).Rate, CarMud.Look(Surface.Gravel, 5f, 8f, 0f, false, 3f).Rate, "mud flies more than stones");
            // Asphalt: a little smoke only when the wheels really spin.
            Assert.AreEqual(CarMud.Kind.None, CarMud.Look(Surface.Asphalt, 2f, 6f, 0f, false, 4f).Kind);
            var smoke = CarMud.Look(Surface.Asphalt, 6f, 8f, 0f, false, 2f);
            Assert.AreEqual(CarMud.Kind.Smoke, smoke.Kind); Assert.Greater(smoke.Rate, 0f);
            Assert.Less(smoke.Rate, CarMud.Look(Surface.Offroad, 6f, 8f, 0f, false, 2f).Rate);
            // Water: a splash from the spinning wheels and spray when wading at speed.
            Assert.AreEqual(CarMud.Kind.Water, CarMud.Look(Surface.Offroad, 4f, 6f, 0.3f, false, 2f).Kind);
            Assert.Greater(CarMud.Look(Surface.Offroad, 0f, 8f, 0.3f, true, 8f).Rate, 0f, "spray while wading");
        }

        [Test]
        public void TheMudInTheSimFollowsTheWheelspin()
        {
            var car = Launch(CarKind.Porsche, Surface.Offroad);
            float Rate() => CarMud.Look(car.S.SurfaceKind, car.S.WheelSlip, car.S.VF + car.S.WheelSlip, car.S.WaterDepth, car.S.Spraying, car.S.Speed).Rate;
            Assert.AreEqual(0f, Rate(), "at rest");
            for (int i = 0; i < 30; i++) car.Update(Dt, TestCar.Input(1f));
            float floored = Rate();
            Assert.Greater(floored, 20f, $"floored off road: {floored:F0}/s, slip {car.S.WheelSlip:F1}");
            for (int i = 0; i < 60; i++) car.Update(Dt, TestCar.Input(0f));
            Assert.Less(math.abs(car.S.WheelSlip), 0.3f, "off the throttle the wheels hook up");
            Assert.AreEqual(0f, Rate(), "and stop throwing mud");
        }
    }
}
