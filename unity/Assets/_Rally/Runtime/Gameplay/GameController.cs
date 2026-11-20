using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Actors;
using Rally.Core;
using Rally.Geo;
using Rally.Net;
using Rally.Presentation;
using Rally.Roads;
using Rally.Track;
using Rally.UI;
using Rally.Vehicle;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.InputSystem;

namespace Rally.Gameplay
{
    /// <summary>
    /// The composition root: what legacy-js/src/main.js did. One MonoBehaviour in the bootstrap scene (see
    /// SCENE.md) that reads the share link, builds the geodata sources, streams the world, makes the route,
    /// spawns the car and wires the camera, HUD, actors, friends session and the endless-stage loop.
    /// Every subsystem stays ignorant of the others: this class is the only place that knows them all, and it
    /// holds no game rules of its own (those live in GameFlow, CarSim, ActorManager, RoadWalk …).
    /// Streaming is never allowed to stall a frame: fetches run as tasks, their results queue up and one is
    /// applied per frame (one carve / upload per frame, the stream.js budget).
    /// </summary>
    public sealed class GameController : MonoBehaviour
    {
        #region Inspector

        [Header("Assets")]
        public WorldStyleSO Style;
        [Tooltip("Carve.compute (WebGPU); with none, or without compute support, the Burst CarveJob runs instead.")]
        public ComputeShader CarveShader;
        [Tooltip("Prefab with CarController (+ CarEffects, CarDamageVisual, CarAudio). Its Kind field picks the garage car. Used when CarPrefabs is empty.")]
        public GameObject CarPrefab;
        [Tooltip("The cars on the start-screen chooser, in order (each prefab's CarController.Kind says which car it is). The choice is kept in localStorage rally.car.")]
        public GameObject[] CarPrefabs;
        public ActorSetSO ActorSet;
        [Tooltip("Road ribbon materials: sub-mesh 0 tarmac, 1 gravel (RibbonMesh).")]
        public Material TarmacMaterial, GravelMaterial;

        [Header("Scene")]
        public Camera MainCamera;
        public CameraRig Rig;
        public SkyAndTime Sky;
        public HudController Hud;
        public GhostCarView Ghosts;

        [Header("Editor run")]
        [Tooltip("Offline FakeSources instead of the live services. The web build always uses the live ones.")]
        public bool UseFakeSources = true;
        [Tooltip("Stands in for the page URL in the editor: ?drive=LAT,LON | ?route=osrm:LAT,LON;LAT,LON;driving | ?seed=HEX;LAT,LON")]
        public string EditorQuery = "?drive=59.0320,6.0650";

        [Header("Stage")]
        [Range(0, 6)] [Tooltip("Animal / people encounters per km of stage (0 = none).")]
        public float ActorDensity = 2f;
        [Tooltip("Metres between the car and a fine tile's edge under which the tile waits (≤ 3 s) before replacing the coarse ground.")]
        public float FineTileHoldDistance = 30f;

        #endregion

        #region State

        /// <summary>Where free drive starts without a link (Sauda, as the JS default pins).</summary>
        static readonly LatLon DefaultStart = new LatLon(59.6500, 6.3500);

        ShareLinks.Link link;
        Utm33 anchor;                        // the room's shared frame origin (stage start), see WireToWorld
        readonly CancellationTokenSource cts = new CancellationTokenSource();

        // Geo
        IGeoCache cache;
        IDemSource dem;
        IRoadSource roadSource;
        IFeatureSource featureSource;
        ILandcoverSource landcoverSource;
        NvdbSource surfaceSource;            // NVDB Vegdekke (gravel / asphalt); null with the fake sources
        ISignSource signSource;              // NVDB Skiltplate + Fartsgrense (the same NvdbSource), FakeSources.Signs offline
        IRouter router;

        // World
        TileWorld world;
        RoadGraph roads;
        SignLayer signs;
        readonly Dictionary<TileKey, GameObject> ribbons = new Dictionary<TileKey, GameObject>();
        readonly Dictionary<TileKey, (GameObject go, Mesh draw, Mesh solid)> bridgeObjects = new Dictionary<TileKey, (GameObject, Mesh, Mesh)>();
        readonly Dictionary<TileKey, (GameObject go, Mesh draw, Mesh solid)> tunnelObjects = new Dictionary<TileKey, (GameObject, Mesh, Mesh)>();
        Material tunnelMaterial;
        readonly Queue<TileResult> results = new Queue<TileResult>();
        TileResult activeOverlay;
        FlatGround naturalGround;            // the uncarved DTM as an IGround, for StageRoute.AssignRoadY

        // Track
        IRoute route;
        StageRoute stage;
        List<Turn> turns;
        RoadWalk walk;
        int firstSample;              // the endless stage enters its first link here (RoadGraphEdges.StartNear)
        /// <summary>An endless stage starts on a road at most this far from the pin, else free drive.</summary>
        const double EndlessStartRadius = 1000;
        RoadGraphEdges edges;
        /// <summary>The clock stops (and the finish gate stands) this far before the end of a stage line.</summary>
        public const float FinishBefore = 6f;
        RoadArrow arrow;                     // the direction arrow on the road ahead (RoadArrow)
        FinishGate gate;                     // the checkered banner over the finish (an endless stage: over the end of the car's sector)
        float gateTimer;
        readonly List<Utm33> stagePoints = new List<Utm33>();
        readonly List<float> sectorEnds = new List<float>();
        readonly List<Utm33> prefetchPath = new List<Utm33>();
        int lastSector;

        // Vehicle, flow, actors, net
        CarController car;
        CarAudio audio;
        readonly GameFlow flow = new GameFlow();
        /// <summary>The stage phase (Loading → Intro → Countdown → Racing → Finished), for tests and tools.</summary>
        public Phase Phase => flow.Phase;
        /// <summary>True when the loaded link drives the road network without a stage line (no pace notes, no finish).</summary>
        public bool FreeDrive => flow.FreeDrive;
        /// <summary>Pace notes of the current stage line; −1 in free drive (for tests and tools).</summary>
        public int PaceNoteCount => turns?.Count ?? -1;
        /// <summary>The road arrow and the finish gate (null until first shown), for tests and tools.</summary>
        public RoadArrow Arrow => arrow;
        public FinishGate Gate => gate;
        ActorManager actors;
        readonly Dictionary<CrossingActor, ActorView> actorViews = new Dictionary<CrossingActor, ActorView>();
        Session session;
        string kindName = "porsche";

        // HUD
        HudFrame hud;
        string status = "", transient = "";
        float transientUntil, statsTimer;
        string statsText = "";

        /// <summary>One fetched tile waiting for its frame. Apply returns false to try again next frame (a fine tile under the car).</summary>
        sealed class TileResult
        {
            public TileKey Key;
            public Func<bool> Apply;
            public float Since;
            /// <summary>An overlay between its steps (not one waiting to start): it continues before anything else.</summary>
            public bool Stepping;
        }

        #endregion

        #region Boot

        async void Start()
        {
            if (Hud != null)
            {
                Hud.StartClicked += StartEngine;
                Hud.HostClicked += HostRoom;
                Hud.JoinClicked += JoinRoom;
                Hud.GearboxClicked += ToggleGearbox;
                Hud.SlideClicked += CycleSliding;
                Hud.MapClicked += OpenMap;
                Hud.CacheClearClicked += ClearCache;
                Hud.DebugTapped += () => Hud.DebugVisible = !Hud.DebugVisible;
                Hud.CarClicked += ChooseCar;
                Hud.MenuClicked += BackToMenu;
                logWindow = Hud.GetComponent<Rally.UI.LogWindow>();
            }
            LoadSettings();
            ShowCarCards();
            var mapGo = new GameObject("Map");                     // the name the template's SendMessage targets
            mapGo.AddComponent<MapEvents>().Handler = OnMapEvent;
            flow.PhaseChanged += p => Hud?.ShowStartScreen(p == Phase.Intro || p == Phase.Loading);
            try { await Boot(); }
            catch (OperationCanceledException) { }
            catch (Exception e) { RallyLog.Error("boot failed: " + e); status = "LOAD FAILED: " + e.Message; }
        }

        void OnDestroy()
        {
            cts.Cancel();
            FloatingOrigin.Rebased -= OnRebased;
            session?.Close();
            signs?.Dispose();
            signs = null;
            world?.Dispose();
            world = null;
        }

        /// <summary>main.js boot: the share link (or the editor query) becomes the first stage; see LoadFromQuery.</summary>
        async Task Boot()
        {
            string query = BrowserDom.UrlParams();
            if (string.IsNullOrEmpty(query)) query = EditorQuery;
            bench = query.Contains("bench");
            await LoadFromQuery(query);
        }

        /// <summary>Real services on the web (IndexedDB cache shared with the JS game); FakeSources or the file cache in the editor.</summary>
        void CreateSources()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            bool fake = false;
            cache = new GeoCache(new IdbBackend());
            _ = ((GeoCache)cache).RefreshBudget();          // 32 GB at most, 10 % of the disk / quota kept free
            IdbBackend.RequestPersistence();
#else
            bool fake = UseFakeSources;
            cache = new GeoCache(FileBackend.Default());
            _ = ((GeoCache)cache).RefreshBudget();
#endif
            if (fake)
            {
                var osm = new FakeSources.Osm();
                dem = new FakeSources.Dem { BumpAt = anchor + new double2(300, 200) };
                roadSource = osm; featureSource = osm;
                landcoverSource = new FakeSources.Landcover();
                router = new FakeSources.Router();
                surfaceSource = null;
                signSource = new FakeSources.Signs { Road = osm };
                return;
            }
            var overpass = new OverpassSource(cache);
            dem = new KartverketDem(cache);
            roadSource = overpass; featureSource = overpass;
            landcoverSource = new Sr16Source(cache);
            router = new OsrmRouter(cache);
            surfaceSource = new NvdbSource(cache);
            signSource = surfaceSource;
        }

        /// <summary>TileWorld + RoadGraph + clipmap + forest + colliders, styled by the WorldStyle asset.</summary>
        void CreateWorld()
        {
            world = new TileWorld(CarveShader, Style);
            roads = new RoadGraph();
            world.Roads = roads;
            if (Style != null)
            {
                if (Style.TerrainMaterial != null) world.Clipmap = new Clipmap(Style.TerrainMaterial, Style.ClipmapLevels);
                if (Style.Vegetation != null) world.Vegetation = new VegetationRenderer(Style.Vegetation, Style.ScatterShader, world.CoarseAtlas, world.Trees);
            }
            world.TreeColliders = new TreeColliderPool(world.Trees);
            world.PropColliders = new PropColliderPool();
            signs = new SignLayer(world.Root, world.PropColliders, p => world.HeightAt(FloatingOrigin.ToWorldXZ(p)));   // the ground the car drives on
            world.Wake = new WaterWake();
            Style?.Apply(world);
            naturalGround = new FlatGround { Height = xz => world.BaseHeightAt(FloatingOrigin.ToUtm(xz)) };
            world.TileNeeded += OnTileNeeded;
            world.TileDisposing += OnTileDisposing;
        }

        async Task WaitUntil(Func<bool> condition, float timeoutSeconds = float.PositiveInfinity)
        {
            float until = Time.realtimeSinceStartup + timeoutSeconds;
            while (!condition())
            {
                cts.Token.ThrowIfCancellationRequested();
                if (Time.realtimeSinceStartup > until) return;
                await Task.Yield();
            }
        }

        #endregion

        #region Streaming

        /// <summary>
        /// The scheduler wants a tile: fetch its DTM, queue the upload, and for coarse tiles fetch the roads,
        /// features and land cover afterwards (they refresh the tile when they land; the ground never waits for
        /// Overpass). One task per tile; failures go back to the scheduler like stream.js (retried last).
        /// </summary>
        async void OnTileNeeded(TileKey key)
        {
            var ct = cts.Token;
            var tileWatch = System.Diagnostics.Stopwatch.StartNew();
            RallyLog.Info($"tile: {key} requested ({key.CellM:0.#} m cells)");
            try
            {
                var grid = await dem.Fetch(key.Bounds, key.CellM, ct);
                if (grid == null || grid.N != TileScheduler.Samples)
                {
                    grid?.Dispose();
                    throw new Exception($"DEM {key}: {(grid == null ? "no data" : grid.N + " samples")}");
                }
                double latitude = Proj.ToLatLon(key.Origin).Lat;
                long demMs = tileWatch.ElapsedMilliseconds;
                results.Enqueue(new TileResult
                {
                    Key = key,
                    Apply = () =>
                    {
                        if (world == null) { grid.Dispose(); return true; }
                        if (key.Kind == TileKind.Fine && HoldFineTile(key)) return false;
                        world.OnTileData(key, grid.Heights, null, null, latitude);
                        grid.Dispose();
                        var st = world.GetStats();
                        RallyLog.Info($"tile: {key} ground ready, DEM in {demMs} ms, shown {tileWatch.ElapsedMilliseconds} ms after the request (loaded {st.CoarseLoaded} coarse + {st.FineLoaded} fine, {st.Pending} pending)");
                        return true;
                    },
                });
                if (key.Kind == TileKind.Coarse) await FetchFeatures(key, ct);
            }
            catch (OperationCanceledException) { }
            catch (Exception e)
            {
                RallyLog.Warn($"tile {key} failed: {e.Message}");
                results.Enqueue(new TileResult { Key = key, Apply = () => { world?.FetchFailed(key); return true; } });
            }
        }

        /// <summary>
        /// A 1 m tile landing under the car replaces the 8 m ground it is driving on; the two DTMs differ by
        /// decimetres and the suspension absorbs that, but not while the car is on the tile's edge. So a fine
        /// tile waits while the car is within FineTileHoldDistance of it, at most 3 s (then it snaps anyway).
        /// </summary>
        bool HoldFineTile(TileKey key)
        {
            if (car == null) return false;
            return key.RectDistance(FloatingOrigin.ToUtm(car.State.Pos)) < FineTileHoldDistance;
        }

        /// <summary>Overpass (roads + features) and SR16 for a coarse tile, independently; a missing answer is asked again after 45 s (stream.js osmRetryAt).</summary>
        async Task FetchFeatures(TileKey key, CancellationToken ct)
        {
            var roadTask = roadSource.FetchRoads(key.Bounds, ct);
            var featureTask = featureSource.FetchFeatures(key.Bounds, ct);
            var coverTask = landcoverSource.FetchCover(key.Bounds, ct);
            var surfaceTask = surfaceSource != null ? surfaceSource.FetchSurfaces(RoadGraph.SurfaceQueryBounds(key), ct) : Task.FromResult<List<RoadSurfaceLine>>(null);
            var signTask = signSource != null ? signSource.FetchSigns(key.Bounds, ct) : Task.FromResult<SignSet>(null);
            RoadGraphData roadData = null; Features features = null; CoverRaster cover = null; List<RoadSurfaceLine> surfaces = null; SignSet signSet = null;
            var overlayWatch = System.Diagnostics.Stopwatch.StartNew();
            float waitSince = -1f;
            System.Collections.IEnumerator steps = null;
            RallyLog.Info($"overlay: {key} asking OSM roads + features and NIBIO SR16 forest");
            try { roadData = await roadTask; RallyLog.Info($"overlay: {key} roads {roadData?.Ways.Count ?? 0} ways after {overlayWatch.ElapsedMilliseconds} ms"); } catch (OperationCanceledException) { throw; } catch (Exception e) { RallyLog.Info($"overlay: {key} roads failed: {e.Message}"); }
            try
            {
                features = await featureTask;
                if (features != null) RallyLog.Info($"overlay: {key} map features: {features.Buildings.Count} buildings, {features.Areas.Count} land-use areas, {features.Waterways.Count} waterways, {features.PowerLines.Count} power lines after {overlayWatch.ElapsedMilliseconds} ms");
                else RallyLog.Info($"overlay: {key} map features: none after {overlayWatch.ElapsedMilliseconds} ms");
            }
            catch (OperationCanceledException) { throw; } catch (Exception e) { RallyLog.Info($"overlay: {key} features failed: {e.Message}"); }
            try { surfaces = await surfaceTask; } catch (OperationCanceledException) { throw; } catch (Exception e) { RallyLog.Info($"overlay: {key} NVDB road surface failed: {e.Message}"); }
            try
            {
                signSet = await signTask;
                if (signSet != null) RallyLog.Info($"overlay: {key} NVDB signs: {signSet.Plates.Count} plates, {signSet.SpeedLimits.Count} speed limits after {overlayWatch.ElapsedMilliseconds} ms");
            }
            catch (OperationCanceledException) { throw; } catch (Exception e) { RallyLog.Info($"overlay: {key} NVDB signs failed: {e.Message}"); }
            try { cover = await coverTask; RallyLog.Info(cover != null ? $"overlay: {key} SR16 forest raster {cover.Width}×{cover.Height} cells (16 m) after {overlayWatch.ElapsedMilliseconds} ms" : $"overlay: {key} SR16 forest: none after {overlayWatch.ElapsedMilliseconds} ms"); } catch (OperationCanceledException) { throw; } catch (Exception e) { RallyLog.Info($"overlay: {key} SR16 failed: {e.Message}"); }
            var overlay = new TileResult { Key = key };
            overlay.Apply = () =>
                {
                    if (world == null || !world.Tiles.ContainsKey(key)) return true;
                    if (!world.Scheduler.IsReady(key)) return false;    // the DTM result is still ahead in the queue
                    // The roads are graded on the ground they run over, also in the neighbours (the runs reach TilePad into them,
                    // the ways further): wait for the neighbours' DTMs that are on their way, at most NeighbourWait seconds.
                    if (waitSince < 0f) waitSince = Time.realtimeSinceStartup;
                    if (steps == null)
                    {
                        if (roadData != null && Time.realtimeSinceStartup - waitSince < NeighbourWait && NeighbourPending(key)) return false;
                        steps = OverlaySteps(key, roadData, features, cover, surfaces, signSet, overlayWatch);
                        overlay.Stepping = true;
                    }
                    // One step per call (roads, ribbon, bridges, signs, splat, water, houses, their collider, carve): the queue
                    // runs more of them in the same frame while the streaming budget lasts, else next frame.
                    return !steps.MoveNext();
                };
            results.Enqueue(overlay);
            if (roadData == null && !ct.IsCancellationRequested)
            {
                RallyLog.Info($"overlay: {key} has no road data, asking again in {CircuitBreaker.RetryMs / 1000} s");
                await Task.Delay(TimeSpan.FromMilliseconds(CircuitBreaker.RetryMs), ct);
                if (world != null && world.Tiles.ContainsKey(key)) await FetchFeatures(key, ct);
            }
        }

        /// <summary>
        /// A coarse tile's overlay in steps, so no frame does all of it (it was grading, re-carving up to nine tiles, ribbon,
        /// bridges and their collider, signs, splat, water, houses and their collider, all in one frame): the re-carves go to
        /// TileWorld's queue, everything else is one step per MoveNext.
        /// </summary>
        System.Collections.IEnumerator OverlaySteps(TileKey key, RoadGraphData roadData, Features features, CoverRaster cover, List<RoadSurfaceLine> surfaces, SignSet signSet, System.Diagnostics.Stopwatch overlayWatch)
        {
            if (roadData != null)
            {
                // Water for the bridge rule: this tile's OSM lakes and rivers, the sea in the DTM, the water other tiles built.
                long t0 = FrameProbe.Start();
                var water = new WaterProbe(features, p => world.BaseHeightAt(p), p => world.IsLoaded(FloatingOrigin.ToWorldXZ(p)), world.InMappedWater);
                var lines = new List<RoadPolyline>();
                var grade = roads.SetTileSteps(lines, key, roadData, p => world.BaseHeightAt(p), surfaces, water.Wet, p => world.IsLoaded(FloatingOrigin.ToWorldXZ(p)));
                for (;;)
                {
                    bool more = grade.MoveNext();
                    FrameProbe.Stop(".ov.roads", t0);
                    if (!more) break;
                    yield return null;
                    if (!world.Tiles.ContainsKey(key)) yield break;
                    t0 = FrameProbe.Start();
                }
                t0 = FrameProbe.Start();
                RallyLog.Info($"overlay: {key} {roads.SurfaceStatsFor(key)}");
                var b = key.Bounds;
                world.QueueRecarveWithin(new Bounds25833(b.MinE - RoadGraph.TilePad, b.MinN - RoadGraph.TilePad, b.MaxE + RoadGraph.TilePad, b.MaxN + RoadGraph.TilePad));
                FrameProbe.Stop(".ov.roads", t0);
                yield return null;
                if (!world.Tiles.ContainsKey(key)) yield break;
                t0 = FrameProbe.Start();
                BuildRibbon(key, lines);
                FrameProbe.Stop(".ov.ribbon", t0);
                yield return null;
                if (!world.Tiles.ContainsKey(key)) yield break;
                t0 = FrameProbe.Start();
                BuildBridges(key, lines);
                FrameProbe.Stop(".ov.bridges", t0);
                yield return null;
                if (!world.Tiles.ContainsKey(key)) yield break;
                t0 = FrameProbe.Start();
                if (signSet != null) PlaceSigns(key, signSet);
                FrameProbe.Stop(".ov.signs", t0);
                yield return null;
                // Neighbours cut from a grading this tile replaced (a way graded again now that its ground is in): set them
                // again, redraw their ribbon and bridges, carve again — or two gradings of one road meet at the border.
                // Setting one again can flag more (a way that took its height from a regraded one follows it): until settled.
                var dirtyTiles = new Queue<TileKey>(roads.TakeDirtyTiles());
                for (int guard = 0; dirtyTiles.Count > 0 && guard < 64; guard++)
                {
                    var d = dirtyTiles.Dequeue();
                    if (world == null || !world.Tiles.ContainsKey(d)) continue;
                    t0 = FrameProbe.Start();
                    var again = roads.Rebuild(d);
                    if (again != null)
                    {
                        BuildRibbon(d, again);
                        BuildBridges(d, again);
                        var db = d.Bounds;
                        world.QueueRecarveWithin(new Bounds25833(db.MinE - RoadGraph.TilePad, db.MinN - RoadGraph.TilePad, db.MaxE + RoadGraph.TilePad, db.MaxN + RoadGraph.TilePad));
                        RallyLog.Info($"overlay: {d} roads set again (a way it shares with {key} was graded again)");
                    }
                    foreach (var m in roads.TakeDirtyTiles()) if (!dirtyTiles.Contains(m)) dirtyTiles.Enqueue(m);
                    FrameProbe.Stop(".ov.rebuild", t0);
                    yield return null;
                }
            }
            if (features != null || cover != null)
            {
                var fs = world.OnTileFeaturesSteps(key, cover, features);
                while (fs.MoveNext()) yield return null;
            }
            RallyLog.Info($"overlay: {key} applied: roads {(roadData != null ? "carved + ribbon" : "missing")}, forest {(cover != null ? "tinted + trees" : "missing")}, houses and water {(features != null ? "built" : "missing")}, after {overlayWatch.ElapsedMilliseconds} ms");
        }

        /// <summary>How long a coarse tile's roads wait for the neighbours' ground (<see cref="NeighbourPending"/>) before they are graded anyway.</summary>
        const float NeighbourWait = 10f;

        /// <summary>A coarse neighbour of the tile is wanted by the scheduler but its DTM is not in yet.</summary>
        bool NeighbourPending(TileKey key)
        {
            for (int dj = -1; dj <= 1; dj++)
                for (int di = -1; di <= 1; di++)
                    if ((di != 0 || dj != 0) && world.Scheduler.TryGetState(new TileKey(TileKind.Coarse, key.I + di, key.J + dj), out var st) && st != TileState.Ready) return true;
            return false;
        }

        /// <summary>The tile's NVDB plates (and made-up 362s where the limit changes without one) onto the shoulders of its roads.</summary>
        void PlaceSigns(TileKey key, SignSet set)
        {
            var plates = new List<SignPlate>(set.Plates);
            var made = SignPlacement.SpeedChangePlates(set.SpeedLimits, set.Plates, key.Bounds);
            plates.AddRange(made);
            var posts = SignPlacement.Place(plates, roads, p => SignCatalog.For(p, SignPlacement.KmhAt(set.SpeedLimits, p.Position)), key.Bounds, out int skipped, out int offRoad);
            int placed = 0; foreach (var post in posts) placed += post.Plates.Count;
            signs.SetTile(key, posts);
            RallyLog.Info($"overlay: {key} signs: {placed} plates on {posts.Count} posts ({made.Count} speed-limit changes without a plate), {skipped} without a design, {offRoad} away from the roads");
        }

        /// <summary>
        /// Tile results oldest first while the frame's streaming budget lasts (<see cref="WorkBudget"/>), at least one; a
        /// result that is not done (a fine tile held near the car, an overlay between its steps) goes to the back.
        /// </summary>
        void ApplyTileResults()
        {
            // An overlay that has started stepping goes on first, to the end: it went to the back of the queue after every
            // step before, and the start tile's 389 ways took minutes to grade (half-carved terrain and no ribbon meanwhile).
            while (activeOverlay != null)
            {
                long t0 = FrameProbe.Start();
                bool done = activeOverlay.Apply();
                FrameProbe.Stop("apply.coarse", t0);
                if (done) activeOverlay = null;
                if (!WorkBudget.Left) return;
            }
            for (int n = results.Count; n > 0 && results.Count > 0; n--)
            {
                ApplyOneTileResult();
                if (!WorkBudget.Left) return;
            }
        }

        void ApplyOneTileResult()
        {
            if (results.Count == 0) return;
            var r = results.Dequeue();
            if (r.Since == 0f) r.Since = Time.time;
            long t0 = FrameProbe.Start();
            bool done = r.Apply();
            FrameProbe.Stop(r.Key.Kind == TileKind.Fine ? "apply.fine" : "apply.coarse", t0);
            if (!done && r.Key.Kind == TileKind.Fine && Time.time - r.Since > 3f)
            {
                // Held only because the car is close: 3 s are up, let the fine tile snap in.
                float keep = FineTileHoldDistance;
                FineTileHoldDistance = -1f;
                done = r.Apply();
                FineTileHoldDistance = keep;
            }
            if (done) return;
            if (r.Stepping && activeOverlay == null) activeOverlay = r;
            else results.Enqueue(r);
        }

        /// <summary>The road surface of a tile: RibbonMesh over the carved ground, materials tarmac / gravel (its bridges: <see cref="BuildBridges"/>).</summary>
        void BuildRibbon(TileKey key, List<RoadPolyline> lines)
        {
            if (ribbons.TryGetValue(key, out var old)) { Destroy(old); ribbons.Remove(key); }
            var mesh = RibbonMesh.Build(lines, key.Origin, key.Bounds);
            if (mesh == null) return;
            var go = new GameObject("Ribbon " + key);
            go.transform.SetParent(world.Root, false);
            go.transform.position = FloatingOrigin.ToWorld(key.Origin, 0);
            go.AddComponent<MeshFilter>().sharedMesh = mesh;
            go.AddComponent<MeshRenderer>().sharedMaterials = new[] { TarmacMaterial, GravelMaterial };
            ribbons[key] = go;
        }

        /// <summary>Deck, rails and piers of the tile's bridge spans: house material (vertex colours, shadows), rails and piers solid on layer Buildings. Its tunnels too (<see cref="BuildTunnels"/>).</summary>
        void BuildBridges(TileKey key, List<RoadPolyline> lines)
        {
            DropBridges(key);
            BuildTunnels(key, lines);
            var draw = BridgeMesh.Build(lines, key.Origin, p => world.BaseHeightAt(p), out var solid, key.Bounds);
            if (draw == null) return;
            var go = new GameObject("Bridges " + key) { layer = RallyLayers.Buildings, isStatic = true };
            go.transform.SetParent(world.Root, false);
            go.transform.position = FloatingOrigin.ToWorld(key.Origin, 0);
            go.AddComponent<MeshFilter>().sharedMesh = draw;
            var mr = go.AddComponent<MeshRenderer>();
            mr.sharedMaterial = world.Style != null ? world.Style.BuildingMaterial : null;
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On; mr.receiveShadows = true;
            if (solid != null) go.AddComponent<MeshCollider>().sharedMesh = solid;
            bridgeObjects[key] = (go, draw, solid);
            var spans = new System.Text.StringBuilder();
            int count = 0;
            foreach (var line in lines)
                foreach (var sp in BridgeMesh.Spans(line.Samples))
                {
                    var mid = line.Samples[(sp.I0 + sp.I1) / 2].P;
                    var ll = Proj.ToLatLon(new Utm33(mid.x, mid.y));
                    if (count++ < 12) spans.Append(FormattableString.Invariant($" way {line.Id} {line.Samples[sp.I1].S - line.Samples[sp.I0].S:0} m at {ll.Lat:0.00000},{ll.Lon:0.00000};"));
                }
            RallyLog.Info($"overlay: {key} bridges: {count} spans{spans}");
        }

        /// <summary>Tubes, portals, lamps and avalanche galleries of the tile's runs (TunnelMesh, Rally/Tunnel shader); walls and portal faces solid on layer Buildings.</summary>
        void BuildTunnels(TileKey key, List<RoadPolyline> lines)
        {
            var draw = TunnelMesh.Build(lines, key.Origin, p => world.BaseHeightAt(p), out var solid, key.Bounds);
            if (draw == null) return;
            var go = new GameObject("Tunnels " + key) { layer = RallyLayers.Buildings, isStatic = true };
            go.transform.SetParent(world.Root, false);
            go.transform.position = FloatingOrigin.ToWorld(key.Origin, 0);
            go.AddComponent<MeshFilter>().sharedMesh = draw;
            var mr = go.AddComponent<MeshRenderer>();
            mr.sharedMaterial = TunnelMaterial();
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On; mr.receiveShadows = true;
            if (solid != null) go.AddComponent<MeshCollider>().sharedMesh = solid;
            tunnelObjects[key] = (go, draw, solid);
            int portals = 0, tube = 0, gallery = 0;
            foreach (var line in lines)
                for (int i = 0; i < line.Samples.Count; i++)
                {
                    var q = line.Samples[i];
                    if (q.Portal && q.Tunnel && RibbonMesh.Owns(key.Bounds, q.P)) portals++;
                    if (i + 1 < line.Samples.Count && RibbonMesh.Owns(key.Bounds, (q.P + line.Samples[i + 1].P) * 0.5))
                    {
                        if (q.Tunnel && line.Samples[i + 1].Tunnel) tube++;
                        else if (q.Gallery && line.Samples[i + 1].Gallery) gallery++;
                    }
                }
            RallyLog.Info($"overlay: {key} tunnels: {tube * 5} m of tube, {portals} portals, {gallery * 5} m of avalanche gallery");
        }

        /// <summary>Rally/Tunnel: vertex-coloured, lit like the world outside and by the lamps inside (tunnels, the finish gate).</summary>
        Material TunnelMaterial()
        {
            if (tunnelMaterial == null)
            {
                var shader = Resources.Load<Shader>("Tunnel/Tunnel");
                tunnelMaterial = shader != null ? new Material(shader) { name = "Tunnel" } : world.Style?.BuildingMaterial;
            }
            return tunnelMaterial;
        }

        void DropBridges(TileKey key)
        {
            if (tunnelObjects.TryGetValue(key, out var tn))
            {
                Destroy(tn.go); Destroy(tn.draw); if (tn.solid != null) Destroy(tn.solid);
                tunnelObjects.Remove(key);
            }
            if (!bridgeObjects.TryGetValue(key, out var b)) return;
            Destroy(b.go); Destroy(b.draw); if (b.solid != null) Destroy(b.solid);
            bridgeObjects.Remove(key);
        }

        void OnTileDisposing(TerrainTile tile)
        {
            if (ribbons.TryGetValue(tile.Key, out var go)) { Destroy(go); ribbons.Remove(tile.Key); }
            DropBridges(tile.Key);
            if (tile.Key.Kind == TileKind.Coarse) { roads.RemoveTile(tile.Key); signs?.RemoveTile(tile.Key); }
        }

        #endregion

        #region Route

        /// <summary>
        /// The stage from the link: an OSRM route (or the fake router's straight line for "demo", whose A* has no
        /// port), the endless random walk from the seed, or the road network itself for free drive.
        /// </summary>
        async Task CreateRoute()
        {
            switch (link.Kind)
            {
                case ShareLinks.Kind.Osrm:
                case ShareLinks.Kind.Demo:
                {
                    status = "ROUTING";
                    var profile = link.Profile == "cycling" ? RouteProfile.Cycling : link.Profile == "foot" ? RouteProfile.Foot : RouteProfile.Driving;
                    var result = await router.Route(link.A, link.B, profile, cts.Token);
                    stagePoints.Clear();
                    foreach (var c in result.Coordinates) stagePoints.Add(Proj.ToUtm(c));
                    BuildStage(link.Kind == ShareLinks.Kind.Osrm ? "OSRM stage" : "Demo stage", "osrm");
                    AddSectorPlans(0, 0f, stage.Length);
                    break;
                }
                case ShareLinks.Kind.Endless:
                {
                    // Start on the road beside the pin (the nearest link, not the nearest junction: junctions of a
                    // rural road can be far apart), so the car spawns on it facing along it.
                    edges = new RoadGraphEdges(roads);
                    if (!edges.StartNear(anchor, EndlessStartRadius, out var first, out firstSample))
                    {
                        RallyLog.Warn($"endless: no drivable road within {EndlessStartRadius:0} m of the start ({roads.SegmentCount} road segments loaded); free drive instead");
                        Say("NO ROAD NEAR HERE FOR A STAGE — FREE DRIVE", 6f);
                        goto default;
                    }
                    walk = new RoadWalk(edges, link.Seed, first);
                    stagePoints.Clear();
                    walk.ExtendSector();          // never false: the first link is already in it
                    AppendSector();
                    RallyLog.Info($"endless: stage starts on way {edges.Link(first)?.Id} {math.length(stagePoints[0].Minus(anchor)):0} m from the pin, first sector {walk.Length / 1000f:0.0} km");
                    BuildStage($"Endless {link.Seed:x}", "endless");
                    sectorEnds.Add(stage.Length);
                    AddSectorPlans(0, 0f, stage.Length);
                    if (walk.ExtendSector()) ExtendStage();
                    break;
                }
                default:
                {
                    var pose = roads.PoseNear(anchor, 400);
                    var start = pose.HasValue
                        ? new RoutePose { XZ = FloatingOrigin.ToWorldXZ(pose.Value.Position), Y = world.HeightAt(FloatingOrigin.ToWorldXZ(pose.Value.Position)), Yaw = pose.Value.Yaw }
                        : new RoutePose { XZ = float2.zero, Y = world.HeightAt(float2.zero), Yaw = 0f };
                    route = new RoadNetworkRoute(roads, start);
                    flow.FreeDrive = true;
                    if (pose.HasValue) { var ll = Proj.ToLatLon(pose.Value.Position); RallyLog.Info(FormattableString.Invariant($"free drive: starts at {ll.Lat:0.00000},{ll.Lon:0.00000}, {math.length(pose.Value.Position.Minus(anchor)):0} m from the pin")); }
                    break;
                }
            }
        }

        /// <summary>stage.js makeRoute + assignRoadY on the natural ground; pace notes from the line.</summary>
        void BuildStage(string name, string source)
        {
            stage = StageRoute.Make(stagePoints, world, name: name, source: source, roadWidth: RoadConstants.OneLaneHalf, surface: Surface.Gravel);
            stage.AssignRoadY(naturalGround);
            turns = PaceNotes.FindTurns(stage.Samples);
            route = stage;
            if (car != null) car.Route = stage;   // never SetRoute here: that would put the car back on the start line
        }

        /// <summary>A normal stage prefetches the line this far ahead of the car (endless stages prefetch the next sector).</summary>
        const float StagePrefetch = 2500f;
        float prefetchAt = float.NegativeInfinity;

        /// <summary>
        /// A normal (OSRM / demo) stage: the stage line from the car to <see cref="StagePrefetch"/> ahead into the scheduler's
        /// prefetch path, renewed every 200 m — the coarse tiles under it and the 1 m tiles along it load behind the ring,
        /// so a road that turns away from the straight-ahead lead point is ready too (it used to be prefetched in endless mode only).
        /// </summary>
        void PrefetchStage(float carS)
        {
            if (stage == null || math.abs(carS - prefetchAt) < 200f) return;
            prefetchAt = carS;
            prefetchPath.Clear();
            for (float s = carS; s <= math.min(stage.Length, carS + StagePrefetch); s += 40f) prefetchPath.Add(FloatingOrigin.ToUtm(stage.SampleAtDistance(s).XZ));
            world.Scheduler.SetPrefetchPath(prefetchPath);
        }

        /// <summary>The walk's newest sector: its links' graded points onto the stage line, and the tiles under them into the prefetch path.</summary>
        void AppendSector()
        {
            prefetchPath.Clear();
            edges.AppendPoints(walk.LastSector, stagePoints, firstSample, prefetchPath);   // every 40 m is plenty for 256 m tiles
            world.Scheduler.SetPrefetchPath(prefetchPath);
        }

        /// <summary>Endless mode: one more sector on the line (the car keeps its place: the old samples are a prefix of the new ones).</summary>
        void ExtendStage()
        {
            float before = stage.Length;
            AppendSector();
            BuildStage(stage.Name, stage.Source);
            sectorEnds.Add(stage.Length);
            AddSectorPlans(sectorEnds.Count - 1, before, stage.Length);
        }

        void AddSectorPlans(int sector, float s0, float s1)
        {
            if (actors == null) actors = new ActorManager(link.Seed ^ 0x5EEDUL, RoadAt);
            float latitude = (float)Proj.ToLatLon(anchor).Lat;
            actors.AddPlans(SpawnRules.Plan(link.Seed, sector, s0, s1, CoverAt, PavedAt, latitude, ActorDensity));
        }

        /// <summary>ActorManager's view of the route: a point s metres along it with the road's heading and half width.</summary>
        RoadPoint RoadAt(float s)
        {
            var p = route.SampleAtDistance(s);
            return new RoadPoint(p.XZ, p.Yaw, route.RoadWidth);
        }

        bool PavedAt(float s) => route.Nearest(route.SampleAtDistance(s).XZ, 40f).Surface == Surface.Asphalt;

        /// <summary>
        /// Actors.CoverKind from what the world knows beside the road: water first, then SR16 crown cover (forest),
        /// OSM houses (settlement), height above the tree line (open fjell), else pasture. Unknown while the tile
        /// is not in, which SpawnRules treats as "nothing lives here".
        /// </summary>
        CoverKind CoverAt(float s, float side)
        {
            var rp = RoadAt(s);
            var xz = rp.Xz + rp.Left * side * (rp.HalfWidth + 8f);
            var u = FloatingOrigin.ToUtm(xz);
            if (!world.IsLoaded(xz)) return CoverKind.Unknown;
            if (world.WaterAt(xz).Depth > 0.3f) return CoverKind.Water;
            var cover = world.CoverAt(u);
            if (cover != null && cover.DensityAt(u) > 0.25f) return CoverKind.Forest;
            var houses = world.BuildingsAt(u);
            if (houses != null)
            {
                int near = 0;
                foreach (var b in houses.Boxes) if (math.distancesq(b.Centre, new double2(u.E, u.N)) < 80.0 * 80.0 && ++near >= 2) return CoverKind.Settlement;
            }
            if (world.CarvedHeightAt(u) > world.TreeLineAt(u)) return CoverKind.OpenFjell;
            return CoverKind.Pasture;
        }

        #endregion

        #region Car and systems

        /// <summary>The car prefab on the start line, driving on the world's ground, colliding with the world's layers.</summary>
        void SpawnCar()
        {
            car = Instantiate(ChosenPrefab).GetComponent<CarController>();
            if (car == null) throw new Exception("CarPrefab has no CarController");
            audio = car.GetComponent<CarAudio>();
            kindName = Garage.Info(car.Kind).Id;
            int carLayer = LayerMask.NameToLayer("Car");
            if (carLayer >= 0) car.gameObject.layer = carLayer;
            car.SolidLayers = RallyLayers.SolidMask;
            car.TreeLayers = 1 << RallyLayers.Trees;
            car.WaterLayers = 1 << RallyLayers.Water;
            car.ActorLayers = 1 << RallyLayers.Actors;
            car.Ground = world;
            car.Frozen = true;
            car.AutoShift = autoShift;
            car.GripMode = (SlideMode)sliding;
            car.GearboxChanged += auto => { autoShift = auto; Hud?.SetGearbox(auto); Say("GEARBOX: MANUAL — Q/E to shift, G for automatic", 3f); };
            car.SetRoute(route);
            car.OnWaterEnter += p => world.Wake?.Add(new float2(p.x, p.z), 1f);
        }

        void WireCamera()
        {
            if (Rig == null) return;
            Rig.Target = car.transform;
            Rig.GroundHeight = world.HeightAt;
            Rig.Tunnel = world.TunnelAt;
            Rig.SeatEye = (Vector3)car.Spec.Eye;
            // Behind a tall car (the Ford Ranger, 2.06 m) the chase camera at 2.4 m looked along its roof and saw no road
            // for ~40 m: the camera rides at least 1 m over the car's roof, so the road arrow 15 m ahead shows.
            if (baseChaseUp < 0f) baseChaseUp = Rig.ChaseUp;
            Rig.ChaseUp = math.max(baseChaseUp, CarHeight() + 1f);
        }

        void WireSystems()
        {
            WireCamera();
            if (Sky != null && Sky.Sun != null) RenderSettings.sun = Sky.Sun;
            if (Sky != null) Sky.LatitudeDeg = (float)Proj.ToLatLon(anchor).Lat;
            if (Ghosts != null) Ghosts.ToWorld = WireToWorld;
            if (actors == null) actors = new ActorManager(link.Seed ^ 0x5EEDUL, RoadAt);
            actors.Spawned += OnActorSpawned;
            actors.Retired += OnActorRetired;
            actors.Hit += OnActorHit;
            actors.NearMiss += _ => flow.OnNearMiss();
            flow.PhaseChanged += OnPhase;
            // Rebase order: TileWorld (subscribed in its constructor) and CarController (OnEnable) already run before this.
            FloatingOrigin.Rebased += OnRebased;
        }

        void OnPhase(Phase p)
        {
            car.Frozen = p != Phase.Racing;
            if (p == Phase.Finished) status = flow.Retired ? "RETIRED" : $"FINISHED {HudController.Clock(flow.TotalTime)}";
        }

        void OnRebased(double2 delta)
        {
            Rig?.Shift(new Vector3((float)delta.x, 0, (float)delta.y));
            actors?.Shift((float2)delta);
            // Ghosts are placed from UTM every frame (WireToWorld), the stage line is UTM, the ribbons sit under world.Root.
        }

        /// <summary>UI / Enter: start the engine on the intro screen (also the first user gesture that unlocks web audio).</summary>
        public void StartEngine()
        {
            if (audio != null) audio.Started = true;
            flow.StartEngine();
        }

        /// <summary>Back to the start line with the clock reset (free drive: just the pose).</summary>
        public void Restart()
        {
            if (car == null) return;
            ResetToStart();
            flow.Restart();
        }

        /// <summary>The car repaired on the start line and the stage's animals and people planned again (Restart, ToMenu).</summary>
        void ResetToStart()
        {
            car.Repair();
            car.SetRoute(route);
            actors.Clear();
            if (stage != null) for (int i = 0; i < math.max(1, sectorEnds.Count); i++) AddSectorPlans(i, i == 0 ? 0f : sectorEnds[i - 1], sectorEnds.Count > i ? sectorEnds[i] : stage.Length);
        }

        void OnActorSpawned(CrossingActor a)
        {
            var prefab = ActorSet != null ? ActorSet.PrefabFor(a.Spec.Kind) : null;
            if (prefab == null) return;
            var go = Instantiate(prefab, world.Root);
            go.layer = RallyLayers.Actors;
            if (!go.TryGetComponent<ActorView>(out var view)) view = go.AddComponent<ActorView>();
            view.Actor = a;
            view.GroundHeight = world.HeightAt;
            actorViews[a] = view;
        }

        void OnActorRetired(CrossingActor a)
        {
            if (actorViews.TryGetValue(a, out var view)) { Destroy(view.gameObject); actorViews.Remove(a); }
        }

        /// <summary>A hit: the clock penalty in the flow, the damage in the car (an animal is a soft frontal wall).</summary>
        void OnActorHit(ActorHit hit)
        {
            flow.OnHit(hit);
            var f = CarSim.Forward(car.State.Yaw);
            car.ApplyExternalHit(new float3(-f.x, 0, -f.y), hit.CarSpeed, hit.Mass);
            Say($"HIT {hit.Kind.ToString().ToUpperInvariant()}  +{hit.PenaltySeconds:0}s", 3f);
        }

        void Say(string text, float seconds) { transient = text; transientUntil = Time.time + seconds; }

        #endregion

        #region Frame

        void Update()
        {
            FrameProbe.EndFrame(Time.unscaledDeltaTime);
            WorkBudget.BeginFrame();
            WorkBudget.Scale(flow.Phase == Phase.Loading || flow.Phase == Phase.Intro || flow.Phase == Phase.Countdown, frames.AvgMs);
            HandleKeys();
            frames.Record(Time.unscaledDeltaTime);
            if (bench) Bench();
            if (logWindow != null && Time.unscaledTime >= nextProgress) { nextProgress = Time.unscaledTime + 0.25f; ShowProgress(); }
            if (Hud != null && Hud.DebugVisible && Time.unscaledTime >= nextDebug) { nextDebug = Time.unscaledTime + 0.25f; Hud.SetDebug(DebugText()); }
            fps = math.lerp(fps, 1f / math.max(1e-4f, Time.unscaledDeltaTime), 0.05f);
            if (world == null) return;
            float dt = Time.deltaTime;
            ApplyTileResults();
            // The scheduler is fed the car's position and velocity every frame: its led point (LEAD 2800 m) keeps
            // the loaded ring ahead of a fast car, exactly stream.js. Before the car exists the start is the focus.
            float3 carPos = car != null ? (float3)car.transform.position : float3.zero;
            double2 velocity = car != null ? (double2)car.State.Vel : double2.zero;
            if (MainCamera != null) world.Scheduler.SetHorizon(TileScheduler.HorizonFor(RenderSettings.fog ? RenderSettings.fogDensity : 0f, MainCamera.farClipPlane));
            long tWorld = FrameProbe.Start();
            world.Update(carPos, velocity, MainCamera, dt);
            FrameProbe.Stop("world.update", tWorld);
            long tSigns = FrameProbe.Start();
            signs?.Update(FloatingOrigin.ToUtm(carPos), carPos);
            FrameProbe.Stop("signs.update", tSigns);
            if (car == null) { ShowHud(RouteQuery.None(float2.zero)); return; }

            if (flow.Phase == Phase.Intro && Keyboard.current != null && Keyboard.current.enterKey.wasPressedThisFrame && (Hud == null || !Hud.IsTyping)) StartEngine();
            flow.Update(dt);
            ref var s = ref car.State;
            var q = route.Nearest(s.Pos.xz, 120f);
            float carS = q.S;
            if (walk == null) PrefetchStage(carS);

            actors.Update(dt, carS, s.Pos.xz, s.Speed, CarSim.CarRadius);
            if (s.WaterDepth > 0.05f && s.Speed > 2f) world.Wake?.Add(s.Pos.xz, 0.3f);
            if (car.Wrecked) flow.Retire();
            if (stage != null && walk == null && flow.Phase == Phase.Racing && carS >= stage.Length - FinishBefore) flow.Finish();
            if (walk != null) Endless(carS);
            if (session != null && !session.Closed) session.SendState(Packet(ref s));
            if (Rig != null) Rig.Shake = CameraShake(s.Grounded, s.OnRoad, s.SurfaceKind, s.Speed);
            ShowHud(q);
            UpdateMarkers(carS, dt);
        }

        /// <summary>
        /// The road arrow every frame while the car is on the stage (countdown and racing; never after the finish), and the
        /// finish gate placed again twice a second (a road graded again under it, the drawn road's width arriving, rebases).
        /// </summary>
        void UpdateMarkers(float carS, float dt)
        {
            ref var s = ref car.State;
            float end = stage != null && walk == null ? stage.Length - FinishBefore : float.PositiveInfinity;
            long t0 = FrameProbe.Start(), w0 = System.Diagnostics.Stopwatch.GetTimestamp();
            if (arrow == null) arrow = new RoadArrow();
            // behind a tall car the chase camera sees the road only further out
            float seen = Rig != null && Rig.CurrentMode == CameraRig.Mode.Chase ? RoadArrow.SeenOver(CarHeight(), Rig.ChaseBack, Rig.ChaseUp) : 0f;
            if (flow.Phase == Phase.Countdown || flow.Phase == Phase.Racing) arrow.Update(route, world, s.Pos, s.Yaw, s.Speed, carS, end, dt, seen);
            else arrow.Hide();
            gateTimer -= dt;
            if (gateTimer <= 0f) { gateTimer = 0.5f; PlaceGate(carS); }
            FrameProbe.Stop("markers", t0);
            double ms = (System.Diagnostics.Stopwatch.GetTimestamp() - w0) * 1000.0 / System.Diagnostics.Stopwatch.Frequency;
            markersMs += ms; markersFrames++; markersMax = math.max(markersMax, (float)ms);
        }

        double markersMs; int markersFrames; float markersMax;   // the arrow and gate's own cost (DebugMarkers, the bench)

        float carHeight = -1f, baseChaseUp = -1f;
        CarController heightOf;

        /// <summary>The car's height over its pivot (its body's renderers), measured once per car.</summary>
        float CarHeight()
        {
            if (heightOf == car && carHeight >= 0f) return carHeight;
            heightOf = car; carHeight = 1.4f;
            bool any = false; var b = new Bounds();
            foreach (var r in car.GetComponentsInChildren<MeshRenderer>()) { if (!any) b = r.bounds; else b.Encapsulate(r.bounds); any = true; }
            foreach (var r in car.GetComponentsInChildren<SkinnedMeshRenderer>()) { if (!any) b = r.bounds; else b.Encapsulate(r.bounds); any = true; }
            if (any) carHeight = b.max.y - car.transform.position.y;
            return carHeight;
        }

        /// <summary>Where the gate stands: the finish line of a stage; on an endless stage the end of the sector the car is in; none in free drive.</summary>
        float GateS(float carS)
        {
            if (stage == null) return float.NaN;
            if (walk == null) return stage.Length - FinishBefore;
            foreach (var e in sectorEnds) if (e > carS + 1f) return e;
            return float.NaN;
        }

        void PlaceGate(float carS)
        {
            float gs = GateS(carS);
            if (float.IsNaN(gs)) { gate?.Hide(); return; }
            if (gate == null) gate = new FinishGate(TunnelMaterial(), world.Root);
            var p = stage.SampleAtDistance(gs);
            // the drawn carriageway's half width (the road graph's lanes), the stage's until the road is in
            float half = roads.Nearest(FloatingOrigin.ToUtm(p.XZ), 12, out var h) ? h.Half : stage.RoadWidth;
            gate.Refresh(p.XZ, p.Yaw, half, world);
        }

        /// <summary>One line on the arrow and the gate (PreviewShots).</summary>
        public string DebugMarkers()
        {
            var sb = new System.Text.StringBuilder(FormattableString.Invariant($"markers {markersMs / math.max(1, markersFrames):0.000} ms/frame avg, {markersMax:0.00} max over {markersFrames} frames; "));
            if (arrow != null) sb.Append(FormattableString.Invariant($"car height {carHeight:0.00} arrow {(arrow.Visible ? "on" : "off")} tail ({arrow.Tail.x:0.0},{arrow.Tail.y:0.00},{arrow.Tail.z:0.0}) tip ({arrow.Tip.x:0.0},{arrow.Tip.y:0.00},{arrow.Tip.z:0.0}) fade {arrow.Fade:0.00}"));
            if (gate != null && gate.Root.activeSelf)
            {
                var g = gate.Current;
                sb.Append(FormattableString.Invariant($" gate at ({g.Centre.x:0.0},{g.RoadY:0.00},{g.Centre.y:0.0}) posts ±{g.PostOffset:0.00} m (ground {g.LeftGround:0.00} / {g.RightGround:0.00}) road half {g.RoadHalf:0.00} banner {g.BannerBottom - g.RoadY:0.00} m up{(g.InTunnel ? " in a tunnel" : "")}"));
            }
            return sb.ToString();
        }

        /// <summary>Camera shake (CameraRig.Shake) from what the tyres run on: asphalt barely, gravel some, rough ground most, scaled by speed; none in the air.</summary>
        public static float CameraShake(bool grounded, bool onRoad, Surface surface, float speed)
        {
            if (!grounded) return 0f;
            float rough = !onRoad ? 1f : surface == Surface.Asphalt ? 0.12f : 0.5f;
            return rough * math.saturate(speed / 30f);
        }

        /// <summary>
        /// The endless loop: extend the line when the car is within one sector of its end (the next sector's
        /// tiles are already prefetching, see AppendSector), forget plans far behind, and stop for a service
        /// park every third sector (RoadWalk.ServiceEvery): the car is repaired on the spot, as the JS had no
        /// service park and a wreck must not end an endless stage.
        /// </summary>
        void Endless(float carS)
        {
            if (stage.Length - carS < RoadWalk.SectorLength && walk.ExtendSector()) ExtendStage();
            actors.ForgetBefore(carS - ActorManager.DespawnBehind);
            int sector = 0;
            while (sector < sectorEnds.Count && carS > sectorEnds[sector]) sector++;
            if (sector != lastSector)
            {
                lastSector = sector;
                flow.Sector();
                if (walk.IsService(sector)) { car.Repair(); Say("SERVICE PARK — repaired", 4f); }
            }
        }

        void ShowHud(in RouteQuery q)
        {
            if (Hud == null) return;
            if (car != null)
            {
                ref var s = ref car.State;
                hud.SpeedKmh = s.SpeedKmh; hud.Rpm = s.Rpm; hud.Redline = car.Spec.Redline; hud.Gear = s.Gear; hud.Manual = !car.AutoShift;
                // On the limiter in manual for a while: say how to get out of it (Q/E had switched the box to manual unnoticed).
                limiterTime = s.Limiter && !car.AutoShift && flow.Phase == Phase.Racing ? limiterTime + Time.deltaTime : 0f;
                if (limiterTime > 1.5f) { limiterTime = -6f; Say("MANUAL GEARBOX ON THE LIMITER — E (RB) shifts up, G automatic", 4f); }
                hud.Damage = car.Damage;
                hud.Surface = s.OnRoad ? (s.SurfaceKind == Surface.Asphalt ? "ASPHALT" : "GRAVEL") : (s.WaterDepth > 0.3f ? "WATER" : "OFF ROAD");
                hud.DistanceLeft = stage != null && walk == null ? math.max(0f, stage.Length - q.S) : 0f;
                int next = turns != null ? PaceNotes.NextTurn(turns, q.S) : -1;
                if (next >= 0)
                {
                    var t = turns[next];
                    hud.NoteKind = NoteText(t);
                    hud.NoteDistance = PaceNotes.RoundedDistance(t, q.S);
                }
                else hud.NoteKind = "";
            }
            hud.StageTime = flow.StageTime; hud.PenaltyTime = flow.PenaltyTime;
            hud.Status = StatusLine();
            Hud.Show(hud);
        }

        static readonly string[] NoteTexts =
        {
            "EASY LEFT", "MEDIUM LEFT", "HAIRPIN LEFT",
            "EASY RIGHT", "MEDIUM RIGHT", "HAIRPIN RIGHT",
        };

        static string NoteText(in Turn t) => NoteTexts[(int)t.Severity + (t.Angle > 0f ? 0 : 3)];

        /// <summary>The status line: phase first, a transient message next, then the stream statistics (streamStats() of the JS).</summary>
        string StatusLine()
        {
            statsTimer -= Time.deltaTime;
            if (statsTimer <= 0f)
            {
                statsTimer = 0.5f;
                var st = world.GetStats();
                statsText = $"tiles {st.CoarseLoaded}+{st.FineLoaded} (+{st.Pending}) {st.Bytes / 1048576} MB";
            }
            switch (flow.Phase)
            {
                case Phase.Loading: return status;                          // the tile numbers are on the LOG bar
                case Phase.Intro: return Time.time < transientUntil ? transient : "ENTER or START ENGINE to drive";
                case Phase.Countdown: return Mathf.CeilToInt(flow.Countdown).ToString();
                case Phase.Finished: return status;
            }
            if (car != null && car.State.WrongWay) return "WRONG WAY";
            if (Time.time < transientUntil) return transient;
            return statsText;
        }

        // ---- the LOG bar's world-loading progress (LogWindow.SetProgress) ----

        Rally.UI.LogWindow logWindow;
        float nextProgress;

        /// <summary>What the stream has done: terrain tiles (coarse + fine) ready of wanted, coarse tiles with their roads graded, fetches in flight.</summary>
        public struct StreamCounts { public int TerrainReady, TerrainWanted, RoadsReady, RoadsWanted, Fetching; }

        /// <summary>
        /// Count the scheduler's tiles. With <paramref name="startRadius"/> &gt; 0 only the start area counts: the coarse tiles
        /// within that distance of <paramref name="centre"/>, ground and roads — what <see cref="LoadFromQuery"/> waits for —
        /// so the bar is full when the stage can start; otherwise every wanted tile (streaming while driving).
        /// </summary>
        public static StreamCounts CountStreaming(TileScheduler scheduler, Func<TileKey, bool> roadsDone, Utm33 centre, double startRadius)
        {
            var c = new StreamCounts();
            foreach (var key in scheduler.Keys)
            {
                if (startRadius > 0 && (key.Kind != TileKind.Coarse || key.RectDistance(centre) > startRadius)) continue;
                scheduler.TryGetState(key, out var state);
                c.TerrainWanted++;
                if (state == TileState.Ready) c.TerrainReady++;
                else if (state == TileState.Loading) c.Fetching++;
                if (key.Kind != TileKind.Coarse) continue;
                c.RoadsWanted++;
                if (roadsDone(key)) c.RoadsReady++;
            }
            return c;
        }

        /// <summary>One 0..1 value for the bar: terrain and roads counted alike; nothing wanted counts as done.</summary>
        public static float StreamFraction(in StreamCounts c)
        {
            int wanted = c.TerrainWanted + c.RoadsWanted;
            return wanted == 0 ? 1f : (float)(c.TerrainReady + c.RoadsReady) / wanted;
        }

        void ShowProgress()
        {
            if (world == null || roads == null) { logWindow.SetProgress(0f, status); return; }
            bool start = flow.Phase == Phase.Loading;
            var c = CountStreaming(world.Scheduler, roads.HasTile, anchor, start ? EndlessStartRadius : 0);
            float f = StreamFraction(c);
            int queued = results.Count + (activeOverlay != null ? 1 : 0);
            string text = $"{(start ? "START AREA" : "WORLD")} {Mathf.FloorToInt(f * 100f)}% · terrain {c.TerrainReady}/{c.TerrainWanted} · roads {c.RoadsReady}/{c.RoadsWanted}"
                + (c.Fetching > 0 ? $" · {c.Fetching} fetching" : "") + (queued > 0 ? $" · {queued} queued" : "");
            logWindow.SetProgress(f, text);
        }

        #endregion

        #region Controls (main.js:1467 keys, start-screen options, route map, debug window)

        // Saved per browser like the JS (localStorage): gearbox, sliding level, mute. Only G / the GEARBOX button saves the
        // gearbox: a Q/E press switches to manual for this visit only, so nobody comes back to a box stuck in 1st.
        bool autoShift = true, autoShiftSaved = true, muted, mapOpen;
        float limiterTime;
        int sliding;
        float fps = 60f, nextDebug;
        readonly FrameStats frames = new FrameStats();

        // ?bench: start the engine, let the ScriptedDriver drive 60 s and log the frame times every 10 s (frame-rate checks in the browser).
        bool bench;
        float benchNext, benchEnd;
        readonly FrameStats benchFrames = new FrameStats();

        void Bench()
        {
            if (car == null) return;
            if (flow.Phase == Phase.Intro) { car.Driver = new ScriptedDriver { TargetKmh = 70f }; StartEngine(); return; }
            if (flow.Phase != Phase.Racing) return;
            float now = Time.unscaledTime;
            if (benchEnd == 0f) { benchEnd = now + 60f; benchNext = now + 10f; benchFrames.Clear(); RallyLog.Info("bench: driving 60 s"); }
            benchFrames.Record(Time.unscaledDeltaTime);
            if (now < benchNext) return;
            benchNext = now + 10f;
            var st = world.GetStats();
            RallyLog.Info($"bench: avg {benchFrames.AvgMs:0.0} ms  p95 {benchFrames.PercentileMs(0.95f):0.0} ms  fps {1000f / math.max(0.01f, benchFrames.AvgMs):0}  "
                + $"trees {world.Vegetation?.Drawn ?? 0}  tiles {st.CoarseLoaded}+{st.FineLoaded}  {car.State.SpeedKmh:0} km/h");
            benchFrames.Clear();
            if (now >= benchEnd) { bench = false; car.Driver = null; RallyLog.Info("bench: done"); }
        }

        void LoadSettings()
        {
            autoShift = autoShiftSaved = BrowserDom.LocalGet("rally.gearbox") != "manual";
            int.TryParse(BrowserDom.LocalGet("rally.sliding") ?? "0", out sliding);
            sliding = math.clamp(sliding, 0, GripMode.SlideLevels.Length - 1);
            muted = BrowserDom.LocalGet("rally.muted") == "1";
            carIndex = Math.Max(0, Array.IndexOf(ChooserKinds(), Garage.Parse(BrowserDom.LocalGet("rally.car"))));
            AudioListener.volume = muted ? 0f : 1f;
            Hud?.SetGearbox(autoShift);
            Hud?.SetSliding(sliding, GripMode.SlideLevels[sliding]);
        }

        void SaveSettings()
        {
            BrowserDom.LocalSet("rally.gearbox", autoShiftSaved ? "auto" : "manual");
            BrowserDom.LocalSet("rally.sliding", sliding.ToString());
            BrowserDom.LocalSet("rally.muted", muted ? "1" : "0");
        }

        // ---- car chooser (start screen) ----

        int carIndex;

        /// <summary>The chooser's prefabs: CarPrefabs, or the single CarPrefab of an older scene.</summary>
        GameObject[] Chooser => CarPrefabs != null && CarPrefabs.Length > 0 ? CarPrefabs : new[] { CarPrefab };
        GameObject ChosenPrefab => Chooser[math.clamp(carIndex, 0, Chooser.Length - 1)];
        CarKind[] ChooserKinds() => Array.ConvertAll(Chooser, p => p != null && p.TryGetComponent<CarController>(out var c) ? c.Kind : CarKind.Porsche);

        /// <summary>The car the player has chosen (for tests and tools).</summary>
        public CarKind ChosenCar => ChooserKinds()[math.clamp(carIndex, 0, Chooser.Length - 1)];

        void ShowCarCards()
        {
            if (Hud == null) return;
            var kinds = ChooserKinds();
            var cards = new List<HudController.CarCard>();
            foreach (var k in kinds)
                cards.Add(new HudController.CarCard { Name = Garage.Info(k).Name, Stats = Garage.Stats(CarSpec.For(k)), Picture = Resources.Load<Texture2D>("UI/Cars/" + k) });
            Hud.SetCars(cards, carIndex);
        }

        /// <summary>
        /// Start screen: pick car <paramref name="index"/> of the chooser (wraps). Remembered in localStorage rally.car; on the
        /// start screen the car on the line is replaced at once and the room hears the new kind. Ignored once the stage runs.
        /// </summary>
        public void ChooseCar(int index)
        {
            if (flow.Phase != Phase.Loading && flow.Phase != Phase.Intro) { Say("ESC or MENU: back to the start screen to change the car", 2.5f); return; }
            int n = Chooser.Length;
            carIndex = ((index % n) + n) % n;
            var kind = ChosenCar;
            BrowserDom.LocalSet("rally.car", Garage.Info(kind).Id);
            Hud?.SelectCar(carIndex);
            if (car != null && car.Kind == kind) return;
            if (car != null && world != null)
            {
                var old = car;
                old.gameObject.SetActive(false);
                Destroy(old.gameObject);
                SpawnCar();
                WireCamera();
                if (session != null) { session.Kind = kindName; if (mySlot >= 0) OnSlot(mySlot); }
            }
            RallyLog.Info($"car: {Garage.Info(kind).Name}");
        }

        /// <summary>
        /// The keys of the JS game that are not driving (CarController reads those): G gearbox, R restart, N new stage,
        /// M mute, Esc map/menu, F10/F3 debug window. Ignored while the room-code field has the keyboard.
        /// </summary>
        void HandleKeys()
        {
            var gp = Gamepad.current;
            if (gp != null && (flow.Phase == Phase.Intro || flow.Phase == Phase.Loading) && (Hud == null || !Hud.HelpVisible))
            {
                if (gp.dpad.left.wasPressedThisFrame) ChooseCar(carIndex - 1);
                if (gp.dpad.right.wasPressedThisFrame) ChooseCar(carIndex + 1);
            }
            var kb = Keyboard.current;
            if (kb == null || (Hud != null && Hud.IsTyping)) return;
            if (Hud != null)
            {
                Hud.KeepRunningUnderHelp = session != null && !session.Closed;
                if (kb.hKey.wasPressedThisFrame || kb.f1Key.wasPressedThisFrame) Hud.HelpVisible = !Hud.HelpVisible;
                if (Hud.HelpVisible) { if (kb.escapeKey.wasPressedThisFrame) Hud.HelpVisible = false; return; }   // keys stay with the help screen
            }
            if (flow.Phase == Phase.Intro || flow.Phase == Phase.Loading)
            {
                if (kb.leftArrowKey.wasPressedThisFrame) ChooseCar(carIndex - 1);
                if (kb.rightArrowKey.wasPressedThisFrame) ChooseCar(carIndex + 1);
            }
            if (kb.gKey.wasPressedThisFrame) ToggleGearbox();
            if (kb.mKey.wasPressedThisFrame) ToggleMute();
            if (kb.f10Key.wasPressedThisFrame || kb.f3Key.wasPressedThisFrame) { if (Hud != null) Hud.DebugVisible = !Hud.DebugVisible; }
            if (kb.escapeKey.wasPressedThisFrame) BackToMenu();
            if (car == null || flow.Phase == Phase.Loading) return;
            if (kb.rKey.wasPressedThisFrame) { Restart(); Say("RESTART", 1.5f); }
            if (kb.nKey.wasPressedThisFrame && flow.Phase != Phase.Intro) ScoutNewStage();
        }

        void ToggleGearbox()
        {
            autoShift = autoShiftSaved = !autoShift;
            if (car != null) car.AutoShift = autoShift;
            SaveSettings();
            Hud?.SetGearbox(autoShift);
            Say(autoShift ? "GEARBOX: AUTOMATIC" : "GEARBOX: MANUAL — Q/E to shift", 2.5f);
        }

        void CycleSliding()
        {
            sliding = (sliding + 1) % GripMode.SlideLevels.Length;
            if (car != null) car.GripMode = (SlideMode)sliding;
            SaveSettings();
            Hud?.SetSliding(sliding, GripMode.SlideLevels[sliding]);
        }

        void ToggleMute()
        {
            muted = !muted;
            AudioListener.volume = muted ? 0f : 1f;
            SaveSettings();
            Say(muted ? "SOUND OFF (M)" : "SOUND ON", 1.5f);
        }

        /// <summary>main.js returnToMenu: the car back on the start line, the start screen up, the clock reset.</summary>
        public void ToMenu()
        {
            if (car == null) return;
            ResetToStart();
            flow.ToMenu();
        }

        /// <summary>
        /// Esc and the HUD's MENU button: closes the route map if it is open, else goes back to the start screen from every
        /// phase of a stage (countdown, racing, finished; route, endless or free drive). There the car, gearbox, sliding,
        /// route and room can be changed, and START ENGINE restarts the stage. While loading the start screen is already up.
        /// </summary>
        public void BackToMenu()
        {
            if (mapOpen) { CloseMap(); return; }
            if (Hud != null && Hud.HelpVisible) Hud.HelpVisible = false;
            if (flow.Phase != Phase.Loading && flow.Phase != Phase.Intro) ToMenu();
        }

        /// <summary>main.js scoutNewStage: a fresh endless stage from where the car is, with a new seed.</summary>
        void ScoutNewStage()
        {
            var here = Proj.ToLatLon(FloatingOrigin.ToUtm(car.State.Pos));
            ulong seed = (ulong)DateTime.UtcNow.Ticks * 0x9E3779B97F4A7C15UL;
            Say("SCOUTING A NEW STAGE…", 3f);
            _ = LoadStage(ShareLinks.Endless(seed, here));
        }

        /// <summary>Load a stage the player picked here (map, scout): address bar updated so the link can be shared, the room follows.</summary>
        async Task LoadStage(string query)
        {
            BrowserDom.UrlReplace(query);
            try
            {
                await LoadFromQuery(query);
                if (session != null && !session.Closed) session.SendRoute(RoomRoute());
            }
            catch (Exception e) { RallyLog.Error("stage load failed: " + e); Say("Could not load that stage: " + e.Message, 6f); }
        }

        /// <summary>The route map (web template, Leaflet): opens on the current start/finish with the stage line drawn.</summary>
        void OpenMap()
        {
            if (Application.platform != RuntimePlatform.WebGLPlayer) { Say("The route map needs the web build", 3f); RallyLog.Info("map: the Leaflet route map only exists in the web build"); return; }
            mapOpen = true;
            var o = new Dictionary<string, object>();
            var start = car != null ? Proj.ToLatLon(FloatingOrigin.ToUtm(car.State.Pos)) : link.A;
            o["start"] = new Dictionary<string, object> { { "lat", start.Lat }, { "lon", start.Lon } };
            if (link.Kind == ShareLinks.Kind.Osrm) o["finish"] = new Dictionary<string, object> { { "lat", link.B.Lat }, { "lon", link.B.Lon } };
            BrowserDom.MapOpen(Json.Stringify(o));
            if (stage != null)
            {
                var pts = new List<object>();
                for (int i = 0; i < stage.Samples.Length; i += 8)
                {
                    var ll = Proj.ToLatLon(new Utm33(stage.Samples[i].E, stage.Samples[i].N));
                    pts.Add(new List<object> { Math.Round(ll.Lat, 5), Math.Round(ll.Lon, 5) });
                }
                BrowserDom.MapSetRoute(Json.Stringify(pts));
            }
        }

        void CloseMap() { mapOpen = false; BrowserDom.MapClose(); }

        /// <summary>Route map events: pins snap to the profile's nearest road within 1 km (stage.js snapToRoad), GENERATE and FREE DRIVE load the stage.</summary>
        async void OnMapEvent(string json)
        {
            var e = Json.ParseObject(json);
            if (e == null) return;
            string profileName = e.Str("profile") ?? "driving";
            try
            {
                switch (e.Str("ev"))
                {
                    case "pick":
                    {
                        int which = (int)e.Num("which", 0);
                        var p = new LatLon(e.Num("lat"), e.Num("lon"));
                        string label = which == 0 ? "Start" : "Finish";
                        if (profileName == "offroad") { BrowserDom.MapStatus($"{label} set where you picked."); break; }
                        var snap = await router.Nearest(p, Profile(profileName), 1000, cts.Token);
                        if (snap == null) { BrowserDom.MapStatus($"{label}: no {profileName} road within 1 km. Move the pin nearer a mapped road or trail."); break; }
                        var sp = snap.Value;
                        BrowserDom.MapSetPin(which, sp.Point.Lat, sp.Point.Lon);
                        string road = string.IsNullOrEmpty(sp.Name) ? "the road" : sp.Name;
                        BrowserDom.MapStatus($"{label} snapped {sp.DistanceM:0} m onto {road}." + (which == 0 ? " Now click the FINISH, or FREE DRIVE HERE." : " GENERATE ROUTE when ready."));
                        RallyLog.Info($"map: {label} snapped {sp.DistanceM:0} m onto {road}");
                        break;
                    }
                    case "generate":
                    {
                        var a = e.Obj("start"); var b = e.Obj("finish");
                        if (a == null || b == null) break;
                        if (profileName == "offroad") { BrowserDom.MapStatus("Off-road routing is not in the Unity build yet: pick driving, cycling or foot."); break; }
                        CloseMap();
                        await LoadStage(ShareLinks.Osrm(new LatLon(a.Num("lat"), a.Num("lon")), new LatLon(b.Num("lat"), b.Num("lon")), profileName));
                        break;
                    }
                    case "free":
                    {
                        var a = e.Obj("start");
                        if (a == null) break;
                        CloseMap();
                        await LoadStage(ShareLinks.Drive(new LatLon(a.Num("lat"), a.Num("lon"))));
                        break;
                    }
                    case "close": mapOpen = false; break;
                }
            }
            catch (OperationCanceledException) { }
            catch (Exception ex) { BrowserDom.MapStatus("Routing failed: " + ex.Message); RallyLog.Warn("map: " + ex.Message); }
        }

        static RouteProfile Profile(string name) => name == "cycling" ? RouteProfile.Cycling : name == "foot" ? RouteProfile.Foot : RouteProfile.Driving;

        async void ClearCache()
        {
            if (cache == null) return;
            await cache.Clear();
            RallyLog.Info("cache: cleared by the player");
            await RefreshCacheInfo();
        }

        async Task RefreshCacheInfo()
        {
            if (cache == null || Hud == null) return;
            try
            {
                var st = await cache.Stats();
                Hud.SetCacheInfo($"Local cache: {st.Entries} items, {st.Bytes / 1048576.0:0.0} MB of {st.Budget / 1073741824.0:0} GB");
            }
            catch (Exception e) { Hud.SetCacheInfo("Local cache: " + e.Message); }
        }

        /// <summary>main.js debug window: where the car is, what it stands on, frame rate and streaming.</summary>
        string DebugText()
        {
            var sb = new System.Text.StringBuilder(512);
            sb.Append($"GRAND TOUR NORWAY · debug (F10 / F3)\nfps {fps:0}   frame {frames.AvgMs:0.0} ms, p95 {frames.PercentileMs(0.95f):0.0} ms   phase {flow.Phase}\n");
            if (car != null)
            {
                ref var s = ref car.State;
                var ll = Proj.ToLatLon(FloatingOrigin.ToUtm(s.Pos));
                float heading = (math.degrees(s.Yaw) % 360f + 360f) % 360f;
                sb.Append($"lat {ll.Lat:0.00000}  lon {ll.Lon:0.00000}\naltitude {s.Pos.y:0.0} m   heading {heading:0}°\n");
                sb.Append($"speed {s.SpeedKmh:0} km/h   gear {s.Gear} ({(car.AutoShift ? "auto" : "manual")})   rpm {s.Rpm:0}\n");
                sb.Append($"sliding {GripMode.SlideLevels[sliding]}   surface {(s.OnRoad ? (s.SurfaceKind == Surface.Asphalt ? "asphalt road" : "gravel road") : "off road")}\n");
                sb.Append($"water {s.WaterDepth:0.00} m   airborne {(s.Grounded ? "no" : "yes")}   damage {car.Damage * 100f:0}%\n");
            }
            if (world != null)
            {
                var st = world.GetStats();
                sb.Append($"tiles {st.CoarseLoaded} coarse + {st.FineLoaded} fine, {st.Pending} pending, {st.Bytes / 1048576} MB heights\n");
            }
            sb.Append($"sound {(muted ? "off" : "on")}   stage {link.Kind}");
            return sb.ToString();
        }

        #endregion

        #region Friends (Rally.Net)

        bool roomHooked;

        /// <summary>Friends panel: open a room; the code is shown in the status line.</summary>
        public async void HostRoom()
        {
            try
            {
                NewSession(true);
                string code = await session.Host();
                Say($"ROOM {code}", 10f);
                ShowRoom($"Room {code}: friends press JOIN with this code");
            }
            catch (Exception e) { Say(e.Message, 6f); }
        }

        /// <summary>Friends panel: join a room by its 4-letter code; the grid slot moves the car back on the start line.</summary>
        public async void JoinRoom(string code)
        {
            try
            {
                NewSession(false);
                await session.Join(code);
            }
            catch (Exception e) { Say(e.Message, 6f); }
        }

        void NewSession(bool host)
        {
            session?.Close();
            mySlot = -1;
            session = new Session(null, kindName);
            session.Status += m => { Say(m, 5f); ShowRoom(m); };
            session.Error += m => Say(m, 6f);
            session.SlotAssigned += OnSlot;
            session.Route += OnRoomRoute;
            session.Go += ScheduleGo;
            session.ResultsChanged += () => { if (session.Results.Count > 0) ShowRoom(session.Leaderboard()); };
            session.PathChanged += (id, kind) => ShowRoom($"{(session.Peers.TryGetValue(id, out var p) ? p.Name : id)}: {Session.PathLabel(kind)}");
            session.PeerLeave += (id, reason) => { if (reason == "timeout") Say("A player dropped (no answer for 5 s)", 4f); };
            if (!roomHooked) { roomHooked = true; flow.PhaseChanged += OnRoomPhase; }
            if (Ghosts != null) Ghosts.Session = session;
            if (host && world != null) session.SendRoute(RoomRoute());
        }

        void ShowRoom(string text) => Hud?.ShowRoomStatus(text);

        /// <summary>The share-link query of the stage we are on: what a guest needs to rebuild the identical stage.</summary>
        string CurrentQuery() => link.Kind switch
        {
            ShareLinks.Kind.Osrm => ShareLinks.Osrm(link.A, link.B, link.Profile),
            ShareLinks.Kind.Demo => ShareLinks.Demo(link.A, link.B),
            ShareLinks.Kind.Endless => ShareLinks.Endless(link.Seed, link.A),
            _ => ShareLinks.Drive(link.A),
        };

        Dictionary<string, object> RoomRoute() => new Dictionary<string, object>
        {
            { "kind", link.Kind.ToString().ToLowerInvariant() }, { "query", CurrentQuery() }, { "seed", (double)link.Seed },
        };

        /// <summary>A stage arrived over the room: load it; the host also relays a guest's pick to everyone else and starts the countdown together.</summary>
        async void OnRoomRoute(Dictionary<string, object> r, string from)
        {
            string query = r.Str("query");
            if (string.IsNullOrEmpty(query)) { Say("The other player's game sent a stage this build cannot load", 6f); return; }
            try
            {
                await LoadFromQuery(query);
                if (session != null && session.IsHost) { session.SendRoute(RoomRoute(), from); flow.Restart(); }
            }
            catch (OperationCanceledException) { }
            catch (Exception e) { Say(e.Message, 6f); }
        }

        /// <summary>Host: a countdown that starts here starts everywhere; a finish goes on the board.</summary>
        void OnRoomPhase(Phase p)
        {
            if (session == null || session.Closed) return;
            if (p == Phase.Countdown && session.IsHost) session.SendGo(PeerBridge.NowMs + flow.Countdown * 1000);
            if (p == Phase.Finished && !flow.Retired && !flow.FreeDrive) session.SendResult(flow.StageTime * 1000, flow.PenaltyTime * 1000);
        }

        /// <summary>Guest: the countdown ends at <paramref name="localAtMs"/>, so it starts 3 s before (the host's own countdown is already running).</summary>
        async void ScheduleGo(double localAtMs)
        {
            if (session == null || session.IsHost) return;
            double delay = localAtMs - GameFlow.CountdownSeconds * 1000 - PeerBridge.NowMs;
            if (delay > 0) await Task.Delay(TimeSpan.FromMilliseconds(delay));
            if (session == null || session.Closed || car == null) return;
            Restart();
        }

        /// <summary>
        /// Rebuild the world from a share-link query (the boot path, and a stage handed over in a room):
        /// link → sources → world around the start → route → car → systems. Tears the previous stage down first.
        /// </summary>
        public async Task LoadFromQuery(string query)
        {
            flow.Reload();
            Teardown();
            link = ShareLinks.Parse(query) ?? new ShareLinks.Link(ShareLinks.Kind.Free, DefaultStart, default, "driving", 0);
            anchor = Proj.ToUtm(link.A);
            FloatingOrigin.Set(anchor);            // the start pin is the scene origin until the car has driven 2 km
            CreateSources();
            CreateWorld();
            BrowserDom.LoaderText("Fetching terrain…");
            status = "LOADING TERRAIN";
            await WaitUntil(() => world.IsLoaded(float2.zero));          // the car waits only here (CONVENTIONS / stream.js)
            await WaitUntil(StartRoadsArrived, 20f);                     // roads of the start tiles (Overpass may be slow or down)
            await CreateRoute();
            SpawnCar();
            WireSystems();
            BrowserDom.LoaderHide();
            status = "";
            flow.WorldReady();
            _ = RefreshCacheInfo();
            if (session != null) car.Frozen = flow.Phase != Phase.Racing;   // a reload mid-room: the phase did not change, so OnPhase did not run
        }

        /// <summary>
        /// The route may be chosen once the road answer of every coarse tile within <see cref="EndlessStartRadius"/>
        /// of the start has been applied. Waiting for "any roads" let a neighbour tile that answered first decide
        /// the start, and the endless walk then found no road near the pin and fell back to free drive off the road.
        /// </summary>
        bool StartRoadsArrived()
        {
            double r = EndlessStartRadius;
            var lo = TileKey.At(TileKind.Coarse, anchor + new double2(-r, -r));
            var hi = TileKey.At(TileKind.Coarse, anchor + new double2(r, r));
            for (int j = lo.J; j <= hi.J; j++)
                for (int i = lo.I; i <= hi.I; i++)
                {
                    var key = new TileKey(TileKind.Coarse, i, j);
                    if (key.RectDistance(anchor) <= r && !roads.HasTile(key)) return false;
                }
            return true;
        }

        void Teardown()
        {
            if (world == null) return;
            FloatingOrigin.Rebased -= OnRebased;
            flow.PhaseChanged -= OnPhase;
            foreach (var go in ribbons.Values) Destroy(go);
            ribbons.Clear();
            foreach (var key in new List<TileKey>(bridgeObjects.Keys)) DropBridges(key);
            foreach (var key in new List<TileKey>(tunnelObjects.Keys)) DropBridges(key);
            results.Clear(); activeOverlay = null;
            foreach (var v in actorViews.Values) Destroy(v.gameObject);
            actorViews.Clear();
            actors = null;
            if (car != null) Destroy(car.gameObject);
            car = null; audio = null;
            signs?.Dispose(); signs = null;
            arrow?.Dispose(); arrow = null;
            gate?.Dispose(); gate = null; gateTimer = 0f;   // its root is under the world's: before the world goes
            world.Dispose();
            world = null; roads = null; stage = null; route = null; walk = null; edges = null; turns = null;
            stagePoints.Clear(); sectorEnds.Clear(); prefetchPath.Clear(); lastSector = 0; prefetchAt = float.NegativeInfinity;
        }

        /// <summary>multiplayer.js spawnOffset: slot 0 on the line, pairs every 6 m back, so nobody spawns inside anybody.</summary>
        int mySlot = -1;

        void OnSlot(int slot)
        {
            mySlot = slot;
            if (car == null) return;
            var (back, side) = RoomCodes.SpawnOffset(slot);
            var p = route.StartPose();
            var xz = p.XZ - CarSim.Forward(p.Yaw) * back + CarSim.Right(p.Yaw) * side;
            car.ResetTo(xz, p.Yaw);
        }

        /// <summary>
        /// The wire frame is the JS local projection: metres from the stage anchor, x east, y up, z south,
        /// yaw 0 = south and π/2 = east. UTM is x east / N north, Unity yaw 0 = north, so z and yaw flip.
        /// </summary>
        StatePacket Packet(ref CarState s)
        {
            var d = FloatingOrigin.ToUtm(s.VisualPos).Minus(anchor);
            return new StatePacket { X = d.x, Y = s.VisualPos.y, Z = -d.y, Yaw = math.PI - s.Yaw, Pitch = s.Pitch, Roll = s.Roll, Speed = s.Speed, Kind = kindName, Name = session.Name };
        }

        (Vector3 position, Quaternion rotation) WireToWorld(GhostPose p)
        {
            var w = FloatingOrigin.ToWorld(anchor + new double2(p.X, -p.Z), (float)p.Y);
            return ((Vector3)w, Quaternion.Euler((float)(p.Pitch * Mathf.Rad2Deg), (float)((math.PI - p.Yaw) * Mathf.Rad2Deg), (float)(p.Roll * Mathf.Rad2Deg)));
        }

        #endregion
    }
}
