using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;

namespace Rally.Tests.Geo
{
    public class OverpassTests : NoSyncContext
    {
        static readonly LatLonBounds Bbox = new LatLonBounds(59, 6, 59.02, 6.04);

        [Test]
        public void QueryTextMatchesBuildingsJsPlusPowerLinesWithoutRoads()
        {
            var q = OverpassQuery.Build(Bbox);
            Assert.AreEqual("[out:json][timeout:45];("
                + "way[\"building\"](59.000000,6.000000,59.020000,6.040000);"
                + "relation[\"building\"][\"type\"=\"multipolygon\"](59.000000,6.000000,59.020000,6.040000);"
                + "way[\"landuse\"~\"^(farmland|meadow|orchard|farmyard|grass|forest|residential|industrial|commercial|retail|quarry|cemetery)$\"](59.000000,6.000000,59.020000,6.040000);"
                + "way[\"natural\"~\"^(wood|water|wetland|scrub|grassland|heath|bare_rock|scree|sand)$\"](59.000000,6.000000,59.020000,6.040000);"
                + "way[\"waterway\"~\"^(river|stream|canal|drain|ditch)$\"](59.000000,6.000000,59.020000,6.040000);"
                + "way[\"power\"~\"^(line|minor_line)$\"](59.000000,6.000000,59.020000,6.040000);"
                + ");out geom;", q);
            Assert.AreEqual("overpass3:59.00000,6.00000,59.02000,6.04000", OverpassQuery.CacheKey(Bbox), "version 3: the roads left the tile query");
            StringAssert.StartsWith("data=%5Bout%3Ajson%5D%5Btimeout%3A45%5D%3B(way%5B%22building%22%5D(59.000000%2C6.000000", OverpassQuery.Body(q));
        }

        [Test]
        public void TheRoadsQueryAsksOnlyTheDrivableWaysWithTagsAndGeometry()
        {
            Assert.AreEqual("[out:json][timeout:45];way[\"highway\"~\"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|track|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$\"](59.000000,6.000000,59.020000,6.040000);out tags geom;",
                OverpassQuery.BuildRoads(Bbox));
            Assert.AreEqual("osmroads1:59.00000,6.00000,59.02000,6.04000", OverpassQuery.RoadsCacheKey(Bbox));
            Assert.AreNotEqual(OverpassQuery.CacheKey(Bbox), OverpassQuery.RoadsCacheKey(Bbox), "roads and features are cached apart");
        }

        const string Answer = "{\"elements\":[{\"type\":\"way\",\"id\":1,\"tags\":{\"building\":\"house\"},\"geometry\":[{\"lat\":59.001,\"lon\":6.001},{\"lat\":59.001,\"lon\":6.0012},{\"lat\":59.0012,\"lon\":6.0012},{\"lat\":59.0012,\"lon\":6.001},{\"lat\":59.001,\"lon\":6.001}]},"
            + "{\"type\":\"way\",\"id\":2,\"tags\":{\"highway\":\"residential\",\"name\":\"Testvegen\",\"maxspeed\":\"50\",\"smoothness\":\"good\"},\"geometry\":[{\"lat\":59.0,\"lon\":6.0},{\"lat\":59.01,\"lon\":6.01}]},"
            + "{\"type\":\"way\",\"id\":3,\"tags\":{\"natural\":\"water\"},\"geometry\":[{\"lat\":59.0,\"lon\":6.0},{\"lat\":59.01,\"lon\":6.0},{\"lat\":59.01,\"lon\":6.01}]},"
            + "{\"type\":\"way\",\"id\":4,\"tags\":{\"power\":\"line\"},\"geometry\":[{\"lat\":59.0,\"lon\":6.0},{\"lat\":59.02,\"lon\":6.04}]}]}";

        [Test]
        public void ParsesRoadsBuildingsAreasAndPowerLinesIntoUtm()
        {
            var chunk = OverpassSource.Parse(Json.ParseObject(Answer).Arr("elements"));
            Assert.AreEqual(1, chunk.Roads.Ways.Count);
            Assert.AreEqual("residential", chunk.Roads.Ways[0].Kind);
            Assert.AreEqual(50, chunk.Roads.Ways[0].Maxspeed);
            Assert.AreEqual(1, chunk.Features.Buildings.Count);
            Assert.AreEqual(5, chunk.Features.Buildings[0].Polygon.Count);
            Assert.AreEqual(1, chunk.Features.Areas.Count);
            Assert.IsTrue(chunk.Features.Areas[0].IsWater);
            Assert.AreEqual(1, chunk.Features.PowerLines.Count);
            var expected = Proj.ToUtm(new LatLon(59.001, 6.001));
            Assert.AreEqual(expected.E, chunk.Features.Buildings[0].Polygon[0].E, 1e-6);
            Assert.AreEqual(expected.N, chunk.Features.Buildings[0].Polygon[0].N, 1e-6);
        }

        const string De = "https://overpass-api.de/api/interpreter", Coffee = "https://overpass.private.coffee/api/interpreter",
            Fr = "https://overpass.openstreetmap.fr/api/interpreter", Dresel = "https://ovp.dresel.systems/api/interpreter";
        static readonly string Probe = OverpassQuery.Body(OverpassMirrors.ProbeQuery);

        /// <summary>A scripted set of mirrors: per endpoint how it answers probes and real queries ("ok", "hang", "fail", "hold").</summary>
        sealed class FakeMirrors
        {
            public readonly Dictionary<string, string> ProbeMode = new Dictionary<string, string>(), QueryMode = new Dictionary<string, string>();
            public readonly List<(string endpoint, string body)> Calls = new List<(string, string)>();
            public readonly List<(string endpoint, TaskCompletionSource<string> tcs)> Held = new List<(string, TaskCompletionSource<string>)>();
            public string Reply = Answer;

            /// <summary>Every other mirror fails its probe.</summary>
            public FakeMirrors Only(params string[] up)
            {
                foreach (var e in OverpassMirrors.Endpoints) if (System.Array.IndexOf(up, e) < 0) ProbeMode[e] = "fail";
                return this;
            }
            public double Now;
            public readonly List<TaskCompletionSource<bool>> Hedges = new List<TaskCompletionSource<bool>>();

            public OverpassMirrors Make()
            {
                var m = new OverpassMirrors(Ask, () => Now);
                m.Delay = (ms, ct) => { var t = new TaskCompletionSource<bool>(); ct.Register(() => t.TrySetCanceled()); Hedges.Add(t); return t.Task; };
                return m;
            }

            Task<string> Ask(string endpoint, string body, int timeout, CancellationToken ct)
            {
                Calls.Add((endpoint, body));
                var modes = body == Probe ? ProbeMode : QueryMode;
                string mode = modes.TryGetValue(endpoint, out var md) ? md : "ok";
                if (mode == "ok") return Task.FromResult(body == Probe ? "{\"elements\":[]}" : Reply);
                if (mode == "fail") return Task.FromException<string>(new Exception("HTTP 502"));
                var tcs = new TaskCompletionSource<string>();
                ct.Register(() => tcs.TrySetCanceled());
                if (mode == "hold") Held.Add((endpoint, tcs));
                return tcs.Task;
            }

            public int Real(string endpoint) => Calls.FindAll(c => c.endpoint == endpoint && c.body != Probe).Count;
        }

        /// <summary>
        /// A mirror nobody has heard from gets a tiny probe first, not a 4 MB query: the real query goes only to the mirror that
        /// answered (legacy-js/tests/overpass.test.mjs raced the full query on all four: a hanging mirror then held a slot 20 s).
        /// </summary>
        [Test]
        public void ProbesFirstAndTheQueryGoesOnlyToAMirrorThatAnswered()
        {
            var net = new FakeMirrors().Only(Fr, De, Dresel);
            net.ProbeMode[De] = "hang"; net.ProbeMode[Dresel] = "hang";
            var mirrors = net.Make();
            var source = new OverpassSource(new GeoCache(new MemoryBackend()), mirrors);
            var first = source.FetchFeatures(Bbox.ToUtmEnvelope(), default).Sync();
            Assert.AreEqual(1, first.Buildings.Count);
            Assert.AreEqual(OverpassMirrors.Endpoints.Length, net.Calls.FindAll(c => c.body == Probe).Count, "every mirror probed once");
            Assert.AreEqual(1, net.Real(Fr)); Assert.AreEqual(1, net.Calls.FindAll(c => c.body != Probe).Count, "no full query on a mirror not heard from");
            Assert.AreEqual(Fr, mirrors.Preferred);
            CollectionAssert.DoesNotContain(mirrors.Down(), De, "a mirror still probing is not paused");
            CollectionAssert.Contains(mirrors.Down(), Coffee, "a failed probe pauses that mirror");
            Assert.IsFalse(mirrors.Breaker.IsOpen);
            source.FetchFeatures(Bbox.ToUtmEnvelope(), default).Sync();
            Assert.AreEqual(1, net.Real(Fr), "the same tile again comes from the cache");
        }

        /// <summary>Different queries go to different healthy mirrors at once, two per mirror; a third waits for a free slot.</summary>
        [Test]
        public void DifferentQueriesSpreadOverTheHealthyMirrorsTwoSlotsEach()
        {
            var net = new FakeMirrors().Only(Fr, Coffee);
            net.QueryMode[Fr] = "hold"; net.QueryMode[Coffee] = "hold";
            var mirrors = net.Make();
            var asks = new List<Task<string>>();
            for (int i = 0; i < 6; i++) asks.Add(mirrors.Query($"[out:json];way({i});out;", default));
            Assert.AreEqual(2, net.Real(Fr)); Assert.AreEqual(2, net.Real(Coffee), "four at once: two on each healthy mirror");
            net.Held.Find(h => h.endpoint == Fr).tcs.SetResult(Answer);
            Assert.AreEqual(3, net.Real(Fr), "a freed slot takes the next waiting query");
            Assert.AreEqual(5, net.Real(Fr) + net.Real(Coffee));
            foreach (var h in net.Held.ToArray()) h.tcs.TrySetResult(Answer);
            foreach (var h in net.Held.ToArray()) h.tcs.TrySetResult(Answer);
            Assert.IsTrue(asks.TrueForAll(a => a.IsCompleted && a.Result == Answer));
        }

        /// <summary>Each server's own limit: dresel.systems allows four parallel queries per client, the others two.</summary>
        [Test]
        public void DreselTakesFourAtOnce()
        {
            var net = new FakeMirrors().Only(Dresel);
            net.QueryMode[Dresel] = "hold";
            var mirrors = net.Make();
            for (int i = 0; i < 6; i++) mirrors.Query($"q{i}", default);
            Assert.AreEqual(4, net.Real(Dresel));
            Assert.AreEqual(2, OverpassMirrors.SlotsOf(Fr));
        }

        /// <summary>Road regions go before waiting feature queries.</summary>
        [Test]
        public void RoadsGoBeforeWaitingFeatures()
        {
            var net = new FakeMirrors().Only(Fr);
            net.QueryMode[Fr] = "hold";
            var mirrors = net.Make();
            mirrors.Query("f1", default); mirrors.Query("f2", default);
            mirrors.Query("f3", default, OverpassMirrors.Priority.Features);
            mirrors.Query("r1", default, OverpassMirrors.Priority.Roads);
            net.Held[0].tcs.SetResult(Answer);
            Assert.AreEqual(OverpassQuery.Body("r1"), net.Calls[net.Calls.Count - 1].body, "the road query took the free slot");
        }

        /// <summary>
        /// A mirror that answered its probe but sits on the query (a 40 s queue) is hedged: after 3 × the usual time the next
        /// healthy mirror is asked too; the first answer wins, and the loser cancelled by it is not paused.
        /// </summary>
        [Test]
        public void ASlowMirrorIsHedgedOnTheNextHealthyOne()
        {
            var net = new FakeMirrors().Only(Fr, De);
            net.QueryMode[Fr] = "hang";
            var mirrors = net.Make();
            var a = mirrors.Query("q1", default);
            var b = mirrors.Query("q2", default);
            Assert.AreEqual(1, net.Real(De)); Assert.AreEqual(1, net.Real(Fr), "the two spread over the two mirrors");
            Assert.IsTrue(b.IsCompleted, "the one on the good mirror is in");
            Assert.IsFalse(a.IsCompleted);
            net.Hedges[0].SetResult(true);   // q1's hedge time is up
            Assert.IsTrue(a.IsCompleted); Assert.AreEqual(Answer, a.Result);
            Assert.AreEqual(2, net.Real(De), "the hedge asked the good mirror");
            CollectionAssert.DoesNotContain(mirrors.Down(), Fr, "the slow one cancelled by the winner is not paused");
        }

        /// <summary>A failing mirror pauses on its own and the query goes on to the next one; the service pause stays shut.</summary>
        [Test]
        public void AFailingMirrorIsPausedAndTheQueryGoesToTheNext()
        {
            var net = new FakeMirrors().Only(Fr, De);
            net.QueryMode[Fr] = "fail";
            var mirrors = net.Make();
            Assert.AreEqual(Answer, mirrors.Query("q", default).Sync());
            Assert.AreEqual(1, net.Real(Fr)); Assert.AreEqual(1, net.Real(De));
            CollectionAssert.Contains(mirrors.Down(), Fr);
            Assert.IsFalse(mirrors.Breaker.IsOpen);
            Assert.AreEqual(Answer, mirrors.Query("q2", default).Sync());
            Assert.AreEqual(1, net.Real(Fr), "a paused mirror gets nothing");
        }

        /// <summary>Overpass answers 200 with a runtime-error remark when it ran out of time: half a network, so a failure.</summary>
        [Test]
        public void AnAnswerWithAnOverpassRuntimeErrorIsAFailure()
        {
            StringAssert.Contains("runtime error", OverpassMirrors.RuntimeError("{\"elements\":[],\n\"remark\": \"runtime error: Query timed out in \\\"query\\\" at line 1 after 46 seconds.\"\n}"));
            Assert.IsNull(OverpassMirrors.RuntimeError(Answer));
            var net = new FakeMirrors().Only(Fr);
            net.Reply = "{\"elements\":[],\n\"remark\": \"runtime error: Query run out of memory using about 2048 MB of RAM.\"\n}";
            var mirrors = net.Make();
            Assert.IsNull(mirrors.Query("q", default).Sync());
            CollectionAssert.Contains(mirrors.Down(), Fr);
        }

        [Test]
        public void EveryMirrorFailingTripsTheBreakerAndNothingIsCached()
        {
            var net = new FakeMirrors();
            foreach (var e in OverpassMirrors.Endpoints) net.ProbeMode[e] = "fail";
            var mirrors = net.Make();
            var source = new OverpassSource(new GeoCache(new MemoryBackend()), mirrors);
            var bounds = Bbox.ToUtmEnvelope();
            Assert.IsNull(source.FetchRoads(bounds, default).Sync(), "no answer is null (asked again), not an empty answer");
            int n = OverpassMirrors.Endpoints.Length;
            Assert.AreEqual(n, net.Calls.Count);
            Assert.IsTrue(mirrors.Breaker.IsOpen);
            Assert.AreEqual(n, mirrors.Down().Count);
            source.FetchRoads(bounds, default).Sync();
            Assert.AreEqual(n, net.Calls.Count, "while the breaker is open nothing is asked");
            net.Now = CircuitBreaker.OpenMs + 1;
            Assert.IsFalse(mirrors.Breaker.IsOpen);
            foreach (var e in OverpassMirrors.Endpoints) net.ProbeMode[e] = "ok";
            Assert.IsNotNull(source.FetchRoads(bounds, default).Sync(), "after the pause the mirrors are probed again and asked");
        }

        /// <summary>
        /// "When all scenes are cached, only load the missing pieces" (owner, 2026-11-22): a tile cached under the old combined
        /// key (<c>overpass2:</c>) gives its roads and features with no request at all, and a tile further asks only for its
        /// own road regions and features.
        /// </summary>
        [Test]
        public void ATileCachedUnderTheOldKeyLoadsWithoutARequest()
        {
            var cache = new GeoCache(new MemoryBackend());
            var tile = new Rally.World.TileKey(Rally.World.TileKind.Coarse, 3, 3260);
            var b = tile.Bounds;
            var answer = Json.Stringify(Json.ParseObject(Answer).Arr("elements"));
            cache.Fetch(OverpassQuery.OldCacheKey(LatLonBounds.Of(b)), () => Task.FromResult(System.Text.Encoding.UTF8.GetBytes(answer)), "osm", true).Sync();
            var net = new FakeMirrors().Only(Fr);
            var source = new OverpassSource(cache, net.Make());
            var regions = new Rally.Gameplay.RoadRegions(source.FetchRoads)
            {
                OldTile = async k => (await source.OldTile(k.Bounds))?.Roads,
                HasOldTile = k => source.HasOldTile(k.Bounds),
            };
            regions.Prefetch(tile, default);
            var roads = regions.ForTile(tile, default).Sync();
            var features = source.FetchFeatures(b, default).Sync();
            Assert.AreEqual(0, net.Calls.Count, "no probe, no query: everything came from the cache");
            Assert.AreEqual(1, roads.Ways.Count); Assert.AreEqual(1, features.Buildings.Count);
            Assert.AreEqual(1, cache.CountsOf("osm").fetched, "only the entry the test stored");

            var further = new Rally.World.TileKey(Rally.World.TileKind.Coarse, 6, 3260);
            regions.ForTile(further, default).Sync();
            source.FetchFeatures(further.Bounds, default).Sync();
            int regionsAsked = Rally.Gameplay.RoadRegions.Around(further).Count;
            Assert.AreEqual(regionsAsked + 1, net.Calls.FindAll(c => c.body != Probe).Count, "a tile further: its road regions and its features, nothing else");
        }

        /// <summary>An empty but valid answer (no roads in the box) is stored: the next ask is a cache hit.</summary>
        [Test]
        public void AnEmptyRoadAnswerIsCached()
        {
            var net = new FakeMirrors().Only(Fr);
            net.Reply = "{\"elements\":[]}";
            var cache = new GeoCache(new MemoryBackend());
            var source = new OverpassSource(cache, net.Make());
            Assert.AreEqual(0, source.FetchRoads(Bbox.ToUtmEnvelope(), default).Sync().Ways.Count);
            int calls = net.Calls.Count;
            Assert.AreEqual(0, new OverpassSource(cache, net.Make()).FetchRoads(Bbox.ToUtmEnvelope(), default).Sync().Ways.Count);
            Assert.AreEqual(calls, net.Calls.Count, "asked once");
            Assert.AreEqual((1, 1, 0), cache.CountsOf("osmroads"));
        }

        /// <summary>The roads-only answer parses into the same ways as the combined answer did, with only the tags the game reads.</summary>
        [Test]
        public void TheRoadsAnswerParsesTheSameWaysAsTheCombinedOne()
        {
            var combined = OverpassSource.Parse(Json.ParseObject(Answer).Arr("elements")).Roads;
            var net = new FakeMirrors().Only(Fr);
            var source = new OverpassSource(new GeoCache(new MemoryBackend()), net.Make());
            var roads = source.FetchRoads(Bbox.ToUtmEnvelope(), default).Sync();
            Assert.AreEqual(combined.Ways.Count, roads.Ways.Count);
            for (int i = 0; i < roads.Ways.Count; i++)
            {
                Assert.AreEqual(combined.Ways[i].Id, roads.Ways[i].Id);
                CollectionAssert.AreEqual(combined.Ways[i].Nodes, roads.Ways[i].Nodes);
                foreach (var k in OverpassQuery.RoadTags) Assert.AreEqual(combined.Ways[i].Tag(k), roads.Ways[i].Tag(k), k);
            }
            Assert.AreEqual(50, roads.Ways[0].Maxspeed);
            StringAssert.StartsWith("osmroads1:", OverpassQuery.RoadsCacheKey(Bbox));
        }
    }
}
