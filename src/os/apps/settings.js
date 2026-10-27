// Settings: display + reset simulation.
import { h } from '../util.js';
import { audio } from '../../audio.js';
const WALLS = ['wall-0', 'wall-1', 'wall-2', 'wall-3'];
export default {
  id: 'settings', title: 'Settings', width: 520, height: 580,
  create(ctx) {
    const el = h(`<div class="st">
      <section><h4>Display</h4>
        <label class="st-row"><span>Fill screen<small>Expand alonOS to the whole browser window</small></span><input type="checkbox" class="st-full"><i class="st-sw"></i></label>
        <div class="st-row"><span>Wallpaper</span><div class="st-walls">${WALLS.map((w, i) => `<button class="st-wall ${w}" data-i="${i}"></button>`).join('')}</div></div></section>
      <section><h4>Sound</h4>
        <div class="st-row"><span>Volume<small>Room tone, keyboards, footsteps and UI sounds (all synthesized). M toggles mute.</small></span><div class="st-vol"><input type="range" class="st-vr" min="0" max="100" step="1"><b class="st-vv"></b></div></div>
        <label class="st-row"><span>Mute</span><input type="checkbox" class="st-mute"><i class="st-sw"></i></label></section>
      <section><h4>Simulation</h4>
        <div class="st-row"><span>Reset alonOS<small>Restores Alon's wallet to 0.42 SOL, refills every trader, un-delivers the airdrop, clears chirps and notes.</small></span><button class="aos-b2 danger st-reset">Reset…</button></div></section>
      <section class="st-about"><h4>About</h4><p>alonOS 4.20 · pill edition<br>Everything on this computer is a simulation inside Life of Alon: fictional accounts, numbers, wallets and addresses. No network calls, no real chains, no keys.</p></section>
    </div>`);
    const full = el.querySelector('.st-full');
    const sync = () => { full.checked = !!ctx.os.full; el.querySelectorAll('.st-wall').forEach(b => b.classList.toggle('on', +b.dataset.i === (ctx.store.get().prefs.wallpaper || 0))); };
    full.addEventListener('change', () => ctx.os.setFull(full.checked));
    el.querySelectorAll('.st-wall').forEach(b => b.addEventListener('click', () => { ctx.store.get().prefs.wallpaper = +b.dataset.i; ctx.store.save(); ctx.os.setWall(+b.dataset.i); sync(); }));
    el.querySelector('.st-reset').addEventListener('click', () => {
      const m = h(`<div class="aos-dlg"><div class="pf-warn">↺</div><h3>Reset everything?</h3><p>This wipes alonOS progress on this browser.</p><div class="aos-dlg-b"><button class="aos-b2 cancel">Cancel</button><button class="aos-b2 danger go">Reset</button></div></div>`);
      const close = ctx.os.modal(m);
      m.querySelector('.cancel').addEventListener('click', close);
      m.querySelector('.go').addEventListener('click', () => {
        const full = ctx.os.full; ctx.store.reset(); ctx.store.get().prefs.full = full; ctx.store.save();
        close(); ctx.os.emit('reset'); ctx.os.emit('wallet', { delta: 0 }); ctx.os.setWall(0);
        setTimeout(() => { ctx.os.closeAll(); ctx.os.notify('alonOS reset · wallet back to 0.42 SOL'); }, 160);
      });
    });
    const vr = el.querySelector('.st-vr'), vv = el.querySelector('.st-vv'), mu = el.querySelector('.st-mute');
    const syncA = () => { vr.value = Math.round(audio.vol * 100); vv.textContent = vr.value + '%'; mu.checked = audio.muted; };
    vr.addEventListener('input', () => { audio.start(); audio.setVolume(vr.value / 100); });
    mu.addEventListener('change', () => { audio.start(); if (mu.checked !== audio.muted) audio.toggleMute(); });
    const offA = audio.onChange(syncA); syncA();
    const off = ctx.os.on('full', sync); sync();
    return { el, onShow: () => { sync(); syncA(); }, onClose: () => { off(); offA(); } };
  },
};
