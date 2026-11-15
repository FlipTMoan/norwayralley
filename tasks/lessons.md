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
