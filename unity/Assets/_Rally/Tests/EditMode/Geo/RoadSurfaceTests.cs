using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Unity.Mathematics;

namespace Rally.Tests.Geo
{
    /// <summary>legacy-js/tests/handling.test.mjs "NVDB Massetype maps to surface kinds and assigns to samples".</summary>
    public class RoadSurfaceTests
    {
        [Test]
        public void MassetypeMapsToSurfaceKinds()
        {
            Assert.AreEqual(Surface.Gravel, NvdbSource.SurfaceFromMassetype("Grus"));
            Assert.AreEqual(Surface.Gravel, NvdbSource.SurfaceFromMassetype("Enkel overflatebehandling grus"));
            Assert.AreEqual(Surface.Asphalt, NvdbSource.SurfaceFromMassetype("Asfaltbetong"));
            Assert.AreEqual(Surface.Asphalt, NvdbSource.SurfaceFromMassetype("Emulsjonsgrus, tett"));
            Assert.AreEqual(Surface.Asphalt, NvdbSource.SurfaceFromMassetype("Belegningsstein"));
            Assert.IsNull(NvdbSource.SurfaceFromMassetype(null));
        }

        [Test]
        public void NearestPolylineWithinTwelveMetresWins()
        {
            var points = new List<double2>();
            for (int n = 0; n <= 300; n += 5) points.Add(new double2(0, n));
            var result = new Surface?[points.Count];
            for (int i = 0; i < result.Length; i++) result[i] = Surface.Asphalt;
            var line = new RoadSurfaceLine { Kind = Surface.Gravel, Points = { new Utm33(4, 100), new Utm33(4, 200) } };
            int measured = RoadSurfaceIndex.Assign(points, new[] { line }, result, 12);
            Assert.AreEqual(25, measured, "21 beside the line + 4 within 12 m of its ends");
            Assert.AreEqual(Surface.Asphalt, result[17]);
            Assert.AreEqual(Surface.Gravel, result[30]);
            Assert.AreEqual(Surface.Asphalt, result[0]);
        }

        [Test]
        public void VegdekkeResponseParsesToSurfaceLines()
        {
            Assert.AreEqual("https://nvdbapiles.atlas.vegvesen.no/vegobjekter/api/v4/vegobjekter/241?kartutsnitt=256000.0,6781000.0,258000.0,6783000.0&srid=5973&inkluder=geometri,egenskaper,lokasjon&antall=1000",
                NvdbSource.FirstPageUrl(NvdbSource.TypeRoadSurface, new Bounds25833(256000, 6781000, 258000, 6783000)));
            var page = Json.ParseObject(
                "{\"objekter\":["
                + "{\"id\":1,\"egenskaper\":[{\"id\":1216,\"navn\":\"Massetype\",\"verdi\":\"Grus\"}],\"geometri\":{\"wkt\":\"LINESTRING Z (256000.5 6781000.0 120.1, 256010.0 6781020.0 121.0, 256030.0 6781050.0 122.5)\"}},"
                + "{\"id\":2,\"egenskaper\":[{\"id\":1216,\"navn\":\"Massetype\",\"verdi\":\"Asfaltbetong\"}],\"geometri\":{\"wkt\":\"LINESTRING Z (257000 6782000 90, 257100 6782000 91)\"}},"
                + "{\"id\":3,\"egenskaper\":[{\"id\":5225,\"navn\":\"Dekkebredde\",\"verdi\":6.5}],\"geometri\":{\"wkt\":\"LINESTRING Z (1 2 3, 4 5 6)\"}},"
                + "{\"id\":4,\"egenskaper\":[{\"id\":1216,\"verdi\":\"Grus\"}],\"geometri\":{\"wkt\":\"POINT Z (1 2 3)\"}}"
                + "],\"metadata\":{\"returnert\":4,\"neste\":{\"start\":\"abc\",\"href\":\"https://nvdbapiles.atlas.vegvesen.no/vegobjekter/api/v4/vegobjekter/241?start=abc\"}}}");
            var lines = new List<RoadSurfaceLine>();
            foreach (var o in page.Arr("objekter"))
            {
                var l = NvdbSource.ParseRoadSurface((Dictionary<string, object>)o);
                if (l != null) lines.Add(l);
            }
            Assert.AreEqual(2, lines.Count, "no Massetype and point geometry are skipped");
            Assert.AreEqual(Surface.Gravel, lines[0].Kind);
            Assert.AreEqual(3, lines[0].Points.Count);
            Assert.AreEqual(256000.5, lines[0].Points[0].E, 1e-9);
            Assert.AreEqual(6781050.0, lines[0].Points[2].N, 1e-9);
            Assert.AreEqual(Surface.Asphalt, lines[1].Kind);
        }
    }
}
