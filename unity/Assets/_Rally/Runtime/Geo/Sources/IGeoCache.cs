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
        public CacheStats(int entries, long bytes, long budget) { Entries = entries; Bytes = bytes; Budget = budget; }
    }
}
