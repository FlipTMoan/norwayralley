using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Tests.World
{
    /// <summary>
    /// "Houses seem to be rendered on only two sides" (2026-11-22): every house triangle must face out. Unity draws a
    /// triangle's front where cross(v1 − v0, v2 − v0) points (its built-in quad: triangles {0,2,1} with normal −z), and
    /// the house material culls back faces, so a triangle wound the other way hides the near walls.
    /// </summary>
    public class HouseFaceTests
    {
        static Mesh Build(params double2[][] footprints)
        {
            FloatingOrigin.Set(new Utm33(0, 0));
            var f = new Features();
            long id = 1;
            foreach (var ring in footprints)
            {
                var b = new Building { Id = id++ };
                foreach (var p in ring) b.Polygon.Add(new Utm33(p.x, p.y));
                f.Buildings.Add(b);
            }
            var set = Buildings.Build(f, new TileKey(TileKind.Coarse, 0, 0), _ => 10f, _ => 0f, null, 7);
            Assert.IsNotNull(set.Mesh, "houses were built");
            return set.Mesh;
        }

        static void AssertFrontFacesOut(Mesh mesh)
        {
            var v = mesh.vertices; var n = mesh.normals; var t = mesh.triangles;
            int wrong = 0;
            for (int i = 0; i < t.Length; i += 3)
            {
                var cross = Vector3.Cross(v[t[i + 1]] - v[t[i]], v[t[i + 2]] - v[t[i]]);
                if (Vector3.Dot(cross, n[t[i]]) <= 0f) wrong++;
            }
            Assert.AreEqual(0, wrong, $"{wrong} of {t.Length / 3} triangles face away from their normal (culled from outside)");
        }

        [Test]
        public void GableHouseFacesOutOnAllSides()
        {
            // Footprint given clockwise on purpose: the builder reverses it to counter-clockwise.
            var mesh = Build(new[] { new double2(100, 100), new double2(100, 108), new double2(112, 108), new double2(112, 100) });
            AssertFrontFacesOut(mesh);
            // The four walls' normals point away from the house centre, so all four sides face out.
            var v = mesh.vertices; var n = mesh.normals;
            var centre = new Vector3(106, 0, 104);
            int outward = 0, walls = 0;
            for (int i = 0; i < v.Length; i++)
            {
                if (Mathf.Abs(n[i].y) > 0.1f) continue;
                walls++;
                var d = v[i] - centre; d.y = 0;
                if (Vector3.Dot(d, n[i]) > 0) outward++;
            }
            Assert.Greater(walls, 0);
            Assert.AreEqual(walls, outward, "every wall vertex normal points out of the house");
        }

        [Test]
        public void FlatRoofAndTriangleHousesFaceOut()
        {
            var lShape = new[] { new double2(200, 200), new double2(220, 200), new double2(220, 206), new double2(208, 206), new double2(208, 216), new double2(200, 216) };
            var tri = new[] { new double2(300, 300), new double2(310, 300), new double2(305, 308) };
            AssertFrontFacesOut(Build(lShape, tri));
        }
    }
}
