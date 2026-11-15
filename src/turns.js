/**
 * Pace notes from the stage line: where the road bends, which way and how
 * hard, so the HUD can show an arrow and the distance to the next turn.
 *
 * The heading change is measured between the chord `look` metres behind a
 * sample and the chord `look` metres ahead of it; a run of samples bending
 * the same way by at least `minAngle` is one turn. Its angle is the total
 * heading change over the run, positive to the left (the car's yaw sense).
 */

const LOOK = 12;       // metres of chord either side of a sample
const MIN_ANGLE = 20;  // degrees across the chords before a bend counts as a turn
const DEG = 180 / Math.PI;

function indexAt(samples, s, from, step) {
  let i = from;
  while (i + step >= 0 && i + step < samples.length && Math.abs(samples[i + step].s - samples[from].s) < s) i += step;
  return i;
}

function heading(a, b) {
  return { x: b.x - a.x, z: b.z - a.z };
}

/**
 * Signed heading change in degrees from direction u to v, positive to the left.
 * The chase camera looks along +Z with screen-right at world -X, so a turn
 * from +Z towards +X is a left turn (the same sense as the car's yaw).
 */
export function turnAngle(u, v) {
  const cross = u.z * v.x - u.x * v.z;
  const dot = u.x * v.x + u.z * v.z;
  return Math.atan2(cross, dot) * DEG;
}

/** The turns along a stage: `[{ s, entry, exit, angle, severity }]` with distances in metres along the route. */
export function findTurns(samples, { look = LOOK, minAngle = MIN_ANGLE } = {}) {
  if (!samples || samples.length < 3) return [];
  const local = new Array(samples.length).fill(0);
  for (let i = 1; i < samples.length - 1; i++) {
    const back = indexAt(samples, look, i, -1);
    const ahead = indexAt(samples, look, i, 1);
    if (back === i || ahead === i) continue;
    local[i] = turnAngle(heading(samples[back], samples[i]), heading(samples[i], samples[ahead]));
  }
  const turns = [];
  let i = 0;
  while (i < samples.length) {
    if (Math.abs(local[i]) < minAngle) { i++; continue; }
    const sign = Math.sign(local[i]);
    let j = i;
    let apex = i;
    while (j + 1 < samples.length && Math.sign(local[j + 1]) === sign && Math.abs(local[j + 1]) >= minAngle) {
      j++;
      if (Math.abs(local[j]) > Math.abs(local[apex])) apex = j;
    }
    const back = indexAt(samples, look, i, -1);
    const ahead = indexAt(samples, look, j, 1);
    const angle = turnAngle(heading(samples[back], samples[i]), heading(samples[j], samples[ahead]));
    const abs = Math.abs(angle);
    turns.push({
      s: samples[apex].s,
      entry: samples[i].s,
      exit: samples[j].s,
      angle,
      severity: abs < 45 ? 'slight' : abs < 100 ? 'medium' : 'hairpin',
    });
    i = j + 1;
  }
  return turns;
}

/** The next turn ahead of distance `s` along the route, or null when none lies within `ahead` metres. */
export function nextTurn(turns, s, { ahead = 1000 } = {}) {
  for (const turn of turns) {
    if (turn.exit < s) continue;
    if (turn.entry - s > ahead) return null;
    return turn;
  }
  return null;
}

/** Distance to a turn's entry rounded to 50 m steps; 0 once the car is in it. */
export function roundedDistance(turn, s) {
  const d = Math.max(0, turn.entry - s);
  return Math.round(d / 50) * 50;
}
