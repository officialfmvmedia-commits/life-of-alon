// Simulated live earnings for NPCs (SOL). Persisted in the alonOS store. No network, no chain.
import { store } from './os/store.js';
import { fakeSig } from './os/util.js';

const DEF = { duve: { pnl: 3.2 }, rasmr: { pnl: 0.42 }, ansem: { pnl: 8.6 } };
const MODEL = {
  // DUVE trades actively: random walk with upward drift, occasional spikes and dips
  duve: { step: 0.5, drift: 0.006, vol: 0.035, spikeP: 0.012, spike: [0.4, 1.4], dipP: 0.01, dip: [0.3, 0.9] },
  // RASMR is "doing research": slow drip, rare lucky bumps
  // ANSEM: bigger size, more volatile, bigger spikes and dips
  ansem: { step: 0.5, drift: 0.014, vol: 0.09, spikeP: 0.018, spike: [0.9, 2.8], dipP: 0.016, dip: [0.6, 1.9] },
  rasmr: { step: 1.0, drift: 0.0012, vol: 0.004, spikeP: 0.006, spike: [0.15, 0.6], dipP: 0, dip: [0, 0] },
};
export const TAKE_COOLDOWN = 20; // seconds, plus earnings must grow again
export const MIN_TAKE = 0.05;

export function earnState(id) {
  const st = store.get(); st.earnings ||= {};
  if (!st.earnings[id]) st.earnings[id] = { pnl: DEF[id]?.pnl ?? 0, lastTake: 0, after: -1 };
  return st.earnings[id];
}
export function pnl(id) { return earnState(id).pnl; }

export class Earnings {
  constructor() { this.acc = {}; this.listeners = []; this.saveT = 0; this.hyped = false; }
  on(fn) { this.listeners.push(fn); }
  update(dt) {
    for (const [id, m] of Object.entries(MODEL)) {
      this.acc[id] = (this.acc[id] || 0) + dt;
      while (this.acc[id] >= m.step) {
        this.acc[id] -= m.step;
        const e = earnState(id); const boost = this.hyped ? 2 : 1;
        let d = m.drift * boost + (Math.random() - 0.5) * 2 * m.vol, ev = null;
        const r = Math.random();
        if (r < m.spikeP) { d += m.spike[0] + Math.random() * (m.spike[1] - m.spike[0]); ev = 'spike'; }
        else if (r < m.spikeP + m.dipP) { d -= m.dip[0] + Math.random() * (m.dip[1] - m.dip[0]); ev = 'dip'; }
        e.pnl = +(e.pnl + d).toFixed(6);
        if (!Number.isFinite(e.pnl)) e.pnl = 0;
        for (const fn of this.listeners) fn(id, d, ev);
      }
    }
    this.saveT += dt; if (this.saveT > 5) { this.saveT = 0; store.save(); }
  }
  // returns { ok, amount, reason }
  canTake(id, now = Date.now()) {
    const e = earnState(id);
    if (e.pnl < MIN_TAKE) return { ok: false, reason: 'empty' };
    const wait = TAKE_COOLDOWN - (now - (e.lastTake || 0)) / 1000;
    if (wait > 0 || (e.after >= 0 && e.pnl < e.after + MIN_TAKE)) return { ok: false, reason: 'cooldown', wait: Math.max(0, Math.ceil(wait)) };
    return { ok: true, amount: +(e.pnl / 2).toFixed(6) };
  }
  takeHalf(id, name) {
    const c = this.canTake(id); if (!c.ok) return c;
    const st = store.get(); const e = earnState(id); const half = +(e.pnl / 2).toFixed(6); const ts = Date.now();
    e.pnl = +(e.pnl - half).toFixed(6); e.lastTake = ts; e.after = e.pnl;
    st.wallet.balance = +(st.wallet.balance + half).toFixed(6);
    const sig = fakeSig('take' + id + ts);
    st.wallet.txs.unshift({ id: sig, type: 'receive', label: `Took half of ${name}'s earnings`, from: name, handle: id, addr: '', sol: half, ts });
    st.traders ||= {}; const tr = st.traders[id] ||= {};
    tr.txs = [{ id: sig, type: 'taken', t: 'SOL', sol: half, ts }, ...(tr.txs || [])];
    store.save();
    return { ok: true, amount: half, pnl: e.pnl };
  }
}
