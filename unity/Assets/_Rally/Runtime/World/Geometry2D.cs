using System.Collections.Generic;
using Unity.Mathematics;

namespace Rally.World
{
    /// <summary>
    /// Planar helpers shared by water, buildings and land cover: ear clipping for lake and footprint
    /// polygons, point-in-ring (water.js pointInRing), polyline distance (water.js polylineDist2),
    /// signed area and centroid (water.js polygonArea / polygonCentroid). Pure, allocation-free where it
    /// runs per frame (the ring tests); ear clipping allocates its own index lists and runs at tile build.
    /// </summary>
    public static class Geometry2D
    {
        /// <summary>Even-odd ray cast. Ring is closed implicitly (last → first).</summary>
        public static bool PointInRing(float2 p, List<float2> ring)
        {
            bool inside = false;
            for (int i = 0, j = ring.Count - 1; i < ring.Count; j = i++)
            {
                var a = ring[i]; var b = ring[j];
                if ((a.y > p.y) != (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
            }
            return inside;
        }

        /// <summary>Squared distance from a point to an open polyline.</summary>
        public static float PolylineDist2(float2 p, List<float2> line)
        {
            float best = float.PositiveInfinity;
            for (int i = 0; i + 1 < line.Count; i++)
            {
                float2 a = line[i], ab = line[i + 1] - a;
                float l2 = math.lengthsq(ab);
                float t = l2 > 1e-12f ? math.saturate(math.dot(p - a, ab) / l2) : 0f;
                best = math.min(best, math.distancesq(p, a + ab * t));
            }
            return best;
        }

        /// <summary>Twice the signed area (positive = counter-clockwise with y up / north).</summary>
        public static float SignedArea2(List<float2> ring)
        {
            float s = 0;
            for (int i = 0, j = ring.Count - 1; i < ring.Count; j = i++) s += ring[j].x * ring[i].y - ring[i].x * ring[j].y;
            return s;
        }

        public static float2 Centroid(List<float2> ring)
        {
            float a2 = SignedArea2(ring);
            if (math.abs(a2) < 1e-9f) { float2 m = 0; foreach (var p in ring) m += p; return m / math.max(1, ring.Count); }
            float2 c = 0;
            for (int i = 0, j = ring.Count - 1; i < ring.Count; j = i++)
            {
                float cross = ring[j].x * ring[i].y - ring[i].x * ring[j].y;
                c += (ring[j] + ring[i]) * cross;
            }
            return c / (3f * a2);
        }

        /// <summary>
        /// Ear clipping of a simple polygon (no holes, no self-intersections), O(n²). Returns index
        /// triples, counter-clockwise regardless of the input winding. Degenerate input (collinear
        /// points, fewer than 3 vertices) yields fewer triangles, never an exception, because OSM rings
        /// are not always tidy and a missing lake is better than a missing tile.
        /// </summary>
        public static void EarClip(List<float2> ring, List<int> triangles)
        {
            int n = ring.Count;
            if (n < 3) return;
            var idx = new List<int>(n);
            bool ccw = SignedArea2(ring) > 0;
            for (int i = 0; i < n; i++) idx.Add(ccw ? i : n - 1 - i);
            int guard = 0;
            while (idx.Count > 3 && guard++ < n * n)
            {
                bool clipped = false;
                for (int i = 0; i < idx.Count; i++)
                {
                    int i0 = idx[(i + idx.Count - 1) % idx.Count], i1 = idx[i], i2 = idx[(i + 1) % idx.Count];
                    float2 a = ring[i0], b = ring[i1], c = ring[i2];
                    if (Cross(b - a, c - a) <= 1e-9f) continue;          // reflex or degenerate corner: not an ear
                    bool empty = true;
                    for (int k = 0; k < idx.Count && empty; k++)
                    {
                        int v = idx[k];
                        if (v == i0 || v == i1 || v == i2) continue;
                        if (InTriangle(ring[v], a, b, c)) empty = false;
                    }
                    if (!empty) continue;
                    triangles.Add(i0); triangles.Add(i1); triangles.Add(i2);
                    idx.RemoveAt(i);
                    clipped = true;
                    break;
                }
                if (!clipped)
                {
                    // No ear found (self-intersecting or collinear run): drop the sharpest corner and carry on.
                    int worst = 0; float worstCross = float.PositiveInfinity;
                    for (int i = 0; i < idx.Count; i++)
                    {
                        float cr = Cross(ring[idx[i]] - ring[idx[(i + idx.Count - 1) % idx.Count]], ring[idx[(i + 1) % idx.Count]] - ring[idx[i]]);
                        if (cr < worstCross) { worstCross = cr; worst = i; }
                    }
                    idx.RemoveAt(worst);
                }
            }
            if (idx.Count == 3 && Cross(ring[idx[1]] - ring[idx[0]], ring[idx[2]] - ring[idx[0]]) > 1e-9f)
            {
                triangles.Add(idx[0]); triangles.Add(idx[1]); triangles.Add(idx[2]);
            }
        }

        static float Cross(float2 a, float2 b) => a.x * b.y - a.y * b.x;

        static bool InTriangle(float2 p, float2 a, float2 b, float2 c)
        {
            float d1 = Cross(b - a, p - a), d2 = Cross(c - b, p - b), d3 = Cross(a - c, p - c);
            return d1 >= -1e-7f && d2 >= -1e-7f && d3 >= -1e-7f;
        }
    }
}
