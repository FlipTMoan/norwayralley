import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTerrainModel } from '../src/terrain.js';
import { makeRoute } from '../src/stage.js';
import { Car } from '../src/car.js';
import { carveProfile, smoothRoadHeights, ROAD_LIFT } from '../src/corridor.js';
import { BuildingIndex, fetchOsmChunk, resetOverpassState } from '../src/buildings.js';
import { prepareChunkRoads, RoadNetwork } from '../src/roads.js';
import {
  isBridgeTag, waterProbe, wetCore, markBridgeSpans, bridgeRaw, applyBridgeProfile, buildBridgeParts,
  deckHalf, WATER_CLEARANCE,
} from '../src/bridges.js';

/** Straight road samples along +z every `step` metres, with `s`. */
function line(z0, z1, step = 5) {
  const out = [];
  for (let z = z0; z <= z1 + 1e-6; z += step) out.push({ x: 0, z, s: z - z0 });
  return out;
}

/** A river running along x, `width` metres wide, centred on z = 0. */
const river = (width) => (x, z) => Math.abs(z) <= width / 2;

/**
 * Terrain with a sound across z = 0: banks at 6 m, the channel (|z| < 25 m)
 * at height 0 — the sea in waterAt, deep enough to sink the car.
 */
function soundTerrain({ size = 800, grid = 401 } = {}) {
  const heights = new Float32Array(grid * grid);
  for (let j = 0; j < grid; j++) {
    const z = -size / 2 + (j / (grid - 1)) * size;
    const bank = Math.abs(z) < 25 ? 0 : Math.abs(z) < 35 ? 6 * (Math.abs(z) - 25) / 10 : 6;
    for (let i = 0; i < grid; i++) heights[j * grid + i] = bank;
  }
  return createTerrainModel({
    heights, grid, sizeX: size, sizeZ: size,
    projection: { worldFromLatLon: () => ({ x: 0, z: 0 }), latLonFromWorld: () => ({ lat: 59, lon: 6 }) },
    scene: { name: 'test', title: 'test', lat: 59, lon: 6 }, basemapUrl: null, meta: { originX: 0, originY: 0 },
  });
}

/** A stage road straight across the sound with its bridge span, graded and carved like the streamed world. */
function bridgedStage() {
  const terrain = soundTerrain();
  const route = makeRoute([{ x: 0, z: -300 }, { x: 0, z: 300 }], terrain, { roadWidth: 5.25, spacing: 5, smooth: 1 });
  const s = route.samples;
  const ground = (x, z) => terrain.sampleBase(x, z);
  const wet = (x, z) => ground(x, z) < 0.1;
  markBridgeSpans(s, wetCore(s, wet, { lateral: 13, ground }));
  const smooth = smoothRoadHeights(bridgeRaw(s.map((p) => ground(p.x, p.z)), s), 5);
  s.forEach((p, i) => { p.roadY = smooth[i]; });
  applyBridgeProfile(s, ground);
  for (const p of s) p.y = p.roadY + ROAD_LIFT;
  terrain.carveRoad(s, { halfWidth: route.roadWidth + 1.2, lift: ROAD_LIFT });
  const parts = buildBridgeParts([{ samples: s, half: route.roadWidth }], ground);
  terrain.buildings = new BuildingIndex();
  terrain.buildings.setChunk('bridges', parts.boxes);
  return { terrain, route, parts };
}

test('bridge tags: yes and viaduct are bridges; no, culvert and tunnels are not', () => {
  assert.equal(isBridgeTag({ bridge: 'yes' }), true);
  assert.equal(isBridgeTag({ bridge: 'viaduct', layer: '1' }), true);
  assert.equal(isBridgeTag({ bridge: 'no' }), false);
  assert.equal(isBridgeTag({ bridge: 'culvert' }), false);
  assert.equal(isBridgeTag({ bridge: 'yes', tunnel: 'culvert' }), false);
  assert.equal(isBridgeTag({ highway: 'primary' }), false);
});

test('Overpass parsing keeps the bridge flag and drops culverted streams', async () => {
  resetOverpassState();
  const g = [{ lat: 59.001, lon: 6.001 }, { lat: 59.002, lon: 6.001 }];
  const elements = [
    { type: 'way', id: 1, tags: { highway: 'primary', bridge: 'yes', layer: '1' }, geometry: g },
    { type: 'way', id: 2, tags: { highway: 'primary' }, geometry: g },
    { type: 'way', id: 3, tags: { waterway: 'stream', tunnel: 'culvert' }, geometry: g },
    { type: 'way', id: 4, tags: { waterway: 'river' }, geometry: g },
  ];
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ elements }) });
  const osm = await fetchOsmChunk({ minLat: 59.5, minLon: 6.5, maxLat: 59.52, maxLon: 6.54 });
  assert.deepEqual(osm.roads.map((r) => [r.id, r.bridge]), [[1, true], [2, false]]);
  assert.deepEqual(osm.waterways.map((w) => w.kind), ['river']);
});

test('a road across a 20 m river gets one span from bank to bank; a 2 m stream stays a culvert', () => {
  const s = line(-100, 100);
  const spans = markBridgeSpans(s, wetCore(s, river(20)));
  assert.equal(spans.length, 1);
  const { i0, i1 } = spans[0];
  assert.ok(s[i0].z < -10 && s[i1].z > 10, `span ${s[i0].z}..${s[i1].z} covers the water`);
  assert.ok(s[i1].z - s[i0].z <= 35, 'and not much more');
  assert.ok(!s[i0 - 1].bridge && !s[i1 + 1].bridge);

  const t = line(-100, 100);
  assert.equal(markBridgeSpans(t, wetCore(t, river(2))).length, 0);
});

test('no bridge where the road only clips a lake shore or runs on a causeway', () => {
  // Water on one side only (a shoreline polygon that overlaps the road).
  const s = line(-100, 100);
  const shore = (x, z) => x > -3 && Math.abs(z) < 40;
  assert.equal(markBridgeSpans(s, wetCore(s, shore)).length, 0);
  // Water all round, but the DTM under the road is 3 m above the water: fill.
  const c = line(-100, 100);
  const lake = (x, z) => Math.abs(z) < 40;
  const ground = (x, z) => (Math.abs(x) < 8 ? 3 : 0);
  assert.equal(markBridgeSpans(c, wetCore(c, lake, { lateral: 12, ground })).length, 0);
});

test('water probe: lake polygons, river lines and the sea', () => {
  const project = (lat, lon) => ({ x: lon, z: lat }); // test coordinates are metres already
  const wet = waterProbe({
    areas: [{ kind: 'water', rings: [[{ lat: 0, lon: 0 }, { lat: 0, lon: 50 }, { lat: 50, lon: 50 }, { lat: 50, lon: 0 }]] }],
    waterways: [{ kind: 'river', width: 12, points: [{ lat: 200, lon: -100 }, { lat: 200, lon: 100 }] }],
  }, project, (x, z) => (x > 500 ? 0 : 10));
  assert.equal(wet(25, 25), true);
  assert.equal(wet(25, 75), false);
  assert.equal(wet(0, 205), true);
  assert.equal(wet(0, 210), false);
  assert.equal(wet(600, 600), true);
});

test('deck profile: never down to the water, clearance above it, gentle ramps', () => {
  // Banks at 3 m, a 40 m wide river at 0 m: the plain grade would dip into it.
  const s = line(-300, 300);
  const ground = (x, z) => (Math.abs(z) < 20 ? 0 : Math.abs(z) < 30 ? (Math.abs(z) - 20) * 0.3 : 3);
  const raw = s.map((p) => ground(p.x, p.z));
  const plain = smoothRoadHeights(raw, 5);
  const centre = s.findIndex((p) => p.z === 0);
  assert.ok(plain[centre] < 2.5, `without bridges the road sags to ${plain[centre].toFixed(2)} m`);

  markBridgeSpans(s, wetCore(s, river(40)));
  const smooth = smoothRoadHeights(bridgeRaw(raw, s), 5);
  s.forEach((p, i) => { p.roadY = smooth[i]; });
  applyBridgeProfile(s, ground);
  for (const p of s) {
    if (p.wet) assert.ok(p.roadY >= ground(p.x, p.z) + WATER_CLEARANCE - 1e-6, `deck ${p.roadY.toFixed(2)} at z=${p.z}`);
  }
  for (let i = 1; i < s.length; i++) {
    const grade = Math.abs(s[i].roadY - s[i - 1].roadY) / 5;
    assert.ok(grade < 0.1, `grade ${(grade * 100).toFixed(1)} % at z=${s[i].z}`);
  }
  // Far from the river the road is where it was.
  assert.ok(Math.abs(s[0].roadY - plain[0]) < 1e-6);
});

test('a tagged bridge way keeps its ends at the bank: roads that meet it do not step', () => {
  const s = line(-30, 30, 5);
  s.forEach((p) => { p.roadY = 3; p.wet = Math.abs(p.z) < 20; });
  markBridgeSpans(s, s.map(() => true));
  applyBridgeProfile(s, (x, z) => (Math.abs(z) < 20 ? 0 : 3));
  assert.equal(s[0].roadY, 3);
  assert.equal(s[s.length - 1].roadY, 3);
  assert.ok(s[6].roadY > 3.5, 'the middle is lifted towards the clearance');
});

test('the terrain under a span is neither carved nor filled; the approaches are', () => {
  const n = 101;
  const cell = 2;
  const base = new Float32Array(n * n);
  for (let j = 0; j < n; j++) {
    const z = -100 + j * cell;
    for (let i = 0; i < n; i++) base[j * n + i] = Math.abs(z) < 20 ? 0 : 3;
  }
  const heights = base.slice();
  const s = line(-100, 100);
  markBridgeSpans(s, wetCore(s, river(40)));
  s.forEach((p) => { p.roadY = 4; });
  carveProfile({ heights, base, x0: -100, z0: -100, cell, n }, [{ half: 3, samples: s }]);
  const at = (x, z) => j0(z) * n + Math.round((x + 100) / cell);
  function j0(z) { return Math.round((z + 100) / cell); }
  for (let z = -18; z <= 18; z += 2) {
    for (let x = -8; x <= 8; x += 2) assert.equal(heights[at(x, z)], base[at(x, z)], `cell ${x},${z} under the deck`);
  }
  assert.ok(Math.abs(heights[at(0, -60)] - (4 + ROAD_LIFT)) < 1e-3, 'the approach is carved to the road');
});

test('a road network bridge way: flagged segments, deck heights for the car', () => {
  const terrain = soundTerrain();
  const osmRoads = [{ id: 7, kind: 'primary', bridge: true, points: [{ lat: -40, lon: 0 }, { lat: 40, lon: 0 }] }];
  terrain.worldFromLatLon = (lat, lon) => ({ x: lon, z: lat });
  const lines = prepareChunkRoads(osmRoads, terrain, { x0: -400, z0: -400, size: 800 }, { wet: (x, z) => terrain.sampleBase(x, z) < 0.1 });
  assert.equal(lines.length, 1);
  assert.ok(lines[0].samples.every((p) => p.bridge));
  const net = new RoadNetwork();
  net.setChunk('c', lines);
  assert.ok(net.bridgeCount > 0);
  const q = net.nearest(0, 0, 20);
  assert.equal(q.bridge, true);
  assert.ok(q.roadY > 3, `deck at ${q.roadY.toFixed(2)} m over the water`);

  // A short bridge way whose ends sit on the bank slope (4.2 m) is graded with
  // the ground beyond it (6 m), like the roads it joins, not sunk to its ends.
  const short = prepareChunkRoads([{ id: 8, kind: 'primary', bridge: true, points: [{ lat: -32, lon: 50 }, { lat: 32, lon: 50 }] }], terrain, { x0: -400, z0: -400, size: 800 });
  const ends = [short[0].samples[0], short[0].samples.at(-1)];
  for (const e of ends) assert.ok(e.roadY > 4.8, `end at ${e.roadY.toFixed(2)} m`);
});

test('the car drives across the bridge on the deck and never touches the water', () => {
  const { terrain, route } = bridgedStage();
  assert.ok(terrain.waterAt(0, 0).depth > 2, 'the ground under the deck is still the sound');
  const car = new Car({ add() {}, remove() {} }, terrain);
  car.setRoute(route);
  const input = { throttle: 0.7, brake: 0, steer: 0, handbrake: false, jump: false };
  let crossed = false;
  let worstSink = 0;
  for (let i = 0; i < 60 * 30 && car.pos.z < 200; i++) {
    car.update(1 / 60, input);
    assert.equal(car.waterDepth, 0, `water contact at z=${car.pos.z.toFixed(1)} y=${car.pos.y.toFixed(2)}`);
    if (Math.abs(car.pos.z) < 15) {
      crossed = true;
      const q = route.nearest(car.pos.x, car.pos.z);
      assert.equal(q.bridge, true);
      worstSink = Math.max(worstSink, q.roadY + ROAD_LIFT - car.pos.y);
    }
  }
  assert.ok(crossed && car.pos.z >= 200, `car reached z=${car.pos.z.toFixed(1)}`);
  assert.ok(worstSink < 0.1, `sank ${worstSink.toFixed(2)} m into the deck`);
});

test('the guard rail stops a car steering off the deck; off the deck it falls into the water', () => {
  const { terrain, route } = bridgedStage();
  const car = new Car({ add() {}, remove() {} }, terrain);
  car.setRoute(route);
  const span = route.samples.filter((p) => p.bridge);
  const half = deckHalf(route.roadWidth);
  // On the deck, heading 35° towards the rail at speed.
  car.reset({ x: 0, z: span[1].z, yaw: 0.6 });
  car.vel.set(Math.sin(0.6) * 20, Math.cos(0.6) * 20);
  car.vF = 20;
  const input = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  let hit = false;
  for (let i = 0; i < 60 && car.pos.z < span[span.length - 2].z; i++) {
    car.update(1 / 60, input);
    hit ||= car.crash > 0;
    assert.ok(Math.abs(car.pos.x) < half, `car at x=${car.pos.x.toFixed(2)} went through the rail`);
  }
  assert.ok(hit, 'the rail registered a hit');

  // Beside the deck the car is in the water.
  const off = new Car({ add() {}, remove() {} }, terrain);
  off.setRoute(route);
  off.reset({ x: half + 6, z: 0, yaw: 0 });
  for (let i = 0; i < 30; i++) off.update(1 / 60, { throttle: 0, brake: 0, steer: 0 });
  assert.ok(off.waterDepth > 0, 'beside the bridge is water');
  assert.ok(off.pos.y < 1, `car at y=${off.pos.y.toFixed(2)}`);
});
