/**
 * Share a drive as a link. The address carries just enough to rebuild it on
 * the other side: `?route=osrm:LAT,LON;LAT,LON;PROFILE` re-asks OSRM for the
 * road between the two points, `?route=demo:LAT,LON;LAT,LON` routes the
 * game's own A* on the demo mountain, and `?drive=LAT,LON` starts a free
 * drive there. Coordinates are rounded to 5 decimals (about a metre).
 */

const num = (v) => Number(v.toFixed(5));
const pair = (p) => `${num(p.lat)},${num(p.lon)}`;

/** Query parameters for a drive descriptor (see describeRoute in main.js), or null. */
export function shareParams(described, { profile = 'driving' } = {}) {
  if (!described) return null;
  if (described.kind === 'free' && described.center) return { drive: pair(described.center) };
  if (described.kind === 'osrm' && described.geometry?.coordinates?.length >= 2) {
    const c = described.geometry.coordinates;
    return { route: `osrm:${pair(c[0])};${pair(c[c.length - 1])};${profile}` };
  }
  if (described.kind === 'demo' && described.a && described.b) {
    return { route: `demo:${pair(described.a)};${pair(described.b)}` };
  }
  return null;
}

/** A full link for the current page with the share parameters (debug/scene params dropped). */
export function shareUrl(described, options, location = globalThis.location) {
  const params = shareParams(described, options);
  if (!params) return null;
  const url = new URL(location.href);
  url.search = '';
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

function parsePair(text) {
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(text || '');
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

/** What a shared link asks for: `{ kind: 'free', center }`, `{ kind: 'osrm', a, b, profile }`, `{ kind: 'demo', a, b }`, or null. */
export function parseShare(search) {
  const params = new URLSearchParams(search);
  const drive = parsePair(params.get('drive'));
  if (drive) return { kind: 'free', center: drive };
  const route = params.get('route');
  if (!route) return null;
  const [kind, ...rest] = route.split(':');
  const parts = rest.join(':').split(';');
  const a = parsePair(parts[0]);
  const b = parsePair(parts[1]);
  if (!a || !b) return null;
  if (kind === 'osrm') {
    const profile = ['driving', 'cycling', 'foot'].includes(parts[2]) ? parts[2] : 'driving';
    return { kind: 'osrm', a, b, profile };
  }
  if (kind === 'demo') return { kind: 'demo', a, b };
  return null;
}
