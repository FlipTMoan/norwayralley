# Retro Norway Rally: V3 Technical Plan

This roadmap covers the technical implementation for a massive open-world rally game covering the entirety of Norway (inspired by the scale of `https://pcmoan70.github.io/3d_terrain`). It includes dynamic Level of Detail (LOD) for the terrain, edge smoothing, and an advanced arcade-sim vehicle controller with jumping, multi-gear transmission, and realistic handling.

## Phase 1: Advanced Car Physics, Gears & Feel

To get a satisfying, weighty driving feel, we will use a full 3D physics engine (Cannon-es or Ammo.js) with a custom tire friction model and transmission.

### Checkpoint 1.1: Three.js & Physics Boilerplate
* **Goal:** Initialize the 3D rendering and physics worlds.
* **Tasks:**
  * Set up a Three.js scene, camera, and lighting.
  * Initialize a physics world with standard gravity (e.g., -9.81 m/s²).
  * Sync the Three.js mesh positions with the physics bodies inside your animation loop.

### Checkpoint 1.2: Enhanced Driving Feel & Weight Transfer
* **Goal:** Create a responsive car that feels grounded and reacts to terrain.
* **Tasks:**
  * Implement `RaycastVehicle` for independent wheel suspension.
  * **Tire Friction:** Implement a slip-based friction curve (like the Pacejka Magic Formula) so the car can drift slightly on gravel but grips on asphalt.
  * **Weight Transfer:** Lower the center of mass to prevent constant flipping, but allow the chassis to lean into corners and pitch forward when braking.
  * Tune suspension stiffness, damping, and travel distance to handle rugged Norwegian trails.

### Checkpoint 1.3: Transmission & Multi-Gear System
* **Goal:** Give the player a realistic sense of speed and acceleration.
* **Tasks:**
  * Implement an engine RPM calculation based on wheel speed and current gear ratio.
  * Create an array of gear ratios (e.g., Reverse, 1st through 6th gear).
  * Apply torque based on the current gear (high torque/low speed in 1st gear; low torque/high speed in 6th gear).
  * Add logic for automatic shifting at the RPM redline, or manual shifting via player inputs (Shift/Ctrl keys).

### Checkpoint 1.4: Jump Mechanics
* **Goal:** Allow the car to launch into the air off ramps or bumps.
* **Tasks:**
  * Listen for a "Jump" input (e.g., Spacebar).
  * Check if the wheels are currently touching the ground.
  * Apply a vertical impulse to launch the car, ensuring the suspension absorbs the heavy landing.

## Phase 2: Route Selection & OSRM Integration

Players need to pick any two points in Norway and get real-world road data.

### Checkpoint 2.1: 2D Leaflet Map UI
* **Goal:** Create an overlay for route selection.
* **Tasks:**
  * Add a 2D HTML/CSS overlay using Leaflet.js centered on Norway.
  * Implement a click handler to drop a "Start" marker and an "End" marker.
  * Add a "Generate Route" button that hides the 2D map.

### Checkpoint 2.2: OSRM Routing & Waypoint Conversion
* **Goal:** Fetch the route and prepare it for 3D.
* **Tasks:**
  * Fetch route data from the OSRM API using the pin coordinates.
  * Parse the GeoJSON LineString into an array of latitude/longitude pairs.
  * Convert the lat/lon pairs into Three.js local Cartesian coordinates (X, Z).

## Phase 3: "All of Norway" Terrain LOD & Edge Smoothing

To render the entirety of Norway without crashing an 8GB GPU, the terrain must stream in data dynamically, similar to `https://pcmoan70.github.io/3d_terrain`.

### Checkpoint 3.1: Chunk Management System (Quadtree)
* **Goal:** Load the massive map in chunks, keeping high detail only near the car.
* **Tasks:**
  * Fetch Digital Elevation Model (DEM) data dynamically based on the car's GPS coordinates.
  * Implement a Quadtree system with LOD zones:
    * **LOD 0 (Center):** 1-meter resolution heightmap (Immediate driving area).
    * **LOD 1 (Midground):** 10-meter resolution heightmap.
    * **LOD 2 (Background):** 50-meter resolution heightmap (Distant mountains).
  * Load and unload terrain chunks dynamically as the car drives across the country.

### Checkpoint 3.2: Edge Smoothing (Vertex Stitching)
* **Goal:** Prevent gaps and sharp cliffs where different LOD chunks meet.
* **Tasks:**
  * Implement a "skirt" around the edges of terrain planes (dropping edge vertices down) to hide minor gaps.
  * Write a vertex interpolation script that averages the height of edge vertices between the 1m, 10m, and 50m chunks.
  * Update the physics `Heightfield` to match these smoothed vertices so the car drives smoothly over chunk borders.

### Checkpoint 3.3: Carving the Road
* **Goal:** Flatten the high-resolution terrain slightly where the road goes.
* **Tasks:**
  * Take the converted 3D waypoints from Phase 2.
  * Sample the height of the terrain at those coordinates.
  * Modify the `LOD 0` (1-meter) heightmap vertices along the path to create a smooth, drivable surface.