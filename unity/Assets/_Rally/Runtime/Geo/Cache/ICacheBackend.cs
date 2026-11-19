using System.Collections.Generic;
using System.Threading.Tasks;

namespace Rally.Geo
{
    /// <summary>What the store knows about an entry without loading its value (cache.js <c>listByAge</c>).</summary>
    public readonly struct CacheEntryInfo
    {
        public readonly string Key, Kind;
        public readonly long Size;
        public readonly double At;
        public CacheEntryInfo(string key, string kind, long size, double at) { Key = key; Kind = kind; Size = size; At = at; }
    }

    /// <summary>
    /// How much room the store has. On a file system the disk's total and free bytes are exact; in a browser the
    /// disk is hidden and only <c>navigator.storage.estimate()</c> is known: the origin's quota (Chrome derives it
    /// from the disk size and free space) and what the origin already uses. −1 means unknown.
    /// </summary>
    public readonly struct StorageRoom
    {
        public readonly long DiskTotal, DiskFree, Quota, OriginUsage;
        public StorageRoom(long diskTotal, long diskFree, long quota, long originUsage) { DiskTotal = diskTotal; DiskFree = diskFree; Quota = quota; OriginUsage = originUsage; }
        public static readonly StorageRoom Unknown = new StorageRoom(-1, -1, -1, -1);
    }

    /// <summary>A stored value: bytes, or UTF-8 text of a JSON value when <see cref="IsText"/> (so the JS client reads it as an object).</summary>
    public sealed class CacheEntry
    {
        public string Key, Kind;
        public byte[] Value;
        public bool IsText;
        public long Size;
        public double At;
    }

    /// <summary>
    /// The dumb store under <see cref="GeoCache"/>: get/put/delete/listByAge/clear, like the backends in
    /// cache.js, so the LRU policy is one piece of code over IndexedDB (web), files (editor) and memory (tests).
    /// </summary>
    public interface ICacheBackend
    {
        Task<bool> Available();
        Task<CacheEntry> Get(string key);
        Task Put(CacheEntry entry);
        Task Delete(string key);
        Task Clear();
        /// <summary>All entries' key/size/at/kind, oldest first.</summary>
        Task<List<CacheEntryInfo>> ListByAge();
        /// <summary>Disk or quota figures for the budget (<see cref="GeoCache.BudgetFor"/>).</summary>
        Task<StorageRoom> Room();
    }
}
