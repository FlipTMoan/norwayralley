// Road ribbon (Roads/RibbonMesh): procedural asphalt or gravel, no textures, the same on WebGPU and WebGL 2.
// UV0: u = 0..1 across the carriageway (−1 / 2 at the skirts, the shoulders between), v = metres along / 4.
// UV1.x: the carriageway half width in metres (markings only on two-lane asphalt).
//   _Gravel 0  asphalt: dark fine-grained surface, Norwegian markings on two-lane roads — dashed yellow centre line,
//              white edge lines — and a lighter worn band in each wheel track.
//   _Gravel 1  gravel: light brown-grey loose stones, two darker packed wheel tracks with a stony ridge between them,
//              looser at the edges; no markings.
Shader "Rally/Road"
{
    Properties
    {
        _Gravel ("Gravel 0/1", Float) = 0
        _Tint ("Tint", Color) = (1, 1, 1, 1)
    }
    HLSLINCLUDE
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
    CBUFFER_START(UnityPerMaterial)
    float4 _Tint;
    float _Gravel;
    CBUFFER_END
    struct Attributes { float4 positionOS : POSITION; float3 normalOS : NORMAL; float2 uv : TEXCOORD0; float2 uv1 : TEXCOORD1; };
    struct Varyings { float4 positionCS : SV_POSITION; float3 positionWS : TEXCOORD0; float3 normalWS : TEXCOORD1; float2 uv : TEXCOORD2; float halfW : TEXCOORD3; };
    Varyings Vert(Attributes v)
    {
        Varyings o;
        o.positionWS = TransformObjectToWorld(v.positionOS.xyz);
        o.positionCS = TransformWorldToHClip(o.positionWS);
        o.normalWS = TransformObjectToWorldNormal(v.normalOS);
        o.uv = v.uv; o.halfW = max(v.uv1.x, 1);
        return o;
    }
    half4 DepthFrag(Varyings i) : SV_Target { return 0; }
    ENDHLSL

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" "Queue" = "Geometry+10" }
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
            #pragma multi_compile _ _SCREEN_SPACE_OCCLUSION
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            float Hash12(float2 p) { float3 p3 = frac(p.xyx * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return frac((p3.x + p3.y) * p3.z); }
            float VNoise(float2 p)
            {
                float2 c = floor(p), f = frac(p), u = f * f * (3 - 2 * f);
                return lerp(lerp(Hash12(c), Hash12(c + float2(1, 0)), u.x), lerp(Hash12(c + float2(0, 1)), Hash12(c + 1), u.x), u.y);
            }
            // Anti-aliased band: 1 where |x| < w, fading over one pixel.
            float Band(float x, float w) { float fw = max(fwidth(x), 1e-4); return saturate((w - abs(x)) / fw + 0.5); }

            half4 Frag(Varyings i) : SV_Target
            {
                float2 wxz = i.positionWS.xz;
                float across = (i.uv.x - 0.5) * 2 * i.halfW;           // metres from the centre line
                float along = i.uv.y * 4;                              // metres along
                float dist = distance(i.positionWS, _WorldSpaceCameraPos);
                float fine = lerp(VNoise(wxz * 9), 0.5, saturate(dist / 60));   // grain fades out with distance (no shimmer)
                float patch = VNoise(wxz * 0.45);
                float edge = saturate(abs(across) - i.halfW + 0.4);     // 0 on the carriageway, 1 on the shoulder
                float lane = i.halfW > 3 ? i.halfW * 0.5 : 0;            // two lanes: tracks either side of the centre line
                float track = Band(abs(abs(across) - lane) - 0.85, 0.35);   // the two wheel tracks of a lane
                float3 albedo;
                if (_Gravel > 0.5)
                {
                    float stones = VNoise(wxz * 3.1) * 0.6 + fine * 0.4;
                    albedo = float3(0.50, 0.46, 0.39) * (0.80 + 0.40 * stones);
                    albedo *= lerp(1, 0.84, track);                    // packed, darker tracks
                    albedo = lerp(albedo, float3(0.55, 0.51, 0.43) * (0.85 + 0.3 * fine), Band(across, 0.45) * (1 - step(3, i.halfW)));   // loose ridge
                    albedo = lerp(albedo, albedo * float3(0.92, 0.95, 0.85), edge);   // edges: dust and some grass
                    albedo *= 0.92 + 0.16 * patch;
                }
                else
                {
                    albedo = float3(0.12, 0.12, 0.13) * (0.88 + 0.24 * fine) * (0.94 + 0.12 * patch);
                    albedo *= lerp(1, 1.12, track * (1 - edge));        // polished wheel tracks
                    albedo = lerp(albedo, float3(0.20, 0.19, 0.18), edge * 0.6);
                    if (i.halfW > 3)
                    {
                        float dash = step(frac(along / 12), 0.25);       // 3 m line, 9 m gap
                        float centre = Band(across, 0.08) * dash;
                        float side = Band(abs(across) - (i.halfW - 0.35), 0.08);
                        albedo = lerp(albedo, float3(0.80, 0.62, 0.12), centre * (1 - saturate(dist / 250)));
                        albedo = lerp(albedo, float3(0.78, 0.78, 0.76), side * (1 - saturate(dist / 250)));
                    }
                }
                albedo *= _Tint.rgb;
                float3 n = normalize(i.normalWS);
                Light light = GetMainLight(TransformWorldToShadowCoord(i.positionWS));
                float ndl = saturate(dot(n, light.direction));
                float ao = 1;
                #if defined(_SCREEN_SPACE_OCCLUSION)
                ao = SampleAmbientOcclusion(GetNormalizedScreenSpaceUV(i.positionCS));
                #endif
                float3 color = albedo * (light.color * ndl * light.shadowAttenuation + SampleSH(n) * ao);
                color = MixFog(color, ComputeFogFactor(i.positionCS.z));
                return half4(color, 1);
            }
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
            #pragma fragment DepthFrag
            ENDHLSL
        }
    }
}
