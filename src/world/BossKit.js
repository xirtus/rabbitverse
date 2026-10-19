// ═══ BOSS KIT — archetype bosses: pluggable models + attack vocabularies ═══
// State grammar (Crash-readable): intro → volley → tired (spin to hit) → escalate → dying
import * as THREE from 'three';
import { audio } from '../core/Audio.js';

function std(c, r=0.6, e={}){ return new THREE.MeshStandardMaterial({ color:c, roughness:r, metalness:0, ...e }); }

// ─── model builders (all original creatures) ───
const MODELS = {
  // W2 fractal: prism spider
  prismspider(){
    const g = new THREE.Group(); const U = { legs:[] };
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(1.15), std(0x7a3adf, 0.3, { emissive:0x3a0a6a, emissiveIntensity:0.5 }));
    body.position.y = 2.6; body.scale.set(1.2, 1, 1.2);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.55),
      new THREE.MeshBasicMaterial({ color:0xff6ad5 }));
    core.position.y = 2.6;
    const eyeM = std(0xffe45e, 0.3, { emissive:0xaa7700, emissiveIntensity:0.8 });
    for (let i=0;i<3;i++){
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), eyeM);
      e.position.set((i-1)*0.4, 2.9, 1.0); g.add(e);
    }
    for (let s=-1;s<=1;s+=2) for (let i=0;i<3;i++){
      const leg = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 1.6, 4, 6), std(0x4a2a8a, 0.5));
      upper.position.y = 0.8; upper.rotation.z = s*0.9;
      const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 1.6, 4, 6), std(0x4a2a8a, 0.5));
      lower.position.set(s*1.5, -0.2, 0); lower.rotation.z = s*0.35;
      leg.add(upper, lower);
      leg.position.set(s*0.8, 2.2, (i-1)*0.8);
      g.add(leg); U.legs.push(leg);
    }
    g.add(body, core);
    U.body = body; U.core = core; U.hitY = 2.6;
    return { g, U };
  },
  // W3 neon: data core
  datacore(){
    const g = new THREE.Group(); const U = { panels:[] };
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.0),
      std(0x101530, 0.3, { emissive:0x00ffcc, emissiveIntensity:0.6 }));
    core.position.y = 3.0;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10),
      new THREE.MeshBasicMaterial({ color:0xff2a90 }));
    eye.position.set(0, 3.0, 0.85);
    for (let i=0;i<4;i++){
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 0.08),
        std(0x1a2a4a, 0.4, { emissive:0x4adfff, emissiveIntensity:0.5 }));
      p.userData.a = i/4*Math.PI*2;
      g.add(p); U.panels.push(p);
    }
    g.add(core, eye);
    U.body = core; U.core = eye; U.hitY = 3.0;
    return { g, U };
  },
  // W4 tropic: lava djinn
  lavadjinn(){
    const g = new THREE.Group(); const U = { hands:[] };
    const torso = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.6, 10),
      std(0x8a2a1a, 0.5, { emissive:0xff4a00, emissiveIntensity:0.4 }));
    torso.position.y = 1.6;
    const mask = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 10), std(0xffd23e, 0.35));
    mask.position.set(0, 3.1, 0.2); mask.scale.set(1, 1.2, 0.8);
    const eyeM = new THREE.MeshBasicMaterial({ color:0x1a0a10 });
    for (const s of [-1,1]){
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), eyeM);
      e.position.set(0.24*s, 3.25, 0.68); g.add(e);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), std(0xff8c2e, 0.4, { emissive:0xff5a00, emissiveIntensity:0.5 }));
      hand.position.set(1.4*s, 1.9, 0.4);
      g.add(hand); U.hands.push(hand);
    }
    g.add(torso, mask);
    U.body = torso; U.core = mask; U.hitY = 1.8;
    return { g, U };
  },
  // W5 edo: frost ronin
  frostronin(){
    const g = new THREE.Group(); const U = {};
    const armor = std(0x3a4a6a, 0.5);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.0, 1.8, 10), armor);
    body.position.y = 1.5;
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.7, 10), std(0x223048, 0.4));
    helm.position.y = 2.75;
    const crest = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 6, 16, Math.PI), std(0xbfe8ff, 0.3, { emissive:0x4a8adf, emissiveIntensity:0.5 }));
    crest.position.set(0, 3.2, 0.3); crest.rotation.x = 0.4;
    const eyeM = new THREE.MeshBasicMaterial({ color:0x9feaff });
    for (const s of [-1,1]){
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.05), eyeM);
      e.position.set(0.2*s, 2.7, 0.6); g.add(e);
    }
    const bladeM = std(0xd8f4ff, 0.2, { emissive:0x6abaff, emissiveIntensity:0.4 });
    const bL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.3), bladeM);
    bL.position.set(-1.0, 1.6, 0.2); bL.rotation.z = 0.5;
    const bR = bL.clone(); bR.position.set(1.0, 1.6, 0.2); bR.rotation.z = -0.5;
    g.add(body, helm, crest, bL, bR);
    U.body = body; U.core = helm; U.blades = [bL, bR]; U.hitY = 1.8;
    return { g, U };
  },
  // W1 garden: mossjaw (toad-plant)
  mossjaw(){
    const g = new THREE.Group(); const U = {};
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.3, 18, 14), std(0x4a7a3a, 0.7));
    body.position.y = 1.5; body.scale.set(1.25, 1, 1.1);
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(1.15, 18, 12, 0, Math.PI*2, Math.PI/2, Math.PI/2), std(0x8ab84a, 0.7));
    jaw.position.y = 1.35; jaw.scale.set(1.2, 0.8, 1.05);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 8), new THREE.MeshBasicMaterial({ color:0x30080f }));
    mouth.position.set(0, 1.25, 0.35); mouth.scale.set(1.05, 0.55, 0.9);
    const eyeM = std(0xffe45e, 0.3, { emissive:0x8a6600, emissiveIntensity:0.6 });
    for (const s of [-1,1]){
      const bump = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), std(0x4a7a3a, 0.7));
      bump.position.set(0.62*s, 2.6, 0.5); g.add(bump);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), eyeM);
      e.position.set(0.62*s, 2.68, 0.72); g.add(e);
    }
    const moss = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), std(0x66bb47, 0.9));
    moss.position.set(-0.3, 2.35, -0.4); moss.scale.set(1.1, 0.5, 1);
    g.add(body, jaw, mouth, moss);
    U.body = body; U.core = mouth; U.jaw = jaw; U.hitY = 1.6;
    return { g, U };
  },
};

export class ArchetypeBoss {
  // cfg: { model, name, hp=3, speed=1, attacks:['rings','seeds','charge','rain','sweep','summon'], tint }
  constructor(scene, world, fx, events, x, y, z, cfg){
    this.scene = scene; this.world = world; this.fx = fx; this.ev = events;
    this.pos = new THREE.Vector3(x, y, z);
    this.cfg = cfg;
    this.hp = cfg.hp ?? 3; this.maxHp = this.hp;
    this.state = 'dormant'; this.t = 0;
    this.active = false; this.dead = false;
    this.shockwaves = []; this.projectiles = []; this.minions = [];
    const { g, U } = MODELS[cfg.model]();
    this.group = g; this.U = U;
    g.position.copy(this.pos);
    if (cfg.tint) g.traverse(o=>{ if (o.isMesh && o.material.emissive) o.material.emissive.offsetHSL(cfg.tint, 0, 0); });
    g.traverse(o=>{ if (o.isMesh) o.castShadow = true; });
    scene.add(g);
    this._v = new THREE.Vector3();
    this.volley = 0;
  }
  hitPos(){ return this.U.core.getWorldPosition(this._v.set(0,0,0)).clone(); }
  start(){
    if (this.active) return;
    this.active = true; this.state = 'intro'; this.t = 0;
    audio.roar();
  }
  damage(){
    if (this.state === 'hit' || this.dead || this.state === 'dormant') return;
    this.hp--; this.state = 'hit'; this.t = 0;
    audio.bossHit(); audio.roar();
    this.ev.emit('bossHp', this.hp, this.maxHp);
    this.ev.emit('shake', 0.8);
    this.fx.starBurst(this.hitPos(), 22, 0xff9a3d);
    if (this.hp <= 0){ this.dead = true; this.state = 'dying'; this.t = 0; }
  }
  _ring(x, z, speed=8){
    this.shockwaves.push({ x, z, r:0.5, speed, hitDone:false });
    this.fx.shockwave(new THREE.Vector3(x, this.pos.y+0.1, z), 0.1, 0xffe45e, 2.2);
    audio.slamLand();
  }
  _seed(player, glow){
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(glow?0.3:0.24, 12, 10),
      std(glow?0xffe45e:0x8aff5e, 0.3, { emissive: glow?0xcf8a00:0x2a8a12, emissiveIntensity:0.8 }));
    const from = this.hitPos(); mesh.position.copy(from);
    this.scene.add(mesh);
    const dx = player.pos.x-from.x, dz = player.pos.z-from.z;
    const d = Math.hypot(dx,dz)||1;
    this.projectiles.push({ mesh, t:0, glow, vx:dx/d*10, vz:dz/d*10, vy:5.5, reflected:false });
    audio.osc('square', 220, 130, audio.now(), 0.18, 0.14);
  }
  update(dt, t, player, game){
    const g = this.group, cfg = this.cfg;
    if (!this.active){
      g.position.y = this.pos.y + Math.sin(t*1.2)*0.08;
      if (this.U.panels) for (const p of this.U.panels){
        p.userData.a += dt*0.8;
        p.position.set(Math.cos(p.userData.a)*1.9, 3.0 + Math.sin(t*2)*0.1, Math.sin(p.userData.a)*1.9);
        p.rotation.y = p.userData.a + Math.PI/2;
      }
      return;
    }
    this.t += dt;
    const sp = (cfg.speed ?? 1) * (1 + (this.maxHp - this.hp)*0.3);
    const pp = player.pos;
    // face the player
    const wantYaw = Math.atan2(pp.x - this.pos.x, pp.z - this.pos.z);
    let dy = wantYaw - g.rotation.y;
    while (dy > Math.PI) dy -= Math.PI*2; while (dy < -Math.PI) dy += Math.PI*2;
    g.rotation.y += dy * Math.min(1, dt*3);
    // idle model life
    if (this.U.legs) this.U.legs.forEach((l,i)=> l.rotation.x = Math.sin(t*3+i)*0.12);
    if (this.U.panels) for (const p of this.U.panels){
      p.userData.a += dt*0.8;
      p.position.set(Math.cos(p.userData.a)*1.9, 3.0 + Math.sin(t*2)*0.1, Math.sin(p.userData.a)*1.9);
      p.rotation.y = p.userData.a + Math.PI/2;
    }
    if (this.U.hands) this.U.hands.forEach((h,i)=> h.position.y = 1.9 + Math.sin(t*2.2+i*2)*0.2);
    if (this.U.jaw) this.U.jaw.rotation.x = 0.1 + Math.sin(t*1.4)*0.08;

    const volleys = { rings:1.6, seeds:1.7, charge:2.2, rain:2.4, sweep:2.0, summon:1.8 };
    switch (this.state){
      case 'intro':
        g.scale.setScalar(Math.min(1, this.t*1.2));
        if (this.t > 1.4){ this.state = 'choose'; this.t = 0; }
        break;
      case 'choose': {
        const atk = cfg.attacks[(Math.random()*cfg.attacks.length)|0];
        this.current = atk; this.state = 'tele'; this.t = 0; this.volley = 0;
        break;
      }
      case 'tele':
        // anticipation shiver
        g.position.x = this.pos.x + Math.sin(this.t*40)*0.06;
        if (this.t > 0.6/sp){ this.state = 'attack'; this.t = 0; g.position.x = this.pos.x; }
        break;
      case 'attack': {
        const A = this.current;
        if (A === 'rings'){
          if (this.volley < 3 && this.t > this.volley*0.45/sp){
            this._ring(pp.x + (Math.random()-0.5)*2, pp.z + (Math.random()-0.5)*2);
            this.volley++;
            game.camRig.impulse(0.4);
          }
          if (this.t > volleys.rings/sp){ this.state = 'tired'; this.t = 0; }
        } else if (A === 'seeds'){
          if (this.volley < 3 && this.t > this.volley*0.36/sp){
            this._seed(player, this.volley === 1); this.volley++;
          }
          if (this.t > volleys.seeds/sp){ this.state = 'tired'; this.t = 0; }
        } else if (A === 'charge'){
          if (this.volley === 0){
            this.volley = 1;
            this._chargeDir = new THREE.Vector3(pp.x-this.pos.x, 0, pp.z-this.pos.z).normalize();
            audio.roar();
          }
          this.pos.addScaledVector(this._chargeDir, 14*sp*dt);
          g.position.copy(this.pos);
          if (Math.random() < dt*20) this.fx.dust(this.pos, 1, 0xcdb894);
          if (this.t > 0.55/sp){
            this._ring(this.pos.x, this.pos.z, 9);
            game.camRig.impulse(0.7);
            this.state = 'tired'; this.t = 0;
            // drift back to center
            this.pos.lerp(new THREE.Vector3(this.homeX ??= this.pos.x, this.pos.y, this.homeZ ??= this.pos.z), 0);
          }
        } else if (A === 'rain'){
          if (this.volley < 4 && this.t > this.volley*0.4/sp){
            const tx = pp.x + (Math.random()-0.5)*4, tz = pp.z + (Math.random()-0.5)*4;
            this.fx.ring(new THREE.Vector3(tx, this.pos.y+0.1, tz), 1.2, 0x9feaff);
            const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.3, 7), std(0xbfe8ff, 0.2, { emissive:0x2a6a9a, emissiveIntensity:0.4 }));
            mesh.rotation.x = Math.PI;
            mesh.position.set(tx, this.pos.y + 9, tz);
            this.scene.add(mesh);
            this.projectiles.push({ mesh, t:0, rain:true, vy:0, glow:false, reflected:false });
            this.volley++;
          }
          if (this.t > volleys.rain/sp){ this.state = 'tired'; this.t = 0; }
        } else if (A === 'sweep'){
          if (this.volley === 0){
            this.volley = 1;
            const beam = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 0.3),
              new THREE.MeshBasicMaterial({ color:0xff4a6a }));
            beam.position.copy(this.pos); beam.position.y = this.pos.y + 0.9;
            this.scene.add(beam);
            this._beam = { mesh:beam, a:0 };
          }
          if (this._beam){
            this._beam.a += dt*1.7*sp;
            this._beam.mesh.rotation.y = this._beam.a;
            const ba = this._beam.a;
            const bd = Math.hypot(pp.x-this.pos.x, pp.z-this.pos.z);
            if (bd < 7 && player.grounded){
              const pa = Math.atan2(pp.z-this.pos.z, pp.x-this.pos.x);
              let diff = Math.abs(((pa + ba) % Math.PI) );
              const perp = Math.abs(Math.sin(diff))*bd;
              if (perp < 0.5 && !player.dead){ if (player.hurt(pp.x, pp.z)) game.camRig.impulse(0.5); }
            }
          }
          if (this.t > 2.6/sp){
            if (this._beam){ this.scene.remove(this._beam.mesh); this._beam = null; }
            this.state = 'tired'; this.t = 0;
          }
        } else if (A === 'summon'){
          if (this.volley === 0){
            this.volley = 1;
            this.ev.emit('bossSummon');
            audio.enemyPop();
          }
          if (this.t > volleys.summon/sp){ this.state = 'tired'; this.t = 0; }
        }
        break;
      }
      case 'tired':
        // droop — vulnerable to spin
        if (this.U.body) this.U.body.position.y += ((this.U.hitY*0.55) - this.U.body.position.y)*dt*4;
        if (this.t > 2.4/sp){ this.state = 'choose'; this.t = 0; if (this.U.body) this.U.body.position.y = this.U.hitY; }
        break;
      case 'hit':
        g.rotation.z = Math.sin(this.t*40)*0.06*(1-this.t);
        if (this.U.body) this.U.body.position.y = this.U.hitY;
        if (this.t > 1.0 && !this.dead){ this.state = 'choose'; this.t = 0; g.rotation.z = 0; }
        break;
      case 'dying': {
        g.rotation.z = Math.sin(this.t*18)*0.1*Math.max(0,1-this.t*0.4);
        const s = Math.max(0.01, 1 - Math.max(0, this.t-1.0)*0.7);
        g.scale.setScalar(s);
        if (Math.random() < dt*12) this.fx.smoke(this.hitPos(), 3, 0x8a4a6a);
        if (this.t > 2.4){
          this.state = 'dead';
          g.visible = false;
          this.fx.confetti(this.pos.clone().add(new THREE.Vector3(0,3,0)), 60);
          this.fx.shockwave(this.pos, 8, 0xffe45e);
          this.ev.emit('bossDown');
        }
        break;
      }
    }
    // vulnerability: spin near the drooped core
    if (this.state === 'tired' && player.spinning){
      const hw = this.hitPos();
      const hd = Math.hypot(hw.x-pp.x, hw.z-pp.z);
      if (hd < 3.2 && Math.abs(hw.y - pp.y) < 3.4) this.damage();
    }
    // shockwaves
    for (let i=this.shockwaves.length-1;i>=0;i--){
      const s = this.shockwaves[i];
      s.r += s.speed*dt;
      if (Math.random()<dt*30)
        this.fx.spawn(s.x + Math.cos(t*9)*s.r, this.pos.y+0.25, s.z + Math.sin(t*9)*s.r,
          0, 2.5, 0, { color:0xffd23e, size:0.3, life:0.4, grav:4 });
      const d = Math.hypot(pp.x-s.x, pp.z-s.z);
      if (!s.hitDone && Math.abs(d - s.r) < 0.5 && player.grounded && !player.dead){
        s.hitDone = true;
        if (player.hurt(s.x, s.z)) game.camRig.impulse(0.5);
      }
      if (s.r > 10) this.shockwaves.splice(i,1);
    }
    // projectiles (seeds + rain)
    for (let i=this.projectiles.length-1;i>=0;i--){
      const pr = this.projectiles[i];
      pr.t += dt;
      if (pr.rain){
        pr.vy += 30*dt;
        pr.mesh.position.y -= pr.vy*dt;
        if (pr.mesh.position.y <= this.pos.y + 0.1){
          this.fx.dust(pr.mesh.position, 6, 0xbfe8ff);
          const d = Math.hypot(pp.x-pr.mesh.position.x, pp.z-pr.mesh.position.z);
          if (d < 0.9 && !player.dead && Math.abs(pp.y - this.pos.y) < 1.5){
            if (player.hurt(pr.mesh.position.x, pr.mesh.position.z)) game.camRig.impulse(0.4);
          }
          this.scene.remove(pr.mesh); this.projectiles.splice(i,1);
        }
        continue;
      }
      pr.vy -= 10*dt;
      pr.mesh.position.x += pr.vx*dt; pr.mesh.position.y += pr.vy*dt; pr.mesh.position.z += pr.vz*dt;
      const mp = pr.mesh.position;
      if (!pr.reflected && player.spinning && pr.glow &&
          mp.distanceTo(this._v.set(pp.x, pp.y+0.8, pp.z)) < 1.9){
        pr.reflected = true;
        const d = this._v.copy(this.pos).sub(mp); d.y = 2.5; d.normalize();
        pr.vx = d.x*18; pr.vz = d.z*18; pr.vy = d.y*9;
        audio.reflect();
        this.fx.sparkle(mp, 10, 0xffe45e);
      }
      if (pr.reflected && mp.distanceTo(this.hitPos()) < 1.9){
        this.scene.remove(pr.mesh); this.projectiles.splice(i,1);
        this.damage(true);
        continue;
      }
      if (!pr.reflected && !player.dead && mp.distanceTo(this._v.set(pp.x, pp.y+0.7, pp.z)) < 0.75){
        if (player.hurt(mp.x, mp.z)) game.camRig.impulse(0.4);
        this.scene.remove(pr.mesh); this.projectiles.splice(i,1);
        continue;
      }
      if (pr.t > 6 || mp.y < this.pos.y - 2){
        this.scene.remove(pr.mesh); this.projectiles.splice(i,1);
      }
    }
  }
}
