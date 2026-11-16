using Rally.Core;
using Unity.Collections;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// A fixed pool of CapsuleColliders on layer "Trees", re-targeted every frame to the trees within
    /// <see cref="Radius"/> of the car (from <see cref="TreeIndex"/>), so Unity physics queries and the
    /// car's collision code hit trees even though the forest itself is drawn indirect without objects.
    /// Capsules stand on the ground at the tree's trunk radius; unused ones are disabled, never destroyed.
    /// </summary>
    public sealed class TreeColliderPool : System.IDisposable
    {
        public const float Radius = 40f;
        readonly CapsuleCollider[] pool;
        readonly Transform root;
        readonly TreeIndex index;
        NativeList<TreeHit> hits = new NativeList<TreeHit>(256, Allocator.Persistent);

        public TreeColliderPool(TreeIndex index, int size = 96)
        {
            this.index = index;
            root = new GameObject("TreeColliders").transform;
            pool = new CapsuleCollider[size];
            for (int i = 0; i < size; i++)
            {
                var go = new GameObject("Tree") { layer = RallyLayers.Trees, isStatic = false };
                go.transform.SetParent(root, false);
                pool[i] = go.AddComponent<CapsuleCollider>();
                pool[i].direction = 1;   // y axis
                go.SetActive(false);
            }
        }

        /// <summary>Call once per frame with the car's world position.</summary>
        public void Update(float3 carWorld)
        {
            hits.Clear();
            index.Query(carWorld.xz, Radius, hits);
            int n = math.min(hits.Length, pool.Length);
            for (int i = 0; i < n; i++)
            {
                var h = hits[i];
                var c = pool[i];
                var w = FloatingOrigin.ToWorld(new Utm33(h.Position.x, h.Position.y), h.GroundY);
                c.transform.position = new Vector3(w.x, w.y + h.Height * 0.5f, w.z);
                c.radius = h.Radius;
                c.height = h.Height;
                if (!c.gameObject.activeSelf) c.gameObject.SetActive(true);
            }
            for (int i = n; i < pool.Length; i++) if (pool[i].gameObject.activeSelf) pool[i].gameObject.SetActive(false);
        }

        public void Dispose() { hits.Dispose(); if (root != null) RallyObjects.Destroy(root.gameObject); }
    }
}
