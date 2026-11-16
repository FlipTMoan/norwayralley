using System;

namespace Rally.Geo
{
    /// <summary>
    /// Stops hammering a service that just failed. buildings.js: after every Overpass mirror failed
    /// the service is skipped for <see cref="OpenMs"/> (60 s); stream.js: a chunk whose features did
    /// not arrive asks again after <see cref="RetryMs"/> (45 s). The clock is injectable for tests.
    /// </summary>
    public sealed class CircuitBreaker
    {
        public const double OpenMs = 60000;
        public const double RetryMs = 45000;

        readonly Func<double> now;
        double openUntil = double.NegativeInfinity;

        public CircuitBreaker(Func<double> nowMs = null) { now = nowMs ?? DefaultNow; }

        static double DefaultNow() => (DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;

        /// <summary>True while the service is considered down (buildings.js <c>overpassBlocked</c>).</summary>
        public bool IsOpen => now() < openUntil;

        /// <summary>Every attempt failed: skip the service for <see cref="OpenMs"/>.</summary>
        public void Trip() { openUntil = now() + OpenMs; }

        /// <summary>A service that answers again closes the breaker at once.</summary>
        public void Reset() { openUntil = double.NegativeInfinity; }

        /// <summary>When a consumer that got nothing should ask again (stream.js <c>osmRetryAt</c>).</summary>
        public double NextRetryAt() => now() + RetryMs;

        /// <summary>Milliseconds until the breaker closes (0 when closed).</summary>
        public double RemainingMs => Math.Max(0, openUntil - now());
    }
}
