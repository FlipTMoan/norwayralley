using System;
using System.Collections.Generic;
using UnityEngine;

namespace Rally.Net
{
    /// <summary>
    /// Draws the other players as cars: one instance of the prefab for their car kind (<see cref="Prefabs"/>) per peer, placed
    /// every frame from the peer's <see cref="GhostTrack"/> (120 ms behind, interpolated). The wire
    /// frame is the JS local projection (x east, y up, z south, yaw 0 = south, π/2 = east); the World
    /// layer sets <see cref="ToWorld"/> to map it into the current floating-origin frame — the default
    /// only flips z and yaw, which is right when the room anchor is the scene origin. A peer not heard
    /// from for <see cref="StaleSeconds"/> is hidden; one that left the session is destroyed.
    /// </summary>
    public sealed class GhostCarView : MonoBehaviour
    {
        /// <summary>A peer's car kind (the wire id: "porsche", "volvo240", "buggy" …) and the prefab drawn for it.</summary>
        [Serializable] public struct KindPrefab { public string Kind; public GameObject Prefab; }
        [Tooltip("One entry per car kind; the first entry is drawn for a kind that is not listed (an older or newer build's car).")]
        public KindPrefab[] Prefabs = new KindPrefab[0];
        public float StaleSeconds = 5f;
        [NonSerialized] public Session Session;
        /// <summary>Wire pose → world position and rotation (set by the World layer).</summary>
        [NonSerialized] public Func<GhostPose, (Vector3 position, Quaternion rotation)> ToWorld = DefaultToWorld;
        /// <summary>Called once per ghost with its callsign so the UI can hang a name label on it.</summary>
        [NonSerialized] public Action<GameObject, string> OnLabel;
        /// <summary>Called once per ghost with its grid paint (RoomCodes.PaintForSlot) so the car can be recoloured.</summary>
        [NonSerialized] public Action<GameObject, Color> OnPaint;

        readonly Dictionary<string, Ghost> ghosts = new Dictionary<string, Ghost>();
        readonly List<string> gone = new List<string>();

        sealed class Ghost { public GameObject Go; public string Kind; public string Name; }

        public static (Vector3, Quaternion) DefaultToWorld(GhostPose p)
            => (new Vector3((float)p.X, (float)p.Y, (float)-p.Z),
                Quaternion.Euler((float)(p.Pitch * Mathf.Rad2Deg), (float)((Math.PI - p.Yaw) * Mathf.Rad2Deg), (float)(p.Roll * Mathf.Rad2Deg)));

        void LateUpdate()
        {
            if (Session == null) return;
            double now = Time.realtimeSinceStartupAsDouble * 1000;
            foreach (var kv in Session.Peers)
            {
                var peer = kv.Value;
                if (!peer.Track.TrySample(now, out var pose)) continue;
                var ghost = Ensure(kv.Key, peer);
                if (ghost == null) continue;
                bool stale = now - peer.Track.LastSeen > StaleSeconds * 1000;
                if (ghost.Go.activeSelf == stale) ghost.Go.SetActive(!stale);
                if (stale) continue;
                var (pos, rot) = ToWorld(pose);
                ghost.Go.transform.SetPositionAndRotation(pos, rot);
            }
            gone.Clear();
            foreach (var id in ghosts.Keys) if (!Session.Peers.ContainsKey(id)) gone.Add(id);
            foreach (var id in gone) { Destroy(ghosts[id].Go); ghosts.Remove(id); }
        }

        Ghost Ensure(string id, PeerInfo peer)
        {
            if (ghosts.TryGetValue(id, out var ghost) && ghost.Kind == peer.Kind)
            {
                if (ghost.Name != peer.Track.Name && !string.IsNullOrEmpty(peer.Track.Name)) { ghost.Name = peer.Track.Name; OnLabel?.Invoke(ghost.Go, ghost.Name); }
                return ghost;
            }
            if (ghost != null) { Destroy(ghost.Go); ghosts.Remove(id); } // kind changed: rebuild from the other prefab
            var prefab = PrefabFor(peer.Kind);
            if (prefab == null) return null;
            var go = Instantiate(prefab, transform);
            go.name = $"ghost {peer.Name}";
            ghost = new Ghost { Go = go, Kind = peer.Kind, Name = peer.Name ?? peer.Track.Name };
            ghosts[id] = ghost;
            OnLabel?.Invoke(go, ghost.Name);
            if (OnPaint != null)
            {
                int hex = RoomCodes.PaintForSlot(peer.Slot < 0 ? 0 : peer.Slot);
                OnPaint(go, new Color(((hex >> 16) & 255) / 255f, ((hex >> 8) & 255) / 255f, (hex & 255) / 255f));
            }
            return ghost;
        }

        /// <summary>The prefab for a wire kind; the first entry for an unknown one; null with no entries.</summary>
        public GameObject PrefabFor(string kind)
        {
            foreach (var e in Prefabs) if (e.Prefab != null && string.Equals(e.Kind, kind, StringComparison.OrdinalIgnoreCase)) return e.Prefab;
            return Prefabs.Length > 0 ? Prefabs[0].Prefab : null;
        }

        void OnDestroy() { foreach (var g in ghosts.Values) if (g.Go != null) Destroy(g.Go); ghosts.Clear(); }
    }
}
