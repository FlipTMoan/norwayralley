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
