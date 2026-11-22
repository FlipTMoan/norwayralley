using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using Rally.Core;
using Rally.Gameplay;
using Rally.Geo;
using Rally.Tests.Geo;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Tests.Gameplay
{
    /// <summary>
    /// MY ROUTES and a route's download kept locally (plan_20261122 Parts 1 and 2): the saved list in localStorage, cache
    /// pins that LRU eviction skips, the route's tile list at both detail levels, the paced download and a drive from the
    /// cache with the network off.
    /// </summary>
    public class SavedRoutesTests : NoSyncContext
    {
        static readonly LatLon A = new LatLon(61.11500, 10.46600), B = new LatLon(60.53400, 8.20600);   // Lillehammer, Geilo

        sealed class Storage
        {
            public readonly Dictionary<string, string> Map = new Dictionary<string, string>();
            public string Get(string k) => Map.TryGetValue(k, out var v) ? v : null;
            public void Set(string k, string v) => Map[k] = v;
        }

        // ---- the list ----

        [Test]
        public void ARouteIsSavedOnceRenamedDeletedAndTheListSurvivesAReload()
        {
            var store = new Storage();
            var list = new SavedRouteList(store.Get, store.Set);
            var t = new DateTime(2026, 11, 22, 10, 0, 0, DateTimeKind.Utc);
            var r = list.Add("Lillehammer → Geilo", A, B, "driving", 12345, t);
            Assert.AreSame(r, list.Add("again", A, B, "driving", 12345, t.AddMinutes(1)), "the same picks and profile are not saved twice");
            var other = list.Add("Geilo → Lillehammer", B, A, "driving", 12000, t.AddMinutes(2));
            Assert.AreEqual(2, list.Routes.Count);
            Assert.AreSame(other, list.Routes[0], "newest first");

            Assert.IsTrue(list.Rename(r.Id, "  " + new string('x', 80) + "  "));
            Assert.AreEqual(SavedRouteList.MaxName, r.Name.Length, "names are cut to 60 characters");
            Assert.IsFalse(list.Rename(r.Id, "   "), "an empty name keeps the old one");
            list.Rename(r.Id, "Over the fjell");
            r.Status = "done"; r.FineDone = r.FineTotal = 412; r.CoarseDone = r.CoarseTotal = 38; r.Bytes = 38L << 20;
            list.Save();

            var reloaded = new SavedRouteList(store.Get, store.Set);   // the page reloaded
            Assert.AreEqual(2, reloaded.Routes.Count);
            var back = reloaded.Get(r.Id);
            Assert.AreEqual("Over the fjell", back.Name);
            Assert.AreEqual(A.Lat, back.A.Lat, 1e-9); Assert.AreEqual(B.Lon, back.B.Lon, 1e-9);
            Assert.AreEqual(12.345, back.LengthM / 1000, 1e-6);
            StringAssert.Contains("cached 100 %, 38 MB · fine 412/412 · coarse 38/38", back.Info());
            Assert.AreSame(back, reloaded.Find(new LatLon(A.Lat + 4e-6, A.Lon), B, "driving"), "found by its share-link picks");
            Assert.IsNull(reloaded.Find(A, B, "cycling"));

            Assert.IsTrue(reloaded.Delete(other.Id));
            Assert.AreEqual(1, new SavedRouteList(store.Get, store.Set).Routes.Count);
        }

        [Test]
        public void AnUnreadableListStartsEmpty()
        {
            var store = new Storage();
            store.Set(SavedRouteList.StorageKey, "{not json");
            Assert.AreEqual(0, new SavedRouteList(store.Get, store.Set).Routes.Count);
        }

        [Test]
        public void Polyline6RoundTripsWithinAMicrodegree()
        {
            var pts = new List<LatLon> { A, new LatLon(61.0, 10.0), new LatLon(-33.9, 151.2), B };
            var text = Polyline.Encode(pts);
            var back = Polyline.Decode(text);
            Assert.AreEqual(pts.Count, back.Count);
            for (int i = 0; i < pts.Count; i++) { Assert.AreEqual(pts[i].Lat, back[i].Lat, 1e-6); Assert.AreEqual(pts[i].Lon, back[i].Lon, 1e-6); }
            Assert.AreEqual("_izlhA~rlgdF", Polyline.Encode(new[] { new LatLon(38.5, -120.2) }), "Google's first example point at 1e-6");
            Assert.IsNull(Polyline.Decode("_"), "a cut polyline is not read");
        }

        // ---- pins ----

        [Test]
        public void EvictionSkipsPinnedEntriesCountsASharedTileOnceAndUnpinningDeletesNothing()
        {
            double t = 0;
            var mem = new MemoryBackend();
            var c = new GeoCache(mem, budget: 3500, nowMs: () => t += 61000);
            bool Has(string key) => mem.ListByAge().Sync().Any(e => e.Key == key);   // looks without touching (a hit is an LRU use)
            c.Fetch("shared", () => Task.FromResult(new byte[1000]), "dem").Sync();
            c.Fetch("old", () => Task.FromResult(new byte[1000]), "dem").Sync();
            Assert.IsTrue(c.Pin("shared", "r1").Sync());
            Assert.IsTrue(c.Pin("shared", "r2").Sync());
            Assert.IsFalse(c.Pin("missing", "r1").Sync(), "only stored entries are pinned");
            var st = c.Stats().Sync();
            Assert.AreEqual(2000, st.Bytes, "a tile two routes share is counted once");
            Assert.AreEqual(1000, st.PinnedBytes);

            c.Fetch("a", () => Task.FromResult(new byte[1000]), "dem").Sync();
            c.Fetch("b", () => Task.FromResult(new byte[1000]), "dem").Sync();   // 4000 > 3500: the oldest unpinned goes
            Assert.IsTrue(Has("shared"), "the pinned entry, though used longest ago, stays");
            Assert.IsFalse(Has("old"), "the oldest unpinned entry goes first");
            Assert.IsTrue(Has("a") && Has("b"));

            c.Unpin("r1").Sync();
            Assert.AreEqual(1000, c.Stats().Sync().PinnedBytes, "still pinned by r2");
            c.Unpin("r2").Sync();
            Assert.AreEqual(0, c.Stats().Sync().PinnedBytes);
            Assert.IsTrue(Has("shared"), "unpinning deletes nothing");
            c.Fetch("c", () => Task.FromResult(new byte[1000]), "dem").Sync();
            Assert.IsFalse(Has("shared"), "now a plain LRU entry: the oldest goes first");
        }

        [Test]
        public void TheFileStoreKeepsPinsAcrossRewritesAndReadsOldMetaFiles()
        {
            var dir = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "rally-pins-" + Guid.NewGuid().ToString("N"));
            try
            {
                var fb = new FileBackend(dir);
                fb.Put(new CacheEntry { Key = "k", Kind = "dem", Value = new byte[10], Size = 10, At = 1 }).Sync();
                Assert.IsTrue(fb.AddPin("k", "r1").Sync());
                fb.Put(new CacheEntry { Key = "k", Kind = "dem", Value = new byte[10], Size = 10, At = 99 }).Sync();   // an LRU touch
                Assert.AreEqual("r1", fb.ListByAge().Sync().Single().Pins, "a rewrite keeps the pins");
                var meta = System.IO.Directory.GetFiles(dir, "*.meta").Single();
                System.IO.File.WriteAllLines(meta, System.IO.File.ReadAllLines(meta).Take(5));   // a meta file from before 2026-11-22
                Assert.IsFalse(fb.ListByAge().Sync().Single().Pinned);
                Assert.IsNotNull(fb.Get("k").Sync());
                fb.AddPin("k", "r2").Sync();
                fb.RemovePin("r2").Sync();
                Assert.IsFalse(fb.ListByAge().Sync().Single().Pinned);
            }
            finally { if (System.IO.Directory.Exists(dir)) System.IO.Directory.Delete(dir, true); }
        }

        // ---- the route's tiles ----

        /// <summary>A winding 12 km line (UTM 33) through the hills east of Sauda.</summary>
        static List<Utm33> Line()
        {
            var pts = new List<Utm33>();
            for (int i = 0; i <= 240; i++) { double s = i * 50; pts.Add(new Utm33(-30000 + s, 6620000 + 900 * Math.Sin(s / 1500) + 0.00002 * s * s)); }
            return pts;
        }

        [Test]
        public void TheTileListHasEveryFineTileWithin100mOfTheLineAndNoDuplicates()
        {
            var line = Line();
            var tiles = RouteTiles.Along(line);
            var fine = new HashSet<TileKey>(tiles.Fine);
            Assert.AreEqual(tiles.Fine.Count, fine.Count, "fine keys once");
            Assert.AreEqual(tiles.Coarse.Count, tiles.Coarse.Distinct().Count(), "coarse keys once");
            Assert.IsTrue(tiles.Fine.All(k => k.Kind == TileKind.Fine) && tiles.Coarse.All(k => k.Kind == TileKind.Coarse));
            // Every ground point within FineBand of the line, along the whole line, lies in a listed 1 m tile.
            int checkedPoints = 0;
            for (int i = 1; i < line.Count; i++)
                for (double f = 0; f < 1; f += 0.1)
                {
                    var d = line[i].Minus(line[i - 1]);
                    var p = line[i - 1] + d * f;
                    var n = math.normalize(new double2(-d.y, d.x));
                    for (double off = -TileScheduler.FineBand; off <= TileScheduler.FineBand; off += 10)
                    {
                        var q = p + n * off;
                        Assert.IsTrue(fine.Contains(TileKey.At(TileKind.Fine, q)), $"no fine tile at {q}, {off} m beside the line");
                        checkedPoints++;
                    }
                }
            Assert.Greater(checkedPoints, 40000);
            Assert.Less(tiles.Fine.Count, 12000 / 256 * 6, "a band along the line, not a box around start and finish");
        }

        [Test]
        public void TheTileListCoversEveryTileTheSchedulerLoadsAlongTheStage()
        {
            var line = Line();
            var tiles = RouteTiles.Along(line);
            var listed = new HashSet<TileKey>(tiles.Coarse.Concat(tiles.Fine));
            var wanted = SchedulerAlong(line);
            var missing = wanted.Where(k => !listed.Contains(k)).ToList();
            Assert.IsEmpty(missing, $"{missing.Count} of {wanted.Count} tiles the stage loads are not in the download, e.g. {missing.FirstOrDefault()}");
            Assert.Greater(wanted.Count(k => k.Kind == TileKind.Fine), 100);
        }

        /// <summary>Every tile a real scheduler creates while a car drives the line at 108 km/h (roads = the line near the car).</summary>
        static HashSet<TileKey> SchedulerAlong(List<Utm33> line)
        {
            var sched = new TileScheduler();
            var seen = new HashSet<TileKey>();
            sched.Created += k => seen.Add(k);
            var near = new List<Utm33>();
            for (int i = 0; i + 1 < line.Count; i++)
            {
                var v = math.normalize(line[i + 1].Minus(line[i])) * 30;
                near.Clear();
                foreach (var p in line) if (math.length(p.Minus(line[i])) < 600) near.Add(p);
                sched.Update(line[i], v, near);
                while (sched.TryDequeue(out var k)) sched.MarkReady(k);
            }
            return seen;
        }

        // ---- the download ----

        /// <summary>A stand-in for the services: answers per key unless offline, counts the asks; sources over any cache view.</summary>
        sealed class FakeNet
        {
            public bool Offline;
            public int Asks;
            public readonly List<TaskCompletionSource<byte[]>> Held = new List<TaskCompletionSource<byte[]>>();
            public bool Hold;

            Task<byte[]> Ask()
            {
                Asks++;
                if (Offline) return Task.FromResult<byte[]>(null);
                if (!Hold) return Task.FromResult(new byte[100]);
                var t = new TaskCompletionSource<byte[]>();
                Held.Add(t);
                return t.Task;
            }

            static string B(Bounds25833 b) => FormattableString.Invariant($"{b.MinE:0},{b.MinN:0},{b.MaxE:0},{b.MaxN:0}");

            async Task<T> Get<T>(IGeoCache c, string key, Func<T> make) where T : class
                => await c.Fetch(key, Ask, key.Substring(0, key.IndexOf(':'))) == null ? null : make();

            public PrefetchSources Make(IGeoCache c) => new PrefetchSources
            {
                Dem = async (k, ct) => await Get(c, $"dem:{k.CellM}:{B(k.Bounds)}", () => new object()) != null,
                Roads = (b, ct) => Get(c, "osm:" + B(b), () => new RoadGraphData()),
                Features = (b, ct) => Get(c, "osm:" + B(b), () => new Features()),
                Cover = (b, ct) => Get(c, "sr16:" + B(b), () => new CoverRaster(4, 4, b)),
                Surfaces = (b, ct) => Get(c, "nvdb-s:" + B(b), () => new List<RoadSurfaceLine>()),
                Signs = (b, ct) => Get(c, "nvdb-t:" + B(b), () => new SignSet()),
                Lights = (b, ct) => Get(c, "nvdb-l:" + B(b), () => new LightSet()),
            };
        }

        static RoutePrefetch Prefetch(FakeNet net, ServiceBreakers breakers = null)
        {
            breakers ??= new ServiceBreakers();
            return new RoutePrefetch { Make = net.Make, Breakers = () => breakers, Delay = (ms, ct) => Task.CompletedTask };
        }

        static RouteTiles ShortTiles() => RouteTiles.Along(Line().Take(41).ToList());   // 2 km

        [Test]
        public void TheDownloadPinsEveryTileAndCountsBothLevels()
        {
            var net = new FakeNet();
            var c = new GeoCache(new MemoryBackend());
            var r = new SavedRoute { Id = "r1", Name = "test" };
            var tiles = ShortTiles();
            Prefetch(net).Run(r, tiles, c, null, CancellationToken.None).Sync();
            Assert.AreEqual("done", r.Status);
            Assert.AreEqual(tiles.Fine.Count, r.FineDone); Assert.AreEqual(tiles.Fine.Count, r.FineTotal);
            Assert.AreEqual(tiles.Coarse.Count, r.CoarseDone); Assert.AreEqual(tiles.Coarse.Count, r.CoarseTotal);
            StringAssert.Contains($"fine {tiles.Fine.Count}/{tiles.Fine.Count} · coarse {tiles.Coarse.Count}/{tiles.Coarse.Count}", r.Info());
            var st = c.Stats().Sync();
            Assert.AreEqual(st.Bytes, st.PinnedBytes, "every entry the download stored is pinned");
            Assert.AreEqual(st.Entries * 100, r.Bytes, "each entry counted once");
        }

        [Test]
        public void TheDownloadKeepsAtMostTwoRequestsInFlightAndWaitsWhileDrivingIsBusy()
        {
            var net = new FakeNet { Hold = true };
            var c = new GeoCache(new MemoryBackend());
            bool busy = true; int waits = 0;
            var p = Prefetch(net);
            p.Busy = () => busy;
            p.Delay = (ms, ct) => { waits++; if (waits > 3) busy = false; return Task.CompletedTask; };
            var r = new SavedRoute { Id = "r1" };
            var run = p.Run(r, ShortTiles(), c, null, CancellationToken.None);
            Assert.Greater(waits, 0, "the first request waited for the driving world");
            for (int guard = 0; guard < 100000 && !run.IsCompleted; guard++)
            {
                Assert.LessOrEqual(net.Held.Count(t => !t.Task.IsCompleted), 2, "at most two requests at a time");
                var next = net.Held.FirstOrDefault(t => !t.Task.IsCompleted);
                if (next == null) break;
                next.SetResult(new byte[100]);
            }
            Assert.IsTrue(run.IsCompleted);
            Assert.AreEqual(2, p.MostInFlight);
            Assert.AreEqual("done", r.Status);
        }

        [Test]
        public void APausedServiceHoldsBackOnlyItsOwnDataAndAFailingTileMakesThePartPartial()
        {
            double now = 0;
            var breakers = new ServiceBreakers(null, () => now);
            breakers.Nvdb.Trip();   // NVDB paused when the download starts
            var net = new FakeNet();
            var p = Prefetch(net, breakers);
            int nvdbAsksWhilePaused = 0;
            var make = p.Make;
            p.Make = c => { var s = make(c); var signs = s.Signs; s.Signs = (b, ct) => { if (breakers.Nvdb.IsOpen) nvdbAsksWhilePaused++; return signs(b, ct); }; return s; };
            p.Delay = (ms, ct) => { now += ms; return Task.CompletedTask; };   // the pause runs out while the lanes wait
            var r = new SavedRoute { Id = "r1" };
            p.Run(r, ShortTiles(), new GeoCache(new MemoryBackend()), null, CancellationToken.None).Sync();
            Assert.AreEqual(0, nvdbAsksWhilePaused, "NVDB was not asked during its pause");
            Assert.AreEqual("done", r.Status, "and was asked after it");

            var offline = new FakeNet { Offline = true };
            var r2 = new SavedRoute { Id = "r2" };
            double clock = 0;
            var p2 = Prefetch(offline, new ServiceBreakers(null, () => clock));
            p2.Delay = (ms, ct) => { clock += ms; return Task.CompletedTask; };   // each pause runs out while waited for
            p2.Run(r2, ShortTiles(), new GeoCache(new MemoryBackend()), null, CancellationToken.None).Sync();
            Assert.AreEqual("partial", r2.Status, "no answers: the download ends partial instead of asking forever");
            Assert.AreEqual(0, r2.FineDone + r2.CoarseDone);
        }

        [Test]
        public void AStoppedDownloadFreesItsSlotsAtOnceEvenWhileItsLoadsHang()
        {
            var net = new FakeNet { Hold = true };
            var p = Prefetch(net);
            var stop = new CancellationTokenSource();
            var first = p.Run(new SavedRoute { Id = "r1" }, ShortTiles(), new GeoCache(new MemoryBackend()), null, stop.Token);
            Assert.AreEqual(2, net.Held.Count, "two loads in flight, both hanging");
            stop.Cancel();   // the route was deleted
            Assert.IsTrue(first.IsCompleted, "the stopped download ends without waiting for them");
            var r2 = new SavedRoute { Id = "r2" };
            var second = p.Run(r2, ShortTiles(), new GeoCache(new MemoryBackend()), null, CancellationToken.None);
            Assert.AreEqual(4, net.Held.Count, "the next download gets both slots");
            for (int guard = 0; guard < 100000 && !second.IsCompleted; guard++)
            {
                var next = net.Held.FirstOrDefault(t => !t.Task.IsCompleted);
                if (next == null) break;
                next.SetResult(new byte[100]);
            }
            Assert.AreEqual("done", r2.Status);
        }

        [Test]
        public void AnOverpassThatNeverAnswersHoldsBackOnlyTheCoarseTiles()
        {
            double clock = 0;
            var net = new FakeNet();
            var p = Prefetch(net, new ServiceBreakers(null, () => clock));
            p.Delay = (ms, ct) => { clock += ms; return Task.CompletedTask; };
            var make = p.Make;
            p.Make = c => { var s = make(c); s.Roads = (b, ct) => Task.FromResult<RoadGraphData>(null); return s; };
            var r = new SavedRoute { Id = "r1" };
            var tiles = ShortTiles();
            p.Run(r, tiles, new GeoCache(new MemoryBackend()), null, CancellationToken.None).Sync();
            Assert.AreEqual(tiles.Fine.Count, r.FineDone, "every 1 m tile along the road is in");
            Assert.AreEqual(0, r.CoarseDone);
            Assert.AreEqual("partial", r.Status);
        }

        [Test]
        public void ASavedRouteDrivesWithTheNetworkOffFromItsPinnedCache()
        {
            var net = new FakeNet();
            double t = 0;
            var cache = new GeoCache(new MemoryBackend(), nowMs: () => t += 61000);
            var store = new Storage();
            var list = new SavedRouteList(store.Get, store.Set);
            var line = Line();
            var lineLatLon = line.Select(Proj.ToLatLon).ToList();
            var r = list.Add("Sauda hills", lineLatLon[0], lineLatLon[lineLatLon.Count - 1], "driving", 12000, DateTime.UtcNow);
            string key = SavedRouteList.GeometryKey(r.Id);
            cache.Fetch(key, () => Task.FromResult(Encoding.UTF8.GetBytes(Polyline.Encode(lineLatLon))), "route").Sync();
            cache.Pin(key, r.Id).Sync();
            var tiles = RouteTiles.Along(line);
            Prefetch(net).Run(r, tiles, cache, null, CancellationToken.None).Sync();
            Assert.AreEqual("done", r.Status);

            // Later driving elsewhere fills the cache far beyond its budget: LRU evicts, the route's data stays.
            long kept = cache.Stats().Sync().Bytes;
            cache.SetBudget(kept + 5000).Sync();
            for (int i = 0; i < 300; i++) cache.Fetch("elsewhere:" + i, () => Task.FromResult(new byte[100]), "dem").Sync();
            Assert.LessOrEqual(cache.Stats().Sync().Bytes, kept + 5000);

            // The network goes off; the page reloads (list from localStorage) and the stage loads.
            net.Offline = true;
            int asks = net.Asks;
            var saved = new SavedRouteList(store.Get, store.Set).Find(r.A, r.B, "driving");
            Assert.IsNotNull(saved);
            var bytes = cache.Fetch(SavedRouteList.GeometryKey(saved.Id), () => Task.FromResult<byte[]>(null), "route").Sync();
            var stageLine = Polyline.Decode(Encoding.UTF8.GetString(bytes)).Select(Proj.ToUtm).ToList();
            Assert.AreEqual(line.Count, stageLine.Count, "the stage line comes from the saved route, no router");
            var src = net.Make(cache);
            int coarse = 0, fine = 0;
            foreach (var k in SchedulerAlong(stageLine))
            {
                Assert.IsTrue(src.Dem(k, CancellationToken.None).Sync(), $"DTM of {k} from the cache");
                if (k.Kind == TileKind.Fine) { fine++; continue; }
                coarse++;
                Assert.IsNotNull(src.Roads(k.Bounds, CancellationToken.None).Sync(), $"roads of {k}");
                Assert.IsNotNull(src.Cover(k.Bounds, CancellationToken.None).Sync(), $"forest of {k}");
                Assert.IsNotNull(src.Surfaces(k.Bounds, CancellationToken.None).Sync());
                Assert.IsNotNull(src.Signs(k.Bounds, CancellationToken.None).Sync());
                Assert.IsNotNull(src.Lights(k.Bounds, CancellationToken.None).Sync());
            }
            Assert.AreEqual(asks, net.Asks, "nothing was asked of the network");
            Assert.Greater(fine, 100); Assert.Greater(coarse, 10);
        }
    }
}
