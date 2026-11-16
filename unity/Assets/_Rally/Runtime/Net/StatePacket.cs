using System;
using System.Collections.Generic;
using Rally.Geo;

namespace Rally.Net
{
    /// <summary>
    /// Compact car state for the wire (multiplayer.js <c>encodeState</c>, about 90 bytes as JSON):
    /// <c>{ t:'s', x, y, z, h, p, r, v, k, n }</c>. Positions are in the room's shared frame — the JS
    /// client's local projection (x east, y up, z south, metres from the stage anchor) — so a Unity
    /// client converts from its UTM frame before sending (World layer). Rounded like the JS so a packet
    /// from either client is byte-compatible.
    /// </summary>
    public struct StatePacket
    {
        public double X, Y, Z;
        public double Yaw, Pitch, Roll;
        public double Speed;
        public string Kind;
        public string Name;
        /// <summary>Set by the host when fanning out: who this state belongs to ('host' or a peer id).</summary>
        public string From;

        public Dictionary<string, object> Encode()
        {
            var m = new Dictionary<string, object>
            {
                { "t", "s" },
                { "x", Math.Round(X, 2) }, { "y", Math.Round(Y, 2) }, { "z", Math.Round(Z, 2) },
                { "h", Math.Round(Yaw, 3) }, { "p", Math.Round(Pitch, 3) }, { "r", Math.Round(Roll, 3) },
                { "v", Math.Round(Speed, 1) },
                { "k", Kind }, { "n", Name },
            };
            if (From != null) m["from"] = From;
            return m;
        }

        public static StatePacket Decode(Dictionary<string, object> m) => new StatePacket
        {
            X = m.Num("x", 0), Y = m.Num("y", 0), Z = m.Num("z", 0),
            Yaw = m.Num("h", 0), Pitch = m.Num("p", 0), Roll = m.Num("r", 0),
            Speed = m.Num("v", 0), Kind = m.Str("k"), Name = m.Str("n"), From = m.Str("from"),
        };
    }
}
