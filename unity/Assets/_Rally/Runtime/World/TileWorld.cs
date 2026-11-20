using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Unity.Collections;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// The streamed world as one object: owns the scheduler, the atlases, every <see cref="TerrainTile"/>,
    /// the clipmap, the forest, the water and the houses, and answers <see cref="IGround"/> for the car.
    /// Data arrives from outside (the Geo layer fetches; the driver calls <see cref="OnTileData"/>), roads
    /// come through <see cref="Roads"/> (Rally.Roads sets it; World cannot reference Roads).
    /// Height lookup order is stream.js: the 1 m tiles along the roads first, then the 8 m tiles, then the
    /// road profile and ribbon lift on top, exactly as car.js groundAt does it.
    /// </summary>
    public sealed class TileWorld : IGround, ILayeredGround, IDisposable
    {
        public const int CoarseSlices = 96, FineSlices = 32, SplatRes = 128;
        /// <summary>
        /// Every tile's DTM is its own WCS request, resampled from its own lat/lon raster, so two neighbours disagree on the
        /// samples of their common edge (seam survey 2026-11-20: coarse edges 0.75 m apart on average, up to 33 m at cliffs;
        /// fine edges 5 cm, up to 1.4 m). A new tile takes the edge of each neighbour of its kind that is already in, exactly,
        /// and the difference fades out over this many samples inside (32 m coarse, 16 m fine).
        /// </summary>
        public const int StitchCoarse = 4, StitchFine = 16;
        /// <summary>
        /// Width (m) of the band inside a fine tile's outline over which the 1 m ground blends into the 8 m ground where no
        /// fine neighbour continues it (heights, carve mask, verge tone: TerrainGround.hlsl FineWeight). The two DTMs differ by
        /// decimetres to metres and the coarse carve is widened and sunk, which was a hard step and a lit line.
        /// </summary>
        public const float FineBlendM = 16f;
        /// <summary>A fine tile fades in over this long instead of popping (only where a clipmap draws it; tests see it at once).</summary>
        public const float FineFadeSeconds = 0.5f;   // 96: view ring to just past the horizon + drop hysteresis (TileScheduler.DropRadius); ~0.7 MB GPU per slice
        public readonly TileScheduler Scheduler = new TileScheduler();
        public readonly Dictionary<TileKey, TerrainTile> Tiles = new Dictionary<TileKey, TerrainTile>();
        public readonly TileAtlas CoarseAtlas, FineAtlas;
        public readonly TerrainBinding Binding;
        public readonly TreeIndex Trees = new TreeIndex();
        public readonly Transform Root;
        public IRoadQuery Roads;
        /// <summary>ILayeredGround: the height of whoever asks (the car sets it around its step); NaN = the top surface (a bridge deck).</summary>
        public float ReferenceY { get; set; } = float.NaN;
        public Clipmap Clipmap;
        public VegetationRenderer Vegetation;
        public TreeColliderPool TreeColliders;
        public PropColliderPool PropColliders;
        public WaterWake Wake;
        public WorldStyleSO Style;
        /// <summary>The scheduler wants this tile fetched: the driver asks Rally.Geo and calls <see cref="OnTileData"/> (or <see cref="FetchFailed"/>).</summary>
        public event Action<TileKey> TileNeeded;
        public event Action<TerrainTile> TileReady, TileDisposing;

        readonly ICarver carver;
        readonly List<CarveSegment> segs = new List<CarveSegment>(4096);
        NativeArray<CarveSegment> segsNative;
        /// <summary>
        /// Coarse tiles whose forest must be scattered again after a carve, one per frame (<see cref="ScatterNext"/>).
        /// A tile is carved again whenever a neighbour's roads land (RecarveWithin covers the padded box: up to nine
        /// tiles per answer, each tile 6–9 times while the ring fills), and scattering on every carve put several
        /// full-tile scatters into one frame. Queued, the repeats collapse into one and the work is spread out.
        /// </summary>
        readonly List<TerrainTile> scatterQueue = new List<TerrainTile>();
        public int ScatterPending => scatterQueue.Count;
        /// <summary>
        /// Tiles to carve again because new roads or pads reach them (<see cref="QueueRecarveWithin"/>): a coarse overlay used
        /// to re-carve up to nine coarse tiles and every fine tile around in its own frame. Now the nearest to the car go first,
        /// one at a time while the frame's streaming budget lasts (<see cref="WorkBudget"/>).
        /// </summary>
        readonly List<TerrainTile> recarveQueue = new List<TerrainTile>();
        public int RecarvePending => recarveQueue.Count;
        NativeArray<Color32> splatScratch, splat2Scratch, coverScratch;
        readonly float[] fineFade = new float[FineSlices];
        bool fadesDirty = true;
        static readonly int FineFadeId = Shader.PropertyToID("_FineFade");
        readonly List<Utm33> roadPoints = new List<Utm33>(2048);
        GameObject sea;
        Utm33 lastTableFocus;
        TileKey carFine, carCoarse;

        /// <summary>
        /// Streaming lead, for the bench: fine tiles on the car's way (wanted by the scheduler) that were ready when the car
        /// entered them, how long before (s), and those it entered before they were ready; coarse tiles entered before ready.
        /// </summary>
        public int FineEntered, FineLate, CoarseLate;
        public float FineLeadMin = float.PositiveInfinity;
        public double FineLeadSum;
        public void ResetLead() { FineEntered = FineLate = CoarseLate = 0; FineLeadMin = float.PositiveInfinity; FineLeadSum = 0; }
        public string LeadReport() => FineEntered + FineLate == 0 ? "no fine tile entered"
            : FormattableString.Invariant($"fine tiles entered {FineEntered + FineLate}: {FineLate} before ready; ready ones {FineLeadSum / math.max(1, FineEntered):0.0} s ahead on average, {(FineEntered > 0 ? FineLeadMin : 0):0.0} s at least; coarse tiles entered before ready {CoarseLate}");
        bool tablesDirty = true;

        /// <summary>Per-tile scene state kept in TerrainTile.UserData.</summary>
        sealed class TileView
        {
            public GameObject Root;
            public WaterBodies Water;
            public BuildingSet Buildings;
            public Features Features;
            public CoverRaster Cover;
            public bool FeaturesIn;   // splat / water / houses built: the scatter may read the cover slice
        }

        /// <summary>streamStats() of the JS for the HUD status line.</summary>
        public struct Stats
        {
            public int CoarseLoaded, FineLoaded, Pending;
            /// <summary>CPU height copies (base + carved grid) of every live tile, bytes.</summary>
            public long Bytes;
        }

        public Stats GetStats()
        {
            Scheduler.CountTiles(out int c, out int f, out int p);
            long n = TileScheduler.Samples * (long)TileScheduler.Samples * sizeof(float) * 2;
            return new Stats { CoarseLoaded = c, FineLoaded = f, Pending = p, Bytes = n * Tiles.Count };
        }

        public TileWorld(ComputeShader carveShader, WorldStyleSO style)
        {
            Style = style;
            bool compute = GpuCaps.Compute && carveShader != null;
            CoarseAtlas = new TileAtlas(TileScheduler.Samples, CoarseSlices, SplatRes, compute);
            FineAtlas = new TileAtlas(TileScheduler.Samples, FineSlices, 0, compute);
            carver = Carvers.Create(carveShader);
            Binding = new TerrainBinding(CoarseAtlas, FineAtlas);
            Binding.Bind();
            segsNative = new NativeArray<CarveSegment>(4096, Allocator.Persistent);
            splatScratch = new NativeArray<Color32>(SplatRes * SplatRes, Allocator.Persistent);
            splat2Scratch = new NativeArray<Color32>(SplatRes * SplatRes, Allocator.Persistent);
            coverScratch = new NativeArray<Color32>(SplatRes * SplatRes, Allocator.Persistent);
            Root = new GameObject("World").transform;
            Scheduler.Created += OnCreated;
            Scheduler.Disposed += OnDisposed;
            FloatingOrigin.Rebased += OnRebased;
            if (style != null && style.SeaMaterial != null)
            {
                sea = new GameObject("Sea") { layer = RallyLayers.Water };
                sea.transform.SetParent(Root, false);
                sea.AddComponent<MeshFilter>().sharedMesh = Water.SeaPlane(12000);
                sea.AddComponent<MeshRenderer>().sharedMaterial = style.SeaMaterial;
                var bc = sea.AddComponent<BoxCollider>(); bc.isTrigger = true; bc.size = new Vector3(12000, 2, 12000); bc.center = new Vector3(0, -1, 0);
            }
        }

        // ---- streaming -------------------------------------------------------------------------------

        void OnCreated(TileKey key)
        {
            var tile = new TerrainTile(key, key.Kind == TileKind.Coarse ? CoarseAtlas : FineAtlas);
            tile.UserData = new TileView();
            Tiles.Add(key, tile);
        }

        void OnDisposed(TileKey key)
        {
            if (!Tiles.TryGetValue(key, out var tile)) return;
            TileDisposing?.Invoke(tile);
            var view = (TileView)tile.UserData;
            if (view.Root != null) RallyObjects.Destroy(view.Root);
            if (view.Buildings?.Mesh != null) RallyObjects.Destroy(view.Buildings.Mesh);
            Vegetation?.ClearTile(tile);
            scatterQueue.Remove(tile);
            recarveQueue.Remove(tile);
            Tiles.Remove(key);
            tile.Dispose();
            tablesDirty = true;
        }

        /// <summary>
        /// Once per frame: the ring logic, one fetch request, the tile tables, the forest and the camera-side
        /// resources. <paramref name="carWorld"/> is the car's Unity position, <paramref name="velocity"/> its planar velocity.
        /// </summary>
        public void Update(float3 carWorld, double2 velocity, Camera camera, float dt)
        {
            var focus = FloatingOrigin.ToUtm(carWorld);
            roadPoints.Clear();
            Roads?.PointsNear(TileScheduler.LedPoint(focus, velocity), 550, roadPoints);
            Scheduler.Update(focus, velocity, roadPoints);
            if (Scheduler.TryDequeue(out var key)) TileNeeded?.Invoke(key);
            CountLead(focus);
            var c = TileKey.At(TileKind.Coarse, focus);
            if (tablesDirty || !TileKey.At(TileKind.Fine, lastTableFocus).Equals(TileKey.At(TileKind.Fine, focus)) || !TileKey.At(TileKind.Coarse, lastTableFocus).Equals(c))
            {
                Binding.RebuildTables(focus, Tiles);
                lastTableFocus = focus; tablesDirty = false;
            }
            if (sea != null) sea.transform.position = new Vector3(carWorld.x, Water.SeaLevel, carWorld.z);
            Wake?.Update(carWorld.xz, dt);
            TreeColliders?.Update(carWorld);
            long t0 = FrameProbe.Start();
            RecarveQueued(focus);
            FrameProbe.Stop(".recarve", t0);
            t0 = FrameProbe.Start();
            ScatterNext();
            FrameProbe.Stop(".scatter", t0);
            AdvanceFades(dt);
            if (camera != null)
            {
                Clipmap?.Render((float3)camera.transform.position);
                t0 = FrameProbe.Start();
                Vegetation?.Render(camera);
                FrameProbe.Stop(".veg.render", t0);
            }
        }

        public void FetchFailed(TileKey key) => Scheduler.Fail(key);

        /// <summary>
        /// Bend a new tile's DTM edges onto the neighbours of its kind that are already in (see <see cref="StitchCoarse"/>):
        /// a correction that equals the difference on each such edge and fades out inside by a cosine. Where two stitched edges
        /// meet at a corner the Coons term keeps both exact. A tile that touches one only at a corner (the diagonal neighbour,
        /// no edge neighbour on either side of that corner) takes its corner sample too, so every two loaded tiles agree on every
        /// point they share and two edge neighbours never disagree at a corner (the mean is a fallback that cannot happen).
        /// </summary>
        void Stitch(TileKey key, NativeArray<float> h)
        {
            int n = TileScheduler.Samples, f = key.Kind == TileKind.Coarse ? StitchCoarse : StitchFine;
            float[] Edge(int di, int dj)
            {
                if (!Tiles.TryGetValue(new TileKey(key.Kind, key.I + di, key.J + dj), out var nb) || !nb.HasHeights) return null;
                var d = new float[n];
                for (int k = 0; k < n; k++)
                {
                    // Own edge sample k and the neighbour's sample on the same point (row-major, row = north).
                    int own = di < 0 ? k * n : di > 0 ? k * n + n - 1 : dj < 0 ? k : (n - 1) * n + k;
                    int other = di < 0 ? k * n + n - 1 : di > 0 ? k * n : dj < 0 ? (n - 1) * n + k : k;
                    d[k] = nb.Base[other] - h[own];
                }
                return d;
            }
            float[] w = Edge(-1, 0), e = Edge(1, 0), s = Edge(0, -1), no = Edge(0, 1);
            // Diagonal neighbours: the difference at the shared corner (NaN when an edge neighbour already fixes that corner).
            float Diag(int di, int dj, bool edgeFixed)
            {
                if (edgeFixed || !Tiles.TryGetValue(new TileKey(key.Kind, key.I + di, key.J + dj), out var nb) || !nb.HasHeights) return float.NaN;
                int own = (dj < 0 ? 0 : n - 1) * n + (di < 0 ? 0 : n - 1), other = (dj < 0 ? n - 1 : 0) * n + (di < 0 ? n - 1 : 0);
                return nb.Base[other] - h[own];
            }
            float dsw = Diag(-1, -1, w != null || s != null), dse = Diag(1, -1, e != null || s != null), dnw = Diag(-1, 1, w != null || no != null), dne = Diag(1, 1, e != null || no != null);
            if (w == null && e == null && s == null && no == null && float.IsNaN(dsw) && float.IsNaN(dse) && float.IsNaN(dnw) && float.IsNaN(dne)) return;
            var fall = new float[f];
            for (int i = 0; i < f; i++) fall[i] = 0.5f * (1 + math.cos(math.PI * i / f));
            float F(int i) => i < f ? fall[i] : 0f;
            float Corner(float[] a, int ka, float[] b, int kb) => a != null && b != null ? 0.5f * (a[ka] + b[kb]) : 0f;
            float sw = Corner(w, 0, s, 0), se = Corner(e, 0, s, n - 1), nw = Corner(w, n - 1, no, 0), ne = Corner(e, n - 1, no, n - 1);
            for (int r = 0; r < n; r++)
            {
                float fs = F(r), fn = F(n - 1 - r);
                bool band = fs > 0 || fn > 0;
                for (int c = 0; c < n; c++)
                {
                    if (!band && c == f) c = n - f;   // away from the south / north band only the west / east bands change
                    float fw = F(c), fe = F(n - 1 - c);
                    if (fw == 0 && fe == 0 && !band) continue;
                    float corr = 0;
                    if (w != null) corr += fw * w[r];
                    if (e != null) corr += fe * e[r];
                    if (s != null) corr += fs * s[c];
                    if (no != null) corr += fn * no[c];
                    if (w != null && s != null) corr -= fw * fs * sw;
                    if (e != null && s != null) corr -= fe * fs * se;
                    if (w != null && no != null) corr -= fw * fn * nw;
                    if (e != null && no != null) corr -= fe * fn * ne;
                    if (!float.IsNaN(dsw)) corr += F(math.max(c, r)) * dsw;
                    if (!float.IsNaN(dse)) corr += F(math.max(n - 1 - c, r)) * dse;
                    if (!float.IsNaN(dnw)) corr += F(math.max(c, n - 1 - r)) * dnw;
                    if (!float.IsNaN(dne)) corr += F(math.max(n - 1 - c, n - 1 - r)) * dne;
                    h[r * n + c] += corr;
                }
            }
        }

        /// <summary>Fine tiles fading in: advance, and hand the shader each slice's fade (TerrainGround.hlsl _FineFade).</summary>
        void AdvanceFades(float dt)
        {
            foreach (var t in Tiles.Values)
            {
                if (t.Key.Kind != TileKind.Fine || !t.HasHeights || t.Fade >= 1f) continue;
                t.Fade = math.min(1f, t.Fade + dt / FineFadeSeconds);
                fineFade[t.Slice] = t.Fade;
                fadesDirty = true;
            }
            if (fadesDirty) { Shader.SetGlobalFloatArray(FineFadeId, fineFade); fadesDirty = false; }
        }

        /// <summary>The fade of the ready fine tile at (i, j), 0 where there is none.</summary>
        float FineFadeAt(int i, int j) => Tiles.TryGetValue(new TileKey(TileKind.Fine, i, j), out var t) && t.HasHeights ? t.Fade : 0f;

        static float Open(float fadeNeighbour, float d) => 1f - (1f - fadeNeighbour) * (1f - math.smoothstep(0f, FineBlendM, d));

        /// <summary>
        /// How much of the fine tile's ground shows at a point inside it (CPU twin of TerrainGround.hlsl FineWeight): its fade,
        /// times, for each side and corner within <see cref="FineBlendM"/>, 1 where a fully faded-in neighbour continues it and
        /// down to 0 at an outline with none. The product is the same seen from either tile of a shared edge.
        /// </summary>
        public float FineWeight(TerrainTile fine, Utm33 p)
        {
            float w = fine.Fade, s = TileScheduler.FineSize;
            float lx = (float)(p.E - fine.Key.Origin.E), ly = (float)(p.N - fine.Key.Origin.N), hx = s - lx, hy = s - ly;
            if (math.min(math.min(lx, ly), math.min(hx, hy)) >= FineBlendM) return w;
            int sx = lx < FineBlendM ? -1 : hx < FineBlendM ? 1 : 0, sy = ly < FineBlendM ? -1 : hy < FineBlendM ? 1 : 0;
            float dx = sx < 0 ? lx : hx, dy = sy < 0 ? ly : hy;
            int i = fine.Key.I, j = fine.Key.J;
            if (sx != 0) w *= Open(FineFadeAt(i + sx, j), dx);
            if (sy != 0) w *= Open(FineFadeAt(i, j + sy), dy);
            if (sx != 0 && sy != 0) w *= Open(FineFadeAt(i + sx, j + sy), math.sqrt(dx * dx + dy * dy));
            return w;
        }

        void CountLead(Utm33 focus)
        {
            var fk = TileKey.At(TileKind.Fine, focus);
            if (!fk.Equals(carFine))
            {
                carFine = fk;
                if (Tiles.TryGetValue(fk, out var ft) && ft.HasHeights)
                {
                    float lead = Time.realtimeSinceStartup - ft.ReadyAt;
                    FineEntered++; FineLeadSum += lead; FineLeadMin = math.min(FineLeadMin, lead);
                }
                else if (Scheduler.Contains(fk)) { FineLate++; RallyLog.Info($"stream: the car entered {fk} before its 1 m ground was ready"); }
            }
            var ck = TileKey.At(TileKind.Coarse, focus);
            if (!ck.Equals(carCoarse))
            {
                carCoarse = ck;
                if (!(Tiles.TryGetValue(ck, out var ct) && ct.HasHeights)) { CoarseLate++; RallyLog.Info($"stream: the car entered {ck} before its ground was ready"); }
            }
        }

        /// <summary>
        /// A tile's DTM arrived: upload the heights, carve the roads and show it — the clipmap draws the tile
        /// from this frame on. Coarse tiles may bring land cover and features at the same time (the tests do);
        /// the driver normally passes null here and calls <see cref="OnTileFeatures"/> when the slower
        /// Overpass / SR16 answers land, so a DEM is never held back by the OSM fetch (stream.js order).
        /// </summary>
        public void OnTileData(TileKey key, NativeArray<float> dtm, CoverRaster cover, Features features, double latitude)
        {
            if (!Tiles.TryGetValue(key, out var tile)) return;   // dropped while loading
            var view = (TileView)tile.UserData;
            tile.Latitude = latitude;
            tile.TreeLine = LandcoverSplat.TreeLine(latitude) + (Style != null ? Style.TreeLineOffset : 0);
            tile.SnowLine = LandcoverSplat.SnowLine(latitude) + (Style != null ? Style.SnowLineOffset : 0);
            long t0 = FrameProbe.Start();
            tile.SetBase(dtm, b => Stitch(key, b));
            if (key.Kind == TileKind.Fine) { tile.Fade = Clipmap != null ? 0f : 1f; fineFade[tile.Slice] = tile.Fade; fadesDirty = true; }
            FrameProbe.Stop(".tile.upload", t0);
            var worldOrigin = FloatingOrigin.ToWorld(key.Origin, 0);
            view.Root = new GameObject(key.ToString());
            view.Root.transform.SetParent(Root, false);
            view.Root.transform.position = worldOrigin;
            if (key.Kind == TileKind.Coarse && (cover != null || features != null)) BuildFeaturesNow(tile, view, cover, features);
            else Carve(tile);
            Scheduler.MarkReady(key);
            tile.ReadyAt = Time.realtimeSinceStartup;
            if (key.Kind == TileKind.Coarse) tile.HoleMask = Scheduler.HoleMask(key.I, key.J);
            tablesDirty = true;
            TileReady?.Invoke(tile);
        }

        /// <summary>
        /// A coarse tile's land cover and OSM features arrived after its DTM: build the splat, the water and the
        /// houses, carve again (now with the house pads) and scatter the forest. Ignored for a dropped tile.
        /// </summary>
        public void OnTileFeatures(TileKey key, CoverRaster cover, Features features)
        {
            var steps = OnTileFeaturesSteps(key, cover, features);
            while (steps.MoveNext()) { }
        }

        /// <summary>
        /// <see cref="OnTileFeatures"/> one step per MoveNext (splat, water, houses, their collider, carve), so the driver can
        /// spread a tile's overlay over frames. Stops by itself when the tile is dropped in between.
        /// </summary>
        public System.Collections.IEnumerator OnTileFeaturesSteps(TileKey key, CoverRaster cover, Features features)
        {
            if (key.Kind != TileKind.Coarse || !Tiles.TryGetValue(key, out var tile) || !tile.HasHeights) yield break;
            var steps = BuildFeatures(tile, (TileView)tile.UserData, cover, features);
            while (steps.MoveNext())
            {
                yield return null;
                if (!Tiles.TryGetValue(key, out var live) || live != tile) yield break;
            }
        }

        void BuildFeaturesNow(TerrainTile tile, TileView view, CoverRaster cover, Features features)
        {
            var steps = BuildFeatures(tile, view, cover, features);
            while (steps.MoveNext()) { }
        }

        System.Collections.IEnumerator BuildFeatures(TerrainTile tile, TileView view, CoverRaster cover, Features features)
        {
            var key = tile.Key;
            var worldOrigin = FloatingOrigin.ToWorld(key.Origin, 0);
            view.Features = features; view.Cover = cover;
            long t0 = FrameProbe.Start();
            LandcoverSplat.Build(cover, features, tile.Grid, tile.Latitude, SplatRes, splatScratch, splat2Scratch, coverScratch);
            float budget = LandcoverSplat.Budget(coverScratch, SplatRes, (i, j) => Roads != null && Roads.Nearest(key.Origin + new double2((i + 0.5) * 64, (j + 0.5) * 64), 260, out _),
                VegetationRenderer.Capacity, Vegetation != null ? Vegetation.Density : 1f);
            if (budget < 1f) RallyLog.Info($"overlay: {key} forest thinned to {budget:P0} of the land-cover density (tree budget {VegetationRenderer.Capacity} per tile)");
            CoarseAtlas.UploadSlice(CoarseAtlas.Splat, splatScratch, tile.Slice);
            CoarseAtlas.UploadSlice(CoarseAtlas.Splat2, splat2Scratch, tile.Slice);
            CoarseAtlas.UploadSlice(CoarseAtlas.Cover, coverScratch, tile.Slice);
            if (!CoarseAtlas.Compute) { if (tile.Cover.IsCreated) tile.Cover.Dispose(); tile.Cover = new NativeArray<Color32>(coverScratch, Allocator.Persistent); }
            FrameProbe.Stop(".ov.splat", t0);
            yield return null;
            t0 = FrameProbe.Start();
            view.Water = Water.Build(features, key, p => tile.SampleBase(p));
            if (view.Water.Count > 0 && Style != null)
            {
                Water.BuildMeshes(view.Water, p => tile.SampleBase(p), out var lakes, out var rivers);
                Water.CreateTileObject(view.Water, lakes, rivers, Style.LakeMaterial, Style.RiverMaterial, view.Root.transform, worldOrigin);
            }
            FrameProbe.Stop(".ov.water", t0);
            yield return null;
            t0 = FrameProbe.Start();
            ulong seed = ((ulong)(uint)key.I << 32) ^ (uint)key.J ^ 0x9E3779B97F4A7C15UL;
            if (view.Buildings?.Mesh != null) RallyObjects.Destroy(view.Buildings.Mesh);
            view.Buildings = Buildings.Build(features, key, p => tile.SampleBase(p), p => tile.Slope(p), Roads, seed);
            FrameProbe.Stop(".ov.buildings", t0);
            yield return null;
            t0 = FrameProbe.Start();
            if (Style != null) Buildings.CreateTileObject(view.Buildings, Style.BuildingMaterial, view.Root.transform, worldOrigin);   // the MeshCollider bakes here
            FrameProbe.Stop(".ov.collider", t0);
            yield return null;
            view.FeaturesIn = true;
            Carve(tile);
            // The new pads also reach the fine tiles inside this tile and, near its border, the neighbours: carve those again.
            if (view.Buildings != null && view.Buildings.Pads.Count > 0)
                foreach (var t in Tiles.Values)
                {
                    if (t == tile || !t.HasHeights || t.Key.RectDistance(key.Origin + new double2(key.SizeM / 2, key.SizeM / 2)) > key.SizeM) continue;
                    var off = (float2)key.Origin.Minus(t.Key.Origin);
                    foreach (var pad in view.Buildings.Pads)
                    {
                        var p = pad; p.A += off; p.B += off;
                        if (PadReaches(p, t.Key.SizeM)) { if (!recarveQueue.Contains(t)) recarveQueue.Add(t); break; }
                    }
                }
        }

        /// <summary>A pad (segment in a tile's local metres) reaches into a tile of this size.</summary>
        static bool PadReaches(in CarveSegment p, float size)
            => math.max(p.A.x, p.B.x) + p.Reach >= 0 && math.max(p.A.y, p.B.y) + p.Reach >= 0 && math.min(p.A.x, p.B.x) - p.Reach <= size && math.min(p.A.y, p.B.y) - p.Reach <= size;

        /// <summary>Carve roads and building pads into a tile (from its base), then refresh the CPU copy and the forest.</summary>
        public void Carve(TerrainTile tile)
        {
            long t0 = FrameProbe.Start();
            recarveQueue.Remove(tile);   // carved now with everything there is
            segs.Clear();
            // A coarse tile widens its road segments by CoarseWiden (below): collect them by the widened reach too, or a road
            // 15–27 m outside the tile carved its neighbour but not it — a step at the shared edge (seam survey 2026-11-20).
            var b = tile.Key.Bounds;
            float widen = tile.Key.Kind == TileKind.Coarse ? tile.Key.CellM * 1.5f : 0f;
            Roads?.CollectCarveSegments(new Bounds25833(b.MinE - widen, b.MinN - widen, b.MaxE + widen, b.MaxN + widen), tile.Key.Origin, segs);
            int roadSegs = segs.Count;
            // Pads come from the coarse tiles that own the houses: the tile's own (a fine tile's parent) and the neighbours,
            // whose pads can reach across the border (each tile must carve the same pads on a shared edge).
            var coarseKey = tile.Key.Kind == TileKind.Coarse ? tile.Key : TileKey.At(TileKind.Coarse, tile.Key.Origin);
            for (int dj = -1; dj <= 1; dj++)
                for (int di = -1; di <= 1; di++)
                {
                    var ck = new TileKey(TileKind.Coarse, coarseKey.I + di, coarseKey.J + dj);
                    if (!Tiles.TryGetValue(ck, out var coarse) || ((TileView)coarse.UserData).Buildings == null) continue;
                    var off = (float2)ck.Origin.Minus(tile.Key.Origin);
                    foreach (var pad in ((TileView)coarse.UserData).Buildings.Pads)
                    {
                        var p = pad; p.A += off; p.B += off;
                        if (!PadReaches(p, tile.Key.SizeM)) continue;
                        segs.Add(p);
                    }
                }
            // The 8 m coarse grid is drawn with bilinear weights: a texel up to one diagonal cell (11.3 m) from a point on
            // the ribbon pulls the terrain there. Widen the coarse flat band by that much and sink it by CarveMargin, so a
            // coarse-only stretch of road (no 1 m tile yet) does not poke through the ribbon either (on steep side roads near
            // a junction the bilinear excess reaches ~0.25 m; the gap it leaves is only seen far away, where only coarse tiles are).
            if (tile.Key.Kind == TileKind.Coarse)
                for (int i = 0; i < roadSegs; i++)
                {
                    var c = segs[i];
                    if ((c.Flags & CarveSegment.DeckOnly) != 0) continue;   // a bridge span's mask is its deck, no more
                    c.HalfWidth += tile.Key.CellM * 1.5f; c.Ha -= RoadConstants.CarveMargin; c.Hb -= RoadConstants.CarveMargin;
                    segs[i] = c;
                }
            if (segs.Count > segsNative.Length) { segsNative.Dispose(); segsNative = new NativeArray<CarveSegment>(math.ceilpow2(segs.Count), Allocator.Persistent); }
            for (int i = 0; i < segs.Count; i++) segsNative[i] = segs[i];
            tile.Carve(carver, segsNative, segs.Count);
            if (!carver.CpuSynchronous) tile.SyncCpu();
            FrameProbe.Stop(tile.Key.Kind == TileKind.Coarse ? ".carve.coarse" : ".carve.fine", t0);
            if (Vegetation != null && tile.Key.Kind == TileKind.Coarse && ((TileView)tile.UserData).FeaturesIn && !scatterQueue.Contains(tile)) scatterQueue.Add(tile);
        }

        /// <summary>Scatter the forest of the oldest queued tile (see <see cref="scatterQueue"/>).</summary>
        public void ScatterNext()
        {
            if (scatterQueue.Count == 0) return;
            var tile = scatterQueue[0];
            scatterQueue.RemoveAt(0);
            if (Tiles.TryGetValue(tile.Key, out var live) && live == tile) Vegetation?.ScatterTile(tile);
        }

        /// <summary>Queue every ready tile overlapping the box for a carve (<see cref="recarveQueue"/>).</summary>
        public void QueueRecarveWithin(Bounds25833 box)
        {
            foreach (var t in Tiles.Values)
            {
                if (!t.HasHeights || recarveQueue.Contains(t)) continue;
                var b = t.Key.Bounds;
                if (b.MaxE < box.MinE || b.MinE > box.MaxE || b.MaxN < box.MinN || b.MinN > box.MaxN) continue;
                recarveQueue.Add(t);
            }
        }

        /// <summary>Carve queued tiles, nearest to the car first: at least one per frame, more while the streaming budget lasts.</summary>
        void RecarveQueued(Utm33 focus)
        {
            while (recarveQueue.Count > 0)
            {
                int best = 0; double bestD = double.MaxValue;
                for (int i = 0; i < recarveQueue.Count; i++) { double d = recarveQueue[i].Key.RectDistance(focus); if (d < bestD) { bestD = d; best = i; } }
                Carve(recarveQueue[best]);
                if (!WorkBudget.Left) return;
            }
        }

        /// <summary>fine.js recarveWithin: new roads arrived for a tile → every ready tile overlapping the box carves again, now.</summary>
        public void RecarveWithin(Bounds25833 box)
        {
            foreach (var kv in Tiles)
            {
                var t = kv.Value;
                if (!t.HasHeights) continue;
                var b = t.Key.Bounds;
                if (b.MaxE < box.MinE || b.MinE > box.MaxE || b.MaxN < box.MinN || b.MinN > box.MaxN) continue;
                Carve(t);
            }
        }

        void OnRebased(double2 delta)
        {
            // World = UTM − origin: moving the origin by delta moves everything by −delta.
            Root.position -= new Vector3((float)delta.x, 0, (float)delta.y);
            PropColliders?.Shift(new float3(-(float)delta.x, 0, -(float)delta.y));
            tablesDirty = true;
        }

        // ---- IGround -----------------------------------------------------------------------------------

        TerrainTile fineCache, coarseCache;

        TerrainTile TileFor(TileKind kind, Utm33 p)
        {
            ref var cache = ref (kind == TileKind.Fine ? ref fineCache : ref coarseCache);
            if (cache != null && cache.HasHeights && cache.Grid.Bounds.Contains(p) && Tiles.ContainsKey(cache.Key)) return cache;
            if (Tiles.TryGetValue(TileKey.At(kind, p), out var t) && t.HasHeights) { cache = t; return t; }
            return null;
        }

        /// <summary>
        /// The fine tile's value blended into the coarse one by <see cref="FineWeight"/> (TerrainGround.hlsl does the same), the
        /// coarse value alone outside fine tiles, the fine value alone where the coarse tile is not in, else 0 (the sea).
        /// </summary>
        float Blended(Utm33 p, Func<TerrainTile, Utm33, float> value, float coarseScale = 1f)
        {
            var f = TileFor(TileKind.Fine, p);
            float w = f != null ? FineWeight(f, p) : 0f;
            if (w >= 1f) return value(f, p);
            var c = TileFor(TileKind.Coarse, p);
            if (c == null) return f != null ? value(f, p) : 0f;
            float vc = value(c, p) * coarseScale;
            return f != null ? math.lerp(vc, value(f, p), w) : vc;
        }

        static readonly Func<TerrainTile, Utm33, float> CarvedOf = (t, p) => t.Grid.Sample(p), MaskOf = (t, p) => t.SampleMask(p), BaseOf = (t, p) => t.SampleBase(p);

        /// <summary>Carved ground without the road ribbon (stream.js sample): fine tile blended into coarse (<see cref="Blended"/>), else 0 (the sea).</summary>
        public float CarvedHeightAt(Utm33 p) => Blended(p, CarvedOf);

        /// <summary>The carve mask the clipmap reads (1 on a road's flat band), fine blended into coarse; CPU path only.</summary>
        public float CarveMaskAt(Utm33 p) => Blended(p, MaskOf);

        /// <summary>
        /// The verge tone the terrain shader paints (TerrainGround.hlsl GroundCover's mask): the fine tile's carve mask, else a
        /// faint 0.35 × the coarse one (its flat band is widened, see <see cref="Carve"/>). CPU path only (the seam survey, tests).
        /// </summary>
        public float VergeMaskAt(Utm33 p) => Blended(p, MaskOf, 0.35f);

        /// <summary>Natural ground (stream.js sampleBase): the untouched DTM, fine blended into coarse like the drawn ground.</summary>
        public float BaseHeightAt(Utm33 p) => Blended(p, BaseOf);

        /// <summary>
        /// A bridge deck under a point (within its rails) that the asker is up on: <see cref="ReferenceY"/> unset, or not more
        /// than DeckCatch under the deck top (car.js deckAt). Under the deck the ground below answers.
        /// </summary>
        bool OnDeck(Utm33 p, out RoadHit b)
        {
            b = default;
            if (Roads == null || Roads.BridgeSegmentCount == 0) return false;
            if (!Roads.Nearest(p, 16, RoadLayer.Deck, out b) || b.Distance > RoadConstants.DeckHalf(b.Half)) return false;
            return float.IsNaN(ReferenceY) || ReferenceY >= RoadConstants.DeckTop(b.RoadY) - RoadConstants.DeckCatch;
        }

        /// <summary>
        /// The nearest road on the ground, unless a bridge deck is nearer (and within its carve reach): the carve gives such a
        /// cell to the bridge and leaves it natural (CarveJob), so the approach road's end cap does not reach under the deck.
        /// </summary>
        bool GroundRoad(Utm33 p, double limit, out RoadHit q)
        {
            if (Roads == null || !Roads.Nearest(p, limit, RoadLayer.Ground, out q)) { q = default; return false; }
            return Roads.BridgeSegmentCount == 0 || !Roads.Nearest(p, q.Distance, RoadLayer.Deck, out var b)
                   || b.Distance >= q.Distance || b.Distance > RoadConstants.DeckHalf(b.Half) + RoadConstants.MaxEarthwork;
        }

        /// <summary>
        /// car.js groundAt: inside a road corridor the engineered profile from the natural ground plus the
        /// ribbon lift (so the tyres ride the ribbon, not the carve under it); elsewhere the carved ground.
        /// On a bridge the deck: the ribbon on the carriageway, the slab's top out to the rails.
        /// </summary>
        public float HeightAt(float2 xz)
        {
            var p = FloatingOrigin.ToUtm(xz);
            if (OnDeck(p, out var b))
            {
                float bd = (float)b.Distance;
                if (bd <= b.Half + RoadConstants.RoadShoulder) return b.RoadY + RoadConstants.RoadLift + RoadConstants.SurfaceLift(bd, b.Half);
                return RoadConstants.DeckTop(b.RoadY) + math.max(0f, RoadConstants.SurfaceLift(bd, b.Half) - RoadConstants.CarveLift);
            }
            if (GroundRoad(p, 24, out var q) && q.Distance <= RoadConstants.CorridorReach(q.Half, q.Cut))
            {
                float ground = BaseHeightAt(p);
                float d = (float)q.Distance;
                // On the ribbon: its surface. Past it: the carve (raised by CarveLift, so the terrain meets the ribbon edge) and
                // the last EdgeTuck of the ribbon lift fading out (a 4 cm kerb, not a drop).
                float roadY = q.RoadY + RoadConstants.RoadLift;
                if (d <= q.Half + RoadConstants.RoadShoulder) return roadY + RoadConstants.SurfaceLift(d, q.Half);
                float carved = RoadProfile.Height(roadY + RoadConstants.CarveLift, ground, d, RoadConstants.FlatHalf(q.Half) + RoadConstants.CarveApron, RoadProfile.ShoulderFor(q.Half, q.Cut));
                return carved + math.max(0f, RoadConstants.SurfaceLift(d, q.Half) - RoadConstants.CarveLift);
            }
            return CarvedHeightAt(p);
        }

        public Surface SurfaceAt(float2 xz)
        {
            var p = FloatingOrigin.ToUtm(xz);
            if (OnDeck(p, out var b)) return b.Surface;
            if (GroundRoad(p, 24, out var q) && q.Distance <= q.Half + RoadConstants.Shoulder) return q.Surface;
            return WaterAt(xz).Depth > 0.3f ? Surface.Water : Surface.Offroad;
        }

        public WaterSample WaterAt(float2 xz)
        {
            var p = FloatingOrigin.ToUtm(xz);
            // A road is built above the water: on a carriageway or its shoulder the car is dry. Water used to be measured
            // against the carved road like any ground: every OSM waterway crossing a road (culverts included) added its
            // 0.2–0.7 m there, and every road graded near sea level (quays, shore roads, roads over DTM sea cells) sat
            // under the 0.45 m sea plane — water drag that grows with depth × speed², up to 16 m/s², and no splash to show
            // for it: the "car suddenly brakes" of 2026-11-19.
            // On a bridge deck the car is dry; under it, in the river, it is not.
            if (OnDeck(p, out _)) return WaterSample.Dry;
            if (GroundRoad(p, 12, out var q) && q.Distance <= q.Half + RoadConstants.Shoulder) return WaterSample.Dry;
            var t = TileFor(TileKind.Coarse, p);
            return Water.WaterAt(t != null ? ((TileView)t.UserData).Water : null, p, CarvedHeightAt(p));
        }

        public bool IsLoaded(float2 xz) => TileFor(TileKind.Coarse, FloatingOrigin.ToUtm(xz)) != null;

        /// <summary>Trees within a radius of a world XZ, for the car's collision code (see also TreeColliderPool).</summary>
        public void NearbyTrees(float2 xz, float radius, NativeList<TreeHit> result) => Trees.Query(xz, radius, result);

        public WaterBodies WaterBodiesAt(Utm33 p) { var t = TileFor(TileKind.Coarse, p); return t != null ? ((TileView)t.UserData).Water : null; }
        /// <summary>Inside a lake or river another loaded tile has already built (the bridge detection's look past its own tile).</summary>
        public bool InMappedWater(Utm33 p) => Water.InLakeOrRiver(WaterBodiesAt(p), p);
        public BuildingSet BuildingsAt(Utm33 p) { var t = TileFor(TileKind.Coarse, p); return t != null ? ((TileView)t.UserData).Buildings : null; }
        /// <summary>The SR16 raster of the coarse tile under a point (null until loaded); the actors' spawn rules read the crown cover.</summary>
        public CoverRaster CoverAt(Utm33 p) { var t = TileFor(TileKind.Coarse, p); return t != null ? ((TileView)t.UserData).Cover : null; }
        public float TreeLineAt(Utm33 p) { var t = TileFor(TileKind.Coarse, p); return t != null ? t.TreeLine : float.PositiveInfinity; }

        public void Dispose()
        {
            FloatingOrigin.Rebased -= OnRebased;
            foreach (var t in Tiles.Values) { var v = (TileView)t.UserData; if (v.Root != null) RallyObjects.Destroy(v.Root); t.Dispose(); }
            Tiles.Clear();
            Vegetation?.Dispose(); TreeColliders?.Dispose(); PropColliders?.Dispose(); Wake?.Dispose(); Clipmap?.Dispose();
            Trees.Dispose(); Binding.Dispose(); carver.Dispose(); CoarseAtlas.Dispose(); FineAtlas.Dispose();
            segsNative.Dispose(); splatScratch.Dispose(); splat2Scratch.Dispose(); coverScratch.Dispose();
            if (Root != null) RallyObjects.Destroy(Root.gameObject);
        }
    }
}
