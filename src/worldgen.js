import { clamp, haversine, localProjection } from './geo.js';
import { createTerrainModel } from './terrain.js';
import { logger } from './log.js';
import { cache } from './cache.js';

/**
 * On-demand world generation for the whole of Norway.
 *
 * The demo scene is a baked GeoTIFF. This module does the same job from the
 * live Kartverket "høydedata" Web Coverage Service: given an OSRM route
 * anywhere in Norway, it asks the state 1 m DTM for the smallest square that
 * contains the route (plus a horizon margin), then builds a height field /
 * terrain model the rest of the game already knows how to drive on.
 *
 * The service is CORS-enabled and speaks WCS 1.0.0; a 768² coverage is a
 * ~2.4 MB uncompressed Float32 GeoTIFF, roughly the same payload as the baked
 * Preikestolen scene, and it covers the source 1 m model resampled to the
 * game's grid.
 */

const log = logger('worldgen');

export const NORWAY_BOUNDS = {
  minLat: 57.5,
  maxLat: 71.4,
  minLon: 3.5,
  maxLon: 31.5,
};

const WCS_URL = 'https://wcs.geonorge.no/skwms1/wcs.hoyde-dtm-nhm-25833';
const COVERAGE = 'nhm_dtm_topo_25833';

/** Largest world the generator will build, in metres. */
export const MAX_WORLD_SIZE = 6000;
const MIN_WORLD_SIZE = 1400;
/** Ground left around the route so the route does not end at the world edge. */
const ROUTE_MARGIN = 480;
/** Preferred metres per height sample. */
const TARGET_CELL = 6;
const MIN_GRID = 384;
const MAX_GRID = 900;

export function isInNorway(lat, lon) {
  return lat >= NORWAY_BOUNDS.minLat && lat <= NORWAY_BOUNDS.maxLat
    && lon >= NORWAY_BOUNDS.minLon && lon <= NORWAY_BOUNDS.maxLon;
}

/** Pick an even grid size that keeps roughly TARGET_CELL metres per sample. */
function chooseGrid(worldSize) {
  const n = Math.round(worldSize / TARGET_CELL);
  return clamp(2 * Math.round(n / 2), MIN_GRID, MAX_GRID);
}

/**
 * Work out the smallest square world that holds the whole route.
 * `coordinates` is an array of `{ lat, lon }`.
 */
export function planGeneratedWorld(coordinates, { margin = ROUTE_MARGIN } = {}) {
  if (!coordinates || coordinates.length < 2) {
    throw new Error('The route has no coordinates.');
  }
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const p of coordinates) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLon) minLon = p.lon;
    if (p.lon > maxLon) maxLon = p.lon;
  }
  const lat0 = (minLat + maxLat) / 2;
  const lon0 = (minLon + maxLon) / 2;
  const projection = localProjection(lat0, lon0);

  let half = 0;
  for (const p of coordinates) {
    const w = projection.worldFromLatLon(p.lat, p.lon);
    half = Math.max(half, Math.abs(w.x), Math.abs(w.z));
  }
  const required = half + margin;
  if (required * 2 > MAX_WORLD_SIZE) {
    const km = (required * 2 / 1000).toFixed(1);
    throw new Error(
      `That route needs a ${km} km world. Pick two points closer together — `
      + `a generated stage can be up to ${(MAX_WORLD_SIZE / 1000).toFixed(1)} km across.`,
    );
  }
  const worldSize = clamp(required * 2, MIN_WORLD_SIZE, MAX_WORLD_SIZE);
  const halfSize = worldSize / 2;
  const grid = chooseGrid(worldSize);

  // Corners in lat/lon. WCS 1.0.0 EPSG:4326 wants lon,lat order.
  const nw = projection.latLonFromWorld(-halfSize, -halfSize);
  const se = projection.latLonFromWorld(halfSize, halfSize);
  const bbox = {
    minLat: Math.min(nw.lat, se.lat),
    maxLat: Math.max(nw.lat, se.lat),
    minLon: Math.min(nw.lon, se.lon),
    maxLon: Math.max(nw.lon, se.lon),
  };

  return {
    projection,
    lat0,
    lon0,
    worldSize,
    halfSize,
    grid,
    bbox,
    requiredSize: required * 2,
  };
}

function demCoverageUrl(bbox, grid) {
  // BBOX=minLon,minLat,maxLon,maxLat (WCS 1.0.0, EPSG:4326).
  const b = `${bbox.minLon.toFixed(7)},${bbox.minLat.toFixed(7)},${bbox.maxLon.toFixed(7)},${bbox.maxLat.toFixed(7)}`;
  const params = new URLSearchParams({
    service: 'WCS',
    version: '1.0.0',
    request: 'GetCoverage',
    Coverage: COVERAGE,
    CRS: 'EPSG:4326',
    BBOX: b,
    WIDTH: String(grid),
    HEIGHT: String(grid),
    FORMAT: 'GeoTIFF',
  });
  return `${WCS_URL}?${params.toString()}`;
}

/** Download a DEM once; afterwards it comes from the local cache. */
function download(url, onProgress) {
  return cache.fetch(url, () => downloadNow(url, onProgress), { kind: 'dem' });
}

async function downloadNow(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Kartverket elevation service answered HTTP ${response.status}.`);
  }
  const total = Number(response.headers.get('content-length')) || 0;
  if (!response.body) return response.arrayBuffer();
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (total) onProgress?.(Math.min(0.92, received / total));
  }
  onProgress?.(1);
  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out.buffer;
}

/**
 * Fetch a square elevation coverage and return a Float32Array in the game's
 * row order (row 0 = north).
 */
export async function fetchDem({ bbox, grid, onProgress }) {
  if (!window.GeoTIFF) throw new Error('geotiff.js did not load.');
  const url = demCoverageUrl(bbox, grid);
  log.debug(`DEM request ${grid}×${grid}: ${url}`);
  const buffer = await download(url, (p) => onProgress?.(p));
  onProgress?.(0.55, 'Unpacking the 1 m elevation model…');
  const tiff = await window.GeoTIFF.fromArrayBuffer(buffer);
  const image = await tiff.getImage();
  const rasters = await image.readRasters({
    width: grid,
    height: grid,
    resampleMethod: 'bilinear',
  });
  const source = rasters[0];
  if (!source || source.length < grid * grid) {
    throw new Error('Kartverket returned an elevation tile the game could not read.');
  }
  const heights = new Float32Array(grid * grid);
  let minH = Infinity;
  let maxH = -Infinity;
  for (let i = 0; i < heights.length; i++) {
    const raw = source[i];
    // Sea and coverage edges come back as nodata; the game treats water as 0.
    const h = !Number.isFinite(raw) || raw < -1000 ? 0 : Math.max(0, raw);
    heights[i] = h;
    if (h < minH) minH = h;
    if (h > maxH) maxH = h;
  }
  return { heights, minH, maxH, grid };
}

/** Turn a planned world + DEM heights into a terrain model. */
export function terrainFromDem(plan, dem, { title = 'Norway' } = {}) {
  const terrain = createTerrainModel({
    heights: dem.heights,
    grid: plan.grid,
    sizeX: plan.worldSize,
    sizeZ: plan.worldSize,
    projection: plan.projection,
    scene: {
      name: 'generated',
      title,
      lat: plan.lat0,
      lon: plan.lon0,
    },
    basemapUrl: null,
    meta: {
      originX: 0,
      originY: 0,
      lat0: plan.lat0,
      lon0: plan.lon0,
      generated: true,
      bbox: plan.bbox,
    },
  });
  terrain.chunks = Math.max(4, Math.round((plan.grid - 1) / 73));
  terrain.generated = true;
  terrain.title = title;
  terrain.bbox = plan.bbox;
  return terrain;
}

/**
 * Full pipeline: plan → download → build. `coordinates` are `{lat, lon}`.
 */
export async function generateTerrain(coordinates, { title = 'Norway', onProgress } = {}) {
  const plan = planGeneratedWorld(coordinates);
  onProgress?.(0.08, `Generating a ${(plan.worldSize / 1000).toFixed(1)} km world…`);
  const dem = await fetchDem({
    bbox: plan.bbox,
    grid: plan.grid,
    onProgress: (p, text) => onProgress?.(0.08 + p * 0.72, text || 'Downloading elevation…'),
  });
  onProgress?.(0.85, 'Building the height field…');
  const terrain = terrainFromDem(plan, dem, { title });
  log.info(
    `generated terrain ${terrain.title}: ${(plan.worldSize / 1000).toFixed(1)} km, `
    + `${plan.grid}² samples, ${terrain.minH.toFixed(0)}–${terrain.maxH.toFixed(0)} m`,
  );
  return { terrain, plan };
}

/** Route length helper (used to report how big the stage is). */
export function coordinatesLength(coordinates) {
  let d = 0;
  for (let i = 1; i < coordinates.length; i++) d += haversine(coordinates[i - 1], coordinates[i]);
  return d;
}
