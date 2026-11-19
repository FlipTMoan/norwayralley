// Exhaust smoke particles (Vehicle/CarExhaust): alpha-blended billboards, colour and opacity from the particle colour,
// shape from a soft procedural puff texture (Editor/CarExhaustSetup). Lit softly — sky ambient plus a wrapped sun term —
// so the smoke is grey in shade and bright against the light without a normal map. Target 3.5: WebGL 2 and WebGPU.
Shader "Rally/Smoke"
{
    Properties
    {
        _MainTex ("Puff (alpha)", 2D) = "white" {}
    }
    SubShader
    {
        Tags { "RenderType" = "Transparent" "Queue" = "Transparent" "RenderPipeline" = "UniversalPipeline" "IgnoreProjector" = "True" }
        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode" = "UniversalForward" }
            Blend SrcAlpha OneMinusSrcAlpha
            ZWrite Off
            Cull Off
            HLSLPROGRAM
            #pragma target 3.5
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile_fog
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
            TEXTURE2D(_MainTex); SAMPLER(sampler_MainTex);
            CBUFFER_START(UnityPerMaterial)
            float4 _MainTex_ST;
            CBUFFER_END
            struct Attributes { float4 positionOS : POSITION; float4 color : COLOR; float2 uv : TEXCOORD0; };
            struct Varyings { float4 positionCS : SV_POSITION; float4 color : COLOR; float2 uv : TEXCOORD0; float fog : TEXCOORD1; };
            Varyings Vert(Attributes v)
            {
                Varyings o;
                o.positionCS = TransformObjectToHClip(v.positionOS.xyz);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                Light sun = GetMainLight();
                float3 lit = SampleSH(float3(0, 1, 0)) + sun.color * (0.35 + 0.25 * saturate(sun.direction.y));
                o.color = float4(v.color.rgb * lit, v.color.a);
                o.fog = ComputeFogFactor(o.positionCS.z);
                return o;
            }
            half4 Frag(Varyings i) : SV_Target
            {
                float a = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.uv).a * i.color.a;
                return half4(MixFog(i.color.rgb, i.fog), a);
            }
            ENDHLSL
        }
    }
}
