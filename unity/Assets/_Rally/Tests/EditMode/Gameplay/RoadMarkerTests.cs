using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Gameplay;
using Rally.Track;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Tests.Edit.Gameplay
{
    /// <summary>
    /// The direction arrow on the road ahead and the finish gate (2026-11-20): "moving direction arrow down onto the road ahead
    /// of car" and "the finish line is marked with a checkered banner over road".
    /// </summary>
    public class RoadMarkerTests
    {
        /// <summary>A gentle 4 % climb to the north with a sideways tilt: heights the arrow must follow.</summary>
        static FlatGround Slope() => new FlatGround { Height = xz => 100f + 0.04f * xz.y + 0.02f * xz.x };

        static StageRoute Line(IGround g, params double2[] pts)
        {
            var o = FloatingOrigin.Origin;
            var list = new List<Utm33>();
            foreach (var p in pts) list.Add(new Utm33(o.E + p.x, o.N + p.y));
            return StageRoute.Make(list, g);
        }

        static float DistanceToLine(StageRoute r, float2 p) => r.Nearest(p).Distance;

        [Test]
        public void TheArrowLiesOnTheRoadAheadOfTheCar()
        {
            var g = Slope();
            var r = Line(g, new double2(0, 0), new double2(0, 1000));
            float carS = 200f;
            var car = r.SampleAtDistance(carS);
            var pts = new List<float2>(); var tans = new List<float2>();
            int n = RoadArrow.Path(r, car.XZ, new float2(0, 1), carS, r.Length, RoadArrow.AheadFor(0f), RoadArrow.ShaftLength + RoadArrow.HeadLength, pts, tans);
            Assert.GreaterOrEqual(n, 3);
            Assert.AreEqual(carS + RoadArrow.Near, r.Nearest(pts[0]).S, 0.05f, "the tail 15 m ahead at rest");
            foreach (var p in pts) Assert.Less(DistanceToLine(r, p), 0.05f, "on the route line");
            var verts = new List<Vector3>(); var cols = new List<Color32>(); var nrm = new List<Vector3>(); var uv = new List<Vector2>(); var tri = new List<int>();
            var carPos = new float3(car.XZ.x, g.HeightAt(car.XZ), car.XZ.y);
            RoadArrow.Build(g, carPos, pts, tans, verts, cols, nrm, uv, tri, out var tail, out var tip);
            foreach (var v in verts) Assert.AreEqual(g.HeightAt(new float2(v.x, v.z)) + RoadArrow.Lift, v.y, 1e-3f, "every vertex on the road surface (slope and tilt)");
            Assert.Greater(tip.z, tail.z, "pointing along the route");
            Assert.AreEqual(RoadArrow.ShaftLength + RoadArrow.HeadLength, math.distance(tail.xz, tip.xz), RoadArrow.Step);
            Assert.That(tri.Count, Is.GreaterThan(0).And.EqualTo(tri.Count / 3 * 3));
            Assert.AreEqual(RoadArrow.Far, RoadArrow.AheadFor(40f), 1e-4f, "further ahead at speed, at most 30 m");
            Assert.That(RoadArrow.AheadFor(15f), Is.InRange(RoadArrow.Near + 1f, RoadArrow.Far - 1f));
            // The chase camera (6.5 m back, 2.4 m up) sees the road from ~10 m over a coupé, only from ~30 m over the Ranger.
            Assert.Less(RoadArrow.SeenOver(1.3f, 6.5f, 2.4f), RoadArrow.Near);
            Assert.That(RoadArrow.SeenOver(1.95f, 6.5f, 2.4f), Is.InRange(28f, RoadArrow.Far + 10f));
        }

        [Test]
        public void TheArrowBendsWithTheNextTurn()
        {
            var g = new FlatGround();
            foreach (int side in new[] { -1, 1 })   // a left bend, then a right one
            {
                // a tight corner (short legs at the corner keep the smoothing from rounding it over 100 m)
                var r = Line(g, new double2(0, 0), new double2(0, 390), new double2(0, 400), new double2(-10 * side, 400), new double2(-400 * side, 400));
                var turns = PaceNotes.FindTurns(r.Samples);
                Assert.GreaterOrEqual(turns.Count, 1);
                var turn = turns[0];
                foreach (var t in turns) if (math.abs(t.Angle) > math.abs(turn.Angle)) turn = t;
                float carS = turn.S - RoadArrow.Near - 6f;   // the arrow spans the apex
                var car = r.SampleAtDistance(carS);
                var pts = new List<float2>(); var tans = new List<float2>();
                RoadArrow.Path(r, car.XZ, new float2(0, 1), carS, r.Length, RoadArrow.Near, RoadArrow.ShaftLength + RoadArrow.HeadLength, pts, tans);
                float bend = PaceNotes.TurnAngle(tans[0], tans[tans.Count - 1]);
                Assert.AreEqual(math.sign(turn.Angle), math.sign(bend), $"the tip turns the way of the pace note ({turn.Angle:F0}°): {bend:F0}°");
                Assert.Greater(math.abs(bend), 20f, "it bends with the corner");
                foreach (var p in pts) Assert.Less(DistanceToLine(r, p), 0.05f);
            }
        }

        [Test]
        public void TheArrowEndsAtTheFinishAndFadesNearTheCar()
        {
            var g = new FlatGround();
            var r = Line(g, new double2(0, 0), new double2(0, 500));
            float end = r.Length - GameController.FinishBefore;
            var pts = new List<float2>(); var tans = new List<float2>();
            var car = r.SampleAtDistance(end - 10f);
            Assert.AreEqual(0, RoadArrow.Path(r, car.XZ, new float2(0, 1), end - 10f, end, RoadArrow.Near, 12.5f, pts, tans), "nothing past the finish line");
            // A car right behind the arrow (the path forced to start 2 m ahead): the vertices next to it are transparent.
            car = r.SampleAtDistance(100f);
            RoadArrow.Path(r, car.XZ, new float2(0, 1), 100f, end, 2f, 12.5f, pts, tans);
            var verts = new List<Vector3>(); var cols = new List<Color32>(); var nrm = new List<Vector3>(); var uv = new List<Vector2>(); var tri = new List<int>();
            RoadArrow.Build(g, new float3(car.XZ.x, 0f, car.XZ.y), pts, tans, verts, cols, nrm, uv, tri, out _, out _);
            for (int i = 0; i < verts.Count; i++)
            {
                float d = math.distance(new float2(verts[i].x, verts[i].z), car.XZ);
                if (d < RoadArrow.FadeNear - 0.5f) Assert.AreEqual(0, cols[i].a, $"vertex {d:F1} m from the car");
                if (d > RoadArrow.FadeNear + 6.5f) Assert.Greater(cols[i].a, 150);
            }
        }

        /// <summary>Free drive: a round road (radius 120 m) as the road network; no line, Nearest gives the road's direction.</summary>
        sealed class RingRoad : IRoute
        {
            public string Name => "ring";
            public float Length => 0f;
            public float RoadWidth => 3f;
            public float CutHalf => 4f;
            public Surface Surface => Surface.Asphalt;
            public bool Free => true;
            public RouteQuery Nearest(float2 xz, float limit = 120f)
            {
                float r = math.length(xz);
                var p = xz / r * 120f;
                float d = math.abs(r - 120f);
                if (d > limit) return RouteQuery.None(xz);
                var t = new float2(-p.y, p.x) / 120f;   // anticlockwise
                return new RouteQuery { Distance = d, Point = p, Tangent = t, HalfWidth = 3f, Surface = Surface.Asphalt };
            }
            public RoutePose StartPose() => default;
            public RoutePose SampleAtDistance(float s) => default;
        }

        [Test]
        public void InFreeDriveTheArrowFollowsTheRoadTheCarIsOn()
        {
            var ring = new RingRoad();
            var pts = new List<float2>(); var tans = new List<float2>();
            var at = new float2(120f, 0f);
            foreach (int dir in new[] { 1, -1 })   // facing anticlockwise, then clockwise
            {
                int n = RoadArrow.Path(ring, at, new float2(0, dir), 0f, float.PositiveInfinity, RoadArrow.Near, 12.5f, pts, tans);
                Assert.GreaterOrEqual(n, 3);
                foreach (var p in pts) Assert.AreEqual(120f, math.length(p), 0.05f, "on the road");
                float a0 = math.atan2(pts[0].y, pts[0].x), a1 = math.atan2(pts[n - 1].y, pts[n - 1].x);
                Assert.AreEqual(RoadArrow.Near / 120f * dir, a0, 0.02f, "15 m ahead along the road");
                Assert.AreEqual(math.sign(dir), math.sign(a1 - a0), "the way the car faces");
                Assert.Greater(math.dot(tans[n - 1], new float2(-pts[n - 1].y, pts[n - 1].x) * dir), 0f);
            }
            Assert.AreEqual(0, RoadArrow.Path(ring, new float2(400f, 0f), new float2(0, 1), 0f, float.PositiveInfinity, RoadArrow.Near, 12.5f, pts, tans), "no road, no arrow");
        }

        [Test]
        public void TheFinishGateSpansTheRoadAtTheFinishLine()
        {
            var g = Slope();
            var r = Line(g, new double2(0, 0), new double2(300, 600));
            float fs = r.Length - GameController.FinishBefore;
            var p = r.SampleAtDistance(fs);
            const float half = RoadConstants.TwoLaneHalf;
            var l = FinishGate.Place(p.XZ, p.Yaw, half, g);
            Assert.Less(math.distance(l.Centre, p.XZ), 0.01f, "centred on the route at the finish distance");
            Assert.AreEqual(g.HeightAt(p.XZ), l.RoadY, 1e-4f);
            Assert.Greater(l.PostOffset, half + RoadConstants.RoadShoulder, "posts outside the carriageway and its shoulder");
            Assert.Less(l.PostOffset, RoadConstants.FlatHalf(half) + RoadConstants.CarveApron, "on the flat apron, not in the ditch");
            Assert.AreEqual(0f, Vector2.Angle(l.Right, (Vector2)(float2)(l.RightPost - l.LeftPost)), 1e-3f);
            Assert.AreEqual(0f, math.dot(l.Right, (float2)new float2(math.sin(p.Yaw), math.cos(p.Yaw))), 1e-4f, "across the road");
            Assert.GreaterOrEqual(l.BannerBottom - l.RoadY, FinishGate.Clearance - 1e-4f, "every car passes under (the Ranger is 2 m tall)");

            var gate = new FinishGate(null, null);
            try
            {
                gate.Refresh(p.XZ, p.Yaw, half, g);
                int solid = RallyLayers.SolidMask;
                var road = new Vector3(p.XZ.x, l.RoadY + 1f, p.XZ.y);
                var rot = Quaternion.Euler(0f, math.degrees(p.Yaw), 0f);
                Assert.IsFalse(Physics.CheckBox(road, new Vector3(half + RoadConstants.RoadShoulder, 0.9f, 1.5f), rot, solid), "the carriageway and its shoulders are clear");
                foreach (var post in new[] { l.LeftPost, l.RightPost })
                    Assert.IsTrue(Physics.CheckBox(new Vector3(post.x, g.HeightAt(post) + 1f, post.y), Vector3.one * 0.1f, rot, solid), "a post is solid for the car");
                var colliders = gate.Root.GetComponentsInChildren<BoxCollider>();
                Assert.AreEqual(2, colliders.Length);
                foreach (var c in colliders) Assert.AreEqual(RallyLayers.Buildings, c.gameObject.layer);
                // The road graded again under it: the gate follows.
                g.Height = xz => 103f + 0.04f * xz.y + 0.02f * xz.x;
                gate.Refresh(p.XZ, p.Yaw, half, g);
                Assert.AreEqual(g.HeightAt(p.XZ), gate.Current.RoadY, 1e-4f);
                Assert.AreEqual(gate.Current.RoadY + FinishGate.Clearance, gate.Current.BannerBottom, 1e-4f);
            }
            finally { gate.Dispose(); }
        }

        /// <summary>A straight tube along +z: floor 50 m, crown 6.6 m, the arch down to 4.2 m at the walls 7 m out.</summary>
        sealed class Tube : IGround, ILayeredGround
        {
            public float ReferenceY { get; set; } = float.NaN;
            public float HeightAt(float2 xz) => 50f;
            public Surface SurfaceAt(float2 xz) => Surface.Asphalt;
            public WaterSample WaterAt(float2 xz) => WaterSample.Dry;
            public bool IsLoaded(float2 xz) => true;
            public bool TunnelAt(float2 xz, out TunnelSpot spot)
            {
                spot = default;
                if (math.abs(xz.x) > 7f) return false;
                spot.Floor = 50f; spot.Crown = 56.6f; spot.Roof = 56.6f - 2.4f * (xz.x / 7f) * (xz.x / 7f);
                spot.Centre = new float2(0f, xz.y); spot.Tangent = new float2(0, 1); spot.Lateral = -xz.x; spot.Half = 7f;
                return true;
            }
        }

        [Test]
        public void InATunnelTheGateStaysUnderTheRoof()
        {
            var l = FinishGate.Place(new float2(0f, 10f), 0f, RoadConstants.TwoLaneHalf, new Tube());
            Assert.IsTrue(l.InTunnel);
            Assert.Less(l.PostOffset, 7f, "posts inside the walls");
            var tube = new Tube();
            tube.TunnelAt(l.RightPost, out var atPost);
            Assert.LessOrEqual(l.BannerBottom + FinishGate.BannerHeight, atPost.Roof, "the banner under the arch");
            Assert.GreaterOrEqual(l.BannerBottom - l.RoadY, FinishGate.MinClearance - 1e-3f);
        }
    }
}
