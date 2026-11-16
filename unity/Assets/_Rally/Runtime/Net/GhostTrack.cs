using System;
using System.Collections.Generic;

namespace Rally.Net
{
    /// <summary>An interpolated pose of another player's car (frame as <see cref="StatePacket"/>).</summary>
    public struct GhostPose
    {
        public double X, Y, Z, Yaw, Pitch, Roll, Speed;
    }

    /// <summary>
    /// multiplayer.js <c>GhostTrack</c>: packets arrive every ~80 ms; the ghost renders ~120 ms behind
    /// the newest one and interpolates between the two packets around that time, so it moves smoothly
    /// instead of teleporting. At the newest packet it holds (a little extrapolation would jitter).
    /// Times are milliseconds on the receiver's clock.
    /// </summary>
    public sealed class GhostTrack
    {
        const int MaxSamples = 20;

        struct Sample { public double At; public StatePacket State; }

        readonly List<Sample> samples = new List<Sample>(MaxSamples + 1);
        public double DelayMs;
        public string Name = "";
        public string Kind = "porsche";

        public GhostTrack(double delayMs = 120) { DelayMs = delayMs; }

        public void Push(StatePacket state, double nowMs)
        {
            if (!string.IsNullOrEmpty(state.Name)) Name = state.Name;
            if (!string.IsNullOrEmpty(state.Kind)) Kind = state.Kind;
            samples.Add(new Sample { At = nowMs, State = state });
            if (samples.Count > MaxSamples) samples.RemoveAt(0);
        }

        public double LastSeen => samples.Count > 0 ? samples[samples.Count - 1].At : double.NegativeInfinity;
        public int Count => samples.Count;

        public bool TrySample(double nowMs, out GhostPose pose)
        {
            pose = default;
            if (samples.Count == 0) return false;
            double t = nowMs - DelayMs;
            if (t <= samples[0].At) { pose = Pose(samples[0].State); return true; }
            for (int i = samples.Count - 1; i >= 0; i--)
            {
                if (samples[i].At > t) continue;
                var a = samples[i];
                if (i + 1 >= samples.Count) { pose = Pose(a.State); return true; } // newest packet: hold
                var b = samples[i + 1];
                double u = Math.Min(1, (t - a.At) / Math.Max(1, b.At - a.At));
                pose = new GhostPose
                {
                    X = a.State.X + (b.State.X - a.State.X) * u,
                    Y = a.State.Y + (b.State.Y - a.State.Y) * u,
                    Z = a.State.Z + (b.State.Z - a.State.Z) * u,
                    Yaw = LerpAngle(a.State.Yaw, b.State.Yaw, u),
                    Pitch = a.State.Pitch + (b.State.Pitch - a.State.Pitch) * u,
                    Roll = a.State.Roll + (b.State.Roll - a.State.Roll) * u,
                    Speed = a.State.Speed + (b.State.Speed - a.State.Speed) * u,
                };
                return true;
            }
            pose = Pose(samples[0].State);
            return true;
        }

        static GhostPose Pose(StatePacket s) => new GhostPose { X = s.X, Y = s.Y, Z = s.Z, Yaw = s.Yaw, Pitch = s.Pitch, Roll = s.Roll, Speed = s.Speed };

        static double LerpAngle(double a, double b, double u)
        {
            double d = b - a;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            return a + d * u;
        }
    }
}
