using System;
using System.Collections.Generic;
using Unity.Collections;
using UnityEngine;
using UnityEngine.Experimental.Rendering;
using UnityEngine.Rendering;

namespace Rally.World
{
    /// <summary>
    /// The GPU side of all tiles of one kind: texture arrays with one slice per live tile, so the
    /// clipmap shader reaches any tile through a slice index instead of a material switch.
    ///   Base    untouched DTM (RFloat), uploaded from the CPU
    ///   Heights carved heights (RFloat): a random-write RenderTexture array when compute is available
    ///           (Carve.compute writes it, AsyncGPUReadback reads it back), else a plain Texture2DArray
    ///           re-uploaded after the CPU carve
    ///   Mask    carve mask, same shape (1 flat band, 0.5 blend, 0 untouched)
    ///   Splat, Splat2  ground layer weights RGBA8 (coarse tiles only), eight layers in LandcoverSplat order, grass = remainder
    ///   Cover   species / crown / cover class RGBA8 (coarse tiles only), read by Scatter.compute
    /// Slices come from a free list; a tile keeps its slice for life.
    /// </summary>
    public sealed class TileAtlas : IDisposable
    {
        public readonly int N, Slices, SplatRes;
        public readonly bool Compute;
        public readonly Texture2DArray Base;
        public readonly Texture Heights;
        public readonly Texture Mask;
        public readonly RenderTexture BestD, BestY, LayerD;   // compute scratch (Carve.compute)
        public readonly Texture2DArray Splat, Splat2, Cover; // null for fine tiles
        readonly Stack<int> free = new Stack<int>();
        readonly Texture2D stagingF, stagingB, stagingRGBA;   // one slice's worth, so an upload never re-sends the whole array

        public TileAtlas(int n, int slices, int splatRes, bool compute)
        {
            N = n; Slices = slices; SplatRes = splatRes; Compute = compute;
            Base = new Texture2DArray(n, n, slices, TextureFormat.RFloat, false, true) { filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp, name = "TileBase" };
            if (compute)
            {
                Heights = NewArrayRT(n, slices, "TileHeights");
                Mask = NewArrayRT(n, slices, "TileMask");
                BestD = new RenderTexture(n, n, 0, RenderTextureFormat.RFloat) { enableRandomWrite = true, name = "CarveBestD" };
                BestD.Create();
                BestY = new RenderTexture(n, n, 0, RenderTextureFormat.RFloat) { enableRandomWrite = true, name = "CarveBestY" };
                BestY.Create();
                LayerD = new RenderTexture(n, n, 0, RenderTextureFormat.RFloat) { enableRandomWrite = true, name = "CarveLayerD" };
                LayerD.Create();
            }
            else
            {
                Heights = new Texture2DArray(n, n, slices, TextureFormat.RFloat, false, true) { filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp, name = "TileHeights" };
                Mask = new Texture2DArray(n, n, slices, TextureFormat.R8, false, true) { filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp, name = "TileMask" };
            }
            if (splatRes > 0)
            {
                Splat = new Texture2DArray(splatRes, splatRes, slices, TextureFormat.RGBA32, false, true) { filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp, name = "TileSplat" };
                Splat2 = new Texture2DArray(splatRes, splatRes, slices, TextureFormat.RGBA32, false, true) { filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp, name = "TileSplat2" };
                Cover = new Texture2DArray(splatRes, splatRes, slices, TextureFormat.RGBA32, false, true) { filterMode = FilterMode.Point, wrapMode = TextureWrapMode.Clamp, name = "TileCover" };
            }
            for (int i = slices - 1; i >= 0; i--) free.Push(i);
            stagingF = new Texture2D(n, n, TextureFormat.RFloat, false, true) { name = "StagingF" };
            stagingB = new Texture2D(n, n, TextureFormat.R8, false, true) { name = "StagingB" };
            if (splatRes > 0) stagingRGBA = new Texture2D(splatRes, splatRes, TextureFormat.RGBA32, false, true) { name = "StagingRGBA" };
        }

        /// <summary>
        /// Upload one slice: through a staging texture and Graphics.CopyTexture (only that slice crosses the
        /// bus), or, where CopyTexture is unsupported, SetPixelData + Apply on the array (re-sends every slice).
        /// </summary>
        public void UploadSlice<T>(Texture2DArray target, NativeArray<T> data, int slice) where T : struct
        {
            var staging = target == Splat || target == Splat2 || target == Cover ? stagingRGBA : target == Mask ? stagingB : stagingF;
            if (SystemInfo.copyTextureSupport != CopyTextureSupport.None && staging != null)
            {
                staging.SetPixelData(data, 0);
                staging.Apply(false, false);
                Graphics.CopyTexture(staging, 0, 0, target, slice, 0);
            }
            else
            {
                target.SetPixelData(data, 0, slice);
                target.Apply(false, false);
            }
        }

        static RenderTexture NewArrayRT(int n, int slices, string name)
        {
            var desc = new RenderTextureDescriptor(n, n, RenderTextureFormat.RFloat, 0)
            {
                dimension = TextureDimension.Tex2DArray, volumeDepth = slices, enableRandomWrite = true, useMipMap = false, msaaSamples = 1,
            };
            var rt = new RenderTexture(desc) { filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp, name = name };
            rt.Create();
            return rt;
        }

        public int Allocate() => free.Count > 0 ? free.Pop() : throw new InvalidOperationException("TileAtlas full: raise Slices");
        public void Release(int slice) => free.Push(slice);

        public void Dispose()
        {
            RallyObjects.Destroy(Base);
            RallyObjects.Destroy(Heights);
            RallyObjects.Destroy(Mask);
            if (BestD != null) BestD.Release();
            if (BestY != null) BestY.Release();
            if (LayerD != null) LayerD.Release();
            if (Splat != null) RallyObjects.Destroy(Splat);
            if (Splat2 != null) RallyObjects.Destroy(Splat2);
            if (Cover != null) RallyObjects.Destroy(Cover);
            RallyObjects.Destroy(stagingF); RallyObjects.Destroy(stagingB); if (stagingRGBA != null) RallyObjects.Destroy(stagingRGBA);
        }
    }
}
