namespace Rally.UI
{
    /// <summary>What the HUD shows each frame; the GameController fills it from the car, the route and the flow.</summary>
    public struct HudFrame
    {
        public float SpeedKmh;
        public float Rpm, Redline;
        public int Gear;                 // 0 = R, 1..n
        public bool Manual;              // manual gearbox: the gear reads "3 M" so a box left in manual is never a mystery
        public float StageTime, PenaltyTime;
        public float DistanceLeft;       // m to the finish (free drive: 0)
        public string NoteKind;          // "EASY LEFT", "HAIRPIN RIGHT", "CAUTION", "" (PaceNotes)
        public int NoteDistance;         // m in 50 m steps, 0 = now
        public string Surface;           // ASPHALT / GRAVEL / OFF ROAD / WATER
        public float Damage;             // 0..1
        public string Status;            // loading / service messages
    }
}
