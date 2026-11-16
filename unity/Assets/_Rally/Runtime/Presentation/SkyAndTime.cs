using UnityEngine;

namespace Rally.Presentation
{
    /// <summary>
    /// Time of day for the directional sun: Norwegian latitude means a low sun and long shadows even at noon
    /// (an elevation of 55° at 59° N in June, 8° in December). The sky itself is URP's physically based
    /// skybox material driven by the same sun. The JS game had a fixed afternoon light (main.js lights).
    /// </summary>
    public sealed class SkyAndTime : MonoBehaviour
    {
        public Light Sun;
        [Range(0, 24)] public float Hour = 15f;
        [Range(1, 12)] public int Month = 7;
        [Range(57, 71)] public float LatitudeDeg = 59f;
        public float SunIntensityNoon = 2.2f;
        public Color Horizon = new Color(1f, 0.72f, 0.45f);
        public Color Zenith = new Color(1f, 0.97f, 0.9f);

        void Update()
        {
            if (Sun == null) return;
            float decl = 23.44f * Mathf.Sin((Month - 3.2f) / 12f * Mathf.PI * 2f) * Mathf.Deg2Rad;
            float lat = LatitudeDeg * Mathf.Deg2Rad;
            float ha = (Hour - 12f) / 24f * Mathf.PI * 2f;
            float sinEl = Mathf.Sin(lat) * Mathf.Sin(decl) + Mathf.Cos(lat) * Mathf.Cos(decl) * Mathf.Cos(ha);
            float el = Mathf.Asin(Mathf.Clamp(sinEl, -1f, 1f));
            float az = Mathf.Atan2(Mathf.Sin(ha), Mathf.Cos(ha) * Mathf.Sin(lat) - Mathf.Tan(decl) * Mathf.Cos(lat)) + Mathf.PI;
            Sun.transform.rotation = Quaternion.Euler(el * Mathf.Rad2Deg, az * Mathf.Rad2Deg, 0f);
            float t = Mathf.Clamp01(Mathf.Sin(el) * 3f);
            Sun.intensity = SunIntensityNoon * t;
            Sun.color = Color.Lerp(Horizon, Zenith, Mathf.Clamp01(Mathf.Sin(el) * 2f));
            RenderSettings.ambientIntensity = Mathf.Lerp(0.15f, 1f, t);
        }
    }
}
