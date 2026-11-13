import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { logger } from './log.js';
import { NORWAY_BOUNDS, isInNorway } from './worldgen.js';

/**
 * 2D route picker (Phase 2 of the V3 plan).
 *
 * A Leaflet map sits over the game. Click once for the start and once for the
 * finish, then "Generate route" sends the two lat/lon pairs to OSRM. The
 * result comes back as a GeoJSON line which `main.js` turns into a StageRoute
 * and hands to the 3D world.
 */

const log = logger('map');

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function markerIcon(label, color) {
  return L.divIcon({
    className: 'route-pin',
    html: `<span style="--pin:${color}">${label}</span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 34],
    popupAnchor: [0, -30],
  });
}

export function createMapPicker({ getTerrain, onRoute }) {
  const root = document.getElementById('mapPicker');
  const mapEl = document.getElementById('mapCanvas');
  const statusEl = document.getElementById('mapStatus');
  const generateBtn = document.getElementById('mapGenerate');
  const clearBtn = document.getElementById('mapClear');
  const closeBtn = document.getElementById('mapClose');
  const stageBtn = document.getElementById('mapUseStage');
  const profileEl = document.getElementById('mapProfile');
  if (!root || !mapEl) log.error('map picker DOM is missing');
  let map = null;
  let boundsRect = null;
  let markers = [];
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
    if (clearBtn) clearBtn.disabled = busy;
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
    map = L.map(mapEl, {
      zoomControl: true,
      attributionControl: true,
      minZoom: 3,
      maxZoom: 18,
      worldCopyJump: true,
    }).setView([64.5, 12], 4);
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
    boundsRect = L.rectangle([[-1, -1], [1, 1]], {
      color: '#f0ce58',
      weight: 2,
      dashArray: '6 6',
      fill: false,
      interactive: false,
    }).addTo(map);

    map.on('click', (event) => {
      // Leaflet calls the longitude `lng`; the game uses `lon` everywhere.
      const lat = event.latlng.lat;
      const lon = event.latlng.lng;
      if (!isInNorway(lat, lon)) {
        setStatus('That spot is outside Norway. Pick a start and finish inside the country.', 'err');
        return;
      }
      if (!points.a || (points.a && points.b)) {
        clearMarkers();
        place({ lat, lon }, 'a');
        setStatus('Start set. Click the finish point — anywhere in Norway.');
      } else {
        place({ lat, lon }, 'b');
        setStatus('Both points set. Press GENERATE ROUTE to build that world.');
      }
      updateButtons();
    });

    return map;
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

  function open(terrain, route) {
    if (!root || !mapEl) return;
    ensureMap();
    lastRoute = route;
    clearMarkers();
    setStatus('Click anywhere in Norway to set the START point, then the FINISH.');
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
      fitToTerrain(terrain);
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
      setStatus('Asking OSRM for a road…');
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
  clearBtn?.addEventListener('click', () => {
    clearMarkers();
    setStatus('Cleared. Click the map to set a new START point.');
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
