using Rally.Core;
using Unity.Mathematics;

namespace Rally.Track
{
    /// <summary>
    /// What a proximity query against the road answers (the object stage.js:171 StageRoute.nearest and
    /// roads.js:373 RoadNetwork.nearest return). The car reads it once per frame for grip, progress and the
    /// HUD; the World's carve reads the same shape when it evaluates the corridor profile.
    /// Field names follow the JS. World xz is the Unity frame (x = east, z = north).
    /// </summary>
    public struct RouteQuery
    {
        /// <summary>Perpendicular distance to the nearest segment (m); +infinity when there is no road at all.</summary>
        public float Distance;
        /// <summary>Signed lateral offset: positive on the side of the left normal (−tz, tx) of the tangent, like the carve.</summary>
        public float Side;
        /// <summary>Parameter 0..1 along the nearest segment.</summary>
        public float T;
        /// <summary>Carriageway height at the foot point (JS roadY ?? y).</summary>
        public float RoadY;
        /// <summary>Carriageway half width (JS width).</summary>
        public float HalfWidth;
        public Surface Surface;
        /// <summary>atan2(tangent.x, tangent.z): the car's yaw sense.</summary>
        public float Heading;
        /// <summary>Index of the segment's first sample (JS index).</summary>
        public int Segment;
        /// <summary>Metres along the route at the foot point.</summary>
        public float S;
        /// <summary>S / Length (JS progress).</summary>
        public float Progress;
        /// <summary>Foot point on the centre line, world xz (JS point).</summary>
        public float2 Point;
        /// <summary>Unit direction of the segment, world xz (JS tangent).</summary>
        public float2 Tangent;
        /// <summary>Half width of the cut-through (JS cut).</summary>
        public float Cut;
        /// <summary>Smoothed natural ground at the cut-through edges (JS edgeL/edgeR), valid when <see cref="HasEdges"/>.</summary>
        public float EdgeL, EdgeR;
        public bool HasEdges;

        public bool Hit => Distance < float.PositiveInfinity;

        public static RouteQuery None(float2 xz) => new RouteQuery
        {
            Distance = float.PositiveInfinity, Point = xz, Tangent = new float2(0, 1), Surface = Surface.Gravel,
        };
    }

    /// <summary>A pose on the road: world xz, height and yaw (the car's yaw sense: atan2(dx, dz)).</summary>
    public struct RoutePose
    {
        public float2 XZ;
        public float Y;
        public float Yaw;
    }

    /// <summary>
    /// What the car reads from a route: the proximity query (stage.js StageRoute / roads.js RoadNetwork,
    /// both of which car.js drives against), its length and start pose, and the HUD's name. A stage is a
    /// single line with progress; a free-roam road network has no progress and no wrong way.
    /// </summary>
    public interface IRoute
    {
        string Name { get; }
        /// <summary>Metres along the whole line.</summary>
        float Length { get; }
        /// <summary>Default carriageway half width (JS roadWidth).</summary>
        float RoadWidth { get; }
        /// <summary>Half width of the cut-through (JS cutHalf).</summary>
        float CutHalf { get; }
        /// <summary>Default surface until NVDB / OSM say otherwise.</summary>
        Surface Surface { get; }
        /// <summary>True for a road network (JS route.free): no wrong-way flag, no progress.</summary>
        bool Free { get; }
        /// <summary>Nearest segment to a world xz; <paramref name="limit"/> bounds the bucket search (m).</summary>
        RouteQuery Nearest(float2 xz, float limit = 120f);
        RoutePose StartPose();
        /// <summary>Point on the line <paramref name="s"/> metres from the start (clamped), stage.js:189.</summary>
        RoutePose SampleAtDistance(float s);
    }
}
