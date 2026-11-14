# Stage on the map · local cache · 1 m corridor tiles — 2026-11-14

User requests (in order received):
1. "The current stage should be shown in the map."
2. Free drive: 1 m tiles around the road (100 m each side), 10 m tiles
   further out for the horizon; load while driving, in the background;
   free drive unlimited.
3. Cache tiles, road signs, map overlays etc. locally, up to 10 GB.

## Findings
- Streaming already is unbounded and background-loaded: 2048 m chunks of
  10.7 m cells within LOAD_RADIUS 3.9 km of a velocity-led point, disposed
  beyond 4.7 km, fog ends at 2.9 km. The "limit" a fast driver meets is the
  edge of the loaded ring (`inside()` slows the car to a crawl there).
- The road itself is already analytic (corridor profile); the ground beside
  it is the 10.7 m grid.

## Plan
### Commit 1 — map + reach
- [x] `map.js open(terrain, route, { stage, car })`: draw the stage as a
      polyline, the car as a marker, fit to the stage (max zoom 14).
- [x] LOAD_RADIUS 4400, KEEP 5300, LEAD 2800 so the loaded ring stays ahead.

### Commit 1b — graded roads (user: roads follow the DTM too much)
- [x] `smoothRoadHeights` in corridor.js, used by stage/stream/roads.

### Commit 2 — local cache (`src/cache.js`)
- [x] IndexedDB store keyed by URL/kind, values ArrayBuffer/JSON/Blob, with
      size accounting and LRU eviction at a 10 GB budget; `navigator.storage.persist()`.
- [x] Wrap: Kartverket DEM GeoTIFFs (worldgen.fetchDem), Overpass chunk
      JSON (buildings.js), NVDB signs + surfaces (signs.js, roads.js), SR16
      WMS images (landcover.js), OSRM answers (stage.js), Leaflet OSM tiles
      (custom tile layer in map.js).
- [x] Stale-while-offline: a cached answer is used when the network fails.
- [x] Settings line on the start screen: cache size + CLEAR.

### Commit 3 — fine tiles (`src/fine.js`)
- [ ] 170.67 m tiles (16 coarse cells) at 1 m from the same WCS, chosen along
      the road within ±100 m of road points near the car (route samples or
      RoadNetwork segments), priority by distance, ≤ 30 live, disposed > 900 m.
- [ ] Carved with the same corridor profile + start pad; `world.sample` /
      `sampleBase` answer from fine tiles first (physics feels 1 m).
- [ ] Fine mesh: 1 m within 250 m, 2 m beyond, skirts; coarse chunk geometry
      gets holes under ready tiles (cell-aligned), rebuilt one chunk per frame.
- [ ] Re-carve tiles when a chunk's OSM roads arrive; tests with a fake DEM.

## Assumptions
- "1 m tiles" = 1 m elevation samples (Kartverket's national DTM) in a band
  of ±100 m around roads; the 10 m grid stays for everything else.
- Trees/houses placed before a fine tile arrives are not re-snapped (±1–2 m).
