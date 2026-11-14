import * as THREE from 'three';
import { clamp, lerp, smoothstep } from './geo.js';
import { terrainColor } from './terrain.js';

/**
 * The engineered road corridor: a terrace cut through the DTM.
 *
 * A real road is a graded strip, not a bump smoothed into the hillside. The
 * ground inside the *cut-through* (16 m wide for a two-lane road, 6 m for a
 * single-lane one) is reshaped: flat from shoulder to shoulder at the graded
 * road height, then blending out to the natural ground at the cut-through
 * edge, smooth along the road because the edge heights are smoothed along
 * the road too. Outside the cut-through the DTM is untouched (a short
 * feather hides the step). Three things evaluate the same profile so they
 * agree to the centimetre:
 *
 *   - the coarse chunk heights and the 1 m tiles are carved to it (minus a
 *     small margin outside the shoulder so they stay hidden under the fine
 *     corridor mesh),
 *   - a 1 m corridor mesh along the road draws the terrace,
 *   - the car's `groundAt()` evaluates it for its wheels.
 */

export const SHOULDER = 1.0;          // flat shoulder beyond the carriageway's half width
export const RIBBON_SHOULDER = SHOULDER; // the road ribbon (stage.js) covers the shoulder too
export const FEATHER = 1.5;           // metres beyond the cut-through edge to meet the untouched ground
export const CARVE_MARGIN = 0.3;      // coarse heights sit this far under the fine terrace
export const ROAD_LIFT = 0.12;        // carriageway sits a hair above the carved ground
export const ASPHALT_HEX = 0x4b4d4f;  // colour of the carved road band in the ground meshes (matches the ribbon)
export const GRAVEL_HEX = 0x7d7769;
/** Road classes: carriageway half width and cut-through half width (metres). */
export const LANES = {
  two: { half: 3.5, cut: 8 },    // normal two-lane road: 7 m + 1 m shoulders, 16 m cut-through
  one: { half: 1.5, cut: 3 },    // single lane: 3 m + 1 m shoulders, 6 m cut-through
};

/** Half width of the flat part: carriageway plus shoulder. */
export function flatHalf(half) {
  return half + SHOULDER;
}

/** How far from the centre line the profile can differ from the ground. */
export function corridorReach(half, cut = null) {
  return Math.max(cut ?? 0, flatHalf(half)) + FEATHER;
}

/**
 * Height of the terrace at lateral distance `d` from the centre line.
 * `roadY` is the carriageway height, `ground` the natural ground at the
 * point and `edge` the (along-road smoothed) natural ground at the
 * cut-through edge on this side; without it the blend goes to `ground`.
 */
export function profileHeight(roadY, ground, d, half, cut = null, edge = null) {
  const flat = flatHalf(half);
  if (d <= flat) return roadY;
  const cutHalf = Math.max(cut ?? 0, flat);
  const rim = edge ?? ground;
  if (d < cutHalf) return lerp(roadY, rim, smoothstep((d - flat) / Math.max(1e-6, cutHalf - flat)));
  if (d < cutHalf + FEATHER) return lerp(rim, ground, (d - cutHalf) / FEATHER);
  return ground;
}

/** Road height interpolated along a segment of samples (`roadY` or `y`). */
export function segmentRoadY(a, b, t) {
  return lerp(a.roadY ?? a.y, b.roadY ?? b.y, t);
}

/**
 * Natural ground at both cut-through edges of every sample, smoothed along
 * the road (`edgeL` on the side of the left normal (-tz, tx), `edgeR` on the
 * other), so the terrace rims run smoothly instead of copying every bump.
 */
export function assignEdgeHeights(samples, cut, groundAt, { window = 30 } = {}) {
  const n = samples.length;
  if (n < 2) return samples;
  const left = new Float64Array(n);
  const right = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const p = samples[i];
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(n - 1, i + 1)];
    let tx = next.x - prev.x;
    let tz = next.z - prev.z;
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl; tz /= tl;
    const nx = -tz;
    const nz = tx;
    left[i] = groundAt(p.x + nx * cut, p.z + nz * cut);
    right[i] = groundAt(p.x - nx * cut, p.z - nz * cut);
  }
  const spacing = meanSpacing(samples);
  const sl = smoothRoadHeights(left, spacing, { window, passes: 2 });
  const sr = smoothRoadHeights(right, spacing, { window, passes: 2 });
  for (let i = 0; i < n; i++) { samples[i].edgeL = sl[i]; samples[i].edgeR = sr[i]; }
  return samples;
}

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

/**
 * Carve polylines into a height grid from its untouched `base` heights.
 * `grid` = { heights, base, x0, z0, cell, n }; `lines` = [{ half, samples }].
 * Nearest segment wins. Returns the number of cells changed.
 */
export function carveProfile(grid, lines, { lift = ROAD_LIFT } = {}) {
  const { heights, base, x0, z0, cell, n, roadMask = null } = grid;
  const bestD = new Float32Array(heights.length).fill(Infinity);
  const target = new Float32Array(heights.length);
  const kind = new Uint8Array(roadMask ? heights.length : 0); // 1 feather, 2 gravel road, 3 asphalt road, 4 terrace
  for (const line of lines) {
    if (!line || !line.samples || line.samples.length < 2) continue;
    const half = line.half ?? line.roadWidth;
    const cut = line.cut ?? flatHalf(half);
    const reach = corridorReach(half, cut);
    const flat = flatHalf(half);
    const cutHalf = Math.max(cut, flat);
    const s = line.samples;
    for (let k = 0; k + 1 < s.length; k++) {
      const a = s[k];
      const b = s[k + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      const len2 = len * len || 1;
      const nx = len > 1e-6 ? -dz / len : 0;
      const nz = len > 1e-6 ? dx / len : 1;
      const gi0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - reach - x0) / cell) - 1);
      const gi1 = Math.min(n - 1, Math.ceil((Math.max(a.x, b.x) + reach - x0) / cell) + 1);
      const gj0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - reach - z0) / cell) - 1);
      const gj1 = Math.min(n - 1, Math.ceil((Math.max(a.z, b.z) + reach - z0) / cell) + 1);
      for (let j = gj0; j <= gj1; j++) {
        const z = z0 + j * cell;
        for (let i = gi0; i <= gi1; i++) {
          const x = x0 + i * cell;
          const t = clamp(((x - a.x) * dx + (z - a.z) * dz) / len2, 0, 1);
          const cx = a.x + dx * t;
          const cz = a.z + dz * t;
          const d = Math.hypot(x - cx, z - cz);
          const idx = j * n + i;
          if (d > reach || d >= bestD[idx]) continue;
          const ground = base[idx];
          const roadY = segmentRoadY(a, b, t) + lift;
          const leftSide = (x - cx) * nx + (z - cz) * nz >= 0;
          const ea = leftSide ? a.edgeL : a.edgeR;
          const eb = leftSide ? b.edgeL : b.edgeR;
          const edge = ea != null && eb != null ? lerp(ea, eb, t) : null;
          let y = profileHeight(roadY, ground, d, half, cut, edge);
          if (d > flat && Math.abs(y - ground) > 1e-3) y -= CARVE_MARGIN;
          bestD[idx] = d;
          target[idx] = y;
          if (roadMask) kind[idx] = d <= flat ? (line.surface === 'asphalt' ? 3 : 2) : d < cutHalf ? 4 : 1;
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
      out.push({
        x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, roadY: segmentRoadY(a, b, t),
        edgeL: a.edgeL != null && b.edgeL != null ? lerp(a.edgeL, b.edgeL, t) : null,
        edgeR: a.edgeR != null && b.edgeR != null ? lerp(a.edgeR, b.edgeR, t) : null,
      });
      t += step / len;
    }
    carry = (t - 1) * len;
  }
  const last = samples[samples.length - 1];
  const tail = out[out.length - 1];
  if (!tail || Math.hypot(tail.x - last.x, tail.z - last.z) > 1e-3) {
    out.push({ x: last.x, z: last.z, roadY: last.roadY ?? last.y, edgeL: last.edgeL ?? null, edgeR: last.edgeR ?? null });
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
  // One surface per place: the ribbon draws the carriageway and the shoulder,
  // so the corridor mesh starts where the ribbon ends and covers the terrace
  // out to the cut-through edge plus the feather — two strips, nothing
  // under the road.
  const cols = (half, cut) => {
    const edge = half + RIBBON_SHOULDER;
    const reach = corridorReach(half, cut);
    const step = reach - edge > 6 ? 1 : 0.5;
    const side = [];
    for (let d = edge; d < reach; d += step) side.push(d);
    side.push(reach);
    return [...side.map((d) => -d).reverse(), ...side];
  };
  let total = 0;
  for (const l of usable) total += (l.length ?? polylineLength(l.samples)) * cols(l.half ?? l.roadWidth, l.cut).length;
  const step = Math.max(1, Math.ceil(total / maxVertices));

  const positions = [];
  const colors = [];
  const index = [];
  const color = new THREE.Color();
  for (const line of usable) {
    const half = line.half ?? line.roadWidth;
    const cut = line.cut ?? flatHalf(half);
    const shoulder = flatHalf(half);
    const cutHalf = Math.max(cut, shoulder);
    const offsets = cols(half, cut);
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
        const edge = off >= 0 ? p.edgeL : p.edgeR;
        const y = profileHeight(roadY, ground, d, half, cut, edge);
        positions.push(x, y + (d <= shoulder ? 0.02 : 0.04), z);
        const diff = y - ground;
        if (d <= shoulder) color.copy(EARTH);
        else if (d < cutHalf && diff < -0.6) color.copy((i + offsets.indexOf(off)) % 3 ? ROCK : ROCK_DARK); // cutting face
        else if (d < cutHalf && diff > 0.4) color.copy(EARTH).multiplyScalar(0.9 + 0.1 * ((i % 4) / 3)); // embankment
        else {
          const slope = Math.abs(profileHeight(roadY, sampleBase(x + nx, z + nz), d + 1, half, cut, edge) - y);
          terrainColor(y, slope, x, z, color);
          if (d >= cutHalf) tint?.(x, z, color); // natural ground keeps its land cover; the terrace is bare
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
