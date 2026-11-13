import * as THREE from 'three';
import { clamp, hash2, lerp, smoothstep, localProjection } from './geo.js';
import { terrainColor } from './terrain.js';
import { fetchDem } from './worldgen.js';
import { makeRoute, buildRoadVisuals, buildRouteIndex } from './stage.js';
import { fetchBuildings, buildChunkHouses } from './buildings.js';
import { logger } from './log.js';

/**
 * Phase 2 (V5 plan): dynamic terrain chunking & elevation.
 *
 * A streamed world is an unbounded grid of 2 km × 2 km chunks anchored at the
 * route start. Each chunk fetches its own slice of Kartverket's 1 m DTM
 * (~10.7 m cells after resampling) when it comes inside the loading radius,
 * carves its slice of the road into its own heights, and builds a mesh with
 * three LOD levels. Chunks left far behind the car are disposed; their DEM
 * heights stay in a small LRU cache so oscillating over a chunk border does
 * not re-download the tile.
 *
 * Phase 3 (the "phasing" fix) falls out of this design: there is exactly one
 * height source per chunk. The visual mesh is built from the same
 * `heights` array the road is carved into, and `sample()` — which the car's
 * raycast suspension, the camera, the road ribbon and the gates all call —
 * reads that same array. The graphics engine and the physics engine cannot
 * disagree about where the ground is.
 *
 * Chunk height grids are globally aligned: every chunk's samples sit at
 * anchor-aligned multiples of CELL metres, and each chunk's request includes
 * one extra shared row/column, so adjacent chunks return identical values
 * along their border and seams never show.
 */

const log = logger('stream');

export const CHUNK = 2048;            // metres per terrain chunk
export const SAMPLES = 192;           // height samples per chunk side
const CELL = CHUNK / SAMPLES;         // ≈ 10.7 m per sample
const GSIZE = SAMPLES + 1;            // stored grid side (one shared ring)
const SKIRT_DROP = 6;                 // metres the chunk border hangs down

const LOD_NEAR = 520;                 // full resolution below this distance
const LOD_MID = 1500;                 // half resolution below this distance
const FAR_STEP = 4;                   // ≈ 43 m cells for the far band
const MID_STEP = 2;

const LOAD_RADIUS = 3900;             // fetch DEM within this range of the car
const KEEP_RADIUS = 4700;             // dispose chunks beyond this range
const LEAD_DISTANCE = 2200;           // max look-ahead along the car's velocity
const MAX_CONCURRENT = 3;             // DEM downloads in flight
const MAX_RETRIES = 3;
const ROAD_LIFT = 0.12;
const HEIGHTS_CACHE = 24;             // LRU of disposed chunks' DEM heights

const ROUTE_PROFILE_NAMES = { foot: 'Footpath', cycling: 'Bike trail' };

function chunkKey(ci, cj) {
  return `${ci},${cj}`;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Scratch buffers for the carve pass (≈ 150 KB each, reused per chunk). */
const carveWeights = new Float32Array(GSIZE * GSIZE);
const carveTargets = new Float32Array(GSIZE * GSIZE);

/**
 * Build one chunk's mesh geometry at a given LOD step, reusing the vertex
 * colouring and skirt approach from `lod.js` but on the chunk's own heights.
 */
function buildChunkGeometry(chunk, step) {
  const h = chunk.heights;
  const nCols = Math.floor(SAMPLES / step) + 1;
  const count = nCols * nCols;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  const stride = CELL * step;

  const at = (i, j) => h[clamp(j, 0, SAMPLES) * GSIZE + clamp(i, 0, SAMPLES)];

  for (let j = 0; j < nCols; j++) {
    const gj = j * step;
    const z = chunk.z0 + gj * CELL;
    for (let i = 0; i < nCols; i++) {
      const gi = i * step;
      const x = chunk.x0 + gi * CELL;
      const idx = j * nCols + i;
      const height = at(gi, gj);
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = height;
      positions[idx * 3 + 2] = z;
      const gx = (at(gi + step, gj) - at(gi - step, gj)) / (2 * stride);
      const gz = (at(gi, gj + step) - at(gi, gj - step)) / (2 * stride);
      terrainColor(height, Math.hypot(gx, gz), x, z, color);
      colors[idx * 3] = color.r;
      colors[idx * 3 + 1] = color.g;
      colors[idx * 3 + 2] = color.b;
    }
  }

  const indices = [];
  for (let j = 0; j < nCols - 1; j++) {
    for (let i = 0; i < nCols - 1; i++) {
      const a = j * nCols + i;
      const b = a + 1;
      const c = a + nCols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  // Skirts so neighbouring chunks at different LODs never show daylight.
  const skirtPositions = [];
  const skirtColors = [];
  const skirtIndices = [];
  const addSkirt = (edge) => {
    const top = [];
    if (edge === 'north' || edge === 'south') {
      const row = edge === 'north' ? 0 : nCols - 1;
      for (let i = 0; i < nCols; i++) top.push(row * nCols + i);
    } else {
      const col = edge === 'west' ? 0 : nCols - 1;
      for (let j = 0; j < nCols; j++) top.push(j * nCols + col);
    }
    const base = count + skirtPositions.length / 3;
    for (const idx of top) {
      skirtPositions.push(
        positions[idx * 3],
        positions[idx * 3 + 1] - SKIRT_DROP,
        positions[idx * 3 + 2],
      );
      skirtColors.push(
        colors[idx * 3] * 0.55,
        colors[idx * 3 + 1] * 0.55,
        colors[idx * 3 + 2] * 0.55,
      );
    }
    for (let k = 0; k < top.length - 1; k++) {
      skirtIndices.push(
        top[k], base + k, top[k + 1],
        top[k + 1], base + k, base + k + 1,
      );
    }
  };
  addSkirt('north');
  addSkirt('south');
  addSkirt('west');
  addSkirt('east');

  const allPositions = new Float32Array(count * 3 + skirtPositions.length);
  allPositions.set(positions, 0);
  allPositions.set(skirtPositions, count * 3);
  const allColors = new Float32Array(count * 3 + skirtColors.length);
  allColors.set(colors, 0);
  allColors.set(skirtColors, count * 3);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(allPositions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(allColors, 3));
  geometry.setIndex(indices.concat(skirtIndices));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Phase 4 (V5 plan): per-chunk instanced forest.
 *
 * Trees use the same low-poly trunk/cone recipe as the baked world, drawn as
 * `InstancedMesh` copies. Placement follows the plan: a candidate (X, Z) whose
 * distance to the nearest road sample is under 6 m is cancelled, the Y is
 * snapped to the chunk's carved height field, and the whole thing is seeded
 * from the chunk coordinates so revisiting a chunk regrows the same forest.
 */
function scatterChunk(world, chunk) {
  const rand = mulberry32((hash2(chunk.ci, chunk.cj, 7) * 4294967296) >>> 0);
  const group = new THREE.Group();
  group.name = 'scatter';
  const index = world.routeIndex;

  const treeCapacity = 340;
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 2.2, 5);
  const crownGeo = new THREE.ConeGeometry(1.7, 5.2, 5);
  const rockGeo = new THREE.IcosahedronGeometry(1, 0);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3525, flatShading: true });
  const crownMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x777069, flatShading: true });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCapacity);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, treeCapacity);
  trunks.castShadow = true;
  crowns.castShadow = true;
  crowns.receiveShadow = true;

  const matrix = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const crownColor = new THREE.Color();

  let trees = 0;
  let attempts = 0;
  while (trees < treeCapacity && attempts < treeCapacity * 14) {
    attempts++;
    const x = chunk.x0 + rand() * CHUNK;
    const z = chunk.z0 + rand() * CHUNK;
    const h = world.sample(x, z);
    if (h < 6 || h > 720) continue;
    if (world.slope(x, z) > 0.62) continue;
    // Phase 4 placement rule: less than 6 m from the road → cancel the tree.
    if (index && index.distanceTo(x, z, 20) < 6) continue;
    const scale = 0.55 + rand() * 0.95;
    q.setFromAxisAngle(yAxis, rand() * Math.PI * 2);
    pos.set(x, h + 1.1 * scale, z);
    scl.setScalar(scale);
    matrix.compose(pos, q, scl);
    trunks.setMatrixAt(trees, matrix);
    pos.set(x, h + 4.1 * scale, z);
    matrix.compose(pos, q, scl);
    crowns.setMatrixAt(trees, matrix);
    crownColor.setHSL(0.31 + rand() * 0.035, 0.27 + rand() * 0.16, 0.18 + rand() * 0.10);
    crowns.setColorAt(trees, crownColor);
    trees++;
  }
  trunks.count = trees;
  crowns.count = trees;
  trunks.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
  if (trees) group.add(trunks, crowns);
  chunk.trees = trees;

  // A few boulders per chunk.
  const rockCapacity = 60;
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCapacity);
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  let placedRocks = 0;
  attempts = 0;
  while (placedRocks < rockCapacity && attempts < rockCapacity * 12) {
    attempts++;
    const x = chunk.x0 + rand() * CHUNK;
    const z = chunk.z0 + rand() * CHUNK;
    const h = world.sample(x, z);
    if (h < 3) continue;
    if (index && index.distanceTo(x, z, 16) < 8) continue;
    const scale = 0.5 + rand() * 2.4;
    q.setFromAxisAngle(yAxis, rand() * Math.PI * 2);
    pos.set(x, h + scale * 0.32, z);
    scl.set(scale * (0.8 + rand() * 0.5), scale * (0.55 + rand() * 0.35), scale * (0.8 + rand() * 0.4));
    matrix.compose(pos, q, scl);
    rocks.setMatrixAt(placedRocks++, matrix);
  }
  rocks.count = placedRocks;
  rocks.instanceMatrix.needsUpdate = true;
  if (placedRocks) group.add(rocks);

  return group;
}

/* ------------------------------------------------------------------ *
 *  Phase 5: real buildings for one chunk (Overpass API).               *
 * ------------------------------------------------------------------ */
async function addChunkBuildings(world, chunk) {
  if (world.disposed || chunk.state !== 'ready') return;
  const a = world.projection.latLonFromWorld(chunk.x0, chunk.z0);
  const b = world.projection.latLonFromWorld(chunk.x0 + CHUNK, chunk.z0 + CHUNK);
  const bbox = {
    minLat: Math.min(a.lat, b.lat),
    maxLat: Math.max(a.lat, b.lat),
    minLon: Math.min(a.lon, b.lon),
    maxLon: Math.max(a.lon, b.lon),
  };
  try {
    const placements = await fetchBuildings(bbox);
    if (world.disposed || chunk.state !== 'ready') return;
    chunk.buildingPlacements = placements;
    const houses = buildChunkHouses(placements, world, world.routeIndex, (hash2(chunk.ci, chunk.cj, 23) * 4294967296) >>> 0);
    if (houses) {
      chunk.buildingGroup = houses;
      chunk.group.add(houses);
      houseCount += houses.userData.count || 0;
    }
  } catch (error) {
    log.debug(`buildings skipped for ${chunk.key}: ${error.message}`);
  }
}

/* ------------------------------------------------------------------ *
 *  The world                                                           *
 * ------------------------------------------------------------------ */
export async function createStreamingWorld({
  geometry,
  title = 'Streamed stage',
  onProgress = null,
} = {}) {
  const coordinates = geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) throw new Error('The route has no coordinates.');

  const anchor = coordinates[0];
  const projection = localProjection(anchor.lat, anchor.lon);
  const points = coordinates.map(({ lat, lon }) => projection.worldFromLatLon(lat, lon));

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }

  // ---- corridor DEM: one coarse fetch over the whole route ----------------
  // The road's target profile (what `carveRoad` pulls the ground toward) has
  // to be smooth across chunk borders, so it is computed from a single coarse
  // elevation fetch over the route's bounding box instead of chunk by chunk.
  const PAD = 420;
  const cMinX = minX - PAD;
  const cMaxX = maxX + PAD;
  const cMinZ = minZ - PAD;
  const cMaxZ = maxZ + PAD;
  const spanX = cMaxX - cMinX;
  const spanZ = cMaxZ - cMinZ;
  const corridorGrid = clamp(Math.round(Math.max(spanX, spanZ) / 26), 256, 720);
  onProgress?.(0.06, 'Fetching the road corridor elevation…');
  const sw = projection.latLonFromWorld(cMinX, cMaxZ);
  const ne = projection.latLonFromWorld(cMaxX, cMinZ);
  const corridorDem = await fetchDem({
    bbox: {
      minLat: Math.min(sw.lat, ne.lat),
      maxLat: Math.max(sw.lat, ne.lat),
      minLon: Math.min(sw.lon, ne.lon),
      maxLon: Math.max(sw.lon, ne.lon),
    },
    grid: corridorGrid,
  });
  if (corridorDem.minH === undefined) throw new Error('The corridor elevation came back unreadable.');
  const corridor = {
    minX: cMinX,
    minZ: cMinZ,
    spanX,
    spanZ,
    grid: corridorDem.grid,
    heights: corridorDem.heights,
  };

  // ---- the world shell (sample() works from the corridor right away) ------
  const chunks = new Map();
  const heightsCache = new Map(); // LRU of disposed chunks' heights
  const waiters = [];
  const queue = [];
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const group = new THREE.Group();
  group.name = 'streamedWorld';
  let inFlight = 0;
  let disposed = false;
  let lastFocus = { x: points[0].x, z: points[0].z };
  let focusVel = { x: 0, z: 0 };
  let triangles = 0;
  let treeCount = 0;
  let houseCount = 0;
  let minH = corridorDem.minH ?? 0;
  let maxH = corridorDem.maxH ?? 0;

  const corridorSample = (x, z) => {
    const u = ((x - corridor.minX) / corridor.spanX) * (corridor.grid - 1);
    const v = ((z - corridor.minZ) / corridor.spanZ) * (corridor.grid - 1);
    if (u < 0 || v < 0 || u > corridor.grid - 1 || v > corridor.grid - 1) return null;
    const i = clamp(Math.floor(u), 0, corridor.grid - 2);
    const j = clamp(Math.floor(v), 0, corridor.grid - 2);
    const fx = clamp(u - i, 0, 1);
    const fz = clamp(v - j, 0, 1);
    const h = corridor.heights;
    const g = corridor.grid;
    const a = h[j * g + i];
    const b = h[j * g + i + 1];
    const c = h[(j + 1) * g + i];
    const d = h[(j + 1) * g + i + 1];
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
  };

  const readyChunkAt = (ci, cj) => {
    const chunk = chunks.get(chunkKey(ci, cj));
    return chunk && chunk.state === 'ready' ? chunk : null;
  };

  const fallbackSample = (x, z) => {
    let best = null;
    let bestD = Infinity;
    for (const chunk of chunks.values()) {
      if (chunk.state !== 'ready') continue;
      const dx = Math.max(chunk.x0 - x, 0, x - (chunk.x0 + CHUNK));
      const dz = Math.max(chunk.z0 - z, 0, z - (chunk.z0 + CHUNK));
      const d = dx * dx + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = chunk;
      }
    }
    if (!best) return 0;
    const cx = clamp(x, best.x0 + CELL / 2, best.x0 + CHUNK - CELL / 2);
    const cz = clamp(z, best.z0 + CELL / 2, best.z0 + CHUNK - CELL / 2);
    const u = (cx - best.x0) / CELL;
    const v = (cz - best.z0) / CELL;
    const i = clamp(Math.floor(u), 0, SAMPLES - 1);
    const j = clamp(Math.floor(v), 0, SAMPLES - 1);
    const fx = clamp(u - i, 0, 1);
    const fz = clamp(v - j, 0, 1);
    const h = best.heights;
    const a = h[j * GSIZE + i];
    const b = h[j * GSIZE + i + 1];
    const c = h[(j + 1) * GSIZE + i];
    const d = h[(j + 1) * GSIZE + i + 1];
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
  };

  const world = {
    streaming: true,
    generated: true,
    title,
    scene: { name: 'streamed', title, lat: anchor.lat, lon: anchor.lon },
    meta: { originX: 0, originY: 0, generated: true, anchor, streamed: true },
    grid: SAMPLES,
    cellX: CELL,
    cellZ: CELL,
    heights: null,
    originX: 0,
    originY: 0,
    sizeX: Math.max(spanX, spanZ),
    sizeZ: Math.max(spanX, spanZ),
    minH: 0,
    maxH: 0,
    projection,
    group,
    route: null,
    routeIndex: null,
    buckets: new Map(),

    worldFromLatLon: (lat, lon) => projection.worldFromLatLon(lat, lon),
    latLonFromWorld: (x, z) => projection.latLonFromWorld(x, z),

    bounds: {
      minX: cMinX,
      maxX: cMaxX,
      minZ: cMinZ,
      maxZ: cMaxZ,
    },

    /** Bilinear height at a world position. */
    sample(x, z) {
      const ci = Math.floor(x / CHUNK);
      const cj = Math.floor(z / CHUNK);
      const chunk = chunks.get(chunkKey(ci, cj));
      if (chunk && chunk.state === 'ready') {
        const u = (x - chunk.x0) / CELL;
        const v = (z - chunk.z0) / CELL;
        const i = clamp(Math.floor(u), 0, SAMPLES - 1);
        const j = clamp(Math.floor(v), 0, SAMPLES - 1);
        const fx = clamp(u - i, 0, 1);
        const fz = clamp(v - j, 0, 1);
        const h = chunk.heights;
        const a = h[j * GSIZE + i];
        const b = h[j * GSIZE + i + 1];
        const c = h[(j + 1) * GSIZE + i];
        const d = h[(j + 1) * GSIZE + i + 1];
        return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
      }
      const ch = corridorSample(x, z);
      if (ch != null) return ch;
      return fallbackSample(x, z);
    },

    gradient(x, z, e = 4) {
      const gx = (this.sample(x + e, z) - this.sample(x - e, z)) / (2 * e);
      const gz = (this.sample(x, z + e) - this.sample(x, z - e)) / (2 * e);
      return { gx, gz };
    },

    slope(x, z) {
      const { gx, gz } = this.gradient(x, z);
      return Math.hypot(gx, gz);
    },

    normal(x, z, e = 5) {
      const { gx, gz } = this.gradient(x, z, e);
      return new THREE.Vector3(-gx, 1, -gz).normalize();
    },

    /**
     * The car may only move where the ground actually exists: the chunk under
     * the point is loaded, and near a chunk border the neighbour is loaded
     * too. This is what keeps the car from driving into an unloaded void.
     */
    inside(x, z, margin = 0) {
      const ci = Math.floor(x / CHUNK);
      const cj = Math.floor(z / CHUNK);
      if (!readyChunkAt(ci, cj)) return false;
      if (margin > 0) {
        const lx = x - ci * CHUNK;
        const lz = z - cj * CHUNK;
        const west = lx < margin;
        const east = lx > CHUNK - margin;
        const north = lz < margin;
        const south = lz > CHUNK - margin;
        if (west && !readyChunkAt(ci - 1, cj)) return false;
        if (east && !readyChunkAt(ci + 1, cj)) return false;
        if (north && !readyChunkAt(ci, cj - 1)) return false;
        if (south && !readyChunkAt(ci, cj + 1)) return false;
        if (west && north && !readyChunkAt(ci - 1, cj - 1)) return false;
        if (east && north && !readyChunkAt(ci + 1, cj - 1)) return false;
        if (west && south && !readyChunkAt(ci - 1, cj + 1)) return false;
        if (east && south && !readyChunkAt(ci + 1, cj + 1)) return false;
      }
      return true;
    },

    resetHeights() {
      // The streamed heights are carved per chunk; there is no single buffer
      // to reset. Route changes re-carve in `setRoute`.
    },

    flattenPad(cx, cz, radius = 18, blend = 34, targetHeight = null) {
      // Bulldoze the pad on whichever ready chunks it touches.
      const target = targetHeight ?? this.sample(cx, cz);
      const ci0 = Math.floor((cx - radius - blend) / CHUNK);
      const ci1 = Math.floor((cx + radius + blend) / CHUNK);
      const cj0 = Math.floor((cz - radius - blend) / CHUNK);
      const cj1 = Math.floor((cz + radius + blend) / CHUNK);
      for (let cj = cj0; cj <= cj1; cj++) {
        for (let ci = ci0; ci <= ci1; ci++) {
          const chunk = readyChunkAt(ci, cj);
          if (!chunk) continue;
          applyPad(chunk, cx, cz, radius, blend, target);
          rebuildChunkGeometries(chunk);
        }
      }
      return target;
    },

    /** Legacy API shim — streaming worlds carve through `setRoute`. */
    carveRoad() {},

    pickables() {
      const list = [];
      for (const chunk of chunks.values()) {
        if (chunk.state === 'ready') list.push(chunk.mesh);
      }
      return list;
    },

    stats() {
      let ready = 0;
      let loading = 0;
      let queued = 0;
      for (const chunk of chunks.values()) {
        if (chunk.state === 'ready') ready++;
        else if (chunk.state === 'loading') loading++;
        else if (chunk.state === 'queued') queued++;
      }
      return {
        ready,
        loading,
        queued,
        chunks: ready,
        triangles: Math.round(triangles),
        trees: treeCount,
        houses: houseCount,
      };
    },

    dispose() {
      disposed = true;
      queue.length = 0;
      waiters.length = 0;
      for (const chunk of [...chunks.values()]) unloadChunk(chunk, false);
      chunks.clear();
      heightsCache.clear();
      material.dispose();
      if (group.parent) group.parent.remove(group);
    },
  };

  world.minH = minH;
  world.maxH = maxH;

  // ---- road targets, buckets, carving -------------------------------------
  function assignRoadY(route) {
    const samples = route.samples;
    const raw = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const h = corridorSample(samples[i].x, samples[i].z);
      raw[i] = h ?? samples[i].y ?? 0;
    }
    const w = 9; // ±45 m of longitudinal smoothing at the 5 m sample spacing
    for (let i = 0; i < samples.length; i++) {
      let sum = 0;
      let n = 0;
      for (let k = Math.max(0, i - w); k <= Math.min(samples.length - 1, i + w); k++) {
        sum += raw[k];
        n++;
      }
      samples[i].roadY = sum / Math.max(1, n);
      samples[i].y = samples[i].roadY + ROAD_LIFT;
    }
    route.start = samples[0];
    route.finish = samples[samples.length - 1];
  }

  function bucketRoute(route) {
    world.buckets.clear();
    route.samples.forEach((p, i) => {
      const ci = Math.floor(p.x / CHUNK);
      const cj = Math.floor(p.z / CHUNK);
      const k = chunkKey(ci, cj);
      let list = world.buckets.get(k);
      if (!list) world.buckets.set(k, (list = []));
      list.push(i);
    });
  }

  /** Carve this chunk's slice of the road (and the start pad) into its heights. */
  function carveChunk(chunk) {
    const route = world.route;
    if (!route) return;
    const halfWidth = route.roadWidth + 1.2;
    const blend = 8;
    const reach = halfWidth + blend;
    const halfX = CHUNK / 2;

    carveWeights.fill(0);
    carveTargets.fill(0);

    // Samples from this chunk and its neighbours can all reach inside it.
    const list = [];
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        const b = world.buckets.get(chunkKey(chunk.ci + di, chunk.cj + dj));
        if (b) list.push(...b);
      }
    }
    for (const idx of list) {
      const p = route.samples[idx];
      const target = (p.roadY ?? p.y) + ROAD_LIFT;
      const gx0 = Math.max(0, Math.floor((p.x - reach - chunk.x0) / CELL) - 1);
      const gx1 = Math.min(SAMPLES, Math.ceil((p.x + reach - chunk.x0) / CELL) + 1);
      const gz0 = Math.max(0, Math.floor((p.z - reach - chunk.z0) / CELL) - 1);
      const gz1 = Math.min(SAMPLES, Math.ceil((p.z + reach - chunk.z0) / CELL) + 1);
      for (let j = gz0; j <= gz1; j++) {
        const z = chunk.z0 + j * CELL;
        for (let i = gx0; i <= gx1; i++) {
          const x = chunk.x0 + i * CELL;
          const d = Math.hypot(x - p.x, z - p.z);
          if (d > reach) continue;
          const t = d <= halfWidth ? 1 : 1 - smoothstep((d - halfWidth) / blend);
          const gidx = j * GSIZE + i;
          if (t > carveWeights[gidx]) {
            carveWeights[gidx] = t;
            carveTargets[gidx] = target;
          }
        }
      }
    }
    let touched = 0;
    for (let idx = 0; idx < chunk.heights.length; idx++) {
      const wgt = carveWeights[idx];
      if (wgt <= 0.001) continue;
      chunk.heights[idx] = lerp(chunk.heights[idx], carveTargets[idx], wgt);
      touched++;
    }
    chunk.carved = touched > 0;

    // The start shelf: the first sample gets the same levelled disc the baked
    // world gives every stage, so the car never spawns on a sideways slope.
    const sp = route.samples[0];
    if (Math.abs(sp.x - (chunk.x0 + halfX)) < CHUNK / 2 + 60
      && Math.abs(sp.z - (chunk.z0 + halfX)) < CHUNK / 2 + 60) {
      applyPad(chunk, sp.x, sp.z, 18, 34, sp.roadY + ROAD_LIFT);
    }

    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < chunk.heights.length; i++) {
      const h = chunk.heights[i];
      if (h < lo) lo = h;
      if (h > hi) hi = h;
    }
    chunk.minH = lo;
    chunk.maxH = hi;
    minH = Math.min(minH, lo);
    maxH = Math.max(maxH, hi);
    world.minH = minH;
    world.maxH = maxH;
  }

  function applyPad(chunk, cx, cz, radius, blend, target) {
    const reach = radius + blend;
    const gx0 = Math.max(0, Math.floor((cx - reach - chunk.x0) / CELL));
    const gx1 = Math.min(SAMPLES, Math.ceil((cx + reach - chunk.x0) / CELL));
    const gz0 = Math.max(0, Math.floor((cz - reach - chunk.z0) / CELL));
    const gz1 = Math.min(SAMPLES, Math.ceil((cz + reach - chunk.z0) / CELL));
    for (let j = gz0; j <= gz1; j++) {
      const z = chunk.z0 + j * CELL;
      for (let i = gx0; i <= gx1; i++) {
        const x = chunk.x0 + i * CELL;
        const d = Math.hypot(x - cx, z - cz);
        if (d > reach) continue;
        const t = d <= radius ? 1 : 1 - smoothstep((d - radius) / blend);
        const idx = j * GSIZE + i;
        chunk.heights[idx] = lerp(chunk.heights[idx], target, t);
      }
    }
  }

  // ---- chunk geometry / LOD ------------------------------------------------
  function levelFor(chunk, fx, fz) {
    const d = rectDistance(chunk, fx, fz);
    if (d < LOD_NEAR) return 0;
    if (d < LOD_MID) return 1;
    return 2;
  }

  function rectDistance(chunk, x, z) {
    const dx = Math.max(chunk.x0 - x, 0, x - (chunk.x0 + CHUNK));
    const dz = Math.max(chunk.z0 - z, 0, z - (chunk.z0 + CHUNK));
    return Math.hypot(dx, dz);
  }

  const STEPS = [1, MID_STEP, FAR_STEP];

  function ensureChunkGeometry(chunk, level) {
    if (!chunk.geos[level]) {
      chunk.geos[level] = buildChunkGeometry(chunk, STEPS[level]);
    }
    return chunk.geos[level];
  }

  /** Swap the chunk's mesh to the target level, or the best already built. */
  function applyChunkLevel(chunk, target) {
    let use = target;
    if (!chunk.geos[use]) use = chunk.geos[0] ? 0 : chunk.geos[1] ? 1 : 2;
    if (!chunk.geos[use] || chunk.level === use) return;
    chunk.level = use;
    chunk.mesh.geometry = chunk.geos[use];
    chunk.mesh.castShadow = use <= 1;
    chunk.mesh.visible = true;
  }

  /** Rebuild every cached geometry after the heights changed (re-carve). */
  function rebuildChunkGeometries(chunk) {
    const level = chunk.level >= 0 ? chunk.level : 2;
    for (let i = 0; i < chunk.geos.length; i++) {
      chunk.geos[i]?.dispose();
      chunk.geos[i] = null;
    }
    chunk.level = -1;
    ensureChunkGeometry(chunk, level);
    applyChunkLevel(chunk, level);
  }

  // ---- chunk lifecycle -----------------------------------------------------
  function createChunk(ci, cj, priority) {
    const chunk = {
      ci,
      cj,
      key: chunkKey(ci, cj),
      x0: ci * CHUNK,
      z0: cj * CHUNK,
      state: 'queued',
      priority,
      attempts: 0,
      heights: null,
      minH: 0,
      maxH: 0,
      geos: [null, null, null],
      level: -1,
      mesh: new THREE.Mesh(new THREE.BufferGeometry(), material),
      group: new THREE.Group(),
      trees: 0,
      buildingPlacements: null,
      buildingGroup: null,
      roadVisuals: null,
    };
    chunk.mesh.name = `streamChunk-${ci}-${cj}`;
    chunk.mesh.receiveShadow = true;
    chunk.mesh.visible = false;
    chunk.group.visible = false;
    chunks.set(chunk.key, chunk);
    queue.push(chunk);
    return chunk;
  }

  async function loadChunk(chunk) {
    const sw = world.projection.latLonFromWorld(chunk.x0, chunk.z0 + CHUNK);
    const ne = world.projection.latLonFromWorld(chunk.x0 + CHUNK, chunk.z0);
    const bbox = {
      minLat: Math.min(sw.lat, ne.lat),
      maxLat: Math.max(sw.lat, ne.lat),
      minLon: Math.min(sw.lon, ne.lon),
      maxLon: Math.max(sw.lon, ne.lon),
    };
    const cached = heightsCache.get(chunk.key);
    let dem;
    if (cached) {
      heightsCache.delete(chunk.key);
      dem = cached;
    } else {
      dem = await fetchDem({ bbox, grid: GSIZE });
    }
    // The chunk may have been disposed (or the whole world torn down) while
    // the DEM request was in flight — never resurrect it into the scene.
    if (disposed || chunk.state === 'disposed' || !chunks.has(chunk.key)) return;
    chunk.heights = dem.heights;
    chunk.state = 'ready';
    onChunkReady(chunk);
  }

  function onChunkReady(chunk) {
    carveChunk(chunk);
    ensureChunkGeometry(chunk, 2);
    applyChunkLevel(chunk, levelFor(chunk, lastFocus.x, lastFocus.z));
    chunk.mesh.visible = true;
    group.add(chunk.mesh);

    chunk.scatterGroup = scatterChunk(world, chunk);
    chunk.group.add(chunk.scatterGroup);
    treeCount += chunk.trees;

    refreshChunkRoad(chunk);

    // Minimap hillshade for this slice of the world.
    drawChunkMinimap(world, chunk);

    chunk.group.visible = true;
    group.add(chunk.group);

    // Phase 5: real buildings arrive a moment later (network request).
    addChunkBuildings(world, chunk);

    triangles = 0;
    for (const c of chunks.values()) {
      if (c.state !== 'ready') continue;
      const g = c.mesh.geometry;
      triangles += (g.index?.count || 0) / 3;
    }
    processWaiters();
  }

  function refreshChunkRoad(chunk) {
    if (chunk.roadVisuals) {
      disposeObject(chunk.roadVisuals);
      chunk.group.remove(chunk.roadVisuals);
      chunk.roadVisuals = null;
    }
    const route = world.route;
    if (!route) return;
    const pad = 24;
    const bounds = {
      minX: chunk.x0 - pad,
      maxX: chunk.x0 + CHUNK + pad,
      minZ: chunk.z0 - pad,
      maxZ: chunk.z0 + CHUNK + pad,
    };
    const startP = route.samples[0];
    const finishP = route.samples[route.samples.length - 1];
    const contains = (p) => p.x >= bounds.minX && p.x <= bounds.maxX && p.z >= bounds.minZ && p.z <= bounds.maxZ;
    const startHere = contains(startP);
    const finishHere = contains(finishP);
    const gates = startHere && finishHere ? 'both' : startHere ? 'start' : finishHere ? 'finish' : 'none';
    chunk.roadVisuals = buildRoadVisuals(route, world, { bounds, gates, posts: true });
    chunk.group.add(chunk.roadVisuals);
  }

  function unloadChunk(chunk, cacheHeights = true) {
    if (chunk.state === 'disposed') return;
    chunk.state = 'disposed';
    if (cacheHeights && chunk.heights) {
      heightsCache.set(chunk.key, { heights: chunk.heights, grid: GSIZE, minH: chunk.minH, maxH: chunk.maxH });
      while (heightsCache.size > HEIGHTS_CACHE) {
        const oldest = heightsCache.keys().next().value;
        heightsCache.delete(oldest);
      }
    }
    disposeObject(chunk.group);
    if (chunk.group.parent) chunk.group.parent.remove(chunk.group);
    chunk.geos.forEach((g) => g?.dispose());
    chunk.geos = [null, null, null];
    if (chunk.mesh.parent) chunk.mesh.parent.remove(chunk.mesh);
    chunk.mesh.geometry.dispose();
    treeCount = Math.max(0, treeCount - (chunk.trees || 0));
    houseCount = Math.max(0, houseCount - (chunk.buildingGroup?.userData.count || 0));
    chunks.delete(chunk.key);
    triangles = 0;
    for (const c of chunks.values()) {
      if (c.state !== 'ready') continue;
      triangles += (c.mesh.geometry.index?.count || 0) / 3;
    }
  }

  function disposeObject(root) {
    root.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  }

  // ---- the loading queue ---------------------------------------------------
  function pump() {
    while (inFlight < MAX_CONCURRENT && queue.length) {
      let bestIdx = -1;
      let bestPriority = Infinity;
      for (let i = 0; i < queue.length; i++) {
        if (queue[i].state === 'queued' && queue[i].priority < bestPriority) {
          bestPriority = queue[i].priority;
          bestIdx = i;
        }
      }
      if (bestIdx < 0) {
        queue.splice(0, queue.length);
        break;
      }
      const chunk = queue.splice(bestIdx, 1)[0];
      chunk.state = 'loading';
      inFlight++;
      loadChunk(chunk)
        .catch((error) => {
          if (disposed) return;
          chunk.attempts++;
          log.warn(`chunk ${chunk.key} failed (${chunk.attempts}/${MAX_RETRIES}): ${error.message}`);
          if (chunk.attempts >= MAX_RETRIES) {
            chunk.state = 'failed';
          } else {
            chunk.state = 'queued';
            chunk.priority += 1e6; // deprioritise, but try again
            queue.push(chunk);
          }
        })
        .finally(() => {
          inFlight--;
          if (!disposed) {
            pump();
            processWaiters();
          }
        });
    }
  }

  function processWaiters() {
    for (let i = waiters.length - 1; i >= 0; i--) {
      const waiter = waiters[i];
      const done = waiter.keys.every((k) => {
        const c = chunks.get(k);
        return c && (c.state === 'ready' || c.state === 'failed' || c.state === 'disposed');
      });
      if (done) {
        waiters.splice(i, 1);
        waiter.resolve();
      } else {
        waiter.onTick?.(progressOf(waiter));
      }
    }
  }

  function progressOf(waiter) {
    let ready = 0;
    for (const k of waiter.keys) {
      const c = chunks.get(k);
      if (c && (c.state === 'ready' || c.state === 'failed')) ready++;
    }
    return ready / Math.max(1, waiter.keys.length);
  }

  world.ensureReady = (x, z, { rings = 1, onTick = null } = {}) => {
    const ci = Math.floor(x / CHUNK);
    const cj = Math.floor(z / CHUNK);
    const keys = [];
    for (let dj = -rings; dj <= rings; dj++) {
      for (let di = -rings; di <= rings; di++) {
        const k = chunkKey(ci + di, cj + dj);
        keys.push(k);
        if (!chunks.has(k)) createChunk(ci + di, cj + dj, rectDistance({ x0: (ci + di) * CHUNK, z0: (cj + dj) * CHUNK }, x, z));
      }
    }
    pump();
    return new Promise((resolve) => {
      const done = keys.every((k) => {
        const c = chunks.get(k);
        return c && (c.state === 'ready' || c.state === 'failed' || c.state === 'disposed');
      });
      if (done) resolve();
      else waiters.push({ keys, resolve, onTick });
    });
  };

  world.setFocus = (x, z) => {
    lastFocus = { x, z };
  };

  /**
   * Per-frame update: decide which chunks to fetch (biased toward the car's
   * velocity so the road ahead is always ready), which to dispose, and which
   * LOD geometry to build — all with small per-frame budgets so nothing hitches.
   */
  world.update = (fx, fz, vx = 0, vz = 0) => {
    if (disposed) return;
    lastFocus = { x: fx, z: fz };
    focusVel = { x: vx, z: vz };
    const speed = Math.hypot(vx, vz);
    const lead = Math.min(LEAD_DISTANCE, speed * 3.5);
    const norm = speed > 0.01 ? 1 / speed : 0;
    const px = fx + vx * norm * lead;
    const pz = fz + vz * norm * lead;

    // Fetch everything within LOAD_RADIUS of the predicted position.
    const r = Math.ceil(LOAD_RADIUS / CHUNK);
    const pci = Math.floor(px / CHUNK);
    const pcj = Math.floor(pz / CHUNK);
    for (let dj = -r; dj <= r; dj++) {
      for (let di = -r; di <= r; di++) {
        const ci = pci + di;
        const cj = pcj + dj;
        const k = chunkKey(ci, cj);
        if (chunks.has(k)) continue;
        const x0 = ci * CHUNK;
        const z0 = cj * CHUNK;
        const d = Math.hypot(
          Math.max(x0 - px, 0, px - (x0 + CHUNK)),
          Math.max(z0 - pz, 0, pz - (z0 + CHUNK)),
        );
        if (d > LOAD_RADIUS) continue;
        createChunk(ci, cj, d + (di === 0 && dj === 0 ? -10 : 0));
      }
    }

    // Dispose chunks left well behind the car (heights stay in the LRU).
    for (const chunk of [...chunks.values()]) {
      if (chunk.state === 'ready' && rectDistance(chunk, fx, fz) > KEEP_RADIUS) {
        unloadChunk(chunk);
      } else if ((chunk.state === 'queued' || chunk.state === 'loading')
        && rectDistance(chunk, fx, fz) > KEEP_RADIUS + CHUNK) {
        if (chunk.state === 'queued') {
          const idx = queue.indexOf(chunk);
          if (idx >= 0) queue.splice(idx, 1);
          chunks.delete(chunk.key);
          chunk.state = 'disposed';
        }
      }
    }

    // LOD geometry builds: one per frame, nearest chunk first.
    let budget = 1;
    const loaded = [...chunks.values()]
      .filter((c) => c.state === 'ready')
      .sort((a, b) => rectDistance(a, fx, fz) - rectDistance(b, fx, fz));
    for (const chunk of loaded) {
      if (budget <= 0) break;
      const target = levelFor(chunk, fx, fz);
      if (!chunk.geos[target]) {
        ensureChunkGeometry(chunk, target);
        applyChunkLevel(chunk, target);
        budget--;
      } else {
        applyChunkLevel(chunk, target);
      }
    }

    pump();
  };

  // ---- route management ----------------------------------------------------
  world.setRoute = (route) => {
    world.route = route;
    world.routeIndex = buildRouteIndex(route);
    assignRoadY(route);
    bucketRoute(route);
    for (const chunk of [...chunks.values()]) {
      if (chunk.state !== 'ready') continue;
      carveChunk(chunk);
      rebuildChunkGeometries(chunk);
      // Regrow the forest (the 6 m clearance rule applies to the new road)
      // and re-place the houses from their cached footprints.
      if (chunk.scatterGroup) {
        disposeObject(chunk.scatterGroup);
        chunk.group.remove(chunk.scatterGroup);
      }
      treeCount = Math.max(0, treeCount - (chunk.trees || 0));
      chunk.scatterGroup = scatterChunk(world, chunk);
      chunk.group.add(chunk.scatterGroup);
      treeCount += chunk.trees;
      if (chunk.buildingGroup) {
        disposeObject(chunk.buildingGroup);
        chunk.group.remove(chunk.buildingGroup);
        houseCount = Math.max(0, houseCount - (chunk.buildingGroup.userData.count || 0));
        chunk.buildingGroup = null;
      }
      if (chunk.buildingPlacements) {
        const houses = buildChunkHouses(
          chunk.buildingPlacements,
          world,
          world.routeIndex,
          (hash2(chunk.ci, chunk.cj, 23) * 4294967296) >>> 0,
        );
        if (houses) {
          chunk.buildingGroup = houses;
          chunk.group.add(houses);
          houseCount += houses.userData.count || 0;
        }
      }
      refreshChunkRoad(chunk);
    }
    redrawMinimap();
  };

  // ---- minimap -------------------------------------------------------------
  const MAP_SIZE = 512;
  const mapSpan = Math.max(cMaxX - cMinX, cMaxZ - cMinZ);
  const mapMinX = (cMinX + cMaxX) / 2 - mapSpan / 2;
  const mapMinZ = (cMinZ + cMaxZ) / 2 - mapSpan / 2;
  const minimapCanvas = document.createElement('canvas');
  minimapCanvas.width = MAP_SIZE;
  minimapCanvas.height = MAP_SIZE;
  const minimapCtx = minimapCanvas.getContext('2d');
  world.minimapCanvas = minimapCanvas;
  world.mapFromWorld = (x, z) => ({
    x: ((x - mapMinX) / mapSpan) * MAP_SIZE,
    y: ((z - mapMinZ) / mapSpan) * MAP_SIZE,
  });

  function drawChunkMinimap(worldRef, chunk) {
    const N = 48;
    const cell = MAP_SIZE / mapSpan * CELL;
    const origin = worldRef.mapFromWorld(chunk.x0, chunk.z0);
    const h = chunk.heights;
    const at = (i, j) => h[clamp(j, 0, SAMPLES) * GSIZE + clamp(i, 0, SAMPLES)];
    const color = new THREE.Color();
    const step = SAMPLES / N;
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const gi = i * step;
        const gj = j * step;
        const height = at(gi, gj);
        const gx = (at(gi + 2, gj) - at(gi - 2, gj)) / (2 * CELL * 2);
        const gz = (at(gi, gj + 2) - at(gi, gj - 2)) / (2 * CELL * 2);
        const shade = clamp(0.72 + (-gx * 0.7 - gz * 0.7) * 1.2, 0.38, 1.2);
        terrainColor(height, Math.hypot(gx, gz), chunk.x0 + gi * CELL, chunk.z0 + gj * CELL, color);
        minimapCtx.fillStyle = `rgb(${clamp(color.r * 255 * shade, 0, 255) | 0},${clamp(color.g * 255 * shade, 0, 255) | 0},${clamp(color.b * 255 * shade, 0, 255) | 0})`;
        minimapCtx.fillRect(origin.x + i * cell, origin.y + j * cell, cell + 0.5, cell + 0.5);
      }
    }
  }

  function redrawMinimap() {
    minimapCtx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);
    for (const chunk of chunks.values()) {
      if (chunk.state === 'ready') drawChunkMinimap(world, chunk);
    }
  }

  // ---- build the route ------------------------------------------------------
  onProgress?.(0.45, 'Smoothing the master track…');
  const profile = geometry.profile || 'driving';
  const route = makeRoute(points, world, {
    name: `${ROUTE_PROFILE_NAMES[profile] || 'OSRM road'} stage`,
    source: 'osrm',
    smooth: 1,
    spacing: 5,
    simplifyEpsilon: 2,
    roadWidth: profile === 'driving' ? 4.8 : 3.4,
  });
  if (route.length < 20) {
    throw new Error(`That road is too short to make a stage (${Math.round(route.length)} m).`);
  }
  world.route = route;
  world.routeIndex = buildRouteIndex(route);
  assignRoadY(route);
  bucketRoute(route);

  // Pre-load the spawn area before the game hands control to the player.
  const start = route.samples[0];
  onProgress?.(0.62, 'Loading the first terrain chunks…');
  await world.ensureReady(start.x, start.z, {
    rings: 1,
    onTick: (p) => onProgress?.(0.62 + p * 0.3, 'Loading the first terrain chunks…'),
  });

  log.info(
    `streamed world ready: ${(route.length / 1000).toFixed(2)} km route, `
    + `corridor ${corridorGrid}², spawn chunks loaded`,
  );
  return world;
}
