using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// Feeds the Rally/Sky skybox from the scene's sun light (RenderSettings.sun, rotated by
    /// Rally.Presentation.SkyAndTime) and scrolls the clouds. A MonoBehaviour only because it binds a
    /// Light to shader globals every frame. Also keeps the ambient and fog colour in step with the sky
    /// so the ground does not stay noon-lit at dusk.
    /// </summary>
    [ExecuteAlways]
    public sealed class SkyBinder : MonoBehaviour
    {
        [Tooltip("Rally/Sky material also assigned to RenderSettings.skybox")] public Material SkyMaterial;
        [Tooltip("Cloud scroll speed in dome units per second (xy)")] public Vector2 Wind = new Vector2(0.004f, 0.0015f);
        [Tooltip("Scale the sun colour into ambient light at dusk")] public float AmbientScale = 0.45f;
        Vector2 windOffset;
        static readonly int SunDirId = Shader.PropertyToID("_SunDir"), SunColorId = Shader.PropertyToID("_SunColor"), WindId = Shader.PropertyToID("_WindOffset");

        void OnEnable() { if (SkyMaterial != null) RenderSettings.skybox = SkyMaterial; }

        void Update()
        {
            var sun = RenderSettings.sun;
            if (sun == null) return;
            Vector3 dir = -sun.transform.forward;
            Shader.SetGlobalVector(SunDirId, dir);
            Shader.SetGlobalVector(SunColorId, sun.color * sun.intensity);
            windOffset += Wind * Time.deltaTime;
            Shader.SetGlobalVector(WindId, new Vector4(windOffset.x, windOffset.y, 0, 0));
            float day = Mathf.Clamp01(dir.y * 6 + 0.3f);
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = Color.Lerp(new Color(0.03f, 0.04f, 0.07f), sun.color * AmbientScale, day);
            RenderSettings.fogColor = Color.Lerp(new Color(0.05f, 0.06f, 0.09f), RenderSettings.fogColor, day);
        }
    }
}
