import * as THREE from 'three';
import { clamp, hash2, lerp, smoothstep, triSample, localProjection } from './geo.js';
import { terrainColor } from './terrain.js';
import { fetchDem } from './worldgen.js';
import { makeRoute, buildRoadVisuals, buildRouteIndex } from './stage.js';
import { fetchOsmChunk, overpassBlocked, buildChunkHouses, BuildingIndex, cullHouses, HOUSE_DRAW_DISTANCE } from './buildings.js';
import { buildLandCover, addOsmAreas, COVER, SPECIES, tintByCover } from './landcover.js';
import { buildChunkWater, waterAt } from './water.js';
import { fetchRoadSigns, buildChunkSigns } from './signs.js';
import { prepareChunkRoads, buildRoadMeshes, RoadNetwork, fetchRoadSurfaces, assignSurfaces } from './roads.js';
import { carveProfile, buildCorridorGeometry, corridorMesh, corridorReach, smoothRoadHeights, assignEdgeHeights, ASPHALT_HEX, GRAVEL_HEX, LANES } from './corridor.js';
import { createFineTiles } from './fine.js';
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

const LOAD_RADIUS = 4400;             // fetch DEM within this range of the car
const KEEP_RADIUS = 5300;             // dispose chunks beyond this range
const LEAD_DISTANCE = 2800;           // max look-ahead along the car's velocity
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
function buildChunkGeometry(chunk, step, covered = null) {
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
      // The carved road band is road-coloured and never takes the land-cover
      // tint; the cut/fill slopes keep bare ground colours.
      const road = chunk.roadMask ? chunk.roadMask[gj * GSIZE + gi] : 0;
      if (road >= 2) color.setHex(road === 3 ? ASPHALT_HEX : GRAVEL_HEX);
      else {
        terrainColor(height, Math.hypot(gx, gz), x, z, color);
        if (chunk.cover && !road) tintByCover(chunk.cover, x, z, color);
      }
      colors[idx * 3] = color.r;
      colors[idx * 3 + 1] = color.g;
      colors[idx * 3 + 2] = color.b;
    }
  }

  const indices = [];
  for (let j = 0; j < nCols - 1; j++) {
    for (let i = 0; i < nCols - 1; i++) {
      // A hole where a fine 1 m tile draws the ground instead (tiles are
      // aligned to whole coarse cells, so a quad is either in or out).
      if (covered && covered(chunk.x0 + (i + 0.5) * stride, chunk.z0 + (j + 0.5) * stride)) continue;
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
/* One shared set of low-poly tree geometries (instances only carry matrices). */
let treeGeometry = null;
function treeGeometries() {
  if (treeGeometry) return treeGeometry;
  const spruceTrunk = new THREE.CylinderGeometry(0.16, 0.26, 1.8, 5);
  spruceTrunk.translate(0, 0.9, 0);
  const spruceCrown = new THREE.ConeGeometry(1.5, 6.4, 6);
  spruceCrown.translate(0, 1.4 + 3.2, 0);
  const pineTrunk = new THREE.CylinderGeometry(0.18, 0.3, 5.2, 5);
  pineTrunk.translate(0, 2.6, 0);
  const pineCrown = new THREE.ConeGeometry(2.3, 2.8, 6);
  pineCrown.translate(0, 5.0 + 1.4, 0);
  const birchTrunk = new THREE.CylinderGeometry(0.13, 0.2, 2.8, 5);
  birchTrunk.translate(0, 1.4, 0);
  const birchCrown = new THREE.IcosahedronGeometry(2.0, 0);
  birchCrown.scale(1, 1.25, 1);
  birchCrown.translate(0, 4.1, 0);
  treeGeometry = {
    [SPECIES.SPRUCE]: { trunk: spruceTrunk, crown: spruceCrown, trunkColor: 0x4a3525, hue: 0.33, sat: [0.3, 0.45], light: [0.15, 0.22], scale: [1.2, 2.4] },
    [SPECIES.PINE]: { trunk: pineTrunk, crown: pineCrown, trunkColor: 0x8a5a3a, hue: 0.24, sat: [0.3, 0.42], light: [0.22, 0.3], scale: [1.1, 2.2] },
    [SPECIES.DECIDUOUS]: { trunk: birchTrunk, crown: birchCrown, trunkColor: 0xd9d6cc, hue: 0.26, sat: [0.38, 0.55], light: [0.3, 0.42], scale: [0.9, 1.9] },
  };
  return treeGeometry;
}

const TREE_BUDGET = 2600;           // instances per chunk, all species
const TREES_PER_CELL = 4.5;         // at crown cover 1.0 in a 16 m cell

/**
 * Per-chunk forest from the land cover (NIBIO SR16 species and crown cover,
 * OSM forest polygons), with a budget that favours the road corridor. Until
 * the land cover has arrived the chunk gets a sparse default scatter.
 */
function scatterChunk(world, chunk) {
  const rand = mulberry32((hash2(chunk.ci, chunk.cj, 7) * 4294967296) >>> 0);
  const group = new THREE.Group();
  group.name = 'scatter';
  const index = world.routeIndex;
  const geo = treeGeometries();
  const lc = chunk.cover;

  // Plan: a list of {x, z, species, scale} to instance.
  const plan = [];
  const want = (x, z, species, scale) => plan.push({ x, z, species, scale });
  const spawn = world.route ? world.route.samples[0] : world.roads.spawn;
  const ok = (x, z, h) => h >= 1.5 && h <= 760 && world.slope(x, z) <= 0.62
    && !(index && index.distanceTo(x, z, 20) < 6)
    && !(spawn && Math.hypot(x - spawn.x, z - spawn.z) < 16)
    && !(world.roads.segmentCount && world.roads.nearest(x, z, 48).distance < world.roads.nearest(x, z, 48).width + 3);

  if (lc) {
    // Expected trees per cell, weighted toward the road where detail matters.
    // The road distance is sampled on a coarse 32² grid (a per-cell lookup
    // over the whole chunk would cost millions of bucket visits).
    const COARSE = 32;
    const coarseCell = CHUNK / COARSE;
    const near = new Float32Array(COARSE * COARSE);
    for (let j = 0; j < COARSE; j++) {
      for (let i = 0; i < COARSE; i++) {
        const d = index ? index.distanceTo(chunk.x0 + (i + 0.5) * coarseCell, chunk.z0 + (j + 0.5) * coarseCell, 260) : 0;
        near[j * COARSE + i] = d < 260 ? 1 : 0.4;
      }
    }
    const expected = new Float32Array(lc.cover.length);
    let total = 0;
    for (let k = 0; k < lc.cover.length; k++) {
      if (lc.cover[k] !== COVER.FOREST) continue;
      const c = lc.centre(k);
      const ci = clamp(Math.floor((c.x - chunk.x0) / coarseCell), 0, COARSE - 1);
      const cj = clamp(Math.floor((c.z - chunk.z0) / coarseCell), 0, COARSE - 1);
      expected[k] = lc.density[k] * TREES_PER_CELL * near[cj * COARSE + ci];
      total += expected[k];
    }
    const scaleDown = total > TREE_BUDGET ? TREE_BUDGET / total : 1;
    for (let k = 0; k < lc.cover.length; k++) {
      if (!expected[k]) continue;
      const n = Math.floor(expected[k] * scaleDown + rand());
      const c = lc.centre(k);
      for (let t = 0; t < n; t++) {
        const x = c.x + (rand() - 0.5) * lc.cell;
        const z = c.z + (rand() - 0.5) * lc.cell;
        if (!ok(x, z, world.sample(x, z))) continue;
        let species = lc.species[k] || SPECIES.SPRUCE;
        // Mixed stands: a few birches among the conifers and vice versa.
        if (rand() < 0.12) species = species === SPECIES.DECIDUOUS ? SPECIES.SPRUCE : SPECIES.DECIDUOUS;
        const [lo, hi] = geo[species].scale;
        want(x, z, species, (lo + rand() * (hi - lo)) * (0.75 + lc.density[k] * 0.35));
      }
    }
  } else {
    // No land cover yet: a thin default forest so the ground is not bare.
    let attempts = 0;
    while (plan.length < 260 && attempts < 3000) {
      attempts++;
      const x = chunk.x0 + rand() * CHUNK;
      const z = chunk.z0 + rand() * CHUNK;
      const h = world.sample(x, z);
      if (h < 6 || !ok(x, z, h)) continue;
      const species = rand() < 0.7 ? SPECIES.SPRUCE : rand() < 0.5 ? SPECIES.PINE : SPECIES.DECIDUOUS;
      const [lo, hi] = geo[species].scale;
      want(x, z, species, lo + rand() * (hi - lo));
    }
  }

  const matrix = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const color = new THREE.Color();
  let trees = 0;
  for (const species of [SPECIES.SPRUCE, SPECIES.PINE, SPECIES.DECIDUOUS]) {
    const items = plan.filter((p) => p.species === species);
    if (!items.length) continue;
    const g = geo[species];
    const trunks = new THREE.InstancedMesh(g.trunk, new THREE.MeshLambertMaterial({ color: g.trunkColor, flatShading: true }), items.length);
    const crowns = new THREE.InstancedMesh(g.crown, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), items.length);
    trunks.castShadow = true;
    crowns.castShadow = true;
    crowns.receiveShadow = true;
    items.forEach((p, i) => {
      const h = world.sample(p.x, p.z);
      q.setFromAxisAngle(yAxis, rand() * Math.PI * 2);
      pos.set(p.x, h - 0.2, p.z);
      scl.set(p.scale * (0.9 + rand() * 0.2), p.scale, p.scale * (0.9 + rand() * 0.2));
      matrix.compose(pos, q, scl);
      trunks.setMatrixAt(i, matrix);
      crowns.setMatrixAt(i, matrix);
      color.setHSL(g.hue + (rand() - 0.5) * 0.04, g.sat[0] + rand() * (g.sat[1] - g.sat[0]), g.light[0] + rand() * (g.light[1] - g.light[0]));
      crowns.setColorAt(i, color);
    });
    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
    group.add(trunks, crowns);
    trees += items.length;
  }
  chunk.trees = trees;

  // A few boulders per chunk, on open ground only.
  const rockGeo = new THREE.IcosahedronGeometry(1, 0);
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x777069, flatShading: true });
  const rockCapacity = 60;
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCapacity);
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  let placedRocks = 0;
  let attempts = 0;
  while (placedRocks < rockCapacity && attempts < rockCapacity * 12) {
    attempts++;
    const x = chunk.x0 + rand() * CHUNK;
    const z = chunk.z0 + rand() * CHUNK;
    const h = world.sample(x, z);
    if (h < 3) continue;
    if (index && index.distanceTo(x, z, 16) < 8) continue;
    if (lc) {
      const c = lc.coverAt(x, z);
      if (c === COVER.FIELD || c === COVER.WATER || c === COVER.BUILT || c === COVER.PASTURE) continue;
    }
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
function chunkBbox(world, chunk) {
  const a = world.projection.latLonFromWorld(chunk.x0, chunk.z0);
  const b = world.projection.latLonFromWorld(chunk.x0 + CHUNK, chunk.z0 + CHUNK);
  return {
    minLat: Math.min(a.lat, b.lat),
    maxLat: Math.max(a.lat, b.lat),
    minLon: Math.min(a.lon, b.lon),
    maxLon: Math.max(a.lon, b.lon),
  };
}

/** Everything that comes from the Overpass answer: roads, houses, water, areas. */
function applyChunkOsm(world, chunk, osm, hooks) {
  chunk.osm = osm;
  try {
    hooks.roads(chunk);          // carve + ribbons + network (changes heights)
  } catch (error) {
    log.warn(`roads skipped for ${chunk.key}: ${error.message}`);
  }
  try {
    chunk.buildingPlacements = osm.buildings;
    const houses = buildChunkHouses(osm.buildings, world, hooks.clearance(), (hash2(chunk.ci, chunk.cj, 23) * 4294967296) >>> 0);
    if (houses) {
      chunk.buildingGroup = houses;
      chunk.group.add(houses);
      world.buildings.setChunk(chunk.key, houses.userData.boxes);
      hooks.houses(houses.userData.count || 0);
      hooks.cull?.(houses);
    }
  } catch (error) {
    log.warn(`houses skipped for ${chunk.key}: ${error.message}`);
  }
  try {
    const water = buildChunkWater(osm, world, { x0: chunk.x0, z0: chunk.z0, size: CHUNK });
    if (water) {
      chunk.waterGroup = water;
      chunk.group.add(water);
    }
  } catch (error) {
    log.warn(`water skipped for ${chunk.key}: ${error.message}`);
  }
  if (chunk.cover) {
    addOsmAreas(chunk.cover, osm.areas, world.projection);
    hooks.coverReady(chunk);
  }
}

/**
 * Fetch the map features of one chunk. NIBIO SR16 (forest) and NVDB (signs)
 * answer in a second or two; the Overpass answer (roads, houses, water,
 * fields) can be slow or down, so it is awaited separately and retried
 * later by `world.update` when it failed.
 */
async function addChunkFeatures(world, chunk, hooks) {
  if (world.disposed || chunk.state !== 'ready') return;
  const bbox = chunkBbox(world, chunk);
  const alive = () => !world.disposed && chunk.state === 'ready';

  fetchRoadSigns(bbox).then((signData) => {
    if (!alive()) return;
    chunk.signData = signData;
    hooks.signs(chunk);
  }).catch((error) => log.warn(`signs skipped for ${chunk.key}: ${error.message}`));

  // Registered road surfaces (NVDB Vegdekke): recolour and re-grip the roads.
  fetchRoadSurfaces(bbox).then((surfaces) => {
    if (!alive() || !surfaces.length) return;
    chunk.surfaces = surfaces;
    hooks.surfaces(chunk);
  }).catch((error) => log.warn(`surfaces skipped for ${chunk.key}: ${error.message}`));

  const osmPromise = requestChunkOsm(world, chunk, hooks);

  try {
    const cover = await buildLandCover({
      x0: chunk.x0, z0: chunk.z0, size: CHUNK, projection: world.projection, areas: [],
    });
    if (!alive()) return;
    chunk.cover = cover;
    if (chunk.osm) addOsmAreas(cover, chunk.osm.areas, world.projection);
    hooks.coverReady(chunk);
  } catch (error) {
    log.warn(`land cover skipped for ${chunk.key}: ${error.message}`);
  }
  await osmPromise;
}

/** One Overpass attempt for a chunk; on failure schedule a retry. */
async function requestChunkOsm(world, chunk, hooks) {
  if (chunk.osmPending || chunk.osm) return;
  chunk.osmPending = true;
  try {
    const osm = await fetchOsmChunk(chunkBbox(world, chunk));
    if (world.disposed || chunk.state !== 'ready') return;
    if (osm) applyChunkOsm(world, chunk, osm, hooks);
    else chunk.osmRetryAt = performance.now() + 45000;
  } catch (error) {
    log.warn(`OSM features skipped for ${chunk.key}: ${error.message}`);
    chunk.osmRetryAt = performance.now() + 45000;
  } finally {
    chunk.osmPending = false;
  }
}

/* ------------------------------------------------------------------ *
 *  The world                                                           *
 * ------------------------------------------------------------------ */
export async function createStreamingWorld({
  geometry,
  center = null,
  freeDrive = false,
  heading = 0,
  title = 'Streamed stage',
  onProgress = null,
} = {}) {
  // Free drive: no stage route, the world simply streams around the car and
  // the roads come from OpenStreetMap as the chunks arrive.
  const coordinates = freeDrive ? [center, center] : geometry?.coordinates;
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
  let lastHouseCull = -Infinity;
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

  let fine = null; // the 1 m tiles, created once the world object exists (see below)
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
    freeDrive,
    roads: new RoadNetwork({ spawn: { x: 0, z: 0, yaw: 0 }, name: title }),
    roadHeights: new Map(), // OSM way id → heights per sample, shared by every chunk that holds a piece of the way
    buildings: new BuildingIndex(), // solid house footprints, for the car

    worldFromLatLon: (lat, lon) => projection.worldFromLatLon(lat, lon),
    latLonFromWorld: (x, z) => projection.latLonFromWorld(x, z),

    /** Natural (uncarved) ground height: the 1 m tiles first, then the chunk grid. */
    sampleBase(x, z) {
      const fh = fine?.sampleBase(x, z);
      if (fh != null) return fh;
      return this.sampleBaseCoarse(x, z);
    },

    /** Natural ground from the chunk grid only (road grading, so heights never depend on fine tiles). */
    sampleBaseCoarse(x, z) {
      const chunk = chunks.get(chunkKey(Math.floor(x / CHUNK), Math.floor(z / CHUNK)));
      if (!chunk || chunk.state !== 'ready' || !chunk.baseHeights) return this.sample(x, z);
      const u = (x - chunk.x0) / CELL;
      const v = (z - chunk.z0) / CELL;
      const i = clamp(Math.floor(u), 0, SAMPLES - 1);
      const j = clamp(Math.floor(v), 0, SAMPLES - 1);
      const fx = clamp(u - i, 0, 1);
      const fz = clamp(v - j, 0, 1);
      const h = chunk.baseHeights;
      return triSample(h[j * GSIZE + i], h[j * GSIZE + i + 1], h[(j + 1) * GSIZE + i], h[(j + 1) * GSIZE + i + 1], fx, fz);
    },

    /** `{ depth, surface }` of the water at (x, z): sea, fjord shore, lakes, rivers. */
    waterAt(x, z) {
      const chunk = chunks.get(chunkKey(Math.floor(x / CHUNK), Math.floor(z / CHUNK)));
      return waterAt(chunk?.waterGroup?.userData.bodies || null, this, x, z);
    },

    /** Land-cover tint of the chunk under (x, z), if it has arrived (minimap). */
    tintAt(x, z, color) {
      const chunk = chunks.get(chunkKey(Math.floor(x / CHUNK), Math.floor(z / CHUNK)));
      if (chunk?.cover) tintByCover(chunk.cover, x, z, color);
      return color;
    },

    bounds: {
      minX: cMinX,
      maxX: cMaxX,
      minZ: cMinZ,
      maxZ: cMaxZ,
    },

    /** Height at a world position: the 1 m tiles along the road first, then the chunk grid. */
    sample(x, z) {
      const fh = fine?.sample(x, z);
      if (fh != null) return fh;
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
        return triSample(a, b, c, d, fx, fz);
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
      const f = fine ? fine.stats() : { ready: 0, loading: 0, queued: 0, triangles: 0 };
      return {
        fine: f,
        ready,
        loading,
        queued,
        chunks: ready,
        triangles: Math.round(triangles),
        trees: treeCount,
        houses: houseCount,
        roads: world.roads.segmentCount,
      };
    },

    dispose() {
      disposed = true;
      queue.length = 0;
      waiters.length = 0;
      for (const chunk of [...chunks.values()]) unloadChunk(chunk, false);
      chunks.clear();
      heightsCache.clear();
      fine?.dispose();
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
    // Graded like a real road: bumps shorter than ~100 m are ironed out and
    // the corridor's embankments and cuttings take up the difference.
    const smooth = smoothRoadHeights(raw, 5);
    for (let i = 0; i < samples.length; i++) {
      samples[i].roadY = smooth[i];
      samples[i].y = samples[i].roadY + ROAD_LIFT;
    }
    assignEdgeHeights(samples, route.cutHalf, (x, z) => corridorSample(x, z) ?? fallbackSample(x, z));
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

  /** Route samples (with a margin) that can reach into this chunk, as runs. */
  function routeLinesFor(chunk, route, margin) {
    const size = chunk.size ?? CHUNK;
    const inside = (p) => p.x >= chunk.x0 - margin && p.x <= chunk.x0 + size + margin
      && p.z >= chunk.z0 - margin && p.z <= chunk.z0 + size + margin;
    const lines = [];
    let run = [];
    for (const p of route.samples) {
      if (inside(p)) run.push(p);
      else if (run.length) { if (run.length >= 2) lines.push({ half: route.roadWidth, cut: route.cutHalf, surface: route.surface, samples: run }); run = []; }
    }
    if (run.length >= 2) lines.push({ half: route.roadWidth, cut: route.cutHalf, surface: route.surface, samples: run });
    return lines;
  }

  /**
   * Carve the engineered profile of the stage road and this chunk's OSM
   * roads into the chunk heights, always starting from the untouched DEM so
   * a route change never carves on top of an old carve.
   */
  function carveChunk(chunk) {
    if (!chunk.baseHeights) return;
    chunk.heights.set(chunk.baseHeights);
    const route = world.route;
    const lines = [];
    if (route) lines.push(...routeLinesFor(chunk, route, 80));
    if (chunk.osmRoads?.length) lines.push(...chunk.osmRoads);
    let touched = 0;
    chunk.roadMask ||= new Uint8Array(GSIZE * GSIZE);
    chunk.roadMask.fill(0);
    if (lines.length) {
      touched = carveProfile(
        { heights: chunk.heights, base: chunk.baseHeights, x0: chunk.x0, z0: chunk.z0, cell: CELL, n: GSIZE, roadMask: chunk.roadMask },
        lines,
        { lift: ROAD_LIFT },
      );
    }
    chunk.carved = touched > 0;

    // The start shelf: the first sample gets the same levelled disc the baked
    // world gives every stage, so the car never spawns on a sideways slope.
    if (route) {
      const sp = route.samples[0];
      const halfX = CHUNK / 2;
      if (Math.abs(sp.x - (chunk.x0 + halfX)) < CHUNK / 2 + 60
        && Math.abs(sp.z - (chunk.z0 + halfX)) < CHUNK / 2 + 60) {
        applyPad(chunk, sp.x, sp.z, 18, 34, (sp.roadY ?? sp.y) + ROAD_LIFT);
      }
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
  }

  /** The 1 m corridor mesh (embankments / cuttings) for near chunks. */
  function refreshChunkCorridor(chunk) {
    if (chunk.corridorMesh) {
      chunk.corridorMesh.geometry.dispose();
      chunk.group.remove(chunk.corridorMesh);
      chunk.corridorMesh = null;
    }
    if (chunk.state !== 'ready' || chunk.level !== 0) return;
    const route = world.route;
    const lines = [];
    if (route) lines.push(...routeLinesFor(chunk, route, 40));
    if (chunk.osmRoads?.length) lines.push(...chunk.osmRoads.filter((l) => l.kind !== 'service' && l.kind !== 'track'));
    if (!lines.length) return;
    const geometry = buildCorridorGeometry(lines, {
      sampleBase: (x, z) => world.sampleBase(x, z),
      tint: chunk.cover ? (x, z, c) => tintByCover(chunk.cover, x, z, c) : null,
      lift: ROAD_LIFT,
      maxVertices: 140000,
    });
    const mesh = corridorMesh(geometry);
    if (mesh) {
      chunk.corridorMesh = mesh;
      chunk.group.add(mesh);
    }
  }

  function applyPad(chunk, cx, cz, radius, blend, target) {
    applyPadGrid({ heights: chunk.heights, x0: chunk.x0, z0: chunk.z0, cell: CELL, n: GSIZE }, cx, cz, radius, blend, target);
  }

  /** The same levelled start disc on any height grid (`{ heights, x0, z0, cell, n }`). */
  function applyPadGrid(grid, cx, cz, radius, blend, target) {
    const reach = radius + blend;
    const gx0 = Math.max(0, Math.floor((cx - reach - grid.x0) / grid.cell));
    const gx1 = Math.min(grid.n - 1, Math.ceil((cx + reach - grid.x0) / grid.cell));
    const gz0 = Math.max(0, Math.floor((cz - reach - grid.z0) / grid.cell));
    const gz1 = Math.min(grid.n - 1, Math.ceil((cz + reach - grid.z0) / grid.cell));
    for (let j = gz0; j <= gz1; j++) {
      const z = grid.z0 + j * grid.cell;
      for (let i = gx0; i <= gx1; i++) {
        const x = grid.x0 + i * grid.cell;
        const d = Math.hypot(x - cx, z - cz);
        if (d > reach) continue;
        const t = d <= radius ? 1 : 1 - smoothstep((d - radius) / blend);
        const idx = j * grid.n + i;
        grid.heights[idx] = lerp(grid.heights[idx], target, t);
      }
    }
  }

  /**
   * Road lines (stage route + OSM roads of the chunks around) that reach into
   * a rectangle. Neighbouring chunks each hold a copy of a road that crosses
   * their border, so one copy per road is kept: the one with the most samples
   * inside the rectangle.
   */
  function linesNear(x0, z0, size, margin) {
    const minX = x0 - margin; const maxX = x0 + size + margin;
    const minZ = z0 - margin; const maxZ = z0 + size + margin;
    const lines = [];
    if (world.route) lines.push(...routeLinesFor({ x0: x0 - margin, z0: z0 - margin, size: size + 2 * margin }, world.route, 0));
    const seen = new Set();
    const best = new Map(); // road identity → { line, inside }
    for (const [cx, cz] of [[minX, minZ], [maxX, minZ], [minX, maxZ], [maxX, maxZ]]) {
      const chunk = chunks.get(chunkKey(Math.floor(cx / CHUNK), Math.floor(cz / CHUNK)));
      if (!chunk || seen.has(chunk.key) || !chunk.osmRoads?.length) continue;
      seen.add(chunk.key);
      for (const line of chunk.osmRoads) {
        let inside = 0;
        for (const p of line.samples) if (p.x >= minX && p.x <= maxX && p.z >= minZ && p.z <= maxZ) inside++;
        if (!inside) continue;
        const id = line.id != null ? `w${line.id}` : `${line.kind}|${line.name || ''}|${line.samples[0].x.toFixed(0)},${line.samples[0].z.toFixed(0)}`;
        const have = best.get(id);
        if (!have || inside > have.inside) best.set(id, { line, inside });
      }
    }
    for (const { line } of best.values()) lines.push(line);
    return lines;
  }

  // The 1 m ground along the roads (fine.js). Chunk meshes get holes under
  // its tiles; `dirtyChunks` rebuilds them one per frame.
  const dirtyChunks = new Map(); // chunk → { first, last } dirty timestamps
  fine = createFineTiles({
    cell: CELL,
    fetchDem,
    latLonFromWorld: (x, z) => world.latLonFromWorld(x, z),
    group,
    material,
    linesFor: (t) => linesNear(t.x0, t.z0, t.size, 80),
    padFor: (grid) => {
      const route = world.route;
      if (!route) return;
      const sp = route.samples[0];
      if (sp.x < grid.x0 - 60 || sp.x > grid.x0 + grid.cell * (grid.n - 1) + 60 || sp.z < grid.z0 - 60 || sp.z > grid.z0 + grid.cell * (grid.n - 1) + 60) return;
      applyPadGrid(grid, sp.x, sp.z, 18, 34, (sp.roadY ?? sp.y) + ROAD_LIFT);
    },
    tint: (x, z, c) => world.tintAt(x, z, c),
    onTileChange: (t) => {
      const chunk = chunks.get(chunkKey(Math.floor((t.x0 + 1) / CHUNK), Math.floor((t.z0 + 1) / CHUNK)));
      if (!chunk || chunk.state !== 'ready') return;
      const nowT = performance.now();
      const at = dirtyChunks.get(chunk);
      if (at) at.last = nowT; else dirtyChunks.set(chunk, { first: nowT, last: nowT });
    },
  });

  world.fine = fine;          // diagnostics (debug overlay, console)
  world.linesNear = linesNear;

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
      chunk.geos[level] = buildChunkGeometry(chunk, STEPS[level], (x, z) => fine?.covers(x, z));
    }
    return chunk.geos[level];
  }

  /** Swap the chunk's mesh to the target level, or the best already built. */
  function applyChunkLevel(chunk, target) {
    let use = target;
    if (!chunk.geos[use]) use = chunk.geos[0] ? 0 : chunk.geos[1] ? 1 : 2;
    if (!chunk.geos[use] || chunk.level === use) return;
    const wasNear = chunk.level === 0;
    chunk.level = use;
    chunk.mesh.geometry = chunk.geos[use];
    chunk.mesh.castShadow = use <= 1;
    chunk.mesh.visible = true;
    if ((use === 0) !== wasNear) refreshChunkCorridor(chunk);
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
      baseHeights: null,
      corridorMesh: null,
      minH: 0,
      maxH: 0,
      geos: [null, null, null],
      level: -1,
      mesh: new THREE.Mesh(new THREE.BufferGeometry(), material),
      group: new THREE.Group(),
      trees: 0,
      buildingPlacements: null,
      buildingGroup: null,
      waterGroup: null,
      signData: null,
      signGroup: null,
      osmRoads: null,
      osmRoadGroup: null,
      surfaces: null,
      cover: null,
      osm: null,
      osmPending: false,
      osmRetryAt: 0,
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
    chunk.baseHeights = dem.heights.slice();
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

    // Real buildings, water and land cover arrive a moment later (network).
    addChunkFeatures(world, chunk, featureHooks);

    triangles = 0;
    for (const c of chunks.values()) {
      if (c.state !== 'ready') continue;
      const g = c.mesh.geometry;
      triangles += (g.index?.count || 0) / 3;
    }
    processWaiters();
  }

  function rescatter(chunk) {
    if (chunk.scatterGroup) {
      disposeObject(chunk.scatterGroup);
      chunk.group.remove(chunk.scatterGroup);
    }
    treeCount = Math.max(0, treeCount - (chunk.trees || 0));
    chunk.scatterGroup = scatterChunk(world, chunk);
    chunk.group.add(chunk.scatterGroup);
    treeCount += chunk.trees;
  }

  const featureHooks = {
    houses: (n) => { houseCount += n; },
    cull: (group) => cullHouses(group, lastFocus.x, lastFocus.z, HOUSE_DRAW_DISTANCE),
    signs: (c) => refreshChunkSigns(c),
    roads: (c) => refreshChunkOsmRoads(c),
    surfaces: (c) => applyChunkSurfaces(c),
    clearance: () => clearanceIndex,
    coverReady: (c) => {
      rebuildChunkGeometries(c);
      drawChunkMinimap(world, c);
      rescatter(c);
      refreshChunkCorridor(c);
    },
  };

  /** "How far is the nearest road" for houses and trees: route and OSM roads. */
  const clearanceIndex = {
    distanceTo(x, z, limit = 40) {
      const a = world.routeIndex ? world.routeIndex.distanceTo(x, z, limit) : Infinity;
      const q = world.roads.nearest(x, z, Math.min(limit, 96));
      const b = Number.isFinite(q.distance) ? Math.max(0, q.distance - q.width + 2.5) : Infinity;
      return Math.min(a, b);
    },
  };

  /** Majority NVDB surface per OSM road; returns true when any road changed. */
  function surfaceOsmLines(lines, surfaces) {
    const project = (lat, lon) => world.worldFromLatLon(lat, lon);
    let changed = false;
    for (const line of lines) {
      const measured = assignSurfaces(line.samples, surfaces, project, { maxDist: 10 });
      if (measured < line.samples.length / 2) continue;
      const counts = {};
      for (const p of line.samples) if (p.surface) counts[p.surface] = (counts[p.surface] || 0) + 1;
      const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (best && best !== line.surface) {
        line.surface = best;
        line.paved = best === 'asphalt';
        changed = true;
      }
    }
    return changed;
  }

  /** NVDB surfaces arrived (or the route changed): apply to route and OSM roads. */
  function applyChunkSurfaces(chunk) {
    if (!chunk.surfaces?.length) return;
    const project = (lat, lon) => world.worldFromLatLon(lat, lon);
    const route = world.route;
    if (route) {
      const inside = (p) => p.x >= chunk.x0 && p.x < chunk.x0 + CHUNK && p.z >= chunk.z0 && p.z < chunk.z0 + CHUNK;
      const measured = assignSurfaces(route.samples.filter(inside), chunk.surfaces, project, { maxDist: 14 });
      if (measured) refreshChunkRoad(chunk);
    }
    if (chunk.osmRoads?.length && surfaceOsmLines(chunk.osmRoads, chunk.surfaces)) {
      world.roads.setChunk(chunk.key, chunk.osmRoads);
      if (chunk.osmRoadGroup) {
        disposeObject(chunk.osmRoadGroup);
        chunk.group.remove(chunk.osmRoadGroup);
      }
      chunk.osmRoadGroup = buildRoadMeshes(chunk.osmRoads, world);
      if (chunk.osmRoadGroup) chunk.group.add(chunk.osmRoadGroup);
    }
  }

  /** OSM roads of one chunk: carve, ribbons, and the shared road network. */
  function refreshChunkOsmRoads(chunk) {
    if (chunk.osmRoadGroup) {
      disposeObject(chunk.osmRoadGroup);
      chunk.group.remove(chunk.osmRoadGroup);
      chunk.osmRoadGroup = null;
    }
    if (!chunk.osm) return;
    const route = world.route;
    const roads = prepareChunkRoads(chunk.osm.roads, world, { x0: chunk.x0, z0: chunk.z0, size: CHUNK }, {
      avoid: route ? { index: world.routeIndex, distance: route.cutHalf + 4 } : null,
    });
    chunk.osmRoads = roads;
    if (chunk.surfaces?.length) surfaceOsmLines(roads, chunk.surfaces);
    world.roads.setChunk(chunk.key, roads);
    if (!roads.length) return;
    carveChunk(chunk);
    rebuildChunkGeometries(chunk);
    refreshChunkCorridor(chunk);
    fine.recarveWithin(chunk.x0 - 80, chunk.z0 - 80, CHUNK + 160);
    chunk.osmRoadGroup = buildRoadMeshes(roads, world);
    if (chunk.osmRoadGroup) chunk.group.add(chunk.osmRoadGroup);
    if (world.freeDrive && !world.roads.snapped) {
      // First roads near the spawn: put the car on the nearest one.
      const pose = world.roads.poseNear(world.roads.spawn.x, world.roads.spawn.z, 600);
      if (pose) {
        world.roads.spawn = pose;
        world.roads.start = { x: pose.x, z: pose.z };
        world.roads.finish = { x: pose.x, z: pose.z };
        world.roads.snapped = true;
        world.onSpawnSnapped?.(pose);
      }
    }
    rescatter(chunk);
  }

  /** Real road signs beside the stage road, limited to this chunk's square. */
  function refreshChunkSigns(chunk) {
    if (chunk.signGroup) {
      disposeObject(chunk.signGroup);
      chunk.group.remove(chunk.signGroup);
      chunk.signGroup = null;
    }
    const route = world.route;
    const roadRef = route || (world.roads.segmentCount ? world.roads : null);
    if (!roadRef || !chunk.signData) return;
    const inside = (x, z) => x >= chunk.x0 && x < chunk.x0 + CHUNK && z >= chunk.z0 && z < chunk.z0 + CHUNK;
    const signs = chunk.signData.signs.filter((sg) => {
      const w = world.worldFromLatLon(sg.lat, sg.lon);
      return inside(w.x, w.z);
    });
    // Speed-limit changes are synthesised from the route samples that lie in
    // this chunk only, so neighbouring chunks never place the same plate twice.
    const samples = route ? route.samples.filter((p) => inside(p.x, p.z)) : [];
    if (!signs.length && !samples.length) return;
    const local = {
      samples,
      roadWidth: roadRef.roadWidth,
      cutHalf: roadRef.cutHalf,
      length: roadRef.length,
      nearest: (x, z) => roadRef.nearest(x, z),
    };
    const group = buildChunkSigns({ signs, speedLimits: chunk.signData.speedLimits }, world, local, {
      seed: (hash2(chunk.ci, chunk.cj, 31) * 4294967296) >>> 0,
    });
    if (group) {
      chunk.signGroup = group;
      chunk.group.add(group);
    }
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
    world.roads.removeChunk(chunk.key);
    world.buildings.removeChunk(chunk.key);
    chunk.corridorMesh = null;
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

    // Overpass retries for chunks whose map features never arrived.
    if (!overpassBlocked()) {
      const now = performance.now();
      for (const chunk of chunks.values()) {
        if (chunk.state === 'ready' && !chunk.osm && !chunk.osmPending && chunk.osmRetryAt && chunk.osmRetryAt < now) {
          requestChunkOsm(world, chunk, featureHooks);
        }
      }
    }

    // The 1 m ground along the roads near the car: the stage route and the
    // road network around the led point feed the tile picker (gathered only
    // when it actually picks, a few times a second).
    fine.update(fx, fz, () => {
      const roadPoints = [];
      if (world.route) {
        const s = world.route.samples;
        for (let i = 0; i < s.length; i += 2) {
          const p = s[i];
          if (Math.abs(p.x - px) < 700 && Math.abs(p.z - pz) < 700) roadPoints.push(p);
        }
      }
      for (const seg of world.roads.segmentsNear(px, pz, 550)) roadPoints.push({ x: seg.ax, z: seg.az });
      return roadPoints.length ? roadPoints : [{ x: px, z: pz }];
    });
    // Chunk meshes with new holes: rebuild one per frame, once the tiles
    // around it have settled for a moment (or it has waited long enough).
    if (dirtyChunks.size) {
      const nowT = performance.now();
      let pickChunk = null;
      for (const [chunk, at] of dirtyChunks) {
        if (nowT - at.last > 250 || nowT - at.first > 1500) { pickChunk = chunk; break; }
      }
      if (pickChunk) {
        dirtyChunks.delete(pickChunk);
        if (pickChunk.state === 'ready') {
          rebuildChunkGeometries(pickChunk);
          refreshChunkCorridor(pickChunk);
        }
      }
    }

    // Houses are drawn only within HOUSE_DRAW_DISTANCE of the car (4× a second).
    const nowMs = performance.now();
    if (nowMs - lastHouseCull > 250) {
      lastHouseCull = nowMs;
      for (const chunk of chunks.values()) {
        if (chunk.state === 'ready' && chunk.buildingGroup) cullHouses(chunk.buildingGroup, fx, fz, HOUSE_DRAW_DISTANCE);
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
    fine.recarveWithin(-Infinity, -Infinity, Infinity);
    for (const chunk of [...chunks.values()]) {
      if (chunk.state !== 'ready') continue;
      carveChunk(chunk);
      rebuildChunkGeometries(chunk);
      refreshChunkCorridor(chunk);
      // Regrow the forest (the 6 m clearance rule applies to the new road)
      // and re-place the houses from their cached footprints.
      rescatter(chunk);
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
        world.buildings.setChunk(chunk.key, houses?.userData.boxes || []);
      }
      refreshChunkRoad(chunk);
      refreshChunkOsmRoads(chunk);
      applyChunkSurfaces(chunk);
      refreshChunkSigns(chunk);
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
        if (chunk.cover) tintByCover(chunk.cover, chunk.x0 + gi * CELL, chunk.z0 + gj * CELL, color);
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
  if (freeDrive) {
    const spawn = points[0];
    world.roads.spawn = { x: spawn.x, z: spawn.z, yaw: heading };
    world.roads.start = { x: spawn.x, z: spawn.z };
    world.roads.finish = { x: spawn.x, z: spawn.z };
    onProgress?.(0.55, 'Loading the first terrain chunks…');
    await world.ensureReady(spawn.x, spawn.z, {
      rings: 1,
      onTick: (p) => onProgress?.(0.55 + p * 0.3, 'Loading the first terrain chunks…'),
    });
    // Give the spawn chunk's OpenStreetMap roads a moment to arrive so the
    // car starts on a carved road; a slow Overpass does not block the drive.
    const deadline = performance.now() + 12000;
    while (!world.roads.snapped && performance.now() < deadline && !disposed) {
      onProgress?.(0.85 + ((12000 - (deadline - performance.now())) / 12000) * 0.1, 'Finding the road under the car…');
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    log.info(`free-drive world ready at ${anchor.lat.toFixed(4)}, ${anchor.lon.toFixed(4)}${world.roads.snapped ? ' (on a road)' : ' (roads pending)'}`);
    return world;
  }
  onProgress?.(0.45, 'Smoothing the master track…');
  const profile = geometry.profile || 'driving';
  const route = makeRoute(points, world, {
    name: `${ROUTE_PROFILE_NAMES[profile] || 'OSRM road'} stage`,
    source: 'osrm',
    smooth: 1,
    spacing: 5,
    simplifyEpsilon: 2,
    roadWidth: profile === 'driving' ? LANES.two.half : LANES.one.half,
    cutHalf: profile === 'driving' ? LANES.two.cut : LANES.one.cut,
    surface: profile === 'driving' ? 'asphalt' : 'gravel',
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
