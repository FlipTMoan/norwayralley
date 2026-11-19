using System;

namespace Rally.Core
{
    /// <summary>
    /// Frame times of the last <see cref="Window"/> frames: average and 95th percentile in milliseconds, for the
    /// debug window and the <c>?bench</c> run (GameController). One Record per frame; the percentile sorts a copy
    /// and is meant for a few calls a second, not every frame.
    /// </summary>
    public sealed class FrameStats
    {
        public const int Window = 600;
        readonly float[] ms = new float[Window], sorted = new float[Window];
        int next, count;
        double sum;

        public int Count => count;
        public float AvgMs => count == 0 ? 0f : (float)(sum / count);

        public void Record(float seconds)
        {
            float v = seconds * 1000f;
            if (count == Window) sum -= ms[next]; else count++;
            ms[next] = v; sum += v;
            next = (next + 1) % Window;
        }

        /// <summary>The frame time that <paramref name="p"/> (0–1) of the recorded frames stay under.</summary>
        public float PercentileMs(float p)
        {
            if (count == 0) return 0f;
            Array.Copy(ms, sorted, count);
            Array.Sort(sorted, 0, count);
            int i = (int)Math.Ceiling(p * count) - 1;
            return sorted[Math.Max(0, Math.Min(count - 1, i))];
        }

        public void Clear() { next = count = 0; sum = 0; }
    }
}
