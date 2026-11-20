# Tile seams, streaming hitches, solid obstacles, road arrow, place search — 2026-11-20

User: "Make sure car always stays outside objects. Also verify that the pre caching of generated landscapes is done
while user drives avoiding lags. Also minimising glitches between tiles etc should be prioritised. Also in the map route
selection add a new mode: search for place names for start and end." + "Additional feature is moving direction arrow
down onto the road ahead of car." + "Make a plan for all this before executing".

Scope: the Unity game (unity/). Paths below are relative to unity/Assets/_Rally/Runtime.
Order (one Unity instance at a time): A tiles → B streaming → H start screen + log bar + I rename → C obstacles + G minor-road speed → J tunnels + bridges → D road arrow + F finish banner. E (place search) needs no
Unity editor and runs alongside A. One commit per section after my own test rerun + Chrome check.

## What the code does today (survey 2026-11-20)
- Streaming already looks ahead: focus = car + velocity × 3.5 s (≤ 2.8 km), coarse 2 km tiles in a 4.4–7 km ring, fine
  256 m tiles along roads near the lead point, stage line prefetched in endless mode only. Only HTTP/IndexedDB run off the
  main thread; GeoTIFF decode + resample, the WebGL 2 carve (`Complete()`), tree scatter, and above all the per-tile
  overlay `Apply` (road grading, re-carve of every overlapping tile, ribbon + bridge meshes with MeshCollider bake, signs,
  land cover, water, buildings) all run in one frame. Bench averages frames between editor ticks, so single hitches are hidden.
- Borders: one clipmap surface, but each tile resamples its own DEM window → edge heights can step; fine↔coarse is a hard
  switch (DTMs differ by dm, coarse carve is widened/sunk) with no blend, normals across the step show a lit line, the
  fine verge mask is 1.0 vs coarse 0.35 (tone step), splat has no halo, fine→coarse swap is an instant pop. The coarse
  draw table covers only ±4 tiles, so loaded tiles out to 7 km may never be drawn. No seam tests exist.
- Solids: trees (96 pooled capsules ≤ 40 m), buildings (non-convex MeshCollider per tile), bridge rails/piers, sign posts
  (128 pooled capsules). The car does a box sweep + overlap push-out per frame. No depenetration at spawn/reset/sink
  recovery or when a tile streams a building in around the car; a car fully inside a building mesh is not detected; the
  sweep ignores yaw during a spin; a full pool silently leaves objects without collision. Fences/poles/rocks don't exist.
- Arrow: a 76 px HUD image rotated by the next pace note's angle; hidden in free drive (no route line there).
- Map: Leaflet picker in WebGLTemplates/Rally/index.html; click S then F, each snaps to a road within 1 km. No search.

## A. Glitches between tiles (priority)
- [x] Measure first: a `-previewSeams` survey that walks every border of the loaded tiles (coarse/coarse, fine/fine,
      fine/coarse) and logs height step, normal step and ground-colour step, plus before shots of the worst places.
- [x] Shared edges: neighbours take the same height on their common edge (sample the edge from one source / average
      both, so the edge is identical bit for bit). Test: random tile pairs, step = 0.
- [x] Fine↔coarse: blend over a band at the fine-tile outline (heights, normals, verge mask) instead of a hard switch;
      fine tiles fade in (not out, see Review) over ~0.5 s instead of popping. Test: step at the outline < 2 cm, no visible line in shots.
- [x] (measured, not needed) Splat/land cover: one texel of halo from the neighbour so colours match at the border. Test: colour step at border.
- [x] (measured: already covered) Far terrain: the draw table covers every loaded coarse tile (no holes or clipped terrain near the horizon).
- [x] Roads/water/trees across borders: check for doubled ribbons (z-fight), cut rivers and tree rows on border lines.
- [x] After shots of the same places, before/after numbers in the Review.

## B. Pre-generating landscape while driving (no lags)
- [x] Measure honestly: the bench records every real frame (no averaging between ticks) and logs each frame > 33 ms
      with what ran (DEM decode, carve, scatter, overlay stages, collider bake, uploads, GC). Drives: 120 s on the stage
      at 90 km/h, 120 s free drive, a fast highway run.
- [x] Check that tiles are ready before the car reaches them: log time between "fine tile ready" and the car entering it;
      also prefetch the stage line in normal (non-endless) stages, not only in endless mode.
- [x] Spread the heavy work: split the overlay `Apply` into stages over several frames with a ms budget (grading, carve,
      meshes, colliders, signs, land cover); recarve only what changed; move GeoTIFF decode/resample and the carve to Burst
      jobs that are completed later (not `Complete()` the same frame); avoid allocations in the per-frame paths.
- [x] Target: no frame > 50 ms and p99 within 1.5× of the median during the drives (desktop editor, and spot-check in
      Chrome); avg frame time not worse. Numbers before/after in the Review.

## C. The car always stays outside objects
- [x] One depenetration step that every placement goes through (spawn, restart, new stage, reset, sink recovery,
      teleport): if the car box overlaps a solid, move it to the nearest free spot along the road.
- [x] Stream-in guard: a building/bridge/sign collider that appears around the car pushes the car out along the shortest
      way out of the object's footprint (not the nearest triangle, which can be inward); a car fully inside a building
      mesh is detected (convex per-building colliders, or a footprint point-in-polygon test).
- [x] Spins: sweep the yaw change too (sub-step the overlap test when yaw changes > ~15° in a frame).
- [x] Pools: never run out silently — nearest objects first, grow or warn; overlap buffer bigger than 16.
- [x] Tests (PlayMode): high speed head-on and sideways into a building wall, bridge rail and sign post; spinning
      against a wall; spawn inside a building / tree / sign; a building streamed in on top of the car; 20 fps frames.
      Each ends with the car outside every solid. Frame-time cost checked with the bench.

## D. Direction arrow on the road ahead
- [x] A flat arrow mesh (unlit, semi-transparent, retro style) lying on the drawn road surface 15–30 m ahead (further
      at speed), following the road height and slope, pointing along the route towards the next turn; it bends with
      the corner for tighter turns. It is drawn on top of the road (no z-fight), never through the car, and fades near the
      car, under bridges/in water, and after the finish.
- [x] The HUD box keeps the distance and turn kind text (e.g. "120 HAIRPIN RIGHT"); the small HUD arrow goes away.
- [x] Free drive: points along the current road (no route line there).
- [x] Help text, README; tests for position (on the road, ahead of the car) and direction (matches the next turn).

## E. Route map: search place names for START and FINISH
- [x] Two search boxes (START, FINISH) above the map; suggestions from Kartverket's stedsnavn API
      (`ws.geonorge.no/stedsnavn/v1/navn`, CORS open, no key), 300 ms debounce; towns and villages first, then other
      names, each shown with its type and municipality ("Hovden — tettsted, Bykle").
- [x] Picking a suggestion sets that pin through the existing `pick` event (so it snaps to a road the same way) and pans
      the map; when both are set, GENERATE ROUTE works as before. Clicking on the map still works.
- [x] Keyboard (arrows / Enter / Esc) and phones; offline/error shows a short message in the map status line.
- [x] Help text and README updated.

## F. Checkered finish banner over the road
User: "Also make sure the finish line is marked with a checkered banner over road."
- [x] Today no gate is drawn in Unity (`StageRoute.Gate` exists but is unused). Build a finish gate at the finish pose:
      two posts beside the carriageway (spanning the drawn road width, standing on the ground, not in the ditch), a
      black-and-white checkered banner across the road at ~5 m clearance, and a checkered line painted across the road.
- [x] Posts are solids (section C rules); the banner is high enough for every car incl. the Ranger; visible from ~300 m
      (LOD or simple mesh), lit like the world, no z-fight on the road line.
- [x] Placed for every stage (new stage, restart, shared links, endless sectors' finish); removed when the stage changes.
- [x] Test: gate centred on the route at the finish distance, banner above the road, posts outside the carriageway.
      Done together with D.

## G. Full speed on minor roads; gravel max 120 km/h
User: "It also seems like the car slows down when driving off on minor roads, it should allow the full speed range for the
car model, but gravel roads max 120 while only limited by car make on asphalt."
- [x] Reproduce first: drive each car (scripted, flat and real terrain) onto minor roads of every OSM kind (unclassified,
      residential, service, track grades 1–5, gravel/asphalt per NVDB Vegdekke) and log speed, OnRoad, surface, the cap that
      binds (OffroadMax, damage cap, drag, gravel grip) and whether a ribbon/road-graph entry exists there.
- [x] Likely causes to check: minor ways not in the road graph / not drawn (counted as off road → OffroadMax), the road
      overlay of a tile not loaded yet when the car arrives (→ ties in with B), extra rolling drag or grip on gravel.
- [x] Rules after the fix: asphalt → only the car's own TopSpeed (power/aero); gravel (any drawn gravel road incl. tracks)
      → min(car TopSpeed, 120 km/h); real off road keeps the car's OffroadMax. The HUD surface tag matches what binds.
- [x] Tests (EditMode, per car): top speed on asphalt = car spec; on gravel = min(spec, 120); on each minor road kind the
      car is OnRoad. Help text ("gravel: max 120 km/h"), README, CHANGES. Done with C (car code).

## H. Tidy start screen; log window minimised with a progress bar
User: "tidy up the start screen, also minimize the log window showing a progress bar on the minimized log window." +
"the log window should be minimized by default."
Before (scratchpad/startscreen_before.jpg, 1512×795): the open log covers the title, car cards and buttons; the driving
HUD (clock, speed, gear, OFF ROAD) shows through the start screen; the status line ("ENTER to start the engine tiles
4+4 (+49) 28 MB") overlaps the multiplayer hint; the cache row + CLEAR overlaps the credits; credits appear twice (Unity
label + page footer); the keys line wraps into the buttons; the cards' left part is hidden.
- [x] Log window starts minimised (always, also while the world loads): a slim bar (e.g. bottom-left or under the top
      buttons) with "LOG" + a progress bar for world loading (tiles ready / wanted, overlays pending, fetches in flight →
      one 0–100 % value with a short text like "terrain 12/16 · roads 3/8"), and the newest warning count. Click / F2 opens
      the full window; X minimises again. Progress reaches 100 % when the start area is ready and stays useful later
      (streaming activity while driving).
- [x] Start screen layout: one centred column that fits 1280×720 down to phone width without overlaps — title, car cards
      (all visible, scroll or wrap on narrow screens), START ENGINE, one options row, one short keys line, a compact
      "drive with friends" block, cache + credits in one small footer (credits once; keep the page footer or the Unity
      one, not both). Hide the driving HUD while the start screen is up. Status text gets its own line, no overlap.
- [x] Check at 1920×1080, 1512×795, 1280×720 and 390×844 in Chrome; screenshots before/after. Help text/README updated.
- [x] ESC → start screen to change car etc. (user: "User should be able to click "ESC" to come back to main menu to change
      cars etc."). Code already has Esc → `ToMenu()` (GameController ~975) and ChooseCar refuses outside Intro/Loading —
      verify in the real web build why it doesn't work for the user (browser Esc = leave fullscreen / pointer lock, focus,
      phase guards such as Countdown/Finished, free drive, endless, map open, help open). Make Esc (and a visible MENU
      button on the HUD, also for touch) open the start screen from every phase; there the car, gearbox, sliding, route
      and room can be changed; START ENGINE restarts the current stage with the chosen car. Test in PlayMode: Esc while
      driving → start screen → choose another car → start → the new car drives the same stage.
- [x] Tests: PlayMode/GarageSceneTests-style check that the log starts minimised and the progress bar exists and moves.
      Done after A/B (needs Unity), before C.

## I. Rename the game to "Grand Tour Norway"
User: "Also rename game to "Grand Tour Norway"".
- [x] Every name the player sees: Unity productName (ProjectSettings), web page <title>, the start-screen title
      (Hud.uxml), the WebGL template, GameController strings, the share-link text, help text. Unity game only
      (user: "This is ment for the unity game.") — the JS game in legacy-js keeps its name.
- [x] Docs: unity/README.md, the Unity parts of README.md / ARCHITECTURE.md; CHANGES.md entry. Old dated plan files
      (legacy-js/retro_norway_rally_*.md) stay as history.
- [x] Kept on purpose (renaming would break things): the repo name / URL (fliptmoan.github.io/norwayralley),
      C# namespaces `Rally.*`, folder `_Rally`, localStorage / IndexedDB keys `rally.*` (players would lose their saved
      car, settings, routes and cache), multiplayer room ids. Changing productName moves Unity's own PlayerPrefs/IndexedDB
      path — check that the game's cache and saved settings survive the rename (they use our own keys).
- [x] Logo: the start-screen title restyled for the new name (same retro look, fits on a phone). Done with H.

## J. Tunnels and bridges from the map
User: "game needs to handle bridges and tunnels as well. when a tunnel or bridge is marked on map it should be generated"
Today (checked 2026-11-20): bridges exist since 44add6f — a way tagged `bridge=*` is a span end to end, untagged roads
get a bridge where they cross water; deck + rails + piers by BridgeMesh, car rides the deck (ILayeredGround). Tunnels are
NOT handled: `tunnel=yes` ways are only kept out of random stages (RoadGraph.IsBarred) but are graded and carved like
any road, i.e. a trench or a road draped over the mountain where the real road goes inside it; OSRM routes and free
drive can still follow them.
- [x] Tunnels: a way tagged `tunnel=yes|building_passage|avalanche_protector` (not `culvert`, `no`) is graded as a straight
      gentle profile between its two portals (no terrain following), the terrain above is NOT carved (the mountain stays),
      the portals get a cut into the slope + a concrete portal face, and the tube is drawn (walls, roof, road ribbon inside,
      lamps along the roof, darker lighting / exposure inside). The car drives on the tunnel floor, the mountain above is
      not ground for it (ILayeredGround reference height, as for bridges), and the tube walls are solid (section C rules).
      Camera: the chase camera stays inside the tube (no clipping into the mountain). Long tunnels (Lærdal 24.5 km) work.
      `avalanche_protector` (rasoverbygg): an open-sided gallery roof instead of a full tube.
- [x] Tunnels in stages: OSRM routes and endless/free drive may go through tunnels now that they exist (keep random
      stage picks preferring open roads); pace notes and the road arrow work inside.
- [x] Bridges: check that every tagged bridge is generated, not only over water: over roads (overpasses), railways,
      valleys / gorges, and long viaducts; road under a bridge passes under its deck (no carve conflict); bridges on
      `layer=*` ways. Fix what is missing (piers in valleys, railings, deck materials by `bridge:structure` if cheap).
- [x] Tests: a tunnel through a ridge (terrain above unchanged, floor height follows the portal profile, the car drives
      through and is inside the tube), portals at load-order permutations / tile borders, an overpass bridge over another
      road (both drivable), a valley bridge. Before/after shots at real places (e.g. a short Vestland road tunnel, an
      E39 / Rv overpass, Atlanterhavsvegen's Storseisundbrua), bench cost, WebDev in Chrome.
- [x] Docs, help text (tunnels), CHANGES. Done after C+G (needs the collision rules), before D+F unless the user says otherwise.

## Next (separate plan)
- Landmarks, photo camera and photo album: tasks/plan_20261120_landmarks.md (after A–H).

## Not included unless asked
- The same place search in the live JS game (legacy-js/src/map.js has the same picker; easy to add afterwards).
- Collisions with ghost cars of other players, and new object kinds (fences, poles, rocks) that don't exist today.

## Review

### C. Obstacles + G. Minor-road speed (done 2026-11-20)
- **Survey checked first.** True: box sweep + overlap push-out, 96 tree capsules (nearest first already), per-tile
  non-convex building MeshColliders (one-sided wall quads), bridge rails on layer Buildings, 128 sign capsules, no check at
  any placement, yaw not swept, 16-overlap buffer, silent pools. Worse than listed: on 20 fps frames a car driven head-on
  (150 km/h) or sideways (100 km/h) into a house ended **inside** it (new PlayMode test, old code: 6 of 8 obstacle tests
  fail; sign post and rail held).
- **C changed:** `World/Footprints.cs` (depth of the car box in a footprint ring; separating-axis push out of the house's
  outline box), `BuildingSet.Rings`, `ISolidGround` (Core) implemented by `TileWorld` (`FootprintPush` over the coarse tiles
  within 50 m, `RefreshColliders` = tree pool now). `CarController`: `Place()` on `SetRoute` / `ResetTo` / sink recovery
  (`CarState.Resets`): refresh pools, `IsFree` (OverlapBox + footprint), else nearest free spot along the road (2 m steps,
  ±60 m); `SweepYaw` (spins > 15°/frame stepped, bisected to the first new contact); `PushOutOfHouses` (> 0.5 m deep →
  shortest way out, wall rule, no damage; shallow stays with the mesh); buffers 64. `SignLayer` acquires nearest first and
  logs a full pool once; `TreeColliderPool` logs a tree < 15 m left without a collider. Diagnostics: placement / house push
  lines, solids time per frame.
- **G cause (measured, `PreviewShots -previewMinor`, every car along the 18 longest links of each class/surface at Sauda,
  live):** all minor kinds (unclassified, residential, living_street, service, track) are fetched, graded and drawn; with a
  careful driver the car is on the road 100 % and "on the ribbon but counted off road" is 0 %. The slowdown is the edge
  rule: off road once the car's centre leaves the ribbon (3.25 m on the stage line, 3.75 m drawn, on a 4.5 m road) while
  the inside wheels are still on it, and then rough ground bleeds the car to OffroadMax (50 km/h for the 911s) at up to
  8 m/s². No damage cap, drag or grip effect bound on drawn roads. Second cause found, **not fixed** (road grading, section
  A territory): graded steps where two ways meet end to end — 20 m at E 18718 N 6642102 (ways 616529092 704.2 m /
  616529632 723.7 m, DTM 714.7 m; every car stuck at 10–20 km/h) and 6 m at E 10572 N 6643457 (517168907 / 238636705).
  Two other >100 % "steps" were the probe reading a bridge deck's top (cars there see the right surface).
- **G changed:** `CarSim`: on the road while a wheel is on the ribbon (half + shoulder + track/2 on the route; else
  `SurfaceAt` at the centre and the four wheels); `GravelMaxSpeed` 120 km/h (no drive above it on a gravel road, eased
  back at ≤ 4 m/s²). HUD tag uses the same `OnRoad`/`SurfaceKind`. Help text, unity/README, ARCHITECTURE (mermaid),
  README-world, CHANGES. After: on gravel links every car tops at 120 (736 105–107, Volvo 117–120), asphalt unchanged.
- **Frame cost** (live Sauda, `-previewDrive 60`, A/B with the old CarController + the same timer, GPU 93 % busy):
  solids work 0.053 / 0.058 → 0.067 / 0.067 ms per frame avg (+0.01 ms), max 3.0–4.9 ms either way (Physics.SyncTransforms
  after a streaming frame). Frame time avg 10.6 / 8.7 → 9.6 / 10.4 ms: noise of the busy GPU.
- **Tests:** EditMode `MinorRoadSpeedTests` (4; 3 fail on the old CarSim: Porsche 191 km/h on gravel, 224 after 12 s,
  narrow-road wheel), `FootprintTests` (5); PlayMode `ObstacleTests` (8; 6 fail on the old CarController). Gearbox and
  engine-damage tests moved to asphalt (they drove on the gravel default above 120). EditMode 230/230, PlayMode 23/23. WebDev build checked in Chrome: loads, start screen, help line, START drives, HUD (GRAVEL tag), no console errors.
- **Open:** junction steps in road grading (above); bridge rails are still one non-convex MeshCollider (a car straddling a
  rail goes to the side its centre is on); L-shaped houses push out of their outline box (can move the car further than
  the wall when deep in the notch side); `IsFree` ignores sign posts not yet in the pool (0.2 s refresh), the next frame's
  push-out frees the car.

### H. Start screen, LOG bar, Esc / MENU + I. Rename to Grand Tour Norway (done 2026-11-20)
- **Esc, checked in the real WebDev build first (Chrome, trusted key events):** Esc → start screen worked from racing
  in free drive with the canvas focused, with `document.body` focused (Unity listens on the window), after mouse-clicking
  START ENGINE and after focusing the room-code field. No fullscreen / pointer lock exists in the game. Gaps found: no
  visible way on touch screens; the only hint was the long keys line hidden behind the open log; Esc after an endless
  stage left it without animals/people (ToMenu skipped the sector plans R re-adds); Enter in the room-code field started
  the engine. Not reproducible: a phase where Esc did nothing while driving (Loading already shows the start screen).
- **Changed:** `Hud.uxml/uss` (start column in a ScrollView, logo GRAND TOUR / N O R W A Y, compact friends row, cache +
  credits footer, `.menu` hides the driving HUD, top row MENU / MAP / ? / LOG bar, `.narrow` < 900 panel units),
  `HudController` (MenuClicked, ShowStartScreen → `.menu`, status → startInfo, column min-height = viewport),
  `LogWindow` (starts minimised, LOG bar: progress + text + warnings since last open; AutoHide removed),
  `GameController` (`BackToMenu` for Esc and MENU, `ResetToStart` shared by Restart / ToMenu, `CountStreaming` /
  `StreamFraction` / `ShowProgress` every 0.25 s, Enter gated by typing, start-screen status without tile stats),
  `RallyPanel.asset` + `SceneBuilder` (match 0.5, productName), `ProjectSettings` productName, template (h1, aria,
  page footer only while loading), help text, docs.
- **Numbers:** phone 390×844: UI drawn at 0.30× before (1280-wide panel), ~0.60× now (652-wide panel). Progress in the
  web build: "START AREA 75% · terrain 4/4 · roads 2/4 · 15 queued" while loading, then "WORLD 52% · terrain 32/57 ·
  roads 18/39 · 25 fetching · 29 queued" rising while it streams (cold IndexedDB on a new origin, Overpass slow).
- **Rename / storage:** web settings are localStorage `rally.*`, the cache IndexedDB `rally-cache` (both literal names);
  the web game uses no PlayerPrefs / persistentDataPath. Verified: the cache count went on from 526 (old build) to 536–545
  items (new build) on the same origin. Editor: `persistentDataPath` moves with productName, so the 337 MB file cache
  was copied to `~/.config/unity3d/Filip Tobias Moan/Grand Tour Norway/rally-cache` (old folder left in place).
- **Checked in Chrome** (window is maximised on a 4K screen, resize_window has no effect: sizes through an iframe harness
  in the scratchpad): 1920×1080, 1512×795, 1280×720, 390×844 before/after (`scratchpad/startscreen/before_after.jpg`);
  MENU click while driving → start screen → Baja Bug card → START ENGINE drives the same stage with the buggy; page
  title "Grand Tour Norway"; no console errors. The 390 px driving view showed the LOG bar text running off the right
  edge → ellipsis fix (`.narrow .hudButtons` right bound), rebuilt and rechecked (`after_390x844_driving_top.png`).
- **Tests:** PlayMode `ControlsTests.EscWhileDrivingOpensTheMenuToChangeTheCar` (Esc while racing → start screen with
  `.menu`, other car, same stage, START drives it; MENU path from the countdown) and `LogStartsMinimisedWithAProgressBar`
  (closed from frame 1, progress rises while loading, WORLD after, bar drawn, F2 opens / minimises). Neither compiles on
  the old code (no `StartScreenVisible`, `logMini`, `IsOpen`), and the old log was open at start.
- **Open:** the START ENGINE button is shown (inactive) while loading; this Chrome reports a touchscreen, so the keys line
  and touch buttons follow `Touchscreen.current`, not width; the driving status line still shows tile stats next to the
  LOG bar; when the start roads time out (20 s) the stage starts with START AREA < 100 %. Build/Web not rebuilt (rule).

### E. Route map place search (done 2026-11-20)
- **Cause / need:** the picker only took clicks; the stedsnavn API has no type filter and returns islands, hills and
  headlands first (Hovden tettsted is hit 7 of 319, Geiranger tettsted 43 of 488 for "Gei*"), so ranking is client-side.
- **Changed:** `unity/Assets/WebGLTemplates/Rally/index.html` only (+ Hud.uxml help line, docs). START / FINISH boxes;
  one request `treffPerSide=500` with `filtrer` (~80 KB, 0.1–0.4 s), fuzzy retry only on zero hits; rank
  By/Tettsted → grend/bygdelag/bydel/… → kommune/poststed → rest, exact > prefix > API order, dedupe name+kommune,
  Norway bbox + municipality required (dropped "Ålborg"/"Ålbæk"), 12 rows. Choosing sends the existing `pick` event
  (C# snaps + `setPin`), pans/zooms (fitBounds when both pins). Map click / drag clears that box; reopening on a moved
  pin clears the stale name. Window capture key listener (registered before Unity) keeps typed keys from the game.
- **Tested (no Unity run; current Build/Web with the template rendered by hand, Chrome):** Hovden → "Hovden — tettsted,
  Bykle" first, Enter → "Start snapped 4 m onto Skisentervegen"; Bergen/Geiranger/Lillehammer/Gei/Ål/Lilehamer (fuzzy)
  rank the town first; Geiranger (mouse) + Eidsdal (Enter) snapped, map click moved the start (box cleared), GENERATE
  ROUTE loaded a 26.8 km stage (`?route=osrm:62.09342,7.21626;62.26257,7.17185;driving`); ↑↓ Enter Esc (list, then
  map); typed keys reach no window/document listener; fetch failure → "Place search failed (Failed to fetch)…" in the
  status line; 390 px wide layout stacks the boxes; no console errors.
- **Open:** the JS game's picker (legacy-js/src/map.js) has no search yet (out of scope). Hidden-tab timer throttling
  makes the 300 ms debounce slow in the automation tab only. Needs a WebDev/Web rebuild to ship.

### A. Glitches between tiles + B. Pre-generating landscape while driving (done 2026-11-20)
- **Measured first** (`PreviewShots -previewSeams`, live Sauda 59.65,6.35, 33–41 coarse + 24 fine tiles, WebGL 2 path;
  `seams/before_gl2` → `seams/final_gl2`, same places shot on the compute path in `final_compute`):
  | border | before | after |
  |---|---|---|
  | coarse/coarse shared edge, natural DTM | mean 0.75 m, p99 5.6 m, max 33 m | 0 (bit for bit) |
  | coarse/coarse shared edge, carved | mean 1.28 m, p99 10.4 m, max 342 m | max 0.002 m |
  | fine/fine shared edge, carved | mean 5 cm, max 1.37 m | 0 |
  | drawn step across a fine/coarse outline (±2 cm) | mean 0.78 m, p95 3.2 m, max 10.3 m | mean 6 mm, p99 4 cm, max 9 cm (slope over 4 cm) |
  | verge tone step at the outline | mean 0.45 | 0.000 |
  | road ribbon drawn by two tiles | 381 600 m² | 4 600 m² (overhang of border segments, not doubled) |
- **Causes and fixes:** (1) every tile's DTM is its own lat/lon WCS raster resampled to UTM → a new tile takes the edges
  and corners of loaded neighbours of its kind and feathers the difference (cosine, 4 coarse / 16 fine samples; Coons
  term at corners; diagonal neighbours too so edge neighbours never disagree) — `TileWorld.Stitch`. (2) 1 m vs 8 m DTM and
  the widened, sunk coarse carve → a 16 m blend band at bare fine outlines (heights, mask, verge tone) and a 0.5 s fade-in,
  `TerrainGround.hlsl FineWeight` with the CPU twin `TileWorld.FineWeight` (the car's `CarvedHeightAt`/`BaseHeightAt`).
  (3) the coarse carve collected segments by the unwidened reach → collect with the widened bounds. (4) house pads came
  from the parent tile only and fine tiles were not re-carved when pads arrived → pads from the 3×3 coarse tiles, re-carve
  what they reach. (5) the 342 m wall: roads graded over tiles not loaded yet read ground 0 → unknown samples hold the
  nearest known ground, the way is regraded when that ground is in, overlays wait ≤ 10 s for neighbour DTMs.
  (6) ribbons/bridges drawn by both tiles over the 60 m pad with V restarting → drawn by the tile owning the segment
  middle, V = distance along the whole way.
- **Plan items judged differently:** splat halo not needed (border colour step 0.248 vs 0.236 one texel inside); the coarse
  table already covers every loaded tile within the clipmap's 4096 m reach (the reach is shorter than the 5.6 km fog
  horizon — open point); fade-out not done: fine tiles drop only beyond 900 m, where the blended step is sub-pixel.
- **B, measured honestly:** `FrameProbe` records every real frame and the sections of each frame > 33 ms; the bench now
  reports the distribution and a per-frame "streaming work" (main-thread work minus GPU waits). The ScriptedDriver got
  stuck in town after 0–600 m, so drives use `-previewGlide` (car moved along the line at an exact speed): stage =
  OSRM Sauda→Rv520 at 90 km/h, free drive 90 km/h, Jæren OSRM at 150 km/h, 120 s each.
  Streaming work per frame (ms), WebGL 2 path, unbudgeted (`-previewBudgetMs Infinity`) → final:
  stage max 4696 → 150, p99 16.9 → 10.7, frames > 50 ms 27 → 13, avg 4.5 → 3.7; free max 3605 → 14, avg 3.1 → 2.7;
  fast max 1609 → 154, p99 49 → 42, > 50 ms 93 → 58, avg 6.4 → 4.4. Compute path stage (A state → final): max 401 → 83,
  > 50 ms 33 → 12. Every fine tile on the way was ready before the car got there (lead ≥ 5 s at 150 km/h), no coarse tile
  late. What was spread: DEM resample (lattice projection, 32-row bands), tile results under a 5 ms budget, the overlay in
  steps (grading per way, ribbon, bridges, signs, splat, water, houses, collider), re-carves queued nearest first, one
  Overpass parse per tile, CPU carve in row bands with only the segments that reach them (coarse carve 250–400 → 45 ms),
  river bounding boxes for the bridge water probe (grading 270 → few ms), a ring of compute segment buffers; normal
  stages prefetch the line 2.5 km ahead. Jobs completed later were not used: the web build has no worker threads.
- **Target not met in the editor, and why:** Chrome's GPU process held the GPU at 90–100 % during all benches, so whole
  frames show 0.4–0.5 s waits at the first GPU call and 8–20 s stalls outside our code (frame median 7.7–8.5 ms either
  way; avg frame time is ruled by those stalls and not comparable). Remaining work spikes are single Mono steps: sign face
  painting 60–150 ms (2.6 ms in the IL2CPP player per the signs lesson), `LandcoverSplat.Build` ~80 ms, sign placement
  ~60 ms, one coarse carve ~45 ms, the longest way's grading. Not spot-checked for frame times in Chrome (hidden tab).
- **Tests:** EditMode `TileSeamTests` (shared edges in any load order coarse/fine, stitch leaves the middle, fine outline
  < 2 cm, fade-in, coarse carve edge, ribbon ownership + V, grading on missing ground), `StreamingBudgetTests` (lattice
  resample ≤ 5 mm, stepped grading = at once, queued re-carves = at once and nearest first, banded carve = one job);
  PlayMode `StreamingTests` (normal stage prefetches 1 m tiles > 1 km ahead). All 15 seam/budget tests and the PlayMode
  one fail with the old behaviour injected. EditMode 214/214, PlayMode 13/13.
- **Regression found in review (fixed 2026-11-20):** the coordinator's run spawned on Rv520 next to a sawtooth cut. Cause:
  (1) `RoadGraph.HasTile` turned true when a tile's stepped grading *started*, so the free-drive start was chosen from a
  half-graded start tile; (2) a stepping overlay went to the back of the result queue after every step, so the start
  tile's 389 ways took minutes (the shot showed half-carved terrain: re-carves queued only after grading); (3) a way
  graded again (its missing ground came in) left the neighbour tiles' segments cut from the old grading — two gradings
  at one border, the carve took either: up to 20 m off depending on load order. Fixes: `HasTile` = graded to the end;
  an overlay that started stepping runs first until done; tiles cut from a replaced grading are set again
  (`RoadGraph.TakeDirtyTiles` / `Rebuild`, ribbon + bridges + re-carve); the budget is 50 ms per frame while the car waits
  (loading, start screen, countdown) and a quarter of the frame at low fps (`WorkBudget.Scale`). Start tile overlay now
  applied ~1.5 s after its data; the spawn is the same in all runs. New tests: `AnyLoadOrder_EndsInTheSameCarvedGround`
  (6 orders incl. roads before a neighbour's ground and a dropped answer; 5 failed before, ≤ 5 cm now), HasTile only when
  graded, budget scaling, start tile graded + drawn at the start screen (PlayMode). EditMode 221/221, PlayMode 13/13.
- **Open:** clipmap reach 4096 m < fog horizon 5.6 km (8th ring + 12×12 table would cover it); `LandcoverSplat.Build` and
  sign placement could be stepped too; 8–20 s editor stalls with a busy GPU unexplained (not in our sections); compute
  carve dispatch cost under GPU contention.

### J. Tunnels and bridges from the map + the junction-step bug (done 2026-11-20)
- **Checked first:** survey true (tunnels graded + carved on the mountain: Nestunnelen's road ran 20 m up over the rock,
  Trolljuvet's 20 m over its ridge). Plan items judged differently: `building_passage` stays an open road (the house over it
  is already dropped by the 8 m road clearance, a tube would stand alone in the street); no deck materials by
  `bridge:structure`; bridges over roads / valleys / `layer=*` were already generated (tag rule) — what was wrong was the
  carve under an overpass (the deck's claim left the road under it natural where the deck's centre line was nearer).
- **Junction steps — cause:** (1) `SmoothRoadHeights` shrank its window at a way's end, pulling the end towards the way's
  inside by slope × window: on the Sauda hillside one way ended 10 m above, the next 10 m below the ground at their shared
  node (synthetic repro: 447.1 / 419.4 m, a 28 m step); (2) junction easing only saw segments registered near the
  junction, but a way is graded once, in the first tile holding any of it (often one without the junction). **Fix:** ends
  pinned (odd reflection) to the ground fitted 10–30 m in (`EndGround`), a node registry (`nodeWays`, `EaseOntoNodes`:
  later ways take earlier ways' heights at shared OSM nodes in any tile), followers re-graded when a joint changes
  (`FollowAtNodes`), `Rebuild` keeps the tile's gradings, easing looks past a regraded way's own old segments, longer ways
  first within a class. Found on the way: a 32-round rebuild ping-pong at Svandalsflona (fixed: 5 rebuilds now).
- **Tunnels — what changed:** `Roads/Tunnels.cs` (kinds, straight portal-to-portal profile, subsea dip), `TunnelMesh.cs`
  (tube, arch, lamps, collar + portal face, gallery roof/wall/pillars, wall collider), `Resources/Tunnel/Tunnel.shader`
  (lamp-lit inside by vertex alpha), `RoadGraph` (Tunnel/Portal flags, tubes graded last and following their roads, portal
  height from outside, short connectors at portals, `TunnelSegmentsNear`, `RoadLayer.Tunnel`, links not barred),
  `CarveJob`/`Carve.compute`/`Carver`/`TileAtlas` (`TunnelOnly`; layer claims only within PassOver of a ground road's
  height: overpass fix; two scratch textures), `TileWorld` (`InTunnel`/`TunnelAt`, floor in HeightAt/SurfaceAt/WaterAt,
  `UpdateTunnelHoles`), `TerrainClipmap.shader` (`TunnelClip` in all passes, box early-out), `Road.shader` (UV1.y lamp
  light), `RibbonMesh`, `CameraRig.KeepInTunnel`, `GameController` (build/drop tunnels, dirty tiles until settled),
  `RoadWalk` (tunnels × 0.15), `Ground.cs` (`TunnelSpot`, `ILayeredGround.TunnelAt`), `RoadConstants` (tunnel dims, PassOver).
- **Places (live, before → after, `scratchpad/tunnels/{before,after}_*`):** Nestunnelen Rv520 (portal: road climbing 20 m
  over the rock → portal with the far end visible; chase inside the tube), Trolljuv bru + Åkrafjordvegen tunnel (gorge
  bridge on piers; road over the ridge → tunnel; first try showed a 10 m step at a 9 m connector and terrain in the mouth,
  both fixed), Svandalsflona E134 (gallery roof + tunnel; chase in a curved tube), Forusbeen overpass, Storseisundbrua.
- **Bench** (live Nestunnelen, glide 90 km/h, 90 s, compute path, GPU shared 13–40 % with other processes): streaming
  work per frame avg 3.24 → 3.27–3.33 ms, p95 3.98 → 4.4, p99 11.5 → 15, max 657 → 57 ms; frame median 7.94 → 8.2 ms;
  frame avg 15.5 → 19.8–23 ms ruled by 0.7–1.8 s GPU waits at the vegetation cull readback (present before too, not
  separable from the shared GPU; terrain hole loop now skipped outside the holes' bounding box).
- **Tests:** EditMode `TunnelTests` (tags; profile incl. subsea; ridge: mountain uncarved, floor = portal line, car ground /
  crest / beside, no step at portals; car drives through on the floor; mesh + holes only near portals; tunnel across a tile
  border in 4 load orders incl. settle checks; overpass carved + both drivable; valley bridge), `WayJoinTests` (end-to-end
  in 4 orders, road ending on another, regrade followed) — on the old code 5 of 6 join tests and the overpass test fail;
  PlayMode `TunnelPlayTests` (reset in a tunnel lands on the floor; 100 km/h sideways into the wall stays inside).
  EditMode 247/247, PlayMode 25/25.
- **For D+F (road arrow, finish banner):** `world.TunnelAt(xz, out TunnelSpot spot)` (ILayeredGround; ReferenceY NaN =
  "inside") → `Floor` (drivable surface), `Roof` (arch inside at that lateral offset), `Crown`, `Centre`, `Tangent`,
  `Lateral`, `Half`. `HeightAt` with NaN in a tube's plan is the floor, so the stage line's `Y` and anything placed with it
  is in the tube (but `StageRoute.RoadY` from `AssignRoadY` uses the natural ground: the mountain — use `Y`). Keep anything
  drawn under `Roof` − its height; the tube is lamp-lit (an emissive or Rally/Road-like material reads best).
- **Open:** a dark terrain patch still shows deep in the Svandalsflona tube from the gallery (thin cover in flat alpine
  ground; not resolved); tube profile is straight (no crest), sea depth assumed (no bathymetry); signs / animals may stand
  in tunnels; no clearance over a road under a bridge beyond what the DTM embankments give; the after run at Storseisund
  started the car on the sea because its start roads were late (Overpass mirror failures, start 20 s timeout — not
  reproduced in the before run).
- **WebDev (WebGL 2, CPU carve) in Chrome**, `?drive=59.64314,6.319` on port 8093: loads, start screen with the car in
  Nestunnelen behind it, START ENGINE → chase view in the lamp-lit tube with the far portal open, HUD shown, no console
  errors (`scratchpad/tunnels/webdev_nestunnelen_chase.jpg`). The HUD surface tag read GRAVEL there (not checked further).

### D. Road arrow + F. Finish gate + the GRAVEL tag in Nestunnelen (done 2026-11-20)
- **Checked first** (`PreviewShots -previewStage`, new: car placed on the stage line with the engine running, any camera,
  logs the car's surface, `SurfaceAt`, the arrow and the gate). Stage: OSRM Sauda → Saudasjøen through Nestunnelen
  (5.1 km, pre-seeded in the file cache). Before: no gate; the HUD arrow only; and on the stage the car read **Gravel on
  every asphalt road** (`SurfaceAt` Asphalt): the stage line's samples carry the stage default (gravel), so every stage was
  held to the gravel 120 km/h. Free drive at `?drive=59.6433,6.3185`: ASPHALT while racing, but GRAVEL during the countdown
  (a frozen car's `SurfaceKind` stayed the `Offroad` it was created with; on the road and not asphalt → GRAVEL). The tunnel
  way is `surface=asphalt` in OSM; NVDB Vegdekke has a gap over the tube (fallback to the OSM tag works).
- **Changed:** `Gameplay/RoadArrow.cs` (path along the stage line from the car's s, or a walk along the road in free drive;
  3 vertices across per 1.5 m station on the layered ground at the car's level; fades near the car, dims under decks / in
  water, ends at the finish), `Gameplay/FinishGate.cs` (layout + posts/banner on Rally/Tunnel, line paint, box colliders on
  Buildings, re-placed every 0.5 s), `Gameplay/Resources/Marks/RoadMark.shader` (blend, Offset −2/−4, no depth write, lit
  option), `GameController` (`FinishBefore`, `UpdateMarkers`, `GateS` incl. endless sector ends, chase camera ≥ 1 m over the
  car's roof, `DebugMarkers`), `CarSim` (surface from the drawn road; `SurfaceKind` set before the frozen return), HUD arrow
  removed (uxml/uss/HudController/HudSource.NoteAngle, `UI/arrow.png`, `SceneBuilder.EnsureArrowSprite`), help text, docs.
- **Found on the way:** the Ranger's chase camera (2.4 m) looked along its 2.06 m roof: no road visible for ~40 m, the arrow
  hidden at any distance on flat road and in tunnels. The rig's `ChaseUp` is now max(2.4, roof + 1 m) = 3.06 m for the Ranger.
- **Numbers:** markers cost 0.23 ms/frame avg (max 8.4 ms, the first frame) over 9 300 frames of a 90 km/h glide (Porsche and
  Ranger, live, GPU 48 % busy). Gate: posts ±4.55 m on a 2.25 m road (outside the shoulder, on the apron), banner 5.0 m up.
  Surface on the stage before/after: Gravel → Asphalt at all 12 spots (bend, hairpin, tunnel, bridge, finish).
- **Shots** (`scratchpad/arrow/`): `before_after.jpg`; full sets `before_{ranger,porsche}`, `after_ranger2`, `after_porsche`,
  `after_free` (contact.jpg in each): bend in cameras 1/2/3, hairpin, tunnel (chase/seat/overhead), approach, bridge, finish
  from 300 m / 50 m / passing under (chase + seat) and from the side.
- **Tests:** EditMode `RoadMarkerTests` (6: on the road ahead incl. slope/tilt and distances, bends the way of the pace note
  both sides, ends at the finish and fades near the car, free drive follows the road both ways, gate centred / posts solid
  and outside the carriageway / follows a regrade, under a tunnel arch), `StageSurfaceTests` (1; fails on the old CarSim:
  Offroad on the start line, Gravel after). EditMode 254/254, PlayMode 25/25.
- **Open:** the overhead camera in a tunnel shows the mountain (the arrow is under it); on a crest the arrow beyond it is
  hidden (as the road is); the gate stands where the OSRM line ends, which can be off the drawn road's centre by 1–2 m;
  the gate at an overpass finish would stand on the upper deck (it asks the top surface); the post foot heights flicker
  by ~0.5 m between refreshes at one spot (a fine tile fading in), harmless (buried) but rebuilds the mesh each 0.5 s there.
- **WebDev in Chrome** (port 8095): the OSRM stage loads, START ENGINE → countdown with the yellow arrow on the road ahead,
  the turn box reads `350 HAIRPIN LEFT` without the old arrow, tag ASPHALT during the countdown; no console errors seen.
  `?drive=59.6433,6.3185` on a cold browser cache started the car on the mountain over Nestunnelen (its roads 3/38 in at
  the start, J's open point); there it reads ASPHALT and on-road because free drive's `RoadNetworkRoute.Nearest` takes the
  tube under the car (any layer) — not fixed here (route layer awareness belongs with J's tunnel code).

