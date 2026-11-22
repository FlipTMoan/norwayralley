using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;

namespace Rally.Core
{
    /// <summary>
    /// Every real frame's time and, for slow frames, what ran in it: the streaming code wraps its heavy steps in
    /// <see cref="Start"/> / <see cref="Stop"/> (DEM decode, carve, scatter, overlay stages, collider bakes, uploads),
    /// GameController calls <see cref="EndFrame"/> once per frame. Off (the default) it costs one bool test per call
    /// and never allocates; on (the editor bench, <c>?bench</c>) a frame over <see cref="SpikeMs"/> keeps a line with
    /// its sections, so a hitch is attributed instead of averaged away.
    /// </summary>
    public static class FrameProbe
    {
        public static bool Enabled;
        public const float SpikeMs = 33f;
        const int MaxSections = 40;
        static readonly string[] names = new string[MaxSections];
        static readonly double[] sectionMs = new double[MaxSections];
        static readonly int[] calls = new int[MaxSections];
        static int sections, gcCount = -1;
        static readonly double tickMs = 1000.0 / Stopwatch.Frequency;

        /// <summary>Every frame time (ms) since <see cref="Begin"/>.</summary>
        public static readonly List<float> Frames = new List<float>(16384);
        /// <summary>
        /// Every frame's measured main-thread streaming work (ms): the top-level sections minus the GPU waits inside them
        /// (sections named '.gpu…', e.g. the vegetation cull's dispatch blocking on a busy GPU). Independent of other GPU users.
        /// </summary>
        public static readonly List<float> Work = new List<float>(16384);
        /// <summary>One line per frame over <see cref="SpikeMs"/>: its time and its sections.</summary>
        public static readonly List<string> Spikes = new List<string>();

        /// <summary>Milliseconds and calls per section since <see cref="Begin"/> (where a long job such as the start area's grading goes).</summary>
        public static readonly Dictionary<string, (double ms, int calls)> Totals = new Dictionary<string, (double, int)>();

        public static void Begin() { Enabled = true; Frames.Clear(); Work.Clear(); Spikes.Clear(); Totals.Clear(); sections = 0; gcCount = GC.CollectionCount(0); }
        public static void End() => Enabled = false;

        public static long Start() => Enabled ? Stopwatch.GetTimestamp() : 0;

        /// <summary>Add the time since <paramref name="t0"/> to the section <paramref name="name"/> of this frame (a literal: compared by reference).</summary>
        public static void Stop(string name, long t0)
        {
            if (!Enabled || t0 == 0) return;
            double ms = (Stopwatch.GetTimestamp() - t0) * tickMs;
            Totals.TryGetValue(name, out var tot); Totals[name] = (tot.ms + ms, tot.calls + 1);
            for (int i = 0; i < sections; i++)
                if ((object)names[i] == name) { sectionMs[i] += ms; calls[i]++; return; }
            if (sections == MaxSections) return;
            names[sections] = name; sectionMs[sections] = ms; calls[sections] = 1; sections++;
        }

        /// <summary>Once per frame with the frame's real duration: record it, keep the sections of a slow frame, start the next.</summary>
        public static void EndFrame(float seconds)
        {
            if (!Enabled) return;
            float ms = seconds * 1000f;
            Frames.Add(ms);
            double work = 0;
            for (int i = 0; i < sections; i++)
            {
                if (names[i][0] != '.') work += sectionMs[i];
                else if (names[i].StartsWith(".gpu", StringComparison.Ordinal)) work -= sectionMs[i];
            }
            Work.Add((float)work);
            int gc = GC.CollectionCount(0);
            if (ms > SpikeMs)
            {
                var sb = new StringBuilder();
                sb.Append($"{ms,6:0.0} ms:");
                double known = 0;
                for (int i = 0; i < sections; i++)
                {
                    if (names[i][0] != '.') known += sectionMs[i];   // '.name' = nested inside another section
                    sb.Append($" {names[i]} {sectionMs[i]:0.0}{(calls[i] > 1 ? "×" + calls[i] : "")}");
                }
                if (gc != gcCount) sb.Append($" GC×{gc - gcCount}");
                sb.Append($" | other {ms - known:0.0} | work {work:0.0}");
                Spikes.Add(sb.ToString());
            }
            gcCount = gc;
            sections = 0;
        }

        /// <summary>avg, median, p95, p99, max and frames over 33 / 50 ms of <see cref="Frames"/>.</summary>
        public static string Summary() => Summary(Frames);

        public static string Summary(List<float> frames)
        {
            if (frames.Count == 0) return "no frames";
            var s = new List<float>(frames);
            s.Sort();
            double sum = 0; foreach (var f in s) sum += f;
            float P(float p) => s[Math.Min(s.Count - 1, Math.Max(0, (int)Math.Ceiling(p * s.Count) - 1))];
            int over33 = 0, over50 = 0;
            foreach (var f in s) { if (f > 33f) over33++; if (f > 50f) over50++; }
            return $"frames {s.Count} avg {sum / s.Count:0.00} median {P(0.5f):0.00} p95 {P(0.95f):0.00} p99 {P(0.99f):0.00} max {s[s.Count - 1]:0.0} ms, >33 ms {over33}, >50 ms {over50}";
        }
    }
}
