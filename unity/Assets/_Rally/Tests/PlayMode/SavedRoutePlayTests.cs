using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Threading.Tasks;
using NUnit.Framework;
using Rally.Core;
using Rally.Gameplay;
using Rally.Track;
using Rally.Vehicle;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace Rally.Tests.Play
{
    /// <summary>
    /// A saved route drives from its stored line (not the router), and the ground under the road along it is the 1 m level
    /// wherever the car is: no stretch beside the road with only the coarse 8 m ground (plan_20261122, one detail level).
    /// </summary>
    public class SavedRoutePlayTests
    {
        const BindingFlags Private = BindingFlags.NonPublic | BindingFlags.Instance;

        [UnityTest]
        public IEnumerator ASavedRouteDrivesItsOwnLineOnFineGround()
        {
            using var watch = new LogWatch();
            SceneManager.LoadScene("Assets/_Rally/Scenes/Rally.unity");
            yield return null;
            var game = Object.FindAnyObjectByType<GameController>();
            float until = Time.realtimeSinceStartup + 20f;
            while (game.Phase != Phase.Intro && Time.realtimeSinceStartup < until) yield return null;
            Assert.AreEqual(Phase.Intro, game.Phase, "the world did not load");

            // A bending 3 km line east of the car: the fake router would draw a straight one, so the stage shows which was used.
            var here = FloatingOrigin.ToUtm(Object.FindAnyObjectByType<CarController>().transform.position);
            var line = new List<LatLon>();
            for (int i = 0; i <= 60; i++) line.Add(Proj.ToLatLon(new Utm33(here.E + i * 50, here.N + 160 * math.sin(i * 50 / 3000.0 * math.PI))));
            var link = ShareLinks.Parse(ShareLinks.Osrm(line[0], line[line.Count - 1], "driving")).Value;
            var save = (Task<SavedRoute>)typeof(GameController).GetMethod("SaveRoute", Private)
                .Invoke(game, new object[] { "Test bend", link.A, link.B, "driving", line, 0.0 });
            while (!save.IsCompleted) yield return null;
            var route = save.Result;
            Assert.AreSame(route, game.SavedRoutes.Find(link.A, link.B, "driving"));

            var load = game.LoadFromQuery(ShareLinks.Osrm(link.A, link.B, "driving"));
            until = Time.realtimeSinceStartup + 30f;
            while (!load.IsCompleted && Time.realtimeSinceStartup < until) yield return null;
            Assert.IsTrue(load.IsCompleted && !load.IsFaulted, "the saved route did not load: " + load.Exception);
            var points = (List<Utm33>)typeof(GameController).GetField("stagePoints", Private).GetValue(game);
            Assert.AreEqual(line.Count, points.Count, "the stage line is the saved one");
            Assert.Greater(math.abs(points[30].N - here.N), 120, "and bends like it (no router)");

            var world = (TileWorld)typeof(GameController).GetField("world", Private).GetValue(game);
            var stage = (StageRoute)typeof(GameController).GetField("stage", Private).GetValue(game);
            var car = Object.FindAnyObjectByType<CarController>();
            int samples = 0, fine = 0;
            for (float s = 100f; s < stage.Length - 100f; s += 400f)
            {
                var p = stage.SampleAtDistance(s);
                car.ResetTo(p.XZ, p.Yaw);
                // the road from 100 m behind to 100 m ahead of the car: a 1 m tile under every 10 m of it
                var want = new List<TileKey>();
                for (float q = s - 100f; q <= s + 100f; q += 10f) want.Add(TileKey.At(TileKind.Fine, FloatingOrigin.ToUtm(stage.SampleAtDistance(q).XZ)));
                until = Time.realtimeSinceStartup + 20f;
                while (!want.TrueForAll(world.Scheduler.IsReady) && Time.realtimeSinceStartup < until) yield return null;
                samples += want.Count;
                fine += want.FindAll(world.Scheduler.IsReady).Count;
            }
            Assert.Greater(samples, 100);
            Assert.AreEqual(samples, fine, "a fine tile is ready under every sampled point of the road around the car");

            typeof(GameController).GetMethod("DeleteSavedRoute", Private).Invoke(game, new object[] { route.Id });
            yield return null;
            Assert.IsNull(game.SavedRoutes.Get(route.Id));
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }
    }
}
