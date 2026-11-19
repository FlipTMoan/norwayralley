using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.World;
using Unity.Collections;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    /// <summary>
    /// The terrain meets the road edge: a road over rolling ground (the grade runs over the dips on embankments and
    /// through the rises in cuttings), carved into real tiles (CPU path). At every 5 m sample, on both sides, the drawn
    /// terrain just outside the ribbon's shoulder edge (Clipmap.DrawnHeight, the vertex shader's CPU twin, for the 2, 4,
    /// 8 and 16 m rings) is compared with the ribbon edge. It used to sit 16 cm under it next to the car (the vertical skirt
    /// and its shadow read as a floating road) and up to metres under it from 64 m on (coarse rings sagging off the
    /// embankment). Also: a stream crossing the road is a culvert, not water on the road.
    /// </summary>
    public class RoadEdgeFitTests
    {
        const double E0 = 1000, N0 = 500, N1 = 1500;
        static float Natural(double e, double n) => (float)(100 + 5 * math.sin((n - N0) / 45) + 2.5 * math.sin((n - N0) / 17 + 1) + 0.03 * (e - E0));

        static RoadGraphData Data()
        {
            var way = new RoadWay { Id = 1 }; way.Tags["highway"] = "tertiary";
            for (double n = N0; n <= N1 + 1e-6; n += 25) way.Nodes.Add(new Utm33(E0 + 30 * math.sin((n - N0) / 200), n));
            var d = new RoadGraphData();
            d.Ways.Add(way);
            return d;
        }

        static void Load(TileWorld world, TileKey key, Features features = null)
        {
            var dtm = new NativeArray<float>(TileScheduler.Samples * TileScheduler.Samples, Allocator.Temp);
            for (int row = 0; row < TileScheduler.Samples; row++)
                for (int col = 0; col < TileScheduler.Samples; col++)
                    dtm[row * TileScheduler.Samples + col] = Natural(key.Origin.E + col * key.CellM, key.Origin.N + row * key.CellM);
            world.OnTileData(key, dtm, null, features, 60.0);
            dtm.Dispose();
        }

        static (TileWorld world, List<RoadPolyline> lines) Build(Features features = null)
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var world = new TileWorld(null, null);
            var roads = new RoadGraph();
            var coarse = TileKey.At(TileKind.Coarse, new Utm33(E0, 1000));
            var lines = roads.SetTile(coarse, Data(), p => Natural(p.E, p.N));
            world.Roads = roads;
            var pts = new List<Utm33>();
            foreach (var l in lines) foreach (var s in l.Samples) pts.Add(new Utm33(s.P.x, s.P.y));
            world.Scheduler.Update(new Utm33(E0, 1000), double2.zero, pts);
            Load(world, coarse, features);
            foreach (var key in new List<TileKey>(world.Tiles.Keys)) if (key.Kind == TileKind.Fine) Load(world, key);
            return (world, lines);
        }

        [Test]
        public void TerrainMeetsTheRibbonEdgeOnFillsAndCuts()
        {
            var (world, lines) = Build();
            try
            {
                float H(float2 xz) => world.CarvedHeightAt(new Utm33(xz.x, xz.y));
                float M(float2 xz) => world.CarveMaskAt(new Utm33(xz.x, xz.y));
                float[] cells = { 2, 4, 8, 16 };
                var worst = new float[4]; var floating = new int[4]; var buried = new int[4];
                int samples = 0, fill = 0, cut = 0, fillNear = 0, cutNear = 0;
                foreach (var line in lines)
                {
                    var s = line.Samples;
                    float half = line.Lanes.Half, edge = half + RoadConstants.RoadShoulder;
                    for (int i = 4; i + 4 < s.Count; i++)
                    {
                        var t = math.normalize(s[i + 1].P - s[i - 1].P);
                        var nrm = new double2(-t.y, t.x);
                        float ribbonEdge = s[i].RoadY + RoadConstants.RoadLift + RoadConstants.SurfaceLift(edge, half);
                        for (int side = -1; side <= 1; side += 2)
                        {
                            var outside = (float2)(s[i].P + nrm * side * (edge + 0.05));
                            float natural = Natural(s[i].P.x + nrm.x * side * (edge + 3), s[i].P.y + nrm.y * side * (edge + 3));
                            bool isFill = natural < ribbonEdge - 0.5f, isCut = natural > ribbonEdge + 0.5f;
                            if (isFill) fill++; else if (isCut) cut++;
                            samples++;
                            for (int c = 0; c < 4; c++)
                            {
                                float gap = ribbonEdge - Clipmap.DrawnHeight(outside, cells[c], H, M);
                                if (math.abs(gap) > math.abs(worst[c])) worst[c] = gap;
                                if (gap > 0.10f) floating[c]++;
                                if (gap < -0.05f) buried[c]++;
                                if (c == 0 && math.abs(gap) <= 0.06f) { if (isFill) fillNear++; else if (isCut) cutNear++; }
                            }
                        }
                    }
                }
                string report = $"{samples} edge samples ({fill} on fills, {cut} in cuts); worst gap 2/4/8/16 m: {worst[0]:0.000} / {worst[1]:0.00} / {worst[2]:0.00} / {worst[3]:0.00} m; "
                    + $"floating {floating[0]}/{floating[1]}/{floating[2]}/{floating[3]}, buried {buried[0]}/{buried[1]}/{buried[2]}/{buried[3]}";
                UnityEngine.Debug.Log("RoadEdgeFit: " + report);
                Assert.Greater(fill, 40, "the test road runs on embankments: " + report);
                Assert.Greater(cut, 40, "the test road runs through cuttings: " + report);
                Assert.Less(math.abs(worst[0]), 0.06f, "next to the car (2 m ring) the terrain meets the ribbon edge within 6 cm: " + report);
                Assert.AreEqual(fill, fillNear, "every embankment edge sample within 6 cm: " + report);
                Assert.AreEqual(cut, cutNear, "every cutting edge sample within 6 cm: " + report);
                // Coarser rings: the gap left is the ring's own triangle size over a graded road (grade × cell), not a sag
                // off the embankment: under 10 cm at 64–128 m, 20 cm at 128–256 m (under two pixels), 50 cm beyond 256 m.
                float[] bound = { 0.06f, 0.10f, 0.20f, 0.50f };
                for (int c = 1; c < 4; c++)
                    Assert.Less(math.abs(worst[c]), bound[c], $"{cells[c]} m ring: the edge within {bound[c] * 100:0} cm: " + report);
            }
            finally { world.Dispose(); }
        }

        [Test]
        public void EmbankmentsSlopeGentlyToTheGround()
        {
            // 4 m of fill: the carve runs out at FillRun : 1 (8 m), not in the 2.25 m shoulder blend of the road class.
            float w = RoadProfile.EarthworkWidth(104, 100, 2.25f);
            Assert.AreEqual(4 * RoadConstants.FillRun, w, 1e-4);
            Assert.AreEqual(2.25f, RoadProfile.EarthworkWidth(100.5f, 100, 2.25f), 1e-4, "a low fill keeps the class's shoulder blend");
            Assert.AreEqual(RoadConstants.MaxEarthwork, RoadProfile.EarthworkWidth(130, 100, 2.25f), 1e-4, "capped");
            Assert.AreEqual(3 * RoadConstants.CutRun, RoadProfile.EarthworkWidth(100, 103, 2.25f), 1e-4, "cuttings are steeper");
            // Half way out on the 4 m embankment the profile is half way down; at the toe it is the ground.
            Assert.AreEqual(102, RoadProfile.Height(104, 100, 5 + w / 2, 5, 2.25f), 1e-3);
            Assert.AreEqual(100, RoadProfile.Height(104, 100, 5 + w, 5, 2.25f), 1e-4);
        }

        [Test]
        public void AStreamUnderTheRoadIsNotWaterOnTheRoad()
        {
            // A stream (OSM waterway, also culverts) crossing the road: beside the road it is water, on the road it is not.
            var features = new Features();
            var stream = new Waterway { Kind = "stream" };
            for (double e = E0 - 120; e <= E0 + 120; e += 10) stream.Points.Add(new Utm33(e, 1000));
            features.Waterways.Add(stream);
            var (world, _) = Build(features);
            try
            {
                Assert.IsTrue(world.Roads.Nearest(new Utm33(E0, 1000), 40, out var q));
                var onRoad = (float2)q.Point;
                Assert.AreEqual(0f, world.WaterAt(onRoad).Depth, "on the carriageway: a culvert, dry");
                var away = new float2((float)q.Point.x + 30, 1000);
                Assert.Greater(world.WaterAt(away).Depth, 0f, "30 m off the road the stream is water");
            }
            finally { world.Dispose(); }
        }
    }
}
