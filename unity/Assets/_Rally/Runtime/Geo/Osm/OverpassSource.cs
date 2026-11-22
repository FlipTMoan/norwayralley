using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// buildings.js <c>fetchOsmChunk</c> + <c>parseElements</c>, as two cached Overpass answers: the roads of a box
    /// (<see cref="IRoadSource"/>, the light roads-only query, asked per road region) and a tile's buildings, land cover, water
    /// and power lines (<see cref="IFeatureSource"/>, the heavy one). Geometry is converted to EPSG:25833 on parse. A box that
    /// got no answer (every mirror down) returns null and is not cached, so the next ask tries the network again.
    /// </summary>
    public sealed class OverpassSource : IRoadSource, IFeatureSource
    {
        /// <summary>buildings.js MAX_PER_CHUNK × 2: stop parsing footprints in a dense town.</summary>
        public const int MaxBuildings = 440;

        readonly CachedSource<string> cache, roadsCache;
        readonly IGeoCache store;
        public readonly OverpassMirrors Mirrors;

        public OverpassSource(IGeoCache cache, OverpassMirrors mirrors = null)
        {
            Mirrors = mirrors ?? new OverpassMirrors();
            store = cache;
            this.cache = CachedSource<string>.Text(cache, "osm", Mirrors.Breaker);
            roadsCache = CachedSource<string>.Text(cache, "osmroads", Mirrors.Breaker);
            if (cache is GeoCache g) Contains = g.Contains;
        }

        /// <summary>Is a key stored (no network)? Set for a cache view that is not the GeoCache itself (a route download's).</summary>
        public Func<string, Task<bool>> Contains;

        /// <summary>Is the tile's version 2 answer (roads and features in one) in the cache? Read without touching the network.</summary>
        public async Task<bool> HasOldTile(Bounds25833 tile)
            => Contains != null && await Contains(OverpassQuery.OldCacheKey(LatLonBounds.Of(tile)));

        readonly Dictionary<string, (Task<OsmChunk> chunk, int uses)> oldChunks = new Dictionary<string, (Task<OsmChunk>, int)>();

        /// <summary>
        /// The tile's version 2 answer, parsed once for its roads and its features (each takes it once), or null when it is not
        /// cached. A cache that holds an area under the old key gives it without a single Overpass request (2026-11-22 owner:
        /// "when all scenes are cached, only load the missing pieces").
        /// </summary>
        public async Task<OsmChunk> OldTile(Bounds25833 tile)
        {
            var key = OverpassQuery.OldCacheKey(LatLonBounds.Of(tile));
            if (!oldChunks.TryGetValue(key, out var e))
            {
                if (Contains == null || !await Contains(key)) return null;
                if (!oldChunks.TryGetValue(key, out e))
                {
                    e = (ParseOld(key), 0);
                    if (oldChunks.Count > 32) oldChunks.Clear();   // never consumed (tiles dropped): forget them
                }
            }
            if (++e.uses >= 2) oldChunks.Remove(key); else oldChunks[key] = e;
            return await e.chunk;
        }

        async Task<OsmChunk> ParseOld(string key)
        {
            var bytes = await store.Fetch(key, () => Task.FromResult<byte[]>(null), "osm", isText: true);
            if (bytes == null) return null;
            long t0 = FrameProbe.Start();
            var chunk = Parse(Json.Parse(System.Text.Encoding.UTF8.GetString(bytes)) as List<object>);
            FrameProbe.Stop("osm.parse", t0);
            return chunk;
        }

        /// <summary>The <c>elements</c> array of the tile's feature answer as JSON text (what the JS client caches), or null.</summary>
        public Task<string> FetchElementsJson(LatLonBounds b, CancellationToken ct)
            => cache.Get(OverpassQuery.CacheKey(b), async () =>
            {
                var text = await Mirrors.Query(OverpassQuery.Build(b), ct, OverpassMirrors.Priority.Features);
                if (text == null) return null;
                var elements = Json.ParseObject(text).Arr("elements");
                return Json.Stringify(elements ?? new List<object>());
            });

        /// <summary>
        /// The road answer of a box as cached JSON text (the <c>elements</c>, each with only <see cref="OverpassQuery.RoadTags"/>
        /// and its geometry), or null. Asked before any feature query (<see cref="OverpassMirrors.Priority.Roads"/>).
        /// </summary>
        public Task<string> FetchRoadsJson(LatLonBounds b, CancellationToken ct)
            => roadsCache.Get(OverpassQuery.RoadsCacheKey(b), async () =>
            {
                var text = await Mirrors.Query(OverpassQuery.BuildRoads(b), ct, OverpassMirrors.Priority.Roads);
                if (text == null) return null;
                return Json.Stringify(Slim(Json.ParseObject(text).Arr("elements")));
            });

        /// <summary>Only what the game reads of a road answer: type, id, the kept tags, the geometry (no bounds, no other tags).</summary>
        static List<object> Slim(List<object> elements)
        {
            var list = new List<object>(elements?.Count ?? 0);
            if (elements == null) return list;
            foreach (var o in elements)
            {
                if (!(o is Dictionary<string, object> el)) continue;
                var tags = el.Obj("tags");
                var kept = new Dictionary<string, object>();
                if (tags != null) foreach (var k in OverpassQuery.RoadTags) if (tags.TryGetValue(k, out var v)) kept[k] = v;
                list.Add(new Dictionary<string, object> { { "type", el.Str("type") }, { "id", el.Get("id") }, { "tags", kept }, { "geometry", el.Arr("geometry") } });
            }
            return list;
        }

        /// <summary>The roads of the box (a road region); null when no mirror answered (the caller asks again).</summary>
        public async Task<RoadGraphData> FetchRoads(Bounds25833 bounds, CancellationToken ct)
        {
            var json = await FetchRoadsJson(LatLonBounds.Of(bounds), ct);
            if (json == null) return null;
            long t0 = FrameProbe.Start();
            var roads = Parse(Json.Parse(json) as List<object>).Roads;
            FrameProbe.Stop("osm.parse.roads", t0);
            return roads;
        }

        /// <summary>The tile's buildings, land cover, water and power lines; null when no mirror answered.</summary>
        public async Task<Features> FetchFeatures(Bounds25833 bounds, CancellationToken ct)
        {
            var old = await OldTile(bounds);
            if (old != null) return old.Features;
            var json = await FetchElementsJson(LatLonBounds.Of(bounds), ct);
            if (json == null) return null;
            long t0 = FrameProbe.Start();
            var features = Parse(Json.Parse(json) as List<object>).Features;
            FrameProbe.Stop("osm.parse", t0);
            return features;
        }

        /// <summary>buildings.js <c>parseElements</c>.</summary>
        public static OsmChunk Parse(List<object> elements)
        {
            var chunk = new OsmChunk();
            if (elements == null) return chunk;
            foreach (var o in elements)
            {
                if (!(o is Dictionary<string, object> el)) continue;
                var tags = Tags(el.Obj("tags"));
                if (tags == null) continue;
                string type = el.Str("type");
                var geometry = el.Arr("geometry");
                if (tags.ContainsKey("highway") && type == "way" && geometry != null && geometry.Count >= 2)
                {
                    chunk.Roads.Ways.Add(new RoadWay { Id = el.Long("id"), Tags = tags, Nodes = Points(geometry) });
                    continue;
                }
                if (tags.ContainsKey("building"))
                {
                    // Past the cap only further footprints are skipped. A `break` here dropped everything the answer listed after
                    // the 440th house (sorted by id): in town tiles whole roads, rivers and fields went missing (2026-11-22).
                    if (chunk.Features.Buildings.Count >= MaxBuildings) continue;
                    var rings = RingsOf(el, type);
                    if (rings.Count == 0) continue;
                    // The outer ring with the most vertices is the footprint; holes and courtyards do not change where the walls go.
                    var polygon = rings[0];
                    foreach (var r in rings) if (r.Count > polygon.Count) polygon = r;
                    chunk.Features.Buildings.Add(new Building { Id = el.Long("id"), Polygon = polygon, Tags = tags });
                    continue;
                }
                if (tags.ContainsKey("waterway") && type == "way" && geometry != null && geometry.Count >= 2)
                {
                    chunk.Features.Waterways.Add(new Waterway
                    {
                        Kind = tags["waterway"], Name = Tag(tags, "name"),
                        Width = float.TryParse(Tag(tags, "width"), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var w) ? w : 0,
                        Culvert = Tag(tags, "tunnel") == "culvert",
                        Points = Points(geometry),
                    });
                    continue;
                }
                if (tags.ContainsKey("power") && type == "way" && geometry != null && geometry.Count >= 2)
                {
                    chunk.Features.PowerLines.Add(new PowerLine { Id = el.Long("id"), Kind = tags["power"], Points = Points(geometry) });
                    continue;
                }
                string kind = Tag(tags, "landuse") ?? Tag(tags, "natural");
                if (kind == null) continue;
                var areaRings = RingsOf(el, type);
                if (areaRings.Count == 0) continue;
                chunk.Features.Areas.Add(new Area
                {
                    Kind = kind, Leaf = Tag(tags, "leaf_type"), Water = Tag(tags, "water"), Wetland = Tag(tags, "wetland"), Name = Tag(tags, "name"),
                    Rings = areaRings,
                });
            }
            return chunk;
        }

        static string Tag(Dictionary<string, string> tags, string key) => tags.TryGetValue(key, out var v) ? v : null;

        static Dictionary<string, string> Tags(Dictionary<string, object> raw)
        {
            if (raw == null) return null;
            var tags = new Dictionary<string, string>(raw.Count);
            foreach (var kv in raw) tags[kv.Key] = kv.Value is string s ? s : Json.Stringify(kv.Value);
            return tags;
        }

        static List<Utm33> Points(List<object> geometry)
        {
            var pts = new List<Utm33>(geometry.Count);
            foreach (var g in geometry)
            {
                if (!(g is Dictionary<string, object> p)) continue;
                double lat = p.Num("lat"), lon = p.Num("lon");
                if (double.IsNaN(lat) || double.IsNaN(lon)) continue;
                pts.Add(Proj.ToUtm(new LatLon(lat, lon)));
            }
            return pts;
        }

        /// <summary>buildings.js <c>ringsOf</c>: a way's geometry, or every outer member of a multipolygon relation.</summary>
        static List<List<Utm33>> RingsOf(Dictionary<string, object> el, string type)
        {
            var rings = new List<List<Utm33>>();
            if (type == "way")
            {
                var g = el.Arr("geometry");
                if (g != null && g.Count >= 3) rings.Add(Points(g));
            }
            else if (type == "relation")
            {
                var members = el.Arr("members");
                if (members == null) return rings;
                foreach (var mo in members)
                {
                    if (!(mo is Dictionary<string, object> m)) continue;
                    var g = m.Arr("geometry");
                    if (m.Str("type") == "way" && g != null && g.Count >= 3 && m.Str("role") != "inner") rings.Add(Points(g));
                }
            }
            return rings;
        }
    }

    /// <summary>Everything one Overpass answer yields for a chunk.</summary>
    public sealed class OsmChunk
    {
        public RoadGraphData Roads = new RoadGraphData();
        public Features Features = new Features();
    }
}
