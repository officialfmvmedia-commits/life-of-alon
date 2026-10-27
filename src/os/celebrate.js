// Pill rain + confetti celebration overlay (canvas). Decorative only.
import { h, fmtNum, countUp } from './util.js';
export function pillRain(host, { ms = 7000 } = {}) {
  const c = document.createElement('canvas'); c.className = 'aos-rain'; host.appendChild(c);
  const dpr = Math.min(2, devicePixelRatio || 1); const W = c.width = host.clientWidth * dpr, H = c.height = host.clientHeight * dpr;
  const g = c.getContext('2d'); const cols = ['#55e392', '#f4f4ee', '#ffd23a', '#ff7a45', '#a78bfa', '#ff4f6d', '#7a9bff'];
  const P = Array.from({ length: 170 }, (_, i) => ({ x: Math.random() * W, y: -Math.random() * H * 1.2, vy: (2 + Math.random() * 5) * dpr, vx: (Math.random() - 0.5) * 2 * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2, pill: i % 3 === 0, s: (0.7 + Math.random() * 0.8) * dpr, c: cols[i % cols.length] }));
  const t0 = performance.now(); let raf;
  const step = (t) => {
    const k = (t - t0) / ms; g.clearRect(0, 0, W, H); g.globalAlpha = k > 0.8 ? Math.max(0, (1 - k) / 0.2) : 1;
    for (const p of P) {
      p.y += p.vy; p.x += p.vx + Math.sin((t / 400) + p.r) * 0.6 * dpr; p.r += p.vr; if (p.y > H + 30 && k < 0.7) { p.y = -20; p.x = Math.random() * W; }
      g.save(); g.translate(p.x, p.y); g.rotate(p.r);
      if (p.pill) { const L = 26 * p.s, R = 8 * p.s; g.beginPath(); g.roundRect(-L / 2, -R, L, R * 2, R); g.fillStyle = '#f4f4ee'; g.fill(); g.beginPath(); g.roundRect(-L / 2, -R, L / 2, R * 2, [R, 0, 0, R]); g.fillStyle = '#55e392'; g.fill(); g.strokeStyle = '#0d1d15'; g.lineWidth = 1.5 * p.s; g.beginPath(); g.roundRect(-L / 2, -R, L, R * 2, R); g.stroke(); }
      else { g.fillStyle = p.c; g.fillRect(-5 * p.s, -3 * p.s, 10 * p.s, 6 * p.s * Math.abs(Math.cos(t / 200 + p.r))); }
      g.restore();
    }
    if (k < 1) raf = requestAnimationFrame(step); else c.remove();
  };
  raf = requestAnimationFrame(step);
  return () => { cancelAnimationFrame(raf); c.remove(); };
}
export function airdropOverlay(os, { total, wallets }, onDone) {
  const stop = pillRain(os.desk, { ms: 8000 });
  const ov = h(`<div class="aos-drop"><div class="aos-drop-c"><small>alonOS broadcast</small><h1>THE AIRDROP<br>HAS LANDED</h1>
    <div class="aos-drop-n"><b>0</b><span>SOL delivered (simulated)</span></div>
    <p>${wallets} wallets · 20x–200x every balance · years of waiting are over</p><button class="aos-b2 go">See the traders →</button></div></div>`);
  os.desk.appendChild(ov); ov.animate([{ opacity: 0, transform: 'scale(1.15)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
  const n = ov.querySelector('.aos-drop-n b'); countUp(n, 0, total, 3200, (v) => fmtNum(v, 2));
  let done = false; const finish = () => { if (done) return; done = true; const a = ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }); a.onfinish = () => ov.remove(); onDone?.(); };
  ov.querySelector('.go').addEventListener('click', finish); setTimeout(finish, 9000);
  return { finish, stop };
}
