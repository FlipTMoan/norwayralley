// Road ribbon (Roads/RibbonMesh): asphalt or gravel, the same on WebGPU and WebGL 2 (target 3.5, one SubShader).
// UV0: u = 0..1 across the carriageway (−1 / 2 at the skirts, the shoulders between), v = metres along / 4.
// UV1.x: the carriageway half width in metres (markings only on two-lane asphalt). UV1.y: how far inside a road tunnel
// (0 outside … 0.9 from 40 m past a portal, as Rally/Tunnel's vertex alpha): there the tunnel lamps light the road, not the sun.
// UV2: a junction mouth on the u < 0.5 (x) and u > 0.5 (y) side, as (metres along − its centre) / its half length: where
// |UV2| < 1 the edge line is broken, and past the carriageway edge the shoulder and skirt are left out where
// |UV2| < RibbonMesh.MouthKeep (the side road's flared ribbon is the surface there, RibbonMesh.Mouths). The centre dash is centred on every 12 m of v·4 (RibbonMesh.DashShift).
// Detail: _Detail / _DetailNormals, a 2-slice Texture2DArray from Editor/RoadTextures (0 asphalt aggregate, 1 gravel),
// alpha = height; sampled in world XZ (no stretch along bends or seams between runs), twice at two scales and angles
// so the tile does not repeat, normal detail fading out with distance (no shimmer). Everything at road scale is
// procedural, in metres across (from the centre line) and along:
//   _Gravel 0  asphalt: darker rubbered wheel tracks, oil line between them, patches of newer asphalt with sealed seams,
//              colour drift along the road, a ragged, ravelled edge onto a gravel shoulder; Norwegian markings on two-lane
//              roads (dashed yellow centre, white edges), worn by traffic.
//   _Gravel 1  gravel: two packed, darker ruts (a few centimetres deep, shaded through a derivative bump) with the odd
//              pothole, a lighter, stonier crown between them and at the edges, loose grit fading into the verge,
//              colour drifting between grey and ochre along the road.
// The outer 0.45 m of the shoulder is clipped by noise, so the road edge breaks up into the terrain verge under it
// (the carve meets the ribbon edge, RoadConstants.CarveLift). Skirts (beyond the shoulder) take an earth colour.
Shader "Rally/Road"
{
    Properties
    {
        _Gravel ("Gravel 0/1", Float) = 0
        _Tint ("Tint", Color) = (1, 1, 1, 1)
        _Detail ("Detail albedo (array: asphalt, gravel), alpha = height", 2DArray) = "" {}
        _DetailNormals ("Detail normals (array)", 2DArray) = "" {}
    }
    HLSLINCLUDE
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
    CBUFFER_START(UnityPerMaterial)
    float4 _Tint;
    float _Gravel;
    CBUFFER_END
    struct Attributes { float4 positionOS : POSITION; float3 normalOS : NORMAL; float2 uv : TEXCOORD0; float2 uv1 : TEXCOORD1; float2 uv2 : TEXCOORD2; };
    struct Varyings { float4 positionCS : SV_POSITION; float3 positionWS : TEXCOORD0; float3 normalWS : TEXCOORD1; float2 uv : TEXCOORD2; float halfW : TEXCOORD3; float inside : TEXCOORD4; float2 mouth : TEXCOORD5; };
    Varyings Vert(Attributes v)
    {
        Varyings o;
        o.positionWS = TransformObjectToWorld(v.positionOS.xyz);
        o.positionCS = TransformWorldToHClip(o.positionWS);
        o.normalWS = TransformObjectToWorldNormal(v.normalOS);
        o.uv = v.uv; o.halfW = max(v.uv1.x, 1); o.inside = saturate(v.uv1.y / 0.9); o.mouth = v.uv2;
        return o;
    }
    float Hash12(float2 p) { float3 p3 = frac(p.xyx * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return frac((p3.x + p3.y) * p3.z); }
    float VNoise(float2 p)
    {
        float2 c = floor(p), f = frac(p), u = f * f * (3 - 2 * f);
        return lerp(lerp(Hash12(c), Hash12(c + float2(1, 0)), u.x), lerp(Hash12(c + float2(0, 1)), Hash12(c + 1), u.x), u.y);
    }
    #define RALLY_SHOULDER 1.5
    // In a junction mouth on this side (the side road's ribbon is the surface past the carriageway edge): 1, else 0. Past the
    // edge (e metres) the mouth narrows like the side road's kerb fillet (RibbonMesh.MouthKeep), so the shoulder left out
    // is always under the side road's flare.
    float InMouth(Varyings i, float e) { return step(abs(i.uv.x < 0.5 ? i.mouth.x : i.mouth.y), 1 - 0.36 * sqrt(clamp(e, 0, 1.6))); }
    // The ragged outer edge of the shoulder: 1 = keep. Skirts (|across| past the shoulder) are kept; in a mouth nothing past
    // the carriageway edge is.
    float EdgeKeep(Varyings i)
    {
        float across = abs((i.uv.x - 0.5) * 2 * i.halfW), outer = i.halfW + RALLY_SHOULDER;
        if (across > i.halfW && InMouth(i, across - i.halfW) > 0.5) return -1;
        if (across > outer + 0.01) return 1;
        float ragged = VNoise(i.positionWS.xz * 2.3) * 0.65 + VNoise(i.positionWS.xz * 7.1) * 0.35;
        return ragged - saturate((across - (outer - 0.45)) / 0.45) + 0.02;
    }
    half4 DepthFrag(Varyings i) : SV_Target { clip(EdgeKeep(i)); return 0; }
    ENDHLSL

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" "Queue" = "AlphaTest+10" }
        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode" = "UniversalForward" }
            Offset -1, -1   // the terrain meets the ribbon edge a few centimetres under it: no depth fighting far away
            HLSLPROGRAM
            #pragma target 3.5
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN
            #pragma multi_compile _ _SHADOWS_SOFT
            #pragma multi_compile_fog
            #pragma multi_compile _ _SCREEN_SPACE_OCCLUSION
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            TEXTURE2D_ARRAY(_Detail); SAMPLER(sampler_Detail);
            TEXTURE2D_ARRAY(_DetailNormals); SAMPLER(sampler_DetailNormals);

            // Anti-aliased band: 1 where |x| < w, fading over one pixel.
            float Band(float x, float w) { float fw = max(fwidth(x), 1e-4); return saturate((w - abs(x)) / fw + 0.5); }
            // Soft band for road-scale features (ruts, ridge): 1 inside w, smooth to 0 over soft.
            float Soft(float x, float w, float soft) { return 1 - smoothstep(w, w + soft, abs(x)); }

            // Detail sample at two scales / angles (no visible repeat), alpha = height. xy of n = slope in world x / z.
            void Detail(float2 wxz, float slice, float tile, out float4 albedo, out float2 slope)
            {
                float2 uv1 = wxz / tile;
                float2 uv2 = float2(wxz.x * 0.8 - wxz.y * 0.6, wxz.x * 0.6 + wxz.y * 0.8) / (tile * 2.3) + 0.37;
                float mixw = 0.3 + 0.4 * VNoise(wxz * 0.31);
                albedo = lerp(SAMPLE_TEXTURE2D_ARRAY(_Detail, sampler_Detail, uv1, slice), SAMPLE_TEXTURE2D_ARRAY(_Detail, sampler_Detail, uv2, slice), mixw);
                float3 n1 = UnpackNormal(SAMPLE_TEXTURE2D_ARRAY(_DetailNormals, sampler_DetailNormals, uv1, slice));
                float3 n2 = UnpackNormal(SAMPLE_TEXTURE2D_ARRAY(_DetailNormals, sampler_DetailNormals, uv2, slice));
                // The second sample is rotated by (0.8, 0.6): turn its slope back into world x / z.
                float2 s2 = float2(n2.x * 0.8 + n2.y * 0.6, -n2.x * 0.6 + n2.y * 0.8);
                slope = lerp(n1.xy, s2, mixw);
            }

            // Bump from a procedural height h (metres) by screen derivatives (Mikkelsen's surface gradient).
            float3 BumpFromHeight(float3 n, float3 pos, float h)
            {
                float3 dpdx = ddx(pos), dpdy = ddy(pos);
                float3 r1 = cross(dpdy, n), r2 = cross(n, dpdx);
                float det = dot(dpdx, r1);
                float3 grad = sign(det) * (ddx(h) * r1 + ddy(h) * r2);
                return normalize(abs(det) * n - grad);
            }

            half4 Frag(Varyings i) : SV_Target
            {
                clip(EdgeKeep(i));
                float2 wxz = i.positionWS.xz;
                float across = (i.uv.x - 0.5) * 2 * i.halfW;           // metres from the centre line
                float side = abs(across);
                float along = i.uv.y * 4;                              // metres along
                float dist = distance(i.positionWS, _WorldSpaceCameraPos);
                float near = 1 - saturate((dist - 25) / 90);           // normal detail and small features fade out
                bool gravel = _Gravel > 0.5;
                float outer = i.halfW + RALLY_SHOULDER;
                float lane = i.halfW > 3 ? i.halfW * 0.5 : 0;           // two lanes: tracks either side of the centre line
                float trackX = abs(side - lane) - 0.85;                 // 0 on a wheel track of a lane
                float drift = VNoise(wxz * 0.021 + 3.1) * 0.6 + VNoise(float2(along * 0.07, side > 0 ? 1 : 5)) * 0.4;   // along the road
                float3 n = normalize(i.normalWS);

                float4 tex; float2 slope;
                Detail(wxz, gravel ? 1 : 0, gravel ? 3.0 : 2.0, tex, slope);
                float3 albedo = tex.rgb;
                float strength;
                float macroH = 0;                                       // metres, for the derivative bump

                if (gravel)
                {
                    // Ruts: packed, darker, fewer loose stones, a few cm deep; potholes now and then in them.
                    float rut = Soft(trackX, 0.18, 0.28);
                    float ridge = Soft(side - lane, 0.25, 0.3) * (1 - rut);
                    float edgeZone = smoothstep(i.halfW - 0.6, i.halfW + 0.2, side);
                    float3 packedC = float3(0.36, 0.32, 0.26) * (0.9 + 0.2 * VNoise(wxz * 1.7));
                    albedo = lerp(albedo, packedC, rut * 0.55);
                    albedo *= lerp(1, 1.12, ridge) * lerp(1, 1.08, edgeZone * (1 - rut));   // loose, dry, lighter crown and edges
                    float2 cell = float2(floor(along / 3.5), across > 0 ? 1 : 0);
                    float hole = Hash12(cell + 7.3) > 0.82 ? 1 - saturate(distance(float2(frac(along / 3.5) * 3.5 - 1.75, trackX), 0) / (0.18 + 0.15 * Hash12(cell))) : 0;
                    albedo *= 1 - 0.35 * saturate(hole * 3);
                    macroH = -0.04 * rut - 0.06 * saturate(hole * 2) + 0.015 * ridge;
                    // Colour drift: grey crushed rock ↔ ochre local gravel, darker damp patches.
                    albedo *= lerp(float3(0.96, 0.98, 1.02), float3(1.08, 1.0, 0.86), drift);
                    albedo *= 1 - 0.14 * smoothstep(0.62, 0.8, VNoise(wxz * 0.23 + 11));
                    // Verge: dust and grass creeping onto the shoulder.
                    float verge = smoothstep(i.halfW + 0.3, outer, side) * (0.5 + 0.5 * VNoise(wxz * 1.3));
                    albedo = lerp(albedo, float3(0.30, 0.31, 0.19) * (0.8 + 0.4 * VNoise(wxz * 3.7)), verge * 0.7);
                    strength = lerp(1.0, 0.45, rut) * lerp(1, 1.3, ridge);
                }
                else
                {
                    // Asphalt to a ragged edge 0.2–0.45 m past the carriageway, gravel shoulder beyond.
                    float edgeA = i.halfW + 0.2 + 0.25 * VNoise(float2(along * 0.9, across > 0 ? 2 : 8));
                    float onAsphalt = 1 - smoothstep(edgeA - 0.03, edgeA + 0.03, side);
                    // Ravelling near the edge: aggregate lost in spots, darker binder holes.
                    float ravel = smoothstep(edgeA - 0.6, edgeA, side) * smoothstep(0.55, 0.75, VNoise(wxz * 3.3));
                    float track = Soft(trackX, 0.22, 0.25);
                    float oil = Soft(side - lane, 0.3, 0.3) * (i.halfW > 3 ? 1 : 0.6);
                    albedo *= lerp(1, 0.74, track) * lerp(1, 0.9, oil);       // rubber in the tracks, a drip line between
                    albedo *= lerp(float3(0.95, 0.97, 1.0), float3(1.06, 1.03, 0.98), drift) * (0.92 + 0.16 * VNoise(wxz * 0.5));
                    // Patches of newer, darker asphalt with a black sealed seam, every ~19 m with odds 0.4.
                    float pc = floor(along / 19);
                    float ph = Hash12(float2(pc, round(i.halfW)));
                    float p0 = frac(ph * 7.1) * 12, plen = 2 + frac(ph * 13.7) * 6;
                    float pa = along - pc * 19 - p0;
                    float pside = frac(ph * 3.3) > 0.5 ? 1 : -1;
                    float pacross = across * pside;
                    float pw = lerp(0.6, i.halfW, frac(ph * 5.9));
                    float lo = lane - pw * 0.5 - 0.6, hi = lane + pw * 0.5 + 0.6;
                    float pd = min(min(pa, plen - pa), min(pacross - lo, hi - pacross));   // metres inside the patch
                    float inPatch = ph < 0.4 ? step(0, pd) : 0;
                    albedo *= lerp(1, 0.8, inPatch);
                    albedo = lerp(albedo, float3(0.035, 0.035, 0.038), Band(pd, 0.05) * inPatch * 0.8 * near);   // sealed seam
                    albedo = lerp(albedo, albedo * 0.55, ravel);
                    macroH = -0.006 * ravel - 0.003 * track;
                    if (i.halfW > 3)
                    {
                        float wear = saturate(0.35 + 0.9 * VNoise(wxz * 4.1)) * lerp(1, 0.55, track);   // traffic wears the paint
                        float fade = (1 - saturate(dist / 250)) * wear;
                        float dash = step(frac((along + 1.5) / 12), 0.25);   // 3 m line centred on every 12 m (a way end), 9 m gap
                        float centre = Band(across, 0.08) * dash;
                        float edgeLine = Band(side - (i.halfW - 0.35), 0.08) * (1 - InMouth(i, 0));   // broken across a junction mouth
                        albedo = lerp(albedo, float3(0.80, 0.62, 0.12), centre * fade);
                        albedo = lerp(albedo, float3(0.78, 0.78, 0.76), edgeLine * fade);
                    }
                    // Gravel shoulder beyond the asphalt: the gravel slice, dusty, grass toward the verge.
                    float4 g; float2 gs;
                    Detail(wxz, 1, 3.0, g, gs);
                    float verge = smoothstep(edgeA + 0.3, outer, side) * (0.5 + 0.5 * VNoise(wxz * 1.3));
                    float3 shoulderC = lerp(g.rgb * 0.92, float3(0.30, 0.31, 0.19) * (0.8 + 0.4 * VNoise(wxz * 3.7)), verge * 0.7);
                    albedo = lerp(shoulderC, albedo, onAsphalt);
                    slope = lerp(gs, slope, onAsphalt);
                    strength = lerp(1.0, lerp(0.7, 0.45, track), onAsphalt);
                }
                // Skirts: the embankment face hanging under the shoulder, earth-coloured.
                float skirt = step(outer + 0.01, side);
                albedo = lerp(albedo, float3(0.25, 0.23, 0.17), skirt);
                albedo *= _Tint.rgb;

                // Normals: micro detail from the array, road-scale bumps by derivatives, both fading with distance.
                n = normalize(n + float3(slope.x, 0, slope.y) * strength * near);
                n = BumpFromHeight(n, i.positionWS, macroH * saturate(1 - dist / 70));

                Light light = GetMainLight(TransformWorldToShadowCoord(i.positionWS));
                float ndl = saturate(dot(n, light.direction));
                float ao = 1;
                #if defined(_SCREEN_SPACE_OCCLUSION)
                ao = SampleAmbientOcclusion(GetNormalizedScreenSpaceUV(i.positionCS));
                #endif
                ao *= lerp(0.75, 1, saturate(tex.a * 1.6));               // crevices between the stones
                float3 color = albedo * (light.color * ndl * light.shadowAttenuation + SampleSH(n) * ao);
                color = lerp(color, albedo * float3(0.70, 0.66, 0.58) * ao, i.inside);   // Rally/Tunnel _TunnelLight
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
            Offset -1, -1
            HLSLPROGRAM
            #pragma target 3.5
            #pragma vertex Vert
            #pragma fragment DepthFrag
            ENDHLSL
        }
    }
}
