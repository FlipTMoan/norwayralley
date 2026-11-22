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
- [ ] Every route made from **START/FINISH names** is saved when the stage is generated. A route made by clicking
  pins is also offered with a "Save" button. Entry:
  - names ("Lillehammer → Geilo")
  - start/finish lat/lon
  - profile
  - OSRM geometry (compact, see Part 3)
  - length
  - date
  - download state
- [ ] **List** in the MAP panel and on the start screen ("MY ROUTES"). Each row has DRIVE, RENAME, DELETE (with a
  short confirm in the list itself, not a browser dialog), and the download state ("cached 100 %, 38 MB").
- [ ] Stored in browser localStorage (`rally.routes`, JSON, small). The route geometry is stored in the cache as a
  pinned entry, so the list stays small. Editor/desktop: the same via `BrowserDom.LocalGet/Set` (PlayerPrefs).
- [ ] Driving a saved route uses the stored OSRM geometry, so it works without OSRM.
- [ ] Tests: save on generate, rename, delete, drive from the list without the router, list survives a reload.

## Part 2: a route's download kept locally
- [ ] On save, a **background prefetch** of every tile the stage will load: the coarse tiles within the stage
  corridor, plus the fine tiles along the road. It fetches DTM, OSM, NVDB (surfaces, signs, lights) and SR16. It is
  paced so it never starves driving: low priority, ≤ 2 requests, and it pauses per data type (uses the per-type
  breakers from plan_20261122_road_continuity).
- [ ] The cache gets **pins**: each entry records which saved routes use it. LRU eviction skips pinned entries, and
  shared tiles are counted once. Deleting a route removes its pins. Entries no longer pinned become normal LRU
  entries (not deleted at once).
- [ ] Browser: ask `navigator.storage.persist()` once, when the first route is saved, so the browser doesn't clear
  IndexedDB under storage pressure. If it is refused, show "may be cleared by the browser".
- [ ] Progress in the list. A route whose data is fully cached drives with no network: test this with the network
  off in the editor (fake HTTP failing) → the stage loads fully from the cache.
- [ ] Tests: pin/unpin counting, eviction skips pins, prefetch tile list covers the stage, offline drive from cache.

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
