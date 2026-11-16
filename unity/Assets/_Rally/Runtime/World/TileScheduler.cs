using System;
using System.Collections.Generic;
using Rally.Core;
using Unity.Mathematics;

namespace Rally.World
{
    public enum TileKind : byte { Coarse, Fine }
    public enum TileState : byte { Queued, Loading, Ready }

    /// <summary>
    /// A square tile of the streamed world, keyed by its integer grid cell in EPSG:25833: coarse tiles are
    /// 2048 m with 257 samples (8 m cells), fine tiles 256 m at 1 m. Fine tiles divide a coarse tile 8 × 8,
    /// which is what lets the coarse tile keep a 64-bit hole mask of the fine tiles that cover it.
    /// </summary>
    public readonly struct TileKey : IEquatable<TileKey>
    {
        public readonly TileKind Kind;
        public readonly int I, J;
        public TileKey(TileKind kind, int i, int j) { Kind = kind; I = i; J = j; }

        public float SizeM => Kind == TileKind.Coarse ? TileScheduler.CoarseSize : TileScheduler.FineSize;
        public float CellM => Kind == TileKind.Coarse ? TileScheduler.CoarseCell : TileScheduler.FineCell;
        public Utm33 Origin => new Utm33((double)I * SizeM, (double)J * SizeM);
        public Bounds25833 Bounds => new Bounds25833((double)I * SizeM, (double)J * SizeM, (double)(I + 1) * SizeM, (double)(J + 1) * SizeM);

        /// <summary>stream.js rectDistance: 0 inside the tile, else the distance to its edge.</summary>
        public double RectDistance(Utm33 p)
        {
            double x0 = (double)I * SizeM, y0 = (double)J * SizeM, s = SizeM;
            double dx = math.max(math.max(x0 - p.E, 0), p.E - (x0 + s));
            double dy = math.max(math.max(y0 - p.N, 0), p.N - (y0 + s));
            return math.sqrt(dx * dx + dy * dy);
        }

        public static TileKey At(TileKind kind, Utm33 p)
        {
            float s = kind == TileKind.Coarse ? TileScheduler.CoarseSize : TileScheduler.FineSize;
            return new TileKey(kind, (int)math.floor(p.E / s), (int)math.floor(p.N / s));
        }

        public bool Equals(TileKey o) => Kind == o.Kind && I == o.I && J == o.J;
        public override bool Equals(object obj) => obj is TileKey k && Equals(k);
        public override int GetHashCode() => (I * 73856093) ^ (J * 19349663) ^ ((int)Kind << 30);
        public override string ToString() => $"{Kind}({I},{J})";
    }

    /// <summary>
    /// Decides which tiles to fetch, in which order, and which to drop, as the car moves. Pure C#, no
    /// Unity objects, so the ring logic is unit-testable. Port of stream.js (coarse chunks: LOAD_RADIUS
    /// around a point led along the velocity, KEEP_RADIUS to dispose) and fine.js (1 m tiles in a
    /// ±FINE_BAND band around the road points near the car, nearest first, a fixed number held).
    /// The consumer calls <see cref="TryDequeue"/> once per frame (one fetch/carve per frame budget) and
    /// <see cref="MarkReady"/> when the tile is usable.
    /// </summary>
    public sealed class TileScheduler
    {
        public const float CoarseSize = 2048f, CoarseCell = 8f;     // 257 samples per side
        public const float FineSize = 256f, FineCell = 1f;          // 257 samples per side
        public const int Samples = 257;
        public const float LoadRadius = 4400f;     // stream.js LOAD_RADIUS: fetch DEM within this range of the led point
        public const float KeepRadius = 5300f;     // stream.js KEEP_RADIUS: dispose chunks beyond this range of the car
        public const float LeadDistance = 2800f;   // stream.js LEAD_DISTANCE: max look-ahead along the velocity
        public const float FineBand = 100f;        // fine.js FINE_BAND: metres each side of a road
        public const float FineKeep = 900f;        // fine.js KEEP: dispose tiles farther than this from the car
        public const int FineMaxLive = 24;         // fine.js MAX_LIVE
        public const int FinePerCoarse = 8;        // 2048 / 256

        sealed class Entry { public TileKey Key; public TileState State; public double Priority; }

        readonly Dictionary<TileKey, Entry> tiles = new Dictionary<TileKey, Entry>();
        readonly List<Entry> queue = new List<Entry>();
        readonly Dictionary<(int, int), ulong> holes = new Dictionary<(int, int), ulong>();
        // Scratch, reused every frame so the ring logic never allocates.
        readonly List<Entry> scratch = new List<Entry>();
        readonly Dictionary<TileKey, double> wantedFine = new Dictionary<TileKey, double>();
        readonly List<KeyValuePair<TileKey, double>> wantedSorted = new List<KeyValuePair<TileKey, double>>();
        readonly HashSet<TileKey> keepFine = new HashSet<TileKey>();
        readonly List<Utm33> fallbackPoint = new List<Utm33>(1) { default };
        // Prefetch path (the next endless sector): coarse tiles under it load behind the ring and are not dropped by distance.
        readonly List<Utm33> prefetch = new List<Utm33>();
        readonly HashSet<TileKey> prefetchKeys = new HashSet<TileKey>();
        const double PrefetchPenalty = 50000;   // sorts behind every ring tile (ring priorities are metres, < LoadRadius)
        static readonly Comparison<KeyValuePair<TileKey, double>> byDistance = (a, b) => a.Value.CompareTo(b.Value);

        /// <summary>A tile is wanted: allocate its resources (it is still Queued until dequeued and loaded).</summary>
        public event Action<TileKey> Created;
        /// <summary>A tile is dropped in whatever state it was; release its resources.</summary>
        public event Action<TileKey> Disposed;

        public int Count => tiles.Count;
        public IEnumerable<TileKey> Keys => tiles.Keys;
        public bool Contains(TileKey k) => tiles.ContainsKey(k);
        public bool IsReady(TileKey k) => tiles.TryGetValue(k, out var e) && e.State == TileState.Ready;
        public bool TryGetState(TileKey k, out TileState s) { if (tiles.TryGetValue(k, out var e)) { s = e.State; return true; } s = default; return false; }

        /// <summary>
        /// Road points of the next stage sector (RoadWalk.LastSector): the coarse tiles under them and the fine
        /// tiles along them are fetched after the ring around the car, so the road ahead never pops in. Pass
        /// null or an empty list to stop prefetching.
        /// </summary>
        public void SetPrefetchPath(IReadOnlyList<Utm33> points)
        {
            prefetch.Clear();
            if (points != null) prefetch.AddRange(points);
        }

        /// <summary>streamStats() of the JS: ready tiles per kind and how many are still queued or loading.</summary>
        public void Count(out int coarseReady, out int fineReady, out int pending)
        {
            coarseReady = fineReady = pending = 0;
            foreach (var e in tiles.Values)
            {
                if (e.State != TileState.Ready) pending++;
                else if (e.Key.Kind == TileKind.Coarse) coarseReady++;
                else fineReady++;
            }
        }

        /// <summary>stream.js world.update: led point = focus + velocity direction × min(LEAD, speed × 3.5 s).</summary>
        public static Utm33 LedPoint(Utm33 focus, double2 velocity)
        {
            double speed = math.length(velocity);
            if (speed < 0.01) return focus;
            double lead = math.min(LeadDistance, speed * 3.5);
            return focus + velocity * (lead / speed);
        }

        /// <summary>
        /// Per frame. <paramref name="roadPoints"/> are road samples near the led point (fine tiles follow
        /// the roads, not the car); with none the led point itself is used, as fine.js does.
        /// </summary>
        public void Update(Utm33 focus, double2 velocity, IReadOnlyList<Utm33> roadPoints)
        {
            var led = LedPoint(focus, velocity);
            UpdateCoarse(focus, led);
            if (roadPoints == null || roadPoints.Count == 0) { fallbackPoint[0] = led; roadPoints = fallbackPoint; }
            UpdateFine(focus, roadPoints);
        }

        void UpdateCoarse(Utm33 focus, Utm33 led)
        {
            int r = (int)math.ceil(LoadRadius / CoarseSize);
            var centre = TileKey.At(TileKind.Coarse, led);
            for (int dj = -r; dj <= r; dj++)
                for (int di = -r; di <= r; di++)
                {
                    var key = new TileKey(TileKind.Coarse, centre.I + di, centre.J + dj);
                    if (tiles.ContainsKey(key)) continue;
                    double d = key.RectDistance(led);
                    if (d > LoadRadius) continue;
                    Create(key, d + (di == 0 && dj == 0 ? -10 : 0));   // the tile under the led point first
                }
            prefetchKeys.Clear();
            for (int n = 0; n < prefetch.Count; n++)
            {
                var key = TileKey.At(TileKind.Coarse, prefetch[n]);
                if (!prefetchKeys.Add(key) || tiles.ContainsKey(key)) continue;
                Create(key, PrefetchPenalty + key.RectDistance(focus));
            }
            scratch.Clear();
            foreach (var e in tiles.Values)
            {
                if (e.Key.Kind != TileKind.Coarse || prefetchKeys.Contains(e.Key)) continue;
                double d = e.Key.RectDistance(focus);
                if (e.State == TileState.Ready ? d > KeepRadius : (e.State == TileState.Queued && d > KeepRadius + CoarseSize)) scratch.Add(e);
            }
            for (int i = 0; i < scratch.Count; i++) Drop(scratch[i]);
        }

        /// <summary>fine.js wanted/pick: tiles within FINE_BAND of a road point and within KEEP of the car, nearest first, MAX_LIVE held.</summary>
        void UpdateFine(Utm33 focus, IReadOnlyList<Utm33> roadPoints)
        {
            wantedFine.Clear();
            for (int n = 0; n < roadPoints.Count; n++)
            {
                var p = roadPoints[n];
                int i0 = (int)math.floor((p.E - FineBand) / FineSize), i1 = (int)math.floor((p.E + FineBand) / FineSize);
                int j0 = (int)math.floor((p.N - FineBand) / FineSize), j1 = (int)math.floor((p.N + FineBand) / FineSize);
                for (int tj = j0; tj <= j1; tj++)
                    for (int ti = i0; ti <= i1; ti++)
                    {
                        var key = new TileKey(TileKind.Fine, ti, tj);
                        if (wantedFine.ContainsKey(key)) continue;
                        double d = key.RectDistance(focus);
                        if (d <= FineKeep) wantedFine.Add(key, d);
                    }
            }
            // The prefetch path: fine tiles along the next sector, behind the car's own band, filling the spare MAX_LIVE slots.
            for (int n = 0; n < prefetch.Count; n++)
            {
                var key = TileKey.At(TileKind.Fine, prefetch[n]);
                if (!wantedFine.ContainsKey(key)) wantedFine.Add(key, PrefetchPenalty + key.RectDistance(focus));
            }
            wantedSorted.Clear();
            foreach (var kv in wantedFine) wantedSorted.Add(kv);
            wantedSorted.Sort(byDistance);
            keepFine.Clear();
            for (int i = 0; i < wantedSorted.Count && i < FineMaxLive; i++) keepFine.Add(wantedSorted[i].Key);

            scratch.Clear();
            int live = 0;
            foreach (var e in tiles.Values)
            {
                if (e.Key.Kind != TileKind.Fine) continue;
                if (!keepFine.Contains(e.Key) && (e.State == TileState.Queued || e.Key.RectDistance(focus) > FineKeep)) scratch.Add(e);
                else live++;
            }
            for (int i = 0; i < scratch.Count; i++) Drop(scratch[i]);
            for (int i = 0; i < wantedSorted.Count && live < FineMaxLive; i++)
            {
                var key = wantedSorted[i].Key;
                if (tiles.TryGetValue(key, out var e)) { if (e.State == TileState.Queued) e.Priority = wantedSorted[i].Value; continue; }
                Create(key, wantedSorted[i].Value);
                live++;
            }
        }

        void Create(TileKey key, double priority)
        {
            var e = new Entry { Key = key, State = TileState.Queued, Priority = priority };
            tiles.Add(key, e);
            queue.Add(e);
            Created?.Invoke(key);
        }

        void Drop(Entry e)
        {
            tiles.Remove(e.Key);
            if (e.State == TileState.Queued) queue.Remove(e);
            if (e.Key.Kind == TileKind.Fine && e.State == TileState.Ready) SetHole(e.Key, false);
            Disposed?.Invoke(e.Key);
        }

        /// <summary>The most urgent queued tile (fine tiles before coarse: they are small and under the car), now Loading.</summary>
        public bool TryDequeue(out TileKey key)
        {
            int best = -1;
            double bestP = double.PositiveInfinity;
            for (int i = 0; i < queue.Count; i++)
            {
                double p = queue[i].Priority + (queue[i].Key.Kind == TileKind.Coarse ? 1e4 : 0);
                if (p < bestP) { bestP = p; best = i; }
            }
            if (best < 0) { key = default; return false; }
            var e = queue[best];
            queue.RemoveAt(best);
            e.State = TileState.Loading;
            key = e.Key;
            return true;
        }

        public void MarkReady(TileKey key)
        {
            if (!tiles.TryGetValue(key, out var e)) return;
            e.State = TileState.Ready;
            if (key.Kind == TileKind.Fine) SetHole(key, true);
        }

        /// <summary>A fetch failed: back in the queue behind everything else, like stream.js (`priority += 1e6`).</summary>
        public void Fail(TileKey key)
        {
            if (!tiles.TryGetValue(key, out var e) || e.State != TileState.Loading) return;
            e.State = TileState.Queued;
            e.Priority += 1e6;
            queue.Add(e);
        }

        /// <summary>Bit (fi mod 8) + 8 × (fj mod 8) set for every ready fine tile inside coarse tile (ci, cj): the coarse ground is hidden there.</summary>
        public ulong HoleMask(int ci, int cj) => holes.TryGetValue((ci, cj), out var m) ? m : 0UL;

        void SetHole(TileKey fine, bool on)
        {
            int ci = (int)math.floor(fine.I / (double)FinePerCoarse), cj = (int)math.floor(fine.J / (double)FinePerCoarse);
            int bit = (fine.I - ci * FinePerCoarse) + FinePerCoarse * (fine.J - cj * FinePerCoarse);
            holes.TryGetValue((ci, cj), out var m);
            m = on ? m | (1UL << bit) : m & ~(1UL << bit);
            if (m == 0) holes.Remove((ci, cj)); else holes[(ci, cj)] = m;
        }
    }
}
