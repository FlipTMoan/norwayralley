import test from 'node:test';
import assert from 'node:assert/strict';
import { shareParams, shareUrl, parseShare } from '../src/share.js';

test('a drive becomes a short link and the link parses back', () => {
  const geometry = { coordinates: [{ lat: 59.02504, lon: 6.05002 }, { lat: 59.1, lon: 6.2 }, { lat: 59.12345678, lon: 6.23456789 }] };
  const loc = { href: 'https://fliptmoan.github.io/norwayralley/?debug=1' };
  const url = shareUrl({ kind: 'osrm', geometry }, { profile: 'foot' }, loc);
  assert.equal(url, 'https://fliptmoan.github.io/norwayralley/?route=osrm%3A59.02504%2C6.05002%3B59.12346%2C6.23457%3Bfoot');
  assert.deepEqual(parseShare(new URL(url).search), { kind: 'osrm', a: { lat: 59.02504, lon: 6.05002 }, b: { lat: 59.12346, lon: 6.23457 }, profile: 'foot' });
  assert.deepEqual(shareParams({ kind: 'free', center: { lat: 61.65, lon: 10.1 } }), { drive: '61.65,10.1' });
  assert.deepEqual(parseShare('?drive=61.65,10.1'), { kind: 'free', center: { lat: 61.65, lon: 10.1 } });
  assert.deepEqual(parseShare('?route=demo:58.98293,6.17898;58.98861,6.19175'), { kind: 'demo', a: { lat: 58.98293, lon: 6.17898 }, b: { lat: 58.98861, lon: 6.19175 } });
});

test('bad or missing parameters are ignored', () => {
  assert.equal(parseShare(''), null);
  assert.equal(parseShare('?route=osrm:1,2'), null);
  assert.equal(parseShare('?route=magic:1,2;3,4'), null);
  assert.equal(parseShare('?drive=95,10'), null);
  assert.equal(shareParams(null), null);
  assert.equal(shareParams({ kind: 'baked', points: [] }), null);
});
