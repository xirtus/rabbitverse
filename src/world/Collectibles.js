// ═══ COLLECTIBLES — dimensional carrots, gems, shards, time crystal ═══
import * as THREE from 'three';
import { audio } from '../core/Audio.js';

import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
function carrotGeos(){
  const body = new THREE.ConeGeometry(0.18, 0.56, 10);
  body.rotateX(Math.PI); body.translate(0, -0.04, 0);
  const leaves = [];
  for (let i=0;i<3;i++){
    const l = new THREE.ConeGeometry(0.055, 0.24, 6);
    l.translate(0, 0.12, 0);
    l.rotateX(Math.sin(i*2.1)*0.5); l.rotateZ(Math.cos(i*2.1)*0.5);
    l.translate(Math.sin(i*2.1)*0.05, 0.22, Math.cos(i*2.1)*0.05);
    leaves.push(l);
  }
  return [body, mergeGeometries(leaves)];
}

export class Collectibles {
  constructor(scene, fx, events){
    this.scene = scene; this.fx = fx; this.ev = events;
    this.carrots = [];
    this.count = 0; this.totalInLevel = 0;
    this.lives = 3;
    this.gems = [];
    this.shard = null; this.shardGot = false;
    this.timeCrystal = null;
    this._v = new THREE.Vector3(); this._v2 = new THREE.Vector3();
    // instanced carrot pools
    this.CMAX = 320;
    const [bg, lg] = carrotGeos();
    this.bodyIM = new THREE.InstancedMesh(bg,
      new THREE.MeshStandardMaterial({ color:0xff8c2e, roughness:0.4, emissive:0xa84a00, emissiveIntensity:0.5 }), this.CMAX);
    this.leafIM = new THREE.InstancedMesh(lg,
      new THREE.MeshStandardMaterial({ color:0x4ecb56, roughness:0.6, emissive:0x0a4a12, emissiveIntensity:0.3 }), this.CMAX);
    this.bodyIM.castShadow = true;
    this.bodyIM.frustumCulled = false; this.leafIM.frustumCulled = false;
    this.bodyIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.leafIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bodyIM.count = 0; this.leafIM.count = 0;
    scene.add(this.bodyIM, this.leafIM);
    this._m4 = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(1,1,1);
    this._up = new THREE.Vector3(0,1,0);
  }
  addCarrot(x, y, z){
    if (this.carrots.length >= this.CMAX) return;
    this.carrots.push({ x, y, z, ox:x, oy:y, oz:z, got:false, fly:0, phase:Math.random()*6.28 });
    this.totalInLevel++;
  }
  arc(x0,y0,z0, x1,y1,z1, n=5, lift=1.6){
    for (let i=0;i<n;i++){
      const t = i/(n-1);
      this.addCarrot(
        x0+(x1-x0)*t,
        y0+(y1-y0)*t + Math.sin(t*Math.PI)*lift,
        z0+(z1-z0)*t);
    }
  }
  line(x0,y0,z0, x1,y1,z1, n=6){
    for (let i=0;i<n;i++){ const t=i/(n-1);
      this.addCarrot(x0+(x1-x0)*t, y0+(y1-y0)*t, z0+(z1-z0)*t); }
  }
  burst(p, n){
    // carrots that fly to the player from crate breaks
    for (let i=0;i<n;i++){
      if (this.carrots.length >= this.CMAX) break;
      const a = Math.random()*6.28;
      this.carrots.push({ x:p.x, y:p.y, z:p.z, ox:p.x, oy:p.y, oz:p.z, got:false, fly:1,
        vx:Math.cos(a)*3, vy:4+Math.random()*3, vz:Math.sin(a)*3, phase:Math.random()*6.28 });
    }
  }
  placeGem(x, y, z, color=0x41e6ff){
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.42),
      new THREE.MeshStandardMaterial({ color, roughness:0.15, metalness:0.1,
        emissive:color, emissiveIntensity:0.55, transparent:true, opacity:0.95 }));
    m.position.set(x,y,z); this.scene.add(m);
    const g = { m, x,y,z, got:false };
    this.gems.push(g);
    return g;
  }
  placeShard(x, y, z){
    const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.4),
      new THREE.MeshStandardMaterial({ color:0xc08bff, roughness:0.2, emissive:0x7e5bff, emissiveIntensity:0.7 }));
    m.position.set(x,y,z); this.scene.add(m);
    this.shard = { m, x,y,z, got:false };
  }
  placeTimeCrystal(x, y, z){
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 0),
      new THREE.MeshStandardMaterial({ color:0x9feaff, emissive:0x2bb8ff, emissiveIntensity:1.2, roughness:0.2 }));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.045, 8, 32),
      new THREE.MeshBasicMaterial({ color:0x9feaff, transparent:true, opacity:0.8 }));
    g.add(core, ring); g.position.set(x,y,z);
    this.scene.add(g);
    this.timeCrystal = { g, core, ring, x,y,z, active:true, respawn:0 };
  }
  update(dt, t, player, game){
    const pp = this._v.set(player.pos.x, player.pos.y+0.7, player.pos.z);
    let dirty = false;
    for (const c of this.carrots){
      if (c.got) continue;
      if (c.fly){
        // burst physics then magnet
        c.vy -= 12*dt;
        c.x += c.vx*dt; c.y += c.vy*dt; c.z += c.vz*dt;
        if (c.vy < 0) c.fly = 0;
        dirty = true;
      }
      const cy = c.fly ? c.y : c.oy + Math.sin(t*2.4 + c.phase)*0.09;
      const cx = c.fly ? c.x : c.ox, cz = c.fly ? c.z : c.oz;
      const d = Math.hypot(cx-pp.x, cy-pp.y, cz-pp.z);
      if (d < 2.2){ // magnet: fixed-speed zip (always catches a running player)
        const sp = 17*dt / Math.max(d, 0.001);
        const k = Math.min(1, sp);
        c.ox = c.x = cx + (pp.x-cx)*k; c.oy = c.y = cy + (pp.y-cy)*k; c.oz = c.z = cz + (pp.z-cz)*k;
        c.fly = 0; dirty = true;
      }
      if (d < 0.95){
        c.got = true; dirty = true;
        this.count++;
        audio.collect();
        this.fx.sparkle(this._v2.set(cx, cy, cz), 6, 0xffb02e);
        this.ev.emit('carrot', this.count);
        if (this.count % 100 === 0){ this.lives++; audio.life(); this.ev.emit('life'); this.ev.emit('toast', '1UP!'); }
        continue;
      }
    }
    // rebuild instance buffers (skip collected by zero-scaling)
    let i = 0;
    for (const c of this.carrots){
      if (c.got) continue;
      const cy = c.fly ? c.y : c.oy + Math.sin(t*2.4 + c.phase)*0.09;
      this._q.setFromAxisAngle(this._up, t*3 + c.phase);
      this._m4.compose(this._v2.set(c.fly?c.x:c.ox, cy, c.fly?c.z:c.oz), this._q, this._s);
      this.bodyIM.setMatrixAt(i, this._m4);
      this.leafIM.setMatrixAt(i, this._m4);
      i++;
    }
    // zero-scale the tail slots
    this._s0 ??= new THREE.Matrix4().makeScale(0,0,0);
    for (let k=i;k<this.bodyIM.count;k++){ this.bodyIM.setMatrixAt(k, this._s0); this.leafIM.setMatrixAt(k, this._s0); }
    this.bodyIM.count = Math.max(i, 0); this.leafIM.count = Math.max(i, 0);
    this.bodyIM.instanceMatrix.needsUpdate = true;
    this.leafIM.instanceMatrix.needsUpdate = true;
    for (const g of this.gems){
      if (g.got) continue;
      g.m.rotation.y = t*1.8;
      g.m.position.y = g.y + Math.sin(t*1.6)*0.15;
      if (g.m.position.distanceTo(pp) < 1.6){
        g.got = true; g.m.visible = false;
        audio.gem();
        this.fx.starBurst(g.m.position, 20, 0x9feaff);
        this.ev.emit('gem', g);
      }
    }
    if (this.shard && !this.shard.got){
      this.shard.m.rotation.y = t*2.2; this.shard.m.rotation.x = t*0.8;
      if (this.shard.m.position.distanceTo(pp) < 1.5){
        this.shard.got = true; this.shardGot = true; this.shard.m.visible = false;
        audio.gem();
        this.fx.starBurst(this.shard.m.position, 24, 0xc08bff);
        this.ev.emit('toast', 'DIMENSION SHARD!');
        this.ev.emit('shard');
      }
    }
    if (this.timeCrystal){
      const tc = this.timeCrystal;
      if (!tc.active){
        tc.respawn -= dt;
        if (tc.respawn <= 0){ tc.active = true; tc.g.visible = true; }
      } else {
        tc.ring.rotation.y = t*2; tc.ring.rotation.x = Math.sin(t)*0.4;
        tc.core.rotation.y = t*1.4;
        tc.g.position.y = tc.y + Math.sin(t*2)*0.12;
        if (tc.g.position.distanceTo(pp) < 1.3){
          tc.active = false; tc.g.visible = false; tc.respawn = 14;
          player.timeSlow = 8;
          audio.power(); audio.timeSlowOn();
          this.fx.starBurst(tc.g.position, 18, 0x9feaff);
          this.ev.emit('timeSlow', 8);
          this.ev.emit('toast', 'TIME SLOW!');
        }
      }
    }
  }
}
