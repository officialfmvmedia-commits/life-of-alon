// Minimal canvas charts (area/line, bars, donut) with DPR scaling and smooth tweening.
function setup(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 300, h = canvas.clientHeight || 150;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
  return { g, w, h };
}
export function areaChart(canvas, data, { color = '#55e392', grid = true, progress = 1, label = null, fmt = (v) => v.toFixed(0) } = {}) {
  const { g, w, h } = setup(canvas); if (!data.length) return;
  const pad = { l: 8, r: 8, t: 14, b: 18 };
  const mn = Math.min(...data) * 0.96, mx = Math.max(...data) * 1.02, rg = mx - mn || 1;
  const X = (i) => pad.l + i / (data.length - 1) * (w - pad.l - pad.r), Y = (v) => pad.t + (1 - (v - mn) / rg) * (h - pad.t - pad.b);
  if (grid) { g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 1; for (let i = 0; i <= 4; i++) { const y = pad.t + i / 4 * (h - pad.t - pad.b); g.beginPath(); g.moveTo(pad.l, y); g.lineTo(w - pad.r, y); g.stroke(); } }
  const n = Math.max(2, Math.floor(data.length * progress));
  const path = () => { g.beginPath(); for (let i = 0; i < n; i++) { const x = X(i), y = Y(data[i]); if (!i) g.moveTo(x, y); else { const px = X(i - 1), py = Y(data[i - 1]); const cx = (px + x) / 2; g.bezierCurveTo(cx, py, cx, y, x, y); } } };
  path(); g.lineTo(X(n - 1), h - pad.b); g.lineTo(X(0), h - pad.b); g.closePath();
  const gr = g.createLinearGradient(0, pad.t, 0, h - pad.b); gr.addColorStop(0, color + '55'); gr.addColorStop(1, color + '00'); g.fillStyle = gr; g.fill();
  path(); g.strokeStyle = color; g.lineWidth = 2; g.shadowColor = color; g.shadowBlur = 8; g.stroke(); g.shadowBlur = 0;
  const lx = X(n - 1), ly = Y(data[n - 1]);
  g.fillStyle = color; g.beginPath(); g.arc(lx, ly, 3.5, 0, 7); g.fill();
  g.fillStyle = color + '33'; g.beginPath(); g.arc(lx, ly, 8 + Math.sin(performance.now() / 300) * 2, 0, 7); g.fill();
  if (label) { g.font = '600 11px SpaceG, system-ui'; g.fillStyle = 'rgba(255,255,255,0.55)'; g.textAlign = 'right'; g.fillText(fmt(data[n - 1]), w - pad.r, 11); }
}
export function barChart(canvas, data, { color = '#7cf0ad', progress = 1 } = {}) {
  const { g, w, h } = setup(canvas);
  const mx = Math.max(...data) || 1, bw = (w - 16) / data.length;
  data.forEach((v, i) => {
    const bh = (v / mx) * (h - 24) * progress; const x = 8 + i * bw + bw * 0.18, y = h - 14 - bh;
    const gr = g.createLinearGradient(0, y, 0, h - 14); gr.addColorStop(0, color); gr.addColorStop(1, color + '30');
    g.fillStyle = gr; const rw = bw * 0.64, rr = Math.min(4, rw / 2);
    g.beginPath(); g.moveTo(x, h - 14); g.lineTo(x, y + rr); g.quadraticCurveTo(x, y, x + rr, y); g.lineTo(x + rw - rr, y); g.quadraticCurveTo(x + rw, y, x + rw, y + rr); g.lineTo(x + rw, h - 14); g.fill();
  });
}
export function donut(canvas, parts, { progress = 1 } = {}) {
  const { g, w, h } = setup(canvas);
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 6, total = parts.reduce((a, p) => a + p.v, 0);
  let a0 = -Math.PI / 2;
  for (const p of parts) { const a1 = a0 + (p.v / total) * Math.PI * 2 * progress; g.beginPath(); g.arc(cx, cy, R, a0, a1); g.strokeStyle = p.c; g.lineWidth = 14; g.lineCap = 'butt'; g.stroke(); a0 = a1 + 0.02; }
}
// animate an element's charts in on first show
export function tween(ms, fn) { const t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / ms); fn(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
