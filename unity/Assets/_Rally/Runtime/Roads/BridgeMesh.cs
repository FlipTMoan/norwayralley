using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using Rally.Core;
using Rally.Geo;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.Roads
{
    /// <summary>
    /// The visible bridge structure of a tile's runs (bridges.js buildBridgeParts): per span a concrete deck slab under the
    /// road ribbon (out to <see cref="RoadConstants.DeckHalf"/>), a kerb beam and a steel guard rail on posts along both
    /// edges, piers down to the ground every ~30 m and an abutment wall at each end. One flat-shaded, vertex-coloured mesh
    /// (the house material: one draw call, casts shadows) in metres relative to the tile origin, and a second mesh of the
    /// solid parts for a MeshCollider: the rails (a band from just under the deck to above the rail, so a car on the deck
    /// is held but one in the river below passes under) and the piers and abutments.
    /// </summary>
    public static class BridgeMesh
    {
        public const float RailHeight = 0.85f, KerbHeight = 0.25f, KerbWidth = 0.45f;
        static readonly Color32 Concrete = new Color32(0x9a, 0x97, 0x8f, 255), ConcreteDark = new Color32(0x6a, 0x68, 0x63, 255),
            Rail = new Color32(0xc4, 0xc7, 0xc6, 255), Post = new Color32(0x77, 0x79, 0x7a, 255);

        [StructLayout(LayoutKind.Sequential)]
        struct Vertex { public float3 Pos; public float3 Normal; public Color32 Color; }

        sealed class Buf
        {
            public readonly List<Vertex> V = new List<Vertex>(4096);
            public readonly List<int> I = new List<int>(8192);

            /// <summary>One flat quad; the winding is chosen so its face looks along <paramref name="outward"/> (Unity: clockwise is front).</summary>
            public void Quad(float3 a, float3 b, float3 c, float3 d, float3 outward, Color32 col)
            {
                float3 n = math.normalizesafe(math.cross(b - a, c - a));
                if (math.dot(n, outward) < 0) { (b, d) = (d, b); n = -n; }
                int k = V.Count;
                V.Add(new Vertex { Pos = a, Normal = n, Color = col }); V.Add(new Vertex { Pos = b, Normal = n, Color = col });
                V.Add(new Vertex { Pos = c, Normal = n, Color = col }); V.Add(new Vertex { Pos = d, Normal = n, Color = col });
                I.Add(k); I.Add(k + 1); I.Add(k + 2); I.Add(k); I.Add(k + 2); I.Add(k + 3);
            }

            /// <summary>Oriented box: centre, unit along-direction (horizontal), half length / half width / half height.</summary>
            public void Box(float3 c, float2 t, float hl, float hw, float hh, Color32 col, Color32 under)
            {
                float3 T = new float3(t.x, 0, t.y) * hl, N = new float3(-t.y, 0, t.x) * hw, U = new float3(0, hh, 0);
                float3 P(int a, int b, int u) => c + T * a + N * b + U * u;
                Quad(P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1), new float3(0, 1, 0), col);
                Quad(P(-1, -1, -1), P(1, -1, -1), P(1, 1, -1), P(-1, 1, -1), new float3(0, -1, 0), under);
                Quad(P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1), T, col);
                Quad(P(-1, -1, -1), P(-1, 1, -1), P(-1, 1, 1), P(-1, -1, 1), -T, col);
                Quad(P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1), N, col);
                Quad(P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1), -N, col);
            }
        }

        /// <summary>Spans <c>[i0, i1]</c> of the run's samples flagged <see cref="RoadSample.Bridge"/>.</summary>
        public static List<BridgeSpan> Spans(List<RoadSample> s)
        {
            var spans = new List<BridgeSpan>();
            for (int i = 0; i < s.Count; i++)
            {
                if (!s[i].Bridge) continue;
                int j = i;
                while (j + 1 < s.Count && s[j + 1].Bridge) j++;
                if (j > i) spans.Add(new BridgeSpan(i, j));
                i = j;
            }
            return spans;
        }

        /// <summary>
        /// Build the drawn mesh (null without bridges) and the collider mesh (<paramref name="collider"/>, null without
        /// bridges) for a tile's runs. <paramref name="ground"/> is the natural ground the piers stand on. With
        /// <paramref name="own"/> a span is built only by the tile that holds its middle sample (RibbonMesh.Owns), not by
        /// both tiles whose padded runs reach it.
        /// </summary>
        public static Mesh Build(List<RoadPolyline> lines, Utm33 origin, Func<Utm33, float> ground, out Mesh collider, Bounds25833? own = null)
        {
            var draw = new Buf(); var solid = new Buf();
            var o = new double2(origin.E, origin.N);
            foreach (var line in lines)
            {
                var s = line.Samples;
                if (s == null || s.Count < 2) continue;
                float W = RoadConstants.DeckHalf(line.Lanes.Half);
                foreach (var sp in Spans(s))
                {
                    if (!RibbonMesh.Owns(own, s[(sp.I0 + sp.I1) / 2].P)) continue;
                    float2 L(int i) => (float2)(s[i].P - o);
                    float Top(int i) => RoadConstants.DeckTop(s[i].RoadY);
                    float2 Tangent(int i)
                    {
                        float2 d = L(math.min(sp.I1, i + 1)) - L(math.max(sp.I0, i - 1));
                        return math.normalizesafe(d, new float2(0, 1));
                    }
                    // Deck slab: top, bottom and both faces between consecutive cross-sections, end caps at the abutments.
                    for (int i = sp.I0; i < sp.I1; i++)
                    {
                        float2 pa = L(i), pb = L(i + 1), ta = Tangent(i), tb = Tangent(i + 1);
                        float2 na = new float2(-ta.y, ta.x) * W, nb = new float2(-tb.y, tb.x) * W;
                        float ya = Top(i), yb = Top(i + 1);
                        float3 V(float2 p, float y) => new float3(p.x, y, p.y);
                        float3 up = new float3(0, 1, 0);
                        float2 seg = math.normalizesafe(pb - pa);
                        float3 left = new float3(-seg.y, 0, seg.x);
                        draw.Quad(V(pa - na, ya), V(pb - nb, yb), V(pb + nb, yb), V(pa + na, ya), up, Concrete);
                        float da = ya - RoadConstants.DeckThickness, db = yb - RoadConstants.DeckThickness;
                        draw.Quad(V(pa - na, da), V(pb - nb, db), V(pb + nb, db), V(pa + na, da), -up, ConcreteDark);
                        draw.Quad(V(pa + na, da), V(pb + nb, db), V(pb + nb, yb), V(pa + na, ya), left, Concrete);
                        draw.Quad(V(pa - na, da), V(pb - nb, db), V(pb - nb, yb), V(pa - na, ya), -left, Concrete);
                        // Kerb beam, guard rail and a post at every sample, both sides.
                        float len = math.distance(pa, pb);
                        if (len < 1e-3f) continue;
                        float2 mid = (pa + pb) / 2;
                        float ym = (ya + yb) / 2;
                        for (int side = -1; side <= 1; side += 2)
                        {
                            float2 n = new float2(-seg.y, seg.x) * side;
                            float2 kerb = mid + n * (W - KerbWidth / 2);
                            draw.Box(new float3(kerb.x, ym + KerbHeight / 2, kerb.y), seg, len / 2 + 0.01f, KerbWidth / 2, KerbHeight / 2, Concrete, ConcreteDark);
                            float2 r = mid + n * (W - 0.12f);
                            draw.Box(new float3(r.x, ym + RailHeight - 0.15f, r.y), seg, len / 2 + 0.02f, 0.06f, 0.15f, Rail, Rail);
                            float2 pp = pa + n * (W - 0.12f);
                            draw.Box(new float3(pp.x, ya + RailHeight / 2, pp.y), seg, 0.07f, 0.07f, RailHeight / 2, Post, Post);
                            // Solid band for the car: from 0.5 m under the deck top to 0.4 m over the rail, 0.3 m thick at the deck edge.
                            float2 c = mid + n * (W - 0.15f);
                            float y0 = ym - 0.5f, y1 = ym + RailHeight + 0.4f;
                            solid.Box(new float3(c.x, (y0 + y1) / 2, c.y), seg, len / 2 + 0.3f, 0.15f, (y1 - y0) / 2, Post, Post);
                        }
                    }
                    for (int end = 0; end < 2; end++)
                    {
                        int i = end == 0 ? sp.I0 : sp.I1;
                        float2 p = L(i), t = Tangent(i), n = new float2(-t.y, t.x) * W;
                        float y = Top(i), d = y - RoadConstants.DeckThickness;
                        float3 outward = new float3(t.x, 0, t.y) * (end == 0 ? -1 : 1);
                        draw.Quad(new float3(p.x - n.x, d, p.y - n.y), new float3(p.x + n.x, d, p.y + n.y), new float3(p.x + n.x, y, p.y + n.y), new float3(p.x - n.x, y, p.y - n.y), outward, Concrete);
                    }
                    // Piers (and the two abutment walls) from the deck's underside down into the ground.
                    for (int i = sp.I0; i <= sp.I1; i++)
                    {
                        bool isEnd = i == sp.I0 || i == sp.I1;
                        if (!s[i].Pier && !isEnd) continue;
                        float2 p = L(i), t = Tangent(i), n = new float2(-t.y, t.x) * W;
                        float bottom = Top(i) - RoadConstants.DeckThickness;
                        Utm33 U(float2 q) => new Utm33(origin.E + q.x, origin.N + q.y);
                        float g = math.min(ground(U(p)), math.min(ground(U(p + n)), ground(U(p - n)))) - 1f;
                        if (bottom - g < 0.3f) continue;
                        float hl = isEnd ? 0.5f : 0.7f, hw = isEnd ? W : W * 0.55f;
                        var c = new float3(p.x, (bottom + g) / 2, p.y);
                        draw.Box(c, t, hl, hw, (bottom - g) / 2, Concrete, ConcreteDark);
                        solid.Box(c, t, hl, hw, (bottom - g) / 2, Concrete, Concrete);
                    }
                }
            }
            collider = solid.V.Count > 0 ? ToMesh(solid, "BridgeSolids") : null;
            return draw.V.Count > 0 ? ToMesh(draw, "Bridges") : null;
        }

        static Mesh ToMesh(Buf b, string name)
        {
            var data = Mesh.AllocateWritableMeshData(1);
            var md = data[0];
            md.SetVertexBufferParams(b.V.Count,
                new VertexAttributeDescriptor(VertexAttribute.Position, VertexAttributeFormat.Float32, 3),
                new VertexAttributeDescriptor(VertexAttribute.Normal, VertexAttributeFormat.Float32, 3),
                new VertexAttributeDescriptor(VertexAttribute.Color, VertexAttributeFormat.UNorm8, 4));
            var vb = md.GetVertexData<Vertex>();
            for (int i = 0; i < b.V.Count; i++) vb[i] = b.V[i];
            md.SetIndexBufferParams(b.I.Count, IndexFormat.UInt32);
            var ib = md.GetIndexData<uint>();
            for (int i = 0; i < b.I.Count; i++) ib[i] = (uint)b.I[i];
            md.subMeshCount = 1;
            md.SetSubMesh(0, new SubMeshDescriptor(0, b.I.Count), MeshUpdateFlags.DontRecalculateBounds);
            var mesh = new Mesh { name = name };
            Mesh.ApplyAndDisposeWritableMeshData(data, mesh);
            mesh.RecalculateBounds();
            return mesh;
        }
    }
}
