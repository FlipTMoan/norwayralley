# Changes

_Updated 2026-11-13._

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
