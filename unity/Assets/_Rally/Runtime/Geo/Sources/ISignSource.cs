using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    public enum SignFacing : byte { Unknown, With, Against, Both }
    public enum RoadSide : byte { Unknown, Left, Right }

    /// <summary>One NVDB Skiltplate (type 96), as signs.js <c>parseSignPlate</c>.</summary>
    public sealed class SignPlate
    {
        public long Id;
        /// <summary>Norwegian sign number, e.g. "362.50" or "729".</summary>
        public string Number;
        /// <summary>The rest of the NVDB value after the number ("Fartsgrense 50 km/t").</summary>
        public string Label;
        /// <summary>Free text on the plate (road names on 729).</summary>
        public string Text;
        public SignFacing Facing;
        public RoadSide Side;
        public Utm33 Position;
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
