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
        public void QueryTextMatchesBuildingsJsPlusPowerLines()
        {
            var q = OverpassQuery.Build(Bbox);
            Assert.AreEqual("[out:json][timeout:45];("
                + "way[\"building\"](59.000000,6.000000,59.020000,6.040000);"
                + "relation[\"building\"][\"type\"=\"multipolygon\"](59.000000,6.000000,59.020000,6.040000);"
                + "way[\"landuse\"~\"^(farmland|meadow|orchard|farmyard|grass|forest|residential|industrial|commercial|retail|quarry|cemetery)$\"](59.000000,6.000000,59.020000,6.040000);"
                + "way[\"natural\"~\"^(wood|water|wetland|scrub|grassland|heath|bare_rock|scree|sand)$\"](59.000000,6.000000,59.020000,6.040000);"
                + "way[\"waterway\"~\"^(river|stream|canal|drain|ditch)$\"](59.000000,6.000000,59.020000,6.040000);"
                + "way[\"highway\"~\"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|track)$\"](59.000000,6.000000,59.020000,6.040000);"
                + "way[\"power\"~\"^(line|minor_line)$\"](59.000000,6.000000,59.020000,6.040000);"
                + ");out geom;", q);
            Assert.AreEqual("overpass:59.00000,6.00000,59.02000,6.04000", OverpassQuery.CacheKey(Bbox));
            StringAssert.StartsWith("data=%5Bout%3Ajson%5D%5Btimeout%3A45%5D%3B(way%5B%22building%22%5D(59.000000%2C6.000000", OverpassQuery.Body(q));
        }

        const string Answer = "{\"elements\":[{\"type\":\"way\",\"id\":1,\"tags\":{\"building\":\"house\"},\"geometry\":[{\"lat\":59.001,\"lon\":6.001},{\"lat\":59.001,\"lon\":6.0012},{\"lat\":59.0012,\"lon\":6.0012},{\"lat\":59.0012,\"lon\":6.001},{\"lat\":59.001,\"lon\":6.001}]},"
            + "{\"type\":\"way\",\"id\":2,\"tags\":{\"highway\":\"residential\",\"name\":\"Testvegen\",\"maxspeed\":\"50\"},\"geometry\":[{\"lat\":59.0,\"lon\":6.0},{\"lat\":59.01,\"lon\":6.01}]},"
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

        /// <summary>legacy-js/tests/overpass.test.mjs: a hanging first mirror does not delay houses; the winner is remembered.</summary>
        [Test]
        public void MirrorsRaceAndTheWinnerIsRemembered()
        {
            const string fast = "https://overpass.openstreetmap.fr/api/interpreter";
            var calls = new List<string>();
            var hung = new List<TaskCompletionSource<string>>();
            double now = 0;
            OverpassMirrors.Ask ask = (endpoint, body, timeout, ct) =>
            {
                calls.Add(endpoint);
                if (endpoint == fast) return Task.FromResult(Answer);
                var tcs = new TaskCompletionSource<string>();
                ct.Register(() => tcs.TrySetCanceled());
                hung.Add(tcs);
                return tcs.Task;
            };
            var mirrors = new OverpassMirrors(ask, () => now);
            var source = new OverpassSource(new GeoCache(new MemoryBackend()), mirrors);
            var bounds = Bbox.ToUtmEnvelope();

            var first = source.FetchFeatures(bounds, default).Sync();
            Assert.AreEqual(1, first.Buildings.Count);
            Assert.AreEqual(fast, mirrors.Preferred);
            Assert.AreEqual(4, calls.Count, "all four mirrors were raced the first time");
            Assert.IsTrue(hung.TrueForAll(t => t.Task.IsCanceled), "losers were cancelled by the winner");
            Assert.IsEmpty(mirrors.Down(), "losers cancelled by the winner are not marked down");

            source.FetchFeatures(bounds, default).Sync();
            Assert.AreEqual(4, calls.Count, "the same chunk again comes from the cache, no request at all");

            var second = source.FetchFeatures(new LatLonBounds(59.02, 6, 59.04, 6.04).ToUtmEnvelope(), default).Sync();
            Assert.AreEqual(1, second.Buildings.Count);
            Assert.AreEqual(5, calls.Count, "a new chunk went to the remembered mirror only");
            Assert.AreEqual(fast, calls[4]);
        }

        [Test]
        public void EveryMirrorFailingTripsTheBreakerAndNothingIsCached()
        {
            double now = 0;
            int calls = 0;
            OverpassMirrors.Ask ask = (e, b, t, ct) => { calls++; return Task.FromException<string>(new Exception("HTTP 504")); };
            var mirrors = new OverpassMirrors(ask, () => now);
            var source = new OverpassSource(new GeoCache(new MemoryBackend()), mirrors);
            var bounds = Bbox.ToUtmEnvelope();
            Assert.AreEqual(0, source.FetchRoads(bounds, default).Sync().Ways.Count);
            Assert.AreEqual(4, calls);
            Assert.IsTrue(mirrors.Breaker.IsOpen);
            Assert.AreEqual(4, mirrors.Down().Count);
            source.FetchRoads(bounds, default).Sync();
            Assert.AreEqual(4, calls, "while the breaker is open nothing is asked");
            now = CircuitBreaker.OpenMs + 1;
            Assert.IsFalse(mirrors.Breaker.IsOpen);
            source.FetchRoads(bounds, default).Sync();
            Assert.AreEqual(8, calls, "after 60 s the (still penalised, so all) mirrors are tried again");
        }
    }
}
