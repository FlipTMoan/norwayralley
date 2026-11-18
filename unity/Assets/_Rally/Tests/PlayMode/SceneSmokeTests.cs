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
    /// The bootstrap scene (Rally → Build Bootstrap Scene) boots offline, the engine starts, the car drives.
    /// One scenario, because a scene boot is the expensive part: it proves the slots are wired, the fake world
    /// streams, the route exists and CarController + CarSim move the car on the world's ground. It runs twice:
    /// on the editor GPU's compute path and with <see cref="GpuCaps.ForceNoCompute"/>, which routes every C#
    /// GPU decision through the WebGL 2 fallbacks (Burst carve + re-upload, texture tile tables, CPU scatter +
    /// RenderMeshInstanced, CPU dents). The shaders stay the editor's high-target variants either way; the
    /// GLES 3.0 subshaders are compile-checked by Rally.Editor.BuildWeb.BuildWebGL2Only.
    /// </summary>
    public class SceneSmokeTests
    {
        const string ScenePath = "Assets/_Rally/Scenes/Rally.unity";

        [UnityTest]
        public IEnumerator BootsOfflineStartsTheEngineAndDrivesForward() => Drive(false);

        [UnityTest]
        public IEnumerator DrivesOnTheNoComputeFallbackPath() => Drive(true);

        IEnumerator Drive(bool forceNoCompute)
        {
            GpuCaps.ForceNoCompute = forceNoCompute;
            try { yield return DriveScene(); }
            finally { GpuCaps.ForceNoCompute = false; }
        }

        IEnumerator DriveScene()
        {
            using var watch = new LogWatch();
            SceneManager.LoadScene(ScenePath);
            yield return null;
            var game = Object.FindAnyObjectByType<GameController>();
            Assert.IsNotNull(game, "the scene has no GameController; run Rally → Build Bootstrap Scene");
            Assert.IsTrue(game.UseFakeSources, "the smoke test must not touch the live services");

            float until = Time.realtimeSinceStartup + 20f;
            while (game.Phase != Phase.Intro && Time.realtimeSinceStartup < until) yield return null;
            Assert.AreEqual(Phase.Intro, game.Phase, "the world did not finish loading within 20 s");

            var car = Object.FindAnyObjectByType<CarController>();
            Assert.IsNotNull(car, "no car was spawned");
            car.Driver = new ScriptedDriver { TargetKmh = 200f };     // full throttle, steering along the route
            var start = car.transform.position;
            var forward = car.transform.forward;

            game.StartEngine();
            until = Time.realtimeSinceStartup + 6f;
            while (game.Phase != Phase.Racing && Time.realtimeSinceStartup < until) yield return null;
            Assert.AreEqual(Phase.Racing, game.Phase, "the countdown did not reach Racing");
            until = Time.realtimeSinceStartup + 5f;
            while (Time.realtimeSinceStartup < until) yield return null;

            float moved = Vector3.Dot(car.transform.position - start, forward);
            Assert.Greater(moved, 5f, $"the car moved {moved:F1} m forward in 5 s at full throttle (speed {car.SpeedKmh:F0} km/h)");
            Assert.IsFalse(car.Wrecked);
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }
    }
}
