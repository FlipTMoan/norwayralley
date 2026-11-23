# World / Roads layers — editor setup

Updated 2026-11-23 (road joins 2: pinned nodes stay on OSM, side road ends on the main road, round curves; 2026-11-22: roads joined: mitred joins, junction mouths, dashes across joins, loading view; OSM roads per road region, shown as a joined network; street lights from NVDB; 2026-11-20: road tunnels and avalanche galleries, overpass carve rule, ways meeting at a node; house footprint rings for the car, nearest-first sign colliders; tile seams and the streaming frame budget; fuller birch crowns; road signs; road edge fit, earthworks, road surface detail; WebGL 2 path 2026-11-16). Code: `Assets/_Rally/Runtime/World` (Rally.World) and `Assets/_Rally/Runtime/Roads` (Rally.Roads).
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

## Continuous roads and one pause per data type (2026-11-22)

- **Survey:** `PreviewShots -previewContinuity` (Editor/PreviewContinuity.cs) waits until the overlay queue is idle, then walks
  every fetched drivable way of the tiles whose roads are in, every 2 m along its graded line, and raycasts the drawn
  ribbon: gaps, steps in the drawn surface, joints (ways graded apart at a shared node), tube ends and deck ends with
  neither road nor ground at the floor / deck height 3 m out, ways never drawn; tile seams flagged. Writes
  `continuity.csv`, `continuity.txt`, `continuity_spots.txt` and shots of the worst places (`-previewContSpots FILE`
  shoots a before run's places).
- **What made roads stop:** the Overpass parser stopped at the 440th house and dropped everything listed after it (by
  id), so new roads went missing in town tiles and stopped at the tile border (`OverpassSource.Parse` now only skips
  further houses); the ramps and slip roads (`*_link`) were never asked for (`OverpassQuery.RoadClasses`; a link has its
  road's class, one lane unless tagged, motorway / trunk links barred from stages like their roads; the cache key is
  `overpass2:` so answers cached without links are asked again); ways under ~6 m (connectors at tunnel mouths and
  junctions) were never drawn (`ProfileGrader.ResampleEven` keeps both ends, runs of two samples are drawn); and a way
  going on from another's end was not drawn over its first 5 m as if the other's ribbon covered it
  (`RoadGraph.UnderAnother`: a sample — and the middle of a segment — is left to another road only under one of that
  road's segments, within 0.3 m of its height, and only to a road that outranks it: class, then length, then id, so two
  ways graded in different orders cannot each leave the junction to the other). Also: a way that comes back to one of
  its own nodes takes its first pass's height there (`EaseOntoNodes`; loops met up to 18 m apart); a way crossing a tile
  without a node in it is graded and drawn there (`Crosses`; a 1.2 km tunnel segment left 204 m of tube undrawn); and
  only one tile overlay steps at a time (a second could step alongside and have its roads set again halfway).
- **Overlay data per type** (`Gameplay/OverlayFetch.cs`): a coarse tile's OSM roads + features, SR16 forest and NVDB
  surfaces, signs and lights are fetched in separate lanes into a `TileOverlay`; whatever lands is applied at once
  (`GameController.QueueOverlay` / `OverlaySteps`, steps as before). Roads wait once for NVDB's first surface answer (and
  are graded again if surfaces land later); signs and lights are placed when the roads are in; land cover, water and
  houses are built with whichever of forest and features is in, and again when the other lands. A type without an answer
  (sources return null) pauses only its own service — `ServiceBreakers` Overpass / NVDB / SR16 / DTM, 60 s — and asks
  again after the pause or 45 s; the others are neither delayed nor asked again. The HUD status line shows a paused
  service ("NVDB paused 42 s"); the LOG bar's progress line lists what the world still waits for, per type with tile
  counts and pauses (`waiting: terrain 24 · OSM roads 13 (paused 40 s) · NVDB signs 3 · forest 2`, first two + "+n" on a
  narrow screen; `OverlayFetch.Outstanding`), the log writes `stream: waiting for X: n tiles` / `stream: X all in` when a
  type starts / stops being waited for, and the start loader says "Waiting for OSM roads (Overpass busy, retry in 40 s)…".
  Before, a tile awaited all six fetches in turn, and an Overpass answer that never came
  left the tile without roads for good.
- **Road regions** (`Gameplay/RoadRegions.cs`, 2026-11-22): OSM roads are one roads-only query (`out tags geom`, only the
  tags the game reads kept, cache `osmroads1:`) per region of 3 × 3 coarse tiles on a fixed grid, asked for as soon as a tile
  is requested; the tile's roads are the ways of the regions around it that reach its padded box, handed over only when
  the regions of the tile and all 8 neighbours are in. Map features stay one query per tile (`overpass3:`), after the
  roads. Overpass servers (`OverpassMirrors`): probed, then the fastest free one per query with its own slots (dresel 4,
  others 2), hedged after 3 × its usual time, paused on its own when failing or slower than 15 s.
- **Shown as a network:** overlays draw roads nearest the car first and before houses; a tile's ribbon, carve, bridges
  and tunnels stay hidden until every neighbour the scheduler wants has its roads drawn (at most 45 s), then show and
  stay. The start screen waits (≤ 15 s) for the start tile's roads to show. Survey: `PreviewShots -previewLoading
  [-previewFreshCache]` (snapshots every 5 s while loading: roads ending at a tile edge, floating ribbon, the car's roads).

## Joins, junction mouths and the loading view (2026-11-22)
- **Joins** (`RibbonMesh.Mitres`): where exactly two runs end at one point (two ways end to end, a change of surface) both
  end stations are cut along the bisector of the two directions and widened by 1/cos of the half turn: one surface, edge
  lines meeting. `RoadGraph.SmoothPlan` smooths a way together with up to `ChainContextM` (50 m) of the way that goes on
  from an end where two ways of one road (same class and width, turning < `ChainMaxTurnDeg` 60°) meet and nothing else
  passes; an edge longer than 40 m at the joint gets a node 20 m from it so long straight edges stay straight. Both ways
  see the same nodes around the joint, so both pass through it the same way in any tile.
- **Centre dashes**: `v·4` is the along coordinate, `RibbonMesh.AlongScale(WayLength)` stretches it to a whole number of
  12 m periods per way and `Rally/Road` centres a dash on every multiple of 12 (`DashShift`): every way end is a dash centre,
  so the dashes run on across joins and tile borders whichever way the ways run.
- **Mouths** (`RibbonMesh.Mouths`): where a run goes from drawn to `Covered` (a side road reaching a road that outranks it)
  its ribbon ends where its centre line crosses the main road's drawn carriageway edge; the end station's rows lie on that
  edge (the main road's height there), flared over `MouthRadius(kind)` (track 3, minor 5, secondary/tertiary 8,
  primary/trunk 10 m) with flare stations at 1, 0.6, 0.3, 0.12 × the radius; a flared row past the edge (an oblique road's
  acute side) slides back onto it. The main road's vertices get UV2 = (S − mouth centre) / half length per side;
  `Rally/Road` breaks the edge line and clips the shoulder and skirt where |UV2| < 1. Worked out per tile from the runs
  alone, so the two tiles at a border build the same mouths.
- **Pinned nodes stay put** (2026-11-23, `ProfileGrader.SmoothThrough`): every pinned node (junctions, joints) is pulled
  back onto OSM in four rounds and then set exactly; one after the other, a later pin within the 40 m fade moved an earlier
  one off its node again, so a way ended up to 2.5 m short of the next (a gap across the road).
- **Side road ends not marked covered** (2026-11-23, `RibbonMesh.EndsOnOtherRoads`): a way's end sample on the carriageway
  band of a run that outranks it (class, longer way, lower id), not on a bridge or in a tunnel, within 1.5 m of its height,
  counts as covered for `Mouths`, so a side road graded before the main road came in, or off its height, ends on the main
  road's edge too. Not where another way goes on from that end within 60° (`GoesOn`: a street split into ways at a crossing
  is the through road there).
- **Curves** (2026-11-23, `RibbonMesh.Curves`): where the road turns 10° or more at a sample (radius under ~30 m), up to 3 stations between two
  samples on the Catmull-Rom curve through them (a roundabout was a 15-gon of 5 m samples); not on a run's end segments
  nor near a mouth. The car's ground and the carve still follow the 5 m segments (≤ 0.3 m apart on a 12 m roundabout).
- **Loading view** (`GameController.ParkCamera`): until the car is placed the camera looks at the start pin from 110 m
  south and 45 m over the higher ground of the two (3 km up before the pin's ground is in). It used to sit 6 m over sea
  level, under the ground, where the terrain is not drawn from below.
- **Grading cost** (FrameProbe totals in `-previewLoading`, `loading_profile.txt`): `RoadGraph.Dependents` uses an index
  (`easedBy`) instead of scanning every graded way; `Nearest` / `UnderAnother` scan only the buckets a segment within reach
  can be in (`SegReach`); a tile's signs and lights wait while other tiles' roads wait (`GameController.AfterOtherRoads`).
- Known limits: a way graded in a tile that does not hold the way going on from its end (the joint outside the padded
  tile) is smoothed without it (the mitre still joins the ribbons); two mouths on one side of a road within ~5 m share
  the per-vertex UV2 badly; a side road that is not `Covered` at the main road (graded before the main road arrived, or
  more than 0.3 m off its height) still runs into it.

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

### Road signs (2026-11-19, fixed 2026-11-22)
- **Data:** `NvdbSource.FetchSigns(tile bounds)` — NVDB v4 type 96 Skiltplate (code e.g. `362.50`, `906V`, `713.H`, text,
  size, "Ansiktsside", sideposisjon, Plasseringskode = place on the post, point) and 105 Fartsgrense (polylines), every page through the GeoCache (`nvdb`).
  `GameController.FetchFeatures` asks it with the roads; `PlaceSigns` runs when the tile's roads are registered.
- **Placement (`SignPlacement`):** plates inside the tile, within 25 m of a road (`IRoadQuery.Nearest`); plates on one NVDB
  point share a post. The post stands `FlatHalf + 0.9 m` from the centre line (in the carve's flat apron), or at the real
  distance up to 2.5 m further, at the real position along the road. NVDB gives the plates of *both* sides of the road one
  point: a post is the plates at one point with one NVDB side; a second side at the same point stands across the road. Face direction: the metering direction is the OSM
  tangent when NVDB's side matches the plate's real side, else its reverse; "Trafikk i metreringsretning" faces against
  it, "mot" with it, "Parallelt mot/fra veg" across the road; unknown → right-hand rule. Stack order: NVDB's
  Plasseringskode (lowest on top) when every plate of the post has one, else 2xx, 1xx/3xx, 4xx, 5xx, 6xx, 7xx, 9xx, each
  8xx plate under the first main sign facing its way. Zone signs (366/368) show the number on the plate, else the lowest
  NVDB limit within 15 m (`ZoneKmhAt`). `SpeedChangePlates` adds a 362 for each direction
  where two speed-limit polylines meet with different limits and no real speed plate stands within 40 m.
- **Faces (`SignCatalog`, `SignCanvas`, `SignFont`, `SignAtlas`):** designs in millimetres of the real "middels" plates
  (Liten ⅔, Stor 4⁄3); shapes as signed distances (exact anti-aliasing); text from `Resources/Signs/SignFont.ttf` (DejaVu
  Sans Condensed Bold, Bitstream Vera licence) via `FontAsset.CreateFontAsset` (dynamic SDF, CPU-readable, works in the
  player). A face is painted once per design key into a 2048² RGBA32 page (0.32 px/mm, 6 px gutter in the plate's edge
  colour, mips, 8× aniso) and shared; pages whose faces are all unused are recycled; at most 6 pages.
- **Mesh (`SignMesh`) and layer (`SignLayer`):** one mesh per tile, built when the car is within 1 km of the tile and its
  faces are painted (≤ 4 ms of painting per frame, one mesh per frame), destroyed beyond 1.5 km. 8-sided posts (Ø 60 / 80 mm,
  sunk 0.5 m, dark cap), plates cut to their outline with face, aluminium back (or a second face when two-sided), rim and
  clamp brackets; lowest plate edge 1.5 m (0.6 m for marker-only posts), plates stacked from the top in levels (the
  Plasseringskode, or each face's order): plates back to back share a level, 6 cm apart, the post ends 2 cm over the top
  plate. Post feet from `TileWorld.HeightAt` (the car's ground); 24 feet per frame are compared with the ground in turn, and a
  tile whose foot is more than 5 cm off (roads graded again, a finer DTM) is built again (`SignLayer.Reseat`). Capsules from `PropColliderPool` for posts within 35 m. Shader `Rally/Sign` (Resources, so the build includes
  it): face texel or vertex colour, Lambert + SH, retroreflective lobe towards the sun, metal highlight, grime noise,
  shadow caster and depth passes.
- **Text:** NVDB's Tekst markup is read, not printed: @…@ symbols dropped (text between @ kept as a line), "@@" a line
  break, road numbers after / inside a 723 symbol or between $ / ¤ become shields, placeholders ("???", "xxxx") are not
  printed; limit plates read "6t" / "Høyde 4,4 meter" as "6 t" / "4,4 m".
- **Not drawn:** codes without a design (701/703/709 junction boards, 725 distance boards, 600/635 service boards, 75x cycle
  routes, U722 local signposting, 914 tunnel markers …); they are counted as "without a design" in the overlay log. 88 %
  of the 74 549 plates in the editor's cache have a design (was 76 %).
- **Survey tools:** `-executeMethod Rally.Editor.SignFacesSheet.Survey -signSurvey DIR` (every cached plate through the
  catalogue: plates.tsv and a face PNG per design); `PreviewShots -previewSigns` (posts vs the ground, the busiest posts shot).

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

### Road verges: grass, wildflowers and bushes (2026-11-22)
- **Where (`Verges/VergeBuilder`):** a UTM-anchored lattice (herbs every 0.8 m, bushes every 3.2 m, jittered by a hash of
  the global index) in 64 m cells; each point is measured against every road on the ground near the cell
  (`IRoadQuery.CollectCarveSegments`): metres beyond the nearest drawn shoulder edge. Nothing on a carriageway or shoulder
  (+0.25 m), so junction mouths and driveways stay clear; nothing on a bridge deck or a tunnel's footprint, in a house box
  (+1 m), within 1 m of a sign post or light mast (bushes 2 m), on a tree trunk, on water, below 0.6 m (sea) or on slopes
  over 35°. Geometry is computed from the coarse tile's corner, so a plant does not depend on which cell built it.
- **What (`Verges/VergeRules`):** bands from the shoulder edge — mown grass 0–1.5 m, tall grass with flower drifts (55–60 % of the band, flowers 1.25× the grass, so drifts read from the chase camera) to the
  palette's band (6 m; forest 3 m; built-up land: lawn to 6 m, nothing else), bushes 3–12 m in thickets (patch noise; dense
  at a forest edge, few beside fields, none on rock or built-up land). Bog: cotton grass, meadowsweet, dwarf birch. Within
  150 m under the snow line: no flowers. Lupins weighted ×2 on two-lane roads, ×0.5 on minor roads (none on northern minor
  roads), none above 800 m.
- **Region (`Geo/Bioclimate`, `VergeRules.RegionFor`):** Artsdatabanken's "Bioklimatiske soner og seksjoner" (test version
  2026, Miljødirektoratet, NLOD 2.0) baked by `unity/Tools/bake_bioclimate.py` into `Geo/Resources/bioclimate.bytes`
  (1 km grid, EPSG:25833, 1.8 MB, byte = zone | section << 4; read from the map service's export with one renderer colour
  per class). The zone is corrected by the local height against the tile's tree line (above it alpine, more than 300 m
  under it north boreal at most). Seven palettes: lowland south/east (BN: cow parsley, lupins, cranesbill, vetch, clover,
  daisies; dog rose, raspberry, hazel), inland boreal (SB/MB: lupins, fireweed, buttercup, harebell; grey alder, willow,
  birch, juniper), north (NB or north of 65.5° N: fireweed, globe-flower, wood cranesbill, tyrihjelm, meadowsweet; birch,
  willow), oceanic west (O3, and O2 up to MB: foxglove, bracken, heather, lady's mantle; juniper, rowan, bog myrtle),
  continental (C1: dry grass, harebell, yarrow, sparse; juniper), low alpine (LA: heather, crowberry, bistort; dwarf birch)
  and middle/high alpine (sparse tufts, no bushes).
- **Drawing (`VergeMesh`, `VergeLayer`, `Resources/Verge/Verge.shader`):** one mesh and one renderer per cell: herbs within
  130 m, bushes within 260 m of the camera (nearest first, at most 3 a frame while `WorkBudget` lasts; dropped 40 m further out; a
  cell waits for its tile's overlay, `TileWorld.FeaturesIn`). Herbs are two crossed cards, bushes three at 60° plus an
  inner one, from `Resources/Verge/VergeAtlas.png` (8 × 8 cells of 128 px, painted by `Editor/VergeTextures`, menu Rally →
  Build Verge Atlas; mip coverage preserved). The vertex shader puts each plant on the drawn ground at its root
  (`TerrainGround.hlsl`), so re-carves and fine tiles need no rebuild; it thins the plants by rank with distance and
  shrinks them before they go; wind on the tops; the shader picks the fade range and wind by the vertex alpha (herb / bush); cells within 80 m cast shadows and the shadow pass collapses the herbs, so only bushes cast. Plain MeshRenderers: no compute, no
  instancing. The car drives through them. Rebuilt (`Invalidate`) when a tile's overlay is applied, a tile's roads are set
  again, or its trees arrive (`TreeIndex.TileAdded`). The coarse tiles keep their CPU cover copy on the compute path too
  (64 KB a tile).
- **Far away:** the terrain shader tints the verge terrace in the same drift noise with the three main flower colours of
  the palette at the camera (`_VergeFlowers`, `_VergeShare`, `_VergeOrigin`; `VergeRules.Drift` / `PatchPick` are the C#
  twins), from 90 m out. The flat band past the shoulder is painted half as gravel-grey as before.
