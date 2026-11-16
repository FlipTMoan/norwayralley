using System;
using System.Collections.Generic;
using System.Globalization;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>signs.js <c>parseWkt</c>: NVDB geometry in srid 5973 is <c>POINT Z (e n h)</c> / <c>LINESTRING Z (e n h, …)</c>.</summary>
    public static class Wkt
    {
        public sealed class Geometry
        {
            public string Type;                    // POINT or LINESTRING
            public List<Utm33> Points = new List<Utm33>();
            public List<double> Heights = new List<double>(); // NaN when absent
        }

        public static Geometry Parse(string wkt)
        {
            if (string.IsNullOrEmpty(wkt)) return null;
            var s = wkt.Trim();
            int open = s.IndexOf('('), close = s.LastIndexOf(')');
            if (open < 0 || close < open || close != s.Length - 1) return null;
            var head = s.Substring(0, open).Trim().ToUpperInvariant().Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            if (head.Length == 0 || (head[0] != "POINT" && head[0] != "LINESTRING")) return null;
            if (head.Length > 2 || (head.Length == 2 && head[1] != "Z" && head[1] != "M" && head[1] != "ZM")) return null;
            var body = s.Substring(open + 1, close - open - 1);
            if (body.IndexOf('(') >= 0) return null;
            var g = new Geometry { Type = head[0] };
            foreach (var tuple in body.Split(','))
            {
                var parts = tuple.Trim().Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length < 2) continue;
                if (!double.TryParse(parts[0], NumberStyles.Float, CultureInfo.InvariantCulture, out var e)) continue;
                if (!double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var n)) continue;
                double h = parts.Length > 2 && double.TryParse(parts[2], NumberStyles.Float, CultureInfo.InvariantCulture, out var hh) ? hh : double.NaN;
                g.Points.Add(new Utm33(e, n));
                g.Heights.Add(h);
            }
            return g.Points.Count > 0 ? g : null;
        }
    }
}
