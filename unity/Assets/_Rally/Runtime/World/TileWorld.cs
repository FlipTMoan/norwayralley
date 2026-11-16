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
    public sealed class TileWorld : IGround, IDisposable
    {
        public const int CoarseSlices = 64, FineSlices = 32, SplatRes = 128;
        public readonly TileScheduler Scheduler = new TileScheduler();
        public readonly Dictionary<TileKey, TerrainTile> Tiles = new Dictionary<TileKey, TerrainTile>();
        public readonly TileAtlas CoarseAtlas, FineAtlas;
        public readonly TerrainBinding Binding;
        public readonly TreeIndex Trees = new TreeIndex();
        public readonly Transform Root;
        public IRoadQuery Roads;
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
        NativeArray<Color32> splatScratch, coverScratch;
        readonly List<Utm33> roadPoints = new List<Utm33>(2048);
        GameObject sea;
        Utm33 lastTableFocus;
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
            Scheduler.Count(out int c, out int f, out int p);
            long n = TileScheduler.Samples * (long)TileScheduler.Samples * sizeof(float) * 2;
            return new Stats { CoarseLoaded = c, FineLoaded = f, Pending = p, Bytes = n * Tiles.Count };
        }

        public TileWorld(ComputeShader carveShader, WorldStyleSO style)
        {
            Style = style;
            bool compute = SystemInfo.supportsComputeShaders && carveShader != null;
            CoarseAtlas = new TileAtlas(TileScheduler.Samples, CoarseSlices, SplatRes, compute);
            FineAtlas = new TileAtlas(TileScheduler.Samples, FineSlices, 0, compute);
            carver = Carvers.Create(carveShader);
            Binding = new TerrainBinding(CoarseAtlas, FineAtlas);
            Binding.Bind();
            segsNative = new NativeArray<CarveSegment>(4096, Allocator.Persistent);
            splatScratch = new NativeArray<Color32>(SplatRes * SplatRes, Allocator.Persistent);
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
            var c = TileKey.At(TileKind.Coarse, focus);
            if (tablesDirty || !TileKey.At(TileKind.Fine, lastTableFocus).Equals(TileKey.At(TileKind.Fine, focus)) || !TileKey.At(TileKind.Coarse, lastTableFocus).Equals(c))
            {
                Binding.RebuildTables(focus, Tiles);
                lastTableFocus = focus; tablesDirty = false;
            }
            if (sea != null) sea.transform.position = new Vector3(carWorld.x, Water.SeaLevel, carWorld.z);
            Wake?.Update(carWorld.xz, dt);
            TreeColliders?.Update(carWorld);
            if (camera != null)
            {
                Clipmap?.Render((float3)camera.transform.position);
                Vegetation?.Render(camera);
            }
        }

        public void FetchFailed(TileKey key) => Scheduler.Fail(key);

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
            tile.SetBase(dtm);
            var worldOrigin = FloatingOrigin.ToWorld(key.Origin, 0);
            view.Root = new GameObject(key.ToString());
            view.Root.transform.SetParent(Root, false);
            view.Root.transform.position = worldOrigin;
            if (key.Kind == TileKind.Coarse && (cover != null || features != null)) BuildFeatures(tile, view, cover, features);
            else Carve(tile);
            Scheduler.MarkReady(key);
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
            if (key.Kind != TileKind.Coarse || !Tiles.TryGetValue(key, out var tile) || !tile.HasHeights) return;
            BuildFeatures(tile, (TileView)tile.UserData, cover, features);
        }

        void BuildFeatures(TerrainTile tile, TileView view, CoverRaster cover, Features features)
        {
            var key = tile.Key;
            var worldOrigin = FloatingOrigin.ToWorld(key.Origin, 0);
            view.Features = features; view.Cover = cover;
            LandcoverSplat.Build(cover, features, tile.Grid, tile.Latitude, SplatRes, splatScratch, coverScratch);
            CoarseAtlas.UploadSlice(CoarseAtlas.Splat, splatScratch, tile.Slice);
            CoarseAtlas.UploadSlice(CoarseAtlas.Cover, coverScratch, tile.Slice);
            if (!CoarseAtlas.Compute) { if (tile.Cover.IsCreated) tile.Cover.Dispose(); tile.Cover = new NativeArray<Color32>(coverScratch, Allocator.Persistent); }
            view.Water = Water.Build(features, key, p => tile.SampleBase(p));
            if (view.Water.Count > 0 && Style != null)
            {
                Water.BuildMeshes(view.Water, p => tile.SampleBase(p), out var lakes, out var rivers);
                Water.CreateTileObject(view.Water, lakes, rivers, Style.LakeMaterial, Style.RiverMaterial, view.Root.transform, worldOrigin);
            }
            ulong seed = ((ulong)(uint)key.I << 32) ^ (uint)key.J ^ 0x9E3779B97F4A7C15UL;
            if (view.Buildings?.Mesh != null) RallyObjects.Destroy(view.Buildings.Mesh);
            view.Buildings = Buildings.Build(features, key, p => tile.SampleBase(p), p => tile.Slope(p), Roads, seed);
            if (Style != null) Buildings.CreateTileObject(view.Buildings, Style.BuildingMaterial, view.Root.transform, worldOrigin);
            view.FeaturesIn = true;
            Carve(tile);
        }

        /// <summary>Carve roads and building pads into a tile (from its base), then refresh the CPU copy and the forest.</summary>
        public void Carve(TerrainTile tile)
        {
            segs.Clear();
            Roads?.CollectCarveSegments(tile.Key.Bounds, tile.Key.Origin, segs);
            // Pads come from the coarse tile that owns the house; a fine tile takes them from its coarse parent.
            var coarseKey = tile.Key.Kind == TileKind.Coarse ? tile.Key : TileKey.At(TileKind.Coarse, tile.Key.Origin);
            if (Tiles.TryGetValue(coarseKey, out var coarse) && ((TileView)coarse.UserData).Buildings != null)
            {
                var off = (float2)coarseKey.Origin.Minus(tile.Key.Origin);
                foreach (var pad in ((TileView)coarse.UserData).Buildings.Pads)
                {
                    var p = pad; p.A += off; p.B += off;
                    if (p.A.x + p.Reach < 0 || p.A.y + p.Reach < 0 || p.A.x - p.Reach > tile.Key.SizeM || p.A.y - p.Reach > tile.Key.SizeM) continue;
                    segs.Add(p);
                }
            }
            if (segs.Count > segsNative.Length) { segsNative.Dispose(); segsNative = new NativeArray<CarveSegment>(math.ceilpow2(segs.Count), Allocator.Persistent); }
            for (int i = 0; i < segs.Count; i++) segsNative[i] = segs[i];
            tile.Carve(carver, segsNative, segs.Count);
            if (!carver.CpuSynchronous) tile.SyncCpu();
            if (tile.Key.Kind == TileKind.Coarse && ((TileView)tile.UserData).FeaturesIn) Vegetation?.ScatterTile(tile);
        }

        /// <summary>fine.js recarveWithin: new roads arrived for a tile → every ready tile overlapping the box carves again.</summary>
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

        /// <summary>Carved ground without the road ribbon (stream.js sample): fine tile first, then coarse, else 0 (the sea).</summary>
        public float CarvedHeightAt(Utm33 p)
        {
            var t = TileFor(TileKind.Fine, p) ?? TileFor(TileKind.Coarse, p);
            return t != null ? t.Grid.Sample(p) : 0f;
        }

        /// <summary>Natural ground (stream.js sampleBase): the untouched DTM, fine first.</summary>
        public float BaseHeightAt(Utm33 p)
        {
            var t = TileFor(TileKind.Fine, p) ?? TileFor(TileKind.Coarse, p);
            return t != null ? t.SampleBase(p) : 0f;
        }

        /// <summary>
        /// car.js groundAt: inside a road corridor the engineered profile from the natural ground plus the
        /// ribbon lift (so the tyres ride the ribbon, not the carve under it); elsewhere the carved ground.
        /// </summary>
        public float HeightAt(float2 xz)
        {
            var p = FloatingOrigin.ToUtm(xz);
            if (Roads != null && Roads.Nearest(p, 24, out var q) && q.Distance <= RoadConstants.CorridorReach(q.Half, q.Cut))
            {
                float ground = BaseHeightAt(p);
                float d = (float)q.Distance;
                return RoadProfile.Height(q.RoadY + RoadConstants.RoadLift, ground, d, RoadConstants.FlatHalf(q.Half), RoadProfile.ShoulderFor(q.Half, q.Cut)) + RoadConstants.SurfaceLift(d, q.Half);
            }
            return CarvedHeightAt(p);
        }

        public Surface SurfaceAt(float2 xz)
        {
            var p = FloatingOrigin.ToUtm(xz);
            if (Roads != null && Roads.Nearest(p, 24, out var q) && q.Distance <= q.Half + RoadConstants.Shoulder) return q.Surface;
            return WaterAt(xz).Depth > 0.3f ? Surface.Water : Surface.Offroad;
        }

        public WaterSample WaterAt(float2 xz)
        {
            var p = FloatingOrigin.ToUtm(xz);
            var t = TileFor(TileKind.Coarse, p);
            return Water.WaterAt(t != null ? ((TileView)t.UserData).Water : null, p, CarvedHeightAt(p));
        }

        public bool IsLoaded(float2 xz) => TileFor(TileKind.Coarse, FloatingOrigin.ToUtm(xz)) != null;

        /// <summary>Trees within a radius of a world XZ, for the car's collision code (see also TreeColliderPool).</summary>
        public void NearbyTrees(float2 xz, float radius, NativeList<TreeHit> result) => Trees.Query(xz, radius, result);

        public WaterBodies WaterBodiesAt(Utm33 p) { var t = TileFor(TileKind.Coarse, p); return t != null ? ((TileView)t.UserData).Water : null; }
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
            segsNative.Dispose(); splatScratch.Dispose(); coverScratch.Dispose();
            if (Root != null) RallyObjects.Destroy(Root.gameObject);
        }
    }
}
