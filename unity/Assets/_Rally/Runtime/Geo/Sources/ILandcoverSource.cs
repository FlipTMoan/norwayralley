using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    public enum Species : byte { None = 0, Spruce = 1, Pine = 2, Deciduous = 3 }

    /// <summary>
    /// Forest species and crown cover on a coarse cell grid over a bounds (SR16 is a 16 m raster).
    /// Row-major from the south-west corner like <see cref="HeightGrid"/>: index = row * Width + col.
    /// Crown is 0..255 (= density 0..1 × 255; 0 means "no reading").
    /// </summary>
    public sealed class CoverRaster
    {
        public readonly int Width, Height;
        public readonly Bounds25833 Bounds;
        /// <summary>One <see cref="Geo.Species"/> code per cell.</summary>
        public readonly byte[] Trees;
        public readonly byte[] Crown;

        public CoverRaster(int width, int height, Bounds25833 bounds)
        {
            Width = width; Height = height; Bounds = bounds;
            Trees = new byte[width * height];
            Crown = new byte[width * height];
        }

        public double CellE => Bounds.Width / Width;
        public double CellN => Bounds.Height / Height;

        public int IndexOf(Utm33 p)
        {
            int c = (int)((p.E - Bounds.MinE) / CellE), r = (int)((p.N - Bounds.MinN) / CellN);
            if (c < 0 || r < 0 || c >= Width || r >= Height) return -1;
            return r * Width + c;
        }

        public Species SpeciesAt(Utm33 p) { int k = IndexOf(p); return k < 0 ? Species.None : (Species)Trees[k]; }
        public float DensityAt(Utm33 p) { int k = IndexOf(p); return k < 0 ? 0f : Crown[k] / 255f; }
    }

    public interface ILandcoverSource
    {
        Task<CoverRaster> FetchCover(Bounds25833 bounds, CancellationToken ct);
    }
}
