# Bridges where roads cross water (Unity) — 2026-11-19

User: "the rendering should generate bridges when roads are marked across water".
Today neither the Unity nor the JS game knows bridges: the road is carved into the DTM like any other road,
so over water it dips to the DTM water surface (or the water collider catches the car).

## Which spans are bridges
- [ ] OSM way tags `bridge=yes|viaduct|...` (RoadWay.Tags, Geo/Osm/OverpassSource); keep `layer`.
- [ ] Fallback: a road stretch crossing an OSM/N50 water polygon (Water.cs) without a bridge tag counts too
      (data gaps), with a minimum span; culverts (`tunnel=culvert`) stay plain road.

## Road profile
- [ ] Bridge spans: profile = straight/gently arched line between the two abutment heights
      (ProfileGrader / StageRoute.AssignRoadY), never down to the water; clearance above the water level.
- [ ] Carve (Carver / CarveJob / Carve.compute / RoadCarveData): do not carve or fill under a bridge span;
      ramps blend at the abutments.

## Geometry and physics
- [ ] Deck mesh (RibbonMesh gets a bridge section: deck slab with thickness), railings/guard rails,
      piers down to the water/ground every ~25-40 m; tarmac/wood/concrete look from `surface`/`bridge:structure` if present.
- [ ] Deck MeshCollider on the road layer so the car drives on it; railings collide; water collider
      must not trigger under the deck (car only "in water" when below the deck and off it).
- [ ] Trees/scatter excluded on the deck footprint (already off roads, check bridges).

## Gameplay
- [ ] Pace notes may call "over bridge" (optional, check PaceNotes.cs conventions).

## Verification
- [ ] EditMode tests: tag detection, water-crossing fallback, profile never below water + clearance, no carve under span.
- [ ] PlayMode: car drives across a fake bridge over fake water without water contact.
- [ ] Screenshots at a real crossing near the test area; web build boots.
- [ ] Docs: CHANGES.md, unity/README-world.md.

Runs after the polish agent (same files: carve, ribbon, GameController; one Unity instance).
