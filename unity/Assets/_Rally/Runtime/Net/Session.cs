using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Rally.Core;
using Rally.Geo;

namespace Rally.Net
{
    /// <summary>Another player in the room.</summary>
    public sealed class PeerInfo
    {
        public string Name;
        public string Kind = "porsche";
        /// <summary>Grid slot; -1 when unknown (a state packet arrived before the roster).</summary>
        public int Slot = -1;
        public readonly GhostTrack Track = new GhostTrack();
    }

    /// <summary>
    /// A room (port of multiplayer.js <c>Session</c>). Browsers cannot link phones over Bluetooth, so
    /// "nearby" multiplayer is a WebRTC data channel between the players' browsers, brokered by a short
    /// room code through the public PeerJS signalling server (only the handshake goes through it). The
    /// host relays: every guest sends its state to the host, the host fans it out, and the host also
    /// tells joiners which stage everyone is driving. Messages are the JS wire format exactly:
    /// <c>hello</c> {slot, peers, host}, <c>join</c> {id, name, kind, slot}, <c>leave</c> {id},
    /// <c>s</c> (car state, host adds <c>from</c>), <c>route</c> {route}. Transport and clock are
    /// injectable so the relay logic runs in EditMode tests without a network.
    /// </summary>
    public sealed class Session
    {
        public const double StateRateMs = 80;
        const double JoinTimeoutMs = 12000;

        public string Name;
        public string Kind;
        public string Code { get; private set; }
        public bool IsHost { get; set; }
        /// <summary>My place on the starting grid (host = 0).</summary>
        public int Slot { get; private set; }
        public readonly Dictionary<string, PeerInfo> Peers = new Dictionary<string, PeerInfo>();
        /// <summary>Host: the current stage message, re-sent to late joiners.</summary>
        public Dictionary<string, object> RouteMessage { get; private set; }
        public bool Closed { get; private set; }
        public int PlayerCount => Peers.Count + 1;

        public event Action<string> Status;
        public event Action<string> Error;
        public event Action<string, string> PeerJoin;      // id, name
        public event Action<string> PeerLeave;             // id
        public event Action<string, StatePacket> State;       // id, state
        public event Action<Dictionary<string, object>, string> Route;  // route, from (null on a guest)
        public event Action<int> SlotAssigned;

        readonly IPeerTransport transport;
        readonly Func<double> now;
        readonly HashSet<string> conns = new HashSet<string>();  // host: open guest ids; guest: the host id
        string hostId;                                            // guest: 'nrr-CODE'
        int nextSlot = 1;
        double lastSent = double.NegativeInfinity;
        bool listening;

        public Session(string name = null, string kind = "porsche", IPeerTransport transport = null, Func<double> nowMs = null)
        {
            Name = name ?? RoomCodes.MakeCallsign();
            Kind = kind;
            this.transport = transport ?? new JslibTransport();
            now = nowMs ?? (() => UnityEngine.Time.realtimeSinceStartupAsDouble * 1000);
        }

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

        /// <summary>multiplayer.js <c>join()</c>.</summary>
        public async Task<string> Join(string codeText)
        {
            string code = RoomCodes.NormaliseCode(codeText);
            if (code.Length < 4) throw new Exception("Enter the 4-letter room code.");
            IsHost = false;
            Code = code;
            hostId = RoomCodes.RoomPrefix + code;
            Listen();
            var opened = await Handshake(() => PeerBridge.Join(code, Name, Kind), e =>
                e.Ev == "open" ? "ok" : e.Ev == "error" ? e.Message ?? "failed" : null, double.PositiveInfinity);
            if (opened != "ok") throw new Exception(opened);
            var connected = await Handshake(null, e =>
                e.Ev == "conn-open" && e.Id == hostId ? "ok"
                : e.Ev == "error" ? (e.Type == "peer-unavailable" ? $"Room {code} was not found." : e.Message ?? "failed") : null, JoinTimeoutMs);
            if (connected != "ok")
                throw new Exception(connected ?? $"No room {code} answered. Check the code and that the host is still on the start screen or driving.");
            conns.Add(hostId);
            Status?.Invoke($"Joined room {code}.");
            return code;
        }

        /// <summary>Run <paramref name="start"/> and wait for the first bridge event <paramref name="classify"/> accepts; null after the timeout.</summary>
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
        }

        void OnBridgeEvent(PeerEvent e)
        {
            switch (e.Ev)
            {
                case "conn-open":
                    if (IsHost) AcceptGuest(e.Id, e.Metadata?.Str("name"), e.Metadata?.Str("kind"));
                    break;
                case "data":
                    if (e.Msg == null) break;
                    if (IsHost) OnHostData(e.Id, e.Msg); else OnGuestData(e.Msg);
                    break;
                case "close":
                    DropPeer(IsHost ? e.Id : "host");
                    break;
                case "error":
                    if (Code != null) Error?.Invoke(e.Message ?? e.Type ?? "peer error");
                    break;
            }
        }

        /* ---------------------------------------------------------------- *
         *  Host side (pure, testable)                                       *
         * ---------------------------------------------------------------- */

        /// <summary>multiplayer.js <c>acceptGuest</c> on the connection's 'open': roster, slot, hello, current stage, join broadcast.</summary>
        public void AcceptGuest(string id, string name, string kind)
        {
            conns.Add(id);
            name ??= "guest";
            int slot = nextSlot++;
            Peers[id] = new PeerInfo { Name = name, Kind = kind ?? "porsche", Slot = slot };
            PeerJoin?.Invoke(id, name);
            Status?.Invoke($"{name} joined ({conns.Count} in the room).");
            var others = new List<object>();
            foreach (var kv in Peers)
                if (kv.Key != id) others.Add(new Dictionary<string, object> { { "id", kv.Key }, { "name", kv.Value.Name }, { "kind", kv.Value.Kind }, { "slot", (double)kv.Value.Slot } });
            transport.Send(id, new Dictionary<string, object>
            {
                { "t", "hello" }, { "slot", (double)slot }, { "peers", others },
                { "host", new Dictionary<string, object> { { "name", Name }, { "kind", Kind }, { "slot", 0.0 } } },
            });
            if (RouteMessage != null) transport.Send(id, RouteMessage);
            Broadcast(new Dictionary<string, object> { { "t", "join" }, { "id", id }, { "name", name }, { "kind", kind }, { "slot", (double)slot } }, id);
        }

        public void OnHostData(string id, Dictionary<string, object> msg)
        {
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
                Broadcast(relay, id);
            }
            else if (t == "route" && msg.Obj("route") != null)
            {
                // A guest picked a new stage: the host drives it too and passes it on (the game calls SendRoute(route, id) after applying it).
                Route?.Invoke(msg.Obj("route"), id);
            }
        }

        public void DropPeer(string id)
        {
            if (!conns.Contains(id) && !Peers.ContainsKey(id)) return;
            conns.Remove(id);
            string name = Peers.TryGetValue(id, out var p) ? p.Name : null;
            Peers.Remove(id);
            PeerLeave?.Invoke(id);
            if (IsHost)
            {
                Broadcast(new Dictionary<string, object> { { "t", "leave" }, { "id", id } }, null);
                Status?.Invoke($"{name ?? "A player"} left.");
            }
            else Status?.Invoke("The host left the room.");
        }

        /* ---------------------------------------------------------------- *
         *  Guest side                                                       *
         * ---------------------------------------------------------------- */

        public void OnGuestData(Dictionary<string, object> msg)
        {
            switch (msg.Str("t"))
            {
                case "hello":
                {
                    Slot = (int)msg.Num("slot", 0);
                    var host = msg.Obj("host");
                    Peers["host"] = new PeerInfo { Name = host?.Str("name") ?? "host", Kind = host?.Str("kind") ?? "porsche", Slot = 0 };
                    PeerJoin?.Invoke("host", Peers["host"].Name);
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
                    PeerLeave?.Invoke(msg.Str("id"));
                    break;
                case "s":
                {
                    var state = StatePacket.Decode(msg);
                    string id = state.From ?? "host";
                    if (!Peers.TryGetValue(id, out var peer))
                        Peers[id] = peer = new PeerInfo { Name = state.Name ?? id, Kind = state.Kind ?? "porsche", Slot = -1 };
                    peer.Track.Push(state, now());
                    if (!string.IsNullOrEmpty(state.Kind)) peer.Kind = state.Kind;
                    State?.Invoke(id, state);
                    break;
                }
                case "route":
                    if (msg.Obj("route") != null) Route?.Invoke(msg.Obj("route"), null);
                    break;
            }
        }

        /* ---------------------------------------------------------------- *
         *  Sending                                                          *
         * ---------------------------------------------------------------- */

        public void Broadcast(Dictionary<string, object> msg, string exceptId)
        {
            foreach (var id in conns)
            {
                if (id == exceptId) continue;
                try { transport.Send(id, msg); }
                catch (Exception e) { RallyLog.Info($"send to {id} failed: {e.Message}"); }
            }
        }

        /// <summary>Throttled: call every frame, sends at most every 80 ms (multiplayer.js <c>sendState</c>).</summary>
        public bool SendState(StatePacket state, double? nowMs = null)
        {
            double t = nowMs ?? now();
            if (t - lastSent < StateRateMs) return false;
            lastSent = t;
            if (IsHost) { state.From = "host"; Broadcast(state.Encode(), null); }
            else if (hostId != null) transport.Send(hostId, state.Encode());
            return true;
        }

        /// <summary>
        /// Tell the room which stage to load. The host broadcasts (and remembers it for late joiners),
        /// skipping <paramref name="exceptId"/> when relaying a guest's pick; a guest sends it to the host.
        /// </summary>
        public void SendRoute(Dictionary<string, object> route, string exceptId = null)
        {
            var message = new Dictionary<string, object> { { "t", "route" }, { "route", route } };
            if (IsHost) { RouteMessage = message; Broadcast(message, exceptId); }
            else if (hostId != null)
            {
                try { transport.Send(hostId, message); }
                catch (Exception e) { RallyLog.Info($"route to host failed: {e.Message}"); }
            }
        }

        /// <summary>Guest tests / tooling: pretend the host connection is open under this id.</summary>
        public void SetHostConnection(string id) { hostId = id; conns.Add(id); }

        public void Close()
        {
            Closed = true;
            if (listening) { PeerBridge.Event -= OnBridgeEvent; listening = false; }
            foreach (var id in conns) { try { transport.Disconnect(id); } catch { /* already gone */ } }
            conns.Clear();
            Peers.Clear();
            try { transport.Close(); } catch { /* ignore */ }
            Code = null;
        }
    }
}
