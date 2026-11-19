using System;
using UnityEditor;
using UnityEngine;

namespace Rally.Editor
{
    /// <summary>
    /// The clipmap's ground layers, generated in code (Rally/TerrainClipmap, slice order = LandcoverSplat.Layer*):
    ///   0 meadow grass, 1 conifer floor (needle litter, moss, blueberry), 2 birch floor (leaf litter, grass),
    ///   3 field (ley grass in rows), 4 rock (gneiss plates, cracks, lichen), 5 heath (heather, crowberry, reindeer
    ///   lichen), 6 bog (sphagnum, wet pools, cotton grass), 7 snow, 8 gravel / sand.
    /// Each layer is 512² tileable fBm / Worley noise with colour variation; alpha is a height used by the shader's
    /// height blend, and the normal map is derived from that height. Saved as two 3 × 3 flipbook PNGs imported as
    /// Texture2DArrays, so the importer compresses them per platform like any texture.
    /// </summary>
    public static class GroundTextures
    {
        public const int Size = 512, Layers = 9, Cols = 3, Rows = 3;

        public static (Texture2DArray albedo, Texture2DArray normals) Build(string dir, bool force)
        {
            string aPath = dir + "/GroundAlbedo.png", nPath = dir + "/GroundNormals.png";
            if (!force)
            {
                var a = AssetDatabase.LoadAssetAtPath<Texture2DArray>(aPath);
                var n = AssetDatabase.LoadAssetAtPath<Texture2DArray>(nPath);
                if (a != null && n != null) return (a, n);
            }
            int W = Size * Cols, H = Size * Rows;
            var albedo = new Color[W * H];
            var normals = new Color[W * H];
            var height = new float[Size * Size];
            var layer = new Color[Size * Size];
            for (int s = 0; s < Layers; s++)
            {
                for (int y = 0; y < Size; y++)
                    for (int x = 0; x < Size; x++)
                    {
                        float u = (x + 0.5f) / Size, v = (y + 0.5f) / Size;
                        var c = Sample(s, u, v, out float h);
                        c.a = Mathf.Clamp01(h);
                        layer[y * Size + x] = c;
                        height[y * Size + x] = h;
                    }
                var nrm = ProcTex.NormalsFromHeight(height, Size, Size, NormalStrength[s]);
                int x0 = (s % Cols) * Size, y0 = (Rows - 1 - s / Cols) * Size;   // flipbook frames run left→right, top→bottom
                for (int y = 0; y < Size; y++)
                    for (int x = 0; x < Size; x++)
                    {
                        albedo[(y0 + y) * W + x0 + x] = layer[y * Size + x];
                        normals[(y0 + y) * W + x0 + x] = nrm[y * Size + x];
                    }
            }
            ProcTex.SavePng(aPath, albedo, W, H, imp => { ProcTex.Colour(imp, 2048); imp.alphaIsTransparency = false; Array(imp); });
            ProcTex.SavePng(nPath, normals, W, H, imp => { ProcTex.Normal(imp, 2048); Array(imp); });
            return (AssetDatabase.LoadAssetAtPath<Texture2DArray>(aPath), AssetDatabase.LoadAssetAtPath<Texture2DArray>(nPath));
        }

        static void Array(TextureImporter imp)
        {
            imp.textureShape = TextureImporterShape.Texture2DArray;
            var t = new TextureImporterSettings();
            imp.ReadTextureSettings(t);
            t.flipbookColumns = Cols;
            t.flipbookRows = Rows;
            imp.SetTextureSettings(t);
        }

        static readonly float[] NormalStrength = { 2.5f, 3f, 2.5f, 2f, 5f, 3f, 2.5f, 1.2f, 4f };

        static Color Lerp(Color a, Color b, float t) => Color.Lerp(a, b, Mathf.Clamp01(t));
        static float S(float e0, float e1, float x) => Mathf.SmoothStep(0, 1, Mathf.InverseLerp(e0, e1, x));

        /// <summary>One texel of one layer (sRGB colour) and its height 0..1.</summary>
        static Color Sample(int layer, float u, float v, out float h)
        {
            switch (layer)
            {
                case 0: return Grass(u, v, out h, new Color(0.31f, 0.39f, 0.15f), new Color(0.47f, 0.47f, 0.22f), 11);
                case 1: return ConiferFloor(u, v, out h);
                case 2: return BirchFloor(u, v, out h);
                case 3: return Field(u, v, out h);
                case 4: return Rock(u, v, out h);
                case 5: return Heath(u, v, out h);
                case 6: return Bog(u, v, out h);
                case 7: return Snow(u, v, out h);
                default: return Gravel(u, v, out h);
            }
        }

        /// <summary>
        /// Grass: tufts (small Worley cells, each a slightly different green), fine non-directional blade noise, dry
        /// yellow patches and specks of soil. No streaks: two crossed streak sets read as a woven pattern when tiled.
        /// </summary>
        static Color Grass(float u, float v, out float h, Color green, Color dry, int seed)
        {
            ProcTex.Worley(u, v, 64, seed, out float f1, out _, out float id);
            float tuft = 1 - Mathf.Clamp01(f1 * 1.2f);
            float blades = ProcTex.Fbm(u, v, 128, 2, seed + 1) * 0.5f + 0.5f;
            float patch = ProcTex.Fbm(u, v, 4, 4, seed + 3) * 0.5f + 0.5f;
            float soil = ProcTex.Fbm(u, v, 48, 2, seed + 4);
            var c = Lerp(green, dry, S(0.55f, 0.85f, patch) * 0.6f + (id > 0.85f ? 0.25f : 0));
            c = ProcTex.Mul(c, 0.72f + tuft * 0.25f + blades * 0.25f + (id - 0.5f) * 0.12f);
            if (soil > 0.5f) c = Lerp(c, new Color(0.30f, 0.25f, 0.16f), (soil - 0.5f) * 2.5f);
            h = tuft * 0.5f + blades * 0.4f + patch * 0.1f;
            return c;
        }

        /// <summary>Spruce / pine forest floor: brown needle litter, cushions of green moss, dark blueberry shrubs.</summary>
        static Color ConiferFloor(float u, float v, out float h)
        {
            ProcTex.Worley(u, v, 24, 21, out float f1, out float f2, out float id);
            float moss = S(-0.2f, 0.15f, ProcTex.Fbm(u, v, 6, 4, 22));
            float needles = ProcTex.Fbm(u, v, 160, 2, 23) * 0.5f + 0.5f;
            float twigs = Mathf.Abs(ProcTex.Perlin(u, v, 48, 24));
            var litter = Lerp(new Color(0.29f, 0.24f, 0.17f), new Color(0.40f, 0.33f, 0.22f), needles);
            if (twigs < 0.03f) litter = ProcTex.Mul(litter, 0.6f);
            float cushion = 1 - Mathf.Clamp01(f1 * 1.4f);
            var mossC = Lerp(new Color(0.24f, 0.33f, 0.10f), new Color(0.38f, 0.45f, 0.14f), id * 0.6f + cushion * 0.4f);
            mossC = ProcTex.Mul(mossC, 0.8f + needles * 0.35f);
            var c = Lerp(litter, mossC, moss);
            float berry = S(0.35f, 0.6f, ProcTex.Fbm(u, v, 12, 3, 25));
            float leaves = ProcTex.Fbm(u, v, 96, 2, 26) * 0.5f + 0.5f;
            c = Lerp(c, ProcTex.Mul(new Color(0.16f, 0.25f, 0.10f), 0.7f + leaves * 0.6f), berry * 0.85f);
            h = Mathf.Lerp(needles * 0.3f, 0.5f + cushion * 0.4f, moss) + berry * 0.3f;
            return c;
        }

        /// <summary>Birch woodland floor: grass with fallen leaves (yellow-brown blobs), small herbs.</summary>
        static Color BirchFloor(float u, float v, out float h)
        {
            var c = Grass(u, v, out float gh, new Color(0.33f, 0.40f, 0.17f), new Color(0.42f, 0.40f, 0.20f), 31);
            ProcTex.Worley(u, v, 90, 32, out float f1, out _, out float id);
            float litter = S(0.1f, 0.55f, ProcTex.Fbm(u, v, 8, 3, 33) * 0.5f + 0.5f);
            float leaf = f1 < 0.35f && id < 0.75f ? 1f : 0f;
            var leafC = Lerp(new Color(0.48f, 0.38f, 0.17f), new Color(0.32f, 0.22f, 0.12f), id);
            c = Lerp(c, leafC, leaf * litter);
            h = Mathf.Lerp(gh, 0.45f + (0.35f - f1) * 0.6f, leaf * litter);
            return c;
        }

        /// <summary>Ley / hay field: even, brighter green with drill rows (the shader adds plot stripes per field).</summary>
        static Color Field(float u, float v, out float h)
        {
            float row = 0.5f + 0.5f * Mathf.Sin(v * Mathf.PI * 2 * 48);
            float blades = ProcTex.Fbm(u, v, 32, 160, 2, 41) * 0.5f + 0.5f;
            float patch = ProcTex.Fbm(u, v, 3, 3, 42) * 0.5f + 0.5f;
            var c = Lerp(new Color(0.38f, 0.47f, 0.17f), new Color(0.52f, 0.52f, 0.22f), patch * 0.6f);
            c = ProcTex.Mul(c, 0.78f + blades * 0.3f + row * 0.08f);
            h = blades * 0.6f + row * 0.4f;
            return c;
        }

        /// <summary>Grey gneiss / granite: plates (Worley), dark cracks along the cell edges, pale and orange lichen.</summary>
        static Color Rock(float u, float v, out float h)
        {
            float wu = ProcTex.Fbm(u, v, 4, 3, 50) * 0.08f, wv = ProcTex.Fbm(u, v, 4, 3, 56) * 0.08f;
            ProcTex.Worley(u + wu, v + wv, 5, 51, out float f1, out float f2, out float id);
            float crack = Mathf.Lerp(S(0.0f, 0.04f, f2 - f1), 1f, S(0.2f, 0.6f, ProcTex.Fbm(u, v, 8, 2, 57) * 0.5f + 0.5f));
            float grain = ProcTex.Fbm(u, v, 96, 3, 52) * 0.5f + 0.5f;
            float strata = ProcTex.Fbm(u + ProcTex.Perlin(u, v, 4, 53) * 0.1f, v, 8, 32, 3, 54) * 0.5f + 0.5f;
            var c = Lerp(new Color(0.40f, 0.39f, 0.37f), new Color(0.55f, 0.54f, 0.51f), id * 0.25f + strata * 0.45f + grain * 0.4f);
            c = ProcTex.Mul(c, Mathf.Lerp(0.55f, 1f, crack));
            float lichen = S(0.55f, 0.75f, ProcTex.Fbm(u, v, 20, 3, 55) * 0.5f + 0.5f);
            c = Lerp(c, id > 0.6f ? new Color(0.66f, 0.68f, 0.56f) : new Color(0.55f, 0.45f, 0.28f), lichen * 0.6f * crack);
            h = (0.3f + 0.5f * crack * (0.6f + id * 0.4f)) + grain * 0.2f;
            return c;
        }

        /// <summary>Alpine / coastal heath: heather and crowberry (dark olive, purple-brown), patches of pale reindeer lichen.</summary>
        static Color Heath(float u, float v, out float h)
        {
            float shrub = ProcTex.Fbm(u, v, 64, 3, 61) * 0.5f + 0.5f;
            float kind = ProcTex.Fbm(u, v, 10, 3, 62) * 0.5f + 0.5f;
            var c = Lerp(new Color(0.24f, 0.25f, 0.13f), new Color(0.36f, 0.25f, 0.20f), S(0.4f, 0.7f, kind));
            c = ProcTex.Mul(c, 0.7f + shrub * 0.6f);
            float lichen = S(0.6f, 0.78f, ProcTex.Fbm(u, v, 14, 4, 63) * 0.5f + 0.5f);
            ProcTex.Worley(u, v, 120, 64, out float f1, out _, out _);
            c = Lerp(c, ProcTex.Mul(new Color(0.74f, 0.73f, 0.60f), 0.85f + (1 - f1) * 0.2f), lichen);
            h = shrub * 0.7f + lichen * 0.2f + (1 - f1) * 0.1f;
            return c;
        }

        /// <summary>Bog: sphagnum hummocks (ochre, rust red, olive), dark wet hollows, white cotton-grass tufts.</summary>
        static Color Bog(float u, float v, out float h)
        {
            ProcTex.Worley(u, v, 10, 71, out float f1, out _, out float id);
            float hummock = 1 - Mathf.Clamp01(f1 * 1.3f);
            float tone = ProcTex.Fbm(u, v, 6, 3, 72) * 0.5f + 0.5f;
            var c = Lerp(new Color(0.50f, 0.42f, 0.20f), new Color(0.50f, 0.27f, 0.17f), S(0.55f, 0.75f, tone + id * 0.2f));
            c = Lerp(c, new Color(0.36f, 0.38f, 0.17f), S(0.3f, 0.6f, ProcTex.Fbm(u, v, 24, 2, 73) * 0.5f + 0.5f) * 0.5f);
            float fine = ProcTex.Fbm(u, v, 128, 2, 74) * 0.5f + 0.5f;
            c = ProcTex.Mul(c, 0.75f + fine * 0.4f);
            float wet = S(0.55f, 0.75f, ProcTex.Fbm(u, v, 5, 3, 75) * 0.5f + 0.5f) * (1 - hummock);
            c = Lerp(c, new Color(0.10f, 0.10f, 0.07f), wet * 0.9f);
            ProcTex.Worley(u, v, 140, 76, out float g1, out _, out float gid);
            if (g1 < 0.12f && gid > 0.82f && wet < 0.3f) c = Lerp(c, new Color(0.92f, 0.92f, 0.86f), 0.85f);
            h = hummock * 0.7f + fine * 0.2f - wet * 0.3f + 0.2f;
            return c;
        }

        /// <summary>Old snow: soft drifts, faint blue in the hollows, a little dirt.</summary>
        static Color Snow(float u, float v, out float h)
        {
            float drift = ProcTex.Fbm(u, v, 4, 5, 81) * 0.5f + 0.5f;
            float grain = ProcTex.Fbm(u, v, 128, 2, 82) * 0.5f + 0.5f;
            var c = Lerp(new Color(0.78f, 0.83f, 0.90f), new Color(0.95f, 0.96f, 0.97f), drift);
            c = ProcTex.Mul(c, 0.96f + grain * 0.05f);
            h = drift * 0.8f + grain * 0.1f;
            return c;
        }

        /// <summary>Shore gravel / sand: rounded pebbles (Worley) in varied greys and browns over sand.</summary>
        static Color Gravel(float u, float v, out float h)
        {
            ProcTex.Worley(u, v, 40, 91, out float f1, out float f2, out float id);
            float pebble = S(0.0f, 0.12f, f2 - f1);
            float sand = ProcTex.Fbm(u, v, 128, 2, 92) * 0.5f + 0.5f;
            var sandC = ProcTex.Mul(new Color(0.55f, 0.50f, 0.40f), 0.85f + sand * 0.25f);
            var stone = Lerp(new Color(0.40f, 0.39f, 0.37f), new Color(0.62f, 0.58f, 0.52f), id);
            if (id > 0.95f) stone = new Color(0.47f, 0.40f, 0.34f);
            float cover = S(0.35f, 0.6f, ProcTex.Fbm(u, v, 6, 3, 93) * 0.5f + 0.5f + 0.25f);
            var c = Lerp(sandC, ProcTex.Mul(stone, 0.7f + 0.3f * (1 - f1)), pebble * cover);
            h = Mathf.Lerp(sand * 0.3f, 0.5f + (1 - f1) * 0.5f, pebble * cover);
            return c;
        }
    }
}
