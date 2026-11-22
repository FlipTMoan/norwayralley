# Plan 2026-11-22 — Unity: road signs drawn correctly

Owner: "the rendering of road signs must be correct, currently it seems messed up." Asked what looks wrong, the
owner picked: **wrong picture or text** and **stacked or floating**.

## Known so far
- Geometry winding in `SignMesh` (plate face, back, rim, posts, brackets) checked by reading: it faces the right way.
  The problem is in what is painted or where plates go.
- Logs (Lillehammer, 2026-11-22): "414 plates on 295 posts … 56 without a design", "765 plates on 504 posts … 142
  without a design". Plates without a design are skipped (`SignCatalog`: null → not drawn). A post can then be left
  with a gap, or with nothing at all.
- NVDB gives all plates of one post the same point; `SignPlacement` groups plates closer than a limit onto one post and
  sorts them (`SortPlates`).

## Work
- [x] **Survey first (no fixes yet).** For the Lillehammer test box and a rural box, make a contact sheet with every
  distinct sign code drawn by the game next to its official design from Statens vegvesen's sign catalogue (vegskilt
  / skiltnormalen N300; use the NVDB sign code and the official SVG/PNG where open). Mark each as right, wrong
  symbol, wrong text, wrong colours or blank. Count the codes "without a design" by code and frequency.
- [x] **Stacking:** shots of the 10 posts with the most plates, from the road. Check against the NVDB data:
  - plates per post;
  - order top to bottom (main sign above its additional/underskilt plates);
  - vertical gaps (no overlap, no plate floating above the post top, no gap where a skipped plate was);
  - two posts for wide plates;
  - plate height above ground.

  Compare with Norwegian practice: the lower plate edge is ~1.5–2.2 m above the road in towns, the post is just
  taller than the top plate, and the plates are evenly spaced.
- [x] **Floating:** posts whose foot is not on the drawn ground (NVDB Z vs the game's ground, ground changes after a
  road regrade or a fine tile landing). Posts must be re-seated when the ground under them changes.
- [x] **Fix each cause** with a test: wrong designs (catalogue entries or the rasteriser `SignCanvas`/`SignText`/
  `SignFont`), stacking order and spacing, post height from the top plate, re-seating on ground changes, and the most
  frequent missing codes drawn (in order of frequency).
- [ ] Before/after contact sheet and post shots. EditMode + PlayMode green, WebDev in Chrome with no console errors.
- [x] Docs: CHANGES, README-world, lessons.

## Review (2026-11-22)
- **Causes.** (1) NVDB gives the plates of *both* sides of the road one point; `SignPlacement` grouped by distance only,
  so up to 12 plates (both sides, both directions) went on one post, duplicates stacked (40 / 50-end / 40 / 50-end).
  (2) The real order (Plasseringskode 5128) was not read; a rank heuristic put e.g. a 362 over the 729 street name.
  (3) Each face group was stacked from 1.5 m up on its own: back-to-back plates at different heights; the post ended
  4 cm under the top plate. (4) NVDB Tekst markup was printed ("@100 m@", "Hågå@", "650.20 / 723.31@"), road numbers
  after or inside the 723 symbol were lost, plain-number 723 plates not drawn. (5) Wrong designs: 518/520/522 round (Norway:
  blue squares), 526.1/526.2 swapped, 512 square (wide plate), 366/368 "SONE" under the disc, 727.1 yellow (blue), 306.1
  car only. (6) Zone signs took the *nearest* limit (often the 50 outside the zone). (7) Floating: in the editor survey after
  the overlays settled, 1 of 1816 (Lillehammer) and 0 of 234 (Sauda) feet were > 5 cm off the ground — the meshes were
  never re-seated, so any ground change after the build left posts in the air until the tile was dropped.
- **Changes.** `SignPlacement` (post = point + NVDB side, the other side across the road; Plasseringskode order;
  `ZoneKmhAt`), `SignMesh` (levels from the top, shared across faces; post 2 cm over the top plate), `SignLayer`
  (`Reseat`: 24 feet per frame, rebuild a tile with a foot > 5 cm off), `SignText` (markup forms), `SignCatalog`
  (corrections + 25 new designs), `NvdbSource` / `SignPlate.Order`, one line in `GameController.PlaceSigns`
  (`ZoneKmhAt`). Tools: `SignFacesSheet.Survey`, `PreviewShots -previewSigns` (`Editor/PreviewSigns.cs`).
- **Numbers.** 74 549 cached plates: drawn 56 587 (76 %) → 65 801 (88 %); codes with a design 155 → 187 of 360;
  14 codes drawn wrongly fixed (above). Lillehammer start area: posts 2990 → 3392, posts with ≥ 5 plates 25 → 8 (now
  direction-sign assemblies, NVDB orders 10–60).
- **Tests.** SignTests +7. EditMode 345/345, PlayMode 29/29.
- **Open.** 701.1/703.1 orientation boards, 600/635 service boards, 75x cycle routes, 521, 914 tunnel markers, 807.8 not drawn;
  155 (rider) falls back to the "!" of 156; 605 handset is a simple arc; NVDB `M` (traffic island) posts can stand at the
  carriageway edge; the 711 arrow is a plain arrow, not the angled N300 one.
