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
