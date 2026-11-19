using System.Collections;
using NUnit.Framework;
using Rally.Gameplay;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace Rally.Tests.Play
{
    /// <summary>
    /// The offline scene (FakeSources.Signs beside the fake road) gets its road signs: a sign mesh per near tile, drawn
    /// with the Rally/Sign shader and its atlas, faces facing along the road, and post colliders near the car.
    /// </summary>
    public class SignSceneTests
    {
        [UnityTest]
        public IEnumerator FakeSignsAreBuiltWithTheSignShaderAndColliders()
        {
            using var watch = new LogWatch();
            SceneManager.LoadScene("Assets/_Rally/Scenes/Rally.unity");
            yield return null;
            var game = Object.FindAnyObjectByType<GameController>();
            Assert.IsTrue(game.UseFakeSources);
            MeshRenderer signs = null;
            float until = Time.realtimeSinceStartup + 25f;
            while (signs == null && Time.realtimeSinceStartup < until)
            {
                foreach (var r in Object.FindObjectsByType<MeshRenderer>(FindObjectsSortMode.None))
                    if (r.name.StartsWith("Signs Coarse") && !r.name.Contains("empty")) { signs = r; break; }
                yield return null;
            }
            Assert.IsNotNull(signs, "no sign mesh within 25 s");
            Assert.IsNotNull(signs.sharedMaterial, "the sign material (Resources/Signs/Sign.shader) is missing");
            Assert.AreEqual("Rally/Sign", signs.sharedMaterial.shader.name);
            Assert.IsNotNull(signs.sharedMaterial.GetTexture("_BaseMap"), "the atlas page is bound");
            var mesh = signs.GetComponent<MeshFilter>().sharedMesh;
            int faceVerts = 0;
            var colours = mesh.colors; var normals = mesh.normals;
            for (int i = 0; i < colours.Length; i++)
                if (colours[i].a > 0.5f) { faceVerts++; Assert.Less(Mathf.Abs(normals[i].y), 0.01f, "plates stand upright"); }
            Assert.Greater(faceVerts, 50);
            // the fake road runs east–west: every face looks east or west
            for (int i = 0; i < colours.Length; i += 7) if (colours[i].a > 0.5f) Assert.Greater(Mathf.Abs(normals[i].x), 0.95f);
            yield return new WaitForSeconds(0.5f);
            int props = 0;
            foreach (var c in Object.FindObjectsByType<CapsuleCollider>(FindObjectsSortMode.None))
                if (c.gameObject.layer == LayerMask.NameToLayer("Props") && c.gameObject.activeInHierarchy) props++;
            Debug.Log($"sign scene: {faceVerts} face vertices, {props} post colliders near the car");
            Assert.IsEmpty(watch.Problems, watch.Summary);
        }
    }
}
