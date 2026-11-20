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

    /// <summary>
    /// A ground with surfaces above each other (a bridge deck over a river): <see cref="ReferenceY"/> is the height of the
    /// thing asking. NaN (the default) means the top surface; the car sets its own height around its step so that under a
    /// bridge it drives on the river bed and on the deck it stays on the deck.
    /// </summary>
    public interface ILayeredGround
    {
        float ReferenceY { get; set; }
    }

    /// <summary>
    /// Solids the car must stay out of beyond what a PhysX overlap can judge (CarController asks its ground for this, as it
    /// does for <see cref="ILayeredGround"/>): building footprints in plan view, and pooled colliders that follow the car.
    /// </summary>
    public interface ISolidGround
    {
        /// <summary>Retarget the pooled colliders (trees) to a world position now: after a teleport, before testing it.</summary>
        void RefreshColliders(float3 world);
        /// <summary>
        /// The shortest move (world xz) that takes the car box (centre, yaw, half extents) out of every house it reaches more than
        /// <paramref name="minDepth"/> m into (its centre inside a footprint counts as infinitely deep); false when there is none.
        /// </summary>
        bool FootprintPush(float2 centre, float yaw, float halfLength, float halfWidth, float minDepth, out float2 push);
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
