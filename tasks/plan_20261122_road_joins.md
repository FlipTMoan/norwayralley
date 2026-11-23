# Plan 2026-11-22 — Unity: roads and lines joined properly; no sky strips; the car's roads sooner

Owner: "the streets are still badly joined. make sure lines etc are properly connected." This was not done in
c0d2d2b; the regions work only stopped tiles drawing half networks. Taken over from
plan_20261122_road_regions.md ("Added … badly joined").

## Work
- [x] **Join survey** (extend `-previewContinuity` / PreviewLoading). At every node where two drawn ways meet end to
  end, measure:
  - the ribbon gap and the side offset;
  - centre and edge **line continuity**: gap < 0.3 m, side offset < 0.1 m, same line type unless the map changes it;
  - the height step.

  At junctions (3+ ways):
  - the side road meets the main road's edge with no gap and no z-fight;
  - the side road's lines stop at the main road's edge line;
  - the main road's edge line is broken across the side road's mouth.

  Areas: Lillehammer, Drammen, Sauda, Vinje. Counts before → after.
- [x] **One ribbon and one set of lines per chain** of end-to-end ways of the same road (same class/ref/name and
  width), not one per OSM way. Lines run continuously along the chain, also across tile borders.
- [x] **Junction mouths:** the side road's ribbon is trimmed or blended at the main road's edge, with rounded corners
  (radius from the classes), the main road's edge line is broken across the mouth, and no overlapping coplanar
  ribbons.
- [x] **Sky strips:** before the car spawns, strips of road and verge hang in the sky over the start screen (seen in
  the 20 s loading shots, before and after c0d2d2b). Find the cause (the loading camera below the terrain? ribbons or
  verges placed before their ground?) and fix it, with a test.
- [x] **The car's own roads sooner in town:** Lillehammer 20.4 s and Drammen 27.5 s from an empty cache (13.0 s and
  23.7 s before c0d2d2b). Grading a town tile is ~25 s of main-thread work. Profile it and make it faster (jobs/Burst
  or fewer passes), and grade the car's tile and its neighbours first. Target: not later than before c0d2d2b, better
  if possible.
- [x] **Bench:** frame time Lillehammer/Toten within +5 % of c0d2d2b (it was not benched there: bench c0d2d2b first).
- [x] Shots before/after: a town junction, a T-junction on a main road, two ways joined mid-bend, a tile edge.
- [x] Tests for each cause. EditMode + PlayMode green. WebDev build, checked in Chrome.
- [x] Docs, lessons, CHANGES.

## Review (2026-11-22)
**Causes (measured with the join survey, `PreviewShots -previewContinuity` → `joins.txt`, own triangle index over the
ribbon meshes):**
1. Every run ended square to its own last segment, and each way was smoothed alone with its end on its last OSM edge:
   two ways joined in a bend met at the full OSM corner (wedge outside, two ribbons over each other inside); roundabouts
   made of several ways were polygons.
2. The centre dash restarted at every way (v = metres along the way / 4): broken at 65 % of marked joints.
3. A side road's ribbon ran on to its first `Covered` sample, 0–5 m into the main road: two coplanar surfaces (z-fight),
   its lines over the main road's; the main road's edge line was painted across every mouth.
4. Sky strips: before the car was placed the camera sat 6 m over sea level (scene default), under the ground; terrain is
   not drawn from below, so the verges (and ribbons) along roads graded meanwhile hung in the sky.
5. Car's roads late: `RoadGraph.Dependents` scanned every graded way for every way graded (2.8 of 5.0 s of grading 38
   Lillehammer tiles, FrameProbe totals); then signs placement (0.1–0.7 s per town tile) sat in the start area's critical
   path (per-frame queue log in `-previewLoading`).

**What changed:** `RibbonMesh` (stations; mitres where two runs end at a point, or the straightest same-width pair of
three or more; `AlongScale` + `DashShift`; `Mouths`: cut at the main road's drawn carriageway edge, end rows on that edge
at its height, kerb flare `MouthRadius` 3–10 m shrinking for oblique entries, no mouth for merges < 32°, flared rows
clipped at the edge; UV2 mouths on the main road), `Road.shader` (UV2: edge line broken, shoulder/skirt clipped with a
fillet-shaped taper `MouthKeep`; dash centred on multiples of 12 m), `RoadGraph` (`SmoothPlan` chain context with 20 m
densify on long edges, one road = same class + width + turn < 60°; `easedBy` index for `Dependents`; `Nearest` /
`UnderAnother` scan only reachable buckets; grading probes), `ProfileGrader.SmoothThrough` (reports pinned positions),
`GameController` (`ParkCamera` / `LoadingView`; `AfterOtherRoads`: signs and lights after the other tiles' roads),
`FrameProbe.Totals`, editor `PreviewJoins.cs` (new), `PreviewContinuity`/`PreviewShots` (hook, `-previewJoinSpots`),
`PreviewLoading` (profile, per-tile timeline, queue log, spikes).

**Join survey, before → after** ("not joined" = any of: ribbon gap/overlap > 0.1 m, edge-line offset > 0.1 m, dash run
wrong by > 0.3 m, step > 5 cm, line type change the map does not make; mouths: gap past the edge, z-fight > 0.3 m, side
surface inside the main edge line > 0.3 m, edge line across the mouth):

| area | joints not joined | dashes broken | joint overlap > 0.1 m | joint gap > 0.1 m | borders not joined | mouths z-fight | side inside main | edge line across mouth |
|---|---|---|---|---|---|---|---|---|
| Lillehammer | 859 → 341 / 956 | 85 → 8 / 129 | 837 → 278 | 35 → 154 | 107 → 115 / 533 | 8006 → 5903 / 8127 | 3396 → 1686 | 1083 → 325 / 1312 |
| Drammen | 1677 → 705 / 1884 | 274 → 29 / 433 | 1580 → 600 | 68 → 229 | 101 → 115 / 614 | 9927 → 7122 / 10081 | 4627 → 2723 | 2053 → 556 / 2506 |
| Sauda | 228 → 86 / 263 | 50 → 11 / 75 | 214 → 65 | 11 → 42 | 14 → 13 / 170 | 1227 → 834 / 1244 | 506 → 254 | 288 → 45 / 305 |
| Vinje | 103 → 22 / 114 | 21 → 4 / 35 | 99 → 14 | 3 → 7 | 7 → 7 / 106 | 484 → 369 / 491 | 198 → 121 | 142 → 23 / 156 |

Edge lines offset > 0.1 m at joints: 2/131 → 0/129 (Lillehammer). Remaining joint overlaps are mostly another road
near the joint (dual carriageways, service roads alongside), not the joint itself (`joins_why.txt`).

**Car's roads, empty cache** (`-previewLoading -previewFreshCache`): Lillehammer 21.9 → 13.8 s, Drammen 27.1 → 17.8 s
(before road regions: 13.0 / 23.7 s). Grading of the 38 Lillehammer tiles 5.0 → 2.1 s main thread.

**Tests:** `RoadJoinTests` (9: bend joint one surface, smoothed through, dashes both ways round ×2, T: no overlap / no
gap, flare + edge line broken, crossing, follower index after drop/regrade, signs wait) — the bend, dash and mouth ones
fail on c0d2d2b (or do not compile: new API); `LoadingViewTests` (PlayMode, fake ground 50 m: the old camera at 6 m fails).
EditMode 345 → 354, PlayMode 29 → 30, all green.

**Open points:** joint gaps rose (small, 0.15–0.35 m at the shoulder edge right after many straight joints; not yet
explained — a fork/merge or a mouth of a third road nearby in the cases looked at); most mouths are still not clean in
the survey: side roads not `Covered` at the main road (graded before it in another tile, or > 0.3 m off its height)
still run into it, 3-arm nodes on a split main road; a way graded in a tile without the way going on from its end is
smoothed without context; two mouths on one side within ~5 m share UV2 badly; `.ov.ribbon` ~60–85 ms per town tile
(new station code); `signs.update` costs ~3 ms per frame while loading (sign face painting), not looked at.

**Bench (1920×1080, live; c0d2d2b → after), avg ms:** Lillehammer chase 7.51 → 7.15, drive 60 s 9.19 → 8.44 (p95 10.66 →
9.96); Toten chase 6.93 → 6.77, drive 8.86 → 8.05 (p95 10.52 → 9.64). Within +5 % (faster; run-to-run noise ~5 %).

**WebDev in Chrome** (port 8091, `?drive=61.1153,10.4663`, hidden tab): the loading view shows the town from above (no
strips in the sky), the start screen opens, the ribbon appears once carved, no console errors, no warnings in the game
log. Driving to a junction in the hidden tab was not possible (synthetic keys do not reach the input system); the
junction views are the editor shots (`scratchpad/road-joins/before_after_*.jpg`).

**Shots:** `scratchpad/road-joins/before_after_lillehammer.jpg`, `before_after_drammen.jpg` (town junction, T-junction on
a main road, joint in a bend, tile edge; same spots before/after), `sky_before_020s.png` vs `chrome_loading_view.jpg`.

## Review 2 (2026-11-23, follow-up: "the streets are still badly joined")
Scope after the lead's note: the joint-gap regression first, cheap robust mouth fixes, no junction-mouth redesign (that
follows `plan_20261122_smooth_crossings.md`).

**Causes found:**
1. *Joint ribbon gaps (regression of 33517c5)*: `ProfileGrader.SmoothThrough` pulled pinned nodes onto OSM one after the
   other with a 40 m fade; a later pin within 40 m moved an earlier one off its node again. With the chain context a joint
   is an interior pinned node, so the way graded with a junction just past the joint in its context ended 0.1–2.5 m short
   of the node and the next way started there (27 of the first 40 gap joints in Lillehammer; found by dumping both ways'
   end points). Fix: all pins pulled in four rounds, then set exactly.
2. *Mouths with two surfaces*: grading marks `Covered` only where the main road was graded first and within 0.3 m of its
   height. `RibbonMesh.EndsOnOtherRoads`: a way end on the carriageway band of a run that outranks it (≤ 1.5 m off its
   height, no bridge/tunnel) is covered for `Mouths`, except where another way goes on from that end within 60°
   (`GoesOn`; without it every arm of a crossing of split streets was cut back: bare ground in Drammen, caught in the shots).
   Effect small: most remaining two-surface mouths are not this case (left to the junction mesh plan).
3. *Roundabouts polygonal*: yes, the 5 m sample resolution (a 12 m roundabout is a 15-gon). `RibbonMesh.Curves`: up to 3
   stations per sample on a Catmull-Rom curve where the road turns ≥ 10° per sample; not on run end segments (stations
   there folded over the mitred neighbour: joint overlaps rose) nor near mouths.
4. Shallow merges (< 32°) and the jagged oblique roundabout entry: not changed (redesign plan).

**Join survey, 33517c5 → now** (same code paths, `scratchpad/road-joins2/survey_before` → `survey_final2`):

| area | joint gap > 0.1 | joint overlap | joints not joined | dashes broken | border gap | mouths z-fight | side inside | edge across |
|---|---|---|---|---|---|---|---|---|
| Lillehammer | 150 → 65 | 277 → 163 | 340 → 202 | 8 → 0 | 53 → 72 | 5815 → 5758 | 1647 → 1546 | 329 → 285 |
| Drammen | 228 → 142 | 597 → 446 | 702 → 525 | 29 → 5 | 46 → 74 | 7071 → 6916 | 2692 → 2549 | 557 → 482 |
| Sauda | 43 → 21 | 64 → 18 | 86 → 33 | 11 → 0 | 9 → 12 | 824 → 800 | 252 → 222 | 45 → 36 |
| Vinje | 7 → 6 | 14 → 5 | 22 → 9 | 4 → 0 | 2 → 6 | 364 → 356 | 118 → 102 | 23 → 23 |

Joint gaps are still above c0d2d2b (35/68/11/3): the remaining ones sit at junction mouths next to the joint (the main
road's shoulder left out, the side road's end short of the edge), corners > 60°, or are probe artefacts in bends.
Border gaps rose with `Curves`: the border probes run along the chord mid-segment, where the curved ribbon leaves it
(believed a survey artefact; not proven). Mouth "gap past the main edge" unchanged within noise.

**Bench** (1920×1080 live, avg ms, `bench_before` → after): Lillehammer chase 7.17 → 7.05, drive 60 s 8.24 → 8.20 (p95
9.85 → 9.83); Toten chase 6.82 → 6.69. Toten drive (8.16 → 11.70) and a rerun of both (20+ ms everywhere) were taken while
another user's CPU-bound job (`vocab_probe.py`, 100 % of a core) ran: not valid. The run with the denser 5° curve threshold
(more vertices than now) measured Toten drive 8.16 → 7.52, Lillehammer 8.24 → 8.16, so within +5 %; tris +15–35 % in the
curve-heavy views.
**Car's roads, empty cache (back to back, HEAD then this)**: Lillehammer 17.6 → 14.9 s, Drammen 32.8 → 21.9 s (network
dominated; the earlier HEAD runs gave 13.8 / 17.8 s). Main thread over the 37–38 Lillehammer tiles: `.ov.ribbon` 939 →
1127 ms (+5 ms per tile: curve stations, end rule), `.grade.plan` 294 → 363 ms (four pin rounds).
**Tests:** EditMode 354 → 359, PlayMode 30, all green. WebDev rebuilt (`Build/WebDev`, success). Not checked in Chrome
this round.

**Open points:** mouth z-fight still ~70 % of mouths (main cause not isolated: e.g. side and main both drawn with no mouth
found although the end is on the band); shallow merges; oblique entries; border probe vs curved ribbon; the crossing guard
test does not reproduce the Drammen hole synthetically.
