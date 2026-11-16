# Unity project conventions

- Unity 6 (6000.6+), URP, **WebGPU** graphics API first (WebGL 2 fallback). Build target: Web.
- Planar frame: EPSG:25833 metres (`Utm33`). Unity world x = easting − origin, z = northing − origin, y = height.
  Long-lived positions are `Utm33` doubles; `FloatingOrigin` rebases every 2048 m.
- One assembly definition per layer under `Assets/_Rally/Runtime/<Layer>/Rally.<Layer>.asmdef`.
  Allowed references (lower only): Core ← Geo ← World ← Roads ← Track ← Vehicle/Actors ← Gameplay ← Net/UI/Presentation.
- Pure logic = plain C# classes/structs (no MonoBehaviour) so EditMode tests run them without a scene.
  MonoBehaviours only bind input, transforms and GPU resources.
- "Full GPU": heights, land cover, carve masks and scatter live in textures/buffers on the GPU.
  Terrain is a GPU clipmap (vertex shader displacement), carving is a compute shader, trees/props are
  `RenderMeshIndirect` with compute culling. The CPU keeps one `HeightGrid` copy per tile for physics,
  refreshed by `AsyncGPUReadback` after each carve (WebGPU) — on WebGL 2 the carve also runs on the CPU
  (Burst job) as the fallback.
- Every geodata request goes through `Rally.Geo.GeoCache` (IndexedDB via `idb.jslib`) and a circuit breaker.
- No allocations in per-frame paths; use `NativeArray`, `Unity.Mathematics`, Burst jobs.
- Tests: `Assets/_Rally/Tests/EditMode` (pure), `Assets/_Rally/Tests/PlayMode` (scene, real DTM tile asset).
- Doc comments on every public type explain the *why*, as in the JS sources.
