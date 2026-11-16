// Retro presenter: scanlines, ordered dither and a touch of barrel curvature (port of legacy-js/src/retro.js).
Shader "Rally/CRT"
{
    Properties
    {
        _Scanlines ("Scanlines", Range(0,1)) = 0.35
        _Dither ("Dither", Range(0,1)) = 0.5
        _Curvature ("Curvature", Range(0,0.2)) = 0.05
        _Vignette ("Vignette", Range(0,1)) = 0.3
        _InternalSize ("Internal size", Vector) = (640, 360, 0, 0)
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "RenderPipeline"="UniversalPipeline" }
        ZWrite Off Cull Off ZTest Always
        Pass
        {
            Name "CRT"
            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag
            #include "Packages/com.unity.render-pipelines.core/ShaderLibrary/Common.hlsl"
            #include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"

            float _Scanlines, _Dither, _Curvature, _Vignette;
            float4 _InternalSize;

            // 4x4 Bayer matrix, the same thresholds retro.js uses for its dithering.
            static const float BAYER[16] = { 0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5 };

            float4 Frag(Varyings i) : SV_Target
            {
                float2 uv = i.texcoord;
                // Barrel curvature: push the corners outward a little so the edges bow like a tube.
                float2 c = uv * 2 - 1;
                c *= 1 + _Curvature * dot(c, c);
                uv = c * 0.5 + 0.5;
                if (any(uv < 0) || any(uv > 1)) return float4(0, 0, 0, 1);

                // Snap to the low internal resolution so the picture has the 640x360 blockiness.
                float2 px = floor(uv * _InternalSize.xy);
                float2 snapped = (px + 0.5) / _InternalSize.xy;
                float3 col = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_PointClamp, snapped).rgb;

                // Ordered dither to a 5-bit-per-channel palette.
                float threshold = (BAYER[(int)(fmod(px.x, 4)) + 4 * (int)(fmod(px.y, 4))] + 0.5) / 16.0;
                col = lerp(col, floor(col * 31 + threshold) / 31, _Dither);

                // Scanlines: every other internal row darker.
                float line = fmod(px.y, 2) < 1 ? 1 : 1 - _Scanlines;
                col *= line;

                float vig = 1 - _Vignette * dot(c, c) * 0.5;
                return float4(col * vig, 1);
            }
            ENDHLSL
        }
    }
}
