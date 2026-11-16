# World / Roads layers — editor setup

Updated 2026-11-16 (WebGL 2 path). Code: `Assets/_Rally/Runtime/World` (Rally.World) and `Assets/_Rally/Runtime/Roads` (Rally.Roads).
Tests: `Assets/_Rally/Tests/EditMode/World` (Rally.Tests.Edit).

## What has to be assigned in the editor

1. **Layers** (Project Settings → Tags and Layers): `Buildings`, `Trees`, `Props`, `Water`, `Actors`.
   The terrain has no collider — ground height comes from `IGround.HeightAt` (HeightGrid). Collision matrix:
   Actors ↔ Buildings/Trees/Props/Actors collide; Water is trigger-only.
2. **WorldStyle asset** (Create → Rally → World Style): assign
   - `TerrainMaterial`: a material on `Rally/TerrainClipmap` with `_Albedo` / `_Normals` Texture2DArrays of 5 slices
     in this order: forest floor, bog, pasture, rock, snow.
   - `Vegetation`: a VegetationSet (Create → Rally → Vegetation Set), 5 prototypes in this order:
     spruce, pine, birch, mountain birch, shrub; each with 3 LOD meshes, a billboard quad (unit quad, x −0.5..0.5, y 0..1),
     materials on `Rally/Tree` (one normal, one with `_Billboard = 1`). Leaves use the alpha cutout.
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
