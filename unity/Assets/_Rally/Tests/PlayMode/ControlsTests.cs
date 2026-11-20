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
using UnityEngine.UIElements;

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

        /// <summary>
        /// User 2026-11-20: "User should be able to click ESC to come back to main menu to change cars etc." Esc while driving
        /// opens the start screen (driving HUD hidden), another car can be chosen there, and START ENGINE drives the same
        /// stage with it; the MENU button's path (BackToMenu) works from the countdown too.
        /// </summary>
        [UnityTest]
        public IEnumerator EscWhileDrivingOpensTheMenuToChangeTheCar()
        {
            using var watch = new LogWatch();
            yield return Boot();
            var game = Object.FindAnyObjectByType<GameController>();
            var hud = Object.FindAnyObjectByType<Rally.UI.HudController>();
            var hudRoot = hud.GetComponent<UIDocument>().rootVisualElement.Q("hud");
            Assert.IsTrue(hud.StartScreenVisible && hudRoot.ClassListContains("menu"), "the start screen hides the driving HUD");
            var car = Object.FindAnyObjectByType<CarController>();
            var firstKind = car.Kind;
            var startPos = car.transform.position;
            bool freeDrive = game.FreeDrive; int notes = game.PaceNoteCount;

            game.StartEngine();
            float until = Time.realtimeSinceStartup + 6f;
            while (game.Phase != Phase.Racing && Time.realtimeSinceStartup < until) yield return null;
            Assert.IsFalse(hud.StartScreenVisible || hudRoot.ClassListContains("menu"), "driving: the HUD is back, the start screen gone");
            Press(kb.wKey);
            until = Time.realtimeSinceStartup + 1.5f;
            while (Time.realtimeSinceStartup < until) yield return null;
            Release(kb.wKey);
            Assert.Greater(Vector3.Distance(car.transform.position, startPos), 1f, "drove away");

            yield return Tap(kb.escapeKey);
            Assert.AreEqual(Phase.Intro, game.Phase, "Esc while racing goes back to the start screen");
            Assert.IsTrue(hud.StartScreenVisible && hudRoot.ClassListContains("menu"));
            int index = System.Array.FindIndex(game.CarPrefabs, p => p.GetComponent<CarController>().Kind != firstKind);
            game.ChooseCar(index);
            yield return null;
            var newCar = Object.FindAnyObjectByType<CarController>();
            Assert.AreNotEqual(firstKind, newCar.Kind, "the car can be changed on the start screen reached by Esc");
            Assert.Less(Vector3.Distance(newCar.transform.position, startPos), 3f, "on the start line of the same stage");
            Assert.AreEqual(freeDrive, game.FreeDrive); Assert.AreEqual(notes, game.PaceNoteCount, "same stage");

            game.StartEngine();
            until = Time.realtimeSinceStartup + 6f;
            while (game.Phase != Phase.Racing && Time.realtimeSinceStartup < until) yield return null;
            Assert.AreEqual(Phase.Racing, game.Phase, "START ENGINE restarts the stage");
            Press(kb.wKey);
            until = Time.realtimeSinceStartup + 1.5f;
            while (Time.realtimeSinceStartup < until) yield return null;
            Release(kb.wKey);
            Assert.Greater(Vector3.Distance(newCar.transform.position, startPos), 1f, "the new car drives the stage");

            game.Restart();
            Assert.AreEqual(Phase.Countdown, game.Phase);
            game.BackToMenu();   // the HUD MENU button
            Assert.AreEqual(Phase.Intro, game.Phase, "MENU works during the countdown");
            game.ChooseCar(System.Array.FindIndex(game.CarPrefabs, p => p.GetComponent<CarController>().Kind == firstKind));   // leave the first car for the other tests
            yield return null;
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }

        /// <summary>
        /// User 2026-11-20: "the log window should be minimized by default", with "a progress bar on the minimized log window".
        /// The window is closed from the first frame, the LOG bar's progress rises while the start area loads and reads
        /// WORLD (everything around the car) once the stage can start; F2 opens and closes the full window.
        /// </summary>
        [UnityTest]
        public IEnumerator LogStartsMinimisedWithAProgressBar()
        {
            using var watch = new LogWatch();
            kb = InputSystem.AddDevice<Keyboard>();
            SceneManager.LoadScene(ScenePath);
            yield return null;
            var game = Object.FindAnyObjectByType<GameController>();
            var log = Object.FindAnyObjectByType<Rally.UI.LogWindow>();
            Assert.IsNotNull(log, "the HUD has its log window");
            var root = log.GetComponent<UIDocument>().rootVisualElement;
            var window = root.Q("logWindow"); var mini = root.Q("logMini"); var bar = root.Q("logProgress");
            Assert.IsNotNull(mini, "the minimised LOG bar exists"); Assert.IsNotNull(bar, "with a progress bar");
            Assert.IsFalse(log.IsOpen, "the log starts minimised");
            Assert.AreEqual(DisplayStyle.None, window.resolvedStyle.display);
            float lo = 2f, hi = -1f;
            float until = Time.realtimeSinceStartup + 20f;
            while (game.Phase != Phase.Intro && Time.realtimeSinceStartup < until)
            {
                if (game.Phase == Phase.Loading) { lo = Mathf.Min(lo, log.Progress); hi = Mathf.Max(hi, log.Progress); }
                Assert.IsFalse(log.IsOpen, "still minimised while the world loads");
                yield return null;
            }
            Assert.AreEqual(Phase.Intro, game.Phase, "the world did not load");
            Assert.Greater(hi, lo, $"the progress moved while loading ({lo:P0} → {hi:P0})");
            yield return new WaitForSecondsRealtime(0.4f);
            var text = root.Q<Label>("logProgressText").text;
            StringAssert.StartsWith("WORLD", text, "after loading the bar follows the streaming around the car");
            Assert.AreEqual(DisplayStyle.Flex, mini.resolvedStyle.display, "the LOG bar shows on the start screen");
            Assert.Greater(bar.resolvedStyle.width, 0f, "the bar is drawn");
            yield return Tap(kb.f2Key);
            Assert.IsTrue(log.IsOpen, "F2 opens the window");
            yield return Tap(kb.f2Key);
            Assert.IsFalse(log.IsOpen, "F2 minimises it again");
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }

        [UnityTest]
        public IEnumerator HOpensAndClosesTheHelpScreen()
        {
            using var watch = new LogWatch();
            yield return Boot();
            var game = Object.FindAnyObjectByType<GameController>();
            var hud = Object.FindAnyObjectByType<Rally.UI.HudController>();
            Assert.IsNotNull(hud);
            Assert.IsFalse(hud.HelpVisible, "the help screen starts closed");
            yield return Tap(kb.hKey);
            Assert.IsTrue(hud.HelpVisible, "H opens the help screen");
            Assert.AreEqual(0f, Time.timeScale, "the game pauses under it");
            yield return Tap(kb.hKey);
            Assert.IsFalse(hud.HelpVisible, "H closes it again");
            Assert.AreEqual(1f, Time.timeScale, "and time runs again");
            yield return Tap(kb.f1Key);
            Assert.IsTrue(hud.HelpVisible, "F1 opens it too");
            yield return Tap(kb.escapeKey);
            Assert.IsFalse(hud.HelpVisible, "Esc closes it");
            Assert.AreEqual(Phase.Intro, game.Phase, "and does not leave the start screen");

            // Closed, it blocks nothing: the engine starts and the car drives.
            game.StartEngine();
            float until = Time.realtimeSinceStartup + 6f;
            while (game.Phase != Phase.Racing && Time.realtimeSinceStartup < until) yield return null;
            Assert.AreEqual(Phase.Racing, game.Phase);
            var car = Object.FindAnyObjectByType<CarController>();
            var start = car.transform.position;
            Press(kb.wKey);
            until = Time.realtimeSinceStartup + 1.5f;
            while (Time.realtimeSinceStartup < until) yield return null;
            Release(kb.wKey);
            Assert.Greater(Vector3.Distance(car.transform.position, start), 1f, "W drives after the help screen was closed");
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }
    }
}
