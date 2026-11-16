using System;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// A WGS84 lat/lon box. The JS services (Overpass, WCS) take lat/lon bboxes, while the game's
    /// tiles are EPSG:25833 squares, so every client first takes the lat/lon envelope of the four
    /// UTM corners — the same thing landcover.js <c>utmBounds</c> does in the other direction.
    /// </summary>
    public readonly struct LatLonBounds
    {
        public readonly double MinLat, MinLon, MaxLat, MaxLon;
        public LatLonBounds(double minLat, double minLon, double maxLat, double maxLon)
        { MinLat = minLat; MinLon = minLon; MaxLat = maxLat; MaxLon = maxLon; }

        public LatLon Centre => new LatLon((MinLat + MaxLat) / 2, (MinLon + MaxLon) / 2);

        /// <summary>Envelope of the four corners of a UTM box (a UTM square is rotated and slightly trapezoid in lat/lon).</summary>
        public static LatLonBounds Of(Bounds25833 b)
        {
            double minLat = double.PositiveInfinity, minLon = double.PositiveInfinity;
            double maxLat = double.NegativeInfinity, maxLon = double.NegativeInfinity;
            Span<Utm33> corners = stackalloc Utm33[4]
            {
                new Utm33(b.MinE, b.MinN), new Utm33(b.MaxE, b.MinN),
                new Utm33(b.MinE, b.MaxN), new Utm33(b.MaxE, b.MaxN),
            };
            foreach (var c in corners)
            {
                var p = Proj.ToLatLon(c);
                if (p.Lat < minLat) minLat = p.Lat; if (p.Lat > maxLat) maxLat = p.Lat;
                if (p.Lon < minLon) minLon = p.Lon; if (p.Lon > maxLon) maxLon = p.Lon;
            }
            return new LatLonBounds(minLat, minLon, maxLat, maxLon);
        }

        /// <summary>UTM envelope of the four lat/lon corners (signs.js <c>fetchRoadSigns</c> builds its kartutsnitt this way).</summary>
        public Bounds25833 ToUtmEnvelope()
        {
            double minE = double.PositiveInfinity, minN = double.PositiveInfinity;
            double maxE = double.NegativeInfinity, maxN = double.NegativeInfinity;
            Span<LatLon> corners = stackalloc LatLon[4]
            {
                new LatLon(MinLat, MinLon), new LatLon(MinLat, MaxLon),
                new LatLon(MaxLat, MinLon), new LatLon(MaxLat, MaxLon),
            };
            foreach (var c in corners)
            {
                var u = Proj.ToUtm(c);
                if (u.E < minE) minE = u.E; if (u.E > maxE) maxE = u.E;
                if (u.N < minN) minN = u.N; if (u.N > maxN) maxN = u.N;
            }
            return new Bounds25833(minE, minN, maxE, maxN);
        }

        /// <summary>Metres per degree at the box centre (the WGS84 series geo.js <c>localProjection</c> uses).</summary>
        public void MetresPerDegree(out double mPerLat, out double mPerLon)
        {
            double phi = Centre.Lat * Math.PI / 180;
            mPerLat = 111132.92 - 559.82 * Math.Cos(2 * phi) + 1.175 * Math.Cos(4 * phi) - 0.0023 * Math.Cos(6 * phi);
            mPerLon = 111412.84 * Math.Cos(phi) - 93.5 * Math.Cos(3 * phi) + 0.118 * Math.Cos(5 * phi);
        }

        public override string ToString() => $"{MinLat:F6},{MinLon:F6},{MaxLat:F6},{MaxLon:F6}";
    }
}
