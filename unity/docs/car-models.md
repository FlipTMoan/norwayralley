# Ready-made car models for the Unity build

_Researched 2026-11-16. Licence, format and triangle counts were read from
each model page (Sketchfab public API) unless marked "not verified"._

## What qualifies

The model files are committed to this public repo and shipped on GitHub
Pages, so only licences that allow redistribution qualify: **CC0** or
**CC BY 4.0** (credit author, title, licence, link, note modifications).

- **Unity Asset Store free assets do not qualify.** The Asset Store EULA
  licenses distribution only as embedded in the built product and forbids
  copying the raw assets, so Rally Cars (Ash Dev), ARCADE: FREE Racing Car,
  Free low poly car pack, FREE CAR PACK and Free Adventure Vehicles cannot
  be committed. They could only be used gitignored and imported locally.
- **Sketchfab downloads need a free account** (sign in, then "Download 3D
  Model" gives the original file plus glTF/GLB, which Unity's glTFast
  package imports directly).
- **Excluded as game rips** despite a CC BY tag (the uploader cannot grant
  it): "porsche 911 sc rally" (Asphalt), "Ford Escort MK2 Rally Car" and
  "Lancia Stratos HF Gr.4" tagged Super Rally 3D, "Pocket Rally – Lancia
  Stratos", "1979 fiat 131 abarth rally", stonnymaku1976's NFS 911, and the
  "1965–2002 Rally Cars" pack (provenance unverified).
- Excluded for NC/SA/ND terms: ddiaz-design 1982 930, outpiston 1972 RS /
  1974 Targa (CC BY-NC-SA), alhertenberger Lancia Fulvia (CC BY-ND).
- CGTrader/Free3D/TurboSquid "free" models use site licences that forbid
  redistributing the files: not pursued.
- Trademark: the Porsche shape belongs to Porsche AG. Low risk for a free
  open-source game; Daniel Zhabotinsky's generic rally cars avoid it.

## Recommendation

**Realistic preset**
1. **911 TURBO 930_Improved** by WolfGames36 (Wolf Hal), derived from
   Lexyc16's "Porsche 911 (930) Turbo 1975". CC BY 4.0, 61 k tris,
   wheels, windows, lights and hood already separated for rigging.
   https://sketchfab.com/3d-models/911-turbo-930improved-acdbf6d555f949afa91e0cc6f6215f19
   Credit: "Porsche 911 (930) Turbo 1975 by Lexyc16, improved by Wolf Hal
   (WolfGames36), CC BY 4.0". Interior unknown until downloaded.
2. **Porsche 911 (1970s)** by WoTiger. CC BY 4.0, 22 k tris, PBR.
   https://sketchfab.com/3d-models/porsche-911-e5d5f35870344bd4a005ef5599a63313
3. **Porsche 911 3.2 Carrera Coupe (1986)** by cepela. CC BY 4.0, 21.5 k
   tris, weathered rally look.
   https://sketchfab.com/3d-models/porsche-911-32-carrera-coupe-26953936409c4ee7b9de11caa37e52f1

Second cars: Lancia Stratos by Jorma Rysky (33 k, CC BY 4.0,
https://sketchfab.com/3d-models/lancia-stratos-ef6b13d03de341269217d720db93ab0e),
Audi Quattro S1 by TonyWony (46.5 k, CC BY 4.0,
https://sketchfab.com/3d-models/audi-quattro-s1-402697365eaa41a68a543b71d0e0bfa8),
Volvo 240 by Libau Media (63 k for two trims, separate objects, CC BY 4.0,
https://sketchfab.com/3d-models/volvo-240-styled-sedan-car-downloadable-66697669831b47cea7874fc8c4544e74),
Renault 5 Turbo by Cosmo_312 (15.7 k, CC BY 4.0,
https://sketchfab.com/3d-models/renault-5-turbo-low-poly-145b026b63194f0d9a729857a5a402ce).
Trademark-free: Sanremo '70 / Placeholder MV6 '83 / Asti Stradale '89 by
Daniel Zhabotinsky (13–21 k, CC BY 4.0 with an explicit grant to modify and
embed), e.g.
https://sketchfab.com/3d-models/placeholder-mv6-83-low-poly-model-d78bdfc34e024ac7926853f9ae863190

**Retro low-poly preset**
1. **Retro Car With Interior (PSX)** by Bricchi Games, itch.io. CC BY, 3 k
   tris, 12 parts including 4 separate wheels and a detailed interior; .blend,
   .FBX, PNG. The only candidate with both wheels and cockpit verified.
   https://bricchi-games.itch.io/retro-car-with-interior
2. **Low Poly 1980 Porsche 911 Turbo** by 3DShinobi, CC BY 4.0, 3.5 k.
   https://sketchfab.com/3d-models/low-poly-1980-porsche-911-turbo-a33e84dd9b3849519cb91b3a5ae0cf01
   Extras: Ford Escort RS1600 1970 by slowpoly (1.3 k, CC BY 4.0,
   https://sketchfab.com/3d-models/ford-escort-rs1600-1970-6e95c7713c1c43b3b9b981d3ccfe5e32),
   Renault 5 Turbo PS1 style by valtiel (788 tris, separate wheels, CC BY 4.0,
   https://sketchfab.com/3d-models/renault-5-turbo-low-poly-ps1-style-car-16bbc360c6884eb69ad578c339cba27c).

**Traffic / NPC cars (CC0 kits, glTF, separate wheels)**
- Low Poly Cars free tier by Cosmo: https://cosmo-art.itch.io/low-poly-cars
- Free Low Poly Vehicles Pack by RGS_Dev (21 vehicles): https://rgsdev.itch.io/free-low-poly-vehicles-pack
- Kenney Car Kit (CC0, OBJ/FBX/glTF, contents not verified): https://kenney.nl/assets/car-kit
- Quaternius Cars Pack (CC0, FBX/OBJ): https://quaternius.com/packs/cars.html

Over budget but best-looking 930: "FREE 1975 Porsche 911 (930) Turbo" by
Lionsharp Studios, 241 k tris, CC BY 4.0, only with heavy decimation.

Not found under CC0/CC BY: Saab 96, a clean Ford Escort Mk2, a 1980s Toyota
Celica.

## Import notes

- Put models under `unity/Assets/_Rally/Art/Cars/<name>/` with the licence
  text and the attribution line in a `LICENSE.txt` next to the files, and
  add the line to `CREDITS.md` and the start screen.
- glTF/GLB imports through `com.unity.cloud.gltfast` (in the manifest);
  FBX imports natively. Set the import scale so the wheelbase matches
  `CarSpec` (Porsche 2.45 m) and point the four wheel transforms at
  `CarController`'s wheel slots; a model without separate wheels needs them
  split in Blender first.
- Keep LOD0 under ~60 k tris; generate LOD1/LOD2 with Unity's mesh
  simplification or Blender decimate for the chase and overhead cameras.
