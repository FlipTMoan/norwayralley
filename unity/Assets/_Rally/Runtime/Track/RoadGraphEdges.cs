using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Roads;

namespace Rally.Track
{
    /// <summary>
    /// Adapts the streamed <see cref="RoadGraph"/> (Rally.Roads, below this layer) to the <see cref="IRoadEdges"/>
    /// the endless-stage walk reads: every junction-to-junction <see cref="RoadLink"/> becomes a <see cref="RoadEdge"/>.
    /// Forest cover beside a link is not known to the graph, so every edge gets 0.5 (neutral weight);
    /// the walk is called once per sector, so the small list per call is fine.
    /// </summary>
    public sealed class RoadGraphEdges : IRoadEdges
    {
        static readonly RoadEdge[] None = Array.Empty<RoadEdge>();
        readonly RoadGraph graph;

        public RoadGraphEdges(RoadGraph graph) { this.graph = graph; }

        public IReadOnlyList<RoadEdge> EdgesFrom(long node)
        {
            var links = graph.LinksFrom(node);
            if (links == null || links.Count == 0) return None;
            var list = new List<RoadEdge>(links.Count);
            foreach (var l in links)
                list.Add(new RoadEdge { From = l.From, To = l.To, Length = l.Length, Curvature = l.Curvature, Climb = l.Climb, Paved = l.Paved, RoadClass = l.RoadClass, Barred = l.Barred, Forest = 0.5f });
            return list;
        }

        public Utm33 NodePos(long node) => graph.TryNodePosition(node, out var p) ? p : default;

        /// <summary>The graded centre line of an edge the walk chose (RoadLink.Points, From → To), null when the tile went away.</summary>
        public RoadLink Link(in RoadEdge e)
        {
            var links = graph.LinksFrom(e.From);
            if (links == null) return null;
            foreach (var l in links) if (l.To == e.To) return l;
            return null;
        }
    }
}
