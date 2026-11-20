using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Roads
{
    /// <summary>
    /// The visible tunnels of a tile's runs (<see cref="Tunnels"/>): per tube segment the inside — a floor strip from the
    /// ribbon's shoulder to the wall, the walls (<see cref="RoadConstants.TunnelWall"/>) and an elliptic roof arch — and the
    /// outside of the shell (seen where the rock over it is thin and the terrain is cut away: TileWorld.UpdateTunnelHoles), lamps
    /// on the crown every <see cref="LampSpacing"/> m, and at each portal a 2.5 m concrete collar with a portal face. An avalanche
    /// gallery gets a flat roof on a wall on the mountain side and pillars on the valley side. One vertex-coloured mesh for the
    /// Rally/Tunnel shader (alpha: how far inside, <see cref="Tunnels.InsideWeight"/>; 1 = lamp), in metres relative to the tile
    /// origin, and a collider mesh of the solid parts (walls, portal faces, gallery wall and pillars) for layer Buildings.
    /// The road surface inside is the ordinary ribbon (RibbonMesh), lit by the lamps through its UV1.y.
    /// </summary>
    public static class TunnelMesh
    {
        public const float LampSpacing = 24f, CollarLength = 2.5f, FaceWidth = 2.5f, FaceAbove = 1.5f, PillarSpacing = 6f;
        const int ArchSteps = 10;
        static readonly Color32 Shotcrete = new Color32(0x86, 0x84, 0x7e, 255), ArchColour = new Color32(0x6e, 0x6c, 0x68, 255),
            FloorStrip = new Color32(0x5c, 0x5a, 0x56, 255), Concrete = new Color32(0x74, 0x72, 0x6d, 255), Lamp = new Color32(0xff, 0xec, 0xc4, 255),
            Gallery = new Color32(0x62, 0x60, 0x5c, 255);

        /// <summary>
        /// The tube's inside cross-section, from the centre of the floor over the right wall, the arch and the left wall back to
        /// the centre: (lateral, height above the graded road). The floor runs under the ribbon (a few cm below its edge), so the
        /// ribbon's ragged shoulder edge shows concrete through its gaps, not the sky under the mountain.
        /// </summary>
        static List<float2> Profile(float half)
        {
            float W = RoadConstants.TunnelHalf(half), fl = RoadConstants.RoadLift + RoadConstants.CarveLift - 0.02f;
            var p = new List<float2> { new float2(0, fl), new float2(W, fl) };
            for (int k = 0; k <= ArchSteps; k++)
            {
                float th = math.PI * k / ArchSteps;
                p.Add(new float2(W * math.cos(th), RoadConstants.TunnelWall + RoadConstants.TunnelArch * W * math.sin(th)));
            }
            p.Add(new float2(-W, fl)); p.Add(new float2(0, fl));
            return p;
        }

        static void Quad(BridgeMesh.Buf b, float3 a, float3 bb, float3 c, float3 d, float3 outward, Color32 ca, Color32 cc)
        {
            // a, bb at one cross-section (colour ca), c, d at the next (colour cc); winding chosen so the face looks along outward.
            float3 n = math.normalizesafe(math.cross(bb - a, c - a));
            bool flip = math.dot(n, outward) < 0;
            if (flip) n = -n;
            int k = b.V.Count;
            b.V.Add(new BridgeMesh.Vertex { Pos = a, Normal = n, Color = ca }); b.V.Add(new BridgeMesh.Vertex { Pos = bb, Normal = n, Color = ca });
            b.V.Add(new BridgeMesh.Vertex { Pos = c, Normal = n, Color = cc }); b.V.Add(new BridgeMesh.Vertex { Pos = d, Normal = n, Color = cc });
            if (!flip) { b.I.Add(k); b.I.Add(k + 1); b.I.Add(k + 2); b.I.Add(k); b.I.Add(k + 2); b.I.Add(k + 3); }
            else { b.I.Add(k); b.I.Add(k + 2); b.I.Add(k + 1); b.I.Add(k); b.I.Add(k + 3); b.I.Add(k + 2); }
        }

        static Color32 WithAlpha(Color32 c, float a) { c.a = (byte)math.round(math.saturate(a) * 255); return c; }

        /// <summary>
        /// One piece of tube between two cross-sections (centre <paramref name="pa"/>/<paramref name="pb"/> on the graded road,
        /// left normals <paramref name="na"/>/<paramref name="nb"/>): inside faces with alpha <paramref name="wa"/>/<paramref name="wb"/>,
        /// the shell's outside, and two wall boxes in <paramref name="solid"/>.
        /// </summary>
        static void Tube(BridgeMesh.Buf draw, BridgeMesh.Buf solid, List<float2> prof, float half, float3 pa, float3 pb, float3 na, float3 nb, float wa, float wb)
        {
            float W = RoadConstants.TunnelHalf(half), th = RoadConstants.TunnelWallThick;
            float3 up = new float3(0, 1, 0);
            float3 axisA = pa + up * RoadConstants.TunnelWall, axisB = pb + up * RoadConstants.TunnelWall;
            for (int j = 0; j + 1 < prof.Count; j++)
            {
                float2 u = prof[j], v = prof[j + 1];
                float3 a = pa + na * -u.x + up * u.y, b = pa + na * -v.x + up * v.y, c = pb + nb * -v.x + up * v.y, d = pb + nb * -u.x + up * u.y;
                var col = j == 0 || j == prof.Count - 2 ? FloorStrip : j == 1 || j == prof.Count - 3 ? Shotcrete : ArchColour;
                float3 mid = (a + b + c + d) / 4;
                Quad(draw, a, b, c, d, (axisA + axisB) / 2 - mid, WithAlpha(col, wa), WithAlpha(col, wb));
            }
            // The shell's outside: walls from a metre and a half down and the arch, WallThick out.
            var outer = new List<float2> { new float2(W + th, RoadConstants.RoadLift - 1.5f) };
            for (int k = 0; k <= ArchSteps; k++)
            {
                float t = math.PI * k / ArchSteps, R = W + th;
                outer.Add(new float2(R * math.cos(t), RoadConstants.TunnelWall + (RoadConstants.TunnelArch * W + th) * math.sin(t)));
            }
            outer.Add(new float2(-(W + th), RoadConstants.RoadLift - 1.5f));
            for (int j = 0; j + 1 < outer.Count; j++)
            {
                float2 u = outer[j], v = outer[j + 1];
                float3 a = pa + na * -u.x + up * u.y, b = pa + na * -v.x + up * v.y, c = pb + nb * -v.x + up * v.y, d = pb + nb * -u.x + up * u.y;
                float3 mid = (a + b + c + d) / 4;
                Quad(draw, a, b, c, d, mid - (axisA + axisB) / 2, Concrete, Concrete);
            }
            // Solid walls for the car: from half a metre under the floor to above a car's roof, the wall's thickness.
            float3 m = (pa + pb) / 2, dir = pb - pa;
            float len = math.length(dir.xz);
            if (len < 1e-3f) return;
            float2 t2 = dir.xz / len;
            float3 n = math.normalizesafe(na + nb);
            float y0 = m.y + RoadConstants.RoadLift - 0.5f, y1 = m.y + RoadConstants.TunnelWall;
            for (int side = -1; side <= 1; side += 2)
            {
                var c = m + n * side * (W + th / 2);
                solid.Box(new float3(c.x, (y0 + y1) / 2, c.z), t2, len / 2 + 0.3f, th / 2, (y1 - y0) / 2, Concrete, Concrete);
            }
        }

        /// <summary>
        /// Build the drawn mesh (null without tunnels or galleries in the tile) and the collider mesh (<paramref name="collider"/>)
        /// for a tile's runs. <paramref name="ground"/> (natural ground) picks a gallery's mountain side. With <paramref name="own"/>
        /// a segment is built by the tile that holds its middle, a portal by the tile that holds it (RibbonMesh.Owns).
        /// </summary>
        public static Mesh Build(List<RoadPolyline> lines, Utm33 origin, Func<Utm33, float> ground, out Mesh collider, Bounds25833? own = null)
        {
            var draw = new BridgeMesh.Buf(); var solid = new BridgeMesh.Buf();
            var o = new double2(origin.E, origin.N);
            float3 up = new float3(0, 1, 0);
            foreach (var line in lines)
            {
                var s = line.Samples;
                if (s == null || s.Count < 2) continue;
                bool any = false;
                foreach (var q in s) if (q.Tunnel || q.Gallery) { any = true; break; }
                if (!any) continue;
                float half = line.Lanes.Half, W = RoadConstants.TunnelHalf(half), th = RoadConstants.TunnelWallThick;
                var prof = Profile(half);
                float3 P(int i) => new float3((float)(s[i].P.x - o.x), s[i].RoadY, (float)(s[i].P.y - o.y));
                float3 Left(int i)
                {
                    double2 d = s[math.min(s.Count - 1, i + 1)].P - s[math.max(0, i - 1)].P;
                    var t = math.normalizesafe((float2)d, new float2(0, 1));
                    return new float3(-t.y, 0, t.x);
                }
                for (int i = 0; i + 1 < s.Count; i++)
                {
                    if (!RibbonMesh.Owns(own, (s[i].P + s[i + 1].P) * 0.5)) continue;
                    float3 pa = P(i), pb = P(i + 1), na = Left(i), nb = Left(i + 1);
                    if (s[i].Tunnel && s[i + 1].Tunnel)
                    {
                        Tube(draw, solid, prof, half, pa, pb, na, nb, Tunnels.InsideWeight(s[i], line.WayLength), Tunnels.InsideWeight(s[i + 1], line.WayLength));
                        // A lamp where the distance along the way passes a multiple of LampSpacing.
                        if (math.floor(s[i].S / LampSpacing) != math.floor(s[i + 1].S / LampSpacing))
                        {
                            float3 c = (pa + pb) / 2 + up * (RoadConstants.TunnelCrown(half) - 0.08f);
                            float2 t2 = math.normalizesafe((pb - pa).xz, new float2(0, 1));
                            draw.Box(c, t2, 0.6f, 0.18f, 0.06f, Lamp, Lamp);
                        }
                    }
                    else if (s[i].Gallery && s[i + 1].Gallery)
                    {
                        float roof = RoadConstants.TunnelWall + 0.3f;
                        float3 m = (pa + pb) / 2, n = math.normalizesafe(na + nb);
                        float2 t2 = math.normalizesafe((pb - pa).xz, new float2(0, 1));
                        float len = math.length((pb - pa).xz);
                        draw.Box(m + up * roof, t2, len / 2 + 0.02f, W + 0.6f, 0.3f, Gallery, Gallery);
                        // The mountain side has the higher ground a few metres out: a wall there, pillars on the valley side.
                        Utm33 U(float3 q) => new Utm33(origin.E + q.x, origin.N + q.z);
                        float mside = ground(U(m + n * (W + 5))) >= ground(U(m - n * (W + 5))) ? 1f : -1f;
                        float y0 = m.y + RoadConstants.RoadLift - 0.8f, y1 = m.y + roof - 0.3f;
                        var wc = m + n * mside * (W + th / 2);
                        draw.Box(new float3(wc.x, (y0 + y1) / 2, wc.z), t2, len / 2 + 0.02f, th / 2, (y1 - y0) / 2, Gallery, Gallery);
                        solid.Box(new float3(wc.x, (y0 + y1) / 2, wc.z), t2, len / 2 + 0.3f, th / 2, (y1 - y0) / 2, Concrete, Concrete);
                        if (math.floor(s[i].S / PillarSpacing) != math.floor(s[i + 1].S / PillarSpacing))
                        {
                            var pc = m - n * mside * (W + 0.3f);
                            draw.Box(new float3(pc.x, (y0 + y1) / 2, pc.z), t2, 0.3f, 0.3f, (y1 - y0) / 2, Gallery, Gallery);
                            solid.Box(new float3(pc.x, (y0 + y1) / 2, pc.z), t2, 0.3f, 0.3f, (y1 - y0) / 2, Concrete, Concrete);
                        }
                    }
                }
                // Portals: a collar out of the rock and a face around the opening, facing away from the tube.
                for (int i = 0; i < s.Count; i++)
                {
                    if (!s[i].Portal || !s[i].Tunnel || !RibbonMesh.Owns(own, s[i].P)) continue;
                    bool inward = i + 1 < s.Count && s[i + 1].Tunnel;
                    float3 n = Left(i), t = new float3(n.z, 0, -n.x) * (inward ? -1 : 1);   // t: out of the tube
                    float3 pa = P(i), pb = pa + t * CollarLength;
                    Tube(draw, solid, prof, half, pa, pb, n, n, 0f, 0f);
                    float crown = RoadConstants.TunnelCrown(half), fl = RoadConstants.RoadLift + RoadConstants.CarveLift;
                    var axis = new float2(0, RoadConstants.TunnelWall);
                    float R = W + FaceWidth, top = crown + FaceAbove, bottom = fl - 1f;
                    // Each inner contour point (walls + arch) pairs with the point where the ray from the arch's axis through it meets the face's outline.
                    float2 OuterOf(float2 q)
                    {
                        float2 d = q - axis;
                        if (q.y <= RoadConstants.TunnelWall + 1e-3f) return new float2(math.sign(q.x) * R, q.y <= fl + 1e-3f ? bottom : q.y);
                        float sx = math.abs(d.x) > 1e-4f ? R / math.abs(d.x) : float.PositiveInfinity, sy = (top - axis.y) / math.max(1e-4f, d.y);
                        float k = math.min(sx, sy);
                        return axis + d * k;
                    }
                    for (int face = 0; face < 2; face++)
                    {
                        float3 c = pb - t * face;   // front (looking out) and back, a metre into the rock
                        float3 outward = face == 0 ? t : -t;
                        for (int j = 1; j + 2 < prof.Count; j++)
                        {
                            float2 u = prof[j], v = prof[j + 1], uo = OuterOf(u), vo = OuterOf(v);
                            float3 A(float2 q) => c + n * -q.x + up * q.y;
                            Quad(draw, A(u), A(v), A(vo), A(uo), outward, Concrete, Concrete);
                        }
                    }
                    // Top and sides of the face slab.
                    float3 F(float lat, float h, int back) => pb - t * back + n * -lat + up * h;
                    Quad(draw, F(R, top, 0), F(-R, top, 0), F(-R, top, 1), F(R, top, 1), up, Concrete, Concrete);
                    for (int side = -1; side <= 1; side += 2)
                    {
                        Quad(draw, F(side * R, bottom, 0), F(side * R, top, 0), F(side * R, top, 1), F(side * R, bottom, 1), -n * side, Concrete, Concrete);
                        var bc = pb - t * 0.5f + n * -side * (W + FaceWidth / 2) + up * ((bottom + top) / 2);
                        solid.Box(bc, t.xz, 0.5f, FaceWidth / 2, (top - bottom) / 2, Concrete, Concrete);
                    }
                }
            }
            collider = solid.V.Count > 0 ? BridgeMesh.ToMesh(solid, "TunnelSolids") : null;
            return draw.V.Count > 0 ? BridgeMesh.ToMesh(draw, "Tunnels") : null;
        }
    }
}
