using System.Collections.Generic;
using NUnit.Framework;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    public class EarClipTests
    {
        static float Area2(List<float2> ring, List<int> tris)
        {
            float a = 0;
            for (int t = 0; t < tris.Count; t += 3)
            {
                float2 p = ring[tris[t]], q = ring[tris[t + 1]], r = ring[tris[t + 2]];
                float cross = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
                Assert.Greater(cross, 0, "every triangle is counter-clockwise");
                a += cross;
            }
            return a;
        }

        [Test]
        public void ConcaveLShapeIsTriangulatedWithoutLosingArea()
        {
            var ring = new List<float2> { new float2(0, 0), new float2(4, 0), new float2(4, 1), new float2(1, 1), new float2(1, 3), new float2(0, 3) };
            var tris = new List<int>();
            Geometry2D.EarClip(ring, tris);
            Assert.AreEqual(4 * 3, tris.Count, "n − 2 triangles");
            Assert.AreEqual(Geometry2D.SignedArea2(ring), Area2(ring, tris), 1e-5);
            Assert.IsTrue(Geometry2D.PointInRing(new float2(0.5f, 2), ring));
            Assert.IsFalse(Geometry2D.PointInRing(new float2(3, 2), ring), "the notch is outside");
        }

        [Test]
        public void ClockwiseInputGivesTheSameTriangles()
        {
            var ring = new List<float2> { new float2(0, 0), new float2(0, 3), new float2(1, 3), new float2(1, 1), new float2(4, 1), new float2(4, 0) };
            var tris = new List<int>();
            Geometry2D.EarClip(ring, tris);
            Assert.AreEqual(12, tris.Count);
            Assert.AreEqual(-Geometry2D.SignedArea2(ring), Area2(ring, tris), 1e-5);
        }
    }
}
