namespace Rally.Geo
{
    /// <summary>
    /// The one Overpass query per chunk (buildings.js <c>fetchOsmChunkNow</c>): buildings, land use /
    /// natural polygons, waterways and highways with full geometry. Ways only for land cover and
    /// water: multipolygon relations for forests and big lakes can span hundreds of km² and make
    /// Overpass time out. The Unity game also asks for power lines (not in the JS).
    /// </summary>
    public static class OverpassQuery
    {
        public static readonly string[] AreaLanduse = { "farmland", "meadow", "orchard", "farmyard", "grass", "forest",
            "residential", "industrial", "commercial", "retail", "quarry", "cemetery" };
        public static readonly string[] AreaNatural = { "wood", "water", "wetland", "scrub", "grassland", "heath", "bare_rock", "scree", "sand" };
        public static readonly string[] Waterways = { "river", "stream", "canal", "drain", "ditch" };
        /// <summary>
        /// The drivable classes. The <c>*_link</c> ways are the ramps and slip roads of junctions: without them roads stopped
        /// short of every motorway / trunk junction (2026-11-22). Not <c>road</c> (unknown class), <c>busway</c>, <c>construction</c>.
        /// </summary>
        public static readonly string[] RoadClasses = { "motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street", "service", "track",
            "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link" };
        public static readonly string[] PowerLines = { "line", "minor_line" };

        public static string Build(LatLonBounds b)
        {
            string bbox = $"{Http.Fixed(b.MinLat, 6)},{Http.Fixed(b.MinLon, 6)},{Http.Fixed(b.MaxLat, 6)},{Http.Fixed(b.MaxLon, 6)}";
            return "[out:json][timeout:45];("
                + $"way[\"building\"]({bbox});"
                + $"relation[\"building\"][\"type\"=\"multipolygon\"]({bbox});"
                + $"way[\"landuse\"~\"^({string.Join("|", AreaLanduse)})$\"]({bbox});"
                + $"way[\"natural\"~\"^({string.Join("|", AreaNatural)})$\"]({bbox});"
                + $"way[\"waterway\"~\"^({string.Join("|", Waterways)})$\"]({bbox});"
                + $"way[\"highway\"~\"^({string.Join("|", RoadClasses)})$\"]({bbox});"
                + $"way[\"power\"~\"^({string.Join("|", PowerLines)})$\"]({bbox});"
                + ");out geom;";
        }

        /// <summary>
        /// Bumped whenever <see cref="Build"/> asks for more: answers cached for an older query (no link roads in version 1) are
        /// not used for the new one.
        /// </summary>
        public const int Version = 2;

        /// <summary>buildings.js cache key <c>overpass:minLat,minLon,maxLat,maxLon</c> at 5 decimals, with the query <see cref="Version"/>: <c>overpass2:…</c>.</summary>
        public static string CacheKey(LatLonBounds b)
            => $"overpass{Version}:{Http.Fixed(b.MinLat, 5)},{Http.Fixed(b.MinLon, 5)},{Http.Fixed(b.MaxLat, 5)},{Http.Fixed(b.MaxLon, 5)}";

        /// <summary>The POST body: <c>data=</c> + encodeURIComponent(query).</summary>
        public static string Body(string query) => "data=" + Http.EncodeUriComponent(query);
    }
}
