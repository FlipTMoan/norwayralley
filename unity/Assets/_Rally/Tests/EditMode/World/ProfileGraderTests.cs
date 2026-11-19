using System;
using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Roads;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    /// <summary>Ports of legacy-js/tests/roadgrade.test.mjs and the profile parts of corridor.test.mjs.</summary>
    public class ProfileGraderTests
    {
        /// <summary>Ground along a road: a 2 % climb with 1 m bumps every 40 m and a few sharp 10 m knobs.</summary>
        static double[] Ground(int n, double spacing)
        {
            var g = new double[n];
            for (int i = 0; i < n; i++) { double s = i * spacing; g[i] = 100 + 0.02 * s + 1.0 * Math.Sin(2 * Math.PI * s / 40) + (i % 37 == 0 ? 2.5 : 0); }
            return g;
        }

        [Test]
        public void RoadGradeIronsOutShortBumpsButKeepsTheHill()
        {
            double spacing = 5;
            var raw = Ground(400, spacing);
            var road = ProfileGrader.SmoothRoadHeights(raw, spacing);
            double worstRaw = 0, worstRoad = 0;
            for (int i = 1; i < raw.Length - 1; i++)
            {
                worstRaw = Math.Max(worstRaw, Math.Abs(raw[i + 1] - 2 * raw[i] + raw[i - 1]) / spacing);
                worstRoad = Math.Max(worstRoad, Math.Abs(road[i + 1] - 2 * road[i] + road[i - 1]) / spacing);
            }
            Assert.Less(worstRoad, worstRaw * 0.1, $"curvature {worstRaw:F3} → {worstRoad:F3} per m");
            double grade = (road[300] - road[100]) / (200 * spacing);
            Assert.Less(Math.Abs(grade - 0.02), 0.002, $"grade {grade:F4}");
            double worstGap = 0;
            for (int i = 0; i < raw.Length; i++) worstGap = Math.Max(worstGap, Math.Abs(road[i] - raw[i]));
            Assert.Less(worstGap, 4, $"gap {worstGap:F2} m");
        }

        [Test]
        public void MeanSpacingMeasuresThePolylineStep()
        {
            Assert.AreEqual(5, ProfileGrader.MeanSpacing(new List<double2> { new double2(0, 0), new double2(3, 4), new double2(6, 8) }), 1e-12);
            Assert.AreEqual(1, ProfileGrader.MeanSpacing(new List<double2> { new double2(0, 0) }));
        }

        [Test]
        public void Profile_FlatShoulderToShoulder_SmoothBlend_UntouchedBeyond()
        {
            var two = RoadProfile.Two;   // 10.5 m road, 1.5 m shoulders, 18 m cut-through
            float flat = RoadConstants.FlatHalf(two.Half), shoulder = RoadProfile.ShoulderFor(two.Half, two.Cut);
            Assert.AreEqual(6.75f, flat, 1e-6, "flat out to 6.75 m: 5.25 m half plus the 1.5 m shoulder");
            // A low fill (1 m) keeps the class's terrace blend; higher ones run out wider (RoadEdgeFitTests.EmbankmentsSlopeGentlyToTheGround).
            Assert.AreEqual(100, RoadProfile.Height(100, 99, 0, flat, shoulder));
            Assert.AreEqual(100, RoadProfile.Height(100, 99, flat, flat, shoulder), "flat out to the shoulder");
            Assert.AreEqual(99.5f, RoadProfile.Height(100, 99, (flat + two.Cut) / 2, flat, shoulder), 1e-5, "halfway across the terrace blend");
            Assert.AreEqual(99, RoadProfile.Height(100, 99, two.Cut, flat, shoulder), 1e-6, "natural ground at the cut-through edge");
            Assert.AreEqual(99, RoadProfile.Height(100, 99, RoadConstants.CorridorReach(two.Half, two.Cut) + 1, flat, shoulder), "untouched beyond");
            var one = RoadProfile.One;
            Assert.AreEqual(3.75f, RoadConstants.FlatHalf(one.Half), 1e-6, "single lane: 4.5 m + 1.5 m shoulders");
            Assert.AreEqual(3.75f + 1.5f, RoadConstants.CorridorReach(one.Half, one.Cut), 1e-6, "7.5 m cut-through plus the feather");
        }

        [Test]
        public void SurfaceLiftRidesTheRibbonAndFadesOffTheShoulder()
        {
            float half = 2.25f;
            Assert.AreEqual(RoadConstants.RoadRibbonLift + RoadConstants.RoadCrown, RoadConstants.SurfaceLift(0, half), 1e-6);
            Assert.AreEqual(RoadConstants.RoadRibbonLift + RoadConstants.RoadCrown, RoadConstants.SurfaceLift(half, half), 1e-6);
            Assert.AreEqual(RoadConstants.RoadRibbonLift, RoadConstants.SurfaceLift(half + RoadConstants.Shoulder, half), 1e-6);
            Assert.AreEqual(0, RoadConstants.SurfaceLift(half + RoadConstants.Shoulder + 0.6f, half), 1e-6);
            Assert.AreEqual(0, RoadConstants.SurfaceLift(50, half), 1e-6);
        }

        [Test]
        public void ChaikinKeepsEndsAndJunctions_ResampleKeepsVertices()
        {
            var pts = new List<double2> { new double2(0, 0), new double2(100, 0), new double2(100, 100), new double2(200, 100) };
            var smooth = ProfileGrader.Chaikin(pts, new HashSet<int> { 2 });
            Assert.AreEqual(pts[0], smooth[0]);
            Assert.AreEqual(pts[3], smooth[smooth.Count - 1]);
            Assert.IsTrue(smooth.Contains(new double2(100, 100)), "pinned junction node stays");
            Assert.IsFalse(smooth.Contains(new double2(100, 0)), "an ordinary corner is cut");
            var dense = ProfileGrader.Resample(pts, 5);
            Assert.IsTrue(dense.Contains(new double2(100, 0)));
            for (int i = 1; i < dense.Count; i++) Assert.LessOrEqual(math.distance(dense[i], dense[i - 1]), 5 + 1e-9);
        }
    }
}
