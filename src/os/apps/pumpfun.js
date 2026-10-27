// PumpFun HQ admin dashboard (parody). Every number here is simulated.
import { h, esc, avatar, fmtUSD, fmtNum, fmtCompact, fmtSOL, shortAddr, timeAgo, sparkPath, countUp, fakeSig } from '../util.js';
import { TOKENS, TRADERS, traderState, ALON_ADDR, M, onTick, USERS, deliverAirdrop } from '../sim.js';
import { airdropOverlay } from '../celebrate.js';
import { areaChart, barChart, donut, tween } from '../charts.js';
import { ICONS } from '../icons.js';

const TABS = [['overview', 'Overview'], ['users', 'Users'], ['tokens', 'Tokens'], ['revenue', 'Revenue'], ['traders', 'Traders']];
const pct = (v) => `<span class="pf-ch ${v >= 0 ? 'up' : 'dn'}">${v >= 0 ? '▲' : '▼'} ${Math.abs(v).toFixed(1)}%</span>`;
const spark = (d, c) => `<svg class="pf-spark" viewBox="0 0 100 28" preserveAspectRatio="none"><path d="${sparkPath(d, 100, 28)}" fill="none" stroke="${c}" stroke-width="1.6"/></svg>`;
const chg = (a) => (a[a.length - 1] / a[a.length - 13] - 1) * 100;

export default {
  id: 'pumpfun', title: 'PumpFun HQ', width: 1080, height: 680,
  create(ctx, args) {
    const el = h(`<div class="pf">
      <aside class="pf-nav">
        <div class="pf-brand">${ICONS.pumpfun}<div><b>pump<span>.hq</span></b><small>admin console</small></div></div>
        ${TABS.map(([k, t]) => `<a class="pf-n" data-t="${k}">${t}</a>`).join('')}
        <button class="pf-airdrop"><span class="pf-ad-ico">🪂</span><span><b>Deliver the Airdrop</b><small>years in the making</small></span></button>
        <div class="pf-live"><i></i> live · simulated</div>
        <div class="pf-me"><img src="${avatar('alon-admin', 32)}"><div><b>alon</b><small>superadmin</small></div></div>
      </aside>
      <section class="pf-main"><div class="pf-content"></div><footer class="pf-foot">simulated data · all figures, users, wallets and addresses are fictional and generated in-game · not real pump.fun stats</footer></section>
    </div>`);
    const content = el.querySelector('.pf-content');
    let cleanup = [], tab = 'overview';
    const clear = () => { cleanup.forEach(f => f()); cleanup = []; };
    const live = (fn) => { cleanup.push(onTick(fn)); };

    function header(title, sub) { return `<div class="pf-hd"><div><h2>${title}</h2><small>${sub}</small></div><div class="pf-hd-r"><span class="pf-chip">Last 60 min</span><span class="pf-chip">All chains (fictional)</span></div></div>`; }

    function overview() {
      const kpis = [
        ['Revenue (all time)', () => fmtUSD(M.totals.revenue), M.revenue, '#55e392'],
        ['Trading volume', () => '$' + fmtCompact(M.totals.volume), M.volume, '#7a9bff'],
        ['Protocol fees', () => fmtUSD(M.totals.fees), M.fees, '#ffd23a'],
        ['Active users', () => fmtNum(M.totals.users), M.users, '#ff7a45'],
        ['Tokens launched', () => fmtNum(M.totals.tokens), M.launches, '#d38bff'],
      ];
      content.innerHTML = header('Overview', 'HQ at a glance') + dropBanner() + `<div class="pf-kpis">${kpis.map(([l], i) => `<div class="pf-kpi" data-i="${i}"><small>${l}</small><b>—</b><div class="pf-kpi-f"><span class="kch"></span><span class="ksp"></span></div></div>`).join('')}</div>
        <div class="pf-grid">
          <div class="pf-card span2"><div class="pf-ct"><b>Revenue</b><small>per minute · simulated</small><span class="pf-big rv"></span></div><canvas class="c-rev"></canvas></div>
          <div class="pf-card"><div class="pf-ct"><b>Fee split</b><small>where the pill goes</small></div><div class="pf-donut"><canvas class="c-don"></canvas><div class="pf-leg">${[['Treasury', '#55e392', 48], ['Creators', '#ffd23a', 22], ['Buybacks', '#7a9bff', 18], ['Pizza fund', '#ff7a45', 12]].map(([n, c, v]) => `<div><i style="background:${c}"></i>${n}<b>${v}%</b></div>`).join('')}</div></div></div>
          <div class="pf-card span2"><div class="pf-ct"><b>Volume</b><small>USD · simulated</small></div><canvas class="c-vol"></canvas></div>
          <div class="pf-card"><div class="pf-ct"><b>Live activity</b></div><div class="pf-feed"></div></div>
          <div class="pf-card span3"><div class="pf-ct"><b>Launches / min</b></div><canvas class="c-lau short"></canvas></div>
        </div>`;
      const cRev = content.querySelector('.c-rev'), cVol = content.querySelector('.c-vol'), cLau = content.querySelector('.c-lau'), cDon = content.querySelector('.c-don');
      const draw = (p = 1) => {
        areaChart(cRev, M.revenue, { color: '#55e392', progress: p, label: true, fmt: (v) => fmtUSD(v) });
        areaChart(cVol, M.volume, { color: '#7a9bff', progress: p, label: true, fmt: (v) => '$' + fmtCompact(v) });
        barChart(cLau, M.launches.slice(-40), { color: '#d38bff', progress: p });
        donut(cDon, [{ v: 48, c: '#55e392' }, { v: 22, c: '#ffd23a' }, { v: 18, c: '#7a9bff' }, { v: 12, c: '#ff7a45' }], { progress: p });
      };
      const kp = () => content.querySelectorAll('.pf-kpi').forEach((k, i) => { const [, f, s, c] = kpis[i]; k.querySelector('b').textContent = f(); k.querySelector('.kch').innerHTML = pct(chg(s)); k.querySelector('.ksp').innerHTML = spark(s.slice(-24), c); });
      let lastEv = null; const fe = content.querySelector('.pf-feed');
      const evEl = (f) => h(`<div class="pf-ev ${f.k}"><i></i>${esc(f.txt)}</div>`);
      const feed = () => {
        if (!lastEv) M.feed.slice(0, 9).forEach(f => { const e = evEl(f); e.style.animation = 'none'; fe.appendChild(e); });
        else { const fresh = []; for (const f of M.feed) { if (f === lastEv) break; fresh.push(f); } fresh.reverse().forEach(f => fe.prepend(evEl(f))); while (fe.children.length > 9) fe.lastChild.remove(); }
        lastEv = M.feed[0]; content.querySelector('.rv').textContent = fmtUSD(M.revenue[M.revenue.length - 1]) + '/min';
      };
      kp(); feed(); tween(900, draw);
      live(() => { kp(); feed(); draw(1); });
    }

    function dropBanner() {
      const st = ctx.store.get();
      return st.airdropDelivered ? `<div class="pf-banner done"><span>✅</span><div><b>Airdrop delivered</b><small>${fmtNum(st.airdrop?.total || 0, 2)} SOL sent to ${st.airdrop?.wallets || 14} wallets · simulated</small></div><button class="pf-go" data-goto="traders">View traders →</button></div>`
        : `<div class="pf-banner"><span>🪂</span><div><b>The airdrop is ready.</b><small>The whiteboard crossed it out. You don't have to.</small></div><button class="pf-airdrop big"><b>Deliver the Airdrop</b></button></div>`;
    }
    function users() {
      content.innerHTML = header('Users', `${fmtNum(M.totals.users)} accounts (fictional)`) + `<div class="pf-grid"><div class="pf-card span2"><div class="pf-ct"><b>Daily active users</b></div><canvas class="c-u"></canvas></div>
        <div class="pf-card"><div class="pf-ct"><b>Cohorts</b></div><div class="pf-stats">${[['New today', '12,904'], ['Retained 7d', '41%'], ['Whales', '1,204'], ['Flagged bots', '8,812'], ['Says gm daily', '96%']].map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('')}</div></div></div>
        <div class="pf-card"><table class="pf-tbl"><thead><tr><th>User</th><th>Joined</th><th>Tokens made</th><th>Volume</th><th>Status</th></tr></thead><tbody>${USERS.map(u => `<tr><td><img src="${avatar(u.handle, 22)}">@${esc(u.handle)}</td><td>${u.joined}d ago</td><td>${u.tokens}</td><td>${fmtSOL(u.vol)}</td><td><span class="pf-st ${u.status}">${u.status}</span></td></tr>`).join('')}</tbody></table></div>`;
      const c = content.querySelector('.c-u'); tween(800, (p) => areaChart(c, M.users, { color: '#ff7a45', progress: p, label: true, fmt: (v) => fmtNum(v) }));
      live(() => areaChart(c, M.users, { color: '#ff7a45', label: true, fmt: (v) => fmtNum(v) }));
    }

    function tokens() {
      const rows = () => [...TOKENS].sort((a, b) => b.mc - a.mc).map((t, i) => `<tr><td class="rk">${i + 1}</td><td><span class="pf-tk" style="--h:${(t.t.charCodeAt(0) * 37) % 360}">${t.t.slice(0, 2)}</span><b>$${t.t}</b><small>${esc(t.name)}</small></td><td>$${fmtCompact(t.mc)}</td><td>${pct(t.ch)}</td><td>${fmtNum(t.holders)}</td><td><div class="pf-curve"><i style="width:${t.curve}%"></i></div><small>${t.curve}%</small></td><td>${spark(t.spark, t.spark[t.spark.length - 1] >= t.spark[0] ? '#55e392' : '#ef4f5a')}</td></tr>`).join('');
      content.innerHTML = header('Tokens', `${fmtNum(M.totals.tokens)} launched · top movers`) + `<div class="pf-card"><table class="pf-tbl"><thead><tr><th>#</th><th>Token</th><th>Market cap</th><th>24h</th><th>Holders</th><th>Bonding curve</th><th>Chart</th></tr></thead><tbody></tbody></table></div>`;
      const tb = content.querySelector('tbody'); tb.innerHTML = rows();
      let k = 0; live(() => { if (++k % 2 === 0) tb.innerHTML = rows(); });
    }

    function revenue() {
      const daily = Array.from({ length: 30 }, (_, i) => 80000 + Math.sin(i / 3) * 22000 + (i * 2400) + ((i * 7919) % 13) * 3000);
      content.innerHTML = header('Revenue', 'fictional P&L for the HQ') + `<div class="pf-kpis three">${[['MRR (sim)', '$2.9M'], ['Today', fmtUSD(M.revenue.reduce((a, b) => a + b, 0))], ['Pizza budget', '$41,200']].map(([a, b]) => `<div class="pf-kpi"><small>${a}</small><b>${b}</b></div>`).join('')}</div>
        <div class="pf-grid"><div class="pf-card span2"><div class="pf-ct"><b>Daily revenue (30d)</b></div><canvas class="c-d"></canvas></div><div class="pf-card"><div class="pf-ct"><b>Fees per minute</b></div><canvas class="c-f"></canvas></div></div>
        <div class="pf-card"><table class="pf-tbl"><thead><tr><th>Source</th><th>Share</th><th>30d</th><th>Trend</th></tr></thead><tbody>${[['Trading fees', 61, '#55e392'], ['Launch fees', 19, '#ffd23a'], ['Graduation fees', 12, '#7a9bff'], ['Merch (tank tops)', 6, '#ff7a45'], ['Fridge rental', 2, '#d38bff']].map(([n, s, c]) => `<tr><td><i class="pf-dot" style="background:${c}"></i>${n}</td><td>${s}%</td><td>${fmtUSD(s * 47112)}</td><td><div class="pf-curve"><i style="width:${s}%;background:${c}"></i></div></td></tr>`).join('')}</tbody></table></div>`;
      const cd = content.querySelector('.c-d'), cf = content.querySelector('.c-f');
      tween(900, (p) => { barChart(cd, daily, { color: '#55e392', progress: p }); areaChart(cf, M.fees, { color: '#ffd23a', progress: p }); });
      live(() => areaChart(cf, M.fees, { color: '#ffd23a' }));
    }

    function traders() {
      const list = () => TRADERS.map(tr => { const s = traderState(tr); return `<tr class="pf-tr ${s.drained ? 'drained' : ''}" data-id="${tr.id}"><td><img src="${avatar(tr.handle, 26)}"><div><b>${esc(tr.name)}</b><small>@${tr.handle}</small></div></td><td class="mono">${shortAddr(tr.addr)}</td><td class="bal">${s.drained ? '<span class="pf-st flagged">drained</span>' : fmtSOL(s.balance)}${s.airdrop ? ` <span class="pf-st drop">AIRDROP +${fmtCompact(s.airdrop)}</span>` : ''}</td><td class="pnl ${s.pnl >= 0 ? 'up' : 'dn'}">${s.pnl >= 0 ? '+' : ''}${fmtSOL(s.pnl)}${s.live ? ' <span class="pf-st">live</span>' : ''}</td><td>${tr.win}%</td><td>${fmtNum(tr.trades)}</td><td><button class="pf-go">View wallet →</button></td></tr>`; }).join('');
      content.innerHTML = header('Traders', 'top wallets on the HQ (fictional)') + `<div class="pf-card"><table class="pf-tbl hover"><thead><tr><th>Trader</th><th>Wallet</th><th>Balance</th><th>PnL</th><th>Win rate</th><th>Trades</th><th></th></tr></thead><tbody>${list()}</tbody></table></div>`;
      content.querySelectorAll('.pf-tr').forEach(r => r.addEventListener('click', () => wallet(r.dataset.id)));
      live(() => content.querySelectorAll('.pf-tr').forEach(r => { const tr = TRADERS.find(t => t.id === r.dataset.id); const s = traderState(tr); if (!s.live || r.classList.contains('dropping')) return; const pc = r.querySelector('.pnl'); pc.className = 'pnl ' + (s.pnl >= 0 ? 'up' : 'dn'); pc.innerHTML = `${s.pnl >= 0 ? '+' : ''}${fmtSOL(s.pnl)} <span class="pf-st">live</span>`; const b = r.querySelector('.bal'); if (!s.drained) { const tag = b.querySelector('.pf-st.drop')?.outerHTML || ''; b.innerHTML = fmtSOL(s.balance) + (tag ? ' ' + tag : ''); } }));
      if (justDropped) { justDropped = false; content.querySelectorAll('.pf-tr').forEach((r, i) => { const tr = TRADERS.find(t => t.id === r.dataset.id); const s = traderState(tr); const b = r.querySelector('.bal'); const tag = b.querySelector('.pf-st.drop')?.outerHTML || ''; b.innerHTML = '<span class="cu"></span> ' + tag; r.classList.add('dropping'); setTimeout(() => countUp(b.querySelector('.cu'), s.balance - s.airdrop, s.balance, 2200, fmtSOL), i * 90); }); }
    }

    function wallet(id) {
      clear(); tab = 'traders'; setTab();
      const tr = TRADERS.find(t => t.id === id); const s = traderState(tr);
      const usd = (sol) => fmtUSD(sol * M.solPrice, 2);
      content.innerHTML = `<div class="pf-crumb"><a class="back">Traders</a> / <b>${esc(tr.name)}</b></div>
        <div class="pf-wal ${s.drained ? 'drained' : ''}">
          <div class="pf-card pf-whead"><img src="${avatar(tr.handle, 72)}"><div class="pf-wid"><h2>${esc(tr.name)} <small>@${tr.handle}</small></h2><p>${esc(tr.bio)}</p><div class="pf-addr mono">${tr.addr}<button class="pf-copy" title="Copy (in-game)">⧉</button></div></div>
            <div class="pf-wbal"><small>Balance</small><b class="wb">${fmtSOL(s.balance)}</b><span class="wu">≈ ${usd(s.balance)}</span>${s.airdrop ? `<span class="pf-dropnote">🪂 +${fmtSOL(s.airdrop)} airdrop · ${ctx.store.get().traders[tr.id]?.mult || ''}x</span>` : ''}
            <button class="pf-drain" ${s.drained || s.balance <= 0 ? 'disabled' : ''}>${s.drained ? 'Wallet drained' : '⚡ Drain wallet'}</button></div></div>
          <div class="pf-grid">
            <div class="pf-card"><div class="pf-ct"><b>Stats</b></div><div class="pf-stats">${[[s.live ? 'PnL (live)' : 'PnL 30d', `<span class="lpnl ${s.pnl >= 0 ? 'up' : 'dn'}">${(s.pnl >= 0 ? '+' : '') + fmtSOL(s.pnl)}</span>`], ['Win rate', tr.win + '%'], ['Trades', fmtNum(tr.trades)], ['Status', s.drained ? 'drained 💀' : 'active']].map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('')}</div></div>
            <div class="pf-card span2"><div class="pf-ct"><b>Holdings</b></div><div class="pf-hold">${tr.holdings.map(x => `<div><span class="pf-tk" style="--h:${(x.t.charCodeAt(0) * 37) % 360}">${x.t.slice(0, 2)}</span><b>$${x.t}</b><small>${fmtCompact(x.amt)}</small><em>${s.drained ? '$0' : fmtUSD(x.usd)}</em></div>`).join('')}</div></div>
          </div>
          <div class="pf-card"><div class="pf-ct"><b>Recent transactions</b></div><table class="pf-tbl"><thead><tr><th>Type</th><th>Token</th><th>Amount</th><th>Signature</th><th>When</th></tr></thead><tbody>${s.txs.map(t => `<tr class="${t.type === 'drained' ? 'hl' : t.type === 'airdrop' ? 'hl-drop' : ''}"><td><span class="pf-tt ${t.type}">${t.type === 'taken' ? 'taken by alon' : t.type}</span></td><td>${t.t ? '$' + t.t : '—'}</td><td>${t.type === 'drained' || t.type === 'taken' ? '−' : t.type === 'airdrop' ? '+' : ''}${fmtSOL(t.sol)}</td><td class="mono">${t.id.slice(0, 10)}…</td><td>${timeAgo(t.ts)}</td></tr>`).join('')}</tbody></table></div>
        </div>`;
      content.querySelector('.back').addEventListener('click', () => go('traders'));
      if (s.live) live(() => { const n = traderState(tr); const l = content.querySelector('.lpnl'); if (l) { l.className = 'lpnl ' + (n.pnl >= 0 ? 'up' : 'dn'); l.textContent = (n.pnl >= 0 ? '+' : '') + fmtSOL(n.pnl); } const wb = content.querySelector('.wb'); if (wb && !wb._cu) wb.textContent = fmtSOL(n.balance); const wu = content.querySelector('.wu'); if (wu) wu.textContent = '≈ ' + usd(n.balance); });
      { const ad = ctx.store.get().airdrop; if (s.airdrop && ad && Date.now() - ad.ts < 20000) { const wb = content.querySelector('.wb'); wb._cu = true; setTimeout(() => { wb._cu = false; }, 1900); countUp(wb, s.balance - s.airdrop, s.balance, 1800, fmtSOL); } }
      content.querySelector('.pf-copy').addEventListener('click', () => ctx.notify('Address copied (not really, it\'s a game)'));
      content.querySelector('.pf-drain').addEventListener('click', () => drainModal(tr));
    }

    function drainModal(tr) {
      const s = traderState(tr); const amt = s.balance;
      const m = h(`<div class="aos-dlg pf-dlg"><div class="pf-warn">⚠</div><h3>Drain ${esc(tr.name)}'s wallet?</h3>
        <p>Move <b>${fmtSOL(amt)}</b> from <span class="mono">${shortAddr(tr.addr)}</span> to <b>Alon's Wallet</b> <span class="mono">${shortAddr(ALON_ADDR)}</span>.</p>
        <p class="pf-fine">In-game simulation. No real wallets, keys or chains are touched.</p>
        <div class="pf-flow"><div class="pf-fa"><img src="${avatar(tr.handle, 44)}"><small>${esc(tr.name)}</small><b class="fa">${fmtSOL(amt)}</b></div><div class="pf-pipe"><div class="pf-prog"></div></div><div class="pf-fa"><span class="aos-ico">${ICONS.wallet}</span><small>Alon's Wallet</small><b class="fb">+0 SOL</b></div></div>
        <div class="aos-dlg-b"><button class="aos-b2 cancel">Cancel</button><button class="aos-b2 danger hold"><span>Hold to drain</span><i></i></button></div></div>`);
      const close = ctx.os.modal(m);
      m.querySelector('.cancel').addEventListener('click', close);
      const hold = m.querySelector('.hold'); let ht = null, hv = 0, done = false;
      const fill = hold.querySelector('i');
      const start = () => { if (done) return; clearInterval(ht); ht = setInterval(() => { hv = Math.min(1, hv + 0.05); fill.style.width = hv * 100 + '%'; if (hv >= 1) { clearInterval(ht); go2(); } }, 30); };
      const stop = () => { if (done) return; clearInterval(ht); ht = setInterval(() => { hv = Math.max(0, hv - 0.08); fill.style.width = hv * 100 + '%'; if (!hv) clearInterval(ht); }, 30); };
      hold.addEventListener('pointerdown', start); hold.addEventListener('pointerup', stop); hold.addEventListener('pointerleave', stop);
      hold.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hv = 1; go2(); } });
      function go2() {
        if (done) return; done = true; clearInterval(ht);
        hold.disabled = true; m.querySelector('.cancel').disabled = true; hold.querySelector('span').textContent = 'Draining…';
        const pipe = m.querySelector('.pf-pipe'), prog = m.querySelector('.pf-prog');
        for (let i = 0; i < 14; i++) { const c = h('<i class="pf-coin">◎</i>'); c.style.animationDelay = (i * 0.11) + 's'; pipe.appendChild(c); }
        tween(1900, (p) => { prog.style.width = p * 100 + '%'; m.querySelector('.fa').textContent = fmtSOL(amt * (1 - p)); m.querySelector('.fb').textContent = '+' + fmtSOL(amt * p); });
        setTimeout(() => { commitDrain(tr, amt); m.classList.add('ok'); hold.querySelector('span').textContent = 'Transfer complete ✓'; setTimeout(() => { close(); wallet(tr.id); }, 900); }, 2000);
      }
      // test hook
      m._drainNow = () => { hv = 1; go2(); };
      ctx.os._lastModal = m;
    }

    let justDropped = false;
    function airdropModal() {
      if (ctx.store.get().airdropDelivered) return go('traders');
      const m = h(`<div class="aos-dlg pf-dlg drop"><div class="pf-warn drop">🪂</div><h3>Deliver the Airdrop?</h3>
        <p>Years of "airdrop when?". Thousands of replies. One crossed-out line on a whiteboard.</p>
        <p><b>Every trader on the HQ gets 20x–200x their balance.</b> There is no undo. There is only up.</p>
        <p class="pf-fine">In-game simulation. Fictional wallets, fictional SOL, zero real chain calls.</p>
        <div class="aos-dlg-b"><button class="aos-b2 cancel">Not yet</button><button class="aos-b2 drop hold"><span>Hold to deliver</span><i></i></button></div></div>`);
      const close = ctx.os.modal(m);
      m.querySelector('.cancel').addEventListener('click', close);
      const hold = m.querySelector('.hold'), fill = hold.querySelector('i'); let ht, hv = 0, done = false;
      const fire = () => {
        if (done) return; done = true; clearInterval(ht); close();
        const r = deliverAirdrop(); if (!r) return;
        justDropped = true;
        ctx.os.emit('airdrop', r);
        airdropOverlay(ctx.os, { total: r.total, wallets: r.res.length }, () => go('traders'));
        ctx.notify(`🪂 <b>Airdrop delivered</b> · ${fmtNum(r.total, 2)} SOL to ${r.res.length} wallets`);
      };
      hold.addEventListener('pointerdown', () => { clearInterval(ht); ht = setInterval(() => { hv = Math.min(1, hv + 0.06); fill.style.width = hv * 100 + '%'; if (hv >= 1) fire(); }, 30); });
      const stop = () => { if (done) return; clearInterval(ht); ht = setInterval(() => { hv = Math.max(0, hv - 0.08); fill.style.width = hv * 100 + '%'; if (!hv) clearInterval(ht); }, 30); };
      hold.addEventListener('pointerup', stop); hold.addEventListener('pointerleave', stop);
      hold.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
      ctx.os._lastModal = m; m._fire = fire;
    }
    el.addEventListener('click', (e) => { if (e.target.closest('.pf-airdrop')) airdropModal(); const g = e.target.closest('[data-goto]'); if (g) go(g.dataset.goto); });
    const syncDropBtn = () => { const d = ctx.store.get().airdropDelivered; const b = el.querySelector('.pf-nav .pf-airdrop'); b.classList.toggle('done', d); b.querySelector('b').textContent = d ? 'Airdrop delivered ✓' : 'Deliver the Airdrop'; b.querySelector('small').textContent = d ? 'it was real' : 'years in the making'; };
    syncDropBtn(); const offDrop = ctx.os.on('airdrop', syncDropBtn);
    function commitDrain(tr, amt) {
      const st = ctx.store.get(); const ts = Date.now(); const sig = fakeSig(tr.id + ts);
      const prev = st.traders[tr.id] || {};
      if (st.earnings?.[tr.id]) st.earnings[tr.id].pnl = 0;
      st.traders[tr.id] = { balance: 0, drained: true, txs: [{ id: sig, type: 'drained', t: 'SOL', sol: amt, ts }, ...(prev.txs || [])] };
      st.wallet.balance = +(st.wallet.balance + amt).toFixed(6);
      st.wallet.txs.unshift({ id: sig, type: 'receive', from: tr.name, handle: tr.handle, addr: tr.addr, sol: amt, ts });
      ctx.store.save();
      ctx.os.emit('wallet', { delta: amt }); ctx.os.emit('drain', { id: tr.id, name: tr.name, sol: amt });
      ctx.notify(`<b>+${fmtSOL(amt)}</b> received from ${esc(tr.name)}`, 'sol');
    }

    const setTab = () => el.querySelectorAll('.pf-n').forEach(a => a.classList.toggle('on', a.dataset.t === tab));
    const views = { overview, users, tokens, revenue, traders };
    function go(t) { clear(); tab = t; setTab(); content.parentElement.scrollTop = 0; views[t](); }
    el.querySelectorAll('.pf-n').forEach(a => a.addEventListener('click', () => go(a.dataset.t)));
    go(args?.tab || 'overview');
    if (args?.wallet) wallet(args.wallet);
    return { el, onClose: () => { clear(); offDrop(); }, onArgs: (a) => { if (a?.wallet) wallet(a.wallet); else if (a?.tab) go(a.tab); }, api: { go, wallet } };
  },
};
