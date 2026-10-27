// NPC overlays: floating live-PnL labels, the action menu, and the coin-flight animation. Pure DOM over the canvas.
import * as THREE from 'three';

const fmt = (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + ' SOL';
const v3 = new THREE.Vector3();
export function toScreen(p, camera) {
  v3.copy(p).project(camera);
  if (!(v3.z < 1) || !Number.isFinite(v3.x) || !Number.isFinite(v3.y)) return null;
  return { x: (v3.x * 0.5 + 0.5) * innerWidth, y: (-v3.y * 0.5 + 0.5) * innerHeight };
}

export class NPCLabels {
  constructor(root) { this.root = root; this.items = []; }
  add({ id, anchor, get, small = false, title = 'PnL' }) {
    const el = document.createElement('div'); el.className = 'npc-pnl' + (small ? ' sm' : ''); el.dataset.id = id;
    el.innerHTML = `<small>${title}</small><b>+0.00 SOL</b><i>live · simulated</i>`;
    this.root.appendChild(el);
    const it = { id, anchor, get, el, b: el.querySelector('b'), last: null, op: 0, flashT: 0 };
    this.items.push(it); return it;
  }
  update(camera, playerPos, visible, dim) {
    for (const it of this.items) {
      const a = it.anchor();
      const d = Math.hypot(a.x - playerPos.x, a.z - playerPos.z);
      let op = visible ? THREE.MathUtils.clamp((5 - d) / 2.5, 0, 1) : 0;
      const s = op > 0 ? toScreen(a, camera) : null;
      if (!s) op = 0; else if (dim?.(it.id)) op *= 0.18;
      it.op = op; it.el.style.opacity = op.toFixed(3);
      if (op <= 0) { it.el.style.visibility = 'hidden'; continue; }
      it.el.style.visibility = 'visible';
      it.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) translate(-50%, -100%) scale(${(0.85 + op * 0.15).toFixed(3)})`;
      const v = it.get(); if (!Number.isFinite(v)) continue;
      if (it.last !== null && Math.abs(v - it.last) >= 0.005) { it.el.classList.remove('up', 'dn'); void it.el.offsetWidth; it.el.classList.add(v > it.last ? 'up' : 'dn'); }
      if (it.last === null || Math.abs(v - it.last) >= 0.005) { it.b.textContent = fmt(v); it.el.classList.toggle('neg', v < 0); it.last = v; }
    }
  }
}

export class ActionMenu {
  constructor(root) {
    this.el = document.createElement('div'); this.el.id = 'npc-menu'; this.el.className = 'hidden'; root.appendChild(this.el);
    this.open = false; this.sel = 0; this.items = []; this.npc = null;
  }
  show(npc, title, actions) {
    this.npc = npc; this.items = actions; this.sel = 0; this.open = true; this.armed = null;
    this.el.innerHTML = `<div class="nm-hd"><b>${title}</b><small>actions</small></div><div class="nm-list">${actions.map((a, i) => `<button class="nm-it" data-i="${i}"><span class="nm-ic">${a.icon || '•'}</span><span class="nm-l">${a.label}</span><span class="nm-s">${a.sub ? a.sub() : ''}</span><i class="nm-fill"></i></button>`).join('')}</div><div class="nm-ft"><kbd>↑↓</kbd> select <kbd>E</kbd> do it <kbd>ESC</kbd> close</div>`;
    this.el.querySelectorAll('.nm-it').forEach(b => {
      b.addEventListener('pointerenter', () => this.select(+b.dataset.i));
      b.addEventListener('click', (e) => { e.stopPropagation(); this.select(+b.dataset.i); this.activate(); });
    });
    this.el.classList.remove('hidden'); this.select(0);
    this.el.animate([{ opacity: 0, transform: this.el.style.transform + ' scale(.92)' }, { opacity: 1 }], { duration: 180 });
  }
  hide() { this.open = false; this.armed = null; this.el.classList.add('hidden'); this.onClose?.(); }
  select(i) { this.sel = (i + this.items.length) % this.items.length; this.el.querySelectorAll('.nm-it').forEach((b, k) => b.classList.toggle('on', k === this.sel)); }
  refresh() { this.el.querySelectorAll('.nm-it').forEach((b, k) => { const a = this.items[k]; b.querySelector('.nm-l').textContent = this.armed === k ? (a.confirmLabel?.() || 'Confirm?') : a.label; b.querySelector('.nm-s').textContent = a.sub ? a.sub() : ''; b.classList.toggle('armed', this.armed === k); }); }
  activate() {
    const a = this.items[this.sel]; if (!a) return;
    if (a.confirm && a.canRun?.() !== false && this.armed !== this.sel) { this.armed = this.sel; this.refresh(); clearTimeout(this._at); this._at = setTimeout(() => { this.armed = null; if (this.open) this.refresh(); }, 3000); return; }
    this.armed = null; const keep = a.run(); if (!keep) this.hide(); else this.refresh();
  }
  key(e) {
    if (!this.open) return false;
    const c = e.code;
    if (c === 'Escape' || c === 'KeyF') { this.hide(); return true; }
    if (c === 'ArrowDown' || c === 'KeyS') { this.select(this.sel + 1); this.armed = null; this.refresh(); return true; }
    if (c === 'ArrowUp' || c === 'KeyW') { this.select(this.sel - 1); this.armed = null; this.refresh(); return true; }
    if (c === 'Enter' || c === 'KeyE' || c === 'Space') { this.activate(); return true; }
    if (/^Digit[1-9]$/.test(c)) { const i = +c.slice(5) - 1; if (i < this.items.length) { this.select(i); this.activate(); } return true; }
    return true; // swallow everything else while open
  }
  update(anchor, camera) {
    if (!this.open) return;
    const s = toScreen(anchor, camera); if (!s) return;
    const x = Math.min(innerWidth - 300, Math.max(12, s.x + 60)), y = Math.min(innerHeight - 260, Math.max(12, s.y - 40));
    this.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    if (((performance.now() / 250) | 0) !== this._rt) { this._rt = (performance.now() / 250) | 0; this.refresh(); }
  }
}

// coins fly from one screen point to another along an arc; returns a promise
export function flyCoins(root, from, to, { n = 16, amount = 0 } = {}) {
  return new Promise((res) => {
    let done = 0;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i'); c.className = 'npc-coin'; c.textContent = '◎'; root.appendChild(c);
      const mx = (from.x + to.x) / 2 + (Math.random() - 0.5) * 160, my = Math.min(from.y, to.y) - 90 - Math.random() * 80;
      const a = c.animate([
        { transform: `translate(${from.x}px, ${from.y}px) scale(.4)`, opacity: 0 },
        { transform: `translate(${from.x + (Math.random() - 0.5) * 40}px, ${from.y - 20}px) scale(1)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${mx}px, ${my}px) scale(1.2)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${to.x}px, ${to.y}px) scale(.6)`, opacity: 0.2 },
      ], { duration: 900 + Math.random() * 300, delay: i * 55, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'both' });
      a.onfinish = () => { c.remove(); if (++done === n) res(); };
    }
    if (amount) {
      const t = document.createElement('div'); t.className = 'npc-gain'; t.textContent = '+' + amount.toFixed(3) + ' SOL'; root.appendChild(t);
      t.animate([{ transform: `translate(${to.x}px, ${to.y}px) translate(-50%,0)`, opacity: 0 }, { transform: `translate(${to.x}px, ${to.y - 30}px) translate(-50%,0)`, opacity: 1, offset: 0.25 }, { transform: `translate(${to.x}px, ${to.y - 80}px) translate(-50%,0)`, opacity: 0 }], { duration: 2000, delay: 900, fill: 'both' }).onfinish = () => t.remove();
    }
  });
}
