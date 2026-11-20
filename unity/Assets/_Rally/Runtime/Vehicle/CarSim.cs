using System;
using Rally.Core;
using Rally.Track;
using Unity.Mathematics;

namespace Rally.Vehicle
{
    /// <summary>
    /// The arcade-sim car (1:1 port of legacy-js/src/car.js, the physics half). A real physics engine is
    /// heavier than this game needs: the terrain is a height field, so a raycast vehicle with spring
    /// suspension and a slip-based tyre model gives the same feel with far less integration risk. The
    /// numbers were tuned over many sessions and are ported, not re-tuned; each carries the car.js line it
    /// came from. Pure: no scene, no allocation, every query goes through <see cref="IGround"/> (which
    /// includes the road ribbon lift, car.js groundAt) and <see cref="IRoute"/>.
    /// Frame: Unity world (x east, z north, y up). Positive yaw turns from +z towards +x.
    /// </summary>
    public static class CarSim
    {
        public const float Gravity = 9.81f;            // car.js:20 — real gravity, so a crest taken fast really launches the car
        public const float TakeoffLook = 0.3f;         // car.js:21 — s of ballistic flight tested against the ground ahead
        public const float TakeoffClearance = 0.25f;   // car.js:22 — m of gap the free path must open by the end of the look
        public const float SlopeG = 13.5f;             // car.js:24 — effective gravity along slopes (≈1.4 g): hills bite
        public const int MaxSubsteps = 8;              // car.js:31
        public const float SubstepDt = 1f / 120f;      // car.js:942
        public const float WaterDrag = 0.22f;          // car.js:32 — v² drag per metre of wetted depth (m⁻¹)
        public const float WaterDragMax = 16f;         // car.js:33 — m/s²: deep water stops a car hard, not instantly
        public const float OffroadMaxSpeed = 50f / 3.6f; // car.js:34 — the JS cars' rough-ground limit; per car now: CarSpec.OffroadMax
        public const float SinkDepth = 1.3f;           // car.js:35 — roof under: the engine is dead
        public const float SinkTime = 2.5f;            // car.js:36 — seconds under before the car is fished out
        public const float CarRadius = 1.05f;          // car.js:37 — the car as a disc, for house walls
        public const float WallBounce = 0.25f;         // car.js:38 — how much of the speed into a wall comes back
        public const float WallScrape = 0.85f;         // car.js:39 — speed kept after a hit
        public const int Reverse = 0;                  // car.js:44
        public const float ShiftTime = 0.24f;          // car.js:51
        /// <summary>Share of torque and power a turbo engine makes with no boost (CarSpec.TurboLag &gt; 0).</summary>
        public const float OffBoost = 0.55f;
        public const float MaxSteerLow = 0.6f;         // car.js:110 — rad of front-wheel angle at walking pace
        public const float MaxSteerHigh = 0.08f;       // car.js:111 — rad at 50 m/s
        /// <summary>Damage: the speed an engine at damage 1 could still reach is nil; healthy it is above any gear (m/s).</summary>
        public const float DamageSpeedCapHealthy = 80f;
        /// <summary>Wheelspin: m/s of slip per unit of drive demand over the surface's spin point (× Spin × SpinGain).</summary>
        public const float SlipPerGrip = 3f;
        /// <summary>Slip (m/s) at which a spinning wheel has lost the surface's full SpinLoss of traction (quadratic below it).</summary>
        public const float SlipFull = 10f;

        /* ---------------- helpers (geo.js:122–139) ---------------- */

        public static float Damp(float current, float target, float lambda, float dt) => math.lerp(current, target, 1f - math.exp(-lambda * dt));

        public static float WrapAngle(float a)
        {
            while (a > math.PI) a -= math.PI * 2f;
            while (a < -math.PI) a += math.PI * 2f;
            return a;
        }

        /// <summary>JS Math.sign (0 for 0).</summary>
        static float Sign(float v) => v > 0f ? 1f : v < 0f ? -1f : 0f;
        static float Hypot(float a, float b) => math.sqrt(a * a + b * b);

        /// <summary>car.js:784 forward.</summary>
        public static float2 Forward(float yaw) => new float2(math.sin(yaw), math.cos(yaw));
        /// <summary>car.js:822 right: the +x side at yaw 0 (the car's right in the Unity frame).</summary>
        public static float2 Right(float yaw) => new float2(math.cos(yaw), -math.sin(yaw));

        /// <summary>Wheel offsets in car space (car.js:515): 0 FL, 1 FR, 2 RL, 3 RR as (x, z).</summary>
        public static float2 WheelOffset(in CarSpec spec, int i)
        {
            float x = (i & 1) == 0 ? -spec.Track / 2f : spec.Track / 2f;
            float z = i < 2 ? spec.FrontAxle : spec.FrontAxle - spec.Wheelbase;
            return new float2(x, z);
        }
        public static bool WheelIsFront(int i) => i < 2;

        static float2 WheelWorld(in CarState s, in CarSpec spec, int i, float2 f, float2 r)
        {
            var w = WheelOffset(spec, i);
            return s.Pos.xz + f * w.y + r * w.x;
        }

        /// <summary>car.js:134 engineTorque: torquey mid-range, falls off at the redline.</summary>
        public static float EngineTorque(in CarSpec spec, float rpm)
        {
            float x = math.clamp((rpm - spec.Idle) / (spec.Redline - spec.Idle), 0f, 1f);
            // A soft peak around 65% of the rev range, then a gentle drop-off.
            float curve = math.sin(math.PI * math.pow(x, 0.9f)) * 0.55f + 0.55f;
            return spec.Torque * math.clamp(curve, 0.25f, 1f);
        }

        /// <summary>terrain.js:165 gradient: central differences of the ground.</summary>
        static float2 Gradient(IGround ground, float2 xz, float e)
        {
            float gx = (ground.HeightAt(new float2(xz.x + e, xz.y)) - ground.HeightAt(new float2(xz.x - e, xz.y))) / (2f * e);
            float gz = (ground.HeightAt(new float2(xz.x, xz.y + e)) - ground.HeightAt(new float2(xz.x, xz.y - e))) / (2f * e);
            return new float2(gx, gz);
        }

        /// <summary>
        /// Wheelspin target (m/s, ≥ 0) for a drive asking for <paramref name="demand"/> (m/s²) from tyres that can give
        /// <paramref name="grip"/> (m/s²): nothing below the surface's spin point (SpinAt × grip), then growing with the excess,
        /// the car's tyres (<see cref="CarSpec.Spin"/>) and the surface (SpinGain). More power or less grip spins more.
        /// </summary>
        public static float SlipTarget(in CarSpec spec, in SurfaceModel surface, float demand, float grip)
            => grip > 0.01f ? spec.Spin * surface.SpinGain * SlipPerGrip * math.max(0f, demand / grip - surface.SpinAt) : 0f;

        /// <summary>The wheels' surface speed at the redline in a gear (m/s): a spinning wheel never runs past it.</summary>
        public static float GearWheelSpeed(in CarSpec spec, int gear)
            => spec.Redline / 60f * 2f * math.PI * spec.WheelRadius / math.max(0.01f, math.abs(spec.GearRatio(gear)) * spec.FinalDrive);

        /* ---------------- reset (car.js:739) ---------------- */

        /// <summary>car.js:739 reset(pose): stop the car on the ground at a pose. Keeps the sliding mode, auto box and damage.</summary>
        public static void Reset(ref CarState s, in CarSpec spec, IGround ground, float2 xz, float yaw)
        {
            s.Pos = new float3(xz.x, ground.HeightAt(xz), xz.y);
            s.Vel = float2.zero;
            s.GroundVy = 0f;
            s.HasPrevGroundY = false;
            s.Yaw = yaw;
            s.SpawnYaw = yaw;
            s.YawVel = 0f;
            s.VerticalVel = 0f;
            s.Bounce = 0f;
            s.BounceVel = 0f;
            s.Grounded = true;
            s.Steer = 0f;
            s.SteerVisual = 0f;
            s.Speed = 0f;
            s.VF = 0f;
            s.VR = 0f;
            s.Pitch = 0f;
            s.Roll = 0f;
            s.BodyRoll = 0f;
            s.BodyPitch = 0f;
            s.AirTime = 0f;
            s.LandingImpact = 0f;
            s.Distance = 0f;
            s.WrongWay = false;
            s.Gear = 1;
            s.Rpm = spec.Idle;
            s.RoadRpm = spec.Idle;
            s.Boost = 0f;
            s.ShiftTimer = 0f;
            s.AirborneAt = -1f;
            s.VisualPos = s.Pos;
            s.VisualRotation = quaternion.RotateY(yaw);
            s.WaterDepth = 0f;
            s.SunkTime = 0f;
            s.WheelSlip = 0f;
        }

        /// <summary>car.js:731 setRoute / reset(): the route's start pose, or the origin without one.</summary>
        public static void Reset(ref CarState s, in CarSpec spec, IGround ground, IRoute route)
        {
            if (route != null) { var p = route.StartPose(); Reset(ref s, spec, ground, p.XZ, p.Yaw); }
            else Reset(ref s, spec, ground, float2.zero, 0f);
        }

        /* ---------------- drivetrain (car.js:838) ---------------- */

        public struct Drivetrain
        {
            public float DriveForce, EngineBrake, Brake, Throttle;
        }

        /// <summary>car.js:831 shift.</summary>
        static void Shift(ref CarState s, in CarSpec spec, int nextGear)
        {
            int gear = math.clamp(nextGear, 0, spec.GearCount - 1);
            if (gear == s.Gear) return;
            s.Gear = gear;
            s.ShiftTimer = ShiftTime;
        }

        /// <summary>car.js:838 updateDrivetrain: revs, auto/manual box, limiter, torque at the wheels and engine braking. Once per frame.</summary>
        public static Drivetrain UpdateDrivetrain(ref CarState s, in CarSpec spec, in CarInput input, float dt)
        {
            float throttle = math.clamp(input.Throttle, 0f, 1f);
            float brake = math.clamp(input.Brake, 0f, 1f);
            bool reversing = s.Gear == Reverse;
            float wheelSpeed = math.abs(s.VF);
            float wheelRpm = (wheelSpeed / (2f * math.PI * spec.WheelRadius)) * 60f;
            float ratio = math.abs(spec.GearRatio(s.Gear)) * spec.FinalDrive;
            float rawRpm = wheelRpm * ratio;
            float targetRpm = math.clamp(rawRpm, spec.Idle, spec.Redline);
            // Blip the revs a little under throttle even when stationary.
            float powerInput = reversing ? brake : throttle;
            float freeRev = powerInput > 0f && wheelSpeed < 1f ? 1f : 0f;
            s.RoadRpm = Damp(s.RoadRpm, math.max(targetRpm, spec.Idle + freeRev * 2600f), 9f, dt);
            // What you hear and see: the engine turns with the driven wheels, which run ahead of the ground while they spin, so
            // the revs flare. The torque, the limiter and the box stay on the road revs (what a spinning wheel loses is the
            // surface's SpinLoss, in the substep), so a car that does not spin drives exactly as before.
            float flareRpm = math.clamp(math.abs(s.VF + s.WheelSlip) / (2f * math.PI * spec.WheelRadius) * 60f * ratio, spec.Idle, spec.Redline);
            s.Rpm = Damp(s.Rpm, math.max(flareRpm, spec.Idle + freeRev * 2600f), 9f, dt);
            // Rev limiter: on the redline (manual box, or a long downhill) the ignition cuts until the revs drop.
            s.Limiter = rawRpm >= spec.Redline * 0.995f;

            s.ShiftTimer = math.max(0f, s.ShiftTimer - dt);
            if (s.Gear == Reverse)
            {
                if (throttle > 0.1f && s.VF > -0.5f) Shift(ref s, spec, 1);
            }
            else if (brake > 0.5f && s.VF < 0.4f && math.abs(s.VF) < 1.4f)
            {
                Shift(ref s, spec, Reverse);
            }

            if (s.AutoShift && s.ShiftTimer <= 0f)
            {
                if (s.Gear != Reverse)
                {
                    if (s.RoadRpm > spec.Upshift && throttle > 0.25f && s.Gear < spec.GearCount - 1) Shift(ref s, spec, s.Gear + 1);
                    else if (s.RoadRpm < spec.Downshift && s.Gear > 1) Shift(ref s, spec, s.Gear - 1);
                }
            }
            else if (!s.AutoShift)
            {
                if (input.ShiftUp) Shift(ref s, spec, s.Gear + 1);
                if (input.ShiftDown && s.Gear > 1) Shift(ref s, spec, s.Gear - 1);
            }

            // Damage: a holed radiator cooks the engine, fastest when it is revving hard.
            if (s.Damage.Radiator > 0f && !s.Damage.Wrecked)
            {
                float hot = s.RoadRpm > spec.Redline * 0.7f ? 1f : 0.15f;
                s.Damage.Engine = math.min(1f, s.Damage.Engine + dt * s.Damage.Radiator * 0.02f * hot);
                if (s.Damage.Engine >= 1f) s.Damage.Wrecked = true;
            }
            float health = s.Damage.Wrecked ? 0f : 1f - 0.6f * s.Damage.Engine;

            // Turbo: boost builds over TurboLag seconds under throttle once the revs are past ~40 %, and drops three times as fast.
            float boost = 1f;
            if (spec.TurboLag > 0f)
            {
                float revs = math.saturate((s.RoadRpm - spec.Idle) / (spec.Redline - spec.Idle));
                float want = powerInput * math.smoothstep(0.3f, 0.6f, revs);
                float rate = (want > s.Boost ? 1f : 3f) / spec.TurboLag;
                s.Boost = math.clamp(s.Boost + math.clamp(want - s.Boost, -rate * dt, rate * dt), 0f, 1f);
                boost = OffBoost + (1f - OffBoost) * s.Boost;
            }

            // Torque at the wheels, minus a clutch cut while shifting.
            bool shifting = s.ShiftTimer > 0.12f;
            float torque = EngineTorque(spec, s.RoadRpm) * boost * powerInput * (shifting ? 0.15f : 1f) * (s.Grounded ? 1f : 0.35f) * (s.Limiter ? 0f : 1f);
            // Damage: drive force × (1 − 0.6·Engine), the power limit included, so a sick engine is weak at speed too.
            float driveForce = math.min((torque * ratio) / spec.WheelRadius, spec.Power * boost / math.max(math.abs(s.VF), 3f)) * health * (reversing ? -1f : 1f);
            float engineBrake = powerInput == 0f && math.abs(s.VF) > 1f
                ? -(Sign(s.VF) * (28f + s.RoadRpm * 0.012f) * math.abs(ratio) * 0.16f)
                : 0f;
            s.EngineLoad = powerInput;

            return new Drivetrain
            {
                DriveForce = driveForce,
                EngineBrake = engineBrake,
                // In reverse, the throttle key is the brake and the brake key is the reverse throttle (car.js:887).
                Brake = s.Damage.Wrecked ? 1f : (reversing ? throttle : brake),
                Throttle = powerInput,
            };
        }

        /* ---------------- frame (car.js:895 update) ---------------- */

        /// <summary>One rendered frame without a route or walls (the task's minimal signature).</summary>
        public static void Step(ref CarState s, in CarSpec spec, in CarInput input, IGround ground, float dt)
            => Step(ref s, spec, input, ground, null, ReadOnlySpan<WallBox>.Empty, dt);

        /// <summary>
        /// car.js:895 update(dt, input): one rendered frame. Fixed substeps (≤ 8 × 1/120 s) keep the suspension
        /// stable when a frame hitches, and a fine step is what stops a fast car from falling through the
        /// ground. <paramref name="walls"/> are the house boxes near the car (looked up once per frame, not
        /// per substep, car.js:941); pass an empty span when PhysX resolves walls instead.
        /// </summary>
        public static void Step(ref CarState s, in CarSpec spec, in CarInput input, IGround ground, IRoute route, ReadOnlySpan<WallBox> walls, float dt)
        {
            s.SlideMode = input.GripMode;
            // Damage: a bent steering arm pulls and answers more slowly.
            float steerTarget = math.clamp(input.Steer + s.Damage.SteeringPull, -1f, 1f);
            s.Steer = Damp(s.Steer, steerTarget, 12f * (1f - 0.5f * s.Damage.Steering), dt);

            RouteQuery q = default;
            bool hasRoute = route != null;
            float half = 0f;
            if (hasRoute)
            {
                q = route.Nearest(s.Pos.xz, 120f);
                half = q.HalfWidth > 0f ? q.HalfWidth : route.RoadWidth;
                s.OnRoad = q.Distance <= half + 1.0f;
                // A stage line is one lane wide (and the endless line follows one road): a car on any drawn road is on the road,
                // or the right lane of a two-lane road or a parallel road counted as rough ground and held the car at 50 km/h.
                if (!s.OnRoad) { var gs = ground.SurfaceAt(s.Pos.xz); if (gs == Surface.Asphalt || gs == Surface.Gravel) { s.OnRoad = true; q.Surface = gs; } }
                s.Progress = q.Progress;
                s.RoadLift = RoadConstants.SurfaceLift(q.Distance, half);
            }
            else
            {
                s.OnRoad = false;
                s.Progress = 0f;
                s.RoadLift = 0f;
            }

            if (input.Frozen)
            {
                s.Vel = float2.zero;
                s.VF = 0f; s.VR = 0f; s.Speed = 0f;
                s.YawVel = 0f; s.VerticalVel = 0f;
                s.Bounce = 0f; s.BounceVel = 0f;
                s.Grounded = true;
                s.Pos.y = ground.HeightAt(s.Pos.xz);
                s.Throttle = 0f;
                s.WheelSlip = 0f;
                s.Drifting = false;
                s.Crash = 0f;
                UpdateVisual(ref s, spec, ground, dt);
                return;
            }

            s.HandbrakeOn = input.Handbrake;
            s.Crash = 0f;
            int steps = math.clamp((int)math.ceil(dt / SubstepDt), 1, MaxSubsteps);
            float h = dt / steps;
            s.SurfaceKind = s.OnRoad ? q.Surface : Surface.Offroad;   // car.js:944 (water counts as the gravel fallback)
            var surface = SurfaceModel.For(s.SurfaceKind);
            var drivetrain = UpdateDrivetrain(ref s, spec, input, dt);
            s.Throttle = drivetrain.Throttle;
            bool jumpRequested = false;

            for (int step = 0; step < steps; step++)
            {
                SimulateStep(ref s, spec, input, h, drivetrain, surface, input.Jump && !jumpRequested, ground, walls);
                if (input.Jump) jumpRequested = true;
            }

            float speed = Hypot(s.VF, s.VR);
            s.Speed = speed;
            s.Distance += math.abs(s.VF) * dt;
            s.AirTime = s.Grounded ? math.max(0f, s.AirTime - dt * 3f) : s.AirTime + dt;

            if (hasRoute && q.Hit && speed > 4f && !route.Free)
            {
                float dot = (s.Vel.x * q.Tangent.x + s.Vel.y * q.Tangent.y) / math.max(0.001f, speed);
                s.WrongWay = dot < -0.35f;
            }
            else s.WrongWay = false;

            UpdateVisual(ref s, spec, ground, dt);
            UpdateWater(ref s, spec, ground, route, dt, speed);
        }

        /* ---------------- substep (car.js:989 simulateStep) ---------------- */

        static void SimulateStep(ref CarState s, in CarSpec spec, in CarInput input, float h, in Drivetrain drivetrain, in SurfaceModel surface,
            bool jump, IGround ground, ReadOnlySpan<WallBox> walls)
        {
            var f = Forward(s.Yaw);
            var r = Right(s.Yaw);
            float vF = s.VF;
            float vR = s.VR;
            float suspDamage = s.Damage.SuspensionAverage;
            float springK = spec.SpringK * (1f - 0.5f * suspDamage);
            float travelDown = spec.TravelDown * (1f - 0.4f * suspDamage);
            float travelUp = spec.TravelUp * (1f - 0.4f * suspDamage);

            if (s.Grounded)
            {
                // Engine, brakes and the ground. Whatever the gearing multiplies the torque to, the driven
                // tyres can only push as hard as they grip. Wet tyres grip less, and an engine under water hardly pushes.
                float wet = 1f - 0.5f * math.clamp(s.WaterDepth / 0.5f, 0f, 1f);
                float bonus = spec.GripBonus(s.SurfaceKind) * wet;
                float drowned = s.WaterDepth > 0.8f ? 0.15f : 1f;

                // The slope under the car, along its axis and across it. On the road sample the carved slab
                // itself (±1.8 m), not the hillside blend beside it (car.js:1007).
                var g = Gradient(ground, s.Pos.xz, s.OnRoad ? 1.8f : 6f);
                float gF = g.x * f.x + g.y * f.y;
                float gR = g.x * r.x + g.y * r.y;
                float sinF = gF / Hypot(1f, gF);
                float sinR = gR / Hypot(1f, gR);
                float cosF = 1f / Hypot(1f, gF);
                float cosR = 1f / Hypot(1f, gR);
                // Climb limit: up to the car's maxClimb the tyres are guaranteed enough bite to beat gravity
                // (a margin that shrinks towards the limit); past it gravity wins (car.js:1014).
                float limit = spec.MaxClimb * math.PI / 180f;
                float climbF = math.atan(math.abs(gF));
                float climbR = math.atan(math.abs(gR));
                float holdF = climbF <= limit && !input.Handbrake
                    ? (SlopeG * math.abs(sinF) + surface.Rolling) * (1.1f + 0.5f * (1f - climbF / limit)) * drowned
                    : 0f;
                float holdR = climbR <= limit ? SlopeG * math.abs(sinR) * 0.8f * 1.1f : 0f;

                float grip = surface.Mu * bonus * spec.DriveLoad * 9.81f * cosF * (input.Handbrake ? 0.3f : 1f) * drowned;
                // Wheelspin: a drive asking for more than the ground gives spins the driven wheels up (sooner on loose ground,
                // never past the gear's redline), and a spinning tyre pushes less. Locked rears on the handbrake do not spin.
                float slipWant = input.Handbrake ? 0f : SlipTarget(spec, surface, math.abs(drivetrain.DriveForce) / spec.Mass, grip);
                float slipCap = math.max(0f, GearWheelSpeed(spec, s.Gear) * 0.97f - math.abs(vF));
                slipWant = math.min(slipWant, slipCap) * Sign(drivetrain.DriveForce);
                s.WheelSlip = Damp(s.WheelSlip, slipWant, math.abs(slipWant) > math.abs(s.WheelSlip) ? 10f : 6f, h);
                s.WheelSlip = math.clamp(s.WheelSlip, -slipCap, slipCap);
                // A tyre at a small slip is still near its peak; only a wheel spinning hard loses the surface's SpinLoss.
                float spun = math.saturate(math.abs(s.WheelSlip) / SlipFull);
                float spinLoss = 1f - surface.SpinLoss * spun * spun;
                float maxDrive = math.max(grip * spinLoss, holdF);
                float driveAccel = math.clamp(drivetrain.DriveForce / spec.Mass, -maxDrive, maxDrive);
                // Off the road the ground takes the power: no drive past the car's rough-ground speed (car.js:1031, 50 km/h there).
                if (!s.OnRoad && math.abs(vF) >= spec.OffroadMax && Sign(driveAccel) == Sign(vF)) driveAccel = 0f;
                // Damage: a sick engine runs out of breath early.
                float damageCap = DamageSpeedCapHealthy * (1f - s.Damage.Engine);
                if (math.abs(vF) >= damageCap && Sign(driveAccel) == Sign(vF)) driveAccel = 0f;
                vF += driveAccel * h;
                if (drivetrain.Brake > 0f)
                {
                    vF -= Sign(vF) * math.min(math.abs(vF) / h, 21f * drivetrain.Brake) * h;
                }
                if (input.Handbrake)
                {
                    // Locked rear wheels: sliding friction on the rear axle, no more.
                    vF -= Sign(vF) * math.min(math.abs(vF) / h, 4.2f * surface.Mu) * h;
                }
                vF += (drivetrain.EngineBrake / spec.Mass) * h;

                // Rolling resistance, aero drag and the extra cost of rough ground.
                vF -= Sign(vF) * surface.Rolling * h;
                vF -= vF * math.abs(vF) * surface.Drag * spec.Aero * h;   // per car: CarSpec.Aero
                vF -= vF * (s.OnRoad ? 0.02f : 0.12f) * h;
                if (!s.OnRoad)
                {
                    // Rough ground bleeds off anything above the car's rough-ground speed (downhill, or arriving fast from the road).
                    float over = math.abs(vF) - spec.OffroadMax;
                    if (over > 0f) vF -= Sign(vF) * math.min(over, math.min(8f, 2f + over) * h);
                }
                if (s.WaterDepth > 0f)
                {
                    // Water drag: grows with the square of speed and the wetted depth.
                    float k = WaterDrag * math.min(s.WaterDepth, 1.2f);
                    vF -= Sign(vF) * math.min(math.abs(vF) / h, math.min(WaterDragMax, k * vF * vF)) * h;
                    vR -= Sign(vR) * math.min(math.abs(vR) / h, math.min(WaterDragMax, k * vR * vR)) * h;
                }
                if (drivetrain.Throttle == 0f && drivetrain.Brake == 0f && math.abs(vF) < 3.5f)
                {
                    vF *= math.exp(-4.5f * h);
                }

                // Gravity down the hill: g·sin θ along and across the car.
                vF += -SlopeG * sinF * h;
                vR += -SlopeG * sinR * h * 0.8f;

                // Slip-based lateral tyre force (car.js:1065). The peak grip happens at a small slip angle, then
                // falls away: that is what lets the tail step out on gravel and on the handbrake without the car
                // feeling like it is on ice. Handbrake: the locked rear axle has almost no sideways grip; after
                // release the grip comes back over a short moment instead of snapping the car straight.
                var gm = GripMode.For(s.SlideMode);
                var pl = (int)s.SlideMode <= 1 && spec.Planted.Has ? spec.Planted : Planted.None;
                float loose = surface.Loose * gm.Loose * pl.Loose;
                s.SlideGrip = input.Handbrake ? 0f : math.min(1f, s.SlideGrip + h / gm.Recover);
                bool sliding = input.Handbrake || s.SlideGrip < 1f;
                float slip = math.atan2(math.abs(vR), math.max(1.2f, math.abs(vF)));
                float curveC = 1.55f + loose * 0.3f + (sliding ? 0.35f : 0f); // more fall-off past the peak
                float shape = math.sin(curveC * math.atan(surface.SlipK * gm.SlipK * slip));
                float handbrake = input.Handbrake ? 0.2f - loose * 0.06f : math.lerp(0.35f, 1f, s.SlideGrip);
                float mu = surface.Mu * bonus * handbrake;
                float maxLat = math.max(mu * 9.81f * surface.Peak * gm.Lateral * pl.Lateral * cosR, holdR);
                float latForce = -Sign(vR) * maxLat * math.clamp(shape, 0f, 1f) * math.clamp(math.abs(vR) / 0.35f, 0f, 1f);
                vR += latForce * h;

                // Ruts and loose stones make the tail wander a little (car.js:1086).
                if (loose > 0f && math.abs(vF) > 4f)
                {
                    vR += (s.Random.NextFloat() - 0.5f) * (1.2f + loose * 3f) * pl.Wander * h;
                }

                // Steering: a bicycle model (yaw rate = v·tan δ / wheelbase) whose front-wheel angle shrinks
                // with speed, capped by what the tyres can hold (car.js:1090).
                float absV = math.abs(vF);
                float delta = s.Steer * math.lerp(MaxSteerLow, MaxSteerHigh, math.clamp(absV / 50f, 0f, 1f));
                float kinematic = (vF * math.tan(delta)) / spec.Wheelbase;
                // Normal grip: the car may only ask for the yaw rate its tyres can deliver (lateral grip / speed);
                // loose mode allows 1.1 g plus a bonus on loose ground.
                float yawFromGrip = (maxLat / math.max(absV, 4f)) * gm.YawByGrip * pl.Yaw;
                float yawArcade = ((surface.Mu * 9.81f * 1.1f) / math.max(absV, 4f)) * (1f + loose * 0.6f);
                float yawCap = (gm.YawByGrip != 0f ? math.min(yawFromGrip, yawArcade) : yawArcade) * (sliding ? 2.4f : 1f);
                float targetYawVel = math.clamp(kinematic, -yawCap, yawCap) * math.clamp(absV / 1.5f, 0f, 1f);
                float gripResponse = (input.Handbrake ? 2.6f : sliding ? 4.5f : 8.0f - loose * 3f) * pl.Response;
                s.YawVel = Damp(s.YawVel, targetYawVel, gripResponse, h);
                if (input.Handbrake && absV > 5f)
                {
                    // Initiation: yank the tail round in the steered direction.
                    s.YawVel += s.Steer * (2.4f + loose * 1.2f) * math.clamp(absV / 15f, 0f, 1f) * h;
                    vR -= s.Steer * (1.6f + loose) * math.clamp(absV / 15f, 0f, 1f) * h;
                }
                // Power oversteer on loose ground: a rear-engined car swings its tail.
                if (loose > 0f && drivetrain.Throttle > 0.6f && absV > 6f)
                {
                    float kick = gm.Kick * pl.Kick;
                    s.YawVel += s.Steer * drivetrain.Throttle * loose * 1.6f * kick * math.clamp(absV / 15f, 0f, 1f) * h;
                    vR -= s.Steer * drivetrain.Throttle * loose * 2.2f * kick * h;
                }
                s.Drifting = math.abs(vR) > (2.6f - loose * 1.0f) && Hypot(vF, vR) > 6f;

                // Jump: a vertical impulse off the springs. Only from a grounded stance (car.js:1120).
                if (jump && s.AirTime < 0.15f)
                {
                    // Lift the chassis clear of the surface first, otherwise the landing check at the end of
                    // this same step would immediately cancel the jump.
                    float gy = ground.HeightAt(s.Pos.xz);
                    s.Pos.y = gy + 0.22f;
                    s.Bounce = 0.22f;
                    s.BounceVel = 0f;
                    s.VerticalVel = spec.Jump;
                    s.Grounded = false;
                    s.AirTime = 0f;
                    s.AirborneAt = 0f;
                }
            }
            else
            {
                // Airborne: keep the engine spinning, allow a little yaw authority (car.js:1133).
                s.Drifting = false;
                s.WheelSlip = Damp(s.WheelSlip, 0f, 3f, h);
                s.YawVel = Damp(s.YawVel, s.YawVel * 0.985f, 0.3f, h);
                vF -= vF * 0.035f * h;
                s.AirControl = Damp(s.AirControl, s.Steer * 0.55f, 2.0f, h);
                s.YawVel += s.AirControl * h;
            }

            // Momentum lives in the world frame: the body turns *under* the velocity, so yawing faster than
            // the tyres can bend the path leaves the car travelling sideways (slip) until the lateral grip
            // pulls it back. This is what makes a handbrake turn or a gravel slide actually slide (car.js:1141).
            float vx = f.x * vF + r.x * vR;
            float vz = f.y * vF + r.y * vR;
            s.Yaw = WrapAngle(s.Yaw + s.YawVel * h);
            var f2 = Forward(s.Yaw);
            var r2 = Right(s.Yaw);
            vF = vx * f2.x + vz * f2.y;
            vR = vx * r2.x + vz * r2.y;
            s.Vel = new float2(vx, vz);

            float nx = s.Pos.x + s.Vel.x * h;
            float nz = s.Pos.z + s.Vel.y * h;
            if (ground.IsLoaded(new float2(nx, nz)))   // terrain.inside(nx, nz, 3) in the JS: the car waits at the edge
            {
                s.Pos.x = nx;
                s.Pos.z = nz;
            }
            else
            {
                s.Vel *= 0.2f;
                vF *= 0.2f;
                vR *= 0.2f;
            }

            // Houses are solid (car.js:1165): push the car back out of any wall it ran into, kill the speed
            // into the wall (a little bounce), keep most of the rest.
            for (int i = 0; i < walls.Length; i++)
            {
                if (!walls[i].PushOut(s.Pos.x, s.Pos.z, CarRadius, out float wnx, out float wnz, out float depth)) continue;
                ApplyWallHit(ref s, new float2(wnx, wnz), depth);
                vF = s.Vel.x * f2.x + s.Vel.y * f2.y;
                vR = s.Vel.x * r2.x + s.Vel.y * r2.y;
            }

            float groundY = ground.HeightAt(s.Pos.xz);
            // Anti-tunneling recovery (car.js:1189): if a hiccup ever leaves the body well below the surface,
            // snap back up instead of driving inside the mountain.
            if (s.Pos.y < groundY - 0.9f)
            {
                s.Pos.y = groundY;
                s.Bounce = 0f;
                s.BounceVel = math.max(0f, s.BounceVel);
                s.VerticalVel = 0f;
                s.Grounded = true;
            }
            if (s.Grounded)
            {
                // Spring/damper body bounce around the surface, then the four raycast wheel contacts decide
                // whether there is still ground under the car (car.js:1199).
                s.BounceVel += (-springK * s.Bounce - spec.SpringD * s.BounceVel) * h;
                // Real suspension travel: the body may dip a hand's width, no more. Anything beyond that is
                // absorbed by the wheels (UpdateVisual).
                s.Bounce = math.clamp(s.Bounce + s.BounceVel * h, -travelDown, travelUp);
                if (s.Bounce <= -travelDown) s.BounceVel = math.max(0f, s.BounceVel);
                s.Pos.y = groundY + s.Bounce;

                // Take-off is ballistic (car.js:1209): the car carries the vertical speed the ground has been
                // giving it, and when free flight with that speed would clear the ground ahead (a crest or a
                // jump taken fast enough, gravity no longer able to bend the path down onto the surface), it
                // flies. The decision uses the speed from before this step, so a lip launches the car with the
                // ramp's lift instead of the drop beyond it.
                float speed = Hypot(vF, vR);
                if (speed > 3f)
                {
                    float ovx = f.x * vF + r.x * vR;
                    float ovz = f.y * vF + r.y * vR;
                    // The free path (from the surface, not the sprung body) must be above the ground from the
                    // very next step (on a ramp it is below it by ½gt² until the lip, however close the drop
                    // beyond) all the way out, and have opened a real gap by the end of the look: a kink in
                    // the surface or a small bump lifts the car a few centimetres, which the suspension takes
                    // without the body ever flying.
                    bool clears = true;
                    for (int c = 0; c < 4 && clears; c++)
                    {
                        float t = c == 0 ? h : c == 1 ? TakeoffLook / 3f : c == 2 ? (2f * TakeoffLook) / 3f : TakeoffLook;
                        float margin = c == 3 ? TakeoffClearance : 0f;
                        float ahead = ground.HeightAt(new float2(s.Pos.x + ovx * t, s.Pos.z + ovz * t));
                        float free = groundY + s.GroundVy * t - 0.5f * Gravity * t * t;
                        if (free <= ahead + margin) clears = false;
                    }
                    // ...and no wheel may be pressed into a slope above the body (the front axle on a steep
                    // climb), which is what would count as a landing one step later; a little slack so the two
                    // rules never alternate.
                    if (clears)
                    {
                        for (int w = 0; w < 4; w++)
                        {
                            if (ground.HeightAt(WheelWorld(s, spec, w, f, r)) - 0.3f >= s.Pos.y - 0.05f) { clears = false; break; }
                        }
                    }
                    if (clears)
                    {
                        s.Grounded = false;
                        s.AirborneAt = 0f;
                        s.VerticalVel = s.GroundVy;
                    }
                }
                // Surface-following vertical speed from the ground's motion under the car, capped at a 1:1
                // slope: steeper is a bank or a step the car rides over, not a ramp (and a snap or respawn is
                // not a launch either) (car.js:1246).
                if (s.HasPrevGroundY && speed > 3f)
                {
                    float cap = speed;
                    s.GroundVy = Damp(s.GroundVy, math.clamp((groundY - s.PrevGroundY) / h, -cap, cap), 120f, h);
                }
                else
                {
                    s.GroundVy = 0f;
                }
                s.PrevGroundY = groundY;
                s.HasPrevGroundY = true;
                int contacts = s.Grounded ? SampleWheels(ref s, spec, ground, groundY) : 0;
                if (s.Grounded && contacts == 0 && s.Pos.y > groundY + 0.5f)
                {
                    s.Grounded = false;
                    s.AirborneAt = 0f;
                    s.VerticalVel = math.max(0.6f, s.VerticalVel);
                }
            }
            else
            {
                s.VerticalVel -= Gravity * h;
                s.Pos.y += s.VerticalVel * h;
                if (s.AirborneAt >= 0f) s.AirborneAt += h;
                // Whichever wheel reaches the ground first ends the flight (car.js:1266): on an upslope that is
                // the front axle, well before the body's own footprint (less the suspension travel, so a crest
                // under the rear axle does not count as a landing).
                float landY = groundY;
                for (int w = 0; w < 4; w++) landY = math.max(landY, ground.HeightAt(WheelWorld(s, spec, w, f, r)) - 0.3f);
                if (s.Pos.y <= landY)
                {
                    // The suspension eats the landing instead of the car snapping to the surface. A hard
                    // landing bottoms out the springs and pitches forward.
                    float impact = -s.VerticalVel;
                    s.LandingImpact = math.clamp(impact / 12f, 0f, 1f);
                    s.Pos.y = groundY;
                    s.Bounce = -math.clamp(impact * 0.015f, 0f, travelDown);
                    s.BounceVel = -math.clamp(impact * 0.12f, 0f, 2.4f);
                    s.VerticalVel = 0f;
                    // The landing takes the vertical momentum: the ground-following speed starts again from
                    // rest, otherwise the lift remembered from the ramp would throw the car straight back up.
                    s.GroundVy = 0f;
                    s.PrevGroundY = groundY;
                    s.HasPrevGroundY = true;
                    s.Grounded = true;
                    s.AirborneAt = -1f;
                }
            }

            s.VF = vF;
            s.VR = vR;
        }

        /// <summary>
        /// car.js:1172–1181, the wall rule shared by the CPU box test and the PhysX path: move out along the
        /// normal, reflect WallBounce of the speed into the wall, keep WallScrape of the rest, log the crash.
        /// Returns the speed that went into the wall (0 when the car was already leaving it).
        /// </summary>
        public static float ApplyWallHit(ref CarState s, float2 normal, float depth)
        {
            s.Pos.x += normal.x * depth;
            s.Pos.z += normal.y * depth;
            float vn = s.Vel.x * normal.x + s.Vel.y * normal.y;
            if (vn >= 0f) return 0f;
            s.Vel -= normal * vn * (1f + WallBounce);
            s.Vel *= WallScrape;
            s.Crash = math.max(s.Crash, -vn);
            s.LandingImpact = math.max(s.LandingImpact, math.clamp(-vn / 15f, 0f, 1f));
            s.YawVel *= 0.5f;
            return -vn;
        }

        /// <summary>Re-project the world velocity onto the body axes after an external change to Vel (a PhysX push-out).</summary>
        public static void SyncBodyVelocity(ref CarState s)
        {
            var f = Forward(s.Yaw);
            var r = Right(s.Yaw);
            s.VF = s.Vel.x * f.x + s.Vel.y * f.y;
            s.VR = s.Vel.x * r.x + s.Vel.y * r.y;
            s.Speed = Hypot(s.VF, s.VR);
        }

        /// <summary>car.js:1296 sampleWheels: sample each wheel's patch and return how many are in contact.</summary>
        static int SampleWheels(ref CarState s, in CarSpec spec, IGround ground, float groundY)
        {
            var f = Forward(s.Yaw);
            var r = Right(s.Yaw);
            int contacts = 0;
            for (int i = 0; i < 4; i++)
            {
                float gy = ground.HeightAt(WheelWorld(s, spec, i, f, r));
                float drop = groundY - gy;
                s.WheelCompression[i] = math.clamp(drop * 1.6f, -0.22f, 0.3f);
                if (gy < s.Pos.y + 0.55f) contacts++;
            }
            return contacts;
        }

        /* ---------------- visual block (car.js:1312 updateVisual) ---------------- */

        /// <summary>
        /// car.js:1312 updateVisual: body pitch/roll from ground samples, weight transfer, wheel spin, and each
        /// wheel dropping or lifting to meet the ground beneath it (in car space) so the tyres follow ruts and
        /// crests instead of hovering or clipping. Writes VisualPos / VisualRotation / WheelY.
        /// </summary>
        public static void UpdateVisual(ref CarState s, in CarSpec spec, IGround ground, float dt)
        {
            var f = Forward(s.Yaw);
            var r = Right(s.Yaw);
            const float e = 3.2f;
            float hFront = ground.HeightAt(s.Pos.xz + f * 1.4f);
            float hBack = ground.HeightAt(s.Pos.xz - f * 1.4f);
            float hRight = ground.HeightAt(s.Pos.xz + r * 0.85f);
            float hLeft = ground.HeightAt(s.Pos.xz - r * 0.85f);

            float pitchTarget, rollTarget;
            if (s.Grounded)
            {
                pitchTarget = math.clamp(math.atan2(hBack - hFront, e), -0.7f, 0.7f);
                rollTarget = math.clamp(math.atan2(hRight - hLeft, e * 0.54f), -0.6f, 0.6f);
            }
            else
            {
                pitchTarget = math.clamp(-s.VerticalVel * 0.035f, -0.4f, 0.4f);
                rollTarget = s.Roll * 0.98f;
            }
            // Damage: a crushed corner leans the body towards it.
            rollTarget += 0.06f * ((s.Damage.SuspensionFR + s.Damage.SuspensionRR) - (s.Damage.SuspensionFL + s.Damage.SuspensionRL)) * 0.5f;

            s.Pitch = Damp(s.Pitch, pitchTarget, s.Grounded ? 10f : 2f, dt);
            s.Roll = Damp(s.Roll, rollTarget, s.Grounded ? 9f : 2f, dt);

            // Weight transfer: lean into corners, dive under braking, squat on power.
            float lateralAccel = s.YawVel * s.VF;
            float longitudinalAccel = (s.VF - (s.HasPrevVF ? s.PrevVF : s.VF)) / math.max(dt, 0.0001f);
            s.PrevVF = s.VF;
            s.HasPrevVF = true;
            s.BodyRoll = Damp(s.BodyRoll, math.clamp(-lateralAccel * 0.010f, -0.16f, 0.16f), 7f, dt);
            s.BodyPitch = Damp(s.BodyPitch, math.clamp(-longitudinalAccel * 0.006f, -0.09f, 0.09f) + s.Bounce * 0.35f, 7f, dt);

            var pos = s.Pos;
            pos.y += 0.02f + s.Bounce * 0.25f;
            // Same composition as the JS (qYaw · qPitch · qRoll); the axis-angle quaternion maths is identical.
            var rot = math.mul(quaternion.RotateY(s.Yaw), math.mul(quaternion.RotateX(s.Pitch + s.BodyPitch), quaternion.RotateZ(s.Roll + s.BodyRoll)));
            var inv = math.inverse(rot);

            s.SteerVisual = Damp(s.SteerVisual, s.Steer * 0.48f, 12f, dt);
            // Driven wheels turn at wheel speed (ground speed plus the wheelspin): the rears always, the fronts on a 4WD.
            s.WheelSpin += ((s.VF + (spec.Drive == DriveType.All ? s.WheelSlip : 0f)) / spec.WheelRadius) * dt;
            if (!s.HandbrakeOn) s.RearSpin += ((s.VF + s.WheelSlip) / spec.WheelRadius) * dt; // locked rears stand still
            // Each wheel drops or lifts to meet the ground beneath it (in car space).
            float R = spec.WheelRadius;
            float lift = 0f;
            for (int i = 0; i < 4; i++)
            {
                float travelDown = spec.TravelDown * (1f - 0.4f * s.Damage.Suspension(i));
                float travelUp = spec.TravelUp * (1f - 0.4f * s.Damage.Suspension(i));
                float maxUp = R + travelDown;
                var w = WheelOffset(spec, i);
                var wxz = s.Pos.xz + f * w.y + r * w.x;
                var world = new float3(wxz.x, ground.HeightAt(wxz), wxz.y);
                var local = math.mul(inv, world - pos);
                float want = local.y + R;
                // Ground higher than the suspension can absorb: lift the whole body.
                if (s.Grounded && want > maxUp) lift = math.max(lift, want - maxUp);
                float rest = s.Grounded ? math.clamp(want, R - travelUp, maxUp) : R - travelUp * 0.6f;
                // Compression is instant (the ground pushes the wheel up); rebound is damped.
                s.WheelY[i] = rest >= s.WheelY[i] ? rest : Damp(s.WheelY[i], rest, 22f, dt);
            }
            if (lift > 0f) pos.y += lift;
            // Final guarantee in world space: no wheel's lowest point under the ground at its own position,
            // whatever the body's pitch and roll did.
            float deficit = 0f;
            for (int i = 0; i < 4; i++)
            {
                var w = WheelOffset(spec, i);
                var world = math.mul(rot, new float3(w.x, s.WheelY[i], w.y)) + pos;
                float bottom = world.y - R;
                deficit = math.max(deficit, ground.HeightAt(world.xz) - bottom);
            }
            if (deficit > 0.005f) pos.y += deficit;

            s.VisualPos = pos;
            s.VisualRotation = rot;
            s.ShadowOpacity = math.clamp(1f - s.AirTime * 1.4f, 0f, 1f);
        }

        /// <summary>
        /// car.js:1524 wantDust: asphalt stays clean unless the tyres are sliding (then it is smoke); gravel and
        /// open ground throw a plume at speed. Pure so tests can count it; CarEffects turns it into particles.
        /// </summary>
        public static bool WantDust(in CarState s)
        {
            var surface = SurfaceModel.For(s.SurfaceKind);
            bool sliding = s.Drifting || s.HandbrakeOn;
            return s.Grounded && s.Speed > 5f
                && ((surface.Dust && (!s.OnRoad || sliding || s.Throttle > 0.9f || s.Speed > 12f)) || (!surface.Dust && sliding));
        }

        /* ---------------- water (car.js:1407 updateWater) ---------------- */

        /// <summary>
        /// car.js:1407 updateWater: splash on entry, bow spray while wading, the sink timer and the recovery
        /// onto the last dry ground. The drag itself is in the substep.
        /// </summary>
        static void UpdateWater(ref CarState s, in CarSpec spec, IGround ground, IRoute route, float dt, float speed)
        {
            var w = ground.WaterAt(s.Pos.xz);
            // Only water the body has actually reached counts: a car flying over the fjord is dry until it comes down.
            bool touching = w.Depth > 0f && s.Grounded && s.Pos.y <= w.SurfaceY + 0.15f;
            float depth = touching ? w.Depth : 0f;
            s.Splash = 0f;
            s.Recovered = false;
            s.Spraying = false;
            // Two splashes: the wheels breaking the surface at the shore, and the bonnet going under when the
            // bed drops away into deep water.
            bool shoreline = depth > 0.08f && s.WaterDepth <= 0.08f;
            bool plunge = depth > 0.6f && s.WaterDepth <= 0.6f && s.WaterDepth > 0f;
            if (shoreline || plunge)
            {
                float impact = speed + 12f * s.LandingImpact;
                if (impact > 2f)
                {
                    s.Splash = math.clamp(impact / 25f, 0.15f, 1f) * (plunge ? 1f : math.clamp(depth / 0.6f, 0.4f, 1f));
                    s.WaterSurface = w.SurfaceY;
                }
            }
            s.WaterDepth = depth;
            s.WaterSurface = w.Depth > 0f ? w.SurfaceY : s.Pos.y;
            if (depth <= 0f)
            {
                if (s.Grounded && speed > 1f) { s.LastDry = s.Pos.xz; s.LastDryYaw = s.Yaw; s.HasLastDry = true; }
                s.SunkTime = 0f;
            }
            else
            {
                if (s.Grounded && speed > 2.5f) s.Spraying = true;
                if (depth >= SinkDepth)
                {
                    s.SunkTime += dt;
                    if (s.SunkTime > SinkTime)
                    {
                        // Roof under for a while: fish the car out onto the last dry ground.
                        if (s.HasLastDry) Reset(ref s, spec, ground, s.LastDry, s.LastDryYaw);
                        else Reset(ref s, spec, ground, route);
                        s.Recovered = true;
                    }
                }
            }
        }
    }
}
