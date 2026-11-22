using System.Collections.Generic;
using System.Text;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    /// <summary>
    /// Roads drawn without holes where the map joins them (2026-11-22, the continuity survey: PreviewShots -previewContinuity).
    /// Causes found: the Overpass parser stopped at the 440th house and dropped every road listed after it; the link roads
    /// (ramps) were never asked for; ways shorter than ~6 m (connectors at tunnel mouths and junctions) were never drawn; and a
    /// way that started where another ended was not drawn over its first 5 m, as if the other road's ribbon covered it.
    /// </summary>
    public class RoadContinuityTests
    {
        static float Flat(Utm33 p) => 100f;

        static RoadWay Way(long id, string kind, params double[] en)
        {
            var w = new RoadWay { Id = id };
            w.Tags["highway"] = kind;
            for (int i = 0; i + 1 < en.Length; i += 2) w.Nodes.Add(new Utm33(en[i], en[i + 1]));
            return w;
        }

        static RoadGraphData Data(params RoadWay[] ways) { var d = new RoadGraphData(); d.Ways.AddRange(ways); return d; }

        static readonly TileKey Key = new TileKey(TileKind.Coarse, 0, 0);

        /// <summary>Is <paramref name="p"/> on a drawn ribbon quad (RibbonMesh: a segment whose two samples are not both Covered, out to the shoulder edge, square ends)?</summary>
        static bool Drawn(List<RoadPolyline> lines, double2 p, bool strictEnds = false)
        {
            foreach (var l in lines)
                for (int i = 0; i + 1 < l.Samples.Count; i++)
                {
                    var a = l.Samples[i]; var b = l.Samples[i + 1];
                    if (a.Covered && b.Covered) continue;
                    var ab = b.P - a.P; double len2 = math.lengthsq(ab);
                    if (len2 < 1e-9) continue;
                    double t = math.dot(p - a.P, ab) / len2;
                    if (t < -1e-6 || t > 1 + 1e-6) continue;
                    // On the square end of a run (a ray along that edge hits or misses by rounding): not drawn there.
                    if (strictEnds && (i == 0 && t < 1e-3 || i + 2 == l.Samples.Count && t > 1 - 1e-3)) continue;
                    if (math.distance(p, a.P + ab * t) <= l.Lanes.Half + RoadConstants.RoadShoulder) return true;
                }
            return false;
        }

        /// <summary>Every 0.5 m along the polyline (E, N pairs): the metres where no ribbon is drawn.</summary>
        static float Undrawn(List<RoadPolyline> lines, params double[] en) => Undrawn(lines, false, en);

        static float Undrawn(List<RoadPolyline> lines, bool strictEnds, params double[] en)
        {
            float miss = 0;
            for (int i = 0; i + 3 < en.Length; i += 2)
            {
                var a = new double2(en[i], en[i + 1]); var b = new double2(en[i + 2], en[i + 3]);
                double len = math.distance(a, b);
                for (double d = 0; d <= len; d += 0.5) if (!Drawn(lines, math.lerp(a, b, d / len), strictEnds)) miss += 0.5f;
            }
            return miss;
        }

        // ---- Overpass ----------------------------------------------------------------------------------------

        [Test]
        public void Parse_KeepsTheRoadsListedAfterTheHouseCap()
        {
            // Overpass lists its answer by id: in a town tile the roads with higher ids come after the 440th house.
            var sb = new StringBuilder("[");
            for (int i = 0; i < OverpassSource.MaxBuildings + 60; i++)
                sb.Append($"{{\"type\":\"way\",\"id\":{i + 1},\"tags\":{{\"building\":\"house\"}},\"geometry\":[{{\"lat\":59.001,\"lon\":6.001}},{{\"lat\":59.001,\"lon\":6.0012}},{{\"lat\":59.0012,\"lon\":6.0012}},{{\"lat\":59.001,\"lon\":6.001}}]}},");
            sb.Append("{\"type\":\"way\",\"id\":1496472562,\"tags\":{\"highway\":\"track\"},\"geometry\":[{\"lat\":59.0,\"lon\":6.0},{\"lat\":59.01,\"lon\":6.01}]},");
            sb.Append("{\"type\":\"way\",\"id\":1496472563,\"tags\":{\"natural\":\"water\"},\"geometry\":[{\"lat\":59.0,\"lon\":6.0},{\"lat\":59.01,\"lon\":6.0},{\"lat\":59.01,\"lon\":6.01}]}]");
            var chunk = OverpassSource.Parse(Json.Parse(sb.ToString()) as List<object>);
            Assert.AreEqual(OverpassSource.MaxBuildings, chunk.Features.Buildings.Count, "houses still capped");
            Assert.AreEqual(1, chunk.Roads.Ways.Count, "the road after the cap is kept");
            Assert.AreEqual(1, chunk.Features.Areas.Count, "and the lake");
        }

        [Test]
        public void Query_AsksForTheLinkRoads_UnderANewCacheKey()
        {
            var b = new LatLonBounds(59, 6, 59.02, 6.04);
            StringAssert.Contains("|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$", OverpassQuery.BuildRoads(b));
            StringAssert.StartsWith("osmroads1:", OverpassQuery.RoadsCacheKey(b), "answers cached without the links (overpass1/2) are not reused");
        }

        // ---- link roads ------------------------------------------------------------------------------------------

        [TestCase("motorway_link", 0, true)]
        [TestCase("trunk_link", 0, true)]
        [TestCase("primary_link", 1, false)]
        [TestCase("secondary_link", 2, false)]
        [TestCase("tertiary_link", 3, false)]
        public void LinkRoads_TakeTheirRoadsClass_OneLane_MotorwayRampsBarred(string kind, int roadClass, bool barred)
        {
            var tags = new Dictionary<string, string> { ["highway"] = kind };
            Assert.AreEqual(roadClass, RoadGraph.ClassOf(kind));
            Assert.AreEqual(barred, RoadGraph.IsBarred(tags), "stage routing keeps off motorways and their ramps only");
            var spec = ProfileGrader.LaneSpecFor(tags);
            Assert.IsTrue(spec.HasValue, "drivable");
            Assert.AreEqual(RoadProfile.One.Half, spec.Value.Half, 1e-4, "a ramp is narrower than its road");
            tags["lanes"] = "2";
            Assert.AreEqual(RoadProfile.Two.Half, ProfileGrader.LaneSpecFor(tags).Value.Half, 1e-4, "unless tagged wider");
        }

        [Test]
        public void ARampBetweenTwoRoads_IsGradedAndDrawnToBothEnds()
        {
            // The ramp shares a node with each road, as in OSM.
            var main = Way(1, "primary", 200, 500, 800, 500, 1800, 500);
            var side = Way(2, "secondary", 1000, 700, 1000, 1500);
            var ramp = Way(3, "primary_link", 800, 500, 1000, 700);
            var lines = new RoadGraph().SetTile(Key, Data(main, side, ramp), Flat);
            Assert.IsTrue(lines.Exists(l => l.Id == 3 && l.Kind == "primary_link"));
            Assert.AreEqual(0f, Undrawn(lines, 800, 500, 1000, 700));
        }

        // ---- short ways -------------------------------------------------------------------------------------------

        [Test]
        public void ResampleEven_KeepsBothEndsOfAVeryShortWay()
        {
            var p = ProfileGrader.ResampleEven(new List<double2> { new double2(0, 0), new double2(1, 0) }, 5);
            Assert.AreEqual(2, p.Count);
            Assert.AreEqual(0.0, p[0].x, 1e-9);
            Assert.AreEqual(1.0, p[1].x, 1e-9);
        }

        [Test]
        public void ShortConnectorsAtATunnelMouth_AreDrawn()
        {
            // Lillehammer, way 779172863: a 13 m tube between a 5 m track and a 1 m service way (both never drawn before).
            var track = Way(779172862, "track", 1000, 1000, 1005, 1000);
            var tube = Way(779172863, "service", 1005, 1000, 1018, 1000); tube.Tags["tunnel"] = "yes";
            var stub = Way(972729351, "service", 1018, 1000, 1019, 1000);
            var lines = new RoadGraph().SetTile(Key, Data(track, tube, stub), Flat);
            Assert.IsTrue(lines.Exists(l => l.Id == track.Id), "the 5 m track has a run");
            Assert.IsTrue(lines.Exists(l => l.Id == stub.Id), "the 1 m stub has a run");
            Assert.AreEqual(0f, Undrawn(lines, 1000, 1000, 1019, 1000));
        }

        [Test]
        public void AWayCrossingATileWithoutANodeInIt_IsDrawnThere()
        {
            // Strømsåstunnelen (Drammen): 34 nodes over 3.7 km, one segment 1204 m long; the tile it crossed without a node drew none of it.
            var tube = Way(13716683, "trunk", -600, 1000, 2700, 1100);
            tube.Tags["tunnel"] = "yes";
            var lines = new RoadGraph().SetTile(Key, Data(tube), Flat);
            Assert.IsTrue(lines.Exists(l => l.Id == tube.Id), "the tile holds a run of it");
            Assert.AreEqual(0f, Undrawn(lines, 100, 1000 + 700 * 100 / 3300.0, 1900, 1000 + 2500 * 100 / 3300.0));
        }

        // ---- joints ------------------------------------------------------------------------------------------------

        [TestCase("primary")]
        [TestCase("residential")]
        public void TwoWaysEndToEnd_NoHoleAtTheJoint(string kind)
        {
            var a = Way(10, kind, 1000, 200, 1000, 1000);
            var b = Way(11, kind, 1000, 1000, 1040, 1500);
            var lines = new RoadGraph().SetTile(Key, Data(a, b), Flat);
            Assert.AreEqual(0f, Undrawn(lines, 1000, 950, 1000, 1000, 1004, 1050));
        }

        [Test]
        public void AShortConnectorBetweenTwoRoads_NoHoleBetweenTheirRibbons()
        {
            // Lillehammer: 2–4 m holes where a connector's two ends each lay on another road but its middle on neither.
            var a = Way(30, "primary", 200, 1000, 1000, 1000, 1800, 1000);
            var b = Way(31, "primary", 200, 1015, 1000, 1015, 1800, 1015);
            var link = Way(32, "residential", 1000, 1000, 1000, 1015);
            var lines = new RoadGraph().SetTile(Key, Data(a, b, link), Flat);
            Assert.AreEqual(0f, Undrawn(lines, 1000, 1000, 1000, 1015));
        }

        [Test]
        public void AWayComingBackToItsOwnNode_MeetsItselfAtOneHeight()
        {
            // Drammen, Dalenveien: a cul-de-sac loop whose end comes back to one of its own nodes on a hillside, the two passes
            // graded 18 m apart there.
            static float Hill(Utm33 p) => (float)(100 + 0.25 * (p.N - 1000) + 0.1 * (p.E - 1000) + 12 * math.sin(p.N / 60) * math.cos(p.E / 70));
            var loop = Way(40, "residential", 1000, 600, 1000, 800, 1000, 1000, 1000, 1200, 1100, 1300, 1200, 1200, 1100, 1050, 1000, 1000);
            var lines = new RoadGraph().SetTile(Key, Data(loop), Hill);
            // The first pass's sample nearest the node, and the way's end there.
            var at = new double2(1000, 1000);
            RoadSample first = default, end = default; double best = double.MaxValue, endS = -1;
            foreach (var l in lines)
                foreach (var q in l.Samples)
                {
                    if (q.S < 600 && math.distance(q.P, at) < best) { best = math.distance(q.P, at); first = q; }
                    if (q.S > endS) { endS = q.S; end = q; }
                }
            Assert.Less(math.distance(end.P, at), 0.01, "the way ends on the node");
            Assert.Less(best, 2.6, "the first pass has a sample by the node");
            Assert.AreEqual(first.RoadY, end.RoadY, 0.05, $"both passes at the node: {first.RoadY:0.00} / {end.RoadY:0.00}");
        }

        [Test]
        public void ASideRoadLeavingAlongTheEndOfAnother_DrawsItself()
        {
            // Lillehammer, Mathiesens gate: a road leaving a junction along the square end of the primary that ends there was left
            // to that ribbon's edge, and drawn by neither over its first 6 m.
            var main = Way(50, "primary", 200, 1000, 1000, 1000);
            var side = Way(51, "residential", 1000, 1000, 1000, 1600);
            var lines = new RoadGraph().SetTile(Key, Data(main, side), Flat);
            Assert.AreEqual(0f, Undrawn(lines, true, 1000, 1000.5, 1000, 1010));
        }

        [Test]
        public void ASideRoadStartingWhereTheMainRoadIsSplit_NoHoleAtItsStart()
        {
            // The through road is split at the junction (two ways ending at the node), the side road starts there.
            var a = Way(20, "secondary", 200, 1000, 1000, 1000);
            var a2 = Way(21, "secondary", 1000, 1000, 1800, 1000);
            var side = Way(22, "residential", 1000, 1000, 1000, 1600);
            var lines = new RoadGraph().SetTile(Key, Data(a, a2, side), Flat);
            Assert.AreEqual(0f, Undrawn(lines, 1000, 1000, 1000, 1060), "the side road from the junction on");
            Assert.AreEqual(0f, Undrawn(lines, 950, 1000, 1050, 1000), "the through road across the joint");
        }
    }
}
