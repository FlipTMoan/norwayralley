using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using AOT;

namespace Rally.Geo
{
    /// <summary>
    /// The browser store: the IndexedDB database <c>rally-cache</c> / store <c>entries</c> that cache.js
    /// created, with the same record shape <c>{ key, kind, value, size, at }</c>, so a JS client and the
    /// Unity client share one cache on the same origin. Text entries are stored as the parsed JSON
    /// object (what the JS client expects) and come back stringified; binary entries are ArrayBuffers,
    /// and a Blob (the JS SR16 tiles) is read back as bytes. The work is done in
    /// <c>Plugins/WebGL/idb.jslib</c>; every call carries a request id and completes a Task from the
    /// static callbacks below.
    /// </summary>
    public sealed class IdbBackend : ICacheBackend
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] static extern void RallyIdbOpen(int id, BoolCallback cb);
        [DllImport("__Internal")] static extern void RallyIdbGet(int id, string key, GetCallback cb);
        [DllImport("__Internal")] static extern void RallyIdbPut(int id, string key, string kind, byte[] value, int length, int isText, double size, double at, BoolCallback cb);
        [DllImport("__Internal")] static extern void RallyIdbDelete(int id, string key, BoolCallback cb);
        [DllImport("__Internal")] static extern void RallyIdbClear(int id, BoolCallback cb);
        [DllImport("__Internal")] static extern void RallyIdbAddPin(int id, string key, string pin, BoolCallback cb);
        [DllImport("__Internal")] static extern void RallyIdbRemovePin(int id, string pin, BoolCallback cb);
        [DllImport("__Internal")] static extern void RallyIdbList(int id, StringCallback cb);
        [DllImport("__Internal")] static extern void RallyIdbFree(IntPtr ptr);
        [DllImport("__Internal")] static extern void RallyStoragePersist(PersistCallback cb);
        [DllImport("__Internal")] static extern void RallyStorageEstimate(int id, EstimateCallback cb);
#else
        static void RallyIdbOpen(int id, BoolCallback cb) => cb(id, 0);
        static void RallyIdbGet(int id, string key, GetCallback cb) => cb(id, 0, IntPtr.Zero, 0, 0, null, 0, 0);
        static void RallyIdbPut(int id, string key, string kind, byte[] value, int length, int isText, double size, double at, BoolCallback cb) => cb(id, 0);
        static void RallyIdbDelete(int id, string key, BoolCallback cb) => cb(id, 0);
        static void RallyIdbClear(int id, BoolCallback cb) => cb(id, 0);
        static void RallyIdbAddPin(int id, string key, string pin, BoolCallback cb) => cb(id, 0);
        static void RallyIdbRemovePin(int id, string pin, BoolCallback cb) => cb(id, 0);
        static void RallyIdbList(int id, StringCallback cb) => cb(id, "[]");
        static void RallyIdbFree(IntPtr ptr) { }
        static void RallyStoragePersist(PersistCallback cb) => cb(0);
        static void RallyStorageEstimate(int id, EstimateCallback cb) => cb(id, -1, -1);
#endif

        public delegate void BoolCallback(int id, int ok);
        public delegate void StringCallback(int id, string json);
        public delegate void PersistCallback(int granted);
        /// <summary>found, value pointer + length (malloc'd by JS; freed here), isText, kind, size, at.</summary>
        public delegate void EstimateCallback(int id, double quota, double usage);
        public delegate void GetCallback(int id, int found, IntPtr value, int length, int isText, string kind, double size, double at);

        static readonly Dictionary<int, object> waiting = new Dictionary<int, object>();
        static int nextId = 1;

        static int Register<T>(TaskCompletionSource<T> tcs) { int id = nextId++; waiting[id] = tcs; return id; }
        static TaskCompletionSource<T> Take<T>(int id)
        {
            if (!waiting.TryGetValue(id, out var o)) return null;
            waiting.Remove(id);
            return (TaskCompletionSource<T>)o;
        }

        [MonoPInvokeCallback(typeof(BoolCallback))]
        static void OnBool(int id, int ok) => Take<bool>(id)?.TrySetResult(ok != 0);

        [MonoPInvokeCallback(typeof(StringCallback))]
        static void OnString(int id, string json) => Take<string>(id)?.TrySetResult(json);

        [MonoPInvokeCallback(typeof(EstimateCallback))]
        static void OnEstimate(int id, double quota, double usage)
        {
            if (waiting.TryGetValue(id, out var t) && t is TaskCompletionSource<StorageRoom> tcs)
            {
                waiting.Remove(id);
                tcs.TrySetResult(new StorageRoom(-1, -1, quota < 0 ? -1 : (long)quota, usage < 0 ? -1 : (long)usage));
            }
        }

        /// <summary>The browser's quota and the origin's usage (navigator.storage.estimate); the disk itself is hidden from web pages.</summary>
        public Task<StorageRoom> Room()
        {
            var tcs = new TaskCompletionSource<StorageRoom>();
            RallyStorageEstimate(Register(tcs), OnEstimate);
            return tcs.Task;
        }

        [MonoPInvokeCallback(typeof(GetCallback))]
        static void OnGet(int id, int found, IntPtr value, int length, int isText, string kind, double size, double at)
        {
            var tcs = Take<CacheEntry>(id);
            if (tcs == null) return;
            if (found == 0) { tcs.TrySetResult(null); return; }
            var bytes = new byte[length];
            if (length > 0) Marshal.Copy(value, bytes, 0, length);
            RallyIdbFree(value);
            tcs.TrySetResult(new CacheEntry { Value = bytes, IsText = isText != 0, Kind = kind, Size = (long)size, At = at });
        }

        Task<bool> available;

        public Task<bool> Available()
        {
            if (available != null) return available;
            var tcs = new TaskCompletionSource<bool>();
            RallyIdbOpen(Register(tcs), OnBool);
            available = tcs.Task;
            return available;
        }

        public async Task<CacheEntry> Get(string key)
        {
            if (!await Available()) return null;
            var tcs = new TaskCompletionSource<CacheEntry>();
            RallyIdbGet(Register(tcs), key, OnGet);
            var e = await tcs.Task;
            if (e != null) e.Key = key;
            return e;
        }

        public async Task Put(CacheEntry e)
        {
            if (!await Available()) return;
            var tcs = new TaskCompletionSource<bool>();
            RallyIdbPut(Register(tcs), e.Key, e.Kind ?? "data", e.Value, e.Value.Length, e.IsText ? 1 : 0, e.Size, e.At, OnBool);
            if (!await tcs.Task) throw new InvalidOperationException("IndexedDB put failed");
        }

        public async Task Delete(string key)
        {
            if (!await Available()) return;
            var tcs = new TaskCompletionSource<bool>();
            RallyIdbDelete(Register(tcs), key, OnBool);
            await tcs.Task;
        }

        public async Task<bool> AddPin(string key, string pin)
        {
            if (!await Available()) return false;
            var tcs = new TaskCompletionSource<bool>();
            RallyIdbAddPin(Register(tcs), key, pin, OnBool);
            return await tcs.Task;
        }

        public async Task RemovePin(string pin)
        {
            if (!await Available()) return;
            var tcs = new TaskCompletionSource<bool>();
            RallyIdbRemovePin(Register(tcs), pin, OnBool);
            await tcs.Task;
        }

        public async Task Clear()
        {
            if (!await Available()) return;
            var tcs = new TaskCompletionSource<bool>();
            RallyIdbClear(Register(tcs), OnBool);
            await tcs.Task;
        }

        public async Task<List<CacheEntryInfo>> ListByAge()
        {
            var list = new List<CacheEntryInfo>();
            if (!await Available()) return list;
            var tcs = new TaskCompletionSource<string>();
            RallyIdbList(Register(tcs), OnString);
            var json = await tcs.Task;
            if (!(Json.Parse(json) is List<object> rows)) return list;
            foreach (var row in rows)
            {
                if (!(row is Dictionary<string, object> r)) continue;
                list.Add(new CacheEntryInfo(r.Str("key"), r.Str("kind"), (long)r.Num("size", 0), r.Num("at", 0), r.Str("pins")));
            }
            return list; // the jslib reads the `at` index cursor, so rows arrive oldest first
        }

        static Action<bool> persisted;

        [MonoPInvokeCallback(typeof(PersistCallback))]
        static void OnPersist(int granted) { var cb = persisted; persisted = null; cb?.Invoke(granted != 0); }

        /// <summary>
        /// cache.js <c>requestPersistence</c>: ask the browser to keep the store across storage pressure
        /// (<c>navigator.storage.persist()</c>); <paramref name="done"/> hears whether it was granted (false outside the browser).
        /// </summary>
        public static void RequestPersistence(Action<bool> done = null) { persisted = done; RallyStoragePersist(OnPersist); }
    }
}
