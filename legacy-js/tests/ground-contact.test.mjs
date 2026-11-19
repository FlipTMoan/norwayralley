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

test('across the road the surface is one straight line, and the terrain never pokes through it', async () => {
  const { RoadNetwork } = await import('../src/roads.js');
  const { ROAD_LIFT } = await import('../src/corridor.js');
  // A hillside cutting: the ground rises 30 % to the left of a road along +z, on a coarse 10 m grid.
  const size = 800; const grid = 81;
  const heights = new Float32Array(grid * grid);
  for (let j = 0; j < grid; j++) for (let i = 0; i < grid; i++) {
    const x = -size / 2 + (i / (grid - 1)) * size; const z = -size / 2 + (j / (grid - 1)) * size;
    heights[j * grid + i] = 100 - 0.3 * x + 1.5 * Math.sin(z / 9) * Math.cos(x / 7);
  }
  const projection = { worldFromLatLon: () => ({ x: 0, z: 0 }), latLonFromWorld: () => ({ lat: 59, lon: 6 }) };
  const terrain = createTerrainModel({ heights, grid, sizeX: size, sizeZ: size, projection, scene: { name: 't', title: 't', lat: 59, lon: 6 }, basemapUrl: null, meta: { originX: 0, originY: 0 } });
  // A single-lane road (narrower than a grid cell) with a 4 % crossfall, graded along z.
  const half = 2.25;
  const samples = [];
  for (let z = -300; z <= 300; z += 5) samples.push({ x: 3, z, roadY: 100 + 0.02 * z, bank: 0.04 });
  terrain.carveRoad(samples, { halfWidth: half + 1.2, lift: ROAD_LIFT });
  const flat = half + 1.5;
  let poke = 0;
  for (let z = -250; z <= 250; z += 0.7) {
    for (let o = -flat; o <= flat; o += 0.25) {
      // x = 3 - o: the left normal of a road along +z is -x.
      const road = 100 + 0.02 * z + ROAD_LIFT + 0.04 * o;
      poke = Math.max(poke, terrain.sample(3 - o, z) - road);
    }
  }
  assert.ok(poke < 1e-3, `terrain rises ${poke.toFixed(3)} m through the road surface`);

  // The car's ground across the carriageway is the straight line between the edges.
  const net = new RoadNetwork({ spawn: { x: 3, z: 0, yaw: 0 } });
  net.setChunk('c', [{ id: 1, half, cut: 3.75, samples }]);
  const car = new Car({ add() {}, remove() {} }, terrain);
  car.setRoute(net);
  let worst = 0;
  for (let z = -200; z <= 200; z += 3.3) {
    const left = car.groundAt(3 + half, z); // o = -half
    const right = car.groundAt(3 - half, z); // o = +half
    for (let o = -half; o <= half; o += 0.25) {
      const want = left + (right - left) * ((o + half) / (2 * half));
      worst = Math.max(worst, Math.abs(car.groundAt(3 - o, z) - want));
    }
  }
  assert.ok(worst < 0.02, `ground across the road deviates ${worst.toFixed(3)} m from a straight line`);
});
