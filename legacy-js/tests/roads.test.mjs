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
  // Connected roads share an OSM node: B's end and C's crossing are nodes of A.
  const a = { id: 10, kind: 'tertiary', points: [toLL(1000, 1000), toLL(1600, 1000), toLL(1700, 1000), toLL(1800, 1000)] };
  const la = prep([a], bumpy, { x0: 0, z0: 0, size: 2048 });
  bumpy.roads.setChunk('c', la);
  const b = { id: 11, kind: 'service', points: [toLL(1600, 1600), toLL(1600, 1000)] }; // ends on A at (1600, 1000)
  const lb = prep([b], bumpy, { x0: 0, z0: 0, size: 2048 });
  const endB = lb[0].samples[lb[0].samples.length - 1];
  const onA = bumpy.roads.nearest(1600, 1000, 4);
  assert.ok(Math.abs(endB.roadY - onA.roadY) < 0.05, `B meets A: ${endB.roadY.toFixed(2)} vs ${onA.roadY.toFixed(2)}`);
  // Crossing: way C crosses A in the middle; at the crossing it takes A's height.
  bumpy.roads.setChunk('d', lb);
  const c = { id: 12, kind: 'service', points: [toLL(1700, 1300), toLL(1700, 1000), toLL(1700, 700)] };
  const lc = prep([c], bumpy, { x0: 0, z0: 0, size: 2048 });
  const atCross = lc[0].samples.reduce((best, p) => (Math.abs(p.z - 1000) < Math.abs(best.z - 1000) ? p : best));
  const aHere = bumpy.roads.nearest(1700, 1000, 4);
  assert.ok(Math.abs(atCross.roadY - aHere.roadY) < 0.05, `C crosses A at A's height: ${atCross.roadY.toFixed(2)} vs ${aHere.roadY.toFixed(2)}`);
  let worst = 0;
  for (let i = 1; i < lc[0].samples.length; i++) worst = Math.max(worst, Math.abs(lc[0].samples[i].roadY - lc[0].samples[i - 1].roadY));
  assert.ok(worst < 0.3, `no step along C (worst ${worst.toFixed(2)} m per 5 m)`);
});

/** Heading (radians) of each step of a polyline, and the change in that per step (curvature continuity). */
function headings(pts) {
  const h = [];
  for (let i = 1; i < pts.length; i++) h.push(Math.atan2(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  const turn = [];
  for (let i = 1; i < h.length; i++) {
    let d = h[i] - h[i - 1];
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    turn.push(d);
  }
  return turn;
}

test('OSM centrelines are splines through every node: no corner facets, junction nodes kept', async () => {
  const { prepareChunkRoads: prep } = await import('../src/roads.js');
  const { splinePolyline } = await import('../src/geo.js');
  // A sparsely mapped bend: 90° over three nodes.
  const bend = [{ x: 0, z: 0 }, { x: 60, z: 0 }, { x: 100, z: 40 }, { x: 100, z: 100 }];
  const curve = splinePolyline(bend);
  for (const v of bend) assert.ok(curve.some((p) => p.x === v.x && p.z === v.z), `node ${v.x},${v.z} kept`);
  const turn = headings(curve);
  const deg = 180 / Math.PI;
  assert.ok(Math.max(...turn.map(Math.abs)) * deg <= 3.5, `about 3° per sample at most (${(Math.max(...turn.map(Math.abs)) * deg).toFixed(2)}°)`);
  // No facet: the heading change per sample never jumps (C1 at the nodes).
  let jump = 0;
  for (let i = 1; i < turn.length; i++) jump = Math.max(jump, Math.abs(turn[i] - turn[i - 1]));
  assert.ok(jump * deg < 2, `heading change jumps by ${(jump * deg).toFixed(2)}° between samples`);
  for (let i = 1; i < curve.length; i++) assert.ok(Math.hypot(curve[i].x - curve[i - 1].x, curve[i].z - curve[i - 1].z) <= 5.0001);

  // Two ways joined end to end at a bend: one tangent across the joint.
  const flat = { worldFromLatLon: (lat, lon) => ({ x: (lon - 6) * 100000, z: (59 - lat) * 100000 }), sample: () => 100, sampleBaseCoarse: () => 100 };
  const toLL = (x, z) => ({ lat: 59 - z / 100000, lon: 6 + x / 100000 });
  const a = { id: 1, kind: 'tertiary', points: [toLL(0, 500), toLL(300, 500), toLL(400, 520)] };
  const b = { id: 2, kind: 'tertiary', points: [toLL(400, 520), toLL(480, 580), toLL(520, 700)] };
  const lines = prep([a, b], flat, { x0: 0, z0: 0, size: 2048 });
  const la = lines.find((l) => l.id === 1).samples;
  const lb = lines.find((l) => l.id === 2).samples;
  const hA = Math.atan2(la.at(-1).x - la.at(-2).x, la.at(-1).z - la.at(-2).z);
  const hB = Math.atan2(lb[1].x - lb[0].x, lb[1].z - lb[0].z);
  assert.ok(Math.abs(hA - hB) * deg < 3.5, `heading across the joint changes ${(Math.abs(hA - hB) * deg).toFixed(2)}°`);
  // A junction node in the middle of A stays exactly on A.
  const c = { id: 3, kind: 'service', points: [toLL(300, 500), toLL(300, 300)] };
  const l2 = prep([a, c], flat, { x0: 0, z0: 0, size: 2048 });
  assert.ok(l2.find((l) => l.id === 1).samples.some((p) => Math.hypot(p.x - 300, p.z - 500) < 1e-6));
});

/* ---------------------------------------------------------------- *
 *  Junctions: one shared surface                                     *
 * ---------------------------------------------------------------- */

/** Surface of a prepared line at (x, z): its height plus crossfall, straight across the flat band. */
function surfaceOf(net, x, z) {
  const q = net.nearest(x, z, 12);
  const sd = (x - q.point.x) * -q.tangent.z + (z - q.point.z) * q.tangent.x;
  return { y: q.roadY + (q.bank || 0) * sd, q };
}

/** A hillside: 8 % up towards +x, a wave along z, and the main road's own ground 1.5 m off the side road's. */
const hill = {
  worldFromLatLon: (lat, lon) => ({ x: (lon - 6) * 100000, z: (59 - lat) * 100000 }),
  sampleBaseCoarse: (x, z) => 100 + 0.08 * x + 2 * Math.sin(z / 40) + (Math.abs(z - 1000) > 12 ? 1.5 : 0),
};
hill.sample = hill.sampleBaseCoarse;
const toLL = (x, z) => ({ lat: 59 - z / 100000, lon: 6 + x / 100000 });

/** Worst mismatch between the side road's straight cross-section and the main road's surface inside the main band. */
function junctionMismatch(lines, mainId, sideId) {
  const net = new RoadNetwork(); // the main road only
  net.setChunk('t', lines.filter((l) => l.id === mainId));
  const side = lines.filter((l) => l.id === sideId).flatMap((l) => l.samples);
  let worst = 0;
  let checked = 0;
  for (let i = 1; i + 1 < side.length; i++) {
    const p = side[i];
    const m = net.nearest(p.x, p.z, 12);
    if (!(m.distance <= m.width + 1.5)) continue;
    const a = side[i - 1]; const c = side[i + 1];
    const tl = Math.hypot(c.x - a.x, c.z - a.z);
    const nx = -(c.z - a.z) / tl; const nz = (c.x - a.x) / tl;
    for (const o of [-2.25, 0, 2.25]) {
      const x = p.x + nx * o; const z = p.z + nz * o;
      const mine = p.roadY + (p.bank || 0) * o;
      const main = surfaceOf(net, x, z).y;
      worst = Math.max(worst, Math.abs(mine - main));
      checked++;
    }
  }
  return { worst, checked };
}

test('a side road meets the main road on its surface: same height and crossfall within 2 cm, ramped in without a step', () => {
  const main = { id: 50, kind: 'secondary', points: [toLL(0, 1000), toLL(1000, 1000), toLL(2000, 1000)] }; // the crossing is a shared node
  const side = { id: 20, kind: 'residential', points: [toLL(1000, 1600), toLL(1000, 1000), toLL(1000, 400)] }; // crosses the main road
  // Both in the same chunk (the case that used to leave steps), side road listed first.
  const lines = prepareChunkRoads([side, main], hill, { x0: 0, z0: 0, size: 2048 });
  const { worst, checked } = junctionMismatch(lines, 50, 20);
  assert.ok(checked >= 6, `checked ${checked} points in the band`);
  assert.ok(worst < 0.02, `side road off the main surface by ${worst.toFixed(3)} m`);
  // The main road keeps its own grade (it outranks the side road).
  const alone = prepareChunkRoads([main], hill, { x0: 0, z0: 0, size: 2048 });
  const mainNow = lines.find((l) => l.id === 50).samples;
  alone[0].samples.forEach((p, i) => assert.ok(Math.abs(p.roadY - mainNow[i].roadY) < 1e-9));
  // Along the side road: no step, and the ramp keeps the grade change gentle.
  const s = lines.filter((l) => l.id === 20).flatMap((l) => l.samples);
  for (let i = 1; i < s.length; i++) {
    const ds = Math.hypot(s[i].x - s[i - 1].x, s[i].z - s[i - 1].z);
    assert.ok(Math.abs(s[i].roadY - s[i - 1].roadY) / ds < 0.12, `grade ${((s[i].roadY - s[i - 1].roadY) / ds * 100).toFixed(1)} % at ${i}`);
  }
});

test('a road passing over or under another one (no shared node) keeps its own height', () => {
  const main = { id: 70, kind: 'secondary', points: [toLL(0, 1000), toLL(2000, 1000)] };
  const under = { id: 71, kind: 'residential', points: [toLL(1000, 1600), toLL(1000, 400)] }; // a tunnel or underpass: no node in common
  const alone = prepareChunkRoads([under], hill, { x0: 0, z0: 0, size: 2048 })[0].samples;
  const both = prepareChunkRoads([under, main], hill, { x0: 0, z0: 0, size: 2048 }).find((l) => l.id === 71).samples;
  both.forEach((p, i) => assert.ok(Math.abs(p.roadY - alone[i].roadY) < 1e-9, 'unchanged'));
});

test('junctions agree across a chunk border, whichever chunk loads first', () => {
  // The junction lies in chunk B (x ≥ 2048); the side road reaches into chunk A's padded edge.
  const main = { id: 60, kind: 'tertiary', points: [toLL(2060, 0), toLL(2060, 1000), toLL(2060, 2000)] };
  const side = { id: 61, kind: 'residential', points: [toLL(1500, 1000), toLL(2060, 1000)] };
  const world = { ...hill, roads: new RoadNetwork(), roadHeights: new Map() };
  // Chunk A first: it only has the side road (the main road never enters A).
  const a = prepareChunkRoads([side], world, { x0: 0, z0: 0, size: 2048 });
  world.roads.setChunk('A', a);
  // Chunk B: both ways; the side road settles onto the main road there.
  const b = prepareChunkRoads([side, main], world, { x0: 2048, z0: 0, size: 2048 });
  world.roads.setChunk('B', b);
  // A re-settles once B's roads are known (stream.js queues it when the copies disagree).
  const a2 = prepareChunkRoads([side], world, { x0: 0, z0: 0, size: 2048 });
  const key = (p) => `${Math.round(p.x * 2)}:${Math.round(p.z * 2)}`;
  const inB = new Map(b.filter((l) => l.id === 61).flatMap((l) => l.samples).map((p) => [key(p), p]));
  let shared = 0; let worst = 0;
  for (const p of a2.flatMap((l) => l.samples)) {
    const q = inB.get(key(p));
    if (!q) continue;
    shared++;
    worst = Math.max(worst, Math.abs(q.roadY - p.roadY), Math.abs((q.bank || 0) - (p.bank || 0)) * 3);
  }
  assert.ok(shared > 5, `shared samples ${shared}`);
  assert.ok(worst < 0.02, `copies differ by ${worst.toFixed(3)} m`);
  assert.ok(junctionMismatch(b, 60, 61).worst < 0.02);
});

test('a bridge way meets the road it continues without a step', () => {
  // Road, then a bridge way over a 30 m gully, then road again — three ways in one chunk.
  const gully = { ...hill, sampleBaseCoarse: (x, z) => 100 + 0.05 * x + 3 * Math.sin(x / 23) + (Math.abs(x - 1000) < 15 ? -8 : 0) + 0 * z };
  gully.sample = gully.sampleBaseCoarse;
  const w1 = { id: 1, kind: 'primary', points: [toLL(600, 1000), toLL(980, 1000)] };
  const br = { id: 2, kind: 'primary', bridge: true, points: [toLL(980, 1000), toLL(1020, 1000)] };
  const w3 = { id: 3, kind: 'primary', points: [toLL(1020, 1000), toLL(1400, 1000)] };
  const lines = prepareChunkRoads([br, w3, w1], gully, { x0: 0, z0: 0, size: 2048 });
  const all = lines.flatMap((l) => l.samples.map((p) => ({ ...p, id: l.id }))).sort((p, q) => p.x - q.x);
  for (const x of [980, 1020]) {
    const at = all.filter((p) => Math.abs(p.x - x) < 1e-6);
    assert.ok(at.length >= 2, `both ways end at x=${x}`);
    const ys = at.map((p) => p.roadY);
    assert.ok(Math.max(...ys) - Math.min(...ys) < 0.02, `step at the bridge end x=${x}: ${ys.map((y) => y.toFixed(3)).join(' vs ')}`);
  }
});
