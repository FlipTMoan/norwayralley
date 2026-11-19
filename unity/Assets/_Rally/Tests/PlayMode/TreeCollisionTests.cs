using System.Collections;
using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.TestTools;

namespace Rally.Tests.Play
{
    /// <summary>
    /// Trees stop the car from any direction: the car on flat ground, slid sideways, reversed or spun into one trunk
    /// capsule on the "Trees" layer (what TreeColliderPool puts there), on slow 20 fps frames (0.05 s, the most the car
    /// steps per frame). The trunk is placed at a sweep of distances so every phase of the frame steps is tried: the old
    /// discrete overlap test let a sideways car (1.7 m wide) jump past the trunk's centre in one frame and pushed it out
    /// on the far side, and a birch thinner than 0.15 m "snapped" (passed through) while still drawn.
    /// </summary>
    public class TreeCollisionTests
    {
        GameObject carGo, treeGo;

        [TearDown]
        public void TearDown()
        {
            Time.captureDeltaTime = 0f;
            if (carGo != null) Object.Destroy(carGo);
            if (treeGo != null) Object.Destroy(treeGo);
        }

        CarController MakeCar()
        {
            carGo = new GameObject("TestCar");
            int carLayer = LayerMask.NameToLayer("Car");
            if (carLayer >= 0) carGo.layer = carLayer;
            carGo.AddComponent<Rigidbody>();
            carGo.AddComponent<BoxCollider>();
            var car = carGo.AddComponent<CarController>();
            int trees = LayerMask.NameToLayer("Trees");
            Assert.GreaterOrEqual(trees, 0, "the Trees layer exists");
            car.SolidLayers = 1 << trees;
            car.TreeLayers = 1 << trees;
            car.Driver = new ScriptedDriver { TargetKmh = 0f };   // no keyboard: coast
            car.Ground = new FlatGround { Surface = Surface.Asphalt };
            return car;
        }

        void MakeTree(float2 xz, float radius, float height)
        {
            treeGo = new GameObject("TestTree") { layer = LayerMask.NameToLayer("Trees") };
            var c = treeGo.AddComponent<CapsuleCollider>();
            c.direction = 1; c.radius = radius; c.height = height;
            treeGo.transform.position = new Vector3(xz.x, height * 0.5f, xz.y);
        }

        /// <summary>
        /// One run: the car at the origin facing +z with world velocity <paramref name="vel"/> (m/s) and yaw rate
        /// <paramref name="yawVel"/>, a trunk at <paramref name="tree"/>; returns the closest the car's centre came to the
        /// trunk along the direction of travel, negative when it ended up past it.
        /// </summary>
        IEnumerator Run(float2 vel, float yawVel, float2 tree, float radius, float height, System.Action<float, CarController> result)
        {
            var car = MakeCar();
            yield return null;   // Awake / OnEnable
            MakeTree(tree, radius, height);
            Physics.SyncTransforms();
            car.ResetTo(float2.zero, 0f);
            Launch(car, vel, yawVel);
            Time.captureDeltaTime = 0.05f;
            float2 dir = math.normalize(vel);
            float along0 = math.dot(tree, dir);
            for (int i = 0; i < 40; i++) yield return null;
            Time.captureDeltaTime = 0f;
            float along = math.dot(tree - car.State.Pos.xz, dir);
            result(along, car);
            Object.Destroy(carGo); Object.Destroy(treeGo);
            yield return null;
        }

        static void Launch(CarController car, float2 vel, float yawVel)
        {
            ref var s = ref car.State;
            s.Vel = vel;
            s.YawVel = yawVel;
            CarSim.SyncBodyVelocity(ref s);
        }

        IEnumerator Sweep(float2 vel, float yawVel, float radius, float height, string what)
        {
            float2 dir = math.normalize(vel);
            for (float d = 2.0f; d <= 4.6f; d += 0.2f)
            {
                float along = 0; CarController car = null;
                yield return Run(vel, yawVel, dir * d, radius, height, (a, c) => { along = a; car = c; });
                Assert.Greater(along, 0f, $"{what}: trunk {d:0.0} m away — the car ended {-along:0.00} m past it (through the tree)");
                Assert.Greater(car.Diagnostics.Contacts, 0, $"{what}: trunk {d:0.0} m away — no contact registered");
                Assert.Greater(car.State.Damage.Total, 0f, $"{what}: trunk {d:0.0} m away — the damage model saw no hit");
            }
        }

        [UnityTest]
        public IEnumerator SlidingSidewaysAt60StopsAtTheTrunk() => Sweep(new float2(60f / 3.6f, 0f), 0f, 0.3f, 18f, "sideways 60 km/h");

        [UnityTest]
        public IEnumerator SlidingSidewaysAt100StopsAtTheTrunk() => Sweep(new float2(100f / 3.6f, 0f), 0f, 0.3f, 18f, "sideways 100 km/h");

        [UnityTest]
        public IEnumerator ReversingStopsAtTheTrunk() => Sweep(new float2(0f, -40f / 3.6f), 0f, 0.3f, 18f, "reversing 40 km/h");

        [UnityTest]
        public IEnumerator SpinningSidewaysIntoAThinBirchStopsAtIt() => Sweep(new float2(-80f / 3.6f, 0f), 2.5f, 0.12f, 11f, "spinning into a 0.12 m birch");
    }
}
