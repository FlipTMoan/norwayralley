import * as THREE from 'three';
import { clamp, damp, formatCoord, formatTime, wrapAngle } from './geo.js';
import { loadTerrain, buildWater, buildVegetation, buildMinimap, loadBasemapTexture, terrainColor } from './terrain.js';
import { createTerrainLOD } from './lod.js';
import {
  generateRallyRoute,
  randomRallyRoute,
  fetchOsrmGeometry,
  fetchOsrmGeometrySegmented,
  fetchOsrmNearest,
  buildRouteIndex,
  makeRoute,
  buildOsrmRoute,
  buildRoadVisuals,
} from './stage.js';
import { Car, CARS, GRIP_MODES, SLIDE_LEVELS } from './car.js';
import { fetchOsmChunk, buildChunkHouses, BuildingIndex, cullHouses } from './buildings.js';
import { buildChunkWater, SEA_LEVEL } from './water.js';
import { fetchRoadSigns, buildChunkSigns } from './signs.js';
import { buildCorridorGeometry, corridorMesh } from './corridor.js';
import { Session, encodeState, makeCallsign, spawnOffset, paintForSlot } from './multiplayer.js';
import { TrackMarks } from './tracks.js';
import { RetroPresenter } from './retro.js';
import { RallyAudio } from './audio.js';
import { createMapPicker } from './map.js';
import { cache, requestPersistence } from './cache.js';
import { shareUrl, parseShare, copyText } from './share.js';
import { findTurns, nextTurn, roundedDistance } from './turns.js';
import { createStreamingWorld } from './stream.js';
import { generateTerrain, isInNorway } from './worldgen.js';
import { logger, initErrorLogging, dumpLog, PerfMonitor } from './log.js';

THREE.ColorManagement.enabled = false;

const log = logger('game');
initErrorLogging();

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
let corridorGroup = null;  // 1 m embankment / cutting mesh along the baked stage
let tracks = null;         // tyre tracks laid by the player's car
let vegetation = null;
let minimapBase = null;
let basemapTexture = null;
let distantPeaks = null;
let loaded = false;
let hasStarted = false;
let freeDrive = false; // streaming world without a stage: no finish, no timer goal
let bakedFeatures = null;   // OSM houses/water + NVDB signs on the baked demo tile
let lastBakedCull = -1;
// Friends: a peer-to-peer room; other players are drawn as named ghost cars.
let session = null;
const ghosts = new Map();   // peer id → { car, label, kind }
let myCallsign = (() => { try { return localStorage.getItem('rally.callsign') || makeCallsign(); } catch { return makeCallsign(); } })();
let lastGeometry = null;    // the OSRM geometry of the current streamed stage (to share)
let lastFreeCenter = null;  // the free-drive centre (to share)
let turns = [];             // pace notes for the current stage (turns.js)
// Small screens: fold the stage panel away while driving so the road is visible.
const compactMedia = window.matchMedia('(max-width: 900px), (pointer: coarse)');
function setCompactHud(on) {
  $('hud').classList.toggle('compact', Boolean(on) && compactMedia.matches);
}
let bakedSignData = null;
// Gearbox preference (start-card toggle or G); remembered between visits.
let gearboxAuto = (() => { try { return localStorage.getItem('rally.gearbox') !== 'manual'; } catch { return true; } })();
// Sliding: natural grip by default, or the arcade drift feel (start-card toggle).
let slideMode = (() => { try { return GRIP_MODES[localStorage.getItem('rally.slide')] ? localStorage.getItem('rally.slide') : 'minimal'; } catch { return 'minimal'; } })();
const SLIDE_LABELS = ['0 MINIMAL', '1 NORMAL', '2 MEDIUM', '3 LOOSE'];
const SLIDE_TOASTS = [
  'Sliding 0, minimal: planted, the tail only goes when you throw it.',
  'Sliding 1, normal: natural grip, slides when you provoke them.',
  'Sliding 2, medium: a lively tail on every corner.',
  'Sliding 3, loose: arcade drift, the tail comes round everywhere.',
];
/** Sliding level: a name from SLIDE_LEVELS or its number 0–3. */
function setSlideMode(mode, { announce = true } = {}) {
  const name = typeof mode === 'number' ? SLIDE_LEVELS[mode] : mode;
  if (!GRIP_MODES[name]) return;
  slideMode = name;
  if (car) car.slideMode = name;
  try { localStorage.setItem('rally.slide', name); } catch { /* private mode */ }
  const level = SLIDE_LEVELS.indexOf(name);
  const btn = document.getElementById('slideBtn');
  if (btn) btn.textContent = `SLIDING: ${SLIDE_LABELS[level]}`;
  if (announce) toast(SLIDE_TOASTS[level]);
}

// Which car: Porsche 911 or the Formula Offroad buggy (start-card toggle).
let carKind = (() => { try { return CARS[localStorage.getItem('rally.car')] ? localStorage.getItem('rally.car') : 'porsche'; } catch { return 'porsche'; } })();
function setCarKind(kind, { announce = true } = {}) {
  if (!CARS[kind]) return;
  carKind = kind;
  try { localStorage.setItem('rally.car', kind); } catch { /* private mode */ }
  const btn = document.getElementById('carBtn');
  if (btn) btn.textContent = `CAR: ${CARS[kind].name.toUpperCase()}`;
  if (car && terrain) swapCar();
  if (announce) toast(kind === 'buggy' ? 'Formula Offroad: 1 200 hp, 4WD, paddle tyres.' : 'Porsche 911 rally car.');
}
/** Replace the car in place (keeps the route; restarts the stage if racing). */
function swapCar() {
  const pose = route ? spawnPose() : { x: car.pos.x, z: car.pos.z, yaw: car.yaw };
  disposeGroup(car.group);
  disposeGroup(car.dust.points);
  disposeGroup(car.spray.points);
  car = new Car(scene, terrain, carKind);
  car.autoShift = gearboxAuto;
  car.slideMode = slideMode;
  applyPaint();
  if (route) car.setRoute(route); else car.reset(pose);
  if (phase === 'racing' || phase === 'countdown' || phase === 'finished') resetStage({ countdownNow: true });
}

function setGearbox(auto, { announce = true } = {}) {
  gearboxAuto = Boolean(auto);
  if (car) car.autoShift = gearboxAuto;
  try { localStorage.setItem('rally.gearbox', gearboxAuto ? 'auto' : 'manual'); } catch { /* private mode */ }
  const btn = document.getElementById('gearboxBtn');
  if (btn) btn.textContent = `GEARBOX: ${gearboxAuto ? 'AUTOMATIC' : 'MANUAL (Q/E)'}`;
  if (announce) toast(gearboxAuto ? 'Automatic gearbox.' : 'Manual gearbox. Q/E shift, redline 12 000.');
}
let time = 0;
let phase = 'loading'; // loading | intro | countdown | building | racing | finished
let stageTime = 0;
let countdown = 0;
let countdownShown = -1;
let bestTime = null;
let topSpeed = 0;
let driftTime = 0;
let airTimeTotal = 0;
// 1 = straight above, 2 = chase (behind the car), 3 = driver's seat.
const CAMERA_MODES = ['top', 'chase', 'cockpit'];
const CAMERA_NAMES = { top: 'Overhead camera.', chase: 'Chase camera.', cockpit: "Driver's seat." };
let cameraMode = 'chase';
const cameraUp = new THREE.Vector3(0, 0, 1);

function setCameraMode(mode) {
  if (!CAMERA_MODES.includes(mode)) return;
  cameraMode = mode;
  if (mode !== 'top') camera.up.set(0, 1, 0);
  toast(CAMERA_NAMES[mode]);
}
let currentRandom = mulberry32(0x5eed1234);
let lastOsrmProfile = 'driving';

const audio = new RallyAudio();

const keys = new Set();
const touch = { throttle: 0, brake: 0, steer: 0, handbrake: false };
const input = { throttle: 0, brake: 0, steer: 0, handbrake: false, jump: false };

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

/**
 * Yield once so the browser can paint progress. `requestAnimationFrame` stops
 * firing in a background tab (and on some remote/headless displays), which
 * would otherwise leave boot or a world rebuild stuck on the loading screen
 * until the tab is focused again — so fall back to a timer.
 */
function nextFrame(timeoutMs = 400) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    requestAnimationFrame(finish);
    window.setTimeout(finish, timeoutMs);
  });
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
    terrainMesh.userData.dispose?.();
    disposeGroup(terrainMesh);
    terrainMesh = null;
  }
  terrainMesh = log.time('build terrain LOD', () => createTerrainLOD(terrain));
  scene.add(terrainMesh);
  minimapBase = buildMinimap(terrain, basemapTexture?.image || null);
  const stats = terrainMesh.userData.stats?.();
  log.info(`terrain chunks ready: ${stats?.chunks ?? 0} chunks, ${stats?.triangles ?? 0} tris`);
}

/** Re-select chunk LODs around the car. Called from the frame loop. */
function updateTerrainLOD(focusX, focusZ) {
  if (terrain?.streaming) {
    // Phase 2: fetch/dispose/LOD the 2 km chunks around the car, biased in
    // the direction of travel.
    terrain.update(focusX, focusZ, car ? car.vel.x : 0, car ? car.vel.y : 0);
    return;
  }
  terrainMesh?.userData.update?.(focusX, focusZ);
}

/* ------------------------------------------------------------------ */
/*  Generate a world anywhere in Norway                                */
/* ------------------------------------------------------------------ */
function setWorldLoading(visible, progress = 0, text = '') {
  const overlay = $('worldLoading');
  if (!overlay) return;
  overlay.classList.toggle('hidden', !visible);
  $('worldBar').style.width = `${Math.round(clamp01(progress) * 100)}%`;
  if (text) $('worldStatus').textContent = text;
}

/** Remove every object that belongs to the current height field. */
function teardownWorld() {
  if (terrain?.streaming) {
    // The streamed world owns its chunks, road visuals, forest and houses.
    terrain.dispose();
  }
  if (roadGroup) { disposeGroup(roadGroup); roadGroup = null; }
  if (corridorGroup) { disposeGroup(corridorGroup); corridorGroup = null; }
  if (tracks) { tracks.dispose(); tracks = null; }
  if (vegetation) { disposeGroup(vegetation); vegetation = null; }
  if (distantPeaks) { disposeGroup(distantPeaks); distantPeaks = null; }
  if (water) { disposeGroup(water); water = null; }
  if (bakedFeatures) { disposeGroup(bakedFeatures); bakedFeatures = null; }
  bakedSignData = null;
  for (const id of [...ghosts.keys()]) disposeGhost(id);
  if (car) {
    disposeGroup(car.group);
    disposeGroup(car.dust.points);
    car = null;
  }
  if (terrainMesh) {
    terrainMesh.userData.dispose?.();
    disposeGroup(terrainMesh);
    terrainMesh = null;
  }
  if (basemapTexture) { basemapTexture.dispose?.(); basemapTexture = null; }
  minimapBase = null;
  route = null;
}

/* ------------------------------------------------------------------ */
/*  Friends (peer-to-peer rooms)                                       */
/* ------------------------------------------------------------------ */
function describeRoute() {
  if (freeDrive && lastFreeCenter) return { kind: 'free', center: lastFreeCenter };
  if (terrain?.streaming && lastGeometry) return { kind: 'osrm', geometry: lastGeometry };
  if (route && terrain && !terrain.streaming && route.samples?.length) {
    return {
      kind: 'baked',
      name: route.name,
      roadWidth: route.roadWidth,
      cutHalf: route.cutHalf,
      surface: route.surface,
      points: route.samples.filter((_, i) => i % 2 === 0).map((p) => [+p.x.toFixed(1), +p.z.toFixed(1)]),
    };
  }
  return null;
}

/**
 * Tell the room which stage we are on, whoever we are: the host broadcasts
 * (and keeps it for late joiners), a guest hands it to the host who drives
 * it too and relays it. Nothing is sent while we are applying a stage that
 * came from the room, so a shared stage never bounces back and forth.
 */
function shareRoute() {
  if (!session || applyingSharedRoute) return;
  const described = describeRoute();
  if (described) session.sendRoute(described);
}

let applyingSharedRoute = false;
/**
 * Drive a route descriptor (see describeRoute): from the room's host or from
 * the saved-routes list. Resolves to `{ ok, message }`.
 */
async function applyDescribedRoute(shared, { from = 'room' } = {}) {
  if (!shared || applyingSharedRoute || !loaded) return { ok: false, message: 'Busy.' };
  applyingSharedRoute = true;
  try {
    if (shared.kind === 'osrm' && shared.geometry) {
      await applyRouteGeometry(shared.geometry);
    } else if (shared.kind === 'free' && shared.center) {
      await enterFreeDrive(shared.center);
    } else if (shared.kind === 'baked' && shared.points?.length > 2) {
      if (terrain?.streaming) {
        const message = from === 'room'
          ? 'The host is on the demo mountain. Reload the page to join that stage.'
          : 'That route is on the demo mountain. Reload the page, then load it.';
        toast(message, 'error');
        return { ok: false, message };
      }
      const points = shared.points.map(([x, z]) => ({ x, z }));
      const sharedRoute = makeRoute(points, terrain, {
        simplify: false, smooth: 0, spacing: 4, name: shared.name || 'Shared stage', source: 'shared',
        roadWidth: shared.roadWidth || 1.25, cutHalf: shared.cutHalf || null, surface: shared.surface || 'gravel',
      });
      setRoute(sharedRoute, { announce: false });
    }
    const message = from === 'room'
      ? `Stage synced with the room: ${route?.name || ''}`.trim()
      : `Loaded: ${route?.name || 'free drive'}. Click START ENGINE or press Enter.`;
    toast(message);
    return { ok: true, message };
  } catch (error) {
    const message = from === 'room' ? `Could not load the host's stage: ${error.message}` : error.message;
    toast(message, 'error');
    return { ok: false, message };
  } finally {
    applyingSharedRoute = false;
  }
}

/** My paint: the room slot's colour, or the car's own when alone. */
function applyPaint() {
  car?.setPaint(session ? paintForSlot(session.slot) : null);
}

/** Where my car starts: the route's start pose, moved to my grid slot in a room. */
function spawnPose() {
  const base = route.startPose();
  const { back, side } = spawnOffset(session?.slot || 0);
  if (!back && !side) return base;
  const fx = Math.sin(base.yaw);
  const fz = Math.cos(base.yaw);
  const rx = Math.cos(base.yaw);
  const rz = -Math.sin(base.yaw);
  return { x: base.x - fx * back + rx * side, z: base.z - fz * back + rz * side, yaw: base.yaw };
}

function friendsStatus(text, kind = '') {
  const el = $('friendsStatus');
  if (el) { el.textContent = text; el.className = `map-status ${kind}`.trim(); }
}

function updatePlayersBadge() {
  const el = $('players');
  if (!el) return;
  if (!session) { el.classList.add('hidden'); return; }
  const names = [...session.peers.values()].map((p) => p.name);
  el.textContent = `ROOM ${session.code} · ${session.playerCount} ${session.playerCount === 1 ? 'PLAYER' : 'PLAYERS'}${names.length ? ' · ' + names.join(', ') : ''}`;
  el.classList.remove('hidden');
}

function bindSession(s) {
  s.addEventListener('status', (e) => { friendsStatus(e.detail.text, 'ok'); toast(e.detail.text); updatePlayersBadge(); });
  s.addEventListener('error', (e) => { friendsStatus(e.detail.message, 'err'); toast(e.detail.message, 'error'); });
  s.addEventListener('peer-join', () => { updatePlayersBadge(); shareRoute(); });
  s.addEventListener('peer-leave', (e) => { disposeGhost(e.detail.id); updatePlayersBadge(); });
  s.addEventListener('route', async (e) => {
    const { route: shared, from } = e.detail;
    const result = await applyDescribedRoute(shared);
    // Host: a guest's pick becomes the room's stage for everyone else too.
    if (s.isHost && from && result.ok) s.sendRoute(shared, from);
  });
  s.addEventListener('slot', () => {
    applyPaint();
    // Move to my grid slot unless I am already driving.
    if (car && route && (phase !== 'racing' || car.speed < 0.5)) car.reset(spawnPose());
  });
}

function syncFriendsButtons() {
  const hosting = Boolean(session?.isHost);
  const joined = Boolean(session && !session.isHost);
  // In a room (either role) only the room line is shown; the host and join
  // controls come back after LEAVE.
  $('friendsHostRow').classList.toggle('hidden', hosting || joined);
  $('friendsJoinRow').classList.toggle('hidden', hosting || joined);
  $('friendsRoomRole').textContent = hosting ? 'YOU HOST ROOM' : joined ? 'YOU ARE IN ROOM' : 'ROOM';
}

async function hostRoom() {
  if (session?.isHost) {
    friendsStatus(`You already host room ${session.code}. Friends join with that code; close this panel and drive.`, 'ok');
    return;
  }
  leaveRoom();
  const s = new Session({ name: myCallsign, kind: carKind });
  bindSession(s);
  friendsStatus('Opening a room…');
  try {
    const code = await s.host();
    session = s;
    $('friendsCodeOut').textContent = code;
    $('friendsRoom').classList.remove('hidden');
    friendsStatus(`You are in. Friends press JOIN and type ${code}. Close this panel and START ENGINE whenever you like.`, 'ok');
    applyPaint();
    updatePlayersBadge();
  } catch (error) {
    friendsStatus(error.message, 'err');
  }
  syncFriendsButtons();
}

async function joinRoom(code) {
  const wanted = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (session?.isHost) {
    friendsStatus(wanted === session.code
      ? `That is your own room — you are already in it. Close this panel and drive; friends join with ${session.code}.`
      : `You host room ${session.code}. Press LEAVE first if you want to join a different room.`, 'ok');
    return;
  }
  leaveRoom();
  const s = new Session({ name: myCallsign, kind: carKind });
  bindSession(s);
  friendsStatus(`Joining ${code}…`);
  try {
    await s.join(code);
    session = s;
    $('friendsCodeOut').textContent = s.code;
    $('friendsRoom').classList.remove('hidden');
    friendsStatus(`Joined room ${s.code}. Close this panel and START ENGINE; you will drive the host's stage.`, 'ok');
    updatePlayersBadge();
  } catch (error) {
    friendsStatus(error.message, 'err');
  }
  syncFriendsButtons();
}

function leaveRoom() {
  if (session) {
    session.close();
    session = null;
  }
  for (const id of [...ghosts.keys()]) disposeGhost(id);
  $('friendsRoom')?.classList.add('hidden');
  updatePlayersBadge();
  applyPaint();
  if ($('friendsJoin')) syncFriendsButtons();
}

function makeLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(10,14,11,0.75)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#f0ce58';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 34);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
  sprite.scale.set(4.8, 1.2, 1);
  sprite.renderOrder = 999;
  return sprite;
}

/** A tall arrow pointing down, unlit so its colour reads from far away. */
function makeArrow(hex) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: hex, toneMapped: false });
  const head = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 4), mat);
  head.rotation.x = Math.PI;            // tip down
  head.position.y = 1.1;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.6, 0.5), mat);
  shaft.position.y = 2.2 + 1.3;
  const rim = new THREE.Mesh(new THREE.ConeGeometry(1.25, 2.4, 4), new THREE.MeshBasicMaterial({ color: 0x101513, toneMapped: false, side: THREE.BackSide }));
  rim.rotation.x = Math.PI;
  rim.position.y = 1.1;
  group.add(rim, head, shaft);
  group.name = 'playerArrow';
  group.userData.material = mat;
  return group;
}

function disposeGhost(id) {
  const g = ghosts.get(id);
  if (!g) return;
  disposeGroup(g.car.group);
  disposeGroup(g.car.dust.points);
  if (g.arrow) { disposeGroup(g.arrow); scene.remove(g.arrow); }
  scene.remove(g.label);
  g.label.material.map?.dispose();
  g.label.material.dispose();
  ghosts.delete(id);
}

const ghostQ = { yaw: new THREE.Quaternion(), pitch: new THREE.Quaternion(), roll: new THREE.Quaternion() };
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);
/** Draw the other players where their last packets say they are. */
function updateGhosts(now, dt) {
  if (!session || !terrain) return;
  for (const [id, peer] of session.peers) {
    let g = ghosts.get(id);
    if (g && g.kind !== peer.kind) { disposeGhost(id); g = null; }
    if (!g) {
      const ghostCar = new Car(scene, terrain, peer.kind);
      const label = makeLabel(peer.name);
      scene.add(label);
      const arrow = makeArrow(paintForSlot(peer.slot ?? 1));
      scene.add(arrow);
      g = { car: ghostCar, label, arrow, kind: peer.kind, spin: 0, slot: undefined };
      ghosts.set(id, g);
    }
    if (g.slot !== peer.slot) {
      g.slot = peer.slot;
      g.car.setPaint(paintForSlot(peer.slot ?? 1));
      g.arrow.userData.material.color.setHex(paintForSlot(peer.slot ?? 1));
    }
    const pose = peer.track.sample(now);
    const stale = now - peer.track.lastSeen > 6000;
    g.car.group.visible = Boolean(pose) && !stale;
    g.label.visible = g.car.group.visible;
    g.arrow.visible = g.car.group.visible;
    if (!pose) continue;
    // Beacon: the arrow hovers high over the car, bobbing and turning slowly.
    const bob = Math.sin(now / 400) * 0.4;
    g.arrow.position.set(pose.x, pose.y + 9 + bob, pose.z);
    g.arrow.rotation.y = now / 1200;
    g.car.group.position.set(pose.x, pose.y + 0.02, pose.z);
    ghostQ.yaw.setFromAxisAngle(AXIS_Y, pose.yaw);
    ghostQ.pitch.setFromAxisAngle(AXIS_X, pose.pitch);
    ghostQ.roll.setFromAxisAngle(AXIS_Z, pose.roll);
    g.car.group.quaternion.copy(ghostQ.yaw).multiply(ghostQ.pitch).multiply(ghostQ.roll);
    g.spin += (pose.speed / g.car.spec.wheelRadius) * dt;
    for (const w of g.car.wheels) w.spin.rotation.x = g.spin;
    g.label.position.set(pose.x, pose.y + 15.2 + bob, pose.z);
  }
  for (const id of [...ghosts.keys()]) if (!session.peers.has(id)) disposeGhost(id);
}

/**
 * The baked demo tile gets the same real-world dressing as a streamed chunk:
 * OpenStreetMap buildings and water, and NVDB road signs along the stage.
 */
async function addBakedFeatures() {
  if (!terrain || terrain.streaming) return;
  const t = terrain;
  const a = t.latLonFromWorld(-t.sizeX / 2, -t.sizeZ / 2);
  const b = t.latLonFromWorld(t.sizeX / 2, t.sizeZ / 2);
  const bbox = {
    minLat: Math.min(a.lat, b.lat), maxLat: Math.max(a.lat, b.lat),
    minLon: Math.min(a.lon, b.lon), maxLon: Math.max(a.lon, b.lon),
  };
  const group = new THREE.Group();
  group.name = 'bakedFeatures';
  scene.add(group);
  bakedFeatures = group;

  fetchRoadSigns(bbox).then((data) => {
    if (terrain !== t) return;
    bakedSignData = data;
    refreshBakedSigns();
  }).catch((error) => log.warn(`demo signs skipped: ${error.message}`));

  try {
    const osm = await fetchOsmChunk(bbox);
    if (terrain !== t || !osm) return;
    const houses = buildChunkHouses(osm.buildings, t, route ? buildRouteIndex(route) : null, 11);
    if (houses) {
      group.add(houses);
      t.buildings = new BuildingIndex();
      t.buildings.setChunk('baked', houses.userData.boxes);
    }
    const water = buildChunkWater(osm, t, { x0: -t.sizeX / 2, z0: -t.sizeZ / 2, size: Math.max(t.sizeX, t.sizeZ) });
    if (water) {
      group.add(water);
      t.waterBodies = water.userData.bodies; // so the car can splash into the tile's lakes and rivers
    }
    log.info(`demo tile: ${houses?.userData.count || 0} buildings, ${water?.userData.rivers || 0} waterways, ${water?.userData.lakes || 0} lakes`);
  } catch (error) {
    log.warn(`demo map features skipped: ${error.message}`);
  }
}

function refreshBakedSigns() {
  if (!bakedFeatures) return;
  const old = bakedFeatures.getObjectByName('signs');
  if (old) {
    disposeGroup(old);
    bakedFeatures.remove(old);
  }
  if (!bakedSignData || !route || !terrain || terrain.streaming) return;
  const signs = buildChunkSigns(bakedSignData, terrain, route, { seed: 5 });
  if (signs) bakedFeatures.add(signs);
}

/**
 * Phase 1+2 (V5 plan): swap the running world for a streamed one around a
 * (possibly segmented) OSRM master track. The corridor DEM, the 2 km chunks,
 * the road carving and the LOD meshes are all handled by `createStreamingWorld`;
 * chunks keep loading and disposing around the car for the rest of the drive.
 */
async function enterStreamingWorld(geometry) {
  const mid = geometry.coordinates[Math.floor(geometry.coordinates.length / 2)];
  const title = `Stage at ${mid.lat.toFixed(2)}°N ${mid.lon.toFixed(2)}°E`;
  setWorldLoading(true, 0.02, 'Planning the streamed world…');
  try {
    const world = await createStreamingWorld({
      geometry,
      title,
      onProgress: (p, text) => setWorldLoading(true, p, text),
    });

    setWorldLoading(true, 0.95, 'Warming up the stage…');
    await nextFrame();

    teardownWorld();
    terrain = world;
    basemapTexture = null;

    scene.add(world.group);
    car = new Car(scene, terrain, carKind);
    car.autoShift = gearboxAuto;
    car.slideMode = slideMode;
    applyPaint();
    water = buildWater(terrain);
    scene.add(water);
    vegetation = null;
    roadGroup = null;
    terrainMesh = null;
    route = world.route;
    freeDrive = false;
    minimapBase = world.minimapCanvas;

    car.setRoute(route);
    updateRouteHud();
    updateMinimapRoute();
    $('progressWrap').classList.remove('hidden');
    resetStage();

    document.title = `Retro Norway Rally — ${title}`;
    const label = $('minimapLabel');
    if (label) {
      label.innerHTML = `${title.replace('Stage at ', '').toUpperCase()} <span>N↑</span>`;
    }

    try {
      camera.position.set(car.pos.x - 12, car.pos.y + 9, car.pos.z + 18);
      camera.lookAt(car.pos.x, car.pos.y, car.pos.z);
      renderer.compile(scene, camera);
      retro.render(scene, camera, time);
    } catch (error) {
      log.warn('streamed-world warm-up failed (continuing)', error);
    }

    log.info(`streamed world ready: ${route.name}, ${route.length.toFixed(0)} m route`);
    shareRoute();
    return { route, world };
  } finally {
    setWorldLoading(false);
  }
}

/**
 * Free drive: stream the world around a point and let the player go wherever
 * the OpenStreetMap roads lead. Chunks keep loading ahead of the car; the
 * car is put on the nearest road as soon as the first chunk's roads arrive.
 */
async function enterFreeDrive(center) {
  lastFreeCenter = center;
  lastGeometry = null;
  setWorldLoading(true, 0.02, 'Finding the nearest road…');
  // Start on a road: OSRM snaps the picked point to the nearest drivable way
  // and tells us which way it runs, even before the chunk's roads are loaded.
  const nearest = await fetchOsrmNearest(center);
  if (nearest) {
    center = { lat: nearest.lat, lon: nearest.lon };
    log.info(`free drive snapped ${Math.round(nearest.snapped)} m to ${nearest.name || 'a road'}`);
  }
  const title = `Free drive at ${center.lat.toFixed(2)}°N ${center.lon.toFixed(2)}°E`;
  try {
    const world = await createStreamingWorld({
      center,
      freeDrive: true,
      heading: nearest?.heading || 0,
      title,
      onProgress: (p, text) => setWorldLoading(true, p, text),
    });
    setWorldLoading(true, 0.95, 'Warming up…');
    await nextFrame();

    teardownWorld();
    terrain = world;
    basemapTexture = null;

    scene.add(world.group);
    car = new Car(scene, terrain, carKind);
    car.autoShift = gearboxAuto;
    car.slideMode = slideMode;
    applyPaint();
    water = buildWater(terrain);
    scene.add(water);
    vegetation = null;
    roadGroup = null;
    terrainMesh = null;
    route = world.roads;
    freeDrive = true;
    minimapBase = world.minimapCanvas;
    world.onSpawnSnapped = (pose) => {
      // Only move a car that has not driven off yet.
      if (terrain === world && car && car.speed < 1) {
        car.reset(pose);
        toast('On the road. Drive anywhere — the world streams in ahead of you.');
      }
    };

    car.setRoute(route);
    updateRouteHud();
    updateMinimapRoute();
    $('progressWrap').classList.add('hidden');
    resetStage();

    document.title = `Retro Norway Rally — ${title}`;
    const label = $('minimapLabel');
    if (label) label.innerHTML = `FREE DRIVE <span>N↑</span>`;
    try {
      camera.position.set(car.pos.x - 12, car.pos.y + 9, car.pos.z + 18);
      camera.lookAt(car.pos.x, car.pos.y, car.pos.z);
      renderer.compile(scene, camera);
      retro.render(scene, camera, time);
    } catch (error) {
      log.warn('free-drive warm-up failed (continuing)', error);
    }
    log.info(`free drive ready at ${center.lat.toFixed(4)}, ${center.lon.toFixed(4)}`);
    shareRoute();
    toast('Free drive. Roads, houses and forests stream in as you go.');
    return world;
  } finally {
    setWorldLoading(false);
  }
}

/**
 * Apply an OSRM master track: drive it on the current (baked) terrain if it
 * fits, otherwise stream a world around it. This is the "drive anywhere in
 * Norway" path for both the 2D map and the coordinate router.
 */
async function applyRouteGeometry(geometry) {
  lastGeometry = geometry;
  lastFreeCenter = null;
  if (terrain && !terrain.streaming) {
    const fits = geometry.coordinates.every(({ lat, lon }) => {
      const p = terrain.worldFromLatLon(lat, lon);
      return terrain.inside(p.x, p.z, 6);
    });
    if (fits) {
      const result = buildOsrmRoute(terrain, geometry);
      setRoute(result.route, { announce: true });
      return { result, generated: false };
    }
  }
  const result = await enterStreamingWorld(geometry);
  toast(`${result.route.name} — ${(result.route.length / 1000).toFixed(2)} km. Streamed world ready.`);
  return { result, generated: true };
}

/** Stage panel + minimap labels shared by the legacy and streaming paths. */
function updateRouteHud() {
  if (!route || !terrain) return;
  bestTime = readBest(route);
  $('stageName').textContent = route.name.toUpperCase();
  $('stageLength').textContent = `${(route.length / 1000).toFixed(2)} KM`;
  const startLL = terrain.latLonFromWorld(route.start.x, route.start.z);
  const finishLL = terrain.latLonFromWorld(route.finish.x, route.finish.z);
  $('startCoord').textContent = formatCoord(startLL);
  $('finishCoord').textContent = formatCoord(finishLL);
  updateBestLabel();
}

function setRoute(nextRoute, { announce = false, pad = true } = {}) {
  freeDrive = false;
  queueMicrotask(() => refreshBakedSigns());
  $('progressWrap').classList.remove('hidden');
  if (terrain?.streaming) {
    // The streamed world carves the road per chunk, rebuilds the meshes,
    // regrows the forest with the 6 m clearance rule and re-places houses.
    log.time('stream setRoute', () => terrain.setRoute(nextRoute));
    route = nextRoute;
    car.setRoute(route);
    minimapBase = terrain.minimapCanvas;
    updateRouteHud();
    updateMinimapRoute();
    resetStage();
    if (announce) {
      toast(`${route.name} — ${(route.length / 1000).toFixed(2)} km. Click START ENGINE or press Enter.`);
    }
    shareRoute();
    return;
  }

  // Every stage gets a level start shelf, whatever router produced it.
  if (pad) {
    terrain.resetHeights();
    terrain.flattenPad(nextRoute.start.x, nextRoute.start.z, 18, 34);
    nextRoute.snapToTerrain();
  }
  // Smooth a carriageway height along the route, then carve the engineered
  // profile (embankments / cuttings) into the shared height field *before*
  // rebuilding the mesh, so the visible surface, the ribbon and the car agree.
  nextRoute.assignRoadY(terrain);
  const carved = log.time('carve road', () => terrain.carveRoad(nextRoute.samples, {
    halfWidth: nextRoute.roadWidth + 1.2,
    cut: nextRoute.cutHalf,
    surface: nextRoute.surface,
  }));
  nextRoute.snapToTerrain();
  log.debug(`carved ${carved} height samples for ${nextRoute.name}`);

  if (terrainMesh) {
    if (pad) rebuildTerrainSurface();
    else terrainMesh.userData.refresh?.();
  }
  route = nextRoute;
  turns = route.free ? [] : findTurns(route.samples);
  if (roadGroup) disposeGroup(roadGroup);
  roadGroup = buildRoadVisuals(route, terrain);
  scene.add(roadGroup);
  if (corridorGroup) { disposeGroup(corridorGroup); corridorGroup = null; }
  const corridor = corridorMesh(buildCorridorGeometry([{ half: route.roadWidth, samples: route.samples, length: route.length }], {
    sampleBase: (x, z) => terrain.sampleBase(x, z),
  }));
  if (corridor) {
    corridorGroup = corridor;
    scene.add(corridorGroup);
  }

  if (vegetation) disposeGroup(vegetation);
  vegetation = buildVegetation(terrain, route, mulberry32(0x1f2e3d4c));
  scene.add(vegetation);

  car.setRoute(route);

  updateRouteHud();
  updateMinimapRoute();
  resetStage();
  shareRoute();

  if (announce) {
    toast(`${route.name} — ${(route.length / 1000).toFixed(2)} km. Click START ENGINE or press Enter.`);
  }
}

function updateBestLabel() {
  $('best').textContent = bestTime ? `BEST ${formatTime(bestTime)}` : 'BEST --:--.---';
}

function resetStage({ countdownNow = hasStarted } = {}) {
  setCompactHud(countdownNow);
  if (!route || !car) return;
  phase = countdownNow ? 'countdown' : 'intro';
  stageTime = 0;
  countdown = 3.0;
  countdownShown = -1;
  topSpeed = 0;
  driftTime = 0;
  airTimeTotal = 0;
  car.reset(spawnPose());
  $('resultScreen').classList.add('hidden');
  $('wrongWay').classList.remove('show');
  $('timer').textContent = '00:00.000';
  $('progressBar').style.width = '0%';
  updateBestLabel();
  if (!countdownNow) $('countdown').classList.remove('pop');
}

/** On phones go full screen and ask for landscape when the drive starts (best effort). */
function requestLandscape() {
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  const el = document.documentElement;
  let p;
  try { p = el.requestFullscreen?.({ navigationUI: 'hide' }); } catch { p = null; }
  Promise.resolve(p).catch(() => {}).then(() => {
    try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* not allowed here */ }
  });
}

function beginCountdown() {
  requestLandscape();
  hasStarted = true;
  $('startScreen').classList.add('hidden');
  $('hud').classList.remove('hidden');
  resetStage({ countdownNow: true });
  audio.start();
}

/** Back to the start screen (car, gearbox, sliding, friends); the stage and route stay. */
function returnToMenu() {
  if (!hasStarted) return;
  hasStarted = false;
  keys.clear();
  $('resultScreen').classList.add('hidden');
  $('hud').classList.add('hidden');
  $('startScreen').classList.remove('hidden');
  resetStage({ countdownNow: false });
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

async function scoutNewStage() {
  if (!terrain) return;
  if (terrain.streaming) {
    // A streamed world has no full height field to A* over; scout by asking
    // OSRM for a road stage that starts where the car is standing.
    if (!car) return;
    toast('Scouting a new streamed stage…');
    try {
      const a = terrain.latLonFromWorld(car.pos.x, car.pos.z);
      const angle = Math.random() * Math.PI * 2;
      const distance = 1600 + Math.random() * 2600;
      const b = terrain.latLonFromWorld(
        car.pos.x + Math.sin(angle) * distance,
        car.pos.z + Math.cos(angle) * distance,
      );
      const geometry = await fetchOsrmGeometrySegmented({ a, b, profile: lastOsrmProfile });
      await applyRouteGeometry(geometry);
    } catch (error) {
      toast(error.message || 'No road stage found from here. Click the minimap to pick one.', 'error');
    }
    return;
  }
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
      toast(error.message || 'No stage found. Click the minimap to pick one.', 'error');
    }
  }, 30);
}

/* ------------------------------------------------------------------ */
/*  Off-road A* stage between two map picks (inside the loaded world)  */
/* ------------------------------------------------------------------ */
function offroadRoute(a, b) {
  const points = [a, b].map((ll) => terrain.worldFromLatLon(ll.lat, ll.lon));
  for (const p of points) {
    if (!terrain.inside(p.x, p.z, 40)) {
      throw new Error('Off-road routes need both points inside the loaded world (the dashed outline on the map).');
    }
    if (terrain.sample(p.x, p.z) < 3) throw new Error('That point is in the water. Pick dry ground.');
    if (terrain.slope(p.x, p.z) > 0.9) throw new Error('That point is on a cliff. Pick gentler ground.');
  }
  const [wa, wb] = points;
  // On a streamed world the A* grid only covers a loaded window around the
  // two picks; the baked world uses its full height field.
  const window = terrain.streaming
    ? {
      minX: Math.min(wa.x, wb.x) - 2400,
      maxX: Math.max(wa.x, wb.x) + 2400,
      minZ: Math.min(wa.z, wb.z) - 2400,
      maxZ: Math.max(wa.z, wb.z) + 2400,
    }
    : null;
  const next = generateRallyRoute(terrain, wa, wb, { name: 'Custom A↔B Stage', window });
  setRoute(next, { announce: true });
  return next;
}

/* ------------------------------------------------------------------ */
/*  Minimap                                                            */
/* ------------------------------------------------------------------ */
const mm = $('minimap');
const mmCtx = mm.getContext('2d');
const MM_SIZE = mm.width;

// The minimap is a north-up window around the car: mmWindow metres across
// (a little wider at speed), terrain sampled live so it works in the baked
// world, a streamed stage and free drive alike. The window holds still while
// the car moves inside its inner half and re-centres on the car once it is
// halfway from the centre to the edge, so the map does not swim.
const MM_CELLS = 80;
const mmTerrain = document.createElement('canvas');
mmTerrain.width = MM_CELLS;
mmTerrain.height = MM_CELLS;
const mmTerrainCtx = mmTerrain.getContext('2d', { willReadFrequently: true });
const mmPixels = mmTerrainCtx.createImageData(MM_CELLS, MM_CELLS);
let mmWindow = 1400;
let mmCenter = { x: Infinity, z: Infinity }; // world position at the middle of the window
let mmLast = { window: 0, t: 0 };
const mmColor = new THREE.Color();

/** Metres per minimap pixel for the current window. */
function mmScale() { return MM_SIZE / mmWindow; }

function worldToMap(x, z) {
  const k = mmScale();
  return { x: MM_SIZE / 2 + (x - mmCenter.x) * k, y: MM_SIZE / 2 + (z - mmCenter.z) * k };
}

function mapToWorld(px, py) {
  const k = mmScale();
  return { x: mmCenter.x + (px - MM_SIZE / 2) / k, z: mmCenter.z + (py - MM_SIZE / 2) / k };
}

/**
 * Re-sample the hillshaded terrain layer (with the road network) around the
 * window centre. The centre jumps to the car when the car is halfway from
 * the centre to the edge (or on a forced refresh); a zoom change or the
 * slow periodic refresh re-renders around the current centre.
 */
function refreshMinimapTerrain(force = false) {
  if (!terrain || !car) return;
  const off = Math.hypot(car.pos.x - mmCenter.x, car.pos.z - mmCenter.z);
  const recenter = force || off > mmWindow / 4;
  const rezoom = Math.abs(mmLast.window - mmWindow) > mmWindow * 0.04;
  if (!recenter && !rezoom && time - mmLast.t < 2.5) return;
  if (recenter) mmCenter = { x: car.pos.x, z: car.pos.z };
  mmLast = { window: mmWindow, t: time };
  const cell = mmWindow / MM_CELLS;
  const x0 = mmCenter.x - mmWindow / 2;
  const z0 = mmCenter.z - mmWindow / 2;
  const heights = new Float32Array((MM_CELLS + 2) * (MM_CELLS + 2));
  for (let j = 0; j < MM_CELLS + 2; j++) {
    for (let i = 0; i < MM_CELLS + 2; i++) {
      heights[j * (MM_CELLS + 2) + i] = terrain.sample(x0 + (i - 0.5) * cell, z0 + (j - 0.5) * cell);
    }
  }
  const data = mmPixels.data;
  const W = MM_CELLS + 2;
  for (let j = 0; j < MM_CELLS; j++) {
    for (let i = 0; i < MM_CELLS; i++) {
      const h = heights[(j + 1) * W + (i + 1)];
      const gx = (heights[(j + 1) * W + (i + 2)] - heights[(j + 1) * W + i]) / (2 * cell);
      const gz = (heights[(j + 2) * W + (i + 1)] - heights[j * W + (i + 1)]) / (2 * cell);
      const x = x0 + (i + 0.5) * cell;
      const z = z0 + (j + 0.5) * cell;
      const o = (j * MM_CELLS + i) * 4;
      if (terrain.inside && !terrain.inside(x, z, 0)) {
        // Beyond the loaded world: unknown ground, drawn dark.
        data[o] = 18; data[o + 1] = 22; data[o + 2] = 20; data[o + 3] = 255;
        continue;
      }
      terrainColor(h, Math.hypot(gx, gz), x, z, mmColor);
      terrain.tintAt?.(x, z, mmColor);
      const shade = clamp(0.74 + (-gx * 0.7 - gz * 0.7) * 1.3, 0.4, 1.25);
      data[o] = clamp(mmColor.r * 255 * shade, 0, 255);
      data[o + 1] = clamp(mmColor.g * 255 * shade, 0, 255);
      data[o + 2] = clamp(mmColor.b * 255 * shade, 0, 255);
      data[o + 3] = 255;
    }
  }
  mmTerrainCtx.putImageData(mmPixels, 0, 0);

  // OpenStreetMap roads of the loaded chunks, drawn into the cached layer
  // (thousands of segments: far too many to stroke every frame).
  const network = terrain.roads;
  if (network?.segmentCount) {
    const scale = MM_CELLS / mmWindow;
    mmTerrainCtx.strokeStyle = 'rgba(236,232,220,.6)';
    mmTerrainCtx.lineWidth = 1;
    mmTerrainCtx.beginPath();
    for (const seg of network.segmentsNear(mmCenter.x, mmCenter.z, mmWindow * 0.75)) {
      mmTerrainCtx.moveTo((seg.ax - x0) * scale, (seg.az - z0) * scale);
      mmTerrainCtx.lineTo((seg.bx - x0) * scale, (seg.bz - z0) * scale);
    }
    mmTerrainCtx.stroke();
  }
}

function updateMinimapRoute() {
  // The map is redrawn every frame around the car; nothing to cache here.
  refreshMinimapTerrain(true);
}

function drawMinimap() {
  if (!car || !terrain) return;
  mmWindow = 1400 + Math.min(900, car.speed * 14);
  refreshMinimapTerrain();
  mmCtx.imageSmoothingEnabled = false;
  mmCtx.clearRect(0, 0, MM_SIZE, MM_SIZE);
  mmCtx.drawImage(mmTerrain, 0, 0, MM_SIZE, MM_SIZE);

  if (route && route.samples.length) {
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
  }

  // Other players in the room.
  if (session) {
    for (const [, peer] of session.peers) {
      const pose = peer.track.sample(performance.now());
      if (!pose) continue;
      const p = worldToMap(pose.x, pose.z);
      if (p.x < -6 || p.y < -6 || p.x > MM_SIZE + 6 || p.y > MM_SIZE + 6) continue;
      mmCtx.fillStyle = '#ff7a5c';
      mmCtx.beginPath();
      mmCtx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      mmCtx.fill();
      mmCtx.strokeStyle = '#101513';
      mmCtx.lineWidth = 1;
      mmCtx.stroke();
    }
  }

  // The car, wherever it is in the window, pointing its way.
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

  // Scale bar.
  const barM = mmWindow > 1800 ? 500 : 250;
  const barPx = barM * mmScale();
  mmCtx.fillStyle = 'rgba(0,0,0,.55)';
  mmCtx.fillRect(6, MM_SIZE - 14, barPx + 6, 10);
  mmCtx.fillStyle = '#f4efe0';
  mmCtx.fillRect(9, MM_SIZE - 9, barPx, 2);
  mmCtx.font = '7px monospace';
  mmCtx.fillText(`${barM} m`, 9, MM_SIZE - 16);
}

/* ------------------------------------------------------------------ */
/*  Camera                                                             */
/* ------------------------------------------------------------------ */
const lookSmooth = new THREE.Vector3(0, 0, 0);
const cameraTarget = new THREE.Vector3();
const tempLook = new THREE.Vector3();

function updateCamera(dt) {
  if (!car || !terrain) return;
  const f = car.forward();

  if (!hasStarted || phase === 'intro') {
    // Showroom: the car turns slowly on the start pad while a low
    // three-quarter camera holds still, so the player can look it over.
    car.yaw = wrapAngle(car.yaw + dt * 0.45);
    const angle = (car.spawnYaw ?? 0) + 0.4;
    const radius = 9.5;
    cameraTarget.set(
      car.pos.x + Math.sin(angle) * radius,
      car.pos.y + 3.0,
      car.pos.z + Math.cos(angle) * radius,
    );
    const minY = terrain.sample(cameraTarget.x, cameraTarget.z) + 1.4;
    cameraTarget.y = Math.max(cameraTarget.y, minY);
    camera.position.lerp(cameraTarget, 1 - Math.exp(-2.2 * dt));
    // Aim past the car so it shows to the left of the start card.
    const dx = car.pos.x - camera.position.x;
    const dz = car.pos.z - camera.position.z;
    const dl = Math.hypot(dx, dz) || 1;
    tempLook.set(car.pos.x - (dz / dl) * 3.6, car.pos.y + 0.8, car.pos.z + (dx / dl) * 3.6);
    lookSmooth.lerp(tempLook, 1 - Math.exp(-4 * dt));
    camera.lookAt(lookSmooth);
    camera.fov = damp(camera.fov, 50, 4, dt);
    camera.updateProjectionMatrix();
  } else if (cameraMode === 'cockpit') {
    // Driver's seat (left-hand drive): eyes behind the windscreen, the
    // fender humps in view. The cabin shell is back-face culled from inside.
    const r = car.right();
    const eye = car.group.localToWorld(new THREE.Vector3(car.spec.eye.x, car.spec.eye.y, car.spec.eye.z));
    camera.position.copy(eye);
    tempLook.set(
      car.pos.x + f.x * 30 - r.x * 0.36,
      car.pos.y + 1.0 + car.pitch * -30 * 0.5,
      car.pos.z + f.z * 30 - r.z * 0.36,
    );
    camera.lookAt(tempLook);
    camera.fov = damp(camera.fov, 74, 4, dt);
    camera.updateProjectionMatrix();
  } else if (cameraMode === 'top') {
    // Straight above, heading up the screen, climbing with speed.
    const height = 42 + Math.min(40, car.speed * 0.9);
    cameraTarget.set(car.pos.x + f.x * 6, car.pos.y + height, car.pos.z + f.z * 6);
    camera.position.lerp(cameraTarget, 1 - Math.exp(-6 * dt));
    cameraUp.set(f.x, 0, f.z);
    camera.up.lerp(cameraUp, 1 - Math.exp(-5 * dt)).normalize();
    tempLook.set(camera.position.x, car.pos.y, camera.position.z);
    camera.lookAt(tempLook);
    camera.fov = damp(camera.fov, 58, 4, dt);
    camera.updateProjectionMatrix();
  } else {
    const speed = car.speed;
    let back = 6.6 + speed * 0.03;
    const height = 2.5 + speed * 0.012;
    // Sense of speed: the lens widens and the horizon rushes as you go faster.
    camera.fov = damp(camera.fov, 62 + Math.min(24, speed * 0.5), 3, dt);
    camera.updateProjectionMatrix();
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
  Space: 'jump',
  ShiftLeft: 'handbrake', ShiftRight: 'handbrake',
};
let jumpLatch = false;

window.addEventListener('keydown', (event) => {
  if (keyMap[event.code]) {
    keys.add(keyMap[event.code]);
    if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
  }
  if (event.code === 'KeyR') {
    if (loaded && hasStarted) {
      resetStage({ countdownNow: true });
      toast('Stage restarted.');
    }
  }
  if (event.code === 'KeyC') {
    setCameraMode(CAMERA_MODES[(CAMERA_MODES.indexOf(cameraMode) + 1) % CAMERA_MODES.length]);
  }
  if (/^Digit[123]$/.test(event.code)) {
    setCameraMode(CAMERA_MODES[Number(event.code.slice(5)) - 1]);
  }
  if (event.code === 'KeyM') {
    audio.setMuted(!audio.muted);
    toast(audio.muted ? 'Sound off.' : 'Sound on.');
  }
  if (event.code === 'KeyQ' && car && loaded) {
    car.shift(car.gear > 1 ? car.gear - 1 : car.gear);
    if (car.autoShift) {
      setGearbox(false, { announce: false });
      toast('Manual gearbox. Q/E shift, G returns to automatic.');
    }
  }
  if (event.code === 'KeyE' && car && loaded) {
    car.shift(car.gear + 1);
    if (car.autoShift) {
      setGearbox(false, { announce: false });
      toast('Manual gearbox. Q/E shift, G returns to automatic.');
    }
  }
  if (event.code === 'KeyG' && car) {
    setGearbox(!car.autoShift);
  }
  if (event.code === 'KeyN' && loaded && hasStarted) scoutNewStage();
  if (event.code === 'Enter' && loaded && !hasStarted) beginCountdown();
  if (event.code === 'Escape' && hasStarted && !mapPicker.isOpen() && $('friendsPanel').classList.contains('hidden')) returnToMenu();
  if (event.code === 'F3' || event.code === 'F10') {
    event.preventDefault();
    toggleDebug();
  }
});
window.addEventListener('keyup', (event) => {
  if (keyMap[event.code]) keys.delete(keyMap[event.code]);
});
window.addEventListener('blur', () => keys.clear());

// OpenStreetMap features (houses, roads, fields, water) come from the public
// Overpass mirrors, which are sometimes overloaded. Say so instead of leaving
// the player to wonder why the villages are empty; the chunks retry on their own.
let overpassToastAt = 0;
window.addEventListener('rally:overpass-down', () => {
  if (performance.now() - overpassToastAt < 90000) return;
  overpassToastAt = performance.now();
  toast('OpenStreetMap servers are busy — houses, roads and fields will appear when they answer.', 'error');
});

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
  const jumpHeld = keys.has('jump');
  input.jump = jumpHeld && !jumpLatch;
  jumpLatch = jumpHeld;
}

/* ------------------------------------------------------------------ */
/*  HUD                                                                */
/* ------------------------------------------------------------------ */
function updateHud() {
  if (!car) return;
  const kmh = Math.round(car.speed * 3.6);
  $('speed').textContent = String(Math.min(999, kmh)).padStart(3, '0');
  const gearLabel = car.gear === 0 ? 'R' : String(car.gear);
  $('gear').textContent = `${gearLabel} ${car.autoShift ? 'AUTO' : 'MAN'}`;
  const rpmFrac = clamp01((car.rpm - car.spec.idle) / (car.spec.redline - car.spec.idle));
  $('rpmFill').style.width = `${rpmFrac * 100}%`;
  $('rpmFill').style.background = rpmFrac > 0.9 || car.limiter ? '#ff3a2a' : '';
  const rpmRounded = Math.round(car.rpm / 100) * 100;
  $('rpmText').textContent = String(rpmRounded);
  $('rpm').textContent = String(rpmRounded).padStart(5, '0');

  const surface = $('surface');
  if (!car.grounded) {
    surface.textContent = 'AIRBORNE';
    surface.className = 'air';
  } else if (car.waterDepth > 0.05) {
    surface.textContent = car.waterDepth > 0.8 ? 'DEEP WATER' : 'WATER';
    surface.className = 'off';
  } else if (car.onRoad) {
    surface.textContent = car.drifting ? 'DRIFT' : car.surfaceKind === 'asphalt' ? 'ASPHALT' : 'GRAVEL';
    surface.className = car.drifting ? 'off' : 'road';
  } else {
    surface.textContent = 'OFF ROAD';
    surface.className = 'off';
  }

  $('timer').textContent = formatTime(stageTime);
  if (phase === 'racing') {
    $('progressBar').style.width = `${clamp01(car.progress) * 100}%`;
  }
  updateTurnNote();
  $('wrongWay').classList.toggle('show', car.wrongWay && phase === 'racing');
}

/** Next-turn note under the speedometer: arrow for direction and sharpness, distance in 50 m steps. */
function updateTurnNote() {
  const box = $('turnBox');
  const s = car.roadQuery?.point?.s;
  const turn = phase === 'racing' && s != null ? nextTurn(turns, s) : null;
  box.classList.toggle('hidden', !turn);
  if (!turn) return;
  const metres = roundedDistance(turn, s);
  const side = turn.angle > 0 ? 'LEFT' : 'RIGHT';
  $('turnDist').textContent = metres > 0 ? `${metres} m` : 'NOW';
  $('turnKind').textContent = turn.severity === 'hairpin' ? `HAIRPIN ${side}` : turn.severity === 'slight' ? `EASY ${side}` : side;
  // The arrow points up the road and swings into the bend: left turns rotate anticlockwise on screen.
  $('turnArrow').style.transform = `rotate(${-Math.max(-150, Math.min(150, turn.angle))}deg)`;
  box.classList.toggle('hairpin', turn.severity === 'hairpin');
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
  if (terrain?.streaming && water && car) {
    // The ocean plane follows the car in a streamed world (there is no fixed
    // world edge). Snapping keeps the wave field from swimming.
    water.position.set(Math.round(car.pos.x / 64) * 64, SEA_LEVEL, Math.round(car.pos.z / 64) * 64);
  }
  if (!car) return;
  // Demo tile: houses only within 250 m of the car (the streamed world does its own).
  if (bakedFeatures && time - lastBakedCull > 0.25) {
    lastBakedCull = time;
    cullHouses(bakedFeatures.getObjectByName('houses'), car.pos.x, car.pos.z);
  }
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
    const response = await fetch(`${import.meta.env.BASE_URL}terrain/scenes/index.json`);
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
  const base = `${import.meta.env.BASE_URL}terrain/${path}`;

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
  const bootStart = performance.now();
  log.info('boot: start');
  try {
    setLoading(0.02, 'Reading the 3d_terrain scene catalog…');
    const { entry, base, sceneMeta, tif } = await resolveSceneFolder();
    log.info(`boot: scene ${entry.name} at ${base}`);
    setLoading(0.05, `Opening ${entry.title || entry.name}…`);

    const basemapFile = sceneMeta?.basemap?.file;
    terrain = await log.timeAsync('load terrain', () => loadTerrain({
      sceneUrl: `${base}scene.json`,
      tifUrl: `${base}${tif}`,
      basemapUrl: basemapFile ? `${base}${basemapFile}` : null,
      onProgress: (p, text) => setLoading(p, text),
    }));
    log.info(`boot: terrain ${terrain.sizeX.toFixed(0)}×${terrain.sizeZ.toFixed(0)} m, ${terrain.grid}² samples`);

    if (terrain.basemapUrl) {
      setLoading(0.84, 'Draping the Kartverket topo map…');
      basemapTexture = await loadBasemapTexture(terrain.basemapUrl);
    }

    setLoading(0.86, 'Plotting the rally stage…');
    const initialRoute = log.time('initial route', () => generateRallyRoute(
      terrain,
      { x: -710, z: 288 },
      { x: 104, z: -245 },
      { name: 'Preikestolen Climb' },
    ));
    // Bulldoze the start shelf before the visible mountain is built, so the
    // mesh, the physics and the road all agree that the start is flat.
    terrain.flattenPad(initialRoute.start.x, initialRoute.start.z, 18, 34);
    initialRoute.snapToTerrain();

    setLoading(0.9, 'Sculpting the low-poly mountain…');
    rebuildTerrainSurface();

    water = buildWater(terrain);
    scene.add(water);

    car = new Car(scene, terrain, carKind);

    car.autoShift = gearboxAuto;

    car.slideMode = slideMode;

    applyPaint();

    setRoute(initialRoute, { pad: false });

    // A hazy ring of distant peaks across the fjord.
    distantPeaks = addDistantPeaks();

    // Compile every material and warm the shadow pass behind the loading
    // screen. On slower GPUs this is a one-second stall, and doing it during
    // the first driving frame is exactly what makes the game look frozen.
    setLoading(0.96, 'Warming up shaders and shadows…');
    await nextFrame();
    try {
      camera.position.set(car.pos.x - 12, car.pos.y + 9, car.pos.z + 18);
      camera.lookAt(car.pos.x, car.pos.y, car.pos.z);
      renderer.compile(scene, camera);
      retro.render(scene, camera, 0);
      retro.render(scene, camera, 0);
    } catch (error) {
      log.warn('warm-up render failed (continuing)', error);
    }

    document.title = `Retro Norway Rally — ${entry.title || 'Preikestolen'}`;
    loaded = true;
    addBakedFeatures();
    phase = 'intro';
    setLoading(1, 'Ready.');
    applySharedLink();
    $('startBtn').disabled = false;
    $('startBtn').textContent = 'START ENGINE';
    $('startBtn').focus();
    log.info(`boot: ready in ${(performance.now() - bootStart).toFixed(0)} ms`);
  } catch (error) {
    log.error(`boot failed after ${(performance.now() - bootStart).toFixed(0)} ms`, error);
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
  // Keep the ring outside the terrain even for a 6 km generated world.
  const inner = Math.max(2800, (terrain?.sizeX ?? 2000) * 0.95);
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + rand() * 0.18;
    const radius = inner + rand() * 1900;
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
  return group;
}

/* ------------------------------------------------------------------ */
/*  UI wiring                                                          */
/* ------------------------------------------------------------------ */
$('startBtn').addEventListener('click', beginCountdown);
$('newStage').addEventListener('click', scoutNewStage);
$('menuBtn').addEventListener('click', returnToMenu);
$('resultRestart').addEventListener('click', () => {
  resetStage({ countdownNow: true });
});
$('resultNew').addEventListener('click', scoutNewStage);

const mapPicker = createMapPicker({
  getTerrain: () => terrain,
  onSave: () => describeRoute(),
  onLoad: (described) => applyDescribedRoute(described, { from: 'saved' }),
  onShare: () => currentShareUrl(),
  onSharePosition: () => currentPositionUrl(),
  onFreeDrive: async ({ a }) => {
    try {
      await enterFreeDrive(a);
      return { ok: true, message: 'Free drive ready.' };
    } catch (error) {
      log.warn(`free drive failed: ${error.message}`);
      return { ok: false, message: error.message };
    }
  },
  onRoute: async ({ a, b, profile }) => {
    const started = performance.now();
    if (profile === 'offroad') {
      // Let the status line paint before the synchronous A* run.
      await new Promise((resolve) => setTimeout(resolve, 30));
      const next = offroadRoute(a, b);
      return { ok: true, message: `Off-road stage: ${(next.length / 1000).toFixed(2)} km.` };
    }
    try {
      // Phase 1: segment long straight lines into ~4 km OSRM hops and merge
      // them into one master track before the world is planned around it.
      const geometry = await fetchOsrmGeometrySegmented({ a, b, profile });
      lastOsrmProfile = profile;
      log.info(
        `2D map OSRM geometry in ${(performance.now() - started).toFixed(0)} ms `
        + `(${geometry.distance.toFixed(0)} m, ${geometry.coordinates.length} points`
        + `${geometry.segmented ? `, ${geometry.segmented.hops} segments` : ''})`,
      );
      const { result, generated } = await applyRouteGeometry(geometry);
      const snap = result.snapped?.a != null
        ? ` · snap ${Math.round(result.snapped.a)} m / ${Math.round(result.snapped.b)} m`
        : '';
      return {
        ok: true,
        message: `OSRM: ${(result.distance / 1000).toFixed(2)} km, ${Math.round(result.duration / 60)} min${snap}.`
          + (generated ? ' Streamed world ready.' : ''),
      };
    } catch (error) {
      log.warn(`2D map route failed: ${error.message}`);
      return { ok: false, message: error.message };
    }
  },
});

/** "Local cache: 1.2 GB of 10 GB · 843 entries" on the start screen. */
async function refreshCacheInfo() {
  const el = $('cacheInfo');
  if (!el) return;
  try {
    const s = await cache.stats();
    const gb = (b) => (b >= 1024 ** 3 ? `${(b / 1024 ** 3).toFixed(2)} GB` : `${(b / 1048576).toFixed(0)} MB`);
    el.textContent = `Local cache: ${gb(s.bytes)} of ${gb(s.budget)} · ${s.entries} entries`;
  } catch {
    el.textContent = 'Local cache: unavailable';
  }
}
requestPersistence();
refreshCacheInfo();
window.addEventListener('focus', refreshCacheInfo);
$('cacheClear').addEventListener('click', async () => {
  await cache.clear();
  refreshCacheInfo();
  toast('Local cache cleared.');
});

$('gearboxBtn').addEventListener('click', () => setGearbox(!gearboxAuto));
$('carBtn').addEventListener('click', () => setCarKind(carKind === 'porsche' ? 'buggy' : 'porsche'));
$('friendsBtn').addEventListener('click', () => {
  $('friendsName').value = myCallsign;
  $('friendsPanel').classList.remove('hidden');
});
$('friendsClose').addEventListener('click', () => $('friendsPanel').classList.add('hidden'));
$('friendsDrive').addEventListener('click', () => $('friendsPanel').classList.add('hidden'));
$('friendsName').addEventListener('change', () => {
  myCallsign = $('friendsName').value.trim().slice(0, 14) || myCallsign;
  try { localStorage.setItem('rally.callsign', myCallsign); } catch { /* private mode */ }
  if (session) session.name = myCallsign;
});
$('friendsHost').addEventListener('click', hostRoom);
$('friendsJoin').addEventListener('click', () => joinRoom($('friendsCode').value));
$('friendsCode').addEventListener('keydown', (e) => { if (e.key === 'Enter') joinRoom($('friendsCode').value); });
$('friendsLeave').addEventListener('click', () => { leaveRoom(); friendsStatus('Left the room.'); });
$('slideBtn').addEventListener('click', () => setSlideMode((SLIDE_LEVELS.indexOf(slideMode) + 1) % SLIDE_LEVELS.length));
setSlideMode(slideMode, { announce: false });
setCarKind(carKind, { announce: false });
document.querySelector('#stageInfo .panel-title').addEventListener('click', () => {
  const hud = $('hud');
  if (!compactMedia.matches) return;
  hud.classList.toggle('compact');
});
setGearbox(gearboxAuto, { announce: false });

/** A link that rebuilds the current drive for someone else, or null when there is nothing to share. */
function currentShareUrl() {
  const described = describeRoute();
  if (!described) return null;
  if (described.kind === 'baked' && route && terrain && !terrain.streaming) {
    // Demo mountain: share the endpoints; the other side runs the same A* router.
    return shareUrl({ kind: 'demo', a: terrain.latLonFromWorld(route.start.x, route.start.z), b: terrain.latLonFromWorld(route.finish.x, route.finish.z) });
  }
  return shareUrl(described, { profile: lastOsrmProfile });
}

/** A link that starts a free drive where the car stands now, or null before a drive. */
function currentPositionUrl() {
  if (!car || !terrain?.latLonFromWorld) return null;
  return shareUrl({ kind: 'free', center: terrain.latLonFromWorld(car.pos.x, car.pos.z) });
}

/** HUD share buttons: copy the link and say so in a toast. */
async function shareFromHud(getUrl, missing) {
  const url = getUrl();
  if (!url) {
    toast(missing, 'error');
    return;
  }
  const copied = await copyText(url);
  toast(copied ? 'Link copied to the clipboard.' : `Share this link: ${url}`);
  log.info(`share link ${url}`);
}
document.getElementById('shareRouteBtn')?.addEventListener('click', () => shareFromHud(currentShareUrl, 'Nothing to share yet: drive a stage or free drive first.'));
document.getElementById('sharePositionBtn')?.addEventListener('click', () => shareFromHud(currentPositionUrl, 'No position yet: start a drive first.'));

/** `?route=…` / `?drive=…` in the address: drive what the link describes once the world is up. */
async function applySharedLink() {
  const shared = parseShare(location.search);
  if (!shared || !terrain) return;
  try {
    if (shared.kind === 'free') {
      await enterFreeDrive(shared.center);
    } else if (shared.kind === 'osrm') {
      lastOsrmProfile = shared.profile;
      const geometry = await fetchOsrmGeometrySegmented({ a: shared.a, b: shared.b, profile: shared.profile });
      await applyRouteGeometry(geometry);
    } else if (shared.kind === 'demo') {
      offroadRoute(shared.a, shared.b);
    }
    toast('Shared drive loaded. Click START ENGINE or press Enter.');
  } catch (error) {
    toast(`The shared link could not be loaded: ${error.message}`, 'error');
  }
}

/** What the map should show of the current drive: the stage line and the car. */
function currentForMap() {
  const stage = route && !freeDrive && route.samples?.length > 1
    ? route.samples.filter((_, i) => i % 3 === 0 || i === route.samples.length - 1).map((p) => terrain.latLonFromWorld(p.x, p.z))
    : null;
  const car_ = car ? terrain.latLonFromWorld(car.pos.x, car.pos.z) : null;
  return { stage, car: car_ };
}

// The minimap is the way into the route picker: click it to open the 2D map.
mm.addEventListener('click', () => {
  if (!loaded || !terrain) {
    toast('The mountain is still loading.', 'error');
    return;
  }
  mapPicker.open(terrain, route, currentForMap());
});
mm.title = 'Click to open the map and pick a route';

/* ------------------------------------------------------------------ */
/*  Debug overlay + performance watchdog                               */
/* ------------------------------------------------------------------ */
let qualityReduced = false;

function reduceQuality(fps) {
  if (qualityReduced) return;
  qualityReduced = true;
  log.warn(`reducing quality after ${fps?.toFixed?.(1) ?? '?'} fps: lower render scale, smaller shadow map`);
  retro.setPixelScale(0.34);
  sun.shadow.mapSize.set(1024, 1024);
  if (sun.shadow.map) {
    sun.shadow.map.dispose();
    sun.shadow.map = null;
  }
  renderer.setPixelRatio(0.8);
  resize();
  toast('Low frame rate detected — reduced detail so the stage stays playable.', 'error');
}

const perf = new PerfMonitor({ lowFps: 24, onLowFps: reduceQuality });

const debugPanel = document.createElement('pre');
debugPanel.id = 'debugPanel';
debugPanel.className = 'hidden';
debugPanel.setAttribute('aria-live', 'off');
document.body.appendChild(debugPanel);

const debugParam = (new URLSearchParams(location.search).get('debug') || '').toLowerCase();
let debugVisible = debugParam === '1' || debugParam === 'true' || debugParam === 'on';
if (debugVisible) debugPanel.classList.remove('hidden');
let debugNext = 0;

// Phones have no F10: three quick taps on the speedometer open the window
// (and ?debug=1 in the address opens it from the start).
let speedTaps = [];
$('speedBox').addEventListener('pointerdown', () => {
  const now = performance.now();
  speedTaps = speedTaps.filter((t) => now - t < 900);
  speedTaps.push(now);
  if (speedTaps.length >= 3) {
    speedTaps = [];
    toggleDebug();
  }
});

function toggleDebug() {
  debugVisible = !debugVisible;
  debugPanel.classList.toggle('hidden', !debugVisible);
  log.info(`debug overlay ${debugVisible ? 'on' : 'off'}`);
}

function updateDebug(now) {
  if (!debugVisible || now < debugNext) return;
  debugNext = now + 500;
  const drawn = renderer.info.render;
  const lodStats = terrainMesh?.userData.stats?.() ?? {};
  const streamStats = terrain?.streaming ? terrain.stats() : null;
  const memory = performance.memory
    ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(0)} / ${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(0)} MB`
    : 'n/a';
  const carLine = car
    ? `${(car.speed * 3.6).toFixed(0)} km/h  gear ${car.gear === 0 ? 'R' : car.gear}${car.autoShift ? ' (auto)' : ' (manual)'}  ${Math.round(car.rpm)} rpm  ${car.grounded ? 'ground' : 'AIR'}  ${car.onRoad ? 'road' : 'gravel'}`
    : 'not loaded';
  const pos = car ? `${car.pos.x.toFixed(0)}, ${car.pos.y.toFixed(1)}, ${car.pos.z.toFixed(0)}` : '—';
  const worldLine = streamStats
    ? `stream     ${streamStats.ready} chunks ready · ${streamStats.loading} loading · ${streamStats.queued} queued · ${streamStats.triangles.toLocaleString()} tris · ${streamStats.trees} trees · ${streamStats.houses} houses · 1 m tiles ${streamStats.fine?.ready ?? 0} (${streamStats.fine?.loading ?? 0} loading, ${Math.round((streamStats.fine?.triangles || 0) / 1000)}k tris)`
    : `terrain    ${lodStats.chunks ?? 0} chunks  ${(lodStats.triangles ?? 0).toLocaleString()} tris  LOD ${JSON.stringify(lodStats.levels ?? {})}`;
  // Where exactly: lat/lon, altitude, heading, and what the ground is doing.
  let whereLine = 'where      —';
  let groundLine = '';
  if (car && terrain) {
    const ll = terrain.latLonFromWorld(car.pos.x, car.pos.z);
    const heading = ((Math.atan2(car.forward().x, car.forward().z) * 180) / Math.PI + 360) % 360;
    whereLine = `where      ${ll.lat.toFixed(5)}°N ${ll.lon.toFixed(5)}°E   alt ${car.pos.y.toFixed(1)} m   heading ${heading.toFixed(0)}°   world ${pos}`;
    const q = car.roadQuery;
    const fineHere = terrain.fine ? terrain.fine.sample(car.pos.x, car.pos.z) : null;
    groundLine = `ground     ${fineHere != null ? '1 m tile' : 'chunk grid'}   road ${q && Number.isFinite(q.distance) ? `${q.distance.toFixed(1)} m off centre, ${q.surface || '?'}, ${q.cut ? `${q.cut * 2} m cut-through` : ''}` : 'none'}   water ${car.waterDepth.toFixed(2)} m   slope ${(Math.atan(terrain.slope(car.pos.x, car.pos.z)) * 180 / Math.PI).toFixed(0)}°`;
  }
  debugPanel.textContent = [
    `RETRO NORWAY RALLY · debug (F10 / F3)`,
    `fps        ${perf.fps.toFixed(1)}   frame ${perf.frameMs.toFixed(1)} ms   worst ${perf.worstMs.toFixed(0)} ms   long ${perf.longFrames}`,
    `draw calls ${drawn.calls}   tris ${drawn.triangles.toLocaleString()}   points ${drawn.points}`,
    worldLine,
    whereLine,
    groundLine,
    `car        ${carLine}`,
    `phase      ${phase}   room ${session ? `${session.code} (${session.playerCount})` : 'none'}`,
    `memory     ${memory}   quality ${qualityReduced ? 'reduced' : 'full'}`,
  ].filter(Boolean).join('\n');
}

/* ------------------------------------------------------------------ */
/*  Main loop                                                          */
/* ------------------------------------------------------------------ */
let last = performance.now();
function frame(now) {
  perf.begin(now);
  const dt = Math.min(0.05, Math.max(0.0001, (now - last) / 1000));
  last = now;
  time += dt;

  readInput();
  let carState = null;
  if (car && loaded) {
    const active = phase === 'racing' || phase === 'finished';
    const frozen = phase === 'countdown' || phase === 'intro';
    const effective = frozen
      ? { throttle: 0, brake: 0, steer: 0, handbrake: false, jump: false, frozen: true }
      : input;
    carState = car.update(dt, effective);
    if (carState.splash) audio.splash(carState.splash);
    if (carState.crash > 3) audio.thud(Math.min(1, carState.crash / 20));
    if (carState.recovered) toast('Fished out of the water and put back on dry land.');
    if (!tracks || tracks.car !== car) {
      tracks?.dispose();
      tracks = new TrackMarks(scene, car);
    }
    tracks.update(car);

    if (phase === 'racing' && car) {
      const dx = car.pos.x - route.finish.x;
      const dz = car.pos.z - route.finish.z;
      const distFinish = Math.hypot(dx, dz);
      if (!freeDrive && car.progress > 0.94 && distFinish < 13) finishStage();
    }
    if (phase === 'finished') {
      car.vel.multiplyScalar(Math.exp(-2.2 * dt));
    }
    updateHud();
    if (session) session.sendState(encodeState(car, { name: myCallsign, kind: carKind }), now);
    audio.update({
      speed: car.speed,
      throttle: phase === 'racing' ? input.throttle : 0,
      onRoad: car.onRoad,
      drifting: car.drifting,
      running: phase === 'racing' || phase === 'countdown',
      waterDepth: car.waterDepth,
    });
  }

  if (loaded) {
    updateGhosts(now, dt);
    updateGamePhase(dt);
    updateWorld(dt);
    if (car) updateTerrainLOD(car.pos.x, car.pos.z);
    else updateTerrainLOD(camera.position.x, camera.position.z);
    updateCamera(dt);
    drawMinimap();
  }

  retro.render(scene, camera, time);
  perf.sample(now);
  updateDebug(now);
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
  openMap: () => mapPicker.open(terrain, route, currentForMap()),
  freeDrive: (lat, lon) => enterFreeDrive({ lat, lon }),
  setCar: (kind) => setCarKind(kind),
  hostRoom,
  joinRoom,
  leaveRoom,
  get session() { return session; },
  setSlide: (mode) => setSlideMode(mode),
  shareUrl: () => currentShareUrl(),
  positionUrl: () => currentPositionUrl(),
  mapPicker,
  cache,
  toggleDebug,
  dumpLog,
  perf,
  renderer,
  terrainStats: () => terrainMesh?.userData.stats?.(),
  generateRoute: (a, b, options) => generateRallyRoute(terrain, a, b, options),
  fetchOsrm: async (options) => {
    const geometry = await fetchOsrmGeometry(options);
    return buildOsrmRoute(terrain, geometry);
  },
  /** Drive an OSRM geometry, generating a world around it if needed. */
  driveGeometry: (geometry) => applyRouteGeometry(geometry),
  /** Fetch an OSRM master track (segmented for long routes) and drive it. */
  driveRoute: async (a, b, profile = 'driving') => {
    const geometry = await fetchOsrmGeometrySegmented({ a, b, profile });
    return applyRouteGeometry(geometry);
  },
  generateWorld: (coordinates) => generateTerrain(coordinates),
  streamStats: () => terrain?.streaming ? terrain.stats() : null,
  screenFromWorld(x, z) {
    camera.updateMatrixWorld();
    const p = new THREE.Vector3(x, terrain.sample(x, z), z).project(camera);
    return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight };
  },
};
