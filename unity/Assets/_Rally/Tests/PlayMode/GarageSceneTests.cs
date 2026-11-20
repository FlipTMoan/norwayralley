using System.Collections;
using NUnit.Framework;
using Rally.Gameplay;
using Rally.Geo;
using Rally.Vehicle;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.UIElements;

namespace Rally.Tests.Play
{
    /// <summary>
    /// The car chooser in the bootstrap scene: every car on the start screen replaces the one on the line, is remembered
    /// (localStorage rally.car), drives off the line after the countdown and takes damage from a hit; and the choice is
    /// still there after the scene loads again (the next visit).
    /// </summary>
    public class GarageSceneTests
    {
        const string ScenePath = "Assets/_Rally/Scenes/Rally.unity";

        static IEnumerator Boot(System.Action<GameController> got)
        {
            SceneManager.LoadScene(ScenePath);
            yield return null;
            var game = Object.FindAnyObjectByType<GameController>();
            Assert.IsNotNull(game);
            float until = Time.realtimeSinceStartup + 20f;
            while (game.Phase != Phase.Intro && Time.realtimeSinceStartup < until) yield return null;
            Assert.AreEqual(Phase.Intro, game.Phase, "the world did not load within 20 s");
            got(game);
        }

        [UnityTest]
        public IEnumerator EveryCarIsChosenDrivesAndTakesDamage()
        {
            using var watch = new LogWatch();
            GameController game = null;
            yield return Boot(g => game = g);
            Assert.GreaterOrEqual(game.CarPrefabs.Length, 8, "the scene lists the garage (run SceneBuilder)");
            var doc = Object.FindAnyObjectByType<UIDocument>();
            Assert.IsNotNull(doc.panelSettings, "the HUD has its panel settings (a scene saved without them shows no HUD)");
            Assert.AreEqual(game.CarPrefabs.Length, doc.rootVisualElement.Q("carCards").childCount, "a card per car");
            for (int i = 0; i < game.CarPrefabs.Length; i++)
            {
                var want = game.CarPrefabs[i].GetComponent<CarController>().Kind;
                game.ChooseCar(i);
                yield return null;
                var cars = Object.FindObjectsByType<CarController>(FindObjectsSortMode.None);
                Assert.AreEqual(1, cars.Length, $"{want}: exactly one car on the line");
                var car = cars[0];
                Assert.AreEqual(want, car.Kind);
                Assert.AreEqual(want, game.ChosenCar);
                Assert.AreEqual(Garage.Info(want).Id, BrowserDom.LocalGet("rally.car"), "choice remembered");

                car.Driver = new ScriptedDriver { TargetKmh = 120f };
                var start = car.transform.position; var forward = car.transform.forward;
                game.StartEngine();
                float until = Time.realtimeSinceStartup + 6f;
                while (game.Phase != Phase.Racing && Time.realtimeSinceStartup < until) yield return null;
                Assert.AreEqual(Phase.Racing, game.Phase, $"{want}: countdown");
                until = Time.realtimeSinceStartup + 3f;
                while (Time.realtimeSinceStartup < until) yield return null;
                float moved = Vector3.Dot(car.transform.position - start, forward);
                // The fake stage's start line counts as rough ground, where the Volvo (least traction) crawls: ~5.0 m before the
                // wheelspin (plan "Off road: wheelspin and mud"), 4.9 m with it. The point is that every car drives away.
                Assert.Greater(moved, 4f, $"{want} moved {moved:F1} m in 3 s ({car.SpeedKmh:F0} km/h, {car.State.SurfaceKind}, on road {car.State.OnRoad}, slip {car.State.WheelSlip:F1} m/s)");
                car.ApplyExternalHit(new float3(0f, 0f, -1f), 12f, 500f);
                Assert.Greater(car.Damage, 0f, $"{want}: a hit damages it");
                Assert.IsFalse(car.Wrecked, want.ToString());

                game.ChooseCar((i + 1) % game.CarPrefabs.Length);   // refused while racing
                yield return null;
                Assert.AreEqual(want, Object.FindAnyObjectByType<CarController>().Kind, "no car change during the stage");
                game.ToMenu();
                yield return null;
                Assert.AreEqual(Phase.Intro, game.Phase);
            }
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }

        [UnityTest]
        public IEnumerator TheChoiceIsKeptForTheNextVisit()
        {
            GameController game = null;
            yield return Boot(g => game = g);
            int volvo = System.Array.FindIndex(game.CarPrefabs, p => p.GetComponent<CarController>().Kind == CarKind.Volvo240);
            Assert.GreaterOrEqual(volvo, 0);
            game.ChooseCar(volvo);
            yield return null;
            yield return Boot(g => game = g);
            Assert.AreEqual(CarKind.Volvo240, Object.FindAnyObjectByType<CarController>().Kind, "the Volvo again after a reload");
            game.ChooseCar(0);   // leave the 911 for the other scene tests
        }
    }
}
