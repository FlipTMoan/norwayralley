using Unity.Mathematics;

namespace Rally.World
{
    /// <summary>
    /// The car against building footprints in plan view, the solid test PhysX cannot do with the houses' wall meshes: a car
    /// wholly inside a house touches no wall triangle, and a car more than half way through a wall is pushed out along the
    /// nearest triangle, which can be inward. Here the car is an oriented box (centre, unit forward, half length / width), a
    /// house its footprint ring (counter-clockwise, relative to the house's box centre) and its oriented outline box
    /// (<see cref="FootprintBox"/>, which holds the whole ring). <see cref="Depth"/> says how deep the car is in the ring;
    /// <see cref="PushOut"/> is the shortest move that takes the car out of the outline box (separating axes), so the car
    /// always ends outside the house whatever the shape. Pure and allocation-free (per frame).
    /// </summary>
    public static class Footprints
    {
        /// <summary>Clearance added to a push, so the next frame's overlap test starts free.</summary>
        public const float Margin = 0.05f;

        /// <summary>
        /// How deep the car box reaches into the ring (m, 0 = clear): the deepest of the car's centre, corners and side
        /// midpoints inside the ring (distance to the ring's edge), and of the ring's corners inside the car (distance to the
        /// car's edge). The centre inside counts as infinitely deep. <paramref name="rel"/> is the car centre relative to the
        /// ring's origin.
        /// </summary>
        public static float Depth(float2 rel, float2 forward, float halfLength, float halfWidth, float2[] ring)
        {
            if (ring == null || ring.Length < 3) return 0f;
            var right = new float2(forward.y, -forward.x);
            if (Inside(rel, ring)) return float.PositiveInfinity;
            float depth = 0f;
            for (int i = 0; i < 8; i++)
            {
                float a = i < 4 ? ((i & 1) == 0 ? -1f : 1f) : (i == 4 ? 1f : i == 5 ? -1f : 0f);
                float b = i < 4 ? ((i & 2) == 0 ? -1f : 1f) : (i < 6 ? 0f : i == 6 ? 1f : -1f);
                var p = rel + forward * (a * halfLength) + right * (b * halfWidth);
                if (Inside(p, ring)) depth = math.max(depth, EdgeDistance(p, ring));
            }
            for (int i = 0; i < ring.Length; i++)
            {
                var d = ring[i] - rel;
                float along = halfLength - math.abs(math.dot(d, forward)), across = halfWidth - math.abs(math.dot(d, right));
                if (along > 0f && across > 0f) depth = math.max(depth, math.min(along, across));
            }
            return depth;
        }

        /// <summary>
        /// The shortest move (separating axes over both boxes' axes) that takes the car box out of the house's outline box
        /// (centre-relative <paramref name="rel"/>, house axis <paramref name="houseAxis"/> along its length), plus <see cref="Margin"/>.
        /// Zero when they do not overlap.
        /// </summary>
        public static float2 PushOut(float2 rel, float2 forward, float halfLength, float halfWidth, float2 houseAxis, float houseHalfLength, float houseHalfWidth)
        {
            var right = new float2(forward.y, -forward.x);
            var houseSide = new float2(houseAxis.y, -houseAxis.x);
            float best = float.PositiveInfinity; float2 push = 0f;
            for (int i = 0; i < 4; i++)
            {
                var n = i == 0 ? forward : i == 1 ? right : i == 2 ? houseAxis : houseSide;
                float d = math.dot(rel, n);
                float rc = halfLength * math.abs(math.dot(forward, n)) + halfWidth * math.abs(math.dot(right, n));
                float rh = houseHalfLength * math.abs(math.dot(houseAxis, n)) + houseHalfWidth * math.abs(math.dot(houseSide, n));
                float overlap = rc + rh - math.abs(d);
                if (overlap <= 0f) return 0f;
                if (overlap < best) { best = overlap; push = n * (d >= 0f ? 1f : -1f) * (overlap + Margin); }
            }
            return push;
        }

        /// <summary>
        /// One pass over a tile's houses for a car at <paramref name="car"/> (UTM) already moved by <paramref name="push"/>: every
        /// house it is deeper in than <paramref name="minDepth"/> adds the move out of its outline box. True when one did.
        /// </summary>
        public static bool PushOutOfSet(BuildingSet set, double2 car, float2 forward, float halfLength, float halfWidth, float minDepth, ref float2 push)
        {
            if (set == null) return false;
            bool moved = false;
            float reach = halfLength + halfWidth;
            for (int b = 0; b < set.Boxes.Count && b < set.Rings.Count; b++)
            {
                var box = set.Boxes[b];
                var rel = (float2)(car + (double2)push - box.Centre);
                float r = reach + box.HalfLength + box.HalfWidth;
                if (math.lengthsq(rel) > r * r) continue;
                if (Depth(rel, forward, halfLength, halfWidth, set.Rings[b]) <= minDepth) continue;
                var step = PushOut(rel, forward, halfLength, halfWidth, new float2(math.sin(box.Yaw), math.cos(box.Yaw)), box.HalfLength, box.HalfWidth);
                if (math.all(step == 0f)) continue;
                push += step; moved = true;
            }
            return moved;
        }

        /// <summary>Even-odd point in ring (Geometry2D.PointInRing for an array).</summary>
        public static bool Inside(float2 p, float2[] ring)
        {
            bool inside = false;
            for (int i = 0, j = ring.Length - 1; i < ring.Length; j = i++)
            {
                var a = ring[i]; var b = ring[j];
                if ((a.y > p.y) != (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
            }
            return inside;
        }

        static float EdgeDistance(float2 p, float2[] ring)
        {
            float best = float.PositiveInfinity;
            for (int i = 0, j = ring.Length - 1; i < ring.Length; j = i++)
            {
                float2 a = ring[j], ab = ring[i] - a;
                float t = math.saturate(math.dot(p - a, ab) / math.max(1e-9f, math.dot(ab, ab)));
                best = math.min(best, math.distance(p, a + ab * t));
            }
            return best;
        }
    }
}
