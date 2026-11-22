using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;
using Rally.Geo;
using Rally.World;

namespace Rally.Gameplay
{
    /// <summary>The data a coarse tile's overlay is made of; each type is fetched, applied and retried on its own.</summary>
    [Flags]
    public enum OverlayData { None = 0, Roads = 1, Features = 2, Cover = 4, Surfaces = 8, Signs = 16, Lights = 32 }

    /// <summary>What has landed for one coarse tile, and what the overlay has not applied yet.</summary>
    public sealed class TileOverlay
    {
        public RoadGraphData Roads;
        public Features Features;
        public CoverRaster Cover;
        public List<RoadSurfaceLine> Surfaces;
        public SignSet Signs;
        public LightSet Lights;
        /// <summary>Landed since the overlay last applied it.</summary>
        public OverlayData Pending;
        /// <summary>The first NVDB surface answer (or its failure) is in: the roads wait for that once, never for a retry.</summary>
        public bool SurfacesTried;
        /// <summary>The roads are graded and drawn: signs and lights can be placed against them.</summary>
        public bool RoadsIn;
        /// <summary>An overlay for the tile is queued or stepping (new data joins it).</summary>
        public bool Queued;
    }

    /// <summary>
    /// One pause (<see cref="CircuitBreaker"/>) per data service: a service that fails is left alone for
    /// <see cref="CircuitBreaker.OpenMs"/> and only its own data waits; the others keep loading.
    /// </summary>
    public sealed class ServiceBreakers
    {
        public readonly CircuitBreaker Overpass, Nvdb, Sr16, Dtm;

        public ServiceBreakers(CircuitBreaker overpass = null, Func<double> nowMs = null)
        {
            Overpass = overpass ?? new CircuitBreaker(nowMs);
            Nvdb = new CircuitBreaker(nowMs); Sr16 = new CircuitBreaker(nowMs); Dtm = new CircuitBreaker(nowMs);
        }

        public string NameOf(CircuitBreaker b) => b == Overpass ? "Overpass" : b == Nvdb ? "NVDB" : b == Sr16 ? "SR16" : b == Dtm ? "DTM" : "?";

        /// <summary>The paused services for the HUD, e.g. "NVDB paused 42 s"; empty when none is.</summary>
        public string Paused()
        {
            var sb = new StringBuilder();
            foreach (var b in new[] { Overpass, Nvdb, Sr16, Dtm })
                if (b.IsOpen) sb.Append(sb.Length > 0 ? ", " : "").Append(NameOf(b)).Append(" paused ").Append(Math.Ceiling(b.RemainingMs / 1000)).Append(" s");
            return sb.ToString();
        }
    }

    /// <summary>
    /// The overlay data of a coarse tile, one lane per type: OSM roads (a road region's answer, RoadRegions) and OSM map
    /// features (the tile's own answer; both Overpass), SR16 forest, NVDB
    /// surfaces, signs and lights. Each lane asks until it has an answer: no answer (or a failure) pauses that type's service
    /// (<see cref="ServiceBreakers"/>) and asks again after the pause or <see cref="RetryMs"/>, without delaying or asking
    /// the other types again. A landed answer is stored in the <see cref="TileOverlay"/> and reported at once.
    /// The fetch functions return null for "no answer".
    /// </summary>
    public sealed class OverlayFetch
    {
        public Func<Bounds25833, CancellationToken, Task<RoadGraphData>> Roads;
        public Func<Bounds25833, CancellationToken, Task<Features>> Features;
        public Func<Bounds25833, CancellationToken, Task<CoverRaster>> Cover;
        public Func<Bounds25833, CancellationToken, Task<List<RoadSurfaceLine>>> Surfaces;   // optional
        public Func<Bounds25833, CancellationToken, Task<SignSet>> Signs;                     // optional
        public Func<Bounds25833, CancellationToken, Task<LightSet>> Lights;                   // optional
        public ServiceBreakers Breakers = new ServiceBreakers();
        /// <summary>The wait before asking again (a test steps it by hand).</summary>
        public Func<double, CancellationToken, Task> Delay = (ms, ct) => Task.Delay(TimeSpan.FromMilliseconds(ms), ct);
        public double RetryMs = CircuitBreaker.RetryMs;

        /// <summary>One data type still outstanding: how many tiles wait for it, and its service's pause (0 when not paused).</summary>
        public readonly struct Waiting
        {
            public readonly string Name; public readonly int Tiles; public readonly double PausedMs; public readonly string Service;
            public Waiting(string name, int tiles, double pausedMs, string service) { Name = name; Tiles = tiles; PausedMs = pausedMs; Service = service; }
            public override string ToString() => PausedMs > 0 ? $"{Name} {Tiles} (paused {System.Math.Ceiling(PausedMs / 1000)} s)" : $"{Name} {Tiles}";
        }

        /// <summary>
        /// What the world waits for, in a fixed order (terrain, OSM roads, OSM features, NVDB surfaces / signs / lights, forest): the types with
        /// tiles outstanding — <paramref name="terrainTiles"/> without their DTM, and each type not landed in <paramref name="tiles"/>
        /// (types without a source are not waited for) — each with its service's pause.
        /// </summary>
        public List<Waiting> Outstanding(int terrainTiles, IEnumerable<TileOverlay> tiles)
        {
            int roads = 0, features = 0, surfaces = 0, signs = 0, lights = 0, cover = 0;
            foreach (var d in tiles)
            {
                if (d.Roads == null) roads++;
                if (d.Features == null) features++;
                if (Surfaces != null && d.Surfaces == null) surfaces++;
                if (Signs != null && d.Signs == null) signs++;
                if (Lights != null && d.Lights == null) lights++;
                if (d.Cover == null) cover++;
            }
            var list = new List<Waiting>();
            void Add(string name, int n, CircuitBreaker b) { if (n > 0) list.Add(new Waiting(name, n, b.RemainingMs, Breakers.NameOf(b))); }
            Add("terrain", terrainTiles, Breakers.Dtm);
            Add("OSM roads", roads, Breakers.Overpass);
            Add("OSM features", features, Breakers.Overpass);
            Add("NVDB surfaces", surfaces, Breakers.Nvdb);
            Add("NVDB signs", signs, Breakers.Nvdb);
            Add("NVDB lights", lights, Breakers.Nvdb);
            Add("forest", cover, Breakers.Sr16);
            return list;
        }

        /// <summary>"waiting: terrain 24 · OSM roads 13 (paused 40 s) · …"; with <paramref name="max"/> the first ones and "+n".</summary>
        public static string WaitingText(List<Waiting> w, int max = int.MaxValue)
        {
            if (w.Count == 0) return "";
            var sb = new StringBuilder("waiting: ");
            for (int i = 0; i < w.Count && i < max; i++) sb.Append(i > 0 ? " · " : "").Append(w[i]);
            if (w.Count > max) sb.Append(" +").Append(w.Count - max);
            return sb.ToString();
        }

        /// <summary>The query boxes: NVDB surfaces and lights reach beyond the tile (GameController).</summary>
        public Func<TileKey, Bounds25833> SurfaceBounds = k => k.Bounds, LightBounds = k => k.Bounds;

        /// <summary>
        /// Fetch every type for <paramref name="key"/> into <paramref name="d"/>; <paramref name="landed"/> is called (on the
        /// awaiting context) as each one lands. Ends when every lane has its answer or <paramref name="live"/> turns false.
        /// </summary>
        public Task Fetch(TileKey key, TileOverlay d, Func<bool> live, Action<OverlayData> landed, CancellationToken ct)
        {
            var lanes = new List<Task>
            {
                Lane(key, "OSM roads", Breakers.Overpass, c => Roads(key.Bounds, c), live, v => { d.Roads = v; d.Pending |= OverlayData.Roads; landed(OverlayData.Roads); }, null, ct),
                Lane(key, "OSM map features", Breakers.Overpass, c => Features(key.Bounds, c), live, v => { d.Features = v; d.Pending |= OverlayData.Features; landed(OverlayData.Features); }, null, ct),
                Lane(key, "SR16 forest", Breakers.Sr16, c => Cover(key.Bounds, c), live, v => { d.Cover = v; d.Pending |= OverlayData.Cover; landed(OverlayData.Cover); }, null, ct),
            };
            if (Surfaces != null)
                lanes.Add(Lane(key, "NVDB road surfaces", Breakers.Nvdb, c => Surfaces(SurfaceBounds(key), c), live,
                    v => { d.Surfaces = v; d.Pending |= OverlayData.Surfaces; landed(OverlayData.Surfaces); },
                    () => { if (!d.SurfacesTried) { d.SurfacesTried = true; landed(OverlayData.None); } }, ct));
            else d.SurfacesTried = true;
            if (Signs != null) lanes.Add(Lane(key, "NVDB signs", Breakers.Nvdb, c => Signs(key.Bounds, c), live, v => { d.Signs = v; d.Pending |= OverlayData.Signs; landed(OverlayData.Signs); }, null, ct));
            if (Lights != null) lanes.Add(Lane(key, "NVDB street lights", Breakers.Nvdb, c => Lights(LightBounds(key), c), live, v => { d.Lights = v; d.Pending |= OverlayData.Lights; landed(OverlayData.Lights); }, null, ct));
            return Task.WhenAll(lanes);
        }

        async Task Lane<T>(TileKey key, string what, CircuitBreaker breaker, Func<CancellationToken, Task<T>> fetch, Func<bool> live, Action<T> got, Action tried, CancellationToken ct) where T : class
        {
            for (;;)
            {
                T value = null;
                if (!breaker.IsOpen)
                {
                    try { value = await fetch(ct); }
                    catch (OperationCanceledException) when (ct.IsCancellationRequested) { return; }
                    catch (Exception e) { RallyLog.Info($"overlay: {key} {what} failed: {e.Message}"); }
                    if (value == null && !breaker.IsOpen)
                    {
                        breaker.Trip();
                        RallyLog.Warn($"overlay: {Breakers.NameOf(breaker)} paused {CircuitBreaker.OpenMs / 1000:0} s ({what} of {key} got no answer); other data keeps loading");
                    }
                }
                if (ct.IsCancellationRequested || !live()) return;
                tried?.Invoke();
                if (value != null) { got(value); return; }
                double ms = breaker.IsOpen ? Math.Max(1000, breaker.RemainingMs) : RetryMs;
                RallyLog.Info($"overlay: {key} {what}: no answer, asking again in {ms / 1000:0} s");
                try { await Delay(ms, ct); }
                catch (OperationCanceledException) { return; }
                if (!live()) return;
            }
        }
    }
}
