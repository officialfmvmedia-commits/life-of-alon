// Canvas texture of the alonOS desktop for the in-world monitor (matches the DOM OS layout at 1280x724).
import * as THREE from 'three';
import { ICONS } from './icons.js';

const W = 1280, H = 724;
export function makeScreenTexture(store, apps) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const imgs = {};
  let pending = 0;
  for (const a of apps) {
    const svg = (ICONS[a.icon || a.id] || '').replace('<svg ', '<svg width="128" height="128" ');
    const im = new Image(); pending++;
    im.onload = () => { if (--pending === 0) draw(); }; im.onerror = () => { --pending; };
    im.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg); imgs[a.id] = im;
  }
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const rad = (x, y, r, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, col.slice(0, 7) + '00'); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  function wallpaper(i) {
    if (i === 1) { g.fillStyle = '#1a0d12'; g.fillRect(0, 0, W, H); rad(W * 0.3, H * 0.2, W * 0.6, '#ff7a4566'); rad(W * 0.8, H * 0.8, W * 0.6, '#ff4f6d55'); return; }
    if (i === 2) { const gr = g.createLinearGradient(0, 0, W * 0.6, H * 1.2); gr.addColorStop(0, '#0b1a3a'); gr.addColorStop(0.6, '#2b0f45'); gr.addColorStop(1, '#05060a'); g.fillStyle = gr; g.fillRect(0, 0, W, H); return; }
    if (i === 3) { g.fillStyle = '#121212'; g.fillRect(0, 0, W, H); rad(W * 0.5, H * 1.2, W * 0.6, '#f2cd2a55'); return; }
    const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7); gr.addColorStop(0, '#10241a'); gr.addColorStop(1, '#060b09'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    rad(W * 0.78, H * 0.18, W * 0.55, '#2bd07a66'); rad(W * 0.12, H * 0.9, W * 0.5, '#7a4dff55');
    g.save(); g.translate(W * 0.91 - 150, H * 0.22 + 60 + 30); g.rotate(-Math.PI / 6); g.globalAlpha = 0.08;
    rr(-150, -60, 300, 120, 60); g.save(); g.clip(); g.fillStyle = '#55e392'; g.fillRect(-150, -60, 150, 120); g.fillStyle = '#f4f4ee'; g.fillRect(0, -60, 150, 120); g.restore(); g.restore();
  }
  function draw() {
    const st = store.get();
    g.globalAlpha = 1; wallpaper(st.prefs?.wallpaper || 0);
    // menubar
    g.fillStyle = 'rgba(12,15,14,0.7)'; g.fillRect(0, 0, W, 30); g.fillStyle = 'rgba(255,255,255,0.09)'; g.fillRect(0, 30, W, 1);
    g.save(); g.translate(24, 15); g.rotate(-Math.PI / 6); rr(-12, -5.5, 24, 11, 5.5); g.save(); g.clip(); g.fillStyle = '#55e392'; g.fillRect(-12, -6, 12, 12); g.fillStyle = '#f6f6f0'; g.fillRect(0, -6, 12, 12); g.restore(); g.restore();
    g.textBaseline = 'middle'; g.font = '700 13px SpaceG, system-ui'; g.fillStyle = '#eef2ef'; g.fillText('alonOS', 48, 15);
    g.font = '13px SpaceG, system-ui'; g.fillStyle = 'rgba(238,242,239,0.72)'; let mx = 112; for (const m of ['File', 'Edit', 'Vibes', 'Help']) { g.fillText(m, mx, 15); mx += g.measureText(m).width + 16; }
    const d = new Date(); const clock = d.toLocaleDateString([], { weekday: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    g.textAlign = 'right'; g.fillStyle = '#eef2ef'; g.fillText(clock, W - 110, 15);
    g.font = '12px JBM, monospace'; const bal = st.wallet.balance.toFixed(2) + ' SOL'; const bw = g.measureText(bal).width + 18;
    const bx = W - 250 - bw; rr(bx, 5, bw, 20, 8); g.fillStyle = 'rgba(139,92,255,0.22)'; g.fill(); g.strokeStyle = 'rgba(167,139,250,0.35)'; g.stroke();
    g.textAlign = 'center'; g.fillStyle = '#eef2ef'; g.fillText(bal, bx + bw / 2, 15.5);
    rr(W - 98, 5, 88, 20, 7); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fill(); g.font = '12px SpaceG, system-ui'; g.fillText('Stand up', W - 62, 15.5);
    // desktop icons
    let y = 31 + 18;
    for (const a of apps) {
      if (a.hidden) continue;
      if (imgs[a.id]?.complete) { g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 10; g.shadowOffsetY = 6; g.drawImage(imgs[a.id], 16 + 16, y + 8, 52, 52); g.restore(); }
      g.font = '11.5px SpaceG, system-ui'; g.fillStyle = '#eef2ef'; g.textAlign = 'center'; g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 3;
      const words = a.title.length > 13 ? a.title.split(' ') : [a.title]; words.forEach((wd, i) => g.fillText(wd, 16 + 42, y + 74 + i * 14)); g.shadowBlur = 0;
      y += 84 + (words.length - 1) * 14 + 10;
    }
    // dock
    const n = apps.length, dw = n * 46 + (n - 1) * 6 + 18, dx = (W - dw) / 2, dy = H - 8 - 60;
    rr(dx, dy, dw, 60, 20); g.fillStyle = 'rgba(30,34,38,0.55)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.14)'; g.stroke();
    apps.forEach((a, i) => { if (imgs[a.id]?.complete) g.drawImage(imgs[a.id], dx + 9 + i * 52, dy + 7, 46, 46); });
    // state toast
    if (st.airdropDelivered) {
      const tx = W - 350, ty = 42; rr(tx, ty, 338, 54, 14); g.fillStyle = 'rgba(28,32,36,0.85)'; g.fill(); g.strokeStyle = 'rgba(255,210,58,0.5)'; g.stroke();
      g.textAlign = 'left'; g.font = '22px system-ui'; g.fillText('🪂', tx + 14, ty + 28);
      g.font = '700 13px SpaceG, system-ui'; g.fillStyle = '#ffe27a'; g.fillText('Airdrop delivered', tx + 50, ty + 20);
      g.font = '12px SpaceG, system-ui'; g.fillStyle = '#c9d2cd'; g.fillText(`${Math.round(st.airdrop?.total || 0).toLocaleString()} SOL · ${st.airdrop?.wallets || 14} wallets · we're so back`, tx + 50, ty + 37);
    }
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    tex.needsUpdate = true;
  }
  draw();
  return { tex, draw, canvas: c };
}
