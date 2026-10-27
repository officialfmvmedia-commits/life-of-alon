// The pump HQ office: geometry, materials, lights, colliders, interactables.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';
const { rand, rr } = T;

export const ROOM = { minX: -8, maxX: 8, minZ: -6, maxZ: 6, h: 3.4 };

export function buildWorld(scene) {
  const whiteboard = { done: false, set: () => {} };
  const colliders = [];
  const interactables = [];
  const animated = [];
  const screens = [];
  const W = new THREE.Group(); W.name = 'world'; scene.add(W);

  const col = (x, z, w, d, pad = 0.02) => colliders.push({ minX: x - w / 2 - pad, maxX: x + w / 2 + pad, minZ: z - d / 2 - pad, maxZ: z + d / 2 + pad });
  const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = W, shadow = true) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
    m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
  };
  const rbox = (w, h, d, r = 0.02, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const phys = (o) => new THREE.MeshPhysicalMaterial(o);

  // ---------------- materials ----------------
  const M = {
    floor: std({ map: T.woodFloorTex(), roughness: 0.42, metalness: 0 }),
    wall: std({ map: T.wallTex('#d8cdb9'), roughness: 0.92 }),
    accent: std({ map: T.wallTex('#22362f'), roughness: 0.9 }),
    ceil: std({ color: '#4a4744', roughness: 0.95 }),
    trim: std({ color: '#efe8da', roughness: 0.6 }),
    oak: phys({ color: '#b98a5a', roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
    walnut: phys({ color: '#6b4a32', roughness: 0.45, clearcoat: 0.3 }),
    metalBlack: std({ color: '#1b1c1e', roughness: 0.35, metalness: 0.8 }),
    metal: std({ color: '#a9acb0', roughness: 0.3, metalness: 1 }),
    plasticBlack: phys({ color: '#141516', roughness: 0.32, clearcoat: 0.5 }),
    plasticWhite: phys({ color: '#efefea', roughness: 0.35, clearcoat: 0.4 }),
    fabricGreen: phys({ color: '#3f6b56', roughness: 0.95, sheen: 1, sheenColor: new THREE.Color('#8fcfae'), sheenRoughness: 0.6 }),
    fabricRust: phys({ color: '#b5532f', roughness: 0.95, sheen: 1, sheenColor: new THREE.Color('#ffb38a'), sheenRoughness: 0.6 }),
    fabricGrey: phys({ color: '#5a5c60', roughness: 0.95, sheen: 0.8, sheenColor: new THREE.Color('#b8bcc4') }),
    cardboard: std({ color: '#b48a5c', roughness: 0.9 }),
    pot: phys({ color: '#d9cdb8', roughness: 0.6, clearcoat: 0.2 }),
    potDark: phys({ color: '#2d2d2d', roughness: 0.5 }),
    leaf: phys({ color: '#2f6b3a', roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color('#7fd18f'), side: THREE.DoubleSide }),
    soil: std({ color: '#3a2a1e', roughness: 1 }),
    glass: phys({ color: '#ffffff', roughness: 0.05, transmission: 0.0, transparent: true, opacity: 0.12, envMapIntensity: 2 }),
  };

  // ---------------- shell ----------------
  const { minX, maxX, minZ, maxZ, h } = ROOM;
  const RW = maxX - minX, RD = maxZ - minZ;
  const floor = mesh(new THREE.PlaneGeometry(RW, RD), M.floor, 0, 0, 0, W, false); floor.rotation.x = -Math.PI / 2;
  const ceil = mesh(new THREE.PlaneGeometry(RW, RD), M.ceil, 0, h, 0, W, false); ceil.rotation.x = Math.PI / 2;
  const back = mesh(new THREE.PlaneGeometry(RW, h), M.accent, 0, h / 2, minZ, W, false);
  const front = mesh(new THREE.PlaneGeometry(RW, h), M.wall, 0, h / 2, maxZ, W, false); front.rotation.y = Math.PI;
  const left = mesh(new THREE.PlaneGeometry(RD, h), M.wall, minX, h / 2, 0, W, false); left.rotation.y = Math.PI / 2;
  const right = mesh(new THREE.PlaneGeometry(RD, h), M.wall, maxX, h / 2, 0, W, false); right.rotation.y = -Math.PI / 2;
  // baseboards + crown
  for (const [x, z, w, d] of [[0, minZ + 0.02, RW, 0.04], [0, maxZ - 0.02, RW, 0.04], [minX + 0.02, 0, 0.04, RD], [maxX - 0.02, 0, 0.04, RD]]) {
    mesh(rbox(w, 0.12, d, 0.01), M.trim, x, 0.06, z, W, false);
    mesh(rbox(w, 0.06, d, 0.01), M.trim, x, h - 0.03, z, W, false);
  }
  col(0, minZ - 0.5, RW + 2, 1); col(0, maxZ + 0.5, RW + 2, 1); col(minX - 0.5, 0, 1, RD + 2); col(maxX + 0.5, 0, 1, RD + 2);

  // exposed ceiling ducts + beams
  for (let i = -2; i <= 2; i++) mesh(rbox(RW, 0.16, 0.18, 0.02), M.metalBlack, 0, h - 0.08, i * 2.5, W, false);
  const duct = mesh(new THREE.CylinderGeometry(0.22, 0.22, RD, 32), std({ color: '#8d9196', roughness: 0.35, metalness: 0.9 }), 5.6, h - 0.38, 0, W, false);
  duct.rotation.x = Math.PI / 2;
  for (let z = -5; z <= 5; z += 1.25) { const ring = mesh(new THREE.TorusGeometry(0.225, 0.012, 8, 32), M.metal, 5.6, h - 0.38, z, W, false); }

  // ---------------- windows (left wall, night city) ----------------
  for (let i = 0; i < 3; i++) {
    const z = -3.6 + i * 3.4;
    const city = T.cityTex(i * 0.3);
    const pane = mesh(new THREE.PlaneGeometry(2.4, 1.9), new THREE.MeshBasicMaterial({ map: city, toneMapped: true, color: '#c9d2ff' }), minX + 0.03, 1.75, z, W, false);
    pane.rotation.y = Math.PI / 2;
    // frame
    const fm = M.metalBlack;
    for (const dy of [-0.97, 0.97]) mesh(rbox(0.12, 0.07, 2.5, 0.02), fm, minX + 0.06, 1.75 + dy, z, W, false);
    for (const dz of [-1.22, 0, 1.22]) mesh(rbox(0.12, 2.0, 0.06, 0.02), fm, minX + 0.06, 1.75, z + dz, W, false);
    mesh(rbox(0.1, 0.04, 2.4, 0.01), fm, minX + 0.06, 2.1, z, W, false);
    mesh(rbox(0.28, 0.05, 2.6, 0.02), M.trim, minX + 0.14, 0.78, z); // sill
    const gl = mesh(new THREE.PlaneGeometry(2.4, 1.9), M.glass, minX + 0.08, 1.75, z, W, false); gl.rotation.y = Math.PI / 2;
  }

  // ---------------- pill logo (procedural two-tone capsule) ----------------
  {
    const g = new THREE.Group(); g.position.set(0, 2.25, minZ + 0.18); W.add(g);
    const R = 0.3, L = 0.85;
    const green = phys({ color: '#4fe08b', emissive: '#2fdc78', emissiveIntensity: 0.7, roughness: 0.25, clearcoat: 1 });
    const white = phys({ color: '#f4f4ee', emissive: '#ffffff', emissiveIntensity: 0.04, roughness: 0.2, clearcoat: 1 });
    const outline = phys({ color: '#0f1a14', roughness: 0.4 });
    const half = (mat, sgn) => {
      const hg = new THREE.Group();
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L / 2, 48), mat); cyl.position.y = sgn * L / 4; hg.add(cyl);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 24, 0, Math.PI * 2, sgn > 0 ? 0 : Math.PI / 2, Math.PI / 2), mat); cap.position.y = sgn * L / 2; hg.add(cap);
      return hg;
    };
    const pill = new THREE.Group(); pill.add(half(green, 1), half(white, -1));
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.01, R * 1.01, 0.03, 48), outline); pill.add(ring);
    const back = new THREE.Mesh(new THREE.CapsuleGeometry(R * 1.12, L, 16, 48), outline); back.position.z = -0.06; back.scale.set(1, 1.03, 0.75); pill.add(back);
    pill.rotation.z = -Math.PI / 4; g.add(pill);
    pill.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
    const glow = new THREE.PointLight('#43ff95', 2.2, 5, 2); glow.position.set(0.25, 0.25, 1.1); g.add(glow);
    animated.push((t) => { green.emissiveIntensity = 0.7 + Math.sin(t * 2) * 0.06 + (Math.random() < 0.003 ? -0.4 : 0); });
    // neon "the HQ" sign
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: T.hqSignTex(), transparent: true, color: '#ffffff' }));
    sign.position.set(0, -0.95, 0.0); g.add(sign);
  }

  // ---------------- posters ----------------
  const posterMesh = (map, gw, gh, x, y, z, ry, tilt) => {
    const p = mesh(new THREE.PlaneGeometry(gw, gh), std({ map, roughness: 0.55 }), x, y, z, W, false);
    p.rotation.y = ry; p.rotation.z = tilt; return p;
  };
  const poster = (map, x, y, z, ry, s = 1, tilt = 0) => posterMesh(map, 0.9 * s, 1.26 * s, x, y, z, ry, tilt);
  // hero slot: movie-parody image poster, true 3:4 so it isn't stretched
  posterMesh(T.imagePoster(new URL('../assets/posters/wolf-of-pump-street.webp', import.meta.url).href), 0.96 * 1.3, 1.28 * 1.3, maxX - 0.015, 1.82, -3.4, -Math.PI / 2, 0.012);
  poster(T.funPoster('missing'), maxX - 0.015, 1.7, -1.55, -Math.PI / 2, 0.92, -0.035);
  poster(T.funPoster('poor'), maxX - 0.015, 1.82, 0.4, -Math.PI / 2, 1.12, 0.015);
  poster(T.funPoster('hang'), -3.9, 1.8, minZ + 0.015, 0, 1.08, -0.02);
  poster(T.funPoster('rug'), -2.6, 1.55, minZ + 0.015, 0, 0.72, 0.05);
  poster(T.batonPoster(0), 1.55, 1.75, maxZ - 0.015, Math.PI, 1.2, 0.02); // the one BATON poster left
  { const lp = poster(T.funPoster('trust'), 7.55, 0.62, 4.0, -Math.PI / 2 + 0.05, 0.9); lp.rotation.x = 0; lp.position.x = maxX - 0.2; lp.rotation.order = 'YXZ'; lp.rotation.x = -0.18; }

  // whiteboard
  {
    const g = new THREE.Group(); g.position.set(4.3, 1.65, minZ + 0.04); W.add(g);
    mesh(rbox(2.5, 1.5, 0.05, 0.02), M.metal, 0, 0, 0, g);
    const b = mesh(new THREE.PlaneGeometry(2.4, 1.4), phys({ map: T.whiteboardTex(), roughness: 0.15, clearcoat: 1 }), 0, 0, 0.03, g, false);
    whiteboard.set = (done) => { if (whiteboard.done === done) return; whiteboard.done = done; const old = b.material.map; b.material.map = T.whiteboardTex(done); b.material.needsUpdate = true; old?.dispose(); };
    mesh(rbox(1.2, 0.04, 0.08, 0.01), M.metal, 0, -0.78, 0.06, g);
    const mk = ['#1b3fae', '#d33', '#1f9d55'];
    mk.forEach((c, i) => { const m = mesh(new THREE.CapsuleGeometry(0.012, 0.1, 4, 8), phys({ color: c, roughness: 0.4 }), -0.3 + i * 0.12, -0.75, 0.07, g); m.rotation.z = Math.PI / 2; });
    // sticky notes around
    ['ship\nfriday', 'call\nBATON', 'fix\nwifi', 'gm'].forEach((t, i) => {
      const s = mesh(new THREE.PlaneGeometry(0.16, 0.16), std({ map: T.stickyTex(t, ['#ffe66d', '#ff9fb2', '#9fe7ff', '#b9f59f'][i]), roughness: 0.8 }), 1.4 + (i % 2) * 0.2, 0.5 - i * 0.28, 0.01, g, false);
      s.rotation.z = rr(-0.15, 0.15);
    });
  }

  // string lights along back wall
  {
    const n = 46; const geo = new THREE.SphereGeometry(0.025, 10, 8);
    const mat = new THREE.MeshBasicMaterial({ color: '#ffd59a' });
    const inst = new THREE.InstancedMesh(geo, mat, n * 2);
    const pts = [];
    let k = 0;
    for (const [x0, x1] of [[-7.8, -0.6], [0.6, 7.8]]) {
      const curvePts = [];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1); const x = x0 + (x1 - x0) * t;
        const y = h - 0.25 - Math.sin(t * Math.PI * 3) ** 2 * 0.25;
        const m = new THREE.Matrix4().makeTranslation(x, y - 0.03, minZ + 0.08); inst.setMatrixAt(k++, m);
        curvePts.push(new THREE.Vector3(x, y, minZ + 0.07));
      }
      const wire = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePts), 200, 0.004, 4), M.plasticBlack, 0, 0, 0, W, false);
    }
    W.add(inst);
    animated.push((t) => { mat.color.setHSL(0.09, 1, 0.72 + Math.sin(t * 1.3) * 0.04); });
  }

  // ---------------- furniture builders ----------------
  const chair = (x, z, ry, opts = {}) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; W.add(g);
    if (opts.sy) g.scale.y = opts.sy;
    mesh(rbox(0.52, 0.09, 0.5, 0.04), M.fabricGrey, 0, 0.5, 0, g);
    const bk = mesh(rbox(0.5, 0.62, 0.08, 0.04), M.fabricGrey, 0, 0.88, -0.24, g); bk.rotation.x = -0.12;
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 12), M.metal, 0, 0.28, 0, g);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      const leg = mesh(rbox(0.3, 0.035, 0.05, 0.015), M.plasticBlack, Math.cos(a) * 0.14, 0.07, Math.sin(a) * 0.14, g); leg.rotation.y = -a;
      mesh(new THREE.SphereGeometry(0.03, 10, 8), M.plasticBlack, Math.cos(a) * 0.28, 0.03, Math.sin(a) * 0.28, g);
    }
    if (opts.arms !== false) for (const s of [-1, 1]) { mesh(rbox(0.05, 0.04, 0.3, 0.015), M.plasticBlack, s * 0.27, 0.72, -0.02, g); mesh(rbox(0.03, 0.2, 0.03, 0.01), M.plasticBlack, s * 0.27, 0.6, -0.02, g); }
    col(x, z, 0.5, 0.5);
    return g;
  };
  const can = (x, y, z, parent = W, tip = false) => {
    const cols = [['#1e2b8a', '#7cf0ad'], ['#111', '#f2cd2a'], ['#c8102e', '#fff'], ['#e8e8e8', '#3ddc84']];
    const [c, a] = cols[rand() * cols.length | 0];
    const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
    mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.122, 24), phys({ map: T.canTex(c, a), roughness: 0.25, metalness: 0.6, clearcoat: 1 }), 0, 0.061, 0, g);
    mesh(new THREE.CylinderGeometry(0.03, 0.033, 0.008, 24), M.metal, 0, 0.126, 0, g);
    g.rotation.y = rand() * 6;
    if (tip) { g.rotation.z = Math.PI / 2; g.position.y = y + 0.033; }
    return g;
  };
  const monitor = (parent, x, y, z, w, hh, tex, emissive = 1.0, ry = 0) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
    mesh(rbox(w + 0.04, hh + 0.04, 0.035, 0.012), M.plasticBlack, 0, hh / 2 + 0.12, 0, g);
    const scrMat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(emissive, emissive, emissive) });
    const s = mesh(new THREE.PlaneGeometry(w, hh), scrMat, 0, hh / 2 + 0.12, 0.0185, g, false);
    mesh(rbox(0.05, 0.16, 0.04, 0.01), M.metal, 0, 0.08, -0.04, g);
    mesh(rbox(0.22, 0.015, 0.16, 0.007), M.metal, 0, 0.007, -0.02, g);
    screens.push(scrMat);
    return { g, screen: s, mat: scrMat };
  };
  const lampDesk = (parent, x, y, z, ry = 0) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
    mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.02, 24), M.metalBlack, 0, 0.01, 0, g);
    const a1 = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.38, 8), M.metalBlack, 0, 0.19, 0, g); a1.rotation.z = 0.25; a1.position.x = -0.045;
    const a2 = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8), M.metalBlack, 0.03, 0.42, 0, g); a2.rotation.z = -1.0; a2.position.set(0.03, 0.43, 0);
    const shade = mesh(new THREE.ConeGeometry(0.08, 0.12, 24, 1, true), phys({ color: '#e0b43a', roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide }), 0.16, 0.48, 0, g); shade.rotation.z = 0.5;
    mesh(new THREE.SphereGeometry(0.025, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff1c8' }), 0.18, 0.44, 0, g, false);
    const L = new THREE.PointLight('#ffc98a', 1.6, 2.6, 2); L.position.set(0.2, 0.38, 0); g.add(L);
    return g;
  };
  const plant = (x, z, s = 1, kind = 0) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); W.add(g);
    const pm = kind ? M.potDark : M.pot;
    mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.42, 32), pm, 0, 0.21, 0, g);
    mesh(new THREE.TorusGeometry(0.215, 0.018, 8, 32), pm, 0, 0.42, 0, g).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 24), M.soil, 0, 0.4, 0, g);
    const leafGeo = new THREE.SphereGeometry(0.16, 16, 10); leafGeo.scale(0.55, 0.06, 1);
    leafGeo.translate(0, 0, 0.16);
    const n = 14 + (kind * 4);
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + rand();
      const hgt = 0.55 + rand() * 0.75;
      const stem = mesh(new THREE.CylinderGeometry(0.007, 0.01, hgt, 5), M.leaf, Math.cos(a) * 0.05, 0.4 + hgt / 2, Math.sin(a) * 0.05, g);
      stem.rotation.z = Math.cos(a) * -0.25; stem.rotation.x = Math.sin(a) * 0.25;
      const lf = mesh(leafGeo, M.leaf, Math.cos(a) * (0.05 + hgt * 0.25), 0.4 + hgt, Math.sin(a) * (0.05 + hgt * 0.25), g);
      lf.rotation.y = -a + Math.PI / 2; lf.rotation.x = 0.35 + rand() * 0.4; lf.scale.setScalar(0.9 + rand() * 0.7);
    }
    col(x, z, 0.4 * s, 0.4 * s);
    animated.push((t) => { g.rotation.z = Math.sin(t * 0.7 + x) * 0.006; });
  };
  const box = (x, y, z, w, hh, d, ry = 0, open = false) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; W.add(g);
    mesh(rbox(w, hh, d, 0.012), M.cardboard, 0, hh / 2, 0, g);
    mesh(new THREE.PlaneGeometry(w * 0.98, 0.05), std({ color: '#c9b48a', roughness: 0.6 }), 0, hh + 0.001, 0, g, false).rotation.x = -Math.PI / 2;
    if (open) for (const s of [-1, 1]) { const f = mesh(rbox(w, 0.006, d / 2, 0.002), M.cardboard, 0, hh, s * d / 2, g); f.rotation.x = s * 0.9; f.position.z = s * (d / 2 + 0.05); f.position.y = hh + 0.08; }
    return g;
  };
  const pizza = (x, y, z, ry = 0, open = false, parent = W) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
    const pm = std({ color: '#cfae80', roughness: 0.85 });
    mesh(rbox(0.42, 0.045, 0.42, 0.006), pm, 0, 0.0225, 0, g);
    if (open) {
      const lid = new THREE.Group(); lid.position.set(0, 0.045, -0.21); g.add(lid); lid.rotation.x = -1.9;
      mesh(rbox(0.42, 0.006, 0.42, 0.002), pm, 0, 0, 0.21, lid);
      mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.012, 32, 1, false, 0, Math.PI * 1.25), std({ color: '#d89b4a', roughness: 0.7 }), 0, 0.052, 0, g);
      mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.014, 32, 1, false, 0, Math.PI * 1.25), std({ color: '#e7b74a', roughness: 0.5 }), 0, 0.055, 0, g);
      for (let i = 0; i < 7; i++) { const a = rand() * Math.PI * 1.2, r = rand() * 0.13; mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 12), std({ color: '#a8332a', roughness: 0.5 }), Math.sin(a) * r, 0.064, Math.cos(a) * r, g); }
    } else {
      mesh(new THREE.PlaneGeometry(0.4, 0.4), std({ map: T.pizzaTex(), roughness: 0.85 }), 0, 0.0455, 0, g, false).rotation.x = -Math.PI / 2;
    }
    return g;
  };
  const papers = [];
  const paper = (x, y, z, ry, kind = 0, parent = null) => {
    if (parent) { parent.updateMatrixWorld(true); const v = parent.localToWorld(new THREE.Vector3(x, y, z)); x = v.x; y = v.y; z = v.z; ry += parent.rotation.y; }
    papers.push([x, y, z, ry, kind]);
  };
  const cable = (pts, color = '#141414') => {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    mesh(new THREE.TubeGeometry(curve, 80, 0.008, 6), std({ color, roughness: 0.6 }), 0, 0, 0, W, false);
  };

  const desk = (x, z, ry, w = 1.7, d = 0.8) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; W.add(g);
    mesh(rbox(w, 0.05, d, 0.02, 4), M.oak, 0, 0.75, 0, g);
    for (const sx of [-1, 1]) {
      mesh(rbox(0.06, 0.72, d - 0.1, 0.02), M.metalBlack, sx * (w / 2 - 0.08), 0.37, 0, g);
    }
    mesh(rbox(w - 0.2, 0.25, 0.02, 0.01), M.metalBlack, 0, 0.55, -d / 2 + 0.06, g);
    const swap = Math.abs(Math.sin(ry)) > 0.5;
    col(x, z, swap ? d : w, swap ? w : d);
    return g;
  };

  // ---------------- MAIN DESK (interactive computer) ----------------
  const mainDesk = desk(0, -4.95, 0, 2.0, 0.85);
  const mainMon = monitor(mainDesk, 0, 0.775, -0.2, 0.92, 0.52, T.mainScreenTex(), 0.8);
  monitor(mainDesk, -0.72, 0.775, -0.12, 0.42, 0.28, T.chartTex(1), 0.75, 0.45);
  mesh(rbox(0.46, 0.022, 0.15, 0.008), M.plasticBlack, 0, 0.787, 0.14, mainDesk);
  // keycaps sheen
  mesh(new THREE.PlaneGeometry(0.43, 0.12), std({ color: '#2a2c2f', roughness: 0.5 }), 0, 0.7985, 0.14, mainDesk, false).rotation.x = -Math.PI / 2;
  mesh(rbox(0.065, 0.025, 0.105, 0.012), M.plasticBlack, 0.34, 0.788, 0.15, mainDesk);
  mesh(rbox(0.3, 0.004, 0.25, 0.002), std({ color: '#1d4b33', roughness: 0.9 }), 0.36, 0.777, 0.15, mainDesk, false);
  lampDesk(mainDesk, 0.78, 0.775, -0.22, -0.3);
  can(0.55, 0.775, 0.05, mainDesk); can(0.62, 0.775, -0.05, mainDesk); can(-0.42, 0.775, 0.22, mainDesk, true);
  // mug
  { const m = mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 24), phys({ color: '#4fe08b', roughness: 0.3, clearcoat: 1 }), -0.35, 0.825, 0.05, mainDesk);
    mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 16), m.material, -0.3, 0.83, 0.05, mainDesk); }
  // stickies on monitor bezel
  ['gm', 'stop\nbeing\npoor'].forEach((t, i) => { const s = mesh(new THREE.PlaneGeometry(0.09, 0.09), std({ map: T.stickyTex(t, i ? '#ff9fb2' : '#ffe66d'), roughness: 0.8 }), 0.42 + i * 0.07, 0.775 + 0.6 - i * 0.12, -0.18, mainDesk, false); s.rotation.z = rr(-0.2, 0.2); });
  paper(-0.6, 0.776, 0.25, 0.4, 0, mainDesk); paper(-0.55, 0.777, 0.2, 0.9, 1, mainDesk); paper(0.72, 0.776, 0.3, -0.3, 0, mainDesk);
  const mainChair = chair(0.95, -4.15, Math.PI + 0.9);
  colliders.pop(); // chair is pushable-ish: let the player get close
  pizza(-0.95, 0, -4.4, 0.3);
  cable([[0, 0.75, -5.3], [0.1, 0.3, -5.5], [0.4, 0.01, -5.6], [1.6, 0.01, -5.4], [2.4, 0.01, -5.85]]);
  cable([[-0.6, 0.75, -5.3], [-0.5, 0.2, -5.5], [-1.2, 0.01, -5.7], [-2.5, 0.01, -5.8]], '#333');

  const mainScreenWorld = new THREE.Vector3(); mainMon.screen.getWorldPosition(mainScreenWorld);
  interactables.push({
    id: 'computer', prompt: 'Press E to use computer',
    pos: new THREE.Vector3(0, 0, -4.35), radius: 1.15,
    screenPos: mainScreenWorld, screenMat: mainMon.mat, screenMesh: mainMon.screen, screenSize: [0.92, 0.52],
  });

  // ---------------- workstation row (right side) ----------------
  let traderDesk = null, ansemDesk = null;
  const ws = [[5.6, -3.6, -Math.PI / 2], [5.6, -1.1, -Math.PI / 2], [2.6, -1.2, Math.PI / 2]];
  ws.forEach(([x, z, ry], i) => {
    const d = desk(x, z, ry, 1.7, 0.8);
    // desk 1 (next to DUVE) is ANSEM's: three monitors, slightly wider spread
    const A = i === 1;
    const mA = monitor(d, A ? -0.52 : -0.33, 0.775, A ? -0.12 : -0.18, A ? 0.46 : 0.56, A ? 0.28 : 0.32, T.chartTex(10 + i), 0.8, A ? 0.32 : 0.12);
    const mB = monitor(d, A ? 0.52 : 0.33, 0.775, A ? -0.12 : -0.18, A ? 0.46 : 0.56, A ? 0.28 : 0.32, T.chartTex(20 + i, '#7cf0ad'), 0.8, A ? -0.32 : -0.12);
    const mC = A ? monitor(d, 0, 0.775, -0.22, 0.52, 0.3, T.chartTex(31, '#4be08a'), 0.8, 0) : null;
    const kbZ = i <= 1 ? 0.27 : 0.14;
    mesh(rbox(0.42, 0.02, 0.14, 0.007), M.plasticBlack, 0, 0.785, kbZ, d);
    if (A) { mesh(rbox(0.065, 0.025, 0.105, 0.012), M.plasticBlack, 0.3, 0.788, 0.27, d); mesh(rbox(0.26, 0.004, 0.22, 0.002), std({ color: '#15181c', roughness: 0.9 }), 0.3, 0.777, 0.27, d, false); }
    if (i === 0) { mesh(rbox(0.065, 0.025, 0.105, 0.012), M.plasticBlack, 0.3, 0.788, 0.27, d); mesh(rbox(0.26, 0.004, 0.22, 0.002), std({ color: '#3a1d1d', roughness: 0.9 }), 0.3, 0.777, 0.27, d, false); }
    can(0.6, 0.775, 0.1, d); if (i !== 1) can(0.68, 0.775, 0.22, d);
    paper(-0.62, 0.776, 0.2, rr(-1, 1), i % 2, d); paper(-0.5, 0.777, 0.1, rr(-1, 1), 0, d);
    if (i === 0) pizza(-0.62, 0.775, -0.2, 0.3, false, d);
    if (i === 2) lampDesk(d, -0.75, 0.775, -0.15, 0.6);
    const off = i <= 1 ? 0.75 : 0.65;
    const cx = x + Math.sin(ry) * off, cz = z + Math.cos(ry) * off;
    const jitter = rr(-0.4, 0.4);
    if (i === 0) {
      const ch = chair(cx, cz, ry + Math.PI, { sy: 0.88, arms: false });
      traderDesk = { desk: d, chair: ch, monitors: [mA, mB], seat: new THREE.Vector3(cx, 0.48, cz), facing: ry + Math.PI };
    } else if (A) {
      const ch = chair(cx, cz, ry + Math.PI, { sy: 0.88, arms: false });
      ansemDesk = { desk: d, chair: ch, monitors: [mA, mC, mB], seat: new THREE.Vector3(cx, 0.48, cz), facing: ry + Math.PI };
    } else chair(cx, cz, ry + Math.PI + jitter);
  });
  // laptop open on desk 3
  {
    const g = new THREE.Group(); g.position.set(2.6, 0.775, -0.75); g.rotation.y = Math.PI / 2 + 0.3; W.add(g);
  }

  // ---------------- lounge (front-left) ----------------
  const rug = mesh(new THREE.PlaneGeometry(3.6, 2.4), std({ map: T.rugTex(), roughness: 1 }), -4.3, 0.003, 2.6, W, false); rug.rotation.x = -Math.PI / 2; rug.rotation.z = 0.04;
  // couch facing -z (toward the room), back to the front wall
  {
    const g = new THREE.Group(); g.position.set(-4.3, 0, 4.85); W.add(g);
    mesh(rbox(2.5, 0.38, 0.95, 0.08, 4), M.fabricGreen, 0, 0.26, 0, g);
    mesh(rbox(2.5, 0.62, 0.26, 0.1, 4), M.fabricGreen, 0, 0.6, 0.36, g);
    for (const s of [-1, 1]) mesh(rbox(0.26, 0.6, 0.95, 0.1, 4), M.fabricGreen, s * 1.25, 0.38, 0, g);
    for (const s of [-1, 1]) { const c = mesh(rbox(1.08, 0.16, 0.7, 0.07, 4), M.fabricGreen, s * 0.56, 0.52, -0.08, g); c.rotation.z = s * 0.01; }
    const p1 = mesh(rbox(0.42, 0.42, 0.14, 0.07, 4), M.fabricRust, -0.8, 0.76, 0.12, g); p1.rotation.set(-0.3, 0.3, 0.2);
    const p2 = mesh(rbox(0.38, 0.38, 0.12, 0.06, 4), phys({ color: '#f2cd2a', roughness: 0.95, sheen: 1, sheenColor: new THREE.Color('#fff2a0') }), 0.85, 0.74, 0.14, g); p2.rotation.set(-0.3, -0.2, -0.15);
    // throw blanket
    const bl = mesh(rbox(0.7, 0.04, 0.9, 0.02), phys({ color: '#d9cfc0', roughness: 1, sheen: 1, sheenColor: new THREE.Color('#fff') }), 0.3, 0.62, -0.05, g); bl.rotation.set(0.05, 0.2, 0.06);
    for (const sx of [-1.15, 1.15]) for (const sz of [-0.38, 0.38]) mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.07, 10), M.walnut, sx, 0.035, sz, g);
    col(-4.3, 4.85, 2.6, 1.0);
  }
  // coffee table + mess
  {
    const g = new THREE.Group(); g.position.set(-4.3, 0, 3.0); W.add(g);
    mesh(rbox(1.4, 0.06, 0.7, 0.025, 4), M.walnut, 0, 0.42, 0, g);
    mesh(rbox(1.3, 0.03, 0.6, 0.01), M.walnut, 0, 0.12, 0, g);
    for (const sx of [-0.62, 0.62]) for (const sz of [-0.28, 0.28]) mesh(rbox(0.05, 0.4, 0.05, 0.015), M.metalBlack, sx, 0.2, sz, g);
    pizza(-0.3, 0.45, 0.0, 0.2, true, g);
    pizza(0.3, 0.45, 0.05, -0.15, false, g); pizza(0.32, 0.495, 0.03, 0.3, false, g);
    can(0.0, 0.45, 0.22, g); can(0.55, 0.45, -0.2, g); can(-0.6, 0.45, 0.25, g, true);
    // game controller
    mesh(rbox(0.16, 0.03, 0.09, 0.03), M.plasticBlack, 0.1, 0.465, -0.2, g).rotation.y = 0.4;
    can(0.3, 0.15, 0, g, true);
    col(-4.3, 3.0, 1.4, 0.7);
    interactables.push({ id: 'pizza', prompt: 'Press E to grab a slice', pos: new THREE.Vector3(-4.3, 0, 2.35), radius: 1.0 });
  }
  // beanbag
  {
    const g = new THREE.Group(); g.position.set(-2.3, 0, 2.2); W.add(g);
    const bb = mesh(new THREE.SphereGeometry(0.5, 40, 28), phys({ color: '#3a3a3e', roughness: 0.6, clearcoat: 0.6, clearcoatRoughness: 0.4 }), 0, 0.32, 0, g);
    const p = bb.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -0.2) p.setY(i, -0.2 - (y + 0.2) * 0.15); if (y > 0.15) p.setY(i, 0.15 + (y - 0.15) * 0.55); const a = Math.atan2(p.getZ(i), p.getX(i)); p.setX(i, p.getX(i) * (1 + 0.05 * Math.sin(a * 3))); }
    bb.geometry.computeVertexNormals(); bb.scale.set(1.1, 1, 1);
    // dent
    const dent = mesh(new THREE.SphereGeometry(0.28, 24, 16), bb.material, 0.05, 0.5, 0.1, g); dent.scale.set(1, 0.35, 1);
    col(-2.3, 2.2, 0.9, 0.9);
  }
  // floor lamp (arc) for lounge
  {
    const g = new THREE.Group(); g.position.set(-7.2, 0, 5.2); W.add(g);
    mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.04, 32), M.metalBlack, 0, 0.02, 0, g);
    const pole = mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.7, 12), M.metal, 0, 0.85, 0, g);
    const shade = mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.32, 32, 1, true), phys({ color: '#f2e6cc', roughness: 0.9, transmission: 0, side: THREE.DoubleSide, emissive: '#ffcf8a', emissiveIntensity: 0.6 }), 0, 1.75, 0, g, false);
    const L = new THREE.PointLight('#ffbf78', 5, 6, 2); L.position.set(0, 1.62, 0); g.add(L);
    col(-7.2, 5.2, 0.4, 0.4);
  }
  // TV on low console against left-front? -> media console under first window? keep: bookshelf on front wall
  {
    const g = new THREE.Group(); g.position.set(-0.6, 0, maxZ - 0.22); g.rotation.y = Math.PI; W.add(g);
    mesh(rbox(1.8, 1.8, 0.03, 0.01), M.walnut, 0, 0.9, -0.185, g);
    for (const s of [-1, 1]) mesh(rbox(0.04, 1.8, 0.4, 0.012), M.walnut, s * 0.88, 0.9, 0, g);
    mesh(rbox(1.8, 0.04, 0.4, 0.012), M.walnut, 0, 1.8, 0, g);
    for (let i = 0; i < 4; i++) {
      mesh(rbox(1.72, 0.03, 0.36, 0.008), M.oak, 0, 0.04 + i * 0.44, 0.0, g);
      const bw = 1.2 - (i % 2) * 0.45;
      const bk = mesh(rbox(bw, 0.3, 0.22, 0.01), std({ map: T.bookTex(), roughness: 0.8 }), -0.25 + (i % 2) * 0.4, 0.21 + i * 0.44, -0.02, g);
    }
        // trophy pill on shelf
    const tp = mesh(new THREE.CapsuleGeometry(0.05, 0.12, 8, 16), phys({ color: '#d4af37', metalness: 1, roughness: 0.2 }), 0.55, 1.5, 0.05, g); tp.rotation.z = 0.8;
    col(-0.6, maxZ - 0.22, 1.8, 0.4);
  }
  // mini fridge with cans on top
  {
    const g = new THREE.Group(); g.position.set(7.35, 0, 5.3); W.add(g);
    mesh(rbox(0.6, 0.86, 0.6, 0.04, 4), phys({ color: '#e9e5dc', roughness: 0.35, clearcoat: 0.6 }), 0, 0.43, 0, g);
    mesh(rbox(0.04, 0.3, 0.03, 0.01), M.metal, -0.24, 0.55, -0.31, g);
    const st = mesh(new THREE.PlaneGeometry(0.2, 0.2), std({ map: T.stickyTex('NOT\nYOURS', '#ff9fb2'), roughness: 0.8 }), 0.05, 0.55, -0.302, g, false); st.rotation.y = Math.PI;
    for (let i = 0; i < 6; i++) can(-0.2 + (i % 3) * 0.08, 0.86, -0.1 + Math.floor(i / 3) * 0.09, g);
    col(7.35, 5.3, 0.6, 0.6);
    interactables.push({ id: 'fridge', prompt: 'Press E to grab an energy drink', pos: new THREE.Vector3(7.0, 0, 4.55), radius: 0.9 });
  }
  // cardboard boxes stack
  box(7.1, 0, -5.2, 0.7, 0.5, 0.55, 0.1); box(7.15, 0.5, -5.2, 0.55, 0.4, 0.45, -0.2); box(6.3, 0, -5.4, 0.5, 0.35, 0.5, 0.5, true);
  col(6.9, -5.25, 1.6, 0.8);
  // trash bin overflowing
  {
    const g = new THREE.Group(); g.position.set(1.4, 0, -5.5); W.add(g);
    mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.42, 28, 1, true), phys({ color: '#2c2f33', roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide }), 0, 0.21, 0, g);
    for (let i = 0; i < 9; i++) { const b = mesh(new THREE.IcosahedronGeometry(0.06 + rand() * 0.03, 1), std({ color: '#f1efe8', roughness: 0.9 }), rr(-0.1, 0.1), 0.4 + rand() * 0.1, rr(-0.1, 0.1), g); b.rotation.set(rand(), rand(), rand()); }
    for (let i = 0; i < 3; i++) { const b = mesh(new THREE.IcosahedronGeometry(0.05, 1), std({ color: '#f1efe8', roughness: 0.9 }), rr(-0.5, 0.5), 0.05, rr(-0.1, 0.4), g); }
    col(1.4, -5.5, 0.35, 0.35);
  }
  // plants
  plant(-7.4, -5.4, 1.25, 0); plant(-7.5, 1.7, 0.9, 1); plant(7.4, 2.6, 1.1, 1); plant(-2.2, -5.5, 0.85, 0); plant(-2.0, 5.5, 1.0, 1);

  // pendant lamps
  const pendant = (x, z, drop = 1.15, intensity = 6) => {
    const g = new THREE.Group(); g.position.set(x, h, z); W.add(g);
    mesh(new THREE.CylinderGeometry(0.004, 0.004, drop, 6), M.plasticBlack, 0, -drop / 2, 0, g, false);
    const shade = mesh(new THREE.SphereGeometry(0.22, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), phys({ color: '#1b1c1e', roughness: 0.3, metalness: 0.7, side: THREE.DoubleSide }), 0, -drop - 0.12, 0, g, false);
    const inner = mesh(new THREE.SphereGeometry(0.215, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd9a0', side: THREE.BackSide }), 0, -drop - 0.12, 0, g, false);
    mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff4dc' }), 0, -drop - 0.06, 0, g, false);
    const L = new THREE.PointLight('#ffc485', intensity, 7, 2); L.position.set(0, -drop - 0.15, 0); g.add(L);
    return { g, y: h - drop - 0.12 };
  };
  const pendants = [pendant(-4.3, 3.0, 1.2, 5), pendant(5.6, -2.35, 1.0, 5), pendant(2.6, -1.2, 1.05, 3.5)];

  // papers on floor and desks (instanced)
  for (let i = 0; i < 22; i++) paper(rr(-7, 7), 0.006 + i * 0.0002, rr(-5, 5), rand() * 6, rand() < 0.2 ? 1 : 0);
  {
    const pg = new THREE.PlaneGeometry(0.21, 0.29); pg.rotateX(-Math.PI / 2);
    const mats = [std({ map: T.paperTex(0), roughness: 0.9 }), std({ map: T.paperTex(1), roughness: 0.9 })];
    for (const k of [0, 1]) {
      const list = papers.filter(p => p[4] === k);
      const inst = new THREE.InstancedMesh(pg, mats[k], list.length);
      list.forEach(([x, y, z, ry], i) => {
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
        inst.setMatrixAt(i, m);
      });
      inst.receiveShadow = true; W.add(inst);
    }
  }
  // fix desk-local paper placements: those were pushed with desk-local coords -> handled by world coords above for floor only
  // scattered cans on floor
  for (let i = 0; i < 7; i++) can(rr(-6.5, 6.5), 0, rr(-4, 4.5), W, rand() < 0.7);
  // floor cables
  cable([[5.6, 0.01, -2.4], [4.5, 0.01, -2.6], [3.4, 0.01, -1.9], [2.7, 0.01, -1.6]], '#1a1a1a');
  cable([[7.95, 0.25, -2.5], [7.6, 0.01, -2.6], [6.4, 0.01, -2.9], [6.0, 0.01, -3.6]], '#e8e8e0');
  // extension strip
  mesh(rbox(0.32, 0.04, 0.08, 0.015), M.plasticWhite, 4.3, 0.02, -2.55).rotation.y = 0.2;
  // skateboard leaning by the boxes
  {
    const g = new THREE.Group(); g.position.set(5.6, 0.02, -5.75); g.rotation.set(-0.25, 0.15, 0); W.add(g);
    mesh(rbox(0.22, 0.8, 0.02, 0.01), phys({ color: '#f2cd2a', roughness: 0.5 }), 0, 0.4, 0, g);
  }


  // ---------------- more HQ life ----------------
  // ping pong table (centre-right) – the unofficial meeting room
  {
    const g = new THREE.Group(); g.position.set(2.3, 0, 2.6); g.rotation.y = 0.08; W.add(g);
    mesh(rbox(2.74, 0.04, 1.52, 0.012), phys({ color: '#1f5c45', roughness: 0.4, clearcoat: 0.5 }), 0, 0.76, 0, g);
    for (const [x, z, w2, d2] of [[0, 0.755, 2.74, 0.02], [0, -0.755, 2.74, 0.02], [1.36, 0, 0.02, 1.52], [-1.36, 0, 0.02, 1.52]]) mesh(new THREE.BoxGeometry(w2, 0.002, d2), std({ color: '#fff' }), x, 0.781, z, g, false);
    mesh(new THREE.BoxGeometry(2.72, 0.002, 0.01), std({ color: '#fff' }), 0, 0.781, 0, g, false).rotation.y = 0;
    mesh(new THREE.PlaneGeometry(1.7, 0.15), std({ color: '#111', transparent: true, opacity: 0.6, side: THREE.DoubleSide, roughness: 1 }), 0, 0.855, 0, g, false).rotation.y = Math.PI / 2;
    for (const sx of [-1.1, 1.1]) for (const sz of [-0.6, 0.6]) mesh(rbox(0.06, 0.74, 0.06, 0.02), M.metalBlack, sx, 0.37, sz, g);
    for (const s of [-1, 1]) { const pd = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 24), phys({ color: s > 0 ? '#c8202e' : '#111', roughness: 0.6 }), s * 0.7, 0.79, s * 0.3, g); }
    mesh(new THREE.SphereGeometry(0.02, 12, 8), phys({ color: '#ff8a1f', roughness: 0.3 }), 0.25, 0.8, -0.2, g);
    can(-0.9, 0.78, -0.5, g); pizza(0.9, 0.78, -0.35, 0.5, false, g);
    col(2.3, 2.6, 2.8, 1.6);
  }
  // kitchenette along the front wall
  {
    const g = new THREE.Group(); g.position.set(5.0, 0, maxZ - 0.32); g.rotation.y = Math.PI; W.add(g);
    const cab = phys({ color: '#2f4a3f', roughness: 0.55, clearcoat: 0.3 });
    mesh(rbox(3.0, 0.86, 0.6, 0.02), cab, 0, 0.43, 0, g);
    mesh(rbox(3.04, 0.05, 0.64, 0.015, 4), phys({ color: '#e9e4da', roughness: 0.25, clearcoat: 0.8 }), 0, 0.885, 0, g);
    for (let i = 0; i < 5; i++) { mesh(new THREE.BoxGeometry(0.004, 0.78, 0.004), std({ color: '#1a2a24' }), -1.2 + i * 0.6, 0.43, 0.3, g, false); mesh(rbox(0.16, 0.02, 0.02, 0.008), M.metal, -1.45 + i * 0.6, 0.75, 0.31, g); }
    mesh(rbox(3.0, 0.7, 0.35, 0.02), cab, 0, 2.15, -0.12, g);
    // coffee machine
    mesh(rbox(0.26, 0.38, 0.3, 0.03), M.plasticBlack, -1.1, 1.1, -0.05, g);
    mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.08, 16), M.plasticWhite, -1.1, 0.95, 0.06, g);
    mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: '#55e392' }), -1.02, 1.22, 0.1, g, false);
    // microwave
    mesh(rbox(0.5, 0.3, 0.36, 0.02), phys({ color: '#d8d6d0', roughness: 0.3, metalness: 0.4 }), 0.9, 1.06, -0.05, g);
    mesh(new THREE.PlaneGeometry(0.32, 0.2), phys({ color: '#111', roughness: 0.1, clearcoat: 1 }), 0.84, 1.06, 0.131, g, false);
    // takeout + pizza tower + cans
    for (let i = 0; i < 4; i++) pizza(0.15, 0.91 + i * 0.046, 0.0, rr(-0.2, 0.2), false, g);
    for (let i = 0; i < 2; i++) { const tk = mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.1, 4), std({ color: '#f4f1e8', roughness: 0.8 }), -0.45 + i * 0.16, 0.96, 0.05, g); tk.rotation.y = Math.PI / 4; }
    for (let i = 0; i < 5; i++) can(-0.75 + i * 0.07, 0.91, 0.15 + (i % 2) * 0.06, g);
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 20), std({ color: '#fbfbf6', roughness: 0.9 }), 1.35, 1.03, 0, g);
    col(5.0, maxZ - 0.32, 3.0, 0.62);
  }
  // TV console facing the couch
  {
    const g = new THREE.Group(); g.position.set(-4.3, 0, 1.0); W.add(g);
    mesh(rbox(1.9, 0.45, 0.42, 0.03), M.walnut, 0, 0.27, 0, g);
    for (const sx of [-0.8, 0.8]) mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.05, 8), M.metalBlack, sx, 0.025, 0, g);
    mesh(rbox(1.5, 0.86, 0.05, 0.015), M.plasticBlack, 0, 0.95, 0, g);
    const tvm = new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: T.tvTex(), emissiveIntensity: 0.6, roughness: 0.2 });
    mesh(new THREE.PlaneGeometry(1.44, 0.8), tvm, 0, 0.95, 0.026, g, false);
    mesh(rbox(0.3, 0.06, 0.22, 0.02), phys({ color: '#f2f2ee', roughness: 0.3, clearcoat: 1 }), 0.5, 0.52, 0.02, g);
    const tl = new THREE.PointLight('#8fb8ff', 1.5, 3.5, 2); tl.position.set(0, 0.95, 0.5); g.add(tl);
    col(-4.3, 1.0, 1.9, 0.45);
    // pair of sneakers kicked off
    for (const [sx, sz, r] of [[0.2, 1.4, 0.4], [0.45, 1.55, -0.7]]) mesh(rbox(0.12, 0.09, 0.27, 0.04), phys({ color: '#f1efea', roughness: 0.55 }), sx, 0.045, sz, g).rotation.y = r;
  }
  // arcade cabinet (right wall)
  {
    const g = new THREE.Group(); g.position.set(7.55, 0, 1.9); g.rotation.y = -Math.PI / 2; W.add(g);
    const body = phys({ color: '#141320', roughness: 0.4, clearcoat: 0.6 });
    mesh(rbox(0.7, 1.75, 0.7, 0.03), body, 0, 0.875, -0.05, g);
    mesh(rbox(0.72, 0.1, 0.35, 0.02), phys({ color: '#2a2840', roughness: 0.4 }), 0, 1.02, 0.35, g).rotation.x = 0.25;
    const scr = new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: T.arcadeTex(), emissiveIntensity: 0.8 });
    const sc = mesh(new THREE.PlaneGeometry(0.52, 0.62), scr, 0, 1.38, 0.31, g, false); sc.rotation.x = -0.12;
    const mq = mesh(new THREE.PlaneGeometry(0.66, 0.16), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: T.marqueeTex(), emissiveIntensity: 1.2 }), 0, 1.84, 0.33, g, false);
    mesh(rbox(0.72, 0.2, 0.4, 0.02), body, 0, 1.85, 0.12, g);
    for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 14), phys({ color: ['#ff4fa0', '#55e392', '#ffd23a', '#4fa0ff'][i], roughness: 0.3, clearcoat: 1 }), 0.02 + i * 0.07, 1.09, 0.42, g).rotation.x = 0.25;
    mesh(new THREE.SphereGeometry(0.03, 14, 10), phys({ color: '#c8202e', roughness: 0.3 }), -0.18, 1.13, 0.4, g);
    const al = new THREE.PointLight('#ff6fc0', 1.8, 3, 2); al.position.set(0, 1.5, 0.8); g.add(al);
    animated.push((t) => { scr.emissiveIntensity = 0.75 + Math.sin(t * 9) * 0.05; });
    col(7.55, 1.9, 0.75, 0.75);
    interactables.push({ id: 'arcade', prompt: 'Press E to play Pill Blaster', pos: new THREE.Vector3(6.85, 0, 1.9), radius: 0.85 });
  }
  // server rack with blinking LEDs
  {
    const g = new THREE.Group(); g.position.set(-6.4, 0, -5.55); W.add(g);
    mesh(rbox(0.62, 1.5, 0.7, 0.02), M.metalBlack, 0, 0.75, 0, g);
    mesh(new THREE.PlaneGeometry(0.54, 1.4), phys({ color: '#0a0a0c', roughness: 0.15, metalness: 0.3, clearcoat: 1, transparent: true, opacity: 0.85 }), 0, 0.75, 0.352, g, false);
    const led = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.008, 0.004), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 60);
    const cols = [new THREE.Color('#55e392'), new THREE.Color('#ffb02e'), new THREE.Color('#3aa0ff')];
    for (let i = 0; i < 60; i++) { led.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-0.2 + (i % 6) * 0.025, 0.2 + Math.floor(i / 6) * 0.12, 0.345)); led.setColorAt(i, cols[i % 3]); }
    g.add(led);
    animated.push((t) => { for (let i = 0; i < 60; i++) { const on = Math.sin(t * (3 + i % 7) + i * 1.7) > 0.2; led.setColorAt(i, on ? cols[i % 3] : new THREE.Color('#101010')); } led.instanceColor.needsUpdate = true; });
    col(-6.4, -5.55, 0.62, 0.7);
  }
  // wall clock
  { const c = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 48), M.plasticBlack, -3.4, 2.55, maxZ - 0.03, W, false); c.rotation.x = Math.PI / 2;
    const f = mesh(new THREE.CircleGeometry(0.25, 48), std({ map: T.clockTex(), roughness: 0.4 }), -3.4, 2.55, maxZ - 0.052, W, false); f.rotation.y = Math.PI; }
  // backpack slumped by the beanbag
  { const bp = mesh(rbox(0.32, 0.42, 0.2, 0.08, 4), phys({ color: '#2b3f6b', roughness: 0.8, sheen: 0.6, sheenColor: new THREE.Color('#9fb8ff') }), -1.55, 0.2, 2.8); bp.rotation.set(0.2, 0.6, 0.15);
    mesh(rbox(0.24, 0.16, 0.06, 0.04, 3), bp.material, -1.48, 0.16, 2.92).rotation.set(0.2, 0.6, 0.15); }
  // hoodie draped on main chair
  { const hd = mesh(rbox(0.52, 0.35, 0.06, 0.03, 3), phys({ color: '#1f1f22', roughness: 0.95, sheen: 1, sheenColor: new THREE.Color('#666') }), 0, 0, 0, mainChair); hd.position.set(0, 1.08, -0.27); hd.rotation.x = 0.35; }
  // second rug under the main desk
  { const r2 = mesh(new THREE.PlaneGeometry(3.4, 2.2), std({ map: T.rugTex(), color: '#c9b9a8', roughness: 1 }), 0, 0.003, -4.6, W, false); r2.rotation.x = -Math.PI / 2; }


  // corkboard with pinned junk (back wall, left)
  {
    const g = new THREE.Group(); g.position.set(-5.9, 1.65, minZ + 0.03); W.add(g);
    mesh(rbox(1.5, 1.0, 0.04, 0.015), M.walnut, 0, 0, 0, g);
    const cork = T.canvasTex(256, 170, (c, w2, h2) => { c.fillStyle = '#b98d5e'; c.fillRect(0, 0, w2, h2); for (let i = 0; i < 5000; i++) { c.fillStyle = `rgba(${rand() > 0.5 ? 90 : 220},${rand() > 0.5 ? 60 : 170},40,${rand() * 0.4})`; c.fillRect(rand() * w2, rand() * h2, 2, 2); } });
    mesh(new THREE.PlaneGeometry(1.4, 0.9), std({ map: cork, roughness: 1 }), 0, 0, 0.022, g, false);
    const items = [[-0.45, 0.2, 0.3, 0.38, 0], [-0.05, 0.22, 0.26, 0.2, 1], [0.38, 0.15, 0.36, 0.26, 2], [-0.3, -0.22, 0.24, 0.3, 3], [0.15, -0.2, 0.3, 0.22, 4], [0.5, -0.25, 0.18, 0.18, 5]];
    const texs = [T.paperTex(0), T.stickyTex('BATON\\nmeeting\\n3am?', '#ffe66d'), T.funPoster('rug'), T.paperTex(1), T.stickyTex('gm\\ngm\\ngm', '#9fe7ff'), T.stickyTex(':)', '#ff9fb2')];
    items.forEach(([x, y, w2, h2, k]) => {
      const pp = mesh(new THREE.PlaneGeometry(w2, h2), std({ map: texs[k], roughness: 0.8 }), x, y, 0.026 + k * 0.0005, g, false); pp.rotation.z = rr(-0.12, 0.12);
      mesh(new THREE.SphereGeometry(0.012, 8, 6), phys({ color: ['#d33', '#1f9d55', '#ffd23a'][k % 3], roughness: 0.3 }), x, y + h2 / 2 - 0.03, 0.04, g);
    });
    // red string
    cable([[-6.35, 1.82, minZ + 0.07], [-5.95, 1.83, minZ + 0.07], [-5.52, 1.75, minZ + 0.07], [-5.75, 1.42, minZ + 0.07]], '#c8202e');
  }
  // floating wall shelf above the left desk area with figurines + plant
  {
    const g = new THREE.Group(); g.position.set(-1.9, 2.0, minZ + 0.14); W.add(g);
    mesh(rbox(1.1, 0.04, 0.24, 0.012), M.oak, 0, 0, 0, g);
    mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.12, 20), M.pot, -0.35, 0.08, 0, g);
    for (let i = 0; i < 7; i++) { const l = mesh(new THREE.CapsuleGeometry(0.012, 0.25 + rand() * 0.2, 4, 6), M.leaf, -0.35 + rr(-0.05, 0.05), 0.0, rr(-0.04, 0.04), g); l.rotation.z = rr(-1.2, 1.2); l.position.y = -0.05; }
    const tp = mesh(new THREE.CapsuleGeometry(0.035, 0.08, 8, 16), phys({ color: '#d4af37', metalness: 1, roughness: 0.2 }), 0.05, 0.1, 0, g); tp.rotation.z = 0.8;
    mesh(rbox(0.14, 0.2, 0.1, 0.03), phys({ color: '#e8452c', roughness: 0.4 }), 0.35, 0.12, 0, g);
    can(0.2, 0.02, 0.04, g);
  }


  // second beanbag + merch boxes to fill the front of the room
  {
    const g = new THREE.Group(); g.position.set(-1.1, 0, 4.0); g.rotation.y = 0.8; W.add(g);
    const bb = mesh(new THREE.SphereGeometry(0.48, 40, 28), phys({ color: '#e7b631', roughness: 0.85, sheen: 1, sheenColor: new THREE.Color('#fff0a0') }), 0, 0.3, 0, g);
    const p = bb.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -0.2) p.setY(i, -0.2 - (y + 0.2) * 0.15); if (y > 0.12) p.setY(i, 0.12 + (y - 0.12) * 0.5); }
    bb.geometry.computeVertexNormals(); bb.scale.set(1.1, 1, 1);
    col(-1.1, 4.0, 0.85, 0.85);
    box(1.3, 0, 5.45, 0.6, 0.45, 0.5, 0.15); box(1.25, 0.45, 5.45, 0.5, 0.35, 0.42, -0.2, true); box(2.0, 0, 5.5, 0.45, 0.3, 0.4, 0.4);
    const lbl = mesh(new THREE.PlaneGeometry(0.3, 0.12), std({ map: T.stickyTex('MERCH', '#f4f1e8'), roughness: 0.8 }), 1.3, 0.25, 5.19, W, false); lbl.rotation.y = 0.15 + Math.PI; lbl.scale.y = 0.6;
    col(1.6, 5.45, 1.3, 0.6);
    const r3 = mesh(new THREE.CircleGeometry(1.2, 48), std({ color: '#d9cfc0', roughness: 1 }), -1.1, 0.002, 4.0, W, false); r3.rotation.x = -Math.PI / 2;
  }


  // window-side hot desks
  [[-6.7, -2.6], [-6.7, -0.4]].forEach(([x, z], i) => {
    const d = desk(x, z, Math.PI / 2, 1.6, 0.75);
    // laptop
    const lg = new THREE.Group(); lg.position.set(-0.1, 0.775, 0.02); d.add(lg);
    mesh(rbox(0.34, 0.015, 0.23, 0.006), M.metal, 0, 0.008, 0, lg);
    const lid = new THREE.Group(); lid.position.set(0, 0.015, -0.11); lid.rotation.x = -0.3; lg.add(lid);
    mesh(rbox(0.34, 0.22, 0.01, 0.006), M.metal, 0, 0.11, 0, lid);
    mesh(new THREE.PlaneGeometry(0.31, 0.19), new THREE.MeshBasicMaterial({ map: i ? T.codeTex() : T.chartTex(40, '#7cf0ad'), color: '#cccccc' }), 0, 0.11, 0.006, lid, false);
    can(0.45, 0.775, 0.1, d); paper(0.3, 0.776, -0.15, rr(-1, 1), i, d);
    if (i === 0) { pizza(-0.55, 0.775, 0.05, 0.4, true, d); lampDesk(d, 0.65, 0.775, -0.2, 0.3); }
    chair(x + 0.65, z + rr(-0.2, 0.2), -Math.PI / 2 + rr(-0.4, 0.4));
  });

  // ---------------- lights ----------------
  const hemi = new THREE.HemisphereLight('#a8b8ff', '#4a3526', 0.25); scene.add(hemi);
  // warm key from above (big skylight-ish ceiling fixture) - casts the soft shadows
  const key = new THREE.DirectionalLight('#ffd7a8', 1.6);
  key.position.set(3, 9, 4); key.target.position.set(0, 0, -0.5);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -9.5, right: 9.5, top: 8, bottom: -8, near: 1, far: 22 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.025; key.shadow.radius = 4; key.shadow.blurSamples = 16;
  scene.add(key, key.target);
  // cool moonlight through windows
  const moon = new THREE.SpotLight('#8fa6ff', 40, 18, 0.75, 0.6, 1.6);
  moon.position.set(-11, 4.2, 0.5); moon.target.position.set(-2, 0, 0.3);
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.bias = -0.0005; moon.shadow.radius = 6;
  scene.add(moon, moon.target);
  // spotlight over main desk
  const deskSpot = new THREE.SpotLight('#ffd09a', 18, 8, 0.6, 0.7, 1.8);
  deskSpot.position.set(0.3, h - 0.05, -3.6); deskSpot.target.position.set(0, 0.8, -4.9);
  deskSpot.castShadow = true; deskSpot.shadow.mapSize.set(1024, 1024); deskSpot.shadow.bias = -0.0004; deskSpot.shadow.radius = 5;
  scene.add(deskSpot, deskSpot.target);
  // monitor glow for main desk
  const mglow = new THREE.RectAreaLight ? null : null;
  const screenGlow = new THREE.PointLight('#62f2a6', 2.2, 2.6, 2); screenGlow.position.set(0, 0.95, -4.45); scene.add(screenGlow);
  const screenGlow2 = new THREE.PointLight('#62f2a6', 1.4, 2.2, 2); screenGlow2.position.set(5.2, 1.1, -2.35); scene.add(screenGlow2);

  return { whiteboard, group: W, colliders, interactables, animated, screens, pendants, traderDesk, ansemDesk, lights: { key, moon, deskSpot } };
}
