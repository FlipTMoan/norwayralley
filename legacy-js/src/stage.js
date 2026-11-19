import * as THREE from 'three';
import { clamp, smoothstep, splinePolyline } from './geo.js';
import { logger } from './log.js';
import { smoothRoadHeights, meanSpacing, assignEdgeHeights, RIBBON_SHOULDER, LANES, flatHalf, ROAD_LIFT } from './corridor.js';
import { buildBridgeMesh } from './bridges.js';
import { cache } from './cache.js';

/** How far the gravel ribbon floats above the carved ground. The car rides on
 *  the ribbon, so car.js adds the same offsets when it is on the road. */
export const ROAD_RIBBON_LIFT = 0.16;
export const ROAD_CROWN = 0.06;
export const ROAD_SHOULDER = RIBBON_SHOULDER;

const log = logger('stage');

/* ------------------------------------------------------------------ *
 *  A very small binary heap — A*'s open set.                         *
 * ------------------------------------------------------------------ */
class MinHeap {
  constructor() {
    this.items = [];
  }
  get size() { return this.items.length; }
  push(priority, value) {
    const item = { priority, value };
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].priority <= a[i].priority) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.items;
    if (!a.length) return null;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].priority < a[m].priority) m = l;
        if (r < a.length && a[r].priority < a[m].priority) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top.value;
  }
}

/* ------------------------------------------------------------------ *
 *  Route object: smoothed, terrain-snapped, with a quick proximity     *
 *  query used for road grip, progress and the HUD.                     *
 * ------------------------------------------------------------------ */
export class StageRoute {
  constructor(points, terrain, { name = 'Rally stage', source = 'generated', roadWidth = LANES.one.half, cutHalf = null, surface = 'gravel' } = {}) {
    this.terrain = terrain;
    this.name = name;
    this.source = source;
    this.roadWidth = roadWidth;
    this.cutHalf = cutHalf ?? Math.max(LANES.one.cut, flatHalf(roadWidth)); // half width of the cut-through
    this.surface = surface; // default surface kind until NVDB / OSM say otherwise
    this.points = points;
    this.samples = this.prepareSamples(points);
    this.length = this.samples[this.samples.length - 1]?.s || 0;
    this.start = this.samples[0];
    this.finish = this.samples[this.samples.length - 1];
  }

  prepareSamples(points) {
    const out = [];
    let s = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (i > 0) {
        const q = points[i - 1];
        s += Math.hypot(p.x - q.x, p.z - q.z);
      }
      out.push({ x: p.x, z: p.z, y: this.terrain.sample(p.x, p.z), s, surface: this.surface });
    }
    return out;
  }

  at(index) {
    return this.samples[clamp(index, 0, this.samples.length - 1)];
  }

  /**
   * Smooth the natural ground along the route into a carriageway height
   * (`roadY`) — ±`window` samples of running mean — so the road rides over
   * dips on embankments and through crests in cuttings instead of following
   * every bump.
   */
  assignRoadY(terrain, window = 45) {
    const s = this.samples;
    const raw = s.map((p) => terrain.sampleBase ? terrain.sampleBase(p.x, p.z) : terrain.sample(p.x, p.z));
    const smooth = smoothRoadHeights(raw, meanSpacing(s), { window, s: s.map((p) => p.s) });
    for (let i = 0; i < s.length; i++) s[i].roadY = smooth[i];
    const ground = terrain.sampleBaseCoarse || terrain.sampleBase || terrain.sample;
    assignEdgeHeights(s, this.cutHalf, (x, z) => ground.call(terrain, x, z));
    return this;
  }

  /** Re-read every sample's height from the terrain (after a start pad carve). */
  snapToTerrain() {
    let s = 0;
    for (let i = 0; i < this.samples.length; i++) {
      const p = this.samples[i];
      if (i > 0) {
        const q = this.samples[i - 1];
        s += Math.hypot(p.x - q.x, p.z - q.z);
      }
      p.y = this.terrain.sample(p.x, p.z);
      p.s = s;
    }
    this.length = s;
    this.start = this.samples[0];
    this.finish = this.samples[this.samples.length - 1];
    return this;
  }

  /** Nearest route sample to a world position. */
  nearest(x, z) {
    let best = Infinity;
    let bi = 0;
    const a = this.samples;
    for (let i = 0; i < a.length; i++) {
      const dx = a[i].x - x;
      const dz = a[i].z - z;
      const d2 = dx * dx + dz * dz;
      if (d2 < best) {
        best = d2;
        bi = i;
      }
    }
    const p = a[bi];
    const next = a[Math.min(bi + 1, a.length - 1)];
    const prev = a[Math.max(bi - 1, 0)];
    let tx = next.x - prev.x;
    let tz = next.z - prev.z;
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl; tz /= tl;
    // Perpendicular distance to the two segments meeting at the nearest
    // sample: the sample spacing would otherwise add up to half a step.
    // The road height is interpolated along the same segment.
    let distance = Math.sqrt(best);
    let roadY = p.roadY ?? p.y;
    let edgeL = p.edgeL ?? null;
    let edgeR = p.edgeR ?? null;
    let bridge = false;
    for (const [p0, p1] of [[prev, p], [p, next]]) {
      const dx = p1.x - p0.x;
      const dz = p1.z - p0.z;
      const l2 = dx * dx + dz * dz;
      if (l2 < 1e-6) continue;
      const t = clamp(((x - p0.x) * dx + (z - p0.z) * dz) / l2, 0, 1);
      const d = Math.hypot(x - (p0.x + dx * t), z - (p0.z + dz * t));
      if (d <= distance) {
        distance = d;
        roadY = (p0.roadY ?? p0.y) + ((p1.roadY ?? p1.y) - (p0.roadY ?? p0.y)) * t;
        edgeL = p0.edgeL != null && p1.edgeL != null ? p0.edgeL + (p1.edgeL - p0.edgeL) * t : edgeL;
        edgeR = p0.edgeR != null && p1.edgeR != null ? p0.edgeR + (p1.edgeR - p0.edgeR) * t : edgeR;
        bridge = Boolean(p0.bridge && p1.bridge);
      }
    }
    return {
      distance,
      roadY,
      edgeL,
      edgeR,
      bridge,
      cut: this.cutHalf,
      index: bi,
      progress: this.length > 0 ? p.s / this.length : 0,
      point: p,
      tangent: { x: tx, z: tz },
      surface: p.surface || this.surface,
    };
  }

  distanceTo(x, z) {
    return this.nearest(x, z).distance;
  }

  sampleAtDistance(distance) {
    const s = clamp(distance, 0, this.length);
    let lo = 0;
    let hi = this.samples.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (this.samples[mid].s < s) lo = mid;
      else hi = mid;
    }
    const a = this.samples[lo];
    const b = this.samples[hi];
    const t = (s - a.s) / Math.max(0.0001, b.s - a.s);
    return {
      x: a.x + (b.x - a.x) * t,
      z: a.z + (b.z - a.z) * t,
      y: a.y + (b.y - a.y) * t,
      angle: Math.atan2(b.x - a.x, b.z - a.z),
      bridge: Boolean(a.bridge || b.bridge),
    };
  }

  startPose() {
    const p = this.samples[0];
    const q = this.samples[Math.min(4, this.samples.length - 1)];
    return {
      x: p.x,
      z: p.z,
      y: this.terrain.sample(p.x, p.z),
      yaw: Math.atan2(q.x - p.x, q.z - p.z),
    };
  }
}

function chaikin(points, iterations = 2) {
  let p = points.map((v) => ({ x: v.x, z: v.z }));
  for (let k = 0; k < iterations; k++) {
    if (p.length < 3) break;
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
  return p;
}

function resample(points, spacing) {
  if (points.length < 2) return points;
  const out = [{ x: points[0].x, z: points[0].z }];
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.0001) continue;
    let t = (spacing - carry) / len;
    while (t <= 1) {
      out.push({ x: a.x + dx * t, z: a.z + dz * t });
      t += spacing / len;
    }
    carry = (carry + len) % spacing;
  }
  const last = points[points.length - 1];
  if (Math.hypot(last.x - out[out.length - 1].x, last.z - out[out.length - 1].z) > 1) {
    out.push({ x: last.x, z: last.z });
  }
  return out;
}

function simplify(points, epsilon = 2.5) {
  if (points.length < 3) return points;
  const sq = epsilon * epsilon;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxD = 0;
    let index = -1;
    const a = points[first];
    const b = points[last];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len2 = dx * dx + dz * dz;
    for (let i = first + 1; i < last; i++) {
      const p = points[i];
      let d;
      if (len2 === 0) {
        d = (p.x - a.x) ** 2 + (p.z - a.z) ** 2;
      } else {
        const t = clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / len2, 0, 1);
        d = (p.x - (a.x + dx * t)) ** 2 + (p.z - (a.z + dz * t)) ** 2;
      }
      if (d > maxD) {
        maxD = d;
        index = i;
      }
    }
    if (maxD > sq && index > 0) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * A stage line from raw points: simplified, then either a centripetal
 * Catmull-Rom spline through the remaining vertices (`spline: true`, real
 * roads: no corner facets, finer samples in bends) or corner-cut and
 * resampled at `spacing` (generated rally lines).
 */
export function makeRoute(points, terrain, options = {}) {
  const smoothIterations = options.smooth ?? 2;
  const spacing = options.spacing ?? 4;
  const simplified = options.simplify === false ? points : simplify(points, options.simplifyEpsilon ?? 2.5);
  const sampled = options.spline
    ? splinePolyline(simplified, { maxStep: spacing })
    : resample(chaikin(simplified, smoothIterations), spacing);
  return new StageRoute(sampled, terrain, options);
}

/* ------------------------------------------------------------------ *
 *  A* over a drivability grid. It is not a road router — it is a       *
 *  rally-stage router: it prefers gentle ground and refuses to go      *
 *  straight down a cliff.                                              *
 * ------------------------------------------------------------------ */
function buildCostGrid(terrain, cells = 248, window = null) {
  const halfX = terrain.sizeX / 2;
  const halfZ = terrain.sizeZ / 2;
  const minX = window ? window.minX : -halfX;
  const maxX = window ? window.maxX : halfX;
  const minZ = window ? window.minZ : -halfZ;
  const maxZ = window ? window.maxZ : halfZ;
  const spanX = maxX - minX;
  const spanZ = maxZ - minZ;
  const cell = Math.max(spanX, spanZ) / cells;
  const n = Math.ceil(spanX / cell) + 1;
  const m = Math.ceil(spanZ / cell) + 1;
  const heights = new Float32Array(n * m);
  const slopes = new Float32Array(n * m);
  for (let j = 0; j < m; j++) {
    const z = minZ + j * cell;
    for (let i = 0; i < n; i++) {
      heights[j * n + i] = terrain.sample(minX + i * cell, z);
    }
  }
  for (let j = 0; j < m; j++) {
    for (let i = 0; i < n; i++) {
      const il = Math.max(0, i - 1);
      const ir = Math.min(n - 1, i + 1);
      const jl = Math.max(0, j - 1);
      const jr = Math.min(m - 1, j + 1);
      const gx = (heights[j * n + ir] - heights[j * n + il]) / ((ir - il) * cell);
      const gz = (heights[jr * n + i] - heights[jl * n + i]) / ((jr - jl) * cell);
      slopes[j * n + i] = Math.hypot(gx, gz);
    }
  }
  return { cell, n, m, heights, slopes, minX, minZ };
}

/**
 * A rally start should be a flat, dry little shelf, not the side of a cliff.
 * Look for the gentlest nearby spot, with a small preference for staying put.
 */
export function findFlatSpot(terrain, x, z, radius = 55) {
  let best = { x, z, slope: terrain.slope(x, z), score: terrain.slope(x, z) };
  for (let ring = 0; ring <= radius; ring += 4) {
    const steps = ring === 0 ? 1 : 20;
    for (let k = 0; k < steps; k++) {
      const angle = (k / steps) * Math.PI * 2;
      const px = x + Math.cos(angle) * ring;
      const pz = z + Math.sin(angle) * ring;
      if (!terrain.inside(px, pz, 20)) continue;
      if (terrain.sample(px, pz) < 6) continue;
      const slope = terrain.slope(px, pz);
      const score = slope + (ring / Math.max(1, radius)) * 0.11;
      if (score < best.score) best = { x: px, z: pz, slope, score };
    }
  }
  return { x: best.x, z: best.z, slope: best.slope };
}

export function generateRallyRoute(terrain, start, finish, { name = 'Rally stage', cells = 248, maxSlope = 0.78, window = null } = {}) {
  // Snap the start to a natural flat shelf so the car does not spawn on a
  // 35° sideways slope. The finish is snapped less aggressively.
  start = findFlatSpot(terrain, start.x, start.z, 65);
  finish = findFlatSpot(terrain, finish.x, finish.z, 24);
  const grid = buildCostGrid(terrain, cells, window);
  const { cell, n, heights, slopes, minX, minZ } = grid;
  const toIndex = (x, z) => ({
    i: clamp(Math.round((x - minX) / cell), 0, n - 1),
    j: clamp(Math.round((z - minZ) / cell), 0, grid.m - 1),
  });
  // A click can land a metre or two off the drivable grid cell because of the
  // flat-spot snap or the 8 m A* cell. Find the nearest cell a rally car can
  // actually use instead of failing on the first sample.
  const nearestDrivable = (i0, j0) => {
    for (let r = 0; r <= 40; r++) {
      let best = -1;
      let bestD = Infinity;
      for (let dj = -r; dj <= r; dj++) {
        for (let di = -r; di <= r; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
          const i = i0 + di;
          const j = j0 + dj;
          if (i < 0 || j < 0 || i >= n || j >= grid.m) continue;
          const idx = j * n + i;
          if (heights[idx] < 1.5 || slopes[idx] > maxSlope) continue;
          const d = di * di + dj * dj;
          if (d < bestD) {
            bestD = d;
            best = idx;
          }
        }
      }
      if (best >= 0) return best;
    }
    return -1;
  };
  const si = toIndex(start.x, start.z);
  const fi = toIndex(finish.x, finish.z);
  const startIdx = nearestDrivable(si.i, si.j);
  const finishIdx = nearestDrivable(fi.i, fi.j);
  if (startIdx < 0 || finishIdx < 0) {
    throw new Error('No gentle, dry ground near one of those points. Pick a spot further from the cliff edge.');
  }
  if (startIdx === finishIdx) {
    throw new Error('Those two points are practically the same place. Pick a finish further away.');
  }
  const total = n * grid.m;
  const gScore = new Float32Array(total).fill(Infinity);
  const cameFrom = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const open = new MinHeap();
  gScore[startIdx] = 0;
  open.push(0, startIdx);

  const dirs = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, -1, Math.SQRT2],
  ];

  let iterations = 0;
  let found = false;
  while (open.size && iterations++ < 240000) {
    const current = open.pop();
    if (closed[current]) continue;
    closed[current] = 1;
    if (current === finishIdx) {
      found = true;
      break;
    }
    const ci = current % n;
    const cj = (current / n) | 0;
    for (const [di, dj, mult] of dirs) {
      const ni = ci + di;
      const nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= n || nj >= grid.m) continue;
      const next = nj * n + ni;
      if (closed[next]) continue;
      const h = heights[next];
      if (h < 1.5) continue; // the fjord is not part of the stage
      const slope = slopes[next];
      if (slope > maxSlope) continue;
      // A rubber-band penalty for nasty ground, and a mild dislike of summits.
      let penalty = 1 + slope * slope * 13 + (slope > 0.34 ? 9 : 0) + (slope > 0.58 ? 22 : 0);
      if (h > 640) penalty += 4;
      const step = mult * cell * penalty;
      const tentative = gScore[current] + step;
      if (tentative < gScore[next]) {
        gScore[next] = tentative;
        cameFrom[next] = current;
        const dx = ni - fi.i;
        const dz = nj - fi.j;
        const heuristic = Math.hypot(dx, dz) * cell;
        open.push(tentative + heuristic, next);
      }
    }
  }

  if (!found) {
    throw new Error('No drivable link between those points. Try two spots on gentler ground.');
  }

  const raw = [];
  let p = finishIdx;
  while (p >= 0) {
    const i = p % n;
    const j = (p / n) | 0;
    raw.push({ x: minX + i * cell, z: minZ + j * cell });
    p = cameFrom[p];
  }
  raw.reverse();

  return makeRoute(raw, terrain, {
    name,
    source: 'generated',
    smooth: 3,
    spacing: 4,
    simplifyEpsilon: 2.2,
    roadWidth: LANES.one.half,
    cutHalf: LANES.one.cut,
  });
}

const STAGE_NAMES = [
  'Preikestolen Climb',
  'Fjord Rim Special',
  'Nervevarden Pass',
  'Hengjane Hairpins',
  'Lysefjord Drop',
  'Neravadalen Sprint',
  'The Pulpit Run',
  'Kjerag Approach',
];

/** Picks a random connected pair of gentle points and builds a stage. */
export function randomRallyRoute(terrain, random = Math.random) {
  const halfX = terrain.sizeX / 2 - 120;
  const halfZ = terrain.sizeZ / 2 - 120;
  let fallback = null;
  for (let attempt = 0; attempt < 34; attempt++) {
    const start = {
      x: (random() * 2 - 1) * halfX,
      z: (random() * 2 - 1) * halfZ,
    };
    const sh = terrain.sample(start.x, start.z);
    if (sh < 120 || sh > 610 || terrain.slope(start.x, start.z) > 0.42) continue;
    const angle = random() * Math.PI * 2;
    const distance = 700 + random() * 750;
    const finish = {
      x: clamp(start.x + Math.cos(angle) * distance, -halfX, halfX),
      z: clamp(start.z + Math.sin(angle) * distance, -halfZ, halfZ),
    };
    const fh = terrain.sample(finish.x, finish.z);
    if (fh < 80 || fh > 620 || terrain.slope(finish.x, finish.z) > 0.42) continue;
    try {
      const route = generateRallyRoute(terrain, start, finish, {
        name: STAGE_NAMES[Math.floor(random() * STAGE_NAMES.length)],
      });
      if (route.length > 650 && route.length < 4200) return route;
      fallback = route;
    } catch {
      // Keep looking for a connected pair.
    }
  }
  if (fallback) return fallback;
  // The hand-tuned route across the plateau, used if the random search has a bad day.
  return generateRallyRoute(terrain, { x: -710, z: 288 }, { x: 104, z: -245 }, {
    name: 'Preikestolen Climb',
  });
}

/* ------------------------------------------------------------------ *
 *  OSRM: real roads from the Open Source Routing Machine.             *
 * ------------------------------------------------------------------ */
const OSRM_ENDPOINTS = {
  driving: 'https://router.project-osrm.org/route/v1/driving',
  foot: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
  cycling: 'https://routing.openstreetmap.de/routed-bike/route/v1/bike',
};

function haversine(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const la = a.lat * Math.PI / 180;
  const lb = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** How far a start or finish pin may be from the nearest road (metres). */
export const SNAP_RADIUS = 1000;

/** OSRM route URL for the given points; `radiuses[i]` limits the snap of point i (null = unlimited). */
export function osrmRouteUrl(base, points, radiuses = null) {
  const coords = points.map((p) => `${p.lon},${p.lat}`).join(';');
  let url = `${base}/${coords}?overview=full&geometries=geojson&steps=false`;
  if (radiuses?.some((r) => r != null)) {
    url += `&radiuses=${points.map((_, i) => (radiuses[i] == null ? 'unlimited' : radiuses[i])).join(';')}`;
  }
  return url;
}

/** The first waypoint of an OSRM `/nearest` answer within `radius` metres, as `{ lat, lon, name, distance }`, or null. */
export function nearestWithin(data, radius = SNAP_RADIUS) {
  if (!data || data.code !== 'Ok') return null;
  for (const wp of data.waypoints || []) {
    if (!wp?.location) continue;
    const distance = wp.distance ?? 0;
    if (radius != null && distance > radius) continue;
    return { lat: wp.location[1], lon: wp.location[0], name: wp.name || null, distance };
  }
  return null;
}

/**
 * Snap a point to the nearest road of the profile with OSRM's `/nearest`
 * service, searching `radius` metres around it (null = unlimited). Resolves
 * to `{ lat, lon, name, distance }`, or null when no road lies within the
 * radius; throws when OSRM cannot be reached.
 */
export async function snapToRoad({ lat, lon }, { profile = 'driving', radius = SNAP_RADIUS } = {}) {
  const base = (OSRM_ENDPOINTS[profile] || OSRM_ENDPOINTS.driving).replace('/route/', '/nearest/');
  const url = `${base}/${lon},${lat}?number=3`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const data = await cache.fetch(url, async () => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`OSRM did not answer (HTTP ${response.status}).`);
      return response.json();
    }, { kind: 'osrm' });
    return nearestWithin(data, radius);
  } catch (error) {
    throw new Error(error?.name === 'AbortError' ? 'OSRM took too long to answer.' : error?.message || 'OSRM could not be reached.');
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Snap a point to the nearest road and work out the road's heading there
 * (from a short route along it). Used by free drive so the car always
 * starts on tarmac even before the chunk's own roads arrive. Returns
 * `{ lat, lon, heading, name, snapped }` (heading in radians, game yaw
 * convention: 0 = +z/south, π/2 = +x/east), or null when OSRM is down or
 * no road is near.
 */
export async function fetchOsrmNearest({ lat, lon }, { profile = 'driving' } = {}) {
  let snapped;
  try {
    snapped = await snapToRoad({ lat, lon }, { profile, radius: null });
  } catch {
    return null;
  }
  if (!snapped) return null;
  // Heading: route 250 m away and read the first leg's direction.
  let heading = 0;
  try {
    const away = { lat: snapped.lat + 0.0022, lon: snapped.lon + 0.004 };
    const geometry = await fetchOsrmGeometry({ a: snapped, b: away, profile });
    const c = geometry.coordinates;
    if (c.length >= 2) {
      const mPerLon = 111320 * Math.cos((snapped.lat * Math.PI) / 180);
      const dx = (c[1].lon - c[0].lon) * mPerLon;
      const dz = -(c[1].lat - c[0].lat) * 110950;
      heading = Math.atan2(dx, dz);
    }
  } catch {
    // No heading is fine; the road network corrects it once it has loaded.
  }
  return { lat: snapped.lat, lon: snapped.lon, name: snapped.name, snapped: snapped.distance, heading };
}

/**
 * Fetch the raw road geometry from OSRM. The result is in WGS84 lat/lon, so it
 * can be projected onto the current terrain — or used to generate a brand new
 * one anywhere in Norway. `radiuses` limits how far each end may snap
 * (default: SNAP_RADIUS for both; null entries are unlimited).
 */
export async function fetchOsrmGeometry({ a, b, profile = 'driving', radiuses = [SNAP_RADIUS, SNAP_RADIUS] }) {
  const base = OSRM_ENDPOINTS[profile] || OSRM_ENDPOINTS.driving;
  const url = osrmRouteUrl(base, [a, b], radiuses);
  const data = await cache.fetch(url, async () => {
    let response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('OSRM took too long to answer. Choose off-road routing, or try again.');
      }
      throw new Error('OSRM could not be reached. Check the connection, or choose off-road routing.');
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) throw new Error(`OSRM did not answer (HTTP ${response.status}).`);
    return response.json();
  }, { kind: 'osrm' });
  if (data.code === 'NoSegment') {
    throw new Error(`No ${profile} road within ${SNAP_RADIUS / 1000} km of a picked point. Move the pin nearer a mapped road/trail, or route by off-road.`);
  }
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(data.message || 'OSRM found no route between those coordinates.');
  }

  const routeData = data.routes[0];
  const snappedA = data.waypoints?.[0]?.distance ?? null;
  const snappedB = data.waypoints?.[1]?.distance ?? null;
  const snapText = snappedA != null && snappedB != null
    ? ` Snapped ${Math.round(snappedA)} m / ${Math.round(snappedB)} m from the picked points.`
    : '';

  // A 30 m route from two points 300 m apart means OSRM snapped both picks to
  // the same trailhead or road stub. Preikestolen's hiking paths do this a lot.
  const straight = haversine(a, b);
  if (routeData.distance < 25 || (straight > 80 && routeData.distance < straight * 0.35)) {
    throw new Error(
      `OSRM snapped both points to the same road or trail (${Math.round(routeData.distance)} m route for a ${Math.round(straight)} m gap).${snapText} Pick points on a mapped road/trail, or route by off-road.`,
    );
  }
  // The pins are snapped to the nearest road within SNAP_RADIUS before the
  // request, and the request itself carries that radius; this only catches
  // an unlimited end (a segment joint) that wandered off.
  if ((snappedA != null && snappedA > SNAP_RADIUS) || (snappedB != null && snappedB > SNAP_RADIUS)) {
    throw new Error(
      `OSRM snapped a point ${Math.round(Math.max(snappedA ?? 0, snappedB ?? 0))} m away from where you picked, too far to make a fair stage.${snapText} Pick points nearer to a mapped road/trail, or route by off-road.`,
    );
  }

  const coordinates = routeData.geometry.coordinates
    .map(([lon, lat]) => ({ lat, lon }));
  if (coordinates.length < 2) throw new Error('OSRM returned an empty geometry.');

  return {
    coordinates,
    distance: routeData.distance,
    duration: routeData.duration,
    profile,
    snapped: { a: snappedA, b: snappedB },
    snapText,
  };
}

/* ------------------------------------------------------------------ *
 *  Phase 1 (V5 plan): long routes are requested in < 5 km segments.    *
 *                                                                      *
 *  The straight line between the two picks is divided into ~4 km hops, *
 *  OSRM is asked for each hop in turn, and the returned geometries are *
 *  merged into one master track. Segmenting keeps each request small   *
 *  (the public OSRM servers time out or degrade long routes), and the  *
 *  merged track is what the streaming world generator consumes.        *
 * ------------------------------------------------------------------ */
export const MAX_STAGE_LENGTH = 30000;   // metres of merged master track
const SEGMENT_LENGTH = 4000;             // metres of straight line per request

function interpolateGeo(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t };
}

export async function fetchOsrmGeometrySegmented({
  a,
  b,
  profile = 'driving',
  onProgress = null,
  segmentLength = SEGMENT_LENGTH,
} = {}) {
  const straight = haversine(a, b);
  const hops = Math.max(1, Math.ceil(straight / segmentLength));
  // Within ~1.2 segments a single request is both faster and more accurate.
  if (hops <= 1) {
    const geometry = await fetchOsrmGeometry({ a, b, profile });
    onProgress?.(1, 'Route received.');
    return geometry;
  }

  const anchors = [];
  for (let i = 0; i <= hops; i++) anchors.push(interpolateGeo(a, b, i / hops));

  const coordinates = [];
  let distance = 0;
  let duration = 0;
  let snapped = { a: null, b: null };
  const t0 = performance.now();
  for (let i = 0; i < hops; i++) {
    onProgress?.(i / hops, `OSRM segment ${i + 1} of ${hops}…`);
    // Only the two real ends are held to the snap radius; the joints along
    // the straight line between them may lie anywhere and snap to any road.
    const radiuses = [i === 0 ? SNAP_RADIUS : null, i === hops - 1 ? SNAP_RADIUS : null];
    const geometry = await fetchOsrmGeometry({ a: anchors[i], b: anchors[i + 1], profile, radiuses });
    const startAt = coordinates.length ? 1 : 0; // skip the duplicated joint
    for (let k = startAt; k < geometry.coordinates.length; k++) {
      coordinates.push(geometry.coordinates[k]);
    }
    distance += geometry.distance;
    duration += geometry.duration;
    if (i === 0) snapped.a = geometry.snapped?.a ?? null;
    snapped.b = geometry.snapped?.b ?? null;
  }
  onProgress?.(1, `Merged ${hops} segments.`);

  if (coordinates.length < 2) throw new Error('The segmented route came back empty.');
  const km = (distance / 1000).toFixed(1);
  if (distance > MAX_STAGE_LENGTH) {
    throw new Error(
      `That route is ${km} km long. The streamer covers stages up to `
      + `${Math.round(MAX_STAGE_LENGTH / 1000)} km — pick closer points.`,
    );
  }
  log.debug(`segmented OSRM route: ${hops} hops, ${km} km in ${(performance.now() - t0).toFixed(0)} ms`);
  return {
    coordinates,
    distance,
    duration,
    profile,
    snapped,
    snapText: '',
    segmented: { hops, segmentLength },
  };
}

/**
 * A grid-hash of the route samples for cheap "how far am I from the road?"
 * checks. `route.nearest()` scans every sample; the scatter code asks that
 * thousands of times per chunk, so it queries the hash instead.
 */
export function buildRouteIndex(route, cell = 48) {
  const buckets = new Map();
  const key = (bx, bz) => `${bx},${bz}`;
  route.samples.forEach((p, i) => {
    const bx = Math.floor(p.x / cell);
    const bz = Math.floor(p.z / cell);
    const k = key(bx, bz);
    let list = buckets.get(k);
    if (!list) buckets.set(k, (list = []));
    list.push(i);
  });
  const tangentAt = (i) => {
    const a = route.samples[Math.max(0, i - 1)];
    const b = route.samples[Math.min(route.samples.length - 1, i + 1)];
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    return { x: (b.x - a.x) / l, z: (b.z - a.z) / l };
  };
  return {
    cell,
    /** Nearest sample within `limit`: `{ distance, tangent }` (distance > limit when none). */
    nearest(x, z, limit = 40) {
      const bx = Math.floor(x / cell);
      const bz = Math.floor(z / cell);
      const r = Math.ceil(limit / cell);
      let best = Infinity;
      let bi = -1;
      for (let dj = -r; dj <= r; dj++) {
        for (let di = -r; di <= r; di++) {
          const list = buckets.get(key(bx + di, bz + dj));
          if (!list) continue;
          for (const i of list) {
            const p = route.samples[i];
            const d = Math.hypot(p.x - x, p.z - z);
            if (d < best) { best = d; bi = i; }
          }
        }
      }
      if (bi < 0) return { distance: limit + cell, tangent: null, roadY: null };
      // Refine on the two segments at the nearest sample: exact distance,
      // interpolated height, the segment's direction and grade.
      const s = route.samples;
      const yOf = (p) => p.roadY ?? p.y ?? 0;
      let out = { distance: best, tangent: tangentAt(bi), roadY: s[bi].roadY ?? s[bi].y ?? null, point: { x: s[bi].x, z: s[bi].z }, grade: 0, width: route.roadWidth, bridge: Boolean(s[bi].bridge) };
      for (const [p0, p1] of [[s[Math.max(0, bi - 1)], s[bi]], [s[bi], s[Math.min(s.length - 1, bi + 1)]]]) {
        const dx = p1.x - p0.x; const dz = p1.z - p0.z; const l2 = dx * dx + dz * dz;
        if (l2 < 1e-6) continue;
        const t = clamp(((x - p0.x) * dx + (z - p0.z) * dz) / l2, 0, 1);
        const d = Math.hypot(x - (p0.x + dx * t), z - (p0.z + dz * t));
        if (d > out.distance + 1e-9) continue;
        const l = Math.sqrt(l2);
        out = { distance: d, tangent: { x: dx / l, z: dz / l }, roadY: yOf(p0) + (yOf(p1) - yOf(p0)) * t, point: { x: p0.x + dx * t, z: p0.z + dz * t }, grade: (yOf(p1) - yOf(p0)) / l, width: route.roadWidth, bridge: Boolean(p0.bridge && p1.bridge) };
      }
      return out;
    },
    /** Distance to the nearest sample, capped at `limit` (returns > limit when farther). */
    distanceTo(x, z, limit = 40) {
      const bx = Math.floor(x / cell);
      const bz = Math.floor(z / cell);
      const r = Math.ceil(limit / cell);
      let best = Infinity;
      for (let dj = -r; dj <= r; dj++) {
        for (let di = -r; di <= r; di++) {
          const list = buckets.get(key(bx + di, bz + dj));
          if (!list) continue;
          for (const i of list) {
            const p = route.samples[i];
            const d = Math.hypot(p.x - x, p.z - z);
            if (d < best) best = d;
          }
        }
      }
      return best === Infinity ? limit + cell : best;
    },
  };
}

/** Project an OSRM geometry onto an existing terrain and build a StageRoute. */
export function buildOsrmRoute(terrain, geometry, { requireInside = true } = {}) {
  const { coordinates, profile, snapText = '', snapped = {} } = geometry;
  const points = [];
  let outside = 0;
  for (const { lat, lon } of coordinates) {
    const p = terrain.worldFromLatLon(lat, lon);
    if (requireInside && !terrain.inside(p.x, p.z, 4)) outside++;
    points.push(p);
  }
  if (outside > 0) {
    throw new Error(`That road leaves the ${(terrain.sizeX / 1000).toFixed(0)} km terrain (${outside} of ${points.length} points outside). Generate a world for it from the 2D map.`);
  }
  if (points.length < 2) throw new Error('OSRM returned an empty geometry.');

  const route = makeRoute(points, terrain, {
    name: `${profile === 'foot' ? 'Footpath' : profile === 'cycling' ? 'Bike trail' : 'OSRM road'} stage`,
    source: 'osrm',
    smooth: 1,
    spline: true,
    spacing: 5,
    simplifyEpsilon: 2,
    roadWidth: profile === 'driving' ? LANES.two.half : LANES.one.half,
    cutHalf: profile === 'driving' ? LANES.two.cut : LANES.one.cut,
    surface: profile === 'driving' ? 'asphalt' : 'gravel',
  });
  if (route.length < 20) {
    throw new Error(`That road is too short to make a stage (${Math.round(route.length)} m).${snapText}`);
  }
  return {
    route,
    distance: geometry.distance,
    duration: geometry.duration,
    profile,
    snapped,
  };
}

export async function fetchOsrmRoute(terrain, { a, b, profile = 'driving' }) {
  const geometry = await fetchOsrmGeometry({ a, b, profile });
  return buildOsrmRoute(terrain, geometry);
}

/* ------------------------------------------------------------------ *
 *  Visuals: gravel ribbon, marker posts, start and finish gates.       *
 * ------------------------------------------------------------------ */
function createGateTexture(label, accent = '#f2c14e') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(18,22,20,0.92)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = accent;
  ctx.font = 'bold 112px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 6);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCheckerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#131716' : '#e8e7db';
      ctx.fillRect(x * 8, y * 8, 8, 8);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

function buildGate(route, terrain, atStart) {
  const gateIndex = atStart
    ? Math.min(3, route.samples.length - 1)
    : Math.max(0, route.samples.length - 1);
  const sample = route.samples[gateIndex];
  const near = atStart
    ? route.samples[Math.min(gateIndex + 3, route.samples.length - 1)]
    : route.samples[Math.max(0, gateIndex - 3)];
  const yaw = Math.atan2(near.x - sample.x, near.z - sample.z);
  const group = new THREE.Group();
  group.position.set(sample.x, terrain.sample(sample.x, sample.z) + 0.1, sample.z);
  group.rotation.y = yaw;

  const width = route.roadWidth * 2 + 2.6;
  const postMat = new THREE.MeshLambertMaterial({ color: atStart ? 0x2f8f5b : 0xc94f3d });
  const postGeo = new THREE.CylinderGeometry(0.22, 0.28, 5.4, 6);
  for (const x of [-width / 2, width / 2]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(x, 2.7, 0);
    post.castShadow = true;
    group.add(post);
  }

  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.7, 0.45, 0.5),
    new THREE.MeshLambertMaterial({ color: atStart ? 0x2f8f5b : 0xc94f3d }),
  );
  beam.position.y = 5.25;
  beam.castShadow = true;
  group.add(beam);

  // Two one-sided banners back to back, so the lettering reads correctly from
  // either side of the gate instead of being mirrored on one of them.
  const bannerTexture = createGateTexture(atStart ? 'START' : 'FINISH', atStart ? '#7fe6a8' : '#ffd75e');
  const bannerGeo = new THREE.PlaneGeometry(width * 0.86, 1.55);
  const bannerFront = new THREE.Mesh(
    bannerGeo,
    new THREE.MeshBasicMaterial({ map: bannerTexture, side: THREE.FrontSide, toneMapped: false }),
  );
  bannerFront.position.set(0, 4.35, 0.03);
  const bannerBack = new THREE.Mesh(
    bannerGeo,
    new THREE.MeshBasicMaterial({ map: bannerTexture, side: THREE.FrontSide, toneMapped: false }),
  );
  bannerBack.position.set(0, 4.35, -0.03);
  bannerBack.rotation.y = Math.PI;
  group.add(bannerFront, bannerBack);

  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(width, 2.8),
    new THREE.MeshBasicMaterial({
      map: createCheckerTexture(),
      side: THREE.DoubleSide,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    }),
  );
  line.rotation.x = -Math.PI / 2;
  line.position.y = 0.3;
  group.add(line);

  group.userData.line = line;
  return group;
}

/**
 * Build the gravel ribbon, marker posts and start/finish gates.
 *
 * With no `bounds` this renders the whole route (the classic single-world
 * path). With `bounds = { minX, maxX, minZ, maxZ }` only the samples, posts
 * and gates inside the rectangle are built — that is how the streaming world
 * adds its slice of the road when a 2 km chunk loads.
 */
export function buildRoadVisuals(route, terrain, { bounds = null, gates = 'both', posts = true } = {}) {
  const all = route.samples;
  const inBounds = (p) => !bounds
    || (p.x >= bounds.minX && p.x <= bounds.maxX && p.z >= bounds.minZ && p.z <= bounds.maxZ);

  // Contiguous runs of in-bounds samples; the route can leave and re-enter a
  // chunk rectangle, so the ribbon is split where the index jumps.
  const runs = [];
  let run = null;
  for (let i = 0; i < all.length; i++) {
    if (!inBounds(all[i])) {
      run = null;
      continue;
    }
    if (run && i === run.end + 1) {
      run.end = i;
    } else {
      run = { start: i, end: i };
      runs.push(run);
    }
  }

  const group = new THREE.Group();
  group.name = 'road';

  for (const { start, end } of runs) {
    if (end - start < 1) continue;
    group.add(buildRibbon(route, terrain, start, end));
  }
  const ground = (x, z) => (terrain.sampleBase ? terrain.sampleBase(x, z) : terrain.sample(x, z));
  const bridges = buildBridgeMesh(runs.filter((r) => r.end > r.start).map((r) => ({ samples: all.slice(r.start, r.end + 1), half: route.roadWidth })), ground);
  if (bridges) group.add(bridges);
  group.userData.bridgeBoxes = bridges?.userData.boxes || [];

  if (posts) group.add(buildPosts(route, terrain, inBounds));

  const startHere = (gates === 'both' || gates === 'start') && inBounds(all[0]);
  const finishHere = (gates === 'both' || gates === 'finish') && inBounds(all[all.length - 1]);
  if (startHere) group.add(buildGate(route, terrain, true));
  if (finishHere) group.add(buildGate(route, terrain, false));

  return group;
}

export function buildRibbon(route, terrain, from, to, { paved = false } = {}) {
  const samples = route.samples;
  const count = to - from + 1;
  const half = route.roadWidth;
  const shoulder = ROAD_SHOULDER;
  const ROWS = 6;
  const positions = new Float32Array(count * ROWS * 3);
  const colors = new Float32Array(count * ROWS * 3);
  const indices = [];

  const cGravel = new THREE.Color(paved ? 0x4b4d4f : 0x7d7769);
  const cGravelDark = new THREE.Color(paved ? 0x434547 : 0x625d52);
  const cShoulder = new THREE.Color(paved ? 0x5a5a52 : 0x4d5146);
  const cEdge = new THREE.Color(paved ? 0xd9d6c8 : 0x8f8877);
  const cSkirt = new THREE.Color(0x333a35);
  const cAsphalt = new THREE.Color(0x4b4d4f);
  const cAsphaltDark = new THREE.Color(0x434547);
  const cAsphaltShoulder = new THREE.Color(0x5a5a52);
  const cCentreLine = new THREE.Color(0xd9d6c8);
  const tmp = new THREE.Color();

  // Graded roads (`roadY`) lie on their profile: a straight line across from
  // shoulder to shoulder (the centre height plus the crossfall `bank`), the
  // same surface the carve and the car use. Ungraded lines are draped on the
  // terrain with every edge clamped against the centre line so the slab never
  // tips over or sinks into a crest. Both float a hair above the ground, with
  // a short skirt hanging off both shoulders so the road reads as a solid ribbon.
  const tiltLimit = Math.max(0.5, half * 1.15);
  for (let i = 0; i < count; i++) {
    const gi = from + i;
    const p = samples[gi];
    const prev = samples[Math.max(from, gi - 1)];
    const next = samples[Math.min(to, gi + 1)];
    let tx = next.x - prev.x;
    let tz = next.z - prev.z;
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl; tz /= tl;
    const nx = -tz;
    const nz = tx;
    const fun = i < 3 || i > count - 4 ? 1 : 0.55;
    const pavedHere = paved || p.surface === 'asphalt';
    const graded = p.roadY != null;
    const centerY = graded ? p.roadY + ROAD_LIFT : terrain.sample(p.x, p.z);
    const stripe = Math.floor((p.s ?? i * 5) / 5); // colour pattern by distance, not by sample
    const lift = ROAD_RIBBON_LIFT;
    for (let k = 0; k < ROWS; k++) {
      const offset = k <= 2
        ? -(k === 0 ? half + shoulder : k === 1 ? half + shoulder : half)
        : (k === 3 ? half : k === 4 ? half + shoulder : half + shoulder);
      const x = p.x + nx * offset;
      const z = p.z + nz * offset;
      let edgeY;
      if (graded) edgeY = centerY + (p.bank || 0) * offset;
      else {
        edgeY = terrain.sample(x, z);
        if (k === 0 || k === 1 || k === 4 || k === 5) edgeY = centerY + clamp(edgeY - centerY, -tiltLimit, tiltLimit);
      }
      const crown = k === 2 || k === 3 ? ROAD_CROWN : 0;
      const drop = k === 0 || k === 5 ? 0.55 : 0;
      const vi = (i * ROWS + k) * 3;
      positions[vi] = x;
      positions[vi + 1] = edgeY + lift + crown - drop;
      positions[vi + 2] = z;

      if (k === 0 || k === 5) tmp.copy(cSkirt);
      else if (k === 1 || k === 4) tmp.copy(pavedHere ? cAsphaltShoulder : cShoulder);
      else if (pavedHere) tmp.copy(stripe % 17 === 0 ? cCentreLine : stripe % 5 === 0 ? cAsphaltDark : cAsphalt);
      else if (stripe % 17 === 0) tmp.copy(cEdge);
      else tmp.copy(stripe % 5 === 0 ? cGravelDark : cGravel);
      tmp.multiplyScalar(0.92 + fun * 0.08);
      colors[vi] = tmp.r;
      colors[vi + 1] = tmp.g;
      colors[vi + 2] = tmp.b;
    }
    if (i < count - 1) {
      const a = i * ROWS;
      const b = (i + 1) * ROWS;
      for (let k = 0; k < ROWS - 1; k++) {
        indices.push(a + k, b + k, a + k + 1);
        indices.push(a + k + 1, b + k, b + k + 1);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.name = 'roadRibbon';
  return mesh;
}

/** Red-and-white rally marker posts along the road edge, filtered by bounds. */
function buildPosts(route, terrain, inBounds) {
  const half = route.roadWidth;
  const postGeo = new THREE.CylinderGeometry(0.065, 0.085, 1.15, 5);
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xf4efe1 });
  const redMat = new THREE.MeshBasicMaterial({ color: 0xcf3e32 });
  const posts = [];
  const step = 26;
  for (let d = 18; d < route.length - 12; d += step) {
    const p = route.sampleAtDistance(d);
    if (!inBounds(p) || p.bridge) continue; // the guard rail marks the edge on a bridge
    const prev = route.sampleAtDistance(d - 3);
    const next = route.sampleAtDistance(d + 3);
    const tx = next.x - prev.x;
    const tz = next.z - prev.z;
    const tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl;
    const nz = tx / tl;
    const side = Math.round(d / step) % 2 ? 1 : -1;
    const x = p.x + nx * (half + 1.2) * side;
    const z = p.z + nz * (half + 1.2) * side;
    posts.push({ x, z, y: terrain.sample(x, z) + 0.55, red: side > 0 });
  }
  const whitePosts = posts.filter((p) => !p.red);
  const redPosts = posts.filter((p) => p.red);
  const makePosts = (list, mat) => {
    const inst = new THREE.InstancedMesh(postGeo, mat, Math.max(1, list.length));
    const m = new THREE.Matrix4();
    list.forEach((p, i) => {
      m.makeTranslation(p.x, p.y, p.z);
      inst.setMatrixAt(i, m);
    });
    inst.count = list.length;
    inst.instanceMatrix.needsUpdate = true;
    return inst;
  };
  const group = new THREE.Group();
  group.name = 'roadPosts';
  group.add(makePosts(whitePosts, whiteMat), makePosts(redPosts, redMat));
  return group;
}

