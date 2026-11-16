import { clamp, hash2, utmForward } from './geo.js';
import { logger } from './log.js';
import { cache } from './cache.js';

/**
 * Land cover for one square of the world, on a coarse cell grid (16 m):
 *
 *   cover    – what the ground is: forest, field, pasture, water, bog, …
 *   species  – spruce / pine / deciduous inside forest
 *   density  – 0..1 crown cover inside forest
 *
 * Two sources are blended. OpenStreetMap polygons (already fetched per chunk
 * by buildings.js) draw the fields, water, wetlands and built-up areas — in
 * Norway these were imported from the national AR5 land-resource map, so they
 * are precise. NIBIO's SR16 forest-resource map (WMS, 16 m raster, NLOD
 * licence) then says which trees grow where and how dense the canopy is:
 * the `SRRTRESLAG` layer paints spruce, pine and deciduous forest in three
 * flat colours, and `SRRKRONEDEK` paints crown cover on a ten-step ramp, so
 * the tiles can be read back pixel by pixel and classified by colour.
 */

const log = logger('landcover');

export const COVER = {
  OPEN: 0, FOREST: 1, FIELD: 2, PASTURE: 3, WATER: 4, WETLAND: 5, BUILT: 6, ROCK: 7, SCRUB: 8,
};
export const SPECIES = { NONE: 0, SPRUCE: 1, PINE: 2, DECIDUOUS: 3 };

export const SR16_URL = 'https://wms.nibio.no/cgi-bin/sr16';
export const NIBIO_ATTRIBUTION = 'Skogressurskart SR16 © NIBIO (NLOD)';

const SPECIES_SWATCHES = [
  [0x52, 0xb0, 0x38, SPECIES.SPRUCE],
  [0xcd, 0xaa, 0x65, SPECIES.PINE],
  [0xff, 0xdc, 0x82, SPECIES.DECIDUOUS],
];
const DENSITY_RAMP = ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b', '#00280f']
  .map((hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]);

/** OSM tag → cover class (higher priority wins where polygons overlap). */
const OSM_COVER = {
  water: [COVER.WATER, 9],
  wetland: [COVER.WETLAND, 7],
  farmland: [COVER.FIELD, 6],
  orchard: [COVER.FIELD, 6],
  meadow: [COVER.PASTURE, 5],
  grass: [COVER.PASTURE, 5],
  grassland: [COVER.PASTURE, 4],
  farmyard: [COVER.BUILT, 5],
  residential: [COVER.BUILT, 3],
  industrial: [COVER.BUILT, 3],
  commercial: [COVER.BUILT, 3],
  retail: [COVER.BUILT, 3],
  cemetery: [COVER.PASTURE, 3],
  quarry: [COVER.ROCK, 4],
  bare_rock: [COVER.ROCK, 2],
  scree: [COVER.ROCK, 2],
  sand: [COVER.OPEN, 2],
  heath: [COVER.SCRUB, 2],
  scrub: [COVER.SCRUB, 2],
  forest: [COVER.FOREST, 1],
  wood: [COVER.FOREST, 1],
};

export class LandCover {
  constructor({ x0, z0, size, res = 128 }) {
    this.x0 = x0;
    this.z0 = z0;
    this.size = size;
    this.res = res;
    this.cell = size / res;
    this.cover = new Uint8Array(res * res);
    this.species = new Uint8Array(res * res);
    this.density = new Float32Array(res * res);
    this.priority = new Uint8Array(res * res);
    this.sources = { osm: false, sr16: false };
  }

  index(x, z) {
    const i = Math.floor((x - this.x0) / this.cell);
    const j = Math.floor((z - this.z0) / this.cell);
    if (i < 0 || j < 0 || i >= this.res || j >= this.res) return -1;
    return j * this.res + i;
  }

  coverAt(x, z) { const k = this.index(x, z); return k < 0 ? COVER.OPEN : this.cover[k]; }
  speciesAt(x, z) { const k = this.index(x, z); return k < 0 ? SPECIES.NONE : this.species[k]; }
  densityAt(x, z) { const k = this.index(x, z); return k < 0 ? 0 : this.density[k]; }

  /** World centre of cell k. */
  centre(k) {
    const i = k % this.res;
    const j = (k - i) / this.res;
    return { x: this.x0 + (i + 0.5) * this.cell, z: this.z0 + (j + 0.5) * this.cell };
  }
}

/* ------------------------------------------------------------------ *
 *  OSM polygons → cover grid                                           *
 * ------------------------------------------------------------------ */

/** Even-odd scanline fill of one ring (world x/z) into the grid. */
function fillRing(lc, ring, cover, priority) {
  const n = ring.length;
  if (n < 3) return 0;
  let minJ = Infinity;
  let maxJ = -Infinity;
  for (const p of ring) {
    const j = (p.z - lc.z0) / lc.cell;
    if (j < minJ) minJ = j;
    if (j > maxJ) maxJ = j;
  }
  const j0 = Math.max(0, Math.floor(minJ));
  const j1 = Math.min(lc.res - 1, Math.ceil(maxJ));
  const xs = [];
  let painted = 0;
  for (let j = j0; j <= j1; j++) {
    const zc = lc.z0 + (j + 0.5) * lc.cell;
    xs.length = 0;
    for (let a = 0; a < n; a++) {
      const p = ring[a];
      const q = ring[(a + 1) % n];
      if ((p.z <= zc) === (q.z <= zc)) continue;
      xs.push(p.x + ((zc - p.z) / (q.z - p.z)) * (q.x - p.x));
    }
    if (xs.length < 2) continue;
    xs.sort((u, v) => u - v);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const i0 = Math.max(0, Math.ceil((xs[k] - lc.x0) / lc.cell - 0.5));
      const i1 = Math.min(lc.res - 1, Math.floor((xs[k + 1] - lc.x0) / lc.cell - 0.5));
      for (let i = i0; i <= i1; i++) {
        const idx = j * lc.res + i;
        if (priority < lc.priority[idx]) continue;
        lc.priority[idx] = priority;
        lc.cover[idx] = cover;
        painted++;
      }
    }
  }
  return painted;
}

/**
 * Paint OSM land-use / natural areas into the grid. `areas` is the array
 * from buildings.js (`{ kind, leaf, rings: [[{lat, lon}]] }`).
 */
export function rasterizeAreas(lc, areas, worldFromLatLon) {
  let painted = 0;
  const leafByCell = lc.species; // forest species hint from leaf_type until SR16 answers
  for (const area of areas || []) {
    const entry = OSM_COVER[area.kind];
    if (!entry) continue;
    const [cover, priority] = entry;
    for (const ring of area.rings) {
      const world = [];
      for (const p of ring) {
        const w = worldFromLatLon(p.lat, p.lon);
        if (Number.isFinite(w.x) && Number.isFinite(w.z)) world.push(w);
      }
      const before = painted;
      painted += fillRing(lc, world, cover, priority);
      if (cover === COVER.FOREST && painted > before && area.leaf) {
        const hint = area.leaf === 'broadleaved' ? SPECIES.DECIDUOUS
          : area.leaf === 'needleleaved' ? SPECIES.SPRUCE : SPECIES.NONE;
        if (hint) {
          // Only cells this ring painted and that have no species yet.
          for (let k = 0; k < lc.cover.length; k++) {
            if (lc.cover[k] === COVER.FOREST && leafByCell[k] === SPECIES.NONE) leafByCell[k] = hint;
          }
        }
      }
    }
  }
  lc.sources.osm = painted > 0;
  return painted;
}

/* ------------------------------------------------------------------ *
 *  NIBIO SR16 tiles → species + density                                *
 * ------------------------------------------------------------------ */

export function classifySpecies(r, g, b, a) {
  if (a < 64) return SPECIES.NONE;
  let best = SPECIES.NONE;
  let bestD = 90; // tolerance for anti-aliased edge pixels
  for (const [sr, sg, sb, sp] of SPECIES_SWATCHES) {
    const d = Math.abs(r - sr) + Math.abs(g - sg) + Math.abs(b - sb);
    if (d < bestD) { bestD = d; best = sp; }
  }
  return best;
}

export function classifyDensity(r, g, b, a) {
  if (a < 64) return 0;
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < DENSITY_RAMP.length; i++) {
    const [sr, sg, sb] = DENSITY_RAMP[i];
    const d = Math.abs(r - sr) + Math.abs(g - sg) + Math.abs(b - sb);
    if (d < bestD) { bestD = d; best = i; }
  }
  return bestD > 120 ? 0 : (best + 0.5) / DENSITY_RAMP.length;
}

/** UTM 33N bounding box of the square, via the world's lat/lon projection. */
export function utmBounds(lc, projection) {
  let minE = Infinity; let maxE = -Infinity; let minN = Infinity; let maxN = -Infinity;
  for (const [x, z] of [[lc.x0, lc.z0], [lc.x0 + lc.size, lc.z0], [lc.x0, lc.z0 + lc.size], [lc.x0 + lc.size, lc.z0 + lc.size]]) {
    const { lat, lon } = projection.latLonFromWorld(x, z);
    const { x: e, y: n } = utmForward(lat, lon);
    if (e < minE) minE = e; if (e > maxE) maxE = e;
    if (n < minN) minN = n; if (n > maxN) maxN = n;
  }
  return { minE, maxE, minN, maxN };
}

export function sr16Url(layer, { minE, maxE, minN, maxN }, width, height) {
  const params = new URLSearchParams({
    SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetMap', LAYERS: layer, STYLES: '',
    CRS: 'EPSG:25833', BBOX: `${minE.toFixed(1)},${minN.toFixed(1)},${maxE.toFixed(1)},${maxN.toFixed(1)}`,
    WIDTH: String(width), HEIGHT: String(height), FORMAT: 'image/png', TRANSPARENT: 'TRUE',
  });
  return `${SR16_URL}?${params}`;
}

/** Fetch one WMS tile and return its RGBA pixels (browser only). */
async function fetchPixels(url, width, height, signal) {
  const blob = await cache.fetch(url, async () => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.blob();
  }, { kind: 'sr16' });
  const bitmap = await createImageBitmap(blob);
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(width, height)
    : Object.assign(document.createElement('canvas'), { width, height });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return ctx.getImageData(0, 0, width, height).data;
}

/**
 * Sample SR16 species and crown cover into the grid. Cells the OSM pass
 * marked as fields, water, built-up etc. keep that cover; cells SR16 says
 * are forest become forest even where OSM has nothing.
 */
export async function applySr16(lc, projection, { timeout = 20000 } = {}) {
  const bounds = utmBounds(lc, projection);
  const width = clamp(Math.round((bounds.maxE - bounds.minE) / 16), 32, 512);
  const height = clamp(Math.round((bounds.maxN - bounds.minN) / 16), 32, 512);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const [species, density] = await Promise.all([
      fetchPixels(sr16Url('SRRTRESLAG', bounds, width, height), width, height, controller.signal),
      fetchPixels(sr16Url('SRRKRONEDEK', bounds, width, height), width, height, controller.signal),
    ]);
    const spanE = bounds.maxE - bounds.minE;
    const spanN = bounds.maxN - bounds.minN;
    let forest = 0;
    for (let k = 0; k < lc.cover.length; k++) {
      const c = lc.centre(k);
      const { lat, lon } = projection.latLonFromWorld(c.x, c.z);
      const { x: e, y: n } = utmForward(lat, lon);
      const px = clamp(Math.floor(((e - bounds.minE) / spanE) * width), 0, width - 1);
      const py = clamp(Math.floor(((bounds.maxN - n) / spanN) * height), 0, height - 1);
      const o = (py * width + px) * 4;
      const sp = classifySpecies(species[o], species[o + 1], species[o + 2], species[o + 3]);
      const dn = classifyDensity(density[o], density[o + 1], density[o + 2], density[o + 3]);
      const cover = lc.cover[k];
      if (sp !== SPECIES.NONE && (cover === COVER.OPEN || cover === COVER.FOREST || cover === COVER.SCRUB)) {
        lc.cover[k] = COVER.FOREST;
        lc.species[k] = sp;
        lc.density[k] = Math.max(0.15, dn || 0.5);
        forest++;
      } else if (cover === COVER.FOREST && lc.density[k] === 0) {
        lc.density[k] = dn || 0.55;
      }
    }
    lc.sources.sr16 = true;
    return forest;
  } finally {
    clearTimeout(timer);
  }
}

/** Give OSM-only forest cells a species and density when SR16 is missing. */
export function fillForestDefaults(lc) {
  for (let k = 0; k < lc.cover.length; k++) {
    if (lc.cover[k] !== COVER.FOREST) continue;
    if (lc.species[k] === SPECIES.NONE) {
      const i = k % lc.res;
      const j = (k - i) / lc.res;
      const n = hash2(i >> 2, j >> 2, 5);
      lc.species[k] = n < 0.6 ? SPECIES.SPRUCE : n < 0.8 ? SPECIES.PINE : SPECIES.DECIDUOUS;
    }
    if (lc.density[k] === 0) lc.density[k] = 0.55;
  }
}

/**
 * Add OSM polygons to a grid that may already carry SR16 forest: fields,
 * water and built-up land win over forest; forest keeps its SR16 species.
 */
export function addOsmAreas(lc, areas, projection) {
  try {
    rasterizeAreas(lc, areas, (lat, lon) => projection.worldFromLatLon(lat, lon));
  } catch (error) {
    log.warn(`OSM land cover failed: ${error.message}`);
  }
  fillForestDefaults(lc);
  return lc;
}

/**
 * Full build for one chunk: OSM polygons first, SR16 on top, defaults for
 * whatever is still blank. Never throws; sources that fail are simply absent.
 */
export async function buildLandCover({ x0, z0, size, res = 128, projection, areas = [], sr16 = true }) {
  const lc = new LandCover({ x0, z0, size, res });
  try {
    rasterizeAreas(lc, areas, (lat, lon) => projection.worldFromLatLon(lat, lon));
  } catch (error) {
    log.warn(`OSM land cover failed: ${error.message}`);
  }
  if (sr16) {
    try {
      await applySr16(lc, projection);
    } catch (error) {
      log.debug(`SR16 unavailable for ${x0},${z0}: ${error.message}`);
    }
  }
  fillForestDefaults(lc);
  return lc;
}

/* ------------------------------------------------------------------ *
 *  Ground colours                                                      *
 * ------------------------------------------------------------------ */

const TINTS = {
  [COVER.FIELD]: [0.66, 0.60, 0.30, 0.78],
  [COVER.PASTURE]: [0.44, 0.58, 0.26, 0.62],
  [COVER.WETLAND]: [0.47, 0.43, 0.24, 0.6],
  [COVER.WATER]: [0.16, 0.30, 0.36, 0.85],
  [COVER.BUILT]: [0.42, 0.41, 0.37, 0.5],
  [COVER.ROCK]: [0.46, 0.45, 0.42, 0.6],
  [COVER.SCRUB]: [0.36, 0.44, 0.24, 0.4],
};

/**
 * Modulate a terrain vertex colour by the land cover under it. Fields get
 * faint furrow stripes; forest floors darken with canopy density.
 */
export function tintByCover(lc, x, z, color) {
  const k = lc.index(x, z);
  if (k < 0) return color;
  const cover = lc.cover[k];
  if (cover === COVER.FOREST) {
    const d = 0.12 + lc.density[k] * 0.3;
    color.r += (0.17 - color.r) * d;
    color.g += (0.29 - color.g) * d;
    color.b += (0.15 - color.b) * d;
    return color;
  }
  const tint = TINTS[cover];
  if (!tint) return color;
  let [r, g, b, amount] = tint;
  if (cover === COVER.FIELD) {
    const stripe = hash2(Math.floor(x / 11), Math.floor(z / 90), 3) < 0.5 ? 0.93 : 1.05;
    const plot = 0.9 + hash2(Math.floor(x / 160), Math.floor(z / 160), 8) * 0.22;
    r *= stripe * plot; g *= stripe * plot; b *= plot;
  }
  color.r += (r - color.r) * amount;
  color.g += (g - color.g) * amount;
  color.b += (b - color.b) * amount;
  return color;
}
