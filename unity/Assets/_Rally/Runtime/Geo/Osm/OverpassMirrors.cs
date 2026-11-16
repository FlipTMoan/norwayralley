using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// Which Overpass mirror to ask (buildings.js). Some public mirrors hang for the whole timeout
    /// from some networks while another answers in half a second. Remember the one that answered
    /// last and ask it alone; when none is known (or it fails), race the live ones and keep the
    /// first to answer. A mirror that failed sits out for <see cref="PenaltyMs"/>; when every mirror
    /// failed the breaker opens for 60 s. Public instances allow two slots per client, so at most
    /// <see cref="MaxConcurrent"/> chunks are in flight.
    /// </summary>
    public sealed class OverpassMirrors
    {
        public static readonly string[] Endpoints =
        {
            "https://overpass-api.de/api/interpreter",
            "https://overpass.private.coffee/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter",
            "https://overpass.openstreetmap.fr/api/interpreter",
        };
        public const int AttemptTimeoutMs = 12000;   // the mirror that answered last time
        public const int RaceTimeoutMs = 20000;      // when racing the mirrors for a first answer
        public const double PenaltyMs = 120000;      // a mirror that failed is skipped for this long
        public const int MaxConcurrent = 2;

        /// <summary>One POST to one mirror: returns the response text or throws.</summary>
        public delegate Task<string> Ask(string endpoint, string body, int timeoutMs, CancellationToken ct);

        readonly Ask ask;
        readonly Func<double> now;
        readonly Dictionary<string, double> downUntil = new Dictionary<string, double>();
        readonly SemaphoreSlim slots = new SemaphoreSlim(MaxConcurrent, MaxConcurrent);
        public readonly CircuitBreaker Breaker;
        public string Preferred { get; private set; }

        public OverpassMirrors(Ask ask = null, Func<double> nowMs = null)
        {
            this.ask = ask ?? DefaultAsk;
            now = nowMs ?? (() => (DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds);
            Breaker = new CircuitBreaker(now);
        }

        /// <summary>Mirrors currently sitting out their penalty (diagnostics, as buildings.js <c>overpassState</c>).</summary>
        public List<string> Down()
        {
            var list = new List<string>();
            double t = now();
            foreach (var kv in downUntil) if (kv.Value > t) list.Add(kv.Key);
            return list;
        }

        static async Task<string> DefaultAsk(string endpoint, string body, int timeoutMs, CancellationToken ct)
            => System.Text.Encoding.UTF8.GetString(await Http.PostForm(endpoint, body, timeoutMs, ct));

        /// <summary>The answer text of the first mirror that returns one, or null when none did (and the breaker tripped).</summary>
        public async Task<string> Query(string query, CancellationToken ct)
        {
            if (Breaker.IsOpen) return null;
            await slots.WaitAsync(ct);
            try { return await QueryNow(query, ct); }
            finally { slots.Release(); }
        }

        async Task<string> QueryNow(string query, CancellationToken ct)
        {
            string body = OverpassQuery.Body(query);
            double t = now();
            var live = new List<string>();
            foreach (var e in Endpoints) if (!downUntil.TryGetValue(e, out var until) || until <= t) live.Add(e);
            var candidates = live.Count > 0 ? live : new List<string>(Endpoints);
            Exception lastError = null;

            // 1. The mirror that answered last time, on its own.
            var preferred = Preferred;
            if (preferred != null && candidates.Contains(preferred))
            {
                try { return await ask(preferred, body, AttemptTimeoutMs, ct); }
                catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
                catch (Exception e) { lastError = e; MarkDown(preferred, e); }
            }

            // 2. Race the others: the first good answer wins and cancels the rest.
            var racers = candidates.FindAll(e => e != preferred);
            if (racers.Count > 0)
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                var tasks = new List<Task<string>>(racers.Count);
                foreach (var endpoint in racers) tasks.Add(ask(endpoint, body, RaceTimeoutMs, cts.Token));
                var remaining = new List<Task<string>>(tasks);
                while (remaining.Count > 0)
                {
                    var done = await Task.WhenAny(remaining);
                    int i = tasks.IndexOf(done);
                    remaining.Remove(done);
                    if (done.Status == TaskStatus.RanToCompletion)
                    {
                        string winner = racers[i];
                        cts.Cancel(); // a loser cancelled by the winner is not "down"
                        if (Preferred != winner) RallyLog.Info($"overpass: using {winner}");
                        Preferred = winner;
                        Breaker.Reset();
                        return done.Result;
                    }
                    ct.ThrowIfCancellationRequested();
                    var error = done.Exception?.InnerException ?? done.Exception;
                    lastError = error;
                    MarkDown(racers[i], error);
                }
            }

            RallyLog.Warn($"map features unavailable: {lastError?.Message ?? "no endpoint answered"} — retrying in {CircuitBreaker.OpenMs / 1000} s");
            Breaker.Trip();
            return null;
        }

        void MarkDown(string endpoint, Exception error)
        {
            downUntil[endpoint] = now() + PenaltyMs;
            if (Preferred == endpoint) Preferred = null;
            RallyLog.Info($"overpass mirror failed ({endpoint}): {error?.Message}");
        }

        public void Reset() { Preferred = null; downUntil.Clear(); Breaker.Reset(); }
    }
}
