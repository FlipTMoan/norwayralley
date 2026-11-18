using System.Collections;
using NUnit.Framework;
using Rally.Core;
using Rally.Gameplay;
using Rally.Presentation;
using Rally.Vehicle;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace Rally.Tests.Play
{
    /// <summary>
    /// The keys of the JS game work in the Unity scene: G gearbox, Q/E switch to manual, C camera cycle,
    /// M mute, R restart, Esc back to the menu, F10 debug window, and the touch GAS button drives the car.
    /// Keys are pressed through the Input System test fixture on a virtual keyboard; the world is the offline fake.
    /// </summary>
    public class ControlsTests : InputTestFixture
    {
        const string ScenePath = "Assets/_Rally/Scenes/Rally.unity";
        Keyboard kb;

        IEnumerator Boot()
        {
            kb = InputSystem.AddDevice<Keyboard>();
            SceneManager.LoadScene(ScenePath);
            yield return null;
            var game = Object.FindAnyObjectByType<GameController>();
            Assert.IsNotNull(game);
            float until = Time.realtimeSinceStartup + 20f;
            while (game.Phase != Phase.Intro && Time.realtimeSinceStartup < until) yield return null;
            Assert.AreEqual(Phase.Intro, game.Phase, "the world did not load");
        }

        IEnumerator Tap(UnityEngine.InputSystem.Controls.KeyControl key)
        {
            Press(key); yield return null;
            Release(key); yield return null;
        }

        [UnityTest]
        public IEnumerator KeysOfTheWebVersionWork()
        {
            using var watch = new LogWatch();
            yield return Boot();
            var game = Object.FindAnyObjectByType<GameController>();
            var car = Object.FindAnyObjectByType<CarController>();
            var rig = Object.FindAnyObjectByType<CameraRig>();

            bool auto = car.AutoShift;
            yield return Tap(kb.gKey);
            Assert.AreEqual(!auto, car.AutoShift, "G toggles the gearbox");
            if (!car.AutoShift) yield return Tap(kb.gKey);
            Assert.IsTrue(car.AutoShift);
            yield return Tap(kb.eKey);
            Assert.IsFalse(car.AutoShift, "E switches an automatic box to manual (main.js:1504)");
            yield return Tap(kb.gKey);

            var mode = rig.CurrentMode;
            yield return Tap(kb.cKey);
            Assert.AreNotEqual(mode, rig.CurrentMode, "C cycles the camera");

            yield return Tap(kb.mKey);
            Assert.AreEqual(0f, AudioListener.volume, "M mutes");
            yield return Tap(kb.mKey);
            Assert.AreEqual(1f, AudioListener.volume);

            game.StartEngine();
            float until = Time.realtimeSinceStartup + 6f;
            while (game.Phase != Phase.Racing && Time.realtimeSinceStartup < until) yield return null;
            Assert.AreEqual(Phase.Racing, game.Phase);

            // Touch GAS for a second: the car moves.
            var start = car.transform.position;
            TouchInput.Throttle = true;
            until = Time.realtimeSinceStartup + 1.5f;
            while (Time.realtimeSinceStartup < until) yield return null;
            TouchInput.Release();
            Assert.Greater(Vector3.Distance(car.transform.position, start), 1f, "the touch GAS button drives the car");

            yield return Tap(kb.rKey);
            Assert.AreEqual(Phase.Countdown, game.Phase, "R restarts the stage");
            Assert.Less(Vector3.Distance(car.transform.position, start), 3f, "R puts the car back on the start line");

            yield return Tap(kb.escapeKey);
            Assert.AreEqual(Phase.Intro, game.Phase, "Esc goes back to the start screen");

            var hud = Object.FindAnyObjectByType<Rally.UI.HudController>();
            if (hud != null)
            {
                bool before = hud.DebugVisible;
                yield return Tap(kb.f10Key);
                Assert.AreNotEqual(before, hud.DebugVisible, "F10 toggles the debug window");
            }
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }
    }
}
