// Third-person orbit camera with damping, zoom, room clamping and scripted shots.
import * as THREE from 'three';
import { ROOM } from './world.js';

export class CameraRig {
  constructor(camera, dom) {
    this.camera = camera;
    this.yaw = 0; this.pitch = 0.32; this.dist = 3.6;
    this.tYaw = this.yaw; this.tPitch = this.pitch; this.tDist = this.dist;
    this.target = new THREE.Vector3(0, 1.2, 0);
    this.mode = 'follow'; // follow | shot
    this.shotPos = new THREE.Vector3(); this.shotLook = new THREE.Vector3();
    this.curLook = new THREE.Vector3();
    this.dragging = false;
    let lx = 0, ly = 0;
    dom.addEventListener('pointerdown', (e) => { this.dragging = true; lx = e.clientX; ly = e.clientY; dom.classList.add('drag'); dom.setPointerCapture?.(e.pointerId); });
    window.addEventListener('pointerup', () => { this.dragging = false; dom.classList.remove('drag'); });
    window.addEventListener('pointermove', (e) => {
      if (!this.dragging || this.mode !== 'follow') return;
      this.tYaw -= (e.clientX - lx) * 0.006; this.tPitch += (e.clientY - ly) * 0.004;
      this.tPitch = Math.max(-0.15, Math.min(1.05, this.tPitch)); lx = e.clientX; ly = e.clientY;
    });
    dom.addEventListener('wheel', (e) => { this.tDist = Math.max(1.8, Math.min(6.5, this.tDist * (1 + e.deltaY * 0.001))); e.preventDefault(); }, { passive: false });
  }
  shot(pos, look) { this.mode = 'shot'; this.shotPos.copy(pos); this.shotLook.copy(look); }
  follow() { this.mode = 'follow'; }
  update(dt, playerPos) {
    const cam = this.camera;
    if (this.mode === 'follow') {
      const k = 1 - Math.exp(-dt * 9);
      this.yaw += (this.tYaw - this.yaw) * k; this.pitch += (this.tPitch - this.pitch) * k; this.dist += (this.tDist - this.dist) * (1 - Math.exp(-dt * 6));
      this.target.lerp(new THREE.Vector3(playerPos.x, playerPos.y + 1.25, playerPos.z), 1 - Math.exp(-dt * 10));
      const cp = Math.cos(this.pitch);
      const want = new THREE.Vector3(
        this.target.x + Math.sin(this.yaw) * cp * this.dist,
        this.target.y + Math.sin(this.pitch) * this.dist,
        this.target.z + Math.cos(this.yaw) * cp * this.dist);
      // keep inside the room (shorten the boom rather than clipping walls)
      const m = 0.25;
      const dir = want.clone().sub(this.target);
      let tMax = 1;
      const clampAxis = (o, d, lo, hi) => { if (d > 0 && o + d > hi) tMax = Math.min(tMax, (hi - o) / d); if (d < 0 && o + d < lo) tMax = Math.min(tMax, (lo - o) / d); };
      clampAxis(this.target.x, dir.x, ROOM.minX + m, ROOM.maxX - m);
      clampAxis(this.target.z, dir.z, ROOM.minZ + m, ROOM.maxZ - m);
      clampAxis(this.target.y, dir.y, 0.3, ROOM.h - 0.35);
      want.copy(this.target).addScaledVector(dir, Math.max(0.15, tMax));
      cam.position.lerp(want, 1 - Math.exp(-dt * 14));
      this.curLook.lerp(this.target, 1 - Math.exp(-dt * 14));
      cam.lookAt(this.curLook);
    } else {
      const k = 1 - Math.exp(-dt * 3.2);
      cam.position.lerp(this.shotPos, k);
      this.curLook.lerp(this.shotLook, k);
      cam.lookAt(this.curLook);
    }
  }
  forwardYaw() { return this.yaw; }
}
