namespace Rally.Geo
{
    /// <summary>
    /// The Overpass queries. <see cref="Build"/>: one per coarse tile (buildings.js <c>fetchOsmChunkNow</c>), buildings, land
    /// use / natural polygons, waterways and power lines with full geometry; ways only for land cover and water (multipolygon
    /// relations for forests and big lakes can span hundreds of km² and make Overpass time out). <see cref="BuildRoads"/>:
    /// the drivable roads alone, one per road region of 3 × 3 tiles (Rally.Gameplay.RoadRegions), so neighbouring tiles share
    /// one answer and roads never wait behind a tile's houses and fields (2026-11-22).
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
            string bbox = Bbox(b);
            return "[out:json][timeout:45];("
                + $"way[\"building\"]({bbox});"
                + $"relation[\"building\"][\"type\"=\"multipolygon\"]({bbox});"
                + $"way[\"landuse\"~\"^({string.Join("|", AreaLanduse)})$\"]({bbox});"
                + $"way[\"natural\"~\"^({string.Join("|", AreaNatural)})$\"]({bbox});"
                + $"way[\"waterway\"~\"^({string.Join("|", Waterways)})$\"]({bbox});"
                + $"way[\"power\"~\"^({string.Join("|", PowerLines)})$\"]({bbox});"
                + ");out geom;";
        }

        /// <summary>
        /// The roads of a road region: <c>out tags geom</c> (no node ids, 18 % smaller than <c>out geom</c>; measured 3.4 vs
        /// 4.1 MB for Lillehammer's 3 × 3 tiles). Only <see cref="RoadTags"/> are kept of the tags (<see cref="OverpassSource"/>).
        /// </summary>
        public static string BuildRoads(LatLonBounds b)
            => $"[out:json][timeout:45];way[\"highway\"~\"^({string.Join("|", RoadClasses)})$\"]({Bbox(b)});out tags geom;";

        /// <summary>The road tags the game reads (lanes, surface, bridges, tunnels, barred, names, signs); the rest is dropped before caching.</summary>
        public static readonly string[] RoadTags = { "highway", "name", "ref", "surface", "lanes", "bridge", "tunnel", "ford", "access", "motorroad", "oneway", "maxspeed", "layer" };

        static string Bbox(LatLonBounds b) => $"{Http.Fixed(b.MinLat, 6)},{Http.Fixed(b.MinLon, 6)},{Http.Fixed(b.MaxLat, 6)},{Http.Fixed(b.MaxLon, 6)}";

        /// <summary>
        /// Bumped whenever <see cref="Build"/> changes: answers cached for an older query (no link roads in version 1, roads
        /// inside in version 2) are not used for the new one.
        /// </summary>
        public const int Version = 3;

        /// <summary>
        /// The key of a tile's answer from the version 2 query (roads, houses, fields, water and power lines in one): read when
        /// cached, never asked for any more. A browser that has an area cached under it loads no Overpass answer there again.
        /// </summary>
        public static string OldCacheKey(LatLonBounds b)
            => $"overpass2:{Http.Fixed(b.MinLat, 5)},{Http.Fixed(b.MinLon, 5)},{Http.Fixed(b.MaxLat, 5)},{Http.Fixed(b.MaxLon, 5)}";

        /// <summary>Bumped whenever <see cref="BuildRoads"/> or <see cref="RoadTags"/> change.</summary>
        public const int RoadsVersion = 1;

        /// <summary>The road region's cache key, <c>osmroads1:minLat,minLon,maxLat,maxLon</c> at 5 decimals.</summary>
        public static string RoadsCacheKey(LatLonBounds b)
            => $"osmroads{RoadsVersion}:{Http.Fixed(b.MinLat, 5)},{Http.Fixed(b.MinLon, 5)},{Http.Fixed(b.MaxLat, 5)},{Http.Fixed(b.MaxLon, 5)}";

        /// <summary>buildings.js cache key <c>overpass:minLat,minLon,maxLat,maxLon</c> at 5 decimals, with the query <see cref="Version"/>: <c>overpass3:…</c>.</summary>
        public static string CacheKey(LatLonBounds b)
            => $"overpass{Version}:{Http.Fixed(b.MinLat, 5)},{Http.Fixed(b.MinLon, 5)},{Http.Fixed(b.MaxLat, 5)},{Http.Fixed(b.MaxLon, 5)}";

        /// <summary>The POST body: <c>data=</c> + encodeURIComponent(query).</summary>
        public static string Body(string query) => "data=" + Http.EncodeUriComponent(query);
    }
}
