using System.Collections.Generic;
using Unity.Mathematics;

namespace Rally.Track
{
    public enum TurnSeverity : byte { Slight, Medium, Hairpin }

    /// <summary>One bend of the stage (turns.js:61): distances in metres along the route, angle in degrees.</summary>
    public struct Turn
    {
        /// <summary>The apex sample's s.</summary>
        public float S;
        public float Entry, Exit;
        /// <summary>Total heading change over the run; sign per <see cref="PaceNotes.TurnAngle"/>.</summary>
        public float Angle;
        public TurnSeverity Severity;
    }

    /// <summary>
    /// Pace notes from the stage line (1:1 port of legacy-js/src/turns.js): where the road bends, which way
    /// and how hard, so the HUD can show an arrow and the distance to the next turn.
    ///
    /// The heading change is measured between the chord <see cref="Look"/> metres behind a sample and the
    /// chord <see cref="Look"/> metres ahead of it; a run of samples bending the same way by at least
    /// <see cref="MinAngle"/> is one turn. Its angle is the total heading change over the run, positive in
    /// the car's yaw sense (from +z towards +x), the cross term u.z·v.x − u.x·v.z.
    ///
    /// Sign convention: **positive = left bend on screen**, as in the JS HUD. The JS frame (x = east, z = south,
    /// screen-right = world −x) got that from u.z·v.x − u.x·v.z; the Unity frame (x = east, z = north,
    /// screen-right = +x when heading +z) needs the opposite sign, so the cross term is flipped here and
    /// nothing downstream (HUD arrow, "LEFT"/"RIGHT" text, Actors' RoadPoint.Left) has to think about frames.
    /// </summary>
    public static class PaceNotes
    {
        /// <summary>Metres of chord either side of a sample (turns.js:11 LOOK).</summary>
        public const float Look = 12f;
        /// <summary>Degrees across the chords before a bend counts as a turn (turns.js:12 MIN_ANGLE).</summary>
        public const float MinAngle = 20f;
        const double Deg = 180.0 / math.PI_DBL;

        /// <summary>turns.js:15 indexAt: walk `step` from `from` until the chord is `s` metres long.</summary>
        static int IndexAt(IReadOnlyList<RouteSample> samples, float s, int from, int step)
        {
            int i = from;
            while (i + step >= 0 && i + step < samples.Count && math.abs(samples[i + step].S - samples[from].S) < s) i += step;
            return i;
        }

        /// <summary>turns.js:21 heading: chord from a to b (x, z).</summary>
        static double2 Heading(in RouteSample a, in RouteSample b) => new double2(b.E - a.E, b.N - a.N);

        /// <summary>
        /// turns.js:30 turnAngle: signed heading change in degrees from direction u to v (x, z), positive for a
        /// bend to the left (towards −x when heading +z in the Unity frame). See the class doc.
        /// </summary>
        public static float TurnAngle(double2 u, double2 v)
        {
            double cross = u.x * v.y - u.y * v.x;
            double dot = u.x * v.x + u.y * v.y;
            return (float)(math.atan2(cross, dot) * Deg);
        }

        public static float TurnAngle(float2 u, float2 v) => TurnAngle(new double2(u.x, u.y), new double2(v.x, v.y));

        static int SignOf(float v) => v > 0f ? 1 : v < 0f ? -1 : 0;

        /// <summary>turns.js:37 findTurns. Allocates once per stage; call it when the route is built, not per frame.</summary>
        public static List<Turn> FindTurns(IReadOnlyList<RouteSample> samples, float look = Look, float minAngle = MinAngle)
        {
            var turns = new List<Turn>();
            FindTurns(samples, turns, look, minAngle);
            return turns;
        }

        public static void FindTurns(IReadOnlyList<RouteSample> samples, List<Turn> into, float look = Look, float minAngle = MinAngle)
        {
            into.Clear();
            if (samples == null || samples.Count < 3) return;
            var local = new float[samples.Count];
            for (int i = 1; i < samples.Count - 1; i++)
            {
                int back = IndexAt(samples, look, i, -1);
                int ahead = IndexAt(samples, look, i, 1);
                if (back == i || ahead == i) continue;
                local[i] = TurnAngle(Heading(samples[back], samples[i]), Heading(samples[i], samples[ahead]));
            }
            int k = 0;
            while (k < samples.Count)
            {
                if (math.abs(local[k]) < minAngle) { k++; continue; }
                int sign = SignOf(local[k]);
                int j = k;
                int apex = k;
                while (j + 1 < samples.Count && SignOf(local[j + 1]) == sign && math.abs(local[j + 1]) >= minAngle)
                {
                    j++;
                    if (math.abs(local[j]) > math.abs(local[apex])) apex = j;
                }
                int b = IndexAt(samples, look, k, -1);
                int a = IndexAt(samples, look, j, 1);
                float angle = TurnAngle(Heading(samples[b], samples[k]), Heading(samples[j], samples[a]));
                float abs = math.abs(angle);
                into.Add(new Turn
                {
                    S = samples[apex].S,
                    Entry = samples[k].S,
                    Exit = samples[j].S,
                    Angle = angle,
                    Severity = abs < 45f ? TurnSeverity.Slight : abs < 100f ? TurnSeverity.Medium : TurnSeverity.Hairpin,
                });
                k = j + 1;
            }
        }

        /// <summary>turns.js:74 nextTurn: index of the next turn ahead of `s`, or −1 when none lies within `ahead` metres.</summary>
        public static int NextTurn(IReadOnlyList<Turn> turns, float s, float ahead = 1000f)
        {
            for (int i = 0; i < turns.Count; i++)
            {
                var turn = turns[i];
                if (turn.Exit < s) continue;
                if (turn.Entry - s > ahead) return -1;
                return i;
            }
            return -1;
        }

        /// <summary>turns.js:84 roundedDistance: distance to the entry in 50 m steps (JS Math.round: halves go up); 0 once inside.</summary>
        public static int RoundedDistance(in Turn turn, float s)
        {
            float d = math.max(0f, turn.Entry - s);
            return (int)math.floor(d / 50f + 0.5f) * 50;
        }
    }
}
