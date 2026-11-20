using System;
using System.Collections.Generic;
using Rally.Core;
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
            if (GpuCaps.Compute && carveShader != null) return new ComputeCarver(carveShader);
            return new CpuCarver();
        }
    }

    public sealed class ComputeCarver : ICarver
    {
        public const int MaxSegmentsPerDispatch = 2048;   // Carve.compute MAX_SEGMENTS
        readonly ComputeShader shader;
        readonly int kernel;
        /// <summary>
        /// Segment buffers used in turn: SetData into a buffer a dispatch of the previous frames still reads made the driver
        /// wait for the GPU (OpenGL core: 0.4–1.2 s carves in the editor drives of 2026-11-20 while the GPU was busy).
        /// </summary>
        const int Ring = 8;
        readonly GraphicsBuffer[] ring = new GraphicsBuffer[Ring];
        int next;
        static readonly int BaseId = Shader.PropertyToID("_Base"), HeightsId = Shader.PropertyToID("_Heights"), MaskId = Shader.PropertyToID("_Mask"),
            BestDId = Shader.PropertyToID("_BestD"), SegmentsId = Shader.PropertyToID("_Segments"), CountId = Shader.PropertyToID("_SegmentCount"),
            SliceId = Shader.PropertyToID("_Slice"), NId = Shader.PropertyToID("_N"), FirstId = Shader.PropertyToID("_First"), CellId = Shader.PropertyToID("_CellM");

        public bool CpuSynchronous => false;

        public ComputeCarver(ComputeShader carveShader)
        {
            shader = carveShader;
            kernel = shader.FindKernel("Carve");
            for (int i = 0; i < Ring; i++) ring[i] = new GraphicsBuffer(GraphicsBuffer.Target.Structured, MaxSegmentsPerDispatch, CarveSegment.Stride);
        }

        public void Carve(TerrainTile tile, NativeArray<CarveSegment> segs, int count)
        {
            var atlas = tile.Atlas;
            shader.SetTexture(kernel, BaseId, atlas.Base);
            shader.SetTexture(kernel, HeightsId, atlas.Heights);
            shader.SetTexture(kernel, MaskId, atlas.Mask);
            shader.SetTexture(kernel, BestDId, atlas.BestD);
            shader.SetInt(SliceId, tile.Slice);
            shader.SetInt(NId, atlas.N);
            shader.SetFloat(CellId, tile.Key.CellM);
            int groups = (atlas.N + 7) / 8;
            int offset = 0;
            // Upload and dispatch only queue GPU work; time spent here is the driver waiting for a busy GPU (FrameProbe '.gpu').
            long t0 = FrameProbe.Start();
            do
            {
                int n = Math.Min(MaxSegmentsPerDispatch, count - offset);
                var segments = ring[next]; next = (next + 1) % Ring;
                if (n > 0) segments.SetData(segs, offset, 0, n);
                shader.SetBuffer(kernel, SegmentsId, segments);
                shader.SetInt(CountId, n);
                shader.SetInt(FirstId, offset == 0 ? 1 : 0);
                shader.Dispatch(kernel, groups, groups, 1);   // a zero-segment first dispatch resets the slice to the base
                offset += n;
            } while (offset < count);
            FrameProbe.Stop(".gpu.carve", t0);
            tile.GpuVersion++;
            tile.CpuInSync = false;
        }

        public void Dispose() { foreach (var b in ring) b.Dispose(); }
    }

    public sealed class CpuCarver : ICarver
    {
        public bool CpuSynchronous => true;

        /// <summary>
        /// Rows per band. Every cell tested every segment of the tile (a coarse tile with a town in it: 66 000 cells × 3 000
        /// segments, ~100 ms in the editor drives of 2026-11-20); a band only takes the segments whose reach overlaps its rows.
        /// The segments keep their order, so "nearest wins" picks the same one and the result is identical.
        /// </summary>
        const int BandRows = 16;

        public void Carve(TerrainTile tile, NativeArray<CarveSegment> segs, int count)
        {
            int n = tile.Grid.N;
            float cell = tile.Grid.CellM;
            var bands = new List<NativeArray<CarveSegment>>();
            JobHandle handle = default;
            for (int r0 = 0; r0 < n; r0 += BandRows)
            {
                int rows = Math.Min(BandRows, n - r0);
                float y0 = r0 * cell, y1 = (r0 + rows - 1) * cell;
                var band = new NativeArray<CarveSegment>(Math.Max(1, count), Allocator.TempJob, NativeArrayOptions.UninitializedMemory);
                int m = 0;
                for (int i = 0; i < count; i++)
                {
                    var g = segs[i];
                    if (Math.Max(g.A.y, g.B.y) + g.Reach < y0 || Math.Min(g.A.y, g.B.y) - g.Reach > y1) continue;
                    band[m++] = g;
                }
                bands.Add(band);
                var job = new CarveJob
                {
                    N = n, CellM = cell, Base = tile.Base, Segments = band, SegmentCount = m, RowOffset = r0,
                    Heights = tile.Grid.Heights, Mask = tile.Mask,
                };
                handle = job.Schedule(rows, 4, handle);   // bands one after another: they write the same arrays
            }
            handle.Complete();
            foreach (var band in bands) band.Dispose();
            tile.Grid.Version++;
            tile.UploadHeights();
            tile.CpuInSync = true;
        }

        public void Dispose() { }
    }
}
