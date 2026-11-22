using System.Collections;
using System.Reflection;
using NUnit.Framework;
using Rally.Core;
using Rally.Gameplay;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace Rally.Tests.Play
{
    /// <summary>
    /// "Strips of road and verge hang in the sky over the start screen" (2026-11-22): before the car was placed the camera
    /// stayed where the scene put it, 6 m over sea level, under the ground of any start above the sea. The terrain seen from
    /// below is not drawn, so the verges and ribbons along the roads graded meanwhile hung in the sky. While loading the
    /// camera now looks over the start pin from above its ground.
    /// </summary>
    public class LoadingViewTests
    {
        [UnityTest]
        public IEnumerator WhileLoading_TheCameraIsAboveTheGround()
        {
            using var watch = new LogWatch();
            SceneManager.LoadScene("Assets/_Rally/Scenes/Rally.unity");
            yield return null;
            var game = Object.FindAnyObjectByType<GameController>();
            var field = typeof(GameController).GetField("world", BindingFlags.NonPublic | BindingFlags.Instance);
            int looked = 0;
            float until = Time.realtimeSinceStartup + 20f;
            while (game.Phase == Phase.Loading && Time.realtimeSinceStartup < until)
            {
                yield return null;
                var world = (TileWorld)field.GetValue(game);
                if (game.Phase != Phase.Loading || world == null || !world.IsLoaded(float2.zero)) continue;
                var cam = game.MainCamera.transform.position;
                if (!world.IsLoaded(new float2(cam.x, cam.z))) continue;
                looked++;
                Assert.Greater(cam.y, world.HeightAt(new float2(cam.x, cam.z)) + 5f, $"camera at {cam} over the ground (the fake ground is 50 m up)");
            }
            Assert.Greater(looked, 0, "saw loading frames with the start's ground in");
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }
    }
}
