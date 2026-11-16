using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// buildings.js <c>fetchOsmChunk</c> + <c>parseElements</c>: one cached Overpass answer per chunk,
    /// split into roads (<see cref="IRoadSource"/>) and everything else (<see cref="IFeatureSource"/>).
    /// Geometry is converted to EPSG:25833 on parse. A chunk that got no answer (every mirror down)
    /// returns an empty result and is not cached, so the next ask tries the network again.
    /// </summary>
    public sealed class OverpassSource : IRoadSource, IFeatureSource
    {
        /// <summary>buildings.js MAX_PER_CHUNK × 2: stop parsing footprints in a dense town.</summary>
        public const int MaxBuildings = 440;

        readonly CachedSource<string> cache;
        public readonly OverpassMirrors Mirrors;

        public OverpassSource(IGeoCache cache, OverpassMirrors mirrors = null)
        {
            Mirrors = mirrors ?? new OverpassMirrors();
            this.cache = CachedSource<string>.Text(cache, "osm", Mirrors.Breaker);
        }

        /// <summary>The <c>elements</c> array of the Overpass answer as JSON text (what the JS client caches), or null.</summary>
        public Task<string> FetchElementsJson(LatLonBounds b, CancellationToken ct)
            => cache.Get(OverpassQuery.CacheKey(b), async () =>
            {
                var text = await Mirrors.Query(OverpassQuery.Build(b), ct);
                if (text == null) return null;
                var elements = Json.ParseObject(text).Arr("elements");
                return Json.Stringify(elements ?? new List<object>());
            });

        public async Task<OsmChunk> FetchChunk(Bounds25833 bounds, CancellationToken ct)
        {
            var json = await FetchElementsJson(LatLonBounds.Of(bounds), ct);
            return json == null ? null : Parse(Json.Parse(json) as List<object>);
        }

        public async Task<RoadGraphData> FetchRoads(Bounds25833 bounds, CancellationToken ct)
            => (await FetchChunk(bounds, ct))?.Roads ?? new RoadGraphData();

        public async Task<Features> FetchFeatures(Bounds25833 bounds, CancellationToken ct)
            => (await FetchChunk(bounds, ct))?.Features ?? new Features();

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
                    var rings = RingsOf(el, type);
                    if (rings.Count == 0) continue;
                    // The outer ring with the most vertices is the footprint; holes and courtyards do not change where the walls go.
                    var polygon = rings[0];
                    foreach (var r in rings) if (r.Count > polygon.Count) polygon = r;
                    chunk.Features.Buildings.Add(new Building { Id = el.Long("id"), Polygon = polygon, Tags = tags });
                    if (chunk.Features.Buildings.Count >= MaxBuildings) break;
                    continue;
                }
                if (tags.ContainsKey("waterway") && type == "way" && geometry != null && geometry.Count >= 2)
                {
                    chunk.Features.Waterways.Add(new Waterway
                    {
                        Kind = tags["waterway"], Name = Tag(tags, "name"),
                        Width = float.TryParse(Tag(tags, "width"), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var w) ? w : 0,
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
