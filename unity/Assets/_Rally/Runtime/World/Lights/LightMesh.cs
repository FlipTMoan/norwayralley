using System;
using System.Collections.Generic;
using Rally.Core;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.World
{
    /// <summary>
    /// The geometry of a tile's street lights, for the Rally/Tunnel shader (vertex colours; alpha 0 = lit like the world, 1 =
    /// emissive): a tapered galvanised steel mast (sunk <see cref="SignMesh.PostSink"/> m so a finer DTM never shows its foot),
    /// an arm (or a short bracket) rising slightly towards the road, and a flat LED head with a light grey housing and a faint
    /// warm glowing underside. One mesh per tile, positions relative to the tile origin (x = E, z = N, y = height).
    /// </summary>
    public static class LightMesh
    {
        public const float FootRadius = 0.09f, TopRadius = 0.05f, ArmRadius = 0.035f, ArmRise = 0.12f;
        public const float HeadLength = 0.65f, HeadWidth = 0.28f, HeadThick = 0.09f;
        static readonly Color MastColour = new Color(0.62f, 0.64f, 0.64f, 0f), HousingColour = new Color(0.76f, 0.77f, 0.78f, 0f),
            CapColour = new Color(0.35f, 0.36f, 0.37f, 0f), GlowColour = new Color(0.62f, 0.57f, 0.47f, 1f);

        sealed class Builder
        {
            public readonly List<Vector3> V = new List<Vector3>(); public readonly List<Vector3> N = new List<Vector3>();
            public readonly List<Color> C = new List<Color>(); public readonly List<int> T = new List<int>();
            public int Add(float3 p, float3 n, Color c) { V.Add(p); N.Add(n); C.Add(c); return V.Count - 1; }
            /// <summary>The quad a→b→c→d (a loop), wound front-facing towards <paramref name="n"/> (Unity: cross(b − a, c − a) points at the viewer).</summary>
            public void Quad(int a, int b, int c, int d, float3 n)
            {
                if (math.dot(math.cross((float3)V[b] - (float3)V[a], (float3)V[c] - (float3)V[a]), n) >= 0) { T.Add(a); T.Add(b); T.Add(c); T.Add(a); T.Add(c); T.Add(d); }
                else { T.Add(a); T.Add(c); T.Add(b); T.Add(a); T.Add(d); T.Add(c); }
            }
        }

        /// <summary>
        /// Builds the mesh for <paramref name="posts"/> relative to <paramref name="origin"/>; null when there are none.
        /// <paramref name="heads"/> receives each lamp head's centre (origin-relative, for tests).
        /// </summary>
        public static Mesh Build(IReadOnlyList<LightPost> posts, Utm33 origin, Func<Utm33, float> ground, List<float3> heads = null)
        {
            if (posts == null || posts.Count == 0) return null;
            var b = new Builder();
            foreach (var post in posts)
            {
                var foot = new float3((float)(post.Position.E - origin.E), ground(post.Position), (float)(post.Position.N - origin.N));
                var toRoad = math.normalizesafe(new float3((float)post.ToRoad.x, 0, (float)post.ToRoad.y), new float3(1, 0, 0));
                float h = post.Height;
                Tube(b, foot + new float3(0, -SignMesh.PostSink, 0), foot + new float3(0, h, 0), FootRadius, TopRadius, 8, MastColour);
                Cap(b, foot + new float3(0, h, 0), TopRadius * 1.2f);
                // the arm leaves the mast just under its top and rises towards the road
                var armStart = foot + new float3(0, h - 0.15f, 0);
                var armEnd = foot + toRoad * post.Arm + new float3(0, h - 0.15f + post.Arm * ArmRise, 0);
                Tube(b, armStart, armEnd, ArmRadius, ArmRadius * 0.9f, 6, MastColour);
                var head = armEnd + toRoad * (HeadLength / 2 - 0.1f);
                Head(b, head, toRoad);
                heads?.Add(head);
            }
            var mesh = new Mesh { name = "Lights", indexFormat = b.V.Count > 65000 ? IndexFormat.UInt32 : IndexFormat.UInt16 };
            mesh.SetVertices(b.V); mesh.SetNormals(b.N); mesh.SetColors(b.C);
            mesh.SetTriangles(b.T, 0, false);
            mesh.RecalculateBounds();
            return mesh;
        }

        /// <summary>A tapered tube from <paramref name="a"/> (radius <paramref name="ra"/>) to <paramref name="c"/> (radius <paramref name="rc"/>), open ends.</summary>
        static void Tube(Builder b, float3 a, float3 c, float ra, float rc, int sides, Color col)
        {
            var axis = math.normalizesafe(c - a, new float3(0, 1, 0));
            var u = math.normalizesafe(math.cross(axis, math.abs(axis.y) > 0.9f ? new float3(1, 0, 0) : new float3(0, 1, 0)));
            var v = math.cross(axis, u);
            int k = b.V.Count;
            for (int i = 0; i <= sides; i++)
            {
                float ang = i * math.PI * 2 / sides;
                var dir = u * math.cos(ang) + v * math.sin(ang);
                b.Add(a + dir * ra, dir, col);
                b.Add(c + dir * rc, dir, col);
            }
            for (int i = 0; i < sides; i++)
            {
                int p = k + i * 2, q = p + 2;
                b.Quad(p, p + 1, q + 1, q, (float3)b.N[p] + (float3)b.N[q]);
            }
        }

        static void Cap(Builder b, float3 top, float r)
        {
            int centre = b.Add(top + new float3(0, 0.02f, 0), new float3(0, 1, 0), CapColour);
            int ring = b.V.Count;
            for (int i = 0; i < 8; i++) { float a = i * math.PI / 4; b.Add(top + new float3(math.cos(a) * r, 0, math.sin(a) * r), new float3(0, 1, 0), CapColour); }
            for (int i = 0; i < 8; i++) { b.T.Add(centre); b.T.Add(ring + (i + 1) % 8); b.T.Add(ring + i); }
        }

        /// <summary>The flat LED head: a housing box along the arm, its underside a glowing panel a hair below.</summary>
        static void Head(Builder b, float3 c, float3 along)
        {
            var up = new float3(0, 1, 0);
            var side = math.cross(up, along);
            float3 ax = along * (HeadLength / 2), ay = up * (HeadThick / 2), az = side * (HeadWidth / 2);
            float3[] n = { along, -along, up, -up, side, -side };
            float3[] o = { ax, -ax, ay, -ay, az, -az };
            float3[] e1 = { ay, ay, az, az, ax, ax }, e2 = { az, az, ax, ax, ay, ay };
            for (int f = 0; f < 6; f++) Face(b, c + o[f], e1[f], e2[f], n[f], HousingColour);
            Face(b, c - ay * 1.05f, ax * 0.8f, az * 0.75f, -up, GlowColour);
        }

        static void Face(Builder b, float3 centre, float3 e1, float3 e2, float3 n, Color col)
        {
            int k = b.V.Count;
            b.Add(centre - e1 - e2, n, col); b.Add(centre + e1 - e2, n, col); b.Add(centre + e1 + e2, n, col); b.Add(centre - e1 + e2, n, col);
            b.Quad(k, k + 1, k + 2, k + 3, n);
        }
    }
}
