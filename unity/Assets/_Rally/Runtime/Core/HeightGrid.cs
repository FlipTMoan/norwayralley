using System;
using Unity.Collections;
using Unity.Mathematics;

namespace Rally.Core
{
    /// <summary>
    /// A square grid of heights (metres above sea level) covering a <see cref="Bounds25833"/>,
    /// row-major from the south-west corner (index = row * N + col, row = north step, col = east step).
    /// This is the one ground truth: the GPU terrain samples a texture built from exactly this array,
    /// and the car samples this array, so tyres sit on the drawn ground. Carving writes here (CPU copy
    /// kept in sync with the GPU carve via readback, see World/TerrainTile).
    /// </summary>
    public sealed class HeightGrid : IDisposable
    {
        public readonly int N;            // samples per side (e.g. 257)
        public readonly float CellM;      // metres per cell
        public readonly Utm33 Origin;     // south-west corner
        public NativeArray<float> Heights;
        public uint Version;              // bumped on every carve so GPU uploads know to refresh

        public HeightGrid(int n, float cellM, Utm33 origin, Allocator alloc = Allocator.Persistent)
        {
            N = n; CellM = cellM; Origin = origin;
            Heights = new NativeArray<float>(n * n, alloc, NativeArrayOptions.UninitializedMemory);
        }

        public float SizeM => (N - 1) * CellM;
        public Bounds25833 Bounds => new Bounds25833(Origin.E, Origin.N, Origin.E + SizeM, Origin.N + SizeM);

        public float this[int col, int row]
        {
            get => Heights[row * N + col];
            set => Heights[row * N + col] = value;
        }

        /// <summary>Bilinear height at a planar point; clamps to the grid edge.</summary>
        public float Sample(Utm33 p)
        {
            double fx = (p.E - Origin.E) / CellM, fy = (p.N - Origin.N) / CellM;
            return SampleCells((float)fx, (float)fy);
        }

        public float SampleCells(float fx, float fy)
        {
            fx = math.clamp(fx, 0, N - 1.0001f); fy = math.clamp(fy, 0, N - 1.0001f);
            int c = (int)fx, r = (int)fy;
            float tx = fx - c, ty = fy - r;
            float h00 = Heights[r * N + c], h10 = Heights[r * N + c + 1];
            float h01 = Heights[(r + 1) * N + c], h11 = Heights[(r + 1) * N + c + 1];
            return math.lerp(math.lerp(h00, h10, tx), math.lerp(h01, h11, tx), ty);
        }

        public void Dispose() { if (Heights.IsCreated) Heights.Dispose(); }
    }
}
