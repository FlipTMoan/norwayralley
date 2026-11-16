using NUnit.Framework;
using Rally.Core;
using Rally.World;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    /// <summary>corridor.test.mjs "carveProfile keeps the carriageway exact", on the Burst job (the compute twin follows the same rule).</summary>
    public class CarveJobTests
    {
        const int N = 81; const float Cell = 2f;
        static float Ground(float x) => 50 + 0.8f * x;   // steep side slope across x

        static (NativeArray<float> heights, NativeArray<byte> mask, NativeArray<float> baseH) Run(params CarveSegment[] segs)
        {
            var baseH = new NativeArray<float>(N * N, Allocator.TempJob);
            for (int j = 0; j < N; j++) for (int i = 0; i < N; i++) baseH[j * N + i] = Ground(i * Cell);
            var heights = new NativeArray<float>(N * N, Allocator.TempJob);
            var mask = new NativeArray<byte>(N * N, Allocator.TempJob);
            var segsN = new NativeArray<CarveSegment>(segs, Allocator.TempJob);
            new CarveJob { N = N, CellM = Cell, Base = baseH, Segments = segsN, SegmentCount = segs.Length, Heights = heights, Mask = mask }.Schedule(N, 8).Complete();
            segsN.Dispose();
            return (heights, mask, baseH);
        }

        static float At(NativeArray<float> h, float x, float z) => h[(int)(z / Cell) * N + (int)(x / Cell)];

        [Test]
        public void StraightRoad_FlatBandExact_BlendMonotone_BeyondUntouched()
        {
            float half = 3.25f, cut = 8f;
            float flat = RoadConstants.FlatHalf(half), shoulder = RoadProfile.ShoulderFor(half, cut);   // 4.75 flat, blend to 8 m
            var seg = new CarveSegment { A = new float2(80, -10), B = new float2(80, 170), Ha = 114, Hb = 114, HalfWidth = flat, Shoulder = shoulder };
            var (h, mask, baseH) = Run(seg);
            try
            {
                Assert.AreEqual(114, At(h, 80, 80), 1e-5, "centre line at road height");
                Assert.AreEqual(114, At(h, 84, 80), 1e-5, "shoulder flat (4 m inside the flat band)");
                float s6 = (6 - flat) / (cut - flat);
                float blend6 = math.lerp(114, Ground(74), s6 * s6 * (3 - 2 * s6));
                Assert.AreEqual(blend6, At(h, 74, 80), 1e-3, "terrace blend on the low side");
                Assert.AreEqual(Ground(72), At(h, 72, 80), 1e-4, "cut-through edge meets the ground, no step");
                Assert.AreEqual(Ground(88), At(h, 88, 80), 1e-4, "high side edge");
                Assert.AreEqual(Ground(100), At(h, 100, 80), 0, "untouched beyond the cut-through");
                Assert.AreEqual(Ground(160), At(h, 160, 80), 0, "untouched far away");
                // Monotone blend: from the centre out to the edge on the low side the height never rises.
                float prev = At(h, 80, 80);
                for (float x = 78; x >= 70; x -= 2) { float v = At(h, x, 80); Assert.LessOrEqual(v, prev + 1e-5, $"x={x}"); prev = v; }
                Assert.AreEqual(255, mask[(80 / 2) * N + 80 / 2], "flat band mask");
                Assert.AreEqual(128, mask[(80 / 2) * N + 74 / 2], "blend mask");
                Assert.AreEqual(0, mask[(80 / 2) * N + 100 / 2], "untouched mask");
            }
            finally { h.Dispose(); mask.Dispose(); baseH.Dispose(); }
        }

        [Test]
        public void NearestSegmentWins_AtACrossing()
        {
            var a = new CarveSegment { A = new float2(80, -10), B = new float2(80, 170), Ha = 114, Hb = 114, HalfWidth = 4.75f, Shoulder = 3.25f };
            var b = new CarveSegment { A = new float2(-10, 80), B = new float2(170, 80), Ha = 120, Hb = 120, HalfWidth = 4.75f, Shoulder = 3.25f };
            var (h, mask, baseH) = Run(a, b);
            try
            {
                Assert.AreEqual(120, At(h, 60, 82), 1e-5, "2 m from road B's centre, 20 m from A: B wins");
                Assert.AreEqual(114, At(h, 82, 60), 1e-5, "2 m from A, 20 m from B: A wins");
            }
            finally { h.Dispose(); mask.Dispose(); baseH.Dispose(); }
        }

        [Test]
        public void PadIsAFlatDiscWithASmoothRim()
        {
            var pad = new CarveSegment { A = new float2(80, 80), B = new float2(80, 80), Ha = 100, Hb = 100, HalfWidth = 18, Shoulder = 34 };
            var (h, mask, baseH) = Run(pad);
            try
            {
                Assert.AreEqual(100, At(h, 80, 80), 1e-5);
                Assert.AreEqual(100, At(h, 96, 80), 1e-5, "inside the 18 m radius");
                float d = 30; float t = RoadProfile.Smoothstep((d - 18) / 34);
                Assert.AreEqual(math.lerp(100, Ground(110), t), At(h, 110, 80), 1e-3, "terrain.js flattenPad blend");
                Assert.AreEqual(Ground(140), At(h, 140, 80), 1e-5, "beyond radius + blend");
            }
            finally { h.Dispose(); mask.Dispose(); baseH.Dispose(); }
        }
    }
}
