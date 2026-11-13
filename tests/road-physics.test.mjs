import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTerrainModel } from '../src/terrain.js';
import { makeRoute } from '../src/stage.js';
import { Car } from '../src/car.js';

/** A 10 % grade along +z with lateral undulation and small bumps. */
export function slopedTerrain({ size = 1200, grid = 601 } = {}) {
  const heights = new Float32Array(grid * grid);
  for (let j = 0; j < grid; j++) {
    const z = -size / 2 + (j / (grid - 1)) * size;
    for (let i = 0; i < grid; i++) {
      const x = -size / 2 + (i / (grid - 1)) * size;
      heights[j * grid + i] = 100 + 0.10 * (z + size / 2) + 3 * Math.sin(x / 40) + 0.8 * Math.sin(z / 15);
    }
  }
  const projection = {
    worldFromLatLon: () => ({ x: 0, z: 0 }),
    latLonFromWorld: () => ({ lat: 59, lon: 6 }),
  };
  return createTerrainModel({
    heights, grid, sizeX: size, sizeZ: size, projection,
    scene: { name: 'test', title: 'test', lat: 59, lon: 6 },
    basemapUrl: null, meta: { originX: 0, originY: 0 },
  });
}

/** Max |ground − ribbon centre line| along the route after carving. */
export function carveError(terrain, route, lift) {
  let worst = 0;
  const s = route.samples;
  for (let k = 0; k + 1 < s.length; k++) {
    for (let t = 0; t < 1; t += 0.1) {
      const x = s[k].x + (s[k + 1].x - s[k].x) * t;
      const z = s[k].z + (s[k + 1].z - s[k].z) * t;
      const want = s[k].y + (s[k + 1].y - s[k].y) * t + lift;
      worst = Math.max(worst, Math.abs(terrain.sample(x, z) - want));
    }
  }
  return worst;
}

test('carved road is the ribbon surface, not a staircase', () => {
  const terrain = slopedTerrain();
  const route = makeRoute([{ x: -150, z: -400 }, { x: 150, z: 400 }], terrain, { roadWidth: 4.2 });
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2, blend: 7, lift: 0.12 });
  const err = carveError(terrain, route, 0.12);
  // The grade is 10 % and samples are 4 m apart: a nearest-sample carve
  // leaves ~0.4 m steps. The segment carve must stay within a few cm.
  assert.ok(err < 0.06, `centre-line error ${err.toFixed(3)} m`);
});

test('car rides on the road surface without sinking or sliding off', () => {
  const terrain = slopedTerrain();
  const route = makeRoute([{ x: -150, z: -400 }, { x: 150, z: 400 }], terrain, { roadWidth: 4.2 });
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2, blend: 7, lift: 0.12 });
  route.snapToTerrain();
  const car = new Car({ add() {}, remove() {} }, terrain);
  car.setRoute(route);
  const input = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  let worstSink = 0;
  let worstHover = 0;
  let maxSpeed = 0;
  let offRoad = 0;
  const frames = 60 * 25;
  let simulated = 0;
  for (let i = 0; i < frames; i++) {
    const state = car.update(1 / 60, input);
    simulated++;
    if (state.progress > 0.9) break; // stop before the car runs off the end
    const surface = car.groundAt(car.pos.x, car.pos.z);
    worstSink = Math.max(worstSink, surface - car.pos.y);
    if (car.grounded) worstHover = Math.max(worstHover, car.pos.y - surface);
    maxSpeed = Math.max(maxSpeed, state.speed);
    if (!state.onRoad) offRoad++;
    for (const w of car.wheels) {
      assert.ok(w.pivot.position.y > 0.1 && w.pivot.position.y < 0.6, 'wheel travel stays in range');
    }
  }
  const lateral = route.nearest(car.pos.x, car.pos.z).distance;
  assert.ok(worstSink <= 0.15, `body sank ${worstSink.toFixed(3)} m into the road`);
  assert.ok(worstHover <= 0.25, `body hovered ${worstHover.toFixed(3)} m above the road`);
  assert.ok(maxSpeed > 30, `car only reached ${(maxSpeed * 3.6).toFixed(0)} km/h uphill`);
  assert.ok(offRoad < simulated * 0.02, `off the road for ${offRoad} of ${simulated} frames`);
  assert.ok(lateral < route.roadWidth, `drifted ${lateral.toFixed(2)} m from the centre line`);
  assert.ok(car.roadLift > 0.15, 'car rides on the ribbon lift when on the road');
});
