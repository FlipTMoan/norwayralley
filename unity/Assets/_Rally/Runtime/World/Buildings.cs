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
    /// <summary>A building's solid footprint for the car (buildings.js boxes): oriented box in EPSG:25833.</summary>
    public struct FootprintBox
    {
        public double2 Centre;
        public float Yaw, HalfLength, HalfWidth, Height;
    }

    /// <summary>One tile's houses: the combined mesh (vertex colours), the collision boxes and the pads to flatten in the carve.</summary>
    public sealed class BuildingSet
    {
        public Mesh Mesh;
        public readonly List<FootprintBox> Boxes = new List<FootprintBox>();
        /// <summary>Each house's footprint ring (counter-clockwise, metres from its box centre), same order as <see cref="Boxes"/>.</summary>
        public readonly List<float2[]> Rings = new List<float2[]>();
        public readonly List<CarveSegment> Pads = new List<CarveSegment>();
        public int Count;
    }

    /// <summary>
    /// Houses from OSM footprints (port of buildings.js, but extruding the real polygon instead of its
    /// oriented rectangle): walls up from a foundation sunk into the slope, a gabled roof whose ridge runs
    /// along the longest edge for footprints with four corners or fewer, a flat roof otherwise; eaves from
    /// `height` / `building:levels` else the family default; walls and roofs painted from a Norwegian
    /// palette by family (white/ochre/red houses, red barns, dark cabins, tar roofs). Every house also
    /// yields a pad (<see cref="CarveSegment"/> with A == B) that the carve flattens like terrain.js
    /// flattenPad, so houses stand on level ground, and a box for the car.
    /// </summary>
    public static class Buildings
    {
        public const int MaxPerTile = 220;   // buildings.js MAX_PER_CHUNK

        sealed class Family { public float Eaves, Pitch; public uint[] Walls, Roofs; }
        /// <summary>buildings.js FAMILIES: eaves height, roof pitch (rise / half-width), wall palette, roof palette.</summary>
        static readonly Dictionary<string, Family> Families = new Dictionary<string, Family>
        {
            { "house", new Family { Eaves = 3.4f, Pitch = 0.75f, Walls = new uint[] { 0xe9e6dc, 0xf1efe6, 0xd9b35a, 0xa33a2c, 0x8d9398, 0xe5cf7a, 0x5c6b63 }, Roofs = new uint[] { 0x3a3d40, 0x25282a, 0x7a3b2e, 0x4a4e52 } } },
            { "cabin", new Family { Eaves = 2.6f, Pitch = 0.8f, Walls = new uint[] { 0x6b4a33, 0x8a5a3c, 0xa33a2c, 0x4f3b2a }, Roofs = new uint[] { 0x2d3a2e, 0x3a3d40, 0x5a4a3a } } },
            { "barn", new Family { Eaves = 4.6f, Pitch = 0.7f, Walls = new uint[] { 0x9a2f23, 0xa33a2c, 0x8a2a20, 0x6e6a60 }, Roofs = new uint[] { 0x3a3d40, 0x4a4e52, 0x25282a } } },
            { "shed", new Family { Eaves = 2.5f, Pitch = 0.5f, Walls = new uint[] { 0x7d7467, 0x9a2f23, 0x5f6a5c, 0xcfc9b8 }, Roofs = new uint[] { 0x3a3d40, 0x2a2d30 } } },
            { "boathouse", new Family { Eaves = 2.8f, Pitch = 0.8f, Walls = new uint[] { 0x9a2f23, 0x6b4a33, 0x8d9398 }, Roofs = new uint[] { 0x3a3d40, 0x2a2d30 } } },
            { "church", new Family { Eaves = 6.5f, Pitch = 1.0f, Walls = new uint[] { 0xf1efe6, 0xe9e6dc, 0x9a2f23 }, Roofs = new uint[] { 0x2a2d30, 0x3a3d40 } } },
            { "big", new Family { Eaves = 6.5f, Pitch = 0.22f, Walls = new uint[] { 0xb9b4a6, 0x9fa6a8, 0xd8d2c2, 0x6f7a7c, 0xc9b79a }, Roofs = new uint[] { 0x4a4e52, 0x3a3d40, 0x5a5e62 } } },
            { "block", new Family { Eaves = 9.0f, Pitch = 0.18f, Walls = new uint[] { 0xd8d2c2, 0xc8c2b2, 0xb59a7a, 0x9fa6a8 }, Roofs = new uint[] { 0x3a3d40, 0x4a4e52 } } },
        };
        static readonly HashSet<string> ChurchTags = new HashSet<string> { "church", "chapel", "cathedral" };
        static readonly HashSet<string> BarnTags = new HashSet<string> { "barn", "farm_auxiliary", "cowshed", "stable", "sty", "agricultural", "silo", "greenhouse" };
        static readonly HashSet<string> ShedTags = new HashSet<string> { "garage", "garages", "shed", "roof", "carport", "hut", "service", "outbuilding", "storage_tank", "transformer_tower" };
        static readonly HashSet<string> CabinTags = new HashSet<string> { "cabin", "bungalow" };
        static readonly HashSet<string> BlockTags = new HashSet<string> { "apartments", "dormitory", "hotel", "hospital", "school", "university", "college", "civic", "public", "office" };
        static readonly HashSet<string> BigTags = new HashSet<string> { "industrial", "warehouse", "commercial", "retail", "supermarket", "factory", "hangar", "manufacture", "sports_hall", "kindergarten" };
        static readonly HashSet<string> HouseTags = new HashSet<string> { "house", "detached", "residential", "semidetached_house", "terrace", "farm", "static_caravan" };

        /// <summary>buildings.js familyFor.</summary>
        public static string FamilyFor(Dictionary<string, string> tags, float length, float width)
        {
            string b = tags != null && tags.TryGetValue("building", out var bv) ? bv.ToLowerInvariant() : "yes";
            float area = length * width;
            if (ChurchTags.Contains(b) || (tags != null && tags.TryGetValue("amenity", out var am) && am == "place_of_worship")) return "church";
            if (BarnTags.Contains(b)) return "barn";
            if (ShedTags.Contains(b)) return "shed";
            if (b == "boathouse") return "boathouse";
            if (CabinTags.Contains(b)) return "cabin";
            if (BlockTags.Contains(b)) return "block";
            if (BigTags.Contains(b)) return "big";
            if (HouseTags.Contains(b)) return area > 320 ? "block" : "house";
            if (area < 40) return "shed";
            if (area > 600) return "big";
            if (area > 260) return "barn";
            return "house";
        }

        /// <summary>buildings.js heightFor: tagged height × 0.8 (OSM heights include the roof), levels × 2.9 m, else the family's eaves; 40 m cap.</summary>
        public static float HeightFor(Dictionary<string, string> tags, string family)
        {
            if (tags != null)
            {
                if (tags.TryGetValue("height", out var hs) && TryParse(hs, out var h) && h > 1.5f) return math.min(h * 0.8f, 40f);
                if (tags.TryGetValue("building:levels", out var ls) && TryParse(ls, out var l) && l > 0) return math.min(l * 2.9f, 40f);
            }
            return Families[family].Eaves;
        }

        static bool TryParse(string s, out float v)
        {
            // "12 m", "3.5" — take the leading number.
            int end = 0;
            while (end < s.Length && (char.IsDigit(s[end]) || s[end] == '.' || s[end] == '-')) end++;
            return float.TryParse(s.Substring(0, end), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out v);
        }

        [System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)]
        struct Vertex { public float3 Pos; public float3 Normal; public Color32 Color; }

        sealed class Builder
        {
            public readonly List<Vertex> Verts = new List<Vertex>(4096);
            public readonly List<int> Idx = new List<int>(8192);
            /// <summary>A flat face from a ring (ear-clipped), winding fixed so the normal points along `wantNormal`.</summary>
            public void Face(List<float3> ring, float3 wantNormal, Color32 color, List<float2> scratch2, List<int> scratchTris)
            {
                if (ring.Count < 3) return;
                var n = math.normalize(math.cross(ring[1] - ring[0], ring[2] - ring[0]));
                if (math.any(math.isnan(n))) return;
                if (math.dot(n, wantNormal) < 0) n = -n;
                scratch2.Clear(); scratchTris.Clear();
                // Project onto the face plane for the ear clipper: drop the axis the normal is most along.
                int drop = math.abs(n.y) >= math.max(math.abs(n.x), math.abs(n.z)) ? 1 : math.abs(n.x) >= math.abs(n.z) ? 0 : 2;
                foreach (var p in ring) scratch2.Add(drop == 1 ? p.xz : drop == 0 ? p.yz : p.xy);
                Geometry2D.EarClip(scratch2, scratchTris);
                int b = Verts.Count;
                foreach (var p in ring) Verts.Add(new Vertex { Pos = p, Normal = n, Color = color });
                for (int t = 0; t < scratchTris.Count; t += 3)
                {
                    int i0 = b + scratchTris[t], i1 = b + scratchTris[t + 1], i2 = b + scratchTris[t + 2];
                    var tn = math.cross(Verts[i1].Pos - Verts[i0].Pos, Verts[i2].Pos - Verts[i0].Pos);
                    // Unity draws a triangle's front where cross(v1 − v0, v2 − v0) points (its built-in quad: {0,2,1}, normal −z), and
                    // the house material culls back faces: wind every triangle so that cross points along n. The old test was
                    // inverted, so every house showed only the insides of its far walls (2026-11-22).
                    if (math.dot(tn, n) > 0) { Idx.Add(i0); Idx.Add(i1); Idx.Add(i2); } else { Idx.Add(i0); Idx.Add(i2); Idx.Add(i1); }
                }
            }
        }

        /// <summary>
        /// Build a tile's houses in tile-local metres. <paramref name="ground"/> samples the natural ground,
        /// <paramref name="slope"/> its gradient; houses within 8 m of a road, in the fjord or on a cliff are skipped (buildings.js).
        /// </summary>
        public static BuildingSet Build(Features features, TileKey key, Func<Utm33, float> ground, Func<Utm33, float> slope, IRoadQuery roads, ulong seed)
        {
            var set = new BuildingSet();
            if (features == null || features.Buildings.Count == 0) return set;
            var origin = key.Origin;
            var rng = new RallyRandom(seed);
            var b = new Builder();
            var ring = new List<float2>(32); var face = new List<float3>(32); var scratch2 = new List<float2>(32); var scratchTris = new List<int>(64);
            foreach (var poly in features.Buildings)
            {
                if (set.Count >= MaxPerTile) break;
                if (poly.Polygon == null || poly.Polygon.Count < 3) continue;
                ring.Clear();
                foreach (var p in poly.Polygon) ring.Add(new float2((float)(p.E - origin.E), (float)(p.N - origin.N)));
                if (math.all(ring[0] == ring[ring.Count - 1])) ring.RemoveAt(ring.Count - 1);
                if (ring.Count < 3) continue;
                if (Geometry2D.SignedArea2(ring) < 0) ring.Reverse();   // counter-clockwise in the E/N plane
                var c = Geometry2D.Centroid(ring);
                if (c.x < 0 || c.x >= key.SizeM || c.y < 0 || c.y >= key.SizeM) continue;   // the tile holding the centroid owns the house
                // Oriented box: axis along the longest edge (buildings.js orientedRectangle, cheaper).
                int longest = 0; float longestLen = 0;
                for (int i = 0; i < ring.Count; i++) { float l = math.distance(ring[i], ring[(i + 1) % ring.Count]); if (l > longestLen) { longestLen = l; longest = i; } }
                float2 u = math.normalize(ring[(longest + 1) % ring.Count] - ring[longest]), v = new float2(-u.y, u.x);
                float umin = float.MaxValue, umax = float.MinValue, vmin = float.MaxValue, vmax = float.MinValue;
                foreach (var p in ring) { float pu = math.dot(p - c, u), pv = math.dot(p - c, v); umin = math.min(umin, pu); umax = math.max(umax, pu); vmin = math.min(vmin, pv); vmax = math.max(vmax, pv); }
                float length = math.min(umax - umin, 90f), width = math.min(vmax - vmin, 60f);
                if (length < 2f || width < 1.5f) continue;
                var cUtm = origin + (double2)c;
                if (roads != null && roads.Nearest(cUtm, 24, out var hit) && hit.Distance < 8) continue;   // keep the road clear
                float h = ground(cUtm);
                if (h < 0.8f) continue;                                   // in the fjord
                float s = slope(cUtm);
                if (s > 0.6f) continue;                                   // a cliff, not a plot
                string family = FamilyFor(poly.Tags, length, width);
                var fam = Families[family];
                float eaves = HeightFor(poly.Tags, family);
                float rise = math.clamp(width * 0.5f * fam.Pitch, 0.6f, 6.5f);
                float sink = 0.4f + s * math.max(length, width) * 0.5f;   // foundations reach the downhill ground
                var wall = Hex(fam.Walls[rng.Range(0, fam.Walls.Length)]);
                var roof = Hex(fam.Roofs[rng.Range(0, fam.Roofs.Length)]);
                float y0 = h - sink, y1 = h + eaves;
                // Walls: one quad per edge, normal outward (the ring is CCW so outward = (dy, -dx)).
                for (int i = 0; i < ring.Count; i++)
                {
                    float2 a = ring[i], d = ring[(i + 1) % ring.Count];
                    float2 e = d - a; float2 outward = math.normalize(new float2(e.y, -e.x));
                    face.Clear();
                    face.Add(new float3(a.x, y0, a.y)); face.Add(new float3(d.x, y0, d.y)); face.Add(new float3(d.x, y1, d.y)); face.Add(new float3(a.x, y1, a.y));
                    b.Face(face, new float3(outward.x, 0, outward.y), wall, scratch2, scratchTris);
                }
                if (ring.Count == 4)
                {
                    // Gable: ridge from the midpoint of one short edge to the other, raised by `rise`.
                    int e0 = longest, e1 = (longest + 1) % 4, e2 = (longest + 2) % 4, e3 = (longest + 3) % 4;
                    float2 m1 = (ring[e1] + ring[e2]) / 2, m3 = (ring[e3] + ring[e0]) / 2;
                    var r1 = new float3(m1.x, y1 + rise, m1.y); var r2 = new float3(m3.x, y1 + rise, m3.y);
                    float3 P(int i) => new float3(ring[i].x, y1, ring[i].y);
                    face.Clear(); face.Add(P(e0)); face.Add(P(e1)); face.Add(r1); face.Add(r2);
                    b.Face(face, new float3(0, 1, 0), roof, scratch2, scratchTris);
                    face.Clear(); face.Add(P(e2)); face.Add(P(e3)); face.Add(r2); face.Add(r1);
                    b.Face(face, new float3(0, 1, 0), roof, scratch2, scratchTris);
                    float2 g1 = math.normalize(new float2(ring[e2].y - ring[e1].y, -(ring[e2].x - ring[e1].x)));
                    face.Clear(); face.Add(P(e1)); face.Add(P(e2)); face.Add(r1);
                    b.Face(face, new float3(g1.x, 0, g1.y), wall, scratch2, scratchTris);
                    float2 g3 = math.normalize(new float2(ring[e0].y - ring[e3].y, -(ring[e0].x - ring[e3].x)));
                    face.Clear(); face.Add(P(e3)); face.Add(P(e0)); face.Add(r2);
                    b.Face(face, new float3(g3.x, 0, g3.y), wall, scratch2, scratchTris);
                }
                else if (ring.Count == 3)
                {
                    face.Clear(); foreach (var p in ring) face.Add(new float3(p.x, y1, p.y));
                    b.Face(face, new float3(0, 1, 0), roof, scratch2, scratchTris);
                }
                else
                {
                    // Flat roof with a low parapet lip (0.3 m) so big buildings read as blocks, not slabs.
                    face.Clear(); foreach (var p in ring) face.Add(new float3(p.x, y1 + 0.3f, p.y));
                    b.Face(face, new float3(0, 1, 0), roof, scratch2, scratchTris);
                }
                set.Boxes.Add(new FootprintBox { Centre = new double2(cUtm.E, cUtm.N), Yaw = math.atan2(u.x, u.y), HalfLength = length / 2, HalfWidth = width / 2, Height = eaves + rise });
                var rel = new float2[ring.Count];
                for (int i = 0; i < ring.Count; i++) rel[i] = ring[i] - c;
                set.Rings.Add(rel);
                set.Pads.Add(new CarveSegment { A = c, B = c, Ha = h, Hb = h, HalfWidth = math.max(length, width) / 2 + 1f, Shoulder = 6f });
                set.Count++;
            }
            if (b.Idx.Count > 0) set.Mesh = ToMesh(b);
            return set;
        }

        static Color32 Hex(uint rgb) => new Color32((byte)(rgb >> 16), (byte)(rgb >> 8), (byte)rgb, 255);

        static Mesh ToMesh(Builder b)
        {
            var data = Mesh.AllocateWritableMeshData(1);
            var md = data[0];
            md.SetVertexBufferParams(b.Verts.Count,
                new VertexAttributeDescriptor(VertexAttribute.Position, VertexAttributeFormat.Float32, 3),
                new VertexAttributeDescriptor(VertexAttribute.Normal, VertexAttributeFormat.Float32, 3),
                new VertexAttributeDescriptor(VertexAttribute.Color, VertexAttributeFormat.UNorm8, 4));
            var vb = md.GetVertexData<Vertex>();
            for (int i = 0; i < b.Verts.Count; i++) vb[i] = b.Verts[i];
            md.SetIndexBufferParams(b.Idx.Count, IndexFormat.UInt32);
            var ib = md.GetIndexData<uint>();
            for (int i = 0; i < b.Idx.Count; i++) ib[i] = (uint)b.Idx[i];
            md.subMeshCount = 1;
            md.SetSubMesh(0, new SubMeshDescriptor(0, b.Idx.Count), MeshUpdateFlags.DontRecalculateBounds);
            var mesh = new Mesh { name = "Buildings" };
            Mesh.ApplyAndDisposeWritableMeshData(data, mesh);
            mesh.RecalculateBounds();
            return mesh;
        }

        /// <summary>Renderer + static MeshCollider on layer "Buildings" under the tile root (placed at the tile origin).</summary>
        public static GameObject CreateTileObject(BuildingSet set, Material material, Transform parent, float3 worldOrigin)
        {
            if (set.Mesh == null) return null;
            var go = new GameObject("Buildings") { layer = RallyLayers.Buildings, isStatic = true };
            go.transform.SetParent(parent, false);
            go.transform.position = worldOrigin;
            go.AddComponent<MeshFilter>().sharedMesh = set.Mesh;
            var mr = go.AddComponent<MeshRenderer>();
            mr.sharedMaterial = material; mr.shadowCastingMode = ShadowCastingMode.On; mr.receiveShadows = true;
            go.AddComponent<MeshCollider>().sharedMesh = set.Mesh;
            return go;
        }
    }
}
