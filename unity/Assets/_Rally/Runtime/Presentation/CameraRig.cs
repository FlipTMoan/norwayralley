using Unity.Mathematics;
using UnityEngine;
using UnityEngine.InputSystem;

namespace Rally.Presentation
{
    /// <summary>
    /// The three cameras of the JS game (legacy-js/src/main.js, keys 1/2/3): overhead, chase and driver's seat.
    /// The chase camera looks along the car's forward (+Z in car space); screen-right is the car's right, so the
    /// pace-note arrows (Rally.Track.PaceNotes) keep the sign convention from the JS port.
    /// </summary>
    public sealed class CameraRig : MonoBehaviour
    {
        public enum Mode { Overhead = 1, Chase = 2, Seat = 3 }

        [Tooltip("The car body transform (position = car pos, rotation = yaw with visual pitch/roll).")]
        public Transform Target;
        [Tooltip("Driver's eye offset in car space (CarSpec.eye: x right, y up, z forward).")]
        public Vector3 SeatEye = new Vector3(-0.36f, 1.1f, 0.12f);
        public Mode CurrentMode = Mode.Chase;

        [Header("Chase")]
        public float ChaseBack = 6.5f;
        public float ChaseUp = 2.4f;
        public float ChaseLookUp = 1.0f;
        public float ChaseDamp = 6f;       // 1/s, the JS damp() rate for the follow point
        [Header("Overhead")]
        public float OverheadHeight = 60f;
        public float OverheadBack = 25f;

        Vector3 chasePos;
        float chaseYaw;

        /// <summary>Set by the world so the camera never goes under the ground (IGround.HeightAt + 0.5 m).</summary>
        public System.Func<float2, float> GroundHeight;

        void LateUpdate()
        {
            if (Target == null) return;
            var kb = Keyboard.current;   // Input System, like CarController (the legacy Input class is off in this project)
            if (kb != null)
            {
                if (kb.cKey.wasPressedThisFrame) Cycle();                     // main.js:1487 C cycles the three cameras
                if (kb.digit1Key.wasPressedThisFrame) CurrentMode = Mode.Overhead;
                if (kb.digit2Key.wasPressedThisFrame) CurrentMode = Mode.Chase;
                if (kb.digit3Key.wasPressedThisFrame) CurrentMode = Mode.Seat;
            }

            var t = Target;
            float yaw = t.eulerAngles.y * Mathf.Deg2Rad;
            var fwd = new Vector3(Mathf.Sin(yaw), 0, Mathf.Cos(yaw));
            switch (CurrentMode)
            {
                case Mode.Overhead:
                    transform.position = t.position + Vector3.up * OverheadHeight - fwd * OverheadBack;
                    transform.LookAt(t.position + fwd * 10f);
                    break;
                case Mode.Chase:
                {
                    // Yaw follows with a damped rate so a spin reads as a spin, not a cut (main.js chase camera).
                    float k = 1f - Mathf.Exp(-ChaseDamp * Time.deltaTime);
                    chaseYaw += Mathf.DeltaAngle(chaseYaw * Mathf.Rad2Deg, yaw * Mathf.Rad2Deg) * Mathf.Deg2Rad * k;
                    var back = new Vector3(Mathf.Sin(chaseYaw), 0, Mathf.Cos(chaseYaw));
                    var want = t.position - back * ChaseBack + Vector3.up * ChaseUp;
                    chasePos = Vector3.Lerp(chasePos, want, k);
                    if (GroundHeight != null)
                    {
                        float g = GroundHeight(new float2(chasePos.x, chasePos.z)) + 0.6f;
                        if (chasePos.y < g) chasePos.y = g;
                    }
                    transform.position = chasePos;
                    transform.LookAt(t.position + Vector3.up * ChaseLookUp);
                    break;
                }
                case Mode.Seat:
                    transform.position = t.TransformPoint(SeatEye);
                    transform.rotation = t.rotation;
                    break;
            }
        }

        /// <summary>Next camera: overhead → chase → seat → overhead.</summary>
        public void Cycle() => CurrentMode = CurrentMode == Mode.Seat ? Mode.Overhead : CurrentMode + 1;

        /// <summary>Called on FloatingOrigin.Rebased so the damped follow point moves with the world.</summary>
        public void Shift(Vector3 delta) { chasePos -= delta; }
    }
}
