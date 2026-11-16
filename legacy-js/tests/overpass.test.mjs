import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchOsmChunk, overpassState, resetOverpassState } from '../src/buildings.js';

const bbox = { minLat: 59, minLon: 6, maxLat: 59.02, maxLon: 6.04 };
const answer = { elements: [{ type: 'way', id: 1, tags: { building: 'house' }, geometry: [{ lat: 59.001, lon: 6.001 }, { lat: 59.001, lon: 6.0012 }, { lat: 59.0012, lon: 6.0012 }, { lat: 59.0012, lon: 6.001 }, { lat: 59.001, lon: 6.001 }] }] };

/** A fetch where some mirrors hang until aborted and one answers at once. */
function fakeFetch(fast) {
  const calls = [];
  const fetch = (url, { signal }) => {
    calls.push(url);
    if (url === fast) return Promise.resolve({ ok: true, json: async () => answer });
    return new Promise((_, reject) => {
      signal.addEventListener('abort', () => { const e = new Error('aborted'); e.name = 'AbortError'; reject(e); });
    });
  };
  return { fetch, calls };
}

test('a hanging first mirror does not delay houses: the mirrors race and the winner is remembered', async () => {
  resetOverpassState();
  const fast = 'https://overpass.openstreetmap.fr/api/interpreter';
  const { fetch, calls } = fakeFetch(fast);
  globalThis.fetch = fetch;
  const started = Date.now();
  const first = await fetchOsmChunk(bbox);
  assert.ok(Date.now() - started < 2000, 'answered without waiting for the hanging mirrors');
  assert.equal(first.buildings.length, 1);
  assert.equal(overpassState().preferred, fast);
  assert.equal(calls.length, 4, 'all four mirrors were raced the first time');

  const again = await fetchOsmChunk(bbox);
  assert.equal(again.buildings.length, 1);
  assert.equal(calls.length, 4, 'the same chunk again comes from the local cache, no request at all');

  const second = await fetchOsmChunk({ ...bbox, minLat: 59.02, maxLat: 59.04 });
  assert.equal(second.buildings.length, 1);
  assert.equal(calls.length, 5, 'a new chunk went to the remembered mirror only');
  assert.equal(calls[4], fast);
  assert.deepEqual(overpassState().down, [], 'losers cancelled by the winner are not marked down');
});
