# Retro Norway Rally: Project Plan

This roadmap is split into two main phases. Phase 1 focuses on building a fun, retro-style driving experience in isolation. Phase 2 focuses on connecting that car to your 3D terrain and dynamic routing system.

## Phase 1: Retro Car & Physics

The goal here is to build a fun, arcade-style driving controller using Three.js and a lightweight physics engine (like Cannon-es or Ammo.js). For a "retro" feel, we want snappy, drift-heavy physics and a low-poly or pixel-filtered aesthetic.

### Checkpoint 1.1: The Test Environment
*   **Goal:** Set up a basic Three.js scene to act as your sandbox.
*   **Tasks:**
    *   Initialize a Three.js scene with a basic flat plane (the "ground").
    *   Set up a camera with a lower resolution or pixelation shader to get that PS1/Retro look.
    *   Add basic lighting.
*   **Open Code Test:** You should be able to open the browser and see a flat, retro-styled grid.

### Checkpoint 1.2: Basic Vehicle Setup
*   **Goal:** Introduce a car model and basic physics.
*   **Tasks:**
    *   Import a simple, low-poly car model (GLTF/GLB).
    *   Initialize your physics engine (e.g., Cannon.js `RaycastVehicle`).
    *   Map keyboard inputs (WASD or Arrow Keys) to engine force and steering angles.
*   **Open Code Test:** You can drive a blocky car around a flat plane. It might feel floaty or wrong, but the inputs work.

### Checkpoint 1.3: Retro Arcade Tuning
*   **Goal:** Make the driving feel like a retro rally game (Sega Rally, Colin McRae).
*   **Tasks:**
    *   Tweak friction, suspension stiffness, and vehicle mass.
    *   Implement basic drifting/sliding mechanics by lowering lateral friction at high speeds.
    *   Add a follow camera that trails smoothly behind the car.
*   **Open Code Test:** The car handles like an arcade racer on a flat surface. You can drift, accelerate, and brake smoothly.

---

## Phase 2: Terrain Mapping & Routing

With the car feeling good, it is time to bring in the Norway terrain and the dynamic routing API. 

### Checkpoint 2.1: Terrain Integration
*   **Goal:** Load the 3D terrain into your driving scene.
*   **Tasks:**
    *   Adapt the terrain loading code from the `3d_terrain` viewer into your Three.js project.
    *   Ensure the terrain has collision data (a physics heightfield) so the car can drive on it without falling through.
*   **Open Code Test:** You can spawn your retro car on the 3D mountains of Norway and drive off-road over the bumps and hills.

### Checkpoint 2.2: OSRM Routing Implementation
*   **Goal:** Fetch a real-world route between two points.
*   **Tasks:**
    *   Create a simple UI where a user can click two points on the terrain, or input two coordinates.
    *   Write a JavaScript `fetch()` call to the Open Source Routing Machine (OSRM) API using those coordinates.
    *   Parse the returned GeoJSON into an array of $X$ and $Z$ coordinates.
*   **Open Code Test:** When you select two points, your console successfully logs the array of coordinates representing the road.

### Checkpoint 2.3: Snapping the Road to 3D
*   **Goal:** Turn the flat 2D route into a 3D path over the mountains.
*   **Tasks:**
    *   Loop through the route coordinates and use Raycasting (pointing down from the sky) to find the exact $Y$ (elevation) value of the terrain at each point.
    *   Generate a Three.js visual line (or a road mesh) connecting these updated $(X, Y, Z)$ points.
*   **Open Code Test:** A visible road ribbon accurately hugs the mountainous terrain from Point A to Point B.

### Checkpoint 2.4: The Game Loop
*   **Goal:** Tie it all together into a playable loop.
*   **Tasks:**
    *   Spawn the player's car at the first coordinate of the route.
    *   Set the finish line at the last coordinate.
    *   Add a timer and a basic UI.
*   **Open Code Test:** You can select a route, spawn at the start, drive your retro car along the generated road, and cross the finish line to see your time.