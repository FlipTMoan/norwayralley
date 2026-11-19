import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { smoothRoadHeights, meanSpacing } from '../src/corridor.js';

/** Ground along a road: a 2 % climb with 1 m bumps every 40 m and a few sharp 10 m knobs. */
function ground(n, spacing) {
  return Array.from({ length: n }, (_, i) => {
    const s = i * spacing;
    return 100 + 0.02 * s + 1.0 * Math.sin((2 * Math.PI * s) / 40) + (i % 37 === 0 ? 2.5 : 0);
  });
}

test('road grade irons out short bumps but keeps the hill', () => {
  const spacing = 5;
  const raw = ground(400, spacing);
  const road = smoothRoadHeights(raw, spacing);
  // Residual short-wave bumpiness: second difference per metre.
  let worstRaw = 0;
  let worstRoad = 0;
  for (let i = 1; i < raw.length - 1; i++) {
    worstRaw = Math.max(worstRaw, Math.abs(raw[i + 1] - 2 * raw[i] + raw[i - 1]) / spacing);
    worstRoad = Math.max(worstRoad, Math.abs(road[i + 1] - 2 * road[i] + road[i - 1]) / spacing);
  }
  assert.ok(worstRoad < worstRaw * 0.1, `curvature ${worstRaw.toFixed(3)} → ${worstRoad.toFixed(3)} per m`);
  // The 2 % grade survives over the middle kilometre.
  const grade = (road[300] - road[100]) / (200 * spacing);
  assert.ok(Math.abs(grade - 0.02) < 0.002, `grade ${grade.toFixed(4)}`);
  // The road never strays far from the ground it is graded over.
  let worstGap = 0;
  for (let i = 0; i < raw.length; i++) worstGap = Math.max(worstGap, Math.abs(road[i] - raw[i]));
  assert.ok(worstGap < 4, `gap ${worstGap.toFixed(2)} m`);
});

test('meanSpacing measures the polyline step', () => {
  const pts = [{ x: 0, z: 0 }, { x: 3, z: 4 }, { x: 6, z: 8 }];
  assert.equal(meanSpacing(pts), 5);
  assert.equal(meanSpacing([{ x: 0, z: 0 }]), 1);
});

test('grading by distance: uneven samples (fine in bends) grade like even ones', () => {
  const ground = (s) => 100 + 0.03 * s + 1.5 * Math.sin(s / 25);
  const even = Array.from({ length: 201 }, (_, i) => i * 5);
  // Same road, sampled 1 m apart in a stretch and 5 m elsewhere.
  const uneven = [];
  for (let s = 0; s <= 1000; s += s >= 300 && s < 400 ? 1 : 5) uneven.push(s);
  const a = smoothRoadHeights(even.map(ground), 5, { s: even });
  const b = smoothRoadHeights(uneven.map(ground), 5, { s: uneven });
  let worst = 0;
  uneven.forEach((s, i) => { if (s % 5 === 0 && s > 100 && s < 900) worst = Math.max(worst, Math.abs(b[i] - a[s / 5])); });
  assert.ok(worst < 0.1, `uneven sampling shifts the grade by ${worst.toFixed(3)} m`);
  // Index-based windows would shrink in the fine stretch: show that the option matters.
  const byIndex = smoothRoadHeights(uneven.map(ground), meanSpacing(uneven.map((s) => ({ x: s, z: 0 }))));
  let indexWorst = 0;
  uneven.forEach((s, i) => { if (s % 5 === 0 && s > 100 && s < 900) indexWorst = Math.max(indexWorst, Math.abs(byIndex[i] - a[s / 5])); });
  assert.ok(indexWorst > worst * 3, `index windows ${indexWorst.toFixed(3)} vs distance windows ${worst.toFixed(3)}`);
});
