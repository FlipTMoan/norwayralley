using NUnit.Framework;
using Rally.Actors;
using Rally.Core;
using Rally.Gameplay;

namespace Rally.Tests.Edit.Gameplay
{
    public class GameFlowTests
    {
        [Test]
        public void PhasesRunLoadingIntroCountdownRacingFinished()
        {
            var g = new GameFlow();
            Assert.AreEqual(Phase.Loading, g.Phase);
            g.StartEngine();
            Assert.AreEqual(Phase.Loading, g.Phase, "no start before the world is ready");
            g.WorldReady(); g.StartEngine();
            Assert.AreEqual(Phase.Countdown, g.Phase);
            g.Update(3.5f);
            Assert.AreEqual(Phase.Racing, g.Phase);
            g.Update(10f);
            g.Finish();
            Assert.AreEqual(Phase.Finished, g.Phase);
            Assert.AreEqual(10f, g.StageTime, 1e-4f);
        }

        [Test]
        public void HitsAddPenaltyNearMissesTakeASecondBackAndAWreckRetires()
        {
            var g = new GameFlow();
            g.WorldReady(); g.StartEngine(); g.Update(3f);
            g.OnHit(new ActorHit(ActorKind.Moose, 22.2f, 20f, 450f));
            Assert.AreEqual(20f, g.PenaltyTime);
            g.OnNearMiss();
            Assert.AreEqual(19f, g.PenaltyTime);
            g.Retire();
            Assert.IsTrue(g.Retired); Assert.AreEqual(Phase.Finished, g.Phase);
        }
    }

    public class ShareLinksTests
    {
        [Test]
        public void RoundTripsTheJsFormats()
        {
            var a = new LatLon(59.0320, 6.0650); var b = new LatLon(59.0180, 6.0400);
            var q = ShareLinks.Osrm(a, b, "cycling");
            Assert.AreEqual("?route=osrm:59.032,6.065;59.018,6.04;cycling", q);
            var l = ShareLinks.Parse(q).Value;
            Assert.AreEqual(ShareLinks.Kind.Osrm, l.Kind);
            Assert.AreEqual(a.Lat, l.A.Lat, 1e-9); Assert.AreEqual(b.Lon, l.B.Lon, 1e-9); Assert.AreEqual("cycling", l.Profile);
            Assert.AreEqual("driving", ShareLinks.Parse("?route=osrm:59,6;59.1,6.1;bogus").Value.Profile, "unknown profile falls back to driving");
            var demo = ShareLinks.Parse("?route=demo:58.98634,6.19051;58.99,6.2").Value;
            Assert.AreEqual(ShareLinks.Kind.Demo, demo.Kind);
            var d = ShareLinks.Parse("?drive=59.025,6.05").Value;
            Assert.AreEqual(ShareLinks.Kind.Free, d.Kind); Assert.AreEqual(6.05, d.A.Lon, 1e-9);
            Assert.AreEqual(ShareLinks.Kind.Free, ShareLinks.Parse("?route=osrm:59,6;59.1,6.1&drive=59.025,6.05").Value.Kind, "drive wins like parseShare");
            var e = ShareLinks.Parse(ShareLinks.Endless(0xBEEF, a)).Value;
            Assert.AreEqual(ShareLinks.Kind.Endless, e.Kind); Assert.AreEqual(0xBEEFUL, e.Seed);
            Assert.IsNull(ShareLinks.Parse("?x=1"));
            Assert.IsNull(ShareLinks.Parse("?route=osrm:a,b;c,d"));
            Assert.IsNull(ShareLinks.Parse("?drive=95,6"), "latitude out of range");
        }
    }
}
