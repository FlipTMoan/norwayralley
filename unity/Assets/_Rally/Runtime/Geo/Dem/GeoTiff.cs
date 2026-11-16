using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;

namespace Rally.Geo
{
    /// <summary>A decoded single-band raster, row 0 = north (top), as geotiff.js <c>readRasters</c> returns it.</summary>
    public sealed class GeoTiffImage
    {
        public int Width, Height;
        public float[] Samples;
        /// <summary>ModelPixelScale (33550): degrees or metres per pixel in x and y.</summary>
        public double ScaleX, ScaleY;
        /// <summary>ModelTiepoint (33922): model coordinate of the raster's top-left pixel corner.</summary>
        public double OriginX, OriginY;
        /// <summary>GDAL_NODATA (42113) when present, NaN otherwise.</summary>
        public float NoData = float.NaN;
    }

    /// <summary>
    /// The minimal GeoTIFF reader the DEM path needs. worldgen.js hands the Kartverket WCS answer to
    /// geotiff.js; what the service actually returns (checked against a live GetCoverage) is a classic
    /// little-endian TIFF, one Float32 sample per pixel, tiled 128×128, uncompressed. This reads that,
    /// plus strips, big-endian, Deflate (8 / 32946, via <see cref="DeflateStream"/> after the zlib header)
    /// and 16/32-bit integer samples, so a change of server settings does not break the game silently.
    /// Anything else (LZW, JPEG, predictors, BigTIFF, multi-band) throws with a clear message.
    /// </summary>
    public static class GeoTiff
    {
        // TIFF tags
        const int ImageWidth = 256, ImageLength = 257, BitsPerSample = 258, Compression = 259, StripOffsets = 273,
            SamplesPerPixel = 277, RowsPerStrip = 278, StripByteCounts = 279, PlanarConfig = 284, Predictor = 317,
            TileWidth = 322, TileLength = 323, TileOffsets = 324, TileByteCounts = 325, SampleFormat = 339,
            ModelPixelScale = 33550, ModelTiepoint = 33922, GdalNoData = 42113;

        public static GeoTiffImage Decode(byte[] data)
        {
            if (data == null || data.Length < 8) throw new FormatException("GeoTIFF: file too short");
            bool le = data[0] == 'I' && data[1] == 'I';
            if (!le && !(data[0] == 'M' && data[1] == 'M')) throw new FormatException("GeoTIFF: not a TIFF (bad byte order mark)");
            var r = new Reader(data, le);
            int magic = r.U16(2);
            if (magic == 43) throw new FormatException("GeoTIFF: BigTIFF is not supported");
            if (magic != 42) throw new FormatException("GeoTIFF: bad magic number");
            uint ifd = r.U32(4);
            var tags = ReadIfd(r, ifd);

            var img = new GeoTiffImage { Width = (int)Scalar(tags, ImageWidth), Height = (int)Scalar(tags, ImageLength) };
            int bits = (int)Scalar(tags, BitsPerSample, 32);
            int spp = (int)Scalar(tags, SamplesPerPixel, 1);
            int format = (int)Scalar(tags, SampleFormat, 1); // 1 uint, 2 int, 3 float
            int compression = (int)Scalar(tags, Compression, 1);
            int predictor = (int)Scalar(tags, Predictor, 1);
            if (spp != 1) throw new FormatException($"GeoTIFF: {spp} samples per pixel, expected 1");
            if (predictor != 1) throw new FormatException($"GeoTIFF: predictor {predictor} is not supported");
            if (compression != 1 && compression != 8 && compression != 32946)
                throw new FormatException($"GeoTIFF: compression {compression} is not supported (only none / Deflate)");
            if (!((format == 3 && bits == 32) || (format != 3 && (bits == 16 || bits == 32))))
                throw new FormatException($"GeoTIFF: sample format {format} / {bits} bits is not supported");
            if (Scalar(tags, PlanarConfig, 1) != 1) throw new FormatException("GeoTIFF: planar configuration 2 is not supported");

            if (tags.TryGetValue(ModelPixelScale, out var scale) && scale.Count >= 2) { img.ScaleX = r.Double(scale, 0); img.ScaleY = r.Double(scale, 1); }
            if (tags.TryGetValue(ModelTiepoint, out var tie) && tie.Count >= 6) { img.OriginX = r.Double(tie, 3) - r.Double(tie, 0) * img.ScaleX; img.OriginY = r.Double(tie, 4) + r.Double(tie, 1) * img.ScaleY; }
            if (tags.TryGetValue(GdalNoData, out var nd))
            {
                var s = r.Ascii(nd).Trim();
                if (float.TryParse(s, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var f)) img.NoData = f;
            }

            img.Samples = new float[img.Width * img.Height];
            int bytesPer = bits / 8;

            if (tags.ContainsKey(TileOffsets))
            {
                int tw = (int)Scalar(tags, TileWidth), th = (int)Scalar(tags, TileLength);
                var offsets = tags[TileOffsets]; var counts = tags[TileByteCounts];
                int across = (img.Width + tw - 1) / tw, down = (img.Height + th - 1) / th;
                if (offsets.Count < across * down) throw new FormatException("GeoTIFF: tile offsets do not cover the image");
                for (int ty = 0; ty < down; ty++)
                for (int tx = 0; tx < across; tx++)
                {
                    int i = ty * across + tx;
                    var block = Block(r, data, (long)r.Value(offsets, i), (int)r.Value(counts, i), compression, tw * th * bytesPer);
                    int w = Math.Min(tw, img.Width - tx * tw), h = Math.Min(th, img.Height - ty * th);
                    for (int y = 0; y < h; y++)
                        Row(r, block, y * tw * bytesPer, img.Samples, (ty * th + y) * img.Width + tx * tw, w, format, bits);
                }
            }
            else if (tags.ContainsKey(StripOffsets))
            {
                int rps = (int)Math.Min(Scalar(tags, RowsPerStrip, img.Height), img.Height);
                var offsets = tags[StripOffsets]; var counts = tags[StripByteCounts];
                int strips = (img.Height + rps - 1) / rps;
                if (offsets.Count < strips) throw new FormatException("GeoTIFF: strip offsets do not cover the image");
                for (int s = 0; s < strips; s++)
                {
                    int rows = Math.Min(rps, img.Height - s * rps);
                    var block = Block(r, data, (long)r.Value(offsets, s), (int)r.Value(counts, s), compression, rows * img.Width * bytesPer);
                    for (int y = 0; y < rows; y++)
                        Row(r, block, y * img.Width * bytesPer, img.Samples, (s * rps + y) * img.Width, img.Width, format, bits);
                }
            }
            else throw new FormatException("GeoTIFF: neither strips nor tiles");
            return img;
        }

        /// <summary>One strip or tile as raw sample bytes, inflated when the file is Deflate-compressed.</summary>
        static ArraySegment<byte> Block(Reader r, byte[] data, long offset, int count, int compression, int expected)
        {
            if (offset < 0 || offset + count > data.Length) throw new FormatException("GeoTIFF: block outside the file");
            if (compression == 1) return new ArraySegment<byte>(data, (int)offset, count);
            // 8 / 32946 = zlib stream: a 2-byte header, raw deflate, 4-byte Adler-32 (DeflateStream ignores the tail).
            var outBuf = new byte[expected];
            using var src = new MemoryStream(data, (int)offset + 2, count - 2);
            using var z = new DeflateStream(src, CompressionMode.Decompress);
            int got = 0;
            while (got < expected)
            {
                int n = z.Read(outBuf, got, expected - got);
                if (n <= 0) break;
                got += n;
            }
            return new ArraySegment<byte>(outBuf, 0, got);
        }

        static void Row(Reader r, ArraySegment<byte> block, int srcOffset, float[] dst, int dstOffset, int count, int format, int bits)
        {
            int bytesPer = bits / 8;
            int src = block.Offset + srcOffset;
            var buf = block.Array;
            if (src + count * bytesPer > block.Offset + block.Count) throw new FormatException("GeoTIFF: block shorter than its rows");
            for (int x = 0; x < count; x++, src += bytesPer)
            {
                float v;
                if (format == 3) v = r.F32(buf, src);
                else if (bits == 16) v = format == 2 ? (short)r.U16(buf, src) : r.U16(buf, src);
                else v = format == 2 ? (int)r.U32(buf, src) : r.U32(buf, src);
                dst[dstOffset + x] = v;
            }
        }

        static double Scalar(Dictionary<int, Entry> tags, int tag, double fallback = double.NaN)
        {
            if (!tags.TryGetValue(tag, out var e))
            {
                if (double.IsNaN(fallback)) throw new FormatException($"GeoTIFF: missing tag {tag}");
                return fallback;
            }
            return e.Reader.Value(e, 0);
        }

        static Dictionary<int, Entry> ReadIfd(Reader r, uint ifd)
        {
            var tags = new Dictionary<int, Entry>();
            int n = r.U16((int)ifd);
            for (int i = 0; i < n; i++)
            {
                int at = (int)ifd + 2 + i * 12;
                var e = new Entry { Tag = r.U16(at), Type = r.U16(at + 2), Count = (int)r.U32(at + 4), Reader = r };
                int size = TypeSize(e.Type) * e.Count;
                e.Offset = size <= 4 ? at + 8 : (int)r.U32(at + 8);
                tags[e.Tag] = e;
            }
            return tags;
        }

        static int TypeSize(int type)
        {
            switch (type)
            {
                case 1: case 2: case 6: case 7: return 1;
                case 3: case 8: return 2;
                case 4: case 9: case 11: return 4;
                case 5: case 10: case 12: case 16: case 17: case 18: return 8;
                default: return 1;
            }
        }

        sealed class Entry { public int Tag, Type, Count, Offset; public Reader Reader; }

        /// <summary>Endian-aware field access over the file bytes.</summary>
        sealed class Reader
        {
            readonly byte[] d;
            readonly bool le;
            public Reader(byte[] data, bool littleEndian) { d = data; le = littleEndian; }

            public int U16(int at) => U16(d, at);
            public uint U32(int at) => U32(d, at);
            public int U16(byte[] b, int at) => le ? b[at] | (b[at + 1] << 8) : (b[at] << 8) | b[at + 1];
            public uint U32(byte[] b, int at) => le
                ? (uint)(b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24))
                : (uint)((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]);
            public float F32(byte[] b, int at) => BitConverter.Int32BitsToSingle((int)U32(b, at));
            public double F64(int at)
            {
                ulong u = le ? (ulong)U32(d, at) | ((ulong)U32(d, at + 4) << 32) : ((ulong)U32(d, at) << 32) | U32(d, at + 4);
                return BitConverter.Int64BitsToDouble((long)u);
            }

            /// <summary>Numeric element i of an entry (SHORT, LONG, DOUBLE).</summary>
            public double Value(Entry e, int i)
            {
                switch (e.Type)
                {
                    case 3: return U16(e.Offset + i * 2);
                    case 4: return U32(e.Offset + i * 4);
                    case 1: return d[e.Offset + i];
                    case 11: return F32(d, e.Offset + i * 4);
                    case 12: return F64(e.Offset + i * 8);
                    default: throw new FormatException($"GeoTIFF: unexpected type {e.Type} for tag {e.Tag}");
                }
            }
            public double Double(Entry e, int i) => Value(e, i);
            public string Ascii(Entry e) => System.Text.Encoding.ASCII.GetString(d, e.Offset, Math.Max(0, e.Count - 1));
        }
    }
}
