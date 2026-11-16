import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { triSample } from '../src/geo.js';
import { createTerrainModel } from '../src/terrain.js';
import { makeRoute } from '../src/stage.js';
import { Car } from '../src/car.js';

/** Rough mountain terrain (random-ish bumps of a few metres per cell). */
function roughTerrain({ size = 800, grid = 81 } = {}) {
  const heights = new Float32Array(grid * grid);
  for (let j = 0; j < grid; j++) for (let i = 0; i < grid; i++) {
    heights[j * grid + i] = 200 + 4 * Math.sin(i * 1.7) * Math.cos(j * 2.3) + 3 * Math.sin((i + j) * 0.9) + 0.3 * i;
  }
  const projection = { worldFromLatLon: () => ({ x: 0, z: 0 }), latLonFromWorld: () => ({ lat: 59, lon: 6 }) };
  const terrain = createTerrainModel({ heights, grid, sizeX: size, sizeZ: size, projection, scene: { name: 't', title: 't', lat: 59, lon: 6 }, basemapUrl: null, meta: { originX: 0, originY: 0 } });
  return { terrain, heights, grid, size };
}

test('sample() returns the height of the drawn triangles, not a bilinear blend', () => {
  const { terrain, heights, grid, size } = roughTerrain();
  const cell = size / (grid - 1);
  let worst = 0;
  for (let n = 0; n < 500; n++) {
    const i = 5 + (n * 7) % (grid - 12); const j = 5 + (n * 11) % (grid - 12);
    const fx = ((n * 13) % 10) / 10 + 0.05; const fz = ((n * 17) % 10) / 10 + 0.05;
    const x = -size / 2 + (i + fx) * cell; const z = -size / 2 + (j + fz) * cell;
    const a = heights[j * grid + i]; const b = heights[j * grid + i + 1]; const c = heights[(j + 1) * grid + i]; const d = heights[(j + 1) * grid + i + 1];
    // The mesh draws triangles (a, c, b) and (b, c, d): plane through a,b,c when fx+fz<=1, else through b,c,d.
    const expected = fx + fz <= 1 ? a + (b - a) * fx + (c - a) * fz : d + (c - d) * (1 - fx) + (b - d) * (1 - fz);
    worst = Math.max(worst, Math.abs(terrain.sample(x, z) - expected));
    assert.ok(Math.abs(triSample(a, b, c, d, fx, fz) - expected) < 1e-9);
  }
  assert.ok(worst < 1e-4, `worst mismatch ${worst}`);
});

test('wheels never render below the ground, on or off the road', () => {
  const { terrain, size } = roughTerrain();
  const route = makeRoute([{ x: -300, z: -300 }, { x: 300, z: 300 }], terrain, { roadWidth: 3.2 });
  route.assignRoadY(terrain, 7);
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2 });
  route.snapToTerrain();
  let worst = -Infinity;
  for (const kind of ['porsche', 'buggy']) {
    const car = new Car({ add() {}, remove() {} }, terrain, kind);
    car.setRoute(route);
    const v = new THREE.Vector3();
    for (let i = 0; i < 60 * 25; i++) {
      // Weave on and off the road so the wheels meet raw slopes too.
      const steer = Math.sin(i / 90) * 0.8;
      car.update(1 / 60, { throttle: 0.9, brake: 0, steer, handbrake: false, jump: false });
      if (!terrain.inside(car.pos.x, car.pos.z, 20)) break;
      for (const w of car.wheels) {
        v.copy(w.pivot.position);
        car.group.localToWorld(v);
        const bottom = v.y - car.spec.wheelRadius;
        const ground = car.groundAt(v.x, v.z);
        worst = Math.max(worst, ground - bottom);
      }
    }
  }
  assert.ok(worst < 0.12, `a wheel sank ${worst.toFixed(3)} m below the ground`);
});
