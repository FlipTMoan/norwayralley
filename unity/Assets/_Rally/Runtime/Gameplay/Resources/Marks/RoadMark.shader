// Marks drawn on the road surface (Gameplay/RoadArrow, the finish line of Gameplay/FinishGate): vertex colours with alpha,
// blended over the ribbon with a depth offset (no z-fight at any distance, no depth write). _Lit 0 is the arrow's flat
// retro glow; _Lit 1 is paint, lit like the world (sun, shadows, sky), and by the tunnel lamps where UV0.x says the mark
// is inside a tube (0 outside, 1 inside; Rally/Tunnel's lamp colour). WebGL 2 / WebGPU, target 3.5.
Shader "Rally/RoadMark"
{
    Properties
    {
        _Lit ("Lit (0 glow, 1 paint)", Range(0, 1)) = 0
        _TunnelLight ("Lamp light inside", Color) = (1.0, 0.94, 0.82, 1)
    }
    SubShader
    {
        Tags { "RenderType" = "Transparent" "RenderPipeline" = "UniversalPipeline" "Queue" = "Transparent-50" "IgnoreProjector" = "True" }
        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode" = "UniversalForward" }
            Blend SrcAlpha OneMinusSrcAlpha
            ZWrite Off
            ZTest LEqual
            Cull Off
            Offset -2, -4
            HLSLPROGRAM
            #pragma target 3.5
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN
            #pragma multi_compile _ _SHADOWS_SOFT
            #pragma multi_compile_fog
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
            CBUFFER_START(UnityPerMaterial)
            float _Lit;
            float4 _TunnelLight;
            CBUFFER_END
            struct Attributes { float4 positionOS : POSITION; float3 normalOS : NORMAL; float4 color : COLOR; float2 uv : TEXCOORD0; };
            struct Varyings { float4 positionCS : SV_POSITION; float3 positionWS : TEXCOORD0; float3 normalWS : TEXCOORD1; float4 color : TEXCOORD2; float inside : TEXCOORD3; };
            Varyings Vert(Attributes v)
            {
                Varyings o;
                o.positionWS = TransformObjectToWorld(v.positionOS.xyz);
                o.positionCS = TransformWorldToHClip(o.positionWS);
                o.normalWS = TransformObjectToWorldNormal(v.normalOS);
                o.color = v.color;
                o.inside = v.uv.x;
                return o;
            }
            half4 Frag(Varyings i) : SV_Target
            {
                float3 albedo = SRGBToLinear(i.color.rgb);   // vertex colours are sRGB
                float3 lit = albedo;
                if (_Lit > 0.5)
                {
                    float3 n = normalize(i.normalWS);
                    Light light = GetMainLight(TransformWorldToShadowCoord(i.positionWS));
                    float3 outside = albedo * (light.color * saturate(dot(n, light.direction)) * light.shadowAttenuation + SampleSH(n));
                    lit = lerp(outside, albedo * _TunnelLight.rgb * 0.9, saturate(i.inside));
                }
                return half4(MixFog(lit, ComputeFogFactor(i.positionCS.z)), i.color.a);
            }
            ENDHLSL
        }
    }
}
