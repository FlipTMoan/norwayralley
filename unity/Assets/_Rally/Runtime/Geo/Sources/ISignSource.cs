using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// NVDB "Ansiktsside, rettet mot": With / Against = the face is turned to traffic travelling in / against the road's
    /// metering direction; Both = a two-sided plate; TowardRoad / AwayFromRoad = mounted parallel to the road
    /// ("Parallelt mot veg" / "fra veg"), the face turned to or from the carriageway.
    /// </summary>
    public enum SignFacing : byte { Unknown, With, Against, Both, TowardRoad, AwayFromRoad }
    /// <summary>NVDB sideposisjon, relative to the metering direction.</summary>
    public enum RoadSide : byte { Unknown, Left, Right }
    /// <summary>NVDB "Størrelse" (Liten / Middels / Stor størrelse); Medium when absent.</summary>
    public enum SignSize : byte { Medium, Small, Large }

    /// <summary>One NVDB Skiltplate (type 96), as signs.js <c>parseSignPlate</c>.</summary>
    public sealed class SignPlate
    {
        public long Id;
        /// <summary>Norwegian sign number, e.g. "362.50" or "729".</summary>
        public string Number;
        /// <summary>The whole sign code before the label, variant letters included: "906V", "713.H", "U722.3", "362.50".</summary>
        public string Code;
        public SignSize Size;
        /// <summary>The rest of the NVDB value after the number ("Fartsgrense 50 km/t").</summary>
        public string Label;
        /// <summary>Free text on the plate (road names on 729).</summary>
        public string Text;
        public SignFacing Facing;
        public RoadSide Side;
        public Utm33 Position;
        /// <summary>NVDB Plasseringskode (5128): the plate's place on its post, lowest on top (10, 20, 30 …); 0 when not registered.</summary>
        public int Order;
        /// <summary>Height from the NVDB geometry, NaN when absent.</summary>
        public double Height = double.NaN;
        /// <summary>Speed in km/h for 362/366 plates, 0 otherwise.</summary>
        public int SpeedKmh => (Number != null && (Number.StartsWith("362.") || Number.StartsWith("366."))
            && int.TryParse(Number.Substring(4), out var v)) ? v : 0;
    }

    /// <summary>One NVDB Fartsgrense (type 105) polyline (signs.js <c>parseSpeedLimit</c>).</summary>
    public sealed class SpeedLimitSegment
    {
        public int Kmh;
        public List<Utm33> Points = new List<Utm33>();
    }

    public sealed class SignSet
    {
        public List<SignPlate> Plates = new List<SignPlate>();
        public List<SpeedLimitSegment> SpeedLimits = new List<SpeedLimitSegment>();
        public static readonly SignSet Empty = new SignSet();
    }

    public interface ISignSource
    {
        Task<SignSet> FetchSigns(Bounds25833 bounds, CancellationToken ct);
    }
}
