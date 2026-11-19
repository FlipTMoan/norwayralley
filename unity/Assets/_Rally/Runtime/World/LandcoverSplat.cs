using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Unity.Collections;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// Builds a coarse tile's 16 m-cell textures from the land cover (Rally.Geo.CoverRaster, NIBIO SR16) and the OSM
    /// polygons (Rally.Geo.Features.Areas), following landcover.js (rasterizeAreas, applySr16, fillForestDefaults,
    /// tintByCover) and terrain.js terrainColor, turned into weights for the clipmap's ground layers:
    ///   Splat  R conifer floor, G birch floor, B field, A rock
    ///   Splat2 R heath, G bog, B snow, A sand/gravel — meadow grass is 1 − sum of all eight in the shader
    ///   Cover  R species × 64 (0 none, 1 spruce, 2 pine, 3 deciduous), G crown 0..255, B cover class × 25,
    ///          A scatter weight (<see cref="Budget"/>: the tile's tree budget and the road corridor; 255 until set)
    /// The layer numbers (<see cref="LayerGrass"/> … <see cref="LayerSand"/>) are the slices of the terrain albedo and
    /// normal arrays, so Rally/TerrainClipmap, Editor/GroundTextures and this class must agree on them.
    ///
    /// Trees (the Cover texture, read by Scatter.compute / ScatterJob) follow landcover.js: SR16 species and crown
    /// cover make forest wherever OSM says open, forest or scrub; OSM forest/wood fills the gaps SR16 has no data
    /// for (species from leaf_type or a stand hash, crown 0.55); fields, meadows, water, built-up land and bare
    /// rock get none. Two rules are not in the JS (which drew one valley): bogs carry a few pines, and residential
    /// areas keep a thin scatter of garden trees instead of none. The tree line and snow line come from elevation
    /// and latitude: roughly 1100 m at 61 °N falling 75 m per degree north — Norwegian birch limits — so the
    /// Finnmark plateau is bare while Setesdal is wooded.
    /// </summary>
    public static class LandcoverSplat
    {
        public const byte Open = 0, Forest = 1, Field = 2, Pasture = 3, Water = 4, Wetland = 5, Built = 6, Rock = 7, Scrub = 8, Residential = 9;
        /// <summary>Cover texture B channel step: class × 25 (classes 0..9 fit a byte with room to round).</summary>
        public const int ClassStep = 25;
        public const int SpeciesNone = 0, SpeciesSpruce = 1, SpeciesPine = 2, SpeciesDeciduous = 3;
        /// <summary>Ground layers = terrain texture array slices. Grass is the implicit remainder.</summary>
        public const int LayerGrass = 0, LayerConifer = 1, LayerBirch = 2, LayerField = 3, LayerRock = 4, LayerHeath = 5, LayerBog = 6, LayerSnow = 7, LayerSand = 8, LayerCount = 9;
        /// <summary>Crown cover of the sparse stands (bog pines, garden trees) the JS did not have.</summary>
        public const float BogCrown = 0.1f, ResidentialCrown = 0.08f, ScrubCrown = 0.12f;

        /// <summary>landcover.js OSM_COVER: tag value → (class, priority); higher priority wins where polygons overlap.</summary>
        static readonly Dictionary<string, (byte cls, byte pri)> OsmCover = new Dictionary<string, (byte, byte)>
        {
            { "water", (Water, 9) }, { "wetland", (Wetland, 7) }, { "farmland", (Field, 6) }, { "orchard", (Field, 6) },
            { "meadow", (Pasture, 5) }, { "grass", (Pasture, 5) }, { "grassland", (Pasture, 4) }, { "farmyard", (Built, 5) },
            { "residential", (Residential, 3) }, { "industrial", (Built, 3) }, { "commercial", (Built, 3) }, { "retail", (Built, 3) },
            { "cemetery", (Pasture, 3) }, { "quarry", (Rock, 4) }, { "bare_rock", (Rock, 2) }, { "scree", (Rock, 2) },
            { "sand", (Open, 2) }, { "heath", (Scrub, 2) }, { "scrub", (Scrub, 2) }, { "forest", (Forest, 1) }, { "wood", (Forest, 1) },
        };

        public static float TreeLine(double latitude) => math.clamp(1100f - 75f * (float)(latitude - 61.0), 300f, 1200f);
        /// <summary>Permanent-ish snow: terrain.js turns the ground white from 665 m in the 59 °N scene, ≈ tree line + 300 m.</summary>
        public static float SnowLine(double latitude) => TreeLine(latitude) + 300f;

        /// <summary>Species, crown (0..1) and class of a cover texel, as the scatter decodes them.</summary>
        public static (int species, float crown, int cls) Decode(Color32 c) => ((int)math.round(c.r / 64f), c.g / 255f, (int)math.round(c.b / (float)ClassStep));

        public static void Build(CoverRaster cover, Features features, HeightGrid grid, double latitude, int res,
            NativeArray<Color32> splat, NativeArray<Color32> splat2, NativeArray<Color32> coverOut)
        {
            float treeLine = TreeLine(latitude), snowLine = SnowLine(latitude);
            float cell = grid.SizeM / res;
            // Cover class per cell from the OSM polygons (point-in-polygon at the cell centre, bounded by the polygon's box).
            var cls = new NativeArray<byte>(res * res, Allocator.Temp, NativeArrayOptions.ClearMemory);
            var pri = new NativeArray<byte>(res * res, Allocator.Temp, NativeArrayOptions.ClearMemory);
            var leaf = new NativeArray<byte>(res * res, Allocator.Temp, NativeArrayOptions.ClearMemory);   // OSM leaf_type hint
            if (features != null) Rasterize(features.Areas, grid.Origin, cell, res, cls, pri, leaf);    // water and wetland polygons are Areas too
            for (int j = 0; j < res; j++)
                for (int i = 0; i < res; i++)
                {
                    int k = j * res + i;
                    int sr16 = 0; float dn = 0;
                    if (cover != null && cover.Width > 0)
                    {
                        int k2 = cover.IndexOf(grid.Origin + new double2((i + 0.5) * cell, (j + 0.5) * cell));
                        if (k2 >= 0) { sr16 = cover.Trees[k2]; dn = cover.Crown[k2] / 255f; }
                    }
                    byte c = cls[k];
                    var (species, crown) = Trees(c, sr16, dn, leaf[k], i, j, ref c);
                    float x = (i + 0.5f) * cell, y = (j + 0.5f) * cell;
                    float h = grid.SampleCells(x / grid.CellM, y / grid.CellM);
                    float slope = SlopeAt(grid, x, y);
                    if (h > treeLine) crown *= math.saturate(1f - (h - treeLine) / 100f);   // the forest thins out to the tree line
                    bool shore = c != Water && (h < 2f || NextToWater(cls, res, i, j));
                    var w = Weights(c, species, crown, h, slope, treeLine, snowLine, shore);
                    splat[k] = new Color32(B(w.c0.x), B(w.c0.y), B(w.c0.z), B(w.c0.w));
                    splat2[k] = new Color32(B(w.c1.x), B(w.c1.y), B(w.c1.z), B(w.c1.w));
                    coverOut[k] = new Color32((byte)(species * 64), B(crown), (byte)(c * ClassStep), 255);
                }
            cls.Dispose(); pri.Dispose(); leaf.Dispose();
        }

        /// <summary>
        /// stream.js scatterChunk's budget: expected trees per cell = crown × TREES_PER_CELL × density, weighted 1 within
        /// 260 m of a road and 0.4 elsewhere (detail where the car is), all scaled down together when the tile would hold
        /// more than <paramref name="capacity"/>. The product goes into the cover texture's alpha, which the scatter
        /// multiplies in, so a dense forest thins out evenly instead of the instance store filling up row by row.
        /// <paramref name="nearRoad"/> answers for the 32 × 32 grid of 64 m squares (stream.js COARSE).
        /// </summary>
        public static float Budget(NativeArray<Color32> cover, int res, System.Func<int, int, bool> nearRoad, int capacity, float density)
        {
            const int Coarse = 32;
            var near = new bool[Coarse * Coarse];
            for (int j = 0; j < Coarse; j++) for (int i = 0; i < Coarse; i++) near[j * Coarse + i] = nearRoad(i, j);
            float total = 0;
            for (int k = 0; k < res * res; k++)
            {
                var (_, crown, cls) = Decode(cover[k]);
                if (crown <= 0 || cls == Field || cls == Pasture || cls == Water || cls == Built || cls == Rock) continue;
                total += crown * ScatterTreesPerCell * density * (near[CoarseIndex(k, res, Coarse)] ? 1f : 0.4f);
            }
            float scale = total > capacity * 0.92f ? capacity * 0.92f / total : 1f;
            for (int k = 0; k < res * res; k++)
            {
                var c = cover[k];
                c.a = B((near[CoarseIndex(k, res, Coarse)] ? 1f : 0.4f) * scale);
                cover[k] = c;
            }
            return scale;
        }

        /// <summary>stream.js TREES_PER_CELL (ScatterJob.TreesPerCell; World cannot see the job's constant from here without a cycle).</summary>
        const float ScatterTreesPerCell = 4.5f;
        static int CoarseIndex(int k, int res, int coarse) { int i = k % res, j = k / res; return (j * coarse / res) * coarse + i * coarse / res; }

        static byte B(float v) => (byte)math.round(math.saturate(v) * 255f);

        /// <summary>
        /// landcover.js applySr16 + fillForestDefaults for one cell: (species, crown 0..1); may turn the class into Forest.
        /// </summary>
        public static (int species, float crown) Trees(byte c, int sr16, float dn, byte leafHint, int i, int j, ref byte outClass)
        {
            switch (c)
            {
                case Open: case Forest: case Scrub:
                    if (sr16 != SpeciesNone) { outClass = Forest; return (sr16, math.max(0.15f, dn > 0 ? dn : 0.5f)); }
                    if (c == Forest)
                    {
                        int sp = leafHint == 2 ? SpeciesDeciduous : leafHint == 1 ? SpeciesSpruce : StandSpecies(i, j);
                        return (sp, dn > 0 ? dn : 0.55f);
                    }
                    if (c == Scrub) return (SpeciesDeciduous, ScrubCrown);   // heath / scrub: shrubs and a few birches (the scatter decides)
                    return (SpeciesNone, 0f);
                case Wetland:
                    return (SpeciesPine, math.clamp(dn * 0.15f, BogCrown * 0.6f, BogCrown * 1.2f));   // bog: a few stunted pines
                case Residential:
                    if (sr16 != SpeciesNone) return (sr16, math.max(0.04f, dn * 0.35f));
                    float g = Hash(i, j, 11);                                      // garden trees: mostly birch
                    return (g < 0.6f ? SpeciesDeciduous : g < 0.85f ? SpeciesSpruce : SpeciesPine, ResidentialCrown);
                default:
                    return (SpeciesNone, 0f);       // field, pasture, water, built-up, bare rock
            }
        }

        /// <summary>landcover.js fillForestDefaults: 60 % spruce, 20 % pine, 20 % deciduous in 64 m stands.</summary>
        static int StandSpecies(int i, int j)
        {
            float n = Hash(i >> 2, j >> 2, 5);
            return n < 0.6f ? SpeciesSpruce : n < 0.8f ? SpeciesPine : SpeciesDeciduous;
        }

        /// <summary>
        /// Ground layer weights of a cell (two float4 in Splat / Splat2 order). terrain.js: exposed rock only on genuinely
        /// steep faces, the plateau stays mossy; heath takes over towards the tree line; snow by height above the snow line.
        /// </summary>
        public static (float4 c0, float4 c1) Weights(byte c, int species, float crown, float h, float slope, float treeLine, float snowLine, bool shore)
        {
            float conifer = 0, birch = 0, field = 0, rock = math.saturate((slope - 0.55f) * 2.2f), heath = 0, bog = 0, sand = 0;
            switch (c)
            {
                case Forest:
                    float floor = 0.55f + 0.45f * crown;
                    if (species == SpeciesDeciduous) birch = floor; else conifer = floor;
                    break;
                case Field: field = 0.9f; break;
                case Wetland: bog = 0.85f; break;
                case Water: sand = 0.8f; break;
                case Built: sand = 0.5f; break;
                case Residential: sand = 0.15f; break;
                case Rock: rock = math.max(rock, 0.85f); break;
                case Scrub: heath = 0.75f; break;
            }
            if (shore) sand = math.max(sand, 0.55f);
            if (c != Water && c != Rock && c != Field)
            {
                float alpine = math.saturate((h - (treeLine - 100f)) / 200f) * 0.8f;   // dwarf shrubs and lichen above the forest
                heath = math.max(heath, alpine);
                conifer *= 1 - alpine; birch *= 1 - alpine * 0.5f;
            }
            rock = math.max(rock, math.saturate((h - treeLine - 250f) / 300f) * 0.5f);   // the high fell is stony
            float snow = math.saturate((h - snowLine) / 70f);
            float bare = 1f - snow;                                                       // snow covers whatever is under it
            conifer *= bare; birch *= bare; field *= bare; rock *= bare; heath *= bare; bog *= bare; sand *= bare;
            float sum = conifer + birch + field + rock + heath + bog + snow + sand;
            if (sum > 1f) { float s = 1f / sum; conifer *= s; birch *= s; field *= s; rock *= s; heath *= s; bog *= s; snow *= s; sand *= s; }
            return (new float4(conifer, birch, field, rock), new float4(heath, bog, snow, sand));
        }

        static bool NextToWater(NativeArray<byte> cls, int res, int i, int j)
        {
            for (int dj = -1; dj <= 1; dj++)
                for (int di = -1; di <= 1; di++)
                {
                    int x = i + di, y = j + dj;
                    if (x >= 0 && y >= 0 && x < res && y < res && cls[y * res + x] == Water) return true;
                }
            return false;
        }

        static void Rasterize(List<Area> polys, Utm33 origin, float cell, int res, NativeArray<byte> cls, NativeArray<byte> pri, NativeArray<byte> leaf)
        {
            if (polys == null) return;
            var ring = new List<float2>(64);
            foreach (var poly in polys)
            {
                if (poly.Rings == null || poly.Rings.Count == 0 || poly.Rings[0].Count < 3 || poly.Kind == null || !OsmCover.TryGetValue(poly.Kind, out var cp)) continue;
                byte hint = (byte)(poly.Leaf == "needleleaved" ? 1 : poly.Leaf == "broadleaved" ? 2 : 0);
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
                        if (cp.cls == Forest) leaf[k] = hint;
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
