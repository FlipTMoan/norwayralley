using Rally.Core;
using Unity.Collections;
using Unity.Mathematics;

namespace Rally.Vehicle
{
    /// <summary>The garage. Values are stored nowhere but appended only, so old numbers keep their meaning.</summary>
    public enum CarKind : byte { Porsche, Buggy, Carrera, Turbo930, Volvo240, Ranger, Mv6, Baja, Type736 }

    /// <summary>Which wheels are driven: what the start screen says; the traction share itself is <see cref="CarSpec.DriveLoad"/>.</summary>
    public enum DriveType : byte { Rear, All }

    /// <summary>Sliding levels 0–3 in order (car.js:109 SLIDE_LEVELS); the value is the level.</summary>
    public enum SlideMode : byte { Minimal = 0, Normal = 1, Medium = 2, Loose = 3 }

    /// <summary>
    /// Surface model (car.js:92 SURFACES). `Peak` scales the lateral grip, `Loose` how progressively the
    /// tyres let go (and how much the tail comes round on the throttle), `Dust` whether the wheels throw a plume.
    /// Wheelspin (CarSim.SlipTarget): the driven wheels start to spin once the drive asks for more than `SpinAt` × the
    /// traction limit (loose ground shears before the tyre's peak), `SpinGain` scales how fast they then run ahead of the
    /// ground, and a fully spinning wheel loses `SpinLoss` of its traction. Asphalt spins only past the limit and loses nothing.
    /// </summary>
    public struct SurfaceModel
    {
        public float Mu, Rolling, Drag, Peak, Loose, SlipK;
        public float SpinAt, SpinGain, SpinLoss;
        public bool Dust;

        public static readonly SurfaceModel Asphalt = new SurfaceModel { Mu = 1.08f, Rolling = 0.4f, Drag = 0.0011f, Peak = 1.2f, Loose = 0f, SlipK = 9.0f, Dust = false, SpinAt = 1f, SpinGain = 0.25f, SpinLoss = 0f };  // car.js:93
        public static readonly SurfaceModel Gravel = new SurfaceModel { Mu = 0.86f, Rolling = 0.9f, Drag = 0.0013f, Peak = 0.95f, Loose = 0.35f, SlipK = 6.0f, Dust = true, SpinAt = 0.8f, SpinGain = 0.6f, SpinLoss = 0.03f }; // car.js:94
        public static readonly SurfaceModel Offroad = new SurfaceModel { Mu = 0.7f, Rolling = 2.0f, Drag = 0.003f, Peak = 0.85f, Loose = 0.55f, SlipK = 5.0f, Dust = true, SpinAt = 0.6f, SpinGain = 1f, SpinLoss = 0.05f };  // car.js:95

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
        /// <summary>Top speed on rough ground off the road (m/s): the drive stops there and faster arrivals are bled down. 50 km/h for the original two (car.js:34).</summary>
        public float OffroadMax;
        /// <summary>The real car's top speed (km/h); <see cref="Aero"/> is set so full power on flat asphalt tops out there (or just under the top gear's redline).</summary>
        public float TopSpeed;
        /// <summary>Air-drag multiplier on the surface drag (car.js had 1 for every car, which held the 911 to ~175 km/h whatever its gearing).</summary>
        public float Aero;
        /// <summary>Wheelspin: how readily the driven tyres break traction (1 = road tyres; knobbly off-road tyres less). CarSim.SlipTarget.</summary>
        public float Spin;
        public DriveType Drive;
        /// <summary>Turbo spool time (s) to full boost; 0 = no turbo. Off boost the engine makes <see cref="CarSim.OffBoost"/> of its torque and power.</summary>
        public float TurboLag;
        /// <summary>Body box for the Unity collider and the dents (x width, y height from 0.1 m up, z length), sized to the model.</summary>
        public float3 Body;
        /// <summary>Centre of the body box along the car (m forward of the car origin).</summary>
        public float BodyZ;
        public Planted Planted;
        /// <summary>Driver's eye in car space (x right, y up, z forward).</summary>
        public float3 Eye;
        public float2 Shadow;
        public uint Paint;

        public string Name => Garage.Info(Key).Name;
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
        public float3 BodySize => Body;

        static FixedList32Bytes<float> GearList(float g0, float g1, float g2, float g3, float g4, float g5 = float.NaN, float g6 = float.NaN)
        {
            var l = new FixedList32Bytes<float>();
            l.Add(g0); l.Add(g1); l.Add(g2); l.Add(g3); l.Add(g4);
            if (!float.IsNaN(g5)) l.Add(g5);
            if (!float.IsNaN(g6)) l.Add(g6);
            return l;
        }

        /// <summary>car.js:68 — five-speed 911-style box on a 12 000 rpm engine (gears run out at 60/100/140/180/220 km/h).</summary>
        public static readonly CarSpec Porsche = WithAero(new CarSpec
        {
            Key = CarKind.Porsche, Mass = 1180f, Wheelbase = 2.45f, Track = 1.62f, WheelRadius = 0.35f, FrontAxle = 1.25f,
            TravelDown = 0.14f, TravelUp = 0.2f, SpringK = 190f, SpringD = 14f, Jump = 4.0f,
            Gears = GearList(-6.0f, 6.77f, 4.05f, 2.90f, 2.26f, 1.85f), FinalDrive = 3.9f, Idle = 1200f, Redline = 12000f,
            Torque = 380f, Power = 224000f, Upshift = 11000f, Downshift = 4200f, DriveLoad = 0.62f,
            GripAsphalt = 1f, GripGravel = 1f, GripOffroad = 1f, TopSpeed = 225f, OffroadMax = 50f / 3.6f, Spin = 1.00f, MaxClimb = 30f, Planted = Planted.None,
            Drive = DriveType.Rear, Body = new float3(1.82f, 1.3f, 4.05f), BodyZ = 0.025f,   // the old box: track + 0.2, 1.3, wheelbase + 1.6 about mid-wheelbase
            Eye = new float3(-0.36f, 1.1f, 0.12f), Shadow = new float2(2.8f, 4.6f), Paint = 0xd34a31,
        });

        /// <summary>car.js:76 — 1 200 hp, 4WD, four gears: 61/102/153/212 km/h at an 8 000 rpm redline; paddle tyres dig in.</summary>
        public static readonly CarSpec Buggy = new CarSpec
        {
            Key = CarKind.Buggy, Mass = 1500f, Wheelbase = 2.9f, Track = 2.1f, WheelRadius = 0.62f, FrontAxle = 1.45f,
            TravelDown = 0.35f, TravelUp = 0.45f, SpringK = 120f, SpringD = 11f, Jump = 4.8f,
            Gears = GearList(-6.0f, 9.0f, 5.4f, 3.6f, 2.6f), FinalDrive = 3.4f, Idle = 1000f, Redline = 8000f,
            Torque = 1500f, Power = 895000f, Upshift = 7600f, Downshift = 3200f, DriveLoad = 1.0f,
            GripAsphalt = 0.85f, GripGravel = 1.25f, GripOffroad = 1.4f, Aero = 1f, OffroadMax = 50f / 3.6f, Spin = 0.45f, MaxClimb = 80f,
            Drive = DriveType.All, Body = new float3(2.3f, 1.3f, 4.5f), BodyZ = 0f,
            Planted = new Planted { Has = true, Lateral = 1.3f, Kick = 0.3f, Loose = 0.45f, Wander = 0.35f, Yaw = 0.85f, Response = 1.4f },
            Eye = new float3(0f, 1.6f, -0.1f), Shadow = new float2(3.6f, 4.8f), Paint = 0xf0c020,
        };

        /// <summary>The top gear's speed at the redline (km/h).</summary>
        public float GearTopSpeed => Redline / 60f * 2f * math.PI * WheelRadius / (Gears[Gears.Length - 1] * FinalDrive) * 3.6f;

        /// <summary>
        /// Sets <see cref="Aero"/> so that full power on flat asphalt balances rolling, the linear loss and air drag (CarSim) at
        /// the real top speed, or at 96 % of the top gear's redline speed when the gearing runs out first.
        /// </summary>
        static CarSpec WithAero(CarSpec s)
        {
            float v = math.min(s.TopSpeed, s.GearTopSpeed * 0.96f) / 3.6f;
            float surplus = s.Power / (s.Mass * v) - SurfaceModel.Asphalt.Rolling - 0.02f * v;
            s.Aero = math.max(0.05f, surplus / (SurfaceModel.Asphalt.Drag * v * v));
            return s;
        }

        public static CarSpec For(CarKind kind)
        {
            switch (kind)
            {
                case CarKind.Buggy: return Buggy;
                case CarKind.Carrera: return Carrera;
                case CarKind.Turbo930: return Turbo930;
                case CarKind.Volvo240: return Volvo240;
                case CarKind.Ranger: return Ranger;
                case CarKind.Mv6: return Mv6;
                case CarKind.Baja: return Baja;
                case CarKind.Type736: return Type736;
                default: return Porsche;
            }
        }

        /* The chooser's cars. Geometry (wheelbase, track, wheel radius, body box) is measured off each model by
           Editor/CarGarageBuilder (its log warns when these drift from the model); FrontAxle puts the car origin near the
           centre of mass (rear-engined 911s 0.51 of the wheelbase, front-engined 0.46–0.47, mid-engined 0.55). Engines
           are the real car's power × 1.58, the same arcade factor the original 911 has (300 game hp for a ~190 hp 911 S);
           gears are spaced for the speeds at the redline in the comments; torque gives ~2–2.6 g of first-gear pull (the 930 and the MV6 more, so their top gears still pull to the top speed),
           so the start is traction-limited like the 911's. */

        /// <summary>911 3.2 Carrera (1986): 231 hp, 1 210 kg, rear engine, G50 five-speed; 62/105/148/192/240 km/h at 6 800 rpm.</summary>
        public static readonly CarSpec Carrera = WithAero(new CarSpec
        {
            Key = CarKind.Carrera, Mass = 1210f, Wheelbase = 2.26f, Track = 1.405f, WheelRadius = 0.318f, FrontAxle = 1.15f,
            TravelDown = 0.14f, TravelUp = 0.2f, SpringK = 190f, SpringD = 14f, Jump = 4.0f,
            Gears = GearList(-3.8f, 3.82f, 2.26f, 1.60f, 1.23f, 0.99f), FinalDrive = 3.44f, Idle = 900f, Redline = 6800f,
            Torque = 660f, Power = 272000f, Upshift = 6400f, Downshift = 3600f, DriveLoad = 0.62f,
            GripAsphalt = 1.03f, GripGravel = 1f, GripOffroad = 0.95f, TopSpeed = 245f, OffroadMax = 50f / 3.6f, Spin = 1.00f, MaxClimb = 30f, Planted = Planted.None,
            Drive = DriveType.Rear, Body = new float3(1.7f, 1.2f, 4.29f), BodyZ = -0.055f,
            Eye = new float3(-0.36f, 1.07f, 0.02f), Shadow = new float2(2.7f, 4.6f), Paint = 0xc8c8c0,
        });

        /// <summary>911 Turbo 3.3 (930): 300 hp, 1 300 kg, four-speed (75/130/190/260 km/h at 6 800 rpm), wide rear tyres, a big turbo that wakes up late.</summary>
        public static readonly CarSpec Turbo930 = WithAero(new CarSpec
        {
            Key = CarKind.Turbo930, Mass = 1300f, Wheelbase = 2.277f, Track = 1.442f, WheelRadius = 0.318f, FrontAxle = 1.16f,
            TravelDown = 0.13f, TravelUp = 0.19f, SpringK = 200f, SpringD = 15f, Jump = 4.0f,
            Gears = GearList(-2.6f, 2.58f, 1.49f, 1.02f, 0.74f), FinalDrive = 4.22f, Idle = 900f, Redline = 6800f,
            Torque = 1000f, Power = 353000f, Upshift = 6500f, Downshift = 3800f, DriveLoad = 0.64f,
            GripAsphalt = 1.06f, GripGravel = 0.95f, GripOffroad = 0.9f, TopSpeed = 260f, OffroadMax = 45f / 3.6f, Spin = 1.00f, MaxClimb = 30f, Planted = Planted.None,
            Drive = DriveType.Rear, TurboLag = 1.2f, Body = new float3(1.78f, 1.18f, 4.29f), BodyZ = -0.064f,
            Eye = new float3(-0.36f, 1.06f, 0.03f), Shadow = new float2(2.8f, 4.6f), Paint = 0xb01818,
        });

        /// <summary>Volvo 240 Turbo: 155 hp, 1 300 kg, front engine and rear drive, softer springs, small turbo; 55/95/135/170/200 km/h at 6 000 rpm.</summary>
        public static readonly CarSpec Volvo240 = WithAero(new CarSpec
        {
            Key = CarKind.Volvo240, Mass = 1300f, Wheelbase = 2.656f, Track = 1.363f, WheelRadius = 0.319f, FrontAxle = 1.25f,
            TravelDown = 0.18f, TravelUp = 0.22f, SpringK = 160f, SpringD = 13f, Jump = 3.8f,
            Gears = GearList(-3.4f, 3.36f, 1.94f, 1.37f, 1.09f, 0.92f), FinalDrive = 3.91f, Idle = 800f, Redline = 6000f,
            Torque = 620f, Power = 183000f, Upshift = 5600f, Downshift = 3000f, DriveLoad = 0.5f,
            GripAsphalt = 1f, GripGravel = 1f, GripOffroad = 0.95f, TopSpeed = 195f, OffroadMax = 50f / 3.6f, Spin = 1.10f, MaxClimb = 28f, Planted = Planted.None,
            Drive = DriveType.Rear, TurboLag = 0.8f, Body = new float3(1.72f, 1.34f, 4.85f), BodyZ = -0.202f,
            Eye = new float3(-0.38f, 1.15f, -0.25f), Shadow = new float2(2.7f, 5.1f), Paint = 0x1c2c58,
        });

        /// <summary>Placeholder MV6 '83, a Metro 6R4-style Group B car: mid engine, four-wheel drive, 1 050 kg, ~265 kW real; short gears (60/100/140/175/210 km/h at 9 000 rpm).</summary>
        public static readonly CarSpec Mv6 = WithAero(new CarSpec
        {
            Key = CarKind.Mv6, Mass = 1050f, Wheelbase = 2.112f, Track = 1.463f, WheelRadius = 0.309f, FrontAxle = 1.16f,
            TravelDown = 0.18f, TravelUp = 0.25f, SpringK = 170f, SpringD = 14f, Jump = 4.2f,
            Gears = GearList(-4.4f, 4.37f, 2.62f, 1.87f, 1.50f, 1.25f), FinalDrive = 4.0f, Idle = 1100f, Redline = 9000f,
            Torque = 800f, Power = 420000f, Upshift = 8600f, Downshift = 5000f, DriveLoad = 1.0f,
            GripAsphalt = 1f, GripGravel = 1.1f, GripOffroad = 1.1f, TopSpeed = 210f, OffroadMax = 75f / 3.6f, Spin = 0.80f, MaxClimb = 45f,
            Planted = new Planted { Has = true, Lateral = 1.1f, Kick = 0.6f, Loose = 0.8f, Wander = 0.7f, Yaw = 0.95f, Response = 1.1f },
            Drive = DriveType.All, Body = new float3(1.78f, 1.42f, 3.6f), BodyZ = 0.073f,
            Eye = new float3(-0.36f, 1.1f, -0.05f), Shadow = new float2(2.7f, 4.0f), Paint = 0xe8e4d8,
        });

        /// <summary>Ford Ranger Offroad: 3.2 l diesel (200 hp), 2 100 kg, 4WD, lifted on long-travel springs and 1 m tyres; six gears to 175 km/h at 4 500 rpm.</summary>
        public static readonly CarSpec Ranger = WithAero(new CarSpec
        {
            Key = CarKind.Ranger, Mass = 2100f, Wheelbase = 3.393f, Track = 1.644f, WheelRadius = 0.487f, FrontAxle = 1.56f,
            TravelDown = 0.3f, TravelUp = 0.38f, SpringK = 110f, SpringD = 10f, Jump = 4.4f,
            Gears = GearList(-5.5f, 5.54f, 3.16f, 2.21f, 1.70f, 1.43f, 1.27f), FinalDrive = 3.73f, Idle = 750f, Redline = 4500f,
            Torque = 970f, Power = 236000f, Upshift = 4000f, Downshift = 2000f, DriveLoad = 1.0f,
            GripAsphalt = 0.88f, GripGravel = 1.1f, GripOffroad = 1.3f, TopSpeed = 175f, OffroadMax = 90f / 3.6f, Spin = 0.55f, MaxClimb = 60f,
            Planted = new Planted { Has = true, Lateral = 1.15f, Kick = 0.4f, Loose = 0.6f, Wander = 0.5f, Yaw = 0.9f, Response = 1.2f },
            Drive = DriveType.All, Body = new float3(1.95f, 1.9f, 5.36f), BodyZ = -0.238f,
            Eye = new float3(-0.4f, 1.75f, -0.4f), Shadow = new float2(3.0f, 5.6f), Paint = 0x2a3a2a,
        });

        /// <summary>
        /// Baja Bug ("Off Road 4X4 racer" by duanesmind; plan "## Buggy", the stand-in for the JS Formula Offroad): a Beetle on
        /// 0.77 m off-road tyres, ~850 kg, rear engine and drive (~150 hp real), long travel and high ride, gravel grip, less on
        /// asphalt; 55/95/135/165/190 km/h at 7 000 rpm.
        /// </summary>
        public static readonly CarSpec Baja = WithAero(new CarSpec
        {
            Key = CarKind.Baja, Mass = 850f, Wheelbase = 2.591f, Track = 1.862f, WheelRadius = 0.387f, FrontAxle = 1.35f,
            TravelDown = 0.32f, TravelUp = 0.42f, SpringK = 120f, SpringD = 11f, Jump = 4.8f,
            Gears = GearList(-4.5f, 4.51f, 2.61f, 1.84f, 1.50f, 1.30f), FinalDrive = 4.12f, Idle = 900f, Redline = 7000f,
            Torque = 420f, Power = 176000f, Upshift = 6600f, Downshift = 3400f, DriveLoad = 0.7f,
            GripAsphalt = 0.9f, GripGravel = 1.2f, GripOffroad = 1.3f, TopSpeed = 160f, OffroadMax = 100f / 3.6f, Spin = 0.55f, MaxClimb = 55f,
            Planted = new Planted { Has = true, Lateral = 1.15f, Kick = 0.5f, Loose = 0.6f, Wander = 0.5f, Yaw = 0.9f, Response = 1.2f },
            Drive = DriveType.Rear, Body = new float3(2.0f, 1.9f, 4.0f), BodyZ = 0.006f,
            Eye = new float3(-0.32f, 1.45f, -0.3f), Shadow = new float2(3.0f, 4.4f), Paint = 0x4a7a2a,
        });

        /// <summary>
        /// Skoda 736 beach buggy (1970s, Skoda 1000 MB rear engine): ~700 kg, rear drive, a modest engine (≈ 60 hp real, given
        /// 94 game hp so it can keep up on a stage), four gears (45/75/105/130 km/h at 5 500 rpm), soft long-travel springs.
        /// </summary>
        public static readonly CarSpec Type736 = WithAero(new CarSpec
        {
            Key = CarKind.Type736, Mass = 700f, Wheelbase = 2.141f, Track = 1.438f, WheelRadius = 0.248f, FrontAxle = 1.11f,
            TravelDown = 0.24f, TravelUp = 0.3f, SpringK = 140f, SpringD = 11f, Jump = 4.4f,
            Gears = GearList(-2.6f, 2.60f, 1.56f, 1.11f, 0.90f), FinalDrive = 4.4f, Idle = 850f, Redline = 5500f,
            Torque = 330f, Power = 70000f, Upshift = 5200f, Downshift = 2800f, DriveLoad = 0.68f,
            GripAsphalt = 0.95f, GripGravel = 1.1f, GripOffroad = 1.15f, TopSpeed = 125f, OffroadMax = 70f / 3.6f, Spin = 0.65f, MaxClimb = 40f, Planted = Planted.None,
            Drive = DriveType.Rear, Body = new float3(1.55f, 1.26f, 3.3f), BodyZ = -0.09f,
            Eye = new float3(-0.3f, 1.15f, -0.25f), Shadow = new float2(2.4f, 3.8f), Paint = 0xd8a020,
        });
    }
}
