# Real road signs in Unity from Statens vegvesen NVDB — 2026-11-19

User: "NB real roadsigns must be included (statens vegvesen API)".
JS reference: legacy-js/src/signs.js (fetchRoadSigns, signNumberFromVerdi, makeSignTexture, speedChanges,
buildChunkSigns) used by stream.js/main.js. Unity has only the data layer: Geo/Signs/NvdbSource.cs
(types 96 Skiltplate, 105 Fartsgrense), Geo/Sources/ISignSource.cs (SignPlate, SignSet), FakeSources.Signs.
Nothing fetches or renders signs in the game.

- [x] Fetch per coarse tile through GeoCache (NvdbSource paging, kartutsnitt), log "overlay: … N signs, M speed limits".
- [x] Sign faces: port makeSignTexture per Norwegian sign number (speed limits 30–110, warnings: bends, junction,
      animals (elk/deer), slippery, gradient, road narrows, children; priority/yield/stop; info and place names),
      rendered into one atlas (editor-generated + runtime fallback), correct shapes/colours (yellow-background
      Norwegian warning triangles with red rim, round speed limits, etc.).
- [x] Nicely drawn (user, 2026-11-19): crisp vector-quality faces at chase distance (high-res atlas, mipmaps,
      anisotropic, no blur/shimmer), correct Norwegian sign typography (Trafikkskilt font look), real plate
      proportions and sizes, retroreflective sheen at low sun / headlights, metal back and post/brackets,
      slight weathering; compare against reference images of the real signs.
- [x] Cached (user): NVDB answers in GeoCache (persisted, IndexedDB in the browser), generated sign faces cached
      too (editor-baked atlas for the common numbers; runtime-drawn faces kept in the atlas and not redrawn per tile).
- [x] Placement: real NVDB position, side of road and facing (direction of travel / vegsystemreferanse retning),
      on posts at proper height and offset from the road edge, snapped to carved ground, multiple plates on one post.
- [x] Speed-limit changes along the route (speedChanges) where NVDB has no plate.
- [x] Rendering cheap: instanced post + plate quads, distance cull, LOD; colliders via PropColliderPool (car can hit them, damage).
- [ ] HUD: current speed limit (optional, if JS shows it); pace notes unchanged.
- [x] Tests: sign number parsing, texture mapping, placement side/facing, speed changes, offline FakeSources.Signs scene.
- [x] Screenshots on live data; web build checked in Chrome; docs (CHANGES.md, unity/README-world.md, help screen credits).

Runs after the current Unity agent (road float, road texture, tree collisions, help screen, exhaust):
same GameController / PropColliderPool files, one Unity instance.

## Review (2026-11-20)

Built (`unity/Assets/_Rally/Runtime/World/Signs/`, `Resources/Signs/`, `GameController.FetchFeatures/PlaceSigns`):
- **Fetch / cache:** `NvdbSource.FetchSigns(tile bounds)` with the coarse tile's other overlays; every page through the
  GeoCache (`nvdb`). Verified in Chrome (WebDev on :8093): reloading the same place logs only `cache: hit nvdb …` for the
  sign and speed-limit pages, no NVDB request; EditMode `SignPagesComeFromTheGeoCache` proves plates come from the cache.
  Parsing now keeps the full code (`906V`, `713.H`), size, "Parallelt mot/fra veg", sideposisjon `VT`/`HT`.
- **Faces:** `SignCatalog` (≈ 60 Norwegian designs, mm of the real "middels" plates), `SignCanvas` (signed-distance vector
  painter, exact AA, hierarchical blocks), `SignFont` (DejaVu Sans Condensed Bold → runtime TextCore SDF atlas, CPU
  readable, works in the player), `SignAtlas` (2048² sRGB pages, mips, aniso 8, shelf packing, shared per design key,
  recycled pages). Contact sheet: `Editor/SignFacesSheet`. Painting in the WebGL player: 96 faces in 246 ms (≈ 2.6 ms each).
- **Correction to this plan:** Norwegian warning triangles are **white** with a red border (yellow is the temporary
  variant), direction signs are yellow with black text (Wikipedia, Road signs in Norway); drawn that way.
- **Placement:** `SignPlacement` (shoulder beyond the flat band at the real along-road position, shared posts, stack order,
  8xx under their sign; metering direction recovered from NVDB side vs. real side; right-hand rule fallback; speed-change
  362s where none stands within 40 m). On the test area most tiles place 70–170 plates; 10–20 % have no design.
- **Mesh / render:** `SignMesh` (posts, cut-to-outline plates with back, rim, brackets; two posts for wide plates),
  `SignLayer` (mesh for tiles within 1 km, dropped beyond 1.5 km, 4 ms paint budget, colliders within 35 m from
  `PropColliderPool`), shader `Rally/Sign` (retroreflective lobe, metal highlight, grime, shadows).
- **Not done:** editor-baked atlas (runtime painting is fast enough, so faces are painted once per session instead); HUD
  speed limit (the JS has none); real reference images were not compared pixel by pixel (Commons API rate-limited us);
  stacking order on a post is a heuristic (NVDB has no order); no weathering beyond shader grime; posts are rigid (the
  car stops at them like at a trunk).
- **Tests:** EditMode 163/163 (13 new in `SignTests`), PlayMode 10/10 (new `SignSceneTests`).
- **Screenshots:** scratchpad `signs/` (faces5.png contact sheet, preview2/live_14_sign_*.png live close-ups,
  chrome_*.png/jpg from the web build).
