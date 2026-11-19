using System;
using System.Collections.Generic;
using System.IO;
using Rally.Geo;
using Rally.World;
using UnityEditor;
using UnityEngine;

namespace Rally.Editor
{
    /// <summary>
    /// A contact sheet of the sign faces (World/Signs/SignCatalog) as a PNG, to check the designs by eye:
    /// menu Rally/Sign faces sheet, or batchmode
    /// <c>-executeMethod Rally.Editor.SignFacesSheet.Run -signSheet out.png</c> (works with -nographics: CPU only).
    /// </summary>
    public static class SignFacesSheet
    {
        static readonly (string code, string text)[] Samples =
        {
            ("362.30", null), ("362.50", null), ("362.80", null), ("362.100", null), ("364.60", null), ("366", null), ("368", null),
            ("100.1", null), ("100.2", null), ("102.1", null), ("104", null), ("106.1", null), ("108", null), ("109", null), ("110", null),
            ("112", null), ("122", null), ("124", null), ("126", null), ("140", null), ("142", null), ("146.1", null), ("146.2", null), ("150", null), ("156", null),
            ("202", null), ("204", null), ("206", null), ("208", null), ("210", null), ("302", null), ("306.1", null), ("306.5", null), ("314", "3,8 m"),
            ("334", null), ("370", null), ("372", null), ("404.1", null), ("406", null), ("512", null), ("516", null), ("518", null), ("520", null), ("522", null),
            ("526.1", null), ("526.2", null), ("902V", null), ("904H", null), ("906V", null), ("906H", null),
            ("713.H", "@723.15@$520$Sauda 3@31@"), ("713.V", "@650.40@Fjord & Fjell@610.1@Bunker Oil@31@"), ("713.H", "Åbødalen @31@"),
            ("723.15", "@723.15@$520$"), ("727.1", "Saudasjøen"), ("729", "Saudavegen"), ("802", "150 m"), ("808.115", null),
        };

        [MenuItem("Rally/Sign faces sheet")]
        public static void Menu() => Write(Path.Combine(Application.dataPath, "../Logs/sign-faces.png"));

        public static void Run()
        {
            var args = Environment.GetCommandLineArgs();
            int i = Array.IndexOf(args, "-signSheet");
            Write(i >= 0 && i + 1 < args.Length ? args[i + 1] : Path.Combine(Application.dataPath, "../Logs/sign-faces.png"));
        }

        static void Write(string path)
        {
            var designs = new List<SignDesign>();
            foreach (var (code, text) in Samples)
            {
                var label = code == "808.115" ? "Ferist" : code == "723.15" ? "Vegnummer for nummerert fylkesveg" : null;
                var d = SignCatalog.For(new SignPlate { Id = 1, Code = code, Number = NvdbSource.SignNumber(code), Text = text, Label = label }, 40);
                if (d == null) { Debug.LogWarning($"sign sheet: no design for {code}"); continue; }
                designs.Add(d);
            }
            const float px = SignAtlas.PxPerMm;
            const int cell = 320, cols = 8, pad = 12;
            int rows = 0, x = 0;
            var placed = new List<(SignDesign d, SignCanvas c, int x, int y)>();
            var times = new List<string>();
            int rowH = 0, y = pad, cx = pad, width = cols * cell;
            foreach (var d in designs)
            {
                var c = new SignCanvas(d.WidthMm, d.HeightMm, px, 0);
                var watch = System.Diagnostics.Stopwatch.StartNew();
                d.Paint(c);
                times.Add($"{d.Key} {watch.Elapsed.TotalMilliseconds:0.0}");
                if (cx + c.Width > width - pad) { cx = pad; y += rowH + pad; rowH = 0; rows++; }
                placed.Add((d, c, cx, y));
                cx += c.Width + pad; rowH = Mathf.Max(rowH, c.Height);
                x++;
            }
            int height = y + rowH + pad;
            var tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
            var bg = new Color32[width * height];
            for (int k = 0; k < bg.Length; k++) bg[k] = new Color32(90, 110, 95, 255);
            tex.SetPixels32(bg);
            foreach (var (d, c, ox, oy) in placed)
            {
                var outline = d.Outline().ToArray();
                for (int row = 0; row < c.Height; row++)
                    for (int col = 0; col < c.Width; col++)
                    {
                        // show the plate as the mesh cuts it: only inside the outline
                        var mm = new Unity.Mathematics.float2((col + 0.5f) / px, (row + 0.5f) / px);
                        float dist = SignCanvas.PolygonDistance(outline, mm) * px;
                        float cov = Mathf.Clamp01(0.5f - dist);
                        if (cov <= 0) continue;
                        int tx = ox + col, ty = height - 1 - (oy + row);
                        var under = tex.GetPixel(tx, ty);
                        tex.SetPixel(tx, ty, Color.Lerp(under, c.Pixels[row * c.Width + col], cov));
                    }
            }
            tex.Apply(false);
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path)));
            File.WriteAllBytes(path, tex.EncodeToPNG());
            Debug.Log($"sign sheet: {placed.Count} faces → {path}; paint ms: {string.Join(", ", times)}");
            UnityEngine.Object.DestroyImmediate(tex);
        }
    }
}
