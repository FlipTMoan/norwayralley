import * as THREE from 'three';
import { clamp, lerp, smoothstep } from './geo.js';
import { ROAD_LIFT, SHOULDER } from './corridor.js';
import { SEA_LEVEL, pointInRing, riverWidth } from './water.js';

/**
 * Bridges where roads cross water.
 *
 * A road sample is on a bridge when its OSM way is tagged `bridge=*` (not
 * `no`, not `culvert`), or — for untagged data and the OSRM stage road —
 * when the road crosses water (OSM lake / river or the sea) for at least
 * `MIN_SPAN` metres with water on both sides and the DTM at water level
 * (a road on a causeway stands on higher ground and stays a road). The
 * water core is widened by one sample at each end so the span runs from
 * bank to bank (the abutments).
 *
 * Over a span the road is graded as if the gap were filled between the
 * banks, then the deck gets a gentle arch and, when it would pass too close
 * to the water, is lifted with ramps either side. The terrain under a span
 * is never carved (corridor.js skips segments whose ends are both bridge
 * samples), the deck is drawn here (slab, guard rails, piers), the rails and
 * piers are solid for the car, and the car rides on the deck (car.js).
 */

export const MIN_SPAN = 6;            // metres of water before an untagged crossing becomes a bridge
export const WATER_CLEARANCE = 2.5;   // deck above the water (DTM) under it
export const DRY_CLEARANCE = 0.8;     // deck above dry ground under it
export const DECK_THICKNESS = 0.9;
export const DECK_CATCH = 1.0;        // a car more than this below the deck is under the bridge, not on it
export const RAIL_OUT = 0.35;         // guard rail beyond the ribbon edge
const RAIL_HEIGHT = 0.85;
const PIER_SPACING = 30;

/** True when OSM tags make a way a bridge (`bridge=yes|viaduct|…`, not `no` / `culvert`, not a tunnel). */
export function isBridgeTag(tags) {
  const b = tags?.bridge;
  if (!b || b === 'no' || b === 'culvert') return false;
  return !tags.tunnel || tags.tunnel === 'no';
}

/** Half width of a bridge deck (carriageway + shoulder + rail) for a carriageway half width. */
export function deckHalf(half) {
  return half + SHOULDER + RAIL_OUT;
}

/* ------------------------------------------------------------------ *
 *  Water probe                                                         *
 * ------------------------------------------------------------------ */

/**
 * `wet(x, z)` for one chunk's OSM water (lakes, rivers, canals) and the sea
 * (DTM at 0). `features` = `{ waterways, areas }` as fetchOsmChunk returns
 * them, `project(lat, lon)` → world `{x, z}`, `ground(x, z)` the natural
 * ground. Overpass returns whole ways, so water crossing a chunk border is
 * known to both chunks.
 */
export function waterProbe({ waterways = [], areas = [] } = {}, project, ground) {
  const lakes = [];
  for (const a of areas) {
    if (a.kind !== 'water' || !a.rings?.length) continue;
    const ring = a.rings[0].map((p) => project(p.lat, p.lon));
    if (ring.length < 3) continue;
    let minX = Infinity; let maxX = -Infinity; let minZ = Infinity; let maxZ = -Infinity;
    for (const p of ring) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
    lakes.push({ ring, minX, maxX, minZ, maxZ });
  }
  // River segments in 32 m buckets (a chunk can hold hundreds of them).
  const CELL = 32;
  const buckets = new Map();
  for (const w of waterways) {
    if (!w.points || w.points.length < 2) continue;
    const half = riverWidth(w) / 2;
    const pts = w.points.map((p) => project(p.lat, p.lon));
    for (let i = 0; i + 1 < pts.length; i++) {
      const seg = { ax: pts[i].x, az: pts[i].z, bx: pts[i + 1].x, bz: pts[i + 1].z, half };
      const i0 = Math.floor((Math.min(seg.ax, seg.bx) - half) / CELL); const i1 = Math.floor((Math.max(seg.ax, seg.bx) + half) / CELL);
      const j0 = Math.floor((Math.min(seg.az, seg.bz) - half) / CELL); const j1 = Math.floor((Math.max(seg.az, seg.bz) + half) / CELL);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const k = `${i},${j}`;
        let list = buckets.get(k);
        if (!list) buckets.set(k, (list = []));
        list.push(seg);
      }
    }
  }
  return (x, z) => {
    if (ground && ground(x, z) < 0.1) return true; // the sea
    for (const l of lakes) {
      if (x >= l.minX && x <= l.maxX && z >= l.minZ && z <= l.maxZ && pointInRing(x, z, l.ring)) return true;
    }
    const list = buckets.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`);
    if (list) {
      for (const s of list) {
        const dx = s.bx - s.ax; const dz = s.bz - s.az;
        const t = clamp(((x - s.ax) * dx + (z - s.az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
        if (Math.hypot(x - (s.ax + dx * t), z - (s.az + dz * t)) <= s.half) return true;
      }
    }
    return false;
  };
}

/* ------------------------------------------------------------------ *
 *  Detection                                                           *
 * ------------------------------------------------------------------ */

/**
 * Samples (`{x, z, s}`) where the road crosses water: a boolean per sample.
 * The line is walked in 1 m steps; a step is wet when the centre and both
 * probes `lateral` metres to the sides are wet and the DTM at the centre is
 * no higher than the lower side + 1.5 m (a causeway is land). Wet stretches
 * shorter than `minSpan` (culverts, ditches, streams) stay road. Sets
 * `p.wet` on every sample whose centre is wet (for the deck clearance).
 */
export function wetCore(samples, wet, { lateral = 12, minSpan = MIN_SPAN, ground = null } = {}) {
  const n = samples.length;
  const core = new Array(n).fill(false);
  if (n < 2 || !wet) return core;
  for (const p of samples) p.wet = wet(p.x, p.z);
  // Only look closely around wet samples (the common case is no water at all).
  let any = false;
  for (const p of samples) if (p.wet) { any = true; break; }
  if (!any) return core;
  const intervals = [];
  let open = null;
  for (let k = 0; k + 1 < n; k++) {
    const a = samples[k];
    const b = samples[k + 1];
    if (!a.wet && !b.wet && !(samples[k - 1]?.wet) && !(samples[k + 2]?.wet)) {
      if (open) { intervals.push(open); open = null; }
      continue;
    }
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (len < 1e-6) continue;
    const tx = (b.x - a.x) / len; const tz = (b.z - a.z) / len;
    const sa = a.s ?? 0;
    for (let d = 0; d < len; d += 1) {
      const x = a.x + tx * d; const z = a.z + tz * d;
      let w = wet(x, z) && wet(x - tz * lateral, z + tx * lateral) && wet(x + tz * lateral, z - tx * lateral);
      if (w && ground) {
        const side = Math.min(ground(x - tz * lateral, z + tx * lateral), ground(x + tz * lateral, z - tx * lateral));
        w = ground(x, z) <= side + 1.5;
      }
      const s = sa + d;
      if (w) { if (open && s - open.b <= 4) open.b = s; else { if (open) intervals.push(open); open = { a: s, b: s }; } }
    }
  }
  if (open) intervals.push(open);
  for (const iv of intervals) {
    if (iv.b - iv.a + 1 < minSpan) continue;
    for (let i = 0; i < n; i++) if (samples[i].s >= iv.a - 1 && samples[i].s <= iv.b + 1) core[i] = true;
  }
  return core;
}

/**
 * Turn a per-sample core (tag or water) into bridge spans: each run of core
 * samples is widened by one sample at both ends (the abutments), runs one
 * sample apart merge. Sets `p.bridge` (and clears it elsewhere) and `p.pier`
 * on the samples that carry a pier (every ~30 m on spans over 24 m, away
 * from the ends). Returns `[{ i0, i1 }]`.
 */
export function markBridgeSpans(samples, core) {
  const n = samples.length;
  const flag = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    if (!core[i]) continue;
    for (let k = Math.max(0, i - 1); k <= Math.min(n - 1, i + 1); k++) flag[k] = true;
  }
  for (let i = 1; i + 1 < n; i++) if (!flag[i] && flag[i - 1] && flag[i + 1]) flag[i] = true;
  const spans = [];
  for (let i = 0; i < n; i++) {
    samples[i].bridge = flag[i];
    samples[i].pier = false;
    if (flag[i] && (i === 0 || !flag[i - 1])) spans.push({ i0: i, i1: i });
    if (flag[i]) spans[spans.length - 1].i1 = i;
  }
  const out = spans.filter((sp) => sp.i1 > sp.i0);
  for (let i = 0; i < n; i++) if (samples[i].bridge && !out.some((sp) => i >= sp.i0 && i <= sp.i1)) samples[i].bridge = false;
  for (const sp of out) {
    const s0 = samples[sp.i0].s;
    const L = samples[sp.i1].s - s0;
    if (L <= 24) continue;
    const count = Math.floor(L / PIER_SPACING);
    for (let k = 1; k <= Math.max(1, count); k++) {
      const target = s0 + (L * k) / (Math.max(1, count) + 1);
      let best = sp.i0; let bestD = Infinity;
      for (let i = sp.i0 + 1; i < sp.i1; i++) {
        const d = Math.abs(samples[i].s - target);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best > sp.i0 && best < sp.i1) samples[best].pier = true;
    }
  }
  return out;
}

/** Spans `[{ i0, i1 }]` of samples already flagged `bridge`. */
export function bridgeSpans(samples) {
  const spans = [];
  for (let i = 0; i < samples.length; i++) {
    if (!samples[i].bridge) continue;
    if (i > 0 && samples[i - 1].bridge) spans[spans.length - 1].i1 = i;
    else spans.push({ i0: i, i1: i });
  }
  return spans.filter((sp) => sp.i1 > sp.i0);
}

/* ------------------------------------------------------------------ *
 *  Road profile                                                        *
 * ------------------------------------------------------------------ */

/**
 * The raw ground along the road with every bridge span replaced by a straight
 * line between the ground at its two ends, so the grade (smoothRoadHeights)
 * runs bank to bank instead of dipping into the river valley.
 */
export function bridgeRaw(raw, samples) {
  const out = Float64Array.from(raw);
  for (const { i0, i1 } of bridgeSpans(samples)) {
    const s0 = samples[i0].s; const L = Math.max(1e-6, samples[i1].s - s0);
    for (let i = i0 + 1; i < i1; i++) out[i] = lerp(raw[i0], raw[i1], (samples[i].s - s0) / L);
  }
  return out;
}

/**
 * Shape the graded `roadY` over each bridge span: a straight line between the
 * abutment heights plus a gentle arch (2 % of the span, at most 1 m), lifted
 * when needed so the deck clears the water (`WATER_CLEARANCE`) or dry ground
 * (`DRY_CLEARANCE`) under every sample; the lift ramps out over 15–90 m
 * (≈ 3 % grade) either side and tapers to nothing at the line's own ends, so
 * a bridge that is its own OSM way still meets the roads at its ends. The
 * deck itself is a cubic between the abutments that leaves each one at the
 * grade of the road beyond it, plus an arch that starts level: no kink. `ground(x, z)`
 * is the natural ground; `p.wet` marks samples over water.
 */
export function applyBridgeProfile(samples, ground) {
  const n = samples.length;
  if (n < 2) return samples;
  const total = samples[n - 1].s - samples[0].s;
  const endWeight = (i, ramp) => {
    const d = Math.min(samples[i].s - samples[0].s, total - (samples[i].s - samples[0].s));
    return smoothstep(clamp(d / ramp, 0, 1));
  };
  for (const { i0, i1 } of bridgeSpans(samples)) {
    const s0 = samples[i0].s;
    const L = Math.max(1e-6, samples[i1].s - s0);
    const y0 = samples[i0].roadY;
    const y1 = samples[i1].roadY;
    // End grades of the road either side, so the deck leaves the approach
    // without a kink (cubic Hermite between the abutments).
    const chord = (y1 - y0) / L;
    const m0 = i0 > 0 ? (y0 - samples[i0 - 1].roadY) / Math.max(1e-6, samples[i0].s - samples[i0 - 1].s) : chord;
    const m1 = i1 + 1 < samples.length ? (samples[i1 + 1].roadY - y1) / Math.max(1e-6, samples[i1 + 1].s - samples[i1].s) : chord;
    const arch = Math.min(1, 0.02 * L);
    let need = 0;
    for (let i = i0; i <= i1; i++) {
      const p = samples[i];
      const t = (p.s - s0) / L;
      const t2 = t * t; const t3 = t2 * t;
      const hermite = (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * L * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * L * m1;
      p.roadY = hermite + arch * 16 * t2 * (1 - t) * (1 - t); // the arch starts level at both ends
      if (i === i0 || i === i1) continue; // the abutments stand on the bank
      const g = ground(p.x, p.z);
      const req = p.wet ? Math.max(g, SEA_LEVEL) + WATER_CLEARANCE : g + DRY_CLEARANCE;
      need = Math.max(need, req - p.roadY);
    }
    if (need <= 1e-3) continue;
    // About 3 % at most; on a bridge that is its own way (ends held at the
    // roads it joins) the lift spreads over up to half the line, a long low
    // hump rather than a kicker.
    const ramp = clamp(need * 30, 15, 90);
    const endRamp = Math.min(ramp, Math.max(15, total / 2));
    for (let i = 0; i < n; i++) {
      const p = samples[i];
      const off = p.s < s0 ? s0 - p.s : p.s > samples[i1].s ? p.s - samples[i1].s : 0;
      if (off >= ramp) continue;
      const w = (off > 0 ? smoothstep(1 - off / ramp) : 1) * endWeight(i, endRamp);
      p.roadY += need * w;
    }
  }
  return samples;
}

/* ------------------------------------------------------------------ *
 *  Geometry and collision                                              *
 * ------------------------------------------------------------------ */

const CONCRETE = new THREE.Color(0x8d8a82);
const CONCRETE_DARK = new THREE.Color(0x5f5d58);
const RAIL = new THREE.Color(0xc4c7c6);
const POST = new THREE.Color(0x77797a);

function pushBox(buf, cx, cy, cz, tx, tz, hl, hw, hh, color, under = null) {
  // Oriented box: length along (tx, tz), width along the left normal.
  const nx = -tz; const nz = tx;
  const base = buf.positions.length / 3;
  for (const [a, b, c] of [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) {
    buf.positions.push(cx + tx * hl * a + nx * hw * c, cy + hh * b, cz + tz * hl * a + nz * hw * c);
    const col = b < 0 && under ? under : color;
    buf.colors.push(col.r, col.g, col.b);
  }
  for (const [a, b, c, d] of [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]]) {
    buf.indices.push(base + a, base + b, base + c, base + a, base + c, base + d);
  }
}

/**
 * Deck slab, guard rails and piers for the bridge spans of road lines
 * (`[{ samples, half }]`, samples flagged by `markBridgeSpans`), merged into
 * one geometry. `ground(x, z)` is the natural ground the piers stand on.
 * Returns `{ geometry, boxes }` (`boxes` are oriented footprints with a
 * height band `y0..y1`, for the car's wall test), or null without bridges.
 */
export function buildBridgeParts(lines, ground) {
  const buf = { positions: [], colors: [], indices: [] };
  const boxes = [];
  for (const line of lines) {
    const s = line.samples;
    if (!s || s.length < 2) continue;
    const half = line.half ?? line.roadWidth;
    const W = deckHalf(half);
    for (const { i0, i1 } of bridgeSpans(s)) {
      // Deck: one cross-section ring (top L/R, bottom R/L) per sample.
      const ring0 = buf.positions.length / 3;
      for (let i = i0; i <= i1; i++) {
        const p = s[i];
        const a = s[Math.max(i0, i - 1)]; const b = s[Math.min(i1, i + 1)];
        const tl = Math.hypot(b.x - a.x, b.z - a.z) || 1;
        const nx = -(b.z - a.z) / tl; const nz = (b.x - a.x) / tl;
        const top = p.roadY + ROAD_LIFT;
        const tilt = (p.bank || 0) * W;
        for (const [side, y0, col] of [[1, top, CONCRETE], [-1, top, CONCRETE], [-1, top - DECK_THICKNESS, CONCRETE_DARK], [1, top - DECK_THICKNESS, CONCRETE_DARK]]) {
          const y = y0 + tilt * side;
          buf.positions.push(p.x + nx * W * side, y, p.z + nz * W * side);
          buf.colors.push(col.r, col.g, col.b);
        }
      }
      for (let k = 0; k < i1 - i0; k++) {
        const a = ring0 + k * 4; const b = a + 4;
        for (let e = 0; e < 4; e++) {
          const e2 = (e + 1) % 4;
          buf.indices.push(a + e, b + e, b + e2, a + e, b + e2, a + e2);
        }
      }
      // End caps.
      const last = ring0 + (i1 - i0) * 4;
      buf.indices.push(ring0, ring0 + 2, ring0 + 1, ring0, ring0 + 3, ring0 + 2);
      buf.indices.push(last, last + 1, last + 2, last, last + 2, last + 3);

      // Guard rails (a beam per segment and side), posts every other sample, solid for the car.
      for (let i = i0; i < i1; i++) {
        const a = s[i]; const b = s[i + 1];
        const len = Math.hypot(b.x - a.x, b.z - a.z);
        if (len < 1e-3) continue;
        const tx = (b.x - a.x) / len; const tz = (b.z - a.z) / len;
        const nx = -tz; const nz = tx;
        const top = (a.roadY + b.roadY) / 2 + ROAD_LIFT;
        const mx = (a.x + b.x) / 2; const mz = (a.z + b.z) / 2;
        for (const side of [1, -1]) {
          const ox = mx + nx * (W - 0.12) * side; const oz = mz + nz * (W - 0.12) * side;
          pushBox(buf, ox, top + RAIL_HEIGHT - 0.15, oz, tx, tz, len / 2 + 0.02, 0.06, 0.15, RAIL);
          const px = a.x + nx * (W - 0.12) * side; const pz = a.z + nz * (W - 0.12) * side;
          pushBox(buf, px, a.roadY + ROAD_LIFT + RAIL_HEIGHT / 2, pz, tx, tz, 0.07, 0.07, RAIL_HEIGHT / 2, POST);
          boxes.push({ x: ox, z: oz, yaw: Math.atan2(-tz, tx), hl: len / 2 + 0.3, hw: 0.15, y0: top - DECK_CATCH, y1: top + 1.6 });
        }
      }
      // Piers (and the two abutment walls) down to the ground.
      for (let i = i0; i <= i1; i++) {
        const p = s[i];
        const end = i === i0 || i === i1;
        if (!p.pier && !end) continue;
        const a = s[Math.max(i0, i - 1)]; const b = s[Math.min(i1, i + 1)];
        const tl = Math.hypot(b.x - a.x, b.z - a.z) || 1;
        const tx = (b.x - a.x) / tl; const tz = (b.z - a.z) / tl;
        const bottom = p.roadY + ROAD_LIFT - DECK_THICKNESS;
        const g = Math.min(ground(p.x, p.z), ground(p.x - tz * W, p.z + tx * W), ground(p.x + tz * W, p.z - tx * W)) - 1;
        if (bottom - g < 0.3) continue;
        const hw = end ? W : W * 0.55;
        pushBox(buf, p.x, (bottom + g) / 2, p.z, tx, tz, end ? 0.5 : 0.7, hw, (bottom - g) / 2, CONCRETE, CONCRETE_DARK);
        if (!end) boxes.push({ x: p.x, z: p.z, yaw: Math.atan2(-tz, tx), hl: 0.7, hw, y0: g, y1: bottom });
      }
    }
  }
  if (!buf.positions.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(buf.positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(buf.colors, 3));
  geometry.setIndex(buf.indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return { geometry, boxes };
}

let bridgeMaterial = null;
/** One mesh (one draw call) for a set of bridges; `userData.boxes` for the car. */
export function buildBridgeMesh(lines, ground) {
  const parts = buildBridgeParts(lines, ground);
  if (!parts) return null;
  bridgeMaterial ||= new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(parts.geometry, bridgeMaterial);
  mesh.name = 'bridges';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.boxes = parts.boxes;
  return mesh;
}
