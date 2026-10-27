// Procedural canvas textures (no external image files).
import * as THREE from 'three';

let maxAniso = 8;
export function setAniso(a) { maxAniso = a; }

export function canvasTex(w, h, draw, { srgb = true, repeat = null } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// seeded random so the mess is the same every load
let _s = 1337;
export function rand() { _s = (_s * 16807) % 2147483647; return (_s - 1) / 2147483646; }
export const rr = (a, b) => a + (b - a) * rand();

function noise(g, w, h, amt, alpha = 0.06) {
  for (let i = 0; i < amt; i++) {
    const v = rand() > 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${rand() * alpha})`;
    g.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }
}

// ---------- Alon's clothes ----------
export function tankTex() {
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#f3f2ee'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 9000, 0.035);
    // subtle rib lines
    g.strokeStyle = 'rgba(0,0,0,0.025)';
    for (let x = 0; x < w; x += 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    // text centred at u = 0.5 (front)
    g.fillStyle = '#111';
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const cx = w * 0.5;
    g.font = '96px Anton';
    g.save(); g.translate(cx, 0); g.scale(0.62, 1);
    g.fillText('STOP', 0, 210);
    g.font = '86px Anton'; g.fillText('BEING', 0, 292);
    g.font = '80px Anton'; g.fillText('POOR', 0, 370);
    g.restore();
  });
}

export function denimTex() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#86a6c9'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) {
      const l = rand();
      g.fillStyle = l > 0.5 ? `rgba(230,240,255,${rand() * 0.18})` : `rgba(30,50,90,${rand() * 0.18})`;
      g.fillRect(rand() * w, rand() * h, 1, 3 + rand() * 4);
    }
    // fades
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, 'rgba(40,60,100,0.25)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(40,60,100,0.25)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // side seams
    g.strokeStyle = 'rgba(200,150,80,0.55)'; g.setLineDash([6, 5]); g.lineWidth = 2;
    for (const x of [w * 0.25, w * 0.75]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  }, { repeat: [1, 1] });
}

function drawSnake(g, cx, cy, s) {
  // coiled rattlesnake (Gadsden-style, stylised)
  g.save(); g.translate(cx, cy); g.scale(s, s);
  g.lineCap = 'round'; g.lineJoin = 'round';
  // ground tuft
  g.fillStyle = '#3f6b2a';
  g.beginPath(); g.ellipse(0, 60, 75, 12, 0, 0, Math.PI * 2); g.fill();
  const path = () => {
    g.beginPath();
    let first = true;
    for (let t = 0; t <= 1; t += 0.01) {
      const a = t * Math.PI * 5.2;
      const r = 54 - t * 44;
      const x = Math.cos(a) * r * 1.15;
      const y = 40 - t * 70 + Math.sin(a) * r * 0.42;
      if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y);
    }
    // neck up to head
    g.quadraticCurveTo(30, -60, 10, -78);
  };
  g.strokeStyle = '#151515'; g.lineWidth = 22; path(); g.stroke();
  g.strokeStyle = '#3c3a22'; g.lineWidth = 15; path(); g.stroke();
  g.strokeStyle = '#d7c56a'; g.lineWidth = 3; g.setLineDash([4, 7]); path(); g.stroke(); g.setLineDash([]);
  // head
  g.fillStyle = '#151515';
  g.beginPath(); g.ellipse(-4, -82, 18, 11, -0.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c2462e';
  g.beginPath(); g.moveTo(-20, -88); g.lineTo(-34, -94); g.moveTo(-20, -88); g.lineTo(-33, -84); g.strokeStyle = '#c2462e'; g.lineWidth = 3; g.stroke();
  // rattle
  g.fillStyle = '#c9a54a';
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(-64 - i * 7, 40 - i * 6, 6, 4, 0.6, 0, Math.PI * 2); g.fill(); }
  g.restore();
}

export function capTex() {
  // sphere-cap UV: u around (u=0.25 front, +z), v from top (0) to rim (1)
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#121212'; g.fillRect(0, 0, w, h);
    // faded gold scroll pattern on black panel
    g.globalAlpha = 0.28; g.strokeStyle = '#b8902f'; g.lineWidth = 6;
    for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(560 + i * 50, 200 + Math.sin(i) * 80, 30 + (i % 3) * 14, 0, 4.5); g.stroke(); }
    g.globalAlpha = 1;
    // yellow panel from u=0.02..0.40 (front-left side of head)
    g.fillStyle = '#f3cf2c'; g.fillRect(0, 0, w * 0.43, h);
    g.fillStyle = '#f3cf2c'; g.fillRect(w * 0.93, 0, w * 0.07, h);
    noise(g, w, h, 8000, 0.08);
    // seam
    g.fillStyle = '#c9a51e'; g.fillRect(w * 0.43, 0, 6, h);
    drawSnake(g, w * 0.17, h * 0.58, 1.35);
  });
}

export function bandTex() {
  // cylinder band UV with thetaStart=PI so u=0.5 is front
  return canvasTex(2048, 128, (g, w, h) => {
    g.fillStyle = '#f2cd2a'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 6000, 0.08);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 8, w, 8);
    g.fillStyle = '#141414'; g.font = 'bold 78px ArchivoBlack, serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.save(); g.translate(w * 0.56, h * 0.54); g.scale(0.9, 1); g.fillText("DON'T TREAD ON ME", 0, 0); g.restore();
    g.save(); g.translate(w * 0.06, h * 0.54); g.scale(0.9, 1); g.fillText("ON ME", 0, 0); g.restore();
  });
}

// ---------- office ----------
export function woodFloorTex() {
  return canvasTex(1024, 1024, (g, w, h) => {
    const rows = 16; const ph = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rand() * 400;
      while (x < w) {
        const len = 300 + rand() * 420;
        const l = 0.82 + rand() * 0.28;
        g.fillStyle = `rgb(${150 * l | 0},${100 * l | 0},${62 * l | 0})`;
        g.fillRect(x, r * ph, len, ph);
        // grain
        for (let k = 0; k < 40; k++) {
          g.strokeStyle = `rgba(60,30,10,${rand() * 0.18})`; g.lineWidth = 1 + rand() * 2;
          const yy = r * ph + rand() * ph;
          g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + len * 0.3, yy + rr(-6, 6), x + len * 0.7, yy + rr(-6, 6), x + len, yy); g.stroke();
        }
        g.fillStyle = 'rgba(20,10,5,0.55)'; g.fillRect(x, r * ph, 3, ph);
        x += len;
      }
      g.fillStyle = 'rgba(20,10,5,0.6)'; g.fillRect(0, r * ph, w, 3);
    }
    noise(g, w, h, 20000, 0.05);
  }, { repeat: [6, 4.5] });
}

export function wallTex(base = '#d9cfbd') {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    noise(g, w, h, 30000, 0.035);
    for (let i = 0; i < 14; i++) { // scuffs
      g.fillStyle = `rgba(60,50,40,${rand() * 0.05})`;
      g.beginPath(); g.ellipse(rand() * w, h * 0.6 + rand() * h * 0.4, 10 + rand() * 40, 3 + rand() * 8, rand(), 0, 7); g.fill();
    }
  }, { repeat: [3, 1] });
}

export function rugTex() {
  return canvasTex(1024, 640, (g, w, h) => {
    g.fillStyle = '#2f4f45'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d9b66a'; g.lineWidth = 18; g.strokeRect(40, 40, w - 80, h - 80);
    g.strokeStyle = '#a8432f'; g.lineWidth = 10; g.strokeRect(80, 80, w - 160, h - 160);
    g.fillStyle = '#d9b66a';
    for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) {
      const x = 170 + i * 115, y = 170 + j * 100;
      g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillRect(-18, -18, 36, 36); g.restore();
    }
    noise(g, w, h, 40000, 0.12);
  });
}

export function cityTex(seed = 0) {
  return canvasTex(1024, 768, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#060a18'); sky.addColorStop(0.55, '#182246'); sky.addColorStop(1, '#3b2a4a');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${rand() * 0.5})`; g.fillRect(rand() * w, rand() * h * 0.4, 1.5, 1.5); }
    // moon
    g.fillStyle = '#fff6d8'; g.shadowColor = '#fff6d8'; g.shadowBlur = 40;
    g.beginPath(); g.arc(160 + seed * 300, 120, 34, 0, 7); g.fill(); g.shadowBlur = 0;
    const layers = [[0.42, '#141a33', 0.4], [0.55, '#0d1226', 0.7], [0.7, '#070a17', 1]];
    for (const [top, col, lit] of layers) {
      let x = -20;
      while (x < w) {
        const bw = 40 + rand() * 110, bh = h * (1 - top) * (0.4 + rand() * 0.9);
        const y = h - bh;
        g.fillStyle = col; g.fillRect(x, y, bw, bh);
        for (let wy = y + 12; wy < h - 6; wy += 20) for (let wx = x + 8; wx < x + bw - 8; wx += 16) {
          if (rand() < 0.22 * lit) {
            const c = rand(); g.fillStyle = c < 0.7 ? `rgba(255,214,140,${0.5 + rand() * 0.5})` : c < 0.9 ? 'rgba(160,220,255,0.8)' : 'rgba(110,240,160,0.9)';
            g.fillRect(wx, wy, 8, 10);
          }
        }
        if (rand() < 0.2) { g.fillStyle = '#ff4040'; g.fillRect(x + bw / 2, y - 6, 3, 3); }
        x += bw + rand() * 8;
      }
    }
  });
}

export function batonPoster(variant = 0) {
  return canvasTex(512, 720, (g, w, h) => {
    const bgs = ['#e8452c', '#101010', '#f2ead8', '#1d3fd8'];
    const fgs = ['#fff4e0', '#f2cd2a', '#141414', '#ffffff'];
    const bg = bgs[variant % 4], fg = fgs[variant % 4];
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    noise(g, w, h, 12000, 0.08);
    g.fillStyle = fg; g.strokeStyle = fg;
    g.textAlign = 'center';
    if (variant % 4 === 0) {
      // baton icon
      g.save(); g.translate(w / 2, 250); g.rotate(-0.6);
      g.fillRect(-18, -170, 36, 340); g.beginPath(); g.arc(0, -170, 30, 0, 7); g.fill(); g.restore();
      g.font = '150px Anton'; g.fillText('BATON', w / 2, 560);
      g.font = '26px JBM'; g.fillText('PASS IT ON.', w / 2, 610);
      g.font = '18px JBM'; g.globalAlpha = 0.7; g.fillText('BATON CORPORATION · EST. ????', w / 2, 680);
    } else if (variant % 4 === 1) {
      g.font = '210px Anton'; g.save(); g.translate(w / 2, 360); g.rotate(-Math.PI / 2); g.fillText('BATON', 0, 70); g.restore();
      g.font = '22px JBM'; g.fillText('WE RUN THINGS.', w / 2, 680);
    } else if (variant % 4 === 2) {
      g.lineWidth = 14; g.strokeRect(30, 30, w - 60, h - 60);
      g.font = '120px Anton'; g.fillText('BATON', w / 2, 200);
      g.font = '28px ArchivoBlack'; g.fillText('CORPORATION', w / 2, 248);
      for (let i = 0; i < 5; i++) { g.save(); g.translate(w / 2 - 160 + i * 80, 450); g.rotate(-0.5); g.fillRect(-8, -90, 16, 180); g.restore(); }
      g.font = '22px JBM'; g.fillText('THE HANDOFF IS EVERYTHING', w / 2, 640);
    } else {
      g.font = '130px Anton'; g.fillText('B', w / 2, 300);
      g.beginPath(); g.arc(w / 2, 255, 120, 0, 7); g.lineWidth = 10; g.stroke();
      g.font = '96px Anton'; g.fillText('BATON', w / 2, 520);
      g.font = '20px JBM'; g.fillText('EMPLOYEE OF THE MONTH: ???', w / 2, 600);
    }
    // tape corners
    g.fillStyle = 'rgba(240,230,200,0.75)';
    for (const [x, y, r] of [[30, 20, -0.5], [w - 30, 20, 0.5]]) { g.save(); g.translate(x, y); g.rotate(r); g.fillRect(-36, -12, 72, 24); g.restore(); }
  });
}

export function chartTex(seed = 0, accent = '#4be08a') {
  // decorative only: candles with no axes or numbers
  return canvasTex(512, 320, (g, w, h) => {
    g.fillStyle = '#07100b'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(80,200,130,0.08)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    let v = h * 0.75;
    for (let i = 0; i < 38; i++) {
      const up = rand() < 0.66;
      const o = v, c = v + (up ? -1 : 1) * rr(4, 22);
      const hi = Math.min(o, c) - rr(2, 12), lo = Math.max(o, c) + rr(2, 12);
      const x = 14 + i * 13;
      g.fillStyle = g.strokeStyle = up ? accent : '#ef4f5a';
      g.beginPath(); g.moveTo(x + 4, hi); g.lineTo(x + 4, lo); g.stroke();
      g.fillRect(x, Math.min(o, c), 9, Math.max(2, Math.abs(c - o)));
      v = Math.max(30, Math.min(h - 30, c));
    }
    g.fillStyle = 'rgba(75,224,138,0.9)'; g.font = '16px JBM'; g.fillText('● LIVE-ish', 14, 24);
  });
}

export function codeTex() {
  return canvasTex(512, 320, (g, w, h) => {
    g.fillStyle = '#0d1117'; g.fillRect(0, 0, w, h);
    g.font = '13px JBM';
    const cols = ['#ff7b72', '#79c0ff', '#d2a8ff', '#7ee787', '#c9d1d9', '#8b949e'];
    for (let y = 22; y < h; y += 18) {
      let x = 14 + (rand() * 4 | 0) * 16;
      const n = 2 + rand() * 5 | 0;
      for (let k = 0; k < n; k++) { const len = 20 + rand() * 70; g.fillStyle = cols[rand() * cols.length | 0]; g.fillRect(x, y - 9, len, 8); x += len + 8; }
    }
  });
}

export function mainScreenTex() {
  return canvasTex(768, 448, (g, w, h) => {
    const gr = g.createRadialGradient(w * 0.7, h * 0.2, 10, w * 0.5, h * 0.5, w * 0.8);
    gr.addColorStop(0, '#1f6b45'); gr.addColorStop(0.5, '#0f2a1d'); gr.addColorStop(1, '#06100a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(10,15,12,0.8)'; g.fillRect(0, 0, w, 26);
    g.fillStyle = '#cfe9da'; g.font = 'bold 14px SpaceG'; g.fillText('alonOS', 54, 18);
    g.save(); g.translate(28, 13); g.rotate(-0.5); g.fillStyle = '#55e392'; g.fillRect(-14, -5, 14, 10); g.fillStyle = '#f6f6f0'; g.fillRect(0, -5, 14, 10); g.restore();
    g.fillStyle = 'rgba(11,16,14,0.95)'; g.fillRect(150, 70, 470, 300);
    g.fillStyle = '#161c19'; g.fillRect(150, 70, 470, 24);
    g.fillStyle = '#55e392'; g.font = '64px Anton'; g.textAlign = 'center'; g.fillText('COMING SOON', 385, 250);
    g.font = '14px JBM'; g.fillStyle = '#5f8f74'; g.fillText('alon@hq:~$ ./launch --everything', 385, 160);
    g.textAlign = 'left';
    for (let i = 0; i < 4; i++) { g.fillStyle = ['#0d1210', '#ffe9a6', '#e8452c', '#2b3330'][i]; g.fillRect(40, 60 + i * 80, 46, 46); }
  });
}

export function whiteboardTex(done = false) {
  return canvasTex(1024, 600, (g, w, h) => {
    g.fillStyle = '#f4f5f2'; g.fillRect(0, 0, w, h);
    // ghosted old marker
    g.globalAlpha = 0.08; g.fillStyle = '#334'; g.font = '60px Marker';
    g.fillText('old idea lol', 520, 520); g.fillText('???', 120, 520); g.globalAlpha = 1;
    g.font = '54px Marker'; g.fillStyle = '#1b3fae'; g.fillText('ROADMAP', 50, 80);
    g.strokeStyle = '#1b3fae'; g.lineWidth = 5; g.beginPath(); g.moveTo(50, 95); g.lineTo(330, 92); g.stroke();
    g.font = '34px Marker'; g.fillStyle = '#222';
    g.fillText('1. promise airdrop', 60, 160);
    g.fillText('2. AIRDROP', 60, 215);
    g.fillText('3. ???', 60, 270);
    g.fillStyle = '#1f9d55'; g.fillText('4. crime shitty narrative', 60, 325);
    { const tw = g.measureText('2. AIRDROP').width;
      if (!done) { g.strokeStyle = '#d33'; g.lineWidth = 4; g.beginPath(); g.moveTo(52, 202); g.lineTo(60 + tw + 12, 206); g.stroke(); }
      else { g.strokeStyle = '#1f9d55'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(96 + tw, 196); g.lineTo(110 + tw, 214); g.lineTo(140 + tw, 172); g.stroke(); g.lineCap = 'butt';
        g.save(); g.translate(160 + tw, 205); g.rotate(-0.06); g.font = '30px Marker'; g.fillStyle = '#1f9d55'; g.fillText('DELIVERED!!', 0, 0); g.restore(); } }
    // doodled candles going up
    g.lineWidth = 4;
    let y = 470;
    for (let i = 0; i < 9; i++) {
      const up = i !== 3 && i !== 6;
      g.strokeStyle = g.fillStyle = up ? '#1f9d55' : '#d33';
      const x = 520 + i * 48, hh = 30 + rand() * 40;
      g.strokeRect(x, up ? y - hh : y, 26, hh);
      y += up ? -hh * 0.8 : hh * 0.6;
    }
    g.strokeStyle = '#1f9d55'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(520, 520); g.quadraticCurveTo(800, 500, 960, 130); g.stroke();
    g.beginPath(); g.moveTo(960, 130); g.lineTo(925, 150); g.moveTo(960, 130); g.lineTo(965, 172); g.stroke();
    g.font = '40px Marker'; g.fillStyle = '#d33'; g.save(); g.translate(720, 90); g.rotate(-0.08); g.fillText('DO NOT ERASE!!', 0, 0); g.restore();
    // pill doodle
    g.save(); g.translate(880, 430); g.rotate(-0.7); g.lineWidth = 5; g.strokeStyle = '#1f9d55';
    g.beginPath(); g.arc(-30, 0, 24, Math.PI / 2, Math.PI * 1.5); g.lineTo(30, -24); g.arc(30, 0, 24, -Math.PI / 2, Math.PI / 2); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(0, -24); g.lineTo(0, 24); g.stroke(); g.restore();
    g.font = '28px Marker'; g.fillStyle = '#555'; g.fillText('alon was here', 60, 560);
  });
}

export function pizzaTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#d6b88a'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 4000, 0.1);
    g.strokeStyle = '#a8332a'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h / 2, 80, 0, 7); g.stroke();
    g.fillStyle = '#a8332a'; g.font = '34px Marker'; g.textAlign = 'center'; g.fillText('PIZZA', w / 2, h / 2 + 4);
    g.font = '16px Marker'; g.fillText('hot & fresh!', w / 2, h / 2 + 32);
    g.fillStyle = 'rgba(120,80,30,0.25)'; g.beginPath(); g.ellipse(60, 190, 40, 22, 0.4, 0, 7); g.fill();
  });
}

export function canTex(color, accent) {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = accent; g.beginPath(); g.moveTo(0, 90); g.lineTo(80, 30); g.lineTo(140, 80); g.lineTo(256, 20); g.lineTo(256, 50); g.lineTo(140, 110); g.lineTo(80, 60); g.lineTo(0, 120); g.fill();
    g.fillStyle = '#fff'; g.font = '30px Anton'; g.fillText('VOLT', 90, 70);
  });
}

export function paperTex(kind = 0) {
  return canvasTex(128, 170, (g, w, h) => {
    g.fillStyle = kind === 1 ? '#fff3a8' : '#f6f4ee'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(30,30,40,0.35)';
    for (let y = 18; y < h - 10; y += 9) g.fillRect(10, y, 40 + rand() * 70, 2);
  });
}

export function hqSignTex() {
  return canvasTex(1024, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '150px Marker'; g.fillStyle = '#f6f2e6';
    g.shadowColor = '#55e392'; g.shadowBlur = 24;
    g.fillText('the HQ', w / 2, h / 2);
  });
}

export function stickyTex(text, color = '#ffe66d') {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = '#333'; g.font = '22px Marker'; g.textAlign = 'center';
    text.split('\n').forEach((l, i) => g.fillText(l, w / 2, 48 + i * 28));
  });
}

export function bookTex() {
  return canvasTex(256, 64, (g, w, h) => {
    const cols = ['#7a2e2e', '#2e4a7a', '#2f6b47', '#c9a54a', '#3a3a3a', '#b24f2a', '#5a3f7a'];
    let x = 0;
    while (x < w) { const bw = 8 + rand() * 18; g.fillStyle = cols[rand() * cols.length | 0]; g.fillRect(x, rand() * 10, bw, h); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x + 2, 20, bw - 4, 3); x += bw + 1; }
  });
}

export function arcadeTex() {
  return canvasTex(256, 320, (g, w, h) => {
    g.fillStyle = '#05060f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${rand()})`; g.fillRect(rand() * w, rand() * h, 2, 2); }
    g.textAlign = 'center'; g.fillStyle = '#ffd23a'; g.font = '34px Anton'; g.fillText('PILL', w / 2, 70); g.fillText('BLASTER', w / 2, 108);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      g.save(); g.translate(40 + c * 44, 150 + r * 30); g.rotate(-0.6);
      g.fillStyle = '#55e392'; g.fillRect(-12, -5, 12, 10); g.fillStyle = '#f4f4ee'; g.fillRect(0, -5, 12, 10); g.restore();
    }
    g.fillStyle = '#ff4fa0'; g.beginPath(); g.moveTo(w / 2, 260); g.lineTo(w / 2 - 14, 285); g.lineTo(w / 2 + 14, 285); g.fill();
    g.fillStyle = '#fff'; g.font = '14px JBM'; g.fillText('INSERT COIN', w / 2, 310);
  });
}
export function marqueeTex() {
  return canvasTex(512, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#ff4fa0'); gr.addColorStop(1, '#7a4dff');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = '72px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PILL BLASTER', w / 2, h / 2 + 4);
  });
}
export function tvTex() {
  return canvasTex(512, 288, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a6df0'); gr.addColorStop(1, '#9fd0ff');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3aa655'; g.fillRect(0, h * 0.72, w, h * 0.28);
    g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(60 + i * 110, 50 + (i % 2) * 20, 40, 14, 0, 0, 7); g.fill(); }
    g.fillStyle = '#c65'; g.fillRect(230, h * 0.72 - 40, 28, 40);
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = '64px Anton'; g.textAlign = 'center'; g.fillText('PAUSED', w / 2, h / 2 + 20);
  });
}
export function clockTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f4f1e8'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
    g.fillStyle = '#222';
    for (let i = 0; i < 12; i++) { g.save(); g.translate(128, 128); g.rotate(i / 12 * Math.PI * 2); g.fillRect(-3, -112, 6, i % 3 ? 12 : 22); g.restore(); }
    g.font = '22px Marker'; g.textAlign = 'center'; g.fillStyle = '#1f9d55'; g.fillText('it is always', 128, 90); g.fillText('launch o\'clock', 128, 182);
  });
}

// ---------- non-BATON wall posters ----------
function tape(g, w) {
  g.fillStyle = 'rgba(240,230,200,0.75)';
  for (const [x, y, r] of [[30, 20, -0.5], [w - 30, 20, 0.5]]) { g.save(); g.translate(x, y); g.rotate(r); g.fillRect(-36, -12, 72, 24); g.restore(); }
}
function pill(g, cx, cy, len, rad, rot) {
  g.save(); g.translate(cx, cy); g.rotate(rot);
  const half = len / 2 - rad;
  const body = () => { g.beginPath(); g.arc(-half, 0, rad, Math.PI / 2, Math.PI * 1.5); g.arc(half, 0, rad, -Math.PI / 2, Math.PI / 2); g.closePath(); };
  g.save(); body(); g.clip();
  g.fillStyle = '#f4f4ef'; g.fillRect(-len, -rad, len, rad * 2);
  g.fillStyle = '#3ddc84'; g.fillRect(0, -rad, len, rad * 2);
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-len, -rad * 0.75, len * 2, rad * 0.3);
  g.restore();
  body(); g.lineWidth = 8; g.strokeStyle = '#111'; g.stroke();
  g.beginPath(); g.moveTo(0, -rad); g.lineTo(0, rad); g.stroke();
  g.restore();
}
function wrapLines(g, lines, x, y, lh) { lines.forEach((l, i) => g.fillText(l, x, y + i * lh)); }

// kind: 'missing' | 'rug' | 'poor' | 'hang' | 'trust'
export function funPoster(kind) {
  return canvasTex(512, 720, (g, w, h) => {
    g.textAlign = 'center';
    if (kind === 'missing') {
      g.fillStyle = '#f4efe2'; g.fillRect(0, 0, w, h); noise(g, w, h, 14000, 0.07);
      g.fillStyle = '#111'; g.font = '132px Anton'; g.fillText('MISSING', w / 2, 150);
      // "photo": a dashed box with a parachute crate
      g.fillStyle = '#d9d2c0'; g.fillRect(86, 180, w - 172, 250);
      g.strokeStyle = '#111'; g.lineWidth = 4; g.strokeRect(86, 180, w - 172, 250);
      g.beginPath(); g.arc(w / 2, 270, 80, Math.PI, 0); g.fillStyle = '#e8452c'; g.fill(); g.stroke();
      g.beginPath(); for (const dx of [-78, -30, 30, 78]) { g.moveTo(w / 2 + dx, 270); g.lineTo(w / 2, 345); } g.stroke();
      g.fillStyle = '#3ddc84'; g.fillRect(w / 2 - 34, 340, 68, 56); g.strokeRect(w / 2 - 34, 340, 68, 56);
      g.fillStyle = '#111'; g.font = '22px JBM'; g.fillText('$', w / 2, 376);
      g.font = '58px Anton'; g.fillText('THE AIRDROP', w / 2, 500);
      g.font = '22px JBM'; wrapLines(g, ['LAST SEEN: 2024', 'ANSWERS TO "SOON™"', 'IF FOUND, CALL ALON'], w / 2, 548, 32);
      g.font = '15px JBM'; g.globalAlpha = 0.65; g.fillText('(he will not pick up)', w / 2, 660); g.globalAlpha = 1;
      // tear-off tabs
      g.setLineDash([6, 6]); g.beginPath(); g.moveTo(20, 680); g.lineTo(w - 20, 680); g.stroke(); g.setLineDash([]);
      tape(g, w);
    } else if (kind === 'rug') {
      g.fillStyle = '#ffd23a'; g.fillRect(0, 0, w, h); noise(g, w, h, 9000, 0.06);
      g.strokeStyle = '#111'; g.lineWidth = 16; g.strokeRect(22, 22, w - 44, h - 44);
      g.fillStyle = '#111'; g.fillRect(22, 22, w - 44, 120);
      g.fillStyle = '#ffd23a'; g.font = '64px Anton'; g.fillText('⚠ SAFETY FIRST', w / 2, 108);
      g.fillStyle = '#fff'; g.fillRect(126, 190, w - 252, 250); g.lineWidth = 8; g.strokeRect(126, 190, w - 252, 250);
      g.fillStyle = '#c8202e'; g.font = '240px Anton'; g.fillText('0', w / 2, 410);
      g.fillStyle = '#111'; g.font = '62px Anton'; g.fillText('DAYS SINCE', w / 2, 520); g.fillText('LAST RUG', w / 2, 590);
      g.font = '18px JBM'; g.fillText('PREVIOUS RECORD: 0', w / 2, 650);
    } else if (kind === 'poor') {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0d2a1e'); gr.addColorStop(1, '#04100b');
      g.fillStyle = gr; g.fillRect(0, 0, w, h); noise(g, w, h, 10000, 0.07);
      const rg = g.createRadialGradient(w / 2, 280, 10, w / 2, 280, 230); rg.addColorStop(0, 'rgba(61,220,132,0.45)'); rg.addColorStop(1, 'rgba(61,220,132,0)');
      g.fillStyle = rg; g.fillRect(0, 0, w, h);
      pill(g, w / 2, 280, 300, 70, -0.5);
      g.strokeStyle = '#f2cd2a'; g.lineWidth = 3; g.strokeRect(40, 40, w - 80, h - 80);
      g.fillStyle = '#ffffff'; g.font = '92px Anton'; g.fillText('STOP BEING', w / 2, 515);
      g.fillStyle = '#f2cd2a'; g.font = '128px Anton'; g.fillText('POOR', w / 2, 630);
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = '16px JBM'; g.fillText('— MOTIVATION DEPT. · PILL FACTORY', w / 2, 668);
    } else if (kind === 'hang') {
      g.fillStyle = '#7ec8ef'; g.fillRect(0, 0, w, h);
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#5bb2e6'); sky.addColorStop(1, '#f6d7a8'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      noise(g, w, h, 8000, 0.05);
      // cliff on the left
      g.fillStyle = '#4a3a2c'; g.beginPath(); g.moveTo(0, 220); g.lineTo(250, 220); g.lineTo(230, 260); g.lineTo(260, 340); g.lineTo(210, 480); g.lineTo(230, h); g.lineTo(0, h); g.closePath(); g.fill();
      g.fillStyle = '#3c8f4a'; g.fillRect(0, 210, 252, 14);
      // the chart line going up then off the cliff, dangling
      g.strokeStyle = '#3ddc84'; g.lineWidth = 12; g.lineJoin = 'round'; g.lineCap = 'round';
      g.beginPath(); g.moveTo(20, 205); g.lineTo(80, 180); g.lineTo(130, 195); g.lineTo(190, 140); g.lineTo(240, 205); g.stroke();
      g.strokeStyle = '#e8452c';
      g.beginPath(); g.moveTo(240, 205); g.quadraticCurveTo(290, 215, 300, 280); g.lineTo(305, 420); g.stroke();
      // tiny candle hanging on by the wick
      g.fillStyle = '#e8452c'; g.fillRect(290, 420, 30, 70); g.fillRect(303, 490, 4, 20);
      g.fillStyle = '#111'; g.font = '86px Anton'; g.fillText('HANG IN', 370, 590 - 20); g.fillText('THERE', 370, 660 - 20);
      g.textAlign = 'center'; g.font = '16px JBM'; g.fillText('liquidity is a state of mind', w / 2, 690);
      tape(g, w);
    } else {
      // 'trust' — fake award certificate
      g.fillStyle = '#101010'; g.fillRect(0, 0, w, h); noise(g, w, h, 10000, 0.08);
      g.strokeStyle = '#c9a34a'; g.lineWidth = 6; g.strokeRect(28, 28, w - 56, h - 56); g.lineWidth = 2; g.strokeRect(44, 44, w - 88, h - 88);
      g.fillStyle = '#c9a34a'; g.font = '26px ArchivoBlack'; g.fillText('CERTIFIED', w / 2, 120);
      g.fillStyle = '#ffffff'; g.font = '120px Anton'; g.fillText('TRUST', w / 2, 260); g.fillText('ME BRO', w / 2, 380);
      // gold seal
      g.fillStyle = '#c9a34a'; g.beginPath(); for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, r = i % 2 ? 62 : 74; g.lineTo(w / 2 + Math.cos(a) * r, 510 + Math.sin(a) * r); } g.closePath(); g.fill();
      g.fillStyle = '#101010'; g.font = '30px Anton'; g.fillText('100%', w / 2, 505); g.font = '14px JBM'; g.fillText('LEGIT', w / 2, 528);
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = '17px JBM'; g.fillText('AWARDED BY: ALON', w / 2, 630); g.fillText('ALSO SIGNED BY: ALON', w / 2, 655);
    }
  });
}

export function imagePoster(url) {
  const t = new THREE.TextureLoader().load(url);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
