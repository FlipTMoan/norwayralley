using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// Port of cache.js <c>createCache</c>: every geodata answer (DEM tiles, Overpass, NVDB, SR16, OSRM,
    /// map tiles) is stored under its canonical URL with a byte budget (at most 32 GB, keeping 10 % of the disk free) and least-recently-used
    /// eviction. A hit never touches the network, which is both the speed-up and the resilience: a
    /// place driven once keeps working when a service is down. Parallel asks for one key share one load.
    /// </summary>
    public sealed class GeoCache : IGeoCache
    {
        /// <summary>The most the cache may ever hold (user, 2026-11-18): 32 GB.</summary>
        public const long MaxBudget = 32L * 1024 * 1024 * 1024;
        public const long DefaultBudget = MaxBudget;
        /// <summary>Share of the disk (or of the browser quota) that is never filled by the cache.</summary>
        public const double KeepFreeFraction = 0.10;
        /// <summary>How often the room is measured again; also after every <see cref="RecheckBytes"/> written.</summary>
        public const double RecheckMs = 5 * 60 * 1000;
        public const long RecheckBytes = 256L * 1024 * 1024;
        double lastRoomCheck = double.NegativeInfinity;
        long writtenSinceCheck;
        bool checkingRoom;
        /// <summary>ms between LRU timestamp updates of one entry, so hot keys do not rewrite the store every call.</summary>
        public const double TouchEveryMs = 60000;

        readonly ICacheBackend backend;
        readonly Func<double> now;
        readonly Dictionary<string, Task<byte[]>> pending = new Dictionary<string, Task<byte[]>>();
        long budget;
        long cap;                  // the most this cache may hold whatever the room: the constructor's budget, or SetBudget
        long bytes = -1;           // running total, counted on first use
        Task evicting;
        bool disabled;

        public GeoCache(ICacheBackend backend, long budget = DefaultBudget, Func<double> nowMs = null)
        {
            this.backend = backend;
            this.budget = cap = budget;
            now = nowMs ?? (() => (DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds);
        }

        public long Budget => budget;

        public Task SetBudget(long b) { budget = cap = Math.Max(0, b); return Evict(); }

        /// <summary>
        /// The budget for the room the store reports: at most <see cref="MaxBudget"/>, and never so much that the disk
        /// drops below 10 % free. With exact disk figures (editor, desktop) that is our bytes + free − 10 % of the
        /// disk; in a browser only the quota is known, so 10 % of the quota stays unused and other data of the
        /// origin counts against it. Both limits apply when both are known; unknown figures do not limit.
        /// </summary>
        public static long BudgetFor(StorageRoom room, long ours)
        {
            long b = MaxBudget;
            if (room.DiskTotal > 0 && room.DiskFree >= 0)
                b = Math.Min(b, Math.Max(0, ours + room.DiskFree - (long)(KeepFreeFraction * room.DiskTotal)));
            if (room.Quota > 0 && room.OriginUsage >= 0)
                b = Math.Min(b, Math.Max(0, (long)((1 - KeepFreeFraction) * room.Quota) - Math.Max(0, room.OriginUsage - ours)));
            return b;
        }

        /// <summary>Measure the room again and set the budget from it; evicts when the disk filled up meanwhile.</summary>
        public async Task RefreshBudget()
        {
            if (checkingRoom || disabled) return;
            checkingRoom = true;
            try
            {
                lastRoomCheck = now();
                writtenSinceCheck = 0;
                var room = await backend.Room();
                long ours = await Total();
                long next = Math.Min(cap, BudgetFor(room, ours));
                if (next != budget)
                {
                    string why = room.DiskTotal > 0 ? $"disk {room.DiskFree / 1073741824.0:0.0} GB free of {room.DiskTotal / 1073741824.0:0.0} GB, 10 % kept free"
                        : room.Quota > 0 ? $"browser quota {room.Quota / 1073741824.0:0.0} GB, {room.OriginUsage / 1073741824.0:0.00} GB used, 10 % kept free"
                        : "disk size unknown";
                    RallyLog.Info($"cache: budget {next / 1073741824.0:0.0} GB ({why}; at most {MaxBudget / 1073741824} GB)");
                }
                budget = next;
                if (ours > budget) await Evict();
            }
            catch (Exception e) { RallyLog.Info($"cache: could not measure the storage room ({e.Message}); keeping {budget / 1073741824.0:0.0} GB"); }
            finally { checkingRoom = false; }
        }

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
                RallyLog.Info($"cache: hit {kind} {hit.Value.Length / 1024} KB");
                return hit.Value;
            }
            var watch = System.Diagnostics.Stopwatch.StartNew();
            var value = await loader();
            if (value == null) { RallyLog.Info($"cache: miss {kind}, the network gave nothing after {watch.ElapsedMilliseconds} ms"); return null; }
            RallyLog.Info($"cache: miss {kind}, fetched {value.Length / 1024} KB in {watch.ElapsedMilliseconds} ms");
            long size = SizeOf(value, isText);
            try
            {
                long before = await Total();   // counted before the put, so the new entry is not counted twice
                await backend.Put(new CacheEntry { Key = key, Kind = kind, Value = value, IsText = isText, Size = size, At = now() });
                bytes = before + size;
                writtenSinceCheck += size;
                // The disk fills with other things too: measure again every few minutes and every 256 MB we write.
                if (writtenSinceCheck >= RecheckBytes || now() - lastRoomCheck >= RecheckMs) await RefreshBudget();
                else if (bytes > budget) _ = Evict();
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
            // With a synchronous backend EvictNow completes (and its finally runs) before the assignment
            // below, so a finished task must not count as "in progress" (cache.js relies on .finally being async).
            if (evicting != null && !evicting.IsCompleted) return evicting;
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
