using Unity.Burst;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;

namespace Rally.World
{
    /// <summary>
    /// CPU carve, one row per job index: the WebGL 2 fallback for Carve.compute and the reference the
    /// tests run. Same rule as corridor.js carveProfile: every cell within reach of a segment takes the
    /// profile of the *nearest* segment (nearest wins, so crossings do not fight), evaluated from the
    /// untouched base heights so re-carving is idempotent. Mask: 255 on the flat band (road / pad),
    /// 128 on the blend, 0 untouched — the scatter keeps trees off it.
    /// </summary>
    [BurstCompile(FloatMode = FloatMode.Default, FloatPrecision = FloatPrecision.Standard)]
    public struct CarveJob : IJobParallelFor
    {
        public int N;
        public float CellM;
        [ReadOnly] public NativeArray<float> Base;
        [ReadOnly] public NativeArray<CarveSegment> Segments;
        public int SegmentCount;
        [NativeDisableParallelForRestriction] public NativeArray<float> Heights;
        [NativeDisableParallelForRestriction] public NativeArray<byte> Mask;

        public void Execute(int row)
        {
            float y = row * CellM;
            int rowBase = row * N;
            for (int col = 0; col < N; col++)
            {
                float2 p = new float2(col * CellM, y);
                float ground = Base[rowBase + col];
                float bestD = float.PositiveInfinity, bestH = ground, bestFlat = 0, bestShoulder = 0;
                bool bestDeck = false;
                for (int s = 0; s < SegmentCount; s++)
                {
                    var seg = Segments[s];
                    float reach = seg.Reach;
                    // Cheap box reject before the projection: most segments are far from most cells.
                    if (p.x < math.min(seg.A.x, seg.B.x) - reach || p.x > math.max(seg.A.x, seg.B.x) + reach
                        || p.y < math.min(seg.A.y, seg.B.y) - reach || p.y > math.max(seg.A.y, seg.B.y) + reach) continue;
                    float2 ab = seg.B - seg.A;
                    float len2 = math.lengthsq(ab);
                    float t = len2 > 1e-12f ? math.saturate(math.dot(p - seg.A, ab) / len2) : 0f;
                    float d = math.distance(p, seg.A + ab * t);
                    if (d > reach || d >= bestD) continue;
                    // A bridge span wins its cells like a road, and leaves them as they are.
                    if ((seg.Flags & CarveSegment.DeckOnly) != 0) { bestD = d; bestFlat = seg.HalfWidth; bestDeck = true; continue; }
                    // Beyond the flat band a segment only claims cells its earthwork reaches (else the cell stays free
                    // for a farther segment whose profile does reach it, as before the earthworks widened the reach).
                    float h = math.lerp(seg.Ha, seg.Hb, t);
                    if (d > seg.HalfWidth + RoadProfile.EarthworkWidth(h, ground, seg.Shoulder)) continue;
                    bestD = d;
                    bestH = h;
                    bestFlat = seg.HalfWidth;
                    bestShoulder = seg.Shoulder;
                    bestDeck = false;
                }
                int idx = rowBase + col;
                if (bestD == float.PositiveInfinity) { Heights[idx] = ground; Mask[idx] = 0; continue; }
                if (bestDeck) { Heights[idx] = ground; Mask[idx] = bestD <= bestFlat ? (byte)128 : (byte)0; continue; }
                Heights[idx] = RoadProfile.Height(bestH, ground, bestD, bestFlat, bestShoulder);
                Mask[idx] = bestD <= bestFlat ? (byte)255 : (byte)128;
            }
        }
    }
}
