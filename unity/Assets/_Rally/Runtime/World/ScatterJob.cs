using System.Runtime.InteropServices;
using Unity.Burst;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    /// <summary>One tree. Same layout as Scatter.compute's TreeInstance (32 bytes).</summary>
    [StructLayout(LayoutKind.Sequential)]
    public struct TreeInstance
    {
        public float3 Pos;      // tile-local (x east, y height, z north)
        public float Scale;
        public float Yaw;
        public uint Species;    // VegetationSetSO prototype index
        public float Tint;
        public float Snow;
        public const int Stride = 32;
    }

    /// <summary>
    /// CPU twin of Scatter.compute's ScatterTile kernel for WebGL 2 (no compute): one job index per
    /// land-cover cell row, same hash and the same rules, so a tile's trees are the same on every path.
    /// Appends with a single counter through <see cref="Count"/> (NativeReference, atomic add via Interlocked
    /// is unavailable in Burst for references, so the job runs rows sequentially: IJobFor with no parallel
    /// schedule — 128 rows × 8 trees is cheap).
    /// </summary>
    [BurstCompile]
    public struct ScatterJob : IJob
    {
        public const float TreesPerCell = 4.5f;   // stream.js TREES_PER_CELL (also LandcoverSplat.Budget)
        public const int MaxPerCell = 8;

        public int Res, N, Capacity;
        public float CellM, CoverCell, Density, TreeLine, SnowLine, Scale;
        public uint Seed;
        [ReadOnly] public NativeArray<Color32> Cover;
        [ReadOnly] public NativeArray<float> Heights;
        [ReadOnly] public NativeArray<byte> Mask;
        public NativeArray<TreeInstance> Out;
        public NativeArray<int> Count;   // length 1

        public static uint Hash3(uint3 v)
        {
            v = v * 1664525u + 1013904223u;
            v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
            v ^= v >> 16;
            v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
            return v.x;
        }
        float Rand(uint i, uint j, uint k) => Hash3(new uint3(i, j, k ^ Seed)) * (1f / 4294967296f);

        float HeightAt(float2 local)
        {
            float fx = math.clamp(local.x / CellM, 0, N - 1.0001f), fy = math.clamp(local.y / CellM, 0, N - 1.0001f);
            int c = (int)fx, r = (int)fy;
            float tx = fx - c, ty = fy - r;
            return math.lerp(math.lerp(Heights[r * N + c], Heights[r * N + c + 1], tx), math.lerp(Heights[(r + 1) * N + c], Heights[(r + 1) * N + c + 1], tx), ty);
        }
        float MaskAt(float2 local)
        {
            int c = math.clamp((int)(local.x / CellM + 0.5f), 0, N - 1), r = math.clamp((int)(local.y / CellM + 0.5f), 0, N - 1);
            return Mask[r * N + c] / 255f;
        }

        /// <summary>
        /// The species / skip rules of one tree, shared by both paths (Scatter.compute has the same lines):
        /// trees only where the cover texture has crown (LandcoverSplat), never on fields, meadows, water, built-up
        /// land or bare rock; bogs carry stunted pines, heath shrubs and a few mountain birches; mixed stands swap
        /// 12 % between conifers and birch (stream.js); toward the tree line conifers give way to mountain birch,
        /// above it only shrubs in a 150 m band. Returns the prototype, or −1 to skip; <paramref name="scaleMul"/> shrinks bog pines.
        /// </summary>
        public static int Prototype(uint species, uint cls, float h, float r, float treeLine, out float scaleMul)
        {
            scaleMul = 1f;
            if (cls == 2 || cls == 3 || cls == 4 || cls == 6 || cls == 7) return -1;
            if (h > treeLine + 150) return -1;
            int proto = species == 2 ? 1 : species == 3 ? 2 : 0;
            if (cls == 5) { scaleMul = 0.55f; proto = 1; }                       // bog pine
            else if (cls == 8) proto = r < 0.75f ? 4 : 3;                         // heath / scrub
            else if (r < 0.12f) proto = proto == 2 ? 0 : 2;                       // mixed stands
            float birchBias = math.saturate((h - (treeLine - 300)) / 300);
            if (proto <= 1 && r < birchBias * 0.7f) proto = 3;                    // conifers give way to mountain birch
            if (proto == 2 && birchBias > 0.5f) proto = 3;
            if (h > treeLine) { if (r > 0.35f) return -1; proto = 4; }            // sparse shrubs above the tree line
            return proto;
        }

        public void Execute()
        {
            int count = 0;
            for (int j = 0; j < Res && count < Capacity; j++)
                for (int i = 0; i < Res && count < Capacity; i++)
                {
                    var cover = Cover[j * Res + i];
                    uint species = (uint)math.round(cover.r / 64f);
                    float crown = cover.g / 255f;
                    uint cls = (uint)math.round(cover.b / (float)LandcoverSplat.ClassStep);
                    if (crown <= 0) continue;
                    float expected = crown * TreesPerCell * Density * (cover.a / 255f);   // LandcoverSplat.Budget
                    uint n = math.min((uint)math.floor(expected + Rand((uint)i, (uint)j, 0)), (uint)MaxPerCell);
                    for (uint k = 0; k < n && count < Capacity; k++)
                    {
                        float2 local = (new float2(i, j) + new float2(Rand((uint)i, (uint)j, 1 + k * 4), Rand((uint)i, (uint)j, 2 + k * 4))) * CoverCell;
                        float h = HeightAt(local);
                        if (h < 1.5f) continue;
                        float hx = HeightAt(local + new float2(2, 0)) - HeightAt(local - new float2(2, 0));
                        float hz = HeightAt(local + new float2(0, 2)) - HeightAt(local - new float2(0, 2));
                        if (math.length(new float2(hx, hz)) / 4f > 0.62f) continue;
                        if (MaskAt(local) > 0.25f) continue;
                        float r = Rand((uint)i, (uint)j, 3 + k * 4);
                        int proto = Prototype(species, cls, h, r, TreeLine, out float scaleMul);
                        if (proto < 0) continue;
                        float scale = (0.75f + Rand((uint)i, (uint)j, 4 + k * 4) * 0.45f) * (0.85f + crown * 0.25f) * scaleMul * Scale;
                        Out[count++] = new TreeInstance
                        {
                            Pos = new float3(local.x, h, local.y), Scale = scale, Yaw = Rand((uint)i, (uint)j, 5 + k * 4) * 6.2831853f,
                            Species = (uint)proto, Tint = Rand((uint)i, (uint)j, 6 + k * 4), Snow = math.saturate((h - SnowLine + 150) / 150),
                        };
                    }
                }
            Count[0] = count;
        }
    }
}
