import * as THREE from 'three';
import { clamp, lerp, smoothstep, utmForward, utmInverse, splinePolyline } from './geo.js';
import { buildRibbon } from './stage.js';
import { carveProfile, smoothRoadHeights, assignEdgeHeights, LANES, SHOULDER } from './corridor.js';
import { wetCore, markBridgeSpans, bridgeRaw, applyBridgeProfile, buildBridgeMesh } from './bridges.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cachedJson } from './cache.js';

/**
 * Real roads from OpenStreetMap for the streamed world.
 *
 * Every chunk's Overpass answer carries the `highway=*` centre lines that
 * cross it. They become: a carve into the chunk's height field (the same
 * ruled-surface carve the stage road gets), a ribbon mesh (tarmac or gravel
 * by class / `surface=*`), and segments in a spatial index (`RoadNetwork`)
 * that the car, the trees, the houses and the road signs query for "how far
 * is the nearest road". In free-drive mode the network *is* the route: the
 * car rides on whatever road it finds and chunks keep streaming in ahead.
 */

/** Half width in metres per OSM highway class. */
const ROAD_KINDS = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service', 'track']);
const TWO_LANE_KINDS = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary']);

/**
 * Two-lane or single-lane: OSM `lanes` when tagged, else by class (the
 * numbered road network is two-lane, everything smaller single-lane).
 * Returns `{ half, cut }` from `LANES`, or null for a kind the game ignores.
 */
export function laneSpec(road) {
  if (!ROAD_KINDS.has(road.kind)) return null;
  const lanes = Number(road.lanes);
  const two = lanes >= 2 || (!(lanes >= 1) && TWO_LANE_KINDS.has(road.kind));
  return two ? LANES.two : LANES.one;
}
/** Carriageway half width by class, for callers that only have the kind. */
export const ROAD_HALF = new Proxy({}, { get: (_, kind) => laneSpec({ kind })?.half });
const UNPAVED = /^(gravel|unpaved|dirt|ground|compacted|fine_gravel|earth|grass|sand|mud|pebblestone)$/;

export function isPaved(road) {
  if (road.surface) return !UNPAVED.test(road.surface);
  return road.kind !== 'track';
}

/** Rank of a road class at junctions: the higher road keeps its profile, the lower one ramps onto it. */
export const ROAD_RANK = { motorway: 9, trunk: 8, primary: 7, secondary: 6, tertiary: 5, unclassified: 4, residential: 3, living_street: 2, service: 1, track: 0 };
export const STAGE_RANK = 100; // the stage road outranks every OSM road

/** Does road `a` (`{ rank, id }`) win over road `b` where they meet? Higher rank, then the lower OSM id. */
export function outranks(a, b) {
  if (a.rank !== b.rank) return a.rank > b.rank;
  return (a.id ?? Infinity) < (b.id ?? Infinity);
}

const GRADE_STEP = 5;       // metres between grading samples on a straight
const RAMP_STEP = 2;        // sample spacing inside junction ramps (metres)
const RAMP_GRADE = 0.03;    // a junction ramp adds at most ~4.5 % (smoothstep peak 1.5 × this)

/** Distance along a sample list, stored as `p.s`. */
function measure(samples) {
  let along = 0;
  samples.forEach((p, i) => { if (i) along += Math.hypot(p.x - samples[i - 1].x, p.z - samples[i - 1].z); p.s = along; });
  return along;
}

/**
 * Project, spline and grade a chunk's OSM roads, settle their junctions, and
 * clip them to the chunk.
 *
 *  - Plan: a centripetal Catmull-Rom spline through every OSM node (junction
 *    nodes are kept exactly), sampled ≤ 5 m apart and ≤ 3° of heading per
 *    sample; where a way continues in another way of the answer the spline
 *    runs on through the joint with one tangent.
 *  - Height: the whole way is graded (±60 m running mean, by distance) on the
 *    coarse ground, so every chunk computes the same profile; bridge spans
 *    are graded bank to bank (bridges.js). Copies of a way that another chunk
 *    already graded take those heights (`terrain.roadHeights`).
 *  - Junctions: ways are settled in rank order (`ROAD_RANK`, the stage road
 *    `main` above all). Where a way runs inside the flat band of a road that
 *    outranks it, it takes that road's surface plane — height and crossfall
 *    (`bank`, metres per metre to the left) — and ramps back to its own grade
 *    either side, so roads meet on one shared surface without a step. A road
 *    and a bridge more than 3 m apart in height pass over each other.
 *
 * Samples closer than `avoid.distance` to `avoid.index` (the stage route) and
 * running along it are cut out (the OSRM stage road's OSM twin). `wet(x, z)`
 * finds untagged water crossings; `main(x, z)` answers the stage road like
 * `RoadNetwork.nearest` (with `rank`).
 */
export function prepareChunkRoads(roads, terrain, { x0, z0, size }, { avoid = null, pad = 60, wet = null, main = null } = {}) {
  const minX = x0 - pad;
  const maxX = x0 + size + pad;
  const minZ = z0 - pad;
  const maxZ = z0 + size + pad;
  const inside = (p) => p.x >= minX && p.x <= maxX && p.z >= minZ && p.z <= maxZ;
  // Way ends by node, to run the spline on through a joint of two ways.
  const nodeKey = (p) => `${p.lat.toFixed(7)},${p.lon.toFixed(7)}`;
  const endsAt = new Map();
  for (const road of roads || []) {
    if (!laneSpec(road) || road.points.length < 2) continue;
    for (const [i, j] of [[0, 1], [road.points.length - 1, road.points.length - 2]]) {
      const k = nodeKey(road.points[i]);
      if (!endsAt.has(k)) endsAt.set(k, []);
      endsAt.get(k).push({ road, next: road.points[j] });
    }
  }
  const beyondJoint = (road, end) => {
    const list = endsAt.get(nodeKey(end));
    if (!list || list.length !== 2) return null; // a plain joint of two ways, not a junction
    const other = list.find((e) => e.road !== road);
    return other ? terrain.worldFromLatLon(other.next.lat, other.next.lon) : null;
  };
  const ground = terrain.sampleBaseCoarse || terrain.sampleBase || terrain.sample;
  const groundAt = (x, z) => ground.call(terrain, x, z);
  const registry = terrain.roadHeights;
  const ways = [];
  for (const road of roads || []) {
    const spec = laneSpec(road);
    if (!spec) continue;
    const { half, cut } = spec;
    const raw = road.points.map((p) => terrain.worldFromLatLon(p.lat, p.lon));
    if (!raw.some(inside)) continue;
    const samples = splinePolyline(raw, {
      before: beyondJoint(road, road.points[0]),
      after: beyondJoint(road, road.points[road.points.length - 1]),
    });
    if (samples.length < 2) continue;
    const total = measure(samples);
    // Bridges: a tagged way end to end, else wherever it crosses water.
    const core = road.bridge ? samples.map(() => true) : wetCore(samples, wet, { lateral: cut + 4, ground: groundAt });
    if (road.bridge && wet) for (const p of samples) p.wet = wet(p.x, p.z);
    markBridgeSpans(samples, core);
    // Grade the whole way before clipping it to the chunk, on the coarse
    // ground only, by distance along it. A bridge is usually its own short
    // way: it is graded with 60 m of the ground straight on beyond both ends,
    // as the roads it joins are, or its ends would sit in the valley.
    const graded = bridgeRaw(samples.map((p) => groundAt(p.x, p.z)), samples);
    const ext = road.bridge ? 12 : 0;
    const n = samples.length;
    const beyond = (p, q) => {
      const l = Math.hypot(p.x - q.x, p.z - q.z) || 1;
      return Array.from({ length: ext }, (_, k) => groundAt(p.x + ((p.x - q.x) / l) * GRADE_STEP * (k + 1), p.z + ((p.z - q.z) / l) * GRADE_STEP * (k + 1)));
    };
    const sAll = [
      ...Array.from({ length: ext }, (_, k) => -GRADE_STEP * (ext - k)),
      ...samples.map((p) => p.s),
      ...Array.from({ length: ext }, (_, k) => total + GRADE_STEP * (k + 1)),
    ];
    const smooth = smoothRoadHeights([...beyond(samples[0], samples[1]).reverse(), ...graded, ...beyond(samples[n - 1], samples[n - 2])], GRADE_STEP, { s: sAll }).slice(ext, ext + n);
    samples.forEach((p, i) => { p.roadY = smooth[i]; p.bank = 0; });
    applyBridgeProfile(samples, groundAt);
    // Rim heights: another road's surface where one lies at the cut-through
    // edge (a junction or a parallel road), the natural ground otherwise.
    const net = terrain.roads;
    const rimGround = (x, z) => {
      if (net?.nearest) {
        const q = net.nearest(x, z, 10);
        if (q.roadY != null && !q.bridge && q.id !== road.id && q.distance <= (q.width ?? 0) + SHOULDER) return q.roadY;
      }
      return groundAt(x, z);
    };
    assignEdgeHeights(samples, cut, rimGround);
    // The graded profile (before junctions) this way was already given by
    // another chunk wins, keyed by sample position to half a metre, so every
    // copy agrees; new stretches are eased onto the known ones over 150 m.
    if (registry && road.id != null) {
      const posKey = (p) => `${Math.round(p.x * 2)}:${Math.round(p.z * 2)}`;
      const known = registry.get(road.id);
      if (known) {
        const kn = samples.map((p) => known.get(posKey(p)) || null);
        const FADE = 150;
        const eased = samples.map((p) => ({ y: p.roadY, l: p.edgeL, r: p.edgeR }));
        for (let i = 0; i < n; i++) {
          if (kn[i]) continue;
          let k = -1;
          for (let lo = i - 1, hi = i + 1; lo >= 0 || hi < n; lo--, hi++) {
            const dl = lo >= 0 ? samples[i].s - samples[lo].s : Infinity;
            const dh = hi < n ? samples[hi].s - samples[i].s : Infinity;
            if (Math.min(dl, dh) > FADE) break;
            if (lo >= 0 && kn[lo] && dl <= FADE) { k = lo; break; }
            if (hi < n && kn[hi] && dh <= FADE) { k = hi; break; }
          }
          if (k >= 0) {
            const w = 1 - Math.abs(samples[i].s - samples[k].s) / FADE;
            eased[i].y += (kn[k].y - samples[k].roadY) * w;
            eased[i].l += (kn[k].l - samples[k].edgeL) * w;
            eased[i].r += (kn[k].r - samples[k].edgeR) * w;
          }
        }
        for (let i = 0; i < n; i++) {
          const p = samples[i];
          if (kn[i]) { p.roadY = kn[i].y; p.edgeL = kn[i].l; p.edgeR = kn[i].r; p.bridge = kn[i].b; p.pier = kn[i].p; } else { p.roadY = eased[i].y; p.edgeL = eased[i].l; p.edgeR = eased[i].r; }
        }
      }
      const store = known || new Map();
      for (const p of samples) {
        const key = posKey(p);
        if (!store.has(key)) store.set(key, { y: p.roadY, l: p.edgeL, r: p.edgeR, b: Boolean(p.bridge), p: Boolean(p.pier) });
      }
      registry.set(road.id, store);
    }
    ways.push({ road, half, cut, rank: ROAD_RANK[road.kind] ?? 0, id: road.id ?? null, nodes: nodesOf(road), samples });
  }

  // Junctions, highest road first: each way settles onto the roads that
  // outrank it — the stage road, ways of other chunks already in the network,
  // and the ways of this chunk settled before it.
  ways.sort((a, b) => (outranks(a, b) ? -1 : outranks(b, a) ? 1 : 0));
  const local = new RoadNetwork();
  const sources = [local, terrain.roads].filter((x) => x?.nearest);
  for (const w of ways) {
    settleJunctions(w, sources, main);
    local.addLines('chunk', [{ id: w.id, rank: w.rank, half: w.half, cut: w.cut, nodes: w.nodes, samples: w.samples }]);
  }

  // Split into runs that are inside the padded chunk and away from the route.
  const out = [];
  for (const { road, half, cut, samples } of ways) {
    let run = [];
    const flush = () => {
      if (run.length >= 3) out.push(finishRun(run, road, half, cut));
      run = [];
    };
    for (let i = 0; i < samples.length; i++) {
      const p = samples[i];
      let keep = inside(p);
      if (keep && avoid) {
        // Cut the OSM twin of the stage road (it runs along it); a road that
        // crosses the stage keeps going.
        const q = avoid.index.nearest ? avoid.index.nearest(p.x, p.z, avoid.distance + 1) : { distance: avoid.index.distanceTo(p.x, p.z, avoid.distance + 1), tangent: null };
        if (q.distance < avoid.distance) {
          if (!q.tangent) keep = false;
          else {
            const a = samples[Math.max(0, i - 1)];
            const b = samples[Math.min(samples.length - 1, i + 1)];
            const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
            const dot = Math.abs(((b.x - a.x) / l) * q.tangent.x + ((b.z - a.z) / l) * q.tangent.z);
            keep = dot < 0.7; // crossing (≳45°) stays, parallel goes
          }
        }
      }
      if (keep) run.push(p); else flush();
    }
    flush();
  }
  return out;
}

/**
 * Settle one way (`{ samples, rank, id }`) onto the roads that outrank it.
 * A sample inside such a road's flat band (carriageway + shoulder) takes the
 * height of that road's surface plane at the sample, and the plane's slope
 * across this way as its crossfall `bank`. Either side, the way leaves along
 * the plane's slope and eases back onto its own grade with a smoothstep over
 * 20–100 m (≈ 3 % extra grade at most), so height and grade are continuous:
 * no step, no kink. The ramps are resampled every metre so the car feels a
 * curve, not a polyline. `sources` are RoadNetworks, `main(x, z)` the stage
 * road (or null).
 */
export function settleJunctions(w, sources, main = null) {
  const s = w.samples;
  const n = s.length;
  const anchors = [];
  // OSM roads meet only where they share a node; a road crossing over or
  // under another one (bridge, tunnel, layer) shares none and stays apart.
  const linked = new Map();
  const connected = (seg) => {
    if (!seg.nodes || !w.nodes) return true;
    let ok = linked.get(seg.id);
    if (ok == null) {
      ok = false;
      for (const k of w.nodes) if (seg.nodes.has(k)) { ok = true; break; }
      linked.set(seg.id, ok);
    }
    return ok;
  };
  for (let i = 0; i < n; i++) {
    const p = s[i];
    let best = null;
    const consider = (q) => {
      if (!q || q.roadY == null || !(q.distance <= (q.width ?? 0) + SHOULDER)) return;
      if (best && !(q.rank > best.rank || (q.rank === best.rank && q.distance < best.distance))) return;
      best = q;
    };
    if (main) {
      const q = main(p.x, p.z);
      if (q) consider({ ...q, rank: STAGE_RANK });
    }
    for (const net of sources) {
      consider(net.nearest(p.x, p.z, 9, (seg) => seg.id !== w.id && outranks(seg, w) && connected(seg)));
    }
    if (!best) continue;
    const t = best.tangent;
    const a = s[Math.max(0, i - 1)]; const c = s[Math.min(n - 1, i + 1)];
    const tl = Math.hypot(c.x - a.x, c.z - a.z) || 1;
    const tx = (c.x - a.x) / tl; const tz = (c.z - a.z) / tl; // this way's direction
    // The stage road has no OSM nodes: a road crossing it well above or below
    // (and at an angle) passes over or under it.
    if (best.rank === STAGE_RANK && Math.abs(best.roadY - p.roadY) > 3 && Math.abs(tx * t.x + tz * t.z) < 0.7) continue;
    const g = best.grade || 0;
    const b = best.bank || 0;
    const Gx = g * t.x - b * t.z; // gradient of the main road's surface plane
    const Gz = g * t.z + b * t.x;
    const h = best.roadY + Gx * (p.x - best.point.x) + Gz * (p.z - best.point.z);
    anchors.push({ s: p.s, h, dy: h - p.roadY, slope: Gx * tx + Gz * tz, bank: Gx * -tz + Gz * tx });
  }
  if (!anchors.length) return w;
  const ramp = (an) => clamp(Math.abs(an.dy) / RAMP_GRADE, 20, 100);
  // Offset (to add to the graded height `base`) and crossfall at distance `d` along the way.
  const settle = (d, base) => {
    let A = null; let B = null;
    for (const an of anchors) { if (an.s <= d) A = an; else { B = an; break; } }
    const ext = (an) => an.h + an.slope * (d - an.s) - base; // stay on the main plane's slope
    const fade = (an) => smoothstep(clamp(1 - Math.abs(d - an.s) / ramp(an), 0, 1));
    if (A && A.s === d) return { dy: A.dy, bank: A.bank };
    if (A && B && B.s - A.s <= ramp(A) + ramp(B)) {
      const u = smoothstep((d - A.s) / (B.s - A.s));
      return { dy: lerp(ext(A), ext(B), u), bank: lerp(A.bank, B.bank, u) };
    }
    let dy = 0; let bank = 0;
    for (const an of [A, B]) {
      if (!an) continue;
      const f = fade(an);
      dy += ext(an) * f;
      bank += an.bank * f;
    }
    return { dy, bank };
  };
  // Only ramps that really bend the profile get extra samples.
  const reach = (d) => anchors.some((an) => (Math.abs(an.dy) > 0.05 || Math.abs(an.slope) > 0.01) && Math.abs(d - an.s) < ramp(an));
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = s[i];
    if (i > 0 && (reach(p.s) || reach(s[i - 1].s))) {
      // Inside a ramp: extra samples on the chord every RAMP_STEP metres.
      const q = s[i - 1];
      const len = p.s - q.s;
      const extra = Math.ceil(len / RAMP_STEP - 1e-6) - 1;
      for (let m = 1; m <= extra; m++) {
        const u = m / (extra + 1);
        const mid = {
          x: lerp(q.x, p.x, u), z: lerp(q.z, p.z, u), s: lerp(q.s, p.s, u), roadY: lerp(q.roadY, p.roadY, u),
          edgeL: q.edgeL != null && p.edgeL != null ? lerp(q.edgeL, p.edgeL, u) : null,
          edgeR: q.edgeR != null && p.edgeR != null ? lerp(q.edgeR, p.edgeR, u) : null,
          bridge: Boolean(q.bridge && p.bridge), pier: false, wet: Boolean(q.wet && p.wet),
        };
        out.push(mid);
      }
    }
    out.push(p);
  }
  for (const p of out) {
    const st = settle(p.s, p.roadY);
    p.roadY += st.dy;
    p.bank = (p.bank || 0) + st.bank;
  }
  w.samples = out;
  return w;
}

/** The OSM nodes of a way, so junction settling knows which roads are really connected. */
function nodesOf(road) {
  return road.nodes ||= new Set(road.points.map((p) => `${p.lat.toFixed(7)},${p.lon.toFixed(7)}`));
}

function finishRun(points, road, half, cut) {
  const samples = [];
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) s += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
    samples.push({ x: points[i].x, z: points[i].z, roadY: points[i].roadY, y: points[i].roadY, bank: points[i].bank || 0, edgeL: points[i].edgeL, edgeR: points[i].edgeR, s, bridge: Boolean(points[i].bridge), pier: Boolean(points[i].pier), wet: Boolean(points[i].wet) });
  }
  const paved = isPaved(road);
  return { id: road.id ?? null, kind: road.kind, rank: ROAD_RANK[road.kind] ?? 0, nodes: nodesOf(road), name: road.name, half, cut, paved, surface: paved ? 'asphalt' : 'gravel', maxspeed: road.maxspeed, samples, length: s };
}

/**
 * Carve polylines into a height grid: each cell within `half + blend` of a
 * segment is pulled toward the height interpolated along that segment
 * (nearest segment wins), exactly like the stage-road carve.
 * `grid` = { heights, x0, z0, cell, n } with `n` the stored grid side.
 */
export function carvePolylines(grid, polylines, { lift = 0.12 } = {}) {
  // Engineered profile (embankments / cuttings) from the grid's base heights.
  const base = grid.base || grid.heights.slice();
  return carveProfile({ ...grid, base }, polylines, { lift });
}

/** Ribbon meshes for prepared roads (call after the carve, heights settled). */
export function buildRoadMeshes(polylines, terrain) {
  if (!polylines.length) return null;
  const group = new THREE.Group();
  group.name = 'osmRoads';
  // One mesh for the whole chunk: hundreds of ribbons would be hundreds of
  // draw calls, and they all share one material.
  const ribbons = polylines.map((line) => buildRibbon({ samples: line.samples, roadWidth: line.half }, terrain, 0, line.samples.length - 1, { paved: line.paved }));
  const material = ribbons[0].material;
  const merged = ribbons.length === 1 ? ribbons[0].geometry : mergeGeometries(ribbons.map((m) => m.geometry), false);
  if (ribbons.length > 1) for (const m of ribbons) { m.geometry.dispose(); if (m.material !== material) m.material.dispose(); }
  const mesh = new THREE.Mesh(merged || ribbons[0].geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.name = 'roadRibbons';
  group.add(mesh);
  const bridges = buildBridgeMesh(polylines, (x, z) => (terrain.sampleBase ? terrain.sampleBase(x, z) : terrain.sample(x, z)));
  if (bridges) group.add(bridges);
  group.userData.bridgeBoxes = bridges?.userData.boxes || [];
  return group;
}

/* ------------------------------------------------------------------ *
 *  Spatial index                                                       *
 * ------------------------------------------------------------------ */

/**
 * Segments of every loaded chunk's roads in 48 m buckets. Implements the
 * part of the StageRoute interface the car and the HUD use, so a free
 * drive can hand it to `car.setRoute()` directly.
 */
export class RoadNetwork {
  constructor({ cell = 24, spawn = { x: 0, z: 0, yaw: 0 }, name = 'Free drive' } = {}) {
    this.cell = cell;
    this.buckets = new Map();
    this.byChunk = new Map();
    this.spawn = spawn;
    this.free = true;
    this.name = name;
    this.source = 'osm';
    this.roadWidth = 3.0;
    this.length = 0;
    this.samples = [];
    this.start = { x: spawn.x, z: spawn.z };
    this.finish = { x: spawn.x, z: spawn.z };
    this.segmentCount = 0;
    this.bridgeCount = 0; // bridge segments loaded (the car only looks for side-road decks when there are any)
  }

  key(bx, bz) { return (bx + 1048576) * 2097152 + (bz + 1048576); } // numeric: cheaper than a string per lookup

  setChunk(chunkKey, polylines) {
    this.removeChunk(chunkKey);
    this.addLines(chunkKey, polylines);
  }

  /** Add lines under a chunk key without dropping what the key already holds. */
  addLines(chunkKey, polylines) {
    const owned = this.byChunk.get(chunkKey) || [];
    const before = owned.length;
    for (const line of polylines) {
      const s = line.samples;
      for (let k = 0; k + 1 < s.length; k++) {
        const seg = { id: line.id ?? null, ax: s[k].x, az: s[k].z, bx: s[k + 1].x, bz: s[k + 1].z, ay: s[k].roadY ?? s[k].y ?? 0, by: s[k + 1].roadY ?? s[k + 1].y ?? 0, al: s[k].edgeL ?? null, bl: s[k + 1].edgeL ?? null, ar: s[k].edgeR ?? null, br: s[k + 1].edgeR ?? null, bridge: Boolean(s[k].bridge && s[k + 1].bridge), ak: s[k].bank || 0, bk: s[k + 1].bank || 0, rank: line.rank ?? 0, nodes: line.nodes || null, half: line.half, cut: line.cut ?? null, paved: line.paved, surface: line.surface || (line.paved ? 'asphalt' : 'gravel'), chunk: chunkKey };
        const bx = Math.floor(((seg.ax + seg.bx) / 2) / this.cell);
        const bz = Math.floor(((seg.az + seg.bz) / 2) / this.cell);
        const key = this.key(bx, bz);
        let list = this.buckets.get(key);
        if (!list) this.buckets.set(key, (list = []));
        list.push(seg);
        owned.push({ key, seg });
        if (seg.bridge) this.bridgeCount++;
      }
    }
    this.byChunk.set(chunkKey, owned);
    this.segmentCount += owned.length - before;
  }

  removeChunk(chunkKey) {
    const owned = this.byChunk.get(chunkKey);
    if (!owned) return;
    for (const { key, seg } of owned) {
      const list = this.buckets.get(key);
      if (!list) continue;
      const i = list.indexOf(seg);
      if (i >= 0) list.splice(i, 1);
      if (!list.length) this.buckets.delete(key);
      if (seg.bridge) this.bridgeCount--;
    }
    this.byChunk.delete(chunkKey);
    this.segmentCount -= owned.length;
  }

  /**
   * Nearest road segment (StageRoute-compatible answer), optionally among the
   * segments `filter(seg)` accepts. Also gives the segment's `grade` (rise
   * per metre along `tangent`), crossfall `bank` and junction `rank`.
   */
  nearest(x, z, limit = 120, filter = null) {
    // Buckets hold segments by midpoint; segments are a few metres long.
    const reach = limit + 3;
    const i0 = Math.floor((x - reach) / this.cell); const i1 = Math.floor((x + reach) / this.cell);
    const j0 = Math.floor((z - reach) / this.cell); const j1 = Math.floor((z + reach) / this.cell);
    let best = null;
    let bestD = Infinity;
    let bestT = 0;
    for (let bz = j0; bz <= j1; bz++) {
      for (let bx = i0; bx <= i1; bx++) {
        const list = this.buckets.get(this.key(bx, bz));
        if (!list) continue;
        for (const seg of list) {
          const dx = seg.bx - seg.ax;
          const dz = seg.bz - seg.az;
          const l2 = dx * dx + dz * dz || 1;
          const t = clamp(((x - seg.ax) * dx + (z - seg.az) * dz) / l2, 0, 1);
          const ex = x - (seg.ax + dx * t);
          const ez = z - (seg.az + dz * t);
          const d2 = ex * ex + ez * ez;
          if (d2 < bestD && (!filter || filter(seg))) { bestD = d2; best = seg; bestT = t; }
        }
      }
    }
    if (!best) {
      return { distance: Infinity, index: 0, progress: 0, point: { x, z }, tangent: { x: 0, z: 1 }, width: this.roadWidth, cut: null, paved: false, surface: 'gravel', roadY: null, edgeL: null, edgeR: null };
    }
    const dx = best.bx - best.ax;
    const dz = best.bz - best.az;
    const l = Math.hypot(dx, dz) || 1;
    return {
      distance: Math.sqrt(bestD),
      index: 0,
      progress: 0,
      point: { x: best.ax + dx * bestT, z: best.az + dz * bestT },
      tangent: { x: dx / l, z: dz / l },
      width: best.half,
      cut: best.cut,
      id: best.id ?? null,
      paved: best.paved,
      surface: best.surface,
      bridge: best.bridge,
      rank: best.rank,
      grade: (best.by - best.ay) / l,
      bank: best.ak + (best.bk - best.ak) * bestT,
      roadY: best.ay + (best.by - best.ay) * bestT,
      edgeL: best.al != null && best.bl != null ? best.al + (best.bl - best.al) * bestT : null,
      edgeR: best.ar != null && best.br != null ? best.ar + (best.br - best.ar) * bestT : null,
    };
  }

  /** Every segment whose bucket lies within `radius` of (x, z) (for the minimap). */
  segmentsNear(x, z, radius) {
    const r = Math.ceil(radius / this.cell);
    const bx = Math.floor(x / this.cell);
    const bz = Math.floor(z / this.cell);
    const out = [];
    for (let dj = -r; dj <= r; dj++) {
      for (let di = -r; di <= r; di++) {
        const list = this.buckets.get(this.key(bx + di, bz + dj));
        if (list) out.push(...list);
      }
    }
    return out;
  }

  /** A pose on the nearest road to (x, z), or null when no road is near. */
  poseNear(x, z, limit = 400) {
    const q = this.nearest(x, z, limit);
    if (!Number.isFinite(q.distance) || q.distance > limit) return null;
    return { x: q.point.x, z: q.point.z, yaw: Math.atan2(q.tangent.x, q.tangent.z) };
  }

  startPose() {
    return this.spawn;
  }

  snapToTerrain() { return this; }
}

/* ------------------------------------------------------------------ *
 *  Road surface: NVDB "Vegdekke" (type 241) with OSM fallback            *
 * ------------------------------------------------------------------ */

const NVDB_SURFACE_URL = 'https://nvdbapiles.atlas.vegvesen.no/vegobjekter/api/v4/vegobjekter/241';
const MASSETYPE = 1216;

/** NVDB "Massetype" text → game surface kind ('asphalt' covers every bound surface). */
export function surfaceKindFromMassetype(verdi) {
  if (!verdi) return null;
  const v = String(verdi).toLowerCase();
  if (v === 'grus' || v.startsWith('enkel overflatebehandling grus') || v.startsWith('dobbel overflatebehandling grus')) return 'gravel';
  if (v.includes('grus') && !v.includes('asfalt') && !v.includes('emulsjon') && !v.includes('olje')) return 'gravel';
  return 'asphalt';
}

function parseLineZ(wkt) {
  const m = /LINESTRING\s*Z?\s*\(([^)]*)\)/i.exec(wkt || '');
  if (!m) return null;
  const pts = m[1].split(',').map((t) => t.trim().split(/\s+/).map(Number)).filter((a) => a.length >= 2 && Number.isFinite(a[0]));
  return pts.length >= 2 ? pts.map(([e, n]) => utmInverse(e, n)) : null;
}

/**
 * Fetch the registered road surfaces inside a lat/lon bbox. Returns
 * `[{ kind: 'asphalt'|'gravel', points: [{lat, lon}] }]`; objects without a
 * `Massetype` are skipped (the register is patchy on municipal roads).
 */
export async function fetchRoadSurfaces({ minLat, minLon, maxLat, maxLon }, { timeout = 20000 } = {}) {
  let minE = Infinity; let maxE = -Infinity; let minN = Infinity; let maxN = -Infinity;
  for (const [lat, lon] of [[minLat, minLon], [minLat, maxLon], [maxLat, minLon], [maxLat, maxLon]]) {
    const { x: e, y: n } = utmForward(lat, lon);
    minE = Math.min(minE, e); maxE = Math.max(maxE, e); minN = Math.min(minN, n); maxN = Math.max(maxN, n);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const out = [];
  try {
    let url = `${NVDB_SURFACE_URL}?kartutsnitt=${minE.toFixed(0)},${minN.toFixed(0)},${maxE.toFixed(0)},${maxN.toFixed(0)}&srid=5973&inkluder=geometri,egenskaper&antall=1000`;
    for (let page = 0; url && page < 10; page++) {
      let data;
      try {
        data = await cachedJson(url, { headers: { 'X-Client': 'norwayralley', Accept: 'application/json' } }, { kind: 'nvdb', signal: controller.signal });
      } catch {
        break;
      }
      const objects = data.objekter || [];
      for (const o of objects) {
        const prop = (o.egenskaper || []).find((e) => e.id === MASSETYPE);
        const kind = surfaceKindFromMassetype(prop?.verdi);
        const points = kind ? parseLineZ(o.geometri?.wkt) : null;
        if (kind && points) out.push({ kind, points });
      }
      url = objects.length && data.metadata?.neste?.href ? data.metadata.neste.href : null;
    }
  } catch {
    // No surface data: callers fall back to OSM tags / road class.
  } finally {
    clearTimeout(timer);
  }
  return out;
}

/**
 * Give every sample a `surface` from the nearest surface polyline within
 * `maxDist` metres, else `fallback` (or the sample's existing value).
 * `polylines` are `{ kind, points: [{lat, lon}] }`; `project` maps lat/lon
 * to world x/z. Returns how many samples got a measured surface.
 */
export function assignSurfaces(samples, polylines, project, { maxDist = 12, fallback = null } = {}) {
  const cell = 64;
  const buckets = new Map();
  const key = (bx, bz) => `${bx},${bz}`;
  for (const line of polylines || []) {
    const pts = line.points.map((p) => project(p.lat, p.lon));
    for (let i = 0; i + 1 < pts.length; i++) {
      const seg = { ax: pts[i].x, az: pts[i].z, bx: pts[i + 1].x, bz: pts[i + 1].z, kind: line.kind };
      const bx0 = Math.floor(Math.min(seg.ax, seg.bx) / cell); const bx1 = Math.floor(Math.max(seg.ax, seg.bx) / cell);
      const bz0 = Math.floor(Math.min(seg.az, seg.bz) / cell); const bz1 = Math.floor(Math.max(seg.az, seg.bz) / cell);
      for (let bz = bz0; bz <= bz1; bz++) for (let bx = bx0; bx <= bx1; bx++) {
        const k = key(bx, bz);
        let list = buckets.get(k);
        if (!list) buckets.set(k, (list = []));
        list.push(seg);
      }
    }
  }
  let measured = 0;
  for (const p of samples) {
    let best = null; let bestD = maxDist;
    const bx = Math.floor(p.x / cell); const bz = Math.floor(p.z / cell);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const list = buckets.get(key(bx + di, bz + dj));
      if (!list) continue;
      for (const seg of list) {
        const dx = seg.bx - seg.ax; const dz = seg.bz - seg.az; const l2 = dx * dx + dz * dz || 1;
        const t = clamp(((p.x - seg.ax) * dx + (p.z - seg.az) * dz) / l2, 0, 1);
        const d = Math.hypot(p.x - (seg.ax + dx * t), p.z - (seg.az + dz * t));
        if (d < bestD) { bestD = d; best = seg.kind; }
      }
    }
    if (best) { p.surface = best; measured++; } else if (fallback && !p.surface) p.surface = fallback;
  }
  return measured;
}
