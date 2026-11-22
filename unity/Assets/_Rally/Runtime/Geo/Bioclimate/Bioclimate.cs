using Rally.Core;
using UnityEngine;

namespace Rally.Geo
{
    /// <summary>Bioclimatic zone (temperature and height, NiN / Moen): boreonemoral … high alpine. None = not mapped.</summary>
    public enum BioZone : byte { None, BN, SB, MB, NB, LA, MA, HA }

    /// <summary>Bioclimatic section (precipitation): strongly / clearly / weakly oceanic, transition, weakly continental.</summary>
    public enum BioSection : byte { None, O3, O2, O1, OC, C1 }

    /// <summary>
    /// The zone and section of a place in mainland Norway, from Artsdatabanken's "Bioklimatiske soner og seksjoner" (test
    /// version 2026, published by Miljødirektoratet, NLOD 2.0) baked by <c>unity/Tools/bake_bioclimate.py</c> into
    /// <c>Resources/bioclimate.bytes</c>: a 1 km grid in EPSG:25833 from (<see cref="X0"/>, <see cref="Y0"/>), rows south to
    /// north, one byte per cell = zone | section &lt;&lt; 4. The zones were drawn from temperature at 50 m, so a 1 km cell
    /// averages a valley and its slopes: the verge rules correct the zone by the local height against the tree line.
    /// Outside the grid, at sea and in Sweden both are None (the rules then estimate from the height).
    /// </summary>
    public static class Bioclimate
    {
        public const string Attribution = "Bioclimatic zones and sections: Artsdatabanken / Miljødirektoratet (NLOD 2.0)";
        public const double X0 = -80000, Y0 = 6440000, Cell = 1000;
        public const int Width = 1200, Height = 1504;

        static byte[] data;
        static bool tried;

        /// <summary>The grid, loaded once from Resources (null when the asset is missing, e.g. in a bare test project).</summary>
        public static byte[] Data
        {
            get
            {
                if (tried) return data;
                tried = true;
                var asset = Resources.Load<TextAsset>("bioclimate");
                if (asset != null && asset.bytes.Length == Width * Height) data = asset.bytes;
                if (asset != null) Resources.UnloadAsset(asset);
                return data;
            }
        }

        /// <summary>Zone and section of the 1 km cell holding <paramref name="p"/>.</summary>
        public static void At(Utm33 p, out BioZone zone, out BioSection section) => At(Data, p, out zone, out section);

        public static void At(byte[] grid, Utm33 p, out BioZone zone, out BioSection section)
        {
            zone = BioZone.None; section = BioSection.None;
            if (grid == null) return;
            int c = (int)System.Math.Floor((p.E - X0) / Cell), r = (int)System.Math.Floor((p.N - Y0) / Cell);
            if (c < 0 || r < 0 || c >= Width || r >= Height) return;
            byte b = grid[r * Width + c];
            zone = (BioZone)(b & 15);
            section = (BioSection)(b >> 4);
            if (zone > BioZone.HA) zone = BioZone.None;
            if (section > BioSection.C1) section = BioSection.None;
        }
    }
}
