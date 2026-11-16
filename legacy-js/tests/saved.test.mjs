import test from 'node:test';
import assert from 'node:assert/strict';
import { listRoutes, saveRoute, deleteRoute, cleanName, describeSaved } from '../src/saved.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const osrm = { kind: 'osrm', geometry: { distance: 4210, coordinates: [{ lat: 59, lon: 6 }, { lat: 59.01, lon: 6.02 }] } };

test('routes are saved by name, newest first, and replaced on the same name', () => {
  const store = memory();
  assert.ok(saveRoute('  Home   run ', osrm, store, 1000));
  assert.ok(saveRoute('Fjord', { kind: 'free', center: { lat: 60, lon: 7 } }, store, 2000));
  assert.deepEqual(listRoutes(store).map((r) => r.name), ['Fjord', 'Home run']);
  saveRoute('home RUN', { kind: 'baked', name: 'Preikestolen Climb', points: [[0, 0], [1, 1], [2, 2]] }, store, 3000);
  const list = listRoutes(store);
  assert.equal(list.length, 2);
  assert.equal(list[0].name, 'home RUN');
  assert.equal(list[0].route.kind, 'baked');
});

test('empty names and missing routes are refused; delete removes by name', () => {
  const store = memory();
  assert.equal(saveRoute('   ', osrm, store), null);
  assert.equal(saveRoute('x', null, store), null);
  saveRoute('A', osrm, store, 1);
  assert.equal(deleteRoute('a', store), true);
  assert.equal(deleteRoute('a', store), false);
  assert.deepEqual(listRoutes(store), []);
});

test('a corrupt list reads as empty and names are capped', () => {
  const store = memory();
  store.setItem('rally.routes', '{not json');
  assert.deepEqual(listRoutes(store), []);
  assert.equal(cleanName('x'.repeat(60)).length, 40);
  assert.equal(describeSaved({ route: osrm }), '4.2 km road');
  assert.equal(describeSaved({ route: { kind: 'free' } }), 'free drive');
});
