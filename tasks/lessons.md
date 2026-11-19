# Lessons

## 2026-11-13 — browser checks of the game loop
- The Claude-in-Chrome tab reports `document.visibilityState === 'hidden'`, so
  `requestAnimationFrame` only fires when a screenshot forces a paint. Static
  rendering checks work; anything that needs the simulation to advance
  (driving, countdown) does not. Verify physics with the Node tests in
  `tests/` instead (`npm test`), and use the browser only for visual checks.
- When comparing a measurement against an expectation, make sure the inputs
  were not mutated in between (`route.snapToTerrain()` re-reads heights that
  already include the carve lift).

## 2026-11-14 — streaming, maps and multi-file edits
- Leaflet in a background tab: zoom/fade animations wait for animation
  frames that never come, leaving panes stuck mid-zoom, and overlays added
  before `fitBounds` stay projected at the old zoom. Create the map with the
  animations off and add overlays after the view is final. The Chrome MCP
  screenshot of a hidden tab can also be stale for DOM-only changes; trust
  `getBoundingClientRect()` numbers over the picture.
- Any per-chunk derived data (road heights) must not depend on what else has
  loaded, or neighbouring chunks disagree at their border. Grade on coarse
  ground, over the whole way, and keep a per-way registry so later copies
  reuse earlier heights.
- A scripted multi-file edit that asserts on exact text must handle blank
  lines; when one replacement fails mid-script, the files already written
  stay changed. Check `git status`/diff after a failed script run.
- Overpass: overpass-api.de and private.coffee can hang for the full timeout
  while openstreetmap.fr answers at once; never try mirrors strictly in
  order, remember the one that answered and race when unknown.

## 2026-11-15 — ballistic take-off shipped too bouncy
- A physics change verified only on the synthetic test terrain (one crest,
  one table-top) missed how it behaves on the real mesh: facets and kinks
  made the car hop constantly (272 take-offs in 40 s). Before shipping a
  physics change, drive the demo stage in the hidden tab with a scripted
  controller and count ground/air transitions against the live build.
- Carrying state across a landing ("keep the ramp's lift") was a patch for a
  symptom (ramp flicker) whose real cause was a take-off that fired while the
  surface was still under the car. Fix the rule that fires wrongly instead
  of letting a later rule compensate: two half-rules that overlap flicker.
- Any launch/landing pair must use consistent geometry (same wheel margin,
  with hysteresis) or they alternate every substep.


## 2026-11-16 — `git add -A` swept the user's downloads into the repo
- What happened: the user dropped car model zips into `unity/Assets/_Rally/Art/Cars/`
  while I was committing a checkpoint with `git add -A`; 128 MB of archives were
  committed and pushed before they were unpacked. They are out of the tree now but
  remain in history unless the commits are rewritten.
- Rule: never `git add -A` across a folder the user may be dropping files into.
  Stage explicit paths; before any push run `git diff --cached --stat | tail` and
  look for files > 5 MB; keep `*.zip/*.rar/*.7z` ignored under asset folders.
- Rule: when parallel agents write a project nobody can compile, run an
  integration pass (asmdef graph, duplicate types, call-site signatures) before
  pushing, and say plainly in the report that nothing has compiled.

## 2026-11-16 — Unity headless runs
- PlayMode tests of this project cannot run with `-nographics`: the null device reports compute support but has no
  compiled kernels (`Kernel 'Carve' not found`) and no random-write R32 textures. Run them with a display
  (`DISPLAY=:0`, no `-nographics`); editor scripts and the web build are fine headless.
- `LogAssert.NoUnexpectedReceived()` fails on warnings too; fix the warning's root cause (missing resource, sRGB R8)
  rather than expecting it.
- When reading a component field after `DestroyImmediate` of its GameObject, Unity's `?:` null check reports
  "none": log before destroying.

## 2026-11-19 — trees were invisible for days; only their shadows drew
- `new RenderParams { ... }` (object initializer on the default struct) leaves `renderingLayerMask = 0`; URP's colour
  passes filter such draws out while the shadow pass still renders them. Always start from `new RenderParams(material)`.
- No test looked at a frame, so nobody saw it. For anything visual, render a screenshot (Editor/PreviewShots) and look
  at it before calling it done; a counter of "instances drawn" proves nothing about pixels.
- When a draw is "submitted but invisible", bisect against a known-good draw of the same mesh/material at the same spot
  (params, timing, data source) instead of theorising about shaders.

## 2026-11-19 — a work-in-progress web build overwrote the one the user plays
- A background agent rebuilt `unity/Build/Web` mid-task; the user started it and got a stack overflow (unbounded
  recursion, stripped wasm so no names). Rule: experiments build to `unity/Build/WebDev`; only a build that has
  booted and driven in Chrome without console errors goes to `unity/Build/Web`. For crashes in the player, build
  with `PlayerSettings.WebGL.debugSymbolMode` External/Embedded so the stack has names.

## 2026-11-19 — polish pass (frame rate, roads)
- A batchmode `PreviewShots` run hangs forever when any script changes while it plays (another agent, or me): leaving
  play mode recompiles, the domain reload drops the `delayCall` that was to exit. Exit directly; and don't edit scripts
  while a Unity run is in flight. `pgrep -f "Editor/Unity"` inside a `bash -c` matches the bash itself — anchor the
  pattern on the binary path (`pgrep -f "^/home/pc/Unity/Hub/Editor"`).
- Never build into the folder the user plays from: Unity writes Build/Web over ~4 minutes (data first, wasm last), and a
  page loaded in between gets a new framework with an old wasm. Build to Build/WebDev, check it in Chrome, then swap
  the folder in with two renames.
- The user's python server already listens on 8090; my own Chrome runs must use another port, or they silently measure
  whatever the user's server serves.
- Mesh heights sampled from a height grid at build time go stale when a finer grid arrives later (the road ribbon was
  built from the 8 m coarse tile and the 1 m tile then cut through it). Derive drawn surfaces from the same function the
  physics uses, not from a cache of it.
- `if (SegmentCount == 0) return;` where the count is only summed at the end of the call disabled junction easing for
  every way of the tile being loaded. Check guards against state that is updated in the same call.

## 2026-11-19 — JS roads: hidden-tab throttling, self-checking tests, window edges
- A Claude-in-Chrome tab that has been hidden for minutes gets Chrome's intensive timer throttling: `setTimeout`
  waits up to a minute and every `javascript_exec` with an `await` times out at 45 s ("renderer frozen"). Open a fresh
  tab for each measured run. A CDP timeout in the middle of `__step` drops the captured rAF callback and the game loop
  is dead in that tab; step in small batches with a time budget, or drive `car.update` directly for physics checks.
- A test that compared a road's surface against `network.nearest(..., filter)` passed on the old code because the old
  `nearest` ignored the filter and returned the road itself. Run new tests against the old code (a `git worktree` of
  HEAD in the scratchpad) and make sure they fail there before trusting them.
- Running means with windows in metres need a tolerance (or an exact integral): float error in `s` made samples
  alternately include one more neighbour and turned a straight grade into a staircase.
- Only roads that share an OSM node meet. Anchoring by "within the other road's band" alone pulled underpasses and
  tunnel roads 4–10 m onto the road above.

## 2026-11-19 — "the car suddenly brakes": a hidden water brake, found by measuring, not by driving
- The ScriptedDriver on live endless stages leaves the road within a minute (hairpins, steep verges), so a scripted
  "drive and wait for the bug" run never got far enough to see it. A per-road-point survey of the live data
  (`PreviewShots -previewRoadDebug`: is the car in water here?) found it at once: 197 of 4143 road points counted as
  0.2–0.7 m deep water, because every OSM waterway crossing a road adds its depth to whatever ground is there.
  Rule: for "sometimes the car does X", list every force/state that can cause X (drag, water, damage, contacts) and
  survey the live map for where each one fires on the road, before trying to reproduce it by driving.
- A plausible fix that matches another module's rule (rank carve segments by distance past the flat band, like
  `RoadGraph.Nearest`) fixed the case under test (a junction) and broke an untested one (grade-separated crossings: a
  wide road took a narrow road's cells, terrain 2 m over the ribbon). The live survey's "carved terrain above the
  ribbon" count went 3 → 166; reverted. Keep before/after survey numbers for every carve change, not only the new metric.
- Check new collision tests against the old code: the 60 km/h sideways case passed on the old code too; only 100 km/h
  on 0.05 s frames and the thin birch reproduced the pass-through.
