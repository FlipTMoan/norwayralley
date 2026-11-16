namespace Rally.Core
{
    /// <summary>
    /// The one switch between the two GPU paths: compute (WebGPU, desktop) or the WebGL 2 fallbacks
    /// (Burst carve + re-upload, CPU scatter + RenderMeshInstanced, CPU dents). Every GraphicsBuffer /
    /// ComputeBuffer / Dispatch in the project is gated on <see cref="Compute"/>, never on SystemInfo
    /// directly, so <see cref="ForceNoCompute"/> can route the whole C# side through the fallbacks on an
    /// editor GPU that has compute (SceneSmokeTests does this).
    /// </summary>
    public static class GpuCaps
    {
        /// <summary>Debug / test flag: pretend the platform has no compute shaders. Set before the world is built.</summary>
        public static bool ForceNoCompute;

        public static bool Compute => !ForceNoCompute && UnityEngine.SystemInfo.supportsComputeShaders;
    }
}
