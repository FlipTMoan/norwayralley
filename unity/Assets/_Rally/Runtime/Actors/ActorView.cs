using Unity.Mathematics;
using UnityEngine;

namespace Rally.Actors
{
    /// <summary>
    /// Binds a prefab to one <see cref="CrossingActor"/>: places it on the ground each frame and drives an
    /// Animator with Speed (m/s) and State so the same clips (idle/walk/run/hit) work for every kind.
    /// </summary>
    public sealed class ActorView : MonoBehaviour
    {
        static readonly int SpeedId = Animator.StringToHash("Speed");
        static readonly int StateId = Animator.StringToHash("State");
        public CrossingActor Actor;
        public System.Func<float2, float> GroundHeight;
        Animator animator;

        void Awake() { animator = GetComponentInChildren<Animator>(); }

        void LateUpdate()
        {
            if (Actor == null) return;
            float y = GroundHeight != null ? GroundHeight(Actor.Pos) : 0f;
            transform.position = new Vector3(Actor.Pos.x, y, Actor.Pos.y);
            transform.rotation = Quaternion.Euler(0, Actor.Heading * Mathf.Rad2Deg, 0);
            if (animator != null)
            {
                animator.SetFloat(SpeedId, Actor.Speed);
                animator.SetInteger(StateId, (int)Actor.State);
            }
        }
    }
}
