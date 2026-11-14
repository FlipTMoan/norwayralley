import * as THREE from 'three';
import { clamp, triSample } from './geo.js';
import { terrainColor } from './terrain.js';
import { carveProfile, ROAD_LIFT, ASPHALT_HEX, GRAVEL_HEX } from './corridor.js';
import { logger } from './log.js';

/**
 * Fine ground along the road.
 *
 * The streamed world is a 10.7 m grid. Inside a band of ±FINE_BAND metres
 * around the roads near the car, square tiles of the same Kartverket DTM are
 * fetched at 1 m, carved with the same road profile and start pad, and drawn
 * as their own meshes (1 m near the car, 2 m further out, with skirts). The
 * coarse chunk mesh gets a hole under every tile that has a mesh, so there is
 * one surface per place. `sample()` / `sampleBase()` answer from the fine
 * tiles first, so the car feels the 1 m ground too.
 *
 * Tiles are aligned to a whole number of coarse cells (TILE_CELLS), which is
 * what lets the chunk mesh cut cell-aligned holes at every LOD step.
 */

const log = logger('fine');

export const FINE_BAND = 100;        // metres each side of a road
export const TILE_CELLS = 16;        // coarse cells per tile side (16 × 10.67 m ≈ 171 m)
const NEAR_FULL = 150;               // 1 m mesh inside this distance
const MID_FULL = 400;                // 2 m mesh inside this, 3 m beyond
const KEEP = 900;                    // dispose tiles farther than this from the car
const MAX_LIVE = 30;                 // tiles held at once
const MAX_CONCURRENT = 2;            // DEM downloads in flight (chunks have their own slots)
const MAX_RETRIES = 3;
const PICK_EVERY = 400;              // ms between tile selections
const SKIRT = 2.5;

export function createFineTiles({
  cell, fetchDem, latLonFromWorld, group, material, linesFor, padFor = null, tint = null, onTileChange = null,
  now = () => performance.now(),
}) {
  const SIZE = cell * TILE_CELLS;
  // Samples per side: ~1 m spacing, with (N − 1) divisible by every mesh
  // step (1, 2, 3) so each level covers the tile exactly, edge to edge.
  let N = Math.ceil(SIZE) + 1;
  while ((N - 1) % 6) N++;
  const STEP = SIZE / (N - 1);
  const tiles = new Map();
  const queue = [];
  let inFlight = 0;
  let lastPick = -Infinity;
  let focus = { x: 0, z: 0 };
  let disposed = false;

  const keyOf = (ti, tj) => `${ti},${tj}`;
  const tileAt = (x, z) => tiles.get(keyOf(Math.floor(x / SIZE), Math.floor(z / SIZE)));
  const rectDistance = (t, x, z) => Math.hypot(
    Math.max(t.x0 - x, 0, x - (t.x0 + SIZE)),
    Math.max(t.z0 - z, 0, z - (t.z0 + SIZE)),
  );

  // ---- heights ---------------------------------------------------------
  function sampleGrid(h, x, z, t) {
    const u = (x - t.x0) / STEP;
    const v = (z - t.z0) / STEP;
    const i = clamp(Math.floor(u), 0, N - 2);
    const j = clamp(Math.floor(v), 0, N - 2);
    const fx = clamp(u - i, 0, 1);
    const fz = clamp(v - j, 0, 1);
    return triSample(h[j * N + i], h[j * N + i + 1], h[(j + 1) * N + i], h[(j + 1) * N + i + 1], fx, fz);
  }

  function carve(t) {
    t.heights.set(t.base);
    t.roadMask ||= new Uint8Array(N * N);
    t.roadMask.fill(0);
    const grid = { heights: t.heights, base: t.base, x0: t.x0, z0: t.z0, cell: STEP, n: N, roadMask: t.roadMask };
    const lines = linesFor(t) || [];
    if (lines.length) carveProfile(grid, lines, { lift: ROAD_LIFT });
    padFor?.(grid);
  }

  // ---- meshes ------------------------------------------------------------
  function buildGeometry(t, step) {
    const h = t.heights;
    const nCols = Math.floor((N - 1) / step) + 1;
    const count = nCols * nCols;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const at = (i, j) => h[clamp(j, 0, N - 1) * N + clamp(i, 0, N - 1)];
    const stride = STEP * step;
    for (let j = 0; j < nCols; j++) {
      const gj = j * step;
      const z = t.z0 + gj * STEP;
      for (let i = 0; i < nCols; i++) {
        const gi = i * step;
        const x = t.x0 + gi * STEP;
        const idx = j * nCols + i;
        const y = at(gi, gj);
        positions[idx * 3] = x; positions[idx * 3 + 1] = y; positions[idx * 3 + 2] = z;
        const gx = (at(gi + step, gj) - at(gi - step, gj)) / (2 * stride);
        const gz = (at(gi, gj + step) - at(gi, gj - step)) / (2 * stride);
        const road = t.roadMask ? t.roadMask[gj * N + gi] : 0;
        if (road >= 2) color.setHex(road === 3 ? ASPHALT_HEX : GRAVEL_HEX);
        else {
          terrainColor(y, Math.hypot(gx, gz), x, z, color);
          if (!road) tint?.(x, z, color);
        }
        colors[idx * 3] = color.r; colors[idx * 3 + 1] = color.g; colors[idx * 3 + 2] = color.b;
      }
    }
    const indices = [];
    for (let j = 0; j < nCols - 1; j++) {
      for (let i = 0; i < nCols - 1; i++) {
        const a = j * nCols + i;
        const b = a + 1;
        const c = a + nCols;
        indices.push(a, c, b, b, c, c + 1);
      }
    }
    // Skirts hide the seam against the coarse mesh around the tile.
    const skirtPos = [];
    const skirtCol = [];
    const skirtIdx = [];
    const edge = (list) => {
      const base = count + skirtPos.length / 3;
      for (const idx of list) {
        skirtPos.push(positions[idx * 3], positions[idx * 3 + 1] - SKIRT, positions[idx * 3 + 2]);
        skirtCol.push(colors[idx * 3] * 0.55, colors[idx * 3 + 1] * 0.55, colors[idx * 3 + 2] * 0.55);
      }
      for (let k = 0; k + 1 < list.length; k++) {
        skirtIdx.push(list[k], base + k, list[k + 1], list[k + 1], base + k, base + k + 1);
      }
    };
    const north = []; const south = []; const west = []; const east = [];
    for (let i = 0; i < nCols; i++) { north.push(i); south.push((nCols - 1) * nCols + i); }
    for (let j = 0; j < nCols; j++) { west.push(j * nCols); east.push(j * nCols + nCols - 1); }
    edge(north); edge(south); edge(west); edge(east);
    const allPos = new Float32Array(count * 3 + skirtPos.length);
    allPos.set(positions); allPos.set(skirtPos, count * 3);
    const allCol = new Float32Array(count * 3 + skirtCol.length);
    allCol.set(colors); allCol.set(skirtCol, count * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(allPos, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(allCol, 3));
    geometry.setIndex(indices.concat(skirtIdx));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function levelFor(t) {
    const d = rectDistance(t, focus.x, focus.z);
    return d < NEAR_FULL ? 1 : d < MID_FULL ? 2 : 3;
  }

  function applyMesh(t, step) {
    const geometry = buildGeometry(t, step);
    if (!t.mesh) {
      t.mesh = new THREE.Mesh(geometry, material);
      t.mesh.name = `fine-${t.key}`;
      t.mesh.receiveShadow = true;
      t.mesh.castShadow = false;
      group.add(t.mesh);
    } else {
      t.mesh.geometry.dispose();
      t.mesh.geometry = geometry;
    }
    const first = !t.meshed;
    t.meshed = true;
    t.meshStep = step;
    if (first) onTileChange?.(t);
  }

  /** Build or re-level at most one tile mesh (nearest first). */
  function buildOne() {
    let best = null;
    let bestD = Infinity;
    for (const t of tiles.values()) {
      if (t.state !== 'ready') continue;
      const want = levelFor(t);
      if (t.meshed && t.meshStep === want && !t.dirty) continue;
      const d = rectDistance(t, focus.x, focus.z);
      if (d < bestD) { bestD = d; best = t; }
    }
    if (!best) return false;
    best.dirty = false;
    applyMesh(best, levelFor(best));
    return true;
  }

  // ---- loading -----------------------------------------------------------
  function createTile(ti, tj, priority) {
    const t = {
      ti, tj, key: keyOf(ti, tj), x0: ti * SIZE, z0: tj * SIZE, size: SIZE,
      state: 'queued', priority, attempts: 0, heights: null, base: null, mesh: null, meshed: false, meshStep: 0, dirty: false,
    };
    tiles.set(t.key, t);
    queue.push(t);
    return t;
  }

  async function loadTile(t) {
    const sw = latLonFromWorld(t.x0, t.z0 + SIZE);
    const ne = latLonFromWorld(t.x0 + SIZE, t.z0);
    const bbox = {
      minLat: Math.min(sw.lat, ne.lat), maxLat: Math.max(sw.lat, ne.lat),
      minLon: Math.min(sw.lon, ne.lon), maxLon: Math.max(sw.lon, ne.lon),
    };
    const dem = await fetchDem({ bbox, grid: N });
    if (disposed || t.state === 'disposed' || !tiles.has(t.key)) return;
    t.base = dem.heights;
    t.heights = dem.heights.slice();
    carve(t);
    t.state = 'ready';
  }

  function pump() {
    while (inFlight < MAX_CONCURRENT && queue.length) {
      let bi = -1;
      let bp = Infinity;
      for (let i = 0; i < queue.length; i++) if (queue[i].state === 'queued' && queue[i].priority < bp) { bp = queue[i].priority; bi = i; }
      if (bi < 0) { queue.length = 0; break; }
      const t = queue.splice(bi, 1)[0];
      t.state = 'loading';
      inFlight++;
      loadTile(t).catch((error) => {
        if (disposed || t.state === 'disposed') return;
        t.attempts++;
        log.warn(`fine tile ${t.key} failed (${t.attempts}/${MAX_RETRIES}): ${error.message}`);
        if (t.attempts >= MAX_RETRIES) { t.state = 'failed'; } else { t.state = 'queued'; t.priority += 1e6; queue.push(t); }
      }).finally(() => { inFlight--; if (!disposed) pump(); });
    }
  }

  function dropTile(t) {
    if (t.state === 'disposed') return;
    const hadMesh = t.meshed;
    t.state = 'disposed';
    if (t.mesh) { group.remove(t.mesh); t.mesh.geometry.dispose(); t.mesh = null; }
    tiles.delete(t.key);
    const qi = queue.indexOf(t);
    if (qi >= 0) queue.splice(qi, 1);
    if (hadMesh) onTileChange?.(t);
  }

  /** Which tiles the road points want, nearest first: Map key → { ti, tj, d }. */
  function wanted(points) {
    const want = new Map();
    for (const p of points) {
      const i0 = Math.floor((p.x - FINE_BAND) / SIZE);
      const i1 = Math.floor((p.x + FINE_BAND) / SIZE);
      const j0 = Math.floor((p.z - FINE_BAND) / SIZE);
      const j1 = Math.floor((p.z + FINE_BAND) / SIZE);
      for (let tj = j0; tj <= j1; tj++) {
        for (let ti = i0; ti <= i1; ti++) {
          const k = keyOf(ti, tj);
          if (want.has(k)) continue;
          const d = rectDistance({ x0: ti * SIZE, z0: tj * SIZE }, focus.x, focus.z);
          if (d <= KEEP) want.set(k, { ti, tj, d });
        }
      }
    }
    return [...want.entries()].sort((a, b) => a[1].d - b[1].d);
  }

  function pick(points) {
    const list = wanted(points);
    const keep = new Set(list.slice(0, MAX_LIVE).map(([k]) => k));
    for (const t of [...tiles.values()]) {
      if (!keep.has(t.key) && (t.state === 'queued' || rectDistance(t, focus.x, focus.z) > KEEP)) dropTile(t);
    }
    for (const [k, w] of list) {
      if (tiles.size >= MAX_LIVE) break;
      const t = tiles.get(k);
      if (t) { if (t.state === 'queued') t.priority = w.d; continue; }
      createTile(w.ti, w.tj, w.d);
    }
    pump();
  }

  return {
    SIZE,
    N,
    STEP,
    /** Per frame: where the car is, where it is heading, and road points near it. */
    update(fx, fz, points) {
      if (disposed) return;
      focus = { x: fx, z: fz };
      const t = now();
      if (points && t - lastPick > PICK_EVERY) { lastPick = t; pick(points); }
      buildOne();
    },
    forcePick(points) { lastPick = -Infinity; this.update(focus.x, focus.z, points); },
    sample(x, z) { const t = tileAt(x, z); return t && t.state === 'ready' ? sampleGrid(t.heights, x, z, t) : null; },
    sampleBase(x, z) { const t = tileAt(x, z); return t && t.state === 'ready' ? sampleGrid(t.base, x, z, t) : null; },
    /** True where a fine mesh is drawn (the coarse mesh leaves a hole there). */
    covers(x, z) { const t = tileAt(x, z); return Boolean(t && t.meshed); },
    /** Re-carve (and re-mesh) the tiles that overlap a rectangle, e.g. after new roads arrived. */
    recarveWithin(x0, z0, w, h = w) {
      for (const t of tiles.values()) {
        if (t.state !== 'ready') continue;
        if (t.x0 + SIZE < x0 || t.x0 > x0 + w || t.z0 + SIZE < z0 || t.z0 > z0 + h) continue;
        carve(t);
        t.dirty = true;
      }
    },
    stats() {
      let ready = 0; let loading = 0; let queued = 0; let triangles = 0;
      for (const t of tiles.values()) {
        if (t.state === 'ready') ready++; else if (t.state === 'loading') loading++; else if (t.state === 'queued') queued++;
        if (t.mesh) triangles += (t.mesh.geometry.index?.count || 0) / 3;
      }
      return { ready, loading, queued, triangles };
    },
    tiles,
    dispose() {
      disposed = true;
      for (const t of [...tiles.values()]) { t.state = 'disposed'; if (t.mesh) { group.remove(t.mesh); t.mesh.geometry.dispose(); } }
      tiles.clear();
      queue.length = 0;
    },
  };
}
