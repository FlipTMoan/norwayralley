# Car models

One folder per car: `<car-name>/` with the model file (GLB/glTF or FBX),
its textures and a `LICENSE.txt` carrying the licence and attribution line.
Only CC0 or CC BY models go here (the files are public in this repo); see
`unity/docs/car-models.md` for the vetted list and the excluded ones.

| Folder | Model | Licence | Credit line |
|---|---|---|---|
| `porsche-930-wolfgames/` | 911 TURBO 930_Improved | CC BY 4.0 | Porsche 911 (930) Turbo 1975 by Lexyc16, improved by Wolf Hal (WolfGames36), CC BY 4.0 |
| `porsche-911-wotiger/` | Porsche 911 (1970s) | CC BY 4.0 | Porsche 911 by WoTiger (Philipp Busse), CC BY 4.0 |
| `retro-bricchi/` | Retro Car With Interior (PSX) | CC BY | Retro Car With Interior by Bricchi Games, CC BY 4.0 |

After import: set the model scale so the wheelbase matches `CarSpec`
(Porsche 2.45 m), make a prefab with the body mesh under `Body`, the four
wheels under `WheelFL/FR/RL/RR`, and assign it to `CarController` (slots are
documented in `Runtime/Vehicle/CarController.cs`).
