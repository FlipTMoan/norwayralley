import * as THREE from 'three';
import { logger } from './log.js';

/**
 * Inland water for one terrain chunk, from the OpenStreetMap features that
 * `fetchOsmChunk` (buildings.js) returns:
 *
 *   waterways  – river / stream / canal / drain / ditch centre lines
 *   areas      – polygons with `kind === 'water'` (lakes, ponds, reservoirs)
 *
 * Rivers become a ribbon strip along the centre line, built the same way as
 * the gravel road in stage.js: cross sections every ~6 m draped on the
 * terrain, with a short skirt hanging off both banks. The surface height is
 * the lowest of centre/left/right at each station so the water lies in the
 * valley floor instead of tilting with the bank, and it is forced to never
 * run uphill between stations. Lakes are flat polygons at a level taken from
 * a low percentile of the terrain under them.
 *
 * A chunk draws only what lies inside its square (+2 m margin): polylines
 * are cut at the chunk bounds and a lake belongs to the chunk holding its
 * centroid, so neighbouring chunks never double-draw.
 */

const log = logger('water');

export const SEA_LEVEL = 0.45;   // the sea plane; DTM sea/nodata cells are height 0
const SEA_DEPTH = 2.5;           // how deep the fjord counts once the ground is at 0
const RIVER_STEP = 6;
const CHUNK_MARGIN = 2;
const SURFACE_LIFT = 0.12;
const LAKE_LIFT = 0.25;
const SKIRT_DROP = 0.6;
const SKIRT_OUT = 0.3;
const MIN_LAKE_AREA = 60;
const LAKE_GRID = 6;

const WIDTHS = { canal: 5, stream: 2.4, drain: 1.4, ditch: 1.0 };

const WATER_COLOR = 0x2a6f8a;
const WATER_EMISSIVE = 0x0b2a38;

export function riverWidth(way) {
  if (way.kind === 'river') {
    const w = Number(way.width);
    return w > 0 ? Math.min(Math.max(w, 4), 40) : 9;
  }
  return WIDTHS[way.kind] || 2.4;
}

/* ------------------------------------------------------------------ *
 *  Polyline helpers                                                    *
 * ------------------------------------------------------------------ */

/**
 * Clip a polyline of `{x, z}` points to the rectangle
 * `{minX, maxX, minZ, maxZ}`. Returns an array of polylines: a line that
 * leaves and re-enters the box becomes several pieces, cut exactly at the
 * box edges (Liang–Barsky per segment).
 */
export function clipPolyline(points, bounds) {
  const pieces = [];
  let piece = null;
  const close = () => {
    if (piece && piece.length >= 2) pieces.push(piece);
    piece = null;
  };
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    let t0 = 0;
    let t1 = 1;
    let ok = true;
    for (const [p, q] of [
      [-dx, a.x - bounds.minX], [dx, bounds.maxX - a.x],
      [-dz, a.z - bounds.minZ], [dz, bounds.maxZ - a.z],
    ]) {
      if (p === 0) {
        if (q < 0) { ok = false; break; }
        continue;
      }
      const t = q / p;
      if (p < 0) { if (t > t1) { ok = false; break; } if (t > t0) t0 = t; }
      else { if (t < t0) { ok = false; break; } if (t < t1) t1 = t; }
    }
    if (!ok) { close(); continue; }
    if (t0 > 0 || !piece) {
      close();
      piece = [{ x: a.x + dx * t0, z: a.z + dz * t0 }];
    }
    piece.push({ x: a.x + dx * t1, z: a.z + dz * t1 });
    if (t1 < 1) close();
  }
  close();
  return pieces;
}

/**
 * Insert points so consecutive samples are at most `step` apart (evenly
 * spaced within each segment). Original vertices are kept.
 */
export function resamplePolyline(points, step) {
  if (points.length < 2) return points.slice();
  const out = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(1, Math.ceil(len / step));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      out.push(k === n ? b : { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
    }
  }
  return out;
}

function projectPoints(points, terrain) {
  const out = [];
  for (const p of points) {
    const w = terrain.worldFromLatLon(p.lat, p.lon);
    if (Number.isFinite(w.x) && Number.isFinite(w.z)) out.push({ x: w.x, z: w.z });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 *  Rivers                                                              *
 * ------------------------------------------------------------------ */

const ROWS = 5; // skirt L, bank L, centre, bank R, skirt R

/** Append one river ribbon to the shared vertex buffers. */
function appendRibbon(points, half, terrain, buf) {
  const count = points.length;
  const tangents = [];
  const heights = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const p = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(count - 1, i + 1)];
    let tx = next.x - prev.x;
    let tz = next.z - prev.z;
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl; tz /= tl;
    const nx = -tz;
    const nz = tx;
    tangents.push([nx, nz]);
    heights[i] = Math.min(
      terrain.sample(p.x, p.z),
      terrain.sample(p.x - nx * half, p.z - nz * half),
      terrain.sample(p.x + nx * half, p.z + nz * half),
    ) + SURFACE_LIFT;
  }

  // Symmetric 5-tap running minimum, then force the surface monotonically
  // downhill towards the lower end so no station is higher than the one
  // upstream of it.
  const smooth = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    let m = Infinity;
    for (let k = Math.max(0, i - 2); k <= Math.min(count - 1, i + 2); k++) m = Math.min(m, heights[k]);
    smooth[i] = m;
  }
  if (smooth[0] >= smooth[count - 1]) {
    for (let i = 1; i < count; i++) smooth[i] = Math.min(smooth[i], smooth[i - 1]);
  } else {
    for (let i = count - 2; i >= 0; i--) smooth[i] = Math.min(smooth[i], smooth[i + 1]);
  }

  const base = buf.positions.length / 3;
  const cCentre = new THREE.Color(0x1f5a70);
  const cBank = new THREE.Color(0x3f8da2);
  const cSkirt = new THREE.Color(0x163f4f);
  for (let i = 0; i < count; i++) {
    const p = points[i];
    const [nx, nz] = tangents[i];
    const y = smooth[i];
    for (let k = 0; k < ROWS; k++) {
      const skirt = k === 0 || k === ROWS - 1;
      const side = k < 2 ? -1 : k > 2 ? 1 : 0;
      const offset = side * (skirt ? half + SKIRT_OUT : half);
      buf.positions.push(p.x + nx * offset, y - (skirt ? SKIRT_DROP : 0), p.z + nz * offset);
      const c = skirt ? cSkirt : k === 2 ? cCentre : cBank;
      buf.colors.push(c.r, c.g, c.b);
    }
    if (i < count - 1) {
      const a = base + i * ROWS;
      const b = a + ROWS;
      for (let k = 0; k < ROWS - 1; k++) {
        buf.indices.push(a + k, b + k, a + k + 1);
        buf.indices.push(a + k + 1, b + k, b + k + 1);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 *  Lakes                                                               *
 * ------------------------------------------------------------------ */

function polygonArea(ring) {
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) s += ring[j].x * ring[i].z - ring[i].x * ring[j].z;
  return s / 2;
}

function polygonCentroid(ring, area) {
  let cx = 0;
  let cz = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j].x * ring[i].z - ring[i].x * ring[j].z;
    cx += (ring[j].x + ring[i].x) * f;
    cz += (ring[j].z + ring[i].z) * f;
  }
  return { x: cx / (6 * area), z: cz / (6 * area) };
}

export function pointInRing(x, z, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

/** 20th percentile of the terrain under the ring vertices and an interior grid. */
function ringBounds(ring) {
  let minX = Infinity; let maxX = -Infinity; let minZ = Infinity; let maxZ = -Infinity;
  for (const p of ring) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  }
  return { minX, maxX, minZ, maxZ };
}

/** Squared distance from (x, z) to the polyline. */
function polylineDist2(x, z, points) {
  let best = Infinity;
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i]; const b = points[i + 1];
    const dx = b.x - a.x; const dz = b.z - a.z;
    const len2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / len2));
    const ex = a.x + dx * t - x; const ez = a.z + dz * t - z;
    best = Math.min(best, ex * ex + ez * ez);
  }
  return best;
}

/**
 * Water at (x, z) as `{ depth, surface }`: the depth over the ground and the
 * height of the surface. The sea where the DTM is at height 0 (counted
 * deep), the fjord shore between 0 and the sea plane, a lake's level inside
 * its outline, or a river's nominal depth within its ribbon. Dry land has
 * depth 0 and the ground as its surface.
 *
 * @param bodies `userData.bodies` of a chunk's water group (may be null)
 */
export function waterAt(bodies, terrain, x, z) {
  const ground = terrain.sample(x, z);
  let depth = ground < 0.1 ? SEA_DEPTH : Math.max(0, SEA_LEVEL - ground);
  let surface = depth > 0 ? SEA_LEVEL : ground;
  const deeper = (d, s) => { if (d > depth) { depth = d; surface = s; } };
  if (bodies) {
    for (const lake of bodies.lakes) {
      if (x < lake.minX || x > lake.maxX || z < lake.minZ || z > lake.maxZ) continue;
      if (pointInRing(x, z, lake.ring)) deeper(lake.level - ground, lake.level);
    }
    for (const river of bodies.rivers) {
      if (polylineDist2(x, z, river.points) <= river.half * river.half) deeper(river.depth, ground + river.depth);
    }
  }
  return { depth, surface };
}

function lakeLevel(ring, terrain) {
  const hs = ring.map((p) => terrain.sample(p.x, p.z));
  let minX = Infinity; let maxX = -Infinity; let minZ = Infinity; let maxZ = -Infinity;
  for (const p of ring) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  }
  for (let j = 0; j < LAKE_GRID; j++) {
    for (let i = 0; i < LAKE_GRID; i++) {
      const x = minX + ((i + 0.5) / LAKE_GRID) * (maxX - minX);
      const z = minZ + ((j + 0.5) / LAKE_GRID) * (maxZ - minZ);
      if (pointInRing(x, z, ring)) hs.push(terrain.sample(x, z));
    }
  }
  hs.sort((a, b) => a - b);
  return hs[Math.floor(hs.length * 0.2)] + LAKE_LIFT;
}

/** Append one flat lake polygon to the shared vertex buffers. */
function appendLake(ring, y, buf) {
  // Shape (x, -z) rotated by -90° about x lands on (x, 0, z) with its face up.
  const shape = new THREE.Shape(ring.map((p) => new THREE.Vector2(p.x, -p.z)));
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position.array;
  const base = buf.positions.length / 3;
  for (let i = 0; i < pos.length; i += 3) buf.positions.push(pos[i], y, pos[i + 2]);
  const idx = geo.index.array;
  for (let i = 0; i < idx.length; i++) buf.indices.push(base + idx[i]);
  geo.dispose();
}

/* ------------------------------------------------------------------ *
 *  Chunk assembly                                                      *
 * ------------------------------------------------------------------ */

function meshFrom(buf, name, vertexColors) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(buf.positions, 3));
  if (vertexColors) geometry.setAttribute('color', new THREE.Float32BufferAttribute(buf.colors, 3));
  geometry.setIndex(buf.indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshLambertMaterial({
    color: vertexColors ? 0xffffff : WATER_COLOR,
    emissive: WATER_EMISSIVE,
    vertexColors,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    depthWrite: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

/**
 * Build the rivers and lakes of one chunk.
 *
 * @param features   `{ waterways, areas }` from fetchOsmChunk
 * @param terrain    the streaming terrain (needs worldFromLatLon/sample)
 * @param chunk      `{ x0, z0, size }` – the chunk square in world metres
 * @param routeIndex accepted for symmetry with the other builders; water is
 *                   never suppressed near the road (the road bridges it)
 * @returns a Group named 'water' with `userData = { rivers, lakes }`, or null
 */
export function buildChunkWater({ waterways = [], areas = [] }, terrain, { x0, z0, size }, { routeIndex = null } = {}) {
  const bounds = {
    minX: x0 - CHUNK_MARGIN, maxX: x0 + size + CHUNK_MARGIN,
    minZ: z0 - CHUNK_MARGIN, maxZ: z0 + size + CHUNK_MARGIN,
  };
  const rivers = { positions: [], colors: [], indices: [] };
  const lakes = { positions: [], colors: [], indices: [] };
  const bodies = { lakes: [], rivers: [] };
  let riverCount = 0;
  let lakeCount = 0;

  for (const way of waterways) {
    if (!way.points || way.points.length < 2) continue;
    const half = riverWidth(way) / 2;
    for (const piece of clipPolyline(projectPoints(way.points, terrain), bounds)) {
      appendRibbon(resamplePolyline(piece, RIVER_STEP), half, terrain, rivers);
      bodies.rivers.push({ points: piece, half, depth: Math.min(0.7, Math.max(0.2, half * 0.12)) });
      riverCount++;
    }
  }

  for (const area of areas) {
    if (area.kind !== 'water' || !area.rings?.length) continue;
    const ring = projectPoints(area.rings[0], terrain);
    if (ring.length >= 2 && ring[0].x === ring[ring.length - 1].x && ring[0].z === ring[ring.length - 1].z) ring.pop();
    if (ring.length < 3) continue;
    const area2 = polygonArea(ring);
    if (Math.abs(area2) < MIN_LAKE_AREA) continue;
    const c = polygonCentroid(ring, area2);
    if (c.x < x0 || c.x >= x0 + size || c.z < z0 || c.z >= z0 + size) continue;
    const level = lakeLevel(ring, terrain);
    appendLake(ring, level, lakes);
    bodies.lakes.push({ ring, level, ...ringBounds(ring) });
    lakeCount++;
  }

  if (!riverCount && !lakeCount) return null;
  const group = new THREE.Group();
  group.name = 'water';
  if (riverCount) group.add(meshFrom(rivers, 'rivers', true));
  if (lakeCount) group.add(meshFrom(lakes, 'lakes', false));
  group.userData = { rivers: riverCount, lakes: lakeCount, bodies };
  log.debug(`chunk ${x0},${z0}: ${riverCount} river pieces, ${lakeCount} lakes`);
  return group;
}
