using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using Rally.Core;
using Rally.Geo;
using Rally.Gameplay;
using Rally.Tests.Geo;
using Rally.World;

namespace Rally.Tests.Gameplay
{
    /// <summary>
    /// A pause per data type (2026-11-22): a tile's overlay used to await all six fetches in turn, and to ask every type again
    /// after 45 s when the roads were missing. Now each type lands, applies and retries on its own, behind its own service's breaker.
    /// </summary>
    public class OverlayFetchTests : NoSyncContext
    {
        static readonly TileKey Key = new TileKey(TileKind.Coarse, 3, 3290);

        sealed class Fakes
        {
            public int Roads, Features, Cover, Surfaces, Signs, Lights;
            public double Now;
            public readonly List<TaskCompletionSource<bool>> Waits = new List<TaskCompletionSource<bool>>();
            public readonly List<OverlayData> Landed = new List<OverlayData>();

            public OverlayFetch Make(System.Func<Task<RoadGraphData>> roads, bool nvdbAnswers = true)
            {
                var f = new OverlayFetch
                {
                    Breakers = new ServiceBreakers(null, () => Now),
                    Roads = (b, ct) => { Roads++; return roads(); },
                    Features = (b, ct) => { Features++; return Task.FromResult(new Features()); },
                    Cover = (b, ct) => { Cover++; return Task.FromResult(new CoverRaster(4, 4, b)); },
                    Surfaces = (b, ct) => { Surfaces++; return Task.FromResult(nvdbAnswers ? new List<RoadSurfaceLine>() : null); },
                    Signs = (b, ct) => { Signs++; return Task.FromResult(nvdbAnswers ? new SignSet() : null); },
                    Lights = (b, ct) => { Lights++; return Task.FromResult(nvdbAnswers ? new LightSet() : null); },
                };
                f.Delay = (ms, ct) => { var t = new TaskCompletionSource<bool>(); Waits.Add(t); return t.Task; };
                return f;
            }

            /// <summary>Let the pending retry waits run out (and the breakers close).</summary>
            public void Elapse()
            {
                Now += CircuitBreaker.OpenMs + 1;
                var w = new List<TaskCompletionSource<bool>>(Waits); Waits.Clear();
                foreach (var t in w) t.SetResult(true);
            }
        }

        [Test]
        public void OverpassFailing_NvdbAndForestStillLand_AndOnlyOverpassIsAskedAgain()
        {
            var fk = new Fakes();
            var f = fk.Make(() => Task.FromResult<RoadGraphData>(null));
            var d = new TileOverlay();
            var all = f.Fetch(Key, d, () => true, w => fk.Landed.Add(w), default);
            Assert.IsNotNull(d.Signs, "signs landed"); Assert.IsNotNull(d.Lights, "lights landed"); Assert.IsNotNull(d.Cover, "forest landed");
            Assert.IsTrue(d.SurfacesTried && d.Surfaces != null, "surfaces landed");
            Assert.IsNull(d.Roads);
            Assert.IsTrue(f.Breakers.Overpass.IsOpen, "Overpass paused");
            Assert.IsFalse(f.Breakers.Nvdb.IsOpen || f.Breakers.Sr16.IsOpen, "the others are not");
            StringAssert.StartsWith("Overpass paused 60 s", f.Breakers.Paused());
            Assert.IsNull(d.Features, "the map features (Overpass too) are not asked while it is paused");
            Assert.AreEqual(2, fk.Waits.Count, "only the two Overpass lanes (roads, map features) wait to be asked again");
            fk.Elapse();
            Assert.AreEqual(2, fk.Roads, "Overpass asked again after its pause");
            Assert.AreEqual(0, fk.Features, "the map features wait out the same pause (the roads failing again tripped it again)");
            Assert.AreEqual((1, 1, 1, 1), (fk.Cover, fk.Surfaces, fk.Signs, fk.Lights), "nothing else is asked again");
            Assert.IsFalse(all.IsCompleted, "the roads lane keeps trying");
        }

        [Test]
        public void OverpassHanging_DoesNotHoldBackTheOthers()
        {
            var fk = new Fakes();
            var hang = new TaskCompletionSource<RoadGraphData>();
            var f = fk.Make(() => hang.Task);
            var d = new TileOverlay();
            f.Fetch(Key, d, () => true, w => fk.Landed.Add(w), default);
            CollectionAssert.IsSubsetOf(new[] { OverlayData.Features, OverlayData.Cover, OverlayData.Surfaces, OverlayData.Signs, OverlayData.Lights }, fk.Landed);
            Assert.AreEqual(OverlayData.Features | OverlayData.Cover | OverlayData.Surfaces | OverlayData.Signs | OverlayData.Lights, d.Pending);
            var roads = new RoadGraphData();
            hang.SetResult(roads);
            Assert.AreSame(roads, d.Roads, "the roads land when Overpass answers");
            Assert.IsTrue((d.Pending & OverlayData.Roads) != 0);
        }

        [Test]
        public void NvdbFailing_RoadsAndForestStillCome_AndNvdbRetriesOnItsOwn()
        {
            var fk = new Fakes();
            var f = fk.Make(() => Task.FromResult(new RoadGraphData()), nvdbAnswers: false);
            var d = new TileOverlay();
            f.Fetch(Key, d, () => true, w => fk.Landed.Add(w), default);
            Assert.IsNotNull(d.Roads, "roads landed"); Assert.IsNotNull(d.Cover, "forest landed");
            Assert.IsTrue(d.SurfacesTried, "the roads need not wait for a surface retry");
            Assert.IsTrue(f.Breakers.Nvdb.IsOpen); Assert.IsFalse(f.Breakers.Overpass.IsOpen);
            StringAssert.Contains("NVDB paused", f.Breakers.Paused());
            Assert.AreEqual((1, 0, 0), (fk.Surfaces, fk.Signs, fk.Lights), "a paused NVDB is not asked for the signs and lights of the same tile");
            fk.Elapse();
            Assert.AreEqual(1, fk.Roads, "Overpass is not asked again");
            Assert.AreEqual(1, fk.Cover, "nor SR16");
            Assert.AreEqual(2, fk.Surfaces, "NVDB is, after its pause");
        }

        /// <summary>Roads (a road region) and map features (the tile's heavy query) are two lanes: the roads do not wait for the houses.</summary>
        [Test]
        public void RoadsLandWithoutWaitingForTheMapFeatures()
        {
            var fk = new Fakes();
            var f = fk.Make(() => Task.FromResult(new RoadGraphData()));
            var features = new TaskCompletionSource<Features>();
            f.Features = (b, ct) => features.Task;
            var d = new TileOverlay();
            f.Fetch(Key, d, () => true, w => fk.Landed.Add(w), default);
            Assert.IsNotNull(d.Roads, "the roads are in while the features are still on their way");
            Assert.IsNull(d.Features);
            features.SetResult(new Features());
            Assert.IsNotNull(d.Features);
            Assert.IsTrue((d.Pending & OverlayData.Features) != 0);
        }

        [Test]
        public void ADroppedTile_StopsAsking()
        {
            var fk = new Fakes();
            var f = fk.Make(() => Task.FromResult<RoadGraphData>(null));
            bool live = true;
            var all = f.Fetch(Key, new TileOverlay(), () => live, _ => { }, default);
            live = false;
            fk.Elapse();
            Assert.AreEqual(1, fk.Roads);
            Assert.IsTrue(all.IsCompleted);
        }

        [Test]
        public void Outstanding_ListsOnlyTheTypesStillAwaited_WithTheirPause()
        {
            var fk = new Fakes();
            var hold = new TaskCompletionSource<RoadGraphData>();
            var f = fk.Make(() => hold.Task);
            var a = new TileOverlay(); var b = new TileOverlay();
            f.Fetch(Key, a, () => true, _ => { }, default);
            f.Fetch(new TileKey(TileKind.Coarse, 4, 3290), b, () => true, _ => { }, default);
            var w = f.Outstanding(5, new[] { a, b });
            Assert.AreEqual("waiting: terrain 5 · OSM roads 2", OverlayFetch.WaitingText(w), "only the held type (and the terrain asked for)");
            hold.SetResult(new RoadGraphData());
            Assert.AreEqual("", OverlayFetch.WaitingText(f.Outstanding(0, new[] { a, b })), "it drops off when it lands");

            var fk2 = new Fakes();
            var f2 = fk2.Make(() => Task.FromResult<RoadGraphData>(null));
            var c = new TileOverlay();
            f2.Fetch(Key, c, () => true, _ => { }, default);
            fk2.Now = 20000;
            var w2 = f2.Outstanding(3, new[] { c });
            Assert.AreEqual("waiting: terrain 3 · OSM roads 1 (paused 40 s) · OSM features 1 (paused 40 s)", OverlayFetch.WaitingText(w2));
            Assert.AreEqual("waiting: terrain 3 +2", OverlayFetch.WaitingText(w2, 1), "shortened on a phone");
            Assert.AreEqual("Overpass", w2[1].Service);
        }

        [Test]
        public void Breakers_AreOnePerService()
        {
            double now = 0;
            var b = new ServiceBreakers(null, () => now);
            b.Nvdb.Trip();
            Assert.IsTrue(b.Nvdb.IsOpen);
            Assert.IsFalse(b.Overpass.IsOpen || b.Sr16.IsOpen || b.Dtm.IsOpen);
            Assert.AreEqual("NVDB paused 60 s", b.Paused());
            now = 30000; b.Dtm.Trip();
            Assert.AreEqual("NVDB paused 30 s, DTM paused 60 s", b.Paused());
            now = 100000;
            Assert.AreEqual("", b.Paused());
        }
    }
}
