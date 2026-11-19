using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.World;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;
using UnityEngine;
using TreeInstance = Rally.World.TreeInstance;

namespace Rally.Tests.World
{
    /// <summary>
    /// The overlay → trees and ground mapping (landcover.js applySr16 / fillForestDefaults / tintByCover): a synthetic
    /// 512 m tile in eight 64 m strips, each a different mix of SR16 raster and OSM polygon, then the CPU scatter
    /// (ScatterJob, the twin of Scatter.compute) over the result.
    /// </summary>
    public class LandcoverSplatTests
    {
        const int N = 65, Res = 32;                 // 8 m samples, 16 m cover cells, 512 m square
        const float Cell = 8f, CoverCell = 16f;
        static readonly Utm33 Origin = new Utm33(100000, 6600000);
        // Strip index (x / 64 m) → what is there.
        const int SField = 0, SBog = 1, SPineSr16 = 2, SBirchOsm = 3, SResidential = 4, SRock = 5, SWater = 6, SShore = 7;

        static Area Strip(int strip, string kind, string leaf = null)
        {
            double e0 = Origin.E + strip * 64, n0 = Origin.N, e1 = e0 + 64, n1 = n0 + 512;
            var a = new Area { Kind = kind, Leaf = leaf };
            a.Rings.Add(new List<Utm33> { new Utm33(e0, n0), new Utm33(e1, n0), new Utm33(e1, n1), new Utm33(e0, n1), new Utm33(e0, n0) });
            return a;
        }

        sealed class Tile : System.IDisposable
        {
            public HeightGrid Grid;
            public NativeArray<Color32> Splat, Splat2, Cover;
            public void Dispose() { Grid.Dispose(); Splat.Dispose(); Splat2.Dispose(); Cover.Dispose(); }
            public Color32 At(NativeArray<Color32> a, int strip) => a[(Res / 2) * Res + strip * 4 + 2];   // middle of the strip
        }

        static Tile Build(float height)
        {
            var t = new Tile
            {
                Grid = new HeightGrid(N, Cell, Origin),
                Splat = new NativeArray<Color32>(Res * Res, Allocator.Persistent),
                Splat2 = new NativeArray<Color32>(Res * Res, Allocator.Persistent),
                Cover = new NativeArray<Color32>(Res * Res, Allocator.Persistent),
            };
            for (int i = 0; i < N * N; i++) t.Grid.Heights[i] = height;
            // SR16: spruce at 0.85 crown under the field (OSM wins), pine 0.75 in strip 2, nothing elsewhere.
            var raster = new CoverRaster(Res, Res, t.Grid.Bounds);
            for (int r = 0; r < Res; r++)
                for (int c = 0; c < Res; c++)
                {
                    int strip = c / 4, k = r * Res + c;
                    if (strip == SField || strip == SBog) { raster.Trees[k] = (byte)Species.Spruce; raster.Crown[k] = 217; }
                    if (strip == SPineSr16) { raster.Trees[k] = (byte)Species.Pine; raster.Crown[k] = 191; }
                }
            var features = new Features();
            features.Areas.Add(Strip(SField, "farmland"));
            features.Areas.Add(Strip(SBog, "wetland"));
            features.Areas.Add(Strip(SBirchOsm, "forest", "broadleaved"));
            features.Areas.Add(Strip(SResidential, "residential"));
            features.Areas.Add(Strip(SRock, "bare_rock"));
            features.Areas.Add(Strip(SWater, "water"));
            LandcoverSplat.Build(raster, features, t.Grid, 59.65, Res, t.Splat, t.Splat2, t.Cover);
            return t;
        }

        [Test]
        public void SpeciesAndCrownComeFromSr16AndOsmLikeTheJs()
        {
            using var t = Build(100f);
            var field = LandcoverSplat.Decode(t.At(t.Cover, SField));
            Assert.AreEqual(LandcoverSplat.Field, field.cls, "farmland keeps its class over SR16 forest");
            Assert.AreEqual(0f, field.crown, "no trees on farmland");
            var bog = LandcoverSplat.Decode(t.At(t.Cover, SBog));
            Assert.AreEqual(LandcoverSplat.SpeciesPine, bog.species, "bogs: only pine");
            Assert.Less(bog.crown, 0.25f, "and sparse");
            var pine = LandcoverSplat.Decode(t.At(t.Cover, SPineSr16));
            Assert.AreEqual(LandcoverSplat.Forest, pine.cls, "SR16 forest where OSM has nothing");
            Assert.AreEqual(LandcoverSplat.SpeciesPine, pine.species);
            Assert.AreEqual(0.75f, pine.crown, 0.01f, "SRRKRONEDEK crown cover is the density");
            var birch = LandcoverSplat.Decode(t.At(t.Cover, SBirchOsm));
            Assert.AreEqual(LandcoverSplat.SpeciesDeciduous, birch.species, "OSM leaf_type=broadleaved fills the SR16 gap with birch");
            Assert.AreEqual(0.55f, birch.crown, 0.01f, "fillForestDefaults crown");
            var res = LandcoverSplat.Decode(t.At(t.Cover, SResidential));
            Assert.AreEqual(LandcoverSplat.Residential, res.cls);
            Assert.Greater(res.crown, 0f); Assert.Less(res.crown, 0.15f, "residential: a sparse scatter of garden trees");
            Assert.AreEqual(0f, LandcoverSplat.Decode(t.At(t.Cover, SRock)).crown, "no trees on bare rock");
            Assert.AreEqual(0f, LandcoverSplat.Decode(t.At(t.Cover, SWater)).crown, "no trees in water");
            Assert.AreEqual(0f, LandcoverSplat.Decode(t.At(t.Cover, SShore)).crown, "open ground without SR16 stays open");
        }

        [Test]
        public void GroundLayersFollowTheCoverClass()
        {
            using var t = Build(100f);
            Assert.Greater(t.At(t.Splat, SField).b, 200, "field layer on farmland");
            Assert.Greater(t.At(t.Splat2, SBog).g, 200, "bog layer on wetland");
            Assert.Greater(t.At(t.Splat, SPineSr16).r, 180, "needle / moss floor under pine");
            Assert.Greater(t.At(t.Splat, SBirchOsm).g, 150, "leaf-litter floor under birch");
            Assert.Greater(t.At(t.Splat, SRock).a, 200, "rock layer on bare rock");
            Assert.Greater(t.At(t.Splat2, SWater).a, 180, "gravel / sand under the water");
            Assert.Greater(t.Splat2[(Res / 2) * Res + SShore * 4].a, 120, "a sand / gravel shore in the cell beside the water");
            Assert.Less(t.At(t.Splat2, SShore).a, 10, "but not 40 m inland");
            var res = t.At(t.Splat, SResidential); var res2 = t.At(t.Splat2, SResidential);
            int sum = res.r + res.g + res.b + res.a + res2.r + res2.g + res2.b + res2.a;
            Assert.Less(sum, 128, "residential is mostly lawn (the implicit grass layer)");
        }

        [Test]
        public void HighGroundIsHeathThenSnowWithoutTrees()
        {
            float treeLine = LandcoverSplat.TreeLine(59.65), snowLine = LandcoverSplat.SnowLine(59.65);
            using (var t = Build(treeLine + 120f))
            {
                Assert.AreEqual(0f, LandcoverSplat.Decode(t.At(t.Cover, SPineSr16)).crown, "the forest ends at the tree line");
                Assert.Greater(t.At(t.Splat2, SPineSr16).r, 150, "heath above the tree line");
            }
            using (var t = Build(snowLine + 100f))
                Assert.Greater(t.At(t.Splat2, SShore).b, 200, "snow above the snow line");
        }

        [Test]
        public void ScatterPutsTheRightSpeciesInTheRightPlaces()
        {
            using var t = Build(100f);
            var counts = Scatter(t, LandcoverSplat.TreeLine(59.65), out var byStrip);
            foreach (int s in new[] { SField, SRock, SWater, SShore })
                Assert.AreEqual(0, byStrip[s].total, $"no trees in strip {s}");
            Assert.Greater(byStrip[SPineSr16].total, 100, "pine forest at 0.75 crown: ~3.4 trees per 16 m cell");
            Assert.Greater(byStrip[SPineSr16].perSpecies[VegetationSetSO.Pine], byStrip[SPineSr16].total * 0.8f, "mostly pine, a few birches mixed in");
            Assert.Greater(byStrip[SBirchOsm].perSpecies[VegetationSetSO.Birch], byStrip[SBirchOsm].total * 0.8f, "mostly birch");
            Assert.AreEqual(byStrip[SBog].total, byStrip[SBog].perSpecies[VegetationSetSO.Pine], "bogs: pine only");
            Assert.Less(byStrip[SBog].total, byStrip[SPineSr16].total / 4, "bogs are sparse");
            Assert.Less(byStrip[SResidential].total, byStrip[SBirchOsm].total / 4, "residential is sparse");
            Assert.AreEqual(0, counts[VegetationSetSO.MountainBirch] + counts[VegetationSetSO.Shrub], "no mountain species at 100 m");

            using var high = Build(LandcoverSplat.TreeLine(59.65) - 60f);
            Scatter(high, LandcoverSplat.TreeLine(59.65), out var highStrips);
            Assert.Greater(highStrips[SBirchOsm].perSpecies[VegetationSetSO.MountainBirch], highStrips[SBirchOsm].total * 0.8f, "just below the tree line birch is mountain birch");
        }

        [Test]
        public void BudgetThinsTheForestEvenlyAndKeepsTheRoadCorridorDense()
        {
            using var t = Build(100f);
            for (int k = 0; k < Res * Res; k++) t.Cover[k] = new Color32(64, 255, LandcoverSplat.Forest * LandcoverSplat.ClassStep, 255);   // closed spruce forest
            const int capacity = 600;
            float scale = LandcoverSplat.Budget(t.Cover, Res, (i, j) => i < 16, capacity, 1f);   // a road along the west half
            Assert.Less(scale, 1f);
            Scatter(t, LandcoverSplat.TreeLine(59.65), out var strips, capacity * 4);
            int west = 0, east = 0;
            for (int s = 0; s < 4; s++) west += strips[s].total;
            for (int s = 4; s < 8; s++) east += strips[s].total;
            Assert.LessOrEqual(west + east, capacity, "the budget holds");
            Assert.Greater(west + east, capacity * 0.75f, "and is used");
            Assert.AreEqual(2.5f, west / (float)east, 0.5f, "stream.js: 1 near the road, 0.4 elsewhere");
            for (int s = 4; s < 8; s++) Assert.Greater(strips[s].total, 20, $"strip {s}: thinned evenly, not cut off");
        }

        static int[] Scatter(Tile t, float treeLine, out (int total, int[] perSpecies)[] byStrip, int capacity = 4096)
        {
            var mask = new NativeArray<byte>(N * N, Allocator.TempJob);
            var output = new NativeArray<TreeInstance>(capacity, Allocator.TempJob);
            var count = new NativeArray<int>(1, Allocator.TempJob);
            new ScatterJob
            {
                Res = Res, N = N, Capacity = output.Length, CellM = Cell, CoverCell = CoverCell, Density = 1f, Scale = 1f,
                TreeLine = treeLine, SnowLine = treeLine + 300, Seed = 42, Cover = t.Cover, Heights = t.Grid.Heights, Mask = mask, Out = output, Count = count,
            }.Run();
            var totals = new int[VegetationSetSO.SpeciesCount];
            byStrip = new (int, int[])[8];
            for (int s = 0; s < 8; s++) byStrip[s] = (0, new int[VegetationSetSO.SpeciesCount]);
            for (int i = 0; i < count[0]; i++)
            {
                var tree = output[i];
                int strip = math.clamp((int)(tree.Pos.x / 64f), 0, 7);
                totals[tree.Species]++;
                byStrip[strip].perSpecies[tree.Species]++;
                byStrip[strip].total++;
            }
            mask.Dispose(); output.Dispose(); count.Dispose();
            return totals;
        }
    }
}
