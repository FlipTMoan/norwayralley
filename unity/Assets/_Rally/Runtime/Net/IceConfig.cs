using System.Collections.Generic;
using Rally.Geo;

namespace Rally.Net
{
    /// <summary>
    /// The ICE servers handed to PeerJS (<c>peer.jslib</c> passes the JSON straight into
    /// <c>new Peer(id, { config })</c>). STUN alone is what the JS game used (PeerJS's defaults) and
    /// works on one Wi-Fi/hotspot and most home NATs; symmetric NATs (many mobile carriers) need a TURN
    /// relay. Open question, not decided here: host a TURN as a small Cloudflare Worker/Calls TURN
    /// service (free tier, credentials minted per session so nothing static ships in the build) or use
    /// Metered's static TURN credentials (simplest, but the credential sits in the page and the free
    /// quota is shared by every player). Fill <see cref="Turn"/> from either and both clients relay.
    /// </summary>
    public static class IceConfig
    {
        public sealed class TurnServer
        {
            public string Urls;        // "turn:turn.example.org:3478" or "turns:…:443?transport=tcp"
            public string Username;
            public string Credential;
        }

        public static readonly string[] StunUrls =
        {
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
        };

        /// <summary>Optional TURN relay; null means STUN only.</summary>
        public static TurnServer Turn;

        /// <summary>The <c>{ iceServers: [...] }</c> JSON peer.jslib expects.</summary>
        public static string ToJson()
        {
            var servers = new List<object>();
            foreach (var url in StunUrls) servers.Add(new Dictionary<string, object> { { "urls", url } });
            if (Turn != null && !string.IsNullOrEmpty(Turn.Urls))
                servers.Add(new Dictionary<string, object> { { "urls", Turn.Urls }, { "username", Turn.Username ?? "" }, { "credential", Turn.Credential ?? "" } });
            return Json.Stringify(new Dictionary<string, object> { { "iceServers", servers } });
        }
    }
}
