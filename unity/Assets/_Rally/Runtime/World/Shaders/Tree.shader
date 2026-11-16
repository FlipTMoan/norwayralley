// Trees for URP: alpha-clipped leaves, wind sway in the vertex shader, per-instance tint and snow on the
// upper faces. Two instancing paths behind one keyword:
//   _RALLY_INDIRECT  RenderMeshIndirect: the instance comes from _TreeVisible[_InstanceOffset + SV_InstanceID]
//                    (Scatter.compute's visible list: world position, scale, yaw, tint, snow)
//   (off)            RenderMeshInstanced with plain object-to-world matrices (WebGL 2 fallback); tint is a
//                    hash of the position and snow comes from the _TreeSnowLine global (VegetationRenderer)
// Two SubShaders: the first (target 4.5, StructuredBuffer) for compute-class GPUs, the second (target 3.5,
// instancing only) is what GLES 3.0 / WebGL 2 picks. Both share the code below; SHADER_TARGET guards the buffer.
// _Billboard = 1 turns the mesh (a unit quad, x in -0.5..0.5, y in 0..1) toward the camera around the y axis.
Shader "Rally/Tree"
{
    Properties
    {
        _BaseMap ("Albedo (A = cutout)", 2D) = "white" {}
        _Color ("Tint", Color) = (1, 1, 1, 1)
        _Cutoff ("Alpha cutoff", Range(0, 1)) = 0.4
        _TintVariation ("Per-instance tint variation", Range(0, 0.5)) = 0.15
        _Wind ("Wind sway (m at the top)", Float) = 0.25
        _WindSpeed ("Wind speed", Float) = 1.2
        _SnowColor ("Snow", Color) = (0.92, 0.94, 0.97, 1)
        _Billboard ("Billboard 0/1", Float) = 0
    }
    HLSLINCLUDE
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

    #if defined(_RALLY_INDIRECT) && SHADER_TARGET >= 45
    #define RALLY_TREE_BUFFER 1
    struct TreeInstance { float3 pos; float scale; float yaw; uint species; float tint; float snow; };
    StructuredBuffer<TreeInstance> _TreeVisible;
    #endif
    int _InstanceOffset;
    float _TreeSnowLine;
    TEXTURE2D(_BaseMap); SAMPLER(sampler_BaseMap);
    CBUFFER_START(UnityPerMaterial)
    float4 _BaseMap_ST, _Color, _SnowColor;
    float _Cutoff, _TintVariation, _Wind, _WindSpeed, _Billboard;
    CBUFFER_END

    struct Attributes
    {
        float3 positionOS : POSITION;
        float3 normalOS : NORMAL;
        float2 uv : TEXCOORD0;
        UNITY_VERTEX_INPUT_INSTANCE_ID
    };
    struct Varyings
    {
        float4 positionCS : SV_POSITION;
        float3 positionWS : TEXCOORD0;
        float3 normalWS : TEXCOORD1;
        float2 uv : TEXCOORD2;
        float2 tintSnow : TEXCOORD3;
    };

    float Hash21(float2 p) { p = frac(p * float2(123.34, 456.21)); p += dot(p, p + 45.32); return frac(p.x * p.y); }

    // Object → world for either path; the sway bends the top more than the base (height-weighted).
    void TreeToWorld(Attributes v, uint instanceID, out float3 positionWS, out float3 normalWS, out float2 tintSnow)
    {
        float3 pos; float scale; float yaw;
        #if defined(RALLY_TREE_BUFFER)
        TreeInstance t = _TreeVisible[_InstanceOffset + instanceID];
        pos = t.pos; scale = t.scale; yaw = t.yaw; tintSnow = float2(t.tint, t.snow);
        #else
        UNITY_SETUP_INSTANCE_ID(v);
        float4x4 m = GetObjectToWorldMatrix();
        pos = m._m03_m13_m23; scale = length(m._m00_m10_m20); yaw = atan2(m._m02, m._m22);
        tintSnow = float2(Hash21(pos.xz), saturate((pos.y - _TreeSnowLine + 150) / 150));   // same rule as ScatterJob
        #endif
        float s, c; sincos(yaw, s, c);
        float3 local = v.positionOS * scale;
        float3 n = v.normalOS;
        if (_Billboard > 0.5)
        {
            float3 toCam = _WorldSpaceCameraPos - pos; toCam.y = 0;
            float3 right = normalize(cross(float3(0, 1, 0), normalize(toCam + 1e-4)));
            local = right * local.x + float3(0, local.y, 0);
            n = normalize(toCam);
        }
        else
        {
            local = float3(local.x * c + local.z * s, local.y, -local.x * s + local.z * c);
            n = float3(n.x * c + n.z * s, n.y, -n.x * s + n.z * c);
        }
        float phase = _Time.y * _WindSpeed + pos.x * 0.11 + pos.z * 0.13;
        float weight = saturate(v.positionOS.y / 8.0);
        local.xz += (float2(sin(phase), cos(phase * 0.7)) * _Wind) * weight * weight * scale;
        positionWS = pos + local;
        normalWS = n;
    }

    Varyings Vert(Attributes v, uint instanceID : SV_InstanceID)
    {
        Varyings o;
        TreeToWorld(v, instanceID, o.positionWS, o.normalWS, o.tintSnow);
        o.positionCS = TransformWorldToHClip(o.positionWS);
        o.uv = TRANSFORM_TEX(v.uv, _BaseMap);
        return o;
    }

    half4 Frag(Varyings i, bool front : SV_IsFrontFace) : SV_Target
    {
        float4 tex = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, i.uv) * _Color;
        clip(tex.a - _Cutoff);
        float3 n = normalize(i.normalWS) * (front ? 1 : -1);
        float3 albedo = tex.rgb * (1 + (i.tintSnow.x - 0.5) * 2 * _TintVariation);
        float snow = i.tintSnow.y * saturate(n.y * 2);               // upper faces only
        albedo = lerp(albedo, _SnowColor.rgb, snow);
        Light light = GetMainLight(TransformWorldToShadowCoord(i.positionWS));
        // Leaves: half-Lambert so the far side is not black (foliage scatters light).
        float ndl = saturate(dot(n, light.direction) * 0.5 + 0.5);
        float3 color = albedo * (light.color * ndl * light.shadowAttenuation + SampleSH(n));
        color = MixFog(color, ComputeFogFactor(i.positionCS.z));
        return half4(color, 1);
    }

    float3 _LightDirection;
    Varyings ShadowVert(Attributes v, uint instanceID : SV_InstanceID)
    {
        Varyings o;
        TreeToWorld(v, instanceID, o.positionWS, o.normalWS, o.tintSnow);
        o.positionCS = TransformWorldToHClip(ApplyShadowBias(o.positionWS, o.normalWS, _LightDirection));
        o.uv = TRANSFORM_TEX(v.uv, _BaseMap);
        return o;
    }
    half4 ClipFrag(Varyings i) : SV_Target { clip(SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, i.uv).a - _Cutoff); return 0; }
    ENDHLSL

    // Compute-class GPUs (WebGPU, D3D, Vulkan, Metal, GL core): indirect draw from Scatter.compute's visible list.
    SubShader
    {
        Tags { "RenderType" = "TransparentCutout" "RenderPipeline" = "UniversalPipeline" "Queue" = "AlphaTest" }
        Cull Off
        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode" = "UniversalForward" }
            HLSLPROGRAM
            #pragma target 4.5
            #pragma exclude_renderers gles3
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile _ _RALLY_INDIRECT
            #pragma multi_compile_instancing
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
            #pragma target 4.5
            #pragma exclude_renderers gles3
            #pragma vertex ShadowVert
            #pragma fragment ClipFrag
            #pragma multi_compile _ _RALLY_INDIRECT
            #pragma multi_compile_instancing
            ENDHLSL
        }
        Pass
        {
            Name "DepthOnly"
            Tags { "LightMode" = "DepthOnly" }
            ZWrite On ColorMask R
            HLSLPROGRAM
            #pragma target 4.5
            #pragma exclude_renderers gles3
            #pragma vertex Vert
            #pragma fragment ClipFrag
            #pragma multi_compile _ _RALLY_INDIRECT
            #pragma multi_compile_instancing
            ENDHLSL
        }
    }

    // GLES 3.0 / WebGL 2: RenderMeshInstanced from VegetationRenderer's CPU-culled matrices, no buffer.
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
            #pragma multi_compile_instancing
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
            #pragma multi_compile_instancing
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
            #pragma multi_compile_instancing
            ENDHLSL
        }
    }
}
