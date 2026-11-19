# Unity polish: graphics, feel, frame rate (2026-11-19)

User: "go through the unity game and improve graphics and feel, framerate etc".
Target: GTX 1060-class PC, Chrome, WebGL 2 path (no WebGPU adapter here); 60 fps at 1080p.

## User additions (top priority)
- [x] Car must not cut through the road surface: ribbon vs carved ground vs wheel contact agree; no terrain through the ribbon; smooth edges (chase shot shows jagged grey carve, ribbon not visible).
- [x] Road surface gravel/asphalt from map data: port JS NVDB Vegdekke (241, Massetype 1216) with OSM fallback; ribbon material, physics and HUD agree; gravel looks like gravel.

- [x] Roads spline-smooth along travel (plan + height), blended at junctions/crossings (main road wins, also across tiles), straight cross-section edge to edge (small crossfall in bends ok). Same in JS (separate agent).

## 0. Baseline (measure before changing anything)
- [x] Repeatable benchmark: fixed seeds/poses (start on road, dense forest, hillside overview, drive 60 s),
      frame time avg / p95, draw calls (SetPass / batches), triangles, tree instances drawn, GC allocs/frame.
      Editor (Profiler / FrameTimingManager) + web build in Chrome (rAF timing via the log window or a debug overlay line).
- [x] Baseline screenshots of the same poses (PreviewShots).

## 1. Frame rate
- [x] (fixed in the main session: GDAL sparse tiles) Broken cached DEM tile Coarse(5,3243) ("GeoTIFF: block shorter than its rows") re-requested every frame: drop bad entry, back off.
- [ ] Per-frame allocations in Update paths (scheduler, vegetation, HUD/log window).
- [x] Vegetation CPU path at 12000/tile: cost per frame, LOD/draw distances, culling.
- [x] URP asset: shadow distance/cascades, MSAA vs FXAA/SMAA, render scale, HDR, additional lights, depth/opaque textures only if used.
- [ ] Terrain shader cost (9 layers, triplanar), sky/water/CRT passes.
- [ ] Optional: adaptive render scale if frame time over budget.

## 2. Graphics
- [x] Spruce/pine near-black when backlit; distant pines too orange (impostor/LOD2).
- [x] Forest floor vs meadow distinct from a distance; road carve terrace tone.
- [x] Lighting/atmosphere: sun angle, ambient, fog colour to sky, tonemapping + light grading, subtle bloom/vignette.
- [ ] Car: paint/reflection, shadows, wheel contact.

## 3. Feel
- [x] Chase camera: lag/damping, speed-based FOV, subtle shake on gravel/bumps, look-ahead in bends.
- [x] Feedback: dust/gravel particles, skid marks, sound coherence (engine/gear, surface). — all exist (CarEffects, CarAudio); left as they are.
- [x] Handling: do NOT retune physics blindly; only fix clear bugs, list proposals.

## Verification
- [x] Before/after numbers table + screenshots, EditMode + PlayMode green, web build boots in Chrome.
- [x] Docs: CHANGES.md, unity/README*.md, help text if controls/options change.

## Review
- Chrome (GTX 1060, WebGL 2, ~1920×990, stage ?seed=beef;59.6501,6.34968&bench, 60 s ScriptedDriver drive, 10 s windows):
  before: 49 / 96 ms avg in the first two windows while the 1 m tiles streamed (p95 up to 122 ms), then 5.2–6.1 ms;
  after: 6.1–8.8 ms in every window (p95 ≤ 24 ms), steady state 4.7–6.5 ms. Streaming hitches were the frame-rate problem,
  not the steady state (already ~175 fps).
- Roads (live, 59.6501/6.34968, all road points within 600 m): |ribbon − wheel ground| mean 0.20 → 0.002 m, > 5 cm 52 % → 1 %,
  terrain above the ribbon 10 % → 0.02 %. Root cause: ribbon heights sampled from the 8 m grid at road arrival.
- Tests: EditMode 144/144 (incl. RibbonGroundTests ×2, NVDB surface, TreeCullJob, FrameStats, CameraShake, GeoTiff sparse), PlayMode 4/4.
- Not done: per-frame allocations audit, terrain shader cost, adaptive render scale, car look, a PlayMode junction drive,
  StageRoute (OSRM/demo) smoothing, cross-tile "main road wins" when the side road was graded first, bridges.
- Web: Build/WebDev (symbols) checked in Chrome (booted, drove 60 s, no errors) and swapped into Build/Web.

