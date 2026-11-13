import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRoomCode, normaliseCode, encodeState, GhostTrack, Session, spawnOffset, paintForSlot, PLAYER_COLORS } from '../src/multiplayer.js';
import { Car } from '../src/car.js';
import * as THREE from 'three';

test('room codes avoid ambiguous characters and normalise user input', () => {
  for (let i = 0; i < 50; i++) assert.match(makeRoomCode(), /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  assert.equal(normaliseCode(' ab-c0 '), 'ABCO');
  assert.equal(normaliseCode('x1yz'), 'XIYZ');
});

test('state packets are compact and ghosts interpolate between them', () => {
  const car = { pos: { x: 100.123, y: 50.5, z: -20 }, yaw: 1.5, pitch: 0.1, bodyPitch: 0.02, roll: -0.05, bodyRoll: 0, speed: 22.26 };
  const s = encodeState(car, { name: 'ELG-42', kind: 'buggy' });
  assert.ok(JSON.stringify(s).length < 120);
  assert.equal(s.k, 'buggy');
  const track = new GhostTrack({ delay: 100 });
  track.push({ ...s, x: 0, h: 0 }, 1000);
  track.push({ ...s, x: 10, h: 0.2 }, 1100);
  track.push({ ...s, x: 20, h: 0.4 }, 1200);
  const mid = track.sample(1250); // renders at t = 1150: halfway between the first two
  assert.ok(Math.abs(mid.x - 15) < 1e-9 && Math.abs(mid.yaw - 0.3) < 1e-9);
  assert.equal(track.sample(1500).x, 20, 'holds the newest packet');
  assert.equal(track.name, 'ELG-42');
});

test('session relays guest state and routes without a network (fake connections)', () => {
  const host = new Session({ name: 'HOST' });
  host.isHost = true;
  const sent = { a: [], b: [] };
  const fake = (id) => ({ peer: id, open: true, metadata: { name: id.toUpperCase(), kind: 'porsche' }, send: (m) => sent[id].push(m), handlers: {}, on(ev, fn) { this.handlers[ev] = fn; } });
  const a = fake('a'); const b = fake('b');
  host.acceptGuest(a); a.handlers.open();
  host.sendRoute({ kind: 'baked', points: [[0, 0], [1, 1]] });
  host.acceptGuest(b); b.handlers.open();
  assert.equal(host.playerCount, 3);
  assert.ok(sent.b.some((m) => m.t === 'route'), 'late joiner receives the current stage');
  assert.ok(sent.a.some((m) => m.t === 'join' && m.id === 'b'), 'existing guests learn about newcomers');
  const states = [];
  host.addEventListener('state', (e) => states.push(e.detail));
  a.handlers.data({ t: 's', x: 1, y: 2, z: 3, h: 0, p: 0, r: 0, v: 5, k: 'porsche', n: 'A' });
  assert.equal(states.length, 1);
  assert.ok(sent.b.some((m) => m.t === 's' && m.from === 'a'), 'state is fanned out to the other guest');
  assert.ok(!sent.a.some((m) => m.t === 's'), 'not echoed back to its sender');
  b.handlers.close();
  assert.equal(host.playerCount, 2);
  assert.ok(sent.a.some((m) => m.t === 'leave' && m.id === 'b'));
});

test('starting grid keeps every player apart and on the road', () => {
  const seen = new Set();
  for (let slot = 0; slot < 8; slot++) {
    const { back, side } = spawnOffset(slot);
    assert.ok(Math.abs(side) <= 1.8, 'inside a 3.2 m half-width road');
    const key = `${back}:${side}`;
    assert.ok(!seen.has(key), `slot ${slot} collides`);
    seen.add(key);
  }
  assert.deepEqual(spawnOffset(0), { back: 0, side: 0 });
  assert.deepEqual(spawnOffset(1), { back: 6, side: 1.7 });
  assert.deepEqual(spawnOffset(2), { back: 6, side: -1.7 });
  assert.deepEqual(spawnOffset(3), { back: 12, side: 1.7 });
});

test('joiners get a grid slot and learn everyone else\'s', () => {
  const host = new Session({ name: 'HOST' });
  host.isHost = true;
  const sent = { a: [], b: [] };
  const fake = (id) => ({ peer: id, open: true, metadata: { name: id, kind: 'porsche' }, send: (m) => sent[id].push(m), handlers: {}, on(ev, fn) { this.handlers[ev] = fn; } });
  const a = fake('a'); const b = fake('b');
  host.acceptGuest(a); a.handlers.open();
  host.acceptGuest(b); b.handlers.open();
  const helloA = sent.a.find((m) => m.t === 'hello');
  const helloB = sent.b.find((m) => m.t === 'hello');
  assert.equal(helloA.slot, 1);
  assert.equal(helloB.slot, 2);
  assert.deepEqual(helloB.peers.map((p) => [p.id, p.slot]), [['a', 1]]);
  // A guest session applying hello/join learns the full grid.
  const guest = new Session({ name: 'C' });
  guest.onGuestData({ t: 'hello', slot: 3, host: { name: 'HOST', kind: 'porsche', slot: 0 }, peers: [{ id: 'a', name: 'a', kind: 'porsche', slot: 1 }] });
  guest.onGuestData({ t: 'join', id: 'b', name: 'b', kind: 'buggy', slot: 2 });
  assert.equal(guest.slot, 3);
  assert.deepEqual([...guest.peers.entries()].map(([id, p]) => [id, p.slot]), [['host', 0], ['a', 1], ['b', 2]]);
});

test('every room slot gets its own paint and the cars repaint body and roof', () => {
  assert.equal(new Set(PLAYER_COLORS).size, PLAYER_COLORS.length);
  assert.equal(paintForSlot(0), PLAYER_COLORS[0]);
  assert.equal(paintForSlot(9), PLAYER_COLORS[1]);
  const terrain = { sample: () => 0, sampleBase: () => 0, gradient: () => ({ gx: 0, gz: 0 }), slope: () => 0, inside: () => true };
  for (const kind of ['porsche', 'buggy']) {
    const car = new Car({ add() {}, remove() {} }, terrain, kind);
    car.setPaint(0x2f6fd6);
    assert.equal(car.paintMaterials[0].color.getHex(), 0x2f6fd6, `${kind} body repainted`);
    if (kind === 'porsche') {
      assert.ok(car.paintedVerts.length > 50, 'roof skin vertices found');
      const i = car.paintedVerts[0];
      const linearBlue = new THREE.Color(0x2f6fd6).b; // vertex colours live in the working colour space
      assert.ok(Math.abs(car.roofColors.getZ(i) - linearBlue) < 1e-3, 'roof repainted');
    }
    car.setPaint(null);
    assert.equal(car.paintMaterials[0].color.getHex(), car.spec.paint, `${kind} back to its own colour`);
  }
});
