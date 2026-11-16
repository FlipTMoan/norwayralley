using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>Progress 0..1 plus a short status line, as worldgen.js <c>onProgress(p, text)</c>.</summary>
    public delegate void ProgressCallback(float fraction, string text);

    /// <summary>
    /// Elevation for a square of the world. The grid returned has
    /// <c>N = round(bounds.Width / cellM) + 1</c> samples per side so that <see cref="HeightGrid.Bounds"/>
    /// equals the requested bounds; row 0 is the south edge (Core convention), unlike the JS
    /// Float32Array whose row 0 is north.
    /// </summary>
    public interface IDemSource
    {
        Task<HeightGrid> Fetch(Bounds25833 bounds, float cellM, CancellationToken ct, ProgressCallback progress = null);
    }
}
