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
    /// <see cref="Flags"/> <see cref="DeckOnly"/>: a bridge span. It takes part in "nearest wins" like a road (out to its
    /// <see cref="Reach"/>), but a cell it wins keeps the natural ground: nothing under a bridge is carved, and an approach
    /// road's carve ends where the deck is nearer (the abutment), instead of filling the river with its end cap. The deck's
    /// footprint (<see cref="HalfWidth"/>) is marked 128 on the mask so no tree grows through it.
    /// <see cref="TunnelOnly"/>: a road tunnel, the same claim (the mountain over a tunnel stays as it is and the approach's
    /// cutting ends at the portal); its footprint is masked only where the rock over it is thin (no trees on a portal).
    /// A layer segment (either flag) only takes a cell from a road on the ground whose height there is within
    /// <see cref="RoadConstants.PassOver"/> of its own: a road under a bridge or over a tunnel is carved as usual.
    /// </summary>
    [StructLayout(LayoutKind.Sequential)]
    public struct CarveSegment
    {
        public float2 A, B;       // tile-local metres from the tile's south-west corner (x east, y north)
        public float Ha, Hb;      // road height at A and B, metres a.s.l., ROAD_LIFT already added
        public float HalfWidth;   // flat band: carriageway half width + shoulder (corridor.js flatHalf)
        public float Shoulder;    // metres beyond the flat band to meet the untouched ground
        public uint Flags;        // DeckOnly, TunnelOnly

        public const uint DeckOnly = 1, TunnelOnly = 2, Layer = DeckOnly | TunnelOnly;
        /// <summary>A tunnel footprint is masked where the natural ground is less than this above its road (portals, thin cover).</summary>
        public const float TunnelMaskCover = 10f;
        public const int Stride = 36;
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
        /// <summary>On a bridge span: <see cref="RoadY"/> is the deck's road height and nothing under it is carved.</summary>
        public bool Bridge;
        /// <summary>In a road tunnel: <see cref="RoadY"/> is the tunnel floor's road height and the mountain over it is not carved.</summary>
        public bool Tunnel;
    }

    /// <summary>Which roads a nearest-road query looks at: all, only those on the ground (not decks, not tunnels), only bridge decks, only tunnels.</summary>
    public enum RoadLayer : byte { Any, Ground, Deck, Tunnel }

    /// <summary>One 5 m piece of a road tunnel (<see cref="IRoadQuery.TunnelSegmentsNear"/>).</summary>
    public struct TunnelPiece
    {
        public double2 A, B;
        public float Ya, Yb;     // graded road heights, no lift
        public float Half;       // carriageway half width
        public bool PortalA, PortalB;   // that end is a portal (a way end), not the middle of a tube
    }

    /// <summary>The road graph as seen from below it: TileWorld (World) cannot reference Rally.Roads.</summary>
    public interface IRoadQuery
    {
        /// <summary>Nearest segment within <paramref name="limit"/> metres; false when none is that close.</summary>
        bool Nearest(Utm33 p, double limit, out RoadHit hit);
        /// <summary>As <see cref="Nearest(Utm33, double, out RoadHit)"/>, restricted to the roads on the ground or to bridge decks.</summary>
        bool Nearest(Utm33 p, double limit, RoadLayer layer, out RoadHit hit);
        /// <summary>Bridge segments loaded (the deck queries are skipped while there are none).</summary>
        int BridgeSegmentCount { get; }
        /// <summary>Tunnel segments loaded (the tunnel queries are skipped while there are none).</summary>
        int TunnelSegmentCount { get; }
        /// <summary>Tunnel segments within <paramref name="radius"/> of a point: ends (EPSG:25833), graded road heights, carriageway half width.</summary>
        void TunnelSegmentsNear(Utm33 p, double radius, System.Collections.Generic.List<TunnelPiece> output);
        /// <summary>Every segment that can reach into <paramref name="bounds"/>, as carve input local to <paramref name="origin"/>, ROAD_LIFT added.</summary>
        void CollectCarveSegments(Bounds25833 bounds, Utm33 origin, System.Collections.Generic.List<CarveSegment> output);
        /// <summary>Road sample points within <paramref name="radius"/> (the scheduler's fine-tile band follows them).</summary>
        void PointsNear(Utm33 p, double radius, System.Collections.Generic.List<Utm33> output);
    }
}
