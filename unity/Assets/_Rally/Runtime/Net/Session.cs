using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Rally.Core;
using Rally.Geo;

namespace Rally.Net
{
    /// <summary>Where the data path runs, from the selected ICE candidate pair (peer.jslib 'path').</summary>
    public enum PathKind : byte { Unknown, Lan, Internet, Relay }

    /// <summary>Another player in the room.</summary>
    public sealed class PeerInfo
    {
        public string Name;
        public string Kind = "porsche";
        /// <summary>Grid slot; -1 when unknown (a state packet arrived before the roster).</summary>
        public int Slot = -1;
        public readonly GhostTrack Track = new GhostTrack();
        public PathKind Path;
        public string PathDetail = "";
        /// <summary>The peer has the reliable 'ctl' channel (a JS client has not: it gets roster messages on the state channel, unsequenced).</summary>
        public bool HasCtl;
        public double LastHeard = double.NegativeInfinity;
        // reliable channel bookkeeping
        internal int NextSeq = 1, LastSeqIn;
        internal readonly List<Pending> Unacked = new List<Pending>();
        internal readonly Queue<Dictionary<string, object>> Queued = new Queue<Dictionary<string, object>>();
        internal double NextHeartbeatAt;

        internal sealed class Pending { public int Seq; public Dictionary<string, object> Msg; public double SentAt; public int Tries; }
    }

    /// <summary>
    /// A room (port of multiplayer.js <c>Session</c>, extended for robust LAN play). Browsers cannot link
    /// phones over Bluetooth, so "nearby" multiplayer is a WebRTC data channel between the players'
    /// browsers, brokered by a short room code through the public PeerJS signalling server (only the
    /// handshake goes through it; on one LAN the data channel itself uses host candidates and stays on
    /// the LAN). The host relays: every guest sends its state to the host, the host fans it out, and the
    /// host tells joiners which stage everyone is driving.
    ///
    /// Wire format (shared with the JS game, which ignores unknown <c>t</c>): state channel <c>s</c>
    /// (80 ms, unreliable); ctl channel (reliable, ordered, <c>seq</c> + <c>ack</c>) <c>hello</c>
    /// {slot, peers, host}, <c>join</c> {id, name, kind, slot}, <c>leave</c> {id}, <c>route</c>
    /// {route:{kind, query, seed}}, <c>go</c> {atMs}, <c>result</c> {name, timeMs, penaltyMs},
    /// <c>board</c> {results}, <c>hb</c> {ts} / <c>hbr</c> {ts, at}. A peer without a ctl channel (JS)
    /// gets hello/join/leave/route on the state channel, unsequenced, as the JS does. Transport and
    /// clock are injectable so the whole relay runs in EditMode tests without a network.
    /// </summary>
    public sealed class Session
    {
        public const double StateRateMs = 80;
        public const double HeartbeatMs = 1000;
        public const double TimeoutMs = 5000;
        public const double ResendMs = 1000;
        public const int MaxUnacked = 64;
        public const double RememberSlotMs = 120000;
        public const double RejoinMaxBackoffMs = 60000;
        const double JoinTimeoutMs = 12000;
        const string HostKey = "host";

        public string Name;
        public string Kind;
        public string Code { get; private set; }
        public bool IsHost { get; set; }
        /// <summary>My place on the starting grid (host = 0).</summary>
        public int Slot { get; private set; }
        public readonly Dictionary<string, PeerInfo> Peers = new Dictionary<string, PeerInfo>();
        /// <summary>Host: the current stage message, re-sent to late joiners.</summary>
        public Dictionary<string, object> RouteMessage { get; private set; }
        /// <summary>The room leaderboard, best total first (host collects, everyone gets the board).</summary>
        public readonly List<StageResult> Results = new List<StageResult>();
        public bool Closed { get; private set; }
        public int PlayerCount => Peers.Count + 1;
        /// <summary>Guest: host clock alignment from the heartbeat replies.</summary>
        public ClockSync Clock;
        /// <summary>Guest: non-zero while a rejoin is scheduled (ms of backoff).</summary>
        public double RejoinBackoffMs { get; private set; }

        public event Action<string> Status;
        public event Action<string> Error;
        public event Action<string, string> PeerJoin;             // id, name
        public event Action<string, string> PeerLeave;            // id, reason ('left' | 'timeout' | 'closed')
        public event Action<string, StatePacket> State;           // id, state
        public event Action<Dictionary<string, object>, string> Route;  // route {kind, query, seed}, from (null on a guest)
        public event Action<int> SlotAssigned;
        public event Action<string, PathKind> PathChanged;        // id, kind
        /// <summary>The countdown ends at this LOCAL time (ms): the host's go time mapped through <see cref="Clock"/>.</summary>
        public event Action<double> Go;
        public event Action ResultsChanged;

        readonly IPeerTransport transport;
        readonly Func<double> now;
        readonly HashSet<string> conns = new HashSet<string>();  // host: guest ids with the state channel open; guest: the host id
        readonly Dictionary<string, (int slot, double at)> rememberedSlots = new Dictionary<string, (int, double)>();
        string hostId;                                            // guest: 'nrr-CODE'
        int nextSlot = 1;
        double lastSent = double.NegativeInfinity;
        double rejoinAt = double.PositiveInfinity;
        bool listening, rejoining;

        public Session(string name = null, string kind = "porsche", IPeerTransport transport = null, Func<double> nowMs = null)
        {
            Name = name ?? RoomCodes.MakeCallsign();
            Kind = kind;
            this.transport = transport ?? new JslibTransport();
            now = nowMs ?? (() => PeerBridge.NowMs);
        }

        public static string PathLabel(PathKind k) => k switch
        {
            PathKind.Lan => "LAN direct", PathKind.Internet => "via internet", PathKind.Relay => "relayed", _ => "connecting",
        };

        /* ---------------------------------------------------------------- *
         *  Opening a room over the bridge                                   *
         * ---------------------------------------------------------------- */

        /// <summary>multiplayer.js <c>host()</c>: try up to four codes (a taken id answers 'unavailable-id').</summary>
        public async Task<string> Host()
        {
            IsHost = true;
            Listen();
            for (int attempt = 0; attempt < 4 && Code == null; attempt++)
            {
                string code = RoomCodes.MakeRoomCode();
                var outcome = await Handshake(() => PeerBridge.Host(code), e =>
                    e.Ev == "open" ? "ok" : e.Ev == "error" ? (e.Type == "unavailable-id" ? "retry" : e.Message ?? "failed") : null, double.PositiveInfinity);
                if (outcome == "ok") Code = code;
                else if (outcome != "retry") throw new Exception($"Could not open a room: {outcome}");
            }
            if (Code == null) throw new Exception("Could not find a free room code.");
            Status?.Invoke($"Room {Code} open. Friends: JOIN with this code.");
            return Code;
        }

        /// <summary>multiplayer.js <c>join()</c>; the same path is used for a rejoin (the host keeps our slot for 2 minutes).</summary>
        public async Task<string> Join(string codeText)
        {
            string code = RoomCodes.NormaliseCode(codeText);
            if (code.Length < 4) throw new Exception("Enter the 4-letter room code.");
            IsHost = false;
            Code = code;
            hostId = RoomCodes.RoomPrefix + code;
            Listen();
            var opened = await Handshake(() => PeerBridge.Join(code, Name, Kind), e =>
                e.Ev == "open" ? "ok" : e.Ev == "error" ? e.Message ?? "failed" : null, JoinTimeoutMs);
            if (opened != "ok") throw new Exception(opened ?? "No answer from the signalling server (is the internet reachable?).");
            var connected = await Handshake(null, e =>
                e.Ev == "conn-open" && e.Id == hostId && e.Label == "" ? "ok"
                : e.Ev == "error" ? (e.Type == "peer-unavailable" ? $"Room {code} was not found." : e.Message ?? "failed") : null, JoinTimeoutMs);
            if (connected != "ok")
                throw new Exception(connected ?? $"No room {code} answered. Check the code and that the host is still on the start screen or driving.");
            Status?.Invoke($"Joined room {code}.");
            return code;
        }

        static async Task<string> Handshake(Action start, Func<PeerEvent, string> classify, double timeoutMs)
        {
            var tcs = new TaskCompletionSource<string>();
            void OnEvent(PeerEvent e) { var r = classify(e); if (r != null) tcs.TrySetResult(r); }
            PeerBridge.Event += OnEvent;
            try
            {
                start?.Invoke();
                if (double.IsInfinity(timeoutMs)) return await tcs.Task;
                var done = await Task.WhenAny(tcs.Task, Task.Delay(TimeSpan.FromMilliseconds(timeoutMs)));
                return done == tcs.Task ? tcs.Task.Result : null;
            }
            finally { PeerBridge.Event -= OnEvent; }
        }

        void Listen()
        {
            if (listening) return;
            listening = true;
            PeerBridge.Ensure();
            PeerBridge.Event += OnBridgeEvent;
            PeerBridge.Tick += Tick;
        }

        void OnBridgeEvent(PeerEvent e)
        {
            switch (e.Ev)
            {
                case "conn-open":
                    if (IsHost) { if (e.Label == PeerBridge.Ctl) OpenCtl(e.Id); else AcceptGuest(e.Id, e.Metadata?.Str("name"), e.Metadata?.Str("kind"), e.Metadata?.Get("ctl") is bool c && c); }
                    else if (e.Id == hostId) { if (e.Label == PeerBridge.Ctl) OpenCtl(HostKey); else HostConnected(e.Id); }
                    break;
                case "data":
                    if (e.Msg == null) break;
                    if (IsHost) OnHostData(e.Id, e.Msg); else OnGuestData(e.Msg);
                    break;
                case "close":
                    if (IsHost) { if (e.Label == "") DropPeer(e.Id, "left"); else if (Peers.TryGetValue(e.Id, out var p)) p.HasCtl = false; }
                    else if (e.Id == hostId) { DropPeer(HostKey, "left"); ScheduleRejoin(); }
                    break;
                case "path":
                {
                    string key = IsHost ? e.Id : HostKey;
                    if (!Peers.TryGetValue(key, out var peer)) break;
                    var kind = e.Type == "host" ? PathKind.Lan : e.Type == "relay" ? PathKind.Relay : e.Type == null ? PathKind.Unknown : PathKind.Internet;
                    peer.Path = kind;
                    peer.PathDetail = $"{e.Local} → {e.Remote}";
                    PathChanged?.Invoke(key, kind);
                    break;
                }
                case "error":
                    if (Code != null) Error?.Invoke(e.Message ?? e.Type ?? "peer error");
                    break;
            }
        }

        /* ---------------------------------------------------------------- *
         *  Roster                                                           *
         * ---------------------------------------------------------------- */

        /// <summary>
        /// multiplayer.js <c>acceptGuest</c> on the state channel's 'open': roster, slot (a callsign seen in
        /// the last 2 minutes gets its old slot back), hello, current stage, join broadcast.
        /// </summary>
        public void AcceptGuest(string id, string name, string kind, bool ctl = false)
        {
            conns.Add(id);
            name ??= "guest";
            int slot;
            if (rememberedSlots.TryGetValue(name, out var r) && now() - r.at < RememberSlotMs) slot = r.slot;
            else slot = nextSlot++;
            rememberedSlots.Remove(name);
            var peer = GetOrAddPeer(id);
            if (ctl) peer.HasCtl = true;   // a Unity guest announces its ctl channel: hello waits in the queue until it opens
            peer.Name = name; peer.Kind = kind ?? "porsche"; peer.Slot = slot; peer.LastHeard = now();
            PeerJoin?.Invoke(id, name);
            Status?.Invoke($"{name} joined ({conns.Count} in the room).");
            var others = new List<object>();
            foreach (var kv in Peers)
                if (kv.Key != id) others.Add(new Dictionary<string, object> { { "id", kv.Key }, { "name", kv.Value.Name }, { "kind", kv.Value.Kind }, { "slot", (double)kv.Value.Slot } });
            SendCtl(id, new Dictionary<string, object>
            {
                { "t", "hello" }, { "slot", (double)slot }, { "peers", others },
                { "host", new Dictionary<string, object> { { "name", Name }, { "kind", Kind }, { "slot", 0.0 } } },
            });
            if (RouteMessage != null) SendCtl(id, RouteMessage);
            if (Results.Count > 0) SendCtl(id, BoardMessage());
            BroadcastCtl(new Dictionary<string, object> { { "t", "join" }, { "id", id }, { "name", name }, { "kind", kind }, { "slot", (double)slot } }, id);
        }

        /// <summary>The peer's reliable channel is up: from now on roster messages are sequenced and anything queued goes out.</summary>
        public void OpenCtl(string key)
        {
            var peer = GetOrAddPeer(key);
            peer.HasCtl = true;
            peer.LastHeard = now();
            peer.NextHeartbeatAt = now() + HeartbeatMs;
            while (peer.Queued.Count > 0) SendSequenced(key, peer, peer.Queued.Dequeue());
        }

        void HostConnected(string id)
        {
            conns.Add(id);
            var host = GetOrAddPeer(HostKey);
            host.Name ??= "host";
            host.Slot = 0;
            host.LastHeard = now();
            rejoinAt = double.PositiveInfinity;
            RejoinBackoffMs = 0;
            rejoining = false;
        }

        PeerInfo GetOrAddPeer(string key)
        {
            if (!Peers.TryGetValue(key, out var p)) Peers[key] = p = new PeerInfo();
            return p;
        }

        public void DropPeer(string id, string reason = "left")
        {
            if (!conns.Contains(id) && !Peers.ContainsKey(id)) return;
            conns.Remove(id);
            string name = Peers.TryGetValue(id, out var p) ? p.Name : null;
            if (IsHost && p != null && name != null) rememberedSlots[name] = (p.Slot, now());
            Peers.Remove(id);
            PeerLeave?.Invoke(id, reason);
            if (IsHost)
            {
                BroadcastCtl(new Dictionary<string, object> { { "t", "leave" }, { "id", id } }, null);
                Status?.Invoke(reason == "timeout" ? $"{name ?? "A player"} lost (no answer for {TimeoutMs / 1000:0} s)." : $"{name ?? "A player"} left.");
            }
            else Status?.Invoke(reason == "timeout" ? "Lost the host; reconnecting…" : "The host left the room.");
        }

        /* ---------------------------------------------------------------- *
         *  Receiving                                                        *
         * ---------------------------------------------------------------- */

        /// <summary>Common to both sides: heartbeat, ack and sequence handling. True when the message is consumed or a duplicate.</summary>
        bool Reliable(string key, Dictionary<string, object> msg)
        {
            var peer = GetOrAddPeer(key);
            peer.LastHeard = now();
            string t = msg.Str("t");
            if (t == "ack")
            {
                int seq = (int)msg.Num("seq", 0);
                peer.Unacked.RemoveAll(u => u.Seq <= seq);
                return true;
            }
            if (t == "hb") { transport.Send(key == HostKey ? hostId : key, new Dictionary<string, object> { { "t", "hbr" }, { "ts", msg.Num("ts", 0) }, { "at", now() } }, PeerBridge.Ctl); return true; }
            if (t == "hbr") { if (!IsHost) Clock.OnReply(msg.Num("ts", 0), msg.Num("at", 0), now()); return true; }
            if (msg.Get("seq") is double d)
            {
                int seq = (int)d;
                transport.Send(key == HostKey ? hostId : key, new Dictionary<string, object> { { "t", "ack" }, { "seq", (double)seq } }, PeerBridge.Ctl);
                if (seq <= peer.LastSeqIn) return true;   // a retransmit of something already applied
                peer.LastSeqIn = seq;
            }
            return false;
        }

        public void OnHostData(string id, Dictionary<string, object> msg)
        {
            if (Reliable(id, msg)) return;
            string t = msg.Str("t");
            if (t == "s")
            {
                var state = StatePacket.Decode(msg);
                if (Peers.TryGetValue(id, out var peer))
                {
                    peer.Track.Push(state, now());
                    if (!string.IsNullOrEmpty(state.Kind)) peer.Kind = state.Kind;
                }
                State?.Invoke(id, state);
                var relay = new Dictionary<string, object>(msg) { ["from"] = id };
                relay.Remove("seq");
                foreach (var c in conns) if (c != id) transport.Send(c, relay, "");
            }
            else if (t == "route" && msg.Obj("route") != null)
            {
                // A guest picked a new stage: the host drives it too and passes it on (the game calls SendRoute(route, id) after applying it).
                Route?.Invoke(msg.Obj("route"), id);
            }
            else if (t == "result")
            {
                AddResult(new StageResult { Name = msg.Str("name") ?? (Peers.TryGetValue(id, out var p) ? p.Name : id), TimeMs = msg.Num("timeMs", 0), PenaltyMs = msg.Num("penaltyMs", 0) });
                BroadcastCtl(BoardMessage(), null);
            }
        }

        public void OnGuestData(Dictionary<string, object> msg)
        {
            if (Reliable(HostKey, msg)) return;
            switch (msg.Str("t"))
            {
                case "hello":
                {
                    Slot = (int)msg.Num("slot", 0);
                    var host = msg.Obj("host");
                    var h = GetOrAddPeer(HostKey);
                    h.Name = host?.Str("name") ?? "host"; h.Kind = host?.Str("kind") ?? "porsche"; h.Slot = 0;
                    PeerJoin?.Invoke(HostKey, h.Name);
                    var peers = msg.Arr("peers");
                    if (peers != null)
                        foreach (var po in peers)
                            if (po is Dictionary<string, object> p)
                            {
                                Peers[p.Str("id")] = new PeerInfo { Name = p.Str("name"), Kind = p.Str("kind") ?? "porsche", Slot = (int)p.Num("slot", -1) };
                                PeerJoin?.Invoke(p.Str("id"), p.Str("name"));
                            }
                    SlotAssigned?.Invoke(Slot);
                    break;
                }
                case "join":
                    Peers[msg.Str("id")] = new PeerInfo { Name = msg.Str("name"), Kind = msg.Str("kind") ?? "porsche", Slot = (int)msg.Num("slot", -1) };
                    PeerJoin?.Invoke(msg.Str("id"), msg.Str("name"));
                    Status?.Invoke($"{msg.Str("name")} joined.");
                    break;
                case "leave":
                    Peers.Remove(msg.Str("id"));
                    PeerLeave?.Invoke(msg.Str("id"), "left");
                    break;
                case "s":
                {
                    var state = StatePacket.Decode(msg);
                    string id = state.From ?? HostKey;
                    if (!Peers.TryGetValue(id, out var peer))
                        Peers[id] = peer = new PeerInfo { Name = state.Name ?? id, Kind = state.Kind ?? "porsche", Slot = -1 };
                    peer.Track.Push(state, now());
                    if (!string.IsNullOrEmpty(state.Kind)) peer.Kind = state.Kind;
                    State?.Invoke(id, state);
                    break;
                }
                case "route":
                    if (msg.Obj("route") == null) break;
                    Results.Clear(); ResultsChanged?.Invoke();
                    Route?.Invoke(msg.Obj("route"), null);
                    break;
                case "go":
                    Go?.Invoke(Clock.ToLocal(msg.Num("atMs", now())));
                    break;
                case "board":
                {
                    Results.Clear();
                    var rows = msg.Arr("results");
                    if (rows != null)
                        foreach (var ro in rows)
                            if (ro is Dictionary<string, object> r) Results.Add(new StageResult { Name = r.Str("name"), TimeMs = r.Num("timeMs", 0), PenaltyMs = r.Num("penaltyMs", 0) });
                    ResultsChanged?.Invoke();
                    break;
                }
            }
        }

        /* ---------------------------------------------------------------- *
         *  Sending                                                          *
         * ---------------------------------------------------------------- */

        string WireId(string key) => key == HostKey ? hostId : key;

        /// <summary>A roster/control message: sequenced on the ctl channel when the peer has one (queued while it is closed), else plain on the state channel (JS peer).</summary>
        void SendCtl(string key, Dictionary<string, object> msg)
        {
            var peer = GetOrAddPeer(key);
            if (!peer.HasCtl) { transport.Send(WireId(key), msg, ""); return; }
            if (!transport.IsOpen(WireId(key), PeerBridge.Ctl)) { peer.Queued.Enqueue(msg); return; }
            SendSequenced(key, peer, msg);
        }

        void SendSequenced(string key, PeerInfo peer, Dictionary<string, object> msg)
        {
            var copy = new Dictionary<string, object>(msg) { ["seq"] = (double)peer.NextSeq };
            var pending = new PeerInfo.Pending { Seq = peer.NextSeq++, Msg = copy, SentAt = now(), Tries = 1 };
            peer.Unacked.Add(pending);
            if (peer.Unacked.Count > MaxUnacked) peer.Unacked.RemoveAt(0);
            transport.Send(WireId(key), copy, PeerBridge.Ctl);
        }

        void BroadcastCtl(Dictionary<string, object> msg, string exceptId)
        {
            foreach (var id in new List<string>(conns)) if (id != exceptId) SendCtl(id, msg);
        }

        /// <summary>Throttled: call every frame, sends at most every 80 ms on the unreliable channel (multiplayer.js <c>sendState</c>).</summary>
        public bool SendState(StatePacket state, double? nowMs = null)
        {
            double t = nowMs ?? now();
            if (t - lastSent < StateRateMs) return false;
            lastSent = t;
            if (IsHost) { state.From = HostKey; var m = state.Encode(); foreach (var id in conns) transport.Send(id, m, ""); }
            else if (hostId != null) transport.Send(hostId, state.Encode(), "");
            return true;
        }

        /// <summary>
        /// Tell the room which stage to load: <c>{kind, query, seed}</c> where query is the share-link query
        /// string, so a guest rebuilds the identical stage. The host broadcasts (and remembers it for late
        /// joiners), skipping <paramref name="exceptId"/> when relaying a guest's pick; a guest sends it to the host.
        /// </summary>
        public void SendRoute(Dictionary<string, object> route, string exceptId = null)
        {
            var message = new Dictionary<string, object> { { "t", "route" }, { "route", route } };
            if (IsHost) { RouteMessage = message; Results.Clear(); ResultsChanged?.Invoke(); BroadcastCtl(message, exceptId); }
            else if (hostId != null) SendCtl(HostKey, message);
        }

        /// <summary>Host: everyone's countdown ends at <paramref name="atHostMs"/> on the host clock (guests map it through their ClockSync).</summary>
        public void SendGo(double atHostMs)
        {
            if (!IsHost) return;
            BroadcastCtl(new Dictionary<string, object> { { "t", "go" }, { "atMs", atHostMs } }, null);
            Go?.Invoke(atHostMs);
        }

        /// <summary>My finish: the host adds it to the board and broadcasts; a guest sends it to the host.</summary>
        public void SendResult(double timeMs, double penaltyMs)
        {
            if (IsHost) { AddResult(new StageResult { Name = Name, TimeMs = timeMs, PenaltyMs = penaltyMs }); BroadcastCtl(BoardMessage(), null); }
            else SendCtl(HostKey, new Dictionary<string, object> { { "t", "result" }, { "name", Name }, { "timeMs", timeMs }, { "penaltyMs", penaltyMs } });
        }

        void AddResult(StageResult r)
        {
            Results.RemoveAll(x => x.Name == r.Name);
            Results.Add(r);
            Results.Sort((a, b) => a.TotalMs.CompareTo(b.TotalMs));
            ResultsChanged?.Invoke();
        }

        Dictionary<string, object> BoardMessage()
        {
            var rows = new List<object>(Results.Count);
            foreach (var r in Results) rows.Add(new Dictionary<string, object> { { "name", r.Name }, { "timeMs", r.TimeMs }, { "penaltyMs", r.PenaltyMs } });
            return new Dictionary<string, object> { { "t", "board" }, { "results", rows } };
        }

        /// <summary>"1. ELG-42 01:23.456 · 2. REV-17 01:30.002" for the status line.</summary>
        public string Leaderboard()
        {
            if (Results.Count == 0) return "";
            var parts = new string[Results.Count];
            for (int i = 0; i < Results.Count; i++)
            {
                var r = Results[i];
                var t = TimeSpan.FromMilliseconds(r.TotalMs);
                parts[i] = $"{i + 1}. {r.Name} {(int)t.TotalMinutes:00}:{t.Seconds:00}.{t.Milliseconds:000}";
            }
            return string.Join(" · ", parts);
        }

        /* ---------------------------------------------------------------- *
         *  Time: heartbeats, retransmits, timeouts, rejoin                   *
         * ---------------------------------------------------------------- */

        /// <summary>Once per frame (PeerBridge.Tick) or from tests: heartbeat every 1 s, resend unacked after 1 s, drop silent peers after 5 s, rejoin on backoff.</summary>
        public void Tick(double nowMs)
        {
            if (Closed) return;
            foreach (var key in new List<string>(Peers.Keys))
            {
                var peer = Peers[key];
                if (!peer.HasCtl) continue;
                string id = WireId(key);
                if (nowMs >= peer.NextHeartbeatAt)
                {
                    peer.NextHeartbeatAt = nowMs + HeartbeatMs;
                    transport.Send(id, new Dictionary<string, object> { { "t", "hb" }, { "ts", nowMs } }, PeerBridge.Ctl);
                }
                foreach (var u in peer.Unacked)
                    if (nowMs - u.SentAt >= ResendMs) { u.SentAt = nowMs; u.Tries++; transport.Send(id, u.Msg, PeerBridge.Ctl); }
                if (nowMs - peer.LastHeard > TimeoutMs)
                {
                    DropPeer(key, "timeout");
                    if (!IsHost && key == HostKey) ScheduleRejoin();
                }
            }
            if (!IsHost && nowMs >= rejoinAt && !rejoining) _ = Rejoin();
        }

        /// <summary>Guest: come back with backoff 1/2/4/8 … 60 s while the game keeps running (the host keeps the slot).</summary>
        void ScheduleRejoin()
        {
            if (Closed || IsHost || Code == null) return;
            RejoinBackoffMs = RejoinBackoffMs <= 0 ? 1000 : Math.Min(RejoinBackoffMs * 2, RejoinMaxBackoffMs);
            rejoinAt = now() + RejoinBackoffMs;
            Status?.Invoke($"Reconnecting to room {Code} in {RejoinBackoffMs / 1000:0} s…");
        }

        async Task Rejoin()
        {
            rejoining = true;
            rejoinAt = double.PositiveInfinity;
            try { await Join(Code); }
            catch (Exception e)
            {
                RallyLog.Info($"friends: rejoin failed: {e.Message}");
                rejoining = false;
                ScheduleRejoin();
            }
        }

        /// <summary>Guest tests / tooling: pretend the host connection is open under this id (with or without a ctl channel).</summary>
        public void SetHostConnection(string id, bool ctl = false)
        {
            hostId = id;
            HostConnected(id);
            if (ctl) OpenCtl(HostKey);
        }

        public void Close()
        {
            Closed = true;
            if (listening) { PeerBridge.Event -= OnBridgeEvent; PeerBridge.Tick -= Tick; listening = false; }
            foreach (var id in conns) { try { transport.Disconnect(id); } catch { /* already gone */ } }
            conns.Clear();
            Peers.Clear();
            try { transport.Close(); } catch { /* ignore */ }
            Code = null;
        }
    }
}
