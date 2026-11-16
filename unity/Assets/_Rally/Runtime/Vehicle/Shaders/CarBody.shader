// Body paint with GPU dents: up to 16 impact points in object space pushed in along the normal in the
// vertex shader (StructuredBuffer, WebGPU), a damage mask sampled by planar object-space xz for scratches,
// one main light + ambient SH. CarDamageVisual falls back to CPU vertex rewriting where compute buffers are
// unavailable (WebGL 2); the material still works there with _ImpactCount = 0.
Shader "Rally/CarBody"
{
    Properties
    {
        _BaseColor ("Paint", Color) = (0.83, 0.29, 0.19, 1)
        _Smoothness ("Smoothness", Range(0, 1)) = 0.55
        _DamageMask ("Damage mask (planar xz)", 2D) = "black" {}
        _BodySize ("Body size (x width, z length)", Vector) = (1.8, 1.3, 4.3, 0)
        _ImpactCount ("Impact count", Int) = 0
    }
    SubShader
    {
        Tags { "RenderPipeline" = "UniversalPipeline" "RenderType" = "Opaque" "Queue" = "Geometry" }
        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode" = "UniversalForward" }
            HLSLPROGRAM
            #pragma target 4.5
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            struct Impact { float3 pos; float radius; float depth; float3 pad; };
            StructuredBuffer<Impact> _Impacts;
            int _ImpactCount;

            CBUFFER_START(UnityPerMaterial)
                float4 _BaseColor;
                float _Smoothness;
                float4 _BodySize;
            CBUFFER_END
            TEXTURE2D(_DamageMask); SAMPLER(sampler_DamageMask);

            struct Attributes { float4 positionOS : POSITION; float3 normalOS : NORMAL; };
            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float3 positionWS : TEXCOORD0;
                float3 normalWS : TEXCOORD1;
                float2 maskUV : TEXCOORD2;
                float dent : TEXCOORD3;
            };

            Varyings vert(Attributes v)
            {
                float3 p = v.positionOS.xyz;
                float dent = 0;
                for (int i = 0; i < _ImpactCount; i++)
                {
                    Impact im = _Impacts[i];
                    float w = 1 - smoothstep(0, im.radius, distance(p, im.pos));
                    dent += im.depth * w * w;
                }
                p -= v.normalOS * dent;
                Varyings o;
                o.positionWS = TransformObjectToWorld(p);
                o.positionCS = TransformWorldToHClip(o.positionWS);
                o.normalWS = TransformObjectToWorldNormal(v.normalOS);
                o.maskUV = float2(v.positionOS.x / _BodySize.x + 0.5, v.positionOS.z / _BodySize.z + 0.5);
                o.dent = dent;
                return o;
            }

            half4 frag(Varyings i) : SV_Target
            {
                float3 n = normalize(i.normalWS);
                Light l = GetMainLight(TransformWorldToShadowCoord(i.positionWS));
                float scratch = SAMPLE_TEXTURE2D(_DamageMask, sampler_DamageMask, i.maskUV).r;
                float3 albedo = _BaseColor.rgb * (1 - 0.5 * saturate(i.dent * 4));
                albedo = lerp(albedo, float3(0.75, 0.75, 0.72), saturate(scratch)); // bare metal through the paint
                float ndl = saturate(dot(n, l.direction));
                float3 v = normalize(GetWorldSpaceViewDir(i.positionWS));
                float3 h = normalize(v + l.direction);
                float smooth = _Smoothness * (1 - 0.8 * saturate(scratch));
                float spec = pow(saturate(dot(n, h)), 8 + 56 * smooth) * smooth;
                float3 col = albedo * (l.color * l.shadowAttenuation * ndl + SampleSH(n)) + l.color * spec * l.shadowAttenuation;
                return half4(col, 1);
            }
            ENDHLSL
        }
    }
    Fallback "Universal Render Pipeline/Lit"
}
