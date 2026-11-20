using System.Collections;
using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.Vehicle;
using Rally.World;
using Unity.Collections;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.TestTools;

namespace Rally.Tests.Play
{
    /// <summary>
    /// A road tunnel with the real CarController (plan J): a car reset in the tube lands on its floor, not on the mountain
    /// over it, and a car thrown sideways into the tube wall at speed stays inside, on the floor (TunnelMesh's wall collider
    /// on layer Buildings, CarController's sweep and push-out). Slow 20 fps frames, as ObstacleTests.
    /// </summary>
    public class TunnelPlayTests
    {
        const double RoadE = 1100, RidgeN = 1000;
        readonly List<GameObject> made = new List<GameObject>();
        TileWorld world;

        static float Ridge(double e, double n) { double x = (n - RidgeN) / 120; return (float)(50 + 100 * math.exp(-x * x)); }

        static RoadWay Way(long id, double n0, double n1, bool tunnel = false)
        {
            var w = new RoadWay { Id = id };
            w.Tags["highway"] = "secondary";
            if (tunnel) w.Tags["tunnel"] = "yes";
            for (double n = n0; n <= n1 + 1e-6; n += 10) w.Nodes.Add(new Utm33(RoadE, n));
            return w;
        }

        [TearDown]
        public void TearDown()
        {
            Time.captureDeltaTime = 0f;
            foreach (var g in made) if (g != null) Object.Destroy(g);
            made.Clear();
            world?.Dispose(); world = null;
        }

        /// <summary>The ridge tile, the road through it with its tunnel, carved, and the tube's collider in the scene.</summary>
        void MakeWorld()
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            world = new TileWorld(null, null);
            var graph = new RoadGraph();
            world.Roads = graph;
            var focus = new Utm33(RoadE, RidgeN);
            world.Scheduler.Update(focus, double2.zero, null);
            var key = TileKey.At(TileKind.Coarse, focus);
            int n = TileScheduler.Samples;
            var dtm = new NativeArray<float>(n * n, Allocator.Temp);
            for (int row = 0; row < n; row++)
                for (int col = 0; col < n; col++)
                    dtm[row * n + col] = Ridge(key.Origin.E + col * key.CellM, key.Origin.N + row * key.CellM);
            world.OnTileData(key, dtm, null, null, 60.0);
            dtm.Dispose();
            var data = new RoadGraphData(); data.Ways.Add(Way(1, 400, 760)); data.Ways.Add(Way(2, 760, 1240, true)); data.Ways.Add(Way(3, 1240, 1600));
            var lines = graph.SetTile(key, data, p => world.BaseHeightAt(p));
            world.RecarveWithin(key.Bounds);
            var draw = TunnelMesh.Build(lines, key.Origin, p => world.BaseHeightAt(p), out var solid);
            Object.Destroy(draw);
            var go = new GameObject("Tunnel solids") { layer = RallyLayers.Buildings };
            go.transform.position = FloatingOrigin.ToWorld(key.Origin, 0);
            go.AddComponent<MeshCollider>().sharedMesh = solid;
            made.Add(go);
            Physics.SyncTransforms();
        }

        CarController MakeCar()
        {
            var go = new GameObject("TestCar");
            int carLayer = LayerMask.NameToLayer("Car");
            if (carLayer >= 0) go.layer = carLayer;
            go.AddComponent<Rigidbody>();
            go.AddComponent<BoxCollider>();
            var car = go.AddComponent<CarController>();
            car.SolidLayers = (1 << RallyLayers.Buildings) | (1 << RallyLayers.Trees) | (1 << RallyLayers.Props);
            car.TreeLayers = 1 << RallyLayers.Trees;
            car.Driver = new ScriptedDriver { TargetKmh = 0f };
            car.Ground = world;
            made.Add(go);
            return car;
        }

        static void Launch(CarController car, float2 vel)
        {
            ref var s = ref car.State;
            s.Vel = vel; s.YawVel = 0f;
            CarSim.SyncBodyVelocity(ref s);
        }

        IEnumerator Frames(int n, float dt = 0.05f)
        {
            Time.captureDeltaTime = dt;
            for (int i = 0; i < n; i++) yield return null;
            Time.captureDeltaTime = 0f;
        }

        [UnityTest]
        public IEnumerator CarResetInTheTunnel_LandsOnTheFloor()
        {
            MakeWorld();
            var car = MakeCar(); yield return null;
            car.ResetTo(new float2((float)RoadE, (float)RidgeN), 0f);
            Assert.IsTrue(world.TunnelAt(car.State.Pos.xz, out var spot), "the car is in the tube");
            Assert.AreEqual(spot.Floor, car.State.Pos.y, 0.3f, "on the tunnel floor, not on the 150 m crest");
            yield return Frames(20);
            Assert.IsTrue(world.TunnelAt(car.State.Pos.xz, out spot));
            Assert.AreEqual(spot.Floor, car.State.Pos.y, 0.3f, "and still on it a second later");
        }

        [UnityTest]
        public IEnumerator SidewaysIntoTheTubeWallAt100_StaysInside()
        {
            MakeWorld();
            var car = MakeCar(); yield return null;
            car.ResetTo(new float2((float)RoadE, (float)RidgeN - 60), 0f);
            Launch(car, new float2(100f / 3.6f, 0f));
            float worst = 0f;
            for (int i = 0; i < 30; i++)
            {
                yield return Frames(1);
                Assert.IsTrue(world.TunnelAt(car.State.Pos.xz, out var spot), $"frame {i}: in the tube (car at {car.State.Pos})");
                worst = math.max(worst, math.abs(spot.Lateral));
                Assert.AreEqual(spot.Floor, car.State.Pos.y, 0.6f, $"frame {i}: on the floor");
            }
            Assert.Less(worst, world.TunnelAt(car.State.Pos.xz, out var last) ? last.Half - 0.5f : 0f, "never through the wall");
        }
    }
}
