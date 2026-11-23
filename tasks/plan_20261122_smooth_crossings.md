# Plan 2026-11-22: Unity, roads joined smoothly at crossings

Owner: "investigate a way to join roads smoothly at crossings". This is a research and design plan. Nothing is
implemented yet. Line numbers refer to HEAD `33517c5`. Another agent is editing `RibbonMesh.cs`, `RoadGraph.cs` and
`ProfileGrader.cs` at the moment, so re-check the line numbers before starting.

## 1. What the code does today

### Data flow
- `RoadGraph` grades each OSM way once, major class first (`RoadGraph.cs:310-315`).
- It cuts each graded way into per-tile `RoadPolyline` runs (`RoadGraph.cs:24-35`, `Flush` at `456-488`). A run has
  samples about 5 m apart, each with `P`, `RoadY`, `S` and the flags `Covered`, `Bridge`, `Tunnel` and `Portal`.
- `GameController.BuildRibbon` calls `RibbonMesh.Build(lines, key.Origin, key.Bounds)` once per tile, in one frame
  (`GameController.cs:782-795`). It is timed as `.ov.ribbon` (`GameController.cs:518-519`) and takes 60–85 ms per
  town tile.
- **The ribbon sees no node topology.** `RoadPolyline` carries no OSM node ids. The node tables (`nodeCount`,
  `wayEnds` at `RoadGraph.cs:277-293`, and `nodeWays` at `143` / `RegisterNodes` at `652`) stay inside `RoadGraph`.

### Plan line
- `SmoothPlan` (`RoadGraph.cs:542-595`) runs Chaikin ×4 through the way's nodes. Nodes shared by more than one way are
  pinned.
- Where exactly two ways of one road meet end to end (same class and width, turn under 60°), the way is smoothed
  together with `ChainContextM` (50 m) of the next way.
- `ProfileGrader.ResampleEven` then samples it every 5 m. An interior junction node is generally **not** a sample.

### Heights at junctions
- `EaseOntoNodes` (`RoadGraph.cs:732`) eases a way onto heights already graded at shared nodes, ±60 m.
- `EaseOntoJunctions` (`RoadGraph.cs:1034-1103`): within the other road's `FlatHalf + CarveApron + JunctionFlat (6 m)`,
  the side road takes the main road's height exactly. It then ramps back to its own grade over `JunctionRamp` (25 m,
  smoothstep).
- `covered[i]` (`RoadGraph.cs:1080`) is set only where the sample lies inside the other road's flat band, that road
  `Outranks` it, and the heights agree within `CoverStep` (0.3 m). That check is `UnderAnother` (`1113-1139`).
- So **junction detection is geometric and depends on grading order.** It is not topological.

### Ribbon (`RibbonMesh.cs`)
- **Build** (`101-207`): one `Strip` per run, with normals from neighbouring samples. `Drawn` covers the run minus
  segments whose two ends are both `Covered` (`114`).
- Each station emits 6 rows: skirt, shoulder, edge, edge, shoulder, skirt (`145-171`).
  - UV0: u = −1..2 across, v = S·`AlongScale`/4.
  - UV1 = (half width, tunnel weight).
  - UV2 = the mouth parameter per side.
- Quads are emitted only where the segment is drawn and the tile owns its midpoint (`172-181`). Sub-mesh 0 is tarmac,
  sub-mesh 1 is gravel.
- **Mitres** (`239-276`): run ends are hashed by position to 1 cm.
  - With exactly two ends at a point, or the straightest same-width pair of three or more (`253-265`), both end
    stations are cut on the bisector and scaled by 1/cos (`289-296`).
  - The remaining ends at a 3+ node get nothing here.
- **Mouths** (`303-427`): for each drawn→`Covered` transition in a run (`329`), it looks for the nearest *other* run
  whose centre line is within `FlatHalf + 0.5` of the covered sample (`333-351`). That run is taken as the main road.
  - It walks the side road's centre outwards, up to 5 segments, to where it crosses the main road's carriageway edge
    polyline (`360-373`).
  - It skips the mouth when the angle to the edge is under 32° (`MergeCos 0.85`, `379-380`, `469`).
  - It shrinks the radius `MouthRadius(kind)` (3/5/8/10 m, `61-70`) for oblique entries (`383`).
  - It builds an end station whose 6 rows are slid along the side road's direction onto the main road's edge, with the
    main road's height (`385-418`, `MainY` `454-466`).
  - It adds flare stations at 1, 0.6, 0.3 and 0.12·r with a quarter-circle `Flare` widening (`472`, `Stations`
    `475-514`), clipped to the edge line (`156-161`).
  - It undraws the side run past the cut (`423`) and gives the main road a UV2 interval (`424`).
- **Road.shader**: `InMouth` (`Road.shader:56`) breaks the main road's edge line where |UV2| < 1 (`195`). It clips the
  shoulder and skirt by `MouthKeep(e)`, an approximate fillet taper (`59-63`, `RibbonMesh.MouthKeep:54`). The centre
  dash is centred on every 12 m (`193`).
- Asphalt detail is sampled in **world XZ** (`Road.shader:99-104`), so two meshes meeting at a seam continue the
  texture. Edge ravel, ruts and potholes use `across` / `along` and do not continue.

### Why many mouths are still not clean
From the Lillehammer survey `scratchpad/road-joins/survey_final/lillehammer/joins.csv`: 8128 mouths in 38 tiles, about
214 per tile. 1617 are clean and 5818 z-fight (median overlap 3.3 m).

| ways at the node | mouths | z-fight > 0.3 m |
|---|---|---|
| 2 (side road onto a through way) | 5836 | 3611 (62 %) |
| 3 (main road split at the node) | 1868 | 1785 (96 %) |
| 4–5 | 424 | 422 (99.5 %) |

Root causes, from the code above:
1. **Detection depends on `Covered`.** A side road that is not `Covered` gets no mouth and runs on into the main road.
   This happens when:
   - it was graded before the main road (another tile or load order),
   - it is more than 0.3 m off the main road's height, or
   - it is the square end of a split main road (`EndMargin`, `RoadGraph.cs:1129-1130`).
2. **3+ way nodes.** `Mitres` takes the straight pair. Every other end at the node is an ordinary square run end, and
   it overlaps the pair's mitred ends because nothing trims it. The side road's `Covered` test also fails near the
   main road's split ends (point 1).
3. **Shallow merges (< 32°)**: no mouth by design, so the side ribbon overlaps.
4. **Roundabouts**: a ring made of several ways is now smoothed in chains (`SmoothPlan`). The entry and exit arms
   still meet it obliquely, the radius shrinks to 0, and no fillet is drawn. A ring whose ways change class or width
   is not one road for `OneRoad` and stays polygonal.
5. **Corners**: the fillet exists only as flared rows of the side ribbon, plus an approximate shader taper on the main
   road's shoulder. There is no kerb line around the corner.

## 2. Techniques used elsewhere (references)

- **Junction polygon from thickened centre lines.** A/B Street / osm2streets works like this:
  1. Offset every road by its half width.
  2. Where the offset sides of neighbouring roads collide, trim each centre line back to the foot of the
     perpendicular from the collision point.
  3. Re-thicken the roads.
  4. The intersection polygon is the trimmed side endpoints plus the collision points, sorted by angle around the node.

  Short roads (dual carriageways, dog-legs) are merged into one polygon. Ramps and phantom collisions are known weak
  points. [A/B Street intersection geometry](https://a-b-street.github.io/docs/tech/map/geometry/index.html),
  [osm2streets](https://github.com/a-b-street/osm2streets).
- **OSM2World** models a junction as its own world object (`RoadJunction extends JunctionNodeWorldObject`) with
  `cutVectors`/`cutCenters` per connected road, a junction outline polygon and its own triangulation. The roads end at
  the cuts. [Javadoc](https://osm2world.org/docs/javadoc/org/osm2world/core/world/modules/RoadModule.RoadJunction.html)
- **CityEngine** builds a separate node shape per graph node.
  - Types: *Crossing*, *Junction* (the major street is *not* broken; minor streets attach through junction entries),
    *Roundabout* (with an island radius) and *Freeway* entry.
  - Settings: a curb radius `minArcRadius` (arcs, or straight corners), an angle threshold below which streets are bent
    apart, and a principal street, by default the two widest segments.
  - Neighbouring node shapes can conflict and need cleanup.

  [Intersection parameters](https://doc.arcgis.com/en/cityengine/latest/help/help-intersection-parameters.htm),
  [street and crossing shapes](https://doc.arcgis.com/en/cityengine/2021.1/help/help-street-and-crossing-shapes.htm)
- **StreetGen** (Cura, Perret, Paparoditis) buffers the road axes with a per-vertex radius. It cuts them with border
  lines placed from the turning radius and links neighbouring roads with circular arcs.
  [arXiv:1801.05741](https://arxiv.org/abs/1801.05741). Wang et al. likewise offset centre lines, fit arcs and tangents,
  and sort the points into the intersection outline.
  [arXiv:2103.08275](https://arxiv.org/abs/2103.08275)
- **Cities: Skylines** splits the network into segments, each with left/right Bézier edges, and nodes. Nodes are
  rendered with their own node meshes. In CS2 the edge-node geometry carries left/right/middle curves at each segment
  end. [TM:PE wiki](https://github.com/CitiesSkylinesMods/TMPE/wiki/Nodes,-Segments,-Lanes),
  [CS2 EdgeNodeGeometry](https://ps1ke.github.io/Cities-Skylines-2-Modding-Guide/Game/Net/EdgeNodeGeometry)
- **Arcs, not Béziers, for edges.** The offset of a Bézier is not a Bézier, but the offset of an arc is an arc. That
  makes arc-arc and arc-line intersections closed-form.
  [Art of roads in games](https://sandboxspirit.com/blog/art-of-roads-in-games)
- **Unity tools.**
  - EasyRoads3D: dynamic or custom-mesh crossing prefabs snapped to road markers. A custom prefab fails when the road
    cross-section does not match.
    [EasyRoads3D manual](https://nlp.fi.muni.cz/aiproject/ui/hutta_peter2019/pa026-project/Assets/EasyRoads3D/html/intersections.html)
  - RoadArchitect: intersection objects with their own meshes.
    [RoadArchitect docs](https://github.com/MicroGSD/RoadArchitect/wiki/Documentation)
  - A common Unity approach is to build the intersection as its own mesh and clip away the road vertices inside it.
    [Unity forum](https://discussions.unity.com/t/procedurally-generated-road-networks-and-intersections/532867)
- **Roundabouts in OSM.**
  - `junction=roundabout` is a closed way, or several ways, drawn in the direction of traffic. `oneway=yes` is implied.
    Each approach should join the ring at its own node.
  - `highway=mini_roundabout` is a single node.

  [OSM wiki](https://wiki.openstreetmap.org/wiki/Tag:junction=roundabout). Our Overpass cache keeps only
  `OverpassQuery.RoadTags` (`OverpassQuery.cs:45`), and `junction` is **not** in that list.

**Takeaway:** every mature system uses **node-owned junction geometry derived from graph topology**. The roads are
trimmed to cut lines, the corners are arcs of a class-dependent radius, and the major road is optionally left unbroken
(CityEngine's *Junction* vs *Crossing*). We should do the same and stop inferring junctions from `Covered` samples.

## 3. Design

### 3.1 Data: a junction table from RoadGraph
- **New** `RoadJunction` per node that has ≥ 3 arms, or 2 arms that are not one road. It is emitted with the tile's
  runs: `RoadGraph.Lines(key)` → `(lines, junctions)`.
  - `NodeKey`, `P` (double2).
  - `Kind`: `Priority` (one through pair kept unbroken), `Crossing` (all arms trimmed), `Ring` (on a roundabout) or
    `Fallback`.
  - `Arms[]`: run index, `Start` (whether the arm leaves the node toward increasing sample index), `S0` (S at the node,
    found by projecting the node onto the run's polyline), class, half width, paved, rank (`Outranks` order),
    `Through` (in the through pair), and the flags bridge / tunnel / portal within R_j.
- Source: `nodeWays` (node → (way, sample)) plus `nodeCount`. An interior node is projected onto the run's polyline,
  because it is not a sample (see §1).
- **Arms** are split at the node. A way passing through gives 2 arms and a way ending gives 1.
- Arm direction is the run's polyline direction measured at **3 m** from the node, not the first segment. This is
  robust to Chaikin rounding.
- Only data within **R_j = 40 m** of the node is used. A tile's runs reach `TilePad` = 60 m beyond its bounds, so the
  two tiles at a border see identical arms for any node they draw or trim (see §3.6).

### 3.2 Classification per node
1. Exactly 2 arms of one road: a mitre (existing `Mitres`). No junction.
2. **Through pair**: the same-width pair turning < 60° that ranks highest (the existing `Mitres` rule, `253-265`). If
   such a pair exists and every other arm has rank ≥ the pair's rank, the node is **Priority**. This is CityEngine's
   *Junction*: the main ribbon stays continuous, keeping its centre dash and its edge line opposite the mouth. This is
   the normal Norwegian T and the X of a main road.
3. Otherwise the node is a **Crossing**: no through pair, a Y of three roads, or equal-rank arms that all turn > 60°.
   All arms are trimmed and one polygon fills the node, with no centre line inside it.
4. **Ring**: the node lies on a roundabout ring (§3.7). It is a Priority node with the ring as the through pair, and
   its entries use a smaller radius.
5. **Fallback**, which keeps today's code path: > 6 arms; any arm with bridge, tunnel, gallery or portal within R_j;
   a height spread of more than `CoverStep` (0.3 m) across arm ends; or a node cluster (§3.8) not handled yet.

### 3.3 Geometry: cut lines and fillets (Crossing)

```
   arm B (side)                 1. sort arms by angle around node N
        |  |                    2. for each angular neighbour pair (Ai, Ai+1):
   kB'  |  |  kB                     Li = left carriageway edge of Ai,
 .......+  +........                 Ri+1 = right edge of Ai+1  (polylines, offset ±half from run)
  fillet ) ( fillet             3. fillet: centre Ci = intersection of
 ______.'  '.________                Li offset outward by r and Ri+1 offset outward by r
 A  ->   N    <- C  (arms)           (closed form per segment pair, first hit outwards from N)
 ______........______              tangent points Ti (on Li), T'i+1 (on Ri+1)
        cut lines               4. trim distance of arm Ai = max over its two corners of the
     (perp. to arm at ti)          along-distance of the tangent point (+0.5 m), capped at MaxTrim
                                5. cut line = arm cross-section at ti (6 rows, square to arm)
 polygon = for each arm in angular order:
     [cut row R-edge -> cut row L-edge] + arc(Ti -> T'i+1, n segments) ...
```

```mermaid
flowchart LR
  A[arms sorted by angle] --> B[neighbour pairs: edge polylines L_i, R_i+1]
  B --> C[fillet centre = offset(L_i, r) ∩ offset(R_i+1, r)]
  C --> D[tangent points → trim distance t_i per arm]
  D --> E[cut stations at t_i: shared rows with the ribbon]
  E --> F[kerb ring: cut edges + arcs; shoulder & skirt rings offset outward]
  F --> G[inner ring at 1 m inside kerb; ear-clip interior]
  G --> H[heights, UVs → appended to tile mesh sub-mesh]
```

**Radius** `r = MouthRadius(class of the lower-ranked arm of the corner)`: track 3, minor 5, tertiary/secondary 8,
primary/trunk 10 m. It is then clamped by three rules:
- **Carve band**: the fillet's furthest point lies `r(1 − sin(θ/2))` outside both carriageway edges, where θ is the
  corner angle. That point, plus the 1.5 m shoulder, must stay inside the carved flat band (`Shoulder + CarveApron` =
  3.5 m). So `r ≤ 2.0 / (1 − sin(θ/2))`: 6.8 m at 90°, 21 m at 135°, 3.2 m at 45°. Phase 3 lifts this clamp by
  carving the fillets.
- **Room**: the tangent points lie within `MaxTrim` (25 m) of the node and within half the distance to the next
  junction on that arm.
- **Very acute corners** (θ < 20°, a merge): see §3.5.

If the two offset polylines do not intersect within R_j, the corner is a **straight bevel** between the trimmed edges.

**Trim on Priority nodes**: only the minor arms are trimmed. Their corners are against the main road's carriageway
edge polyline, which comes from the main ribbon's *own* row 2/3 positions, including mitre scale, so the two meshes
share the exact boundary. On the main road, stations are inserted at the S of each tangent point. Between them, on
that side only, the main ribbon emits **no shoulder or skirt quads**. This is exact geometry, and it replaces the
shader taper `MouthKeep`. The UV2 interval is the same [S(T), S(T')], so the edge line break is exact too.

### 3.4 Mesh: rings, triangulation, heights, UVs
**Vertex rings**, from the kerb outwards:
- **kerb ring**: the cut rows 2..3 of each arm, then the arc points of each corner. Arc segments are about 15°, at
  least 2 per corner.
- **shoulder ring**: kerb + 1.5 m, outward normal. On arcs this is the concentric arc r − 1.5 (the fillet bulges
  outward from the road, so the shoulder lies toward the arc centre). On cuts it is rows 1/4 of the arm's cut station.
- **skirt ring**: + `SkirtOut`, down `SkirtDrop`, exactly like the ribbon rows.

**Interior**:
- An **inner ring** sits 1 m inside the kerb, so the edge line band 0.27–0.43 m lies in a strip where the interpolated
  distance is exact.
- The remaining interior is ear-clipped. That is O(n²), but n ≤ ~60, so a few µs.
- Crossings are star-shaped around N in > 95 % of cases. Use a fan from a centroid vertex when the polygon is
  star-shaped, and ear clipping otherwise.

**Shared seams**: each arm's cut station is *one* `Station` object with `RowP` / `RowY`, exactly like today's mouth end
station (`385-418`). The ribbon emits it as its last station and the junction uses the same positions. The surface is
watertight by construction, with no T-junction at the seam because both sides use the same 6 vertices plus the centre.

**Heights** (the car and the ribbon must stay one surface, `README-world.md` §"one surface"):
- Every vertex takes `y = Y_top(p) + RoadLift + SurfaceLift(d_axis, half_top) − (skirt ? SkirtDrop : 0)`.
- `Y_top(p)` is the graded height of the **top-ranked arm's run**, projected onto its centre line. This is the same
  rule as `MainY` (`454-466`).
- For a Crossing with equal-rank arms, `Y_top` is a **least-squares plane** through the arm cut heights, if the
  residual is ≤ 5 cm. Otherwise it is the top-ranked arm, and if that is more than `CoverStep` off any arm end, the
  node is Fallback.
- Side roads already conform to the main road within `FlatHalf + CarveApron + 6 m` (`EaseOntoJunctions`). Cut stations
  lie within that band whenever `t_i ≤ FlatHalf_main + 8.5 m`, so the heights agree.
- **Test**: the junction mesh against `TileWorld.HeightAt` within 3 cm on the carriageway.

**UVs for `Rally/Road`**:
- **UV0**: v = 0 (no dash anywhere in the junction). u is chosen so the shader's `across` and `side` come out right
  (see below).
- **UV1** = (`J_HALF` = 3.5, `-1`). UV1.y < 0 marks junction vertices. Junctions are never in tunnels, so this is free.
- **UV2.x** = the **distance to the kerb** in metres: positive inside, negative outside, and 0 on the kerb. On the cut
  rows it is the true distance to the nearest kerb, ignoring the cut edges, which equals the arm ribbon's
  `half − |across|`. **UV2.y** = −1 as a flag.

**Shader branch** (`Road.shader`, about 15 lines) when `uv1.y < 0`:
- `side = J_HALF − dKerb`, so the existing asphalt-edge, ravel, shoulder, verge and skirt code works unchanged on the
  fillets.
- No centre dash; `rut` and `lane` off, since tracks do not cross a junction.
- **Edge line** = `Band(dKerb − 0.35, 0.08)` only where the top-ranked arm is marked. It therefore **follows the
  fillets** and meets the arms' edge lines at the cut, both being 0.35 m inside the edge.
- Asphalt detail is world-XZ, so it is continuous.

**Stop / give-way lines** (later, optional): in Norway the minor arm gets a give-way line of triangles, or a solid
line where there is a stop sign. These go on the arm ribbon's last 0.5 m, using a UV2 "distance to cut" on minor arms.

### 3.5 Shallow merges and gores (< 32°)
- The same corner construction applies. The inner edges collide at about `(h1 + h2) / sin θ` from the node: 23 m for
  2 × 3 m half widths at 15°.
- On a **Priority** node, only the slip arm is trimmed. Its *inner* edge meets the main road's edge at the **nose**
  `X`.
  - The piece between the main road's edge and the slip arm, from `X` back to where the slip arm's outer edge leaves
    the main road's edge, is a **taper wedge**. It is a polygon bounded by the main edge polyline and the slip arm's
    outer edge, with no fillet on the acute side.
  - Beyond `X` the two ribbons separate and the gore is ground.
  - Edge lines: the main road's line is broken over the wedge (UV2 interval), and the wedge's kerb carries the line,
    which makes the gore "V".
- If the nose lies further than `MaxMergeTrim` (60 m), the node is Fallback (draw as today). This covers motorway
  ramps with near-parallel long tapers.

### 3.6 Tiles
- **Ownership**: the tile with `Owns(own, N)` (half-open, `RibbonMesh.cs:36`) emits the junction triangles.
- Every tile that holds an arm applies the *same* trims and inserted stations, because they are computed from runs
  within R_j only, and the grading is shared (`graded` is one dictionary). The ribbon's segment ownership by midpoint
  is unchanged.
- **Proof obligation, tested**: for a node 3 m from a border, the union of the two tiles' meshes has no gap and no
  overlap.
- A node within R_j of the **outer pad edge** of a tile is never drawn or trimmed by that tile: its trimmed pieces lie
  ≥ 20 m outside the tile's own bounds.

### 3.7 Roundabouts as circles
- **Detection**, needing no cache refetch: a cycle of ways in `wayEnds` whose total length is under 300 m and whose
  nodes fit a circle with RMS ≤ 1.5 m (Kåsa least-squares fit). The ways are usually `oneway=yes`, which we keep.
- Later, add `junction` to `OverpassQuery.RoadTags` and bump the version. That re-fetches every cached region, so it
  should go together with another cache bump.
- **Plan line**: in `SmoothPlan`, the ring ways' samples become **arc samples** on the fitted circle (5 m steps,
  angles from the projected end nodes). Each approach arm's node is moved to its projection on the circle, so the
  arm's first sample moves too.
- Ring and arm plans must be computed from the same deterministic fit, keyed by the ring's sorted node keys. A ring
  that is not closed in the data (part outside the query region) is left as it is today.
- Entries are Priority nodes on a curved main edge. The fillet construction already works on polylines, so curvature
  needs no special case. Radius by class, clamped as above.
- The central island inner edge is the ring ribbon's own edge, now a true circle.
- **Mini-roundabout** (`highway=mini_roundabout` node) is out of scope: we do not fetch node tags.

### 3.8 Node clusters (dual carriageways, dog-legs)
- If two junction nodes are closer than `ra + rb + 4 m`, their polygons would overlap.
- Phase 1–3: both become **Fallback** if their polygons intersect (polygon-polygon test). Report the count in the
  survey.
- Phase 5, optional: osm2streets-style consolidation. Merge the nodes joined by a short way (< 15 m) into one polygon,
  centred on the mean node position.

### 3.9 Performance budget
- About 214 junctions per town tile.
- Per junction: about 4 arms × (3 polyline offsets and intersections) + 4 arcs of about 6 points + about 80 vertices
  and 150 triangles, in managed C# with `double2`. That is an estimated 15–40 µs, or **3–9 ms per town tile**.
- Inserted stations on main roads: about 2 per mouth, negligible.
- Mesh size grows about 10 %.
- **Budget**: `.ov.ribbon` ≤ +10 ms per town tile (today 60–85 ms), and the old `Mouths` flare code becomes unused on
  non-Fallback nodes.
- The junction triangles go into the **same mesh and sub-meshes**, so there are no new draw calls. Frame time must not
  regress: Lillehammer and Toten bench within +5 %.
- If `.ov.ribbon` goes over budget, split `Build` over two frames with `WorkBudget`: strips first, then junctions. It is
  already a 60–85 ms single-frame spike while loading, which is a separate open point.

### 3.10 Fallbacks (keep today's behaviour, count them in the survey)

| case | action |
|---|---|
| > 6 arms | Fallback |
| arm on bridge, tunnel, gallery or portal within R_j | Fallback (decks and portals have their own ends) |
| arm-end height spread > 0.3 m, or plane residual > 5 cm with no top arm | Fallback |
| offset polylines give a self-intersecting kerb ring (simple-polygon test) | bevel corners; if still bad, Fallback |
| trim > MaxTrim (25 m), or merge nose > 60 m | Fallback |
| overlapping neighbour polygons (cluster) | Fallback (Phase 5: merge) |
| arm shorter than its trim (way ends within the junction, e.g. a 6 m connector) | the arm is absorbed: no ribbon, its far node becomes part of the polygon if it is a way end; otherwise Fallback |
| paved and gravel arms | junction sub-mesh = the top-ranked arm's material |

## 4. Tests and survey

### EditMode, new file `JunctionMeshTests.cs`
Synthetic `RoadWay`s as in `RoadJoinTests` (`Way(...)`, flat ground 100 m).
- **T, 90°**: secondary main plus residential side.
  - One surface everywhere inside the main and side carriageways and the fillets: `At()` returns exactly 1 surface.
  - The fillet's midpoint is on the surface.
  - The main road's centre dash is continuous through the node.
  - The main road's edge line is broken only between the tangent points.
  - The side road's ribbon ends at the cut.
- **T with the main road split at the node** (3 ways): the same assertions as the T. This fails today, 96 % of these
  in the survey.
- **X, 4 arms**, Priority (main road through) and equal-rank Crossing: one surface; no centre line inside the polygon
  of a Crossing.
- **Y, 3 equal roads at 120°**: Crossing, three fillets, one surface.
- **Merge at 15°**: the wedge is one surface up to the nose; there is ground between the arms past the nose; no
  z-fight.
- **Roundabout**: a 6-way ring of radius 15 m plus 4 approaches.
  - Ring samples lie within 5 cm of a circle.
  - Each entry has a fillet.
  - One surface everywhere.
  - Dashes on the ring are continuous.
- **Tile border**: the T node 3 m from the border, built by both tiles. The union of the meshes is one surface, and
  exactly one tile emits the junction triangles.
- **Heights**: on a main road climbing 6 %, the junction vertices are within 3 cm of `TileWorld.HeightAt` (or of
  `RoadGraph`'s road height when there is no world).
- **Fallbacks**: an arm on a bridge, and 7 arms. Both build exactly as today (snapshot of the vertex count).
- **Regression**: all of `RoadJoinTests`, `TileSeamTests`, `RibbonGroundTests` and `RoadContinuityTests` stay green.

### Survey (`Editor/PreviewJoins.cs`)
Add a `junction` row kind with these columns:
- `arms`, `kind` (Priority / Crossing / Ring / Fallback + reason);
- `overlap_area` (m² with two surfaces within 0.15 m of each other, on a 0.5 m grid inside R_j);
- `gap_area` (no surface inside the polygon or the carriageways);
- `kerb_line_cont` (does the edge line continue across arm→fillet);
- `fallback_reason`.

Report the fallback rate and the clean rate for Lillehammer, Drammen, Sauda and Vinje.

**Targets**:
- mouths with z-fight > 0.3 m: 5818 → < 500 / 8128 (Lillehammer);
- 3+ arm nodes: 96 % → < 10 %;
- fallback rate < 10 %.

Shots of the same spots as `before_after_*.jpg`, plus a roundabout and a slip-road merge.

### Bench
`PreviewShots` live bench, Lillehammer and Toten (chase, and drive 60 s, average and p95), within +5 %; `.ov.ribbon`
per tile from `-previewLoading`.

## 5. Phases and effort (agent-days, including tests, survey, docs)

- [x] **P1, junction table and topological detection (1.5 d).** Done 2026-11-23 (see Review): z-fight mouths −31 %, not "most".
  Deviations: a band station on the main road's shoulder line and an exact shoulder gap replace `MouthKeep` at Priority
  nodes (the plan's "tangent stations" are the side road's corner rows); no `Crossing`/`Ring` kinds yet (Fallback).
  - `RoadJunction` from `RoadGraph`; `RibbonMesh.Build(lines, junctions, …)`.
  - Priority nodes use **today's** mouth geometry, but driven by topology instead of `Covered`. This fixes the side
    roads that are not Covered and the split main roads.
  - Exact main shoulder and skirt omission between inserted tangent stations. `MouthKeep` remains for Fallback only.
  - Survey `junction` rows. Expected: most of the z-fight count gone.
- [ ] **P2, true fillets and the junction mesh (2.5 d).** Polyline-offset fillet construction, rings, ear clip, shared
  cut stations, UV scheme and shader branch (edge line follows the kerb), Crossing kind, the plane fit, and the
  carve-band radius clamp.
- [ ] **P3, carve the fillets (1 d).** Extra `CarveSegment`s along each kerb arc (`RoadCarveData.cs:23-36`, `HalfWidth`
  = shoulder + apron, height from the junction), which lifts the radius clamp. Check the clipmap mask and `HeightAt`
  in the fillet area.
- [ ] **P4, shallow merges and gores (1 d).** The taper wedge, `MaxMergeTrim`, and gore edge lines.
- [ ] **P5, roundabouts (1.5 d).** Ring detection, circle fit in `SmoothPlan`, arm node projection, determinism across
  tiles; optionally the `junction` tag in `RoadTags` with a cache version bump.
- [ ] **P6, clusters (1.5 d, optional).** Consolidation of nodes joined by a short way. Give-way and stop lines.
- [ ] Docs: `unity/README-world.md` (a junction section replaces "Mouths"), ARCHITECTURE (ribbon/junction diagram),
  CHANGES, Help text only if visible behaviour warrants it, and lessons.

Total about 7.5 d for P1–P5, plus 1.5 d optional. P1 alone should remove most of the measured z-fighting, and it can
ship on its own.

## 6. Risks
- **Car ground vs drawn surface in the fillets.** `HeightAt` there is the carve flat band, not a road. If the fillet is
  drawn at carriageway height (crown lift) the wheels sink a few cm. Mitigation: `SurfaceLift` by distance to the kerb
  outside the carriageways, and a `HeightAt` test. P3 makes the carve match.
- **Terrain through wide fillets** (acute corners, big radii) until P3: the radius clamp in §3.3.
- **Grading order**: side road heights at the cut come from `EaseOntoJunctions`. If a side road was graded before its
  main road arrived (another tile), its cut height can be off until `FollowAtNodes` regrades it, which gives a
  transient Fallback (> 0.3 m). This is acceptable, but it needs the survey run after loading settles.
- **Concurrent edits**: another agent is changing `RibbonMesh` and `RoadGraph` right now. Rebase P1 on their result,
  and keep the junction code in a new `Runtime/Roads/JunctionMesh.cs` so `RibbonMesh` only gains the hooks (inserted
  stations, undrawn ranges, shared cut stations, the shoulder skip).
- **Determinism across tiles**: every input must come from runs within R_j and from sorted, stable arm order (by angle,
  then way id). Floating-point use must stay identical, with no dictionary iteration order involved.
- **OSM data quirks**: nodes shared by roads at different layers without a bridge tag, crossing ways without a shared
  node (no junction, which is correct), and duplicate ways. The fallbacks catch the first; the survey shows the rest.
- **Roundabout circle fit** moves the arm nodes by up to about 1.5 m, so the signs and lights that are placed by nodes
  need to use the moved positions, or accept the offset.
- **Performance**: `.ov.ribbon` is already a single-frame spike. Measure, and split it with `WorkBudget` if needed.

## Review

### P1 (2026-11-23)
**Built.** `RoadPolyline.Nodes` (key, S of every shared OSM node on the run, `RoadGraph.SharedNodes`); `RoadJunctions.Find`
(arms per node from data within 30 m, sorted keys, nodes within 25 m of the tile; kinds Priority / Fallback + reason);
`RibbonMesh`: through pairs mitred from the table, side run ends left out of the position-matched mitres and of
`EndsOnOtherRoads`; `PlanJunctions` / `PlanCut`: walk each side arm to the main road's carriageway edge and shoulder line
(on the through arms' runs, extended through a joint), end and band stations slid onto them (`SlideStation`), flare from
past the band station's furthest row (`Cut.Shift`) with the acute side capped (`FlareCap`), radius halved/dropped when it
does not fit or when neighbouring mouths on one side overlap; main road: corner stations (`Inserts`) sharing the side
road's corner points, shoulder and skirt not drawn between them (`Gaps`), UV2 = the same stretch; grading's covered marks
near the node cleared. Fallback nodes build exactly as before (test compares the meshes). Survey: junction rows, mouths by
ways at the node and by where the overlap starts, arms/hit dumps, runs dump for repro; hook `RibbonMesh.JunctionsBuilt`.

**How it went.** The first version (topology only, today's flare) moved z-fight 5758 → 5387 and left the T-junctions
unchanged. Hit dumps with the junction's arms showed (1) the side road folding over itself past its slanted end station
(square flare stations crossed it) — fixed by `Shift`; (2) driveways a few metres apart whose flares overlap — smaller
radii; (3) "a row off the main road's edge" fallbacks where the main way ends at the next node — radius retries and pieces
through joints; (4) z-fights that are not the mouth at all: dual-carriageway trunk ways (two 10.5 m ribbons 4.5 m apart),
other junctions within the 20 m probe, main roads folding on themselves in tight bends. A fix for a gap at joints inside a
cut (a short side way's end sample dropped) made such nodes Fallback.

**Survey, 4b83ffd → P1** (same spots; before run twice, identical):

| area | z-fight mouths | z-fight starting ≤ 12 m | edge line across | joints not joined | joint gap | dashes broken | edge line offset | junctions clean (of) |
|---|---|---|---|---|---|---|---|---|
| Lillehammer | 5758 → 3875 | 5540 → 3584 | 286 → 123 | 202 → 200 | 65 → 71 | 0 → 0 | 1 → 1 | 123 → 1259 (7613) |
| Drammen | 6913 → 4856 | 6639 → 4486 | 481 → 142 | 526 → 503 | 144 → 140 | 5 → 5 | 10 → 9 | 144 → 1818 (9029) |
| Sauda | 800 → 551 | 763 → 509 | 36 → 19 | 33 → 33 | 21 → 21 | 0 → 0 | 1 → 0 | 14 → 244 (1188) |
| Vinje | 356 → 248 | 349 → 236 | 23 → 12 | 9 → 9 | 6 → 6 | 0 → 0 | 0 → 0 | 3 → 77 (450) |

Mean overlap area within 12 m of a junction 19.0 → 11.4 m² (Lillehammer), 22.1 → 12.1 (Drammen). Junction kinds:
Lillehammer 6387 Priority of 7613 (84 %; plan target for the fallback rate < 10 % not met: 16 %), Drammen 7879 of 9029;
Lillehammer Fallback: merge < 32° 521, a row past the main road's piece 213, a side arm ending (joined to its next way)
inside its cut 195, a row slid too far 71, no through pair 59, side arm short of the shoulder line 58 / edge 33,
outranked 40, height step 29, bridge/tunnel 6. Tiles disagree on 2 of 7635 nodes. Joint gaps:
Lillehammer 18 new / 12 fixed, Drammen 41 / 45 — all at the carriageway-edge probe (± half width) within ~10 m of a
Priority node; not explained (believed chord vs curve near cuts, where curve stations are skipped; not proven).

**Bench** (1920×1080 live, median / p95 ms; HEAD 4b83ffd vs P1, run A/B and again B/A/B): Lillehammer chase 6.87 / 8.02 →
6.85–7.03 / 7.8–8.4, drive 60 s 8.22 / 9.73 → 8.17–8.53 / 10.9–60.7 (HEAD rerun 8.14 / 12.46); Toten chase 6.64 / 7.33 → 6.69–6.77,
drive 7.87 / 10.24 → 7.67–8.19 / 11.0–48.5 (HEAD rerun 7.85 / 11.01). Medians within +4 % (third P1 run the highest). The averages are not usable in this
session: from the second run on, HEAD and P1 alike got 0.1–2.6 s `.gpu.veg.cull` waits (GPU contention from outside Unity; the
first HEAD run had none), e.g. HEAD's own rerun drive average 8.68 → 11.28 ms. The persistent `vocab_probe.py` job held one core
throughout.
**Ribbon build** (`.ov.ribbon` per frame = one tile, `-previewLoading -previewFreshCache`, editor Mono): town tiles (top 8 of
38/41) Lillehammer 80–89 → 110–115 ms, Drammen 79–86 → 98–116 ms; totals 1166–1229 → 1417–1555 ms and 1400–1447 → 1794–1985 ms
(+25–40 %). Over the plan's +10 ms budget, also after precomputing the main road's lines per side arm. **Car's roads**
(empty cache): Lillehammer 13.4 / 12.2 s (HEAD) vs 17.6 / 12.1 s, Drammen 15.5 / 20.9 s vs 20.7 / 22.1 s — network-dominated
(Lillehammer's 17.6 s run landed its data 3.2 s later); not clearly worse, not proven equal.

**Shots** (`scratchpad/crossings-p1/before_after_*.jpg`, `above_*.jpg`; same spots before/after): clearly better — the
split-main T in Lillehammer's centre and Drammen, the X in Drammen (main road continuous with its centre dash, arms end on
its edge), the roundabout entry on a primary (Lillehammer: the grass wedge cut into the ring is gone). New or remaining
artefacts: a bare acute wedge with a jagged shoulder edge where a side road meets a curved main road obliquely (the capped
acute flare; no fillet until P2), a sawtooth along the mouth on an S-bend, a small grass sliver in Drammen's five-way
cluster, clusters and dual carriageways as before.

**WebDev** rebuilt with the final code (`Build/WebDev`, exit 0). Chrome (port 8091, `?drive=61.1153,10.4663`, hidden tab):
loading view shows the town from above, start area 100 %, ribbons applied, no console errors; START ENGINE did not register in
the hidden tab, so the start road was not seen there (the junction views are the editor shots).
**Tests.** `RoadJunctionTests` 13 (fail on the old ribbon except the fallback-equality and node-mark ones; the joint-gap
one fails before its fix). EditMode 359 → 372, PlayMode 30, all green.

**Open points.** Most remaining z-fights: Fallback nodes (95 % of their mouths; merges and oblique entries on curves),
dual carriageways and clusters (P6), self-folding main roads in tight bends; the side road's end is a chord across a curved
main edge (cm); acute corners need the P2 fillet; the 6 extra joint gaps in Lillehammer; ribbon build +25–40 % per town tile
(split `Build` over frames with `WorkBudget`, §3.9, or profile `PlanJunctions`); benches to repeat on a quiet GPU.
