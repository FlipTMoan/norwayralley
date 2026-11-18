# Retro Norway Rally — Unity 6 web build

_Updated 2026-11-16 (friends rooms: two channels, heartbeat, rejoin, challenges)._

The Unity rewrite of the browser game. The JS original lives in `../legacy-js/` and is still what
`npm run build` deploys to GitHub Pages; the Unity build is served next to it at
`/norwayralley/unity/`.

## Install Unity on Linux

1. Download Unity Hub for Linux: <https://unity.com/download> (AppImage or the `unityhub` apt/yum
   repository), sign in, and activate a Personal licence.
2. In the Hub go to **Installs → Install Editor → Archive**, choose **6000.6.9f1** (the version in
   `ProjectSettings/ProjectVersion.txt`) and tick the **Web Build Support** module.
   WebGPU needs no extra module; it is a graphics API choice in Player Settings.
3. **Projects → Add → Add project from disk** and pick this `unity/` folder. The first open restores
   the packages in `Packages/manifest.json` (URP, Burst, Mathematics, Collections, Input System,
   Test Framework, glTFast).

## Build the bootstrap scene and press Play

**Rally → Build Bootstrap Scene** (or headless:
`unity-editor -batchmode -nographics -projectPath unity -executeMethod Rally.Editor.SceneBuilder.Build -quit`)
creates the URP asset, volume profile, panel settings, world style with placeholder art, the actor
capsules, the Porsche prefab from the WoTiger FBX and `Assets/_Rally/Scenes/Rally.unity`, and sets the
Player Settings (Input System, linear colour). Then press Play: `UseFakeSources` is on, so the first run
needs no network. Details and the slot reference: `Assets/_Rally/Runtime/Gameplay/SCENE.md`.

## Run the EditMode tests

**Window → General → Test Runner → EditMode → Run All.** The Geo tests
(`Assets/_Rally/Tests/EditMode/Geo`) need no network: they decode a synthetic GeoTIFF, build the
Overpass / OSRM / SR16 / NVDB request strings and check them against the JS, race fake Overpass
mirrors, and run the cache LRU and the circuit breaker on a fake clock.

Headless (what CI does):

```bash
unity-editor -batchmode -nographics -projectPath unity -runTests -testPlatform EditMode -testResults results.xml
```

The PlayMode smoke test (`Assets/_Rally/Tests/PlayMode`) boots the bootstrap scene offline, starts the
engine and checks that the car drives; it needs a real GPU, so drop `-nographics` and run it with a display:

```bash
unity-editor -batchmode -projectPath unity -runTests -testPlatform PlayMode -testResults results.xml
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

### WebGPU or WebGL 2?

The build lists WebGPU first and falls back to WebGL 2 (GLES 3.0: no compute, Burst carve + CPU scatter, see
`README-world.md`). Unity's console line `Renderer: WebKit WebGL / OpenGL ES 3.0` means WebGL 2 was picked; the
quick check is `navigator.gpu` in the DevTools console (`undefined` = no WebGPU in this browser). Chrome on Linux
ships WebGPU behind a flag in many versions: `chrome://flags/#enable-unsafe-webgpu` (and a recent Chrome; Vulkan
on the GPU helps), then reload. Nothing in the build changes the browser's choice.

## Play with friends (rooms over WebRTC)

A room is a 4-letter code on the public PeerJS signalling server (`nrr-CODE`), exactly as the JS
game, so a JS client and a Unity client can share a room. **Signalling needs the internet** (the
PeerJS server brokers the handshake), but the data path itself is a direct WebRTC connection: when
both devices are on one LAN / hotspot, ICE picks *host* candidates and the packets never leave the
network. The friends panel shows what was selected — **LAN direct**, **via internet** (through the
NATs) or **relayed** (TURN, only when `IceConfig.Turn` is set; the open question Cloudflare TURN vs
Metered is in `Runtime/Net/IceConfig.cs`). Browsers hide LAN addresses behind mDNS `.local`
candidates; those still count as LAN, but a router with *client isolation* (many guest Wi-Fis)
blocks them and the pair falls back to "via internet".

Per peer there are two channels (`Plugins/WebGL/peer.jslib`, `Runtime/Net/Session.cs`):

- the PeerJS default channel, unreliable/unordered JSON — the 80 ms car-state packets, byte-compatible
  with the JS game;
- `ctl`, reliable and ordered, with sequence numbers and acks (resend after 1 s, 64 in flight) —
  hello/join/leave, the stage hand-over, `go`, results and a 1 s heartbeat. A peer silent for 5 s is
  dropped (reason `timeout`, its ghost disappears); a guest rejoins with 1/2/4/8…60 s backoff while
  the game keeps running, and the host hands the same grid slot back to a callsign seen within 2
  minutes. Messages for a closed ctl channel are queued and flushed when it reopens. A JS client has
  no ctl channel: it gets the roster messages plainly on the state channel and ignores the rest.

Challenges: the host (or a guest who picked a stage) sends `{t:'route', kind, query, seed}` where
`query` is the share-link query (`?route=osrm:…`, `?seed=…`, `?drive=…`); every client rebuilds the
identical stage with `GameController.LoadFromQuery`. When the host's countdown starts it sends
`{t:'go', atMs}` on the host clock; guests align through the heartbeat round trip (`ClockSync`,
offset = host time at the reply − send time − RTT/2) so everyone's lights go out together. Each
finish sends `{t:'result', name, timeMs, penaltyMs}`; the host keeps the leaderboard
(`Session.Results`) and broadcasts it as `board`, shown in the room status line.

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


## Log window

Press **F2** (or the LOG button next to the clock) in the game to open the scrolling log: tile requests and
readiness, OSM road/feature counts, SR16 forest rasters, trees placed and cache hits and misses, with filter chips,
FOLLOW (stick to the newest line) and COPY (visible lines to the clipboard). The same lines go to the browser
console with a `[rally]` prefix. Source: `Runtime/UI/LogWindow.cs`, `Runtime/Core/RallyLog.cs`.


## Controls (same as the JS game)

| Key | Action |
|---|---|
| `W` / `↑` | Throttle |
| `S` / `↓` | Brake / reverse |
| `A` `D` / `←` `→` | Steer |
| `Space` | Jump |
| `Shift` | Handbrake (drift) |
| `Q` / `E` | Gear down / up (switches the gearbox to manual) |
| `G` | Automatic / manual gearbox |
| `R` | Restart the stage |
| `N` | Scout a new endless stage from where the car is |
| `1` / `2` / `3`, `C` | Camera: above / chase / driver's seat, `C` cycles |
| `M` | Mute |
| `F10` / `F3` | Debug window (phone: three quick taps on the speed) |
| `F2` | Log window |
| `Esc` | Close the route map, or back to the start screen |
| `Enter` | Start the engine |

Mouse and touch: the **MAP** button (and PICK A ROUTE ON THE MAP on the start screen) opens the Leaflet route
map in the web build; pins snap to the nearest road of the chosen profile within 1 km, GENERATE ROUTE and
FREE DRIVE HERE load the stage and update the address bar so it can be shared. The start screen also has
GEARBOX and SLIDING (0–3) toggles, saved in the browser, and the local cache size with CLEAR. On phones and
narrow screens ◀ ▶ BRAKE GAS DRIFT buttons appear. Gamepad: triggers throttle/brake, left stick steers,
B handbrake, A jump, shoulders gears. Off-road routing on the map is not in the Unity build yet.
