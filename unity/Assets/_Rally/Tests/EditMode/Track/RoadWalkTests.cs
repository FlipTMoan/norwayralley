using System.Collections.Generic;
using NUnit.Framework;
using Rally.Core;
using Rally.Track;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Track
{
    /// <summary>A 20×20 grid of 500 m roads; east–west roads are gravel and twisty, north–south paved and straight.</summary>
    sealed class GridRoads : IRoadEdges
    {
        public const int N = 20;
        readonly Dictionary<long, List<RoadEdge>> edges = new Dictionary<long, List<RoadEdge>>();
        public GridRoads()
        {
            for (int y = 0; y < N; y++)
                for (int x = 0; x < N; x++)
                {
                    long id = Id(x, y);
                    var list = new List<RoadEdge>();
                    if (x > 0) list.Add(Edge(id, Id(x - 1, y), true));
                    if (x < N - 1) list.Add(Edge(id, Id(x + 1, y), true));
                    if (y > 0) list.Add(Edge(id, Id(x, y - 1), false));
                    if (y < N - 1) list.Add(Edge(id, Id(x, y + 1), false));
                    edges[id] = list;
                }
        }
        static long Id(int x, int y) => y * N + x;
        static RoadEdge Edge(long a, long b, bool ew) => new RoadEdge { From = a, To = b, Length = 500, Curvature = ew ? 0.6f : 0.05f, Climb = 0.03f, Paved = !ew, RoadClass = ew ? (byte)4 : (byte)2, Forest = 0.7f };
        public IReadOnlyList<RoadEdge> EdgesFrom(long node) => edges[node];
        public Utm33 NodePos(long node) => new Utm33((node % N) * 500.0, (node / N) * 500.0);
    }

    public class RoadWalkTests
    {
        [Test]
        public void SameSeedSameStageDifferentSeedDifferentStage()
        {
            var g = new GridRoads();
            var a = new RoadWalk(g, 123, 210, new float2(1, 0));
            var b = new RoadWalk(g, 123, 210, new float2(1, 0));
            var c = new RoadWalk(g, 124, 210, new float2(1, 0));
            for (int i = 0; i < 3; i++) { Assert.IsTrue(a.ExtendSector()); Assert.IsTrue(b.ExtendSector()); c.ExtendSector(); }
            Assert.AreEqual(a.Edges.Count, b.Edges.Count);
            for (int i = 0; i < a.Edges.Count; i++) Assert.AreEqual(a.Edges[i].To, b.Edges[i].To);
            bool differs = a.Edges.Count != c.Edges.Count;
            for (int i = 0; !differs && i < a.Edges.Count; i++) differs = a.Edges[i].To != c.Edges[i].To;
            Assert.IsTrue(differs);
        }

        [Test]
        public void SectorsAreAboutFiveKmAndNeverReuseARoad()
        {
            var g = new GridRoads();
            var w = new RoadWalk(g, 7, 210, new float2(1, 0));
            var seen = new HashSet<(long, long)>();
            for (int s = 0; s < 4; s++)
            {
                Assert.IsTrue(w.ExtendSector());
                float len = 0;
                foreach (var e in w.LastSector) { len += e.Length; Assert.IsTrue(seen.Add((math.min(e.From, e.To), math.max(e.From, e.To))), "road reused"); }
                Assert.GreaterOrEqual(len, RoadWalk.SectorLength);
            }
            Assert.IsTrue(w.IsService(3)); Assert.IsFalse(w.IsService(2));
        }

        [Test]
        public void PrefersGravelBendsOverStraightTarmac()
        {
            var g = new GridRoads();
            var w = new RoadWalk(g, 99, 210, new float2(1, 0));
            for (int s = 0; s < 4; s++) w.ExtendSector();
            int gravel = 0;
            foreach (var e in w.Edges) if (!e.Paved) gravel++;
            Assert.Greater(gravel, w.Edges.Count / 2, $"gravel {gravel} of {w.Edges.Count}");
        }

        [Test]
        public void BarredRoadsAreNeverTaken()
        {
            var g = new GridRoads();
            var w = new RoadWalk(g, 5, 0, new float2(1, 0));
            var e = new RoadEdge { Barred = true, Length = 100 };
            Assert.AreEqual(0f, w.Score(e));
        }
    }
}
