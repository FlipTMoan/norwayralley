using System;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace Rally.Editor
{
    /// <summary>
    /// Tileable noise and PNG helpers for the procedural art (GroundTextures, TreeBuilder). Everything is generated in
    /// code from fixed seeds so the textures are ours to licence and rebuild identically. All noise here is periodic
    /// over the unit square (lattice period an integer), so a texture made from it tiles without a seam.
    /// </summary>
    public static class ProcTex
    {
        public static uint Hash(int x, int y, int seed)
        {
            unchecked
            {
                uint h = (uint)x * 374761393u + (uint)y * 668265263u + (uint)seed * 1442695041u;
                h = (h ^ (h >> 13)) * 1274126177u;
                return h ^ (h >> 16);
            }
        }
        public static float Hash01(int x, int y, int seed) => Hash(x, y, seed) / 4294967296f;
        static int Wrap(int i, int p) => ((i % p) + p) % p;

        /// <summary>Periodic gradient noise in −1..1 at (u, v) ∈ unit square, <paramref name="period"/> lattice cells across.</summary>
        public static float Perlin(float u, float v, int period, int seed) => Perlin(u, v, period, period, seed);

        /// <summary>Periodic gradient noise with its own lattice period per axis (stretched streaks that still tile).</summary>
        public static float Perlin(float u, float v, int px, int py, int seed)
        {
            float x = u * px, y = v * py;
            int x0 = Mathf.FloorToInt(x), y0 = Mathf.FloorToInt(y);
            float fx = x - x0, fy = y - y0;
            float G(int ix, int iy, float dx, float dy)
            {
                float a = Hash01(Wrap(ix, px), Wrap(iy, py), seed) * 6.2831853f;
                return Mathf.Cos(a) * dx + Mathf.Sin(a) * dy;
            }
            float sx = fx * fx * fx * (fx * (fx * 6 - 15) + 10), sy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
            float n0 = Mathf.Lerp(G(x0, y0, fx, fy), G(x0 + 1, y0, fx - 1, fy), sx);
            float n1 = Mathf.Lerp(G(x0, y0 + 1, fx, fy - 1), G(x0 + 1, y0 + 1, fx - 1, fy - 1), sx);
            return Mathf.Lerp(n0, n1, sy) * 1.414f;
        }

        /// <summary>Periodic fBm in roughly −1..1: octaves double the period, halve the amplitude.</summary>
        public static float Fbm(float u, float v, int period, int octaves, int seed, float gain = 0.5f)
        {
            float sum = 0, amp = 1, norm = 0;
            for (int o = 0; o < octaves; o++)
            {
                sum += Perlin(u, v, period << o, seed + o * 101) * amp;
                norm += amp; amp *= gain;
            }
            return sum / norm;
        }

        /// <summary>Periodic fBm with separate x / y periods (both double per octave).</summary>
        public static float Fbm(float u, float v, int px, int py, int octaves, int seed)
        {
            float sum = 0, amp = 1, norm = 0;
            for (int o = 0; o < octaves; o++)
            {
                sum += Perlin(u, v, px << o, py << o, seed + o * 101) * amp;
                norm += amp; amp *= 0.5f;
            }
            return sum / norm;
        }

        /// <summary>
        /// Periodic Worley noise: distance to the nearest (f1) and second nearest (f2) feature point, in cell units,
        /// and the id hash of the nearest cell (for per-stone / per-plate colour).
        /// </summary>
        public static void Worley(float u, float v, int period, int seed, out float f1, out float f2, out float id)
        {
            float x = u * period, y = v * period;
            int cx = Mathf.FloorToInt(x), cy = Mathf.FloorToInt(y);
            f1 = f2 = 9; id = 0;
            for (int j = -1; j <= 1; j++)
                for (int i = -1; i <= 1; i++)
                {
                    int gx = cx + i, gy = cy + j, wx = Wrap(gx, period), wy = Wrap(gy, period);
                    float px = gx + Hash01(wx, wy, seed), py = gy + Hash01(wx, wy, seed + 17);
                    float d = Mathf.Sqrt((px - x) * (px - x) + (py - y) * (py - y));
                    if (d < f1) { f2 = f1; f1 = d; id = Hash01(wx, wy, seed + 31); }
                    else if (d < f2) f2 = d;
                }
        }

        public static Color Mul(Color c, float k) => new Color(c.r * k, c.g * k, c.b * k, c.a);

        /// <summary>Tangent-space normal map from a periodic height field (Sobel, wraps at the edges); strength in texels.</summary>
        public static Color[] NormalsFromHeight(float[] h, int w, int hgt, float strength, bool wrap = true)
        {
            var o = new Color[w * hgt];
            float H(int x, int y)
            {
                if (wrap) { x = Wrap(x, w); y = Wrap(y, hgt); } else { x = Mathf.Clamp(x, 0, w - 1); y = Mathf.Clamp(y, 0, hgt - 1); }
                return h[y * w + x];
            }
            for (int y = 0; y < hgt; y++)
                for (int x = 0; x < w; x++)
                {
                    float dx = (H(x + 1, y - 1) + 2 * H(x + 1, y) + H(x + 1, y + 1)) - (H(x - 1, y - 1) + 2 * H(x - 1, y) + H(x - 1, y + 1));
                    float dy = (H(x - 1, y + 1) + 2 * H(x, y + 1) + H(x + 1, y + 1)) - (H(x - 1, y - 1) + 2 * H(x, y - 1) + H(x + 1, y - 1));
                    var n = new Vector3(-dx * strength, -dy * strength, 1).normalized;
                    o[y * w + x] = new Color(n.x * 0.5f + 0.5f, n.y * 0.5f + 0.5f, n.z * 0.5f + 0.5f, 1);
                }
            return o;
        }

        /// <summary>
        /// Pushes colour from opaque texels into the transparent ones around them (a few passes), so mip-mapped and
        /// filtered cutout cards do not get dark or white fringes from the background colour.
        /// </summary>
        public static void Dilate(Color[] px, int w, int h, int passes)
        {
            var filled = new bool[px.Length];
            for (int i = 0; i < px.Length; i++) filled[i] = px[i].a > 0.02f;
            var src = (Color[])px.Clone();
            for (int p = 0; p < passes; p++)
            {
                var next = (bool[])filled.Clone();
                for (int y = 0; y < h; y++)
                    for (int x = 0; x < w; x++)
                    {
                        int k = y * w + x;
                        if (filled[k]) continue;
                        Color sum = Color.clear; int n = 0;
                        for (int j = -1; j <= 1; j++)
                            for (int i = -1; i <= 1; i++)
                            {
                                int xx = x + i, yy = y + j;
                                if (xx < 0 || yy < 0 || xx >= w || yy >= h || !filled[yy * w + xx]) continue;
                                sum += src[yy * w + xx]; n++;
                            }
                        if (n == 0) continue;
                        var c = sum / n; c.a = px[k].a;
                        src[k] = c; next[k] = true;
                    }
                filled = next;
            }
            for (int i = 0; i < px.Length; i++) { var c = src[i]; c.a = px[i].a; px[i] = c; }
        }

        /// <summary>Writes RGBA pixels (row 0 = bottom) as a PNG asset and imports it with the given settings.</summary>
        public static Texture2D SavePng(string path, Color[] px, int w, int h, Action<TextureImporter> setup)
        {
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false, true);
            tex.SetPixels(px);
            tex.Apply(false);
            File.WriteAllBytes(path, tex.EncodeToPNG());
            UnityEngine.Object.DestroyImmediate(tex);
            AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceSynchronousImport);
            var imp = (TextureImporter)AssetImporter.GetAtPath(path);
            setup?.Invoke(imp);
            imp.SaveAndReimport();
            return AssetDatabase.LoadAssetAtPath<Texture2D>(path);
        }

        /// <summary>Importer presets: colour (sRGB, optional alpha cutout coverage), linear data, normal map.</summary>
        public static void Colour(TextureImporter imp, int maxSize, bool cutout = false, bool clamp = false)
        {
            imp.textureType = TextureImporterType.Default;
            imp.sRGBTexture = true;
            imp.alphaSource = TextureImporterAlphaSource.FromInput;
            imp.alphaIsTransparency = cutout;
            imp.mipmapEnabled = true;
            imp.mipMapsPreserveCoverage = cutout;
            imp.alphaTestReferenceValue = 0.4f;
            imp.wrapMode = clamp ? TextureWrapMode.Clamp : TextureWrapMode.Repeat;
            imp.filterMode = FilterMode.Trilinear;
            imp.anisoLevel = 4;
            imp.maxTextureSize = maxSize;
            imp.textureCompression = TextureImporterCompression.Compressed;
        }

        public static void Normal(TextureImporter imp, int maxSize, bool clamp = false)
        {
            imp.textureType = TextureImporterType.NormalMap;
            imp.mipmapEnabled = true;
            imp.wrapMode = clamp ? TextureWrapMode.Clamp : TextureWrapMode.Repeat;
            imp.filterMode = FilterMode.Trilinear;
            imp.anisoLevel = 4;
            imp.maxTextureSize = maxSize;
            imp.textureCompression = TextureImporterCompression.Compressed;
        }
    }
}
