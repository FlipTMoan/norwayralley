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

/** Deterministic 0..1 hash-noise, used for vegetation and texture variation. */
export function hash2(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
