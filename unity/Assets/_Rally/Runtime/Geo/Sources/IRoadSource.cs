using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>One OSM <c>highway=*</c> way with its tags and nodes in EPSG:25833 (buildings.js <c>parseElements</c> roads).</summary>
    public sealed class RoadWay
    {
        public long Id;
        public Dictionary<string, string> Tags = new Dictionary<string, string>();
        public List<Utm33> Nodes = new List<Utm33>();

        public string Kind => Tag("highway");
        public string Name => Tag("name") ?? Tag("ref");
        public string Surface => Tag("surface");
        public bool Oneway => Tag("oneway") == "yes";
        public int Maxspeed => int.TryParse(Tag("maxspeed"), out var v) ? v : 0;
        public string Tag(string key) => Tags.TryGetValue(key, out var v) ? v : null;
    }

    /// <summary>Plain road data for a chunk; the Roads layer builds the graph and ribbons from it.</summary>
    public sealed class RoadGraphData
    {
        public List<RoadWay> Ways = new List<RoadWay>();
    }

    public interface IRoadSource
    {
        Task<RoadGraphData> FetchRoads(Bounds25833 bounds, CancellationToken ct);
    }
}
