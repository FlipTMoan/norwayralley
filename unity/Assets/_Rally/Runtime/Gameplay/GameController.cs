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
        [Tooltip("Prefab with CarController (+ CarEffects, CarDamageVisual, CarAudio). Its Kind field picks the garage car.")]
        public GameObject CarPrefab;
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
        IRouter router;

        // World
        TileWorld world;
        RoadGraph roads;
        readonly Dictionary<TileKey, GameObject> ribbons = new Dictionary<TileKey, GameObject>();
        readonly Queue<TileResult> results = new Queue<TileResult>();
        FlatGround naturalGround;            // the uncarved DTM as an IGround, for StageRoute.AssignRoadY

        // Track
        IRoute route;
        StageRoute stage;
        List<Turn> turns;
        RoadWalk walk;
        RoadGraphEdges edges;
        readonly List<Utm33> stagePoints = new List<Utm33>();
        readonly List<float> sectorEnds = new List<float>();
        readonly List<Utm33> prefetchPath = new List<Utm33>();
        int lastSector;

        // Vehicle, flow, actors, net
        CarController car;
        CarAudio audio;
        readonly GameFlow flow = new GameFlow();
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
        }

        #endregion

        #region Boot

        async void Start()
        {
            try { await Boot(); }
            catch (OperationCanceledException) { }
            catch (Exception e) { RallyLog.Error("boot failed: " + e); status = "LOAD FAILED: " + e.Message; }
        }

        void OnDestroy()
        {
            cts.Cancel();
            FloatingOrigin.Rebased -= OnRebased;
            session?.Close();
            world?.Dispose();
            world = null;
        }

        /// <summary>main.js boot: link → sources → world around the start → route → car → systems → intro.</summary>
        async Task Boot()
        {
            string query = BrowserDom.UrlParams();
            if (string.IsNullOrEmpty(query)) query = EditorQuery;
            link = ShareLinks.Parse(query) ?? new ShareLinks.Link(ShareLinks.Kind.Free, DefaultStart, default, "driving", 0);
            anchor = Proj.ToUtm(link.A);
            FloatingOrigin.Set(anchor);            // the start pin is the scene origin until the car has driven 2 km
            CreateSources();
            CreateWorld();
            BrowserDom.LoaderText("Fetching terrain…");
            status = "LOADING TERRAIN";
            await WaitUntil(() => world.IsLoaded(float2.zero));          // the car waits only here (CONVENTIONS / stream.js)
            await WaitUntil(() => roads.SegmentCount > 0, 20f);          // roads of the start tile (Overpass may be slow or down)
            await CreateRoute();
            SpawnCar();
            WireSystems();
            BrowserDom.LoaderHide();
            status = "";
            flow.WorldReady();
        }

        /// <summary>Real services on the web (IndexedDB cache shared with the JS game); FakeSources or the file cache in the editor.</summary>
        void CreateSources()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            bool fake = false;
            cache = new GeoCache(new IdbBackend());
            IdbBackend.RequestPersistence();
#else
            bool fake = UseFakeSources;
            cache = new GeoCache(FileBackend.Default());
#endif
            if (fake)
            {
                var osm = new FakeSources.Osm();
                dem = new FakeSources.Dem { BumpAt = anchor + new double2(300, 200) };
                roadSource = osm; featureSource = osm;
                landcoverSource = new FakeSources.Landcover();
                router = new FakeSources.Router();
                return;
            }
            var overpass = new OverpassSource(cache);
            dem = new KartverketDem(cache);
            roadSource = overpass; featureSource = overpass;
            landcoverSource = new Sr16Source(cache);
            router = new OsrmRouter(cache);
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
            try
            {
                var grid = await dem.Fetch(key.Bounds, key.CellM, ct);
                if (grid == null || grid.N != TileScheduler.Samples)
                {
                    grid?.Dispose();
                    throw new Exception($"DEM {key}: {(grid == null ? "no data" : grid.N + " samples")}");
                }
                double latitude = Proj.ToLatLon(key.Origin).Lat;
                results.Enqueue(new TileResult
                {
                    Key = key,
                    Apply = () =>
                    {
                        if (world == null) { grid.Dispose(); return true; }
                        if (key.Kind == TileKind.Fine && HoldFineTile(key)) return false;
                        world.OnTileData(key, grid.Heights, null, null, latitude);
                        grid.Dispose();
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
            RoadGraphData roadData = null; Features features = null; CoverRaster cover = null;
            try { roadData = await roadTask; } catch (OperationCanceledException) { throw; } catch (Exception e) { RallyLog.Info($"roads {key}: {e.Message}"); }
            try { features = await featureTask; } catch (OperationCanceledException) { throw; } catch (Exception e) { RallyLog.Info($"features {key}: {e.Message}"); }
            try { cover = await coverTask; } catch (OperationCanceledException) { throw; } catch (Exception e) { RallyLog.Info($"landcover {key}: {e.Message}"); }
            results.Enqueue(new TileResult
            {
                Key = key,
                Apply = () =>
                {
                    if (world == null || !world.Tiles.ContainsKey(key)) return true;
                    if (!world.Scheduler.IsReady(key)) return false;    // the DTM result is still ahead in the queue
                    if (roadData != null)
                    {
                        var lines = roads.SetTile(key, roadData, p => world.BaseHeightAt(p));
                        var b = key.Bounds;
                        world.RecarveWithin(new Bounds25833(b.MinE - RoadGraph.TilePad, b.MinN - RoadGraph.TilePad, b.MaxE + RoadGraph.TilePad, b.MaxN + RoadGraph.TilePad));
                        BuildRibbon(key, lines);
                    }
                    if (features != null || cover != null) world.OnTileFeatures(key, cover, features);
                    return true;
                },
            });
            if (roadData == null && !ct.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromMilliseconds(CircuitBreaker.RetryMs), ct);
                if (world != null && world.Tiles.ContainsKey(key)) await FetchFeatures(key, ct);
            }
        }

        /// <summary>At most one tile result per frame (one carve / upload), oldest first; a held fine tile goes to the back.</summary>
        void ApplyOneTileResult()
        {
            if (results.Count == 0) return;
            var r = results.Dequeue();
            if (r.Since == 0f) r.Since = Time.time;
            bool done = r.Apply();
            if (!done && r.Key.Kind == TileKind.Fine && Time.time - r.Since > 3f)
            {
                // Held only because the car is close: 3 s are up, let the fine tile snap in.
                float keep = FineTileHoldDistance;
                FineTileHoldDistance = -1f;
                done = r.Apply();
                FineTileHoldDistance = keep;
            }
            if (!done) results.Enqueue(r);
        }

        /// <summary>The road surface of a tile: RibbonMesh over the carved ground, materials tarmac / gravel.</summary>
        void BuildRibbon(TileKey key, List<RoadPolyline> lines)
        {
            if (ribbons.TryGetValue(key, out var old)) { Destroy(old); ribbons.Remove(key); }
            var mesh = RibbonMesh.Build(lines, key.Origin, world.CarvedHeightAt);
            if (mesh == null) return;
            var go = new GameObject("Ribbon " + key);
            go.transform.SetParent(world.Root, false);
            go.transform.position = FloatingOrigin.ToWorld(key.Origin, 0);
            go.AddComponent<MeshFilter>().sharedMesh = mesh;
            go.AddComponent<MeshRenderer>().sharedMaterials = new[] { TarmacMaterial, GravelMaterial };
            ribbons[key] = go;
        }

        void OnTileDisposing(TerrainTile tile)
        {
            if (ribbons.TryGetValue(tile.Key, out var go)) { Destroy(go); ribbons.Remove(tile.Key); }
            if (tile.Key.Kind == TileKind.Coarse) roads.RemoveTile(tile.Key);
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
                    edges = new RoadGraphEdges(roads);
                    long node = roads.NearestNode(anchor, 600);
                    if (node == 0) { RallyLog.Warn("endless: no road junction near the start; free drive instead"); goto default; }
                    walk = new RoadWalk(edges, link.Seed, node, new float2(0, 1));
                    stagePoints.Clear();
                    if (!walk.ExtendSector()) { RallyLog.Warn("endless: the walk could not leave the start; free drive instead"); walk = null; goto default; }
                    AppendSector();
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

        /// <summary>The walk's newest sector: its links' graded points onto the stage line, and the tiles under them into the prefetch path.</summary>
        void AppendSector()
        {
            prefetchPath.Clear();
            foreach (var e in walk.LastSector)
            {
                var l = edges.Link(e);
                if (l == null) continue;
                for (int i = stagePoints.Count > 0 ? 1 : 0; i < l.Points.Count; i++)
                {
                    var u = new Utm33(l.Points[i].x, l.Points[i].y);
                    stagePoints.Add(u);
                    if ((i & 7) == 0) prefetchPath.Add(u);   // every 40 m is plenty for 256 m tiles
                }
            }
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
            car = Instantiate(CarPrefab).GetComponent<CarController>();
            if (car == null) throw new Exception("CarPrefab has no CarController");
            audio = car.GetComponent<CarAudio>();
            kindName = car.Kind == CarKind.Buggy ? "buggy" : "porsche";
            int carLayer = LayerMask.NameToLayer("Car");
            if (carLayer >= 0) car.gameObject.layer = carLayer;
            car.SolidLayers = RallyLayers.SolidMask;
            car.TreeLayers = 1 << RallyLayers.Trees;
            car.WaterLayers = 1 << RallyLayers.Water;
            car.ActorLayers = 1 << RallyLayers.Actors;
            car.Ground = world;
            car.Frozen = true;
            car.SetRoute(route);
            car.OnWaterEnter += p => world.Wake?.Add(new float2(p.x, p.z), 1f);
        }

        void WireSystems()
        {
            if (Rig != null)
            {
                Rig.Target = car.transform;
                Rig.GroundHeight = world.HeightAt;
                Rig.SeatEye = (Vector3)car.Spec.Eye;
            }
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
            car.Repair();
            car.SetRoute(route);
            actors.Clear();
            if (stage != null) for (int i = 0; i < math.max(1, sectorEnds.Count); i++) AddSectorPlans(i, i == 0 ? 0f : sectorEnds[i - 1], sectorEnds.Count > i ? sectorEnds[i] : stage.Length);
            flow.Restart();
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
            if (world == null) return;
            float dt = Time.deltaTime;
            ApplyOneTileResult();
            // The scheduler is fed the car's position and velocity every frame: its led point (LEAD 2800 m) keeps
            // the loaded ring ahead of a fast car, exactly stream.js. Before the car exists the start is the focus.
            float3 carPos = car != null ? (float3)car.transform.position : float3.zero;
            double2 velocity = car != null ? (double2)car.State.Vel : double2.zero;
            world.Update(carPos, velocity, MainCamera, dt);
            if (car == null) { ShowHud(RouteQuery.None(float2.zero)); return; }

            if (flow.Phase == Phase.Intro && Keyboard.current != null && Keyboard.current.enterKey.wasPressedThisFrame) StartEngine();
            flow.Update(dt);
            ref var s = ref car.State;
            var q = route.Nearest(s.Pos.xz, 120f);
            float carS = q.S;

            actors.Update(dt, carS, s.Pos.xz, s.Speed, CarSim.CarRadius);
            if (s.WaterDepth > 0.05f && s.Speed > 2f) world.Wake?.Add(s.Pos.xz, 0.3f);
            if (car.Wrecked) flow.Retire();
            if (stage != null && walk == null && flow.Phase == Phase.Racing && carS >= stage.Length - 6f) flow.Finish();
            if (walk != null) Endless(carS);
            if (session != null && !session.Closed) session.SendState(Packet(ref s));
            ShowHud(q);
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
                hud.SpeedKmh = s.SpeedKmh; hud.Rpm = s.Rpm; hud.Redline = car.Spec.Redline; hud.Gear = s.Gear;
                hud.Damage = car.Damage;
                hud.Surface = s.OnRoad ? (s.SurfaceKind == Surface.Asphalt ? "ASPHALT" : "GRAVEL") : (s.WaterDepth > 0.3f ? "WATER" : "OFF ROAD");
                hud.DistanceLeft = stage != null && walk == null ? math.max(0f, stage.Length - q.S) : 0f;
                int next = turns != null ? PaceNotes.NextTurn(turns, q.S) : -1;
                if (next >= 0)
                {
                    var t = turns[next];
                    hud.NoteKind = NoteText(t);
                    hud.NoteAngle = t.Angle;                      // positive = left (PaceNotes)
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
                case Phase.Loading: return status + "  " + statsText;
                case Phase.Intro: return "ENTER to start the engine  " + statsText;
                case Phase.Countdown: return Mathf.CeilToInt(flow.Countdown).ToString();
                case Phase.Finished: return status;
            }
            if (car != null && car.State.WrongWay) return "WRONG WAY";
            if (Time.time < transientUntil) return transient;
            return statsText;
        }

        #endregion

        #region Friends (Rally.Net)

        /// <summary>Friends panel: open a room; the code is shown in the status line.</summary>
        public async void HostRoom()
        {
            try
            {
                NewSession(true);
                string code = await session.Host();
                Say($"ROOM {code}", 10f);
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
            session = new Session(null, kindName);
            session.Status += m => Say(m, 5f);
            session.Error += m => Say(m, 6f);
            session.SlotAssigned += OnSlot;
            session.Route += (r, from) => Say("The host picked a new stage: open their link", 8f);   // stage hand-over is not ported (see docs/integration-review.md)
            if (Ghosts != null) Ghosts.Session = session;
            if (host && stage != null) session.SendRoute(new Dictionary<string, object> { { "kind", link.Kind.ToString().ToLowerInvariant() }, { "query", EditorQuery } });
        }

        /// <summary>multiplayer.js spawnOffset: slot 0 on the line, pairs every 6 m back, so nobody spawns inside anybody.</summary>
        void OnSlot(int slot)
        {
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
