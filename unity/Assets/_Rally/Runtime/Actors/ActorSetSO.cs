using UnityEngine;

namespace Rally.Actors
{
    /// <summary>
    /// The prefab per <see cref="ActorKind"/> (ActorSpec.Prefab names them; this asset holds the references so
    /// the game needs no Addressables). Each prefab carries an <see cref="ActorView"/> (added at spawn when
    /// missing) and optionally an Animator with Speed (float) and State (int) parameters.
    /// </summary>
    [CreateAssetMenu(menuName = "Rally/Actor Set", fileName = "ActorSet")]
    public sealed class ActorSetSO : ScriptableObject
    {
        [System.Serializable]
        public sealed class Entry
        {
            public ActorKind Kind;
            public GameObject Prefab;
        }

        public Entry[] Entries = new Entry[0];
        [Tooltip("Used for kinds without an entry (a capsule placeholder is fine).")] public GameObject Fallback;

        public GameObject PrefabFor(ActorKind kind)
        {
            foreach (var e in Entries) if (e != null && e.Kind == kind && e.Prefab != null) return e.Prefab;
            return Fallback;
        }
    }
}
