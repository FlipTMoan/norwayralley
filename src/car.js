import * as THREE from 'three';
import { clamp, damp, lerp, wrapAngle } from './geo.js';
import { ROAD_RIBBON_LIFT, ROAD_CROWN, ROAD_SHOULDER } from './stage.js';
import { profileHeight, corridorReach, ROAD_LIFT } from './corridor.js';

// Porsche 911 (classic rally spec) proportions, metres.
const WHEELBASE = 2.45;
const TRACK = 1.62;
const WHEEL_RADIUS = 0.35;
const FRONT_AXLE = 1.25;
const REAR_AXLE = FRONT_AXLE - WHEELBASE;
const WHEEL_TRAVEL = { down: 0.14, up: 0.2 };

/* The arcade-sim drivetrain. A real physics engine (Cannon/Ammo) is heavier
 * than this game needs: the terrain is a height field, so a raycast vehicle
 * with spring suspension and a slip-based tyre model gives the same feel with
 * far less integration risk. These are the numbers that shape it. */
const MASS = 1180;                 // kg (Porsche; the buggy has its own spec)
const GRAVITY = 24;                // game gravity in the air: comes down hard
const SLOPE_G = 13.5;              // effective gravity along slopes (≈1.4 g): hills bite
// Phase 3 (V5 plan): stiffer suspension + a fine physics step. The car's ray
// contacts read the exact same height array the terrain mesh is built from,
// and the 1/120 s substeps (with a recovery guard below) stop a fast car from
// tunnelling through a crest or a freshly carved road.
const SUSPENSION_K = 190;          // spring back to the ground (per second²)
const SUSPENSION_D = 14;           // damping of the body bounce
const MAX_SUBSTEPS = 8;            // physics substeps per rendered frame
const WATER_DRAG = 0.22;           // v² drag per metre of wetted depth (m⁻¹)
const WATER_DRAG_MAX = 16;         // m/s²: a car hitting deep water stops hard, not instantly
const SINK_DEPTH = 1.3;            // roof under: the engine is dead
const SINK_TIME = 2.5;             // seconds under before the car is fished out
// Five-speed 911-style box on a 12 000 rpm engine. At the redline the gears
// run out at 60 / 100 / 140 / 180 / 220 km/h, so 2nd covers ~30–100 km/h,
// 3rd ~45–140 and so on (wheel radius 0.35 m, final drive 3.9).
const GEAR_RATIOS = [-6.0, 6.77, 4.05, 2.90, 2.26, 1.85];
const REVERSE = 0;
const FINAL_DRIVE = 3.9;
const IDLE_RPM = 1200;
const REDLINE_RPM = 12000;
const MAX_TORQUE = 380;            // Nm at peak; the tyres, not the torque, cap acceleration
const AUTO_UPSHIFT = 11000;
const AUTO_DOWNSHIFT = 4200;
const SHIFT_TIME = 0.24;
// Rear-engined traction: the driven axle carries ~62 % of the weight.
const DRIVE_AXLE_LOAD = 0.62;

export const ENGINE = { idle: IDLE_RPM, redline: REDLINE_RPM, gears: GEAR_RATIOS.length - 1 };

/**
 * The garage. Every number the physics and the model read per car.
 *  - power caps the drive force at speed (F ≤ P / v), torque the low end;
 *  - driveLoad is the share of weight on the driven wheels (traction cap);
 *  - gripBonus scales tyre grip per surface (paddle tyres love loose ground).
 */
export const CARS = {
  porsche: {
    key: 'porsche', name: 'Porsche 911', mass: 1180, wheelbase: 2.45, track: 1.62, wheelRadius: 0.35, frontAxle: 1.25,
    travel: { down: 0.14, up: 0.2 }, springK: 190, springD: 14, jump: 6.2,
    gears: [-6.0, 6.77, 4.05, 2.90, 2.26, 1.85], finalDrive: 3.9, idle: 1200, redline: 12000,
    torque: 380, power: 224000, upshift: 11000, downshift: 4200, driveLoad: 0.62,
    gripBonus: { asphalt: 1, gravel: 1, offroad: 1 },
    eye: { x: -0.36, y: 1.1, z: 0.12 }, shadow: [2.8, 4.6], paint: 0xd34a31,
  },
  buggy: {
    key: 'buggy', name: 'Formula Offroad', mass: 1500, wheelbase: 2.9, track: 2.1, wheelRadius: 0.62, frontAxle: 1.45,
    travel: { down: 0.35, up: 0.45 }, springK: 120, springD: 11, jump: 7.5,
    // 1 200 hp, 4WD, four gears: 61 / 102 / 153 / 212 km/h at an 8 000 rpm redline.
    gears: [-6.0, 9.0, 5.4, 3.6, 2.6], finalDrive: 3.4, idle: 1000, redline: 8000,
    torque: 1500, power: 895000, upshift: 7600, downshift: 3200, driveLoad: 1.0,
    gripBonus: { asphalt: 0.85, gravel: 1.25, offroad: 1.4 },
    eye: { x: 0, y: 1.6, z: -0.1 }, shadow: [3.6, 4.8], paint: 0xf0c020,
  },
};

// Surface model. `peak` scales the lateral grip, `loose` how progressively the
// tyres let go (and how much the tail comes round on the throttle), `dust`
// whether the wheels throw up a plume.
const SURFACES = {
  asphalt: { mu: 1.08, rolling: 0.4, drag: 0.0011, peak: 1.2, loose: 0, slipK: 9.0, dust: false },
  gravel: { mu: 0.86, rolling: 0.9, drag: 0.0013, peak: 0.95, loose: 0.35, slipK: 6.0, dust: true },
  offroad: { mu: 0.7, rolling: 2.0, drag: 0.003, peak: 0.85, loose: 0.55, slipK: 5.0, dust: true },
};
/**
 * Sliding setting. `normal` keeps the tyres inside their grip unless you
 * provoke them (handbrake, hard throttle on gravel); `loose` is the arcade
 * drift feel where the tail comes round on every corner.
 */
export const GRIP_MODES = {
  normal: { lateral: 1.3, slipK: 1.6, loose: 0.4, yawByGrip: 0.95, recover: 0.45, kick: 0.6 },
  loose: { lateral: 1.0, slipK: 1.0, loose: 1.0, yawByGrip: 0, recover: 0.7, kick: 1.0 },
};
const MAX_STEER_LOW = 0.6;         // rad of front-wheel angle at walking pace
const MAX_STEER_HIGH = 0.08;       // rad at 50 m/s

function makeNumberTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f1ead8';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#1b1e1c';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 122, 122);
  ctx.fillStyle = '#1b1e1c';
  ctx.font = 'bold 88px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Engine torque curve: torquey mid-range, falls off at the redline. */
function engineTorque(spec, rpm) {
  const x = clamp((rpm - spec.idle) / (spec.redline - spec.idle), 0, 1);
  // A soft peak around 65% of the rev range, then a gentle drop-off.
  const curve = Math.sin(Math.PI * Math.pow(x, 0.9)) * 0.55 + 0.55;
  return spec.torque * clamp(curve, 0.25, 1);
}

/* ------------------------------------------------------------------ *
 *  Lofted 911 body                                                     *
 * ------------------------------------------------------------------ */

/** A smooth 1-D curve through (z, value) control points, sampled by z. */
function curveFn(points) {
  const spline = new THREE.SplineCurve(points.map(([z, v]) => new THREE.Vector2(z, v)));
  const table = spline.getPoints(400);
  const zMax = table[0].x;
  const zMin = table[table.length - 1].x;
  return (z) => {
    if (z >= zMax) return table[0].y;
    if (z <= zMin) return table[table.length - 1].y;
    let lo = 0;
    let hi = table.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (table[mid].x >= z) lo = mid; else hi = mid;
    }
    const a = table[lo];
    const b = table[hi];
    const t = (a.x - z) / Math.max(1e-6, a.x - b.x);
    return a.y + (b.y - a.y) * t;
  };
}

/** Signed area of a ring in the (x, y) plane: positive = counter-clockwise. */
function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/**
 * Skin a list of closed cross-section rings (front to back, all the same
 * point count) into one smooth surface with capped ends. Each ring is
 * `{ z, pts: [{x, y, c?}] }`; an optional per-point colour `c` becomes a
 * vertex colour attribute.
 */
function loft(rings, { color = false } = {}) {
  const n = rings[0].pts.length;
  const positions = [];
  const colors = [];
  const index = [];
  for (const ring of rings) {
    if (ringArea(ring.pts) < 0) ring.pts.reverse();
    for (const p of ring.pts) {
      positions.push(p.x, p.y, ring.z);
      if (color) colors.push(p.c.r, p.c.g, p.c.b);
    }
  }
  for (let k = 0; k + 1 < rings.length; k++) {
    for (let i = 0; i < n; i++) {
      const a = k * n + i;
      const b = k * n + (i + 1) % n;
      const c = (k + 1) * n + (i + 1) % n;
      const d = (k + 1) * n + i;
      index.push(a, d, b, b, d, c);
    }
  }
  // End caps: a fan from the ring's centroid.
  for (const [ring, front] of [[rings[0], true], [rings[rings.length - 1], false]]) {
    const k = front ? 0 : rings.length - 1;
    let cx = 0;
    let cy = 0;
    for (const p of ring.pts) { cx += p.x; cy += p.y; }
    const centre = positions.length / 3;
    positions.push(cx / n, cy / n, ring.z);
    if (color) { const c = ring.pts[0].c; colors.push(c.r, c.g, c.b); }
    for (let i = 0; i < n; i++) {
      const a = k * n + i;
      const b = k * n + (i + 1) % n;
      if (front) index.push(centre, a, b); else index.push(centre, b, a);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (color) geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

// Longitudinal design curves of the body (z forward, metres).
const BODY = {
  // top of the body on the centre line: bonnet, cowl, doors, engine lid, tail
  belt: curveFn([[2.14, 0.58], [1.9, 0.63], [1.3, 0.72], [0.74, 0.83], [0.0, 0.87], [-1.0, 0.89], [-1.6, 0.97], [-2.0, 0.9], [-2.14, 0.78]]),
  // how far the fender crowns rise above the centre line
  hump: curveFn([[2.14, 0.12], [1.95, 0.16], [1.5, 0.12], [1.0, 0.05], [0.7, 0.0], [-0.8, 0.0], [-1.4, 0.05], [-1.9, 0.04], [-2.14, 0.0]]),
  // overall width: narrow nose, flared rear hips
  width: curveFn([[2.14, 1.2], [2.0, 1.5], [1.6, 1.62], [0.8, 1.68], [0.0, 1.7], [-1.0, 1.74], [-1.4, 1.8], [-1.9, 1.7], [-2.14, 1.4]]),
  floor: 0.3,
  // glasshouse: roof line and width
  roof: curveFn([[0.74, 0.86], [0.45, 1.12], [0.2, 1.25], [-0.4, 1.3], [-0.95, 1.2], [-1.35, 1.08], [-1.62, 0.98]]),
  roofWidth: curveFn([[0.74, 1.34], [0.2, 1.34], [-0.4, 1.32], [-1.2, 1.28], [-1.62, 1.2]]),
};

/** Cross-section of the lower body at station z. */
function bodyRing(z) {
  const w2 = BODY.width(z) / 2;
  const belt = BODY.belt(z);
  const hump = BODY.hump(z);
  const shoulder = belt - 0.14 + hump * 0.5;
  const r = 0.08;
  // Wheel arches: the floor edge lifts over each axle.
  let arch = BODY.floor;
  for (const axle of [FRONT_AXLE, REAR_AXLE]) {
    const dz = z - axle;
    const R = 0.52;
    if (Math.abs(dz) < R) arch = Math.max(arch, 0.24 + Math.sqrt(R * R - dz * dz));
  }
  const inArch = arch > BODY.floor + 0.01;
  const half = [];
  // floor from the centre outwards (the outer part lifts into the arch)
  for (const u of [0, 0.3, 0.46, 0.5, 0.72, 0.86]) {
    half.push({ x: u * w2, y: inArch && u > 0.48 ? arch : BODY.floor });
  }
  // sill corner, then the flank: widest at the hip line, tucked in below it
  for (const a of [0.35, 0.7, 1.0]) {
    const ang = a * Math.PI / 2;
    half.push({ x: inArch ? w2 * 0.9 : w2 * 0.88 - r + Math.sin(ang) * r, y: inArch ? arch + a * 0.02 : BODY.floor + r - Math.cos(ang) * r });
  }
  half.push({ x: w2 * 1.0, y: Math.max(inArch ? arch + 0.04 : 0, BODY.floor + 0.3) });
  half.push({ x: w2 * 0.97, y: (shoulder + BODY.floor + 0.3) / 2 });
  // over the top: fender crown, bonnet / lid dip in the middle
  for (let i = 0; i <= 8; i++) {
    const u = 1 - i / 8;
    const crest = belt + hump * Math.exp(-(((u - 0.72) / 0.24) ** 2));
    const y = shoulder + (crest - shoulder) * Math.sqrt(1 - u ** 4);
    half.push({ x: u * w2, y });
  }
  const left = half.slice(1, -1).reverse().map((p) => ({ x: -p.x, y: p.y }));
  return { z, pts: half.concat(left) };
}

/** Cross-section of the glasshouse at station z (c = vertex colour). */
function roofRing(z, paint, glass) {
  const w2 = BODY.roofWidth(z) / 2;
  const base = BODY.belt(z) - 0.05;
  const top = BODY.roof(z);
  const slope = Math.abs(BODY.roof(z + 0.05) - BODY.roof(z - 0.05)) / 0.1;
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const u = -1 + (i / 6);
    const dome = Math.sqrt(Math.max(0, 1 - Math.abs(u) ** 3.2));
    const painted = slope < 0.38 && Math.abs(u) < 0.62 && top - base > 0.3;
    pts.push({ x: u * w2, y: base + (top - base) * dome, c: painted ? paint : glass });
  }
  pts.push({ x: w2 * 0.98, y: base - 0.04, c: glass });
  pts.push({ x: 0, y: base - 0.05, c: glass });
  pts.push({ x: -w2 * 0.98, y: base - 0.04, c: glass });
  return { z, pts };
}

/** Station spacing: tight where the shape changes quickly. */
function stations(from, to, count, bias = 1) {
  const out = [];
  for (let i = 0; i <= count; i++) {
    let t = i / count;
    t = 0.5 - 0.5 * Math.cos(Math.PI * t); // ease: denser at both ends
    t = Math.pow(t, bias);
    out.push(from + (to - from) * t);
  }
  return out;
}

/** A soft round sprite for water droplets (shared by every car). */
let dropletMap = null;
function dropletTexture() {
  if (dropletMap) return dropletMap;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  dropletMap = new THREE.CanvasTexture(canvas);
  return dropletMap;
}

export class Car {
  constructor(scene, terrain, kind = 'porsche') {
    this.spec = CARS[kind] || CARS.porsche;
    this.kind = this.spec.key;
    this.scene = scene;
    this.terrain = terrain;
    this.route = null;
    this.roadQuery = null;

    this.pos = new THREE.Vector3(0, 0, 0);
    this.vel = new THREE.Vector2(0, 0);
    this.yaw = 0;
    this.yawVel = 0;
    this.verticalVel = 0;
    this.bounce = 0;
    this.bounceVel = 0;
    this.grounded = true;
    this.steer = 0;
    this.steerVisual = 0;
    this.vF = 0;
    this.vR = 0;
    this.speed = 0;
    this.onRoad = false;
    this.surfaceKind = 'offroad';
    this.drifting = false;
    this.airTime = 0;
    this.landingImpact = 0;
    this.distance = 0;
    this.wrongWay = false;
    this.waterDepth = 0;      // water over the ground under the car, once the body is in it (m)
    this.waterSurface = 0;    // height of that water's surface
    this.splash = 0;          // entry splash strength this frame (0 = none)
    this.recovered = false;   // fished out of deep water this frame
    this.sunkTime = 0;
    this.sprayClock = 0;
    this.lastDry = null;      // last pose on dry ground, for the recovery

    this.pitch = 0;
    this.roll = 0;
    this.bodyRoll = 0;
    this.bodyPitch = 0;
    this.wheelSpin = 0;
    this.rearSpin = 0;        // rear wheels stop turning on the handbrake
    this.slideGrip = 1;       // 0 right after a handbrake slide, recovers to 1
    this.slideMode = 'normal'; // 'normal' | 'loose' (see GRIP_MODES)
    this.wheelCompression = [0, 0, 0, 0];

    // Drivetrain state.
    this.gear = 1;
    this.autoShift = true;
    this.rpm = this.spec.idle;
    this.shiftTimer = 0;
    this.engineLoad = 0;
    this.limiter = false;
    this.airborneAt = -1;
    this.airControl = 0;
    this.roadLift = 0;

    this.group = new THREE.Group();
    this.group.name = 'car';
    this.buildModel();
    scene.add(this.group);

    this.dust = this.createDust();
    scene.add(this.dust.points);
    this.spray = this.createParticles(320, 0xe6f3f7, 0.34, 0.5);
    this.spray.points.material.map = dropletTexture();
    this.spray.points.material.alphaTest = 0.04;
    this.spray.points.renderOrder = 3; // after the (transparent) water plane, or the sea would wash it out
    scene.add(this.spray.points);
  }

  buildModel() {
    if (this.spec.key === 'buggy') this.buildBuggy();
    else this.build911();
  }

  build911() {
    const g = this.group;
    const paint = new THREE.MeshLambertMaterial({ color: 0xd34a31 });
    const paintDark = new THREE.MeshLambertMaterial({ color: 0x9e2f22, flatShading: true });
    const black = new THREE.MeshLambertMaterial({ color: 0x171a19, flatShading: true });
    const chrome = new THREE.MeshLambertMaterial({ color: 0xd7d2c3, flatShading: true });
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8, toneMapped: false });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3a2a, toneMapped: false });

    // Smooth-shaded body: rounded flanks, fender crowns, hips and arches.
    const body = new THREE.Mesh(loft(stations(2.14, -2.14, 64).map(bodyRing)), paint);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    // Glasshouse in one piece: windscreen, domed roof (painted), fastback.
    const paintC = new THREE.Color(0xd34a31);
    const glassC = new THREE.Color(0x1d2f39);
    const roof = new THREE.Mesh(
      loft(stations(0.74, -1.62, 40).map((z) => roofRing(z, paintC, glassC)), { color: true }),
      new THREE.MeshLambertMaterial({ vertexColors: true }),
    );
    roof.castShadow = true;
    g.add(roof);
    // Repainting: the body material plus the roof's painted vertices.
    this.paintMaterials = [paint];
    this.roofColors = roof.geometry.getAttribute('color');
    this.paintedVerts = [];
    for (let i = 0; i < this.roofColors.count; i++) {
      if (Math.abs(this.roofColors.getX(i) - paintC.r) < 1e-3 && Math.abs(this.roofColors.getY(i) - paintC.g) < 1e-3 && Math.abs(this.roofColors.getZ(i) - paintC.b) < 1e-3) {
        this.paintedVerts.push(i);
      }
    }

    // Headlamps sit in the front face of each fender crown, tilted up the
    // way the 911's do, with a chrome bezel around the lens.
    const lampZ = 2.0;
    const crest = bodyRing(lampZ).pts.filter((p) => p.x > 0).reduce((a, b) => (b.y > a.y ? b : a));
    const lampTilt = Math.PI / 2 - 0.5;
    for (const side of [-1, 1]) {
      const lamp = new THREE.Group();
      lamp.position.set(side * crest.x, crest.y - 0.1, lampZ + 0.06);
      lamp.rotation.x = lampTilt;
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.11, 0.16, 16), lightMat);
      lens.position.y = -0.05;
      lamp.add(lens);
      const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 8, 20), chrome);
      bezel.rotation.x = Math.PI / 2;
      bezel.position.y = 0.03;
      lamp.add(bezel);
      g.add(lamp);
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.16), paintDark);
      mirror.position.set(side * 0.93, 0.98, 0.5);
      g.add(mirror);
      const door = new THREE.Mesh(
        new THREE.PlaneGeometry(0.44, 0.44),
        new THREE.MeshBasicMaterial({ map: makeNumberTexture('37'), toneMapped: false }),
      );
      door.rotation.y = side * Math.PI / 2;
      door.position.set(side * (BODY.width(0.05) / 2 + 0.012), 0.6, 0.05);
      g.add(door);
    }

    const roofNumber = new THREE.Mesh(
      new THREE.PlaneGeometry(0.56, 0.56),
      new THREE.MeshBasicMaterial({ map: makeNumberTexture('37'), toneMapped: false }),
    );
    roofNumber.rotation.x = -Math.PI / 2 + 0.08;
    roofNumber.position.set(0, BODY.roof(-0.2) + 0.012, -0.2);
    g.add(roofNumber);

    // Ducktail spoiler on the engine lid.
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.42), paintDark);
    tail.position.set(0, 1.02, -1.84);
    tail.rotation.x = 0.22;
    tail.castShadow = true;
    g.add(tail);
    for (const x of [-0.5, 0.5]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.24), paintDark);
      post.position.set(x, 0.95, -1.8);
      g.add(post);
    }

    // Rear light bar, bumpers and twin exhausts.
    const lightBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.05), tailMat);
    lightBar.position.set(0, 0.6, -2.15);
    g.add(lightBar);
    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.1, 0.12), black);
    bumperF.position.set(0, 0.37, 2.13);
    g.add(bumperF);
    const bumperR = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.1, 0.12), black);
    bumperR.position.set(0, 0.37, -2.13);
    g.add(bumperR);
    for (const x of [-0.5, -0.36]) {
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 8), chrome);
      exhaust.rotation.x = Math.PI / 2;
      exhaust.position.set(x, 0.3, -2.14);
      g.add(exhaust);
    }

    this.wheels = [];
    const tireFront = new THREE.CylinderGeometry(this.spec.wheelRadius, this.spec.wheelRadius, 0.3, 18);
    tireFront.rotateZ(Math.PI / 2);
    const tireRear = new THREE.CylinderGeometry(this.spec.wheelRadius, this.spec.wheelRadius, 0.36, 18);
    tireRear.rotateZ(Math.PI / 2);
    const hubGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.38, 10);
    hubGeo.rotateZ(Math.PI / 2);
    const positions = [
      [-this.spec.track / 2, this.spec.frontAxle, true],
      [this.spec.track / 2, this.spec.frontAxle, true],
      [-this.spec.track / 2, (this.spec.frontAxle - this.spec.wheelbase), false],
      [this.spec.track / 2, (this.spec.frontAxle - this.spec.wheelbase), false],
    ];
    for (const [x, z, front] of positions) {
      const pivot = new THREE.Group();
      pivot.position.set(x, this.spec.wheelRadius, z);
      const spin = new THREE.Group();
      const tire = new THREE.Mesh(front ? tireFront : tireRear, black);
      tire.castShadow = true;
      const hub = new THREE.Mesh(hubGeo, chrome);
      spin.add(tire, hub);
      pivot.add(spin);
      g.add(pivot);
      this.wheels.push({ pivot, spin, front, x, z });
    }

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    const grad = sctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const blob = new THREE.Mesh(
      new THREE.PlaneGeometry(this.spec.shadow[0], this.spec.shadow[1]),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.02;
    g.add(blob);
    this.blobShadow = blob;
    this.tmpV = new THREE.Vector3();
  }

  /**
   * Formula Offroad: a tube-frame hill-climb buggy on 1.2 m paddle tyres.
   * Chassis pan and nose, full roll cage, driver, V8 with four stacks behind
   * the seat, splitter and rear wing — all primitives, flat shaded.
   */
  buildBuggy() {
    const g = this.group;
    const R = this.spec.wheelRadius;
    const paint = new THREE.MeshLambertMaterial({ color: 0xf0c020, flatShading: true });
    this.paintMaterials = [paint];
    const dark = new THREE.MeshLambertMaterial({ color: 0x1c1f21, flatShading: true });
    const tubeMat = new THREE.MeshLambertMaterial({ color: 0xd8d4c8, flatShading: true });
    const chrome = new THREE.MeshLambertMaterial({ color: 0xcfcac0, flatShading: true });
    const rubber = new THREE.MeshLambertMaterial({ color: 0x15171a, flatShading: true });
    const suit = new THREE.MeshLambertMaterial({ color: 0xd9452c, flatShading: true });
    const box = (w, h, d, mat, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      g.add(m);
      return m;
    };
    const tube = (a, b, r = 0.04) => {
      const from = new THREE.Vector3(...a);
      const to = new THREE.Vector3(...b);
      const len = from.distanceTo(to);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), tubeMat);
      m.position.copy(from).add(to).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
      m.castShadow = true;
      g.add(m);
      return m;
    };

    // Chassis pan sits high on the big wheels; wedge nose and side pods.
    const floorY = R - 0.05;
    box(1.1, 0.3, 2.7, paint, 0, floorY + 0.15, -0.1);
    box(0.8, 0.22, 0.9, paint, 0, floorY + 0.08, 1.75);
    box(0.5, 0.26, 1.6, dark, -0.78, floorY + 0.2, -0.2);
    box(0.5, 0.26, 1.6, dark, 0.78, floorY + 0.2, -0.2);
    // Splitter and rear wing.
    box(1.7, 0.05, 0.5, dark, 0, floorY - 0.02, 2.05);
    box(1.9, 0.06, 0.55, paint, 0, floorY + 1.55, -1.55).rotation.x = -0.18;
    tube([-0.6, floorY + 0.3, -1.5], [-0.6, floorY + 1.52, -1.55], 0.03);
    tube([0.6, floorY + 0.3, -1.5], [0.6, floorY + 1.52, -1.55], 0.03);

    // Roll cage: a box of tubes over the cockpit, braced to the nose and tail.
    const cx = 0.58; const y0 = floorY + 0.3; const y1 = floorY + 1.3; const zf = 0.55; const zb = -0.75;
    for (const sx of [-cx, cx]) {
      tube([sx, y0, zf], [sx * 0.85, y1, zf * 0.7]);
      tube([sx, y0, zb], [sx * 0.85, y1, zb]);
      tube([sx * 0.85, y1, zf * 0.7], [sx * 0.85, y1, zb]);
      tube([sx * 0.85, y1, zf * 0.7], [sx * 0.6, floorY + 0.25, 1.9], 0.035);
      tube([sx * 0.85, y1, zb], [sx * 0.6, floorY + 0.4, -1.7], 0.035);
    }
    tube([-cx * 0.85, y1, zf * 0.7], [cx * 0.85, y1, zf * 0.7]);
    tube([-cx * 0.85, y1, zb], [cx * 0.85, y1, zb]);
    tube([-cx * 0.85, y1, zb], [cx * 0.85, y1, zf * 0.7], 0.03); // diagonal

    // Driver: seat, torso, helmet.
    box(0.5, 0.55, 0.45, dark, 0, floorY + 0.55, -0.2);
    box(0.4, 0.4, 0.3, suit, 0, floorY + 0.7, -0.05);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), chrome);
    helmet.position.set(0, floorY + 1.05, -0.05);
    g.add(helmet);

    // Engine behind the seat with four exhaust stacks and an intake scoop.
    box(0.75, 0.6, 0.7, dark, 0, floorY + 0.6, -1.15);
    box(0.5, 0.25, 0.4, chrome, 0, floorY + 1.0, -1.1);
    for (const x of [-0.3, -0.1, 0.1, 0.3]) {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.55, 8), chrome);
      stack.position.set(x, floorY + 1.15, -1.35);
      stack.rotation.x = -0.35;
      g.add(stack);
    }
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: makeNumberTexture('13'), toneMapped: false }));
    plate.rotation.x = -0.6;
    plate.position.set(0, floorY + 0.32, 1.78);
    g.add(plate);

    // Paddle tyres: a wide drum with lugs around it, big chrome hub.
    this.wheels = [];
    const positions = [
      [-this.spec.track / 2, this.spec.frontAxle, true],
      [this.spec.track / 2, this.spec.frontAxle, true],
      [-this.spec.track / 2, this.spec.frontAxle - this.spec.wheelbase, false],
      [this.spec.track / 2, this.spec.frontAxle - this.spec.wheelbase, false],
    ];
    for (const [x, z, front] of positions) {
      const width = front ? 0.38 : 0.56;
      const pivot = new THREE.Group();
      pivot.position.set(x, R, z);
      const spin = new THREE.Group();
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.93, width, 16), rubber);
      drum.rotation.z = Math.PI / 2;
      drum.castShadow = true;
      spin.add(drum);
      const lugs = 14;
      for (let i = 0; i < lugs; i++) {
        const lug = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.12, 0.16), rubber);
        const a = (i / lugs) * Math.PI * 2;
        lug.position.set(0, Math.sin(a) * R * 0.97, Math.cos(a) * R * 0.97);
        lug.rotation.x = -a;
        spin.add(lug);
      }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.42, R * 0.42, width + 0.06, 10), chrome);
      hub.rotation.z = Math.PI / 2;
      spin.add(hub);
      pivot.add(spin);
      g.add(pivot);
      this.wheels.push({ pivot, spin, front, x, z });
    }

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    const grad = sctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, 'rgba(0,0,0,0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 128, 128);
    const blob = new THREE.Mesh(
      new THREE.PlaneGeometry(this.spec.shadow[0], this.spec.shadow[1]),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }),
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.02;
    g.add(blob);
    this.blobShadow = blob;
    this.tmpV = new THREE.Vector3();
  }

  /** Repaint the body (null = the car's own colour). Used for room players. */
  setPaint(hex) {
    const c = new THREE.Color(hex ?? this.spec.paint);
    this.paint = c.getHex();
    for (const m of this.paintMaterials || []) m.color.copy(c);
    if (this.roofColors && this.paintedVerts?.length) {
      for (const i of this.paintedVerts) this.roofColors.setXYZ(i, c.r, c.g, c.b);
      this.roofColors.needsUpdate = true;
    }
  }

  createDust() {
    return this.createParticles(90, 0xcfc3a1, 0.42, 0.32);
  }

  /** A pool of `count` point sprites with a ring allocator (dust, water spray). */
  createParticles(count, color, size, opacity) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    positions.fill(-9999);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return {
      points,
      count,
      positions,
      particles: Array.from({ length: count }, () => ({
        life: 0, maxLife: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, floor: -Infinity,
      })),
      next: 0,
      clock: 0,
    };
  }

  setRoute(route) {
    this.route = route;
    if (route) {
      const pose = route.startPose();
      this.reset(pose);
    }
  }

  reset(pose) {
    if (!pose) {
      const p = this.route ? this.route.startPose() : { x: 0, z: 0, yaw: 0 };
      pose = p;
    }
    this.pos.set(pose.x, this.terrain.sample(pose.x, pose.z), pose.z);
    this.vel.set(0, 0);
    this.yaw = pose.yaw || 0;
    this.spawnYaw = this.yaw;
    this.yawVel = 0;
    this.verticalVel = 0;
    this.bounce = 0;
    this.bounceVel = 0;
    this.grounded = true;
    this.steer = 0;
    this.steerVisual = 0;
    this.speed = 0;
    this.vF = 0;
    this.vR = 0;
    this.pitch = 0;
    this.roll = 0;
    this.bodyRoll = 0;
    this.bodyPitch = 0;
    this.airTime = 0;
    this.landingImpact = 0;
    this.distance = 0;
    this.wrongWay = false;
    this.gear = 1;
    this.rpm = this.spec.idle;
    this.shiftTimer = 0;
    this.airborneAt = -1;
    this.group.position.copy(this.pos);
    this.group.quaternion.identity();
    this.group.rotateY(this.yaw);
    for (const sys of [this.dust, this.spray]) {
      for (const p of sys.particles) p.life = 0;
      sys.positions.fill(-9999);
      sys.points.geometry.attributes.position.needsUpdate = true;
    }
    this.waterDepth = 0;
    this.sunkTime = 0;
  }

  forward() {
    return { x: Math.sin(this.yaw), z: Math.cos(this.yaw) };
  }

  /**
   * The ribbon floats a few centimetres above the carved ground (see
   * stage.js). On the road the car rides on the ribbon, and the lift fades
   * out across the shoulder so leaving the road is a kerb, not a cliff.
   */
  surfaceLift(distance, half = this.route?.roadWidth) {
    if (!this.route) return 0;
    const top = ROAD_RIBBON_LIFT + ROAD_CROWN;
    if (distance <= half) return top;
    if (distance <= half + ROAD_SHOULDER) return lerp(top, ROAD_RIBBON_LIFT, (distance - half) / ROAD_SHOULDER);
    return lerp(ROAD_RIBBON_LIFT, 0, clamp((distance - half - ROAD_SHOULDER) / 0.6, 0, 1));
  }

  /**
   * Height of whatever the tyres are standing on. Inside the road corridor
   * that is the engineered profile (carriageway, embankment or cutting) plus
   * the ribbon; elsewhere the natural ground.
   */
  groundAt(x, z) {
    if (this.route) {
      const q = this.route.nearest(x, z);
      const half = q.width ?? this.route.roadWidth;
      if (q.roadY != null && Number.isFinite(q.distance) && q.distance <= corridorReach(half)) {
        const ground = this.terrain.sampleBase ? this.terrain.sampleBase(x, z) : this.terrain.sample(x, z);
        return profileHeight(q.roadY + ROAD_LIFT, ground, q.distance, half) + this.surfaceLift(q.distance, half);
      }
    }
    return this.terrain.sample(x, z) + this.roadLift;
  }

  right() {
    return { x: Math.cos(this.yaw), z: -Math.sin(this.yaw) };
  }

  /** Ratio for the current gear (0 = reverse, 1..6 = forward). */
  gearRatio() {
    return this.spec.gears[Math.max(0, this.gear)] ?? 1;
  }

  shift(nextGear) {
    const gear = clamp(nextGear, 0, this.spec.gears.length - 1);
    if (gear === this.gear) return;
    this.gear = gear;
    this.shiftTimer = SHIFT_TIME;
  }

  updateDrivetrain(dt, input, surface) {
    const throttle = clamp(input.throttle || 0, 0, 1);
    const brake = clamp(input.brake || 0, 0, 1);
    const reversing = this.gear === REVERSE;
    const wheelSpeed = Math.abs(this.vF);
    const wheelRpm = (wheelSpeed / (2 * Math.PI * this.spec.wheelRadius)) * 60;
    const ratio = Math.abs(this.gearRatio()) * this.spec.finalDrive;
    const rawRpm = wheelRpm * ratio;
    const targetRpm = clamp(rawRpm, this.spec.idle, this.spec.redline);
    // Blip the revs a little under throttle even when stationary.
    const powerInput = reversing ? brake : throttle;
    const freeRev = powerInput > 0 && wheelSpeed < 1 ? 1 : 0;
    this.rpm = damp(this.rpm, Math.max(targetRpm, this.spec.idle + freeRev * 2600), 9, dt);
    // Rev limiter: on the redline (manual box, or a long downhill) the
    // ignition cuts until the revs drop.
    this.limiter = rawRpm >= this.spec.redline * 0.995;

    this.shiftTimer = Math.max(0, this.shiftTimer - dt);
    if (this.gear === REVERSE) {
      if (throttle > 0.1 && this.vF > -0.5) this.shift(1);
    } else if (brake > 0.5 && this.vF < 0.4 && Math.abs(this.vF) < 1.4) {
      this.shift(REVERSE);
    }

    if (this.autoShift && this.shiftTimer <= 0) {
      if (this.gear !== REVERSE) {
        if (this.rpm > this.spec.upshift && throttle > 0.25 && this.gear < this.spec.gears.length - 1) {
          this.shift(this.gear + 1);
        } else if (this.rpm < this.spec.downshift && this.gear > 1) {
          this.shift(this.gear - 1);
        }
      }
    } else if (!this.autoShift) {
      if (input.shiftUp) this.shift(this.gear + 1);
      if (input.shiftDown && this.gear > 1) this.shift(this.gear - 1);
    }

    // Torque at the wheels, minus a clutch cut while shifting.
    const shifting = this.shiftTimer > 0.12;
    const torque = engineTorque(this.spec, this.rpm) * powerInput * (shifting ? 0.15 : 1) * (this.grounded ? 1 : 0.35) * (this.limiter ? 0 : 1);
    const driveForce = Math.min((torque * ratio) / this.spec.wheelRadius, this.spec.power / Math.max(wheelSpeed, 3)) * (reversing ? -1 : 1);
    const engineBrake = powerInput === 0 && Math.abs(this.vF) > 1
      ? -(Math.sign(this.vF) * (28 + this.rpm * 0.012) * Math.abs(ratio) * 0.16)
      : 0;
    this.engineLoad = powerInput;

    return {
      driveForce,
      engineBrake,
      // In reverse, the throttle key is the brake and the brake key is the
      // reverse throttle, which is what every arcade driver expects.
      brake: reversing ? throttle : brake,
      throttle: powerInput,
      surface,
    };
  }

  update(dt, input) {
    this.steer = damp(this.steer, input.steer || 0, 12, dt);
    const f = this.forward();
    const r = this.right();

    if (this.route) {
      this.roadQuery = this.route.nearest(this.pos.x, this.pos.z);
      const half = this.roadQuery.width ?? this.route.roadWidth;
      this.onRoad = this.roadQuery.distance <= half + 1.0;
      this.progress = this.roadQuery.progress;
      this.roadLift = this.surfaceLift(this.roadQuery.distance, half);
    } else {
      this.roadQuery = null;
      this.onRoad = false;
      this.progress = 0;
      this.roadLift = 0;
    }

    if (input.frozen) {
      this.vel.set(0, 0);
      this.vF = 0;
      this.vR = 0;
      this.speed = 0;
      this.yawVel = 0;
      this.verticalVel = 0;
      this.bounce = 0;
      this.bounceVel = 0;
      this.grounded = true;
      this.pos.y = this.groundAt(this.pos.x, this.pos.z);
      this.updateVisual(dt, 0);
      this.updateDust(dt, 0, 0);
      this.integrateParticles(this.spray, dt, 9.5);
      return {
        speed: 0, vF: 0, vR: 0, rpm: this.spec.idle, gear: 1,
        onRoad: this.onRoad, drifting: false, grounded: true,
        progress: this.progress || 0, wrongWay: false, landingImpact: 0,
      };
    }

    // Fixed substeps keep the suspension stable when a frame hitches, and a
    // fine step is what stops a fast car from falling through the ground
    // (Phase 3, "anti-tunneling": the cannon-es advice applied to the raycast
    // vehicle — smaller dt, stiffer suspension).
    this.handbrakeOn = Boolean(input.handbrake);
    const steps = clamp(Math.ceil(dt / (1 / 120)), 1, MAX_SUBSTEPS);
    const h = dt / steps;
    this.surfaceKind = this.onRoad ? (this.roadQuery?.surface || 'gravel') : 'offroad';
    const surface = SURFACES[this.surfaceKind] || SURFACES.gravel;
    const drivetrain = this.updateDrivetrain(dt, input, surface);
    let jumpRequested = false;

    for (let step = 0; step < steps; step++) {
      this.simulateStep(h, input, drivetrain, surface, { jump: input.jump && !jumpRequested });
      if (input.jump) jumpRequested = true;
    }

    const speed = Math.hypot(this.vF, this.vR);
    this.speed = speed;
    this.distance += Math.abs(this.vF) * dt;
    this.airTime = this.grounded ? Math.max(0, this.airTime - dt * 3) : this.airTime + dt;

    if (this.roadQuery && speed > 4 && !this.route.free) {
      const q = this.roadQuery;
      const dot = (this.vel.x * q.tangent.x + this.vel.y * q.tangent.z) / Math.max(0.001, speed);
      this.wrongWay = dot < -0.35;
    } else {
      this.wrongWay = false;
    }

    this.updateVisual(dt, speed);
    this.updateDust(dt, speed, drivetrain.throttle);
    this.updateWater(dt, speed);
    return {
      speed,
      vF: this.vF,
      vR: this.vR,
      rpm: this.rpm,
      gear: this.gear,
      onRoad: this.onRoad,
      drifting: this.drifting,
      grounded: this.grounded,
      progress: this.progress || 0,
      wrongWay: this.wrongWay,
      landingImpact: this.landingImpact,
      waterDepth: this.waterDepth,
      splash: this.splash,
      recovered: this.recovered,
    };
  }

  simulateStep(h, input, drivetrain, surface, { jump }) {
    const f = this.forward();
    const r = this.right();
    let vF = this.vF;
    let vR = this.vR;

    if (this.grounded) {
      // Engine, brakes and the ground. Whatever the gearing multiplies the
      // torque to, the driven tyres can only push as hard as they grip.
      // Wet tyres grip less, and an engine under water hardly pushes at all.
      const wet = 1 - 0.5 * clamp(this.waterDepth / 0.5, 0, 1);
      const bonus = (this.spec.gripBonus[this.surfaceKind] ?? 1) * wet;
      const drowned = this.waterDepth > 0.8 ? 0.15 : 1;
      const maxDrive = surface.mu * bonus * this.spec.driveLoad * 9.81 * (input.handbrake ? 0.3 : 1) * drowned;
      vF += clamp(drivetrain.driveForce / this.spec.mass, -maxDrive, maxDrive) * h;
      if (drivetrain.brake > 0) {
        vF -= Math.sign(vF) * Math.min(Math.abs(vF) / h, 21 * drivetrain.brake) * h;
      }
      if (input.handbrake) {
        // Locked rear wheels: sliding friction on the rear axle, no more.
        vF -= Math.sign(vF) * Math.min(Math.abs(vF) / h, 4.2 * surface.mu) * h;
      }
      vF += (drivetrain.engineBrake / this.spec.mass) * h;

      // Rolling resistance, aero drag and the extra cost of rough ground.
      vF -= Math.sign(vF) * surface.rolling * h;
      vF -= vF * Math.abs(vF) * surface.drag * h;
      vF -= vF * (this.onRoad ? 0.02 : 0.12) * h;
      if (this.waterDepth > 0) {
        // Water drag: grows with the square of speed and the wetted depth.
        const k = WATER_DRAG * Math.min(this.waterDepth, 1.2);
        vF -= Math.sign(vF) * Math.min(Math.abs(vF) / h, Math.min(WATER_DRAG_MAX, k * vF * vF)) * h;
        vR -= Math.sign(vR) * Math.min(Math.abs(vR) / h, Math.min(WATER_DRAG_MAX, k * vR * vR)) * h;
      }
      if (drivetrain.throttle === 0 && drivetrain.brake === 0 && Math.abs(vF) < 3.5) {
        vF *= Math.exp(-4.5 * h);
      }

      // Gravity down the hill. On the road sample the carved slab itself
      // (±1.8 m), not the hillside blend beside it, or a flat road cut into
      // a slope would keep pulling the car towards the ditch.
      const { gx, gz } = this.terrain.gradient(this.pos.x, this.pos.z, this.onRoad ? 1.8 : 6);
      const denom = 1 + gx * gx + gz * gz;
      vF += (-SLOPE_G * (gx * f.x + gz * f.z) / denom) * h;
      vR += (-SLOPE_G * (gx * r.x + gz * r.z) / denom) * h * 0.8;

      // Slip-based lateral tyre force. The peak grip happens at a small slip
      // angle, then falls away: that is what lets the tail step out on gravel
      // and on the handbrake without the car feeling like it is on ice.
      // Handbrake: the locked rear axle has almost no sideways grip, so the
      // tail steps out like a drift car; after release the grip comes back
      // over a short moment instead of snapping the car straight.
      const gm = GRIP_MODES[this.slideMode] || GRIP_MODES.normal;
      const loose = surface.loose * gm.loose;
      this.slideGrip = input.handbrake ? 0 : Math.min(1, this.slideGrip + h / gm.recover);
      const sliding = input.handbrake || this.slideGrip < 1;
      const slip = Math.atan2(Math.abs(vR), Math.max(1.2, Math.abs(vF)));
      const curveC = 1.55 + loose * 0.3 + (sliding ? 0.35 : 0); // more fall-off past the peak
      const shape = Math.sin(curveC * Math.atan(surface.slipK * gm.slipK * slip));
      const handbrake = input.handbrake ? 0.2 - loose * 0.06 : lerp(0.35, 1, this.slideGrip);
      const mu = surface.mu * bonus * handbrake;
      const maxLat = mu * 9.81 * surface.peak * gm.lateral;
      const latForce = -Math.sign(vR) * maxLat * clamp(shape, 0, 1) * clamp(Math.abs(vR) / 0.35, 0, 1);
      vR += latForce * h;

      // Ruts and loose stones make the tail wander a little.
      if (loose > 0 && Math.abs(vF) > 4) {
        vR += (Math.random() - 0.5) * (1.2 + loose * 3) * h;
      }

      // Steering: a bicycle model (yaw rate = v·tan δ / wheelbase) whose
      // front-wheel angle shrinks with speed, capped by what the tyres can
      // hold — so a fast car takes wide lines instead of twitching, and a
      // loose surface lets the nose rotate further into a slide.
      const absV = Math.abs(vF);
      const delta = this.steer * lerp(MAX_STEER_LOW, MAX_STEER_HIGH, clamp(absV / 50, 0, 1));
      const kinematic = (vF * Math.tan(delta)) / this.spec.wheelbase;
      // Normal grip: the car may only ask for the yaw rate its tyres can
      // deliver (lateral grip / speed), so it tracks the steering instead of
      // sliding wide; loose mode allows 1.1 g plus a bonus on loose ground.
      const yawFromGrip = (maxLat / Math.max(absV, 4)) * gm.yawByGrip;
      const yawArcade = ((surface.mu * 9.81 * 1.1) / Math.max(absV, 4)) * (1 + loose * 0.6);
      const yawCap = (gm.yawByGrip ? Math.min(yawFromGrip, yawArcade) : yawArcade) * (sliding ? 2.4 : 1);
      const targetYawVel = clamp(kinematic, -yawCap, yawCap) * clamp(absV / 1.5, 0, 1);
      const gripResponse = input.handbrake ? 2.6 : sliding ? 4.5 : 8.0 - loose * 3;
      this.yawVel = damp(this.yawVel, targetYawVel, gripResponse, h);
      if (input.handbrake && absV > 5) {
        // Initiation: yank the tail round in the steered direction.
        this.yawVel += this.steer * (2.4 + loose * 1.2) * clamp(absV / 15, 0, 1) * h;
        vR -= this.steer * (1.6 + loose) * clamp(absV / 15, 0, 1) * h;
      }
      // Power oversteer on loose ground: a rear-engined car swings its tail.
      if (loose > 0 && drivetrain.throttle > 0.6 && absV > 6) {
        this.yawVel += this.steer * drivetrain.throttle * loose * 1.6 * gm.kick * clamp(absV / 15, 0, 1) * h;
        vR -= this.steer * drivetrain.throttle * loose * 2.2 * gm.kick * h;
      }
      this.drifting = Math.abs(vR) > (2.6 - loose * 1.0) && Math.hypot(vF, vR) > 6;

      // Jump: a vertical impulse off the springs. Only from a grounded stance.
      if (jump && this.airTime < 0.15) {
        // Lift the chassis clear of the surface first, otherwise the landing
        // check at the end of this same step would immediately cancel the jump.
        const g = this.groundAt(this.pos.x, this.pos.z);
        this.pos.y = g + 0.22;
        this.bounce = 0.22;
        this.bounceVel = 0;
        this.verticalVel = this.spec.jump;
        this.grounded = false;
        this.airTime = 0;
        this.airborneAt = 0;
      }
    } else {
      // Airborne: keep the engine spinning, allow a little yaw authority.
      this.drifting = false;
      this.yawVel = damp(this.yawVel, this.yawVel * 0.985, 0.3, h);
      vF -= vF * 0.035 * h;
      this.airControl = damp(this.airControl, this.steer * 0.55, 2.0, h);
      this.yawVel += this.airControl * h;
    }

    // Momentum lives in the world frame: the body turns *under* the velocity,
    // so yawing faster than the tyres can bend the path leaves the car
    // travelling sideways (slip) until the lateral grip pulls it back. This
    // is what makes a handbrake turn or a gravel slide actually slide.
    const vx = f.x * vF + r.x * vR;
    const vz = f.z * vF + r.z * vR;
    this.yaw = wrapAngle(this.yaw + this.yawVel * h);
    const f2 = this.forward();
    const r2 = this.right();
    vF = vx * f2.x + vz * f2.z;
    vR = vx * r2.x + vz * r2.z;
    this.vel.set(vx, vz);

    const nx = this.pos.x + this.vel.x * h;
    const nz = this.pos.z + this.vel.y * h;
    if (this.terrain.inside(nx, nz, 3)) {
      this.pos.x = nx;
      this.pos.z = nz;
    } else {
      this.vel.multiplyScalar(0.2);
      vF *= 0.2;
      vR *= 0.2;
    }

    const groundY = this.groundAt(this.pos.x, this.pos.z);
    // Anti-tunneling recovery: if a hiccup ever leaves the body well below the
    // surface (the classic "phasing through the ground" glitch), snap back up
    // instead of driving inside the mountain.
    if (this.pos.y < groundY - 0.9) {
      this.pos.y = groundY;
      this.bounce = 0;
      this.bounceVel = Math.max(0, this.bounceVel);
      this.verticalVel = 0;
      this.grounded = true;
    }
    if (this.grounded) {
      // Spring/damper body bounce around the surface, then the four raycast
      // wheel contacts decide whether there is still ground under the car.
      this.bounceVel += (-this.spec.springK * this.bounce - this.spec.springD * this.bounceVel) * h;
      // Real suspension travel: the body may dip a hand's width, no more.
      // Anything beyond that is absorbed by the wheels (updateVisual).
      this.bounce = clamp(this.bounce + this.bounceVel * h, -this.spec.travel.down, this.spec.travel.up);
      if (this.bounce <= -this.spec.travel.down) this.bounceVel = Math.max(0, this.bounceVel);
      this.pos.y = groundY + this.bounce;

      const contacts = this.sampleWheels(groundY);
      if (contacts === 0 && this.pos.y > groundY + 0.5) {
        this.grounded = false;
        this.airborneAt = 0;
        this.verticalVel = Math.max(0.6, this.verticalVel);
      }
    } else {
      this.verticalVel -= GRAVITY * h;
      this.pos.y += this.verticalVel * h;
      if (this.airborneAt >= 0) this.airborneAt += h;
      if (this.pos.y <= groundY) {
        // The suspension eats the landing instead of the car snapping to the
        // surface. A hard landing bottoms out the springs and pitches forward.
        const impact = -this.verticalVel;
        this.landingImpact = clamp(impact / 12, 0, 1);
        this.pos.y = groundY;
        this.bounce = -clamp(impact * 0.015, 0, this.spec.travel.down);
        this.bounceVel = -clamp(impact * 0.12, 0, 2.4);
        this.verticalVel = 0;
        this.grounded = true;
        this.airborneAt = -1;
      }
    }

    this.vF = vF;
    this.vR = vR;
  }

  /** Sample each wheel's patch and return how many are in contact. */
  sampleWheels(groundY) {
    const f = this.forward();
    const r = this.right();
    let contacts = 0;
    for (let i = 0; i < this.wheels.length; i++) {
      const w = this.wheels[i];
      const wx = this.pos.x + f.x * w.z + r.x * w.x;
      const wz = this.pos.z + f.z * w.z + r.z * w.x;
      const gy = this.groundAt(wx, wz);
      const drop = groundY - gy;
      this.wheelCompression[i] = clamp(drop * 1.6, -0.22, 0.3);
      if (gy < this.pos.y + 0.55) contacts++;
    }
    return contacts;
  }

  updateVisual(dt, speed) {
    const f = this.forward();
    const r = this.right();
    const e = 3.2;
    const hFront = this.groundAt(this.pos.x + f.x * 1.4, this.pos.z + f.z * 1.4);
    const hBack = this.groundAt(this.pos.x - f.x * 1.4, this.pos.z - f.z * 1.4);
    const hRight = this.groundAt(this.pos.x + r.x * 0.85, this.pos.z + r.z * 0.85);
    const hLeft = this.groundAt(this.pos.x - r.x * 0.85, this.pos.z - r.z * 0.85);

    let pitchTarget;
    let rollTarget;
    if (this.grounded) {
      pitchTarget = Math.atan2(hBack - hFront, e);
      rollTarget = Math.atan2(hRight - hLeft, e * 0.54);
      pitchTarget = clamp(pitchTarget, -0.7, 0.7);
      rollTarget = clamp(rollTarget, -0.6, 0.6);
    } else {
      pitchTarget = clamp(-this.verticalVel * 0.035, -0.4, 0.4);
      rollTarget = this.roll * 0.98;
    }

    this.pitch = damp(this.pitch, pitchTarget, this.grounded ? 10 : 2, dt);
    this.roll = damp(this.roll, rollTarget, this.grounded ? 9 : 2, dt);

    // Weight transfer: lean into corners, dive under braking, squat on power.
    const lateralAccel = this.yawVel * this.vF;
    const longitudinalAccel = (this.vF - (this.prevVF ?? this.vF)) / Math.max(dt, 0.0001);
    this.prevVF = this.vF;
    this.bodyRoll = damp(this.bodyRoll, clamp(-lateralAccel * 0.010, -0.16, 0.16), 7, dt);
    this.bodyPitch = damp(
      this.bodyPitch,
      clamp(-longitudinalAccel * 0.006, -0.09, 0.09) + this.bounce * 0.35,
      7,
      dt,
    );

    this.group.position.copy(this.pos);
    this.group.position.y += 0.02 + this.bounce * 0.25;
    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch + this.bodyPitch);
    const qRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.roll + this.bodyRoll);
    this.group.quaternion.copy(qYaw).multiply(qPitch).multiply(qRoll);

    this.steerVisual = damp(this.steerVisual, this.steer * 0.48, 12, dt);
    this.wheelSpin += (this.vF / this.spec.wheelRadius) * dt;
    if (!this.handbrakeOn) this.rearSpin += (this.vF / this.spec.wheelRadius) * dt; // locked rears stand still
    // Each wheel drops or lifts to meet the ground beneath it (in car space),
    // so the tyres follow ruts and crests instead of hovering or clipping.
    this.group.updateMatrixWorld(true);
    const R = this.spec.wheelRadius;
    const maxUp = R + this.spec.travel.down;
    let lift = 0;
    for (const w of this.wheels) {
      const wx = this.pos.x + f.x * w.z + r.x * w.x;
      const wz = this.pos.z + f.z * w.z + r.z * w.x;
      this.tmpV.set(wx, this.groundAt(wx, wz), wz);
      this.group.worldToLocal(this.tmpV);
      const want = this.tmpV.y + R;
      // Ground higher than the suspension can absorb: lift the whole body.
      if (this.grounded && want > maxUp) lift = Math.max(lift, want - maxUp);
      const rest = this.grounded
        ? clamp(want, R - this.spec.travel.up, maxUp)
        : R - this.spec.travel.up * 0.6;
      // Compression is instant (the ground pushes the wheel up); rebound is damped.
      w.pivot.position.y = rest >= w.pivot.position.y ? rest : damp(w.pivot.position.y, rest, 22, dt);
      w.spin.rotation.x = w.front ? this.wheelSpin : this.rearSpin;
      if (w.front) w.pivot.rotation.y = this.steerVisual;
    }
    if (lift > 0) {
      this.group.position.y += lift;
      this.group.updateMatrixWorld(true);
    }
    // Final guarantee in world space: no wheel's lowest point under the
    // ground at its own position, whatever the body's pitch and roll did.
    if (this.grounded) {
      let deficit = 0;
      for (const w of this.wheels) {
        this.tmpV.copy(w.pivot.position);
        this.group.localToWorld(this.tmpV);
        const bottom = this.tmpV.y - R;
        deficit = Math.max(deficit, this.groundAt(this.tmpV.x, this.tmpV.z) - bottom);
      }
      if (deficit > 0.005) {
        this.group.position.y += deficit;
        this.group.updateMatrixWorld(true);
      }
    }

    this.blobShadow.material.opacity = clamp(1 - this.airTime * 1.4, 0, 1);
  }

  /* ---------------------------------------------------------------- *
   *  Water: splash on entry, bow spray while wading, drag, recovery    *
   * ---------------------------------------------------------------- */
  updateWater(dt, speed) {
    const w = this.terrain.waterAt ? this.terrain.waterAt(this.pos.x, this.pos.z) : null;
    // Only water the body has actually reached counts: a car flying over the
    // fjord is dry until it comes down to the surface.
    const depth = w && w.depth > 0 && this.pos.y <= w.surface + 0.15 ? w.depth : 0;
    this.splash = 0;
    this.recovered = false;
    // Two splashes: the wheels breaking the surface at the shore, and the
    // bonnet going under when the bed drops away into deep water.
    const shoreline = depth > 0.08 && this.waterDepth <= 0.08;
    const plunge = depth > 0.6 && this.waterDepth <= 0.6 && this.waterDepth > 0;
    if (shoreline || plunge) {
      const impact = speed + 12 * this.landingImpact;
      if (impact > 2) {
        this.splash = clamp(impact / 25, 0.15, 1) * (plunge ? 1 : clamp(depth / 0.6, 0.4, 1));
        this.waterSurface = w.surface;
        this.emitSplash(this.splash);
      }
    }
    this.waterDepth = depth;
    this.waterSurface = w ? w.surface : this.pos.y;
    if (depth <= 0) {
      if (this.grounded && speed > 1) this.lastDry = { x: this.pos.x, z: this.pos.z, yaw: this.yaw };
      this.sunkTime = 0;
    } else {
      if (this.grounded && speed > 2.5) this.emitSpray(speed, depth, dt);
      if (depth >= SINK_DEPTH) {
        this.sunkTime += dt;
        if (this.sunkTime > SINK_TIME) {
          // Roof under for a while: fish the car out onto the last dry ground.
          this.reset(this.lastDry || undefined);
          this.recovered = true;
        }
      }
    }
    this.integrateParticles(this.spray, dt, 9.5);
  }

  spawnParticle(sys, x, y, z, vx, vy, vz, life, floor) {
    const p = sys.particles[sys.next];
    sys.next = (sys.next + 1) % sys.count;
    p.life = p.maxLife = life;
    p.x = x; p.y = y; p.z = z;
    p.vx = vx; p.vy = vy; p.vz = vz;
    p.floor = floor;
  }

  /** A crown of water thrown up all round the car as it hits the surface. */
  emitSplash(strength) {
    const y0 = this.waterSurface;
    const n = Math.round(40 + 120 * strength);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const radius = 0.8 + Math.random() * 1.8;
      const out = 1 + Math.random() * 6 * strength;
      this.spawnParticle(
        this.spray,
        this.pos.x + Math.cos(a) * radius, y0 + 0.05, this.pos.z + Math.sin(a) * radius,
        Math.cos(a) * out + this.vel.x * 0.25, (3.5 + 10 * strength) * (0.4 + Math.random() * 0.8), Math.sin(a) * out + this.vel.y * 0.25,
        0.6 + Math.random() * 0.9, y0 - 0.1,
      );
    }
  }

  /** Bow wave off the front wheels while driving through water. */
  emitSpray(speed, depth, dt) {
    this.sprayClock += dt;
    if (this.sprayClock < 0.025) return;
    this.sprayClock = 0;
    const f = this.forward();
    const r = this.right();
    const y0 = this.waterSurface;
    const wet = Math.min(1, depth / 0.4);
    const per = 1 + Math.floor(speed / 12);
    for (const side of [-1, 1]) {
      for (let i = 0; i < per; i++) {
        const out = (0.8 + speed * 0.08) * side * (0.6 + Math.random() * 0.6);
        this.spawnParticle(
          this.spray,
          this.pos.x + f.x * 1.3 + r.x * side * 0.9, y0, this.pos.z + f.z * 1.3 + r.z * side * 0.9,
          this.vel.x * 0.35 + r.x * out, (1.2 + speed * 0.1 + depth) * wet * (0.5 + Math.random()), this.vel.y * 0.35 + r.z * out,
          0.35 + Math.random() * 0.35, y0 - 0.1,
        );
      }
    }
  }

  /** Advance a particle pool under gravity; drops die at their floor (the water surface). */
  integrateParticles(sys, dt, gravity) {
    for (let i = 0; i < sys.count; i++) {
      const p = sys.particles[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= gravity * dt;
      if (p.life <= 0 || p.y < p.floor) {
        p.life = 0;
        sys.positions[i * 3 + 1] = -9999;
        continue;
      }
      sys.positions[i * 3] = p.x;
      sys.positions[i * 3 + 1] = p.y;
      sys.positions[i * 3 + 2] = p.z;
    }
    sys.points.geometry.attributes.position.needsUpdate = true;
  }

  updateDust(dt, speed, throttle) {
    const d = this.dust;
    d.clock += dt;
    const surface = SURFACES[this.surfaceKind] || SURFACES.gravel;
    // Asphalt stays clean unless the tyres are sliding (then it is smoke);
    // gravel and open ground throw a plume at speed.
    const sliding = this.drifting || this.handbrakeOn;
    const wantDust = this.grounded && speed > 5 && ((surface.dust && (!this.onRoad || sliding || throttle > 0.9 || speed > 12)) || (!surface.dust && sliding));
    d.points.material.color.setHex(surface.dust ? 0xcfc3a1 : 0xd9d9d6);
    if (wantDust && d.clock > 0.035) {
      d.clock = 0;
      const f = this.forward();
      const r = this.right();
      for (const side of [-1, 1]) {
        const p = d.particles[d.next];
        d.next = (d.next + 1) % d.count;
        p.life = p.maxLife = 0.65 + Math.random() * 0.55;
        p.x = this.pos.x - f.x * 1.5 + r.x * side * 0.8;
        p.z = this.pos.z - f.z * 1.5 + r.z * side * 0.8;
        p.y = this.pos.y + 0.12;
        p.vx = -this.vel.x * 0.16 + (Math.random() - 0.5) * 0.7;
        p.vz = -this.vel.y * 0.16 + (Math.random() - 0.5) * 0.7;
        p.vy = 0.7 + Math.random() * 1.2;
      }
    }
    for (let i = 0; i < d.count; i++) {
      const p = d.particles[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) {
        d.positions[i * 3 + 1] = -9999;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy += 1.0 * dt;
      const fade = p.life / p.maxLife;
      d.positions[i * 3] = p.x;
      d.positions[i * 3 + 1] = p.y;
      d.positions[i * 3 + 2] = p.z;
      if (fade < 0.02) d.positions[i * 3 + 1] = -9999;
    }
    d.points.geometry.attributes.position.needsUpdate = true;
  }
}
