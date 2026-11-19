# Unity polish: graphics, feel, frame rate (2026-11-19)

User: "go through the unity game and improve graphics and feel, framerate etc".
Target: GTX 1060-class PC, Chrome, WebGL 2 path (no WebGPU adapter here); 60 fps at 1080p.

## User additions (top priority)
- [ ] Car must not cut through the road surface: ribbon vs carved ground vs wheel contact agree; no terrain through the ribbon; smooth edges (chase shot shows jagged grey carve, ribbon not visible).
- [ ] Road surface gravel/asphalt from map data: port JS NVDB Vegdekke (241, Massetype 1216) with OSM fallback; ribbon material, physics and HUD agree; gravel looks like gravel.

## 0. Baseline (measure before changing anything)
- [ ] Repeatable benchmark: fixed seeds/poses (start on road, dense forest, hillside overview, drive 60 s),
      frame time avg / p95, draw calls (SetPass / batches), triangles, tree instances drawn, GC allocs/frame.
      Editor (Profiler / FrameTimingManager) + web build in Chrome (rAF timing via the log window or a debug overlay line).
- [ ] Baseline screenshots of the same poses (PreviewShots).

## 1. Frame rate
- [ ] Broken cached DEM tile Coarse(5,3243) ("GeoTIFF: block shorter than its rows") re-requested every frame: drop bad entry, back off.
- [ ] Per-frame allocations in Update paths (scheduler, vegetation, HUD/log window).
- [ ] Vegetation CPU path at 12000/tile: cost per frame, LOD/draw distances, culling.
- [ ] URP asset: shadow distance/cascades, MSAA vs FXAA/SMAA, render scale, HDR, additional lights, depth/opaque textures only if used.
- [ ] Terrain shader cost (9 layers, triplanar), sky/water/CRT passes.
- [ ] Optional: adaptive render scale if frame time over budget.

## 2. Graphics
- [ ] Spruce/pine near-black when backlit; distant pines too orange (impostor/LOD2).
- [ ] Forest floor vs meadow distinct from a distance; road carve terrace tone.
- [ ] Lighting/atmosphere: sun angle, ambient, fog colour to sky, tonemapping + light grading, subtle bloom/vignette.
- [ ] Car: paint/reflection, shadows, wheel contact.

## 3. Feel
- [ ] Chase camera: lag/damping, speed-based FOV, subtle shake on gravel/bumps, look-ahead in bends.
- [ ] Feedback: dust/gravel particles, skid marks, sound coherence (engine/gear, surface).
- [ ] Handling: do NOT retune physics blindly; only fix clear bugs, list proposals.

## Verification
- [ ] Before/after numbers table + screenshots, EditMode + PlayMode green, web build boots in Chrome.
- [ ] Docs: CHANGES.md, unity/README*.md, help text if controls/options change.

## Review
(filled in when done)
