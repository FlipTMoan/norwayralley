// Geodesy helpers for the demo terrain. Kartverket's NHM DTM is in EPSG:25833
// (ETRS89 / UTM zone 33N), so a compact transverse-Mercator implementation is
// all we need — no network and no third-party projection library.

const A = 6378137.0;
const F = 1 / 298.257222101; // GRS80
const E2 = F * (2 - F);
const EP2 = E2 / (1 - E2);
const K0 = 0.9996;
const ZONE = 33;
const LON0 = (((ZONE - 1) * 6 - 180) + 3) * Math.PI / 180;
const FALSE_EASTING = 500000;

export const DEG = Math.PI / 180;

/** WGS84/ETRS89 lat, lon (degrees) -> UTM zone 33N easting, northing (metres). */
export function utmForward(latDeg, lonDeg) {
  const phi = latDeg * DEG;
  const lam = lonDeg * DEG;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);
  const N = A / Math.sqrt(1 - E2 * sinPhi * sinPhi);
  const T = tanPhi * tanPhi;
  const C = EP2 * cosPhi * cosPhi;
  const Aa = cosPhi * (lam - LON0);
  const M = A * (
    (1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 ** 3 / 256) * phi
    - (3 * E2 / 8 + 3 * E2 * E2 / 32 + 45 * E2 ** 3 / 1024) * Math.sin(2 * phi)
    + (15 * E2 * E2 / 256 + 45 * E2 ** 3 / 1024) * Math.sin(4 * phi)
    - (35 * E2 ** 3 / 3072) * Math.sin(6 * phi)
  );
  const easting = FALSE_EASTING + K0 * N * (
    Aa
    + (1 - T + C) * Aa ** 3 / 6
    + (5 - 18 * T + T * T + 72 * C - 58 * EP2) * Aa ** 5 / 120
  );
  const northing = K0 * (
    M + N * tanPhi * (
      Aa * Aa / 2
      + (5 - T + 9 * C + 4 * C * C) * Aa ** 4 / 24
      + (61 - 58 * T + T * T + 600 * C - 330 * EP2) * Aa ** 6 / 720
    )
  );
  return { x: easting, y: northing };
}

/** UTM zone 33N easting, northing -> lat, lon in degrees. */
export function utmInverse(easting, northing) {
  const x = easting - FALSE_EASTING;
  const y = northing;
  const M = y / K0;
  const mu = M / (A * (1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  const phi1 = mu
    + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu)
    + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);
  const N1 = A / Math.sqrt(1 - E2 * sinPhi1 * sinPhi1);
  const T1 = tanPhi1 * tanPhi1;
  const C1 = EP2 * cosPhi1 * cosPhi1;
  const R1 = A * (1 - E2) / Math.pow(1 - E2 * sinPhi1 * sinPhi1, 1.5);
  const D = x / (N1 * K0);
  const lat = phi1 - (N1 * tanPhi1 / R1) * (
    D * D / 2
    - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * EP2) * D ** 4 / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * EP2 - 3 * C1 * C1) * D ** 6 / 720
  );
  const lon = LON0 + (
    D
    - (1 + 2 * T1 + C1) * D ** 3 / 6
    + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * EP2 + 24 * T1 * T1) * D ** 5 / 120
  ) / cosPhi1;
  return { lat: lat / DEG, lon: lon / DEG };
}

/**
 * A local tangent-plane projection, in metres, anchored at `lat0`/`lon0`.
 *
 * UTM zone 33N is only accurate around 15°E; Norway spans roughly 4°E to 31°E.
 * For a generated stage we only care about a few kilometres around the route,
 * so a local equirectangular projection is both accurate (< 0.1% over 10 km)
 * and trivial to invert. `x` grows east, `z` grows south — the same axis
 * convention the rest of the game uses.
 */
export function localProjection(lat0, lon0) {
  const phi = lat0 * DEG;
  // Metres per degree of latitude (WGS84 series).
  const mPerLat = 111132.92 - 559.82 * Math.cos(2 * phi) + 1.175 * Math.cos(4 * phi)
    - 0.0023 * Math.cos(6 * phi);
  // Metres per degree of longitude at this latitude.
  const mPerLon = 111412.84 * Math.cos(phi) - 93.5 * Math.cos(3 * phi) + 0.118 * Math.cos(5 * phi);
  return {
    lat0,
    lon0,
    mPerLat,
    mPerLon,
    worldFromLatLon(lat, lon) {
      return { x: (lon - lon0) * mPerLon, z: -(lat - lat0) * mPerLat };
    },
    latLonFromWorld(x, z) {
      return { lat: lat0 - z / mPerLat, lon: lon0 + x / mPerLon };
    },
  };
}

/** Great-circle distance in metres. */
export function haversine(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * DEG;
  const dLon = (b.lon - a.lon) * DEG;
  const la = a.lat * DEG;
  const lb = b.lat * DEG;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
/**
 * Height inside a grid cell on the same two triangles the terrain meshes
 * draw (split along the b–c anti-diagonal: a=(i,j) b=(i+1,j) c=(i,j+1)
 * d=(i+1,j+1)). Bilinear interpolation would differ from the drawn surface
 * by up to the cell's twist, which is what let wheels sink through slopes.
 */
export const triSample = (a, b, c, d, fx, fz) => (fx + fz <= 1
  ? a + (b - a) * fx + (c - a) * fz
  : d + (c - d) * (1 - fx) + (b - d) * (1 - fz));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => t * t * (3 - 2 * t);
export const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));
export const wrapAngle = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};
export const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "--:--.---";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};
export const formatCoord = ({ lat, lon }) => `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

/** Parse "lat, lon" (comma, semicolon or space separated) → { lat, lon } or null. */
export function parseLatLon(text) {
  const parts = String(text).trim().split(/[\s,;]+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const [lat, lon] = parts.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

/** Deterministic 0..1 hash-noise, used for vegetation and texture variation. */
export function hash2(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Centripetal Catmull-Rom spline through a polyline of `{x, z}` vertices,
 * sampled so no step is longer than `maxStep` metres and the heading turns by
 * at most `maxTurn` radians between samples (finer in bends, never under
 * `minStep`). Every vertex is kept exactly (junction nodes stay where they
 * are), the tangent is continuous at the vertices, and the centripetal
 * parametrisation never loops or cusps. `before` / `after` are optional
 * neighbour points beyond the ends (the way that continues there), so a road
 * split into two ways keeps one tangent across the joint; without them the
 * ends extrapolate straight. Returns `[{x, z}]`.
 */
export function splinePolyline(points, { maxStep = 5, maxTurn = 3 * DEG, minStep = 0.5, before = null, after = null } = {}) {
  const p = [];
  for (const v of points) {
    const last = p[p.length - 1];
    if (!last || Math.hypot(v.x - last.x, v.z - last.z) > 1e-6) p.push({ x: v.x, z: v.z });
  }
  if (p.length < 2) return p.map((v) => ({ ...v }));
  const n = p.length;
  const ext = (a, b) => ({ x: 2 * a.x - b.x, z: 2 * a.z - b.z });
  const pt = (i) => (i < 0 ? (before || ext(p[0], p[1])) : i >= n ? (after || ext(p[n - 1], p[n - 2])) : p[i]);
  const out = [{ ...p[0] }];
  for (let i = 0; i + 1 < n; i++) {
    const P0 = pt(i - 1); const P1 = p[i]; const P2 = p[i + 1]; const P3 = pt(i + 2);
    const knot = (a, b) => Math.max(1e-6, Math.sqrt(Math.hypot(b.x - a.x, b.z - a.z)));
    const t1 = knot(P0, P1); const t2 = t1 + knot(P1, P2); const t3 = t2 + knot(P2, P3);
    // Barry–Goldman pyramid, scalar (this runs for every sample of every road).
    const at = (u) => {
      const t = t1 + (t2 - t1) * u;
      const a1x = ((t1 - t) * P0.x + t * P1.x) / t1; const a1z = ((t1 - t) * P0.z + t * P1.z) / t1;
      const a2x = ((t2 - t) * P1.x + (t - t1) * P2.x) / (t2 - t1); const a2z = ((t2 - t) * P1.z + (t - t1) * P2.z) / (t2 - t1);
      const a3x = ((t3 - t) * P2.x + (t - t2) * P3.x) / (t3 - t2); const a3z = ((t3 - t) * P2.z + (t - t2) * P3.z) / (t3 - t2);
      const b1x = ((t2 - t) * a1x + t * a2x) / t2; const b1z = ((t2 - t) * a1z + t * a2z) / t2;
      const b2x = ((t3 - t) * a2x + (t - t1) * a3x) / (t3 - t1); const b2z = ((t3 - t) * a2z + (t - t1) * a3z) / (t3 - t1);
      return { x: ((t2 - t) * b1x + (t - t1) * b2x) / (t2 - t1), z: ((t2 - t) * b1z + (t - t1) * b2z) / (t2 - t1) };
    };
    // Walk the span on a fine probe and emit a sample whenever the next probe
    // step would take the arc since the last sample past `maxStep` metres or
    // `maxTurn` of heading, so every chord stays short and turns little.
    const chord = Math.hypot(P2.x - P1.x, P2.z - P1.z);
    const probe = Math.max(8, Math.min(Math.ceil(chord / 0.5), Math.max(200, Math.ceil((chord * 4) / maxStep))));
    let len = 0; let turn = 0;
    let prev = P1; let prevH = null;
    for (let k = 1; k <= probe; k++) {
      const q = k === probe ? P2 : at(k / probe);
      const h = Math.atan2(q.x - prev.x, q.z - prev.z);
      const dl = Math.hypot(q.x - prev.x, q.z - prev.z);
      const dt = prevH == null ? 0 : Math.abs(wrapAngle(h - prevH));
      if ((len + dl > maxStep || turn + dt > maxTurn) && len >= minStep) {
        out.push(prev);
        len = 0; turn = 0;
      }
      len += dl; turn += dt;
      prev = q; prevH = h;
    }
    out.push({ ...P2 });
  }
  return out;
}
