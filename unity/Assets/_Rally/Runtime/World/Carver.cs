using System;
using Unity.Collections;
using Unity.Jobs;
using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// One carve API, two engines. The compute carver (WebGPU) writes the tile's heightmap slice on the
    /// GPU and the CPU copy follows by readback; the CPU carver (WebGL 2) runs <see cref="CarveJob"/> and
    /// re-uploads the slice. Either way the tile's base heights stay untouched, so carving again with
    /// more segments (a neighbour's roads arrived) gives the same answer as carving once with all of them.
    /// </summary>
    public interface ICarver : IDisposable
    {
        /// <summary>True when <see cref="Carve"/> leaves the tile's HeightGrid already up to date (no readback needed).</summary>
        bool CpuSynchronous { get; }
        void Carve(TerrainTile tile, NativeArray<CarveSegment> segments, int count);
    }

    public static class Carvers
    {
        /// <summary>Compute when the platform has it (WebGPU, desktop), else the Burst job (WebGL 2).</summary>
        public static ICarver Create(ComputeShader carveShader)
        {
            if (SystemInfo.supportsComputeShaders && carveShader != null) return new ComputeCarver(carveShader);
            return new CpuCarver();
        }
    }

    public sealed class ComputeCarver : ICarver
    {
        public const int MaxSegmentsPerDispatch = 2048;   // Carve.compute MAX_SEGMENTS
        readonly ComputeShader shader;
        readonly int kernel;
        readonly GraphicsBuffer segments;
        static readonly int BaseId = Shader.PropertyToID("_Base"), HeightsId = Shader.PropertyToID("_Heights"), MaskId = Shader.PropertyToID("_Mask"),
            BestDId = Shader.PropertyToID("_BestD"), SegmentsId = Shader.PropertyToID("_Segments"), CountId = Shader.PropertyToID("_SegmentCount"),
            SliceId = Shader.PropertyToID("_Slice"), NId = Shader.PropertyToID("_N"), FirstId = Shader.PropertyToID("_First"), CellId = Shader.PropertyToID("_CellM");

        public bool CpuSynchronous => false;

        public ComputeCarver(ComputeShader carveShader)
        {
            shader = carveShader;
            kernel = shader.FindKernel("Carve");
            segments = new GraphicsBuffer(GraphicsBuffer.Target.Structured, MaxSegmentsPerDispatch, CarveSegment.Stride);
        }

        public void Carve(TerrainTile tile, NativeArray<CarveSegment> segs, int count)
        {
            var atlas = tile.Atlas;
            shader.SetTexture(kernel, BaseId, atlas.Base);
            shader.SetTexture(kernel, HeightsId, atlas.Heights);
            shader.SetTexture(kernel, MaskId, atlas.Mask);
            shader.SetTexture(kernel, BestDId, atlas.BestD);
            shader.SetBuffer(kernel, SegmentsId, segments);
            shader.SetInt(SliceId, tile.Slice);
            shader.SetInt(NId, atlas.N);
            shader.SetFloat(CellId, tile.Key.CellM);
            int groups = (atlas.N + 7) / 8;
            int offset = 0;
            do
            {
                int n = Math.Min(MaxSegmentsPerDispatch, count - offset);
                if (n > 0) segments.SetData(segs, offset, 0, n);
                shader.SetInt(CountId, n);
                shader.SetInt(FirstId, offset == 0 ? 1 : 0);
                shader.Dispatch(kernel, groups, groups, 1);   // a zero-segment first dispatch resets the slice to the base
                offset += n;
            } while (offset < count);
            tile.GpuVersion++;
            tile.CpuInSync = false;
        }

        public void Dispose() => segments.Dispose();
    }

    public sealed class CpuCarver : ICarver
    {
        public bool CpuSynchronous => true;

        public void Carve(TerrainTile tile, NativeArray<CarveSegment> segs, int count)
        {
            var job = new CarveJob
            {
                N = tile.Grid.N, CellM = tile.Grid.CellM, Base = tile.Base, Segments = segs, SegmentCount = count,
                Heights = tile.Grid.Heights, Mask = tile.Mask,
            };
            job.Schedule(tile.Grid.N, 8).Complete();
            tile.Grid.Version++;
            tile.UploadHeights();
            tile.CpuInSync = true;
        }

        public void Dispose() { }
    }
}
