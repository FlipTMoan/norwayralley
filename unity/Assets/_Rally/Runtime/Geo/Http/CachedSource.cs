using System;
using System.Text;
using System.Threading.Tasks;

namespace Rally.Geo
{
    /// <summary>
    /// Wraps a loader in the cache + breaker policy every source shares: a hit never touches the
    /// network; a loader that fails trips nothing by itself (the source decides, as buildings.js
    /// only trips after all mirrors failed), but while the breaker is open the loader is skipped
    /// and null returned, which the cache does not store (cache.js: "null is not cached").
    /// </summary>
    public sealed class CachedSource<T> where T : class
    {
        readonly IGeoCache cache;
        readonly CircuitBreaker breaker;
        readonly string kind;
        readonly Func<T, byte[]> encode;
        readonly Func<byte[], T> decode;
        readonly bool isText;

        public CachedSource(IGeoCache cache, string kind, Func<T, byte[]> encode, Func<byte[], T> decode, CircuitBreaker breaker = null, bool isText = false)
        {
            this.cache = cache; this.kind = kind; this.encode = encode; this.decode = decode; this.breaker = breaker; this.isText = isText;
        }

        /// <summary>A text-valued source (JSON answers).</summary>
        public static CachedSource<string> Text(IGeoCache cache, string kind, CircuitBreaker breaker = null)
            => new CachedSource<string>(cache, kind, Encoding.UTF8.GetBytes, Encoding.UTF8.GetString, breaker, isText: true);

        public async Task<T> Get(string key, Func<Task<T>> loader)
        {
            var bytes = await cache.Fetch(key, async () =>
            {
                if (breaker != null && breaker.IsOpen) return null;
                var value = await loader();
                return value == null ? null : encode(value);
            }, kind, isText);
            return bytes == null ? null : decode(bytes);
        }
    }
}
