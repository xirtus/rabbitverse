// ═══ RABBIT V2 — "NOODLE": original rubber-hose cartoon rabbit ═══
// Lanky, springy, silent-film-era animation language: cascading ear springs,
// laggy elbows, loose spine, smear frames, overshoot everywhere.
// (V1 saved at Rabbit.js — this is the new production rig.)
import * as THREE from 'three';

const FUR   = 0xe89a4a;   // golden marigold
const FURD  = 0xc67a2e;   // shadow fur
const CREAM = 0xfff2dc;
const ROSE  = 0xff96a8;
const AMBER = 0x4a2c14;
const TEAL  = 0x22b8a6;
const NOSEC = 0xe85a70;

function mat(c, r=0.6, e={}){ return new THREE.MeshStandardMaterial({ color:c, roughness:r, metalness:0, ...e }); }
function sph(r, w=18, h=14){ return new THREE.SphereGeometry(r, w, h); }
function cap(r, l, s=5, g=10){ return new THREE.CapsuleGeometry(r, l, s, g); }

// Single smooth bendy ear: spine-integrated tube, verts rewritten per frame.
const EAR_RINGS = 13, EAR_SEG = 7, EAR_LEN = 1.02;
class BendyEar {
  constructor(furMat, innerMat){
    this.N = EAR_RINGS; this.S = EAR_SEG;
    const geo = new THREE.BufferGeometry();
    const verts = (this.N)*(this.S);
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts*3), 3).setUsage(THREE.DynamicDrawUsage));
    const idx = [];
    for (let r=0;r<this.N-1;r++) for (let k=0;k<this.S;k++){
      const a = r*this.S+k, b = r*this.S+(k+1)%this.S, c = (r+1)*this.S+k, d = (r+1)*this.S+(k+1)%this.S;
      idx.push(a,c,b, b,c,d);
    }
    geo.setIndex(idx);
    this.outer = new THREE.Mesh(geo, furMat);
    this.outer.frustumCulled = false;
    // inner ear: same spine, forward offset, pink, shorter
    const geo2 = new THREE.BufferGeometry();
    geo2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts*3), 3).setUsage(THREE.DynamicDrawUsage));
    geo2.setIndex(idx);
    this.inner = new THREE.Mesh(geo2, innerMat);
    this.inner.frustumCulled = false;
    this.group = new THREE.Group();
    this.group.add(this.outer, this.inner);
    this._q = new THREE.Quaternion(); this._e = new THREE.Euler();
    this._dir = new THREE.Vector3(); this._sp = new THREE.Vector3(); this._pv = new THREE.Vector3();
  }
  radius(t){ // bulge then taper
    return 0.082*(1 - t*0.72) * (1 + 0.35*Math.sin(t*Math.PI)) + 0.012*(1-t);
  }
  // a,b,c = pitch curvature coeffs; l1,l2 = lateral; returns nothing (writes buffers)
  bend(a, b, c, l1, l2){
    const posO = this.outer.geometry.attributes.position;
    const posI = this.inner.geometry.attributes.position;
    let px=0, py=0, pz=0;
    const ds = EAR_LEN/(this.N-1);
    let dx=0, dy=1, dz=0;
    for (let r=0;r<this.N;r++){
      const t = r/(this.N-1);
      const th = a + b*t + c*t*t;          // pitch (back-sweep)
      const ph = (l1*t + l2*t*t);          // lateral whip
      // direction via small euler (pitch about X, lean about Z)
      this._e.set(-th, 0, ph, 'ZYX');
      this._q.setFromEuler(this._e);
      this._dir.set(0,1,0).applyQuaternion(this._q);
      if (r > 0){ px += this._dir.x*ds; py += this._dir.y*ds; pz += this._dir.z*ds; }
      const rad = this.radius(t);
      const radI = rad*0.55;
      for (let k=0;k<this.S;k++){
        const an = k/this.S*Math.PI*2;
        // ring in local frame: circle facing dir (flattened in z for blade-ear look)
        this._pv.set(Math.cos(an)*rad, 0, Math.sin(an)*rad*0.45);
        this._pv.applyQuaternion(this._q);
        const vi = (r*this.S+k)*3;
        posO.array[vi]   = px + this._pv.x;
        posO.array[vi+1] = py + this._pv.y;
        posO.array[vi+2] = pz + this._pv.z;
        // inner: forward offset along the bend normal (sits on the front face)
        this._pv.set(Math.cos(an)*radI, 0, Math.sin(an)*radI*0.28);
        this._pv.applyQuaternion(this._q);
        this._fv ??= new THREE.Vector3();
        this._fv.set(0, 0, rad*0.5).applyQuaternion(this._q);
        posI.array[vi]   = px + this._pv.x + this._fv.x;
        posI.array[vi+1] = py + this._pv.y + this._fv.y;
        posI.array[vi+2] = pz + this._pv.z + this._fv.z;
      }
    }
    // hide inner ear tip rows beyond 80%
    posO.needsUpdate = true; posI.needsUpdate = true;
    this.outer.geometry.computeVertexNormals();
    this.inner.geometry.computeVertexNormals();
  }
}

class Spring {
  constructor(k=90, d=10){ this.x=0; this.v=0; this.k=k; this.d=d; this.target=0; }
  update(dt, force=0){
    this.v += ((this.target - this.x)*this.k + force)*dt;
    this.v *= Math.exp(-this.d*dt);
    this.x += this.v*dt;
    return this.x;
  }
}

export class Rabbit {
  constructor(scene){
    this.root = new THREE.Group();                 // ground origin
    this.squashNode = new THREE.Group();           // squash & stretch
    this.root.add(this.squashNode);
    this.hips = new THREE.Group();                 // hip pivot
    this.hips.position.y = 0.58;
    this.squashNode.add(this.hips);
    scene.add(this.root);

    const M = {
      fur: mat(FUR), furd: mat(FURD), cream: mat(CREAM, 0.68), rose: mat(ROSE, 0.5),
      teal: mat(TEAL, 0.5), dark: mat(0x241610, 0.35), white: mat(0xffffff, 0.22),
      nose: mat(NOSEC, 0.35), amber: mat(AMBER, 0.3),
    };

    // ── PELVIS / TORSO (two-part bendy spine) ──
    const pelvis = new THREE.Mesh(sph(0.30), M.fur);
    pelvis.scale.set(1, 0.8, 0.85);
    this.hips.add(pelvis);
    this.spine = new THREE.Group();                // bends with accel
    this.spine.position.y = 0.16;
    this.hips.add(this.spine);
    const chest = new THREE.Mesh(sph(0.31), M.fur);
    chest.scale.set(0.95, 1.25, 0.85);
    chest.position.y = 0.22;
    const belly = new THREE.Mesh(sph(0.26), M.cream);
    belly.scale.set(0.75, 1.15, 0.55);
    belly.position.set(0, 0.20, 0.13);
    this.spine.add(chest, belly);
    // teal scarf
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.075, 10, 22), M.teal);
    scarf.rotation.x = Math.PI/2 - 0.18; scarf.position.set(0, 0.47, 0.02);
    const knot = new THREE.Mesh(sph(0.085, 10, 8), M.teal);
    knot.position.set(0, 0.42, 0.28);
    const tail1 = new THREE.Mesh(cap(0.045, 0.16, 4, 8), M.teal);
    tail1.position.set(-0.05, 0.33, 0.30); tail1.rotation.z = 0.5;
    const tail2 = new THREE.Mesh(cap(0.04, 0.13, 4, 8), M.teal);
    tail2.position.set(0.05, 0.32, 0.30); tail2.rotation.z = -0.4;
    this.spine.add(scarf, knot, tail1, tail2);
    // fluffy tail with spring
    this.tail = new THREE.Mesh(sph(0.15, 12, 10), M.cream);
    this.tail.position.set(0, -0.02, -0.34);
    this.hips.add(this.tail);
    this.tailSpring = new Spring(70, 6);

    // ── HEAD ──
    this.neck = new THREE.Group();
    this.neck.position.y = 0.52;
    this.spine.add(this.neck);
    this.headG = new THREE.Group();
    this.headG.position.y = 0.16;
    this.neck.add(this.headG);
    const skull = new THREE.Mesh(sph(0.295, 22, 18), M.fur);
    skull.scale.set(0.90, 1.02, 0.90);
    skull.position.y = 0.12;
    // wide cream muzzle mask (cheeks + upper lip)
    const muzzle = new THREE.Mesh(sph(0.185, 16, 12), M.cream);
    muzzle.scale.set(1.25, 0.72, 0.8);
    muzzle.position.set(0, 0.02, 0.20);
    const cheekL = new THREE.Mesh(sph(0.10, 12, 10), M.cream);
    cheekL.position.set(-0.20, 0.03, 0.16);
    const cheekR = cheekL.clone(); cheekR.position.x = 0.20;
    const nose = new THREE.Mesh(sph(0.048, 10, 8), M.nose);
    nose.scale.set(1.15, 0.85, 0.9);
    nose.position.set(0, 0.115, 0.315);
    // buck tooth
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.075, 0.028), M.white);
    tooth.position.set(0, -0.085, 0.295);
    // SMILE — thin curved arc, the cool factor
    this.smile = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.02, 6, 14, Math.PI*0.7), M.dark);
    this.smile.position.set(-0.055, -0.02, 0.30);
    this.smile.rotation.set(0.1, 0, -Math.PI/2 - 0.35);
    const smile2 = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.02, 6, 14, Math.PI*0.7), M.dark);
    smile2.position.set(0.055, -0.02, 0.30);
    smile2.rotation.set(0.1, 0, -Math.PI/2 + 0.35 - Math.PI*0.7 + Math.PI*0.7); smile2.rotation.z = -Math.PI/2 + 0.35;
    this.headG.add(skull, muzzle, cheekL, cheekR, nose, tooth, this.smile, smile2);

    // BIG oval vintage-cartoon eyes
    this.eyes = [];
    for (const s of [-1, 1]){
      const eyeG = new THREE.Group();
      eyeG.position.set(0.145*s, 0.235, 0.205);
      const white = new THREE.Mesh(sph(0.105, 16, 12), M.white);
      white.scale.set(0.82, 1.35, 0.5);
      white.rotation.z = -s*0.12;
      const pupil = new THREE.Mesh(sph(0.052, 12, 10), M.dark);
      pupil.scale.set(0.85, 1.3, 0.45);
      pupil.position.set(0, 0, 0.062);
      const shine = new THREE.Mesh(sph(0.018, 8, 6), M.white);
      shine.position.set(0.02*s, 0.045, 0.085);
      eyeG.add(white, pupil, shine);
      this.headG.add(eyeG);
      this.eyes.push({ g:eyeG, white, pupil, shine });
    }
    // floating expressive brows
    this.brows = [];
    for (const s of [-1, 1]){
      const b = new THREE.Mesh(cap(0.018, 0.08, 3, 6), M.dark);
      b.position.set(0.148*s, 0.345, 0.235);
      b.rotation.z = Math.PI/2 + s*0.3;
      this.headG.add(b);
      this.brows.push(b);
    }

    // ── EARS: single long BENDY ribbons (spring-curvature driven) ──
    this.ears = [];
    for (const s of [-1, 1]){
      const be = new BendyEar(M.fur, M.rose);
      const base = be.group;
      base.position.set(0.10*s, 0.36, -0.03);
      this.headG.add(base);
      this.ears.push({ base, be,
        p1:new Spring(64, 7.0), p2:new Spring(40, 5.2), p3:new Spring(26, 4.0),
        r1:new Spring(70, 8.0), wob:0, side:s });
      be.bend(0, 0, 0, 0, 0);
    }

    // ── ARMS: shoulder → elbow lag → mitten hand ──
    this.arms = [];
    for (const s of [-1, 1]){
      const sh = new THREE.Group();
      sh.position.set(0.27*s, 0.40, 0.03);
      const upper = new THREE.Mesh(cap(0.062, 0.20, 5, 8), M.fur);
      upper.position.y = -0.13;
      sh.add(upper);
      const el = new THREE.Group(); el.position.y = -0.27; sh.add(el);
      const fore = new THREE.Mesh(cap(0.055, 0.17, 5, 8), M.fur);
      fore.position.y = -0.11;
      const hand = new THREE.Mesh(sph(0.095, 12, 10), M.cream);
      hand.scale.set(0.85, 1.1, 0.9);
      hand.position.y = -0.26;
      // thumb nub
      const th = new THREE.Mesh(sph(0.035, 8, 6), M.cream);
      th.position.set(0.05*s, -0.23, 0.05);
      el.add(fore, hand, th);
      this.spine.add(sh);
      this.arms.push({ sh, el, side:s, lag:new Spring(80, 9) });
    }

    // ── LEGS: hip → knee → big floppy foot ──
    this.legs = [];
    for (const s of [-1, 1]){
      const hip = new THREE.Group();
      hip.position.set(0.16*s, -0.06, 0);
      const thigh = new THREE.Mesh(cap(0.085, 0.16, 5, 8), M.fur);
      thigh.position.y = -0.10;
      hip.add(thigh);
      const knee = new THREE.Group(); knee.position.y = -0.22; hip.add(knee);
      const shin = new THREE.Mesh(cap(0.06, 0.13, 5, 8), M.fur);
      shin.position.y = -0.08;
      const foot = new THREE.Mesh(sph(0.13, 14, 10), M.cream);
      foot.scale.set(0.85, 0.5, 2.3);
      foot.position.set(0, -0.175, 0.11);
      knee.add(shin, foot);
      this.hips.add(hip);
      this.legs.push({ hip, knee, foot, side:s });
    }

    // ── SPIN TORNADO smear ──
    const tornGeo = new THREE.CylinderGeometry(0.72, 0.40, 1.45, 14, 1, true);
    this.tornado = new THREE.Mesh(tornGeo, new THREE.MeshBasicMaterial({
      color:0xffe8c0, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false }));
    this.tornado.position.y = 0.05;
    this.hips.add(this.tornado);

    this.root.traverse(o=>{ if (o.isMesh){ o.castShadow = true; } });

    // anim state
    this.t = 0; this.runPhase = 0;
    this.blinkT = 2.4; this.blink = 0;
    this.squash = new Spring(170, 15);
    this.spineLean = new Spring(58, 8.5);
    this.spineTwist = new Spring(70, 9);
    this.headLag = new Spring(50, 7);
    this.headPitch = new Spring(70, 9);
    this.spinAngle = 0;
    this.expression = 'neutral'; this.exprT = 0;
    this.idleFlick = 3;
    this._prevVy = 0; this._prevVX = 0; this._prevVZ = 0;
  }

  setExpression(e, dur=1.2){ this.expression = e; this.exprT = dur; }

  update(ctx){
    const dt = Math.min(ctx.dt, 0.05);
    this.t += dt;
    const S = ctx.state;
    const speedK = Math.min(1, ctx.speed / 9.2);

    // acceleration estimate (drives all the lag springs)
    const ax = (ctx.vx ?? 0) - this._prevVX;
    const az = (ctx.vz ?? 0) - this._prevVZ;
    const ay = (ctx.vy ?? 0) - this._prevVy;
    this._prevVX = ctx.vx ?? 0; this._prevVZ = ctx.vz ?? 0; this._prevVy = ctx.vy ?? 0;
    const accY = THREE.MathUtils.clamp(ay/Math.max(dt,1e-4)*0.004, -1.6, 1.6);

    // ── locomotion phase ──
    if (ctx.grounded && ctx.speed > 0.4) this.runPhase += dt * (7 + speedK*14);
    const ph = this.runPhase;

    // targets per state
    let hipY = 0.58, leanF = 0, twist = 0, headP = 0;
    let legAmp = 1.0*speedK, armAmp = 0.8*speedK;
    let earSweep = 0.24, earSpread = 0.16; this._earBias = 0;
    let pose = {};

    switch (S){
      case 'run': {
        const bounce = Math.abs(Math.sin(ph))*0.075*speedK;
        hipY = 0.58 + bounce;
        leanF = 0.16 + speedK*0.30;
        earSweep = 0.28 + speedK*0.42;
        headP = -0.08;
        break;
      }
      case 'idle': {
        hipY = 0.58 + Math.sin(this.t*2.4)*0.012;
        leanF = 0.03;
        earSweep = 0.24 + Math.sin(this.t*1.2)*0.05;
        headP = Math.sin(this.t*0.8)*0.04;
        // weight shift
        twist = Math.sin(this.t*0.55)*0.05;
        this.idleFlick -= dt;
        if (this.idleFlick <= 0){
          this.idleFlick = 2.5 + Math.random()*3.5;
          const e = this.ears[Math.random()<0.5?0:1];
          e.p2.v -= 4.5; e.p3.v -= 6;
        }
        break;
      }
      case 'jump':
        legAmp = 0; armAmp = 0;
        pose = { l0:-1.0, r0:-0.45, k0:1.5, k1:1.1, aL:2.6, aR:2.6, elbow:0.5 };
        leanF = -0.10; earSweep = 0.45; headP = -0.12;
        break;
      case 'fall':
        pose = { l0:0.55, r0:0.85, k0:0.6, k1:0.9, aL:2.9, aR:2.9, elbow:0.9 };
        leanF = 0.06; earSweep = 0.75; headP = 0.1;
        break;
      case 'spin':
        this.spinAngle += dt * 36;
        pose = { l0:0.3, r0:-0.3, k0:0.3, k1:0.3, aL:1.57, aR:1.57, elbow:0.15 };
        earSweep = 0.35; earSpread = 0.85;
        break;
      case 'slide':
        pose = { l0:1.35, r0:1.5, k0:0.4, k1:0.25, aL:-0.7, aR:-0.9, elbow:0.3 };
        hipY = 0.40; leanF = 0.85; earSweep = 0.9; headP = -0.42;
        break;
      case 'slam':
        pose = { l0:-1.3, r0:-1.3, k0:1.9, k1:1.9, aL:0.5, aR:0.5, elbow:1.2 };
        leanF = -0.3; earSweep = 1.0; headP = 0.3;
        break;
      case 'hurt':
        pose = { l0:0.7, r0:0.5, k0:0.8, k1:0.7, aL:2.2, aR:1.9, elbow:1.0 };
        leanF = -0.4; earSweep = 0.9; headP = 0.35;
        break;
      case 'dead':
        pose = { l0:1.2, r0:0.9, k0:0.5, k1:0.6, aL:2.7, aR:2.9, elbow:0.4 };
        leanF = 0.4; earSweep = 1.1;
        break;
      case 'win': {
        const w = Math.sin(this.t*9);
        pose = { l0:w*0.5, r0:-w*0.5, k0:0.4, k1:0.4, aL:2.9+w*0.25, aR:2.9-w*0.25, elbow:0.3 };
        hipY = 0.58 + Math.abs(w)*0.16; leanF = -0.06; earSweep = 0.15;
        break;
      }
    }
    if (S !== 'spin') this.spinAngle *= Math.max(0, 1 - dt*15);

    // ── apply pose with per-part smoothing ──
    const L = this.legs, A = this.arms;
    const lp = (cur, tgt, k)=> cur + (tgt-cur)*Math.min(1, k*dt*10);
    if (S === 'run'){
      // big rubber scissor legs + knee bend + floppy feet
      L[0].hip.rotation.x = lp(L[0].hip.rotation.x, Math.sin(ph)*legAmp, 1);
      L[1].hip.rotation.x = lp(L[1].hip.rotation.x, Math.sin(ph+Math.PI)*legAmp, 1);
      L[0].knee.rotation.x = lp(L[0].knee.rotation.x, Math.max(0, -Math.sin(ph-0.6))*1.6*speedK+0.1, 1);
      L[1].knee.rotation.x = lp(L[1].knee.rotation.x, Math.max(0, -Math.sin(ph+Math.PI-0.6))*1.6*speedK+0.1, 1);
      L[0].foot.rotation.x = Math.sin(ph-1.2)*0.5*speedK;
      L[1].foot.rotation.x = Math.sin(ph+Math.PI-1.2)*0.5*speedK;
      A[0].sh.rotation.x = lp(A[0].sh.rotation.x, Math.sin(ph+Math.PI)*armAmp + 0.2, 1);
      A[1].sh.rotation.x = lp(A[1].sh.rotation.x, Math.sin(ph)*armAmp + 0.2, 1);
      A[0].el.rotation.x = -0.5 - Math.max(0, Math.sin(ph+Math.PI-0.9))*0.9*speedK;
      A[1].el.rotation.x = -0.5 - Math.max(0, Math.sin(ph-0.9))*0.9*speedK;
      A[0].sh.rotation.z = lp(A[0].sh.rotation.z,  0.14, 1);
      A[1].sh.rotation.z = lp(A[1].sh.rotation.z, -0.14, 1);
    } else {
      const P = { l0:0, r0:0, k0:0.12, k1:0.12, aL:0.12, aR:-0.12, elbow:0.35, ...pose };
      L[0].hip.rotation.x = lp(L[0].hip.rotation.x, P.l0, 0.8);
      L[1].hip.rotation.x = lp(L[1].hip.rotation.x, P.r0, 0.8);
      L[0].knee.rotation.x = lp(L[0].knee.rotation.x, P.k0, 0.8);
      L[1].knee.rotation.x = lp(L[1].knee.rotation.x, P.k1, 0.8);
      L[0].foot.rotation.x = lp(L[0].foot.rotation.x, -P.l0*0.4 - P.k0*0.3, 0.7);
      L[1].foot.rotation.x = lp(L[1].foot.rotation.x, -P.r0*0.4 - P.k1*0.3, 0.7);
      A[0].sh.rotation.x = lp(A[0].sh.rotation.x, P.aL, 0.8);
      A[1].sh.rotation.x = lp(A[1].sh.rotation.x, P.aR, 0.8);
      A[0].el.rotation.x = lp(A[0].el.rotation.x, -P.elbow, 0.8);
      A[1].el.rotation.x = lp(A[1].el.rotation.x, -P.elbow, 0.8);
      A[0].sh.rotation.z = lp(A[0].sh.rotation.z,  0.22 + (S==='spin'?1.15:0), 0.8);
      A[1].sh.rotation.z = lp(A[1].sh.rotation.z, -0.22 - (S==='spin'?1.15:0), 0.8);
    }

    // ── spine / head lag (rubber spine!) ──
    this.spineLean.target = leanF + THREE.MathUtils.clamp(-az*0.006, -0.25, 0.25)*(ctx.facingSign ?? 1);
    this.spineTwist.target = twist - ctx.moveX*0.22;
    this.spine.rotation.x = this.spineLean.update(dt);
    this.spine.rotation.z = this.spineTwist.update(dt);
    this.hips.position.y = hipY;
    this.hips.rotation.z = -ctx.moveX*0.10;
    this.headLag.target = -leanF*0.5;
    this.headPitch.target = headP;
    this.neck.rotation.x = this.headLag.update(dt) + this.headPitch.update(dt)*0.5;
    this.neck.rotation.z = -this.spineTwist.x*0.6;
    this.neck.rotation.y = lp(this.neck.rotation.y, ctx.moveX*0.3, 0.4);

    // spin tornado
    this.squashNode.rotation.y = this.spinAngle;
    const torn = S === 'spin' ? 1 : 0;
    this.tornado.material.opacity += ((torn?0.36:0) - this.tornado.material.opacity)*Math.min(1, dt*20);
    if (this.tornado.material.opacity > 0.01){
      this.tornado.rotation.y = -this.spinAngle*1.5;
      this.tornado.scale.y = 0.95 + Math.sin(this.t*32)*0.05;
    }

    // ── squash & stretch ──
    const sq = this.squash.update(dt);
    const sxz = 1 - sq*0.5, sy = 1 + sq;
    this.squashNode.scale.set(sxz, sy, sxz);

    // ── EARS: smooth bendy whip ──
    for (const e of this.ears){
      e.r1.target = e.side*earSpread;
      e.p1.target = -earSweep*0.55;
      e.p2.target = -earSweep*0.35;
      e.p3.target = -earSweep*0.25;
      const bz = e.p1.update(dt, -accY*1.1);
      const mz = e.p2.update(dt, -accY*2.4);
      const tz = e.p3.update(dt, -accY*3.6);
      e.base.rotation.z = -(e.r1.update(dt)) + (e.side<0 ? -0.06 : 0.10);
      // lateral run wobble (tip trails the head)
      const wobT = (S === 'run') ? Math.sin(ph - 1.1)*0.35*speedK : 0;
      e.wob += (wobT - e.wob)*Math.min(1, dt*8);
      e.be.bend(-bz, -mz, -tz, e.wob*0.4, e.wob*0.6);
    }

    // ── tail spring ──
    this.tailSpring.target = 0;
    const tw = this.tailSpring.update(dt, accY*4 + (S==='run'? Math.sin(ph*2)*0.8 : 0));
    this.tail.position.y = -0.02 + tw*0.04;
    this.tail.scale.setScalar(1 + Math.abs(tw)*0.15);

    // ── FACE ──
    this.blinkT -= dt;
    if (this.blinkT <= 0){ this.blink = 1; this.blinkT = 2.2 + Math.random()*3.4; }
    this.blink = Math.max(0, this.blink - dt*8);
    const lid = 1 - Math.sin(Math.min(1,this.blink)*Math.PI)*0.88;
    for (const e of this.eyes){
      e.white.scale.y = 1.35*lid;
      e.pupil.scale.y = 1.3*lid;
      e.pupil.position.x = ctx.moveX*0.025;
      e.pupil.position.y = S==='fall' ? -0.018 : 0.008;
    }
    if (this.exprT > 0) this.exprT -= dt; else this.expression = 'neutral';
    const browA = { neutral:0.3, happy:0.05, scared:0.85, determined:-0.4, dizzy:0.3 }[this.expression] ?? 0.3;
    const browY = { scared:0.395, happy:0.375 }[this.expression] ?? 0.36;
    this.brows[0].rotation.z =  Math.PI/2 + browA; this.brows[0].position.y = browY;
    this.brows[1].rotation.z =  Math.PI/2 - browA; this.brows[1].position.y = browY;
    // smile widens when happy, vanishes when scared
    const sm = { happy:1.25, scared:0.5, determined:0.85 }[this.expression] ?? 1;
    this.smile.scale.setScalar(sm);
  }

  // ── gameplay impulses ──
  onJump(){
    this.squash.x = 0.5;
    for (const e of this.ears){ e.p2.v -= 6; e.p3.v -= 9; }
    this.setExpression('determined', 0.6);
  }
  onLand(hard){
    this.squash.x = -0.32 - hard*0.3;
    for (const e of this.ears){ e.p1.v += 3+hard*4; e.p2.v += 5+hard*7; e.p3.v += 7+hard*9; }
    if (hard > 0.6) this.setExpression('scared', 0.3);
  }
  onDoubleJump(){
    this.squash.x = 0.55;
    for (const e of this.ears){ e.p1.v -= 3; e.p3.v -= 11; }
    this.setExpression('happy', 0.8);
  }
  onHurt(){
    this.squash.x = -0.5;
    this.setExpression('scared', 1.4);
    for (const e of this.ears){ e.p2.v += 9; e.p3.v += 11; }
  }
  onSpin(){ for (const e of this.ears){ e.r1.v += e.side*7; } }
  onWin(){ this.setExpression('happy', 99); }
}
