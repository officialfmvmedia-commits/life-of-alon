// The Trader: seated NPC at the side desk, procedural vinyl-toy style, IK arms, animated charts.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTex, rand } from './textures.js';
import { prepRig, makeArmIK } from './hifi.js';

export const TRADER_LINES = [
  "bro I'm up... wait",
  'just one more trade',
  'this is the bottom fr',
  "I'm not selling",
  "don't look at my PnL",
  'airdrop when?',
  'that red candle is a buying opportunity',
  'trust me I did the research (I watched one video)',
  "we're so back",
  "it's over... no wait we're back",
  'my stop loss is emotional support',
  'I only check the chart every 4 seconds',
  "sir this is a long-term hold (since 9 minutes ago)",
  'number go up (soon)',
];

export const UPSET_LINES = [
  'YO. WHO DRAINED MY WALLET??',
  'my SOL... it\'s gone. all of it.',
  'bro I was up... I was UP',
  'zero. it says zero. ZERO.',
  'alon... did you see someone at my computer?',
  'this is fine. everything is fine. (it is not fine)',
  'I\'m calling BATON support',
];

export const HYPE_LINES = [
  "IT'S REAL. THE AIRDROP IS REAL.",
  'YEARS. I WAITED YEARS. WE ARE SO BACK',
  'ALON DELIVERED!!! I KNEW IT',
  'screenshot my balance. SCREENSHOT IT',
  "I'm never selling. ok maybe a little. NO. NEVER",
  "mom come look at my wallet",
  'I said airdrop when... and it was NOW',
  "I'm buying the whole office pizza. ALL OF IT",
  'number went up. NUMBER WENT UP',
];

// animated, decorative candle chart (no numbers, no tickers)
export function liveChart(seed, accent) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  let s = seed * 9301 + 49297;
  const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const candles = []; let v = 200;
  const push = () => { const up = r() < 0.55; const o = v; const cl = Math.max(40, Math.min(280, v + (up ? -1 : 1) * (4 + r() * 22))); candles.push({ o, c: cl, h: Math.min(o, cl) - 2 - r() * 12, l: Math.max(o, cl) + 2 + r() * 12 }); v = cl; if (candles.length > 34) candles.shift(); };
  for (let i = 0; i < 34; i++) push();
  let live = null, t0 = 0;
  const draw = (t) => {
    g.fillStyle = '#07100b'; g.fillRect(0, 0, 512, 320);
    g.strokeStyle = 'rgba(80,200,130,0.08)'; g.lineWidth = 1;
    for (let x = 0; x < 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 320); g.stroke(); }
    for (let y = 0; y < 320; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    const all = live ? [...candles, live] : candles;
    all.forEach((k, i) => {
      const up = k.c <= k.o; const x = 12 + i * 14;
      g.fillStyle = g.strokeStyle = up ? accent : '#ef4f5a';
      g.beginPath(); g.moveTo(x + 4.5, k.h); g.lineTo(x + 4.5, k.l); g.stroke();
      g.fillRect(x, Math.min(k.o, k.c), 9, Math.max(2, Math.abs(k.c - k.o)));
    });
    const last = all[all.length - 1];
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(0, last.c); g.lineTo(512, last.c); g.stroke(); g.setLineDash([]);
    g.fillStyle = accent; g.font = '16px JBM, monospace'; g.fillText((Math.floor(t * 2) % 2 ? '●' : '○') + ' LIVE-ish', 14, 24);
    tex.needsUpdate = true;
  };
  return {
    tex,
    update(t) {
      if (!live || t - t0 > 2.2) { if (live) { candles.push(live); if (candles.length > 34) candles.shift(); v = live.c; } live = { o: v, c: v, h: v, l: v }; t0 = t; }
      const nc = Math.max(40, Math.min(280, live.c + (r() - 0.5) * 10));
      live.c = nc; live.h = Math.min(live.h, nc - 2); live.l = Math.max(live.l, nc + 2);
      draw(t);
      return live.c - live.o; // <0 = pumping (canvas y is inverted)
    },
  };
}

export class Trader {
  constructor(scene, world, model = null) {
    const td = world.traderDesk;
    this.td = td;
    const root = new THREE.Group(); root.name = 'DUVE';
    root.position.set(td.seat.x, 0, td.seat.z); root.rotation.y = td.facing;
    scene.add(root); this.root = root;

    // ---- materials (soft vinyl) ----
    const skin = new THREE.MeshPhysicalMaterial({ color: '#e4b596', roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.5, sheen: 0.35, sheenColor: new THREE.Color('#ffd2b8'), sheenRoughness: 0.6 });
    const hair = new THREE.MeshPhysicalMaterial({ color: '#3b2516', roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color('#8a5a3a'), sheenRoughness: 0.4 });
    const shirt = new THREE.MeshPhysicalMaterial({ color: '#1d1d1f', roughness: 0.9, sheen: 0.8, sheenColor: new THREE.Color('#4a4a52'), sheenRoughness: 0.7 });
    const jeans = new THREE.MeshPhysicalMaterial({ color: '#232427', roughness: 0.85, sheen: 0.5, sheenColor: new THREE.Color('#505560'), sheenRoughness: 0.8 });
    const shoe = new THREE.MeshPhysicalMaterial({ color: '#161616', roughness: 0.5, clearcoat: 0.3 });
    const sole = new THREE.MeshPhysicalMaterial({ color: '#2b2b2b', roughness: 0.7 });
    const dark = new THREE.MeshPhysicalMaterial({ color: '#2a1712', roughness: 0.6 });
    const eyeM = new THREE.MeshPhysicalMaterial({ color: '#1a120e', roughness: 0.1, clearcoat: 1 });
    const mouthM = new THREE.MeshPhysicalMaterial({ color: '#6b2a26', roughness: 0.6 });
    const teeth = new THREE.MeshPhysicalMaterial({ color: '#f4efe6', roughness: 0.3, clearcoat: 0.5 });
    const add = (p, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };

    // ---- lower body (seated) ----
    // pelvis on seat (seat top y=0.48)
    const pelvis = add(root, new THREE.SphereGeometry(0.25, 36, 24), jeans, 0, 0.6, -0.02); pelvis.scale.set(1.1, 0.55, 0.95);
    for (const s of [-1, 1]) {
      // thigh: horizontal, from hip forward to knee
      const th = add(root, new THREE.CapsuleGeometry(0.105, 0.36, 8, 20), jeans, s * 0.13, 0.585, 0.2); th.rotation.x = Math.PI / 2 - 0.04;
      // shin: knee down to ankle
      const sh = add(root, new THREE.CapsuleGeometry(0.088, 0.42, 8, 20), jeans, s * 0.14, 0.32, 0.43); sh.rotation.x = 0.06;
      add(root, new THREE.TorusGeometry(0.088, 0.012, 8, 24), jeans, s * 0.14, 0.1, 0.445).rotation.x = Math.PI / 2;
      const sn = add(root, new RoundedBoxGeometry(0.16, 0.11, 0.3, 5, 0.05), shoe, s * 0.145, 0.06, 0.5);
      add(root, new RoundedBoxGeometry(0.17, 0.035, 0.31, 4, 0.016), sole, s * 0.145, 0.018, 0.5);
    }

    // ---- torso (pivot at hips so he can lean in) ----
    const torso = new THREE.Group(); torso.position.set(0, 0.58, -0.04); root.add(torso); this.torso = torso;
    const prof = [[0.0, 0.0], [0.24, 0.0], [0.265, 0.08], [0.27, 0.18], [0.26, 0.28], [0.25, 0.36], [0.22, 0.42], [0.14, 0.46], [0.08, 0.47]].map(([r, y]) => new THREE.Vector2(r, y));
    const tor = add(torso, new THREE.LatheGeometry(prof, 48), shirt); tor.scale.set(1.1, 1, 0.8);
    // rounded belly
    const belly = add(torso, new THREE.SphereGeometry(0.22, 40, 28), shirt, 0, 0.15, 0.1); belly.scale.set(1.08, 0.9, 0.82); this.belly = belly;
    // hem + crew neck
    add(torso, new THREE.TorusGeometry(0.245, 0.014, 8, 40), shirt, 0, 0.02, 0.02).rotation.x = Math.PI / 2;
    add(torso, new THREE.TorusGeometry(0.075, 0.016, 8, 28), shirt, 0, 0.465, 0.0).rotation.x = Math.PI / 2;
    // neck
    add(torso, new THREE.CylinderGeometry(0.07, 0.08, 0.12, 20), skin, 0, 0.5, 0);

    // ---- arms (2-bone IK) ----
    this.arms = [];
    const L1 = 0.27, L2 = 0.25;
    for (const s of [1, -1]) { // +1 = his left (+x), -1 = his right
      const shoulder = new THREE.Group(); shoulder.position.set(s * 0.28, 0.4, 0.0); torso.add(shoulder);
      add(shoulder, new THREE.SphereGeometry(0.092, 20, 14), shirt, 0, -0.01, 0);
      const sleeve = add(shoulder, new THREE.CylinderGeometry(0.083, 0.078, 0.15, 20), shirt, 0, -0.08, 0);
      add(shoulder, new THREE.CapsuleGeometry(0.06, L1 - 0.06, 6, 16), skin, 0, -L1 / 2, 0);
      const elbow = new THREE.Group(); elbow.position.y = -L1; shoulder.add(elbow);
      add(elbow, new THREE.CapsuleGeometry(0.052, L2 - 0.05, 6, 16), skin, 0, -L2 / 2, 0);
      const hand = add(elbow, new THREE.SphereGeometry(0.058, 20, 14), skin, 0, -L2 - 0.02, 0); hand.scale.set(0.9, 1.0, 1.1);
      add(elbow, new THREE.CapsuleGeometry(0.018, 0.03, 4, 8), skin, s * 0.045, -L2 - 0.01, 0.02).rotation.z = s * 0.7;
      this.arms.push({ s, shoulder, elbow, L1, L2, target: new THREE.Vector3(), cur: new THREE.Vector3() });
    }

    // ---- head ----
    const head = new THREE.Group(); head.position.set(0, 0.73, 0.0); torso.add(head); this.head = head;
    const HR = 0.3;
    const skullG = new THREE.SphereGeometry(HR, 64, 48);
    const JAW = 0.16;
    { const p = skullG.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const f = 1 + JAW * Math.max(0, -y / HR) ** 1.3; p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); if (y < 0) p.setY(i, y * 1.04); } skullG.computeVertexNormals(); }
    const skull = add(head, skullG, skin); skull.scale.set(1.02, 0.97, 0.95);
    const fz = (x, y) => { const f = 1 + JAW * Math.max(0, -y / (HR * 0.97)) ** 1.3; return Math.sqrt(Math.max(0, 1 - (x / (HR * 1.02 * f)) ** 2 - (y / (HR * 0.97 * (y < 0 ? 1.04 : 1))) ** 2)) * HR * 0.95 * f; };
    // ears
    for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.06, 18, 12), skin, s * 0.295, -0.03, 0).scale.set(0.45, 1, 0.75);
    // eyes (friendly squint) + lids + brows
    for (const s of [-1, 1]) {
      const ex = s * 0.1, ey = 0.035, ez = fz(ex, ey) - 0.014;
      const e = add(head, new THREE.SphereGeometry(0.036, 20, 14), eyeM, ex, ey, ez); e.scale.set(1, 0.85, 0.6);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); hl.position.set(ex - 0.012, ey + 0.012, ez + 0.02); head.add(hl);
      const br = add(head, new RoundedBoxGeometry(0.09, 0.022, 0.025, 2, 0.01), hair, s * 0.105, 0.115, fz(s * 0.105, 0.115) + 0.004); br.rotation.z = s * 0.12; br.rotation.y = s * 0.3;
    }
    // nose
    add(head, new THREE.SphereGeometry(0.038, 18, 12), skin, 0, -0.035, fz(0, -0.035) + 0.008).scale.set(1, 0.85, 0.8);
    // open friendly mouth
    const my = -0.115, mz = fz(0, my) - 0.006;
    const ms = new THREE.Shape();
    ms.moveTo(-0.055, 0.008); ms.quadraticCurveTo(0, -0.004, 0.055, 0.008);
    ms.quadraticCurveTo(0.05, -0.045, 0, -0.05); ms.quadraticCurveTo(-0.05, -0.045, -0.055, 0.008);
    const mg = new THREE.ExtrudeGeometry(ms, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.004, bevelSegments: 3, curveSegments: 16 });
    const mouthG = new THREE.Group(); mouthG.position.set(0, my + 0.012, mz - 0.004); mouthG.rotation.x = -0.3; mouthG.scale.setScalar(1.35); head.add(mouthG);
    const mouth = add(mouthG, mg, mouthM, 0, 0, 0); this.mouth = mouthG;
    const tg = new THREE.Shape(); tg.moveTo(-0.042, 0.004); tg.quadraticCurveTo(0, -0.006, 0.042, 0.004); tg.lineTo(0.036, -0.012); tg.quadraticCurveTo(0, -0.02, -0.036, -0.012); tg.closePath();
    add(mouthG, new THREE.ShapeGeometry(tg, 12), teeth, 0, 0, 0.0185);
    const tongue = add(mouthG, new THREE.SphereGeometry(0.028, 16, 10), new THREE.MeshPhysicalMaterial({ color: '#c0605a', roughness: 0.5 }), 0, -0.036, 0.008); tongue.scale.set(1.2, 0.45, 0.4);
    // smile cheeks
    for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.04, 16, 12), skin, s * 0.09, my + 0.03, fz(s * 0.09, my + 0.03) - 0.028).scale.set(1, 0.7, 0.5);
    // mustache
    const mus = add(head, new THREE.CapsuleGeometry(0.016, 0.075, 6, 12), hair, 0, my + 0.05, mz + 0.006); mus.rotation.z = Math.PI / 2; mus.scale.set(1, 1.1, 0.8);
    for (const s of [-1, 1]) { const m2 = add(head, new THREE.CapsuleGeometry(0.013, 0.025, 4, 8), hair, s * 0.055, my + 0.035, mz - 0.004); m2.rotation.z = s * -0.9; }
    // short goatee
    const gt = add(head, new THREE.SphereGeometry(0.04, 18, 12), hair, 0, my - 0.075, mz - 0.012); gt.scale.set(0.85, 1.0, 0.6);
    // big curly hair: clusters of bumps over the crown, sides and back
    const curlGeo = new THREE.SphereGeometry(1, 20, 16);
    { // lumpy displacement so each curl reads as a coil, not a ball
      const p = curlGeo.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const f = 1 + 0.07 * Math.sin(x * 4 + y * 2) * Math.cos(z * 3.5 - y * 2.5); p.setXYZ(i, x * f, y * f, z * f); }
      curlGeo.computeVertexNormals();
    }
    const hairDark = hair.clone(); hairDark.color.set('#2e1c10');
    // fill shell sits under the curls
    const cap = add(head, new THREE.SphereGeometry(HR * 1.0, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.36), hairDark, 0, 0.035, -0.01); cap.scale.set(1.03, 1.02, 1.0);
    const capBack = add(head, new THREE.SphereGeometry(HR * 1.0, 40, 24, Math.PI / 2 + 0.75, Math.PI * 2 - 1.5, 0, Math.PI * 0.6), hairDark, 0, 0.03, -0.015); capBack.scale.set(1.03, 1.02, 1.0);
    for (let ring = 0; ring < 10; ring++) {
      const theta = 0.05 + ring * 0.155;
      const n = Math.max(1, Math.round(Math.sin(theta) * 30));
      for (let j = 0; j < n; j++) {
        const phi = (j + (ring % 2) * 0.5 + rand() * 0.3) / n * Math.PI * 2;
        const x = Math.sin(theta) * Math.sin(phi), y = Math.cos(theta), z = Math.sin(theta) * Math.cos(phi);
        if (z > 0.52 && y < 0.68) continue;             // keep the face + forehead clear
        if (y < 0.12 && z > -0.3) continue;             // short on the sides (ears visible)
        const r0 = 0.05 + rand() * 0.025 + (y > 0.6 ? 0.012 : 0);
        const out = y > 0.5 ? 1.1 : 1.04;              // more volume on top
        const c = add(head, curlGeo, rand() < 0.3 ? hairDark : hair, x * HR * out * 1.02, y * HR * out + 0.035, z * HR * out - 0.01);
        c.scale.setScalar(r0); c.rotation.set(rand() * 6, rand() * 6, rand() * 6);
      }
    }
    // fringe curls just above the forehead
    for (let i = 0; i < 8; i++) { const x = -0.18 + i * 0.05; const y = 0.2 + Math.sin(i * 1.7) * 0.012; const c = add(head, curlGeo, hair, x, y, fz(x, y) + 0.012); c.scale.setScalar(0.045 + rand() * 0.015); c.rotation.set(rand() * 6, rand() * 6, 0); }

    // ---- live charts on his monitors ----
    this.charts = td.monitors.map((m, i) => { const ch = liveChart(7 + i * 13, i ? '#7cf0ad' : '#4be08a'); m.mat.map = ch.tex; m.mat.needsUpdate = true; return ch; });
    this.monitorLocal = td.monitors.map(m => { const v = new THREE.Vector3(); m.screen.getWorldPosition(v); return root.worldToLocal(v.clone()); });

    // collider (body + chair footprint)
    world.colliders.push({ minX: td.seat.x - 0.45, maxX: td.seat.x + 0.45, minZ: td.seat.z - 0.45, maxZ: td.seat.z + 0.45 });
    // interaction
    this.interaction = { id: 'trader', prompt: 'Press E to talk to DUVE', pos: new THREE.Vector3(td.seat.x, 0, td.seat.z), radius: 1.45 };
    world.interactables.push(this.interaction);

    // keyboard / mouse in root-local space (desk world -> local)
    const deskLocal = (x, y, z) => { const v = new THREE.Vector3(x, y, z); td.desk.updateMatrixWorld(true); td.desk.localToWorld(v); root.updateMatrixWorld(true); return root.worldToLocal(v); };
    this.kb = deskLocal(0, 0.86, 0.27);
    this.mouse = deskLocal(0.3, 0.855, 0.27);
    this.t = 0; this.state = 'trade'; this.stateT = 0; this.nextReact = 6 + Math.random() * 6;
    this.lookIdx = 0; this.nextLook = 2; this.lean = 0; this.leanT = 0; this.headYaw = 0;
    this.lineIdx = Math.floor(Math.random() * TRADER_LINES.length);
    for (const a of this.arms) { a.cur.copy(this.kb); }
    if (model) this.useHifi(model);
  }

  // hi-fi DUVE (arms crossed, sculpted rigid with the chest like ANSEM): no arm bones/IK; spine/neck/head carry all motion.
  useHifi(model) {
    this.root.clear();
    this.root.add(model);
    this.hifi = prepRig(model, { env: 1.25 });
    this.headBone = this.hifi.B.head.b;
    this.noTyping = true; // arms crossed: no keyboard clicks
    this.seatLift = 0.01; this.seatBack = -0.1;
    this.hifiModel = model; model.position.set(0, this.seatLift, this.seatBack);
    this.fitChair();
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.set(0, 0.006, 0.2); this.root.add(blob);
  }
  // hi-fi DUVE sits low (short legs, big seat): drop his chair seat to 0.24 m, shorten the gas column and move the
  // backrest back so nothing clips (checked with a vertex-vs-box test).
  fitChair() {
    const ch = this.td && this.td.chair; if (!ch) return;
    const DROP = 0.33, SHIFT = 0.2, BACK = 0.08; // seat top 0.48 -> 0.15, whole chair 0.2 m back from the desk, backrest a further 0.08
    ch.updateMatrixWorld(true);
    const bwd = (k) => new THREE.Vector3(0, 0, -1).transformDirection(this.root.matrixWorld).multiplyScalar(k);
    const meshes = []; ch.traverse(o => { if (o.isMesh) meshes.push(o); });
    const plan = meshes.map(o => [o, new THREE.Box3().setFromObject(o)]);
    for (const [o, bb] of plan) {
      const d = bwd(SHIFT);
      if (bb.min.y >= 0.39) { d.y -= DROP; if (bb.min.y >= 0.49) d.add(bwd(BACK)); }
      else if (bb.min.y > 0.06 && bb.max.y > 0.4 && bb.max.y < 0.45) o.visible = false; // gas column (seat now sits on the base)
      const wp = o.getWorldPosition(new THREE.Vector3()).add(d);
      o.position.copy(o.parent.worldToLocal(wp)); o.updateMatrixWorld(true);
    }
  }
  updateHifi(dt) {
    const P = this.hifi.pose, t = this.t, h = this.head.rotation, lean = this.torso.rotation.x, st = this.state;
    const br = Math.sin(t * 2.0);
    let slump = (this.drained && st === 'trade') ? 1 : 0, bounce = 0, bob = 0, shake = 0;
    if (this.drained && st === 'trade') shake = Math.sin(t * 1.3) * 0.08 * Math.max(0, Math.sin(t * 0.35));
    if (st === 'headhands') { slump = 1; shake = Math.sin(this.stateT * 9) * 0.25 * Math.max(0, 1 - this.stateT / 2.6); }
    if (st === 'pump') bounce = Math.abs(Math.sin(this.stateT * 10)) * (this.hyped ? 1 : 0.6) * Math.max(0, 1 - this.stateT / 2.6);
    if (this.hyped && st === 'trade') bob = Math.sin(t * 8);
    this.slumpS = (this.slumpS || 0) + (slump - (this.slumpS || 0)) * (1 - Math.exp(-dt * 3));
    const sl = this.slumpS;
    this.hifiModel.position.y = (this.seatLift || 0) + bounce * 0.025 + Math.max(0, bob) * 0.008;
    P('spine', lean * 0.5 + 0.1 * sl + br * 0.008 - bounce * 0.08, h.y * 0.06, Math.sin(this.stateT * 10) * 0.03 * bounce);
    P('chest', lean * 0.5 + 0.1 * sl - br * 0.015 - bounce * 0.06, h.y * 0.08, 0);
    P('neck', h.x * 0.35 + 0.12 * sl, h.y * 0.3 + shake * 0.4, h.z * 0.3);
    P('head', h.x * 0.65 + 0.25 * sl + bob * 0.07 - bounce * 0.25, h.y * 0.62 + shake * 0.6, h.z * 0.7 + bob * 0.02);
  }

  setDrained(v) { this.drained = !!v; }
  setHyped(v) { this.hyped = !!v; if (v) this.drained = false; }
  hypeLine() { this.react('pump'); return HYPE_LINES[Math.floor(Math.random() * HYPE_LINES.length)]; }
  upsetLine() { this.react('headhands'); return UPSET_LINES[Math.floor(Math.random() * UPSET_LINES.length)]; }
  nextLine() { if (this.hyped && Math.random() < 0.75) return this.hypeLine(); if (this.drained && Math.random() < 0.6) { this.react('headhands'); return UPSET_LINES[Math.floor(Math.random() * UPSET_LINES.length)]; } this.lineIdx = (this.lineIdx + 1 + Math.floor(Math.random() * (TRADER_LINES.length - 1))) % TRADER_LINES.length; this.react('talk'); return TRADER_LINES[this.lineIdx]; }
  react(kind) { this.state = kind; this.stateT = 0; }
  headWorld(out) { if (this.headBone) { this.headBone.getWorldPosition(out); out.y += 0.08; return out; } return this.head.getWorldPosition(out); }

  solveArm(a, targetLocalRoot) {
    // target (root space) -> shoulder parent (torso) space
    const w = this.root.localToWorld(targetLocalRoot.clone());
    const p = a.shoulder.parent.worldToLocal(w).sub(a.shoulder.position);
    const L1 = a.L1, L2 = a.L2 + 0.02;
    let d = p.length(); const dir = p.clone().normalize();
    d = Math.min(Math.max(d, Math.abs(L1 - L2) + 0.02), L1 + L2 - 0.005);
    const a1 = Math.acos(THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const gam = Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    const pole = new THREE.Vector3(a.s * 0.7, -1, -0.5).normalize();
    let axis = new THREE.Vector3().crossVectors(dir, pole);
    if (axis.lengthSq() < 1e-6) axis.set(1, 0, 0); axis.normalize();
    const q0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    const qa = new THREE.Quaternion().setFromAxisAngle(axis, a1);
    const q = qa.multiply(q0);
    a.shoulder.quaternion.copy(q);
    const axisL = axis.clone().applyQuaternion(q.clone().invert()).normalize();
    a.elbow.quaternion.setFromAxisAngle(axisL, -(Math.PI - gam));
  }

  update(dt) {
    this.t += dt; this.stateT += dt;
    const t = this.t;
    // charts
    const moves = this.charts.map(c => c.update(t));
    // state machine: trade | pump | facepalm | talk
    if (this.state === 'trade') {
      this.nextReact -= dt;
      if (this.nextReact <= 0) { this.react(Math.random() < (this.hyped ? 0.92 : this.drained ? 0.15 : 0.55) ? 'pump' : 'headhands'); this.nextReact = 9 + Math.random() * 9; if (this.hyped) this.nextReact *= 0.45; }
    } else if (this.stateT > (this.state === 'talk' ? 2.2 : 2.6)) { this.state = 'trade'; this.stateT = 0; }

    // look between monitors
    this.nextLook -= dt;
    if (this.nextLook <= 0) { this.lookIdx = 1 - this.lookIdx; this.nextLook = 1.2 + Math.random() * 2.8; }
    const ml = this.monitorLocal[this.lookIdx];
    let yawT = Math.atan2(ml.x, ml.z) * 0.85, pitchT = 0.12;
    // lean in occasionally
    this.leanT -= dt; if (this.leanT <= 0) { this.lean = this.lean > 0 ? 0 : 1; this.leanT = this.lean ? 1.5 + Math.random() * 1.5 : 3 + Math.random() * 5; }
    let leanT = this.lean * 0.16, rollT = 0;
    if (this.state === 'talk') { yawT = -0.9; pitchT = -0.05; leanT = -0.02; }
    if (this.state === 'headhands') { leanT = -0.08; pitchT = -0.18; rollT = Math.sin(this.stateT * 5) * 0.08; }
    if (this.state === 'pump') { leanT = -0.04; pitchT = -0.1; }
    const k = 1 - Math.exp(-dt * 6);
    this.headYaw += (yawT - this.headYaw) * k;
    this.head.rotation.y = this.headYaw + Math.sin(t * 3.1) * 0.02;
    this.head.rotation.x += (pitchT + Math.sin(t * 2.3) * 0.015 - this.head.rotation.x) * k;
    this.head.rotation.z += (rollT - this.head.rotation.z) * k;
    this.torso.rotation.x += (leanT - this.torso.rotation.x) * (1 - Math.exp(-dt * 3));
    this.torso.rotation.y = this.headYaw * 0.15;
    // breathing
    const br = Math.sin(t * 2.0);
    this.belly.scale.set(1.08 + br * 0.012, 0.9 + br * 0.008, 0.82 + br * 0.015);
    this.torso.position.y = 0.58 + br * 0.004;
    this.mouth.scale.y = 1.35 * (1 + (this.state === 'talk' ? Math.abs(Math.sin(this.stateT * 14)) * 0.5 : this.state === 'pump' ? (this.hyped ? 0.85 : 0.4) : 0));

    // hand targets
    const [L, R] = this.arms; // L = his left (+x), R = his right (-x, mouse hand)
    const tL = this.kb.clone().add(new THREE.Vector3(0.09, 0, -0.02));
    const tR = this.mouse.clone();
    // hi-fi DUVE: hands never leave the desk; every state keeps typing/mousing, body + head carry the emotion
    const typing = this.hifi ? true : (this.state === 'trade' || this.state === 'talk');
    if (typing && this.hifi) {
      const calm = this.state === 'headhands' ? 0.35 : 1; // drained: slower, smaller key taps
      tL.x += Math.sin(t * 7.3) * 0.02 * calm; tL.y += Math.max(0, Math.sin(t * 17)) * 0.014 * calm; tL.z += Math.sin(t * 3.1) * 0.012;
      // right hand blends smoothly between mouse and keyboard (no target snaps)
      const m = THREE.MathUtils.smoothstep(Math.sin(t * 0.7), 0.05, 0.55);
      const kbR = this.kb.clone().add(new THREE.Vector3(-0.1, Math.max(0, Math.sin(t * 15 + 1)) * 0.014 * calm, -0.02 + Math.sin(t * 6.1) * 0.0));
      kbR.x += Math.sin(t * 6.1) * 0.015 * calm;
      const ms = this.mouse.clone().add(new THREE.Vector3(Math.sin(t * 1.7) * 0.025, Math.max(0, Math.sin(t * 9)) * 0.006, Math.cos(t * 2.3) * 0.02));
      tR.copy(ms).lerp(kbR, m);
    } else if (typing) {
      tL.x += Math.sin(t * 7.3) * 0.025; tL.y += Math.max(0, Math.sin(t * 17)) * 0.018; tL.z += Math.sin(t * 3.1) * 0.015;
      if (Math.sin(t * 0.7) > 0.3) { tR.copy(this.kb).add(new THREE.Vector3(-0.1, 0, -0.02)); tR.y += Math.max(0, Math.sin(t * 15 + 1)) * 0.018; tR.x += Math.sin(t * 6.1) * 0.02; }
      else { tR.x += Math.sin(t * 1.7) * 0.03 + (moves[0] < 0 ? 0.005 : 0); tR.z += Math.cos(t * 2.3) * 0.025; tR.y += Math.max(0, Math.sin(t * 9)) * 0.008; }
    }
    if (this.state === 'pump' && !this.hifi) {
      const e = Math.min(1, this.stateT * 4);
      const H = this.hyped ? 1 : 0;
      const up = new THREE.Vector3(-0.22 - H * 0.05, 1.2 + H * 0.16 + Math.abs(Math.sin(this.stateT * (9 + H * 4))) * (0.12 + H * 0.1), 0.22 + H * 0.04);
      tR.lerp(up, e);
      if (H) { const upL = new THREE.Vector3(0.24, 1.3 + Math.abs(Math.sin(this.stateT * 13 + 1.5)) * 0.2, 0.24); tL.lerp(upL, e); }
    }
    if (this.state === 'headhands' && !this.hifi) {
      const e = Math.min(1, this.stateT * 4);
      const hp = this.head.getWorldPosition(new THREE.Vector3()); this.root.worldToLocal(hp);
      tL.lerp(hp.clone().add(new THREE.Vector3(0.27, 0.22, -0.04)), e);
      tR.lerp(hp.clone().add(new THREE.Vector3(-0.27, 0.22, -0.04)), e);
    }
    const kh = 1 - Math.exp(-dt * (this.hifi ? 8 : 14));
    L.cur.lerp(tL, kh); R.cur.lerp(tR, kh);
    if (this.hifi) { // hard clamp: wrists stay inside the desk zone around keyboard/mouse
      for (const [a, c] of [[L, this.kb], [R, this.kb]]) {
        a.cur.x = THREE.MathUtils.clamp(a.cur.x, Math.min(this.kb.x, this.mouse.x) - 0.25, Math.max(this.kb.x, this.mouse.x) + 0.25);
        a.cur.y = THREE.MathUtils.clamp(a.cur.y, c.y - 0.03, c.y + 0.06);
        a.cur.z = THREE.MathUtils.clamp(a.cur.z, Math.min(this.kb.z, this.mouse.z) - 0.12, Math.max(this.kb.z, this.mouse.z) + 0.12);
      }
    }
    this.root.updateMatrixWorld(true);
    if (this.hifi) { this.updateHifi(dt); return; }
    this.solveArm(L, L.cur); this.solveArm(R, R.cur);
  }
}
