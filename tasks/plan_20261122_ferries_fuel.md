# Plan 2026-11-22 — Unity: car ferries and fuel stations

Owner: "Is there a database of car ferries in Norway? What about gas stations? If so plan to include those in unity."

## Findings (checked live 2026-11-22)

### Car ferries: yes, three open sources that fit together

| Source | What | Count | Access |
|---|---|---|---|
| NVDB **770 Ferjesamband** | each car-ferry route as a line over the water: Navn ("Lavik - Oppedal"), Sambandstype (riks/fylke), Driftsstatus (Helårssamband…), AutoPASS for ferje | 141 | NVDB Les v4, same as signs/lights (NLOD, CORS, `X-Client`) |
| NVDB **64 Ferjekai** | each ferry quay: Navn ("Moss ferjekai"), Antall ferjelemmer, Driftsstatus, **NSR_Stopplace_ID** ("NSR:StopPlace:58092") | 379 | same |
| NVDB **974 Ferjelem** / **41 Ferjeoppstillingsplass** | the loading ramp (bridge between quay and ferry) / the queuing lanes | 401 / 310 | same |
| **Entur Journey Planner v3** (GraphQL) | live departures for a quay by its NSR id: time, destination, line ("Rv. 19 Moss-Horten", `localCarFerry`) | all | open, only an `ET-Client-Name` header, CORS `*` (tested from a localhost origin) — NLOD |
| OSM `route=ferry` + `amenity=ferry_terminal` | ferry lines and terminals (also passenger boats) | 1 700 ways / 1 153 nodes | Overpass (already used) |

NVDB is the main source (only car ferries, named, linked to Entur). OSM is not needed for ferries.

**An open gap found while checking:** OSRM driving routes **do take ferries** (Lavik → Oppedal: a 5.7 km
`mode: ferry` step). The Unity game ignores the step mode today, so a stage across a fjord would lay a "road" over
the water. This must be handled whatever the owner picks below.

### Fuel stations: yes, OpenStreetMap is the practical database

| Source | What | Count | Access |
|---|---|---|---|
| OSM `amenity=fuel` | point or outline, `name`, `brand`, fuels, `car_wash`, `opening_hours`, `automated` | 2 210 points in Norway plus outlines (≈ 9 % in a sample) | Overpass, ODbL (already credited) |
| NVDB | **no** fuel-station type (only 39 Rasteplass, 965 internal EV chargers) | — | — |
| NOBIL (EV chargers) | public charging stations | ≈ 10 000 | needs a free API key → not usable from a public web page without a proxy |

Sample Lillehammer–Hamar (94 stations): name on 90, brand on 86 (Uno-X 28, Circle K 25, YX 9, St1 9, Esso 8),
diesel/95 on ~75, car wash 37, "automated" 48.
OSM fuel stations come for free in the **existing per-tile Overpass request** (one more line in
`OverpassQuery`), so no extra request; outline ways give the forecourt shape. Overpass was at capacity during this
check (502 on two mirrors), which the game already survives: no data → no stations, never an error.

## Owner decisions needed before work starts

1. **Ferry gameplay.**
   - (a) Scenery only: quays, ramps, waiting lanes and a moored ferry. Free-drive roads end at the quay. Stages never
     cross a ferry (pick another route or reject it).
   - (b) **Recommended:** (a) plus crossing. The car drives onto the ferry, the screen fades, and it drives off on the
     far side. The crossing time is shown but not counted in the stage time. The HUD shows the next real departures
     from Entur.
   - (c) (b) but the car really sails: you see the fjord pass from the deck. This is much more work: a moving deck
     under a physics car and loading tiles along the crossing.
2. **Fuel stations.** **Recommended:** scenery only (canopy, pumps, shop box, the station's name on a pylon) plus
   a map icon. No fuel gauge. Real brand logos are trademarks, so only the name as plain text, in a neutral colour
   scheme. A fuel gauge with refuelling could come later if wanted.

## Owner answers (2026-11-22)
1. Ferries: **(b)**, drive onto the ferry. Fade, then come out at the far quay. The stage clock pauses, and the real
   Entur departures are shown.
2. Fuel: **real fuel.** The car uses fuel as it drives. It fills up only when the user **stops next to a station**
   (car at standstill on the forecourt / within ~15 m of a pump). The **gauge is on the dashboard, under the speed.**
   Defaults chosen here (the owner can change them):
   - A full tank lasts ~250 km of game driving at normal use. Use rises with throttle and speed.
   - Filling takes a few seconds, with the gauge rising.
   - When the tank is empty, the engine stalls to limp power (≤ 15 km/h) so you can still reach a station. The HUD
     says "Out of fuel: find a fuel station" and the map points to the nearest one.
   - Stages start with a full tank. Free drive keeps the level across tile loads, and it is stored with the save.

## Work (details for 1b and the fuel answer)

### Phase F0: data
- [ ] `NvdbSource.FetchFerries(bounds)`: 770 lines + 64 quays (+ 974 ramps, 41 queuing areas) with the same GeoCache
  kind "nvdb", fixtures from the live API (Moss/Horten, Lavik/Oppedal), parse tests.
- [ ] `EnturDepartures`: one GraphQL query per quay (next 3 departures), cached 60 s, `ET-Client-Name:
  grandtournorway`. Timeout or error → "no departures shown", never an error.
- [ ] `OverpassQuery`: add `nwr["amenity"="fuel"]` with `out geom` (ways) and `out center`/nodes. Parse name, brand,
  car_wash. Existing tests stay green and the cache key changes once.

### Phase F1: ferry quays (scenery)
- [ ] Quay: concrete apron where the road meets the water, at the 64 point. One ramp (974) per ferjelem, hinged
  steel deck sloping to the water. Queuing lanes (41) painted, a booth and a "Ferje" sign (NVDB sign 706 already
  comes from the signs layer where registered).
- [ ] A moored ferry at the ramp: a simple low-poly double-ended car ferry (white hull, open car deck, bridge house
  in the middle, ~100 m). One mesh, not tied to any real vessel.
- [ ] The car is stopped at the end of the ramp by a barrier (solid, like masts), so it never drives into the fjord.
- [ ] Tests: placement at the shoreline, ramp facing the 770 line, barrier collider.

### Phase F2: crossing (1b)
- [ ] Stages: read OSRM step `mode`. A `ferry` step becomes a **ferry leg** in the route, not road samples. The road
  ribbon, pace notes and arrow stop at the quay and restart on the far side.
- [ ] Free drive: at a quay with a 770 line, driving onto the ramp at low speed shows "Take the ferry to
  Oppedal? (next departure 14:30)". Yes → fade out, move the car to the far quay (other end of the 770 line, facing
  off the ramp), load tiles there, fade in.
- [ ] Stage timer pauses during the crossing. The results show "Ferry Lavik–Oppedal 20 min (not counted)".
- [ ] Share link and map: the ferry line drawn dashed on the map.
- [ ] Tests: OSRM fixture with a ferry step → two road parts and one leg; crossing moves the car to the far quay;
  timer paused.

### Phase F3: fuel stations
- [ ] Placement: outline way → forecourt from the polygon. Point → a 30 × 20 m forecourt beside the nearest road,
  turned to face it. Skip when there is no road within 60 m, or when it is inside a building or on a bridge or tunnel.
- [ ] Model: flat canopy on 4 posts with a white light underside, 2–4 pump islands, a shop box behind (reuse the
  building material), and a pylon with the name as plain text. Asphalt forecourt in the road material, flush with the
  road (graded like a junction).
- [ ] Solid: pumps, canopy posts and pylon as PropColliderPool capsules. The forecourt is drivable.
- [ ] Verges/trees/lights: no plants on the forecourt (add it to the verge "nothing grows" mask and Footprints).
- [ ] Map icon. Tests: polygon/point placement, no overlap with the road, colliders, verges cleared.
- [ ] **Fuel model:** `FuelTank` (litres, use per km from throttle and speed, empty → limp power cap in the
  drivetrain). Refuelling when speed < 0.5 km/h within ~15 m of a station's pump island. Tests: use over distance,
  limp when empty, refuel only when stopped near a station, not while moving past it.
- [ ] **Gauge:** a small bar or needle on the dashboard under the speed (same style as the speed box, in the
  phone layout too). Low-fuel warning at 15 %. Help text explains filling up.

### Phase F4: check and docs
- [ ] EditMode + PlayMode green. WebDev build in Chrome at Moss ferjekai (`?drive=59.4318,10.6590`),
  Lavik (`?drive=61.1036,5.5050`), and a fuel station in Lillehammer, with no console errors and frame time within
  +10 %.
- [ ] README (help text: ferries), README-world, ARCHITECTURE (new sources: Entur), CHANGES, credits ("Departures:
  Entur (NLOD)").

## Order
F0 → F1 → F3 (fuel is independent and small) → F2 (the crossing touches the stage route, so it is the riskiest)
→ F4. F1 + F0 fix the "road over the water" gap only if stages with ferries are rejected until F2 is in. Do that
small guard first in any case.
