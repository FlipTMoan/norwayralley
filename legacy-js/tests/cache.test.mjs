import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCache, memoryBackend, sizeOf } from '../src/cache.js';

test('a hit never calls the loader again and parallel asks share one load', async () => {
  const c = createCache(memoryBackend());
  let loads = 0;
  const loader = async () => { loads++; return { answer: 42 }; };
  const [a, b] = await Promise.all([c.fetch('k', loader), c.fetch('k', loader)]);
  assert.deepEqual(a, { answer: 42 });
  assert.deepEqual(b, { answer: 42 });
  assert.equal(loads, 1);
  await c.fetch('k', loader);
  assert.equal(loads, 1, 'served from the cache');
});

test('entries beyond the budget are evicted oldest first', async () => {
  let t = 0;
  const c = createCache(memoryBackend(), { budget: 2500, now: () => (t += 61000) });
  const buf = (n) => new ArrayBuffer(n);
  await c.fetch('a', async () => buf(1000), { kind: 'dem' });
  await c.fetch('b', async () => buf(1000), { kind: 'dem' });
  await c.fetch('a', async () => buf(1), { kind: 'dem' }); // touch a (now newer than b)
  await c.fetch('c', async () => buf(1000), { kind: 'dem' });
  await new Promise((r) => setTimeout(r, 10)); // eviction runs after the write
  const s = await c.stats();
  assert.ok(s.bytes <= 2500, `bytes ${s.bytes}`);
  assert.equal(s.entries, 2);
  let loads = 0;
  await c.fetch('b', async () => { loads++; return buf(1); }, { kind: 'dem' });
  assert.equal(loads, 1, 'b (the oldest) was the one evicted');
});

test('failures are not cached and sizes are measured per type', async () => {
  const c = createCache(memoryBackend());
  await assert.rejects(c.fetch('x', async () => { throw new Error('down'); }));
  let loads = 0;
  await c.fetch('x', async () => { loads++; return 'ok'; });
  assert.equal(loads, 1);
  assert.equal(sizeOf(new ArrayBuffer(12)), 12);
  assert.equal(sizeOf('abc'), 6);
  assert.equal(sizeOf({ a: 1 }), 14);
  assert.equal(sizeOf(null), 0);
});

test('the budget is 32 GB at most and keeps 10 % of the browser quota free', async () => {
  const { budgetFor, MAX_BUDGET } = await import('../src/cache.js');
  const GB = 1024 ** 3;
  assert.equal(budgetFor(null, 0), MAX_BUDGET, 'unknown room keeps the cap');
  assert.equal(budgetFor({ quota: 600 * GB, usage: GB }, GB), MAX_BUDGET, 'a big quota is capped at 32 GB');
  assert.equal(budgetFor({ quota: 20 * GB, usage: 3 * GB }, 2 * GB), 17 * GB, '18 GB usable minus 1 GB of other data');
  assert.equal(budgetFor({ quota: 5 * GB, usage: 6 * GB }, GB), 0, 'other data alone exceeds 90 %: nothing may be cached');
});

test('refreshBudget evicts when the quota shrank', async () => {
  let quota = 10000;
  const backend = memoryBackend();
  const c = createCache(backend, { estimate: async () => ({ quota, usage: 4000 }) });
  for (let i = 0; i < 4; i++) await c.fetch(`k${i}`, async () => new Uint8Array(1000).buffer, { kind: 'dem' });
  assert.equal(await c.refreshBudget(), 9000, '90 % of 10 000, all data is ours');
  quota = 3500;
  assert.equal(await c.refreshBudget(), 3150);
  assert.equal((await backend.listByAge()).length, 3, 'the oldest entry went to stay under 90 % of the quota');
});
