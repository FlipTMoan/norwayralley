using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>Port of legacy-js/tests/handbrake.test.mjs.</summary>
    public class HandbrakeTests
    {
        struct Slide { public float YawPeak, SlidePeak, RearTurned, FrontTurned; public int Smoke; }

        static TestCar CarOn(Surface surface)
        {
            var car = new TestCar(Worlds.FlatRoad(surface));
            var drive = TestCar.Input(1f);
            for (int i = 0; i < 60 * 40 && car.S.SpeedKmh < 70f; i++) car.Update(1f / 60f, drive);
            return car;
        }

        static Slide Run(TestCar car, bool handbrake, float seconds = 1.2f, float steer = 1f)
        {
            float rearSpin0 = car.S.RearSpin;
            float yawPeak = 0f, slidePeak = 0f; int smoke = 0;
            var turn = TestCar.Input(0.5f, 0f, steer, handbrake);
            for (int i = 0; i < 60 * seconds; i++)
            {
                car.Update(1f / 60f, turn);
                if (!car.S.OnRoad) break; // only judge what happens on the asphalt itself
                yawPeak = math.max(yawPeak, math.abs(car.S.YawVel));
                slidePeak = math.max(slidePeak, math.abs(car.S.VR));
                if (CarSim.WantDust(car.S)) smoke++;
            }
            return new Slide { YawPeak = yawPeak, SlidePeak = slidePeak, Smoke = smoke, RearTurned = math.abs(car.S.RearSpin - rearSpin0), FrontTurned = math.abs(car.S.WheelSpin) };
        }

        [Test]
        public void HandbrakeLocksTheRearWheelsAndThrowsTheCarIntoASlide()
        {
            var plain = Run(CarOn(Surface.Asphalt), false, 1.2f, 0.35f); // a normal corner
            var hb = Run(CarOn(Surface.Asphalt), true);
            Assert.Greater(hb.SlidePeak, plain.SlidePeak * 2f, $"slide {hb.SlidePeak:F2} vs {plain.SlidePeak:F2} m/s");
            Assert.Greater(hb.YawPeak, plain.YawPeak * 1.5f, $"yaw {hb.YawPeak:F2} vs {plain.YawPeak:F2} rad/s");
            Assert.AreEqual(0f, hb.RearTurned, "rear wheels stand still on the handbrake");
            Assert.Greater(hb.FrontTurned, 0f, "front wheels keep rolling");
            Assert.IsTrue(hb.Smoke > 0 && plain.Smoke == 0, "tyre smoke only while sliding on asphalt");
        }

        [Test]
        public void TheSlideCarriesOnForAMomentAfterTheHandbrakeIsReleased()
        {
            var car = CarOn(Surface.Gravel);
            Run(car, true, 0.6f);
            float during = math.abs(car.S.VR);
            var coast = TestCar.Input(0.5f);
            car.Update(1f / 60f, coast);
            Assert.Less(car.S.SlideGrip, 0.1f, "grip starts recovering from zero");
            for (int i = 0; i < 18; i++) car.Update(1f / 60f, coast); // 0.3 s later
            Assert.Greater(math.abs(car.S.VR), during * 0.35f, $"still sliding ({math.abs(car.S.VR):F2} of {during:F2} m/s)");
            for (int i = 0; i < 90; i++) car.Update(1f / 60f, coast);
            Assert.AreEqual(1f, car.S.SlideGrip, "grip fully back after ~0.7 s");
        }
    }
}
