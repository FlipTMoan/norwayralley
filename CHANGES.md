# Changes

_Updated 2026-11-20 (car chooser in the Unity game)._

## 2026-11-20

### Unity: the car no longer stops at 50 km/h; every car reaches its own top speed
- **Cause (confirmed by test):** the car counted as "off the road" whenever it was more than the stage line's half width
  + 1 m from the line. Stage lines are one lane wide (`OneLaneHalf` 2.25 m) and the endless line follows one road, so on
  the right lane of a two-lane road, a wide road, a junction or a parallel road the car was "on rough ground": surface
  OFF ROAD and car.js's 50 km/h off-road cap. Now the car is on the road when it is on any road the world draws
  (`IGround.SurfaceAt`, the same road network as the ribbons) and takes that road's surface.
- **Real top speeds:** car.js used one air drag for every car, which held the 911 to ~175 km/h whatever its gearing. Each
  car now has `CarSpec.TopSpeed` (the real car's) and `Aero` set so full power balances drag there: 911 225, Carrera 245,
  930 260, Volvo 195, MV6 210, Ranger 175, Baja Bug 160, Type 736 125 km/h (tested within 10 %).
- **Off road per car** (`CarSpec.OffroadMax`): the 911s 45–50 km/h as before, the MV6 75, the 736 70, the Ranger 90 and
  the Baja Bug 100 km/h.
- **Gearbox:** a Q/E (RB/LB) press still switches to manual, but only for this visit; only G / the GEARBOX button is saved.
  The HUD gear reads `3 M` in manual, and 1.5 s on the limiter in manual shows "E (RB) shifts up, G automatic". (A box
  saved as manual made the 911 run out at ~60 km/h in 1st.)
- Tests: `TopSpeedTests` (every car's top speed and 0–100, a car on a drawn two-lane road beside the stage line is on the
  road and passes 120 km/h, buggies / Ranger / MV6 faster off road than the 911).

### Unity: choose among eight cars
- **Car cards on the start screen:** Porsche 911 (the original), 911 Carrera 3.2, 911 Turbo (930), Volvo 240 Turbo,
  MV6 '83 Group B, Ford Ranger Offroad and two buggies, the Baja Bug ("Off Road 4X4 racer" by duanesmind) and the Buggy
  Type 736 (Andre_rmntc, a Skoda 736 beach buggy), each with a rendered picture and power · weight · drive · gears. Click or
  tap a card, or ←/→ (gamepad d-pad); only on the start screen. Kept in localStorage `rally.car` and sent to the room
  (state packets carry the kind), so friends see the right car; a JS player's `buggy` shows as the Baja Bug.
- **Own handling per car** (`CarSpec`): mass, power (real × 1.58 like the 911), gearbox, driven wheels (`DriveType`,
  4WD = all weight on driven wheels), grip per surface, suspension travel and springs, climb limit, and a turbo for the
  930 (1.2 s) and the Volvo (0.8 s): off boost 55 % of torque and power (`CarState.Boost`). The 911's engine, gears and
  body box are as before (the box is now stored in `CarSpec.Body`/`BodyZ`); only its air drag changed (above).
- **Prefabs built from the CC BY models** by `Editor/CarGarageBuilder`: real lengths, wheels on their axles (the
  Carrera's one-mesh wheels split into four), paint panels baked into one car-space mesh so dents land where the car was
  hit, the Volvo file's second trim and camera dropped, exhaust on each car's tailpipe (`CarExhaustSetup.Apply`).
- **Buggies:** Baja Bug 850 kg, rear drive, 0.77 m tyres, long travel, gravel grip; Type 736 700 kg, modest engine.
  Every new car's textures are imported at 1024² at most and crunch-compressed (the 2K/4K sources had nearly tripled
  the web data file); LICENSE.txt added to both buggy folders.
- Help screen: CARS section and car model credits; README credits and a car table.
- Tests: `GarageTests` (spec sanity, the 911 unchanged, wire ids, every car drives 100 m and a hurt engine pulls less,
  turbo spool and lag, offroaders outclimb road cars, every prefab's wheels / body box / baked body / exhaust) and PlayMode
  `GarageSceneTests` (every car chosen, respawned, remembered, drives off the line and takes damage; no change mid-stage;
  the choice survives a reload).

## 2026-11-19

### Unity: real road signs from Statens vegvesen (NVDB)
- **Every sign plate NVDB knows** (type 96 Skiltplate, with type 105 Fartsgrense) is fetched per 2 km coarse tile next to
  the road surfaces, through the GeoCache (kind `nvdb`, IndexedDB in the browser): a second visit draws the signs from the
  cache without asking NVDB (`cache: hit nvdb …` in the F2 log). Overlay log: `NVDB signs: N plates, M speed limits` and
  `signs: N plates on M posts (…speed-limit changes without a plate, …without a design, …away from the roads)`.
- **Drawn like the real ones:** a vector painter (`SignCanvas`: every shape a signed distance, exactly anti-aliased at any
  resolution) paints Norwegian designs (`SignCatalog`): speed limits and their ends and zones, white warning triangles with
  a red border and black pictograms (bends, gradient, narrowing, bumps, road works, slippery road, tunnel, junctions,
  roundabout, lights, pedestrian crossing, children, elk / deer, two-way traffic, "!"), yield, STOPP, priority road and its
  end, no entry, vehicle bans, height / weight limits, no overtaking, no stopping / parking, keep right, roundabout, bus
  stop, crossing, foot / cycle paths, one-way, chevrons and obstacle markers, yellow direction signs with county-road
  shields (from NVDB's `@723.15@$520$Sauda 3` text), road numbers, place and street names, distance and text plates.
  Lettering is DejaVu Sans Condensed Bold rasterised at run time into an SDF atlas (any name, ÆØÅ included). Faces
  are painted once (0.32 px/mm: a 900 mm triangle is 288 px) into shared 2048² mip-mapped, 8× anisotropic atlas pages and
  reused by every plate with the same design. Codes without a design (large junction boards, service signs) are skipped,
  not drawn wrongly.
- **Placed and facing like the real ones:** plates on one NVDB point share a galvanised post (two posts under wide
  direction signs), stacked by priority with 8xx plates under their sign, lowest edge at 1.5 m; each plate cut to its real
  outline with an aluminium back, rim and clamp brackets, standing on the shoulder beyond the road's flat band at the real
  position along the road. The face direction comes from NVDB's side and "Ansiktsside" relative to the metering direction,
  recovered against the OSM road; without them the right-hand rule. Two-sided plates show their face on both sides.
  Where two NVDB speed limits meet without a plate within 40 m, a 362 plate is put up for each direction (signs.js
  `speedChanges`). Faces are retroreflective (bright with the sun behind the driver), metal has a soft highlight, all with
  faint grime (`Rally/Sign`).
- **Cheap:** one mesh per tile, only for tiles within 1 km of the car (dropped beyond 1.5 km), faces painted within a
  4 ms frame budget; posts within 35 m of the car get capsule colliders (layer Props): the car hits them like a trunk.
- Tests: `SignTests` (parsing of codes, sizes, facings and sides; direction text; catalog shapes; painted face pixels and
  Norwegian letters; atlas reuse; face direction rules; shoulder placement, shared posts and plate order; speed changes;
  mesh orientation; near tiles built, far ones dropped, colliders only near the car; NVDB pages from the GeoCache; the
  offline fake signs) and PlayMode `SignSceneTests` (the offline scene builds its sign meshes with `Rally/Sign`). `Editor/SignFacesSheet` writes a contact sheet
  of all faces; `PreviewShots` adds sign close-ups (`14_sign_*`).

### Unity: hidden water brake on shore roads and streams, trees from any direction, roads meet the ground, real road surfaces, help screen, exhaust
- **"The car suddenly brakes" — root cause:** the car measured water against the carved road like any ground. Every road
  graded near sea level (quays, shore roads, roads over DTM sea cells: no bridges yet) sat under the 0.45 m sea plane, and
  every OSM waterway crossing a road (culverts included) added its 0.2–0.7 m there. Water drag grows with depth × speed²
  (up to 16 m/s²), grip drops, and nothing shows it (the spray slot is empty). On the live test area (59.6501, 6.34968)
  185 of 4143 road points put the car in water (183 sea, 2 streams); now 0. `TileWorld.WaterAt`: on a carriageway or its
  shoulder the car is dry. Every contact, damage step, water entry and unexplained slow-down (> 15 km/h in 0.2 s without
  brake) is now a `collision:` line in the F2 log (`CarDiagnostics`). Physics transforms are synced before the car's
  collision queries (moved tree colliders and a FloatingOrigin rebase used to be tested at stale positions for a frame).
- **Trees from any direction:** the car's collision was a discrete overlap per frame; on a slow frame a car sliding sideways
  (1.7 m wide) at 100 km/h moved past a trunk's centre in one step and was pushed out on the far side. The body box is now
  swept along the frame's motion (`CarController.SweepWalls`) and stopped at the first trunk or wall, then the normal wall
  rule and damage apply. Trees under 0.15 m trunk radius used to "snap" (no stop) while still drawn — every small birch;
  now only shrubs (< 3 m tall) do. In closed forest more than the pool's 96 trees stand within 40 m; the pool now takes the
  nearest (it took the first in bucket order, leaving the trees north-east of the car without colliders).
- **Roads meet the ground:** the terrain sat 16 cm under the ribbon edge (a vertical skirt and a shadow line: a floating
  road) and coarse clipmap rings (4–16 m triangles) sagged off embankments by up to metres from 64 m on. The carve's flat
  band now meets the shoulder edge 4 cm under it (`RoadConstants.CarveLift`), skirts slope out into the ground, coarse
  rings (4 m and coarser) pull a vertex next to the band up to the road (`TerrainClipmap`, CPU twin `Clipmap.DrawnHeight`), and embankments
  and cuttings run out at 2 : 1 / 1.25 : 1 to the natural ground (max 10 m) instead of a 1.5–2.25 m wall. Edge samples with
  a gap of more than 10 cm under the ribbon edge, live, within 600 m: 70.5 % → 30.3 % (2 m ring 99 % → 2 %, 4 m 79 → 12 %,
  8 m 76 → 14 %, 16 m 68 → 37 %; what remains far away is the 0.3 m coarse-only sink and the ring size over the grade).
- **Road surface:** generated aggregate / crushed-gravel texture arrays with normal maps (`Editor/RoadTextures.cs`),
  sampled in world space at two scales (8× anisotropic, normal detail fading over 25–115 m); asphalt gets darker rubbered wheel tracks, an oil line, patches with sealed seams,
  colour drift, a ravelled edge onto a gravel shoulder and worn markings; gravel gets packed ruts with potholes, a lighter
  stony crown and edges, grey/ochre drift and damp patches; the shoulder edge breaks up into the verge.
- **Help screen:** H / F1 or the ? buttons (start screen and HUD): goal, keyboard / gamepad / touch controls, game keys,
  HUD, stage types, data credits; pauses the game unless a friends room is open; Esc / H / CLOSE close it.
- **Exhaust:** both tailpipes of the 911 smoke (`CarExhaust`, `Rally/Smoke`, `Editor/CarExhaustSetup`): faint idle haze,
  rate and size with throttle × rpm, whiter and denser for the first 30 s, a dark puff when floored from low rpm and on
  upshifts, now and then a pop with a tiny flash on a high-rpm lift-off; 60 particles per pipe, none beyond 90 m.
- Tests: `RoadEdgeFitTests` (edge within 4 cm on fills and cuts next to the car, coarse rings bounded; earthwork widths; a
  stream under the road is dry), `TreeCollisionTests` (sideways 60 / 100 km/h, reversing, spinning into a thin birch, on
  0.05 s frames; the 100 km/h and birch cases fail on the old code), `ExhaustTests`, `ControlsTests.HOpensAndClosesTheHelpScreen`.
  EditMode 150 / 150, PlayMode 9 / 9.
- Frame time (`PreviewShots -previewBench`, live, WebGL 2 path, GTX 1060 editor, 1080p; before = HEAD 1b411a1, same
  place): chase 5.89 → 6.00 ms, hillside 6.15 → 6.02, overview 5.71 → 5.79, forest edge 6.01 → 6.13, 60 s drive 7.32 →
  7.24 ms (p95 8.87 → 8.86): no measurable change. The browser `?bench` could not be timed (the automation tab is hidden
  and Chrome throttles it).

### JS game: roads are splines, junctions are one surface, straight across the road
- Plan: every OSM way and the OSRM stage road is a centripetal Catmull-Rom spline through its nodes
  (`geo.js splinePolyline`), sampled ≤ 5 m and ≤ 3° of heading apart (finer in bends), junction nodes exact; where a
  way continues in another way the spline runs through the joint with one tangent. Replaces Chaikin corner cutting
  (OSM) and the 1-pass Chaikin + 5 m resample of OSRM stages; generated A* stages are unchanged.
- Grade: the ±60 m running mean is measured by distance (exact integral of the profile), so uneven samples grade
  like even ones; a straight grade stays straight (it used to stair-step by float error at the window edges).
- Junctions: ways settle in rank order (stage road, motorway … track, then OSM id; `roads.js settleJunctions`). A way
  inside the flat band of a road that outranks it *and shares an OSM node with it* takes that road's surface plane —
  height and crossfall (new per-sample `bank`) — and leaves on its slope, easing back to its own grade over 20–100 m
  (C1, ≈ 3 % extra at most, 2 m samples in the ramp). Ways in the same chunk now settle on each other (they used to
  leave 0.15–5.9 m steps; live Jørpeland junctions: 34.71 / 36.89 / 31.02 m → all within 1 cm). Roads without a
  shared node (under- and overpasses, tunnels) keep their own heights. The registry of shared heights now holds the
  profile before junctions; a neighbour chunk whose copy of a way disagrees by > 2 cm after a junction partner loads is
  re-settled next frame (ribbons and carve at once, chunk mesh through the dirty-chunk queue, 1 m tiles only around
  the change).
- Across the road: the ribbon is the graded line itself (`roadY + bank · offset`), not draped on the terrain; the carve,
  the corridor terrace and `car.groundAt` use the same line, and terrain cells up to 1.4 grid steps beyond the band
  are held at or under the road plane, so the coarse grid never pokes through a narrow road.
- Bridges: the deck is a cubic between the abutments that leaves at the approach grade, the arch starts level, the
  clearance lift ramps at ≈ 3 %; a car on a deck is no longer dropped onto a road that passes under it (the nearest
  centre line there), and the deck no longer extends as a flat disc beyond its last sample.
- Performance (dense Jørpeland chunk, Node): prepare + carve + meshes 191 ms (was 226 ms); `RoadNetwork` uses 24 m
  buckets with numeric keys, the coarse carve thins samples to the grid, the spline evaluates without allocations, a
  level-0 chunk no longer builds its corridor mesh twice per road refresh. In the browser the 24 initial chunk road
  refreshes took 7.2 s in total, slowest 0.87 s (baseline build 8.6 s, slowest 1.73 s); re-settles add 0.4–0.9 s
  each, at most two per chunk per Overpass answer. `streamStats()` gains `roadSettles` and `roadMsMax`.
- Tests: spline continuity and joints, grading by distance, side road on the main surface within 2 cm, junctions across
  a chunk border, bridge ends, no meeting without a shared node, straight cross-section and no terrain poke-through on
  a 10 m grid, a car through a junction (no air, < 0.25 g over 0.1 s), a car on a deck over a road.


### Unity: roads are one surface with the car, gravel and asphalt from NVDB, smoother lines and junctions
- Root cause of the car cutting through the road: the ribbon mesh sampled the carved height grid when a tile's roads
  arrived, which is the 8 m coarse grid until the 1 m tiles load; the 1 m terrain then cut through the ribbon in
  staircase steps and the wheels (graded road profile) sat up to metres off the drawn surface. `RibbonMesh` now takes its
  heights from the run's own graded profile (exactly what `TileWorld.HeightAt` answers on the road), straight across the
  carriageway. Measured near the car at 59.6501, 6.34968: |ribbon − wheel ground| mean 0.20 m → 0.002 m, samples off by
  more than 5 cm 52 % → 1 %, carved terrain above the ribbon 10 % → 0.02 %.
- The carve keeps the terrain under the ribbon: a 2 m flat apron beyond the shoulder (`RoadConstants.CarveApron`, the
  clipmap's finest triangle) and, on coarse tiles, a flat band widened by 1.5 cells and sunk by `CarveMargin`.
  The terrain colours the verge from the 1 m tile's carve mask where there is one (smooth edges).
- Plan line: Chaikin over the whole way (4 rounds) with junction nodes pulled back onto their OSM position
  (`ProfileGrader.SmoothThrough`), resampled evenly every 5 m (`ResampleEven`): no corner kinks, also at junction nodes.
- Junctions: ways are graded major road first; a joining road takes the major road's height on and near its flat band
  and fades back to its own grade over 25 m; inside the major carriageway only the major ribbon is drawn; the "nearest
  road" is ranked by distance past each road's flat band. Fixed: junction easing never ran for ways of the tile being
  loaded (it checked a segment count that is only summed afterwards).
- Surface from map data: NVDB Vegdekke (type 241, Massetype 1216) per 5 m sample within 12 m, OSM tag / class as the
  fallback (port of roads.js); runs split where the material changes so ribbon sub-mesh, physics grip and road links
  agree. One `overlay:` log line per tile with the split and the sources.
- New `Rally/Road` shader: asphalt with Norwegian markings on two-lane roads (dashed yellow centre, white edges) and
  worn wheel tracks; gravel lighter, loose, two packed tracks with a stony ridge, no markings.
- Tests: `RibbonGroundTests` (ribbon = wheel ground, flat across, terrain under it, no kinks, no step at a crossing; on
  1 m and on coarse-only ground), NVDB surface ports (`RoadSurfaceTests`, RoadGraph split test).

### Unity: frame rate, trees, light and camera feel
- WebGL 2 tree path: the per-tree loop (LOD, frustum, matrix) moved into a Burst job (`TreeCullJob`); forest scatters
  after a recarve are queued, one tile per frame (`TileWorld.ScatterNext`) — a tile was re-scattered 6–9 times while
  its neighbours' roads arrived, several in one frame. URP: opaque texture off (nothing sampled it), SSAO at half
  resolution from the depth prepass.
- Trees: crowns keep part of the sun in their own shadow and a backlit crown glows (spruce and pine were black against
  the sun); distant pine bark and impostors no longer read orange. Ambient is a sky / horizon / ground trilight scaled
  by daylight instead of a flat dark grey (shadows were near black). Forest floor darker and browner than meadow.
- Chase camera: speed field of view (+9° at 160 km/h), looks a little ahead along the velocity (into slides), subtle
  shake by surface (asphalt < gravel < off road) and speed.
- Debug window (F10/F3) shows frame time average and p95; `?bench` in the URL drives the stage for 60 s with the
  ScriptedDriver and logs frame times every 10 s (`bench:` lines); `PreviewShots -previewBench / -previewRoadDebug`.
- Web builds in progress go to `unity/Build/WebDev` (with symbols); `Build/Web` only gets a build checked in Chrome.

### JS game: bridges where roads cross water
- Before, every road was carved into the DTM: over a river the road sagged into the valley and the river ribbon was
  lifted onto the carved road. Now `src/bridges.js` finds bridge spans: OSM `bridge=*` ways (`bridge=no|culvert` and
  tunnels excluded; the parser now keeps the flag), plus untagged crossings of an OSM lake/river or the sea at least 6 m
  long with water on both sides and the DTM at water level (so causeways and shoreline roads stay roads). The OSRM stage
  road has no tags: when a chunk's Overpass answer arrives its samples are matched to that chunk's bridge ways (within
  4 m, parallel) and water, and the road is re-graded and the chunks around re-carved.
- Profile: the grade runs bank to bank over a span (short bridge ways are graded with 60 m of ground beyond their ends),
  the deck gets a 2 % arch (≤ 1 m) and is lifted to 2.5 m over water / 0.8 m over dry ground with 15–90 m ramps.
  The terrain is not carved or filled under a span (the carve stops square at the abutments, no terrace).
- Geometry: one merged mesh per chunk — deck slab (0.9 m), steel guard rails on posts, piers every ~30 m on spans over
  24 m, abutment walls. Rails and piers are solid boxes for the car within a height band, so a car in the river is not
  stopped by the rail above it.
- Car: rides on the deck (stage road, free-drive network and side roads), no water contact on the deck, no road grip or
  ribbon lift under it, a reset on a bridge stands on the deck, and the "last dry spot" is never recorded on a deck.
  Off the side it falls into the water as before. Marker posts are left off bridges (the rail marks the edge).
- Culverted / piped waterways (`tunnel=*`) are no longer drawn as water over the road.
- Tests: `tests/bridges.test.mjs` (tags and parsing, detection incl. culvert / shoreline / causeway, water probe, deck
  clearance and grades, no carve under the span, network bridge ways, car across the deck without water contact, guard
  rail stops the car, beside the deck is water).

### Unity: endless stage (key N) starts on the road
- Root cause: the stage was chosen as soon as *any* tile's roads were in; at 59.6501, 6.34968 the west neighbour answered
  first, the nearest junction within 600 m was not loaded, and the game fell back to free drive with the car at the pin
  (off the road, no pace notes). Now `LoadFromQuery` waits for the roads of every coarse tile within 1 km of the pin
  (`RoadGraph.HasTile`), and the walk starts on the nearest junction-to-junction link within 1 km (`RoadGraph.NearestLink`,
  `RoadGraphEdges.StartNear`), entered at its closest point and driven toward the longer end, so the car spawns on that road
  facing along it. No road within 1 km: free drive with a HUD message and a WARN line.
- `GameFlow.Reload` clears `FreeDrive` (a stage scouted from free drive could never finish).
- Fake roads have one way id per chunk (the graph grades a way once per id) and an optional `Wiggle`.
- Tests: `EndlessStartTests` (EditMode, bendy fake road, junctions 2 km apart: start on the road, along it, with pace notes;
  PlayMode: key-N style load in the offline scene starts on the road, not free drive).

### Unity: Norwegian trees and ground from the overlays
- Procedural Norway spruce, Scots pine, birch, mountain birch and shrub (3 LODs + baked impostor, bark/foliage textures),
  nine procedural ground layers driven by SR16 + OSM land cover, stream.js tree budget with road corridor, per-tile species
  log line, per-species LOD distances. Details in `unity/README-world.md` → "Trees and ground from the overlays".
- Fixed: trees were never visible in the Unity build (RenderParams with renderingLayerMask 0 — only their shadows drew).

## 2026-11-18

### JS game: cache up to 32 GB, keeping 10 % of the browser quota free
- `cache.js` budget is now at most 32 GB (was 10 GB) and is measured with `navigator.storage.estimate()` at start, every 5 minutes and every 256 MB written: 10 % of the quota stays unused, other site data counts against it, the oldest entries go when the room shrinks. A web page cannot see the disk; Chrome derives the quota from it. On this Chrome the site gets a 10 GB quota (no persistent storage), so the start screen shows "of 9.04 GB".

## 2026-11-16

### Unity: WebGL 2 (no compute) path actually runs
- Chrome on WebGL 2 failed to boot (`GraphicsBuffer … requires compute shader support` from the clipmap
  `TileTable`) and showed `Rally/TerrainClipmap`, `Rally/Tree`, `Rally/Water` as unsupported
  (`#pragma target 4.5` is GLES 3.1 to the GLES3 backend; StructuredBuffer reads).
- `Rally.Core.GpuCaps.Compute` (+ `ForceNoCompute` for tests) is now the one gate for every buffer and
  dispatch; the tile tables are small RFloat textures on both paths; `Rally/Tree` and `Rally/CarBody` got a
  target-3.5 SubShader (instancing / no dents), `TerrainClipmap` and `Water` are target 3.5; the CPU tree
  draw bins once per frame per (species, LOD) bucket; `Rally/CRT` computes its 4×4 Bayer threshold in
  closed form (no dynamically indexed const array, which WebGL GLSL compilers may reject).
- `SceneSmokeTests.DrivesOnTheNoComputeFallbackPath` drives the scene through the fallback C#;
  `Rally → Build Web (WebGL 2 only, diagnostic)` compile-checks the GLES 3.0 subshaders; README notes how to
  tell WebGPU from WebGL 2 in the browser.

### Unity: bootstrap scene built by code, PlayMode smoke test
- `unity/Assets/_Rally/Editor/SceneBuilder.cs` (`Rally → Build Bootstrap Scene`,
  `-executeMethod Rally.Editor.SceneBuilder.Build`) does what SCENE.md asked a
  human to click: URP asset + Forward+ renderer (SSAO, CRT feature off), volume
  profile, UI Toolkit panel settings, WorldStyle / VegetationSet / ActorSet with
  procedural placeholders (cone trees, capsule actors, flat splat arrays), road,
  water, sky and building materials, the Porsche prefab from the WoTiger FBX
  (scaled to the 2.45 m wheelbase, FBX wheels under pivot/spin pairs), and the
  `Rally.unity` scene with every GameController slot filled; Input System and
  linear colour in Player Settings.
- `Tests/PlayMode/SceneSmokeTests`: boots the scene offline, starts the engine and
  asserts the car drives > 5 m with no unexpected log output (needs a GPU).
- Fixes found by it: the car damage mask is now a linear R8 texture (sRGB R8 is
  unsupported on this GPU), the FBX mesh is readable for the CPU dent path, and
  `Hud.uss` no longer references the Press Start 2P font that was never in the
  repository. `GameController.Phase` is public for tests.

### Repository: JS game moved to `legacy-js/`, Unity rewrite started
- The Three.js game (sources, tests, `public/`, Vite config, `package.json`)
  now lives in `legacy-js/`; the Pages workflow builds from there, so the
  live site is unchanged. The old planning documents moved with it.
- `unity/` holds the Unity 6 / WebAssembly rewrite (URP, WebGPU-first,
  GPU clipmap terrain, compute-shader carving, indirect-drawn vegetation).
  Plan in `tasks/plan_20261116_unity.md`.

### Unity: tiles and overlays out to the horizon, cache up to 32 GB with 10 % of the disk kept free
- A view ring around the car reaches the visible horizon (where the fog closes, ~5.65 km) plus 300 m in every direction, next to the lead ring ahead; overlays follow every coarse tile. The drop distance now exceeds both rings, which stops tiles ahead being dropped and fetched again at speed. The coarse atlas grew from 64 to 96 tiles.
- The geodata cache holds up to 32 GB, measured against the disk (editor, desktop) or the browser quota (web) at start, every 5 minutes and every 256 MB written, keeping 10 % free and evicting the oldest entries when the room shrinks. The cache line on the start screen shows the current budget.

### Unity web build: the controls of the JS game
- Keys: G gearbox, Q/E switch to manual, R restart, N scout a new endless stage, C camera cycle, M mute (saved), Esc closes the map or returns to the start screen, F10/F3 debug window (position, altitude, heading, speed, gear, surface, water, damage, fps, tiles); three taps on the speed open it on a phone.
- Start screen: GEARBOX and SLIDING toggles (saved in the browser), PICK A ROUTE ON THE MAP, local cache size with CLEAR, the key list; a help line under the HUD on desktops.
- The Leaflet route map is wired: pins snap within 1 km, GENERATE ROUTE and FREE DRIVE HERE load the stage, the address bar follows, a friends room follows the new stage.
- Touch buttons (◀ ▶ BRAKE GAS DRIFT) on phones and narrow screens.
- Play-mode test presses the keys on a virtual keyboard; all three Play-mode tests and 119 EditMode tests pass.

### Unity web build: scrolling log window
- F2 or the LOG button opens a scrolling window (last 3000 lines, colour-coded, filters ALL / TILES / OVERLAYS / CACHE / WARN, FOLLOW, COPY). It is open while the world loads and closes at the countdown unless the player toggled it.
- New log events with timings and sizes: tile requests and ready, DEM time, loaded/pending counts; per tile the OSM road, building, land-use, waterway and power-line counts, the SR16 forest raster, trees placed and the overlay-applied line; cache hits and misses by kind. Everything is also written to the browser console with a `[rally]` prefix.

### Unity rewrite: all layers written (not yet compiled)
- Core (coordinates, floating origin, height grid), Geo (Kartverket,
  Overpass, SR16, NVDB, OSRM, IndexedDB cache shared with the JS game),
  World (GPU terrain, carve, species-typed trees, sky, water, buildings,
  colliders), Roads, Track (stage, pace notes, endless `RoadWalk`),
  Vehicle (faithful `car.js` port, PhysX collisions, damage state and
  visuals), Actors (animals and pedestrians crossing), Gameplay, Net
  (PeerJS, same wire format), UI, Presentation; EditMode tests port the JS
  suites. CI builds the web player once a Unity licence secret exists and
  Pages serves it under `/unity/`.
- Seven CC BY car models under `unity/Assets/_Rally/Art/Cars/` with licence
  files; research in `unity/docs/car-models.md`.
- First compile with Unity 6000.6.9f1: five small fixes, then the EditMode
  suite passes 117 of 117 (ported physics, pace notes, routing, GeoTIFF,
  cache, net, actors, gameplay, world). Found by the tests: engine damage
  now really caps top speed and drive force, the cache evicted nothing after
  its first pass, a west-edge land-cover lookup read the wrong cell.

### Changed — start and finish pins snap to the nearest road within 1 km
- Picking, dragging or typing A or B on the route map asks OSRM `/nearest`
  for the closest road or trail of the chosen profile within 1000 m, moves
  the pin onto it and says how far it moved and onto which road; the
  profile select re-snaps both pins (off-road keeps the raw picks). No road
  within 1 km leaves the pin where it was with a warning. The route request
  carries the same 1 km radius for its two ends (joints of a segmented
  route stay unlimited), so OSRM's `NoSegment` becomes a clear message, and
  the old 400 m / 750 m snap limits are gone. `tests/osrm.test.mjs`.
- Fixed: the status after GENERATE ROUTE on a streamed world read
  "OSRM: NaN km, NaN min"; it now reports the OSRM distance and time.

## 2026-11-15

### Added — pace notes: the next turn under the speedometer
- `turns.js` reads the stage line for bends (heading change across 12 m
  chords, runs of ≥ 20° merged into one turn) and the HUD shows the next
  one while racing: an arrow rotated by the bend's angle (orange for a
  hairpin), LEFT / RIGHT with EASY / HAIRPIN, and the distance to the
  turn-in rounded to 50 m (NOW inside it). Nothing in free drive.
- Fixed the same day: the note had LEFT and RIGHT swapped (the chase camera
  looks along +Z with screen-right at world −X, and the turn sign followed
  the world axes). The arrow and text now follow the bend as the player sees
  it, and the box is twice the size (76 px arrow, 36 px distance).
  `tests/turns.test.mjs`.

### Fixed — bouncy car after the real jumps
- Two causes. The lift remembered from a ramp survived the landing, so one
  step after touching down on flat ground the car launched again at the
  same speed (a trampoline). And a 4 cm gap within 0.15 s already counted
  as flight, so every kink and bump in the terrain mesh hopped the car:
  272 take-offs in 40 s of throttle on the demo stage's verges. Now the
  landing spends the lift, a take-off needs the free path above the ground
  from the very next step (so a ramp holds the car until its lip) and a
  gap of 0.25 m after 0.3 s, no wheel may be pressed into a slope above the
  body, and the surface-following lift is capped at a 1:1 slope (a bank is
  not a ramp). Same run: 8 take-offs; following the road at 90 km/h,
  59 → 9. Crests and table-tops still launch exactly once.

### Changed — real jumps
- Gravity is 9.81 m/s² (was a game value of 24) and take-off is ballistic
  instead of the car being glued to the ground: the car keeps the vertical
  speed the ground has been giving it and leaves the surface when free
  flight would clear the ground 0.075 s and 0.15 s ahead. A crest holds the
  car at 20 km/h and launches it at 100; a table-top throws it further the
  faster it goes. The flight ends when any wheel reaches the ground (less
  the suspension travel), wheels are never drawn under the ground in the
  air either, and an airborne car is dry until it lands on the water. The
  Space jump impulses were scaled to the new gravity (same height).
  `tests/jump.test.mjs`.

### Changed — 50 km/h off the road
- Off the road the drive is cut at 50 km/h and anything above it is bled
  off at up to 8 m/s²; roads are unrestricted. `tests/offroad-limit.test.mjs`.

### Changed — roads 50 % wider
- Two-lane roads are 10.5 m wide (5.25 m half) in an 18 m cut-through,
  single-lane roads 4.5 m (2.25 m half) filling a 7.5 m cut-through;
  shoulders stay 1.5 m. `LANES` in `corridor.js`.

## 2026-11-14

### Changed — one route picker
- **Click the minimap to open the route map.** It is now the only way to pick
  a start and finish: the ROUTE BUILDER / 2D MAP buttons, the 3-D topo picker,
  the OSRM coordinate panel and the minimap double-click are gone.
- The route map gained what those offered: an **off-road (A\*)** entry in the
  ROUTE BY select (both points inside the loaded world) and a `lat, lon` field
  that places the next pin on Enter. CLEAR was dropped (a third click starts a
  new pair).
- STAGE panel is down to NEW STAGE and RESTART; the start screen's car /
  gearbox / sliding toggles sit on one row.
- Removed the topo-drape mesh (`buildBasemapMesh`); the topo texture still
  feeds the minimap.

### Changed — houses drawn within 250 m only
- `cullHouses` hides every house instance farther than 250 m from the car
  (zero-scale matrices, refreshed four times a second per chunk and on the
  demo tile). The footprints stay in the collision index, so a hidden house
  cannot be driven through either once you reach it (it appears first).

### Changed — sliding levels 0–3
- The SLIDING toggle cycles four levels instead of two: **0 minimal**
  (default: planted, the tail only goes when thrown), 1 normal, 2 medium,
  3 loose (arcade drift). The buggy's planted tuning applies at 0 and 1.
  `window.__rally.setSlide(0–3)`.

### Added — share buttons for routes and positions
- **SHARE ROUTE** and **SHARE POSITION** buttons in the map footer and in
  the STAGE panel while driving. SHARE ROUTE copies the link for the
  current stage or free drive; SHARE POSITION copies a `?drive=LAT,LON`
  link to the car's current spot. The HUD buttons confirm with a toast
  (showing the link when the clipboard is blocked).
  `window.__rally.shareUrl()` / `positionUrl()`.

### Added — share a drive as a link
- `share.js`: **SHARE LINK** (now SHARE ROUTE) in the map footer copies a link
  (`?route=osrm:LAT,LON;LAT,LON;PROFILE`, `?route=demo:LAT,LON;LAT,LON` or
  `?drive=LAT,LON`) that rebuilds the stage or free drive on the other
  side once the game has loaded (OSRM re-routes between the endpoints, the
  demo mountain runs its A\* again). `tests/share.test.mjs`.

### Added — debug window on phones
- Three quick taps on the speedometer toggle the debug window (no F10 on a
  phone); `?debug=1` in the address still opens it from the start.

### Fixed — junctions smooth in every direction
- A road's terrace sides used to run on over a crossing or joining road and
  blend to the natural ground under it, which showed as wedges and cut lines
  across the junction (worst where the other road sits in a cutting). Rim
  heights now take the other road's surface where one lies at the
  cut-through edge, and the terrace mesh lies flush under any other road's
  flat band (`roadAt`, OSM roads and the stage route alike), so terraces
  meet crossing roads at their surface. Test in `tests/corridor.test.mjs`.
- Shoulders widened to 1.5 m (two-lane: 7 m + 1.5 m shoulders; single-lane:
  3 m + 1.5 m shoulders, filling its 6 m cut-through).

### Changed — minimap holds still, re-centres at the halfway mark
- The minimap window no longer follows the car every frame: it stays put
  while the car moves inside its inner half and jumps to re-centre once the
  car is halfway from the centre to the edge (or when the stage changes).
  The car marker moves across the map; zoom changes and a slow periodic
  refresh re-render around the current centre. The cached layer and the
  live overlay now share one centre, so nothing drifts.

### Added — F10 debug window
- `F10` (and still `F3`) opens the debug window; it now shows the car's
  latitude/longitude, altitude, heading and world position, whether the
  ground under the car comes from a 1 m tile or the chunk grid, the road
  (offset, surface, cut-through width), water depth and slope, the room,
  plus the fps/draw-call/streaming/memory lines it had.

### Changed — wider roads, faster frames, continuous roads
- Two-lane roads are 7 m wide (3.5 m half), single-lane 3 m (1.5 m half),
  shoulders 1 m; cut-throughs unchanged (16 m / 6 m).
- **Minimap no longer redraws its terrain every frame.** Its zoom window
  glides with speed and was compared for exact equality, so while moving
  the 95² height samples were recomputed each frame (6.8k samples, ~5 ms).
  Compared with a tolerance now.
- The minimap's road network (up to ten thousand segments) is drawn into
  the cached terrain layer instead of stroked every frame.
- All OSM road ribbons of a chunk are merged into one mesh (one draw call
  per chunk instead of one per road).
- The car's wheel ground queries search roads within 24 m instead of 120 m.
- Per-frame work trimmed: road points for the 1 m tile picker are gathered
  only when it picks (not every frame), chunk hole rebuilds are debounced
  (250 ms after the last tile, at most 1.5 s), house walls are looked up
  once per frame instead of per physics substep, the 1 m tile lookup caches
  the last tile, and the fine meshes use 1 m only within 110 m, 2 m to
  300 m, 3 m beyond, with 24 tiles held.
- Roads no longer break: a road *crossing* the stage road keeps going (only
  the stage's parallel OSM twin is cut, by comparing directions). Wherever a
  way meets a road already in the network (its ends, T-junctions,
  crossings) its height is eased onto that road over 60 m either side, so
  junctions and crossings meet without a step and the carve has one height
  per spot.
- **Bends are curves.** OSM centrelines get two rounds of Chaikin corner
  cutting in 2D before resampling (`smoothWay`); nodes shared with another
  way (junctions) and the way's ends are pinned, so roads still meet exactly
  where OSM says. The shared-height registry is keyed by sample position
  (to 0.5 m) instead of sample index, so chunk copies still agree.

### Changed — the road is a terrace cut through the DTM
- Two road classes (`LANES`): a normal **two-lane** road is 6.5 m wide with
  1 m shoulders inside a **16 m cut-through**; a **single-lane** road is 2.5 m
  wide with 1 m shoulders inside a **6 m cut-through**. OSM roads use the
  `lanes` tag when present, else the class (numbered roads two-lane, the
  rest single-lane); driving stages are two-lane, generated and trail
  stages single-lane.
- The profile is now a terrace: flat from shoulder to shoulder at the graded
  road height, blending (smoothstep) to the natural ground at the
  cut-through edge, with a 1.5 m feather outside; the DTM beyond is
  untouched. The rim heights are the ground at the cut-through edges,
  smoothed along the road (`assignEdgeHeights`), so the terrace runs smooth
  in the road direction and is only reshaped across it from shoulder to
  shoulder. Replaces the 1:1.5 fill / 1:1 cut slopes with a 24 m reach.
- Road grading window ±60 m × 3 passes (was 45 m). Chunk copies of a road
  share rim heights through the same registry as the road heights.
- Car, ribbon, corridor mesh, coarse chunks and 1 m tiles all evaluate the
  same profile (edge heights travel with the route and road-network
  queries).

### Added — solid houses
- Every placed house keeps its oriented footprint; `BuildingIndex` (64 m
  buckets, per chunk, dropped with the chunk; the demo tile too) answers
  `near(x, z)` and the car treats itself as a 1.05 m disc against those
  boxes: it is pushed back out of the wall, the speed into the wall is
  killed with a small bounce, the rest is scraped down, with a thud and
  camera shake. You can no longer drive through a house.
  `tests/crash.test.mjs`.

### Fixed — carved road band coloured as road, never by land cover
- `carveProfile` now records what each ground cell became (road band:
  asphalt or gravel; cut/fill slope). Chunk and 1 m tile meshes colour the
  band dark grey / gravel to match the ribbon and never apply the OSM /
  SR16 land-cover tint there; slopes keep bare ground colours. No more
  green showing through on the asphalt. Test in `tests/corridor.test.mjs`.

### Changed — one build runs on GitHub Pages and on a PC
- `vite.config.js` uses a relative `base` (`./`), so `dist/` works from any
  static file server at any path (and `npm run preview` at `/`), not only
  under `/norwayralley/`. Runtime fetches already go through
  `import.meta.env.BASE_URL`. README: how to serve it locally, and why a
  `file://` page cannot work.

### Changed — HUD layout
- The speedometer sits top centre (where the stage timer was); the stage
  timer and progress bar sit under the STAGE panel in a right-hand column.
  Phone layouts follow.

### Fixed — road heights no longer depend on load order
- OSM roads are now graded over the whole way, on the coarse ground only,
  before being clipped to a chunk, so every chunk holding a piece of a road
  computes the same heights whatever has loaded around it, and the 1 m tiles
  never change a road's height. Lines carry their OSM way id and the fine
  tiles keep one copy per road (neighbouring chunks each held one), which
  had left the carriageway wavy at chunk borders.

### Added — 1 m ground along the road (`fine.js`)
- Streamed worlds now fetch the same Kartverket DTM at **1 m** in 171 m
  tiles (16 coarse cells, so they align with the chunk grid) inside ±100 m
  of the roads near the car: the stage route and the road network around a
  point led along the velocity. Up to 30 tiles are held, nearest first,
  two downloads at a time beside the chunk downloads, dropped beyond 900 m,
  and cached like every other DEM.
- Each tile is carved with the same road profile and start pad, drawn as its
  own mesh (1 m within 150 m of the car, 2 m to 400 m, 3 m beyond, with skirts), and the
  coarse chunk mesh gets a cell-aligned hole under it, rebuilt one chunk per
  frame. `sample()` / `sampleBase()` answer from the tiles first, so the car
  rides the 1 m ground; roads stay graded (see above). Tiles are re-carved
  when a chunk's OSM roads arrive or the stage changes.
- The 10.7 m chunks remain for everything else (the horizon), loading in
  the background as before; free drive stays unlimited. The F3 overlay shows
  the tile count. `tests/fine.test.mjs`.

### Fixed — roads were drawn twice
- The corridor mesh drew the carriageway too (an earth slab 14 cm under the
  ribbon), so the road read as two interleaved layers. It now starts where
  the ribbon ends (`RIBBON_SHOULDER`, shared with stage.js) and covers only
  the slopes outward, as two strips with nothing under the road. One smooth
  surface per place. Test in `tests/corridor.test.mjs`.

### Fixed — everyone in a room drives the same stage
- Only the host used to share its stage; a guest who picked a new stage,
  loaded a saved route or scouted with N silently drove something else.
  Now any player's stage change goes to the room: a guest sends it to the
  host, the host drives it and relays it to the others (not back to the
  sender) and keeps it for late joiners. Applying a stage that came from the
  room never re-shares it, so nothing bounces.

### Added — a 10 GB local cache for everything fetched
- `cache.js`: an IndexedDB store (ArrayBuffer / Blob / JSON) with a byte
  budget (10 GB) and least-recently-used eviction; parallel asks for one key
  share a single load; failures are never cached; the browser is asked for
  persistent storage. Wrapped: Kartverket DEM GeoTIFFs, Overpass chunk
  answers (keyed by bbox, whichever mirror answered), NVDB signs and road
  surfaces, SR16 forest images, OSRM routes and nearest-road answers, and
  the 2D map's OSM tiles (a cached tile layer). A place visited once loads
  from disk afterwards and keeps working while a service is down.
- Start screen shows "Local cache: … of 10 GB · n entries" with CLEAR.
  `tests/cache.test.mjs`.

### Changed — graded roads, stage on the map, longer streaming reach
- **Smoother roads.** Road heights (stage routes, streamed routes and OSM
  roads alike) are now graded with `smoothRoadHeights`: three passes of a
  ±45 m running mean over the ground, so bumps shorter than ~100 m are
  ironed out while hills keep their grade; the corridor's embankments and
  cuttings take up the difference. Replaces the ±30 m single running mean.
  `tests/roadgrade.test.mjs`.
- The 2D map opens on the **stage being driven** (yellow line) with a red
  "YOU" pin on the car; in free drive it centres on the car. Zoom out for
  the whole country. Leaflet's zoom/fade animations are off (they left the
  panes stuck mid-zoom whenever the tab had no animation frames).
- Streaming reach: DEM chunks are fetched within 4.4 km of a point led up
  to 2.8 km along the velocity (was 3.9 / 2.2 km) and kept to 5.3 km, so a
  fast car no longer reaches the edge of the loaded ring.

### Fixed — houses were missing (Overpass mirror order)
- From some networks overpass-api.de and overpass.private.coffee hang for
  the whole 25 s timeout while overpass.openstreetmap.fr answers in 0.4 s.
  The game tried the mirrors in order, so every chunk waited 75 s and the
  60 s breaker often tripped first: no houses, side roads or fields.
  `buildings.js` now remembers the mirror that answered last and asks it
  alone; with none known (or after a failure) it races the live mirrors and
  keeps the first to answer, cancelling the rest; a failed mirror sits out
  for two minutes. Demo tile features now arrive in ~6 s; a free drive at
  Jørpeland showed 1 230 houses within 20 s. `tests/overpass.test.mjs`.

### Changed — the 2D map masks every other country
- A world polygon with Norway cut out (geoBoundaries gbOpen ADM0 outline,
  CC BY 4.0, simplified to ~1 km, Svalbard/Jan Mayen left out) shades
  Sweden, Finland, Denmark, Russia and the open sea. It hides above zoom 11
  where its coarseness would shade real shoreline.

### Added — menu, saved routes, Norway-only map
- STAGE panel: **MENU** replaces RESTART (R still restarts, Esc opens the
  menu). It returns to the start screen with the stage kept, so the car,
  gearbox and sliding can be changed; START ENGINE / Enter resumes.
- **Saved routes**: `saved.js` keeps a named list in localStorage (the same
  descriptor the room shares); the map footer has SAVED ROUTES / LOAD /
  DELETE and a name field with SAVE CURRENT. `tests/saved.test.mjs`.
- The route map is boxed to Norway: `maxBounds` with full viscosity, tiles
  only requested inside the country, a shaded mask outside, and the minimum
  zoom is the whole country.
- Start screen credit: "Made by Filip Tobias Moan © 2026".

### Changed — the buggy is planted in normal mode
- Measured in the cornering tests the buggy slid no more than the 911 (5°
  slip against 5–7°), but it should feel calmer: a per-car `planted` block
  (buggy only, normal mode only) adds 30 % lateral grip, cuts the throttle
  kick to 0.3×, looseness to 0.45×, wander to 0.35×, yaw authority to 0.85×
  and makes yaw follow the steering 1.4× faster. Now ~3° slip and no drift
  episodes in the same corners; *lots* mode is unchanged.
- `swapCar` disposes the spray pool too.

### Changed — climb limits and track strength
- Slope gravity is now g·sin θ along and across the car (it used to fade on
  steep ground). Each car has `maxClimb`: Porsche 30°, Formula Offroad 80°.
  Below it the drive and lateral grip are floored so the car can always
  climb (margin shrinking towards the limit); above it tyre load falls with
  cos θ and the car slides back. `tests/climb.test.mjs`: Porsche climbs 25°,
  not 35°; buggy climbs 70°, not 85°.
- Tyre tracks carry a per-mark alpha: off-road 0.9, gravel road 0.5, asphalt
  0.14 (a faint trace, no longer clean), skid rubber 0.8, foam 0.7.

### Added — a real splash
- `water.js` keeps the lakes and rivers it builds and answers
  `waterAt(x, z) → { depth, surface }` for the sea (DTM height 0 counts as
  deep), the fjord shore, lake outlines and river ribbons; both terrains and
  the car use it.
- Hitting water: a crown of droplets round the car (soft round sprites),
  scaled by speed and landing impact; a second splash when the bed drops
  into deep water; bow spray off the front wheels while wading. A flying car
  stays dry until it comes down to the surface.
- Tyre tracks continue on the water as a pale foam wake drawn on the
  surface.
- Physics: v²·depth water drag (capped), wet tyres grip less, an engine under
  0.8 m hardly pushes; roof under for 2.5 s puts the car back on the last dry
  ground with a toast. HUD shows WATER / DEEP WATER.
- Sound: splash slap + whoomph bursts, a wading noise scaled by speed and
  depth.

## 2026-11-13

### Fixed
- **Car no longer cuts through the road.** The road carve snapped every ground
  cell to the nearest route *sample*, producing a staircase along any grade
  (0.83 m centre-line error on a 10 % slope in the regression test). Both the
  baked (`terrain.carveRoad`) and streamed (`stream.carveChunk`) carves now
  interpolate along route *segments*; error is under 1 cm.
- The car rides on the gravel ribbon itself (ribbon lift + crown shared via
  `stage.js` constants), not 20 cm below it; the lift fades over the shoulder.
- Suspension travel limited to a realistic range; landings compress the
  wheels instead of pushing the body through the surface.
- Slope gravity on the road samples the carved slab (±1.8 m) rather than the
  hillside beside it, so a flat road cut into a slope no longer pulls the car
  sideways.
- Route distance is measured to the nearest segment, not the nearest sample.

### Added
- **Porsche 911 body**: smooth lofted surface (rounded flanks, fender crowns
  with round lamps, rear hips, wheel arches, domed glasshouse, fastback,
  ducktail). Wheelbase 2.45 m, track 1.55 m.
- Wheels follow the ground under each tyre (independent travel).
- **Three cameras** on keys `1` (straight above), `2` (chase), `3` (driver's
  seat); `C` cycles. The bonnet camera is replaced by the driver's seat.
- **Start screen turntable**: the car rotates slowly beside the start card.
- **Buildings from OpenStreetMap footprints**: one Overpass request per chunk
  (`out geom`) returns building polygons, land-use areas and waterways. Each
  building gets its true heading and size from the footprint's minimum-area
  rectangle and a family from `building=*` (house, cabin, barn, shed,
  boathouse, church with tower, industrial, apartment block) that sets eaves
  height, roof pitch and colours.
- `npm test`: Node tests for the carve, the car physics and the footprint fit.
- GitHub Pages deploy workflow with the `/norwayralley/` base path.

### Added later the same day (map data + car feel)
- **Forests from NIBIO SR16**: per chunk, the `SRRTRESLAG` (species) and
  `SRRKRONEDEK` (crown cover) WMS tiles are read back and classified by
  colour into a 16 m land-cover grid; spruce, pine and birch are instanced
  with density following the canopy cover, budgeted toward the road.
- **Fields, pasture, bog, built-up land** from OpenStreetMap polygons tint
  the ground mesh and minimap (striped golden fields); no trees on them.
- **Rivers, streams and lakes** from OpenStreetMap (`water.js`): ribbons draped
  into the valley floor that never flow uphill, flat lake polygons.
- **Road signs from Statens vegvesen NVDB v4** (`signs.js`): real `Skiltplate`
  objects as textured plates on posts beside the stage road, facing oncoming
  traffic; speed-limit signs synthesised from `Fartsgrense` where the limit
  changes and no plate is registered. ~40 Norwegian sign faces drawn
  procedurally (speed limits, warnings, yield/stop, prohibitions, crossings,
  road names, chevrons).
- **Car**: 430 Nm rally tune and less drag (about 160 km/h on gravel, was
  ~95), chase camera widens its field of view with speed, bigger wheels in
  larger arches, flanks tucked below the hips, narrower flatter roof,
  headlamps seated in the fender crowns with chrome bezels.
- **Roads narrowed** to real Norwegian gravel widths (6.4–6.8 m instead of
  8.4–9.6 m), which also restores the sense of speed and scale.
- Docs: `ARCHITECTURE.md` (new), README map-data section and credits, on-screen
  attribution for NIBIO, OpenStreetMap and Statens vegvesen.
- **Free drive mode** (`FREE DRIVE HERE` on the 2D map): the world streams
  around one point with no stage or finish. OpenStreetMap roads are carved
  into every chunk and drawn as tarmac/gravel ribbons (`roads.js`); a
  `RoadNetwork` spatial index stands in for the stage route so the car rides
  on real roads, trees and houses keep clear of them, and signs line them.
  Side roads also appear in normal stages.
- Robustness: Overpass requests are queued (2 at a time), tried on three
  mirrors, skipped for a minute after a total failure and retried per chunk;
  SR16 forests and NVDB signs no longer wait for Overpass.
- Fixed a freeze when planning forests (per-cell route distance lookups).
- Rooms: every other player carries a beacon — a tall arrow in their car's
  colour hovering 9 m above the car, pointing down, slowly turning, with the
  callsign above it — so friends are easy to spot from afar.
- **Tyre tracks** (`tracks.js`): wheels leave dark ruts on gravel and open
  ground and black rubber on asphalt while sliding; a ring buffer of quads
  per wheel (about 350 m each) laid on the ground as you drive.
- Rooms: every player's car is painted by grid slot (host red, then blue,
  yellow, green, white, orange, purple, teal), identical on every screen.
- Rooms: a starting grid (host on the line, joiners in pairs 6 m apart) so
  nobody spawns inside another car; car swaps travel with the packets; other
  players show as dots on the minimap.
- Friends panel: the host is in the room as soon as it opens — typing your
  own code into JOIN no longer destroys the room, JOIN is disabled while
  hosting, HOST again shows the existing code, and CLOSE AND DRIVE returns
  to the start card.
- **Play with friends** (`multiplayer.js`): peer-to-peer rooms with a
  4-letter code (WebRTC data channels, PeerJS signalling). The host relays
  positions at 12 Hz and shares the current stage with joiners; other
  players appear as named cars with 120 ms interpolation. Bluetooth is not
  possible from a web page, so this is the nearby-play equivalent.
- **Phones sideways**: touch controls now appear on any touch device in any
  orientation and re-flow for landscape (steering left thumb, pedals right
  thumb, HUD and minimap tucked into the corners). START ENGINE goes full
  screen and asks the phone for landscape where the browser allows it.
- **Sliding setting** (SLIDING toggle on the start card, remembered):
  *Normal* is the new default — the car can only ask for the yaw rate its
  tyres can deliver, grip is 30 % higher with a stiffer slip curve, loose
  surfaces wander and power-oversteer less, and handbrake slides recover in
  0.45 s. *Lots* keeps the arcade drift feel. The handbrake drifts in both.
- **Second car: Formula Offroad buggy** (CAR toggle on the start card, or
  `window.__rally.setCar('buggy')`): 1 200 hp / 1 500 Nm, 4WD, 1.24 m paddle
  tyres that grip loose ground 25–40 % better (and asphalt worse), long-travel
  suspension, four gears to 212 km/h at 8 000 rpm. Tube-frame model with roll
  cage, driver, V8 stacks, splitter and wing. Each car is a spec object in
  `car.js` (mass, gearing, power, traction, grip, suspension, eye point).
- Drive force is now power-limited (F ≤ P / v) on top of the torque curve.
- **Gravity is more pronounced**: slopes pull with ~1.4 g along the road
  (and 0.8 of that sideways), airborne gravity 24 m/s², the Porsche loses a
  fifth of its speed on a 25 % climb where the buggy powers on.
- **Engineered road corridor** (`corridor.js`): the road is a flat
  carriageway with a 1 m shoulder, carried on a 1:1.5 embankment where the
  ground is lower and cut 1:1 into the hillside where it is higher. The coarse
  terrain is carved to that profile from the untouched DEM, a 1 m corridor
  mesh draws the embankments and cuttings (rock faces in deep cuts, bare
  earth on fills) on the demo stage and on near chunks of streamed worlds,
  and the car's wheels evaluate the same profile, so visuals and physics
  agree and the car no longer dips with the ground under a road.
- Phones / touch screens: the stage panel folds to its title tab when the
  drive starts (tap to open, tap again to fold), the brand badge hides and
  the progress bar shrinks, leaving the road visible.
- **Handbrake (SHIFT) drifts**: the rear wheels lock (they visibly stop
  turning), the rear axle loses almost all sideways grip, the tail is thrown
  in the steered direction, and the slide carries on for ~0.7 s after release
  instead of snapping straight. Tyre smoke on asphalt while sliding.
- The baked Preikestolen demo now also fetches OpenStreetMap buildings and
  water and NVDB road signs for its 2 km tile (houses were previously only
  placed in streamed worlds).
- **Minimap** is now a north-up window that follows the car (1.4–2.3 km
  across, wider at speed) with live hillshade, land-cover tints, the loaded
  OSM roads, the stage route, a scale bar, and the car always at the centre.
  Click it twice to route a stage between the two spots.
- **Road surfaces**: NVDB "Vegdekke" (type 241, `Massetype`) where
  registered, else OpenStreetMap `surface`/class; the stage ribbon is drawn
  as asphalt or gravel per sample. Asphalt grips hard and raises no dust;
  gravel and open ground dust at speed, let go more progressively, allow
  more rotation and power-oversteer; HUD shows ASPHALT / GRAVEL / OFF ROAD.
- **Steering** is a bicycle model (yaw = v·tan δ / wheelbase) with the wheel
  angle shrinking with speed and capped by tyre grip: wide lines at speed
  instead of the old twitchiness.
- Houses: clean gable roofs (no stray faces) and hillside foundations so the
  downhill wall stands on the ground.
- **Gearbox**: automatic or manual, chosen on the start card (remembered) or
  with `G`; `Q`/`E` shift. Five 911-style gears on a 12 000 rpm engine that
  run out at 60 / 100 / 140 / 180 / 220 km/h, a rev limiter on the redline,
  and a tyre traction limit so the tall first gear does not launch the car
  unrealistically. The HUD shows RPM beside the speed, with the bar turning
  red near the limiter.
- Free drive starts on a road: the picked point is snapped with OSRM `nearest`
  (heading from a short route along it) and the loader waits up to 12 s for
  the spawn chunk's OSM roads before handing over the car.
