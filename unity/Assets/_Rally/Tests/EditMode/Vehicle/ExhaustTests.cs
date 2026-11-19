using NUnit.Framework;
using Rally.Vehicle;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>CarExhaust.Look: throttle and rpm to emission rate, size and colour; a faint idle haze; more and whiter when cold.</summary>
    public class ExhaustTests
    {
        [Test]
        public void IdleIsAFaintHaze()
        {
            var idle = CarExhaust.Look(0f, 0.1f, 0f);
            Assert.That(idle.Rate, Is.InRange(4f, 8f));
            Assert.Less(idle.Alpha, 0.2f);
            Assert.Less(idle.Size, 0.25f);
        }

        [Test]
        public void RateAndSizeGrowWithThrottleAndRpm()
        {
            var part = CarExhaust.Look(0.5f, 0.5f, 0f);
            var full = CarExhaust.Look(1f, 1f, 0f);
            var lowRev = CarExhaust.Look(1f, 0.2f, 0f);
            Assert.Greater(part.Rate, CarExhaust.Look(0f, 0.5f, 0f).Rate);
            Assert.Greater(full.Rate, part.Rate);
            Assert.Greater(full.Rate, lowRev.Rate, "the same throttle at higher rpm pushes more gas");
            Assert.That(full.Rate, Is.InRange(35f, 45f));
            Assert.Greater(full.Size, part.Size);
            Assert.Greater(full.Alpha, part.Alpha);
            Assert.Less(full.Grey, part.Grey, "a loaded engine's smoke is darker");
        }

        [Test]
        public void ColdEngineSmokesMoreAndWhiter()
        {
            var cold = CarExhaust.Look(0f, 0.1f, 1f);
            var warm = CarExhaust.Look(0f, 0.1f, 0f);
            Assert.Greater(cold.Rate, warm.Rate * 1.5f);
            Assert.Greater(cold.Grey, 0.85f);
            Assert.Greater(cold.Life, warm.Life);
        }
    }
}
