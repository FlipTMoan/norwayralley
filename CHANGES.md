# Changes

_Updated 2026-11-14._

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
