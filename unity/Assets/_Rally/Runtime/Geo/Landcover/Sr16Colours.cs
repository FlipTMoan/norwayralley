using System;

namespace Rally.Geo
{
    /// <summary>
    /// landcover.js: NIBIO's SR16 WMS paints the <c>SRRTRESLAG</c> layer in three flat colours (spruce,
    /// pine, deciduous) and <c>SRRKRONEDEK</c> crown cover on a ten-step green ramp, so the tiles are
    /// read back pixel by pixel and classified by colour.
    /// </summary>
    public static class Sr16Colours
    {
        static readonly (int r, int g, int b, Species sp)[] SpeciesSwatches =
        {
            (0x52, 0xb0, 0x38, Species.Spruce),
            (0xcd, 0xaa, 0x65, Species.Pine),
            (0xff, 0xdc, 0x82, Species.Deciduous),
        };

        static readonly (int r, int g, int b)[] DensityRamp =
        {
            (0xf7, 0xfc, 0xf5), (0xe5, 0xf5, 0xe0), (0xc7, 0xe9, 0xc0), (0xa1, 0xd9, 0x9b), (0x74, 0xc4, 0x76),
            (0x41, 0xab, 0x5d), (0x23, 0x8b, 0x45), (0x00, 0x6d, 0x2c), (0x00, 0x44, 0x1b), (0x00, 0x28, 0x0f),
        };

        /// <summary>landcover.js <c>classifySpecies</c>: nearest swatch within a tolerance for anti-aliased edge pixels.</summary>
        public static Species ClassifySpecies(int r, int g, int b, int a)
        {
            if (a < 64) return Species.None;
            var best = Species.None;
            int bestD = 90;
            foreach (var s in SpeciesSwatches)
            {
                int d = Math.Abs(r - s.r) + Math.Abs(g - s.g) + Math.Abs(b - s.b);
                if (d < bestD) { bestD = d; best = s.sp; }
            }
            return best;
        }

        /// <summary>landcover.js <c>classifyDensity</c>: ramp step → (i + 0.5) / 10, or 0 when no step is close.</summary>
        public static float ClassifyDensity(int r, int g, int b, int a)
        {
            if (a < 64) return 0;
            int best = -1, bestD = int.MaxValue;
            for (int i = 0; i < DensityRamp.Length; i++)
            {
                var s = DensityRamp[i];
                int d = Math.Abs(r - s.r) + Math.Abs(g - s.g) + Math.Abs(b - s.b);
                if (d < bestD) { bestD = d; best = i; }
            }
            return bestD > 120 ? 0 : (best + 0.5f) / DensityRamp.Length;
        }
    }
}
