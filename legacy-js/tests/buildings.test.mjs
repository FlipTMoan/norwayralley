import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { orientedRectangle, buildChunkHouses } from '../src/buildings.js';

test('orientedRectangle recovers a rotated footprint', () => {
  // A 12 × 6 m box rotated by 30°, centred on (100, 50), with a bite out of a corner.
  const yaw = Math.PI / 6;
  const c = Math.cos(yaw); const s = Math.sin(yaw);
  const local = [[-6, -3], [6, -3], [6, 1], [4, 3], [-6, 3]];
  const pts = local.map(([u, v]) => ({ x: 100 + u * c - v * s, z: 50 + u * s + v * c }));
  const r = orientedRectangle(pts);
  assert.ok(Math.abs(r.length - 12) < 1e-6 && Math.abs(r.width - 6) < 1e-6, `size ${r.length}×${r.width}`);
  assert.ok(Math.abs(r.x - 100) < 1e-6 && Math.abs(r.z - 50) < 1e-6, `centre ${r.x},${r.z}`);
  const yawErr = Math.abs(((r.yaw - yaw) % Math.PI + Math.PI) % Math.PI);
  assert.ok(yawErr < 1e-6 || Math.abs(yawErr - Math.PI) < 1e-6, `yaw ${r.yaw}`);
});

test('buildChunkHouses places typed houses from footprints', () => {
  const terrain = {
    worldFromLatLon: (lat, lon) => ({ x: (lon - 6) * 100000, z: (59 - lat) * 100000 }),
    sample: () => 40,
    slope: () => 0.05,
  };
  const square = (lat, lon, w, d) => [
    { lat, lon }, { lat, lon: lon + w / 100000 }, { lat: lat - d / 100000, lon: lon + w / 100000 }, { lat: lat - d / 100000, lon },
  ];
  const placements = [
    { polygon: square(59, 6, 10, 8), tags: { building: 'house' } },
    { polygon: square(59, 6.001, 30, 12), tags: { building: 'barn' } },
    { polygon: square(59, 6.002, 20, 10), tags: { building: 'church' } },
    { polygon: square(59, 6.003, 3, 3), tags: { building: 'garage' } },
    { polygon: square(59, 6.004, 1, 1), tags: { building: 'yes' } }, // too small, dropped
  ];
  const group = buildChunkHouses(placements, terrain, null, 7);
  assert.equal(group.userData.count, 4);
  const names = group.children.map((m) => m.count);
  assert.deepEqual(names, [4, 4, 1, 1], 'walls, roofs, one tower, one spire');
});
