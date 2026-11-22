# Plan 2026-11-22 — Unity: more NVDB data for realistic road scenes (items 1–6)

Owner: "Make a plan for including other NVDB data for more realistic rendering. plan 1-6, and do some net searches
for images to model by"

Scope: the Unity game (Grand Tour Norway) only. Street lights (87/181/88/86) are being built now from
`tasks/plan_20261122_lights.md`; this plan starts after they land and reuses what they establish.

## 0. Findings (verified against NVDB Les v4 on 2026-11-22)

Sample boxes: town = Lillehammer 2 × 2 km `256000,6781000,258000,6783000`; rural = 20 × 20 km
`60000,6780000,80000,6800000` (Sogn).

| # | NVDB type | Coverage seen | Properties worth using (real values seen) |
|---|---|---|---|
| 1 | **5 Rekkverk**, 14 Rekkverksende | town 65 lines; rural **107 lines / 77 km** | Rekkverkstype: *Stålskinne m/trestolper* (32), *m/sigma stålstolpe* (16), *Betong, New Jersey* (7), *m/stålstolper*; Skinneutrustning *Ensidig enkel / dobbel, Tosidig*; Stolpeavstand 4.0 / 2.0 m; Bruksområde Skråning / Trafikk / Vann |
| 2 | **99 Vegoppmerking, langsgående**, 519 tverrgående | town 30 + 48; rural 19 objects / 1 047 km (long stretches) | 99: Farge Hvit/Gul, Type *Kantlinje heltrukket / stiplet, Varsellinje 1002-V, Tettstedlinje 1002-T, Dobbel sperrelinje 1006*, Bredde 0.1 m. 519: *Vikelinje 1022* (Antall viketrekanter), *Gangfelt 1024* (Antall gangfeltstaver, Bredde 3.0), *Fartshump 1027*, symbols |
| 3 | **487 Holdeplassutrustning**, 25 Leskur | town 34 + 6; rural few | 487: Navn, Type *Plattform og lomme / Kantstopp*, Takoverbygg *Leskur/Nei*, Belysning; children Trafikklomme, Leskur, Kantstein. 25 (polygon): Materialtype *Herdet glass / Metall*, Antall moduler, Lengde/Bredde |
| 4 | **9 Kantstein**, **48 Fortau**, **103 Fartsdemper** | town 90 + 56 + 25; rural ~0 | 9: Materialtype *Betong / Granitt*, Kantsteinsprofil (*Holdeplasskantstein, Liten fas, Avrundet*), Avvisning. 48: Bredde gj.snitt 1.5–3.0 m, Belegning *Asfalt / Brostein*. 103: Type *Fartshump*, Profil *sirkel-30 / sirkel-40*, Bredde/Lengde ≈ 7.5 × 7.4 m |
| 5 | **838 Vegbredde, beregnet**, 616 Feltstrekning | town 50 + 300 (everywhere on public roads) | 838: Dekkebredde 7.0–8.3 m (min/max), Kjørebanebredde 6.5 m; 616: Antall kjørefelt (2), per direction, sykkel-/kollektivfelt |
| 6 | **45 Bomstasjon**, **24 Skiltportal**, **23 Vegbom**, **89 Signalanlegg**, **848 Snøskjerm**, 66 Skredoverbygg, 60 Bru | none in the town box; on main roads and passes | toll gantries, sign gantries, red/white booms, traffic lights, snow fences (line), avalanche sheds (cross-check of the OSM galleries), bridges (cross-check) |

Not registered well: **20 Kantstolper** (7 in 400 km²) and **98 Referansestolpe** (0): the black-and-white
delineator posts every ~50 m on rural roads are almost never in NVDB (see the side note at the end).

## Reference photos (Wikimedia Commons, free licences — model by these, do not ship them)

Downloaded 800 px copies and contact sheets: `scratchpad/refs/` (`sheet0.jpg`, `sheet1.jpg`, `index.json`).

| Use | File (Commons) | Licence / author | What to take from it |
|---|---|---|---|
| Markings, rural | [Bilvei, Karin Beate Nosterud.jpg](https://commons.wikimedia.org/wiki/File:Bilvei,_Karin_Beate_Nosterud.jpg) | CC BY 2.5, K. B. Nøsterud | yellow centre: solid double (sperrelinje) → dashed; white solid edge lines close to the asphalt edge |
| Markings + rail + lights | [E6 Vingnes sør.jpg](https://commons.wikimedia.org/wiki/File:E6_Vingnes_s%C3%B8r.jpg) | CC BY-SA 4.0, Vegard Gran | short yellow dashes with long gaps; W-beam steel rail on steel posts; tall masts with arm on one side |
| Rail + lights, motorway | [E6 Veldre nordover.jpg](https://commons.wikimedia.org/wiki/File:E6_Veldre_nordover.jpg) | CC BY-SA 4.0, Vegard Gran | rails both sides, light masts with arm, yellow edge line on the median side |
| Toll gantry (modern) | [Bomstasjon E18 Skinmo.jpg](https://commons.wikimedia.org/wiki/File:Bomstasjon_E18_Skinmo.jpg) | Public domain, P. Fiskerstrand | lattice gantry across the carriageway, camera poles, blue info signs |
| Toll gantry (older) | [AutomatiskBomstasjon2.jpg](https://commons.wikimedia.org/wiki/File:AutomatiskBomstasjon2.jpg) | CC BY-SA 3.0, P. Fiskerstrand | dark green portal frame, "Ikke stopp" board, roadside cabinet |
| Snow pole + concrete barrier | [Brøytepinne1.jpg](https://commons.wikimedia.org/wiki/File:Br%C3%B8ytepinne1.jpg) | CC0, T. Salemann | orange/red snow pole; New Jersey concrete barrier on a cut |
| Shelter, rural wooden | [Bus shelter Norway Feb 2014 - panoramio.jpg](https://commons.wikimedia.org/wiki/File:Bus_shelter_Norway_Feb_2014_-_panoramio.jpg) | CC BY-SA 3.0, Mikeiamunion21 | red/blue painted timber, glass sides, slate/shingle pitched roof, concrete pad |
| Shelter, wooden brown | [Leskur på Nisterud holdeplass.jpg](https://commons.wikimedia.org/wiki/File:Leskur_p%C3%A5_Nisterud_holdeplass.jpg) | CC BY 4.0, Svein Julton | dark-stained board walls, bench, metal roof, name board |
| Shelter, glass/aluminium | [Bus stop by Kvænangsveien, Sekkemo](https://commons.wikimedia.org/wiki/File:Bus_stop_by_Kv%C3%A6nangsveien_in_Sekkemo_of_Kv%C3%A6nangen,_Troms_og_Finnmark,_Norway,_2022_August.jpg) | CC BY-SA 4.0, Ximonic | white frame, blue lower panels, flat roof (northern style) |
| Crossing + kerb + pavement | [Fartshump eller fartspute … Hurdal.jpg](https://commons.wikimedia.org/wiki/File:Fartshump_eller_fartspute_ved_fotgjengerovergang_i_Hurdal.jpg) | CC BY-SA 4.0, Ø. Holmstad | raised kerb, pavement behind a grass strip, crossing signs, masts |
| Zebra + island + delineators | [Fv35 Hofveien ved Sundbyfoss](https://commons.wikimedia.org/wiki/File:Fv35_Hofveien_ved_Sundbyfoss_cropped.jpg) | CC BY-SA 4.0, P. Fiskerstrand | zebra staves, yellow hatched island with kerb, keep-right post, black/white delineator posts |
| Zebra, town | [Pedestrian crossing in Kirkenes.jpg](https://commons.wikimedia.org/wiki/File:Pedestrian_crossing_in_Kirkenes.jpg) | CC BY-SA 4.0, JIP | stave spacing on worn asphalt, granite kerb |
| Lights on wooden poles (rural) | [Stordal Kreisstraße 650 … img01.jpg](https://commons.wikimedia.org/wiki/File:Stordal_Kreisstra%C3%9Fe_650_lub_2025-07-29_img01.jpg) | CC BY 4.0, Lukas Beck | street light on a wooden power pole with a short arm (feed back to the lights task) |
| Lights + G/S-veg | [Hustadvika Atlanterhavsvegen …](https://commons.wikimedia.org/wiki/File:Hustadvika_Atlanterhavsvegen_lub_2025-07-26.jpg) | CC BY 4.0, Lukas Beck | single mast along a separate foot/cycle path |
| Snow fence | [Snow fence Hammerfest.jpg](https://commons.wikimedia.org/wiki/File:Snow_fence_Hammerfest.jpg) | CC BY-SA 3.0, E. Metyolkin | long grey timber lattice fence across the slope |
| Snow walls + posts | [Fv55 road at Sognefjellet, 2013 June.jpg](https://commons.wikimedia.org/wiki/File:Fv55_road_at_Sognefjellet,_2013_June.jpg) | CC BY-SA 3.0, Ximonic | mountain-pass poles, narrow road, edge lines |
| Mountain road, no rail | [Tindevegen-Hurrungbotn.jpg](https://commons.wikimedia.org/wiki/File:Tindevegen-Hurrungbotn.jpg) | CC BY-SA 4.0, B. C. Tørrissen | where NVDB has no rail, there is none: don't invent rails |

Rules and dimensions: Statens vegvesen handbooks [N101 Trafikksikkert sideterreng og vegsikringsutstyr](https://www.vegvesen.no/fag/publikasjoner/handboker/vegnormalene/n101/)
(rails; detail in the guide N-V160) and [N302 Vegoppmerking](https://www.vegvesen.no/fag/publikasjoner/handboker/vegnormalene/n302/)
(line types and dimensions; [Lærebok vegoppmerking, rapport 452](https://nmfv.dk/wp-content/uploads/2019/12/L%C3%A6rebok-vegoppmerking-Statens-Vegvesen-Rapport-Nr.-452.pdf)).
The dimensions below are the usual values; the implementer checks them against these PDFs and notes any change.

## Shared groundwork (phase 0, after the lights land)

- [ ] **One NVDB scenery fetch.** Generalise what the lights task adds to `NvdbSource`: `FetchObjects(typeId,
  bounds)` per coarse tile through GeoCache kind "nvdb" (already there), typed parsers per object type, NVDB
  unreachable → empty (decoration never blocks a drive). Fetch near the car first, inside the streaming
  `WorkBudget`; 1 request per type per tile, cached thereafter.
- [ ] **Road-relative placement helper.** For a point/line: nearest drawn road, signed side, offset from the
  carriageway edge, station along the road; height from the graded road/terrain, never NVDB Z; skip bridges' decks
  (unless the object is a bridge rail) and tunnels (`world.TunnelAt`). Re-run when a tile's roads are regraded
  (fixes the open "signs aren't re-placed after a regrade" point for every layer at once).
- [ ] **Prop layer pattern.** Per-tile data, meshes built within ~1 km / dropped beyond ~1.5 km, solids via
  `PropColliderPool` + `Footprints` (as signs and lights).

## 1. Guard rails (5 Rekkverk, 14 Rekkverksende) — first, biggest win on mountain roads

- [ ] Parse line geometry + Rekkverkstype, Skinneutrustning, Stolpeavstand (default 4 m), Bruksområde.
- [ ] Place along the road edge on the NVDB side, 0.5 m outside the shoulder, following the graded road profile.
- [ ] Models (one generator, four looks):
  - *Stålskinne m/trestolper*: galvanised W-beam (≈ 0.31 m tall profile, top ≈ 0.75 m), brown square timber posts
    every Stolpeavstand.
  - *m/stålstolper / sigma*: same beam on grey steel posts (C/sigma profile).
  - *Betong, New Jersey*: grey concrete, ≈ 0.8 m tall, sloped faces, 4–6 m elements with joints.
  - *Wire*: 3–4 steel cables on thin posts (median barriers).
  - *Tosidig* → beam on both faces; *dobbel* → two beams.
  - Rekkverksende: beam ramps down into the ground over ≈ 4–12 m (or a flared end).
- [ ] Solid for the car (layer Props), car not spawned inside; long rails as merged collider segments, not one per post.
- [ ] Replace or hand over the generic bridge rails where an NVDB rail covers the bridge (no double rails).
- [ ] Tests: parser fixtures, side and offset, ramp ends, collider present near the car; shots on a rural pass.

## 2. Road markings (99 langsgående, 519 tverrgående)

Today `Road.shader` paints a 3 m / 9 m dashed yellow centre and white edges on every road wider than 6 m.
- [ ] Per road stretch, a marking code from 99 (centre: none / dashed 1002 / varsellinje 1002-V / tettstedlinje
  1002-T / sperrelinje / double sperrelinje; edge: none / solid / dashed; colour) carried to the ribbon as vertex
  data or a small per-tile lookup texture; the shader draws the real pattern. Roads without NVDB markings keep
  today's rule (minor roads: none).
- [ ] Patterns (N302, verify): 1002 dashed 3 m line / 9 m gap; varsellinje 9 m / 3 m; sperrelinje solid; double
  sperrelinje two 0.1 m lines 0.1 m apart; edge line 0.1 m (0.15–0.2 on main roads), dashed edge 1 m / 2 m.
- [ ] 519 as decals on the road: gangfelt staves (0.5 m wide, 0.5 m gaps, count from Antall gangfeltstaver, length
  = Lengde/Bredde 3.0 m), vikelinje triangles (count from Antall viketrekanter), fartshump arrow marks.
- [ ] Tests: parser fixtures; pattern lookup per type; shader output sampled in a PreviewShots check.

## 3. Bus stops and shelters (487 Holdeplassutrustning, 25 Leskur)

- [ ] Lay-by: where Type is *Plattform og lomme*, widen the asphalt into a lay-by (≈ 3 m × 30–40 m with tapers)
  on the stop's side; kantstopp → no widening. Platform with Holdeplasskantstein (from item 4).
- [ ] Shelter where 25 exists (its polygon gives size and orientation) or Takoverbygg = Leskur. Three looks from the
  reference photos: *glass/aluminium* (Materialtype Herdet glass / Metall: white frame, blue lower panels, flat
  roof), *painted timber* (red/blue, pitched roof) and *dark wooden* — the latter two picked by a stable hash for
  rural stops without material. Bench inside, name board with Navn.
- [ ] Bus-stop sign comes from 96 Skiltplate (508 Holdeplass for buss) already: check it shows; don't add a second one.
- [ ] Shelters solid; the car is not spawned in a lay-by shelter.

## 4. Kerbs, pavements, speed bumps (9 Kantstein, 48 Fortau, 103 Fartsdemper) — towns

- [ ] Kerb line along the road edge: 0.12 m high (Holdeplasskantstein 0.18 m), granite grey or concrete from
  Materialtype; the car can bump up it (small step in the ground, not a wall).
- [ ] Pavement: raised asphalt band of Bredde gj.snitt (default 2 m) behind the kerb; brostein texture when Belegning
  says so. Carved into the terrain like the road shoulder.
- [ ] Speed bumps (owner 2026-11-22: **real bumps**): a real height profile in the road surface (Profil sirkel-30 / sirkel-40: circle-segment humps ≈ 0.10 m high over ≈ 3–4 m;
  verify in the speed-bump guide), across Bredde; the car feels it (CarSim ground height), painted with the 519 Fartshump marks.
- [ ] Tests: kerb/pavement placement on the correct side, bump height under the car, no bump on the wrong road.

## 5. Road width and lanes (838 Vegbredde beregnet, 616 Feltstrekning)

- [ ] Use Dekkebredde (or Kjørebanebredde) as the drawn width per stretch where it exists, instead of the OSM-tag
  estimate; 616 Antall kjørefelt sets lane count (centre line on 2-lane, lane lines on 3+).
- [ ] Riskiest item: width feeds the ribbon, carve, grading, bridges, tunnels, junction surfaces and car-on-road
  checks. Smooth width changes over ≥ 30 m; never narrower than the car + 1 m; keep junctions joined. Do it behind a
  flag first and compare seams/junction shots before/after.
- [ ] Tests: width lookup, smooth transitions, junction join unchanged, tile seams unchanged (TileSeamTests).

## 6. Structures (45 Bomstasjon, 24 Skiltportal, 23 Vegbom, 89 Signalanlegg, 848 Snøskjerm, 66, 60)

- [ ] **Toll gantry (45):** portal frame across all lanes (modern grey lattice or older dark-green portal with an
  "Ikke stopp" board), camera poles, roadside cabinet. Solid uprights.
- [ ] **Sign gantry (24):** portal or cantilever across the road; plates from 96 Skiltplate that belong to it are
  hung on it (not on posts).
- [ ] **Barrier (23 Vegbom):** red/white boom, open (up) unless the road is closed in the data.
- [ ] **Traffic lights (89):** signal heads on posts at the stop line (static, cycling colours as a nicety).
- [ ] **Snow fence (848):** grey timber lattice ≈ 3–4 m high along the line, solid.
- [ ] **66 Skredoverbygg / 60 Bru:** cross-check the OSM-generated galleries/bridges: log mismatches, and add an
  avalanche gallery where NVDB has one and OSM doesn't.
- [ ] Tests: each parser; gantry spans the full drawn width; solids near the car.

## 7. Speed cameras (162 ATK-punkt, 823 Streknings-ATK, 775 ATK influensstrekning) — added 2026-11-22

Owner: "Do look for databases for speed cameras in norway and try to include those".

Sources checked:
- **NVDB 162 ATK-punkt** is the official register; NVDB's product spec says one object is registered for every
  camera box on the road. There are 467 nationwide, which includes boxes that measure both ways or several
  lanes; press counts of ~308 boxes count locations. Properties: Navn ("Naustdalstunnelen 1 mot Førde"),
  **Kontrollretning** (with / against the road's metering direction), Kamera type, Fartsmåler type, Id nummer,
  Tilleggsinformasjon ("I tunnel"); parent relation to its 775 or 823 stretch.
- **NVDB 823 Streknings-ATK**: 86 section-control lines (average speed between two boxes), Navn, Kontrollretning,
  children = its ATK-punkt at start and end.
- **NVDB 775 ATK, influensstrekning**: 307 lines, "Strekning med ATK-punkter" / "Streknings-ATK": the signed
  stretch the cameras cover (where the 556 "Automatisk trafikkontroll" signs stand).
- Not used: data.norge.no / dataut.vegvesen.no "Fotoboks" is a metadata entry with no downloadable data;
  NVDB 163 Kamera (14 237) is traffic-surveillance webcams, not speed cameras; OSM `highway=speed_camera` is
  less complete than NVDB.
- The 556 warning signs already come from 96 Skiltplate; check they show in ATK stretches.

Work:
- [ ] Parse 162 (point, direction from Kontrollretning and the road's metering direction via `lokasjon`), 823
  and 775; same fetch/cache path as phase 0.
- [ ] Model from the Commons photos in `scratchpad/refs2/` ([Photobox.jpg](https://commons.wikimedia.org/wiki/File:Photobox.jpg) public domain;
  [Fotobox ved E18.jpg](https://commons.wikimedia.org/wiki/File:Fotobox_ved_E18.jpg) CC BY-SA 3.0, Friman;
  [Speed camera, E6 Østfold.JPG](https://commons.wikimedia.org/wiki/File:Speed_camera,_E6_%C3%98stfold.JPG) CC BY-SA 3.0, Thomas M. Hansen):
  a tall off-white / light grey box (≈ 0.45 m wide, 1.1 m tall, 0.4 m deep) with a tapered (pyramid) underside,
  a small round lens window near the top and a large round red flash window below, on a ≈ 2.5 m grey round pole
  with a concrete foot, facing the controlled traffic, beside the road on that
  side; boxes "I tunnel" on the tunnel wall. Solid (Props layer).
- [ ] Gameplay (proposal, owner to confirm): passing a camera in its direction above the speed limit (105 data the
  game already has) fires a white flash and a HUD note "FOTOBOKS 87 / 60". Streknings-ATK: on entering the section
  the HUD shows "STREKNINGS-ATK", and at the exit compares the average speed with the limit. A tally on the stage
  result screen; no time penalty unless the owner wants one.
- [ ] Tests: parser fixtures (direction both ways), trigger only in the controlled direction and above the limit,
  average-speed computation over a section, flash/HUD in a PlayMode test.

## 8. Traffic webcams with the real view (DATEX II CCTV via the open WFS) — added 2026-11-22

Owner: "The traffic webcams should show as little cameras on poles, street lights etc and should be URL linked to
the real video stream allowing user to see the real view if he wants. (is this possible?)" — **yes**, checked
2026-11-22:
- The DATEX II pull API (`datex-server-get-v3-1…/GetCCTVSiteTable`) needs a registered account (401) — not usable
  from a public page. But the **open WFS** `https://ogckart-sn1.atlas.vegvesen.no/datex_3_1/ows`, layer
  `datex_3_1:CctvSimple_v2`, needs no key and sends `Access-Control-Allow-Origin: *`; GeoJSON with `bbox`.
  919 cameras: `CAMERA_ID` ("3000371_2"), `DESCRIPTION` ("Hemsedalsfjellet"), `ORIENTATION_DESCRIPTION` (the place
  it looks toward, "Borlaug"), `ROAD_NUMBER`, `STILL_IMAGE_URL` (`https://kamera.atlas.vegvesen.no/api/images/<id>`,
  1024×576 JPEG, refreshed every few minutes), `STATUS_STILL_IMAGE_AVAILABILITY` (26 faulty), `VIDEO_SERVICE_LEVEL`
  1 + `VIDEO_ENCODING_STANDARD` hls on **144** cameras. The video URL is in the full `datex_3_1:Cctv` layer
  (`urlLinkAddress`): `https://kamera.vegvesen.no/public/<id>/manifest.m3u8` (HLS, 800×600, CORS `*`).
  Public viewer page: `https://webkamera.atlas.vegvesen.no/public/kamera?id=<id>`. Licence NLOD, credit Statens
  vegvesen (already in the attribution line). Cameras can be offline or show an old image: show its timestamp.
- NVDB 163 Kamera (14 237, mostly tunnel/traffic CCTV without public images) is used only to pick the mount for a
  DATEX camera within ~15 m: Oppsettingsutstyr *Lysmast* (on a street light from the lights task), *Egen
  mast/stolpe*, *Skiltstolpe*, *Vegg* (tunnel / building wall).

Work:
- [ ] Fetch `CctvSimple_v2` per coarse tile (bbox, GeoCache with a short TTL, e.g. 1 day for positions; images are
  never cached), plus the HLS URL for the video cameras (one `Cctv` request per tile filtered to
  `VIDEO_SERVICE_LEVEL=1`, or build it from the id pattern and verify).
- [ ] Model: a small dark grey camera housing (≈ 0.35 m) with a sun shield on a bracket, on its own ≈ 6–8 m pole, on
  a street-light mast, on a sign post or on a wall per the NVDB mount; aimed along the road toward
  `ORIENTATION_DESCRIPTION` (resolve the place with the stedsnavn search the route map already uses; fall back to
  the road direction). Cameras with video get a small red "live" lamp.
- [ ] Interaction: within ~150 m the HUD shows "VEGKAMERA Hemsedalsfjellet → Borlaug · V: see the real view"
  (V is free). V or a click opens a viewer overlay in the WebGL page (`index.html`, outside Unity): the still image
  (`<img>`, reloaded every 60 s, with its time) or, for the 144 video cameras, the live stream (`<video>` + hls.js
  from cdnjs, pinned version; Safari plays HLS natively), and a link "Open at vegvesen.no" to the public viewer.
  The game pauses while the viewer is open; Esc closes it. Editor/desktop builds: `Application.OpenURL` to the
  public viewer page.
- [ ] Route map: optional camera icons (toggle) so a player can drive to a camera.
- [ ] Tests: WFS parse fixture (simple + full layer), mount pick from NVDB 163, aim toward the place, HUD prompt in
  range only, viewer URL per camera (image vs video), no request to the image host until the viewer opens.

## Order, size and checks

| Phase | Items | Size | Why this order |
|---|---|---|---|
| 0 | groundwork | S–M | after lights; shared by everything |
| A | 1 rails | M | most visible on rally roads, good rural coverage |
| B | 2 markings | M | every main road, shader-only + data |
| C | 3 bus stops, 4 kerbs/pavements/bumps | M–L | town realism; bumps touch physics |
| D | 6 structures | M | rare but striking on main roads and passes |
| D2 | 7 speed cameras | M | after structures (same prop pattern); owner asked 2026-11-22 |
| D3 | 8 webcams with the real view | M | after lights (mount on masts); owner asked 2026-11-22 |
| E | 5 width/lanes | L, risky | touches road geometry everywhere; last, behind a flag |

Each phase: EditMode + PlayMode green, editor PreviewShots before/after (one rural pass, one town), WebDev build
in Chrome (loads, feature visible, no console errors), frame-budget check (no new stutter: worst stage frame
stays ≤ 0.15 s), CHANGES.md / unity/README-world.md / ARCHITECTURE.md, attribution unchanged (NLOD, already shown).
Committed and pushed per phase after my verification.

## Owner answers (2026-11-22)

1. Order: OK.
2. Speed bumps: real bumps.
3. Delineator / snow poles: skip for now. (Was: side note, not NVDB: rural roads in Norway have black/white **delineator posts** (kantstolper) every ~50 m and
   orange **snow poles** in winter, but NVDB hardly registers them. Add them procedurally on roads without lights
   or rails as a phase F?)
4. Speed cameras: include (item 7). Open: flash + HUD note only, or a time penalty too?
5. Webcams with the real view: include (item 8).

## Review
