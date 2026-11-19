using NUnit.Framework;
using Rally.World;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;
using UnityEngine;
using TreeInstance = Rally.World.TreeInstance;

namespace Rally.Tests.World
{
    public class TreeCullJobTests
    {
        [Test]
        public void BinsByLodAndDropsTreesOutOfViewOrRange()
        {
            const int cap = 8, lods = 4, maxVisible = 4, species = 1;
            var inst = new NativeArray<TreeInstance>(cap, Allocator.TempJob);
            var counts = new NativeArray<int>(1, Allocator.TempJob);
            var origins = new NativeArray<float4>(1, Allocator.TempJob);
            var tiles = new NativeArray<int>(1, Allocator.TempJob);
            var planes = new NativeArray<float4>(6, Allocator.TempJob);
            var lod = new NativeArray<float4>(species, Allocator.TempJob);
            var bucketCounts = new NativeArray<int>(species * lods, Allocator.TempJob);
            var matrices = new NativeArray<Matrix4x4>(species * lods * maxVisible, Allocator.TempJob);
            // Tile origin (100, 0): trees at local z 10 (LOD 0), 60 (LOD 1), 150 (LOD 2), 400 (impostor), 2000 (out of range), z −50 (behind).
            float[] z = { 10, 60, 150, 400, 2000, -50 };
            for (int i = 0; i < z.Length; i++) inst[i] = new TreeInstance { Pos = new float3(-100, 0, z[i]), Scale = 1, Yaw = 0.5f };
            counts[0] = z.Length; origins[0] = new float4(100, 0, 0, 0); tiles[0] = 0;
            lod[0] = new float4(40, 100, 300, 900);
            // A wide frustum looking along +z from the origin: only the near plane z > 0 matters.
            planes[0] = new float4(0, 0, 1, 0);
            for (int p = 1; p < 6; p++) planes[p] = new float4(0, 1, 0, 1e5f);
            var job = new TreeCullJob
            {
                Capacity = cap, MaxVisible = maxVisible, Lods = lods, TileCount = 1, CamPos = float3.zero,
                Instances = inst, Counts = counts, Origins = origins, Tiles = tiles, Planes = planes, ProtoLod = lod,
                BucketCounts = bucketCounts, Matrices = matrices,
            };
            job.Run();
            CollectionAssert.AreEqual(new[] { 1, 1, 1, 1 }, bucketCounts.ToArray());
            var m = matrices[1 * maxVisible];   // LOD 1: the tree at z 60
            Assert.AreEqual(60f, m.m23, 1e-4f);
            Assert.AreEqual(0f, m.m03, 1e-4f);
            var expected = Matrix4x4.TRS(new Vector3(0, 0, 60), Quaternion.Euler(0, math.degrees(0.5f), 0), Vector3.one);
            for (int i = 0; i < 16; i++) Assert.AreEqual(expected[i], m[i], 1e-4f);
            inst.Dispose(); counts.Dispose(); origins.Dispose(); tiles.Dispose(); planes.Dispose(); lod.Dispose(); bucketCounts.Dispose(); matrices.Dispose();
        }
    }
}
