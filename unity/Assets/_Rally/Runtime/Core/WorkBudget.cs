using System.Diagnostics;
using System.Threading.Tasks;

namespace Rally.Core
{
    /// <summary>
    /// How much main-thread time the streaming may take per frame. The web build has no worker threads (Burst jobs run on
    /// the main thread there too), so heavy steps — the DEM resample, the overlay stages, re-carves — are cut into pieces
    /// that run while <see cref="Left"/> and continue next frame otherwise. GameController calls <see cref="BeginFrame"/>
    /// first thing in its Update; everything after it in the frame (async continuations included) counts.
    /// </summary>
    public static class WorkBudget
    {
        /// <summary>Milliseconds of streaming work per frame; a step that started always finishes its piece.</summary>
        public static float FrameMs = 5f;
        /// <summary>The budget while driving at a good frame rate (FrameMs is derived from it each frame, see <see cref="Scale"/>).</summary>
        public static float BaseMs = 5f;
        /// <summary>While the world loads, on the start screen and during the countdown nobody drives: this much per frame.</summary>
        public const float WaitingMs = 50f;

        /// <summary>
        /// This frame's budget: <see cref="WaitingMs"/> while the car waits, else <see cref="BaseMs"/> or a quarter of the
        /// recent frame time if that is more — at 10 fps (a slow device, a throttled tab) 5 ms a frame would stretch the
        /// first road under the car over minutes; a fixed share of the frame keeps the wall-clock pace.
        /// </summary>
        public static void Scale(bool waiting, float avgFrameMs)
            => FrameMs = waiting ? System.Math.Max(BaseMs, WaitingMs) : System.Math.Max(BaseMs, System.Math.Min(33f, 0.25f * avgFrameMs));
        static long start;
        static readonly double tickMs = 1000.0 / Stopwatch.Frequency;

        public static void BeginFrame() => start = Stopwatch.GetTimestamp();
        /// <summary>Back to "no frame yet" (unlimited): tests and tools that drive the streaming without a game loop.</summary>
        public static void Reset() => start = 0;
        public static double SpentMs => start == 0 ? 0 : (Stopwatch.GetTimestamp() - start) * tickMs;
        /// <summary>True while this frame's budget lasts (always true before the first <see cref="BeginFrame"/>: tests, tools).</summary>
        public static bool Left => start == 0 || SpentMs < FrameMs;

        /// <summary>Await between pieces of an async step: continues at once while the budget lasts, else next frame.</summary>
        public static async Task Slice()
        {
            if (!Left) await Task.Yield();
        }
    }
}
