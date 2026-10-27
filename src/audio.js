// Procedural sound design (Web Audio). Everything is synthesized at runtime: no audio files.
// Conservative mix: master ~0.5 -> limiter. Ambience sits well below SFX and ducks on the computer.
const PREF_KEY = 'loa-audio-v1';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const R = (a, b) => a + Math.random() * (b - a);

class GameAudio {
  constructor() {
    let p = {}; try { p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { /* ignore */ }
    this.vol = Number.isFinite(p.vol) ? clamp(p.vol, 0, 1) : 0.7;
    this.muted = !!p.muted || /[?&]audio=0\b/.test(location.search);
    this.ctx = null; this.started = false; this.sources = []; this.listeners = new Set();
    this.duck = false; this.stepGate = 0; this.lastPhase = 0;
  }
  // ---------- prefs ----------
  save() { try { localStorage.setItem(PREF_KEY, JSON.stringify({ vol: this.vol, muted: this.muted })); } catch { /* ignore */ } for (const f of this.listeners) f(this); }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  setVolume(v) { this.vol = clamp(+v || 0, 0, 1); if (this.vol > 0 && this.muted) this.muted = false; this.applyMaster(); this.save(); }
  toggleMute() { this.muted = !this.muted; this.applyMaster(); this.save(); }
  applyMaster() { if (!this.ctx) return; const g = this.muted ? 0 : 0.5 * this.vol; this.master.gain.setTargetAtTime(g, this.ctx.currentTime, 0.05); }
  setDuck(v) { if (!this.ctx || this.duck === v) return; this.duck = v; this.amb.gain.setTargetAtTime(v ? 0.55 : 1, this.ctx.currentTime, 0.4); this.world.gain.setTargetAtTime(v ? 0.6 : 1, this.ctx.currentTime, 0.4); }

  // ---------- boot (call from a user gesture) ----------
  start() {
    if (this.started) { this.ctx?.resume?.().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { this.ctx = new AC({ latencyHint: 'interactive' }); } catch { return; }
    this.started = true;
    const c = this.ctx;
    c.resume?.().catch(() => {});
    // master -> limiter -> out
    this.limiter = c.createDynamicsCompressor();
    Object.entries({ threshold: -8, knee: 4, ratio: 14, attack: 0.003, release: 0.2 }).forEach(([k, v]) => { this.limiter[k].value = v; });
    this.master = c.createGain(); this.master.gain.value = 0; this.master.connect(this.limiter); this.limiter.connect(c.destination);
    this.meter = c.createAnalyser(); this.meter.fftSize = 2048; this.limiter.connect(this.meter); this._buf = new Float32Array(2048);
    this.amb = this.bus(0.9); this.world = this.bus(1); this.sfx = this.bus(0.85); this.ui = this.bus(0.55);
    // shared noise buffers
    this.white = this.noise('white', 2); this.pink = this.noise('pink', 6); this.brown = this.noise('brown', 6);
    this.buildAmbience();
    this.applyMaster();
  }
  peak() { if (!this.meter) return 0; this.meter.getFloatTimeDomainData(this._buf); let m = 0; for (const v of this._buf) { const a = Math.abs(v); if (!(a <= m)) m = Number.isFinite(a) ? a : 99; } return m; }
  bus(g) { const n = this.ctx.createGain(); n.gain.value = g; n.connect(this.master); return n; }
  noise(kind, secs) {
    const c = this.ctx, n = Math.floor(c.sampleRate * secs), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    let l = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') d[i] = w;
      else if (kind === 'brown') { l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; }
      else { b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
    }
    // crossfade the loop seam
    const f = Math.min(2048, n >> 3); for (let i = 0; i < f; i++) { const t = i / f; d[n - f + i] = d[n - f + i] * (1 - t) + d[i] * t; }
    return b;
  }
  loop(buf, rate = 1) { const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate; s.loopStart = 0; s.start(0, Math.random() * buf.duration * 0.9); return s; }
  lfo(target, freq, depth, offset) { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.value = freq; g.gain.value = depth; o.connect(g); g.connect(target); o.start(); if (offset !== undefined) target.value = offset; return o; }
  filt(type, f, q = 0.7) { const n = this.ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; }
  gain(v) { const g = this.ctx.createGain(); g.gain.value = v; return g; }
  panner(x, y, z, ref = 1, roll = 1.4) {
    const p = this.ctx.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = ref; p.rolloffFactor = roll; p.maxDistance = 40;
    if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; } else p.setPosition(x, y, z);
    p.connect(this.world); return p;
  }

  buildAmbience() {
    const c = this.ctx;
    // HVAC: brown noise, lowpassed, slowly breathing
    { const s = this.loop(this.brown), lp = this.filt('lowpass', 210, 0.5), g = this.gain(0.055); s.connect(lp); lp.connect(g); g.connect(this.amb); this.lfo(lp.frequency, 0.045, 45, 210); this.lfo(g.gain, 0.031, 0.012, 0.055); }
    // air hiss: pink, very low
    { const s = this.loop(this.pink, 0.97), hp = this.filt('bandpass', 1400, 0.4), g = this.gain(0.006); s.connect(hp); hp.connect(g); g.connect(this.amb); }
    // electrical hum (60 + 120 + faint 180)
    for (const [f, v] of [[60, 0.012], [120, 0.006], [180, 0.0018]]) { const o = c.createOscillator(); o.frequency.value = f; const g = this.gain(v); o.connect(g); g.connect(this.amb); o.start(); this.lfo(g.gain, 0.07 + f / 4000, v * 0.25, v); }
    // distant city through the windows: very faint band of pink, slow swells
    { const s = this.loop(this.pink, 0.6), bp = this.filt('bandpass', 420, 0.6), g = this.gain(0.0); s.connect(bp); bp.connect(g); const p = this.panner(-7.6, 1.6, -1.5, 3, 0.6); g.connect(p); this.lfo(g.gain, 0.02, 0.006, 0.012); this.lfo(bp.frequency, 0.013, 120, 420); }
    // server rack fan (back-left corner)
    { const p = this.panner(-6.4, 0.9, -5.45, 0.7, 2.0); const s = this.loop(this.pink, 1.2), bp = this.filt('bandpass', 950, 0.9), g = this.gain(0.05); s.connect(bp); bp.connect(g); g.connect(p);
      const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 228; const og = this.gain(0.0035); o.connect(og); og.connect(p); o.start(); this.lfo(o.frequency, 0.11, 1.5, 228); }
    // fridge hum (kitchenette)
    { const p = this.panner(7.35, 0.4, 5.3, 0.6, 2.2); for (const [f, v] of [[55, 0.03], [110, 0.012], [165, 0.004]]) { const o = c.createOscillator(); o.frequency.value = f; const g = this.gain(v); o.connect(g); g.connect(p); o.start(); }
      const s = this.loop(this.brown), lp = this.filt('lowpass', 300), g = this.gain(0.03); s.connect(lp); lp.connect(g); g.connect(p); }
  }

  // ---------- positional typists ----------
  // addTypist({ pos:[x,y,z], typing:()=>bool, level, kind:'keys'|'phone', busy }) — schedules bursts loosely synced to typing state
  addTypist(o) { const t = { level: 1, kind: 'keys', busy: 0.6, ...o, next: R(0.2, 2), burst: 0, out: null }; this.sources.push(t); return t; }
  ensureOut(t) { if (!t.out && this.ctx) t.out = this.panner(t.pos[0], t.pos[1], t.pos[2], 0.8, 1.6); return t.out; }
  key(dest, when, level = 1, hi = false) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.white; s.playbackRate.value = R(0.8, 1.25);
    const bp = this.filt('bandpass', hi ? R(3800, 5200) : R(2200, 3600), R(1.2, 2.4)), g = this.gain(0);
    s.connect(bp); bp.connect(g); g.connect(dest);
    const a = 0.028 * level * R(0.6, 1.1);
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + 0.0015); g.gain.exponentialRampToValueAtTime(0.0001, when + R(0.018, 0.035));
    s.start(when, Math.random() * 1.5, 0.05);
    // soft mechanical "thock" body
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(R(150, 230), when); o.frequency.exponentialRampToValueAtTime(90, when + 0.03);
    const og = this.gain(0); o.connect(og); og.connect(dest);
    og.gain.setValueAtTime(0, when); og.gain.linearRampToValueAtTime(0.012 * level, when + 0.002); og.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
    o.start(when); o.stop(when + 0.05);
  }
  tickTypists(dt) {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const now = c.currentTime;
    for (const t of this.sources) {
      t.next -= dt; if (t.next > 0) continue;
      const active = t.typing ? t.typing() : Math.random() < t.busy;
      if (!active) { t.next = R(0.4, 1.5); continue; }
      const out = this.ensureOut(t);
      if (t.kind === 'phone') { this.key(out, now + 0.01, 0.25 * t.level, true); if (Math.random() < 0.3) this.key(out, now + R(0.12, 0.25), 0.22 * t.level, true); t.next = R(1.5, 6); continue; }
      // a burst of keys with human jitter, sometimes a mouse click, then a pause
      const n = Math.floor(R(3, 14)); let w = now + 0.01;
      for (let i = 0; i < n; i++) { this.key(out, w, t.level * (i % 5 === 4 ? 1.25 : 1)); w += R(0.06, 0.17) * (Math.random() < 0.1 ? 2.2 : 1); }
      if (Math.random() < 0.35) { w += R(0.15, 0.4); this.key(out, w, t.level * 0.7, true); if (Math.random() < 0.3) this.key(out, w + 0.11, t.level * 0.65, true); }
      t.next = (w - now) + R(0.3, 2.4) / Math.max(0.2, t.busy);
    }
  }

  // ---------- listener ----------
  update(dt, camera) {
    if (!this.ctx) return;
    const L = this.ctx.listener, p = camera.position;
    camera.updateMatrixWorld();
    const e = camera.matrixWorld.elements; const fx = -e[8], fy = -e[9], fz = -e[10], ux = e[4], uy = e[5], uz = e[6];
    if (L.positionX) { const t = this.ctx.currentTime; L.positionX.setTargetAtTime(p.x, t, 0.03); L.positionY.setTargetAtTime(p.y, t, 0.03); L.positionZ.setTargetAtTime(p.z, t, 0.03); L.forwardX.setTargetAtTime(fx, t, 0.03); L.forwardY.setTargetAtTime(fy, t, 0.03); L.forwardZ.setTargetAtTime(fz, t, 0.03); L.upX.setTargetAtTime(ux, t, 0.03); L.upY.setTargetAtTime(uy, t, 0.03); L.upZ.setTargetAtTime(uz, t, 0.03); }
    else { L.setPosition?.(p.x, p.y, p.z); L.setOrientation?.(fx, fy, fz, ux, uy, uz); }
    this.tickTypists(Math.min(dt, 0.1));
  }

  // ---------- Alon's footsteps (call each frame with walk phase + speed) ----------
  steps(phase, moveAmt, running, pos) {
    if (!this.ctx || this.ctx.state !== 'running') { this.lastPhase = phase; return; }
    const k0 = Math.floor(this.lastPhase / Math.PI), k1 = Math.floor(phase / Math.PI); this.lastPhase = phase;
    if (k1 === k0 || moveAmt < 0.25) return;
    const c = this.ctx, when = c.currentTime + 0.005, lvl = (running ? 1 : 0.55) * clamp(moveAmt, 0, 1);
    const dest = this.sfx;
    // heel thump on wood
    const s = c.createBufferSource(); s.buffer = this.brown; s.playbackRate.value = R(0.9, 1.2);
    const lp = this.filt('lowpass', R(380, 520), 0.8), g = this.gain(0); s.connect(lp); lp.connect(g); g.connect(dest);
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.14 * lvl, when + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.11);
    s.start(when, Math.random() * 4, 0.14);
    // board knock
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(R(110, 140), when); o.frequency.exponentialRampToValueAtTime(70, when + 0.07);
    const og = this.gain(0); o.connect(og); og.connect(dest); og.gain.setValueAtTime(0, when); og.gain.linearRampToValueAtTime(0.03 * lvl, when + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, when + 0.09); o.start(when); o.stop(when + 0.1);
    // faint scuff
    const sc = c.createBufferSource(); sc.buffer = this.white; const bp = this.filt('bandpass', R(2500, 4000), 1.5), sg = this.gain(0); sc.connect(bp); bp.connect(sg); sg.connect(dest);
    sg.gain.setValueAtTime(0, when + 0.01); sg.gain.linearRampToValueAtTime(0.006 * lvl, when + 0.02); sg.gain.exponentialRampToValueAtTime(0.0001, when + 0.07); sc.start(when, Math.random(), 0.09);
  }

  // ---------- UI + game one-shots ----------
  click(kind = 'click') {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx, t = c.currentTime + 0.003;
    const tone = (f0, f1, dur, v, type = 'sine', at = 0) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t + at); o.frequency.exponentialRampToValueAtTime(f1, t + at + dur); const g = this.gain(0); o.connect(g); g.connect(this.ui); g.gain.setValueAtTime(0, t + at); g.gain.linearRampToValueAtTime(v, t + at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur); o.start(t + at); o.stop(t + at + dur + 0.02); };
    if (kind === 'click') { tone(1800, 1200, 0.03, 0.035); }
    else if (kind === 'open') { tone(520, 780, 0.09, 0.03, 'triangle'); tone(780, 1170, 0.1, 0.02, 'sine', 0.05); }
    else if (kind === 'close') { tone(700, 420, 0.09, 0.025, 'triangle'); }
    else if (kind === 'menu') { tone(660, 990, 0.07, 0.025, 'triangle'); }
    else if (kind === 'select') { tone(1200, 1000, 0.025, 0.02); }
  }
  coins(n = 10, spread = 0.9) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx, t0 = c.currentTime + 0.01;
    for (let i = 0; i < n; i++) {
      const t = t0 + (i / n) * spread + R(0, 0.05), base = R(1900, 2600);
      for (const [m, v] of [[1, 0.06], [2.76, 0.03], [5.4, 0.014]]) {
        const o = c.createOscillator(); o.frequency.value = base * m; const g = this.gain(0); o.connect(g); g.connect(this.sfx);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + R(0.18, 0.32) / m ** 0.3); o.start(t); o.stop(t + 0.4);
      }
    }
  }
  swell() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx, t = c.currentTime + 0.02, out = this.gain(0), lp = this.filt('lowpass', 400, 0.9);
    lp.connect(out); out.connect(this.sfx);
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.1, t + 1.6); out.gain.setValueAtTime(0.1, t + 2.4); out.gain.exponentialRampToValueAtTime(0.0001, t + 4.6);
    lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(4200, t + 2.2);
    for (const f of [261.6, 329.6, 392.0, 523.3, 659.3]) for (const d of [-4, 4]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d; const g = this.gain(0.11); o.connect(g); g.connect(lp); o.start(t); o.stop(t + 4.8); }
    // sparkles on top
    for (let i = 0; i < 14; i++) { const st = t + 1.2 + i * R(0.08, 0.2), o = c.createOscillator(), g = this.gain(0); o.frequency.value = R(1800, 3600); o.connect(g); g.connect(this.sfx); g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.012, st + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, st + 0.3); o.start(st); o.stop(st + 0.35); }
  }
}

export const audio = new GameAudio();
