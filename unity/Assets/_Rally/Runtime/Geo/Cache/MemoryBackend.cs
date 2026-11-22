using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Rally.Geo
{
    /// <summary>In-memory store with the backend shape (tests, and platforms without storage) — cache.js <c>memoryBackend</c>.</summary>
    public sealed class MemoryBackend : ICacheBackend
    {
        readonly Dictionary<string, CacheEntry> map = new Dictionary<string, CacheEntry>();
        readonly Dictionary<string, string> pins = new Dictionary<string, string>();

        public Task<bool> Available() => Task.FromResult(true);
        /// <summary>What <see cref="Room"/> reports; tests set it to simulate a full disk or a small browser quota.</summary>
        public StorageRoom StorageRoom = StorageRoom.Unknown;
        public Task<StorageRoom> Room() => Task.FromResult(StorageRoom);
        public Task<CacheEntry> Get(string key) => Task.FromResult(map.TryGetValue(key, out var e) ? e : null);
        public Task Put(CacheEntry entry) { map[entry.Key] = entry; return Task.CompletedTask; }
        public Task Delete(string key) { map.Remove(key); pins.Remove(key); return Task.CompletedTask; }
        public Task Clear() { map.Clear(); pins.Clear(); return Task.CompletedTask; }
        public Task<bool> AddPin(string key, string id)
        {
            if (!map.ContainsKey(key)) return Task.FromResult(false);
            pins[key] = CachePins.Add(pins.TryGetValue(key, out var p) ? p : "", id);
            return Task.FromResult(true);
        }
        public Task RemovePin(string id)
        {
            foreach (var k in pins.Keys.ToList()) pins[k] = CachePins.Remove(pins[k], id);
            return Task.CompletedTask;
        }
        public Task<List<CacheEntryInfo>> ListByAge() => Task.FromResult(
            map.Values.OrderBy(e => e.At).Select(e => new CacheEntryInfo(e.Key, e.Kind, e.Size, e.At, pins.TryGetValue(e.Key, out var p) ? p : "")).ToList());
    }
}
