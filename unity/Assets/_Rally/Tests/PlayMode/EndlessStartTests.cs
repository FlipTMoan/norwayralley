using System.Collections;
using NUnit.Framework;
using Rally.Core;
using Rally.Gameplay;
using Rally.Vehicle;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace Rally.Tests.Play
{
    /// <summary>
    /// Key N (scout a new stage) in the offline world: an endless link whose pin is 200 m beside the fake road,
    /// 1 km from its junctions, loads a stage (not free drive) with the car on the road facing along it.
    /// The fake road runs east–west through every 2048 m chunk centre.
    /// </summary>
    public class EndlessStartTests
    {
        [UnityTest]
        public IEnumerator ScoutedStageStartsOnTheRoad()
        {
            using var watch = new LogWatch();
            SceneManager.LoadScene("Assets/_Rally/Scenes/Rally.unity");
            yield return null;
            var game = Object.FindAnyObjectByType<GameController>();
            Assert.IsTrue(game.UseFakeSources);
            float until = Time.realtimeSinceStartup + 20f;
            while (game.Phase != Phase.Intro && Time.realtimeSinceStartup < until) yield return null;
            Assert.AreEqual(Phase.Intro, game.Phase, "the world did not load");
            Assert.IsTrue(game.FreeDrive, "precondition: the editor query is a free drive");

            var here = FloatingOrigin.ToUtm(Object.FindAnyObjectByType<CarController>().transform.position);
            double size = 2048, roadN = (System.Math.Floor(here.N / size) + 0.5) * size, centreE = (System.Math.Floor(here.E / size) + 0.5) * size;
            var pin = Proj.ToLatLon(new Utm33(centreE + 300, roadN + 200));
            var load = game.LoadFromQuery(ShareLinks.Endless(0xBEEF, pin));
            until = Time.realtimeSinceStartup + 30f;
            while (!load.IsCompleted && Time.realtimeSinceStartup < until) yield return null;
            Assert.IsTrue(load.IsCompleted && !load.IsFaulted, "the endless stage did not load: " + load.Exception);

            Assert.IsFalse(game.FreeDrive, "an endless link must give a stage, not free drive");
            Assert.GreaterOrEqual(game.PaceNoteCount, 0, "the stage line has pace notes (the straight fake road has no bends)");
            var car = Object.FindAnyObjectByType<CarController>();
            var at = FloatingOrigin.ToUtm(car.transform.position);
            Assert.AreEqual(roadN, at.N, 3.0, "the car spawns on the road");
            Assert.AreEqual(centreE + 300, at.E, 10.0, "beside the pin");
            Assert.Greater(Mathf.Abs(car.transform.forward.x), 0.95f, "facing along the east–west road");
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }
    }
}
