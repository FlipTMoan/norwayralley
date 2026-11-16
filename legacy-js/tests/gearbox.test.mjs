import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRoute } from '../src/stage.js';
import { Car, ENGINE } from '../src/car.js';
import { slopedTerrain } from './road-physics.test.mjs';

function flatRoad() {
  const terrain = slopedTerrain({ size: 3200, grid: 801, grade: 0 });
  const route = makeRoute([{ x: 0, z: -1500 }, { x: 0, z: 1500 }], terrain, { roadWidth: 3.2 });
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2, blend: 7, lift: 0.12 });
  route.snapToTerrain();
  const car = new Car({ add() {}, remove() {} }, terrain);
  car.setRoute(route);
  return { terrain, route, car };
}

test('automatic box runs the 911 gear spans up to a 12 000 rpm redline', () => {
  const { car } = flatRoad();
  const input = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  const seen = new Map(); // gear → [min km/h, max km/h]
  let maxRpm = 0;
  let top = 0;
  for (let i = 0; i < 60 * 45; i++) {
    const st = car.update(1 / 60, input);
    if (st.progress > 0.9) break;
    const kmh = st.speed * 3.6;
    top = Math.max(top, kmh);
    maxRpm = Math.max(maxRpm, car.rpm);
    const g = car.gear;
    const r = seen.get(g) || [Infinity, -Infinity];
    seen.set(g, [Math.min(r[0], kmh), Math.max(r[1], kmh)]);
  }
  assert.equal(ENGINE.redline, 12000);
  assert.ok(maxRpm <= 12000 + 1, `rpm ran to ${maxRpm.toFixed(0)}`);
  assert.ok(seen.get(1)[1] < 64, `1st held to ${seen.get(1)[1].toFixed(0)} km/h`);
  assert.ok(seen.get(2)[0] < 62 && seen.get(2)[1] < 104, `2nd spanned ${seen.get(2).map((v) => v.toFixed(0))} km/h`);
  assert.ok(seen.get(3)[1] < 144, `3rd spanned ${seen.get(3).map((v) => v.toFixed(0))} km/h`);
  assert.ok(seen.has(4), 'reaches 4th on the flat');
  assert.ok(top > 150 && top < 230, `top speed ${top.toFixed(0)} km/h`);
});

test('manual box holds the gear and hits the rev limiter', () => {
  const { car } = flatRoad();
  car.autoShift = false;
  const input = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  let top = 0;
  let limited = false;
  for (let i = 0; i < 60 * 12; i++) {
    const st = car.update(1 / 60, input);
    top = Math.max(top, st.speed * 3.6);
    if (car.limiter) limited = true;
  }
  assert.equal(car.gear, 1, 'stays in first without shifting');
  assert.ok(limited, 'limiter engages on the redline');
  assert.ok(top > 50 && top < 66, `first gear tops out at ${top.toFixed(0)} km/h`);
});

test('launch is traction limited, not torque limited', () => {
  const { car } = flatRoad();
  const input = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  let prev = 0;
  let maxAccel = 0;
  for (let i = 0; i < 60 * 3; i++) {
    const st = car.update(1 / 60, input);
    maxAccel = Math.max(maxAccel, (st.vF - prev) * 60);
    prev = st.vF;
  }
  assert.ok(maxAccel < 7.5, `peak acceleration ${maxAccel.toFixed(1)} m/s² (tyre limit ≈ 6.2)`);
  assert.ok(maxAccel > 3, `car does accelerate (${maxAccel.toFixed(1)} m/s²)`);
});
