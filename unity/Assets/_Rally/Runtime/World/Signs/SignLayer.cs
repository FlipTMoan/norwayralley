using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// The real road signs of the loaded coarse tiles (NVDB Skiltplate, placed by <see cref="SignPlacement"/>). Every
    /// tile keeps its posts as data; only tiles within <see cref="BuildRadius"/> of the car get faces and a mesh (one
    /// mesh per tile, built once its faces are painted), and lose them beyond <see cref="DropRadius"/>: a 0.9 m plate is
    /// under two pixels at 600 m. Posts within <see cref="ColliderRadius"/> of the car get capsule colliders from the
    /// <see cref="PropColliderPool"/>, so the car can hit them (layer Props: solid, damage).
    /// </summary>
    public sealed class SignLayer : IDisposable
    {
        public const double BuildRadius = 1000, DropRadius = 1500;
        public const float ColliderRadius = 35f, PaintBudgetMs = 4f;

        sealed class TileSigns
        {
            public TileKey Key;
            public List<SignPost> Posts;
            public readonly List<SignAtlas.Face> Faces = new List<SignAtlas.Face>();
            public GameObject Go;
            public Mesh Mesh;
            public bool Acquired;
            public readonly List<(float3 foot, float height, float radius)> Feet = new List<(float3, float, float)>();
            public readonly List<int> Handles = new List<int>();
            public int Plates;
        }

        readonly Transform parent;
        readonly PropColliderPool colliders;
        readonly Func<Utm33, float> ground;
        readonly Dictionary<TileKey, TileSigns> tiles = new Dictionary<TileKey, TileSigns>();
        readonly Dictionary<string, SignAtlas.Face> faceByKey = new Dictionary<string, SignAtlas.Face>();
        readonly List<int> pagesScratch = new List<int>();
        public readonly SignAtlas Atlas;
        float nextColliderUpdate;

        public SignLayer(Transform parent, PropColliderPool colliders, Func<Utm33, float> ground, Shader shader = null)
        {
            this.parent = parent; this.colliders = colliders; this.ground = ground;
            Atlas = new SignAtlas(shader != null ? shader : Resources.Load<Shader>("Signs/Sign"));
        }

        public int TileCount => tiles.Count;
        public int BuiltTiles { get { int n = 0; foreach (var t in tiles.Values) if (t.Go != null) n++; return n; } }
        public int PostCount { get { int n = 0; foreach (var t in tiles.Values) n += t.Posts.Count; return n; } }
        public int DrawnPlates { get { int n = 0; foreach (var t in tiles.Values) if (t.Go != null) n += t.Plates; return n; } }

        /// <summary>The feet (E, N) of the posts inside <paramref name="b"/> (the verge plants keep clear of them).</summary>
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
        public void SetTile(TileKey key, List<SignPost> posts)
        {
            RemoveTile(key);
            tiles[key] = new TileSigns { Key = key, Posts = posts ?? new List<SignPost>() };
        }

        public void RemoveTile(TileKey key)
        {
            if (!tiles.TryGetValue(key, out var t)) return;
            Drop(t);
            tiles.Remove(key);
        }

        void Drop(TileSigns t)
        {
            foreach (var h in t.Handles) colliders?.Release(h);
            t.Handles.Clear();
            if (t.Go != null) RallyObjects.Destroy(t.Go);
            if (t.Mesh != null) RallyObjects.Destroy(t.Mesh);
            t.Go = null; t.Mesh = null;
            foreach (var f in t.Faces) Atlas.Release(f);
            t.Faces.Clear();
            t.Acquired = false;
            t.Feet.Clear();
        }

        /// <summary>Once per frame: build near tiles, drop far ones, paint faces within the frame budget, move the colliders.</summary>
        public void Update(Utm33 car, float3 carWorld)
        {
            foreach (var t in tiles.Values)
            {
                double d = t.Key.RectDistance(car);
                if (d > DropRadius) { if (t.Acquired) Drop(t); continue; }
                if (d > BuildRadius || t.Acquired) continue;
                foreach (var post in t.Posts)
                    foreach (var p in post.Plates)
                    {
                        var f = Atlas.Acquire(p.Design);
                        if (f != null) t.Faces.Add(f);
                    }
                t.Acquired = true;
            }
            Atlas.Pump(PaintBudgetMs);
            foreach (var t in tiles.Values)
                if (t.Acquired && t.Go == null && t.Faces.TrueForAll(f => f.Painted) && Atlas.Pending == 0) { Build(t); break; }   // one mesh per frame
            if (Time.realtimeSinceStartup >= nextColliderUpdate) { nextColliderUpdate = Time.realtimeSinceStartup + 0.2f; UpdateColliders(carWorld); }
        }

        /// <summary>Builds every tile in range now (tests, the preview tool).</summary>
        public void BuildAll(Utm33 car)
        {
            Update(car, float3.zero);
            Atlas.PaintAll();
            foreach (var t in tiles.Values) if (t.Acquired && t.Go == null) Build(t);
            nextColliderUpdate = 0;   // the next Update places the colliders
        }

        void Build(TileSigns t)
        {
            faceByKey.Clear();
            foreach (var f in t.Faces) faceByKey[f.Key] = f;
            t.Feet.Clear();
            int plates = 0;
            var mesh = SignMesh.Build(t.Posts, t.Key.Origin, ground, d => faceByKey.TryGetValue(d.Key, out var f) && f.Painted ? f : null, pagesScratch, t.Feet);
            foreach (var post in t.Posts) plates += post.Plates.Count;
            t.Plates = plates;
            if (mesh == null) { t.Go = new GameObject("Signs " + t.Key + " (empty)"); t.Go.transform.SetParent(parent, false); return; }
            var mats = new Material[pagesScratch.Count];
            for (int i = 0; i < mats.Length; i++) mats[i] = Atlas.MaterialOf(pagesScratch[i]);
            t.Mesh = mesh;
            t.Go = new GameObject("Signs " + t.Key);
            t.Go.transform.SetParent(parent, false);
            t.Go.transform.position = FloatingOrigin.ToWorld(t.Key.Origin, 0);
            t.Go.AddComponent<MeshFilter>().sharedMesh = mesh;
            var r = t.Go.AddComponent<MeshRenderer>();
            r.sharedMaterials = mats;
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On;
            RallyLog.Info($"signs: {t.Key} built {t.Posts.Count} posts, {plates} plates ({Atlas.FaceCount} faces in {Atlas.PageCount} atlas pages, {Atlas.Painted} painted in {Atlas.PaintMs:0} ms so far)");
        }

        readonly List<(float d2, TileSigns tile, float3 w, float height, float radius)> nearPosts = new List<(float, TileSigns, float3, float, float)>();
        bool warnedFull;

        /// <summary>
        /// Posts within <see cref="ColliderRadius"/> get the pooled capsules, nearest first: when the pool runs out (a town
        /// full of signs) the far posts go without one, never the post in front of the car, and the log says so once.
        /// </summary>
        void UpdateColliders(float3 carWorld)
        {
            if (colliders == null) return;
            nearPosts.Clear();
            foreach (var t in tiles.Values)
            {
                foreach (var h in t.Handles) colliders.Release(h);
                t.Handles.Clear();
                if (t.Go == null || t.Feet.Count == 0) continue;
                var origin = (float3)FloatingOrigin.ToWorld(t.Key.Origin, 0);
                foreach (var (foot, height, radius) in t.Feet)
                {
                    var w = origin + foot;
                    float d2 = math.distancesq(w.xz, carWorld.xz);
                    if (d2 <= ColliderRadius * ColliderRadius) nearPosts.Add((d2, t, w, height, radius));
                }
            }
            nearPosts.Sort((a, b) => a.d2.CompareTo(b.d2));
            for (int i = 0; i < nearPosts.Count; i++)
            {
                var (d2, t, w, height, radius) = nearPosts[i];
                int h = colliders.Acquire(PropShape.Capsule, w, quaternion.identity, new float3(math.max(radius, 0.06f), height, 0));
                if (h == 0)
                {
                    if (!warnedFull) { warnedFull = true; RallyLog.Warn($"signs: collider pool full, {nearPosts.Count - i} posts beyond {math.sqrt(d2):0} m have no collision (nearest first)"); }
                    break;
                }
                t.Handles.Add(h);
            }
        }

        public void Dispose()
        {
            foreach (var t in tiles.Values) Drop(t);
            tiles.Clear();
            Atlas.Dispose();
        }
    }
}
