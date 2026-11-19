/*
 * IndexedDB store for Rally.Geo.IdbBackend — the same database cache.js uses (`rally-cache`,
 * store `entries`, records { key, kind, value, size, at } with an index on `at`), so the JS
 * game and the Unity game share one cache on the origin. Values: ArrayBuffer for binary
 * entries; for text entries the parsed JSON object (what the JS client stores and expects).
 * Every call takes a request id and answers through the C# callback it was given.
 */
mergeInto(LibraryManager.library, {
  $RallyIdb: {
    db: null,
    opening: null,
    open: function () {
      if (RallyIdb.opening) return RallyIdb.opening;
      RallyIdb.opening = new Promise(function (resolve) {
        if (typeof indexedDB === 'undefined') { resolve(null); return; }
        try {
          var req = indexedDB.open('rally-cache', 1);
          req.onupgradeneeded = function () {
            var store = req.result.createObjectStore('entries', { keyPath: 'key' });
            store.createIndex('at', 'at');
          };
          req.onsuccess = function () { RallyIdb.db = req.result; resolve(req.result); };
          req.onerror = function () { console.warn('rally-cache: IndexedDB unavailable', req.error); resolve(null); };
        } catch (e) { console.warn('rally-cache: IndexedDB unavailable', e); resolve(null); }
      });
      return RallyIdb.opening;
    },
    store: function (mode) {
      return RallyIdb.db.transaction('entries', mode).objectStore('entries');
    },
    request: function (req) {
      return new Promise(function (resolve, reject) {
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error || new Error('IndexedDB request failed')); };
      });
    },
    /** A stored value as bytes: ArrayBuffer as is, Blob read, anything else JSON text. */
    toBytes: function (value) {
      if (value instanceof ArrayBuffer) return Promise.resolve({ bytes: new Uint8Array(value), isText: 0 });
      if (ArrayBuffer.isView(value)) return Promise.resolve({ bytes: new Uint8Array(value.buffer, value.byteOffset, value.byteLength), isText: 0 });
      if (typeof Blob !== 'undefined' && value instanceof Blob) {
        return value.arrayBuffer().then(function (ab) { return { bytes: new Uint8Array(ab), isText: 0 }; });
      }
      var text = typeof value === 'string' ? value : JSON.stringify(value);
      return Promise.resolve({ bytes: new TextEncoder().encode(text), isText: 1 });
    },
    cstr: function (s) {
      var size = lengthBytesUTF8(s) + 1;
      var ptr = _malloc(size);
      stringToUTF8(s, ptr, size);
      return ptr;
    },
    bool: function (cb, id, ok) {
      {{{ makeDynCall('vii', 'cb') }}}(id, ok ? 1 : 0);
    },
  },

  RallyIdbOpen__deps: ['$RallyIdb'],
  RallyIdbOpen: function (id, cb) {
    RallyIdb.open().then(function (db) { RallyIdb.bool(cb, id, !!db); });
  },

  RallyIdbGet__deps: ['$RallyIdb'],
  RallyIdbGet: function (id, keyPtr, cb) {
    var key = UTF8ToString(keyPtr);
    var miss = function () {
      {{{ makeDynCall('viiiiiidd', 'cb') }}}(id, 0, 0, 0, 0, 0, 0, 0);
    };
    RallyIdb.open().then(function (db) {
      if (!db) { miss(); return; }
      return RallyIdb.request(RallyIdb.store('readonly').get(key)).then(function (hit) {
        if (!hit) { miss(); return; }
        return RallyIdb.toBytes(hit.value).then(function (v) {
          var ptr = _malloc(Math.max(1, v.bytes.length));
          HEAPU8.set(v.bytes, ptr);
          var kind = RallyIdb.cstr(hit.kind || 'data');
          {{{ makeDynCall('viiiiiidd', 'cb') }}}(id, 1, ptr, v.bytes.length, v.isText, kind, hit.size || 0, hit.at || 0);
          _free(kind);
        });
      });
    }).catch(function (e) { console.warn('rally-cache get failed', e); miss(); });
  },

  RallyIdbPut__deps: ['$RallyIdb'],
  RallyIdbPut: function (id, keyPtr, kindPtr, valuePtr, length, isText, size, at, cb) {
    var key = UTF8ToString(keyPtr);
    var kind = UTF8ToString(kindPtr);
    var bytes = HEAPU8.slice(valuePtr, valuePtr + length);
    var value;
    if (isText) {
      var text = new TextDecoder().decode(bytes);
      try { value = JSON.parse(text); } catch (e) { value = text; }
    } else if (kind === 'sr16' || kind === 'tile') {
      value = new Blob([bytes], { type: 'image/png' }); // what the JS client stores for images
    } else {
      value = bytes.buffer;
    }
    RallyIdb.open().then(function (db) {
      if (!db) { RallyIdb.bool(cb, id, false); return; }
      return RallyIdb.request(RallyIdb.store('readwrite').put({ key: key, kind: kind, value: value, size: size, at: at }))
        .then(function () { RallyIdb.bool(cb, id, true); });
    }).catch(function (e) { console.warn('rally-cache put failed', e); RallyIdb.bool(cb, id, false); });
  },

  RallyIdbDelete__deps: ['$RallyIdb'],
  RallyIdbDelete: function (id, keyPtr, cb) {
    var key = UTF8ToString(keyPtr);
    RallyIdb.open().then(function (db) {
      if (!db) { RallyIdb.bool(cb, id, false); return; }
      return RallyIdb.request(RallyIdb.store('readwrite').delete(key)).then(function () { RallyIdb.bool(cb, id, true); });
    }).catch(function () { RallyIdb.bool(cb, id, false); });
  },

  RallyIdbClear__deps: ['$RallyIdb'],
  RallyIdbClear: function (id, cb) {
    RallyIdb.open().then(function (db) {
      if (!db) { RallyIdb.bool(cb, id, false); return; }
      return RallyIdb.request(RallyIdb.store('readwrite').clear()).then(function () { RallyIdb.bool(cb, id, true); });
    }).catch(function () { RallyIdb.bool(cb, id, false); });
  },

  /** All entries' { key, size, at, kind } oldest first as JSON (no values: cheap). */
  RallyIdbList__deps: ['$RallyIdb'],
  RallyIdbList: function (id, cb) {
    var answer = function (rows) {
      var ptr = RallyIdb.cstr(JSON.stringify(rows));
      {{{ makeDynCall('vii', 'cb') }}}(id, ptr);
      _free(ptr);
    };
    RallyIdb.open().then(function (db) {
      if (!db) { answer([]); return; }
      var out = [];
      var cursor = RallyIdb.store('readonly').index('at').openCursor();
      cursor.onsuccess = function () {
        var c = cursor.result;
        if (!c) { answer(out); return; }
        out.push({ key: c.value.key, size: c.value.size, at: c.value.at, kind: c.value.kind });
        c.continue();
      };
      cursor.onerror = function () { answer(out); };
    }).catch(function () { answer([]); });
  },

  RallyIdbFree: function (ptr) { if (ptr) _free(ptr); },

  /** navigator.storage.estimate(): the origin's quota and usage in bytes; −1 each when the browser cannot tell. */
  RallyStorageEstimate: function (id, cb) {
    var done = function (quota, usage) { {{{ makeDynCall('vidd', 'cb') }}}(id, quota, usage); };
    try {
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(function (e) { done(e.quota || -1, e.usage || 0); }, function () { done(-1, -1); });
        return;
      }
    } catch (e) { /* unsupported */ }
    done(-1, -1);
  },

  /** cache.js requestPersistence: ask the browser to keep the store across storage pressure (best effort). */
  RallyStoragePersist: function () {
    try {
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then(function (ok) { console.info('rally-cache: persistent storage ' + (ok ? 'granted' : 'not granted')); });
      }
    } catch (e) { /* unsupported */ }
  },
});
