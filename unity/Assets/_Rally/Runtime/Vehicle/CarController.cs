using System;
using Rally.Core;
using Rally.Track;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.InputSystem;

namespace Rally.Vehicle
{
    /// <summary>A hit against a Unity collider (building, tree, prop), for audio, damage and effects.</summary>
    public struct CollisionEvent
    {
        /// <summary>Push-out normal, world space.</summary>
        public float3 Normal;
        /// <summary>The same normal in car space (x right, z forward): front hits have z &lt; 0.</summary>
        public float3 NormalLocal;
        /// <summary>Closing speed into the obstacle (m/s).</summary>
        public float SpeedInto;
        public int Layer;
        /// <summary>A thin tree that snapped instead of stopping the car.</summary>
        public bool TreeSnapped;
        public Collider Other;
    }

    /// <summary>
    /// Binds the pure <see cref="CarSim"/> to the scene: reads the Input System, steps the sim against the
    /// world's <see cref="IGround"/> (the HeightGrid is the ground truth for tyres, there is no terrain
    /// collider), resolves overlaps with the world's colliders through PhysX (buildings, trees, props) with
    /// the JS wall rules, raises water trigger events, and copies the visual block onto the transforms.
    /// Body = this transform (the kinematic Rigidbody + BoxCollider sit here), wheels are four pivots
    /// (steer) each with a spin child, as in car.js:521.
    /// </summary>
    [RequireComponent(typeof(Rigidbody), typeof(BoxCollider))]
    public sealed class CarController : MonoBehaviour
    {
        [Header("Garage")]
        public CarKind Kind = CarKind.Porsche;
        public SlideMode GripMode = SlideMode.Minimal;
        public bool AutoShift = true;
        /// <summary>Raised when Q/E switched the box to manual (false) so the HUD can say so; G toggles via GameController.</summary>
        public event Action<bool> GearboxChanged;
        [Tooltip("Countdown / finished: the car sits still (main.js frozen input).")]
        public bool Frozen;
        [Tooltip("Seed of the gravel wander dice, so replays agree.")]
        public uint Seed = 1;

        [Header("Model slots")]
        [Tooltip("Wheel pivots in car space: 0 front-left, 1 front-right, 2 rear-left, 3 rear-right. The pivot steers; its child spins.")]
        public Transform[] WheelPivots = new Transform[4];
        [Tooltip("Optional spin children of the pivots (same order). When empty the pivot itself spins.")]
        public Transform[] WheelSpins = new Transform[4];

        [Header("Physics layers")]
        [Tooltip("Buildings | Trees | Props: solid, resolved by overlap + ComputePenetration after each step.")]
        public LayerMask SolidLayers;
        [Tooltip("Trees: a capsule shorter than ThinTreeHeight (a shrub) snaps (event only); every real tree stops the car.")]
        public LayerMask TreeLayers;
        public LayerMask WaterLayers;
        public LayerMask ActorLayers;
        [Tooltip("Tree capsules shorter than this are shrubs: the car breaks through them. Used to be a 0.15 m trunk radius, which let small birches (0.18 m × scale) and mountain birches through while they were still drawn.")]
        public float ThinTreeHeight = 3f;

        /// <summary>Set by the world before the first frame.</summary>
        public IGround Ground;
        public IRoute Route;
        /// <summary>When set, drives instead of the keyboard (PlayMode tests, demos).</summary>
        public ScriptedDriver Driver;

        public CarSpec Spec;
        CarState state;
        CarInput lastInput;
        public ref CarState State => ref state;
        public CarInput LastInput => lastInput;
        public float Speed => state.Speed;
        public float SpeedKmh => state.SpeedKmh;
        public float Rpm => state.Rpm;
        public int Gear => state.Gear;
        public float Damage => state.Damage.Total;
        public bool Wrecked => state.Damage.Wrecked;

        public event Action<CollisionEvent> Collided;
        /// <summary>Gear changed (old, new): an upshift pops the exhaust.</summary>
        public event Action<int, int> Shifted;
        /// <summary>The body entered a Water trigger (world position), for the World's wake writer and the splash.</summary>
        public event Action<Vector3> OnWaterEnter;
        public event Action<Vector3> OnWaterLeave;

        Rigidbody rb;
        BoxCollider box;
        readonly Collider[] overlaps = new Collider[16];
        readonly RaycastHit[] castHits = new RaycastHit[16];
        bool jumpLatch;
        readonly CarDiagnostics diag = new CarDiagnostics();
        /// <summary>Contact / sudden slow-down counters behind the "collision:" log lines.</summary>
        public CarDiagnostics Diagnostics => diag;

        void Awake()
        {
            Spec = CarSpec.For(Kind);
            state = CarState.Create(Spec, Seed);
            rb = GetComponent<Rigidbody>();
            rb.isKinematic = true;
            rb.useGravity = false;
            rb.interpolation = RigidbodyInterpolation.None;
            box = GetComponent<BoxCollider>();
            var size = Spec.BodySize;
            box.size = size;
            box.center = new Vector3(0f, size.y * 0.5f + 0.1f, Spec.BodyZ);
            // Actors report their own hits (disc test in Rally.Actors): never double count through PhysX.
            int actors = FirstLayer(ActorLayers);
            if (actors >= 0) Physics.IgnoreLayerCollision(gameObject.layer, actors, true);
        }

        static int FirstLayer(LayerMask mask)
        {
            for (int i = 0; i < 32; i++) if ((mask.value & (1 << i)) != 0) return i;
            return -1;
        }

        void OnEnable() { FloatingOrigin.Rebased += OnRebased; }
        void OnDisable() { FloatingOrigin.Rebased -= OnRebased; }

        void OnRebased(double2 delta)
        {
            var d = (float2)delta;
            state.Pos.xz -= d;
            state.VisualPos.xz -= d;
            state.LastDry -= d;
            ApplyPose();
        }

        /// <summary>car.js setRoute: new route, car on its start line.</summary>
        public void SetRoute(IRoute route)
        {
            Route = route;
            if (Ground != null) { CarSim.Reset(ref state, Spec, Ground, route); ApplyPose(); }
        }

        public void ResetTo(float2 xz, float yaw)
        {
            CarSim.Reset(ref state, Spec, Ground, xz, yaw);
            ApplyPose();
        }

        /// <summary>Service park.</summary>
        public void Repair() => state.Damage.Repair();

        /// <summary>An external hit (an animal from Rally.Actors): same damage path as a wall.</summary>
        public void ApplyExternalHit(float3 normalWorld, float speedInto, float mass)
        {
            var local = math.mul(math.inverse(state.VisualRotation), normalWorld);
            state.Damage.Apply(local, speedInto, mass);
            state.Crash = math.max(state.Crash, speedInto);
        }

        void Update()
        {
            if (Ground == null || Time.timeScale == 0f) return;   // paused (the help screen)
            float dt = math.min(0.05f, math.max(0.0001f, Time.deltaTime)); // main.js:2137
            state.AutoShift = AutoShift;
            var input = Driver != null ? Driver.Drive(state, Route) : ReadInput();
            input.GripMode = Driver != null ? Driver.GripMode : GripMode;
            input.Frozen = Frozen;
            lastInput = input;
            int gearBefore = state.Gear;
            var before = state.Pos.xz;
            float damageBefore = state.Damage.Total;
            // On a bridge the ground answers for the car's own height: the deck while it is up there, the river bed under it.
            var layered = Ground as ILayeredGround;
            if (layered != null) layered.ReferenceY = state.Pos.y;
            CarSim.Step(ref state, Spec, input, Ground, Route, ReadOnlySpan<WallBox>.Empty, dt);
            // Colliders moved this frame (the tree pool, a FloatingOrigin rebase of the tile roots) reach PhysX queries only
            // at the next simulation step with autoSyncTransforms off: sync first, or the car tests stale positions.
            Physics.SyncTransforms();
            SweepWalls(before);
            ResolveCollisions();
            diag.Watch(ref state, input, Ground, dt, damageBefore);
            if (layered != null) layered.ReferenceY = float.NaN;
            if (state.Gear != gearBefore) Shifted?.Invoke(gearBefore, state.Gear);
            FloatingOrigin.MaybeRebase(state.Pos);
            ApplyPose();
        }

        /// <summary>Keyboard (WASD / arrows, Shift handbrake, Space jump, Q/E manual gears) and gamepad, main.js:1467.</summary>
        CarInput ReadInput()
        {
            var input = new CarInput();
            bool jumpHeld = false;
            var kb = Keyboard.current;
            if (kb != null)
            {
                if (kb.wKey.isPressed || kb.upArrowKey.isPressed) input.Throttle = 1f;
                if (kb.sKey.isPressed || kb.downArrowKey.isPressed) input.Brake = 1f;
                if (kb.aKey.isPressed || kb.leftArrowKey.isPressed) input.Steer -= 1f;
                if (kb.dKey.isPressed || kb.rightArrowKey.isPressed) input.Steer += 1f;
                input.Handbrake = kb.leftShiftKey.isPressed || kb.rightShiftKey.isPressed;
                jumpHeld = kb.spaceKey.isPressed;
                input.ShiftUp = kb.eKey.wasPressedThisFrame;
                input.ShiftDown = kb.qKey.wasPressedThisFrame;
            }
            var gp = Gamepad.current;
            if (gp != null)
            {
                input.Throttle = math.max(input.Throttle, gp.rightTrigger.ReadValue());
                input.Brake = math.max(input.Brake, gp.leftTrigger.ReadValue());
                float sx = gp.leftStick.x.ReadValue();
                if (math.abs(sx) > 0.1f) input.Steer += sx;
                input.Handbrake |= gp.buttonEast.isPressed;
                jumpHeld |= gp.buttonSouth.isPressed;
                input.ShiftUp |= gp.rightShoulder.wasPressedThisFrame;
                input.ShiftDown |= gp.leftShoulder.wasPressedThisFrame;
            }
            if (TouchInput.Throttle) input.Throttle = 1f;
            if (TouchInput.Brake) input.Brake = 1f;
            if (TouchInput.Left) input.Steer -= 1f;
            if (TouchInput.Right) input.Steer += 1f;
            input.Handbrake |= TouchInput.Handbrake;
            // main.js:1497/1504: a gear key switches an automatic box to manual, so Q/E always does what it says.
            if ((input.ShiftUp || input.ShiftDown) && AutoShift) { AutoShift = false; state.AutoShift = false; GearboxChanged?.Invoke(false); }
            // In the Unity frame +x is the car's right, so no negation of the keys (main.js:1575 needed one).
            input.Steer = math.clamp(input.Steer, -1f, 1f);
            input.Jump = jumpHeld && !jumpLatch; // main.js:1580 — one jump per press
            jumpLatch = jumpHeld;
            return input;
        }

        /// <summary>
        /// Continuous collision for the body box: the sim moved the car from <paramref name="from"/> to its new position
        /// in one go (up to 0.05 s of travel per frame); a box cast along that path finds the first solid it crosses, and
        /// the car is put just into it so <see cref="ResolveCollisions"/> pushes it out with the wall rule and the damage.
        /// Without it a car sliding sideways (1.7 m wide) at rally speed on a slow frame moved past a trunk's centre in one
        /// frame and the overlap test pushed it out on the far side: through the tree.
        /// </summary>
        void SweepWalls(float2 from)
        {
            if (SolidLayers.value == 0) return;
            float2 move = state.Pos.xz - from;
            float len = math.length(move);
            if (len < 0.05f) return;
            var rot = (Quaternion)state.VisualRotation;
            var offset = state.VisualPos.xz - state.Pos.xz;
            var start = new Vector3(from.x + offset.x, state.VisualPos.y, from.y + offset.y) + rot * box.center;
            var dir = new Vector3(move.x / len, 0f, move.y / len);
            int n = Physics.BoxCastNonAlloc(start, box.size * 0.5f, dir, castHits, rot, len, SolidLayers, QueryTriggerInteraction.Ignore);
            float best = float.PositiveInfinity;
            for (int i = 0; i < n; i++)
            {
                var h = castHits[i];
                if (h.collider == box || h.distance <= 0f || h.distance >= best || IsShrub(h.collider)) continue;   // distance 0: already overlapping, the overlap pass owns it
                if (math.abs(h.normal.y) > 0.7f) continue;   // the top of something: the ground model owns that
                best = h.distance;
            }
            if (float.IsPositiveInfinity(best)) return;
            float keep = math.min(len, best + 0.05f);   // 5 cm in, so the overlap pass sees the contact and its normal
            state.Pos.x = from.x + move.x / len * keep;
            state.Pos.z = from.y + move.y / len * keep;
            state.VisualPos.x = state.Pos.x + offset.x;
            state.VisualPos.z = state.Pos.z + offset.y;
        }

        bool IsShrub(Collider c) => (TreeLayers.value & (1 << c.gameObject.layer)) != 0 && c is CapsuleCollider cap && cap.height < ThinTreeHeight;

        /// <summary>
        /// Walls through PhysX: overlap the body box with Buildings | Trees | Props, compute each penetration,
        /// push out along it with the JS wall rule (CarSim.ApplyWallHit) and feed the damage model. Thin trees
        /// snap (event only). Runs on the pose the sim just produced, before it is drawn.
        /// </summary>
        void ResolveCollisions()
        {
            if (SolidLayers.value == 0) return;
            var rot = (Quaternion)state.VisualRotation;
            var pos = (Vector3)state.VisualPos;
            var centre = pos + rot * box.center;
            int n = Physics.OverlapBoxNonAlloc(centre, box.size * 0.5f, overlaps, rot, SolidLayers, QueryTriggerInteraction.Ignore);
            for (int i = 0; i < n; i++)
            {
                var other = overlaps[i];
                if (other == box) continue;
                if (!Physics.ComputePenetration(box, pos, rot, other, other.transform.position, other.transform.rotation, out Vector3 dir, out float dist)) continue;
                var horizontal = new float2(dir.x, dir.z);
                float len = math.length(horizontal);
                if (len < 1e-3f) continue; // standing on top of something: the ground model owns that
                var normal = horizontal / len;
                bool thin = IsShrub(other);
                var ev = new CollisionEvent
                {
                    Normal = new float3(normal.x, 0f, normal.y),
                    Layer = other.gameObject.layer,
                    Other = other,
                    TreeSnapped = thin,
                };
                if (thin)
                {
                    ev.SpeedInto = math.max(0f, -(state.Vel.x * normal.x + state.Vel.y * normal.y));
                    ev.NormalLocal = math.mul(math.inverse(state.VisualRotation), ev.Normal);
                    diag.Contact(state, other, ev.SpeedInto, dist, true);
                    Collided?.Invoke(ev);
                    continue;
                }
                float into = CarSim.ApplyWallHit(ref state, normal, dist * len);
                CarSim.SyncBodyVelocity(ref state);
                state.VisualPos.xz = state.Pos.xz;
                pos = (Vector3)state.VisualPos;
                ev.SpeedInto = into;
                ev.NormalLocal = math.mul(math.inverse(state.VisualRotation), ev.Normal);
                if (into > 0.5f) state.Damage.Apply(ev.NormalLocal, into, Spec.Mass);
                diag.Contact(state, other, into, dist, false);
                Collided?.Invoke(ev);
            }
        }

        void OnTriggerEnter(Collider other)
        {
            if ((WaterLayers.value & (1 << other.gameObject.layer)) != 0) OnWaterEnter?.Invoke(transform.position);
        }

        void OnTriggerExit(Collider other)
        {
            if ((WaterLayers.value & (1 << other.gameObject.layer)) != 0) OnWaterLeave?.Invoke(transform.position);
        }

        /// <summary>car.js:1348–1378: body pose from the visual block, wheels steered and spun.</summary>
        void ApplyPose()
        {
            transform.SetPositionAndRotation((Vector3)state.VisualPos, (Quaternion)state.VisualRotation);
            for (int i = 0; i < 4 && i < WheelPivots.Length; i++)
            {
                var pivot = WheelPivots[i];
                if (pivot == null) continue;
                var w = CarSim.WheelOffset(Spec, i);
                pivot.localPosition = new Vector3(w.x, state.WheelY[i], w.y);
                bool front = CarSim.WheelIsFront(i);
                float spin = (front ? state.WheelSpin : state.RearSpin) * Mathf.Rad2Deg;
                var spinT = i < WheelSpins.Length ? WheelSpins[i] : null;
                if (spinT != null)
                {
                    pivot.localRotation = front ? Quaternion.Euler(0f, state.SteerVisual * Mathf.Rad2Deg, 0f) : Quaternion.identity;
                    spinT.localRotation = Quaternion.Euler(spin, 0f, 0f);
                }
                else
                {
                    pivot.localRotation = Quaternion.Euler(spin, front ? state.SteerVisual * Mathf.Rad2Deg : 0f, 0f);
                }
            }
        }
    }
}
