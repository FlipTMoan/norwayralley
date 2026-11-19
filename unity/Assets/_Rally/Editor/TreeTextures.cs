using UnityEngine;
using Random = System.Random;

namespace Rally.Editor
{
    /// <summary>An RGBA + height raster with anti-aliased strokes and leaf shapes, for the foliage card atlases.</summary>
    public sealed class Canvas
    {
        public readonly int W, H;
        public readonly Color[] Px;
        public readonly float[] Height;
        public Canvas(int w, int h) { W = w; H = h; Px = new Color[w * h]; Height = new float[w * h]; }

        /// <summary>A tapered stroke from p0 to p1 (pixels), drawn over what is there; height is a ridge along it.</summary>
        public void Stroke(Vector2 p0, Vector2 p1, float w0, float w1, Color c, float h)
        {
            float pad = Mathf.Max(w0, w1) * 0.5f + 1.5f;
            int x0 = Mathf.Max(0, Mathf.FloorToInt(Mathf.Min(p0.x, p1.x) - pad)), x1 = Mathf.Min(W - 1, Mathf.CeilToInt(Mathf.Max(p0.x, p1.x) + pad));
            int y0 = Mathf.Max(0, Mathf.FloorToInt(Mathf.Min(p0.y, p1.y) - pad)), y1 = Mathf.Min(H - 1, Mathf.CeilToInt(Mathf.Max(p0.y, p1.y) + pad));
            var ab = p1 - p0; float l2 = Mathf.Max(ab.sqrMagnitude, 1e-4f);
            for (int y = y0; y <= y1; y++)
                for (int x = x0; x <= x1; x++)
                {
                    var q = new Vector2(x + 0.5f, y + 0.5f);
                    float t = Mathf.Clamp01(Vector2.Dot(q - p0, ab) / l2);
                    float d = Vector2.Distance(q, p0 + ab * t);
                    float hw = Mathf.Lerp(w0, w1, t) * 0.5f;
                    float cov = Mathf.Clamp01(hw - d + 0.5f);
                    if (cov <= 0) continue;
                    Blend(y * W + x, c, cov, h * Mathf.Clamp01(1 - d / Mathf.Max(hw, 0.5f)) + h * 0.3f);
                }
        }

        /// <summary>A leaf: pointed oval from the petiole at <paramref name="b"/> along <paramref name="dir"/>, with a vein.</summary>
        public void Leaf(Vector2 b, Vector2 dir, float length, float width, Color c, float h)
        {
            dir.Normalize();
            var side = new Vector2(-dir.y, dir.x);
            var tip = b + dir * length;
            int x0 = Mathf.Max(0, Mathf.FloorToInt(Mathf.Min(b.x, tip.x) - width)), x1 = Mathf.Min(W - 1, Mathf.CeilToInt(Mathf.Max(b.x, tip.x) + width));
            int y0 = Mathf.Max(0, Mathf.FloorToInt(Mathf.Min(b.y, tip.y) - width)), y1 = Mathf.Min(H - 1, Mathf.CeilToInt(Mathf.Max(b.y, tip.y) + width));
            for (int y = y0; y <= y1; y++)
                for (int x = x0; x <= x1; x++)
                {
                    var q = new Vector2(x + 0.5f, y + 0.5f) - b;
                    float s = Vector2.Dot(q, dir) / length, t = Vector2.Dot(q, side);
                    if (s < 0 || s > 1) continue;
                    float half = width * 0.5f * Mathf.Pow(Mathf.Sin(Mathf.PI * Mathf.Pow(s, 0.8f)), 0.75f) * (1 - 0.25f * s);
                    float cov = Mathf.Clamp01(half - Mathf.Abs(t) + 0.5f);
                    if (cov <= 0) continue;
                    float dome = 1 - Mathf.Abs(t) / Mathf.Max(half, 0.5f);
                    float vein = Mathf.Abs(t) < 0.7f ? 0.85f : 1f;
                    Blend(y * W + x, ProcTex.Mul(c, vein * (0.88f + 0.12f * dome)), cov, h * (0.5f + 0.5f * dome) * (Mathf.Abs(t) < 0.7f ? 0.7f : 1f));
                }
        }

        void Blend(int k, Color c, float cov, float h)
        {
            var o = Px[k];
            Px[k] = new Color(Mathf.Lerp(o.r, c.r, cov), Mathf.Lerp(o.g, c.g, cov), Mathf.Lerp(o.b, c.b, cov), Mathf.Max(o.a, cov));
            if (cov > 0.5f) Height[k] = Mathf.Max(Height[k] * (1 - cov), h);
        }
    }

    /// <summary>
    /// Foliage card atlases (512², transparent background). Every cell is drawn with the twig base at u = 0 (left
    /// edge, mid-height) and its tip at u = 1, which is how TreeBuilder lays the cards along branches.
    /// </summary>
    public static class FoliageAtlas
    {
        static float R(Random r, float a, float b) => a + (float)r.NextDouble() * (b - a);
        static Vector2 Rot(Vector2 v, float deg) { float a = deg * Mathf.Deg2Rad, c = Mathf.Cos(a), s = Mathf.Sin(a); return new Vector2(v.x * c - v.y * s, v.x * s + v.y * c); }
        static Color Jit(Random r, Color a, Color b) => Color.Lerp(a, b, (float)r.NextDouble());

        /// <summary>
        /// Norway spruce frond, two variants (512 × 256 each, stacked): a main twig with alternate side twigs angled
        /// forward, all densely set with short dark needles all round, lighter new growth at the tips, and a few
        /// hanging branchlets — the "comb" spruce look.
        /// </summary>
        public static void Spruce(Canvas c, Random r)
        {
            var dark = new Color(0.11f, 0.21f, 0.10f); var mid = new Color(0.19f, 0.31f, 0.13f); var tipC = new Color(0.34f, 0.47f, 0.18f);
            var twigC = new Color(0.30f, 0.20f, 0.12f);
            for (int cell = 0; cell < 2; cell++)
            {
                float oy = cell * 256 + 128;
                Vector2 P(float u, float curve) => new Vector2(4 + u * 500, oy + Mathf.Sin(u * 2.4f) * curve);
                float curveMain = R(r, -14, 14);
                // Twigs: (start, end) in pixels, drawn first in brown, then needles over them.
                var twigs = new System.Collections.Generic.List<(Vector2 a, Vector2 b, float w)>();
                twigs.Add((P(0, curveMain), P(1, curveMain), 4f));
                for (float u = 0.04f; u < 0.93f; u += R(r, 0.045f, 0.065f))
                    for (int s = -1; s <= 1; s += 2)
                    {
                        var a = P(u, curveMain);
                        float len = (122 * Mathf.Pow(1 - u, 0.5f) + 22) * R(r, 0.8f, 1.1f);
                        var dir = Rot(Vector2.right, s * R(r, 42, 62));
                        var b = a + dir * len;
                        b.y = Mathf.Clamp(b.y, oy - 124, oy + 124);
                        twigs.Add((a, b, 2.2f));
                        // Second-order twiglets on the long side twigs.
                        if (len > 70)
                            for (float v = 0.25f; v < 0.9f; v += 0.2f)
                            {
                                var a2 = Vector2.Lerp(a, b, v);
                                var b2 = a2 + Rot(dir, s * R(r, 35, 55)) * len * 0.3f;
                                b2.y = Mathf.Clamp(b2.y, oy - 124, oy + 124);
                                twigs.Add((a2, b2, 1.4f));
                            }
                    }
                foreach (var (a, b, w) in twigs) c.Stroke(a, b, w, w * 0.6f, twigC, 0.6f);
                foreach (var (a, b, w) in twigs)
                {
                    float len = Vector2.Distance(a, b);
                    var d = (b - a).normalized;
                    for (float t = 0; t < len; t += 1.7f)
                    {
                        float u = t / len;
                        var at = a + d * t;
                        for (int s = -1; s <= 1; s += 2)
                        {
                            float nl = R(r, 9, 14) * (w > 3 ? 1.2f : 1f) * Mathf.Lerp(1f, 0.75f, u);
                            var nd = Rot(d, s * R(r, 35, 75));
                            var col = u > 0.82f ? Jit(r, mid, tipC) : Jit(r, dark, mid);
                            c.Stroke(at, at + nd * nl, 2.0f, 0.9f, col, 1f);
                        }
                        if (r.NextDouble() < 0.5)   // needles toward the viewer: short, foreshortened
                        {
                            var nd = Rot(d, R(r, -20, 20));
                            c.Stroke(at, at + nd * R(r, 3, 5), 1.8f, 1.0f, Jit(r, dark, mid), 1f);
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Scots pine needle tufts, four variants (256² each): a short orange-brown twig forking into 2–4 shoots, each
        /// a bottle brush of long paired blue-green needles pointing forward and up.
        /// </summary>
        public static void Pine(Canvas c, Random r)
        {
            var a0 = new Color(0.20f, 0.31f, 0.18f); var a1 = new Color(0.36f, 0.45f, 0.26f);
            var twigC = new Color(0.55f, 0.33f, 0.18f);
            for (int cell = 0; cell < 4; cell++)
            {
                float ox = (cell & 1) * 256, oy = (cell >> 1) * 256 + 128;
                var b = new Vector2(ox + 3, oy);
                var fork = b + new Vector2(70, R(r, -10, 10));
                c.Stroke(b, fork, 5, 3.5f, twigC, 0.5f);
                int shoots = 2 + r.Next(3);
                for (int k = 0; k < shoots; k++)
                {
                    float ang = Mathf.Lerp(-38, 38, shoots == 1 ? 0.5f : k / (float)(shoots - 1)) + R(r, -8, 8);
                    var d = Rot(Vector2.right, ang);
                    float len = R(r, 95, 150);
                    var end = fork + d * len;
                    end.x = Mathf.Min(end.x, ox + 250); end.y = Mathf.Clamp(end.y, oy - 120, oy + 120);
                    c.Stroke(fork, end, 3.2f, 2f, twigC, 0.5f);
                    float sl = Vector2.Distance(fork, end);
                    for (float t = sl * 0.15f; t < sl; t += 2.0f)
                    {
                        var at = Vector2.Lerp(fork, end, t / sl);
                        float u = t / sl;
                        for (int s = -1; s <= 1; s += 2)
                        {
                            float nl = R(r, 26, 44) * Mathf.Lerp(1f, 0.7f, u);
                            var nd = Rot(d, s * R(r, 18, 55));
                            var tip = at + nd * nl;
                            tip.x = Mathf.Min(tip.x, ox + 254); tip.y = Mathf.Clamp(tip.y, oy - 126, oy + 126);
                            c.Stroke(at, tip, 1.6f, 0.7f, Jit(r, a0, a1), 1f);
                        }
                    }
                    // The bud at the tip: a light cone of new needles.
                    for (int k2 = 0; k2 < 10; k2++)
                    {
                        var nd = Rot(d, R(r, -30, 30));
                        var tip = end + nd * R(r, 10, 22);
                        tip.x = Mathf.Min(tip.x, ox + 254);
                        c.Stroke(end, tip, 1.5f, 0.6f, Jit(r, a1, new Color(0.38f, 0.46f, 0.25f)), 1f);
                    }
                }
            }
        }

        /// <summary>
        /// Birch twigs, two variants (512 × 256 each): a thin dark twig with side twiglets, set with small ovate
        /// light-green leaves on short petioles, hanging to both sides (the card hangs, so "down" is either side).
        /// </summary>
        public static void Birch(Canvas c, Random r)
        {
            var l0 = new Color(0.30f, 0.46f, 0.14f); var l1 = new Color(0.50f, 0.64f, 0.22f); var l2 = new Color(0.58f, 0.66f, 0.30f);
            var twigC = new Color(0.22f, 0.16f, 0.14f);
            for (int cell = 0; cell < 2; cell++)
            {
                float oy = cell * 256 + 128;
                float curve = R(r, -20, 20);
                Vector2 P(float u) => new Vector2(3 + u * 505, oy + Mathf.Sin(u * 3.0f) * curve);
                var twigs = new System.Collections.Generic.List<(Vector2 a, Vector2 b)>();
                for (int i = 0; i < 12; i++) twigs.Add((P(i / 12f), P((i + 1) / 12f)));
                for (float u = 0.08f; u < 0.92f; u += R(r, 0.08f, 0.13f))
                {
                    var a = P(u);
                    int s = r.NextDouble() < 0.5 ? -1 : 1;
                    var d = Rot(Vector2.right, s * R(r, 25, 60));
                    float len = R(r, 60, 120) * (1 - 0.5f * u);
                    var b = a + d * len; b.y = Mathf.Clamp(b.y, oy - 115, oy + 115);
                    twigs.Add((a, b));
                }
                foreach (var (a, b) in twigs) c.Stroke(a, b, 2.2f, 1.4f, twigC, 0.5f);
                foreach (var (a, b) in twigs)
                {
                    float len = Vector2.Distance(a, b);
                    var d = (b - a).normalized;
                    for (float t = R(r, 4, 10); t < len; t += R(r, 11, 17))
                    {
                        var at = a + d * t;
                        int s = r.NextDouble() < 0.5 ? -1 : 1;
                        var ld = Rot(d, s * R(r, 30, 110));
                        var pet = at + ld * R(r, 4, 7);
                        c.Stroke(at, pet, 1.2f, 1f, twigC, 0.4f);
                        float size = R(r, 18, 27);
                        var col = r.NextDouble() < 0.15 ? l2 : Color.Lerp(l0, l1, (float)r.NextDouble());
                        var tip = pet + ld * size;
                        if (tip.y < oy - 126 || tip.y > oy + 126 || tip.x > 509) continue;
                        c.Leaf(pet, ld, size, size * R(r, 0.6f, 0.75f), col, 1f);
                    }
                }
            }
        }
    }

    /// <summary>
    /// Bark textures, 512²: the left 256 × 512 half is the lower trunk, the right half the upper trunk (Rally/Tree
    /// blends them by the vertex alpha). Each half tiles on its own (periodic noise), u around the trunk, v up it.
    /// </summary>
    public static class BarkTextures
    {
        static float S(float a, float b, float x) => Mathf.SmoothStep(0, 1, Mathf.InverseLerp(a, b, x));

        public static Color[] Make(string species, out float[] height)
        {
            const int W = 512, H = 512;
            var px = new Color[W * H];
            height = new float[W * H];
            for (int y = 0; y < H; y++)
                for (int x = 0; x < W; x++)
                {
                    int half = x / 256;
                    float u = (x % 256 + 0.5f) / 256f, v = (y + 0.5f) / H;
                    float h;
                    Color c = species == "spruce" ? Spruce(half, u, v, out h) : species == "pine" ? Pine(half, u, v, out h) : Birch(half, u, v, out h);
                    c.a = 1;
                    px[y * W + x] = c;
                    height[y * W + x] = h;
                }
            return px;
        }

        /// <summary>Worley with separate u / v cell counts (plates longer than wide), periodic.</summary>
        static void Plates(float u, float v, int pu, int pv, int seed, out float f1, out float f2, out float id)
        {
            float x = u * pu, y = v * pv;
            int cx = Mathf.FloorToInt(x), cy = Mathf.FloorToInt(y);
            f1 = f2 = 9; id = 0;
            for (int j = -1; j <= 1; j++)
                for (int i = -1; i <= 1; i++)
                {
                    int gx = cx + i, gy = cy + j, wx = ((gx % pu) + pu) % pu, wy = ((gy % pv) + pv) % pv;
                    float px = gx + ProcTex.Hash01(wx, wy, seed), py = gy + ProcTex.Hash01(wx, wy, seed + 17);
                    float dx = px - x, dy = (py - y) * ((float)pu / pv) * 2f;   // cells are 2× taller than wide in texture space
                    float d = Mathf.Sqrt(dx * dx + dy * dy);
                    if (d < f1) { f2 = f1; f1 = d; id = ProcTex.Hash01(wx, wy, seed + 31); }
                    else if (d < f2) f2 = d;
                }
        }

        /// <summary>Norway spruce: grey-brown thin scaly plates below, finer reddish-brown scales higher up.</summary>
        static Color Spruce(int half, float u, float v, out float h)
        {
            int pu = half == 0 ? 10 : 16, pv = half == 0 ? 12 : 20;
            Plates(u, v, pu, pv, 101 + half, out float f1, out float f2, out float id);
            float edge = S(0f, 0.12f, f2 - f1);
            float grain = ProcTex.Fbm(u, v, 32, 64, 2, 103 + half) * 0.5f + 0.5f;
            var lo = half == 0 ? new Color(0.27f, 0.22f, 0.18f) : new Color(0.38f, 0.25f, 0.18f);
            var hi = half == 0 ? new Color(0.40f, 0.34f, 0.28f) : new Color(0.50f, 0.35f, 0.25f);
            var c = Color.Lerp(lo, hi, id * 0.6f + grain * 0.4f);
            c = ProcTex.Mul(c, Mathf.Lerp(0.45f, 1f, edge) * (0.9f + 0.2f * (1 - f1)));
            float lichen = S(0.62f, 0.8f, ProcTex.Fbm(u, v, 4, 8, 3, 105) * 0.5f + 0.5f) * (half == 0 ? 1 : 0.3f);
            c = Color.Lerp(c, new Color(0.45f, 0.50f, 0.38f), lichen * 0.6f);
            h = edge * (0.6f + 0.4f * (1 - f1)) + grain * 0.2f;
            return c;
        }

        /// <summary>Scots pine: thick grey-brown plates split by deep dark furrows below; thin orange-red papery flakes above.</summary>
        static Color Pine(int half, float u, float v, out float h)
        {
            if (half == 0)
            {
                float warp = ProcTex.Fbm(u, v, 4, 8, 2, 111) * 0.08f;
                Plates(u + warp, v, 5, 7, 112, out float f1, out float f2, out float id);
                float furrow = S(0f, 0.22f, f2 - f1);
                float grain = ProcTex.Fbm(u, v, 24, 96, 2, 113) * 0.5f + 0.5f;
                var plate = Color.Lerp(new Color(0.36f, 0.29f, 0.24f), new Color(0.50f, 0.43f, 0.36f), id * 0.6f + grain * 0.4f);
                if (id > 0.75f) plate = Color.Lerp(plate, new Color(0.58f, 0.36f, 0.24f), 0.5f);   // a reddish plate here and there
                var c = Color.Lerp(new Color(0.10f, 0.07f, 0.05f), plate, furrow);
                h = furrow * (0.7f + 0.3f * (1 - f1)) + grain * 0.15f;
                return c;
            }
            else
            {
                Plates(u, v, 9, 22, 115, out float f1, out float f2, out float id);
                float edge = S(0f, 0.08f, f2 - f1);
                float grain = ProcTex.Fbm(u, v, 32, 64, 2, 116) * 0.5f + 0.5f;
                var c = Color.Lerp(new Color(0.68f, 0.36f, 0.20f), new Color(0.86f, 0.55f, 0.32f), id * 0.5f + grain * 0.5f);
                c = Color.Lerp(new Color(0.42f, 0.22f, 0.13f), c, edge);
                float peel = S(0.65f, 0.8f, id) * (1 - f1);
                c = Color.Lerp(c, new Color(0.92f, 0.72f, 0.50f), peel * 0.5f);
                h = edge * 0.6f + grain * 0.3f + peel * 0.2f;
                return c;
            }
        }

        /// <summary>
        /// Birch: the base is black-grey, deeply fissured, with white bark left between the cracks; above, chalk-white
        /// bark with black horizontal lenticels, a few dark scars and tan peeling strips.
        /// </summary>
        static Color Birch(int half, float u, float v, out float h)
        {
            float grain = ProcTex.Fbm(u, v, 16, 64, 3, 121 + half) * 0.5f + 0.5f;
            if (half == 0)
            {
                Plates(u, v, 6, 10, 122, out float f1, out float f2, out float id);
                float crack = S(0f, 0.15f, f2 - f1);
                var block = Color.Lerp(new Color(0.16f, 0.15f, 0.14f), new Color(0.30f, 0.28f, 0.26f), id * 0.6f + grain * 0.4f);
                if (id > 0.82f) block = Color.Lerp(block, new Color(0.78f, 0.77f, 0.72f), 0.8f);   // remnant white bark
                var c = Color.Lerp(new Color(0.05f, 0.05f, 0.05f), block, crack);
                h = crack * 0.8f + grain * 0.2f;
                return c;
            }
            var white = Color.Lerp(new Color(0.80f, 0.79f, 0.75f), new Color(0.93f, 0.92f, 0.88f), grain);
            // Lenticels: short horizontal dark dashes, in rows, periodic in u and v.
            float rows = 46, row = v * rows, ri = Mathf.Floor(row), rf = row - ri;
            int rowId = (int)ri % (int)rows;
            float dashU = u * 7 + ProcTex.Hash01(rowId, 0, 123), di = Mathf.Floor(dashU), df = dashU - di;
            bool on = ProcTex.Hash01((int)di % 7, rowId, 124) < 0.35f;
            float dashLen = 0.25f + 0.6f * ProcTex.Hash01((int)di % 7, rowId, 125);
            float lent = on && df < dashLen && Mathf.Abs(rf - 0.5f) < 0.09f + 0.06f * ProcTex.Hash01((int)di % 7, rowId, 126) ? 1 : 0;
            var c2 = Color.Lerp(white, new Color(0.10f, 0.09f, 0.09f), lent * 0.9f);
            // Dark scars where branches were, and peeling tan strips.
            Plates(u, v, 3, 5, 127, out float g1, out _, out float gid);
            if (gid > 0.85f && g1 < 0.22f) c2 = Color.Lerp(c2, new Color(0.08f, 0.07f, 0.07f), S(0.22f, 0.12f, g1));
            float peel = S(0.6f, 0.75f, ProcTex.Fbm(u, v, 4, 16, 2, 128) * 0.5f + 0.5f);
            c2 = Color.Lerp(c2, new Color(0.78f, 0.62f, 0.46f), peel * 0.45f);
            h = 0.6f + grain * 0.2f - lent * 0.4f + peel * 0.1f;
            return c2;
        }
    }
}
