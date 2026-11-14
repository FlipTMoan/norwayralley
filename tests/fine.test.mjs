import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createFineTiles, FINE_BAND, TILE_CELLS } from '../src/fine.js';

const CELL = 2048 / 192;
const field = (x, z) => 50 + 3 * Math.sin(x / 23) + 2 * Math.cos(z / 17);
// World ↔ lat/lon: a flat local projection so the fake DEM can be sampled by world position.
const latLonFromWorld = (x, z) => ({ lat: 59 - z / 111000, lon: 6 + x / 55000 });
const worldFromLatLon = (lat, lon) => ({ x: (lon - 6) * 55000, z: (59 - lat) * 111000 });
let fetches = 0;
async function fetchDem({ bbox, grid }) {
  fetches++;
  const heights = new Float32Array(grid * grid);
  const nw = worldFromLatLon(bbox.maxLat, bbox.minLon);
  const se = worldFromLatLon(bbox.minLat, bbox.maxLon);
  for (let j = 0; j < grid; j++) {
    for (let i = 0; i < grid; i++) {
      const x = nw.x + (se.x - nw.x) * (i / (grid - 1));
      const z = nw.z + (se.z - nw.z) * (j / (grid - 1));
      heights[j * grid + i] = field(x, z);
    }
  }
  return { heights, grid };
}
const flush = () => new Promise((r) => setTimeout(r, 5));

function make(opts = {}) {
  let clock = 0;
  const changes = [];
  const fine = createFineTiles({
    cell: CELL, fetchDem, latLonFromWorld,
    group: { add() {}, remove() {} }, material: new THREE.MeshLambertMaterial({ vertexColors: true }),
    linesFor: () => [], onTileChange: (t) => changes.push(t.key), now: () => (clock += 1000), ...opts,
  });
  return { fine, changes };
}

test('tiles are one metre, aligned to the coarse grid, and only along the road band', async () => {
  const { fine } = make();
  assert.ok(Math.abs(fine.STEP - 1) < 0.05, `step ${fine.STEP}`);
  assert.equal((fine.N - 1) % 6, 0, 'every mesh step tiles the edge exactly');
  assert.ok(Math.abs(fine.SIZE - CELL * TILE_CELLS) < 1e-9);
  const road = Array.from({ length: 120 }, (_, i) => ({ x: i * 5, z: 0 }));
  fine.update(0, 0, road);
  for (let i = 0; i < 40; i++) { await flush(); fine.update(0, 0, null); }
  const s = fine.stats();
  assert.ok(s.ready > 0 && s.ready <= 30, `ready ${s.ready}`);
  // Inside the band the fine height matches the field; outside it there is no tile.
  const h = fine.sample(40, 30);
  assert.ok(h != null && Math.abs(h - field(40, 30)) < 0.05, `fine height ${h} vs ${field(40, 30)}`);
  assert.equal(fine.sample(40, FINE_BAND + fine.SIZE + 50), null, 'beyond the band');
  assert.equal(fine.sampleBase(40, 30), fine.sample(40, 30), 'no road lines: carved = base');
});

test('tiles get meshes nearest first, chunk holes follow, and far tiles are dropped', async () => {
  const { fine, changes } = make();
  const road = Array.from({ length: 200 }, (_, i) => ({ x: i * 5, z: 0 }));
  fine.update(0, 0, road);
  for (let i = 0; i < 60; i++) { await flush(); fine.update(0, 0, null); }
  assert.ok(fine.covers(20, 20), 'the tile under the car is meshed');
  assert.ok(changes.length > 0, 'the chunk mesh was told to cut holes');
  const near = [...fine.tiles.values()].find((t) => t.x0 === 0 && t.z0 === 0);
  assert.equal(near.meshStep, 1, '1 m mesh next to the car');
  const far = [...fine.tiles.values()].filter((t) => t.meshed && t.x0 > 400);
  assert.ok(far.every((t) => t.meshStep >= 2), 'coarser mesh further out');
  assert.ok(far.some((t) => t.meshStep === 3), '3 m mesh in the distance');
  // Drive 3 km away: everything is dropped and the holes are closed.
  const before = fine.tiles.size;
  fine.update(3000, 0, [{ x: 3000, z: 0 }]);
  assert.ok(fine.tiles.size < before, `dropped ${before} → ${fine.tiles.size}`);
  assert.equal(fine.covers(20, 20), false);
});

test('roads are carved into the fine ground and re-carved on request', async () => {
  let lines = [];
  const { fine } = make({ linesFor: () => lines });
  fine.update(0, 0, [{ x: 50, z: 50 }]);
  for (let i = 0; i < 20; i++) { await flush(); fine.update(0, 0, null); }
  const before = fine.sample(50, 50);
  lines = [{ half: 3.2, samples: [{ x: 0, z: 50, roadY: 70 }, { x: 170, z: 50, roadY: 70 }] }];
  fine.recarveWithin(0, 0, 200);
  const after = fine.sample(50, 50);
  assert.ok(Math.abs(after - 70.12) < 0.05, `road height ${after}`);
  assert.notEqual(before, after);
  assert.ok(Math.abs(fine.sampleBase(50, 50) - field(50, 50)) < 0.05, 'base keeps the natural ground');
});
