using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// Port of cache.js <c>createCache</c>: every geodata answer (DEM tiles, Overpass, NVDB, SR16, OSRM,
    /// map tiles) is stored under its canonical URL with a byte budget (10 GB) and least-recently-used
    /// eviction. A hit never touches the network, which is both the speed-up and the resilience: a
    /// place driven once keeps working when a service is down. Parallel asks for one key share one load.
    /// </summary>
    public sealed class GeoCache : IGeoCache
    {
        public const long DefaultBudget = 10L * 1024 * 1024 * 1024;
        /// <summary>ms between LRU timestamp updates of one entry, so hot keys do not rewrite the store every call.</summary>
        public const double TouchEveryMs = 60000;

        readonly ICacheBackend backend;
        readonly Func<double> now;
        readonly Dictionary<string, Task<byte[]>> pending = new Dictionary<string, Task<byte[]>>();
        long budget;
        long bytes = -1;           // running total, counted on first use
        Task evicting;
        bool disabled;

        public GeoCache(ICacheBackend backend, long budget = DefaultBudget, Func<double> nowMs = null)
        {
            this.backend = backend;
            this.budget = budget;
            now = nowMs ?? (() => (DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds);
        }

        public long Budget => budget;

        public Task SetBudget(long b) { budget = Math.Max(0, b); return Evict(); }

        /// <summary>cache.js <c>sizeOf</c>: bytes as stored; text counts two bytes per UTF-16 unit like a JS string.</summary>
        public static long SizeOf(byte[] value, bool isText) => value == null ? 0 : isText ? 2L * System.Text.Encoding.UTF8.GetCharCount(value) : value.Length;

        public Task<byte[]> Fetch(string key, Func<Task<byte[]>> loader, string kind, bool isText = false)
        {
            if (disabled) return loader();
            if (pending.TryGetValue(key, out var inFlight)) return inFlight;
            var run = Shared(key, Run(key, loader, kind, isText));
            if (!run.IsCompleted) pending[key] = run;
            return run;
        }

        async Task<byte[]> Shared(string key, Task<byte[]> run)
        {
            try { return await run; }
            finally { pending.Remove(key); }
        }

        async Task<byte[]> Run(string key, Func<Task<byte[]>> loader, string kind, bool isText)
        {
            CacheEntry hit = null;
            try { hit = await backend.Get(key); }
            catch (Exception e)
            {
                RallyLog.Warn($"cache read failed ({e.Message}); caching disabled");
                disabled = true;
            }
            if (hit != null)
            {
                double t = now();
                if (t - hit.At > TouchEveryMs) { hit.At = t; _ = Touch(hit); }
                return hit.Value;
            }
            var value = await loader();
            if (value == null) return null;
            long size = SizeOf(value, isText);
            try
            {
                await backend.Put(new CacheEntry { Key = key, Kind = kind, Value = value, IsText = isText, Size = size, At = now() });
                bytes = await Total() + size;
                if (bytes > budget) _ = Evict();
            }
            catch (Exception e)
            {
                RallyLog.Info($"cache write skipped for {kind}: {e.Message}");
            }
            return value;
        }

        async Task Touch(CacheEntry hit)
        {
            try { await backend.Put(hit); } catch { /* best effort, as in cache.js */ }
        }

        async Task<long> Total()
        {
            if (bytes >= 0) return bytes;
            long sum = 0;
            foreach (var e in await backend.ListByAge()) sum += e.Size;
            bytes = sum;
            return bytes;
        }

        Task Evict()
        {
            if (evicting != null) return evicting;
            evicting = EvictNow();
            return evicting;
        }

        async Task EvictNow()
        {
            try
            {
                var list = await backend.ListByAge();
                long sum = 0;
                foreach (var e in list) sum += e.Size;
                int dropped = 0;
                foreach (var e in list)
                {
                    if (sum <= budget) break;
                    await backend.Delete(e.Key);
                    sum -= e.Size;
                    dropped++;
                }
                bytes = sum;
                if (dropped > 0) RallyLog.Info($"cache: evicted {dropped} entries, {sum / 1048576} MB kept");
            }
            finally { evicting = null; }
        }

        public async Task<CacheStats> Stats()
        {
            var list = await backend.ListByAge();
            long sum = 0;
            foreach (var e in list) sum += e.Size;
            bytes = sum;
            return new CacheStats(list.Count, sum, budget);
        }

        public async Task Clear()
        {
            await backend.Clear();
            bytes = 0;
        }
    }
}
