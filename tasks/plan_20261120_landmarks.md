# Grand Tour Norway: landmarks, photo camera and photo album — 2026-11-20 (planned, not started)

User's points 2–4 (wording kept in short form below). Not started: it comes after plan_20261120_world.md (A–H).

## Open decisions (ask the user before starting)
1. Which game? DECIDED: Unity (user: "This is ment for the unity game."). The text is written for the JS game (Three.js: `vector.project`, `THREE.Raycaster`,
   `preserveDrawingBuffer`, `toDataURL`). Current work is on Unity. Proposal: build it in Unity (WebGL), with the same
   ideas in Unity terms — `Camera.WorldToViewportPoint`, a ray against the terrain heightfield (there are no terrain
   colliders; march the IGround height along the ray), `ScreenCapture`/`RenderTexture` → JPEG → JS via a jslib.
   The landmarks.json, the HTML/CSS viewfinder and the IndexedDB album can be shared by both games.
2. Keys: `C` already cycles the camera (with 1/2/3) and `Space` is jump. Proposal: photo mode on `F` (or `V`), shutter
   on left click / `Enter` / `Space` *inside photo mode only*; album on `P` (free today). Touch: a camera button and a
   shutter button.
3. "Point 1" is not in this message — is there a point 1 I should add too?

## 2. Norwegian landmarks & POI database
- [ ] `landmarks.json` (curated, in the repo, ~40–60 to start): `id`, `name`, `lat`, `lon`, `elevation`,
      `triggerRadius` (500 m for a pass/road, up to 2500 m+ for a peak seen from afar), `region` (fylke), `kind`
      (peak / fjord / road / waterfall / rock / town …), `aim` (the point to photograph, may differ from lat/lon, e.g. the
      Preikestolen plateau edge), `description` (short retro postcard text unlocked by the photo), optional `viewpoints`
      [lat, lon] for the best vantage points on a road. Start list: Trollstigen, Geirangerfjord (Ørnesvingen, Flydalsjuvet),
      Galdhøpiggen, Preikestolen, Atlanterhavsvegen, Kjeragbolten, Låtefossen, Vøringsfossen, Stegastein, Dalsnibba,
      Sognefjellet, Lofoten (Reine, Hamnøy), Nordkapp, Senja (Bergsbotn), Rondane, Jotunheimen (Bessegen), Hardangervidda,
      Lysevegen, Helgelandskysten, Kjosfossen, Briksdalsbreen, Nærøyfjord, Gaularfjellet, Snøhetta, Folgefonna, Dovrefjell …
      Coordinates checked against Kartverket stedsnavn / NVDB (no guessing), elevations from the DEM.
- [ ] Loader + spatial lookup (nearest landmark within trigger radius; cheap per frame).
- [ ] 3D world markers: a retro scenic-viewpoint sign (Norwegian tourist-route style, brown/■ "severdighet" sign
      kind, drawn by our Sign system) at each `viewpoint` beside the road, plus a small glowing camera icon visible
      from ~300 m. Placed when the tile is loaded; solid like other signs.
- [ ] HUD hint on entering a trigger radius: "SCENIC VIEWPOINT NEARBY: GALDHØPIGGEN" (subtle, once per visit, with
      distance/direction); a "already photographed" tick if it is in the album.

## 3. In-game retro camera & line-of-sight check
- [ ] Photo mode toggle (key per decision 2): car brakes to a stop / handbrake on and throttle ignored, HUD hidden,
      first-person free-look from the driver's seat (mouse / arrows aim, `+`/`-` or wheel zoom = FOV 60°→10°).
      Esc or the same key leaves it.
- [ ] Viewfinder overlay (HTML/CSS over the canvas, or UI Toolkit): focus brackets, film frame counter (24 per
      roll?), grain/CRT filter, live indicator `[TARGET LOCKED: TROLLSTIGEN]` / `[NO TARGET]`.
- [ ] Verification: project the landmark's aim point to the viewport; it must lie in the centre box (middle 50 % of
      width and height) and in front of the camera; within the landmark's photo range; line of sight: march along the
      ray over the terrain heights (and the big buildings) so a nearer mountain blocks it. Several landmarks in view →
      the most central one. Unit tests with fake ground (visible / behind a ridge / off-centre / behind the camera).
- [ ] Shutter: sound, white flash, capture the frame without the overlay (render to a RenderTexture at e.g. 1280 px
      wide, JPEG q 0.85), stored with metadata. Works in WebGL 2 builds and on phones.
- [ ] Real photos: when a landmark is captured, the album card can also show a real photo of it from Wikimedia
      Commons (Commons API: the landmark's Wikidata P18 image, thumbnail URL, author + licence shown on the card, cached
      in IndexedDB). The postcard back shows the real photo + the description; the front is the player's shot.
      Only freely licensed images (CC BY / CC BY-SA / PD), attribution always shown.

## 4. Retro photo album & explorer progression
- [ ] IndexedDB store (beside the existing GeoCache, own object store): image Blob + `landmarkId`, `landmarkName`,
      `dateCaptured`, `gps` (lat/lon of the car), `distanceKm` to the landmark, car, stage. Photos without a target are
      kept too ("free shots"), limit + delete.
- [ ] Album on `P` (full-screen, retro scrapbook): Polaroid cards with the shot, place stamp, date and distance;
      undiscovered landmarks as silhouette cards with a hint and region ("Møre og Romsdal — Unexplored"); count per
      region ("12 / 48 discovered"); click a locked card → open the route map with a pin there (ties in with the place
      search).
- [ ] Export: "Download postcard" on each card → PNG with a retro "Greetings from Norway" border, name, date.
- [ ] Help text, README, ARCHITECTURE (data flow diagram), CHANGES; tests for the store (save/load/list), the
      verification maths and the export size.

## Rough order and size
2 (data + hint + markers, ~1 agent run) → 3 (camera, check, capture) → 4 (album, export, Commons photos).
Each step its own commit, tests, check in Chrome, push.
