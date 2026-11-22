using System.Collections;
using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Gameplay;
using Rally.Geo;
using Rally.Roads;
using Rally.Vehicle;
using Rally.World;
using Unity.Collections;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace Rally.Tests.Play
{
    /// <summary>
    /// Street lights in play: the offline scene (FakeSources.Lights beside the fake road) draws them with Rally/Tunnel, and a
    /// car placed on a mast far from where the colliders were is moved off it at once (TileWorld.RefreshColliders → LightLayer).
    /// </summary>
    public class LightPlayTests
    {
        readonly List<GameObject> made = new List<GameObject>();
        TileWorld world;
        LightLayer lights;

        [TearDown]
        public void TearDown()
        {
            foreach (var g in made) if (g != null) Object.Destroy(g);
            made.Clear();
            lights?.Dispose(); lights = null;
            world?.Dispose(); world = null;
        }

        [UnityTest]
        public IEnumerator FakeLightsAreBuiltWithTheTunnelShader()
        {
            using var watch = new LogWatch();
            SceneManager.LoadScene("Assets/_Rally/Scenes/Rally.unity");
            yield return null;
            var game = Object.FindAnyObjectByType<GameController>();
            Assert.IsTrue(game.UseFakeSources);
            MeshRenderer r = null;
            float until = Time.realtimeSinceStartup + 25f;
            while (r == null && Time.realtimeSinceStartup < until)
            {
                foreach (var m in Object.FindObjectsByType<MeshRenderer>(FindObjectsSortMode.None))
                    if (m.name.StartsWith("Lights Coarse") && !m.name.Contains("empty")) { r = m; break; }
                yield return null;
            }
            Assert.IsNotNull(r, "no street-light mesh within 25 s");
            Assert.AreEqual("Rally/Tunnel", r.sharedMaterial.shader.name);
            var mesh = r.GetComponent<MeshFilter>().sharedMesh;
            int glow = 0; foreach (var c in mesh.colors) if (c.a > 0.95f) glow++;
            Assert.AreEqual(18 * 4, glow, "16 posts along the lit stretch + 2 registered masts, one glowing panel each");
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }

        [UnityTest]
        public IEnumerator SpawnedOnAStreetLightIsPlacedOutside()
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            world = new TileWorld(null, null);
            var graph = new RoadGraph();
            world.Roads = graph;
            var focus = new Utm33(1000, 1000);
            world.Scheduler.Update(focus, double2.zero, null);
            var key = TileKey.At(TileKind.Coarse, focus);
            int n = TileScheduler.Samples;
            var dtm = new NativeArray<float>(n * n, Allocator.Temp);
            for (int i = 0; i < dtm.Length; i++) dtm[i] = 50f;
            world.OnTileData(key, dtm, null, null, 60.0);
            dtm.Dispose();
            var way = new RoadWay { Id = 1 };
            way.Tags["highway"] = "residential";
            for (double e = 200; e <= 1800; e += 50) way.Nodes.Add(new Utm33(e, 1000));
            var data = new RoadGraphData(); data.Ways.Add(way);
            graph.SetTile(key, data, p => world.BaseHeightAt(p));
            world.PropColliders = new PropColliderPool(16, 0);
            lights = new LightLayer(null, world.PropColliders, p => world.HeightAt(FloatingOrigin.ToWorldXZ(p)));
            world.Lights = lights;
            var posts = LightPlacement.Place(new LightSet { Points = { new LightPoint { Id = 1, Position = new Utm33(1500, 995) } } }, graph, key.Bounds, null, out _);
            Assert.AreEqual(1, posts.Count);
            lights.SetTile(key, posts);

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
            yield return null;
            car.ResetTo(new float2(400, 1000), math.PI / 2);   // far from the mast: its collider is not placed
            lights.Update(FloatingOrigin.ToUtm(new float2(400, 1000)), new float3(400, 50, 1000));
            var mast = FloatingOrigin.ToWorldXZ(posts[0].Position);
            car.ResetTo(mast, math.PI / 2);   // the car right on the mast, heading east along the road
            Assert.IsFalse(Overlaps(car, mast), $"the car was placed clear of the mast (car at {car.State.Pos.xz}, mast at {mast})");
            Assert.Greater(math.distance(car.State.Pos.xz, mast), 1f);
        }

        /// <summary>The car's box (as CarController.IsFree tests it) covers the mast's axis.</summary>
        static bool Overlaps(CarController car, float2 mast)
        {
            var box = car.GetComponent<BoxCollider>();
            var rot = Quaternion.Euler(0f, car.State.Yaw * Mathf.Rad2Deg, 0f);
            var centre = new Vector3(car.State.Pos.x, 0, car.State.Pos.z) + rot * new Vector3(box.center.x, 0, box.center.z);
            var local = Quaternion.Inverse(rot) * (new Vector3(mast.x, 0, mast.y) - centre);
            return math.abs(local.x) < box.size.x / 2 + LightMesh.FootRadius && math.abs(local.z) < box.size.z / 2 + LightMesh.FootRadius;
        }
    }
}
