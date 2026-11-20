# Fuller birch crowns in Unity — 2026-11-20

User: "Also Birch trees seem thinly branched..."

Birch and mountain birch are generated in code: unity/Assets/_Rally/Editor/TreeBuilder.cs makes the mesh LODs and impostors, and Editor/TreeTextures.cs makes the leaf and bark textures. The trees are drawn by World/Shaders/Tree.shader.

- [x] Before changing anything, take PreviewShots of the tree species (close up, at 30 m and at 100 m) and a chase view in birch woodland.
- [x] Make the birch crowns denser:
  - more and finer branches, with drooping twigs as on Betula pendula / pubescens
  - more leaf cards, with leaf clusters that overlap
  - an alpha texture with fuller leaf masses (fewer holes) and less alpha-cut thinning at a distance
  - a crown that fills the volume rather than a few sparse arms
- [x] Mountain birch: a multi-stem, bushy shape that is just as dense.
- [x] Keep the LOD steps and the impostor consistent with the denser crown: rebake the impostor and match its density.
- [x] Frame-time budget: measure with the editor bench (`?bench`) before and after, with no more than about 5 % slower in closed forest.
- [x] Take the same shots after the change, add or extend a test (for example leaf-card count or crown coverage of the impostor), update CHANGES.md, and check the WebDev build in Chrome.

Queue: after the car-choice agent, which holds Unity now (only one Unity instance can run).

## Review (2026-11-20)

- Cause of "thin": the birch leaf atlas was 12.5 % leaf (one line of single leaves per card) and the crown was 12 bare arms
  with one card pair per twig; the far LODs and the impostor inherited the gaps (impostor crown cover 0.28, mountain birch 0.10).
- Done: new spray atlas (36 % cover, two layers), 16 branches + side branches + core shoots with crossed, long hanging sprays,
  mountain birch with 4 stems and side branches; LOD 1/2 rebuilt to match (bigger crossed sprays), impostors rebaked
  (0.57 / 0.43 cover). Shrub keeps the old sprays as its own atlas (pixel-identical); spruce/pine untouched.
- Distance thinning was the atlas, not the shader: `mipMapsPreserveCoverage` was already on, so the cutoff was left alone.
- Tests: `TreeCrownTests` (5), checked to fail on HEAD's assets. EditMode 186/186, PlayMode 12/12.
- Bench (Hovden birch woodland, 3 runs each): static poses +1–2 %, drive p95 +4 % (noisy). Within the 5 % budget.
- Shots: scratchpad `birch/compare/*.png` and `birch/before_after_birch.png`. WebDev checked in Chrome (HUD, no console
  errors), synced to Build/Web.
- Open: no road through the densest birch stand was found for a true chase shot (`15_birch_wood_edge` is the eye-height
  view of it; the Hovden chase view starts at a road end with birches behind). Dense crowns now hide much of the white
  trunks in woodland and their shaded side is quite dark; a lighter translucency could be tried if the user finds them heavy.
