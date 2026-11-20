using System.IO;
using NUnit.Framework;
using Rally.World;
using UnityEditor;
using UnityEngine;

namespace Rally.Tests.World
{
    /// <summary>
    /// Birch and mountain birch crowns are full (Editor/TreeBuilder, 2026-11-20): enough twig-spray cards in the near
    /// mesh, a leaf atlas that is a leaf mass rather than a line of leaves, and baked impostors whose crown is mostly
    /// covered, so distant birch stands do not thin out. Thresholds sit between the old (thin) and the new assets.
    /// </summary>
    public class TreeCrownTests
    {
        const string Dir = "Assets/_Rally/Settings/Trees";

        static VegetationSetSO Set()
        {
            var set = AssetDatabase.LoadAssetAtPath<VegetationSetSO>("Assets/_Rally/Settings/VegetationSet.asset");
            Assert.IsNotNull(set, "VegetationSet.asset");
            return set;
        }

        /// <summary>Foliage triangles (vertex colour b = 1) of a mesh.</summary>
        static int FoliageTriangles(Mesh m)
        {
            var col = m.colors; var tri = m.triangles; int n = 0;
            for (int i = 0; i < tri.Length; i += 3) if (col[tri[i]].b > 0.5f) n++;
            return n;
        }

        /// <summary>Alpha (≥ 0.4, the cutoff) cover of a PNG read from disk (the imported texture is compressed and not readable).</summary>
        static Texture2D Png(string file)
        {
            var t = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            Assert.IsTrue(t.LoadImage(File.ReadAllBytes(Path.Combine(Dir, file))), file);
            return t;
        }

        [TestCase(2, 1500, 600, 120)]    // birch: was 876 / 166 / 40 foliage triangles
        [TestCase(3, 480, 200, 32)]      // mountain birch: was 168 / 84 / 16
        public void NearMeshesCarryEnoughTwigSprays(int species, int lod0, int lod1, int lod2)
        {
            var p = Set().Prototypes[species];
            int[] min = { lod0, lod1, lod2 };
            for (int l = 0; l < 3; l++)
            {
                int n = FoliageTriangles(p.Lods[l]);
                TestContext.WriteLine($"{p.Name} LOD{l}: {n} foliage triangles, {p.Lods[l].triangles.Length / 3} in all");
                Assert.GreaterOrEqual(n, min[l], $"{p.Name} LOD{l} foliage triangles");
            }
            Assert.LessOrEqual(p.Lods[0].triangles.Length / 3, 3000, "LOD 0 budget");
        }

        [Test]
        public void BirchLeafAtlasIsALeafMass()
        {
            var t = Png("birch_foliage.png");
            var px = t.GetPixels32(); int n = 0;
            foreach (var c in px) if (c.a >= 102) n++;
            float cover = n / (float)px.Length;
            TestContext.WriteLine($"birch leaf atlas cover {cover:0.000} (was 0.125)");
            Assert.Greater(cover, 0.28f);
            Object.DestroyImmediate(t);
        }

        /// <summary>Per frame of the 4 × 2 atlas: alpha cover of the upper 60 % of the tree's bounding box (the crown).</summary>
        [TestCase("birch_impostor.png", 0.45f)]            // was 0.28, now ~0.57
        [TestCase("mountain_birch_impostor.png", 0.32f)]   // was 0.10, now ~0.43
        public void ImpostorCrownIsCovered(string file, float minCover)
        {
            var t = Png(file);
            int W = t.width, fw = W / 4, fh = t.height / 2;
            var px = t.GetPixels32();
            for (int k = 0; k < 8; k++)
            {
                int x0 = (k % 4) * fw, y0 = (1 - k / 4) * fh;
                int xmin = int.MaxValue, xmax = -1, ymin = int.MaxValue, ymax = -1;
                for (int y = 0; y < fh; y++)
                    for (int x = 0; x < fw; x++)
                        if (px[(y0 + y) * W + x0 + x].a >= 102) { xmin = Mathf.Min(xmin, x); xmax = Mathf.Max(xmax, x); ymin = Mathf.Min(ymin, y); ymax = Mathf.Max(ymax, y); }
                Assert.GreaterOrEqual(ymax, 0, $"{file} frame {k} is empty");
                int yc = ymin + (int)(0.4f * (ymax - ymin)), n = 0, all = 0;
                for (int y = yc; y <= ymax; y++)
                    for (int x = xmin; x <= xmax; x++) { all++; if (px[(y0 + y) * W + x0 + x].a >= 102) n++; }
                float cover = n / (float)all;
                TestContext.WriteLine($"{file} frame {k}: crown cover {cover:0.000}");
                Assert.Greater(cover, minCover, $"{file} frame {k}");
            }
            Object.DestroyImmediate(t);
        }
    }
}
