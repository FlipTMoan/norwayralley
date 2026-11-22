using System;
using System.Collections.Generic;
using Rally.Core;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.World
{
    /// <summary>
    /// The geometry of a tile's sign posts: galvanised round posts (sunk <see cref="PostSink"/> m into the ground so a
    /// later, finer DTM never shows their foot), each plate cut to its real outline with a face, an aluminium back and a
    /// rim, mounted in front of the post on two clamp brackets. Wide plates (direction signs) stand on two posts. One mesh
    /// per tile, a sub-mesh per atlas page; vertex colour alpha 1 = take the atlas texel, 0 = the vertex colour (metal).
    /// </summary>
    public static class SignMesh
    {
        public const float PostRadius = 0.03f, WidePostRadius = 0.04f, PostSink = 0.5f;
        public const float PlateBottom = 1.5f, MarkerBottom = 0.6f, PlateGap = 0.06f, Thickness = 0.012f, Standoff = 0.035f;
        public const float TwoPostWidth = 1.3f;
        /// <summary>The post's top (under its cap) stands this far over the top plate's upper edge.</summary>
        public const float PostOverTop = 0.02f;
        static readonly Color PostColour = new Color(0.60f, 0.62f, 0.62f, 0f), BackColour = new Color(0.66f, 0.68f, 0.69f, 0f),
            RimColour = new Color(0.78f, 0.79f, 0.80f, 0f), BracketColour = new Color(0.42f, 0.43f, 0.44f, 0f), CapColour = new Color(0.08f, 0.08f, 0.08f, 0f);

        /// <summary>One drawn plate, for tests: world centre of its face and the face's normal.</summary>
        public struct PlateInfo { public float3 Centre, Normal; public float Width, Height; public string Key; }

        sealed class Builder
        {
            public readonly List<Vector3> V = new List<Vector3>(); public readonly List<Vector3> N = new List<Vector3>();
            public readonly List<Color> C = new List<Color>(); public readonly List<Vector2> UV = new List<Vector2>();
            public readonly Dictionary<int, List<int>> Tris = new Dictionary<int, List<int>>();
            public List<int> T(int page) { if (!Tris.TryGetValue(page, out var l)) Tris[page] = l = new List<int>(); return l; }
            public int Add(float3 p, float3 n, Color c, Vector2 uv) { V.Add(p); N.Add(n); C.Add(c); UV.Add(uv); return V.Count - 1; }
        }

        /// <summary>
        /// Builds the mesh for <paramref name="posts"/> relative to <paramref name="origin"/> (x = E, z = N, y = height).
        /// <paramref name="faceOf"/> gives each design's painted atlas face (null: the plate is skipped).
        /// <paramref name="postFeet"/> receives every post's foot (world-relative to origin, for colliders).
        /// </summary>
        public static Mesh Build(IReadOnlyList<SignPost> posts, Utm33 origin, Func<Utm33, float> ground, Func<SignDesign, SignAtlas.Face> faceOf,
            List<int> pagesUsed, List<(float3 foot, float height, float radius)> postFeet = null, List<PlateInfo> plates = null)
        {
            var b = new Builder();
            int postPage = -1;
            foreach (var post in posts)
            {
                // Plates grouped by the way they face; each group is stacked from the top down.
                var groups = new List<(double2 face, List<(PostPlate p, SignAtlas.Face f)> items)>();
                foreach (var pp in post.Plates)
                {
                    var f = faceOf(pp.Design);
                    if (f == null) continue;
                    if (postPage < 0) postPage = f.Page;
                    int gi = groups.FindIndex(g => math.dot(g.face, pp.Face) > 0.7);
                    if (gi < 0) { groups.Add((pp.Face, new List<(PostPlate, SignAtlas.Face)>())); gi = groups.Count - 1; }
                    groups[gi].items.Add((pp, f));
                }
                if (groups.Count == 0) continue;
                float y0 = ground(post.Position);
                float3 basePos = new float3((float)(post.Position.E - origin.E), y0, (float)(post.Position.N - origin.N));
                bool markersOnly = true; float widest = 0; double2 wideFace = groups[0].face;
                foreach (var g in groups)
                    foreach (var it in g.items)
                    {
                        if (!it.p.Design.Key.StartsWith("90")) markersOnly = false;
                        if (it.p.Design.WidthMm > widest) { widest = it.p.Design.WidthMm; wideFace = g.face; }
                    }
                float bottom = markersOnly ? MarkerBottom : PlateBottom;
                // Levels from the top: NVDB's Plasseringskode when every plate has one (plates back to back share a level),
                // else each face's plates from the top down. A level is as tall as its tallest face's plates there.
                bool ordered = true;
                foreach (var g in groups) foreach (var it in g.items) if (it.p.Plate.Order <= 0) ordered = false;
                var levelOf = new Dictionary<(int g, int i), int>();
                var levels = new SortedDictionary<int, float>();
                for (int gi = 0; gi < groups.Count; gi++)
                {
                    var sums = new Dictionary<int, float>();
                    for (int i = 0; i < groups[gi].items.Count; i++)
                    {
                        var it = groups[gi].items[i];
                        int lv = ordered ? it.p.Plate.Order : i;
                        levelOf[(gi, i)] = lv;
                        sums.TryGetValue(lv, out var sum);
                        sums[lv] = sum + (sum > 0 ? PlateGap : 0) + it.p.Design.HeightMm / 1000f;
                    }
                    foreach (var kv in sums) levels[kv.Key] = math.max(levels.TryGetValue(kv.Key, out var h0) ? h0 : 0, kv.Value);
                }
                float total = -PlateGap;
                foreach (var h in levels.Values) total += h + PlateGap;
                float top = bottom + total;
                var levelTop = new Dictionary<int, float>();
                float yl = top;
                foreach (var kv in levels) { levelTop[kv.Key] = yl; yl -= kv.Value + PlateGap; }
                float radius = widest > 900 ? WidePostRadius : PostRadius;
                // a hint of hand-mounted sloppiness: up to ±1.5° per post
                float jitter = ((post.Id * 2654435761L) % 1000) / 1000f * 0.05f - 0.025f;
                for (int gi = 0; gi < groups.Count; gi++)
                {
                    var g = groups[gi];
                    var n = math.mul(quaternion.RotateY(jitter), new float3((float)g.face.x, 0, (float)g.face.y));
                    var next = new Dictionary<int, float>(levelTop);
                    for (int i = 0; i < g.items.Count; i++)
                    {
                        var it = g.items[i];
                        int lv = levelOf[(gi, i)];
                        float y = next[lv];
                        float h = it.p.Design.HeightMm / 1000f;
                        float3 centre = basePos + new float3(0, y - h / 2, 0) + n * (radius + Standoff + Thickness / 2);
                        Plate(b, it.f, it.p.Design, centre, n, it.p.TwoSided);
                        Brackets(b, postPage, basePos + new float3(0, y - h, 0), n, h, radius);
                        plates?.Add(new PlateInfo { Centre = centre + n * Thickness / 2, Normal = n, Width = it.p.Design.WidthMm / 1000f, Height = h, Key = it.p.Design.Key });
                        next[lv] = y - h - PlateGap;
                    }
                }
                // the post ends with its cap just over the top plate's edge
                float postTop = top + PostOverTop;
                if (widest / 1000f > TwoPostWidth)
                {
                    var wn = new float3((float)wideFace.x, 0, (float)wideFace.y);
                    var right = math.cross(new float3(0, 1, 0), -wn);
                    float off = widest / 2000f - 0.25f;
                    foreach (var s in new[] { -1f, 1f })
                    {
                        var foot = basePos + right * off * s;
                        foot.y = ground(new Utm33(origin.E + foot.x, origin.N + foot.z));
                        Post(b, postPage, foot, basePos.y + postTop - foot.y, radius);
                        postFeet?.Add((foot, basePos.y + postTop - foot.y, radius));
                    }
                }
                else
                {
                    Post(b, postPage, basePos, postTop, radius);
                    postFeet?.Add((basePos, postTop, radius));
                }
            }
            if (b.V.Count == 0) return null;
            var mesh = new Mesh { name = "Signs", indexFormat = b.V.Count > 65000 ? IndexFormat.UInt32 : IndexFormat.UInt16 };
            mesh.SetVertices(b.V); mesh.SetNormals(b.N); mesh.SetColors(b.C); mesh.SetUVs(0, b.UV);
            var keys = new List<int>(b.Tris.Keys);
            keys.Sort();
            mesh.subMeshCount = keys.Count;
            for (int i = 0; i < keys.Count; i++) mesh.SetTriangles(b.Tris[keys[i]], i, false);
            mesh.RecalculateBounds();
            pagesUsed.Clear(); pagesUsed.AddRange(keys);
            return mesh;
        }

        static void Plate(Builder b, SignAtlas.Face f, SignDesign d, float3 centre, float3 n, bool twoSided)
        {
            var outline = d.Outline();
            var up = new float3(0, 1, 0);
            var right = math.cross(up, -n);                      // the reader's right
            float w = d.WidthMm, h = d.HeightMm;
            // the outline's winding as the reader sees it (x right, y up)
            float area = 0;
            for (int i = 0; i < outline.Count; i++) { var a = outline[i]; var c = outline[(i + 1) % outline.Count]; area += a.x * -c.y - c.x * -a.y; }
            bool ccw = area > 0;
            float3 Pos(float2 mm, float side) => centre + right * ((mm.x - w / 2) / 1000f) + up * ((h / 2 - mm.y) / 1000f) + n * (side * Thickness / 2);
            Vector2 Uv(float2 mm, bool mirror) => new Vector2(f.UvOrigin.x + (mirror ? w - mm.x : mm.x) * f.UvPerMm.x, f.UvOrigin.y + mm.y * f.UvPerMm.y);
            var tris = b.T(f.Page);
            float2 mid = new float2(w / 2, h / 2);
            // face
            int c0 = b.Add(Pos(mid, 1), n, Color.white, Uv(mid, false));
            int start = b.V.Count;
            foreach (var p in outline) b.Add(Pos(p, 1), n, Color.white, Uv(p, false));
            for (int i = 0; i < outline.Count; i++)
            {
                int a = start + i, c = start + (i + 1) % outline.Count;
                if (ccw) { tris.Add(c0); tris.Add(c); tris.Add(a); } else { tris.Add(c0); tris.Add(a); tris.Add(c); }
            }
            // back: aluminium, or the same face again on a two-sided plate (mirrored so it reads right from behind)
            var backCol = twoSided ? Color.white : BackColour;
            int c1 = b.Add(Pos(mid, -1), -n, backCol, Uv(mid, true));
            start = b.V.Count;
            foreach (var p in outline) b.Add(Pos(p, -1), -n, backCol, Uv(p, true));
            for (int i = 0; i < outline.Count; i++)
            {
                int a = start + i, c = start + (i + 1) % outline.Count;
                if (ccw) { tris.Add(c1); tris.Add(a); tris.Add(c); } else { tris.Add(c1); tris.Add(c); tris.Add(a); }
            }
            // rim
            for (int i = 0; i < outline.Count; i++)
            {
                var p = outline[i]; var q = outline[(i + 1) % outline.Count];
                float3 pf = Pos(p, 1), qf = Pos(q, 1), pb = Pos(p, -1), qb = Pos(q, -1);
                float3 edge = math.normalizesafe(qf - pf);
                float3 outward = math.normalizesafe(math.cross(edge, n));
                if (math.dot(outward, (pf + qf) / 2 - centre - n * Thickness / 2) < 0) outward = -outward;
                int k = b.V.Count;
                b.Add(pf, outward, RimColour, Vector2.zero); b.Add(qf, outward, RimColour, Vector2.zero);
                b.Add(qb, outward, RimColour, Vector2.zero); b.Add(pb, outward, RimColour, Vector2.zero);
                // wind so the quad faces outward
                float3 tn = math.cross(qf - pf, pb - pf);
                if (math.dot(tn, outward) > 0) { tris.Add(k); tris.Add(k + 1); tris.Add(k + 2); tris.Add(k); tris.Add(k + 2); tris.Add(k + 3); }
                else { tris.Add(k); tris.Add(k + 2); tris.Add(k + 1); tris.Add(k); tris.Add(k + 3); tris.Add(k + 2); }
            }
        }

        /// <summary>Clamp brackets between the post and the plate back, at a quarter and three quarters of its height.</summary>
        static void Brackets(Builder b, int page, float3 bottomAtPost, float3 n, float h, float radius)
        {
            var right = math.cross(new float3(0, 1, 0), -n);
            int count = h > 0.35f ? 2 : 1;
            for (int i = 0; i < count; i++)
            {
                float y = count == 1 ? h / 2 : (i == 0 ? h * 0.25f : h * 0.75f);
                float3 c = bottomAtPost + new float3(0, y, 0) + n * ((radius + Standoff) / 2);
                Box(b, page, c, right * 0.06f, new float3(0, 0.022f, 0), n * ((radius + Standoff) / 2 + radius * 0.3f), BracketColour);
            }
        }

        static void Box(Builder b, int page, float3 c, float3 ax, float3 ay, float3 az, Color col)
        {
            var tris = b.T(page);
            float3[] dirs = { math.normalizesafe(ax), -math.normalizesafe(ax), math.normalizesafe(ay), -math.normalizesafe(ay), math.normalizesafe(az), -math.normalizesafe(az) };
            float3[] u = { ay, ay, az, az, ax, ax }, v = { az, az, ax, ax, ay, ay }, o = { ax, -ax, ay, -ay, az, -az };
            for (int f = 0; f < 6; f++)
            {
                int k = b.V.Count;
                float3 fc = c + o[f];
                b.Add(fc - u[f] - v[f], dirs[f], col, Vector2.zero); b.Add(fc + u[f] - v[f], dirs[f], col, Vector2.zero);
                b.Add(fc + u[f] + v[f], dirs[f], col, Vector2.zero); b.Add(fc - u[f] + v[f], dirs[f], col, Vector2.zero);
                float3 tn = math.cross(u[f], v[f]);
                if (math.dot(tn, dirs[f]) > 0) { tris.Add(k); tris.Add(k + 1); tris.Add(k + 2); tris.Add(k); tris.Add(k + 2); tris.Add(k + 3); }
                else { tris.Add(k); tris.Add(k + 2); tris.Add(k + 1); tris.Add(k); tris.Add(k + 3); tris.Add(k + 2); }
            }
        }

        /// <summary>An 8-sided post from PostSink under the foot to <paramref name="height"/> above it, with a dark cap.</summary>
        static void Post(Builder b, int page, float3 foot, float height, float r)
        {
            var tris = b.T(page);
            const int sides = 8;
            int k = b.V.Count;
            for (int i = 0; i <= sides; i++)
            {
                float a = i * math.PI * 2 / sides;
                var dir = new float3(math.cos(a), 0, math.sin(a));
                b.Add(foot + dir * r + new float3(0, -PostSink, 0), dir, PostColour, Vector2.zero);
                b.Add(foot + dir * r + new float3(0, height, 0), dir, PostColour, Vector2.zero);
            }
            for (int i = 0; i < sides; i++)
            {
                int a = k + i * 2, c = a + 2;
                // Unity: clockwise seen from outside
                tris.Add(a); tris.Add(a + 1); tris.Add(c + 1);
                tris.Add(a); tris.Add(c + 1); tris.Add(c);
            }
            int centre = b.Add(foot + new float3(0, height + 0.012f, 0), new float3(0, 1, 0), CapColour, Vector2.zero);
            int ring = b.V.Count;
            for (int i = 0; i < sides; i++)
            {
                float a = i * math.PI * 2 / sides;
                b.Add(foot + new float3(math.cos(a) * r * 1.15f, height, math.sin(a) * r * 1.15f), new float3(0, 1, 0), CapColour, Vector2.zero);
            }
            for (int i = 0; i < sides; i++) { tris.Add(centre); tris.Add(ring + (i + 1) % sides); tris.Add(ring + i); }
        }
    }
}
