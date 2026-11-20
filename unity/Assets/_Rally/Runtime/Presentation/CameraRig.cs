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
        [Tooltip("Seconds of the car's velocity the chase camera looks ahead (into a slide or a bend), at most 12 m.")]
        public float LookAhead = 0.3f;
        [Tooltip("Extra field of view (degrees) at FovFullSpeed: the sense of speed.")]
        public float FovGain = 9f;
        public float FovFullSpeed = 45f;   // m/s (160 km/h)
        [Tooltip("Shake amplitude at Shake = 1: degrees of rotation (positional shake is a few cm).")]
        public float ShakeDegrees = 0.35f;
        /// <summary>0–1+, set every frame by the game from the car (surface roughness × speed, landings); 0 = still.</summary>
        [System.NonSerialized] public float Shake;
        [Header("Overhead")]
        public float OverheadHeight = 60f;
        public float OverheadBack = 25f;

        Vector3 chasePos, lastTarget, vel;
        float chaseYaw, baseFov = -1f;
        Camera cam;

        /// <summary>Set by the world so the camera never goes under the ground (IGround.HeightAt + 0.5 m).</summary>
        public System.Func<float2, float> GroundHeight;
        /// <summary>Set by the world (ILayeredGround.TunnelAt): in a road tunnel the chase camera stays inside the tube.</summary>
        public Rally.Core.TunnelQuery Tunnel;

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
            float dt = Mathf.Max(Time.deltaTime, 1e-4f);
            // The car's velocity from its motion (the rig knows only a transform), smoothed over ~0.15 s; a teleport
            // (restart, rebase) is ignored instead of read as a burst of speed.
            var step = (t.position - lastTarget) / dt;
            lastTarget = t.position;
            if (step.sqrMagnitude < 100f * 100f) vel = Vector3.Lerp(vel, step, 1f - Mathf.Exp(-7f * dt));
            if (cam == null) { cam = GetComponent<Camera>(); if (cam != null) baseFov = cam.fieldOfView; }
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
                    KeepInTunnel(t.position);
                    if (GroundHeight != null)
                    {
                        float g = GroundHeight(new float2(chasePos.x, chasePos.z)) + 0.6f;
                        if (chasePos.y < g) chasePos.y = g;
                    }
                    // Look a little ahead along the velocity, so in a slide the view leads to where the car goes
                    // (never behind the car: reversing keeps only the sideways part).
                    var v = new Vector3(vel.x, 0f, vel.z);
                    float along = Vector3.Dot(v, back);
                    if (along < 0f) v -= back * along;
                    var ahead = Vector3.ClampMagnitude(v * LookAhead, 12f);
                    transform.position = chasePos;
                    transform.LookAt(t.position + Vector3.up * ChaseLookUp + ahead);
                    ApplyShake(dt);
                    break;
                }
                case Mode.Seat:
                    transform.position = t.TransformPoint(SeatEye);
                    transform.rotation = t.rotation;
                    ApplyShake(dt);
                    break;
            }
            if (cam != null && baseFov > 0f)
            {
                float want = baseFov + (CurrentMode == Mode.Overhead ? 0f : FovGain * Mathf.Clamp01(vel.magnitude / FovFullSpeed));
                cam.fieldOfView = Mathf.Lerp(cam.fieldOfView, want, 1f - Mathf.Exp(-3f * dt));
            }
        }

        /// <summary>
        /// In a road tunnel the follow point stays in the tube: with the car in a tube and the camera outside its plan (a bend,
        /// a spin) it is pulled towards the car until it is in; inside, it keeps half a metre off the walls and under the roof
        /// arch. Above the roof (the car on the mountain over a tunnel) nothing changes. Without this the ground clamp lifted
        /// the camera onto the mountain over the tube.
        /// </summary>
        void KeepInTunnel(Vector3 car)
        {
            if (Tunnel == null || !Tunnel(new float2(car.x, car.z), out var carSpot) || car.y > carSpot.Crown) return;
            for (int i = 0; i < 8 && !Tunnel(new float2(chasePos.x, chasePos.z), out _); i++) chasePos = Vector3.Lerp(chasePos, car, 0.35f);
            if (!Tunnel(new float2(chasePos.x, chasePos.z), out var spot)) return;
            float room = spot.Half - 0.5f;
            if (math.abs(spot.Lateral) > room)
            {
                var c = new Vector3(spot.Centre.x, chasePos.y, spot.Centre.y);
                var side = new Vector3(chasePos.x, chasePos.y, chasePos.z) - c;
                chasePos = c + side * (room / math.abs(spot.Lateral));
                Tunnel(new float2(chasePos.x, chasePos.z), out spot);
            }
            chasePos.y = math.clamp(chasePos.y, spot.Floor + 0.6f, math.max(spot.Floor + 0.6f, spot.Roof - 0.4f));
        }

        float shakeTime;

        /// <summary>Road feel: smooth noise (not random jitter) on pitch / yaw / roll and a few cm of height, scaled by <see cref="Shake"/>.</summary>
        void ApplyShake(float dt)
        {
            float a = Mathf.Clamp(Shake, 0f, 2f);
            if (a <= 0.001f) return;
            shakeTime += dt * (9f + 9f * Mathf.Min(a, 1f));
            float n(float o) => Mathf.PerlinNoise(shakeTime, o) * 2f - 1f;
            transform.rotation *= Quaternion.Euler(n(0.3f) * ShakeDegrees * a, n(7.1f) * ShakeDegrees * 0.6f * a, n(13.7f) * ShakeDegrees * 0.8f * a);
            transform.position += Vector3.up * (n(21.3f) * 0.025f * a);
        }

        /// <summary>Next camera: overhead → chase → seat → overhead.</summary>
        public void Cycle() => CurrentMode = CurrentMode == Mode.Seat ? Mode.Overhead : CurrentMode + 1;

        /// <summary>Called on FloatingOrigin.Rebased so the damped follow point moves with the world.</summary>
        public void Shift(Vector3 delta) { chasePos -= delta; lastTarget -= delta; }
    }
}
