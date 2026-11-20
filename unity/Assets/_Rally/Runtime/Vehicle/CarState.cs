using Rally.Core;
using Unity.Mathematics;

namespace Rally.Vehicle
{
    /// <summary>
    /// Everything mutable in the JS Car instance (car.js:337–387 constructor fields), as an unmanaged struct
    /// so CarSim can run without a scene (EditMode tests, a head-less server) and later under Burst.
    /// Positions are Unity world metres (x east, z north, y up); the long-lived UTM position is
    /// <see cref="Utm"/>. The visual block (VisualPos / VisualRotation / WheelY) is the JS updateVisual
    /// result that the MonoBehaviour copies onto transforms.
    /// </summary>
    public struct CarState
    {
        public float3 Pos;
        /// <summary>World-frame planar velocity (x, z) — momentum lives in the world frame (car.js:1141).</summary>
        public float2 Vel;
        /// <summary>Vertical speed while following the surface (m/s).</summary>
        public float GroundVy;
        public float PrevGroundY;
        public bool HasPrevGroundY;
        /// <summary>Counts <see cref="CarSim.Reset(ref CarState, in CarSpec, IGround, float2, float)"/> calls: CarController checks every new placement for solids.</summary>
        public int Resets;
        public float Yaw, SpawnYaw, YawVel, VerticalVel, Bounce, BounceVel;
        public bool Grounded;
        public float Steer, SteerVisual, VF, VR, Speed;
        public bool OnRoad;
        public Surface SurfaceKind;
        public bool Drifting;
        public float AirTime, LandingImpact, Distance;
        public bool WrongWay;
        /// <summary>Water over the ground under the car, once the body is in it (m).</summary>
        public float WaterDepth;
        public float WaterSurface;
        /// <summary>Entry splash strength this frame (0 = none).</summary>
        public float Splash;
        /// <summary>Bow spray wanted this frame (grounded, wading, moving).</summary>
        public bool Spraying;
        /// <summary>Fished out of deep water this frame.</summary>
        public bool Recovered;
        public float SunkTime;
        /// <summary>Last pose on dry ground, for the recovery.</summary>
        public float2 LastDry;
        public float LastDryYaw;
        public bool HasLastDry;
        /// <summary>Speed into a wall this frame (m/s), for sound and shake.</summary>
        public float Crash;

        public float Pitch, Roll, BodyRoll, BodyPitch, WheelSpin;
        /// <summary>Rear wheels stop turning on the handbrake.</summary>
        public float RearSpin;
        /// <summary>0 right after a handbrake slide, recovers to 1.</summary>
        public float SlideGrip;
        public SlideMode SlideMode;
        public float4 WheelCompression;
        /// <summary>Wheelspin: the driven wheels' surface speed minus the ground speed (m/s, signed like the drive). CarSim.SlipTarget.</summary>
        public float WheelSlip;

        // Drivetrain state.
        public int Gear;
        public bool AutoShift;
        /// <summary>Engine revs as heard and shown (with the wheelspin flare).</summary>
        public float Rpm;
        /// <summary>Revs from the road speed: what the torque curve, the limiter and the automatic box use (CarSim.UpdateDrivetrain).</summary>
        public float RoadRpm;
        public float ShiftTimer, EngineLoad;
        /// <summary>Turbo boost 0..1 (cars with CarSpec.TurboLag &gt; 0): builds under throttle above mid revs, collapses off it.</summary>
        public float Boost;
        public bool Limiter;
        public float AirborneAt, AirControl, RoadLift;
        public bool HandbrakeOn;
        public float Progress;
        /// <summary>Drivetrain throttle after the reverse swap (for dust and audio).</summary>
        public float Throttle;
        public float PrevVF;
        public bool HasPrevVF;
        /// <summary>The gravel wander's dice (car.js:1087 Math.random), seeded so replays agree.</summary>
        public RallyRandom Random;
        public CarDamage Damage;

        // Visual block (car.js:1312 updateVisual).
        public float3 VisualPos;
        public quaternion VisualRotation;
        /// <summary>Wheel pivot height in car space per wheel (0 FL, 1 FR, 2 RL, 3 RR).</summary>
        public float4 WheelY;
        public float ShadowOpacity;

        public Utm33 Utm => FloatingOrigin.ToUtm(Pos);
        public float SpeedKmh => Speed * 3.6f;

        /// <summary>car.js:337–387: a car fresh from the garage, grounded at the origin.</summary>
        public static CarState Create(in CarSpec spec, ulong seed = 1)
        {
            var s = default(CarState);
            s.Grounded = true;
            s.SurfaceKind = Surface.Offroad;
            s.SlideGrip = 1f;
            s.SlideMode = SlideMode.Minimal;
            s.Gear = 1;
            s.AutoShift = true;
            s.Rpm = spec.Idle;
            s.RoadRpm = spec.Idle;
            s.AirborneAt = -1f;
            s.Random = new RallyRandom(seed);
            s.VisualRotation = quaternion.identity;
            s.WheelY = new float4(spec.WheelRadius);
            s.ShadowOpacity = 1f;
            return s;
        }
    }
}
