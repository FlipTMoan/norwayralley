using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Unity.Collections;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.World
{
    /// <summary>The water of one tile, in tile-local metres: what <see cref="Water.WaterAt"/> tests (port of water.js bodies).</summary>
    public sealed class WaterBodies
    {
        public sealed class Lake { public List<float2> Ring; public float Level; public float2 Min, Max; }
        public sealed class River { public List<float2> Points; public float Half, Depth; }
        public readonly List<Lake> Lakes = new List<Lake>();
        public readonly List<River> Rivers = new List<River>();
        public Utm33 Origin;
        public int Count => Lakes.Count + Rivers.Count;
    }

    /// <summary>
    /// Lakes, rivers and the sea (port of water.js). Lakes are flat polygons at a level taken from the
    /// 20th percentile of the ground around and inside their outline (the DTM shows the water surface, with
    /// noise, so a low percentile plus a lift is the true level); rivers are ribbons draped on the ground
    /// that may run uphill between stations; the sea is a plane at <see cref="SeaLevel"/>. Water meshes
    /// get trigger colliders on layer "Water" so Unity fires entry events; depth still comes from WaterAt.
    /// </summary>
    public static class Water
    {
        public const float SeaLevel = 0.45f;      // the sea plane; DTM sea/nodata cells are height 0
        public const float SeaDepth = 2.5f;       // how deep the fjord counts once the ground is at 0
        public const float RiverStep = 6f;
        public const float TileMargin = 2f;
        public const float SurfaceLift = 0.12f;
        public const float LakeLift = 0.25f;
        public const float SkirtDrop = 0.6f, SkirtOut = 0.3f;
        public const float MinLakeArea = 60f;     // m² (twice the signed area in water.js, kept as is)
        public const int LakeGrid = 6;

        /// <summary>water.js riverWidth: OSM width for rivers (4..40 m, default 9), fixed widths for the small kinds.</summary>
        public static float RiverWidth(Waterway way)
        {
            if (way.Kind == "river") return way.Width > 0 ? math.clamp(way.Width, 4f, 40f) : 9f;
            switch (way.Kind) { case "canal": return 5f; case "stream": return 2.4f; case "drain": return 1.4f; case "ditch": return 1.0f; default: return 2.4f; }
        }

        public static WaterBodies Build(Features features, TileKey key, Func<Utm33, float> ground)
        {
            var bodies = new WaterBodies { Origin = key.Origin };
            if (features == null) return bodies;
            var origin = key.Origin;
            float size = key.SizeM;
            float2 lo = new float2(-TileMargin), hi = new float2(size + TileMargin);
            var pts = new List<float2>(64);
            foreach (var way in features.Waterways)
            {
                if (way.Points == null || way.Points.Count < 2) continue;
                float half = RiverWidth(way) / 2;
                pts.Clear();
                foreach (var p in way.Points) pts.Add(Local(p, origin));
                foreach (var piece in ClipPolyline(pts, lo, hi))
                    bodies.Rivers.Add(new WaterBodies.River { Points = Resample(piece, RiverStep), Half = half, Depth = math.min(0.7f, math.max(0.2f, half * 0.12f)) });
            }
            foreach (var area in features.Areas)
            {
                if (!area.IsWater || area.Rings == null || area.Rings.Count == 0 || area.Rings[0].Count < 3) continue;
                var outer = area.Rings[0];
                var ring = new List<float2>(outer.Count);
                foreach (var p in outer) ring.Add(Local(p, origin));
                if (ring.Count >= 2 && math.all(ring[0] == ring[ring.Count - 1])) ring.RemoveAt(ring.Count - 1);
                if (ring.Count < 3) continue;
                float area2 = Geometry2D.SignedArea2(ring);
                if (math.abs(area2) < MinLakeArea) continue;
                var c = Geometry2D.Centroid(ring);
                if (c.x < 0 || c.x >= size || c.y < 0 || c.y >= size) continue;   // the tile that holds the centroid owns the lake
                var lake = new WaterBodies.Lake { Ring = ring, Min = new float2(float.MaxValue), Max = new float2(float.MinValue) };
                foreach (var p in ring) { lake.Min = math.min(lake.Min, p); lake.Max = math.max(lake.Max, p); }
                lake.Level = LakeLevel(lake, origin, ground);
                bodies.Lakes.Add(lake);
            }
            return bodies;
        }

        static float2 Local(Utm33 p, Utm33 o) => new float2((float)(p.E - o.E), (float)(p.N - o.N));

        /// <summary>water.js lakeLevel: 20th percentile of the ground on the outline and a 6 × 6 grid inside it, plus LAKE_LIFT.</summary>
        static float LakeLevel(WaterBodies.Lake lake, Utm33 origin, Func<Utm33, float> ground)
        {
            var hs = new List<float>(lake.Ring.Count + LakeGrid * LakeGrid);
            foreach (var p in lake.Ring) hs.Add(ground(origin + (double2)p));
            for (int j = 0; j < LakeGrid; j++)
                for (int i = 0; i < LakeGrid; i++)
                {
                    var q = new float2(lake.Min.x + ((i + 0.5f) / LakeGrid) * (lake.Max.x - lake.Min.x), lake.Min.y + ((j + 0.5f) / LakeGrid) * (lake.Max.y - lake.Min.y));
                    if (Geometry2D.PointInRing(q, lake.Ring)) hs.Add(ground(origin + (double2)q));
                }
            hs.Sort();
            return hs[(int)math.floor(hs.Count * 0.2f)] + LakeLift;
        }

        /// <summary>Pieces of a polyline inside a box (Liang–Barsky per segment, consecutive pieces joined).</summary>
        public static List<List<float2>> ClipPolyline(List<float2> pts, float2 lo, float2 hi)
        {
            var pieces = new List<List<float2>>();
            List<float2> cur = null;
            for (int i = 0; i + 1 < pts.Count; i++)
            {
                float2 a = pts[i], b = pts[i + 1], d = b - a;
                float t0 = 0, t1 = 1;
                bool ok = true;
                for (int k = 0; k < 4 && ok; k++)
                {
                    float p = k == 0 ? -d.x : k == 1 ? d.x : k == 2 ? -d.y : d.y;
                    float q = k == 0 ? a.x - lo.x : k == 1 ? hi.x - a.x : k == 2 ? a.y - lo.y : hi.y - a.y;
                    if (math.abs(p) < 1e-9f) { if (q < 0) ok = false; continue; }
                    float t = q / p;
                    if (p < 0) { if (t > t1) ok = false; else if (t > t0) t0 = t; }
                    else { if (t < t0) ok = false; else if (t < t1) t1 = t; }
                }
                if (!ok) { cur = null; continue; }
                float2 ca = a + d * t0, cb = a + d * t1;
                if (cur == null || t0 > 0) { cur = new List<float2> { ca }; pieces.Add(cur); }
                cur.Add(cb);
                if (t1 < 1) cur = null;
            }
            return pieces;
        }

        public static List<float2> Resample(List<float2> pts, float step)
        {
            var o = new List<float2> { pts[0] };
            for (int i = 1; i < pts.Count; i++)
            {
                float2 a = pts[i - 1], b = pts[i];
                int n = math.max(1, (int)math.ceil(math.distance(a, b) / step));
                for (int k = 1; k <= n; k++) o.Add(math.lerp(a, b, (float)k / n));
            }
            return o;
        }

        /// <summary>water.js waterAt: the sea (ground ≈ 0 counts as deep), the fjord shore, lakes by outline, rivers by ribbon.</summary>
        public static WaterSample WaterAt(WaterBodies bodies, Utm33 p, float ground)
        {
            float depth = ground < 0.1f ? SeaDepth : math.max(0f, SeaLevel - ground);
            float surface = depth > 0 ? SeaLevel : ground;
            if (bodies != null)
            {
                var q = Local(p, bodies.Origin);
                foreach (var lake in bodies.Lakes)
                {
                    if (q.x < lake.Min.x || q.x > lake.Max.x || q.y < lake.Min.y || q.y > lake.Max.y) continue;
                    if (Geometry2D.PointInRing(q, lake.Ring) && lake.Level - ground > depth) { depth = lake.Level - ground; surface = lake.Level; }
                }
                foreach (var river in bodies.Rivers)
                    if (Geometry2D.PolylineDist2(q, river.Points) <= river.Half * river.Half && river.Depth > depth) { depth = river.Depth; surface = ground + river.Depth; }
            }
            return new WaterSample(depth, surface);
        }

        [System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)]
        struct Vertex { public float3 Pos; public float3 Normal; public float2 UV; }

        /// <summary>One mesh for a tile's lakes (ear-clipped, flat at their level; UV = metres / 20) and one for its rivers (5-row ribbons, UV u across, v along for flow).</summary>
        public static void BuildMeshes(WaterBodies bodies, Func<Utm33, float> ground, out Mesh lakes, out Mesh rivers)
        {
            lakes = null; rivers = null;
            var verts = new List<Vertex>(); var idx = new List<int>();
            var tris = new List<int>();
            foreach (var lake in bodies.Lakes)
            {
                tris.Clear();
                Geometry2D.EarClip(lake.Ring, tris);
                int b = verts.Count;
                foreach (var p in lake.Ring) verts.Add(new Vertex { Pos = new float3(p.x, lake.Level, p.y), Normal = new float3(0, 1, 0), UV = p / 20f });
                for (int t = 0; t < tris.Count; t += 3) { idx.Add(b + tris[t]); idx.Add(b + tris[t + 2]); idx.Add(b + tris[t + 1]); }   // flip: Unity's y-up left-handed winding
            }
            if (idx.Count > 0) lakes = ToMesh(verts, idx, "Lakes");
            verts.Clear(); idx.Clear();
            foreach (var river in bodies.Rivers)
            {
                var pts = river.Points;
                int b = verts.Count;
                float s = 0;
                for (int i = 0; i < pts.Count; i++)
                {
                    float2 prev = pts[math.max(0, i - 1)], next = pts[math.min(pts.Count - 1, i + 1)];
                    float2 t = next - prev; float tl = math.length(t); t = tl > 1e-6f ? t / tl : new float2(0, 1);
                    float2 n = new float2(-t.y, t.x);
                    if (i > 0) s += math.distance(pts[i], pts[i - 1]);
                    float y = ground(bodies.Origin + (double2)pts[i]) + SurfaceLift;
                    // skirt L, bank L, centre, bank R, skirt R: the skirts hang down so the ribbon never shows daylight on a slope.
                    for (int r = 0; r < 5; r++)
                    {
                        float off = r == 0 ? -(river.Half + SkirtOut) : r == 1 ? -river.Half : r == 2 ? 0 : r == 3 ? river.Half : river.Half + SkirtOut;
                        float drop = r == 0 || r == 4 ? SkirtDrop : 0;
                        var p = pts[i] + n * off;
                        verts.Add(new Vertex { Pos = new float3(p.x, y - drop, p.y), Normal = new float3(0, 1, 0), UV = new float2(r / 4f, s / (2 * river.Half)) });
                    }
                    if (i < pts.Count - 1)
                        for (int r = 0; r < 4; r++)
                        {
                            int a = b + i * 5 + r, c = a + 5;
                            idx.Add(a); idx.Add(a + 1); idx.Add(c); idx.Add(a + 1); idx.Add(c + 1); idx.Add(c);
                        }
                }
            }
            if (idx.Count > 0) rivers = ToMesh(verts, idx, "Rivers");
        }

        static Mesh ToMesh(List<Vertex> verts, List<int> idx, string name)
        {
            var data = Mesh.AllocateWritableMeshData(1);
            var md = data[0];
            md.SetVertexBufferParams(verts.Count,
                new VertexAttributeDescriptor(VertexAttribute.Position, VertexAttributeFormat.Float32, 3),
                new VertexAttributeDescriptor(VertexAttribute.Normal, VertexAttributeFormat.Float32, 3),
                new VertexAttributeDescriptor(VertexAttribute.TexCoord0, VertexAttributeFormat.Float32, 2));
            var vb = md.GetVertexData<Vertex>();
            for (int i = 0; i < verts.Count; i++) vb[i] = verts[i];
            md.SetIndexBufferParams(idx.Count, IndexFormat.UInt32);
            var ib = md.GetIndexData<uint>();
            for (int i = 0; i < idx.Count; i++) ib[i] = (uint)idx[i];
            md.subMeshCount = 1;
            md.SetSubMesh(0, new SubMeshDescriptor(0, idx.Count), MeshUpdateFlags.DontRecalculateBounds);
            var mesh = new Mesh { name = name };
            Mesh.ApplyAndDisposeWritableMeshData(data, mesh);
            mesh.RecalculateBounds();
            return mesh;
        }

        /// <summary>A square sea plane mesh (keep it under the camera: TileWorld moves it with the car).</summary>
        public static Mesh SeaPlane(float size)
        {
            var mesh = new Mesh { name = "Sea" };
            float h = size / 2;
            mesh.SetVertices(new List<Vector3> { new Vector3(-h, 0, -h), new Vector3(h, 0, -h), new Vector3(h, 0, h), new Vector3(-h, 0, h) });
            mesh.SetUVs(0, new List<Vector2> { new Vector2(0, 0), new Vector2(size / 20, 0), new Vector2(size / 20, size / 20), new Vector2(0, size / 20) });
            mesh.SetNormals(new List<Vector3> { Vector3.up, Vector3.up, Vector3.up, Vector3.up });
            mesh.SetTriangles(new[] { 0, 2, 1, 0, 3, 2 }, 0);
            return mesh;
        }

        /// <summary>
        /// GameObjects for a tile's water under <paramref name="parent"/> (placed at the tile origin): renderers
        /// plus triggers on layer "Water" — lakes as convex MeshColliders (Unity allows trigger meshes only
        /// when convex; the hull over-covers bays, so the car confirms with WaterAt), rivers as a chain of
        /// BoxColliders along the ribbon.
        /// </summary>
        public static GameObject CreateTileObject(WaterBodies bodies, Mesh lakes, Mesh rivers, Material lakeMaterial, Material riverMaterial, Transform parent, float3 worldOrigin)
        {
            var root = new GameObject("Water") { layer = RallyLayers.Water };
            root.transform.SetParent(parent, false);
            root.transform.position = worldOrigin;
            if (lakes != null)
            {
                var go = new GameObject("Lakes") { layer = RallyLayers.Water };
                go.transform.SetParent(root.transform, false);
                go.AddComponent<MeshFilter>().sharedMesh = lakes;
                var mr = go.AddComponent<MeshRenderer>(); mr.sharedMaterial = lakeMaterial; mr.shadowCastingMode = ShadowCastingMode.Off;
                var mc = go.AddComponent<MeshCollider>(); mc.sharedMesh = lakes; mc.convex = true; mc.isTrigger = true;
            }
            if (rivers != null)
            {
                var go = new GameObject("Rivers") { layer = RallyLayers.Water };
                go.transform.SetParent(root.transform, false);
                go.AddComponent<MeshFilter>().sharedMesh = rivers;
                var mr = go.AddComponent<MeshRenderer>(); mr.sharedMaterial = riverMaterial; mr.shadowCastingMode = ShadowCastingMode.Off;
                foreach (var river in bodies.Rivers)
                    for (int i = 0; i + 1 < river.Points.Count; i += 2)
                    {
                        float2 a = river.Points[i], b = river.Points[math.min(river.Points.Count - 1, i + 2)];
                        float2 m = (a + b) / 2; float len = math.distance(a, b);
                        if (len < 0.5f) continue;
                        var box = new GameObject("RiverTrigger") { layer = RallyLayers.Water };
                        box.transform.SetParent(go.transform, false);
                        float y = rivers.bounds.center.y;
                        box.transform.localPosition = new Vector3(m.x, y, m.y);
                        box.transform.localRotation = Quaternion.Euler(0, math.degrees(math.atan2(b.x - a.x, b.y - a.y)), 0);
                        var bc = box.AddComponent<BoxCollider>(); bc.size = new Vector3(river.Half * 2, 1.5f, len); bc.isTrigger = true;
                    }
            }
            return root;
        }
    }

    /// <summary>
    /// The car's wake: a small RFloat texture over a window around the car (256 texels over 128 m) that the
    /// water shader adds foam from. <see cref="Add"/> queues a splat; <see cref="Update"/> decays the texture,
    /// stamps the splats and re-uploads it (256 KB a frame, cheap). The window follows the car in whole texels.
    /// </summary>
    public sealed class WaterWake : IDisposable
    {
        public const int Res = 256;
        public const float SizeM = 128f;
        public readonly Texture2D Texture;
        NativeArray<float> cells = new NativeArray<float>(Res * Res, Allocator.Persistent);
        readonly List<(float2 xz, float strength)> splats = new List<(float2, float)>(32);
        float2 origin;
        static readonly int TexId = Shader.PropertyToID("_WakeTex"), WindowId = Shader.PropertyToID("_WakeWindow");

        public WaterWake()
        {
            Texture = new Texture2D(Res, Res, TextureFormat.RFloat, false, true) { wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear, name = "Wake" };
            Shader.SetGlobalTexture(TexId, Texture);
        }

        /// <summary>A disturbance at a world XZ (wheels in water, a splash); strength 0..1.</summary>
        public void Add(float2 xz, float strength) { if (splats.Count < 32) splats.Add((xz, strength)); }

        public void Update(float2 carXZ, float dt)
        {
            const float texel = SizeM / Res;
            float2 want = math.floor((carXZ - SizeM / 2) / texel) * texel;
            if (math.any(want != origin))
            {
                // Shift the window in whole texels so existing foam stays where it is on the water.
                int2 shift = (int2)math.round((want - origin) / texel);
                var copy = new NativeArray<float>(cells, Allocator.Temp);
                for (int y = 0; y < Res; y++)
                    for (int x = 0; x < Res; x++)
                    {
                        int sx = x + shift.x, sy = y + shift.y;
                        cells[y * Res + x] = sx >= 0 && sy >= 0 && sx < Res && sy < Res ? copy[sy * Res + sx] : 0;
                    }
                copy.Dispose();
                origin = want;
            }
            float decay = math.exp(-dt * 0.9f);
            for (int i = 0; i < cells.Length; i++) cells[i] *= decay;
            foreach (var (xz, strength) in splats)
            {
                int2 c = (int2)((xz - origin) / texel);
                for (int dy = -3; dy <= 3; dy++)
                    for (int dx = -3; dx <= 3; dx++)
                    {
                        int x = c.x + dx, y = c.y + dy;
                        if (x < 0 || y < 0 || x >= Res || y >= Res) continue;
                        float w = strength * math.saturate(1 - math.sqrt(dx * dx + dy * dy) / 3.5f);
                        cells[y * Res + x] = math.min(1f, cells[y * Res + x] + w);
                    }
            }
            splats.Clear();
            Texture.SetPixelData(cells, 0);
            Texture.Apply(false, false);
            Shader.SetGlobalVector(WindowId, new Vector4(origin.x, origin.y, SizeM, 0));
        }

        public void Dispose() { cells.Dispose(); RallyObjects.Destroy(Texture); }
    }
}
