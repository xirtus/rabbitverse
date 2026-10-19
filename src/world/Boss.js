// ═══ BOSS — KING SNARLTOOTH: 3-phase carnivorous plant spectacle ═══
import * as THREE from 'three';
import { audio } from '../core/Audio.js';

function std(c, r=0.65, e={}){ return new THREE.MeshStandardMaterial({ color:c, roughness:r, ...e }); }

export class Boss {
  constructor(scene, world, fx, events, x, y, z){
    this.scene = scene; this.world = world; this.fx = fx; this.ev = events;
    this.pos = new THREE.Vector3(x, y, z);
    this.hp = 3; this.maxHp = 3;
    this.state = 'dormant'; this.t = 0;
    this.active = false; this.dead = false;
    this.shockwaves = [];
    this.seeds = [];
    this.vines = [];
    this._build();
    this._v = new THREE.Vector3();
  }
  _build(){
    const g = this.group = new THREE.Group();
    g.position.copy(this.pos);
    // stem
    const stemM = std(0x3f8a3a);
    let py = 0;
    this.stemSegs = [];
    for (let i=0;i<4;i++){
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.5-i*0.06, 0.62-i*0.06, 1.4, 10), stemM);
      s.position.y = py + 0.7; py += 1.28;
      g.add(s); this.stemSegs.push(s);
    }
    // leaves
    const leafM = std(0x4ecb56, 0.7, { side:THREE.DoubleSide });
    for (let i=0;i<8;i++){
      const a = i/8*Math.PI*2;
      const lf = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.6, 6), leafM);
      lf.position.set(Math.cos(a)*1.2, 0.35, Math.sin(a)*1.2);
      lf.rotation.set(Math.sin(a)*0.9, 0, -Math.cos(a)*0.9);
      lf.rotation.z += Math.PI;
      g.add(lf);
    }
    // head
    const H = this.head = new THREE.Group();
    H.position.y = py + 0.6;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1.35, 20, 16), std(0xc23a6a));
    skull.scale.set(1.15, 1, 1.25);
    // jaw
    this.jawTop = new THREE.Group(); this.jawBot = new THREE.Group();
    const jt = new THREE.Mesh(new THREE.SphereGeometry(1.1, 18, 12, 0, Math.PI*2, 0, Math.PI/2), std(0xe85a8a));
    jt.scale.set(1.1, 0.8, 1.55);
    const jb = new THREE.Mesh(new THREE.SphereGeometry(1.05, 18, 12, 0, Math.PI*2, Math.PI/2, Math.PI/2), std(0xa82a55));
    jb.scale.set(1.05, 0.7, 1.5);
    this.jawTop.add(jt); this.jawBot.add(jb);
    this.jawTop.position.z = 0.55; this.jawBot.position.z = 0.55;   // maw juts forward
    this.jawTop.position.y = 0.1; this.jawBot.position.y = -0.1;
    // teeth
    const toothM = std(0xfff3dd, 0.3);
    for (let i=0;i<7;i++){
      const a = (i/6-0.5)*1.9;
      const tt = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 6), toothM);
      tt.position.set(Math.sin(a)*1.0, -0.12, Math.cos(a)*1.2+0.35);
      tt.rotation.x = Math.PI;
      this.jawTop.add(tt);
      const tb = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 6), toothM);
      tb.position.set(Math.sin(a+0.2)*0.95, 0.1, Math.cos(a+0.2)*1.15+0.35);
      this.jawBot.add(tb);
    }
    // eyes (angry, big, ember)
    const eyeM = std(0xffe45e, 0.25, { emissive:0xcc6600, emissiveIntensity:0.7 });
    for (const s of [-1,1]){
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), eyeM);
      e.position.set(0.58*s, 0.72, 0.9);
      e.scale.set(1, 1.15, 0.7);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), std(0x201020, 0.3));
      p.position.set(0.58*s, 0.72, 1.12);
      // angry brow ridge
      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.5, 4, 8), std(0x7a1a3a, 0.6));
      brow.position.set(0.55*s, 1.02, 0.92);
      brow.rotation.z = Math.PI/2 + s*0.55;
      H.add(e, p, brow);
    }
    const spotM = std(0xffe45e, 0.6);
    for (let i=0;i<8;i++){
      const sp = new THREE.Mesh(new THREE.SphereGeometry(0.1+Math.random()*0.08, 6, 6), spotM);
      sp.position.set((Math.random()-0.5)*1.8, (Math.random()-0.3)*1.2, (Math.random()-0.2)*1.6);
      sp.position.normalize().multiplyScalar(1.25);
      sp.position.z *= 1.2;
      H.add(sp);
    }
    // dark gullet so the open maw READS
    const gullet = new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 10),
      new THREE.MeshBasicMaterial({ color:0x30080f }));
    gullet.scale.set(0.85, 0.75, 1.0); gullet.position.set(0, -0.1, 0.75);
    // tongue
    const tongue = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.8, 6, 10), std(0xff7d9c, 0.4));
    tongue.position.set(0, -0.35, 0.7); tongue.rotation.x = 1.2;
    this.tongue = tongue;
    H.add(skull, gullet, tongue, this.jawTop, this.jawBot);
    g.add(H);
    // vines (arms)
    for (const s of [-1,1]){
      const v = new THREE.Group();
      const seg = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 3.4, 6, 10), stemM);
      seg.position.y = -1.7;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 10), std(0xc23a6a));
      bulb.position.y = -3.5;
      // thorns
      const thornM = std(0x2a6a2a, 0.5);
      for (let k=0;k<5;k++){
        const th = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 5), thornM);
        th.position.set(Math.sin(k*2.4)*0.3, -0.8-k*0.6, Math.cos(k*2.4)*0.3);
        th.rotation.set(Math.cos(k*2.4)*1.2, 0, -Math.sin(k*2.4)*1.2);
        v.add(th);
      }
      v.add(seg, bulb);
      v.position.set(1.2*s, 4.2, 0.4);
      v.rotation.z = s*0.9;
      g.add(v);
      this.vines.push({ g:v, bulb, side:s, slam:0, target:new THREE.Vector3() });
    }
    g.traverse(o=>{ if (o.isMesh) o.castShadow = true; });
    this.scene.add(g);
    this.headHome = H.position.y;
  }
  start(){
    if (this.active) return;
    this.active = true;
    this.state = 'intro'; this.t = 0;
    audio.roar();
  }
  damage(byReflect=false){
    if (this.state === 'hit' || this.dead) return;
    this.hp--;
    this.state = 'hit'; this.t = 0;
    audio.bossHit(); audio.roar();
    this.ev.emit('bossHp', this.hp, this.maxHp);
    this.ev.emit('shake', 0.8);
    this.fx.starBurst(this.head.getWorldPosition(this._v), 22, 0xff9a3d);
    if (this.hp <= 0){
      this.dead = true; this.state = 'dying'; this.t = 0;
    }
  }
  _spawnShockwave(x, z){
    const ring = { x, z, r:0.5, speed:7.5, alive:true, hitDone:false };
    this.shockwaves.push(ring);
    this.fx.shockwave(new THREE.Vector3(x, this.pos.y+0.1, z), 0.1, 0xffe45e, 2.2);
  }
  spitSeed(player, glow){
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(glow?0.3:0.24, 12, 10),
      std(glow?0xffe45e:0x8aff5e, 0.3, { emissive: glow?0xcf8a00:0x2a8a12, emissiveIntensity:0.8 }));
    const from = this.head.getWorldPosition(new THREE.Vector3());
    mesh.position.copy(from);
    this.scene.add(mesh);
    const dx = player.pos.x-from.x, dz = player.pos.z-from.z;
    const d = Math.hypot(dx,dz)||1;
    const sp = 10;
    this.seeds.push({ mesh, t:0, glow,
      vx:dx/d*sp, vz:dz/d*sp, vy:5.5, reflected:false });
  }
  update(dt, t, player, game){
    const g = this.group;
    // idle sway even when dormant
    const sway = Math.sin(t*1.1)*0.06;
    if (!this.active){
      g.rotation.z = sway*0.5;
      this.head.rotation.y = Math.sin(t*0.5)*0.4;
      this.jawBot.rotation.x = 0.28 + Math.sin(t*1.3)*0.08;
      return;
    }
    this.t += dt;
    const pp = player.pos;
    // head tracks player
    const wantYaw = Math.atan2(pp.x - this.pos.x, pp.z - this.pos.z) - g.rotation.y;
    this.head.rotation.y += (wantYaw - this.head.rotation.y)*Math.min(1, dt*3);
    const phaseK = 1 + (this.maxHp - this.hp)*0.35;   // escalation

    switch (this.state){
      case 'intro':
        this.head.position.y = this.headHome + Math.sin(this.t*20)*0.1*Math.min(1,this.t);
        this.jawBot.rotation.x = 0.9;
        if (this.t > 1.6){ this.state = 'choose'; this.t = 0; }
        break;
      case 'choose': {
        this.jawBot.rotation.x += (0.15 - this.jawBot.rotation.x)*dt*6;
        const moves = ['slam','spit','slam','spit'];
        this.move = moves[(Math.random()*moves.length)|0];
        if (this.hp === 1 && Math.random() < 0.35) this.move = 'both';
        this.state = 'tele_' + this.move; this.t = 0;
        break;
      }
      case 'tele_slam':
        // vines rear up, tremble
        for (const v of this.vines){
          v.g.rotation.z += ((v.side*1.9) - v.g.rotation.z)*dt*8;
          v.target.set(pp.x + (Math.random()-0.5)*1.5, 0, pp.z + (Math.random()-0.5)*1.5);
        }
        if (this.t > 0.75/phaseK){
          this.state = 'slam'; this.t = 0;
          for (const v of this.vines){
            v.slam = 1;
            this._spawnShockwave(v.target.x, v.target.z);
            this.fx.dust(new THREE.Vector3(v.target.x, this.pos.y+0.2, v.target.z), 14);
          }
          audio.slamLand();
          this.ev.emit('shake', 0.7);
        }
        break;
      case 'slam':
        for (const v of this.vines){
          v.g.rotation.z += ((v.side*0.9) - v.g.rotation.z)*dt*5;
          v.slam = Math.max(0, v.slam - dt*2);
        }
        if (this.t > 1.1/phaseK){ this.state = Math.random()<0.4 ? 'tired' : 'choose'; this.t = 0; }
        break;
      case 'tele_spit':
        this.jawBot.rotation.x += (0.95 - this.jawBot.rotation.x)*dt*7;
        if (this.t > 0.6/phaseK){
          this.state = 'spit'; this.t = 0; this.spitN = 0;
        }
        break;
      case 'spit':
        if (this.spitN < 3 && this.t > this.spitN*0.34/phaseK){
          this.spitSeed(player, this.spitN === 1);
          this.spitN++;
          audio.osc('square', 220, 130, audio.now(), 0.18, 0.14);
        }
        if (this.t > 1.5){ this.state = 'tired'; this.t = 0; }
        break;
      case 'tele_both':
        for (const v of this.vines) v.target.set(pp.x + (Math.random()-0.5)*3, 0, pp.z + (Math.random()-0.5)*3);
        this.jawBot.rotation.x += (0.95 - this.jawBot.rotation.x)*dt*7;
        if (this.t > 0.5){
          this.state = 'choose'; this.t = 0;
          for (const v of this.vines) this._spawnShockwave(v.target.x, v.target.z);
          this.spitSeed(player, true);
          audio.slamLand(); this.ev.emit('shake', 0.6);
        }
        break;
      case 'tired':
        // droop — vulnerable
        this.head.position.y += ((this.headHome-3.4) - this.head.position.y)*dt*4;
        this.head.rotation.x += (0.5 - this.head.rotation.x)*dt*4;
        if (this.t > 2.3/phaseK){
          this.state = 'choose'; this.t = 0;
        }
        break;
      case 'hit':
        this.head.position.y += ((this.headHome+0.8) - this.head.position.y)*dt*10;
        this.head.rotation.x += (-0.4 - this.head.rotation.x)*dt*8;
        g.rotation.z = Math.sin(this.t*40)*0.08*(1-this.t);
        if (this.t > 1.0 && !this.dead){ this.state = 'choose'; this.t = 0;
          this.head.rotation.x = 0; }
        break;
      case 'dying': {
        g.rotation.z = Math.sin(this.t*18)*0.12*Math.max(0,1-this.t*0.4);
        const s = Math.max(0.01, 1 - Math.max(0, this.t-1.2)*0.6);
        g.scale.set(s, Math.max(0.01, s*(1-this.t*0.1)), s);
        this.jawBot.rotation.x = 1.1;
        if (Math.random() < dt*10) this.fx.smoke(this.head.getWorldPosition(this._v), 3, 0x8a4a6a);
        if (this.t > 2.6){
          this.state = 'dead';
          g.visible = false;
          this.fx.confetti(this.pos.clone().add(new THREE.Vector3(0,3,0)), 60);
          this.fx.shockwave(this.pos, 8, 0xffe45e);
          this.ev.emit('bossDown');
        }
        break;
      }
    }
    // vulnerable check: player spin near drooped head
    if (this.state === 'tired' && player.spinning){
      const hw = this.head.getWorldPosition(this._v);
      const hd = Math.hypot(hw.x-player.pos.x, hw.z-player.pos.z);
      if (hd < 3.0 && Math.abs(hw.y - player.pos.y) < 3.2) this.damage();
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
      if (s.r > 9) this.shockwaves.splice(i,1);
    }
    // seeds
    for (let i=this.seeds.length-1;i>=0;i--){
      const sd = this.seeds[i];
      sd.t += dt; sd.vy -= 10*dt;
      sd.mesh.position.x += sd.vx*dt; sd.mesh.position.y += sd.vy*dt; sd.mesh.position.z += sd.vz*dt;
      const mp = sd.mesh.position;
      if (!sd.reflected && player.spinning && sd.glow &&
          mp.distanceTo(this._v.set(pp.x, pp.y+0.8, pp.z)) < 1.9){
        sd.reflected = true;
        const d = this._v.copy(this.pos).sub(mp); d.y = 2.5; d.normalize();
        sd.vx = d.x*18; sd.vz = d.z*18; sd.vy = d.y*9;
        audio.reflect();
        this.fx.sparkle(mp, 10, 0xffe45e);
      }
      if (sd.reflected && mp.distanceTo(this.head.getWorldPosition(this._v)) < 1.8){
        this.scene.remove(sd.mesh); this.seeds.splice(i,1);
        this.damage(true);
        continue;
      }
      if (!sd.reflected && !player.dead && mp.distanceTo(this._v.set(pp.x, pp.y+0.7, pp.z)) < 0.75){
        if (player.hurt(mp.x, mp.z)) game.camRig.impulse(0.4);
        this.scene.remove(sd.mesh); this.seeds.splice(i,1);
        continue;
      }
      if (sd.t > 6 || mp.y < this.pos.y - 2){
        this.scene.remove(sd.mesh); this.seeds.splice(i,1);
      }
    }
  }
}
