using NUnit.Framework;
using Rally.Geo;

namespace Rally.Tests.Geo
{
    /// <summary>User, 2026-11-18: cache at most 32 GB, but never fill the disk past 90 %.</summary>
    public class CacheBudgetTests : NoSyncContext
    {
        const long GB = 1024L * 1024 * 1024;

        [Test]
        public void AnEmptyBigDiskGetsTheFull32Gb()
        {
            var room = new StorageRoom(2000 * GB, 1500 * GB, -1, -1);
            Assert.AreEqual(GeoCache.MaxBudget, GeoCache.BudgetFor(room, 0));
        }

        [Test]
        public void ANearlyFullDiskKeepsTenPercentFree()
        {
            // 500 GB disk, 60 GB free, the cache already holds 5 GB: it may grow until 50 GB stay free → 5 + 60 − 50 = 15 GB.
            var room = new StorageRoom(500 * GB, 60 * GB, -1, -1);
            Assert.AreEqual(15 * GB, GeoCache.BudgetFor(room, 5 * GB));
        }

        [Test]
        public void ADiskBelowTenPercentFreeShrinksTheCacheBelowWhatItHolds()
        {
            // 500 GB disk, 20 GB free (4 %), cache holds 12 GB: budget = 12 + 20 − 50 < 0 → 0, everything is evicted.
            var room = new StorageRoom(500 * GB, 20 * GB, -1, -1);
            Assert.AreEqual(0, GeoCache.BudgetFor(room, 12 * GB));
            room = new StorageRoom(500 * GB, 45 * GB, -1, -1);
            Assert.AreEqual(7 * GB, GeoCache.BudgetFor(room, 12 * GB), "12 + 45 − 50 = 7 GB: the cache gives back 5 GB");
        }

        [Test]
        public void InABrowserTenPercentOfTheQuotaStaysUnusedAndOtherDataCounts()
        {
            // Quota 20 GB, the origin uses 3 GB of which the cache is 2 GB: 18 GB usable − 1 GB of other data = 17 GB.
            var room = new StorageRoom(-1, -1, 20 * GB, 3 * GB);
            Assert.AreEqual(17 * GB, GeoCache.BudgetFor(room, 2 * GB));
            room = new StorageRoom(-1, -1, 600 * GB, 1 * GB);
            Assert.AreEqual(GeoCache.MaxBudget, GeoCache.BudgetFor(room, 1 * GB), "a large quota is still capped at 32 GB");
        }

        [Test]
        public void UnknownRoomKeepsTheCap() => Assert.AreEqual(GeoCache.MaxBudget, GeoCache.BudgetFor(StorageRoom.Unknown, 0));

        [Test]
        public void RefreshBudgetEvictsWhenTheDiskFilledUp()
        {
            var backend = new MemoryBackend();
            var cache = new GeoCache(backend);
            for (int i = 0; i < 4; i++) cache.Fetch("k" + i, () => System.Threading.Tasks.Task.FromResult(new byte[1000]), "dem").Wait();
            // The disk is now nearly full: 1 MB total, 101 kB free → room for 4000 + 101 000 − 100 000 = 5000 bytes, all four stay;
            // then free drops to 99 000 → 3000 bytes: the oldest entry goes.
            backend.StorageRoom = new StorageRoom(1_000_000, 101_000, -1, -1);
            cache.RefreshBudget().Wait();
            Assert.AreEqual(5000, cache.Budget);
            backend.StorageRoom = new StorageRoom(1_000_000, 99_000, -1, -1);
            cache.RefreshBudget().Wait();
            Assert.AreEqual(3000, cache.Budget);
            Assert.AreEqual(3, backend.ListByAge().Result.Count, "the oldest entry was evicted to keep 10 % of the disk free");
        }
    }
}
