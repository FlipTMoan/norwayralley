# Retro Norway Rally

A browser arcade rally game on real 1 m Norwegian terrain: the bundled
Preikestolen (Lysefjorden) DTM from Kartverket, plus on-demand worlds generated
anywhere in Norway straight from the national height model. Low-poly
PS1-style visuals, drift-heavy arcade physics, generated rally stages, a 3D
topo-map route builder, and real-road routing through OSRM.

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
| `Space` | Jump (when the wheels are on the ground) |
| `Shift` | Handbrake (drift) |
| `Q` / `E` | Manual gear down / up (switches the gearbox to manual) |
| `G` | Toggle automatic / manual gearbox |
| `R` | Restart the stage |
| `N` | Scout a new stage |
| `1` / `2` / `3` | Camera: straight above / chase / driver's seat (`C` cycles) |
| `M` | Mute sound |
| `F3` | Toggle the debug/performance overlay |
| `Esc` | Close the route builder or the 2D map |

Touch controls appear automatically on narrow screens.

## Debugging a freeze or a slow machine

The game logs to the browser console and keeps a rolling history:

- `?log=debug` — verbose logging (boot timings, terrain rebuilds, long frames).
- `?debug=1` or `F3` — on-screen FPS/frame-time/draw-call/chunk/LOD overlay.
- `__rally.dumpLog()` — print the last 800 log lines from the console.
- `__rally.perf` — live frame monitor; `__rally.terrainStats()` — chunk and LOD counts.

If the frame rate stays under 24 fps for 1.5 s, the game automatically lowers
the render scale, disables the larger shadow map and shows a toast. Long
frames are logged with their duration so a hitch can be told apart from a
genuinely frozen tab.

For the network/LAN launch (`npm run dev -- --host`), the same diagnostics work
from the other device's browser console. If it still looks frozen, check the
console for the boot timings first: the shader warm-up reaches "Warming up
shaders and shadows…" on the loading screen and is the slowest one-time step.

## Make your own route

Two pickers are available:

- **ROUTE BUILDER** — the 3-D topo-map picker described below.
- **2D MAP** — a full Leaflet/OpenStreetMap picker covering the whole country.
  Click a start and a finish **anywhere in Norway**, choose `driving`, `cycling`
  or `foot`, and press **GENERATE ROUTE**. The game asks OSRM for the road,
  then either drives it on the loaded terrain or generates a new world around
  it. **USE CURRENT STAGE** seeds the map with the active stage's endpoints.

### Drive anywhere in Norway

When the chosen route does not fit the loaded world, the 2D map generates one:

1. The route's bounding box is measured and padded by roughly 500 m of horizon.
2. A square world is requested from Kartverket's national 1 m DTM through its
   CORS-enabled WCS (`nhm_dtm_topo_25833`), resampled to a height grid of
   384–900 samples (~6 m cells). The download and parsing happen in the
   browser with the vendored `geotiff.js`.
3. The old terrain, car, water, vegetation, road and distant peaks are torn
   down, and the new height field becomes the world shared by rendering,
   physics, the minimap and road carving.
4. The OSRM route is projected with a local equirectangular projection anchored
   at the route centre, the start pad and road are carved into the height
   field, and the chunked LOD mesh is rebuilt once from the final heights.

A generated world can be at most **6 km across**; longer routes are rejected
with a message asking for closer points (the road may be longer than the
world, as long as it stays inside it). Terrain remains vertex-coloured — there
is no orthophoto texturing, so the retro low-poly style is unchanged. Sea and
edge nodata are treated as height 0.

Generated worlds are not cached between reloads; they are rebuilt from the
national DTM each time. The baked Preikestolen scene still loads instantly and
works offline.

### 3D route builder

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

The baked demo tile is only 2 km across and sits on a mountain plateau. The
nearest public road for driving is roughly 2 km outside it, so **driving** on
the demo world usually fails with a snap-distance message — but the 2D map can
now generate a world around that road instead. The **foot** profile can use the
Preikestolen trails; its nearest mapped node may still be a few hundred metres
from the point you tapped, which the status line tells you. The 3D route
builder still works only inside the loaded world.

## What is in the game

- **Real terrain**: `public/terrain/scenes/preikestolen/dtm_1m.tif` is read in
  the browser with `geotiff.js`; the 2000 × 2000 grid is reduced to a 512 × 512
  height field shared by the renderer, collision, camera and minimap.
- **Generated worlds**: from the 2D map, the national Kartverket DTM is
  downloaded live and turned into a height field of 384–900 samples for a
  square world up to 6 km across, anywhere in Norway.
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
- **Arcade-sim vehicle**: raycast suspension with spring/damper body bounce,
  weight transfer, a Pacejka-style slip curve for lateral grip, gravel vs.
  asphalt friction, six forward gears plus reverse, an engine torque curve,
  automatic or manual shifting, and a Spacebar jump with landing absorption.
- **Chunked terrain LOD**: the height field is cut into a grid of chunks whose
  count scales with the sample grid (49 chunks for the demo's 512², 121 for a
  generated 784²). Each chunk has three detail levels (1×, 2× and 4×
  decimated) chosen by distance to the car, with vertical skirts hiding LOD
  seams. The car still drives on the full-resolution height field, and all LOD
  geometry is built up front so switching detail never causes a hitch.
- **Carved roads**: the route is stamped into the shared height field before
  the terrain mesh is rebuilt, so the visible surface, the gravel ribbon and
  the physics agree on where the road is.
- **Stage generation**: A* over a drivability grid prefers gentle ground and
  avoids cliffs; the road ribbon, marker posts and gates are draped onto the
  terrain.
- **OSRM routing**: the route builder and the advanced **OSRM ROAD ROUTER**
  panel can fetch real OpenStreetMap roads/trails. The 2D map can additionally
  generate a world around a route that lies outside the loaded terrain. Snap
  distances, degenerate routes and routes too long for a 6 km world are
  reported instead of silently making a bad stage.
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

Kartverket's height WCS (`nhm_dtm_topo_25833`) is also what the in-game world
generator uses, so building a baked scene is only necessary if you want an
offline world with the topo basemap. Otherwise pick the area on the 2D map.

## Project layout

```
index.html                 UI shell and HUD markup
src/main.js                renderer, game loop, cameras, route builder, HUD
src/landcover.js           land cover grid per chunk: OSM polygons + NIBIO SR16 tiles → cover, species, density, ground tints
src/water.js               river/stream ribbons and lake polygons from OSM
src/signs.js               NVDB road signs: fetch, sign-face textures, placement along the stage road
src/roads.js               OSM roads per chunk: carve, ribbons, RoadNetwork spatial index (free drive)
src/buildings.js           Overpass fetch per chunk (buildings, areas, waterways) and footprint-oriented houses
src/terrain.js             GeoTIFF loading, height field, road carving, minimap
src/lod.js                 chunked terrain quadtree/LOD with edge skirts
src/worldgen.js            Kartverket WCS DEM fetch + on-demand world generation
src/car.js                 car model, suspension, tyre model and gearbox
src/map.js                 Leaflet 2D route picker
src/log.js                 logging, timing spans and the performance watchdog
src/stage.js               A*, route sampling, OSRM, road/gate visuals
src/retro.js               PS1-style post-processing
src/audio.js               synthesized engine/wind/gravel/skid audio
src/geo.js                 local projection, UTM 33N conversion, math helpers
scripts/build-scene.py     wrapper for the 3d_terrain scene builder
public/terrain/scenes/     scene catalog + Preikestolen DTM/topo map
public/vendor/geotiff.js   vendored GeoTIFF reader
3d_terrain/                bundled 3d_terrain viewer and python builder
```

`window.__rally` exposes the live scene, camera, terrain, car, route, phase,
stage time, route builder state, `generateRoute`, `fetchOsrm`,
`driveGeometry`, `generateWorld`, `screenFromWorld`, the 2D `mapPicker`,
`terrainStats()`, `toggleDebug()`, `dumpLog()` and the `perf` monitor for
debugging in the browser console.

### Free drive

Open the **2D MAP**, click one point anywhere in Norway and press **FREE DRIVE
HERE**. The point is first snapped to the nearest drivable road with OSRM
(heading included), then the world streams in around it and keeps loading
2 km chunks ahead of the car as you drive. Real roads come from OpenStreetMap: every
chunk's `highway=*` lines are carved into the terrain and drawn as tarmac or
gravel ribbons, and the car is placed on the nearest road as soon as the
first chunk's roads arrive. There is no finish and no stage time to beat;
`N` scouts a timed stage from wherever you are, `R` returns to the start.

In a normal stage the same OSM roads appear as side roads (cut away where
they would overlap the OSRM stage road).

## Map data: forests, fields, water, houses and road signs

In a streamed world (any route picked on the 2D map) every 2 km chunk asks
three open services for what is really there, and draws it low-poly:

| Feature | Source | How it is used |
|---|---|---|
| Forest species and density | **NIBIO SR16** forest-resource map (WMS, 16 m raster, NLOD): `SRRTRESLAG` (spruce / pine / deciduous) and `SRRKRONEDEK` (crown cover) tiles are read back pixel by pixel | Spruce cones, pine umbrellas and birch crowns are instanced per 16 m cell with a density that follows the canopy cover; the road corridor gets priority within a per-chunk budget |
| Fields, pasture, bog, built-up areas, lakes | **OpenStreetMap** polygons (`landuse=*`, `natural=*`) via the Overpass API, rasterised into the same 16 m grid | The ground mesh and minimap are tinted per cell: golden striped fields, green pasture, brown bog; no trees grow on them |
| Rivers and streams, lakes | OpenStreetMap `waterway=*` lines and `natural=water` polygons | Water ribbons draped into the valley floor (never flowing uphill), flat lake polygons at the shore level |
| Buildings | OpenStreetMap footprints (`building=*`, `out geom`) | Each footprint's minimum-area rectangle gives the house its heading and size; `building=*` picks a family (house, cabin, barn, shed, boathouse, church with tower, industrial hall, apartment block) for height, roof pitch and colours |
| Roads (free drive, side roads) | OpenStreetMap `highway=*` centre lines | Carved into the chunk heights and drawn as ribbons (asphalt or gravel by class / `surface=*`); indexed so the car, trees, houses and signs know where the nearest road is |
| Road signs | **Statens vegvesen NVDB API v4** (`Skiltplate`, type 96) plus `Fartsgrense` (type 105) | Real sign plates on posts beside the stage road, facing oncoming traffic; speed-limit signs are synthesised where the limit changes and no plate is registered |

Everything is fetched per chunk, cached with the chunk, and degrades
gracefully. NIBIO and NVDB answer in a second or two; the public Overpass
mirrors can be slow or down, so OSM features arrive separately, are retried
every 45 s, and a circuit breaker skips Overpass for a minute after every
mirror failed. Degradation: if a service is unreachable the chunk simply has no trees from
SR16 (a sparse default forest is used), no houses, or no signs.

## Credits

- Terrain: **Kartverket NHM DTM 1 m**, CC BY 4.0.
- Topo basemap: **Kartverket** open topographic map, CC BY 4.0.
- Routing: **OSRM** / **OpenStreetMap** contributors.
- Forest species and crown cover: **Skogressurskart SR16 © NIBIO**, NLOD.
- Land use, water, buildings: **© OpenStreetMap contributors**, ODbL (Overpass API).
- Road signs and speed limits: *Inneholder data under norsk lisens for offentlige
  data (NLOD) tilgjengeliggjort av Statens vegvesen* (NVDB API Les v4).
- Scene packaging: the bundled **3d_terrain** project.
- Built with **Three.js** and **Vite**.

## Deploying to GitHub Pages

The site is published at <https://fliptmoan.github.io/norwayralley/> by
`.github/workflows/pages.yml`: every push to `main` runs `npm ci && npm run build`
and deploys `dist/`. The repo-name prefix comes from `base` in `vite.config.js`;
code that fetches runtime files (terrain scenes) must build URLs from
`import.meta.env.BASE_URL` rather than a leading `/`.

The Pages source in the repository settings must be **GitHub Actions**, not
"Deploy from a branch" — the latter serves the unbuilt source `index.html`,
which loads no CSS or JS.
