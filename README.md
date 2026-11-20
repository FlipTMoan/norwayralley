# Retro Norway Rally

A browser arcade rally game on real 1 m Norwegian terrain: the bundled
Preikestolen (Lysefjorden) DTM from Kartverket, plus on-demand worlds generated
anywhere in Norway straight from the national height model. Low-poly
PS1-style visuals, drift-heavy arcade physics, generated rally stages, and
real-road routing through OSRM from a map you open by clicking the minimap.

## Repository layout

- `legacy-js/` — the live Three.js game (this README describes it). All
  `npm` commands below run inside that folder.
- `unity/` — **Grand Tour Norway**, the Unity 6 / WebAssembly rewrite in progress (GPU clipmap
  terrain, compute carving, URP, WebGPU-first, PhysX collisions, damage,
  animals and pedestrians, endless stages). All layers are written but not
  yet compiled: open `unity/` in Unity 6000.6 and follow `unity/README.md`,
  `unity/docs/integration-review.md` and `unity/Assets/_Rally/Runtime/Gameplay/SCENE.md`.
  Plan: `tasks/plan_20261116_unity.md`. Car models: `unity/docs/car-models.md`.

## Run it

```bash
cd legacy-js
npm install
npm run dev
```

Open the address Vite prints (usually <http://localhost:5173>). Click
**START ENGINE** (or press Enter) after the mountain has loaded.

Production build, served locally:

```bash
npm run build
npm run preview        # http://localhost:4173/
```

The build is relocatable: `dist/` works from any static file server at any
path (`npx serve dist`, `python3 -m http.server -d dist`, an nginx folder,
GitHub Pages under `/norwayralley/`). It does not work opened as a
`file://` page, because browsers block module scripts and fetches there, so
always serve it over http. Everything the game needs at runtime is either in
`dist/` or fetched from the public geodata services.
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
| `F10` (or `F3`) | Debug window: coordinates, altitude, heading, ground/road/water state, fps, draw calls, streaming and cache stats. On a phone: tap the speedometer three times quickly, or open the game with `?debug=1` in the address |
| `Esc` | Close the route map, or back to the start screen (MENU) |

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

**Click the minimap** (bottom right) to open the route map, a Leaflet /
OpenStreetMap picker covering the whole country. Click a start and a finish
**anywhere in Norway**, or type `lat, lon` in the field and press Enter to
place the next pin. Choose how to route:

- `driving`, `cycling` or `foot` ask OSRM for a real road or trail. The game
  then drives it on the loaded terrain or generates a new world around it.
- `off-road (A*)` uses the game's own router across the mountain. Both points
  must lie inside the loaded world (the dashed outline on the map).

Press **GENERATE ROUTE**. **USE CURRENT STAGE** puts the pins on the active
stage's endpoints so it can be re-routed. A third click on the map starts a
new pair. **NEW STAGE** (`N`) in the STAGE panel scouts a random stage from
where you are; **MENU** (`Esc`) returns to the start screen to change car,
gearbox or sliding without losing the stage, and `R` restarts it.

The minimap (bottom right) is a north-up window that holds still while you
drive inside its inner half and re-centres on the car once you are halfway
to its edge.

The map opens on the stage you are driving (yellow line) with a red YOU pin
on the car, or centred on the car in free drive; zoom out for the whole
country. It shows Norway only: it cannot be panned or zoomed out beyond the
country, and every other country and the open sea are shaded (national
outline from geoBoundaries, CC BY 4.0).

**Share a drive or a spot.** **SHARE ROUTE** (map footer and STAGE panel)
copies a link that rebuilds the current drive for anyone who opens it:
`?route=osrm:LAT,LON;LAT,LON;PROFILE` re-asks OSRM for the road between the
two points, `?route=demo:LAT,LON;LAT,LON` routes the demo mountain's own A\*
stage, and `?drive=LAT,LON` starts a free drive there. **SHARE POSITION**
copies a `?drive=` link to the exact spot your car stands on, so a friend can
start a free drive right there. Links load as soon as the game is up; press
START ENGINE. If the browser refuses the clipboard the link is shown instead.

**Saved routes.** The second row of the map footer keeps a named list on
this device: type a name and press **SAVE CURRENT** to store the stage or
free drive you are on (OSRM road, off-road A\* on the demo tile, or a free
drive centre), then pick it from **SAVED ROUTES** and **LOAD** it any time.
**DELETE** removes the selected one. The list lives in the browser's
localStorage.

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

### Routing tips

Pins do not have to land on a road: each one is snapped to the nearest road
or trail of the chosen profile within 1 km the moment it is placed, dragged
or typed (and again when the profile changes), the pin moves there, and the
status line says how far it moved and onto which road. A pin with no road
within 1 km stays where you picked with a warning, and GENERATE ROUTE then
refuses with the same message; the route request itself carries the 1 km
limit. Public roads do not cross the Preikestolen plateau, but the mapped
hiking trails do, so pick `foot` there. Switch to `off-road (A*)` to build a
stage across the mountain instead. Off-road rejects points in the
fjord and on cliff faces. Every finished stage gets a level start pad,
whichever router produced it.

### Why OSRM sometimes fails here

The baked demo tile is only 2 km across and sits on a mountain plateau. The
nearest public road for driving is roughly 2 km outside it, so **driving**
pins on the demo world say "no driving road within 1 km" — but the 2D map can
generate a world around that road instead. The **foot** profile can use the
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
- **Route map**: click the minimap, pick two points anywhere in Norway (or
  type them), and let OSRM or the off-road A* router build the stage.
- **Two cars**: the Porsche 911 (rear drive) and the Formula Offroad buggy
  (1 200 hp, 4WD, paddle tyres). At sliding levels 0 and 1 the buggy is
  deliberately planted: more lateral grip, less throttle kick and wander,
  calmer yaw, so it digs in instead of stepping out; levels 2 and 3 are the
  same lively and arcade drift feel for both.
- **Climb limits**: slope gravity is g·sin θ along and across the car, and
  each car has a steepest climbable slope: the Porsche 911 drives up to 30°,
  the Formula Offroad buggy up to 80°. Below the limit the tyres always find
  enough bite (a margin that shrinks towards the limit); above it the load on
  the tyres falls away and gravity wins, so the car slides back.
- **Tyre tracks by surface**: clear ruts on open ground, lighter ones on a
  gravel road, only a faint grey trace on asphalt that turns to black rubber
  while sliding, and a foam wake on water.
- **Water**: the car knows the sea, the fjord shore, OSM lakes and rivers.
  Hitting water throws a splash (and a second, bigger one when the bed drops
  away), the front wheels throw spray while wading, tyre tracks turn into a
  foam wake on the surface, and water drag plus wet tyres slow the car. With
  the roof under for a few seconds the car is fished out onto the last dry
  ground it crossed. The HUD surface label reads WATER / DEEP WATER.
- **Bridges**: where a road crosses water (OSM `bridge=*`, or an untagged
  crossing of a lake, river or the sea at least 6 m wide) it runs on a
  concrete deck with guard rails and piers instead of dipping into the
  valley. The deck is graded bank to bank, arched slightly and lifted to
  clear the water; the ground and the river under it are left as they are.
  The car drives on the deck, the rails and piers are solid, and a car that
  goes over the side lands in the water. Culverted streams stay plain road.
- **Flat start pad**: the start of every stage is levelled and blended into the
  mountain, so the car never spawns on a sideways slope or rolls away during
  the countdown.
- **Arcade-sim vehicle**: raycast suspension with spring/damper body bounce,
  weight transfer, a Pacejka-style slip curve for lateral grip, gravel vs.
  asphalt friction, six forward gears plus reverse, an engine torque curve,
  automatic or manual shifting, and a Spacebar jump with landing absorption.
- **Real jumps**: gravity is 9.81 m/s² and take-off is ballistic. The car
  carries the vertical speed the ground has been giving it, and when free
  flight with that speed would open a real gap to the ground ahead, it
  flies: a crest or a table-top launches the car further the faster it is
  taken, while a slow car, a bump or a kink in the surface just works the
  suspension. The flight ends when a wheel meets the ground again, the
  suspension absorbs the landing, and the car stays down: the lift it had
  before the jump is spent on landing.
- **50 km/h off the road**: rough ground takes the power. Off the carved
  road no car is driven past 50 km/h, and a car arriving faster is bled down
  to it; the roads themselves are unrestricted.
- **Pace notes**: while racing a stage, a box under the speedometer shows
  the next turn: an arrow swinging into the bend (its angle is the bend's),
  LEFT / RIGHT with EASY or HAIRPIN for the sharpness, and the distance to
  the turn-in in 50 m steps (NOW once you are in it). Free drive has no
  planned route and so no notes.
- **Chunked terrain LOD**: the height field is cut into a grid of chunks whose
  count scales with the sample grid (49 chunks for the demo's 512², 121 for a
  generated 784²). Each chunk has three detail levels (1×, 2× and 4×
  decimated) chosen by distance to the car, with vertical skirts hiding LOD
  seams. The car still drives on the full-resolution height field, and all LOD
  geometry is built up front so switching detail never causes a hitch.
- **Rooms**: host or join with a 4-letter code; everyone drives the same
  stage. Whoever picks a new stage, loads a saved route, scouts with N or
  starts a free drive, the whole room follows (guests hand their pick to the
  host, who relays it), and late joiners get the current stage on arrival.
- **Solid houses**: the car cannot drive through a building; it is pushed
  back out of the wall with a thud and loses most of its speed.
- **Local cache**: every elevation tile, Overpass answer, NVDB sign and
  surface record, SR16 forest image, OSRM route and map tile is kept in the
  browser's IndexedDB, up to 32 GB (but never more than 90 % of the storage
  quota the browser grants the site; Chrome often grants about 10 GB until the
  site is granted persistent storage) with least-recently-used eviction, so a
  place you have driven loads from disk and still works when a service is
  down. The start screen shows the size and has a CLEAR button.
- **Carved roads**: the route is stamped into the shared height field before
  the terrain mesh is rebuilt, so the visible surface, the gravel ribbon and
  the physics agree on where the road is. Roads are terraces cut through the
  DTM: a two-lane road is 10.5 m wide with 1.5 m shoulders inside an 18 m
  cut-through, a single-lane road 4.5 m wide with 1.5 m shoulders filling its
  7.5 m one (OSM `lanes` or class decides). Inside the cut-through the ground is
  one straight line from shoulder to shoulder at the graded road height
  (three passes of a ±60 m running mean, measured in metres along the road)
  and blends to the natural ground at the edge, whose height is smoothed along
  the road too; outside it the DTM is untouched, and the terrain next to the
  road is held at or under its surface so nothing pokes through the ribbon.
  Roads are centripetal Catmull-Rom splines through every OSM / OSRM node
  (junction nodes stay exact), sampled at most 5 m and 3° of heading apart, so
  bends have no corners. Where roads meet (they share an OSM node) the higher
  class keeps its profile — the stage road above all — and the lower road
  takes its surface inside the junction, height and crossfall, then ramps
  back to its own grade over 20–100 m without a step or a kink. Neighbouring
  chunks re-settle their copy of a road when the other side of a junction
  arrives later, so crossings agree across chunk borders too.
- **Stage generation**: A* over a drivability grid prefers gentle ground and
  avoids cliffs; the road ribbon, marker posts and gates are draped onto the
  terrain.
- **OSRM routing**: the route map fetches real OpenStreetMap roads/trails and
  generates a world around a route that lies outside the loaded terrain. Snap
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
src/main.js                renderer, game loop, cameras, HUD, route map wiring
src/landcover.js           land cover grid per chunk: OSM polygons + NIBIO SR16 tiles → cover, species, density, ground tints
src/water.js               river/stream ribbons and lake polygons from OSM
src/signs.js               NVDB road signs: fetch, sign-face textures, placement along the stage road
src/roads.js               OSM roads per chunk: carve, ribbons, RoadNetwork spatial index (free drive)
src/bridges.js             bridge spans (OSM tag or water crossing), deck profile, deck/rail/pier mesh and rail colliders
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
stage time, `openMap()`, `generateRoute`, `fetchOsrm`,
`driveGeometry`, `generateWorld`, `screenFromWorld`, the 2D `mapPicker`,
`terrainStats()`, `toggleDebug()`, `dumpLog()` and the `perf` monitor for
debugging in the browser console.

### Free drive

Click the minimap, click one point anywhere in Norway and press **FREE DRIVE
HERE**. The point is first snapped to the nearest drivable road with OSRM
(heading included), then the world streams in around it and keeps loading
2 km chunks ahead of the car as you drive. Real roads come from OpenStreetMap: every
chunk's `highway=*` lines are carved into the terrain and drawn as tarmac or
gravel ribbons, and the car is placed on the nearest road as soon as the
first chunk's roads arrive. There is no finish and no stage time to beat;
`N` scouts a timed stage from wherever you are, `R` returns to the start.

In a normal stage the same OSM roads appear as side roads (cut away where
they would overlap the OSRM stage road).

**Two resolutions.** The streamed world is a 10.7 m grid (2 km chunks within
4.4 km of the car, loading in the background as you drive, so free drive is
unlimited). Inside ±100 m of the roads near the car the same Kartverket DTM
is fetched again at **1 m** in 171 m tiles: carved with the road profile,
drawn as their own meshes (1 m close by, 2 m then 3 m further out) with the coarse
mesh cut away underneath, and used by the car's physics. Up to 30 tiles are
held and dropped 900 m behind; everything is cached locally.

## Play with friends

Press **PLAY WITH FRIENDS** on the start card. One player hosts a room and
gets a 4-letter code; the others join with it. Everyone drives the host's
stage (the host's stage, free-drive area or demo route is sent to joiners
and whenever it changes) and sees the other players as named cars. The
connection is browser to browser (WebRTC data channels) with only the
handshake brokered by the public PeerJS server, so it works across the
internet and on one Wi-Fi or phone hotspot. Browsers cannot link phones
over Bluetooth from a web page, which is why rooms work this way.

## Map data: forests, fields, water, houses and road signs

In a streamed world (any route picked on the 2D map) every 2 km chunk asks
three open services for what is really there, and draws it low-poly:

| Feature | Source | How it is used |
|---|---|---|
| Forest species and density | **NIBIO SR16** forest-resource map (WMS, 16 m raster, NLOD): `SRRTRESLAG` (spruce / pine / deciduous) and `SRRKRONEDEK` (crown cover) tiles are read back pixel by pixel | Spruce cones, pine umbrellas and birch crowns are instanced per 16 m cell with a density that follows the canopy cover; the road corridor gets priority within a per-chunk budget |
| Fields, pasture, bog, built-up areas, lakes | **OpenStreetMap** polygons (`landuse=*`, `natural=*`) via the Overpass API, rasterised into the same 16 m grid | The ground mesh and minimap are tinted per cell: golden striped fields, green pasture, brown bog; no trees grow on them |
| Rivers and streams, lakes | OpenStreetMap `waterway=*` lines and `natural=water` polygons | Water ribbons draped into the valley floor (never flowing uphill), flat lake polygons at the shore level |
| Buildings | OpenStreetMap footprints (`building=*`, `out geom`) | Each footprint's minimum-area rectangle gives the house its heading and size; `building=*` picks a family (house, cabin, barn, shed, boathouse, church with tower, industrial hall, apartment block) for height, roof pitch and colours |
| Roads (free drive, side roads) | OpenStreetMap `highway=*` centre lines | Carved into the chunk heights and drawn as ribbons (asphalt or gravel by class / `surface=*`); indexed so the car, trees, houses and signs know where the nearest road is. `bridge=*` ways (and untagged water crossings, also on the OSRM stage road) become bridges |
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
- Car models in the Unity build (Sketchfab, CC BY 4.0): Porsche 911 by WoTiger (Philipp Busse); Porsche 911 3.2 Carrera
  Coupe by cepela; Porsche 911 (930) Turbo 1975 by Lexyc16, improved by Wolf Hal (WolfGames36); Volvo 240 styled sedan by
  Libau Media; Placeholder MV6 '83 by Daniel Zhabotinsky; Ford Ranger Offroad by CursedCrown; Off Road 4X4 racer (Baja Bug)
  by duanesmind; Buggy type 736 by Andre_rmntc (scaled, re-rigged, recoloured).
- Built with **Three.js** and **Vite**.

## Deploying to GitHub Pages

The site is published at <https://fliptmoan.github.io/norwayralley/> by
`.github/workflows/pages.yml`: every push to `main` runs `npm ci && npm test &&
npm run build` inside `legacy-js/` and deploys `legacy-js/dist/`. `base` in `vite.config.js` is relative (`./`), so the
same build also runs from a PC at any path; code that fetches runtime files
(terrain scenes) must build URLs from `import.meta.env.BASE_URL` rather than
a leading `/`.

The Pages source in the repository settings must be **GitHub Actions**, not
"Deploy from a branch" — the latter serves the unbuilt source `index.html`,
which loads no CSS or JS.
