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

        /// <summary>
        /// An east–west residential road through the chunk centre (straight, or a sine of <see cref="Wiggle"/> m
        /// amplitude so a stage on it has bends), and one house 20 m north of it. Each chunk's way has its own id
        /// (the graph grades a way once per id) and its ends sit on the chunk edges, so neighbouring chunks join
        /// there: the only junctions are 2 km apart, like a long rural road.
        /// </summary>
        public sealed class Osm : IRoadSource, IFeatureSource
        {
            public double Wiggle = 0, WiggleWavelength = 800;

            public double RoadN(Bounds25833 b, double e) => (b.MinN + b.MaxN) / 2 + Wiggle * Math.Sin(2 * Math.PI * e / WiggleWavelength);

            public Task<RoadGraphData> FetchRoads(Bounds25833 b, CancellationToken ct)
            {
                long id = 1 + (((long)Math.Floor(b.MinE / b.Width) & 0xffffff) << 24 | ((long)Math.Floor(b.MinN / b.Height) & 0xffffff));
                var way = new RoadWay { Id = id, Tags = { { "highway", "residential" }, { "name", "Testvegen" }, { "surface", "asphalt" } } };
                for (double e = b.MinE; e <= b.MaxE; e += 50) way.Nodes.Add(new Utm33(e, RoadN(b, e)));
                return Task.FromResult(new RoadGraphData { Ways = { way } });
            }

            public Task<Features> FetchFeatures(Bounds25833 b, CancellationToken ct)
            {
                double e0 = (b.MinE + b.MaxE) / 2, n0 = RoadN(b, e0) + 20;
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

        /// <summary>
        /// A few real-looking plates beside the <see cref="Osm"/> road of each chunk (6 m off its centre line): a speed
        /// limit, a bend warning with a distance plate under it, a direction sign with a county-road shield and a
        /// two-sided end-of-limit, plus a 60 km/h stretch in the speed limits. Empty without <see cref="Road"/>.
        /// </summary>
        public sealed class Signs : ISignSource
        {
            public Osm Road;

            public Task<SignSet> FetchSigns(Bounds25833 b, CancellationToken ct)
            {
                var set = new SignSet();
                if (Road == null) return Task.FromResult(set);
                long id = 1000 + (((long)Math.Floor(b.MinE / b.Width) & 0xffff) << 16 | ((long)Math.Floor(b.MinN / b.Height) & 0xffff)) * 16;
                SignPlate Plate(int k, double e, double side, string code, string label, string text = null, SignFacing facing = SignFacing.Unknown)
                    => new SignPlate { Id = id + k, Number = NvdbSource.SignNumber(code), Code = code, Label = label, Text = text, Facing = facing, Position = new Utm33(e, Road.RoadN(b, e) + side) };
                set.Plates.Add(Plate(0, b.MinE + 150, -6, "362.60", "Fartsgrense 60 km/t"));
                set.Plates.Add(Plate(1, b.MinE + 400, -6, "100.2", "Farlig sving til venstre"));
                set.Plates.Add(Plate(2, b.MinE + 400, -6, "802", "Avstand", "150 m"));
                set.Plates.Add(Plate(3, b.MinE + 650, 6, "713.H", "Vanlig vegviser, Høyre", "@723.15@$520$Sauda 3@31@"));
                set.Plates.Add(Plate(4, b.MinE + 900, 6, "146.1", "Elg"));
                set.Plates.Add(Plate(5, b.MinE + 1150, -6, "364.60", "Slutt på særskilt fartsgrense 60 km/t", null, SignFacing.Both));
                var limit = new SpeedLimitSegment { Kmh = 60 };
                for (double e = b.MinE + 150; e <= b.MinE + 1150; e += 50) limit.Points.Add(new Utm33(e, Road.RoadN(b, e)));
                set.SpeedLimits.Add(limit);
                return Task.FromResult(set);
            }
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
