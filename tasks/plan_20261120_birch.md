# Fuller birch crowns in Unity — 2026-11-20

User: "Also Birch trees seem thinly branched..."

Birch and mountain birch are generated in code: unity/Assets/_Rally/Editor/TreeBuilder.cs makes the mesh LODs and impostors, and Editor/TreeTextures.cs makes the leaf and bark textures. The trees are drawn by World/Shaders/Tree.shader.

- [ ] Before changing anything, take PreviewShots of the tree species (close up, at 30 m and at 100 m) and a chase view in birch woodland.
- [ ] Make the birch crowns denser:
  - more and finer branches, with drooping twigs as on Betula pendula / pubescens
  - more leaf cards, with leaf clusters that overlap
  - an alpha texture with fuller leaf masses (fewer holes) and less alpha-cut thinning at a distance
  - a crown that fills the volume rather than a few sparse arms
- [ ] Mountain birch: a multi-stem, bushy shape that is just as dense.
- [ ] Keep the LOD steps and the impostor consistent with the denser crown: rebake the impostor and match its density.
- [ ] Frame-time budget: measure with the editor bench (`?bench`) before and after, with no more than about 5 % slower in closed forest.
- [ ] Take the same shots after the change, add or extend a test (for example leaf-card count or crown coverage of the impostor), update CHANGES.md, and check the WebDev build in Chrome.

Queue: after the car-choice agent, which holds Unity now (only one Unity instance can run).
