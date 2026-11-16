# Unity + WebAssembly rewrite, phase 0 (2026-11-16)

User: "Do full gpu based implementation, make sure to keep old js
implementation in an own folder. Try to find some good carmodels readymade
for unity online that fits the format."

- [x] Move the JS game to `legacy-js/`; Pages workflow builds, tests and
      deploys from there (site URL unchanged).
- [x] `unity/` skeleton: Core assembly (EPSG:25833 coords, floating origin,
      HeightGrid, IGround, seeded RNG, log), manifest, conventions.
- [x] Rally.Geo: source interfaces, Kartverket/Overpass/SR16/NVDB/OSRM
      clients, IndexedDB cache bridge, circuit breakers, fakes, tests.
- [x] Rally.World + Rally.Roads: tile scheduler, GPU clipmap terrain,
      compute carve (+ Burst fallback), scatter/indirect vegetation, water,
      extruded OSM buildings, road graph, grader, ribbon, TileWorld : IGround.
- [x] Rally.Track + Rally.Vehicle: StageRoute, pace notes, faithful CarSim
      port with the JS tests ported.
- [x] Rally.Actors: spawn rules + crossing FSM (animals, pedestrians).
- [x] Rally.Gameplay / UI / Presentation / Net: game flow, HUD, cameras,
      CRT feature, PeerJS room.
- [x] Web template, BuildWeb editor script, unity.yml CI, Pages serves the
      build under `/unity/`.
- [x] Car models: research free Unity-ready models → `unity/docs/car-models.md`.
- [x] Docs: README, ARCHITECTURE, CHANGES, unity/README.

- [ ] Integration review (cross-layer signatures, asmdef graph) + GameController + SCENE.md.
- [ ] User (2026-11-16): DTM tiles preload and render while driving — velocity-led
      ring ahead of the car (LEAD 2800 / LOAD 4400 / KEEP 5300 m as in stream.js),
      next RoadWalk sector prefetched in endless mode, terrain visible as soon as
      heights land, never a blocking frame, coarse → fine handover without a jump.
- [ ] User: open in Unity 6000.6, fix compile errors, create the bootstrap scene, run EditMode tests.

Not possible here: Unity is not installed on this machine, so nothing in
`unity/` has been compiled. First open in the editor will surface API
mismatches; see the review section when it exists.

---

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

## P. Graded roads, stage on map, reach 2026-11-14 (user requests)
- [x] `smoothRoadHeights` (±45 m × 3) for stage, streamed and OSM roads; test.
- [x] Map opens on the current stage + car pin; Leaflet animations off.
- [x] LOAD 4400 / KEEP 5300 / LEAD 2800.
- [x] Local cache (≤10 GB, IndexedDB, LRU) in front of DEM/Overpass/NVDB/SR16/OSRM/tiles; start-screen size + CLEAR.
- [x] Rooms: any player's stage change propagates (guest → host → others); verified live with two tabs.
- [x] Roads drawn once: corridor mesh covers only the slopes outside the ribbon.
- [x] 1 m corridor tiles (`fine.js`): ±100 m of roads, holes in the chunk mesh, physics from tiles; tests.
- [x] Solid houses (`BuildingIndex`, push-out in car.js, thud); road band coloured as road, no land-cover tint on it.
- [x] Terrace profile: two-lane 6.5 m + 1 m shoulders in a 16 m cut-through, single-lane 2.5 m + 1 m in 6 m; rims smoothed along the road; flat only shoulder to shoulder.
- [x] Perf: minimap terrain + road network cached (was redrawn every frame), ribbons merged per chunk, lazy tile picking, debounced hole rebuilds; 27–44 ms → 7 ms per frame at Venabygdsfjellet.
- [x] Continuity: crossing roads keep going, junction/crossing heights eased, 2D Chaikin on OSM bends with pinned junction nodes; F10 debug window with coordinates.
- [x] Junctions: rims and terrace meshes meet other roads at their surface; shoulders 1.5 m; minimap re-centres at the halfway mark.
- [x] Phone debug (triple-tap speedometer), share links (`?route=` / `?drive=`), sliding levels 0–3 (0 minimal default).

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

## Robust start/finish snapping (2026-11-16)
- [x] `stage.js`: `snapToRoad(point, { profile, radius: 1000 })` via OSRM `/nearest`; route requests send `radiuses=` for the ends; one 1000 m limit for every profile; clear "no road within 1 km" message.
- [x] `map.js`: snap A and B when placed, dragged or typed, and again when the profile changes; move the pin, say how far it moved and onto which road; keep the raw pick for off-road.
- [x] `main.js`: wire `onSnap`.
- [x] Tests for the URL builder and the nearest-response parsing.
- [x] Docs: README routing tips, index.html status/help text, CHANGES, ARCHITECTURE.
- [x] Browser check on the 2D map.
- Review: verified in the browser — hill pick above Jørpeland snapped 455 m, town pick 92 m onto Stålverksvegen, plateau pick with driving warns "no driving road within 1 km", foot finds the trail 80 m away, GENERATE builds a 2.68 km stage with `radiuses=` accepted by router.project-osrm.org. Also fixed the "OSRM: NaN km" status after a streamed route (it read the streamed result's missing distance instead of the geometry's).
