# World / Roads layers — editor setup

Updated 2026-11-22 (street lights from NVDB; 2026-11-20: road tunnels and avalanche galleries, overpass carve rule, ways meeting at a node; house footprint rings for the car, nearest-first sign colliders; tile seams and the streaming frame budget; fuller birch crowns; road signs; road edge fit, earthworks, road surface detail; WebGL 2 path 2026-11-16). Code: `Assets/_Rally/Runtime/World` (Rally.World) and `Assets/_Rally/Runtime/Roads` (Rally.Roads).
Tests: `Assets/_Rally/Tests/EditMode/World` (Rally.Tests.Edit).

## What has to be assigned in the editor

1. **Layers** (Project Settings → Tags and Layers): `Buildings`, `Trees`, `Props`, `Water`, `Actors`.
   The terrain has no collider — ground height comes from `IGround.HeightAt` (HeightGrid). Collision matrix:
   Actors ↔ Buildings/Trees/Props/Actors collide; Water is trigger-only.
   Houses also keep their footprint rings (`BuildingSet.Rings`, metres from each `FootprintBox` centre): `TileWorld`
   implements `ISolidGround.FootprintPush` over the coarse tiles within 50 m of the car (`Footprints`), which the car uses
   where the wall mesh cannot judge (inside a house, past half way through a wall). `RefreshColliders` moves the tree pool
   at once after a teleport, and the street-light masts near the spot (`TileWorld.Lights`). Sign posts and masts take the
   prop pool nearest first; full pools are logged once.
2. **WorldStyle asset** (Create → Rally → World Style): assign
   - `TerrainMaterial`: a material on `Rally/TerrainClipmap` with `_Albedo` (alpha = height) / `_Normals` Texture2DArrays of
     9 slices in `LandcoverSplat.Layer*` order: grass, conifer floor, birch floor, field, rock, heath, bog, snow, sand/gravel.
     `SceneBuilder` generates them (`Editor/GroundTextures.cs`, 512² per slice, two 3 × 3 flipbook PNGs imported as arrays).
   - `Vegetation`: a VegetationSet (Create → Rally → Vegetation Set), 5 prototypes in this order:
     spruce, pine, birch, mountain birch, shrub; each with 3 LOD meshes, a billboard impostor and per-species LOD distances,
     materials on `Rally/Tree` (one normal, one with `_Billboard = 1` and the impostor atlas). `SceneBuilder` generates all of
     it (`Editor/TreeBuilder.cs`, see "Trees and ground from the overlays" below).
   - `ScatterShader`: `Scatter.compute`. The carve shader `Carve.compute` is passed to `new TileWorld(carveShader, style)`.
   - `LakeMaterial`, `RiverMaterial` (`_Flow = 1`), `SeaMaterial` (`_SwellAmp ≈ 0.25`): `Rally/Water` with a ripple normal map.
     The URP renderer needs **Depth Texture** on (depth fade) and, for `_Planar = 1`, a presentation camera rendering into `_PlanarTex`.
   - `BuildingMaterial`: a lit material that uses vertex colours (URP Lit does not; use a Shader Graph with Vertex Color → Base Color, or URP "Particles/Lit").
   - `SkyMaterial`: `Rally/Sky`; add a `SkyBinder` component to any scene object and assign the same material.
     `RenderSettings.sun` must be the directional light rotated by `Rally.Presentation.SkyAndTime`.
   - `PostProfile`: the Volume profile of the scene's global Volume. `WorldStyleSO.Apply()` writes Bloom, ACES
     tonemapping, Vignette and Motion Blur into it. **SSAO** is a Renderer Feature: add "Screen Space Ambient Occlusion" to
     the URP renderer asset. Shadows: `Apply()` sets 4 cascades / 200 m on the active URP asset.
3. **URP asset**: WebGPU first; keep "Depth Texture" on for the water ("Opaque Texture" is off since 2026-11-19: nothing
   samples it); shadow cascades 4. SSAO runs at half resolution from the depth prepass (the trees have a DepthOnly pass
   but no DepthNormals pass, so a DepthNormals source left them out of the occlusion).

## Flow at runtime

`TileWorld.Update(carWorld, velocity, camera, dt)` once per frame → `TileScheduler` decides which 2048 m / 256 m tiles are wanted,
raises `TileNeeded(key)` for one tile per frame; the driver fetches through Rally.Geo and calls
`TileWorld.OnTileData(key, dtm, cover, features, latitude)` (or `FetchFailed`). The tile then: uploads its base heights,
builds the land-cover splat, lakes/rivers/houses, carves roads (`IRoadQuery.CollectCarveSegments`) and house pads,
reads the carve back into its `HeightGrid` (WebGPU) and queues its forest scatter (`TileWorld.ScatterNext`, one tile per
frame, so the repeated recarves of a tile while its neighbours' roads arrive collapse into one scatter). Roads: `RoadGraph.SetTile(key, roadGraphData, coarseGround)`
when a tile's ways arrive, then `TileWorld.RecarveWithin(bounds)`; `RibbonMesh.Build(lines, origin)` for the surface.

### Roads: one surface for the car, the ribbon and the terrain (2026-11-19)
- The ribbon's heights are the run's graded profile + `ROAD_LIFT` + `SurfaceLift` — what `TileWorld.HeightAt` answers on
  the road — so the drawn road and the wheel contact agree to the millimetre, straight across the carriageway. (It used
  to sample the carved grid when the roads arrived: the 8 m coarse grid, so the later 1 m terrain cut through it.)
- The carve keeps the terrain under it: the flat band reaches `RoadConstants.CarveApron` (2 m, the finest clipmap
  triangle) past the shoulder; coarse tiles widen it by 1.5 cells and sink it by `CarveMargin` (bilinear 8 m texels).
- Plan line: `ProfileGrader.SmoothThrough` (Chaikin ×4 through junction nodes, nodes pulled back onto OSM) then
  `ResampleEven` every 5 m. Junctions: major roads are graded first; a joining road takes the major road's height within
  its flat band + `RoadGraph.JunctionFlat` and fades back over `JunctionRamp`; samples on the major carriageway are
  `Covered` and draw no ribbon. `RoadGraph.Nearest` ranks roads by distance past their flat band.
- Material: NVDB Vegdekke (type 241) per sample within 12 m, OSM `surface` / class as the fallback (`NvdbSource.FetchSurfaces`,
  `RoadGraph.SetTile(…, surfaces)`); `Rally/Road` draws asphalt (markings on two-lane roads) or gravel.
- Known limits: a way graded in an earlier tile keeps its heights (a side road graded before its main road arrives does
  not conform); OSRM / demo stage lines (`StageRoute`) keep their own Chaikin; at a junction corner on a steep side road
  the side road's first ribbon quad can sit a few cm–15 cm off the main road's surface; bridges: see below.

### Road edges, earthworks and the road surface (2026-11-19, second pass)
- **The terrain meets the ribbon edge.** The carve's flat band sits `RoadConstants.CarveLift` (ribbon lift − `EdgeTuck`)
  above the road line, so the terrain is 4 cm under the shoulder edge instead of 16 cm (which, with a vertical skirt and
  its shadow, read as a road floating on a dark line). `TileWorld.HeightAt` returns the ribbon on the road and the carve
  (+ the last 4 cm of the lift fading out) beyond it. Skirts now slope 0.5 m out and 0.55 m down into the ground
  (earth-coloured); the outer 0.45 m of the shoulder is clipped by noise in `Rally/Road`, so the edge breaks up into the verge.
- **Earthworks** (`RoadProfile.EarthworkWidth`, same rule in `CarveJob` and `Carve.compute`): past the flat band the carve
  runs to the natural ground over `FillRun` (2) m per metre of embankment or `CutRun` (1.25) m per metre of cutting, at
  least the class's shoulder blend, at most `MaxEarthwork` (10 m). A segment only claims cells its earthwork reaches;
  the nearest segment still wins a cell (ranking by distance past the flat band, as `RoadGraph.Nearest` does, was tried:
  it fixed the junction case below but let a wide road steal a narrow road's cells at grade-separated crossings).
- **Coarse clipmap rings** (4–16 m triangles) could not draw the band edge where it is: a triangle from a vertex on the
  band to one down the embankment sagged under the ribbon edge. In `TerrainClipmap` a vertex off the band (carve mask
  < 0.75) with a grid neighbour on it takes their height, so every triangle that holds the edge is flat at road height
  (`Clipmap.DrawnHeight` is the CPU twin used by the tests and `PreviewShots`). What remains is the ring's own
  resolution over a graded road: ≤ 8 cm at 64–128 m, ≤ 15 cm at 128–256 m, ≤ 30 cm beyond (test road with 10 % grades).
- Measured with `PreviewShots -previewRoadDebug` (live, 59.6501, 6.34968, `road.txt` + the `edge fit:` log line).
- **A road is dry:** `TileWorld.WaterAt` returns no water on a carriageway or its shoulder. Measured against the carved
  road, roads graded near sea level sat under the 0.45 m sea plane and every OSM waterway crossing a road (culverts too)
  added 0.2–0.7 m: a hidden water brake (183 + 2 of 4143 live road points).
- Measured: edge samples floating > 10 cm, live within 600 m: 70.5 % → 30.3 % (2 m ring 99 % → 2 %, 4 m 79 → 12 %,
  8 m 76 → 14 %, 16 m 68 → 37 %).
- **Road surface**: `Editor/RoadTextures.cs` generates a 2-slice array (asphalt aggregate 2 m tile, crushed gravel 3 m tile,
  alpha = height) and its normal map, assigned by `SceneBuilder.RoadMaterials`; `Rally/Road` samples it in world XZ at two
  scales and angles (no stretching along bends, no repeat), with procedural darker rubbered wheel tracks, oil line,
  patches with sealed seams, ravelled edges onto a gravel shoulder and worn markings on asphalt; packed ruts with potholes,
  a lighter stony crown and edges, ochre/grey drift and damp patches on gravel. Normal detail fades over 25–115 m.
- Known limits: at a junction on a steep side road the side road's first quad off the main road sits up to ~15 cm off the
  main road's carve, so the main road's apron can show through it by up to ~12 cm on a 30 % side road (4 cm tuck instead of
  the old 16 cm lift); the coarse-only carve still sinks `CarveMargin` (0.3 m) under the band, so far away where no 1 m tile is
  loaded the ribbon edge stands ~0.3 m over the coarse terrain (under a pixel at that range).

### Bridges (2026-11-20)
Port of `legacy-js/src/bridges.js` (`Roads/Bridges.cs`, `Roads/BridgeMesh.cs`).
- **Which stretches:** a way tagged `bridge=*` (not `no` / `culvert`, not a tunnel) is a span end to end; any other way
  is one where it crosses water for ≥ 6 m with water on both sides 4 m past its cut-through and the DTM at water level
  (`Bridges.WetCore`; a causeway is land, a ford never a bridge, a 2.4 m stream a culvert). The water is
  `WaterProbe`: the tile's OSM lakes and rivers (`tunnel=culvert` waterways left out), the DTM's sea cells where a tile is
  loaded, and the lakes / rivers other tiles already built (`TileWorld.InMappedWater`). Each core is widened by one 5 m
  sample to the abutments on the banks; piers every ~30 m on spans over 24 m.
- **Profile** (`RoadGraph.SetTile`): the raw ground over a span is the straight line between the banks before the usual
  grading (pinned ends since 2026-11-20, so a tagged way's ends stay on its banks), junction easing never moves a span's interior and
  ignores a deck more than `PassOver` (2.5 m) above or below, then `Bridges.ApplyProfile`: a Hermite cubic between the
  abutments with the approach grades, a 2 % arch (≤ 1 m), and where needed a lift to 2.5 m over the water (over the sea
  plane at least) or 0.8 m over dry ground, ramped out over 15–90 m and tapered to nothing at the way's own ends.
- **Carve:** a span is a `CarveSegment.DeckOnly` (out to `RoadConstants.DeckHalf`, reach + 10 m): it takes part in
  "nearest wins" but leaves the cells it wins natural, so nothing under a bridge is carved and an approach road's
  embankment stops where the deck is nearer (no end cap filling the river). Its footprint is 128 on the mask (no trees).
- **Drawn:** the ribbon as before on top of `BridgeMesh` (one mesh per tile, house material, casts shadows): concrete
  slab `DeckThickness` 0.9 m out to `DeckHalf` = carriageway + shoulder + 0.6 m (the ribbon skirts end inside it), kerb
  beams, steel guard rails on posts, piers and abutment walls into the ground. A road meeting a deck is never `Covered`
  by it (its ribbon runs to the abutment).
- **Car:** `TileWorld` is an `ILayeredGround`: `CarController` sets `ReferenceY` to the car's height around its step.
  Within `DeckHalf` and no more than `DeckCatch` (1 m) under the deck top the ground is the deck (ribbon on the
  carriageway, slab to the rails), dry, with the road's surface; under it the river bed and its water. Other callers
  (NaN) get the deck. Rails and piers are a `MeshCollider` on layer Buildings (the rails a band from 0.5 m under the deck
  to 1.25 m over it, so a car in the river passes under them).
- **Quays:** no road is graded from ground under `RoadGraph.MinGradeGround` (sea plane + 0.5 m): shore and quay roads over
  the DTM's sea cells used to be drawn under the 0.45 m sea plane (183 of 4143 live road points at Sand).
- `PreviewShots -previewLook "LAT,LON;…"` shoots each spot across the nearest road from both sides, low down and along it.
- Known limits: a way is graded once, with the water known then (its own tile's OSM water and tiles already built);
  `HeightAt` without a reference height answers the deck (a camera or sign under a bridge sees the deck); a road under an
  overpass is carved under the deck (layer rule, see Tunnels); no extra clearance over a road below is enforced (the DTM's
  embankments give it); the deck is
  concrete whatever `bridge:structure` says; pace notes do not call bridges.

### Tunnels (2026-11-20)
`Roads/Tunnels.cs`, `Roads/TunnelMesh.cs`, `Resources/Tunnel/Tunnel.shader`; car / camera side in `TileWorld` and `CameraRig`.
- **Which ways:** `tunnel=yes` (any value but `no`, `culvert`, `building_passage`, `avalanche_protector`) is a tube end to
  end; `avalanche_protector` (rasoverbygg) is an open road with a gallery roof; `building_passage` stays an open road (the
  house over it is already left out by the road clearance rule); tunnels are no longer `Barred` (stages may use them,
  `RoadWalk.Score` × 0.15).
- **Profile:** a tube is the straight line between its two portals, under the sea (DTM 0) at least 40 m down or as deep
  as an 8 % descent from both portals reaches (`Tunnels.Profile`). Ways are graded major first, longer first within a
  class, tubes last, so a portal takes the height of the road outside it (graded on its own bed). A tube graded before
  its road is graded again onto it (`FollowAtNodes`). The DTM at a portal node runs up the rock face: a tube's own portal
  height is read from the ground 10–30 m outside it (unless that falls away: a gorge, a fjord), a road's ends from the
  ground 10–30 m inside (`EndGround`), and a way under 60 m that ends at a portal takes its other end's ground.
- **Carve:** tube segments are `CarveSegment.TunnelOnly` (out to the wall's outside, reach + 10 m): like a deck they win
  cells by "nearest wins" and leave them natural, so the mountain stays and the approach's cutting ends at the portal. A
  layer segment (deck or tunnel) only takes a cell from a ground road within `RoadConstants.PassOver` (2.5 m) of its height
  (CarveJob, Carve.compute with two more scratch textures; layer segments are carved last): a road under an overpass or
  over a tunnel is carved as usual.
- **Car and camera:** `TileWorld.TunnelAt` (`ILayeredGround`): inside a tube's plan out to its walls' outside, with the
  asker below the crown + 1 m (`ReferenceY`; NaN = inside, so a car placed or reset in a tunnel lands on its floor) and
  not past a portal (the bisector with the road outside), `HeightAt` is the tunnel floor (ribbon, then the terrace height
  out to the wall), `SurfaceAt` the road's, `WaterAt` dry; above the roof the mountain. The walls and portal faces are a
  `MeshCollider` on layer Buildings. The chase camera is pulled back into the tube when it leaves its plan and kept 0.5 m
  off the walls and under the arch (`CameraRig.KeepInTunnel`).
- **Drawn:** `TunnelMesh` per tile (segment by its middle's tile): floor under the ribbon, walls 4.2 m, an elliptic arch
  (crown 7.5 m on a two-lane road), the shell's outside, a lamp every 24 m, at each portal a 2.5 m collar and a concrete
  face; galleries a roof on a mountain-side wall and valley-side pillars. `Rally/Tunnel` lights faces by how far inside
  they are (vertex alpha, `Tunnels.InsideWeight`: 0 at a portal, 0.9 from 40 m in) with the lamp light instead of the sun
  (which reached the inside beyond the 200 m shadow distance); the ribbon does the same through its UV1.y.
- **Terrain holes:** the clipmap is one height per point, so it runs down across a portal. `TileWorld.UpdateTunnelHoles`
  sends up to 48 tube pieces near the camera (where the rock over them is less than a cell's height above the crown, plus
  8 m out of each portal over the road) as `_TunnelA/_TunnelB`; `TerrainClipmap.shader TunnelClip` discards terrain pixels
  inside a piece between 0.25 m over its floor and 1 m over its crown in every pass (so light gets in at the mouth too).
- **Querying a tunnel** (the road arrow and the finish gate use it, as should anything drawn on the road): `world.TunnelAt(xz, out spot)` (or
  `(ground as ILayeredGround).TunnelAt`) with `ReferenceY` NaN (or the asker's height) gives `Floor` (the drivable surface),
  `Roof` (the arch's inside at that lateral offset), `Crown`, `Centre`/`Tangent` (world xz), `Lateral` and `Half` (wall face).
  Anything placed with `HeightAt` and NaN in a tube's plan sits on its floor (the stage line's `Y`); `RoadSample.Tunnel` /
  `RoadHit.Tunnel` / `RoadLink.Tunnel` and `RoadLayer.Tunnel` mark tunnel roads. Keep markers under `Roof` − their height.
- `PreviewShots -previewPoses "NAME|LAT,LON,UP|LAT,LON,UP;…"` (camera poses over the game's ground; logs the ground along
  the sight line, T = in a tunnel) and `-previewCarAt "NAME|LAT,LON,YAWDEG"` (car reset there, chase shot).
- Known limits: the profile is straight (real tunnels have a crest); no headlights; the sea depth is assumed (the DTM has no
  bathymetry); signs and animals may stand in tunnels; a lake over a tunnel is not checked.

### Ways meeting at a node (2026-11-20)
- The grade's running mean no longer shrinks at a way's end (`ProfileGrader.SmoothRoadHeights` `pinEnds`: odd
  reflection about the end): an end stays at its (fitted) ground. The shrinking window had pulled ends 10 m above and
  below the ground on steep hillsides: a 20 m step where two ways met end to end at Sauda.
- `RoadGraph.nodeWays` registers every graded way's OSM nodes; a way graded later takes an earlier way's height at every
  node they share (`EaseOntoNodes`, offsets interpolated between nodes, faded over ≥ 60 m at ≤ 8 % added grade), whatever
  tile either was graded in (the bucket easing only saw roads registered near the junction). A way graded again makes the
  ways that followed it follow again where the joint height changed; `Rebuild` keeps a tile's gradings while it is set
  again, so tiles setting each other again settle. Junction easing looks past the regraded way's own old segments.

## How far ahead tiles and overlays are fetched (2026-11-18)

- Two rings of 2 km coarse tiles: the **lead ring** (4.4 km around a point up to 2.8 km ahead of a moving car,
  as in the JS game) and the **view ring** around the car out to the visible horizon + 300 m. The horizon is
  where the fog leaves 2 % of the terrain colour (√ln 50 / fog density ≈ 5.65 km with the default fog), or the
  camera's far clip without fog; the view ring is capped at 7 km. Every coarse tile fetches its overlays (OSM
  roads and features, NIBIO SR16) right after its heights, so overlays follow the same rings.
- Ready tiles are dropped beyond max(view ring, 2.8 + 4.4 km) + 900 m, so a tile the lead ring wants is never
  dropped and fetched again (the JS keep radius of 5.3 km does that at speed). The coarse atlas holds 96 tiles.
- Everything fetched lands in the geodata cache (IndexedDB on the web, `persistentDataPath/rally-cache` in the
  editor), so a second drive through the same landscape reads from disk. The cache holds at most **32 GB** and
  never fills the disk past 90 %: in the editor and on desktop the disk's free space is read exactly; a web page
  cannot see the disk, so there the browser's quota is used and 10 % of it stays unused. The room is measured at
  start, every 5 minutes and after every 256 MB written; when it shrank, the oldest entries are evicted.

## Streaming while driving (stream.js behaviour, verified 2026-11-16; seams and frame budget 2026-11-20)

- `TileScheduler.LedPoint` leads the load centre along the velocity (≤ LEAD_DISTANCE 2800 m, 3.5 s of travel);
  `GameController.Update` feeds `TileWorld.Update(carPos, car.State.Vel, …)` every frame, so the 4400 m ring stays
  ahead of a fast car and tiles beyond 5300 m are dropped behind it.
- Prefetch: `TileScheduler.SetPrefetchPath(points)` — in endless mode the next RoadWalk sector's centre line, on a
  normal (OSRM / demo) stage the stage line from the car to 2.5 km ahead, renewed every 200 m
  (`GameController.PrefetchStage`). The coarse tiles under it and the fine (1 m) tiles along it are queued *behind* the
  ring around the car (priority +50 000) and are exempt from the distance drop, so the road ahead is carved before the
  car gets there.
- Frame budget (`Core/WorkBudget`, 5 ms of streaming work per frame while driving, a quarter of the frame at low frame
  rates, 50 ms while the car waits on loading / start screen / countdown; the web build has no worker threads, so work is
  cut into pieces rather than moved to jobs): the DEM resample runs in 32-row bands (projection on a 16-sample lattice),
  `GameController` applies tile results while the budget lasts (at least one per frame), a coarse overlay runs as steps
  (roads, ribbon, bridges, signs, splat, water, houses, the houses' collider, carve) that runs to the end once started
  (a tile's roads count as in — `RoadGraph.HasTile` — only when graded to the end; neighbours cut from a way graded
  again are set again), and re-carves go to a queue in
  `TileWorld` that carves the tiles nearest to the car first. One Overpass answer is parsed once per tile.
- Measuring: `FrameProbe` (Core) records every real frame and the sections of each frame over 33 ms; `PreviewShots
  -previewDrive SECONDS -previewGlide` drives the car along the stage line (free drive: along the road) at exactly
  `-previewDriveKmh` and writes `bench_detail.txt` (distribution, slow frames with what ran, streaming work per frame,
  how long before the car arrived each 1 m tile was ready).
- Tile borders (`PreviewShots -previewSeams` surveys them): every tile's DTM is its own WCS request, so a new tile takes
  the edges (and corners) of the neighbours of its kind that are already in and fades the difference out over 4 coarse /
  16 fine samples (`TileWorld.Stitch`) — shared edges are identical. A 1 m tile blends into the 8 m ground over 16 m at
  every outline no fine neighbour continues (heights, carve mask, verge tone; `TerrainGround.hlsl FineWeight`, CPU twin
  `TileWorld.FineWeight` for the car) and fades in over 0.5 s. A coarse tile collects road segments by the widened reach
  it carves them with, and carves house pads of its neighbours too; each stretch of ribbon is drawn by the tile that
  holds its middle; roads over ground that is not loaded yet hold the nearest known ground and are graded again later.
- The car waits only at the start (`IGround.IsLoaded` under the start pose). While a fine tile is loading the car drives
  on the 8 m ground; `GameController` still holds a fine tile whose edge is within 30 m of the car for up to 3 s
  (`FineTileHoldDistance`), and the fade-in makes the change gradual.
- `TileWorld.GetStats()` = loaded coarse / fine counts, pending (queued + loading) and the CPU height bytes, shown in
  the HUD status line like `streamStats()` in the JS.

## Deviations from the JS worth knowing

- No separate corridor mesh: the clipmap draws the carved terrace directly, so `CARVE_MARGIN` (0.3 m) is not applied.
- Rim heights (`assignEdgeHeights`) are not ported: the terrace blends to the natural ground; single-lane roads use the
  1.5 m feather as their blend (`RoadProfile.ShoulderFor`).
- Lake trigger colliders are convex hulls (Unity requires convex trigger meshes); the car confirms with `WaterAt`.
- URP 17 has no height-fog Volume override; height fog is a terrain-shader uniform set from WorldStyle.

## Trees and ground from the overlays (2026-11-19)

**Mapping** (`LandcoverSplat`, landcover.js `applySr16` / `fillForestDefaults` / `tintByCover`): SR16 `SRRTRESLAG` gives the
species (spruce → spruce, pine → pine, deciduous → birch) and `SRRKRONEDEK` the crown cover = density, wherever OSM says open,
forest or scrub; OSM `forest`/`wood` fills SR16 gaps (species from `leaf_type` or a 64 m stand hash 60/20/20, crown 0.55).
No trees on fields, meadows, water, built-up land, bare rock/scree, roads (carve mask); residential gets a thin scatter of
garden trees, bogs a few stunted pines, heath shrubs; toward the tree line conifers and birch become mountain birch, above
it only shrubs for 150 m. The cover texture's alpha carries stream.js's tree budget (`LandcoverSplat.Budget`: 1 within 260 m
of a road, 0.4 elsewhere, all scaled to `VegetationRenderer.Capacity` = 12000 per tile — stream.js's 2600 thinned a closed
forest to ~10 %). One log line per tile: `overlay: <tile> N trees placed (spruce n, pine n, birch n, mountain birch n, shrub n)`.

**Ground**: two RGBA splat atlases (`_SplatAtlas` conifer floor / birch floor / field / rock, `_SplatAtlas2` heath / bog /
snow / sand), grass = remainder; the shader height-blends the layers by albedo alpha, anti-tiles with a rotated 0.29× second
sample (more of it with distance), adds slope rock (triplanar) and height snow, a low-frequency macro colour variation and
per-plot field furrows, and skips layers under 1 % (explicit-gradient samples, fine on GLES 3.0).

**Trees** (`Editor/TreeBuilder.cs`, everything procedural): Norway spruce 22 m (dense cone of drooping frond + hanging-curtain
cards to near the ground), Scots pine 19 m (bare lower 62 %, grey plated → orange flaky bark, flat umbrella of needle tufts),
birch 15 m (white bark, black lenticels, dark base, leaning; arching branches with side branches and a few core shoots, all
hung with crossed pairs of drooping twig-spray cards whose atlas is a two-layer leaf mass, ~36 % alpha cover), mountain birch
6 m (3–4 twisted stems with short side branches, the same sprays: a full, wide bush), shrub 1.4 m (its own leaf atlas, the
pre-2026-11-20 birch sprays). LOD0 ≤ ~3.1k triangles (birch 2.6k), LOD1 ~300–900, LOD2 ~60–240, then an impostor: LOD0 rendered from 8
azimuths into a 4 × 2 atlas of albedo × AO and frame-space normals (`Editor/TreeBake.shader`; crossed quads when there is no
graphics device). Bark and foliage share one submesh, told apart by the vertex colour, so each (species, LOD) is still one draw
on both paths. `Rally → Rebuild Tree and Ground Art` regenerates the textures too. `Editor/PreviewShots.cs` saves look-dev
screenshots (`-executeMethod Rally.Editor.PreviewShots.Run [-previewLive] [-previewNoCompute] -previewOut DIR`, with a display;
`-previewTrees` adds the nearest birch / mountain birch from 30 m and 100 m, the densest birch stand at eye height and a studio
pair from 12 / 30 / 100 / 350 m at the LOD the renderer would pick). `TreeCrownTests` hold the birch crowns full.

Fixed on the way: the tree draws used a default-initialised `RenderParams` (renderingLayerMask 0), so URP drew the trees only
into the shadow map; `Rally/Tree` takes its ambient from `_TreeAmbientUp/Down` (the ambient probe) instead of `SampleSH`,
which reads per-instance SH arrays under instancing.

## WebGL 2 (no compute) path

Chrome without WebGPU runs the build on WebGL 2 = GLES 3.0: no compute shaders, no SSBOs (StructuredBuffer), no
`#pragma target 4.5` (that is GLES 3.1 to Unity's GLES3 backend, so such a SubShader is "not supported on this GPU").
`Rally.Core.GpuCaps.Compute` is the one switch; every buffer and dispatch is gated on it (2026-11-16):

| | WebGPU / desktop (`GpuCaps.Compute`) | WebGL 2 fallback |
| --- | --- | --- |
| Tile tables `_CoarseSlices` / `_FineSlices` | dim × dim RFloat `Texture2D`, `LOAD_TEXTURE2D_LOD` in the vertex shader (both paths; `TileTable`) | same |
| Height / mask atlas | random-write RenderTexture arrays, `Carve.compute`, `AsyncGPUReadback` into the `HeightGrid` | plain `Texture2DArray`s; `CpuCarver` runs the Burst `CarveJob` on the grid and `TerrainTile.UploadHeights` re-uploads the slice |
| Trees | `Scatter.compute` → instance buffer, GPU cull, `RenderMeshIndirect` (`_RALLY_INDIRECT`) | `ScatterJob` (Burst) → `RenderMeshInstanced` per (species, LOD) bucket from CPU-culled matrices; tint = position hash, snow from `_TreeSnowLine` |
| Car dents | `_Impacts` StructuredBuffer in `Rally/CarBody` | `CarDamageVisual` rewrites the mesh vertices |
| Shaders | `Rally/Tree`, `Rally/CarBody`: first SubShader, target 4.5 (`exclude_renderers gles3`) | second SubShader, target 3.5; `Rally/TerrainClipmap`, `Rally/Water` are target 3.5; `Rally/CRT` (default target) now derives its Bayer threshold arithmetically instead of indexing a const array, which some WebGL GLSL compilers reject with the same "not supported" message |

Checks: `SceneSmokeTests.DrivesOnTheNoComputeFallbackPath` sets `GpuCaps.ForceNoCompute` and drives the scene through the
fallback C# (the editor GPU still compiles the high-target shaders); `Rally → Build Web (WebGL 2 only, diagnostic)`
(`-executeMethod Rally.Editor.BuildWeb.BuildWebGL2Only`, output `Build/WebGL2`) builds with OpenGLES3 as the only API so the
log lists any shader that fails for GLES 3.0. Known cost of the fallback: `Texture2DArray.Apply` re-sends the whole array when
`SystemInfo.copyTextureSupport` is `None`; the carve and scatter run on the main thread (Burst, one tile per frame).

### Road signs (2026-11-19)
- **Data:** `NvdbSource.FetchSigns(tile bounds)` — NVDB v4 type 96 Skiltplate (code e.g. `362.50`, `906V`, `713.H`, text,
  size, "Ansiktsside", sideposisjon, point) and 105 Fartsgrense (polylines), every page through the GeoCache (`nvdb`).
  `GameController.FetchFeatures` asks it with the roads; `PlaceSigns` runs when the tile's roads are registered.
- **Placement (`SignPlacement`):** plates inside the tile, within 25 m of a road (`IRoadQuery.Nearest`); plates on one NVDB
  point share a post. The post stands `FlatHalf + 0.9 m` from the centre line (in the carve's flat apron), or at the real
  distance up to 2.5 m further, at the real position along the road. Face direction: the metering direction is the OSM
  tangent when NVDB's side matches the plate's real side, else its reverse; "Trafikk i metreringsretning" faces against
  it, "mot" with it, "Parallelt mot/fra veg" across the road; unknown → right-hand rule. Stack order: 2xx, 1xx/3xx, 4xx, 5xx,
  6xx, 7xx, 9xx, each 8xx plate under the first main sign facing its way. `SpeedChangePlates` adds a 362 for each direction
  where two speed-limit polylines meet with different limits and no real speed plate stands within 40 m.
- **Faces (`SignCatalog`, `SignCanvas`, `SignFont`, `SignAtlas`):** designs in millimetres of the real "middels" plates
  (Liten ⅔, Stor 4⁄3); shapes as signed distances (exact anti-aliasing); text from `Resources/Signs/SignFont.ttf` (DejaVu
  Sans Condensed Bold, Bitstream Vera licence) via `FontAsset.CreateFontAsset` (dynamic SDF, CPU-readable, works in the
  player). A face is painted once per design key into a 2048² RGBA32 page (0.32 px/mm, 6 px gutter in the plate's edge
  colour, mips, 8× aniso) and shared; pages whose faces are all unused are recycled; at most 6 pages.
- **Mesh (`SignMesh`) and layer (`SignLayer`):** one mesh per tile, built when the car is within 1 km of the tile and its
  faces are painted (≤ 4 ms of painting per frame, one mesh per frame), destroyed beyond 1.5 km. 8-sided posts (Ø 60 / 80 mm,
  sunk 0.5 m, dark cap), plates cut to their outline with face, aluminium back (or a second face when two-sided), rim and
  clamp brackets; lowest plate edge 1.5 m (0.6 m for marker-only posts). Post feet from `TileWorld.HeightAt` (the car's
  ground). Capsules from `PropColliderPool` for posts within 35 m. Shader `Rally/Sign` (Resources, so the build includes
  it): face texel or vertex colour, Lambert + SH, retroreflective lobe towards the sun, metal highlight, grime noise,
  shadow caster and depth passes.
- **Not drawn:** codes without a design (701/709/711 junction boards, 725 distance boards, 6xx service signs, U722 local
  signposting, 828 extent arrows …); they are counted as "without a design" in the overlay log.

### Street lights (2026-11-22)
- **Data:** `NvdbSource.FetchLights(tile bounds + 40 m)` — NVDB v4 type 87 Belysningspunkt (point; 1874 Plassering, 1883
  Avstand fra vegkant, 1272 Bruksområde), 181 Lysmast (1338 Mastelengde synlig, 3895 Utligger, 10020 Utliggerarmens lengde;
  joined to its 87 by `relasjoner.foreldre`, else by position ≤ 0.5 m) and 86 Belysningsstrekning (line; 1714 Avstand
  innbyrdes, 1271 Bruksområde), `inkluder=geometri,egenskaper,relasjoner`, every page through the GeoCache (`nvdb`).
  Unreachable NVDB: no lights, a warning, never an error. Offline: `FakeSources.Lights` (a lit stretch + two masts per chunk).
  OSM `highway=street_lamp` is not used: the Overpass query asks for ways only.
- **Placement (`LightPlacement`):** a point stands at its place along the nearest ground road within 20 m, on its side,
  1 m (Avstand fra vegkant) beyond the road's flat band (carriageway + shoulder) or at its real distance up to 3 m further.
  A lit stretch gets a post every Avstand innbyrdes (default 40 m) on its right in its digitising direction, where no
  registered point is within half the spacing (tunnel stretches excepted). Dropped: lamps not on a mast (wall, rail, roof),
  points nearer a bridge deck or tunnel than a ground road, feet on any road's flat band, on a deck or in a tube
  (`TileWorld.TunnelAt`). Mast height from Mastelengde, else 10 m on two-lane roads and 8 m on the others; arm from Utligger
  (2 m without a length), else a 0.4 m bracket.
- **Mesh (`LightMesh`) and layer (`LightLayer`):** one mesh per tile built within 1 km of the car (one per frame), dropped
  beyond 1.5 km; Rally/Tunnel material (vertex colours: galvanised tapered mast Ø 180 → 100 mm sunk 0.5 m, arm rising 12 %,
  flat light grey LED head, warm emissive underside). Feet from `TileWorld.HeightAt`; a regrade of a tile's roads rebuilds
  the meshes over it (`Invalidate`). Capsules from `PropColliderPool` for masts within 35 m, also at once on a car placement.
