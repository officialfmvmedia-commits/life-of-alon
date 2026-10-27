// Alon's Wallet: private in-game wallet. Balance is shown as "SOL" with a fictional USD value.
import { h, esc, avatar, fmtUSD, fmtSOL, shortAddr, timeAgo, countUp, mulberry, hashStr } from '../util.js';
import { ALON_ADDR, M, onTick, TOKENS } from '../sim.js';
import { areaChart, tween } from '../charts.js';

function qr(seed) { // decorative QR-ish pattern (not scannable)
  const r = mulberry(seed), n = 25, s = 6; let rects = '';
  const finder = (x, y) => `<rect x="${x * s}" y="${y * s}" width="${7 * s}" height="${7 * s}" fill="#111"/><rect x="${(x + 1) * s}" y="${(y + 1) * s}" width="${5 * s}" height="${5 * s}" fill="#fff"/><rect x="${(x + 2) * s}" y="${(y + 2) * s}" width="${3 * s}" height="${3 * s}" fill="#111"/>`;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9); if (!inF && r() < 0.48) rects += `<rect x="${x * s}" y="${y * s}" width="${s}" height="${s}" fill="#111"/>`; }
  return `<svg viewBox="0 0 ${n * s} ${n * s}" class="wl-qr"><rect width="100%" height="100%" fill="#fff"/>${rects}${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
}

export default {
  id: 'wallet', title: "Alon's Wallet", width: 760, height: 600,
  create(ctx) {
    const el = h(`<div class="wl">
      <div class="wl-top"><div class="wl-acct"><img src="data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#8b5cff"/></svg>')}"><div><b>Alon (private)</b><small class="mono">${shortAddr(ALON_ADDR)} <button class="wl-cp">⧉</button></small></div></div><span class="wl-net"><i></i>Solana · simulated</span></div>
      <div class="wl-hero"><small>Total balance</small><b class="wl-bal">0 SOL</b><span class="wl-usd">≈ $0</span><span class="wl-delta"></span>
        <div class="wl-acts"><button data-a="send"><i>↑</i>Send</button><button data-a="receive"><i>↓</i>Receive</button><button data-a="swap"><i>⇄</i>Swap</button><button data-a="buy"><i>+</i>Buy</button></div></div>
      <canvas class="wl-chart"></canvas>
      <div class="wl-tabs"><a class="on" data-t="act">Activity</a><a data-t="tok">Tokens</a></div>
      <div class="wl-list"></div>
      <footer class="wl-foot">simulated wallet · fictional balance · no real keys, chains or network calls</footer>
    </div>`);
    const balEl = el.querySelector('.wl-bal'), usdEl = el.querySelector('.wl-usd'), list = el.querySelector('.wl-list'), chart = el.querySelector('.wl-chart');
    let shown = ctx.store.get().wallet.balance, tabv = 'act';
    const hist = () => { const w = ctx.store.get().wallet; let b = w.balance; const pts = [b]; for (const t of w.txs.slice(0, 24)) { b -= t.type === 'receive' ? t.sol : -t.sol; pts.unshift(Math.max(0, b)); } while (pts.length < 8) pts.unshift(pts[0]); return pts; };
    const drawChart = (p = 1) => areaChart(chart, hist(), { color: '#a78bfa', progress: p, grid: false });
    function render(anim = false) {
      const w = ctx.store.get().wallet;
      if (anim && w.balance !== shown) {
        const d = w.balance - shown;
        countUp(balEl, shown, w.balance, 1400, fmtSOL); countUp(usdEl, shown * M.solPrice, w.balance * M.solPrice, 1400, (v) => '≈ ' + fmtUSD(v, 2));
        const de = el.querySelector('.wl-delta'); de.textContent = (d > 0 ? '+' : '') + fmtSOL(d); de.className = 'wl-delta show ' + (d > 0 ? 'up' : 'dn');
        el.querySelector('.wl-hero').animate([{ boxShadow: '0 0 0 0 #a78bfa00' }, { boxShadow: '0 0 60px 6px #a78bfa66' }, { boxShadow: '0 0 0 0 #a78bfa00' }], { duration: 1600 });
      } else { balEl.textContent = fmtSOL(w.balance); usdEl.textContent = '≈ ' + fmtUSD(w.balance * M.solPrice, 2); }
      shown = w.balance;
      if (tabv === 'act') {
        list.innerHTML = w.txs.length ? w.txs.map(t => `<div class="wl-tx ${t.type}"><img src="${avatar(t.handle || t.addr || 'x', 36)}"><div><b>${t.label ? esc(t.label) : t.type === 'receive' ? 'Received' : 'Sent'}</b><small>${t.type === 'receive' ? 'from ' + esc(t.from || shortAddr(t.addr)) : 'to ' + shortAddr(t.addr)}${t.addr ? ` · <span class="mono">${shortAddr(t.addr)}</span>` : ' · in person'}</small></div><div class="wl-amt"><b>${t.type === 'receive' ? '+' : '−'}${fmtSOL(t.sol)}</b><small>${timeAgo(t.ts) === 'now' ? 'just now' : timeAgo(t.ts) + ' ago'}</small></div></div>`).join('') + `<div class="wl-tx seed"><span class="wl-gen">✦</span><div><b>Wallet created</b><small>starting balance · 0.42 SOL</small></div></div>`
          : `<div class="wl-empty">No activity yet.<small>Open <b>PumpFun HQ → Traders</b> to… acquire some SOL.</small></div>`;
      } else {
        const sol = w.balance; const toks = [{ t: 'SOL', name: 'Solana (sim)', amt: sol, usd: sol * M.solPrice, c: '#a78bfa' }, ...TOKENS.slice(0, 3).map((tk, i) => ({ t: tk.t, name: tk.name, amt: [69420, 1337000, 420][i], usd: [12.4, 3.1, 0.7][i], c: `hsl(${(tk.t.charCodeAt(0) * 37) % 360} 70% 60%)` }))];
        list.innerHTML = toks.map(x => `<div class="wl-tx"><span class="pf-tk" style="background:${x.c}">${x.t.slice(0, 2)}</span><div><b>${x.t}</b><small>${esc(x.name)}</small></div><div class="wl-amt"><b>${x.t === 'SOL' ? fmtSOL(x.amt) : x.amt.toLocaleString()}</b><small>${fmtUSD(x.usd, 2)}</small></div></div>`).join('');
      }
      drawChart();
    }
    el.querySelectorAll('.wl-tabs a').forEach(a => a.addEventListener('click', () => { tabv = a.dataset.t; el.querySelectorAll('.wl-tabs a').forEach(x => x.classList.toggle('on', x === a)); render(); }));
    el.querySelector('.wl-cp').addEventListener('click', () => ctx.notify('Address copied (in-game only)'));
    el.querySelector('.wl-acts').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
      let body;
      if (a === 'receive') body = `<h3>Receive SOL</h3><p>Alon's private wallet address</p>${qr(ALON_ADDR)}<div class="pf-addr mono">${ALON_ADDR}</div><p class="pf-fine">Fictional address generated in-game. Do not send real funds anywhere.</p>`;
      else if (a === 'send') body = `<h3>Send SOL</h3><label>To<input class="aos-in" placeholder="Recipient (fictional)"></label><label>Amount<input class="aos-in" placeholder="0.00 SOL"></label><p class="pf-fine">Sending is disabled in this simulation. The SOL stays with Alon.</p>`;
      else if (a === 'swap') body = `<h3>Swap</h3><p>SOL ⇄ $PILL</p><p class="pf-fine">Swaps are UI-only in alonOS. Coming "soon" (HQ soon).</p>`;
      else body = `<h3>Buy SOL</h3><p class="pf-fine">No real purchases here. Try being less poor via PumpFun HQ.</p>`;
      const m = h(`<div class="aos-dlg">${body}<div class="aos-dlg-b"><button class="aos-b2 ok">Done</button></div></div>`);
      const close = ctx.os.modal(m); m.querySelector('.ok').addEventListener('click', close);
    });
    const offW = ctx.os.on('wallet', () => render(true));
    const unt = onTick(() => { if (!el.isConnected) return; usdEl.textContent = '≈ ' + fmtUSD(ctx.store.get().wallet.balance * M.solPrice, 2); });
    render(); tween(900, drawChart);
    return { el, onShow: () => render(), onResize: () => drawChart(), onClose: () => { unt(); offW(); } };
  },
};
