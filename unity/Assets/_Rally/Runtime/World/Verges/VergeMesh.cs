using System.Collections.Generic;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.World
{
    /// <summary>
    /// One mesh for a verge cell's plants (Rally/Verge): a herb is two crossed cards, a bush three cards at 60° plus a
    /// smaller inner one, each showing its kind's cell of the atlas (8 × 8 cells; Editor/VergeTextures). The ground is not
    /// baked: every vertex carries its plant's root (UV1, cell-local xz) and the shader puts the plant on the drawn ground there
    /// (TerrainGround.hlsl), so a re-carve or a fine tile fading in never leaves plants floating. Vertex layout: position =
    /// root + card offset with y = height over the ground; UV0 = (atlas u, v, height fraction for wind and shading, fade rank);
    /// colour = tint (a = 1 herb, 0 bush). Normals lean up (herbs) or out of the bush, so cards shade like a volume.
    /// </summary>
    public static class VergeMesh
    {
        public const int AtlasCells = 8;

        static readonly List<Vector3> pos = new List<Vector3>(), nrm = new List<Vector3>();
        static readonly List<Vector4> uv0 = new List<Vector4>();
        static readonly List<Vector2> uv1 = new List<Vector2>();
        static readonly List<Color32> col = new List<Color32>();
        static readonly List<int> idx = new List<int>();

        /// <summary>The atlas rectangle (u0, v0, u1, v1) of a kind; row 0 is the top row of the PNG.</summary>
        public static float4 CellRect(VergeKind kind)
        {
            int c = (int)kind % AtlasCells, r = (int)kind / AtlasCells;
            const float inset = 1f / 1024f, s = 1f / AtlasCells;
            return new float4(c * s + inset, 1f - (r + 1) * s + inset, (c + 1) * s - inset, 1f - r * s - inset);
        }

        /// <summary>A mesh of the plants, null when there are none. <paramref name="minY"/>/<paramref name="maxY"/>: the ground range, for the bounds.</summary>
        public static Mesh Build(List<VergePlant> plants, float size, float minY, float maxY, string name)
        {
            if (plants.Count == 0) return null;
            pos.Clear(); nrm.Clear(); uv0.Clear(); uv1.Clear(); col.Clear(); idx.Clear();
            float tallest = 0;
            foreach (var p in plants)
            {
                var info = VergeRules.Kinds[(int)p.Kind];
                float h = info.Height * p.Scale, w = info.Width * p.Scale;
                tallest = math.max(tallest, h);
                var rect = CellRect(p.Kind);
                var c = (Color32)p.Tint;
                if (VergeRules.IsShrub(p.Kind))
                {
                    c.a = 0;
                    for (int q = 0; q < 3; q++) Card(p, p.Yaw + q * math.PI / 3f, w, h, 0f, rect, c, true);
                    Card(p, p.Yaw + math.PI / 6f, w * 0.6f, h * 0.75f, 0f, rect, c, true);
                }
                else
                {
                    c.a = 255;
                    Card(p, p.Yaw, w, h, -0.04f, rect, c, false);
                    Card(p, p.Yaw + math.PI / 2f, w, h, -0.04f, rect, c, false);
                }
            }
            var mesh = new Mesh { name = name };
            if (pos.Count > 65535) mesh.indexFormat = IndexFormat.UInt32;
            mesh.SetVertices(pos); mesh.SetNormals(nrm); mesh.SetUVs(0, uv0); mesh.SetUVs(1, uv1); mesh.SetColors(col);
            mesh.SetTriangles(idx, 0, false);
            // The shader moves every vertex onto the ground: the bounds take the cell's ground range, not the mesh's y.
            float lo = float.IsInfinity(minY) ? -10 : minY - 2, hi = float.IsInfinity(maxY) ? 10 : maxY + tallest + 2;
            mesh.bounds = new Bounds(new Vector3(size / 2, (lo + hi) / 2, size / 2), new Vector3(size + 8, hi - lo, size + 8));
            mesh.UploadMeshData(true);
            return mesh;
        }

        static void Card(in VergePlant p, float yaw, float w, float h, float sink, float4 rect, Color32 c, bool shrub)
        {
            float2 dir = new float2(math.cos(yaw), math.sin(yaw)) * (w / 2);
            int b = pos.Count;
            var root = new Vector2(p.Pos.x, p.Pos.y);
            // a slight lean per card so a clump is not two flat planes
            float2 lean = new float2(-dir.y, dir.x) / math.max(1e-3f, w / 2) * (h * 0.12f) * (p.Rank - 0.5f);
            for (int v = 0; v < 4; v++)
            {
                bool right = v == 1 || v == 2, top = v >= 2;
                float2 off = (right ? dir : -dir) + (top ? lean : float2.zero);
                pos.Add(new Vector3(p.Pos.x + off.x, top ? h : sink, p.Pos.y + off.y));
                Vector3 n;
                if (shrub) { var o = new Vector3(off.x, (top ? h : 0) - h * 0.45f, off.y); n = (o.normalized + Vector3.up * 0.6f).normalized; }
                else n = (Vector3.up * 2f + new Vector3(-dir.y, 0, dir.x).normalized * 0.5f * (right ? 1 : -1)).normalized;
                nrm.Add(n);
                uv0.Add(new Vector4(right ? rect.z : rect.x, top ? rect.w : rect.y, top ? 1 : 0, p.Rank));
                uv1.Add(root);
                col.Add(c);
            }
            idx.Add(b); idx.Add(b + 2); idx.Add(b + 1);
            idx.Add(b); idx.Add(b + 3); idx.Add(b + 2);
        }
    }
}
