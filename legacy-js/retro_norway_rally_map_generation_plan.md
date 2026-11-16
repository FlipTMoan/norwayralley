# Retro Norway Rally: Map & Terrain Generation Plan

This roadmap focuses entirely on the environment systems: allowing a user to pick two points in Norway, fetching the route, and generating a seamless 3D corridor combining high-resolution (1-meter) and low-resolution (10-meter) terrain data.

## Phase 1: Route Selection & Waypoint Processing

Before building the 3D map, the system needs to know exactly where the player is going and convert real-world GPS data into usable 3D coordinates.

### Checkpoint 1.1: 2D Route Picker (Leaflet.js)
* **Goal:** Create a simple 2D map UI for the player to select their start and end points.
* **Tasks:**
  * Embed a 2D Leaflet.js map centered on Norway.
  * Add click events to drop a "Start" (Point A) and "End" (Point B) marker.
  * Trigger the map generation script when both points are placed.

### Checkpoint 1.2: OSRM Routing API
* **Goal:** Get the exact road path between the two points.
* **Tasks:**
  * Send the Point A and B coordinates to the OSRM API (or a Norwegian specific routing API).
  * Parse the returned GeoJSON LineString to extract the array of latitude/longitude waypoints that make up the road.

### Checkpoint 1.3: Coordinate Projection
* **Goal:** Convert spherical GPS coordinates into a flat 3D grid.
* **Tasks:**
  * Pick a center point for your 3D scene (usually the middle of the route).
  * Convert the lat/lon waypoints into local `(X, Z)` Cartesian coordinates using a projection formula (like Web Mercator to local meters).

## Phase 2: Terrain Data (DEM) Acquisition

Norway provides excellent open data through Kartverket (The Norwegian Mapping Authority). We will use this to get the elevation heights.

### Checkpoint 2.1: Defining the Corridor Bounding Boxes
* **Goal:** Figure out exactly what map areas need downloading.
* **Tasks:**
  * **Inner Box (1m resolution):** Calculate a tight bounding box/buffer along the route waypoints (e.g., 200 meters wide on each side of the road).
  * **Outer Box (10m resolution):** Calculate a massive bounding box covering the entire visual horizon around the route (e.g., 5 kilometers wide).

### Checkpoint 2.2: Fetching Elevation Data
* **Goal:** Download the heightmaps for the chosen area.
* **Tasks:**
  * Query the elevation API/WCS (Web Coverage Service) for the 1-meter DEM data inside the Inner Box.
  * Query the API for the 10-meter DEM data inside the Outer Box.
  * Parse the returned data (often GeoTIFF format) into 2D arrays of height values in JavaScript.

## Phase 3: 3D Mesh Generation & Stitching

This is the core of the engine: turning data into a seamless 3D world in Three.js without crashing the browser.

### Checkpoint 3.1: Dual-Resolution Mesh Creation
* **Goal:** Build the raw geometry.
* **Tasks:**
  * Create a high-density `PlaneGeometry` for the 1-meter inner corridor.
  * Create a low-density `PlaneGeometry` for the 10-meter outer scenery.
  * Modify the `Z` (or `Y`) vertices of both meshes using the height arrays fetched in Phase 2.

### Checkpoint 3.2: Edge Smoothing & Vertex Stitching
* **Goal:** Prevent ugly gaps, holes, or cliffs where the 1-meter map touches the 10-meter map.
* **Tasks:**
  * Identify the boundary vertices on the outer edge of the 1-meter mesh.
  * Identify the closest corresponding vertices on the inner edge of the 10-meter mesh.
  * **Interpolation:** Write a script that forces the 10-meter edge vertices to snap exactly to the heights of the 1-meter edge vertices, creating a completely solid, sealed landscape.

## Phase 4: Road Carving & Texturing

Finally, making the terrain look like a real place and ensuring the road itself is flat enough to drive on later.

### Checkpoint 4.1: Road Flattening
* **Goal:** Smooth out the bumpy terrain exactly where the road goes.
* **Tasks:**
  * Iterate over the `(X, Z)` waypoints of the road.
  * Find the corresponding vertices on the 1-meter mesh.
  * Average/flatten the height of these vertices and the immediate surrounding vertices to create a smooth, drivable path, simulating road grading.

### Checkpoint 4.2: Satellite Texturing
* **Goal:** Paint the terrain with real-world satellite imagery.
* **Tasks:**
  * Fetch aerial orthophotos for the bounding boxes.
  * Create a `MeshBasicMaterial` (or standard material) using the imagery.
  * Apply UV mapping so the satellite texture lines up perfectly with the mountains and valleys of the meshes.