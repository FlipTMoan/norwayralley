using System.Collections.Generic;
using Rally.Core;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Roads
{
    /// <summary>What an OSM <c>tunnel=*</c> tag makes of a road.</summary>
    public enum TunnelKind : byte
    {
        None,
        /// <summary><c>tunnel=yes</c> (and other values that mean a bored or cut-and-cover road tunnel): a tube through the ground.</summary>
        Tube,
        /// <summary><c>tunnel=avalanche_protector</c> (rasoverbygg): a roof over a road on the hillside, open on the valley side.</summary>
        Gallery,
    }

    /// <summary>
    /// Road tunnels from the map. A way tagged <c>tunnel=yes</c> is a tube end to end: graded as a straight line between its
    /// two portals (the ground at its end nodes, where the roads outside meet it) instead of following the mountain over it,
    /// dipping at most <see cref="SubseaGrade"/> to stay <see cref="SubseaDepth"/> under the sea where it runs under the fjord.
    /// The mountain is not carved (RoadGraph.CollectCarveSegments: CarveSegment.TunnelOnly), the tube, the portals and the
    /// lamps are drawn by <see cref="TunnelMesh"/>, and the car drives on the tunnel floor (TileWorld.TunnelAt). An avalanche
    /// gallery is an ordinary graded and carved road with a roof drawn over it.
    /// <c>tunnel=building_passage</c> stays an open road: the house over it is already left out by the road clearance rule
    /// (World.Buildings), so a tube there would stand alone in the street. <c>culvert</c> / <c>no</c> are no tunnels.
    /// </summary>
    public static class Tunnels
    {
        /// <summary>Under the sea (DTM 0 there, no depth) the tube's floor goes this far below sea level, reached at <see cref="SubseaGrade"/> from the portals.</summary>
        public const double SubseaDepth = 40, SubseaGrade = 0.08;

        /// <summary>Daylight reaches this far into a tube; beyond, only its lamps light it (Rally/Tunnel, Rally/Road).</summary>
        public const float DaylightReach = 40f;

        /// <summary>
        /// How far inside a tube a sample of a run is, for the shaders: 0 at a portal and outside, 0.9 from
        /// <see cref="DaylightReach"/> on (vertex alpha 1 is kept for the lamps). <paramref name="wayLength"/>: the whole way's length.
        /// </summary>
        public static float InsideWeight(in RoadSample s, float wayLength)
            => s.Tunnel ? 0.9f * math.saturate(math.min(s.S, wayLength - s.S) / DaylightReach) : 0f;

        public static TunnelKind KindOf(Dictionary<string, string> tags)
        {
            if (tags == null || !tags.TryGetValue("tunnel", out var t) || string.IsNullOrEmpty(t)) return TunnelKind.None;
            switch (t)
            {
                case "no": case "culvert": case "building_passage": return TunnelKind.None;
                case "avalanche_protector": return TunnelKind.Gallery;
                default: return TunnelKind.Tube;
            }
        }

        /// <summary>
        /// A tube's road heights: the straight line from <paramref name="y0"/> to <paramref name="y1"/> (the ground at the two
        /// portals) over the distances <paramref name="s"/>, lowered under the sea where <paramref name="sea"/> says the ground is
        /// the sea plane: there the floor must be <see cref="SubseaDepth"/> under it, or as deep as a <see cref="SubseaGrade"/>
        /// descent from the nearer portal gets (reachable from both), and the dip keeps that grade on both sides. The portals never move.
        /// </summary>
        public static double[] Profile(double[] s, double y0, double y1, bool[] sea)
        {
            int n = s.Length;
            var h = new double[n];
            double L = math.max(1e-6, s[n - 1] - s[0]);
            for (int i = 0; i < n; i++) h[i] = math.lerp(y0, y1, (s[i] - s[0]) / L);
            if (sea == null) return h;
            // The dip under the sea: e = min over sea samples j of (need_j + SubseaGrade × |s_i − s_j|), a forward and a backward
            // pass. need_j is reachable from both portals at that grade (need_j ≥ y0 − g·s_j and ≥ y1 − g·(L − s_j)), so e never
            // pulls a portal down.
            var e = new double[n];
            bool any = false;
            for (int i = 0; i < n; i++)
            {
                e[i] = double.PositiveInfinity;
                if (i == 0 || i == n - 1 || !sea[i]) continue;
                double reach = math.max(y0 - SubseaGrade * (s[i] - s[0]), y1 - SubseaGrade * (s[n - 1] - s[i]));
                e[i] = math.max(-SubseaDepth, reach);
                any = true;
            }
            if (!any) return h;
            for (int i = 1; i < n; i++) e[i] = math.min(e[i], e[i - 1] + SubseaGrade * (s[i] - s[i - 1]));
            for (int i = n - 2; i >= 0; i--) e[i] = math.min(e[i], e[i + 1] + SubseaGrade * (s[i + 1] - s[i]));
            for (int i = 1; i + 1 < n; i++) h[i] = math.min(h[i], e[i]);
            return h;
        }
    }
}
