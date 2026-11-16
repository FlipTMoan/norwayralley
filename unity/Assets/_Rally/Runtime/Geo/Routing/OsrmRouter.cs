using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// stage.js OSRM section: real roads from the Open Source Routing Machine. The public demo
    /// servers route driving (router.project-osrm.org) and foot / bike (routing.openstreetmap.de).
    /// Pins snap to the nearest road within <see cref="SnapRadius"/> (1 km): <c>/nearest</c> first,
    /// then the <c>/route</c> request carries the radius too, and OSRM's <c>NoSegment</c> becomes the
    /// friendly "no road within 1 km" message. Long routes are asked in ~4 km hops
    /// (<see cref="RouteSegmented"/>) because the public servers time out or degrade long routes.
    /// </summary>
    public sealed class OsrmRouter : IRouter
    {
        public const double SnapRadius = 1000;
        public const double MaxStageLength = 30000;   // metres of merged master track
        public const double SegmentLength = 4000;     // metres of straight line per request
        public const int RouteTimeoutMs = 12000, NearestTimeoutMs = 8000;

        public static string Endpoint(RouteProfile p) => p switch
        {
            RouteProfile.Foot => "https://routing.openstreetmap.de/routed-foot/route/v1/foot",
            RouteProfile.Cycling => "https://routing.openstreetmap.de/routed-bike/route/v1/bike",
            _ => "https://router.project-osrm.org/route/v1/driving",
        };

        public static string ProfileName(RouteProfile p) => p switch { RouteProfile.Foot => "foot", RouteProfile.Cycling => "cycling", _ => "driving" };

        readonly CachedSource<string> cache;
        public OsrmRouter(IGeoCache cache) { this.cache = CachedSource<string>.Text(cache, "osrm"); }

        static string Num(double v) => v.ToString("R", CultureInfo.InvariantCulture);

        /// <summary>stage.js <c>osrmRouteUrl</c>; a NaN radius is "unlimited", all NaN omits the parameter.</summary>
        public static string RouteUrl(string baseUrl, IReadOnlyList<LatLon> points, IReadOnlyList<double> radiuses = null)
        {
            var coords = new string[points.Count];
            for (int i = 0; i < points.Count; i++) coords[i] = $"{Num(points[i].Lon)},{Num(points[i].Lat)}";
            string url = $"{baseUrl}/{string.Join(";", coords)}?overview=full&geometries=geojson&steps=false";
            bool any = false;
            if (radiuses != null) foreach (var r in radiuses) if (!double.IsNaN(r)) any = true;
            if (any)
            {
                var parts = new string[points.Count];
                for (int i = 0; i < points.Count; i++) parts[i] = i < radiuses.Count && !double.IsNaN(radiuses[i]) ? Num(radiuses[i]) : "unlimited";
                url += "&radiuses=" + string.Join(";", parts);
            }
            return url;
        }

        public static string NearestUrl(RouteProfile profile, LatLon p)
            => $"{Endpoint(profile).Replace("/route/", "/nearest/")}/{Num(p.Lon)},{Num(p.Lat)}?number=3";

        /// <summary>stage.js <c>nearestWithin</c>: the first waypoint within <paramref name="radius"/> (NaN = any), or null.</summary>
        public static NearestResult? NearestWithin(Dictionary<string, object> data, double radius = SnapRadius)
        {
            if (data == null || data.Str("code") != "Ok") return null;
            var waypoints = data.Arr("waypoints");
            if (waypoints == null) return null;
            foreach (var wo in waypoints)
            {
                if (!(wo is Dictionary<string, object> wp)) continue;
                var loc = wp.Arr("location");
                if (loc == null || loc.Count < 2) continue;
                double distance = wp.Num("distance", 0);
                if (!double.IsNaN(radius) && distance > radius) continue;
                var name = wp.Str("name");
                return new NearestResult(new LatLon((double)loc[1], (double)loc[0]), string.IsNullOrEmpty(name) ? null : name, distance);
            }
            return null;
        }

        public async Task<NearestResult?> Nearest(LatLon p, RouteProfile profile, double radiusM, CancellationToken ct)
        {
            string url = NearestUrl(profile, p);
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(NearestTimeoutMs);
            string text;
            try
            {
                text = await cache.Get(url, async () =>
                {
                    try { return await Http.GetText(url, NearestTimeoutMs, cts.Token); }
                    catch (HttpException e) when (e.Status > 0) { throw new RouteException($"OSRM did not answer (HTTP {e.Status})."); }
                });
            }
            catch (RouteException) { throw; }
            catch (OperationCanceledException) when (!ct.IsCancellationRequested) { throw new RouteException("OSRM took too long to answer."); }
            catch (Exception e) when (!(e is OperationCanceledException)) { throw new RouteException(e.Message ?? "OSRM could not be reached."); }
            return NearestWithin(Json.ParseObject(text), radiusM);
        }

        /// <summary>stage.js <c>fetchOsrmGeometry</c>.</summary>
        public async Task<RouteResult> Route(LatLon a, LatLon b, RouteProfile profile, CancellationToken ct, double radiusA = SnapRadius, double radiusB = SnapRadius)
        {
            string url = RouteUrl(Endpoint(profile), new[] { a, b }, new[] { radiusA, radiusB });
            string text;
            try
            {
                text = await cache.Get(url, async () =>
                {
                    using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                    cts.CancelAfter(RouteTimeoutMs);
                    try { return await Http.GetText(url, RouteTimeoutMs, cts.Token); }
                    catch (HttpException e) when (e.Status > 0) { throw new RouteException($"OSRM did not answer (HTTP {e.Status})."); }
                    catch (OperationCanceledException) when (!ct.IsCancellationRequested) { throw new RouteException("OSRM took too long to answer. Choose off-road routing, or try again."); }
                    catch (Exception e) when (!(e is OperationCanceledException)) { throw new RouteException("OSRM could not be reached. Check the connection, or choose off-road routing."); }
                });
            }
            catch (RouteException) { throw; }
            var data = Json.ParseObject(text);
            string prof = ProfileName(profile);
            if (data.Str("code") == "NoSegment")
                throw new RouteException($"No {prof} road within {SnapRadius / 1000} km of a picked point. Move the pin nearer a mapped road/trail, or route by off-road.");
            var routes = data.Arr("routes");
            if (data.Str("code") != "Ok" || routes == null || routes.Count == 0)
                throw new RouteException(data.Str("message") ?? "OSRM found no route between those coordinates.");

            var route = (Dictionary<string, object>)routes[0];
            var waypoints = data.Arr("waypoints");
            double snappedA = WaypointDistance(waypoints, 0), snappedB = WaypointDistance(waypoints, 1);
            string snapText = !double.IsNaN(snappedA) && !double.IsNaN(snappedB)
                ? $" Snapped {Math.Round(snappedA)} m / {Math.Round(snappedB)} m from the picked points."
                : "";
            double distance = route.Num("distance", 0);

            // A 30 m route from two points 300 m apart means OSRM snapped both picks to the same
            // trailhead or road stub. Preikestolen's hiking paths do this a lot.
            double straight = Haversine(a, b);
            if (distance < 25 || (straight > 80 && distance < straight * 0.35))
                throw new RouteException($"OSRM snapped both points to the same road or trail ({Math.Round(distance)} m route for a {Math.Round(straight)} m gap).{snapText} Pick points on a mapped road/trail, or route by off-road.");
            // The pins are snapped within SnapRadius before the request and the request carries the
            // radius; this only catches an unlimited end (a segment joint) that wandered off.
            if ((!double.IsNaN(snappedA) && snappedA > SnapRadius) || (!double.IsNaN(snappedB) && snappedB > SnapRadius))
            {
                double worst = Math.Max(double.IsNaN(snappedA) ? 0 : snappedA, double.IsNaN(snappedB) ? 0 : snappedB);
                throw new RouteException($"OSRM snapped a point {Math.Round(worst)} m away from where you picked, too far to make a fair stage.{snapText} Pick points nearer to a mapped road/trail, or route by off-road.");
            }

            var result = new RouteResult { DistanceM = distance, DurationS = route.Num("duration", 0), Profile = profile, SnappedA = snappedA, SnappedB = snappedB, SnapText = snapText };
            var coords = route.Obj("geometry")?.Arr("coordinates");
            if (coords != null)
                foreach (var co in coords)
                    if (co is List<object> c && c.Count >= 2) result.Coordinates.Add(new LatLon((double)c[1], (double)c[0]));
            if (result.Coordinates.Count < 2) throw new RouteException("OSRM returned an empty geometry.");
            return result;
        }

        /// <summary>
        /// stage.js <c>fetchOsrmGeometrySegmented</c>: the straight line between the picks is divided
        /// into ~4 km hops and the answers are merged. Only the two real ends are held to the snap
        /// radius; the joints may snap to any road.
        /// </summary>
        public async Task<RouteResult> RouteSegmented(LatLon a, LatLon b, RouteProfile profile, CancellationToken ct, ProgressCallback progress = null, double segmentLength = SegmentLength)
        {
            double straight = Haversine(a, b);
            int hops = Math.Max(1, (int)Math.Ceiling(straight / segmentLength));
            if (hops <= 1)
            {
                var single = await Route(a, b, profile, ct);
                progress?.Invoke(1, "Route received.");
                return single;
            }
            var merged = new RouteResult { Profile = profile };
            for (int i = 0; i < hops; i++)
            {
                progress?.Invoke((float)i / hops, $"OSRM segment {i + 1} of {hops}…");
                var p = Lerp(a, b, (double)i / hops);
                var q = Lerp(a, b, (double)(i + 1) / hops);
                var g = await Route(p, q, profile, ct, i == 0 ? SnapRadius : double.NaN, i == hops - 1 ? SnapRadius : double.NaN);
                int startAt = merged.Coordinates.Count > 0 ? 1 : 0; // skip the duplicated joint
                for (int k = startAt; k < g.Coordinates.Count; k++) merged.Coordinates.Add(g.Coordinates[k]);
                merged.DistanceM += g.DistanceM;
                merged.DurationS += g.DurationS;
                if (i == 0) merged.SnappedA = g.SnappedA;
                merged.SnappedB = g.SnappedB;
            }
            progress?.Invoke(1, $"Merged {hops} segments.");
            if (merged.Coordinates.Count < 2) throw new RouteException("The segmented route came back empty.");
            if (merged.DistanceM > MaxStageLength)
                throw new RouteException($"That route is {merged.DistanceM / 1000:F1} km long. The streamer covers stages up to {Math.Round(MaxStageLength / 1000)} km — pick closer points.");
            return merged;
        }

        static double WaypointDistance(List<object> waypoints, int i)
            => waypoints != null && i < waypoints.Count && waypoints[i] is Dictionary<string, object> wp ? wp.Num("distance") : double.NaN;

        static LatLon Lerp(LatLon a, LatLon b, double t) => new LatLon(a.Lat + (b.Lat - a.Lat) * t, a.Lon + (b.Lon - a.Lon) * t);

        /// <summary>Great-circle distance in metres (geo.js <c>haversine</c>).</summary>
        public static double Haversine(LatLon a, LatLon b)
        {
            const double R = 6371000, Deg = Math.PI / 180;
            double dLat = (b.Lat - a.Lat) * Deg, dLon = (b.Lon - a.Lon) * Deg;
            double h = Math.Pow(Math.Sin(dLat / 2), 2) + Math.Cos(a.Lat * Deg) * Math.Cos(b.Lat * Deg) * Math.Pow(Math.Sin(dLon / 2), 2);
            return 2 * R * Math.Asin(Math.Min(1, Math.Sqrt(h)));
        }
    }
}
