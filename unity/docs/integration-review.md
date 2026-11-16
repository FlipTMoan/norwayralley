# Integration review — Unity rewrite, 2026-11-16

Read-only consistency pass over `Assets/_Rally` (no compiler on this machine). Everything below was done by reading;
the first editor open will be the real test. Items under **Verify in the editor** are the ones a compile or a play
session must confirm.

## Part 1 — what was changed

### Assembly graph
| File | Change | Why |
| --- | --- | --- |
| `Runtime/Gameplay/Rally.Gameplay.asmdef` | references `Rally.Net`, `Rally.UI`, `Rally.Presentation`, `Unity.Collections` added | `GameController` (Gameplay) wires the HUD, camera rig, sky and the friends session; the stated order (Gameplay ← Net/UI/Presentation) cannot hold for a composition root. |
| `Runtime/UI/Rally.UI.asmdef` | `Rally.Gameplay`, `Rally.Actors` references removed | Unused by `HudController` / `HudFrame`; removing them breaks the Gameplay ↔ UI cycle the change above would have made. |
| `Runtime/Track/Rally.Track.asmdef` | `Rally.Roads`, `Rally.World`, `Rally.Geo` added | The `IRoadEdges` adapter and the free-drive route take a `RoadGraph` (Roads sits below Track, as asked). |
| `Runtime/Presentation/Rally.Presentation.asmdef` | `Unity.InputSystem` added | `CameraRig` now reads `Keyboard.current` (see below). |
| `CONVENTIONS.md`, `README.md` | layer order text | Gameplay is the top assembly; Net (Core, Geo), UI (Core), Presentation (Core) sit beside Vehicle/Actors. |

No cycles: Core ← Geo ← World ← Roads ← Track ← Vehicle; Actors (Core); Net (Core, Geo); UI (Core); Presentation (Core);
Gameplay references all of them; `Rally.Tests.Edit` references everything but UI/Presentation (no test uses them).

### Duplicate / conflicting types
| File | Change |
| --- | --- |
| `Runtime/World/RoadCarveData.cs` | `RoadProfile` lost its copies of SHOULDER, FEATHER, ROAD_LIFT, RIBBON_LIFT, CROWN, `FlatHalf`, `CorridorReach`, `SurfaceLift`; it keeps `Two`/`One` (now built from `RoadConstants`), `ShoulderFor`, `Smoothstep`, `Height` (the carve's rule). |
| `Runtime/World/TileWorld.cs`, `Runtime/Roads/RibbonMesh.cs`, `Runtime/Roads/RoadGraph.cs`, `Runtime/Roads/ProfileGrader.cs` | use `RoadConstants.*` for the numbers. `TileWorld.HeightAt` = profile over the natural ground + `RoadConstants.SurfaceLift`, exactly what `CarSim` expects (`s.RoadLift`). |
| `Tests/EditMode/World/{CarveJobTests,ProfileGraderTests,RoadGraphTests,TileWorldTests}.cs` | same renames (`RoadConstants.RoadRibbonLift`, `RoadCrown`, `Shoulder`, `Feather`, `RoadLift`, `FlatHalf`, `CorridorReach`, `SurfaceLift`). |

Other name checks: `Rally.Vehicle.GripMode` (struct) vs the `GripMode` fields on `CarController` / `CarInput` / `ScriptedDriver`
is legal C# (member lookup wins inside those types; `CarSim` uses the type). `Rally.World.Water` (static class) vs
`TileView.Water` field: no clash (nested class member). No duplicate class names inside one namespace were found.

### Cross-layer call sites
| Where | Finding / change |
| --- | --- |
| `CarController` ↔ `TileWorld` (`IGround`) | Signatures match; `HeightAt` includes the ribbon lift. `GameController` sets `SolidLayers = RallyLayers.SolidMask`, `TreeLayers`, `WaterLayers` (builtin layer 4), `ActorLayers`, and puts the car on layer `Car`. |
| `ActorManager` `roadAt` ↔ `IRoute` | Adapter in `GameController.RoadAt(s)`: `SampleAtDistance` → `RoadPoint(xz, yaw, RoadWidth)`. |
| `Actors.CoverKind` ↔ World land cover | `GameController.CoverAt(s, side)`: water → `Water`, SR16 crown ≥ 0.25 → `Forest`, ≥ 2 houses within 80 m → `Settlement`, above the tree line → `OpenFjell`, else `Pasture`; `Unknown` while the tile is not loaded. New accessors `TileWorld.CoverAt` / `TreeLineAt`. |
| `GameFlow` ↔ `CarController.Damage/Wrecked` | `GameController`: `car.Wrecked` → `flow.Retire()`; HUD damage = `car.Damage`. |
| `HudController.Show(HudFrame)` | Filled per frame in `GameController.ShowHud`; note text from `PaceNotes` (positive = left). |
| `GhostCarView.ToWorld` ↔ `FloatingOrigin` | `GameController.WireToWorld`: wire (x east, y up, z south from the stage anchor, yaw 0 = south) → `FloatingOrigin.ToWorld(anchor + (x, −z))`, yaw = π − yaw; `Packet()` is the inverse. |
| `CameraRig` ↔ `CarController` | `Target = car.transform`, `GroundHeight = world.HeightAt`, `SeatEye = Spec.Eye`, `Shift` on rebase. |
| `Track.RoadWalk.IRoadEdges` ↔ `Roads.RoadGraph` | **New** `Roads.RoadLink` (junction-to-junction stretch with the graded points, both directions, ref-counted across tiles) built in `RoadGraph.SetTile` / removed in `RemoveTile`; `LinksFrom`, `TryNodePosition`, `NearestNode`, `ClassOf`, `IsBarred`. **New** `Track/RoadGraphEdges.cs` adapts it to `IRoadEdges` (Forest = 0.5, unknown to the graph). |
| Free drive route | **New** `Track/RoadNetworkRoute.cs` (`IRoute`, `Free = true`) over `RoadGraph.Nearest`, so the car gets surface / width / graded height from the OSM roads instead of "off road everywhere" with a null route. |
| `FloatingOrigin` rebase order | TileWorld subscribes in its constructor, `CarController` in `OnEnable`, `GameController` last (camera rig, live actors via new `ActorManager.Shift` / `CrossingActor.Shift`). Ghosts and the stage line are UTM-based and need nothing. |

### Obvious C# fixes
| File | Change |
| --- | --- |
| `Runtime/Presentation/CameraRig.cs` | `Input.GetKeyDown` → `Keyboard.current.digitNKey.wasPressedThisFrame`: the project uses the Input System package (`CarController`); with "Input System Package" as the active handler the legacy `Input` class throws. |
| `Runtime/World/VegetationRenderer.cs` | `if (proto == null) continue;` in the constructor: an unassigned prototype slot in the Vegetation Set would throw. |
| `Runtime/Actors/CrossingActor.cs` | `Road`, `start`, `end` no longer `readonly` so `Shift` (rebase) can move them. |

Reviewed and left as they are (they read as valid): conditional `ref` in `TileWorld.TileFor`, `Span<float> = stackalloc`
in `RoadWalk.Step` (safe context, non-async), switch expressions, `float4` indexers in `CarSim`, `in` parameters on
`ref` locals, `ReadOnlySpan<WallBox>.Empty`, `WallBox[]` → span conversion in the tests, `??` with a lambda in
`Session`/`GeoCache`, the method-group → `Func<GhostPose, (Vector3, Quaternion)>` assignment in `GhostCarView`.

### Shaders / compute
- Include paths exist in URP 17 / Core RP 17: `ShaderLibrary/Core.hlsl`, `Lighting.hlsl`, `Shadows.hlsl`,
  `DeclareDepthTexture.hlsl`; `com.unity.render-pipelines.core/ShaderLibrary/Common.hlsl` and
  `Runtime/Utilities/Blit.hlsl` (CRT). `SampleAmbientOcclusion` / `GetNormalizedScreenSpaceUV` come with `Lighting.hlsl`.
- `Carve.compute`: kernel `Carve` = `FindKernel("Carve")`; `_Base`, `_Heights`, `_Mask`, `_BestD`, `_Segments`,
  `_SegmentCount`, `_Slice`, `_N`, `_First`, `_CellM` match `ComputeCarver`; `numthreads(8,8,1)` ↔ `(N+7)/8` groups;
  `MAX_SEGMENTS 2048` ↔ `MaxSegmentsPerDispatch`; struct = 32 bytes ↔ `CarveSegment.Stride`.
- `Scatter.compute`: kernels `ScatterTile`, `ClearCounts`, `Cull`, `WriteArgs` ↔ `FindKernel`; buffer/texture names match
  `VegetationRenderer`; `numthreads(8,8,1)` ↔ `(res+7)/8`, `(64,1,1)` ↔ `(slots*Capacity+63)/64`, `LOD_BUCKETS 20` =
  5 species × 4 LODs = `Buckets`; `TreeInstance` 32 bytes ↔ `TreeInstance.Stride`; `_Args[i*5+1]` = instanceCount.
- `Tree.shader` `_TreeVisible` / `_InstanceOffset` ↔ `VegetationRenderer`; `TerrainGround.hlsl` globals ↔ `TerrainBinding`;
  `Water.shader` `_WakeTex` / `_WakeWindow` ↔ `WaterWake`; `CarBody.shader` `_Impacts` / `_ImpactCount` / `_DamageMask` /
  `_BodySize` ↔ `CarDamageVisual`; `CRT.shader` ↔ `CrtRenderFeature`.
- `Carve.compute` uses an `int` as a ternary condition (`_First ? … : …`); legal HLSL, DXC may warn.

### jslib ↔ C#
- `idb.jslib` ↔ `IdbBackend`: all 8 imports exist with the same arity; `makeDynCall('vii')` ↔ `BoolCallback(int,int)` /
  `StringCallback(int,string)`, `'viiiiiidd'` ↔ `GetCallback(int,int,IntPtr,int,int,string,double,double)`.
- `peer.jslib` ↔ `PeerBridge`: 7 imports, arities match; `SendMessage('Net','OnPeerEvent')` ↔ `PeerBridge.GameObjectName` / method.
- `dom.jslib` had **no C# side**: **new** `Runtime/Geo/Dom/BrowserDom.cs` (13 imports, editor no-ops). `RallyLocalGet`
  returns 0 for a missing key: with a `string` return the IL2CPP marshaller yields `null` — verify once in a web build.

### Streaming while driving (coordinator requirement)
- `TileScheduler` already implements the led point (`LedPoint`, LEAD 2800 m / LOAD 4400 m / KEEP 5300 m); `GameController`
  passes `car.State.Vel` every frame.
- **New** `TileScheduler.SetPrefetchPath` (next endless sector: coarse + fine tiles behind the ring, not dropped by distance)
  and `TileScheduler.Count`; **new** `TileWorld.GetStats()` (`Stats`: coarse / fine / pending / bytes) for the HUD.
- `TileWorld.OnTileData` now shows a tile as soon as its DTM is in; **new** `TileWorld.OnTileFeatures` applies land cover,
  features, houses, pads and forest later. Scatter waits for the features (`TileView.FeaturesIn`). `GameController`
  applies one tile result per frame and retries a missing Overpass answer after 45 s.
- Fine-tile arrival: snap (what `TileWorld` supports), held ≤ 3 s while the car is within 30 m (`FineTileHoldDistance`).
  Documented in `README-world.md`.

## Part 2 — files added
- `Assets/_Rally/Runtime/Gameplay/GameController.cs` — the bootstrap (regions: Inspector, State, Boot, Streaming, Route, Car and systems, Frame, Friends).
- `Assets/_Rally/Runtime/Gameplay/SCENE.md` — the scene to build in the editor.
- `Assets/_Rally/Runtime/Track/RoadGraphEdges.cs`, `Assets/_Rally/Runtime/Track/RoadNetworkRoute.cs`.
- `Assets/_Rally/Runtime/Actors/ActorSetSO.cs`.
- `Assets/_Rally/Runtime/Geo/Dom/BrowserDom.cs`.
- `unity/docs/integration-review.md` (this file).

## Could not resolve / verify in the editor
1. **Compile**: nothing here was compiled. Open the project, fix what the console shows first (asmdef GUID-less name references are fine in Unity 6).
2. **`ProjectSettings/ProjectSettings.asset` is missing** (only `ProjectVersion.txt` and `TagManager.asset` exist). Unity will create defaults: set *Active Input Handling* to the Input System package and the graphics APIs as `BuildWeb.ApplyPlayerSettings` does; `TagManager` has layer 11 empty while `README.md` says "11 Water" — the code uses builtin layer 4 `Water`, which is what `TagManager.asset` has.
3. **Stage hand-over between players** (`Session.Route`): done (2026-11-16). The route message is `{kind, query, seed}` with the share-link query; `GameController.LoadFromQuery(query)` (the boot path, refactored) tears the stage down and rebuilds it on every client, the host relays a guest's pick, `go {atMs}` aligns the countdown through the ctl heartbeat (`ClockSync`), and `result`/`board` keep the room leaderboard (`Session.Results`, `Leaderboard()` in the status line). The JS route format (`{kind, points…}`) is still not reproduced: a JS client in the room ignores the Unity message (unknown `t` fields are dropped) and a JS host's pick is shown as "cannot load". The LAN work (two channels, seq/ack, 5 s timeout, rejoin with backoff, selected-candidate path shown as LAN direct / via internet / relayed) is in `Runtime/Net` and `peer.jslib`; see README "Play with friends".
4. **Demo links** (`?route=demo:`) have no A* port: routed with the router (straight line with `FakeSources`, OSRM live).
5. **StageRoute heights outside loaded tiles** are 0 until the tiles arrive (samples are built once at boot); only `RouteSample.Y` / gates use them, the car rides `TileWorld.HeightAt`. Pace notes and progress are unaffected.
6. **Ribbon heights on the GPU carve path**: `RibbonMesh.Build` samples `world.CarvedHeightAt` right after `RecarveWithin`, i.e. before the `AsyncGPUReadback` lands, so the first ribbon of a tile may float on the uncarved heights (the CPU/WebGL 2 path is exact). A rebuild on `TerrainTile.SyncCpu` completion would fix it (not done: TileWorld has no per-tile carve-done event).
7. **Road links across tile edges**: a way's links are built from the whole graded way when any node is inside the padded tile; overlapping copies are ref-counted, but `nodes` positions are never removed (bounded by the live tiles' ways; harmless).
8. **`Forest` weight in `RoadWalk`** is a constant 0.5 (the graph does not know the land cover).
9. **HUD**: `Hud.uxml` / `.uss` exist in `Runtime/UI/` with the element names in `SCENE.md`, now including the start screen and the friends panel (host/join buttons wired through `HudController` events). The arrow needs a `Resources/UI/arrow` sprite and the font a `Resources/Fonts/PressStart2P` asset (or edit the USS).
10. **`FakeSources.Dem`** gives 257 samples only for the 2048 m / 8 m and 256 m / 1 m tiles (it does `round(width/cell)+1`): fine; `KartverketDem` must do the same (`IDemSource` contract) or `OnTileNeeded` rejects the grid.
11. **Service park / endless**: the car is repaired in place every third sector; no stop, no time freeze (the JS had no service park).
12. **Per-frame allocations** in `GameController.StatusLine` (string concat during Loading/Intro/Countdown, stats every 0.5 s) — UI text is a string anyway; the hot path (`Update`, `ShowHud` numbers) does not allocate.
13. `GhostCarView.DefaultToWorld`'s tuple names differ from the delegate's — a warning at most.
14. `RallyLog.Warn` is called from `RallyLayers`' static initializer when a layer is missing — happens once at first use; add the layers before pressing Play.
