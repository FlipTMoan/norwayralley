using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Unity.Collections;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// Builds a coarse tile's two 16 m-cell textures from the land cover (Rally.Geo.CoverRaster) and the OSM polygons (Rally.Geo.Features.Areas)
    /// (landcover.js rasterizeAreas / tintByCover and terrain.js terrainColor, turned into weights):
    ///   Splat  R bog, G pasture, B rock, A snow — forest floor is 1 − sum in the shader
    ///   Cover  R species × 64 (0 none, 1 spruce, 2 pine, 3 deciduous), G crown 0..255, B cover class × 28, A 255
    /// Cover classes follow landcover.js COVER. The tree line and snow line come from elevation and
    /// latitude (not in the JS, which was tuned for one scene): roughly 1100 m at 61 °N falling 75 m
    /// per degree north — Norwegian birch limits — so the Finnmark plateau is bare while Setesdal is wooded.
    /// </summary>
    public static class LandcoverSplat
    {
        public const byte Open = 0, Forest = 1, Field = 2, Pasture = 3, Water = 4, Wetland = 5, Built = 6, Rock = 7, Scrub = 8;
        public const int SpeciesNone = 0, SpeciesSpruce = 1, SpeciesPine = 2, SpeciesDeciduous = 3;

        /// <summary>landcover.js OSM_COVER: tag value → (class, priority); higher priority wins where polygons overlap.</summary>
        static readonly Dictionary<string, (byte cls, byte pri)> OsmCover = new Dictionary<string, (byte, byte)>
        {
            { "water", (Water, 9) }, { "wetland", (Wetland, 7) }, { "farmland", (Field, 6) }, { "orchard", (Field, 6) },
            { "meadow", (Pasture, 5) }, { "grass", (Pasture, 5) }, { "grassland", (Pasture, 4) }, { "farmyard", (Built, 5) },
            { "residential", (Built, 3) }, { "industrial", (Built, 3) }, { "commercial", (Built, 3) }, { "retail", (Built, 3) },
            { "cemetery", (Pasture, 3) }, { "quarry", (Rock, 4) }, { "bare_rock", (Rock, 2) }, { "scree", (Rock, 2) },
            { "sand", (Open, 2) }, { "heath", (Scrub, 2) }, { "scrub", (Scrub, 2) }, { "forest", (Forest, 1) }, { "wood", (Forest, 1) },
        };

        public static float TreeLine(double latitude) => math.clamp(1100f - 75f * (float)(latitude - 61.0), 300f, 1200f);
        /// <summary>Permanent-ish snow: terrain.js turns the ground white from 665 m in the 59 °N scene, ≈ tree line + 300 m.</summary>
        public static float SnowLine(double latitude) => TreeLine(latitude) + 300f;

        public static void Build(CoverRaster cover, Features features, HeightGrid grid, double latitude, int res,
            NativeArray<Color32> splat, NativeArray<Color32> coverOut)
        {
            float treeLine = TreeLine(latitude), snowLine = SnowLine(latitude);
            float cell = grid.SizeM / res;
            // Cover class per cell from the OSM polygons (point-in-polygon at the cell centre, bounded by the polygon's box).
            var cls = new NativeArray<byte>(res * res, Allocator.Temp, NativeArrayOptions.ClearMemory);
            var pri = new NativeArray<byte>(res * res, Allocator.Temp, NativeArrayOptions.ClearMemory);
            if (features != null) Rasterize(features.Areas, grid.Origin, cell, res, cls, pri);   // water and wetland polygons are Areas too
            for (int j = 0; j < res; j++)
                for (int i = 0; i < res; i++)
                {
                    int k = j * res + i;
                    byte species = 0, crown = 0;
                    if (cover != null && cover.Width > 0)
                    {
                        int k2 = cover.IndexOf(grid.Origin + new double2((i + 0.5) * cell, (j + 0.5) * cell));
                        if (k2 >= 0) { species = cover.Trees[k2]; crown = cover.Crown[k2]; }
                    }
                    byte c = cls[k];
                    if (c == Open && crown > 0) c = Forest;              // SR16 forest where OSM has nothing
                    if (c == Forest && species == SpeciesNone)
                    {
                        // landcover.js fillForestDefaults: a species and a 0.55 crown for OSM-only forest.
                        float n = Hash(i >> 2, j >> 2, 5);
                        species = (byte)(n < 0.6f ? SpeciesSpruce : n < 0.8f ? SpeciesPine : SpeciesDeciduous);
                        if (crown == 0) crown = 140;
                    }
                    float x = (i + 0.5f) * cell, y = (j + 0.5f) * cell;
                    float h = grid.SampleCells(x / grid.CellM, y / grid.CellM);
                    float slope = SlopeAt(grid, x, y);
                    // Weights. terrain.js: exposed rock only on genuinely steep faces, the high plateau stays mossy.
                    float rock = math.saturate((slope - 0.55f) * 2.2f);
                    float bog = 0, pasture = 0;
                    switch (c)
                    {
                        case Field: pasture = 0.78f; break;
                        case Pasture: pasture = 0.62f; break;
                        case Wetland: bog = 0.6f; break;
                        case Water: bog = 0.85f; break;
                        case Built: rock = math.max(rock, 0.5f); break;
                        case Rock: rock = math.max(rock, 0.6f); break;
                        case Scrub: pasture = 0.4f; break;
                        case Open: pasture = 0.2f; break;
                    }
                    if (h > treeLine) pasture = math.max(pasture, math.saturate((h - treeLine) / 150f) * 0.5f);   // alpine heath
                    float snow = math.saturate((h - snowLine) / 70f);
                    float sum = bog + pasture + rock + snow;
                    if (sum > 1f) { bog /= sum; pasture /= sum; rock /= sum; snow /= sum; }
                    splat[k] = new Color32((byte)(bog * 255), (byte)(pasture * 255), (byte)(rock * 255), (byte)(snow * 255));
                    if (h > treeLine) crown = (byte)(crown * math.saturate(1f - (h - treeLine) / 100f));         // the forest thins out to the tree line
                    coverOut[k] = new Color32((byte)(species * 64), crown, (byte)(c * 28), 255);
                }
            cls.Dispose();
            pri.Dispose();
        }

        static void Rasterize(List<Area> polys, Utm33 origin, float cell, int res, NativeArray<byte> cls, NativeArray<byte> pri)
        {
            if (polys == null) return;
            var ring = new List<float2>(64);
            foreach (var poly in polys)
            {
                if (poly.Rings == null || poly.Rings.Count == 0 || poly.Rings[0].Count < 3 || poly.Kind == null || !OsmCover.TryGetValue(poly.Kind, out var cp)) continue;
                ring.Clear();
                float2 lo = new float2(float.MaxValue), hi = new float2(float.MinValue);
                foreach (var p in poly.Rings[0])
                {
                    var q = new float2((float)(p.E - origin.E), (float)(p.N - origin.N));
                    ring.Add(q); lo = math.min(lo, q); hi = math.max(hi, q);
                }
                int i0 = math.max(0, (int)(lo.x / cell)), i1 = math.min(res - 1, (int)(hi.x / cell));
                int j0 = math.max(0, (int)(lo.y / cell)), j1 = math.min(res - 1, (int)(hi.y / cell));
                for (int j = j0; j <= j1; j++)
                    for (int i = i0; i <= i1; i++)
                    {
                        int k = j * res + i;
                        if (pri[k] >= cp.pri) continue;
                        if (!Geometry2D.PointInRing(new float2((i + 0.5f) * cell, (j + 0.5f) * cell), ring)) continue;
                        cls[k] = cp.cls; pri[k] = cp.pri;
                    }
            }
        }

        static float SlopeAt(HeightGrid g, float x, float y)
        {
            int c = math.clamp((int)(x / g.CellM), 1, g.N - 2), r = math.clamp((int)(y / g.CellM), 1, g.N - 2);
            float gx = (g[c + 1, r] - g[c - 1, r]) / (2 * g.CellM), gy = (g[c, r + 1] - g[c, r - 1]) / (2 * g.CellM);
            return math.sqrt(gx * gx + gy * gy);
        }

        /// <summary>geo.js hash2: integer hash to [0, 1).</summary>
        public static float Hash(int x, int y, int seed)
        {
            unchecked
            {
                uint h = (uint)x * 374761393u + (uint)y * 668265263u + (uint)seed * 1442695041u;
                h = (h ^ (h >> 13)) * 1274126177u;
                return (h ^ (h >> 16)) / 4294967296f;
            }
        }
    }
}
