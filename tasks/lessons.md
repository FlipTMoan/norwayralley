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

## 2026-11-20 — road signs: check sign facts, and the cheap way to rasterise text in Unity
- The plan said Norwegian warning triangles have a yellow background; they are white with a red border (yellow is the
  temporary variant). Rule: check design facts (colours, shapes, typefaces) against a source before drawing them, and say
  in the review where the plan was wrong. The Wikimedia Commons API rate-limits quickly (HTTP 429): fetch one page, not loops.
- `UnityEngine.TextCore.Text.FontAsset.CreateFontAsset(font, …, GlyphRenderMode.SDFAA, …, AtlasPopulationMode.Dynamic)`
  gives a CPU-readable Alpha8 SDF atlas at run time (also in batchmode -nographics and in the WebGL player): text can be
  painted into CPU textures without a GPU readback or an offline glyph tool. Add the usual characters in one
  `TryAddCharacters` batch.
- Editor (Mono, debug) timings of CPU painting are ~20× the IL2CPP WebGL ones (60 ms vs 2.6 ms per face); measure in the
  player before optimising further.

## 2026-11-20 — car chooser: killed builds, one-lane stage lines, one drag for all cars
- Stopping a WebDev build mid-way (TaskStop) skipped BuildDevFromMenu's `finally`: ProjectSettings kept
  `webGLDebugSymbols: 2`. After any interrupted Unity run, `git status unity/ProjectSettings` and restore. SceneBuilder
  also rewrites GraphicsSettings/QualitySettings and the pine impostor: revert those unless the change is intended.
- "Max 50 km/h": the sim decided on-road against the stage line's fixed one-lane half width, while the world draws
  wider roads. Rule: any on-road / surface decision in the sim must agree with what is drawn (IGround.SurfaceAt) — the
  same "derive from the same function" rule as the road heights.
- A top-speed test on the sloped test terrain failed for physics that was fine: the 0.8 m crests launched the car at
  250 km/h. Use level ground for speed tests; check torque at the top gear's rpm too (two cars were torque-limited).
- Log component fields before DestroyImmediate (again): the builder's "body 'none'" log line was only a log bug.
- SceneBuilder saved the scene with `m_PanelSettings: {fileID: 0}`: no HUD at all in the web build, while every EditMode
  and PlayMode test passed (none looked at the UI). The panel was loaded early, then the tree rebake / car reimports
  refreshed the asset database and left a dead reference. Create scene-referenced assets last, right before BuildScene;
  diff the regenerated scene's `{fileID: 0}` count against HEAD; GarageSceneTests now asserts the panel and the cards.
  And look at the web build in Chrome before calling it done: only that showed it.

## 2026-11-20 — wheelspin: keep a new visual quantity out of the control loops it was not meant for
- Feeding the flared (wheelspin) revs into the automatic box and the power limit looked "realistic" and broke two
  untested-for behaviours: the MV6 hunted 1↔2 off road (Rpm lag vs instant slip) and the 736 lost off-road speed. Rule:
  when adding a quantity for feel (sound, rev bar, particles), give it its own field (`Rpm`) and leave the physics on the
  old one (`RoadRpm`) unless the change to the physics is the point; then a car that does not trigger the new effect
  drives bit-for-bit as before.
- Several existing tests sat within 1–3 % of their thresholds (736 off-road top 65.2 vs 65.0, Volvo 5.0 m vs 5 m). A
  `Spec.Spin = 0` A/B (EditMode or one PlayMode run) tells in minutes whether a failure is the new effect or the margin.

## 2026-11-20 — fuller birches: shared textures, and assets swapped for A/B
- The shrub drew from the birch leaf atlas: changing "birch" textures would have changed the shrub too. Before changing a
  shared asset, grep which prototypes use it; here the shrub got its own copy (same seed, pixel-identical, checked).
- `TreeBuilder` only regenerates a texture when its PNG is missing (or with Rebuild Art, which also regenerates ground and
  road art): delete just the PNGs that should change before `SceneBuilder.Build`.
- For before/after benches and "test fails on the old code" checks of generated assets, no worktree is needed: tar the
  new `Settings/Trees`, `git checkout HEAD --` it, run, untar. Bench runs at one place differ by ±2 % in static poses
  and the drive / forest-edge numbers are ruled by streaming hitches; repeat 3× and compare medians and p95.

## 2026-11-20 — bridges: square ends by "nearest wins", not by clip flags; look at the joints
- First try: flag the approach segment that ends at an abutment "clip at B" in the carve. The test still found the river
  filled 16 m from the abutment: the *earlier* segments' round end caps (5 m segments, 20–30 m carve reach) poke past
  the clip plane too. A per-abutment plane would have cut a road that bends along the bank onto the bridge. What works:
  the span is a carve segment that takes part in "nearest wins" and leaves the cells it wins natural; the bisector
  between deck and approach is the abutment, bends included, and `TileWorld.HeightAt` applies the same rule (deck
  nearer → not on the road). Rule: when a carve region must end, give the other side a claimant instead of cutting.
- The "along" shot showed a gravel strip across the road at every bridge end: a way meeting another end to end within
  its flat band is `Covered` and draws no ribbon, expecting the other way to — but a tagged bridge is its own way and its
  deck does not reach back over the land. The strip was there before bridges too (look at the before shots for the same
  defect before blaming the change). Fixed only for decks (`!q.Bridge`); other end-to-end way joints probably still have it (not checked).
- `git stash push -u -- <runtime paths>` (keeping the new editor tool) gave clean baseline benches and road surveys at
  HEAD without a worktree; the stash must hold the new `.meta` files too, or Unity deletes/regenerates GUIDs.

## 2026-11-20 — route map search: check the DOM state before typing into a Unity page
- A click on the HUD MAP button did not open the map (Unity UI clicks in the hidden automation tab are unreliable), and
  the "Bergen" typed next went to the game: G switched the gearbox, N scouted a new stage. Before `type` in a Unity web
  page, assert the target with JS (`map-overlay` has `open`, `document.activeElement.id` is the box); PICK A ROUTE ON
  THE MAP on the start screen opened it reliably.

## 2026-11-20 — tile seams and streaming hitches: survey first, and benchmark on a quiet GPU
- A border survey (`PreviewShots -previewSeams`) found four different seam causes in one run that the plan had lumped
  together: per-tile DEM resampling (edges 0.75 m apart), a carve that collected segments by a narrower reach than it
  carved with, house pads taken from the parent tile only, and roads graded on ground that was not loaded (a 340 m
  trench). A "recarve everything now" diagnostic told stale carves (fixed by it) from wrong segment choice (not fixed by
  it). Rule: add a diagnostic that separates timing from logic before fixing a seam.
- Chrome's GPU process sat at ~90 % GPU during the benches: 0.3–0.5 s waits showed up wherever the frame first touched
  the GPU (a compute dispatch, a buffer SetData) and looked like streaming hitches. Check `nvidia-smi` before a bench,
  and record the measured main-thread work per frame (FrameProbe `Work`, GPU waits named `.gpu…`) next to frame times.
- The ScriptedDriver got stuck in Sauda's streets after 0–600 m, so a "120 s drive" streamed nothing new; read the
  "m driven" line. For streaming benches move the car along the line at a fixed speed (`-previewGlide`).
- Each Unity launch of a bench batch recompiles: editing runtime code while a batch runs changes its later runs. Keep the
  next changes as patch scripts and apply them between batches.
- The editor's UnityTls rejects router.project-osrm.org (cert verify error 35) while curl works: pre-seed the file cache
  (key = the exact OsrmRouter URL, sha1 file name, meta lines key/kind/size/at/text) to drive OSRM stages in the editor.
- Splitting work into steps changed the meaning of a flag: `HasTile` (registered) had meant "roads all in". When a
  method becomes incremental, grep every reader of the state it sets at the start and decide which ones need "done".
- A queue that sends an unfinished multi-step job to the back multiplies its latency by the queue length: let a started
  job run to the end first. Measure time-to-ready of the start tile, not only frame times.
- A cache entry replaced for one consumer (a way graded again) must invalidate everything cut from the old entry; a test
  that permutes arrival orders (6 orders, compare the final world) found the 20 m seam that one-order tests never saw.

## 2026-11-20 — start screen / rename: waiting loops and Chrome window sizes
- `until ! pgrep -f "BuildDevFromMenu"; do sleep 3; done` never ends: pgrep -f matches the waiting shell's own command
  line. Wait on the Unity command itself (run it with run_in_background and take its notification), or match a pattern
  the waiter does not contain (`pgrep -f "Unity.*-executeMethod"` from a script file).
- The automation Chrome window was maximised on a 4K screen (DPR 2.5): `resize_window` changed nothing and every
  "1280×720" shot was really 1536×807. Check `innerWidth` after resizing; for exact sizes load the page in an iframe of
  that CSS size (scaled to fit) from a same-origin harness, which also keeps the iframe's DOM reachable from JS.
- "Esc doesn't work" was not reproducible in the build; before changing input code, test the real build with trusted
  key events and different focus states, then fix what the test shows (no touch counterpart, missing hint) instead of
  rewriting the key path.

## 2026-11-20 — obstacles and minor-road speed: survey drivers and shared test helpers
- The first minor-road survey drove full throttle with a plain pursuit driver: every car flew off the road at the first
  bend and spent 30–70 % "off road", which looked like a road-detection bug. A survey driver must brake for the bends
  ahead (lateral limit from the line's curvature) and log its own deviation; only then the off-road time is the car's.
  The careful run showed 0 % "on the ribbon but off road" — the real cause was the edge rule, not missing roads.
- Probing the drawn road's steepest 4 m per link found what speed logs could not: graded steps of 6–20 m where two ways
  meet end to end (every car stuck at 10–20 km/h). Log the ground profile at the worst spot, not only speeds.
- `Worlds.FlatRoad()` defaults to gravel: a new gravel speed limit broke the gearbox and engine-damage tests, which
  were about the drivetrain, not the surface. When a rule depends on a surface, grep the shared test helpers' defaults.
- A P-controller (gain on lateral error and yaw) to hold a line beside a road oscillated off at 150 km/h; aim at a point
  30 m + 1 s ahead and steer by the heading error (the ScriptedDriver way).
- To show a test fails on the old code without a worktree: copy the new files aside, `git show HEAD:<file> > <file>`
  for just the files under test, run the filtered tests, copy back (diff to confirm the restore).

## 2026-11-20 — tunnels: the DTM at a portal, and cascades that must converge
- A road end pinned to "the ground at its end node" is wrong at a tunnel portal: the DTM there runs up the rock face (a
  9 m OSM connector between a gorge bridge and a portal climbed 10 m, and the tunnel followed it). Look at the ground
  profile along the line of sight (`-previewPoses` logs it) before tuning visuals: the "lip" in the shot was a 10 m step.
- A regrade cascade ("ways that took their height from X follow X") ping-ponged 32 times between two tiles: a Rebuild
  dropped the tile's last refs, so ways were graded afresh and flagged their neighbours again. Rule: a follow-up rule
  must only fire when the value it protects actually changed (compare the joint height), and re-setting a tile must not
  throw away state it is about to recreate. Add a "set again without news flags nothing" assertion to load-order tests.
- An overpass test sampled on the lower road's centre line passed on the old code too (the road is nearer there); the
  bug was only where the deck's centre line is nearer. Run new tests against the old code (stash runtime + tests) first.
- Free drive "starts on the sea" when the start roads are late (Overpass mirrors failing): compare with the before run
  before calling it a regression.
