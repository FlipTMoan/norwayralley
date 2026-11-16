using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>Port of legacy-js/tests/handling.test.mjs (the NVDB mapping test belongs to Rally.Roads).</summary>
    public class HandlingTests
    {
        struct Corner { public float YawPeak, SlidePeak; public int Dust; public Surface SurfaceKind; }

        /// <summary>Accelerate to `kmh`, then hold full steer for `seconds`; report the peak yaw rate and slide.</summary>
        static Corner Run(Surface surface, float kmh, float seconds, SlideMode mode = SlideMode.Loose)
        {
            var car = new TestCar(Worlds.FlatRoad(surface)) { Mode = mode };
            var drive = TestCar.Input(1f);
            for (int i = 0; i < 60 * 40 && car.S.SpeedKmh < kmh; i++) car.Update(1f / 60f, drive);
            var surfaceKind = car.S.SurfaceKind; // read on the straight, before the car leaves the road
            float yawPeak = 0f, slidePeak = 0f; int dust = 0;
            var turn = TestCar.Input(0.6f, 0f, 1f);
            for (int i = 0; i < 60 * seconds; i++)
            {
                car.Update(1f / 60f, turn);
                yawPeak = math.max(yawPeak, math.abs(car.S.YawVel));
                slidePeak = math.max(slidePeak, math.abs(car.S.VR));
                if (CarSim.WantDust(car.S)) dust++;
            }
            return new Corner { YawPeak = yawPeak, SlidePeak = slidePeak, Dust = dust, SurfaceKind = surfaceKind };
        }

        [Test]
        public void SteeringIsSpeedSensitiveNoTwitchingAt140()
        {
            var fast = Run(Surface.Asphalt, 140f, 0.6f);
            var slow = Run(Surface.Asphalt, 40f, 0.6f);
            Assert.AreEqual(Surface.Asphalt, fast.SurfaceKind);
            Assert.Less(fast.YawPeak, 0.42f, $"yaw rate at speed {fast.YawPeak:F2} rad/s");
            Assert.Greater(slow.YawPeak, fast.YawPeak * 1.6f, $"slow {slow.YawPeak:F2} vs fast {fast.YawPeak:F2}");
        }

        [Test]
        public void NormalGripTracksTheSteeringLooseModeSlides()
        {
            var normal = Run(Surface.Gravel, 70f, 0.6f, SlideMode.Normal);
            var loose = Run(Surface.Gravel, 70f, 0.6f, SlideMode.Loose);
            Assert.Less(normal.SlidePeak, 1.6f, $"normal mode slide {normal.SlidePeak:F2} m/s");
            Assert.Greater(loose.SlidePeak, normal.SlidePeak * 1.5f, $"loose {loose.SlidePeak:F2} vs normal {normal.SlidePeak:F2} m/s");
        }

        [Test]
        public void GravelSlidesMoreThanAsphaltAndOnlyGravelDusts()
        {
            var tarmac = Run(Surface.Asphalt, 70f, 0.6f);
            var gravel = Run(Surface.Gravel, 70f, 0.6f);
            Assert.AreEqual(Surface.Gravel, gravel.SurfaceKind);
            Assert.Greater(gravel.SlidePeak, tarmac.SlidePeak * 1.25f, $"slide gravel {gravel.SlidePeak:F2} vs asphalt {tarmac.SlidePeak:F2} m/s");
            Assert.AreEqual(0, tarmac.Dust, "asphalt throws no dust");
            Assert.Greater(gravel.Dust, 0, "gravel throws dust");
        }

        [Test]
        public void SlidingLevels0To3SlideProgressivelyMoreInTheSameCorner()
        {
            CollectionAssert.AreEqual(new[] { "minimal", "normal", "medium", "loose" }, GripMode.SlideLevels);
            var slides = new float[4];
            for (int i = 0; i < 4; i++) slides[i] = Run(Surface.Gravel, 80f, 1.2f, (SlideMode)i).SlidePeak;
            for (int i = 1; i < slides.Length; i++)
                Assert.GreaterOrEqual(slides[i], slides[i - 1] * 0.98f, $"level {i} ({slides[i]:F2}) slides at least as much as level {i - 1} ({slides[i - 1]:F2})");
            Assert.Greater(slides[3], slides[0] * 1.5f, $"loose ({slides[3]:F2}) well beyond minimal ({slides[0]:F2})");
        }
    }
}
