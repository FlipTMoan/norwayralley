import * as THREE from 'three';

/**
 * Tyre tracks. Every wheel lays a strip of flat quads on the ground as the
 * car moves: dark ruts on gravel and open ground, black rubber on asphalt
 * only while the tyre is sliding (drift or handbrake). Quads live in a ring
 * buffer per wheel, so the oldest marks fade out of existence as new ones
 * are laid; no allocation per frame. In water the same strips become a
 * pale foam wake drawn on the surface instead of the bed.
 */

const QUADS_PER_WHEEL = 700;      // ~350 m of track per wheel at 0.5 m steps
const STEP = 0.5;                 // metres between marks
const LIFT = 0.035;               // above the ground, under the car
const EARTH = new THREE.Color(0x3a3127);
const RUBBER = new THREE.Color(0x15161a);
const FOAM = new THREE.Color(0xdff2f6);

export class TrackMarks {
  constructor(scene, car) {
    this.scene = scene;
    this.car = car;
    this.wheelCount = car.wheels.length;
    const quads = QUADS_PER_WHEEL * this.wheelCount;
    this.positions = new Float32Array(quads * 4 * 3);
    this.colors = new Float32Array(quads * 4 * 3);
    const index = new Uint32Array(quads * 6);
    for (let q = 0; q < quads; q++) {
      const v = q * 4;
      index.set([v, v + 1, v + 2, v + 2, v + 1, v + 3], q * 6); // wound to face +y
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(index, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6); // never culled
    this.mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,   // visible on any slope, whichever way a quad ends up facing
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }));
    this.mesh.name = 'tyreTracks';
    this.mesh.renderOrder = 2;
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    // Per wheel: next quad slot (ring), last mark point, whether a strip is open.
    this.state = Array.from({ length: this.wheelCount }, () => ({ next: 0, last: null, open: false }));
    this.laid = 0;
    this.tmp = new THREE.Vector3();
  }

  /** Should this wheel mark the ground right now, and in what colour? */
  markFor(car) {
    if (!car.grounded) return null;
    if (car.waterDepth > 0.03) return car.speed > 1.5 ? FOAM : null;
    const sliding = car.drifting || car.handbrakeOn;
    if (car.surfaceKind === 'asphalt') return sliding ? RUBBER : null;
    if (car.speed < 0.8) return null;
    return EARTH;
  }

  update(car = this.car) {
    const color = this.markFor(car);
    car.group.updateMatrixWorld(true);
    const wet = car.waterDepth > 0.03;
    const width = wet ? 0.9 : car.spec.wheelRadius > 0.5 ? 0.5 : 0.3;
    for (let w = 0; w < this.wheelCount; w++) {
      const st = this.state[w];
      if (!color) { st.open = false; continue; }
      const wheel = car.wheels[w];
      this.tmp.copy(wheel.pivot.position);
      car.group.localToWorld(this.tmp);
      const x = this.tmp.x;
      const z = this.tmp.z;
      const y = wet ? car.waterSurface + LIFT : car.groundAt(x, z) + LIFT;
      if (!st.open || !st.last) {
        st.last = { x, y, z };
        st.open = true;
        continue;
      }
      const dx = x - st.last.x;
      const dz = z - st.last.z;
      const d = Math.hypot(dx, dz);
      if (d < STEP) continue;
      if (d > 6) { st.last = { x, y, z }; continue; } // teleport / respawn: start a new strip
      const nx = (-dz / d) * width * 0.5;
      const nz = (dx / d) * width * 0.5;
      const q = w * QUADS_PER_WHEEL + st.next;
      st.next = (st.next + 1) % QUADS_PER_WHEEL;
      const v = q * 4 * 3;
      const p = this.positions;
      p[v] = st.last.x - nx; p[v + 1] = st.last.y; p[v + 2] = st.last.z - nz;
      p[v + 3] = st.last.x + nx; p[v + 4] = st.last.y; p[v + 5] = st.last.z + nz;
      p[v + 6] = x - nx; p[v + 7] = y; p[v + 8] = z - nz;
      p[v + 9] = x + nx; p[v + 10] = y; p[v + 11] = z + nz;
      const c = this.colors;
      for (let k = 0; k < 4; k++) { c[v + k * 3] = color.r; c[v + k * 3 + 1] = color.g; c[v + k * 3 + 2] = color.b; }
      st.last = { x, y, z };
      this.laid++;
      this.dirty = true;
    }
    if (this.dirty) {
      this.mesh.geometry.attributes.position.needsUpdate = true;
      this.mesh.geometry.attributes.color.needsUpdate = true;
      this.dirty = false;
    }
  }

  clear() {
    this.positions.fill(0);
    this.mesh.geometry.attributes.position.needsUpdate = true;
    for (const st of this.state) { st.last = null; st.open = false; }
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
