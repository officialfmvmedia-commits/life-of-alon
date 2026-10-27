// Post-processing: GTAO, bloom, depth of field, filmic output, grade + vignette, SMAA.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

// let FX meshes (light beams) opt out of the AO g-buffer
const _ov = GTAOPass.prototype.overrideVisibility;
GTAOPass.prototype.overrideVisibility = function () {
  const cache = this._visibilityCache;
  this.scene.traverse(o => { cache.set(o, o.visible); if (o.isPoints || o.isLine || o.userData.noAO || o.isSprite) o.visible = false; });
};

// Replaces NaN/Inf pixels (exponent bits all set) with black and clamps extreme HDR values,
// so a single bad pixel can never get smeared into blocks by AO denoise / bloom mips / DOF.
const GuardShader = {
  uniforms: { tDiffuse: { value: null }, maxLum: { value: 24.0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float maxLum; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      uvec4 u = floatBitsToUint(c);
      bvec4 bad = equal(u & uvec4(0x7f800000u), uvec4(0x7f800000u));
      if (any(bad)) c = vec4(0.0, 0.0, 0.0, 1.0);
      c.rgb = clamp(c.rgb, vec3(0.0), vec3(maxLum));
      float l = dot(c.rgb, vec3(.2126,.7152,.0722));
      if (l > maxLum * 0.5) c.rgb *= (maxLum * 0.5) / l;
      c.a = clamp(c.a, 0.0, 1.0);
      gl_FragColor = c;
    }`,
};

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vignette: { value: 0.32 }, grain: { value: 0.035 }, sat: { value: 1.06 }, res: { value: new THREE.Vector2(1, 1) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, vignette, grain, sat; uniform vec2 res; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      // tiny chromatic aberration at the edges
      vec2 d = (uv - .5); float r2 = dot(d,d);
      vec3 c;
      c.r = texture2D(tDiffuse, uv - d * r2 * 0.006).r;
      c.g = texture2D(tDiffuse, uv).g;
      c.b = texture2D(tDiffuse, uv + d * r2 * 0.006).b;
      // split tone: cool shadows, warm highlights
      float l = dot(c, vec3(.2126,.7152,.0722));
      c = mix(vec3(l), c, sat);
      c += mix(vec3(-0.008, 0.004, 0.018), vec3(0.018, 0.008, -0.012), smoothstep(.15,.75,l));
      // gentle S-curve
      c = mix(c, c*c*(3.-2.*c), 0.18);
      // vignette
      float v = smoothstep(0.85, 0.2, length(d * vec2(res.x/res.y, 1.) * 0.9));
      c *= mix(1. - vignette, 1., v);
      // grain
      c += (h(uv * res + fract(time) * 100.) - .5) * grain;
      gl_FragColor = vec4(clamp(c,0.,1.), 1.);
    }`,
};

export function createPost(renderer, scene, camera, quality, flags = {}) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: quality === 'high' ? 4 : 0 });
  const composer = new EffectComposer(renderer, rt);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const guard1 = new ShaderPass(GuardShader); composer.addPass(guard1);

  const gtao = new GTAOPass(scene, camera, size.x, size.y);
  gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.6, thickness: 1.2, scale: 1.1, samples: 16 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  gtao.blendIntensity = 0.9;
  composer.addPass(gtao);
  const guard2 = new ShaderPass(GuardShader); composer.addPass(guard2);

  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.32, 0.5, 0.92);
  composer.addPass(bloom);

  const bokeh = new BokehPass(scene, camera, { focus: 4, aperture: 0.0025, maxblur: 0.008 });
  bokeh.enabled = false;
  composer.addPass(bokeh);

  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  grade.uniforms.res.value.set(size.x, size.y);
  composer.addPass(grade);
  const smaa = new SMAAPass(size.x, size.y);
  composer.addPass(smaa);

  const api = {
    composer, gtao, bloom, bokeh, grade, smaa, guard1, guard2, flags,
    setSize(w, h) {
      composer.setSize(w, h);
      const s = renderer.getDrawingBufferSize(new THREE.Vector2());
      grade.uniforms.res.value.set(s.x, s.y);
      bokeh.uniforms.aspect.value = camera.aspect;
    },
    setQuality(q) {
      this.q = q; this.apply();
    },
    apply() {
      const f = this.flags, q = this.q;
      gtao.enabled = q !== 'low' && f.ao !== false; guard2.enabled = gtao.enabled && !this.noGuard;
      smaa.enabled = q !== 'low' && f.smaa !== false;
      bloom.enabled = f.bloom !== false;
      grade.enabled = f.grade !== false;
    },
    render(dt, t) { grade.uniforms.time.value = t; composer.render(dt); },
  };
  api.q = quality; api.apply();
  return api;
}
