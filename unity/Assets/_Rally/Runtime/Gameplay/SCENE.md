# Bootstrap scene (`Assets/_Rally/Scenes/Rally.unity`)

_Updated 2026-11-16. **Run `Rally → Build Bootstrap Scene` (or the headless command below) and then press Play.**
`Editor/SceneBuilder.cs` creates everything in the tables that follow — the manual steps stay here as the reference for
what each slot is — so nothing has to be clicked:_

```bash
unity-editor -batchmode -nographics -projectPath unity -executeMethod Rally.Editor.SceneBuilder.Build -quit
```

_It is idempotent: existing assets under `Assets/_Rally/Settings` and `Assets/_Rally/Prefabs` are kept (edit them freely),
missing ones are created, the scene is regenerated and added to Build Settings as the only enabled scene. The first Play works
offline (`UseFakeSources` is on and `EditorQuery` is `?drive=59.032,6.065`). Placeholders until real art arrives: cone
trees in five species colours (three LODs + billboard), colour-coded capsules per actor kind, flat-colour terrain splat
arrays. The Porsche prefab (`Prefabs/Car_Porsche911.prefab`) comes from the WoTiger FBX: the importer is scaled so the
wheelbase measures 2.45 m, the four FBX wheels hang under pivot/spin pairs at the CarSpec axles, textures are wired by
hand into URP Lit copies under `Settings/Car`. Particle, light and trail slots stay empty (every component tolerates that).
`Assets/_Rally/Tests/PlayMode/SceneSmokeTests.cs` boots the scene offline, starts the engine and asserts the car drives;
it needs a GPU (`-nographics` has no compute kernels), so run it with a display:
`unity-editor -batchmode -projectPath unity -runTests -testPlatform PlayMode -testResults results.xml`._

## 1. Project settings

- **Edit → Project Settings → Player → Other Settings → Active Input Handling: Input System Package (New)** (or *Both*).
  `CarController` and `CameraRig` read `Keyboard.current` / `Gamepad.current`.
- **Tags and Layers** come from `ProjectSettings/TagManager.asset`: layers `Water` (builtin 4), 8 `Buildings`, 9 `Trees`,
  10 `Props`, 12 `Actors`, 13 `Car`; tags `Car`, `Actor`. **Physics → Layer Collision Matrix**: Car ↔ Buildings/Trees/Props
  on, Car ↔ Water on (trigger), Car ↔ Actors off (the actors' own disc test reports hits), Actors ↔ Buildings/Trees/Props on.
- **Graphics → URP asset** (`Assets/_Rally/Settings/RallyURP.asset`, Create → Rendering → URP Asset with Universal Renderer):
  Forward+, Depth Texture **on**, Opaque Texture **on**, Shadow cascades 4, shadow distance 200 (WorldStyleSO.Apply rewrites these),
  HDR on, MSAA off (the CRT feature / render scale handles the look). Renderer asset: add the **Screen Space Ambient Occlusion**
  feature and, for the retro preset, the **CrtRenderFeature** (`Rally/CRT` shader). Set the asset in Graphics *and* Quality.
- **Player → Web**: handled by `Rally → Build Web`.

## 2. Assets to create (Project window, right click → Create → Rally)

| Asset | Slots |
| --- | --- |
| **World Style** (`WorldStyle.asset`) | `TerrainMaterial` = material on `Rally/TerrainClipmap` with `_Albedo` / `_Normals` Texture2DArrays (5 slices: forest floor, bog, pasture, rock, snow). `Vegetation` = the Vegetation Set below. `ScatterShader` = `Runtime/World/Scatter.compute`. `LakeMaterial`, `RiverMaterial` (`_Flow` 1), `SeaMaterial` (`_SwellAmp` 0.25) on `Rally/Water` with a ripple normal map. `BuildingMaterial` = a vertex-colour lit material (Shader Graph: Vertex Color → Base Color). `SkyMaterial` on `Rally/Sky`. `PostProfile` = the Volume Profile of the global Volume. |
| **Vegetation Set** (`VegetationSet.asset`) | 5 prototypes in order spruce, pine, birch, mountain birch, shrub: 3 LOD meshes, a billboard quad (x −0.5..0.5, y 0..1), a `Rally/Tree` material and a billboard copy with `_Billboard` 1. Unassigned prototypes are skipped. |
| **Actor Set** (`ActorSet.asset`) | One prefab per `ActorKind` (moose, deer, sheep, reindeer, pedestrian, dog, cyclist, tractor) plus a `Fallback` (a capsule is fine). Prefabs may carry an Animator with `Speed` (float) and `State` (int); `ActorView` is added at spawn when missing. |
| Road materials | `RoadTarmac` and `RoadGravel`: URP Lit (or your own) — the ribbon's sub-mesh 0 is tarmac, 1 gravel; UV u = −1..2 across (markings by u), v = metres / 4. |
| **Car prefab** (`Car_Porsche911.prefab`) | Root: `Rigidbody` (kinematic is set by code), `BoxCollider`, `CarController` (Kind, GripMode, four `WheelPivots` + optional `WheelSpins`; the layer masks are set by GameController), `CarEffects` (Dust / Spray / Exhaust particle systems in world simulation space, two rear TrailRenderers, brake-light renderer with an emissive material, two headlight spot lights), `CarDamageVisual` (Body renderer on `Rally/CarBody`, WindscreenCrack quad, headlights, Smoke / Sparks particle systems, Bumper / Bonnet transforms), `CarAudio` (no slots). Models: `Assets/_Rally/Art/Cars` (see `docs/car-models.md`). Layer `Car`. |
| **HUD** (`Hud.uxml` + `Hud.uss`, Panel Settings asset) | A UI Toolkit document with elements named exactly: Labels `speed`, `gear`, `clock`, `penalty`, `noteKind`, `noteDist`, `surface`, `status`, `distLeft`; VisualElements `rpmBar` (width is set in %, class `redline` toggled), `arrow` (rotated by the turn angle, + = anticlockwise), `damageBar` (width %), `turnBox` (hidden when there is no note). |

## 3. GameObjects

| GameObject | Components | Notes |
| --- | --- | --- |
| **Game** | `GameController` | Slots: Style, CarveShader (`Runtime/World/Carve.compute`), CarPrefab, ActorSet, Tarmac/Gravel materials, MainCamera, Rig, Sky, Hud, Ghosts. Editor run: tick `UseFakeSources` for offline, set `EditorQuery` (`?drive=59.032,6.065`, `?route=osrm:59.032,6.065;59.018,6.04;driving`, `?seed=1f;59.032,6.065`). |
| **Main Camera** | `Camera` (URP Universal Additional Camera Data: post-processing on), `CameraRig`, `AudioListener` | Far clip 12 000 m, near 0.3. Keys 1/2/3 switch overhead / chase / seat. Tag MainCamera. |
| **Sun** | `Light` (Directional, shadows soft), `SkyAndTime` with `Sun` = itself | Hour / Month / Latitude in the inspector; `GameController` sets `RenderSettings.sun` and the latitude. |
| **Sky** | `SkyBinder` with the `Rally/Sky` material | Keeps the sky, ambient and fog in step with the sun. Lighting window: Skybox material = the same material, no baked GI. |
| **Volume** | `Volume` (global, the profile from World Style) | Bloom, ACES, vignette, motion blur are written by `WorldStyleSO.Apply()`. |
| **HUD** | `UIDocument` (Hud.uxml, Panel Settings), `HudController` | Scale mode "Scale with screen size", 1280×720 reference. |
| **Ghosts** | `GhostCarView` with `PorschePrefab` / `BuggyPrefab` (visual-only copies of the car prefabs without `CarController`) | Other players' cars (Rally.Net). |
| **Net** | created at runtime by `PeerBridge.Ensure()` | Do not add by hand; the jslib finds it by name. |

The world itself (terrain clipmap, tiles, water, houses, forest, ribbons, tree/prop collider pools) is created at runtime
under a `World` object by `TileWorld`; nothing of it is in the scene. The terrain has **no collider**.

## 4. Running

- Editor: Play with `UseFakeSources` on (no network: one straight road, one house, a bump) or off (live Kartverket / Overpass /
  NIBIO / OSRM through the file cache in `Application.persistentDataPath/rally-cache`). Enter starts the engine; WASD / arrows,
  Shift handbrake, Space jump, Q/E manual gears.
- Web: `Rally → Build Web`; the page's `?drive=` / `?route=` / `?seed=` query is read by `BrowserDom.UrlParams()`.
- Friends: the start screen in `Hud.uxml` has HOST A ROOM / JOIN (`hostButton`, `joinButton`, `roomCode`, `roomStatus`); `HudController` raises `HostClicked`/`JoinClicked`, which `GameController` subscribes to in Start. `startButton` starts the engine; the whole `startScreen` hides when the phase leaves Intro.
