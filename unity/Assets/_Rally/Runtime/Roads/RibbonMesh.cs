using System.Collections.Generic;
using System.Runtime.InteropServices;
using Rally.Core;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.Roads
{
    /// <summary>
    /// The road surface mesh (port of stage.js buildRibbon as roads.js buildRoadMeshes uses it): six rows per
    /// station — skirt, shoulder, carriageway edge, carriageway edge, shoulder, skirt — and short skirts sloping
    /// off both shoulders so the road reads as a solid ribbon. Every row height is the car's own ground there (what
    /// TileWorld.HeightAt answers on the road: the graded road height + ROAD_LIFT + RoadConstants.SurfaceLift), so the
    /// drawn road and the wheel contact are one surface, straight across the carriageway. It used to sample the carved height grid instead, which is the 8 m coarse grid when a tile's
    /// roads arrive before its 1 m tiles: the ribbon then sat up to metres off the road the car drove on and the
    /// finer terrain cut through it in steps.
    /// UVs: u = −1 at the left skirt, 0..1 across the carriageway, 2 at the right skirt (markings in the
    /// material by u), v = metres along / 4; UV1.x = the carriageway half width (Rally/Road draws markings on two-lane
    /// asphalt only); UV1.y how far inside a road tunnel (<see cref="Tunnels.InsideWeight"/>: lamp light, not the sun). Sub-mesh 0 is tarmac, 1 gravel.
    /// </summary>
    public static class RibbonMesh
    {
        /// <summary>Half-open ownership test: a point on a border belongs to the tile east / north of it.</summary>
        public static bool Owns(Bounds25833? own, double2 p) => !own.HasValue || (p.x >= own.Value.MinE && p.x < own.Value.MaxE && p.y >= own.Value.MinN && p.y < own.Value.MaxN);

        public const int Rows = 6;
        /// <summary>Skirts run SkirtOut beyond the shoulder edge and SkirtDrop down: buried in the terrain that meets the edge
        /// (RoadConstants.CarveLift), they show only where a coarse terrain ring sags, as an earth-coloured embankment face
        /// rather than the vertical wall and shadow line they used to draw.</summary>
        public const float SkirtDrop = 0.55f, SkirtOut = 0.5f;

        [StructLayout(LayoutKind.Sequential)]
        struct Vertex { public float3 Pos; public float3 Normal; public float2 UV; public float2 UV1; }

        /// <summary>
        /// Build one mesh for a tile's runs, in metres relative to <paramref name="origin"/>. A tile's runs reach TilePad into
        /// its neighbours (grading and carving need that context), so with <paramref name="own"/> only the segments whose
        /// middle lies inside the tile itself (half-open) are drawn: every stretch of road by exactly one tile. Two tiles used to
        /// draw the same 120 m at every border, from different meshes with V restarting at each run: z-fighting dashes.
        /// </summary>
        public static Mesh Build(List<RoadPolyline> lines, Utm33 origin, Bounds25833? own = null)
        {
            var verts = new List<Vertex>(4096);
            var tarmac = new List<uint>(8192); var gravel = new List<uint>(8192);
            foreach (var line in lines)
            {
                var s = line.Samples;
                if (s == null || s.Count < 2) continue;
                float half = line.Lanes.Half, shoulder = RoadConstants.RoadShoulder;
                var idx = line.Paved ? tarmac : gravel;
                int baseV = verts.Count;
                for (int i = 0; i < s.Count; i++)
                {
                    double2 prev = s[math.max(0, i - 1)].P, next = s[math.min(s.Count - 1, i + 1)].P;
                    double2 t = next - prev; double tl = math.length(t); if (tl == 0) tl = 1; t /= tl;
                    double2 n = new double2(-t.y, t.x);
                    for (int k = 0; k < Rows; k++)
                    {
                        float offset = k <= 2 ? -(k == 2 ? half : half + shoulder) : (k == 3 ? half : half + shoulder);
                        bool skirt = k == 0 || k == 5;
                        double2 p = s[i].P + n * (offset + (skirt ? math.sign(offset) * SkirtOut : 0));
                        // Skirts: from the shoulder edge out and down into the ground.
                        float y = s[i].RoadY + RoadConstants.RoadLift + RoadConstants.SurfaceLift((float)math.abs(offset), half) - (skirt ? SkirtDrop : 0);
                        float u = k == 0 ? -1 : k == 1 ? -shoulder / (2 * half) : k == 2 ? 0 : k == 3 ? 1 : k == 4 ? 1 + shoulder / (2 * half) : 2;
                        verts.Add(new Vertex
                        {
                            Pos = new float3((float)(p.x - origin.E), y, (float)(p.y - origin.N)),
                            Normal = new float3(0, 1, 0), UV = new float2(u, s[i].S / 4f), UV1 = new float2(half, Tunnels.InsideWeight(s[i], line.WayLength)),
                        });
                    }
                    if (i < s.Count - 1 && !(s[i].Covered && s[i + 1].Covered) && Owns(own, (s[i].P + s[i + 1].P) * 0.5))   // inside a junction the major road's ribbon is the surface
                    {
                        uint a = (uint)(baseV + i * Rows), b = (uint)(baseV + (i + 1) * Rows);
                        for (uint k = 0; k < Rows - 1; k++)
                        {
                            // Clockwise seen from above (Unity front face) — mirrored from the three.js winding.
                            idx.Add(a + k); idx.Add(a + k + 1); idx.Add(b + k);
                            idx.Add(a + k + 1); idx.Add(b + k + 1); idx.Add(b + k);
                        }
                    }
                }
            }
            if (verts.Count == 0 || tarmac.Count + gravel.Count == 0) return null;
            var data = Mesh.AllocateWritableMeshData(1);
            var md = data[0];
            md.SetVertexBufferParams(verts.Count,
                new VertexAttributeDescriptor(VertexAttribute.Position, VertexAttributeFormat.Float32, 3),
                new VertexAttributeDescriptor(VertexAttribute.Normal, VertexAttributeFormat.Float32, 3),
                new VertexAttributeDescriptor(VertexAttribute.TexCoord0, VertexAttributeFormat.Float32, 2),
                new VertexAttributeDescriptor(VertexAttribute.TexCoord1, VertexAttributeFormat.Float32, 2));
            var vb = md.GetVertexData<Vertex>();
            for (int i = 0; i < verts.Count; i++) vb[i] = verts[i];
            md.SetIndexBufferParams(tarmac.Count + gravel.Count, IndexFormat.UInt32);
            var ib = md.GetIndexData<uint>();
            for (int i = 0; i < tarmac.Count; i++) ib[i] = tarmac[i];
            for (int i = 0; i < gravel.Count; i++) ib[tarmac.Count + i] = gravel[i];
            md.subMeshCount = 2;
            md.SetSubMesh(0, new SubMeshDescriptor(0, tarmac.Count), MeshUpdateFlags.DontRecalculateBounds);
            md.SetSubMesh(1, new SubMeshDescriptor(tarmac.Count, gravel.Count), MeshUpdateFlags.DontRecalculateBounds);
            var mesh = new Mesh { name = "RoadRibbon" };
            Mesh.ApplyAndDisposeWritableMeshData(data, mesh);
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }
    }
}
