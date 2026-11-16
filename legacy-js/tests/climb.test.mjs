import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Car } from '../src/car.js';
import { makeRoute } from '../src/stage.js';
import { slopedTerrain } from './road-physics.test.mjs';

const DEG = Math.PI / 180;

/** Full throttle straight up a uniform gravel slope of `degrees`; metres gained in `seconds`. */
function climb(kind, degrees, seconds = 8) {
  const terrain = slopedTerrain({ size: 1200, grid: 601, grade: Math.tan(degrees * DEG) });
  const route = makeRoute([{ x: 0, z: -500 }, { x: 0, z: 500 }], terrain, { roadWidth: 3.4, surface: 'gravel' });
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2, blend: 7, lift: 0.12 });
  route.snapToTerrain();
  const car = new Car({ add() {}, remove() {} }, terrain, kind);
  car.setRoute(route);
  const z0 = car.pos.z;
  const drive = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  for (let i = 0; i < 60 * seconds; i++) car.update(1 / 60, drive);
  return car.pos.z - z0;
}

test('the Porsche climbs 25° but cannot climb 35°', () => {
  const ok = climb('porsche', 25);
  const no = climb('porsche', 35);
  assert.ok(ok > 15, `25°: gained ${ok.toFixed(1)} m`);
  assert.ok(no < 3, `35°: gained ${no.toFixed(1)} m (should slide back)`);
});

test('the Formula Offroad buggy climbs 70° but cannot climb 85°', () => {
  const ok = climb('buggy', 70);
  const no = climb('buggy', 85);
  assert.ok(ok > 15, `70°: gained ${ok.toFixed(1)} m`);
  assert.ok(no < 3, `85°: gained ${no.toFixed(1)} m (should slide back)`);
});

test('both cars still accelerate normally on the flat and on a 10° hill', () => {
  for (const kind of ['porsche', 'buggy']) {
    assert.ok(climb(kind, 0, 4) > 25, `${kind} flat`);
    assert.ok(climb(kind, 10, 4) > 12, `${kind} 10°`);
  }
});
