// Road sign plates and posts (World/Signs/SignMesh). Vertex colour alpha 1: the face from the sign atlas (_BaseMap, sRGB,
// mip-mapped, anisotropic); alpha 0: the vertex colour (galvanised post, aluminium back and rim, brackets).
// Faces are retroreflective sheeting: a bright lobe back towards the light (the sun behind the viewer lights them up,
// as headlights do at night) and a little self-light so they read in shade. Metal gets a soft specular. A faint
// world-space noise keeps every plate from looking factory new. WebGL 2 / WebGPU, target 3.5, one SubShader.
Shader "Rally/Sign"
{
    Properties
    {
        _BaseMap ("Sign atlas", 2D) = "white" {}
        _Retro ("Retroreflection", Range(0, 2)) = 0.7
        _SelfLight ("Sheeting self-light", Range(0, 0.5)) = 0.12
    }
    HLSLINCLUDE
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
    CBUFFER_START(UnityPerMaterial)
    float4 _BaseMap_ST;
    float _Retro, _SelfLight;
    CBUFFER_END
    TEXTURE2D(_BaseMap); SAMPLER(sampler_BaseMap);
    struct Attributes { float4 positionOS : POSITION; float3 normalOS : NORMAL; float4 color : COLOR; float2 uv : TEXCOORD0; };
    struct Varyings { float4 positionCS : SV_POSITION; float3 positionWS : TEXCOORD0; float3 normalWS : TEXCOORD1; float2 uv : TEXCOORD2; float4 color : TEXCOORD3; };
    Varyings Vert(Attributes v)
    {
        Varyings o;
        o.positionWS = TransformObjectToWorld(v.positionOS.xyz);
        o.positionCS = TransformWorldToHClip(o.positionWS);
        o.normalWS = TransformObjectToWorldNormal(v.normalOS);
        o.uv = v.uv; o.color = v.color;
        return o;
    }
    float Hash12(float2 p) { float3 p3 = frac(p.xyx * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return frac((p3.x + p3.y) * p3.z); }
    float VNoise(float2 p)
    {
        float2 c = floor(p), f = frac(p), u = f * f * (3 - 2 * f);
        return lerp(lerp(Hash12(c), Hash12(c + float2(1, 0)), u.x), lerp(Hash12(c + float2(0, 1)), Hash12(c + 1), u.x), u.y);
    }
    ENDHLSL

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" "Queue" = "Geometry" }
        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode" = "UniversalForward" }
            HLSLPROGRAM
            #pragma target 3.5
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN
            #pragma multi_compile _ _SHADOWS_SOFT
            #pragma multi_compile_fog
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            half4 Frag(Varyings i) : SV_Target
            {
                float3 n = normalize(i.normalWS);
                bool face = i.color.a > 0.5;
                float3 albedo = face ? SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, i.uv).rgb : i.color.rgb;
                // weathering: faint grime blotches, a little more towards the lower edge of things
                float grime = VNoise(i.positionWS.xz * 3.1 + i.positionWS.y * 2.3) * 0.6 + VNoise(i.positionWS.xy * 9.7 + i.positionWS.z * 5.1) * 0.4;
                albedo *= 1 - (face ? 0.07 : 0.12) * grime;

                Light light = GetMainLight(TransformWorldToShadowCoord(i.positionWS));
                float3 V = normalize(_WorldSpaceCameraPos - i.positionWS);
                float ndl = saturate(dot(n, light.direction));
                float shadow = light.shadowAttenuation;
                float3 color = albedo * (light.color * ndl * shadow + SampleSH(n));
                if (face)
                {
                    // retroreflection: light returns towards its source, so it is seen when the viewer is near the light's direction
                    float retro = pow(saturate(dot(V, light.direction)), 6) * saturate(dot(n, V) * 2);
                    color += albedo * (light.color * retro * _Retro * shadow + _SelfLight);
                }
                else
                {
                    float3 h = normalize(light.direction + V);
                    color += light.color * pow(saturate(dot(n, h)), 32) * 0.25 * shadow;
                }
                color = MixFog(color, ComputeFogFactor(i.positionCS.z));
                return half4(color, 1);
            }
            ENDHLSL
        }
        Pass
        {
            Name "ShadowCaster"
            Tags { "LightMode" = "ShadowCaster" }
            ZWrite On ZTest LEqual ColorMask 0
            HLSLPROGRAM
            #pragma target 3.5
            #pragma vertex ShadowVert
            #pragma fragment NullFrag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Shadows.hlsl"
            float3 _LightDirection;
            Varyings ShadowVert(Attributes v)
            {
                Varyings o = (Varyings)0;
                o.positionWS = TransformObjectToWorld(v.positionOS.xyz);
                o.normalWS = TransformObjectToWorldNormal(v.normalOS);
                o.positionCS = TransformWorldToHClip(ApplyShadowBias(o.positionWS, o.normalWS, _LightDirection));
                #if UNITY_REVERSED_Z
                o.positionCS.z = min(o.positionCS.z, UNITY_NEAR_CLIP_VALUE);
                #else
                o.positionCS.z = max(o.positionCS.z, UNITY_NEAR_CLIP_VALUE);
                #endif
                return o;
            }
            half4 NullFrag(Varyings i) : SV_Target { return 0; }
            ENDHLSL
        }
        Pass
        {
            Name "DepthOnly"
            Tags { "LightMode" = "DepthOnly" }
            ZWrite On ColorMask R
            HLSLPROGRAM
            #pragma target 3.5
            #pragma vertex Vert
            #pragma fragment NullFrag
            half4 NullFrag(Varyings i) : SV_Target { return 0; }
            ENDHLSL
        }
    }
}
