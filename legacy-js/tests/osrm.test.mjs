import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { osrmRouteUrl, nearestWithin, SNAP_RADIUS } from '../src/stage.js';

test('route URLs carry a snap radius per point, unlimited where none is set', () => {
  const base = 'https://router.example/route/v1/driving';
  const pts = [{ lat: 59.0, lon: 6.0 }, { lat: 59.1, lon: 6.2 }];
  assert.equal(osrmRouteUrl(base, pts), `${base}/6,59;6.2,59.1?overview=full&geometries=geojson&steps=false`);
  assert.equal(osrmRouteUrl(base, pts, [null, null]), `${base}/6,59;6.2,59.1?overview=full&geometries=geojson&steps=false`);
  assert.equal(
    osrmRouteUrl(base, pts, [SNAP_RADIUS, null]),
    `${base}/6,59;6.2,59.1?overview=full&geometries=geojson&steps=false&radiuses=1000;unlimited`,
  );
});

test('nearestWithin takes the first waypoint inside the radius', () => {
  const data = { code: 'Ok', waypoints: [
    { location: [6.01, 59.01], name: 'Fv 523', distance: 1240 },
    { location: [6.02, 59.02], name: '', distance: 310 },
  ] };
  assert.deepEqual(nearestWithin(data), { lat: 59.02, lon: 6.02, name: null, distance: 310 });
  assert.deepEqual(nearestWithin(data, null), { lat: 59.01, lon: 6.01, name: 'Fv 523', distance: 1240 });
  assert.equal(nearestWithin(data, 100), null);
  assert.equal(nearestWithin({ code: 'NoSegment' }), null);
  assert.equal(nearestWithin(null), null);
});
