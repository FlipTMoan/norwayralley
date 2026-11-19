using Unity.Burst;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// CPU twin of Scatter.compute's Cull kernel for the WebGL 2 path: for every tree of the visible tiles, range +
    /// LOD by distance, a frustum test of its box, and the instance matrix written into its (species, LOD) bucket.
    /// Pure math (no engine calls per tree), so it is Burst-compiled where Burst runs and plain IL2CPP on the web;
    /// VegetationRenderer used to do this loop with GeometryUtility.TestPlanesAABB and Matrix4x4.TRS per tree.
    /// </summary>
    [BurstCompile]
    public struct TreeCullJob : IJob
    {
        public int Capacity, MaxVisible, Lods, TileCount;
        public float3 CamPos;
        [ReadOnly] public NativeArray<TreeInstance> Instances;   // slots × Capacity
        [ReadOnly] public NativeArray<int> Counts;               // per slot
        [ReadOnly] public NativeArray<float4> Origins;           // per slot: world xz of the tile origin
        [ReadOnly] public NativeArray<int> Tiles;                // the slots to visit (TileCount of them)
        [ReadOnly] public NativeArray<float4> Planes;            // 6 frustum planes, xyz normal (inward), w distance
        [ReadOnly] public NativeArray<float4> ProtoLod;          // per species: LOD 0/1/2 ends, draw distance
        public NativeArray<int> BucketCounts;
        public NativeArray<Matrix4x4> Matrices;                  // buckets × MaxVisible

        public void Execute()
        {
            for (int b = 0; b < BucketCounts.Length; b++) BucketCounts[b] = 0;
            for (int ti = 0; ti < TileCount; ti++)
            {
                int s = Tiles[ti];
                float2 o = Origins[s].xy;
                int baseIdx = s * Capacity, n = Counts[s];
                for (int k = 0; k < n; k++)
                {
                    var t = Instances[baseIdx + k];
                    var world = new float3(t.Pos.x + o.x, t.Pos.y, t.Pos.z + o.y);
                    float d2 = math.distancesq(world, CamPos);
                    var ld = ProtoLod[(int)t.Species];
                    if (d2 > ld.w * ld.w) continue;
                    int lod = d2 < ld.x * ld.x ? 0 : d2 < ld.y * ld.y ? 1 : d2 < ld.z * ld.z ? 2 : 3;
                    int b = (int)t.Species * Lods + lod;
                    if (BucketCounts[b] >= MaxVisible) continue;
                    if (!InFrustum(world + new float3(0, 11 * t.Scale, 0), new float3(8, 12, 8) * t.Scale)) continue;
                    Matrices[b * MaxVisible + BucketCounts[b]++] = float4x4.TRS(world, quaternion.RotateY(t.Yaw), new float3(t.Scale));
                }
            }
        }

        /// <summary>Box (centre, half extents) against the six planes: outside when fully behind any one.</summary>
        public bool InFrustum(float3 c, float3 e)
        {
            for (int p = 0; p < 6; p++)
            {
                var pl = Planes[p];
                if (math.dot(pl.xyz, c) + pl.w + math.dot(math.abs(pl.xyz), e) < 0) return false;
            }
            return true;
        }
    }
}
