import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRoute } from '../src/stage.js';
import { Car, OFFROAD_MAX_SPEED } from '../src/car.js';
import { slopedTerrain } from './road-physics.test.mjs';

function flatWorld(kind = 'porsche') {
  const terrain = slopedTerrain({ size: 3200, grid: 801, grade: 0 });
  const route = makeRoute([{ x: 0, z: -1500 }, { x: 0, z: 1500 }], terrain, { roadWidth: 3.4, surface: 'gravel' });
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2, blend: 7, lift: 0.12 });
  route.snapToTerrain();
  const car = new Car({ add() {}, remove() {} }, terrain, kind);
  car.setRoute(route);
  return { car };
}

const flatOut = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };

test('off the road a car tops out at 50 km/h, on the road it goes faster', () => {
  for (const kind of ['porsche', 'buggy']) {
    const { car } = flatWorld(kind);
    car.reset({ x: 80, z: -1400, yaw: 0 }); // 80 m beside the road: open ground
    let top = 0;
    for (let i = 0; i < 60 * 30; i++) { car.update(1 / 60, flatOut); top = Math.max(top, car.speed); }
    assert.ok(!car.onRoad, `${kind}: off the road`);
    assert.ok(top * 3.6 <= 51 && top * 3.6 > 45, `${kind}: off-road top speed ${(top * 3.6).toFixed(1)} km/h`);
  }
  const { car } = flatWorld();
  car.reset({ x: 0, z: -1400, yaw: 0 });
  for (let i = 0; i < 60 * 20; i++) car.update(1 / 60, flatOut);
  assert.ok(car.onRoad && car.speed * 3.6 > 80, `on the road: ${(car.speed * 3.6).toFixed(0)} km/h`);
});

test('arriving fast on open ground the car is slowed to 50 km/h', () => {
  const { car } = flatWorld('buggy');
  car.reset({ x: 80, z: -1400, yaw: 0 });
  car.vF = 40; // 144 km/h along +z
  for (let i = 0; i < 60 * 6; i++) car.update(1 / 60, flatOut);
  assert.ok(Math.abs(car.speed - OFFROAD_MAX_SPEED) < 0.5, `settles at the limit: ${(car.speed * 3.6).toFixed(1)} km/h`);
});
