using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Roads;
using Rally.Tests.Geo;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;
using Object = UnityEngine.Object;

namespace Rally.Tests.World
{
    /// <summary>Real road signs: NVDB parsing, the plate text, designs and faces, placement and facing, the mesh, the cache.</summary>
    public class SignTests : NoSyncContext
    {
        static Dictionary<string, object> Obj(string json) => Json.ParseObject(json);

        // ---- parsing -----------------------------------------------------------------------------------------

        [Test]
        public void SkiltplateParsesCodeSizeFacingAndSide()
        {
            var p = NvdbSource.ParseSignPlate(Obj("{\"id\":80234879,\"egenskaper\":["
                + "{\"id\":1894,\"verdi\":\"Trafikk mot metreringsretning\"},{\"id\":5530,\"verdi\":\"906V - Hindermarkering, hinder til venstre\"},"
                + "{\"id\":1970,\"verdi\":\"Liten størrelse\"},{\"id\":1910,\"verdi\":\"N/A\"}],"
                + "\"geometri\":{\"wkt\":\"POINT Z (10176.267 6642408.124 20.218)\"},\"lokasjon\":{\"stedfestinger\":[{\"sideposisjon\":\"VT\"}]}}"));
            Assert.AreEqual("906", p.Number);
            Assert.AreEqual("906V", p.Code);
            Assert.AreEqual(SignSize.Small, p.Size);
            Assert.AreEqual(SignFacing.Against, p.Facing);
            Assert.AreEqual(RoadSide.Left, p.Side);
            Assert.AreEqual("713.H", NvdbSource.CodeOf("713.H - Vanlig vegviser, Høyre"));
            Assert.AreEqual(SignFacing.TowardRoad, NvdbSource.Facing("Parallelt mot veg"));
            Assert.AreEqual(SignFacing.AwayFromRoad, NvdbSource.Facing("Parallelt fra veg"));
            Assert.AreEqual(SignFacing.Both, NvdbSource.Facing("Tosidig"));
            Assert.AreEqual(SignFacing.With, NvdbSource.Facing("Trafikk i metreringsretning"));
            Assert.AreEqual(RoadSide.Unknown, NvdbSource.SideOf("M"));
            Assert.AreEqual(RoadSide.Right, NvdbSource.SideOf("H"));
        }

        [Test]
        public void DirectionTextSplitsIntoLinesWithRoadShields()
        {
            var l = SignText.Parse("@723.15@$520$Sauda 3@31@");
            Assert.AreEqual(1, l.Count);
            Assert.AreEqual("520", l[0].Shield); Assert.AreEqual("723.15", l[0].ShieldCode); Assert.AreEqual("Sauda 3", l[0].Text);
            l = SignText.Parse("@650.40@Fjord & Fjell@610.1@Bunker Oil@31@");
            Assert.AreEqual(2, l.Count);
            Assert.AreEqual("Fjord & Fjell", l[0].Text); Assert.IsNull(l[0].Shield); Assert.AreEqual("Bunker Oil", l[1].Text);
            l = SignText.Parse("@723.15@$520$");
            Assert.AreEqual(1, l.Count); Assert.AreEqual("520", l[0].Shield); Assert.AreEqual("", l[0].Text);
            l = SignText.Parse("Åbødalen @31@");
            Assert.AreEqual("Åbødalen", l[0].Text);
            Assert.AreEqual(0, SignText.Parse("@611@@31@").Count, "pictograms only: nothing to write");
        }

        // ---- designs and faces ----------------------------------------------------------------------------------

        static SignPlate Plate(string code, string text = null, SignSize size = SignSize.Medium)
            => new SignPlate { Id = 1, Code = code, Number = NvdbSource.SignNumber(code), Text = text, Size = size };

        [Test]
        public void CatalogHasTheNorwegianShapesAndSizes()
        {
            var speed = SignCatalog.For(Plate("362.50"));
            Assert.AreEqual(PlateShape.Disc, speed.Shape); Assert.AreEqual(700, speed.WidthMm, 1e-3); Assert.AreEqual("362.50", speed.Key);
            Assert.AreEqual(PlateShape.TriangleUp, SignCatalog.For(Plate("100.1")).Shape);
            Assert.AreEqual(600, SignCatalog.For(Plate("100.1", null, SignSize.Small)).WidthMm, 1e-3);
            Assert.AreEqual(PlateShape.TriangleDown, SignCatalog.For(Plate("202")).Shape);
            Assert.AreEqual(PlateShape.Octagon, SignCatalog.For(Plate("204")).Shape);
            Assert.AreEqual(PlateShape.Diamond, SignCatalog.For(Plate("206")).Shape);
            Assert.AreEqual("366.40", SignCatalog.For(Plate("366"), 40).Key, "the zone sign takes the NVDB speed limit at the plate");
            var dir = SignCatalog.For(Plate("713.V", "@723.15@$520$Sauda 3@31@"));
            Assert.AreEqual(PlateShape.ArrowLeft, dir.Shape);
            Assert.Greater(dir.WidthMm, 900); Assert.Less(dir.HeightMm, 260);
            Assert.IsTrue(SignCatalog.For(Plate("802", "100 m")).Supplementary);
            Assert.AreEqual("906V", SignCatalog.For(Plate("906V")).Key);
            Assert.IsNull(SignCatalog.For(Plate("701.1", "@36@Svandal")), "boards without a design are not drawn");
            Assert.IsNull(SignCatalog.For(Plate("U722.3")));
            Assert.IsNull(SignCatalog.For(Plate("727.1")), "a place-name sign without its name");
        }

        static Color At(SignCanvas c, float xMm, float yMm)
            => c.Pixels[(Mathf.FloorToInt(yMm * c.PxPerMm) + c.Gutter) * c.Width + Mathf.FloorToInt(xMm * c.PxPerMm) + c.Gutter];

        static Color Paint(SignDesign d, out SignCanvas c) { c = new SignCanvas(d.WidthMm, d.HeightMm, SignAtlas.PxPerMm, SignAtlas.Gutter); d.Paint(c); return default; }

        static bool Near(Color a, Color b, float tol = 0.08f) => Mathf.Abs(a.r - b.r) < tol && Mathf.Abs(a.g - b.g) < tol && Mathf.Abs(a.b - b.b) < tol;

        [Test]
        public void SpeedLimitFaceIsARedRingWithBlackNumerals()
        {
            Paint(SignCatalog.For(Plate("362.80")), out var c);
            Assert.IsTrue(Near(At(c, 350, 20), SignCatalog.Red), "ring at the top");
            Assert.IsTrue(Near(At(c, 350, 140), SignCatalog.White), "white field inside the ring");
            int dark = 0;
            for (int y = 260; y < 440; y += 4) for (int x = 180; x < 520; x += 4) if (At(c, x, y).r < 0.2f) dark++;
            Assert.Greater(dark, 300, "the numerals are drawn (font atlas works)");
            // anti-aliased edge: some pixels between ring and field are neither
            int mixed = 0;
            for (int y = 0; y < c.Height; y++) { var p = c.Pixels[y * c.Width + c.Width / 2]; if (p.g > 0.2f && p.g < 0.8f && p.r > 0.85f) mixed++; }
            Assert.Greater(mixed, 0, "edges are anti-aliased");
        }

        [Test]
        public void WarningFaceIsWhiteWithARedBorderAndTheLettersHaveNorwegianCharacters()
        {
            Paint(SignCatalog.For(Plate("146.1")), out var c);
            Assert.IsTrue(Near(At(c, 450, 760), SignCatalog.Red), "border at the bottom edge");
            Assert.IsTrue(Near(At(c, 450, 300), SignCatalog.White) || At(c, 450, 300).r < 0.2f, "field or pictogram inside");
            var font = SignFont.Shared;
            Assert.IsNotNull(font);
            foreach (var ch in "ÆØÅæøå0123456789") Assert.IsTrue(font.TryGlyph(ch, out _), "glyph " + ch);
        }

        [Test]
        public void AtlasPaintsEachFaceOnceAndSharesIt()
        {
            using var atlas = new SignAtlas(null);
            var a = atlas.Acquire(SignCatalog.For(Plate("362.50")));
            var b = atlas.Acquire(SignCatalog.For(Plate("362.50")));
            var d = atlas.Acquire(SignCatalog.For(Plate("713.H", "Saudasjøen")));
            Assert.AreSame(a, b);
            Assert.AreEqual(2, atlas.Pending);
            atlas.PaintAll();
            Assert.AreEqual(2, atlas.Painted);
            Assert.IsTrue(a.Painted && d.Painted);
            Assert.AreEqual(2, a.Refs);
            var cellA = new RectInt(a.Cell.position, a.Cell.size);
            Assert.IsFalse(cellA.Overlaps(d.Cell) && a.Page == d.Page, "cells do not overlap");
            var tex = atlas.TextureOf(a.Page);
            var centre = tex.GetPixel(a.Cell.x + a.Cell.width / 2, a.Cell.y + a.Cell.height / 2);
            Assert.Greater(centre.r + centre.g + centre.b, 0.5f);
            atlas.Release(a); atlas.Release(b);
            Assert.AreSame(a, atlas.Acquire(SignCatalog.For(Plate("362.50"))), "kept after release, not painted again");
            atlas.PaintAll();
            Assert.AreEqual(2, atlas.Painted);
        }

        // ---- placement -----------------------------------------------------------------------------------------

        /// <summary>An east–west tertiary road along N = 6 781 000.</summary>
        static RoadGraph EastRoad()
        {
            var g = new RoadGraph();
            var w = new RoadWay { Id = 7 };
            w.Tags["highway"] = "tertiary";
            for (double e = 256000; e <= 258000; e += 50) w.Nodes.Add(new Utm33(e, 6781000));
            var data = new RoadGraphData(); data.Ways.Add(w);
            g.SetTile(new TileKey(TileKind.Coarse, 125, 3311), data, _ => 100f);
            return g;
        }

        static readonly Bounds25833 Tile = new TileKey(TileKind.Coarse, 125, 3311).Bounds;

        [Test]
        public void FaceDirectionFollowsNvdbMeteringOrTheRightHandRule()
        {
            var t = new double2(1, 0);
            // right of the tangent, NVDB right of metering: metering = tangent, "i metreringsretning" faces against it
            Assert.AreEqual(new double2(-1, 0), SignPlacement.FaceDirection(SignFacing.With, RoadSide.Right, t, -1, new double2(0, 1)));
            // the same plate, but NVDB says left of metering: metering runs the other way
            Assert.AreEqual(new double2(1, 0), SignPlacement.FaceDirection(SignFacing.With, RoadSide.Left, t, -1, new double2(0, 1)));
            Assert.AreEqual(new double2(-1, 0), SignPlacement.FaceDirection(SignFacing.Against, RoadSide.Left, t, -1, new double2(0, 1)));
            // unknown: right-hand rule (right of the tangent faces traffic driving along it)
            Assert.AreEqual(new double2(-1, 0), SignPlacement.FaceDirection(SignFacing.Unknown, RoadSide.Unknown, t, -1, new double2(0, 1)));
            Assert.AreEqual(new double2(1, 0), SignPlacement.FaceDirection(SignFacing.Unknown, RoadSide.Unknown, t, 1, new double2(0, -1)));
            Assert.AreEqual(new double2(0, 1), SignPlacement.FaceDirection(SignFacing.TowardRoad, RoadSide.Right, t, -1, new double2(0, 1)));
        }

        [Test]
        public void PlatesStandOnTheShoulderFacingTheirTrafficAndShareAPost()
        {
            var roads = EastRoad();
            Assert.IsTrue(roads.Nearest(new Utm33(257000, 6781000), 5, out var hit));
            var plates = new List<SignPlate>
            {
                // south of an eastbound road = right of the tangent: faces west, towards eastbound traffic
                new SignPlate { Id = 3, Code = "802", Number = "802", Text = "150 m", Position = new Utm33(257000.2, 6780994), Facing = SignFacing.Unknown },
                new SignPlate { Id = 2, Code = "100.1", Number = "100.1", Position = new Utm33(257000, 6780994), Facing = SignFacing.Unknown },
                // north side, 1.5 m off the centre line (OSM line off): pushed out to the shoulder
                new SignPlate { Id = 4, Code = "362.60", Number = "362.60", Position = new Utm33(257300, 6781001.5), Side = RoadSide.Right, Facing = SignFacing.With },
                new SignPlate { Id = 5, Code = "U722.3", Number = null, Position = new Utm33(257400, 6780995) },
                new SignPlate { Id = 6, Code = "362.50", Number = "362.50", Position = new Utm33(257500, 6780960) },
                new SignPlate { Id = 7, Code = "362.50", Number = "362.50", Position = new Utm33(250000, 6780995) },
            };
            var posts = SignPlacement.Place(plates, roads, p => SignCatalog.For(p), Tile, out int skipped, out int offRoad);
            Assert.AreEqual(1, skipped, "U722.3 has no design");
            Assert.AreEqual(1, offRoad, "40 m from the road");
            Assert.AreEqual(2, posts.Count, "the plate outside the tile is another tile's");
            var a = posts[0];
            Assert.AreEqual(2, a.Plates.Count);
            Assert.AreEqual("100.1", a.Plates[0].Plate.Code, "the main sign above its supplementary plate");
            Assert.AreEqual("802", a.Plates[1].Plate.Code);
            Assert.AreEqual(-1, a.Plates[0].Face.x, 1e-6);
            double setback = RoadConstants.FlatHalf(hit.Half) + SignPlacement.PostSetback;
            Assert.AreEqual(6781000 - math.max(6, setback), a.Position.N, 1e-6, "the real distance when beyond the shoulder");
            var b = posts[1];
            Assert.AreEqual(6781000 + setback, b.Position.N, 1e-6, "a plate too close to the line is moved out to the shoulder");
            Assert.AreEqual(257300, b.Position.E, 1e-6, "keeping its place along the road");
            Assert.AreEqual(1, b.Plates[0].Face.x, 1e-6, "NVDB right of metering but left of the tangent: metering runs west, so 'i metreringsretning' faces east");
        }

        [Test]
        public void SpeedChangesWithoutAPlateGetOneEachWay()
        {
            var a = new SpeedLimitSegment { Kmh = 80, Points = { new Utm33(256500, 6781000), new Utm33(257000, 6781000) } };
            var b = new SpeedLimitSegment { Kmh = 50, Points = { new Utm33(257000, 6781000), new Utm33(257500, 6781000) } };
            var made = SignPlacement.SpeedChangePlates(new[] { a, b }, new List<SignPlate>(), Tile);
            Assert.AreEqual(2, made.Count);
            var east = made.Find(p => p.SpeedKmh == 50);
            var west = made.Find(p => p.SpeedKmh == 80);
            Assert.Greater(east.Position.E, 257000); Assert.Less(east.Position.N, 6781000, "eastbound: past the change, on the right (south)");
            Assert.Less(west.Position.E, 257000); Assert.Greater(west.Position.N, 6781000);
            var posts = SignPlacement.Place(made, EastRoad(), p => SignCatalog.For(p), Tile, out _, out _);
            Assert.AreEqual(2, posts.Count);
            foreach (var post in posts)
                Assert.AreEqual(post.Plates[0].Plate.SpeedKmh == 50 ? -1 : 1, post.Plates[0].Face.x, 1e-6, "each faces the traffic entering its limit");
            var real = new List<SignPlate> { new SignPlate { Code = "362.50", Number = "362.50", Position = new Utm33(257010, 6780994) } };
            Assert.AreEqual(0, SignPlacement.SpeedChangePlates(new[] { a, b }, real, Tile).Count, "a real plate nearby: none made up");
            Assert.AreEqual(80, SignPlacement.KmhAt(new[] { a, b }, new Utm33(256800, 6781005)));
            Assert.AreEqual(0, SignPlacement.KmhAt(new[] { a, b }, new Utm33(256800, 6781100)));
        }

        // ---- mesh ----------------------------------------------------------------------------------------------

        [Test]
        public void MeshPutsThePlateInFrontOfThePostFacingItsTraffic()
        {
            using var atlas = new SignAtlas(null);
            var posts = SignPlacement.Place(new List<SignPlate>
            {
                new SignPlate { Id = 2, Code = "362.50", Number = "362.50", Position = new Utm33(257000, 6780994) },
                new SignPlate { Id = 3, Code = "364.50", Number = "364.50", Position = new Utm33(257000, 6780994), Facing = SignFacing.Unknown },
            }, EastRoad(), p => SignCatalog.For(p), Tile, out _, out _);
            // make the second plate face the other way (a start and an end of the limit back to back)
            var pp = posts[0].Plates[1]; pp.Face = -pp.Face; posts[0].Plates[1] = pp;
            var faces = new Dictionary<string, SignAtlas.Face>();
            foreach (var p in posts[0].Plates) faces[p.Design.Key] = atlas.Acquire(p.Design);
            atlas.PaintAll();
            var pages = new List<int>(); var feet = new List<(float3, float, float)>(); var info = new List<SignMesh.PlateInfo>();
            var origin = new Utm33(256000, 6780000);
            var mesh = SignMesh.Build(posts, origin, _ => 100f, d => faces[d.Key], pages, feet, info);
            Assert.IsNotNull(mesh);
            Assert.AreEqual(1, feet.Count);
            Assert.AreEqual(2, info.Count);
            var foot = feet[0].Item1;
            Assert.AreEqual(100f, foot.y, 1e-4);
            Assert.AreEqual(1000f, foot.x, 1e-3);
            var front = info[0];
            Assert.AreEqual(-1f, front.Normal.x, 0.03f, "faces west");
            Assert.Less(front.Centre.x, foot.x, "in front of the post");
            Assert.AreEqual(100f + SignMesh.PlateBottom + 0.35f, front.Centre.y, 1e-3, "a 700 mm disc with its lower edge at 1.5 m");
            Assert.AreEqual(1f, info[1].Normal.x, 0.03f);
            Assert.Greater(feet[0].Item2, SignMesh.PlateBottom + 0.6f, "the post reaches up behind the plate");
            // the face triangles are front-facing towards the reader (Unity: cross(b − a, c − a) points at the viewer)
            var v = mesh.vertices; var t = mesh.GetTriangles(0); var c = mesh.colors;
            int facing = 0, away = 0;
            for (int i = 0; i < t.Length; i += 3)
            {
                if (c[t[i]].a < 0.5f) continue;
                var n = Vector3.Cross(v[t[i + 1]] - v[t[i]], v[t[i + 2]] - v[t[i]]);
                var centre = (v[t[i]] + v[t[i + 1]] + v[t[i + 2]]) / 3;
                if (centre.x < foot.x) { if (n.x < 0) facing++; else away++; }
            }
            Assert.Greater(facing, 0); Assert.AreEqual(0, away);
            UnityEngine.Object.DestroyImmediate(mesh);
        }

        [Test]
        public void LayerBuildsNearTilesAndGivesNearPostsColliders()
        {
            var root = new GameObject("signs test");
            var pool = new PropColliderPool(8, 0);
            var key = new TileKey(TileKind.Coarse, 125, 3311);
            var layer = new SignLayer(root.transform, pool, _ => 100f);
            try
            {
                var posts = SignPlacement.Place(new List<SignPlate>
                {
                    new SignPlate { Id = 2, Code = "362.50", Number = "362.50", Position = new Utm33(257000, 6780994) },
                    new SignPlate { Id = 3, Code = "100.1", Number = "100.1", Position = new Utm33(257400, 6780994) },
                }, EastRoad(), p => SignCatalog.For(p), Tile, out _, out _);
                layer.SetTile(key, posts);
                var car = new Utm33(257010, 6781000);
                layer.BuildAll(car);
                Assert.AreEqual(1, layer.BuiltTiles);
                Assert.AreEqual(2, layer.DrawnPlates);
                layer.Update(car, FloatingOrigin.ToWorld(car, 100f));
                int active = 0;
                foreach (var c in Object.FindObjectsByType<CapsuleCollider>(FindObjectsSortMode.None)) if (c.gameObject.activeInHierarchy && c.gameObject.layer == RallyLayers.Props) active++;
                Assert.AreEqual(1, active, "only the post within 35 m of the car");
                layer.Update(new Utm33(259000, 6790000), float3.zero);
                Assert.AreEqual(0, layer.BuiltTiles, "dropped beyond 1.5 km");
            }
            finally { layer.Dispose(); pool.Dispose(); Object.DestroyImmediate(root); }
        }

        // ---- cache ---------------------------------------------------------------------------------------------

        [Test]
        public void SignPagesComeFromTheGeoCache()
        {
            // Bounds in the sea off Africa: NVDB itself would answer nothing, so plates can only come from the cache.
            var b = new Bounds25833(0, 0, 10, 10);
            var cache = new GeoCache(new MemoryBackend());
            string plates = "{\"objekter\":[{\"id\":9,\"egenskaper\":[{\"id\":5530,\"verdi\":\"362.70 - Fartsgrense 70 km/t\"}],\"geometri\":{\"wkt\":\"POINT Z (5 5 1)\"},\"lokasjon\":{\"stedfestinger\":[{\"sideposisjon\":\"H\"}]}}],\"metadata\":{\"returnert\":1}}";
            string limits = "{\"objekter\":[{\"id\":10,\"egenskaper\":[{\"id\":2021,\"verdi\":70}],\"geometri\":{\"wkt\":\"LINESTRING Z (0 5 1, 10 5 1)\"}}],\"metadata\":{\"returnert\":1}}";
            int loads = 0;
            cache.Fetch(NvdbSource.FirstPageUrl(NvdbSource.TypeSignPlate, b), () => { loads++; return Task.FromResult(Encoding.UTF8.GetBytes(plates)); }, "nvdb", true).Sync();
            cache.Fetch(NvdbSource.FirstPageUrl(NvdbSource.TypeSpeedLimit, b), () => { loads++; return Task.FromResult(Encoding.UTF8.GetBytes(limits)); }, "nvdb", true).Sync();
            var set = new NvdbSource(cache).FetchSigns(b, default).Sync();
            Assert.AreEqual(1, set.Plates.Count);
            Assert.AreEqual(70, set.Plates[0].SpeedKmh);
            Assert.AreEqual(1, set.SpeedLimits.Count);
            Assert.AreEqual(70, set.SpeedLimits[0].Kmh);
            Assert.AreEqual(2, loads);
        }

        [Test]
        public void FakeSourcesPutSignsBesideTheFakeRoad()
        {
            var osm = new FakeSources.Osm();
            var set = new FakeSources.Signs { Road = osm }.FetchSigns(Tile, default).Sync();
            Assert.GreaterOrEqual(set.Plates.Count, 5);
            var roads = EastRoadAt(osm);
            var posts = SignPlacement.Place(set.Plates, roads, p => SignCatalog.For(p, SignPlacement.KmhAt(set.SpeedLimits, p.Position)), Tile, out int skipped, out int offRoad);
            Assert.AreEqual(0, skipped); Assert.AreEqual(0, offRoad);
            Assert.AreEqual(set.Plates.Count, CountPlates(posts));
            Assert.AreEqual(set.Plates.Count - 1, posts.Count, "802 shares the bend warning's post");
        }

        static int CountPlates(List<SignPost> posts) { int n = 0; foreach (var p in posts) n += p.Plates.Count; return n; }

        static RoadGraph EastRoadAt(FakeSources.Osm osm)
        {
            var g = new RoadGraph();
            var key = new TileKey(TileKind.Coarse, 125, 3311);
            g.SetTile(key, osm.FetchRoads(key.Bounds, default).Sync(), _ => 100f);
            return g;
        }
    }
}
