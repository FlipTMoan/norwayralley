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
    /// "Two cars are drawn at the start position" (2026-11-22): a stage picked while another is still loading must not
    /// leave the first load's car behind. Only the newest load places a car.
    /// </summary>
    public class OneCarTests
    {
        [UnityTest]
        public IEnumerator TwoOverlappingLoads_LeaveOneCar()
        {
            using var watch = new LogWatch();
            SceneManager.LoadScene("Assets/_Rally/Scenes/Rally.unity");
            yield return null;
            var game = Object.FindAnyObjectByType<GameController>();
            float until = Time.realtimeSinceStartup + 20f;
            while (game.Phase != Phase.Intro && Time.realtimeSinceStartup < until) yield return null;
            Assert.AreEqual(Phase.Intro, game.Phase, "the world did not load");

            var here = Proj.ToLatLon(FloatingOrigin.ToUtm(Object.FindAnyObjectByType<CarController>().transform.position));
            // The second stage starts before the first one has its ground: both awaits are pending at once.
            var first = game.LoadFromQuery(ShareLinks.Drive(here));
            var second = game.LoadFromQuery(ShareLinks.Drive(new LatLon(here.Lat + 0.01, here.Lon)));
            until = Time.realtimeSinceStartup + 30f;
            while (!(first.IsCompleted && second.IsCompleted) && Time.realtimeSinceStartup < until) yield return null;
            Assert.IsTrue(first.IsCompleted && !first.IsFaulted, "first load: " + first.Exception);
            Assert.IsTrue(second.IsCompleted && !second.IsFaulted, "second load: " + second.Exception);
            yield return null;   // Destroy takes effect at the end of the frame
            Assert.AreEqual(1, Object.FindObjectsByType<CarController>(FindObjectsSortMode.None).Length, "exactly one car in the scene");
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }
    }
}
