using System;
using System.Collections.Generic;
using System.Globalization;
using Rally.Geo;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    public enum PlateShape : byte { Rect, Disc, TriangleUp, TriangleDown, Octagon, Diamond, ArrowRight, ArrowLeft }

    /// <summary>What one plate looks like: its outline (the mesh is cut to it), real size and how to paint its face.</summary>
    public sealed class SignDesign
    {
        /// <summary>Identical faces share one atlas cell: the sign code plus whatever text / speed is on it.</summary>
        public string Key;
        public PlateShape Shape;
        public float WidthMm, HeightMm, CornerMm;
        /// <summary>Underskilt (8xx): hangs directly under the sign above it.</summary>
        public bool Supplementary;
        public Action<SignCanvas> Paint;

        /// <summary>The plate outline in millimetres, y down from the top-left of its box, counter-clockwise on the face.</summary>
        public List<float2> Outline()
        {
            float w = WidthMm, h = HeightMm;
            var o = new List<float2>();
            switch (Shape)
            {
                case PlateShape.Disc:
                    for (int i = 0; i < 48; i++) { float a = -i * math.PI * 2 / 48; o.Add(new float2(w / 2 + math.cos(a) * w / 2, h / 2 + math.sin(a) * h / 2)); }
                    return o;
                case PlateShape.TriangleUp: return Rounded(new[] { new float2(w / 2, 0), new float2(0, h), new float2(w, h) }, CornerMm);
                case PlateShape.TriangleDown: return Rounded(new[] { new float2(0, 0), new float2(w / 2, h), new float2(w, 0) }, CornerMm);
                case PlateShape.Diamond: return Rounded(new[] { new float2(w / 2, 0), new float2(0, h / 2), new float2(w / 2, h), new float2(w, h / 2) }, CornerMm);
                case PlateShape.Octagon:
                    for (int i = 0; i < 8; i++) { float a = -(math.PI / 8 + i * math.PI / 4); o.Add(new float2(w / 2 + math.cos(a) * w / 2 / math.cos(math.PI / 8), h / 2 + math.sin(a) * h / 2 / math.cos(math.PI / 8))); }
                    return o;
                case PlateShape.ArrowRight:
                case PlateShape.ArrowLeft:
                {
                    float tip = h * 0.42f;
                    var pts = new[] { new float2(0, 0), new float2(0, h), new float2(w - tip, h), new float2(w, h / 2), new float2(w - tip, 0) };
                    if (Shape == PlateShape.ArrowLeft) for (int i = 0; i < pts.Length; i++) pts[i].x = w - pts[i].x;
                    if (Shape == PlateShape.ArrowLeft) Array.Reverse(pts);
                    return Rounded(pts, CornerMm);
                }
                default: return Rounded(new[] { new float2(0, 0), new float2(0, h), new float2(w, h), new float2(w, 0) }, CornerMm);
            }
        }

        /// <summary>Corners replaced by arcs of radius r (convex outlines).</summary>
        static List<float2> Rounded(IReadOnlyList<float2> pts, float r)
        {
            var o = new List<float2>();
            if (r <= 0) { o.AddRange(pts); return o; }
            int n = pts.Count;
            for (int i = 0; i < n; i++)
            {
                float2 p = pts[i], a = math.normalize(pts[(i + n - 1) % n] - p), b = math.normalize(pts[(i + 1) % n] - p);
                float half = math.acos(math.clamp(math.dot(a, b), -1, 1)) / 2;
                float t = r / math.tan(half);
                float2 centre = p + math.normalize(a + b) * (r / math.sin(half));
                float2 s = p + a * t, e = p + b * t;
                float a0 = math.atan2(s.y - centre.y, s.x - centre.x), a1 = math.atan2(e.y - centre.y, e.x - centre.x);
                float da = a1 - a0;
                while (da > math.PI) da -= 2 * math.PI;
                while (da < -math.PI) da += 2 * math.PI;
                for (int k = 0; k <= 5; k++) { float an = a0 + da * k / 5; o.Add(centre + new float2(math.cos(an), math.sin(an)) * r); }
            }
            return o;
        }
    }

    /// <summary>
    /// Norwegian sign designs (skiltnormalen, håndbok N300) for the NVDB sign codes the game draws: speed limits and their
    /// ends and zones, warning triangles (white with a red border, black pictograms), yield / stop / priority road,
    /// prohibitions, mandatory blue discs, blue information squares, yellow direction signs with road-number shields,
    /// place and street names, supplementary plates and obstacle markers. Sizes are the "middels" plates (Liten ⅔, Stor
    /// 4⁄3). Codes without a design return null: such a plate is not drawn rather than drawn wrongly.
    /// </summary>
    public static class SignCatalog
    {
        public static readonly Color Red = Hex(0xC8102E), Blue = Hex(0x0A4F9E), White = Hex(0xF6F6F2), Black = Hex(0x161616),
            Yellow = Hex(0xF7C600), Green = Hex(0x00703C), Grey = Hex(0x8C8C8A), Orange = Hex(0xE87722);

        static Color Hex(int rgb) => new Color(((rgb >> 16) & 255) / 255f, ((rgb >> 8) & 255) / 255f, (rgb & 255) / 255f, 1f);

        /// <summary>Text heights (cap height, mm) of the lettering on text plates.</summary>
        public const float DirectionCap = 100f, NameCap = 120f, PlateCap = 70f;

        static float SizeFactor(SignSize s) => s == SignSize.Small ? 2f / 3f : s == SignSize.Large ? 4f / 3f : 1f;

        /// <summary>
        /// The design for a plate, or null when the code has none. <paramref name="zoneKmh"/> is the NVDB speed limit at the
        /// plate (366 / 368 zone signs carry no number of their own); 0 when unknown.
        /// </summary>
        public static SignDesign For(SignPlate p, int zoneKmh = 0)
        {
            var code = p.Code ?? p.Number;
            if (string.IsNullOrEmpty(code)) return null;
            float k = SizeFactor(p.Size);
            string family = code.Split('.')[0];
            string sub = code.Length > family.Length + 1 ? code.Substring(family.Length + 1) : "";
            if (!int.TryParse(family.TrimEnd('V', 'H', 'E', 'M'), NumberStyles.Integer, CultureInfo.InvariantCulture, out int n)) return null;
            string side = family.Length > 0 && !char.IsDigit(family[family.Length - 1]) ? family.Substring(3) : "";
            string text = Clean(p.Text);
            switch (n)
            {
                case 362:
                {
                    int kmh = p.SpeedKmh;
                    if (kmh <= 0) return null;
                    float d = 700 * k;
                    return Disc($"362.{kmh}", d, c => SpeedLimit(c, kmh));
                }
                case 364:
                {
                    if (!int.TryParse(sub, out int kmh)) return null;
                    return Disc($"364.{kmh}", 700 * k, c => EndSpeedLimit(c, kmh));
                }
                case 366: case 368:
                {
                    int kmh = zoneKmh > 0 ? zoneKmh : 30;
                    bool end = n == 368;
                    return new SignDesign { Key = $"{n}.{kmh}", Shape = PlateShape.Rect, WidthMm = 600 * k, HeightMm = 840 * k, CornerMm = 30 * k, Paint = c => Zone(c, kmh, end) };
                }
                case 202: return new SignDesign { Key = "202", Shape = PlateShape.TriangleDown, WidthMm = 900 * k, HeightMm = 900 * k * 0.866f, CornerMm = 40 * k, Paint = Yield };
                case 204: return new SignDesign { Key = "204", Shape = PlateShape.Octagon, WidthMm = 800 * k, HeightMm = 800 * k, Paint = Stop };
                case 206: case 208:
                    return new SignDesign { Key = n.ToString(), Shape = PlateShape.Diamond, WidthMm = 700 * k, HeightMm = 700 * k, CornerMm = 20 * k, Paint = c => Priority(c, n == 208) };
                case 302: return Disc("302", 600 * k, NoEntry);
                case 306:
                    return sub == "1" || sub == "5" || sub == "" ? Disc($"306.{sub}", 600 * k, c => Prohibited(c, sub == "5")) : null;
                case 312: case 314: case 316: case 318: case 320:
                {
                    string t = text ?? (n == 312 ? "2,5 m" : n == 314 ? "3,5 m" : n == 316 ? "12 m" : n == 318 ? "12 t" : "8 t");
                    return Disc($"{n}|{t}", 600 * k, c => Limit(c, t, n == 314));
                }
                case 334: return Disc("334", 600 * k, NoOvertaking);
                case 370: case 372: return Disc(n.ToString(), 600 * k, c => NoStopping(c, n == 370));
                case 404: return sub == "1" || sub == "2" ? Disc($"404.{sub}", 600 * k, c => KeepSide(c, sub == "2")) : null;
                case 406: return Disc("406", 600 * k, Roundabout);
                case 512: return Square("512", 600 * k, BusStop);
                case 516: return Square("516", 600 * k, Crossing);
                case 518: return Disc("518", 600 * k, c => Footpath(c, false, true));
                case 520: return Disc("520", 600 * k, c => Footpath(c, true, false));
                case 522: return Disc("522", 600 * k, c => Footpath(c, true, true));
                case 526:
                    if (sub == "1") return new SignDesign { Key = "526.1", Shape = PlateShape.Rect, WidthMm = 900 * k, HeightMm = 300 * k, CornerMm = 20 * k, Paint = OneWayAcross };
                    return Square("526.2", 600 * k, OneWayAlong);
                case 713:
                {
                    var lines = SignText.Parse(p.Text);
                    if (lines.Count == 0) return null;
                    bool left = sub.StartsWith("V");
                    return DirectionSign(code + "|" + p.Text, lines, left);
                }
                case 723: return RouteShield(code, p.Label, p.Text);
                case 727: return text == null ? null : NamePlate($"727|{text}", text, Yellow, Black, NameCap);
                case 729: return text == null ? null : NamePlate($"729|{text}", text, White, Black, PlateCap * 1.3f);
                case 802: case 806: case 808:
                {
                    string t = text ?? (n == 808 ? LabelText(p.Label) : null);
                    if (string.IsNullOrEmpty(t)) return null;
                    var d = NamePlate($"{n}|{t}", t, White, Black, PlateCap);
                    d.Supplementary = true;
                    return d;
                }
                case 902: case 904:
                {
                    bool left = side.StartsWith("V");
                    float w = (n == 902 ? 500 : 400) * k, h = (n == 902 ? 700 : 400) * k;
                    return new SignDesign { Key = $"{n}{(left ? "V" : "H")}", Shape = PlateShape.Rect, WidthMm = w, HeightMm = h, CornerMm = 15 * k, Paint = c => Chevron(c, left, n == 902) };
                }
                case 906:
                {
                    bool left = side.StartsWith("V") && !side.Contains("H"), both = side.Contains("V") && side.Contains("H");
                    string v = both ? "VH" : left ? "V" : "H";
                    return new SignDesign { Key = "906" + v, Shape = PlateShape.Rect, WidthMm = 300 * k, HeightMm = 1000 * k, CornerMm = 10 * k, Paint = c => ObstacleMarker(c, v) };
                }
                case 210: return Warning("210", k, c => WarningSymbol(c, 210, sub));
            }
            if (n >= 100 && n < 200) return Warning($"{n}.{sub}", k, c => WarningSymbol(c, n, sub));
            return null;
        }

        static string Clean(string t)
        {
            if (string.IsNullOrWhiteSpace(t)) return null;
            t = t.Trim();
            return t == "." || t == "N/A" ? null : t;
        }

        /// <summary>"Gjelder ikke buss/Gjeld ikkje buss" → "Gjelder ikke buss"; "Ferist" → "Ferist"; parenthesised placeholders dropped.</summary>
        static string LabelText(string label)
        {
            if (string.IsNullOrEmpty(label)) return null;
            var t = label.Split('/')[0].Trim();
            return t.Contains("(") ? null : t;
        }

        static SignDesign Disc(string key, float d, Action<SignCanvas> paint)
            => new SignDesign { Key = key, Shape = PlateShape.Disc, WidthMm = d, HeightMm = d, Paint = paint };

        static SignDesign Square(string key, float s, Action<SignCanvas> paint)
            => new SignDesign { Key = key, Shape = PlateShape.Rect, WidthMm = s, HeightMm = s, CornerMm = s * 0.05f, Paint = paint };

        static SignDesign Warning(string key, float k, Action<SignCanvas> paint)
            => new SignDesign { Key = key, Shape = PlateShape.TriangleUp, WidthMm = 900 * k, HeightMm = 900 * k * 0.866f, CornerMm = 40 * k, Paint = paint };

        // ---- symbols drawn in the JS game's 256-pixel sign frame (legacy-js/src/signs.js) ------------------------

        /// <summary>Maps the 256-px canvas of signs.js onto a plate: x' = ox + x·s, y' = oy + y·s.</summary>
        readonly struct Frame
        {
            readonly SignCanvas c; readonly float s, ox, oy; readonly bool mirror; readonly float w;
            public Frame(SignCanvas c, float s, float ox, float oy, bool mirror = false) { this.c = c; this.s = s; this.ox = ox; this.oy = oy; this.mirror = mirror; w = c.WidthMm; }
            public float2 P(float x, float y) => new float2(mirror ? w - (ox + x * s) : ox + x * s, oy + y * s);
            public float L(float v) => v * s;
            List<float2> Pts(float[] xy) { var l = new List<float2>(xy.Length / 2); for (int i = 0; i + 1 < xy.Length; i += 2) l.Add(P(xy[i], xy[i + 1])); return l; }
            public void Stroke(float width, Color col, params float[] xy) => c.Stroke(Pts(xy), L(width), col);
            public void Poly(Color col, params float[] xy) => c.Polygon(Pts(xy), col);
            public void PolyR(Color col, float r, params float[] xy) => c.Polygon(Pts(xy), col, L(r));
            public void Arrow(float width, Color col, params float[] xy) => c.Arrow(Pts(xy), L(width), L(width) * 2.1f, col);
            public void Disc(float x, float y, float r, Color col) { var p = P(x, y); c.Circle(p.x, p.y, L(r), col); }
            public void Ring(float x, float y, float r, float width, Color col) { var p = P(x, y); c.Ring(p.x, p.y, L(r + width / 2), L(width), col); }
            public void Rect(float x, float y, float rw, float rh, float r, Color col)
            {
                var a = P(x, y); var b = P(x + rw, y + rh);
                c.Rect(math.min(a.x, b.x), math.min(a.y, b.y), math.abs(b.x - a.x), math.abs(b.y - a.y), L(r), col);
            }
            public void Text(string t, float x, float y, float cap, Color col, float maxW = 1e9f) { var p = P(x, y); c.Text(t, p.x, p.y, L(cap), col, true, L(maxW)); }
        }

        /// <summary>Warning-triangle frame: the JS pictogram box (≈ 80…180 × 96…206 px) centred in the white field.</summary>
        static Frame TriangleFrame(SignCanvas c, bool mirror = false)
        {
            float s = c.WidthMm / 232f * 0.86f;
            return new Frame(c, s, c.WidthMm / 2 - 128 * s, c.HeightMm * 0.64f - 158 * s, mirror);
        }

        /// <summary>Disc frame: the JS disc (centre 128, radius 120) on the plate.</summary>
        static Frame DiscFrame(SignCanvas c) { float s = c.WidthMm / 240f; return new Frame(c, s, c.WidthMm / 2 - 128 * s, c.HeightMm / 2 - 128 * s); }

        // ---- families ------------------------------------------------------------------------------------------

        static void RedDisc(SignCanvas c, Color inner, float ring = 0.1f)
        {
            float r = c.WidthMm / 2;
            c.Fill(Red);
            c.Circle(r, r, r * (1 - ring * 2), inner);
        }

        static void SpeedLimit(SignCanvas c, int kmh)
        {
            float d = c.WidthMm, r = d / 2;
            RedDisc(c, White, 0.105f);
            string t = kmh.ToString(CultureInfo.InvariantCulture);
            c.Text(t, r, r, d * (t.Length > 2 ? 0.34f : 0.42f), Black, true, d * 0.64f);
        }

        static void EndSpeedLimit(SignCanvas c, int kmh)
        {
            float d = c.WidthMm, r = d / 2;
            c.Fill(Black);
            c.Circle(r, r, r - d * 0.012f, White);
            string t = kmh.ToString(CultureInfo.InvariantCulture);
            c.Text(t, r, r, d * (t.Length > 2 ? 0.34f : 0.42f), Grey, true, d * 0.64f);
            for (int i = -2; i <= 2; i++)
            {
                float o = i * d * 0.075f;
                c.Line(r - d * 0.36f + o, r + d * 0.36f + o, r + d * 0.36f + o, r - d * 0.36f + o, d * 0.014f, Black);
            }
        }

        static void Zone(SignCanvas c, int kmh, bool end)
        {
            float w = c.WidthMm, h = c.HeightMm;
            c.Fill(Black);
            c.Rect(w * 0.025f, w * 0.025f, w * 0.95f, h - w * 0.05f, w * 0.04f, White);
            float r = w * 0.36f, cx = w / 2, cy = w * 0.47f;
            var ink = end ? Grey : Black;
            c.Circle(cx, cy, r, end ? Grey : Red);
            c.Circle(cx, cy, r * 0.79f, White);
            string t = kmh.ToString(CultureInfo.InvariantCulture);
            c.Text(t, cx, cy, r * (t.Length > 2 ? 0.66f : 0.82f), ink, true, r * 1.3f);
            c.Text("SONE", cx, h * 0.8f, w * 0.15f, ink, true, w * 0.8f);
            if (end) for (int i = -3; i <= 3; i++) { float o = i * w * 0.11f; c.Line(w * 0.08f + o, h * 0.92f, w * 0.92f + o, h * 0.08f, w * 0.016f, Black); }
        }

        static void Yield(SignCanvas c)
        {
            float w = c.WidthMm, h = c.HeightMm;
            c.Fill(Red);
            var outer = new[] { new float2(0, 0), new float2(w / 2, h), new float2(w, 0) };
            c.Polygon(SignCanvas.Inset(outer, w * 0.14f), White, w * 0.02f);
        }

        static void Stop(SignCanvas c)
        {
            float d = c.WidthMm, r = d / 2;
            var o = new List<float2>();
            for (int i = 0; i < 8; i++) { float a = math.PI / 8 + i * math.PI / 4; o.Add(new float2(r + math.cos(a) * r / math.cos(math.PI / 8), r + math.sin(a) * r / math.cos(math.PI / 8))); }
            c.Fill(White);
            c.Polygon(SignCanvas.Inset(o, d * 0.03f), Red);
            c.Text("STOPP", r, r, d * 0.2f, White, true, d * 0.78f);
        }

        static void Priority(SignCanvas c, bool end)
        {
            float d = c.WidthMm, r = d / 2;
            c.Fill(Hex(0x3A3A3A));
            var dia = new[] { new float2(r, 0), new float2(0, r), new float2(r, d), new float2(d, r) };
            c.Polygon(SignCanvas.Inset(dia, d * 0.008f), White, d * 0.02f);
            c.Polygon(SignCanvas.Inset(dia, d * 0.13f), Yellow, d * 0.01f);
            if (end) for (int i = -2; i <= 2; i++) { float o = i * d * 0.07f; c.Line(d * 0.2f + o, d * 0.8f + o, d * 0.8f + o, d * 0.2f + o, d * 0.016f, Black); }
        }

        static void NoEntry(SignCanvas c)
        {
            float d = c.WidthMm, r = d / 2;
            c.Fill(Red);
            c.Rect(r - d * 0.36f, r - d * 0.085f, d * 0.72f, d * 0.17f, d * 0.01f, White);
        }

        static void Prohibited(SignCanvas c, bool truck)
        {
            RedDisc(c, White);
            var f = DiscFrame(c);
            Vehicle(f, 128, 172, truck, Black);
        }

        static void Limit(SignCanvas c, string text, bool height)
        {
            float d = c.WidthMm, r = d / 2;
            RedDisc(c, White);
            c.Text(text, r, r, d * 0.2f, Black, true, d * 0.62f);
            if (height)
            {
                c.Polygon(new[] { new float2(r - d * 0.08f, d * 0.22f), new float2(r + d * 0.08f, d * 0.22f), new float2(r, d * 0.3f) }, Black);
                c.Polygon(new[] { new float2(r - d * 0.08f, d * 0.78f), new float2(r + d * 0.08f, d * 0.78f), new float2(r, d * 0.7f) }, Black);
            }
        }

        static void NoOvertaking(SignCanvas c)
        {
            RedDisc(c, White);
            var f = DiscFrame(c);
            CarFront(f, 94, Red);
            CarFront(f, 162, Black);
        }

        static void NoStopping(SignCanvas c, bool cross)
        {
            float d = c.WidthMm, r = d / 2;
            c.Fill(Red);
            c.Circle(r, r, r * 0.8f, Blue);
            float a = r * 0.8f * 0.7071f;
            c.Line(r - a, r - a, r + a, r + a, d * 0.1f, Red);
            if (cross) c.Line(r + a, r - a, r - a, r + a, d * 0.1f, Red);
        }

        static void KeepSide(SignCanvas c, bool left)
        {
            float d = c.WidthMm, r = d / 2;
            c.Fill(Blue);
            float s = left ? -1 : 1;
            c.Arrow(new[] { new float2(r - s * d * 0.2f, r - d * 0.2f), new float2(r + s * d * 0.2f, r + d * 0.2f) }, d * 0.1f, d * 0.24f, White);
        }

        static void Roundabout(SignCanvas c)
        {
            float d = c.WidthMm, r = d / 2;
            c.Fill(Blue);
            for (int k = 0; k < 3; k++)
            {
                // counter-clockwise (right-hand traffic): on the plate (y down) that is decreasing angle
                float a0 = -k * 2 * math.PI / 3 - 0.25f, a1 = a0 - 1.45f;
                var arc = SignCanvas.Arc(r, r, d * 0.25f, a0, a1, 16);
                c.Arrow(arc, d * 0.07f, d * 0.15f, White);
            }
        }

        static void BlueField(SignCanvas c)
        {
            float s = c.WidthMm;
            c.Fill(White);
            c.Rect(s * 0.012f, s * 0.012f, s * 0.976f, c.HeightMm - s * 0.024f, s * 0.045f, Blue);
        }

        static void BusStop(SignCanvas c)
        {
            float s = c.WidthMm;
            BlueField(c);
            c.Rect(s * 0.14f, s * 0.14f, s * 0.72f, s * 0.72f, s * 0.03f, White);
            // a bus seen from the side, facing left
            c.Rect(s * 0.2f, s * 0.33f, s * 0.6f, s * 0.3f, s * 0.04f, Black);
            for (int i = 0; i < 4; i++) c.Rect(s * (0.24f + i * 0.135f), s * 0.37f, s * 0.1f, s * 0.1f, s * 0.01f, White);
            c.Circle(s * 0.32f, s * 0.64f, s * 0.055f, Black); c.Circle(s * 0.68f, s * 0.64f, s * 0.055f, Black);
            c.Circle(s * 0.32f, s * 0.64f, s * 0.022f, White); c.Circle(s * 0.68f, s * 0.64f, s * 0.022f, White);
        }

        static void Crossing(SignCanvas c)
        {
            float s = c.WidthMm;
            BlueField(c);
            c.Polygon(new[] { new float2(s / 2, s * 0.1f), new float2(s * 0.09f, s * 0.86f), new float2(s * 0.91f, s * 0.86f) }, White, s * 0.02f);
            for (int i = 0; i < 4; i++) c.Rect(s * (0.26f + i * 0.13f), s * 0.76f, s * 0.08f, s * 0.05f, 0, Black);
            var f = new Frame(c, s / 256f * 0.95f, s / 2 - 128 * s / 256f * 0.95f, s * 0.02f);
            Figure(f, 132, 112, 1.0f, true);
        }

        static void Footpath(SignCanvas c, bool bike, bool walker)
        {
            float d = c.WidthMm;
            c.Fill(White);
            c.Circle(d / 2, d / 2, d / 2 - d * 0.012f, Blue);
            var f = DiscFrame(c);
            if (walker && bike) { Figure(new Frame(c, d / 240f * 0.75f, d * 0.08f, d * 0.12f), 128, 70, 1.0f, true); Bicycle(new Frame(c, d / 240f * 0.72f, d * 0.36f, d * 0.27f), 128, 140, White); }
            else if (walker) Figure(f, 128, 72, 1.25f, true, White);
            else Bicycle(f, 128, 150, White);
        }

        static void OneWayAcross(SignCanvas c)
        {
            float w = c.WidthMm, h = c.HeightMm;
            c.Fill(White);
            c.Rect(w * 0.01f, w * 0.01f, w - w * 0.02f, h - w * 0.02f, w * 0.02f, Blue);
            c.Arrow(new[] { new float2(w * 0.12f, h / 2), new float2(w * 0.88f, h / 2) }, h * 0.2f, h * 0.42f, White);
        }

        static void OneWayAlong(SignCanvas c)
        {
            float s = c.WidthMm;
            BlueField(c);
            c.Arrow(new[] { new float2(s / 2, s * 0.85f), new float2(s / 2, s * 0.15f) }, s * 0.16f, s * 0.34f, White);
        }

        static void Chevron(SignCanvas c, bool left, bool tall)
        {
            float w = c.WidthMm, h = c.HeightMm;
            c.Fill(Black);
            float m = left ? -1 : 1, cx = w / 2;
            float2 P(float x, float y) => new float2(cx + m * (x - 0.5f) * w, y * h);
            c.Polygon(new[] { P(0.2f, 0.12f), P(0.48f, 0.12f), P(0.82f, 0.5f), P(0.48f, 0.88f), P(0.2f, 0.88f), P(0.54f, 0.5f) }, Yellow);
        }

        static void ObstacleMarker(SignCanvas c, string v)
        {
            float w = c.WidthMm, h = c.HeightMm;
            c.Fill(Yellow);
            float step = w * 0.75f;
            // stripes fall towards the side the traffic passes on: obstacle to the left (V) → pass right
            float dir = v == "V" ? 1 : -1;
            for (float y = -w * 2; y < h + w * 2; y += step * 2)
            {
                if (v == "VH")
                {
                    c.Polygon(new[] { new float2(0, y), new float2(w / 2, y + w * 0.5f), new float2(w, y), new float2(w, y + step), new float2(w / 2, y + step + w * 0.5f), new float2(0, y + step) }, Black);
                    continue;
                }
                float y0 = y, y1 = y + dir * w;
                c.Polygon(new[] { new float2(0, y0), new float2(w, y1), new float2(w, y1 + step), new float2(0, y0 + step) }, Black);
            }
        }

        static void WarningSymbol(SignCanvas c, int code, string sub)
        {
            float w = c.WidthMm, h = c.HeightMm;
            c.Fill(Red);
            var outer = new[] { new float2(w / 2, 0), new float2(0, h), new float2(w, h) };
            c.Polygon(SignCanvas.Inset(outer, w * 0.075f), White, w * 0.02f);
            bool left = sub.StartsWith("2");
            var f = TriangleFrame(c, left && (code == 100 || code == 102));
            var B = Black;
            switch (code)
            {
                case 100: f.Arrow(14, B, 118, 206, 118, 152, 152, 122); break;
                case 102: f.Arrow(14, B, 108, 206, 108, 172, 148, 152, 148, 116); break;
                case 104:
                    f.Poly(B, 82, 204, 184, 204, 184, 130);
                    f.Text("10%", 104, 150, 20, B, 46);
                    break;
                case 106:
                    f.Stroke(12, B, 92, 206, 92, 166, 110, 136, 110, 106);
                    f.Stroke(12, B, 164, 206, 164, 166, 146, 136, 146, 106);
                    break;
                case 108: case 109:
                {
                    var pts = new List<float2> { f.P(64, 206), f.P(64, 192) };
                    if (code == 108) { pts.AddRange(ArcPts(f, 98, 192, 22, math.PI, 2 * math.PI)); pts.AddRange(ArcPts(f, 158, 192, 22, math.PI, 2 * math.PI)); }
                    else pts.AddRange(ArcPts(f, 128, 192, 44, math.PI, 2 * math.PI));
                    pts.Add(f.P(192, 192)); pts.Add(f.P(192, 206));
                    c.Polygon(pts, B);
                    break;
                }
                case 110:
                    Figure(f, 128, 108, 1, false);
                    f.Stroke(8, B, 116, 146, 170, 196);
                    c.Polygon(ArcPts(f, 174, 206, 22, math.PI, 2 * math.PI), B);
                    break;
                case 112:
                    Vehicle(f, 108, 190, false, B);
                    f.Stroke(6, B, 62, 204, 82, 196, 100, 206, 118, 196, 136, 206, 154, 196, 172, 206, 194, 198);
                    f.Stroke(6, B, 150, 186, 166, 176, 180, 186, 196, 176);
                    break;
                case 122:
                {
                    var arch = new List<float2> { f.P(76, 206) };
                    arch.AddRange(ArcPts(f, 128, 168, 52, math.PI, 2 * math.PI));
                    arch.Add(f.P(180, 206));
                    c.Polygon(arch, B);
                    var hole = new List<float2> { f.P(96, 206) };
                    hole.AddRange(ArcPts(f, 128, 172, 32, math.PI, 2 * math.PI));
                    hole.Add(f.P(160, 206));
                    c.Polygon(hole, White);
                    break;
                }
                case 124: f.Stroke(14, B, 128, 104, 128, 206); f.Stroke(14, B, 86, 152, 170, 152); break;
                case 210: f.Stroke(22, B, 128, 102, 128, 206); f.Stroke(9, B, 84, 152, 172, 152); break;
                case 126:
                    for (int k = 0; k < 3; k++)
                    {
                        float a0 = -k * 2 * math.PI / 3 - 0.3f, a1 = a0 - 1.4f;
                        var arc = ArcPts(f, 128, 160, 30, a0, a1);
                        c.Arrow(arc, f.L(10), f.L(22), B);
                    }
                    break;
                case 132:
                    f.Rect(106, 100, 44, 106, 8, B);
                    f.Disc(128, 120, 12, Red); f.Disc(128, 153, 12, Yellow); f.Disc(128, 186, 12, Hex(0x1C9B3C));
                    break;
                case 140:
                    Figure(f, 132, 102, 0.95f, true);
                    for (int i = 0; i < 5; i++) f.Rect(70 + i * 24, 196, 14, 10, 0, B);
                    break;
                case 142: Figure(f, 106, 136, 0.75f, true); Figure(f, 148, 114, 1.0f, true); break;
                case 144: Bicycle(f, 128, 196, B); break;
                case 146: if (sub == "1") Elk(f); else Deer(f); break;
                case 150:
                    f.Arrow(12, B, 110, 206, 110, 112);
                    f.Arrow(12, Red, 148, 110, 148, 204);
                    break;
                case 152: for (int i = 0; i < 3; i++) f.Rect(96, 116 + i * 30, 64, 20, 5, B); break;
                default:
                    f.Rect(118, 104, 20, 72, 8, B);
                    f.Disc(128, 194, 12, B);
                    break;
            }
        }

        static List<float2> ArcPts(Frame f, float cx, float cy, float r, float a0, float a1)
        {
            var l = new List<float2>();
            foreach (var p in SignCanvas.Arc(cx, cy, r, a0, a1, 20)) l.Add(f.P(p.x, p.y));
            return l;
        }

        /// <summary>A walking (or standing) person, head at (x, y), in signs.js units.</summary>
        static void Figure(Frame f, float x, float y, float s, bool walking, Color? colour = null)
        {
            var B = colour ?? Black;
            f.Disc(x + 4 * s, y, 11 * s, B);
            f.Stroke(13 * s, B, x + 2 * s, y + 16 * s, x - 4 * s, y + 48 * s);
            if (walking)
            {
                f.Stroke(10 * s, B, x - 4 * s, y + 48 * s, x - 18 * s, y + 66 * s, x - 26 * s, y + 86 * s);
                f.Stroke(10 * s, B, x - 4 * s, y + 48 * s, x + 12 * s, y + 66 * s, x + 16 * s, y + 88 * s);
                f.Stroke(8 * s, B, x + 1 * s, y + 22 * s, x + 14 * s, y + 36 * s, x + 22 * s, y + 48 * s);
                f.Stroke(8 * s, B, x + 1 * s, y + 22 * s, x - 12 * s, y + 34 * s, x - 18 * s, y + 46 * s);
            }
            else
            {
                f.Stroke(9 * s, B, x - 4 * s, y + 48 * s, x - 12 * s, y + 86 * s);
                f.Stroke(9 * s, B, x - 4 * s, y + 48 * s, x + 6 * s, y + 86 * s);
                f.Stroke(8 * s, B, x + 1 * s, y + 22 * s, x + 22 * s, y + 36 * s);
            }
        }

        /// <summary>Side-view car (or lorry) with its wheels on ground line y.</summary>
        static void Vehicle(Frame f, float x, float y, bool truck, Color col)
        {
            if (truck) { f.Rect(x - 58, y - 72, 78, 56, 4, col); f.Rect(x + 22, y - 48, 36, 32, 6, col); }
            else { f.Rect(x - 52, y - 38, 104, 28, 9, col); f.PolyR(col, 4, x - 32, y - 36, x - 18, y - 60, x + 20, y - 60, x + 34, y - 36); }
            f.Disc(x - 30, y - 8, 13, col); f.Disc(x + 30, y - 8, 13, col);
            f.Disc(x - 30, y - 8, 5, White); f.Disc(x + 30, y - 8, 5, White);
        }

        static void CarFront(Frame f, float x, Color col)
        {
            f.Rect(x - 25, 118, 50, 48, 7, col);
            f.PolyR(col, 3, x - 20, 120, x - 14, 96, x + 14, 96, x + 20, 120);
            f.Rect(x - 25, 162, 11, 14, 2, col); f.Rect(x + 14, 162, 11, 14, 2, col);
            f.Disc(x - 15, 134, 6, White); f.Disc(x + 15, 134, 6, White);
        }

        static void Bicycle(Frame f, float x, float y, Color col)
        {
            f.Ring(x - 32, y - 20, 18, 7, col); f.Ring(x + 32, y - 20, 18, 7, col);
            f.Stroke(7, col, x - 32, y - 20, x - 8, y - 54, x + 22, y - 54, x + 32, y - 20);
            f.Stroke(7, col, x - 32, y - 20, x, y - 20, x - 8, y - 54);
            f.Stroke(7, col, x, y - 20, x + 22, y - 54);
            f.Stroke(6, col, x - 14, y - 62, x - 2, y - 62);
            f.Stroke(6, col, x + 22, y - 54, x + 18, y - 66, x + 28, y - 68);
        }

        /// <summary>Elk (146.1): heavy body, high withers, long legs, broad palmate antlers, facing left.</summary>
        static void Elk(Frame f)
        {
            var B = Black;
            f.Poly(B, 76, 150, 82, 140, 96, 132, 106, 132, 114, 128, 128, 124, 148, 130, 168, 134, 178, 142, 178, 160, 174, 172, 176, 206,
                168, 206, 164, 176, 156, 170, 136, 170, 130, 176, 128, 206, 120, 206, 118, 172, 110, 162, 104, 168, 100, 160, 98, 152, 88, 156, 80, 158);
            f.Poly(B, 102, 132, 92, 122, 86, 106, 92, 110, 96, 102, 100, 112, 104, 98, 108, 112, 112, 104, 114, 118, 110, 130);
        }

        /// <summary>Deer / reindeer (146.x): slimmer body and branching antlers, facing left.</summary>
        static void Deer(Frame f)
        {
            var B = Black;
            f.Poly(B, 80, 144, 90, 134, 102, 132, 112, 138, 124, 140, 156, 140, 172, 144, 176, 152, 174, 166, 172, 206, 166, 206, 164, 172,
                156, 168, 134, 168, 128, 172, 126, 206, 120, 206, 118, 168, 112, 160, 106, 150, 96, 150, 86, 152);
            f.Stroke(5, B, 100, 134, 96, 116, 86, 100);
            f.Stroke(5, B, 96, 118, 104, 104);
            f.Stroke(5, B, 92, 110, 82, 112);
        }

        // ---- text plates --------------------------------------------------------------------------------------

        /// <summary>713 vanlig vegviser: a yellow arrow plate, one destination per line, road numbers in shields at the line start.</summary>
        static SignDesign DirectionSign(string key, List<SignText.Line> lines, bool left)
        {
            float cap = DirectionCap, lineH = cap * 1.75f, pad = cap * 0.7f;
            float width = 0;
            foreach (var l in lines) width = math.max(width, LineWidth(l, cap));
            float h = lines.Count * lineH + pad * 0.6f, tip = h * 0.42f;
            float w = width + 2 * pad + tip;
            return new SignDesign
            {
                Key = key, Shape = left ? PlateShape.ArrowLeft : PlateShape.ArrowRight, WidthMm = w, HeightMm = h, CornerMm = cap * 0.25f,
                Paint = c =>
                {
                    c.Fill(Black);
                    var outline = new SignDesign { Shape = left ? PlateShape.ArrowLeft : PlateShape.ArrowRight, WidthMm = w, HeightMm = h, CornerMm = cap * 0.25f }.Outline();
                    c.Polygon(SignCanvas.Inset(outline, cap * 0.12f), Yellow);
                    float x0 = left ? tip + pad : pad;
                    for (int i = 0; i < lines.Count; i++)
                    {
                        float cy = pad * 0.3f + lineH * (i + 0.5f);
                        float x = x0;
                        if (lines[i].Shield != null) x += Shield(c, x, cy, lines[i].Shield, lines[i].ShieldCode, cap) + cap * 0.4f;
                        c.Text(lines[i].Text, x, cy, cap, Black, false);
                    }
                },
            };
        }

        static float LineWidth(SignText.Line l, float cap)
        {
            float w = SignCanvas.TextWidth(l.Text, cap);
            if (l.Shield != null) w += ShieldWidth(l.Shield, cap) + (string.IsNullOrEmpty(l.Text) ? 0 : cap * 0.4f);
            return w;
        }

        static float ShieldWidth(string number, float cap) => SignCanvas.TextWidth(number, cap) + cap * 0.9f;

        static (Color bg, Color fg) ShieldColours(string code, string number)
        {
            if (code == "723.1" || code == "723.2" || (number != null && number.StartsWith("E"))) return (Green, White);
            if (code == "723.11" || code == "723.12") return (Green, White);   // riksveg
            return (White, Black);                                              // fylkesveg (723.15 / 723.16) and others
        }

        /// <summary>A road-number shield left-aligned at x, centred on cy; returns its width.</summary>
        static float Shield(SignCanvas c, float x, float cy, string number, string code, float cap)
        {
            float w = ShieldWidth(number, cap), h = cap * 1.5f;
            var (bg, fg) = ShieldColours(code, number);
            c.Rect(x, cy - h / 2, w, h, cap * 0.18f, fg == White ? bg : Black);
            c.Rect(x + cap * 0.1f, cy - h / 2 + cap * 0.1f, w - cap * 0.2f, h - cap * 0.2f, cap * 0.1f, bg);
            c.Text(number, x + w / 2, cy, cap, fg);
            return w;
        }

        /// <summary>723.x Vegnummer: the shield as a plate of its own.</summary>
        static SignDesign RouteShield(string code, string label, string text)
        {
            var lines = SignText.Parse(text);
            string number = null;
            foreach (var l in lines) if (l.Shield != null) { number = l.Shield; break; }
            if (number == null) return null;
            float cap = 150f, w = ShieldWidth(number, cap) + cap * 0.1f, h = cap * 1.6f;
            var lower = (label ?? "").ToLowerInvariant();
            string colourCode = lower.Contains("europaveg") ? "723.1" : lower.Contains("riksveg") ? "723.11" : "723.15";
            return new SignDesign
            {
                Key = $"723|{colourCode}|{number}", Shape = PlateShape.Rect, WidthMm = w, HeightMm = h, CornerMm = cap * 0.2f,
                Paint = c =>
                {
                    var (bg, fg) = ShieldColours(colourCode, number);
                    c.Fill(fg == White ? bg : Black);
                    c.Rect(cap * 0.1f, cap * 0.1f, w - cap * 0.2f, h - cap * 0.2f, cap * 0.12f, bg);
                    c.Text(number, w / 2, h / 2, cap, fg);
                },
            };
        }

        /// <summary>A plain text plate (727 place name, 729 street name, 8xx supplementary): border, one line.</summary>
        static SignDesign NamePlate(string key, string text, Color bg, Color fg, float cap)
        {
            float pad = cap * 0.75f, w = SignCanvas.TextWidth(text, cap) + 2 * pad, h = cap * 2.1f;
            w = math.max(w, h * 1.4f);
            return new SignDesign
            {
                Key = key, Shape = PlateShape.Rect, WidthMm = w, HeightMm = h, CornerMm = cap * 0.2f,
                Paint = c =>
                {
                    c.Fill(fg);
                    c.Rect(cap * 0.1f, cap * 0.1f, w - cap * 0.2f, h - cap * 0.2f, cap * 0.12f, bg);
                    c.Text(text, w / 2, h / 2, cap, fg, true, w - 2 * pad * 0.6f);
                },
            };
        }
    }
}
