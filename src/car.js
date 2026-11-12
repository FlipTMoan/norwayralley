import * as THREE from 'three';
import { clamp, damp, lerp, wrapAngle } from './geo.js';

const WHEELBASE = 2.72;
const TRACK = 1.58;
const WHEEL_RADIUS = 0.38;

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
    this.grounded = true;
    this.steer = 0;
    this.steerVisual = 0;
    this.vF = 0;
    this.vR = 0;
    this.speed = 0;
    this.onRoad = false;
    this.drifting = false;
    this.airTime = 0;
    this.distance = 0;
    this.wrongWay = false;

    this.pitch = 0;
    this.roll = 0;
    this.bodyRoll = 0;
    this.wheelSpin = 0;

    this.group = new THREE.Group();
    this.group.name = 'car';
    this.buildModel();
    scene.add(this.group);

    this.dust = this.createDust();
    scene.add(this.dust.points);
  }

  buildModel() {
    const g = this.group;
    const paint = new THREE.MeshLambertMaterial({ color: 0xd34a31, flatShading: true });
    const paintDark = new THREE.MeshLambertMaterial({ color: 0x9e2f22, flatShading: true });
    const cream = new THREE.MeshLambertMaterial({ color: 0xf3ead8, flatShading: true });
    const glass = new THREE.MeshLambertMaterial({ color: 0x1d2f39, flatShading: true });
    const black = new THREE.MeshLambertMaterial({ color: 0x171a19, flatShading: true });
    const chrome = new THREE.MeshLambertMaterial({ color: 0xd7d2c3, flatShading: true });
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8, toneMapped: false });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3a2a, toneMapped: false });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.48, 4.0), paint);
    body.position.y = 0.68;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.34, 0.55), paintDark);
    nose.position.set(0, 0.58, 2.06);
    nose.castShadow = true;
    g.add(nose);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.58, 1.85), glass);
    cabin.position.set(0, 1.14, -0.18);
    cabin.castShadow = true;
    g.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.14, 1.55), cream);
    roof.position.set(0, 1.47, -0.23);
    roof.castShadow = true;
    g.add(roof);

    const roofNumber = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.72),
      new THREE.MeshBasicMaterial({ map: makeNumberTexture('37'), toneMapped: false }),
    );
    roofNumber.rotation.x = -Math.PI / 2;
    roofNumber.position.set(0.28, 1.545, -0.22);
    g.add(roofNumber);

    for (const x of [-0.72, 0.72]) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.06), lightMat);
      lamp.position.set(x, 0.7, 2.02 + 0.02);
      g.add(lamp);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.06), tailMat);
      tail.position.set(x, 0.72, -2.02);
      g.add(tail);
    }

    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.15, 0.18), black);
    bumperF.position.set(0, 0.42, 2.1);
    g.add(bumperF);
    const bumperR = bumperF.clone();
    bumperR.position.z = -2.1;
    g.add(bumperR);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 4.02), cream);
    stripe.position.set(0, 0.94, 0);
    g.add(stripe);

    // Little mud flaps and exhaust: the kind of detail a PS1 rally car had.
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.32, 6), chrome);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(-0.55, 0.34, -2.1);
    g.add(exhaust);

    this.wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.3, 10);
    wheelGeo.rotateZ(Math.PI / 2);
    const hubGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.32, 8);
    hubGeo.rotateZ(Math.PI / 2);
    const positions = [
      [-TRACK / 2, 0.38, 1.34, true],
      [TRACK / 2, 0.38, 1.34, true],
      [-TRACK / 2, 0.38, -1.32, false],
      [TRACK / 2, 0.38, -1.32, false],
    ];
    for (const [x, y, z, front] of positions) {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, z);
      const spin = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeo, black);
      tire.castShadow = true;
      const hub = new THREE.Mesh(hubGeo, chrome);
      spin.add(tire, hub);
      pivot.add(spin);
      g.add(pivot);
      this.wheels.push({ pivot, spin, front });
    }

    // A soft blob shadow helps the car feel planted even in flat light.
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
      new THREE.PlaneGeometry(3.2, 4.6),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.02;
    g.add(blob);
    this.blobShadow = blob;
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
    this.yawVel = 0;
    this.verticalVel = 0;
    this.grounded = true;
    this.steer = 0;
    this.steerVisual = 0;
    this.speed = 0;
    this.vF = 0;
    this.vR = 0;
    this.pitch = 0;
    this.roll = 0;
    this.bodyRoll = 0;
    this.airTime = 0;
    this.distance = 0;
    this.wrongWay = false;
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

  right() {
    return { x: Math.cos(this.yaw), z: -Math.sin(this.yaw) };
  }

  update(dt, input) {
    this.steer = damp(this.steer, input.steer || 0, 12, dt);
    const f = this.forward();
    const r = this.right();

    if (this.route) {
      this.roadQuery = this.route.nearest(this.pos.x, this.pos.z);
      this.onRoad = this.roadQuery.distance <= this.route.roadWidth + 1.0;
      this.progress = this.roadQuery.progress;
    } else {
      this.roadQuery = null;
      this.onRoad = false;
      this.progress = 0;
    }

    if (input.frozen) {
      // The countdown and the intro hold the car on the line. Without this the
      // mountain gravity would gently roll it away before the flag drops.
      this.vel.set(0, 0);
      this.vF = 0;
      this.vR = 0;
      this.speed = 0;
      this.yawVel = 0;
      this.verticalVel = 0;
      this.grounded = true;
      this.pos.y = this.terrain.sample(this.pos.x, this.pos.z);
      this.updateVisual(dt, 0);
      this.updateDust(dt, 0, 0);
      return {
        speed: 0,
        vF: 0,
        vR: 0,
        onRoad: this.onRoad,
        drifting: false,
        grounded: true,
        progress: this.progress || 0,
        wrongWay: false,
      };
    }

    // Longitudinal and lateral velocity in the car's own frame.
    let vF = this.vel.x * f.x + this.vel.y * f.z;
    let vR = this.vel.x * r.x + this.vel.y * r.z;
    const prevVF = vF;
    const speed = Math.hypot(vF, vR);

    const throttle = clamp(input.throttle || 0, 0, 1);
    const brake = clamp(input.brake || 0, 0, 1);
    const handbrake = !!input.handbrake;

    if (this.grounded) {
      const maxSpeed = this.onRoad ? 56 : 37;
      const power = this.onRoad ? 16.5 : 10.5;

      if (throttle > 0) {
        const fade = 1 - clamp(vF / maxSpeed, 0, 1) * 0.88;
        vF += throttle * power * fade * dt;
      }
      if (brake > 0) {
        if (vF > 0.4) vF -= 23 * brake * dt;
        else if (vF > -10) vF -= 7.5 * brake * dt;
      }
      if (handbrake) {
        vF -= Math.sign(vF) * 4.0 * dt;
      }

      // Rolling resistance, aero drag and the extra cost of rough ground.
      vF -= Math.sign(vF) * (this.onRoad ? 0.55 : 2.2) * dt;
      vF -= vF * Math.abs(vF) * (this.onRoad ? 0.0018 : 0.0042) * dt;
      vF -= vF * (this.onRoad ? 0.08 : 0.22) * dt;
      // Engine braking keeps a parked car parked on a slope until the driver
      // actually asks it to move.
      if (throttle === 0 && brake === 0 && Math.abs(vF) < 3.5) {
        vF *= Math.exp(-5.5 * dt);
      }

      // Gravity down the hill.
      const { gx, gz } = this.terrain.gradient(this.pos.x, this.pos.z, 6);
      const denom = 1 + gx * gx + gz * gz;
      vF += (-9.81 * (gx * f.x + gz * f.z) / denom) * dt;
      vR += (-9.81 * (gx * r.x + gz * r.z) / denom) * dt * 0.7;

      // Lateral grip: lots on tarmac, less on gravel, almost none on the handbrake.
      let grip = (this.onRoad ? 7.8 : 5.2) / (1 + speed * 0.014);
      if (handbrake) grip *= 0.19;
      vR *= Math.exp(-grip * dt);

      if (!this.onRoad && speed > 3) {
        vR += (Math.random() - 0.5) * 2.2 * dt;
      }

      // Steering. The bicycle model is softened at speed for arcade feel.
      const turnRate = this.steer * clamp(2.95 - speed * 0.032, 1.15, 2.95);
      const targetYawVel = turnRate * Math.sign(vF || 1) * clamp(Math.abs(vF) / 2.6, 0, 1);
      this.yawVel = damp(this.yawVel, targetYawVel, handbrake ? 4.0 : 9.5, dt);
      if (handbrake && Math.abs(vF) > 6) {
        this.yawVel += this.steer * 1.4 * clamp(speed / 20, 0, 1) * dt;
      }
      this.drifting = Math.abs(vR) > 3.2 && speed > 7;
    } else {
      this.drifting = false;
      this.yawVel = damp(this.yawVel, this.yawVel * 0.985, 0.3, dt);
      vF -= vF * 0.02 * dt;
    }

    this.yaw = wrapAngle(this.yaw + this.yawVel * dt);
    const f2 = this.forward();
    const r2 = this.right();
    this.vel.set(f2.x * vF + r2.x * vR, f2.z * vF + r2.z * vR);

    const nx = this.pos.x + this.vel.x * dt;
    const nz = this.pos.z + this.vel.y * dt;
    if (this.terrain.inside(nx, nz, 3) && this.terrain.sample(nx, nz) > 0.6) {
      this.pos.x = nx;
      this.pos.z = nz;
    } else {
      // Soft edge: stop at the tile boundary instead of falling into the void.
      this.vel.multiplyScalar(0.2);
    }

    const groundY = this.terrain.sample(this.pos.x, this.pos.z);
    if (!this.grounded) {
      this.verticalVel -= 19 * dt;
      this.pos.y += this.verticalVel * dt;
      if (this.pos.y <= groundY) {
        this.pos.y = groundY;
        this.verticalVel = 0;
        this.grounded = true;
      }
    } else {
      const desired = groundY;
      const accel = (desired - this.pos.y) * 155 - this.verticalVel * 20;
      this.verticalVel += accel * dt;
      this.pos.y += this.verticalVel * dt;
      if (this.pos.y < desired) {
        this.pos.y = desired;
        this.verticalVel = Math.max(0, this.verticalVel * 0.25);
      }
      if (this.pos.y > desired + 0.9 && this.verticalVel > 2.0) {
        this.grounded = false;
        this.airTime = 0;
      }
    }
    if (!this.grounded) this.airTime += dt;

    this.vF = vF;
    this.vR = vR;
    this.speed = speed;
    this.distance += Math.abs(vF) * dt;

    // Wrong-way detection uses the direction of travel vs. the stage tangent.
    if (this.roadQuery && speed > 4) {
      const q = this.roadQuery;
      const dot = (this.vel.x * q.tangent.x + this.vel.y * q.tangent.z) / Math.max(0.001, speed);
      this.wrongWay = dot < -0.35;
    } else {
      this.wrongWay = false;
    }

    this.updateVisual(dt, speed);
    this.updateDust(dt, speed, throttle);
    return {
      speed,
      vF,
      vR,
      onRoad: this.onRoad,
      drifting: this.drifting,
      grounded: this.grounded,
      progress: this.progress || 0,
      wrongWay: this.wrongWay,
    };
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
      pitchTarget = clamp(-this.verticalVel * 0.035, -0.35, 0.35);
      rollTarget = this.roll * 0.98;
    }

    this.pitch = damp(this.pitch, pitchTarget, this.grounded ? 10 : 2, dt);
    this.roll = damp(this.roll, rollTarget, this.grounded ? 9 : 2, dt);
    const lateralAccel = this.yawVel * this.vF;
    this.bodyRoll = damp(this.bodyRoll, clamp(-lateralAccel * 0.010, -0.16, 0.16), 7, dt);

    this.group.position.copy(this.pos);
    this.group.position.y += 0.02;
    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
    const qRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.roll + this.bodyRoll);
    this.group.quaternion.copy(qYaw).multiply(qPitch).multiply(qRoll);

    this.steerVisual = damp(this.steerVisual, this.steer * 0.48, 12, dt);
    this.wheelSpin += (this.vF / WHEEL_RADIUS) * dt;
    for (const w of this.wheels) {
      w.spin.rotation.x = this.wheelSpin;
      if (w.front) w.pivot.rotation.y = this.steerVisual;
    }

    // Hide the blob shadow when the car is airborne.
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
      // Dead particles are parked far below the world; the shader stays cheap.
      if (fade < 0.02) d.positions[i * 3 + 1] = -9999;
    }
    d.points.geometry.attributes.position.needsUpdate = true;
  }
}
