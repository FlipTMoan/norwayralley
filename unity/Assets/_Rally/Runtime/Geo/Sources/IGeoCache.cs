using System;
using System.Threading.Tasks;

namespace Rally.Geo
{
    /// <summary>The cache contract every geodata request goes through (cache.js <c>createCache</c>).</summary>
    public interface IGeoCache
    {
        /// <summary>The cached bytes for <paramref name="key"/>, or <paramref name="loader"/>'s result after storing it. A null result is not cached.</summary>
        Task<byte[]> Fetch(string key, Func<Task<byte[]>> loader, string kind, bool isText = false);
        Task<CacheStats> Stats();
        Task Clear();
        long Budget { get; }
    }

    public readonly struct CacheStats
    {
        public readonly int Entries;
        public readonly long Bytes, Budget;
        /// <summary>Bytes of the entries saved routes keep (each entry once), part of <see cref="Bytes"/>.</summary>
        public readonly long PinnedBytes;
        public CacheStats(int entries, long bytes, long budget, long pinnedBytes = 0) { Entries = entries; Bytes = bytes; Budget = budget; PinnedBytes = pinnedBytes; }
    }
}
