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
            // URP Core.hlsl first: Blit.hlsl needs TEXTURE2D_X and the XR macros it defines.
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"

            float _Scanlines, _Dither, _Curvature, _Vignette;
            float4 _InternalSize;

            // 4x4 Bayer matrix {0 8 2 10 / 12 4 14 6 / 3 11 1 9 / 15 7 13 5}, the thresholds retro.js uses, as the
            // 2x2 recursion M4 = 4·M2(p & 1) + M2(p >> 1) instead of a const array: a dynamically indexed const
            // array is what some WebGL GLSL compilers (ANGLE) reject, and that shows up as "shader not supported".
            float Bayer2(int2 p) { return float(2 * p.x + 3 * p.y - 4 * p.x * p.y); }   // {0 2 / 3 1}
            float Bayer4(int2 p) { return 4 * Bayer2(p & 1) + Bayer2(p >> 1); }

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
                float threshold = (Bayer4((int2)fmod(px, 4)) + 0.5) / 16.0;
                col = lerp(col, floor(col * 31 + threshold) / 31, _Dither);

                // Scanlines: every other internal row darker.
                float scan = fmod(px.y, 2) < 1 ? 1 : 1 - _Scanlines; // "line" is an HLSL keyword
                col *= scan;

                float vig = 1 - _Vignette * dot(c, c) * 0.5;
                return float4(col * vig, 1);
            }
            ENDHLSL
        }
    }
}
