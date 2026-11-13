import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { profileHeight, carveProfile, corridorReach, buildCorridorGeometry, SHOULDER, CARVE_MARGIN } from '../src/corridor.js';
import { makeRoute } from '../src/stage.js';
import { Car } from '../src/car.js';
import { slopedTerrain } from './road-physics.test.mjs';

test('profile: flat carriageway, 1:1.5 embankment, 1:1 cutting', () => {
  const half = 3.2;
  assert.equal(profileHeight(100, 90, 0, half), 100);
  assert.equal(profileHeight(100, 90, half + SHOULDER, half), 100, 'shoulder is flat');
  assert.ok(Math.abs(profileHeight(100, 90, half + SHOULDER + 3, half) - 98) < 1e-9, 'fill drops 1 m per 1.5 m');
  assert.equal(profileHeight(100, 90, half + SHOULDER + 15, half), 90, 'fill meets the ground');
  assert.ok(Math.abs(profileHeight(100, 106, half + SHOULDER + 2, half) - 102) < 1e-9, 'cut rises 1 m per 1 m');
  assert.equal(profileHeight(100, 106, half + SHOULDER + 6, half), 106, 'cut meets the ground');
  assert.equal(profileHeight(100, 100.2, corridorReach(half) + 1, half), 100.2, 'nothing beyond the reach');
});

test('carveProfile keeps the carriageway exact and tucks the slopes under the margin', () => {
  const n = 81; const cell = 2;
  const base = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) base[j * n + i] = 50 + i * 1.6; // steep side slope: 0.8 m per m across x
  const heights = base.slice();
  const samples = [];
  for (let z = -10; z <= 170; z += 5) samples.push({ x: 80, z, roadY: 114 }); // ground height at the centre line
  carveProfile({ heights, base, x0: 0, z0: 0, cell, n }, [{ half: 3, samples }], { lift: 0 });
  const at = (x, z) => heights[(z / cell) * n + x / cell];
  assert.ok(Math.abs(at(80, 80) - 114) < 1e-6, 'centre line at road height');
  assert.ok(Math.abs(at(84, 80) - 114) < 1e-6, 'shoulder flat (4 m = half + shoulder)');
  // Low side, 4 m beyond the shoulder: embankment 114 - 4/1.5 = 111.33, minus the margin.
  assert.ok(Math.abs(at(72, 80) - (114 - 4 / 1.5 - CARVE_MARGIN)) < 1e-4, `embankment ${at(72, 80)}`);
  // High side, 6 m beyond the shoulder: cutting 114 + 6 = 120 (ground 122), minus the margin.
  assert.ok(Math.abs(at(90, 80) - (120 - CARVE_MARGIN)) < 1e-4, `cutting ${at(90, 80)}`);
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
