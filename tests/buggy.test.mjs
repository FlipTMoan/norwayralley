import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRoute } from '../src/stage.js';
import { Car, CARS } from '../src/car.js';
import { slopedTerrain } from './road-physics.test.mjs';

function onRoad(kind, { grade = 0, surface = 'gravel' } = {}) {
  const terrain = slopedTerrain({ size: 2400, grid: 601, grade });
  const route = makeRoute([{ x: 0, z: -1100 }, { x: 0, z: 1100 }], terrain, { roadWidth: 3.4, surface });
  route.assignRoadY(terrain, 7);
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2 });
  route.snapToTerrain();
  const car = new Car({ add() {}, remove() {} }, terrain, kind);
  car.setRoute(route);
  return car;
}

function zeroToHundred(car) {
  const input = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  for (let i = 0; i < 60 * 30; i++) {
    const st = car.update(1 / 60, input);
    if (st.speed * 3.6 >= 100) return i / 60;
  }
  return Infinity;
}

test('the buggy is a different machine: big wheels, 4WD launch, 1 200 hp', () => {
  const buggy = onRoad('buggy');
  const porsche = onRoad('porsche');
  assert.equal(buggy.kind, 'buggy');
  assert.equal(buggy.wheels[0].pivot.position.y, CARS.buggy.wheelRadius);
  assert.ok(CARS.buggy.wheelRadius > 0.6 && CARS.buggy.power >= 890000);
  const tb = zeroToHundred(buggy);
  const tp = zeroToHundred(porsche);
  assert.ok(tb < 6, `buggy 0-100 on gravel in ${tb.toFixed(1)} s`);
  assert.ok(tb < tp, `buggy ${tb.toFixed(1)} s vs porsche ${tp.toFixed(1)} s`);
});

test('gravity bites on a 25 % climb: the 911 slows, the buggy powers on', () => {
  const input = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  const climb = (kind) => {
    const car = onRoad(kind, { grade: 0.25, surface: 'gravel' });
    let top = 0;
    for (let i = 0; i < 60 * 20; i++) { const st = car.update(1 / 60, input); top = Math.max(top, st.speed * 3.6); if (st.progress > 0.9) break; }
    return top;
  };
  const flat911 = (() => { const car = onRoad('porsche'); let top = 0; for (let i = 0; i < 60 * 20; i++) { const st = car.update(1 / 60, input); top = Math.max(top, st.speed * 3.6); if (st.progress > 0.9) break; } return top; })();
  const hill911 = climb('porsche');
  const hillBuggy = climb('buggy');
  assert.ok(hill911 < flat911 * 0.8, `911 top ${hill911.toFixed(0)} km/h uphill vs ${flat911.toFixed(0)} flat`);
  assert.ok(hillBuggy > hill911 * 1.2, `buggy ${hillBuggy.toFixed(0)} km/h vs 911 ${hill911.toFixed(0)} km/h on the climb`);
});
