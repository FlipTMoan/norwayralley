import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Car } from '../src/car.js';
import { makeRoute } from '../src/stage.js';
import { pushOutOfBox, BuildingIndex } from '../src/buildings.js';
import { slopedTerrain } from './road-physics.test.mjs';

test('pushOutOfBox respects the box rotation and pushes out of the nearest wall', () => {
  // A 20 × 6 m house turned 90°: its long side now runs along z.
  const box = { x: 0, z: 0, yaw: Math.PI / 2, hl: 10, hw: 3 };
  assert.equal(pushOutOfBox(box, 0, 20, 1), null, 'clear beyond the gable');
  assert.equal(pushOutOfBox(box, 6, 0, 1), null, 'clear beside the long wall (turned)');
  const hit = pushOutOfBox(box, 3.5, 0, 1);
  assert.ok(hit, 'overlapping the long wall');
  assert.ok(Math.abs(hit.nx - 1) < 1e-9 && Math.abs(hit.nz) < 1e-9, `normal ${hit.nx},${hit.nz}`);
  assert.ok(Math.abs(hit.depth - 0.5) < 1e-9, `depth ${hit.depth}`);
});

test('the building index finds boxes near a point and forgets a chunk', () => {
  const idx = new BuildingIndex();
  idx.setChunk('a', [{ x: 100, z: 100, yaw: 0, hl: 5, hw: 4 }, { x: 900, z: 900, yaw: 0, hl: 5, hw: 4 }]);
  assert.equal(idx.near(110, 95, 40).length, 1);
  assert.equal(idx.near(500, 500, 40).length, 0);
  assert.equal(idx.count, 2);
  idx.removeChunk('a');
  assert.equal(idx.near(110, 95, 40).length, 0);
});

test('the car cannot drive through a house: it stops at the wall, with a crash impulse', () => {
  const terrain = slopedTerrain({ size: 2400, grid: 601, grade: 0 });
  const route = makeRoute([{ x: 0, z: -1100 }, { x: 0, z: 1100 }], terrain, { roadWidth: 3.4, surface: 'asphalt' });
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2 });
  route.snapToTerrain();
  terrain.buildings = new BuildingIndex();
  terrain.buildings.setChunk('t', [{ x: 0, z: -900, yaw: 0, hl: 6, hw: 4 }]); // across the road, 200 m ahead
  const car = new Car({ add() {}, remove() {} }, terrain);
  car.setRoute(route);
  const drive = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  let crash = 0;
  let peak = 0;
  for (let i = 0; i < 60 * 15; i++) {
    const s = car.update(1 / 60, drive);
    peak = Math.max(peak, car.speed);
    crash = Math.max(crash, s.crash);
  }
  assert.ok(peak > 15, `reached ${peak.toFixed(1)} m/s before the wall`);
  assert.ok(crash > 5, `crash impulse ${crash.toFixed(1)} m/s`);
  assert.ok(car.pos.z < -904 - 1, `stopped on the near side of the wall (z = ${car.pos.z.toFixed(1)})`);
  assert.ok(car.speed < 3, `held against the wall at ${car.speed.toFixed(1)} m/s`);
});
