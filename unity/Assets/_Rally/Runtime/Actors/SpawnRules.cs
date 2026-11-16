using System;
using System.Collections.Generic;
using Rally.Core;
using Unity.Mathematics;

namespace Rally.Actors
{
    /// <summary>One planned encounter: which actor waits where along the stage, on which side, and how hidden.</summary>
    public struct SpawnPlan
    {
        public ActorKind Kind;
        public float S;            // route distance of the crossing point
        public float Side;         // +1 = waits on the left verge, −1 right
        public float Offset;       // m from the road edge where it stands (hidden in trees = larger)
        public float SpeedFactor;  // 0.8..1.2 variation of the spec speeds
    }

    /// <summary>
    /// Decides what crosses where. Reads the land cover beside the road ahead so moose appear in forest,
    /// sheep by pasture and open fjell, reindeer on open ground in the north, people and dogs where houses
    /// are dense, cyclists on paved roads. Deterministic from the stage seed and sector index so every
    /// player in a room meets the same moose at the same place (CONVENTIONS: seeded RallyRandom).
    /// </summary>
    public static class SpawnRules
    {
        public const float ReindeerLatitude = 65f;   // °N: open-ground encounters switch from sheep to reindeer
        public const float SampleStep = 25f;          // m along the route between cover samples

        /// <param name="sectorStart">route s where the sector starts</param>
        /// <param name="sectorEnd">route s where it ends</param>
        /// <param name="coverAt">land cover a few metres off the road at (route s, side)</param>
        /// <param name="paved">true where the road is asphalt (cyclists)</param>
        /// <param name="latitudeDeg">latitude of the sector, for reindeer</param>
        /// <param name="density">encounters per km at difficulty 1 (0 = none)</param>
        public static List<SpawnPlan> Plan(ulong seed, int sector, float sectorStart, float sectorEnd,
            Func<float, float, CoverKind> coverAt, Func<float, bool> paved, float latitudeDeg, float density)
        {
            var plans = new List<SpawnPlan>();
            if (density <= 0 || sectorEnd <= sectorStart) return plans;
            var rng = new RallyRandom(seed).Fork((ulong)(sector + 1));
            float lengthKm = (sectorEnd - sectorStart) / 1000f;
            int count = (int)math.round(lengthKm * density * rng.Range(0.7f, 1.3f));
            const float minGap = 150f;
            int attempts = 0;
            while (plans.Count < count && attempts++ < count * 8)
            {
                float s = rng.Range(sectorStart + 100f, sectorEnd - 50f);
                bool crowded = false;
                for (int i = 0; i < plans.Count && !crowded; i++) crowded = math.abs(plans[i].S - s) < minGap;
                if (crowded) continue;
                float side = rng.NextFloat() < 0.5f ? 1f : -1f;
                var cover = coverAt(s, side);
                var kind = Pick(cover, paved(s), latitudeDeg, ref rng);
                if (kind == null) continue;
                plans.Add(new SpawnPlan
                {
                    Kind = kind.Value, S = s, Side = side,
                    Offset = cover == CoverKind.Forest ? rng.Range(6f, 14f) : rng.Range(3f, 8f),
                    SpeedFactor = rng.Range(0.8f, 1.2f),
                });
            }
            plans.Sort((a, b) => a.S.CompareTo(b.S));
            return plans;
        }

        /// <summary>Weighted pick per cover class; null means nothing lives here (water, unknown).</summary>
        public static ActorKind? Pick(CoverKind cover, bool paved, float latitudeDeg, ref RallyRandom rng)
        {
            float r = rng.NextFloat();
            switch (cover)
            {
                case CoverKind.Forest:
                    return r < 0.45f ? ActorKind.Moose : r < 0.85f ? ActorKind.Deer : ActorKind.Sheep;
                case CoverKind.Pasture:
                    return r < 0.6f ? ActorKind.Sheep : r < 0.8f ? ActorKind.Tractor : r < 0.9f ? ActorKind.Dog : ActorKind.Deer;
                case CoverKind.OpenFjell:
                case CoverKind.Bog:
                    if (latitudeDeg >= ReindeerLatitude) return r < 0.8f ? ActorKind.Reindeer : ActorKind.Sheep;
                    return r < 0.7f ? ActorKind.Sheep : ActorKind.Moose;
                case CoverKind.Settlement:
                    if (paved && r < 0.25f) return ActorKind.Cyclist;
                    return r < 0.65f ? ActorKind.Pedestrian : ActorKind.Dog;
                default:
                    return null;
            }
        }
    }
}
