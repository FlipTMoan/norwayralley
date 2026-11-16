using Unity.Mathematics;

namespace Rally.Actors
{
    public enum ActorKind : byte { Moose, Deer, Sheep, Reindeer, Pedestrian, Dog, Cyclist, Tractor }

    /// <summary>Land cover classes the spawn rules read under the road ahead (from the World's landcover raster).</summary>
    public enum CoverKind : byte { Unknown, Forest, Pasture, OpenFjell, Settlement, Water, Bog }

    /// <summary>
    /// Everything a crossing actor needs per kind. Speeds are real-world walking/running speeds; the
    /// penalty is seconds added to the stage time on a hit (plus damage in Rally.Gameplay). Alert distance is
    /// how far away the car is when the animal notices it and decides to cross — the surprise factor.
    /// </summary>
    public sealed class ActorSpec
    {
        public ActorKind Kind;
        public float Radius;          // collision disc, m
        public float WalkSpeed;       // m/s while crossing calmly
        public float RunSpeed;        // m/s when fleeing
        public float AlertDistance;   // m from the car at which it starts to cross
        public float CrossChance;     // 0..1 that an alerted actor crosses instead of standing
        public float PenaltySeconds;
        public float Mass;            // kg, used for the car's speed loss on a hit
        public string Prefab;         // Addressables key, assigned in the editor

        public static readonly ActorSpec Moose = new ActorSpec { Kind = ActorKind.Moose, Radius = 1.1f, WalkSpeed = 1.6f, RunSpeed = 9f, AlertDistance = 120f, CrossChance = 0.75f, PenaltySeconds = 20f, Mass = 450f, Prefab = "actor_moose" };
        public static readonly ActorSpec Deer = new ActorSpec { Kind = ActorKind.Deer, Radius = 0.6f, WalkSpeed = 1.5f, RunSpeed = 12f, AlertDistance = 90f, CrossChance = 0.85f, PenaltySeconds = 10f, Mass = 90f, Prefab = "actor_deer" };
        public static readonly ActorSpec Sheep = new ActorSpec { Kind = ActorKind.Sheep, Radius = 0.5f, WalkSpeed = 0.9f, RunSpeed = 4f, AlertDistance = 40f, CrossChance = 0.5f, PenaltySeconds = 8f, Mass = 70f, Prefab = "actor_sheep" };
        public static readonly ActorSpec Reindeer = new ActorSpec { Kind = ActorKind.Reindeer, Radius = 0.7f, WalkSpeed = 1.4f, RunSpeed = 10f, AlertDistance = 150f, CrossChance = 0.8f, PenaltySeconds = 12f, Mass = 120f, Prefab = "actor_reindeer" };
        public static readonly ActorSpec Pedestrian = new ActorSpec { Kind = ActorKind.Pedestrian, Radius = 0.4f, WalkSpeed = 1.3f, RunSpeed = 4f, AlertDistance = 60f, CrossChance = 0.6f, PenaltySeconds = 60f, Mass = 75f, Prefab = "actor_pedestrian" };
        public static readonly ActorSpec Dog = new ActorSpec { Kind = ActorKind.Dog, Radius = 0.35f, WalkSpeed = 2f, RunSpeed = 8f, AlertDistance = 50f, CrossChance = 0.9f, PenaltySeconds = 15f, Mass = 25f, Prefab = "actor_dog" };
        public static readonly ActorSpec Cyclist = new ActorSpec { Kind = ActorKind.Cyclist, Radius = 0.6f, WalkSpeed = 5f, RunSpeed = 7f, AlertDistance = 200f, CrossChance = 0.3f, PenaltySeconds = 45f, Mass = 90f, Prefab = "actor_cyclist" };
        public static readonly ActorSpec Tractor = new ActorSpec { Kind = ActorKind.Tractor, Radius = 1.6f, WalkSpeed = 3f, RunSpeed = 3f, AlertDistance = 80f, CrossChance = 1f, PenaltySeconds = 30f, Mass = 3500f, Prefab = "actor_tractor" };

        public static ActorSpec For(ActorKind kind) => kind switch
        {
            ActorKind.Moose => Moose, ActorKind.Deer => Deer, ActorKind.Sheep => Sheep, ActorKind.Reindeer => Reindeer,
            ActorKind.Pedestrian => Pedestrian, ActorKind.Dog => Dog, ActorKind.Cyclist => Cyclist, _ => Tractor,
        };
    }

    /// <summary>A point on the route the actors use: planar position, heading (rad, car yaw sense) and road half width.</summary>
    public readonly struct RoadPoint
    {
        public readonly float2 Xz;
        public readonly float Heading;
        public readonly float HalfWidth;
        public RoadPoint(float2 xz, float heading, float halfWidth) { Xz = xz; Heading = heading; HalfWidth = halfWidth; }
        /// <summary>Unit vector to the road's left, matching the car's right() = (cos yaw, −sin yaw) in car.js.</summary>
        public float2 Left => new float2(-math.cos(Heading), math.sin(Heading));
        public float2 Forward => new float2(math.sin(Heading), math.cos(Heading));
    }
}
