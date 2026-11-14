/**
 * A tiny synthesized rally soundtrack: engine, wind, gravel rumble and tyre
 * squeal. No audio files, no licence headaches, and it starts only after a
 * user gesture (browser autoplay rules).
 */
export class RallyAudio {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.muted = false;
    this.started = false;
  }

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    const ctx = this.ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(ctx.destination);

    // Engine: two detuned saws through a soft low-pass.
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 900;
    this.engineFilter.Q.value = 1.4;
    this.engineGain.connect(this.engineFilter).connect(this.master);

    this.osc1 = ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.value = 60;
    this.osc2 = ctx.createOscillator();
    this.osc2.type = 'square';
    this.osc2.frequency.value = 30;
    const o2g = ctx.createGain();
    o2g.gain.value = 0.35;
    this.osc1.connect(this.engineGain);
    this.osc2.connect(o2g).connect(this.engineGain);
    this.osc1.start();
    this.osc2.start();

    // White noise source reused for wind, gravel and skids.
    const seconds = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.72 + white * 0.28;
      data[i] = last;
    }
    this.noiseBuffer = buffer;

    const makeNoise = (type, freq, q, gainValue) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = freq;
      filter.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = gainValue;
      src.connect(filter).connect(gain).connect(this.master);
      src.start();
      return { src, filter, gain };
    };

    this.wind = makeNoise('bandpass', 900, 0.6, 0);
    this.gravel = makeNoise('lowpass', 340, 1.2, 0);
    this.skid = makeNoise('bandpass', 1500, 3.5, 0);
    this.wade = makeNoise('lowpass', 420, 0.9, 0);

    this.ready = true;
  }

  async start() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.started = true;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.55, this.ctx.currentTime, 0.05);
    }
  }

  update(state) {
    if (!this.ready || !this.started) return;
    const t = this.ctx.currentTime;
    const speed = state.speed || 0;
    const throttle = state.throttle || 0;
    const onRoad = state.onRoad;
    const drifting = state.drifting;
    const running = state.running;

    // Fake gearbox, so the little engine has some personality.
    const gearSpan = 13;
    const gear = Math.min(5, Math.floor(speed / gearSpan));
    const inGear = (speed - gear * gearSpan) / gearSpan;
    const rpm = running ? 0.22 + inGear * 0.72 + throttle * 0.18 : 0;
    const freq = 42 + gear * 7 + rpm * 92;
    this.osc1.frequency.setTargetAtTime(freq, t, 0.035);
    this.osc2.frequency.setTargetAtTime(freq * 0.5, t, 0.035);
    this.engineFilter.frequency.setTargetAtTime(500 + throttle * 900 + speed * 12, t, 0.06);
    this.engineGain.gain.setTargetAtTime(running ? 0.10 + throttle * 0.12 + speed * 0.0015 : 0, t, 0.08);

    this.wind.gain.gain.setTargetAtTime(Math.min(0.14, speed * 0.0028), t, 0.12);
    this.wind.filter.frequency.setTargetAtTime(700 + speed * 22, t, 0.15);
    this.gravel.gain.gain.setTargetAtTime(running && !onRoad ? Math.min(0.11, speed * 0.0032) : 0, t, 0.09);
    this.skid.gain.gain.setTargetAtTime(running && drifting ? Math.min(0.10, speed * 0.0025) : 0, t, 0.05);
    const depth = state.waterDepth || 0;
    this.wade.gain.gain.setTargetAtTime(depth > 0 ? Math.min(0.16, speed * 0.006 * Math.min(1, depth / 0.4)) : 0, t, 0.08);
  }

  /** One splash: a bright slap, then a low whoomph that darkens as it decays. */
  splash(strength = 1) {
    if (!this.ready || !this.started) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const burst = (type, from, to, peak, length) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.setValueAtTime(from, t);
      filter.frequency.exponentialRampToValueAtTime(to, t + length);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      src.connect(filter).connect(gain).connect(this.master);
      src.start(t);
      src.stop(t + length + 0.05);
    };
    burst('bandpass', 2600, 1200, 0.18 + 0.25 * strength, 0.18);
    burst('lowpass', 3200, 240, 0.22 + 0.45 * strength, 0.55 + 0.5 * strength);
  }
}
