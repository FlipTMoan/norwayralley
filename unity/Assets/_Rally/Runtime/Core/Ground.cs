using Unity.Mathematics;

namespace Rally.Core
{
    public enum Surface : byte { Asphalt, Gravel, Offroad, Water }

    public readonly struct WaterSample
    {
        public readonly float Depth;     // metres of water above the ground (0 = dry)
        public readonly float SurfaceY;  // water surface height
        public WaterSample(float depth, float surfaceY) { Depth = depth; SurfaceY = surfaceY; }
        public static readonly WaterSample Dry = new WaterSample(0, float.NegativeInfinity);
    }

    /// <summary>
    /// What the car, the actors and the camera ask the world. Implemented by World.TileWorld over the
    /// loaded HeightGrids plus the road ribbon lift; by FlatGround in tests.
    /// </summary>
    public interface IGround
    {
        /// <summary>Ground height at a world XZ, including the road ribbon lift on the road.</summary>
        float HeightAt(float2 xz);
        Surface SurfaceAt(float2 xz);
        WaterSample WaterAt(float2 xz);
        /// <summary>True once the ground under this point is loaded (the car waits otherwise).</summary>
        bool IsLoaded(float2 xz);
    }

    /// <summary>A flat or analytic ground for tests and the editor.</summary>
    public sealed class FlatGround : IGround
    {
        public System.Func<float2, float> Height = _ => 0f;
        public Surface Surface = Surface.Gravel;
        public float HeightAt(float2 xz) => Height(xz);
        public Surface SurfaceAt(float2 xz) => Surface;
        public WaterSample WaterAt(float2 xz) => WaterSample.Dry;
        public bool IsLoaded(float2 xz) => true;
    }
}
