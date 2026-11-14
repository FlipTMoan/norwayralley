# Plan 2026-11-13 — car physics, Porsche 911 model, map-driven world

Requested (user, 2026-11-13):
1. Car must not cut through the road; physics should feel better.
2. Car model: less chunky, Porsche 911 silhouette.
3. Forests from NIBIO map overlays (tree density + type).
4. Houses rendered according to map data (OpenStreetMap footprints).
5. Fields and waterways.

## A. Road / physics (root causes found)
- [x] **Staircase carve.** `terrain.carveRoad` and `stream.carveChunk` give every
      ground cell the height of the *nearest route sample* (first sample at
      weight 1 wins), so along a 10 % grade the physics ground is a flight of
      0.4–0.5 m steps every 4–5 m while the ribbon mesh interpolates linearly.
      The car therefore sinks into / floats above the ribbon and bounces.
      Fix: carve per *segment*: project each cell onto the segment, lerp the
      target between the two sample heights, nearest segment wins.
- [x] **Ribbon sits 0.16–0.22 m above the carved ground** (lift + crown) while
      the car rides on the ground sample → wheels always 20 cm inside the slab.
      Fix: export the ribbon lift/crown from stage.js and let the car add it
      (blended over the shoulder) to its ground height when on the road.
- [x] **Suspension sinks 0.55 m** (`bounce` clamp) → body through road on
      landings. Clamp to about -0.16 … +0.22 and absorb landings visually
      with wheel travel instead of the whole body.
- [x] **Wheels never move.** `wheelCompression` is computed and unused; place
      each wheel on the ground under it (in car-local space) so wheels follow
      the surface instead of hovering/clipping.
- [x] **Hillside pull on the road.** Slope gravity samples the gradient at
      ±6 m; a 5.4 m half-width road carved into a hillside reports the blend
      slope, so the car is dragged sideways on a flat road. Use ±1.8 m when on
      the road.
- [x] Verify locally (dev server, drive the demo stage) before moving on.

## B. Porsche 911 model (car.js `buildModel`)
- [x] Body as an extruded side-profile Shape (the flyline: low nose, raised
      round headlamps on the fenders, fast windscreen, long sloping fastback
      to the engine lid), greenhouse as a second, narrower extrusion in glass,
      roof skin + engine lid in paint, ducktail spoiler, round headlamps,
      rear light bar, wheels r=0.33, wheelbase 2.45, track 1.55.
- [x] Keep: roof number, blob shadow, dust, materials/palette (flat shaded).

## C. Land cover from NIBIO (forests, fields, bog, water) — after research
Research agent is checking which services are CORS-callable from a static site.
- [x] `landcover.js`: per chunk, fetch an AR5 WMS image (arealtype +
      treslag/bonitet) at ~4 m/pixel, read pixels in a canvas, classify by
      legend colour into a class grid {forest-conifer, forest-deciduous,
      forest-mixed, field, pasture, bog, open, built, water} + density.
- [x] (not needed: SR16 has CORS *) If NIBIO has no CORS: fallback to Overpass polygons (`landuse=forest`
      /`natural=wood` with `leaf_type`, `landuse=farmland|meadow`,
      `natural=water`, `natural=wetland`) rasterised client-side.
- [x] Trees: `scatterChunk` samples the class grid — density and species per
      cell (spruce/pine cones vs birch/deciduous blobs, size from bonitet);
      none on fields, water, built-up or roads.
- [x] Fields: chunk mesh (vertex tint) gets a per-chunk land-cover texture (canvas) so
      fields read as flat light patches with furrow stripes; bog brownish.
- [x] Attribution line in the start screen / HUD foot (NIBIO AR5, CC BY 4.0).

## D. Waterways (OSM) and lakes
- [x] Overpass per chunk: `waterway=river|stream|canal` lines, `natural=water`
      polygons. Rivers → ribbon mesh (water material) following the terrain;
      lakes → flat water polygon at the lake level, terrain under it
      flattened in the carve pass. Streams narrower.

## E. Buildings from OSM footprints
- [x] Overpass `out geom` instead of `out center`; minimum-area bounding
      rectangle of the footprint → true yaw and size; `building=*` type →
      height/roof/colour family (house, barn/farm, garage/shed, church,
      industrial/commercial, apartments).
- [x] One Overpass request per chunk shared by buildings, landuse, water.

## F. Docs
- [ ] README, CHANGES.md (new), ARCHITECTURE.md (new), help text.

## G. Road signs (added 2026-11-13, user request)
- [x] `signs.js`: NVDB API v4 Skiltplate + Fartsgrense per chunk, sign textures, posts along the route.
- [x] Integrate in stream.js (rebuild on route change).

## H. Car feel (user feedback 2026-11-13)
- [x] Faster: 430 Nm, less damping → ~160 km/h; chase FOV widens with speed.
- [x] Roads narrowed to real gravel widths (3.2–3.4 m half width).
- [x] Proportions: bigger wheels in larger arches, tucked flanks, narrower flatter roof, seated headlamps.

## I. Free drive (user request 2026-11-13)
- [x] `roads.js`: OSM highways per chunk → carve, ribbons, RoadNetwork index.
- [x] `createStreamingWorld({ center, freeDrive })`, car rides the network, spawn snaps to the first road.
- [x] Map picker button FREE DRIVE HERE; HUD hides progress; no finish.
- [x] Overpass robustness: queue, mirrors, breaker, retries; SR16/NVDB independent.
- [x] Verified live: SR16 forests + NVDB signs on a streamed stage; OSM houses/water/roads via mocked Overpass and, later, live on the demo tile through the openstreetmap.fr mirror.

## O. Houses + country mask 2026-11-14 (user requests)
- [x] Overpass: remember the answering mirror, race when unknown, penalise failures (houses in 6 s, not 75 s+).
- [x] 2D map: Norway outline mask (geoBoundaries, bundled, simplified), hidden above zoom 11.

## N. Menu, planted buggy, saved routes, Norway map, credit 2026-11-14 (user requests)
- [x] MENU button (+Esc) back to the start screen, stage kept; R restarts.
- [x] Buggy `planted` handling in normal mode (measured: 3° slip vs 911's 6°).
- [x] `saved.js` named route list + map footer row (save / load / delete), tests.
- [x] Map boxed to Norway (maxBounds, tile bounds, mask, min zoom).
- [x] Start-screen credit line.

## M. Climb limits + track strength 2026-11-14 (user request)
- [x] g·sin θ slope gravity; `maxClimb` 30° (911) / 80° (buggy) with grip floor below, cos θ load above; tests.
- [x] Tracks: per-mark alpha by surface (off-road clear, gravel medium, asphalt faint, rubber/foam strong).

## L. Splash 2026-11-14 (user request)
- [x] `waterAt` lookup (sea / shore / lakes / rivers) on both terrains.
- [x] Car: entry + plunge splash, bow spray, drag, wet grip, drowned engine, recovery to last dry ground.
- [x] Foam wake in tracks.js, splash + wading audio, HUD WATER label; tests in `tests/splash.test.mjs`.

## K. UI simplification 2026-11-14 (user request)
- [x] One route picker: minimap click → 2D map; off-road A* and typed `lat, lon` folded in.
- [x] Removed 3-D route builder, OSRM coordinate panel, minimap double-click, CLEAR, 2D MAP / ROUTE BUILDER buttons.
- [x] Plan and review in `tasks/plan_20261114.md`.

## J. Session wrap-up 2026-11-13 (late)
- [x] Gearbox auto/manual, 911 gear spans, 12 000 rpm, RPM HUD.
- [x] Car-centred minimap with click-to-route; NVDB Vegdekke surfaces; surface-aware handling; bicycle steering.
- [x] Handbrake drift (locked rears, inertial velocity), demo tile gets OSM houses/water + NVDB signs.
- [ ] Open: Overpass public mirrors are the weak link (rate limits / outages); consider a self-hosted or cached tile source if it keeps failing.
