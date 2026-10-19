// ═══ ENEMIES — readable platforming obstacles with personality ═══
import * as THREE from 'three';
import { audio } from '../core/Audio.js';

function std(c, r=0.7, e={}){ return new THREE.MeshStandardMaterial({ color:c, roughness:r, ...e }); }

// ── Snarlrat: chubby patrol critter ──
function buildSnarlrat(){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14), std(0x9a6fb8));
  body.scale.set(1.15, 0.9, 1.3);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), std(0xd8bfe8));
  belly.scale.set(0.9, 0.75, 0.9); belly.position.set(0, -0.08, 0.14);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 10), std(0xd8bfe8));
  snout.rotation.x = Math.PI/2; snout.position.set(0, 0.02, 0.55);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), std(0x402040, 0.4));
  nose.position.set(0, 0.02, 0.76);
  const earG = new THREE.ConeGeometry(0.12, 0.3, 8);
  const eL = new THREE.Mesh(earG, std(0x9a6fb8)); eL.position.set(-0.2, 0.42, -0.1);
  const eR = new THREE.Mesh(earG, std(0x9a6fb8)); eR.position.set(0.2, 0.42, -0.1);
  const eyeG = new THREE.SphereGeometry(0.09, 10, 8);
  const eyeM = std(0xffffff, 0.3);
  const pupM = std(0x201020, 0.3);
  const yL = new THREE.Mesh(eyeG, eyeM); yL.position.set(-0.18, 0.18, 0.4);
  const yR = new THREE.Mesh(eyeG, eyeM); yR.position.set(0.18, 0.18, 0.4);
  const pL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), pupM); pL.position.set(-0.18, 0.18, 0.47);
  const pR = pL.clone(); pR.position.x = 0.18;
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.4, 4, 8), std(0xd8bfe8));
  tail.position.set(0, 0.05, -0.6); tail.rotation.x = 1.1;
  const feet = [];
  for (const s of [-1,1]) for (const f of [-1,1]){
    const ft = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), std(0x6a4a88));
    ft.position.set(0.25*s, -0.34, 0.22*f); g.add(ft); feet.push(ft);
  }
  g.add(body, belly, snout, nose, eL, eR, yL, yR, pL, pR, tail);
  g.userData = { body, feet, tail };
  return g;
}
// ── Spikeback: armored — only slam kills ──
function buildSpikeback(){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), std(0x4a6a8a));
  body.scale.set(1.1, 0.75, 1.3);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), std(0xc8d8e8));
  face.position.set(0, -0.05, 0.5);
  const spikeM = std(0xe8e8f0, 0.35);
  for (let i=0;i<9;i++){
    const a = (i/9)*Math.PI - Math.PI/2;
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 6), spikeM);
    sp.position.set(Math.sin(a)*0.3, 0.28 + Math.cos(a)*0.16, -0.1 + (i%3)*0.16 - 0.16);
    sp.rotation.x = -0.3 + Math.cos(a)*0.4;
    sp.rotation.z = -Math.sin(a)*0.7;
    g.add(sp);
  }
  const eyeM = std(0xffe45e, 0.3);
  const yL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeM); yL.position.set(-0.12, 0.12, 0.68);
  const yR = yL.clone(); yR.position.x = 0.12;
  g.add(body, face, yL, yR);
  g.userData = { body };
  return g;
}
// ── Darterfly: hovering bounce target ──
function buildDarterfly(){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.3, 6, 10), std(0x58c8e8));
  body.rotation.x = 0.4;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), std(0x88e0f8));
  head.position.set(0, 0.24, 0.12);
  const eyeM = std(0x201020, 0.3);
  const yL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeM); yL.position.set(-0.08, 0.3, 0.2);
  const yR = yL.clone(); yR.position.x = 0.08;
  const wingM = new THREE.MeshBasicMaterial({ color:0xc8f4ff, transparent:true, opacity:0.65, side:THREE.DoubleSide });
  const wG = new THREE.CircleGeometry(0.28, 12);
  const wL = new THREE.Mesh(wG, wingM); wL.position.set(-0.22, 0.18, -0.05); wL.scale.y = 0.6;
  const wR = new THREE.Mesh(wG, wingM); wR.position.set(0.22, 0.18, -0.05); wR.scale.y = 0.6;
  g.add(body, head, yL, yR, wL, wR);
  g.userData = { body, wL, wR };
  return g;
}
// ── Spitterplant: lobs seeds; reflectable ──
function buildSpitter(){
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.8, 8), std(0x3f8a3a));
  stem.position.y = 0.4;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 12), std(0xe85a8a));
  head.position.y = 1.0; head.scale.set(1, 0.85, 1.1);
  const lips = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.09, 8, 16), std(0xb83a6a, 0.5));
  lips.position.set(0, 1.0, 0.38);
  const leafM = std(0x4ecb56);
  for (const s of [-1,1]){
    const lf = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.7, 6), leafM);
    lf.position.set(0.3*s, 0.25, 0); lf.rotation.z = s*1.1;
    g.add(lf);
  }
  const spotM = std(0xffe45e, 0.5);
  for (let i=0;i<5;i++){
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), spotM);
    sp.position.set(Math.sin(i*2.5)*0.28, 1.0+Math.cos(i*1.8)*0.2, Math.cos(i*2.5)*0.3);
    g.add(sp);
  }
  g.add(stem, head, lips);
  g.userData = { head, lips };
  return g;
}

// ── Charger: bull beetle — telegraphed straight-line charge, baitable ──
function buildCharger(){
  const g = new THREE.Group();
  const shellM = std(0x8a4a2a, 0.5);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), shellM);
  body.scale.set(1.2, 0.85, 1.45);
  const hornM = std(0xf0e0c8, 0.35);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.62, 8), hornM);
  horn.position.set(0, 0.22, 0.72); horn.rotation.x = 1.1;
  const horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 8), hornM);
  horn2.position.set(0, 0.34, 0.55); horn2.rotation.x = 0.8;
  const eyeM = std(0xffe45e, 0.3, { emissive:0x664400, emissiveIntensity:0.5 });
  const yL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeM); yL.position.set(-0.22, 0.12, 0.62);
  const yR = yL.clone(); yR.position.x = 0.22;
  const legM = std(0x4a2a1a, 0.7);
  const legs = [];
  for (const sd of [-1,1]) for (let i=0;i<3;i++){
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 4, 6), legM);
    leg.position.set(0.5*sd, -0.3, 0.3-i*0.3); leg.rotation.z = sd*0.7;
    g.add(leg); legs.push(leg);
  }
  g.add(body, horn, horn2, yL, yR);
  g.userData = { body, legs, horn };
  return g;
}
// ── Divebat: hangs, screeches, dive-bombs, returns ──
function buildDivebat(){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), std(0x5a3a8a));
  body.scale.set(1, 0.9, 1.1);
  const wingM = new THREE.MeshStandardMaterial({ color:0x3a2060, roughness:0.7, side:THREE.DoubleSide });
  const wL = new THREE.Mesh(new THREE.CircleGeometry(0.42, 10, 0, Math.PI), wingM);
  wL.position.set(-0.3, 0.1, 0); wL.rotation.x = -0.4;
  const wR = wL.clone(); wR.position.x = 0.3; wR.rotation.z = Math.PI;
  const earG = new THREE.ConeGeometry(0.07, 0.22, 6);
  const eL = new THREE.Mesh(earG, std(0x5a3a8a)); eL.position.set(-0.12, 0.28, 0);
  const eR = eL.clone(); eR.position.x = 0.12;
  const eyeM = std(0xff5a5e, 0.3, { emissive:0x8a1020, emissiveIntensity:0.7 });
  const yL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeM); yL.position.set(-0.1, 0.06, 0.26);
  const yR = yL.clone(); yR.position.x = 0.1;
  g.add(body, wL, wR, eL, eR, yL, yR);
  g.userData = { body, wL, wR };
  return g;
}

class Enemy {
  constructor(type, mesh, x, y, z, opts){
    this.type = type; this.mesh = mesh;
    this.home = new THREE.Vector3(x, y, z);
    this.mesh.position.copy(this.home);
    this.alive = true; this.t = Math.random()*10;
    this.patrol = opts.patrol ?? 3; this.speed = opts.speed ?? 1.6;
    this.dir = 1; this.axis = opts.axis ?? 'x';
    this.dead = 0;
    this.shootT = 2 + Math.random()*2;
  }
}

export class EnemySystem {
  constructor(scene, fx, events){
    this.scene = scene; this.fx = fx; this.ev = events;
    this.enemies = [];
    this.projectiles = [];
    this.projProto = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8),
      std(0x8aff5e, 0.3, { emissive:0x2a8a12, emissiveIntensity:0.6 }));
    this.projGlowProto = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8),
      std(0xffe45e, 0.25, { emissive:0xcf8a00, emissiveIntensity:0.9 }));
    this._v = new THREE.Vector3();
  }
  add(type, x, y, z, opts={}){
    const builders = { snarlrat:buildSnarlrat, spikeback:buildSpikeback, darterfly:buildDarterfly, spitter:buildSpitter,
      charger:buildCharger, divebat:buildDivebat };
    const mesh = builders[type]();
    mesh.traverse(o=>{ if (o.isMesh) o.castShadow = true; });
    this.scene.add(mesh);
    const e = new Enemy(type, mesh, x, y, z, opts);
    if (type === 'spitter') e.mesh.rotation.y = opts.face ?? 0;
    this.enemies.push(e);
    return e;
  }
  kill(e, cause='spin', player=null){
    if (!e.alive) return;
    e.alive = false; e.dead = 0.001;
    audio.enemyPop();
    const p = e.mesh.position;
    this.fx.starBurst(p, 12, 0xfff1a8);
    this.fx.dust(p, 8);
    this.ev.emit('enemyKilled', e, cause);
  }
  update(dt, t, player, game){
    const pp = player.pos;
    for (const e of this.enemies){
      const m = e.mesh;
      if (!e.alive){
        // cartoon death: spin up + shrink + pop
        e.dead += dt;
        m.rotation.y += dt*18;
        m.position.y += dt*5;
        const s = Math.max(0.01, 1 - e.dead*1.6);
        m.scale.setScalar(s);
        if (e.dead > 0.7){ m.visible = false; }
        continue;
      }
      e.t += dt;
      const dx = pp.x - m.position.x, dz = pp.z - m.position.z;
      const distXZ = Math.hypot(dx, dz);
      const dy = pp.y - m.position.y;
      switch (e.type){
        case 'snarlrat': {
          const a = e.axis;
          m.position[a] = e.home[a] + Math.sin(e.t*e.speed)*e.patrol;
          const dir = Math.cos(e.t*e.speed);
          m.rotation.y = (a==='x' ? Math.PI/2 : 0) + (dir > 0 ? 0 : Math.PI);
          const u = m.userData;
          u.body.position.y = Math.abs(Math.sin(e.t*9))*0.08;
          u.feet.forEach((f,i)=>{ f.position.y = -0.34 + Math.max(0, Math.sin(e.t*12 + i*1.7))*0.12; });
          u.tail.rotation.z = Math.sin(e.t*6)*0.3;
          break;
        }
        case 'spikeback': {
          const a = e.axis;
          m.position[a] = e.home[a] + Math.sin(e.t*e.speed*0.6)*e.patrol*0.6;
          const dir = Math.cos(e.t*e.speed*0.6);
          m.rotation.y = (a==='x' ? Math.PI/2 : 0) + (dir > 0 ? 0 : Math.PI);
          m.userData.body.position.y = Math.sin(e.t*4)*0.04;
          break;
        }
        case 'darterfly': {
          m.position.y = e.home.y + Math.sin(e.t*2.2)*0.5;
          m.position.x = e.home.x + Math.sin(e.t*0.9)*1.2;
          const u = m.userData;
          const f = Math.sin(t*30)*0.9;
          u.wL.rotation.y = f; u.wR.rotation.y = -f;
          u.body.rotation.z = Math.sin(e.t*2.2)*0.2;
          break;
        }
        case 'charger': {
          const u = m.userData;
          if (!e.mode) e.mode = 'graze';
          if (e.mode === 'graze'){
            m.position.x = e.home.x + Math.sin(e.t*0.7)*1.2;
            m.rotation.y = Math.sin(e.t*0.7) > 0 ? 0.9 : -0.9;
            u.legs.forEach((l,i)=> l.rotation.x = Math.sin(e.t*10+i)*0.4);
            if (distXZ < 6.5 && Math.abs(dy) < 2 && Math.abs(dx) > Math.abs(dz)*0.4 || distXZ < 2.2){
              e.mode = 'paw'; e.t2 = 0;
              e.chargeDir = Math.sign(dx) || 1;
            }
          } else if (e.mode === 'paw'){
            e.t2 = (e.t2||0) + dt;
            m.rotation.y = e.chargeDir > 0 ? Math.PI/2 : -Math.PI/2;
            u.legs[0].rotation.x = Math.sin(e.t*30)*0.8;   // pawing the dirt
            if (Math.random() < dt*8) this.fx.dust(m.position, 1, 0xcdb894);
            if (e.t2 > 0.7){ e.mode = 'charge'; }
          } else if (e.mode === 'charge'){
            m.position.x += e.chargeDir * 13 * dt;
            u.legs.forEach((l,i)=> l.rotation.x = Math.sin(e.t*26+i)*0.9);
            if (Math.random() < dt*20) this.fx.dust(m.position, 1, 0xcdb894);
            // stop at edges/walls or after 5m
            if (Math.abs(m.position.x - e.home.x) > 6.5 || m.position.x < e.home.x - 6.5){
              e.mode = 'stunned'; e.t2 = 0;
              this.fx.dust(m.position, 8); audio.enemyPop();
            }
          } else if (e.mode === 'stunned'){
            e.t2 = (e.t2||0) + dt;
            m.rotation.z = Math.sin(e.t*20)*0.08*(1-e.t2);
            if (e.t2 > 1.1){ e.mode = 'graze'; m.rotation.z = 0; }
          }
          break;
        }
        case 'divebat': {
          const u = m.userData;
          if (!e.mode) e.mode = 'hang';
          if (e.mode === 'hang'){
            m.position.y = e.home.y + Math.sin(e.t*2)*0.15;
            const f = Math.sin(t*16)*0.5;
            u.wL.rotation.y = f; u.wR.rotation.y = -f;
            if (distXZ < 5.5 && pp.y < e.home.y - 1){
              e.mode = 'screech'; e.t2 = 0; audio.uiMove();
            }
          } else if (e.mode === 'screech'){
            e.t2 = (e.t2||0) + dt;
            m.rotation.z = Math.sin(e.t*40)*0.15;
            if (e.t2 > 0.4){
              e.mode = 'dive';
              e.diveFrom = m.position.clone();
              e.diveTo = new (m.position.constructor)(pp.x, pp.y + 0.8, pp.z);
              e.t2 = 0;
            }
          } else if (e.mode === 'dive'){
            e.t2 = (e.t2||0) + dt*2.2;
            const k = Math.min(1, e.t2);
            m.position.lerpVectors(e.diveFrom, e.diveTo, k);
            m.position.y += Math.sin(k*Math.PI)*0.5;
            u.wL.rotation.y = 0.8; u.wR.rotation.y = -0.8;
            if (k >= 1){ e.mode = 'return'; }
          } else if (e.mode === 'return'){
            const d = m.position.distanceTo(e.home);
            if (d < 0.3){ e.mode = 'hang'; }
            else m.position.lerp(e.home, dt*1.6);
            const f = Math.sin(t*20)*0.7;
            u.wL.rotation.y = f; u.wR.rotation.y = -f;
          }
          break;
        }
        case 'spitter': {
          const u = m.userData;
          u.head.position.y = 1.0 + Math.sin(e.t*2)*0.05;
          if (distXZ < 14 && Math.abs(dy) < 4){
            e.shootT -= dt;
            // face player
            m.rotation.y = Math.atan2(dx, dz);
            if (e.shootT <= 0){
              e.shootT = 2.6;
              this.fireSeed(e, player);
              u.lips.scale.setScalar(1.5);
            }
            u.lips.scale.lerp(this._v.set(1,1,1), dt*6);
          }
          break;
        }
      }
      // ── interaction ──
      if (e.type === 'charger' && e.mode === 'charge' && !player.dead && distXZ < 1.15 && Math.abs(dy) < 1.2){
        if (player.hurt(m.position.x, m.position.z)) game.camRig.impulse(0.6);
        continue;
      }
      if (e.type === 'charger' && e.mode !== 'charge' && e.mode !== 'stunned' && player.spinning && distXZ < 1.45 && Math.abs(dy) < 1.3){
        // spinning a charging-ready charger just bounces the spin — it's armored head-on
        this.kill(e, 'spin', player); continue;
      }
      if (!player.dead && e.alive && distXZ < 1.05 && Math.abs(dy) < 1.3){
        const stomp = player.vel.y < -2 && dy > 0.55;
        if (player.spinning && e.type !== 'spikeback'){
          this.kill(e, 'spin', player);
        } else if (stomp && e.type !== 'spikeback'){
          this.kill(e, 'stomp', player);
          player.vel.y = 9.5; player.jumps = 1; player.grounded = false;
          audio.bounce(2);
          this.fx.ring(pp, 0.8);
        } else if (player.slamming && e.type === 'spikeback'){
          this.kill(e, 'slam', player);
        } else if (player.slamming){
          this.kill(e, 'slam', player);
        } else {
          if (player.hurt(m.position.x, m.position.z)) game.camRig.impulse(0.5);
        }
      }
    }
    // ── projectiles ──
    for (let i=this.projectiles.length-1;i>=0;i--){
      const pr = this.projectiles[i];
      pr.t += dt;
      pr.vy -= 9*dt;
      pr.mesh.position.x += pr.vx*dt;
      pr.mesh.position.y += pr.vy*dt;
      pr.mesh.position.z += pr.vz*dt;
      const mp = pr.mesh.position;
      // reflect window
      if (!pr.reflected && player.spinning && mp.distanceTo(this._v.set(pp.x,pp.y+0.8,pp.z)) < 1.7){
        pr.reflected = true;
        const d = this._v.set(pr.src.x-mp.x, 0, pr.src.z-mp.z).normalize();
        pr.vx = d.x*14; pr.vz = d.z*14; pr.vy = 3;
        audio.reflect();
        this.fx.sparkle(mp, 8, 0xffe45e);
      }
      // hit player
      if (!pr.reflected && !player.dead && mp.distanceTo(this._v.set(pp.x, pp.y+0.7, pp.z)) < 0.7){
        if (player.hurt(mp.x, mp.z)) game.camRig.impulse(0.4);
        this.fx.smoke(mp, 6);
        this.scene.remove(pr.mesh);
        this.projectiles.splice(i,1);
        continue;
      }
      // hit source enemy after reflect
      if (pr.reflected){
        let hit = false;
        for (const e of this.enemies){
          if (e.alive && e.type==='spitter' && mp.distanceTo(e.mesh.position) < 1.1){
            this.kill(e, 'reflect', player); hit = true; break;
          }
        }
        if (hit){ this.scene.remove(pr.mesh); this.projectiles.splice(i,1); continue; }
      }
      if (pr.t > 6 || mp.y < this.killY){
        this.fx.dust(mp, 4, 0x8aff5e);
        this.scene.remove(pr.mesh);
        this.projectiles.splice(i,1);
      }
    }
  }
  killY = -20;
  fireSeed(e, player){
    const glow = Math.random() < 0.45;
    const mesh = (glow ? this.projGlowProto : this.projProto).clone();
    const from = e.mesh.position.clone(); from.y += 1.1;
    mesh.position.copy(from);
    this.scene.add(mesh);
    const to = player.pos;
    const dx = to.x-from.x, dz = to.z-from.z;
    const d = Math.hypot(dx, dz);
    const sp = 8;
    this.projectiles.push({ mesh, t:0, glow,
      vx:dx/d*sp, vz:dz/d*sp, vy:4.5,
      src:e.mesh.position, reflected:false });
    audio.osc && audio.osc('square', 300, 200, audio.now(), 0.15, 0.1);
  }
}
