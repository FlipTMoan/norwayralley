import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRoomCode, normaliseCode, encodeState, GhostTrack, Session } from '../src/multiplayer.js';

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
