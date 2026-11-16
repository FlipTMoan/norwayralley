import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { clipPolyline, resamplePolyline, buildChunkWater, waterAt, SEA_LEVEL } from '../src/water.js';

const waterDepthAt = (...args) => waterAt(...args).depth;

const box = { minX: 0, maxX: 100, minZ: 0, maxZ: 100 };

test('clipPolyline splits a line that leaves and re-enters the box', () => {
  const line = [{ x: -10, z: 50 }, { x: 50, z: 50 }, { x: 50, z: 150 }, { x: 90, z: 150 }, { x: 90, z: 50 }];
  const pieces = clipPolyline(line, box);
  assert.equal(pieces.length, 2);
  assert.deepEqual(pieces[0], [{ x: 0, z: 50 }, { x: 50, z: 50 }, { x: 50, z: 100 }]);
  assert.deepEqual(pieces[1], [{ x: 90, z: 100 }, { x: 90, z: 50 }]);
  assert.deepEqual(clipPolyline([{ x: -5, z: -5 }, { x: -5, z: 200 }], box), []);
});

test('resamplePolyline keeps endpoints and vertices at ~step spacing', () => {
  const line = [{ x: 0, z: 0 }, { x: 0, z: 10 }, { x: 25, z: 10 }];
  const out = resamplePolyline(line, 6);
  assert.deepEqual(out[0], line[0]);
  assert.deepEqual(out[out.length - 1], line[2]);
  assert.ok(out.some((p) => p.x === 0 && p.z === 10), 'original vertex kept');
  for (let i = 1; i < out.length; i++) {
    const d = Math.hypot(out[i].x - out[i - 1].x, out[i].z - out[i - 1].z);
    assert.ok(d > 3 && d <= 6, `spacing ${d}`);
  }
  assert.equal(out.length, 1 + 2 + 5);
});

// Same fake terrain as the buildings test, with a 2 m deep V-valley along x = 100.
const terrain = {
  worldFromLatLon: (lat, lon) => ({ x: (lon - 6) * 100000, z: (59 - lat) * 100000 }),
  sample: (x) => 40 - Math.max(0, 2 - Math.abs(x - 100) * 0.5),
  slope: () => 0.05,
};
const chunk = { x0: 0, z0: 0, size: 2048 };
const ll = (x, z) => ({ lat: 59 - z / 100000, lon: 6 + x / 100000 });

test('buildChunkWater drapes a stream in the valley floor', () => {
  const stream = { kind: 'stream', name: null, width: null, points: [ll(100, -50), ll(100, 1000), ll(100, 2100)] };
  const group = buildChunkWater({ waterways: [stream], areas: [] }, terrain, chunk);
  assert.ok(group && group.name === 'water');
  assert.equal(group.userData.rivers, 1);
  assert.equal(group.userData.lakes, 0);
  const pos = group.children[0].geometry.attributes.position;
  let maxY = -Infinity; let minY = Infinity;
  for (let i = 0; i < pos.count; i++) {
    maxY = Math.max(maxY, pos.getY(i));
    minY = Math.min(minY, pos.getY(i));
    assert.ok(pos.getZ(i) >= -2.01 && pos.getZ(i) <= 2050.01, `clipped z ${pos.getZ(i)}`);
  }
  assert.ok(maxY <= 38.4, `surface ${maxY} should sit within 0.4 m of the 38 m valley floor`);
  assert.ok(minY >= 37.4, `skirt ${minY}`);
});

test('buildChunkWater lays a lake flat at one level', () => {
  const ring = [ll(300, 300), ll(360, 300), ll(360, 350), ll(300, 350), ll(300, 300)];
  const outside = [ll(-300, 300), ll(-240, 300), ll(-240, 350), ll(-300, 350)];
  const areas = [
    { kind: 'water', water: 'lake', rings: [ring] },
    { kind: 'water', water: 'lake', rings: [outside] }, // centroid in the neighbouring chunk
    { kind: 'forest', water: null, rings: [ring] },
  ];
  const group = buildChunkWater({ waterways: [], areas }, terrain, chunk);
  assert.equal(group.userData.rivers, 0);
  assert.equal(group.userData.lakes, 1);
  const mesh = group.children[0];
  const pos = mesh.geometry.attributes.position;
  assert.ok(pos.count >= 4 && mesh.geometry.index.count >= 6);
  for (let i = 0; i < pos.count; i++) assert.equal(pos.getY(i), pos.getY(0));
  assert.ok(Math.abs(pos.getY(0) - 40.25) < 1e-4, `level ${pos.getY(0)}`);
  const n = mesh.geometry.attributes.normal;
  assert.ok(n.getY(0) > 0.99, 'top face points up');
  assert.equal(buildChunkWater({ waterways: [], areas: [] }, terrain, chunk), null);
});

test('waterDepthAt knows the sea, the shore, lakes and rivers', () => {
  const stream = { kind: 'stream', name: null, width: null, points: [ll(100, -50), ll(100, 1000), ll(100, 2100)] };
  const lake = { kind: 'water', rings: [[ll(500, 500), ll(700, 500), ll(700, 700), ll(500, 700), ll(500, 500)]] };
  const group = buildChunkWater({ waterways: [stream], areas: [lake] }, terrain, chunk);
  const bodies = group.userData.bodies;
  assert.equal(bodies.lakes.length, 1);
  assert.equal(bodies.rivers.length, 1);
  assert.equal(waterDepthAt(bodies, terrain, 300, 300), 0, 'dry hillside');
  assert.ok(waterDepthAt(bodies, terrain, 600, 600) > 0.2, 'inside the lake');
  assert.equal(waterDepthAt(bodies, terrain, 800, 600), 0, 'just outside the lake');
  assert.ok(waterDepthAt(bodies, terrain, 100, 800) >= 0.2, 'in the stream');
  assert.equal(waterDepthAt(bodies, terrain, 110, 800), 0, 'beside the stream');
  const sea = { sample: () => 0 };
  assert.ok(waterDepthAt(null, sea, 0, 0) > 1, 'the fjord counts as deep');
  const shore = { sample: () => SEA_LEVEL - 0.2 };
  assert.ok(Math.abs(waterDepthAt(null, shore, 0, 0) - 0.2) < 1e-6, 'wading at the shore');
  assert.equal(waterAt(null, shore, 0, 0).surface, SEA_LEVEL, 'the shore water surface is the sea plane');
  assert.ok(Math.abs(waterAt(bodies, terrain, 600, 600).surface - (40 + waterDepthAt(bodies, terrain, 600, 600))) < 1e-6, 'lake surface = ground + depth');
});
