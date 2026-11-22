using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.World;

namespace Rally.Gameplay
{
    /// <summary>
    /// OSM roads come per <b>road region</b> of <see cref="Tiles"/> × <see cref="Tiles"/> coarse tiles (≈ 6 × 6 km) on a fixed
    /// grid, one light roads-only Overpass query each (<see cref="OverpassQuery.BuildRoads"/>), not inside each tile's heavy
    /// feature query. Every tile then takes its roads from the same answers as its neighbours, and a tile's roads are handed
    /// over only once the regions of the tile <b>and its 8 neighbours</b> are in (<see cref="ForTile"/>): a road never ends at
    /// a tile edge because the neighbour's roads have not been asked for yet (seen 2026-11-22: roads landed one tile every
    /// 8–12 s behind each tile's houses and fields, and ended at the tile borders for minutes). Measured on the fastest
    /// mirror: 1 tile 1.1 s / 1.0 MB, 3 × 3 tiles 1.6–2.4 s / 3.4 MB (<c>out tags geom</c>), so 9 tiles cost about two.
    /// A region that got no answer is asked again on the next request (the tile's roads lane waits out Overpass's pause).
    /// </summary>
    public sealed class RoadRegions
    {
        public const int Tiles = 3;
        /// <summary>Parsed regions kept in memory (the cache keeps every answer): the 3 × 3 regions around the car and a few more.</summary>
        public const int Keep = 16;

        /// <summary>A region on the fixed grid: coarse tiles [I·3, I·3+2] × [J·3, J·3+2].</summary>
        public readonly struct Key : IEquatable<Key>
        {
            public readonly int I, J;
            public Key(int i, int j) { I = i; J = j; }
            public Bounds25833 Bounds
            {
                get
                {
                    double s = (double)TileScheduler.CoarseSize * Tiles;
                    return new Bounds25833(I * s, J * s, (I + 1) * s, (J + 1) * s);
                }
            }
            public bool Equals(Key o) => I == o.I && J == o.J;
            public override bool Equals(object obj) => obj is Key k && Equals(k);
            public override int GetHashCode() => (I * 73856093) ^ (J * 19349663);
            public override string ToString() => $"Region({I},{J})";
        }

        static int FloorDiv(int a, int b) => a >= 0 ? a / b : -((-a + b - 1) / b);

        public static Key Of(TileKey t) => new Key(FloorDiv(t.I, Tiles), FloorDiv(t.J, Tiles));

        /// <summary>The regions holding the tile and its 8 neighbours (1, 2 or 4), the tile's own first.</summary>
        public static List<Key> Around(TileKey t)
        {
            var list = new List<Key> { Of(t) };
            for (int dj = -1; dj <= 1; dj++)
                for (int di = -1; di <= 1; di++)
                {
                    var k = Of(new TileKey(TileKind.Coarse, t.I + di, t.J + dj));
                    if (!list.Contains(k)) list.Add(k);
                }
            return list;
        }

        readonly Func<Bounds25833, CancellationToken, Task<RoadGraphData>> fetchRegion;
        readonly Dictionary<Key, Task<RoadGraphData>> regions = new Dictionary<Key, Task<RoadGraphData>>();
        readonly Dictionary<Key, long> lastUse = new Dictionary<Key, long>();
        long uses;

        /// <param name="fetchRegion">A region's roads (cached, parsed), or null when no mirror answered.</param>
        public RoadRegions(Func<Bounds25833, CancellationToken, Task<RoadGraphData>> fetchRegion) { this.fetchRegion = fetchRegion; }

        /// <summary>The region's roads: one request shared by every tile that asks; a failed one is asked again next time.</summary>
        public Task<RoadGraphData> Region(Key k, CancellationToken ct)
        {
            lastUse[k] = ++uses;
            if (regions.TryGetValue(k, out var t) && !(t.IsCompleted && (t.Status != TaskStatus.RanToCompletion || t.Result == null))) return t;
            t = fetchRegion(k.Bounds, ct);
            regions[k] = t;
            Trim();
            return t;
        }

        /// <summary>
        /// The tile's roads from an older cached answer of the tile alone (the combined query, <c>overpass2:</c>), or null: an
        /// area cached before road regions existed loads without a request (only the missing pieces are asked for).
        /// </summary>
        public Func<TileKey, Task<RoadGraphData>> OldTile;
        /// <summary>Is such an older answer cached for the tile (no network)?</summary>
        public Func<TileKey, Task<bool>> HasOldTile;

        /// <summary>Ask for the regions around the tile now (before its DTM): roads go first in the Overpass queue. Not when the tile is cached under the old key.</summary>
        public async void Prefetch(TileKey t, CancellationToken ct)
        {
            try
            {
                if (HasOldTile != null && await HasOldTile(t)) return;
                foreach (var k in Around(t)) _ = Region(k, ct);
            }
            catch (Exception e) { RallyLog.Info($"overlay: road regions for {t}: {e.Message}"); }
        }

        /// <summary>Is the road data of the tile and its 8 neighbours in (no request needed)?</summary>
        public bool Ready(TileKey t)
        {
            foreach (var k in Around(t))
                if (!regions.TryGetValue(k, out var r) || r.Status != TaskStatus.RanToCompletion || r.Result == null) return false;
            return true;
        }

        /// <summary>
        /// The tile's roads, once the regions of the tile and its 8 neighbours are all in: every way that reaches into the tile
        /// padded by <see cref="RoadGraph.TilePad"/> (grading and carving look that far), once. Null when a region got no answer.
        /// </summary>
        public async Task<RoadGraphData> ForTile(TileKey t, CancellationToken ct)
        {
            if (OldTile != null)
            {
                var old = await OldTile(t);
                if (old != null) return old;
            }
            var keys = Around(t);
            var tasks = new List<Task<RoadGraphData>>(keys.Count);
            foreach (var k in keys) tasks.Add(Region(k, ct));
            await Task.WhenAll(tasks);
            var b = t.Bounds;
            double pad = RoadGraph.TilePad;
            double minE = b.MinE - pad, minN = b.MinN - pad, maxE = b.MaxE + pad, maxN = b.MaxN + pad;
            var data = new RoadGraphData();
            var seen = new HashSet<long>();
            foreach (var task in tasks)
            {
                var r = task.Result;
                if (r == null) return null;
                foreach (var w in r.Ways)
                    if (!seen.Contains(w.Id) && Reaches(w.Nodes, minE, minN, maxE, maxN)) { seen.Add(w.Id); data.Ways.Add(w); }
            }
            return data;
        }

        /// <summary>The tile's roads by its bounds (the <see cref="OverlayFetch"/> signature).</summary>
        public Task<RoadGraphData> ForBounds(Bounds25833 b, CancellationToken ct)
            => ForTile(TileKey.At(TileKind.Coarse, new Utm33((b.MinE + b.MaxE) / 2, (b.MinN + b.MaxN) / 2)), ct);

        /// <summary>A node in the box, or a segment across it (a tunnel mapped with nodes kilometres apart).</summary>
        static bool Reaches(List<Utm33> nodes, double minE, double minN, double maxE, double maxN)
        {
            if (nodes == null || nodes.Count == 0) return false;
            double lo0 = double.MaxValue, lo1 = double.MaxValue, hi0 = double.MinValue, hi1 = double.MinValue;
            foreach (var p in nodes)
            {
                if (p.E >= minE && p.E <= maxE && p.N >= minN && p.N <= maxN) return true;
                lo0 = Math.Min(lo0, p.E); hi0 = Math.Max(hi0, p.E); lo1 = Math.Min(lo1, p.N); hi1 = Math.Max(hi1, p.N);
            }
            if (hi0 < minE || lo0 > maxE || hi1 < minN || lo1 > maxN) return false;
            for (int i = 0; i + 1 < nodes.Count; i++)
                if (SegmentCrosses(nodes[i], nodes[i + 1], minE, minN, maxE, maxN)) return true;
            return false;
        }

        static bool SegmentCrosses(Utm33 a, Utm33 c, double minE, double minN, double maxE, double maxN)
        {
            double t0 = 0, t1 = 1, dx = c.E - a.E, dy = c.N - a.N;
            bool Edge(double p, double q)
            {
                if (Math.Abs(p) < 1e-12) return q >= 0;
                double r = q / p;
                if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
                else { if (r < t0) return false; if (r < t1) t1 = r; }
                return true;
            }
            return Edge(-dx, a.E - minE) && Edge(dx, maxE - a.E) && Edge(-dy, a.N - minN) && Edge(dy, maxN - a.N) && t1 >= t0;
        }

        /// <summary>
        /// The tiles whose drawn roads may be shown: those in <paramref name="drawn"/> whose every neighbour the world wants
        /// (<paramref name="wanted"/>: its ground loading or shown) has drawn roads too, plus those shown already (a shown
        /// ribbon stays) and those that waited too long (<paramref name="heldTooLong"/>: a neighbour's data failing). A
        /// neighbour the world does not want (beyond the loaded area) does not hold a tile back.
        /// </summary>
        public static HashSet<TileKey> Showable(ICollection<TileKey> drawn, ICollection<TileKey> shown, Func<TileKey, bool> wanted, Func<TileKey, bool> heldTooLong)
        {
            var result = new HashSet<TileKey>();
            foreach (var k in drawn)
            {
                bool ok = shown.Contains(k) || heldTooLong(k);
                if (!ok)
                {
                    ok = true;
                    for (int dj = -1; dj <= 1 && ok; dj++)
                        for (int di = -1; di <= 1 && ok; di++)
                        {
                            if (di == 0 && dj == 0) continue;
                            var n = new TileKey(TileKind.Coarse, k.I + di, k.J + dj);
                            if (!drawn.Contains(n) && wanted(n)) ok = false;
                        }
                }
                if (ok) result.Add(k);
            }
            return result;
        }

        /// <summary>Forget the least recently used finished regions beyond <see cref="Keep"/> (they stay in the cache).</summary>
        void Trim()
        {
            while (regions.Count > Keep)
            {
                Key oldest = default; long at = long.MaxValue; bool found = false;
                foreach (var kv in regions)
                    if (kv.Value.IsCompleted && lastUse[kv.Key] < at) { at = lastUse[kv.Key]; oldest = kv.Key; found = true; }
                if (!found) return;
                regions.Remove(oldest); lastUse.Remove(oldest);
            }
        }
    }
}
