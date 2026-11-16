# Retro Norway Rally — Unity 6 web build

_Updated 2026-11-16._

The Unity rewrite of the browser game. The JS original lives in `../legacy-js/` and is still what
`npm run build` deploys to GitHub Pages; the Unity build is served next to it at
`/norwayralley/unity/`.

## Install Unity on Linux

1. Download Unity Hub for Linux: <https://unity.com/download> (AppImage or the `unityhub` apt/yum
   repository), sign in, and activate a Personal licence.
2. In the Hub go to **Installs → Install Editor → Archive**, choose **6000.6.0f1** (the version in
   `ProjectSettings/ProjectVersion.txt`) and tick the **Web Build Support** module.
   WebGPU needs no extra module; it is a graphics API choice in Player Settings.
3. **Projects → Add → Add project from disk** and pick this `unity/` folder. The first open restores
   the packages in `Packages/manifest.json` (URP, Burst, Mathematics, Collections, Input System,
   Test Framework, glTFast).

## Run the EditMode tests

**Window → General → Test Runner → EditMode → Run All.** The Geo tests
(`Assets/_Rally/Tests/EditMode/Geo`) need no network: they decode a synthetic GeoTIFF, build the
Overpass / OSRM / SR16 / NVDB request strings and check them against the JS, race fake Overpass
mirrors, and run the cache LRU and the circuit breaker on a fake clock.

Headless (what CI does):

```bash
unity-editor -batchmode -nographics -projectPath unity -runTests -testPlatform EditMode -testResults results.xml
```

## Build for the web

**Rally → Build Web (Brotli, WebGPU)** in the editor menu, or headless:

```bash
unity-editor -batchmode -nographics -quit -projectPath unity -executeMethod Rally.Editor.BuildWeb.BuildFromMenu
```

Output goes to `unity/Build/Web`. `Assets/_Rally/Editor/BuildWeb.cs` applies the Player Settings
before building, so the editor and CI agree. If you want to set them by hand
(**Edit → Project Settings → Player → Web tab**):

- **Publishing Settings → Compression Format: Brotli**, **Decompression Fallback: on**.
  GitHub Pages cannot send `Content-Encoding: br`, so the Unity loader must inflate the `.br` files
  itself; without the fallback the page shows "Unable to parse Build/….framework.js.br".
- **Resolution and Presentation → WebGL Template: Rally** (`Assets/WebGLTemplates/Rally`).
- **Other Settings → Graphics APIs**: untick *Auto Graphics API*, order **WebGPU, OpenGLES3**
  (WebGL 2 is the fallback). Colour space Linear, IL2CPP, Release.
- **Publishing Settings → Memory**: initial 256 MB, maximum 2048 MB, growth mode Geometric
  (step 0.2, cap 96 MB). Data caching on.

## Run the web build locally

The template loads the Unity files with the decompression fallback, so any static server works:

```bash
cd unity/Build/Web && python3 -m http.server 8000
# open http://localhost:8000/
```

The Leaflet map tiles, PeerJS and the geodata services (Kartverket WCS, NIBIO SR16, Overpass,
NVDB, OSRM) are fetched live and cached in IndexedDB (`rally-cache`, the same database the JS game
uses, 10 GB LRU). In the editor the same cache lives under `Application.persistentDataPath/rally-cache`.

## CI

`.github/workflows/unity.yml` runs the EditMode tests and the web build with game-ci on every push
to `main` that touches `unity/**` (and on *Run workflow*), and uploads the build as the artifact
`unity-web`. `pages.yml` then copies the newest successful `unity-web` into `legacy-js/dist/unity/`
before deploying Pages. Add these repository secrets (Settings → Secrets and variables → Actions):

| Secret | What |
| --- | --- |
| `UNITY_LICENSE` | The contents of a `Unity_v*.ulf` licence file (game-ci docs: *Activation → Personal licence*). |
| `UNITY_EMAIL` | The Unity ID e-mail the licence belongs to. |
| `UNITY_PASSWORD` | Its password. |

## Folder layout

```
unity/
  Assets/_Rally/Runtime/<Layer>/      one asmdef per layer, Core ← Geo ← World ← Roads ← Track ← Vehicle/Actors/Net/UI/Presentation ← Gameplay (GameController, see Gameplay/SCENE.md)
    Core/                             Utm33, LatLon, Proj, Bounds25833, FloatingOrigin, HeightGrid, IGround, RallyRandom, RallyLog
    Geo/                              every geodata client (ports of worldgen.js, buildings.js, landcover.js, signs.js, stage.js, cache.js)
      Sources/                        the interfaces + plain data: IDemSource, IRoadSource, IFeatureSource, ILandcoverSource, ISignSource, IRouter, IGeoCache
      Http/                           Http (UnityWebRequest + await), CircuitBreaker (60 s open / 45 s retry), CachedSource<T>
      Cache/                          GeoCache (LRU, 10 GB), IdbBackend (web, via idb.jslib), FileBackend (editor), MemoryBackend (tests)
      Dem/                            GeoTiff decoder, KartverketDem (WCS GetCoverage)
      Osm/                            OverpassQuery, OverpassMirrors (race + penalties), OverpassSource (roads + features)
      Landcover/                      Sr16Colours, Sr16Source (NIBIO WMS)
      Signs/                          Wkt, NvdbSource (NVDB v4 types 96 / 105)
      Routing/                        OsrmRouter (route / nearest / segmented, 1 km snap)
      Outline/ + Resources/           NorwayOutline (geoBoundaries ADM0 rings)
      Fake/                           FakeSources for tests and offline editor runs
      Json/                           the small JSON reader/writer the clients and the peer wire format use
  Assets/_Rally/Plugins/WebGL/        idb.jslib (IndexedDB), dom.jslib (URL, localStorage, clipboard, map overlay), peer.jslib (PeerJS rooms)
  Assets/_Rally/Editor/BuildWeb.cs    the web build + Player Settings
  Assets/_Rally/Tests/EditMode/       pure tests (Rally.Tests.Edit)
  Assets/WebGLTemplates/Rally/        index.html: loader, canvas, Leaflet route map overlay, PeerJS, attribution footer
  ProjectSettings/TagManager.asset    layers 8 Buildings, 9 Trees, 10 Props, 11 Water, 12 Actors, 13 Car; tags Car, Actor
```
