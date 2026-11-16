using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;

namespace Rally.Tests.Geo
{
    /// <summary>Port of legacy-js/tests/osrm.test.mjs.</summary>
    public class OsrmTests : NoSyncContext
    {
        const string Base = "https://router.example/route/v1/driving";
        static readonly LatLon[] Pts = { new LatLon(59.0, 6.0), new LatLon(59.1, 6.2) };

        [Test]
        public void RouteUrlsCarryASnapRadiusPerPointUnlimitedWhereNoneIsSet()
        {
            Assert.AreEqual($"{Base}/6,59;6.2,59.1?overview=full&geometries=geojson&steps=false", OsrmRouter.RouteUrl(Base, Pts));
            Assert.AreEqual($"{Base}/6,59;6.2,59.1?overview=full&geometries=geojson&steps=false", OsrmRouter.RouteUrl(Base, Pts, new[] { double.NaN, double.NaN }));
            Assert.AreEqual($"{Base}/6,59;6.2,59.1?overview=full&geometries=geojson&steps=false&radiuses=1000;unlimited",
                OsrmRouter.RouteUrl(Base, Pts, new[] { OsrmRouter.SnapRadius, double.NaN }));
        }

        [Test]
        public void NearestWithinTakesTheFirstWaypointInsideTheRadius()
        {
            var data = Json.ParseObject("{\"code\":\"Ok\",\"waypoints\":[{\"location\":[6.01,59.01],\"name\":\"Fv 523\",\"distance\":1240},{\"location\":[6.02,59.02],\"name\":\"\",\"distance\":310}]}");
            var a = OsrmRouter.NearestWithin(data);
            Assert.IsTrue(a.HasValue);
            Assert.AreEqual(59.02, a.Value.Point.Lat); Assert.AreEqual(6.02, a.Value.Point.Lon); Assert.IsNull(a.Value.Name); Assert.AreEqual(310, a.Value.DistanceM);
            var b = OsrmRouter.NearestWithin(data, double.NaN);
            Assert.AreEqual(59.01, b.Value.Point.Lat); Assert.AreEqual("Fv 523", b.Value.Name); Assert.AreEqual(1240, b.Value.DistanceM);
            Assert.IsNull(OsrmRouter.NearestWithin(data, 100));
            Assert.IsNull(OsrmRouter.NearestWithin(Json.ParseObject("{\"code\":\"NoSegment\"}")));
            Assert.IsNull(OsrmRouter.NearestWithin(null));
        }

        [Test]
        public void NearestUrlUsesTheProfilesNearestService()
        {
            Assert.AreEqual("https://router.project-osrm.org/nearest/v1/driving/6.2,59.1?number=3", OsrmRouter.NearestUrl(RouteProfile.Driving, new LatLon(59.1, 6.2)));
            Assert.AreEqual("https://routing.openstreetmap.de/routed-foot/nearest/v1/foot/6.2,59.1?number=3", OsrmRouter.NearestUrl(RouteProfile.Foot, new LatLon(59.1, 6.2)));
        }

        [Test]
        public void NoSegmentBecomesTheFriendlyMessage()
        {
            var cache = new RecordingCache();
            cache.Canned["https://router.project-osrm.org/route/v1/driving/6,59;6.2,59.1?overview=full&geometries=geojson&steps=false&radiuses=1000;1000"] = "{\"code\":\"NoSegment\"}";
            var router = new OsrmRouter(cache);
            var ex = Assert.Throws<RouteException>(() => router.Route(Pts[0], Pts[1], RouteProfile.Driving, default).Sync());
            StringAssert.Contains("No driving road within 1 km", ex.Message);
        }

        [Test]
        public void ARouteIsParsedAndStubSnapsAreRejected()
        {
            var cache = new RecordingCache();
            string key = "https://router.project-osrm.org/route/v1/driving/6,59;6.2,59.1?overview=full&geometries=geojson&steps=false&radiuses=1000;1000";
            cache.Canned[key] = "{\"code\":\"Ok\",\"routes\":[{\"distance\":15000,\"duration\":900,\"geometry\":{\"coordinates\":[[6,59],[6.1,59.05],[6.2,59.1]]}}],\"waypoints\":[{\"distance\":12},{\"distance\":40}]}";
            var r = new OsrmRouter(cache).Route(Pts[0], Pts[1], RouteProfile.Driving, default).Sync();
            Assert.AreEqual(3, r.Coordinates.Count);
            Assert.AreEqual(59.05, r.Coordinates[1].Lat);
            Assert.AreEqual(15000, r.DistanceM);
            Assert.AreEqual(12, r.SnappedA); Assert.AreEqual(40, r.SnappedB);

            cache.Canned[key] = "{\"code\":\"Ok\",\"routes\":[{\"distance\":30,\"duration\":9,\"geometry\":{\"coordinates\":[[6,59],[6.0001,59]]}}],\"waypoints\":[{\"distance\":1},{\"distance\":2}]}";
            var ex = Assert.Throws<RouteException>(() => new OsrmRouter(cache).Route(Pts[0], Pts[1], RouteProfile.Driving, default).Sync());
            StringAssert.Contains("same road or trail", ex.Message);
        }
    }

    /// <summary>A cache whose entries are pre-filled, so a client can be driven without a network.</summary>
    sealed class RecordingCache : IGeoCache
    {
        public readonly Dictionary<string, string> Canned = new Dictionary<string, string>();
        public readonly List<string> Misses = new List<string>();
        public long Budget => GeoCache.DefaultBudget;

        public System.Threading.Tasks.Task<byte[]> Fetch(string key, System.Func<System.Threading.Tasks.Task<byte[]>> loader, string kind, bool isText = false)
        {
            if (Canned.TryGetValue(key, out var text)) return System.Threading.Tasks.Task.FromResult(System.Text.Encoding.UTF8.GetBytes(text));
            Misses.Add(key);
            return loader();
        }
        public System.Threading.Tasks.Task<CacheStats> Stats() => System.Threading.Tasks.Task.FromResult(new CacheStats(Canned.Count, 0, Budget));
        public System.Threading.Tasks.Task Clear() { Canned.Clear(); return System.Threading.Tasks.Task.CompletedTask; }
    }
}
