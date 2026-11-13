/**
 * Small logging + performance layer.
 *
 * Why this exists: the game can feel "frozen" on slower machines while it is
 * actually just spending a very long frame rebuilding terrain or compiling a
 * shader. These helpers make that visible instead of silent:
 *
 *   - levelled console logging with a scope prefix (`?log=debug`)
 *   - a rolling in-memory history you can dump with `__rally.dumpLog()`
 *   - timing spans for async boot steps and synchronous rebuilds
 *   - a frame-time watchdog that reports long frames and low FPS
 *   - an on-screen debug panel (`?debug=1` or F3)
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };
const params = new URLSearchParams(location.search);
const requested = (params.get('log') || '').toLowerCase();
let threshold = LEVELS[requested] ?? LEVELS.info;
const HISTORY_LIMIT = 800;
const history = [];

function now() {
  return (performance.now() / 1000).toFixed(3);
}

function record(level, scope, message) {
  history.push({ t: Number(now()), level, scope, message });
  if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT);
}

function emit(level, scope, args) {
  if (!Array.isArray(args)) args = [args];
  const text = args
    .map((value) => {
      if (value instanceof Error) return `${value.name}: ${value.message}`;
      if (typeof value === 'object' && value !== null) {
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      }
      return String(value);
    })
    .join(' ');
  record(level, scope, text);
  if (LEVELS[level] < threshold) return;
  const method = level === 'debug' ? 'debug' : level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'log';
  // eslint-disable-next-line no-console
  console[method](`[${now()}s][${scope}] ${text}`);
}

export function logger(scope) {
  return {
    debug: (...args) => emit('debug', scope, args),
    info: (...args) => emit('info', scope, args),
    warn: (...args) => emit('warn', scope, args),
    error: (...args) => emit('error', scope, args),
    /** Time a synchronous block, log its duration and return its value. */
    time(label, fn) {
      const t0 = performance.now();
      try {
        return fn();
      } finally {
        const ms = performance.now() - t0;
        emit(ms > 16 ? 'warn' : 'debug', scope, [`${label} took ${ms.toFixed(1)} ms`]);
      }
    },
    /** Time an async block. */
    async timeAsync(label, fn) {
      const t0 = performance.now();
      try {
        return await fn();
      } finally {
        const ms = performance.now() - t0;
        emit(ms > 16 ? 'warn' : 'debug', scope, [`${label} took ${ms.toFixed(1)} ms`]);
      }
    },
  };
}

export function setLogLevel(level) {
  if (LEVELS[level] != null) threshold = LEVELS[level];
}

export function dumpLog() {
  const text = history
    .map((e) => `${e.t.toFixed(3)}s ${e.level.toUpperCase().padEnd(5)} ${e.scope}: ${e.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.log(text);
  return text;
}

export function clearLog() {
  history.length = 0;
}

export function initErrorLogging() {
  window.addEventListener('error', (event) => {
    emit('error', 'window', `${event.message} (${event.filename}:${event.lineno})`);
  });
  window.addEventListener('unhandledrejection', (event) => {
    emit('error', 'promise', event.reason?.stack || event.reason || 'unhandled rejection');
  });
}

/**
 * Frame-time monitor with a light-touch watchdog. It samples every 500 ms and
 * raises `onLowFps` once, so the caller can drop resolution/shadows instead of
 * letting a weak GPU crawl to a halt. `sample()` is cheap; call it once a frame.
 */
export class PerfMonitor {
  constructor({ onLowFps = null, lowFps = 24, windowMs = 2500 } = {}) {
    this.onLowFps = onLowFps;
    this.lowFps = lowFps;
    this.windowMs = windowMs;
    this.frames = 0;
    this.windowStart = performance.now();
    this.fps = 0;
    this.frameMs = 0;
    this.worstMs = 0;
    this.longFrames = 0;
    this.lastFrame = performance.now();
    this.samples = 0;
    this.dropped = false;
    this.badWindows = 0;
    this.log = logger('perf');
  }

  begin(now) {
    const ms = now - this.lastFrame;
    this.lastFrame = now;
    this.frameMs = this.frameMs ? this.frameMs * 0.9 + ms * 0.1 : ms;
    if (ms > this.worstMs) this.worstMs = ms;
    if (ms > 60) {
      this.longFrames++;
      if (ms > 250) this.log.warn(`long frame ${ms.toFixed(0)} ms`);
    }
  }

  sample(now) {
    this.frames++;
    const elapsed = now - this.windowStart;
    if (elapsed < 500) return;
    const fps = (this.frames * 1000) / elapsed;
    this.fps = fps;
    this.frames = 0;
    this.windowStart = now;
    this.samples++;
    // A single long frame (terrain rebuild, shader compile) must not be
    // mistaken for a slow machine; require three consecutive bad windows.
    if (fps < this.lowFps) this.badWindows++;
    else this.badWindows = 0;
    if (!this.dropped && now > 8000 && this.badWindows >= 3) {
      this.dropped = true;
      this.log.warn(`low frame rate: ${fps.toFixed(1)} fps for ${(this.badWindows * 0.5).toFixed(1)} s — lowering quality`);
      this.onLowFps?.(fps);
    }
  }
}
