using System;
using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.Vehicle;
using Rally.World;
using Unity.Collections;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    /// <summary>
    /// Tunnels and bridges from the map (plan tasks/plan_20261120_world.md J): a <c>tunnel=yes</c> way through a ridge is a
    /// straight tube between its portals, the mountain over it stays, the car drives on its floor and inside it, the terrain is
    /// cut open only at the portals, it comes out the same in any load order across a tile border; an overpass bridge over a
    /// road leaves the road under it carved and drivable; a valley bridge stands on piers. CPU carve path, no scene.
    /// </summary>
    public class TunnelTests
    {
        const double RoadE = 1100, RidgeN = 1000;
        const int N = TileScheduler.Samples;

        static Dictionary<string, string> T(params string[] kv) { var d = new Dictionary<string, string>(); for (int i = 0; i < kv.Length; i += 2) d[kv[i]] = kv[i + 1]; return d; }

        /// <summary>A 100 m high east–west ridge on a plain at 50 m: 51.8 m at N 760 and 1240, 150 m on the crest.</summary>
        static float Ridge(double e, double n) { double x = (n - RidgeN) / 120; return (float)(50 + 100 * math.exp(-x * x)); }

        static RoadWay Way(long id, double n0, double n1, string tunnel = null, string highway = "secondary", double e = RoadE, double step = 10)
        {
            var w = new RoadWay { Id = id };
            w.Tags["highway"] = highway;
            if (tunnel != null) { w.Tags["tunnel"] = tunnel; w.Tags["layer"] = "-1"; }
            double dir = n1 >= n0 ? 1 : -1;
            for (double n = n0; dir * (n1 - n) > 1e-6; n += dir * step) w.Nodes.Add(new Utm33(e, n));
            w.Nodes.Add(new Utm33(e, n1));   // ways that meet share their end node
            return w;
        }

        static void Load(TileWorld world, TileKey key, Func<double, double, float> ground)
        {
            var dtm = new NativeArray<float>(N * N, Allocator.Temp);
            for (int row = 0; row < N; row++)
                for (int col = 0; col < N; col++)
                    dtm[row * N + col] = ground(key.Origin.E + col * key.CellM, key.Origin.N + row * key.CellM);
            world.OnTileData(key, dtm, null, null, 60.0);
            dtm.Dispose();
        }

        /// <summary>One coarse tile of <paramref name="ground"/> with the ways on it, graded and carved as GameController does (CPU path).</summary>
        static (TileWorld world, RoadGraph graph, List<RoadPolyline> lines, TileKey key) MakeWorld(Func<double, double, float> ground, params RoadWay[] ways)
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var world = new TileWorld(null, null);
            var graph = new RoadGraph();
            world.Roads = graph;
            var focus = new Utm33(RoadE, RidgeN);
            world.Scheduler.Update(focus, double2.zero, null);
            var key = TileKey.At(TileKind.Coarse, focus);
            Load(world, key, ground);
            var data = new RoadGraphData(); data.Ways.AddRange(ways);
            var probe = new WaterProbe(null, p => world.BaseHeightAt(p), p => world.IsLoaded(FloatingOrigin.ToWorldXZ(p)), world.InMappedWater);
            var lines = graph.SetTile(key, data, p => world.BaseHeightAt(p), null, probe.Wet, p => world.IsLoaded(FloatingOrigin.ToWorldXZ(p)));
            world.RecarveWithin(key.Bounds);
            return (world, graph, lines, key);
        }

        static (TileWorld, RoadGraph, List<RoadPolyline>, TileKey) RidgeWorld()
            => MakeWorld(Ridge, Way(1, 400, 760), Way(2, 760, 1240, "yes"), Way(3, 1240, 1600));

        static float2 At(double n, double e = RoadE) => new float2((float)e, (float)n);

        [Test]
        public void TunnelTags_YesIsATube_AvalancheProtectorAGallery_PassageCulvertNoAreNot()
        {
            Assert.AreEqual(TunnelKind.Tube, Tunnels.KindOf(T("highway", "primary", "tunnel", "yes", "layer", "-1")));
            Assert.AreEqual(TunnelKind.Gallery, Tunnels.KindOf(T("tunnel", "avalanche_protector")));
            Assert.AreEqual(TunnelKind.None, Tunnels.KindOf(T("tunnel", "building_passage")));
            Assert.AreEqual(TunnelKind.None, Tunnels.KindOf(T("tunnel", "culvert")));
            Assert.AreEqual(TunnelKind.None, Tunnels.KindOf(T("tunnel", "no")));
            Assert.AreEqual(TunnelKind.None, Tunnels.KindOf(T("highway", "primary")));
            Assert.IsFalse(RoadGraph.IsBarred(T("highway", "primary", "tunnel", "yes")), "stages may go through tunnels now");
        }

        [Test]
        public void Profile_StraightBetweenThePortals_DipsUnderTheSeaAtEightPercent()
        {
            var s = new double[801]; for (int i = 0; i < s.Length; i++) s[i] = i * 5;
            var plain = Tunnels.Profile(s, 20, 60, null);
            for (int i = 0; i < s.Length; i++) Assert.AreEqual(20 + 40 * s[i] / 4000, plain[i], 1e-9);
            var sea = new bool[s.Length];
            for (int i = 100; i <= 700; i++) sea[i] = true;   // a fjord from 500 m to 3500 m
            var h = Tunnels.Profile(s, 20, 60, sea);
            Assert.AreEqual(20, h[0], 1e-9, "portals stay");
            Assert.AreEqual(60, h[800], 1e-9);
            for (int i = 100; i <= 700; i++) Assert.LessOrEqual(h[i], math.max(-Tunnels.SubseaDepth, math.max(20 - 0.08 * s[i], 60 - 0.08 * (4000 - s[i]))) + 1e-9, $"under the fjord at {s[i]} m");
            Assert.AreEqual(-Tunnels.SubseaDepth, h[400], 1e-9, "the full depth in the middle");
            Assert.AreEqual(20 - 0.08 * 500, h[100], 1e-9, "as deep as 8 % from the portal gets at the shore");
            for (int i = 1; i < s.Length; i++) Assert.LessOrEqual(math.abs(h[i] - h[i - 1]) / 5, 0.08 + 1e-9, "no steeper than 8 %");
        }

        [Test]
        public void TunnelThroughARidge_MountainStays_FloorIsTheStraightPortalLine_CarInsideOnTheFloor()
        {
            var (world, graph, lines, key) = RidgeWorld();
            try
            {
                Assert.Greater(graph.TunnelSegmentCount, 80, "the tube is registered");
                var mid = new Utm33(RoadE, RidgeN);
                Assert.IsTrue(graph.Nearest(mid, 3, RoadLayer.Tunnel, out var tn) && tn.Tunnel, "a tunnel under the crest");
                Assert.IsFalse(graph.Nearest(mid, 3, RoadLayer.Ground, out _), "and no road on the ground there");
                float y0 = Ridge(RoadE, 760), y1 = Ridge(RoadE, 1240);
                Assert.AreEqual((y0 + y1) / 2, tn.RoadY, 0.3, "the floor is the straight line between the portals, not the mountain");
                // The mountain over the tube is not carved: natural ground on the crest and over the tube near the portals.
                foreach (double n in new[] { 850.0, 1000.0, 1150.0 })
                    Assert.AreEqual(Ridge(RoadE, n), world.CarvedHeightAt(new Utm33(RoadE, n)), 0.05, $"terrain over the tunnel at N {n}");
                Assert.AreEqual(0f, world.CarveMaskAt(mid), 0.01, "the crest is not masked (trees may grow on it)");
                // The car's ground: the tunnel floor inside, the mountain for an asker above the roof.
                float floor = tn.RoadY + RoadConstants.RoadLift + RoadConstants.RoadRibbonLift + RoadConstants.RoadCrown;
                Assert.AreEqual(floor, world.HeightAt(At(RidgeN)), 1e-3, "placed in the tunnel (no reference height): on the floor");
                world.ReferenceY = floor + 0.4f;
                Assert.AreEqual(floor, world.HeightAt(At(RidgeN)), 1e-3, "a car in the tube");
                Assert.AreEqual(Surface.Asphalt, world.SurfaceAt(At(RidgeN)));
                Assert.AreEqual(0f, world.WaterAt(At(RidgeN)).Depth);
                Assert.IsTrue(world.TunnelAt(At(RidgeN), out var spot));
                Assert.AreEqual(floor, spot.Floor, 1e-3);
                Assert.AreEqual(tn.RoadY + RoadConstants.TunnelCrown(tn.Half), spot.Crown, 1e-3);
                Assert.AreEqual(RoadConstants.TunnelHalf(tn.Half), spot.Half, 1e-4);
                world.ReferenceY = Ridge(RoadE, RidgeN) + 1f;
                Assert.AreEqual(Ridge(RoadE, RidgeN), world.HeightAt(At(RidgeN)), 0.05, "a car on the crest stands on the mountain");
                Assert.IsFalse(world.TunnelAt(At(RidgeN), out _));
                world.ReferenceY = float.NaN;
                Assert.IsFalse(world.TunnelAt(At(RidgeN, RoadE + 40), out _), "beside the tube: the mountain");
                // No step where the open road meets the portal, nor across the portal plane on the floor.
                foreach (double n in new[] { 760.0, 1240.0 })
                {
                    float a = world.HeightAt(At(n - 0.3)), b = world.HeightAt(At(n + 0.3));
                    Assert.AreEqual(a, b, 0.05, $"no step at the portal N={n}");
                }
                // Carve input: every tube segment is a TunnelOnly claim.
                var segs = new List<CarveSegment>();
                graph.CollectCarveSegments(key.Bounds, key.Origin, segs);
                int tunnelOnly = 0;
                foreach (var c in segs) if ((c.Flags & CarveSegment.TunnelOnly) != 0) tunnelOnly++;
                Assert.AreEqual(graph.TunnelSegmentCount, tunnelOnly);
                // Stage walks may use the tunnel, flagged.
                Assert.IsTrue(graph.NearestLink(mid, 5, out _)?.Tunnel ?? false, "the tunnel's link is drivable (not barred) and flagged");
            }
            finally { world.Dispose(); }
        }

        [Test]
        public void CarDrivesThroughTheTunnel_OnTheFloor_InsideTheTube()
        {
            var (world, graph, _, _) = RidgeWorld();
            try
            {
                var spec = CarSpec.For(CarKind.Porsche);
                var s = CarState.Create(spec, 42);
                CarSim.Reset(ref s, spec, world, At(600), 0f);
                int inTube = 0; float worstGap = 0f, worstSide = 0f;
                for (int i = 0; i < 60 * 120 && s.Pos.z < 1400; i++)
                {
                    world.ReferenceY = s.Pos.y;   // as CarController does
                    CarSim.Step(ref s, spec, new CarInput { Throttle = 0.6f }, world, null, ReadOnlySpan<WallBox>.Empty, 1f / 60f);
                    if (world.TunnelAt(s.Pos.xz, out var spot))
                    {
                        inTube++;
                        worstGap = math.max(worstGap, math.abs(s.Pos.y - spot.Floor));
                        worstSide = math.max(worstSide, math.abs(spot.Lateral));
                    }
                }
                world.ReferenceY = float.NaN;
                Assert.Greater(s.Pos.z, 1400, "through the ridge and out");
                Assert.Greater(inTube, 300, "frames in the tube");
                Assert.Less(worstGap, 0.6f, "on the tunnel floor all the way, never up on the mountain");
                Assert.Less(worstSide, 2f, "and in the middle of the tube");
            }
            finally { world.Dispose(); }
        }

        [Test]
        public void TunnelMesh_TubeLampsPortalsAndSolidWalls_TerrainCutOnlyAtThePortals()
        {
            var (world, graph, lines, key) = RidgeWorld();
            try
            {
                var draw = TunnelMesh.Build(lines, key.Origin, p => world.BaseHeightAt(p), out var solid);
                Assert.IsNotNull(draw, "the tube is drawn");
                Assert.IsNotNull(solid, "its walls are solid");
                graph.Nearest(new Utm33(RoadE, RidgeN), 3, RoadLayer.Tunnel, out var tn);
                float crown = tn.RoadY + RoadConstants.TunnelCrown(tn.Half);
                Assert.Greater(draw.bounds.max.y, crown, "roof (and portal faces) above the crown");
                Assert.Less(draw.bounds.size.x, 2 * (RoadConstants.TunnelHalf(tn.Half) + TunnelMesh.FaceWidth) + 1, "no wider than the portal faces");
                var colours = new List<UnityEngine.Color32>(); draw.GetColors(colours);
                int lamps = 0, deep = 0;
                foreach (var c in colours) { if (c.a == 255) lamps++; else if (c.a > 200) deep++; }
                Assert.Greater(lamps, 24 * 15, "a lamp every 24 m (24 vertices each)");
                Assert.Greater(deep, 0, "inside faces deep in the tube are lamp-lit, not sun-lit");
                UnityEngine.Object.DestroyImmediate(draw); UnityEngine.Object.DestroyImmediate(solid);

                // The terrain holes: only where the rock over the tube is thin (near the portals), none under the crest.
                world.UpdateTunnelHoles(new float3((float)RoadE, 60f, 700f));
                int near = world.TunnelHoleCount;
                Assert.Greater(near, 4, "pieces near the portals are cut");
                Assert.Less(near, graph.TunnelSegmentCount / 2, "the deep middle is not");
            }
            finally { world.Dispose(); }
        }

        [Test]
        public void TunnelAcrossATileBorder_AnyLoadOrder_SameFloorSameGround([Values(0, 1, 2, 3)] int order)
        {
            // A 1.2 km tunnel under a ridge on the border between two coarse tiles (N 2048).
            double ridgeN = 2048, e0 = 1100;
            Func<double, double, float> ground = (e, n) => { double x = (n - ridgeN) / 300; return (float)(80 + 30 * math.sin(e / 400) + 250 * math.exp(-x * x)); };
            var keys = new[] { new TileKey(TileKind.Coarse, 0, 0), new TileKey(TileKind.Coarse, 0, 1) };
            RoadGraphData Data()
            {
                var d = new RoadGraphData();
                d.Ways.Add(Way(1, 600, 1448, e: e0)); d.Ways.Add(Way(2, 1448, 2648, "yes", e: e0)); d.Ways.Add(Way(3, 2648, 3500, e: e0));
                return d;
            }
            var orders = new[] { "D0 D1 R0 R1", "D1 R1 D0 R0", "D0 R0 D1 R1", "D1 D0 R1 R0" };
            (float[] floor, float[][] carved) Run(string events)
            {
                FloatingOrigin.Set(new Utm33(0, 0));
                var world = new TileWorld(null, null);
                try
                {
                    world.Scheduler.Update(new Utm33(e0, ridgeN), double2.zero, null);
                    var roads = new RoadGraph(); world.Roads = roads;
                    foreach (var ev in events.Split(' '))
                    {
                        int k = ev[1] - '0';
                        if (ev[0] == 'D') { Load(world, keys[k], ground); continue; }
                        roads.SetTile(keys[k], Data(), p => world.BaseHeightAt(p), null, null, p => world.IsLoaded(FloatingOrigin.ToWorldXZ(p)));
                        world.RecarveWithin(new Bounds25833(-500, -500, 3000, 5000));
                        for (int round = 0; round < 4; round++)   // as GameController: until no tile is left to set again
                            foreach (var d in roads.TakeDirtyTiles()) { roads.Rebuild(d); world.RecarveWithin(new Bounds25833(-500, -500, 3000, 5000)); }
                    }
                    Assert.AreEqual(0, roads.TakeDirtyTiles().Count, $"'{events}': tiles set again settle (no ping-pong between the tunnel and its roads)");
                    foreach (var k in keys) roads.Rebuild(k);
                    Assert.AreEqual(0, roads.TakeDirtyTiles().Count, $"'{events}': setting a tile again without news flags nothing");
                    var floor = new List<float>();
                    for (double n = 1300; n <= 2800; n += 25) floor.Add(world.HeightAt(At(n, e0)));
                    return (floor.ToArray(), new[] { world.Tiles[keys[0]].Grid.Heights.ToArray(), world.Tiles[keys[1]].Grid.Heights.ToArray() });
                }
                finally { world.Dispose(); }
            }
            var (refFloor, refCarved) = Run(orders[0]);
            var (floorGot, carvedGot) = Run(orders[order]);
            for (int i = 0; i < refFloor.Length; i++) Assert.AreEqual(refFloor[i], floorGot[i], 0.05, $"order '{orders[order]}': floor at N {1300 + 25 * i}");
            for (int t = 0; t < 2; t++)
                for (int k = 0; k < refCarved[t].Length; k++)
                    Assert.AreEqual(refCarved[t][k], carvedGot[t][k], 0.05, $"order '{orders[order]}', tile {keys[t]}: carved sample {k}");
            // And it is a tube: straight between the portals, under the 330 m crest.
            float p0 = ground(e0, 1448), p1 = ground(e0, 2648);
            int crest = (int)((2048 - 1300) / 25);
            Assert.AreEqual((p0 + p1) / 2, refFloor[crest], 1.0, "the floor under the crest is the portal line");
        }

        [Test]
        public void OverpassBridge_RoadUnderItCarvedAndDrivable_DeckDrivableOverIt()
        {
            // An east–west road at 100 m crosses under a north–south bridge whose approaches run on 6 m embankments.
            // The DTM under the bridge dips 1.5 m below the road (as bridge-free DTMs often do): the road there must be carved.
            const double crossN = 1000;
            Func<double, double, float> ground = (e, n) =>
            {
                double dx = math.abs(e - RoadE), dn = math.abs(n - crossN);
                if (dx < 15 && dn < 20) return 98.5f;                                                   // the dip under the bridge
                if (dx < 12 && dn >= 30) return (float)(100 + 6 * (1 - math.saturate((dn - 30) / 200)));   // the embankments
                return 100f;
            };
            var under = new RoadWay { Id = 10 }; under.Tags["highway"] = "secondary";
            for (double e = RoadE - 400; e <= RoadE + 400; e += 10) under.Nodes.Add(new Utm33(e, crossN));
            var southApp = Way(11, 600, 970); var bridge = Way(12, 970, 1030); bridge.Tags["bridge"] = "yes"; bridge.Tags["layer"] = "1";
            var northApp = Way(13, 1030, 1400);
            var (world, graph, _, _) = MakeWorld(ground, under, southApp, bridge, northApp);
            try
            {
                var x = new Utm33(RoadE, crossN);
                Assert.IsTrue(graph.Nearest(x, 3, RoadLayer.Deck, out var deck) && deck.Id == 12, "the bridge deck over the road");
                Assert.IsTrue(graph.Nearest(new Utm33(RoadE + 8, crossN), 3, RoadLayer.Ground, out var road) && road.Id == 10, "the road under it");
                Assert.Greater(deck.RoadY - road.RoadY, RoadConstants.PassOver, "the deck passes over the road (no junction)");
                Assert.AreEqual(road.RoadY, 100, 0.6, "the road keeps its own grade under the bridge");
                // Under the deck the road is carved (a road at a different height takes nothing from the bridge's claim).
                Assert.IsTrue(graph.Nearest(new Utm33(RoadE - 2, crossN + 4), 6, RoadLayer.Ground, out var roadW));
                float carved = world.CarvedHeightAt(new Utm33(RoadE - 2, crossN + 4));   // on the road, nearer the deck's centre line than the road's (old code: the deck's claim, natural)
                // (A coarse-only tile: its carve sits CarveMargin under the road's terrace.)
                Assert.AreEqual(roadW.RoadY + RoadConstants.RoadLift + RoadConstants.CarveLift - RoadConstants.CarveMargin, carved, 0.1, "the road's flat band under the deck, not the 1.5 m dip");
                // A car on the road under the bridge drives on the road; a car on the deck on the deck.
                Assert.IsTrue(graph.Nearest(new Utm33(RoadE - 2, crossN + 4), 6, RoadLayer.Ground, out var road2));
                world.ReferenceY = road2.RoadY + 0.5f;
                Assert.AreEqual(road2.RoadY + RoadConstants.RoadLift + RoadConstants.RoadRibbonLift + RoadConstants.RoadCrown, world.HeightAt(At(crossN + 4, RoadE - 2)), 0.05, "under the deck: the road");
                world.ReferenceY = deck.RoadY + 0.5f;
                Assert.AreEqual(deck.RoadY + RoadConstants.RoadLift + RoadConstants.RoadRibbonLift + RoadConstants.RoadCrown, world.HeightAt(At(crossN)), 0.05, "on the deck: the deck");
                world.ReferenceY = float.NaN;
            }
            finally { world.Dispose(); }
        }

        [Test]
        public void ValleyBridge_StraightBankToBank_OnPiers_ValleyNotCarved()
        {
            // A tagged bridge over a dry 30 m deep, 200 m wide valley.
            Func<double, double, float> ground = (e, n) => { double d = math.abs(n - RidgeN); return (float)(d < 80 ? 70 : d < 100 ? 70 + (d - 80) * 1.5 : 100); };
            var bridge = Way(2, 890, 1110); bridge.Tags["bridge"] = "viaduct";
            var (world, graph, lines, key) = MakeWorld(ground, Way(1, 500, 890), bridge, Way(3, 1110, 1500));
            try
            {
                Assert.IsTrue(graph.Nearest(new Utm33(RoadE, RidgeN), 3, RoadLayer.Deck, out var deck));
                Assert.AreEqual(101, deck.RoadY, 1.5, "the deck runs bank to bank (plus its arch), not down into the valley");
                Assert.AreEqual(70, world.CarvedHeightAt(new Utm33(RoadE, RidgeN)), 0.05, "the valley floor under it is not carved");
                var draw = BridgeMesh.Build(lines, key.Origin, p => world.BaseHeightAt(p), out var solid, key.Bounds);
                Assert.IsNotNull(draw);
                Assert.Less(draw.bounds.min.y, 71f, "piers stand on the valley floor");
                UnityEngine.Object.DestroyImmediate(draw); if (solid != null) UnityEngine.Object.DestroyImmediate(solid);
            }
            finally { world.Dispose(); }
        }
    }
}
