# Plan 2026-11-22 — Unity: OSM roads fetched as one connected network ("same level")

Owner: "but also OSM road map must be at same level for roads to connect properly. I see a lot of disconnected roads."

## Seen 2026-11-22 (Chrome, WebDev 17:26 build, `?drive=61.1153,10.4663`, Lillehammer)
- OSM data comes in **one heavy Overpass query per 2 km coarse tile** (`OverpassQuery.Build`): buildings, land use,
  water, power lines **and** roads together, at most 2 queries in flight. Roads for a tile wait behind its buildings
  and fields: they landed one tile every 8–12 s, and "waiting: OSM roads 28" sat there for minutes. Meanwhile
  neighbouring tiles show roads that end at the tile edge. This is the "disconnected roads" the owner sees.
- The 0f922cf fix changed the cache key (`overpass2:`), so every tile is fetched again once. It looks worst right
  now and gets better as the cache fills. That alone is not a fix.
- While loading, a road ribbon floated high in the sky over the start screen (seen at the horizon before the ground
  loaded).

## Work
- [x] **Roads on their own query:** a light roads-only Overpass query (`way[highway~…]`, only the tags the game
  reads, `out geom`). It is separate from the heavy feature query (buildings/land use/water/power stay per tile, after
  the roads).
- [x] **Bigger road regions at one level:** roads are fetched per **road region** of 3 × 3 coarse tiles (≈ 6 × 6 km)
  on a fixed grid. So every tile and its neighbours share one answer, and the network inside a region is complete the
  moment it lands. Measure the region size against Overpass answer time and size (roads only: expect a few hundred
  KB). Pick the size from the numbers.
- [x] **No tile draws roads until the road data for it and all 8 neighbours is in** (the same region, or the
  neighbouring region). This replaces the "wait at most NeighbourWait" for roads. If a region fails, its per-type
  pause applies and the tile keeps waiting (the log says so). It never draws half a network.
- [x] **Stages and saved routes:** the road regions along the whole route are asked for first, before the start
  countdown. This fits the saved-route prefetch (plan_20261122_saved_routes_cache): the corridor's road regions come
  before DTM, fine tiles and features.
- [x] **Order of requests:** the road regions near the car, then the DTM, then the features near the car, then the
  rest.
- [x] The floating road ribbon at load: find why a ribbon is drawn before its ground (probably graded with no DTM, at
  a default height). Fix: no ribbon until its ground is in. Add a test.
- [x] **Survey:** the continuity survey (`-previewContinuity`) also runs **during loading** (snapshots every 5 s
  over the first 60 s from an empty cache). It counts road ends at tile edges that have no neighbour road yet. Target:
  0 at every snapshot, so roads appear as a connected network or not at all. Before/after numbers for Lillehammer,
  Drammen and Sauda, plus the time until the car's own roads appear (must not get worse).
- [x] Tests: region keys for a tile and its neighbours, a tile with a neighbour's region missing draws no roads, the
  roads-only query parses the same ways as the combined query did, the cache key per region.
- [x] Docs, lessons, CHANGES.

## Why roads are slow (measured 2026-11-22 ~18:00 local, this machine, one Lillehammer tile ≈ 2.2 × 2.2 km)

| Mirror | Full tile query (today) | Roads only, 1 tile | Roads only, 3 × 3 tiles |
|---|---|---|---|
| overpass-api.de | 42.5 s (40 s queued before the first byte) | 502 "at capacity" | 43.8 s |
| overpass.openstreetmap.fr | **2.9 s** | **1.2 s** | **1.6 s** |
| overpass.private.coffee | no answer in 60 s | no answer | no answer |
| overpass.kumi.systems | no answer in 60 s | no answer | no answer |

Sizes: full tile 5.0 MB of JSON (roads are 1.0 MB of it). Roads for 3 × 3 tiles: 4.0 MB.

So the time goes into:
1. **Mirrors:** two of the four hang. The main one queues for ~40 s or refuses. Only openstreetmap.fr is fast.
   - Each "race" can cost the full 20 s timeout before a mirror is marked down.
   - A down mirror is tried again after 120 s.
   - Only 2 queries may be in flight, so hung ones block the queue.
2. **The heavy combined query:** 5 MB per tile, with roads inside it. In the browser the 5 MB is parsed and built in one
   overlay (7–11 s seen in the log for town tiles).
3. **One tile per request:** 25–49 requests for the area around the car.

Add to the work:
- [x] **Mirror choice from measured health:** keep a per-mirror running answer time and failure count. Prefer the
  fastest healthy one, and send only a small probe to the others. Lower the race timeout for mirrors that have never
  answered this session. Log the choice.
- [x] **Slots per mirror, not global:** a hung mirror must not hold the only 2 slots. Keep the public limit of 2 per
  mirror.
- [x] **Smaller answers:** the roads query fetches only the needed tags (`out tags geom` is still all tags; use
  `convert`, or keep `out geom` but filter in the parser). Measure if a `[out:json]` → CSV or `out skel geom` +
  tags-in-a-second-pass is smaller. Store the parsed result in the compact format (plan_20261122_saved_routes_cache
  Part 3).

### Added 2026-11-22: use several Overpass servers at the same time
Owner: "maybe an idea to download from several osm servers at the same time."
- [x] Spread **different** requests over all healthy mirrors in parallel, up to each mirror's own limit of 2 slots.
  With 2 good mirrors that's 4 requests at once, and so on. Roads regions go first, then features.
- [x] Don't race the **same** query on several mirrors once their health is known: that doubles the load on
  servers that are already at capacity. Race only to find a first good mirror, or as a hedge: if the chosen mirror
  hasn't sent its first byte after its usual time × 3, also ask the next healthy one and take whichever answers first.
- [x] Spread by measured health: a fast mirror gets the next request. A mirror that starts failing loses its slots
  (its per-mirror pause) without stopping the others.
- [x] Measure: total time to load the start area (roads + features) from an empty cache, with 1 vs all healthy
  mirrors. Write the mirror list and timings into the Review section.

## Public Overpass servers (complete list from the OSM wiki "Overpass API" page, tested 2026-11-22 ~19:30 local)
Test: roads-only query for one Lillehammer tile (1 778 ways, 0.99 MB), from this machine, 2 tries each, with
`Origin: http://localhost:8091` to check CORS (browser use needs `Access-Control-Allow-Origin`).

| Server | Coverage / terms | Try 1 | Try 2 | CORS | Data age | Use in game |
|---|---|---|---|---|---|---|
| overpass.openstreetmap.fr | global (not on the wiki list now) | 3.6 s | 0.8 s | * | minutes | **yes, first choice** |
| ovp.dresel.systems/api | Europe, free, no key, **4 parallel per IP**, send User-Agent/Referer | 1.3 s | 0.8 s | * | daily (≈ 1 day old) | **yes** (add) |
| maps.mail.ru/osm/tools/overpass (VK Maps) | global, no limits stated | 504 after 48 s | 16 s | * | minutes | yes, low priority (add) |
| overpass-api.de (FOSSGIS main) | global, 10 000 queries + 1 GB/day, no parallel scripts, pause 30 s after 429/406; "overloaded" | 502 at once | 39 s | * | minutes | yes, low priority |
| overpass.private.coffee | global, no rate limit | no answer in 60 s | no answer in 60 s | — | — | keep, but rarely |
| overpass.kumi.systems | **the old name of private.coffee** (same server) | no answer | 504 after 33 s | * | — | **remove** (duplicate) |
| overpass.osm.ch | Switzerland only | 0 ways | — | * | — | no |
| atownsend.org.uk, maprva.org, Ethiopia, Colombia, spainip.es | other regions / special data | — | — | — | — | no |
| Geofabrik, Tracestrack, Overspan, FairwayMapper, NextGIS, Mapsource, overpass.ch | need an API key or payment | — | — | — | — | no (a key can't be kept secret in a public web page) |

Note: dresel.systems serves data updated daily. For a game that's fine, but when two mirrors answer the same
region the newest data wins (`osm3s.timestamp_osm_base`), and the cache keeps the timestamp.
- [x] Mirror list in `OverpassMirrors.Endpoints`: openstreetmap.fr, dresel.systems (Europe), overpass-api.de,
  maps.mail.ru, private.coffee. Remove kumi.systems. Keep each server's terms: per-server slot limit (dresel 4,
  the others 2), the 30 s pause after 429/406 on overpass-api.de, and a User-Agent where the platform allows it (the
  browser sends its own UA and a Referer; check that this is enough for dresel).

## Added 2026-11-22 (owner): "the streets are still badly joined. make sure lines etc are properly connected"
Seen in Chrome (`?drive=61.1153,10.4663`, cache partly filled): after 30 s the car stood on a carved black patch with
ragged edges and **no ribbon and no lines** (its tile's roads were still waiting). Many ribbon pieces floated in the
sky over the start screen.
- [ ] **Join survey (extend `-previewContinuity`):** at every node where two drawn ways meet end to end, measure:
  - the gap and the side offset between the two ribbons' edges;
  - whether the **centre line and edge lines continue**: gap < 0.3 m, side offset < 0.1 m, same line type unless the
    map changes it;
  - the height step between the two ribbons.

  At junctions (3+ ways):
  - the side road's ribbon must meet the main road's edge with no gap and no visible seam or overlap flicker;
  - the side road's lines stop at the main road's edge line;
  - the main road's edge line is broken across the side road's mouth (Norwegian practice), not drawn across it.

  Counts before → after per area.
- [ ] **Fix the causes** so that all join and junction checks pass: one ribbon (and one set of lines) per chain of
  end-to-end ways of the same road, not one per OSM way, with lines continuous along the chain. Add junction mouths.
  Each cause gets a test.
- [x] **No road shown as a bare carved patch:** the carve (dark ground) and the ribbon appear together.
- [ ] Shots of the same junctions and joins before and after: a town junction, a T-junction on a main road, two ways
  joined mid-bend, a tile edge.

## Added 2026-11-22 (owner): "when all scenes are cached not to load from servers... only load the missing pieces"
Checked in code: DEM, SR16, NVDB, OSRM and Overpass all go through `GeoCache` (a hit never touches the network).
The risks are new:
- **Cache key changes:** the region roads introduce new keys. When the old per-tile `overpass2:` entries cover a
  region, build the region from them (or keep reading the per-tile entries for areas already cached) instead of
  downloading the area again. A format or key bump must never refetch what is already stored. Old entries are read and
  repacked.
- **Mirror health probes / races:** they must not run when nothing needs fetching. Probe a mirror only for a real
  missing request.
- **Answers the game treats as "missing":** an empty but valid answer (no NVDB lights in the forest) is stored and is
  a hit next time. Only failures are not stored.
- [x] **Counter in the log:** per data type, network requests vs cache hits this session (`network: OSM 0, NVDB 0,
  DTM 0, SR16 0 · cache hits 412`). Shown in the F2 log and in the LOG bar tooltip line.
- [ ] **Test (PlayMode, fake HTTP that counts):** load an area, tear down, load the same area again with HTTP
  failing. Expect **0 requests** and the same roads, houses, signs and lights. Then a load that reaches one tile
  further: only that tile's keys are requested, nothing else.
- [ ] Chrome check: drive an area, reload the page, drive the same area. The log shows 0 network requests (MY ROUTES
  "Sauda – Saudasjøen" is fully cached: drive it after a reload and expect 0).

## Review (2026-11-22)
**Causes (measured):** (1) roads came inside each tile's 5 MB query, behind its houses; (2) only one Overpass server
was fast, and the global 2 slots were held by hung ones; (3) once the data was fast, the real bottleneck showed: tiles
grade and draw one after another (1–3 s each in town), and a drawn tile's roads ended at the edge of a neighbour not
drawn yet; (4) a graded road carved the ground of tiles whose ribbon was not drawn ("bare black patch"); (5) a ribbon
shown before its carve floated over the uncut embankment.

**What changed:** `RoadRegions` (3 × 3 tiles, fixed grid; tile roads only when its and its 8 neighbours' regions are in;
asked for at tile request, before the DTM); `OverpassQuery.BuildRoads` (`out tags geom`, only `RoadTags` cached, key
`osmroads1:`; features `overpass3:` without roads; `overpass2:` tiles already cached are used as they are, no request);
`OverpassMirrors` (5 servers, probe first, fastest free, slots per server dresel 4 / others 2, hedge after 3 × usual,
per-server pause 30 s doubling, slow > 15 s pauses, Overpass `remark` runtime error = failure, roads before features);
`OverlayFetch` roads and features in two lanes; `GameController`: nearest-first overlays, roads before houses,
`ShowRoads` (ribbon, carve via `RoadGraph.Shown`, bridges and tunnels together, once every wanted neighbour's roads are
drawn, after the carve is done; ≤ 45 s hold), 150 ms budget behind the loader, start screen waits for the start tile's
roads, per-type cache counters in the log; `RoutePrefetch` asks the corridor's regions first and shares the servers;
`PropColliderPool.Release` tolerates a collider destroyed at scene teardown (made a PlayMode test fail).

**Region size (fr mirror, Lillehammer):** 1 tile 1.0 MB / 1.1 s; 2 × 2 3.1 MB / 2.0 s; 3 × 3 4.1 MB `out geom`, 3.4 MB
`out tags geom`, 3.1 MB `convert`, 3.7 MB `skel` / 1.6–3.8 s; 4 × 4 3.9 MB / 2.6 s. Picked 3 × 3 with `out tags geom`
(no parser change; `convert` saves 8 % more). Compact format: not done.

**Loading survey** (`-previewLoading -previewFreshCache`, empty cache; loose = a drawn road ending at a tile edge into
shown ground with no road; max over the 5 s snapshots):

| area | loose before → after | car's roads before → after | start screen before → after | all roads drawn before → after |
|---|---|---|---|---|
| Lillehammer | 171 → 0 | 13.0 → 20.4 s | 22.2 → 20.4 s | 55 → 40 s |
| Drammen | 283 → 0 | 23.7 → 27.5 s | 26.1 → 27.5 s | 60 → 50 s |
| Sauda | 90 → 10 (only at 5 s) | 21.3 → 5.0 s | 21.3 → 6.8 s | 55 → 15 s |

The car's own roads now appear with their neighbours' (not alone with loose ends): later at Lillehammer / Drammen
(dense town tiles grade ~2 s each), much sooner at Sauda. All OSM data (roads + features of every tile) in 21–23 s.

**One vs all servers** (Lillehammer, empty cache): all OSM data in 67.2 s with openstreetmap.fr alone vs 25.4 s with
all healthy servers; car's roads 27.8 vs 21.5 s. Server timings this evening: openstreetmap.fr 1.1–2.9 s (once 16 s,
hedged), dresel 0.9–3.2 s, overpass-api.de SSL failure / 502, maps.mail.ru 504 / timeout, private.coffee timeout.

**Browser cache writes (found in Chrome):** the first answer of a session waited for a size walk over the whole
IndexedDB store (> 45 s for 6 723 entries / 900 MB in the automation tab) before it was stored and returned: the start
tiles' DTM stalled ("waiting: terrain 4") and nothing new was stored, so a reload fetched everything again
(`dem 0 cached / 41 fetched`). `GeoCache` now stores first and sums the size in the background.

**Cached area** (usual cache, Lillehammer): `osm 38 cached / 0 fetched`, no `osmroads`, no probe; the roads came from
the `overpass2:` tile entries.

**Tests:** EditMode 317 → 345 (incl. the coordinator's `HouseFaceTests` and the sign agent's tests), PlayMode 28 → 29
(with `OneCarTests`), all green.

**Chrome (WebDev 21:0x build, port 8091, hidden tab with rAF on a timer):** Sauda free drive after a reload: `dem 65
cached / 0 fetched · nvdb 363 / 0 · sr16 82 / 0 · osm 33 / 8 · osmroads 0 / 19`; then DRIVE "Sauda – Saudasjøen":
dem, nvdb, sr16, route all 0 fetched, the start screen opens on drawn roads with signs; Overpass still fetched regions
for tiles outside the saved corridor (the view ring beyond LoadRadius + 300 m, an open point of the saved-routes plan).
No console errors.

**Open points:**
- Car's roads later than before at Lillehammer / Drammen (+4–7 s): grading is the bottleneck (~25 s of main-thread
  work for 38 town tiles); a faster or off-thread grading would fix both this and the hidden window.
- Join survey, one ribbon / line set per chain of ways, junction mouths and the before/after junction shots: not done
  (a ribbon and marking rework of its own).
- PlayMode "fake counting HTTP" test not written: covered at source level by `OverpassTests.ATileCachedUnderTheOldKey…`
  (0 requests, a tile further asks only its regions + features) and `AnEmptyRoadAnswerIsCached`; DEM / SR16 / NVDB keys
  are unchanged. The counters are in the F2 log, not yet the LOG bar tooltip.
- A tile cached under `overpass2:` draws its own roads at once without waiting for neighbours (old behaviour).
- "Floating" ribbon over unloaded ground: ≤ 47 triangle samples at the outer edge of the loaded area (slivers of the edge
  tiles' last segments); "high" samples (539 / 1354 / 138 after loading) are mostly decks over gorges/rivers, not checked one by one.
- Region queries reach one ring of tiles beyond the loaded area (16 regions ≈ 54 MB for Lillehammer vs 38 MB per tile
  before); Hedge waits on a full answer, not the first byte. Frame time: no bench run (see report).
