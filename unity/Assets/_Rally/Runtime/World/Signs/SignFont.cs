using System.Collections.Generic;
using Unity.Collections;
using UnityEngine;
using UnityEngine.TextCore;
using UnityEngine.TextCore.LowLevel;
using UnityEngine.TextCore.Text;

namespace Rally.World
{
    /// <summary>
    /// The lettering of the sign faces: DejaVu Sans Condensed Bold (Resources/Signs/SignFont.ttf; a free stand-in for the
    /// Trafikkalfabetet of the real signs) rasterised by Unity's FontEngine into a dynamic, CPU-readable SDF atlas, so
    /// <see cref="SignCanvas"/> can draw any text (place names with ÆØÅ) sharply at any size, in the editor and the player.
    /// Glyphs are added on first use. Units are the font's design units at <see cref="PointSize"/>.
    /// </summary>
    public sealed class SignFont
    {
        public const int PointSize = 64, Padding = 8, AtlasSize = 1024;
        const string Common = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÆØÅæøåÄÖÜäöüÉé ,.-–%&/()+:'";
        static SignFont shared;
        /// <summary>The one instance (the atlas is shared by every face); null when the font asset is missing.</summary>
        public static SignFont Shared => shared ??= Load();

        readonly FontAsset asset;
        readonly Dictionary<uint, Glyph> glyphs = new Dictionary<uint, Glyph>();
        public readonly float CapHeight, Ascent;

        SignFont(FontAsset asset)
        {
            this.asset = asset;
            CapHeight = asset.faceInfo.capLine > 0 ? asset.faceInfo.capLine : PointSize * 0.73f;
            Ascent = asset.faceInfo.ascentLine;
        }

        static SignFont Load()
        {
            var font = Resources.Load<Font>("Signs/SignFont");
            if (font == null) { Rally.Core.RallyLog.Warn("signs: Resources/Signs/SignFont missing, faces without lettering"); return null; }
            var fa = FontAsset.CreateFontAsset(font, PointSize, Padding, GlyphRenderMode.SDFAA, AtlasSize, AtlasSize, AtlasPopulationMode.Dynamic, true);
            if (fa == null) return null;
            // One batch for the usual letters: adding glyphs one by one re-uploads the atlas each time.
            fa.TryAddCharacters(Common, out _);
            return new SignFont(fa);
        }

        /// <summary>The glyph of a character (added to the atlas on first use); false for characters the font lacks.</summary>
        public bool TryGlyph(char c, out Glyph g)
        {
            if (glyphs.TryGetValue(c, out g)) return g != null;
            asset.TryAddCharacters(c.ToString(), out _);
            g = asset.characterLookupTable != null && asset.characterLookupTable.TryGetValue(c, out var ch) ? ch.glyph : null;
            glyphs[c] = g;
            return g != null;
        }

        /// <summary>Advance width of a string in font units (kerning ignored).</summary>
        public float Measure(string s)
        {
            float w = 0;
            foreach (var c in s) if (TryGlyph(c, out var g)) w += g.metrics.horizontalAdvance; else if (c == ' ') w += PointSize * 0.3f;
            return w;
        }

        /// <summary>The atlas page a glyph lives on (multi-atlas: a long session can fill the first).</summary>
        public Texture2D AtlasOf(Glyph g) => asset.atlasTextures[Mathf.Clamp(g.atlasIndex, 0, asset.atlasTextures.Length - 1)];

        /// <summary>Signed distance at an atlas pixel position (bilinear), in atlas pixels, negative inside.</summary>
        public static float Distance(NativeArray<byte> data, int width, int height, float x, float y)
        {
            x -= 0.5f; y -= 0.5f;
            int x0 = Mathf.Clamp((int)Mathf.Floor(x), 0, width - 1), y0 = Mathf.Clamp((int)Mathf.Floor(y), 0, height - 1);
            int x1 = Mathf.Min(x0 + 1, width - 1), y1 = Mathf.Min(y0 + 1, height - 1);
            float fx = Mathf.Clamp01(x - x0), fy = Mathf.Clamp01(y - y0);
            float a = data[y0 * width + x0], b = data[y0 * width + x1], c = data[y1 * width + x0], d = data[y1 * width + x1];
            float v = Mathf.Lerp(Mathf.Lerp(a, b, fx), Mathf.Lerp(c, d, fx), fy) / 255f;
            return (0.5f - v) * 2f * Padding;
        }
    }
}
