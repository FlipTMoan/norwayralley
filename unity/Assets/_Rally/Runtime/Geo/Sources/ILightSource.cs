using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// One NVDB Belysningspunkt (type 87): a street light's point, with what its Lysmast (type 181) child says about the
    /// mast. NaN / false where NVDB has nothing (most points in a town have no mast object).
    /// </summary>
    public sealed class LightPoint
    {
        public long Id;
        public Utm33 Position;
        /// <summary>Height from the NVDB geometry (not used for the foot: the drawn ground is), NaN when absent.</summary>
        public double Height = double.NaN;
        /// <summary>"Plassering": false for a light on a wall, a rail, a gantry, in a roof or in the pavement (no mast to draw).</summary>
        public bool OnMast = true;
        /// <summary>"Avstand fra vegkant" (m), NaN when absent.</summary>
        public double FromEdge = double.NaN;
        /// <summary>"Bruksområde": Veg/gate, Gangfelt, Gang- og sykkelveg …</summary>
        public string Use;
        /// <summary>Lysmast "Mastelengde, synlig" (m), NaN when absent.</summary>
        public double MastLength = double.NaN;
        /// <summary>Lysmast "Utligger" = Ja.</summary>
        public bool Arm;
        /// <summary>Lysmast "Utliggerarmens lengde" (m), NaN when absent.</summary>
        public double ArmLength = double.NaN;
    }

    /// <summary>One NVDB Belysningsstrekning (type 86): a lit stretch of road as a polyline.</summary>
    public sealed class LightStretch
    {
        public long Id;
        public List<Utm33> Points = new List<Utm33>();
        /// <summary>"Avstand, innbyrdes": metres between the posts, 0 when absent.</summary>
        public double Spacing;
        /// <summary>"Bruksområde": Veg/gate, Gang-/sykkelveg, Tunnel …</summary>
        public string Use;
    }

    public sealed class LightSet
    {
        public List<LightPoint> Points = new List<LightPoint>();
        public List<LightStretch> Stretches = new List<LightStretch>();
        public static readonly LightSet Empty = new LightSet();
    }

    public interface ILightSource
    {
        Task<LightSet> FetchLights(Bounds25833 bounds, CancellationToken ct);
    }
}
