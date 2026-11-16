using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>OSRM profiles the map offers (stage.js <c>OSRM_ENDPOINTS</c>); off-road A* is not a router profile.</summary>
    public enum RouteProfile { Driving, Foot, Cycling }

    /// <summary>A snapped pin: stage.js <c>nearestWithin</c> result.</summary>
    public readonly struct NearestResult
    {
        public readonly LatLon Point;
        public readonly string Name;
        public readonly double DistanceM;
        public NearestResult(LatLon p, string name, double distance) { Point = p; Name = name; DistanceM = distance; }
    }

    /// <summary>stage.js <c>fetchOsrmGeometry</c> result.</summary>
    public sealed class RouteResult
    {
        public List<LatLon> Coordinates = new List<LatLon>();
        public double DistanceM, DurationS;
        public RouteProfile Profile;
        /// <summary>How far each end snapped (NaN when OSRM gave none).</summary>
        public double SnappedA = double.NaN, SnappedB = double.NaN;
        public string SnapText = "";
    }

    /// <summary>A routing failure with the player-facing message the JS shows in the map status line.</summary>
    public sealed class RouteException : Exception
    {
        public RouteException(string message) : base(message) { }
    }

    public interface IRouter
    {
        /// <summary>
        /// Road geometry between two picks. <paramref name="radiusA"/>/<paramref name="radiusB"/> limit how far
        /// each end may snap (NaN = unlimited); the default is <see cref="OsrmRouter.SnapRadius"/> for both.
        /// </summary>
        Task<RouteResult> Route(LatLon a, LatLon b, RouteProfile profile, CancellationToken ct,
            double radiusA = OsrmRouter.SnapRadius, double radiusB = OsrmRouter.SnapRadius);

        /// <summary>Nearest road of the profile within <paramref name="radiusM"/> (NaN = unlimited); null when none.</summary>
        Task<NearestResult?> Nearest(LatLon p, RouteProfile profile, double radiusM, CancellationToken ct);
    }
}
