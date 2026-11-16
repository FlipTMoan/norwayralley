using Rally.Core;
using Unity.Collections;
using Unity.Mathematics;

namespace Rally.Vehicle
{
    public enum CarKind : byte { Porsche, Buggy }

    /// <summary>Sliding levels 0–3 in order (car.js:109 SLIDE_LEVELS); the value is the level.</summary>
    public enum SlideMode : byte { Minimal = 0, Normal = 1, Medium = 2, Loose = 3 }

    /// <summary>
    /// Surface model (car.js:92 SURFACES). `Peak` scales the lateral grip, `Loose` how progressively the
    /// tyres let go (and how much the tail comes round on the throttle), `Dust` whether the wheels throw a plume.
    /// </summary>
    public struct SurfaceModel
    {
        public float Mu, Rolling, Drag, Peak, Loose, SlipK;
        public bool Dust;

        public static readonly SurfaceModel Asphalt = new SurfaceModel { Mu = 1.08f, Rolling = 0.4f, Drag = 0.0011f, Peak = 1.2f, Loose = 0f, SlipK = 9.0f, Dust = false };  // car.js:93
        public static readonly SurfaceModel Gravel = new SurfaceModel { Mu = 0.86f, Rolling = 0.9f, Drag = 0.0013f, Peak = 0.95f, Loose = 0.35f, SlipK = 6.0f, Dust = true }; // car.js:94
        public static readonly SurfaceModel Offroad = new SurfaceModel { Mu = 0.7f, Rolling = 2.0f, Drag = 0.003f, Peak = 0.85f, Loose = 0.55f, SlipK = 5.0f, Dust = true };  // car.js:95

        /// <summary>car.js:945 `SURFACES[kind] || SURFACES.gravel`.</summary>
        public static SurfaceModel For(Surface kind)
        {
            switch (kind)
            {
                case Surface.Asphalt: return Asphalt;
                case Surface.Offroad: return Offroad;
                default: return Gravel;
            }
        }
    }

    /// <summary>
    /// Sliding setting (car.js:102 GRIP_MODES). `Normal` keeps the tyres inside their grip unless you provoke
    /// them (handbrake, hard throttle on gravel); `Loose` is the arcade drift feel where the tail comes round
    /// on every corner.
    /// </summary>
    public struct GripMode
    {
        public float Lateral, SlipK, Loose, YawByGrip, Recover, Kick;

        public static readonly GripMode Minimal = new GripMode { Lateral = 1.5f, SlipK = 2.2f, Loose = 0.2f, YawByGrip = 0.9f, Recover = 0.35f, Kick = 0.3f };  // car.js:103 planted, slides only when thrown
        public static readonly GripMode Normal = new GripMode { Lateral = 1.3f, SlipK = 1.6f, Loose = 0.4f, YawByGrip = 0.95f, Recover = 0.45f, Kick = 0.6f };  // car.js:104 natural grip
        public static readonly GripMode Medium = new GripMode { Lateral = 1.15f, SlipK = 1.3f, Loose = 0.7f, YawByGrip = 1.15f, Recover = 0.55f, Kick = 0.8f }; // car.js:105 lively tail
        public static readonly GripMode LooseMode = new GripMode { Lateral = 1.0f, SlipK = 1.0f, Loose = 1.0f, YawByGrip = 0f, Recover = 0.7f, Kick = 1.0f };  // car.js:106 arcade drift

        public static GripMode For(SlideMode mode)
        {
            switch (mode)
            {
                case SlideMode.Normal: return Normal;
                case SlideMode.Medium: return Medium;
                case SlideMode.Loose: return LooseMode;
                default: return Minimal;
            }
        }

        /// <summary>car.js:109 SLIDE_LEVELS names, index = level.</summary>
        public static readonly string[] SlideLevels = { "minimal", "normal", "medium", "loose" };
    }

    /// <summary>
    /// `planted` (car.js:84): tames the `normal` sliding mode for that car — extra lateral grip, less throttle
    /// kick / looseness / wander, calmer yaw. Applied at slide levels 0 and 1 only (car.js:1072).
    /// </summary>
    public struct Planted
    {
        public bool Has;
        public float Lateral, Kick, Loose, Wander, Yaw, Response;
        public static readonly Planted None = new Planted { Has = false, Lateral = 1, Kick = 1, Loose = 1, Wander = 1, Yaw = 1, Response = 1 };
    }

    /// <summary>
    /// The garage (car.js:67 CARS). Every number the physics and the model read per car:
    ///  - Power caps the drive force at speed (F ≤ P / v), Torque the low end;
    ///  - DriveLoad is the share of weight on the driven wheels (traction cap);
    ///  - GripBonus scales tyre grip per surface (paddle tyres love loose ground);
    ///  - MaxClimb is the steepest slope (degrees) the car can drive straight up.
    /// An unmanaged struct (fixed-size gear list) so CarSim can go to Burst later.
    /// </summary>
    public struct CarSpec
    {
        public CarKind Key;
        public float Mass, Wheelbase, Track, WheelRadius, FrontAxle;
        public float TravelDown, TravelUp;
        public float SpringK, SpringD, Jump;
        /// <summary>Gear ratios, index 0 = reverse, 1.. = forward.</summary>
        public FixedList32Bytes<float> Gears;
        public float FinalDrive, Idle, Redline, Torque, Power, Upshift, Downshift, DriveLoad;
        public float GripAsphalt, GripGravel, GripOffroad;
        public float MaxClimb;
        public Planted Planted;
        /// <summary>Driver's eye in car space (x right, y up, z forward).</summary>
        public float3 Eye;
        public float2 Shadow;
        public uint Paint;

        public string Name => Key == CarKind.Buggy ? "Formula Offroad" : "Porsche 911";
        public int GearCount => Gears.Length;
        /// <summary>car.js:827 gearRatio: ratio for a gear (0 = reverse), 1 when out of range.</summary>
        public float GearRatio(int gear) { int g = math.max(0, gear); return g < Gears.Length ? Gears[g] : 1f; }
        /// <summary>car.js:1000 `spec.gripBonus[surfaceKind] ?? 1`.</summary>
        public float GripBonus(Surface kind)
        {
            switch (kind)
            {
                case Surface.Asphalt: return GripAsphalt;
                case Surface.Gravel: return GripGravel;
                case Surface.Offroad: return GripOffroad;
                default: return 1f;
            }
        }
        /// <summary>Body box for the Unity collider: length ≈ wheelbase + 1.6, width ≈ track + 0.2, height 1.3.</summary>
        public float3 BodySize => new float3(Track + 0.2f, 1.3f, Wheelbase + 1.6f);

        static FixedList32Bytes<float> GearList(float g0, float g1, float g2, float g3, float g4, float g5 = float.NaN)
        {
            var l = new FixedList32Bytes<float>();
            l.Add(g0); l.Add(g1); l.Add(g2); l.Add(g3); l.Add(g4);
            if (!float.IsNaN(g5)) l.Add(g5);
            return l;
        }

        /// <summary>car.js:68 — five-speed 911-style box on a 12 000 rpm engine (gears run out at 60/100/140/180/220 km/h).</summary>
        public static readonly CarSpec Porsche = new CarSpec
        {
            Key = CarKind.Porsche, Mass = 1180f, Wheelbase = 2.45f, Track = 1.62f, WheelRadius = 0.35f, FrontAxle = 1.25f,
            TravelDown = 0.14f, TravelUp = 0.2f, SpringK = 190f, SpringD = 14f, Jump = 4.0f,
            Gears = GearList(-6.0f, 6.77f, 4.05f, 2.90f, 2.26f, 1.85f), FinalDrive = 3.9f, Idle = 1200f, Redline = 12000f,
            Torque = 380f, Power = 224000f, Upshift = 11000f, Downshift = 4200f, DriveLoad = 0.62f,
            GripAsphalt = 1f, GripGravel = 1f, GripOffroad = 1f, MaxClimb = 30f, Planted = Planted.None,
            Eye = new float3(-0.36f, 1.1f, 0.12f), Shadow = new float2(2.8f, 4.6f), Paint = 0xd34a31,
        };

        /// <summary>car.js:76 — 1 200 hp, 4WD, four gears: 61/102/153/212 km/h at an 8 000 rpm redline; paddle tyres dig in.</summary>
        public static readonly CarSpec Buggy = new CarSpec
        {
            Key = CarKind.Buggy, Mass = 1500f, Wheelbase = 2.9f, Track = 2.1f, WheelRadius = 0.62f, FrontAxle = 1.45f,
            TravelDown = 0.35f, TravelUp = 0.45f, SpringK = 120f, SpringD = 11f, Jump = 4.8f,
            Gears = GearList(-6.0f, 9.0f, 5.4f, 3.6f, 2.6f), FinalDrive = 3.4f, Idle = 1000f, Redline = 8000f,
            Torque = 1500f, Power = 895000f, Upshift = 7600f, Downshift = 3200f, DriveLoad = 1.0f,
            GripAsphalt = 0.85f, GripGravel = 1.25f, GripOffroad = 1.4f, MaxClimb = 80f,
            Planted = new Planted { Has = true, Lateral = 1.3f, Kick = 0.3f, Loose = 0.45f, Wander = 0.35f, Yaw = 0.85f, Response = 1.4f },
            Eye = new float3(0f, 1.6f, -0.1f), Shadow = new float2(3.6f, 4.8f), Paint = 0xf0c020,
        };

        public static CarSpec For(CarKind kind) => kind == CarKind.Buggy ? Buggy : Porsche;
    }
}
