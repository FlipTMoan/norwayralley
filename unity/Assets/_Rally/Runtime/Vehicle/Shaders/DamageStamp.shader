// Additive radial stamp drawn into the car's damage mask (CarDamageVisual.Stamp): a soft dot at _Stamp.xy.
Shader "Rally/DamageStamp"
{
    Properties { _Stamp ("Stamp (u, v, size, strength)", Vector) = (0.5, 0.5, 0.1, 1) }
    SubShader
    {
        Tags { "RenderType" = "Transparent" "Queue" = "Transparent" }
        Pass
        {
            Blend One One
            ZWrite Off
            Cull Off
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            float4 _Stamp;
            struct Attributes { float4 positionOS : POSITION; float2 uv : TEXCOORD0; };
            struct Varyings { float4 positionCS : SV_POSITION; float2 uv : TEXCOORD0; };
            Varyings vert(Attributes v)
            {
                Varyings o;
                o.positionCS = mul(UNITY_MATRIX_MVP, v.positionOS);
                o.uv = v.uv;
                return o;
            }
            half4 frag(Varyings i) : SV_Target
            {
                float d = distance(i.uv, float2(0.5, 0.5));
                float a = (1 - smoothstep(0.25, 0.5, d)) * _Stamp.w * 0.6;
                return half4(a, a, a, a);
            }
            ENDHLSL
        }
    }
}
