using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.World
{
    /// <summary>
    /// Grass, wildflowers and bushes on the road verges near the camera (plan 2026-11-22 "verges"). The ground is cut into
    /// <see cref="CellM"/> m cells; a cell within <see cref="HerbRadius"/> gets its herbs, within <see cref="ShrubRadius"/> its
    /// bushes, all in one mesh and one renderer per cell (<see cref="VergeBuilder"/> → <see cref="VergeMesh"/>, nearest cell first, while the frame's streaming
    /// budget lasts — at most <see cref="MaxBuildsPerFrame"/>), and loses them <see cref="Hysteresis"/> m further out. A cell
    /// waits until its coarse tile's overlay is in (<see cref="IVergeWorld.Ready"/>); <see cref="Invalidate"/> rebuilds the cells
    /// of a tile whose roads, houses or trees changed (the old mesh stays until the new one is there). Plain MeshRenderers on
    /// Rally/Verge (no compute, no instancing: WebGL 2): the shader thins them out with distance by rank, so they fade instead
    /// of popping. Not solid: the car drives through them. Also sets the far verge tint of the terrain shader (the flower
    /// colours of the region at the camera, and the noise origin).
    /// </summary>
    public sealed class VergeLayer : IDisposable
    {
        public const float CellM = 64f, HerbRadius = 130f, ShrubRadius = 260f, Hysteresis = 40f;
        public const int MaxBuildsPerFrame = 3;
        /// <summary>Bushes cast shadows only in cells this near (each casting renderer is a draw per shadow cascade).</summary>
        public const float ShadowRadius = 80f;

        sealed class Cell
        {
            public int2 Key;
            public GameObject Go;
            public MeshRenderer Renderer;
            public Mesh Mesh;
            /// <summary>The built plants (null: not built); the one mesh is made from both lists.</summary>
            public List<VergePlant> Herbs, Shrubs;
            public bool HerbsDirty, ShrubsDirty;
            public float MinY = float.PositiveInfinity, MaxY = float.NegativeInfinity;
        }

        readonly Transform parent;
        readonly IVergeWorld source;
        readonly Material material;
        readonly Dictionary<int2, Cell> cells = new Dictionary<int2, Cell>();
        readonly List<VergePlant> plants = new List<VergePlant>(8192);
        readonly VergeBuilder.Scratch scratch = new VergeBuilder.Scratch();
        readonly List<int2> drop = new List<int2>();
        float nextTint;

        public VergeLayer(Transform parent, IVergeWorld source)
        {
            this.parent = parent; this.source = source;
            Shader.SetGlobalFloat(SnowLineId, 1e6f);
            var shader = Resources.Load<Shader>("Verge/Verge");
            var atlas = Resources.Load<Texture2D>("Verge/VergeAtlas");
            if (shader != null)
            {
                material = new Material(shader) { name = "Verge" };
                if (atlas != null) material.SetTexture("_BaseMap", atlas);
                material.SetVector("_Fade", new Vector4(HerbRadius * 0.45f, HerbRadius, ShrubRadius * 0.7f, ShrubRadius));
            }
        }

        public int CellCount => cells.Count;
        public int HerbCount { get { int n = 0; foreach (var c in cells.Values) n += c.Herbs?.Count ?? 0; return n; } }
        public int ShrubCount { get { int n = 0; foreach (var c in cells.Values) n += c.Shrubs?.Count ?? 0; return n; } }
        public int VertexCount { get { int n = 0; foreach (var c in cells.Values) n += c.Mesh != null ? c.Mesh.vertexCount : 0; return n; } }
        /// <summary>Cells with something to draw: one renderer (one draw) each.</summary>
        public int RendererCount { get { int n = 0; foreach (var c in cells.Values) if (c.Renderer != null) n++; return n; } }
        /// <summary>Vertex memory of the built meshes (52 bytes a vertex, 6 bytes of index a quad's half).</summary>
        public long Bytes => VertexCount * 52L + VertexCount * 3L;

        static int2 KeyAt(Utm33 p) => new int2((int)math.floor(p.E / CellM), (int)math.floor(p.N / CellM));
        static Utm33 Origin(int2 k) => new Utm33(k.x * (double)CellM, k.y * (double)CellM);

        static double Distance(int2 k, Utm33 p)
        {
            double x0 = k.x * (double)CellM, y0 = k.y * (double)CellM;
            double dx = math.max(0, math.max(x0 - p.E, p.E - (x0 + CellM))), dy = math.max(0, math.max(y0 - p.N, p.N - (y0 + CellM)));
            return math.sqrt(dx * dx + dy * dy);
        }

        /// <summary>Rebuild the cells reaching into <paramref name="bounds"/> (their roads, houses, posts or trees changed).</summary>
        public void Invalidate(Bounds25833 bounds)
        {
            foreach (var c in cells.Values)
            {
                double x0 = c.Key.x * (double)CellM, y0 = c.Key.y * (double)CellM;
                if (x0 >= bounds.MaxE || x0 + CellM <= bounds.MinE || y0 >= bounds.MaxN || y0 + CellM <= bounds.MinN) continue;
                c.HerbsDirty |= c.Herbs != null; c.ShrubsDirty |= c.Shrubs != null;
            }
        }

        /// <summary>Once per frame: drop far cells, build the nearest missing / stale ones while the streaming budget lasts.</summary>
        public void Update(Utm33 focus)
        {
            drop.Clear();
            foreach (var c in cells.Values)
            {
                double d = Distance(c.Key, focus);
                if (d > ShrubRadius + Hysteresis) drop.Add(c.Key);
                else if (d > HerbRadius + Hysteresis && c.Herbs != null) { c.Herbs = null; c.HerbsDirty = false; Attach(c); }
                if (c.Renderer != null) c.Renderer.shadowCastingMode = d < ShadowRadius ? ShadowCastingMode.On : ShadowCastingMode.Off;
            }
            foreach (var k in drop) { Destroy(cells[k]); cells.Remove(k); }
            for (int built = 0; built < MaxBuildsPerFrame && WorkBudget.Left; built++)
                if (!BuildNearest(focus)) break;
            if (Time.realtimeSinceStartup >= nextTint) SetTint(focus);
        }

        /// <summary>Builds every cell in range now (tests, the preview tool).</summary>
        public void BuildAll(Utm33 focus) { while (BuildNearest(focus)) { } SetTint(focus); }

        bool BuildNearest(Utm33 focus)
        {
            var c0 = KeyAt(focus);
            int r = (int)math.ceil(ShrubRadius / CellM);
            int2 best = default; bool herbs = false, found = false; double bestD = double.PositiveInfinity;
            for (int dj = -r; dj <= r; dj++)
                for (int di = -r; di <= r; di++)
                {
                    var k = c0 + new int2(di, dj);
                    double d = Distance(k, focus);
                    if (d > ShrubRadius || d >= bestD) continue;
                    cells.TryGetValue(k, out var c);
                    bool needHerbs = d <= HerbRadius && (c == null || c.Herbs == null || c.HerbsDirty);
                    bool needShrubs = c == null || c.Shrubs == null || c.ShrubsDirty;
                    if (!needHerbs && !needShrubs) continue;
                    if (!source.Ready(new Utm33(Origin(k).E + CellM / 2, Origin(k).N + CellM / 2))) continue;
                    best = k; bestD = d; herbs = needHerbs; found = true;
                }
            if (!found) return false;
            if (!cells.TryGetValue(best, out var cell)) cells[best] = cell = new Cell { Key = best };
            long t0 = FrameProbe.Start();
            var list = new List<VergePlant>();
            var res = VergeBuilder.Build(source, Origin(best), CellM, !herbs, list, scratch);
            cell.MinY = math.min(cell.MinY, res.MinY); cell.MaxY = math.max(cell.MaxY, res.MaxY);
            if (herbs) { cell.Herbs = list; cell.HerbsDirty = false; } else { cell.Shrubs = list; cell.ShrubsDirty = false; }
            Attach(cell);
            FrameProbe.Stop(".verge.build", t0);
            return true;
        }

        /// <summary>
        /// The cell's one mesh (herbs and bushes together: one draw a cell, the shader tells them apart by the vertex alpha) on
        /// one renderer; it casts shadows within <see cref="ShadowRadius"/> (set in Update; the shadow pass skips the herbs).
        /// </summary>
        void Attach(Cell c)
        {
            plants.Clear();
            if (c.Herbs != null) plants.AddRange(c.Herbs);
            if (c.Shrubs != null) plants.AddRange(c.Shrubs);
            DestroyMesh(ref c.Mesh);
            c.Mesh = VergeMesh.Build(plants, CellM, c.MinY, c.MaxY, "Verge " + c.Key);
            if (c.Mesh == null) { if (c.Go != null) RallyObjects.Destroy(c.Go); c.Go = null; c.Renderer = null; return; }
            if (c.Go == null)
            {
                c.Go = new GameObject("Verge " + c.Key);
                c.Go.transform.SetParent(parent, false);
                c.Go.AddComponent<MeshFilter>();
                c.Renderer = c.Go.AddComponent<MeshRenderer>();
                c.Renderer.sharedMaterial = material;
                c.Renderer.shadowCastingMode = ShadowCastingMode.Off;
                c.Renderer.lightProbeUsage = LightProbeUsage.Off;
                c.Renderer.reflectionProbeUsage = ReflectionProbeUsage.Off;
            }
            c.Go.transform.position = FloatingOrigin.ToWorld(Origin(c.Key), 0);
            c.Go.GetComponent<MeshFilter>().sharedMesh = c.Mesh;
        }

        static void DestroyMesh(ref Mesh m) { if (m != null) RallyObjects.Destroy(m); m = null; }

        void Destroy(Cell c)
        {
            DestroyMesh(ref c.Mesh);
            if (c.Go != null) RallyObjects.Destroy(c.Go);
            c.Go = null; c.Renderer = null;
        }

        static readonly int SnowLineId = Shader.PropertyToID("_VergeSnowLine"), OriginId = Shader.PropertyToID("_VergeOrigin"), FlowersId = Shader.PropertyToID("_VergeFlowers"), ShareId = Shader.PropertyToID("_VergeShare");
        readonly Vector4[] flowerColours = new Vector4[3];

        /// <summary>
        /// The terrain shader's far verge tint: the noise origin (the floating origin in the wrapped noise domain), the three
        /// heaviest flowers of the palette at the camera and its flower share (0 under snow and without a world).
        /// </summary>
        void SetTint(Utm33 focus)
        {
            nextTint = Time.realtimeSinceStartup + 1f;
            var o = VergeRules.NoiseCoord(FloatingOrigin.Origin.E, FloatingOrigin.Origin.N);
            Shader.SetGlobalVector(OriginId, new Vector4(o.x, o.y, 0, 0));
            float h = source.Ground(focus), treeLine = source.TreeLine(focus);
            Bioclimate.At(focus, out var zone, out var section);
            var region = VergeRules.RegionFor(zone, section, h, treeLine, focus.N);
            var pal = VergeRules.Palettes[(int)region];
            var list = new List<(VergeKind kind, float weight)>(pal.Flowers);
            list.Sort((a, b) => b.weight.CompareTo(a.weight));
            for (int i = 0; i < 3; i++)
            {
                var c = list.Count > 0 ? VergeRules.Kinds[(int)list[i % list.Count].kind].Far : Color.gray;
                flowerColours[i] = new Vector4(c.r, c.g, c.b, 1);
            }
            Shader.SetGlobalVectorArray(FlowersId, flowerColours);
            float snowLine = source.SnowLine(focus);
            Shader.SetGlobalFloat(ShareId, h > snowLine - 150f || float.IsInfinity(treeLine) ? 0f : pal.FlowerShare);
            Shader.SetGlobalFloat(SnowLineId, float.IsInfinity(snowLine) ? 1e6f : snowLine);
        }

        public void Dispose()
        {
            foreach (var c in cells.Values) Destroy(c);
            cells.Clear();
            if (material != null) RallyObjects.Destroy(material);
            Shader.SetGlobalFloat(ShareId, 0f);
            (source as IDisposable)?.Dispose();
        }
    }

    /// <summary>
    /// <see cref="IVergeWorld"/> over the game's world: TileWorld's roads, carved ground, land cover (the coarse tile's CPU cover
    /// copy), trees and houses, and the sign / light layers' posts.
    /// </summary>
    public sealed class TileVergeWorld : IVergeWorld, IDisposable
    {
        readonly TileWorld world;
        readonly SignLayer signs;
        readonly LightLayer lights;
        readonly List<double2> posts = new List<double2>();
        Unity.Collections.NativeList<TreeHit> trees;

        public TileVergeWorld(TileWorld world, SignLayer signs, LightLayer lights)
        {
            this.world = world; this.signs = signs; this.lights = lights;
        }

        TerrainTile last;   // the coarse tile of the cell being built
        TerrainTile Coarse(Utm33 p)
        {
            var k = TileKey.At(TileKind.Coarse, p);
            if (last != null && last.Key.Equals(k)) return last;   // reset at every build's start (Segments): no tile is dropped mid-build
            return last = world.Tiles.TryGetValue(k, out var t) ? t : null;
        }

        public bool Ready(Utm33 p) => world.FeaturesIn(p) && world.Roads != null;
        public void Segments(Bounds25833 bounds, Utm33 origin, List<CarveSegment> output) { last = null; world.Roads?.CollectCarveSegments(bounds, origin, output); }
        public float Ground(Utm33 p) => world.CarvedHeightAt(p);
        public float TreeLine(Utm33 p) => world.TreeLineAt(p);
        public float SnowLine(Utm33 p) { var t = Coarse(p); return t != null ? t.SnowLine : float.PositiveInfinity; }

        public Color32 Cover(Utm33 p)
        {
            var t = Coarse(p);
            if (t == null || !t.Cover.IsCreated) return default;
            int res = TileWorld.SplatRes;
            float cell = t.Key.SizeM / res;
            int i = math.clamp((int)((p.E - t.Key.Origin.E) / cell), 0, res - 1), j = math.clamp((int)((p.N - t.Key.Origin.N) / cell), 0, res - 1);
            return t.Cover[j * res + i];
        }

        public void Obstacles(Bounds25833 b, List<double3> output)
        {
            if (!trees.IsCreated) trees = new Unity.Collections.NativeList<TreeHit>(256, Unity.Collections.Allocator.Persistent);
            trees.Clear();
            var c = new Utm33((b.MinE + b.MaxE) / 2, (b.MinN + b.MaxN) / 2);
            float r = (float)math.max(b.MaxE - b.MinE, b.MaxN - b.MinN) * 0.71f;
            world.Trees.Query(FloatingOrigin.ToWorldXZ(c), r, trees);
            foreach (var t in trees) output.Add(new double3(t.Position.x, t.Position.y, t.Radius));
            posts.Clear();
            signs?.PostsIn(b, posts);
            lights?.PostsIn(b, posts);
            foreach (var p in posts) output.Add(new double3(p.x, p.y, 0.1));
        }

        public void Houses(Bounds25833 b, List<FootprintBox> output)
        {
            var set = world.BuildingsAt(new Utm33((b.MinE + b.MaxE) / 2, (b.MinN + b.MaxN) / 2));
            if (set == null) return;
            foreach (var box in set.Boxes)
                if (box.Centre.x > b.MinE && box.Centre.x < b.MaxE && box.Centre.y > b.MinN && box.Centre.y < b.MaxN) output.Add(box);
        }

        public void Dispose() { if (trees.IsCreated) trees.Dispose(); }
    }
}
