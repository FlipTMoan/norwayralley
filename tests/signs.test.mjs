import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  parseWkt, signNumberFromVerdi, makeSignTexture, speedChanges, buildChunkSigns, fetchRoadSigns, NVDB_ATTRIBUTION,
} from '../src/signs.js';
import { utmInverse } from '../src/geo.js';

test('parseWkt reads POINT Z and LINESTRING Z', () => {
  const p = parseWkt('POINT Z (256285.394 6781434.061 247.96)');
  assert.equal(p.type, 'POINT');
  assert.deepEqual(p.points, [{ e: 256285.394, n: 6781434.061, h: 247.96 }]);
  const l = parseWkt('LINESTRING Z (1 2 3, 4 5 6, 7 8 9)');
  assert.equal(l.type, 'LINESTRING');
  assert.equal(l.points.length, 3);
  assert.deepEqual(l.points[2], { e: 7, n: 8, h: 9 });
  assert.equal(parseWkt('POLYGON ((0 0, 1 0, 1 1, 0 0))'), null);
  assert.equal(parseWkt(undefined), null);
});

test('signNumberFromVerdi takes the leading sign number', () => {
  assert.equal(signNumberFromVerdi('362.50 - Fartsgrense 50 km/t'), '362.50');
  assert.equal(signNumberFromVerdi('100.1 - Farlig sving til høyre'), '100.1');
  assert.equal(signNumberFromVerdi('729 Gate-/vegnavnskilt'), '729');
  assert.equal(signNumberFromVerdi('Ukjent'), null);
  assert.equal(signNumberFromVerdi(null), null);
});

test('makeSignTexture returns a cached sRGB CanvasTexture per key', () => {
  const a = makeSignTexture('362.50');
  assert.ok(a instanceof THREE.CanvasTexture);
  assert.equal(a.colorSpace, THREE.SRGBColorSpace);
  assert.equal(makeSignTexture('362.50'), a);
  assert.notEqual(makeSignTexture('362.80'), a);
  assert.notEqual(makeSignTexture('729', { text: 'Storgata' }), makeSignTexture('729', { text: 'Elvevegen' }));
  // Every drawing routine must survive the no-op canvas stub.
  for (const n of ['100.1', '100.2', '102.1', '104', '106', '108', '109', '110', '112', '114', '116', '124', '126', '132',
    '142', '144', '146.1', '146.2', '148', '150', '152', '156', '202', '204', '302', '306.1', '306.5', '312', '318',
    '334', '364.60', '406', '516', '552', '729', '902', '999']) {
    assert.ok(makeSignTexture(n), n);
  }
});

// Fake world: 1e5 m per degree, x east, z south; a straight road along +z spaced 4 m.
const terrain = {
  worldFromLatLon: (lat, lon) => ({ x: (lon - 6) * 100000, z: (59 - lat) * 100000 }),
  sample: () => 40,
};
const latLon = (x, z) => ({ lat: 59 - z / 100000, lon: 6 + x / 100000 });
const samples = Array.from({ length: 101 }, (_, i) => ({ x: 0, z: i * 4, y: 40, s: i * 4 }));
const route = {
  samples,
  roadWidth: 4.2,
  length: 400,
  nearest(x, z) {
    let bi = 0; let best = Infinity;
    samples.forEach((p, i) => {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < best) { best = d; bi = i; }
    });
    return { distance: best, index: bi, point: samples[bi], tangent: { x: 0, z: 1 }, progress: bi / 100 };
  },
};

function instanceFacing(mesh, i) {
  const m = new THREE.Matrix4();
  mesh.getMatrixAt(i, m);
  const p = new THREE.Vector3(); const q = new THREE.Quaternion(); const s = new THREE.Vector3();
  m.decompose(p, q, s);
  return { position: p, scale: s, facing: new THREE.Vector3(0, 0, 1).applyQuaternion(q) };
}

test('speedChanges finds where the limit along the route changes', () => {
  const speedLimits = [
    { kmh: 50, points: [latLon(0.5, 0), latLon(0.5, 200)] },
    { kmh: 80, points: [latLon(0.5, 200), latLon(0.5, 400)] },
    { kmh: 30, points: [latLon(40, 300), latLon(60, 300)] }, // side road, too far away
  ];
  const changes = speedChanges(samples, speedLimits, terrain);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].kmh, 80);
  assert.ok(Math.abs(changes[0].z - 200) <= 4, `change at z=${changes[0].z}`);
});

test('buildChunkSigns places real plates on the shoulder and synthesises speed changes', () => {
  // Travelling along +z (south), the right-hand side is -x (west).
  const signs = [
    { id: 2, number: '362.50', label: 'Fartsgrense 50 km/t', text: null, facing: 'against', side: 'right', ...latLon(-2, 100), height: 40 },
    { id: 1, number: '202', label: 'Vikeplikt', text: null, facing: null, side: null, ...latLon(60, 100), height: 40 }, // far away
  ];
  const speedLimits = [
    { kmh: 50, points: [latLon(0.5, 0), latLon(0.5, 200)] },
    { kmh: 80, points: [latLon(0.5, 200), latLon(0.5, 400)] },
  ];
  const group = buildChunkSigns({ signs, speedLimits }, terrain, route, { seed: 3 });
  assert.equal(group.name, 'signs');
  assert.equal(group.userData.count, 2, 'one real 362.50 plus one synthesised 362.80');
  const names = group.children.map((c) => c.name);
  assert.deepEqual(names, ['posts', 'plate:362.50', 'plate:362.80']);

  const real = instanceFacing(group.children[1], 0);
  assert.ok(Math.abs(Math.abs(real.position.x) - (4.2 + 1.6)) < 0.1, `lateral offset ${real.position.x}`);
  assert.ok(real.position.x < 0, 'kept on the right-hand (west) side');
  assert.ok(Math.abs(real.position.z - 100) < 0.2, `along-road ${real.position.z}`);
  assert.ok(Math.abs(real.position.y - 42) < 0.01, 'plate centre 2 m above ground');
  assert.ok(real.facing.z < -0.99, `faces against travel (+z): ${real.facing.z}`);
  assert.ok(Math.abs(real.scale.x - 0.8) < 1e-6, '362 plates are 0.8 m');

  const synth = instanceFacing(group.children[2], 0);
  assert.ok(Math.abs(synth.position.x + 5.8) < 0.1, `synthesised on the right: ${synth.position.x}`);
  assert.ok(Math.abs(synth.position.z - 200) <= 4, `synthesised at the change: ${synth.position.z}`);
  assert.ok(synth.facing.z < -0.99, 'synthesised plate faces oncoming traffic');

  // A real 362 plate near the change suppresses the synthetic one.
  const covered = buildChunkSigns({
    signs: [{ id: 9, number: '362.80', text: null, facing: null, ...latLon(-2, 196) }], speedLimits,
  }, terrain, route);
  assert.equal(covered.userData.count, 1);
  assert.equal(buildChunkSigns({ signs: [], speedLimits: [] }, terrain, route), null);
});

test('buildChunkSigns is deterministic and two-sided plates get two faces', () => {
  const signs = [
    { id: 5, number: '729', text: 'Storgata', facing: 'both', ...latLon(3, 40) },
    { id: 4, number: '204', text: null, facing: null, ...latLon(-3, 80) },
  ];
  const a = buildChunkSigns({ signs, speedLimits: [] }, terrain, route);
  const b = buildChunkSigns({ signs: signs.slice().reverse(), speedLimits: [] }, terrain, route);
  assert.deepEqual(a.children.map((c) => c.name), ['posts', 'plate:204', 'plate:729|Storgata']);
  assert.equal(a.children[2].count, 2, 'Tosidig plate is drawn facing both ways');
  assert.equal(a.children[1].count, 1);
  assert.deepEqual(Array.from(a.children[0].instanceMatrix.array), Array.from(b.children[0].instanceMatrix.array));
  const name = instanceFacing(a.children[2], 0);
  assert.ok(Math.abs(name.scale.x - 1.4) < 1e-6 && Math.abs(name.scale.y - 0.45) < 1e-6, 'road-name plate size');
  assert.ok(name.position.x > 0 && name.facing.z > 0.99, 'left-hand plate faces along the travel direction');
});

test('fetchRoadSigns queries NVDB with X-Client, pages, and parses plates and limits', async () => {
  const plate = {
    id: 916709385,
    egenskaper: [
      { id: 1894, navn: 'Ansiktsside, rettet mot', verdi: 'Trafikk mot metreringsretning', enum_id: 2717 },
      { id: 5530, navn: 'Skiltnummer', verdi: '362.50 - Fartsgrense 50 km/t', enum_id: 8874 },
    ],
    geometri: { wkt: 'POINT Z (256285.394 6781434.061 247.96)', srid: 5973 },
    lokasjon: { stedfestinger: [{ veglenkesekvensid: 1001830, relativPosisjon: 0.9904, retning: 'MED', sideposisjon: 'V' }] },
  };
  const limit = {
    id: 77,
    egenskaper: [{ id: 2021, navn: 'Fartsgrense', verdi: 50 }],
    geometri: { wkt: 'LINESTRING Z (256280 6781430 247, 256300 6781440 248, 256320 6781450 249)', srid: 5973 },
  };
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    const type = /vegobjekter\/(\d+)\?/.exec(url)[1];
    const objekter = url.includes('start=') ? [] : type === '96' ? [plate] : [limit];
    return {
      ok: true,
      json: async () => ({ objekter, metadata: { returnert: objekter.length, neste: { href: `${url}&start=next` } } }),
    };
  };
  try {
    const centre = utmInverse(256285.394, 6781434.061);
    const result = await fetchRoadSigns({
      minLat: centre.lat - 0.005, maxLat: centre.lat + 0.005, minLon: centre.lon - 0.01, maxLon: centre.lon + 0.01,
    });
    assert.equal(calls.length, 4, 'two types × (one page + the empty page after it)');
    assert.equal(calls[0].init.headers['X-Client'], 'norwayralley');
    const first = new URL(calls[0].url);
    assert.equal(first.searchParams.get('srid'), '5973');
    assert.equal(first.searchParams.get('antall'), '1000');
    const [minE, minN, maxE, maxN] = first.searchParams.get('kartutsnitt').split(',').map(Number);
    assert.ok(minE < 256285 && maxE > 256285 && minN < 6781434 && maxN > 6781434, 'easting-first UTM33 bbox');

    assert.equal(result.signs.length, 1);
    const s = result.signs[0];
    assert.equal(s.id, 916709385);
    assert.equal(s.number, '362.50');
    assert.equal(s.label, 'Fartsgrense 50 km/t');
    assert.equal(s.facing, 'against');
    assert.equal(s.side, 'left');
    assert.equal(s.text, null);
    assert.ok(Math.abs(s.lat - centre.lat) < 1e-9 && Math.abs(s.lon - centre.lon) < 1e-9);
    assert.equal(s.height, 247.96);
    assert.equal(result.speedLimits.length, 1);
    assert.equal(result.speedLimits[0].kmh, 50);
    assert.equal(result.speedLimits[0].points.length, 3);

    globalThis.fetch = async () => { throw new Error('offline'); };
    assert.deepEqual(await fetchRoadSigns({ minLat: 60, maxLat: 60.01, minLon: 10, maxLon: 10.01 }), { signs: [], speedLimits: [] });
  } finally {
    globalThis.fetch = original;
  }
  assert.match(NVDB_ATTRIBUTION, /NLOD/);
});
