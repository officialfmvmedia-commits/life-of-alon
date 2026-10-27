// Shared helpers for alonOS: seeded RNG, fictional addresses, avatars, formatting, DOM.
export function mulberry(seed) {
  let a = typeof seed === 'string' ? hashStr(seed) : seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
export const rnd = (a, b, r = Math.random) => a + (b - a) * r();
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Fictional base58-looking address (random, not derived from any key, not valid on any chain).
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function fakeAddress(seed) { const r = mulberry('addr:' + seed); let s = ''; for (let i = 0; i < 44; i++) s += B58[Math.floor(r() * 58)]; return s; }
export const shortAddr = (a) => a.slice(0, 4) + '…' + a.slice(-4);
export function fakeSig(seed) { const r = mulberry('sig:' + seed); let s = ''; for (let i = 0; i < 64; i++) s += B58[Math.floor(r() * 58)]; return s; }

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmtNum = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtUSD = (n, d = 0) => '$' + fmtNum(n, d);
export function fmtCompact(n) { const a = Math.abs(n); if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'; if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'; if (a >= 1e4) return (n / 1e3).toFixed(1) + 'K'; return fmtNum(n, a < 10 && !Number.isInteger(n) ? 1 : 0); }
export const fmtSOL = (n) => fmtNum(n, n < 10 ? 3 : 2) + ' SOL';
export function timeAgo(ts) { const s = Math.max(0, (Date.now() - ts) / 1000); if (s < 10) return 'now'; if (s < 60) return Math.floor(s) + 's'; if (s < 3600) return Math.floor(s / 60) + 'm'; if (s < 86400) return Math.floor(s / 3600) + 'h'; return Math.floor(s / 86400) + 'd'; }

export function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

// Procedural avatar: blob face on a gradient, deterministic per handle.
const PAL = [['#ff7a45', '#ffd23a'], ['#55e392', '#1f6b45'], ['#7a4dff', '#ff4fa0'], ['#3aa0ff', '#7cf0ad'], ['#e8452c', '#2b1a40'], ['#f2cd2a', '#e8452c'], ['#1d3fd8', '#9fd0ff'], ['#2f2f35', '#8a8a95'], ['#c2462e', '#ffd9a0'], ['#0f2a1d', '#55e392']];
export function avatar(seed, size = 40) {
  const r = mulberry('av:' + seed); const [a, b] = pick(PAL, r);
  const skin = pick(['#f1d2bd', '#e4b596', '#c98f68', '#8d5a3b', '#f6e0cf', '#ead9cb'], r);
  const eyes = Math.floor(r() * 4), mouth = Math.floor(r() * 4), hat = r() < 0.35, shades = r() < 0.3;
  const ang = Math.floor(r() * 360);
  let face = `<circle cx="32" cy="36" r="17" fill="${skin}"/>`;
  if (shades) face += `<rect x="18" y="29" width="28" height="8" rx="4" fill="#111"/>`;
  else face += eyes === 0 ? `<circle cx="26" cy="33" r="2.4" fill="#111"/><circle cx="38" cy="33" r="2.4" fill="#111"/>` : eyes === 1 ? `<path d="M23 33h6M35 33h6" stroke="#111" stroke-width="2.4" stroke-linecap="round"/>` : eyes === 2 ? `<circle cx="26" cy="33" r="3.4" fill="#fff"/><circle cx="38" cy="33" r="3.4" fill="#fff"/><circle cx="26.6" cy="33.4" r="1.8" fill="#111"/><circle cx="38.6" cy="33.4" r="1.8" fill="#111"/>` : `<path d="M23 34q3-3 6 0M35 34q3-3 6 0" stroke="#111" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  face += mouth === 0 ? `<path d="M26 42q6 5 12 0" stroke="#111" stroke-width="2.2" fill="none" stroke-linecap="round"/>` : mouth === 1 ? `<ellipse cx="32" cy="43" rx="4" ry="3" fill="#5a1d1d"/>` : mouth === 2 ? `<path d="M27 43h10" stroke="#111" stroke-width="2.2" stroke-linecap="round"/>` : `<path d="M26 41q6 7 12 0z" fill="#5a1d1d"/>`;
  if (hat) face += `<path d="M14 26q18-16 36 0z" fill="${b}"/><rect x="12" y="25" width="40" height="4" rx="2" fill="${a}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}"><defs><linearGradient id="g" gradientTransform="rotate(${ang} .5 .5)"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="64" height="64" rx="32" fill="url(#g)"/>${face}</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
// Alon's own avatar: grey hair, yellow bandana, white oval shades.
export function alonAvatar(size = 40) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#55e392"/><stop offset="1" stop-color="#0f2a1d"/></linearGradient></defs><rect width="64" height="64" rx="32" fill="url(#g)"/><path d="M13 30q0-18 19-18t19 18v20h-6V34H19v16h-6z" fill="#a9a49d"/><circle cx="32" cy="35" r="15" fill="#ead9cb"/><path d="M15 28q17-20 34 0z" fill="#f2cd2a"/><path d="M32 12q14 2 17 16H32z" fill="#151515"/><rect x="14" y="25" width="36" height="5" rx="2" fill="#f2cd2a"/><ellipse cx="25.5" cy="35" rx="6.5" ry="4.6" fill="#fff"/><ellipse cx="38.5" cy="35" rx="6.5" ry="4.6" fill="#fff"/><ellipse cx="25.5" cy="35" rx="4.8" ry="3.2" fill="#111"/><ellipse cx="38.5" cy="35" rx="4.8" ry="3.2" fill="#111"/><path d="M29 44h6" stroke="#222" stroke-width="2" stroke-linecap="round"/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// tiny SVG sparkline path
export function sparkPath(data, w, hgt, pad = 2) {
  const mn = Math.min(...data), mx = Math.max(...data), rg = mx - mn || 1;
  return data.map((v, i) => `${i ? 'L' : 'M'}${(pad + i / (data.length - 1) * (w - pad * 2)).toFixed(1)},${(pad + (1 - (v - mn) / rg) * (hgt - pad * 2)).toFixed(1)}`).join('');
}
export function countUp(el, from, to, ms, fmt) {
  const t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
