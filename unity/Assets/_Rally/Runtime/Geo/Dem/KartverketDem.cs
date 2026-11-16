using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// Port of worldgen.js <c>fetchDem</c>: the Kartverket "høydedata" WCS 1.0.0 GetCoverage of the
    /// national 1 m DTM, asked in EPSG:4326 for a WIDTH×HEIGHT GeoTIFF (the service resamples the
    /// 1 m model to the game's grid, so a 768² coverage is ~2.4 MB). The request string is built
    /// exactly as the JS does (same parameter order and 7-decimal bbox) so both clients share cache
    /// entries. The tile the game wants is a UTM square, so the lat/lon envelope of its corners is
    /// requested and the answer is resampled bilinearly into the <see cref="HeightGrid"/>. Sea and
    /// coverage edges come back as nodata; the game treats water as 0.
    /// </summary>
    public sealed class KartverketDem : IDemSource
    {
        public const string WcsUrl = "https://wcs.geonorge.no/skwms1/wcs.hoyde-dtm-nhm-25833";
        public const string Coverage = "nhm_dtm_topo_25833";
        public const int TimeoutMs = 60000;

        readonly IGeoCache cache;
        public KartverketDem(IGeoCache cache) { this.cache = cache; }

        /// <summary>worldgen.js <c>demCoverageUrl</c>: BBOX=minLon,minLat,maxLon,maxLat (WCS 1.0.0, EPSG:4326).</summary>
        public static string CoverageUrl(LatLonBounds b, int width, int height)
        {
            string bbox = $"{Http.Fixed(b.MinLon, 7)},{Http.Fixed(b.MinLat, 7)},{Http.Fixed(b.MaxLon, 7)},{Http.Fixed(b.MaxLat, 7)}";
            // URLSearchParams encodes ':' and ',' in values.
            return $"{WcsUrl}?service=WCS&version=1.0.0&request=GetCoverage&Coverage={Coverage}&CRS=EPSG%3A4326"
                + $"&BBOX={Uri.EscapeDataString(bbox)}&WIDTH={width}&HEIGHT={height}&FORMAT=GeoTIFF";
        }

        public async Task<HeightGrid> Fetch(Bounds25833 bounds, float cellM, CancellationToken ct, ProgressCallback progress = null)
        {
            int n = (int)Math.Round(bounds.Width / cellM) + 1;
            var env = LatLonBounds.Of(bounds);
            env.MetresPerDegree(out double mPerLat, out double mPerLon);
            int width = Math.Max(2, (int)Math.Round((env.MaxLon - env.MinLon) * mPerLon / cellM));
            int height = Math.Max(2, (int)Math.Round((env.MaxLat - env.MinLat) * mPerLat / cellM));
            var url = CoverageUrl(env, width, height);
            RallyLog.Info($"DEM request {width}×{height}: {url}");

            var bytes = await cache.Fetch(url, async () =>
            {
                try
                {
                    return await Http.GetBytes(url, TimeoutMs, ct, null, p => progress?.Invoke(p, "Downloading elevation…"));
                }
                catch (HttpException e) when (e.Status > 0)
                {
                    throw new Exception($"Kartverket elevation service answered HTTP {e.Status}.");
                }
            }, "dem");
            progress?.Invoke(0.55f, "Unpacking the 1 m elevation model…");

            GeoTiffImage img;
            try { img = GeoTiff.Decode(bytes); }
            catch (FormatException e) { throw new Exception($"Kartverket returned an elevation tile the game could not read ({e.Message}).", e); }
            if (img.Width < 2 || img.Height < 2) throw new Exception("Kartverket returned an elevation tile the game could not read.");

            var grid = new HeightGrid(n, cellM, bounds.Min);
            Resample(img, env, grid);
            return grid;
        }

        /// <summary>Bilinear lookup of each UTM grid sample in the lat/lon raster (row 0 = north).</summary>
        public static void Resample(GeoTiffImage img, LatLonBounds env, HeightGrid grid)
        {
            double sx = img.Width / (env.MaxLon - env.MinLon), sy = img.Height / (env.MaxLat - env.MinLat);
            for (int row = 0; row < grid.N; row++)
            for (int col = 0; col < grid.N; col++)
            {
                var p = Proj.ToLatLon(new Utm33(grid.Origin.E + col * grid.CellM, grid.Origin.N + row * grid.CellM));
                double fx = (p.Lon - env.MinLon) * sx - 0.5, fy = (env.MaxLat - p.Lat) * sy - 0.5;
                fx = Math.Max(0, Math.Min(img.Width - 1.0001, fx));
                fy = Math.Max(0, Math.Min(img.Height - 1.0001, fy));
                int x = (int)fx, y = (int)fy;
                float tx = (float)(fx - x), ty = (float)(fy - y);
                float h00 = Clean(img, img.Samples[y * img.Width + x]), h10 = Clean(img, img.Samples[y * img.Width + x + 1]);
                float h01 = Clean(img, img.Samples[(y + 1) * img.Width + x]), h11 = Clean(img, img.Samples[(y + 1) * img.Width + x + 1]);
                float h = (h00 * (1 - tx) + h10 * tx) * (1 - ty) + (h01 * (1 - tx) + h11 * tx) * ty;
                grid[col, row] = h;
            }
            grid.Version++;
        }

        /// <summary>worldgen.js: nodata / non-finite / below −1000 m is sea → 0; nothing below sea level.</summary>
        static float Clean(GeoTiffImage img, float raw)
        {
            if (float.IsNaN(raw) || float.IsInfinity(raw) || raw < -1000 || raw == img.NoData) return 0;
            return raw < 0 ? 0 : raw;
        }
    }
}
