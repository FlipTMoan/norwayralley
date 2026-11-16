using Rally.Core;
using Rally.Roads;
using Unity.Mathematics;

namespace Rally.Track
{
    /// <summary>
    /// Free drive: the road network is the route (roads.js RoadNetwork as car.js drives against it). The car
    /// gets the nearest OSM road's distance, width, surface and graded height for grip and the HUD; there is
    /// no line, so no progress, no wrong way and no pace notes (<see cref="Free"/>). The start pose is the
    /// road nearest the shared pin, found by the caller once the start tile's roads are in.
    /// </summary>
    public sealed class RoadNetworkRoute : IRoute
    {
        readonly RoadGraph roads;
        readonly RoutePose start;

        public RoadNetworkRoute(RoadGraph roads, RoutePose start) { this.roads = roads; this.start = start; }

        public string Name => roads.Name;
        public float Length => 0f;
        public float RoadWidth => roads.RoadWidth;
        public float CutHalf => RoadConstants.OneLaneCut;
        public Surface Surface => Surface.Gravel;
        public bool Free => true;

        public RouteQuery Nearest(float2 xz, float limit = 120f)
        {
            if (!roads.Nearest(FloatingOrigin.ToUtm(xz), limit, out var h)) return RouteQuery.None(xz);
            return new RouteQuery
            {
                Distance = (float)h.Distance, Side = h.Side * (float)h.Distance, T = 0f, RoadY = h.RoadY, HalfWidth = h.Half, Surface = h.Surface,
                Heading = (float)math.atan2(h.Tangent.x, h.Tangent.y), Segment = 0, S = 0f, Progress = 0f,
                Point = FloatingOrigin.ToWorldXZ(new Utm33(h.Point.x, h.Point.y)), Tangent = (float2)h.Tangent, Cut = h.Cut, HasEdges = false,
            };
        }

        public RoutePose StartPose() => start;
        /// <summary>A network has no line: the start pose, so callers that need "somewhere on the road" get one.</summary>
        public RoutePose SampleAtDistance(float s) => start;
    }
}
