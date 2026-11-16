using System;
using Rally.Core;
using Rally.Track;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>
    /// Analytic terrain with a carved straight road: the EditMode stand-in for the JS test terrains
    /// (road-physics.test.mjs slopedTerrain, jump.test.mjs crestTerrain + terrain.carveRoad). The road is the
    /// corridor profile (RoadConstants.ProfileHeight) over the route's sample heights plus the ribbon lift,
    /// exactly what car.js groundAt evaluated; off the corridor it is the analytic ground.
    /// </summary>
    public sealed class RoadGround : IGround
    {
        public Func<float2, float> Base = _ => 0f;
        public StageRoute Route;
        public float Size = 1200f;

        public float HeightAt(float2 xz)
        {
            float ground = Base(xz);
            if (Route == null) return ground;
            var q = Route.Nearest(xz, 40f);
            float half = Route.RoadWidth, cut = Route.CutHalf;
            if (!q.Hit || q.Distance > RoadConstants.CorridorReach(half, cut)) return ground;
            float edge = q.Side >= 0f ? q.EdgeL : q.EdgeR;
            return RoadConstants.ProfileHeight(q.RoadY + RoadConstants.RoadLift, ground, q.Distance, half, cut, edge, q.HasEdges)
                + RoadConstants.SurfaceLift(q.Distance, half);
        }

        public Surface SurfaceAt(float2 xz)
        {
            if (Route == null) return Surface.Offroad;
            var q = Route.Nearest(xz, 40f);
            return q.Hit && q.Distance <= Route.RoadWidth + 1f ? q.Surface : Surface.Offroad;
        }

        public WaterSample WaterAt(float2 xz) => WaterSample.Dry;
        /// <summary>terrain.inside(x, z, 3) in car.js:1156.</summary>
        public bool IsLoaded(float2 xz) => math.abs(xz.x) <= Size / 2f - 3f && math.abs(xz.y) <= Size / 2f - 3f;
    }

    public static class Worlds
    {
        /// <summary>road-physics.test.mjs:157 slopedTerrain: a grade along +z with lateral undulation and small bumps.</summary>
        public static Func<float2, float> Sloped(float size, float grade)
            => xz => 100f + grade * (xz.y + size / 2f) + 3f * math.sin(xz.x / 40f) + 0.8f * math.sin(xz.y / 15f);

        /// <summary>jump.test.mjs:9 crestTerrain: flat ground with a rounded crest across z = 0 and a table-top jump at z = 300.</summary>
        public static Func<float2, float> Crest()
            => xz =>
            {
                float z = xz.y;
                float crest = math.abs(z) < 20f ? 5f - (z * z) / 80f : 0f;            // parabola: curvature 1/40 at the top
                float ramp = z > 260f && z <= 300f ? (z - 260f) * 0.15f : 0f;         // 15 % ramp up to a 6 m drop
                return 100f + crest + ramp;
            };

        /// <summary>ground-contact.test.mjs:54 roughTerrain, made continuous (the JS triangulated a 10 m grid).</summary>
        public static Func<float2, float> Rough(float size, int grid)
            => xz =>
            {
                float cell = size / (grid - 1);
                float i = (xz.x + size / 2f) / cell, j = (xz.y + size / 2f) / cell;
                return 200f + 4f * math.sin(i * 1.7f) * math.cos(j * 2.3f) + 3f * math.sin((i + j) * 0.9f) + 0.3f * i;
            };

        /// <summary>makeRoute + carveRoad of the JS tests: a route over the analytic base, then the carved ground over it.</summary>
        public static RoadGround Road(Func<float2, float> baseHeight, float size, Utm33 a, Utm33 b, float roadWidth, Surface surface, bool assignRoadY = false)
        {
            var baseGround = new FlatGround { Height = baseHeight };
            var route = StageRoute.Make(new[] { a, b }, baseGround, roadWidth: roadWidth, surface: surface);
            if (assignRoadY) route.AssignRoadY(baseGround, 7f);
            return new RoadGround { Base = baseHeight, Route = route, Size = size };
        }

        public static RoadGround FlatRoad(Surface surface = Surface.Gravel, float roadWidth = 3.4f, float size = 3200f, float grade = 0f)
            => Road(Sloped(size, grade), size, new Utm33(0, -size / 2 + 100), new Utm33(0, size / 2 - 100), roadWidth, surface);
    }

    /// <summary>The JS `new Car(scene, terrain, kind)` + setRoute, as a state holder around the pure sim.</summary>
    public sealed class TestCar
    {
        public CarState S;
        public CarSpec Spec;
        public RoadGround Ground;
        public SlideMode Mode = SlideMode.Minimal;
        public WallBox[] Walls = Array.Empty<WallBox>();

        public TestCar(RoadGround ground, CarKind kind = CarKind.Porsche, bool setRoute = true)
        {
            Ground = ground;
            Spec = CarSpec.For(kind);
            S = CarState.Create(Spec, 42);
            if (setRoute) CarSim.Reset(ref S, Spec, ground, ground.Route);
        }

        public StageRoute Route => Ground.Route;
        public float Speed => S.Speed;

        public static CarInput Input(float throttle, float brake = 0f, float steer = 0f, bool handbrake = false, bool jump = false)
            => new CarInput { Throttle = throttle, Brake = brake, Steer = steer, Handbrake = handbrake, Jump = jump };

        public void Update(float dt, CarInput input)
        {
            input.GripMode = Mode;
            CarSim.Step(ref S, Spec, input, Ground, Route, Walls, dt);
        }

        public void Reset(float x, float z, float yaw) => CarSim.Reset(ref S, Spec, Ground, new float2(x, z), yaw);

        /// <summary>car.groundAt.</summary>
        public float GroundAt(float x, float z) => Ground.HeightAt(new float2(x, z));

        /// <summary>World position of a wheel pivot (JS group.localToWorld(w.pivot.position)).</summary>
        public float3 WheelPivotWorld(int i)
        {
            var w = CarSim.WheelOffset(Spec, i);
            return math.mul(S.VisualRotation, new float3(w.x, S.WheelY[i], w.y)) + S.VisualPos;
        }
    }
}
