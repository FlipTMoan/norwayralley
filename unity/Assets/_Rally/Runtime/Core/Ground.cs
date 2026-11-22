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
        /// <summary>
        /// The road tunnel at a world XZ, if the point is inside a tube's plan (out to its wall face) and the asker
        /// (<see cref="ReferenceY"/>; NaN counts as inside) is below its roof: then <see cref="HeightAt"/> answers the tunnel
        /// floor there, not the mountain above. False outside tunnels (and in avalanche galleries, which are open roads).
        /// </summary>
        bool TunnelAt(float2 xz, out TunnelSpot spot);
    }

    /// <summary><see cref="ILayeredGround.TunnelAt"/> as a delegate (the camera rig gets it from the world).</summary>
    public delegate bool TunnelQuery(float2 xz, out TunnelSpot spot);

    /// <summary>A point in a road tunnel (<see cref="ILayeredGround.TunnelAt"/>), world heights (FloatingOrigin-relative XZ).</summary>
    public struct TunnelSpot
    {
        /// <summary>The drivable surface at the point (what IGround.HeightAt answers there for a car in the tube).</summary>
        public float Floor;
        /// <summary>The roof's inside at the point (lower towards the walls: the arch) and at the crown.</summary>
        public float Roof, Crown;
        /// <summary>Nearest point on the tunnel's centre line (world XZ) and the unit direction along the way.</summary>
        public float2 Centre, Tangent;
        /// <summary>Signed distance from the centre line (+ on the left of <see cref="Tangent"/>) and the half width to the wall face.</summary>
        public float Lateral, Half;
    }

    /// <summary>
    /// Solids the car must stay out of beyond what a PhysX overlap can judge (CarController asks its ground for this, as it
    /// does for <see cref="ILayeredGround"/>): building footprints in plan view, and pooled colliders that follow the car.
    /// </summary>
    public interface ISolidGround
    {
        /// <summary>Retarget the pooled colliders (trees, street-light masts) to a world position now: after a teleport, before testing it.</summary>
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
