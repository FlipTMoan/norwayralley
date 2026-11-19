# Real road signs in Unity from Statens vegvesen NVDB — 2026-11-19

User: "NB real roadsigns must be included (statens vegvesen API)".
JS reference: legacy-js/src/signs.js (fetchRoadSigns, signNumberFromVerdi, makeSignTexture, speedChanges,
buildChunkSigns) used by stream.js/main.js. Unity has only the data layer: Geo/Signs/NvdbSource.cs
(types 96 Skiltplate, 105 Fartsgrense), Geo/Sources/ISignSource.cs (SignPlate, SignSet), FakeSources.Signs.
Nothing fetches or renders signs in the game.

- [ ] Fetch per coarse tile through GeoCache (NvdbSource paging, kartutsnitt), log "overlay: … N signs, M speed limits".
- [ ] Sign faces: port makeSignTexture per Norwegian sign number (speed limits 30–110, warnings: bends, junction,
      animals (elk/deer), slippery, gradient, road narrows, children; priority/yield/stop; info and place names),
      rendered into one atlas (editor-generated + runtime fallback), correct shapes/colours (yellow-background
      Norwegian warning triangles with red rim, round speed limits, etc.).
- [ ] Nicely drawn (user, 2026-11-19): crisp vector-quality faces at chase distance (high-res atlas, mipmaps,
      anisotropic, no blur/shimmer), correct Norwegian sign typography (Trafikkskilt font look), real plate
      proportions and sizes, retroreflective sheen at low sun / headlights, metal back and post/brackets,
      slight weathering; compare against reference images of the real signs.
- [ ] Cached (user): NVDB answers in GeoCache (persisted, IndexedDB in the browser), generated sign faces cached
      too (editor-baked atlas for the common numbers; runtime-drawn faces kept in the atlas and not redrawn per tile).
- [ ] Placement: real NVDB position, side of road and facing (direction of travel / vegsystemreferanse retning),
      on posts at proper height and offset from the road edge, snapped to carved ground, multiple plates on one post.
- [ ] Speed-limit changes along the route (speedChanges) where NVDB has no plate.
- [ ] Rendering cheap: instanced post + plate quads, distance cull, LOD; colliders via PropColliderPool (car can hit them, damage).
- [ ] HUD: current speed limit (optional, if JS shows it); pace notes unchanged.
- [ ] Tests: sign number parsing, texture mapping, placement side/facing, speed changes, offline FakeSources.Signs scene.
- [ ] Screenshots on live data; web build checked in Chrome; docs (CHANGES.md, unity/README-world.md, help screen credits).

Runs after the current Unity agent (road float, road texture, tree collisions, help screen, exhaust):
same GameController / PropColliderPool files, one Unity instance.
