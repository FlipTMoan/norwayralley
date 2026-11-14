import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { profileHeight, carveProfile, corridorReach, buildCorridorGeometry, SHOULDER, CARVE_MARGIN, LANES } from '../src/corridor.js';
import { makeRoute } from '../src/stage.js';
import { Car } from '../src/car.js';
import { slopedTerrain } from './road-physics.test.mjs';

test('profile: flat shoulder to shoulder, a smooth blend to the cut-through edge, untouched beyond', () => {
  const { half, cut } = LANES.two; // 6.5 m road, 1 m shoulders, 16 m cut-through
  const flat = half + SHOULDER;
  assert.equal(flat, 4.25);
  assert.equal(profileHeight(100, 90, 0, half, cut), 100);
  assert.equal(profileHeight(100, 90, flat, half, cut), 100, 'flat out to the shoulder');
  const mid = profileHeight(100, 90, (flat + cut) / 2, half, cut);
  assert.ok(Math.abs(mid - 95) < 1e-9, `halfway across the terrace blend: ${mid}`);
  assert.equal(profileHeight(100, 90, cut, half, cut), 90, 'natural ground at the cut-through edge');
  assert.equal(profileHeight(100, 90, corridorReach(half, cut) + 1, half, cut), 90, 'untouched beyond');
  // With a smoothed rim height the blend goes to the rim, then feathers to the real ground.
  assert.equal(profileHeight(100, 90, cut, half, cut, 92), 92, 'rim at the smoothed edge height');
  assert.ok(Math.abs(profileHeight(100, 90, cut + 0.75, half, cut, 92) - 91) < 1e-9, 'feather halfway');
  const one = LANES.one;
  assert.equal(one.half + SHOULDER, 2.25, 'single lane: 2.5 m + 1 m shoulders');
  assert.equal(corridorReach(one.half, one.cut), 3 + 1.5, '6 m cut-through plus the feather');
});

test('carveProfile keeps the carriageway exact and tucks the slopes under the margin', () => {
  const n = 81; const cell = 2;
  const base = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) base[j * n + i] = 50 + i * 1.6; // steep side slope: 0.8 m per m across x
  const heights = base.slice();
  const samples = [];
  for (let z = -10; z <= 170; z += 5) samples.push({ x: 80, z, roadY: 114 }); // ground height at the centre line
  carveProfile({ heights, base, x0: 0, z0: 0, cell, n }, [{ half: 3.25, cut: 8, samples }], { lift: 0 }); // two-lane: flat to 4.25 m, cut-through 8 m
  const at = (x, z) => heights[(z / cell) * n + x / cell];
  const ground = (x) => 50 + 0.8 * x;
  assert.ok(Math.abs(at(80, 80) - 114) < 1e-6, 'centre line at road height');
  assert.ok(Math.abs(at(84, 80) - 114) < 1e-6, 'shoulder flat (4 m < 4.25 m)');
  // Low side, 6 m out: in the blend, halfway-ish between road and ground, minus the margin.
  const s6 = (6 - 4.25) / 3.75;
  const blend6 = 114 + (ground(74) - 114) * (s6 * s6 * (3 - 2 * s6)) - CARVE_MARGIN;
  assert.ok(Math.abs(at(74, 80) - blend6) < 1e-3, `terrace blend ${at(74, 80)} vs ${blend6.toFixed(3)}`);
  // At the cut-through edge (8 m) the terrace meets the natural ground: no margin, no step.
  assert.ok(Math.abs(at(72, 80) - ground(72)) < 1e-4, `edge low side ${at(72, 80)}`);
  assert.ok(Math.abs(at(88, 80) - ground(88)) < 1e-4, `edge high side ${at(88, 80)}`);
  assert.equal(at(100, 80), ground(100), 'untouched beyond the cut-through');
  assert.equal(at(160, 80), 50 + 80 * 1.6, 'untouched far from the road');
});

test('corridor mesh follows the profile and respects its vertex budget', () => {
  const samples = [];
  for (let z = 0; z <= 400; z += 5) samples.push({ x: 0, z, roadY: 120 });
  const geo = buildCorridorGeometry([{ half: 3.2, samples, length: 400 }], { sampleBase: (x) => 120 - Math.abs(x) * 0.5, maxVertices: 20000 });
  assert.ok(geo && geo.attributes.position.count <= 20000 + 60);
  const pos = geo.attributes.position;
  let onRoadOk = true;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i); const y = pos.getY(i);
    if (Math.abs(x) <= 3.2 && Math.abs(y - 120.14) > 0.01) onRoadOk = false; // lift 0.12 + 0.02
  }
  assert.ok(onRoadOk, 'carriageway vertices sit at road height');
});

test('the car rides the embankment over a dip instead of falling in', () => {
  // A ridge-and-dip terrain: the road height is smoothed, the ground under
  // the road is 3 m lower in the dip, and the car must stay at road level.
  const terrain = slopedTerrain({ size: 1200, grid: 601, grade: 0 });
  const route = makeRoute([{ x: 0, z: -400 }, { x: 0, z: 400 }], terrain, { roadWidth: 3.2 });
  const dip = (z) => (Math.abs(z) < 30 ? -3 * (1 - Math.abs(z) / 30) : 0);
  const baseSample = terrain.sampleBase.bind(terrain);
  terrain.sampleBase = (x, z) => baseSample(x, z) + dip(z);
  terrain.sample = (x, z) => baseSample(x, z) + dip(z);
  route.assignRoadY(terrain, 14);
  const car = new Car({ add() {}, remove() {} }, terrain);
  car.setRoute(route);
  car.reset({ x: 0, z: -60, yaw: 0 });
  const input = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  let worstDrop = 0;
  for (let i = 0; i < 60 * 8; i++) {
    car.update(1 / 60, input);
    const q = route.nearest(car.pos.x, car.pos.z);
    worstDrop = Math.max(worstDrop, q.roadY - car.pos.y);
  }
  assert.ok(worstDrop < 0.5, `car dropped ${worstDrop.toFixed(2)} m below the carriageway`);
});

test('the corridor mesh leaves the carriageway to the ribbon (no second surface under the road)', async () => {
  const { buildCorridorGeometry, RIBBON_SHOULDER } = await import('../src/corridor.js');
  const half = 3.2;
  const samples = Array.from({ length: 12 }, (_, i) => ({ x: 0, z: i * 5, roadY: 100 }));
  const geometry = buildCorridorGeometry([{ half, samples }], { sampleBase: () => 95 });
  const pos = geometry.attributes.position;
  let inside = 0;
  for (let i = 0; i < pos.count; i++) if (Math.abs(pos.getX(i)) < half + RIBBON_SHOULDER - 1e-6) inside++;
  assert.equal(inside, 0, 'no corridor vertex inside the ribbon');
  // No triangle spans from the left strip to the right strip.
  const idx = geometry.index.array;
  for (let t = 0; t < idx.length; t += 3) {
    const xs = [pos.getX(idx[t]), pos.getX(idx[t + 1]), pos.getX(idx[t + 2])];
    assert.ok(Math.max(...xs) < 0 || Math.min(...xs) > 0, `triangle crosses the road: ${xs}`);
  }
});

test('carveProfile marks the road band and the slopes so meshes can colour them', async () => {
  const { carveProfile, SHOULDER } = await import('../src/corridor.js');
  const n = 81; const cell = 1;
  const base = new Float32Array(n * n).fill(100);
  const heights = base.slice();
  const roadMask = new Uint8Array(n * n);
  const line = { half: 3, cut: 8, surface: 'asphalt', samples: [{ x: 0, z: 40, roadY: 104 }, { x: 80, z: 40, roadY: 104 }] };
  carveProfile({ heights, base, x0: 0, z0: 0, cell, n, roadMask }, [line]);
  const at = (x, z) => roadMask[z * n + x];
  assert.equal(at(40, 40), 3, 'asphalt on the centre line');
  assert.equal(at(40, 40 + 3 + Math.floor(SHOULDER)), 3, 'asphalt out to the shoulder');
  assert.equal(at(40, 40 + 6), 4, 'terrace beside it');
  assert.equal(at(40, 40 + 8), 1, 'feather at the cut-through edge');
  assert.equal(at(40, 5), 0, 'untouched ground far away');
});
