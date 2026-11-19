using System;
using System.Collections.Generic;
using Rally.Core;
using Unity.Mathematics;

namespace Rally.Track
{
    /// <summary>One directed edge of the road graph as the endless-stage generator sees it (filled from Rally.Roads.RoadGraph).</summary>
    public struct RoadEdge
    {
        public long From, To;
        public float Length;        // m
        public float Curvature;     // mean |Δheading| per 100 m, radians — bends are good
        public float Climb;         // |Δelevation| / Length — hills are good
        public bool Paved;          // asphalt (false = gravel/track: better)
        public byte RoadClass;      // 0 motorway/trunk … 5 track; see RoadGraph
        public bool Barred;         // tunnel, ferry, motorway, private: never
        public float Forest;        // 0..1 forest cover beside it
    }

    /// <summary>The graph queries the walk needs; Rally.Roads adapts its RoadGraph to this.</summary>
    public interface IRoadEdges
    {
        IReadOnlyList<RoadEdge> EdgesFrom(long node);
        Utm33 NodePos(long node);
    }

    /// <summary>
    /// The endless-stage generator: a seeded random walk over real roads that prefers twisty, hilly, gravel,
    /// minor roads through forest, keeps a rough heading so it does not circle, and never reuses a road.
    /// It extends the stage one sector (~<see cref="SectorLength"/> m) at a time, so the world streamer can
    /// request the tiles of the next sector while the car drives the current one. Two players with the same
    /// seed and start get the same stage (the walk only reads the graph and the RNG).
    /// </summary>
    public sealed class RoadWalk
    {
        public const float SectorLength = 5000f;
        public const int ServiceEvery = 3;

        readonly IRoadEdges graph;
        readonly HashSet<long> usedEdges = new HashSet<long>();   // (from<<32 ^ to) both directions
        readonly List<RoadEdge> edges = new List<RoadEdge>();
        RallyRandom rng;
        long node;
        float2 heading;               // unit, the preferred direction
        public float Length { get; private set; }
        public int Sectors { get; private set; }
        public IReadOnlyList<RoadEdge> Edges => edges;
        /// <summary>Edges appended by the last <see cref="ExtendSector"/>, for the streamer and the stage builder.</summary>
        public readonly List<RoadEdge> LastSector = new List<RoadEdge>();

        public RoadWalk(IRoadEdges graph, ulong seed, long startNode, float2 startHeading)
        {
            this.graph = graph;
            rng = new RallyRandom(seed);
            node = startNode;
            heading = math.normalizesafe(startHeading, new float2(0, 1));
        }

        /// <summary>
        /// A walk whose first edge is given (the road beside the start pin, see RoadGraphEdges.StartNear): it goes
        /// into the first sector as is and the random walk carries on from its far end, heading along it.
        /// </summary>
        public RoadWalk(IRoadEdges graph, ulong seed, in RoadEdge first)
            : this(graph, seed, first.To, (float2)graph.NodePos(first.To).Minus(graph.NodePos(first.From)))
        {
            hasFirst = true;
            this.first = first;
        }

        bool hasFirst;
        RoadEdge first;

        /// <summary>Appends about one sector of road; false when the walk is stuck (dead end, everything used).</summary>
        public bool ExtendSector()
        {
            LastSector.Clear();
            float added = 0;
            if (hasFirst)
            {
                hasFirst = false;
                usedEdges.Add(Key(first.From, first.To));
                usedEdges.Add(Key(first.To, first.From));
                edges.Add(first);
                Length += first.Length;
                LastSector.Add(first);
                added += first.Length;
            }
            while (added < SectorLength)
            {
                if (!Step(out var e)) break;
                LastSector.Add(e);
                added += e.Length;
            }
            if (LastSector.Count == 0) return false;
            Sectors++;
            return true;
        }

        public bool IsService(int sector) => sector > 0 && sector % ServiceEvery == 0;

        bool Step(out RoadEdge chosen)
        {
            chosen = default;
            var options = graph.EdgesFrom(node);
            if (options == null || options.Count == 0) return false;
            Span<float> weights = stackalloc float[math.min(options.Count, 16)];
            float total = 0;
            int n = weights.Length;
            for (int i = 0; i < n; i++)
            {
                var e = options[i];
                float w = Score(e);
                weights[i] = w;
                total += w;
            }
            if (total <= 0)
            {
                // Everything here is used or barred: allow a used edge as a last resort (a U-turn out of a cul-de-sac).
                for (int i = 0; i < n; i++) { weights[i] = options[i].Barred ? 0 : 0.01f; total += weights[i]; }
                if (total <= 0) return false;
            }
            float pick = rng.NextFloat() * total;
            int idx = 0;
            for (; idx < n - 1; idx++) { pick -= weights[idx]; if (pick <= 0) break; }
            chosen = options[idx];
            usedEdges.Add(Key(chosen.From, chosen.To));
            usedEdges.Add(Key(chosen.To, chosen.From));
            edges.Add(chosen);
            Length += chosen.Length;
            var dir = (float2)graph.NodePos(chosen.To).Minus(graph.NodePos(chosen.From));
            heading = math.normalizesafe(math.lerp(heading, math.normalizesafe(dir, heading), 0.3f), heading);
            node = chosen.To;
            return true;
        }

        /// <summary>The "rally-ness" of a road: what makes a good stage, in one number.</summary>
        public float Score(in RoadEdge e)
        {
            if (e.Barred || usedEdges.Contains(Key(e.From, e.To))) return 0;
            float w = 1f;
            w *= 1f + 2.5f * math.saturate(e.Curvature / 0.8f);     // bends
            w *= 1f + 1.5f * math.saturate(e.Climb / 0.08f);        // hills
            w *= e.Paved ? 1f : 2f;                                 // gravel
            w *= 0.5f + 0.5f * e.Forest;                            // trees close to the road
            w *= e.RoadClass switch { 0 => 0.05f, 1 => 0.2f, 2 => 0.6f, 3 => 1f, 4 => 1.4f, _ => 1.2f };
            var dir = math.normalizesafe((float2)graph.NodePos(e.To).Minus(graph.NodePos(e.From)), heading);
            float ahead = math.dot(dir, heading);                   // −1 back … +1 straight on
            w *= 0.35f + 0.65f * math.saturate(0.5f + 0.5f * ahead); // mild preference to keep going
            return w;
        }

        static long Key(long a, long b) => (a << 32) ^ (b & 0xffffffffL);
    }
}
