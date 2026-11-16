using System.Collections.Generic;
using Rally.Core;
using UnityEngine;

namespace Rally.Geo
{
    /// <summary>
    /// Mainland Norway and its larger islands as lat/lon rings (geoBoundaries gbOpen ADM0, CC BY 4.0;
    /// simplified to ~1 km, baked into <c>Resources/norway-outline.json</c> as map.js ships it).
    /// The route map shades the world outside Norway with it and the game refuses picks outside
    /// <see cref="Bounds"/> (worldgen.js <c>NORWAY_BOUNDS</c>). Svalbard and Jan Mayen are left out.
    /// </summary>
    public static class NorwayOutline
    {
        public const string Attribution = "Outline: geoBoundaries (CC BY 4.0)";
        public static readonly LatLonBounds Bounds = new LatLonBounds(57.5, 3.5, 71.4, 31.5);

        static List<List<LatLon>> rings;

        /// <summary>worldgen.js <c>isInNorway</c>: the coarse box check the map and share links use.</summary>
        public static bool IsInNorway(LatLon p)
            => p.Lat >= Bounds.MinLat && p.Lat <= Bounds.MaxLat && p.Lon >= Bounds.MinLon && p.Lon <= Bounds.MaxLon;

        /// <summary>The rings, loaded once from Resources (empty when the asset is missing, e.g. in a bare test project).</summary>
        public static List<List<LatLon>> Rings
        {
            get
            {
                if (rings != null) return rings;
                var asset = Resources.Load<TextAsset>("norway-outline");
                rings = asset != null ? Parse(asset.text) : new List<List<LatLon>>();
                return rings;
            }
        }

        /// <summary>The JSON is <c>[[[lat, lon], …], …]</c>.</summary>
        public static List<List<LatLon>> Parse(string json)
        {
            var result = new List<List<LatLon>>();
            if (!(Json.Parse(json) is List<object> outer)) return result;
            foreach (var ro in outer)
            {
                if (!(ro is List<object> ring)) continue;
                var pts = new List<LatLon>(ring.Count);
                foreach (var po in ring)
                    if (po is List<object> p && p.Count >= 2) pts.Add(new LatLon((double)p[0], (double)p[1]));
                if (pts.Count >= 3) result.Add(pts);
            }
            return result;
        }

        /// <summary>Even-odd point-in-polygon over every ring (the ~1 km outline: good for "is this the sea?" at country scale).</summary>
        public static bool Contains(LatLon p)
        {
            bool inside = false;
            foreach (var ring in Rings)
            {
                for (int i = 0, j = ring.Count - 1; i < ring.Count; j = i++)
                {
                    var a = ring[i]; var b = ring[j];
                    if ((a.Lat > p.Lat) != (b.Lat > p.Lat) && p.Lon < (b.Lon - a.Lon) * (p.Lat - a.Lat) / (b.Lat - a.Lat) + a.Lon) inside = !inside;
                }
            }
            return inside;
        }
    }
}
