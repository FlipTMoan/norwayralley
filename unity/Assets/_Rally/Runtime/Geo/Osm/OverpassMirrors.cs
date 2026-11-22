using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// Which Overpass mirror answers which query, from their measured health. Measured 2026-11-22 from one machine: one
    /// mirror answered a road region in 1.6 s, the main one queued 40 s or refused (502), two hung for a minute; another
    /// day it is the other way round. So each mirror keeps its own running answer time (<see cref="Mirror.AvgMs"/>), its own
    /// pause after a failure (<see cref="PauseMs"/>, doubling while it keeps failing) and its own request slots
    /// (<see cref="SlotsOf"/>: the public instances allow two per client, dresel.systems four): a hung mirror holds only its
    /// own slots, and the other mirrors keep working — different queries go to different mirrors at the same time.
    /// <list type="bullet">
    /// <item>A mirror nobody has heard from (session start, after its pause) first gets a tiny probe query, not a 4 MB one.</item>
    /// <item>A query goes to the free mirror with the lowest running answer time; road regions (<see cref="Priority.Roads"/>)
    /// before features.</item>
    /// <item>The same query is not raced on several mirrors (that doubles the load on servers already at capacity), except as
    /// a hedge: no answer after <see cref="HedgeFactor"/> × the mirror's usual time, and the next free healthy mirror is asked
    /// too; the first answer wins and the other is cancelled (not counted as a failure).</item>
    /// <item>A failure, an answer slower than <see cref="SlowMs"/> or an answer with an Overpass runtime error pauses that
    /// mirror only, and the query goes on to the next one. Only when every mirror is paused does the service breaker open.</item>
    /// </list>
    /// </summary>
    public sealed class OverpassMirrors
    {
        /// <summary>
        /// The public servers without a key (OSM wiki list, tested 2026-11-22), in the order tried while none is measured:
        /// openstreetmap.fr (fast), ovp.dresel.systems (Europe, data a day old, 4 parallel per client), overpass-api.de (FOSSGIS,
        /// often queued or "at capacity"), maps.mail.ru (16–48 s), private.coffee (rarely answers; overpass.kumi.systems is its
        /// old name, the same server, so not listed twice).
        /// </summary>
        public static readonly string[] Endpoints =
        {
            "https://overpass.openstreetmap.fr/api/interpreter",
            "https://ovp.dresel.systems/api/interpreter",
            "https://overpass-api.de/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
            "https://overpass.private.coffee/api/interpreter",
        };
        /// <summary>The public limit per client: two parallel queries (dresel.systems allows four).</summary>
        public static int SlotsOf(string url) => url.Contains("dresel.systems") ? 4 : 2;
        /// <summary>
        /// The first pause of a failing mirror (overpass-api.de asks for 30 s after a 429 / 406); it doubles per failure in a
        /// row up to <see cref="MaxPauseMs"/>.
        /// </summary>
        public const double PauseMs = 30000, MaxPauseMs = 240000;
        /// <summary>An answer that took longer than this pauses the mirror too (a 40 s queue): the others are faster then.</summary>
        public const double SlowMs = 15000;
        public const int ProbeTimeoutMs = 8000;
        /// <summary>A mirror with no measured answer yet (only its probe): its first real query may take this long.</summary>
        public const int FirstTimeoutMs = 20000;
        public const int MinTimeoutMs = 10000, MaxTimeoutMs = 30000;
        public const double HedgeFactor = 3, MinHedgeMs = 1500, DefaultHedgeMs = 4000;
        /// <summary>A tiny query that tells whether a mirror answers at all.</summary>
        public const string ProbeQuery = "[out:json][timeout:5];node(1);out ids;";

        public enum Priority { Roads = 0, Features = 1 }

        /// <summary>One POST to one mirror: returns the response text or throws.</summary>
        public delegate Task<string> Ask(string endpoint, string body, int timeoutMs, CancellationToken ct);

        /// <summary>What the game knows of one mirror.</summary>
        public sealed class Mirror
        {
            public string Url;
            /// <summary>Running answer time of real queries (ms), NaN before the first.</summary>
            public double AvgMs = double.NaN;
            public double DownUntil = double.NegativeInfinity;
            public int Fails, InFlight, Answers;
            public bool Probed, Probing;
            public override string ToString() => $"{Host(Url)} {(double.IsNaN(AvgMs) ? "-" : (AvgMs / 1000).ToString("0.0", System.Globalization.CultureInfo.InvariantCulture) + " s")} ({Answers} answers, {Fails} failures in a row{(InFlight > 0 ? $", {InFlight} busy" : "")})";
        }

        readonly Ask ask;
        readonly Func<double> now;
        readonly List<Mirror> mirrors = new List<Mirror>();
        public readonly CircuitBreaker Breaker;
        /// <summary>The wait before a hedge (a test steps it by hand).</summary>
        public Func<double, CancellationToken, Task> Delay = (ms, ct) => Task.Delay(TimeSpan.FromMilliseconds(ms), ct);

        sealed class Waiter
        {
            public int Priority; public long Seq; public HashSet<Mirror> Tried; public bool Hedge;
            public readonly TaskCompletionSource<Mirror> Done = new TaskCompletionSource<Mirror>();
        }
        readonly List<Waiter> waiters = new List<Waiter>();
        long seq;

        public OverpassMirrors(Ask ask = null, Func<double> nowMs = null)
        {
            this.ask = ask ?? DefaultAsk;
            now = nowMs ?? (() => (DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds);
            Breaker = new CircuitBreaker(now);
            foreach (var e in Endpoints) mirrors.Add(new Mirror { Url = e });
        }

        public IReadOnlyList<Mirror> All => mirrors;

        /// <summary>The healthy mirror with the lowest running answer time (null when none has answered a real query).</summary>
        public string Preferred
        {
            get
            {
                Mirror best = null;
                foreach (var m in mirrors) if (Usable(m) && !double.IsNaN(m.AvgMs) && (best == null || m.AvgMs < best.AvgMs)) best = m;
                return best?.Url;
            }
        }

        /// <summary>Mirrors currently sitting out their pause (diagnostics, as buildings.js <c>overpassState</c>).</summary>
        public List<string> Down()
        {
            var list = new List<string>();
            double t = now();
            foreach (var m in mirrors) if (m.DownUntil > t) list.Add(m.Url);
            return list;
        }

        /// <summary>One line per mirror for the log: answer time, answers, failures.</summary>
        public string Health()
        {
            var sb = new StringBuilder();
            double t = now();
            foreach (var m in mirrors) sb.Append(sb.Length > 0 ? "; " : "").Append(m).Append(m.DownUntil > t ? $" paused {Math.Ceiling((m.DownUntil - t) / 1000)} s" : "");
            return sb.ToString();
        }

        static string Host(string url) { var u = url.Substring(url.IndexOf("//", StringComparison.Ordinal) + 2); return u.Substring(0, u.IndexOf('/')); }

        static async Task<string> DefaultAsk(string endpoint, string body, int timeoutMs, CancellationToken ct)
            => System.Text.Encoding.UTF8.GetString(await Http.PostForm(endpoint, body, timeoutMs, ct));

        bool Up(Mirror m) => m.DownUntil <= now();
        bool Usable(Mirror m) => Up(m) && (m.Probed || m.Answers > 0);

        /// <summary>
        /// The answer text of a mirror, or null when none could answer (every mirror tried failed; when every mirror is
        /// paused the breaker opens). Road regions pass <see cref="Priority.Roads"/> and go before waiting feature queries.
        /// </summary>
        public async Task<string> Query(string query, CancellationToken ct, Priority priority = Priority.Features)
        {
            if (Breaker.IsOpen) return null;
            string body = OverpassQuery.Body(query);
            var tried = new HashSet<Mirror>();
            Exception lastError = null;
            // Every mirror paused (the breaker has just closed again): probe them all, as buildings.js tried them all again.
            ProbeNew(everyPaused: true);
            for (;;)
            {
                var m = await Acquire((int)priority, tried, false, ct);
                if (m == null) break;
                tried.Add(m);
                var (text, error) = await AskHedged(m, body, (int)priority, tried, ct);
                if (text != null) { Breaker.Reset(); return text; }
                lastError = error ?? lastError;
            }
            ct.ThrowIfCancellationRequested();
            bool allDown = true;
            foreach (var m in mirrors) if (Up(m)) allDown = false;
            RallyLog.Warn($"overlay: Overpass gave no answer ({lastError?.Message ?? "no mirror free"}); {Health()}");
            if (allDown) Breaker.Trip();
            return null;
        }

        /// <summary>The chosen mirror, and a hedge on the next free healthy one when it is slow: the first answer wins.</summary>
        async Task<(string, Exception)> AskHedged(Mirror m, string body, int priority, HashSet<Mirror> tried, CancellationToken ct)
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            var first = Run(m, body, cts.Token);
            var hedgeWait = Delay(HedgeMs(m), cts.Token);
            var done = await Task.WhenAny(first, hedgeWait);
            if (done == first) { cts.Cancel(); return await first; }
            // The hedge takes the next slot that frees on another healthy mirror (all of them may be busy right now), unless the
            // first answer comes before that.
            var hedgeSlot = Acquire(priority, tried, false, cts.Token);
            if (await Task.WhenAny(first, hedgeSlot) == first || hedgeSlot.Status != TaskStatus.RanToCompletion || hedgeSlot.Result == null)
            {
                var r = await first;
                cts.Cancel();   // drops the hedge's place in the queue
                if (hedgeSlot.Status == TaskStatus.RanToCompletion && hedgeSlot.Result != null) { hedgeSlot.Result.InFlight--; Pump(); }
                return r;
            }
            var other = hedgeSlot.Result;
            tried.Add(other);
            RallyLog.Info($"overlay: overpass {Host(m.Url)} slow (no answer in {HedgeMs(m) / 1000:0.0} s), also asking {Host(other.Url)}");
            var second = Run(other, body, cts.Token);
            var pending = new List<Task<(string, Exception)>> { first, second };
            (string, Exception) result = (null, null);
            while (pending.Count > 0)
            {
                var t = await Task.WhenAny(pending);
                pending.Remove(t);
                result = t.Result;
                if (result.Item1 != null) break;
            }
            cts.Cancel();   // the loser, cancelled by the winner, is not "down"
            return result;
        }

        double HedgeMs(Mirror m)
        {
            if (!double.IsNaN(m.AvgMs)) return Math.Max(MinHedgeMs, HedgeFactor * m.AvgMs);
            double best = double.NaN;
            foreach (var o in mirrors) if (Usable(o) && !double.IsNaN(o.AvgMs) && (double.IsNaN(best) || o.AvgMs < best)) best = o.AvgMs;
            return double.IsNaN(best) ? DefaultHedgeMs : Math.Max(MinHedgeMs, HedgeFactor * best);
        }

        int TimeoutMs(Mirror m) => double.IsNaN(m.AvgMs) ? FirstTimeoutMs : (int)Math.Min(MaxTimeoutMs, Math.Max(MinTimeoutMs, 5 * m.AvgMs));

        /// <summary>One real query on a mirror whose slot is held; frees the slot. (text, null), or (null, error); null, null when cancelled.</summary>
        async Task<(string, Exception)> Run(Mirror m, string body, CancellationToken ct)
        {
            double t0 = now();
            try
            {
                var text = await ask(m.Url, body, TimeoutMs(m), ct);
                double ms = now() - t0;
                var error = RuntimeError(text);
                if (error != null) { MarkDown(m, new Exception(error)); return (null, new Exception(error)); }
                if (ms > SlowMs)
                {
                    // The answer is good and kept, but the mirror sits out: the next queries go to faster ones.
                    MarkDown(m, new Exception($"answered after {ms / 1000:0} s"));
                    return (text, null);
                }
                bool wasBest = Preferred == m.Url;
                m.AvgMs = double.IsNaN(m.AvgMs) ? ms : 0.7 * m.AvgMs + 0.3 * ms;
                m.Answers++; m.Fails = 0;
                if (!wasBest && Preferred == m.Url) RallyLog.Info($"overlay: overpass fastest now {Host(m.Url)}; {Health()}");
                return (text, null);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { return (null, null); }
            catch (Exception e)
            {
                if (ct.IsCancellationRequested) return (null, null);
                MarkDown(m, e);
                return (null, e);
            }
            finally { m.InFlight--; Pump(); }
        }

        /// <summary>
        /// Overpass answers 200 with a <c>remark</c> when the query ran out of time or memory: the elements are then cut
        /// short (half a road network). Such an answer is a failure, not data.
        /// </summary>
        public static string RuntimeError(string text)
        {
            if (text == null) return "no answer";
            int from = Math.Max(0, text.Length - 2048);
            int i = text.IndexOf("\"remark\"", from, StringComparison.Ordinal);
            if (i < 0) return null;
            int end = text.IndexOf('\n', i); if (end < 0) end = text.Length;
            string remark = text.Substring(i, Math.Min(end - i, 200));
            return remark.Contains("error") ? "Overpass " + remark : null;
        }

        /// <summary>
        /// A slot on a usable mirror not in <paramref name="tried"/>, best (lowest answer time) first; probes the mirrors not
        /// heard from. With <paramref name="now_"/> only one free now (a hedge), else null. Null when no mirror can serve.
        /// </summary>
        Task<Mirror> Acquire(int priority, HashSet<Mirror> tried, bool now_, CancellationToken ct)
        {
            ProbeNew(everyPaused: false);
            var w = new Waiter { Priority = priority, Seq = seq++, Tried = tried, Hedge = now_ };
            waiters.Add(w);
            Pump();
            if (now_ && !w.Done.Task.IsCompleted) { waiters.Remove(w); return Task.FromResult<Mirror>(null); }
            if (w.Done.Task.IsCompleted) return w.Done.Task;
            return WaitFor(w, ct);
        }

        async Task<Mirror> WaitFor(Waiter w, CancellationToken ct)
        {
            using (ct.Register(() => { if (waiters.Remove(w)) w.Done.TrySetCanceled(); }))
            {
                var m = await w.Done.Task;
                return m;
            }
        }

        /// <summary>Probe every mirror that is up and not heard from yet (with <paramref name="everyPaused"/> and every mirror paused, all of them).</summary>
        void ProbeNew(bool everyPaused)
        {
            bool anyUp = false;
            foreach (var m in mirrors) if (Up(m)) anyUp = true;
            foreach (var m in mirrors)
            {
                if (m.Probing || m.Probed || m.Answers > 0) continue;
                if (!Up(m) && (anyUp || !everyPaused)) continue;
                if (m.InFlight >= SlotsOf(m.Url)) continue;
                _ = Probe(m);
            }
        }

        async Task Probe(Mirror m)
        {
            m.Probing = true; m.InFlight++;
            double t0 = now();
            try
            {
                var text = await ask(m.Url, OverpassQuery.Body(ProbeQuery), ProbeTimeoutMs, CancellationToken.None);
                if (RuntimeError(text) != null || !text.Contains("\"elements\"")) throw new Exception("probe: no Overpass answer");
                m.Probed = true; m.DownUntil = double.NegativeInfinity;
                RallyLog.Info($"overlay: overpass {Host(m.Url)} answers (probe {(now() - t0) / 1000:0.0} s)");
            }
            catch (Exception e) { MarkDown(m, e); }
            finally { m.Probing = false; m.InFlight--; Pump(); }
        }

        /// <summary>Hand free slots to the waiting queries (roads first, then oldest); fail the ones no mirror can serve.</summary>
        void Pump()
        {
            for (;;)
            {
                waiters.Sort((a, b) => a.Priority != b.Priority ? a.Priority.CompareTo(b.Priority) : a.Seq.CompareTo(b.Seq));
                bool progressed = false;
                foreach (var w in waiters.ToArray())
                {
                    Mirror best = null; bool possible = false;
                    foreach (var m in mirrors)
                    {
                        if (w.Tried.Contains(m)) continue;
                        if (m.Probing) possible = true;   // also a paused one probed again: its answer may come
                        if (!Up(m)) continue;
                        if (Usable(m)) possible = true;
                        if (!Usable(m) || m.InFlight >= SlotsOf(m.Url)) continue;
                        if (best == null || Score(m) < Score(best) || Score(m) == Score(best) && m.InFlight < best.InFlight) best = m;
                    }
                    if (best != null)
                    {
                        best.InFlight++;
                        waiters.Remove(w);
                        w.Done.TrySetResult(best);
                        progressed = true;
                        break;   // the list may have changed in the continuation
                    }
                    if (!possible && !w.Hedge) { waiters.Remove(w); w.Done.TrySetResult(null); progressed = true; break; }
                }
                if (!progressed) return;
            }
        }

        /// <summary>The expected answer time: measured, or (only probed) the best measured one, so a new mirror shares the load.</summary>
        double Score(Mirror m)
        {
            if (!double.IsNaN(m.AvgMs)) return m.AvgMs;
            double best = double.NaN;
            foreach (var o in mirrors) if (!double.IsNaN(o.AvgMs) && (double.IsNaN(best) || o.AvgMs < best)) best = o.AvgMs;
            return double.IsNaN(best) ? 0 : best;
        }

        void MarkDown(Mirror m, Exception error)
        {
            m.Fails++;
            m.DownUntil = now() + Math.Min(MaxPauseMs, PauseMs * Math.Pow(2, m.Fails - 1));
            m.Probed = false; m.Answers = 0; m.AvgMs = double.NaN;   // heard from again only by a new probe after the pause
            RallyLog.Info($"overlay: overpass mirror paused {(m.DownUntil - now()) / 1000:0} s ({Host(m.Url)}): {error?.Message}");
        }

        public void Reset()
        {
            foreach (var m in mirrors) { m.AvgMs = double.NaN; m.DownUntil = double.NegativeInfinity; m.Fails = 0; m.Answers = 0; m.Probed = false; }
            Breaker.Reset();
        }
    }
}
