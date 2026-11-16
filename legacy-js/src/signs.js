import * as THREE from 'three';
import { logger } from './log.js';
import { cachedJson } from './cache.js';
import { utmForward, utmInverse } from './geo.js';

/**
 * Real Norwegian road signs from Statens vegvesen's NVDB (Nasjonal
 * vegdatabank, API Les v4). Per terrain chunk we ask for two object types:
 *
 *   96  Skiltplate   – every sign plate as a point, with its sign number
 *                      ("362.50 - Fartsgrense 50 km/t"), free text and which
 *                      way it faces
 *   105 Fartsgrense  – speed limits as polylines along the whole network
 *
 * Only the stage route exists in the 3D world, so plates are kept when they
 * stand next to it and snapped to its shoulder. Where the speed limit along
 * the route changes and NVDB has no plate for it, a 362.xx plate is made up.
 * Plates are stylised canvas textures (one per distinct sign number) on
 * instanced planes; posts share one instanced cylinder.
 *
 * Data licence: see `NVDB_ATTRIBUTION`, which must be shown in the UI.
 */

const log = logger('signs');

export const NVDB_ATTRIBUTION = 'Inneholder data under norsk lisens for offentlige data (NLOD) tilgjengeliggjort av Statens vegvesen.';

const NVDB_BASE = 'https://nvdbapiles.atlas.vegvesen.no/vegobjekter/api/v4/vegobjekter';
const NVDB_HEADERS = { 'X-Client': 'norwayralley', Accept: 'application/json' };
const TYPE_SIGN_PLATE = 96;
const TYPE_SPEED_LIMIT = 105;
const PROP_SIGN_NUMBER = 5530;
const PROP_FACING = 1894;
const PROP_TEXT = 1910;
const PROP_KMH = 2021;
const REQUEST_TIMEOUT = 20000;
const MAX_PAGES = 20;

/* ------------------------------------------------------------------ *
 *  NVDB fetch + parsing                                                *
 * ------------------------------------------------------------------ */

/**
 * Fetch sign plates and speed limits inside a lat/lon bbox. Returns
 * `{ signs, speedLimits }` (both empty when NVDB is unreachable).
 */
export async function fetchRoadSigns({ minLat, minLon, maxLat, maxLon }) {
  const corners = [[minLat, minLon], [minLat, maxLon], [maxLat, minLon], [maxLat, maxLon]]
    .map(([lat, lon]) => utmForward(lat, lon));
  const es = corners.map((c) => c.x);
  const ns = corners.map((c) => c.y);
  const kartutsnitt = [Math.min(...es), Math.min(...ns), Math.max(...es), Math.max(...ns)]
    .map((v) => v.toFixed(1)).join(',');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const [plates, limits] = await Promise.all([
      fetchObjects(TYPE_SIGN_PLATE, kartutsnitt, controller.signal),
      fetchObjects(TYPE_SPEED_LIMIT, kartutsnitt, controller.signal),
    ]);
    return {
      signs: plates.map(parseSignPlate).filter(Boolean),
      speedLimits: limits.map(parseSpeedLimit).filter(Boolean),
    };
  } catch (error) {
    log.warn(`road signs unavailable: ${error.message}`);
    return { signs: [], speedLimits: [] };
  } finally {
    clearTimeout(timeout);
  }
}

/** All objects of one type in the kartutsnitt, following `metadata.neste`. */
async function fetchObjects(typeId, kartutsnitt, signal) {
  let url = `${NVDB_BASE}/${typeId}?kartutsnitt=${kartutsnitt}&srid=5973&inkluder=geometri,egenskaper,lokasjon&antall=1000`;
  const objects = [];
  for (let page = 0; page < MAX_PAGES && url; page++) {
    const data = await cachedJson(url, { headers: NVDB_HEADERS }, { kind: 'nvdb', signal });
    const batch = data.objekter || [];
    if (!batch.length) break;
    objects.push(...batch);
    url = data.metadata?.neste?.href || null;
  }
  return objects;
}

/** `POINT Z (e n h)` / `LINESTRING Z (e n h, ...)` → `{ type, points: [{e, n, h}] }`. */
export function parseWkt(wkt) {
  const m = /^\s*(POINT|LINESTRING)\s*(?:ZM|Z|M)?\s*\(\s*([^()]*?)\s*\)\s*$/i.exec(wkt || '');
  if (!m) return null;
  const points = m[2].split(',').map((tuple) => {
    const [e, n, h] = tuple.trim().split(/\s+/).map(Number);
    return { e, n, h: Number.isFinite(h) ? h : null };
  }).filter((p) => Number.isFinite(p.e) && Number.isFinite(p.n));
  return points.length ? { type: m[1].toUpperCase(), points } : null;
}

/** "362.50 - Fartsgrense 50 km/t" → "362.50"; "729" → "729". */
export function signNumberFromVerdi(verdi) {
  const m = /^\s*(\d+(?:\.\d+)?)/.exec(verdi || '');
  return m ? m[1] : null;
}

function property(obj, id) {
  return obj.egenskaper?.find((e) => e.id === id)?.verdi ?? null;
}

function facingFor(verdi) {
  const v = (verdi || '').toLowerCase();
  if (v.startsWith('tosidig')) return 'both';
  if (v.includes('trafikk mot')) return 'against';
  if (v.includes('trafikk i')) return 'with';
  return null;
}

function parseSignPlate(obj) {
  const verdi = property(obj, PROP_SIGN_NUMBER);
  const number = signNumberFromVerdi(verdi);
  const geometry = parseWkt(obj.geometri?.wkt);
  if (!number || geometry?.type !== 'POINT') return null;
  const [p] = geometry.points;
  const { lat, lon } = utmInverse(p.e, p.n);
  const sidePos = obj.lokasjon?.stedfestinger?.[0]?.sideposisjon;
  return {
    id: obj.id,
    number,
    label: verdi.replace(/^\s*[\d.]+\s*[-–]?\s*/, '').trim() || null,
    text: property(obj, PROP_TEXT) || null,
    facing: facingFor(property(obj, PROP_FACING)),
    side: sidePos === 'V' ? 'left' : sidePos === 'H' ? 'right' : null,
    lat,
    lon,
    height: p.h,
  };
}

function parseSpeedLimit(obj) {
  const kmh = Number(property(obj, PROP_KMH));
  const geometry = parseWkt(obj.geometri?.wkt);
  if (!Number.isFinite(kmh) || !geometry || geometry.points.length < 2) return null;
  return { kmh, points: geometry.points.map((p) => utmInverse(p.e, p.n)) };
}

/* ------------------------------------------------------------------ *
 *  Sign plate textures                                                 *
 * ------------------------------------------------------------------ */

const SIZE = 256;
const C = SIZE / 2;
const RED = '#c8102e';
const BLUE = '#0b5ba5';
const WHITE = '#f4f4f0';
const BLACK = '#141414';
const GREY = '#a9a9a6';
const YELLOW = '#f2b705';
const FONT = 'Arial, Helvetica, sans-serif';

const textureCache = new Map();
const materialCache = new Map();

/** Cached stylised plate texture for a Norwegian sign number (transparent outside the plate). */
export function makeSignTexture(number, { text = null } = {}) {
  const key = text ? `${number}|${text}` : String(number);
  let tex = textureCache.get(key);
  if (tex) return tex;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  drawSign(ctx, String(number), text);
  tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  textureCache.set(key, tex);
  return tex;
}

function drawSign(ctx, number, text) {
  const [family, sub = ''] = number.split('.');
  const code = Number(family);
  if (code === 362 || code === 366) return speedLimitSign(ctx, sub);
  if (code === 364 || code === 368) return endSpeedLimitSign(ctx, sub);
  if (code >= 100 && code < 200) return warningSign(ctx, code, sub);
  switch (code) {
    case 202: return yieldSign(ctx);
    case 204: return stopSign(ctx);
    case 302: return noEntrySign(ctx);
    case 306: return prohibitionSign(ctx, sub);
    case 312: case 314: case 316: return limitSign(ctx, text || { 312: '2,5 m', 314: '3,5 m', 316: '12 m' }[code]);
    case 318: case 320: return limitSign(ctx, text || { 318: '12 t', 320: '8 t' }[code]);
    case 334: return noOvertakingSign(ctx);
    case 406: return roundaboutSign(ctx);
    case 516: return crossingSign(ctx);
    case 552: return parkingSign(ctx);
    case 729: return roadNameSign(ctx, text || number);
    case 902: case 904: return chevronSign(ctx, /v/i.test(sub));
    default: return genericSign(ctx, number, text);
  }
}

// ---- drawing helpers -------------------------------------------------

function disc(ctx, fill, ring = null, ringWidth = 30) {
  ctx.beginPath();
  ctx.arc(C, C, 120, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (ring) {
    ctx.beginPath();
    ctx.arc(C, C, 120 - ringWidth / 2, 0, Math.PI * 2);
    ctx.lineWidth = ringWidth;
    ctx.strokeStyle = ring;
    ctx.stroke();
  }
}

function polygon(ctx, pts, fill) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function stroke(ctx, pts, width = 14, color = BLACK) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.stroke();
}

function arrow(ctx, pts, width = 14, color = BLACK) {
  stroke(ctx, pts, width, color);
  const [ax, ay] = pts[pts.length - 2];
  const [bx, by] = pts[pts.length - 1];
  const l = Math.hypot(bx - ax, by - ay) || 1;
  const dx = (bx - ax) / l; const dy = (by - ay) / l;
  const head = 1.9 * width;
  polygon(ctx, [
    [bx + dx * head * 0.6, by + dy * head * 0.6],
    [bx - dx * head - dy * head * 0.8, by - dy * head + dx * head * 0.8],
    [bx - dx * head + dy * head * 0.8, by - dy * head - dx * head * 0.8],
  ], color);
}

function label(ctx, str, x, y, px, color = BLACK, maxWidth = 200) {
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${px}px ${FONT}`;
  const w = ctx.measureText?.(str)?.width ?? 100;
  if (w > maxWidth) ctx.font = `bold ${Math.floor(px * maxWidth / w)}px ${FONT}`;
  ctx.fillText(str, x, y);
}

function rounded(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function mirrored(ctx, draw) {
  ctx.save();
  ctx.translate(SIZE, 0);
  ctx.scale(-1, 1);
  draw();
  ctx.restore();
}

/** Red-bordered triangle; `up` is the warning shape, inverted is yield. */
function triangle(ctx, up) {
  const outer = up ? [[128, 14], [12, 228], [244, 228]] : [[128, 238], [12, 24], [244, 24]];
  const cy = up ? 158 : 94;
  polygon(ctx, outer, RED);
  polygon(ctx, outer.map(([x, y]) => [128 + (x - 128) * 0.7, cy + (y - cy) * 0.7]), WHITE);
}

/** Stick figure: head at (x, y), scale s. */
function figure(ctx, x, y, s = 1, walking = true) {
  ctx.beginPath();
  ctx.arc(x, y, 10 * s, 0, Math.PI * 2);
  ctx.fillStyle = BLACK;
  ctx.fill();
  stroke(ctx, [[x, y + 12 * s], [x - 4 * s, y + 46 * s]], 11 * s);
  if (walking) {
    stroke(ctx, [[x - 4 * s, y + 46 * s], [x - 22 * s, y + 80 * s]], 9 * s);
    stroke(ctx, [[x - 4 * s, y + 46 * s], [x + 16 * s, y + 66 * s], [x + 12 * s, y + 84 * s]], 9 * s);
    stroke(ctx, [[x - 2 * s, y + 20 * s], [x + 18 * s, y + 38 * s]], 8 * s);
    stroke(ctx, [[x - 2 * s, y + 20 * s], [x - 20 * s, y + 34 * s]], 8 * s);
  } else {
    stroke(ctx, [[x - 4 * s, y + 46 * s], [x - 12 * s, y + 84 * s]], 9 * s);
    stroke(ctx, [[x - 4 * s, y + 46 * s], [x + 8 * s, y + 84 * s]], 9 * s);
  }
}

/** Side-view car (or truck) silhouette with its wheels on the ground line y. */
function vehicle(ctx, x, y, truck = false, color = BLACK) {
  if (truck) {
    rounded(ctx, x - 56, y - 70, 76, 54, 4, color);
    rounded(ctx, x + 20, y - 46, 36, 30, 6, color);
  } else {
    rounded(ctx, x - 50, y - 36, 100, 28, 8, color);
    rounded(ctx, x - 26, y - 58, 54, 26, 8, color);
  }
  for (const wx of [x - 30, x + 30]) {
    ctx.beginPath();
    ctx.arc(wx, y - 6, 12, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

/** Front-view car for 334 (two abreast). */
function carFront(ctx, x, color) {
  rounded(ctx, x - 24, 120, 48, 46, 6, color);
  rounded(ctx, x - 16, 100, 32, 24, 6, color);
  ctx.fillStyle = color;
  ctx.fillRect(x - 24, 164, 10, 10);
  ctx.fillRect(x + 14, 164, 10, 10);
}

function ringArrows(ctx, cx, cy, r, color) {
  for (let k = 0; k < 3; k++) {
    const a0 = k * 2 * Math.PI / 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a0 + 1.6);
    ctx.lineWidth = 12;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = color;
    ctx.stroke();
    const a1 = a0 + 1.6;
    const tx = cx + Math.cos(a1) * r; const ty = cy + Math.sin(a1) * r;
    const dx = -Math.sin(a1); const dy = Math.cos(a1);
    polygon(ctx, [
      [tx + dx * 16, ty + dy * 16],
      [tx - dx * 4 + Math.cos(a1) * 14, ty - dy * 4 + Math.sin(a1) * 14],
      [tx - dx * 4 - Math.cos(a1) * 14, ty - dy * 4 - Math.sin(a1) * 14],
    ], color);
  }
}

// ---- sign families ---------------------------------------------------

function speedLimitSign(ctx, kmh) {
  disc(ctx, WHITE, RED, 32);
  label(ctx, kmh || '?', C, C + 4, kmh.length > 2 ? 96 : 120, BLACK, 150);
}

function endSpeedLimitSign(ctx, kmh) {
  disc(ctx, WHITE, GREY, 10);
  label(ctx, kmh || '', C, C + 4, 110, GREY, 150);
  for (let i = -2; i <= 2; i++) stroke(ctx, [[60 + i * 20, 200], [196 + i * 20, 56]], 5, BLACK);
}

function warningSign(ctx, code, sub) {
  triangle(ctx, true);
  const left = /^2/.test(sub);
  const draw = () => {
    switch (code) {
      case 100: return arrow(ctx, [[118, 206], [118, 152], [152, 124]]);
      case 102: return arrow(ctx, [[108, 206], [108, 172], [148, 152], [148, 118]]);
      case 104:
        polygon(ctx, [[84, 202], [182, 202], [182, 128]], BLACK);
        return label(ctx, '10%', 110, 172, 28, BLACK, 60);
      case 106:
        stroke(ctx, [[94, 206], [94, 166], [110, 136], [110, 108]], 12);
        return stroke(ctx, [[162, 206], [162, 166], [146, 136], [146, 108]], 12);
      case 108:
      case 109: {
        ctx.beginPath();
        ctx.moveTo(66, 206);
        ctx.lineTo(66, 192);
        if (code === 108) {
          ctx.arc(98, 192, 22, Math.PI, 0, false);
          ctx.arc(158, 192, 22, Math.PI, 0, false);
        } else {
          ctx.arc(128, 192, 44, Math.PI, 0, false);
        }
        ctx.lineTo(190, 192);
        ctx.lineTo(190, 206);
        ctx.closePath();
        ctx.fillStyle = BLACK;
        return ctx.fill();
      }
      case 110:
        figure(ctx, 130, 112, 1, false);
        stroke(ctx, [[116, 146], [168, 196]], 8);
        ctx.beginPath();
        ctx.arc(172, 206, 22, Math.PI, 0, false);
        ctx.fillStyle = BLACK;
        return ctx.fill();
      case 112:
        vehicle(ctx, 104, 206);
        for (const [x, y] of [[164, 150], [184, 172], [170, 190], [190, 202]]) {
          ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = BLACK; ctx.fill();
        }
        return;
      case 114:
        polygon(ctx, [[160, 104], [198, 206], [150, 206]], BLACK);
        for (const [x, y] of [[122, 136], [104, 162], [128, 172], [110, 194]]) {
          ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fillStyle = BLACK; ctx.fill();
        }
        return;
      case 116:
        rounded(ctx, 106, 112, 44, 18, 6, BLACK);
        for (const x0 of [84, 136]) {
          ctx.beginPath();
          ctx.moveTo(x0, 150);
          ctx.quadraticCurveTo(x0 - 14, 168, x0, 182);
          ctx.quadraticCurveTo(x0 + 14, 196, x0, 206);
          ctx.lineWidth = 9; ctx.strokeStyle = BLACK; ctx.lineCap = 'round'; ctx.stroke();
        }
        return;
      case 124:
        stroke(ctx, [[128, 108], [128, 206]], 14);
        return stroke(ctx, [[92, 150], [164, 150]], 14);
      case 126: return ringArrows(ctx, 128, 160, 30, BLACK);
      case 132:
        rounded(ctx, 106, 98, 44, 108, 8, BLACK);
        for (const [y, c] of [[118, RED], [152, YELLOW], [186, '#1c9b3c']]) {
          ctx.beginPath(); ctx.arc(128, y, 13, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
        }
        return;
      case 142:
        figure(ctx, 108, 136, 0.8);
        return figure(ctx, 148, 118, 1.05);
      case 144:
        for (const x of [104, 154]) {
          ctx.beginPath(); ctx.arc(x, 186, 20, 0, Math.PI * 2); ctx.lineWidth = 8; ctx.strokeStyle = BLACK; ctx.stroke();
        }
        stroke(ctx, [[104, 186], [124, 150], [154, 186], [124, 150], [140, 150], [154, 186]], 7);
        ctx.beginPath(); ctx.arc(132, 124, 9, 0, Math.PI * 2); ctx.fillStyle = BLACK; ctx.fill();
        return stroke(ctx, [[130, 134], [122, 152], [118, 170]], 8);
      case 146:
        return polygon(ctx, sub === '1'
          ? [[82, 150], [96, 138], [104, 120], [112, 136], [120, 116], [122, 140], [150, 142], [176, 146], [178, 170],
            [176, 206], [168, 206], [166, 172], [150, 172], [132, 172], [130, 206], [122, 206], [120, 170], [106, 166], [98, 170]]
          : [[86, 150], [96, 138], [100, 120], [106, 138], [124, 142], [154, 142], [176, 148], [178, 206], [168, 206],
            [166, 174], [136, 174], [134, 206], [124, 206], [122, 172], [108, 168], [98, 172], [86, 160]], BLACK);
      case 148:
        stroke(ctx, [[128, 110], [128, 202]], 12);
        stroke(ctx, [[84, 158], [172, 158]], 10);
        return stroke(ctx, [[112, 194], [144, 194]], 8);
      case 150:
        arrow(ctx, [[112, 206], [112, 116]], 12);
        return arrow(ctx, [[146, 114], [146, 204]], 12, RED);
      case 152:
        for (const y of [132, 162, 192]) rounded(ctx, 98, y - 18, 60, 20, 5, BLACK);
        return;
      default: return label(ctx, '!', C, 166, 110);
    }
  };
  if (left && (code === 100 || code === 102)) mirrored(ctx, draw);
  else draw();
}

function yieldSign(ctx) {
  triangle(ctx, false);
}

function stopSign(ctx) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + i * Math.PI / 4;
    pts.push([C + Math.cos(a) * 124, C + Math.sin(a) * 124]);
  }
  polygon(ctx, pts, WHITE);
  polygon(ctx, pts.map(([x, y]) => [C + (x - C) * 0.93, C + (y - C) * 0.93]), RED);
  label(ctx, 'STOP', C, C + 4, 74, WHITE, 190);
}

function noEntrySign(ctx) {
  disc(ctx, RED);
  ctx.fillStyle = WHITE;
  ctx.fillRect(48, 110, 160, 36);
}

function prohibitionSign(ctx, sub) {
  disc(ctx, WHITE, RED, 26);
  vehicle(ctx, 128, 182, sub === '5');
  stroke(ctx, [[62, 62], [194, 194]], 18, RED);
}

function limitSign(ctx, text) {
  disc(ctx, WHITE, RED, 26);
  label(ctx, text, C, C + 4, 72, BLACK, 150);
}

function noOvertakingSign(ctx) {
  disc(ctx, WHITE, RED, 26);
  carFront(ctx, 94, RED);
  carFront(ctx, 162, BLACK);
}

function roundaboutSign(ctx) {
  disc(ctx, BLUE);
  ringArrows(ctx, C, C, 56, WHITE);
}

function crossingSign(ctx) {
  rounded(ctx, 8, 8, 240, 240, 14, BLUE);
  polygon(ctx, [[128, 36], [30, 206], [226, 206]], WHITE);
  figure(ctx, 132, 108, 1.05);
}

function parkingSign(ctx) {
  rounded(ctx, 8, 8, 240, 240, 14, BLUE);
  label(ctx, 'P', C, C + 8, 170, WHITE);
}

/** 729 plates are 1.4 × 0.45 m: draw stretched so text looks right on the plate. */
function roadNameSign(ctx, text) {
  const aspect = 1.4 / 0.45;
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.scale(1, aspect);
  const h = SIZE / aspect;
  label(ctx, text, C, h / 2 + 1, h * 0.62, WHITE, SIZE - 20);
  ctx.restore();
}

function chevronSign(ctx, left) {
  rounded(ctx, 8, 8, 240, 240, 10, BLACK);
  const draw = () => polygon(ctx, [[66, 56], [128, 56], [196, 128], [128, 200], [66, 200], [134, 128]], YELLOW);
  if (left) mirrored(ctx, draw);
  else draw();
}

function genericSign(ctx, number, text) {
  rounded(ctx, 10, 10, 236, 236, 12, '#55585c');
  rounded(ctx, 22, 22, 212, 212, 8, WHITE);
  label(ctx, number, C, text ? 104 : C + 4, 44, BLACK, 190);
  if (text) label(ctx, text, C, 156, 30, BLACK, 190);
}

/* ------------------------------------------------------------------ *
 *  Speed-limit changes along the route                                 *
 * ------------------------------------------------------------------ */

const SPEED_MATCH_DISTANCE = 12;

function segmentDistance2(x, z, a, b) {
  const dx = b.x - a.x; const dz = b.z - a.z;
  const l2 = dx * dx + dz * dz;
  const t = l2 < 1e-9 ? 0 : Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2));
  const px = a.x + dx * t - x; const pz = a.z + dz * t - z;
  return px * px + pz * pz;
}

/**
 * Where the speed limit changes along the route: `[{ index, kmh, x, z }]`,
 * `index` being the first route sample with the new limit. Samples with no
 * speed-limit polyline within 12 m are unknown and skipped; a new limit has
 * to hold for the next two known samples so a crossing side road does not
 * flicker a sign in.
 */
export function speedChanges(routeSamples, speedLimits, terrain) {
  const R = SPEED_MATCH_DISTANCE;
  const lines = speedLimits.map((limit) => {
    const pts = limit.points.map((p) => terrain.worldFromLatLon(p.lat, p.lon));
    const xs = pts.map((p) => p.x); const zs = pts.map((p) => p.z);
    return {
      kmh: limit.kmh, pts,
      minX: Math.min(...xs) - R, maxX: Math.max(...xs) + R, minZ: Math.min(...zs) - R, maxZ: Math.max(...zs) + R,
    };
  });
  const limitAt = (x, z) => {
    let best = R * R; let kmh = null;
    for (const line of lines) {
      if (x < line.minX || x > line.maxX || z < line.minZ || z > line.maxZ) continue;
      for (let i = 1; i < line.pts.length; i++) {
        const d2 = segmentDistance2(x, z, line.pts[i - 1], line.pts[i]);
        if (d2 < best) { best = d2; kmh = line.kmh; }
      }
    }
    return kmh;
  };
  const kmhs = routeSamples.map((s) => limitAt(s.x, s.z));
  const changes = [];
  let current = null;
  for (let i = 0; i < kmhs.length; i++) {
    const kmh = kmhs[i];
    if (kmh == null) continue;
    if (current != null && kmh !== current) {
      const ahead = [];
      for (let j = i + 1; j < kmhs.length && ahead.length < 2; j++) if (kmhs[j] != null) ahead.push(kmhs[j]);
      if (ahead.length < 2 || ahead.some((k) => k !== kmh)) continue;
      changes.push({ index: i, kmh, x: routeSamples[i].x, z: routeSamples[i].z });
    }
    current = kmh;
  }
  return changes;
}

/* ------------------------------------------------------------------ *
 *  Chunk geometry                                                      *
 * ------------------------------------------------------------------ */

const CORRIDOR_MARGIN = 9;
const SHOULDER = 1.6;
const POST_HEIGHT = 2.3;
const POST_RADIUS = 0.07;
const SPEED_SIGN_SUPPRESS = 40;

let shared = null;

function sharedGeometry() {
  if (shared) return shared;
  const post = new THREE.CylinderGeometry(POST_RADIUS, POST_RADIUS, POST_HEIGHT, 6);
  post.translate(0, POST_HEIGHT / 2, 0);
  shared = {
    post,
    plate: new THREE.PlaneGeometry(1, 1),
    postMaterial: new THREE.MeshLambertMaterial({ color: 0x9a9da0 }),
  };
  return shared;
}

function plateMaterial(key, number, text) {
  let material = materialCache.get(key);
  if (!material) {
    material = new THREE.MeshBasicMaterial({
      map: makeSignTexture(number, { text }),
      toneMapped: false,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.5,
    });
    materialCache.set(key, material);
  }
  return material;
}

/** Plate size (m) and centre height for a sign number. */
function plateShape(number) {
  const family = number.split('.')[0];
  if (family === '729') return { w: 1.4, h: 0.45, y: 2.3 };
  if (family === '204' || family === '362') return { w: 0.8, h: 0.8, y: 2.0 };
  return { w: 0.75, h: 0.75, y: 2.0 };
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
 * A plate on the road shoulder. `point`/`tangent` come from `route.nearest`;
 * `side` is +1 for the right-hand side of the travel direction. Norway drives
 * on the right, so a right-hand plate faces the traffic coming along the
 * tangent (−d) and a left-hand plate faces the other way (+d).
 */
function shoulderPlacement(id, sign, point, tangent, side, offset) {
  const rx = -tangent.z; const rz = tangent.x; // right-hand normal (x east, z south, y up)
  return {
    id,
    number: sign.number,
    text: sign.text || null,
    both: sign.facing === 'both',
    x: point.x + rx * side * offset,
    z: point.z + rz * side * offset,
    fx: -tangent.x * side,
    fz: -tangent.z * side,
  };
}

/**
 * Build the instanced sign posts and plates for one chunk, or null when no
 * sign stands next to the route.
 *
 * @param data    `{ signs, speedLimits }` from fetchRoadSigns
 * @param terrain the streaming terrain (needs worldFromLatLon/sample)
 * @param route   StageRoute (samples, roadWidth, nearest)
 */
export function buildChunkSigns({ signs = [], speedLimits = [] }, terrain, route, { seed = 1 } = {}) {
  const rand = mulberry32(seed);
  const corridor = route.roadWidth + CORRIDOR_MARGIN;
  const offset = route.roadWidth + SHOULDER;
  const placed = [];

  const sorted = signs.slice().sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
  for (const sign of sorted) {
    const w = terrain.worldFromLatLon(sign.lat, sign.lon);
    if (!Number.isFinite(w.x) || !Number.isFinite(w.z)) continue;
    const near = route.nearest(w.x, w.z);
    if (near.distance > corridor) continue;
    const d = near.tangent;
    const p = near.point;
    // Which side of the road the real plate stands on: sign of offset · right normal.
    const side = (w.x - p.x) * -d.z + (w.z - p.z) * d.x < 0 ? -1 : 1;
    placed.push(shoulderPlacement(sign.id, sign, p, d, side, offset));
  }

  for (const change of speedChanges(route.samples, speedLimits, terrain)) {
    const covered = placed.some((s) => /^36[26]\b/.test(s.number)
      && Math.hypot(s.x - change.x, s.z - change.z) < SPEED_SIGN_SUPPRESS);
    if (covered) continue;
    const near = route.nearest(change.x, change.z);
    placed.push(shoulderPlacement(`speed:${change.index}`, { number: `362.${change.kmh}` }, near.point, near.tangent, 1, offset));
  }

  if (!placed.length) return null;
  const { post, plate, postMaterial } = sharedGeometry();
  const group = new THREE.Group();
  group.name = 'signs';
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);

  const posts = new THREE.InstancedMesh(post, postMaterial, placed.length);
  posts.name = 'posts';
  posts.castShadow = true;
  const byTexture = new Map();
  placed.forEach((s, i) => {
    const h = terrain.sample(s.x, s.z);
    pos.set(s.x, h, s.z);
    q.identity();
    scl.set(1, 1, 1);
    posts.setMatrixAt(i, m.compose(pos, q, scl));

    const key = s.text ? `${s.number}|${s.text}` : s.number;
    let entry = byTexture.get(key);
    if (!entry) {
      entry = { number: s.number, text: s.text, items: [] };
      byTexture.set(key, entry);
    }
    const shape = plateShape(s.number);
    const yaw = Math.atan2(s.fx, s.fz) + (rand() - 0.5) * 0.06; // a hint of hand-mounted sloppiness
    for (const turn of s.both ? [0, Math.PI] : [0]) {
      const a = yaw + turn;
      q.setFromAxisAngle(yAxis, a);
      pos.set(s.x + Math.sin(a) * (POST_RADIUS + 0.01), h + shape.y, s.z + Math.cos(a) * (POST_RADIUS + 0.01));
      scl.set(shape.w, shape.h, 1);
      entry.items.push(m.compose(pos, q, scl).clone());
    }
  });
  posts.instanceMatrix.needsUpdate = true;
  group.add(posts);

  for (const key of [...byTexture.keys()].sort()) {
    const { number, text, items } = byTexture.get(key);
    const mesh = new THREE.InstancedMesh(plate, plateMaterial(key, number, text), items.length);
    mesh.name = `plate:${key}`;
    items.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }
  group.userData.count = placed.length;
  return group;
}
