import * as THREE from 'three';
import { logger } from './log.js';

/**
 * Real-world features for one terrain chunk, from the OpenStreetMap Overpass
 * API. One request per chunk returns, with full geometry (`out geom`):
 *
 *   buildings  – footprint polygons + tags → oriented low-poly houses
 *   areas      – land use / land cover polygons (fields, forest, water, …)
 *   waterways  – river / stream centre lines
 *   roads      – highway centre lines (for free drive and side roads)
 *
 * Buildings are placed exactly where they stand: the footprint's minimum-area
 * bounding rectangle gives the house its true heading and size, and the
 * `building=*` tag picks the family (house, barn, shed, church, industrial)
 * that decides height, roof pitch and colours. Each chunk draws its houses
 * with a few InstancedMeshes (walls + gabled roofs), so a village is cheap.
 */

import { cache } from './cache.js';

const log = logger('buildings');

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

const MAX_PER_CHUNK = 220;
const ATTEMPT_TIMEOUT = 12000;     // the mirror that answered last time
const RACE_TIMEOUT = 20000;        // when racing the mirrors for a first answer
const PENALTY_MS = 120000;         // a mirror that failed is skipped for this long
const MAX_CONCURRENT = 2;          // public Overpass instances allow two slots per client
const BREAKER_MS = 60000;          // after every mirror failed, skip Overpass for this long

let blockedUntil = 0;
/** True while Overpass is considered down (every mirror failed recently). */
export function overpassBlocked() {
  return Date.now() < blockedUntil;
}

// Some public mirrors hang for the whole timeout from some networks while
// another answers in half a second. Remember the one that answered last and
// ask it alone; when none is known (or it fails), race the live ones and keep
// the first to answer. A mirror that failed sits out for a while.
let preferred = null;
const downUntil = new Map();
/** Test hook / diagnostics: which mirror is being used, and the penalty list. */
export function overpassState() {
  return { preferred, down: [...downUntil.entries()].filter(([, t]) => t > Date.now()).map(([e]) => e) };
}
export function resetOverpassState() {
  preferred = null;
  downUntil.clear();
  blockedUntil = 0;
}

let inFlight = 0;
const waiting = [];
/** Run `task` when an Overpass slot is free (FIFO). */
function withSlot(task) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      inFlight++;
      try { resolve(await task()); } catch (e) { reject(e); } finally {
        inFlight--;
        const next = waiting.shift();
        if (next) next();
      }
    };
    if (inFlight < MAX_CONCURRENT) run(); else waiting.push(run);
  });
}

const AREA_LANDUSE = ['farmland', 'meadow', 'orchard', 'farmyard', 'grass', 'forest',
  'residential', 'industrial', 'commercial', 'retail', 'quarry', 'cemetery'];
const AREA_NATURAL = ['wood', 'water', 'wetland', 'scrub', 'grassland', 'heath', 'bare_rock', 'scree', 'sand'];
const WATERWAYS = ['river', 'stream', 'canal', 'drain', 'ditch'];
export const ROAD_CLASSES = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service', 'track'];

/**
 * Ask Overpass for every mapped feature the game renders inside a lat/lon
 * bbox. Returns `{ buildings, areas, waterways }` (all arrays, possibly empty
 * when the service is unreachable).
 */
export function fetchOsmChunk(bbox) {
  const key = `overpass:${[bbox.minLat, bbox.minLon, bbox.maxLat, bbox.maxLon].map((v) => v.toFixed(5)).join(',')}`;
  return cache.fetch(key, async () => {
    if (overpassBlocked()) return null;
    const elements = await withSlot(() => fetchOsmChunkNow(bbox));
    return elements; // null (nothing answered) is not cached
  }, { kind: 'osm' }).then((elements) => (elements ? parseElements(elements) : null));
}

/** One POST to one mirror; resolves to the parsed features or throws. */
async function askMirror(endpoint, query, timeoutMs, controller = new AbortController()) {
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.elements || [];
  } finally {
    clearTimeout(timer);
  }
}

function markDown(endpoint, error) {
  downUntil.set(endpoint, Date.now() + PENALTY_MS);
  if (preferred === endpoint) preferred = null;
  log.debug(`overpass mirror failed (${endpoint}): ${error?.message || error}`);
}

async function fetchOsmChunkNow({ minLat, minLon, maxLat, maxLon }) {
  const bbox = `${minLat.toFixed(6)},${minLon.toFixed(6)},${maxLat.toFixed(6)},${maxLon.toFixed(6)}`;
  // Ways only for land cover and water: multipolygon *relations* for forests
  // and big lakes can span hundreds of km² and make Overpass time out.
  const query = `[out:json][timeout:45];(`
    + `way["building"](${bbox});`
    + `relation["building"]["type"="multipolygon"](${bbox});`
    + `way["landuse"~"^(${AREA_LANDUSE.join('|')})$"](${bbox});`
    + `way["natural"~"^(${AREA_NATURAL.join('|')})$"](${bbox});`
    + `way["waterway"~"^(${WATERWAYS.join('|')})$"](${bbox});`
    + `way["highway"~"^(${ROAD_CLASSES.join('|')})$"](${bbox});`
    + `);out geom;`;
  const now = Date.now();
  const live = OVERPASS_ENDPOINTS.filter((e) => (downUntil.get(e) || 0) <= now);
  const candidates = live.length ? live : OVERPASS_ENDPOINTS;
  let lastError = null;

  // 1. The mirror that answered last time, on its own.
  if (preferred && candidates.includes(preferred)) {
    try {
      return await askMirror(preferred, query, ATTEMPT_TIMEOUT);
    } catch (error) {
      lastError = error;
      markDown(preferred, error);
    }
  }

  // 2. Race the others: the first good answer wins and cancels the rest.
  const racers = candidates.filter((e) => e !== preferred);
  if (racers.length) {
    const controllers = racers.map(() => new AbortController());
    let winner = null;
    try {
      const result = await Promise.any(racers.map((endpoint, i) => askMirror(endpoint, query, RACE_TIMEOUT, controllers[i])
        .then((features) => {
          if (!winner) {
            winner = endpoint;
            controllers.forEach((c, j) => { if (j !== i) c.abort(); });
          }
          return features;
        })
        .catch((error) => {
          if (!winner) markDown(endpoint, error); // a loser cancelled by the winner is not "down"
          lastError = error;
          throw error;
        })));
      if (preferred !== winner) log.info(`overpass: using ${winner}`);
      preferred = winner;
      return result;
    } catch {
      // every racer failed; fall through to the breaker
    }
  }

  log.warn(`map features unavailable: ${lastError?.message || 'no endpoint answered'} — retrying in ${BREAKER_MS / 1000} s`);
  blockedUntil = Date.now() + BREAKER_MS;
  // Let the UI explain why houses and roads are missing (main.js shows a toast).
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('rally:overpass-down', { detail: { message: lastError?.message || 'no answer' } }));
  }
  return null;
}

/** Backwards-compatible helper: only the building footprints. */
export async function fetchBuildings(bbox) {
  return (await fetchOsmChunk(bbox))?.buildings || [];
}

/** Rings of a way or multipolygon relation, as arrays of `{lat, lon}`. */
function ringsOf(el) {
  if (el.type === 'way') {
    return el.geometry && el.geometry.length >= 3 ? [el.geometry] : [];
  }
  if (el.type === 'relation') {
    const rings = [];
    for (const m of el.members || []) {
      if (m.type === 'way' && m.geometry && m.geometry.length >= 3 && m.role !== 'inner') rings.push(m.geometry);
    }
    return rings;
  }
  return [];
}

function parseElements(elements) {
  const buildings = [];
  const areas = [];
  const waterways = [];
  const roads = [];
  for (const el of elements) {
    const tags = el?.tags;
    if (!tags) continue;
    if (tags.highway && el.type === 'way' && el.geometry?.length >= 2) {
      roads.push({
        id: el.id,
        kind: tags.highway,
        name: tags.name || tags.ref || null,
        surface: tags.surface || null,
        maxspeed: Number(tags.maxspeed) || null,
        oneway: tags.oneway === 'yes',
        points: el.geometry,
      });
      continue;
    }
    if (tags.building) {
      const rings = ringsOf(el);
      if (!rings.length) continue;
      // The outer ring with the most vertices is the footprint; holes and
      // courtyards do not change where the walls go.
      const polygon = rings.reduce((a, b) => (b.length > a.length ? b : a));
      buildings.push({ polygon, tags });
      if (buildings.length >= MAX_PER_CHUNK * 2) break;
      continue;
    }
    if (tags.waterway && el.type === 'way' && el.geometry?.length >= 2) {
      waterways.push({
        kind: tags.waterway,
        name: tags.name || null,
        width: Number(tags.width) || null,
        points: el.geometry,
      });
      continue;
    }
    const kind = tags.landuse || tags.natural;
    if (!kind) continue;
    const rings = ringsOf(el);
    if (!rings.length) continue;
    areas.push({
      kind,
      leaf: tags.leaf_type || null,
      water: tags.water || null,
      wetland: tags.wetland || null,
      name: tags.name || null,
      rings,
    });
  }
  return { buildings, areas, waterways, roads };
}

/* ------------------------------------------------------------------ *
 *  Footprint → oriented box                                            *
 * ------------------------------------------------------------------ */

function convexHull(points) {
  const pts = points.slice().sort((a, b) => a.x - b.x || a.z - b.z);
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/** Minimum-area bounding rectangle of a set of world-space points. */
export function orientedRectangle(points) {
  const hull = convexHull(points);
  if (hull.length < 2) return null;
  let best = null;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    const yaw = Math.atan2(b.z - a.z, b.x - a.x);
    const c = Math.cos(-yaw);
    const s = Math.sin(-yaw);
    let minU = Infinity; let maxU = -Infinity; let minV = Infinity; let maxV = -Infinity;
    for (const p of hull) {
      const u = p.x * c - p.z * s;
      const v = p.x * s + p.z * c;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    const area = (maxU - minU) * (maxV - minV);
    if (!best || area < best.area) {
      const cu = (minU + maxU) / 2;
      const cv = (minV + maxV) / 2;
      best = {
        area,
        yaw,
        length: maxU - minU,
        width: maxV - minV,
        x: cu * Math.cos(yaw) - cv * Math.sin(yaw),
        z: cu * Math.sin(yaw) + cv * Math.cos(yaw),
      };
    }
  }
  // The long side is the ridge line: report it as `length` along `yaw`.
  if (best && best.width > best.length) {
    [best.length, best.width] = [best.width, best.length];
    best.yaw += Math.PI / 2;
  }
  return best;
}

/* ------------------------------------------------------------------ *
 *  Building families                                                   *
 * ------------------------------------------------------------------ */

const FAMILIES = {
  // eaves height, roof pitch (rise / half-width), wall palette, roof palette
  house: { eaves: 3.4, pitch: 0.75, walls: [0xe9e6dc, 0xf1efe6, 0xd9b35a, 0xa33a2c, 0x8d9398, 0xe5cf7a, 0x5c6b63], roofs: [0x3a3d40, 0x25282a, 0x7a3b2e, 0x4a4e52] },
  cabin: { eaves: 2.6, pitch: 0.8, walls: [0x6b4a33, 0x8a5a3c, 0xa33a2c, 0x4f3b2a], roofs: [0x2d3a2e, 0x3a3d40, 0x5a4a3a] },
  barn: { eaves: 4.6, pitch: 0.7, walls: [0x9a2f23, 0xa33a2c, 0x8a2a20, 0x6e6a60], roofs: [0x3a3d40, 0x4a4e52, 0x25282a] },
  shed: { eaves: 2.5, pitch: 0.5, walls: [0x7d7467, 0x9a2f23, 0x5f6a5c, 0xcfc9b8], roofs: [0x3a3d40, 0x2a2d30] },
  boathouse: { eaves: 2.8, pitch: 0.8, walls: [0x9a2f23, 0x6b4a33, 0x8d9398], roofs: [0x3a3d40, 0x2a2d30] },
  church: { eaves: 6.5, pitch: 1.0, walls: [0xf1efe6, 0xe9e6dc, 0x9a2f23], roofs: [0x2a2d30, 0x3a3d40] },
  big: { eaves: 6.5, pitch: 0.22, walls: [0xb9b4a6, 0x9fa6a8, 0xd8d2c2, 0x6f7a7c, 0xc9b79a], roofs: [0x4a4e52, 0x3a3d40, 0x5a5e62] },
  block: { eaves: 9.0, pitch: 0.18, walls: [0xd8d2c2, 0xc8c2b2, 0xb59a7a, 0x9fa6a8], roofs: [0x3a3d40, 0x4a4e52] },
};

function familyFor(tags, length, width) {
  const b = (tags.building || 'yes').toLowerCase();
  const area = length * width;
  if (/^(church|chapel|cathedral)$/.test(b) || tags.amenity === 'place_of_worship') return 'church';
  if (/^(barn|farm_auxiliary|cowshed|stable|sty|agricultural|silo|greenhouse)$/.test(b)) return 'barn';
  if (/^(garage|garages|shed|roof|carport|hut|service|outbuilding|storage_tank|transformer_tower)$/.test(b)) return 'shed';
  if (/^(boathouse)$/.test(b)) return 'boathouse';
  if (/^(cabin|bungalow)$/.test(b)) return 'cabin';
  if (/^(apartments|dormitory|hotel|hospital|school|university|college|civic|public|office)$/.test(b)) return 'block';
  if (/^(industrial|warehouse|commercial|retail|supermarket|factory|hangar|manufacture|sports_hall|kindergarten)$/.test(b)) return 'big';
  if (/^(house|detached|residential|semidetached_house|terrace|farm|static_caravan)$/.test(b)) return area > 320 ? 'block' : 'house';
  // Untyped: let the footprint decide.
  if (area < 40) return 'shed';
  if (area > 600) return 'big';
  if (area > 260) return 'barn';
  return 'house';
}

function heightFor(tags, family) {
  const explicit = parseFloat(tags.height);
  const levels = parseFloat(tags['building:levels']);
  if (Number.isFinite(explicit) && explicit > 1.5) return Math.min(explicit * 0.8, 40);
  if (Number.isFinite(levels) && levels > 0) return Math.min(levels * 2.9, 40);
  return FAMILIES[family].eaves;
}

/* ------------------------------------------------------------------ *
 *  Geometry                                                            *
 * ------------------------------------------------------------------ */

let shared = null;

/** Unit wall box growing upward, and a unit gable roof with its ridge along x. */
function houseGeometry() {
  if (shared) return shared;
  const body = new THREE.BoxGeometry(1, 1, 1);
  body.translate(0, 0.5, 0);

  // Gable roof: a triangular prism, ridge along +x at y = 1, eaves at y = 0.
  // Five outward-facing faces (two slopes, two gable triangles, underside).
  const v = [];
  const push = (...pts) => { for (const p of pts) v.push(...p); };
  const A = [-0.5, 0, -0.5]; const B = [0.5, 0, -0.5]; const C = [0.5, 0, 0.5]; const D = [-0.5, 0, 0.5];
  const R0 = [-0.5, 1, 0]; const R1 = [0.5, 1, 0];
  push(A, B, R1, A, R1, R0);        // back slope (faces -z, +y)
  push(D, R1, C, D, R0, R1);        // front slope (faces +z, +y)
  push(A, R0, D);                   // gable -x
  push(B, C, R1);                   // gable +x
  push(A, D, C, A, C, B);           // underside (seen from below on hillsides)
  const roof = new THREE.BufferGeometry();
  roof.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  roof.computeVertexNormals();

  const spire = new THREE.ConeGeometry(0.5, 1, 4, 1);
  spire.rotateY(Math.PI / 4);
  spire.translate(0, 0.5, 0);
  shared = { body, roof, spire };
  return shared;
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

/**
 * Build the instanced houses for one chunk.
 *
 * @param placements array of `{ polygon: [{lat, lon}], tags }` from fetchOsmChunk
 * @param terrain    the streaming terrain (needs worldFromLatLon/sample/slope)
 * @param routeIndex cheap "distance to the road" lookups
 * @param seed       deterministic per-chunk seed
 */
export function buildChunkHouses(placements, terrain, routeIndex, seed = 1) {
  const rand = mulberry32(seed);
  const bodies = [];
  const roofs = [];
  const extras = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  const world = [];
  const boxes = []; // solid footprints for the car: { x, z, yaw, hl, hw }

  for (const b of placements) {
    if (bodies.length >= MAX_PER_CHUNK) break;
    world.length = 0;
    for (const p of b.polygon) {
      const w = terrain.worldFromLatLon(p.lat, p.lon);
      if (Number.isFinite(w.x) && Number.isFinite(w.z)) world.push({ x: w.x, z: w.z });
    }
    const rect = orientedRectangle(world);
    if (!rect || rect.length < 2 || rect.width < 1.5) continue;
    // Keep the road clear: a house in the middle of the stage is a rally hazard.
    if (routeIndex && routeIndex.distanceTo(rect.x, rect.z, 24) < 8) continue;
    const h = terrain.sample(rect.x, rect.z);
    if (h < 0.8) continue; // in the fjord
    const slope = terrain.slope(rect.x, rect.z);
    if (slope > 0.6) continue; // a cliff, not a building plot

    const family = familyFor(b.tags, rect.length, rect.width);
    const fam = FAMILIES[family];
    const length = Math.min(rect.length, 90);
    const width = Math.min(rect.width, 60);
    const eaves = heightFor(b.tags, family);
    const roofRise = Math.min(Math.max(width * 0.5 * fam.pitch, 0.6), 6.5);
    const yaw = -rect.yaw;

    // Foundations: on a slope the walls reach down far enough that the
    // downhill side stands on the ground instead of floating.
    const sink = 0.4 + slope * Math.max(length, width) * 0.5;
    pos.set(rect.x, h - sink, rect.z);
    q.setFromAxisAngle(yAxis, yaw);
    scl.set(length, eaves + sink, width);
    m.compose(pos, q, scl);
    color.setHex(fam.walls[Math.floor(rand() * fam.walls.length)]);
    bodies.push({ matrix: m.clone(), color: color.clone() });
    boxes.push({ x: rect.x, z: rect.z, yaw, hl: length / 2, hw: width / 2 });

    pos.set(rect.x, h + eaves - 0.02, rect.z);
    scl.set(length * 1.06, roofRise, width * 1.12);
    m.compose(pos, q, scl);
    color.setHex(fam.roofs[Math.floor(rand() * fam.roofs.length)]);
    roofs.push({ matrix: m.clone(), color: color.clone() });

    if (family === 'church') {
      // A tower with a spire at one gable end.
      const towerW = Math.min(width * 0.8, 6);
      const towerH = eaves + roofRise + 6;
      const dx = Math.cos(yaw) * (length / 2 - towerW / 2);
      const dz = -Math.sin(yaw) * (length / 2 - towerW / 2);
      pos.set(rect.x + dx, h - 0.4, rect.z + dz);
      scl.set(towerW, towerH + 0.4, towerW);
      m.compose(pos, q, scl);
      extras.push({ kind: 'body', matrix: m.clone(), color: new THREE.Color(fam.walls[0]) });
      pos.set(rect.x + dx, h + towerH, rect.z + dz);
      scl.set(towerW * 1.1, towerW * 1.6, towerW * 1.1);
      m.compose(pos, q, scl);
      extras.push({ kind: 'spire', matrix: m.clone(), color: new THREE.Color(0x2a2d30) });
    }
  }

  if (!bodies.length) return null;
  const group = new THREE.Group();
  group.name = 'houses';
  const { body, roof, spire } = houseGeometry();
  const instanced = (geometry, items) => {
    const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshLambertMaterial({ flatShading: true }), items.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    items.forEach((it, i) => {
      mesh.setMatrixAt(i, it.matrix);
      mesh.setColorAt(i, it.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // For distance culling: where each instance stands, its real matrix, and
    // whether it is currently drawn.
    mesh.userData.centers = items.map((it) => ({ x: it.matrix.elements[12], z: it.matrix.elements[14] }));
    mesh.userData.matrices = items.map((it) => it.matrix);
    mesh.userData.shown = new Uint8Array(items.length).fill(1);
    return mesh;
  };
  group.add(instanced(body, bodies), instanced(roof, roofs));
  const towers = extras.filter((e) => e.kind === 'body');
  const spires = extras.filter((e) => e.kind === 'spire');
  if (towers.length) group.add(instanced(body, towers));
  if (spires.length) group.add(instanced(spire, spires));
  group.userData.count = bodies.length;
  group.userData.boxes = boxes;
  return group;
}

export const HOUSE_DRAW_DISTANCE = 250; // metres from the car within which houses are drawn

const HIDDEN_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

/**
 * Draw only the houses within `radius` of (cx, cz): every other instance
 * gets a zero-scale matrix. Returns how many are drawn. Cheap enough to run
 * a few times a second over every loaded chunk.
 */
export function cullHouses(group, cx, cz, radius = HOUSE_DRAW_DISTANCE) {
  if (!group) return 0;
  const r2 = radius * radius;
  let drawn = 0;
  for (const mesh of group.children) {
    const { centers, matrices, shown } = mesh.userData;
    if (!centers) continue;
    let changed = false;
    for (let i = 0; i < centers.length; i++) {
      const dx = centers[i].x - cx;
      const dz = centers[i].z - cz;
      const show = dx * dx + dz * dz <= r2 ? 1 : 0;
      if (show) drawn++;
      if (shown[i] === show) continue;
      shown[i] = show;
      mesh.setMatrixAt(i, show ? matrices[i] : HIDDEN_MATRIX);
      changed = true;
    }
    if (changed) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere?.();
    }
  }
  return drawn;
}

/* ------------------------------------------------------------------ *
 *  Solid houses                                                        *
 * ------------------------------------------------------------------ */

/**
 * If a disc of `radius` at (px, pz) overlaps the house box, the push that
 * frees it: `{ nx, nz, depth }` (unit normal out of the wall, metres).
 * Boxes are the oriented footprints `{ x, z, yaw, hl, hw }` the builder
 * placed; `yaw` is the rotation about Y that the mesh was given.
 */
export function pushOutOfBox(box, px, pz, radius) {
  const dx = px - box.x;
  const dz = pz - box.z;
  const c = Math.cos(box.yaw);
  const s = Math.sin(box.yaw);
  // World → the box's local frame (inverse of three.js's rotation about Y).
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  const ox = box.hl + radius - Math.abs(lx);
  const oz = box.hw + radius - Math.abs(lz);
  if (ox <= 0 || oz <= 0) return null;
  let nlx = 0;
  let nlz = 0;
  let depth;
  if (ox < oz) { nlx = lx < 0 ? -1 : 1; depth = ox; } else { nlz = lz < 0 ? -1 : 1; depth = oz; }
  return { nx: nlx * c + nlz * s, nz: -nlx * s + nlz * c, depth };
}

/** House footprints of every loaded chunk in 64 m buckets, for the car. */
export class BuildingIndex {
  constructor(cell = 64) {
    this.cell = cell;
    this.buckets = new Map();
    this.byChunk = new Map();
  }

  key(i, j) { return `${i},${j}`; }

  setChunk(chunkKey, boxes) {
    this.removeChunk(chunkKey);
    const list = boxes || [];
    for (const b of list) {
      const r = Math.hypot(b.hl, b.hw);
      const i0 = Math.floor((b.x - r) / this.cell); const i1 = Math.floor((b.x + r) / this.cell);
      const j0 = Math.floor((b.z - r) / this.cell); const j1 = Math.floor((b.z + r) / this.cell);
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const k = this.key(i, j);
          let bucket = this.buckets.get(k);
          if (!bucket) this.buckets.set(k, (bucket = []));
          bucket.push({ box: b, chunk: chunkKey });
        }
      }
    }
    this.byChunk.set(chunkKey, list);
  }

  removeChunk(chunkKey) {
    if (!this.byChunk.has(chunkKey)) return;
    for (const [k, bucket] of this.buckets) {
      const kept = bucket.filter((e) => e.chunk !== chunkKey);
      if (kept.length) this.buckets.set(k, kept); else this.buckets.delete(k);
    }
    this.byChunk.delete(chunkKey);
  }

  /** Boxes whose bucket lies within `radius` of (x, z) (a superset; test each). */
  near(x, z, radius) {
    const r = Math.ceil(radius / this.cell);
    const bi = Math.floor(x / this.cell);
    const bj = Math.floor(z / this.cell);
    const out = new Set();
    for (let j = -r; j <= r; j++) {
      for (let i = -r; i <= r; i++) {
        const bucket = this.buckets.get(this.key(bi + i, bj + j));
        if (bucket) for (const e of bucket) out.add(e.box);
      }
    }
    return [...out];
  }

  get count() { let n = 0; for (const l of this.byChunk.values()) n += l.length; return n; }
}
