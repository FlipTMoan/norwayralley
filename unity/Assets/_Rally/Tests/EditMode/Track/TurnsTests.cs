using System.Collections.Generic;
using NUnit.Framework;
using Rally.Track;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Track
{
    /// <summary>
    /// Port of legacy-js/tests/turns.test.mjs. Positive = left on screen; in the Unity frame (x east, z north)
    /// a left bend when heading +z turns towards −x, so the course here mirrors the JS one (see PaceNotes).
    /// </summary>
    public class TurnsTests
    {
        /// <summary>A polyline sampled every 2 m: straight 300 m along +z, a 90° left bend (towards −x), 200 m straight, a hairpin right, back.</summary>
        static List<RouteSample> Course()
        {
            var pts = new List<RouteSample>();
            double x = 0, z = 0, yaw = 0; float s = 0;
            void Push() => pts.Add(new RouteSample(x, z, s));
            void Step(int n, double dyaw = 0)
            {
                for (int i = 0; i < n; i++)
                {
                    yaw += dyaw;
                    x -= math.sin(yaw) * 2; z += math.cos(yaw) * 2; s += 2; // positive yaw here = left = towards −x
                    Push();
                }
            }
            Push();
            Step(150);                          // 300 m straight
            Step(20, (math.PI_DBL / 2) / 20);   // 90° left over 40 m
            Step(100);                          // 200 m straight
            Step(16, -math.PI_DBL / 16);        // 180° right over 32 m
            Step(100);
            return pts;
        }

        [Test]
        public void ALeftBendHasAPositiveAngle()
        {
            Assert.Greater(PaceNotes.TurnAngle(new float2(0, 1), new float2(-1, 1)), 0f, "heading +z (north) then bending to −x (west) is left");
            Assert.Less(PaceNotes.TurnAngle(new float2(0, 1), new float2(1, 1)), 0f, "bending to +x is right");
        }

        [Test]
        public void FindTurnsPicksTheTwoBendsTheirDirectionAndSeverity()
        {
            var turns = PaceNotes.FindTurns(Course());
            Assert.AreEqual(2, turns.Count);
            var first = turns[0]; var second = turns[1];
            Assert.IsTrue(first.Angle > 60f && first.Angle < 120f, $"left bend ~90°: {first.Angle}");
            Assert.AreEqual(TurnSeverity.Medium, first.Severity);
            Assert.Less(math.abs(first.Entry - 300f), 20f, $"first bend starts near 300 m: {first.Entry}");
            Assert.Less(second.Angle, -150f, $"hairpin ~180° to the right: {second.Angle}");
            Assert.AreEqual(TurnSeverity.Hairpin, second.Severity);
        }

        [Test]
        public void NextTurnAndRoundedDistanceGiveTheHudItsNote()
        {
            var turns = PaceNotes.FindTurns(Course());
            int first = PaceNotes.NextTurn(turns, 0f);
            Assert.AreEqual(0, first);
            Assert.AreEqual(300, PaceNotes.RoundedDistance(turns[first], 0f));
            Assert.AreEqual(150, PaceNotes.RoundedDistance(turns[first], 160f), "140 m rounds to 150");
            Assert.AreEqual(0, PaceNotes.RoundedDistance(turns[first], 290f), "inside the entry: 0");
            Assert.AreEqual(1, PaceNotes.NextTurn(turns, 350f), "past the first bend the hairpin is next");
            Assert.AreEqual(-1, PaceNotes.NextTurn(turns, 0f, 100f), "nothing within 100 m");
            Assert.AreEqual(-1, PaceNotes.NextTurn(turns, 10000f), "nothing after the finish");
        }
    }
}
