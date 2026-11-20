using Rally.Core;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Vehicle
{
    /// <summary>
    /// Mud, stones, water and tyre smoke thrown from the driven wheels (plan "Off road: wheelspin and mud"): one small
    /// world-space particle system per driven wheel (children "Mud_RL/RR", plus "Mud_FL/FR" on a 4WD, placed behind each
    /// tyre's contact patch by Editor/CarMudSetup and pointing up and back), set up here in code like <see cref="CarExhaust"/>.
    /// The rate follows <see cref="CarState.WheelSlip"/> × wheel speed (<see cref="Look"/>), the kind follows the ground:
    /// brown mud and a few big clods off road, grey-beige stones and dust on gravel, a little white smoke on asphalt only
    /// when the wheels really spin, and water drops when wading (plus a burst on the entry splash). Budget for WebGL 2:
    /// <see cref="MaxParticles"/> per wheel, no collisions, nothing emitted beyond <see cref="CullDistance"/> from the camera.
    /// </summary>
    [RequireComponent(typeof(CarController))]
    public sealed class CarMud : MonoBehaviour
    {
        public enum Kind : byte { None, Smoke, Stones, Mud, Water }

        /// <summary>Driven wheels' systems; <see cref="WheelIndex"/> gives each one's wheel (0 FL, 1 FR, 2 RL, 3 RR).</summary>
        public ParticleSystem[] Wheels = new ParticleSystem[0];
        public int[] WheelIndex = new int[0];
        public float CullDistance = 90f;
        public const int MaxParticles = 64;
        /// <summary>Particles per second per wheel, at most.</summary>
        public const float MaxRate = 90f;

        /// <summary>What one driven wheel throws.</summary>
        public struct MudLook
        {
            public Kind Kind;
            public float Rate;      // particles per second per wheel
            public float Speed;     // throw speed relative to the car (m/s)
        }

        /// <summary>
        /// The emission mapping for one driven wheel: <paramref name="slip"/> = wheel surface speed − ground speed (m/s),
        /// <paramref name="wheelSpeed"/> = the wheel's surface speed (m/s), <paramref name="waterDepth"/> at the car (m),
        /// <paramref name="spraying"/> = wading at speed (bow spray). Nothing without slip on dry ground; on asphalt only a
        /// spinning wheel smokes.
        /// </summary>
        public static MudLook Look(Surface surface, float slip, float wheelSpeed, float waterDepth, bool spraying, float groundSpeed)
        {
            slip = math.abs(slip); wheelSpeed = math.abs(wheelSpeed);
            float throw01 = slip > 0.3f ? slip * (3f + wheelSpeed) : 0f;
            var look = new MudLook { Speed = math.clamp(2.5f + 0.6f * slip, 2.5f, 12f) };
            if (waterDepth > 0.05f)
            {
                look.Kind = Kind.Water;
                look.Rate = 0.4f * throw01 + (spraying ? 3f * groundSpeed : 0f);
                look.Speed = math.max(look.Speed, 1.5f + 0.25f * groundSpeed);
            }
            else if (surface == Surface.Asphalt)
            {
                look.Kind = Kind.Smoke;
                look.Rate = slip > 2.5f ? (slip - 2.5f) * 6f : 0f;
                look.Speed = 1.2f;
            }
            else if (surface == Surface.Gravel) { look.Kind = Kind.Stones; look.Rate = 0.8f * throw01; }
            else { look.Kind = Kind.Mud; look.Rate = 0.9f * throw01; }
            look.Rate = math.min(look.Rate, MaxRate);
            if (look.Rate <= 0f) look.Kind = Kind.None;
            return look;
        }

        static readonly Color MudColour = new Color(0.27f, 0.19f, 0.12f, 1f);
        static readonly Color StoneColour = new Color(0.46f, 0.43f, 0.37f, 1f);
        static readonly Color SmokeColour = new Color(0.86f, 0.86f, 0.85f, 0.35f);
        static readonly Color WaterColour = new Color(0.78f, 0.84f, 0.9f, 0.6f);

        CarController car;
        Kind shown = (Kind)255;
        uint dice = 0x2545F491u;

        void Awake()
        {
            car = GetComponent<CarController>();
            foreach (var p in Wheels) if (p != null) Configure(p);
        }

        static void Configure(ParticleSystem p)
        {
            var main = p.main;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.maxParticles = MaxParticles;
            main.playOnAwake = true;
            main.loop = true;
            main.startRotation = new ParticleSystem.MinMaxCurve(0f, math.PI * 2f);
            var em = p.emission; em.rateOverTime = 0f;
            var shape = p.shape; shape.enabled = true; shape.shapeType = ParticleSystemShapeType.Cone; shape.angle = 22f; shape.radius = 0.12f;
            var inherit = p.inheritVelocity; inherit.enabled = true; inherit.mode = ParticleSystemInheritVelocityMode.Initial; inherit.curve = 0.9f;
            var drag = p.limitVelocityOverLifetime; drag.enabled = true; drag.drag = 0.6f; drag.multiplyDragByParticleSize = false;
            var col = p.colorOverLifetime; col.enabled = true;
            var g = new Gradient();
            g.SetKeys(new[] { new GradientColorKey(Color.white, 0f), new GradientColorKey(Color.white, 1f) },
                      new[] { new GradientAlphaKey(1f, 0f), new GradientAlphaKey(1f, 0.7f), new GradientAlphaKey(0f, 1f) });
            col.color = g;
            var rot = p.rotationOverLifetime; rot.enabled = true; rot.z = new ParticleSystem.MinMaxCurve(-3f, 3f);
            var coll = p.collision; coll.enabled = false;
            var r = p.GetComponent<ParticleSystemRenderer>();
            r.renderMode = ParticleSystemRenderMode.Billboard;
            r.sortMode = ParticleSystemSortMode.None;
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            r.receiveShadows = false;
            if (!p.isPlaying) p.Play();
        }

        /// <summary>Per-kind look of the systems (colour, size, life, gravity, growth): set only when the kind changes.</summary>
        void Show(Kind kind)
        {
            shown = kind;
            if (kind == Kind.None) return;   // keep the last look while the particles in the air die out
            // maxScreen: a clod that flies past the camera stays a clod, not a blob over the screen; smoke may grow big.
            Color c; float s0, s1, life, gravity, grow, maxScreen = 0.06f;
            switch (kind)
            {
                case Kind.Smoke: c = SmokeColour; s0 = 0.3f; s1 = 0.55f; life = 1.4f; gravity = -0.02f; grow = 3f; maxScreen = 0.3f; break;
                case Kind.Stones: c = StoneColour; s0 = 0.05f; s1 = 0.15f; life = 1.0f; gravity = 0.9f; grow = 1.8f; break;
                case Kind.Water: c = WaterColour; s0 = 0.07f; s1 = 0.2f; life = 0.9f; gravity = 1f; grow = 1.8f; break;
                default: c = MudColour; s0 = 0.05f; s1 = 0.13f; life = 1.1f; gravity = 1f; grow = 1f; break;
            }
            foreach (var p in Wheels)
            {
                if (p == null) continue;
                var main = p.main;
                main.startColor = c;
                main.startSize = new ParticleSystem.MinMaxCurve(s0, s1);
                main.startLifetime = new ParticleSystem.MinMaxCurve(life * 0.6f, life);
                main.gravityModifier = gravity;
                p.GetComponent<ParticleSystemRenderer>().maxParticleSize = maxScreen;
                var size = p.sizeOverLifetime; size.enabled = grow != 1f;
                size.size = new ParticleSystem.MinMaxCurve(1f, AnimationCurve.Linear(0f, 1f, 1f, grow));
            }
        }

        float Rand() { dice ^= dice << 13; dice ^= dice >> 17; dice ^= dice << 5; return dice * (1f / 4294967296f); }

        void Update()
        {
            if (Wheels.Length == 0) return;
            ref var s = ref car.State;
            var cam = Camera.main;
            bool seen = cam == null || (cam.transform.position - transform.position).sqrMagnitude < CullDistance * CullDistance;
            float wheelSpeed = s.VF + s.WheelSlip;
            var look = seen && s.Grounded && !car.Frozen
                ? Look(s.SurfaceKind, s.WheelSlip, wheelSpeed, s.WaterDepth, s.Spraying, s.Speed)
                : default;
            if (look.Kind != shown) Show(look.Kind);
            // Throw back relative to the direction the wheel turns: up and back going forwards, up and forwards in reverse.
            float dir = wheelSpeed < 0f ? -1f : 1f;
            float dt = Time.deltaTime;
            for (int i = 0; i < Wheels.Length; i++)
            {
                var p = Wheels[i];
                if (p == null) continue;
                var em = p.emission; em.rateOverTime = look.Rate;
                var main = p.main; main.startSpeed = new ParticleSystem.MinMaxCurve(look.Speed * 0.6f, look.Speed);
                var t = p.transform;
                var want = Quaternion.LookRotation(new Vector3(0f, 0.6f, -dir));
                if (t.localRotation != want) t.localRotation = want;
                // A few big clods off road.
                if (look.Kind == Kind.Mud && Rand() < look.Rate * dt * 0.06f)
                    p.Emit(new ParticleSystem.EmitParams { startSize = 0.14f + 0.08f * Rand(), applyShapeToPosition = true }, 1);
            }
            if (s.Splash > 0f && seen)
            {
                if (shown != Kind.Water) Show(Kind.Water);
                foreach (var p in Wheels) if (p != null) p.Emit(Mathf.RoundToInt(12f + 30f * s.Splash));
            }
        }
    }
}
