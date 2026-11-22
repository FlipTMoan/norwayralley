using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.Tests.Geo;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;
using Object = UnityEngine.Object;

namespace Rally.Tests.World
{
    /// <summary>Street lights: NVDB parsing (trimmed live fixtures from the Lillehammer box), the cache, stretch fill, placement, mesh, layer.</summary>
    public class LightTests : NoSyncContext
    {
        static string Fixture(string name) => File.ReadAllText(Path.Combine(Application.dataPath, "_Rally/Tests/EditMode/World/Fixtures", name));

        static List<Dictionary<string, object>> Objects(string json)
        {
            var list = new List<Dictionary<string, object>>();
            foreach (var o in Json.ParseObject(json).Arr("objekter")) list.Add((Dictionary<string, object>)o);
            return list;
        }

        // ---- parsing -----------------------------------------------------------------------------------------

        [Test]
        public void FixturesParseAndMastsJoinTheirPoints()
        {
            var points = new List<LightPoint>();
            foreach (var o in Objects(Fixture("nvdb_87_lillehammer.json"))) points.Add(NvdbSource.ParseLightPoint(o));
            Assert.AreEqual(5, points.Count);
            NvdbSource.JoinMasts(points, Objects(Fixture("nvdb_181_lillehammer.json")));
            var hamarvegen = points.Find(p => p.Id == 529654545);
            Assert.AreEqual(256123.897, hamarvegen.Position.E, 1e-3);
            Assert.AreEqual(1.0, hamarvegen.FromEdge, 1e-9);
            Assert.AreEqual("Veg/gate", hamarvegen.Use);
            Assert.IsTrue(hamarvegen.OnMast);
            Assert.AreEqual(8.0, hamarvegen.MastLength, 1e-9);
            Assert.IsTrue(hamarvegen.Arm); Assert.AreEqual(2.0, hamarvegen.ArmLength, 1e-9);
            var tall = points.Find(p => p.Id == 528308793);
            Assert.AreEqual(10.0, tall.MastLength, 1e-9); Assert.IsFalse(tall.Arm);
            var crossing = points.Find(p => p.Id == 1025843332);
            Assert.AreEqual("Gangfelt", crossing.Use);
            Assert.IsTrue(double.IsNaN(crossing.MastLength), "a mast without Mastelengde");
            Assert.IsTrue(double.IsNaN(crossing.Height), "POINT without Z");
            var bare = points.Find(p => p.Id == 913060659);
            Assert.IsTrue(double.IsNaN(bare.MastLength), "no Lysmast: defaults later");
            Assert.IsTrue(double.IsNaN(bare.FromEdge));

            var stretch = NvdbSource.ParseLightStretch(Objects(Fixture("nvdb_86_lillehammer.json"))[0]);
            Assert.AreEqual(91025289, stretch.Id);
            Assert.AreEqual(40, stretch.Spacing, 1e-9);
            Assert.AreEqual("Veg/gate", stretch.Use);
            Assert.Greater(stretch.Points.Count, 10);

            var wall = NvdbSource.ParseLightPoint(Json.ParseObject("{\"id\":1,\"egenskaper\":[{\"id\":1874,\"verdi\":\"Festet til vegg/bygning\"}],\"geometri\":{\"wkt\":\"POINT (5 5)\"}}"));
            Assert.IsFalse(wall.OnMast, "a lamp on a wall has no mast to draw");
            // A mast without a parent relation joins the point it stands on.
            var loose = new List<LightPoint> { new LightPoint { Id = 2, Position = new Utm33(100, 200) } };
            NvdbSource.JoinMasts(loose, Objects("{\"objekter\":[{\"id\":3,\"egenskaper\":[{\"id\":1338,\"verdi\":12.0},{\"id\":3895,\"verdi\":\"Ja\"}],\"geometri\":{\"wkt\":\"POINT (100.3 200.2)\"}}]}"));
            Assert.AreEqual(12, loose[0].MastLength, 1e-9); Assert.IsTrue(loose[0].Arm);
        }

        [Test]
        public void LightPagesComeFromTheGeoCache()
        {
            // Bounds in the sea off Africa: NVDB would answer nothing there, so the lights can only come from the cache.
            var b = new Bounds25833(0, 0, 10, 10);
            var cache = new GeoCache(new MemoryBackend());
            int loads = 0;
            void Seed(int type, string file)
            {
                var text = Fixture(file);
                cache.Fetch(NvdbSource.FirstPageUrl(type, b, NvdbSource.LightInclude), () => { loads++; return Task.FromResult(Encoding.UTF8.GetBytes(text)); }, "nvdb", true).Sync();
            }
            Seed(NvdbSource.TypeLightPoint, "nvdb_87_lillehammer.json");
            Seed(NvdbSource.TypeLightMast, "nvdb_181_lillehammer.json");
            Seed(NvdbSource.TypeLightStretch, "nvdb_86_lillehammer.json");
            var set = new NvdbSource(cache).FetchLights(b, default).Sync();
            Assert.AreEqual(5, set.Points.Count);
            Assert.AreEqual(1, set.Stretches.Count);
            Assert.AreEqual(8.0, set.Points.Find(p => p.Id == 529654545).MastLength, 1e-9, "the mast joined");
            Assert.AreEqual(3, loads);
        }

        // ---- placement -----------------------------------------------------------------------------------------

        static readonly TileKey Key = new TileKey(TileKind.Coarse, 125, 3311);
        static readonly Bounds25833 Tile = Key.Bounds;

        /// <summary>An east–west tertiary (two-lane) road along N = 6 781 000, and optionally a residential road crossing it at E = 257 000.</summary>
        static RoadGraph Roads(bool crossing = false)
        {
            var g = new RoadGraph();
            var data = new RoadGraphData();
            var w = new RoadWay { Id = 7 };
            w.Tags["highway"] = "tertiary";
            for (double e = 256000; e <= 258000; e += 50) w.Nodes.Add(new Utm33(e, 6781000));
            data.Ways.Add(w);
            if (crossing)
            {
                var c = new RoadWay { Id = 8 };
                c.Tags["highway"] = "residential";
                for (double n = 6780800; n <= 6781200; n += 50) c.Nodes.Add(new Utm33(257000, n));
                data.Ways.Add(c);
            }
            g.SetTile(Key, data, _ => 100f);
            return g;
        }

        static readonly double Edge = RoadConstants.FlatHalf(RoadConstants.TwoLaneHalf) + LightPlacement.DefaultFromEdge;

        static LightStretch Stretch(double e0, double e1, double spacing = 40)
        {
            var s = new LightStretch { Id = 9, Spacing = spacing, Use = "Veg/gate" };
            double step = e1 > e0 ? 10 : -10;
            for (double e = e0; step > 0 ? e <= e1 : e >= e1; e += step) s.Points.Add(new Utm33(e, 6781000));
            return s;
        }

        [Test]
        public void LitStretchWithoutPointsGetsAPostEverySpacingOnItsRight()
        {
            var roads = Roads();
            var set = new LightSet { Stretches = { Stretch(256100, 256500) } };
            var posts = LightPlacement.Place(set, roads, Tile, null, out var st);
            Assert.AreEqual(11, posts.Count, "every 40 m from 256 100 to 256 500");
            Assert.AreEqual(11, st.Filled);
            for (int i = 0; i < posts.Count; i++)
            {
                Assert.AreEqual(256100 + 40 * i, posts[i].Position.E, 1e-6);
                Assert.AreEqual(6781000 - Edge, posts[i].Position.N, 1e-6, "eastwards: on the right (south), 1 m outside the flat band");
                Assert.AreEqual(1, posts[i].ToRoad.y, 1e-9, "the arm points at the road");
                Assert.IsTrue(posts[i].Filled);
                Assert.AreEqual(LightPlacement.MainRoadMast, posts[i].Height, "a two-lane road: 10 m");
            }
            posts = LightPlacement.Place(new LightSet { Stretches = { Stretch(256500, 256100) } }, roads, Tile, null, out _);
            Assert.AreEqual(6781000 + Edge, posts[0].Position.N, 1e-6, "westwards: the right is north");
            // A registered point on the stretch: no post made up within half the spacing of it; it stands itself.
            set.Points.Add(new LightPoint { Id = 1, Position = new Utm33(256305, 6780994) });
            posts = LightPlacement.Place(set, roads, Tile, null, out st);
            Assert.AreEqual(1, st.Real);
            Assert.AreEqual(10, st.Filled, "the 256 300 sample gave way to the real light");
            Assert.AreEqual(6781000 - Edge, posts[0].Position.N, 1e-6);
            Assert.AreEqual(256305, posts[0].Position.E, 1e-6);
            Assert.AreEqual(0, LightPlacement.Place(new LightSet { Stretches = { new LightStretch { Use = "Tunnel", Points = Stretch(256100, 256500).Points } } }, roads, Tile, null, out _).Count, "tunnel lighting is the tube's");
        }

        [Test]
        public void PostsStandOutsideTheRoadAndNeverOnACrossingRoadOrInATunnel()
        {
            var roads = Roads(crossing: true);
            var set = new LightSet
            {
                Points =
                {
                    new LightPoint { Id = 1, Position = new Utm33(256200, 6781000) },                                   // on the centre line
                    new LightPoint { Id = 2, Position = new Utm33(256300, 6781010), MastLength = 8, Arm = true, ArmLength = 2 },   // its real 10 m
                    new LightPoint { Id = 3, Position = new Utm33(256400, 6781015) },                                   // too far out: clamped
                    new LightPoint { Id = 4, Position = new Utm33(257003, 6781004) },                                   // its foot would be on the crossing road
                    new LightPoint { Id = 5, Position = new Utm33(257600, 6780994) },                                   // in a tunnel
                    new LightPoint { Id = 6, Position = new Utm33(256500, 6781040) },                                   // 40 m off: a path
                    new LightPoint { Id = 7, Position = new Utm33(256600, 6780994), OnMast = false },                    // on a wall
                    new LightPoint { Id = 8, Position = new Utm33(256200.2, 6781000.1) },                               // the same mast as 1
                    new LightPoint { Id = 9, Position = new Utm33(250000, 6780994) },                                   // another tile's
                },
            };
            var posts = LightPlacement.Place(set, roads, Tile, p => p.E > 257500, out var st);
            Assert.AreEqual(3, posts.Count);
            Assert.AreEqual(1, st.OnRoad); Assert.AreEqual(1, st.DeckOrTunnel); Assert.AreEqual(1, st.OffRoad); Assert.AreEqual(1, st.NotOnMast);
            Assert.AreEqual(6781000 - Edge, posts[0].Position.N, 1e-6, "on the line: moved out to the right of the way");
            Assert.AreEqual(256200, posts[0].Position.E, 1e-6, "keeping its place along the road");
            Assert.AreEqual(LightPlacement.Bracket, posts[0].Arm, "no Lysmast: a short bracket");
            Assert.AreEqual(6781010, posts[1].Position.N, 1e-6, "beyond the minimum: its real distance");
            Assert.AreEqual(8f, posts[1].Height); Assert.AreEqual(2f, posts[1].Arm);
            Assert.AreEqual(-1, posts[1].ToRoad.y, 1e-9);
            Assert.AreEqual(6781000 + Edge + LightPlacement.MaxSetback, posts[2].Position.N, 1e-6);
            foreach (var p in posts)
            {
                Assert.IsTrue(roads.Nearest(p.Position, 30, out var hit));
                Assert.Greater(hit.Distance, RoadConstants.FlatHalf(hit.Half) + 0.5, "never on the carriageway or its shoulder");
            }
        }

        // ---- mesh + layer --------------------------------------------------------------------------------------

        [Test]
        public void MeshPutsTheLampHeadOverTheRoadAtMastHeight()
        {
            var post = new LightPost { Id = 1, Position = new Utm33(257000, 6780990), ToRoad = new double2(0, 1), Height = 10, Arm = 2 };
            var heads = new List<float3>();
            var mesh = LightMesh.Build(new[] { post }, new Utm33(256000, 6780000), _ => 100f, heads);
            Assert.IsNotNull(mesh);
            Assert.AreEqual(1, heads.Count);
            Assert.AreEqual(1000f, heads[0].x, 1e-3);
            Assert.Greater(heads[0].z, 990f + 2f, "the head hangs beyond the 2 m arm, towards the road (north)");
            Assert.AreEqual(110f, heads[0].y, 0.4f, "at the top of the 10 m mast");
            var c = mesh.colors; var n = mesh.normals; var v = mesh.vertices;
            int glow = 0;
            for (int i = 0; i < c.Length; i++) if (c[i].a > 0.95f) { glow++; Assert.Less(n[i].y, -0.99f, "the glowing panel faces down"); }
            Assert.AreEqual(4, glow);
            float minY = float.MaxValue; foreach (var p in v) minY = math.min(minY, p.y);
            Assert.AreEqual(100f - SignMesh.PostSink, minY, 1e-3, "the mast is sunk into the ground");
            // every triangle faces outward from the mast axis (Unity: cross(b − a, c − a) towards the viewer)
            var t = mesh.triangles; int inward = 0;
            for (int i = 0; i < t.Length; i += 3)
            {
                var a = v[t[i]]; var nn = Vector3.Cross(v[t[i + 1]] - a, v[t[i + 2]] - a);
                if (a.y < 105f && math.abs(nn.y) < 1e-6f && Vector3.Dot(nn, new Vector3(a.x - 1000f, 0, a.z - 990f)) < 0) inward++;
            }
            Assert.AreEqual(0, inward, "the mast's sides wind outward");
            Object.DestroyImmediate(mesh);
        }

        [Test]
        public void LayerBuildsNearTilesGivesNearMastsCollidersAndRebuildsAfterARegrade()
        {
            var root = new GameObject("lights test");
            var pool = new PropColliderPool(8, 0);
            var layer = new LightLayer(root.transform, pool, _ => 100f);
            try
            {
                var posts = LightPlacement.Place(new LightSet { Points = { new LightPoint { Id = 1, Position = new Utm33(257000, 6780994) }, new LightPoint { Id = 2, Position = new Utm33(257400, 6780994) } } },
                    Roads(), Tile, null, out _);
                layer.SetTile(Key, posts);
                var car = new Utm33(257010, 6781000);
                layer.BuildAll(car);
                Assert.AreEqual(1, layer.BuiltTiles);
                layer.RefreshColliders(FloatingOrigin.ToWorld(car, 100f));
                var active = new List<CapsuleCollider>();
                foreach (var c in Object.FindObjectsByType<CapsuleCollider>(FindObjectsSortMode.None)) if (c.gameObject.activeInHierarchy && c.gameObject.layer == RallyLayers.Props) active.Add(c);
                Assert.AreEqual(1, active.Count, "only the mast within 35 m of the car");
                var foot = FloatingOrigin.ToWorldXZ(posts[0].Position);
                Assert.AreEqual(foot.x, active[0].transform.position.x, 1e-3);
                Assert.Greater(active[0].height, posts[0].Height, "the capsule reaches the top of the mast");
                layer.Invalidate(new Bounds25833(256900, 6780900, 257100, 6781100));
                Assert.AreEqual(0, layer.BuiltTiles, "a regrade under the tile drops its mesh");
                layer.Update(car, FloatingOrigin.ToWorld(car, 100f));
                Assert.AreEqual(1, layer.BuiltTiles, "and the next update builds it again on the new ground");
                layer.Update(new Utm33(259000, 6790000), float3.zero);
                Assert.AreEqual(0, layer.BuiltTiles, "dropped beyond 1.5 km");
            }
            finally { layer.Dispose(); pool.Dispose(); Object.DestroyImmediate(root); }
        }

        [Test]
        public void FakeSourcesLightTheFakeRoad()
        {
            var osm = new FakeSources.Osm();
            var set = new FakeSources.Lights { Road = osm }.FetchLights(Tile, default).Sync();
            var g = new RoadGraph();
            g.SetTile(Key, osm.FetchRoads(Key.Bounds, default).Sync(), _ => 100f);
            var posts = LightPlacement.Place(set, g, Tile, null, out var st);
            Assert.AreEqual(2, st.Real);
            Assert.AreEqual(16, st.Filled, "100 … 700 m every 40 m");
        }
    }
}
