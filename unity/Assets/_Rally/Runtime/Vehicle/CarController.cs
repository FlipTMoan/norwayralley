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
        // Room for a dense spot (a forest edge by a house with a sign): 16 used to drop contacts silently.
        readonly Collider[] overlaps = new Collider[64];
        readonly RaycastHit[] castHits = new RaycastHit[64];
        readonly Collider[] startOverlaps = new Collider[64];
        int placedResets = -1;
        /// <summary>The car's house test reaches this deep (m) before the footprint push takes over from the wall mesh's own push-out.</summary>
        public const float FootprintDeep = 0.5f;
        /// <summary>A spin faster than this per frame (rad) is swept in steps, so a corner does not swing through a trunk or post.</summary>
        public const float YawStep = 15f * Mathf.Deg2Rad;
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
            if (Ground != null) { CarSim.Reset(ref state, Spec, Ground, route); Place(); ApplyPose(); }
        }

        public void ResetTo(float2 xz, float yaw)
        {
            CarSim.Reset(ref state, Spec, Ground, xz, yaw);
            Place();
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
            float yawBefore = state.Yaw;
            var visBefore = state.VisualPos;
            var rotBefore = state.VisualRotation;
            int resetsBefore = state.Resets;
            float damageBefore = state.Damage.Total;
            // On a bridge the ground answers for the car's own height: the deck while it is up there, the river bed under it.
            var layered = Ground as ILayeredGround;
            if (layered != null) layered.ReferenceY = state.Pos.y;
            CarSim.Step(ref state, Spec, input, Ground, Route, ReadOnlySpan<WallBox>.Empty, dt);
            // Colliders moved this frame (the tree pool, a FloatingOrigin rebase of the tile roots) reach PhysX queries only
            // at the next simulation step with autoSyncTransforms off: sync first, or the car tests stale positions.
            long solidsT0 = System.Diagnostics.Stopwatch.GetTimestamp();
            Physics.SyncTransforms();
            if (state.Resets != resetsBefore) Place();   // the sim fished the car out of deep water (CarSim sink recovery)
            else
            {
                SweepYaw(before, yawBefore, visBefore, rotBefore);
                SweepWalls(before);
            }
            PushOutOfHouses(FootprintDeep);
            ResolveCollisions();
            diag.SolidsTime(System.Diagnostics.Stopwatch.GetTimestamp() - solidsT0);
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

        /// <summary>
        /// Every placement goes through here (spawn, restart, new stage, ESC / MENU restart, multiplayer slot, sink recovery,
        /// any <see cref="ResetTo"/>): the pooled colliders are moved to the new spot first, and when the car box there overlaps
        /// a solid (a house footprint, a tree, a sign post, a bridge rail) the car goes to the nearest free spot along the road
        /// (2 m steps, both ways, up to 60 m). With nothing free it stays and the per-frame push-out frees it.
        /// </summary>
        void Place()
        {
            placedResets = state.Resets;
            if (Ground == null || box == null) return;
            (Ground as ISolidGround)?.RefreshColliders(state.Pos);
            Physics.SyncTransforms();
            var start = state.Pos.xz; float yaw = state.Yaw;
            if (IsFree(start, yaw)) return;
            var along = CarSim.Forward(yaw);
            if (Route != null) { var q = Route.Nearest(start, 60f); if (q.Hit) along = q.Tangent; }
            for (int i = 1; i <= 60; i++)
            {
                var p = start + along * (((i + 1) / 2) * 2f * ((i & 1) == 1 ? 1f : -1f));
                if (!Ground.IsLoaded(p) || !IsFree(p, yaw)) continue;
                CarSim.Reset(ref state, Spec, Ground, p, yaw);
                placedResets = state.Resets;
                diag.Placed(start, p);
                return;
            }
        }

        /// <summary>The car box at a pose on the ground (10 cm clearance) touches no solid and no house footprint.</summary>
        public bool IsFree(float2 xz, float yaw)
        {
            const float clear = 0.1f;
            var rot = Quaternion.Euler(0f, yaw * Mathf.Rad2Deg, 0f);
            var pos = new Vector3(xz.x, Ground.HeightAt(xz), xz.y);
            if (Ground is ISolidGround solids)
            {
                var c = xz + CarSim.Forward(yaw) * box.center.z;
                if (solids.FootprintPush(c, yaw, box.size.z * 0.5f + clear, box.size.x * 0.5f + clear, 0f, out _)) return false;
            }
            if (SolidLayers.value == 0) return true;
            int n = Physics.OverlapBoxNonAlloc(pos + rot * box.center, box.size * 0.5f + Vector3.one * clear, overlaps, rot, SolidLayers, QueryTriggerInteraction.Ignore);
            for (int i = 0; i < n; i++) if (overlaps[i] != box && !IsShrub(overlaps[i])) return false;
            return true;
        }

        /// <summary>
        /// Houses as solids in plan view (<see cref="ISolidGround.FootprintPush"/>): a car deeper than <paramref name="minDepth"/> in a
        /// footprint — wholly inside a house that streamed in around it, or more than half way through a wall, where the wall
        /// mesh's nearest triangle would push it inward — is moved the shortest way out of the house, with the wall rule for its
        /// speed (no damage: the car did not hit it). Shallow contacts stay with <see cref="ResolveCollisions"/>.
        /// </summary>
        void PushOutOfHouses(float minDepth)
        {
            if (!(Ground is ISolidGround solids)) return;
            var c = state.Pos.xz + CarSim.Forward(state.Yaw) * box.center.z;
            if (!solids.FootprintPush(c, state.Yaw, box.size.z * 0.5f, box.size.x * 0.5f, minDepth, out var push)) return;
            float len = math.length(push);
            CarSim.ApplyWallHit(ref state, push / len, len);
            CarSim.SyncBodyVelocity(ref state);
            state.VisualPos.xz = state.Pos.xz;
            diag.HousePush(len);
        }

        /// <summary>
        /// A spin of more than <see cref="YawStep"/> in one frame is checked in steps: the first intermediate pose (position and
        /// rotation interpolated) that touches a solid the car was not already touching stops the turn there (refined by
        /// bisection), so <see cref="ResolveCollisions"/> pushes the car out of a shallow contact instead of the corner having
        /// swung through a trunk or past a wall.
        /// </summary>
        void SweepYaw(float2 fromXZ, float fromYaw, float3 fromVis, quaternion fromRot)
        {
            if (SolidLayers.value == 0) return;
            float dYaw = CarSim.WrapAngle(state.Yaw - fromYaw);
            int steps = (int)math.ceil(math.abs(dYaw) / YawStep);
            if (steps < 2) return;
            var toXZ = state.Pos.xz; var toVis = state.VisualPos; var toRot = state.VisualRotation;
            var half = box.size * 0.5f;
            int already = Physics.OverlapBoxNonAlloc((Vector3)fromVis + (Quaternion)fromRot * box.center, half, startOverlaps, fromRot, SolidLayers, QueryTriggerInteraction.Ignore);
            bool Hits(float t)
            {
                var rot = (Quaternion)math.slerp(fromRot, toRot, t);
                var vis = (Vector3)math.lerp(fromVis, toVis, t);
                int n = Physics.OverlapBoxNonAlloc(vis + rot * box.center, half, overlaps, rot, SolidLayers, QueryTriggerInteraction.Ignore);
                for (int i = 0; i < n; i++)
                {
                    var o = overlaps[i];
                    if (o == box || IsShrub(o)) continue;
                    bool old = false;
                    for (int j = 0; j < already && !old; j++) old = startOverlaps[j] == o;
                    if (!old) return true;
                }
                return false;
            }
            for (int k = 1; k < steps; k++)
            {
                float t = (float)k / steps;
                if (!Hits(t)) continue;
                float lo = (k - 1f) / steps, hi = t;
                for (int b = 0; b < 4; b++) { float mid = (lo + hi) * 0.5f; if (Hits(mid)) hi = mid; else lo = mid; }
                state.Yaw = fromYaw + dYaw * hi;
                state.Pos.xz = math.lerp(fromXZ, toXZ, hi);
                state.VisualPos = math.lerp(fromVis, toVis, hi);
                state.VisualRotation = math.slerp(fromRot, toRot, hi);
                state.YawVel *= 0.5f;
                CarSim.SyncBodyVelocity(ref state);
                return;
            }
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
