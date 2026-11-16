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
        public const float TreesPerCell = 4.5f;   // stream.js TREES_PER_CELL
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

        public void Execute()
        {
            int count = 0;
            for (int j = 0; j < Res && count < Capacity; j++)
                for (int i = 0; i < Res && count < Capacity; i++)
                {
                    var cover = Cover[j * Res + i];
                    uint species = (uint)math.round(cover.r / 64f);
                    float crown = cover.g / 255f;
                    uint cls = (uint)math.round(cover.b / 28f);
                    if (cls == 4 || cls == 6 || cls == 2) continue;
                    if (species == 0 && crown <= 0) continue;
                    float expected = crown * TreesPerCell * Density;
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
                        if (h > TreeLine + 150) continue;
                        uint proto = species == 2 ? 1u : species == 3 ? 2u : 0u;
                        float r = Rand((uint)i, (uint)j, 3 + k * 4);
                        float birchBias = math.saturate((h - (TreeLine - 300)) / 300);
                        if (r < 0.12f) proto = proto == 2 ? 0u : 2u;
                        if (r < birchBias * 0.7f) proto = 3;
                        if (h > TreeLine) { proto = 4; if (r > 0.35f) continue; }
                        float scale = (0.8f + Rand((uint)i, (uint)j, 4 + k * 4) * 0.5f) * (0.75f + crown * 0.35f) * Scale;
                        Out[count++] = new TreeInstance
                        {
                            Pos = new float3(local.x, h, local.y), Scale = scale, Yaw = Rand((uint)i, (uint)j, 5 + k * 4) * 6.2831853f,
                            Species = proto, Tint = Rand((uint)i, (uint)j, 6 + k * 4), Snow = math.saturate((h - SnowLine + 150) / 150),
                        };
                    }
                }
            Count[0] = count;
        }
    }
}
