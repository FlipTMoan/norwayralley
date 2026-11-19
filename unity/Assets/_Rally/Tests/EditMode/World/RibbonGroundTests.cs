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
    /// The drawn road, the wheel contact and the terrain are one surface: a bendy two-lane road across a 30 % side slope
    /// with a track crossing it, carved into real tiles (CPU path), its ribbon built as GameController does. Along and
    /// across the road the ribbon is the car's ground within 2 cm, flat edge to edge, the terrain mesh (2 m clipmap
    /// triangles over the carved grid) stays under it, the plan line has no kinks and the crossing has no step.
    /// </summary>
    public class RibbonGroundTests
    {
        const double E0 = 1000, N0 = 600, N1 = 1400, JunctionN = 1000;
        static double Bend(double n) => E0 + 70 * math.sin((n - N0) / 160);
        static float Natural(double e, double n) => (float)(100 + 0.3 * (e - E0) + 0.02 * n + 2 * math.sin(n / 40));

        static RoadGraphData Data()
        {
            var main = new RoadWay { Id = 1 }; main.Tags["highway"] = "tertiary";
            for (double n = N0; n <= N1 + 1e-6; n += 50) main.Nodes.Add(new Utm33(Bend(n), n));
            var side = new RoadWay { Id = 2 }; side.Tags["highway"] = "track";
            double ej = Bend(JunctionN);
            for (int k = -4; k <= 4; k++) side.Nodes.Add(new Utm33(ej + k * 40, JunctionN));
            var d = new RoadGraphData();
            d.Ways.Add(side); d.Ways.Add(main);   // the track comes first in the data: the main road must still win
            return d;
        }

        static void Load(TileWorld world, TileKey key)
        {
            var dtm = new NativeArray<float>(TileScheduler.Samples * TileScheduler.Samples, Allocator.Temp);
            for (int row = 0; row < TileScheduler.Samples; row++)
                for (int col = 0; col < TileScheduler.Samples; col++)
                    dtm[row * TileScheduler.Samples + col] = Natural(key.Origin.E + col * key.CellM, key.Origin.N + row * key.CellM);
            world.OnTileData(key, dtm, null, null, 60.0);
            dtm.Dispose();
        }

        /// <summary>Highest ribbon triangle over a point (tile-local mesh), NaN when none.</summary>
        static float RibbonY(Vector3[] v, int[] t, double2 local)
        {
            float best = float.NaN;
            for (int i = 0; i < t.Length; i += 3)
            {
                Vector3 a = v[t[i]], b = v[t[i + 1]], c = v[t[i + 2]];
                double2 p = local, pa = new double2(a.x, a.z), pb = new double2(b.x, b.z), pc = new double2(c.x, c.z);
                double den = (pb.y - pc.y) * (pa.x - pc.x) + (pc.x - pb.x) * (pa.y - pc.y);
                if (math.abs(den) < 1e-6) continue;   // skirts are vertical
                double l1 = ((pb.y - pc.y) * (p.x - pc.x) + (pc.x - pb.x) * (p.y - pc.y)) / den;
                double l2 = ((pc.y - pa.y) * (p.x - pc.x) + (pa.x - pc.x) * (p.y - pc.y)) / den;
                double l3 = 1 - l1 - l2;
                if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
                float y = (float)(l1 * a.y + l2 * b.y + l3 * c.y);
                if (float.IsNaN(best) || y > best) best = y;
            }
            return best;
        }

        /// <summary>The clipmap's level-0 terrain: 2 m cells, split along the (i+1, j)–(i, j+1) diagonal, vertices on the carved grid.</summary>
        static float TerrainMeshY(TileWorld w, double2 p)
        {
            const double cell = 2;
            double fx = p.x / cell, fz = p.y / cell;
            double i = math.floor(fx), j = math.floor(fz);
            float H(double ci, double cj) => w.CarvedHeightAt(new Utm33(ci * cell, cj * cell));
            double u = fx - i, v = fz - j;
            float a = H(i, j), b = H(i + 1, j), c = H(i, j + 1), d = H(i + 1, j + 1);
            return u + v <= 1 ? (float)(a + (b - a) * u + (c - a) * v) : (float)(d + (c - d) * (1 - u) + (b - d) * (1 - v));
        }

        static void Check(bool withFineTiles)
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var world = new TileWorld(null, null);
            Mesh mesh = null;
            try
            {
                var roads = new RoadGraph();
                var coarse = TileKey.At(TileKind.Coarse, new Utm33(E0, JunctionN));
                var lines = roads.SetTile(coarse, Data(), p => Natural(p.E, p.N));
                world.Roads = roads;
                var pts = new List<Utm33>();
                foreach (var l in lines) foreach (var s in l.Samples) pts.Add(new Utm33(s.P.x, s.P.y));
                world.Scheduler.Update(new Utm33(E0, JunctionN), double2.zero, pts);
                Load(world, coarse);
                if (withFineTiles)
                    foreach (var key in new List<TileKey>(world.Tiles.Keys)) if (key.Kind == TileKind.Fine) Load(world, key);
                mesh = RibbonMesh.Build(lines, coarse.Origin);
                var verts = mesh.vertices; var tris = mesh.triangles;
                var o = new double2(coarse.Origin.E, coarse.Origin.N);

                float worstRibbon = 0, worstAcross = 0, worstTerrain = float.NegativeInfinity, worstTurn = 0;
                int checkedPts = 0; string worstAt = ""; float worstJunction = 0, worstTerrainJunction = float.NegativeInfinity; string junctionAt = "", terrainAt = "";
                foreach (var line in lines)
                {
                    float half = line.Lanes.Half;
                    var s = line.Samples;
                    for (int i = 1; i + 1 < s.Count; i++)
                    {
                        var t0 = math.normalize(s[i].P - s[i - 1].P); var t1 = math.normalize(s[i + 1].P - s[i].P);
                        worstTurn = math.max(worstTurn, (float)math.degrees(math.acos(math.clamp(math.dot(t0, t1), -1, 1))));
                        if (i % 3 != 0 || s[i].S - s[0].S < 20 || s[s.Count - 1].S - s[i].S < 20) continue;   // not at the open ends of a run
                        var nrm = new double2(-t1.y, t1.x);
                        float left = world.HeightAt((float2)(s[i].P - nrm * half)), right = world.HeightAt((float2)(s[i].P + nrm * half));
                        for (double f = -0.95; f <= 0.951; f += 0.2375)   // to just inside the shoulder edge (the mesh normal averages two segments)
                        {
                            var p = s[i].P + nrm * (f * (half + RoadConstants.RoadShoulder));
                            float car = world.HeightAt((float2)p), rib = RibbonY(verts, tris, p - o);
                            Assert.IsFalse(float.IsNaN(rib), $"no ribbon at {p}");
                            // Within 15 m of the crossing the side road's first ribbon quad off the main road climbs its 30 % grade
                            // over the main road's corner while the car there rides the main road: a known gap of up to ~15 cm on
                            // this deliberately steep test (it scales with the side road's grade), bounded separately below.
                            if (math.distance(p, new double2(Bend(JunctionN), JunctionN)) < 15) { if (math.abs(rib - car) > worstJunction) { worstJunction = math.abs(rib - car); roads.Nearest(new Utm33(p.x, p.y), 30, out var jq); junctionAt = $"{p - new double2(Bend(JunctionN), JunctionN)} from the crossing, way {line.Id} f {f:0.00} car {car:0.000} ribbon {rib:0.000}; nearest way {jq.Id} at {jq.Distance:0.00} m"; } }
                            else if (math.abs(rib - car) > worstRibbon) { worstRibbon = math.abs(rib - car); roads.Nearest(new Utm33(p.x, p.y), 30, out var nq); worstAt = $"{p} way {line.Id} f {f:0.00} car {car:0.00} ribbon {rib:0.00}; nearest way {nq.Id} at {nq.Distance:0.00} m RoadY {nq.RoadY:0.00} half {nq.Half}"; }
                            float under = TerrainMeshY(world, p) - rib;
                            if (math.distance(p, new double2(Bend(JunctionN), JunctionN)) < 15) worstTerrainJunction = math.max(worstTerrainJunction, under);
                            else if (under > worstTerrain) { worstTerrain = under; terrainAt = $"{p} way {line.Id} f {f:0.00}"; }
                            if (math.abs(f) <= half / (half + RoadConstants.RoadShoulder) && math.distance(s[i].P, new double2(Bend(JunctionN), JunctionN)) > 15)
                                worstAcross = math.max(worstAcross, math.abs(car - math.lerp(left, right, (float)((f * (half + RoadConstants.RoadShoulder) / half + 1) / 2))));
                            checkedPts++;
                        }
                    }
                }
                Assert.Greater(checkedPts, 300);
                Assert.Less(worstRibbon, 0.02f, "ribbon = the car's ground; worst at " + worstAt);
                Assert.Less(worstJunction, 0.16f, "ribbon = the car's ground at the crossing; worst " + junctionAt);
                Assert.Less(worstAcross, 0.02f, "straight across the carriageway, edge to edge");
                Assert.Less(worstTerrain, -0.03f, "the terrain mesh stays under the ribbon; closest at " + terrainAt);
                Assert.Less(worstTerrainJunction, 0f, "the terrain mesh stays under the ribbon at the crossing");
                Assert.Less(worstTurn, 6f, "no kink between 5 m samples");

                // The crossing: along the track through the main road the car's ground has no step — no 5 cm move whose
                // rise differs from the previous one by 2 cm or more (the track itself climbs the 30 % slope).
                double ej = Bend(JunctionN);
                float H(double e) => world.HeightAt(new float2((float)e, (float)JunctionN));
                float prevRise = H(ej - 29.95) - H(ej - 30), worstStep = 0; string stepAt = "";
                for (double e = ej - 29.9; e <= ej + 30; e += 0.05)
                {
                    float rise = H(e) - H(e - 0.05);
                    if (math.abs(rise - prevRise) > worstStep) { worstStep = math.abs(rise - prevRise); stepAt = $"E {e - ej:+0.00;-0.00} m from the main centre"; }
                    prevRise = rise;
                }
                Assert.Less(worstStep, 0.02f, "no step where the track crosses the main road: " + stepAt);
            }
            finally { world.Dispose(); if (mesh != null) Object.DestroyImmediate(mesh); }
        }

        [Test] public void OnFineTiles() => Check(true);
        [Test] public void OnCoarseTilesOnly() => Check(false);
    }
}
