import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTerrainModel } from '../src/terrain.js';
import { makeRoute } from '../src/stage.js';
import { Car } from '../src/car.js';

/** Flat ground with a rounded crest (radius ~40 m) across z = 0 and a table-top jump at z = 300. */
function crestTerrain() {
  const size = 1200, grid = 1201;
  const heights = new Float32Array(grid * grid);
  for (let j = 0; j < grid; j++) {
    const z = -size / 2 + (j / (grid - 1)) * size;
    const crest = Math.abs(z) < 20 ? 5 - (z * z) / 80 : 0;                 // parabola: curvature 1/40 at the top
    const ramp = z > 260 && z <= 300 ? (z - 260) * 0.15 : 0;               // 15 % ramp up to a 6 m drop
    for (let i = 0; i < grid; i++) heights[j * grid + i] = 100 + crest + ramp;
  }
  const projection = { worldFromLatLon: () => ({ x: 0, z: 0 }), latLonFromWorld: () => ({ lat: 59, lon: 6 }) };
  return createTerrainModel({ heights, grid, sizeX: size, sizeZ: size, projection, scene: { name: 'test', title: 'test', lat: 59, lon: 6 }, basemapUrl: null, meta: { originX: 0, originY: 0 } });
}

/** Hold `kmh` along the road from z0; report the longest flight and the highest clearance. */
function fly(kmh, z0, metres) {
  const terrain = crestTerrain();
  // A road straight over the crest and the jump: off the road the car is held to 50 km/h.
  const route = makeRoute([{ x: 0, z: -500 }, { x: 0, z: 500 }], terrain, { roadWidth: 3.4, surface: 'gravel' });
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2, blend: 7, lift: 0.12 });
  route.snapToTerrain();
  const car = new Car({ add() {}, remove() {} }, terrain);
  car.setRoute(route);
  car.reset({ x: 0, z: z0, yaw: 0 });
  car.vF = kmh / 3.6;
  let flight = 0, longest = 0, clearance = 0, takeoffs = 0, wasGrounded = true;
  while (car.pos.z < z0 + metres) {
    const cruise = { throttle: car.speed * 3.6 < kmh ? 1 : 0, brake: 0, steer: 0, handbrake: false, jump: false };
    car.update(1 / 60, cruise);
    if (!car.grounded) { flight += 1 / 60; clearance = Math.max(clearance, car.pos.y - terrain.sample(car.pos.x, car.pos.z)); } else flight = 0;
    longest = Math.max(longest, flight);
    if (wasGrounded && !car.grounded) takeoffs++;
    wasGrounded = car.grounded;
    if (car.speed < 1) break;
  }
  return { longest, clearance, takeoffs, car };
}

test('a crest holds the car at 20 km/h and launches it at 100 km/h', () => {
  const slow = fly(20, -60, 120);
  assert.ok(slow.longest < 0.05, `slow car stays on the ground: ${slow.longest.toFixed(2)} s airborne`);
  const fast = fly(100, -60, 120);
  assert.ok(fast.longest > 0.4, `fast car flies off the crest: ${fast.longest.toFixed(2)} s`);
  assert.ok(fast.clearance > 0.5, `and clears the ground: ${fast.clearance.toFixed(2)} m`);
});

test('a table-top jump sends the car further the faster it goes', () => {
  const a = fly(60, 200, 200);
  const b = fly(120, 200, 200);
  assert.ok(a.longest > 0.5, `60 km/h: ${a.longest.toFixed(2)} s in the air`);
  assert.ok(b.longest > a.longest, `120 km/h flies longer: ${b.longest.toFixed(2)} s vs ${a.longest.toFixed(2)} s`);
});

test('the car leaves the ground once per jump and stays down after landing', () => {
  // The ramp must hold the car until its lip (no hop on the way up) and the
  // landing must spend the lift (no trampoline off the flat ground beyond).
  for (const kmh of [60, 120]) {
    const run = fly(kmh, 200, 200);
    assert.equal(run.takeoffs, 1, `${kmh} km/h over the table-top: ${run.takeoffs} take-offs`);
  }
  const crest = fly(100, -60, 120);
  assert.equal(crest.takeoffs, 1, `crest at 100 km/h: ${crest.takeoffs} take-offs`);
});
