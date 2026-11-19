using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using NUnit.Framework;
using Rally.Geo;

namespace Rally.Tests.Geo
{
    public class GeoTiffTests
    {
        /// <summary>
        /// A classic TIFF with one Float32 band: header, then the sample blocks (one strip, or square tiles),
        /// then the IFD with its overflow values. Optionally zlib-Deflate per block and big-endian.
        /// </summary>
        static byte[] BuildTiff(int w, int h, float[] samples, bool tiled, int tile, bool deflate, bool bigEndian = false)
        {
            var blocks = new List<byte[]>();
            if (!tiled) blocks.Add(Raw(samples, 0, 0, w, h, w, bigEndian));
            else
                for (int ty = 0; ty < (h + tile - 1) / tile; ty++)
                for (int tx = 0; tx < (w + tile - 1) / tile; tx++)
                    blocks.Add(Raw(samples, tx * tile, ty * tile, tile, tile, w, bigEndian));
            if (deflate) for (int i = 0; i < blocks.Count; i++) blocks[i] = Zlib(blocks[i]);

            var file = new MemoryStream();
            file.Write(bigEndian ? new byte[] { (byte)'M', (byte)'M' } : new byte[] { (byte)'I', (byte)'I' }, 0, 2);
            W16(file, 42, bigEndian);
            W32(file, 0, bigEndian); // IFD offset, patched below
            var offsets = new uint[blocks.Count]; var counts = new uint[blocks.Count];
            for (int i = 0; i < blocks.Count; i++)
            {
                offsets[i] = (uint)file.Length; counts[i] = (uint)blocks[i].Length;
                file.Write(blocks[i], 0, blocks[i].Length);
            }

            // (tag, type, numeric values); type 3 SHORT, 4 LONG, 12 DOUBLE.
            var entries = new List<(int tag, int type, double[] values)>
            {
                (256, 3, new double[] { w }), (257, 3, new double[] { h }), (258, 3, new double[] { 32 }),
                (259, 3, new double[] { deflate ? 8 : 1 }), (262, 3, new double[] { 1 }), (277, 3, new double[] { 1 }),
                (284, 3, new double[] { 1 }), (339, 3, new double[] { 3 }), (33550, 12, new[] { 0.5, 0.25, 0.0 }),
            };
            double[] offs = Array.ConvertAll(offsets, v => (double)v), cnts = Array.ConvertAll(counts, v => (double)v);
            if (tiled) { entries.Add((322, 3, new double[] { tile })); entries.Add((323, 3, new double[] { tile })); entries.Add((324, 4, offs)); entries.Add((325, 4, cnts)); }
            else { entries.Add((273, 4, offs)); entries.Add((278, 3, new double[] { h })); entries.Add((279, 4, cnts)); }
            entries.Sort((a, b) => a.tag.CompareTo(b.tag));

            uint ifdAt = (uint)file.Length;
            int n = entries.Count;
            uint overflowAt = ifdAt + 2 + (uint)n * 12 + 4;
            var overflow = new MemoryStream();
            W16(file, n, bigEndian);
            foreach (var e in entries)
            {
                int size = (e.type == 3 ? 2 : e.type == 4 ? 4 : 8) * e.values.Length;
                W16(file, e.tag, bigEndian); W16(file, e.type, bigEndian); W32(file, (uint)e.values.Length, bigEndian);
                var target = size <= 4 ? file : overflow;
                if (size > 4) W32(file, overflowAt + (uint)overflow.Length, bigEndian);
                long at = target.Position;
                foreach (var v in e.values)
                {
                    if (e.type == 3) W16(target, (int)v, bigEndian);
                    else if (e.type == 4) W32(target, (uint)v, bigEndian);
                    else W64(target, BitConverter.DoubleToInt64Bits(v), bigEndian);
                }
                if (size <= 4) while (file.Position < at + 4) file.WriteByte(0);
            }
            W32(file, 0, bigEndian); // no next IFD
            Assert.AreEqual(overflowAt, file.Length, "layout bookkeeping");
            overflow.WriteTo(file);
            var bytes = file.ToArray();
            var ifdBytes = new MemoryStream(); W32(ifdBytes, ifdAt, bigEndian);
            Buffer.BlockCopy(ifdBytes.ToArray(), 0, bytes, 4, 4);
            return bytes;
        }

        static byte[] Raw(float[] s, int x0, int y0, int w, int h, int stride, bool be)
        {
            var out_ = new byte[w * h * 4];
            for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++)
            {
                int sx = x0 + x, sy = y0 + y;
                float v = sx < stride && sy * stride + sx < s.Length ? s[sy * stride + sx] : 0;
                var b = BitConverter.GetBytes(v);
                if (be) Array.Reverse(b);
                Buffer.BlockCopy(b, 0, out_, (y * w + x) * 4, 4);
            }
            return out_;
        }

        static byte[] Zlib(byte[] raw)
        {
            var ms = new MemoryStream();
            ms.WriteByte(0x78); ms.WriteByte(0x9c);
            using (var z = new DeflateStream(ms, CompressionLevel.Optimal, leaveOpen: true)) z.Write(raw, 0, raw.Length);
            ms.Write(new byte[4], 0, 4); // Adler-32 not checked by the decoder
            return ms.ToArray();
        }

        static void W16(Stream s, int v, bool be) { if (be) { s.WriteByte((byte)(v >> 8)); s.WriteByte((byte)v); } else { s.WriteByte((byte)v); s.WriteByte((byte)(v >> 8)); } }
        static void W32(Stream s, uint v, bool be) { for (int i = 0; i < 4; i++) s.WriteByte((byte)(v >> (be ? 24 - 8 * i : 8 * i))); }
        static void W64(Stream s, long v, bool be) { for (int i = 0; i < 8; i++) s.WriteByte((byte)(v >> (be ? 56 - 8 * i : 8 * i))); }

        static float[] Ramp(int w, int h) { var s = new float[w * h]; for (int i = 0; i < s.Length; i++) s[i] = i * 0.5f - 3; return s; }

        [TestCase(false, false, false)]
        [TestCase(true, false, false)]
        [TestCase(false, true, false)]
        [TestCase(true, true, false)]
        [TestCase(false, false, true)]
        public void DecodesStripsAndTilesPlainAndDeflate(bool tiled, bool deflate, bool bigEndian)
        {
            int w = 7, h = 5;
            var samples = Ramp(w, h);
            var img = GeoTiff.Decode(BuildTiff(w, h, samples, tiled, 4, deflate, bigEndian));
            Assert.AreEqual(w, img.Width); Assert.AreEqual(h, img.Height);
            CollectionAssert.AreEqual(samples, img.Samples);
            Assert.AreEqual(0.5, img.ScaleX, 1e-12); Assert.AreEqual(0.25, img.ScaleY, 1e-12);
        }

        /// <summary>
        /// Kartverket sends GDAL sparse files for sea and land outside the DTM: unstored tiles have byte count 0
        /// and read as nodata (they used to fail with "block shorter than its rows", 2026-11-19).
        /// </summary>
        [Test]
        public void SparseTilesReadAsNoData()
        {
            int w = 7, h = 5;
            var samples = Ramp(w, h);
            var tiff = BuildTiff(w, h, samples, true, 4, false);
            // Zero the byte count of tile 1 (top right, columns 4..6, rows 0..3) in the IFD's TileByteCounts (325).
            int ifd = BitConverter.ToInt32(tiff, 4), n = BitConverter.ToUInt16(tiff, ifd);
            for (int i = 0; i < n; i++)
            {
                int at = ifd + 2 + i * 12;
                if (BitConverter.ToUInt16(tiff, at) != 325) continue;
                int type = BitConverter.ToUInt16(tiff, at + 2), count = BitConverter.ToInt32(tiff, at + 4), size = type == 3 ? 2 : 4;
                int values = count * size <= 4 ? at + 8 : BitConverter.ToInt32(tiff, at + 8);
                for (int k = 0; k < size; k++) tiff[values + size + k] = 0;
            }
            var img = GeoTiff.Decode(tiff);
            for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++)
            {
                float v = img.Samples[y * w + x];
                if (x >= 4 && y < 4) Assert.IsNaN(v, $"({x},{y}) is in the unstored tile");
                else Assert.AreEqual(samples[y * w + x], v, $"({x},{y})");
            }
        }

        [Test]
        public void RejectsWhatItCannotRead()
        {
            Assert.Throws<FormatException>(() => GeoTiff.Decode(new byte[] { 1, 2, 3 }));
            var tiff = BuildTiff(4, 4, Ramp(4, 4), false, 4, false);
            tiff[2] = 43; // BigTIFF magic
            Assert.Throws<FormatException>(() => GeoTiff.Decode(tiff));
        }

        [Test]
        public void KartverketUrlMatchesWorldgenJs()
        {
            var url = KartverketDem.CoverageUrl(new LatLonBounds(58.98, 6.18, 58.99, 6.2), 16, 16);
            Assert.AreEqual("https://wcs.geonorge.no/skwms1/wcs.hoyde-dtm-nhm-25833?service=WCS&version=1.0.0&request=GetCoverage"
                + "&Coverage=nhm_dtm_topo_25833&CRS=EPSG%3A4326&BBOX=6.1800000%2C58.9800000%2C6.2000000%2C58.9900000&WIDTH=16&HEIGHT=16&FORMAT=GeoTIFF", url);
        }
    }
}
