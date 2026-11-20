using System;

namespace Rally.Vehicle
{
    /// <summary>
    /// What the start screen, the room and the credits know about each car: the wire id (stored in localStorage
    /// <c>rally.car</c> and sent to the other players; "porsche" and "buggy" are the JS game's), the name, the model's
    /// CC BY credit line and the short stats line on its card. <see cref="Choosable"/> is the chooser order; a car whose
    /// prefab is not in the scene (a model not imported yet) is simply not offered.
    /// </summary>
    public static class Garage
    {
        public sealed class CarInfo
        {
            public CarKind Kind;
            public string Id, Name, Credit;
        }

        public static readonly CarInfo[] All =
        {
            new CarInfo { Kind = CarKind.Porsche, Id = "porsche", Name = "Porsche 911", Credit = "Porsche 911 by WoTiger (Philipp Busse), CC BY 4.0" },
            new CarInfo { Kind = CarKind.Carrera, Id = "carrera", Name = "911 Carrera 3.2", Credit = "Porsche 911 3.2 Carrera Coupe by cepela, CC BY 4.0" },
            new CarInfo { Kind = CarKind.Turbo930, Id = "turbo930", Name = "911 Turbo (930)", Credit = "Porsche 911 (930) Turbo 1975 by Lexyc16, improved by Wolf Hal (WolfGames36), CC BY 4.0" },
            new CarInfo { Kind = CarKind.Volvo240, Id = "volvo240", Name = "Volvo 240 Turbo", Credit = "Volvo 240 styled sedan by Libau Media, CC BY 4.0" },
            new CarInfo { Kind = CarKind.Mv6, Id = "mv6", Name = "MV6 '83 Group B", Credit = "Placeholder MV6 '83 by Daniel Zhabotinsky, CC BY 4.0" },
            new CarInfo { Kind = CarKind.Ranger, Id = "ranger", Name = "Ford Ranger Offroad", Credit = "Ford Ranger Offroad by CursedCrown, CC BY 4.0" },
            new CarInfo { Kind = CarKind.Baja, Id = "baja", Name = "Baja Bug", Credit = "Off Road 4X4 racer by duanesmind, CC BY 4.0" },
            new CarInfo { Kind = CarKind.Type736, Id = "type736", Name = "Buggy Type 736", Credit = "Buggy type 736 by Andre_rmntc, CC BY 4.0" },
            new CarInfo { Kind = CarKind.Buggy, Id = "buggy", Name = "Formula Offroad", Credit = "" },   // the JS game's buggy: physics only, no model
        };

        /// <summary>Chooser order (the JS-only Formula Offroad is not offered).</summary>
        public static readonly CarKind[] Choosable = { CarKind.Porsche, CarKind.Carrera, CarKind.Turbo930, CarKind.Volvo240, CarKind.Mv6, CarKind.Ranger, CarKind.Baja, CarKind.Type736 };

        public static CarInfo Info(CarKind kind)
        {
            foreach (var c in All) if (c.Kind == kind) return c;
            return All[0];
        }

        /// <summary>Wire / localStorage id → kind; unknown or empty ids are the 911.</summary>
        public static CarKind Parse(string id)
        {
            foreach (var c in All) if (string.Equals(c.Id, id, StringComparison.OrdinalIgnoreCase)) return c.Kind;
            return CarKind.Porsche;
        }

        /// <summary>The card's stats line: game horsepower, mass, driven wheels, gears, and the turbo.</summary>
        public static string Stats(in CarSpec s)
            => $"{s.Power / 745.7f:0} hp · {s.Mass:0} kg · {(s.Drive == DriveType.All ? "4WD" : "RWD")} · {s.GearCount - 1}-speed{(s.TurboLag > 0f ? " · turbo" : "")}";
    }
}
