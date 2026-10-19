// ═══ RABBIT — fully procedural cartoon rabbit: rig, springs, expressions ═══
import * as THREE from 'three';

const FUR   = 0xd9985a;   // caramel
const CREAM = 0xfff3dd;
const PINK  = 0xff9db4;
const TEAL  = 0x2ec4b6;
const DARK  = 0x2b1a12;

function mat(color, rough=0.62, extra={}){ return new THREE.MeshStandardMaterial({ color, roughness:rough, metalness:0, ...extra }); }
function sph(r, w=20, h=16){ return new THREE.SphereGeometry(r, w, h); }

// spring helper
class Spring {
  constructor(stiff=90, damp=10){ this.x=0; this.v=0; this.k=stiff; this.d=damp; this.target=0; }
  update(dt, force=0){
    this.v += ((this.target - this.x)*this.k + force)*dt;
    this.v *= Math.exp(-this.d*dt);
    this.x += this.v*dt;
    return this.x;
  }
}

export class Rabbit {
  constructor(scene){
    this.root = new THREE.Group();          // at ground origin
    this.squashNode = new THREE.Group();    // squash & stretch applied here
    this.root.add(this.squashNode);
    this.rig = new THREE.Group();           // pose rig (lean, tilt)
    this.rig.position.y = 0.70;             // hip height
    this.squashNode.add(this.rig);
    scene.add(this.root);

    const M = { fur:mat(FUR), cream:mat(CREAM,0.7), pink:mat(PINK,0.55), teal:mat(TEAL,0.5),
      dark:mat(DARK,0.4), white:mat(0xffffff,0.25), nose:mat(0xff7d9c,0.4) };

    // ── BODY ──
    this.body = new THREE.Mesh(sph(0.46), M.fur);
    this.body.scale.set(0.94, 1.06, 0.86);
    this.body.position.y = 0.08;
    this.belly = new THREE.Mesh(sph(0.37), M.cream);
    this.belly.scale.set(0.78, 0.95, 0.6);
    this.belly.position.set(0, 0.02, 0.16);
    // neckerchief
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.10, 10, 24), M.teal);
    scarf.rotation.x = Math.PI/2 - 0.25; scarf.position.set(0, 0.44, 0.02);
    const knot = new THREE.Mesh(sph(0.11,12,10), M.teal);
    knot.position.set(0, 0.36, 0.35);
    // tail
    this.tail = new THREE.Mesh(sph(0.17,14,12), M.cream);
    this.tail.position.set(0, -0.05, -0.42);

    // ── HEAD ──
    this.headG = new THREE.Group();
    this.headG.position.set(0, 0.78, 0.05);
    const head = new THREE.Mesh(sph(0.40, 24, 20), M.fur);
    head.scale.set(0.98, 0.94, 0.95);
    const muzzle = new THREE.Mesh(sph(0.20, 18, 14), M.cream);
    muzzle.scale.set(1.15, 0.72, 0.9); muzzle.position.set(0, -0.12, 0.30);
    const nose = new THREE.Mesh(sph(0.055, 10, 8), M.nose);
    nose.position.set(0, -0.045, 0.485);
    // buck teeth
    const toothGeo = new THREE.BoxGeometry(0.055, 0.09, 0.03);
    const toothL = new THREE.Mesh(toothGeo, M.white); toothL.position.set(-0.032, -0.225, 0.42);
    const toothR = new THREE.Mesh(toothGeo, M.white); toothR.position.set(0.032, -0.225, 0.42);
    // cheeks
    const cheekGeo = sph(0.11, 12, 10);
    const cheekL = new THREE.Mesh(cheekGeo, M.cream); cheekL.position.set(-0.24, -0.10, 0.26);
    const cheekR = new THREE.Mesh(cheekGeo, M.cream); cheekR.position.set(0.24, -0.10, 0.26);
    this.headG.add(head, muzzle, nose, toothL, toothR, cheekL, cheekR);

    // eyes
    this.eyes = [];
    for (const s of [-1, 1]){
      const eyeG = new THREE.Group();
      eyeG.position.set(0.175*s, 0.10, 0.31);
      const white = new THREE.Mesh(sph(0.13, 16, 12), M.white);
      white.scale.set(1, 1.2, 0.62);
      const pupil = new THREE.Mesh(sph(0.062, 12, 10), M.dark);
      pupil.position.set(0, 0, 0.085); pupil.scale.set(1,1.15,0.5);
      const shine = new THREE.Mesh(sph(0.02, 8, 6), M.white);
      shine.position.set(0.022*s, 0.032, 0.105);
      // brow
      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.09, 3, 8), M.dark);
      brow.position.set(0.02*s, 0.155, 0.075); brow.rotation.z = Math.PI/2 + s*0.25;
      eyeG.add(white, pupil, shine, brow);
      this.headG.add(eyeG);
      this.eyes.push({ g:eyeG, white, pupil, brow, baseY:0.09 });
    }

    // ── EARS (spring-driven, the soul of the rabbit) ──
    this.ears = [];
    for (const s of [-1, 1]){
      const base = new THREE.Group();
      base.position.set(0.17*s, 0.30, -0.02);
      const mid = new THREE.Group(); mid.position.y = 0.02; base.add(mid);
      const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.44, 6, 12), M.fur);
      outer.position.y = 0.30; outer.scale.set(1, 1, 0.55);
      const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.34, 6, 10), M.pink);
      inner.position.set(0, 0.30, 0.05); inner.scale.set(1, 1, 0.4);
      const tip = new THREE.Group(); tip.position.y = 0.66; mid.add(tip);
      const tipM = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.2, 6, 10), M.fur);
      tipM.position.y = 0.12; tipM.scale.set(1,1,0.5);
      tip.add(tipM);
      mid.add(outer, inner);
      this.headG.add(base);
      this.ears.push({ base, mid, tip,
        sx:new Spring(70, 7.5), sz:new Spring(70, 7.5),   // base spring pitch/roll
        mx:new Spring(46, 6.0),                            // mid flop
        tx:new Spring(30, 4.5),                            // tip flop
        side:s });
    }

    // ── ARMS ──
    this.arms = [];
    for (const s of [-1, 1]){
      const sh = new THREE.Group();
      sh.position.set(0.45*s, 0.30, 0.06);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.26, 6, 10), M.fur);
      arm.position.y = -0.18;
      const hand = new THREE.Mesh(sph(0.10, 12, 10), M.cream);
      hand.position.y = -0.36;
      sh.add(arm, hand);
      this.rig.add(sh);
      this.arms.push(sh);
    }

    // ── LEGS / BIG FEET ──
    this.legs = [];
    for (const s of [-1, 1]){
      const hip = new THREE.Group();
      hip.position.set(0.20*s, -0.28, 0);
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.20, 6, 10), M.fur);
      leg.position.y = -0.14;
      const foot = new THREE.Mesh(sph(0.17, 14, 12), M.cream);
      foot.scale.set(0.95, 0.6, 2.2);
      foot.position.set(0, -0.30, 0.13);
      hip.add(leg, foot);
      this.rig.add(hip);
      this.legs.push(hip);
    }

    this.rig.add(this.body, this.belly, scarf, knot, this.tail, this.headG);

    // ── SPIN TORNADO (the signature smear) ──
    const tornGeo = new THREE.CylinderGeometry(0.78, 0.42, 1.5, 14, 1, true);
    this.tornado = new THREE.Mesh(tornGeo, new THREE.MeshBasicMaterial({
      color:0xffe8c0, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false }));
    this.tornado.position.y = 0.1;
    this.rig.add(this.tornado);

    // shadows
    this.root.traverse(o=>{ if (o.isMesh){ o.castShadow = true; o.receiveShadow = false; } });

    // ── animation state ──
    this.t = 0; this.runPhase = 0;
    this.blinkT = 2; this.blink = 0;
    this.squash = new Spring(160, 14); this.squash.target = 0;
    this.lean = new Spring(60, 9);
    this.tiltZ = new Spring(60, 9);
    this.headPitch = new Spring(80, 10);
    this.spinAngle = 0;
    this.expression = 'neutral'; // neutral | happy | scared | dizzy | determined
    this.exprT = 0;
    this._v = new THREE.Vector3(); this._prevVel = new THREE.Vector3();
  }

  setExpression(e, dur=1.2){ this.expression = e; this.exprT = dur; }

  // ctx: { dt, speed, maxSpeed, grounded, vy, state, spinT, moveX (strafe), sliding, slamming, dead, carrying }
  update(ctx){
    const dt = Math.min(ctx.dt, 0.05);
    this.t += dt;
    const S = ctx.state;
    const speedK = Math.min(1, ctx.speed / 9);

    // ── locomotion phase ──
    if (ctx.grounded && ctx.speed > 0.4) this.runPhase += dt * (6 + speedK*13);
    const ph = this.runPhase;
    const legAmp = 0.9 * speedK, armAmp = 0.7 * speedK;

    // defaults
    let legL = 0, legR = 0, armL = 0.12, armR = -0.12, bodyY = 0, bodyPitch = 0, headP = 0;
    let earBack = 0, earSpread = 0.22;

    switch (S){
      case 'run':
        legL = Math.sin(ph)*legAmp; legR = Math.sin(ph+Math.PI)*legAmp;
        armL = Math.sin(ph+Math.PI)*armAmp + 0.15; armR = Math.sin(ph)*armAmp - 0.15;
        bodyY = Math.abs(Math.sin(ph))*0.09*speedK;
        bodyPitch = 0.14 + speedK*0.22;
        earBack = 0.22 + speedK*0.34;
        headP = -0.1;
        break;
      case 'idle': {
        const b = Math.sin(this.t*2.2)*0.02;
        bodyY = b; bodyPitch = 0.02;
        earBack = 0.10 + Math.sin(this.t*1.3)*0.04;
        // occasional ear twitch
        if (Math.sin(this.t*0.7) > 0.995) this.ears[1].mx.v -= 3.5;
        headP = Math.sin(this.t*0.9)*0.05;
        break;
      }
      case 'jump':
        legL = -0.9; legR = -0.5; armL = 2.4; armR = 2.4;
        bodyPitch = -0.12; earBack = 0.42; headP = -0.15;
        break;
      case 'fall':
        legL = 0.5; legR = 0.8; armL = 2.9; armR = 2.9;
        bodyPitch = 0.1; earBack = 0.62; headP = 0.12;
        break;
      case 'spin': {
        this.spinAngle += dt * 34;
        armL = 1.57; armR = 1.57;
        legL = 0.25; legR = -0.25;
        earBack = 0.3; earSpread = 0.75;
        bodyPitch = 0.05;
        break;
      }
      case 'slide':
        legL = 1.2; legR = 1.45; armL = -0.8; armR = -0.8;
        bodyPitch = 0.9; bodyY = -0.22; earBack = 0.85; headP = -0.5;
        break;
      case 'slam':
        legL = -1.2; legR = -1.2; armL = 0.6; armR = 0.6;
        bodyPitch = -0.35; earBack = 0.9; headP = 0.3;
        break;
      case 'hurt':
        bodyPitch = -0.3; armL = 1.8; armR = 1.8; legL = 0.6; legR = 0.6;
        earBack = 0.8; headP = 0.4;
        break;
      case 'dead':
        legL = 1.2; legR = 1.0; armL = 2.6; armR = 2.8; bodyPitch = 0.4; earBack = 1.0;
        break;
      case 'win': {
        const w = Math.sin(this.t*8);
        legL = w*0.6; legR = -w*0.6; armL = 2.8 + w*0.3; armR = 2.8 - w*0.3;
        bodyY = Math.abs(w)*0.15; earBack = 0.2; headP = -0.2;
        break;
      }
    }
    if (S !== 'spin') this.spinAngle *= Math.max(0, 1 - dt*14);
    // tornado smear
    const torn = S === 'spin' ? 1 : 0;
    this.tornado.material.opacity += ((torn?0.38:0) - this.tornado.material.opacity)*Math.min(1, dt*18);
    if (this.tornado.material.opacity > 0.01){
      this.tornado.rotation.y = -this.spinAngle*1.4;
      this.tornado.scale.y = 0.9 + Math.sin(this.t*30)*0.06;
    }

    // ── apply pose with smoothing springs ──
    const lerp = (cur, tgt, k)=> cur + (tgt-cur)*Math.min(1, k*dt*60/6);
    const L = this.legs, A = this.arms;
    L[0].rotation.x = lerp(L[0].rotation.x, legL, 0.35);
    L[1].rotation.x = lerp(L[1].rotation.x, legR, 0.35);
    A[0].rotation.x = lerp(A[0].rotation.x, armL, 0.3);
    A[1].rotation.x = lerp(A[1].rotation.x, armR, 0.3);
    A[0].rotation.z = lerp(A[0].rotation.z,  0.18 + (S==='spin'?1.2:0), 0.3);
    A[1].rotation.z = lerp(A[1].rotation.z, -0.18 - (S==='spin'?1.2:0), 0.3);
    this.rig.position.y = 0.70 + bodyY;
    this.body.rotation.x = lerp(this.body.rotation.x, bodyPitch, 0.25);

    // lean into acceleration & strafe tilt
    this.lean.target = bodyPitch*0.55;
    this.tiltZ.target = -ctx.moveX * 0.16;
    this.rig.rotation.x = this.lean.update(dt);
    this.rig.rotation.z = this.tiltZ.update(dt);
    this.headPitch.target = headP;
    this.headG.rotation.x = this.headPitch.update(dt);
    // head looks slightly toward travel
    this.headG.rotation.y = lerp(this.headG.rotation.y, ctx.moveX*0.25, 0.1);

    // spin: rotate whole squash node
    this.squashNode.rotation.y = this.spinAngle;

    // ── squash & stretch ──
    const sq = this.squash.update(dt);
    const sxz = 1 - sq*0.55, sy = 1 + sq;
    this.squashNode.scale.set(sxz, sy, sxz);

    // ── ears: physics driven by acceleration ──
    const accelY = (ctx.vy - this._prevVel.y)/Math.max(dt,1e-4);
    this._prevVel.set(0, ctx.vy, 0);
    for (const e of this.ears){
      e.sz.target = -earBack;                                   // sweep back
      e.sx.target = e.side*earSpread;
      const bz = e.sz.update(dt, -THREE.MathUtils.clamp(accelY*0.004, -1.4, 1.4));
      const bx = e.sx.update(dt);
      e.base.rotation.x = bz; e.base.rotation.z = bx;
      const m = e.mx.update(dt, -THREE.MathUtils.clamp(accelY*0.010, -6, 6));
      e.mid.rotation.x = m*0.5;
      const tp = e.tx.update(dt, -THREE.MathUtils.clamp(accelY*0.020, -9, 9));
      e.tip.rotation.x = tp*0.5;
    }

    // ── face ──
    this.blinkT -= dt;
    if (this.blinkT <= 0){ this.blink = 1; this.blinkT = 2 + Math.random()*3.2; }
    this.blink = Math.max(0, this.blink - dt*7);
    const lid = 1 - Math.sin(Math.min(1,this.blink)*Math.PI)*0.85;
    for (const e of this.eyes){
      e.white.scale.y = 1.18*lid; e.pupil.scale.y = 1.15*lid;
      // pupil tracking: look toward move direction
      e.pupil.position.x = ctx.moveX*0.03;
      e.pupil.position.y = S==='fall' ? -0.02 : 0.01;
    }
    if (this.exprT > 0) this.exprT -= dt; else this.expression = 'neutral';
    const browRot = { neutral:0.25, happy:0.1, scared:0.7, determined:-0.35, dizzy:0.25 }[this.expression] ?? 0.25;
    const pupScale = { scared:1.5, dizzy:0.7 }[this.expression] ?? 1;
    this.eyes[0].brow.rotation.z =  Math.PI/2 + browRot;
    this.eyes[1].brow.rotation.z =  Math.PI/2 - browRot;
    for (const e of this.eyes){ e.pupil.scale.x = pupScale; e.pupil.scale.z = 0.5*pupScale; }

    // tail wag
    this.tail.position.y = -0.05 + Math.sin(this.t*(ctx.speed>1?10:3))*0.02*Math.max(0.3,speedK);
  }

  // gameplay-driven impulses
  onJump(){ this.squash.x = 0.42; for (const e of this.ears){ e.mx.v -= 5; e.tx.v -= 7; } this.setExpression('determined', 0.6); }
  onLand(hard){ this.squash.x = -0.3 - hard*0.28; for (const e of this.ears){ e.mx.v += 4+hard*5; e.tx.v += 5+hard*6; } if (hard>0.6) this.setExpression('scared', 0.3); }
  onDoubleJump(){ this.squash.x = 0.5; for (const e of this.ears){ e.sz.v -= 3; e.tx.v -= 9; } this.setExpression('happy', 0.7); }
  onHurt(){ this.squash.x = -0.45; this.setExpression('scared', 1.4); for (const e of this.ears){ e.mx.v += 8; } }
  onSpin(){ for (const e of this.ears){ e.sx.v += e.side*6; } }
  onWin(){ this.setExpression('happy', 99); }
}
