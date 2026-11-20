using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Roads;
using Unity.Mathematics;

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
                list.Add(Edge(l));
            return list;
        }

        /// <summary>
        /// Where an endless stage starts: the nearest link within <paramref name="limit"/> m of the requested point,
        /// entered at its closest sample and driven towards the end with more road left, so the car spawns on the
        /// road beside the pin facing along it. <paramref name="first"/> is that link as a walk edge, its length cut
        /// to the part still ahead; <paramref name="firstSample"/> is where its points start. False when no road is near.
        /// </summary>
        public bool StartNear(Utm33 p, double limit, out RoadEdge first, out int firstSample)
        {
            first = default; firstSample = 0;
            var l = graph.NearestLink(p, limit, out int i);
            if (l == null) return false;
            float ahead = 0, behind = 0;
            for (int k = 1; k < l.Points.Count; k++) { float d = (float)math.distance(l.Points[k], l.Points[k - 1]); if (k > i) ahead += d; else behind += d; }
            bool forward = ahead >= behind;
            first = Edge(l);
            if (!forward) { first.From = l.To; first.To = l.From; i = l.Points.Count - 1 - i; }
            first.Length = math.max(forward ? ahead : behind, 1f);
            firstSample = math.min(i, l.Points.Count - 2);   // at least two points of the first link
            return true;
        }

        /// <summary>
        /// The graded centre lines of a walk sector appended to a stage line (shared end points dropped), and every
        /// 8th point (40 m) into <paramref name="prefetch"/> for the tile streamer. <paramref name="firstSample"/>
        /// skips the start of the very first link (see <see cref="StartNear"/>); links whose tile went away are skipped.
        /// </summary>
        public void AppendPoints(IReadOnlyList<RoadEdge> sector, List<Utm33> points, int firstSample, List<Utm33> prefetch)
        {
            foreach (var e in sector)
            {
                var l = Link(e);
                if (l == null) continue;
                for (int i = points.Count > 0 ? 1 : firstSample; i < l.Points.Count; i++)
                {
                    var u = new Utm33(l.Points[i].x, l.Points[i].y);
                    points.Add(u);
                    if ((i & 7) == 0) prefetch?.Add(u);
                }
            }
        }

        static RoadEdge Edge(RoadLink l) => new RoadEdge { From = l.From, To = l.To, Length = l.Length, Curvature = l.Curvature, Climb = l.Climb, Paved = l.Paved, RoadClass = l.RoadClass, Barred = l.Barred, Tunnel = l.Tunnel, Forest = 0.5f };

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
