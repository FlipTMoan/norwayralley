# Plan 2026-11-22 — Unity: continuous roads (no sudden ends, no tunnels opening into thin air)

Owner: "There seems to be glitches in roads, roads stopping suddenly, tunnels opening into thin air etc... make sure,
based on map data that roads are continious as expected"

## Goal
Every drivable OSM road the game asks for is drawn as one continuous surface: no gaps, no steps, no seams at tile
edges, and every tunnel or bridge end meets either a drawn road or the ground. This is checked against the map data
by an automatic survey, not by eye.

## Leads (from a first look, not yet confirmed)
- `OverpassQuery.RoadClasses` has no `*_link` classes (`motorway_link`, `trunk_link`, `primary_link`,
  `secondary_link`, `tertiary_link`). Ramps and junction connectors are never fetched, so roads stop at junctions,
  and a tunnel or bridge whose next way is a link ends in the air. Other drivable values to consider: `road`,
  `busway`. Not `construction`, and not `path`/`footway`/`cycleway`.
- Ways whose geometry or height is dropped when a neighbour tile isn't loaded yet, and not re-added later (the
  open point already listed for signs and lights).
- Tunnel portals: the tube ends where OSM `tunnel=yes` ends, but the next way may sit lower or higher than the DTM,
  or be missing, so the portal opens onto a drop.
- Height steps at joins between ways graded separately (lessons 2026-11-20: steps of 6–20 m were found before).
- Ribbons clipped at tile borders with a gap or overlap.
- Ways dropped by filters (too short, `area=yes`, access tags) and leaving a hole.

## Work
- [x] **Survey tool** (editor, headless): load the real data for a list of areas. For every fetched highway way,
  walk it every 2 m and record:
  - **gap:** no drawn road surface under the line.
  - **step:** the height changes by more than 0.5 m within 2 m along it, or two joined ways differ at the shared node.
  - **open portal:** a tunnel end with neither a drawn road nor ground within ±1.5 m of the tube floor.
  - **open bridge end:** a bridge deck end with neither road nor ground at the deck height.
  - **tile seam:** a gap or step across a tile border.

  Also compare against the full OSM highway set (including the classes we don't fetch) and list drivable ways that
  touch fetched ways but are missing. Write a CSV and a summary per area.
- [x] **Areas:**
  - Lillehammer town.
  - Nestunnelen and the tunnel areas from the 2026-11-20 tunnel work.
  - A motorway junction with ramps (E6 Hamar or E18 Drammen).
  - Lærdal/E16 (tunnels and bridges).
  - Geiranger hairpins.
  - Sauda (rural).
  - Vinje/E134.
  - One area that spans four tiles at a tile corner.
- [x] **Baseline:** survey numbers before any fix. Store them in the Review section.
- [x] **Fixes (root causes only, each with a test that fails before and passes after):**
  - The missing `*_link` classes, and the class mapping for them in `RoadGraph` (link = class of its parent road,
    narrower, never "barred" unless its tags say so). Check stage routing and the barred rules still behave
    (motorway links stay barred like motorways).
  - Whatever else the survey shows (late neighbour, portal ends, seams, steps).
- [x] **After:** re-run the survey. Target: 0 gaps and 0 open portals/bridge ends on fetched drivable ways in all
  areas, and steps only where the real road is that steep. List anything left with the reason.
- [x] **Check:** EditMode + PlayMode green. PreviewShots before/after at the worst spots. WebDev build loads in
  Chrome with no console errors.
- [x] **Docs:** CHANGES.md, unity/README-world.md, ARCHITECTURE.md if structure changes, tasks/lessons.md.

## Review

### A. Continuous roads (done 2026-11-22)
- **Survey** `PreviewShots -previewContinuity` (`Editor/PreviewContinuity.cs`, run by `scratchpad/roads-continuity/tools/survey.sh`):
  waits for an idle overlay queue, walks every fetched drivable way every 2 m along its graded line and raycasts the
  drawn ribbon (±1.5 m): gap, step (drawn vs own profile > 0.5 m / 2 m), steep (graded profile itself), joint (shared node
  graded > 0.5 m apart), portal / deck end (no road nor ground within ±1.5 m 3 m out), dropped; seam flag; CSV, summary,
  spots, shots; `-previewContSpots` reuses a run's spots. OSM full-set comparison: `tools/osmgap.py`.
- **Areas (all loaded live, Overpass via openstreetmap.fr / cache):** Lillehammer 61.115,10.466; Nestunnelen 59.6433,6.3185;
  E18 Drammen junctions 59.744,10.205; Lærdal 61.099,7.483 (before: only 15 tiles had roads); Geiranger 62.108,7.205;
  Sauda 59.65,6.35; Vinje 59.62,7.99; tile corner 60.67512,10.83214 (UTM 272384, 6733824).
- **Causes found (each confirmed in the survey data and a shot):**
  1. `OverpassSource.Parse` `break` at the 440th house dropped everything listed after it (sorted by id: the newest roads,
     plus land use and water) — the long gaps (up to 2.3 km) that stop at tile borders in towns (Sauda tile: way at index
     794 after the 441st house at 663).
  2. No `*_link` classes: 23–31 link ways per town area touching fetched roads were never asked for (Lillehammer
     trunk_link 1.9 km, Drammen motorway_link 3.4 km). Links: class of their road, one lane unless tagged, motorway/trunk
     links barred. Cache key versioned (`overpass2:`) — the old key had no query in it.
  3. Ways under ~6 m never drawn (`ResampleEven` collapsed < 1.25 m ways to one point; runs < 3 samples dropped):
     connectors at tunnel mouths (Lillehammer way 779172863: tube between a 5 m track and a 1 m service way).
  4. `Covered` from the nearest-road distance: a way going on from another's end, a connector between two roads, a road
     along another's square end were drawn by neither (4–6 m holes at hundreds of joints; also mutual covering after a
     regrade). Now `UnderAnother`: projected inside another's segment, within 0.3 m of its height, by a way that outranks
     it (class, length, id); the segment middle is checked too; not on another ribbon's square end.
  5. A way crossing a tile with no node in it was skipped by that tile (Strømsåstunnelen: 1204 m segment, 204 m of tube
     missing — the "tunnel opening into thin air" in the Drammen shot).
  6. Cul-de-sac loops coming back to their own node: graded as one line, both passes up to 18 m apart there.
  7. Two overlays could step at once (one started in the same frame as the active one); the second could have its roads
     set again halfway (`roads set again` logged before its own grading finished). One steps at a time now.
- **Survey numbers, before → after** (gaps n / m; joints; open portals; open deck ends; dropped):

| area | km walked | gaps | steps | joints | portals | deck ends | dropped |
|---|---|---|---|---|---|---|---|
| Lillehammer | 775 → 958 | 755 / 28 876 m → 9 / 76 m | 81 → 133 | 54 → 37 | 6 → 2 | 8 → 3 | 135 → 0 |
| Nestunnelen | 239 → 253 | 134 / 4 242 m → 0 | 14 → 11 | 8 → 5 | 3 → 2 | 2 → 3 | 21 → 0 |
| Drammen | 856 → 1 192 | 1 135 / 9 338 m → 8 / 20 m | 99 → 164 | 44 → 37 | 2 → 1 | 3 → 2 | 113 → 0 |
| Lærdal | 74 → 131 | 69 / 1 110 m → 4 / 138 m | 2 → 10 | 3 → 4 | 0 → 1 | 1 → 2 | 10 → 0 |
| Geiranger | 59 → 59 | 34 / 128 m → 1 / 2 m | 8 → 8 | 2 → 2 | 0 | 1 → 1 | 6 → 0 |
| Sauda | 276 → 290 | 137 / 4 242 m → 0 | 20 → 20 | 7 → 5 | 3 → 2 | 3 → 4 | 22 → 0 |
| Vinje | 213 → 213 | 101 / 662 m → 3 / 10 m | 15 → 14 | 9 → 5 | 0 | 1 → 0 | 3 → 0 |
| Tile corner | 586 → 595 | 492 / 2 824 m → 0 | 20 → 17 | 7 → 8 | 0 | 0 | 23 → 0 |

  Steps rise with the road km drawn (more junctions); all ≤ 1.5 m by definition of the window. "Steep" (graded profile
  > 25 % over 2 m) is mostly real terrain (median road–ground 0.2 m).
- **Left, with reasons:** Lillehammer trunk_link 495919803 60 m (not looked at); Lærdal: three stacked ferry-queue
  service ways at 3 m (44–46 m each, probably decks over the quay water); Vinje track 242286492 crosses itself at three
  heights (data); portals: Nestunnelen "Sandlager" (OSM tube continues as a non-road way into a mine, ground 14.6 m over
  the floor), Lillehammer track tube 607372489 and Drammen Hegsbroveien (3 m drops, not looked at); Drammen joint 38 m
  at service 220716644 / Haldenlia (not resolved); joints 1–4 m remain at ~5–37 per area (graded per way).
- **Tests:** `RoadContinuityTests` (17: house cap, link query/key, link class/lanes/barring ×5, ramp drawn, 1 m resample,
  connectors at a tunnel mouth, tile crossed without a node, end to end ×2, connector between two roads, road along a
  square end, loop back to its own node, split through road): on the old code 12 of the first 13 failed (the
  residential end-to-end one passes: one-lane ways were not hit), and each later one (connector, square end, loop) failed
  with only its own fix disabled; the tile-crossing one cannot pass without its fix (the tile skipped the way). `OverpassTests` updated (query, key, null on no answer).
- **Shots:** `scratchpad/roads-continuity/before_after_worst.jpg` (Lillehammer gap at a tile border and tunnel mouth,
  Strømsåstunnelen, Sauda, tile corner, Lillehammer trunk); all spots `before/` vs `final2/` (same `continuity_spots.txt`).

### B. A pause per data type (done 2026-11-22)
- **Cause:** `FetchFeatures` awaited roads, features, surfaces, signs, lights and cover in turn; roads come back empty
  (not null) when Overpass fails, so the 45 s retry never ran: a tile without an Overpass answer kept no roads for good.
  NVDB failures returned empty sets (never asked again); only Overpass had a breaker.
- **Change:** `Gameplay/OverlayFetch.cs` (lanes per type into a `TileOverlay`, `ServiceBreakers` Overpass / NVDB / SR16 /
  DTM), `GameController` (`QueueOverlay`, `OverlaySteps` applies what is pending; roads wait once for NVDB's first surface
  answer, again if surfaces land later; signs/lights after roads; features + cover built with what is in; DTM pause in
  `OnTileNeeded`; HUD status shows "NVDB paused 42 s"), `OverpassSource` / `NvdbSource` return null for no answer,
  `TileWorld` rebuilds water / house objects without duplicates, help text.
- **Overpass blocked 45 s (Kongsberg 59.668,9.650, cold cache for NVDB/SR16/DTM, `-previewBlockOverpass`):** before —
  forest, signs and lights waited 20–99 s behind the Overpass timeouts, signs/lights were placed against no roads (0
  posts), and no tile got roads within 163 s (never retried, even after the block ended at 53 s). After — forest 0.5–1 s,
  NVDB signs and lights landed 0.8–3.3 s after the tile was asked; roads came 22–37 s after the block ended and signs
  (796 posts in the start tile) and lights were placed right after their roads.
- **Tests:** `OverlayFetchTests` (5: Overpass failing / hanging, NVDB failing, dropped tile stops, per-service breakers).
- **Open:** the DTM pause only delays a tile's own retry; the blocked-run numbers were taken before the "one overlay at a
  time" fix.

### C. The log says what it waits for (done 2026-11-22)
- `OverlayFetch.Outstanding` / `WaitingText`: per type (terrain, OSM roads, NVDB surfaces / signs / lights, forest) the
  tiles still waiting, with the service's pause; `GameController.ShowProgress` puts it on the LOG bar (`WORLD 51% ·
  waiting: terrain 24 · OSM roads 13 (paused 40 s) · …`, first two + "+n" under 900 px), logs `stream: waiting for X: n
  tiles[, Service paused s]` / `stream: X all in` on changes only, and sets the start loader ("Waiting for OSM roads
  (Overpass busy, retry in 40 s)…"). While loading only the start area's tiles count. Test:
  `OverlayFetchTests.Outstanding_ListsOnlyTheTypesStillAwaited_WithTheirPause`.

### Check
- EditMode 304/304 (was 281), PlayMode 27/27; WebDev build succeeded. Chrome (port 8091, `?drive=61.10318,10.40615`, the
  former 2.3 km Vottestadvegen gap): loads, no console errors; loader "Waiting for terrain…" then "Waiting for OSM
  roads…"; LOG bar `WORLD 7% · waiting: terrain 36 · OSM roads 25 · NVDB surfaces 25 · …`; the car on the gravel road,
  which continues (`scratchpad/roads-continuity/chrome_waiting_logbar.jpg`).
- Bench (editor, compute path, GTX 1060 shared with Chrome; drive_60s avg ms, 3 runs each; before = HEAD runtime via
  stash): Lillehammer 8.37 / 7.89 / 8.83 → 8.80 / 8.48 / 8.81 (median 8.37 → 8.80, +5.1 %; triangles 2.98 M → 3.72 M:
  ~25 % more road drawn — links and the roads that were lost); Toten 8.34 / 10.03 / 9.41 → 8.44 / 8.31 / 8.36 (median 9.41 →
  8.36, the before runs were noisy). Static poses within ±8 % run to run. (Bench runs were before the waiting-for line, which
  only formats a string every 0.25 s.)

## Added 2026-11-22: a pause per data type, not for all downloads

Owner: "when fetching data of a certain type, make sure a pause does not stop all downloads, the pause should be by
data type."

**Found (code read, 2026-11-22):**
- `GameController.FetchFeatures` starts all six fetches for a coarse tile, then **awaits each one in turn** before
  the tile's overlay is built:
  - OSM roads and features (Overpass)
  - NVDB surfaces, signs and lights
  - SR16 forest

  So one slow or paused source holds back everything else for that tile. For example, Overpass racing its mirrors
  for up to 20 s, or its 60 s breaker, delays NVDB signs and lights and the forest even though they have already
  arrived.
- When roads come back empty, the whole `FetchFeatures` waits 45 s and **runs again for every type**. Signs, lights,
  surfaces and forest are asked again and the overlay is rebuilt, though only Overpass needed a retry.
- The breaker (`CircuitBreaker`) exists only for Overpass. NVDB, SR16 and the DTM have no per-service pause, so a
  failing NVDB is asked again on every tile.

**Work:**
- [x] Each data type is fetched and applied **on its own**. A type that arrives applies to the tile at once. A type
  that is paused or failed is retried on its own schedule, without delaying or re-asking the other types.
  - Roads stay first where others depend on them: signs, lights and verges are placed against the roads, and are
    placed or re-placed when the roads land.
  - DTM before roads stays as it is.
- [x] One breaker and retry timer **per data type**: Overpass, NVDB, SR16 and the DTM. A type that fails trips only
  its own breaker. The HUD/log shows which type is paused ("NVDB paused 60 s").
- [x] Tests:
  - Fake sources where Overpass hangs or fails: NVDB signs and lights and the forest still reach the tile, and NVDB
    isn't asked again when only Overpass is retried.
  - The other way round: NVDB fails, roads still come.
  - Per-type breaker state.
- [x] Docs as above. In the review: the time to the first signs and lights with Overpass blocked, before vs after.

### Added 2026-11-22: the log says which data it is waiting for
Owner: "In the log, indicate which data one is waiting for..."
- [x] The LOG bar progress line names the data types still outstanding, with counts, and the paused ones with the
  time left. For example: `WORLD 51% · waiting: terrain 24 · OSM roads 13 (paused 40 s) · NVDB signs 3 · forest 2`.
  The bar shows only the types with something outstanding, in a fixed order. On a phone it is shortened to the first
  two plus "+n".
- [x] The log window (F2) writes a line when a type **starts or stops being the thing the world waits for**
  ("waiting for OSM roads: 13 tiles, Overpass paused 60 s"), not one line per tile.
- [x] The start screen loader ("Fetching terrain…") names the type it waits for in the same way, so a long wait for
  the start roads says "Waiting for OSM roads (Overpass busy, retry in 40 s)".
- [x] Test: per-type outstanding counts from fake sources (one type held → only that type listed, the count drops when
  it lands, a paused type shows its seconds).
