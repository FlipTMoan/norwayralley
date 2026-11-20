using Rally.Core;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Vehicle
{
    /// <summary>
    /// "Why did the car stop?" in the F2 log window: every solid contact (what, where, how hard), every damage step and
    /// every sudden slow-down the driver did not ask for (more than <see cref="DropKmh"/> lost within 0.2 s without brake
    /// or handbrake), with the state that explains it. All lines start with "collision:". Rate-limited so a scrape along
    /// a wall is one line, not sixty a second.
    /// </summary>
    public sealed class CarDiagnostics
    {
        public const float DropKmh = 15f, Window = 0.2f;
        public int Contacts, SuddenStops, Placements, HousePushes;
        public string LastContact = "", LastSuddenStop = "";
        readonly float[] times = new float[64], speeds = new float[64];
        int head, count;
        float lastWater;
        float clock, lastContactAt = -99f, lastStopAt = -99f, lastLogAt = -99f;
        Collider lastLogged;

        static string Where(in CarState s) { var u = FloatingOrigin.ToUtm(s.Pos); return $"E {u.E:0} N {u.N:0}"; }

        static string Kind(Collider c)
        {
            string layer = LayerMask.LayerToName(c.gameObject.layer);
            if (layer == "Trees" && c is CapsuleCollider cap) return $"tree (trunk r {cap.radius:0.00} m, {cap.height:0.0} m tall)";
            return layer.ToLowerInvariant();
        }

        public void Contact(in CarState s, Collider other, float speedInto, float depth, bool snapped)
        {
            Contacts++;
            lastContactAt = clock;
            var p = other.transform.position;
            LastContact = $"{Kind(other)} '{other.name}' at world ({p.x:0.0}, {p.z:0.0})";
            if (other == lastLogged && clock - lastLogAt < 0.5f) return;
            lastLogged = other; lastLogAt = clock;
            RallyLog.Info($"collision: {(snapped ? "broke through" : "hit")} {LastContact}, {speedInto * 3.6f:0} km/h into it, overlap {depth:0.00} m, car {s.SpeedKmh:0} km/h {s.SurfaceKind} at {Where(s)}");
        }

        /// <summary>Main-thread time of the car's solid tests (sync, sweeps, house push, overlap push-out): total, frames, worst (ms).</summary>
        public double SolidsMs, SolidsMaxMs;
        public int SolidsFrames;
        public void SolidsTime(long ticks)
        {
            double ms = ticks * 1000.0 / System.Diagnostics.Stopwatch.Frequency;
            SolidsMs += ms; SolidsFrames++; if (ms > SolidsMaxMs) SolidsMaxMs = ms;
        }

        /// <summary>A placement (spawn, reset) found a solid at the pose and moved the car along the road.</summary>
        public void Placed(float2 from, float2 to)
        {
            Placements++;
            RallyLog.Info($"collision: placed the car {math.distance(from, to):0} m along the road, the spot was inside a solid");
        }

        /// <summary>The car was deep in a house footprint (streamed in around it, or past a wall) and was moved out.</summary>
        public void HousePush(float distance)
        {
            HousePushes++;
            if (clock - lastLogAt < 0.5f) return;
            lastLogAt = clock;
            RallyLog.Info($"collision: pushed {distance:0.00} m out of a house footprint");
        }

        /// <summary>Once per frame after the sim and the collision pass.</summary>
        public void Watch(ref CarState s, in CarInput input, IGround ground, float dt, float damageBefore)
        {
            clock += dt;
            float kmh = s.SpeedKmh;
            if (s.WaterDepth > 0f && lastWater <= 0f)
                RallyLog.Info($"collision: water {s.WaterDepth:0.00} m deep under the car{(s.OnRoad ? " ON THE ROAD" : "")} at {kmh:0} km/h, {Where(s)}");
            lastWater = s.WaterDepth;
            float dmg = s.Damage.Total - damageBefore;
            if (dmg > 0.01f) RallyLog.Info($"collision: damage +{dmg * 100:0} % (total {s.Damage.Total * 100:0} %), last contact {(clock - lastContactAt < 0.3f ? LastContact : "none")}, at {Where(s)}");
            // Speed 0.2 s ago from the ring of recent frames.
            float past = kmh;
            for (int k = 0; k < count; k++)
            {
                int i = (head - 1 - k + times.Length) % times.Length;
                if (clock - times[i] > Window) break;
                past = math.max(past, speeds[i]);
            }
            times[head] = clock; speeds[head] = kmh; head = (head + 1) % times.Length; count = math.min(count + 1, times.Length);
            bool asked = input.Brake > 0.1f || input.Handbrake || input.Frozen;
            if (past - kmh > DropKmh && !asked && clock - lastStopAt > 1f)
            {
                SuddenStops++;
                lastStopAt = clock;
                LastSuddenStop = $"{past:0} → {kmh:0} km/h in {Window:0.0} s at {Where(s)}: contact {(clock - lastContactAt < 0.3f ? LastContact : "none")}, {s.SurfaceKind}{(s.OnRoad ? " on road" : " off road")}, "
                    + $"water {s.WaterDepth:0.00} m, {(s.Grounded ? "grounded" : "airborne")} (air {s.AirTime:0.00} s, landing {s.LandingImpact:0.00}), tile {(ground.IsLoaded(s.Pos.xz) ? "loaded" : "NOT LOADED")}, throttle {input.Throttle:0.0}";
                RallyLog.Info("collision: sudden slow-down " + LastSuddenStop);
            }
        }
    }
}
