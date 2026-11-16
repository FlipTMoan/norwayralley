namespace Rally.Net
{
    /// <summary>
    /// Host clock alignment from the ctl heartbeat: a guest sends <c>hb {ts}</c>, the host answers
    /// <c>hbr {ts, at}</c> with its own clock; RTT = now − ts and the host clock read at the moment of
    /// the reply is assumed to be halfway (one-way delay = RTT/2). The offset is smoothed over replies
    /// so one slow heartbeat does not jerk the countdown; on a LAN the error is a few milliseconds.
    /// </summary>
    public struct ClockSync
    {
        /// <summary>host time = local time + OffsetMs.</summary>
        public double OffsetMs;
        public double RttMs;
        public int Samples;

        /// <summary>Fold in one reply (times in ms, all on the local clock except <paramref name="hostAt"/>).</summary>
        public void OnReply(double sentTs, double hostAt, double now)
        {
            double rtt = now - sentTs;
            double offset = hostAt - (sentTs + rtt / 2);
            if (Samples == 0 || rtt < RttMs) { OffsetMs = offset; RttMs = rtt; }     // the fastest reply is the truest
            else OffsetMs += (offset - OffsetMs) * 0.2;
            Samples++;
        }

        public double ToHost(double localMs) => localMs + OffsetMs;
        public double ToLocal(double hostMs) => hostMs - OffsetMs;
    }

    /// <summary>One finisher on the room leaderboard (<c>result</c> / <c>board</c> messages).</summary>
    public struct StageResult
    {
        public string Name;
        public double TimeMs, PenaltyMs;
        public double TotalMs => TimeMs + PenaltyMs;
    }
}
