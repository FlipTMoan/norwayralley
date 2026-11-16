using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Rally.Geo
{
    /// <summary>In-memory store with the backend shape (tests, and platforms without storage) — cache.js <c>memoryBackend</c>.</summary>
    public sealed class MemoryBackend : ICacheBackend
    {
        readonly Dictionary<string, CacheEntry> map = new Dictionary<string, CacheEntry>();

        public Task<bool> Available() => Task.FromResult(true);
        public Task<CacheEntry> Get(string key) => Task.FromResult(map.TryGetValue(key, out var e) ? e : null);
        public Task Put(CacheEntry entry) { map[entry.Key] = entry; return Task.CompletedTask; }
        public Task Delete(string key) { map.Remove(key); return Task.CompletedTask; }
        public Task Clear() { map.Clear(); return Task.CompletedTask; }
        public Task<List<CacheEntryInfo>> ListByAge() => Task.FromResult(
            map.Values.OrderBy(e => e.At).Select(e => new CacheEntryInfo(e.Key, e.Kind, e.Size, e.At)).ToList());
    }
}
