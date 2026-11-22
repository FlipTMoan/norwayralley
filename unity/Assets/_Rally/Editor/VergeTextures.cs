using System;
using System.IO;
using Rally.World;
using UnityEditor;
using UnityEngine;

namespace Rally.Editor
{
    /// <summary>
    /// Paints the road-verge atlas (Rally/Verge, VergeLayer) in code: 8 × 8 cells of 128 px, one per <see cref="VergeKind"/>
    /// in enum order (herbs from cell 0, bushes from <see cref="VergeRules.FirstShrub"/>). Each cell is painted in the card's
    /// own metres (<see cref="VergeRules.Kinds"/> width × height), so a round flower stays round on a wide, low card: grass
    /// blades, seed heads, lupin and fireweed spikes, cow-parsley umbels, daisies, bells, bracken fronds, heather, cotton grass,
    /// and leafy bush silhouettes with their stems — modelled on photos of Norwegian verges, nothing copied from them. Drawn at
    /// 2× and averaged down; fixed seeds, so the PNG rebuilds identically.
    /// Menu Rally/Build Verge Atlas, or <c>-executeMethod Rally.Editor.VergeTextures.Build</c>.
    /// </summary>
    public static class VergeTextures
    {
        public const string Path = "Assets/_Rally/Runtime/World/Resources/Verge/VergeAtlas.png";
        const int Cell = 128, SS = 2, S = Cell * SS, N = VergeMesh.AtlasCells;

        [MenuItem("Rally/Build Verge Atlas")]
        public static void Build()
        {
            var tex = new Texture2D(Cell * N, Cell * N, TextureFormat.RGBA32, false);
            var clear = new Color32[Cell * N * Cell * N];
            tex.SetPixels32(clear);
            foreach (VergeKind k in Enum.GetValues(typeof(VergeKind)))
            {
                var info = VergeRules.Kinds[(int)k];
                var p = new Painter(info.Width, info.Height, 1000 + (int)k);
                if (GrassBase(k)) Blades(p, 40, 0.1f, 0.35f, 0.014f);   // a flower clump stands in grass
                Paint(k, p);
                int c = (int)k % N, r = (int)k / N;
                tex.SetPixels(c * Cell, (N - 1 - r) * Cell, Cell, Cell, p.Downsample());
            }
            Directory.CreateDirectory(System.IO.Path.GetDirectoryName(Path));
            File.WriteAllBytes(Path, tex.EncodeToPNG());
            UnityEngine.Object.DestroyImmediate(tex);
            AssetDatabase.ImportAsset(Path);
            var imp = (TextureImporter)AssetImporter.GetAtPath(Path);
            imp.textureType = TextureImporterType.Default;
            imp.sRGBTexture = true;
            imp.alphaIsTransparency = true;      // bleeds the colour into the cut-out texels (no dark fringes in the mips)
            imp.mipmapEnabled = true;
            imp.mipMapsPreserveCoverage = true;  // far plants keep their coverage instead of thinning to nothing
            imp.alphaTestReferenceValue = 0.45f;
            imp.wrapMode = TextureWrapMode.Clamp;
            imp.filterMode = FilterMode.Trilinear;
            imp.anisoLevel = 2;
            imp.maxTextureSize = Cell * N;
            imp.SaveAndReimport();
            Debug.Log($"VergeTextures: {Path} written");
        }

        // ---- the painter: a cell in the card's metres (x across, y up from the ground) -------------------------------

        sealed class Painter
        {
            public readonly float W, H;
            readonly float[] r = new float[S * S], g = new float[S * S], b = new float[S * S], a = new float[S * S];
            public readonly System.Random Rnd;
            readonly float px;   // a pixel in metres (the smaller axis)
            public Painter(float w, float h, int seed) { W = w; H = h; Rnd = new System.Random(seed); px = Mathf.Min(w, h) / S; }

            public float R(float lo, float hi) => lo + (float)Rnd.NextDouble() * (hi - lo);
            public Color Vary(Color c, float v) { float f = 1 + R(-v, v); return new Color(c.r * f * (1 + R(-v, v) * 0.3f), c.g * f, c.b * f * (1 + R(-v, v) * 0.3f), 1); }

            void Put(int i, int j, Color c, float cov)
            {
                if (cov <= 0 || i < 0 || j < 0 || i >= S || j >= S) return;
                int k = j * S + i;
                float al = Mathf.Clamp01(cov) * c.a;
                r[k] = r[k] * (1 - al) + c.r * al; g[k] = g[k] * (1 - al) + c.g * al; b[k] = b[k] * (1 - al) + c.b * al;
                a[k] = a[k] + (1 - a[k]) * al;
            }

            /// <summary>Rasterise a shape given as a signed distance in metres over its metre bounding box.</summary>
            void Shape(float x0, float y0, float x1, float y1, Func<float, float, float> sd, Color c)
            {
                int i0 = Mathf.Max(0, Mathf.FloorToInt(x0 / W * S) - 1), i1 = Mathf.Min(S - 1, Mathf.CeilToInt(x1 / W * S) + 1);
                int j0 = Mathf.Max(0, Mathf.FloorToInt(y0 / H * S) - 1), j1 = Mathf.Min(S - 1, Mathf.CeilToInt(y1 / H * S) + 1);
                for (int j = j0; j <= j1; j++)
                    for (int i = i0; i <= i1; i++)
                    {
                        float mx = (i + 0.5f) / S * W, my = (j + 0.5f) / S * H;
                        Put(i, j, c, 0.5f - sd(mx, my) / px);
                    }
            }

            /// <summary>A tapered stroke from (x0, y0) to (x1, y1), widths w0 → w1 (m).</summary>
            public void Line(float x0, float y0, float x1, float y1, float w0, float w1, Color c)
            {
                float minW = Mathf.Min(W, H) / Cell * 2f;   // at least 2 final pixels (the cut-out keeps them), or thin stems vanish in the mips
                w0 = Mathf.Max(w0, minW); w1 = Mathf.Max(w1, minW);
                float m = Mathf.Max(w0, w1) / 2 + px;
                float dx = x1 - x0, dy = y1 - y0, len2 = Mathf.Max(1e-12f, dx * dx + dy * dy);
                Shape(Mathf.Min(x0, x1) - m, Mathf.Min(y0, y1) - m, Mathf.Max(x0, x1) + m, Mathf.Max(y0, y1) + m, (x, y) =>
                {
                    float t = Mathf.Clamp01(((x - x0) * dx + (y - y0) * dy) / len2);
                    float ex = x - (x0 + dx * t), ey = y - (y0 + dy * t);
                    return Mathf.Sqrt(ex * ex + ey * ey) - Mathf.Lerp(w0, w1, t) / 2;
                }, c);
            }

            public void Ellipse(float cx, float cy, float rx, float ry, float angle, Color c)
            {
                float cs = Mathf.Cos(angle), sn = Mathf.Sin(angle), m = Mathf.Max(rx, ry) + px;
                Shape(cx - m, cy - m, cx + m, cy + m, (x, y) =>
                {
                    float u = ((x - cx) * cs + (y - cy) * sn) / rx, v = (-(x - cx) * sn + (y - cy) * cs) / ry;
                    return (Mathf.Sqrt(u * u + v * v) - 1) * Mathf.Min(rx, ry);
                }, c);
            }

            public void Disc(float cx, float cy, float rad, Color c) => Ellipse(cx, cy, rad, rad, 0, c);

            /// <summary>A curved, tapering stem or blade from the ground at x: top at (x + lean, h); returns the top.</summary>
            public Vector2 Blade(float x, float h, float lean, float w, Color c, float y0 = 0, int segs = 6)
            {
                Vector2 prev = new Vector2(x, y0);
                for (int s = 1; s <= segs; s++)
                {
                    float t = s / (float)segs;
                    var p = new Vector2(x + lean * t * t, y0 + (h - y0) * t);
                    Line(prev.x, prev.y, p.x, p.y, w * (1 - (t - 1f / segs) * 0.9f), w * (1 - t * 0.9f), c);
                    prev = p;
                }
                return prev;
            }

            public Color[] Downsample()
            {
                var o = new Color[Cell * Cell];
                for (int j = 0; j < Cell; j++)
                    for (int i = 0; i < Cell; i++)
                    {
                        float sr = 0, sg = 0, sb = 0, sa = 0;
                        for (int dj = 0; dj < SS; dj++)
                            for (int di = 0; di < SS; di++)
                            {
                                int k = (j * SS + dj) * S + i * SS + di;
                                sr += r[k]; sg += g[k]; sb += b[k]; sa += a[k];   // r/g/b are composited over black: premultiplied
                            }
                        float n = SS * SS;
                        o[j * Cell + i] = sa > 1e-4f ? new Color(sr / sa, sg / sa, sb / sa, sa / n) : new Color(0.3f, 0.4f, 0.15f, 0);
                    }
                return o;
            }
        }

        // ---- colours --------------------------------------------------------------------------------------------

        static readonly Color Grass = new Color(0.30f, 0.46f, 0.14f), GrassDark = new Color(0.19f, 0.33f, 0.09f), GrassLight = new Color(0.46f, 0.58f, 0.2f);
        static readonly Color Leaf = new Color(0.24f, 0.42f, 0.12f), LeafDark = new Color(0.15f, 0.30f, 0.08f), Stem = new Color(0.32f, 0.42f, 0.16f);
        static readonly Color White = new Color(0.95f, 0.95f, 0.9f), Yellow = new Color(0.98f, 0.82f, 0.12f), Wood = new Color(0.35f, 0.27f, 0.2f);

        static Color GrassColour(Painter p) { float t = p.R(0, 1); return p.Vary(t < 0.4f ? Grass : t < 0.75f ? GrassDark : GrassLight, 0.12f); }

        static void Blades(Painter p, int n, float hLo, float hHi, float w, Func<Painter, Color> colour = null)
        {
            for (int i = 0; i < n; i++)
            {
                float x = p.R(p.W * 0.08f, p.W * 0.92f), h = p.R(hLo, hHi) * p.H;
                p.Blade(x, h, p.R(-0.35f, 0.35f) * h, w, (colour ?? GrassColour)(p));
            }
        }

        /// <summary>Stems with flowers along their top part: lupin, fireweed, foxglove, wolfsbane, bistort.</summary>
        static void Spikes(Painter p, int n, float hLo, float hHi, float spikeFrac, float flowerR, Func<float, Color> colour, float density = 1, bool oneSided = false)
        {
            for (int s = 0; s < n; s++)
            {
                float x = p.R(p.W * 0.25f, p.W * 0.75f), h = p.R(hLo, hHi) * p.H, lean = p.R(-0.08f, 0.08f) * p.H;
                p.Blade(x, h, lean, flowerR * 0.5f, p.Vary(Stem, 0.1f));
                float y0 = h * (1 - spikeFrac);
                int count = (int)(spikeFrac * h / flowerR * 1.6f * density);
                for (int f = 0; f < count; f++)
                {
                    float t = f / (float)count, y = Mathf.Lerp(y0, h, t);
                    float stemX = x + lean * (y / h) * (y / h);
                    float width = flowerR * (1.6f - t * 1.1f);
                    float side = oneSided ? p.R(0.2f, 1f) : p.R(-1f, 1f);
                    p.Ellipse(stemX + side * width, y, flowerR * (1 - t * 0.5f), flowerR * 0.8f * (1 - t * 0.4f), p.R(-0.5f, 0.5f), colour(t));
                }
            }
        }

        /// <summary>Leaves at the foot of a herb: ellipses fanning out from the ground.</summary>
        static void Rosette(Painter p, int n, float len, float width, Color c, float hFrac = 0.25f)
        {
            for (int i = 0; i < n; i++)
            {
                float x = p.R(p.W * 0.2f, p.W * 0.8f), y = p.R(0.02f, hFrac) * p.H, ang = p.R(0.3f, 2.8f);
                p.Ellipse(x + Mathf.Cos(ang) * len * 0.5f, y + Mathf.Sin(ang) * len * 0.3f, len * 0.5f, width * 0.5f, ang, p.Vary(c, 0.15f));
            }
        }

        /// <summary>Stems ending in a flower head drawn by <paramref name="head"/>.</summary>
        static void Heads(Painter p, int n, float hLo, float hHi, float w, Action<Painter, Vector2> head)
        {
            for (int i = 0; i < n; i++)
            {
                float x = p.R(p.W * 0.15f, p.W * 0.85f), h = p.R(hLo, hHi) * p.H;
                var top = p.Blade(x, h, p.R(-0.2f, 0.2f) * h, w, p.Vary(Stem, 0.12f));
                head(p, top);
            }
        }

        static void Cluster(Painter p, Vector2 c, float rx, float ry, int n, float dot, Color col)
        {
            for (int i = 0; i < n; i++)
            {
                float a = p.R(0, 6.283f), d = Mathf.Sqrt(p.R(0, 1));
                p.Disc(c.x + Mathf.Cos(a) * d * rx, c.y + Mathf.Sin(a) * d * ry, dot * p.R(0.7f, 1.2f), p.Vary(col, 0.06f));
            }
        }

        /// <summary>A leafy bush: stems from the foot, then leaves scattered inside the silhouette, darker low and inside.</summary>
        static void Bush(Painter p, Func<float, float, bool> inside, int stems, Color wood, int leaves, float leafLen, float leafW, Color leaf, Color leafDark, float trunkH = 0)
        {
            float cx = p.W / 2;
            for (int s = 0; s < stems; s++)
            {
                float tx = cx + p.R(-0.35f, 0.35f) * p.W, ty = p.R(0.45f, 0.9f) * p.H;
                float bx = cx + p.R(-0.06f, 0.06f) * p.W;
                p.Line(bx, 0, tx, ty, leafW * 0.9f, leafW * 0.25f, p.Vary(wood, 0.1f));
            }
            if (trunkH > 0) p.Line(cx, 0, cx, trunkH * p.H, p.W * 0.035f, p.W * 0.015f, wood);
            for (int i = 0; i < leaves; i++)
            {
                float x, y; int guard = 0;
                do { x = p.R(0, p.W); y = p.R(0, p.H); } while (!inside(x / p.W, y / p.H) && ++guard < 30);
                if (guard >= 30) continue;
                float depth = Mathf.Clamp01(1 - Mathf.Abs(x / p.W - 0.5f) * 2) * 0.6f + (1 - y / p.H) * 0.4f;   // inner and lower: shaded
                var c = Color.Lerp(leaf, leafDark, depth * p.R(0.7f, 1.3f) + 0.15f);
                p.Ellipse(x, y, leafLen * p.R(0.7f, 1.2f), leafW * p.R(0.7f, 1.2f), p.R(0, 3.14f), p.Vary(c, 0.1f));
            }
        }

        /// <summary>Herbs that are drawn standing in a tuft of grass (not the grasses themselves, the mats and the big leaves).</summary>
        static bool GrassBase(VergeKind k) => !VergeRules.IsShrub(k) && k != VergeKind.Mown && k != VergeKind.TallGrass && k != VergeKind.DryGrass
            && k != VergeKind.AlpineTuft && k != VergeKind.Heather && k != VergeKind.Crowberry && k != VergeKind.LadysMantle && k != VergeKind.Bracken;

        static bool Oval(float u, float v, float cy, float ry, float rx = 0.48f) { float du = (u - 0.5f) / rx, dv = (v - cy) / ry; return du * du + dv * dv < 1; }

        static void Paint(VergeKind k, Painter p)
        {
            float W = p.W, H = p.H;
            switch (k)
            {
                case VergeKind.Mown:
                    Blades(p, 170, 0.35f, 1f, 0.012f);
                    for (int i = 0; i < 5; i++) { var c = new Vector2(p.R(0.1f, 0.9f) * W, p.R(0.3f, 0.7f) * H); for (int l = 0; l < 3; l++) p.Disc(c.x + Mathf.Cos(l * 2.1f) * 0.008f, c.y + Mathf.Sin(l * 2.1f) * 0.008f, 0.008f, p.Vary(Leaf, 0.1f)); }
                    for (int i = 0; i < 4; i++) p.Disc(p.R(0.1f, 0.9f) * W, p.R(0.6f, 0.95f) * H, 0.008f, White);
                    for (int i = 0; i < 3; i++) p.Disc(p.R(0.1f, 0.9f) * W, p.R(0.7f, 0.95f) * H, 0.007f, Yellow);
                    break;
                case VergeKind.TallGrass:
                    Blades(p, 110, 0.3f, 0.85f, 0.016f);
                    Heads(p, 10, 0.75f, 1f, 0.004f, (q, t) => q.Ellipse(t.x, t.y - 0.03f, 0.009f, 0.045f, 0, q.Vary(new Color(0.55f, 0.52f, 0.33f), 0.12f)));
                    Heads(p, 6, 0.7f, 0.95f, 0.003f, (q, t) => Cluster(q, t - new Vector2(0, 0.04f), 0.03f, 0.05f, 10, 0.006f, new Color(0.62f, 0.55f, 0.38f)));
                    break;
                case VergeKind.DryGrass:
                    Blades(p, 60, 0.3f, 0.9f, 0.012f, q => q.Vary(Color.Lerp(new Color(0.62f, 0.56f, 0.3f), Grass, q.R(0, 0.5f)), 0.12f));
                    Heads(p, 4, 0.5f, 0.8f, 0.004f, (q, t) => Cluster(q, t, 0.025f, 0.02f, 8, 0.009f, new Color(0.95f, 0.78f, 0.25f)));
                    break;
                case VergeKind.AlpineTuft:
                    for (int i = 0; i < 6; i++) p.Ellipse(p.R(0.15f, 0.85f) * W, 0.02f, p.R(0.04f, 0.08f), 0.03f, 0, p.Vary(new Color(0.35f, 0.4f, 0.18f), 0.15f));
                    Blades(p, 45, 0.3f, 1f, 0.006f, q => q.Vary(Color.Lerp(new Color(0.55f, 0.5f, 0.3f), Grass, q.R(0, 0.7f)), 0.12f));
                    break;
                case VergeKind.Lupin:
                case VergeKind.LupinPink:
                    Rosette(p, 14, 0.06f, 0.018f, Leaf, 0.35f);
                    Blades(p, 12, 0.2f, 0.45f, 0.01f);
                    bool pink = k == VergeKind.LupinPink;
                    for (int s = 0; s < 6; s++)
                    {
                        float pick = p.R(0, 1);
                        Color baseC = pink ? (pick < 0.6f ? new Color(0.9f, 0.55f, 0.72f) : new Color(0.96f, 0.94f, 0.92f)) : (pick < 0.75f ? new Color(0.36f, 0.3f, 0.76f) : new Color(0.55f, 0.42f, 0.82f));
                        Spikes(p, 1, 0.6f, 0.98f, 0.42f, 0.022f, t => p.Vary(Color.Lerp(baseC, t > 0.8f ? new Color(0.4f, 0.5f, 0.3f) : baseC, (t - 0.8f) * 4), 0.08f));
                    }
                    break;
                case VergeKind.Fireweed:
                    for (int s = 0; s < 3; s++)
                    {
                        float x = p.R(0.3f, 0.7f) * W, h = p.R(0.7f, 1f) * H;
                        for (int l = 0; l < 10; l++) { float y = p.R(0.1f, 0.65f) * h, side = l % 2 == 0 ? 1 : -1; p.Ellipse(x + side * 0.04f, y, 0.045f, 0.008f, side * 0.5f, p.Vary(Leaf, 0.12f)); }
                    }
                    Spikes(p, 5, 0.7f, 1f, 0.34f, 0.026f, t => p.Vary(t > 0.85f ? new Color(0.55f, 0.25f, 0.4f) : new Color(0.86f, 0.32f, 0.62f), 0.1f));
                    break;
                case VergeKind.CowParsley:
                    for (int i = 0; i < 40; i++) p.Ellipse(p.R(0.1f, 0.9f) * W, p.R(0.05f, 0.4f) * H, 0.02f, 0.008f, p.R(0, 3.14f), p.Vary(Leaf, 0.15f));
                    for (int s = 0; s < 6; s++)
                    {
                        float x = p.R(0.2f, 0.8f) * W, h = p.R(0.65f, 0.95f) * H;
                        var top = p.Blade(x, h, p.R(-0.1f, 0.1f), 0.008f, p.Vary(Stem, 0.1f));
                        for (int ray = 0; ray < 9; ray++)
                        {
                            float a = Mathf.Lerp(0.5f, 2.64f, ray / 8f);
                            var end = top + new Vector2(Mathf.Cos(a) * 0.12f, Mathf.Sin(a) * 0.045f + 0.025f);
                            p.Line(top.x, top.y, end.x, end.y, 0.003f, 0.002f, Stem);
                            Cluster(p, end, 0.03f, 0.018f, 8, 0.009f, White);
                        }
                    }
                    break;
                case VergeKind.Buttercup:
                    Blades(p, 25, 0.3f, 0.8f, 0.009f);
                    Rosette(p, 6, 0.04f, 0.03f, Leaf);
                    Heads(p, 9, 0.6f, 1f, 0.003f, (q, t) => { q.Disc(t.x, t.y, 0.017f, q.Vary(Yellow, 0.05f)); q.Disc(t.x, t.y, 0.005f, new Color(0.8f, 0.65f, 0.1f)); });
                    break;
                case VergeKind.RedCampion:
                    Rosette(p, 8, 0.05f, 0.02f, Leaf, 0.4f);
                    Heads(p, 7, 0.65f, 1f, 0.004f, (q, t) => { q.Disc(t.x, t.y, 0.02f, q.Vary(new Color(0.88f, 0.3f, 0.48f), 0.08f)); q.Disc(t.x, t.y, 0.005f, new Color(0.95f, 0.75f, 0.8f)); });
                    break;
                case VergeKind.Yarrow:
                    for (int i = 0; i < 30; i++) p.Ellipse(p.R(0.15f, 0.85f) * W, p.R(0.03f, 0.35f) * H, 0.022f, 0.006f, p.R(0.5f, 2.6f), p.Vary(GrassDark, 0.15f));
                    Heads(p, 5, 0.7f, 1f, 0.004f, (q, t) => Cluster(q, t, 0.045f, 0.02f, 18, 0.009f, new Color(0.94f, 0.92f, 0.86f)));
                    break;
                case VergeKind.OxeyeDaisy:
                    Blades(p, 14, 0.2f, 0.5f, 0.008f);
                    Heads(p, 6, 0.65f, 1f, 0.004f, (q, t) =>
                    {
                        for (int pe = 0; pe < 12; pe++) { float a = pe * 0.5236f; q.Ellipse(t.x + Mathf.Cos(a) * 0.019f, t.y + Mathf.Sin(a) * 0.019f, 0.015f, 0.006f, a, White); }
                        q.Disc(t.x, t.y, 0.01f, Yellow);
                    });
                    break;
                case VergeKind.Harebell:
                    Blades(p, 14, 0.2f, 0.6f, 0.006f);
                    Heads(p, 6, 0.75f, 1f, 0.0025f, (q, t) => q.Ellipse(t.x + 0.008f, t.y - 0.016f, 0.013f, 0.018f, 0.2f, q.Vary(new Color(0.45f, 0.5f, 0.88f), 0.08f)));
                    break;
                case VergeKind.Cranesbill:
                    for (int i = 0; i < 26; i++) p.Disc(p.R(0.15f, 0.85f) * W, p.R(0.1f, 0.7f) * H, p.R(0.025f, 0.04f), p.Vary(Leaf, 0.15f));
                    for (int i = 0; i < 12; i++) { var c = new Vector2(p.R(0.15f, 0.85f) * W, p.R(0.6f, 0.95f) * H); p.Disc(c.x, c.y, 0.022f, p.Vary(new Color(0.56f, 0.46f, 0.88f), 0.08f)); p.Disc(c.x, c.y, 0.005f, White); }
                    break;
                case VergeKind.Wolfsbane:
                    for (int i = 0; i < 12; i++) p.Disc(p.R(0.15f, 0.85f) * W, p.R(0.05f, 0.35f) * H, p.R(0.05f, 0.08f), p.Vary(LeafDark, 0.15f));
                    Spikes(p, 3, 0.7f, 1f, 0.35f, 0.027f, t => p.Vary(new Color(0.42f, 0.38f, 0.72f), 0.1f), 0.8f, true);
                    break;
                case VergeKind.GlobeFlower:
                    for (int i = 0; i < 14; i++) p.Disc(p.R(0.15f, 0.85f) * W, p.R(0.05f, 0.4f) * H, p.R(0.025f, 0.04f), p.Vary(LeafDark, 0.15f));
                    Heads(p, 5, 0.7f, 1f, 0.005f, (q, t) => { q.Disc(t.x, t.y, 0.028f, q.Vary(new Color(0.98f, 0.86f, 0.25f), 0.06f)); q.Disc(t.x - 0.008f, t.y + 0.008f, 0.01f, new Color(1f, 0.95f, 0.55f)); });
                    break;
                case VergeKind.Foxglove:
                    Rosette(p, 10, 0.12f, 0.05f, LeafDark, 0.2f);
                    Spikes(p, 3, 0.75f, 1f, 0.5f, 0.03f, t => p.Vary(Color.Lerp(new Color(0.78f, 0.36f, 0.66f), new Color(0.9f, 0.6f, 0.8f), p.R(0, 0.4f)), 0.08f), 0.8f, true);
                    break;
                case VergeKind.Bracken:
                    for (int f = 0; f < 5; f++)
                    {
                        float x0 = p.R(0.35f, 0.65f) * W, ang = Mathf.Lerp(0.6f, 2.5f, (f + p.R(0, 1)) / 5f), len = p.R(0.75f, 1f) * H;
                        Vector2 a = new Vector2(x0, 0), dir = new Vector2(Mathf.Cos(ang), Mathf.Sin(ang));
                        int seg = 12;
                        for (int s = 0; s < seg; s++)
                        {
                            float t = s / (float)seg;
                            var bnd = new Vector2(dir.x, dir.y - t * 0.9f).normalized;
                            var b = a + bnd * (len / seg);
                            p.Line(a.x, a.y, b.x, b.y, 0.01f, 0.008f, new Color(0.38f, 0.42f, 0.18f));
                            if (t > 0.25f)
                            {
                                var nrm = new Vector2(-bnd.y, bnd.x);
                                float pl = 0.12f * (1 - t) + 0.02f;
                                p.Ellipse(b.x + nrm.x * pl * 0.5f, b.y + nrm.y * pl * 0.5f, pl * 0.5f, 0.012f, Mathf.Atan2(nrm.y, nrm.x), p.Vary(new Color(0.3f, 0.5f, 0.15f), 0.1f));
                                p.Ellipse(b.x - nrm.x * pl * 0.5f, b.y - nrm.y * pl * 0.5f, pl * 0.5f, 0.012f, Mathf.Atan2(nrm.y, nrm.x), p.Vary(new Color(0.27f, 0.46f, 0.13f), 0.1f));
                            }
                            a = b;
                        }
                    }
                    break;
                case VergeKind.Meadowsweet:
                    for (int i = 0; i < 20; i++) p.Ellipse(p.R(0.15f, 0.85f) * W, p.R(0.05f, 0.6f) * H, 0.04f, 0.015f, p.R(0, 3.14f), p.Vary(LeafDark, 0.15f));
                    Heads(p, 5, 0.75f, 1f, 0.006f, (q, t) => Cluster(q, t, 0.07f, 0.06f, 40, 0.01f, new Color(0.96f, 0.93f, 0.78f)));
                    break;
                case VergeKind.RedClover:
                    for (int i = 0; i < 12; i++) { var c = new Vector2(p.R(0.15f, 0.85f) * W, p.R(0.1f, 0.6f) * H); for (int l = 0; l < 3; l++) p.Ellipse(c.x + Mathf.Cos(l * 2.1f) * 0.012f, c.y + Mathf.Sin(l * 2.1f) * 0.012f, 0.013f, 0.009f, l * 2.1f, p.Vary(Leaf, 0.12f)); }
                    Heads(p, 6, 0.6f, 1f, 0.004f, (q, t) => Cluster(q, t, 0.022f, 0.022f, 14, 0.008f, new Color(0.85f, 0.42f, 0.6f)));
                    break;
                case VergeKind.Vetch:
                    for (int i = 0; i < 14; i++) p.Blade(p.R(0.2f, 0.8f) * W, p.R(0.5f, 0.9f) * H, p.R(-0.2f, 0.2f), 0.003f, p.Vary(Stem, 0.1f));
                    for (int i = 0; i < 30; i++) p.Ellipse(p.R(0.15f, 0.85f) * W, p.R(0.1f, 0.7f) * H, 0.012f, 0.004f, p.R(0, 3.14f), p.Vary(Leaf, 0.12f));
                    Spikes(p, 6, 0.55f, 0.95f, 0.3f, 0.014f, t => p.Vary(new Color(0.52f, 0.44f, 0.86f), 0.08f), 1f, true);
                    break;
                case VergeKind.Heather:
                    for (int i = 0; i < 40; i++) p.Blade(p.R(0.1f, 0.9f) * W, p.R(0.5f, 1f) * H, p.R(-0.1f, 0.1f), 0.004f, p.Vary(Wood, 0.12f));
                    for (int i = 0; i < 260; i++) { float y = p.R(0.25f, 1f) * H; p.Disc(p.R(0.08f, 0.92f) * W, y, 0.006f, p.Vary(y > 0.55f * H && p.R(0, 1) < 0.65f ? new Color(0.68f, 0.4f, 0.6f) : new Color(0.25f, 0.33f, 0.18f), 0.1f)); }
                    break;
                case VergeKind.Crowberry:
                    for (int i = 0; i < 300; i++) p.Ellipse(p.R(0.05f, 0.95f) * W, p.R(0.0f, 0.9f) * H * p.R(0.5f, 1f), 0.008f, 0.003f, p.R(0, 3.14f), p.Vary(new Color(0.16f, 0.25f, 0.12f), 0.15f));
                    for (int i = 0; i < 8; i++) p.Disc(p.R(0.1f, 0.9f) * W, p.R(0.4f, 0.8f) * H, 0.005f, new Color(0.08f, 0.07f, 0.1f));
                    break;
                case VergeKind.CottonGrass:
                    Blades(p, 25, 0.2f, 0.6f, 0.006f, q => q.Vary(new Color(0.42f, 0.45f, 0.2f), 0.12f));
                    Heads(p, 7, 0.75f, 1f, 0.003f, (q, t) => Cluster(q, t, 0.026f, 0.03f, 16, 0.011f, new Color(0.97f, 0.97f, 0.95f)));
                    break;
                case VergeKind.LadysMantle:
                    for (int i = 0; i < 12; i++) { var c = new Vector2(p.R(0.15f, 0.85f) * W, p.R(0.15f, 0.6f) * H); p.Disc(c.x, c.y, 0.045f, p.Vary(new Color(0.36f, 0.48f, 0.18f), 0.1f)); p.Disc(c.x, c.y, 0.034f, p.Vary(new Color(0.48f, 0.6f, 0.24f), 0.1f)); }
                    Heads(p, 4, 0.7f, 1f, 0.003f, (q, t) => Cluster(q, t, 0.03f, 0.02f, 14, 0.005f, new Color(0.78f, 0.82f, 0.35f)));
                    break;
                case VergeKind.Bistort:
                    Rosette(p, 6, 0.04f, 0.012f, Leaf, 0.3f);
                    Spikes(p, 3, 0.7f, 1f, 0.3f, 0.01f, t => p.Vary(t < 0.5f ? new Color(0.62f, 0.32f, 0.3f) : new Color(0.97f, 0.88f, 0.88f), 0.06f), 1.5f);
                    break;

                // ---- bushes ----
                case VergeKind.Willow:
                    Bush(p, (u, v) => Oval(u, v, 0.55f, 0.45f), 9, new Color(0.4f, 0.32f, 0.24f), 900, 0.06f, 0.012f, new Color(0.5f, 0.6f, 0.42f), new Color(0.25f, 0.33f, 0.2f));
                    break;
                case VergeKind.Juniper:
                    Bush(p, (u, v) => Mathf.Abs(u - 0.5f) < 0.42f * (1 - Mathf.Pow(v, 1.6f)) + 0.04f, 3, Wood, 2600, 0.025f, 0.006f, new Color(0.24f, 0.36f, 0.26f), new Color(0.1f, 0.18f, 0.12f));
                    break;
                case VergeKind.BirchSapling:
                    Bush(p, (u, v) => Oval(u, v, 0.62f, 0.38f, 0.45f), 2, new Color(0.85f, 0.83f, 0.78f), 1100, 0.04f, 0.028f, new Color(0.45f, 0.62f, 0.22f), new Color(0.22f, 0.36f, 0.1f), 0.6f);
                    break;
                case VergeKind.GreyAlder:
                    Bush(p, (u, v) => Oval(u, v, 0.58f, 0.42f), 5, new Color(0.45f, 0.45f, 0.42f), 1100, 0.05f, 0.045f, new Color(0.26f, 0.44f, 0.16f), new Color(0.12f, 0.24f, 0.08f));
                    break;
                case VergeKind.Raspberry:
                    Bush(p, (u, v) => Oval(u, v, 0.45f, 0.45f), 10, new Color(0.45f, 0.32f, 0.3f), 500, 0.07f, 0.05f, new Color(0.44f, 0.6f, 0.26f), new Color(0.22f, 0.34f, 0.12f));
                    break;
                case VergeKind.DogRose:
                    Bush(p, (u, v) => Oval(u, v, 0.5f, 0.48f), 9, new Color(0.35f, 0.38f, 0.2f), 1100, 0.035f, 0.022f, new Color(0.32f, 0.48f, 0.18f), new Color(0.15f, 0.28f, 0.08f));
                    for (int i = 0; i < 26; i++) { float u, v; do { u = p.R(0, 1); v = p.R(0, 1); } while (!Oval(u, v, 0.55f, 0.4f)); p.Disc(u * W, v * H, 0.035f, p.Vary(new Color(0.96f, 0.62f, 0.72f), 0.08f)); p.Disc(u * W, v * H, 0.01f, Yellow); }
                    break;
                case VergeKind.DwarfBirch:
                    Bush(p, (u, v) => Oval(u, v, 0.3f, 0.7f), 14, Wood, 900, 0.018f, 0.016f, new Color(0.42f, 0.5f, 0.2f), new Color(0.45f, 0.25f, 0.12f));
                    break;
                case VergeKind.Rowan:
                    Bush(p, (u, v) => Oval(u, v, 0.62f, 0.36f, 0.46f), 2, new Color(0.45f, 0.42f, 0.36f), 1300, 0.045f, 0.016f, new Color(0.38f, 0.56f, 0.2f), new Color(0.18f, 0.32f, 0.1f), 0.55f);
                    for (int i = 0; i < 5; i++) { float u, v; do { u = p.R(0, 1); v = p.R(0, 1); } while (!Oval(u, v, 0.7f, 0.25f)); Cluster(p, new Vector2(u * W, v * H), 0.06f, 0.04f, 10, 0.014f, new Color(0.92f, 0.42f, 0.12f)); }
                    break;
                case VergeKind.Hazel:
                    Bush(p, (u, v) => Oval(u, v, 0.55f, 0.45f), 8, new Color(0.42f, 0.36f, 0.3f), 900, 0.07f, 0.055f, new Color(0.34f, 0.52f, 0.18f), new Color(0.16f, 0.3f, 0.09f));
                    break;
                case VergeKind.BogMyrtle:
                    Bush(p, (u, v) => Oval(u, v, 0.5f, 0.5f, 0.45f), 12, new Color(0.4f, 0.28f, 0.2f), 700, 0.025f, 0.01f, new Color(0.4f, 0.5f, 0.24f), new Color(0.22f, 0.3f, 0.12f));
                    break;
            }
        }
    }
}
