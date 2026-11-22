using System;
using System.Collections.Generic;
using System.Text;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// Google's encoded polyline at 1e-6° ("polyline6", what OSRM's <c>geometries=polyline6</c> gives): each point as the
    /// zig-zag, 5-bit-chunked delta from the previous one. A 30 km OSRM line (~15 KB of GeoJSON) becomes ~3 KB of text.
    /// Saved routes keep their geometry this way (plan_20261122 Part 3).
    /// </summary>
    public static class Polyline
    {
        const double Scale = 1e6;

        public static string Encode(IReadOnlyList<LatLon> points)
        {
            var sb = new StringBuilder(points.Count * 8);
            long lat = 0, lon = 0;
            foreach (var p in points)
            {
                long a = (long)Math.Round(p.Lat * Scale), b = (long)Math.Round(p.Lon * Scale);
                Put(sb, a - lat); Put(sb, b - lon);
                lat = a; lon = b;
            }
            return sb.ToString();
        }

        static void Put(StringBuilder sb, long v)
        {
            ulong z = (ulong)(v < 0 ? ~(v << 1) : v << 1);
            while (z >= 0x20) { sb.Append((char)((0x20 | (int)(z & 0x1f)) + 63)); z >>= 5; }
            sb.Append((char)((int)z + 63));
        }

        /// <summary>The points of <paramref name="text"/>; null when it is not a polyline.</summary>
        public static List<LatLon> Decode(string text)
        {
            if (text == null) return null;
            var list = new List<LatLon>();
            int i = 0;
            long lat = 0, lon = 0;
            while (i < text.Length)
            {
                if (!Take(text, ref i, out long da) || !Take(text, ref i, out long db)) return null;
                lat += da; lon += db;
                list.Add(new LatLon(lat / Scale, lon / Scale));
            }
            return list;
        }

        static bool Take(string s, ref int i, out long v)
        {
            ulong z = 0; int shift = 0; v = 0;
            for (;;)
            {
                if (i >= s.Length || shift > 60) return false;
                int c = s[i++] - 63;
                if (c < 0 || c > 63) return false;
                z |= (ulong)(c & 0x1f) << shift;
                shift += 5;
                if (c < 0x20) break;
            }
            v = (z & 1) != 0 ? ~(long)(z >> 1) : (long)(z >> 1);
            return true;
        }
    }
}
