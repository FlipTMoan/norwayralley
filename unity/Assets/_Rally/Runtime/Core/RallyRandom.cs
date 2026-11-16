namespace Rally.Core
{
    /// <summary>Deterministic xorshift64* so stages, spawns and scatter reproduce from a seed on every client.</summary>
    public struct RallyRandom
    {
        ulong s;
        public RallyRandom(ulong seed) { s = seed == 0 ? 0x9E3779B97F4A7C15UL : seed; }
        public ulong NextU64() { s ^= s >> 12; s ^= s << 25; s ^= s >> 27; return s * 0x2545F4914F6CDD1DUL; }
        public float NextFloat() => (NextU64() >> 40) * (1f / 16777216f);
        public float Range(float min, float max) => min + (max - min) * NextFloat();
        public int Range(int min, int maxExclusive) => min + (int)(NextU64() % (ulong)(maxExclusive - min));
        /// <summary>A child stream for a sub-task (tile, sector) so unrelated work never shares a sequence.</summary>
        public RallyRandom Fork(ulong salt) => new RallyRandom(NextU64() ^ (salt * 0xD6E8FEB86659FD93UL));
    }
}
