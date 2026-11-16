using System;
using Rally.Core;
using Unity.Collections;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.World
{
    /// <summary>
    /// One streamed tile: its slice in the <see cref="TileAtlas"/> plus the CPU <see cref="HeightGrid"/>
    /// the car drives on. The GPU heightmap is built from exactly this grid (or carved on the GPU and
    /// read back into it), so the drawn ground and the physics ground are the same numbers.
    /// No MonoBehaviour: TileWorld creates and disposes these from the scheduler's events.
    /// </summary>
    public sealed class TerrainTile : IDisposable
    {
        public readonly TileKey Key;
        public readonly TileAtlas Atlas;
        public readonly int Slice;
        public readonly HeightGrid Grid;        // carved heights, what the car reads
        public NativeArray<float> Base;          // untouched DTM, what the carve starts from
        public NativeArray<byte> Mask;           // CPU carve mask (CPU path; stays zero on the GPU path)
        public NativeArray<Color32> Cover;       // coarse tiles: CPU copy of the cover texture (species/crown/class) for the CPU scatter
        public double Latitude;                  // for the tree line / snow line
        public float TreeLine, SnowLine;
        public bool HasHeights, CpuInSync = true;
        public uint GpuVersion;
        public ulong HoleMask;                   // coarse tiles: fine tiles that cover them (TileScheduler.HoleMask)
        public object UserData;                  // roads/water/buildings views attach their per-tile state here
        bool disposed;
        int pendingReadbacks;

        public TerrainTile(TileKey key, TileAtlas atlas)
        {
            Key = key; Atlas = atlas;
            Slice = atlas.Allocate();
            Grid = new HeightGrid(atlas.N, key.CellM, key.Origin);
            Base = new NativeArray<float>(atlas.N * atlas.N, Allocator.Persistent, NativeArrayOptions.UninitializedMemory);
            Mask = new NativeArray<byte>(atlas.N * atlas.N, Allocator.Persistent, NativeArrayOptions.ClearMemory);
        }

        /// <summary>The fetched DTM arrives: keep it as the base, start the carved grid equal to it, upload both slices.</summary>
        public void SetBase(NativeArray<float> dtm)
        {
            dtm.CopyTo(Base);
            dtm.CopyTo(Grid.Heights);
            Atlas.UploadSlice(Atlas.Base, Base, Slice);
            HasHeights = true;
            UploadHeights();
        }

        /// <summary>CPU grid → GPU slice. On the compute path the carve itself fills the slice, so this only copies the base.</summary>
        public void UploadHeights()
        {
            if (Atlas.Compute)
            {
                // No carve yet: the heights slice must still show the base. A zero-segment carve does that
                // (ComputeCarver resets the slice on its first dispatch); TileWorld calls Carve right after SetBase.
                return;
            }
            Atlas.UploadSlice((Texture2DArray)Atlas.Heights, Grid.Heights, Slice);
            Atlas.UploadSlice((Texture2DArray)Atlas.Mask, Mask, Slice);
            GpuVersion = Grid.Version;
        }

        public void Carve(ICarver carver, NativeArray<CarveSegment> segments, int count) => carver.Carve(this, segments, count);

        /// <summary>After a GPU carve: read the slice back into the HeightGrid (bumping its Version) so the car feels the new ground.</summary>
        public void SyncCpu(Action<TerrainTile> onDone = null)
        {
            if (!Atlas.Compute || CpuInSync || disposed) { onDone?.Invoke(this); return; }
            if (!SystemInfo.supportsAsyncGPUReadback) { RallyLog.Warn("AsyncGPUReadback unsupported: CPU heights stay uncarved"); return; }
            pendingReadbacks++;
            uint version = GpuVersion;
            AsyncGPUReadback.Request(Atlas.Heights, 0, 0, Atlas.N, 0, Atlas.N, Slice, 1, TextureFormat.RFloat, req =>
            {
                pendingReadbacks--;
                if (disposed) return;
                if (req.hasError) { RallyLog.Warn($"Readback failed for {Key}"); return; }
                req.GetData<float>(0).CopyTo(Grid.Heights);
                Grid.Version++;
                if (version == GpuVersion) CpuInSync = true;   // a newer carve may already be in flight
                onDone?.Invoke(this);
            });
        }

        /// <summary>Bilinear sample of the untouched DTM (the "natural ground" the road profile blends to).</summary>
        public float SampleBase(Utm33 p)
        {
            int n = Grid.N;
            float fx = math.clamp((float)((p.E - Grid.Origin.E) / Grid.CellM), 0, n - 1.0001f);
            float fy = math.clamp((float)((p.N - Grid.Origin.N) / Grid.CellM), 0, n - 1.0001f);
            int c = (int)fx, r = (int)fy;
            float tx = fx - c, ty = fy - r;
            float h00 = Base[r * n + c], h10 = Base[r * n + c + 1], h01 = Base[(r + 1) * n + c], h11 = Base[(r + 1) * n + c + 1];
            return math.lerp(math.lerp(h00, h10, tx), math.lerp(h01, h11, tx), ty);
        }

        /// <summary>Slope (rise per metre) of the carved grid at a point, from the cell's gradient (terrain.js slope).</summary>
        public float Slope(Utm33 p)
        {
            int n = Grid.N;
            int c = math.clamp((int)((p.E - Grid.Origin.E) / Grid.CellM), 1, n - 2), r = math.clamp((int)((p.N - Grid.Origin.N) / Grid.CellM), 1, n - 2);
            float gx = (Grid[c + 1, r] - Grid[c - 1, r]) / (2 * Grid.CellM), gy = (Grid[c, r + 1] - Grid[c, r - 1]) / (2 * Grid.CellM);
            return math.sqrt(gx * gx + gy * gy);
        }

        public void Dispose()
        {
            if (disposed) return;
            disposed = true;
            Grid.Dispose();
            if (Base.IsCreated) Base.Dispose();
            if (Mask.IsCreated) Mask.Dispose();
            if (Cover.IsCreated) Cover.Dispose();
            Atlas.Release(Slice);
        }
    }
}
