using System;
using System.Globalization;
using Rally.Core;

namespace Rally.Gameplay
{
    /// <summary>
    /// The link formats of legacy-js/src/share.js, unchanged so links made by the JS game open in the Unity one:
    ///   ?route=osrm:LAT,LON;LAT,LON;PROFILE   a stage OSRM routes between two picks (driving|cycling|foot)
    ///   ?route=demo:LAT,LON;LAT,LON           the game's own A* on the demo mountain
    ///   ?drive=LAT,LON                        free drive starting there (also how a car position is shared)
    /// plus the Unity-only ?seed=HEX;LAT,LON for endless stages. Coordinates are rounded to 5 decimals
    /// (about a metre); nothing else goes in the URL.
    /// </summary>
    public static class ShareLinks
    {
        public enum Kind : byte { Free, Osrm, Demo, Endless }

        public readonly struct Link
        {
            public readonly Kind Kind;
            public readonly LatLon A, B;
            public readonly string Profile;
            public readonly ulong Seed;
            public Link(Kind kind, LatLon a, LatLon b, string profile, ulong seed) { Kind = kind; A = a; B = b; Profile = profile; Seed = seed; }
        }

        static readonly string[] Profiles = { "driving", "cycling", "foot" };
        static string Num(double v) => Math.Round(v, 5).ToString(CultureInfo.InvariantCulture);
        static string Pair(LatLon p) => $"{Num(p.Lat)},{Num(p.Lon)}";

        public static string Osrm(LatLon a, LatLon b, string profile) => $"?route=osrm:{Pair(a)};{Pair(b)};{profile}";
        public static string Demo(LatLon a, LatLon b) => $"?route=demo:{Pair(a)};{Pair(b)}";
        public static string Drive(LatLon p) => $"?drive={Pair(p)}";
        public static string Endless(ulong seed, LatLon start) => $"?seed={seed:x};{Pair(start)}";

        /// <summary>Port of parseShare(): the drive a query string asks for, or null.</summary>
        public static Link? Parse(string query)
        {
            if (string.IsNullOrEmpty(query)) return null;
            if (query[0] == '?') query = query.Substring(1);
            string drive = null, route = null, seed = null;
            foreach (var part in query.Split('&'))
            {
                int eq = part.IndexOf('=');
                if (eq < 0) continue;
                var key = part.Substring(0, eq);
                var val = Uri.UnescapeDataString(part.Substring(eq + 1));
                if (key == "drive") drive = val; else if (key == "route") route = val; else if (key == "seed") seed = val;
            }
            var d = ParsePair(drive);
            if (d != null) return new Link(Kind.Free, d.Value, default, "driving", 0);
            if (seed != null)
            {
                var parts = seed.Split(';');
                var s = parts.Length == 2 ? ParsePair(parts[1]) : null;
                if (s != null && ulong.TryParse(parts[0], NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var value))
                    return new Link(Kind.Endless, s.Value, default, "driving", value);
            }
            if (route == null) return null;
            int colon = route.IndexOf(':');
            if (colon < 0) return null;
            var kind = route.Substring(0, colon);
            var rest = route.Substring(colon + 1).Split(';');
            var a = rest.Length > 0 ? ParsePair(rest[0]) : null;
            var b = rest.Length > 1 ? ParsePair(rest[1]) : null;
            if (a == null || b == null) return null;
            if (kind == "osrm")
            {
                var profile = rest.Length > 2 && Array.IndexOf(Profiles, rest[2]) >= 0 ? rest[2] : "driving";
                return new Link(Kind.Osrm, a.Value, b.Value, profile, 0);
            }
            if (kind == "demo") return new Link(Kind.Demo, a.Value, b.Value, "driving", 0);
            return null;
        }

        /// <summary>parsePair(): "lat, lon" with sane ranges, else null.</summary>
        public static LatLon? ParsePair(string text)
        {
            if (string.IsNullOrEmpty(text)) return null;
            var parts = text.Split(',');
            if (parts.Length != 2) return null;
            if (!double.TryParse(parts[0].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var lat)) return null;
            if (!double.TryParse(parts[1].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var lon)) return null;
            if (Math.Abs(lat) > 90 || Math.Abs(lon) > 180) return null;
            return new LatLon(lat, lon);
        }
    }
}
