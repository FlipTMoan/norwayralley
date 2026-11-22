/*
 * Browser glue the JS game used directly: URL params (share links, share.js), localStorage
 * (saved routes and settings, saved.js), the clipboard (share.js copyText), the document title,
 * and the Leaflet route-map overlay the template defines as window.rallyMap (map.js). Strings
 * returned to C# are malloc'd UTF-8 that the IL2CPP marshaller frees.
 */
mergeInto(LibraryManager.library, {
  $RallyDom: {
    cstr: function (s) {
      var size = lengthBytesUTF8(s) + 1;
      var ptr = _malloc(size);
      stringToUTF8(s, ptr, size);
      return ptr;
    },
  },

  /** location.search without the '?', e.g. "route=59.1,6.2;59.2,6.3&profile=driving". */
  RallyUrlParams__deps: ['$RallyDom'],
  RallyUrlParams: function () {
    return RallyDom.cstr((window.location.search || '').replace(/^\?/, ''));
  },

  /** history.replaceState with a new query string (empty clears it); the page does not reload. */
  RallyUrlReplace: function (queryPtr) {
    var query = UTF8ToString(queryPtr);
    var url = window.location.pathname + (query ? '?' + query : '') + window.location.hash;
    try { window.history.replaceState(null, '', url); } catch (e) { /* file:// */ }
  },

  RallyLocalGet__deps: ['$RallyDom'],
  RallyLocalGet: function (keyPtr) {
    var v = null;
    try { v = window.localStorage.getItem(UTF8ToString(keyPtr)); } catch (e) { /* private mode */ }
    return v == null ? 0 : RallyDom.cstr(v);
  },

  RallyLocalSet: function (keyPtr, valuePtr) {
    try { window.localStorage.setItem(UTF8ToString(keyPtr), UTF8ToString(valuePtr)); } catch (e) { /* quota / private mode */ }
  },

  /** share.js copyText: navigator.clipboard, falling back to a hidden textarea + execCommand. */
  RallyClipboardWrite: function (textPtr) {
    var text = UTF8ToString(textPtr);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* unsupported */ }
    document.body.removeChild(ta);
  },

  RallySetTitle: function (titlePtr) { document.title = UTF8ToString(titlePtr); },

  /**
   * Open the Leaflet route picker (template: window.rallyMap). `optionsJson` carries
   * { start: {lat, lon}?, finish: {lat, lon}?, world: {minLat, minLon, maxLat, maxLon}? }.
   * Picks and buttons come back as SendMessage('Map', 'OnMapEvent', json).
   */
  RallyMapOpen: function (optionsPtr) {
    var options = {};
    try { options = JSON.parse(UTF8ToString(optionsPtr) || '{}'); } catch (e) { options = {}; }
    if (window.rallyMap) window.rallyMap.open(options);
  },

  RallyMapClose: function () { if (window.rallyMap) window.rallyMap.close(); },

  /** Status line under the map ("Click the map to set the START point…"). */
  RallyMapStatus: function (textPtr) { if (window.rallyMap) window.rallyMap.status(UTF8ToString(textPtr)); },

  /** Move a pin after a snap: which = 0 start, 1 finish. */
  RallyMapSetPin: function (which, lat, lon) { if (window.rallyMap) window.rallyMap.setPin(which, lat, lon); },

  /** Show the stage line on the map as [[lat, lon], …] JSON (empty clears). */
  RallyMapSetRoute: function (jsonPtr) {
    var pts = [];
    try { pts = JSON.parse(UTF8ToString(jsonPtr) || '[]'); } catch (e) { pts = []; }
    if (window.rallyMap) window.rallyMap.setRoute(pts);
  },

  /** MY ROUTES rows in the map panel: [{ id, name, info }] JSON and a note line (e.g. "may be cleared by the browser"). */
  RallyMapSetRoutes: function (jsonPtr, notePtr) {
    var rows = [];
    try { rows = JSON.parse(UTF8ToString(jsonPtr) || '[]'); } catch (e) { rows = []; }
    if (window.rallyMap && window.rallyMap.setRoutes) window.rallyMap.setRoutes(rows, UTF8ToString(notePtr));
  },

  /** Loader hook: the template's progress bar text once Unity is up. */
  RallyLoaderText: function (textPtr) {
    var el = document.getElementById('loading-text');
    if (el) el.textContent = UTF8ToString(textPtr);
  },

  RallyLoaderHide: function () {
    var el = document.getElementById('loading');
    if (el) el.classList.add('hidden');
  },
});
