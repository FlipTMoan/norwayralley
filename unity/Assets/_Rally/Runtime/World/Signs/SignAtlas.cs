using System;
using System.Collections.Generic;
using Rally.Core;
using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// The sign faces, painted once each by <see cref="SignCanvas"/> into shared texture pages (2048², sRGB, mip-mapped,
    /// 8× anisotropic) and kept: a face is painted the first time a plate needs it and every later plate with the same
    /// design (the same sign number, text, speed) reuses its cell, whichever tile it is in. Cells are shelf-packed; a page
    /// whose faces are all unused is freed when another page is needed. Painting is spread over frames
    /// (<see cref="Pump"/>); the touched pages are uploaded with their mip chains once the queue is empty.
    /// </summary>
    public sealed class SignAtlas : IDisposable
    {
        public const int PageSize = 2048, Gutter = 6, MaxPages = 6;
        /// <summary>Face resolution: 0.32 px per mm (a 900 mm warning triangle is 288 px wide).</summary>
        public const float PxPerMm = 0.32f;

        public sealed class Face
        {
            public string Key;
            public SignDesign Design;
            public int Page = -1;
            public RectInt Cell;
            public bool Painted;
            public int Refs;
            /// <summary>Texture UV of the plate's top-left (mm 0,0) and its size in UV per mm (v decreasing downwards).</summary>
            public Vector2 UvOrigin, UvPerMm;
        }

        sealed class Page
        {
            public Texture2D Texture;
            public Material Material;
            public readonly List<(int y, int h, int x)> Shelves = new List<(int, int, int)>();
            public int Top;
            public bool Dirty;
            public readonly List<Face> Faces = new List<Face>();
        }

        readonly Dictionary<string, Face> faces = new Dictionary<string, Face>();
        readonly List<Page> pages = new List<Page>();
        readonly Queue<Face> toPaint = new Queue<Face>();
        readonly Shader shader;
        public int Painted { get; private set; }
        public double PaintMs { get; private set; }
        public int PageCount { get { int n = 0; foreach (var p in pages) if (p != null) n++; return n; } }
        public int FaceCount => faces.Count;
        public int Pending => toPaint.Count;

        public SignAtlas(Shader shader) { this.shader = shader; }

        /// <summary>The face for a design (cached by key), one reference more; null when every page is full of used faces.</summary>
        public Face Acquire(SignDesign design)
        {
            if (!faces.TryGetValue(design.Key, out var f))
            {
                f = new Face { Key = design.Key, Design = design };
                if (!Allocate(f)) return null;
                faces[design.Key] = f;
                toPaint.Enqueue(f);
            }
            f.Refs++;
            return f;
        }

        public void Release(Face f) { if (f != null && f.Refs > 0) f.Refs--; }

        public Material MaterialOf(int page) => page >= 0 && page < pages.Count ? pages[page]?.Material : null;

        bool Allocate(Face f)
        {
            int w = Mathf.CeilToInt(f.Design.WidthMm * PxPerMm) + 2 * Gutter, h = Mathf.CeilToInt(f.Design.HeightMm * PxPerMm) + 2 * Gutter;
            w = Mathf.Min(w, PageSize); h = Mathf.Min(h, PageSize);
            for (int i = 0; i < pages.Count; i++) if (pages[i] != null && Pack(pages[i], i, f, w, h)) return true;
            // A page whose faces nobody uses any more makes room before a new page is made.
            for (int i = 0; i < pages.Count; i++)
                if (pages[i] != null && pages[i].Faces.TrueForAll(x => x.Refs == 0)) { FreePage(i); break; }
            int slot = pages.IndexOf(null);
            if (slot < 0)
            {
                if (pages.Count >= MaxPages) { RallyLog.Warn($"signs: atlas full ({MaxPages} pages in use), {f.Key} not drawn"); return false; }
                pages.Add(null); slot = pages.Count - 1;
            }
            pages[slot] = NewPage();
            return Pack(pages[slot], slot, f, w, h);
        }

        Page NewPage()
        {
            var tex = new Texture2D(PageSize, PageSize, TextureFormat.RGBA32, true, false)
            {
                name = "SignAtlas", anisoLevel = 8, filterMode = FilterMode.Trilinear, wrapMode = TextureWrapMode.Clamp,
            };
            var fill = new Color32[PageSize * PageSize];
            for (int i = 0; i < fill.Length; i++) fill[i] = new Color32(200, 200, 200, 255);
            tex.SetPixels32(fill);
            var mat = shader != null ? new Material(shader) { name = "SignPlates" } : null;
            if (mat != null) mat.SetTexture("_BaseMap", tex);
            return new Page { Texture = tex, Material = mat, Dirty = true };
        }

        void FreePage(int i)
        {
            var p = pages[i];
            foreach (var f in p.Faces) faces.Remove(f.Key);
            RallyObjects.Destroy(p.Texture);
            if (p.Material != null) RallyObjects.Destroy(p.Material);
            pages[i] = null;
        }

        static bool Pack(Page p, int index, Face f, int w, int h)
        {
            for (int s = 0; s < p.Shelves.Count; s++)
            {
                var (y, sh, x) = p.Shelves[s];
                if (h <= sh && h >= sh * 0.6f && x + w <= PageSize)
                {
                    p.Shelves[s] = (y, sh, x + w);
                    Place(p, index, f, x, y, w, h);
                    return true;
                }
            }
            if (p.Top + h > PageSize) return false;
            p.Shelves.Add((p.Top, h, w));
            Place(p, index, f, 0, p.Top, w, h);
            p.Top += h;
            return true;
        }

        static void Place(Page p, int index, Face f, int x, int y, int w, int h)
        {
            f.Page = index;
            f.Cell = new RectInt(x, y, w, h);
            // canvas row 0 (plate top) is written to the cell's top row: v(mm y) = (top − Gutter − y·px) / size
            f.UvOrigin = new Vector2((x + Gutter) / (float)PageSize, (y + h - Gutter) / (float)PageSize);
            f.UvPerMm = new Vector2(PxPerMm / PageSize, -PxPerMm / PageSize);
            p.Faces.Add(f);
        }

        /// <summary>Paints queued faces until <paramref name="budgetMs"/> is spent (at least one), then uploads the pages it touched.</summary>
        public void Pump(double budgetMs)
        {
            if (toPaint.Count == 0) { Upload(); return; }
            var watch = System.Diagnostics.Stopwatch.StartNew();
            while (toPaint.Count > 0)
            {
                var f = toPaint.Dequeue();
                if (f.Page < 0 || f.Page >= pages.Count || pages[f.Page] == null || !faces.ContainsKey(f.Key)) continue;
                Paint(f);
                if (watch.Elapsed.TotalMilliseconds > budgetMs) break;
            }
            PaintMs += watch.Elapsed.TotalMilliseconds;
            if (toPaint.Count == 0) Upload();   // one upload (with its mip chain) per batch, not per face
        }

        /// <summary>Paints every queued face now (tests, the preview tool).</summary>
        public void PaintAll() { while (toPaint.Count > 0) Pump(1e9); }

        void Paint(Face f)
        {
            var page = pages[f.Page];
            var c = new SignCanvas(f.Design.WidthMm, f.Design.HeightMm, PxPerMm, Gutter);
            try { f.Design.Paint?.Invoke(c); }
            catch (Exception e) { RallyLog.Warn($"signs: painting {f.Key} failed: {e.Message}"); }
            int w = Mathf.Min(c.Width, f.Cell.width), h = Mathf.Min(c.Height, f.Cell.height);
            var px = new Color32[f.Cell.width * f.Cell.height];
            for (int row = 0; row < h; row++)
            {
                int dst = (f.Cell.height - 1 - row) * f.Cell.width;
                for (int col = 0; col < w; col++)
                {
                    var v = c.Pixels[row * c.Width + col];
                    px[dst + col] = new Color32((byte)(Mathf.Clamp01(v.r) * 255f + 0.5f), (byte)(Mathf.Clamp01(v.g) * 255f + 0.5f), (byte)(Mathf.Clamp01(v.b) * 255f + 0.5f), 255);
                }
            }
            page.Texture.SetPixels32(f.Cell.x, f.Cell.y, f.Cell.width, f.Cell.height, px);
            page.Dirty = true;
            f.Painted = true;
            Painted++;
        }

        void Upload()
        {
            foreach (var p in pages)
                if (p != null && p.Dirty) { p.Texture.Apply(true, false); p.Dirty = false; }
        }

        /// <summary>The page texture (tests, the preview tool).</summary>
        public Texture2D TextureOf(int page) => page >= 0 && page < pages.Count ? pages[page]?.Texture : null;

        public void Dispose()
        {
            for (int i = 0; i < pages.Count; i++) if (pages[i] != null) FreePage(i);
            pages.Clear(); faces.Clear(); toPaint.Clear();
        }
    }
}
