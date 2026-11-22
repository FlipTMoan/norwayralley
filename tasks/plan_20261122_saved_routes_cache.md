# Plan 2026-11-22 — Unity: saved routes, a route's download kept locally, compact cache formats

Owner: "Also when user makes a route by writing names of stop and start the route should be saved in a editable
list (possible to delete later). The download for that route should be cached locally. Try to work out compressed
dataformats for storing the elements of the scenery."

## Today
- A route stage is made on the MAP: the START and FINISH boxes search Kartverket stedsnavn
  (`WebGLTemplates/Rally/index.html`, "Place search"), or the user clicks two pins. OSRM routes it. The stage is
  only a share link (`?osrm=…`); nothing is saved.
- The cache (`GeoCache`: IndexedDB in the browser, files in the editor/desktop) stores each **raw download** by URL,
  with LRU eviction under a budget (≤ 32 GB, 10 % of the disk kept free). Nothing is pinned, so a long route's tiles
  can be evicted by later driving.
- Measured on this machine's cache (1.45 GB, 9 040 entries, 2026-11-22):

| Kind | Entries | Size | Avg | Format today |
|---|---|---|---|---|
| dem (Kartverket DTM) | 1 490 | 845 MB | 567 KB | GeoTIFF float32, 384 × 384, uncompressed |
| nvdb (signs, limits, surfaces, lights) | 5 365 | 375 MB | 70 KB | JSON as the API sends it |
| osm (Overpass) | 676 | 227 MB | 335 KB | JSON as the API sends it |
| sr16 (forest) | 1 503 | 4 MB | 3 KB | already small |

## Part 1: saved routes
- [x] Every route made from **START/FINISH names** is saved when the stage is generated. A route made by clicking
  pins is also offered with a "Save" button. Entry:
  - names ("Lillehammer → Geilo")
  - start/finish lat/lon
  - profile
  - OSRM geometry (compact, see Part 3)
  - length
  - date
  - download state
- [x] **List** in the MAP panel and on the start screen ("MY ROUTES"). Each row has DRIVE, RENAME, DELETE (with a
  short confirm in the list itself, not a browser dialog), and the download state ("cached 100 %, 38 MB").
- [x] Stored in browser localStorage (`rally.routes`, JSON, small). The route geometry is stored in the cache as a
  pinned entry, so the list stays small. Editor/desktop: the same via `BrowserDom.LocalGet/Set` (PlayerPrefs).
- [x] Driving a saved route uses the stored OSRM geometry, so it works without OSRM.
- [x] Tests: save on generate, rename, delete, drive from the list without the router, list survives a reload.

## Part 2: a route's download kept locally
- [x] On save, a **background prefetch** of every tile the stage will load: the coarse tiles within the stage
  corridor, plus the fine tiles along the road. It fetches DTM, OSM, NVDB (surfaces, signs, lights) and SR16. It is
  paced so it never starves driving: low priority, ≤ 2 requests, and it pauses per data type (uses the per-type
  breakers from plan_20261122_road_continuity).
- [x] The cache gets **pins**: each entry records which saved routes use it. LRU eviction skips pinned entries, and
  shared tiles are counted once. Deleting a route removes its pins. Entries no longer pinned become normal LRU
  entries (not deleted at once).
- [x] Browser: ask `navigator.storage.persist()` once, when the first route is saved, so the browser doesn't clear
  IndexedDB under storage pressure. If it is refused, show "may be cleared by the browser".
- [x] Progress in the list. A route whose data is fully cached drives with no network: test this with the network
  off in the editor (fake HTTP failing) → the stage loads fully from the cache.
- [x] Tests: pin/unpin counting, eviction skips pins, prefetch tile list covers the stage, offline drive from cache.

## Part 3: compact formats for the scenery data
Store **what the game uses**, decoded and packed, instead of the raw download. Measured on samples of this cache
(2026-11-22):

| Kind | Raw | Generic deflate / xz on raw | Packed format (proposed) | Measured / expected |
|---|---|---|---|---|
| DEM | 575 KB | 2.3× / 3.1× | heights as int16 in 0.1 m steps, row-delta predictor (zig-zag varint for jumps), then deflate | **10.8×** deflate, 13.5× xz (measured on 20 tiles: 590 KB → 22–95 KB) |
| OSM | 288 KB | 4.9× / 7.5× | only the tags the game reads (as small enums: class, surface, bridge/tunnel/layer, building, landuse…, name in a string table), coordinates as int32 UTM decimetres delta-coded per way (varint), shared nodes by index, then deflate | expected ~15–25× (to measure) |
| NVDB | 55 KB | 4.8× / 11.4× | only the used properties per type (sign code, value, side, position as delta varint; limit value; surface type; light mast height/arm), then deflate | expected ~20–40× (to measure) |
| OSRM route | 15 KB | | polyline6 (Google encoded polyline, 1e-6°) + step modes | ~5× |

- Whole cache now ≈ 1.45 GB → expected ≈ 120–160 MB for the same area. A 300 km route corridor (≈ 1 000 tiles of
  data today) goes from ~400 MB to ~35 MB.
- [ ] One container for every kind: a header (magic "GTN1", kind, format version, source URL hash, fetched date),
  then a deflated body. Version bump → old entries are re-fetched, never mis-read.
- [ ] Decoding must be faster than parsing the JSON it replaces. Measure the parse time per tile before and after.
  Unity WebGL check: `System.IO.Compression.DeflateStream` may not work in WebGL builds (native zlib). **First step:
  prove which deflate works in the browser build**, either the managed one, the browser's `DecompressionStream` via
  a .jslib, or a small managed inflater. Without that, use the packing alone (no deflate), which still gives the
  biggest DEM win (int16 = 2×, + predictor and a simple varint ≈ 4×).
- [x] **Deflate in WebGL, proved 2026-11-22** (temporary probe in the WebDev build, Chrome, `?deflateprobe`; log in
  scratchpad `routes/deflate_probe_chrome.txt`; probe removed again): **managed `System.IO.Compression.DeflateStream`
  works in the IL2CPP WebGL build** (IL2CPP links its own zlib): a 590 KB float32 tile compressed in 29 ms and
  inflated in **8 ms**, byte-exact; it also inflates a raw-deflate payload made by Python's zlib byte-exact, and
  `GZipStream` works too. The browser's `DecompressionStream('deflate-raw')` via a .jslib also works (byte-exact on
  both payloads, 22–35 ms per call, async, plus the copy in/out of the wasm heap), as does `CompressionStream`.
  **Decision: use the managed DeflateStream** (synchronous, one code path in the editor, desktop and browser, no
  jslib). No managed inflater of our own is needed. Format work itself (DEM, OSM, NVDB packing) is still open below.
- [ ] Migration: old raw entries stay readable (no header = old format) and are repacked on their next hit.
- [ ] Tests: round trip per kind (decode(encode(x)) gives the same heights within 0.05 m, the same ways/tags, the
  same signs), old entries still read, version bump re-fetches, size ratios logged.

## Order
After the road-continuity and per-type pause work (same loading code):
1. Part 3 deflate-in-WebGL check (small).
2. Part 1, saved routes.
3. Part 2, prefetch and pins. This needs the per-type pauses.
4. Part 3 formats: DEM first (biggest), then OSM, then NVDB.

Then a WebDev check in Chrome: save a route from names, see it cached, reload, drive it with the network blocked in
DevTools (owner can do the last step; I don't change browser settings myself).

## Defaults chosen (owner can change)
- Routes are saved automatically when made from names. Pin routes get a Save button.
- No limit on the number of saved routes. Each row shows its size, and the cache budget still applies to unpinned
  data.
- Rename is plain text, max 60 characters.

## Added 2026-11-22: download along the route at one detail level
Owner: "when downloading map, do that along the route. make sure the map tiles downloaded are at the same level".
Owner confirmed this means the 3D world, not the 2D MAP panel.
- [x] The route prefetch walks the **route line**. It isn't a box around start and finish. It downloads:
  - every coarse tile (2048 m, 8 m cells) the stage loads along the line;
  - **every fine tile (256 m, 1 m cells) within `FineBand` (100 m) of the route line, along the whole route**, so the
    road and its sides are at the 1 m level everywhere. The prefetch must not leave some stretches at fine and others
    at only coarse.
- [x] The tile list is computed once from the route geometry. One function returns the coarse and fine keys
  (deduplicated). The prefetch and the pins use it, and its test checks that no point of the route line is more than
  100 m from a fine tile in the list.
- [x] While driving a saved route, fine tiles ahead on the route come from the cache. The live scheduler limit
  (`FineMaxLive` 24, `FineKeep` 900 m) stays as it is for memory. Check in a PlayMode/editor run that the drawn ground
  along the road is 1 m detail at sampled points along a saved route (no coarse-only stretch beside the road),
  e.g. `TileWorld` reports a fine tile under each sample.
- [x] Progress in MY ROUTES counts the tiles of both levels: "fine 412/412 · coarse 38/38".

## Review (2026-11-22, Parts 3-check, 1 and 2)
- **Deflate in WebGL:** proved in the WebDev build in Chrome: the managed `DeflateStream` works (590 KB inflated in 8 ms,
  byte-exact, also on Python zlib output); the browser's `DecompressionStream` works too. Decision: managed. The
  compact formats themselves are not built yet (Part 3, next).
- **What changed:**
  - `Gameplay/SavedRoutes.cs` (list in localStorage `rally.routes`, names ≤ 60), `Geo/Routing/Polyline.cs` (polyline6;
    the line is the pinned cache entry `route:<id>`), `Gameplay/GameController.Routes.cs` (save on GENERATE with names,
    SAVE ROUTE for pins, DRIVE from the saved line without OSRM, rename, delete, progress, persist, CLEAR),
    `GameController.cs` (partial; one cache per session instead of one per stage; hooks; a `stage: loading` log line).
  - `Gameplay/RoutePrefetch.cs`: `RouteTiles.Along` (the one tile list: coarse within LoadRadius + 300 m, fine within
    FineBand by the scheduler's rule), `PinningCache`, `RoutePrefetch` (≤ 2 requests through a gate, yields up to 5 s
    while driving has tiles pending, per-service breakers shared with driving, one worker per level, 3 failures → partial,
    frame-counted waits).
  - Cache pins: `ICacheBackend.AddPin/RemovePin`, `CacheEntryInfo.Pins`; Memory, File (6th meta line) and IndexedDB
    (`pins` field, idb.jslib, put keeps pins in one transaction) backends; `GeoCache.Pin/Unpin`, eviction skips pinned,
    `CacheStats.PinnedBytes`; `navigator.storage.persist()` with an answer.
  - UI: MY ROUTES in the map panel (index.html, `MapSetRoutes` in dom.jslib / BrowserDom) and on the start screen
    (Hud.uxml / uss, `HudController.SetRoutes`), rename and delete confirm in the row; SAVE ROUTE; help text.
- **Tests:** EditMode 304 → 317 (`SavedRoutesTests`, 13), PlayMode 27 → 28 (`SavedRoutePlayTests`: a saved bending line
  drives without the router; a fine tile is ready under every 10 m of road within 100 m of the car at 7 places).
- **Chrome (WebDev, port 8091):** typed START "Sauda" / FINISH "Saudasjøen" → GENERATE: one stage load, the route is
  saved ("Sauda → Saudasjøen", 4.0 km, 231 points) and listed on the start screen and in the map panel; the download
  ran fine 43/43 in ~40 s, coarse 4/37 after that (coarse tiles wait for Overpass, which was answering slowly from
  this machine: the LOG bar also showed "waiting: OSM roads 19"). Reload: still listed, the download resumed. Rename in
  the map row (typed, Enter) stored the new name. DELETE → YES removed the row at once and its pins (IndexedDB checked);
  a new route generated right after downloaded at once. Chrome refused `persist()` (automation profile), so the note
  "downloads may be cleared by the browser" shows. No console errors. Shots: scratchpad `routes/`.
- **Found in Chrome and fixed:** (1) both request slots sat on coarse tiles waiting for Overpass, so nothing progressed:
  one worker per level now. (2) DELETE waited for the download, whose loads (shared with driving) hung: the row now goes
  at once and a stopped download gives its slots back at once (`UntilCancelled`, test
  `AStoppedDownloadFreesItsSlotsAtOnceEvenWhileItsLoadsHang`). (3) The HUD font has no "→": shown as "-" there.
- **Open points:**
  - The coarse level of a download is as fast as Overpass; a route is "done" only when every coarse tile's OSM, NVDB
    and SR16 answer is in (3 failures per tile → "partial").
  - The download decodes what it fetches through the game's sources (GeoTIFF / JSON parse on the main thread), paced
    but not free; the compact formats (Part 3) would cut this.
  - Coarse corridor = LoadRadius + 300 m; with a far fog horizon (ViewRadius up to 7 km) the outer view ring is not
    downloaded (offline it stays empty).
  - Pins of a route removed outside the game (site localStorage cleared but not IndexedDB) stay forever: no sweep yet.
  - The cache line's "MB kept for MY ROUTES" updates when a download ends, not during it (`Stats()` walks every record).
  - Whether `Task.Delay` fires in this WebGL build was not isolated; the download waits in frames (`FrameDelay`).
  - One unexplained double stage load seen in the first Chrome run (before the `stage: loading` log line existed);
    not reproduced in two later runs.
  - Owner step left: drive a downloaded route with the network blocked in DevTools.
