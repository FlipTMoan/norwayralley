using NUnit.Framework;
using Rally.Actors;
using Rally.Core;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Actors
{
    public class SpawnRulesTests
    {
        static CoverKind Forest(float s, float side) => CoverKind.Forest;

        [Test]
        public void PlansAreDeterministicPerSeedAndSector()
        {
            var a = SpawnRules.Plan(42, 1, 0, 5000, Forest, _ => false, 59, 2);
            var b = SpawnRules.Plan(42, 1, 0, 5000, Forest, _ => false, 59, 2);
            var c = SpawnRules.Plan(43, 1, 0, 5000, Forest, _ => false, 59, 2);
            Assert.AreEqual(a.Count, b.Count);
            for (int i = 0; i < a.Count; i++) { Assert.AreEqual(a[i].S, b[i].S); Assert.AreEqual(a[i].Kind, b[i].Kind); }
            Assert.IsTrue(a.Count > 0, "a 5 km forest sector has encounters");
            Assert.IsFalse(a.Count == c.Count && a[0].S == c[0].S, "another seed gives another plan");
        }

        [Test]
        public void CoverDecidesWhoCrosses()
        {
            var forest = SpawnRules.Plan(7, 0, 0, 20000, Forest, _ => false, 59, 3);
            foreach (var p in forest) Assert.That(p.Kind, Is.AnyOf(ActorKind.Moose, ActorKind.Deer, ActorKind.Sheep));
            var north = SpawnRules.Plan(7, 0, 0, 20000, (s, side) => CoverKind.OpenFjell, _ => false, 69, 3);
            Assert.IsTrue(north.Exists(p => p.Kind == ActorKind.Reindeer), "reindeer north of 65°");
            var south = SpawnRules.Plan(7, 0, 0, 20000, (s, side) => CoverKind.OpenFjell, _ => false, 59, 3);
            Assert.IsFalse(south.Exists(p => p.Kind == ActorKind.Reindeer), "no reindeer in the south");
            var water = SpawnRules.Plan(7, 0, 0, 20000, (s, side) => CoverKind.Water, _ => false, 59, 3);
            Assert.AreEqual(0, water.Count);
            var town = SpawnRules.Plan(7, 0, 0, 20000, (s, side) => CoverKind.Settlement, _ => true, 59, 3);
            Assert.IsTrue(town.Exists(p => p.Kind == ActorKind.Cyclist || p.Kind == ActorKind.Pedestrian));
        }

        [Test]
        public void EncountersKeepTheirGapAndStayInsideTheSector()
        {
            var plans = SpawnRules.Plan(1, 3, 1000, 6000, Forest, _ => false, 59, 4);
            for (int i = 1; i < plans.Count; i++) Assert.GreaterOrEqual(plans[i].S - plans[i - 1].S, 150f);
            foreach (var p in plans) { Assert.GreaterOrEqual(p.S, 1100f); Assert.LessOrEqual(p.S, 5950f); }
        }
    }

    public class CrossingActorTests
    {
        static RoadPoint Road => new RoadPoint(new float2(0, 500), 0f, 3f); // heading north, 6 m wide

        static CrossingActor Make(ActorSpec spec, float side = 1, ulong seed = 5)
        {
            var rng = new RallyRandom(seed);
            var plan = new SpawnPlan { Kind = spec.Kind, S = 500, Side = side, Offset = 6, SpeedFactor = 1 };
            return new CrossingActor(spec, plan, Road, ref rng);
        }

        [Test]
        public void WaitsOnTheVergeThenCrossesToTheOtherSide()
        {
            var moose = Make(ActorSpec.Moose);
            Assert.AreEqual(ActorState.Idle, moose.State);
            Assert.Less(moose.Pos.x, -3f, "starts on the left verge (left is −x when heading +z)");
            // Car far away: nothing happens.
            moose.Update(1f, new float2(0, 0), 20f, 1f);
            Assert.AreEqual(ActorState.Idle, moose.State);
            // Car within 120 m: alert, then crossing.
            for (int i = 0; i < 600 && moose.State != ActorState.Done; i++)
                moose.Update(1f / 60, new float2(0, 400), 0f, 1f);
            Assert.AreEqual(ActorState.Done, moose.State);
            Assert.Greater(moose.Pos.x, 3f, "ends on the right verge");
        }

        [Test]
        public void ACloseFastCarMakesItRun()
        {
            var deer = Make(ActorSpec.Deer, seed: 11);
            deer.Update(1f / 60, new float2(0, 420), 30f, 1f);
            for (int i = 0; i < 60; i++) deer.Update(1f / 60, new float2(0, 420), 30f, 1f);
            Assert.That(deer.State, Is.AnyOf(ActorState.Cross, ActorState.Stop, ActorState.Flee));
            deer.Update(1f / 60, new float2(0, 480), 30f, 1f);
            if (deer.State == ActorState.Flee) Assert.AreEqual(ActorSpec.Deer.RunSpeed, deer.Speed, 1e-3f);
        }

        [Test]
        public void HitFiresOnceAndStopsTheActor()
        {
            var sheep = Make(ActorSpec.Sheep);
            sheep.Pos = new float2(0, 500);
            Assert.IsTrue(sheep.Update(1f / 60, new float2(0, 500.5f), 15f, 1f));
            Assert.AreEqual(ActorState.Hit, sheep.State);
            Assert.AreEqual(15f, sheep.HitSpeed);
            Assert.IsFalse(sheep.Update(1f / 60, new float2(0, 500.5f), 15f, 1f), "no second hit");
        }
    }

    public class ActorManagerTests
    {
        [Test]
        public void SpawnsAheadRetiresBehindAndReportsHits()
        {
            var mgr = new ActorManager(9, s => new RoadPoint(new float2(0, s), 0f, 3f));
            int spawned = 0, retired = 0, hits = 0;
            mgr.Spawned += _ => spawned++;
            mgr.Retired += _ => retired++;
            mgr.Hit += h => hits++;
            mgr.AddPlans(new[] { new SpawnPlan { Kind = ActorKind.Sheep, S = 1000, Side = 1, Offset = 2, SpeedFactor = 1 } });
            mgr.Update(1f / 60, 0, new float2(0, 0), 20, 1);
            Assert.AreEqual(0, spawned, "1000 m ahead is beyond SpawnAhead");
            mgr.Update(1f / 60, 700, new float2(0, 700), 20, 1);
            Assert.AreEqual(1, spawned);
            var a = mgr.Live[0];
            a.Pos = new float2(0, 1000);
            mgr.Update(1f / 60, 1000, new float2(0, 1000), 20, 1);
            Assert.AreEqual(1, hits);
            mgr.Update(1f / 60, 1200, new float2(0, 1200), 20, 1);
            Assert.AreEqual(1, retired);
            Assert.AreEqual(0, mgr.Live.Count);
        }
    }
}
