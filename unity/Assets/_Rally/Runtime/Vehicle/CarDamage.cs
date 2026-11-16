using Unity.Mathematics;

namespace Rally.Vehicle
{
    /// <summary>
    /// Per-system damage 0..1, owned by the car (Rally.Gameplay reads <see cref="Total"/>). Not in the JS;
    /// added so hits change how the car drives (CarSim reads these as parameters only, so the sim stays
    /// deterministic) and how it looks (CarDamageVisual). Severity of a hit is the kinetic energy of what hit
    /// relative to a 1.2 t car at 80 km/h, the same yardstick Gameplay used.
    /// </summary>
    public struct CarDamage
    {
        /// <summary>Power loss and misfire; at 1 the car is wrecked.</summary>
        public float Engine;
        /// <summary>Slower steering response.</summary>
        public float Steering;
        /// <summary>Steering pull bias in steer units (−1..1), negative = pulls towards −x (left in the Unity frame).</summary>
        public float SteeringPull;
        /// <summary>Softer spring, lower travel, visible lean, per wheel (0 FL, 1 FR, 2 RL, 3 RR).</summary>
        public float SuspensionFL, SuspensionFR, SuspensionRL, SuspensionRR;
        /// <summary>Overheating: engine damage grows with time at high rpm.</summary>
        public float Radiator;
        /// <summary>Cosmetic panels.</summary>
        public float Body;
        public float Windscreen;
        public float LightsL, LightsR;
        /// <summary>Set once Engine reaches 1: the car stops and the game flow shows RETIRED.</summary>
        public bool Wrecked;

        const float ReferenceEnergy = 1200f * 22.2f * 22.2f; // 1.2 t at 80 km/h (½ cancels)

        public float Suspension(int wheel)
        {
            switch (wheel) { case 0: return SuspensionFL; case 1: return SuspensionFR; case 2: return SuspensionRL; default: return SuspensionRR; }
        }
        public float SuspensionAverage => 0.25f * (SuspensionFL + SuspensionFR + SuspensionRL + SuspensionRR);

        /// <summary>0..1 for the HUD: weighted so the engine dominates (it is what retires the car).</summary>
        public float Total => math.clamp(
            0.35f * Engine + 0.15f * Steering + 0.15f * SuspensionAverage + 0.1f * Radiator + 0.15f * Body
            + 0.05f * Windscreen + 0.05f * 0.5f * (LightsL + LightsR), 0f, 1f);

        /// <summary>
        /// A hit. <paramref name="normalLocal"/> is the push-out normal in car space (x right, z forward):
        /// a frontal hit has normal.z &lt; 0 (the wall pushes the car back), a hit on the left side has
        /// normal.x &gt; 0. <paramref name="speedInto"/> is the closing speed (m/s) and <paramref name="mass"/>
        /// the mass of what was hit (a wall: the car's own mass; an animal: its mass).
        /// </summary>
        public void Apply(float3 normalLocal, float speedInto, float mass)
        {
            if (speedInto <= 0f) return;
            float sev = math.clamp(mass * speedInto * speedInto / ReferenceEnergy, 0f, 1f);
            if (sev < 0.002f) return;
            float nx = normalLocal.x, nz = normalLocal.z;
            if (-nz > 0.5f)
            {
                // Front: engine, radiator, lights (the side the normal leans to is hit harder), glass.
                Engine = math.min(1f, Engine + 0.8f * sev);
                Radiator = math.min(1f, Radiator + sev);
                float toLeft = math.clamp(0.5f + nx, 0.2f, 1f), toRight = math.clamp(0.5f - nx, 0.2f, 1f);
                LightsL = math.min(1f, LightsL + 1.2f * sev * toLeft);
                LightsR = math.min(1f, LightsR + 1.2f * sev * toRight);
                Windscreen = math.min(1f, Windscreen + 0.5f * sev);
                Body = math.min(1f, Body + 0.5f * sev);
            }
            else if (math.abs(nx) > 0.5f)
            {
                // Side: steering and the suspension on that side. Normal +x = the obstacle is on the left.
                Steering = math.min(1f, Steering + 0.6f * sev);
                SteeringPull = math.clamp(SteeringPull - math.sign(nx) * 0.3f * sev, -1f, 1f);
                if (nx > 0f) { SuspensionFL = math.min(1f, SuspensionFL + sev); SuspensionRL = math.min(1f, SuspensionRL + sev); }
                else { SuspensionFR = math.min(1f, SuspensionFR + sev); SuspensionRR = math.min(1f, SuspensionRR + sev); }
                Body = math.min(1f, Body + 0.6f * sev);
            }
            else
            {
                Body = math.min(1f, Body + sev);
            }
            if (Engine >= 1f) Wrecked = true;
        }

        /// <summary>Service park: everything back to new.</summary>
        public void Repair() { this = default; }
    }
}
