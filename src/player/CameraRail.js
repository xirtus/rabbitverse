// ═══ CAMERA RAIL — Crash-style authored camera on rails ═══
// The camera rides a spline of hand-placed nodes keyed to the player's progress
// along the level path. It rounds corners ahead of the player, always frames
// what's coming, and never fights input. No free orbit — by design.
import * as THREE from 'three';

export class CameraRail {
  constructor(camera){
    this.cam = camera;
    this.nodes = [];            // { a:Vector3 (player anchor), c:Vector3 (cam pos), fov }
    this.mode = 'rail';         // rail | boss
    this.bossTarget = new THREE.Vector3();
    this.pos = new THREE.Vector3();
    this.look = new THREE.Vector3();
    this.yaw = Math.PI;         // exposed: input mapping reads this
    this.fov = 55;
    this._i = 0;                // current segment (hysteresis)
    this._snap = true;
    this._tmp = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    this._anchor = new THREE.Vector3();
    this._desired = new THREE.Vector3();
    this._lookT = new THREE.Vector3();
    this._off = new THREE.Vector3();
    this.shake = 0; this.shakeT = 0;
    this.peekX = 0;             // tiny manual peek, springs back
  }
  setNodes(list){
    this.nodes = list.map(n => ({
      a: new THREE.Vector3(...n.at), c: new THREE.Vector3(...n.cam), fov: n.fov ?? 55,
    }));
    this._i = 0; this._snap = true;
  }
  setMode(m, opts={}){ this.mode = m; if (opts.bossTarget) this.bossTarget.copy(opts.bossTarget); }
  impulse(s=0.5){ this.shake = Math.min(1.2, this.shake + s); }
  snap(){ this._snap = true; }

  _catmull(p0, p1, p2, p3, t, out){
    const t2 = t*t, t3 = t2*t;
    out.set(
      0.5*((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
      0.5*((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3),
      0.5*((2*p1.z) + (-p0.z+p2.z)*t + (2*p0.z-5*p1.z+4*p2.z-p3.z)*t2 + (-p0.z+3*p1.z-3*p2.z+p3.z)*t3));
    return out;
  }
  _project(p){
    // find bracketing segment near current index first, then widen search
    const N = this.nodes.length;
    let best = this._i, bestT = 0, bestD = Infinity;
    const lo = Math.max(0, this._i - 2), hi = Math.min(N-2, this._i + 3);
    for (let pass=0; pass<2; pass++){
      const a = pass===0 ? lo : 0, b = pass===0 ? hi : N-2;
      for (let i=a; i<=b; i++){
        const A = this.nodes[i].a, B = this.nodes[i+1].a;
        const abx = B.x-A.x, aby = B.y-A.y, abz = B.z-A.z;
        const l2 = abx*abx + aby*aby + abz*abz;
        let t = l2 > 0 ? ((p.x-A.x)*abx + (p.y-A.y)*aby + (p.z-A.z)*abz)/l2 : 0;
        t = Math.max(0, Math.min(1, t));
        const dx = A.x+abx*t - p.x, dy = A.y+aby*t - p.y, dz = A.z+abz*t - p.z;
        const d = dx*dx + dy*dy*0.25 + dz*dz;   // y de-weighted: rails don't care much about height
        if (d < bestD){ bestD = d; best = i; bestT = t; }
      }
      if (bestD < 4) break;   // good enough locally
    }
    this._i = best;
    return { i:best, t:bestT };
  }
  update(dt, player, input){
    const P = player.pos;
    if (this.mode === 'boss'){
      // dynamic boss framing: player low, boss framed beyond
      const b = this.bossTarget;
      const dx = P.x - b.x, dz = P.z - b.z;
      const l = Math.hypot(dx, dz) || 1;
      this._desired.set(P.x + dx/l*6.8, P.y + 3.6, P.z + dz/l*6.8);
      this._lookT.set((P.x+b.x)/2, P.y + 1.6, (P.z+b.z)/2);
      this.fov = 55;
    } else {
      if (this.nodes.length < 2) return;
      const { i, t } = this._project(P);
      const N = this.nodes.length;
      const n = this.nodes;
      const c0 = n[Math.max(0, i-1)], c1 = n[i], c2 = n[Math.min(N-1, i+1)], c3 = n[Math.min(N-1, i+2)];
      this._catmull(c0.c, c1.c, c2.c, c3.c, t, this._desired);
      // anchor point on the rail (for partial player-follow breathing room)
      this._anchor.lerpVectors(c1.a, c2.a, t);
      this._off.set(P.x - this._anchor.x, 0, P.z - this._anchor.z);
      const ol = this._off.length();
      if (ol > 1.6) this._off.multiplyScalar(1.6/ol);
      this._desired.add(this._off.multiplyScalar(0.35));
      // tiny manual peek that springs back
      const peekIn = input ? input.camAxis.x : 0;
      this.peekX += (peekIn*1.6 - this.peekX) * Math.min(1, dt*(Math.abs(peekIn)>0.01 ? 6 : 3));
      if (Math.abs(this.peekX) > 0.02){
        const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
        this._desired.x += -fz*this.peekX; this._desired.z += fx*this.peekX;
      }
      this._lookT.set(P.x + player.vel.x*0.10, P.y + 1.25 + player.vel.y*0.03, P.z + player.vel.z*0.10);
      this.fov = c1.fov + (c2.fov - c1.fov)*t;
    }
    // smoothing
    if (this._snap){
      this.pos.copy(this._desired); this.look.copy(this._lookT); this._snap = false;
    } else {
      this.pos.lerp(this._desired, 1 - Math.exp(-dt*6.5));
      this.look.lerp(this._lookT, 1 - Math.exp(-dt*9));
    }
    // shake
    this.shake = Math.max(0, this.shake - dt*2.6);
    this.shakeT += dt*34;
    const sh = this.shake*this.shake*0.2;
    const ox = Math.sin(this.shakeT*1.1)*sh, oy = Math.cos(this.shakeT*1.7)*sh;
    this.cam.position.set(this.pos.x+ox, this.pos.y+oy, this.pos.z);
    this.cam.lookAt(this.look.x+ox*0.5, this.look.y+oy*0.5, this.look.z);
    // fov ease
    const baseFov = this.fov + Math.min(8, player.speed*0.5) + (player.timeSlow>0 ? -5 : 0);
    this.cam.fov += (baseFov - this.cam.fov)*Math.min(1, dt*5);
    this.cam.updateProjectionMatrix();
    // yaw exposed for input mapping (camera → player view direction)
    const vy = Math.atan2(this.look.x - this.cam.position.x, this.look.z - this.cam.position.z);
    let d = vy - this.yaw;
    while (d > Math.PI) d -= Math.PI*2;
    while (d < -Math.PI) d += Math.PI*2;
    this.yaw += d * Math.min(1, dt*8);
  }
}
