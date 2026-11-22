# Plan 2026-11-22 — Unity: street lights along the roads; other Statens vegvesen data

Owner: "the unity game should also have realistic light posts along the roads, double check which other APIs
statens veivesen has that can be used for realistic scenes"

## Research: what NVDB (Les API v4) offers for scenery

The game already reads **96 Skiltplate**, **105 Fartsgrense** and **241 Vegdekke** (`Geo/Signs/NvdbSource.cs`).
Counted on 2026-11-22 in the 2 × 2 km test box (Lillehammer, `256000,6781000,258000,6783000`) and in a rural
4 × 4 km box (Rogaland):

| Type | What it is | Town box | Rural box | Useful properties |
|---|---|---|---|---|
| 87 Belysningspunkt | one street light (point, with Z) | 589 | 3 | Plassering (Lysmast), Avstand fra vegkant (≈1.0 m), Bruksområde (Veg/gate, Gangfelt, G/S-veg); children 181 + 88 |
| 181 Lysmast | the mast | 143 | 0 | Type (Stålmast rett/konisk…), **Mastelengde synlig** 8/9/10/12 m, **Utligger** Ja/Nei, **Utliggerarmens lengde** 0/2 m, RAL-kode, Ettergivende |
| 88 Lysarmatur | the lamp head | 143 | 4 | Høyde over veg, Armaturtype (Veglys), Lyskilde (LED), Fargetemperatur 4000 K, Lumen |
| 86 Belysningsstrekning | stretch of lit road (line) | 9 | 3 | Avstand innbyrdes 30–50 m, "Bel.pkt en side av veg" |
| 5 Rekkverk / 14 Rekkverksende | guard rail (line) | 65 / 54 | 3 / 5 | Rekkverkstype (steel w/ wood posts, steel w/ sigma posts, concrete New Jersey), Skinneutrustning one/two-sided, Stolpeavstand |
| 487 Holdeplassutrustning / 25 Leskur | bus stop, shelter (polygon) | 34 / 6 | 1 / 0 | Navn, Takoverbygg, Type (platform + lay-by) |
| 9 Kantstein, 48 Fortau | kerb, pavement | 90 / 56 | 13 / 0 | lines |
| 99 / 519 Vegoppmerking | road markings along / across | 30 / 48 | 2 / 4 | centre/edge line types, stop lines |
| 174 Gangfelt, 103 Fartsdemper | zebra crossing, speed bump | 30 / 25 | 0 / 5 | points/lines |
| 60 Bru, 67 Tunnelløp, 69 Tunnelportal, 66 Skredoverbygg, 848 Snøskjerm | structures | | | (bridges/tunnels come from OSM today) |
| 23 Vegbom, 45 Bomstasjon, 24 Skiltportal, 89 Signalanlegg | barriers, toll, gantries, traffic lights | | | |
| 98 Referansestolpe, 20 Kantstolper | km posts, delineator posts | 0 here | | registered on few roads |
| 616 Feltstrekning, 838 Vegbredde beregnet, 639/640 Kurvatur | lanes, road width, curvature | | | road width per stretch |

Other Statens vegvesen services (not used now): **DATEX II** (traffic messages, road weather stations, webcams;
needs a free registered account, so not usable from a public web page), **Trafikkdata API** (trafikkdata.no,
open GraphQL, traffic counts: no scene value), **Vegkart** (viewer over the same NVDB data). NVDB Les is open,
NLOD, CORS-enabled, needs only the `X-Client` header — the right source for scenery.

**Recommendation after lights (owner to choose):** 5 Rekkverk with its real rail type (biggest visual win on
mountain roads), then 99 Vegoppmerking (real centre/edge lines), then 487/25 bus stops + shelters, 838 road width.

## Work: street lights (this task)

- [x] **Data.** `NvdbSource.FetchLights(bounds)`: 87 Belysningspunkt (point + Avstand fra vegkant + Bruksområde),
  181 Lysmast (Mastelengde synlig, Utligger, Utliggerarmens lengde; joined to its 87 parent via relasjoner or by
  position ≤ 0.5 m), 86 Belysningsstrekning (line + Avstand innbyrdes). GeoCache kind "nvdb" like signs; NVDB
  unreachable → no lights, never an error. Fallback where NVDB has no points: OSM `highway=street_lamp` nodes if the
  Overpass query already returns nodes cheaply; otherwise skip (say which in the review).
- [x] **Stretch fill.** On a 86 stretch with no 87 points, place posts every Avstand innbyrdes (default 40 m) on one
  side (right side in the stretch's digitising direction), 1 m outside the drawn road edge.
- [x] **Placement.** Snap to the drawn road: foot on the terrain/road height (not the NVDB Z), outside the shoulder,
  never on the carriageway, a bridge deck, or inside a tunnel (use `world.TunnelAt`). Arm points over the road.
  Re-place when a road is regraded (the open point "signs aren't re-placed after a regrade" applies here too: do it
  for lights).
- [x] **Model.** Galvanised grey steel mast (tapered), height from Mastelengde (default 8 m town / 10 m main road),
  optional 2 m arm, flat LED head (light grey housing, faint warm emissive underside). Instanced/one mesh per tile
  like `SignLayer`, built within ~1000 m, dropped beyond ~1500 m.
- [x] **Solid.** Masts are solid for the car like sign posts (`PropColliderPool`, layer Props) and are in
  `Footprints` so the car is never placed inside one.
- [x] **Tests.** Parse fixtures (87/181/86 JSON), stretch fill spacing/side, placement outside the road and not in
  tunnels, collider present near the car. EditMode + PlayMode all green.
- [ ] **Check.** Editor PreviewShots at a lit town road (Lillehammer test box) and a rural road; WebDev build loads
  in Chrome, lights visible, no console errors.
- [x] **Docs.** CHANGES.md (2026-11-22), unity/README-world.md, ARCHITECTURE.md, attribution unchanged (NLOD).

## Review

### Street lights (done 2026-11-22)
- **Cause:** the Unity world had no street lights; NVDB has them (verified against the live datakatalog 2026-11-22: 87
  Plassering 1874, Avstand fra vegkant 1883, Bruksområde 1272; 181 Mastelengde synlig 1338, Utligger 3895,
  Utliggerarmens lengde 10020; 86 Avstand innbyrdes 1714, Bruksområde 1271). Lillehammer box: 589 points (446 without
  mast data), 143 masts (8/10/9/12 m; 28 with a 2 m arm, all on Hamarvegen), 9 stretches.
- **Changed:** `Geo/Sources/ILightSource.cs` (LightPoint/LightStretch/LightSet), `NvdbSource.FetchLights` + parsers
  (`relasjoner` join, else ≤ 0.5 m), `World/Lights/LightPlacement.cs`, `LightMesh.cs`, `LightLayer.cs` (Rally/Tunnel
  material), `FakeSources.Lights`, `GameController` (fetch with tile + 40 m, overlay step `.ov.lights`, `Invalidate` on
  a regrade, drop/dispose), `TileWorld.Lights` + `RefreshColliders` (mast capsules move at once on a car placement — the
  placement check `IsFree` sees them; chosen over a Footprints entry because masts already are PropColliderPool capsules).
- **OSM fallback:** skipped — the Overpass query asks for ways only (`out geom` of way filters); `street_lamp` nodes would
  need a new query part.
- **Numbers (live, after):** tile Coarse(125,3311) 502 masts built (3 from stretches), 34 638 vertices; Lillehammer centre
  tile (123,3314): 183 + 20 placed, 225 not on a mast (wall/roof lamps), 19 off the drawn roads, 5 on a bridge/in a tunnel.
  No "collider pool full" warnings. Sauda (rural): unchanged shots.
- **Shots:** `scratchpad/lights/pairs/` (town Hamarvegen + Messenlivegen, rural Sauda), before = HEAD via stash.
- **Tests:** EditMode `LightTests` (7: fixtures from the live API in `Tests/EditMode/World/Fixtures`, cache, stretch fill
  spacing/side, placement outside the road / crossing road / tunnel / off-road / wall lamp, mesh, layer + colliders +
  regrade rebuild, fake source); PlayMode `LightPlayTests` (2: fake scene mesh on Rally/Tunnel; car reset onto a mast is
  placed clear — fails without the RefreshColliders hook).
- **Open:** points dropped as "away from the roads" when a neighbour tile's roads are not in yet are not re-placed later
  (same as signs); sign posts are still not refreshed on placement; no light pools at night (no night mode); masts beside
  G/S paths that OSM draws but the game skips are dropped.

