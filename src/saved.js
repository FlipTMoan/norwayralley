/**
 * Named list of saved routes in localStorage. A saved route is the same
 * descriptor the multiplayer room shares (`describeRoute()` in main.js):
 * an OSRM geometry, a free-drive centre, or the baked tile's sample points.
 */

const KEY = 'rally.routes';
const MAX_NAME = 40;

function read(storage) {
  try {
    const list = JSON.parse(storage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.filter((r) => r && typeof r.name === 'string' && r.route) : [];
  } catch {
    return [];
  }
}

function write(storage, list) {
  try {
    storage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false; // private mode or quota: the list just does not persist
  }
}

export function cleanName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME);
}

/** All saved routes, newest first: `[{ name, route, savedAt }]`. */
export function listRoutes(storage = globalThis.localStorage) {
  if (!storage) return [];
  return read(storage).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

/** Save (or replace by name) a route descriptor. Returns the stored entry or null. */
export function saveRoute(name, route, storage = globalThis.localStorage, now = Date.now()) {
  const clean = cleanName(name);
  if (!clean || !route || !storage) return null;
  const entry = { name: clean, route, savedAt: now };
  const list = read(storage).filter((r) => r.name.toLowerCase() !== clean.toLowerCase());
  list.push(entry);
  return write(storage, list) ? entry : null;
}

export function deleteRoute(name, storage = globalThis.localStorage) {
  if (!storage) return false;
  const clean = cleanName(name).toLowerCase();
  const list = read(storage);
  const kept = list.filter((r) => r.name.toLowerCase() !== clean);
  if (kept.length === list.length) return false;
  return write(storage, kept);
}

/** One line for the list: kind and size of the saved route. */
export function describeSaved(entry) {
  const r = entry.route || {};
  if (r.kind === 'free') return 'free drive';
  if (r.kind === 'osrm') return r.geometry?.distance ? `${(r.geometry.distance / 1000).toFixed(1)} km road` : 'road stage';
  if (r.kind === 'baked') return r.name ? `demo: ${r.name}` : 'demo stage';
  return 'route';
}
