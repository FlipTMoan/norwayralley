import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { logger } from './log.js';
import { NORWAY_BOUNDS, isInNorway } from './worldgen.js';
import { parseLatLon } from './geo.js';
import { listRoutes, saveRoute, deleteRoute, describeSaved } from './saved.js';
// Mainland Norway and its larger islands as [lat, lon] rings (geoBoundaries
// gbOpen ADM0, CC BY 4.0; simplified to ~1 km). Svalbard and Jan Mayen are
// outside the game's box and left out.
import NORWAY_RINGS from './norway-outline.json';
import { cache } from './cache.js';
import { copyText } from './share.js';

/**
 * 2D route picker (Phase 2 of the V3 plan).
 *
 * A Leaflet map sits over the game, opened by clicking the minimap. Click once
 * for the start and once for the finish (or type "lat, lon"), then "Generate
 * route" hands the two lat/lon pairs to `main.js`: OSRM for the road profiles,
 * the game's own A* for "off-road". One point plus FREE DRIVE streams the
 * world around that spot instead.
 */

const log = logger('map');

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** OSM tiles served through the local cache (a blob URL per tile). */
const CachedTileLayer = L.TileLayer.extend({
  createTile(coords, done) {
    const img = document.createElement('img');
    img.alt = '';
    img.setAttribute('role', 'presentation');
    const url = this.getTileUrl(coords);
    cache.fetch(url, async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.blob();
    }, { kind: 'tile' }).then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      img.onload = () => { URL.revokeObjectURL(objectUrl); done(null, img); };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); done(new Error('tile decode failed'), img); };
      img.src = objectUrl;
    }).catch((error) => done(error, img));
    return img;
  },
});

function markerIcon(label, color) {
  return L.divIcon({
    className: 'route-pin',
    html: `<span style="--pin:${color}">${label}</span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 34],
    popupAnchor: [0, -30],
  });
}

export function createMapPicker({ getTerrain, onRoute, onFreeDrive = null, onSave = null, onLoad = null, onShare = null, onSharePosition = null }) {
  const root = document.getElementById('mapPicker');
  const mapEl = document.getElementById('mapCanvas');
  const statusEl = document.getElementById('mapStatus');
  const generateBtn = document.getElementById('mapGenerate');
  const coordEl = document.getElementById('mapCoord');
  const closeBtn = document.getElementById('mapClose');
  const stageBtn = document.getElementById('mapUseStage');
  const freeBtn = document.getElementById('mapFreeDrive');
  const profileEl = document.getElementById('mapProfile');
  const savedEl = document.getElementById('mapSaved');
  const loadBtn = document.getElementById('mapLoad');
  const deleteBtn = document.getElementById('mapDelete');
  const saveNameEl = document.getElementById('mapSaveName');
  const saveBtn = document.getElementById('mapSave');
  const shareBtn = document.getElementById('mapShareRoute');
  const sharePosBtn = document.getElementById('mapSharePosition');
  if (!root || !mapEl) log.error('map picker DOM is missing');
  let map = null;
  let boundsRect = null;
  let markers = [];
  let stageLine = null;
  let carMarker = null;
  let points = { a: null, b: null };
  let busy = false;
  let visible = false;
  let lastRoute = null;

  function setStatus(text, kind = '') {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = `map-status ${kind}`.trim();
  }

  function updateButtons() {
    if (generateBtn) generateBtn.disabled = busy || !points.a || !points.b;
    if (generateBtn) generateBtn.textContent = busy ? 'ROUTING…' : 'GENERATE ROUTE';
    if (freeBtn) freeBtn.disabled = busy || !points.a || !onFreeDrive;
    const picked = Boolean(savedEl?.value);
    if (loadBtn) loadBtn.disabled = busy || !picked || !onLoad;
    if (deleteBtn) deleteBtn.disabled = busy || !picked;
    if (saveBtn) saveBtn.disabled = busy || !onSave;
  }

  /** Fill the saved-routes select, keeping the current choice if it still exists. */
  function refreshSaved() {
    if (!savedEl) return;
    const current = savedEl.value;
    const routes = listRoutes();
    savedEl.innerHTML = '';
    const head = document.createElement('option');
    head.value = '';
    head.textContent = routes.length ? `SAVED ROUTES (${routes.length})…` : 'NO SAVED ROUTES YET';
    savedEl.appendChild(head);
    for (const r of routes) {
      const opt = document.createElement('option');
      opt.value = r.name;
      opt.textContent = `${r.name} — ${describeSaved(r)}`;
      savedEl.appendChild(opt);
    }
    savedEl.value = routes.some((r) => r.name === current) ? current : '';
    updateButtons();
  }

  function clearMarkers() {
    for (const m of markers) m.remove();
    markers = [];
    points = { a: null, b: null };
    updateButtons();
  }

  function place(point, kind) {
    points[kind] = point;
    const marker = L.marker([point.lat, point.lon], {
      icon: markerIcon(kind.toUpperCase(), kind === 'a' ? '#8fe6a3' : '#f0ce58'),
      draggable: true,
    }).addTo(map);
    marker.on('dragend', () => {
      const ll = marker.getLatLng();
      points[kind] = { lat: ll.lat, lon: ll.lng };
      setStatus(`${kind.toUpperCase()} moved.`);
    });
    markers.push(marker);
    updateButtons();
  }

  function ensureMap() {
    if (map) return map;
    log.info('creating Leaflet map');
    // Norway only: the map cannot be panned or zoomed out beyond the
    // country's box, tiles are only requested inside it, and every other
    // country (and the sea beyond the coast) is shaded by a world polygon
    // with Norway cut out of it.
    const norway = norwayBounds();
    map = L.map(mapEl, {
      zoomControl: true,
      attributionControl: true,
      minZoom: 4,
      maxZoom: 18,
      worldCopyJump: false,
      // No CSS zoom/fade animations: they depend on animation frames that a
      // background tab never gets, which leaves the panes stuck mid-zoom.
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      maxBounds: norway.pad(0.02),
      maxBoundsViscosity: 1.0,
    }).setView([64.5, 12], 4);
    new CachedTileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19, bounds: norway }).addTo(map);
    const mask = L.polygon(
      [[[-89, -180], [89, -180], [89, 180], [-89, 180]], ...NORWAY_RINGS],
      { stroke: false, fillColor: '#0b100d', fillOpacity: 0.78, interactive: false, fillRule: 'evenodd' },
    ).addTo(map);
    // The outline is ~1 km coarse: close in it would shade real shoreline,
    // so it only shows at country and regional zooms.
    const toggleMask = () => { if (map.getZoom() > 11) map.removeLayer(mask); else if (!map.hasLayer(mask)) mask.addTo(map); };
    map.on('zoomend', toggleMask);
    boundsRect = L.rectangle([[-1, -1], [1, 1]], {
      color: '#f0ce58',
      weight: 2,
      dashArray: '6 6',
      fill: false,
      interactive: false,
    }).addTo(map);

    // Leaflet calls the longitude `lng`; the game uses `lon` everywhere.
    map.on('click', (event) => pick(event.latlng.lat, event.latlng.lng));

    return map;
  }

  /** Place the next pin: A, then B, then start over with a new A. */
  function pick(lat, lon) {
    if (busy) return;
    if (!isInNorway(lat, lon)) {
      setStatus('That spot is outside Norway. Pick a start and finish inside the country.', 'err');
      return;
    }
    if (!points.a || (points.a && points.b)) {
      clearMarkers();
      place({ lat, lon }, 'a');
      setStatus('Start set. Click the finish point for a stage, or press FREE DRIVE HERE.');
    } else {
      place({ lat, lon }, 'b');
      setStatus('Both points set. Press GENERATE ROUTE to build that world.');
    }
    updateButtons();
  }

  const norwayBounds = () => L.latLngBounds(
    [NORWAY_BOUNDS.minLat, NORWAY_BOUNDS.minLon],
    [NORWAY_BOUNDS.maxLat, NORWAY_BOUNDS.maxLon],
  );

  function fitNorway() {
    if (!map) return;
    const bounds = norwayBounds();
    if (boundsRect) boundsRect.setBounds(bounds);
    map.fitBounds(bounds, { padding: [12, 12] });
    // Never zoom out past the whole country.
    map.setMinZoom(Math.max(3, map.getBoundsZoom(bounds, false, L.point(12, 12))));
  }

  function terrainCorners(terrain) {
    const b = terrain.streaming
      ? terrain.bounds
      : {
        minX: -terrain.sizeX / 2,
        maxX: terrain.sizeX / 2,
        minZ: -terrain.sizeZ / 2,
        maxZ: terrain.sizeZ / 2,
      };
    return [
      terrain.latLonFromWorld(b.minX, b.minZ),
      terrain.latLonFromWorld(b.maxX, b.minZ),
      terrain.latLonFromWorld(b.maxX, b.maxZ),
      terrain.latLonFromWorld(b.minX, b.maxZ),
    ].map((p) => [p.lat, p.lon]);
  }

  function fitToTerrain(terrain) {
    if (!map) return;
    if (!terrain) {
      fitNorway();
      return;
    }
    const corners = terrainCorners(terrain);
    if (boundsRect) boundsRect.setBounds(corners);
    if (terrain.generated) {
      // Zoom to the world that was generated for the current stage.
      map.fitBounds(L.latLngBounds(corners), { padding: [24, 24] });
      return;
    }
    // The baked demo tile is tiny: show the whole country so the player can
    // pick points anywhere, and outline the small loaded world as a hint.
    fitNorway();
  }

  /** Draw the stage being driven and where the car is. */
  function showCurrent({ stage = null, car = null } = {}) {
    stageLine?.remove();
    carMarker?.remove();
    stageLine = null;
    carMarker = null;
    if (stage?.length > 1) {
      stageLine = L.polyline(stage.map((p) => [p.lat, p.lon]), {
        color: '#f0ce58', weight: 4, opacity: 0.9, interactive: false,
      }).addTo(map);
    }
    if (car) {
      carMarker = L.marker([car.lat, car.lon], {
        icon: L.divIcon({ className: 'car-pin', html: '<span>▲ YOU</span>', iconSize: [60, 16], iconAnchor: [30, 8] }),
        interactive: false,
        zIndexOffset: 1000,
      }).addTo(map);
    }
  }

  function open(terrain, route, current = {}) {
    if (!root || !mapEl) return;
    ensureMap();
    lastRoute = route;
    clearMarkers();
    refreshSaved();
    stageLine?.remove();
    carMarker?.remove();
    stageLine = null;
    carMarker = null;
    setStatus('Click anywhere in Norway to set the START point, then the FINISH — or FREE DRIVE from the start.');
    root.classList.remove('hidden');
    visible = true;
    // Leaflet needs a size recalculation after the container is shown. Fit the
    // terrain bounds only once it knows how big it is, otherwise fitBounds
    // computes a zoom for a zero-sized viewport and shows half of Europe.
    // rAF can stay paused in a background tab, so a timer backs it up.
    let fitted = false;
    const fit = () => {
      if (fitted) return;
      fitted = true;
      map?.invalidateSize();
      if (current.stage?.length > 1) {
        // The stage being driven, with room around it; zoom out for the country.
        map.fitBounds(L.latLngBounds(current.stage.map((p) => [p.lat, p.lon])).pad(0.35), { maxZoom: 14 });
        if (boundsRect) boundsRect.setBounds(norwayBounds());
      } else if (current.car) {
        map.setView([current.car.lat, current.car.lon], 13);
        if (boundsRect) boundsRect.setBounds(norwayBounds());
      } else {
        fitToTerrain(terrain);
      }
      // Added after the view is final, so the overlay is projected at this zoom.
      showCurrent(current);
    };
    requestAnimationFrame(fit);
    window.setTimeout(fit, 150);
    log.info('opened route map');
  }

  function close() {
    root?.classList.add('hidden');
    visible = false;
    busy = false;
    updateButtons();
  }

  function useStage() {
    const terrain = getTerrain();
    if (!terrain || !lastRoute) return;
    clearMarkers();
    const a = terrain.latLonFromWorld(lastRoute.start.x, lastRoute.start.z);
    const b = terrain.latLonFromWorld(lastRoute.finish.x, lastRoute.finish.z);
    place({ lat: a.lat, lon: a.lon }, 'a');
    place({ lat: b.lat, lon: b.lon }, 'b');
    setStatus('Loaded the current stage. Press GENERATE ROUTE to re-route it.');
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      if (!points.a || !points.b || busy) return;
      busy = true;
      updateButtons();
      setStatus(profileEl?.value === 'offroad' ? 'Routing across the terrain…' : 'Asking OSRM for a road…');
      const started = performance.now();
      try {
        const answer = await onRoute({
          a: points.a,
          b: points.b,
          profile: profileEl?.value || 'driving',
        });
        log.info(`OSRM map route finished in ${(performance.now() - started).toFixed(0)} ms`);
        setStatus(answer.message, answer.ok ? 'ok' : 'err');
        if (answer.ok) {
          busy = false;
          close();
          return;
        }
      } catch (error) {
        log.error('map route failed', error);
        setStatus(error.message || 'Routing failed.', 'err');
      } finally {
        busy = false;
        updateButtons();
      }
    });
  }
  freeBtn?.addEventListener('click', async () => {
    if (!points.a || busy || !onFreeDrive) return;
    busy = true;
    updateButtons();
    setStatus('Streaming the world around your start point…');
    try {
      const answer = await onFreeDrive({ a: points.a });
      setStatus(answer.message, answer.ok ? 'ok' : 'err');
      if (answer.ok) {
        busy = false;
        close();
        return;
      }
    } catch (error) {
      log.error('free drive failed', error);
      setStatus(error.message || 'Free drive failed.', 'err');
    } finally {
      busy = false;
      updateButtons();
    }
  });
  coordEl?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const ll = parseLatLon(coordEl.value);
    if (!ll) {
      setStatus('Type a coordinate pair like 58.98, 6.19 and press Enter.', 'err');
      return;
    }
    coordEl.value = '';
    pick(ll.lat, ll.lon);
    map?.setView([ll.lat, ll.lon], Math.max(map.getZoom(), 12));
  });
  savedEl?.addEventListener('change', updateButtons);
  saveBtn?.addEventListener('click', () => {
    const described = onSave?.();
    if (!described) {
      setStatus('Nothing to save yet: drive a stage or free drive first, then save it here.', 'err');
      return;
    }
    const name = saveNameEl?.value || '';
    if (!name.trim()) {
      setStatus('Give the route a name first.', 'err');
      saveNameEl?.focus();
      return;
    }
    const entry = saveRoute(name, described);
    if (!entry) {
      setStatus('Could not save (storage blocked?).', 'err');
      return;
    }
    if (saveNameEl) saveNameEl.value = '';
    refreshSaved();
    savedEl.value = entry.name;
    updateButtons();
    setStatus(`Saved "${entry.name}". Pick it from SAVED ROUTES any time.`, 'ok');
    log.info(`saved route "${entry.name}" (${described.kind})`);
  });
  const shareWith = async (getUrl, missing) => {
    const url = getUrl?.();
    if (!url) {
      setStatus(missing, 'err');
      return;
    }
    const copied = await copyText(url);
    setStatus(`${copied ? 'Link copied: ' : 'Share this link: '}${url}`, 'ok');
    log.info(`share link ${url}`);
  };
  shareBtn?.addEventListener('click', () => shareWith(onShare, 'Nothing to share yet: drive a stage or free drive first.'));
  sharePosBtn?.addEventListener('click', () => shareWith(onSharePosition, 'No position yet: start a drive first.'));
  deleteBtn?.addEventListener('click', () => {
    const name = savedEl?.value;
    if (!name) return;
    deleteRoute(name);
    refreshSaved();
    setStatus(`Deleted "${name}".`);
  });
  loadBtn?.addEventListener('click', async () => {
    const name = savedEl?.value;
    const entry = listRoutes().find((r) => r.name === name);
    if (!entry || !onLoad || busy) return;
    busy = true;
    updateButtons();
    setStatus(`Loading "${entry.name}"…`);
    try {
      const answer = await onLoad(entry.route);
      setStatus(answer.message, answer.ok ? 'ok' : 'err');
      if (answer.ok) {
        busy = false;
        close();
        return;
      }
    } catch (error) {
      log.error('saved route failed', error);
      setStatus(error.message || 'Could not load that route.', 'err');
    } finally {
      busy = false;
      updateButtons();
    }
  });
  closeBtn?.addEventListener('click', close);
  stageBtn?.addEventListener('click', useStage);
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape' && visible) close();
  });

  return {
    open,
    close,
    isOpen: () => visible,
    invalidate: () => map?.invalidateSize(),
    getMap: () => map,
  };
}
