using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Rally.Geo
{
    /// <summary>
    /// Editor / standalone store: one <c>&lt;sha1(key)&gt;.bin</c> plus a <c>.meta</c> line file per entry under
    /// <c>Application.persistentDataPath/rally-cache</c>, so the game works (and stays fast) outside the browser.
    /// Synchronous file IO wrapped in completed tasks: these sizes are small and it is not the web build.
    /// </summary>
    public sealed class FileBackend : ICacheBackend
    {
        readonly string root;

        public FileBackend(string root)
        {
            this.root = root;
            Directory.CreateDirectory(root);
        }

        /// <summary>A different store for <see cref="Default"/> (the editor preview's empty-cache loading survey); null: the usual one.</summary>
        public static string RootOverride;

        public static FileBackend Default() => new FileBackend(RootOverride ?? Path.Combine(UnityEngine.Application.persistentDataPath, "rally-cache"));

        static string Hash(string key)
        {
            using var sha = SHA1.Create();
            var h = sha.ComputeHash(Encoding.UTF8.GetBytes(key));
            var sb = new StringBuilder(h.Length * 2);
            foreach (var b in h) sb.Append(b.ToString("x2"));
            return sb.ToString();
        }

        string Bin(string key) => Path.Combine(root, Hash(key) + ".bin");
        string Meta(string key) => Path.Combine(root, Hash(key) + ".meta");

        public Task<bool> Available() => Task.FromResult(Directory.Exists(root));

        /// <summary>The disk the cache folder lives on: exact total and free bytes (DriveInfo), so 10 % can be kept free.</summary>
        public Task<StorageRoom> Room()
        {
            try
            {
                var drive = new DriveInfo(Path.GetPathRoot(Path.GetFullPath(root)));
                return Task.FromResult(new StorageRoom(drive.TotalSize, drive.AvailableFreeSpace, -1, -1));
            }
            catch (Exception) { return Task.FromResult(StorageRoom.Unknown); }
        }

        public Task<CacheEntry> Get(string key)
        {
            var meta = Meta(key);
            if (!File.Exists(meta)) return Task.FromResult<CacheEntry>(null);
            var e = ReadMeta(File.ReadAllLines(meta));
            e.Value = File.ReadAllBytes(Bin(key));
            return Task.FromResult(e);
        }

        public Task Put(CacheEntry entry)
        {
            File.WriteAllBytes(Bin(entry.Key), entry.Value);
            string meta = Meta(entry.Key), pins = "";
            if (File.Exists(meta)) { try { pins = ReadPins(File.ReadAllLines(meta)); } catch (Exception) { /* a broken meta file has no pins */ } }
            WriteMeta(meta, entry, pins);
            return Task.CompletedTask;
        }

        static void WriteMeta(string path, CacheEntry e, string pins) => File.WriteAllLines(path, new[]
        {
            e.Key, e.Kind ?? "data", e.Size.ToString(CultureInfo.InvariantCulture),
            e.At.ToString("R", CultureInfo.InvariantCulture), e.IsText ? "text" : "bytes", pins ?? "",
        });

        /// <summary>Line 6 of a meta file: the saved routes that pin the entry (absent in files written before 2026-11-22).</summary>
        static string ReadPins(string[] lines) => lines.Length > 5 ? lines[5] : "";

        public Task<bool> AddPin(string key, string id)
        {
            var meta = Meta(key);
            if (!File.Exists(meta)) return Task.FromResult(false);
            var lines = File.ReadAllLines(meta);
            WriteMeta(meta, ReadMeta(lines), CachePins.Add(ReadPins(lines), id));
            return Task.FromResult(true);
        }

        public Task RemovePin(string id)
        {
            foreach (var f in Directory.GetFiles(root, "*.meta"))
            {
                try
                {
                    var lines = File.ReadAllLines(f);
                    var pins = ReadPins(lines);
                    if (CachePins.Has(pins, id)) WriteMeta(f, ReadMeta(lines), CachePins.Remove(pins, id));
                }
                catch (Exception) { /* a half-written meta file is skipped, as in ListByAge */ }
            }
            return Task.CompletedTask;
        }

        public Task Delete(string key)
        {
            File.Delete(Bin(key));
            File.Delete(Meta(key));
            return Task.CompletedTask;
        }

        public Task Clear()
        {
            foreach (var f in Directory.GetFiles(root)) File.Delete(f);
            return Task.CompletedTask;
        }

        public Task<List<CacheEntryInfo>> ListByAge()
        {
            var list = new List<CacheEntryInfo>();
            foreach (var f in Directory.GetFiles(root, "*.meta"))
            {
                try { var lines = File.ReadAllLines(f); var e = ReadMeta(lines); list.Add(new CacheEntryInfo(e.Key, e.Kind, e.Size, e.At, ReadPins(lines))); }
                catch (Exception) { /* a half-written meta file is simply not listed */ }
            }
            list.Sort((a, b) => a.At.CompareTo(b.At));
            return Task.FromResult(list);
        }

        static CacheEntry ReadMeta(string[] lines)
        {
            return new CacheEntry
            {
                Key = lines[0], Kind = lines[1],
                Size = long.Parse(lines[2], CultureInfo.InvariantCulture),
                At = double.Parse(lines[3], CultureInfo.InvariantCulture),
                IsText = lines.Length > 4 && lines[4] == "text",
            };
        }
    }
}
