using System.Collections.Generic;
using Rally.Core;
using Unity.Collections;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.World
{
    /// <summary>
    /// A small lookup the clipmap shader uses to go from a world XZ to an atlas slice: a dim × dim window
    /// of tile cells around the camera, each entry the slice index of the tile there or −1. Rebuilt when
    /// tiles come and go or the window moves (never per frame). Window origin is in Unity world metres
    /// (FloatingOrigin-relative), so the shader does plain float maths.
    /// </summary>
    public sealed class TileTable : System.IDisposable
    {
        public readonly int Dim;
        public readonly float SizeM;
        public readonly GraphicsBuffer Buffer;
        NativeArray<int> entries;
        public int I0, J0;             // tile index of the window's south-west cell
        public Vector4 Window;         // (originX, originZ, tileSize, dim) for the shader

        public TileTable(int dim, float sizeM)
        {
            Dim = dim; SizeM = sizeM;
            entries = new NativeArray<int>(dim * dim, Allocator.Persistent);
            Buffer = new GraphicsBuffer(GraphicsBuffer.Target.Structured, dim * dim, sizeof(int));
        }

        /// <summary>Centre the window on a tile index and fill it from the live tiles (slice per key).</summary>
        public void Rebuild(int centreI, int centreJ, Dictionary<TileKey, TerrainTile> tiles, TileKind kind)
        {
            I0 = centreI - Dim / 2; J0 = centreJ - Dim / 2;
            for (int k = 0; k < entries.Length; k++) entries[k] = -1;
            foreach (var kv in tiles)
            {
                var key = kv.Key;
                if (key.Kind != kind || !kv.Value.HasHeights) continue;
                int i = key.I - I0, j = key.J - J0;
                if (i < 0 || j < 0 || i >= Dim || j >= Dim) continue;
                entries[j * Dim + i] = kv.Value.Slice;
            }
            Buffer.SetData(entries);
            var o = FloatingOrigin.ToWorldXZ(new Utm33((double)I0 * SizeM, (double)J0 * SizeM));
            Window = new Vector4(o.x, o.y, SizeM, Dim);
        }

        public void Dispose() { entries.Dispose(); Buffer.Dispose(); }
    }

    /// <summary>
    /// Geometry clipmap terrain: nested square rings of a fixed vertex count centred on the camera, each
    /// twice the cell size of the one inside, displaced in the vertex shader from the tile heightmaps.
    /// There is one surface for the whole world, so there is nothing to stitch between tiles and no
    /// per-tile mesh to rebuild after a carve — the carve writes the texture and the next frame shows it.
    /// Level 0 is a full grid, levels ≥ 1 are rings with a hole for the level inside; every mesh has a
    /// skirt (TEXCOORD0.x = 1) dropped by the shader to hide T-junction cracks at ring seams. Ring
    /// origins snap to twice their cell so the finer level's vertices stay on the coarser level's grid.
    /// No GameObjects: <see cref="Render"/> issues Graphics.RenderMesh per level each frame.
    /// </summary>
    public sealed class Clipmap : System.IDisposable
    {
        public readonly int Levels, Cells;
        public readonly float BaseCell;
        readonly Mesh centre, ring;
        readonly MaterialPropertyBlock[] props;
        readonly Material material;
        static readonly int LevelId = Shader.PropertyToID("_Level");

        /// <param name="levels">7 levels × 64 cells × 2 m: the outermost ring reaches 4096 m, the load radius.</param>
        public Clipmap(Material terrainMaterial, int levels = 7, int cells = 64, float baseCell = 2f)
        {
            material = terrainMaterial; Levels = levels; Cells = cells; BaseCell = baseCell;
            centre = BuildGrid(cells, 0, "ClipmapCentre");
            ring = BuildGrid(cells, cells / 2, "ClipmapRing");
            props = new MaterialPropertyBlock[levels];
            for (int i = 0; i < levels; i++) props[i] = new MaterialPropertyBlock();
        }

        /// <summary>Called once per frame with the camera position in Unity world space.</summary>
        public void Render(float3 cameraPos, int layer = 0)
        {
            var rp = new RenderParams(material)
            {
                layer = layer,
                shadowCastingMode = ShadowCastingMode.On,
                receiveShadows = true,
                worldBounds = new Bounds(new Vector3(cameraPos.x, 0, cameraPos.z), new Vector3(20000, 8000, 20000)),
            };
            for (int level = 0; level < Levels; level++)
            {
                float cell = BaseCell * (1 << level);
                float snap = cell * 2;
                float ox = math.floor(cameraPos.x / snap) * snap, oz = math.floor(cameraPos.z / snap) * snap;
                // _Level = (originX, originZ, cell, skirtDrop): skirt drop scales with the cell so coarse rings hide bigger steps.
                props[level].SetVector(LevelId, new Vector4(ox, oz, cell, 3f + cell * 0.5f));
                rp.matProps = props[level];
                Graphics.RenderMesh(rp, level == 0 ? centre : ring, 0, Matrix4x4.identity);
            }
        }

        /// <summary>
        /// A (cells+1)² vertex grid in cell units centred on 0, minus a square hole of `hole` cells in the
        /// middle, plus a one-vertex skirt border. Vertex = (i, 0, j) with TEXCOORD0.x = 1 on skirt
        /// vertices; the shader does world = _Level.xy + vertex.xz × _Level.z and samples the height there.
        /// </summary>
        static Mesh BuildGrid(int cells, int hole, string name)
        {
            int n = cells + 1, half = cells / 2, h0 = half - hole / 2, h1 = half + hole / 2;
            var verts = new List<Vector3>(n * n + 4 * n);
            var uvs = new List<Vector2>(n * n + 4 * n);
            var tris = new List<int>(cells * cells * 6 + 4 * cells * 6);
            for (int j = 0; j < n; j++)
                for (int i = 0; i < n; i++) { verts.Add(new Vector3(i - half, 0, j - half)); uvs.Add(Vector2.zero); }
            for (int j = 0; j < cells; j++)
                for (int i = 0; i < cells; i++)
                {
                    if (hole > 0 && i >= h0 && i < h1 && j >= h0 && j < h1) continue;
                    int a = j * n + i, b = a + 1, c = a + n, d = c + 1;
                    tris.Add(a); tris.Add(c); tris.Add(b); tris.Add(b); tris.Add(c); tris.Add(d);
                }
            // Outer skirt: a copy of each border vertex flagged for the shader to drop, quads to the border.
            void Skirt(System.Func<int, int> border)
            {
                int start = verts.Count;
                for (int k = 0; k < n; k++) { verts.Add(verts[border(k)]); uvs.Add(new Vector2(1, 0)); }
                for (int k = 0; k < cells; k++)
                {
                    int a = border(k), b = border(k + 1), c = start + k, d = start + k + 1;
                    tris.Add(a); tris.Add(b); tris.Add(c); tris.Add(b); tris.Add(d); tris.Add(c);
                    tris.Add(a); tris.Add(c); tris.Add(b); tris.Add(b); tris.Add(c); tris.Add(d);   // both windings: skirts face any way
                }
            }
            Skirt(k => k);                       // south edge
            Skirt(k => (n - 1) * n + k);         // north edge
            Skirt(k => k * n);                   // west edge
            Skirt(k => k * n + n - 1);           // east edge
            var mesh = new Mesh { name = name, indexFormat = IndexFormat.UInt32 };
            mesh.SetVertices(verts);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(tris, 0);
            mesh.bounds = new Bounds(Vector3.zero, new Vector3(1e6f, 1e6f, 1e6f));   // displaced in the shader: never cull by mesh bounds
            mesh.UploadMeshData(true);
            return mesh;
        }

        public void Dispose() { RallyObjects.Destroy(centre); RallyObjects.Destroy(ring); }
    }

    /// <summary>
    /// Binds the atlases and tile tables to the terrain shader globals so the clipmap, the scatter and
    /// the water shader all read the same ground. Call <see cref="Bind"/> once and <see cref="RebuildTables"/>
    /// whenever tiles change or the camera crosses a tile edge.
    /// </summary>
    public sealed class TerrainBinding : System.IDisposable
    {
        public readonly TileTable Coarse = new TileTable(8, TileScheduler.CoarseSize);   // ±4 tiles: the keep radius (5300 m) fits
        public readonly TileTable Fine = new TileTable(12, TileScheduler.FineSize);     // ±6 tiles: 900 m keep radius plus a margin
        readonly TileAtlas coarseAtlas, fineAtlas;

        public TerrainBinding(TileAtlas coarseAtlas, TileAtlas fineAtlas) { this.coarseAtlas = coarseAtlas; this.fineAtlas = fineAtlas; }

        public void Bind()
        {
            Shader.SetGlobalTexture("_HeightsCoarse", coarseAtlas.Heights);
            Shader.SetGlobalTexture("_HeightsFine", fineAtlas.Heights);
            Shader.SetGlobalTexture("_MaskCoarse", coarseAtlas.Mask);
            Shader.SetGlobalTexture("_SplatAtlas", coarseAtlas.Splat);
            Shader.SetGlobalTexture("_CoverAtlas", coarseAtlas.Cover);
            Shader.SetGlobalBuffer("_CoarseSlices", Coarse.Buffer);
            Shader.SetGlobalBuffer("_FineSlices", Fine.Buffer);
            Shader.SetGlobalVector("_AtlasParams", new Vector4(coarseAtlas.N, TileScheduler.CoarseCell, TileScheduler.FineCell, coarseAtlas.SplatRes));
        }

        public void RebuildTables(Utm33 focus, Dictionary<TileKey, TerrainTile> tiles)
        {
            var c = TileKey.At(TileKind.Coarse, focus); var f = TileKey.At(TileKind.Fine, focus);
            Coarse.Rebuild(c.I, c.J, tiles, TileKind.Coarse);
            Fine.Rebuild(f.I, f.J, tiles, TileKind.Fine);
            Shader.SetGlobalVector("_CoarseWindow", Coarse.Window);
            Shader.SetGlobalVector("_FineWindow", Fine.Window);
        }

        public void Dispose() { Coarse.Dispose(); Fine.Dispose(); }
    }
}
