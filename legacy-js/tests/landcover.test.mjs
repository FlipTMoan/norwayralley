import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LandCover, COVER, SPECIES, rasterizeAreas, classifySpecies, classifyDensity,
  fillForestDefaults, tintByCover, sr16Url, utmBounds,
} from '../src/landcover.js';

const projection = {
  worldFromLatLon: (lat, lon) => ({ x: (lon - 6) * 100000, z: (59 - lat) * 100000 }),
  latLonFromWorld: (x, z) => ({ lat: 59 - z / 100000, lon: 6 + x / 100000 }),
};
const ring = (x0, z0, x1, z1) => [
  { lat: 59 - z0 / 100000, lon: 6 + x0 / 100000 }, { lat: 59 - z0 / 100000, lon: 6 + x1 / 100000 },
  { lat: 59 - z1 / 100000, lon: 6 + x1 / 100000 }, { lat: 59 - z1 / 100000, lon: 6 + x0 / 100000 },
];

test('OSM areas rasterise with priority and leaf hints', () => {
  const lc = new LandCover({ x0: 0, z0: 0, size: 1024, res: 64 });
  const painted = rasterizeAreas(lc, [
    { kind: 'forest', leaf: 'broadleaved', rings: [ring(0, 0, 1024, 1024)] },
    { kind: 'farmland', rings: [ring(100, 100, 500, 400)] },
    { kind: 'water', rings: [ring(200, 200, 300, 300)] },
  ], projection.worldFromLatLon);
  assert.ok(painted > 0);
  assert.equal(lc.coverAt(800, 800), COVER.FOREST);
  assert.equal(lc.speciesAt(800, 800), SPECIES.DECIDUOUS);
  assert.equal(lc.coverAt(120, 120), COVER.FIELD, 'field overrides forest');
  assert.equal(lc.coverAt(250, 250), COVER.WATER, 'water overrides field');
  fillForestDefaults(lc);
  assert.ok(lc.densityAt(800, 800) > 0);
});

test('SR16 colours classify to species and crown cover', () => {
  assert.equal(classifySpecies(0x52, 0xb0, 0x38, 255), SPECIES.SPRUCE);
  assert.equal(classifySpecies(0xcd, 0xaa, 0x65, 255), SPECIES.PINE);
  assert.equal(classifySpecies(0xff, 0xdc, 0x82, 255), SPECIES.DECIDUOUS);
  assert.equal(classifySpecies(0, 0, 0, 0), SPECIES.NONE);
  assert.equal(classifySpecies(10, 10, 200, 255), SPECIES.NONE, 'unknown colour is not forest');
  assert.ok(classifyDensity(0x00, 0x28, 0x0f, 255) > 0.9);
  assert.ok(classifyDensity(0xe5, 0xf5, 0xe0, 255) < 0.2);
  assert.equal(classifyDensity(0, 0, 0, 0), 0);
});

test('SR16 request covers the square in UTM 33 with easting-first bbox', () => {
  const proj = {
    latLonFromWorld: (x, z) => ({ lat: 61.12 - z / 111000, lon: 10.42 + x / 53800 }),
  };
  const lc = new LandCover({ x0: 0, z0: 0, size: 2048, res: 128 });
  const b = utmBounds(lc, proj);
  assert.ok(b.minE > 240000 && b.maxE < 270000 && b.minN > 6770000 && b.maxN < 6800000, JSON.stringify(b));
  assert.ok(b.maxE - b.minE > 2000 && b.maxN - b.minN > 2000);
  const url = new URL(sr16Url('SRRTRESLAG', b, 128, 128));
  assert.equal(url.searchParams.get('CRS'), 'EPSG:25833');
  assert.ok(url.searchParams.get('BBOX').startsWith(b.minE.toFixed(1)));
});

test('tintByCover colours fields and darkens forest floors', () => {
  const lc = new LandCover({ x0: 0, z0: 0, size: 64, res: 2 });
  lc.cover[0] = COVER.FIELD; lc.cover[1] = COVER.FOREST; lc.density[1] = 1;
  const base = { r: 0.25, g: 0.35, b: 0.2 };
  const field = tintByCover(lc, 8, 8, { ...base });
  const forest = tintByCover(lc, 40, 8, { ...base });
  const open = tintByCover(lc, 8, 40, { ...base });
  assert.ok(field.r > base.r + 0.2, 'field turns golden');
  assert.ok(forest.g < base.g, 'forest floor darkens');
  assert.deepEqual(open, base);
});
