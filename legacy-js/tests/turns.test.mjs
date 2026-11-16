import test from 'node:test';
import assert from 'node:assert/strict';
import { findTurns, nextTurn, roundedDistance, turnAngle } from '../src/turns.js';

/** A polyline sampled every 2 m: straight 300 m north (+z), a 90° left bend, 200 m west, a hairpin right, back east. */
function course() {
  const pts = [];
  let x = 0, z = 0, yaw = 0, s = 0;
  const push = () => pts.push({ x, z, s });
  const step = (n, dyaw = 0) => {
    for (let i = 0; i < n; i++) {
      yaw += dyaw;
      x += Math.sin(yaw) * 2; z += Math.cos(yaw) * 2; s += 2; // the car's forward(): left is +x when heading +z
      push();
    }
  };
  push();
  step(150);                       // 300 m straight
  step(20, (Math.PI / 2) / 20);    // 90° left over 40 m
  step(100);                       // 200 m straight
  step(16, -Math.PI / 16);         // 180° right over 32 m
  step(100);
  return pts;
}

test('a left bend has a positive angle in the car\'s yaw sense', () => {
  assert.ok(turnAngle({ x: 0, z: 1 }, { x: 1, z: 1 }) > 0, 'heading +z then bending to +x is left (screen-right is world -x)');
  assert.ok(turnAngle({ x: 0, z: 1 }, { x: -1, z: 1 }) < 0, 'bending to -x is right');
});

test('findTurns picks the two bends, their direction and severity', () => {
  const turns = findTurns(course());
  assert.equal(turns.length, 2, JSON.stringify(turns));
  const [left, right] = turns;
  assert.ok(left.angle > 60 && left.angle < 120, `left bend ~90°: ${left.angle}`);
  assert.equal(left.severity, 'medium');
  assert.ok(Math.abs(left.entry - 300) < 20, `left bend starts near 300 m: ${left.entry}`);
  assert.ok(right.angle < -150, `hairpin ~180° to the right: ${right.angle}`);
  assert.equal(right.severity, 'hairpin');
});

test('nextTurn and roundedDistance give the HUD its note', () => {
  const turns = findTurns(course());
  const first = nextTurn(turns, 0);
  assert.equal(first, turns[0]);
  assert.equal(roundedDistance(first, 0), 300);
  assert.equal(roundedDistance(first, 160), 150, '140 m rounds to 150');
  assert.equal(roundedDistance(first, 290), 0, 'inside the entry: 0');
  assert.equal(nextTurn(turns, 350), turns[1], 'past the first bend the hairpin is next');
  assert.equal(nextTurn(turns, 0, { ahead: 100 }), null, 'nothing within 100 m');
  assert.equal(nextTurn(turns, 10000), null, 'nothing after the finish');
});
