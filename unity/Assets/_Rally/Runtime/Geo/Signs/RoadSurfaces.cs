using System.Collections.Generic;
using Rally.Core;
using Unity.Mathematics;

namespace Rally.Geo
{
    /// <summary>One NVDB Vegdekke (type 241) polyline with its surface (roads.js <c>fetchRoadSurfaces</c> entries).</summary>
    public sealed class RoadSurfaceLine
    {
        public Surface Kind;                       // Asphalt or Gravel
        public List<Utm33> Points = new List<Utm33>();
    }

    /// <summary>
    /// roads.js <c>assignSurfaces</c>: registered surface polylines in 64 m buckets; a point takes the kind of the
    /// nearest polyline strictly within <c>maxDist</c> (12 m by default), else nothing (the caller's OSM fallback).
    /// </summary>
    public sealed class RoadSurfaceIndex
    {
        public const double Cell = 64;
        public const double DefaultMaxDist = 12;

        struct Seg { public double2 A, B; public Surface Kind; }
        readonly Dictionary<long, List<Seg>> buckets = new Dictionary<long, List<Seg>>();

        static long Key(int bx, int bz) => ((long)bx << 32) ^ (uint)bz;

        public RoadSurfaceIndex(IReadOnlyList<RoadSurfaceLine> lines)
        {
            if (lines == null) return;
            foreach (var line in lines)
                for (int i = 0; i + 1 < line.Points.Count; i++)
                {
                    var s = new Seg { A = new double2(line.Points[i].E, line.Points[i].N), B = new double2(line.Points[i + 1].E, line.Points[i + 1].N), Kind = line.Kind };
                    int bx0 = (int)math.floor(math.min(s.A.x, s.B.x) / Cell), bx1 = (int)math.floor(math.max(s.A.x, s.B.x) / Cell);
                    int bz0 = (int)math.floor(math.min(s.A.y, s.B.y) / Cell), bz1 = (int)math.floor(math.max(s.A.y, s.B.y) / Cell);
                    for (int bz = bz0; bz <= bz1; bz++)
                        for (int bx = bx0; bx <= bx1; bx++)
                        {
                            if (!buckets.TryGetValue(Key(bx, bz), out var list)) buckets[Key(bx, bz)] = list = new List<Seg>();
                            list.Add(s);
                        }
                }
        }

        /// <summary>The kind of the nearest registered polyline closer than <paramref name="maxDist"/>, or null.</summary>
        public Surface? Nearest(double2 p, double maxDist = DefaultMaxDist)
        {
            int bx = (int)math.floor(p.x / Cell), bz = (int)math.floor(p.y / Cell), r = (int)math.ceil(maxDist / Cell);
            Surface? best = null; double bestD = maxDist;
            for (int dj = -r; dj <= r; dj++)
                for (int di = -r; di <= r; di++)
                {
                    if (!buckets.TryGetValue(Key(bx + di, bz + dj), out var list)) continue;
                    foreach (var s in list)
                    {
                        double2 ab = s.B - s.A;
                        double l2 = math.lengthsq(ab); if (l2 == 0) l2 = 1;
                        double t = math.clamp(math.dot(p - s.A, ab) / l2, 0, 1);
                        double d = math.distance(p, s.A + ab * t);
                        if (d < bestD) { bestD = d; best = s.Kind; }
                    }
                }
            return best;
        }

        /// <summary>
        /// assignSurfaces over a list of points: <paramref name="result"/>[i] gets the measured kind where a polyline is
        /// near and is left as it was elsewhere (pre-fill it with the fallback, or null to see what was measured).
        /// Returns how many points got a measured surface.
        /// </summary>
        public static int Assign(IReadOnlyList<double2> points, IReadOnlyList<RoadSurfaceLine> lines, Surface?[] result, double maxDist = DefaultMaxDist)
        {
            var index = new RoadSurfaceIndex(lines);
            int measured = 0;
            for (int i = 0; i < points.Count; i++)
            {
                var k = index.Nearest(points[i], maxDist);
                if (k.HasValue) { result[i] = k; measured++; }
            }
            return measured;
        }
    }
}
