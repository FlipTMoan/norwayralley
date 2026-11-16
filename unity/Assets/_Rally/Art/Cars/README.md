# Car models

One folder per car: `<car-name>/` with the model file (GLB/glTF or FBX),
its textures and a `LICENSE.txt` carrying the licence and attribution line.
Only CC0 or CC BY models go here (the files are public in this repo); see
`unity/docs/car-models.md` for the vetted list and the excluded ones.

| Folder | Model | Licence | Credit line |
|---|---|---|---|
| `911-turbo-930-improved/` | 911 TURBO 930_Improved (FBX) | CC BY 4.0 | Porsche 911 (930) Turbo 1975 by Lexyc16, improved by Wolf Hal (WolfGames36), CC BY 4.0 |
| `porsche-911/` | Porsche 911 (1970s) (FBX) | CC BY 4.0 | Porsche 911 by WoTiger (Philipp Busse), CC BY 4.0 |
| `porsche-911-32-carrera-coupe/` | Porsche 911 3.2 Carrera Coupe 1986 (FBX) | CC BY 4.0 | Porsche 911 3.2 Carrera Coupe by cepela, CC BY 4.0 |
| `volvo-240-styled-sedan-car-downloadable/` | Volvo 240 GL + Turbo (FBX) | CC BY 4.0 | Volvo 240 styled sedan by Libau Media, CC BY 4.0 |
| `placeholder-mv6-83-low-poly-model/` | Placeholder MV6 '83, generic Group B (FBX) | CC BY 4.0 | Placeholder MV6 '83 by Daniel Zhabotinsky, CC BY 4.0 |
| `low-poly-1980-porsche-911-turbo/` | Low Poly 1980 Porsche 911 Turbo (.blend only: export to FBX) | CC BY 4.0 | Low Poly 1980 Porsche 911 Turbo by 3DShinobi, CC BY 4.0 |
| `ford-ranger-offroad/` | Ford Ranger Offroad (FBX, 62 k faces) | CC BY 4.0 | Ford Ranger Offroad by CursedCrown, CC BY 4.0 |

Each folder has a `LICENSE.txt` with the same line. Archives (`*.zip`,
`*.rar`) are gitignored: unpack, commit the model files only.

After import: set the model scale so the wheelbase matches `CarSpec`
(Porsche 2.45 m), make a prefab with the body mesh under `Body`, the four
wheels under `WheelFL/FR/RL/RR`, and assign it to `CarController` (slots are
documented in `Runtime/Vehicle/CarController.cs`).
