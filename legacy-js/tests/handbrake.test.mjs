import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRoute } from '../src/stage.js';
import { Car } from '../src/car.js';
import { slopedTerrain } from './road-physics.test.mjs';

function carOn(surface) {
  const terrain = slopedTerrain({ size: 3200, grid: 801, grade: 0 });
  const route = makeRoute([{ x: 0, z: -1500 }, { x: 0, z: 1500 }], terrain, { roadWidth: 3.4, surface });
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2, blend: 7, lift: 0.12 });
  route.snapToTerrain();
  const car = new Car({ add() {}, remove() {} }, terrain);
  car.setRoute(route);
  const drive = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  for (let i = 0; i < 60 * 40 && car.speed * 3.6 < 70; i++) car.update(1 / 60, drive);
  return car;
}

function slide(car, handbrake, seconds = 1.2, steer = 1) {
  const rearSpin0 = car.rearSpin;
  let yawPeak = 0; let slidePeak = 0; let smoke = 0;
  const turn = { throttle: 0.5, brake: 0, steer, handbrake, jump: false };
  for (let i = 0; i < 60 * seconds; i++) {
    car.update(1 / 60, turn);
    if (!car.onRoad) break; // only judge what happens on the asphalt itself
    yawPeak = Math.max(yawPeak, Math.abs(car.yawVel));
    slidePeak = Math.max(slidePeak, Math.abs(car.vR));
    smoke += car.dust.particles.filter((p) => p.life > 0).length;
  }
  return { yawPeak, slidePeak, smoke, rearTurned: Math.abs(car.rearSpin - rearSpin0), frontTurned: Math.abs(car.wheelSpin) };
}

test('handbrake locks the rear wheels and throws the car into a slide', () => {
  const plain = slide(carOn('asphalt'), false, 1.2, 0.35); // a normal corner
  const hb = slide(carOn('asphalt'), true);
  assert.ok(hb.slidePeak > plain.slidePeak * 2, `slide ${hb.slidePeak.toFixed(2)} vs ${plain.slidePeak.toFixed(2)} m/s`);
  assert.ok(hb.yawPeak > plain.yawPeak * 1.5, `yaw ${hb.yawPeak.toFixed(2)} vs ${plain.yawPeak.toFixed(2)} rad/s`);
  assert.equal(hb.rearTurned, 0, 'rear wheels stand still on the handbrake');
  assert.ok(hb.frontTurned > 0, 'front wheels keep rolling');
  assert.ok(hb.smoke > 0 && plain.smoke === 0, 'tyre smoke only while sliding on asphalt');
});

test('the slide carries on for a moment after the handbrake is released', () => {
  const car = carOn('gravel');
  slide(car, true, 0.6);
  const during = Math.abs(car.vR);
  const coast = { throttle: 0.5, brake: 0, steer: 0, handbrake: false, jump: false };
  car.update(1 / 60, coast);
  assert.ok(car.slideGrip < 0.1, 'grip starts recovering from zero');
  for (let i = 0; i < 18; i++) car.update(1 / 60, coast); // 0.3 s later
  assert.ok(Math.abs(car.vR) > during * 0.35, `still sliding (${Math.abs(car.vR).toFixed(2)} of ${during.toFixed(2)} m/s)`);
  for (let i = 0; i < 90; i++) car.update(1 / 60, coast);
  assert.equal(car.slideGrip, 1, 'grip fully back after ~0.7 s');
});
