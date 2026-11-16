import * as THREE from 'three';
import { terrainColor } from './terrain.js';

/**
 * Quadtree-style terrain LOD for the whole scene.
 *
 * The elevation model is a fixed height field, so instead of one 512×512 mesh
 * (roughly 520k triangles, all of them drawn every frame) the tile is cut into
 * a grid of chunks. Each chunk exists at three detail levels and swaps geometry
 * based on its distance to the car:
 *
 *   LOD 0  full 1-grid-step resolution   – under the car and just ahead
 *   LOD 1  half resolution                – the midground
 *   LOD 2  quarter resolution             – distant mountains
 *
 * Every chunk carries a small vertical "skirt" around its border, so the tiny
 * height difference where two LOD levels meet is hidden instead of showing as
 * a crack. The actual physics is unaffected: `terrain.sample()` still reads the
 * full-resolution height field.
 */

const STEPS = [1, 2, 4];          // grid cells per vertex at each LOD
const SKIRT_DROP = 6.0;           // metres the border hangs below the surface
const LOD0_DISTANCE = 430;        // metres from the chunk rectangle
const LOD1_DISTANCE = 1250;
const TARGET_CHUNK_CELLS = 73;    // keeps chunk geometry about the same size

/**
 * Build one chunk's geometry between two grid indices at a given LOD step.
 * Boundary skirts are appended so neighbouring chunks of different LOD never
 * show daylight between them.
 */
function buildChunkGeometry(terrain, i0, i1, j0, j1, step) {
  const G = terrain.grid;
  const cellsX = i1 - i0;
  const cellsZ = j1 - j0;
  const nCols = Math.ceil(cellsX / step) + 1;
  const nRows = Math.ceil(cellsZ / step) + 1;
  const indexI = [];
  const indexJ = [];
  for (let k = 0; k < nCols; k++) indexI.push(i0 + Math.min(k * step, cellsX));
  for (let l = 0; l < nRows; l++) indexJ.push(j0 + Math.min(l * step, cellsZ));

  const halfX = terrain.sizeX / 2;
  const halfZ = terrain.sizeZ / 2;
  const rows = nRows;
  const cols = nCols;
  const count = rows * cols;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  const strideWorldX = terrain.sizeX / (G - 1);
  const strideWorldZ = terrain.sizeZ / (G - 1);

  const heights = terrain.heights;
  const sampleIndex = (i, j) => heights[Math.min(G - 1, Math.max(0, j)) * G + Math.min(G - 1, Math.max(0, i))];

  for (let l = 0; l < rows; l++) {
    const gj = indexJ[l];
    const z = -halfZ + gj * strideWorldZ;
    for (let k = 0; k < cols; k++) {
      const gi = indexI[k];
      const x = -halfX + gi * strideWorldX;
      const idx = l * cols + k;
      const h = heights[gj * G + gi];
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = h;
      positions[idx * 3 + 2] = z;

      // Central difference in grid space gives a stable slope without a second
      // pass over every vertex of the chunk.
      const gx = (sampleIndex(gi + step, gj) - sampleIndex(gi - step, gj)) / (2 * strideWorldX * step || 1);
      const gz = (sampleIndex(gi, gj + step) - sampleIndex(gi, gj - step)) / (2 * strideWorldZ * step || 1);
      terrainColor(h, Math.hypot(gx, gz), x, z, color);
      colors[idx * 3] = color.r;
      colors[idx * 3 + 1] = color.g;
      colors[idx * 3 + 2] = color.b;
    }
  }

  const indices = [];
  for (let l = 0; l < rows - 1; l++) {
    for (let k = 0; k < cols - 1; k++) {
      const a = l * cols + k;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  // ---- skirts -------------------------------------------------------------
  const skirtPositions = [];
  const skirtColors = [];
  const skirtIndices = [];
  const addSkirt = (edge) => {
    const top = [];
    if (edge === 'north' || edge === 'south') {
      const row = edge === 'north' ? 0 : rows - 1;
      for (let k = 0; k < cols; k++) top.push(row * cols + k);
    } else {
      const col = edge === 'west' ? 0 : cols - 1;
      for (let l = 0; l < rows; l++) top.push(l * cols + col);
    }
    const base = count + skirtPositions.length / 3;
    for (const idx of top) {
      const px = positions[idx * 3];
      const py = positions[idx * 3 + 1];
      const pz = positions[idx * 3 + 2];
      skirtPositions.push(px, py - SKIRT_DROP, pz);
      skirtColors.push(colors[idx * 3] * 0.55, colors[idx * 3 + 1] * 0.55, colors[idx * 3 + 2] * 0.55);
    }
    for (let k = 0; k < top.length - 1; k++) {
      const t0 = top[k];
      const t1 = top[k + 1];
      const b0 = base + k;
      const b1 = base + k + 1;
      skirtIndices.push(t0, b0, t1, t1, b0, b1);
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

function buildWalls(terrain) {
  const halfX = terrain.sizeX / 2;
  const halfZ = terrain.sizeZ / 2;
  const depth = Math.max(60, terrain.minH + 80);
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x252b28 });
  const walls = new THREE.Group();
  walls.name = 'terrainWalls';
  const makeWall = (w, x, z, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, depth, 1, 1), wallMat);
    m.rotation.y = rot;
    m.position.set(x, -depth / 2 - 5, z);
    m.receiveShadow = true;
    walls.add(m);
  };
  makeWall(terrain.sizeX, 0, -halfZ, 0);
  makeWall(terrain.sizeX, 0, halfZ, Math.PI);
  makeWall(terrain.sizeZ, -halfX, 0, Math.PI / 2);
  makeWall(terrain.sizeZ, halfX, 0, -Math.PI / 2);
  return walls;
}

export function createTerrainLOD(terrain) {
  const group = new THREE.Group();
  group.name = 'terrain';
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
  const G = terrain.grid;
  // A generated world can be 384² … 900² samples, so keep the chunk count
  // proportional instead of hard-coding the demo scene's 7×7 split.
  const CHUNKS = Math.max(4, terrain.chunks ?? 7);
  const bound = (c) => Math.round((c * (G - 1)) / CHUNKS);
  const cellX = terrain.sizeX / (G - 1);
  const cellZ = terrain.sizeZ / (G - 1);
  const chunks = [];
  const pickables = [];
  let triangles = 0;
  let activeChunks = 0;
  let lastUpdate = -1;
  let lastFocus = { x: Infinity, z: Infinity };

  for (let cj = 0; cj < CHUNKS; cj++) {
    for (let ci = 0; ci < CHUNKS; ci++) {
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
      mesh.name = `terrain-${ci}-${cj}`;
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      mesh.userData.isTerrainChunk = true;
      const i0 = bound(ci);
      const i1 = bound(ci + 1);
      const j0 = bound(cj);
      const j1 = bound(cj + 1);
      const chunk = {
        ci,
        cj,
        i0,
        i1,
        j0,
        j1,
        mesh,
        x0: -terrain.sizeX / 2 + i0 * cellX,
        z0: -terrain.sizeZ / 2 + j0 * cellZ,
        x1: -terrain.sizeX / 2 + i1 * cellX,
        z1: -terrain.sizeZ / 2 + j1 * cellZ,
        level: -1,
        geometries: [null, null, null],
      };
      chunks.push(chunk);
      group.add(mesh);
      pickables.push(mesh);
    }
  }

  const bounding = new THREE.Box3(
    new THREE.Vector3(-terrain.sizeX / 2, terrain.minH, -terrain.sizeZ / 2),
    new THREE.Vector3(terrain.sizeX / 2, terrain.maxH, terrain.sizeZ / 2),
  );

  function chunkDistance(chunk, x, z) {
    const dx = Math.max(chunk.x0 - x, 0, x - chunk.x1);
    const dz = Math.max(chunk.z0 - z, 0, z - chunk.z1);
    return Math.hypot(dx, dz);
  }

  function ensureGeometry(chunk, level) {
    if (!chunk.geometries[level]) {
      chunk.geometries[level] = buildChunkGeometry(
        terrain, chunk.i0, chunk.i1, chunk.j0, chunk.j1, STEPS[level],
      );
    }
    return chunk.geometries[level];
  }

  function applyLevel(chunk, level) {
    if (chunk.level === level) return;
    chunk.mesh.geometry = ensureGeometry(chunk, level);
    chunk.level = level;
    chunk.mesh.castShadow = level <= 1;
    chunk.mesh.userData.lod = level;
  }

  /** Pick a level for each chunk from its distance to the focus point. */
  function update(focusX, focusZ, force = false) {
    const now = performance.now();
    if (!force && now - lastUpdate < 180) return false;
    if (!force
      && Math.abs(focusX - lastFocus.x) < 6
      && Math.abs(focusZ - lastFocus.z) < 6) return false;
    lastUpdate = now;
    lastFocus = { x: focusX, z: focusZ };
    let tris = 0;
    for (const chunk of chunks) {
      const d = chunkDistance(chunk, focusX, focusZ);
      let level;
      if (d < LOD0_DISTANCE) level = 0;
      else if (d < LOD1_DISTANCE) level = 1;
      else level = 2;
      // Hysteresis: once a chunk is detailed, keep it a little longer so a car
      // hovering at a threshold does not rebuild the same two levels forever.
      if (chunk.level >= 0) {
        if (chunk.level === 0 && d < LOD0_DISTANCE * 1.2) level = 0;
        if (chunk.level <= 1 && level === 2 && d < LOD1_DISTANCE * 1.15) level = 1;
      }
      applyLevel(chunk, level);
      const g = chunk.mesh.geometry;
      tris += (g.index?.count || 0) / 3;
    }
    triangles = tris;
    activeChunks = chunks.length;
    return true;
  }

  /** Throw away chunk geometry after the height field changed (road carve). */
  function refresh() {
    for (const chunk of chunks) {
      for (let i = 0; i < chunk.geometries.length; i++) {
        chunk.geometries[i]?.dispose();
        chunk.geometries[i] = null;
      }
      chunk.level = -1;
    }
    // Rebuild all three levels now (the car is stopped while a new stage is
    // generated) so later LOD switches stay hitch-free.
    for (const chunk of chunks) {
      ensureGeometry(chunk, 0);
      ensureGeometry(chunk, 1);
      ensureGeometry(chunk, 2);
    }
    update(lastFocus.x, lastFocus.z, true);
  }

  function dispose() {
    for (const chunk of chunks) {
      for (const geometry of chunk.geometries) geometry?.dispose();
    }
    material.dispose();
  }

  group.userData.isTerrainLOD = true;
  group.userData.pickables = pickables;
  group.userData.boundingBox = bounding;
  group.userData.update = update;
  group.userData.refresh = refresh;
  group.userData.dispose = dispose;
  group.userData.stats = () => ({
    chunks: activeChunks,
    triangles: Math.round(triangles),
    levels: chunks.reduce((acc, c) => {
      acc[c.level] = (acc[c.level] || 0) + 1;
      return acc;
    }, {}),
  });

  const walls = buildWalls(terrain);
  group.add(walls);

  // Build every LOD up front. Doing it lazily is what caused multi-hundred
  // millisecond hitches the first time a chunk crossed a LOD threshold (and
  // made the game look frozen on slower machines); ~8 MB of geometry is a
  // cheap price for hitch-free driving.
  for (const chunk of chunks) {
    ensureGeometry(chunk, 0);
    ensureGeometry(chunk, 1);
    ensureGeometry(chunk, 2);
  }

  update(0, 0, true);
  return group;
}
