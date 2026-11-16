using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// Offline stand-ins for every source so the editor and the tests run without a network: a flat
    /// DEM with one bump, a single straight road through the middle of each chunk, one house beside it,
    /// no forest, no signs, and a router that draws the straight line. Keep them boring: they exist to
    /// exercise the pipeline, not to look like Norway.
    /// </summary>
    public static class FakeSources
    {
        public sealed class Dem : IDemSource
        {
            public float BaseHeight = 50f, BumpHeight = 12f, BumpRadius = 120f;
            public Utm33 BumpAt;

            public Task<HeightGrid> Fetch(Bounds25833 b, float cellM, CancellationToken ct, ProgressCallback progress = null)
            {
                int n = (int)Math.Round(b.Width / cellM) + 1;
                var grid = new HeightGrid(n, cellM, b.Min);
                for (int r = 0; r < n; r++)
                for (int c = 0; c < n; c++)
                {
                    double dx = b.MinE + c * cellM - BumpAt.E, dy = b.MinN + r * cellM - BumpAt.N;
                    double d = Math.Sqrt(dx * dx + dy * dy) / BumpRadius;
                    grid[c, r] = BaseHeight + (d < 1 ? BumpHeight * (float)(0.5 + 0.5 * Math.Cos(Math.PI * d)) : 0f);
                }
                progress?.Invoke(1, "Fake elevation.");
                return Task.FromResult(grid);
            }
        }

        /// <summary>A straight east–west residential road through the chunk centre, and one house 20 m north of it.</summary>
        public sealed class Osm : IRoadSource, IFeatureSource
        {
            public Task<RoadGraphData> FetchRoads(Bounds25833 b, CancellationToken ct)
            {
                double n = (b.MinN + b.MaxN) / 2;
                var way = new RoadWay { Id = 1, Tags = { { "highway", "residential" }, { "name", "Testvegen" }, { "surface", "asphalt" } } };
                for (double e = b.MinE; e <= b.MaxE; e += 50) way.Nodes.Add(new Utm33(e, n));
                return Task.FromResult(new RoadGraphData { Ways = { way } });
            }

            public Task<Features> FetchFeatures(Bounds25833 b, CancellationToken ct)
            {
                double e0 = (b.MinE + b.MaxE) / 2, n0 = (b.MinN + b.MaxN) / 2 + 20;
                var house = new Building
                {
                    Id = 2,
                    Tags = { { "building", "house" } },
                    Polygon = { new Utm33(e0 - 5, n0 - 4), new Utm33(e0 + 5, n0 - 4), new Utm33(e0 + 5, n0 + 4), new Utm33(e0 - 5, n0 + 4), new Utm33(e0 - 5, n0 - 4) },
                };
                return Task.FromResult(new Features { Buildings = { house } });
            }
        }

        public sealed class Landcover : ILandcoverSource
        {
            public Task<CoverRaster> FetchCover(Bounds25833 b, CancellationToken ct)
                => Task.FromResult(new CoverRaster(Sr16Source.Pixels(b.Width), Sr16Source.Pixels(b.Height), b));
        }

        public sealed class Signs : ISignSource
        {
            public Task<SignSet> FetchSigns(Bounds25833 b, CancellationToken ct) => Task.FromResult(new SignSet());
        }

        /// <summary>Straight line between the picks at 50 m steps; every point is "on a road".</summary>
        public sealed class Router : IRouter
        {
            public Task<RouteResult> Route(LatLon a, LatLon b, RouteProfile profile, CancellationToken ct, double radiusA = OsrmRouter.SnapRadius, double radiusB = OsrmRouter.SnapRadius)
            {
                double d = OsrmRouter.Haversine(a, b);
                int steps = Math.Max(1, (int)(d / 50));
                var r = new RouteResult { DistanceM = d, DurationS = d / 15, Profile = profile, SnappedA = 0, SnappedB = 0 };
                for (int i = 0; i <= steps; i++)
                {
                    double t = (double)i / steps;
                    r.Coordinates.Add(new LatLon(a.Lat + (b.Lat - a.Lat) * t, a.Lon + (b.Lon - a.Lon) * t));
                }
                return Task.FromResult(r);
            }

            public Task<NearestResult?> Nearest(LatLon p, RouteProfile profile, double radiusM, CancellationToken ct)
                => Task.FromResult<NearestResult?>(new NearestResult(p, "Testvegen", 0));
        }

        public sealed class Cache : IGeoCache
        {
            readonly GeoCache inner = new GeoCache(new MemoryBackend());
            public long Budget => inner.Budget;
            public Task<byte[]> Fetch(string key, Func<Task<byte[]>> loader, string kind, bool isText = false) => inner.Fetch(key, loader, kind, isText);
            public Task<CacheStats> Stats() => inner.Stats();
            public Task Clear() => inner.Clear();
        }
    }
}
