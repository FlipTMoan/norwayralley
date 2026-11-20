using Unity.Mathematics;

namespace Rally.Core
{
    /// <summary>
    /// The road cross-section every layer must agree on to the centimetre: the World carves the
    /// terrace into the height grid and draws the ribbon, Track answers "how far from the road am I",
    /// and the car rides on the result. One copy of the numbers (ports of legacy-js/src/corridor.js and
    /// the ribbon constants at the top of legacy-js/src/stage.js), so the tyres sit on the drawn road.
    /// </summary>
    public static class RoadConstants
    {
        /// <summary>Flat shoulder beyond the carriageway's half width (corridor.js:24 SHOULDER).</summary>
        public const float Shoulder = 1.5f;
        /// <summary>The ribbon covers the shoulder too (corridor.js:25 RIBBON_SHOULDER, stage.js:11 ROAD_SHOULDER).</summary>
        public const float RoadShoulder = Shoulder;
        /// <summary>Metres beyond the cut-through edge to meet the untouched ground (corridor.js:26 FEATHER).</summary>
        public const float Feather = 1.5f;
        /// <summary>Coarse heights sit this far under the fine terrace (corridor.js:27 CARVE_MARGIN).</summary>
        public const float CarveMargin = 0.3f;
        /// <summary>The carriageway sits a hair above the carved ground (corridor.js:28 ROAD_LIFT).</summary>
        public const float RoadLift = 0.12f;
        /// <summary>How far the gravel ribbon floats above the carved ground; the car rides on the ribbon (stage.js:9).</summary>
        public const float RoadRibbonLift = 0.16f;
        /// <summary>The ribbon's crown on the carriageway (stage.js:10 ROAD_CROWN).</summary>
        public const float RoadCrown = 0.06f;

        /// <summary>Road classes: carriageway half width and cut-through half width (corridor.js:32 LANES).</summary>
        public const float TwoLaneHalf = 5.25f, TwoLaneCut = 9f;      // 10.5 m + 1.5 m shoulders, 18 m cut-through
        public const float OneLaneHalf = 2.25f, OneLaneCut = 3.75f;   // 4.5 m + 1.5 m shoulders = the whole 7.5 m cut-through

        /// <summary>
        /// Flat carved ground beyond the ribbon's shoulder, at the carriageway height: the terrain mesh near the camera
        /// has 2 m triangles (Clipmap level 0), and one that straddled the ribbon edge with a vertex up the cut slope
        /// rose through the shoulder. With every vertex within this apron at road height the drawn terrain stays under
        /// the ribbon. Used by the carve (RoadGraph.CollectCarveSegments) and the car's off-ribbon ground (TileWorld.HeightAt).
        /// </summary>
        public const float CarveApron = 2f;

        /// <summary>
        /// The ribbon edge sits RoadRibbonLift above the carriageway's carve; the carve's flat band is raised by
        /// <see cref="CarveLift"/> so the terrain meets the ribbon edge just <see cref="EdgeTuck"/> under it (it used to
        /// stay 16 cm under, which with the vertical skirt read as a road floating on a dark line). The tuck keeps the
        /// terrain from poking through the shoulder; Rally/Road draws with a depth offset so far away they do not fight.
        /// </summary>
        public const float EdgeTuck = 0.04f;
        public const float CarveLift = RoadRibbonLift - EdgeTuck;

        /// <summary>
        /// Earthworks beyond the flat band: an embankment (road above the natural ground) runs out <see cref="FillRun"/>
        /// metres per metre of height, a cutting <see cref="CutRun"/>, at most <see cref="MaxEarthwork"/> m wide; never
        /// narrower than the road class's shoulder blend. A 3 m fill used to drop over 1.5–2.25 m (a near-vertical wall).
        /// </summary>
        public const float FillRun = 2f, CutRun = 1.25f, MaxEarthwork = 10f;

        /// <summary>
        /// Bridge decks (legacy-js/src/bridges.js): the slab reaches <see cref="BridgeRailOut"/> beyond the ribbon's shoulder
        /// edge (the JS uses 0.35 m; wider here so the ribbon's skirts end inside the slab), <see cref="DeckThickness"/> deep,
        /// its top where the terrain meets the ribbon edge on a road. A car more than <see cref="DeckCatch"/> under the deck top
        /// is under the bridge, not on it.
        /// </summary>
        public const float BridgeRailOut = 0.6f, DeckThickness = 0.9f, DeckCatch = 1.0f;
        /// <summary>Half width of a bridge deck (carriageway + shoulder + rail) for a carriageway half width.</summary>
        public static float DeckHalf(float half) => half + RoadShoulder + BridgeRailOut;
        /// <summary>Deck top for a graded road height (no lift): the carved road's terrace height, EdgeTuck under the ribbon edge.</summary>
        public static float DeckTop(float roadY) => roadY + RoadLift + CarveLift;

        /// <summary>
        /// A road on another level (a bridge deck, a tunnel) more than this above or below a road on the ground passes over or
        /// under it: they do not meet (no junction easing) and neither takes the other's ground in the carve or for the car.
        /// </summary>
        public const float PassOver = 2.5f;
        /// <summary>
        /// Road tunnels (<c>tunnel=yes</c>): the tube's inside reaches <see cref="TunnelSideRoom"/> beyond the shoulder, the
        /// wall stands <see cref="TunnelWall"/> m up from the road and the roof arches <see cref="TunnelArch"/> × the half width
        /// above that; the walls are <see cref="TunnelWallThick"/> thick. Two-lane: 14.5 m wide inside, crown 7.5 m.
        /// </summary>
        public const float TunnelSideRoom = 0.5f, TunnelWall = 4.2f, TunnelArch = 0.45f, TunnelWallThick = 0.6f;
        /// <summary>Half width of a tunnel's inside (to the wall face) for a carriageway half width.</summary>
        public static float TunnelHalf(float half) => FlatHalf(half) + TunnelSideRoom;
        /// <summary>Height of the tunnel roof's crown above the graded road (no lift).</summary>
        public static float TunnelCrown(float half) => TunnelWall + TunnelArch * TunnelHalf(half);
        /// <summary>
        /// The roof's inside height above the graded road at <paramref name="d"/> m from the centre line: the wall up to
        /// <see cref="TunnelWall"/>, then an elliptic arch to the crown.
        /// </summary>
        public static float TunnelRoofAt(float d, float half)
        {
            float w = TunnelHalf(half), t = math.saturate(math.abs(d) / w);
            return TunnelWall + TunnelArch * w * math.sqrt(math.max(0f, 1f - t * t));
        }
        /// <summary>Half width of the flat part: carriageway plus shoulder (corridor.js:38 flatHalf).</summary>
        public static float FlatHalf(float half) => half + Shoulder;

        /// <summary>How far from the centre line the profile can differ from the ground (corridor.js:43 corridorReach).</summary>
        public static float CorridorReach(float half, float cut) => math.max(cut, FlatHalf(half)) + Feather;

        static float Smoothstep(float t) => t * t * (3f - 2f * t); // geo.js:133

        /// <summary>
        /// Height of the terrace at lateral distance <paramref name="d"/> from the centre line
        /// (corridor.js:53 profileHeight). <paramref name="roadY"/> is the carriageway height,
        /// <paramref name="ground"/> the natural ground at the point and <paramref name="edge"/> the
        /// (along-road smoothed) natural ground at the cut-through edge on this side; pass
        /// <paramref name="hasEdge"/> = false to blend to the ground instead.
        /// </summary>
        public static float ProfileHeight(float roadY, float ground, float d, float half, float cut, float edge, bool hasEdge)
        {
            float flat = FlatHalf(half);
            if (d <= flat) return roadY;
            float cutHalf = math.max(cut, flat);
            float rim = hasEdge ? edge : ground;
            if (d < cutHalf) return math.lerp(roadY, rim, Smoothstep((d - flat) / math.max(1e-6f, cutHalf - flat)));
            if (d < cutHalf + Feather) return math.lerp(rim, ground, (d - cutHalf) / Feather);
            return ground;
        }

        /// <summary>
        /// The ribbon floats a few centimetres above the carved ground. On the road the car rides on the
        /// ribbon, and the lift fades out across the shoulder so leaving the road is a kerb, not a cliff
        /// (car.js:793 surfaceLift). IGround.HeightAt includes this on the road.
        /// </summary>
        public static float SurfaceLift(float distance, float half)
        {
            const float top = RoadRibbonLift + RoadCrown;
            if (distance <= half) return top;
            if (distance <= half + RoadShoulder) return math.lerp(top, RoadRibbonLift, (distance - half) / RoadShoulder);
            return math.lerp(RoadRibbonLift, 0f, math.clamp((distance - half - RoadShoulder) / 0.6f, 0f, 1f));
        }
    }
}
