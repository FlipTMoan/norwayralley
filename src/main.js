import * as THREE from 'three';
import { clamp, damp, formatCoord, formatTime } from './geo.js';
import { loadTerrain, buildTerrainMesh, buildWater, buildVegetation, buildMinimap, loadBasemapTexture, buildBasemapMesh } from './terrain.js';
import {
  generateRallyRoute,
  randomRallyRoute,
  fetchOsrmRoute,
  buildRoadVisuals,
} from './stage.js';
import { Car } from './car.js';
import { RetroPresenter } from './retro.js';
import { RallyAudio } from './audio.js';

THREE.ColorManagement.enabled = false;

const $ = (id) => document.getElementById(id);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/* ------------------------------------------------------------------ */
/*  Renderer, scene, light, sky                                        */
/* ------------------------------------------------------------------ */
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: 'high-performance',
  stencil: false,
});
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8d2dc);
scene.fog = new THREE.Fog(0xc3d8dc, 460, 2900);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.35, 9000);
camera.position.set(-80, 760, 1100);

const sunDirection = new THREE.Vector3(-0.42, 0.78, 0.46).normalize();
const sun = new THREE.DirectionalLight(0xfff1d2, 2.5);
sun.position.copy(sunDirection).multiplyScalar(1300);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -850;
sun.shadow.camera.right = 850;
sun.shadow.camera.top = 850;
sun.shadow.camera.bottom = -850;
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 3600;
sun.shadow.bias = -0.0007;
sun.shadow.normalBias = 0.8;
scene.add(sun);
scene.add(sun.target);

const hemi = new THREE.HemisphereLight(0xb4d4e8, 0x54583e, 1.15);
scene.add(hemi);
const fill = new THREE.AmbientLight(0x8aa0a2, 0.36);
scene.add(fill);

function makeSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x6ca5c7) },
      uHorizon: { value: new THREE.Color(0xdbe6df) },
      uSun: { value: sunDirection.clone() },
    },
    vertexShader: /* glsl */`
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uSun;
      varying vec3 vPos;
      void main() {
        vec3 dir = normalize(vPos);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 col = mix(uHorizon, uTop, pow(h, 0.58));
        float sd = max(dot(dir, uSun), 0.0);
        col += vec3(1.0, 0.80, 0.50) * pow(sd, 220.0) * 1.6;
        col += vec3(1.0, 0.78, 0.48) * pow(sd, 10.0) * 0.10;
        // A bank of pale haze just above the horizon.
        col = mix(col, vec3(0.89, 0.92, 0.90), smoothstep(0.09, 0.0, h) * 0.55);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(6000, 24, 12), material);
  mesh.frustumCulled = false;
  return mesh;
}
scene.add(makeSky());

const retro = new RetroPresenter(renderer);
retro.resize(window.innerWidth, window.innerHeight);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  retro.resize(w, h);
}
window.addEventListener('resize', resize);

/* ------------------------------------------------------------------ */
/*  Game state                                                         */
/* ------------------------------------------------------------------ */
let terrain = null;
let terrainMesh = null;
let water = null;
let car = null;
let route = null;
let roadGroup = null;
let vegetation = null;
let minimapBase = null;
let basemapTexture = null;
let basemapMesh = null;
let showBasemap = false;
let loaded = false;
let hasStarted = false;
let time = 0;
let phase = 'loading'; // loading | intro | countdown | building | racing | finished
let stageTime = 0;
let countdown = 0;
let countdownShown = -1;
let bestTime = null;
let topSpeed = 0;
let driftTime = 0;
let airTimeTotal = 0;
let cameraMode = 'chase';
let pickMode = null;
let pickMarkers = [];
let builderActive = false;
let builderA = null;
let builderB = null;
let builderBusy = false;
let builderRequest = 0;
let builderPointer = null;
let currentRandom = mulberry32(0x5eed1234);

const audio = new RallyAudio();

const keys = new Set();
const touch = { throttle: 0, brake: 0, steer: 0, handbrake: false };
const input = { throttle: 0, brake: 0, steer: 0, handbrake: false };

const builderCamera = {
  yaw: 0.72,
  pitch: 0.86,
  distance: 1500,
  target: new THREE.Vector3(0, 380, 0),
};

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let toastTimeout = 0;
function toast(message, type = '') {
  const el = $('toast');
  el.textContent = message;
  el.className = `show ${type}`.trim();
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    el.className = '';
  }, type === 'error' ? 6500 : 3800);
}

function setLoading(progress, text) {
  $('loadingBar').style.width = `${Math.round(clamp01(progress) * 100)}%`;
  if (text) $('loadingText').textContent = text;
}

function disposeGroup(group) {
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });
  scene.remove(group);
}

function bestKey(stageRoute) {
  return `rnr_best_${stageRoute.name}_${Math.round(stageRoute.length)}`;
}

function readBest(stageRoute) {
  try {
    const raw = localStorage.getItem(bestKey(stageRoute));
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeBest(stageRoute, value) {
  try {
    localStorage.setItem(bestKey(stageRoute), String(value));
  } catch {
    // A private window can refuse storage; the game still works.
  }
}

/* ------------------------------------------------------------------ */
/*  Stage management                                                   */
/* ------------------------------------------------------------------ */
function rebuildTerrainSurface() {
  if (terrainMesh) {
    disposeGroup(terrainMesh);
    terrainMesh = null;
  }
  if (basemapMesh) {
    disposeGroup(basemapMesh);
    basemapMesh = null;
  }
  terrainMesh = buildTerrainMesh(terrain);
  scene.add(terrainMesh);
  if (basemapTexture) {
    basemapMesh = buildBasemapMesh(terrain, basemapTexture);
    basemapMesh.visible = showBasemap;
    scene.add(basemapMesh);
  }
  minimapBase = buildMinimap(terrain, basemapTexture?.image || null);
}

function setBasemap(on) {
  showBasemap = Boolean(on) && Boolean(basemapTexture);
  if (basemapMesh) basemapMesh.visible = showBasemap;
  const toggle = $('builderTopo');
  if (toggle) toggle.checked = showBasemap;
  if (on && !basemapTexture) {
    toast('This scene has no topo basemap. The route picker still works on the 3D terrain.', 'error');
  }
}

function setRoute(nextRoute, { announce = false, pad = true } = {}) {
  // Every stage gets a level start shelf, whatever router produced it.
  if (pad) {
    terrain.resetHeights();
    terrain.flattenPad(nextRoute.start.x, nextRoute.start.z, 18, 34);
    nextRoute.snapToTerrain();
    if (terrainMesh) rebuildTerrainSurface();
  }
  route = nextRoute;
  if (roadGroup) disposeGroup(roadGroup);
  roadGroup = buildRoadVisuals(route, terrain);
  scene.add(roadGroup);

  if (vegetation) disposeGroup(vegetation);
  vegetation = buildVegetation(terrain, route, mulberry32(0x1f2e3d4c));
  scene.add(vegetation);

  car.setRoute(route);

  bestTime = readBest(route);
  $('stageName').textContent = route.name.toUpperCase();
  $('stageLength').textContent = `${(route.length / 1000).toFixed(2)} KM`;
  const startLL = terrain.latLonFromWorld(route.start.x, route.start.z);
  const finishLL = terrain.latLonFromWorld(route.finish.x, route.finish.z);
  $('startCoord').textContent = formatCoord(startLL);
  $('finishCoord').textContent = formatCoord(finishLL);
  updateBestLabel();
  $('osrmStatus').textContent = '';
  $('osrmStatus').className = 'hint';
  updateMinimapRoute();
  resetStage();

  if (announce) {
    toast(`${route.name} — ${(route.length / 1000).toFixed(2)} km. Click START ENGINE or press Enter.`);
  }
}

function updateBestLabel() {
  $('best').textContent = bestTime ? `BEST ${formatTime(bestTime)}` : 'BEST --:--.---';
}

function resetStage({ countdownNow = hasStarted } = {}) {
  if (!route || !car) return;
  phase = countdownNow ? 'countdown' : 'intro';
  stageTime = 0;
  countdown = 3.0;
  countdownShown = -1;
  topSpeed = 0;
  driftTime = 0;
  airTimeTotal = 0;
  car.reset(route.startPose());
  $('resultScreen').classList.add('hidden');
  $('wrongWay').classList.remove('show');
  $('timer').textContent = '00:00.000';
  $('progressBar').style.width = '0%';
  updateBestLabel();
  if (!countdownNow) $('countdown').classList.remove('pop');
}

function beginCountdown() {
  hasStarted = true;
  $('startScreen').classList.add('hidden');
  $('hud').classList.remove('hidden');
  resetStage({ countdownNow: true });
  audio.start();
}

function finishStage() {
  if (phase !== 'racing') return;
  phase = 'finished';
  const newBest = !bestTime || stageTime < bestTime;
  if (newBest) {
    bestTime = stageTime;
    writeBest(route, bestTime);
    updateBestLabel();
  }
  $('resultTime').textContent = formatTime(stageTime);
  $('resultBest').textContent = newBest ? '★ NEW PERSONAL BEST ★' : `PERSONAL BEST ${formatTime(bestTime)}`;
  $('resultMeta').textContent =
    `${route.name.toUpperCase()} · ${(route.length / 1000).toFixed(2)} KM · TOP ${Math.round(topSpeed * 3.6)} KM/H`
    + ` · DRIFT ${driftTime.toFixed(1)} S · AIR ${airTimeTotal.toFixed(1)} S`;
  $('resultScreen').classList.remove('hidden');
  $('wrongWay').classList.remove('show');
  toast('Stage complete. R to run it again, N for a new stage.');
}

function scoutNewStage() {
  if (!terrain) return;
  $('resultScreen').classList.add('hidden');
  toast('Scouting a new rally stage…');
  setTimeout(() => {
    try {
      terrain.resetHeights();
      const next = randomRallyRoute(terrain, currentRandom);
      setRoute(next, { announce: true });
    } catch (error) {
      // The previous pad may have been cleared from the height field; make
      // sure the visible mountain still matches the terrain the car drives on.
      rebuildTerrainSurface();
      toast(error.message || 'No stage found. Try the picker instead.', 'error');
    }
  }, 30);
}

/* ------------------------------------------------------------------ */
/*  3-D route builder: pick a start and a finish, then route to OSRM.  */
/* ------------------------------------------------------------------ */
function makePickMarker(color) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.32, 7.4, 6),
    new THREE.MeshBasicMaterial({ color }),
  );
  pole.position.y = 3.7;
  group.add(pole);
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 1.7),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, toneMapped: false }),
  );
  flag.position.set(1.5, 6.4, 0);
  group.add(flag);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.7, 0.25, 10),
    new THREE.MeshBasicMaterial({ color, toneMapped: false }),
  );
  base.position.y = 0.12;
  group.add(base);
  return group;
}

function clearPickMarkers() {
  for (const m of pickMarkers) {
    scene.remove(m);
    disposeGroup(m);
  }
  pickMarkers = [];
}

function addPickMarker(point, color) {
  const marker = makePickMarker(color);
  marker.position.set(point.x, terrain.sample(point.x, point.z) + 0.1, point.z);
  scene.add(marker);
  pickMarkers.push(marker);
}

function setBuilderStatus(text, kind = '') {
  const el = $('builderStatus');
  if (!el) return;
  el.textContent = text;
  el.className = `builder-status ${kind}`.trim();
}

function updateBuilderUi() {
  const hasA = Boolean(builderA);
  const hasB = Boolean(builderB);
  $('builderStepA').classList.toggle('active', !hasA);
  $('builderStepA').classList.toggle('done', hasA);
  $('builderStepB').classList.toggle('active', hasA && !hasB);
  $('builderStepB').classList.toggle('done', hasB);
  $('builderStepRoute').classList.toggle('active', hasA && hasB);
  const ready = hasA && hasB && !builderBusy;
  $('builderOsrm').disabled = !ready;
  $('builderOffroad').disabled = !ready;
  $('builderOsrm').textContent = builderBusy ? 'ROUTING…' : 'OSRM ROUTE';
  $('builderA').textContent = hasA
    ? formatCoord(terrain.latLonFromWorld(builderA.x, builderA.z))
    : '—';
  $('builderB').textContent = hasB
    ? formatCoord(terrain.latLonFromWorld(builderB.x, builderB.z))
    : '—';
}

function snapBuilderCamera() {
  if (!terrain) return;
  const cp = Math.cos(builderCamera.pitch);
  const tx = builderCamera.target.x;
  const tz = builderCamera.target.z;
  const ty = Math.max(terrain.sample(tx, tz) + 30, builderCamera.target.y);
  builderCamera.target.set(tx, ty, tz);
  const px = tx + Math.sin(builderCamera.yaw) * cp * builderCamera.distance;
  const pz = tz + Math.cos(builderCamera.yaw) * cp * builderCamera.distance;
  const py = Math.max(
    ty + Math.sin(builderCamera.pitch) * builderCamera.distance,
    terrain.sample(px, pz) + 20,
  );
  camera.position.set(px, py, pz);
  camera.lookAt(builderCamera.target);
}

function openRouteBuilder() {
  if (!terrain) return;
  if (builderActive) return;
  builderActive = true;
  builderBusy = false;
  builderRequest++;
  builderA = null;
  builderB = null;
  pickMode = 'start';
  clearPickMarkers();
  setBasemap(true);

  // Open looking at the middle of the current stage, high enough to see the
  // whole 2 km tile while still reading the mountain in 3-D.
  const cx = route ? (route.start.x + route.finish.x) / 2 : 0;
  const cz = route ? (route.start.z + route.finish.z) / 2 : 0;
  builderCamera.target.set(
    clamp(cx, -terrain.sizeX / 2 + 100, terrain.sizeX / 2 - 100),
    terrain.sample(cx, cz) + 35,
    clamp(cz, -terrain.sizeZ / 2 + 100, terrain.sizeZ / 2 - 100),
  );
  builderCamera.yaw = 0.72;
  builderCamera.pitch = 0.86;
  builderCamera.distance = 1550;
  snapBuilderCamera();

  $('builderPanel').classList.remove('hidden');
  $('hud').classList.add('building');
  setBuilderStatus('Click the mountain to place the START point. Drag to orbit, right-drag to pan, wheel to zoom.');
  updateBuilderUi();
  toast('3D ROUTE BUILDER — pick a start and a finish, then let OSRM find the road.');
}

function closeRouteBuilder({ restoreBasemap = true } = {}) {
  builderActive = false;
  builderBusy = false;
  builderRequest++;
  pickMode = null;
  builderPointer = null;
  clearPickMarkers();
  $('builderPanel').classList.add('hidden');
  $('hud').classList.remove('building');
  if (restoreBasemap) setBasemap(false);
}

function applyBuilderRoute(next) {
  closeRouteBuilder();
  setRoute(next, { announce: true });
}

async function requestBuilderOsrm() {
  if (!builderA || !builderB || builderBusy || !terrain) return;
  const requestId = ++builderRequest;
  builderBusy = true;
  updateBuilderUi();
  const profile = $('builderProfile').value;
  setBuilderStatus(`Asking OSRM (${profile}) for a road between the two points…`);
  const a = terrain.latLonFromWorld(builderA.x, builderA.z);
  const b = terrain.latLonFromWorld(builderB.x, builderB.z);
  try {
    const result = await fetchOsrmRoute(terrain, { a, b, profile });
    if (!builderActive || requestId !== builderRequest) return;
    const snap = result.snapped?.a != null
      ? ` · snap ${Math.round(result.snapped.a)} m / ${Math.round(result.snapped.b)} m`
      : '';
    setBuilderStatus(
      `OSRM found ${(result.distance / 1000).toFixed(2)} km in ${Math.round(result.duration / 60)} min${snap}.`,
      'ok',
    );
    applyBuilderRoute(result.route);
  } catch (error) {
    if (!builderActive || requestId !== builderRequest) return;
    setBuilderStatus(`${error.message} The OFF-ROAD ROUTE button is still available.`, 'err');
    toast(error.message, 'error');
  } finally {
    if (requestId === builderRequest) {
      builderBusy = false;
      if (builderActive) updateBuilderUi();
    }
  }
}

function requestBuilderOffroad() {
  if (!builderA || !builderB || builderBusy || !terrain) return;
  const requestId = ++builderRequest;
  builderBusy = true;
  updateBuilderUi();
  setBuilderStatus('Routing across the mountain with the off-road A* router…');
  const a = { ...builderA };
  const b = { ...builderB };
  setTimeout(() => {
    try {
      const next = generateRallyRoute(terrain, a, b, { name: 'Custom A↔B Stage' });
      if (!builderActive || requestId !== builderRequest) return;
      applyBuilderRoute(next);
    } catch (error) {
      if (!builderActive || requestId !== builderRequest) return;
      setBuilderStatus(`${error.message} Try two points on gentler ground.`, 'err');
      toast(error.message || 'Those points are not connected by drivable ground.', 'error');
    } finally {
      if (requestId === builderRequest) {
        builderBusy = false;
        if (builderActive) updateBuilderUi();
      }
    }
  }, 30);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pickTerrainPoint(event) {
  if (!terrainMesh) return null;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(terrainMesh, false);
  if (!hits.length) {
    toast('Click directly on the mountain, not the sky.', 'error');
    return null;
  }
  const hit = hits[0].point;
  if (hit.y < 3) {
    toast('That is the fjord. Pick dry ground.', 'error');
    return null;
  }
  if (terrain.slope(hit.x, hit.z) > 0.9) {
    toast('That face is a cliff. Pick gentler ground.', 'error');
    return null;
  }
  return { x: hit.x, z: hit.z };
}

function handleTerrainClick(event) {
  if (!builderActive || !pickMode) return;
  const point = pickTerrainPoint(event);
  if (!point) return;

  if (!builderA || (builderA && builderB)) {
    // A new click after a complete pair starts a fresh route.
    builderRequest++;
    builderBusy = false;
    clearPickMarkers();
    builderA = point;
    builderB = null;
    addPickMarker(builderA, 0x7be08e);
    pickMode = 'finish';
    setBuilderStatus('Start set. Now click the FINISH point on the map.');
    updateBuilderUi();
    return;
  }

  builderB = point;
  addPickMarker(builderB, 0xffc94a);
  pickMode = 'start';
  updateBuilderUi();
  setBuilderStatus('Both points set. Asking OSRM for a road…');
  requestBuilderOsrm();
}

/* Pointer handling for the map camera: a tap places A/B, a drag orbits,
 * right-drag pans and the wheel zooms. */
function builderPointerDown(event) {
  if (!builderActive) return;
  if (event.button !== 0 && event.button !== 2) return;
  builderPointer = {
    id: event.pointerId,
    button: event.button,
    lastX: event.clientX,
    lastY: event.clientY,
    moved: 0,
  };
  try {
    canvas.setPointerCapture(event.pointerId);
  } catch {
    // Synthetic events and some touch stacks cannot capture; dragging still works.
  }
  event.preventDefault();
}

function builderPointerMove(event) {
  if (!builderActive || !builderPointer || event.pointerId !== builderPointer.id) return;
  const dx = event.clientX - builderPointer.lastX;
  const dy = event.clientY - builderPointer.lastY;
  builderPointer.lastX = event.clientX;
  builderPointer.lastY = event.clientY;
  builderPointer.moved += Math.abs(dx) + Math.abs(dy);
  if (builderPointer.moved < 4) return;

  if (builderPointer.button === 0) {
    builderCamera.yaw -= dx * 0.006;
    builderCamera.pitch = clamp(builderCamera.pitch + dy * 0.004, 0.22, 1.38);
  } else {
    const speed = builderCamera.distance * 0.00135;
    const cy = Math.cos(builderCamera.yaw);
    const sy = Math.sin(builderCamera.yaw);
    builderCamera.target.x += (-cy * dx + sy * dy) * speed;
    builderCamera.target.z += (sy * dx + cy * dy) * speed;
    builderCamera.target.x = clamp(builderCamera.target.x, -terrain.sizeX / 2 + 80, terrain.sizeX / 2 - 80);
    builderCamera.target.z = clamp(builderCamera.target.z, -terrain.sizeZ / 2 + 80, terrain.sizeZ / 2 - 80);
    builderCamera.target.y = terrain.sample(builderCamera.target.x, builderCamera.target.z) + 35;
  }
}

function builderPointerUp(event) {
  if (!builderActive || !builderPointer || event.pointerId !== builderPointer.id) return;
  const wasTap = builderPointer.moved < 6 && builderPointer.button === 0;
  const pointerId = builderPointer.id;
  builderPointer = null;
  try {
    canvas.releasePointerCapture(pointerId);
  } catch {
    // The pointer may already be released or synthetic.
  }
  if (wasTap) handleTerrainClick(event);
}

function builderWheel(event) {
  if (!builderActive) return;
  event.preventDefault();
  builderCamera.distance = clamp(
    builderCamera.distance * Math.exp(event.deltaY * 0.0012),
    230,
    3800,
  );
}

/* ------------------------------------------------------------------ */
/*  Minimap                                                            */
/* ------------------------------------------------------------------ */
const mm = $('minimap');
const mmCtx = mm.getContext('2d');
const MM_SIZE = mm.width;

function worldToMap(x, z) {
  return {
    x: ((x + terrain.sizeX / 2) / terrain.sizeX) * MM_SIZE,
    y: ((z + terrain.sizeZ / 2) / terrain.sizeZ) * MM_SIZE,
  };
}

function updateMinimapRoute() {
  if (!route) return;
  mmCtx.clearRect(0, 0, MM_SIZE, MM_SIZE);
  if (minimapBase) mmCtx.drawImage(minimapBase, 0, 0, MM_SIZE, MM_SIZE);

  const pts = route.samples;
  mmCtx.lineJoin = 'round';
  mmCtx.lineCap = 'round';
  mmCtx.strokeStyle = 'rgba(0,0,0,.65)';
  mmCtx.lineWidth = 6;
  mmCtx.beginPath();
  for (let i = 0; i < pts.length; i += 2) {
    const p = worldToMap(pts[i].x, pts[i].z);
    if (i === 0) mmCtx.moveTo(p.x, p.y);
    else mmCtx.lineTo(p.x, p.y);
  }
  mmCtx.stroke();
  mmCtx.strokeStyle = '#f0ce58';
  mmCtx.lineWidth = 2.4;
  mmCtx.stroke();

  const s = worldToMap(route.start.x, route.start.z);
  mmCtx.fillStyle = '#8fe6a3';
  mmCtx.beginPath();
  mmCtx.arc(s.x, s.y, 4, 0, Math.PI * 2);
  mmCtx.fill();
  mmCtx.strokeStyle = '#101513';
  mmCtx.lineWidth = 1.5;
  mmCtx.stroke();

  const f = worldToMap(route.finish.x, route.finish.z);
  mmCtx.fillStyle = '#f0ce58';
  mmCtx.fillRect(f.x - 4, f.y - 4, 8, 8);
  mmCtx.strokeStyle = '#101513';
  mmCtx.strokeRect(f.x - 4, f.y - 4, 8, 8);
}

function drawMinimap() {
  if (!route || !car || !terrain) return;
  mmCtx.clearRect(0, 0, MM_SIZE, MM_SIZE);
  if (minimapBase) mmCtx.drawImage(minimapBase, 0, 0, MM_SIZE, MM_SIZE);

  const pts = route.samples;
  mmCtx.lineJoin = 'round';
  mmCtx.lineCap = 'round';
  mmCtx.strokeStyle = 'rgba(0,0,0,.68)';
  mmCtx.lineWidth = 6;
  mmCtx.beginPath();
  for (let i = 0; i < pts.length; i += 2) {
    const p = worldToMap(pts[i].x, pts[i].z);
    if (i === 0) mmCtx.moveTo(p.x, p.y);
    else mmCtx.lineTo(p.x, p.y);
  }
  mmCtx.stroke();
  mmCtx.strokeStyle = '#f0ce58';
  mmCtx.lineWidth = 2.4;
  mmCtx.stroke();

  const s = worldToMap(route.start.x, route.start.z);
  mmCtx.fillStyle = '#8fe6a3';
  mmCtx.beginPath();
  mmCtx.arc(s.x, s.y, 4, 0, Math.PI * 2);
  mmCtx.fill();

  const f = worldToMap(route.finish.x, route.finish.z);
  mmCtx.fillStyle = '#f0ce58';
  mmCtx.fillRect(f.x - 4, f.y - 4, 8, 8);
  mmCtx.strokeStyle = '#101513';
  mmCtx.lineWidth = 1.5;
  mmCtx.strokeRect(f.x - 4, f.y - 4, 8, 8);

  if (builderActive) {
    if (builderA && builderB) {
      const a = worldToMap(builderA.x, builderA.z);
      const b = worldToMap(builderB.x, builderB.z);
      mmCtx.strokeStyle = 'rgba(255,255,255,.75)';
      mmCtx.setLineDash([4, 4]);
      mmCtx.lineWidth = 1.5;
      mmCtx.beginPath();
      mmCtx.moveTo(a.x, a.y);
      mmCtx.lineTo(b.x, b.y);
      mmCtx.stroke();
      mmCtx.setLineDash([]);
    }
    for (const [point, color] of [[builderA, '#8fe6a3'], [builderB, '#ffc94a']]) {
      if (!point) continue;
      const p = worldToMap(point.x, point.z);
      mmCtx.fillStyle = color;
      mmCtx.beginPath();
      mmCtx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      mmCtx.fill();
      mmCtx.strokeStyle = '#101513';
      mmCtx.lineWidth = 1.5;
      mmCtx.stroke();
    }
  }

  const c = worldToMap(car.pos.x, car.pos.z);
  const fw = car.forward();
  const rx = -fw.z;
  const rz = fw.x;
  mmCtx.fillStyle = '#f4efe0';
  mmCtx.strokeStyle = '#0a0e0b';
  mmCtx.lineWidth = 1.5;
  mmCtx.beginPath();
  mmCtx.moveTo(c.x + fw.x * 7, c.y + fw.z * 7);
  mmCtx.lineTo(c.x - fw.x * 4 + rx * 4, c.y - fw.z * 4 + rz * 4);
  mmCtx.lineTo(c.x - fw.x * 4 - rx * 4, c.y - fw.z * 4 - rz * 4);
  mmCtx.closePath();
  mmCtx.fill();
  mmCtx.stroke();
}

/* ------------------------------------------------------------------ */
/*  Camera                                                             */
/* ------------------------------------------------------------------ */
const lookSmooth = new THREE.Vector3(0, 0, 0);
const cameraTarget = new THREE.Vector3();
const tempLook = new THREE.Vector3();

function updateBuilderCamera(dt) {
  const cp = Math.cos(builderCamera.pitch);
  const target = builderCamera.target;
  const desired = new THREE.Vector3(
    target.x + Math.sin(builderCamera.yaw) * cp * builderCamera.distance,
    target.y + Math.sin(builderCamera.pitch) * builderCamera.distance,
    target.z + Math.cos(builderCamera.yaw) * cp * builderCamera.distance,
  );
  const ground = terrain.sample(desired.x, desired.z) + 20;
  if (desired.y < ground) desired.y = ground;
  camera.position.lerp(desired, 1 - Math.exp(-9 * dt));
  const targetGround = terrain.sample(target.x, target.z) + 30;
  if (target.y < targetGround) target.y = damp(target.y, targetGround, 8, dt);
  camera.lookAt(target);
  const fov = damp(camera.fov, 56, 4, dt);
  if (Math.abs(camera.fov - fov) > 0.01) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
}

function updateCamera(dt) {
  if (!car || !terrain) return;
  if (builderActive) {
    updateBuilderCamera(dt);
    return;
  }
  const f = car.forward();

  if (!hasStarted || phase === 'intro') {
    const angle = time * 0.09 + 0.6;
    const radius = 24;
    cameraTarget.set(
      car.pos.x + Math.cos(angle) * radius,
      car.pos.y + 10.5,
      car.pos.z + Math.sin(angle) * radius,
    );
    const minY = terrain.sample(cameraTarget.x, cameraTarget.z) + 2.2;
    cameraTarget.y = Math.max(cameraTarget.y, minY);
    camera.position.lerp(cameraTarget, 1 - Math.exp(-2.2 * dt));
    tempLook.set(car.pos.x, car.pos.y + 1.3, car.pos.z);
    lookSmooth.lerp(tempLook, 1 - Math.exp(-4 * dt));
    camera.lookAt(lookSmooth);
  } else if (cameraMode === 'hood') {
    camera.position.set(
      car.pos.x + f.x * 0.5,
      car.pos.y + 1.55,
      car.pos.z + f.z * 0.5,
    );
    tempLook.set(car.pos.x + f.x * 22, car.pos.y + 1.6, car.pos.z + f.z * 22);
    camera.lookAt(tempLook);
    camera.fov = damp(camera.fov, 68, 4, dt);
    camera.updateProjectionMatrix();
  } else {
    const speed = car.speed;
    let back = 7.0 + speed * 0.045;
    const height = 2.8 + speed * 0.018;
    // If the ground behind the car rises sharply, pull the boom in before
    // resorting to a helicopter view.
    for (let i = 0; i < 5; i++) {
      const tx = car.pos.x - f.x * back;
      const tz = car.pos.z - f.z * back;
      if (terrain.sample(tx, tz) < car.pos.y + 2.0) break;
      back *= 0.72;
    }
    cameraTarget.set(
      car.pos.x - f.x * back,
      car.pos.y + height,
      car.pos.z - f.z * back,
    );
    // Lift the camera over any ridge between it and the car, but keep the
    // result in the chase-camera family rather than a satellite view.
    let ridgeMax = -Infinity;
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const sx = car.pos.x + (cameraTarget.x - car.pos.x) * t;
      const sz = car.pos.z + (cameraTarget.z - car.pos.z) * t;
      ridgeMax = Math.max(ridgeMax, terrain.sample(sx, sz));
    }
    const liftCap = car.pos.y + 8.0 + Math.min(2.0, speed * 0.04);
    if (cameraTarget.y < ridgeMax + 1.4) {
      cameraTarget.y = Math.min(ridgeMax + 1.4, liftCap);
    }
    const groundAtCamera = terrain.sample(cameraTarget.x, cameraTarget.z);
    if (cameraTarget.y < groundAtCamera + 1.2) {
      cameraTarget.y = Math.min(groundAtCamera + 1.2, liftCap + 2.0);
    }
    camera.position.lerp(cameraTarget, 1 - Math.exp(-5.4 * dt));

    const sceneGround = terrain.sample(camera.position.x, camera.position.z) + 1.1;
    if (camera.position.y < sceneGround) {
      camera.position.y = damp(camera.position.y, sceneGround, 16, dt);
    }

    // A little handheld shake when the gravel gets rough.
    if (car.speed > 6 && (!car.onRoad || !car.grounded)) {
      const shake = Math.min(0.12, car.speed * 0.0035) * (car.onRoad ? 0.45 : 1);
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
      camera.position.z += (Math.random() - 0.5) * shake;
    }

    const ahead = 4.0 + speed * 0.05;
    tempLook.set(
      car.pos.x + f.x * ahead,
      car.pos.y + 1.15 + Math.min(1.2, speed * 0.015),
      car.pos.z + f.z * ahead,
    );
    lookSmooth.lerp(tempLook, 1 - Math.exp(-9 * dt));
    camera.lookAt(lookSmooth);

    const targetFov = 60 + Math.min(16, speed * 0.32);
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov = damp(camera.fov, targetFov, 4, dt);
      camera.updateProjectionMatrix();
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Input                                                              */
/* ------------------------------------------------------------------ */
const keyMap = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'handbrake',
};

window.addEventListener('keydown', (event) => {
  if (keyMap[event.code]) {
    keys.add(keyMap[event.code]);
    if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
  }
  if (event.code === 'KeyR') {
    if (loaded && hasStarted && !builderActive) {
      resetStage({ countdownNow: true });
      toast('Stage restarted.');
    }
  }
  if (event.code === 'KeyC') {
    if (!builderActive) {
      cameraMode = cameraMode === 'chase' ? 'hood' : 'chase';
      toast(cameraMode === 'hood' ? 'Bonnet camera.' : 'Chase camera.');
    }
  }
  if (event.code === 'KeyM') {
    audio.setMuted(!audio.muted);
    toast(audio.muted ? 'Sound off.' : 'Sound on.');
  }
  if (event.code === 'KeyN' && loaded && hasStarted && !builderActive) scoutNewStage();
  if (event.code === 'Escape') {
    if (builderActive) closeRouteBuilder();
  }
  if (event.code === 'Enter' && loaded && !hasStarted) beginCountdown();
});
window.addEventListener('keyup', (event) => {
  if (keyMap[event.code]) keys.delete(keyMap[event.code]);
});
window.addEventListener('blur', () => keys.clear());

for (const button of document.querySelectorAll('[data-touch]')) {
  const action = button.dataset.touch;
  const press = (e) => {
    e.preventDefault();
    button.setPointerCapture?.(e.pointerId);
    if (action === 'left') touch.steer = -1;
    else if (action === 'right') touch.steer = 1;
    else if (action === 'throttle') touch.throttle = 1;
    else if (action === 'brake') touch.brake = 1;
    else if (action === 'handbrake') touch.handbrake = true;
  };
  const release = (e) => {
    e.preventDefault();
    if (action === 'left' || action === 'right') touch.steer = 0;
    else if (action === 'throttle') touch.throttle = 0;
    else if (action === 'brake') touch.brake = 0;
    else if (action === 'handbrake') touch.handbrake = false;
  };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
}

function readInput() {
  let steer = 0;
  let throttle = 0;
  let brake = 0;
  if (keys.has('left')) steer -= 1;
  if (keys.has('right')) steer += 1;
  if (keys.has('up')) throttle = 1;
  if (keys.has('down')) brake = 1;
  steer += touch.steer;
  throttle = Math.max(throttle, touch.throttle);
  brake = Math.max(brake, touch.brake);
  // The chase camera looks along the car's +Z axis, so screen-right is the
  // car's world -X. Negate the steering here, otherwise A/D (and the touch
  // buttons) turn the car the opposite way from what the player sees.
  input.steer = clamp(-steer, -1, 1);
  input.throttle = clamp01(throttle);
  input.brake = clamp01(brake);
  input.handbrake = keys.has('handbrake') || touch.handbrake;
}

/* ------------------------------------------------------------------ */
/*  HUD                                                                */
/* ------------------------------------------------------------------ */
function updateHud() {
  if (!car) return;
  const kmh = Math.round(car.speed * 3.6);
  $('speed').textContent = String(Math.min(999, kmh)).padStart(3, '0');
  let gear = 'N';
  if (car.vF < -0.5) gear = 'R';
  else if (car.speed > 1) gear = String(Math.min(5, Math.floor(car.speed / 12) + 1));
  $('gear').textContent = gear;

  const surface = $('surface');
  if (!car.grounded) {
    surface.textContent = 'AIRBORNE';
    surface.className = 'air';
  } else if (car.onRoad) {
    surface.textContent = car.drifting ? 'DRIFT' : 'GRAVEL';
    surface.className = car.drifting ? 'off' : 'road';
  } else {
    surface.textContent = 'OFF ROAD';
    surface.className = 'off';
  }

  $('timer').textContent = formatTime(stageTime);
  if (phase === 'racing') {
    $('progressBar').style.width = `${clamp01(car.progress) * 100}%`;
  }
  $('wrongWay').classList.toggle('show', car.wrongWay && phase === 'racing');
}

function updateBestFromStorage() {
  if (!route) return;
  bestTime = readBest(route);
  updateBestLabel();
}

/* ------------------------------------------------------------------ */
/*  Countdown / timer / finish                                         */
/* ------------------------------------------------------------------ */
function updateGamePhase(dt) {
  if (builderActive) return;
  if (phase === 'countdown') {
    countdown -= dt;
    const n = Math.ceil(countdown);
    if (n !== countdownShown && n >= 0) {
      countdownShown = n;
      const el = $('countdown');
      el.textContent = n > 0 ? String(n) : 'GO!';
      el.classList.remove('pop');
      // force a reflow so the animation restarts for every number
      void el.offsetWidth;
      el.classList.add('pop');
      if (n === 0) toast('Go! Keep it on the mountain.');
    }
    if (countdown <= 0) {
      phase = 'racing';
      stageTime = 0;
      $('countdown').textContent = '';
    }
  } else if (phase === 'racing') {
    stageTime += dt;
    topSpeed = Math.max(topSpeed, car.speed);
    if (car.drifting) driftTime += dt;
    if (!car.grounded) airTimeTotal += dt;
  }
}

/* ------------------------------------------------------------------ */
/*  Water + shadows                                                    */
/* ------------------------------------------------------------------ */
function updateWorld(dt) {
  if (water) water.userData.material.uniforms.uTime.value = time;
  if (!car) return;
  sun.position.set(car.pos.x - 650, car.pos.y + 900, car.pos.z + 470);
  sun.target.position.set(car.pos.x, car.pos.y, car.pos.z);
  sun.target.updateMatrixWorld();
}

/* ------------------------------------------------------------------ */
/*  Boot                                                               */
/* ------------------------------------------------------------------ */
/**
 * The 3d_terrain builder writes a catalog at scenes/index.json and one
 * self-describing folder per place. Resolve the requested scene (or the first
 * one) exactly the way the standalone viewer does.
 */
async function resolveSceneFolder() {
  const requested = new URLSearchParams(location.search).get('scene');
  let catalog = [];
  try {
    const response = await fetch('/terrain/scenes/index.json');
    if (response.ok) catalog = await response.json();
  } catch {
    catalog = [];
  }
  if (!Array.isArray(catalog) || !catalog.length) {
    catalog = [{ name: 'preikestolen', title: 'Preikestolen (demo)', path: 'scenes/preikestolen/' }];
  }
  const entry = catalog.find((s) => s.name === requested) || catalog[0];
  let path = String(entry.path || `scenes/${entry.name}/`).replace(/^\/+/, '');
  if (!path.endsWith('/')) path += '/';
  const base = `/terrain/${path}`;

  let sceneMeta = null;
  try {
    const response = await fetch(`${base}scene.json`);
    if (response.ok) sceneMeta = await response.json();
  } catch {
    sceneMeta = null;
  }

  let tif = 'dtm_1m.tif';
  try {
    const response = await fetch(`${base}index.json`);
    if (response.ok) {
      const index = await response.json();
      const names = index.files || [];
      tif = names.includes('dtm_1m.tif')
        ? 'dtm_1m.tif'
        : names.includes('dtm_10m.tif') ? 'dtm_10m.tif' : tif;
    }
  } catch {
    // The conventional filename is a good enough fallback.
  }

  return { entry, base, sceneMeta, tif };
}

async function boot() {
  try {
    setLoading(0.02, 'Reading the 3d_terrain scene catalog…');
    const { entry, base, sceneMeta, tif } = await resolveSceneFolder();
    setLoading(0.05, `Opening ${entry.title || entry.name}…`);

    const basemapFile = sceneMeta?.basemap?.file;
    terrain = await loadTerrain({
      sceneUrl: `${base}scene.json`,
      tifUrl: `${base}${tif}`,
      basemapUrl: basemapFile ? `${base}${basemapFile}` : null,
      onProgress: (p, text) => setLoading(p, text),
    });

    if (terrain.basemapUrl) {
      setLoading(0.84, 'Draping the Kartverket topo map…');
      basemapTexture = await loadBasemapTexture(terrain.basemapUrl);
    }

    setLoading(0.86, 'Plotting the rally stage…');
    const initialRoute = generateRallyRoute(
      terrain,
      { x: -710, z: 288 },
      { x: 104, z: -245 },
      { name: 'Preikestolen Climb' },
    );
    // Bulldoze the start shelf before the visible mountain is built, so the
    // mesh, the physics and the road all agree that the start is flat.
    terrain.flattenPad(initialRoute.start.x, initialRoute.start.z, 18, 34);
    initialRoute.snapToTerrain();

    setLoading(0.9, 'Sculpting the low-poly mountain…');
    rebuildTerrainSurface();

    water = buildWater(terrain);
    scene.add(water);

    car = new Car(scene, terrain);

    setRoute(initialRoute, { pad: false });

    // A hazy ring of distant peaks across the fjord.
    addDistantPeaks();

    document.title = `Retro Norway Rally — ${entry.title || 'Preikestolen'}`;
    loaded = true;
    phase = 'intro';
    setLoading(1, 'Ready.');
    $('startBtn').disabled = false;
    $('startBtn').textContent = 'START ENGINE';
    $('startBtn').focus();
  } catch (error) {
    console.error(error);
    setLoading(1, 'The mountain did not load.');
    $('loadingText').textContent = `Could not load the terrain: ${error.message}. Run this with “npm run dev” and open the local address.`;
    $('loadingText').style.color = '#ff9b84';
  }
}

function addDistantPeaks() {
  const rand = mulberry32(0x00c0ffee);
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0x8499a2, flatShading: true });
  const farMat = new THREE.MeshLambertMaterial({ color: 0x98abb1, flatShading: true });
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + rand() * 0.18;
    const radius = 2800 + rand() * 1900;
    const h = 180 + rand() * 520;
    const rBase = 450 + rand() * 500;
    const geo = new THREE.ConeGeometry(rBase, h, 5 + Math.floor(rand() * 3), 1);
    const mesh = new THREE.Mesh(geo, i % 2 ? mat : farMat);
    mesh.position.set(Math.cos(angle) * radius, h / 2 - 6, Math.sin(angle) * radius);
    mesh.rotation.y = rand() * Math.PI * 2;
    mesh.scale.z = 0.7 + rand() * 0.8;
    group.add(mesh);
  }
  group.name = 'distantPeaks';
  scene.add(group);
}

/* ------------------------------------------------------------------ */
/*  UI wiring                                                          */
/* ------------------------------------------------------------------ */
$('startBtn').addEventListener('click', beginCountdown);
$('newStage').addEventListener('click', scoutNewStage);
$('restart').addEventListener('click', () => {
  resetStage({ countdownNow: true });
  toast('Stage restarted.');
});
$('routeBuilder').addEventListener('click', () => {
  if (builderActive) closeRouteBuilder();
  else openRouteBuilder();
});
$('resultRestart').addEventListener('click', () => {
  resetStage({ countdownNow: true });
});
$('resultNew').addEventListener('click', scoutNewStage);
$('builderClose').addEventListener('click', () => closeRouteBuilder());
$('builderOsrm').addEventListener('click', requestBuilderOsrm);
$('builderOffroad').addEventListener('click', requestBuilderOffroad);
$('builderTopo').addEventListener('change', () => setBasemap($('builderTopo').checked));
$('builderProfile').addEventListener('change', () => {
  if (builderA && builderB && !builderBusy) {
    setBuilderStatus(`Profile set to ${$('builderProfile').value}. Press OSRM ROUTE to try it.`);
  }
});
$('osrmFill').addEventListener('click', () => {
  if (!route || !terrain) return;
  const fromA = builderA || route.start;
  const fromB = builderB || route.finish;
  const a = terrain.latLonFromWorld(fromA.x, fromA.z);
  const b = terrain.latLonFromWorld(fromB.x, fromB.z);
  $('osrmALat').value = a.lat.toFixed(6);
  $('osrmALon').value = a.lon.toFixed(6);
  $('osrmBLat').value = b.lat.toFixed(6);
  $('osrmBLon').value = b.lon.toFixed(6);
  $('osrmStatus').textContent = builderA && builderB
    ? 'Coordinates filled from the two route-builder points. Hit FETCH.'
    : 'Coordinates filled from the current stage. Hit FETCH.';
  $('osrmStatus').className = 'hint';
});
$('osrmGo').addEventListener('click', async () => {
  if (!terrain) return;
  const a = {
    lat: Number($('osrmALat').value),
    lon: Number($('osrmALon').value),
  };
  const b = {
    lat: Number($('osrmBLat').value),
    lon: Number($('osrmBLon').value),
  };
  if (![a.lat, a.lon, b.lat, b.lon].every(Number.isFinite)) {
    $('osrmStatus').textContent = 'Enter four coordinates (latitude and longitude).';
    $('osrmStatus').className = 'hint err';
    return;
  }
  $('osrmStatus').textContent = 'Asking OSRM for a road…';
  $('osrmStatus').className = 'hint';
  try {
    const result = await fetchOsrmRoute(terrain, {
      a,
      b,
      profile: $('osrmProfile').value,
    });
    if (builderActive) closeRouteBuilder();
    setRoute(result.route, { announce: true });
    const snap = result.snapped?.a != null
      ? ` · snap ${Math.round(result.snapped.a)} m / ${Math.round(result.snapped.b)} m`
      : '';
    $('osrmStatus').textContent = `OSRM: ${(result.distance / 1000).toFixed(2)} km, ${Math.round(result.duration / 60)} min (${result.profile})${snap}.`;
    $('osrmStatus').className = 'hint ok';
  } catch (error) {
    $('osrmStatus').textContent = error.message;
    $('osrmStatus').className = 'hint err';
    toast(error.message, 'error');
  }
});

canvas.addEventListener('pointerdown', builderPointerDown);
canvas.addEventListener('pointermove', builderPointerMove);
canvas.addEventListener('pointerup', builderPointerUp);
canvas.addEventListener('pointercancel', () => { builderPointer = null; });
canvas.addEventListener('wheel', builderWheel, { passive: false });
canvas.addEventListener('contextmenu', (event) => {
  if (builderActive) event.preventDefault();
});

/* ------------------------------------------------------------------ */
/*  Main loop                                                          */
/* ------------------------------------------------------------------ */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0.0001, (now - last) / 1000));
  last = now;
  time += dt;

  readInput();
  let carState = null;
  if (car && loaded) {
    const active = phase === 'racing' || phase === 'finished';
    const frozen = phase === 'countdown' || phase === 'intro' || builderActive;
    const effective = frozen
      ? { throttle: 0, brake: 0, steer: 0, handbrake: false, frozen: true }
      : input;
    carState = car.update(dt, effective);

    if (phase === 'racing' && car) {
      const dx = car.pos.x - route.finish.x;
      const dz = car.pos.z - route.finish.z;
      const distFinish = Math.hypot(dx, dz);
      if (car.progress > 0.94 && distFinish < 13) finishStage();
    }
    if (phase === 'finished') {
      car.vel.multiplyScalar(Math.exp(-2.2 * dt));
    }
    updateHud();
    audio.update({
      speed: car.speed,
      throttle: phase === 'racing' && !builderActive ? input.throttle : 0,
      onRoad: car.onRoad,
      drifting: car.drifting,
      running: !builderActive && (phase === 'racing' || phase === 'countdown'),
    });
  }

  if (loaded) {
    updateGamePhase(dt);
    updateWorld(dt);
    updateCamera(dt);
    drawMinimap();
  }

  retro.render(scene, camera, time);
  requestAnimationFrame(frame);
}

boot();
requestAnimationFrame(frame);

// Keep the best label honest if another tab or a restart changes it.
window.addEventListener('focus', updateBestFromStorage);

// A small debugging handle, handy in the browser console while tuning the car.
window.__rally = {
  scene,
  camera,
  get terrain() { return terrain; },
  get car() { return car; },
  get route() { return route; },
  get phase() { return phase; },
  get stageTime() { return stageTime; },
  get builder() { return { active: builderActive, a: builderA, b: builderB, busy: builderBusy }; },
  openRouteBuilder,
  closeRouteBuilder,
  generateRoute: (a, b, options) => generateRallyRoute(terrain, a, b, options),
  fetchOsrm: (options) => fetchOsrmRoute(terrain, options),
  screenFromWorld(x, z) {
    camera.updateMatrixWorld();
    const p = new THREE.Vector3(x, terrain.sample(x, z), z).project(camera);
    return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight };
  },
};
