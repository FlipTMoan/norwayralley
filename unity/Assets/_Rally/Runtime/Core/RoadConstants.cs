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
