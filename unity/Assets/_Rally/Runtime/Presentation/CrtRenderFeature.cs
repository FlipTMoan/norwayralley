using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.RenderGraphModule;
using UnityEngine.Rendering.RenderGraphModule.Util;
using UnityEngine.Rendering.Universal;

namespace Rally.Presentation
{
    /// <summary>
    /// The retro presenter (legacy-js/src/retro.js): the frame is rendered at a low internal resolution and
    /// blitted to the screen with scanlines, a 4×4 ordered dither and a little curvature. In URP the low
    /// resolution comes from the camera's render scale (set by WorldStyleSO), and this feature adds the
    /// CRT pass after post-processing. Disabled = the "realistic" preset.
    /// </summary>
    public sealed class CrtRenderFeature : ScriptableRendererFeature
    {
        [System.Serializable]
        public sealed class Settings
        {
            public Shader Shader;
            [Range(0, 1)] public float Scanlines = 0.35f;
            [Range(0, 1)] public float Dither = 0.5f;
            [Range(0, 0.2f)] public float Curvature = 0.05f;
            [Range(0, 1)] public float Vignette = 0.3f;
            public Vector2Int InternalSize = new Vector2Int(640, 360);
        }

        public Settings settings = new Settings();
        CrtPass pass;
        Material material;

        public override void Create()
        {
            if (settings.Shader == null) settings.Shader = Shader.Find("Rally/CRT");
            if (settings.Shader == null) return;
            material = CoreUtils.CreateEngineMaterial(settings.Shader);
            pass = new CrtPass(material, settings) { renderPassEvent = RenderPassEvent.AfterRenderingPostProcessing };
        }

        public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData)
        {
            if (pass == null || renderingData.cameraData.cameraType != CameraType.Game) return;
            renderer.EnqueuePass(pass);
        }

        protected override void Dispose(bool disposing)
        {
            CoreUtils.Destroy(material);
        }

        sealed class CrtPass : ScriptableRenderPass
        {
            readonly Material mat;
            readonly Settings s;
            static readonly int ScanlinesId = Shader.PropertyToID("_Scanlines");
            static readonly int DitherId = Shader.PropertyToID("_Dither");
            static readonly int CurvatureId = Shader.PropertyToID("_Curvature");
            static readonly int VignetteId = Shader.PropertyToID("_Vignette");
            static readonly int InternalSizeId = Shader.PropertyToID("_InternalSize");

            public CrtPass(Material m, Settings settings) { mat = m; s = settings; }

            public override void RecordRenderGraph(RenderGraph renderGraph, ContextContainer frameData)
            {
                var resources = frameData.Get<UniversalResourceData>();
                if (resources.isActiveTargetBackBuffer) return;
                var source = resources.activeColorTexture;
                var desc = renderGraph.GetTextureDesc(source);
                desc.name = "CRT";
                desc.clearBuffer = false;
                var dest = renderGraph.CreateTexture(desc);

                mat.SetFloat(ScanlinesId, s.Scanlines);
                mat.SetFloat(DitherId, s.Dither);
                mat.SetFloat(CurvatureId, s.Curvature);
                mat.SetFloat(VignetteId, s.Vignette);
                mat.SetVector(InternalSizeId, new Vector4(s.InternalSize.x, s.InternalSize.y, 0, 0));

                var p = new RenderGraphUtils.BlitMaterialParameters(source, dest, mat, 0);
                renderGraph.AddBlitPass(p, "CRT presenter");
                resources.cameraColor = dest;
            }
        }
    }
}
