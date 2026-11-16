using System;
using Unity.Mathematics;

namespace Rally.Core
{
    /// <summary>WGS84 latitude/longitude in degrees.</summary>
    public readonly struct LatLon
    {
        public readonly double Lat, Lon;
        public LatLon(double lat, double lon) { Lat = lat; Lon = lon; }
        public override string ToString() => $"{Lat:F5}, {Lon:F5}";
    }

    /// <summary>EPSG:25833 (UTM zone 33N, ETRS89) easting/northing in metres. The game's planar frame.</summary>
    public readonly struct Utm33
    {
        public readonly double E, N;
        public Utm33(double e, double n) { E = e; N = n; }
        public static Utm33 operator +(Utm33 a, double2 d) => new Utm33(a.E + d.x, a.N + d.y);
        public double2 Minus(Utm33 o) => new double2(E - o.E, N - o.N);
        public override string ToString() => $"E{E:F1} N{N:F1}";
    }

    /// <summary>Axis-aligned box in EPSG:25833 metres.</summary>
    public readonly struct Bounds25833
    {
        public readonly double MinE, MinN, MaxE, MaxN;
        public Bounds25833(double minE, double minN, double maxE, double maxN) { MinE = minE; MinN = minN; MaxE = maxE; MaxN = maxN; }
        public double Width => MaxE - MinE;
        public double Height => MaxN - MinN;
        public Utm33 Min => new Utm33(MinE, MinN);
        public bool Contains(Utm33 p) => p.E >= MinE && p.E < MaxE && p.N >= MinN && p.N < MaxN;
    }

    /// <summary>
    /// WGS84 ↔ UTM 33N. Ported from the JS geo.js (Karney-free series, sub-metre over Norway).
    /// </summary>
    public static class Proj
    {
        const double A = 6378137.0, F = 1 / 298.257223563, K0 = 0.9996, Lon0 = 15.0 * math.PI_DBL / 180.0, FalseE = 500000.0;
        static readonly double E2 = F * (2 - F);
        static readonly double Ep2 = E2 / (1 - E2);

        public static Utm33 ToUtm(LatLon p)
        {
            double lat = p.Lat * math.PI_DBL / 180.0, lon = p.Lon * math.PI_DBL / 180.0;
            double sin = math.sin(lat), cos = math.cos(lat), tan = sin / cos;
            double n = A / math.sqrt(1 - E2 * sin * sin);
            double t = tan * tan, c = Ep2 * cos * cos, a = cos * (lon - Lon0);
            double m = A * ((1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 * E2 * E2 / 256) * lat
                - (3 * E2 / 8 + 3 * E2 * E2 / 32 + 45 * E2 * E2 * E2 / 1024) * math.sin(2 * lat)
                + (15 * E2 * E2 / 256 + 45 * E2 * E2 * E2 / 1024) * math.sin(4 * lat)
                - (35 * E2 * E2 * E2 / 3072) * math.sin(6 * lat));
            double e = FalseE + K0 * n * (a + (1 - t + c) * a * a * a / 6 + (5 - 18 * t + t * t + 72 * c - 58 * Ep2) * math.pow(a, 5) / 120);
            double nn = K0 * (m + n * tan * (a * a / 2 + (5 - t + 9 * c + 4 * c * c) * math.pow(a, 4) / 24 + (61 - 58 * t + t * t + 600 * c - 330 * Ep2) * math.pow(a, 6) / 720));
            return new Utm33(e, nn);
        }

        public static LatLon ToLatLon(Utm33 u)
        {
            double x = u.E - FalseE, y = u.N;
            double m = y / K0;
            double mu = m / (A * (1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 * E2 * E2 / 256));
            double e1 = (1 - math.sqrt(1 - E2)) / (1 + math.sqrt(1 - E2));
            double phi1 = mu + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * math.sin(2 * mu)
                + (21 * e1 * e1 / 16 - 55 * math.pow(e1, 4) / 32) * math.sin(4 * mu)
                + (151 * e1 * e1 * e1 / 96) * math.sin(6 * mu) + (1097 * math.pow(e1, 4) / 512) * math.sin(8 * mu);
            double sin = math.sin(phi1), cos = math.cos(phi1), tan = sin / cos;
            double n1 = A / math.sqrt(1 - E2 * sin * sin);
            double t1 = tan * tan, c1 = Ep2 * cos * cos;
            double r1 = A * (1 - E2) / math.pow(1 - E2 * sin * sin, 1.5);
            double d = x / (n1 * K0);
            double lat = phi1 - (n1 * tan / r1) * (d * d / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * Ep2) * math.pow(d, 4) / 24
                + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * Ep2 - 3 * c1 * c1) * math.pow(d, 6) / 720);
            double lon = Lon0 + (d - (1 + 2 * t1 + c1) * d * d * d / 6 + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * Ep2 + 24 * t1 * t1) * math.pow(d, 5) / 120) / cos;
            return new LatLon(lat * 180.0 / math.PI_DBL, lon * 180.0 / math.PI_DBL);
        }
    }

    /// <summary>
    /// The scene origin in EPSG:25833. Unity world = (E − Origin.E, height, N − Origin.N) in float.
    /// The origin is re-based every <see cref="RebaseDistance"/> metres of travel so float precision holds;
    /// everything that stores a position long-term stores a <see cref="Utm33"/>, not a float3.
    /// </summary>
    public static class FloatingOrigin
    {
        public const float RebaseDistance = 2048f;
        public static Utm33 Origin { get; private set; }
        /// <summary>Raised with the delta (old → new origin) so tiles and actors shift their transforms.</summary>
        public static event Action<double2> Rebased;

        public static void Set(Utm33 origin) { Origin = origin; }

        public static float3 ToWorld(Utm33 p, float height) => new float3((float)(p.E - Origin.E), height, (float)(p.N - Origin.N));
        public static float2 ToWorldXZ(Utm33 p) => new float2((float)(p.E - Origin.E), (float)(p.N - Origin.N));
        public static Utm33 ToUtm(float3 w) => new Utm33(Origin.E + w.x, Origin.N + w.z);
        public static Utm33 ToUtm(float2 xz) => new Utm33(Origin.E + xz.x, Origin.N + xz.y);

        /// <summary>Call once per frame with the car's position; rebases when it drifts too far.</summary>
        public static void MaybeRebase(float3 carWorld)
        {
            if (math.length(carWorld.xz) < RebaseDistance) return;
            var next = ToUtm(carWorld);
            var delta = next.Minus(Origin);
            Origin = next;
            Rebased?.Invoke(delta);
        }
    }
}
