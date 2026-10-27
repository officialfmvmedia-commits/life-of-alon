// Shared helpers for the hi-fi skinned character models (models/*.glb, rigged in Blender).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
export async function loadGLB(url, label) {
  try { return (await loader.loadAsync(url)).scene; }
  catch (e) { console.warn(`[hifi] ${label || url} failed to load, using procedural fallback`, e); return null; }
}

// Bone lookup + a pose() that rotates a bone by an euler given in the model's rest space
// (X = character's left, Y = up, Z = forward). Rotations stack down the hierarchy.
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _t = new THREE.Quaternion();
export function prepRig(model, { env = 1.3 } = {}) {
  const bones = {};
  model.traverse((o) => {
    if (o.isBone) bones[o.name.replace(/[^a-z0-9]/gi, '').toLowerCase()] = o;
    if (o.isMesh) {
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      if (o.material) o.material.envMapIntensity = env;
    }
  });
  model.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
  const B = {};
  for (const [k, b] of Object.entries(bones)) {
    const Qw = new THREE.Quaternion();
    new THREE.Matrix4().multiplyMatrices(inv, b.matrixWorld).decompose(new THREE.Vector3(), Qw, new THREE.Vector3());
    B[k] = { b, qr: b.quaternion.clone(), Qw, Qwi: Qw.clone().invert() };
  }
  const pose = (name, x = 0, y = 0, z = 0) => {
    const r = B[name]; if (!r) return;
    _q.setFromEuler(_e.set(x, y, z, 'YXZ'));
    r.b.quaternion.copy(r.qr).multiply(_t.copy(r.Qwi).multiply(_q).multiply(r.Qw));
  };
  return { B, pose };
}
