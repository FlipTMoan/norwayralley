using Unity.Mathematics;
using UnityEngine;

namespace Rally.Vehicle
{
    /// <summary>
    /// Exhaust smoke from the tailpipe(s): one small world-space particle system per pipe (children placed at the model's
    /// pipes by Editor/CarExhaustSetup, emitting backwards), set up here in code so the look lives in one place.
    /// Rate, size and opacity follow throttle and rpm (<see cref="Look"/>): a faint haze at idle, a grey plume under load,
    /// denser and whiter while the engine is cold (the first <see cref="WarmUpSeconds"/>). A short dark puff when the
    /// throttle is floored from low rpm and on every upshift (CarEffects' hook), and now and then a pop with a tiny
    /// orange flash when the throttle is lifted at high rpm. Particles take a little of the car's velocity, rise slowly
    /// and drift with <see cref="Wind"/>. Small budget for WebGL 2: 60 particles per pipe, no collisions, nothing emitted
    /// when the camera is more than <see cref="CullDistance"/> away. A badly damaged engine does not add exhaust smoke:
    /// CarDamageVisual's engine smoke is that cue.
    /// </summary>
    [RequireComponent(typeof(CarController))]
    public sealed class CarExhaust : MonoBehaviour
    {
        public ParticleSystem[] Pipes = new ParticleSystem[0];
        [Tooltip("Optional tiny light at the first pipe for the backfire flash.")]
        public Light Flash;
        public float WarmUpSeconds = 30f;
        public float CullDistance = 90f;
        [Tooltip("World-space breeze the smoke drifts with (m/s).")]
        public Vector3 Wind = new Vector3(0.5f, 0f, 0.25f);
        public const int MaxParticles = 60;

        /// <summary>What the pipes emit for one engine state.</summary>
        public struct ExhaustLook
        {
            public float Rate;      // particles per second per pipe
            public float Size;      // start size, metres
            public float Alpha;     // start opacity
            public float Grey;      // colour: 0 black … 1 white
            public float Life;      // seconds
        }

        /// <summary>
        /// The emission mapping: <paramref name="throttle"/> 0..1, <paramref name="rpm01"/> = rpm / redline, <paramref name="cold"/>
        /// 1 just after the start → 0 warm. Idle: ~6/s, faint and small; full throttle at the redline: ~40/s, larger and greyer.
        /// </summary>
        public static ExhaustLook Look(float throttle, float rpm01, float cold)
        {
            throttle = math.saturate(throttle); rpm01 = math.saturate(rpm01); cold = math.saturate(cold);
            float load = throttle * (0.35f + 0.65f * rpm01);
            return new ExhaustLook
            {
                Rate = (6f + 34f * load) * (1f + 0.8f * cold),
                Size = 0.2f + 0.35f * load + 0.12f * cold,
                Alpha = 0.16f + 0.3f * load + 0.2f * cold,
                Grey = math.lerp(0.55f - 0.15f * load, 0.92f, cold),   // cold: white condensation
                Life = 1.0f + 0.6f * load + 1.2f * cold,
            };
        }

        CarController car;
        float runTime, lastThrottle, flashUntil;
        uint dice = 0x9E3779B9u;

        void Awake()
        {
            car = GetComponent<CarController>();
            foreach (var p in Pipes) if (p != null) Configure(p);
            if (Flash != null) Flash.enabled = false;
        }

        void Configure(ParticleSystem p)
        {
            var main = p.main;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.maxParticles = MaxParticles;
            main.startSpeed = new ParticleSystem.MinMaxCurve(1.2f, 2.4f);
            main.gravityModifier = -0.015f;   // warm gas rises a little
            main.playOnAwake = true;
            main.loop = true;
            main.startRotation = new ParticleSystem.MinMaxCurve(0f, math.PI * 2f);
            var shape = p.shape; shape.enabled = true; shape.shapeType = ParticleSystemShapeType.Cone; shape.angle = 9f; shape.radius = 0.025f;
            var inherit = p.inheritVelocity; inherit.enabled = true; inherit.mode = ParticleSystemInheritVelocityMode.Initial; inherit.curve = 0.3f;
            var force = p.forceOverLifetime; force.enabled = true; force.space = ParticleSystemSimulationSpace.World;
            force.x = Wind.x * 0.6f; force.y = Wind.y * 0.6f; force.z = Wind.z * 0.6f;
            var drag = p.limitVelocityOverLifetime; drag.enabled = true; drag.drag = 1.6f; drag.multiplyDragByParticleSize = false;
            var size = p.sizeOverLifetime; size.enabled = true; size.size = new ParticleSystem.MinMaxCurve(1f, AnimationCurve.Linear(0f, 0.6f, 1f, 3.2f));
            var col = p.colorOverLifetime; col.enabled = true;
            var g = new Gradient();
            g.SetKeys(new[] { new GradientColorKey(Color.white, 0f), new GradientColorKey(Color.white, 1f) },
                      new[] { new GradientAlphaKey(0f, 0f), new GradientAlphaKey(1f, 0.08f), new GradientAlphaKey(0.45f, 0.5f), new GradientAlphaKey(0f, 1f) });
            col.color = g;
            var rot = p.rotationOverLifetime; rot.enabled = true; rot.z = new ParticleSystem.MinMaxCurve(-0.8f, 0.8f);
            var coll = p.collision; coll.enabled = false;
            var r = p.GetComponent<ParticleSystemRenderer>();
            r.renderMode = ParticleSystemRenderMode.Billboard;
            r.sortMode = ParticleSystemSortMode.Distance;
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            r.receiveShadows = false;
            r.maxParticleSize = 0.35f;
            if (!p.isPlaying) p.Play();
        }

        float Rand() { dice ^= dice << 13; dice ^= dice >> 17; dice ^= dice << 5; return dice * (1f / 4294967296f); }

        void Update()
        {
            if (Pipes.Length == 0) return;
            float dt = Time.deltaTime;
            runTime += dt;
            ref var s = ref car.State;
            float throttle = car.Frozen ? 0f : s.Throttle;
            float rpm01 = car.Spec.Redline > 0 ? s.Rpm / car.Spec.Redline : 0f;
            float cold = 1f - math.saturate(runTime / WarmUpSeconds);
            var look = Look(throttle, rpm01, cold);
            var cam = Camera.main;
            bool seen = cam == null || (cam.transform.position - transform.position).sqrMagnitude < CullDistance * CullDistance;
            bool underWater = s.WaterDepth > 0.5f;
            float rate = seen && !underWater ? look.Rate : 0f;
            var colour = new Color(look.Grey, look.Grey, look.Grey * 1.02f, look.Alpha);
            foreach (var p in Pipes)
            {
                if (p == null) continue;
                var em = p.emission; em.rateOverTime = rate;
                var main = p.main;
                main.startSize = new ParticleSystem.MinMaxCurve(look.Size * 0.8f, look.Size * 1.2f);
                main.startLifetime = new ParticleSystem.MinMaxCurve(look.Life * 0.7f, look.Life);
                main.startColor = colour;
            }
            if (seen && !underWater)
            {
                // Floored from low rpm: a short dark puff of rich mixture.
                if (throttle > 0.85f && lastThrottle < 0.5f && rpm01 < 0.4f) Puff(10, 0.2f, 0.65f, look.Size * 1.4f);
                // Lift-off at high rpm: sometimes a pop and a tiny flash.
                if (throttle < 0.1f && lastThrottle > 0.6f && rpm01 > 0.75f && Rand() < 0.45f)
                {
                    Puff(3, 0.3f, 0.5f, look.Size);
                    if (Flash != null) { Flash.enabled = true; flashUntil = Time.time + 0.05f; }
                }
            }
            if (Flash != null && Flash.enabled && Time.time > flashUntil) Flash.enabled = false;
            lastThrottle = throttle;
        }

        /// <summary>A burst of darker smoke from every pipe (upshift, floored throttle, backfire).</summary>
        public void Puff(int count, float grey, float alpha, float size)
        {
            foreach (var p in Pipes)
            {
                if (p == null) continue;
                var e = new ParticleSystem.EmitParams { startColor = new Color(grey, grey, grey, alpha), startSize = size, applyShapeToPosition = true };
                p.Emit(e, count);
            }
        }
    }
}
