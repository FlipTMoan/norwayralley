using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Track;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Gameplay
{
    /// <summary>
    /// The direction arrow lying on the road ahead of the car (it replaced the pace-note box's small HUD arrow): a flat,
    /// unlit, semi-transparent yellow arrow 15–30 m ahead (further at speed) that follows the route line — so it bends
    /// with a corner — and the drawn road's height, camber and slope, drawn over the ribbon with a depth offset
    /// (Rally/RoadMark). On a stage it follows the stage line from the car's distance along it; in free drive (no line)
    /// it walks along the road the car is on, in the direction the car faces. It fades within <see cref="FadeNear"/> m of
    /// the car, dims under a bridge deck or in water, and is gone after the finish.
    /// The shape (<see cref="Path"/>, <see cref="Build"/>) is plain data so tests can check it; heights are read every
    /// frame, so a road graded again under it is followed at once.
    /// </summary>
    public sealed class RoadArrow : IDisposable
    {
        /// <summary>Metres from the car to the arrow's tail at rest and at full distance; <see cref="AheadFor"/> in between.</summary>
        public const float Near = 15f, Far = 30f;
        public const float ShaftLength = 8f, HeadLength = 4.5f, ShaftHalf = 0.55f, HeadHalf = 1.5f;
        /// <summary>Height over the drawn road (the shader's depth offset does the rest).</summary>
        public const float Lift = 0.05f;
        /// <summary>Vertices nearer than this to the car are transparent (fading in over the next 6 m).</summary>
        public const float FadeNear = 8f;
        /// <summary>Path sample spacing (m).</summary>
        public const float Step = 1.5f;
        public static readonly Color32 Colour = new Color32(255, 206, 48, 255);
        public const float Alpha = 0.72f;

        /// <summary>Tail distance ahead for a speed (m/s): 15 m at rest, 30 m from about 30 m/s (108 km/h).</summary>
        public static float AheadFor(float speed) => math.clamp(Near + math.abs(speed) * 0.5f, Near, Far);

        /// <summary>
        /// The nearest road a chase camera <paramref name="back"/> m behind and <paramref name="up"/> m over the car sees over a car
        /// <paramref name="height"/> m tall, + 2 m (at most 40): behind the Ford Ranger (2 m) the road is hidden for ~30 m, so at rest
        /// the arrow lies further out for it; behind a 1.3 m coupé it changes nothing.
        /// </summary>
        public static float SeenOver(float height, float back, float up)
            => up - height < 0.2f ? Far + 10f : math.min(Far + 10f, back * height / (up - height) + 2f);

        /// <summary>
        /// The arrow's centre line: points <see cref="Step"/> apart from <paramref name="ahead"/> m ahead of the car over
        /// <paramref name="length"/> m, with the road's direction at each. A stage follows its line from <paramref name="carS"/>
        /// and stops at <paramref name="endS"/> (the finish); a free route walks along the nearest road from the car, keeping
        /// to roads that run on roughly the way it goes (a crossing road does not take it). Returns the number of points (0: none).
        /// </summary>
        public static int Path(IRoute route, float2 carXZ, float2 carForward, float carS, float endS, float ahead, float length,
            List<float2> points, List<float2> tangents)
        {
            points.Clear(); tangents.Clear();
            if (route == null) return 0;
            int n = (int)math.ceil(length / Step) + 1;
            if (!route.Free)
            {
                float s0 = carS + ahead;
                for (int i = 0; i < n; i++)
                {
                    float s = s0 + i * Step;
                    if (s > endS || s > route.Length) break;
                    var p = route.SampleAtDistance(s);
                    points.Add(p.XZ);
                    tangents.Add(new float2(math.sin(p.Yaw), math.cos(p.Yaw)));
                }
                return points.Count >= 3 ? points.Count : Clear(points, tangents);
            }
            var q = route.Nearest(carXZ, 30f);
            if (!q.Hit) return 0;
            float2 pos = q.Point, dir = math.dot(q.Tangent, carForward) >= 0f ? q.Tangent : -q.Tangent;
            float walked = 0f, end = ahead + (n - 1) * Step;
            while (walked < end - 1e-3f)
            {
                float step = math.min(Step, end - walked);
                if (walked < ahead && walked + step > ahead) step = ahead - walked;   // land exactly on the tail
                var next = pos + dir * step;
                var r = route.Nearest(next, 12f);
                if (!r.Hit) return Clear(points, tangents);   // the road ends (or is not loaded yet)
                var t = math.dot(r.Tangent, dir) >= 0f ? r.Tangent : -r.Tangent;
                // Onto the road only while it runs the way the arrow goes; across a junction it goes straight on.
                if (math.dot(t, dir) > 0.6f) { pos = r.Point; dir = t; } else pos = next;
                walked += step;
                if (walked >= ahead - 1e-3f) { points.Add(pos); tangents.Add(dir); }
            }
            return points.Count >= 3 ? points.Count : Clear(points, tangents);
        }

        static int Clear(List<float2> p, List<float2> t) { p.Clear(); t.Clear(); return 0; }

        /// <summary>
        /// Half width along the arrow at distance <paramref name="u"/> from the tail (total <paramref name="length"/>):
        /// the shaft, then the head from <see cref="HeadHalf"/> down to the tip.
        /// </summary>
        public static float HalfAt(float u, float length)
        {
            float headStart = length - HeadLength;
            return u < headStart ? ShaftHalf : HeadHalf * math.saturate((length - u) / HeadLength);
        }

        // ---- the drawn mesh ----

        readonly GameObject go;
        readonly Mesh mesh;
        readonly Material material;
        readonly List<float2> points = new List<float2>(32), tangents = new List<float2>(32);
        readonly List<Vector3> verts = new List<Vector3>(96);
        readonly List<Color32> colours = new List<Color32>(96);
        readonly List<Vector3> normals = new List<Vector3>(96);
        readonly List<Vector2> uvs = new List<Vector2>(96);
        readonly List<int> tris = new List<int>(256);
        float smoothedAhead = Near;

        /// <summary>True while an arrow is drawn (for tests and tools).</summary>
        public bool Visible { get; private set; }
        /// <summary>The drawn tail and tip (world), and the tip's direction: for tests and tools.</summary>
        public float3 Tail { get; private set; }
        public float3 Tip { get; private set; }
        public float2 TipDirection { get; private set; }
        /// <summary>The whole arrow's alpha factor of the last frame (fades under decks / in water; 0 hidden).</summary>
        public float Fade { get; private set; }

        public RoadArrow()
        {
            var shader = Resources.Load<Shader>("Marks/RoadMark");
            material = shader != null ? new Material(shader) { name = "RoadArrow" } : null;
            if (material != null) material.SetFloat("_Lit", 0f);
            mesh = new Mesh { name = "RoadArrow" };
            mesh.MarkDynamic();
            go = new GameObject("Road arrow");
            go.AddComponent<MeshFilter>().sharedMesh = mesh;
            var mr = go.AddComponent<MeshRenderer>();
            mr.sharedMaterial = material;
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            mr.receiveShadows = false;
            go.SetActive(false);
        }

        public void Hide()
        {
            Visible = false;
            if (go.activeSelf) go.SetActive(false);
        }

        /// <summary>
        /// Lay the arrow for this frame: <paramref name="carS"/> along a stage (ignored in free drive), the car's pose and speed,
        /// the finish distance (∞ without one), the nearest tail distance the camera sees (<see cref="SeenOver"/>). The ground answers the drawn road's height (layered: the car's own level
        /// first, so under an overpass it stays on the lower road and on a deck on the deck).
        /// </summary>
        public void Update(IRoute route, IGround ground, float3 carPos, float carYaw, float speed, float carS, float endS, float dt, float minAhead = 0f)
        {
            smoothedAhead = math.lerp(smoothedAhead, math.max(AheadFor(speed), minAhead), 1f - math.exp(-dt * 2f));
            var fwd = new float2(math.sin(carYaw), math.cos(carYaw));
            float length = ShaftLength + HeadLength;
            int n = Path(route, carPos.xz, fwd, carS, endS, smoothedAhead, length, points, tangents);
            if (n < 3) { Hide(); return; }
            Fade = Build(ground, carPos, points, tangents, verts, colours, normals, uvs, tris, out var tail, out var tip);
            if (Fade <= 0.01f) { Hide(); return; }
            Tail = tail; Tip = tip; TipDirection = tangents[n - 1];
            mesh.Clear();
            mesh.SetVertices(verts);
            mesh.SetColors(colours);
            mesh.SetNormals(normals);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(tris, 0, false);
            mesh.bounds = new Bounds(((Vector3)tail + (Vector3)tip) * 0.5f, Vector3.one * (length + 6f));
            if (!go.activeSelf) go.SetActive(true);
            Visible = true;
        }

        /// <summary>
        /// The arrow as a ribbon over the path: three vertices across (left, centre, right) at each station, each on the drawn
        /// road (+ <see cref="Lift"/>), the head's base doubled so the width steps out. Returns the arrow's fade factor.
        /// </summary>
        public static float Build(IGround ground, float3 carPos, List<float2> pts, List<float2> tans,
            List<Vector3> verts, List<Color32> colours, List<Vector3> normals, List<Vector2> uvs, List<int> tris, out float3 tail, out float3 tip)
        {
            verts.Clear(); colours.Clear(); normals.Clear(); uvs.Clear(); tris.Clear();
            var layered = ground as ILayeredGround;
            int n = pts.Count;
            float length = (n - 1) * Step;
            float headStart = length - HeadLength;
            float refY = carPos.y + 1f;
            tail = tip = default;
            float fade = 1f;
            int rows = 0;
            for (int i = 0; i < n; i++)
            {
                float u = i * Step;
                bool headBase = u >= headStart && (i == 0 || (i - 1) * Step < headStart);
                // the station where the head starts gets the shaft's width and the head's: two rows on the same spot
                for (int pass = headBase ? 0 : 1; pass < 2; pass++)
                {
                    float half = pass == 0 ? ShaftHalf : HalfAt(u, length);
                    var p = pts[i];
                    var right = new float2(tans[i].y, -tans[i].x);
                    float yc = Height(ground, layered, p, refY);
                    float yl = Height(ground, layered, p - right * half, refY);
                    float yr = Height(ground, layered, p + right * half, refY);
                    if (pass == 1) refY = yc + 1f;
                    float inside = 0f;
                    if (pass == 1 && layered != null && layered.TunnelAt(p, out _)) inside = 1f;
                    float a = Alpha * math.smoothstep(FadeNear, FadeNear + 6f, math.distance(p, carPos.xz));
                    var c = Colour; c.a = (byte)math.round(255f * a);
                    verts.Add(new Vector3(p.x - right.x * half, yl + Lift, p.y - right.y * half));
                    verts.Add(new Vector3(p.x, yc + Lift, p.y));
                    verts.Add(new Vector3(p.x + right.x * half, yr + Lift, p.y + right.y * half));
                    for (int k = 0; k < 3; k++) { colours.Add(c); normals.Add(Vector3.up); uvs.Add(new Vector2(inside, u)); }
                    if (rows > 0)
                    {
                        int b = verts.Count - 6;
                        // two quads (left, right) between the previous row and this one
                        tris.Add(b); tris.Add(b + 3); tris.Add(b + 1); tris.Add(b + 1); tris.Add(b + 3); tris.Add(b + 4);
                        tris.Add(b + 1); tris.Add(b + 4); tris.Add(b + 2); tris.Add(b + 2); tris.Add(b + 4); tris.Add(b + 5);
                    }
                    if (i == 0 && pass == 1) tail = new float3(p.x, yc, p.y);
                    if (i == n - 1 && pass == 1) tip = new float3(p.x, yc, p.y);
                    if (i == n / 2 && pass == 1) fade = Dimming(ground, layered, p, yc);
                    rows++;
                }
            }
            if (fade < 1f)
                for (int k = 0; k < colours.Count; k++) { var c = colours[k]; c.a = (byte)math.round(c.a * fade); colours[k] = c; }
            return fade;
        }

        /// <summary>The drawn road's height at a point for an asker at <paramref name="refY"/> (the layered ground's reference).</summary>
        static float Height(IGround ground, ILayeredGround layered, float2 p, float refY)
        {
            if (layered == null) return ground.HeightAt(p);
            float old = layered.ReferenceY;
            layered.ReferenceY = refY;
            float h = ground.HeightAt(p);
            layered.ReferenceY = old;
            return h;
        }

        /// <summary>Under a bridge deck (the top surface well above the arrow, not a tunnel roof) or in water: dimmed.</summary>
        static float Dimming(IGround ground, ILayeredGround layered, float2 p, float y)
        {
            float f = 1f;
            var w = ground.WaterAt(p);
            if (w.Depth > 0.05f && w.SurfaceY > y + Lift) f = 0.25f;
            if (layered != null && !layered.TunnelAt(p, out _) && Height(ground, layered, p, float.NaN) > y + 3f) f = math.min(f, 0.35f);
            return f;
        }

        public void Dispose()
        {
            RallyObjects.Destroy(go);
            RallyObjects.Destroy(mesh);
            if (material != null) RallyObjects.Destroy(material);
        }
    }
}
