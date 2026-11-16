/*
 * PeerJS bridge for the Rally.Net layer: the same rooms as multiplayer.js, so a JS client and a
 * Unity client can share one. Room id = 'nrr-' + 4-letter code on the public PeerJS signalling
 * server; data channels are unreliable + JSON (positions at 80 ms, a lost packet is replaced by
 * the next). Messages are passed as JSON text both ways; the C# Session keeps the wire format
 * ({ t: 'hello' | 'join' | 'leave' | 's' | 'route', … }). ICE servers come in as JSON so a TURN
 * server can be added without touching this file. Events reach Unity via
 * SendMessage('Net', 'OnPeerEvent', json): { ev: 'open'|'error'|'connection'|'conn-open'|'data'|'close'|'disconnected', ... }.
 */
mergeInto(LibraryManager.library, {
  $RallyPeer: {
    ROOM_PREFIX: 'nrr-',
    peer: null,
    conns: {},        // peer id → DataConnection
    pendingHost: null,
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
    wire: function (conn) {
      conn.on('open', function () {
        RallyPeer.conns[conn.peer] = conn;
        RallyPeer.emit({ ev: 'conn-open', id: conn.peer, metadata: conn.metadata || null });
      });
      conn.on('data', function (msg) {
        RallyPeer.emit({ ev: 'data', id: conn.peer, msg: msg });
      });
      var drop = function (err) {
        delete RallyPeer.conns[conn.peer];
        RallyPeer.emit({ ev: 'close', id: conn.peer, message: err ? String(err.message || err) : null });
      };
      conn.on('close', drop);
      conn.on('error', drop);
    },
    destroy: function () {
      Object.keys(RallyPeer.conns).forEach(function (id) { try { RallyPeer.conns[id].close(); } catch (e) {} });
      RallyPeer.conns = {};
      if (RallyPeer.peer) { try { RallyPeer.peer.destroy(); } catch (e) {} }
      RallyPeer.peer = null;
    },
  },

  /** True when the template loaded PeerJS (window.Peer). */
  RallyPeerAvailable: function () { return typeof window.Peer === 'function' ? 1 : 0; },

  /**
   * Host: open a Peer with id 'nrr-' + code. Emits 'open' {id, code} or 'error' {type, message};
   * type 'unavailable-id' means the C# side should try another code (multiplayer.js host()).
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
      RallyPeer.emit({ ev: 'connection', id: conn.peer, metadata: conn.metadata || null });
      RallyPeer.wire(conn);
    });
    peer.on('disconnected', function () {
      RallyPeer.emit({ ev: 'disconnected' });
      if (RallyPeer.peer === peer) { try { peer.reconnect(); } catch (e) {} }
    });
  },

  /**
   * Guest: open an anonymous Peer and connect to the room (reliable: false, serialization: 'json',
   * metadata { name, kind } as multiplayer.js join()). Emits 'open', then 'conn-open' {id: 'nrr-CODE'}
   * once the host accepted, or 'error' (type 'peer-unavailable' = room not found).
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
      var conn = peer.connect(RallyPeer.ROOM_PREFIX + code, { reliable: false, serialization: 'json', metadata: metadata });
      RallyPeer.wire(conn);
    });
    peer.on('error', function (err) { RallyPeer.emit({ ev: 'error', type: err && err.type, message: err && (err.message || String(err)) }); });
    peer.on('disconnected', function () { RallyPeer.emit({ ev: 'disconnected' }); });
  },

  /** Send a JSON message to one peer id (the guest sends to 'nrr-CODE'). Returns 1 when the channel was open. */
  RallyPeerSend__deps: ['$RallyPeer'],
  RallyPeerSend: function (idPtr, jsonPtr) {
    var conn = RallyPeer.conns[UTF8ToString(idPtr)];
    if (!conn || !conn.open) return 0;
    try { conn.send(JSON.parse(UTF8ToString(jsonPtr))); return 1; } catch (e) { return 0; }
  },

  /** Host fan-out: send to every open connection except `exceptId` (empty = none). */
  RallyPeerBroadcast__deps: ['$RallyPeer'],
  RallyPeerBroadcast: function (jsonPtr, exceptPtr) {
    var except = UTF8ToString(exceptPtr);
    var msg;
    try { msg = JSON.parse(UTF8ToString(jsonPtr)); } catch (e) { return; }
    Object.keys(RallyPeer.conns).forEach(function (id) {
      if (id === except) return;
      var conn = RallyPeer.conns[id];
      try { if (conn.open) conn.send(msg); } catch (e) {}
    });
  },

  RallyPeerDisconnect__deps: ['$RallyPeer'],
  RallyPeerDisconnect: function (idPtr) {
    var id = UTF8ToString(idPtr);
    var conn = RallyPeer.conns[id];
    if (conn) { try { conn.close(); } catch (e) {} delete RallyPeer.conns[id]; }
  },

  RallyPeerClose__deps: ['$RallyPeer'],
  RallyPeerClose: function () { RallyPeer.destroy(); },
});
