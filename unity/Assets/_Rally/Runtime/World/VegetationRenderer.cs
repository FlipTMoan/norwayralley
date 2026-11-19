using Rally.Core;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.World
{
    /// <summary>
    /// Draws every live tile's trees with RenderMeshIndirect, one draw per (species, LOD) bucket:
    /// instances live in a GPU store (one slot per atlas slice, TREE_BUDGET each), Scatter.compute fills a
    /// slot when a tile's land cover and carve are in, and per frame its Cull kernel frustum-tests,
    /// LOD-sorts and writes the visible list plus the indirect args. The CPU never touches instances
    /// except for the one readback per tile that feeds <see cref="TreeIndex"/> for collisions.
    /// Without compute (WebGL 2) the same scatter runs as <see cref="ScatterJob"/> and the draw falls back
    /// to RenderMeshInstanced from CPU-culled matrices.
    /// </summary>
    public sealed class VegetationRenderer : System.IDisposable
    {
        /// <summary>
        /// Instances per 2 km tile. stream.js had TREE_BUDGET 2600, which thins a closed Norwegian forest to ~10 % and
        /// reads as parkland; 12000 with the same budget rule (LandcoverSplat.Budget: road corridor first) keeps the
        /// hillsides wooded. The CPU path culls whole tiles first, so only the few tiles in view are looped per frame.
        /// </summary>
        public const int Capacity = 12000;
        public const int MaxVisible = 8192;      // per (species, LOD) bucket per frame
        public const int Buckets = VegetationSetSO.SpeciesCount * VegetationSetSO.Lods;
        public float Density = 1f, Scale = 1f, DrawDistance = 900f;

        readonly VegetationSetSO set;
        readonly ComputeShader cs;
        readonly TileAtlas atlas;
        readonly TreeIndex index;
        readonly bool gpu;
        readonly int slots, kScatter, kClear, kCull, kArgs;
        readonly TerrainTile[] bySlot;
        readonly GraphicsBuffer instances, counts, tileOrigins, visible, drawCounts, args;
        readonly Material[] materials = new Material[Buckets];
        readonly Material firstMaterial;
        readonly MaterialPropertyBlock[] props = new MaterialPropertyBlock[Buckets];
        readonly Plane[] planes = new Plane[6];
        readonly Vector4[] planeVecs = new Vector4[6];
        readonly Vector4[] protoLod = new Vector4[VegetationSetSO.SpeciesCount];
        NativeArray<float4> originsCpu;
        NativeArray<uint> zero;
        // CPU path
        NativeArray<TreeInstance> cpuInstances;
        NativeArray<int> cpuCounts, jobCount;
        NativeArray<Matrix4x4> matrices;   // Buckets × MaxVisible, binned once per frame
        readonly int[] bucketCounts = new int[Buckets];
        static readonly int OffsetId = Shader.PropertyToID("_InstanceOffset"), BillboardId = Shader.PropertyToID("_Billboard"), SnowLineId = Shader.PropertyToID("_TreeSnowLine");

        public VegetationRenderer(VegetationSetSO set, ComputeShader scatterShader, TileAtlas coarseAtlas, TreeIndex treeIndex)
        {
            this.set = set; cs = scatterShader; atlas = coarseAtlas; index = treeIndex;
            slots = atlas.Slices;
            bySlot = new TerrainTile[slots];
            gpu = GpuCaps.Compute && cs != null;
            originsCpu = new NativeArray<float4>(slots, Allocator.Persistent);
            zero = new NativeArray<uint>(1, Allocator.Persistent);
            for (int b = 0; b < Buckets; b++)
            {
                props[b] = new MaterialPropertyBlock();
                var proto = set.Prototypes[b / VegetationSetSO.Lods];
                if (proto == null) continue;
                bool billboard = b % VegetationSetSO.Lods == 3;
                var src = billboard ? proto.BillboardMaterial : proto.Material;
                if (src == null) continue;
                materials[b] = new Material(src);   // a copy: the keyword must not be baked into the asset
                if (firstMaterial == null) firstMaterial = materials[b];
                materials[b].SetFloat(BillboardId, billboard ? 1 : 0);
                materials[b].enableInstancing = true;   // the fallback draws with RenderMeshInstanced
                if (gpu) materials[b].EnableKeyword("_RALLY_INDIRECT"); else materials[b].DisableKeyword("_RALLY_INDIRECT");
            }
            if (gpu)
            {
                kScatter = cs.FindKernel("ScatterTile"); kClear = cs.FindKernel("ClearCounts"); kCull = cs.FindKernel("Cull"); kArgs = cs.FindKernel("WriteArgs");
                tileOrigins = new GraphicsBuffer(GraphicsBuffer.Target.Structured, slots, 16);
                instances = new GraphicsBuffer(GraphicsBuffer.Target.Structured, slots * Capacity, TreeInstance.Stride);
                counts = new GraphicsBuffer(GraphicsBuffer.Target.Structured, slots, 4);
                visible = new GraphicsBuffer(GraphicsBuffer.Target.Structured, Buckets * MaxVisible, TreeInstance.Stride);
                drawCounts = new GraphicsBuffer(GraphicsBuffer.Target.Structured, Buckets, 4);
                args = new GraphicsBuffer(GraphicsBuffer.Target.IndirectArguments | GraphicsBuffer.Target.Structured, Buckets, GraphicsBuffer.IndirectDrawIndexedArgs.size);
                var a = new GraphicsBuffer.IndirectDrawIndexedArgs[Buckets];
                for (int b = 0; b < Buckets; b++)
                {
                    var mesh = MeshFor(b);
                    if (mesh == null) continue;
                    a[b] = new GraphicsBuffer.IndirectDrawIndexedArgs { indexCountPerInstance = mesh.GetIndexCount(0), startIndex = mesh.GetIndexStart(0), baseVertexIndex = mesh.GetBaseVertex(0), instanceCount = 0, startInstance = 0 };
                }
                args.SetData(a);
                var zeros = new NativeArray<uint>(slots, Allocator.Temp);
                counts.SetData(zeros);
                zeros.Dispose();
                Shader.SetGlobalBuffer("_TreeVisible", visible);
            }
            else
            {
                cpuInstances = new NativeArray<TreeInstance>(slots * Capacity, Allocator.Persistent);
                cpuCounts = new NativeArray<int>(slots, Allocator.Persistent);
                jobCount = new NativeArray<int>(1, Allocator.Persistent);
                matrices = new NativeArray<Matrix4x4>(Buckets * MaxVisible, Allocator.Persistent);
            }
        }

        Mesh MeshFor(int bucket)
        {
            var proto = set.Prototypes[bucket / VegetationSetSO.Lods];
            int lod = bucket % VegetationSetSO.Lods;
            if (proto == null) return null;
            return lod == 3 ? proto.Billboard : (proto.Lods != null && lod < proto.Lods.Length ? proto.Lods[lod] : null);
        }

        /// <summary>Generate a coarse tile's trees (after its carve: the mask keeps them off roads and pads).</summary>
        public void ScatterTile(TerrainTile tile)
        {
            if (tile.Key.Kind != TileKind.Coarse || !tile.HasHeights) return;
            int slot = tile.Slice;
            bySlot[slot] = tile;
            uint seed = ScatterJob.Hash3(new uint3((uint)tile.Key.I, (uint)tile.Key.J, 7u));
            int res = atlas.SplatRes;
            if (gpu)
            {
                counts.SetData(zero, 0, slot, 1);
                cs.SetTexture(kScatter, "_CoverAtlas", atlas.Cover);
                cs.SetTexture(kScatter, "_HeightsCoarse", atlas.Heights);
                cs.SetTexture(kScatter, "_MaskCoarse", atlas.Mask);
                cs.SetBuffer(kScatter, "_Instances", instances);
                cs.SetBuffer(kScatter, "_Counts", counts);
                cs.SetInt("_Slot", slot); cs.SetInt("_Capacity", Capacity); cs.SetInt("_Res", res); cs.SetInt("_N", atlas.N);
                cs.SetFloat("_CellM", tile.Key.CellM); cs.SetFloat("_CoverCell", tile.Key.SizeM / res);
                cs.SetFloat("_Density", Density); cs.SetFloat("_Scale", Scale);
                cs.SetFloat("_TreeLine", tile.TreeLine); cs.SetFloat("_SnowLine", tile.SnowLine);
                cs.SetInt("_Seed", unchecked((int)seed));
                cs.Dispatch(kScatter, (res + 7) / 8, (res + 7) / 8, 1);
                // CPU copy for collisions: count first, then exactly that many instances.
                var key = tile.Key; var origin = tile.Key.Origin;
                AsyncGPUReadback.Request(counts, 4, slot * 4, c =>
                {
                    if (c.hasError || bySlot[slot] != tile) return;
                    int n = math.min((int)c.GetData<uint>()[0], Capacity);
                    if (n == 0) { index.RemoveTile(key); return; }
                    AsyncGPUReadback.Request(instances, n * TreeInstance.Stride, slot * Capacity * TreeInstance.Stride, r =>
                    {
                        if (r.hasError || bySlot[slot] != tile) return;
                        index.AddTile(key, origin, r.GetData<TreeInstance>(), n, set);
                        Rally.Core.RallyLog.Info($"overlay: {key} {n} trees placed ({SpeciesCounts(r.GetData<TreeInstance>(), n)}; GPU scatter)");
                    });
                });
            }
            else
            {
                if (!tile.Cover.IsCreated) return;
                var job = new ScatterJob
                {
                    Res = res, N = atlas.N, Capacity = Capacity, CellM = tile.Key.CellM, CoverCell = tile.Key.SizeM / res,
                    Density = Density, TreeLine = tile.TreeLine, SnowLine = tile.SnowLine, Scale = Scale, Seed = seed,
                    Cover = tile.Cover, Heights = tile.Grid.Heights, Mask = tile.Mask,
                    Out = cpuInstances.GetSubArray(slot * Capacity, Capacity), Count = jobCount,
                };
                job.Run();
                cpuCounts[slot] = jobCount[0];
                index.AddTile(tile.Key, tile.Key.Origin, cpuInstances.GetSubArray(slot * Capacity, Capacity), jobCount[0], set);
                Rally.Core.RallyLog.Info($"overlay: {tile.Key} {jobCount[0]} trees placed ({SpeciesCounts(cpuInstances.GetSubArray(slot * Capacity, Capacity), jobCount[0])}; CPU scatter)");
            }
        }

        static readonly string[] SpeciesNames = { "spruce", "pine", "birch", "mountain birch", "shrub" };
        static readonly int[] speciesCount = new int[VegetationSetSO.SpeciesCount];

        /// <summary>"spruce n, pine n, birch n, mountain birch n, shrub n" for the per-tile overlay log line.</summary>
        public static string SpeciesCounts(NativeArray<TreeInstance> trees, int n)
        {
            System.Array.Clear(speciesCount, 0, speciesCount.Length);
            for (int i = 0; i < n; i++) { uint s = trees[i].Species; if (s < speciesCount.Length) speciesCount[s]++; }
            var sb = new System.Text.StringBuilder();
            for (int s = 0; s < speciesCount.Length; s++) sb.Append(s == 0 ? "" : ", ").Append(SpeciesNames[s]).Append(' ').Append(speciesCount[s]);
            return sb.ToString();
        }

        public void ClearTile(TerrainTile tile)
        {
            int slot = tile.Slice;
            if (bySlot[slot] != tile) return;
            bySlot[slot] = null;
            index.RemoveTile(tile.Key);
            if (gpu) counts.SetData(zero, 0, slot, 1); else cpuCounts[slot] = 0;
        }

        /// <summary>Once per frame after FloatingOrigin.MaybeRebase.</summary>
        public void Render(Camera cam, int layer = 0)
        {
            SetAmbient();
            for (int s = 0; s < slots; s++)
            {
                var t = bySlot[s];
                originsCpu[s] = t == null ? float4.zero : new float4(FloatingOrigin.ToWorldXZ(t.Key.Origin), 0, 0);
            }
            GeometryUtility.CalculateFrustumPlanes(cam, planes);
            // new RenderParams(material), not an object initializer: the default struct has renderingLayerMask 0, which URP's
            // colour passes filter out — the trees drew only into the shadow map and were invisible.
            var rp = new RenderParams(firstMaterial) { layer = layer, receiveShadows = true, worldBounds = new Bounds(cam.transform.position, new Vector3(4000, 2000, 4000)) };
            if (gpu)
            {
                tileOrigins.SetData(originsCpu);
                for (int p = 0; p < 6; p++) planeVecs[p] = new Vector4(planes[p].normal.x, planes[p].normal.y, planes[p].normal.z, planes[p].distance);
                cs.SetVectorArray("_FrustumPlanes", planeVecs);
                cs.SetVector("_CameraPos", cam.transform.position);
                for (int sp = 0; sp < VegetationSetSO.SpeciesCount; sp++) protoLod[sp] = set.LodFor(sp, DrawDistance);
                cs.SetVectorArray("_ProtoLod", protoLod);
                cs.SetInt("_Capacity", Capacity); cs.SetInt("_Slots", slots); cs.SetInt("_MaxVisible", MaxVisible);
                cs.SetBuffer(kClear, "_DrawCounts", drawCounts);
                cs.Dispatch(kClear, 1, 1, 1);
                cs.SetBuffer(kCull, "_Instances", instances); cs.SetBuffer(kCull, "_Counts", counts); cs.SetBuffer(kCull, "_TileOrigins", tileOrigins);
                cs.SetBuffer(kCull, "_Visible", visible); cs.SetBuffer(kCull, "_DrawCounts", drawCounts);
                cs.Dispatch(kCull, (slots * Capacity + 63) / 64, 1, 1);
                cs.SetBuffer(kArgs, "_DrawCounts", drawCounts); cs.SetBuffer(kArgs, "_Args", args);
                cs.Dispatch(kArgs, 1, 1, 1);
                for (int b = 0; b < Buckets; b++)
                {
                    var mesh = MeshFor(b);
                    if (mesh == null || materials[b] == null) continue;
                    int lod = b % VegetationSetSO.Lods;
                    props[b].SetInt(OffsetId, b * MaxVisible);
                    rp.material = materials[b];
                    rp.matProps = props[b];
                    rp.shadowCastingMode = lod <= 1 || set.FarShadows ? ShadowCastingMode.On : ShadowCastingMode.Off;
                    Graphics.RenderMeshIndirect(rp, mesh, args, 1, b);
                }
            }
            else
            {
                // One pass over every instance: LOD + frustum, binned per (species, LOD) bucket, then one
                // instanced draw per bucket. Tint and snow come from the shader (position hash, _TreeSnowLine).
                var camPos = (float3)cam.transform.position;
                for (int sp = 0; sp < VegetationSetSO.SpeciesCount; sp++) protoLod[sp] = set.LodFor(sp, DrawDistance);
                float snowLine = 0, nearest = float.MaxValue;
                System.Array.Clear(bucketCounts, 0, Buckets);
                for (int s = 0; s < slots; s++)
                {
                    var tile = bySlot[s];
                    if (tile == null) continue;
                    float2 o = originsCpu[s].xy;
                    float dTile = math.distance(o, camPos.xz);
                    if (dTile < nearest) { nearest = dTile; snowLine = tile.SnowLine; }
                    // Whole tile out of range or out of view: skip its instances (WebGL 2 runs this loop on the CPU every frame).
                    float size = tile.Key.SizeM;
                    var tb = new Bounds(new Vector3(o.x + size / 2, camPos.y, o.y + size / 2), new Vector3(size, 4000, size));
                    if (math.sqrt(tb.SqrDistance(camPos)) > DrawDistance || !GeometryUtility.TestPlanesAABB(planes, tb)) continue;
                    int baseIdx = s * Capacity;
                    for (int k = 0; k < cpuCounts[s]; k++)
                    {
                        var t = cpuInstances[baseIdx + k];
                        var world = new float3(t.Pos.x + o.x, t.Pos.y, t.Pos.z + o.y);
                        float d = math.distance(world, camPos);
                        var ld = protoLod[t.Species];
                        if (d > ld.w) continue;
                        int lod = d < ld.x ? 0 : d < ld.y ? 1 : d < ld.z ? 2 : 3;
                        int b = (int)t.Species * VegetationSetSO.Lods + lod;
                        if (bucketCounts[b] >= MaxVisible) continue;
                        if (!GeometryUtility.TestPlanesAABB(planes, new Bounds(world + new float3(0, 11 * t.Scale, 0), new Vector3(16, 24, 16) * t.Scale))) continue;
                        matrices[b * MaxVisible + bucketCounts[b]++] = Matrix4x4.TRS(world, Quaternion.Euler(0, math.degrees(t.Yaw), 0), Vector3.one * t.Scale);
                    }
                }
                Shader.SetGlobalFloat(SnowLineId, snowLine);
                for (int b = 0; b < Buckets; b++)
                {
                    var mesh = MeshFor(b);
                    int n = bucketCounts[b];
                    if (n == 0 || mesh == null || materials[b] == null) continue;
                    rp.material = materials[b];
                    rp.matProps = props[b];
                    rp.shadowCastingMode = b % VegetationSetSO.Lods <= 1 || set.FarShadows ? ShadowCastingMode.On : ShadowCastingMode.Off;
                    Graphics.RenderMeshInstanced(rp, mesh, 0, matrices.GetSubArray(b * MaxVisible, n), n);
                }
            }
        }

        static readonly int AmbientUpId = Shader.PropertyToID("_TreeAmbientUp"), AmbientDownId = Shader.PropertyToID("_TreeAmbientDown");
        static readonly Vector3[] ambientDirs = { Vector3.up, Vector3.down };
        readonly Color[] ambientOut = new Color[2];

        /// <summary>Rally/Tree's ambient: the scene's ambient probe evaluated up and down (see the shader for why not SampleSH).</summary>
        void SetAmbient()
        {
            RenderSettings.ambientProbe.Evaluate(ambientDirs, ambientOut);
            Shader.SetGlobalVector(AmbientUpId, ambientOut[0]);
            Shader.SetGlobalVector(AmbientDownId, ambientOut[1]);
        }

        public void Dispose()
        {
            originsCpu.Dispose(); zero.Dispose(); tileOrigins?.Dispose();
            instances?.Dispose(); counts?.Dispose(); visible?.Dispose(); drawCounts?.Dispose(); args?.Dispose();
            if (cpuInstances.IsCreated) { cpuInstances.Dispose(); cpuCounts.Dispose(); jobCount.Dispose(); matrices.Dispose(); }
            foreach (var m in materials) if (m != null) RallyObjects.Destroy(m);
        }
    }
}
