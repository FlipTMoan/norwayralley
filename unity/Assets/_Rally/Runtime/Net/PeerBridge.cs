using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using Rally.Core;
using Rally.Geo;
using UnityEngine;

namespace Rally.Net
{
    /// <summary>One event from peer.jslib: <c>{ ev, id?, code?, host?, type?, message?, metadata?, msg? }</c>.</summary>
    public sealed class PeerEvent
    {
        public string Ev;              // open | error | connection | conn-open | data | close | disconnected
        public string Id;              // peer id ('nrr-CODE' for a host seen from a guest)
        public string Code;
        public bool Host;
        public string Type;            // PeerJS error type: unavailable-id, peer-unavailable, …
        public string Message;
        public Dictionary<string, object> Metadata;
        public Dictionary<string, object> Msg;
    }

    /// <summary>
    /// The C# side of <c>Plugins/WebGL/peer.jslib</c>: DllImport wrappers plus the MonoBehaviour named
    /// "Net" that the jslib targets with <c>SendMessage('Net', 'OnPeerEvent', json)</c>. Outside the web
    /// build every call is a no-op that logs once, so the editor runs single-player without a stub server.
    /// </summary>
    public sealed class PeerBridge : MonoBehaviour
    {
        public const string GameObjectName = "Net";
        public static event Action<PeerEvent> Event;

#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] static extern int RallyPeerAvailable();
        [DllImport("__Internal")] static extern void RallyPeerHost(string code, string iceJson);
        [DllImport("__Internal")] static extern void RallyPeerJoin(string code, string metadataJson, string iceJson);
        [DllImport("__Internal")] static extern int RallyPeerSend(string id, string json);
        [DllImport("__Internal")] static extern void RallyPeerBroadcast(string json, string exceptId);
        [DllImport("__Internal")] static extern void RallyPeerDisconnect(string id);
        [DllImport("__Internal")] static extern void RallyPeerClose();
        public static bool Available => RallyPeerAvailable() != 0;
#else
        static bool warned;
        static void Warn() { if (!warned) { warned = true; RallyLog.Info("friends: PeerJS rooms only work in the web build; no-op here"); } }
        static void RallyPeerHost(string code, string iceJson) => Warn();
        static void RallyPeerJoin(string code, string metadataJson, string iceJson) => Warn();
        static int RallyPeerSend(string id, string json) { Warn(); return 0; }
        static void RallyPeerBroadcast(string json, string exceptId) => Warn();
        static void RallyPeerDisconnect(string id) => Warn();
        static void RallyPeerClose() => Warn();
        public static bool Available => false;
#endif

        /// <summary>Create the "Net" receiver once (the jslib finds it by name).</summary>
        public static PeerBridge Ensure()
        {
            var existing = GameObject.Find(GameObjectName);
            if (existing != null && existing.TryGetComponent<PeerBridge>(out var bridge)) return bridge;
            var go = existing != null ? existing : new GameObject(GameObjectName);
            DontDestroyOnLoad(go);
            return go.AddComponent<PeerBridge>();
        }

        public static void Host(string code) => RallyPeerHost(code, IceConfig.ToJson());
        public static void Join(string code, string name, string kind)
            => RallyPeerJoin(code, Json.Stringify(new Dictionary<string, object> { { "name", name }, { "kind", kind } }), IceConfig.ToJson());
        public static bool Send(string id, Dictionary<string, object> msg) => RallyPeerSend(id, Json.Stringify(msg)) != 0;
        public static void Broadcast(Dictionary<string, object> msg, string exceptId) => RallyPeerBroadcast(Json.Stringify(msg), exceptId ?? "");
        public static void Disconnect(string id) => RallyPeerDisconnect(id);
        public static void Close() => RallyPeerClose();

        /// <summary>Called by the jslib through SendMessage; the JSON is parsed here and dispatched as a typed event.</summary>
        public void OnPeerEvent(string json)
        {
            PeerEvent e;
            try
            {
                var o = Json.ParseObject(json);
                e = new PeerEvent
                {
                    Ev = o.Str("ev"), Id = o.Str("id"), Code = o.Str("code"), Host = o.Get("host") is bool b && b,
                    Type = o.Str("type"), Message = o.Str("message"), Metadata = o.Obj("metadata"), Msg = o.Obj("msg"),
                };
            }
            catch (Exception ex)
            {
                RallyLog.Warn($"friends: bad peer event ({ex.Message}): {json}");
                return;
            }
            Event?.Invoke(e);
        }
    }

    /// <summary>What <see cref="Session"/> needs from the wire, so tests can drive it with a fake.</summary>
    public interface IPeerTransport
    {
        bool Send(string id, Dictionary<string, object> msg);
        void Broadcast(Dictionary<string, object> msg, string exceptId);
        void Disconnect(string id);
        void Close();
    }

    public sealed class JslibTransport : IPeerTransport
    {
        public bool Send(string id, Dictionary<string, object> msg) => PeerBridge.Send(id, msg);
        public void Broadcast(Dictionary<string, object> msg, string exceptId) => PeerBridge.Broadcast(msg, exceptId);
        public void Disconnect(string id) => PeerBridge.Disconnect(id);
        public void Close() => PeerBridge.Close();
    }
}
