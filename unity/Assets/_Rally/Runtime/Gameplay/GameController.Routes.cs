using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.UI;
using Rally.World;
using UnityEngine;

namespace Rally.Gameplay
{
    /// <summary>
    /// MY ROUTES (plan_20261122 Parts 1 and 2): saving routes, driving them from their stored line, renaming and deleting
    /// them, and keeping each route's 3D world downloaded and pinned in the cache (<see cref="RoutePrefetch"/>).
    /// </summary>
    public sealed partial class GameController
    {
        SavedRouteList routes;
        readonly RoutePrefetch prefetch = new RoutePrefetch();
        readonly Dictionary<string, (CancellationTokenSource cancel, Task run)> downloads = new Dictionary<string, (CancellationTokenSource, Task)>();
        bool fakeSources, downloadsResumed;
        /// <summary>navigator.storage.persist(): null not asked yet, false refused (the browser may clear the downloads).</summary>
        bool? persisted;
        /// <summary>Set by a GENERATE made from START / FINISH place names: the stage's route is saved under this name.</summary>
        string saveAsName;
        /// <summary>The roads the two map pins snapped to (names for a pin route saved with SAVE ROUTE).</summary>
        readonly string[] pinRoads = new string[2];
        float routesSavedAt = float.NegativeInfinity;

        /// <summary>The saved routes (for tests and tools).</summary>
        public SavedRouteList SavedRoutes => routes;
        /// <summary>The download of a saved route still running, or null (for tests and tools).</summary>
        public Task DownloadOf(string id) => downloads.TryGetValue(id, out var d) ? d.run : null;

        void InitRoutes()
        {
            routes = new SavedRouteList(BrowserDom.LocalGet, BrowserDom.LocalSet);
            routes.Changed += ShowRoutes;
            prefetch.Breakers = () => breakers;
            prefetch.Busy = () => world != null && world.GetStats().Pending > 0;   // driving's tiles first
            prefetch.Make = PrefetchSourcesOver;
            prefetch.Delay = FrameDelay;   // counted in frames like WaitUntil: no timer behind it
            ShowRoutes();
        }

        /// <summary>Wait <paramref name="ms"/> of real time a frame at a time (Task.Yield resumes on the next frame).</summary>
        static async Task FrameDelay(double ms, CancellationToken ct)
        {
            float until = Time.realtimeSinceStartup + (float)(ms / 1000);
            while (Time.realtimeSinceStartup < until) { ct.ThrowIfCancellationRequested(); await Task.Yield(); }
        }

        /// <summary>"Lillehammer → Geilo" when both place boxes hold a name, else null (a pin route).</summary>
        static string NamedRoute(List<object> names)
        {
            if (names == null || names.Count < 2 || !(names[0] is string a) || !(names[1] is string b)) return null;
            a = a.Trim(); b = b.Trim();
            return a.Length > 0 && b.Length > 0 ? a + " → " + b : null;
        }

        /// <summary>
        /// The OSRM stage's line: a saved route's stored line when the link is one (no router, so it works offline), else
        /// OSRM; a stage generated from place names is saved here once it is routed.
        /// </summary>
        async Task<List<LatLon>> StageLine()
        {
            string name = saveAsName;
            saveAsName = null;
            var saved = link.Kind == ShareLinks.Kind.Osrm ? routes?.Find(link.A, link.B, link.Profile) : null;
            if (saved != null)
            {
                var line = await SavedLine(saved);
                if (line != null && line.Count >= 2) { RallyLog.Info($"routes: \"{saved.Name}\" drives its saved line ({line.Count} points, no router)"); return line; }
            }
            var result = await router.Route(link.A, link.B, Profile(link.Profile), cts.Token);
            if (name != null && link.Kind == ShareLinks.Kind.Osrm) await SaveRoute(name, link.A, link.B, link.Profile, result.Coordinates, result.DistanceM);
            return result.Coordinates;
        }

        async Task<List<LatLon>> SavedLine(SavedRoute r)
        {
            if (cache == null) return null;
            var bytes = await cache.Fetch(SavedRouteList.GeometryKey(r.Id), () => Task.FromResult<byte[]>(null), "route");
            return bytes == null ? null : Polyline.Decode(Encoding.UTF8.GetString(bytes));
        }

        static double LineLength(IReadOnlyList<LatLon> line)
        {
            double m = 0;
            for (int i = 1; i < line.Count; i++) m += OsrmRouter.Haversine(line[i - 1], line[i]);
            return m;
        }

        /// <summary>Keep a route in MY ROUTES (its line as a pinned cache entry) and start downloading its 3D world.</summary>
        async Task<SavedRoute> SaveRoute(string name, LatLon a, LatLon b, string profile, List<LatLon> line, double lengthM)
        {
            bool first = routes.Routes.Count == 0;
            var r = routes.Add(name, a, b, profile, lengthM > 0 ? lengthM : LineLength(line), DateTime.UtcNow);
            if (cache is GeoCache gc)
            {
                string key = SavedRouteList.GeometryKey(r.Id);
                var text = Encoding.UTF8.GetBytes(Polyline.Encode(line));
                await gc.Fetch(key, () => Task.FromResult(text), "route");
                await gc.Pin(key, r.Id);
            }
            RallyLog.Info($"routes: saved \"{r.Name}\" ({r.LengthM / 1000:0.0} km, {line.Count} points)");
            if (first) AskPersistence();
            StartDownload(r);
            return r;
        }

        /// <summary>The first saved route asks the browser to keep the store (navigator.storage.persist()); the answer shows in MY ROUTES.</summary>
        void AskPersistence()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            IdbBackend.RequestPersistence(OnPersistence);
#else
            persisted = true;   // files on disk: nothing clears them behind our back
#endif
        }

        void OnPersistence(bool granted) { persisted = granted; ShowRoutes(); }

        /// <summary>Map SAVE ROUTE: route the two pins and keep the route, without leaving the map.</summary>
        async Task SaveRouteFromMap(LatLon a, LatLon b, string profile, List<object> names)
        {
            var l = ShareLinks.Parse(ShareLinks.Osrm(a, b, profile)).Value;   // the share link's rounding, so DRIVE finds it again
            BrowserDom.MapStatus("Routing the route to save it…");
            var result = await router.Route(l.A, l.B, Profile(profile), cts.Token);
            string name = NamedRoute(names)
                ?? $"{pinRoads[0] ?? Pair(l.A)} → {pinRoads[1] ?? Pair(l.B)}";
            var r = await SaveRoute(name, l.A, l.B, profile, result.Coordinates, result.DistanceM);
            BrowserDom.MapStatus($"Saved “{r.Name}” in MY ROUTES. Its 3D world downloads in the background.");
        }

        static string Pair(LatLon p) => FormattableString.Invariant($"{p.Lat:0.000},{p.Lon:0.000}");

        async void DriveSavedRoute(string id)
        {
            var r = routes.Get(id);
            if (r == null) return;
            RallyLog.Info($"routes: drive \"{r.Name}\"");
            await LoadStage(ShareLinks.Osrm(r.A, r.B, r.Profile));
            if (!r.Downloaded) StartDownload(r);
        }

        void RenameSavedRoute(string id, string name)
        {
            if (routes.Rename(id, name)) RallyLog.Info($"routes: renamed to \"{routes.Get(id).Name}\"");
        }

        /// <summary>
        /// DELETE (after its YES in the row): the row goes at once, the download is stopped (a load it shares with driving
        /// may still finish, but pins nothing more) and the route's pins go; its data stays as plain LRU entries.
        /// </summary>
        async void DeleteSavedRoute(string id)
        {
            var r = routes.Get(id);
            if (r == null) return;
            if (downloads.TryGetValue(id, out var d)) d.cancel.Cancel();
            routes.Delete(id);
            if (cache is GeoCache gc) await gc.Unpin(id);
            RallyLog.Info($"routes: deleted \"{r.Name}\"; its {r.Bytes / 1048576.0:0.0} MB stay in the cache as normal entries");
            _ = RefreshCacheInfo();
        }

        void StartDownload(SavedRoute r)
        {
            if (fakeSources || !(cache is GeoCache) || downloads.ContainsKey(r.Id) || routes.Get(r.Id) == null) return;
            var cancel = CancellationTokenSource.CreateLinkedTokenSource(cts.Token);
            var run = Download(r, cancel.Token);
            if (!run.IsCompleted) downloads[r.Id] = (cancel, run);
        }

        async Task Download(SavedRoute r, CancellationToken ct)
        {
            await Task.Yield();   // registered in downloads first
            try
            {
                var line = await SavedLine(r);
                if (line == null) { RallyLog.Warn($"routes: \"{r.Name}\" has no saved line in the cache; it downloads when driven again"); r.Status = "cleared"; return; }
                var tiles = RouteTiles.Along(line.ConvertAll(Proj.ToUtm));
                RallyLog.Info($"routes: downloading \"{r.Name}\": fine {tiles.Fine.Count} · coarse {tiles.Coarse.Count} tiles");
                await prefetch.Run(r, tiles, (GeoCache)cache, () => RouteProgress(), ct);
            }
            catch (OperationCanceledException) { if (r.Status == "downloading") r.Status = "partial"; }
            catch (Exception e) { RallyLog.Warn($"routes: download of \"{r.Name}\" stopped: {e.Message}"); r.Status = "partial"; }
            finally
            {
                downloads.Remove(r.Id);
                if (routes.Get(r.Id) != null) routes.Save();
                _ = RefreshCacheInfo();
            }
        }

        /// <summary>A tile landed: the list (and its progress) is written and shown at most once a second.</summary>
        void RouteProgress()
        {
            if (Time.unscaledTime - routesSavedAt < 1f) return;
            routesSavedAt = Time.unscaledTime;
            routes.Save();
        }

        /// <summary>A download left half done by a reload carries on once the first stage is up.</summary>
        void ResumeDownloads()
        {
            if (downloadsResumed) return;
            downloadsResumed = true;
            foreach (var r in routes.Routes.ToArray()) if (r.Status == "downloading") StartDownload(r);
        }

        /// <summary>The player emptied the cache (CLEAR): the downloads and their pins are gone; DRIVE downloads a route again.</summary>
        void OnCacheCleared()
        {
            foreach (var d in downloads.Values) d.cancel.Cancel();
            foreach (var r in routes.Routes) { r.Status = "cleared"; r.FineDone = r.CoarseDone = 0; r.Bytes = 0; }
            routes.Save();
        }

        void ShowRoutes()
        {
            if (routes == null) return;
            string note = persisted == false ? "downloads may be cleared by the browser (storage not made persistent)" : "";
            var rows = new List<HudController.RouteRow>();
            var json = new List<object>();
            foreach (var r in routes.Routes)
            {
                string info = r.Info();
                rows.Add(new HudController.RouteRow { Id = r.Id, Name = r.Name, Info = info });
                json.Add(new Dictionary<string, object> { { "id", r.Id }, { "name", r.Name }, { "info", info } });
            }
            Hud?.SetRoutes(rows, note);
            BrowserDom.MapSetRoutes(Json.Stringify(json), note);
        }

        /// <summary>The live sources again, over one download's pinning view of the cache, with driving's query boxes.</summary>
        PrefetchSources PrefetchSourcesOver(IGeoCache c)
        {
            var overpass = new OverpassSource(c, overpassMirrors ??= new OverpassMirrors()) { Contains = cache is GeoCache gc ? gc.Contains : (Func<string, Task<bool>>)null };   // the same mirrors and slots as driving
            var demSource = new KartverketDem(c);
            var sr16 = new Sr16Source(c);
            var nvdb = new NvdbSource(c);
            return new PrefetchSources
            {
                Dem = async (key, ct) =>
                {
                    var grid = await demSource.Fetch(key.Bounds, key.CellM, ct);
                    bool ok = grid != null && grid.N == TileScheduler.Samples;
                    grid?.Dispose();
                    return ok;
                },
                RoadRegion = async (r, ct) => await overpass.FetchRoadsJson(LatLonBounds.Of(r.Bounds), ct) != null,
                OldTile = (b, ct) => overpass.HasOldTile(b),
                Roads = overpass.FetchRoads, Features = overpass.FetchFeatures, Cover = sr16.FetchCover,
                Surfaces = nvdb.FetchSurfaces, Signs = nvdb.FetchSigns, Lights = nvdb.FetchLights,
                SurfaceBounds = RoadGraph.SurfaceQueryBounds, LightBounds = LightQueryBounds,
            };
        }
    }
}
