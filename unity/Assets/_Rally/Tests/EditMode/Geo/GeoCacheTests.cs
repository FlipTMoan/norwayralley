using System;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;
using Rally.Geo;

namespace Rally.Tests.Geo
{
    /// <summary>Port of legacy-js/tests/cache.test.mjs.</summary>
    public class GeoCacheTests : NoSyncContext
    {
        static byte[] Buf(int n) => new byte[n];

        [Test]
        public void AHitNeverCallsTheLoaderAgainAndParallelAsksShareOneLoad()
        {
            var c = new GeoCache(new MemoryBackend());
            int loads = 0;
            var gate = new TaskCompletionSource<byte[]>();
            Func<Task<byte[]>> loader = () => { loads++; return gate.Task; };
            var a = c.Fetch("k", loader, "json", true);
            var b = c.Fetch("k", loader, "json", true);
            gate.SetResult(Encoding.UTF8.GetBytes("{\"answer\":42}"));
            Assert.AreEqual("{\"answer\":42}", Encoding.UTF8.GetString(a.Sync()));
            Assert.AreEqual("{\"answer\":42}", Encoding.UTF8.GetString(b.Sync()));
            Assert.AreEqual(1, loads);
            c.Fetch("k", loader, "json", true).Sync();
            Assert.AreEqual(1, loads, "served from the cache");
        }

        [Test]
        public void EntriesBeyondTheBudgetAreEvictedOldestFirst()
        {
            double t = 0;
            var c = new GeoCache(new MemoryBackend(), budget: 2500, nowMs: () => t += 61000);
            c.Fetch("a", () => Task.FromResult(Buf(1000)), "dem").Sync();
            c.Fetch("b", () => Task.FromResult(Buf(1000)), "dem").Sync();
            c.Fetch("a", () => Task.FromResult(Buf(1)), "dem").Sync(); // touch a (now newer than b)
            c.Fetch("c", () => Task.FromResult(Buf(1000)), "dem").Sync();
            var s = c.Stats().Sync();
            Assert.LessOrEqual(s.Bytes, 2500);
            Assert.AreEqual(2, s.Entries);
            int loads = 0;
            c.Fetch("b", () => { loads++; return Task.FromResult(Buf(1)); }, "dem").Sync();
            Assert.AreEqual(1, loads, "b (the oldest) was the one evicted");
        }

        [Test]
        public void FailuresAreNotCachedAndSizesAreMeasuredPerType()
        {
            var c = new GeoCache(new MemoryBackend());
            Assert.Throws<Exception>(() => c.Fetch("x", () => throw new Exception("down"), "data").Sync());
            int loads = 0;
            c.Fetch("x", () => { loads++; return Task.FromResult(Encoding.UTF8.GetBytes("ok")); }, "data", true).Sync();
            Assert.AreEqual(1, loads);
            Assert.AreEqual(12, GeoCache.SizeOf(Buf(12), false));
            Assert.AreEqual(6, GeoCache.SizeOf(Encoding.UTF8.GetBytes("abc"), true));
            Assert.AreEqual(14, GeoCache.SizeOf(Encoding.UTF8.GetBytes("{\"a\":1}"), true));
            Assert.AreEqual(0, GeoCache.SizeOf(null, true));
        }

        [Test]
        public void ANullLoadIsReturnedButNotStored()
        {
            var c = new GeoCache(new MemoryBackend());
            int loads = 0;
            Func<Task<byte[]>> loader = () => { loads++; return Task.FromResult<byte[]>(null); };
            Assert.IsNull(c.Fetch("n", loader, "osm").Sync());
            Assert.IsNull(c.Fetch("n", loader, "osm").Sync());
            Assert.AreEqual(2, loads);
            Assert.AreEqual(0, c.Stats().Sync().Entries);
        }
    }
}
