# Retro Norway Rally

A browser arcade rally game on a real 1 m Norwegian terrain model: the
Preikestolen (Lysefjorden) DTM from Kartverket. Low-poly PS1-style visuals,
drift-heavy arcade physics, generated rally stages, a 3D topo-map route
builder, and real-road routing through OSRM.

## Run it

```bash
npm install
npm run dev
```

Open the address Vite prints (usually <http://localhost:5173>). Click
**START ENGINE** (or press Enter) after the mountain has loaded.

Production build:

```bash
npm run build
npm run preview
```

## Controls

| Key | Action |
| --- | --- |
| `W` / `↑` | Throttle |
| `S` / `↓` | Brake / reverse |
| `A` `D` / `←` `→` | Steer |
| `Space` | Handbrake (drift) |
| `R` | Restart the stage |
| `N` | Scout a new stage |
| `C` | Toggle chase / bonnet camera |
| `M` | Mute sound |
| `Esc` | Close the route builder |

Touch controls appear automatically on narrow screens.

## Make your own route

1. Click **ROUTE BUILDER** in the STAGE panel.
2. The terrain is draped with the Kartverket topo map from the bundled
   `3d_terrain` scene, so roads and trails are visible.
3. Click the **start** point, then the **finish** point. The game asks OSRM
   for a route immediately.
4. Choose the OSRM profile first if needed: **foot**, **cycling**, or
   **driving**. Foot is the default because public roads do not cross the
   Preikestolen plateau; the mapped hiking trails do.
5. If OSRM cannot find a usable route, read the status line (it reports how
   far OSRM had to snap each point) and press **OFF-ROAD ROUTE** to build a
   stage with the game's own A* router instead.

Map camera controls:

- drag with the left mouse button to orbit,
- drag with the right mouse button to pan,
- use the mouse wheel to zoom,
- click without dragging to place A or B.

The builder rejects clicks in the fjord and on cliff faces. Every finished
stage still gets a level start pad, whichever router produced it.

### Why OSRM sometimes fails here

The demo tile is only 2 km across and sits on a mountain plateau. The nearest
public road for driving is roughly 2 km outside the tile, so the **driving**
profile will usually fail with a snap-distance message. The **foot** profile
can use the Preikestolen trails; its nearest mapped node may still be a few
hundred metres from the point you tapped, which the status line tells you.
Routes that leave the tile are rejected, because the car has no terrain out
there.

## What is in the game

- **Real terrain**: `public/terrain/scenes/preikestolen/dtm_1m.tif` is read in
  the browser with `geotiff.js`; the 2000 × 2000 grid is reduced to a 512 × 512
  height field shared by the renderer, collision, camera and minimap.
- **3d_terrain scene catalog**: the game reads
  `public/terrain/scenes/index.json` and each scene's `scene.json` /
  `index.json`, then loads its DTM and optional `basemap_kv_topo.jpg`. Open
  another scene with `?scene=<name>`.
- **3D topo-map route builder**: pick two points on the draped Kartverket map,
  rotate/pan/zoom the camera, and let OSRM or the off-road A* router build the
  stage.
- **Flat start pad**: the start of every stage is levelled and blended into the
  mountain, so the car never spawns on a sideways slope or rolls away during
  the countdown.
- **Arcade physics**: a custom height-field vehicle model with lateral grip,
  handbrake slides, gravity, airtime, soft tile edges and dust.
- **Stage generation**: A* over a drivability grid prefers gentle ground and
  avoids cliffs; the road ribbon, marker posts and gates are draped onto the
  terrain.
- **OSRM routing**: the route builder and the advanced **OSRM ROAD ROUTER**
  panel can fetch real OpenStreetMap roads/trails. Snap distances, degenerate
  routes and routes outside the tile are reported instead of silently making a
  bad stage.
- **Game loop**: countdown, stage timer, best time in `localStorage`, progress
  bar, wrong-way warning, finish gate, results screen and restart.
- **Retro presentation**: render at reduced resolution, then quantise colour,
  dither, add scanlines and vignette in `src/retro.js`.

## Build a new scene with 3d_terrain

The bundled `3d_terrain` builder can package any place in Norway into the same
folder format the game already uses. Install its Python requirements once:

```bash
python3 -m pip install -r 3d_terrain/requirements.txt
```

Then build a scene (latitude, longitude, optional name/title/radius):

```bash
npm run scene -- 58.98634 6.19051 --name preikestolen --title "Preikestolen (demo)"
# or directly:
python3 scripts/build-scene.py 59.0 6.2 --name lysebotn --title "Lysebotn"
```

The wrapper calls `3d_terrain/viz3d.py` with `--site public/terrain`, writes
the DTM, topo basemap, `scene.json` and `scenes/index.json` catalog, and prints
the `?scene=<name>` URL. Open that URL to drive the new place.

Kartverket's height WCS was returning HTTP 500 when this was written, so the
builder's terrain download may fail until the service recovers. The existing
Preikestolen scene is self-contained and does not need the network.

## Project layout

```
index.html                 UI shell and HUD markup
src/main.js                renderer, game loop, cameras, route builder, HUD
src/terrain.js             GeoTIFF loading, height field, terrain/basemap, minimap
src/stage.js               A*, route sampling, OSRM, road/gate visuals
src/car.js                 car model and arcade physics
src/retro.js               PS1-style post-processing
src/audio.js               synthesized engine/wind/gravel/skid audio
src/geo.js                 UTM 33N conversion and small math helpers
scripts/build-scene.py     wrapper for the 3d_terrain scene builder
public/terrain/scenes/     scene catalog + Preikestolen DTM/topo map
public/vendor/geotiff.js   vendored GeoTIFF reader
3d_terrain/                bundled 3d_terrain viewer and python builder
```

`window.__rally` exposes the live scene, camera, terrain, car, route, phase,
stage time, route builder state, `generateRoute`, `fetchOsrm` and
`screenFromWorld` for debugging in the browser console.

## Credits

- Terrain: **Kartverket NHM DTM 1 m**, CC BY 4.0.
- Topo basemap: **Kartverket** open topographic map, CC BY 4.0.
- Routing: **OSRM** / **OpenStreetMap** contributors.
- Scene packaging: the bundled **3d_terrain** project.
- Built with **Three.js** and **Vite**.
