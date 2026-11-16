using Unity.Mathematics;

namespace Rally.Vehicle
{
    /// <summary>
    /// An oriented house footprint for the CPU wall test (buildings.js:569 pushOutOfBox): centre, rotation
    /// about Y and half length / half width. The Unity build resolves walls through PhysX colliders
    /// (CarController); this is the pure path EditMode tests and head-less servers use.
    /// </summary>
    public struct WallBox
    {
        public float X, Z, Yaw, Hl, Hw;

        /// <summary>
        /// If a disc of `radius` at (px, pz) overlaps the box, the push that frees it: a unit normal out of
        /// the wall and the depth in metres. buildings.js:569.
        /// </summary>
        public bool PushOut(float px, float pz, float radius, out float nx, out float nz, out float depth)
        {
            float dx = px - X, dz = pz - Z;
            float c = math.cos(Yaw), s = math.sin(Yaw);
            // World → the box's local frame (inverse of the rotation about Y).
            float lx = dx * c - dz * s;
            float lz = dx * s + dz * c;
            float ox = Hl + radius - math.abs(lx);
            float oz = Hw + radius - math.abs(lz);
            nx = 0f; nz = 0f; depth = 0f;
            if (ox <= 0f || oz <= 0f) return false;
            float nlx = 0f, nlz = 0f;
            if (ox < oz) { nlx = lx < 0f ? -1f : 1f; depth = ox; } else { nlz = lz < 0f ? -1f : 1f; depth = oz; }
            nx = nlx * c + nlz * s;
            nz = -nlx * s + nlz * c;
            return true;
        }
    }
}
