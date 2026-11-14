import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareChunkRoads, carvePolylines, RoadNetwork, isPaved } from '../src/roads.js';

const terrain = {
  worldFromLatLon: (lat, lon) => ({ x: (lon - 6) * 100000, z: (59 - lat) * 100000 }),
  sample: (x, z) => 100 + z * 0.1 + Math.sin(x / 7) * 0.4,
};
const ll = (x, z) => ({ lat: 59 - z / 100000, lon: 6 + x / 100000 });

test('prepareChunkRoads clips, resamples and smooths a road', () => {
  const roads = [{ kind: 'tertiary', name: 'Fv 1', surface: null, points: [ll(-100, 500), ll(1000, 500), ll(3000, 500)] }];
  const lines = prepareChunkRoads(roads, terrain, { x0: 0, z0: 0, size: 2048 });
  assert.equal(lines.length, 1);
  const s = lines[0].samples;
  assert.ok(s.every((p) => p.x >= -60 && p.x <= 2108), 'clipped to the padded chunk');
  assert.ok(s.length > 300, 'resampled at 5 m');
  const bumps = s.map((p) => Math.abs(p.roadY - (100 + 50))).reduce((a, b) => Math.max(a, b), 0);
  assert.ok(bumps < 0.2, `road height smoothed (max deviation ${bumps.toFixed(2)})`);
  assert.equal(lines[0].half, 2.1, 'ordinary roads: 2.1 m half → 6 m cut-out');
  assert.ok(lines[0].paved);
  assert.ok(!isPaved({ kind: 'track' }) && isPaved({ kind: 'track', surface: 'asphalt' }));
});

test('prepareChunkRoads cuts out the stretch that duplicates the stage route', () => {
  const roads = [{ kind: 'secondary', points: [ll(0, 100), ll(2000, 100)] }];
  const avoid = { index: { distanceTo: (x) => (x > 800 && x < 1200 ? 0 : 999) }, distance: 10 };
  const lines = prepareChunkRoads(roads, terrain, { x0: 0, z0: 0, size: 2048 }, { avoid });
  assert.equal(lines.length, 2, 'split around the route');
  assert.ok(lines.every((l) => l.samples.every((p) => p.x <= 800 || p.x >= 1200)));
});

test('carvePolylines carves the engineered profile into a grid', () => {
  const n = 65;
  const cell = 4;
  const heights = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) heights[j * n + i] = 50 + i * 0.5; // ground 66 under the road
  const samples = [];
  for (let z = -10; z <= 270; z += 5) samples.push({ x: 128, z, roadY: 70 }); // road 4 m above the ground: on fill
  const touched = carvePolylines({ heights, x0: 0, z0: 0, cell, n }, [{ half: 3.1, samples }], { lift: 0.12 }); // 4 m flat band
  assert.ok(touched > 0);
  const at = (x, z) => heights[(z / cell) * n + x / cell];
  assert.ok(Math.abs(at(128, 100) - 70.12) < 1e-4, 'centre at road height');
  const fill = 70.12 - 4 / 1.5 - 0.3; // 4 m beyond the shoulder, minus the carve margin
  assert.ok(Math.abs(at(120, 100) - fill) < 1e-3, `embankment low side ${at(120, 100)}`);
  assert.ok(Math.abs(at(136, 100) - fill) < 1e-3, `embankment high side ${at(136, 100)}`);
  assert.equal(at(200, 100), 50 + 50 * 0.5, 'untouched beyond the reach');
});

test('RoadNetwork answers nearest segment and spawn poses, and forgets chunks', () => {
  const net = new RoadNetwork({ spawn: { x: 5, z: 5, yaw: 0 } });
  const line = { half: 2.8, paved: true, samples: [{ x: 0, z: 0 }, { x: 100, z: 0 }, { x: 100, z: 100 }] };
  net.setChunk('0,0', [line]);
  const q = net.nearest(50, 7);
  assert.ok(Math.abs(q.distance - 7) < 1e-9);
  assert.deepEqual(q.tangent, { x: 1, z: 0 });
  assert.equal(q.width, 2.8);
  const pose = net.poseNear(130, 50);
  assert.ok(Math.abs(pose.x - 100) < 1e-9 && Math.abs(pose.z - 50) < 1e-9 && Math.abs(pose.yaw) < 1e-9);
  assert.equal(net.startPose().x, 5);
  net.removeChunk('0,0');
  assert.equal(net.nearest(50, 7).distance, Infinity);
  assert.equal(net.segmentCount, 0);
});

test('copies of one way prepared by two chunks share the same heights where they overlap', async () => {
  const { prepareChunkRoads } = await import('../src/roads.js');
  // A way crossing the border between chunk A (x < 0) and chunk B (x ≥ 0).
  const way = { id: 42, kind: 'residential', name: 'Grenseveien', points: Array.from({ length: 41 }, (_, i) => ({ lat: 59, lon: 6 + (i - 20) * 0.0002 })) };
  const registry = new Map();
  const make = (groundEast) => ({
    worldFromLatLon: (lat, lon) => ({ x: (lon - 6) * 55000, z: (59 - lat) * 111000 }),
    // Chunk A was prepared while B was unloaded: east of the border it only guessed the ground.
    sampleBaseCoarse: (x) => (x >= 0 ? groundEast(x) : 100 + x * 0.01),
    roadHeights: registry,
  });
  const a = prepareChunkRoads([way], make(() => 100), { x0: -2048, z0: -1024, size: 2048 });
  const b = prepareChunkRoads([way], make((x) => 100 + x * 0.03), { x0: 0, z0: -1024, size: 2048 });
  assert.equal(a.length, 1);
  assert.equal(b.length, 1);
  assert.equal(a[0].id, 42);
  const byPos = new Map(a[0].samples.map((p) => [`${p.x.toFixed(2)},${p.z.toFixed(2)}`, p.roadY]));
  let shared = 0;
  for (const p of b[0].samples) {
    const h = byPos.get(`${p.x.toFixed(2)},${p.z.toFixed(2)}`);
    if (h == null) continue;
    shared++;
    assert.ok(Math.abs(h - p.roadY) < 1e-9, `height differs at x=${p.x.toFixed(1)}: ${h} vs ${p.roadY}`);
  }
  assert.ok(shared > 10, `overlapping samples ${shared}`);
  // Where chunk B extends beyond A's copy, the heights ease away without a step.
  const sb = b[0].samples;
  for (let i = 1; i < sb.length; i++) assert.ok(Math.abs(sb[i].roadY - sb[i - 1].roadY) < 0.6, `step of ${(sb[i].roadY - sb[i - 1].roadY).toFixed(2)} m at ${i}`);
});
