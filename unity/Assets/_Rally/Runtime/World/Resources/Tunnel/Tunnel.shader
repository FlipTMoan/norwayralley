// Road tunnels and avalanche galleries (Roads/TunnelMesh): vertex-coloured concrete and sprayed rock. Vertex colour alpha
// says how far inside a tube a face is: 0 outside (portal faces, exposed tube, galleries: sun, shadows and sky light as
// usual), up to 0.9 deep inside, where the sun and the sky never reach and the tunnel's own lamps light it (_TunnelLight;
// faces 40 m and more from a portal), and 1 for the lamps themselves (emissive). Without this the inside beyond the 200 m
// shadow distance was lit by the sun. A faint world-space noise breaks up the shotcrete. WebGL 2 / WebGPU, target 3.5.
Shader "Rally/Tunnel"
{
    Properties
    {
        _TunnelLight ("Lamp light inside", Color) = (1.0, 0.94, 0.82, 1)
        _LampGlow ("Lamp brightness", Range(1, 6)) = 3
    }
    HLSLINCLUDE
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
    CBUFFER_START(UnityPerMaterial)
    float4 _TunnelLight;
    float _LampGlow;
    CBUFFER_END
    struct Attributes { float4 positionOS : POSITION; float3 normalOS : NORMAL; float4 color : COLOR; };
    struct Varyings { float4 positionCS : SV_POSITION; float3 positionWS : TEXCOORD0; float3 normalWS : TEXCOORD1; float4 color : TEXCOORD2; };
    Varyings Vert(Attributes v)
    {
        Varyings o;
        o.positionWS = TransformObjectToWorld(v.positionOS.xyz);
        o.positionCS = TransformWorldToHClip(o.positionWS);
        o.normalWS = TransformObjectToWorldNormal(v.normalOS);
        o.color = v.color;
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
                float inside = saturate(i.color.a / 0.9);
                if (i.color.a > 0.95)
                {
                    float3 glow = SRGBToLinear(i.color.rgb) * _LampGlow;
                    return half4(MixFog(glow, ComputeFogFactor(i.positionCS.z)), 1);
                }
                float grain = VNoise(i.positionWS.xz * 1.7 + i.positionWS.y * 2.3) * 0.6 + VNoise(i.positionWS.zy * 6.1 + i.positionWS.x * 3.7) * 0.4;
                float3 albedo = SRGBToLinear(i.color.rgb) * (0.88 + 0.24 * grain);   // vertex colours are sRGB
                Light light = GetMainLight(TransformWorldToShadowCoord(i.positionWS));
                float3 outside = albedo * (light.color * saturate(dot(n, light.direction)) * light.shadowAttenuation + SampleSH(n));
                // Inside: the lamp light, a little stronger on the walls facing the road and on the floor strip.
                float3 lamp = albedo * _TunnelLight.rgb * (0.7 + 0.3 * saturate(n.y * 0.5 + 0.5));
                float3 color = lerp(outside, lamp, inside);
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
