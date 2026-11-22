using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Tests.World
{
    /// <summary>Road-verge plants: the bioclimate grid and regions, the species rules, the builder (exclusions, determinism), mesh and layer.</summary>
    public class VergeTests
    {
        // ---- a fake world: straight roads on flat ground ------------------------------------------------------------

        sealed class FakeWorld : IVergeWorld
        {
            public readonly List<(double2 a, double2 b, float half, uint flags)> Roads = new List<(double2, double2, float, uint)>();
            public readonly List<double3> Posts = new List<double3>();
            public readonly List<FootprintBox> Boxes = new List<FootprintBox>();
            public float Height = 100f, TreeLineM = 1000f, SnowLineM = 1300f;
            public byte Cls = LandcoverSplat.Open;
            public float Crown;
            public int Species;
            public bool IsReady = true;
            public int SegmentCalls;

            public bool Ready(Utm33 p) => IsReady;
            public void Segments(Bounds25833 b, Utm33 o, List<CarveSegment> output)
            {
                SegmentCalls++;
                foreach (var (a, bb, half, flags) in Roads)
                    output.Add(new CarveSegment
                    {
                        A = (float2)(a - new double2(o.E, o.N)), B = (float2)(bb - new double2(o.E, o.N)), Ha = Height, Hb = Height,
                        HalfWidth = flags == CarveSegment.DeckOnly ? RoadConstants.DeckHalf(half) : RoadConstants.FlatHalf(half) + RoadConstants.CarveApron,
                        Shoulder = 2f, Flags = flags,
                    });
            }
            public float Ground(Utm33 p) => Height;
            public Color32 Cover(Utm33 p) => new Color32((byte)(Species * 64), (byte)(Crown * 255), (byte)(Cls * LandcoverSplat.ClassStep), 255);
            public float TreeLine(Utm33 p) => TreeLineM;
            public float SnowLine(Utm33 p) => SnowLineM;
            public void Obstacles(Bounds25833 b, List<double3> output) => output.AddRange(Posts);
            public void Houses(Bounds25833 b, List<FootprintBox> output) => output.AddRange(Boxes);
        }

        // Oslo lowland (BN, OC) unless a test sets another grid byte: zone | section << 4.
        static byte[] Grid(BioZone z, BioSection s)
        {
            var g = new byte[Bioclimate.Width * Bioclimate.Height];
            for (int i = 0; i < g.Length; i++) g[i] = (byte)((int)z | (int)s << 4);
            return g;
        }

        static readonly Utm33 Origin = new Utm33(262016, 6649024);   // a multiple of 64, in Oslo

        static FakeWorld EastWestRoad(float half = RoadConstants.TwoLaneHalf)
        {
            var w = new FakeWorld();
            w.Roads.Add((new double2(Origin.E - 200, Origin.N + 32), new double2(Origin.E + 300, Origin.N + 32), half, 0u));
            return w;
        }

        static List<VergePlant> Build(FakeWorld w, bool shrubs, byte[] grid, Utm33? origin = null, float size = VergeLayer.CellM)
        {
            var list = new List<VergePlant>();
            VergeBuilder.Build(w, origin ?? Origin, size, shrubs, list, null, grid);
            return list;
        }

        // ---- bioclimate and regions ------------------------------------------------------------------------------

        [TestCase(59.91, 10.75, BioZone.BN, BioSection.OC, VergeRegion.SouthLowland, 20f, TestName = "Oslo")]
        [TestCase(60.39, 5.32, BioZone.BN, BioSection.O2, VergeRegion.Oceanic, 20f, TestName = "Bergen")]
        [TestCase(61.115, 10.466, BioZone.SB, BioSection.OC, VergeRegion.Boreal, 200f, TestName = "Lillehammer")]
        [TestCase(62.075, 9.125, BioZone.MB, BioSection.C1, VergeRegion.Continental, 650f, TestName = "Dombås")]
        [TestCase(61.565, 7.995, BioZone.MA, BioSection.O1, VergeRegion.HighAlpine, 1400f, TestName = "Sognefjellet")]
        [TestCase(69.65, 18.96, BioZone.MB, BioSection.O1, VergeRegion.North, 20f, TestName = "Tromsø")]
        [TestCase(69.97, 23.27, BioZone.MB, BioSection.C1, VergeRegion.Continental, 20f, TestName = "Alta")]
        [TestCase(59.65, 6.35, BioZone.BN, BioSection.O2, VergeRegion.Oceanic, 50f, TestName = "Sauda")]
        [TestCase(59.62, 7.99, BioZone.MB, BioSection.O1, VergeRegion.Boreal, 470f, TestName = "Vinje")]
        public void BioclimateGridAndRegionAtKnownPlaces(double lat, double lon, BioZone zone, BioSection section, VergeRegion region, float height)
        {
            Assert.IsNotNull(Bioclimate.Data, "Resources/bioclimate.bytes");
            var p = Proj.ToUtm(new LatLon(lat, lon));
            Bioclimate.At(p, out var z, out var s);
            Assert.AreEqual(zone, z);
            Assert.AreEqual(section, s);
            Assert.AreEqual(region, VergeRules.RegionFor(z, s, height, LandcoverSplat.TreeLine(lat), p.N));
        }

        [Test]
        public void OutsideTheGridIsNoneAndTheHeightCorrectsTheZone()
        {
            Bioclimate.At(new Utm33(-500000, 6000000), out var z, out var s);
            Assert.AreEqual(BioZone.None, z); Assert.AreEqual(BioSection.None, s);
            Assert.AreEqual(VergeRegion.Boreal, VergeRules.RegionFor(BioZone.None, BioSection.None, 300, 1000, 6800000), "unmapped: boreal estimate");
            Assert.AreEqual(VergeRegion.North, VergeRules.RegionFor(BioZone.None, BioSection.None, 300, 600, 7600000));
            Assert.AreEqual(VergeRegion.LowAlpine, VergeRules.RegionFor(BioZone.MB, BioSection.O1, 1050, 1000, 6800000), "above the tree line");
            Assert.AreEqual(VergeRegion.HighAlpine, VergeRules.RegionFor(BioZone.MB, BioSection.O1, 1350, 1000, 6800000));
            Assert.AreEqual(VergeRegion.North, VergeRules.RegionFor(BioZone.LA, BioSection.O1, 300, 1000, 6800000), "a valley floor in an alpine 1 km cell");
            Assert.AreEqual(VergeRegion.LowAlpine, VergeRules.RegionFor(BioZone.LA, BioSection.O2, 900, 1050, 6700000), "the west coast's lower tree line stays alpine");
        }

        // ---- rules -------------------------------------------------------------------------------------------------

        static Dictionary<VergeKind, int> Census(VergeSite s, int n = 4000, float edgeLo = 2f, float edgeHi = 5f)
        {
            var count = new Dictionary<VergeKind, int>();
            for (int i = 0; i < n; i++)
            {
                var g = new int2(i % 97 * 37, i / 97 * 41);
                s.Edge = math.lerp(edgeLo, edgeHi, (i % 13) / 12f);
                if (!VergeRules.Herb(s, g, new float2(g) * 0.8f % 8192f, out var k, out _, out _)) continue;
                count.TryGetValue(k, out int c); count[k] = c + 1;
            }
            return count;
        }

        static int N(Dictionary<VergeKind, int> c, VergeKind k) => c.TryGetValue(k, out int n) ? n : 0;

        [Test]
        public void LupinsLineMainRoadsNotNorthernMinorRoadsOrHighGround()
        {
            var s = new VergeSite { Cls = LandcoverSplat.Open, Height = 200, Region = VergeRegion.Boreal, MainRoad = true };
            var main = Census(s);
            s.MainRoad = false;
            var minor = Census(s);
            Assert.Greater(N(main, VergeKind.Lupin), 2 * N(minor, VergeKind.Lupin) + 10, "main roads carry more lupins");
            s.Region = VergeRegion.North;
            Assert.AreEqual(0, N(Census(s), VergeKind.Lupin), "northern minor road");
            s.MainRoad = true;
            Assert.Greater(N(Census(s), VergeKind.Lupin), 0, "the E6 in the north");
            s.Height = 900;
            Assert.AreEqual(0, N(Census(s), VergeKind.Lupin) + N(Census(s), VergeKind.LupinPink), "above 800 m");
        }

        [Test]
        public void EachRegionShowsItsOwnPlants()
        {
            var s = new VergeSite { Cls = LandcoverSplat.Open, Height = 100, MainRoad = true };
            s.Region = VergeRegion.Oceanic;
            var west = Census(s);
            Assert.Greater(N(west, VergeKind.Foxglove) + N(west, VergeKind.Bracken), 0, "foxglove and bracken on the west coast");
            s.Region = VergeRegion.North;
            var north = Census(s);
            Assert.Greater(N(north, VergeKind.Wolfsbane) + N(north, VergeKind.GlobeFlower), 0, "tyrihjelm and globe-flower in the north");
            Assert.AreEqual(0, N(north, VergeKind.Foxglove));
            s.Region = VergeRegion.LowAlpine; s.Height = 1100;
            var alpine = Census(s);
            Assert.AreEqual(0, N(alpine, VergeKind.TallGrass) + N(alpine, VergeKind.Fireweed) + N(alpine, VergeKind.Lupin), "no tall flowers above the tree line");
            Assert.Greater(N(alpine, VergeKind.Heather) + N(alpine, VergeKind.Crowberry), 0);
            s.Region = VergeRegion.Continental; s.Height = 500;
            var dry = Census(s);
            int dryAll = 0; foreach (var v in dry.Values) dryAll += v;
            s.Region = VergeRegion.SouthLowland;
            int lushAll = 0; foreach (var v in Census(s).Values) lushAll += v;
            Assert.Less(dryAll, lushAll * 0.8f, "continental verges are sparse");
            Assert.Greater(N(dry, VergeKind.DryGrass), 0);
        }

        [Test]
        public void LandCoverRules()
        {
            var s = new VergeSite { Cls = LandcoverSplat.Residential, Height = 100, Region = VergeRegion.SouthLowland };
            var town = Census(s, 3000, 0.3f, 7f);
            Assert.AreEqual(town.Count == 0 ? 0 : town.Count, N(town, VergeKind.Mown) > 0 ? 1 : 0, "built-up land: lawn only");
            Assert.IsFalse(VergeRules.Shrub(new VergeSite { Cls = LandcoverSplat.Built, Edge = 6, Height = 100 }, new int2(1, 1), new float2(1, 1), out _, out _, out _));
            s.Cls = LandcoverSplat.Wetland;
            Assert.Greater(N(Census(s), VergeKind.CottonGrass), 0, "bog: cotton grass");
            s.Cls = LandcoverSplat.Water;
            Assert.AreEqual(0, Census(s).Count);
            s.Cls = LandcoverSplat.Open; s.Slope = 1f;
            Assert.AreEqual(0, Census(s).Count, "a 45° cutting stays bare");
            s.Slope = 0; s.Snow = true;
            var snow = Census(s);
            foreach (var k in snow.Keys) Assert.That(k == VergeKind.Mown || k == VergeKind.TallGrass, $"no flowers under snow: {k}");
            s.Snow = false;
            Assert.AreEqual(0, Census(s, 500, 0f, 0.2f).Count, "nothing against the shoulder edge");
        }

        [Test]
        public void ShrubsFollowTheLandCover()
        {
            int Count(byte cls, float crown, VergeRegion region)
            {
                int n = 0;
                for (int i = 0; i < 3000; i++)
                    if (VergeRules.Shrub(new VergeSite { Cls = cls, Crown = crown, Edge = 4 + i % 8, Height = 100, Region = region }, new int2(i, i * 7), new float2(i * 3.1f % 8000, i * 1.7f % 8000), out _, out _, out _)) n++;
                return n;
            }
            Assert.Greater(Count(LandcoverSplat.Forest, 0.7f, VergeRegion.Boreal), 2 * Count(LandcoverSplat.Field, 0, VergeRegion.Boreal), "forest edge dense, fields sparse");
            Assert.AreEqual(0, Count(LandcoverSplat.Rock, 0, VergeRegion.Boreal));
            Assert.AreEqual(0, Count(LandcoverSplat.Open, 0, VergeRegion.HighAlpine));
            Assert.IsFalse(VergeRules.Shrub(new VergeSite { Cls = LandcoverSplat.Forest, Edge = 1.5f, Height = 100 }, new int2(3, 3), new float2(3, 3), out _, out _, out _), "not in the grass strips");
        }

        // ---- builder -------------------------------------------------------------------------------------------------

        static double RoadDistance(FakeWorld w, Utm33 origin, VergePlant p)
        {
            var q = new double2(origin.E + p.Pos.x, origin.N + p.Pos.y);
            double best = double.MaxValue;
            foreach (var (a, b, half, flags) in w.Roads)
            {
                if (flags != 0) continue;
                double2 ab = b - a; double t = math.saturate(math.dot(q - a, ab) / math.lengthsq(ab));
                best = math.min(best, math.distance(q, a + ab * t) - RoadConstants.FlatHalf(half));
            }
            return best;
        }

        [Test]
        public void PlantsStayOffEveryRoadAndGrowOnBothSides()
        {
            var w = EastWestRoad();
            w.Roads.Add((new double2(Origin.E + 20, Origin.N - 100), new double2(Origin.E + 20, Origin.N + 100), RoadConstants.OneLaneHalf, 0u));   // a crossing side road
            var grid = Grid(BioZone.SB, BioSection.O1);
            var herbs = Build(w, false, grid);
            Assert.Greater(herbs.Count, 200);
            int north = 0, south = 0;
            foreach (var p in herbs)
            {
                Assert.GreaterOrEqual(RoadDistance(w, Origin, p), VergeRules.EdgeGap - 0.01, $"herb at {p.Pos} on a carriageway or shoulder");
                if (p.Pos.y > 32) north++; else south++;
            }
            Assert.Greater(north, 50); Assert.Greater(south, 50);
            foreach (var p in Build(w, true, grid)) Assert.GreaterOrEqual(RoadDistance(w, Origin, p), VergeRules.ShrubFrom - 0.01);
        }

        [Test]
        public void ExclusionsDeckPostsHousesTrees()
        {
            var w = EastWestRoad();
            var grid = Grid(BioZone.SB, BioSection.O1);
            var post = new double2(Origin.E + 10, Origin.N + 32 + RoadConstants.FlatHalf(RoadConstants.TwoLaneHalf) + 1.5);
            w.Posts.Add(new double3(post, 0.1));
            var house = new FootprintBox { Centre = new double2(Origin.E + 40, Origin.N + 32 - 12), Yaw = 0, HalfLength = 3, HalfWidth = 4 };
            w.Boxes.Add(house);
            // a bridge deck over the verge's east end
            w.Roads.Add((new double2(Origin.E + 50, Origin.N + 32), new double2(Origin.E + 80, Origin.N + 32), RoadConstants.TwoLaneHalf, CarveSegment.DeckOnly));
            foreach (var p in Build(w, false, grid))
            {
                var q = new double2(Origin.E + p.Pos.x, Origin.N + p.Pos.y);
                Assert.GreaterOrEqual(math.distance(q, post), 1.0, "a metre clear of a post");
                Assert.IsFalse(math.abs(q.x - house.Centre.x) < 4 && math.abs(q.y - house.Centre.y) < 3, $"in a house at {p.Pos}");
                Assert.IsFalse(q.x > Origin.E + 50 && q.x < Origin.E + 80 && math.abs(q.y - Origin.N - 32) < RoadConstants.DeckHalf(RoadConstants.TwoLaneHalf), $"on the deck at {p.Pos}");
            }
        }

        [Test]
        public void SameAcrossCellBordersAndEveryVisit()
        {
            var w = EastWestRoad();
            w.Roads.Add((new double2(Origin.E + 70, Origin.N - 100), new double2(Origin.E + 50, Origin.N + 200), RoadConstants.OneLaneHalf, 0u));
            var grid = Grid(BioZone.BN, BioSection.OC);
            foreach (bool shrubs in new[] { false, true })
            {
                var big = new HashSet<string>();
                foreach (var p in Build(w, shrubs, grid, Origin, 128)) big.Add(Key(Origin, p));
                var small = new HashSet<string>();
                for (int j = 0; j < 2; j++)
                    for (int i = 0; i < 2; i++)
                    {
                        var o = new Utm33(Origin.E + i * 64, Origin.N + j * 64);
                        foreach (var p in Build(w, shrubs, grid, o)) small.Add(Key(o, p));
                    }
                Assert.Greater(big.Count, 10);
                CollectionAssert.AreEquivalent(big, small, shrubs ? "bushes" : "herbs");
                var again = new HashSet<string>();
                foreach (var p in Build(w, shrubs, grid, Origin, 128)) again.Add(Key(Origin, p));
                CollectionAssert.AreEquivalent(big, again);
            }
        }

        static string Key(Utm33 o, VergePlant p) => FormattableString($"{o.E + p.Pos.x:0.000},{o.N + p.Pos.y:0.000},{p.Kind},{p.Scale:0.000}");
        static string FormattableString(System.FormattableString s) => System.FormattableString.Invariant(s);

        // ---- mesh and layer ----------------------------------------------------------------------------------------

        [Test]
        public void MeshHasTwoCardsPerHerbAndFourPerBush()
        {
            var plants = new List<VergePlant>
            {
                new VergePlant { Pos = new float2(3, 4), Kind = VergeKind.Lupin, Scale = 1, Tint = Color.white },
                new VergePlant { Pos = new float2(30, 40), Kind = VergeKind.Juniper, Scale = 1, Tint = Color.white },
            };
            var mesh = VergeMesh.Build(plants, 64, 100, 120, "test");
            Assert.AreEqual(8 + 16, mesh.vertexCount);
            Assert.LessOrEqual(mesh.bounds.min.y, 98f); Assert.GreaterOrEqual(mesh.bounds.max.y, 120f + 2.2f);
            Object.DestroyImmediate(mesh);
            Assert.IsNull(VergeMesh.Build(new List<VergePlant>(), 64, 0, 0, "empty"));
            var r = VergeMesh.CellRect(VergeKind.Willow);
            Assert.AreEqual(0, r.x, 0.01f); Assert.AreEqual(0.5f, r.w, 0.01f, "bushes start in the 5th row from the top");
        }

        [Test]
        public void LayerBuildsNearCellsWaitsForTheTileAndRebuildsOnInvalidate()
        {
            var root = new GameObject("verge test");
            FloatingOrigin.Set(Origin);
            var w = EastWestRoad();
            w.IsReady = false;
            var layer = new VergeLayer(root.transform, w);
            try
            {
                layer.BuildAll(Origin);
                Assert.AreEqual(0, layer.CellCount, "the tile is not in yet");
                w.IsReady = true;
                layer.BuildAll(Origin);
                Assert.Greater(layer.HerbCount, 0);
                Assert.Greater(layer.CellCount, 4);
                int calls = w.SegmentCalls;
                layer.BuildAll(Origin);
                Assert.AreEqual(calls, w.SegmentCalls, "built cells are not built again");
                layer.Invalidate(new Bounds25833(Origin.E, Origin.N, Origin.E + 64, Origin.N + 64));
                layer.BuildAll(Origin);
                Assert.AreEqual(calls + 2, w.SegmentCalls, "herbs and bushes of the invalidated cells rebuilt");
                WorkBudget.Reset();
                layer.Update(new Utm33(Origin.E + 5000, Origin.N));
                Assert.AreEqual(0, layer.HerbCount + layer.ShrubCount, "far cells dropped (the empty ones out there do not count)");
                Assert.AreEqual(0, layer.VertexCount);
            }
            finally { layer.Dispose(); Object.DestroyImmediate(root); FloatingOrigin.Set(default); }
        }

        [Test]
        public void ShaderAndAtlasLoad()
        {
            var shader = Resources.Load<Shader>("Verge/Verge");
            Assert.IsNotNull(shader);
            Assert.IsTrue(shader.isSupported);
            Assert.IsNotNull(Resources.Load<Texture2D>("Verge/VergeAtlas"), "Editor/VergeTextures output");
        }
    }
}
