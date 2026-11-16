// Clipmap terrain for URP. Vertex: displace a flat ring mesh by the tile heightmaps (TerrainGround.hlsl),
// normals from finite differences one cell apart. Fragment: five-way splat (forest floor, bog, pasture,
// rock, snow) from the land-cover atlas, rock blended in on steep slopes with triplanar sampling (no
// stretching on cliff faces), snow by height above the snow line, main light + shadows + ambient SH,
// URP fog plus a height fog. Pixels where no tile is loaded are clipped (nothing instead of a wrong
// flat plane; the sea plane sits under everything anyway).
Shader "Rally/TerrainClipmap"
{
    Properties
    {
        _Albedo ("Albedo array: 0 forest floor, 1 bog, 2 pasture, 3 rock, 4 snow", 2DArray) = "" {}
        _Normals ("Normal array (same order)", 2DArray) = "" {}
        _Tiling ("Texture metres per repeat", Float) = 6
        _SnowLine ("Extra snow from this height (m)", Float) = 900
        _RetroFlat ("Retro flat shading 0/1", Float) = 0
        _HeightFog ("Height fog: colour rgb, density a", Color) = (0.72, 0.78, 0.85, 0.0)
        _HeightFogBase ("Height fog base height", Float) = 0
    }
    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" "Queue" = "Geometry" }
        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
        #include "TerrainGround.hlsl"

        float4 _Level;        // (originX, originZ, cell, skirtDrop) per clipmap level
        float _Tiling, _SnowLine, _RetroFlat, _HeightFogBase;
        float4 _HeightFog;

        struct Attributes { float3 positionOS : POSITION; float2 uv : TEXCOORD0; };
        struct Varyings
        {
            float4 positionCS : SV_POSITION;
            float3 positionWS : TEXCOORD0;
            float3 normalWS   : TEXCOORD1;
            float  found      : TEXCOORD2;
            float  skirt      : TEXCOORD3;
        };

        // The one vertex function all passes share: world XZ from the level origin and cell, height from the tiles.
        float3 DisplacedPosition(Attributes v, out float3 normalWS, out float found)
        {
            float cell = _Level.z;
            float2 wxz = _Level.xy + v.positionOS.xz * cell;
            float h = GroundHeight(wxz, found);
            float f;
            float hx0 = GroundHeight(wxz - float2(cell, 0), f), hx1 = GroundHeight(wxz + float2(cell, 0), f);
            float hz0 = GroundHeight(wxz - float2(0, cell), f), hz1 = GroundHeight(wxz + float2(0, cell), f);
            normalWS = normalize(float3(hx0 - hx1, 2 * cell, hz0 - hz1));
            h -= v.uv.x * _Level.w;   // skirt vertices hang below the surface
            return float3(wxz.x, h, wxz.y);
        }
        ENDHLSL

        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode" = "UniversalForward" }
            HLSLPROGRAM
            #pragma target 4.5
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN
            #pragma multi_compile _ _SHADOWS_SOFT
            #pragma multi_compile_fog
            #pragma multi_compile _ _SCREEN_SPACE_OCCLUSION
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            TEXTURE2D_ARRAY(_Albedo);  SAMPLER(sampler_Albedo);
            TEXTURE2D_ARRAY(_Normals); SAMPLER(sampler_Normals);

            Varyings Vert(Attributes v)
            {
                Varyings o;
                o.positionWS = DisplacedPosition(v, o.normalWS, o.found);
                o.positionCS = TransformWorldToHClip(o.positionWS);
                o.skirt = v.uv.x;
                return o;
            }

            // Triplanar sample of one layer: projections along the three axes, weighted by the normal.
            float3 Triplanar(int layer, float3 p, float3 n)
            {
                float3 w = pow(abs(n), 4); w /= (w.x + w.y + w.z);
                float3 cx = SAMPLE_TEXTURE2D_ARRAY(_Albedo, sampler_Albedo, p.zy / _Tiling, layer).rgb;
                float3 cy = SAMPLE_TEXTURE2D_ARRAY(_Albedo, sampler_Albedo, p.xz / _Tiling, layer).rgb;
                float3 cz = SAMPLE_TEXTURE2D_ARRAY(_Albedo, sampler_Albedo, p.xy / _Tiling, layer).rgb;
                return cx * w.x + cy * w.y + cz * w.z;
            }

            half4 Frag(Varyings i) : SV_Target
            {
                clip(i.found - 0.5);
                float3 n = normalize(i.normalWS);
                if (_RetroFlat > 0.5) n = normalize(cross(ddy(i.positionWS), ddx(i.positionWS)));   // faceted, like the low-poly original
                float4 splat; float mask;
                GroundCover(i.positionWS.xz, splat, mask);
                float slope = 1 - n.y;                                   // 0 flat, 1 vertical
                float rock = saturate(splat.b + saturate((slope - 0.35) * 3));
                float snow = saturate(splat.a + saturate((i.positionWS.y - _SnowLine) / 60) * saturate(1.2 - slope * 2));
                float bog = splat.r, pasture = splat.g;
                float floorW = saturate(1 - bog - pasture - rock - snow);
                float sum = floorW + bog + pasture + rock + snow;
                float2 uv = i.positionWS.xz / _Tiling;
                float3 albedo = (SAMPLE_TEXTURE2D_ARRAY(_Albedo, sampler_Albedo, uv, 0).rgb * floorW
                               + SAMPLE_TEXTURE2D_ARRAY(_Albedo, sampler_Albedo, uv, 1).rgb * bog
                               + SAMPLE_TEXTURE2D_ARRAY(_Albedo, sampler_Albedo, uv, 2).rgb * pasture
                               + Triplanar(3, i.positionWS, n) * rock
                               + SAMPLE_TEXTURE2D_ARRAY(_Albedo, sampler_Albedo, uv, 4).rgb * snow) / max(sum, 1e-3);
                // The carved terrace beside a road is bare earth (corridor.js EARTH), the band under the ribbon darker still.
                albedo = lerp(albedo, float3(0.43, 0.40, 0.35), saturate(mask * 2) * 0.6);
                albedo = lerp(albedo, float3(0.30, 0.30, 0.31), saturate((mask - 0.75) * 4));
                // Tangent-space normal of the dominant flat layer, applied in world space (terrain is mostly up-facing).
                int layer = floorW >= max(max(bog, pasture), max(rock, snow)) ? 0 : bog >= max(pasture, max(rock, snow)) ? 1 : pasture >= max(rock, snow) ? 2 : rock >= snow ? 3 : 4;
                float3 tn = UnpackNormal(SAMPLE_TEXTURE2D_ARRAY(_Normals, sampler_Normals, uv, layer));
                n = normalize(n + float3(tn.x, 0, tn.y) * 0.6 * (1 - _RetroFlat));

                float4 shadowCoord = TransformWorldToShadowCoord(i.positionWS);
                Light light = GetMainLight(shadowCoord);
                float ndl = saturate(dot(n, light.direction));
                float3 ambient = SampleSH(n);
                float ao = 1;
                #if defined(_SCREEN_SPACE_OCCLUSION)
                ao = SampleAmbientOcclusion(GetNormalizedScreenSpaceUV(i.positionCS));
                #endif
                float3 color = albedo * (light.color * ndl * light.shadowAttenuation * light.distanceAttenuation + ambient * ao);
                // Fog: URP distance fog, then a height fog that pools in the valleys.
                float fogFactor = ComputeFogFactor(i.positionCS.z);
                color = MixFog(color, fogFactor);
                float dist = distance(i.positionWS, _WorldSpaceCameraPos);
                float heightFog = 1 - exp(-_HeightFog.a * dist * saturate(1 - (i.positionWS.y - _HeightFogBase) / 250));
                color = lerp(color, _HeightFog.rgb, saturate(heightFog));
                return half4(color, 1);
            }
            ENDHLSL
        }

        Pass
        {
            Name "ShadowCaster"
            Tags { "LightMode" = "ShadowCaster" }
            ZWrite On ZTest LEqual ColorMask 0 Cull Off
            HLSLPROGRAM
            #pragma target 4.5
            #pragma vertex ShadowVert
            #pragma fragment ShadowFrag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Shadows.hlsl"
            float3 _LightDirection;
            Varyings ShadowVert(Attributes v)
            {
                Varyings o;
                o.positionWS = DisplacedPosition(v, o.normalWS, o.found);
                o.positionCS = TransformWorldToHClip(ApplyShadowBias(o.positionWS, o.normalWS, _LightDirection));
                o.skirt = v.uv.x;
                return o;
            }
            half4 ShadowFrag(Varyings i) : SV_Target { clip(i.found - 0.5); return 0; }
            ENDHLSL
        }

        Pass
        {
            Name "DepthOnly"
            Tags { "LightMode" = "DepthOnly" }
            ZWrite On ColorMask R
            HLSLPROGRAM
            #pragma target 4.5
            #pragma vertex DepthVert
            #pragma fragment DepthFrag
            Varyings DepthVert(Attributes v)
            {
                Varyings o;
                o.positionWS = DisplacedPosition(v, o.normalWS, o.found);
                o.positionCS = TransformWorldToHClip(o.positionWS);
                o.skirt = v.uv.x;
                return o;
            }
            half4 DepthFrag(Varyings i) : SV_Target { clip(i.found - 0.5); return 0; }
            ENDHLSL
        }

        Pass
        {
            Name "DepthNormals"
            Tags { "LightMode" = "DepthNormals" }
            ZWrite On
            HLSLPROGRAM
            #pragma target 4.5
            #pragma vertex DepthVert
            #pragma fragment DepthNormalsFrag
            Varyings DepthVert(Attributes v)
            {
                Varyings o;
                o.positionWS = DisplacedPosition(v, o.normalWS, o.found);
                o.positionCS = TransformWorldToHClip(o.positionWS);
                o.skirt = v.uv.x;
                return o;
            }
            half4 DepthNormalsFrag(Varyings i) : SV_Target { clip(i.found - 0.5); return half4(normalize(i.normalWS), 0); }
            ENDHLSL
        }
    }
}
