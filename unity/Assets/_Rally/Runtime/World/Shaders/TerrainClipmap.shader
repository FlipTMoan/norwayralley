// Clipmap terrain for URP. Vertex: displace a flat ring mesh by the tile heightmaps (TerrainGround.hlsl),
// normals from finite differences one cell apart. Fragment: nine ground layers in LandcoverSplat order (grass,
// conifer floor, birch floor, field, rock, heath, bog, snow, sand) from the two splat atlases, height-blended by
// each layer's albedo alpha, anti-tiled with a rotated second sample, rock added on steep slopes with triplanar
// sampling (no stretching on cliff faces), snow by height above the snow line, a low-frequency macro colour
// variation, field furrows per plot; layers below 1 % weight are skipped (dynamic branch with explicit
// gradients, which GLES 3.0 supports), so a pixel usually pays for two or three; main light + shadows + ambient SH,
// URP fog plus a height fog. Pixels where no tile is loaded are clipped (nothing instead of a wrong
// flat plane; the sea plane sits under everything anyway).
// Target 3.5 everywhere (texture arrays + texel fetches, no SSBOs), so the one SubShader also runs on GLES 3.0 / WebGL 2.
Shader "Rally/TerrainClipmap"
{
    Properties
    {
        _Albedo ("Albedo array (A = height): 0 grass, 1 conifer floor, 2 birch floor, 3 field, 4 rock, 5 heath, 6 bog, 7 snow, 8 sand", 2DArray) = "" {}
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
            #pragma target 3.5
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

            // Value noise for the macro variation and the splat jitter (ALU only: no extra texture on WebGL 2).
            float Hash12(float2 p) { float3 p3 = frac(p.xyx * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return frac((p3.x + p3.y) * p3.z); }
            float VNoise(float2 p)
            {
                float2 c = floor(p), f = frac(p), u = f * f * (3 - 2 * f);
                return lerp(lerp(Hash12(c), Hash12(c + float2(1, 0)), u.x), lerp(Hash12(c + float2(0, 1)), Hash12(c + 1), u.x), u.y);
            }

            // Metres per texture repeat of each layer, relative to _Tiling (grass, conifer floor, birch floor, field,
            // rock, heath, bog, snow, sand): the fields and the bog are coarser, the gravel finer.
            static const float LayerScale[9] = { 1.0, 1.0, 1.0, 1.6, 1.4, 1.2, 1.5, 2.0, 0.7 };

            // One layer without visible repetition: the base sample blended with a second one at 0.29 × the frequency,
            // rotated by 37°, by a low-frequency noise and the distance (far away the large sample takes over, so a
            // hillside does not show a grid). Gradients are passed in because the caller branches on the weight.
            float4 AntiTiled(int layer, float2 uv, float2 dx, float2 dy, float far, float n)
            {
                float4 a = SAMPLE_TEXTURE2D_ARRAY_GRAD(_Albedo, sampler_Albedo, uv, layer, dx, dy);
                const float2x2 R = float2x2(0.799, -0.602, 0.602, 0.799);
                float2 uv2 = mul(R, uv) * 0.29 + 0.37;
                float4 b = SAMPLE_TEXTURE2D_ARRAY_GRAD(_Albedo, sampler_Albedo, uv2, layer, mul(R, dx) * 0.29, mul(R, dy) * 0.29);
                float t = saturate(0.35 + (n - 0.5) * 1.4 + far * 0.45);
                return lerp(a, b, t);
            }

            // Triplanar rock (cliff faces are not stretched): projections along the three axes, weighted by the normal.
            float4 TriplanarRock(float3 p, float3 n, float tiling, float3 dpx, float3 dpy)
            {
                float3 w = pow(abs(n), 4); w /= (w.x + w.y + w.z);
                float4 cx = SAMPLE_TEXTURE2D_ARRAY_GRAD(_Albedo, sampler_Albedo, p.zy / tiling, 4, dpx.zy / tiling, dpy.zy / tiling);
                float4 cy = SAMPLE_TEXTURE2D_ARRAY_GRAD(_Albedo, sampler_Albedo, p.xz / tiling, 4, dpx.xz / tiling, dpy.xz / tiling);
                float4 cz = SAMPLE_TEXTURE2D_ARRAY_GRAD(_Albedo, sampler_Albedo, p.xy / tiling, 4, dpx.xy / tiling, dpy.xy / tiling);
                return cx * w.x + cy * w.y + cz * w.z;
            }

            half4 Frag(Varyings i) : SV_Target
            {
                clip(i.found - 0.5);
                float3 n = normalize(i.normalWS);
                if (_RetroFlat > 0.5) n = normalize(cross(ddy(i.positionWS), ddx(i.positionWS)));   // faceted, like the low-poly original
                float2 wxz = i.positionWS.xz;
                float dist = distance(i.positionWS, _WorldSpaceCameraPos);
                // Splat looked up a few metres off, by noise: the 16 m land-cover texels get ragged, natural edges.
                float2 jitter = (float2(VNoise(wxz / 19), VNoise(wxz / 19 + 31.7)) - 0.5) * 18;
                float4 s0, s1; float mask;
                GroundCover(wxz, jitter, s0, s1, mask);
                float slope = 1 - n.y;                                   // 0 flat, 1 vertical
                float w[9];
                w[1] = s0.r; w[2] = s0.g; w[3] = s0.b;
                w[4] = saturate(s0.a + saturate((slope - 0.3) * 3.5));   // rock on steep faces
                w[5] = s1.r; w[6] = s1.g; w[8] = s1.a;
                w[7] = saturate(s1.b + saturate((i.positionWS.y - _SnowLine) / 60) * saturate(1.2 - slope * 2));
                float others = w[1] + w[2] + w[3] + w[4] + w[5] + w[6] + w[7] + w[8];
                w[0] = saturate(1 - others);

                // Height blend: each layer's albedo alpha is its height (stones stand out of the moss, grass out of the
                // soil), so transitions follow the texture instead of a soft cross-fade.
                float far = saturate((dist - 60) / 400);
                float3 dpx = ddx(i.positionWS), dpy = ddy(i.positionWS);   // outside the branches: derivatives need uniform control flow
                float nTile = VNoise(wxz / 41);
                float4 col[9];
                float b[9];
                float bMax = 0;
                [unroll] for (int L = 0; L < 9; L++)
                {
                    col[L] = 0; b[L] = 0;
                    if (w[L] > 0.01)
                    {
                        float tiling = _Tiling * LayerScale[L];
                        float2 uv = wxz / tiling;
                        col[L] = L == 4 && slope > 0.25 ? TriplanarRock(i.positionWS, n, tiling, dpx, dpy) : AntiTiled(L, uv, dpx.xz / tiling, dpy.xz / tiling, far, nTile);
                        b[L] = w[L] * (0.35 + col[L].a);
                        bMax = max(bMax, b[L]);
                    }
                }
                float3 albedo = 0; float bSum = 0;
                float3 tn = 0;
                [unroll] for (int L2 = 0; L2 < 9; L2++)
                {
                    float bb = b[L2] > 0 ? max(b[L2] - bMax + 0.25, 0) : 0;
                    albedo += col[L2].rgb * bb; bSum += bb;
                    if (bb > 0.05)
                    {
                        float tiling = _Tiling * LayerScale[L2];
                        tn += UnpackNormal(SAMPLE_TEXTURE2D_ARRAY_GRAD(_Normals, sampler_Normals, wxz / tiling, L2, dpx.xz / tiling, dpy.xz / tiling)) * bb;
                    }
                }
                albedo /= max(bSum, 1e-4);
                tn /= max(bSum, 1e-4);

                // Fields (terrain.js tintByCover): faint furrows and a different crop per 160 m plot.
                float2 plot = floor(wxz / 160);
                float ph = Hash12(plot + 7.1);
                float2 dir = ph < 0.5 ? float2(1, 0) : float2(0, 1);
                float furrow = 0.94 + 0.06 * sin(dot(wxz, dir) * 6.2832 / 3.2);
                float3 crop = lerp(float3(1.02, 1.0, 0.86), float3(0.86, 1.04, 0.88), Hash12(plot + 2.3));
                float fieldW = b[3] > 0 ? max(b[3] - bMax + 0.25, 0) / max(bSum, 1e-4) : 0;
                albedo *= lerp(1, crop * furrow, fieldW);
                // Macro variation: a hillside is never one colour (moisture, exposure, stand age).
                float m1 = VNoise(wxz / 230), m2 = VNoise(wxz / 61 + 13.0);
                float macro = (m1 * 0.65 + m2 * 0.35) - 0.5;
                albedo *= 1 + macro * 0.32;
                albedo.rg *= 1 + float2(0.06, -0.02) * (VNoise(wxz / 470 + 5.0) - 0.5) * 2 * (1 - w[7]);
                // The carved terrace beside a road is bare earth (corridor.js EARTH), the band under the ribbon darker still.
                albedo = lerp(albedo, float3(0.34, 0.31, 0.25), saturate(mask * 2) * 0.5);
                albedo = lerp(albedo, float3(0.30, 0.30, 0.31), saturate((mask - 0.75) * 4));
                // Tangent-space normals blended like the albedo, applied in world space (terrain is mostly up-facing).
                n = normalize(n + float3(tn.x, 0, tn.y) * 0.8 * (1 - _RetroFlat) * (1 - far * 0.7));

                float4 shadowCoord = TransformWorldToShadowCoord(i.positionWS);
                Light light = GetMainLight(shadowCoord);
                float ndl = saturate(dot(n, light.direction));
                float3 ambient = SampleSH(n);
                float ao = 1;
                #if defined(_SCREEN_SPACE_OCCLUSION)
                ao = SampleAmbientOcclusion(GetNormalizedScreenSpaceUV(i.positionCS));
                #endif
                float3 color = albedo * (light.color * ndl * light.shadowAttenuation + ambient * ao);
                // Fog: URP distance fog, then a height fog that pools in the valleys.
                float fogFactor = ComputeFogFactor(i.positionCS.z);
                color = MixFog(color, fogFactor);
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
            #pragma target 3.5
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
            #pragma target 3.5
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
            #pragma target 3.5
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
