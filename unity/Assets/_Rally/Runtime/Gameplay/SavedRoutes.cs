using System;
using System.Collections.Generic;
using System.Globalization;
using Rally.Core;
using Rally.Geo;

namespace Rally.Gameplay
{
    /// <summary>
    /// One route in MY ROUTES: the two picks and the profile (what the share link carries), its name, length, when it was
    /// saved and how much of its 3D world is downloaded. The OSRM line itself is a pinned cache entry
    /// (<see cref="SavedRouteList.GeometryKey"/>, polyline6), so the list in localStorage stays small.
    /// </summary>
    public sealed class SavedRoute
    {
        public string Id, Name, Profile = "driving", Date;
        public LatLon A, B;
        public double LengthM;
        /// <summary>Download state: "" not started, "downloading", "done", "partial" (some tiles got no answer), "cleared" (the cache was emptied).</summary>
        public string Status = "";
        public int FineDone, FineTotal, CoarseDone, CoarseTotal;
        public long Bytes;

        public bool Downloaded => Status == "done";
        public int Percent => FineTotal + CoarseTotal == 0 ? 0 : (int)Math.Floor(100.0 * (FineDone + CoarseDone) / (FineTotal + CoarseTotal));

        /// <summary>The row's second line: "12.3 km · cached 100 %, 38 MB · fine 412/412 · coarse 38/38".</summary>
        public string Info()
        {
            string km = (LengthM / 1000).ToString("0.0", CultureInfo.InvariantCulture) + " km";
            string mb = (Bytes / 1048576.0).ToString("0", CultureInfo.InvariantCulture) + " MB";
            string tiles = $"fine {FineDone}/{FineTotal} · coarse {CoarseDone}/{CoarseTotal}";
            switch (Status)
            {
                case "done": return $"{km} · cached 100 %, {mb} · {tiles}";
                case "downloading": return $"{km} · downloading {Percent} %, {mb} · {tiles}";
                case "partial": return $"{km} · cached {Percent} %, {mb} · {tiles} (some data did not answer; DRIVE tries again)";
                case "cleared": return $"{km} · not downloaded (cache cleared; DRIVE downloads it again)";
                default: return $"{km} · not downloaded yet";
            }
        }
    }

    /// <summary>
    /// MY ROUTES (plan_20261122 Part 1): the saved routes as JSON in localStorage <c>rally.routes</c> (PlayerPrefs-like
    /// memory outside the browser, see BrowserDom), newest first. No limit on the count; names are plain text of at most
    /// <see cref="MaxName"/> characters. A route made from START/FINISH place names is added when its stage is generated;
    /// a pin route only through SAVE ROUTE.
    /// </summary>
    public sealed class SavedRouteList
    {
        public const string StorageKey = "rally.routes";
        public const int MaxName = 60;
        /// <summary>Two picks closer than this (degrees, ~1 m) are the same pick: the share link rounds to 5 decimals.</summary>
        const double Same = 2e-5;

        readonly Func<string, string> get;
        readonly Action<string, string> set;
        public readonly List<SavedRoute> Routes = new List<SavedRoute>();
        public event Action Changed;

        public SavedRouteList(Func<string, string> get, Action<string, string> set)
        {
            this.get = get; this.set = set;
            Load();
        }

        /// <summary>The cache key of a route's OSRM line (polyline6 text), pinned by the route itself.</summary>
        public static string GeometryKey(string id) => "route:" + id;

        /// <summary>Trimmed, line breaks as spaces, at most <see cref="MaxName"/> characters; null when nothing is left.</summary>
        public static string CleanName(string name)
        {
            if (name == null) return null;
            name = name.Replace('\r', ' ').Replace('\n', ' ').Replace('\t', ' ').Trim();
            if (name.Length > MaxName) name = name.Substring(0, MaxName).TrimEnd();
            return name.Length == 0 ? null : name;
        }

        public SavedRoute Get(string id) => Routes.Find(r => r.Id == id);

        public SavedRoute Find(LatLon a, LatLon b, string profile) => Routes.Find(r =>
            r.Profile == (profile ?? "driving") && Math.Abs(r.A.Lat - a.Lat) < Same && Math.Abs(r.A.Lon - a.Lon) < Same
            && Math.Abs(r.B.Lat - b.Lat) < Same && Math.Abs(r.B.Lon - b.Lon) < Same);

        /// <summary>Save a route (newest first); the same picks and profile again return the route already saved.</summary>
        public SavedRoute Add(string name, LatLon a, LatLon b, string profile, double lengthM, DateTime now)
        {
            var old = Find(a, b, profile);
            if (old != null) return old;
            var r = new SavedRoute
            {
                Id = "r" + now.Ticks.ToString("x", CultureInfo.InvariantCulture),
                Name = CleanName(name) ?? "Route", A = a, B = b, Profile = profile ?? "driving", LengthM = lengthM,
                Date = now.ToUniversalTime().ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture),
            };
            while (Get(r.Id) != null) r.Id += "x";
            Routes.Insert(0, r);
            Save();
            return r;
        }

        public bool Rename(string id, string name)
        {
            var r = Get(id);
            var clean = CleanName(name);
            if (r == null || clean == null) return false;
            r.Name = clean;
            Save();
            return true;
        }

        public bool Delete(string id)
        {
            int i = Routes.FindIndex(r => r.Id == id);
            if (i < 0) return false;
            Routes.RemoveAt(i);
            Save();
            return true;
        }

        public void Save()
        {
            var list = new List<object>();
            foreach (var r in Routes)
                list.Add(new Dictionary<string, object>
                {
                    { "id", r.Id }, { "name", r.Name }, { "profile", r.Profile }, { "date", r.Date ?? "" },
                    { "a", new List<object> { r.A.Lat, r.A.Lon } }, { "b", new List<object> { r.B.Lat, r.B.Lon } },
                    { "km", Math.Round(r.LengthM / 1000, 3) }, { "status", r.Status ?? "" },
                    { "fine", new List<object> { (double)r.FineDone, (double)r.FineTotal } },
                    { "coarse", new List<object> { (double)r.CoarseDone, (double)r.CoarseTotal } }, { "bytes", (double)r.Bytes },
                });
            set(StorageKey, Json.Stringify(list));
            Changed?.Invoke();
        }

        void Load()
        {
            Routes.Clear();
            string text = get(StorageKey);
            if (string.IsNullOrEmpty(text)) return;
            List<object> rows;
            try { rows = Json.Parse(text) as List<object>; }
            catch (Exception e) { RallyLog.Warn($"routes: {StorageKey} is not readable ({e.Message}); starting an empty list"); return; }
            if (rows == null) return;
            foreach (var o in rows)
            {
                if (!(o is Dictionary<string, object> d)) continue;
                var a = d.Arr("a"); var b = d.Arr("b");
                if (d.Str("id") == null || a == null || b == null || a.Count < 2 || b.Count < 2) continue;
                var fine = d.Arr("fine"); var coarse = d.Arr("coarse");
                Routes.Add(new SavedRoute
                {
                    Id = d.Str("id"), Name = CleanName(d.Str("name")) ?? "Route", Profile = d.Str("profile") ?? "driving", Date = d.Str("date"),
                    A = new LatLon((double)a[0], (double)a[1]), B = new LatLon((double)b[0], (double)b[1]),
                    LengthM = d.Num("km", 0) * 1000, Status = d.Str("status") ?? "", Bytes = (long)d.Num("bytes", 0),
                    FineDone = Int(fine, 0), FineTotal = Int(fine, 1), CoarseDone = Int(coarse, 0), CoarseTotal = Int(coarse, 1),
                });
            }
        }

        static int Int(List<object> l, int i) => l != null && i < l.Count && l[i] is double v ? (int)v : 0;
    }
}
