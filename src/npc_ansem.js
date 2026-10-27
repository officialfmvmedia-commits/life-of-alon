// ANSEM: affectionate in-game parody of a well-known SOL trader. Seated at the desk next to DUVE,
// three monitors of animated candles. Same soft vinyl-toy style. Lines are original, written in his cadence
// (see notes/ansem-voice.md). No real calls, no real numbers.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { liveChart, Trader } from './npc_trader.js';

export const ANSEM_NAME = 'ANSEM';
export const ANSEM_LINES = [
  'coins look good',
  "it's always darkest before dawn. job not finished",
  "everybody in this office is bearish rn. that's usually when it gets interesting",
  'thin little candles in a tight range... something big is coming. which way? the candles will tell us',
  'attention is the most underrated indicator in the game bro',
  'i was journaling trades before anybody knew who i was. still journaling',
  'look how ugly this chart is LMFAOOOOOO',
  'absolutely frigid take alon',
  "we're cooking",
  'prayer circle assemble',
  'solangeles never sleeps 🌒',
  "if i'm right i make money. if i'm wrong i lose money. not that complicated brother",
  'never giving up on my birds 🦅',
  'we back on that unc energy',
  'complacency.',
  "bullish is counter-consensus in this office and honestly? i love that for us",
  'send the flood',
  'who in the group chat bought the top LMFAO',
  'pump HQ devs been shipping at an insane pace, gotta respect it',
  "brother i'm not your financial advisor. i'm a guy with three monitors",
  'they shook me out right at the low. classic',
  'how are the engineers doing this week',
];
export const ANSEM_HYPE_LINES = [
  'ALON DELIVERED. WE ARE SO BACK',
  'told y\'all. darkest before dawn. THIS is the dawn',
  'MASSIVE',
  'coins look GOOD good',
  'i was the loudest bull at the bottom and i will not be taking questions',
  'send the flood 🌊🌊🌊',
  'solangeles is LIT tonight 🌒🐂',
  'job finished. ok job not finished. MORE',
];
export const ANSEM_ANNOYED = [
  'brother. did you just tax me',
  'LMFAOOOO you really did that',
  "half?? that's a frigid move alon",
  'i journaled that trade. now i gotta journal THIS',
  'complacency. i got complacent. never again',
  'mob ties alon. i thought we had mob ties',
];
export const ANSEM_CALL_LINES = [
  'my call? up, down, or sideways. lock it in',
  "the call is: drink water, touch grass, check the chart in an hour",
  "i'm bullish on whatever DUVE is about to sell",
  'something in this office is about to send. could be a coin, could be the pizza guy',
  "I'll tell you when it's over. it's not over",
  'not financial advice. not even advice. vibes',
];
export const ANSEM_BAGS = [
  'bags? conviction mostly. and a little $SENDIT for the soul',
  "70% things i believe in, 30% things i don't tell anybody about",
  "bro i don't show bags, i show results. (bags are in the dashboard)",
];

export class Ansem {
  constructor(scene, world) {
    const td = world.ansemDesk;
    this.td = td; this.name = ANSEM_NAME;
    const root = new THREE.Group(); root.name = ANSEM_NAME;
    root.position.set(td.seat.x, 0, td.seat.z); root.rotation.y = td.facing;
    scene.add(root); this.root = root;

    // ---- materials ----
    const skin = new THREE.MeshPhysicalMaterial({ color: '#5b3a2b', roughness: 0.48, clearcoat: 0.22, clearcoatRoughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color('#a0705a'), sheenRoughness: 0.55 });
    const hair = new THREE.MeshPhysicalMaterial({ color: '#0f0d0c', roughness: 0.8, sheen: 0.5, sheenColor: new THREE.Color('#3a3634'), sheenRoughness: 0.8 });
    const satin = new THREE.MeshPhysicalMaterial({ color: '#141518', roughness: 0.34, metalness: 0.0, clearcoat: 0.55, clearcoatRoughness: 0.35, sheen: 1, sheenColor: new THREE.Color('#596070'), sheenRoughness: 0.35 });
    const rib = new THREE.MeshPhysicalMaterial({ color: '#0d0d0f', roughness: 0.85 });
    const tee = new THREE.MeshPhysicalMaterial({ color: '#f1f0ec', roughness: 0.85, sheen: 0.4, sheenColor: new THREE.Color('#ffffff') });
    const jeans = new THREE.MeshPhysicalMaterial({ color: '#9fb5ca', roughness: 0.88, sheen: 0.6, sheenColor: new THREE.Color('#dfe7ee'), sheenRoughness: 0.7 });
    const jeansFade = new THREE.MeshPhysicalMaterial({ color: '#b8c8d6', roughness: 0.9, sheen: 0.6, sheenColor: new THREE.Color('#eef2f5') });
    const shoeUp = new THREE.MeshPhysicalMaterial({ color: '#3c4a40', roughness: 0.75, sheen: 0.5, sheenColor: new THREE.Color('#6f7f72') });
    const shoeSuede = new THREE.MeshPhysicalMaterial({ color: '#8a8f8a', roughness: 0.9 });
    const sole = new THREE.MeshPhysicalMaterial({ color: '#e8e4da', roughness: 0.6 });
    const metal = new THREE.MeshPhysicalMaterial({ color: '#c9c9cc', roughness: 0.3, metalness: 0.9 });
    const eyeM = new THREE.MeshPhysicalMaterial({ color: '#120c0a', roughness: 0.1, clearcoat: 1 });
    const lipM = new THREE.MeshPhysicalMaterial({ color: '#3e2620', roughness: 0.55 });
    const add = (p, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };

    // ---- lower body (seated, slim) ----
    const pelvis = add(root, new THREE.SphereGeometry(0.23, 36, 24), jeans, 0, 0.6, -0.02); pelvis.scale.set(1.05, 0.52, 0.9);
    for (const s of [-1, 1]) {
      const th = add(root, new THREE.CapsuleGeometry(0.095, 0.37, 8, 20), jeans, s * 0.125, 0.585, 0.2); th.rotation.x = Math.PI / 2 - 0.04;
      // faded front of the thigh
      const fd = add(root, new THREE.CapsuleGeometry(0.06, 0.28, 6, 14), jeansFade, s * 0.125, 0.64, 0.22); fd.rotation.x = Math.PI / 2 - 0.04; fd.scale.set(1, 1, 0.6);
      // straight-leg shin, slightly wider at the hem
      const sh = add(root, new THREE.CylinderGeometry(0.08, 0.092, 0.44, 20), jeans, s * 0.135, 0.33, 0.43); sh.rotation.x = 0.06;
      add(root, new THREE.TorusGeometry(0.092, 0.013, 8, 24), jeansFade, s * 0.135, 0.12, 0.445).rotation.x = Math.PI / 2;
      // chunky runner sneaker: green/grey upper, grey suede overlays, white midsole (no logo)
      add(root, new RoundedBoxGeometry(0.15, 0.1, 0.3, 5, 0.05), shoeUp, s * 0.14, 0.075, 0.5);
      add(root, new RoundedBoxGeometry(0.155, 0.06, 0.12, 4, 0.03), shoeSuede, s * 0.14, 0.085, 0.6);
      add(root, new RoundedBoxGeometry(0.155, 0.06, 0.09, 4, 0.03), shoeSuede, s * 0.14, 0.09, 0.39);
      add(root, new RoundedBoxGeometry(0.165, 0.045, 0.32, 4, 0.02), sole, s * 0.14, 0.022, 0.5);
      for (let k = 0; k < 3; k++) add(root, new THREE.CapsuleGeometry(0.006, 0.08, 3, 6), sole, s * 0.14, 0.125 - k * 0.005, 0.55 - k * 0.03).rotation.z = Math.PI / 2; // laces
    }

    // ---- torso: black satin bomber over a white tee ----
    const torso = new THREE.Group(); torso.position.set(0, 0.58, -0.04); root.add(torso); this.torso = torso;
    const prof = [[0.0, 0.0], [0.22, 0.0], [0.245, 0.06], [0.25, 0.16], [0.26, 0.28], [0.275, 0.37], [0.25, 0.43], [0.15, 0.47], [0.08, 0.48]].map(([r, y]) => new THREE.Vector2(r, y));
    const jk = add(torso, new THREE.LatheGeometry(prof, 48), satin); jk.scale.set(1.12, 1, 0.78);
    this.chest = jk;
    // tee showing through the open zip
    const teeP = add(torso, new THREE.SphereGeometry(1, 32, 20), tee, 0, 0.26, 0.15); teeP.scale.set(0.085, 0.2, 0.065); teeP.position.z = 0.168;
    add(torso, new THREE.TorusGeometry(0.072, 0.014, 8, 28), tee, 0, 0.47, 0.01).rotation.x = Math.PI / 2;
    // zipper tracks + pull
    for (const s of [-1, 1]) { const z = add(torso, new RoundedBoxGeometry(0.012, 0.36, 0.012, 2, 0.005), metal, s * 0.088, 0.25, 0.19); z.rotation.x = -0.04; }
    add(torso, new RoundedBoxGeometry(0.02, 0.04, 0.008, 2, 0.004), metal, 0.085, 0.05, 0.215);
    // ribbed hem + baseball collar
    const hem = add(torso, new THREE.TorusGeometry(0.235, 0.03, 10, 44), rib, 0, 0.03, 0.0); hem.rotation.x = Math.PI / 2; hem.scale.set(1.12, 0.8, 1);
    const col = add(torso, new THREE.TorusGeometry(0.1, 0.028, 10, 32), rib, 0, 0.47, -0.01); col.rotation.x = Math.PI / 2 - 0.25;
    // a few satin creases
    for (const [x, y] of [[-0.16, 0.2], [0.17, 0.27], [-0.2, 0.33]]) { const c = add(torso, new THREE.CapsuleGeometry(0.012, 0.1, 3, 8), satin, x, y, 0.17); c.rotation.z = 1.2; }
    add(torso, new THREE.CylinderGeometry(0.065, 0.075, 0.12, 20), skin, 0, 0.51, 0);

    // ---- arms: full satin sleeves, ribbed cuffs (2-bone IK) ----
    this.arms = [];
    const L1 = 0.28, L2 = 0.26;
    for (const s of [1, -1]) {
      const shoulder = new THREE.Group(); shoulder.position.set(s * 0.29, 0.4, 0.0); torso.add(shoulder);
      add(shoulder, new THREE.SphereGeometry(0.098, 20, 14), satin, 0, -0.01, 0);
      add(shoulder, new THREE.CapsuleGeometry(0.082, L1 - 0.05, 6, 16), satin, 0, -L1 / 2, 0);
      const elbow = new THREE.Group(); elbow.position.y = -L1; shoulder.add(elbow);
      add(elbow, new THREE.CapsuleGeometry(0.072, L2 - 0.08, 6, 16), satin, 0, -L2 / 2 + 0.02, 0);
      add(elbow, new THREE.CylinderGeometry(0.056, 0.06, 0.05, 18), rib, 0, -L2 + 0.03, 0);
      const hand = add(elbow, new THREE.SphereGeometry(0.056, 20, 14), skin, 0, -L2 - 0.02, 0); hand.scale.set(0.9, 1.0, 1.1);
      add(elbow, new THREE.CapsuleGeometry(0.017, 0.03, 4, 8), skin, s * 0.044, -L2 - 0.01, 0.02).rotation.z = s * 0.7;
      this.arms.push({ s, shoulder, elbow, L1, L2, target: new THREE.Vector3(), cur: new THREE.Vector3() });
    }

    // ---- head: short crop, serious, confident ----
    const head = new THREE.Group(); head.position.set(0, 0.74, 0.0); torso.add(head); this.head = head;
    const HR = 0.29, JAW = 0.1;
    const skullG = new THREE.SphereGeometry(HR, 64, 48);
    { const p = skullG.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const f = 1 + JAW * Math.max(0, -y / HR) ** 1.3; p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); if (y < 0) p.setY(i, y * 1.1); } skullG.computeVertexNormals(); }
    add(head, skullG, skin).scale.set(0.98, 1.0, 0.95);
    const fz = (x, y) => { const f = 1 + JAW * Math.max(0, -y / HR) ** 1.3; return Math.sqrt(Math.max(0, 1 - (x / (HR * 0.98 * f)) ** 2 - (y / (HR * (y < 0 ? 1.1 : 1))) ** 2)) * HR * 0.95 * f; };
    // close crop: thin shell over the crown with a clean hairline
    // cap tilted back: hairline high on the forehead, low at the nape; hugs the skull so the edge reads as a fade, not a helmet
    const crop = add(head, new THREE.SphereGeometry(HR * 1.012, 56, 32, 0, Math.PI * 2, 0, Math.PI * 0.4), hair, 0, 0.008, -0.004); crop.scale.set(0.985, 1.0, 0.955); crop.rotation.x = -0.42;
    // soft temple / side fade between the cap and the ears

    for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.058, 18, 12), skin, s * 0.285, -0.035, 0).scale.set(0.42, 1, 0.72);
    // eyes: level, focused; straight, slightly lowered brows
    for (const s of [-1, 1]) {
      const ex = s * 0.095, ey = 0.03, ez = fz(ex, ey) - 0.012;
      const e = add(head, new THREE.SphereGeometry(0.032, 20, 14), eyeM, ex, ey, ez); e.scale.set(1.1, 0.72, 0.6);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); hl.position.set(ex - 0.01, ey + 0.009, ez + 0.019); head.add(hl);
      const lid = add(head, new THREE.SphereGeometry(0.036, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), skin, ex, ey + 0.004, ez - 0.004); lid.scale.set(1.15, 0.8, 0.75);
      const br = add(head, new RoundedBoxGeometry(0.085, 0.02, 0.022, 2, 0.009), hair, s * 0.1, 0.095, fz(s * 0.1, 0.095) + 0.004); br.rotation.z = s * -0.06; br.rotation.y = s * 0.3;
    }
    add(head, new THREE.SphereGeometry(0.04, 18, 12), skin, 0, -0.04, fz(0, -0.04) + 0.01).scale.set(1.15, 0.82, 0.78);
    for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.016, 10, 8), skin, s * 0.03, -0.055, fz(s * 0.03, -0.055) + 0.008);
    // flat, closed, slightly pursed mouth (serious)
    const my = -0.12, mz = fz(0, my);
    const lip = add(head, new THREE.CapsuleGeometry(0.016, 0.075, 6, 12), lipM, 0, my - 0.004, mz - 0.008); lip.rotation.z = Math.PI / 2; lip.scale.set(1, 1, 0.55);
    this.mouth = lip;
    // faint mustache / chin shadow
    const shadow = new THREE.MeshPhysicalMaterial({ color: '#2d1d16', roughness: 0.9, transparent: true, opacity: 0.5 });
    const mus = add(head, new THREE.CapsuleGeometry(0.01, 0.06, 4, 8), shadow, 0, my + 0.028, mz - 0.002); mus.rotation.z = Math.PI / 2; mus.castShadow = false;

    // ---- monitors: live candles ----
    this.charts = td.monitors.map((m, i) => { const ch = liveChart(51 + i * 17, ['#4be08a', '#7cf0ad', '#5ee1ff'][i]); m.mat.map = ch.tex; m.mat.needsUpdate = true; return ch; });
    this.monitorLocal = td.monitors.map(m => { const v = new THREE.Vector3(); m.screen.getWorldPosition(v); return root.worldToLocal(v.clone()); });

    world.colliders.push({ minX: td.seat.x - 0.45, maxX: td.seat.x + 0.45, minZ: td.seat.z - 0.45, maxZ: td.seat.z + 0.45 });
    this.interaction = { id: 'ansem', prompt: `Press E to talk to ${ANSEM_NAME}`, pos: new THREE.Vector3(td.seat.x, 0, td.seat.z), radius: 1.45, actions: true };
    world.interactables.push(this.interaction);

    const deskLocal = (x, y, z) => { const v = new THREE.Vector3(x, y, z); td.desk.updateMatrixWorld(true); td.desk.localToWorld(v); root.updateMatrixWorld(true); return root.worldToLocal(v); };
    this.kb = deskLocal(0, 0.86, 0.27);
    this.mouse = deskLocal(0.3, 0.855, 0.27);
    this.deskTop = deskLocal(0.14, 0.84, 0.2);
    this.t = 0; this.state = 'trade'; this.stateT = 0; this.nextReact = 5 + Math.random() * 5;
    this.lookIdx = 1; this.nextLook = 2; this.headYaw = 0; this.nodPhase = 0;
    this.lineIdx = Math.floor(Math.random() * ANSEM_LINES.length);
    for (const a of this.arms) a.cur.copy(this.kb);
  }

  setDrained(v) { this.drained = !!v; }
  setHyped(v) { this.hyped = !!v; if (v) this.drained = false; }
  pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  hypeLine() { this.react('fist'); return this.pick(ANSEM_HYPE_LINES); }
  annoyedLine() { this.react('shake'); return this.pick(ANSEM_ANNOYED); }
  upsetLine() { this.react('shake'); return this.pick(["LMFAOOOO who drained me", "that's a frigid move. whoever did that", 'job not finished. starting from zero again', 'complacency. never again']); }
  callLine() { this.react('nod'); return this.pick(ANSEM_CALL_LINES); }
  bagsLine() { this.react('cross'); return this.pick(ANSEM_BAGS); }
  nextLine() {
    if (this.hyped && Math.random() < 0.7) return this.hypeLine();
    if (this.drained && Math.random() < 0.5) return this.upsetLine();
    this.lineIdx = (this.lineIdx + 1 + Math.floor(Math.random() * (ANSEM_LINES.length - 1))) % ANSEM_LINES.length;
    this.react(Math.random() < 0.35 ? 'cross' : 'talk'); return ANSEM_LINES[this.lineIdx];
  }
  react(kind) { this.state = kind; this.stateT = 0; }
  headWorld(out) { return this.head.getWorldPosition(out); }

  update(dt) {
    this.t += dt; this.stateT += dt;
    const t = this.t, st = this.state;
    for (const c of this.charts) c.update(t);
    const DUR = { talk: 2.4, cross: 5.5, nod: 1.6, fist: 1.8, shake: 1.9 };
    if (st === 'trade') {
      this.nextReact -= dt;
      if (this.nextReact <= 0) { const r = Math.random(); this.react(r < 0.45 ? 'cross' : r < 0.75 ? 'nod' : 'fist'); this.nextReact = (8 + Math.random() * 8) * (this.hyped ? 0.5 : 1); }
    } else if (this.stateT > (DUR[st] || 2)) { this.state = 'trade'; this.stateT = 0; }
    const s2 = this.state;

    this.nextLook -= dt;
    if (this.nextLook <= 0) { this.lookIdx = (this.lookIdx + 1 + (Math.random() < 0.5 ? 1 : 0)) % this.monitorLocal.length; this.nextLook = 1.4 + Math.random() * 2.6; }
    const ml = this.monitorLocal[this.lookIdx];
    let yawT = Math.atan2(ml.x, ml.z) * 0.85, pitchT = 0.08, leanT = 0.06, rollT = 0;
    if (s2 === 'talk') { yawT = -0.8; pitchT = 0.02; leanT = -0.02; }
    if (s2 === 'cross') { leanT = -0.2; pitchT = -0.04; yawT *= 0.4; }
    if (s2 === 'nod') { pitchT = 0.1 + Math.max(0, Math.sin(this.stateT * 7)) * 0.22; }
    if (s2 === 'fist') { leanT = 0.1; pitchT = 0.14; }
    if (s2 === 'shake') { yawT = -0.6 + Math.sin(this.stateT * 9) * 0.25; leanT = -0.12; pitchT = -0.02; }
    const k = 1 - Math.exp(-dt * 6);
    this.headYaw += (yawT - this.headYaw) * k;
    this.head.rotation.y = this.headYaw + Math.sin(t * 2.7) * 0.012;
    this.head.rotation.x += (pitchT + Math.sin(t * 1.9) * 0.01 - this.head.rotation.x) * (s2 === 'nod' ? 1 - Math.exp(-dt * 14) : k);
    this.head.rotation.z += (rollT - this.head.rotation.z) * k;
    this.torso.rotation.x += (leanT - this.torso.rotation.x) * (1 - Math.exp(-dt * 3));
    this.torso.rotation.y = this.headYaw * 0.12;
    const br = Math.sin(t * 1.8);
    this.chest.scale.set(1.12 + br * 0.008, 1, 0.78 + br * 0.012);
    this.torso.position.y = 0.58 + br * 0.004;
    this.mouth.scale.y = (s2 === 'talk' || s2 === 'shake') ? 1 + Math.abs(Math.sin(this.stateT * 13)) * 0.9 : 1;

    const [L, R] = this.arms;
    const tL = this.kb.clone().add(new THREE.Vector3(0.09, 0, -0.02));
    const tR = this.mouse.clone();
    if (s2 === 'trade' || s2 === 'talk' || s2 === 'nod') {
      tL.x += Math.sin(t * 6.7) * 0.022; tL.y += Math.max(0, Math.sin(t * 16)) * 0.016; tL.z += Math.sin(t * 2.9) * 0.012;
      if (Math.sin(t * 0.6) > 0.4) { tR.copy(this.kb).add(new THREE.Vector3(-0.1, 0, -0.02)); tR.y += Math.max(0, Math.sin(t * 14 + 1)) * 0.016; }
      else { tR.x += Math.sin(t * 1.5) * 0.028; tR.z += Math.cos(t * 2.1) * 0.022; tR.y += Math.max(0, Math.sin(t * 8)) * 0.007; }
    }
    if (s2 === 'cross') {
      // signature pose: lean back, arms folded high across the chest
      const e = Math.min(1, this.stateT * 3);
      const c = this.torso.localToWorld(new THREE.Vector3(0, 0.3, 0.2)); this.root.worldToLocal(c);
      tL.lerp(c.clone().add(new THREE.Vector3(-0.17, 0.0, 0.08)), e);
      tR.lerp(c.clone().add(new THREE.Vector3(0.17, 0.03, 0.1)), e);
    }
    if (s2 === 'fist') {
      // raise right fist then bring it down on the desk
      const p = this.stateT;
      const up = this.deskTop.clone().add(new THREE.Vector3(-0.05, 0.3, -0.02));
      const down = this.deskTop.clone();
      const ph = p < 0.45 ? 0 : p < 0.6 ? 1 : p < 1.0 ? 0 : p < 1.15 ? 1 : 1;
      tR.copy(ph ? down : up);
    }
    if (s2 === 'shake') { tL.lerp(this.kb.clone().add(new THREE.Vector3(0.16, 0.0, -0.1)), 0.6); tR.lerp(this.kb.clone().add(new THREE.Vector3(-0.16, 0.0, -0.1)), 0.6); }
    const kh = 1 - Math.exp(-dt * (s2 === 'fist' ? 22 : 12));
    L.cur.lerp(tL, kh); R.cur.lerp(tR, kh);
    this.root.updateMatrixWorld(true);
    this.solveArm(L, L.cur); this.solveArm(R, R.cur);
  }
}
Ansem.prototype.solveArm = Trader.prototype.solveArm;
