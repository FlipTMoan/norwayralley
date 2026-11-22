using Rally.Geo;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// What grows on a road verge: one atlas cell per kind (Editor/VergeTextures paints them in this order: the herbs in
    /// cells 0–31, the bushes from <see cref="FirstShrub"/>).
    /// </summary>
    public enum VergeKind : byte
    {
        Mown, TallGrass, DryGrass, AlpineTuft, Lupin, LupinPink, Fireweed, CowParsley, Buttercup, RedCampion, Yarrow, OxeyeDaisy,
        Harebell, Cranesbill, Wolfsbane, GlobeFlower, Foxglove, Bracken, Meadowsweet, RedClover, Vetch, Heather, Crowberry,
        CottonGrass, LadysMantle, Bistort,
        Willow = 32, Juniper, BirchSapling, GreyAlder, Raspberry, DogRose, DwarfBirch, Rowan, Hazel, BogMyrtle,
    }

    /// <summary>
    /// The verge look of a part of Norway, from its bioclimatic zone and section (<see cref="VergeRules.RegionFor"/>): one
    /// palette each in <see cref="VergeRules.Palettes"/>.
    /// </summary>
    public enum VergeRegion : byte { SouthLowland, Boreal, North, Oceanic, Continental, LowAlpine, HighAlpine }

    /// <summary>One plant (a clump of crossed cards, or a bush) on a verge, in the cell's local metres.</summary>
    public struct VergePlant
    {
        public float2 Pos;
        public VergeKind Kind;
        public float Scale, Yaw;
        /// <summary>Thinning order for the distance fade: the plant goes when the fade's density falls under it.</summary>
        public float Rank;
        public Color32 Tint;
    }

    /// <summary>The ground at one verge point, as the rules need it.</summary>
    public struct VergeSite
    {
        /// <summary>Metres beyond the drawn shoulder edge of the nearest road on the ground.</summary>
        public float Edge;
        public byte Cls;          // LandcoverSplat class
        public float Crown;       // SR16 crown cover 0..1
        public int Species;       // LandcoverSplat species
        public float Height, Slope;   // m a.s.l., rise per metre
        public bool MainRoad;     // the nearest road is a two-lane road
        public bool Snow;         // within 150 m under the snow line: no flowers
        public VergeRegion Region;
    }

    /// <summary>
    /// The verge rules (plan 2026-11-22 "verges"): bands across the verge measured from the drawn shoulder edge — a mown strip
    /// of short grass (0–1.5 m), tall grass with wildflowers in drifts (to <see cref="Palette.TallBand"/>), bushes from 3 to
    /// 12 m — with the plants of the region (<see cref="Palettes"/>, by bioclimatic zone and section) and the land cover
    /// (forest: narrow grass, dense bushes; fields: few bushes; bog: cotton grass and dwarf birch; built-up: lawn only; rock
    /// and slopes over 35°: nothing). Pure and deterministic: every random number is a hash of the global lattice index, every
    /// drift a value noise of the position (period <see cref="NoisePeriod"/> m, so float precision holds anywhere in Norway),
    /// so a plant is the same on every visit whichever cell builds it.
    /// </summary>
    public static class VergeRules
    {
        public const int FirstShrub = 32;
        /// <summary>Lattice spacing of the herb clumps and of the bushes (metres; both divide <see cref="VergeLayer.CellM"/>).</summary>
        public const float HerbStep = 0.8f, ShrubStep = 3.2f;
        /// <summary>No plant this close to the drawn shoulder edge (the ribbon's skirt and the 4 cm tuck).</summary>
        public const float EdgeGap = 0.25f;
        public const float MownBand = 1.5f, ShrubFrom = 3f, ShrubTo = 12f;
        /// <summary>Slopes steeper than 35° (cuttings, scree) stay bare.</summary>
        public static readonly float MaxSlope = math.tan(math.radians(35f));
        /// <summary>North of this northing (≈ 65.5° N) the boreal palettes take the northern plants.</summary>
        public const double NorthN = 7270000;
        /// <summary>Lupins only below this height.</summary>
        public const float LupinMaxHeight = 800f;
        public const double NoisePeriod = 8192;

        /// <summary>Card height and width at scale 1 (metres) and the colour a drift of it reads as from far away.</summary>
        public struct KindInfo { public float Height, Width; public Color Far; }

        static KindInfo K(float h, float w, float r = 0.3f, float g = 0.45f, float b = 0.2f) => new KindInfo { Height = h, Width = w, Far = new Color(r, g, b) };

        public static readonly KindInfo[] Kinds = BuildKinds();
        static KindInfo[] BuildKinds()
        {
            var k = new KindInfo[FirstShrub + 10];
            k[(int)VergeKind.Mown] = K(0.22f, 0.9f); k[(int)VergeKind.TallGrass] = K(0.7f, 0.85f); k[(int)VergeKind.DryGrass] = K(0.45f, 0.75f, 0.6f, 0.58f, 0.35f);
            k[(int)VergeKind.AlpineTuft] = K(0.18f, 0.5f, 0.45f, 0.45f, 0.3f);
            k[(int)VergeKind.Lupin] = K(0.95f, 0.6f, 0.42f, 0.36f, 0.78f); k[(int)VergeKind.LupinPink] = K(0.95f, 0.6f, 0.88f, 0.6f, 0.78f);
            k[(int)VergeKind.Fireweed] = K(1.25f, 0.6f, 0.86f, 0.38f, 0.62f); k[(int)VergeKind.CowParsley] = K(1.0f, 0.9f, 0.95f, 0.95f, 0.9f);
            k[(int)VergeKind.Buttercup] = K(0.6f, 0.6f, 0.95f, 0.85f, 0.2f); k[(int)VergeKind.RedCampion] = K(0.6f, 0.5f, 0.88f, 0.32f, 0.48f);
            k[(int)VergeKind.Yarrow] = K(0.5f, 0.5f, 0.92f, 0.9f, 0.85f); k[(int)VergeKind.OxeyeDaisy] = K(0.5f, 0.55f, 0.95f, 0.95f, 0.85f);
            k[(int)VergeKind.Harebell] = K(0.38f, 0.42f, 0.48f, 0.52f, 0.88f); k[(int)VergeKind.Cranesbill] = K(0.6f, 0.6f, 0.58f, 0.48f, 0.88f);
            k[(int)VergeKind.Wolfsbane] = K(1.35f, 0.6f, 0.45f, 0.42f, 0.78f); k[(int)VergeKind.GlobeFlower] = K(0.55f, 0.5f, 0.98f, 0.88f, 0.28f);
            k[(int)VergeKind.Foxglove] = K(1.15f, 0.5f, 0.78f, 0.36f, 0.66f); k[(int)VergeKind.Bracken] = K(1.0f, 1.3f, 0.36f, 0.56f, 0.2f);
            k[(int)VergeKind.Meadowsweet] = K(1.0f, 0.7f, 0.95f, 0.92f, 0.78f); k[(int)VergeKind.RedClover] = K(0.3f, 0.45f, 0.86f, 0.46f, 0.6f);
            k[(int)VergeKind.Vetch] = K(0.6f, 0.6f, 0.52f, 0.46f, 0.86f); k[(int)VergeKind.Heather] = K(0.3f, 0.65f, 0.6f, 0.4f, 0.55f);
            k[(int)VergeKind.Crowberry] = K(0.14f, 0.6f, 0.22f, 0.3f, 0.16f); k[(int)VergeKind.CottonGrass] = K(0.42f, 0.45f, 0.96f, 0.96f, 0.94f);
            k[(int)VergeKind.LadysMantle] = K(0.3f, 0.5f, 0.62f, 0.72f, 0.3f); k[(int)VergeKind.Bistort] = K(0.25f, 0.3f, 0.95f, 0.86f, 0.86f);
            k[(int)VergeKind.Willow] = K(2.2f, 2.2f); k[(int)VergeKind.Juniper] = K(2.2f, 1.0f); k[(int)VergeKind.BirchSapling] = K(3.6f, 1.9f);
            k[(int)VergeKind.GreyAlder] = K(3.5f, 2.6f); k[(int)VergeKind.Raspberry] = K(1.3f, 1.6f); k[(int)VergeKind.DogRose] = K(1.6f, 1.8f);
            k[(int)VergeKind.DwarfBirch] = K(0.6f, 1.2f); k[(int)VergeKind.Rowan] = K(3.0f, 1.8f); k[(int)VergeKind.Hazel] = K(3.0f, 2.8f);
            k[(int)VergeKind.BogMyrtle] = K(0.9f, 1.0f);
            return k;
        }

        public static bool IsShrub(VergeKind k) => (int)k >= FirstShrub;

        /// <summary>One region's plants: the grass of the strips, the flowers of the drifts and the bushes, with weights.</summary>
        public sealed class Palette
        {
            public string Name;
            public VergeKind Mown = VergeKind.Mown, Tall = VergeKind.TallGrass;
            /// <summary>Outer edge of the tall-grass band (m beyond the shoulder edge); fades out over 2 m beyond it.</summary>
            public float TallBand = 6f;
            /// <summary>Share of the lattice points with grass on them; share of the tall band in flower drifts.</summary>
            public float GrassDensity = 0.95f, FlowerShare = 0.4f;
            public (VergeKind kind, float weight)[] Flowers, Shrubs;
            public float ShrubDensity = 0.3f, ShrubScale = 1f;
            public Color GrassTint = Color.white;
        }

        /// <summary>
        /// The palettes, one per <see cref="VergeRegion"/> (plan 2026-11-22, "Regional look across Norway"). Lupins are
        /// weighted further by the road (<see cref="LupinWeight"/>); bogs swap the flowers for cotton grass and meadowsweet.
        /// </summary>
        public static readonly Palette[] Palettes =
        {
            new Palette { Name = "lowland south and east (BN)", FlowerShare = 0.6f, ShrubDensity = 0.3f,
                Flowers = new[] { (VergeKind.CowParsley, 3f), (VergeKind.Lupin, 2f), (VergeKind.LupinPink, 1f), (VergeKind.Cranesbill, 1.5f), (VergeKind.Vetch, 1.5f),
                    (VergeKind.RedClover, 1.5f), (VergeKind.Yarrow, 1.5f), (VergeKind.OxeyeDaisy, 1.5f), (VergeKind.Buttercup, 1f), (VergeKind.Fireweed, 0.7f), (VergeKind.Meadowsweet, 0.5f) },
                Shrubs = new[] { (VergeKind.DogRose, 2f), (VergeKind.Raspberry, 2f), (VergeKind.Hazel, 2f), (VergeKind.Rowan, 1f), (VergeKind.GreyAlder, 1.5f), (VergeKind.BirchSapling, 1f) } },
            new Palette { Name = "inland valleys and Trøndelag (SB, MB)", FlowerShare = 0.6f, ShrubDensity = 0.32f,
                Flowers = new[] { (VergeKind.Lupin, 3f), (VergeKind.LupinPink, 1.5f), (VergeKind.Fireweed, 2.5f), (VergeKind.CowParsley, 1.5f), (VergeKind.Buttercup, 2f),
                    (VergeKind.RedClover, 1f), (VergeKind.Harebell, 1f), (VergeKind.Yarrow, 1.5f), (VergeKind.RedCampion, 1f) },
                Shrubs = new[] { (VergeKind.GreyAlder, 2f), (VergeKind.Willow, 2f), (VergeKind.BirchSapling, 2f), (VergeKind.Rowan, 1f), (VergeKind.Juniper, 1.5f), (VergeKind.Raspberry, 1.5f) } },
            new Palette { Name = "north boreal and the north (NB, north of 65.5° N)", FlowerShare = 0.55f, ShrubDensity = 0.35f, GrassTint = new Color(0.95f, 1.02f, 0.95f),
                Flowers = new[] { (VergeKind.Fireweed, 3f), (VergeKind.Lupin, 1.5f), (VergeKind.GlobeFlower, 2f), (VergeKind.Cranesbill, 2f), (VergeKind.Wolfsbane, 2f),
                    (VergeKind.Meadowsweet, 1.5f), (VergeKind.Buttercup, 1f) },
                Shrubs = new[] { (VergeKind.BirchSapling, 3f), (VergeKind.Willow, 3f), (VergeKind.Juniper, 1.5f), (VergeKind.DwarfBirch, 1f) } },
            new Palette { Name = "oceanic west (O3, O2)", FlowerShare = 0.55f, ShrubDensity = 0.3f, GrassTint = new Color(0.9f, 1.02f, 0.88f),
                Flowers = new[] { (VergeKind.Foxglove, 2.5f), (VergeKind.Bracken, 3f), (VergeKind.Heather, 2f), (VergeKind.LadysMantle, 1.5f), (VergeKind.RedCampion, 1.5f),
                    (VergeKind.Buttercup, 1f), (VergeKind.Lupin, 0.5f), (VergeKind.Fireweed, 1f) },
                Shrubs = new[] { (VergeKind.Juniper, 2f), (VergeKind.Willow, 2f), (VergeKind.Rowan, 2f), (VergeKind.BogMyrtle, 1.5f), (VergeKind.BirchSapling, 1f) } },
            new Palette { Name = "continental east (C1)", Tall = VergeKind.DryGrass, TallBand = 3.5f, GrassDensity = 0.6f, FlowerShare = 0.3f, ShrubDensity = 0.18f,
                GrassTint = new Color(1.12f, 1.04f, 0.8f),
                Flowers = new[] { (VergeKind.Harebell, 2f), (VergeKind.Yarrow, 1.5f), (VergeKind.Fireweed, 0.6f), (VergeKind.Buttercup, 0.5f) },
                Shrubs = new[] { (VergeKind.Juniper, 4f), (VergeKind.BirchSapling, 0.5f) } },
            new Palette { Name = "low alpine (LA)", Mown = VergeKind.AlpineTuft, Tall = VergeKind.AlpineTuft, TallBand = 4f, GrassDensity = 0.7f, FlowerShare = 0.5f,
                ShrubDensity = 0.3f, ShrubScale = 0.8f, GrassTint = new Color(1.05f, 0.98f, 0.85f),
                Flowers = new[] { (VergeKind.Heather, 3f), (VergeKind.Crowberry, 3f), (VergeKind.Bistort, 1f), (VergeKind.GlobeFlower, 0.5f) },
                Shrubs = new[] { (VergeKind.DwarfBirch, 4f), (VergeKind.Willow, 1.5f), (VergeKind.Juniper, 0.5f) } },
            new Palette { Name = "middle and high alpine (MA, HA)", Mown = VergeKind.AlpineTuft, Tall = VergeKind.AlpineTuft, TallBand = 3f, GrassDensity = 0.35f,
                FlowerShare = 0.15f, ShrubDensity = 0f, GrassTint = new Color(1.0f, 0.95f, 0.85f),
                Flowers = new[] { (VergeKind.Crowberry, 1f), (VergeKind.Bistort, 0.5f) }, Shrubs = new (VergeKind, float)[0] },
        };

        /// <summary>The wet-ground plants that replace a palette's flowers on a bog.</summary>
        static readonly (VergeKind kind, float weight)[] BogFlowers = { (VergeKind.CottonGrass, 3f), (VergeKind.Meadowsweet, 1f) };
        static readonly (VergeKind kind, float weight)[] BogShrubs = { (VergeKind.DwarfBirch, 3f), (VergeKind.Willow, 1f), (VergeKind.BogMyrtle, 0.5f) };

        /// <summary>
        /// The region of a place: the bioclimatic zone (corrected by the local height against the tree line — the zone grid has
        /// 1 km cells — and estimated from the height where the grid has none) and section. Alpine zones first, then the
        /// continental section, the strongly / clearly oceanic coast, the north, the boreonemoral lowland, the rest boreal.
        /// </summary>
        public static VergeRegion RegionFor(BioZone zone, BioSection section, float height, float treeLine, double northing)
        {
            if (zone == BioZone.None) zone = northing > NorthN ? BioZone.NB : BioZone.MB;
            if (height > treeLine + 300f && zone < BioZone.MA) zone = BioZone.MA;
            else if (height > treeLine && zone < BioZone.LA) zone = BioZone.LA;
            else if (height < treeLine - 300f && zone >= BioZone.LA) zone = BioZone.NB;
            if (zone >= BioZone.MA) return VergeRegion.HighAlpine;
            if (zone == BioZone.LA) return VergeRegion.LowAlpine;
            if (section == BioSection.C1) return VergeRegion.Continental;
            if (section == BioSection.O3 || (section == BioSection.O2 && zone <= BioZone.MB)) return VergeRegion.Oceanic;
            if (zone == BioZone.NB || northing > NorthN) return VergeRegion.North;
            if (zone == BioZone.BN) return VergeRegion.SouthLowland;
            return VergeRegion.Boreal;
        }

        /// <summary>Lupins line the main roads (and the E6 in the north) and stay off the minor ones in the north and up high.</summary>
        public static float LupinWeight(in VergeSite s)
        {
            if (s.Height > LupinMaxHeight) return 0f;
            if (s.MainRoad) return 2f;
            return s.Region == VergeRegion.North ? 0f : 0.5f;
        }

        // ---- noise and hashes ------------------------------------------------------------------------------------

        public static float Rand(int2 cell, uint salt) => ScatterJob.Hash3(new uint3((uint)cell.x, (uint)cell.y, salt)) * (1f / 4294967296f);

        /// <summary>UTM metres to the noise domain (wrapped every <see cref="NoisePeriod"/> m). The terrain shader's twin adds _VergeOrigin.</summary>
        public static float2 NoiseCoord(double e, double n)
            => new float2((float)(e - math.floor(e / NoisePeriod) * NoisePeriod), (float)(n - math.floor(n / NoisePeriod) * NoisePeriod));

        static float Hash12(float2 p)
        {
            float3 p3 = math.frac(new float3(p.x, p.y, p.x) * 0.1031f);
            p3 += math.dot(p3, p3.yzx + 33.33f);
            return math.frac((p3.x + p3.y) * p3.z);
        }

        /// <summary>Value noise with <paramref name="cell"/> m cells, periodic over <see cref="NoisePeriod"/> (TerrainClipmap VergeNoise).</summary>
        public static float VNoise(float2 q, float cell)
        {
            float period = (float)NoisePeriod / cell;
            float2 x = q / cell, c = math.floor(x), f = x - c, u = f * f * (3f - 2f * f);
            float2 c1 = c + 1f;
            c1 = c1 - math.floor(c1 / period) * period;
            float a = Hash12(c), b = Hash12(new float2(c1.x, c.y)), d = Hash12(new float2(c.x, c1.y)), e = Hash12(c1);
            return math.lerp(math.lerp(a, b, u.x), math.lerp(d, e, u.x), u.y);
        }

        /// <summary>Flower drifts: 0..1, a patch where it is over 1 − the palette's flower share (TerrainClipmap VergeDrift).</summary>
        public static float Drift(float2 q) => 0.7f * VNoise(q, 16f) + 0.3f * VNoise(q, 4f);

        /// <summary>0..1, constant over irregular ~24 m patches: which flower a drift is (one or two kinds per patch).</summary>
        public static float PatchPick(float2 q)
        {
            float2 w = new float2(VNoise(q, 16f), VNoise(q + 97.3f, 16f)) - 0.5f;
            return Hash12(math.floor(q / 24f + w * 1.2f) + 0.5f);
        }

        static VergeKind Pick((VergeKind kind, float weight)[] list, float r, in VergeSite s)
        {
            float sum = 0;
            foreach (var (k, w) in list) sum += Weight(k, w, s);
            if (sum <= 0) return list.Length > 0 ? list[0].kind : VergeKind.TallGrass;
            float x = r * sum;
            foreach (var (k, w) in list) { x -= Weight(k, w, s); if (x < 0) return k; }
            return list[list.Length - 1].kind;
        }

        static float Weight(VergeKind k, float w, in VergeSite s)
        {
            if (k == VergeKind.Lupin || k == VergeKind.LupinPink) w *= LupinWeight(s);
            if (k == VergeKind.Juniper && (s.Species == LandcoverSplat.SpeciesPine || s.Cls == LandcoverSplat.Scrub)) w *= 2.5f;
            if (k == VergeKind.Heather && s.Cls == LandcoverSplat.Scrub) w *= 2f;
            return w;
        }

        static bool Bare(in VergeSite s)
            => s.Cls == LandcoverSplat.Water || s.Height < 0.6f || s.Slope > MaxSlope || s.Edge < EdgeGap;

        static bool Built(in VergeSite s) => s.Cls == LandcoverSplat.Built || s.Cls == LandcoverSplat.Residential;
        static bool Forest(in VergeSite s) => s.Cls == LandcoverSplat.Forest || s.Crown > 0.35f;

        /// <summary>
        /// The herb clump at a lattice point (<paramref name="lattice"/> = global index, <paramref name="q"/> = its noise
        /// coordinate), or false for bare ground: the mown strip, then the tall grass band with its flower drifts.
        /// </summary>
        public static bool Herb(in VergeSite s, int2 lattice, float2 q, out VergeKind kind, out float scale, out Color tint)
        {
            kind = VergeKind.Mown; scale = 1f; tint = Color.white;
            if (Bare(s)) return false;
            var pal = Palettes[(int)s.Region];
            bool built = Built(s), rock = s.Cls == LandcoverSplat.Rock;
            float density = rock ? pal.GrassDensity * 0.3f : pal.GrassDensity;
            float mown = built ? 6f : MownBand;
            float tall = built ? 0f : Forest(s) ? math.min(pal.TallBand, 3f) : pal.TallBand;
            float r = Rand(lattice, 11);
            float size = 0.8f + 0.4f * Rand(lattice, 12);
            float shade = 0.9f + 0.2f * Rand(lattice, 13);
            tint = pal.GrassTint * shade;
            if (s.Edge < mown)
            {
                if (r > density) return false;
                kind = pal.Mown; scale = size;
                return true;
            }
            if (s.Edge >= tall + 2f) return false;
            float fade = s.Edge < tall ? 1f : (tall + 2f - s.Edge) / 2f;
            if (r > density * fade) return false;
            float share = s.Snow || rock ? 0f : pal.FlowerShare * (Forest(s) ? 0.6f : 1f);
            bool bog = s.Cls == LandcoverSplat.Wetland;
            if (share > 0 && Drift(q) > 1f - share && Rand(lattice, 14) < 0.95f)
            {
                kind = Pick(bog && s.Region < VergeRegion.LowAlpine ? BogFlowers : pal.Flowers, PatchPick(q), s);
                if (kind == VergeKind.Lupin && Rand(lattice, 15) < 0.3f) kind = VergeKind.LupinPink;   // mixed stands
                scale = size * 1.25f;   // flowers stand out of the grass, and a drift must read from the chase camera
                tint = new Color(shade, shade, shade);
                return true;
            }
            kind = pal.Tall; scale = size * (0.7f + 0.3f * fade);
            if (bog && s.Region < VergeRegion.LowAlpine && Rand(lattice, 16) < 0.25f) kind = VergeKind.CottonGrass;
            return true;
        }

        /// <summary>
        /// The bush at a bush lattice point, or false: 3–12 m out, in thickets (patch noise at <paramref name="q"/>), density by
        /// palette and land cover (forest edge dense, open land less, fields few), none on built-up land or rock.
        /// </summary>
        public static bool Shrub(in VergeSite s, int2 lattice, float2 q, out VergeKind kind, out float scale, out Color tint)
        {
            kind = VergeKind.Willow; scale = 1f; tint = Color.white;
            if (Bare(s) || s.Edge < ShrubFrom || s.Edge > ShrubTo || Built(s) || s.Cls == LandcoverSplat.Rock) return false;
            var pal = Palettes[(int)s.Region];
            bool bog = s.Cls == LandcoverSplat.Wetland;
            float land = Forest(s) ? 1.6f : s.Cls == LandcoverSplat.Field || s.Cls == LandcoverSplat.Pasture ? 0.15f : s.Cls == LandcoverSplat.Scrub ? 1.4f : bog ? 0.8f : 0.6f;
            float ramp = math.saturate((s.Edge - ShrubFrom) / 2f + 0.3f);
            // Thickets and gaps, not an orchard: bushes only where the patch noise is high, denser there.
            float patch = math.saturate((VNoise(q + 311.7f, 24f) - 0.45f) * 4f);
            if (pal.ShrubDensity <= 0 || Rand(lattice, 21) > pal.ShrubDensity * land * ramp * patch * 1.6f) return false;
            kind = Pick(bog && s.Region < VergeRegion.HighAlpine ? BogShrubs : pal.Shrubs, Rand(lattice, 22), s);
            scale = pal.ShrubScale * (0.7f + 0.6f * Rand(lattice, 23));
            float shade = 0.88f + 0.24f * Rand(lattice, 24);
            tint = new Color(shade, shade, shade);
            return true;
        }
    }
}
