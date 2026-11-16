// Procedural sky for URP (skybox material): single-scattering atmosphere (Rayleigh + Mie, the
// analytic-optical-depth approximation popularised by Nishita/O'Neil, 8 view samples × 4 light samples)
// with a sun disc, horizon haze, a star field that fades in as the sun sets, and a wind-scrolled 2-D FBM
// cloud layer on the dome. _SunDir/_SunColor come from SkyBinder (RenderSettings.sun), so the time of day
// in Rally.Presentation.SkyAndTime drives this sky without any coupling.
Shader "Rally/Sky"
{
    Properties
    {
        _SunSize ("Sun disc size", Range(0.0005, 0.05)) = 0.004
        _Rayleigh ("Rayleigh scale", Float) = 1.0
        _Mie ("Mie scale", Float) = 1.0
        _MieG ("Mie anisotropy", Range(0.5, 0.99)) = 0.76
        _Exposure ("Exposure", Float) = 1.0
        _HazeColor ("Horizon haze", Color) = (0.75, 0.8, 0.88, 1)
        _Haze ("Haze amount", Range(0, 1)) = 0.35
        _NightColor ("Night sky", Color) = (0.02, 0.03, 0.06, 1)
        _Stars ("Star density", Range(0, 1)) = 0.5
        _CloudCover ("Cloud cover", Range(0, 1)) = 0.45
        _CloudScale ("Cloud scale", Float) = 1.6
        _CloudColor ("Cloud lit", Color) = (1, 1, 1, 1)
        _CloudShadow ("Cloud shadow", Color) = (0.55, 0.58, 0.65, 1)
        _WindSpeed ("Cloud wind", Vector) = (0.004, 0.0015, 0, 0)
    }
    SubShader
    {
        Tags { "Queue" = "Background" "RenderType" = "Background" "PreviewType" = "Skybox" "RenderPipeline" = "UniversalPipeline" }
        Cull Off ZWrite Off
        Pass
        {
            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            float3 _SunDir;       // set by SkyBinder: direction TO the sun (world)
            float3 _SunColor;
            float4 _WindOffset;   // accumulated cloud scroll (xy)
            CBUFFER_START(UnityPerMaterial)
            float _SunSize, _Rayleigh, _Mie, _MieG, _Exposure, _Haze, _Stars, _CloudCover, _CloudScale;
            float4 _HazeColor, _NightColor, _CloudColor, _CloudShadow, _WindSpeed;
            CBUFFER_END

            struct Attributes { float3 positionOS : POSITION; };
            struct Varyings { float4 positionCS : SV_POSITION; float3 dir : TEXCOORD0; };

            Varyings Vert(Attributes v)
            {
                Varyings o;
                o.positionCS = TransformObjectToHClip(v.positionOS);
                o.dir = v.positionOS;    // the skybox cube: object position is the view direction
                return o;
            }

            // --- atmosphere ------------------------------------------------------------------------
            #define PLANET_R 6371e3
            #define ATMO_R   6471e3
            static const float3 BETA_R = float3(5.5e-6, 13.0e-6, 22.4e-6);
            static const float  BETA_M = 21e-6;
            static const float  H_R = 8000, H_M = 1200;

            float2 RaySphere(float3 o, float3 d, float r)
            {
                float b = dot(o, d), c = dot(o, o) - r * r, h = b * b - c;
                if (h < 0) return float2(1e9, -1e9);
                h = sqrt(h);
                return float2(-b - h, -b + h);
            }

            float3 Atmosphere(float3 dir, float3 sun)
            {
                float3 o = float3(0, PLANET_R + 200, 0);
                float2 t = RaySphere(o, dir, ATMO_R);
                float2 g = RaySphere(o, dir, PLANET_R);
                float tmax = g.x > 0 ? min(t.y, g.x) : t.y;
                const int N = 8, M = 4;
                float ds = tmax / N;
                float3 sumR = 0, sumM = 0;
                float odR = 0, odM = 0;
                float mu = dot(dir, sun);
                float phR = 3.0 / (16.0 * PI) * (1 + mu * mu);
                float gg = _MieG * _MieG;
                float phM = 3.0 / (8.0 * PI) * ((1 - gg) * (1 + mu * mu)) / ((2 + gg) * pow(1 + gg - 2 * _MieG * mu, 1.5));
                for (int i = 0; i < N; i++)
                {
                    float3 p = o + dir * (i + 0.5) * ds;
                    float h = length(p) - PLANET_R;
                    float hr = exp(-h / H_R) * ds, hm = exp(-h / H_M) * ds;
                    odR += hr; odM += hm;
                    float2 tl = RaySphere(p, sun, ATMO_R);
                    float dl = tl.y / M;
                    float odlR = 0, odlM = 0;
                    for (int j = 0; j < M; j++)
                    {
                        float3 q = p + sun * (j + 0.5) * dl;
                        float hq = length(q) - PLANET_R;
                        odlR += exp(-hq / H_R) * dl; odlM += exp(-hq / H_M) * dl;
                    }
                    float3 tau = BETA_R * _Rayleigh * (odR + odlR) + BETA_M * _Mie * 1.1 * (odM + odlM);
                    float3 att = exp(-tau);
                    sumR += att * hr; sumM += att * hm;
                }
                return 20.0 * (sumR * BETA_R * _Rayleigh * phR + sumM * BETA_M * _Mie * phM);
            }

            // --- clouds and stars ---------------------------------------------------------------------
            float Hash(float2 p) { return frac(sin(dot(p, float2(127.1, 311.7))) * 43758.5453); }
            float Noise(float2 p)
            {
                float2 i = floor(p), f = frac(p); f = f * f * (3 - 2 * f);
                return lerp(lerp(Hash(i), Hash(i + float2(1, 0)), f.x), lerp(Hash(i + float2(0, 1)), Hash(i + 1), f.x), f.y);
            }
            float Fbm(float2 p)
            {
                float v = 0, a = 0.5;
                for (int i = 0; i < 5; i++) { v += a * Noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
                return v;
            }

            half4 Frag(Varyings i) : SV_Target
            {
                float3 dir = normalize(i.dir);
                float3 sun = normalize(_SunDir);
                float3 col = Atmosphere(dir, sun) * _SunColor * _Exposure;
                // Sun disc, dimmed by the atmosphere along the view.
                float sunDot = dot(dir, sun);
                col += _SunColor * smoothstep(1 - _SunSize * 2, 1 - _SunSize * 0.5, sunDot) * 8 * saturate(sun.y * 4 + 0.2);
                // Night: the atmosphere goes dark; stars fade in below the horizon, twinkling slightly.
                float day = saturate(sun.y * 6 + 0.3);
                float3 stars = 0;
                if (dir.y > 0)
                {
                    float2 sp = dir.xz / (dir.y + 0.35) * 220;
                    float h = Hash(floor(sp));
                    float star = step(1 - _Stars * 0.02, h) * (0.6 + 0.4 * sin(_Time.y * 2 + h * 60));
                    stars = star * (1 - day);
                }
                col = lerp(_NightColor.rgb + stars, col, day);
                // Horizon haze.
                float horizon = pow(1 - saturate(abs(dir.y)), 6);
                col = lerp(col, _HazeColor.rgb * (0.2 + 0.8 * day), horizon * _Haze);
                // Clouds on a dome: project the direction onto a plane above the viewer, scroll with the wind.
                if (dir.y > 0.02)
                {
                    float2 cp = dir.xz / (dir.y + 0.15) * _CloudScale + _WindOffset.xy;
                    float d = Fbm(cp) - (1 - _CloudCover);
                    float cloud = saturate(d * 4) * saturate(dir.y * 6);         // thin out at the horizon
                    float lit = saturate(dot(sun, float3(0, 1, 0)) * 0.6 + 0.4) * day + 0.05;
                    float3 cloudCol = lerp(_CloudShadow.rgb, _CloudColor.rgb, saturate(0.5 + 0.5 * sunDot)) * lit * _SunColor;
                    col = lerp(col, cloudCol, cloud);
                }
                return half4(col, 1);
            }
            ENDHLSL
        }
    }
}
