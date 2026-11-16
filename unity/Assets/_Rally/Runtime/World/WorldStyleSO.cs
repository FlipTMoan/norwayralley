using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace Rally.World
{
    /// <summary>
    /// The realism knobs in one asset so "retro" and "realistic" are presets, not code paths: which
    /// splat set and materials, flat or smooth shading, fog, tree density and draw distance, the
    /// post-processing stack and the shadow budget. <see cref="Apply"/> pushes them into the world,
    /// the shader globals, the URP asset and a Volume profile. Assets are assigned in the editor
    /// (see unity/README-world.md).
    /// </summary>
    [CreateAssetMenu(menuName = "Rally/World Style", fileName = "WorldStyle")]
    public sealed class WorldStyleSO : ScriptableObject
    {
        public enum Preset { Retro, Realistic }
        public Preset Mode = Preset.Realistic;

        [Header("Terrain")]
        public Material TerrainMaterial;          // Rally/TerrainClipmap with the albedo/normal arrays
        public float TextureTiling = 6f;
        [Tooltip("Faceted low-poly look (retro)")] public bool FlatShading;
        public float SnowLineOffset = 0f, TreeLineOffset = 0f;
        public int ClipmapLevels = 7;

        [Header("Vegetation")]
        public VegetationSetSO Vegetation;
        public ComputeShader ScatterShader;
        [Range(0, 3)] public float TreeDensity = 1f;
        [Range(0.5f, 2f)] public float TreeScale = 1f;
        public float TreeDrawDistance = 900f;

        [Header("Water")]
        public Material LakeMaterial, RiverMaterial, SeaMaterial;   // Rally/Water (rivers: _Flow = 1, sea: _SwellAmp > 0)

        [Header("Buildings")]
        public Material BuildingMaterial;        // vertex-colour lit material

        [Header("Sky and fog")]
        public Material SkyMaterial;             // Rally/Sky
        public Color FogColor = new Color(0.72f, 0.78f, 0.85f);
        [Tooltip("URP exponential-squared fog density; 0 disables")] public float FogDensity = 0.00035f;
        public Color HeightFogColor = new Color(0.74f, 0.79f, 0.86f);
        [Tooltip("Valley fog density per metre of view distance near the base height")] public float HeightFogDensity = 0.0004f;
        public float HeightFogBase = 0f;

        [Header("Post-processing (written into PostProfile)")]
        public VolumeProfile PostProfile;        // the scene's global Volume uses this profile
        public bool Bloom = true; [Range(0, 2)] public float BloomIntensity = 0.35f;
        public bool AcesTonemapping = true;
        public bool Vignette = true; [Range(0, 1)] public float VignetteIntensity = 0.25f;
        public bool MotionBlur = true; [Range(0, 1)] public float MotionBlurIntensity = 0.3f;
        [Tooltip("SSAO is a URP Renderer Feature, enabled on the renderer asset in the editor; this only documents the intent")] public bool Ssao = true;

        [Header("Shadows (URP asset)")]
        public int ShadowCascades = 4;
        public float ShadowDistance = 200f;

        static readonly int TilingId = Shader.PropertyToID("_Tiling"), RetroId = Shader.PropertyToID("_RetroFlat"), SnowId = Shader.PropertyToID("_SnowLine"),
            HeightFogId = Shader.PropertyToID("_HeightFog"), HeightFogBaseId = Shader.PropertyToID("_HeightFogBase");

        public void Apply(TileWorld world)
        {
            if (TerrainMaterial != null)
            {
                TerrainMaterial.SetFloat(TilingId, TextureTiling);
                TerrainMaterial.SetFloat(RetroId, FlatShading ? 1 : 0);
                TerrainMaterial.SetFloat(SnowId, LandcoverSplat.SnowLine(61) + SnowLineOffset);
                TerrainMaterial.SetColor(HeightFogId, new Color(HeightFogColor.r, HeightFogColor.g, HeightFogColor.b, HeightFogDensity));
                TerrainMaterial.SetFloat(HeightFogBaseId, HeightFogBase);
            }
            RenderSettings.fog = FogDensity > 0;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogDensity = FogDensity;
            RenderSettings.fogColor = FogColor;
            if (SkyMaterial != null) RenderSettings.skybox = SkyMaterial;
            if (world != null && world.Vegetation != null)
            {
                world.Vegetation.Density = TreeDensity;
                world.Vegetation.Scale = TreeScale;
                world.Vegetation.DrawDistance = TreeDrawDistance;
            }
            ApplyPostProcessing();
            ApplyShadows();
        }

        /// <summary>Writes the stack into the Volume profile (bloom, ACES, vignette, motion blur). SSAO lives on the renderer asset.</summary>
        public void ApplyPostProcessing()
        {
            if (PostProfile == null) return;
            var bloom = GetOrAdd<Bloom>(PostProfile);
            bloom.active = Bloom; bloom.intensity.overrideState = true; bloom.intensity.value = BloomIntensity;
            var tone = GetOrAdd<Tonemapping>(PostProfile);
            tone.active = AcesTonemapping; tone.mode.overrideState = true; tone.mode.value = AcesTonemapping ? TonemappingMode.ACES : TonemappingMode.None;
            var vig = GetOrAdd<Vignette>(PostProfile);
            vig.active = Vignette; vig.intensity.overrideState = true; vig.intensity.value = VignetteIntensity;
            var mb = GetOrAdd<MotionBlur>(PostProfile);
            mb.active = MotionBlur; mb.intensity.overrideState = true; mb.intensity.value = MotionBlurIntensity;
        }

        static T GetOrAdd<T>(VolumeProfile profile) where T : VolumeComponent => profile.TryGet<T>(out var c) ? c : profile.Add<T>(true);

        public void ApplyShadows()
        {
            var asset = UniversalRenderPipeline.asset;
            if (asset == null) return;
            asset.shadowCascadeCount = ShadowCascades;
            asset.shadowDistance = ShadowDistance;
        }
    }
}
