using System.Collections;
using System.Reflection;
using NUnit.Framework;
using Rally.Core;
using Rally.Gameplay;
using Rally.Vehicle;
using Rally.World;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace Rally.Tests.Play
{
    /// <summary>
    /// Streaming ahead of the car in the offline world (fake sources): a normal (demo-routed) stage prefetches the stage line
    /// ahead — its 1 m tiles beyond the ring around the car load before the car gets there, not only in endless mode.
    /// </summary>
    public class StreamingTests
    {
        [UnityTest]
        public IEnumerator NormalStage_PrefetchesTheFineTilesAlongTheLineAhead()
        {
            using var watch = new LogWatch();
            SceneManager.LoadScene("Assets/_Rally/Scenes/Rally.unity");
            yield return null;
            var game = Object.FindAnyObjectByType<GameController>();
            float until = Time.realtimeSinceStartup + 20f;
            while (game.Phase != Phase.Intro && Time.realtimeSinceStartup < until) yield return null;
            Assert.AreEqual(Phase.Intro, game.Phase, "the world did not load");

            // A 3 km demo stage due east of the car (the fake router draws a straight line).
            var here = FloatingOrigin.ToUtm(Object.FindAnyObjectByType<CarController>().transform.position);
            var a = Proj.ToLatLon(here); var b = Proj.ToLatLon(new Utm33(here.E + 3000, here.N));
            var load = game.LoadFromQuery(ShareLinks.Demo(a, b));
            until = Time.realtimeSinceStartup + 30f;
            while (!load.IsCompleted && Time.realtimeSinceStartup < until) yield return null;
            Assert.IsTrue(load.IsCompleted && !load.IsFaulted, "the demo stage did not load: " + load.Exception);
            Assert.IsFalse(game.FreeDrive);

            var world = (TileWorld)typeof(GameController).GetField("world", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            // The first road under the car is in when the start screen shows: its tile's roads graded to the end and drawn.
            var roads = (Rally.Roads.RoadGraph)typeof(GameController).GetField("roads", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            var startTile = TileKey.At(TileKind.Coarse, FloatingOrigin.ToUtm(Object.FindAnyObjectByType<CarController>().transform.position));
            Assert.IsTrue(roads.HasTile(startTile), "the start tile's roads are graded");
            Assert.IsNotNull(GameObject.Find("Ribbon " + startTile), "and drawn");
            var start = FloatingOrigin.ToUtm(Object.FindAnyObjectByType<CarController>().transform.position);
            // The car stands still: the ring's 1 m tiles reach ~650 m (road points within 550 m of the car); beyond that only the prefetch asks for them.
            int far = 0;
            until = Time.realtimeSinceStartup + 20f;
            while (far == 0 && Time.realtimeSinceStartup < until)
            {
                foreach (var k in world.Scheduler.Keys)
                    if (k.Kind == TileKind.Fine && k.RectDistance(start) > 1000 && System.Math.Abs(k.Origin.N + 128 - start.N) < 300) far++;
                yield return null;
            }
            Assert.Greater(far, 0, "1 m tiles along the stage line more than 1 km ahead are wanted while the car waits at the start");
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }
    }
}
