// Editor only (TreeBuilder): renders a tree's LOD 0 mesh into one impostor frame. Pass 0 writes the albedo times the
// baked ambient occlusion (the runtime lights the impostor itself), pass 1 the normal in frame space
// (x = frame right, y = up, z = toward the camera) as 0..1, so Rally/Tree can light the billboard like the 3D LODs.
// The view-projection is a temporary orthographic camera's, set with CommandBuffer.SetViewProjectionMatrices so Unity
// applies the platform's clip-space conventions; the albedo is written gamma-encoded because the PNG is imported as sRGB.
Shader "Hidden/Rally/TreeBake"
{
    Properties
    {
        _BaseMap ("Foliage", 2D) = "white" {}
        _BarkMap ("Bark", 2D) = "white" {}
        _Color ("Foliage tint", Color) = (1, 1, 1, 1)
        _BarkColor ("Bark tint", Color) = (1, 1, 1, 1)
        _Cutoff ("Cutoff", Float) = 0.4
    }
    HLSLINCLUDE
    #include "UnityCG.cginc"
    sampler2D _BaseMap, _BarkMap;
    float4 _Color, _BarkColor;
    float _Cutoff;
    float3 _BakeRight, _BakeDir;
    struct A { float3 pos : POSITION; float3 normal : NORMAL; float4 color : COLOR; float2 uv : TEXCOORD0; };
    struct V { float4 pos : SV_POSITION; float3 normal : TEXCOORD0; float4 color : TEXCOORD1; float2 uv : TEXCOORD2; };
    V Vert(A a) { V o; o.pos = mul(UNITY_MATRIX_VP, float4(a.pos, 1)); o.normal = a.normal; o.color = a.color; o.uv = a.uv; return o; }
    // Foliage sampled 3 mips finer than the frame needs: small cards would otherwise lose their alpha coverage.
    float4 Albedo(V i)
    {
        if (i.color.b > 0.5) { float4 t = tex2Dbias(_BaseMap, float4(i.uv, 0, -3)); t.rgb *= _Color.rgb; return t; }
        float2 lo = float2(frac(i.uv.x) * 0.5, i.uv.y);
        float3 c = lerp(tex2D(_BarkMap, lo).rgb, tex2D(_BarkMap, lo + float2(0.5, 0)).rgb, i.color.a) * _BarkColor.rgb;
        return float4(c, 1);
    }
    float4 FragAlbedo(V i) : SV_Target { float4 t = Albedo(i); clip(t.a - _Cutoff); return float4(LinearToGammaSpace(t.rgb * (0.45 + 0.55 * i.color.r)), 1); }
    float4 FragNormal(V i, float face : VFACE) : SV_Target
    {
        float4 t = Albedo(i); clip(t.a - _Cutoff);
        float3 n = normalize(i.normal);
        if (i.color.b < 0.5 && face < 0) n = -n;
        float3 f = float3(dot(n, _BakeRight), n.y, dot(n, _BakeDir));
        return float4(f * 0.5 + 0.5, 1);
    }
    ENDHLSL
    SubShader
    {
        Cull Off ZWrite On ZTest LEqual
        Pass { HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment FragAlbedo
            ENDHLSL }
        Pass { HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment FragNormal
            ENDHLSL }
    }
}
