using Rally.Track;
using Unity.Mathematics;

namespace Rally.Vehicle
{
    /// <summary>
    /// A pursuit driver that follows an <see cref="IRoute"/> at a target speed, what the JS test helpers
    /// (jump.test.mjs fly(): throttle while below the target) and the browser drive helpers did by hand.
    /// Pure, for EditMode / PlayMode tests and demos: aim at the point on the line a few car lengths
    /// ahead, steer by the heading error, throttle below the target speed, brake well above it.
    /// </summary>
    public sealed class ScriptedDriver
    {
        public float TargetKmh = 60f;
        /// <summary>Metres ahead along the line, plus half a second of travel.</summary>
        public float LookAhead = 12f;
        public float SteerGain = 1.5f;
        public SlideMode GripMode = SlideMode.Minimal;

        /// <summary>car.js test cruise: full throttle below the target, coast above it.</summary>
        public static CarInput Cruise(float speedKmh, float targetKmh, SlideMode mode = SlideMode.Minimal)
            => new CarInput { Throttle = speedKmh < targetKmh ? 1f : 0f, GripMode = mode };

        public CarInput Drive(in CarState s, IRoute route)
        {
            var input = Cruise(s.SpeedKmh, TargetKmh, GripMode);
            if (route == null) return input;
            var q = route.Nearest(s.Pos.xz, 120f);
            if (!q.Hit) return input;
            var target = route.SampleAtDistance(q.S + LookAhead + s.Speed * 0.5f);
            var to = target.XZ - s.Pos.xz;
            if (math.lengthsq(to) < 0.01f) return input;
            // Positive steer turns from +z towards +x, the same sense as atan2(dx, dz).
            float err = CarSim.WrapAngle(math.atan2(to.x, to.y) - s.Yaw);
            input.Steer = math.clamp(err * SteerGain, -1f, 1f);
            if (s.SpeedKmh > TargetKmh + 15f) input.Brake = 0.5f;
            return input;
        }
    }
}
