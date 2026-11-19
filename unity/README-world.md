# World / Roads layers — editor setup

Updated 2026-11-16 (WebGL 2 path). Code: `Assets/_Rally/Runtime/World` (Rally.World) and `Assets/_Rally/Runtime/Roads` (Rally.Roads).
Tests: `Assets/_Rally/Tests/EditMode/World` (Rally.Tests.Edit).

## What has to be assigned in the editor

1. **Layers** (Project Settings → Tags and Layers): `Buildings`, `Trees`, `Props`, `Water`, `Actors`.
   The terrain has no collider — ground height comes from `IGround.HeightAt` (HeightGrid). Collision matrix:
   Actors ↔ Buildings/Trees/Props/Actors collide; Water is trigger-only.
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
3. **URP asset**: WebGPU first; keep "Depth Texture" and "Opaque Texture" on for the water; shadow cascades 4.

## Flow at runtime

`TileWorld.Update(carWorld, velocity, camera, dt)` once per frame → `TileScheduler` decides which 2048 m / 256 m tiles are wanted,
raises `TileNeeded(key)` for one tile per frame; the driver fetches through Rally.Geo and calls
`TileWorld.OnTileData(key, dtm, cover, features, latitude)` (or `FetchFailed`). The tile then: uploads its base heights,
builds the land-cover splat, lakes/rivers/houses, carves roads (`IRoadQuery.CollectCarveSegments`) and house pads,
reads the carve back into its `HeightGrid` (WebGPU) and scatters trees. Roads: `RoadGraph.SetTile(key, roadGraphData, coarseGround)`
when a tile's ways arrive, then `TileWorld.RecarveWithin(bounds)`; `RibbonMesh.Build(lines, origin, world.CarvedHeightAt)` for the surface.

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

## Streaming while driving (stream.js behaviour, verified 2026-11-16)

- `TileScheduler.LedPoint` leads the load centre along the velocity (≤ LEAD_DISTANCE 2800 m, 3.5 s of travel);
  `GameController.Update` feeds `TileWorld.Update(carPos, car.State.Vel, …)` every frame, so the 4400 m ring stays
  ahead of a fast car and tiles beyond 5300 m are dropped behind it.
- Endless mode: `TileScheduler.SetPrefetchPath(points)` takes the next RoadWalk sector's centre line; the coarse tiles
  under it and the fine (1 m) tiles along it are queued *behind* the ring around the car (priority +50 000) and are
  exempt from the distance drop, so the road ahead is carved before the car gets there.
- A frame is never blocked: the DEM arrives as a task, `GameController` applies at most **one tile result per frame**
  (`TileWorld.OnTileData`: upload + carve, the clipmap shows it the same frame). Roads, OSM features and SR16 land cover
  arrive later through `TileWorld.OnTileFeatures` (splat, water, houses, pads, forest) and a failed Overpass answer is
  asked again after 45 s.
- The car waits only at the start (`IGround.IsLoaded` under the start pose). While a fine tile is loading the car drives
  on the 8 m ground; when the fine tile lands `TileWorld` simply switches to it (fine first, then coarse). To keep the
  decimetre step out from under the wheels, `GameController` holds a fine tile whose edge is within 30 m of the car for
  up to 3 s (`FineTileHoldDistance`); no height blending is implemented.
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
birch 15 m (white bark, black lenticels, dark base, leaning, drooping twig cards), mountain birch 6 m (multi-stemmed,
twisted), shrub 1.4 m. LOD0 ≤ ~3.1k triangles, LOD1 ~300–500, LOD2 ~130–190, then an impostor: LOD0 rendered from 8
azimuths into a 4 × 2 atlas of albedo × AO and frame-space normals (`Editor/TreeBake.shader`; crossed quads when there is no
graphics device). Bark and foliage share one submesh, told apart by the vertex colour, so each (species, LOD) is still one draw
on both paths. `Rally → Rebuild Tree and Ground Art` regenerates the textures too. `Editor/PreviewShots.cs` saves look-dev
screenshots (`-executeMethod Rally.Editor.PreviewShots.Run [-previewLive] [-previewNoCompute] -previewOut DIR`, with a display).

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
