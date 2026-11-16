import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLatLon } from '../src/geo.js';

test('parseLatLon accepts comma, semicolon or space separated pairs', () => {
  assert.deepEqual(parseLatLon('58.98, 6.19'), { lat: 58.98, lon: 6.19 });
  assert.deepEqual(parseLatLon(' 58.98;6.19 '), { lat: 58.98, lon: 6.19 });
  assert.deepEqual(parseLatLon('58.98 6.19'), { lat: 58.98, lon: 6.19 });
});

test('parseLatLon rejects anything that is not a plausible coordinate pair', () => {
  assert.equal(parseLatLon(''), null);
  assert.equal(parseLatLon('58.98'), null);
  assert.equal(parseLatLon('58.98, 6.19, 12'), null);
  assert.equal(parseLatLon('north, east'), null);
  assert.equal(parseLatLon('95, 6'), null);
  assert.equal(parseLatLon('58, 190'), null);
});
