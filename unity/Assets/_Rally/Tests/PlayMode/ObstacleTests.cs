using System.Collections;
using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Vehicle;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.TestTools;

namespace Rally.Tests.Play
{
    /// <summary>
    /// "Make sure the car always stays outside objects" (2026-11-20): a real house (Buildings.Build: wall mesh collider on
    /// "Buildings" + footprint ring), a bridge rail band, a sign post and a tree, hit head-on and sideways at speed, spun
    /// against, spawned inside and streamed in on top of the car, all on slow 20 fps frames. Every run ends with the car
    /// box outside every solid: no PhysX penetration deeper than 10 cm and not inside the house footprint.
    /// </summary>
    public class ObstacleTests
    {
        /// <summary>Flat ground at 10 m with the houses of one BuildingSet (the TileWorld footprint path over one set).</summary>
        sealed class HouseGround : IGround, ISolidGround
        {
            public BuildingSet Set;
            public float HeightAt(float2 xz) => 10f;
            public Surface SurfaceAt(float2 xz) => Surface.Asphalt;
            public WaterSample WaterAt(float2 xz) => WaterSample.Dry;
            public bool IsLoaded(float2 xz) => true;
            public void RefreshColliders(float3 world) { }
            public bool FootprintPush(float2 centre, float yaw, float halfLength, float halfWidth, float minDepth, out float2 push)
            {
                push = 0f;
                var fwd = new float2(math.sin(yaw), math.cos(yaw));
                for (int pass = 0; pass < 4; pass++)
                    if (!Footprints.PushOutOfSet(Set, new double2(centre.x, centre.y), fwd, halfLength, halfWidth, minDepth, ref push)) break;
                return math.any(push != 0f);
            }
        }

        readonly List<GameObject> made = new List<GameObject>();
        HouseGround ground;

        [TearDown]
        public void TearDown()
        {
            Time.captureDeltaTime = 0f;
            foreach (var g in made) if (g != null) Object.Destroy(g);
            made.Clear();
        }

        /// <summary>A 12 × 8 m house centred at (0, 20), long side along x: south wall at z = 16, west wall at x = −6.</summary>
        static BuildingSet House()
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var f = new Features();
            var b = new Building { Id = 1 };
            b.Tags["building"] = "house";
            foreach (var p in new[] { new double2(-6, 16), new double2(6, 16), new double2(6, 24), new double2(-6, 24) }) b.Polygon.Add(new Utm33(p.x, p.y));
            f.Buildings.Add(b);
            var set = Buildings.Build(f, new TileKey(TileKind.Coarse, 0, 0), _ => 10f, _ => 0f, null, 7);
            Assert.AreEqual(1, set.Count, "the house was built");
            return set;
        }

        GameObject AddHouseCollider(BuildingSet set)
        {
            var go = Buildings.CreateTileObject(set, null, null, float3.zero);
            made.Add(go);
            Physics.SyncTransforms();
            return go;
        }

        CarController MakeCar(BuildingSet houses)
        {
            var go = new GameObject("TestCar");
            int carLayer = LayerMask.NameToLayer("Car");
            if (carLayer >= 0) go.layer = carLayer;
            go.AddComponent<Rigidbody>();
            go.AddComponent<BoxCollider>();
            var car = go.AddComponent<CarController>();
            car.SolidLayers = (1 << RallyLayers.Buildings) | (1 << RallyLayers.Trees) | (1 << RallyLayers.Props);
            car.TreeLayers = 1 << RallyLayers.Trees;
            car.Driver = new ScriptedDriver { TargetKmh = 0f };   // coast
            ground = new HouseGround { Set = houses };
            car.Ground = ground;
            made.Add(go);
            return car;
        }

        GameObject Capsule(int layer, float2 xz, float radius, float height)
        {
            var go = new GameObject("Post") { layer = layer };
            var c = go.AddComponent<CapsuleCollider>();
            c.direction = 1; c.radius = radius; c.height = height;
            go.transform.position = new Vector3(xz.x, 10f + height * 0.5f, xz.y);
            made.Add(go);
            Physics.SyncTransforms();
            return go;
        }

        /// <summary>A bridge rail band (what BridgeMesh gives the MeshCollider): 0.3 m thick, 1.2 m tall, 40 m long along z at x.</summary>
        GameObject Rail(float x)
        {
            var go = new GameObject("Rail") { layer = RallyLayers.Buildings };
            var c = go.AddComponent<BoxCollider>();
            c.size = new Vector3(0.3f, 1.2f, 40f);
            go.transform.position = new Vector3(x, 10.4f, 0f);
            made.Add(go);
            Physics.SyncTransforms();
            return go;
        }

        static void Launch(CarController car, float2 vel, float yawVel)
        {
            ref var s = ref car.State;
            s.Vel = vel; s.YawVel = yawVel;
            CarSim.SyncBodyVelocity(ref s);
        }

        IEnumerator Frames(int n, float dt = 0.05f)
        {
            Time.captureDeltaTime = dt;
            for (int i = 0; i < n; i++) yield return null;
            Time.captureDeltaTime = 0f;
        }

        /// <summary>The car box against every solid: deepest PhysX penetration, and how deep it is in the house footprint.</summary>
        void AssertOutside(CarController car, string what)
        {
            Physics.SyncTransforms();
            var box = car.GetComponent<BoxCollider>();
            var rot = car.transform.rotation; var pos = car.transform.position;
            var hits = Physics.OverlapBox(pos + rot * box.center, box.size * 0.5f, rot, car.SolidLayers, QueryTriggerInteraction.Ignore);
            foreach (var o in hits)
            {
                if (o == box) continue;
                if (Physics.ComputePenetration(box, pos, rot, o, o.transform.position, o.transform.rotation, out _, out float d))
                    Assert.Less(d, 0.1f, $"{what}: {d:0.00} m into {o.name} (car at {car.State.Pos.xz})");
            }
            if (ground.Set == null) return;
            ref var s = ref car.State;
            var c = s.Pos.xz + CarSim.Forward(s.Yaw) * box.center.z;
            var fb = ground.Set.Boxes[0];
            float depth = Footprints.Depth(c - (float2)fb.Centre, CarSim.Forward(s.Yaw), box.size.z * 0.5f, box.size.x * 0.5f, ground.Set.Rings[0]);
            Assert.Less(depth, 0.1f, $"{what}: {depth:0.00} m inside the house footprint (car at {s.Pos.xz})");
        }

        [UnityTest]
        public IEnumerator HeadOnIntoAHouseWallAt150()
        {
            var set = House();
            var car = MakeCar(set); yield return null;
            AddHouseCollider(set);
            car.ResetTo(new float2(0f, 4f), 0f);
            Launch(car, new float2(0f, 150f / 3.6f), 0f);
            yield return Frames(30);
            AssertOutside(car, "head-on 150 km/h");
            Assert.Less(car.State.Pos.z, 16f, "stopped on the near side of the wall");
        }

        [UnityTest]
        public IEnumerator SidewaysIntoAHouseWallAt100()
        {
            var set = House();
            var car = MakeCar(set); yield return null;
            AddHouseCollider(set);
            car.ResetTo(new float2(-11f, 20f), 0f);
            Launch(car, new float2(100f / 3.6f, 0f), 0f);
            yield return Frames(30);
            AssertOutside(car, "sideways 100 km/h");
            Assert.Less(car.State.Pos.x, -6f, "stopped west of the wall");
        }

        [UnityTest]
        public IEnumerator SpinningAgainstAHouseWall()
        {
            var set = House();
            var car = MakeCar(set); yield return null;
            AddHouseCollider(set);
            car.ResetTo(new float2(-8.2f, 20f), 0.3f);
            Launch(car, new float2(40f / 3.6f, 0f), 14f);   // ~40° of spin per 20 fps frame
            for (int i = 0; i < 30; i++) { yield return Frames(1); AssertOutside(car, $"spinning, frame {i}"); }
            Assert.Less(car.State.Pos.x, -6f, "still west of the wall");
        }

        [UnityTest]
        public IEnumerator SpawnedInsideAHouseIsPlacedOutside()
        {
            var set = House();
            var car = MakeCar(set); yield return null;
            AddHouseCollider(set);
            car.ResetTo(new float2(0f, 20f), 0f);   // the middle of the house
            AssertOutside(car, "right after the spawn");
            Assert.Greater(car.Diagnostics.Placements, 0, "the placement moved the car");
            yield return Frames(10);
            AssertOutside(car, "10 frames after the spawn");
        }

        [UnityTest]
        public IEnumerator AHouseStreamedInOnTopOfTheCarPushesItOut()
        {
            var set = House();
            var car = MakeCar(null); yield return null;
            car.ResetTo(new float2(-4.5f, 18f), 0.4f);   // half in where the house will stand
            yield return Frames(3);
            ground.Set = set; AddHouseCollider(set);   // the tile's overlay arrives
            yield return Frames(3);
            AssertOutside(car, "house streamed in, car partly inside");
            car.ResetTo(new float2(0f, 4f), 0f);
            ground.Set = null; yield return Frames(1);
            car.State.Pos.xz = new float2(0.5f, 20f); car.State.VisualPos.xz = car.State.Pos.xz;   // a car wholly inside, no placement
            ground.Set = set;
            yield return Frames(3);
            AssertOutside(car, "house streamed in, car wholly inside");
        }

        [UnityTest]
        public IEnumerator SpawnedOnATreeOrASignPostIsPlacedOutside()
        {
            var car = MakeCar(null); yield return null;
            Capsule(RallyLayers.Trees, new float2(0.3f, 0.5f), 0.35f, 18f);
            car.ResetTo(float2.zero, 0f);
            AssertOutside(car, "spawned on a tree");
            Capsule(RallyLayers.Props, new float2(30.4f, 1f), 0.08f, 3f);
            car.ResetTo(new float2(30f, 0f), 0f);
            AssertOutside(car, "spawned on a sign post");
            yield return Frames(10);
            AssertOutside(car, "10 frames later");
        }

        [UnityTest]
        public IEnumerator SidewaysIntoABridgeRailAt100StaysOnItsSide()
        {
            var car = MakeCar(null); yield return null;
            Rail(3f);
            car.ResetTo(new float2(0f, 0f), 0f);
            Launch(car, new float2(100f / 3.6f, 0f), 0f);
            yield return Frames(30);
            AssertOutside(car, "sideways into a rail");
            Assert.Less(car.State.Pos.x, 3f, "on the deck side of the rail");
        }

        [UnityTest]
        public IEnumerator HeadOnIntoASignPostAt150()
        {
            var car = MakeCar(null); yield return null;
            Capsule(RallyLayers.Props, new float2(0f, 25f), 0.08f, 3f);
            car.ResetTo(float2.zero, 0f);
            Launch(car, new float2(0f, 150f / 3.6f), 0f);
            yield return Frames(30);
            AssertOutside(car, "head-on into a sign post");
            Assert.Less(car.State.Pos.z, 25f, "stopped before the post");
        }
    }
}
