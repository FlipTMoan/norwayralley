using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;
using Rally.Geo;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Gameplay
{
    /// <summary>
    /// The 3D world a stage line loads, at both detail levels, computed once from the route geometry: every coarse tile
    /// (2048 m, 8 m cells) within <see cref="TileScheduler.LoadRadius"/> + <see cref="LeadMargin"/> of the line (the ring
    /// the scheduler loads around the point a little ahead of the car), and every fine tile (256 m, 1 m cells) within <see cref="TileScheduler.FineBand"/> of the line over the
    /// whole route (the scheduler's own band rule), each once, in the order the line reaches them. The prefetch and the
    /// pins use this one list.
    /// </summary>
    public sealed class RouteTiles
    {
        public readonly List<TileKey> Coarse = new List<TileKey>(), Fine = new List<TileKey>();
        public int Count => Coarse.Count + Fine.Count;

        /// <summary>Line points every this many metres at most for the fine band (well under the 100 m band).</summary>
        public const double FineStep = 20, CoarseStep = 200;
        /// <summary>The scheduler's ring is centred 3.5 s ahead of the car (<see cref="TileScheduler.LedPoint"/>): up to ~300 m off a bending line at 300 km/h.</summary>
        public const double LeadMargin = 300;
        public const double CoarseRadius = TileScheduler.LoadRadius + LeadMargin;

        public static RouteTiles Along(IReadOnlyList<Utm33> line)
        {
            var t = new RouteTiles();
            var seen = new HashSet<TileKey>();
            if (line == null || line.Count == 0) return t;
            foreach (var p in Densify(line, CoarseStep))
            {
                int r = (int)math.ceil(CoarseRadius / TileScheduler.CoarseSize);
                var c = TileKey.At(TileKind.Coarse, p);
                for (int dj = -r; dj <= r; dj++)
                    for (int di = -r; di <= r; di++)
                    {
                        var k = new TileKey(TileKind.Coarse, c.I + di, c.J + dj);
                        if (k.RectDistance(p) <= CoarseRadius && seen.Add(k)) t.Coarse.Add(k);
                    }
            }
            const double S = TileScheduler.FineSize, B = TileScheduler.FineBand;
            foreach (var p in Densify(line, FineStep))
            {
                int i0 = (int)math.floor((p.E - B) / S), i1 = (int)math.floor((p.E + B) / S);
                int j0 = (int)math.floor((p.N - B) / S), j1 = (int)math.floor((p.N + B) / S);
                for (int j = j0; j <= j1; j++)
                    for (int i = i0; i <= i1; i++)
                    {
                        var k = new TileKey(TileKind.Fine, i, j);
                        if (seen.Add(k)) t.Fine.Add(k);
                    }
            }
            return t;
        }

        static IEnumerable<Utm33> Densify(IReadOnlyList<Utm33> line, double step)
        {
            yield return line[0];
            for (int i = 1; i < line.Count; i++)
            {
                var d = line[i].Minus(line[i - 1]);
                int n = Math.Max(1, (int)Math.Ceiling(math.length(d) / step));
                for (int k = 1; k <= n; k++) yield return line[i - 1] + d * ((double)k / n);
            }
        }
    }

    /// <summary>
    /// The cache as one saved route's download sees it: every entry it reads or stores is pinned for the route (eviction
    /// skips it) and its size counted once per route.
    /// </summary>
    public sealed class PinningCache : IGeoCache
    {
        readonly GeoCache inner;
        readonly string id;
        readonly HashSet<string> keys = new HashSet<string>();
        readonly CancellationToken stop;
        public long Bytes { get; private set; }

        /// <summary>Once <paramref name="stop"/> is cancelled (the route was deleted) nothing more is pinned, even by a load still in flight.</summary>
        public PinningCache(GeoCache inner, string id, CancellationToken stop = default) { this.inner = inner; this.id = id; this.stop = stop; }

        public async Task<byte[]> Fetch(string key, Func<Task<byte[]>> loader, string kind, bool isText = false)
        {
            var v = await inner.Fetch(key, loader, kind, isText);
            if (v != null && !stop.IsCancellationRequested && keys.Add(key))
            {
                Bytes += isText ? GeoCache.SizeOf(v, true) : v.Length;
                await inner.Pin(key, id);
            }
            return v;
        }

        public Task<CacheStats> Stats() => inner.Stats();
        public Task Clear() => inner.Clear();
        public long Budget => inner.Budget;
    }

    /// <summary>
    /// What one route download asks for, made once per download over its <see cref="PinningCache"/>: the DTM of a tile (true
    /// when it came) and the overlay fetches of a coarse tile (the same functions and query boxes as <see cref="OverlayFetch"/>).
    /// </summary>
    public sealed class PrefetchSources
    {
        public Func<TileKey, CancellationToken, Task<bool>> Dem;
        public Func<Bounds25833, CancellationToken, Task<RoadGraphData>> Roads;
        public Func<Bounds25833, CancellationToken, Task<Features>> Features;
        public Func<Bounds25833, CancellationToken, Task<CoverRaster>> Cover;
        public Func<Bounds25833, CancellationToken, Task<List<RoadSurfaceLine>>> Surfaces;
        public Func<Bounds25833, CancellationToken, Task<SignSet>> Signs;
        public Func<Bounds25833, CancellationToken, Task<LightSet>> Lights;
        public Func<TileKey, Bounds25833> SurfaceBounds = k => k.Bounds, LightBounds = k => k.Bounds;
    }

    /// <summary>
    /// A saved route's download kept locally (plan_20261122 Part 2): every tile of <see cref="RouteTiles"/> fetched through
    /// the game's own sources over a <see cref="PinningCache"/>, so the same cache keys are stored and pinned. Low priority:
    /// at most <see cref="MaxInFlight"/> requests at a time, each waits (up to <see cref="YieldMs"/>) while the driving
    /// world has tiles pending, and each data type waits out its service's pause (<see cref="ServiceBreakers"/>, shared with
    /// driving). A tile that keeps failing (<see cref="MaxFailures"/>) is left out; the route is then "partial".
    /// </summary>
    public sealed class RoutePrefetch
    {
        public Func<IGeoCache, PrefetchSources> Make;
        public Func<ServiceBreakers> Breakers;
        public Func<bool> Busy = () => false;
        public Func<double, CancellationToken, Task> Delay = (ms, ct) => Task.Delay(TimeSpan.FromMilliseconds(ms), ct);
        public int MaxInFlight = 2;
        public int MaxFailures = 3;
        public double YieldMs = 5000;
        /// <summary>Requests started and not yet answered, across every download (for tests and the log).</summary>
        public int InFlight { get; private set; }
        public int MostInFlight { get; private set; }
        // A plain gate, not SemaphoreSlim: its waiters resume where a slot is freed (on the game's own thread).
        int free = -1;
        readonly Queue<TaskCompletionSource<bool>> waiters = new Queue<TaskCompletionSource<bool>>();

        /// <summary>A slot, or a wait for one; a cancelled wait gives up its place in the queue.</summary>
        async Task Enter(CancellationToken ct)
        {
            if (free < 0) free = MaxInFlight;
            if (free > 0) { free--; return; }
            var t = new TaskCompletionSource<bool>();
            waiters.Enqueue(t);
            using (ct.Register(() => t.TrySetCanceled()))
                await t.Task;   // throws when cancelled; the slot then goes to the next waiter
        }

        void Leave()
        {
            while (waiters.Count > 0) if (waiters.Dequeue().TrySetResult(true)) return;
            free++;
        }

        /// <summary><paramref name="t"/>, or OperationCanceledException as soon as <paramref name="ct"/> is cancelled (the load itself may go on: driving can share it).</summary>
        static async Task<T> UntilCancelled<T>(Task<T> t, CancellationToken ct)
        {
            if (t.IsCompleted || !ct.CanBeCanceled) return await t;
            var cancelled = new TaskCompletionSource<bool>();
            using (ct.Register(() => cancelled.TrySetResult(true)))
                if (await Task.WhenAny(t, cancelled.Task) != t) throw new OperationCanceledException(ct);
            return await t;
        }

        /// <summary>Download <paramref name="tiles"/> for <paramref name="route"/>; <paramref name="progress"/> after every tile.</summary>
        public async Task Run(SavedRoute route, RouteTiles tiles, GeoCache cache, Action progress, CancellationToken ct)
        {
            var view = new PinningCache(cache, route.Id, ct);
            route.CoarseTotal = tiles.Coarse.Count; route.FineTotal = tiles.Fine.Count;
            route.CoarseDone = route.FineDone = 0;
            route.Status = "downloading";
            progress?.Invoke();
            int failed = 0;
            var src = Make(view);
            // One worker per level (each helps the other once its own list is done): a coarse tile waiting for a paused
            // Overpass does not hold back the 1 m DTM tiles along the road.
            var coarse = new Queue<TileKey>(tiles.Coarse);
            var fine = new Queue<TileKey>(tiles.Fine);
            async Task Worker(Queue<TileKey> mine, Queue<TileKey> other)
            {
                while (mine.Count > 0 || other.Count > 0)
                {
                    ct.ThrowIfCancellationRequested();
                    var key = mine.Count > 0 ? mine.Dequeue() : other.Dequeue();
                    bool ok = await Tile(key, src, ct);
                    if (!ok) failed++;
                    else if (key.Kind == TileKind.Coarse) route.CoarseDone++;
                    else route.FineDone++;
                    route.Bytes = view.Bytes;
                    progress?.Invoke();
                }
            }
            await Task.WhenAll(Worker(coarse, fine), Worker(fine, coarse));
            route.Bytes = view.Bytes;
            route.Status = failed == 0 ? "done" : "partial";
            RallyLog.Info($"routes: \"{route.Name}\" downloaded: fine {route.FineDone}/{route.FineTotal} · coarse {route.CoarseDone}/{route.CoarseTotal}, {view.Bytes / 1048576.0:0.0} MB pinned");
            progress?.Invoke();
        }

        /// <summary>One request through the gate: waits for a free slot, then (a while) for the driving world to be idle.</summary>
        async Task<T> Gated<T>(Func<Task<T>> ask, CancellationToken ct)
        {
            await Enter(ct);
            try
            {
                ct.ThrowIfCancellationRequested();
                for (double waited = 0; Busy() && waited < YieldMs; waited += 250) await Delay(250, ct);
                InFlight++; MostInFlight = Math.Max(MostInFlight, InFlight);
                try { return await UntilCancelled(ask(), ct); }   // a stopped download frees its slots at once
                finally { InFlight--; }
            }
            finally { Leave(); }
        }

        async Task<bool> Tile(TileKey key, PrefetchSources src, CancellationToken ct)
        {
            var breakers = Breakers();
            int failures = 0;
            bool live() => !ct.IsCancellationRequested && failures < MaxFailures;
            var dem = Dem(key, src, breakers, () => failures++, live, ct);
            if (key.Kind == TileKind.Fine || src.Roads == null) return await dem;
            Func<Bounds25833, CancellationToken, Task<T>> Wrap<T>(Func<Bounds25833, CancellationToken, Task<T>> f) where T : class
                => f == null ? null : (b, c) => Gated(async () =>
                {
                    T v = null;
                    try { v = await f(b, c); }
                    finally { if (v == null) failures++; }
                    return v;
                }, c);
            var o = new OverlayFetch
            {
                Breakers = breakers, Delay = Delay,
                Roads = Wrap(src.Roads), Features = Wrap(src.Features), Cover = Wrap(src.Cover),
                Surfaces = Wrap(src.Surfaces), Signs = Wrap(src.Signs), Lights = Wrap(src.Lights),
                SurfaceBounds = src.SurfaceBounds, LightBounds = src.LightBounds,
            };
            var d = new TileOverlay();
            await o.Fetch(key, d, live, _ => { }, ct);
            bool overlay = d.Roads != null && d.Cover != null && (o.Surfaces == null || d.Surfaces != null)
                && (o.Signs == null || d.Signs != null) && (o.Lights == null || d.Lights != null);
            return await dem && overlay;
        }

        /// <summary>The tile's DTM, asked again after the DTM's pause until it comes or the tile has failed too often.</summary>
        async Task<bool> Dem(TileKey key, PrefetchSources src, ServiceBreakers breakers, Action failed, Func<bool> live, CancellationToken ct)
        {
            while (live())
            {
                if (breakers.Dtm.IsOpen) { await Delay(Math.Max(1000, breakers.Dtm.RemainingMs), ct); continue; }
                bool ok = false;
                try { ok = await Gated(() => src.Dem(key, ct), ct); }
                catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
                catch (Exception e) { RallyLog.Info($"routes: {key} DTM failed: {e.Message}"); }
                if (ok) return true;
                failed();
                if (!breakers.Dtm.IsOpen) breakers.Dtm.Trip();
            }
            return false;
        }
    }
}
