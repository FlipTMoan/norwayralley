using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.World;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    /// <summary>
    /// The streaming work cut into frame-sized pieces (WorkBudget, 2026-11-20) gives the same world as doing it at once:
    /// the DEM resample on a projection lattice, the road grading in steps, the queued re-carves.
    /// </summary>
    public class StreamingBudgetTests
    {
        [TearDown] public void ResetBudget() { WorkBudget.FrameMs = WorkBudget.BaseMs = 5f; WorkBudget.Reset(); }

        [Test]
        public void DemResample_OnTheProjectionLattice_MatchesTheExactProjection()
        {
            var bounds = new Bounds25833(12288, 6643712, 14336, 6645760);
            var env = LatLonBounds.Of(bounds);
            const int w = 300, h = 300;
            var img = new GeoTiffImage { Width = w, Height = h, Samples = new float[w * h] };
            for (int y = 0; y < h; y++)
                for (int x = 0; x < w; x++)
                    img.Samples[y * w + x] = (float)(200 + 80 * math.sin(x * 0.11) + 60 * math.cos(y * 0.07) + 15 * math.sin(x * 0.5 + y * 0.3));   // steep: errors show
            var grid = new HeightGrid(TileScheduler.Samples, 8f, bounds.Min);
            try
            {
                KartverketDem.Resample(img, env, grid);
                double sx = w / (env.MaxLon - env.MinLon), sy = h / (env.MaxLat - env.MinLat);
                float worst = 0;
                for (int row = 0; row < grid.N; row += 7)
                    for (int col = 0; col < grid.N; col += 5)
                    {
                        var p = Proj.ToLatLon(new Utm33(grid.Origin.E + col * 8.0, grid.Origin.N + row * 8.0));
                        double fx = math.clamp((p.Lon - env.MinLon) * sx - 0.5, 0, w - 1.0001), fy = math.clamp((env.MaxLat - p.Lat) * sy - 0.5, 0, h - 1.0001);
                        int x = (int)fx, y = (int)fy; float tx = (float)(fx - x), ty = (float)(fy - y);
                        float exact = (img.Samples[y * w + x] * (1 - tx) + img.Samples[y * w + x + 1] * tx) * (1 - ty) + (img.Samples[(y + 1) * w + x] * (1 - tx) + img.Samples[(y + 1) * w + x + 1] * tx) * ty;
                        worst = math.max(worst, math.abs(exact - grid[col, row]));
                    }
                Assert.Less(worst, 0.005f, "lattice projection within 5 mm of the exact one on a steep raster");
            }
            finally { grid.Dispose(); }
        }

        [Test]
        public void CpuCarve_InBandsOfRows_IsIdenticalToOneJobOverAllSegments()
        {
            var atlas = new TileAtlas(TileScheduler.Samples, 1, 0, false);
            var tile = new TerrainTile(new TileKey(TileKind.Coarse, 2, 3), atlas);
            int n = TileScheduler.Samples;
            var dtm = new NativeArray<float>(n * n, Allocator.Temp);
            var heights = new NativeArray<float>(n * n, Allocator.TempJob);
            var mask = new NativeArray<byte>(n * n, Allocator.TempJob);
            var segs = new NativeArray<CarveSegment>(400, Allocator.TempJob);
            try
            {
                for (int i = 0; i < dtm.Length; i++) dtm[i] = 100 + 30 * math.sin(i % n * 0.05f) + 20 * math.cos(i / n * 0.03f);
                tile.SetBase(dtm);
                var rnd = new Unity.Mathematics.Random(7);
                for (int i = 0; i < segs.Length; i++)
                {
                    var a = rnd.NextFloat2(-40, 2088); var d = rnd.NextFloat2Direction() * rnd.NextFloat(3, 40);
                    float h = rnd.NextFloat(70, 160);
                    segs[i] = new CarveSegment { A = a, B = a + d, Ha = h, Hb = h + rnd.NextFloat(-3, 3), HalfWidth = rnd.NextFloat(2, 16), Shoulder = rnd.NextFloat(1.5f, 6), Flags = i % 37 == 0 ? CarveSegment.DeckOnly : 0u };
                }
                new CarveJob { N = n, CellM = 8, Base = tile.Base, Segments = segs, SegmentCount = segs.Length, Heights = heights, Mask = mask }.Schedule(n, 8).Complete();
                new CpuCarver().Carve(tile, segs, segs.Length);
                for (int i = 0; i < n * n; i++)
                {
                    Assert.AreEqual(heights[i], tile.Grid.Heights[i], $"height {i}");
                    Assert.AreEqual(mask[i], tile.Mask[i], $"mask {i}");
                }
            }
            finally { dtm.Dispose(); heights.Dispose(); mask.Dispose(); segs.Dispose(); tile.Dispose(); atlas.Dispose(); }
        }

        [Test]
        public void Budget_GrowsWhileTheCarWaits_AndKeepsAShareOfSlowFrames()
        {
            WorkBudget.Scale(true, 16f);
            Assert.AreEqual(WorkBudget.WaitingMs, WorkBudget.FrameMs, "loading, start screen, countdown");
            WorkBudget.Scale(false, 16f);
            Assert.AreEqual(5f, WorkBudget.FrameMs, 1e-4, "60 fps: the base budget");
            WorkBudget.Scale(false, 100f);
            Assert.AreEqual(25f, WorkBudget.FrameMs, 1e-4, "10 fps: a quarter of the frame, so the first roads do not take minutes");
            WorkBudget.Scale(false, 1000f);
            Assert.AreEqual(33f, WorkBudget.FrameMs, 1e-4, "capped");
        }

        static RoadGraphData Ways()
        {
            var d = new RoadGraphData();
            for (int k = 0; k < 6; k++)
            {
                var w = new RoadWay { Id = k + 1 };
                w.Tags["highway"] = k % 2 == 0 ? "tertiary" : "track";
                for (double e = 4200; e <= 5900; e += 50) w.Nodes.Add(new Utm33(e, 7000 + k * 230 + 40 * math.sin(e / 300)));
                d.Ways.Add(w);
            }
            return d;
        }

        [Test]
        public void RoadGrading_InSteps_GivesTheSameRoadsAsAtOnce()
        {
            var key = new TileKey(TileKind.Coarse, 2, 3);
            System.Func<Utm33, float> ground = p => (float)(100 + 0.1 * p.E + 20 * math.sin(p.N / 200));
            var once = new RoadGraph();
            var a = once.SetTile(key, Ways(), ground);

            var stepped = new RoadGraph();
            var b = new List<RoadPolyline>();
            WorkBudget.FrameMs = 0f;          // spent before it starts: a pause after every way
            WorkBudget.BeginFrame();
            var steps = stepped.SetTileSteps(b, key, Ways(), ground);
            int pauses = 0;
            while (steps.MoveNext()) pauses++;
            Assert.GreaterOrEqual(pauses, 5, "it paused between the ways");
            Assert.AreEqual(once.SegmentCount, stepped.SegmentCount);
            Assert.AreEqual(a.Count, b.Count);
            for (int i = 0; i < a.Count; i++)
            {
                Assert.AreEqual(a[i].Samples.Count, b[i].Samples.Count);
                for (int k = 0; k < a[i].Samples.Count; k++) Assert.AreEqual(a[i].Samples[k].RoadY, b[i].Samples[k].RoadY);
            }
            // Dropped half way: what was in goes out with it.
            var dropped = new RoadGraph();
            steps = dropped.SetTileSteps(new List<RoadPolyline>(), key, Ways(), ground);
            steps.MoveNext(); steps.MoveNext();
            Assert.Greater(dropped.SegmentCount, 0);
            Assert.IsFalse(dropped.HasTile(key), "half graded is not 'the tile's roads are in' (the free-drive start waited on it and picked another road)");
            Assert.IsTrue(stepped.HasTile(key), "graded to the end");
            dropped.RemoveTile(key);
            Assert.AreEqual(0, dropped.SegmentCount);
        }

        [Test]
        public void QueuedRecarves_CarveEveryTileTheSameAsAtOnce_NearestFirst()
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var world = new TileWorld(null, null);
            try
            {
                var focus = new Utm33(5000, 7500);
                world.Scheduler.Update(focus, double2.zero, null);
                var keys = new List<TileKey>();
                for (int j = 2; j <= 4; j++) for (int i = 1; i <= 3; i++) keys.Add(new TileKey(TileKind.Coarse, i, j));
                foreach (var k in keys)
                {
                    var dtm = new NativeArray<float>(TileScheduler.Samples * TileScheduler.Samples, Allocator.Temp);
                    for (int r = 0; r < TileScheduler.Samples; r++)
                        for (int c = 0; c < TileScheduler.Samples; c++)
                            dtm[r * TileScheduler.Samples + c] = (float)(100 + 0.1 * (k.Origin.E + c * 8) + 20 * math.sin((k.Origin.N + r * 8) / 200));
                    world.OnTileData(k, dtm, null, null, 60.0);
                    dtm.Dispose();
                }
                var roads = new RoadGraph();
                world.Roads = roads;
                roads.SetTile(new TileKey(TileKind.Coarse, 2, 3), Ways(), p => world.BaseHeightAt(p));
                var b = new TileKey(TileKind.Coarse, 2, 3).Bounds;
                world.QueueRecarveWithin(new Bounds25833(b.MinE - 60, b.MinN - 60, b.MaxE + 60, b.MaxN + 60));
                Assert.AreEqual(9, world.RecarvePending, "the tile and its eight neighbours");
                var centre = world.Tiles[new TileKey(TileKind.Coarse, 2, 3)];
                float before = centre.Grid[100, 104];   // on way 1, 1.6 m off its centre line
                WorkBudget.FrameMs = 0f; WorkBudget.BeginFrame();
                world.Update(FloatingOrigin.ToWorld(new Utm33(5100, 7100), 0), double2.zero, null, 0.02f);
                Assert.AreEqual(8, world.RecarvePending, "one carve per frame when the budget is spent");
                Assert.AreNotEqual(before, centre.Grid[100, 104], "the tile under the car first");
                for (int f = 0; f < 10 && world.RecarvePending > 0; f++) { WorkBudget.BeginFrame(); world.Update(FloatingOrigin.ToWorld(new Utm33(5100, 7100), 0), double2.zero, null, 0.02f); }
                Assert.AreEqual(0, world.RecarvePending);
                var queued = new Dictionary<TileKey, float[]>();
                foreach (var k in keys) queued[k] = world.Tiles[k].Grid.Heights.ToArray();
                world.RecarveWithin(new Bounds25833(-1e9, -1e9, 1e9, 1e9));
                foreach (var k in keys) CollectionAssert.AreEqual(queued[k], world.Tiles[k].Grid.Heights.ToArray(), $"{k}");
            }
            finally { world.Dispose(); }
        }
    }
}
