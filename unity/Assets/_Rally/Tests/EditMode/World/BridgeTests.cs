using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.Vehicle;
using Rally.World;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    /// <summary>
    /// Bridges where roads cross water (legacy-js/tests/bridges.test.mjs, plan tasks/plan_20261119_bridges.md): which
    /// stretches are bridges (tags, water crossings, not streams / shores / causeways), the deck profile (bank to bank,
    /// clearance over the water, gentle ramps), no carve under a span, and the car on the deck: its ground, dry, across.
    /// </summary>
    public class BridgeTests
    {
        /// <summary>A straight line along +N every <paramref name="step"/> m from n0 to n1 at E = 0, with the distance along it.</summary>
        static (List<double2> pts, double[] s) Line(double n0, double n1, double step = 5)
        {
            var pts = new List<double2>();
            for (double n = n0; n <= n1 + 1e-6; n += step) pts.Add(new double2(0, n));
            var s = new double[pts.Count];
            for (int i = 0; i < s.Length; i++) s[i] = pts[i].y - n0;
            return (pts, s);
        }

        static List<BridgeSpan> Spans(List<double2> pts, double[] s, System.Func<double2, bool> wet, System.Func<double2, float> ground = null, double lateral = 12)
        {
            var wetAt = new bool[pts.Count];
            var core = Bridges.WetCore(pts, s, wet, lateral, ground, wetAt);
            return Bridges.MarkSpans(s, core, new bool[pts.Count], new bool[pts.Count]);
        }

        [Test]
        public void BridgeTags_YesAndViaductAreBridges_NoCulvertAndTunnelsAreNot()
        {
            Dictionary<string, string> T(params string[] kv) { var d = new Dictionary<string, string>(); for (int i = 0; i < kv.Length; i += 2) d[kv[i]] = kv[i + 1]; return d; }
            Assert.IsTrue(Bridges.IsBridgeTag(T("bridge", "yes")));
            Assert.IsTrue(Bridges.IsBridgeTag(T("bridge", "viaduct", "layer", "1")));
            Assert.IsFalse(Bridges.IsBridgeTag(T("bridge", "no")));
            Assert.IsFalse(Bridges.IsBridgeTag(T("bridge", "culvert")));
            Assert.IsFalse(Bridges.IsBridgeTag(T("bridge", "yes", "tunnel", "culvert")));
            Assert.IsFalse(Bridges.IsBridgeTag(T("highway", "primary")));
            Assert.IsTrue(Bridges.IsFord(T("ford", "yes")));
        }

        [Test]
        public void RiverCrossing_OneSpanBankToBank_StreamStaysACulvert()
        {
            var (pts, s) = Line(-100, 100);
            var spans = Spans(pts, s, p => math.abs(p.y) <= 10);   // a 20 m river along E
            Assert.AreEqual(1, spans.Count);
            double a = pts[spans[0].I0].y, b = pts[spans[0].I1].y;
            Assert.IsTrue(a < -10 && b > 10, $"span {a}..{b} covers the water");
            Assert.LessOrEqual(b - a, 35, "and not much more");
            var (p2, s2) = Line(-100, 100);
            Assert.AreEqual(0, Spans(p2, s2, p => math.abs(p.y) <= 1).Count, "a 2 m stream is a culvert");
        }

        [Test]
        public void NoBridge_WhereTheRoadOnlyClipsAShore_OrRunsOnACauseway()
        {
            var (pts, s) = Line(-100, 100);
            Assert.AreEqual(0, Spans(pts, s, p => p.x > -3 && math.abs(p.y) < 40).Count, "water on one side only");
            Assert.AreEqual(0, Spans(pts, s, p => math.abs(p.y) < 40, p => math.abs(p.x) < 8 ? 3f : 0f).Count, "the DTM under the road is 3 m above the water: fill");
        }

        [Test]
        public void WaterProbe_LakesRiversTheSea_NotCulverts_NotUnloadedTiles()
        {
            var f = new Features();
            var lake = new Area { Kind = "water" };
            lake.Rings.Add(new List<Utm33> { new Utm33(0, 0), new Utm33(50, 0), new Utm33(50, 50), new Utm33(0, 50) });
            f.Areas.Add(lake);
            f.Waterways.Add(new Waterway { Kind = "river", Width = 12, Points = new List<Utm33> { new Utm33(-100, 200), new Utm33(100, 200) } });
            f.Waterways.Add(new Waterway { Kind = "river", Width = 12, Culvert = true, Points = new List<Utm33> { new Utm33(-100, 300), new Utm33(100, 300) } });
            var probe = new WaterProbe(f, p => p.E > 500 ? 0f : 10f, p => p.E < 1000);
            Assert.IsTrue(probe.Wet(new double2(25, 25)), "in the lake");
            Assert.IsFalse(probe.Wet(new double2(25, 75)));
            Assert.IsTrue(probe.Wet(new double2(0, 205)), "in the river");
            Assert.IsFalse(probe.Wet(new double2(0, 210)));
            Assert.IsFalse(probe.Wet(new double2(0, 300)), "a culvert is no water for the bridge rule");
            Assert.IsTrue(probe.Wet(new double2(600, 600)), "the sea: DTM at 0");
            Assert.IsFalse(probe.Wet(new double2(1200, 600)), "an unloaded tile reads 0 too, but is not the sea");
        }

        [Test]
        public void DeckProfile_NeverDownToTheWater_ClearanceAboveIt_GentleRamps()
        {
            // Banks at 3 m, a 40 m wide river at 0 m: the plain grade sags into it.
            var (pts, s) = Line(-300, 300);
            float G(double2 p) => (float)(math.abs(p.y) < 20 ? 0 : math.abs(p.y) < 30 ? (math.abs(p.y) - 20) * 0.3 : 3);
            var raw = new double[pts.Count];
            for (int i = 0; i < raw.Length; i++) raw[i] = G(pts[i]);
            var plain = ProfileGrader.SmoothRoadHeights(raw, 5);
            int centre = pts.FindIndex(p => p.y == 0);
            Assert.Less(plain[centre], 2.5, $"without bridges the road sags to {plain[centre]:0.00} m");

            var wetAt = new bool[pts.Count];
            var core = Bridges.WetCore(pts, s, p => math.abs(p.y) <= 20, 12, null, wetAt);
            var spans = Bridges.MarkSpans(s, core, new bool[pts.Count], new bool[pts.Count]);
            Assert.AreEqual(1, spans.Count);
            Bridges.BridgeRaw(raw, s, spans);
            var y = ProfileGrader.SmoothRoadHeights(raw, 5);
            Bridges.ApplyProfile(pts, s, y, spans, wetAt, G);
            for (int i = 0; i < pts.Count; i++)
                if (wetAt[i]) Assert.GreaterOrEqual(y[i], math.max(G(pts[i]), Water.SeaLevel) + Bridges.WaterClearance - 1e-6, $"deck at N={pts[i].y}");
            for (int i = 1; i < pts.Count; i++) Assert.Less(math.abs(y[i] - y[i - 1]) / 5, 0.1, $"grade at N={pts[i].y}");
            Assert.AreEqual(plain[0], y[0], 1e-6, "far from the river the road is where it was");
        }

        [Test]
        public void CarveJob_TheDeckWinsItsCellsAndLeavesThemNatural_TheApproachEndsAtTheAbutment()
        {
            const int N = 41; const float Cell = 2f;
            var baseH = new NativeArray<float>(N * N, Allocator.TempJob);
            for (int i = 0; i < baseH.Length; i++) baseH[i] = 100;
            var heights = new NativeArray<float>(N * N, Allocator.TempJob);
            var mask = new NativeArray<byte>(N * N, Allocator.TempJob);
            var segs = new NativeArray<CarveSegment>(new[]
            {
                new CarveSegment { A = new float2(20, 0), B = new float2(20, 40), Ha = 104, Hb = 104, HalfWidth = 4, Shoulder = 2 },
                new CarveSegment { A = new float2(20, 40), B = new float2(20, 80), Ha = 104, Hb = 104, HalfWidth = 6, Shoulder = 6, Flags = CarveSegment.DeckOnly },
            }, Allocator.TempJob);
            try
            {
                new CarveJob { N = N, CellM = Cell, Base = baseH, Segments = segs, SegmentCount = 2, Heights = heights, Mask = mask }.Schedule(N, 8).Complete();
                float H(float x, float z) => heights[(int)(z / Cell) * N + (int)(x / Cell)];
                byte M(float x, float z) => mask[(int)(z / Cell) * N + (int)(x / Cell)];
                Assert.AreEqual(104, H(20, 20), 1e-5, "the approach is carved");
                Assert.AreEqual(104, H(20, 40), 1e-5, "up to the abutment");
                Assert.AreEqual(100, H(20, 44), 1e-5, "but not past it, where the bridge spans the ground (the deck is nearer than the end cap)");
                Assert.AreEqual(100, H(30, 42), 1e-5, "nor beside the abutment");
                Assert.AreEqual(100, H(20, 60), 1e-5, "nothing under the span");
                Assert.AreEqual(128, M(20, 60), "the deck's footprint keeps the trees off");
                Assert.AreEqual(0, M(32, 60), "beside it the ground is free");
                Assert.AreEqual(128, M(20, 44), "the footprint starts at the abutment");
            }
            finally { baseH.Dispose(); heights.Dispose(); mask.Dispose(); segs.Dispose(); }
        }

        // ---- the streamed world: a road over a sound ----------------------------------------------------------------

        const double RoadE = 1000, SoundN = 1000;
        /// <summary>Banks at 3 m, a 60 m sound at the DTM's sea value 0 across the road, 10 m of bank slope either side.</summary>
        static float Natural(double e, double n) { double d = math.abs(n - SoundN); return (float)(d < 30 ? 0 : d < 40 ? (d - 30) * 0.3 : 3); }

        static RoadWay Way(long id, double n0, double n1, bool bridge = false)
        {
            var w = new RoadWay { Id = id };
            w.Tags["highway"] = "primary";
            if (bridge) { w.Tags["bridge"] = "yes"; w.Tags["layer"] = "1"; }
            for (double n = n0; n <= n1 + 1e-6; n += 10) w.Nodes.Add(new Utm33(RoadE, n));
            return w;
        }

        /// <summary>A coarse tile of <see cref="Natural"/> with the ways on it, graded and carved as GameController does (CPU path).</summary>
        static (TileWorld world, RoadGraph graph, List<RoadPolyline> lines) MakeWorld(params RoadWay[] ways)
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var world = new TileWorld(null, null);
            var graph = new RoadGraph();
            world.Roads = graph;
            var focus = new Utm33(RoadE, SoundN);
            world.Scheduler.Update(focus, double2.zero, null);
            var key = TileKey.At(TileKind.Coarse, focus);
            var dtm = new NativeArray<float>(TileScheduler.Samples * TileScheduler.Samples, Allocator.Temp);
            for (int row = 0; row < TileScheduler.Samples; row++)
                for (int col = 0; col < TileScheduler.Samples; col++)
                    dtm[row * TileScheduler.Samples + col] = Natural(key.Origin.E + col * key.CellM, key.Origin.N + row * key.CellM);
            world.OnTileData(key, dtm, null, null, 60.0);
            dtm.Dispose();
            var data = new RoadGraphData(); data.Ways.AddRange(ways);
            var probe = new WaterProbe(null, p => world.BaseHeightAt(p), p => world.IsLoaded(FloatingOrigin.ToWorldXZ(p)), world.InMappedWater);
            var lines = graph.SetTile(key, data, p => world.BaseHeightAt(p), null, probe.Wet);
            world.RecarveWithin(key.Bounds);
            return (world, graph, lines);
        }

        static float2 At(double n) => new float2((float)RoadE, (float)n);

        [Test]
        public void RoadOverTheSea_DeckClearsTheWater_GroundUnderItUncarved_CarOnTheDeckIsDry()
        {
            var (world, graph, lines) = MakeWorld(Way(1, 600, 1400));
            try
            {
                var mid = new Utm33(RoadE, SoundN);
                Assert.IsTrue(graph.Nearest(mid, 3, RoadLayer.Deck, out var deck), "a bridge over the sound");
                Assert.IsTrue(deck.Bridge);
                Assert.GreaterOrEqual(deck.RoadY, Water.SeaLevel + Bridges.WaterClearance - 1e-3, "the deck clears the sea plane");
                Assert.IsFalse(graph.Nearest(mid, 3, RoadLayer.Ground, out _), "no road on the ground there");
                Assert.IsTrue(graph.Nearest(new Utm33(RoadE, 700), 3, RoadLayer.Ground, out var land) && !land.Bridge, "on the land the road is a road");
                Assert.Greater(graph.BridgeSegmentCount, 0);

                Assert.AreEqual(0, world.CarvedHeightAt(mid), 0.05, "the sea floor under the deck is not carved up to the road");
                Assert.AreEqual(0, world.CarvedHeightAt(new Utm33(RoadE, SoundN - 16)), 0.05, "nor filled out from the abutment");
                Assert.AreEqual(128 / 255f, world.CarveMaskAt(mid), 0.02, "the deck's footprint is masked (no trees through it)");

                float top = deck.RoadY + RoadConstants.RoadLift + RoadConstants.RoadRibbonLift + RoadConstants.RoadCrown;
                Assert.AreEqual(top, world.HeightAt(At(SoundN)), 1e-3, "the car's ground on the deck is the ribbon");
                Assert.AreEqual(RoadConstants.DeckTop(deck.RoadY), world.HeightAt(new float2((float)RoadE + deck.Half + RoadConstants.RoadShoulder + 0.5f, (float)SoundN)), 1e-3, "out to the rails the slab");
                Assert.AreEqual(0, world.WaterAt(At(SoundN)).Depth, "dry on the deck");
                Assert.AreEqual(Surface.Asphalt, world.SurfaceAt(At(SoundN)));
                Assert.Greater(world.WaterAt(new float2((float)RoadE + 20, (float)SoundN)).Depth, 1f, "the sea beside the bridge");

                world.ReferenceY = 0.3f;   // a car in the water under the deck
                Assert.AreEqual(0, world.HeightAt(At(SoundN)), 0.05, "under the deck: the sea floor");
                Assert.Greater(world.WaterAt(At(SoundN)).Depth, 1f, "and wet");
                world.ReferenceY = float.NaN;

                var draw = BridgeMesh.Build(lines, TileKey.At(TileKind.Coarse, mid).Origin, p => world.BaseHeightAt(p), out var solid);
                Assert.IsNotNull(draw, "a deck is drawn");
                Assert.IsNotNull(solid, "rails and piers are solid");
                Assert.Less(draw.bounds.min.y, 0f, "the piers stand in the sea floor");
                Assert.Greater(draw.bounds.max.y, top + 0.5f, "the rails stand on the deck");
                UnityEngine.Object.DestroyImmediate(draw); UnityEngine.Object.DestroyImmediate(solid);
            }
            finally { world.Dispose(); }
        }

        [Test]
        public void QuayRoad_OverTheDtmSea_IsNoBridge_AndIsGradedAboveTheSeaPlane()
        {
            // Sea (DTM 0) from 5 m west of the road eastwards: water on one side only.
            var g = new RoadGraph();
            var data = new RoadGraphData(); data.Ways.Add(Way(1, 600, 1400));
            float Ground(Utm33 p) => p.E > RoadE - 5 ? 0f : 3f;
            g.SetTile(TileKey.At(TileKind.Coarse, new Utm33(RoadE, SoundN)), data, Ground, null, q => Ground(new Utm33(q.x, q.y)) < 0.1f);
            Assert.AreEqual(0, g.BridgeSegmentCount, "a shore road is not a bridge");
            Assert.IsTrue(g.Nearest(new Utm33(RoadE, SoundN), 3, out var q));
            Assert.GreaterOrEqual(q.RoadY, RoadGraph.MinGradeGround - 1e-3, "and not graded under the sea plane");
        }

        [Test]
        public void TaggedBridgeWay_MeetsItsApproachesWithoutAStep_ApproachCarveStopsAtTheAbutments()
        {
            var (world, graph, _) = MakeWorld(Way(1, 600, 960), Way(2, 960, 1040, bridge: true), Way(3, 1040, 1400));
            try
            {
                Assert.IsTrue(graph.Nearest(new Utm33(RoadE, SoundN), 3, RoadLayer.Deck, out var deck) && deck.Id == 2, "the tagged way is the deck");
                foreach (double n in new[] { 960.0, 1040.0 })
                {
                    float a = world.HeightAt(At(n - 0.3)), b = world.HeightAt(At(n + 0.3));
                    Assert.AreEqual(a, b, 0.05, $"no step where the bridge meets the road at N={n}");
                }
                // The approaches end square at the abutments: the sound beyond them is not filled.
                Assert.AreEqual(0, world.CarvedHeightAt(new Utm33(RoadE, SoundN - 24)), 0.05);
                Assert.AreEqual(0, world.CarvedHeightAt(new Utm33(RoadE, SoundN + 24)), 0.05);
                var segs = new List<CarveSegment>();
                graph.CollectCarveSegments(new Bounds25833(0, 0, 2048, 2048), new Utm33(0, 0), segs);
                int deckOnly = 0;
                foreach (var c in segs) if ((c.Flags & CarveSegment.DeckOnly) != 0) deckOnly++;
                Assert.AreEqual(graph.BridgeSegmentCount, deckOnly, "every span segment carves as a deck");
            }
            finally { world.Dispose(); }
        }

        [Test]
        public void CarDrivesAcrossTheBridge_OnTheDeck_NeverInTheWater()
        {
            var (world, graph, _) = MakeWorld(Way(1, 600, 1400));
            try
            {
                var spec = CarSpec.For(CarKind.Porsche);
                var s = CarState.Create(spec, 42);
                CarSim.Reset(ref s, spec, world, At(700), 0f);
                float minGap = float.PositiveInfinity, maxDepth = 0f;
                int overWater = 0, onDeck = 0;
                for (int i = 0; i < 60 * 40 && s.Pos.z < 1100; i++)
                {
                    world.ReferenceY = s.Pos.y;   // as CarController does
                    CarSim.Step(ref s, spec, new CarInput { Throttle = 0.7f }, world, null, System.ReadOnlySpan<WallBox>.Empty, 1f / 60f);
                    world.ReferenceY = s.Pos.y;
                    if (math.abs(s.Pos.z - SoundN) < 30)
                    {
                        overWater++;
                        if (graph.Nearest(FloatingOrigin.ToUtm(s.Pos.xz), 3, RoadLayer.Deck, out var d)) { onDeck++; minGap = math.min(minGap, s.Pos.y - RoadConstants.DeckTop(d.RoadY)); }
                    }
                    maxDepth = math.max(maxDepth, world.WaterAt(s.Pos.xz).Depth);
                }
                world.ReferenceY = float.NaN;
                Assert.Greater(s.Pos.z, 1100, "the car got across");
                Assert.AreEqual(RoadE, s.Pos.x, 1.5, "on the road");
                Assert.Greater(overWater, 0);
                Assert.AreEqual(overWater, onDeck, "over the water the car is over the deck");
                Assert.Greater(minGap, -0.3f, "and on it, not under it");
                Assert.AreEqual(0f, maxDepth, "never in the water");
            }
            finally { world.Dispose(); }
        }
    }
}
