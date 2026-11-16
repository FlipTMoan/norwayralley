using NUnit.Framework;
using Rally.Geo;

namespace Rally.Tests.Geo
{
    public class CircuitBreakerTests
    {
        [Test]
        public void OpensForSixtySecondsAndSuggestsRetryAfterFortyFive()
        {
            double now = 1000;
            var b = new CircuitBreaker(() => now);
            Assert.IsFalse(b.IsOpen);
            b.Trip();
            Assert.IsTrue(b.IsOpen);
            Assert.AreEqual(60000, b.RemainingMs, 1e-9);
            Assert.AreEqual(1000 + 45000, b.NextRetryAt(), 1e-9);
            now += 59999;
            Assert.IsTrue(b.IsOpen);
            now += 2;
            Assert.IsFalse(b.IsOpen);
            Assert.AreEqual(0, b.RemainingMs);
            b.Trip();
            b.Reset();
            Assert.IsFalse(b.IsOpen, "an answer closes it at once");
        }
    }
}
