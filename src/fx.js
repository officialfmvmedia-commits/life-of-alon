// Atmosphere: dust motes drifting through light, soft light-beam cones.
import * as THREE from 'three';
import { rand, rr, canvasTex } from './textures.js';

export function buildFX(scene, world) {
  const group = new THREE.Group(); scene.add(group);
  const spark = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,240,220,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });

  // dust clouds around each light source
  const sources = [
    ...world.pendants.map(p => ({ c: new THREE.Vector3(p.g.position.x, p.y - 0.9, p.g.position.z), r: [0.9, 1.0, 0.9], n: 160 })),
    { c: new THREE.Vector3(-5.5, 1.4, 0.3), r: [2.4, 1.2, 4.5], n: 420 }, // moon beam
    { c: new THREE.Vector3(0.1, 1.6, -4.3), r: [1.0, 1.3, 0.9], n: 160 }, // desk spot
  ];
  const total = sources.reduce((a, s) => a + s.n, 0);
  const pos = new Float32Array(total * 3), seed = new Float32Array(total), size = new Float32Array(total);
  let k = 0;
  for (const s of sources) for (let i = 0; i < s.n; i++) {
    pos[k * 3] = s.c.x + rr(-1, 1) * s.r[0]; pos[k * 3 + 1] = s.c.y + rr(-1, 1) * s.r[1]; pos[k * 3 + 2] = s.c.z + rr(-1, 1) * s.r[2];
    seed[k] = rand() * 100; size[k] = 0.5 + rand(); k++;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('sz', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, map: { value: spark }, pr: { value: 1 } },
    vertexShader: `attribute float seed; attribute float sz; uniform float time, pr; varying float vA;
      void main(){ vec3 p = position;
        p.x += sin(time*.13 + seed)*.18; p.y += sin(time*.09 + seed*1.7)*.22; p.z += cos(time*.11 + seed*.7)*.18;
        vec4 mv = modelViewMatrix * vec4(p,1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = sz * 9. * pr / -mv.z;
        vA = (0.35 + 0.65 * (0.5 + 0.5 * sin(time*.7 + seed*3.))) * smoothstep(0.2, 1.5, -mv.z); }`,
    fragmentShader: `uniform sampler2D map; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vec3(1., .93, .82) * t.a * vA * .55, 1.); }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; group.add(pts);

  // light shafts: additive cones with fresnel-ish falloff
  const beamMat = (color, strength) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color(color) }, strength: { value: strength } },
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = uv.y; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 color; uniform float strength; varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(abs(dot(vN, vV)), 2.0); float a = f * pow(vY, 1.6) * strength; gl_FragColor = vec4(color * a, 1.); }`,
  });
  for (const p of world.pendants) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 1.1, 2.0, 40, 1, true), beamMat('#ffcf96', 0.035));
    c.position.set(p.g.position.x, p.y - 1.02, p.g.position.z); c.userData.noAO = true; group.add(c);
  }
  // window shafts
  for (let i = 0; i < 3; i++) {
    const z = -3.6 + i * 3.4;
    const b = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.6, 2.2), beamMat('#9fb4ff', 0.035));
    b.position.set(-5.6, 1.15, z + 0.2); b.rotation.z = 0.42; b.userData.noAO = true;
    // box uv.y isn't a falloff; use a cylinder instead for nicer edges
    const s = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.3, 5.2, 4, 1, true), beamMat('#a9bcff', 0.05));
    s.rotation.z = Math.PI / 2 - 0.4; s.rotation.y = 0; s.position.set(-5.5, 0.9, z); s.scale.set(1, 1, 1);
    s.rotation.x = Math.PI / 4; s.userData.noAO = true; group.add(s);
  }
  return {
    group,
    update(t, pr) { mat.uniforms.time.value = t; mat.uniforms.pr.value = pr; },
  };
}
