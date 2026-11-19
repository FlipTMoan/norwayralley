using System.Collections.Generic;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// A small vector painter for the sign faces. Every shape is a signed distance evaluated per pixel, so edges are
    /// anti-aliased exactly (coverage = ½ − d over one pixel) at any resolution: no supersampling, no texture blur. Drawing
    /// is in millimetres of the real plate, y down from its top-left corner, so the faces follow the regulation drawings'
    /// proportions; <see cref="PxPerMm"/> maps to pixels. A gutter of <see cref="Gutter"/> pixels runs round the plate and
    /// is painted too (it feeds the mip maps the plate's edge colour instead of a neighbour's).
    /// </summary>
    public sealed class SignCanvas
    {
        public readonly int Width, Height, Gutter;
        public readonly float PxPerMm, WidthMm, HeightMm;
        public readonly Color[] Pixels;   // row 0 = top, sRGB values, straight alpha

        public SignCanvas(float widthMm, float heightMm, float pxPerMm, int gutter = 4)
        {
            WidthMm = widthMm; HeightMm = heightMm; PxPerMm = pxPerMm; Gutter = gutter;
            Width = Mathf.Max(4, Mathf.CeilToInt(widthMm * pxPerMm)) + 2 * gutter;
            Height = Mathf.Max(4, Mathf.CeilToInt(heightMm * pxPerMm)) + 2 * gutter;
            Pixels = new Color[Width * Height];
        }

        /// <summary>Pixel centre (px, py) → plate millimetres.</summary>
        float2 Mm(int px, int py) => new float2((px + 0.5f - Gutter) / PxPerMm, (py + 0.5f - Gutter) / PxPerMm);

        delegate float Sdf(float2 p);

        /// <summary>
        /// Blend one shape: its distance (mm) per pixel in the box, coverage over one pixel. The box is walked in 32×32
        /// blocks split into 8×8 ones: the distance at a block's centre bounds every pixel in it (a distance changes by at
        /// most the distance moved), so blocks wholly outside are skipped and blocks wholly inside are filled without
        /// evaluating each pixel; only blocks on the edge are evaluated per pixel.
        /// </summary>
        void Shape(float minX, float minY, float maxX, float maxY, Color c, Sdf sdf)
        {
            float pad = 2f / PxPerMm;
            int x0 = Mathf.Max(0, Mathf.FloorToInt((minX - pad) * PxPerMm) + Gutter), x1 = Mathf.Min(Width - 1, Mathf.CeilToInt((maxX + pad) * PxPerMm) + Gutter);
            int y0 = Mathf.Max(0, Mathf.FloorToInt((minY - pad) * PxPerMm) + Gutter), y1 = Mathf.Min(Height - 1, Mathf.CeilToInt((maxY + pad) * PxPerMm) + Gutter);
            for (int by = y0; by <= y1; by += 32)
                for (int bx = x0; bx <= x1; bx += 32)
                    ShapeBlock(bx, by, Mathf.Min(bx + 31, x1), Mathf.Min(by + 31, y1), c, sdf);
        }

        void ShapeBlock(int bx, int by, int ex, int ey, Color c, Sdf sdf)
        {
            int size = Mathf.Max(ex - bx, ey - by) + 1;
            if (size > 2)
            {
                var centre = new float2(((bx + ex) * 0.5f + 0.5f - Gutter) / PxPerMm, ((by + ey) * 0.5f + 0.5f - Gutter) / PxPerMm);
                float dc = sdf(centre) * PxPerMm, reach = size * 0.7072f + 1f;
                if (dc > reach) return;
                if (dc < -reach) { FillBlock(bx, by, ex, ey, c); return; }
                if (size > 8)
                {
                    for (int y = by; y <= ey; y += 8)
                        for (int x = bx; x <= ex; x += 8)
                            ShapeBlock(x, y, Mathf.Min(x + 7, ex), Mathf.Min(y + 7, ey), c, sdf);
                    return;
                }
            }
            for (int py = by; py <= ey; py++)
                for (int px = bx; px <= ex; px++)
                    Blend(py * Width + px, math.saturate(0.5f - sdf(Mm(px, py)) * PxPerMm) * c.a, c);
        }

        void FillBlock(int bx, int by, int ex, int ey, Color c)
        {
            for (int py = by; py <= ey; py++)
                for (int px = bx; px <= ex; px++)
                    Blend(py * Width + px, c.a, c);
        }

        void Blend(int k, float cov, Color c)
        {
            if (cov <= 0f) return;
            if (cov >= 1f) { Pixels[k] = c; return; }
            var dst = Pixels[k];
            float a = cov + dst.a * (1 - cov);
            Pixels[k] = a <= 0 ? default : new Color((c.r * cov + dst.r * dst.a * (1 - cov)) / a, (c.g * cov + dst.g * dst.a * (1 - cov)) / a, (c.b * cov + dst.b * dst.a * (1 - cov)) / a, a);
        }

        /// <summary>The whole canvas, gutter included.</summary>
        public void Fill(Color c) { for (int i = 0; i < Pixels.Length; i++) Pixels[i] = c; }

        public void Circle(float cx, float cy, float r, Color c)
            => Shape(cx - r, cy - r, cx + r, cy + r, c, p => math.length(p - new float2(cx, cy)) - r);

        /// <summary>A ring of width w whose outer edge has radius r.</summary>
        public void Ring(float cx, float cy, float r, float w, Color c)
            => Shape(cx - r, cy - r, cx + r, cy + r, c, p => math.abs(math.length(p - new float2(cx, cy)) - (r - w / 2)) - w / 2);

        public void Rect(float x, float y, float w, float h, float radius, Color c)
        {
            float2 centre = new float2(x + w / 2, y + h / 2), half = new float2(w / 2, h / 2);
            Shape(x, y, x + w, y + h, c, p =>
            {
                float2 q = math.abs(p - centre) - half + radius;
                return math.length(math.max(q, 0)) + math.min(math.max(q.x, q.y), 0) - radius;
            });
        }

        /// <summary>A filled polygon (any winding, even-odd), corners rounded by <paramref name="radius"/> (the outline is offset in, then out).</summary>
        public void Polygon(IReadOnlyList<float2> pts, Color c, float radius = 0f)
        {
            float minX = float.MaxValue, minY = float.MaxValue, maxX = float.MinValue, maxY = float.MinValue;
            foreach (var p in pts) { minX = math.min(minX, p.x); minY = math.min(minY, p.y); maxX = math.max(maxX, p.x); maxY = math.max(maxY, p.y); }
            var poly = (radius > 0 ? Inset(pts, radius) : new List<float2>(pts)).ToArray();
            Shape(minX, minY, maxX, maxY, c, p => PolygonDistance(poly, p) - radius);
        }

        /// <summary>A stroked polyline of width w with round joins and caps (one coverage pass: joins are not blended twice).</summary>
        public void Stroke(IReadOnlyList<float2> pts, float w, Color c, bool closed = false)
        {
            float minX = float.MaxValue, minY = float.MaxValue, maxX = float.MinValue, maxY = float.MinValue;
            foreach (var p in pts) { minX = math.min(minX, p.x); minY = math.min(minY, p.y); maxX = math.max(maxX, p.x); maxY = math.max(maxY, p.y); }
            float h = w / 2;
            var arr = new float2[pts.Count]; for (int i = 0; i < arr.Length; i++) arr[i] = pts[i];
            int n = arr.Length, segs = closed ? n : n - 1;
            Shape(minX - h, minY - h, maxX + h, maxY + h, c, p =>
            {
                float best = float.MaxValue;
                for (int i = 0; i < segs; i++) best = math.min(best, SegmentDistance(p, arr[i], arr[(i + 1) % n]));
                return best - h;
            });
        }

        public void Line(float x0, float y0, float x1, float y1, float w, Color c) => Stroke(new[] { new float2(x0, y0), new float2(x1, y1) }, w, c);

        /// <summary>Polyline points along an arc (angles in radians, y down: positive angles turn clockwise on the plate).</summary>
        public static List<float2> Arc(float cx, float cy, float r, float a0, float a1, int steps = 24)
        {
            var l = new List<float2>(steps + 1);
            for (int i = 0; i <= steps; i++) { float a = math.lerp(a0, a1, i / (float)steps); l.Add(new float2(cx + math.cos(a) * r, cy + math.sin(a) * r)); }
            return l;
        }

        /// <summary>An arrow: a stroked shaft along the points and a filled head at the last point.</summary>
        public void Arrow(IReadOnlyList<float2> pts, float w, float head, Color c)
        {
            var b = pts[pts.Count - 1];
            // the head points along the last head-length of the line (a curved arrow keeps its curve under the head)
            float2 a = pts[0]; float back = 0;
            var shaft = new List<float2>(pts);
            shaft.RemoveAt(shaft.Count - 1);
            for (int i = pts.Count - 2; i >= 0; i--)
            {
                back += math.length(pts[i + 1] - pts[i]);
                a = pts[i];
                if (back >= head) break;
                if (shaft.Count > 1) shaft.RemoveAt(shaft.Count - 1);
            }
            var d = math.normalize(b - a); var n = new float2(-d.y, d.x);
            shaft.Add(b - d * head * 0.8f);
            Stroke(shaft, w, c);
            Polygon(new[] { b, b - d * head + n * head * 0.62f, b - d * head - n * head * 0.62f }, c, w * 0.06f);
        }

        /// <summary>
        /// Text with its cap height <paramref name="capMm"/>, centred on (cx, baseline − cap/2) or left-aligned at x when
        /// <paramref name="centre"/> is false; squeezed horizontally to <paramref name="maxWidthMm"/>. Returns the drawn width.
        /// </summary>
        public float Text(string s, float x, float cy, float capMm, Color c, bool centre = true, float maxWidthMm = float.MaxValue)
        {
            var font = SignFont.Shared;
            if (font == null || string.IsNullOrEmpty(s)) return 0;
            float scale = capMm / font.CapHeight;              // mm per font unit
            float width = font.Measure(s) * scale, squeeze = width > maxWidthMm ? maxWidthMm / width : 1f;
            width *= squeeze;
            float pen = centre ? x - width / 2 : x, baseline = cy + capMm / 2;
            foreach (var ch in s)
            {
                if (!font.TryGlyph(ch, out var g)) { if (ch == ' ') pen += SignFont.PointSize * 0.3f * scale * squeeze; continue; }
                var m = g.metrics; var r = g.glyphRect;
                if (r.width > 0 && r.height > 0)
                {
                    var tex = font.AtlasOf(g);
                    var data = tex.GetPixelData<byte>(0);
                    int tw = tex.width, th = tex.height;
                    float gx = pen + m.horizontalBearingX * scale * squeeze, gTop = baseline - m.horizontalBearingY * scale;
                    float pad = SignFont.Padding * scale;
                    float penX = pen, sx = scale * squeeze, sy = scale;
                    var bx = m.horizontalBearingX; var by = m.horizontalBearingY;
                    Shape(gx - pad, gTop - pad, gx + r.width * sx + pad, gTop + r.height * sy + pad, c, p =>
                    {
                        // plate mm → font units relative to the glyph's bitmap corner (atlas rows run bottom-up)
                        float u = (p.x - penX) / sx - bx, v = by - (baseline - p.y) / sy;
                        float ax = r.x + u, ay = r.y + r.height - v;
                        float dpx = SignFont.Distance(data, tw, th, ax, ay);
                        return dpx * math.min(sx, sy);   // atlas pixels are font units: back to mm
                    });
                }
                pen += m.horizontalAdvance * scale * squeeze;
            }
            return width;
        }

        public static float TextWidth(string s, float capMm)
        {
            var font = SignFont.Shared;
            return font == null || string.IsNullOrEmpty(s) ? 0 : font.Measure(s) * capMm / font.CapHeight;
        }

        // ---- distance helpers ---------------------------------------------------------------------------

        static float SegmentDistance(float2 p, float2 a, float2 b)
        {
            float2 ab = b - a;
            float t = math.saturate(math.dot(p - a, ab) / math.max(1e-9f, math.dot(ab, ab)));
            return math.length(p - (a + ab * t));
        }

        public static float PolygonDistance(IReadOnlyList<float2> poly, float2 p) => PolygonDistance(poly is float2[] a ? a : new List<float2>(poly).ToArray(), p);

        public static float PolygonDistance(float2[] poly, float2 p)
        {
            float d = float.MaxValue; bool inside = false;
            for (int i = 0, j = poly.Length - 1; i < poly.Length; j = i++)
            {
                float2 a = poly[j], b = poly[i];
                d = math.min(d, SegmentDistance(p, a, b));
                if ((b.y > p.y) != (a.y > p.y) && p.x < (a.x - b.x) * (p.y - b.y) / (a.y - b.y) + b.x) inside = !inside;
            }
            return inside ? -d : d;
        }

        /// <summary>A convex polygon moved in by r along each edge normal (for rounded corners).</summary>
        public static List<float2> Inset(IReadOnlyList<float2> pts, float r)
        {
            int n = pts.Count;
            float area = 0;
            for (int i = 0; i < n; i++) { var a = pts[i]; var b = pts[(i + 1) % n]; area += a.x * b.y - b.x * a.y; }
            float s = area > 0 ? 1 : -1;
            var lines = new List<(float2 p, float2 d)>(n);
            for (int i = 0; i < n; i++)
            {
                var a = pts[i]; var b = pts[(i + 1) % n];
                var d = math.normalize(b - a); var nrm = new float2(-d.y, d.x) * s;   // inward normal
                lines.Add((a + nrm * r, d));
            }
            var o = new List<float2>(n);
            for (int i = 0; i < n; i++)
            {
                var (p1, d1) = lines[(i + n - 1) % n]; var (p2, d2) = lines[i];
                float den = d1.x * d2.y - d1.y * d2.x;
                if (math.abs(den) < 1e-6f) { o.Add(p2); continue; }
                float t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / den;
                o.Add(p1 + d1 * t);
            }
            return o;
        }
    }
}
