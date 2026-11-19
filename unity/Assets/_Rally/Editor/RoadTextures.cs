using UnityEditor;
using UnityEngine;

namespace Rally.Editor
{
    /// <summary>
    /// The road ribbon's surface detail for Rally/Road, generated in code: a two-slice Texture2DArray (0 asphalt, 1 gravel),
    /// 512² each, tileable, alpha = height, plus the normal map derived from that height. Saved as two 2 × 1 flipbook PNGs
    /// imported as arrays (mip-mapped, trilinear, anisotropic), like the ground layers (GroundTextures).
    ///   asphalt (one tile = 2 m): dense-graded aggregate — 4–16 mm grey, light and brownish stones in dark binder, fine sand.
    ///   gravel  (one tile = 3 m): crushed stone 1–6 cm, grey / beige / rust, in packed brown fines with grit.
    /// Everything at road scale (wheel tracks, ruts, patches, markings, edges) is procedural in the shader.
    /// </summary>
    public static class RoadTextures
    {
        public const int Size = 512, Slices = 2;

        public static (Texture2DArray albedo, Texture2DArray normals) Build(string dir, bool force)
        {
            string aPath = dir + "/RoadAlbedo.png", nPath = dir + "/RoadNormals.png";
            if (!force)
            {
                var a = AssetDatabase.LoadAssetAtPath<Texture2DArray>(aPath);
                var n = AssetDatabase.LoadAssetAtPath<Texture2DArray>(nPath);
                if (a != null && n != null) return (a, n);
            }
            int W = Size * Slices, H = Size;
            var albedo = new Color[W * H];
            var normals = new Color[W * H];
            var height = new float[Size * Size];
            var layer = new Color[Size * Size];
            for (int s = 0; s < Slices; s++)
            {
                for (int y = 0; y < Size; y++)
                    for (int x = 0; x < Size; x++)
                    {
                        float u = (x + 0.5f) / Size, v = (y + 0.5f) / Size;
                        var c = s == 0 ? Asphalt(u, v, out float h) : Gravel(u, v, out h);
                        c.a = Mathf.Clamp01(h);
                        layer[y * Size + x] = c;
                        height[y * Size + x] = h;
                    }
                var nrm = ProcTex.NormalsFromHeight(height, Size, Size, s == 0 ? 3f : 5f);
                for (int y = 0; y < Size; y++)
                    for (int x = 0; x < Size; x++)
                    {
                        albedo[y * W + s * Size + x] = layer[y * Size + x];
                        normals[y * W + s * Size + x] = nrm[y * Size + x];
                    }
            }
            ProcTex.SavePng(aPath, albedo, W, H, imp => { ProcTex.Colour(imp, 1024); imp.anisoLevel = 8; Array(imp); });
            ProcTex.SavePng(nPath, normals, W, H, imp => { ProcTex.Normal(imp, 1024); imp.anisoLevel = 8; Array(imp); });
            return (AssetDatabase.LoadAssetAtPath<Texture2DArray>(aPath), AssetDatabase.LoadAssetAtPath<Texture2DArray>(nPath));
        }

        static void Array(TextureImporter imp)
        {
            imp.textureShape = TextureImporterShape.Texture2DArray;
            var t = new TextureImporterSettings();
            imp.ReadTextureSettings(t);
            t.flipbookColumns = Slices;
            t.flipbookRows = 1;
            imp.SetTextureSettings(t);
        }

        static Color Lerp(Color a, Color b, float t) => Color.Lerp(a, b, Mathf.Clamp01(t));
        static float S(float e0, float e1, float x) => Mathf.SmoothStep(0, 1, Mathf.InverseLerp(e0, e1, x));

        /// <summary>Asphalt concrete: stones of two sizes standing out of the binder, sand between, a little binder sheen loss.</summary>
        static Color Asphalt(float u, float v, out float h)
        {
            var binder = new Color(0.20f, 0.20f, 0.21f);
            float sand = ProcTex.Fbm(u, v, 256, 2, 11) * 0.5f + 0.5f;
            var c = ProcTex.Mul(binder, 0.85f + 0.3f * sand);
            h = 0.25f + 0.1f * sand;
            // Coarse aggregate (~16 mm cells, 4 px), then the finer one: the exposed stone face is lighter than the binder.
            for (int o = 0; o < 2; o++)
            {
                int period = o == 0 ? 128 : 224;
                ProcTex.Worley(u, v, period, 13 + o * 7, out float f1, out float f2, out float id);
                float size = 0.30f + 0.18f * ProcTex.Hash01((int)(id * 65536), o, 5);
                float stone = 1 - S(size - 0.08f, size, f1);
                if (stone <= 0) continue;
                Color sc = id < 0.55f ? new Color(0.40f, 0.40f, 0.40f) : id < 0.8f ? new Color(0.52f, 0.51f, 0.49f) : id < 0.93f ? new Color(0.43f, 0.37f, 0.32f) : new Color(0.30f, 0.30f, 0.31f);
                sc = ProcTex.Mul(sc, 0.85f + 0.3f * (1 - f1 / size));
                c = Lerp(c, sc, stone * (o == 0 ? 0.85f : 0.6f));
                h = Mathf.Max(h, 0.45f + 0.5f * stone * (1 - f1 / size) * (o == 0 ? 1f : 0.7f));
            }
            // Pores between the stones: dark pits.
            float pore = ProcTex.Fbm(u, v, 160, 2, 17) * 0.5f + 0.5f;
            if (pore < 0.22f) { c = ProcTex.Mul(c, 0.6f); h *= 0.6f; }
            return c;
        }

        /// <summary>Crushed-stone gravel: three sizes of stones over packed fines with grit.</summary>
        static Color Gravel(float u, float v, out float h)
        {
            float fines = ProcTex.Fbm(u, v, 96, 3, 41) * 0.5f + 0.5f;
            var c = ProcTex.Mul(new Color(0.50f, 0.45f, 0.37f), 0.82f + 0.3f * fines);
            h = 0.15f + 0.15f * fines;
            int[] periods = { 56, 112, 220 };
            float[] cover = { 0.45f, 0.7f, 0.85f };
            for (int o = 0; o < 3; o++)
            {
                ProcTex.Worley(u, v, periods[o], 43 + o * 11, out float f1, out float f2, out float id);
                float present = ProcTex.Hash01((int)(id * 65536), o, 9) < cover[o] ? 1 : 0;
                if (present == 0) continue;
                // Angular-ish stones: the Worley edge distance (f2 − f1) shapes them rather than a round radius.
                float edge = f2 - f1;
                float stone = S(0.04f, 0.16f, edge) * present;
                if (stone <= 0) continue;
                Color sc = id < 0.45f ? new Color(0.55f, 0.54f, 0.52f) : id < 0.7f ? new Color(0.62f, 0.57f, 0.49f) : id < 0.85f ? new Color(0.42f, 0.41f, 0.40f) : id < 0.95f ? new Color(0.56f, 0.44f, 0.34f) : new Color(0.70f, 0.68f, 0.64f);
                float shade = 0.75f + 0.4f * Mathf.Clamp01(edge * 3f);   // crown of the stone lit, rim in its own shadow
                c = Lerp(c, ProcTex.Mul(sc, shade), stone);
                h = Mathf.Max(h, (0.4f + 0.6f * Mathf.Clamp01(edge * 2.5f)) * (o == 0 ? 1f : o == 1 ? 0.8f : 0.6f));
            }
            float grit = ProcTex.Hash01(Mathf.FloorToInt(u * Size), Mathf.FloorToInt(v * Size), 47);
            if (grit > 0.93f) c = ProcTex.Mul(c, 1.15f); else if (grit < 0.05f) c = ProcTex.Mul(c, 0.75f);
            return c;
        }
    }
}
