using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Gameplay
{
    /// <summary>
    /// The finish gate over the road (stage.js:941 buildGate had one; the Unity port drew none): two posts just outside the
    /// drawn carriageway and its shoulders, a black-and-white checkered banner across the road <see cref="Clearance"/> m up
    /// (every car passes under it, the Ford Ranger included), and a checkered line painted across the road where the clock
    /// stops. Posts and banner are vertex-coloured on the Rally/Tunnel material (lit like the world; lamp-lit in a tube),
    /// the posts solid for the car (box colliders on layer Buildings, as house walls). The line is Rally/RoadMark paint,
    /// drawn over the ribbon with a depth offset. <see cref="Place"/> is plain data so tests can check it; the game calls
    /// <see cref="Refresh"/> often, so a road graded again under the gate (or the drawn road's width arriving) moves it.
    /// </summary>
    public sealed class FinishGate : IDisposable
    {
        /// <summary>Banner bottom over the road centre (m); lower only in a tunnel, under its roof.</summary>
        public const float Clearance = 5f;
        public const float BannerHeight = 1.5f, Check = 0.75f;
        /// <summary>Post centres this far outside the shoulder (on the carve apron, not in the ditch); post size.</summary>
        public const float PostOut = 0.8f, PostSize = 0.4f;
        /// <summary>Lowest banner bottom a tunnel may push it to (the Ranger is 2.0 m tall).</summary>
        public const float MinClearance = 2.8f;
        /// <summary>Depth of the painted line along the road and its check size.</summary>
        public const float LineDepth = 1.0f, LineCheck = 0.5f;

        public struct Layout
        {
            /// <summary>Road centre under the gate (world xz), the road height there, and the direction of travel.</summary>
            public float2 Centre, Forward;
            public float RoadY;
            /// <summary>Centre line to post centre (m), the drawn carriageway's half width (the painted line), the banner's bottom.</summary>
            public float PostOffset, RoadHalf, BannerBottom;
            /// <summary>Ground under the left and right post.</summary>
            public float LeftGround, RightGround;
            public bool InTunnel;
            public float2 Right => new float2(Forward.y, -Forward.x);
            public float2 LeftPost => Centre - Right * PostOffset;
            public float2 RightPost => Centre + Right * PostOffset;
        }

        /// <summary>
        /// The gate at a point of the route facing <paramref name="yaw"/>, on a road whose drawn carriageway is
        /// <paramref name="roadHalf"/> m wide each side (the road graph's lanes; the stage's width until they are in).
        /// Heights are the ground the car drives on (the top surface: a deck on a bridge, the floor in a tunnel).
        /// </summary>
        public static Layout Place(float2 xz, float yaw, float roadHalf, IGround ground)
        {
            var l = new Layout { Centre = xz, Forward = new float2(math.sin(yaw), math.cos(yaw)), RoadHalf = roadHalf };
            l.RoadY = ground.HeightAt(xz);
            l.PostOffset = roadHalf + RoadConstants.RoadShoulder + PostOut;
            l.BannerBottom = l.RoadY + Clearance;
            if (ground is ILayeredGround layered && layered.TunnelAt(xz, out var spot))
            {
                // In a tube: posts against the walls, the banner under the arch where the posts stand.
                l.InTunnel = true;
                l.PostOffset = math.min(l.PostOffset, spot.Half - PostSize);
                float roofAtPost = spot.Roof;   // the arch is lowest at the posts
                if (layered.TunnelAt(xz + l.Right * l.PostOffset, out var side)) roofAtPost = math.min(roofAtPost, side.Roof);
                l.BannerBottom = math.max(l.RoadY + MinClearance, math.min(l.BannerBottom, roofAtPost - BannerHeight - 0.2f));
            }
            l.LeftGround = ground.HeightAt(l.LeftPost);
            l.RightGround = ground.HeightAt(l.RightPost);
            return l;
        }

        // ---- the drawn gate ----

        readonly GameObject root;
        readonly Mesh gateMesh, lineMesh;
        readonly Material lineMaterial;
        readonly BoxCollider leftCollider, rightCollider;
        Layout current;
        bool placed;

        public Layout Current => current;
        public GameObject Root => root;

        /// <summary><paramref name="gateMaterial"/>: Rally/Tunnel (vertex colours, alpha = how far inside a tube).</summary>
        public FinishGate(Material gateMaterial, Transform parent)
        {
            root = new GameObject("Finish gate");
            if (parent != null) root.transform.SetParent(parent, false);
            gateMesh = new Mesh { name = "Finish gate" };
            lineMesh = new Mesh { name = "Finish line" };
            var g = new GameObject("Posts and banner");
            g.transform.SetParent(root.transform, false);
            g.AddComponent<MeshFilter>().sharedMesh = gateMesh;
            var mr = g.AddComponent<MeshRenderer>();
            mr.sharedMaterial = gateMaterial;
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On; mr.receiveShadows = true;
            var line = new GameObject("Finish line");
            line.transform.SetParent(root.transform, false);
            line.AddComponent<MeshFilter>().sharedMesh = lineMesh;
            var shader = Resources.Load<Shader>("Marks/RoadMark");
            lineMaterial = shader != null ? new Material(shader) { name = "FinishLine" } : null;
            if (lineMaterial != null) lineMaterial.SetFloat("_Lit", 1f);
            var lr = line.AddComponent<MeshRenderer>();
            lr.sharedMaterial = lineMaterial;
            lr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            leftCollider = Post("Post L"); rightCollider = Post("Post R");
            root.SetActive(false);
        }

        BoxCollider Post(string name)
        {
            var p = new GameObject(name) { layer = RallyLayers.Buildings };
            p.transform.SetParent(root.transform, false);
            return p.AddComponent<BoxCollider>();
        }

        /// <summary>Place (or move) the gate; rebuilds the meshes only when something moved by more than 2 cm.</summary>
        public void Refresh(float2 xz, float yaw, float roadHalf, IGround ground)
        {
            var l = Place(xz, yaw, roadHalf, ground);
            if (placed && Same(l, current) && root.activeSelf) return;
            current = l; placed = true;
            // Everything in world space, relative to the root at the road centre (the root sits under the world's
            // rebasing root, so it moves with the world).
            var origin = new Vector3(l.Centre.x, l.RoadY, l.Centre.y);
            root.transform.position = origin;
            root.transform.rotation = Quaternion.identity;
            BuildGate(l, origin);
            BuildLine(l, origin, ground);
            SetCollider(leftCollider, l, l.LeftPost, l.LeftGround, origin);
            SetCollider(rightCollider, l, l.RightPost, l.RightGround, origin);
            if (!root.activeSelf) root.SetActive(true);
            Physics.SyncTransforms();
        }

        public void Hide() { if (root.activeSelf) root.SetActive(false); placed = false; }

        static bool Same(in Layout a, in Layout b)
            => math.distance(a.Centre, b.Centre) < 0.02f && math.abs(a.RoadY - b.RoadY) < 0.02f && math.abs(a.PostOffset - b.PostOffset) < 0.02f
               && math.abs(a.LeftGround - b.LeftGround) < 0.02f && math.abs(a.RightGround - b.RightGround) < 0.02f && math.dot(a.Forward, b.Forward) > 0.9999f
               && math.abs(a.BannerBottom - b.BannerBottom) < 0.02f;

        /// <summary>Post foot (sunk 0.4 m into the ground beside the road, never above the road) and top (over the banner).</summary>
        static float PostBottom(in Layout l, float ground) => math.min(ground, l.RoadY) - 0.4f;
        static float PostTop(in Layout l) => l.BannerBottom + BannerHeight + 0.25f;

        void SetCollider(BoxCollider c, in Layout l, float2 at, float ground, Vector3 origin)
        {
            float y0 = PostBottom(l, ground), y1 = PostTop(l);
            c.transform.position = new Vector3(at.x, (y0 + y1) * 0.5f, at.y);
            c.transform.rotation = Quaternion.LookRotation(new Vector3(l.Forward.x, 0, l.Forward.y));
            c.size = new Vector3(PostSize, y1 - y0, PostSize);
        }

        static readonly Color32 White = new Color32(240, 240, 236, 0), Black = new Color32(22, 22, 24, 0), Red = new Color32(200, 40, 34, 0);

        readonly List<Vector3> v = new List<Vector3>(512);
        readonly List<Vector3> nrm = new List<Vector3>(512);
        readonly List<Color32> col = new List<Color32>(512);
        readonly List<int> tri = new List<int>(1024);
        readonly List<Vector2> uv = new List<Vector2>(256);

        void BuildGate(in Layout l, Vector3 origin)
        {
            v.Clear(); nrm.Clear(); col.Clear(); tri.Clear();
            byte inside = (byte)(l.InTunnel ? 230 : 0);   // Rally/Tunnel: alpha 0.9 = lamp-lit inside a tube
            var right = new Vector3(l.Right.x, 0, l.Right.y);
            var fwd = new Vector3(l.Forward.x, 0, l.Forward.y);
            // posts: boxes, red and white bands
            foreach (var (at, ground) in new[] { (l.LeftPost, l.LeftGround), (l.RightPost, l.RightGround) })
            {
                var c = new Vector3(at.x, 0, at.y) - new Vector3(origin.x, 0, origin.z);
                float y0 = PostBottom(l, ground) - origin.y, y1 = PostTop(l) - origin.y;
                float band = 0.6f;
                for (float y = y0; y < y1 - 1e-3f; y += band)
                {
                    float top = math.min(y + band, y1);
                    var colour = ((int)math.floor((y - y0) / band) & 1) == 0 ? White : Red;
                    colour.a = inside;
                    Box(c + Vector3.up * y, right * (PostSize * 0.5f), fwd * (PostSize * 0.5f), top - y, colour);
                }
            }
            // banner: checks on both faces, between the posts
            float span = l.PostOffset * 2f;
            int cols = math.max(2, (int)math.round(span / Check));
            int rowsN = math.max(1, (int)math.round(BannerHeight / Check));
            float cw = span / cols, ch = BannerHeight / rowsN;
            var left = new Vector3(l.LeftPost.x - origin.x, 0, l.LeftPost.y - origin.z);
            float yb = l.BannerBottom - origin.y;
            for (int face = 0; face < 2; face++)
            {
                var n = face == 0 ? -fwd : fwd;                       // the side facing the approaching car first
                var off = n * 0.06f;
                for (int r = 0; r < rowsN; r++)
                    for (int k = 0; k < cols; k++)
                    {
                        var colour = ((r + k) & 1) == 0 ? Black : White;
                        colour.a = inside;
                        var a = left + right * (k * cw) + Vector3.up * (yb + r * ch) + off;
                        Quad(a, a + right * cw, a + right * cw + Vector3.up * ch, a + Vector3.up * ch, n, colour);
                    }
            }
            gateMesh.Clear();
            gateMesh.SetVertices(v); gateMesh.SetNormals(nrm); gateMesh.SetColors(col); gateMesh.SetTriangles(tri, 0);
            gateMesh.RecalculateBounds();
        }

        /// <summary>A checkered strip across the drawn carriageway, each vertex on the road (camber) a little above it.</summary>
        void BuildLine(in Layout l, Vector3 origin, IGround ground)
        {
            v.Clear(); nrm.Clear(); col.Clear(); tri.Clear(); uv.Clear();
            int cols = math.max(2, (int)math.round(l.RoadHalf * 2f / LineCheck));
            float cw = l.RoadHalf * 2f / cols;
            int rowsN = (int)math.round(LineDepth / LineCheck);
            var right = l.Right;
            float inside = l.InTunnel ? 1f : 0f;
            for (int r = 0; r <= rowsN; r++)
                for (int k = 0; k <= cols; k++)
                {
                    var p = l.Centre + right * (-l.RoadHalf + k * cw) + l.Forward * (r * LineCheck - LineDepth * 0.5f);
                    v.Add(new Vector3(p.x - origin.x, ground.HeightAt(p) + 0.03f - origin.y, p.y - origin.z));
                    nrm.Add(Vector3.up);
                    uv.Add(new Vector2(inside, 0));
                }
            // separate colours per check: unshared vertices would be cleaner, but a check is one colour, so duplicate per quad
            var verts = new List<Vector3>(v); v.Clear(); nrm.Clear(); var uvs = new List<Vector2>(uv); uv.Clear();
            for (int r = 0; r < rowsN; r++)
                for (int k = 0; k < cols; k++)
                {
                    int i0 = r * (cols + 1) + k;
                    var colour = ((r + k) & 1) == 0 ? new Color32(245, 245, 245, 255) : new Color32(18, 18, 18, 255);
                    int b = v.Count;
                    v.Add(verts[i0]); v.Add(verts[i0 + 1]); v.Add(verts[i0 + cols + 2]); v.Add(verts[i0 + cols + 1]);
                    for (int q = 0; q < 4; q++) { nrm.Add(Vector3.up); col.Add(colour); uv.Add(uvs[i0]); }
                    tri.Add(b); tri.Add(b + 2); tri.Add(b + 1); tri.Add(b); tri.Add(b + 3); tri.Add(b + 2);
                }
            lineMesh.Clear();
            lineMesh.SetVertices(v); lineMesh.SetNormals(nrm); lineMesh.SetColors(col); lineMesh.SetUVs(0, uv); lineMesh.SetTriangles(tri, 0);
            lineMesh.RecalculateBounds();
        }

        void Quad(Vector3 a, Vector3 b, Vector3 c, Vector3 d, Vector3 n, Color32 colour)
        {
            int i = v.Count;
            v.Add(a); v.Add(b); v.Add(c); v.Add(d);
            for (int k = 0; k < 4; k++) { nrm.Add(n); col.Add(colour); }
            // wind so the face points along n
            var cross = Vector3.Cross(b - a, d - a);
            if (Vector3.Dot(cross, n) >= 0f) { tri.Add(i); tri.Add(i + 3); tri.Add(i + 1); tri.Add(i + 1); tri.Add(i + 3); tri.Add(i + 2); }
            else { tri.Add(i); tri.Add(i + 1); tri.Add(i + 3); tri.Add(i + 1); tri.Add(i + 2); tri.Add(i + 3); }
        }

        /// <summary>An axis-free box: base centre, half extents along two horizontal axes, height.</summary>
        void Box(Vector3 baseCentre, Vector3 hx, Vector3 hz, float height, Color32 colour)
        {
            if (height <= 0f) return;
            var up = Vector3.up * height;
            Vector3 c0 = baseCentre - hx - hz, c1 = baseCentre + hx - hz, c2 = baseCentre + hx + hz, c3 = baseCentre - hx + hz;
            var nx = hx.normalized; var nz = hz.normalized;
            Quad(c0, c1, c1 + up, c0 + up, -nz, colour);
            Quad(c1, c2, c2 + up, c1 + up, nx, colour);
            Quad(c2, c3, c3 + up, c2 + up, nz, colour);
            Quad(c3, c0, c0 + up, c3 + up, -nx, colour);
            Quad(c0 + up, c1 + up, c2 + up, c3 + up, Vector3.up, colour);
        }

        public void Dispose()
        {
            RallyObjects.Destroy(root);
            RallyObjects.Destroy(gateMesh);
            RallyObjects.Destroy(lineMesh);
            if (lineMaterial != null) RallyObjects.Destroy(lineMaterial);
        }
    }
}
