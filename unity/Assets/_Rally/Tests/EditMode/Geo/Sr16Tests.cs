using NUnit.Framework;
using Rally.Core;
using Rally.Geo;

namespace Rally.Tests.Geo
{
    /// <summary>Port of the SR16 cases in legacy-js/tests/landcover.test.mjs.</summary>
    public class Sr16Tests
    {
        [Test]
        public void ColoursClassifyToSpeciesAndCrownCover()
        {
            Assert.AreEqual(Species.Spruce, Sr16Colours.ClassifySpecies(0x52, 0xb0, 0x38, 255));
            Assert.AreEqual(Species.Pine, Sr16Colours.ClassifySpecies(0xcd, 0xaa, 0x65, 255));
            Assert.AreEqual(Species.Deciduous, Sr16Colours.ClassifySpecies(0xff, 0xdc, 0x82, 255));
            Assert.AreEqual(Species.None, Sr16Colours.ClassifySpecies(0, 0, 0, 0));
            Assert.AreEqual(Species.None, Sr16Colours.ClassifySpecies(10, 10, 200, 255), "unknown colour is not forest");
            Assert.Greater(Sr16Colours.ClassifyDensity(0x00, 0x28, 0x0f, 255), 0.9f);
            Assert.Less(Sr16Colours.ClassifyDensity(0xe5, 0xf5, 0xe0, 255), 0.2f);
            Assert.AreEqual(0, Sr16Colours.ClassifyDensity(0, 0, 0, 0));
        }

        [Test]
        public void RequestCoversTheSquareInUtm33WithEastingFirstBbox()
        {
            var b = new Bounds25833(252000, 6782000, 254048, 6784048);
            var url = Sr16Source.MapUrl("SRRTRESLAG", b, 128, 128);
            Assert.AreEqual("https://wms.nibio.no/cgi-bin/sr16?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=SRRTRESLAG&STYLES=&CRS=EPSG%3A25833"
                + "&BBOX=252000.0%2C6782000.0%2C254048.0%2C6784048.0&WIDTH=128&HEIGHT=128&FORMAT=image%2Fpng&TRANSPARENT=TRUE", url);
            Assert.AreEqual(128, Sr16Source.Pixels(2048));
            Assert.AreEqual(32, Sr16Source.Pixels(100));
            Assert.AreEqual(512, Sr16Source.Pixels(100000));
        }

        [Test]
        public void CoverRasterIndexesFromTheSouthWest()
        {
            var r = new CoverRaster(4, 4, new Bounds25833(0, 0, 64, 64));
            r.Trees[0] = (byte)Species.Pine;
            r.Crown[3 * 4 + 3] = 255;
            Assert.AreEqual(Species.Pine, r.SpeciesAt(new Utm33(8, 8)));
            Assert.AreEqual(1f, r.DensityAt(new Utm33(60, 60)));
            Assert.AreEqual(Species.None, r.SpeciesAt(new Utm33(-1, 8)));
        }
    }
}
