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

// Two-bone IK for a skinned arm: rotates upper/fore bones (in their parents' frames) so the wrist
// (hand bone origin) reaches targetWorld, elbow bending toward poleWorld (a direction).
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _m = new THREE.Matrix4(), _qq = new THREE.Quaternion();
export function makeArmIK(rig, side) {
  const U = rig.B['upperarm' + side], F = rig.B['forearm' + side], H = rig.B['hand' + side];
  if (!U || !F || !H) return null;
  const L1 = F.b.position.length(), L2 = H.b.position.length();
  const restU = new THREE.Vector3(0, 1, 0).applyQuaternion(U.qr), restF = new THREE.Vector3(0, 1, 0).applyQuaternion(F.qr);
  return (targetWorld, poleWorld) => {
    const P = U.b.parent; P.updateWorldMatrix(true, false);
    _m.copy(P.matrixWorld).invert();
    const t = _v1.copy(targetWorld).applyMatrix4(_m);
    const pole = _v2.copy(poleWorld).transformDirection(_m);
    const h = U.b.position;
    const d0 = t.clone().sub(h); let d = d0.length();
    d = Math.min(Math.max(d, Math.abs(L1 - L2) + 1e-3), (L1 + L2) * 0.999);
    const dir = d0.normalize();
    const a = Math.acos(THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const perp = pole.clone().addScaledVector(dir, -pole.dot(dir)); if (perp.lengthSq() < 1e-8) perp.set(1, 0, 0); perp.normalize();
    const eDir = dir.clone().multiplyScalar(Math.cos(a)).addScaledVector(perp, Math.sin(a)).normalize();
    U.b.quaternion.copy(_qq.setFromUnitVectors(restU, eDir)).multiply(U.qr);
    U.b.updateWorldMatrix(false, false);
    _m.copy(U.b.matrixWorld).invert();
    const t2 = _v3.copy(targetWorld).applyMatrix4(_m).sub(F.b.position).normalize();
    F.b.quaternion.copy(_qq.setFromUnitVectors(restF, t2)).multiply(F.qr);
  };
}
