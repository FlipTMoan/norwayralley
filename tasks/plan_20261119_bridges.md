# Bridges where roads cross water (Unity) — 2026-11-19

User: "the rendering should generate bridges when roads are marked across water".
Today neither the Unity nor the JS game knows bridges: the road is carved into the DTM like any other road,
so over water it dips to the DTM water surface (or the water collider catches the car).

## Which spans are bridges
- [x] OSM way tags `bridge=yes|viaduct|...` (RoadWay.Tags, Geo/Osm/OverpassSource); `layer` is kept in the tags but not used.
- [x] Fallback: a road stretch crossing an OSM/N50 water polygon (Water.cs) without a bridge tag counts too
      (data gaps), with a minimum span; culverts (`tunnel=culvert`) stay plain road. (OSM lakes/rivers + DTM sea; `ford=*` never.)

## Road profile
- [x] Bridge spans: profile = straight/gently arched line between the two abutment heights
      (RoadGraph grading; StageRoute.AssignRoadY untouched, its Y is not used for the ground), never down to the water; clearance above the water level.
- [x] Carve (Carver / CarveJob / Carve.compute / RoadCarveData): do not carve or fill under a bridge span;
      ramps blend at the abutments. (The span is a DeckOnly segment that wins cells by distance and leaves them natural.)

## Geometry and physics
- [x] Deck mesh (own BridgeMesh, the ribbon stays on top: deck slab with thickness), railings/guard rails,
      piers down to the water/ground every ~25-40 m; ~~tarmac/wood/concrete look from `surface`/`bridge:structure`~~ (all concrete + steel rail for now).
- [x] ~~Deck MeshCollider on the road layer~~ the car's ground is IGround, so `TileWorld.HeightAt` answers the deck (by the
      car's own height, `ILayeredGround.ReferenceY`); railings and piers collide (MeshCollider, layer Buildings); `WaterAt` dry on the
      deck, wet under it (the water trigger colliders sit at the water surface, metres under the deck).
- [x] Trees/scatter excluded on the deck footprint (mask 128 under the deck).

## Gameplay
- [ ] Pace notes may call "over bridge" (optional, check PaceNotes.cs conventions). Not done.

## Verification
- [x] EditMode tests: tag detection, water-crossing fallback, profile never below water + clearance, no carve under span.
- [x] ~~PlayMode~~ EditMode (CarSim on a real TileWorld + RoadGraph, the same code path): car drives across a bridge over a sound without water contact.
- [x] Screenshots at a real crossing near the test area; web build boots.
- [x] Docs: CHANGES.md, unity/README-world.md, ARCHITECTURE.md.

Runs after the polish agent (same files: carve, ribbon, GameController; one Unity instance).

## Review (2026-11-20)
- Done as planned except: no deck MeshCollider (the car's ground is `IGround`; `TileWorld.HeightAt` answers the deck by
  the car's own height via `ILayeredGround.ReferenceY`), all decks concrete, no pace note for bridges, StageRoute's own Y
  untouched (not used for the ground).
- Carve: abutment clip flags were tried first and failed the test (earlier segments' end caps still filled the river);
  the span is now a `DeckOnly` carve segment that wins cells by distance and leaves them natural (see lessons).
- Extra, found on the way: the road meeting a bridge left a 5 m gravel gap (`Covered` by the deck's way); quay roads
  over DTM sea cells were graded under the sea plane with sea canals carved along them (`RoadGraph.MinGradeGround`).
- Verified: EditMode 196/196 (+10 `BridgeTests`), PlayMode 12/12; live before/after shots at Nordelv / Storelv /
  Solbrekk bru and the Sand harbour roads; road survey and bench before/after (CHANGES.md); WebDev build checked in Chrome.
- Open: a way is graded once with the water known at that moment; `HeightAt` without a reference height answers the
  deck; untagged spans only where OSM / the DTM sea says water; other end-to-end way joints may still leave a gravel gap.
