using NUnit.Framework;
using Rally.Core;
using Rally.Track;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Track
{
    /// <summary>StageRoute: samples every 4 m with cumulative s, nearest against the closest segment, poses.</summary>
    public class StageRouteTests
    {
        static StageRoute Straight(Surface surface = Surface.Gravel)
            => StageRoute.Make(new[] { new Utm33(0, -500), new Utm33(0, 500) }, new FlatGround { Height = xz => 100f + 0.1f * xz.y }, roadWidth: 3.4f, surface: surface);

        [Test]
        public void SamplesEveryFourMetresWithCumulativeDistance()
        {
            var r = Straight();
            Assert.Greater(r.Samples.Length, 240);
            Assert.AreEqual(1000f, r.Length, 1.5f);
            Assert.AreEqual(4f, r.Samples[1].S - r.Samples[0].S, 0.01f);
            Assert.AreEqual(r.Samples[1].S, r.MeanSpacing(), 0.05f);
        }

        [Test]
        public void NearestMeasuresAgainstTheSegmentNotTheSample()
        {
            var r = Straight(Surface.Asphalt);
            var q = r.Nearest(new float2(3f, 101f));          // between two samples, 3 m to the +x side
            Assert.IsTrue(q.Hit);
            Assert.AreEqual(3f, q.Distance, 0.01f);
            Assert.AreEqual(601f, q.S, 0.5f);
            Assert.AreEqual(0.601f, q.Progress, 0.002f);
            Assert.AreEqual(Surface.Asphalt, q.Surface);
            Assert.AreEqual(0f, q.Heading, 1e-4f);
            Assert.AreEqual(3.4f, q.HalfWidth);
            Assert.Less(q.Side, 0f, "+x of a road heading +z is the right side (negative, the left normal is (−tz, tx))");
            Assert.AreEqual(100f + 0.1f * 101f, q.RoadY, 0.05f);
            var far = r.Nearest(new float2(5000f, 5000f), 40f);
            Assert.IsTrue(far.Hit, "a stage is one line: far away the whole line is scanned");
            Assert.Greater(far.Distance, 4000f);
        }

        [Test]
        public void StartPoseAndSampleAtDistanceFollowTheLine()
        {
            var r = Straight();
            var start = r.StartPose();
            Assert.AreEqual(-500f, start.XZ.y, 0.01f);
            Assert.AreEqual(0f, start.Yaw, 1e-4f);
            var p = r.SampleAtDistance(250f);
            Assert.AreEqual(-250f, p.XZ.y, 0.5f);
            Assert.AreEqual(0f, p.Yaw, 1e-4f);
            var gate = r.Gate(true, new FlatGround { Height = _ => 1f });
            Assert.AreEqual(3.4f * 2f + 2.6f, gate.Width, 1e-4f);
            var posts = new System.Collections.Generic.List<PostMarker>();
            Assert.Greater(r.Posts(posts, new FlatGround()), 30);
            Assert.AreNotEqual(posts[0].Red, posts[1].Red, "posts alternate sides");
        }
    }
}
