using System;
using System.Collections.Generic;
using Rally.Core;
using Unity.Mathematics;

namespace Rally.Actors
{
    /// <summary>A hit the gameplay layer turns into a time penalty, damage and a speed loss.</summary>
    public readonly struct ActorHit
    {
        public readonly ActorKind Kind;
        public readonly float CarSpeed;
        public readonly float PenaltySeconds;
        public readonly float Mass;
        public ActorHit(ActorKind kind, float carSpeed, float penalty, float mass) { Kind = kind; CarSpeed = carSpeed; PenaltySeconds = penalty; Mass = mass; }
    }

    /// <summary>
    /// Owns the planned encounters of the loaded sectors and the live actors near the car. Spawns an actor
    /// when the car is <see cref="SpawnAhead"/> m before its crossing point (out of sight), updates it every
    /// frame, retires it <see cref="DespawnBehind"/> m behind. Views (prefabs, animation) attach through
    /// <see cref="Spawned"/>/<see cref="Retired"/>; the manager itself never touches Unity objects.
    /// </summary>
    public sealed class ActorManager
    {
        public const float SpawnAhead = 350f;
        public const float DespawnBehind = 80f;
        public const float NearMissDistance = 3f;

        readonly List<SpawnPlan> pending = new List<SpawnPlan>();
        readonly List<CrossingActor> live = new List<CrossingActor>();
        readonly Func<float, RoadPoint> roadAt;
        RallyRandom rng;

        public IReadOnlyList<CrossingActor> Live => live;
        public event Action<CrossingActor> Spawned;
        public event Action<CrossingActor> Retired;
        public event Action<ActorHit> Hit;
        public event Action<CrossingActor> NearMiss;

        public ActorManager(ulong seed, Func<float, RoadPoint> roadAt)
        {
            this.roadAt = roadAt;
            rng = new RallyRandom(seed ^ 0xAC70UL);
        }

        public void AddPlans(IEnumerable<SpawnPlan> plans)
        {
            pending.AddRange(plans);
            pending.Sort((a, b) => a.S.CompareTo(b.S));
        }

        /// <summary>Drop plans behind the car (sectors recycled by the infinite generator).</summary>
        public void ForgetBefore(float s) => pending.RemoveAll(p => p.S < s);

        public void Update(float dt, float carS, float2 carXz, float carSpeed, float carRadius)
        {
            // Spawn everything whose crossing point is within reach ahead.
            while (pending.Count > 0 && pending[0].S - carS < SpawnAhead)
            {
                var plan = pending[0]; pending.RemoveAt(0);
                if (plan.S < carS - 10f) continue;              // already passed (teleport, restart)
                var actor = new CrossingActor(ActorSpec.For(plan.Kind), plan, roadAt(plan.S), ref rng);
                live.Add(actor);
                Spawned?.Invoke(actor);
            }
            for (int i = live.Count - 1; i >= 0; i--)
            {
                var a = live[i];
                bool wasNear = a.State == ActorState.Cross || a.State == ActorState.Flee;
                if (a.Update(dt, carXz, carSpeed, carRadius))
                    Hit?.Invoke(new ActorHit(a.Spec.Kind, a.HitSpeed, a.Spec.PenaltySeconds, a.Spec.Mass));
                else if (wasNear && a.State == ActorState.Done && math.distance(carXz, a.Pos) < NearMissDistance + a.Spec.Radius + carRadius)
                    NearMiss?.Invoke(a);
                if (a.Plan.S < carS - DespawnBehind)
                {
                    live.RemoveAt(i);
                    Retired?.Invoke(a);
                }
            }
        }

        public void Clear()
        {
            foreach (var a in live) Retired?.Invoke(a);
            live.Clear(); pending.Clear();
        }
    }
}
