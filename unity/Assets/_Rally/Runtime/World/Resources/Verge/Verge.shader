// Road-verge plants for URP (VergeLayer / VergeMesh): alpha-cut cards from the procedural atlas (Editor/VergeTextures).
// The mesh carries no ground height: each vertex has its plant's root (UV1, object-local xz) and is put on the drawn ground
// there (TerrainGround.hlsl, the clipmap's own lookup), so plants follow re-carves and fine tiles without a rebuild.
// UV0 = (atlas u, v, height fraction, fade rank); colour = tint (a = 1 herb, 0 bush). One mesh holds a cell's herbs and
// bushes; with distance they thin out by rank between _Fade.xy (herbs) or _Fade.zw (bushes) and shrink into the ground
// before they go (no popping). The shadow pass collapses the herbs (only bushes cast). Wind bends the tops; herbs are
// lit with up-leaning normals and a wrapped diffuse, bushes like a volume; light through the leaves when backlit; snow on
// top above the snow line (_VergeSnowLine, set by VergeLayer; the trees' rule). Target 3.5 (texture arrays, no SSBOs): the one SubShader runs on
// GLES 3.0 / WebGL 2.
Shader "Rally/Verge"
{
    Properties
    {
        _BaseMap ("Atlas (A = cutout)", 2D) = "white" {}
        _Cutoff ("Alpha cutoff", Range(0, 1)) = 0.45
        _Fade ("Fade start, end (m): herbs xy, bushes zw", Vector) = (58, 130, 182, 260)
        _Wind ("Wind sway (m at the top)", Float) = 0.08
        _WindSpeed ("Wind speed", Float) = 1.6
        _Translucency ("Back light through the leaves", Range(0, 2)) = 0.5
        _SnowColor ("Snow", Color) = (0.92, 0.94, 0.97, 1)
    }
    HLSLINCLUDE
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
    #include "../../Shaders/TerrainGround.hlsl"

    TEXTURE2D(_BaseMap); SAMPLER(sampler_BaseMap);
    float _VergeSnowLine;
    CBUFFER_START(UnityPerMaterial)
    float4 _BaseMap_ST, _Fade, _SnowColor;
    float _Cutoff, _Wind, _WindSpeed, _Translucency;
    CBUFFER_END

    struct Attributes
    {
        float3 positionOS : POSITION;
        float3 normalOS : NORMAL;
        float4 uv : TEXCOORD0;
        float2 root : TEXCOORD1;
        float4 color : COLOR;
    };
    struct Varyings
    {
        float4 positionCS : SV_POSITION;
        float3 positionWS : TEXCOORD0;
        float3 normalWS : TEXCOORD1;
        float3 uv : TEXCOORD2;      // atlas uv, height fraction
        float4 color : TEXCOORD3;   // tint, snow
    };

    float Hash21(float2 p) { p = frac(p * float2(123.34, 456.21)); p += dot(p, p + 45.32); return frac(p.x * p.y); }

    void VergeToWorld(Attributes v, out float3 positionWS, out float3 normalWS, float herbScale = 1)
    {
        bool herb = v.color.a > 0.5;
        float2 fade = herb ? _Fade.xy : _Fade.zw;
        float3 rootWS = TransformObjectToWorld(float3(v.root.x, 0, v.root.y));
        float found;
        float ground = GroundHeight(rootWS.xz, found);
        float3 off = v.positionOS - float3(v.root.x, 0, v.root.y);   // card offset, y = height over the ground
        float dist = distance(rootWS.xz, _WorldSpaceCameraPos.xz);
        float density = saturate((fade.y - dist) / max(fade.y - fade.x, 1));
        float keep = saturate((density - v.uv.w) * 6) * found * (herb ? herbScale : 1);       // thinned by rank, shrinking before it goes
        float bend = v.uv.z * v.uv.z;
        float phase = _Time.y * _WindSpeed + rootWS.x * 0.21 + rootWS.z * 0.17;
        float2 sway = float2(sin(phase), cos(phase * 0.8)) * 0.6 + float2(0.5, 0.2);
        off.xz += sway * _Wind * (herb ? 1 : 0.6) * bend * (0.5 + off.y);
        positionWS = float3(rootWS.x, ground, rootWS.z) + off * keep;
        normalWS = TransformObjectToWorldNormal(v.normalOS);
    }

    Varyings Vert(Attributes v)
    {
        Varyings o;
        VergeToWorld(v, o.positionWS, o.normalWS);
        o.positionCS = TransformWorldToHClip(o.positionWS);
        o.uv = v.uv.xyz;
        o.color = float4(v.color.rgb, saturate((o.positionWS.y - _VergeSnowLine + 150) / 150));
        return o;
    }

    half4 Frag(Varyings i) : SV_Target
    {
        float4 tex = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, i.uv.xy);
        clip(tex.a - _Cutoff);
        float3 n = normalize(i.normalWS);
        float3 albedo = tex.rgb * i.color.rgb;
        float snow = i.color.a * saturate(n.y * 1.6 - 0.2);
        albedo = lerp(albedo, _SnowColor.rgb, snow);
        float ao = lerp(0.55, 1, saturate(i.uv.z * 1.4));            // the base of a clump sits in its own shade
        Light light = GetMainLight(TransformWorldToShadowCoord(i.positionWS));
        float3 V = normalize(_WorldSpaceCameraPos - i.positionWS);
        float diffuse = saturate(dot(n, light.direction) * 0.6 + 0.4);
        float back = pow(saturate(dot(V, -light.direction)), 3) * _Translucency * i.uv.z;
        float shadow = lerp(0.35, 1, light.shadowAttenuation);
        float3 ambient = SampleSH(float3(0, 1, 0));
        float3 color = albedo * (light.color * diffuse * shadow * ao + ambient * ao)
                     + albedo * light.color * back * float3(0.9, 1.0, 0.6) * light.shadowAttenuation * (1 - snow);
        color = MixFog(color, ComputeFogFactor(i.positionCS.z));
        return half4(color, 1);
    }

    float3 _LightDirection;
    Varyings ShadowVert(Attributes v)
    {
        Varyings o;
        VergeToWorld(v, o.positionWS, o.normalWS, 0);   // herbs: collapsed, no shadow
        o.positionCS = TransformWorldToHClip(ApplyShadowBias(o.positionWS, o.normalWS, _LightDirection));
        o.uv = v.uv.xyz; o.color = 0;
        return o;
    }
    half4 ClipFrag(Varyings i) : SV_Target
    {
        clip(SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, i.uv.xy).a - _Cutoff);
        return 0;
    }
    ENDHLSL

    SubShader
    {
        Tags { "RenderType" = "TransparentCutout" "RenderPipeline" = "UniversalPipeline" "Queue" = "AlphaTest" }
        Cull Off
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
            #pragma fragment ClipFrag
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
            #pragma fragment ClipFrag
            ENDHLSL
        }
    }
}
