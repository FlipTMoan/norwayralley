import * as THREE from 'three';
import { logger } from './log.js';

/**
 * Phase 5 (V5 plan): procedural real-world buildings.
 *
 * When a terrain chunk loads, this module asks the OpenStreetMap Overpass API
 * for every building footprint inside the chunk's latitude/longitude bounds
 * and places retro low-poly houses exactly where they exist in real life.
 *
 *   way["building"](bbox); node["building"](bbox); relation["building"](bbox)
 *
 * Footprints come back with an `out center` summary: a centre coordinate plus
 * the bounds of the way/relation, which gives a good enough orientation and
 * size for a box-and-roof house. Instances are drawn with two InstancedMeshes
 * (bodies + roofs) per chunk, so a village costs a couple of draw calls.
 */

const log = logger('buildings');

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const MAX_PER_CHUNK = 120;
const REQUEST_TIMEOUT = 25000;

// One shared house geometry set for every chunk; instances only carry matrices.
let shared = null;

function houseGeometry() {
  if (shared) return shared;
  const body = new THREE.BoxGeometry(1, 1, 1);
  body.translate(0, 0.5, 0); // grow upward from the ground plane
  const roof = new THREE.ConeGeometry(Math.SQRT1_2, 0.62, 4, 1);
  roof.rotateY(Math.PI / 4);
  roof.translate(0, 1.0 + 0.31, 0);
  shared = { body, roof };
  return shared;
}

const WALL_COLORS = [0xd8cab0, 0xc25a41, 0xb7845f, 0x8a9a7b, 0xdfd6c5, 0xa8b4b8];
const ROOF_COLORS = [0x4a3a34, 0x3a4046, 0x59453c, 0x33393e];

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
 * Ask Overpass for buildings inside a lat/lon bbox. Returns an array of
 * `{ lat, lon, width, depth }` in metres (width along longitude, depth along
 * latitude), or an empty array when the service is unreachable.
 */
export async function fetchBuildings({ minLat, minLon, maxLat, maxLon }) {
  const bbox = `${minLat.toFixed(6)},${minLon.toFixed(6)},${maxLat.toFixed(6)},${maxLon.toFixed(6)}`;
  const query = `[out:json][timeout:20];(way["building"](${bbox});relation["building"](${bbox});node["building"](${bbox}););out center;`;
  let lastError = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return parseElements(data.elements || []);
    } catch (error) {
      lastError = error;
      log.debug(`overpass attempt failed (${endpoint}): ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
  log.warn(`buildings unavailable: ${lastError?.message || 'no endpoint answered'}`);
  return [];
}

function parseElements(elements) {
  const out = [];
  for (const el of elements) {
    if (!el || el.type === 'note') continue;
    // A footprint summary: centre + bounds. Nodes carry lat/lon directly and
    // get a default cottage size; ways/relations carry `center` + `bounds`.
    const center = el.type === 'node'
      ? { lat: el.lat, lon: el.lon }
      : el.center;
    if (!center || !Number.isFinite(center.lat) || !Number.isFinite(center.lon)) continue;
    let width = 9;   // metres along longitude
    let depth = 8;   // metres along latitude
    if (el.bounds) {
      const b = el.bounds;
      width = Math.max(2.5, (b.maxLon - b.minLon) * 111320 * Math.cos((center.lat * Math.PI) / 180));
      depth = Math.max(2.5, (b.maxLat - b.minLat) * 110950);
    }
    out.push({ lat: center.lat, lon: center.lon, width, depth });
    if (out.length >= MAX_PER_CHUNK * 3) break; // parse a little extra; the placer filters
  }
  return out;
}

/**
 * Build the instanced retro houses for one chunk.
 *
 * @param placements array of `{ lat, lon, width, depth }` from fetchBuildings
 * @param terrain    the streaming terrain (needs worldFromLatLon/sample/slope)
 * @param routeIndex cheap "distance to the road" lookups
 * @param seed       deterministic per-chunk seed
 */
export function buildChunkHouses(placements, terrain, routeIndex, seed = 1) {
  const rand = mulberry32(seed);
  const matrices = [];
  const colors = [];
  const roofColors = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const yawQ = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const color = new THREE.Color();

  for (const b of placements) {
    if (matrices.length >= MAX_PER_CHUNK) break;
    const w = terrain.worldFromLatLon(b.lat, b.lon);
    if (!Number.isFinite(w.x) || !Number.isFinite(w.z)) continue;
    // Keep the road clear: a house in the middle of the stage is a rally hazard.
    if (routeIndex && routeIndex.distanceTo(w.x, w.z, 24) < 10) continue;
    const h = terrain.sample(w.x, w.z);
    if (h < 1.5) continue; // in the fjord
    if (terrain.slope(w.x, w.z) > 0.35) continue; // would float off a hillside

    // Footprint long side → house yaw; sizes squeezed into a house-like range.
    const long = Math.max(b.width, b.depth);
    const short = Math.min(b.width, b.depth);
    const sx = THREE.MathUtils.clamp(long * 0.92, 5, 34);
    const sz = THREE.MathUtils.clamp(short * 0.92, 4.5, 26);
    const sy = THREE.MathUtils.clamp(Math.min(long, short) * 0.42, 3.2, 9.5);
    const yaw = b.width >= b.depth ? 0 : Math.PI / 2;

    pos.set(w.x, h + 0.05, w.z);
    yawQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    q.copy(yawQ);
    scl.set(sx, sy, sz);
    m.compose(pos, q, scl);
    matrices.push(m.clone());
    color.setHex(WALL_COLORS[Math.floor(rand() * WALL_COLORS.length)]);
    colors.push(color.clone());
    color.setHex(ROOF_COLORS[Math.floor(rand() * ROOF_COLORS.length)]);
    roofColors.push(color.clone());
  }

  if (!matrices.length) return null;
  const group = new THREE.Group();
  group.name = 'houses';
  const { body, roof } = houseGeometry();
  const bodyMesh = new THREE.InstancedMesh(
    body,
    new THREE.MeshLambertMaterial({ flatShading: true }),
    matrices.length,
  );
  const roofMesh = new THREE.InstancedMesh(
    roof,
    new THREE.MeshLambertMaterial({ flatShading: true }),
    matrices.length,
  );
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  roofMesh.castShadow = true;
  matrices.forEach((mat, i) => {
    bodyMesh.setMatrixAt(i, mat);
    roofMesh.setMatrixAt(i, mat);
    bodyMesh.setColorAt(i, colors[i]);
    roofMesh.setColorAt(i, roofColors[i]);
  });
  bodyMesh.instanceMatrix.needsUpdate = true;
  roofMesh.instanceMatrix.needsUpdate = true;
  if (bodyMesh.instanceColor) bodyMesh.instanceColor.needsUpdate = true;
  if (roofMesh.instanceColor) roofMesh.instanceColor.needsUpdate = true;
  group.add(bodyMesh, roofMesh);
  group.userData.count = matrices.length;
  return group;
}
