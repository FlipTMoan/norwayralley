using Rally.Core;
using Unity.Mathematics;

namespace Rally.Actors
{
    public enum ActorState : byte { Idle, Alert, Cross, Flee, Stop, Hit, Done }

    /// <summary>
    /// A pure-C# crossing: the actor waits on its verge, notices the car at AlertDistance, then either
    /// crosses the road (most animals), stands in it (sheep, tractor) or bolts away. It leaves the road at
    /// run speed when the car gets close, which is the "near miss" the driver is rewarded for. No NavMesh:
    /// the path is a straight line across the road from the plan's side to the other verge.
    /// </summary>
    public sealed class CrossingActor
    {
        public readonly ActorSpec Spec;
        public readonly SpawnPlan Plan;
        public RoadPoint Road;              // where the crossing line meets the road
        public ActorState State = ActorState.Idle;
        public float2 Pos;                  // planar world position
        public float Heading;               // rad, car yaw sense
        public float Speed;                 // m/s, for animation
        public float HitSpeed;              // car speed at impact, for the penalty
        float2 start, end;                  // the two verges
        readonly bool crosses;
        float timer;

        public CrossingActor(ActorSpec spec, SpawnPlan plan, RoadPoint road, ref RallyRandom rng)
        {
            Spec = spec; Plan = plan; Road = road;
            float2 left = road.Left;
            start = road.Xz + left * plan.Side * (road.HalfWidth + plan.Offset);
            end = road.Xz - left * plan.Side * (road.HalfWidth + 4f);
            Pos = start;
            Heading = math.atan2(end.x - start.x, end.y - start.y);
            crosses = rng.NextFloat() < spec.CrossChance;
        }

        /// <summary>Advance by dt given the car's planar position and speed (m/s). Returns true on a new hit.</summary>
        public bool Update(float dt, float2 car, float carSpeed, float carRadius)
        {
            float dist = math.distance(car, Pos);
            switch (State)
            {
                case ActorState.Idle:
                    if (dist < Spec.AlertDistance) { State = ActorState.Alert; timer = 0.3f + 0.4f * (1 - Plan.SpeedFactor); }
                    break;
                case ActorState.Alert:
                    timer -= dt;
                    if (timer <= 0) State = crosses ? ActorState.Cross : ActorState.Stop;
                    break;
                case ActorState.Cross:
                    Speed = Spec.WalkSpeed * Plan.SpeedFactor;
                    // Panic when the car is nearly on top of it: run the rest of the way.
                    if (dist < 25f && carSpeed > 5f) { State = ActorState.Flee; Speed = Spec.RunSpeed * Plan.SpeedFactor; break; }
                    if (MoveTowards(end, Speed, dt)) State = ActorState.Done;
                    break;
                case ActorState.Flee:
                    Speed = Spec.RunSpeed * Plan.SpeedFactor;
                    if (MoveTowards(end, Speed, dt)) State = ActorState.Done;
                    break;
                case ActorState.Stop:
                    // Stands in the road (a sheep, a tractor) until the car slows to a crawl, then ambles off.
                    Speed = 0;
                    if (OnRoad())
                    {
                        if (carSpeed < 4f && dist < 20f) State = ActorState.Cross;
                    }
                    else if (MoveTowards(Road.Xz, Spec.WalkSpeed, dt)) { /* reached the middle, stands */ }
                    break;
                case ActorState.Hit:
                case ActorState.Done:
                    Speed = 0;
                    return false;
            }
            if (State != ActorState.Hit && dist < Spec.Radius + carRadius)
            {
                State = ActorState.Hit; HitSpeed = carSpeed; Speed = 0;
                return true;
            }
            return false;
        }

        /// <summary>FloatingOrigin rebase: every world-frame point moves by −delta (the manager calls this for its live actors).</summary>
        public void Shift(float2 delta)
        {
            Pos -= delta; start -= delta; end -= delta;
            Road = new RoadPoint(Road.Xz - delta, Road.Heading, Road.HalfWidth);
        }

        bool OnRoad()
        {
            float2 rel = Pos - Road.Xz;
            return math.abs(math.dot(rel, Road.Left)) <= Road.HalfWidth;
        }

        bool MoveTowards(float2 target, float speed, float dt)
        {
            float2 d = target - Pos;
            float len = math.length(d);
            if (len < 0.05f) return true;
            float step = math.min(len, speed * dt);
            Pos += d / len * step;
            Heading = math.atan2(d.x, d.y);
            return step >= len;
        }
    }
}
