using System;
using System.Collections.Generic;
using Rally.Actors;

namespace Rally.Gameplay
{
    /// <summary>The phases of legacy-js/src/main.js: loading → intro → countdown → racing → finished (+ free drive, which never finishes).</summary>
    public enum Phase : byte { Loading, Intro, Countdown, Racing, Finished }

    /// <summary>
    /// Pure game state: phase, stage clock, sector splits, penalties. The scene's GameController drives it
    /// with dt and events; the HUD reads it. Kept free of Unity types so the whole flow is unit-testable.
    /// </summary>
    public sealed class GameFlow
    {
        public const float CountdownSeconds = 3f;
        public Phase Phase { get; private set; } = Phase.Loading;
        public bool FreeDrive;
        public float Countdown { get; private set; }
        public float StageTime { get; private set; }      // s since the start line, penalties excluded
        public float PenaltyTime { get; private set; }
        public float TotalTime => StageTime + PenaltyTime;
        public readonly List<float> Splits = new List<float>();
        public readonly List<ActorHit> Hits = new List<ActorHit>();
        public int NearMisses { get; private set; }
        /// <summary>Damage itself lives in the car (Rally.Vehicle.CarState.Damage); the flow only tracks the clock and penalties.</summary>
        public event Action<Phase> PhaseChanged;

        public void WorldReady() { if (Phase == Phase.Loading) Set(Phase.Intro); }
        /// <summary>A new stage arrives mid-room (host hand-over): back to Loading so the start screen returns until the world is ready.</summary>
        public void Reload() { StageTime = 0; PenaltyTime = 0; NearMisses = 0; Retired = false; Splits.Clear(); Hits.Clear(); Set(Phase.Loading); }
        public void StartEngine() { if (Phase == Phase.Intro) { Countdown = CountdownSeconds; Set(Phase.Countdown); } }
        public void Restart() { StageTime = 0; PenaltyTime = 0; NearMisses = 0; Splits.Clear(); Hits.Clear(); Countdown = CountdownSeconds; Set(Phase.Countdown); }

        public void Update(float dt)
        {
            switch (Phase)
            {
                case Phase.Countdown:
                    Countdown -= dt;
                    if (Countdown <= 0) { Countdown = 0; Set(Phase.Racing); }
                    break;
                case Phase.Racing:
                    StageTime += dt;
                    break;
            }
        }

        public void Sector() { if (Phase == Phase.Racing) Splits.Add(TotalTime); }
        public void Finish() { if (Phase == Phase.Racing && !FreeDrive) Set(Phase.Finished); }

        /// <summary>An animal/pedestrian hit: time penalty here, damage through CarController.ApplyExternalHit.</summary>
        public void OnHit(ActorHit hit)
        {
            Hits.Add(hit);
            PenaltyTime += hit.PenaltySeconds;
        }

        /// <summary>The car is wrecked (CarState.Damage.Wrecked): the stage ends as a retirement.</summary>
        public bool Retired { get; private set; }
        public void Retire() { if (Phase == Phase.Racing) { Retired = true; Set(Phase.Finished); } }

        public void OnNearMiss() { NearMisses++; PenaltyTime = Math.Max(0, PenaltyTime - 1f); }

        void Set(Phase p) { Phase = p; PhaseChanged?.Invoke(p); }
    }
}
