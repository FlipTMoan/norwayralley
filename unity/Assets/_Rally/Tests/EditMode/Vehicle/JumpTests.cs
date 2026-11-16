using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>Port of legacy-js/tests/jump.test.mjs.</summary>
    public class JumpTests
    {
        struct Flight { public float Longest, Clearance; public int Takeoffs; public TestCar Car; }

        /// <summary>Hold `kmh` along the road from z0; report the longest flight, the highest clearance and the take-offs.</summary>
        static Flight Fly(float kmh, float z0, float metres)
        {
            // A road straight over the crest and the jump: off the road the car is held to 50 km/h.
            var ground = Worlds.Road(Worlds.Crest(), 1200f, new Utm33(0, -500), new Utm33(0, 500), 3.4f, Surface.Gravel);
            var car = new TestCar(ground);
            car.Reset(0f, z0, 0f);
            car.S.VF = kmh / 3.6f;
            float flight = 0f, longest = 0f, clearance = 0f; int takeoffs = 0; bool wasGrounded = true;
            int guard = 0;
            while (car.S.Pos.z < z0 + metres && guard++ < 60 * 120)
            {
                car.Update(1f / 60f, ScriptedDriver.Cruise(car.S.SpeedKmh, kmh));
                if (!car.S.Grounded) { flight += 1f / 60f; clearance = math.max(clearance, car.S.Pos.y - ground.Base(car.S.Pos.xz)); }
                else flight = 0f;
                longest = math.max(longest, flight);
                if (wasGrounded && !car.S.Grounded) takeoffs++;
                wasGrounded = car.S.Grounded;
                if (car.Speed < 1f) break;
            }
            return new Flight { Longest = longest, Clearance = clearance, Takeoffs = takeoffs, Car = car };
        }

        [Test]
        public void ACrestHoldsTheCarAt20AndLaunchesItAt100()
        {
            var slow = Fly(20f, -60f, 120f);
            Assert.Less(slow.Longest, 0.05f, $"slow car stays on the ground: {slow.Longest:F2} s airborne");
            var fast = Fly(100f, -60f, 120f);
            Assert.Greater(fast.Longest, 0.4f, $"fast car flies off the crest: {fast.Longest:F2} s");
            Assert.Greater(fast.Clearance, 0.5f, $"and clears the ground: {fast.Clearance:F2} m");
        }

        [Test]
        public void ATableTopSendsTheCarFurtherTheFasterItGoes()
        {
            var a = Fly(60f, 200f, 200f);
            var b = Fly(120f, 200f, 200f);
            Assert.Greater(a.Longest, 0.5f, $"60 km/h: {a.Longest:F2} s in the air");
            Assert.Greater(b.Longest, a.Longest, $"120 km/h flies longer: {b.Longest:F2} s vs {a.Longest:F2} s");
        }

        [Test]
        public void TheCarLeavesTheGroundOncePerJumpAndStaysDownAfterLanding()
        {
            // The ramp must hold the car until its lip (no hop on the way up) and the landing must spend the
            // lift (no trampoline off the flat ground beyond).
            foreach (var kmh in new[] { 60f, 120f })
            {
                var run = Fly(kmh, 200f, 200f);
                Assert.AreEqual(1, run.Takeoffs, $"{kmh} km/h over the table-top: {run.Takeoffs} take-offs");
            }
            var crest = Fly(100f, -60f, 120f);
            Assert.AreEqual(1, crest.Takeoffs, $"crest at 100 km/h: {crest.Takeoffs} take-offs");
        }
    }
}
