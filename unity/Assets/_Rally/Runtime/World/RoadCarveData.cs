using System.Runtime.InteropServices;
using Rally.Core;
using Unity.Mathematics;

namespace Rally.World
{
    /// <summary>
    /// One carve input, shared by Carve.compute and <see cref="CarveJob"/> (32 bytes, StructuredBuffer-ready).
    /// A road segment pulls every height within <see cref="HalfWidth"/> of the line to the road height
    /// interpolated between <see cref="Ha"/> and <see cref="Hb"/>, then blends back to the natural ground
    /// over <see cref="Shoulder"/> (corridor.js profileHeight with the rim equal to the ground). A building
    /// pad (terrain.js flattenPad) is the same thing with A == B, HalfWidth = radius and Shoulder = blend.
    /// </summary>
    [StructLayout(LayoutKind.Sequential)]
    public struct CarveSegment
    {
        public float2 A, B;       // tile-local metres from the tile's south-west corner (x east, y north)
        public float Ha, Hb;      // road height at A and B, metres a.s.l., ROAD_LIFT already added
        public float HalfWidth;   // flat band: carriageway half width + shoulder (corridor.js flatHalf)
        public float Shoulder;    // metres beyond the flat band to meet the untouched ground

        public const int Stride = 32;
        /// <summary>How far from the line the segment can change the ground (flat band + the widest earthwork).</summary>
        public float Reach => HalfWidth + math.max(Shoulder, RoadConstants.MaxEarthwork);
    }

    /// <summary>
    /// The carve's road profile: the lane specs and the one height rule that Carve.compute, <see cref="CarveJob"/>
    /// and <see cref="TileWorld.HeightAt"/> evaluate so they agree to the centimetre. The numbers themselves
    /// (SHOULDER, FEATHER, ROAD_LIFT, LANES, the ribbon lift and crown) live in <see cref="RoadConstants"/>
    /// (Core) because Track and the car read the same ones; this class only adds what the carve needs.
    /// </summary>
    public static class RoadProfile
    {
        /// <summary>corridor.js LANES.two: normal two-lane road, 10.5 m + 1.5 m shoulders, 18 m cut-through.</summary>
        public static readonly LaneSpec Two = new LaneSpec(RoadConstants.TwoLaneHalf, RoadConstants.TwoLaneCut);
        /// <summary>corridor.js LANES.one: single lane, 4.5 m + 1.5 m shoulders = the whole 7.5 m cut-through.</summary>
        public static readonly LaneSpec One = new LaneSpec(RoadConstants.OneLaneHalf, RoadConstants.OneLaneCut);

        /// <summary>
        /// Blend width of a <see cref="CarveSegment"/> for a lane spec: the terrace from the flat band to the
        /// cut-through edge. corridor.js then feathers a smoothed rim over FEATHER; we have no rim heights
        /// (the rim is the natural ground), so a single-lane road, whose cut-through is its flat band, gets
        /// the feather as its blend instead of a step.
        /// </summary>
        public static float ShoulderFor(float half, float cut) => math.max(cut - RoadConstants.FlatHalf(half), RoadConstants.Feather);

        public static float Smoothstep(float t) { t = math.saturate(t); return t * t * (3f - 2f * t); }

        /// <summary>
        /// Width of the earthwork from the flat band to the natural ground: <see cref="RoadConstants.FillRun"/> per metre
        /// of fill, <see cref="RoadConstants.CutRun"/> per metre of cut, between <paramref name="shoulder"/> and the cap.
        /// </summary>
        public static float EarthworkWidth(float roadY, float ground, float shoulder)
        {
            float rise = roadY - ground;
            float w = rise > 0 ? rise * RoadConstants.FillRun : -rise * RoadConstants.CutRun;
            return math.clamp(w, shoulder, math.max(shoulder, RoadConstants.MaxEarthwork));
        }

        /// <summary>
        /// corridor.js profileHeight with edge == ground: flat to halfWidth, then a smoothstep down (embankment) or up
        /// (cutting) to the natural ground over <see cref="EarthworkWidth"/>, evaluated with the ground at the point.
        /// </summary>
        public static float Height(float roadY, float ground, float d, float halfWidth, float shoulder)
        {
            if (d <= halfWidth) return roadY;
            float w = EarthworkWidth(roadY, ground, shoulder);
            if (d < halfWidth + w) return math.lerp(roadY, ground, Smoothstep((d - halfWidth) / w));
            return ground;
        }
    }

    /// <summary>Carriageway half width and cut-through half width (metres) of a road class.</summary>
    public readonly struct LaneSpec
    {
        public readonly float Half, Cut;
        public LaneSpec(float half, float cut) { Half = half; Cut = cut; }
    }

    /// <summary>What the ground needs to know about the nearest road (the RoadNetwork.nearest answer in roads.js).</summary>
    public struct RoadHit
    {
        public long Id;
        public double Distance;     // metres from the query point to the segment
        public double2 Point;       // closest point on the centre line (EPSG:25833)
        public double2 Tangent;     // unit, along the way
        public float RoadY;         // graded carriageway height, without ROAD_LIFT
        public float Half, Cut;     // lane spec
        public Surface Surface;
        /// <summary>+1 on the side of the left normal (−tz, tx), −1 on the other: the carve's side rule.</summary>
        public int Side;
    }

    /// <summary>The road graph as seen from below it: TileWorld (World) cannot reference Rally.Roads.</summary>
    public interface IRoadQuery
    {
        /// <summary>Nearest segment within <paramref name="limit"/> metres; false when none is that close.</summary>
        bool Nearest(Utm33 p, double limit, out RoadHit hit);
        /// <summary>Every segment that can reach into <paramref name="bounds"/>, as carve input local to <paramref name="origin"/>, ROAD_LIFT added.</summary>
        void CollectCarveSegments(Bounds25833 bounds, Utm33 origin, System.Collections.Generic.List<CarveSegment> output);
        /// <summary>Road sample points within <paramref name="radius"/> (the scheduler's fine-tile band follows them).</summary>
        void PointsNear(Utm33 p, double radius, System.Collections.Generic.List<Utm33> output);
    }
}
