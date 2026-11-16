/*
 * PeerJS bridge for the Rally.Net layer: the same rooms as multiplayer.js, so a JS client and a
 * Unity client can share one. Room id = 'nrr-' + 4-letter code on the public PeerJS signalling
 * server (signalling needs the internet; the data path itself is a direct WebRTC channel, which on
 * one LAN uses host candidates and never leaves the network — see RallyPeer.path). Two channels per
 * peer: the PeerJS default (unreliable, unordered, JSON) for the 80 ms state packets, exactly the JS
 * channel, and 'ctl' (reliable, ordered) for roster, routes, challenges and results; a JS client
 * only opens the first. Messages pass as JSON text; the C# Session keeps the wire format.
 * ICE servers come in as JSON so a TURN server can be added without touching this file. Events reach
 * Unity via SendMessage('Net', 'OnPeerEvent', json):
 *   { ev: 'open'|'error'|'connection'|'conn-open'|'data'|'close'|'disconnected'|'path', id, label, ... }.
 */
mergeInto(LibraryManager.library, {
  $RallyPeer: {
    ROOM_PREFIX: 'nrr-',
    CTL: 'ctl',
    peer: null,
    conns: {},        // peer id → { state: DataConnection, ctl: DataConnection }
    timers: {},       // peer id → path stats interval
    lastPath: {},     // peer id → last reported candidate type
    emit: function (payload) {
      try { SendMessage('Net', 'OnPeerEvent', JSON.stringify(payload)); }
      catch (e) { console.warn('peer event lost', e); }
    },
    config: function (iceJson) {
      var cfg = { debug: 0 };
      try {
        var ice = JSON.parse(iceJson || 'null');
        if (ice && ice.iceServers) cfg.config = ice;
      } catch (e) { /* default STUN */ }
      return cfg;
    },
    slot: function (id) {
      return RallyPeer.conns[id] || (RallyPeer.conns[id] = { state: null, ctl: null });
    },
    labelOf: function (conn) { return conn.label === RallyPeer.CTL ? RallyPeer.CTL : ''; },
    wire: function (conn) {
      var label = RallyPeer.labelOf(conn);
      conn.on('open', function () {
        var s = RallyPeer.slot(conn.peer);
        if (label) s.ctl = conn; else s.state = conn;
        RallyPeer.emit({ ev: 'conn-open', id: conn.peer, label: label, metadata: conn.metadata || null });
        if (!label) RallyPeer.watchPath(conn);
      });
      conn.on('data', function (msg) {
        RallyPeer.emit({ ev: 'data', id: conn.peer, label: label, msg: msg });
      });
      var drop = function (err) {
        var s = RallyPeer.conns[conn.peer];
        if (s) {
          if (label) { if (s.ctl === conn) s.ctl = null; } else if (s.state === conn) s.state = null;
          if (!s.state && !s.ctl) { delete RallyPeer.conns[conn.peer]; RallyPeer.unwatch(conn.peer); }
        }
        RallyPeer.emit({ ev: 'close', id: conn.peer, label: label, message: err ? String(err.message || err) : null });
      };
      conn.on('close', drop);
      conn.on('error', drop);
    },
    /**
     * The selected ICE candidate pair: 'host' = both on one LAN (or the same machine), 'srflx'/'prflx' =
     * through the NAT over the internet, 'relay' = via TURN. Reported once the channel is open and every
     * 5 s while it changes (ICE can switch pairs). Browsers that hide addresses (mDNS .local candidates)
     * still report the type; a router with client isolation blocks host candidates, so the pair falls
     * back to srflx even on one Wi-Fi.
     */
    watchPath: function (conn) {
      RallyPeer.unwatch(conn.peer);
      var report = function () {
        var pc = conn.peerConnection;
        if (!pc || !pc.getStats || !conn.open) return;
        pc.getStats().then(function (stats) {
          var pairs = {}, cands = {}, selectedId = null;
          stats.forEach(function (r) {
            if (r.type === 'candidate-pair') pairs[r.id] = r;
            else if (r.type === 'local-candidate' || r.type === 'remote-candidate') cands[r.id] = r;
            else if (r.type === 'transport' && r.selectedCandidatePairId) selectedId = r.selectedCandidatePairId;
          });
          var pair = selectedId ? pairs[selectedId] : null;
          if (!pair) Object.keys(pairs).forEach(function (k) { var p = pairs[k]; if (!pair && p.state === 'succeeded' && (p.selected || p.nominated)) pair = p; });
          if (!pair) return;
          var local = cands[pair.localCandidateId] || {}, remote = cands[pair.remoteCandidateId] || {};
          var type = local.candidateType === 'relay' || remote.candidateType === 'relay' ? 'relay'
            : local.candidateType === 'host' && remote.candidateType === 'host' ? 'host'
            : (local.candidateType || remote.candidateType || 'unknown');
          var key = type + '|' + (local.address || local.ip || '') + '|' + (remote.address || remote.ip || '');
          if (RallyPeer.lastPath[conn.peer] === key) return;
          RallyPeer.lastPath[conn.peer] = key;
          RallyPeer.emit({ ev: 'path', id: conn.peer, type: type,
            local: (local.address || local.ip || '?') + ':' + (local.port || '?'),
            remote: (remote.address || remote.ip || '?') + ':' + (remote.port || '?') });
        }).catch(function () {});
      };
      report();
      RallyPeer.timers[conn.peer] = setInterval(report, 5000);
    },
    unwatch: function (id) {
      if (RallyPeer.timers[id]) { clearInterval(RallyPeer.timers[id]); delete RallyPeer.timers[id]; }
      delete RallyPeer.lastPath[id];
    },
    destroy: function () {
      Object.keys(RallyPeer.conns).forEach(function (id) {
        var s = RallyPeer.conns[id];
        try { if (s.state) s.state.close(); } catch (e) {}
        try { if (s.ctl) s.ctl.close(); } catch (e) {}
        RallyPeer.unwatch(id);
      });
      RallyPeer.conns = {};
      if (RallyPeer.peer) { try { RallyPeer.peer.destroy(); } catch (e) {} }
      RallyPeer.peer = null;
    },
    send: function (conn, json) {
      if (!conn || !conn.open) return 0;
      try { conn.send(JSON.parse(json)); return 1; } catch (e) { return 0; }
    },
  },

  /** True when the template loaded PeerJS (window.Peer). */
  RallyPeerAvailable: function () { return typeof window.Peer === 'function' ? 1 : 0; },

  /**
   * Host: open a Peer with id 'nrr-' + code. Emits 'open' {id, code} or 'error' {type, message};
   * type 'unavailable-id' means the C# side should try another code (multiplayer.js host()).
   * A lost signalling connection is re-established with peer.reconnect(); open data channels survive it.
   */
  RallyPeerHost__deps: ['$RallyPeer'],
  RallyPeerHost: function (codePtr, icePtr) {
    var code = UTF8ToString(codePtr);
    var ice = UTF8ToString(icePtr);
    RallyPeer.destroy();
    var peer = new window.Peer(RallyPeer.ROOM_PREFIX + code, RallyPeer.config(ice));
    RallyPeer.peer = peer;
    peer.on('open', function (id) { RallyPeer.emit({ ev: 'open', id: id, code: code, host: true }); });
    peer.on('error', function (err) { RallyPeer.emit({ ev: 'error', type: err && err.type, message: err && (err.message || String(err)) }); });
    peer.on('connection', function (conn) {
      RallyPeer.emit({ ev: 'connection', id: conn.peer, label: RallyPeer.labelOf(conn), metadata: conn.metadata || null });
      RallyPeer.wire(conn);
    });
    peer.on('disconnected', function () {
      RallyPeer.emit({ ev: 'disconnected' });
      if (RallyPeer.peer === peer) { try { peer.reconnect(); } catch (e) {} }
    });
  },

  /**
   * Guest: open an anonymous Peer and connect to the room twice — the state channel (reliable: false,
   * serialization: 'json', metadata { name, kind }, as multiplayer.js join()) and the 'ctl' channel
   * (reliable: true). Emits 'open', then 'conn-open' {id: 'nrr-CODE', label} per channel once the host
   * accepted, or 'error' (type 'peer-unavailable' = room not found). Called again to rejoin.
   */
  RallyPeerJoin__deps: ['$RallyPeer'],
  RallyPeerJoin: function (codePtr, metadataPtr, icePtr) {
    var code = UTF8ToString(codePtr);
    var metadata = {};
    try { metadata = JSON.parse(UTF8ToString(metadataPtr) || '{}'); } catch (e) {}
    RallyPeer.destroy();
    var peer = new window.Peer(RallyPeer.config(UTF8ToString(icePtr)));
    RallyPeer.peer = peer;
    peer.on('open', function (id) {
      RallyPeer.emit({ ev: 'open', id: id, code: code, host: false });
      var hostId = RallyPeer.ROOM_PREFIX + code;
      RallyPeer.wire(peer.connect(hostId, { reliable: false, serialization: 'json', metadata: metadata }));
      RallyPeer.wire(peer.connect(hostId, { label: RallyPeer.CTL, reliable: true, serialization: 'json', metadata: metadata }));
    });
    peer.on('error', function (err) { RallyPeer.emit({ ev: 'error', type: err && err.type, message: err && (err.message || String(err)) }); });
    peer.on('disconnected', function () {
      RallyPeer.emit({ ev: 'disconnected' });
      if (RallyPeer.peer === peer) { try { peer.reconnect(); } catch (e) {} }
    });
  },

  /** Send a JSON message to one peer id on the channel `label` ('' = state, 'ctl'). Returns 1 when it was open. */
  RallyPeerSend__deps: ['$RallyPeer'],
  RallyPeerSend: function (idPtr, jsonPtr, labelPtr) {
    var s = RallyPeer.conns[UTF8ToString(idPtr)];
    if (!s) return 0;
    var label = UTF8ToString(labelPtr);
    return RallyPeer.send(label === RallyPeer.CTL ? s.ctl : s.state, UTF8ToString(jsonPtr));
  },

  /** Is the channel `label` to this peer open right now? */
  RallyPeerIsOpen__deps: ['$RallyPeer'],
  RallyPeerIsOpen: function (idPtr, labelPtr) {
    var s = RallyPeer.conns[UTF8ToString(idPtr)];
    if (!s) return 0;
    var c = UTF8ToString(labelPtr) === RallyPeer.CTL ? s.ctl : s.state;
    return c && c.open ? 1 : 0;
  },

  /** Host fan-out on one channel: every open connection except `exceptId` (empty = none). */
  RallyPeerBroadcast__deps: ['$RallyPeer'],
  RallyPeerBroadcast: function (jsonPtr, exceptPtr, labelPtr) {
    var except = UTF8ToString(exceptPtr), json = UTF8ToString(jsonPtr), ctl = UTF8ToString(labelPtr) === RallyPeer.CTL;
    Object.keys(RallyPeer.conns).forEach(function (id) {
      if (id === except) return;
      var s = RallyPeer.conns[id];
      RallyPeer.send(ctl ? s.ctl : s.state, json);
    });
  },

  RallyPeerDisconnect__deps: ['$RallyPeer'],
  RallyPeerDisconnect: function (idPtr) {
    var id = UTF8ToString(idPtr);
    var s = RallyPeer.conns[id];
    if (s) { try { if (s.state) s.state.close(); } catch (e) {} try { if (s.ctl) s.ctl.close(); } catch (e) {} delete RallyPeer.conns[id]; RallyPeer.unwatch(id); }
  },

  RallyPeerClose__deps: ['$RallyPeer'],
  RallyPeerClose: function () { RallyPeer.destroy(); },
});
