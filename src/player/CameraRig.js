// ═══ CAMERA — intelligent platforming rig: modes, lookahead, occlusion, FOV ═══
import * as THREE from 'three';

export class CameraRig {
  constructor(camera, world){
    this.cam = camera; this.world = world;
    this.mode = 'follow';             // follow | side | chase | boss | portal
    this.yaw = 0; this.pitch = -0.34;
    this.dist = 7.2;
    this.pos = new THREE.Vector3(0, 4, 8);
    this.look = new THREE.Vector3();
    this.smoothLook = new THREE.Vector3();
    this.modeBlend = 0;
    this.cur = { pos:new THREE.Vector3(), look:new THREE.Vector3(), fov:58 };
    this.sideAxis = new THREE.Vector3(1,0,0); // side-scroll view dir
    this.bossTarget = new THREE.Vector3();
    this.shake = 0; this.shakeT = 0;
    this.baseFov = 58;
    this._desired = new THREE.Vector3();
    this._targetLook = new THREE.Vector3();
    this._v = new THREE.Vector3();
    this.recenterT = 0;
    this.yawVel = 0;
    this.snapNext = true;
  }
  setMode(m, opts={}){
    if (this.mode === m) return;
    this.mode = m;
    if (opts.sideAxis) this.sideAxis.copy(opts.sideAxis);
  }
  impulse(s=0.5){ this.shake = Math.min(1.2, this.shake + s); }
  snap(){ this.snapNext = true; }

  update(dt, player, input){
    const P = player.pos;
    // manual yaw (right stick / QE)
    const camIn = input.camAxis.x;
    if (Math.abs(camIn) > 0.01){
      this.yaw -= camIn * dt * 2.6;
      this.recenterT = 2.2;
    } else {
      this.recenterT -= dt;
      if (this.recenterT <= 0 && this.mode === 'follow' && player.speed > 3){
        // gentle auto-recenter behind velocity
        const vyaw = Math.atan2(player.vel.x, player.vel.z);
        let d = vyaw - this.yaw;
        while (d > Math.PI) d -= Math.PI*2;
        while (d < -Math.PI) d += Math.PI*2;
        if (Math.abs(d) < 1.6) this.yaw += d * dt * 0.85;
      }
    }

    let wantFov = this.baseFov + Math.min(10, player.speed*0.55) + (player.timeSlow>0 ? -6 : 0);
    const head = this._v.set(P.x, P.y + 1.5, P.z);

    switch (this.mode){
      case 'follow': {
        const d = this.dist;
        this._desired.set(
          head.x - Math.sin(this.yaw)*Math.cos(this.pitch)*d,
          head.y - Math.sin(this.pitch)*d,
          head.z - Math.cos(this.yaw)*Math.cos(this.pitch)*d);
        // lookahead toward velocity
        this._targetLook.set(head.x + player.vel.x*0.14, head.y + player.vel.y*0.05, head.z + player.vel.z*0.14);
        break;
      }
      case 'side': {
        // 2.5D: camera off to the side axis, slightly above
        const a = this.sideAxis;
        const lead = THREE.MathUtils.clamp(player.vel.x*0.42, -3.2, 3.2);
        this._desired.set(head.x + lead + a.x*13.5, head.y + 3.2, head.z + a.z*13.5);
        this._targetLook.set(head.x + lead*0.7, head.y + 0.5 + player.vel.y*0.04, head.z);
        wantFov = 48;
        break;
      }
      case 'chase': {
        // in front + above, pitched down: rabbit low-center, boulder looming above
        const vyaw = Math.atan2(player.vel.x, player.vel.z);
        const fx = Math.sin(vyaw), fz = Math.cos(vyaw);
        this._desired.set(head.x + fx*7.4, head.y + 3.0, head.z + fz*7.4);
        this._targetLook.set(head.x - fx*1.2, head.y + 0.55, head.z - fz*1.2);
        wantFov = 62;
        break;
      }
      case 'boss': {
        const b = this.bossTarget;
        const dx = head.x - b.x, dz = head.z - b.z;
        const l = Math.hypot(dx, dz) || 1;
        this._desired.set(head.x + dx/l*6.4, head.y + 3.4, head.z + dz/l*6.4);
        this._targetLook.set((head.x+b.x)/2, head.y + 1.2, (head.z+b.z)/2);
        wantFov = 55;
        break;
      }
    }

    // ── occlusion: pull camera in when colliders block the view ──
    let dist = 1;
    if (this.mode === 'follow' || this.mode === 'boss' || this.mode === 'side'){
      const dir = this._desired.clone().sub(head);
      const len = dir.length(); dir.normalize();
      const hit = this.world.raycast(head, dir, len);
      if (hit) dist = Math.max(0.18, (hit - 0.5)/len);
    }
    this._desired.lerpVectors(head, this._desired, dist);

    // ── smoothing ──
    if (this.snapNext){
      this.pos.copy(this._desired); this.smoothLook.copy(this._targetLook);
      this.snapNext = false;
    } else {
      const pk = 1 - Math.exp(-dt*10), lk = 1 - Math.exp(-dt*8);
      this.pos.lerp(this._desired, pk);
      this.smoothLook.lerp(this._targetLook, lk);
    }

    // ── shake ──
    this.shake = Math.max(0, this.shake - dt*2.6);
    this.shakeT += dt*34;
    const sh = this.shake*this.shake*0.22;
    const ox = Math.sin(this.shakeT*1.1)*sh, oy = Math.cos(this.shakeT*1.7)*sh, oz = Math.sin(this.shakeT*1.3)*sh;

    this.cam.position.set(this.pos.x+ox, this.pos.y+oy, this.pos.z+oz);
    this.cam.lookAt(this.smoothLook.x+ox*0.5, this.smoothLook.y+oy*0.5, this.smoothLook.z);
    const fovK = 1 - Math.exp(-dt*5);
    this.cam.fov += (wantFov - this.cam.fov)*fovK;
    this.cam.updateProjectionMatrix();
  }
}
