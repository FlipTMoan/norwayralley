// Trees for URP (meshes from Editor/TreeBuilder): bark and alpha-clipped foliage cards in one mesh and one draw,
// told apart by the vertex colour (r ambient occlusion, g branch flex for the wind, b 1 = foliage / 0 = bark,
// a lower → upper bark blend: grey pine plates → orange flakes, black birch base → white bark). Foliage is
// two-sided with a wrapped diffuse and a back-light term (light through the leaves), its normals point out of
// the crown (TreeBuilder bakes them) so a crown shades like a volume, not like cards. Wind sways the whole tree
// by height and flutters the branch tips by the flex weight; per-instance hue / brightness variation; snow on
// the upper faces above the snow line.
// Two instancing paths behind one keyword:
//   _RALLY_INDIRECT  RenderMeshIndirect: the instance comes from _TreeVisible[_InstanceOffset + SV_InstanceID]
//                    (Scatter.compute's visible list: world position, scale, yaw, tint, snow)
//   (off)            RenderMeshInstanced with plain object-to-world matrices (WebGL 2 fallback); tint is a
//                    hash of the position and snow comes from the _TreeSnowLine global (VegetationRenderer)
// Two SubShaders: the first (target 4.5, StructuredBuffer) for compute-class GPUs, the second (target 3.5,
// instancing only) is what GLES 3.0 / WebGL 2 picks. Both share the code below; SHADER_TARGET guards the buffer.
// _Billboard = 1: the far LOD, a quad (x −0.5..0.5, y 0..1) turned toward the camera around the y axis, showing
// the impostor frame (TreeBuilder renders LOD 0 from _ImpostorFrames.z directions into a cols × rows atlas) that
// matches the view direction, lit with the baked frame-space normals so it shades like the 3D LODs.
Shader "Rally/Tree"
{
    Properties
    {
        _BaseMap ("Foliage albedo (A = cutout)", 2D) = "white" {}
        _LeafNormal ("Foliage normal", 2D) = "bump" {}
        _BarkMap ("Bark albedo: left half lower trunk, right half upper", 2D) = "white" {}
        _BarkNormal ("Bark normal (same layout)", 2D) = "bump" {}
        _ImpostorMap ("Impostor albedo atlas (A = cutout)", 2D) = "white" {}
        _ImpostorNormal ("Impostor frame-space normals atlas", 2D) = "bump" {}
        _ImpostorFrames ("Impostor columns, rows, frames", Vector) = (4, 2, 8, 0)
        _Color ("Foliage tint", Color) = (1, 1, 1, 1)
        _BarkColor ("Bark tint", Color) = (1, 1, 1, 1)
        _Cutoff ("Alpha cutoff", Range(0, 1)) = 0.4
        _TintVariation ("Per-instance tint variation", Range(0, 0.5)) = 0.15
        _Translucency ("Back light through the foliage", Range(0, 2)) = 0.6
        _TranslucencyColor ("Back light colour", Color) = (0.55, 0.65, 0.2, 1)
        _TreeHeight ("Mesh height at scale 1 (m)", Float) = 15
        _Wind ("Wind sway (m at the top)", Float) = 0.35
        _WindSpeed ("Wind speed", Float) = 1.2
        _Flutter ("Branch flutter (m)", Float) = 0.08
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
    // Ambient from VegetationRenderer (RenderSettings.ambientProbe seen from above and below), not SampleSH: with
    // instancing URP reads per-instance SH arrays indexed by an instance id the fragment stage of these draws never
    // has (indirect and RenderMeshInstanced alike), and the trees came out invisible while their shadows were there.
    float4 _TreeAmbientUp, _TreeAmbientDown;
    TEXTURE2D(_BaseMap); SAMPLER(sampler_BaseMap);
    TEXTURE2D(_LeafNormal); SAMPLER(sampler_LeafNormal);
    TEXTURE2D(_BarkMap); SAMPLER(sampler_BarkMap);
    TEXTURE2D(_BarkNormal); SAMPLER(sampler_BarkNormal);
    TEXTURE2D(_ImpostorMap); SAMPLER(sampler_ImpostorMap);
    TEXTURE2D(_ImpostorNormal); SAMPLER(sampler_ImpostorNormal);
    CBUFFER_START(UnityPerMaterial)
    float4 _BaseMap_ST, _Color, _BarkColor, _SnowColor, _TranslucencyColor, _ImpostorFrames;
    float _Cutoff, _TintVariation, _Translucency, _TreeHeight, _Wind, _WindSpeed, _Flutter, _Billboard;
    CBUFFER_END

    struct Attributes
    {
        float3 positionOS : POSITION;
        float3 normalOS : NORMAL;
        float4 tangentOS : TANGENT;
        float4 color : COLOR;
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
        float4 color : TEXCOORD4;
        float4 tangentWS : TEXCOORD5;
    };

    float Hash21(float2 p) { p = frac(p * float2(123.34, 456.21)); p += dot(p, p + 45.32); return frac(p.x * p.y); }
    float3 RotY(float3 v, float s, float c) { return float3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }

    // Object → world for either path. Sway: the trunk bends with (height / tree height)², branch tips flutter by the flex weight.
    void TreeToWorld(Attributes v, uint instanceID, out float3 positionWS, out float3 normalWS, out float4 tangentWS, out float2 uv, out float2 tintSnow)
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
        float3 tg = v.tangentOS.xyz;
        uv = v.uv;
        if (_Billboard > 0.5)
        {
            float3 toCam = _WorldSpaceCameraPos - pos; toCam.y = 0;
            toCam = normalize(toCam + float3(1e-4, 0, 0));
            float3 right = normalize(cross(float3(0, 1, 0), toCam));
            local = right * local.x + float3(0, local.y, 0);
            n = toCam;
            tg = right;
            // Impostor frame: the view direction in the tree's own frame (frame k was rendered from azimuth k / frames · 2π).
            float3 viewLocal = RotY(toCam, -s, c);   // inverse yaw
            float az = atan2(viewLocal.x, viewLocal.z);
            float frames = _ImpostorFrames.z;
            float k = fmod(round(az / 6.2831853 * frames) + frames, frames);
            float col = fmod(k, _ImpostorFrames.x), row = floor(k / _ImpostorFrames.x);
            uv = float2((col + v.uv.x) / _ImpostorFrames.x, 1 - (row + 1 - v.uv.y) / _ImpostorFrames.y);
        }
        else
        {
            local = RotY(local, s, c);
            n = RotY(n, s, c);
            tg = RotY(tg, s, c);
        }
        float phase = _Time.y * _WindSpeed + pos.x * 0.11 + pos.z * 0.13;
        float bend = saturate(v.positionOS.y / max(_TreeHeight, 1));
        float2 sway = float2(sin(phase), cos(phase * 0.7)) * 0.5 + float2(0.6, 0.2);   // leans downwind, oscillates around it
        local.xz += sway * _Wind * bend * bend * scale;
        float flex = _Billboard > 0.5 ? 0 : v.color.g;
        float fl = _Time.y * _WindSpeed * 3.1 + dot(v.positionOS, float3(1.7, 0.9, 1.3)) + pos.x * 0.37;
        local += float3(sin(fl), sin(fl * 1.3) * 0.5, cos(fl * 0.9)) * _Flutter * flex * scale;
        positionWS = pos + local;
        normalWS = n;
        tangentWS = float4(tg, v.tangentOS.w);
    }

    Varyings Vert(Attributes v, uint instanceID : SV_InstanceID)
    {
        Varyings o;
        TreeToWorld(v, instanceID, o.positionWS, o.normalWS, o.tangentWS, o.uv, o.tintSnow);
        o.positionCS = TransformWorldToHClip(o.positionWS);
        o.color = _Billboard > 0.5 ? float4(1, 0, 1, 1) : v.color;
        return o;
    }

    // Bark: u wraps around the trunk, v runs up it in metres; the two halves of the atlas are blended by color.a.
    void SampleBark(float2 uv, float2 dx, float2 dy, float blend, out float3 albedo, out float3 tn)
    {
        float2 lo = float2(frac(uv.x) * 0.5, uv.y), hi = lo + float2(0.5, 0);
        float2 gx = dx * float2(0.5, 1), gy = dy * float2(0.5, 1);
        float3 a0 = SAMPLE_TEXTURE2D_GRAD(_BarkMap, sampler_BarkMap, lo, gx, gy).rgb;
        float3 a1 = SAMPLE_TEXTURE2D_GRAD(_BarkMap, sampler_BarkMap, hi, gx, gy).rgb;
        float3 n0 = UnpackNormal(SAMPLE_TEXTURE2D_GRAD(_BarkNormal, sampler_BarkNormal, lo, gx, gy));
        float3 n1 = UnpackNormal(SAMPLE_TEXTURE2D_GRAD(_BarkNormal, sampler_BarkNormal, hi, gx, gy));
        albedo = lerp(a0, a1, blend) * _BarkColor.rgb;
        tn = normalize(lerp(n0, n1, blend));
    }

    // Albedo + alpha and the shading normal for any of the three surfaces (foliage, bark, impostor).
    float4 Surface(Varyings i, bool front, out float3 n, out float leaf)
    {
        float4 tex;
        float2 dx = ddx(i.uv), dy = ddy(i.uv);   // before the branches: gradients need uniform control flow
        float3 nw = normalize(i.normalWS);
        float3 tw = normalize(i.tangentWS.xyz);
        float3 bw = cross(nw, tw) * (i.tangentWS.w < 0 ? -1 : 1);
        if (_Billboard > 0.5)
        {
            tex = SAMPLE_TEXTURE2D_GRAD(_ImpostorMap, sampler_ImpostorMap, i.uv, dx, dy);
            float3 fn = SAMPLE_TEXTURE2D_GRAD(_ImpostorNormal, sampler_ImpostorNormal, i.uv, dx, dy).xyz * 2 - 1;   // x right, y up, z toward the camera
            n = normalize(tw * fn.x + float3(0, fn.y, 0) + nw * fn.z);
            leaf = 1;   // the impostor is mostly crown
            // Its baked bark is orange on pines; mute warm, non-green texels so a distant stand does not read orange.
            float warm = saturate((tex.r - tex.g) * 6);
            tex.rgb = lerp(tex.rgb, dot(tex.rgb, float3(0.3, 0.5, 0.2)) * float3(0.85, 0.8, 0.72), warm * 0.75);
            tex.rgb *= _Color.rgb;
        }
        else if (i.color.b > 0.5)
        {
            tex = SAMPLE_TEXTURE2D_GRAD(_BaseMap, sampler_BaseMap, i.uv, dx, dy);
            tex.rgb *= _Color.rgb;
            float3 tn = UnpackNormal(SAMPLE_TEXTURE2D_GRAD(_LeafNormal, sampler_LeafNormal, i.uv, dx, dy));
            // Crown normal (baked, pointing out of the crown) bent a little by the needle / leaf detail; not flipped
            // on back faces: a card seen from behind is still on the same side of the crown.
            n = normalize(nw + (tw * tn.x + bw * tn.y) * 0.35);
            leaf = 1;
        }
        else
        {
            float3 tn;
            // Far away the orange upper bark of a pine reads louder than its thin crown: blend toward the grey lower bark.
            float barkFar = saturate((distance(i.positionWS, _WorldSpaceCameraPos) - 50) / 150);
            SampleBark(i.uv, dx, dy, i.color.a * (1 - 0.7 * barkFar), tex.rgb, tn);
            tex.a = 1;
            n = normalize(tw * tn.x + bw * tn.y + nw * tn.z) * (front ? 1 : -1);
            leaf = 0;
        }
        return tex;
    }

    half4 Frag(Varyings i, bool front : SV_IsFrontFace) : SV_Target
    {
        float3 n; float leaf;
        float4 tex = Surface(i, front, n, leaf);
        clip(tex.a - _Cutoff);
        // Per-instance variation: hue (yellower ↔ bluer green) and brightness, mostly on the foliage.
        float t = i.tintSnow.x - 0.5;
        float3 hue = 1 + float3(0.10, 0.02, -0.12) * t * 2 * leaf + t * 2 * _TintVariation * (0.4 + 0.6 * leaf);
        float3 albedo = tex.rgb * hue;
        float snow = i.tintSnow.y * saturate(n.y * 1.6 - 0.2);               // upper faces only
        albedo = lerp(albedo, _SnowColor.rgb, snow);
        float ao = i.color.r;
        Light light = GetMainLight(TransformWorldToShadowCoord(i.positionWS));
        float3 V = normalize(_WorldSpaceCameraPos - i.positionWS);
        float ndl = dot(n, light.direction);
        // Foliage scatters light: wrapped diffuse (the far side of a crown is not black) plus light seen through
        // the leaves when the sun is behind them. Bark: plain Lambert.
        float diffuse = leaf > 0.5 ? saturate(ndl * 0.6 + 0.4) : saturate(ndl);
        float back = leaf * pow(saturate(dot(V, -light.direction)), 3) * _Translucency * (0.5 + 0.5 * ao);
        float shadow = light.shadowAttenuation;
        // A crown shadows itself in the shadow map, but light still scatters through the needles: foliage keeps part
        // of the sun in its own shadow, and the light seen through a backlit crown is only half blocked by it.
        float leafShadow = leaf > 0.5 ? lerp(0.3, 1, shadow) : shadow;
        float3 ambient = lerp(_TreeAmbientDown.rgb, _TreeAmbientUp.rgb, n.y * 0.5 + 0.5) * (1 + 0.6 * leaf);
        float3 color = albedo * (light.color * diffuse * leafShadow * (0.55 + 0.45 * ao) + ambient * ao)
                     + _TranslucencyColor.rgb * tex.rgb * light.color * back * lerp(0.5, 1, shadow) * (1 - snow);
        color = MixFog(color, ComputeFogFactor(TransformWorldToHClip(i.positionWS).z));
        return half4(color, 1);
    }

    float3 _LightDirection;
    Varyings ShadowVert(Attributes v, uint instanceID : SV_InstanceID)
    {
        Varyings o;
        TreeToWorld(v, instanceID, o.positionWS, o.normalWS, o.tangentWS, o.uv, o.tintSnow);
        o.positionCS = TransformWorldToHClip(ApplyShadowBias(o.positionWS, o.normalWS, _LightDirection));
        o.color = _Billboard > 0.5 ? float4(1, 0, 1, 1) : v.color;
        return o;
    }
    half4 ClipFrag(Varyings i) : SV_Target
    {
        float a = _Billboard > 0.5 ? SAMPLE_TEXTURE2D(_ImpostorMap, sampler_ImpostorMap, i.uv).a
                : i.color.b > 0.5 ? SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, i.uv).a : 1;
        clip(a - _Cutoff);
        return 0;
    }
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
