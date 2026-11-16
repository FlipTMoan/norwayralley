using System;
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
    /// The road surface mesh over the carved ground (port of stage.js buildRibbon as roads.js
    /// buildRoadMeshes uses it): six rows per station — skirt, shoulder, carriageway edge, carriageway
    /// edge, shoulder, skirt — floating ROAD_RIBBON_LIFT above the carve with a ROAD_CROWN on the
    /// carriageway rows, every edge height clamped against the centre line so the slab never tips into a
    /// crest between two sections, and short skirts hanging off both shoulders so the road reads as a
    /// solid ribbon. The car rides the ribbon (RoadConstants.SurfaceLift adds the same numbers).
    /// UVs: u = −1 at the left skirt, 0..1 across the carriageway, 2 at the right skirt (markings in the
    /// material by u), v = metres along / 4 (dash period). Sub-mesh 0 is tarmac, 1 gravel.
    /// </summary>
    public static class RibbonMesh
    {
        public const int Rows = 6;
        public const float SkirtDrop = 0.55f;

        [StructLayout(LayoutKind.Sequential)]
        struct Vertex { public float3 Pos; public float3 Normal; public float2 UV; }

        /// <summary>Build one mesh for a tile's runs, in metres relative to <paramref name="origin"/>; <paramref name="carvedGround"/> samples the carved (not natural) ground.</summary>
        public static Mesh Build(List<RoadPolyline> lines, Utm33 origin, Func<Utm33, float> carvedGround)
        {
            var verts = new List<Vertex>(4096);
            var tarmac = new List<uint>(8192); var gravel = new List<uint>(8192);
            foreach (var line in lines)
            {
                var s = line.Samples;
                if (s == null || s.Count < 2) continue;
                float half = line.Lanes.Half, shoulder = RoadConstants.RoadShoulder;
                float tiltLimit = math.max(0.5f, half * 1.15f);
                var idx = line.Paved ? tarmac : gravel;
                int baseV = verts.Count;
                for (int i = 0; i < s.Count; i++)
                {
                    double2 prev = s[math.max(0, i - 1)].P, next = s[math.min(s.Count - 1, i + 1)].P;
                    double2 t = next - prev; double tl = math.length(t); if (tl == 0) tl = 1; t /= tl;
                    double2 n = new double2(-t.y, t.x);
                    float centreY = carvedGround(new Utm33(s[i].P.x, s[i].P.y));
                    for (int k = 0; k < Rows; k++)
                    {
                        float offset = k <= 2 ? -(k == 2 ? half : half + shoulder) : (k == 3 ? half : half + shoulder);
                        double2 p = s[i].P + n * offset;
                        float edgeY = carvedGround(new Utm33(p.x, p.y));
                        if (k != 2 && k != 3) edgeY = centreY + math.clamp(edgeY - centreY, -tiltLimit, tiltLimit);
                        float crown = k == 2 || k == 3 ? RoadConstants.RoadCrown : 0;
                        float drop = k == 0 || k == 5 ? SkirtDrop : 0;
                        float u = k == 0 ? -1 : k == 1 ? -shoulder / (2 * half) : k == 2 ? 0 : k == 3 ? 1 : k == 4 ? 1 + shoulder / (2 * half) : 2;
                        verts.Add(new Vertex
                        {
                            Pos = new float3((float)(p.x - origin.E), edgeY + RoadConstants.RoadRibbonLift + crown - drop, (float)(p.y - origin.N)),
                            Normal = new float3(0, 1, 0), UV = new float2(u, s[i].S / 4f),
                        });
                    }
                    if (i < s.Count - 1)
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
            if (verts.Count == 0) return null;
            var data = Mesh.AllocateWritableMeshData(1);
            var md = data[0];
            md.SetVertexBufferParams(verts.Count,
                new VertexAttributeDescriptor(VertexAttribute.Position, VertexAttributeFormat.Float32, 3),
                new VertexAttributeDescriptor(VertexAttribute.Normal, VertexAttributeFormat.Float32, 3),
                new VertexAttributeDescriptor(VertexAttribute.TexCoord0, VertexAttributeFormat.Float32, 2));
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
