using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    /// <summary>What the verge builder reads from the world (TileWorld and the sign / light layers in the game, a fake in tests).</summary>
    public interface IVergeWorld
    {
        /// <summary>The cell's land cover, trees and houses are in (its coarse tile's overlay has been applied).</summary>
        bool Ready(Utm33 p);
        /// <summary>Road, bridge and tunnel segments reaching into <paramref name="bounds"/>, local to <paramref name="origin"/> (IRoadQuery.CollectCarveSegments).</summary>
        void Segments(Bounds25833 bounds, Utm33 origin, List<CarveSegment> output);
        /// <summary>The carved ground (m a.s.l.).</summary>
        float Ground(Utm33 p);
        /// <summary>The land-cover texel (LandcoverSplat Cover: species, crown, class) at a point.</summary>
        Color32 Cover(Utm33 p);
        float TreeLine(Utm33 p);
        float SnowLine(Utm33 p);
        /// <summary>Things the plants keep clear of in <paramref name="bounds"/>: tree trunks, sign posts, light masts — (E, N, radius).</summary>
        void Obstacles(Bounds25833 bounds, List<double3> output);
        /// <summary>House outline boxes in <paramref name="bounds"/>.</summary>
        void Houses(Bounds25833 bounds, List<FootprintBox> output);
    }

    /// <summary>
    /// The plants of one verge cell (<see cref="VergeLayer.CellM"/> square): a lattice anchored to UTM (herbs every
    /// <see cref="VergeRules.HerbStep"/> m, bushes every <see cref="VergeRules.ShrubStep"/> m, each point jittered by its hash) is
    /// measured against every road on the ground near the cell — the distance beyond the nearest drawn shoulder edge, so a
    /// junction mouth, a driveway or a parallel street is never planted — and handed to <see cref="VergeRules"/> with the land
    /// cover, height, slope and region there. Points on a bridge deck or over a tunnel's footprint, in a house (+1 m), within
    /// 1 m of a sign post or light mast (bushes 2 m) or on a tree trunk are skipped. A lattice point belongs to exactly one
    /// cell and its plant depends only on its global index and the world, so the result does not depend on the cell layout.
    /// </summary>
    public static class VergeBuilder
    {
        /// <summary>How far beyond the drawn shoulder edge each pass reaches (the tall band's fade, the bush band).</summary>
        public const float HerbReach = 8.5f, ShrubReach = VergeRules.ShrubTo + 0.5f;
        /// <summary>The frame the cell geometry is computed in: the coarse tile's corner (TileScheduler.CoarseSize).</summary>
        const double AnchorM = 2048;

        public sealed class Scratch
        {
            public readonly List<CarveSegment> Segs = new List<CarveSegment>();
            public readonly List<double3> Obstacles = new List<double3>();
            public readonly List<FootprintBox> Houses = new List<FootprintBox>();
            public float[] Edge, Heights;
            public bool[] Main, Blocked;
            public float2[] Pos;
            /// <summary>Obstacle indices per <see cref="BucketM"/> m bucket over the cell (a town cell has hundreds of trees and posts).</summary>
            public readonly List<int>[] Buckets = new List<int>[BucketN * BucketN];
            public double BucketE, BucketN0;
        }

        const float BucketM = 8f;
        const int BucketN = 10;   // 80 m: the cell and its 3 m margin

        public struct Result { public int Points, Plants; public float MinY, MaxY; }

        /// <summary>
        /// The herbs (<paramref name="shrubs"/> = false) or bushes of the cell at <paramref name="origin"/> (its south-west corner,
        /// a multiple of the lattice step) into <paramref name="output"/>, positions local to <paramref name="origin"/>.
        /// </summary>
        public static Result Build(IVergeWorld w, Utm33 origin, float size, bool shrubs, List<VergePlant> output, Scratch s = null, byte[] bioGrid = null)
        {
            s ??= new Scratch();
            var res = new Result { MinY = float.PositiveInfinity, MaxY = float.NegativeInfinity };
            float step = shrubs ? VergeRules.ShrubStep : VergeRules.HerbStep, reach = shrubs ? ShrubReach : HerbReach;
            int n = (int)math.round(size / step);
            float margin = RoadConstants.FlatHalf(RoadConstants.TwoLaneHalf) + RoadConstants.CarveApron + reach + 2f;
            var cell = new Bounds25833(origin.E, origin.N, origin.E + size, origin.N + size);
            // Geometry in metres from the coarse tile's corner (not the cell's): every cell of a tile then rounds the same
            // segment and the same lattice point to the same floats, and a plant does not depend on which cell built it.
            var anchor = new Utm33(math.floor(origin.E / AnchorM) * AnchorM, math.floor(origin.N / AnchorM) * AnchorM);
            var off = new float2((float)(origin.E - anchor.E), (float)(origin.N - anchor.N));
            s.Segs.Clear();
            w.Segments(new Bounds25833(cell.MinE - margin, cell.MinN - margin, cell.MaxE + margin, cell.MaxN + margin), anchor, s.Segs);
            bool any = false;
            foreach (var g in s.Segs) if ((g.Flags & CarveSegment.Layer) == 0) { any = true; break; }
            if (!any) return res;

            int count = n * n;
            if (s.Edge == null || s.Edge.Length < count) { s.Edge = new float[count]; s.Main = new bool[count]; s.Blocked = new bool[count]; s.Pos = new float2[count]; }
            int2 i0 = new int2((int)math.round(origin.E / step), (int)math.round(origin.N / step));
            for (int j = 0; j < n; j++)
                for (int i = 0; i < n; i++)
                {
                    int k = j * n + i;
                    var g = i0 + new int2(i, j);
                    var at = (new double2(g.x, g.y) + 0.5 + (new double2(VergeRules.Rand(g, 1), VergeRules.Rand(g, 2)) - 0.5) * 0.8) * step;
                    s.Pos[k] = (float2)(at - new double2(anchor.E, anchor.N));
                    s.Edge[k] = float.PositiveInfinity; s.Main[k] = false; s.Blocked[k] = false;
                }
            // Distance beyond the nearest drawn shoulder edge (every road on the ground), and the deck / tube footprints.
            foreach (var g in s.Segs)
            {
                bool layer = (g.Flags & CarveSegment.Layer) != 0;
                float flat = layer ? g.HalfWidth + 0.5f : g.HalfWidth - RoadConstants.CarveApron;
                float r = layer ? flat : flat + reach;
                float2 lo = math.min(g.A, g.B) - r - off, hi = math.max(g.A, g.B) + r - off;
                int ia = math.max(0, (int)math.floor(lo.x / step)), ib = math.min(n - 1, (int)math.floor(hi.x / step));
                int ja = math.max(0, (int)math.floor(lo.y / step)), jb = math.min(n - 1, (int)math.floor(hi.y / step));
                float2 ab = g.B - g.A;
                float len2 = math.max(1e-9f, math.lengthsq(ab));
                bool main = !layer && g.HalfWidth - RoadConstants.CarveApron - RoadConstants.Shoulder >= RoadConstants.TwoLaneHalf - 0.01f;
                for (int j = ja; j <= jb; j++)
                    for (int i = ia; i <= ib; i++)
                    {
                        int k = j * n + i;
                        var p = s.Pos[k];
                        float t = math.saturate(math.dot(p - g.A, ab) / len2);
                        float d = math.distance(p, g.A + ab * t);
                        if (layer) { if (d < flat) s.Blocked[k] = true; continue; }
                        float e = d - flat;
                        if (e < s.Edge[k]) { s.Edge[k] = e; s.Main[k] = main; }
                    }
            }
            // The carved ground every HeightStep m over the cell (one more row and column), for height and slope.
            float hs = shrubs ? 4f : 2f;
            int hn = (int)math.round(size / hs) + 1;
            if (s.Heights == null || s.Heights.Length < hn * hn) s.Heights = new float[hn * hn];
            for (int j = 0; j < hn; j++)
                for (int i = 0; i < hn; i++)
                {
                    float h = w.Ground(new Utm33(origin.E + i * hs, origin.N + j * hs));
                    s.Heights[j * hn + i] = h;
                    res.MinY = math.min(res.MinY, h); res.MaxY = math.max(res.MaxY, h);
                }
            s.Obstacles.Clear(); s.Houses.Clear();
            var near = new Bounds25833(cell.MinE - 3, cell.MinN - 3, cell.MaxE + 3, cell.MaxN + 3);
            w.Obstacles(near, s.Obstacles);
            s.BucketE = near.MinE; s.BucketN0 = near.MinN;
            for (int i = 0; i < s.Buckets.Length; i++) (s.Buckets[i] ??= new List<int>()).Clear();
            for (int i = 0; i < s.Obstacles.Count; i++)
            {
                var o = s.Obstacles[i];
                int bx = math.clamp((int)((o.x - s.BucketE) / BucketM), 0, BucketN - 1), by = math.clamp((int)((o.y - s.BucketN0) / BucketM), 0, BucketN - 1);
                s.Buckets[by * BucketN + bx].Add(i);
            }
            w.Houses(new Bounds25833(cell.MinE - 60, cell.MinN - 60, cell.MaxE + 60, cell.MaxN + 60), s.Houses);
            var centre = new Utm33(origin.E + size / 2, origin.N + size / 2);
            float treeLine = w.TreeLine(centre), snowLine = w.SnowLine(centre);
            var grid = bioGrid ?? Bioclimate.Data;
            float band = shrubs ? VergeRules.ShrubTo : HerbReach - 0.5f;
            float clear = shrubs ? 2f : 1f;

            for (int k = 0; k < count; k++)
            {
                if (s.Blocked[k] || s.Edge[k] > band || s.Edge[k] < VergeRules.EdgeGap) continue;
                res.Points++;
                var g = i0 + new int2(k % n, k / n);
                double e = anchor.E + s.Pos[k].x, nn = anchor.N + s.Pos[k].y;
                var p = s.Pos[k] - off;
                var u = new Utm33(e, nn);
                // height and slope from the height lattice
                float fx = math.clamp(p.x / hs, 0, hn - 1.001f), fy = math.clamp(p.y / hs, 0, hn - 1.001f);
                int cx = (int)fx, cy = (int)fy; float tx = fx - cx, ty = fy - cy;
                float h00 = s.Heights[cy * hn + cx], h10 = s.Heights[cy * hn + cx + 1], h01 = s.Heights[(cy + 1) * hn + cx], h11 = s.Heights[(cy + 1) * hn + cx + 1];
                float h = math.lerp(math.lerp(h00, h10, tx), math.lerp(h01, h11, tx), ty);
                float gx = math.lerp(h10 - h00, h11 - h01, ty) / hs, gy = math.lerp(h01 - h00, h11 - h10, tx) / hs;
                var (species, crown, cls) = LandcoverSplat.Decode(w.Cover(u));
                Bioclimate.At(grid, u, out var zone, out var section);
                var site = new VergeSite
                {
                    Edge = s.Edge[k], Cls = (byte)cls, Crown = crown, Species = species, Height = h, Slope = math.length(new float2(gx, gy)),
                    MainRoad = s.Main[k], Snow = h > snowLine - 150f, Region = VergeRules.RegionFor(zone, section, h, treeLine, nn),
                };
                VergeKind kind; float scale; Color tint;
                var q = VergeRules.NoiseCoord(e, nn);
                bool ok = shrubs ? VergeRules.Shrub(site, g, q, out kind, out scale, out tint) : VergeRules.Herb(site, g, q, out kind, out scale, out tint);
                if (!ok || Obstructed(s, e, nn, clear)) continue;
                output.Add(new VergePlant { Pos = p, Kind = kind, Scale = scale, Yaw = VergeRules.Rand(g, 3) * 6.2831853f, Rank = VergeRules.Rand(g, 4), Tint = tint });
                res.Plants++;
            }
            return res;
        }

        static bool Obstructed(Scratch s, double e, double n, float clear)
        {
            int cx = (int)((e - s.BucketE) / BucketM), cy = (int)((n - s.BucketN0) / BucketM);
            for (int by = math.max(0, cy - 1); by <= math.min(BucketN - 1, cy + 1); by++)
                for (int bx = math.max(0, cx - 1); bx <= math.min(BucketN - 1, cx + 1); bx++)
                    foreach (int i in s.Buckets[by * BucketN + bx])
                    {
                        var o = s.Obstacles[i];
                        double dx = o.x - e, dy = o.y - n, r = o.z + clear;
                        if (dx * dx + dy * dy < r * r) return true;
                    }
            foreach (var b in s.Houses)
            {
                var rel = new float2((float)(e - b.Centre.x), (float)(n - b.Centre.y));
                var ax = new float2(math.sin(b.Yaw), math.cos(b.Yaw));
                if (math.abs(math.dot(rel, ax)) < b.HalfLength + 1f && math.abs(math.dot(rel, new float2(ax.y, -ax.x))) < b.HalfWidth + 1f) return true;
            }
            return false;
        }
    }
}
