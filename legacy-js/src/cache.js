/**
 * Local cache of everything the game fetches from the geodata services:
 * Kartverket DEM tiles, Overpass answers, NVDB signs and surfaces, SR16
 * forest images, OSRM routes and the map's OSM tiles. Entries live in
 * IndexedDB (ArrayBuffer, Blob or JSON) with a byte budget — at most 32 GB, keeping
 * 10 % of the browser quota free — and the least recently used entries are evicted first. A hit
 * never touches the network, which is both the speed-up and the resilience:
 * a place driven once keeps working when a service is down.
 *
 * `createCache(backend)` takes any store with get/put/delete/listByAge/
 * clear/bytes so the logic is testable without a browser.
 */
import { logger } from './log.js';

const log = logger('cache');

export const MAX_BUDGET = 32 * 1024 ** 3;       // 32 GB at most (user, 2026-11-18)
export const DEFAULT_BUDGET = MAX_BUDGET;
export const KEEP_FREE = 0.10;                    // share of the browser quota never used by the cache
const RECHECK_MS = 5 * 60 * 1000;                 // measure the room again this often…
const RECHECK_BYTES = 256 * 1024 ** 2;            // …and after this much was written

/**
 * The budget for the room the browser reports (navigator.storage.estimate): at most 32 GB, and 10 % of the
 * origin's quota stays unused, with the origin's other data counting against it. A web page cannot see the
 * disk itself; Chrome derives the quota from the disk size and free space, so this is the closest a page can
 * get to "leave 10 % of the disk free". Unknown figures do not limit. Same rule as GeoCache.BudgetFor in Unity.
 */
export function budgetFor(estimate, ours) {
  let b = MAX_BUDGET;
  if (estimate && estimate.quota > 0 && estimate.usage >= 0) {
    b = Math.min(b, Math.max(0, Math.floor((1 - KEEP_FREE) * estimate.quota) - Math.max(0, estimate.usage - ours)));
  }
  return b;
}

async function browserEstimate() {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) return await navigator.storage.estimate();
  } catch { /* unsupported */ }
  return null;
}
const DB_NAME = 'rally-cache';
const STORE = 'entries';
const TOUCH_EVERY = 60000;                     // ms between LRU timestamp updates of one entry

/** Size in bytes of a value as stored. */
export function sizeOf(value) {
  if (value == null) return 0;
  if (value instanceof ArrayBuffer) return value.byteLength;
  if (ArrayBuffer.isView(value)) return value.byteLength;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return value.size;
  if (typeof value === 'string') return value.length * 2;
  return JSON.stringify(value).length * 2;
}

/* ------------------------------------------------------------------ *
 *  IndexedDB backend                                                   *
 * ------------------------------------------------------------------ */
function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed'));
  });
}

async function openDb() {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      const store = db.createObjectStore(STORE, { keyPath: 'key' });
      store.createIndex('at', 'at');
    };
    return await request(req);
  } catch (error) {
    log.warn(`IndexedDB unavailable, caching disabled: ${error.message}`);
    return null;
  }
}

/** The browser store: entries are `{ key, kind, value, size, at }`. */
export function indexedDbBackend() {
  const dbPromise = openDb();
  const tx = async (mode, fn) => {
    const db = await dbPromise;
    if (!db) return undefined;
    const store = db.transaction(STORE, mode).objectStore(STORE);
    return fn(store);
  };
  return {
    available: () => dbPromise.then((db) => Boolean(db)),
    get: (key) => tx('readonly', (s) => request(s.get(key))),
    put: (entry) => tx('readwrite', (s) => request(s.put(entry))),
    delete: (key) => tx('readwrite', (s) => request(s.delete(key))),
    clear: () => tx('readwrite', (s) => request(s.clear())),
    /** All entries' { key, size, at }, oldest first (no values: cheap). */
    listByAge: () => tx('readonly', (s) => new Promise((resolve, reject) => {
      const out = [];
      const cursor = s.index('at').openCursor();
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (!c) { resolve(out); return; }
        out.push({ key: c.value.key, size: c.value.size, at: c.value.at, kind: c.value.kind });
        c.continue();
      };
      cursor.onerror = () => reject(cursor.error);
    })),
  };
}

/** An in-memory store with the same shape (tests, or no IndexedDB). */
export function memoryBackend() {
  const map = new Map();
  return {
    available: async () => true,
    get: async (key) => map.get(key),
    put: async (entry) => { map.set(entry.key, entry); },
    delete: async (key) => { map.delete(key); },
    clear: async () => { map.clear(); },
    listByAge: async () => [...map.values()].map(({ key, size, at, kind }) => ({ key, size, at, kind })).sort((a, b) => a.at - b.at),
  };
}

/* ------------------------------------------------------------------ *
 *  The cache                                                           *
 * ------------------------------------------------------------------ */
export function createCache(backend, { budget = DEFAULT_BUDGET, now = Date.now, estimate = null } = {}) {
  let bytes = null;          // running total, counted on first use
  let evicting = null;
  let disabled = false;
  let lastRoomCheck = -Infinity;
  let writtenSinceCheck = 0;
  let checkingRoom = null;
  const pending = new Map(); // key → in-flight promise, so parallel asks share one load

  async function total() {
    if (bytes != null) return bytes;
    const list = (await backend.listByAge()) || [];
    bytes = list.reduce((s, e) => s + (e.size || 0), 0);
    return bytes;
  }

  async function evict() {
    if (evicting) return evicting;
    evicting = (async () => {
      const list = (await backend.listByAge()) || [];
      let sum = list.reduce((s, e) => s + (e.size || 0), 0);
      let dropped = 0;
      for (const e of list) {
        if (sum <= budget) break;
        await backend.delete(e.key);
        sum -= e.size || 0;
        dropped++;
      }
      bytes = sum;
      if (dropped) log.info(`evicted ${dropped} entries, ${(sum / 1048576).toFixed(0)} MB kept`);
    })().finally(() => { evicting = null; });
    return evicting;
  }

  /** Measure the room (estimate()) and set the budget from it; evicts when the room shrank. */
  async function refreshBudget() {
    if (!estimate || disabled) return budget;
    if (checkingRoom) return checkingRoom;
    checkingRoom = (async () => {
      lastRoomCheck = now();
      writtenSinceCheck = 0;
      try {
        const e = await estimate();
        const ours = await total();
        const next = budgetFor(e, ours);
        if (next !== budget) {
          const why = e?.quota > 0 ? `browser quota ${(e.quota / 1024 ** 3).toFixed(1)} GB, ${(e.usage / 1024 ** 3).toFixed(2)} GB used, 10 % kept free` : 'quota unknown';
          log.info(`budget ${(next / 1024 ** 3).toFixed(1)} GB (${why}; at most 32 GB)`);
        }
        budget = next;
        if (ours > budget) await evict();
      } catch (error) {
        log.debug(`could not measure the storage room: ${error.message}`);
      }
      return budget;
    })().finally(() => { checkingRoom = null; });
    return checkingRoom;
  }

  const cache = {
    get budget() { return budget; },
    setBudget(b) { budget = Math.max(0, b); return evict(); },
    refreshBudget,

    /** The cached value for `key`, or `loader()`'s result after storing it. */
    async fetch(key, loader, { kind = 'data' } = {}) {
      if (disabled) return loader();
      if (pending.has(key)) return pending.get(key);
      const run = (async () => {
        let hit = null;
        try {
          hit = await backend.get(key);
        } catch (error) {
          log.warn(`cache read failed (${error.message}); caching disabled`);
          disabled = true;
        }
        if (hit) {
          const t = now();
          if (t - (hit.at || 0) > TOUCH_EVERY) backend.put({ ...hit, at: t }).catch(() => {});
          return hit.value;
        }
        const value = await loader();
        if (value == null) return value;
        const size = sizeOf(value);
        try {
          await backend.put({ key, kind, value, size, at: now() });
          bytes = (await total()) + size;
          writtenSinceCheck += size;
          // Other data fills the disk too: measure again every few minutes and every 256 MB written.
          if (estimate && (writtenSinceCheck >= RECHECK_BYTES || now() - lastRoomCheck >= RECHECK_MS)) await refreshBudget();
          else if (bytes > budget) evict();
        } catch (error) {
          log.debug(`cache write skipped for ${kind}: ${error.message}`);
        }
        return value;
      })().finally(() => pending.delete(key));
      pending.set(key, run);
      return run;
    },

    async stats() {
      const list = (await backend.listByAge()) || [];
      const byKind = {};
      for (const e of list) byKind[e.kind] = (byKind[e.kind] || 0) + (e.size || 0);
      bytes = list.reduce((s, e) => s + (e.size || 0), 0);
      return { entries: list.length, bytes, budget, byKind };
    },

    async clear() {
      await backend.clear();
      bytes = 0;
    },
  };
  return cache;
}

/* The game's cache: IndexedDB when the browser has it, memory otherwise. */
const hasIdb = typeof indexedDB !== 'undefined';
export const cache = createCache(hasIdb ? indexedDbBackend() : memoryBackend(), { estimate: browserEstimate });

/** Ask the browser to keep the store across storage pressure (best effort). */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist) {
      const ok = await navigator.storage.persist();
      log.info(`persistent storage ${ok ? 'granted' : 'not granted'}`);
    }
  } catch { /* unsupported */ }
}

/** Convenience: cached JSON GET. */
export function cachedJson(url, init, { kind = 'json', signal } = {}) {
  return cache.fetch(url, async () => {
    const response = await fetch(url, { ...init, signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }, { kind });
}
