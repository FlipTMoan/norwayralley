import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRoute } from '../src/stage.js';
import { Car } from '../src/car.js';
import { slopedTerrain } from './road-physics.test.mjs';
import { surfaceKindFromMassetype, assignSurfaces } from '../src/roads.js';

function flatRoad(surface) {
  const terrain = slopedTerrain({ size: 3200, grid: 801, grade: 0 });
  const route = makeRoute([{ x: 0, z: -1500 }, { x: 0, z: 1500 }], terrain, { roadWidth: 3.4, surface });
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2, blend: 7, lift: 0.12 });
  route.snapToTerrain();
  const car = new Car({ add() {}, remove() {} }, terrain);
  car.setRoute(route);
  return { terrain, route, car };
}

/** Accelerate to `kmh`, then hold full steer for `seconds`; report the peak yaw rate and slide. */
function corner(surface, kmh, seconds, mode = 'loose') {
  const { car } = flatRoad(surface);
  car.slideMode = mode;
  const drive = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  for (let i = 0; i < 60 * 40 && car.speed * 3.6 < kmh; i++) car.update(1 / 60, drive);
  const surfaceKind = car.surfaceKind; // read on the straight, before the car leaves the road
  let yawPeak = 0;
  let slidePeak = 0;
  let dust = 0;
  const turn = { throttle: 0.6, brake: 0, steer: 1, handbrake: false, jump: false };
  for (let i = 0; i < 60 * seconds; i++) {
    car.update(1 / 60, turn);
    yawPeak = Math.max(yawPeak, Math.abs(car.yawVel));
    slidePeak = Math.max(slidePeak, Math.abs(car.vR));
    dust += car.dust.particles.filter((p) => p.life > 0).length;
  }
  return { yawPeak, slidePeak, dust, surfaceKind };
}

test('steering is speed-sensitive: no twitching at 140 km/h', () => {
  const fast = corner('asphalt', 140, 0.6);
  const slow = corner('asphalt', 40, 0.6);
  assert.equal(fast.surfaceKind, 'asphalt');
  assert.ok(fast.yawPeak < 0.42, `yaw rate at speed ${fast.yawPeak.toFixed(2)} rad/s`);
  assert.ok(slow.yawPeak > fast.yawPeak * 1.6, `slow ${slow.yawPeak.toFixed(2)} vs fast ${fast.yawPeak.toFixed(2)}`);
});

test('normal grip tracks the steering; loose mode slides', () => {
  const normal = corner('gravel', 70, 0.6, 'normal');
  const loose = corner('gravel', 70, 0.6, 'loose');
  assert.ok(normal.slidePeak < 1.6, `normal mode slide ${normal.slidePeak.toFixed(2)} m/s`);
  assert.ok(loose.slidePeak > normal.slidePeak * 1.5, `loose ${loose.slidePeak.toFixed(2)} vs normal ${normal.slidePeak.toFixed(2)} m/s`);
});

test('gravel slides more than asphalt and only gravel dusts', () => {
  const tarmac = corner('asphalt', 70, 0.6);
  const gravel = corner('gravel', 70, 0.6);
  assert.equal(gravel.surfaceKind, 'gravel');
  assert.ok(gravel.slidePeak > tarmac.slidePeak * 1.25, `slide gravel ${gravel.slidePeak.toFixed(2)} vs asphalt ${tarmac.slidePeak.toFixed(2)} m/s`);
  assert.equal(tarmac.dust, 0, 'asphalt throws no dust');
  assert.ok(gravel.dust > 0, 'gravel throws dust');
});

test('NVDB Massetype maps to surface kinds and assigns to samples', () => {
  assert.equal(surfaceKindFromMassetype('Grus'), 'gravel');
  assert.equal(surfaceKindFromMassetype('Enkel overflatebehandling grus'), 'gravel');
  assert.equal(surfaceKindFromMassetype('Asfaltbetong'), 'asphalt');
  assert.equal(surfaceKindFromMassetype('Emulsjonsgrus, tett'), 'asphalt');
  assert.equal(surfaceKindFromMassetype('Belegningsstein'), 'asphalt');
  assert.equal(surfaceKindFromMassetype(undefined), null);
  const project = (lat, lon) => ({ x: lon, z: lat });
  const samples = [];
  for (let z = 0; z <= 300; z += 5) samples.push({ x: 0, z, surface: 'asphalt' });
  const n = assignSurfaces(samples, [{ kind: 'gravel', points: [{ lat: 100, lon: 4 }, { lat: 200, lon: 4 }] }], project, { maxDist: 12 });
  assert.equal(n, 25, `measured ${n} (21 beside the line + 4 within 12 m of its ends)`);
  assert.equal(samples[17].surface, 'asphalt');
  assert.equal(samples[30].surface, 'gravel');
  assert.equal(samples[0].surface, 'asphalt');
});

test('sliding levels 0–3 slide progressively more in the same corner', async () => {
  const { SLIDE_LEVELS } = await import('../src/car.js');
  assert.deepEqual(SLIDE_LEVELS, ['minimal', 'normal', 'medium', 'loose']);
  const slides = SLIDE_LEVELS.map((mode) => corner('gravel', 80, 1.2, mode).slidePeak);
  for (let i = 1; i < slides.length; i++) assert.ok(slides[i] >= slides[i - 1] * 0.98, `level ${i} (${slides[i].toFixed(2)}) slides at least as much as level ${i - 1} (${slides[i - 1].toFixed(2)})`);
  assert.ok(slides[3] > slides[0] * 1.5, `loose (${slides[3].toFixed(2)}) well beyond minimal (${slides[0].toFixed(2)})`);
});
