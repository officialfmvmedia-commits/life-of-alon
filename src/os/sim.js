// Simulated (fictional) economy that powers PumpFun dashboard, Wallet and Chirpr. No real data.
import { mulberry, pick, rnd, fakeAddress, fakeSig } from './util.js';
import { store } from './store.js';

const r = mulberry('pumphq-sim');
const series = (n, base, vol, drift = 0) => { const a = []; let v = base; for (let i = 0; i < n; i++) { v = Math.max(base * 0.2, v * (1 + (r() - 0.5) * vol + drift)); a.push(v); } return a; };

export const TOKENS = ['PILL', 'BATON', 'DUVE', 'HQ', 'COPIUM', 'SENDIT', 'PIZZA', 'FRIDGE', 'AIRDROP', 'NOODLE', 'CHAIRCOIN', 'MOONSOON', 'SEWER', 'GMGM', 'WAGMEOW', 'LILPILL', 'STOPPOOR', 'BANDANA'].map((t, i) => {
  const mc = Math.round(rnd(8e3, 4.2e6, r) * (t === 'PILL' ? 6 : 1));
  return { t, name: t.charAt(0) + t.slice(1).toLowerCase() + (r() < 0.4 ? ' Coin' : ''), mc, ch: rnd(-62, 340, r), holders: Math.round(rnd(40, 9000, r)), curve: Math.round(rnd(4, 100, r)), spark: series(24, 100, 0.25, 0.01), creator: null, age: Math.round(rnd(2, 2000, r)) };
});

const TRADER_DEFS = [
  ['duve', 'DUVE', 'duve_trades', 118.4, 'up only (emotionally)'],
  ['ansem', 'ANSEM (parody)', 'ansem_hq', 74.2, 'coins look good · in-game parody'],
  ['whale', 'Big Wally', 'solwhale9000', 2210.6, 'size'],
  ['gary', 'gm gary', 'gm_gary', 34.2, 'says gm, means it'],
  ['pam', 'Ponzi Pam', 'ponzipam', 412.9, 'not financial advice'],
  ['ronnie', 'Rug Ronnie', 'rugpull_ronnie', 7.7, 'innocent until proven'],
  ['mom', 'degen mom', 'degenmom', 88.1, 'kids asleep, charts awake'],
  ['chad', 'Chart Chad', 'chartchad', 260.3, 'lines on lines'],
  ['intern', 'BATON intern', 'baton_intern', 3.1, 'unpaid, overleveraged'],
  ['sniper', 'block0 sniper', 'block0', 640.0, 'first in, first out'],
  ['nana', 'Nana Bags', 'nanabags', 51.5, 'holding since tuesday'],
  ['lambo', 'lambo or ramen', 'lamboramen', 12.8, 'currently ramen'],
  ['exit', 'Exit Liquidity', 'exitliq', 0.9, 'always the last buyer'],
  ['mike', 'Mike (dev?)', 'notthedev', 333.3, 'definitely not the dev'],
  ['zen', 'zen trader', 'zenmode', 145.0, 'breathe. buy. breathe.'],
  ['rasmr', 'RASMR', 'rasmr_research', 6.9, 'doing research (on chirpr)'],
];
export const TRADERS = TRADER_DEFS.map(([id, name, handle, bal, bio], i) => {
  const rr = mulberry('trader:' + id);
  const pnl = (rr() - 0.45) * bal * 3 + (id === 'duve' ? -42 : 0);
  const holdings = Array.from({ length: 2 + Math.floor(rr() * 4) }, () => { const tk = pick(TOKENS, rr); return { t: tk.t, amt: Math.round(rnd(1e3, 9e7, rr)), usd: rnd(20, 18000, rr) }; });
  if (id === 'duve') holdings.unshift({ t: 'DUVE', amt: 69420000, usd: 1337 });
  const txs = Array.from({ length: 7 }, (_, k) => ({ id: fakeSig(id + k), type: pick(['buy', 'sell', 'buy', 'receive'], rr), t: pick(TOKENS, rr).t, sol: +rnd(0.05, Math.max(0.2, bal / 6), rr).toFixed(3), ts: Date.now() - (k + 1) * rnd(4e5, 6e6, rr) }));
  return { id, name, handle, bio, addr: fakeAddress(id), base: bal, pnl, win: Math.round(rnd(22, 81, rr)), holdings, txs, trades: Math.round(rnd(40, 4000, rr)) };
});
export function traderState(tr) {
  const s = store.get().traders[tr.id] || {};
  const live = store.get().earnings?.[tr.id]; const raw = s.balance ?? tr.base;
  const balance = +Math.max(0, raw + (live ? live.pnl : 0)).toFixed(6);
  return { raw, balance, live: !!live, pnl: live ? live.pnl : tr.pnl, drained: !!s.drained && !(balance > 0), airdrop: s.airdrop || 0, txs: [...(s.txs || []), ...tr.txs] };
}
// "Deliver the Airdrop": every fictional trader gets 20x–200x their balance. Pure in-game state.
export function deliverAirdrop() {
  const st = store.get(); if (st.airdropDelivered) return null;
  const ts = Date.now(); let total = 0; const res = [];
  for (const tr of TRADERS) {
    const s = traderState(tr); const r = mulberry('drop:' + tr.id + ts);
    const mult = Math.round(20 + Math.pow(r(), 0.8) * 180);
    const amt = +(Math.max(s.balance, tr.base, 1) * mult).toFixed(3);
    const prev = st.traders[tr.id] || {};
    st.traders[tr.id] = { ...prev, balance: +(s.raw + amt).toFixed(3), drained: false, airdrop: amt, mult, txs: [{ id: fakeSig('drop' + tr.id + ts), type: 'airdrop', t: 'SOL', sol: amt, ts }, ...(prev.txs || [])] };
    total += amt; res.push({ id: tr.id, name: tr.name, from: s.balance, to: s.balance + amt, mult });
  }
  st.airdropDelivered = true; st.airdrop = { ts, total, wallets: TRADERS.length };
  store.save(); return { total, res };
}

export const ALON_ADDR = fakeAddress('alon-private-wallet');

// live metrics
const N = 60;
export const M = {
  solPrice: 187.42, // fictional simulated price
  revenue: series(N, 92000, 0.08, 0.004), volume: series(N, 4.1e6, 0.12, 0.003), fees: series(N, 41000, 0.1, 0.004),
  users: series(N, 18400, 0.05, 0.002), launches: series(N, 900, 0.3, 0.002),
  totals: { revenue: 48211934, volume: 2.91e9, fees: 31244908, users: 1480221, tokens: 3120988 },
  feed: [], listeners: new Set(),
};
const handles = ['gm_gary', 'degenmom', 'solwhale9000', 'chartchad', 'nanabags', 'notthedev', 'exitliq', 'baton_intern', 'zenmode', 'lamboramen', 'duve_trades', 'block0'];
function tick() {
  const push = (k, vol, drift) => { const a = M[k]; const v = Math.max(a[0] * 0.1, a[a.length - 1] * (1 + (Math.random() - 0.5) * vol + drift)); a.push(v); a.shift(); return v; };
  const rv = push('revenue', 0.06, 0.002), vv = push('volume', 0.09, 0.001), fv = push('fees', 0.07, 0.002); push('users', 0.03, 0.001); const lv = push('launches', 0.2, 0);
  M.totals.revenue += rv / 400; M.totals.volume += vv / 50; M.totals.fees += fv / 400; M.totals.users += Math.round(Math.random() * 6); M.totals.tokens += Math.round(lv / 300 + Math.random() * 3);
  M.solPrice = Math.max(40, M.solPrice * (1 + (Math.random() - 0.5) * 0.004));
  for (const tk of TOKENS) { tk.spark.push(Math.max(5, tk.spark[tk.spark.length - 1] * (1 + (Math.random() - 0.48) * 0.08))); tk.spark.shift(); tk.mc = Math.max(3000, tk.mc * (1 + (Math.random() - 0.49) * 0.02)); tk.ch += (Math.random() - 0.5) * 2; }
  const ev = Math.random();
  const tk = pick(TOKENS);
  M.feed.unshift(ev < 0.3 ? { k: 'launch', txt: `@${pick(handles)} launched $${pick(['MOON', 'CAT', 'PILL', 'SOUP', 'GOBLIN', 'VIBE', 'LAMP', 'DESK'])}${Math.floor(Math.random() * 99)}` } : ev < 0.7 ? { k: 'buy', txt: `@${pick(handles)} bought ${(Math.random() * 12).toFixed(2)} SOL of $${tk.t}` } : ev < 0.9 ? { k: 'sell', txt: `@${pick(handles)} sold ${(Math.random() * 9).toFixed(2)} SOL of $${tk.t}` } : { k: 'grad', txt: `$${tk.t} completed its bonding curve 🎓` });
  M.feed.length = Math.min(M.feed.length, 30);
  for (const fn of M.listeners) fn();
}
for (let i = 0; i < 12; i++) tick();
setInterval(tick, 1000);
export const onTick = (fn) => { M.listeners.add(fn); return () => M.listeners.delete(fn); };

// Users table
export const USERS = Array.from({ length: 40 }, (_, i) => {
  const rr = mulberry('user' + i);
  const a = pick(['sol', 'degen', 'pill', 'moon', 'chart', 'gm', 'bag', 'ape', 'cope', 'based', 'baton', 'pizza', 'noodle', 'fridge', 'lamp'], rr), b = pick(['lord', 'enjoyer', 'maxi', 'guy', 'gal', 'goblin', 'wizard', 'intern', 'whale', 'shrimp', 'andy', 'bro'], rr);
  return { handle: `${a}${b}${Math.floor(rr() * 999)}`, joined: Math.round(rnd(1, 700, rr)), tokens: Math.floor(rr() * rr() * 40), vol: rnd(0.5, 9000, rr), status: pick(['active', 'active', 'active', 'idle', 'flagged', 'whale'], rr) };
});
