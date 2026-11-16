// Shared ground lookup for the clipmap, the water, the trees and anything else that must sit on the
// drawn ground. World XZ (Unity, FloatingOrigin-relative) -> height, by way of the tile tables:
//
//   _FineWindow / _CoarseWindow = (originX, originZ, tileSize, dim)   a dim x dim window of tile cells
//   _FineSlices / _CoarseSlices  = dim x dim RFloat Texture2D, texel (i, j) = slice of the tile there or -1
//                                  (a texel fetch, not a StructuredBuffer: GLES 3.0 / WebGL 2 has no SSBOs)
//   _HeightsFine / _HeightsCoarse = Texture2DArray RFloat, texel (col, row) = HeightGrid[row * N + col]
//   _AtlasParams = (N, coarseCell, fineCell, splatRes)
//
// Texel i sits at tile-local position i * cell, so uv = (local / cell + 0.5) / N samples texel centres
// and the bilinear filter reproduces HeightGrid.Sample bit for bit (same weights, same corners).
#ifndef RALLY_TERRAIN_GROUND
#define RALLY_TERRAIN_GROUND

TEXTURE2D_ARRAY(_HeightsFine);   SAMPLER(sampler_HeightsFine);
TEXTURE2D_ARRAY(_HeightsCoarse); SAMPLER(sampler_HeightsCoarse);
TEXTURE2D_ARRAY(_MaskCoarse);    SAMPLER(sampler_MaskCoarse);
TEXTURE2D_ARRAY(_SplatAtlas);    SAMPLER(sampler_SplatAtlas);
TEXTURE2D_ARRAY(_CoverAtlas);    SAMPLER(sampler_CoverAtlas);
TEXTURE2D(_FineSlices);
TEXTURE2D(_CoarseSlices);
float4 _FineWindow, _CoarseWindow, _AtlasParams;

// Slice of the tile under a world XZ in a table window, and the position inside that tile.
int CoarseTile(float2 wxz, out float2 local)
{
    float2 rel = wxz - _CoarseWindow.xy;
    int2 ij = (int2)floor(rel / _CoarseWindow.z);
    int dim = (int)_CoarseWindow.w;
    local = rel - (float2)ij * _CoarseWindow.z;
    if (any(ij < 0) || any(ij >= dim)) return -1;
    return (int)LOAD_TEXTURE2D_LOD(_CoarseSlices, ij, 0).r;
}

int FineTile(float2 wxz, out float2 local)
{
    float2 rel = wxz - _FineWindow.xy;
    int2 ij = (int2)floor(rel / _FineWindow.z);
    int dim = (int)_FineWindow.w;
    local = rel - (float2)ij * _FineWindow.z;
    if (any(ij < 0) || any(ij >= dim)) return -1;
    return (int)LOAD_TEXTURE2D_LOD(_FineSlices, ij, 0).r;
}

float2 TileUV(float2 local, float cell) { return (local / cell + 0.5) / _AtlasParams.x; }

// Ground height: the 1 m tiles along the roads first, then the 8 m tiles (stream.js sample()).
// found = 0 where nothing is loaded yet (the clipmap clips those pixels).
float GroundHeight(float2 wxz, out float found)
{
    float2 local;
    int slice = FineTile(wxz, local);
    if (slice >= 0)
    {
        found = 1;
        return SAMPLE_TEXTURE2D_ARRAY_LOD(_HeightsFine, sampler_HeightsFine, TileUV(local, _AtlasParams.z), slice, 0).r;
    }
    slice = CoarseTile(wxz, local);
    if (slice >= 0)
    {
        found = 1;
        return SAMPLE_TEXTURE2D_ARRAY_LOD(_HeightsCoarse, sampler_HeightsCoarse, TileUV(local, _AtlasParams.y), slice, 0).r;
    }
    found = 0;
    return 0;
}

// Land-cover weights (R bog, G pasture, B rock, A snow) and the carve mask of the coarse tile under a point.
void GroundCover(float2 wxz, out float4 splat, out float mask)
{
    float2 local;
    int slice = CoarseTile(wxz, local);
    splat = 0; mask = 0;
    if (slice < 0) return;
    float2 uv = local / _CoarseWindow.z;
    splat = SAMPLE_TEXTURE2D_ARRAY_LOD(_SplatAtlas, sampler_SplatAtlas, uv, slice, 0);
    mask = SAMPLE_TEXTURE2D_ARRAY_LOD(_MaskCoarse, sampler_MaskCoarse, TileUV(local, _AtlasParams.y), slice, 0).r;
}
#endif
