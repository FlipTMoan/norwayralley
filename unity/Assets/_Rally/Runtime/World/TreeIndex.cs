using System.Collections.Generic;
using Rally.Core;
using Unity.Collections;
using Unity.Mathematics;

namespace Rally.World
{
    /// <summary>A tree the car can hit: position in EPSG:25833, trunk radius and height at its scale.</summary>
    public struct TreeHit
    {
        public double2 Position;
        public float GroundY, Radius, Height;
        public byte Species;
    }

    /// <summary>
    /// CPU copy of every live tile's trees in 32 m buckets, because the trees are indirect-drawn with no
    /// GameObject and the car still has to hit them. Bucket keys are (floor(E/32), floor(N/32)); tiles
    /// are 2048 m so a bucket never straddles two tiles and RemoveTile can drop whole keys.
    /// Queries are allocation-free (NativeParallelMultiHashMap iteration into a caller-owned list).
    /// </summary>
    public sealed class TreeIndex : System.IDisposable
    {
        public const float BucketM = 32f;
        NativeParallelMultiHashMap<int2, TreeHit> map = new NativeParallelMultiHashMap<int2, TreeHit>(262144, Allocator.Persistent);
        readonly Dictionary<TileKey, List<int2>> keysByTile = new Dictionary<TileKey, List<int2>>();
        readonly HashSet<int2> seen = new HashSet<int2>();

        public int Count => map.Count();
        /// <summary>A tile's trees were added (the verge plants keep clear of the trunks: VergeLayer rebuilds its cells there).</summary>
        public event System.Action<TileKey> TileAdded;

        public void AddTile(TileKey key, Utm33 origin, NativeArray<TreeInstance> instances, int count, VegetationSetSO set)
        {
            RemoveTile(key);
            var keys = new List<int2>();
            seen.Clear();
            for (int i = 0; i < count; i++)
            {
                var t = instances[i];
                var proto = set != null && t.Species < set.Prototypes.Length ? set.Prototypes[t.Species] : null;
                var hit = new TreeHit
                {
                    Position = new double2(origin.E + t.Pos.x, origin.N + t.Pos.z), GroundY = t.Pos.y,
                    Radius = (proto != null ? proto.TrunkRadius : 0.25f) * t.Scale, Height = (proto != null ? proto.Height : 12f) * t.Scale, Species = (byte)t.Species,
                };
                var b = new int2((int)math.floor(hit.Position.x / BucketM), (int)math.floor(hit.Position.y / BucketM));
                if (seen.Add(b)) keys.Add(b);
                map.Add(b, hit);
            }
            keysByTile[key] = keys;
            TileAdded?.Invoke(key);
        }

        public void RemoveTile(TileKey key)
        {
            if (!keysByTile.TryGetValue(key, out var keys)) return;
            foreach (var b in keys) map.Remove(b);
            keysByTile.Remove(key);
        }

        /// <summary>Every tree within <paramref name="radius"/> of a world XZ, appended to <paramref name="result"/>.</summary>
        public void Query(float2 worldXZ, float radius, NativeList<TreeHit> result)
        {
            var p = FloatingOrigin.ToUtm(worldXZ);
            double r2 = (double)radius * radius;
            int i0 = (int)math.floor((p.E - radius) / BucketM), i1 = (int)math.floor((p.E + radius) / BucketM);
            int j0 = (int)math.floor((p.N - radius) / BucketM), j1 = (int)math.floor((p.N + radius) / BucketM);
            for (int j = j0; j <= j1; j++)
                for (int i = i0; i <= i1; i++)
                {
                    if (!map.TryGetFirstValue(new int2(i, j), out var hit, out var it)) continue;
                    do
                    {
                        double dx = hit.Position.x - p.E, dy = hit.Position.y - p.N;
                        if (dx * dx + dy * dy <= r2) result.Add(hit);
                    } while (map.TryGetNextValue(out hit, ref it));
                }
        }

        public void Dispose() { if (map.IsCreated) map.Dispose(); }
    }
}
