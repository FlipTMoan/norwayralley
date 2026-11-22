using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// The street lights of the loaded coarse tiles (NVDB, placed by <see cref="LightPlacement"/>), as <see cref="SignLayer"/>
    /// does signs: every tile keeps its posts as data; tiles within <see cref="BuildRadius"/> of the car get one mesh
    /// (<see cref="LightMesh"/>, one tile per frame) and lose it beyond <see cref="DropRadius"/>. Masts within
    /// <see cref="ColliderRadius"/> get capsules from the <see cref="PropColliderPool"/> (layer Props: solid, damage), nearest
    /// first; <see cref="RefreshColliders"/> moves them at once when the car is placed, so it never spawns inside a mast.
    /// <see cref="Invalidate"/> rebuilds the meshes of tiles whose roads were graded again (the foot follows the new ground).
    /// </summary>
    public sealed class LightLayer : IDisposable
    {
        public const double BuildRadius = 1000, DropRadius = 1500;
        public const float ColliderRadius = 35f;

        sealed class TileLights
        {
            public TileKey Key;
            public List<LightPost> Posts;
            public GameObject Go;
            public Mesh Mesh;
            public readonly List<int> Handles = new List<int>();
        }

        readonly Transform parent;
        readonly PropColliderPool colliders;
        readonly Func<Utm33, float> ground;
        readonly Material material;
        readonly bool ownsMaterial;
        readonly Dictionary<TileKey, TileLights> tiles = new Dictionary<TileKey, TileLights>();
        float nextColliderUpdate;

        public LightLayer(Transform parent, PropColliderPool colliders, Func<Utm33, float> ground, Material material = null)
        {
            this.parent = parent; this.colliders = colliders; this.ground = ground;
            ownsMaterial = material == null;
            this.material = material != null ? material : new Material(Resources.Load<Shader>("Tunnel/Tunnel")) { name = "Lights" };
        }

        public int TileCount => tiles.Count;
        public int BuiltTiles { get { int n = 0; foreach (var t in tiles.Values) if (t.Go != null) n++; return n; } }
        public int PostCount { get { int n = 0; foreach (var t in tiles.Values) n += t.Posts.Count; return n; } }

        /// <summary>The feet (E, N) of the masts inside <paramref name="b"/> (the verge plants keep clear of them).</summary>
        public void PostsIn(Bounds25833 b, List<double2> output)
        {
            foreach (var t in tiles.Values)
            {
                var tb = t.Key.Bounds;
                if (tb.MinE > b.MaxE || tb.MaxE < b.MinE || tb.MinN > b.MaxN || tb.MaxN < b.MinN) continue;
                foreach (var p in t.Posts) if (b.Contains(p.Position)) output.Add(new double2(p.Position.E, p.Position.N));
            }
        }

        /// <summary>A coarse tile's posts (replacing any earlier set for it).</summary>
        public void SetTile(TileKey key, List<LightPost> posts)
        {
            RemoveTile(key);
            tiles[key] = new TileLights { Key = key, Posts = posts ?? new List<LightPost>() };
        }

        public void RemoveTile(TileKey key)
        {
            if (!tiles.TryGetValue(key, out var t)) return;
            Drop(t);
            ReleaseColliders(t);
            tiles.Remove(key);
        }

        /// <summary>The ground under the tiles reaching into <paramref name="bounds"/> changed (roads graded again): rebuild their meshes.</summary>
        public void Invalidate(Bounds25833 bounds)
        {
            foreach (var t in tiles.Values)
            {
                var b = t.Key.Bounds;
                if (t.Go != null && b.MinE < bounds.MaxE && b.MaxE > bounds.MinE && b.MinN < bounds.MaxN && b.MaxN > bounds.MinN) Drop(t);
            }
        }

        void Drop(TileLights t)
        {
            if (t.Go != null) RallyObjects.Destroy(t.Go);
            if (t.Mesh != null) RallyObjects.Destroy(t.Mesh);
            t.Go = null; t.Mesh = null;
        }

        void ReleaseColliders(TileLights t)
        {
            foreach (var h in t.Handles) colliders?.Release(h);
            t.Handles.Clear();
        }

        /// <summary>Once per frame: drop far tiles, build one near tile, move the colliders (every 0.2 s).</summary>
        public void Update(Utm33 car, float3 carWorld)
        {
            TileLights next = null; double nearest = double.PositiveInfinity;
            foreach (var t in tiles.Values)
            {
                double d = t.Key.RectDistance(car);
                if (d > DropRadius) { if (t.Go != null) Drop(t); continue; }
                if (d <= BuildRadius && t.Go == null && d < nearest) { nearest = d; next = t; }
            }
            if (next != null) Build(next);
            if (Time.realtimeSinceStartup >= nextColliderUpdate) RefreshColliders(carWorld);
        }

        /// <summary>Builds every tile in range now (tests, the preview tool).</summary>
        public void BuildAll(Utm33 car)
        {
            foreach (var t in tiles.Values) if (t.Go == null && t.Key.RectDistance(car) <= BuildRadius) Build(t);
        }

        void Build(TileLights t)
        {
            var mesh = LightMesh.Build(t.Posts, t.Key.Origin, ground);
            t.Go = new GameObject("Lights " + t.Key + (mesh == null ? " (empty)" : ""));
            t.Go.transform.SetParent(parent, false);
            if (mesh == null) return;
            t.Mesh = mesh;
            t.Go.transform.position = FloatingOrigin.ToWorld(t.Key.Origin, 0);
            t.Go.AddComponent<MeshFilter>().sharedMesh = mesh;
            var r = t.Go.AddComponent<MeshRenderer>();
            r.sharedMaterial = material;
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On;
            int filled = 0; foreach (var p in t.Posts) if (p.Filled) filled++;
            RallyLog.Info($"lights: {t.Key} built {t.Posts.Count} masts ({filled} along lit stretches without points), {mesh.vertexCount} vertices");
        }

        readonly List<(float d2, TileLights tile, float3 w, float height)> near = new List<(float, TileLights, float3, float)>();
        bool warnedFull;

        /// <summary>
        /// The masts within <see cref="ColliderRadius"/> of <paramref name="carWorld"/> get the pooled capsules now, nearest first
        /// (built or not: the foot is the ground at the post). Called by the car's placement through TileWorld.RefreshColliders.
        /// </summary>
        public void RefreshColliders(float3 carWorld)
        {
            nextColliderUpdate = Time.realtimeSinceStartup + 0.2f;
            if (colliders == null) return;
            near.Clear();
            var car = FloatingOrigin.ToUtm(carWorld.xz);
            foreach (var t in tiles.Values)
            {
                ReleaseColliders(t);
                if (t.Key.RectDistance(car) > ColliderRadius) continue;
                foreach (var p in t.Posts)
                {
                    var w = FloatingOrigin.ToWorldXZ(p.Position);
                    float d2 = math.distancesq(w, carWorld.xz);
                    if (d2 <= ColliderRadius * ColliderRadius) near.Add((d2, t, new float3(w.x, 0, w.y), p.Height));
                }
            }
            near.Sort((a, b) => a.d2.CompareTo(b.d2));
            for (int i = 0; i < near.Count; i++)
            {
                var (d2, t, w, height) = near[i];
                w.y = ground(FloatingOrigin.ToUtm(w.xz)) - SignMesh.PostSink;
                int h = colliders.Acquire(PropShape.Capsule, w, quaternion.identity, new float3(LightMesh.FootRadius, height + SignMesh.PostSink, 0));
                if (h == 0)
                {
                    if (!warnedFull) { warnedFull = true; RallyLog.Warn($"lights: collider pool full, {near.Count - i} masts beyond {math.sqrt(d2):0} m have no collision (nearest first)"); }
                    break;
                }
                t.Handles.Add(h);
            }
        }

        public void Dispose()
        {
            foreach (var t in tiles.Values) { Drop(t); ReleaseColliders(t); }
            tiles.Clear();
            if (ownsMaterial) RallyObjects.Destroy(material);
        }
    }
}
