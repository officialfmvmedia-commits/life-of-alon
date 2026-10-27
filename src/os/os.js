// alonOS core: window manager, dock, menubar, notifications, modals, app registry.
import { h, esc } from './util.js';
import { store } from './store.js';
import { ICONS } from './icons.js';

export class AlonOS {
  constructor(root, apps, opts = {}) {
    this.apps = new Map(apps.map(a => [a.id, a]));
    this.wins = new Map(); this.z = 10; this.events = new EventTarget(); this.modals = [];
    this.opts = opts;
    root.innerHTML = '';
    this.wrap = h(`<div class="aos-wrap"><div class="aos">
      <div class="aos-bar">
        <div class="aos-logo"><i></i><i></i></div><b class="aos-active">alonOS</b>
        <span class="aos-m">File</span><span class="aos-m">Edit</span><span class="aos-m">Vibes</span><span class="aos-m">Help</span>
        <span class="aos-sp"></span>
        <span class="aos-bal" title="Alon's Wallet"></span>
        <button class="aos-btn aos-full" title="Fill screen (F)">⤢</button>
        <span class="aos-wifi"><i></i><i></i><i></i></span>
        <span class="aos-clock"></span>
        <button class="aos-btn aos-stand" title="Stand up (ESC)">Stand up <kbd>ESC</kbd></button>
      </div>
      <div class="aos-desk">
        <div class="aos-wall"></div>
        <div class="aos-icons"></div>
        <div class="aos-layer"></div>
        <div class="aos-toasts"></div>
      </div>
      <div class="aos-dock"></div>
    </div></div>`);
    root.appendChild(this.wrap);
    this.desk = this.wrap.querySelector('.aos-desk'); this.layer = this.wrap.querySelector('.aos-layer');
    this.dock = this.wrap.querySelector('.aos-dock');
    // desktop icons + dock
    for (const a of apps) {
      if (!a.hidden) {
        const di = h(`<button class="aos-di" data-app="${a.id}"><span class="aos-ico">${ICONS[a.icon || a.id] || ''}</span><span>${esc(a.title)}</span></button>`);
        di.addEventListener('click', () => this.open(a.id)); this.wrap.querySelector('.aos-icons').appendChild(di);
      }
      const dk = h(`<button class="aos-dk" data-app="${a.id}" title="${esc(a.title)}"><span class="aos-ico">${ICONS[a.icon || a.id] || ''}</span><i class="aos-dot"></i><em>${esc(a.title)}</em></button>`);
      dk.addEventListener('click', () => this.toggleFromDock(a.id)); this.dock.appendChild(dk);
    }
    this.wrap.querySelector('.aos-full').addEventListener('click', () => this.setFull(!this.full));
    this.wrap.querySelector('.aos-stand').addEventListener('click', () => this.opts.onStandUp?.());
    this.wrap.querySelector('.aos-bal').addEventListener('click', () => this.open('wallet'));
    this.setFull(!!store.get().prefs.full, false); this.setWall(store.get().prefs.wallpaper || 0);
    const clock = this.wrap.querySelector('.aos-clock');
    const tick = () => { const d = new Date(); clock.textContent = d.toLocaleDateString([], { weekday: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
    tick(); setInterval(tick, 5000);
    this.events.addEventListener('wallet', () => this.updateBal()); this.updateBal();
  }
  setWall(i) { const w = this.wrap.querySelector('.aos-wall'); w.className = 'aos-wall wall-' + i; this.emit('wall', i); }
  updateBal() { const b = store.get().wallet.balance; this.wrap.querySelector('.aos-bal').textContent = b.toFixed(2) + ' SOL'; }
  setFull(v, save = true) {
    this.full = v; this.wrap.classList.toggle('full', v);
    if (save) { store.get().prefs.full = v; store.save(); }
    this.events.dispatchEvent(new CustomEvent('full', { detail: v }));
  }
  emit(type, detail) { this.events.dispatchEvent(new CustomEvent(type, { detail })); }
  on(type, fn) { const l = (e) => fn(e.detail); this.events.addEventListener(type, l); return () => this.events.removeEventListener(type, l); }
  closeAll() { for (const id of [...this.wins.keys()]) this.close(id); while (this.modals.length) this.modals[this.modals.length - 1](); }

  open(id, args) {
    const app = this.apps.get(id); if (!app) return;
    let w = this.wins.get(id);
    if (w) { if (w.min) this.restore(w); this.focus(w); w.inst.onArgs?.(args); return w; }
    const dw = this.desk.clientWidth || 1000, dh = this.desk.clientHeight || 640;
    const W = Math.min(app.width || 720, dw - 40), H = Math.min(app.height || 480, dh - 92);
    const n = this.wins.size;
    const x = Math.max(10, Math.min(dw - W - 10, (dw - W) / 2 + (n - 1) * 26)), y = Math.max(8, Math.min(dh - H - 82, (dh - H - 72) / 2 + (n - 1) * 22));
    const el = h(`<div class="aw" style="left:${x}px;top:${y}px;width:${W}px;height:${H}px">
      <div class="aw-t"><div class="aw-lights"><button class="aw-c" title="Close"></button><button class="aw-n" title="Minimize"></button><button class="aw-x" title="Maximize"></button></div>
      <span class="aw-ico">${ICONS[app.icon || app.id] || ''}</span><span class="aw-title">${esc(app.title)}</span><span class="aw-sp"></span></div>
      <div class="aw-b"></div><div class="aw-rs"></div></div>`);
    this.layer.appendChild(el);
    w = { id, app, el, min: false, max: false };
    const ctx = {
      os: this, store, win: w,
      notify: (t, k) => this.notify(t, k), open: (a, args) => this.open(a, args), close: () => this.close(id),
      setTitle: (t) => { el.querySelector('.aw-title').textContent = t; },
    };
    w.inst = app.create(ctx, args) || {};
    el.querySelector('.aw-b').appendChild(w.inst.el);
    this.wins.set(id, w);
    el.addEventListener('pointerdown', () => this.focus(w));
    el.querySelector('.aw-c').addEventListener('click', (e) => { e.stopPropagation(); this.close(id); });
    el.querySelector('.aw-n').addEventListener('click', (e) => { e.stopPropagation(); this.minimize(w); });
    el.querySelector('.aw-x').addEventListener('click', (e) => { e.stopPropagation(); this.toggleMax(w); });
    el.querySelector('.aw-t').addEventListener('dblclick', () => this.toggleMax(w));
    this.drag(w); this.resize(w);
    this.focus(w);
    el.animate([{ opacity: 0, transform: 'scale(.94) translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
    this.dock.querySelector(`[data-app="${id}"]`)?.classList.add('on');
    if (app.maximized || (dw < 900 && app.width > 700)) this.toggleMax(w, false);
    w.inst.onShow?.();
    return w;
  }
  focus(w) {
    for (const o of this.wins.values()) o.el.classList.toggle('focus', o === w);
    w.el.style.zIndex = ++this.z;
    this.wrap.querySelector('.aos-active').textContent = w.app.title;
  }
  close(id) {
    const w = this.wins.get(id); if (!w) return;
    w.inst.onClose?.();
    const a = w.el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94)' }], { duration: 160, easing: 'ease-in' });
    a.onfinish = () => w.el.remove();
    this.wins.delete(id);
    this.dock.querySelector(`[data-app="${id}"]`)?.classList.remove('on');
    this.wrap.querySelector('.aos-active').textContent = 'alonOS';
  }
  minimize(w) {
    const d = this.dock.querySelector(`[data-app="${w.id}"]`).getBoundingClientRect(), r = w.el.getBoundingClientRect();
    const sc = this.full ? 1 : (this.scale || 1); const dx = (d.left + d.width / 2 - (r.left + r.width / 2)) / sc, dy = (d.top - (r.top + r.height / 2)) / sc;
    const a = w.el.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.08)`, opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.5,0,.75,0)' });
    a.onfinish = () => { w.el.style.display = 'none'; };
    w.min = true;
  }
  restore(w) {
    w.el.style.display = ''; w.min = false;
    w.el.animate([{ transform: 'translateY(60px) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
    w.inst.onShow?.();
  }
  toggleFromDock(id) {
    const w = this.wins.get(id);
    if (!w) return this.open(id);
    if (w.min) { this.restore(w); this.focus(w); }
    else if (w.el.classList.contains('focus')) this.minimize(w);
    else this.focus(w);
  }
  toggleMax(w, anim = true) {
    const el = w.el;
    if (!w.max) { w.prev = { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height }; Object.assign(el.style, { left: '6px', top: '6px', width: 'calc(100% - 12px)', height: 'calc(100% - 84px)' }); }
    else Object.assign(el.style, w.prev);
    w.max = !w.max; el.classList.toggle('max', w.max);
    if (anim) el.animate([{ opacity: .85, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 200 });
    w.inst.onResize?.();
  }
  drag(w) {
    const bar = w.el.querySelector('.aw-t');
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || w.max) return;
      const sx = e.clientX, sy = e.clientY, ox = w.el.offsetLeft, oy = w.el.offsetTop, sc = this.scale || 1;
      const dw = this.desk.clientWidth, dh = this.desk.clientHeight;
      bar.setPointerCapture(e.pointerId); w.el.classList.add('dragging');
      const mv = (ev) => { w.el.style.left = Math.max(-w.el.offsetWidth + 80, Math.min(dw - 80, ox + (ev.clientX - sx) / sc)) + 'px'; w.el.style.top = Math.max(0, Math.min(dh - 36, oy + (ev.clientY - sy) / sc)) + 'px'; };
      const up = () => { bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); w.el.classList.remove('dragging'); };
      bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up);
    });
  }
  resize(w) {
    const g = w.el.querySelector('.aw-rs');
    g.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); const sx = e.clientX, sy = e.clientY, ow = w.el.offsetWidth, oh = w.el.offsetHeight, sc = this.scale || 1;
      g.setPointerCapture(e.pointerId);
      const mv = (ev) => { w.el.style.width = Math.max(360, ow + (ev.clientX - sx) / sc) + 'px'; w.el.style.height = Math.max(240, oh + (ev.clientY - sy) / sc) + 'px'; w.inst.onResize?.(); };
      const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up);
    });
  }
  notify(text, kind = '') {
    const t = h(`<div class="aos-toast ${kind}"><span class="aos-ico">${ICONS.wallet}</span><div>${text}</div></div>`);
    if (kind !== 'sol') t.querySelector('.aos-ico').remove();
    this.desk.querySelector('.aos-toasts').prepend(t);
    t.animate([{ opacity: 0, transform: 'translateX(30px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
    setTimeout(() => { const a = t.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(30px)' }], { duration: 300 }); a.onfinish = () => t.remove(); }, 3800);
  }
  modal(el, { onClose } = {}) {
    const ov = h(`<div class="aos-modal"></div>`); ov.appendChild(el); this.desk.appendChild(ov);
    ov.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    el.animate([{ transform: 'scale(.9)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 280, easing: 'cubic-bezier(.2,.9,.3,1.25)' });
    const close = () => { const i = this.modals.indexOf(close); if (i >= 0) this.modals.splice(i, 1); const a = ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 }); a.onfinish = () => ov.remove(); onClose?.(); };
    ov.addEventListener('pointerdown', (e) => { if (e.target === ov) close(); });
    this.modals.push(close); return close;
  }
  // returns true if ESC was consumed (modal closed)
  handleEscape() { if (this.modals.length) { this.modals[this.modals.length - 1](); return true; } return false; }
  onShow() { for (const w of this.wins.values()) if (!w.min) w.inst.onShow?.(); }
}
