# Plan 2026-11-22 — Unity: realistic road verges (grass, wildflowers, shrubs, bushes)

Owner: "road sides should be more realistic grass, wilflowers, scrubs and bushes"

## Today
Beyond the gravel shoulder (`Road.shader`), the verge is the terrain's flat grass texture (`TerrainGround.hlsl`,
`LandcoverSplat`). 3D vegetation is only the tree scatter (`Scatter.compute` / `ScatterJob`, `VegetationRenderer`,
`VegetationSetSO`: spruce, pine, birch, mountain birch, shrub) driven by SR16 crown cover. Trees are never placed
on fields, meadows or built-up land, so open verges are bare.

## Reference photos (Wikimedia Commons; model by them, don't ship them) — `scratchpad/refs3/sheet_verge.jpg`

| What | File | Licence / author |
|---|---|---|
| Lupins along a main road (purple, pink, white spikes in dense drifts) | [Lupina.vinje.jpg](https://commons.wikimedia.org/wiki/File:Lupina.vinje.jpg) | CC0, Tollef Salemann |
| Cow parsley (white umbels) meadow, Lofoten | [Austvågøy-Gimsøystraumen-08-Flora-2019-gje.jpg](https://commons.wikimedia.org/wiki/File:Austv%C3%A5g%C3%B8y-Gims%C3%B8ystraumen-08-Flora-2019-gje.jpg) | CC BY-SA 4.0, Gerd Eichmann |
| Fireweed / geitrams (tall pink spikes) | [Fireweed … Ullensvang 2021-07-28](https://commons.wikimedia.org/wiki/File:Fireweed_(Chamaenerion_angustifolium)_-_Ullensvang,_Norway_2021-07-28.jpg), [… Giske 2022-07-01](https://commons.wikimedia.org/wiki/File:Fireweed_(Chamaenerion_angustifolium)_-_Giske,_Norway_2022-07-01.jpg) | CC BY-SA 4.0, Ryan Hodnett |
| Juniper bushes under birch (forest-edge understorey) | [Juniperus communis Haddal Norway.jpg](https://commons.wikimedia.org/wiki/File:Juniperus_communis_Haddal_Norway.jpg) | CC BY 2.0, nz_willowherb |
| Juniper foliage close-up | [Common Juniper (Einer) … Moskenes](https://commons.wikimedia.org/wiki/File:Common_Juniper_(Einer)_(Juniperus_communis)_-_Moskenes,_Norway_2023-07-18.jpg) | CC BY-SA 4.0, Ryan Hodnett |
| Cow parsley leaves on a gravel edge | [Cow Parsley … Kristiansand](https://commons.wikimedia.org/wiki/File:Cow_Parsley_(Anthriscus_sylvestris)_-_Kristiansand,_Norway_2021-08-12.jpg) | CC BY-SA 4.0, Ryan Hodnett |

Also visible in the earlier sheets (`scratchpad/refs/`): Bilvei (mown short grass right to the edge line on a rural
road), E6 Vingnes (tall grass behind rails, birch/alder bushes), Stordal (lawn verges in a village).

## Design

**Bands across the verge**, measured from the drawn shoulder edge (shoulder = gravel, already drawn):
1. 0–1.5 m **mown strip**: short dense grass (5–15 cm), a few clover / buttercup / yarrow dots.
2. 1.5–6 m **tall verge**: grass 30–80 cm with seed heads, and **wildflowers in drifts** (noise-clumped patches, not
   confetti): lupin (purple/pink/white), fireweed (pink), cow parsley (white umbels), meadow buttercup (yellow),
   red campion, yarrow (white), harebell (blue). Mix chosen by region/height: lupins lowland south/east and along
   main roads (below ~600 m, south of ~66°N); fireweed everywhere below the tree line; cow parsley lowland and coast.
3. 3–12 m **shrubs and bushes** toward the forest edge: willow (vier) clumps, juniper, raspberry thicket, young
   birch/alder/rowan saplings; density follows the land cover.

**Land cover rules** (LandcoverSplat / SR16, already available per tile):
- Forest: bands 1–2 narrow, band 3 dense (juniper + birch saplings in conifer, willow/alder in deciduous).
- Fields / meadows: band 1 + a strip of tall grass and flowers along the field edge, few shrubs.
- Bog: cotton grass (white tufts), dwarf birch, no lupins.
- Above the tree line / bare rock: sparse low grass, heather (purple-brown), crowberry; no tall flowers, no shrubs on
  rock or scree.
- Built-up land: mown lawn only (band 1 widened), no tall flowers or bushes near houses.
- Nothing on: carriageway, shoulder, bridge decks, in tunnels, water, house footprints, driveways and junction mouths
  (any other road's carriageway), steep cuts (slope > ~35°, bare rock), within 1 m of sign posts, light masts and
  rails, and not where the trees already stand (keep their trunks clear).
- If the world shows snow, no flowers (grass/shrubs get the existing snow tint).

**Rendering** (WebGL 2 first, no compute required — same CPU-job path as `ScatterJob`):
- Deterministic per-position hash (same plants at the same place every visit, continuous across tile borders).
- Grass and flowers: GPU-instanced clumps of crossed cards with an alpha-cutout atlas **generated procedurally in
  the editor** (like `TreeBuilder` does for trees: blades, umbels, spikes painted by code, not from the photos), wind
  sway in the vertex shader, per-instance tint/scale. Drawn within ~100–150 m of the car with a dithered density fade.
- Beyond that range the ground keeps the look: the terrain/verge shader tints the verge band with the same flower
  drift noise (purple/pink/white/yellow patches) so drifts still read from a distance.
- Shrubs/bushes: low-poly meshes with LODs + impostor via the existing `VegetationRenderer` pattern (new species
  slots or a parallel verge renderer, implementer's choice — keep it simple), drawn to ~300 m, shadows only near.
- Not solid: the car drives through grass, flowers and bushes (trees stay solid as today).
- Budget: generation spread over frames inside the streaming `WorkBudget`; worst stage frame stays ≤ 0.15 s; frame
  time within +10 % of today in the editor bench on a forest road and a meadow road; memory per tile stated.

## Regional look across Norway (owner 2026-11-22: "try to correlate the shrubs and grasses with how they look throughout norway")

Norway's vegetation is classed by **bioclimatic zone** (temperature/height: boreonemoral BN, south boreal SB, middle
boreal MB, north boreal NB, low/middle/high alpine LA/MA/HA) and **section** (precipitation: strongly/clearly/weakly
oceanic O3/O2/O1, transition OC, weakly continental C1) — Moen / NiN; the official map is Artsdatabanken's
"Bioklimatiske soner og seksjoner" (test version 2026, published by Miljødirektoratet, polygons 5 km² / 50 km², no
WMS found — [product sheet](https://pgisnedlasting.blob.core.windows.net/data/nedlasting/bioklimatiske_soner_seksjoner/produktark_bioklimatiske%20soner%20og%20seksjoner.docx);
NIBIO's 1:20 000 vegetation map covers only ~25 000 km², too patchy).

- [x] **Zone/section per place.** If the dataset's files can be downloaded (look under
  `pgisnedlasting.blob.core.windows.net/data/nedlasting/bioklimatiske_soner_seksjoner/` and Geonorge) and the licence
  allows it, bake it into a small raster shipped with the game (e.g. 1 km grid of zone+section bytes, a few MB) and
  record the source/licence in the attribution. Otherwise **estimate it** from data the game already has: zone from
  height vs. a tree line that falls with latitude and with oceanity (≈ 1 100 m inland south, ≈ 900 m west coast,
  ≈ 600 m Trøndelag, ≈ 300–500 m Troms/Finnmark coast), with BN only below ~150 m south of ~61°N on the south/east
  coast; section from distance to the open sea (O3 < ~15 km on the west coast … C1 deep in the eastern valleys,
  e.g. Gudbrandsdalen, Østerdalen, inner Finnmark) — and the SR16 tree species as a cross-check (pine-dominated dry
  forest → continental, birch forest above conifers → north boreal / tree line).
- [x] **Plant palette by zone × section** (verge bands as above; drifts weighted per region):
  - BN / SB lowland south and east (Oslofjord, Sørlandet, Vestfold, Østfold): lush tall verges; cow parsley (May–June),
    lupins, meadow cranesbill, tufted vetch, red clover, yarrow, oxeye daisy; shrubs dog rose, raspberry, hazel, young
    oak/ash/rowan, blackthorn; grey alder in wet ditches with meadowsweet.
  - MB / SB inland valleys and Trøndelag: lupins very common along main roads, fireweed, cow parsley, meadow buttercup,
    red clover, harebell, yarrow; shrubs grey alder, willows, birch and rowan saplings, juniper, raspberry; bilberry
    under the spruce edge.
  - NB and north (Nordland, Troms, Finnmark valleys): fireweed, lupins along the E6, globe-flower (ballblom, yellow),
    wood cranesbill (skogstorkenebb, violet), northern wolfsbane / tyrihjelm (tall blue, a northern hallmark),
    meadowsweet; shrubs downy birch, willows, juniper, dwarf birch.
  - Oceanic west (O2/O3: Rogaland–Møre, Lofoten): foxglove (revebjelle, purple spikes), bracken (einstape) banks,
    heather (røsslyng) on coastal heath, bog myrtle (pors), lady's mantle; shrubs juniper, willow, rowan; fewer lupins.
  - Continental east (C1/OC dry valleys): sparse dry grass, harebell, kidney vetch, lichen-grey ground under pine,
    juniper; low density overall.
  - Low alpine (LA): dwarf birch, low willow scrub, heather, crowberry, cotton grass in wet spots, sparse grass; no tall
    flowers except a few globe-flowers/alpine bistort; middle/high alpine: sparse tufts, moss, lichen, bare stone.
- [x] Tests: zone/section estimate at known places (Oslo BN/SB-OC, Bergen O3 lowland, Lillehammer MB-OC, Dombås
  NB/LA-C1, Sognefjellet MA, Tromsø NB-O2, Alta continental north), palette picked per region, determinism.
- [x] PreviewShots add: Bergen/Vestland coast road, Gudbrandsdalen, Troms E6, Sognefjellet.

## Steps
- [x] Verge band sampler: for a tile, points along every drawn road's both sides with the distance from the shoulder
  edge, side, land cover, slope, height, exclusions (above). Unit-tested.
- [x] Species rules + drift noise + deterministic hash; tests for land-cover/elevation/region rules and determinism
  across a tile border.
- [x] Procedural atlas + clump meshes (editor builder), shader (cutout, wind, tint, dithered fade, snow off).
- [x] Instanced renderer for grass/flowers near the car; shrubs via the vegetation renderer pattern.
- [x] Far-distance verge tint in the terrain shader.
- [x] Bench + PreviewShots before/after: a forest road (Sauda default start), a meadow/field road, a lupin-region main
  road (e.g. Vinje, Telemark), a mountain pass (above the tree line), a village street (Lillehammer test box).
- [ ] WebDev build: loads, verges visible, no console errors (Chrome check by the lead).
- [x] Docs: CHANGES.md (2026-11-22), unity/README-world.md, ARCHITECTURE.md.

## Review

### Verges + regional look (done 2026-11-22)
- **Cause:** past the gravel shoulder the verge was only the terrain's grass texture plus a wide grey "worn verge" tone;
  trees never grow on open land, so open verges were bare.
- **Zone/section:** the dataset is open data (NLOD 2.0, product sheet). No file download was found, but the map service
  (`kart2.miljodirektoratet.no/.../bioklimatiske_soner_seksjoner/MapServer`, EPSG:25833) exports images with a
  caller-given renderer: `unity/Tools/bake_bioclimate.py` paints each class in its own colour at 500 m, takes the
  majority of clean pixels per 1 km cell and fills coastal gaps → `Geo/Resources/bioclimate.bytes` (1.8 MB). The
  estimate from latitude / sea distance is not needed; only the 1 km zone is corrected by local height vs the tree line.
  The official data differs from the plan's guesses: Bergen is BN-O2 (not O3), Lillehammer SB-OC, Dombås MB-C1,
  Tromsø MB-O1, Alta MB-C1 — the tests use the official values. North of 65.5° N the boreal zones use the northern palette.
- **Design changes vs the plan, and why:** (1) no instancing and no VegetationRenderer slots: one baked mesh per 64 m
  cell (herbs, bushes) on plain MeshRenderers — no per-frame CPU culling, works on WebGL 2 as is. (2) The shader puts
  each plant on the drawn ground (`TerrainGround.hlsl`) instead of baking heights: re-carves and fine tiles need no rebuild.
  (3) Bushes are 4 crossed cards, no LOD/impostor: they fade out by 260 m. (4) Ranges 130 / 260 m (plan 100–150 / 300) to
  keep frame time down. (5) Exclusions use the carve segments (every road's flat band, deck and tunnel footprints) rather
  than `TunnelAt` per point. (6) The terrain's gravel tone on the flat apron beyond the shoulder halved (0.6 → 0.3).
- **Bench (editor, GPU path, Chrome's GPU process at 89–93 % GPU throughout):** drive_60s avg / p95 frame —
  Sauda forest road 18.32 / 42.6 ms → 18.63 / 35.3 ms (+1.7 %); Toten field road 10.17 / 11.8 → 11.80 / 15.0 ms (+16 %).
  Main-thread streaming work per frame (drive) 3.27 → 3.58 ms (Sauda), 3.35 → 3.55 ms (Toten); worst verge cell build
  20–28 ms (one 64 m herb cell in town), no frame over 50 ms of work. Draw calls +80–110.
- **Memory:** ~10–11 k vertices (~0.6 MB GPU) per 64 m cell of two-lane road; 5–15 cells in range; CPU copies released
  (`UploadMeshData(true)`). Per coarse tile +64 KB (the CPU cover copy is now kept on the compute path too). Atlas 1024² RGBA.
- **Tests:** EditMode `VergeTests` (20: zone/section/region at 9 places, height corrections, lupin rules, regional
  palettes, land-cover rules, bushes by cover, exclusions road/junction/deck/post/house, same plants across cell layouts,
  mesh, layer build/wait/invalidate/drop, shader + atlas load). All EditMode 281/281, PlayMode 27/27 (PlayMode run before
  the last tweak: ranges, shadow radius, obstacle buckets; EditMode re-run after it).
- **Shots:** `scratchpad/verges/pairs/` (before = HEAD 0f1c820; Sauda, Toten, Vinje, Sognefjellet, Lillehammer, Sotra,
  Otta, Troms E6).
- **Open points:** Toten frame time +16 % (over the +10 % target; render cost of ~100 extra draws on a GPU shared with
  Chrome — merging herbs and bushes into one renderer per cell, or 128 m cells, would halve the draws). One town cell
  build takes 20–28 ms in the editor (more on WebGL): split builds per row if it shows as a hitch. Sognefjellet shots
  are under snow (no flowers, as the rule says). WebDev build / Chrome check not done (lead). Houses only from the cell's
  own coarse tile.
- **Lead review follow-up (2026-11-22):** (1) One mesh and one renderer per cell (herbs + bushes; the shader picks fade
  range and wind by the vertex alpha, the shadow pass collapses the herbs; bush shadows within 80 m). Draw calls in the
  drive 446 → 366 (Sauda), 418 → 376 (Toten), but frame time did not follow: drive_60s avg Sauda 18.32 (HEAD) → 19.30 ms
  (+5 %), Toten 10.17 → 11.89 ms (+17 %); work per frame 3.34 / 3.46 ms, worst cell build 16–24 ms. The remaining cost
  is GPU (alpha-tested cards and the per-vertex ground lookup), measured with Chrome's GPU process at 91 % on the same
  GPU — not settled; next candidates: a shorter herb range near the start of the fade, or a cheaper ground lookup (bake
  the root height, refresh on Invalidate). (2) Flowers: drifts cover 55–60 % of the tall band (was 40–45 %), 95 % of the
  points in a drift flower, flowers 1.25× the grass, lupins up to 800 m (Vinje E134 sits near 600 m), denser spikes and
  umbels in the atlas. Summer is already the game's month (SkyAndTime.Month = 7). Shots: `scratchpad/verges/flowers_final/`
  (Vinje E134 fireweed / lupin drifts, Toten Rv33 lupins, Sotra Fv 5234/5286 foxglove, Otta E6 dry continental verge).
  Tests after the last change: EditMode 281/281, PlayMode 27/27.
