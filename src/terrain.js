import * as THREE from 'three';
import { clamp, hash2, lerp, smoothstep, triSample, utmForward, utmInverse } from './geo.js';
import { carveProfile } from './corridor.js';

const GRID = 512;                 // height samples per side in the game
const MINIMAP_SIZE = 320;
const NODATA = -32767;

function canvasTextureFromCanvas(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

async function fetchWithProgress(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url} (HTTP ${response.status})`);
  const total = Number(response.headers.get('content-length')) || 0;
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    onProgress?.(1);
    return buffer;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (total) onProgress?.(Math.min(0.99, received / total));
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

function readMeta(image, scene) {
  const fd = image.getFileDirectory?.() || {};
  const tie = fd.ModelTiepoint;
  const scale = fd.ModelPixelScale;
  const width = image.getWidth();
  const height = image.getHeight();
  let xMin;
  let xMax;
  let yMin;
  let yMax;

  if (tie && scale && tie.length >= 6 && scale.length >= 3) {
    const tieX = tie[3];
    const tieY = tie[4];
    xMin = tieX;
    xMax = tieX + width * scale[0];
    yMax = tieY;
    yMin = tieY - height * scale[1];
  } else if (scene?.lat != null && scene?.lon != null) {
    const center = utmForward(scene.lat, scene.lon);
    const radius = scene.radius || 1000;
    xMin = center.x - radius;
    xMax = center.x + radius;
    yMin = center.y - radius;
    yMax = center.y + radius;
  } else {
    throw new Error('The GeoTIFF has no georeferencing and scene.json has no centre.');
  }

  return {
    width,
    height,
    xMin,
    xMax,
    yMin,
    yMax,
    originX: (xMin + xMax) / 2,
    originY: (yMin + yMax) / 2,
    sizeX: xMax - xMin,
    sizeZ: yMax - yMin,
  };
}

/**
 * Build the game's terrain model around an existing height grid.
 *
 * `projection` supplies `worldFromLatLon` / `latLonFromWorld` (and optionally
 * the UTM helpers), so the same physics, LOD and road code works both for a
 * baked demo scene and for a stage generated on the fly anywhere in Norway.
 */
export function createTerrainModel({
  heights,
  grid,
  sizeX,
  sizeZ,
  projection,
  scene = null,
  basemapUrl = null,
  meta = {},
}) {
  let minH = Infinity;
  let maxH = -Infinity;
  for (let i = 0; i < heights.length; i++) {
    const h = heights[i];
    if (h < minH) minH = h;
    if (h > maxH) maxH = h;
  }
  if (!Number.isFinite(minH)) {
    minH = 0;
    maxH = 0;
  }

  const nx = sizeX / (grid - 1);
  const nz = sizeZ / (grid - 1);
  // Keep the untouched survey heights so a start pad can be carved (and
  // re-carved for the next stage) without flattening the mountain for good.
  const baseHeights = heights.slice();

  return {
    scene,
    meta,
    heights,
    basemapUrl,
    grid,
    sizeX,
    sizeZ,
    minH,
    maxH,
    cellX: nx,
    cellZ: nz,
    originX: meta.originX ?? 0,
    originY: meta.originY ?? 0,

    worldFromLatLon: (lat, lon) => projection.worldFromLatLon(lat, lon),
    latLonFromWorld: (x, z) => projection.latLonFromWorld(x, z),
    worldFromUtm: projection.worldFromUtm ? (x, y) => projection.worldFromUtm(x, y) : null,
    utmFromWorld: projection.utmFromWorld ? (x, z) => projection.utmFromWorld(x, z) : null,
    inside(x, z, margin = 0) {
      return Math.abs(x) <= sizeX / 2 - margin && Math.abs(z) <= sizeZ / 2 - margin;
    },
    sample(x, z) {
      const u = ((x + sizeX / 2) / sizeX) * (grid - 1);
      const v = ((z + sizeZ / 2) / sizeZ) * (grid - 1);
      const i = clamp(Math.floor(u), 0, grid - 2);
      const j = clamp(Math.floor(v), 0, grid - 2);
      const fx = clamp(u - i, 0, 1);
      const fz = clamp(v - j, 0, 1);
      const a = heights[j * grid + i];
      const b = heights[j * grid + i + 1];
      const c = heights[(j + 1) * grid + i];
      const d = heights[(j + 1) * grid + i + 1];
      return triSample(a, b, c, d, fx, fz);
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
    /** Restore the original survey surface (removing any previous start pad). */
    resetHeights() {
      heights.set(baseHeights);
    },
    /**
     * Carve a drivable ribbon into the high-resolution height field. This is
     * the physics side of "carving the road": the visible terrain mesh, the
     * minimap and `sample()` all read the same modified heights, so the car
     * never floats above or sinks into the road.
     */
    /** Natural (uncarved) ground height. */
    sampleBase(x, z) {
      const u = ((x + sizeX / 2) / sizeX) * (grid - 1);
      const v = ((z + sizeZ / 2) / sizeZ) * (grid - 1);
      const i = clamp(Math.floor(u), 0, grid - 2);
      const j = clamp(Math.floor(v), 0, grid - 2);
      const fx = clamp(u - i, 0, 1);
      const fz = clamp(v - j, 0, 1);
      const a = baseHeights[j * grid + i];
      const b = baseHeights[j * grid + i + 1];
      const c = baseHeights[(j + 1) * grid + i];
      const d = baseHeights[(j + 1) * grid + i + 1];
      return triSample(a, b, c, d, fx, fz);
    },
    /**
     * Carve the engineered road profile (flat carriageway, embankments and
     * cuttings — see corridor.js) into the height field from the untouched
     * survey heights, so the visible ground, the ribbon and the car agree.
     */
    carveRoad(samples, { halfWidth = 5.4, lift = 0.12 } = {}) {
      if (!samples || samples.length < 2) return 0;
      const half = Math.max(1.5, halfWidth - 1.2);
      return carveProfile({
        heights,
        base: baseHeights,
        x0: -sizeX / 2,
        z0: -sizeZ / 2,
        cell: sizeX / (grid - 1),
        n: grid,
      }, [{ half, samples }], { lift });
    },

    /**
     * Bulldoze a flat start pad: a level disc of `radius` metres that blends
     * back into the mountain over `blend` metres. Without this, a spot that
     * looks flat on a 1 m DTM can still tip the car onto two wheels.
     */
    flattenPad(cx, cz, radius = 18, blend = 34, targetHeight = null) {
      const target = targetHeight ?? this.sample(cx, cz);
      const halfX = sizeX / 2;
      const halfZ = sizeZ / 2;
      const reach = radius + blend;
      for (let j = 0; j < grid; j++) {
        const z = -halfZ + (j / (grid - 1)) * sizeZ;
        if (Math.abs(z - cz) > reach) continue;
        for (let i = 0; i < grid; i++) {
          const x = -halfX + (i / (grid - 1)) * sizeX;
          const d = Math.hypot(x - cx, z - cz);
          if (d > reach) continue;
          const t = d <= radius ? 1 : 1 - smoothstep((d - radius) / blend);
          const idx = j * grid + i;
          heights[idx] = lerp(baseHeights[idx], target, t);
        }
      }
      return target;
    },
  };
}

/**
 * Loads a local GeoTIFF (through geotiff.js on window) and builds the sampled
 * height field the game and the car physics share.
 */
export async function loadTerrain({ sceneUrl, tifUrl, onProgress, basemapUrl = null }) {
  let scene = null;
  try {
    const r = await fetch(sceneUrl);
    if (r.ok) scene = await r.json();
  } catch {
    scene = null;
  }
  onProgress?.(0.05, 'Reading elevation model…');

  const buffer = await fetchWithProgress(tifUrl, (p) => {
    onProgress?.(0.05 + p * 0.5, `Loading elevation model… ${Math.round(p * 100)}%`);
  });
  onProgress?.(0.6, 'Unpacking GeoTIFF…');

  if (!window.GeoTIFF) throw new Error('geotiff.js did not load.');
  const tiff = await window.GeoTIFF.fromArrayBuffer(buffer);
  const image = await tiff.getImage();
  const meta = readMeta(image, scene);

  onProgress?.(0.72, 'Building terrain grid…');
  const rasters = await image.readRasters({
    width: GRID,
    height: GRID,
    resampleMethod: 'nearest',
  });
  const heights = new Float32Array(rasters[0].length);
  for (let i = 0; i < heights.length; i++) {
    const raw = rasters[0][i];
    heights[i] = raw <= NODATA + 100 || !Number.isFinite(raw) ? 0 : Math.max(0, raw);
  }

  const terrain = createTerrainModel({
    heights,
    grid: GRID,
    sizeX: meta.sizeX,
    sizeZ: meta.sizeZ,
    scene,
    basemapUrl,
    meta,
    projection: {
      worldFromUtm: (x, y) => ({ x: x - meta.originX, z: -(y - meta.originY) }),
      utmFromWorld: (x, z) => ({ x: x + meta.originX, y: meta.originY - z }),
      worldFromLatLon(lat, lon) {
        const { x, y } = utmForward(lat, lon);
        return { x: x - meta.originX, z: -(y - meta.originY) };
      },
      latLonFromWorld(x, z) {
        return utmInverse(x + meta.originX, meta.originY - z);
      },
    },
  });

  onProgress?.(0.85, 'Growing trees…');
  return terrain;
}

export function terrainColor(h, slope, x, z, out) {
  const n = hash2(Math.floor(x * 0.25), Math.floor(z * 0.25), 91);
  const n2 = hash2(Math.floor(x * 0.08), Math.floor(z * 0.08), 17);
  let r;
  let g;
  let b;
  if (h < 1.2) {
    r = 0.19; g = 0.32; b = 0.34;
  } else if (h < 40) {
    r = 0.24; g = 0.34; b = 0.22;
  } else if (h < 190) {
    const t = (h - 40) / 150;
    r = lerp(0.23, 0.28, t); g = lerp(0.35, 0.39, t); b = lerp(0.20, 0.21, t);
  } else if (h < 430) {
    const t = (h - 190) / 240;
    r = lerp(0.28, 0.33, t); g = lerp(0.39, 0.40, t); b = lerp(0.21, 0.22, t);
  } else if (h < 575) {
    const t = (h - 430) / 145;
    r = lerp(0.33, 0.40, t); g = lerp(0.40, 0.39, t); b = lerp(0.22, 0.25, t);
  } else if (h < 665) {
    const t = (h - 575) / 90;
    r = lerp(0.40, 0.47, t); g = lerp(0.39, 0.45, t); b = lerp(0.25, 0.39, t);
  } else {
    const t = clamp((h - 665) / 70, 0, 1);
    r = lerp(0.47, 0.62, t); g = lerp(0.45, 0.60, t); b = lerp(0.39, 0.54, t);
  }

  // Exposed rock only on genuinely steep faces; the high plateau stays mossy.
  const rock = clamp((slope - 0.55) * 2.2, 0, 1);
  const rr = 0.34 + n2 * 0.14;
  const rg = 0.33 + n2 * 0.13;
  const rb = 0.30 + n2 * 0.13;
  r = lerp(r, rr, rock);
  g = lerp(g, rg, rock);
  b = lerp(b, rb, rock);

  // A little colour noise keeps the low-poly faces from looking like plastic.
  const tint = (n - 0.5) * 0.062;
  out.setRGB(clamp(r + tint, 0, 1), clamp(g + tint * 1.1, 0, 1), clamp(b + tint * 0.55, 0, 1));
}

export function buildTerrainMesh(terrain) {
  const N = terrain.grid;
  const geometry = new THREE.BufferGeometry();
  const pos = new Float32Array(N * N * 3);
  const col = new Float32Array(N * N * 3);
  const uv = new Float32Array(N * N * 2);
  const color = new THREE.Color();
  const halfX = terrain.sizeX / 2;
  const halfZ = terrain.sizeZ / 2;

  for (let j = 0; j < N; j++) {
    const z = -halfZ + (j / (N - 1)) * terrain.sizeZ;
    for (let i = 0; i < N; i++) {
      const x = -halfX + (i / (N - 1)) * terrain.sizeX;
      const idx = j * N + i;
      const h = terrain.heights[idx];
      pos[idx * 3] = x;
      pos[idx * 3 + 1] = h;
      pos[idx * 3 + 2] = z;
      uv[idx * 2] = i / (N - 1);
      uv[idx * 2 + 1] = 1 - j / (N - 1);
      const slope = terrain.slope(x, z);
      terrainColor(h, slope, x, z, color);
      col[idx * 3] = color.r;
      col[idx * 3 + 1] = color.g;
      col[idx * 3 + 2] = color.b;
    }
  }

  const indices = new Uint32Array((N - 1) * (N - 1) * 6);
  let p = 0;
  for (let j = 0; j < N - 1; j++) {
    for (let i = 0; i < N - 1; i++) {
      const a = j * N + i;
      const b = a + 1;
      const c = a + N;
      const d = c + 1;
      indices[p++] = a; indices[p++] = c; indices[p++] = b;
      indices[p++] = b; indices[p++] = c; indices[p++] = d;
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  mesh.name = 'terrain';
  mesh.userData.terrain = terrain;

  // Four dark sides close the block so the edge never shows the void.
  const walls = new THREE.Group();
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x252b28 });
  const depth = Math.max(60, terrain.minH + 80);
  const makeWall = (w, x, z, rot) => {
    const g = new THREE.PlaneGeometry(w, depth, 1, 1);
    const m = new THREE.Mesh(g, wallMat);
    m.rotation.y = rot;
    m.position.set(x, -depth / 2 - 5, z);
    m.receiveShadow = true;
    walls.add(m);
  };
  makeWall(terrain.sizeX, 0, -halfZ, 0);
  makeWall(terrain.sizeX, 0, halfZ, Math.PI);
  makeWall(terrain.sizeZ, -halfX, 0, Math.PI / 2);
  makeWall(terrain.sizeZ, halfX, 0, -Math.PI / 2);
  mesh.add(walls);

  return mesh;
}

/** Load the Kartverket topo map baked by the 3d_terrain builder for this scene. */
export async function loadBasemapTexture(url) {
  if (!url) return null;
  try {
    const texture = await new THREE.TextureLoader().loadAsync(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  } catch (error) {
    console.warn('Basemap could not be loaded:', url, error);
    return null;
  }
}

export function buildWater(terrain) {
  const geo = new THREE.PlaneGeometry(9000, 9000, 48, 48);
  geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x174e63) },
      uShallow: { value: new THREE.Color(0x3d8ea3) },
      uSun: { value: new THREE.Vector3(0.45, 0.75, 0.3).normalize() },
      fogColor: { value: new THREE.Color(0xbfd8e4) },
      fogNear: { value: 400 },
      fogFar: { value: 2600 },
    },
    vertexShader: /* glsl */`
      uniform float uTime;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        vec3 p = position;
        float w = sin(p.x * 0.035 + uTime * 0.9) * 0.18
                + cos(p.z * 0.041 - uTime * 0.7) * 0.16
                + sin((p.x + p.z) * 0.015 + uTime * 0.4) * 0.12;
        p.y += w;
        vWave = w;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uSun;
      uniform vec3 fogColor;
      uniform float fogNear;
      uniform float fogFar;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), 2.0);
        float stripe = step(0.0, sin((vWorld.x + vWorld.z) * 0.09 + vWave * 9.0));
        vec3 col = mix(uDeep, uShallow, 0.25 + stripe * 0.10 + fres * 0.65);
        float glint = pow(max(dot(reflect(-uSun, vec3(0.0, 1.0, 0.0)), viewDir), 0.0), 24.0);
        col += vec3(1.0, 0.92, 0.72) * glint * 0.55;
        float dist = length(cameraPosition - vWorld);
        float fog = smoothstep(fogNear, fogFar, dist);
        col = mix(col, fogColor, fog);
        gl_FragColor = vec4(col, 0.88);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.45;
  mesh.renderOrder = 2;
  mesh.frustumCulled = false;
  mesh.userData.basePositions = base;
  mesh.userData.material = mat;
  return mesh;
}

/** A cosy low-poly forest: instanced trunks and crowns, plus boulders. */
export function buildVegetation(terrain, route, random = Math.random) {
  const group = new THREE.Group();
  const halfX = terrain.sizeX / 2 - 25;
  const halfZ = terrain.sizeZ / 2 - 25;
  const treeCount = 1500;
  const rockCount = 260;

  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 2.2, 5);
  const crownGeo = new THREE.ConeGeometry(1.7, 5.2, 5);
  const rockGeo = new THREE.IcosahedronGeometry(1, 0);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3525, flatShading: true });
  const crownMat = new THREE.MeshLambertMaterial({ color: 0x2f4b32, flatShading: true });
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x777069, flatShading: true });

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  trunks.castShadow = true;
  crowns.castShadow = true;
  crowns.receiveShadow = true;
  rocks.castShadow = true;
  rocks.receiveShadow = true;

  const matrix = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const crownColor = new THREE.Color();
  let trees = 0;
  let attempts = 0;

  while (trees < treeCount && attempts < treeCount * 26) {
    attempts++;
    const x = (random() * 2 - 1) * halfX;
    const z = (random() * 2 - 1) * halfZ;
    const h = terrain.sample(x, z);
    if (h < 12 || h > 625) continue;
    const slope = terrain.slope(x, z);
    if (slope > 0.62) continue;
    if (route && route.distanceTo(x, z) < 9) continue;
    const scale = 0.55 + random() * 0.95;
    const yaw = random() * Math.PI * 2;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

    pos.set(x, h + 1.1 * scale, z);
    scl.set(scale, scale, scale);
    matrix.compose(pos, q, scl);
    trunks.setMatrixAt(trees, matrix);

    pos.set(x, h + 4.1 * scale, z);
    matrix.compose(pos, q, scl);
    crowns.setMatrixAt(trees, matrix);
    crownColor.setHSL(0.31 + random() * 0.035, 0.27 + random() * 0.16, 0.18 + random() * 0.10);
    crowns.setColorAt(trees, crownColor);
    trees++;
  }
  trunks.count = trees;
  crowns.count = trees;

  let rocksPlaced = 0;
  attempts = 0;
  while (rocksPlaced < rockCount && attempts < rockCount * 24) {
    attempts++;
    const x = (random() * 2 - 1) * halfX;
    const z = (random() * 2 - 1) * halfZ;
    const h = terrain.sample(x, z);
    if (h < 2 || h > 690) continue;
    if (route && route.distanceTo(x, z) < 8) continue;
    const scale = 0.5 + random() * 2.4;
    const yaw = random() * Math.PI * 2;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    pos.set(x, h + scale * 0.32, z);
    scl.set(scale * (0.8 + random() * 0.5), scale * (0.55 + random() * 0.35), scale * (0.8 + random() * 0.4));
    matrix.compose(pos, q, scl);
    rocks.setMatrixAt(rocksPlaced++, matrix);
  }
  rocks.count = rocksPlaced;

  if (trunks.instanceMatrix) trunks.instanceMatrix.needsUpdate = true;
  if (crowns.instanceMatrix) crowns.instanceMatrix.needsUpdate = true;
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
  if (rocks.instanceMatrix) rocks.instanceMatrix.needsUpdate = true;

  group.add(trunks, crowns, rocks);
  group.name = 'vegetation';
  return group;
}

/** Fast static hill-shade used by the minimap, or the topo basemap when present. */
export function buildMinimap(terrain, basemapImage = null) {
  const canvas = document.createElement('canvas');
  const size = MINIMAP_SIZE;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (basemapImage) {
    ctx.drawImage(basemapImage, 0, 0, size, size);
    return canvas;
  }
  const img = ctx.createImageData(size, size);
  const N = terrain.grid;
  const color = new THREE.Color();

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const wx = (x / (size - 1) - 0.5) * terrain.sizeX;
      const wz = (y / (size - 1) - 0.5) * terrain.sizeZ;
      const h = terrain.sample(wx, wz);
      const slope = terrain.slope(wx, wz);
      terrainColor(h, slope, wx, wz, color);
      const e = terrain.sizeX / size;
      const hx = (terrain.sample(wx + e, wz) - terrain.sample(wx - e, wz)) / (2 * e);
      const hz = (terrain.sample(wx, wz + e) - terrain.sample(wx, wz - e)) / (2 * e);
      const shade = clamp(0.72 + (-hx * 0.7 - hz * 0.7) * 1.2, 0.38, 1.2);
      const idx = (y * size + x) * 4;
      img.data[idx] = clamp(color.r * 255 * shade, 0, 255);
      img.data[idx + 1] = clamp(color.g * 255 * shade, 0, 255);
      img.data[idx + 2] = clamp(color.b * 255 * shade, 0, 255);
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export { canvasTextureFromCanvas };
