import * as THREE from 'three';
import { clamp, damp, lerp, wrapAngle } from './geo.js';
import { ROAD_RIBBON_LIFT, ROAD_CROWN, ROAD_SHOULDER } from './stage.js';

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
const MASS = 1180;                 // kg
const GRAVITY = 19.6;              // game gravity: 2 g feels snappier than 9.81
// Phase 3 (V5 plan): stiffer suspension + a fine physics step. The car's ray
// contacts read the exact same height array the terrain mesh is built from,
// and the 1/120 s substeps (with a recovery guard below) stop a fast car from
// tunnelling through a crest or a freshly carved road.
const SUSPENSION_K = 190;          // spring back to the ground (per second²)
const SUSPENSION_D = 14;           // damping of the body bounce
const MAX_SUBSTEPS = 8;            // physics substeps per rendered frame
const GEAR_RATIOS = [-3.40, 3.55, 2.35, 1.72, 1.32, 1.04, 0.84];
const REVERSE = 0;
const FINAL_DRIVE = 3.9;
const IDLE_RPM = 900;
const REDLINE_RPM = 7200;
const PEAK_TORQUE_RPM = 4200;
const MAX_TORQUE = 430;            // Nm at peak (rally tune)
const AUTO_UPSHIFT = 6500;
const AUTO_DOWNSHIFT = 1950;
const SHIFT_TIME = 0.28;

const SURFACES = {
  road: { mu: 1.02, rolling: 0.5, drag: 0.0011 },
  gravel: { mu: 0.76, rolling: 2.0, drag: 0.003 },
};

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
function engineTorque(rpm) {
  const x = clamp((rpm - IDLE_RPM) / (REDLINE_RPM - IDLE_RPM), 0, 1);
  // A soft peak around 65% of the rev range, then a gentle drop-off.
  const curve = Math.sin(Math.PI * Math.pow(x, 0.9)) * 0.55 + 0.55;
  return MAX_TORQUE * clamp(curve, 0.25, 1);
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

export class Car {
  constructor(scene, terrain) {
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
    this.drifting = false;
    this.airTime = 0;
    this.landingImpact = 0;
    this.distance = 0;
    this.wrongWay = false;

    this.pitch = 0;
    this.roll = 0;
    this.bodyRoll = 0;
    this.bodyPitch = 0;
    this.wheelSpin = 0;
    this.wheelCompression = [0, 0, 0, 0];

    // Drivetrain state.
    this.gear = 1;
    this.autoShift = true;
    this.rpm = IDLE_RPM;
    this.shiftTimer = 0;
    this.engineLoad = 0;
    this.airborneAt = -1;
    this.airControl = 0;
    this.roadLift = 0;

    this.group = new THREE.Group();
    this.group.name = 'car';
    this.buildModel();
    scene.add(this.group);

    this.dust = this.createDust();
    scene.add(this.dust.points);
  }

  buildModel() {
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
    const tireFront = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.3, 18);
    tireFront.rotateZ(Math.PI / 2);
    const tireRear = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.36, 18);
    tireRear.rotateZ(Math.PI / 2);
    const hubGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.38, 10);
    hubGeo.rotateZ(Math.PI / 2);
    const positions = [
      [-TRACK / 2, FRONT_AXLE, true],
      [TRACK / 2, FRONT_AXLE, true],
      [-TRACK / 2, REAR_AXLE, false],
      [TRACK / 2, REAR_AXLE, false],
    ];
    for (const [x, z, front] of positions) {
      const pivot = new THREE.Group();
      pivot.position.set(x, WHEEL_RADIUS, z);
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
      new THREE.PlaneGeometry(2.8, 4.6),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.02;
    g.add(blob);
    this.blobShadow = blob;
    this.tmpV = new THREE.Vector3();
  }

  createDust() {
    const count = 90;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    positions.fill(-9999);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xcfc3a1,
      size: 0.7,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return {
      points,
      count,
      positions,
      particles: Array.from({ length: count }, () => ({
        life: 0, maxLife: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
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
    this.rpm = IDLE_RPM;
    this.shiftTimer = 0;
    this.airborneAt = -1;
    this.group.position.copy(this.pos);
    this.group.quaternion.identity();
    this.group.rotateY(this.yaw);
    for (const p of this.dust.particles) p.life = 0;
    this.dust.positions.fill(-9999);
    this.dust.points.geometry.attributes.position.needsUpdate = true;
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

  /** Height of whatever the tyres are standing on: ground, or ground + ribbon. */
  groundAt(x, z) {
    return this.terrain.sample(x, z) + this.roadLift;
  }

  right() {
    return { x: Math.cos(this.yaw), z: -Math.sin(this.yaw) };
  }

  /** Ratio for the current gear (0 = reverse, 1..6 = forward). */
  gearRatio() {
    return GEAR_RATIOS[Math.max(0, this.gear)] ?? 1;
  }

  shift(nextGear) {
    const gear = clamp(nextGear, 0, GEAR_RATIOS.length - 1);
    if (gear === this.gear) return;
    this.gear = gear;
    this.shiftTimer = SHIFT_TIME;
  }

  updateDrivetrain(dt, input, surface) {
    const throttle = clamp(input.throttle || 0, 0, 1);
    const brake = clamp(input.brake || 0, 0, 1);
    const reversing = this.gear === REVERSE;
    const wheelSpeed = Math.abs(this.vF);
    const wheelRpm = (wheelSpeed / (2 * Math.PI * WHEEL_RADIUS)) * 60;
    const ratio = Math.abs(this.gearRatio()) * FINAL_DRIVE;
    const targetRpm = clamp(wheelRpm * ratio, IDLE_RPM, REDLINE_RPM);
    // Blip the revs a little under throttle even when stationary.
    const powerInput = reversing ? brake : throttle;
    const freeRev = powerInput > 0 && wheelSpeed < 1 ? 1 : 0;
    this.rpm = damp(this.rpm, Math.max(targetRpm, IDLE_RPM + freeRev * 900), 9, dt);

    this.shiftTimer = Math.max(0, this.shiftTimer - dt);
    if (this.gear === REVERSE) {
      if (throttle > 0.1 && this.vF > -0.5) this.shift(1);
    } else if (brake > 0.5 && this.vF < 0.4 && Math.abs(this.vF) < 1.4) {
      this.shift(REVERSE);
    }

    if (this.autoShift && this.shiftTimer <= 0) {
      if (this.gear !== REVERSE) {
        if (this.rpm > AUTO_UPSHIFT && throttle > 0.25 && this.gear < GEAR_RATIOS.length - 1) {
          this.shift(this.gear + 1);
        } else if (this.rpm < AUTO_DOWNSHIFT && this.gear > 1) {
          this.shift(this.gear - 1);
        }
      }
    } else if (!this.autoShift) {
      if (input.shiftUp) this.shift(this.gear + 1);
      if (input.shiftDown && this.gear > 1) this.shift(this.gear - 1);
    }

    // Torque at the wheels, minus a clutch cut while shifting.
    const shifting = this.shiftTimer > 0.12;
    const torque = engineTorque(this.rpm) * powerInput * (shifting ? 0.15 : 1) * (this.grounded ? 1 : 0.35);
    const driveForce = ((torque * ratio) / WHEEL_RADIUS) * (reversing ? -1 : 1);
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
      return {
        speed: 0, vF: 0, vR: 0, rpm: IDLE_RPM, gear: 1,
        onRoad: this.onRoad, drifting: false, grounded: true,
        progress: this.progress || 0, wrongWay: false, landingImpact: 0,
      };
    }

    // Fixed substeps keep the suspension stable when a frame hitches, and a
    // fine step is what stops a fast car from falling through the ground
    // (Phase 3, "anti-tunneling": the cannon-es advice applied to the raycast
    // vehicle — smaller dt, stiffer suspension).
    const steps = clamp(Math.ceil(dt / (1 / 120)), 1, MAX_SUBSTEPS);
    const h = dt / steps;
    const surface = this.onRoad ? SURFACES.road : SURFACES.gravel;
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
    };
  }

  simulateStep(h, input, drivetrain, surface, { jump }) {
    const f = this.forward();
    const r = this.right();
    let vF = this.vF;
    let vR = this.vR;

    if (this.grounded) {
      // Engine, brakes and the ground.
      vF += (drivetrain.driveForce / MASS) * h;
      if (drivetrain.brake > 0) {
        vF -= Math.sign(vF) * Math.min(Math.abs(vF) / h, 21 * drivetrain.brake) * h;
      }
      if (input.handbrake) {
        vF -= Math.sign(vF) * Math.min(Math.abs(vF) / h, 5.0) * h;
      }
      vF += (drivetrain.engineBrake / MASS) * h;

      // Rolling resistance, aero drag and the extra cost of rough ground.
      vF -= Math.sign(vF) * surface.rolling * h;
      vF -= vF * Math.abs(vF) * surface.drag * h;
      vF -= vF * (this.onRoad ? 0.02 : 0.12) * h;
      if (drivetrain.throttle === 0 && drivetrain.brake === 0 && Math.abs(vF) < 3.5) {
        vF *= Math.exp(-4.5 * h);
      }

      // Gravity down the hill. On the road sample the carved slab itself
      // (±1.8 m), not the hillside blend beside it, or a flat road cut into
      // a slope would keep pulling the car towards the ditch.
      const { gx, gz } = this.terrain.gradient(this.pos.x, this.pos.z, this.onRoad ? 1.8 : 6);
      const denom = 1 + gx * gx + gz * gz;
      vF += (-9.81 * (gx * f.x + gz * f.z) / denom) * h;
      vR += (-9.81 * (gx * r.x + gz * r.z) / denom) * h * 0.55;

      // Slip-based lateral tyre force. The peak grip happens at a small slip
      // angle, then falls away: that is what lets the tail step out on gravel
      // and on the handbrake without the car feeling like it is on ice.
      const slip = Math.atan2(Math.abs(vR), Math.max(1.2, Math.abs(vF)));
      const shape = Math.sin(1.55 * Math.atan(9.0 * slip));
      const handbrake = input.handbrake ? 0.38 : 1;
      const mu = surface.mu * handbrake;
      const maxLat = mu * 9.81 * 1.15;
      const latForce = -Math.sign(vR) * maxLat * clamp(shape, 0, 1) * clamp(Math.abs(vR) / 0.35, 0, 1);
      vR += latForce * h;

      // Ruts and loose stones make the tail wander a little.
      if (!this.onRoad && Math.abs(vF) > 4) {
        vR += (Math.random() - 0.5) * 2.4 * h;
      }

      // Steering uses a bicycle model; the yaw authority softens with speed.
      const turnRate = this.steer * clamp(2.95 - Math.abs(vF) * 0.032, 1.15, 2.95);
      const targetYawVel = turnRate * Math.sign(vF || 1) * clamp(Math.abs(vF) / 2.6, 0, 1);
      const gripResponse = input.handbrake ? 4.0 : 9.5;
      this.yawVel = damp(this.yawVel, targetYawVel, gripResponse, h);
      if (input.handbrake && Math.abs(vF) > 6) {
        this.yawVel += this.steer * 1.5 * clamp(Math.abs(vF) / 20, 0, 1) * h;
      }
      this.drifting = Math.abs(vR) > 3.2 && Math.hypot(vF, vR) > 7;

      // Jump: a vertical impulse off the springs. Only from a grounded stance.
      if (jump && this.airTime < 0.15) {
        // Lift the chassis clear of the surface first, otherwise the landing
        // check at the end of this same step would immediately cancel the jump.
        const g = this.groundAt(this.pos.x, this.pos.z);
        this.pos.y = g + 0.22;
        this.bounce = 0.22;
        this.bounceVel = 0;
        this.verticalVel = 6.2;
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

    this.yaw = wrapAngle(this.yaw + this.yawVel * h);
    const f2 = this.forward();
    const r2 = this.right();
    this.vel.set(f2.x * vF + r2.x * vR, f2.z * vF + r2.z * vR);

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
      this.bounceVel += (-SUSPENSION_K * this.bounce - SUSPENSION_D * this.bounceVel) * h;
      // Real suspension travel: the body may dip a hand's width, no more.
      // Anything beyond that is absorbed by the wheels (updateVisual).
      this.bounce = clamp(this.bounce + this.bounceVel * h, -WHEEL_TRAVEL.down, WHEEL_TRAVEL.up);
      if (this.bounce <= -WHEEL_TRAVEL.down) this.bounceVel = Math.max(0, this.bounceVel);
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
        this.bounce = -clamp(impact * 0.015, 0, WHEEL_TRAVEL.down);
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
    const hFront = this.terrain.sample(this.pos.x + f.x * 1.4, this.pos.z + f.z * 1.4);
    const hBack = this.terrain.sample(this.pos.x - f.x * 1.4, this.pos.z - f.z * 1.4);
    const hRight = this.terrain.sample(this.pos.x + r.x * 0.85, this.pos.z + r.z * 0.85);
    const hLeft = this.terrain.sample(this.pos.x - r.x * 0.85, this.pos.z - r.z * 0.85);

    let pitchTarget;
    let rollTarget;
    if (this.grounded) {
      pitchTarget = Math.atan2(hBack - hFront, e);
      rollTarget = Math.atan2(hRight - hLeft, e * 0.54);
      pitchTarget = clamp(pitchTarget, -0.55, 0.55);
      rollTarget = clamp(rollTarget, -0.4, 0.4);
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
    this.wheelSpin += (this.vF / WHEEL_RADIUS) * dt;
    // Each wheel drops or lifts to meet the ground beneath it (in car space),
    // so the tyres follow ruts and crests instead of hovering or clipping.
    this.group.updateMatrixWorld(true);
    for (const w of this.wheels) {
      const wx = this.pos.x + f.x * w.z + r.x * w.x;
      const wz = this.pos.z + f.z * w.z + r.z * w.x;
      this.tmpV.set(wx, this.groundAt(wx, wz), wz);
      this.group.worldToLocal(this.tmpV);
      const rest = this.grounded
        ? clamp(this.tmpV.y + WHEEL_RADIUS, WHEEL_RADIUS - WHEEL_TRAVEL.up, WHEEL_RADIUS + WHEEL_TRAVEL.down)
        : WHEEL_RADIUS - WHEEL_TRAVEL.up * 0.6;
      w.pivot.position.y = damp(w.pivot.position.y, rest, 22, dt);
      w.spin.rotation.x = this.wheelSpin;
      if (w.front) w.pivot.rotation.y = this.steerVisual;
    }

    this.blobShadow.material.opacity = clamp(1 - this.airTime * 1.4, 0, 1);
  }

  updateDust(dt, speed, throttle) {
    const d = this.dust;
    d.clock += dt;
    const wantDust = this.grounded && speed > 5 && (!this.onRoad || this.drifting || throttle > 0.9);
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
