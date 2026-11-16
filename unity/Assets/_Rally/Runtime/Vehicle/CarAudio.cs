using Rally.Core;
using UnityEngine;

namespace Rally.Vehicle
{
    /// <summary>
    /// Port of legacy-js/src/audio.js: a tiny synthesized soundtrack — engine (two detuned oscillators),
    /// wind, gravel rumble, tyre squeal, wading — plus the thud and splash one-shots. No audio files.
    /// Unity's web player has no OnAudioFilterRead, no PCM streaming and no runtime audio filters, so every
    /// voice is baked once at start-up into a looping AudioClip (with the JS biquad applied offline) and then
    /// only pitched and faded, which is what audio.js did with setTargetAtTime. The engine note is pitched by
    /// the real rpm instead of the JS fake gearbox. Web audio starts only after a user gesture: Unity resumes
    /// the context on the first click/key itself; <see cref="Started"/> gates the voices until then.
    /// </summary>
    [RequireComponent(typeof(CarController))]
    public sealed class CarAudio : MonoBehaviour
    {
        const int Rate = 22050;
        const float Master = 0.55f;           // audio.js:22
        const float EngineBaseHz = 100f;      // the baked engine clip's fundamental; pitch = wanted / base

        public bool Muted;
        /// <summary>Set true on the first user gesture (the UI does this); until then nothing plays.</summary>
        public bool Started;

        CarController car;
        AudioSource engine, wind, gravel, skid, wade, oneShot;
        AudioClip thudClip, splashClip;
        float[] noise; // the shared 2 s noise bed (audio.js:48)

        void Awake()
        {
            car = GetComponent<CarController>();
            noise = new float[Rate * 2];
            var rng = new RallyRandom(7);
            float last = 0f;
            for (int i = 0; i < noise.Length; i++)
            {
                float white = rng.NextFloat() * 2f - 1f;
                last = last * 0.72f + white * 0.28f;
                noise[i] = last;
            }
            engine = Voice("engine", EngineClip(), true);
            wind = Voice("wind", NoiseClip(Biquad.Bandpass(900f, 0.6f)), true);     // audio.js:74
            gravel = Voice("gravel", NoiseClip(Biquad.Lowpass(340f, 1.2f)), true);  // audio.js:75
            skid = Voice("skid", NoiseClip(Biquad.Bandpass(1500f, 3.5f)), true);    // audio.js:76
            wade = Voice("wade", NoiseClip(Biquad.Lowpass(420f, 0.9f)), true);      // audio.js:77
            oneShot = Voice("oneshot", null, false);
            thudClip = ThudClip();
            splashClip = SplashClip();
            car.Collided += OnCollided;
        }

        void OnDestroy() { if (car != null) car.Collided -= OnCollided; }

        AudioSource Voice(string name, AudioClip clip, bool loop)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, false);
            var src = go.AddComponent<AudioSource>();
            src.clip = clip;
            src.loop = loop;
            src.playOnAwake = false;
            src.spatialBlend = 0f;
            src.volume = 0f;
            return src;
        }

        /// <summary>Engine: saw + 0.35 · square an octave down (audio.js:34–43), through the 900 Hz / Q 1.4 low-pass (audio.js:30).</summary>
        AudioClip EngineClip()
        {
            int n = Rate; // one second: an integer number of cycles at 100 Hz, so the loop is seamless
            var data = new float[n];
            for (int i = 0; i < n; i++)
            {
                float t = (float)i / Rate;
                float phase = (t * EngineBaseHz) % 1f;
                float saw = 2f * phase - 1f;
                float sq = ((t * EngineBaseHz * 0.5f) % 1f) < 0.5f ? 1f : -1f;
                data[i] = (saw + 0.35f * sq) * 0.5f;
            }
            Biquad.Lowpass(900f, 1.4f).Apply(data);
            return Make("engine", data);
        }

        AudioClip NoiseClip(Biquad filter)
        {
            var data = (float[])noise.Clone();
            filter.Apply(data);
            return Make(filter.ToString(), data);
        }

        /// <summary>audio.js:125 thud: noise through a low-pass sweeping 420 → 90 Hz over 0.3 s, a fast attack and decay.</summary>
        AudioClip ThudClip()
        {
            int n = (int)(Rate * 0.4f);
            var data = new float[n];
            for (int i = 0; i < n; i++)
            {
                float t = (float)i / Rate;
                float env = t < 0.012f ? t / 0.012f : Mathf.Exp(-(t - 0.012f) * 11f);
                data[i] = noise[i] * env;
            }
            Biquad.Lowpass(200f, 0.8f).Apply(data);
            return Make("thud", data);
        }

        /// <summary>audio.js:145 splash: a bright slap, then a low whoomph that darkens as it decays.</summary>
        AudioClip SplashClip()
        {
            int n = (int)(Rate * 1.1f);
            var slap = new float[n]; var whoomph = new float[n];
            for (int i = 0; i < n; i++)
            {
                float t = (float)i / Rate;
                slap[i] = noise[i] * (t < 0.025f ? t / 0.025f : Mathf.Exp(-(t - 0.025f) * 22f));
                whoomph[i] = noise[(i * 7) % noise.Length] * (t < 0.025f ? t / 0.025f : Mathf.Exp(-(t - 0.025f) * 4f));
            }
            Biquad.Bandpass(1800f, 1f).Apply(slap);
            Biquad.Lowpass(600f, 0.7f).Apply(whoomph);
            var data = new float[n];
            for (int i = 0; i < n; i++) data[i] = Mathf.Clamp(slap[i] * 0.6f + whoomph[i] * 1.2f, -1f, 1f);
            return Make("splash", data);
        }

        static AudioClip Make(string name, float[] data)
        {
            var clip = AudioClip.Create(name, data.Length, 1, Rate, false);
            clip.SetData(data, 0);
            return clip;
        }

        static float Fade(float current, float target, float tau, float dt) => Mathf.Lerp(current, target, 1f - Mathf.Exp(-dt / tau));

        void Update()
        {
            if (!Started) return;
            if (!engine.isPlaying) { engine.Play(); wind.Play(); gravel.Play(); skid.Play(); wade.Play(); }
            ref var s = ref car.State;
            float dt = Time.deltaTime;
            float master = Muted ? 0f : Master;
            float speed = s.Speed;
            float throttle = s.Throttle;
            bool running = !car.Frozen && !s.Damage.Wrecked;

            // audio.js:105–114, with the real rpm: idle sits at the JS 42 Hz floor, the redline near its 170 Hz top.
            float revs = Mathf.InverseLerp(car.Spec.Idle, car.Spec.Redline, s.Rpm);
            float freq = 42f + revs * 128f;
            // Damage: a sick engine misfires — the note stutters.
            if (s.Damage.Engine > 0.2f && Mathf.PerlinNoise(Time.time * 9f, 0f) < s.Damage.Engine * 0.5f) freq *= 0.85f;
            engine.pitch = Fade(engine.pitch, freq / EngineBaseHz, 0.035f, dt);
            engine.volume = Fade(engine.volume, (running ? 0.10f + throttle * 0.12f + speed * 0.0015f : 0f) * master, 0.08f, dt);

            wind.volume = Fade(wind.volume, Mathf.Min(0.14f, speed * 0.0028f) * master, 0.12f, dt);
            wind.pitch = Fade(wind.pitch, (700f + speed * 22f) / 900f, 0.15f, dt);
            // Surface rumble: open ground as in the JS, half of it on a gravel road, none on asphalt.
            float rumble = !running ? 0f : !s.OnRoad ? 1f : s.SurfaceKind == Surface.Gravel ? 0.5f : 0f;
            gravel.volume = Fade(gravel.volume, Mathf.Min(0.11f, speed * 0.0032f) * rumble * master, 0.09f, dt);
            skid.volume = Fade(skid.volume, running && s.Drifting ? Mathf.Min(0.10f, speed * 0.0025f) * master : 0f, 0.05f, dt);
            float depth = s.WaterDepth;
            wade.volume = Fade(wade.volume, depth > 0f ? Mathf.Min(0.16f, speed * 0.006f * Mathf.Min(1f, depth / 0.4f)) * master : 0f, 0.08f, dt);

            if (s.Splash > 0f) oneShot.PlayOneShot(splashClip, (0.22f + 0.45f * s.Splash) * master);
        }

        void OnCollided(CollisionEvent ev)
        {
            if (!Started || ev.SpeedInto < 1f) return;
            float strength = Mathf.Clamp01(ev.SpeedInto / 15f);
            oneShot.PlayOneShot(thudClip, (0.3f + 0.5f * strength) * (Muted ? 0f : Master));
        }

        /// <summary>RBJ cookbook biquad, applied offline so the web build needs no runtime filters.</summary>
        struct Biquad
        {
            float b0, b1, b2, a1, a2;
            string label;

            public static Biquad Lowpass(float freq, float q)
            {
                float w0 = 2f * Mathf.PI * freq / Rate, cs = Mathf.Cos(w0), sn = Mathf.Sin(w0), alpha = sn / (2f * q);
                float a0 = 1f + alpha;
                return new Biquad { b0 = (1f - cs) / 2f / a0, b1 = (1f - cs) / a0, b2 = (1f - cs) / 2f / a0, a1 = -2f * cs / a0, a2 = (1f - alpha) / a0, label = "lowpass" + freq };
            }

            public static Biquad Bandpass(float freq, float q)
            {
                float w0 = 2f * Mathf.PI * freq / Rate, cs = Mathf.Cos(w0), sn = Mathf.Sin(w0), alpha = sn / (2f * q);
                float a0 = 1f + alpha;
                return new Biquad { b0 = alpha / a0, b1 = 0f, b2 = -alpha / a0, a1 = -2f * cs / a0, a2 = (1f - alpha) / a0, label = "bandpass" + freq };
            }

            public void Apply(float[] x)
            {
                float x1 = 0f, x2 = 0f, y1 = 0f, y2 = 0f;
                for (int i = 0; i < x.Length; i++)
                {
                    float x0 = x[i];
                    float y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
                    x2 = x1; x1 = x0; y2 = y1; y1 = y0;
                    x[i] = Mathf.Clamp(y0, -1f, 1f);
                }
            }

            public override string ToString() => label;
        }
    }
}
