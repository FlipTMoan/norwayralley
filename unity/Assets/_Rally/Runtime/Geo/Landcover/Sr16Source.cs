using System;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;
using UnityEngine;

namespace Rally.Geo
{
    /// <summary>
    /// landcover.js <c>applySr16</c>: two WMS GetMap requests to NIBIO (species and crown cover) in
    /// EPSG:25833 at one pixel per 16 m, decoded into a <see cref="CoverRaster"/> over the requested
    /// bounds. The PNG is decoded with <see cref="ImageConversion.LoadImage"/> on the main thread (the
    /// JS drew it on a canvas); Unity's pixel rows run bottom-up, which already matches the raster's
    /// south-west origin. Licence: "Skogressurskart SR16 © NIBIO (NLOD)".
    /// </summary>
    public sealed class Sr16Source : ILandcoverSource
    {
        public const string Url = "https://wms.nibio.no/cgi-bin/sr16";
        public const string Attribution = "Skogressurskart SR16 © NIBIO (NLOD)";
        public const int TimeoutMs = 20000;
        public const int CellM = 16;

        readonly IGeoCache cache;
        public Sr16Source(IGeoCache cache) { this.cache = cache; }

        /// <summary>landcover.js <c>sr16Url</c>: BBOX=minE,minN,maxE,maxN at one decimal.</summary>
        public static string MapUrl(string layer, Bounds25833 b, int width, int height)
        {
            string bbox = $"{Http.Fixed(b.MinE, 1)},{Http.Fixed(b.MinN, 1)},{Http.Fixed(b.MaxE, 1)},{Http.Fixed(b.MaxN, 1)}";
            return $"{Url}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS={layer}&STYLES=&CRS=EPSG%3A25833"
                + $"&BBOX={Uri.EscapeDataString(bbox)}&WIDTH={width}&HEIGHT={height}&FORMAT=image%2Fpng&TRANSPARENT=TRUE";
        }

        public static int Pixels(double spanM) => Mathf.Clamp((int)Math.Round(spanM / CellM), 32, 512);

        public async Task<CoverRaster> FetchCover(Bounds25833 bounds, CancellationToken ct)
        {
            int width = Pixels(bounds.Width), height = Pixels(bounds.Height);
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeoutMs);
            var speciesTask = FetchPng(MapUrl("SRRTRESLAG", bounds, width, height), cts.Token);
            var densityTask = FetchPng(MapUrl("SRRKRONEDEK", bounds, width, height), cts.Token);
            var species = Decode(await speciesTask, width, height);
            var density = Decode(await densityTask, width, height);

            var raster = new CoverRaster(width, height, bounds);
            for (int k = 0; k < species.Length; k++)
            {
                var s = species[k]; var d = density[k];
                raster.Trees[k] = (byte)Sr16Colours.ClassifySpecies(s.r, s.g, s.b, s.a);
                raster.Crown[k] = (byte)Math.Round(Sr16Colours.ClassifyDensity(d.r, d.g, d.b, d.a) * 255);
            }
            return raster;
        }

        Task<byte[]> FetchPng(string url, CancellationToken ct)
            => cache.Fetch(url, async () =>
            {
                try { return await Http.GetBytes(url, TimeoutMs, ct); }
                catch (HttpException e) when (e.Status > 0) { throw new Exception($"HTTP {e.Status}"); }
            }, "sr16");

        /// <summary>PNG bytes → Color32 rows, bottom row first (Unity) = south row first (the raster).</summary>
        static Color32[] Decode(byte[] png, int width, int height)
        {
            var tex = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            try
            {
                if (!ImageConversion.LoadImage(tex, png, false)) throw new Exception("SR16 tile did not decode as PNG");
                if (tex.width != width || tex.height != height)
                    throw new Exception($"SR16 tile is {tex.width}×{tex.height}, expected {width}×{height}");
                return tex.GetPixels32();
            }
            finally { if (Application.isPlaying) UnityEngine.Object.Destroy(tex); else UnityEngine.Object.DestroyImmediate(tex); }
        }
    }
}
