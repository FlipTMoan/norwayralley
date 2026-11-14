import * as THREE from 'three';
import { clamp, lerp } from './geo.js';
import { terrainColor } from './terrain.js';

/**
 * The engineered road corridor.
 *
 * A real road is not a bump smoothed into the hillside: it is a flat
 * carriageway with a shoulder, carried on an embankment (fill) where the
 * ground is lower and dug into a cutting where the ground is higher. This
 * module defines that cross-section analytically, so three things can agree
 * to the centimetre:
 *
 *   - the coarse terrain heights are carved to the profile (minus a small
 *     margin outside the shoulder so they stay hidden under the fine mesh),
 *   - a 1 m corridor mesh along the road draws the embankments and cuttings,
 *   - the car's `groundAt()` evaluates the same profile for its wheels.
 */

export const FILL_SLOPE = 1.5;    // metres of run per metre of drop on an embankment
export const CUT_SLOPE = 1.0;     // cuttings stand steeper
export const RIBBON_SHOULDER = 0.9; // the road ribbon (stage.js) covers this far beyond the half width
export const SHOULDER = RIBBON_SHOULDER; // the flat cut-out band ends exactly where the ribbon ends
// Standard road: 2.1 m half width + 0.9 m shoulders = a 6 m wide flat cut-out.
export const ROAD_HALF_STANDARD = 2.1;
export const CUTOUT_WIDTH = 2 * (ROAD_HALF_STANDARD + SHOULDER);
export const MAX_REACH = 24;      // slopes taller than this just end in a face
export const CARVE_MARGIN = 0.3;  // coarse heights sit this far under the fine slopes
export const ROAD_LIFT = 0.12;    // carriageway sits a hair above the carved ground
export const ASPHALT_HEX = 0x4b4d4f; // colour of the carved road band in the ground meshes (matches the ribbon)
export const GRAVEL_HEX = 0x7d7769;

/**
 * Road grade: a real road is graded, it does not copy every bump of the
 * ground under it. Three passes of a ±`window` metre (60 m) running mean (close to
 * a Gaussian of σ ≈ window) over the raw ground heights along the line; the
 * embankments and cuttings of the profile make up the difference. Returns a
 * Float64Array of road heights, one per sample.
 */
export function smoothRoadHeights(raw, spacing, { window = 60, passes = 3 } = {}) {
  const n = raw.length;
  const k = Math.max(1, Math.round(window / Math.max(0.5, spacing)));
  let cur = Float64Array.from(raw);
  for (let p = 0; p < passes; p++) {
    const prefix = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + cur[i];
    const next = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - k);
      const b = Math.min(n - 1, i + k);
      next[i] = (prefix[b + 1] - prefix[a]) / (b - a + 1);
    }
    cur = next;
  }
  return cur;
}

/** Mean spacing of a sample polyline (metres). */
export function meanSpacing(samples) {
  if (samples.length < 2) return 1;
  let s = 0;
  for (let i = 1; i < samples.length; i++) s += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z);
  return s / (samples.length - 1);
}

/** How far from the centre line the profile can differ from the ground. */
export function corridorReach(half) {
  return half + SHOULDER + MAX_REACH;
}

/**
 * Height of the profile at lateral distance `d` from the centre line.
 * `roadY` is the carriageway height, `ground` the natural ground at the point.
 */
export function profileHeight(roadY, ground, d, half) {
  const shoulder = half + SHOULDER;
  if (d <= shoulder) return roadY;
  const run = d - shoulder;
  const reach = MAX_REACH;
  if (run >= reach) return ground;
  let y;
  if (ground < roadY) y = Math.max(ground, roadY - run / FILL_SLOPE);
  else y = Math.min(ground, roadY + run / CUT_SLOPE);
  // Feather the last three metres so a tall face does not end in a step.
  const fade = clamp((run - (reach - 3)) / 3, 0, 1);
  return lerp(y, ground, fade);
}

/** Road height interpolated along a segment of samples (`roadY` or `y`). */
export function segmentRoadY(a, b, t) {
  return lerp(a.roadY ?? a.y, b.roadY ?? b.y, t);
}

/**
 * Carve polylines into a height grid from its untouched `base` heights.
 * `grid` = { heights, base, x0, z0, cell, n }; `lines` = [{ half, samples }].
 * Nearest segment wins. Returns the number of cells changed.
 */
export function carveProfile(grid, lines, { lift = ROAD_LIFT } = {}) {
  const { heights, base, x0, z0, cell, n, roadMask = null } = grid;
  const bestD = new Float32Array(heights.length).fill(Infinity);
  const target = new Float32Array(heights.length);
  const kind = new Uint8Array(roadMask ? heights.length : 0); // 1 slope, 2 gravel road, 3 asphalt road
  for (const line of lines) {
    if (!line || !line.samples || line.samples.length < 2) continue;
    const half = line.half ?? line.roadWidth;
    const reach = corridorReach(half);
    const shoulder = half + SHOULDER;
    const s = line.samples;
    for (let k = 0; k + 1 < s.length; k++) {
      const a = s[k];
      const b = s[k + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len2 = dx * dx + dz * dz || 1;
      const gi0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - reach - x0) / cell) - 1);
      const gi1 = Math.min(n - 1, Math.ceil((Math.max(a.x, b.x) + reach - x0) / cell) + 1);
      const gj0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - reach - z0) / cell) - 1);
      const gj1 = Math.min(n - 1, Math.ceil((Math.max(a.z, b.z) + reach - z0) / cell) + 1);
      for (let j = gj0; j <= gj1; j++) {
        const z = z0 + j * cell;
        for (let i = gi0; i <= gi1; i++) {
          const x = x0 + i * cell;
          const t = clamp(((x - a.x) * dx + (z - a.z) * dz) / len2, 0, 1);
          const d = Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
          const idx = j * n + i;
          if (d > reach || d >= bestD[idx]) continue;
          const ground = base[idx];
          const roadY = segmentRoadY(a, b, t) + lift;
          let y = profileHeight(roadY, ground, d, half);
          if (d > shoulder && Math.abs(y - ground) > 1e-3) y -= CARVE_MARGIN;
          bestD[idx] = d;
          target[idx] = y;
          if (roadMask) kind[idx] = d <= shoulder ? (line.surface === 'asphalt' ? 3 : 2) : 1;
        }
      }
    }
  }
  let touched = 0;
  for (let idx = 0; idx < heights.length; idx++) {
    if (!Number.isFinite(bestD[idx])) continue;
    if (heights[idx] !== target[idx]) touched++;
    heights[idx] = target[idx];
    if (roadMask) roadMask[idx] = kind[idx];
  }
  return touched;
}

/** Resample a line to `step` metres with interpolated road heights. */
function stations(samples, step) {
  const out = [];
  let carry = 0;
  for (let k = 0; k + 1 < samples.length; k++) {
    const a = samples[k];
    const b = samples[k + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (len < 1e-6) continue;
    let t = carry / len;
    while (t <= 1) {
      out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, roadY: segmentRoadY(a, b, t) });
      t += step / len;
    }
    carry = (t - 1) * len;
  }
  const last = samples[samples.length - 1];
  const tail = out[out.length - 1];
  if (!tail || Math.hypot(tail.x - last.x, tail.z - last.z) > 1e-3) {
    out.push({ x: last.x, z: last.z, roadY: last.roadY ?? last.y });
  }
  return out;
}

const EARTH = new THREE.Color(0x6e665a);
const ROCK = new THREE.Color(0x6b6a66);
const ROCK_DARK = new THREE.Color(0x56554f);

/**
 * Build the 1 m corridor mesh for one or more road lines.
 * `sampleBase(x, z)` is the natural ground, `tint(x, z, color)` an optional
 * land-cover tint. A vertex budget widens the station step on long roads.
 */
export function buildCorridorGeometry(lines, { sampleBase, tint = null, lift = ROAD_LIFT, maxVertices = 160000 } = {}) {
  const usable = lines.filter((l) => l && l.samples && l.samples.length >= 2);
  if (!usable.length) return null;
  // One surface per place: the ribbon draws the carriageway and its own
  // shoulder, so the corridor only starts where the ribbon ends and covers
  // the slopes outward — two strips, nothing under the road.
  const cols = (half) => {
    const edge = half + RIBBON_SHOULDER;
    const reach = corridorReach(half);
    const side = [];
    for (let d = edge; d <= edge + 8; d += 1) side.push(d);
    for (let d = edge + 10; d < reach; d += 2) side.push(d);
    side.push(reach);
    return [...side.map((d) => -d).reverse(), ...side];
  };
  let total = 0;
  for (const l of usable) total += (l.length ?? polylineLength(l.samples)) * cols(l.half ?? l.roadWidth).length;
  const step = Math.max(1, Math.ceil(total / maxVertices));

  const positions = [];
  const colors = [];
  const index = [];
  const color = new THREE.Color();
  for (const line of usable) {
    const half = line.half ?? line.roadWidth;
    const shoulder = half + SHOULDER;
    const offsets = cols(half);
    const st = stations(line.samples, step);
    if (st.length < 2) continue;
    let lastT = [0, 1];
    const baseVertex = positions.length / 3;
    for (let i = 0; i < st.length; i++) {
      const p = st[i];
      const prev = st[Math.max(0, i - 1)];
      const next = st[Math.min(st.length - 1, i + 1)];
      let tx = next.x - prev.x;
      let tz = next.z - prev.z;
      const tl = Math.hypot(tx, tz);
      if (tl > 1e-6) { tx /= tl; tz /= tl; lastT = [tx, tz]; } else { [tx, tz] = lastT; }
      const nx = -tz;
      const nz = tx;
      const roadY = p.roadY + lift;
      for (const off of offsets) {
        const d = Math.abs(off);
        const x = p.x + nx * off;
        const z = p.z + nz * off;
        const ground = sampleBase(x, z);
        const y = profileHeight(roadY, ground, d, half);
        positions.push(x, y + (d <= shoulder ? 0.02 : 0.04), z);
        const diff = y - ground;
        if (d <= shoulder) color.copy(EARTH);
        else if (diff < -0.6) color.copy((i + offsets.indexOf(off)) % 3 ? ROCK : ROCK_DARK); // cutting face
        else if (diff > 0.4) color.copy(EARTH).multiplyScalar(0.9 + 0.1 * ((i % 4) / 3)); // embankment
        else {
          const slope = Math.abs((profileHeight(roadY, sampleBase(x + nx, z + nz), d + 1, half) - y));
          terrainColor(y, slope, x, z, color);
          tint?.(x, z, color);
        }
        colors.push(color.r, color.g, color.b);
      }
    }
    const nc = offsets.length;
    for (let i = 0; i + 1 < st.length; i++) {
      for (let c = 0; c + 1 < nc; c++) {
        if (offsets[c] < 0 && offsets[c + 1] > 0) continue; // the gap under the ribbon
        const a = baseVertex + i * nc + c;
        const b = a + 1;
        const cc = a + nc;
        const dd = cc + 1;
        index.push(a, cc, b, b, cc, dd);
      }
    }
  }
  if (!positions.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function polylineLength(samples) {
  let s = 0;
  for (let i = 1; i < samples.length; i++) s += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z);
  return s;
}

let corridorMaterial = null;
export function corridorMesh(geometry) {
  if (!geometry) return null;
  corridorMaterial ||= new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(geometry, corridorMaterial);
  mesh.name = 'roadCorridor';
  mesh.receiveShadow = true;
  return mesh;
}
