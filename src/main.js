// Life of Alon — entry point. Wires renderer, world, player, camera, interactions, UI.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { setAniso } from './textures.js';
import { buildWorld } from './world.js';
import { Player, loadAlonModel } from './player.js';
import { CameraRig } from './camera.js';
import { Interactions } from './interactions.js';
import { createPost } from './post.js';
import { buildFX } from './fx.js';
import { UI } from './ui.js';
import { Trader } from './npc_trader.js';
import { CouchGuy } from './npc_couch.js';
import { Ansem, ANSEM_ANNOYED } from './npc_ansem.js';
import { audio } from './audio.js';
import { Earnings, earnState } from './earnings.js';
import { NPCLabels, ActionMenu, flyCoins, toScreen } from './npcui.js';
import { AlonOS } from './os/os.js';
import { makeScreenTexture } from './os/screentex.js';
import { store as osStore } from './os/store.js';
import chirpr from './os/apps/chirpr.js';
import pumpfun from './os/apps/pumpfun.js';
import walletApp from './os/apps/wallet.js';
import terminal from './os/apps/terminal.js';
import notes from './os/apps/notes.js';
import settings from './os/apps/settings.js';

const params = new URLSearchParams(location.search);
// effect flags: ?fx=off disables all post-processing; ?ao=0 ?bloom=0 ?dof=0 ?grade=0 ?smaa=0 ?dust=0 ?beams=0 ?shadows=0 ?physical=0 ; ?debug shows toggles
const flagOn = (k, def = true) => { const v = params.get(k); return v === null ? def : !(v === '0' || v === 'off' || v === 'false'); };
const FX_OFF = params.get('fx') === 'off';
const flags = { post: !FX_OFF, ao: flagOn('ao'), bloom: flagOn('bloom'), dof: flagOn('dof'), grade: flagOn('grade'), smaa: flagOn('smaa'), dust: flagOn('dust'), beams: flagOn('beams'), shadows: flagOn('shadows'), physical: flagOn('physical') };

// Any zero-length / NaN normal becomes NaN after normalize() on Apple GPUs (Metal), and the
// resulting NaN pixels get smeared into black squares by bloom/AO. Repair every geometry.
function sanitizeGeometry(root) {
  let fixed = 0;
  root.traverse((o) => {
    const g = o.geometry; if (!g || !g.attributes || !g.attributes.position) return;
    const pos = g.attributes.position;
    for (let i = 0; i < pos.array.length; i++) if (!Number.isFinite(pos.array[i])) { pos.array[i] = 0; fixed++; }
    const n = g.attributes.normal; if (!n) return;
    g.computeBoundingSphere();
    const c = g.boundingSphere ? g.boundingSphere.center : { x: 0, y: 0, z: 0 };
    for (let i = 0; i < n.count; i++) {
      let x = n.getX(i), y = n.getY(i), z = n.getZ(i);
      let l = Math.hypot(x, y, z);
      if (!(l > 1e-5) || !Number.isFinite(l)) {
        x = pos.getX(i) - c.x; y = pos.getY(i) - c.y; z = pos.getZ(i) - c.z; l = Math.hypot(x, y, z);
        if (!(l > 1e-6)) { x = 0; y = 1; z = 0; l = 1; }
        n.setXYZ(i, x / l, y / l, z / l); fixed++;
      } else if (Math.abs(l - 1) > 1e-3) n.setXYZ(i, x / l, y / l, z / l);
    }
    n.needsUpdate = true;
  });
  return fixed;
}
// Optional: swap physical (clearcoat/sheen) for standard materials when ?physical=0
function downgradeMaterials(root) {
  root.traverse((o) => {
    if (!o.material || !o.material.isMeshPhysicalMaterial) return;
    const m = o.material, s = new THREE.MeshStandardMaterial();
    for (const k of ['color', 'map', 'roughness', 'metalness', 'emissive', 'emissiveMap', 'emissiveIntensity', 'side', 'transparent', 'opacity', 'vertexColors', 'bumpMap', 'bumpScale']) if (m[k] !== undefined) s[k] = m[k]?.clone && !m[k].isTexture ? m[k].clone() : m[k];
    o.material = s;
  });
}
let quality = params.get('q') || localStorage.getItem('loa-quality') || 'high';

async function boot() {
  const alonModelP = params.get('alon') === 'old' ? Promise.resolve(null) : loadAlonModel();
  // fonts must be ready before canvas textures are drawn
  await Promise.all(['Anton', 'Marker', 'ArchivoBlack', 'SpaceG', 'JBM'].map(f => document.fonts.load(`40px ${f}`)));

  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  const maxPR = () => (quality === 'high' ? 1.6 : quality === 'medium' ? 1.25 : 1);
  renderer.setPixelRatio(Math.min(devicePixelRatio, maxPR()));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = flags.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  setAniso(renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0d0c');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;
  scene.fog = new THREE.FogExp2('#0f1114', 0.018);

  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.05, 60);
  camera.position.set(6, 2.6, 5);

  const world = buildWorld(scene);
  const alonModel = params.get('alon') === 'old' ? null : await alonModelP;
  const player = new Player(scene, world.colliders, alonModel);
  player.pos.set(0.35, 0, -0.9);
  const trader = new Trader(scene, world);
  const couch = new CouchGuy(scene, world);
  const ansem = new Ansem(scene, world); ansem.npcId = 'ansem';
  trader.npcId = 'duve'; trader.name = 'DUVE'; couch.npcId = 'rasmr';
  trader.interaction.actions = true; couch.interaction.actions = true;
  const fx = buildFX(scene, world);
  const fixedNormals = flagOn('sanitize') ? sanitizeGeometry(scene) : 0;
  if (fixedNormals) console.info('[alon] repaired', fixedNormals, 'bad normals/positions');
  if (!flags.physical) downgradeMaterials(scene);
  fx.group.traverse(o => { if (o.isPoints) o.visible = flags.dust; else if (o.isMesh) o.visible = flags.beams; });
  const rig = new CameraRig(camera, canvas);
  rig.tYaw = rig.yaw = -0.25;
  const post = createPost(renderer, scene, camera, quality, flags);
  if (!flagOn('guard')) { post.guard1.enabled = false; post.guard2.enabled = false; post.noGuard = true; }

  // ---------- state ----------
  const S = { mode: 'title', t: 0 };
  const input = { f: 0, b: 0, l: 0, r: 0, run: 0 };
  const keymap = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', ShiftLeft: 'run', ShiftRight: 'run' };

  const interactions = new Interactions(world.interactables, {
    computer: (it) => enterComputer(it),
    pizza: () => UI.toast('cold pizza. still elite.'),
    fridge: () => UI.toast('+1 energy drink. hands shaking slightly.'),
    trader: () => { bubble.show(trader.nextLine(), 3.2, trader); },
    couch: () => { bubble.show(couch.nextLine(), 3.4, couch); },
    ansem: () => { bubble.show(ansem.nextLine(), 3.4, ansem); },
    arcade: () => UI.toast('PILL BLASTER: high score held by DUVE. nobody knows how.'),
  });

  // speech bubble that follows the trader's head
  // speech bubble: follows whichever NPC is talking (any object with headWorld() + name)
  const bubble = {
    el: document.getElementById('bubble'), until: 0, npc: null,
    show(text, secs = 3.2, npc = trader) { this.npc = npc; this.el.querySelector('.who').textContent = npc.name || npc.root?.name || ''; this.el.querySelector('span').textContent = text; this.el.classList.remove('hidden'); this.until = S.t + secs; },
    update() {
      if (!this.el.classList.contains('hidden') && S.t > this.until) this.el.classList.add('hidden');
      const p = (this.npc || trader).headWorld(new THREE.Vector3()); p.y += 0.5; p.project(camera);
      const vis = p.z < 1 && (S.mode === 'play' || S.mode === 'menu');
      this.el.style.transform = `translate(${(p.x * 0.5 + 0.5) * innerWidth}px, ${(-p.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -100%)`;
      if (!vis) this.el.classList.add('hidden');
    },
  };
  // ---------- alonOS ----------
  const os = new AlonOS(document.getElementById('os-root'), [chirpr, pumpfun, walletApp, terminal, notes, settings], { onStandUp: () => exitComputer() });
  const screenTex = makeScreenTexture(osStore, [chirpr, pumpfun, walletApp, terminal, notes, settings]);
  { const it = world.interactables.find(i => i.id === 'computer'); it.screenMat.map = screenTex.tex; it.screenMat.color.setScalar(0.92); it.screenMat.needsUpdate = true; }
  for (const ev of ['wallet', 'airdrop', 'reset', 'wall']) os.on(ev, () => screenTex.draw());
  setInterval(() => { if (S.mode !== 'computer') screenTex.draw(); }, 20000);
  // ---------- NPC earnings, floating PnL labels, action menu ----------
  const earnings = new Earnings();
  earnings.hyped = !!osStore.get().airdropDelivered;
  earnings.on((id, d, ev) => {
    if (id === 'duve' && ev && trader.state === 'trade') trader.react(ev === 'spike' ? 'pump' : 'headhands');
    if (id === 'rasmr' && ev === 'spike' && couch.state === 'scroll') couch.react('laugh');
    if (id === 'ansem' && ev && ansem.state === 'trade') ansem.react(ev === 'spike' ? (Math.random() < 0.5 ? 'fist' : 'nod') : 'shake');
  });
  const npcUI = document.createElement('div'); npcUI.id = 'npc-ui'; document.body.appendChild(npcUI);
  const labels = new NPCLabels(npcUI);
  const duveAnchor = (() => { const v = new THREE.Vector3(); for (const m of trader.td.monitors) v.add(m.screen.getWorldPosition(new THREE.Vector3())); v.multiplyScalar(1 / trader.td.monitors.length); v.y += 0.42; return v; })();
  labels.add({ id: 'duve', anchor: () => duveAnchor, get: () => earnState('duve').pnl, title: 'DUVE · PnL' });
  const ansemAnchor = (() => { const v = new THREE.Vector3(); for (const m of ansem.td.monitors) v.add(m.screen.getWorldPosition(new THREE.Vector3())); v.multiplyScalar(1 / ansem.td.monitors.length); v.y += 0.44; return v; })();
  labels.add({ id: 'ansem', anchor: () => ansemAnchor, get: () => earnState('ansem').pnl, title: 'ANSEM · PnL' });
  const rasmrAnchor = new THREE.Vector3(-4.02, 1.5, 4.95);
  labels.add({ id: 'rasmr', anchor: () => rasmrAnchor, get: () => earnState('rasmr').pnl, small: true, title: 'RASMR · PnL' });
  const menu = new ActionMenu(npcUI);
  menu.onClose = () => { if (S.mode === 'menu') S.mode = 'play'; };
  const ANNOYED = {
    duve: ['bro what', "that's half my bag", 'tax season already?', 'ALON. I SAW THAT.', 'that was my pizza money', 'I was about to compound that'],
    ansem: ANSEM_ANNOYED,
    rasmr: ['bro I was gonna use that for research', "that's half my bag", 'tax season already?', 'locked in AND robbed. incredible', 'is this what the airdrop feels like in reverse'],
  };
  const EMPTY = ["there's nothing to take bro. I'm down bad", "I'm literally at zero. let me cook", 'my bag is a rumor right now'];
  const COOL = (w) => [`chill, let me earn it back first${w ? ` (${w}s)` : ''}`, `you JUST taxed me${w ? `. ${w}s, minimum` : ''}`, 'bro the ink on the last one is still wet'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const headPos = (npc) => npc.headWorld(new THREE.Vector3());
  function takeHalf(npc) {
    const id = npc.npcId, name = npc.name || npc.root.name;
    const c = earnings.canTake(id);
    if (!c.ok) { bubble.show(c.reason === 'empty' ? pick(EMPTY) : pick(COOL(c.wait)), 3, npc); return; }
    const r = earnings.takeHalf(id, name);
    const from = toScreen(headPos(npc), camera) || { x: innerWidth / 2, y: innerHeight / 2 };
    const to = toScreen(player.pos.clone().add(new THREE.Vector3(0, 1.55, 0)), camera) || { x: innerWidth / 2, y: innerHeight * 0.6 };
    lastTake = { id, amount: r.amount };
    flyCoins(npcUI, from, to, { n: 18, amount: r.amount }); audio.coins(12, 0.9);
    os.emit('wallet', { delta: r.amount });
    UI.toast(`+${r.amount.toFixed(3)} SOL → Alon's Wallet (half of ${name}'s earnings)`, 3200);
    setTimeout(() => { if (id === 'duve') trader.react('headhands'); else if (id === 'ansem') ansem.react('shake'); else couch.react('talk'); bubble.show(pick(ANNOYED[id]), 3.4, npc); }, 950);
  }
  let lastTake = null;
  function actionsFor(npc) {
    const id = npc.npcId, him = id === 'duve' ? 'his' : 'his';
    const take = {
      icon: '◎', label: 'Take half of earnings', confirm: true,
      sub: () => { const p = earnState(id).pnl; return (p >= 0 ? '+' : '−') + Math.abs(p).toFixed(2); },
      canRun: () => earnings.canTake(id).ok,
      confirmLabel: () => `Take ${(earnState(id).pnl / 2).toFixed(3)} SOL? (again)`,
      run: () => takeHalf(npc),
    };
    const talk = { icon: '💬', label: 'Talk', run: () => bubble.show(npc.nextLine(), 3.2, npc) };
    if (id === 'duve') return [talk, take,
      { icon: '👜', label: 'Check his bags', run: () => bubble.show(pick(["bags: 69M $DUVE, some $SEWER, and hope", "don't look. it's mostly $DUVE. I made $DUVE.", 'portfolio is 80% conviction, 20% pizza']), 3.2, npc) },
      { icon: '🔥', label: 'Hype him up', run: () => { trader.react('pump'); earnState('duve').pnl += 0.02; bubble.show(pick(["LET'S GOOOO", 'YOU KNOW WHAT, YOU\'RE RIGHT. SENDING IT', "I'm HIM. I'm literally HIM"]), 2.8, npc); } }];
    if (id === 'ansem') return [talk, take,
      { icon: '📞', label: 'Ask for a call', run: () => bubble.show(ansem.callLine(), 3.4, npc) },
      { icon: '👜', label: 'Check his bags', run: () => bubble.show(ansem.bagsLine(), 3.4, npc) }];
    return [talk, take,
      { icon: '📱', label: 'Peek at his phone', run: () => bubble.show(pick(['chirpr. 47 tabs. one is a recipe.', "it's a thread about BATON. he's 200 posts deep", 'bro is in the replies arguing about pizza']), 3.2, npc) },
      { icon: '🔥', label: 'Hype him up', run: () => { couch.react('laugh'); bubble.show(pick(["ok ok I'm locked in. for real this time", 'say less. research mode: MAXIMUM', "I'm literally the main character of this couch"]), 2.8, npc); } }];
  }
  function openMenu(it) {
    const npc = it.id === 'trader' ? trader : it.id === 'ansem' ? ansem : couch;
    S.mode = 'menu'; for (const k in input) input[k] = 0; UI.prompt(null); audio.click('menu');
    menu.show(npc, npc.name || npc.root.name, actionsFor(npc));
  }
  const duveDrained = () => !!osStore.get().traders.duve?.drained;
  trader.setDrained(duveDrained());
  let duvePending = false, hypePending = false;
  const applyAirdrop = (v) => { earnings.hyped = v; trader.setHyped(v); couch.setHyped(v); ansem.setHyped(v); world.whiteboard.set(v); };
  if (osStore.get().airdropDelivered) applyAirdrop(true);
  ansem.setDrained(!!osStore.get().traders.ansem?.drained);
  let ansemPending = false;
  os.on('drain', (d) => { if (d.id === 'duve') { trader.setDrained(true); duvePending = !trader.hyped; } if (d.id === 'ansem') { ansem.setDrained(true); ansemPending = !ansem.hyped; } });
  os.on('airdrop', () => { applyAirdrop(true); hypePending = true; duvePending = ansemPending = false; });
  os.on('reset', () => { trader.setDrained(false); ansem.setDrained(false); applyAirdrop(false); duvePending = hypePending = ansemPending = false; });
  function enterComputer(it) {
    S.mode = 'computer'; player.enabled = false; player.object.visible = false;
    UI.prompt(null); UI.hud(false);
    curScreen = it; frameScreen();
    post.bokeh.enabled = flags.dof; post.bokeh.uniforms.focus.value = screenDist;
    for (const k in input) input[k] = 0;
    osShown = false; osEnterT = S.t;
  }
  // camera framing so the monitor (plus a sliver of bezel) fills the view, and the OS DOM is pinned to the screen quad
  let curScreen = null, screenDist = 0.8, osShown = false, osEnterT = 0;
  const _c = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  function frameScreen() {
    const it = curScreen; if (!it) return;
    const m = it.screenMesh; m.updateMatrixWorld(true);
    const ctr = new THREE.Vector3().setFromMatrixPosition(m.matrixWorld);
    const nrm = new THREE.Vector3(0, 0, 1).transformDirection(m.matrixWorld);
    const [sw, sh] = it.screenSize; const bw = sw + 0.05, bh = sh + 0.05;
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    screenDist = Math.max((bh / 2) / tv, (bw / 2) / (tv * camera.aspect));
    rig.shot(ctr.clone().addScaledVector(nrm, screenDist), ctr);
  }
  function placeOS() {
    if (!curScreen || os.full) return;
    const [sw, sh] = curScreen.screenSize, m = curScreen.screenMesh;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b], i) => { const v = _c[i].set(a * sw / 2, b * sh / 2, 0).applyMatrix4(m.matrixWorld).project(camera); const px = (v.x * 0.5 + 0.5) * innerWidth, py = (-v.y * 0.5 + 0.5) * innerHeight; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); });
    const LW = 1280, s = (x1 - x0) / LW, LH = (y1 - y0) / s;
    os.scale = s;
    const w = os.wrap.style; w.width = LW + 'px'; w.height = LH.toFixed(2) + 'px'; w.transform = `translate(${x0.toFixed(2)}px, ${y0.toFixed(2)}px) scale(${s.toFixed(5)})`;
  }
  function exitComputer() {
    if (S.mode !== 'computer') return;
    document.activeElement?.blur?.();
    S.mode = 'play'; player.enabled = true; player.object.visible = true; UI.computer(false); UI.hud(true); osShown = false; screenTex.draw();
    rig.follow(); post.bokeh.enabled = false; canvas.focus?.();
    if (hypePending) { hypePending = false; setTimeout(() => { if (S.mode === 'play') bubble.show(trader.hypeLine(), 4.5, trader); }, 1100); setTimeout(() => { if (S.mode === 'play') bubble.show(ansem.hypeLine(), 4.5, ansem); }, 3600); setTimeout(() => { if (S.mode === 'play') bubble.show(couch.hypeLine(), 4.5, couch); }, 6000); }
    else if (duvePending || ansemPending) { const d = duvePending, a = ansemPending; duvePending = ansemPending = false; if (d) setTimeout(() => { if (S.mode === 'play') bubble.show(trader.upsetLine(), 4.5, trader); }, 1100); if (a) setTimeout(() => { if (S.mode === 'play') bubble.show(ansem.upsetLine(), 4.5, ansem); }, d ? 4200 : 1100); }
  }
  function startGame() {
    if (S.mode !== 'title') return;
    S.mode = 'play'; UI.title(false); UI.hud(true);
    post.bokeh.enabled = false; rig.follow(); canvas.focus();
    audio.start(); // needs the Start click / key press (autoplay policy); stays silent otherwise
  }
  // ---------- sound ----------
  {
    const kbWorld = (npc) => { const v = npc.kb.clone(); npc.root.localToWorld(v); return [v.x, v.y, v.z]; };
    const playing = () => S.mode !== 'title';
    audio.addTypist({ pos: kbWorld(trader), level: 1, busy: 0.75, typing: () => playing() && (trader.state === 'trade' || trader.state === 'talk') });
    audio.addTypist({ pos: kbWorld(ansem), level: 0.9, busy: 0.85, typing: () => playing() && (ansem.state === 'trade' || ansem.state === 'talk' || ansem.state === 'nod') });
    audio.addTypist({ pos: [2.75, 0.85, -1.2], level: 0.55, busy: 0.12 });
    audio.addTypist({ pos: [-6.6, 0.85, -2.6], level: 0.5, busy: 0.08 });
    audio.addTypist({ pos: [-6.6, 0.85, -0.4], level: 0.5, busy: 0.06 });
    { const h = couch.headWorld(new THREE.Vector3()); audio.addTypist({ pos: [h.x, h.y - 0.35, h.z + 0.2], kind: 'phone', level: 0.8, typing: () => playing() && couch.state === 'scroll' }); }
    const _open = os.open.bind(os); os.open = (id, a) => { const had = os.wins.has(id); const r = _open(id, a); if (!had && r) audio.click('open'); return r; };
    const _close = os.close.bind(os); os.close = (id) => { if (os.wins.has(id)) audio.click('close'); return _close(id); };
    os.wrap.addEventListener('pointerdown', () => audio.click('click'), true);
    os.on('drain', () => setTimeout(() => audio.coins(22, 1.4), 200));
    os.on('airdrop', () => audio.swell());
    // HUD speaker toggle
    const snd = document.createElement('button'); snd.id = 'snd'; snd.className = 'hud-snd'; snd.title = 'Sound (M)';
    const paint = () => { const off = audio.muted || audio.vol === 0; snd.classList.toggle('off', off); snd.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>${off ? '<path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' : '<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>'}</svg><span>${off ? 'muted' : Math.round(audio.vol * 100) + '%'}</span>`; };
    snd.addEventListener('click', (e) => { e.stopPropagation(); audio.start(); audio.toggleMute(); });
    document.getElementById('hud').appendChild(snd); audio.onChange(paint); paint();
  }
  UI.onStart(startGame);

  const typing = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  addEventListener('keydown', (e) => {
    if (S.mode === 'menu') { if (menu.key(e)) e.preventDefault(); return; }
    if (S.mode === 'computer') {
      if (e.code === 'Escape') {
        e.preventDefault();
        if (typing(document.activeElement)) document.activeElement.blur();
        else if (!os.handleEscape()) exitComputer();
      }
      return; // the OS owns the keyboard while seated
    }
    if (typing(e.target)) return;
    if (keymap[e.code]) { input[keymap[e.code]] = 1; e.preventDefault(); }
    if (S.mode === 'title' && (e.code === 'Enter' || e.code === 'Space')) startGame();
    else if (e.code === 'KeyM' && (S.mode === 'play' || S.mode === 'title')) { audio.start(); audio.toggleMute(); UI.toast(audio.muted ? 'sound off (M)' : 'sound on (M)', 1400); }
    else if (S.mode === 'play' && e.code === 'KeyE') interactions.use();
    else if (S.mode === 'play' && e.code === 'KeyF' && interactions.current?.actions) openMenu(interactions.current);
    if (e.code === 'KeyQ' && S.mode !== 'title') cycleQuality();
  });
  addEventListener('keyup', (e) => { if (keymap[e.code]) input[keymap[e.code]] = 0; });
  addEventListener('blur', () => { for (const k in input) input[k] = 0; });

  function cycleQuality() {
    quality = quality === 'high' ? 'medium' : quality === 'medium' ? 'low' : 'high';
    localStorage.setItem('loa-quality', quality);
    renderer.setPixelRatio(Math.min(devicePixelRatio, maxPR()));
    onResize(); post.setQuality(quality);
    UI.toast(`graphics: ${quality}`);
  }

  function onResize() {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    if (S.mode === 'computer') frameScreen();
    renderer.setSize(innerWidth, innerHeight, false);
    post.setSize(innerWidth, innerHeight);
  }
  addEventListener('resize', onResize);

  // ---------- title camera ----------
  const titleShot = (t) => {
    const a = -0.55 + Math.sin(t * 0.06) * 0.25;
    const p = new THREE.Vector3(Math.sin(a) * 5.4 + 1.2, 2.35 + Math.sin(t * 0.1) * 0.1, Math.cos(a) * 4.2 + 0.6);
    rig.shot(p, new THREE.Vector3(-0.9, 1.2, -2.4));
  };

  // ---------- loop ----------
  const clock = new THREE.Clock();
  let frames = 0, acc = 0, slow = 0;
  function frame() {
    const dt = Math.min(clock.getDelta(), 1 / 20);
    S.t += dt;
    if (S.mode === 'title') {
      titleShot(S.t);
      { const d = camera.position.clone().sub(player.pos); player.facing = Math.atan2(d.x, d.z) - 0.25; }
      post.bokeh.enabled = quality === 'high' && flags.dof;
      post.bokeh.uniforms.focus.value = camera.position.distanceTo(player.pos) * 0.95;
      post.bokeh.uniforms.aperture.value = 0.0012;
    } else if (S.mode === 'computer') {
      post.bokeh.uniforms.focus.value = screenDist; post.bokeh.uniforms.aperture.value = 0.004;
    }
    player.update(dt, S.mode === 'play' ? input : {}, rig.yaw);
    if (S.mode === 'play') {
      const it = interactions.update(player.pos, player.facing);
      UI.prompt(it ? it.prompt : null, !!it?.actions);
    }
    rig.update(dt, player.pos);
    audio.setDuck(S.mode === 'computer'); audio.update(dt, camera);
    if (S.mode === 'play') audio.steps(player.phase, player.moveAmt, !!input.run); else audio.lastPhase = player.phase;
    if (S.mode === 'computer') {
      camera.updateMatrixWorld(); placeOS();
      if (!osShown && (camera.position.distanceTo(rig.shotPos) < 0.03 || S.t - osEnterT > 1.6)) { osShown = true; UI.computer(true); os.onShow(); }
    }
    for (const fn of world.animated) fn(S.t);
    if (S.mode !== 'title') earnings.update(dt);
    trader.update(dt); couch.update(dt); ansem.update(dt); bubble.update();
    labels.update(camera, player.pos, S.mode === 'play' || S.mode === 'menu', (id) => bubble.npc?.npcId === id && !bubble.el.classList.contains('hidden'));
    if (menu.open) menu.update(headPos(menu.npc), camera);
    fx.update(S.t, renderer.getPixelRatio());
    const osCovers = S.mode === 'computer' && os.full && !document.getElementById('computer').classList.contains('hidden');
    if (!osCovers) { if (flags.post) post.render(dt, S.t); else renderer.render(scene, camera); }
    // auto-drop quality if the Mac is struggling for a sustained period
    frames++; acc += dt;
    if (acc > 2) { const fps = frames / acc; if (fps < 40 && S.mode === 'play' && quality !== 'low' && flagOn('autoq')) { slow++; if (slow >= 2) { cycleQuality(); slow = 0; } } else slow = 0; frames = 0; acc = 0; }
    requestAnimationFrame(frame);
  }
  if (!flags.post) { renderer.toneMapping = THREE.AgXToneMapping; }
  if (params.has('debug')) buildDebug();
  function buildDebug() {
    const d = document.createElement('div'); d.id = 'dbg';
    d.style.cssText = 'position:fixed;top:64px;right:14px;z-index:60;background:#000c;border:1px solid #fff3;border-radius:10px;padding:10px 12px;font:12px JBM,monospace;color:#eee;display:grid;gap:4px;max-width:280px';
    const fpsEl = document.createElement('div'); d.appendChild(fpsEl);
    const items = [['post', 'post-processing'], ['ao', 'ambient occlusion'], ['bloom', 'bloom'], ['dof', 'depth of field'], ['grade', 'grade/vignette'], ['smaa', 'SMAA'], ['dust', 'dust motes'], ['beams', 'light beams'], ['shadows', 'shadows']];
    for (const [k, label] of items) {
      const l = document.createElement('label'); l.style.cursor = 'pointer';
      const c = document.createElement('input'); c.type = 'checkbox'; c.checked = flags[k];
      c.onchange = () => {
        flags[k] = c.checked;
        if (k === 'dust' || k === 'beams') fx.group.traverse(o => { if (o.isPoints) o.visible = flags.dust; else if (o.isMesh) o.visible = flags.beams; });
        if (k === 'shadows') { renderer.shadowMap.enabled = flags.shadows; scene.traverse(o => { if (o.material) [].concat(o.material).forEach(mm => mm.needsUpdate = true); }); }
        post.apply();
      };
      l.append(c, ' ' + label); d.appendChild(l);
    }
    const info = document.createElement('div'); info.style.opacity = .6; info.style.fontSize = '10px'; info.style.wordBreak = 'break-word';
    const gl = renderer.getContext(); const ext = gl.getExtension('WEBGL_debug_renderer_info');
    info.textContent = (ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'gpu ?') + ' · fixed normals: ' + fixedNormals;
    d.appendChild(info); document.body.appendChild(d);
    let fr = 0, t0 = performance.now();
    setInterval(() => { const n = performance.now(); fpsEl.textContent = `fps ${(fr * 1000 / (n - t0)).toFixed(0)} · q=${quality}`; fr = 0; t0 = n; }, 500);
    (function cnt() { fr++; requestAnimationFrame(cnt); })();
  }
  UI.loading(false); UI.title(true);
  frame();

  // debug / automation hooks (used by screenshot scripts and future features)
  window.__game = { audio, os, osStore, trader, couch, ansem, earnings, earnState, labels, menu, openMenu, takeHalf, get lastTake() { return lastTake; }, bubble, THREE, scene, camera, renderer, rig, player, world, interactions, post, S, startGame, enterComputer: () => enterComputer(world.interactables[0]), exitComputer, input };
}
boot().catch((e) => { console.error(e); document.querySelector('#loading p').textContent = 'error: ' + e.message; });
