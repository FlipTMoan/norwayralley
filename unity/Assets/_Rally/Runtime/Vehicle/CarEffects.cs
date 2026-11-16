using UnityEngine;

namespace Rally.Vehicle
{
    /// <summary>
    /// The car's particle and light effects, driven from <see cref="CarState"/> (the port of car.js
    /// updateDust / emitSplash / emitSpray on URP particle systems): dust or tyre smoke, water spray and the
    /// entry splash, an exhaust pop on upshifts, skid marks, brake lights and headlights after dark.
    /// Prefab slots: Dust / Spray / Exhaust particle systems (world-space simulation), two rear TrailRenderers
    /// for skid marks, the brake-light renderer (emissive material), two headlight spot lights.
    /// </summary>
    [RequireComponent(typeof(CarController))]
    public sealed class CarEffects : MonoBehaviour
    {
        public ParticleSystem Dust, Spray, Exhaust;
        public TrailRenderer SkidRearLeft, SkidRearRight;
        public Renderer BrakeLights;
        public Light HeadlightL, HeadlightR;
        public CarDamageVisual DamageVisual;
        [Tooltip("car.js:1525 — gravel plume / tyre smoke on asphalt.")]
        public Color DustGravel = new Color(0.81f, 0.76f, 0.63f), DustSmoke = new Color(0.85f, 0.85f, 0.84f);
        [Tooltip("Lateral slip (m/s) above which the rear tyres draw marks.")]
        public float SkidSlip = 2.0f;
        [Tooltip("Sun intensity below which the headlights come on (SkyAndTime drives RenderSettings.sun).")]
        public float DarkBelow = 0.3f;

        static readonly int EmissionId = Shader.PropertyToID("_EmissionColor");
        CarController car;
        MaterialPropertyBlock block;
        bool brakeLit;

        void Awake()
        {
            car = GetComponent<CarController>();
            block = new MaterialPropertyBlock();
            car.Shifted += OnShifted;
            car.Collided += OnCollided;
            if (DamageVisual == null) DamageVisual = GetComponent<CarDamageVisual>();
        }

        void OnDestroy()
        {
            if (car == null) return;
            car.Shifted -= OnShifted;
            car.Collided -= OnCollided;
        }

        void Update()
        {
            ref var s = ref car.State;
            float speed = s.Speed;

            if (Dust != null)
            {
                var em = Dust.emission;
                em.rateOverTime = CarSim.WantDust(s) ? 40f + speed * 3f : 0f;
                var main = Dust.main;
                main.startColor = SurfaceModel.For(s.SurfaceKind).Dust ? DustGravel : DustSmoke;
            }
            if (Spray != null)
            {
                var em = Spray.emission;
                em.rateOverTime = s.Spraying ? 60f + speed * 6f : 0f;
                if (s.Splash > 0f) Spray.Emit(Mathf.RoundToInt(40f + 120f * s.Splash)); // car.js:1458
            }
            bool skid = s.Grounded && (Mathf.Abs(s.VR) > SkidSlip || (s.HandbrakeOn && speed > 3f));
            if (SkidRearLeft != null) SkidRearLeft.emitting = skid;
            if (SkidRearRight != null) SkidRearRight.emitting = skid;

            bool braking = car.LastInput.Brake > 0.1f && !car.Frozen;
            if (BrakeLights != null && braking != brakeLit)
            {
                brakeLit = braking;
                BrakeLights.GetPropertyBlock(block);
                block.SetColor(EmissionId, braking ? new Color(1f, 0.15f, 0.1f) * 4f : Color.black);
                BrakeLights.SetPropertyBlock(block);
            }

            bool dark = RenderSettings.sun == null || RenderSettings.sun.intensity < DarkBelow;
            if (HeadlightL != null) HeadlightL.enabled = dark && s.Damage.LightsL < 0.6f;
            if (HeadlightR != null) HeadlightR.enabled = dark && s.Damage.LightsR < 0.6f;

            if (DamageVisual != null) DamageVisual.Apply(s.Damage);
        }

        void OnShifted(int from, int to)
        {
            if (to > from && Exhaust != null) Exhaust.Emit(6);
        }

        void OnCollided(CollisionEvent ev)
        {
            if (DamageVisual != null) DamageVisual.OnImpact(ev, car.Spec);
        }

        /// <summary>Damage hook (0..1): crumple blend shape through CarDamageVisual when the model has one.</summary>
        public void SetDamage(float damage)
        {
            if (DamageVisual != null) DamageVisual.SetCrumple(damage);
        }
    }
}
