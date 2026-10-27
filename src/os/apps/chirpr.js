// Chirpr — parody microblog. Post as @alon, replies stream in from fictional accounts.
import { h, esc, avatar, alonAvatar, fmtCompact, timeAgo, mulberry, sparkPath } from '../util.js';
import { ICONS } from '../icons.js';
import { ACCOUNTS, feedPost, generateReplies, maybeLLM, sentiment, TRENDS, detectTopics, celebFeedPost, generateCelebReplies, CELEB_TRENDS } from './chirpr_engine.js';
import { fmtSOL } from '../util.js';

const ALON = { name: 'Alon', handle: 'alon', verified: true };
const fmtText = (t) => esc(t).replace(/(\$[A-Za-z]+)/g, '<a class="ch-tag">$1</a>').replace(/(@[a-z0-9_]+)/gi, '<a class="ch-tag">$1</a>').replace(/(^|\s)(#[A-Za-z][A-Za-z0-9]*)/g, '$1<a class="ch-tag">$2</a>');
const ic = {
  reply: '<svg viewBox="0 0 24 24"><path d="M4 12a8 7 0 1 1 4 6l-4 2 1-4a7 7 0 0 1-1-4z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  repost: '<svg viewBox="0 0 24 24"><path d="M7 7h9l-2-2M17 17H8l2 2M17 7v6M7 17v-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  like: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  views: '<svg viewBox="0 0 24 24"><path d="M5 19V11M10 19V6M15 19v-5M20 19V9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" fill="currentColor"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 21c1-5 15-5 16 0" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  hash: '<svg viewBox="0 0 24 24"><path d="M9 4L7 20M17 4l-2 16M4 9h16M3 15h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  check: '<svg class="ch-ver" viewBox="0 0 24 24"><path d="M12 2l2.4 2.2 3.2-.4.9 3.1 2.8 1.6-1.2 3 1.2 3-2.8 1.6-.9 3.1-3.2-.4L12 22l-2.4-2.2-3.2.4-.9-3.1-2.8-1.6 1.2-3-1.2-3 2.8-1.6.9-3.1 3.2.4z" fill="#ff7a45"/><path d="M8 12l3 3 5-6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
};
const av = (handle) => handle === 'alon' ? alonAvatar(48) : avatar(handle, 48);
function miniChart(seed) {
  const r = mulberry('mc' + seed); let v = 50; const d = Array.from({ length: 30 }, () => (v += (r() - 0.42) * 8));
  const up = d[d.length - 1] > d[0];
  return `<div class="ch-card"><svg viewBox="0 0 300 90" preserveAspectRatio="none"><path d="${sparkPath(d, 300, 90, 6)}" fill="none" stroke="${up ? '#55e392' : '#ef4f5a'}" stroke-width="2.5"/></svg><span>${up ? '📈 not financial advice' : '📉 it\'s fine, everything is fine'}</span></div>`;
}

export default {
  id: 'chirpr', title: 'Chirpr', width: 980, height: 640,
  create(ctx) {
    const st = ctx.store.get().chirpr;
    const celeb = () => !!ctx.store.get().airdropDelivered;
    const trendsHTML = () => (celeb() ? CELEB_TRENDS : TRENDS).map(([t, c], i) => `<div class="ch-trend"><small>${i < 2 ? 'Trending in Crypto' : 'Trending'}</small><b>${esc(t)}</b><small>${c}</small></div>`).join('');
    const el = h(`<div class="ch">
      <nav class="ch-nav">
        <div class="ch-logo">${ICONS.chirpr}<b>chirpr</b></div>
        <a class="ch-n on" data-v="home">${ic.home}<span>Home</span></a>
        <a class="ch-n" data-v="explore">${ic.hash}<span>Explore</span></a>
        <a class="ch-n" data-v="notif">${ic.bell}<span>Notifications</span><i class="ch-badge" hidden>0</i></a>
        <a class="ch-n" data-v="profile">${ic.user}<span>Profile</span></a>
        <button class="ch-cta">Chirp</button>
        <div class="ch-me"><img src="${av('alon')}"><div><b>Alon</b><small>@alon</small></div></div>
      </nav>
      <main class="ch-main"></main>
      <aside class="ch-side">
        <div class="ch-search"><input placeholder="Search Chirpr" /></div>
        <div class="ch-box ch-trends"><h4>What's chirping</h4>${trendsHTML()}</div>
        <div class="ch-box"><h4>Who to follow</h4>${ACCOUNTS.slice(0, 4).map(a => `<div class="ch-wtf"><img src="${av(a.handle)}"><div><b>${esc(a.name)}</b><small>@${a.handle}</small></div><button>Follow</button></div>`).join('')}</div>
        <small class="ch-legal">Chirpr is a parody inside Life of Alon. All accounts are fictional.</small>
      </aside>
    </div>`);
    const main = el.querySelector('.ch-main');
    let notifs = [], unread = 0, feedN = 0, view = 'home';
    const badge = el.querySelector('.ch-badge');

    const postEl = (p, { mine = false } = {}) => {
      const n = h(`<article class="ch-post ${mine ? 'mine' : ''}" data-id="${p.id}">
        <img class="ch-av" src="${av(p.handle)}">
        <div class="ch-body">
          <div class="ch-hd"><b>${esc(p.name)}</b>${p.verified ? ic.check : ''}${p.parody ? '<em class="ch-parody">parody · in-game</em>' : ''}<span>@${esc(p.handle)} · <time data-ts="${p.ts}">${timeAgo(p.ts)}</time></span></div>
          <div class="ch-txt">${fmtText(p.text)}</div>
          ${p.chart ? miniChart(p.chartSeed) : ''}
          ${p.balShot ? `<div class="ch-card ch-bal"><div><small>wallet balance · before</small><b>${fmtSOL(p.balShot.from)}</b></div><i>→</i><div><small>after the airdrop</small><b class="up">${fmtSOL(p.balShot.to)}</b></div><em>${p.balShot.mult}x</em></div>` : ''}
          ${mine ? `<div class="ch-sent"><div class="ch-sent-l"><span>Sentiment</span><b class="ch-sent-v">reading the room…</b></div><div class="ch-meter"><i class="ch-meter-pos"></i><i class="ch-meter-neu"></i><i class="ch-meter-neg"></i></div><div class="ch-topics"></div></div>` : ''}
          <div class="ch-acts">
            <button class="ch-a r">${ic.reply}<span>${fmtCompact(p.replies)}</span></button>
            <button class="ch-a rp">${ic.repost}<span>${fmtCompact(p.reposts)}</span></button>
            <button class="ch-a lk">${ic.like}<span>${fmtCompact(p.likes)}</span></button>
            <button class="ch-a vw">${ic.views}<span>${fmtCompact(p.views)}</span></button>
          </div>
          ${mine ? '<div class="ch-thread"></div>' : ''}
        </div></article>`);
      n.querySelector('.lk').addEventListener('click', (e) => { e.stopPropagation(); const b = e.currentTarget; b.classList.toggle('on'); p.likes += b.classList.contains('on') ? 1 : -1; b.querySelector('span').textContent = fmtCompact(p.likes); if (b.classList.contains('on')) b.animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 250 }); });
      n.querySelector('.rp').addEventListener('click', (e) => { e.stopPropagation(); const b = e.currentTarget; b.classList.toggle('on'); p.reposts += b.classList.contains('on') ? 1 : -1; b.querySelector('span').textContent = fmtCompact(p.reposts); });
      return n;
    };
    const replyEl = (r) => h(`<div class="ch-reply ${r.sent}"><img class="ch-av sm" src="${av(r.handle)}"><div><div class="ch-hd"><b>${esc(r.name)}</b>${r.verified ? ic.check : ''}${r.parody ? '<em class="ch-parody">parody · in-game</em>' : ''}<span>@${esc(r.handle)} · now</span><em class="ch-pill ${r.sent}">${{ pos: 'positive', neg: 'negative', neu: 'neutral', meme: 'meme' }[r.sent]}</em></div><div class="ch-txt">${fmtText(r.text)}</div></div></div>`);

    function setCount(n, cls, v) { const s = n.querySelector(`.${cls} span`); if (s) { s.textContent = fmtCompact(v); s.parentElement.animate([{ color: '#ff7a45' }, { color: '' }], { duration: 600 }); } }
    function updateMeter(n, p) {
      const c = p.counts || { pos: 0, neg: 0, neu: 0, meme: 0 }; const tot = c.pos + c.neg + c.neu + c.meme;
      const base = (p.sent0 + 1) / 2; // post's own tone
      const pos = tot ? (c.pos + c.meme * 0.5) / tot : base, neg = tot ? c.neg / tot : 1 - base, neu = Math.max(0, 1 - pos - neg);
      const m = n.querySelector('.ch-meter'); if (!m) return;
      m.querySelector('.ch-meter-pos').style.width = (pos * 100).toFixed(1) + '%';
      m.querySelector('.ch-meter-neu').style.width = (neu * 100).toFixed(1) + '%';
      m.querySelector('.ch-meter-neg').style.width = (neg * 100).toFixed(1) + '%';
      const label = celeb() && pos > 0.7 ? 'EUPHORIC 🪂' : pos > 0.62 ? 'Bullish 🟢' : neg > 0.42 ? 'Getting ratioed 🔴' : 'Mixed 🟡';
      n.querySelector('.ch-sent-v').textContent = `${label} · ${Math.round(pos * 100)}% positive · ${tot} replies`;
    }

    async function streamReplies(p, n) {
      const llm = await maybeLLM(p.text);
      const gen = celeb() ? generateCelebReplies(p.text, 12 + Math.floor(Math.random() * 8)) : generateReplies(p.text, 7 + Math.floor(Math.random() * 7));
      const replies = llm ? llm.map((r, i) => ({ sent: 'neu', delay: 800 + i * 900, ...r })) : gen.replies;
      p.sent0 = gen.sentiment; p.counts = { pos: 0, neg: 0, neu: 0, meme: 0 };
      n.querySelector('.ch-topics').innerHTML = (gen.topics.length ? gen.topics : ['general']).map(t => `<span>#${t}</span>`).join('');
      updateMeter(n, p);
      const thread = n.querySelector('.ch-thread');
      // engagement ticker
      const boost = celeb() ? 14 : 1 + Math.max(0, gen.sentiment) * 2;
      const tick = setInterval(() => {
        if (!n.isConnected && !p._keep) return;
        p.views += Math.round(Math.random() * 60 * boost); p.likes += Math.round(Math.random() * 4 * boost); if (Math.random() < 0.5) p.reposts += Math.round(Math.random() * 2 * boost);
        setCount(n, 'vw', p.views); setCount(n, 'lk', p.likes); setCount(n, 'rp', p.reposts);
      }, 700);
      setTimeout(() => clearInterval(tick), 40000);
      for (const r of replies) {
        setTimeout(() => {
          p.replies += 1; p.counts[r.sent] = (p.counts[r.sent] || 0) + 1; p.thread = p.thread || []; p.thread.push(r);
          const re = replyEl(r); thread.appendChild(re);
          re.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 280 });
          setCount(n, 'r', p.replies); updateMeter(n, p);
          notifs.unshift(r); if (view !== 'notif') { unread++; badge.hidden = false; badge.textContent = unread; }
          save();
        }, r.delay);
      }
    }
    const save = () => { st.posts = st.posts.slice(0, 30).map(p => ({ ...p, _keep: undefined })); ctx.store.save(); };

    function compose() {
      const c = h(`<div class="ch-compose"><img class="ch-av" src="${av('alon')}"><div class="ch-cbody"><textarea maxlength="280" placeholder="What's happening at the HQ?"></textarea>
        <div class="ch-cbar"><div class="ch-hints"><button data-t="gm chirpr. airdrop soon? 👀">gm + airdrop</button><button data-t="sorry for the downtime today, fees are lowered this week as a thank you">apology + fees</button><button data-t="we just shipped a new launch feature at pump HQ. LFG 🚀">launch</button><button data-t="BATON Corporation called again. should we take the meeting?">BATON</button></div><span class="ch-count">280</span><button class="ch-post-btn" disabled>Chirp</button></div></div></div>`);
      const ta = c.querySelector('textarea'), btn = c.querySelector('.ch-post-btn'), cnt = c.querySelector('.ch-count');
      const upd = () => { const l = 280 - ta.value.length; cnt.textContent = l; cnt.classList.toggle('low', l < 20); btn.disabled = !ta.value.trim(); };
      ta.addEventListener('input', upd);
      c.querySelectorAll('.ch-hints button').forEach(b => b.addEventListener('click', () => { ta.value = b.dataset.t; upd(); ta.focus(); }));
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) btn.click(); });
      btn.addEventListener('click', () => {
        const text = ta.value.trim(); if (!text) return;
        const p = { id: 'a' + Date.now(), ...ALON, text, ts: Date.now(), likes: 0, reposts: 0, replies: 0, views: 1, mine: true };
        st.posts.unshift(p); save();
        ta.value = ''; upd();
        const n = postEl(p, { mine: true });
        c.after(n); n.animate([{ opacity: 0, transform: 'translateY(-12px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
        streamReplies(p, n);
        ctx.notify('Your chirp is live');
      });
      return c;
    }

    function renderHome() {
      main.innerHTML = `<div class="ch-top"><b>Home</b><div class="ch-tabs"><a class="on">For you</a><a>Following</a></div></div>`;
      main.appendChild(compose());
      if (celeb()) main.appendChild(h(`<div class="ch-celebrate">🪂 <b>The airdrop landed.</b> Chirpr is losing its mind. Say something, Alon.</div>`));
      // Alon's previous posts (thread snapshot)
      for (const p of st.posts.slice(0, 3)) {
        const n = postEl(p, { mine: true }); main.appendChild(n);
        const th = n.querySelector('.ch-thread'); (p.thread || []).forEach(r => th.appendChild(replyEl(r)));
        if (p.counts) { n.querySelector('.ch-topics').innerHTML = detectTopics(p.text).map(t => `<span>#${t}</span>`).join(''); updateMeter(n, p); }
      }
      feedN = 0; more(14);
      const sentinel = h('<div class="ch-more">loading more chirps…</div>'); main.appendChild(sentinel);
      main.onscroll = () => { if (main.scrollTop + main.clientHeight > main.scrollHeight - 400) { sentinel.remove(); more(10); main.appendChild(sentinel); } };
    }
    function more(k) { for (let i = 0; i < k; i++) { const n = feedN++; main.appendChild(postEl(celeb() ? celebFeedPost(n) : feedPost(n))); } }
    function renderProfile() {
      main.onscroll = null;
      main.innerHTML = `<div class="ch-top"><b>Alon</b><small>${st.posts.length} chirps</small></div>
        <div class="ch-banner"></div>
        <div class="ch-prof"><img class="ch-pav" src="${av('alon')}"><button class="ch-edit">Edit profile</button>
        <h3>Alon ${ic.check}</h3><small>@alon</small>
        <p>stop being poor. resident of the HQ. professional fridge visitor. don't tread on me.</p>
        <div class="ch-pmeta"><span>📍 pump HQ</span><span>🗓 joined when it was early</span></div>
        <div class="ch-pmeta"><b>${fmtCompact(412)}</b> Following <b>${fmtCompact(128400 + st.posts.length * 37)}</b> Followers</div></div>
        <div class="ch-tabs pt"><a class="on">Chirps</a><a>Replies</a><a>Media</a><a>Likes</a></div>`;
      if (!st.posts.length) main.appendChild(h('<div class="ch-empty">No chirps yet. Go say gm.</div>'));
      for (const p of st.posts) { const n = postEl(p, { mine: true }); main.appendChild(n); const th = n.querySelector('.ch-thread'); (p.thread || []).slice(0, 4).forEach(r => th.appendChild(replyEl(r))); if (p.counts) updateMeter(n, p); }
    }
    function renderNotif() {
      main.onscroll = null; unread = 0; badge.hidden = true;
      main.innerHTML = `<div class="ch-top"><b>Notifications</b></div>`;
      if (!notifs.length) main.appendChild(h('<div class="ch-empty">Nothing yet. Chirp something and the replies will roll in.</div>'));
      for (const r of notifs.slice(0, 60)) main.appendChild(h(`<div class="ch-notif ${r.sent}"><img class="ch-av sm" src="${av(r.handle)}"><div><b>${esc(r.name)}</b> replied to your chirp<div class="ch-txt">${fmtText(r.text)}</div></div></div>`));
    }
    function renderExplore() {
      main.onscroll = null;
      main.innerHTML = `<div class="ch-top"><b>Explore</b></div>` + (celeb() ? CELEB_TRENDS : TRENDS).map(([t, c], i) => `<div class="ch-trend big"><small>${i + 1} · Trending</small><b>${esc(t)}</b><small>${c}</small></div>`).join('');
      for (let i = 0; i < 8; i++) main.appendChild(postEl(celeb() ? celebFeedPost(500 + i) : feedPost(500 + i)));
    }
    const views = { home: renderHome, profile: renderProfile, notif: renderNotif, explore: renderExplore };
    el.querySelectorAll('.ch-n').forEach(a => a.addEventListener('click', () => { view = a.dataset.v; el.querySelectorAll('.ch-n').forEach(x => x.classList.toggle('on', x === a)); views[view](); main.scrollTop = 0; }));
    el.querySelector('.ch-cta').addEventListener('click', () => { el.querySelector('.ch-n[data-v=home]').click(); setTimeout(() => main.querySelector('textarea')?.focus(), 50); });
    renderHome();
    const tm = setInterval(() => el.querySelectorAll('time[data-ts]').forEach(t => { t.textContent = timeAgo(+t.dataset.ts); }), 15000);
    const refresh = () => { el.querySelector('.ch-trends').innerHTML = `<h4>What's chirping</h4>${trendsHTML()}`; if (view === 'home') renderHome(); };
    const offA = ctx.os.on('airdrop', refresh);
    return { el, onClose: () => { clearInterval(tm); offA(); }, api: { post: (text) => { el.querySelector('.ch-n[data-v=home]').click(); const ta = main.querySelector('textarea'); ta.value = text; ta.dispatchEvent(new Event('input')); main.querySelector('.ch-post-btn').click(); } } };
  },
};
