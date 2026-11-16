import { logger } from './log.js';

/**
 * Play with friends: peer-to-peer rooms over WebRTC.
 *
 * Browsers cannot link phones over Bluetooth, so "nearby" multiplayer is a
 * direct WebRTC data channel between the players' browsers, brokered by a
 * short room code through the public PeerJS signalling server (only the
 * handshake goes through it; positions flow phone to phone, which also
 * works on one Wi-Fi or a hotspot). The host relays: every guest sends its
 * state to the host, the host fans it out, and the host also tells joiners
 * which stage everyone is driving. Other players appear as named cars.
 */

const log = logger('friends');

export const ROOM_PREFIX = 'nrr-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const STATE_RATE_MS = 80;

export function makeRoomCode(length = 4, random = Math.random) {
  let code = '';
  for (let i = 0; i < length; i++) code += CODE_CHARS[Math.floor(random() * CODE_CHARS.length)];
  return code;
}

export function normaliseCode(text) {
  return String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/0/g, 'O').replace(/1/g, 'I').slice(0, 6);
}

const CALLSIGNS = ['ELG', 'REV', 'ULV', 'ØRN', 'BJØRN', 'RÅDYR', 'GAUPE', 'HARE', 'TIUR', 'MÅKE'];
export function makeCallsign(random = Math.random) {
  return `${CALLSIGNS[Math.floor(random() * CALLSIGNS.length)]}-${10 + Math.floor(random() * 90)}`;
}

/**
 * Starting grid: slot 0 on the line, then pairs side by side every 6 m back
 * (1 right, 2 left, 3 right…), so nobody spawns inside anybody else.
 * Returns the offset in metres: `back` along the road, `side` to the right.
 */
export function spawnOffset(slot) {
  if (!slot || slot < 0) return { back: 0, side: 0 };
  const row = Math.floor((slot + 1) / 2);
  const side = slot % 2 ? 1.7 : -1.7;
  return { back: row * 6, side };
}

/** One paint per grid slot, the same on every screen in the room. */
export const PLAYER_COLORS = [0xd34a31, 0x2f6fd6, 0xf0c020, 0x3aa655, 0xe9e6dc, 0xe2673c, 0x8a4fd6, 0x2bb3b0];
export function paintForSlot(slot) {
  const i = Number.isInteger(slot) && slot >= 0 ? slot : 0;
  return PLAYER_COLORS[i % PLAYER_COLORS.length];
}

/** Compact car state for the wire (about 90 bytes as JSON). */
export function encodeState(car, { name, kind }) {
  return {
    t: 's',
    x: +car.pos.x.toFixed(2),
    y: +car.pos.y.toFixed(2),
    z: +car.pos.z.toFixed(2),
    h: +car.yaw.toFixed(3),
    p: +(car.pitch + car.bodyPitch).toFixed(3),
    r: +(car.roll + car.bodyRoll).toFixed(3),
    v: +car.speed.toFixed(1),
    k: kind,
    n: name,
  };
}

/** Interpolation buffer: renders ~120 ms behind the latest packet, smoothly. */
export class GhostTrack {
  constructor({ delay = 120 } = {}) {
    this.delay = delay;
    this.samples = [];
    this.name = '';
    this.kind = 'porsche';
  }

  push(state, now) {
    this.name = state.n || this.name;
    this.kind = state.k || this.kind;
    this.samples.push({ at: now, ...state });
    if (this.samples.length > 20) this.samples.shift();
  }

  get lastSeen() { return this.samples.length ? this.samples[this.samples.length - 1].at : -Infinity; }

  sample(now) {
    const s = this.samples;
    if (!s.length) return null;
    const t = now - this.delay;
    if (t <= s[0].at) return pose(s[0]);
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i].at <= t) {
        const a = s[i];
        const b = s[i + 1];
        if (!b) return pose(a); // newest packet: hold (a little extrapolation would jitter)
        const u = Math.min(1, (t - a.at) / Math.max(1, b.at - a.at));
        return {
          x: a.x + (b.x - a.x) * u,
          y: a.y + (b.y - a.y) * u,
          z: a.z + (b.z - a.z) * u,
          yaw: lerpAngle(a.h, b.h, u),
          pitch: a.p + (b.p - a.p) * u,
          roll: a.r + (b.r - a.r) * u,
          speed: a.v + (b.v - a.v) * u,
        };
      }
    }
    return pose(s[0]);
  }
}

function pose(s) { return { x: s.x, y: s.y, z: s.z, yaw: s.h, pitch: s.p, roll: s.r, speed: s.v }; }
function lerpAngle(a, b, u) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * u;
}

/**
 * A room. Events: 'status' {text}, 'error' {message}, 'peer-join' {id, name},
 * 'peer-leave' {id}, 'state' {id, state}, 'route' {route}.
 */
export class Session extends EventTarget {
  constructor({ name = makeCallsign(), kind = 'porsche' } = {}) {
    super();
    this.name = name;
    this.kind = kind;
    this.peer = null;
    this.code = null;
    this.isHost = false;
    this.conns = new Map();      // host: guest id → DataConnection; guest: 'host' → conn
    this.peers = new Map();      // id → { name, kind, track }
    this.routeMessage = null;    // host: the current stage, re-sent to joiners
    this.slot = 0;               // my place on the starting grid (host = 0)
    this.nextSlot = 1;
    this.lastSent = 0;
    this.closed = false;
  }

  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }

  async loadPeer() {
    const mod = await import('peerjs');
    return mod.Peer || mod.default?.Peer || mod.default;
  }

  async host() {
    const Peer = await this.loadPeer();
    this.isHost = true;
    for (let attempt = 0; attempt < 4; attempt++) {
      const code = makeRoomCode();
      const ok = await new Promise((resolve) => {
        const peer = new Peer(ROOM_PREFIX + code, { debug: 0 });
        const fail = (err) => { peer.destroy(); resolve(err?.type === 'unavailable-id' ? 'retry' : err?.message || 'failed'); };
        peer.on('open', () => { this.peer = peer; this.code = code; resolve(true); });
        peer.on('error', fail);
      });
      if (ok === true) break;
      if (ok !== 'retry') throw new Error(`Could not open a room: ${ok}`);
    }
    if (!this.peer) throw new Error('Could not find a free room code.');
    this.peer.on('connection', (conn) => this.acceptGuest(conn));
    this.peer.on('error', (err) => this.emit('error', { message: err.message || String(err) }));
    this.peer.on('disconnected', () => { if (!this.closed) this.peer.reconnect(); });
    this.emit('status', { text: `Room ${this.code} open. Friends: JOIN with this code.` });
    return this.code;
  }

  acceptGuest(conn) {
    conn.on('open', () => {
      this.conns.set(conn.peer, conn);
      const name = conn.metadata?.name || 'guest';
      const slot = this.nextSlot++;
      this.peers.set(conn.peer, { name, kind: conn.metadata?.kind || 'porsche', slot, track: new GhostTrack() });
      this.emit('peer-join', { id: conn.peer, name });
      this.emit('status', { text: `${name} joined (${this.conns.size} in the room).` });
      // Tell the newcomer who is here, its grid slot, and what we are driving.
      conn.send({
        t: 'hello',
        slot,
        peers: [...this.peers.entries()].filter(([id]) => id !== conn.peer).map(([id, p]) => ({ id, name: p.name, kind: p.kind, slot: p.slot })),
        host: { name: this.name, kind: this.kind, slot: 0 },
      });
      if (this.routeMessage) conn.send(this.routeMessage);
      this.broadcast({ t: 'join', id: conn.peer, name, kind: conn.metadata?.kind, slot }, conn.peer);
    });
    conn.on('data', (msg) => this.onHostData(conn.peer, msg));
    const drop = () => this.dropPeer(conn.peer);
    conn.on('close', drop);
    conn.on('error', drop);
  }

  onHostData(id, msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 's') {
      const peer = this.peers.get(id);
      if (peer) { peer.track.push(msg, performance.now()); if (msg.k) peer.kind = msg.k; }
      this.emit('state', { id, state: msg });
      this.broadcast({ ...msg, from: id }, id);
    } else if (msg.t === 'route' && msg.route) {
      // A guest picked a new stage: the host drives it too and passes it on
      // (main.js calls sendRoute(route, id) after applying it).
      this.emit('route', { route: msg.route, from: id });
    }
  }

  dropPeer(id) {
    if (!this.conns.has(id) && !this.peers.has(id)) return;
    this.conns.delete(id);
    const name = this.peers.get(id)?.name;
    this.peers.delete(id);
    this.emit('peer-leave', { id });
    if (this.isHost) {
      this.broadcast({ t: 'leave', id });
      this.emit('status', { text: `${name || 'A player'} left.` });
    } else {
      this.emit('status', { text: 'The host left the room.' });
    }
  }

  async join(codeText) {
    const code = normaliseCode(codeText);
    if (code.length < 4) throw new Error('Enter the 4-letter room code.');
    const Peer = await this.loadPeer();
    this.isHost = false;
    this.code = code;
    const peer = new Peer({ debug: 0 });
    this.peer = peer;
    await new Promise((resolve, reject) => {
      peer.on('open', resolve);
      peer.on('error', (err) => reject(new Error(err.message || String(err))));
    });
    const conn = peer.connect(ROOM_PREFIX + code, { reliable: false, serialization: 'json', metadata: { name: this.name, kind: this.kind } });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`No room ${code} answered. Check the code and that the host is still on the start screen or driving.`)), 12000);
      conn.on('open', () => { clearTimeout(timer); resolve(); });
      peer.on('error', (err) => { clearTimeout(timer); reject(new Error(err.type === 'peer-unavailable' ? `Room ${code} was not found.` : err.message)); });
    });
    this.conns.set('host', conn);
    conn.on('data', (msg) => this.onGuestData(msg));
    conn.on('close', () => this.dropPeer('host'));
    this.emit('status', { text: `Joined room ${code}.` });
    return code;
  }

  onGuestData(msg) {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.t) {
      case 'hello':
        this.slot = msg.slot || 0;
        this.peers.set('host', { name: msg.host?.name || 'host', kind: msg.host?.kind || 'porsche', slot: 0, track: new GhostTrack() });
        this.emit('peer-join', { id: 'host', name: msg.host?.name || 'host' });
        for (const p of msg.peers || []) {
          this.peers.set(p.id, { name: p.name, kind: p.kind, slot: p.slot, track: new GhostTrack() });
          this.emit('peer-join', { id: p.id, name: p.name });
        }
        this.emit('slot', { slot: this.slot });
        break;
      case 'join':
        this.peers.set(msg.id, { name: msg.name, kind: msg.kind || 'porsche', slot: msg.slot, track: new GhostTrack() });
        this.emit('peer-join', { id: msg.id, name: msg.name });
        this.emit('status', { text: `${msg.name} joined.` });
        break;
      case 'leave':
        this.peers.delete(msg.id);
        this.emit('peer-leave', { id: msg.id });
        break;
      case 's': {
        const id = msg.from || 'host';
        if (!this.peers.has(id)) this.peers.set(id, { name: msg.n || id, kind: msg.k || 'porsche', slot: null, track: new GhostTrack() });
        this.peers.get(id).track.push(msg, performance.now());
        if (msg.k) this.peers.get(id).kind = msg.k;
        this.emit('state', { id, state: msg });
        break;
      }
      case 'route':
        this.emit('route', { route: msg.route });
        break;
      default:
        break;
    }
  }

  broadcast(msg, exceptId = null) {
    for (const [id, conn] of this.conns) {
      if (id === exceptId) continue;
      try { if (conn.open) conn.send(msg); } catch (error) { log.debug(`send to ${id} failed: ${error.message}`); }
    }
  }

  /** Throttled: call every frame, sends at most every 80 ms. */
  sendState(state, now = performance.now()) {
    if (now - this.lastSent < STATE_RATE_MS) return false;
    this.lastSent = now;
    if (this.isHost) this.broadcast({ ...state, from: 'host' });
    else this.conns.get('host')?.send(state);
    return true;
  }

  /**
   * Tell the room which stage to load. The host broadcasts (and remembers
   * it for late joiners), skipping `exceptId` when relaying a guest's pick;
   * a guest sends it to the host, who applies it and relays it.
   */
  sendRoute(route, exceptId = null) {
    const message = { t: 'route', route };
    if (this.isHost) {
      this.routeMessage = message;
      this.broadcast(message, exceptId);
    } else {
      try { this.conns.get('host')?.send(message); } catch (error) { log.debug(`route to host failed: ${error.message}`); }
    }
  }

  get playerCount() { return this.peers.size + 1; }

  close() {
    this.closed = true;
    for (const conn of this.conns.values()) { try { conn.close(); } catch { /* already gone */ } }
    this.conns.clear();
    this.peers.clear();
    try { this.peer?.destroy(); } catch { /* ignore */ }
    this.peer = null;
    this.code = null;
  }
}
