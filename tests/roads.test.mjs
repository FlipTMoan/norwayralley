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
  assert.equal(lines[0].half, 5.25, 'tertiary: two-lane carriageway');
  assert.equal(lines[0].cut, 9, 'two-lane: 18 m cut-through');
  assert.ok(Number.isFinite(lines[0].samples[10].edgeL) && Number.isFinite(lines[0].samples[10].edgeR), 'rim heights assigned');
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
  const touched = carvePolylines({ heights, x0: 0, z0: 0, cell, n }, [{ half: 3.25, cut: 8, samples }], { lift: 0.12 }); // two-lane terrace
  assert.ok(touched > 0);
  const at = (x, z) => heights[(z / cell) * n + x / cell];
  assert.ok(Math.abs(at(128, 100) - 70.12) < 1e-4, 'centre at road height');
  assert.ok(Math.abs(at(124, 100) - 70.12) < 1e-4 && Math.abs(at(132, 100) - 70.12) < 1e-4, 'flat shoulder to shoulder (4 m inside the flat band)');
  assert.ok(Math.abs(at(120, 100) - (50 + 120 / 8)) < 1e-3, `terrace meets the ground at the cut-through edge ${at(120, 100)}`);
  assert.ok(Math.abs(at(136, 100) - (50 + 136 / 8)) < 1e-3, `… on the high side too ${at(136, 100)}`);
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

test('a road crossing the stage keeps going, the stage road\'s OSM twin is cut, junctions meet without a step', async () => {
  const { buildRouteIndex, makeRoute } = await import('../src/stage.js');
  const { prepareChunkRoads: prep, RoadNetwork: Net } = await import('../src/roads.js');
  const flat = { worldFromLatLon: (lat, lon) => ({ x: (lon - 6) * 100000, z: (59 - lat) * 100000 }), sample: () => 100, sampleBaseCoarse: () => 100 };
  const toLL = (x, z) => ({ lat: 59 - z / 100000, lon: 6 + x / 100000 });
  // Stage road along x at z = 500.
  const stage = makeRoute([{ x: -200, z: 500 }, { x: 2300, z: 500 }], flat, { roadWidth: 3.5, cutHalf: 8 });
  const index = buildRouteIndex(stage);
  const twin = { id: 1, kind: 'tertiary', points: [toLL(0, 502), toLL(1000, 502), toLL(2000, 502)] };
  const crossing = { id: 2, kind: 'residential', points: [toLL(1000, 100), toLL(1000, 500), toLL(1000, 900)] };
  const lines = prep([twin, crossing], flat, { x0: 0, z0: 0, size: 2048 }, { avoid: { index, distance: 12 } });
  const ids = lines.map((l) => l.id);
  assert.ok(!ids.includes(1), 'the parallel twin inside the band is gone');
  const cross = lines.filter((l) => l.id === 2);
  assert.equal(cross.length, 1, 'the crossing road is one unbroken run');
  assert.ok(cross[0].samples.some((p) => Math.abs(p.z - 500) < 3), 'it passes over the stage road');

  // Junction: way B ends on way A (already in the network) 1.6 m higher on its own ground.
  const bumpy = { worldFromLatLon: flat.worldFromLatLon, sample: (x) => (x > 1500 ? 101.6 : 100), sampleBaseCoarse: (x) => (x > 1500 ? 101.6 : 100), roads: new Net(), roadHeights: new Map() };
  const a = { id: 10, kind: 'tertiary', points: [toLL(1000, 1000), toLL(1800, 1000)] };
  const la = prep([a], bumpy, { x0: 0, z0: 0, size: 2048 });
  bumpy.roads.setChunk('c', la);
  const b = { id: 11, kind: 'service', points: [toLL(1600, 1600), toLL(1600, 1000)] }; // ends on A at (1600, 1000)
  const lb = prep([b], bumpy, { x0: 0, z0: 0, size: 2048 });
  const endB = lb[0].samples[lb[0].samples.length - 1];
  const onA = bumpy.roads.nearest(1600, 1000, 4);
  assert.ok(Math.abs(endB.roadY - onA.roadY) < 0.05, `B meets A: ${endB.roadY.toFixed(2)} vs ${onA.roadY.toFixed(2)}`);
  // Crossing: way C crosses A in the middle; at the crossing it takes A's height.
  bumpy.roads.setChunk('d', lb);
  const c = { id: 12, kind: 'service', points: [toLL(1700, 1300), toLL(1700, 700)] };
  const lc = prep([c], bumpy, { x0: 0, z0: 0, size: 2048 });
  const atCross = lc[0].samples.reduce((best, p) => (Math.abs(p.z - 1000) < Math.abs(best.z - 1000) ? p : best));
  const aHere = bumpy.roads.nearest(1700, 1000, 4);
  assert.ok(Math.abs(atCross.roadY - aHere.roadY) < 0.05, `C crosses A at A's height: ${atCross.roadY.toFixed(2)} vs ${aHere.roadY.toFixed(2)}`);
  let worst = 0;
  for (let i = 1; i < lc[0].samples.length; i++) worst = Math.max(worst, Math.abs(lc[0].samples[i].roadY - lc[0].samples[i - 1].roadY));
  assert.ok(worst < 0.3, `no step along C (worst ${worst.toFixed(2)} m per 5 m)`);
});

test('OSM centrelines are smoothed into curves at bends while junction nodes stay put', async () => {
  const { smoothWay, prepareChunkRoads: prep } = await import('../src/roads.js');
  // A right-angle bend: the corner is cut into a curve.
  const bend = [{ x: 0, z: 0 }, { x: 100, z: 0 }, { x: 100, z: 100 }];
  const curved = smoothWay(bend);
  assert.ok(curved.length > 3);
  assert.deepEqual(curved[0], { x: 0, z: 0 });
  assert.deepEqual(curved[curved.length - 1], { x: 100, z: 100 });
  const closest = Math.min(...curved.map((p) => Math.hypot(p.x - 100, p.z - 0)));
  assert.ok(closest > 10, `corner cut by ${closest.toFixed(1)} m`);
  // Pin the corner: it is kept exactly.
  const pinnedCurve = smoothWay(bend, new Set([1]));
  assert.ok(pinnedCurve.some((p) => p.x === 100 && p.z === 0), 'pinned corner kept');
  // In a chunk: way B joins way A at A's middle node; A's node stays, so the junction still meets.
  const flat = { worldFromLatLon: (lat, lon) => ({ x: (lon - 6) * 100000, z: (59 - lat) * 100000 }), sample: () => 100, sampleBaseCoarse: () => 100 };
  const toLL = (x, z) => ({ lat: 59 - z / 100000, lon: 6 + x / 100000 });
  const a = { id: 1, kind: 'tertiary', points: [toLL(0, 500), toLL(400, 500), toLL(400, 900), toLL(800, 900)] };
  const b = { id: 2, kind: 'service', points: [toLL(400, 500), toLL(400, 100)] };
  const lines = prep([a, b], flat, { x0: 0, z0: 0, size: 2048 });
  const la = lines.find((l) => l.id === 1);
  assert.ok(la.samples.some((p) => Math.hypot(p.x - 400, p.z - 500) < 0.6), 'A still passes through the junction node');
  assert.ok(!la.samples.some((p) => Math.hypot(p.x - 400, p.z - 900) < 8), 'A\'s free corner is rounded');
});
