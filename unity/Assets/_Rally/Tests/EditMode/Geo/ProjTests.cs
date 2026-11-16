using NUnit.Framework;
using Rally.Core;
using Rally.Geo;

namespace Rally.Tests.Geo
{
    public class ProjTests
    {
        /// <summary>
        /// Reference from legacy-js/src/geo.js utmForward(58.98634, 6.19051), run with node: Preikestolen lies
        /// 9° west of the zone 33 central meridian, so its easting is negative in EPSG:25833 (the national frame).
        /// </summary>
        [Test]
        public void PreikestolenMatchesTheJsWithinTwoMetres()
        {
            var u = Proj.ToUtm(new LatLon(58.98634, 6.19051));
            Assert.AreEqual(-5384.99, u.E, 2.0);
            Assert.AreEqual(6571930.31, u.N, 2.0);
        }

        [TestCase(59.91, 10.75)]   // Oslo
        [TestCase(61.1, 10.4)]     // Lillehammer
        [TestCase(63.43, 10.39)]   // Trondheim
        [TestCase(69.65, 18.95)]   // Tromsø
        [TestCase(64.0, 15.0)]     // on the central meridian
        public void RoundTripsWithinAMicrodegree(double lat, double lon)
        {
            var back = Proj.ToLatLon(Proj.ToUtm(new LatLon(lat, lon)));
            Assert.AreEqual(lat, back.Lat, 1e-6);
            Assert.AreEqual(lon, back.Lon, 1e-6);
        }

        /// <summary>Far from 15°E the series loses accuracy (the JS shows the same 1.2e-5° at Preikestolen, ~0.7 m).</summary>
        [Test]
        public void RoundTripAtTheWestCoastStaysUnderAMetre()
        {
            var p = new LatLon(58.98634, 6.19051);
            var back = Proj.ToLatLon(Proj.ToUtm(p));
            Assert.AreEqual(p.Lat, back.Lat, 1e-5);
            Assert.AreEqual(p.Lon, back.Lon, 2e-5);
        }

        [Test]
        public void LatLonEnvelopeOfAUtmSquareContainsItsCorners()
        {
            var b = new Bounds25833(250000, 6780000, 252048, 6782048);
            var env = LatLonBounds.Of(b);
            foreach (var c in new[] { new Utm33(b.MinE, b.MinN), new Utm33(b.MaxE, b.MaxN), new Utm33(b.MinE, b.MaxN), new Utm33(b.MaxE, b.MinN) })
            {
                var p = Proj.ToLatLon(c);
                Assert.That(p.Lat, Is.InRange(env.MinLat, env.MaxLat));
                Assert.That(p.Lon, Is.InRange(env.MinLon, env.MaxLon));
            }
            var round = env.ToUtmEnvelope();
            Assert.LessOrEqual(round.MinE, b.MinE); Assert.GreaterOrEqual(round.MaxE, b.MaxE);
        }

        [Test]
        public void NvdbKartutsnittAndSignParsingMatchSignsJs()
        {
            Assert.AreEqual("https://nvdbapiles.atlas.vegvesen.no/vegobjekter/api/v4/vegobjekter/96?kartutsnitt=256000.0,6781000.0,258000.0,6783000.0&srid=5973&inkluder=geometri,egenskaper,lokasjon&antall=1000",
                NvdbSource.FirstPageUrl(96, new Bounds25833(256000, 6781000, 258000, 6783000)));
            Assert.AreEqual("362.50", NvdbSource.SignNumber("362.50 - Fartsgrense 50 km/t"));
            Assert.AreEqual("100.1", NvdbSource.SignNumber("100.1 - Farlig sving til høyre"));
            Assert.AreEqual("729", NvdbSource.SignNumber("729 Gate-/vegnavnskilt"));
            Assert.IsNull(NvdbSource.SignNumber("Ukjent"));
            Assert.IsNull(NvdbSource.SignNumber(null));
            Assert.AreEqual("Fartsgrense 50 km/t", NvdbSource.LabelOf("362.50 - Fartsgrense 50 km/t", "362.50"));

            var p = Wkt.Parse("POINT Z (256285.394 6781434.061 247.96)");
            Assert.AreEqual("POINT", p.Type);
            Assert.AreEqual(256285.394, p.Points[0].E, 1e-9); Assert.AreEqual(247.96, p.Heights[0], 1e-9);
            var l = Wkt.Parse("LINESTRING Z (1 2 3, 4 5 6, 7 8 9)");
            Assert.AreEqual(3, l.Points.Count); Assert.AreEqual(8, l.Points[2].N);
            Assert.IsNull(Wkt.Parse("POLYGON ((0 0, 1 0, 1 1, 0 0))"));
            Assert.IsNull(Wkt.Parse(null));

            var obj = Json.ParseObject("{\"id\":7,\"egenskaper\":[{\"id\":5530,\"verdi\":\"362.50 - Fartsgrense 50 km/t\"},{\"id\":1894,\"verdi\":\"Trafikk i kjøreretning\"}],"
                + "\"geometri\":{\"wkt\":\"POINT Z (256285.394 6781434.061 247.96)\"},\"lokasjon\":{\"stedfestinger\":[{\"sideposisjon\":\"H\"}]}}");
            var plate = NvdbSource.ParseSignPlate(obj);
            Assert.AreEqual("362.50", plate.Number); Assert.AreEqual(50, plate.SpeedKmh);
            Assert.AreEqual(SignFacing.With, plate.Facing); Assert.AreEqual(RoadSide.Right, plate.Side);
            Assert.AreEqual(6781434.061, plate.Position.N, 1e-9);
        }
    }
}
