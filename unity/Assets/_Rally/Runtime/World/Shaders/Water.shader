// Water for URP (lakes, rivers, sea): depth-fade colour from the scene depth (shallow turquoise to deep
// dark), two scrolling normal-map layers, Fresnel reflection of the sky (reflection probe / skybox, or a
// planar reflection texture when _Planar = 1 and a presentation camera fills _PlanarTex), foam where the
// water is shallower than _FoamDepth and under the car's wake (_WakeTex from WaterWake), flow along the
// ribbon for rivers (_Flow = 1 scrolls along UV.v), a long swell for the sea (_SwellAmp > 0).
Shader "Rally/Water"
{
    Properties
    {
        _ShallowColor ("Shallow", Color) = (0.25, 0.62, 0.66, 0.55)
        _DeepColor ("Deep", Color) = (0.03, 0.12, 0.18, 0.95)
        _DepthFade ("Depth fade (m)", Float) = 3.5
        _NormalMap ("Ripple normals", 2D) = "bump" {}
        _Ripple1 ("Layer 1: tiling xy, scroll zw (m/s)", Vector) = (0.08, 0.08, 0.02, 0.015)
        _Ripple2 ("Layer 2: tiling xy, scroll zw (m/s)", Vector) = (0.21, 0.19, -0.03, 0.02)
        _RippleStrength ("Ripple strength", Range(0, 1)) = 0.35
        _Fresnel ("Fresnel power", Float) = 4
        _Reflectivity ("Reflectivity", Range(0, 1)) = 0.8
        _FoamColor ("Foam", Color) = (0.9, 0.95, 0.95, 1)
        _FoamDepth ("Foam depth (m)", Float) = 0.4
        _Flow ("Flow along UV.v 0/1", Float) = 0
        _FlowSpeed ("Flow speed", Float) = 0.6
        _SwellAmp ("Swell amplitude (m)", Float) = 0
        _SwellLength ("Swell wavelength (m)", Float) = 38
        _Planar ("Planar reflection 0/1", Float) = 0
        _PlanarTex ("Planar reflection", 2D) = "black" {}
    }
    SubShader
    {
        Tags { "RenderType" = "Transparent" "RenderPipeline" = "UniversalPipeline" "Queue" = "Transparent" }
        Blend SrcAlpha OneMinusSrcAlpha
        ZWrite Off
        Cull Off
        Pass
        {
            Name "Water"
            Tags { "LightMode" = "UniversalForward" }
            HLSLPROGRAM
            #pragma target 4.5
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE
            #pragma multi_compile_fog
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl"

            TEXTURE2D(_NormalMap); SAMPLER(sampler_NormalMap);
            TEXTURE2D(_PlanarTex); SAMPLER(sampler_PlanarTex);
            TEXTURE2D(_WakeTex); SAMPLER(sampler_WakeTex);
            float4 _WakeWindow;    // (originX, originZ, size, 0) set by WaterWake
            CBUFFER_START(UnityPerMaterial)
            float4 _ShallowColor, _DeepColor, _Ripple1, _Ripple2, _FoamColor, _NormalMap_ST;
            float _DepthFade, _RippleStrength, _Fresnel, _Reflectivity, _FoamDepth, _Flow, _FlowSpeed, _SwellAmp, _SwellLength, _Planar;
            CBUFFER_END

            struct Attributes { float3 positionOS : POSITION; float2 uv : TEXCOORD0; };
            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float3 positionWS : TEXCOORD0;
                float2 uv : TEXCOORD1;
                float4 screenPos : TEXCOORD2;
            };

            Varyings Vert(Attributes v)
            {
                Varyings o;
                float3 ws = TransformObjectToWorld(v.positionOS);
                if (_SwellAmp > 0)
                {
                    // Two long crossing swells: the fjord heaves slowly, the ripples ride on top.
                    float k = 6.2831853 / _SwellLength;
                    ws.y += _SwellAmp * (sin(ws.x * k + _Time.y * 0.6) * 0.6 + sin((ws.x * 0.4 + ws.z * 0.9) * k * 0.7 + _Time.y * 0.45) * 0.4);
                }
                o.positionWS = ws;
                o.positionCS = TransformWorldToHClip(ws);
                o.uv = v.uv;
                o.screenPos = ComputeScreenPos(o.positionCS);
                return o;
            }

            float Hash21(float2 p) { p = frac(p * float2(123.34, 456.21)); p += dot(p, p + 45.32); return frac(p.x * p.y); }

            half4 Frag(Varyings i) : SV_Target
            {
                float2 screenUV = i.screenPos.xy / i.screenPos.w;
                // Water depth from the scene depth under this pixel (the ground drawn before the transparents).
                float sceneEye = LinearEyeDepth(SampleSceneDepth(screenUV), _ZBufferParams);
                float waterEye = LinearEyeDepth(i.positionCS.z, _ZBufferParams);
                float depth = max(0, sceneEye - waterEye);
                // Ripple UVs: world-planar for lakes and sea, ribbon-aligned (flowing along v) for rivers.
                float2 base = _Flow > 0.5 ? float2(i.uv.x * 2, i.uv.y - _Time.y * _FlowSpeed) * 4 : i.positionWS.xz;
                float2 uv1 = base * _Ripple1.xy + _Time.y * _Ripple1.zw;
                float2 uv2 = base * _Ripple2.xy + _Time.y * _Ripple2.zw;
                float3 n1 = UnpackNormal(SAMPLE_TEXTURE2D(_NormalMap, sampler_NormalMap, uv1));
                float3 n2 = UnpackNormal(SAMPLE_TEXTURE2D(_NormalMap, sampler_NormalMap, uv2));
                float3 n = normalize(float3((n1.xy + n2.xy) * _RippleStrength, 1)).xzy;   // tangent z → world y
                float3 view = normalize(_WorldSpaceCameraPos - i.positionWS);
                float fresnel = _Reflectivity * pow(1 - saturate(dot(n, view)), _Fresnel);
                float3 reflDir = reflect(-view, n);
                float3 sky = GlossyEnvironmentReflection(reflDir, 0.05, 1.0);
                if (_Planar > 0.5) sky = SAMPLE_TEXTURE2D(_PlanarTex, sampler_PlanarTex, float2(1 - screenUV.x, screenUV.y) + n.xz * 0.03).rgb;
                float fade = 1 - exp(-depth / _DepthFade);
                float4 water = lerp(_ShallowColor, _DeepColor, fade);
                Light light = GetMainLight(TransformWorldToShadowCoord(i.positionWS));
                float3 halfDir = normalize(light.direction + view);
                float spec = pow(saturate(dot(n, halfDir)), 180) * light.shadowAttenuation;
                float3 color = water.rgb * (0.35 + 0.65 * light.color * saturate(dot(n, light.direction) * 0.5 + 0.5)) + sky * fresnel + light.color * spec;
                // Foam: shore line, wake, and a little noise in both.
                float noise = Hash21(floor(i.positionWS.xz * 3 + _Time.y * 2));
                float shore = saturate(1 - depth / _FoamDepth) * (0.5 + 0.5 * noise);
                float2 wakeUV = (i.positionWS.xz - _WakeWindow.xy) / _WakeWindow.z;
                float wake = all(wakeUV > 0) && all(wakeUV < 1) ? SAMPLE_TEXTURE2D(_WakeTex, sampler_WakeTex, wakeUV).r : 0;
                float foam = saturate(shore + wake * (0.7 + 0.3 * noise));
                color = lerp(color, _FoamColor.rgb, foam);
                float alpha = saturate(lerp(water.a, 1, max(fresnel, foam)) * saturate(depth / 0.15));   // vanish at the water line
                color = MixFog(color, ComputeFogFactor(i.positionCS.z));
                return half4(color, alpha);
            }
            ENDHLSL
        }
    }
}
