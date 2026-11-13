# Retro Norway Rally: V5 World Generation & Physics Plan

This roadmap covers fetching the map route, managing infinite 3D terrain, populating the world with trees and buildings using real-world data, and fixing the terrain collision so the car drives solidly on the ground.

## Phase 1: Route Selection & Segmentation (The 5km Fix)
* **Goal:** Create a UI for the player to select start/end points and break the route into <5km segments.
* **Tasks:**
  * Embed a Leaflet.js map to drop "Start" and "End" markers.
  * Divide the straight line into 4km intermediate waypoints.
  * Send segmented requests to the OSRM API to get the GeoJSON road coordinates.
  * Merge all returned coordinates into one master track array.

## Phase 2: Dynamic Terrain Chunking & Elevation
* **Goal:** Create a grid system that loads 3D data only for the area around the car.
* **Tasks:**
  * Define a "Chunk" size (e.g., 2km x 2km).
  * Fetch 1-meter DEM data (from Kartverket) for the active chunk.
  * Dispose of chunks that are far behind the car to save VRAM.

## Phase 3: Road Flattening & Physics Sync (The "Phasing" Fix)
* **Problem:** The car visually phases through the ground because the visual 3D mesh was flattened for the road, but the invisible physics collision mesh was not updated to match.
* **Goal:** Ensure the physics engine and the graphics engine are using the exact same terrain data.
* **Tasks:**
  * **Visual Mesh:** Flatten the Three.js `PlaneGeometry` vertices along the road waypoints.
  * **Physics Sync:** Take that *newly flattened* array of heights and feed it directly into the Cannon-es `Heightfield` shape. 
  * **Update Physics World:** Remove the old terrain collision body and add the new one every time a chunk loads.
  * **Anti-Tunneling:** If the car is moving too fast and falling through, decrease the physics time step (e.g., update Cannon-es at `1/120` instead of `1/60`) and increase the raycast suspension stiffness.

## Phase 4: Procedural Nature with InstancedMesh
* **Reference Source:** Use the [Kenney Nature Kit (Free, CC0)](https://kenney.nl/assets/nature-kit) for perfect low-poly, retro-style pine trees and rocks.
* **Goal:** Render thousands of trees smoothly.
* **Tasks:**
  * Download the `.GLTF` format trees from Kenney.nl.
  * Create a `THREE.InstancedMesh` for the pine tree model to draw thousands of copies in a single draw call.
  * **Placement Math:** Pick random `(X, Z)` coordinates in the chunk. If the distance to the nearest road waypoint is less than 6 meters, cancel the tree (keep the road clear).
  * Snap the tree's `Y` coordinate to the updated terrain `Heightfield`.

## Phase 5: Procedural Real-World Buildings
* **Reference Source:** Use the [OpenStreetMap Overpass API](https://overpass-api.de/) to fetch real building coordinates.
* **Goal:** Place retro houses exactly where they exist in real life.
* **Tasks:**
  * When a chunk loads, query the Overpass API: `node["building"](bbox);way["building"](bbox);` passing in the chunk's latitude/longitude boundaries.
  * Parse the JSON response to get the center coordinates of each building footprint.
  * Use a retro house model (also available on Kenney.nl) and place it using `InstancedMesh` at those coordinates, snapping the height to the terrain.