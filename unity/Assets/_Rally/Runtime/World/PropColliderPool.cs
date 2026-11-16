using System.Collections.Generic;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.World
{
    public enum PropShape : byte { Capsule, Box }

    /// <summary>
    /// Pooled colliders on layer "Props" for the small things along the road that have no mesh collider
    /// of their own: signs and posts (capsules), power poles (capsules), fences (boxes). Owners (the signs
    /// layer, the actors layer) acquire a handle per prop in range and release it when the tile goes;
    /// nothing is instantiated per frame. Capsules stand on their base point (y axis); boxes are centred.
    /// </summary>
    public sealed class PropColliderPool : System.IDisposable
    {
        readonly Transform root;
        readonly List<Collider> free = new List<Collider>(), used = new List<Collider>();
        readonly Dictionary<int, Collider> byHandle = new Dictionary<int, Collider>();
        int next = 1;

        public PropColliderPool(int capsules = 128, int boxes = 64)
        {
            root = new GameObject("PropColliders").transform;
            for (int i = 0; i < capsules; i++) free.Add(Make<CapsuleCollider>("Capsule"));
            for (int i = 0; i < boxes; i++) free.Add(Make<BoxCollider>("Box"));
        }

        T Make<T>(string name) where T : Collider
        {
            var go = new GameObject(name) { layer = RallyLayers.Props };
            go.transform.SetParent(root, false);
            go.SetActive(false);
            var c = go.AddComponent<T>();
            if (c is CapsuleCollider cc) cc.direction = 1;
            return c;
        }

        /// <summary>Returns a handle, or 0 when the pool of that shape is exhausted (the prop simply has no collision).</summary>
        public int Acquire(PropShape shape, float3 worldPos, quaternion rotation, float3 size)
        {
            for (int i = free.Count - 1; i >= 0; i--)
            {
                var c = free[i];
                if ((shape == PropShape.Capsule) != (c is CapsuleCollider)) continue;
                free.RemoveAt(i);
                used.Add(c);
                c.transform.SetPositionAndRotation(worldPos, rotation);
                if (c is CapsuleCollider cap) { cap.radius = size.x; cap.height = size.y; cap.center = new Vector3(0, size.y / 2, 0); }
                else if (c is BoxCollider box) box.size = size;
                c.gameObject.SetActive(true);
                byHandle[next] = c;
                return next++;
            }
            return 0;
        }

        public void Release(int handle)
        {
            if (handle == 0 || !byHandle.TryGetValue(handle, out var c)) return;
            byHandle.Remove(handle);
            used.Remove(c);
            c.gameObject.SetActive(false);
            free.Add(c);
        }

        /// <summary>After a FloatingOrigin rebase: every live collider shifts by the delta.</summary>
        public void Shift(float3 delta) { foreach (var c in used) c.transform.position += (Vector3)delta; }

        public void Dispose() { if (root != null) RallyObjects.Destroy(root.gameObject); }
    }
}
