// Couch Guy: laid-back NPC on the lounge couch, scrolling his phone. Same soft vinyl-toy style.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rand } from './textures.js';

export const COUCH_NAME = 'RASMR'; // rename here
export const COUCH_LINES = [
  "the FOMO thing is just a side deal bro, I'm still a pump guy",
  "relax, FOMO is like a lil side quest. pump is home",
  "Alon I swear FOMO is just a side deal. I'm here every day",
  "it's not a whole thing, FOMO is just a small side deal",
  "I'm loyal bro. FOMO is just... a side deal. don't tell anyone",
  "bro FOMO doesn't even count, it's a side deal. pump forever",
  'just checking chirpr real quick',
  "I'm working, this is research",
  'did the airdrop come yet',
  "bro I'm literally locked in",
  'five more minutes then I start the sprint',
  "this couch is load-bearing for the whole company",
  'someone on chirpr said BATON is a psyop. thoughts?',
  "I'm not scrolling, I'm doing sentiment analysis",
  "my screen time is a personal record. that's growth",
  'DUVE been yelling at his monitors for 3 hours',
  "honestly the pizza's better cold",
  'gm. (it is 4pm)',
];
export const COUCH_HYPE_LINES = [
  'see? told you FOMO was just a side deal. PUMP DELIVERED',
  "BRO. THE AIRDROP CAME. I'M OFF THE COUCH. (I'm still on the couch)",
  "I refreshed chirpr and everyone's crying. happy crying.",
  'ALON DELIVERED. I told everyone. I told my mom.',
  "years of 'airdrop when' and I was HERE for it",
  "I'm screenshotting everything. history.",
  'we are SO back. I am locked in FOREVER now',
  "I'm buying a second couch. for the vibes.",
];

export class CouchGuy {
  constructor(scene, world) {
    this.name = COUCH_NAME;
    // couch group at (-4.3, 0, 4.85) facing -z; sit on the left cushion
    const root = new THREE.Group(); root.name = COUCH_NAME;
    root.position.set(-4.62, 0, 4.86); root.rotation.y = Math.PI; scene.add(root); this.root = root;

    const skin = new THREE.MeshPhysicalMaterial({ color: '#e2b898', roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.5, sheen: 0.35, sheenColor: new THREE.Color('#ffd6bf'), sheenRoughness: 0.6 });
    const stub = new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.95, sheen: 0.35, sheenColor: new THREE.Color('#ffd6bf'), sheenRoughness: 0.6 });
    const hair = new THREE.MeshPhysicalMaterial({ color: '#3a2415', roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color('#8a5a3a'), sheenRoughness: 0.4 });
    const hairDark = hair.clone(); hairDark.color.set('#2a190e');
    const hood = new THREE.MeshPhysicalMaterial({ color: '#2c2c2f', roughness: 0.92, sheen: 0.9, sheenColor: new THREE.Color('#55555e'), sheenRoughness: 0.7 });
    const hoodIn = new THREE.MeshPhysicalMaterial({ color: '#202022', roughness: 0.95 });
    const tee = new THREE.MeshPhysicalMaterial({ color: '#2f5fc0', roughness: 0.8, sheen: 0.4, sheenColor: new THREE.Color('#7fa0ff') });
    const jeans = new THREE.MeshPhysicalMaterial({ color: '#1e1f22', roughness: 0.85, sheen: 0.5, sheenColor: new THREE.Color('#4a4e58'), sheenRoughness: 0.8 });
    const shoeM = new THREE.MeshPhysicalMaterial({ color: '#bfc0c2', roughness: 0.6, sheen: 0.4, sheenColor: new THREE.Color('#fff') });
    const shoeW = new THREE.MeshPhysicalMaterial({ color: '#eceae4', roughness: 0.55 });
    const shoeD = new THREE.MeshPhysicalMaterial({ color: '#8d8f93', roughness: 0.6 });
    const soleM = new THREE.MeshPhysicalMaterial({ color: '#e9e6de', roughness: 0.7 });
    const eyeM = new THREE.MeshPhysicalMaterial({ color: '#2a1a10', roughness: 0.1, clearcoat: 1 });
    const lipM = new THREE.MeshPhysicalMaterial({ color: '#b5705f', roughness: 0.5 });
    const mouthM = new THREE.MeshPhysicalMaterial({ color: '#5e2522', roughness: 0.6 });
    const phoneM = new THREE.MeshPhysicalMaterial({ color: '#141416', roughness: 0.3, clearcoat: 1 });
    const add = (p, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };

    // ---- legs (seated, knees apart, feet on the floor) ----
    // seat cushion top ~0.60; thighs rest on it, knees near the cushion edge
    this.legs = [];
    const TH = 0.44, SH = 0.56;
    for (const s of [1, -1]) {
      const hip = new THREE.Group(); hip.position.set(s * 0.11, 0.675, -0.03); hip.rotation.y = s * 0.14; root.add(hip);
      const th = add(hip, new THREE.CapsuleGeometry(0.078, TH, 8, 20), jeans, 0, 0, TH / 2); th.rotation.x = Math.PI / 2;
      const knee = new THREE.Group(); knee.position.set(0, 0, TH); hip.add(knee);
      add(knee, new THREE.SphereGeometry(0.08, 18, 12), jeans);
      const shinA = -0.2; // shin angled slightly forward
      const shin = new THREE.Group(); shin.rotation.x = shinA; knee.add(shin);
      add(shin, new THREE.CapsuleGeometry(0.066, SH - 0.1, 8, 18), jeans, 0, -SH / 2 + 0.02, 0);
      // sneaker (counter-rotated to sit flat)
      const foot = new THREE.Group(); foot.position.set(0, -SH + 0.02, 0); foot.rotation.x = -shinA; shin.add(foot);
      const up = add(foot, new RoundedBoxGeometry(0.13, 0.1, 0.27, 5, 0.045), shoeM, 0, -0.02, 0.06);
      add(foot, new RoundedBoxGeometry(0.135, 0.06, 0.12, 4, 0.025), shoeW, 0, -0.035, 0.15);       // toe box mesh
      add(foot, new RoundedBoxGeometry(0.14, 0.035, 0.29, 4, 0.016), soleM, 0, -0.078, 0.06);        // midsole
      for (const k of [-1, 1]) { const st = add(foot, new RoundedBoxGeometry(0.004, 0.04, 0.12, 1, 0.002), shoeD, k * 0.067, -0.02, 0.05); st.rotation.x = 0.35; } // plain side stripe
      add(foot, new RoundedBoxGeometry(0.1, 0.03, 0.1, 3, 0.012), shoeW, 0, 0.03, 0.06);              // tongue/laces
      add(shin, new THREE.TorusGeometry(0.066, 0.01, 8, 22), jeans, 0, -SH + 0.12, 0).rotation.x = Math.PI / 2; // cuff
      this.legs.push({ s, hip, knee, shin, foot, base: hip.rotation.x });
    }
    // pelvis
    const pelvis = add(root, new THREE.SphereGeometry(0.2, 32, 20), jeans, 0, 0.68, -0.07); pelvis.scale.set(1.08, 0.55, 0.9);

    // ---- torso (leans back into the cushions) ----
    const torso = new THREE.Group(); torso.position.set(0, 0.67, -0.1); torso.rotation.x = -0.3; root.add(torso); this.torso = torso;
    const prof = [[0.0, 0.0], [0.2, 0.0], [0.225, 0.07], [0.235, 0.18], [0.24, 0.3], [0.235, 0.37], [0.2, 0.43], [0.12, 0.47], [0.07, 0.48]].map(([r, y]) => new THREE.Vector2(r, y));
    const body = add(torso, new THREE.LatheGeometry(prof, 48), hood); body.scale.set(1.12, 1, 0.78);
    add(torso, new THREE.TorusGeometry(0.215, 0.028, 10, 40), hood, 0, 0.02, 0).rotation.x = Math.PI / 2; // ribbed hem
    // kangaroo pocket
    const pk = add(torso, new RoundedBoxGeometry(0.28, 0.13, 0.03, 4, 0.012), hood, 0, 0.11, 0.17); pk.rotation.x = -0.06;
    add(torso, new RoundedBoxGeometry(0.29, 0.008, 0.02, 1, 0.003), hoodIn, 0, 0.175, 0.18);
    // hood bunched behind the neck + front opening
    const hd = add(torso, new THREE.TorusGeometry(0.11, 0.055, 14, 32), hood, 0, 0.47, -0.02); hd.rotation.x = Math.PI / 2 + 0.25; hd.scale.set(1.25, 1, 1);
    const hb = add(torso, new THREE.SphereGeometry(0.15, 24, 16), hood, 0, 0.47, -0.14); hb.scale.set(1.15, 0.75, 0.6);
    add(torso, new THREE.TorusGeometry(0.068, 0.014, 8, 24), tee, 0, 0.48, 0.02).rotation.x = Math.PI / 2 - 0.15; // blue tee collar
    for (const s of [-1, 1]) { const dc = add(torso, new THREE.CapsuleGeometry(0.006, 0.12, 4, 6), hoodIn, s * 0.04, 0.39, 0.155); dc.rotation.x = 0.15; }
    add(torso, new THREE.CylinderGeometry(0.058, 0.066, 0.11, 18), skin, 0, 0.52, 0.0);

    // ---- arms (2-bone IK) ----
    this.arms = [];
    const L1 = 0.27, L2 = 0.25;
    for (const s of [1, -1]) {
      const shoulder = new THREE.Group(); shoulder.position.set(s * 0.25, 0.4, 0.0); torso.add(shoulder);
      add(shoulder, new THREE.SphereGeometry(0.085, 20, 14), hood, 0, -0.01, 0);
      add(shoulder, new THREE.CapsuleGeometry(0.075, L1 - 0.05, 6, 16), hood, 0, -L1 / 2, 0);
      const elbow = new THREE.Group(); elbow.position.y = -L1; shoulder.add(elbow);
      add(elbow, new THREE.SphereGeometry(0.07, 16, 12), hood);
      add(elbow, new THREE.CapsuleGeometry(0.066, L2 - 0.09, 6, 16), hood, 0, -L2 / 2 + 0.02, 0);
      add(elbow, new THREE.TorusGeometry(0.052, 0.016, 8, 20), hood, 0, -L2 + 0.04, 0).rotation.x = Math.PI / 2; // cuff
      const hand = add(elbow, new THREE.SphereGeometry(0.05, 18, 12), skin, 0, -L2 - 0.01, 0); hand.scale.set(0.85, 1.05, 1.05);
      add(elbow, new THREE.CapsuleGeometry(0.016, 0.028, 4, 8), skin, s * 0.04, -L2, 0.02).rotation.z = s * 0.7;
      this.arms.push({ s, shoulder, elbow, L1, L2, cur: new THREE.Vector3() });
    }

    // ---- phone ----
    const phone = new THREE.Group(); root.add(phone); this.phone = phone;
    add(phone, new RoundedBoxGeometry(0.075, 0.15, 0.01, 3, 0.006), phoneM);
    const pc = document.createElement('canvas'); pc.width = 96; pc.height = 192; this.phoneCanvas = pc;
    this.phoneTex = new THREE.CanvasTexture(pc); this.phoneTex.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.138), new THREE.MeshBasicMaterial({ map: this.phoneTex })); scr.position.z = 0.0055; scr.userData.noAO = true; phone.add(scr);
    this.drawPhone(0);

    // ---- head ----
    const head = new THREE.Group(); head.position.set(0, 0.72, 0.02); torso.add(head); this.head = head;
    const HR = 0.27, JAW = 0.1;
    const skullG = new THREE.SphereGeometry(HR, 64, 48);
    { const p = skullG.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const f = 1 + JAW * Math.max(0, -y / HR) ** 1.4; p.setX(i, p.getX(i) * f * (y < 0 ? 0.96 : 1)); p.setZ(i, p.getZ(i) * f); if (y < 0) p.setY(i, y * 1.1); } skullG.computeVertexNormals(); }
    add(head, skullG, skin).scale.set(0.95, 1.02, 0.95);
    const fz = (x, y) => { const f = 1 + JAW * Math.max(0, -y / (HR * 1.02)) ** 1.4; const sx = HR * 0.95 * f * (y < 0 ? 0.96 : 1); const sy = HR * 1.02 * (y < 0 ? 1.1 : 1); return Math.sqrt(Math.max(0, 1 - (x / sx) ** 2 - (y / sy) ** 2)) * HR * 0.95 * f; };
    // stubble: thin darker shell over the jaw / chin / upper lip
    { const g = new THREE.SphereGeometry(HR * 1.006, 48, 24, Math.PI * 0.08, Math.PI * 0.84, Math.PI * 0.585, Math.PI * 0.33);
      const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const f = 1 + JAW * Math.max(0, -y / HR) ** 1.4; p.setX(i, p.getX(i) * f * (y < 0 ? 0.96 : 1)); p.setZ(i, p.getZ(i) * f); if (y < 0) p.setY(i, y * 1.1); } g.computeVertexNormals();
      // soft fade at the edges so it reads as stubble, not a mask (vertex colors skin -> stubble)
      const uv = g.attributes.uv, cols = new Float32Array(p.count * 3), cs = new THREE.Color('#e2b898'), cb = new THREE.Color('#7f5c48'), tmp = new THREE.Color();
      for (let i = 0; i < p.count; i++) { const u = uv.getX(i), v = uv.getY(i); const eTop = THREE.MathUtils.smoothstep(1 - v, 0.0, 0.35), eSide = THREE.MathUtils.smoothstep(Math.min(u, 1 - u), 0.0, 0.22); const k = eTop * eSide; tmp.copy(cs).lerp(cb, k * 0.9); cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b; }
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const sb = add(head, g, stub); sb.scale.set(0.95, 1.02, 0.95); sb.castShadow = false; }
    for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.055, 18, 12), skin, s * 0.255, -0.02, -0.01).scale.set(0.45, 1, 0.75);
    for (const s of [-1, 1]) {
      const ex = s * 0.085, ey = 0.035, ez = fz(ex, ey) - 0.012;
      const e = add(head, new THREE.SphereGeometry(0.03, 18, 12), eyeM, ex, ey, ez); e.scale.set(1, 0.9, 0.6);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); hl.position.set(ex - 0.01, ey + 0.01, ez + 0.017); head.add(hl);
      const br = add(head, new RoundedBoxGeometry(0.085, 0.022, 0.024, 2, 0.01), hairDark, s * 0.09, 0.098, fz(s * 0.09, 0.098) + 0.004); br.rotation.z = s * -0.06; br.rotation.y = s * 0.3;
    }
    const nose = add(head, new THREE.SphereGeometry(0.036, 18, 12), skin, 0, -0.03, fz(0, -0.03) + 0.01); nose.scale.set(0.85, 1.15, 0.85);
    const my = -0.11, mz = fz(0, my);
    const mouthG = new THREE.Group(); mouthG.position.set(0, my, mz - 0.001); head.add(mouthG); this.mouth = mouthG;
    const smile = add(mouthG, new THREE.CapsuleGeometry(0.008, 0.06, 4, 10), lipM); smile.rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) { const c = add(mouthG, new THREE.CapsuleGeometry(0.007, 0.012, 4, 6), lipM, s * 0.037, 0.005, -0.002); c.rotation.z = s * 2.1; }
    const open = add(mouthG, new THREE.SphereGeometry(0.03, 16, 10), mouthM, 0, -0.012, -0.004); open.scale.set(1.3, 0.05, 0.5); this.mouthOpen = open;
    // medium-length loose curls
    const curlGeo = new THREE.SphereGeometry(1, 20, 16);
    { const p = curlGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const f = 1 + 0.09 * Math.sin(x * 5 + y * 2) * Math.cos(z * 4 - y * 3); p.setXYZ(i, x * f, y * f, z * f); } curlGeo.computeVertexNormals(); }
    const cap = add(head, new THREE.SphereGeometry(HR, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.4), hairDark, 0, 0.03, -0.01); cap.scale.set(1.0, 1.04, 1.0);
    const capBack = add(head, new THREE.SphereGeometry(HR, 40, 24, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, 0, Math.PI * 0.66), hairDark, 0, 0.02, -0.012); capBack.scale.set(1.0, 1.02, 1.0);
    for (let ring = 0; ring < 11; ring++) {
      const theta = 0.05 + ring * 0.16;
      const n = Math.max(1, Math.round(Math.sin(theta) * 24));
      for (let j = 0; j < n; j++) {
        const phi = (j + (ring % 2) * 0.5 + rand() * 0.35) / n * Math.PI * 2;
        const x = Math.sin(theta) * Math.sin(phi), y = Math.cos(theta), z = Math.sin(theta) * Math.cos(phi);
        if (z > 0.5 && y < 0.7) continue;           // face clear
        if (y < 0.05 && z > -0.25) continue;         // over the ears, not on the cheeks
        const r0 = 0.058 + rand() * 0.03 + (y > 0.55 ? 0.015 : 0);
        const out = y > 0.45 ? 1.13 : 1.06;
        const c = add(head, curlGeo, rand() < 0.35 ? hairDark : hair, x * HR * out, y * HR * out + 0.03, z * HR * out - 0.012);
        c.scale.set(r0, r0 * (0.85 + rand() * 0.4), r0); c.rotation.set(rand() * 6, rand() * 6, rand() * 6);
      }
    }
    // loose fringe curls falling on the forehead
    for (let i = 0; i < 7; i++) { const x = -0.15 + i * 0.05 + (rand() - 0.5) * 0.02; const y = 0.165 + Math.sin(i * 2.1) * 0.015; const c = add(head, curlGeo, i % 2 ? hairDark : hair, x, y, fz(x, y) + 0.018); c.scale.setScalar(0.045 + rand() * 0.02); c.rotation.set(rand() * 6, rand() * 6, 0); }

    // collision for the legs in front of the couch + interaction
    world.colliders.push({ minX: -4.95, maxX: -4.28, minZ: 4.12, maxZ: 4.45 });
    this.interaction = { id: 'couch', prompt: `Press E to talk to ${COUCH_NAME}`, pos: new THREE.Vector3(-4.6, 0, 4.0), radius: 1.25 };
    world.interactables.push(this.interaction);

    this.t = Math.random() * 10; this.state = 'scroll'; this.stateT = 0; this.nextReact = 4 + Math.random() * 4;
    this.lineIdx = Math.floor(Math.random() * COUCH_LINES.length); this.scrollY = 0;
    // arm rest target (left arm along the backrest top) and phone pose
    this.restL = new THREE.Vector3(0.6, 0.93, -0.36);
    for (const a of this.arms) a.cur.copy(this.restL);
    this.update(0.016);
    for (let i = 0; i < 30; i++) this.update(0.05);
  }

  drawPhone(scroll) {
    const g = this.phoneCanvas.getContext('2d'), w = 96, h = 192;
    g.fillStyle = '#0b0d10'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff7a45'; g.fillRect(0, 0, w, 14);
    for (let i = -1; i < 6; i++) {
      const y = 18 + i * 34 - (scroll % 34);
      g.fillStyle = ['#55e392', '#ffd23a', '#a78bfa', '#ff4f6d', '#7a9bff'][(i + Math.floor(scroll / 34) + 50) % 5];
      g.beginPath(); g.arc(12, y + 8, 6, 0, 7); g.fill();
      g.fillStyle = '#3a3f46'; g.fillRect(22, y + 3, 50, 4); g.fillRect(22, y + 11, 64, 3); g.fillRect(22, y + 17, 40, 3);
    }
    this.phoneTex && (this.phoneTex.needsUpdate = true);
  }
  setHyped(v) { this.hyped = !!v; }
  nextLine() {
    if (this.hyped && Math.random() < 0.75) { this.react('laugh'); return COUCH_HYPE_LINES[Math.floor(Math.random() * COUCH_HYPE_LINES.length)]; }
    this.lineIdx = (this.lineIdx + 1 + Math.floor(Math.random() * (COUCH_LINES.length - 1))) % COUCH_LINES.length; this.react('talk'); return COUCH_LINES[this.lineIdx];
  }
  hypeLine() { this.react('laugh'); return COUCH_HYPE_LINES[Math.floor(Math.random() * COUCH_HYPE_LINES.length)]; }
  react(kind) { this.state = kind; this.stateT = 0; }
  headWorld(out) { return this.head.getWorldPosition(out); }

  solveArm(a, targetLocalRoot, pole) {
    const w = this.root.localToWorld(targetLocalRoot.clone());
    const p = a.shoulder.parent.worldToLocal(w).sub(a.shoulder.position);
    const L1 = a.L1, L2 = a.L2 + 0.02;
    let d = p.length(); const dir = p.clone().normalize();
    d = Math.min(Math.max(d, Math.abs(L1 - L2) + 0.02), L1 + L2 - 0.005);
    const a1 = Math.acos(THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const gam = Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    let axis = new THREE.Vector3().crossVectors(dir, pole);
    if (axis.lengthSq() < 1e-6) axis.set(1, 0, 0); axis.normalize();
    const q0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    const q = new THREE.Quaternion().setFromAxisAngle(axis, a1).multiply(q0);
    a.shoulder.quaternion.copy(q);
    const axisL = axis.clone().applyQuaternion(q.clone().invert()).normalize();
    a.elbow.quaternion.setFromAxisAngle(axisL, -(Math.PI - gam));
  }

  update(dt) {
    this.t += dt; this.stateT += dt; const t = this.t;
    if (this.state === 'scroll') {
      this.nextReact -= dt;
      if (this.nextReact <= 0) { this.react(Math.random() < (this.hyped ? 0.7 : 0.4) ? 'laugh' : 'lookup'); this.nextReact = (this.hyped ? 3 : 6) + Math.random() * 6; }
    } else if (this.stateT > (this.state === 'talk' ? 2.4 : this.state === 'laugh' ? 2.0 : 2.6)) { this.state = 'scroll'; this.stateT = 0; }
    // phone scrolling
    if (this.state === 'scroll' || this.state === 'laugh') { this.scrollY += dt * (Math.sin(t * 1.3) > 0.2 ? 60 : 4); if (((t * 10) | 0) % 2 === 0) this.drawPhone(this.scrollY); }

    // head: looking down at the phone, up when talking / looking around
    let pitchT = 0.42, yawT = -0.08, rollT = 0.05, mouthT = 0, leanT = -0.3;
    if (this.state === 'lookup') { pitchT = 0.02; yawT = 0.35 * Math.sin(this.stateT * 0.9); }
    if (this.state === 'talk') { pitchT = 0.0; yawT = 0.25; rollT = 0; mouthT = Math.abs(Math.sin(this.stateT * 13)) * 0.8; }
    if (this.state === 'laugh') { pitchT = -0.12 + Math.sin(this.stateT * 18) * 0.04; rollT = 0.12; mouthT = 0.7 + Math.sin(this.stateT * 20) * 0.25; leanT = -0.38 + Math.abs(Math.sin(this.stateT * 18)) * 0.03; }
    const k = 1 - Math.exp(-dt * 5);
    this.head.rotation.x += (pitchT + Math.sin(t * 1.7) * 0.015 - this.head.rotation.x) * k;
    this.head.rotation.y += (yawT - this.head.rotation.y) * k;
    this.head.rotation.z += (rollT - this.head.rotation.z) * k;
    this.torso.rotation.x += (leanT - this.torso.rotation.x) * (1 - Math.exp(-dt * 4));
    this.torso.position.y = 0.67 + Math.sin(t * 1.8) * 0.003;
    this.mouthOpen.scale.y += ((0.05 + mouthT * 0.9) - this.mouthOpen.scale.y) * (1 - Math.exp(-dt * 18));

    // leg bounce (his right leg), the other foot taps slowly
    const [Lg, Rg] = this.legs;
    const bounce = this.state === 'talk' ? 0.5 : 1;
    Rg.hip.rotation.x = -Math.max(0, Math.sin(t * 10)) * 0.045 * bounce;
    Rg.foot.rotation.x = 0.2 + Math.max(0, Math.sin(t * 10)) * 0.1 * bounce;
    Lg.foot.rotation.x = 0.2 + Math.max(0, Math.sin(t * 1.4)) * 0.06;

    // arms: left (+x) draped on the backrest, right holds the phone in front of the chest
    const [A, B] = this.arms;
    const tL = this.restL.clone(); tL.x += Math.sin(t * 0.6) * 0.01;
    const ph = new THREE.Vector3(-0.08, 0.98, 0.16);
    if (this.state === 'talk' || this.state === 'lookup') ph.set(-0.12, 0.88, 0.14);
    if (this.state === 'laugh') ph.y += Math.sin(this.stateT * 18) * 0.012;
    const kh = 1 - Math.exp(-dt * 8);
    A.cur.lerp(tL, kh); B.cur.lerp(ph, kh);
    this.root.updateMatrixWorld(true);
    this.solveArm(A, A.cur, new THREE.Vector3(0.9, -0.6, -0.4).normalize());
    this.solveArm(B, B.cur, new THREE.Vector3(-0.8, -1, -0.2).normalize());
    // phone sits in the right hand, screen tilted toward his face
    this.phone.position.copy(B.cur).add(new THREE.Vector3(0.01, 0.06, 0.02));
    const hw = this.head.getWorldPosition(new THREE.Vector3()); this.root.worldToLocal(hw);
    this.phone.up.set(0, 1, 0); this.phone.lookAt(this.root.localToWorld(hw.clone()));
  }
}
