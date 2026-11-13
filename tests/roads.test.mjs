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
  assert.equal(lines[0].half, 3.2);
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

test('carvePolylines flattens the ground along a road and blends out', () => {
  const n = 65;
  const cell = 4;
  const heights = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) heights[j * n + i] = 50 + i * 0.5; // slope across x
  const samples = [];
  for (let z = -10; z <= 270; z += 5) samples.push({ x: 128, z, roadY: 66 });
  const touched = carvePolylines({ heights, x0: 0, z0: 0, cell, n }, [{ half: 3, samples }], { lift: 0.12, blend: 6 });
  assert.ok(touched > 0);
  const at = (x, z) => heights[(z / cell) * n + x / cell];
  assert.ok(Math.abs(at(128, 100) - 66.12) < 1e-4, 'centre at road height');
  assert.ok(Math.abs(at(132, 100) - 66.12) < 1e-4, 'inside half width + shoulder');
  assert.ok(at(136, 100) > 66.2 && at(136, 100) < 50 + 34 * 0.5, 'blend zone is between road and hillside');
  assert.equal(at(160, 100), 50 + 40 * 0.5, 'untouched beyond the blend');
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
