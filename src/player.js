// Alon: procedural stylised vinyl-toy character + controller.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { tankTex, denimTex, capTex, bandTex, canvasTex, rand } from './textures.js';

const HEAD_R = 0.3;
const HEAD_S = new THREE.Vector3(1.0, 0.97, 0.95);
const HEAD_Y = 1.5;

function hairBumpTex() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 380; i++) {
      const x = rand() * w, l = rand() * 0.4 + 0.08;
      g.strokeStyle = `rgba(${rand() > 0.5 ? 255 : 0},${rand() > 0.5 ? 255 : 0},${rand() > 0.5 ? 255 : 0},${l})`;
      g.strokeStyle = rand() > 0.5 ? `rgba(255,255,255,${l})` : `rgba(0,0,0,${l})`;
      g.lineWidth = 1 + rand() * 3;
      g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + rand() * 6 - 3, h * 0.3, x + rand() * 8 - 4, h * 0.7, x + rand() * 6 - 3, h); g.stroke();
    }
  }, { srgb: false });
}

// point on the head ellipsoid surface (front, +z) in head-local coords
function surf(x, y, push = 0) {
  const r = HEAD_R;
  const nx = x / (r * HEAD_S.x), ny = y / (r * HEAD_S.y);
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  return new THREE.Vector3(x, y, nz * r * HEAD_S.z + push);
}

export function buildAlon() {
  const root = new THREE.Group(); root.name = 'Alon';
  const body = new THREE.Group(); root.add(body); // bobbing part

  // --- materials: soft vinyl ---
  const skin = new THREE.MeshPhysicalMaterial({ color: '#ead9cb', roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color('#ffd9c7'), sheenRoughness: 0.6 });
  const hairMat = new THREE.MeshPhysicalMaterial({ color: '#a9a49d', roughness: 0.5, bumpMap: hairBumpTex(), bumpScale: 0.45, sheen: 0.7, sheenColor: new THREE.Color('#eae6df'), sheenRoughness: 0.35, side: THREE.DoubleSide });
  const dark = new THREE.MeshPhysicalMaterial({ color: '#1c1a19', roughness: 0.4, clearcoat: 0.3 });
  const tankMat = new THREE.MeshPhysicalMaterial({ map: tankTex(), roughness: 0.85, sheen: 1, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.8 });
  const denimT = denimTex();
  const denim = new THREE.MeshPhysicalMaterial({ map: denimT, color: '#d8e4f2', roughness: 0.9, sheen: 0.6, sheenColor: new THREE.Color('#cfe0ff'), sheenRoughness: 0.9 });
  const shoe = new THREE.MeshPhysicalMaterial({ color: '#f1efea', roughness: 0.55, clearcoat: 0.2 });
  const sole = new THREE.MeshPhysicalMaterial({ color: '#d9d6cf', roughness: 0.7 });
  const capMat = new THREE.MeshPhysicalMaterial({ map: capTex(), roughness: 0.75, sheen: 0.5, sheenColor: new THREE.Color('#fff3b0') });
  const bandMat = new THREE.MeshPhysicalMaterial({ map: bandTex(), roughness: 0.75, sheen: 0.5, sheenColor: new THREE.Color('#fff3b0') });
  const rimMat = new THREE.MeshPhysicalMaterial({ color: '#f7f6f2', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
  const lensMat = new THREE.MeshPhysicalMaterial({ color: '#0d0b0b', roughness: 0.05, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2 });

  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };

  // ---------- legs ----------
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.095, 0.82, 0); body.add(hip);
    const leg = add(hip, new THREE.CylinderGeometry(0.098, 0.122, 0.74, 28, 6, true), denim, 0, -0.37, 0);
    // bagginess wrinkles via vertex jitter
    const p = leg.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i); const a = Math.atan2(p.getZ(i), p.getX(i));
      const k = 1 + 0.035 * Math.sin(a * 5 + y * 18) * (0.5 - y);
      p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k);
    }
    leg.geometry.computeVertexNormals(); leg.material.side = THREE.DoubleSide;
    add(hip, new THREE.TorusGeometry(0.118, 0.012, 10, 32), denim, 0, -0.735, 0).rotation.x = Math.PI / 2;
    const foot = new THREE.Group(); foot.position.set(0, -0.74, 0); hip.add(foot);
    const sh = add(foot, new RoundedBoxGeometry(0.15, 0.1, 0.29, 5, 0.05), shoe, 0, -0.025, 0.045);
    add(foot, new RoundedBoxGeometry(0.16, 0.035, 0.3, 4, 0.016), sole, 0, -0.07, 0.045);
    add(foot, new RoundedBoxGeometry(0.07, 0.012, 0.1, 2, 0.005), new THREE.MeshStandardMaterial({ color: '#e4e1da', roughness: 0.8 }), 0, 0.03, 0.09).rotation.x = -0.35;
    legs.push(hip);
  }
  // pelvis / waistband
  const pelvis = add(body, new THREE.SphereGeometry(0.2, 32, 20), denim, 0, 0.84, 0); pelvis.scale.set(1.08, 0.55, 0.8);

  // ---------- torso (tank top) ----------
  const torso = new THREE.Group(); torso.position.y = 0.8; body.add(torso);
  const prof = [[0.0, 0.0], [0.175, 0.0], [0.185, 0.08], [0.18, 0.2], [0.19, 0.3], [0.185, 0.36], [0.16, 0.41], [0.1, 0.44], [0.07, 0.445]].map(([r, y]) => new THREE.Vector2(r, y));
  const tg = new THREE.LatheGeometry(prof, 48, Math.PI, Math.PI * 2);
  const tank = add(torso, tg, tankMat); tank.scale.set(1, 1, 0.72);
  // armhole skin + shoulders
  for (const s of [-1, 1]) { const sc = add(torso, new THREE.SphereGeometry(0.058, 20, 14), skin, s * 0.165, 0.355, 0); sc.scale.set(1, 1.1, 1); }
  // neck
  add(body, new THREE.CylinderGeometry(0.055, 0.062, 0.12, 20), skin, 0, 1.27, 0);

  // ---------- arms ----------
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.19, 1.15, 0); sh.rotation.z = s * 0.1; body.add(sh);
    add(sh, new THREE.CapsuleGeometry(0.043, 0.22, 6, 16), skin, 0, -0.14, 0);
    const el = new THREE.Group(); el.position.y = -0.28; sh.add(el);
    add(el, new THREE.CapsuleGeometry(0.038, 0.2, 6, 16), skin, 0, -0.12, 0);
    const hand = add(el, new THREE.SphereGeometry(0.052, 20, 14), skin, 0, -0.27, 0.005); hand.scale.set(0.8, 1.15, 0.95);
    add(el, new THREE.CapsuleGeometry(0.016, 0.03, 4, 8), skin, s * -0.035, -0.255, 0.03).rotation.z = s * 0.6; // thumb
    arms.push({ sh, el });
  }

  // ---------- head ----------
  const head = new THREE.Group(); head.position.y = HEAD_Y + 0.03; head.scale.setScalar(1.12); body.add(head);
  const skull = add(head, new THREE.SphereGeometry(HEAD_R, 64, 48), skin); skull.scale.copy(HEAD_S);
  // jaw/cheek softness
  const jaw = add(head, new THREE.SphereGeometry(HEAD_R * 0.8, 48, 32), skin, 0, -0.07, 0.03); jaw.scale.set(1, 0.85, 0.95);
  // nose
  { const n = surf(0, -0.045, -0.006); add(head, new THREE.SphereGeometry(0.03, 16, 12), skin, n.x, n.y, n.z).scale.set(0.8, 0.8, 0.7); }
  // mouth
  { const m = surf(0, -0.135, -0.006); const mo = add(head, new RoundedBoxGeometry(0.06, 0.013, 0.02, 2, 0.006), dark, m.x, m.y, m.z); mo.rotation.x = -0.35; }
  // ears
  for (const s of [-1, 1]) { const e = add(head, new THREE.SphereGeometry(0.06, 20, 14), skin, s * 0.29, -0.03, 0.0); e.scale.set(0.45, 1, 0.75); }
  // eyebrows
  for (const s of [-1, 1]) { const b = surf(s * 0.12, 0.115, 0.005); const eb = add(head, new RoundedBoxGeometry(0.11, 0.018, 0.02, 2, 0.008), dark, b.x, b.y, b.z); eb.rotation.y = s * 0.35; eb.rotation.z = s * -0.05; }

  // sunglasses: big white ovals with dark lenses
  const glasses = new THREE.Group(); head.add(glasses);
  const ellShape = (rx, ry) => { const sh = new THREE.Shape(); sh.absellipse(0, 0, rx, ry, 0, Math.PI * 2); return sh; };
  for (const s of [-1, 1]) {
    const c = surf(s * 0.122, 0.015, 0.03);
    const rimS = ellShape(0.115, 0.08); rimS.holes.push(ellShape(0.087, 0.058));
    const rim = add(glasses, new THREE.ExtrudeGeometry(rimS, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 4, curveSegments: 48 }), rimMat, c.x, c.y, c.z - 0.02);
    rim.rotation.y = s * 0.38;
    const lens = add(glasses, new THREE.ShapeGeometry(ellShape(0.09, 0.061), 48), lensMat, 0, 0, 0);
    lens.position.copy(c).add(new THREE.Vector3(0, 0, -0.005)); lens.rotation.y = s * 0.38;
    // lens catchlight
    const hl = new THREE.Mesh(new THREE.ShapeGeometry(ellShape(0.022, 0.012), 16), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 }));
    hl.position.set(-0.035, 0.028, 0.002); lens.add(hl); hl.rotation.z = 0.5;
    // temple arm
    const arm = add(glasses, new RoundedBoxGeometry(0.02, 0.022, 0.22, 2, 0.009), rimMat, s * 0.25, 0.03, 0.06); arm.rotation.y = s * -0.1;
  }
  { const b = surf(0, 0.03, 0.035); add(glasses, new RoundedBoxGeometry(0.05, 0.022, 0.02, 2, 0.009), rimMat, b.x, b.y, b.z); }

  // hair: shell + curtain + clumps + bangs
  const hairShell = add(head, new THREE.SphereGeometry(HEAD_R * 1.06, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat, 0, 0.01, -0.01);
  hairShell.scale.copy(HEAD_S);
  const hairFill = hairMat.clone(); hairFill.color.set('#8f8a83'); hairFill.bumpScale = 0.3;
  // sculpted vinyl hair curtain: lathe + displaced grooves + jagged hem
  {
    const prof = [];
    const N = 28;
    for (let i = 0; i <= N; i++) {
      const t = i / N; const y = 0.08 - t * 0.5;
      const r = 0.325 + Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5) * 0.03 - Math.max(0, t - 0.75) * 0.12;
      prof.push(new THREE.Vector2(r, y));
    }
    const geo = new THREE.LatheGeometry(prof, 140, 0.98, Math.PI * 2 - 1.96);
    const p = geo.attributes.position;
    const colors = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const phi = Math.atan2(x, z);
      const t = (0.08 - y) / 0.5;
      const groove = 1 + (0.022 * Math.sin(phi * 15 + t * 1.2) + 0.01 * Math.sin(phi * 37 + 2.0)) * (0.25 + t);
      const jag = t > 0.8 ? (0.5 + 0.5 * Math.sin(phi * 11) * Math.cos(phi * 4.7 + 1.3)) * 0.07 * ((t - 0.8) / 0.2) : 0;
      p.setXYZ(i, x * groove, y - jag, z * groove);
      const shade = 0.78 + 0.22 * (1 - t) + 0.06 * Math.sin(phi * 15 + t * 1.2);
      colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = shade;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const hm = hairMat.clone(); hm.vertexColors = true; hm.bumpScale = 0.25;
    add(head, geo, hm, 0, 0, -0.012);
  }
  // side locks framing the face
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const a = s * (0.98 + k * 0.12);
      const cl = add(head, new THREE.CapsuleGeometry(0.04, 0.38 + k * 0.03, 4, 12), hairMat, Math.sin(a) * 0.33, -0.2 - k * 0.01, Math.cos(a) * 0.32);
      cl.scale.set(1, 1, 0.45); cl.rotation.y = a;
    }
  }
  // bangs
  for (let i = 0; i < 9; i++) {
    const x = -0.2 + i * 0.05; const p = surf(x * 0.98, 0.15, 0.012);
    const bg = add(head, new THREE.CapsuleGeometry(0.034, 0.07 + (i % 3) * 0.02, 4, 10), hairMat, p.x, p.y - 0.005, p.z);
    bg.scale.set(1, 1, 0.4); bg.rotation.y = Math.atan2(p.x, p.z); bg.rotation.x = -0.25; bg.rotation.z = (rand() - 0.5) * 0.25;
  }

  // bandana cap + band
  const cap = add(head, new THREE.SphereGeometry(HEAD_R * 1.11, 64, 24, 0, Math.PI * 2, 0, Math.PI * 0.4), capMat, 0, 0.02, -0.01);
  cap.scale.set(1.0, 0.98, 0.96);
  const band = add(head, new THREE.CylinderGeometry(HEAD_R * 1.105, HEAD_R * 1.12, 0.1, 72, 1, true, Math.PI, Math.PI * 2), bandMat, 0, 0.16, -0.01);
  band.scale.set(1, 1, 0.96); band.rotation.x = -0.12; band.material.side = THREE.DoubleSide;
  cap.rotation.x = -0.12;
  // knot at back
  add(head, new THREE.SphereGeometry(0.05, 16, 12), bandMat, 0.02, 0.17, -0.33).scale.set(1.2, 0.8, 0.7);
  for (const s of [-1, 1]) { const t = add(head, new RoundedBoxGeometry(0.06, 0.16, 0.02, 2, 0.01), bandMat, 0.02 + s * 0.04, 0.07, -0.34); t.rotation.z = s * 0.35; }

  // contact shadow blob (cheap AO under feet)
  const blobTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.006; root.add(blob);

  return { root, body, head, legs, arms, torso };
}

// ---------- controller ----------
export class Player {
  constructor(scene, colliders) {
    this.rig = buildAlon();
    this.object = this.rig.root;
    scene.add(this.object);
    this.colliders = colliders;
    this.pos = this.object.position;
    this.vel = new THREE.Vector3();
    this.facing = Math.PI; // facing -z (toward the back wall)
    this.radius = 0.3;
    this.phase = 0; this.t = 0; this.moveAmt = 0;
    this.enabled = true;
  }
  update(dt, input, camYaw) {
    this.t += dt;
    let ix = 0, iz = 0;
    if (this.enabled) {
      if (input.f) iz -= 1; if (input.b) iz += 1; if (input.l) ix -= 1; if (input.r) ix += 1;
    }
    const len = Math.hypot(ix, iz);
    const speed = input.run ? 4.2 : 2.3;
    const target = new THREE.Vector3();
    if (len > 0) {
      ix /= len; iz /= len;
      const s = Math.sin(camYaw), c = Math.cos(camYaw);
      target.set(ix * c + iz * s, 0, -ix * s + iz * c).multiplyScalar(speed);
    }
    this.vel.lerp(target, 1 - Math.exp(-dt * 10));
    this.pos.addScaledVector(this.vel, dt);
    this.collide();
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > 0.15) {
      const want = Math.atan2(this.vel.x, this.vel.z);
      let d = want - this.facing; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.facing += d * (1 - Math.exp(-dt * 12));
    }
    this.object.rotation.y = this.facing;
    this.animate(dt, sp, speed);
  }
  collide() {
    const r = this.radius;
    for (const b of this.colliders) {
      const cx = Math.max(b.minX, Math.min(this.pos.x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(this.pos.z, b.maxZ));
      let dx = this.pos.x - cx, dz = this.pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-8) { const d = Math.sqrt(d2); this.pos.x = cx + dx / d * r; this.pos.z = cz + dz / d * r; }
        else { // inside: push out along smallest axis
          const pen = [this.pos.x - b.minX, b.maxX - this.pos.x, this.pos.z - b.minZ, b.maxZ - this.pos.z];
          const m = pen.indexOf(Math.min(...pen));
          if (m === 0) this.pos.x = b.minX - r; else if (m === 1) this.pos.x = b.maxX + r; else if (m === 2) this.pos.z = b.minZ - r; else this.pos.z = b.maxZ + r;
        }
      }
    }
  }
  animate(dt, sp, maxSp) {
    const k = Math.min(1, sp / 2.3);
    this.moveAmt += (k - this.moveAmt) * (1 - Math.exp(-dt * 8));
    const m = this.moveAmt;
    this.phase += dt * (5 + sp * 2.6) * (m > 0.02 ? 1 : 0);
    const s = Math.sin(this.phase);
    const R = this.rig;
    const amp = 0.55 * m + (sp > 3 ? 0.2 : 0);
    R.legs[0].rotation.x = s * amp; R.legs[1].rotation.x = -s * amp;
    R.arms[0].sh.rotation.x = -s * amp * 0.85; R.arms[1].sh.rotation.x = s * amp * 0.85;
    R.arms[0].el.rotation.x = -0.25 * m - 0.08; R.arms[1].el.rotation.x = -0.25 * m - 0.08;
    const breathe = Math.sin(this.t * 2.2);
    R.body.position.y = Math.abs(Math.cos(this.phase)) * 0.045 * m + breathe * 0.004 * (1 - m);
    R.body.rotation.x = 0.06 * m * (sp > 3 ? 2 : 1);
    R.torso.scale.set(1 + breathe * 0.006 * (1 - m), 1 + breathe * 0.008 * (1 - m), 1);
    R.head.rotation.z = Math.sin(this.t * 0.9) * 0.03 * (1 - m) + s * 0.03 * m;
    R.head.rotation.y = Math.sin(this.t * 0.5) * 0.08 * (1 - m);
    R.head.rotation.x = -0.03 * m;
    R.arms[0].sh.rotation.z = -0.1 - breathe * 0.015 * (1 - m);
    R.arms[1].sh.rotation.z = 0.1 + breathe * 0.015 * (1 - m);
  }
}
