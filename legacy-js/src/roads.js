import * as THREE from 'three';
import { clamp, lerp, smoothstep, utmForward, utmInverse } from './geo.js';
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

/**
 * Corner cutting (Chaikin, two rounds) for a road centreline in 2D, so bends
 * are curves instead of polyline corners. Vertices in `pinned` (junction
 * nodes shared with other ways) and both ends stay exactly where they are,
 * so roads still meet where OSM says they meet.
 */
export function smoothWay(points, pinned = new Set(), iterations = 2) {
  if (points.length < 3) return points.map((p) => ({ x: p.x, z: p.z }));
  const out = [];
  let piece = [points[0]];
  const flush = (last) => {
    let p = piece.map((v) => ({ x: v.x, z: v.z }));
    for (let k = 0; k < iterations && p.length >= 3; k++) {
      const q = [p[0]];
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i];
        const b = p[i + 1];
        q.push({ x: a.x * 0.75 + b.x * 0.25, z: a.z * 0.75 + b.z * 0.25 });
        q.push({ x: a.x * 0.25 + b.x * 0.75, z: a.z * 0.25 + b.z * 0.75 });
      }
      q.push(p[p.length - 1]);
      p = q;
    }
    if (out.length) p.shift(); // the joint is already there
    out.push(...p);
    piece = [last];
  };
  for (let i = 1; i < points.length; i++) {
    piece.push(points[i]);
    if (i < points.length - 1 && pinned.has(i)) flush(points[i]);
  }
  flush(points[points.length - 1]);
  return out;
}

/** Resample a world polyline to `step` metres, keeping the original vertices. */
function resample(points, step) {
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(1, Math.ceil(len / step));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
    }
  }
  return out;
}

/**
 * Project, clip and resample a chunk's OSM roads, and give every sample a
 * smoothed road height (`roadY`). Samples closer than `avoid.distance` to
 * `avoid.index` (the stage route) are cut out so the OSRM stage road and its
 * OSM twin never overlap. `wet(x, z)` (bridges.js `waterProbe`) finds
 * untagged water crossings; `bridge=*` ways are bridges end to end.
 */
export function prepareChunkRoads(roads, terrain, { x0, z0, size }, { avoid = null, pad = 60, wet = null } = {}) {
  const minX = x0 - pad;
  const maxX = x0 + size + pad;
  const minZ = z0 - pad;
  const maxZ = z0 + size + pad;
  const inside = (p) => p.x >= minX && p.x <= maxX && p.z >= minZ && p.z <= maxZ;
  // Junction nodes: a coordinate that appears in more than one way (or more
  // than once) stays put when the centrelines are smoothed.
  const nodeCount = new Map();
  const nodeKey = (p) => `${p.lat.toFixed(7)},${p.lon.toFixed(7)}`;
  for (const road of roads || []) {
    if (!laneSpec(road)) continue;
    for (const p of road.points) nodeCount.set(nodeKey(p), (nodeCount.get(nodeKey(p)) || 0) + 1);
  }
  const out = [];
  for (const road of roads || []) {
    const spec = laneSpec(road);
    if (!spec) continue;
    const { half, cut } = spec;
    const raw = road.points.map((p) => terrain.worldFromLatLon(p.lat, p.lon));
    if (!raw.some(inside)) continue;
    const pinned = new Set();
    road.points.forEach((p, i) => { if ((nodeCount.get(nodeKey(p)) || 0) > 1) pinned.add(i); });
    const world = smoothWay(raw, pinned);
    const samples = resample(world, 5);
    let along = 0;
    samples.forEach((p, i) => { if (i) along += Math.hypot(p.x - samples[i - 1].x, p.z - samples[i - 1].z); p.s = along; });
    // Grade the whole way before clipping it to the chunk, on the coarse
    // ground only: every chunk that holds a piece of this road then computes
    // the same heights, whatever has loaded around it, so the copies agree
    // where they overlap (and the 1 m tiles never change a road's height).
    const ground = terrain.sampleBaseCoarse || terrain.sampleBase || terrain.sample;
    const groundAt = (x, z) => ground.call(terrain, x, z);
    // Bridges: a tagged way end to end, else wherever it crosses water. The
    // grade runs bank to bank over a span, then the deck is shaped on top.
    const core = road.bridge ? samples.map(() => true) : wetCore(samples, wet, { lateral: cut + 4, ground: groundAt });
    if (road.bridge && wet) for (const p of samples) p.wet = wet(p.x, p.z);
    markBridgeSpans(samples, core);
    const graded = bridgeRaw(samples.map((p) => groundAt(p.x, p.z)), samples);
    // A bridge is usually its own short way: grade it with 60 m of the ground
    // straight on beyond both ends, as the roads it joins are graded, or its
    // ends average in the valley and sit below them.
    const ext = road.bridge && samples.length >= 2 ? 12 : 0;
    const beyond = (p, q) => {
      const l = Math.hypot(p.x - q.x, p.z - q.z) || 1;
      return Array.from({ length: ext }, (_, k) => groundAt(p.x + ((p.x - q.x) / l) * 5 * (k + 1), p.z + ((p.z - q.z) / l) * 5 * (k + 1)));
    };
    const n = samples.length;
    const smooth = smoothRoadHeights([...beyond(samples[0], samples[1]).reverse(), ...graded, ...beyond(samples[n - 1], samples[n - 2])], 5).slice(ext, ext + n);
    // Heights this way was already given by another chunk win, so every copy
    // of a road agrees exactly where they overlap (sample i is the same point
    // in every copy: the way is resampled from its first node every time).
    // New stretches are eased onto the known ones instead of stepping.
    samples.forEach((p, i) => { p.roadY = smooth[i]; });
    applyBridgeProfile(samples, groundAt);
    // Rim heights: another road's surface where one lies at the cut-through
    // edge (a junction or a parallel road), the natural ground otherwise.
    const net = terrain.roads;
    const rimGround = (x, z) => {
      if (net?.nearest) {
        const q = net.nearest(x, z, 10);
        if (q.roadY != null && !q.bridge && q.id !== road.id && q.distance <= (q.width ?? 0) + SHOULDER) return q.roadY;
      }
      return ground.call(terrain, x, z);
    };
    assignEdgeHeights(samples, cut, rimGround);
    // Junctions and crossings: wherever this way meets a road that is already
    // in the network (its own ends, T-junctions, crossings), ease its height
    // onto that road over 60 m either side, so roads meet without a step and
    // the carve does not have two heights for one spot.
    const network = terrain.roads;
    if (network?.nearest && road.id != null) {
      const FADE_J = 12;
      const meets = [];
      let lastHit = -FADE_J;
      for (let i = 0; i < samples.length; i++) {
        if (i - lastHit < 4) continue; // one anchor per 20 m of shared road
        const p = samples[i];
        const q = network.nearest(p.x, p.z, 4);
        if (!(q.distance <= 2.5) || q.roadY == null || q.id === road.id) continue;
        // A road under a bridge (or a bridge over a road) does not meet it.
        if (Boolean(q.bridge) !== Boolean(p.bridge) && Math.abs(q.roadY - p.roadY) > 3) continue;
        meets.push({ i, y: q.roadY });
        lastHit = i;
      }
      for (const m of meets) {
        const delta = m.y - samples[m.i].roadY;
        if (Math.abs(delta) < 0.02) continue;
        for (let k = -FADE_J; k <= FADE_J; k++) {
          const i = m.i + k;
          if (i < 0 || i >= samples.length) continue;
          samples[i].roadY += delta * (1 - Math.abs(k) / FADE_J);
        }
      }
    }
    // Heights this way was already given by another chunk win (keyed by the
    // sample position to half a metre, so copies agree wherever they share
    // ground); new stretches are eased onto the known ones.
    const registry = terrain.roadHeights;
    if (registry && road.id != null) {
      const posKey = (p) => `${Math.round(p.x * 2)}:${Math.round(p.z * 2)}`;
      const known = registry.get(road.id);
      if (known) {
        const kn = samples.map((p) => known.get(posKey(p)) || null);
        const FADE = 30;
        for (let i = 0; i < samples.length; i++) {
          if (kn[i]) continue;
          let k = -1;
          for (let d = 1; d <= FADE; d++) {
            if (kn[i - d]) { k = i - d; break; }
            if (kn[i + d]) { k = i + d; break; }
          }
          if (k >= 0) {
            const w = 1 - Math.abs(i - k) / FADE;
            samples[i].roadY += (kn[k].y - samples[k].roadY) * w;
            samples[i].edgeL += (kn[k].l - samples[k].edgeL) * w;
            samples[i].edgeR += (kn[k].r - samples[k].edgeR) * w;
          }
        }
        for (let i = 0; i < samples.length; i++) {
          if (kn[i]) { samples[i].roadY = kn[i].y; samples[i].edgeL = kn[i].l; samples[i].edgeR = kn[i].r; samples[i].bridge = kn[i].b; samples[i].pier = kn[i].p; }
        }
      }
      const store = known || new Map();
      for (const p of samples) {
        const key = posKey(p);
        if (!store.has(key)) store.set(key, { y: p.roadY, l: p.edgeL, r: p.edgeR, b: Boolean(p.bridge), p: Boolean(p.pier) });
      }
      registry.set(road.id, store);
    }
    // Split into runs that are inside the padded chunk and away from the route.
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

function finishRun(points, road, half, cut) {
  const samples = [];
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) s += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
    samples.push({ x: points[i].x, z: points[i].z, roadY: points[i].roadY, y: points[i].roadY, edgeL: points[i].edgeL, edgeR: points[i].edgeR, s, bridge: Boolean(points[i].bridge), pier: Boolean(points[i].pier), wet: Boolean(points[i].wet) });
  }
  const paved = isPaved(road);
  return { id: road.id ?? null, kind: road.kind, name: road.name, half, cut, paved, surface: paved ? 'asphalt' : 'gravel', maxspeed: road.maxspeed, samples, length: s };
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
  constructor({ cell = 48, spawn = { x: 0, z: 0, yaw: 0 }, name = 'Free drive' } = {}) {
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

  key(bx, bz) { return `${bx},${bz}`; }

  setChunk(chunkKey, polylines) {
    this.removeChunk(chunkKey);
    const owned = [];
    for (const line of polylines) {
      const s = line.samples;
      for (let k = 0; k + 1 < s.length; k++) {
        const seg = { id: line.id ?? null, ax: s[k].x, az: s[k].z, bx: s[k + 1].x, bz: s[k + 1].z, ay: s[k].roadY ?? s[k].y ?? 0, by: s[k + 1].roadY ?? s[k + 1].y ?? 0, al: s[k].edgeL ?? null, bl: s[k + 1].edgeL ?? null, ar: s[k].edgeR ?? null, br: s[k + 1].edgeR ?? null, bridge: Boolean(s[k].bridge && s[k + 1].bridge), half: line.half, cut: line.cut ?? null, paved: line.paved, surface: line.surface || (line.paved ? 'asphalt' : 'gravel'), chunk: chunkKey };
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
    this.segmentCount += owned.length;
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

  /** Nearest road segment (StageRoute-compatible answer). */
  nearest(x, z, limit = 120) {
    const bx = Math.floor(x / this.cell);
    const bz = Math.floor(z / this.cell);
    const r = Math.ceil(limit / this.cell);
    let best = null;
    let bestD = Infinity;
    let bestT = 0;
    for (let dj = -r; dj <= r; dj++) {
      for (let di = -r; di <= r; di++) {
        const list = this.buckets.get(this.key(bx + di, bz + dj));
        if (!list) continue;
        for (const seg of list) {
          const dx = seg.bx - seg.ax;
          const dz = seg.bz - seg.az;
          const l2 = dx * dx + dz * dz || 1;
          const t = clamp(((x - seg.ax) * dx + (z - seg.az) * dz) / l2, 0, 1);
          const d = Math.hypot(x - (seg.ax + dx * t), z - (seg.az + dz * t));
          if (d < bestD) { bestD = d; best = seg; bestT = t; }
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
      distance: bestD,
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
