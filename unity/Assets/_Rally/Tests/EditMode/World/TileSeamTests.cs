using System;
using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.World;
using Unity.Collections;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Tests.World
{
    /// <summary>
    /// Tile borders (seam survey 2026-11-20, PreviewShots -previewSeams): every tile's DTM is its own request, so neighbours
    /// disagree on their common edge; the 1 m and 8 m DTMs differ; a coarse tile collected road segments by a narrower reach
    /// than it carved them with; ribbons were drawn by both tiles of a border; roads were graded on ground not loaded yet.
    /// One test per kind of seam, CPU carve path (no compute shader, no scene).
    /// </summary>
    public class TileSeamTests
    {
        const int N = TileScheduler.Samples;

        /// <summary>A smooth landscape plus a per-tile bias and per-sample noise, so no two tiles agree on an edge.</summary>
        static void Load(TileWorld world, TileKey key, System.Random rnd, float bias = float.NaN, Func<double, double, float> ground = null)
        {
            float b = float.IsNaN(bias) ? (float)(rnd.NextDouble() * 10 - 5) : bias;
            var dtm = new NativeArray<float>(N * N, Allocator.Temp);
            for (int row = 0; row < N; row++)
                for (int col = 0; col < N; col++)
                {
                    double e = key.Origin.E + col * key.CellM, n = key.Origin.N + row * key.CellM;
                    float h = ground != null ? ground(e, n) : (float)(300 + 40 * math.sin(e / 700) + 25 * math.cos(n / 900));
                    dtm[row * N + col] = h + b + (rnd != null ? (float)(rnd.NextDouble() - 0.5) * 0.6f : 0f);
                }
            world.OnTileData(key, dtm, null, null, 60.0);
            dtm.Dispose();
        }

        static List<Utm33> Centres(TileKind kind, int i0, int j0, int count)
        {
            var pts = new List<Utm33>();
            float s = kind == TileKind.Coarse ? TileScheduler.CoarseSize : TileScheduler.FineSize;
            for (int j = 0; j < count; j++) for (int i = 0; i < count; i++) pts.Add(new Utm33((i0 + i + 0.5) * s, (j0 + j + 0.5) * s));
            return pts;
        }

        /// <summary>Every shared edge sample and every shared corner of two ready tiles of a kind: base and carved grids equal, bit for bit.</summary>
        static void AssertSeamless(TileWorld world, TileKind kind)
        {
            int pairs = 0;
            foreach (var a in world.Tiles.Values)
            {
                if (a.Key.Kind != kind || !a.HasHeights) continue;
                for (int dj = -1; dj <= 1; dj++)
                    for (int di = -1; di <= 1; di++)
                    {
                        if ((di == 0 && dj == 0) || !world.Tiles.TryGetValue(new TileKey(kind, a.Key.I + di, a.Key.J + dj), out var b) || !b.HasHeights) continue;
                        pairs++;
                        for (int k = 0; k < N; k++)
                        {
                            // The sample of a on the shared edge / corner and the same point in b.
                            int ca = di < 0 ? 0 : di > 0 ? N - 1 : k, ra = dj < 0 ? 0 : dj > 0 ? N - 1 : k;
                            int cb = di < 0 ? N - 1 : di > 0 ? 0 : k, rb = dj < 0 ? N - 1 : dj > 0 ? 0 : k;
                            Assert.AreEqual(a.Base[ra * N + ca], b.Base[rb * N + cb], $"{a.Key}/{b.Key} base at {k}");
                            Assert.AreEqual(a.Grid[ca, ra], b.Grid[cb, rb], $"{a.Key}/{b.Key} carved at {k}");
                            if (di != 0 && dj != 0) break;   // a corner is one point
                        }
                    }
            }
            Assert.Greater(pairs, 0);
        }

        static void SharedEdges(TileKind kind, int seed)
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var world = new TileWorld(null, null);
            try
            {
                int i0 = kind == TileKind.Coarse ? 3 : 30, j0 = 5;
                var centres = Centres(kind, i0, j0, 3);
                world.Scheduler.Update(centres[4], double2.zero, kind == TileKind.Fine ? centres : null);
                var keys = new List<TileKey>();
                foreach (var c in centres) keys.Add(TileKey.At(kind, c));
                var rnd = new System.Random(seed);
                for (int i = keys.Count - 1; i > 0; i--) { int k = rnd.Next(i + 1); (keys[i], keys[k]) = (keys[k], keys[i]); }
                foreach (var key in keys) { Assert.IsTrue(world.Tiles.ContainsKey(key), $"{key} wanted"); Load(world, key, rnd); }
                AssertSeamless(world, kind);
            }
            finally { world.Dispose(); }
        }

        [Test] public void SharedEdges_Coarse_IdenticalInAnyLoadOrder([Values(1, 2, 3, 4)] int seed) => SharedEdges(TileKind.Coarse, seed);
        [Test] public void SharedEdges_Fine_IdenticalInAnyLoadOrder([Values(1, 2, 3, 4)] int seed) => SharedEdges(TileKind.Fine, seed);

        [Test]
        public void Stitch_LeavesTheMiddleOfATileAlone()
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var world = new TileWorld(null, null);
            try
            {
                var centres = Centres(TileKind.Coarse, 3, 5, 2);
                world.Scheduler.Update(centres[0], double2.zero, null);
                Load(world, TileKey.At(TileKind.Coarse, centres[0]), null, 0f);
                var b = TileKey.At(TileKind.Coarse, centres[1]);
                Load(world, b, null, 4f);   // 4 m higher than its west neighbour
                var t = world.Tiles[b];
                Assert.AreEqual(world.Tiles[TileKey.At(TileKind.Coarse, centres[0])].Base[100 * N + N - 1], t.Base[100 * N], "edge taken over");
                float own = (float)(300 + 40 * math.sin((b.Origin.E + TileWorld.StitchCoarse * 8) / 700) + 25 * math.cos((b.Origin.N + 100 * 8) / 900)) + 4f;
                Assert.AreEqual(own, t.Base[100 * N + TileWorld.StitchCoarse], 1e-3, "from the feather width on: the tile's own DTM");
                float half = t.Base[100 * N + TileWorld.StitchCoarse / 2];
                Assert.Greater(half, t.Base[100 * N] + 0.5f);
                Assert.Less(half, own - 0.5f, "half way through the feather: in between");
            }
            finally { world.Dispose(); }
        }

        /// <summary>A coarse tile, a fine tile in it 2 m off (another DTM), and a fine neighbour east of that one.</summary>
        static TileWorld FineWorld(out TileKey fine, out TileKey east, bool fade)
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var world = new TileWorld(null, null);
            if (fade) world.Clipmap = new Clipmap(null);
            var c0 = new Utm33(10 * 256 + 128, 30 * 256 + 128);
            fine = TileKey.At(TileKind.Fine, c0);
            east = new TileKey(TileKind.Fine, fine.I + 1, fine.J);
            world.Scheduler.Update(c0, double2.zero, new List<Utm33> { c0, new Utm33(c0.E + 256, c0.N) });
            Load(world, TileKey.At(TileKind.Coarse, c0), null, 0f, (e, n) => 100f);
            return world;
        }

        [Test]
        public void FineOutline_BlendsIntoTheCoarseGround_NoStep()
        {
            var world = FineWorld(out var fine, out var east, false);
            try
            {
                var rnd = new System.Random(5);
                Load(world, fine, null, 0f, (e, n) => 102f);
                var o = fine.Origin;
                // West outline (no fine neighbour): the drawn ground meets the coarse ground; deep inside it is the 1 m DTM.
                for (double n = o.N + 3; n < o.N + 256; n += 17)
                {
                    float outside = world.CarvedHeightAt(new Utm33(o.E - 0.01, n)), inside = world.CarvedHeightAt(new Utm33(o.E + 0.01, n));
                    Assert.AreEqual(outside, inside, 0.02f, $"step at the outline, N {n}");
                    Assert.AreEqual(world.BaseHeightAt(new Utm33(o.E - 0.01, n)), world.BaseHeightAt(new Utm33(o.E + 0.01, n)), 0.02f, "natural ground too");
                }
                Assert.AreEqual(102f, world.CarvedHeightAt(new Utm33(o.E + 128, o.N + 128)), 1e-4, "inside: the fine DTM");
                Assert.AreEqual(101f, world.CarvedHeightAt(new Utm33(o.E + TileWorld.FineBlendM / 2, o.N + 128)), 0.05f, "half way through the band");
                // A fine neighbour continues the 1 m ground: no blend across the shared edge, from either side.
                Load(world, east, null, 0f, (e, n) => 102f);
                var edge = o.E + 256;
                Assert.AreEqual(102f, world.CarvedHeightAt(new Utm33(edge - 0.01, o.N + 128)), 1e-4);
                Assert.AreEqual(102f, world.CarvedHeightAt(new Utm33(edge + 0.01, o.N + 128)), 1e-4);
                // ... but where the shared edge reaches a bare corner the blend follows the corner, the same from both tiles.
                Assert.AreEqual(world.CarvedHeightAt(new Utm33(edge - 0.01, o.N + 5)), world.CarvedHeightAt(new Utm33(edge + 0.01, o.N + 5)), 0.02f);
                Assert.Less(world.CarvedHeightAt(new Utm33(edge, o.N + 5)), 101.9f, "near the bare south outline the ground leans to the coarse");
            }
            finally { world.Dispose(); }
        }

        [Test]
        public void FineTile_FadesInInsteadOfPopping()
        {
            var world = FineWorld(out var fine, out var east, true);
            try
            {
                Load(world, fine, null, 0f, (e, n) => 102f);
                var mid = new Utm33(fine.Origin.E + 128, fine.Origin.N + 128);
                Assert.AreEqual(100f, world.CarvedHeightAt(mid), 1e-4, "just arrived: still the coarse ground");
                var car = FloatingOrigin.ToWorld(new Utm33(fine.Origin.E + 256, mid.N), 0);   // on the shared edge: the scheduler keeps wanting both tiles
                world.Update(car, double2.zero, null, TileWorld.FineFadeSeconds / 2);
                Assert.AreEqual(101f, world.CarvedHeightAt(mid), 1e-3, "half way");
                // A neighbour arriving now: the shared edge is the same from both sides while one fades and the other is in.
                world.Update(car, double2.zero, null, TileWorld.FineFadeSeconds);
                Load(world, east, null, 0f, (e, n) => 102f);
                world.Update(car, double2.zero, null, TileWorld.FineFadeSeconds * 0.3f);
                var edge = fine.Origin.E + 256;
                float l = world.CarvedHeightAt(new Utm33(edge - 0.001, fine.Origin.N + 128)), r = world.CarvedHeightAt(new Utm33(edge + 0.001, fine.Origin.N + 128));
                Assert.AreEqual(l, r, 1e-3, "shared edge while the east tile fades in");
                Assert.AreEqual(100.6f, l, 0.01f);
                Assert.AreEqual(102f, world.CarvedHeightAt(mid), 1e-4, "the first tile is fully in");
            }
            finally { world.Dispose(); }
        }

        static RoadWay Way(long id, string highway, double n, double e0, double e1)
        {
            var w = new RoadWay { Id = id };
            w.Tags["highway"] = highway;
            for (double e = e0; e <= e1 + 1e-6; e += 40) w.Nodes.Add(new Utm33(e, n));
            return w;
        }

        [Test]
        public void CoarseEdge_CarvedTheSame_WhenARoadRunsJustOutsideOneTile()
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var world = new TileWorld(null, null);
            try
            {
                var south = new TileKey(TileKind.Coarse, 2, 3); var north = new TileKey(TileKind.Coarse, 2, 4);
                double edgeN = north.Origin.N;
                // A sloping hillside; the road runs east–west 20 m south of the border: inside the coarse carve's widened band of the
                // north tile's edge samples, outside the reach the segments used to be collected by.
                Func<double, double, float> slope = (e, n) => (float)(200 + 0.25 * (n - edgeN));
                var roads = new RoadGraph();
                var data = new RoadGraphData(); data.Ways.Add(Way(1, "tertiary", edgeN - 20, south.Origin.E + 200, south.Origin.E + 1800));
                roads.SetTile(south, data, p => slope(p.E, p.N));
                world.Roads = roads;
                world.Scheduler.Update(new Utm33(south.Origin.E + 1024, edgeN), double2.zero, null);
                Load(world, south, null, 0f, slope);
                Load(world, north, null, 0f, slope);
                var s = world.Tiles[south]; var nt = world.Tiles[north];
                int carvedSamples = 0;
                for (int k = 0; k < N; k++)
                {
                    Assert.AreEqual(s.Grid[k, N - 1], nt.Grid[k, 0], $"carved edge sample {k}");
                    if (math.abs(s.Grid[k, N - 1] - s.Base[(N - 1) * N + k]) > 0.1f) carvedSamples++;
                }
                Assert.Greater(carvedSamples, 100, "the road's earthworks reach the border (the case under test)");
            }
            finally { world.Dispose(); }
        }

        [Test]
        public void Ribbon_EachStretchDrawnByOneTile_VContinuesAcrossTheBorder()
        {
            var west = new TileKey(TileKind.Coarse, 2, 3); var east = new TileKey(TileKind.Coarse, 3, 3);
            double border = east.Origin.E, n = west.Origin.N + 1000;
            var data = new RoadGraphData(); data.Ways.Add(Way(1, "tertiary", n, border - 600, border + 600));
            var roads = new RoadGraph();
            var lw = roads.SetTile(west, data, _ => 100f);
            var le = roads.SetTile(east, data, _ => 100f);
            var mw = RibbonMesh.Build(lw, west.Origin, west.Bounds); var me = RibbonMesh.Build(le, east.Origin, east.Bounds);
            try
            {
                double drawnW = 0, drawnE = 0;
                float vw = float.NaN, ve = float.NaN;
                void Scan(Mesh m, TileKey key, ref double maxOut, ref float vAtBorder)
                {
                    var v = m.vertices; var t = m.triangles; var uv = m.uv;
                    for (int i = 0; i < t.Length; i += 3)
                    {
                        var c = (v[t[i]] + v[t[i + 1]] + v[t[i + 2]]) / 3;
                        double e = key.Origin.E + c.x;
                        maxOut = math.max(maxOut, key.Equals(west) ? e - border : border - e);
                        for (int k = 0; k < 3; k++)
                            if (math.abs(key.Origin.E + v[t[i + k]].x - border) < 0.01 && uv[t[i + k]].x == 0) vAtBorder = uv[t[i + k]].y;
                    }
                }
                Scan(mw, west, ref drawnW, ref vw);
                Scan(me, east, ref drawnE, ref ve);
                Assert.Less(drawnW, 5, "the west ribbon stops at the border (it used to run 60 m on)");
                Assert.Less(drawnE, 5, "the east ribbon starts at the border");
                Assert.IsFalse(float.IsNaN(vw) || float.IsNaN(ve), "both meshes have the cross-section at the border");
                Assert.AreEqual(vw, ve, 1e-3, "V (metres along / 4) continues across the border");
            }
            finally { UnityEngine.Object.DestroyImmediate(mw); UnityEngine.Object.DestroyImmediate(me); }
        }

        [Test]
        public void Grading_DoesNotDiveToSeaLevel_WhereTheGroundIsNotLoaded_AndRegradesWhenItIs()
        {
            var west = new TileKey(TileKind.Coarse, 2, 3); var east = new TileKey(TileKind.Coarse, 3, 3);
            double border = east.Origin.E, n = west.Origin.N + 1000;
            var data = new RoadGraphData(); data.Ways.Add(Way(1, "tertiary", n, border - 600, border + 600));
            bool eastLoaded = false;
            Func<Utm33, bool> known = p => p.E < border || eastLoaded;
            Func<Utm33, float> ground = p => known(p) ? 400f + (float)(p.E - border) * 0.05f : 0f;   // not loaded reads 0, as TileWorld does
            var roads = new RoadGraph();
            roads.SetTile(west, data, ground, null, null, known);
            Assert.IsTrue(roads.Nearest(new Utm33(border + 40, n), 5, out var hit));
            Assert.Greater(hit.RoadY, 395f, "over the not-yet-loaded tile the road holds the last known ground, not the sea");
            eastLoaded = true;
            roads.SetTile(east, data, ground, null, null, known);
            Assert.IsTrue(roads.Nearest(new Utm33(border + 500, n), 5, out var far));
            Assert.AreEqual(400f + 500 * 0.05f, far.RoadY, 0.5f, "graded again on the real ground once it is in");
        }

        /// <summary>
        /// Three coarse tiles in a row on a 300 m mountain, a road over all three, a side road climbing across a border.
        /// Ground and roads arrive in many orders (a tile's roads before its neighbours' ground, the last tile very late);
        /// after the queued re-carves the carved ground is the same as in the plain order: no trench, no half-carved strip.
        /// </summary>
        [Test]
        public void AnyLoadOrder_EndsInTheSameCarvedGround([Values(0, 1, 2, 3, 4, 5)] int order)
        {
            var keys = new[] { new TileKey(TileKind.Coarse, 2, 3), new TileKey(TileKind.Coarse, 3, 3), new TileKey(TileKind.Coarse, 4, 3) };
            Func<double, double, float> mountain = (e, n) => (float)(300 + 120 * math.sin(e / 900) + 60 * math.cos(n / 500));
            RoadGraphData Data()
            {
                var d = new RoadGraphData();
                var main = new RoadWay { Id = 1 }; main.Tags["highway"] = "secondary";
                for (double e = 4300; e <= 10000; e += 40) main.Nodes.Add(new Utm33(e, 7100 + 30 * math.sin(e / 250)));
                var side = new RoadWay { Id = 2 }; side.Tags["highway"] = "track";
                for (double n = 7100; n <= 7900; n += 40) side.Nodes.Add(new Utm33(6144 + 20 * math.sin(n / 90), n));
                d.Ways.Add(main); d.Ways.Add(side);
                return d;
            }
            // Event lists: 'D' = ground of tile k arrives, 'R' = roads of tile k arrive (always after its own ground).
            var orders = new[]
            {
                "D0 D1 D2 R0 R1 R2", "D1 R1 D0 R0 D2 R2", "D2 R2 D1 R1 D0 R0",
                "D0 R0 D1 R1 D2 R2", "D1 D2 R2 R1 D0 R0", "D0 R0 R1x D1 R1 D2 R2",
            };
            float[][] Run(string events)
            {
                FloatingOrigin.Set(new Utm33(0, 0));
                var world = new TileWorld(null, null);
                try
                {
                    world.Scheduler.Update(new Utm33(7168, 7168), double2.zero, null);
                    var roads = new RoadGraph(); world.Roads = roads;
                    foreach (var ev in events.Split(' '))
                    {
                        int k = ev[1] - '0';
                        if (ev[0] == 'D') Load(world, keys[k], null, 0f, mountain);
                        else
                        {
                            if (ev.EndsWith("x")) continue;   // a road answer that is dropped (never applied)
                            roads.SetTile(keys[k], Data(), p => world.BaseHeightAt(p), null, null, p => world.IsLoaded(FloatingOrigin.ToWorldXZ(p)));
                            var b = keys[k].Bounds;
                            world.QueueRecarveWithin(new Bounds25833(b.MinE - RoadGraph.TilePad, b.MinN - RoadGraph.TilePad, b.MaxE + RoadGraph.TilePad, b.MaxN + RoadGraph.TilePad));
                            // As GameController does: tiles cut from a grading that was just replaced are set again and re-carved.
                            foreach (var d in roads.TakeDirtyTiles())
                            {
                                roads.Rebuild(d);
                                var db = d.Bounds;
                                world.QueueRecarveWithin(new Bounds25833(db.MinE - RoadGraph.TilePad, db.MinN - RoadGraph.TilePad, db.MaxE + RoadGraph.TilePad, db.MaxN + RoadGraph.TilePad));
                            }
                        }
                    }
                    for (int f = 0; f < 50 && world.RecarvePending > 0; f++) world.Update(FloatingOrigin.ToWorld(new Utm33(7168, 7168), 0), double2.zero, null, 0.02f);
                    Assert.AreEqual(0, world.RecarvePending);
                    Assert.IsTrue(roads.Nearest(new Utm33(9000, 7100 + 30 * math.sin(9000 / 250.0)), 5, out var hit));
                    Assert.Greater(hit.RoadY, mountain(9000, 7100) - 15, "the road over the last tile follows its ground, not the sea");
                    var r = new float[3][];
                    for (int i = 0; i < 3; i++) r[i] = world.Tiles[keys[i]].Grid.Heights.ToArray();
                    return r;
                }
                finally { world.Dispose(); }
            }
            var reference = Run(orders[0]);
            var got = Run(orders[order]);
            for (int i = 0; i < 3; i++)
            {
                float worst = 0; int at = -1;
                for (int k = 0; k < reference[i].Length; k++) { float d = math.abs(reference[i][k] - got[i][k]); if (d > worst) { worst = d; at = k; } }
                Assert.Less(worst, 0.05f, $"order '{orders[order]}', tile {keys[i]}: carved ground {worst:0.00} m off the plain order at sample {at}");
            }
        }
    }
}
