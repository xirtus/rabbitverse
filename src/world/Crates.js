// ═══ CRATES — 10 types, juicy destruction, chain reactions, tracking ═══
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { audio } from '../core/Audio.js';

function crateFaceTex(type){
  const s = 128;
  const c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  const wood = (base, frame)=>{
    g.fillStyle = frame; g.fillRect(0,0,s,s);
    g.fillStyle = base; g.fillRect(10,10,s-20,s-20);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(10,10); g.lineTo(s-10,s-10); g.moveTo(s-10,10); g.lineTo(10,s-10); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; g.strokeRect(12,12,s-24,s-24);
  };
  const txt = (t, col='#fff', size=58, y=84)=>{
    g.font = `900 ${size}px ui-rounded,system-ui,sans-serif`;
    g.textAlign = 'center'; g.lineWidth = 9; g.strokeStyle = 'rgba(0,0,0,.55)';
    g.strokeText(t, s/2, y); g.fillStyle = col; g.fillText(t, s/2, y);
  };
  const carrotIcon = (cx,cy,sc=1)=>{
    g.save(); g.translate(cx,cy); g.rotate(-0.5); g.scale(sc,sc);
    g.fillStyle = '#ff8c2e'; g.beginPath(); g.moveTo(-8,-8); g.quadraticCurveTo(14,-6, 8,26); g.quadraticCurveTo(-2,30,-10,20); g.closePath(); g.fill();
    g.fillStyle = '#3fae5a'; g.beginPath(); g.ellipse(-8,-14,7,12,-0.4,0,7); g.fill();
    g.beginPath(); g.ellipse(2,-15,6,11,0.3,0,7); g.fill();
    g.restore();
  };
  switch(type){
    case 'carrot': wood('#c88a4a','#8a5a2a'); carrotIcon(64,52,1.2); break;
    case 'bounce': wood('#d8a0b8','#a05878'); txt('↕','#fff',64,92); break;
    case 'tnt': wood('#b03a2e','#7a241c'); txt('TNT','#ffd23e',40,82); break;
    case 'nitro': wood('#3fae5a','#2a7a3c'); txt('!', '#eaffea',64,92); break;
    case 'slam': wood('#7a5ab0','#553a80'); txt('▼','#fff',54,86); break;
    case 'iron': {
      g.fillStyle = '#9aa0ad'; g.fillRect(0,0,s,s);
      g.fillStyle = '#b8bec9'; g.fillRect(8,8,s-16,s-16);
      g.fillStyle = '#787e8a';
      for (const [x,y] of [[20,20],[108,20],[20,108],[108,108]]){ g.beginPath(); g.arc(x,y,7,0,7); g.fill(); }
      g.strokeStyle = '#6a707c'; g.lineWidth = 4; g.strokeRect(8,8,s-16,s-16);
      break;
    }
    case 'arrow': wood('#4a90c8','#2a5a8a'); txt('▲','#fff',60,92); break;
    case 'checkpoint': wood('#d8b84a','#a08828');
      g.strokeStyle='#5a4410'; g.lineWidth=7; g.beginPath(); g.moveTo(48,104); g.lineTo(48,26); g.stroke();
      g.fillStyle='#ff5d5e'; g.beginPath(); g.moveTo(48,26); g.quadraticCurveTo(76,22,98,32);
      g.quadraticCurveTo(80,42,96,54); g.quadraticCurveTo(70,50,48,58); g.closePath(); g.fill();
      g.lineWidth=4; g.strokeStyle='rgba(0,0,0,.4)'; g.stroke(); break;
    case 'life': wood('#c88a4a','#8a5a2a');
      g.fillStyle='#ff5d8e'; g.beginPath();
      g.moveTo(64,96); g.bezierCurveTo(20,60,40,20,64,44); g.bezierCurveTo(88,20,108,60,64,96); g.fill();
      g.lineWidth=6; g.strokeStyle='rgba(0,0,0,.4)'; g.stroke(); break;
    default: wood('#c88a4a','#8a5a2a'); txt('?','#ffe45e',64,92);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const SIZE = 0.92;

export class CrateSystem {
  constructor(scene, world, fx, events){
    this.scene = scene; this.world = world; this.fx = fx; this.ev = events;
    this.crates = [];
    this.broken = 0; this.total = 0;
    this.mats = {};
    this.geo = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
    this.edgeGeoV = new THREE.BoxGeometry(0.09, SIZE+0.04, 0.09);
    this.edgeGeoH = new THREE.BoxGeometry(SIZE+0.04, 0.09, 0.09);
    this.edgeGeoD = new THREE.BoxGeometry(0.09, 0.09, SIZE+0.04);
    this.frameMat = new THREE.MeshStandardMaterial({ color:0x6e4520, roughness:0.8 });
  }
  _mat(type){
    if (!this.mats[type])
      this.mats[type] = new THREE.MeshStandardMaterial({ map:crateFaceTex(type), roughness:0.72 });
    return this.mats[type];
  }
  add(type, x, y, z){
    const g = new THREE.Group();
    let mesh;
    if (type !== 'iron'){
      // merge box + 12 edge bars into ONE geometry (2 material groups, 1 draw)
      const parts = [ this.geo.clone() ];
      const frames = [];
      const add = (geo, px, py, pz)=>{ const c = geo.clone(); c.translate(px, py, pz); frames.push(c); };
      for (const sx of [-1,1]) for (const sz of [-1,1]) add(this.edgeGeoV, sx*SIZE/2, 0, sz*SIZE/2);
      for (const sy of [-1,1]) for (const sz of [-1,1]) add(this.edgeGeoH, 0, sy*SIZE/2, sz*SIZE/2);
      for (const sx of [-1,1]) for (const sy of [-1,1]) add(this.edgeGeoD, sx*SIZE/2, sy*SIZE/2, 0);
      const merged = mergeGeometries([...parts, ...frames], true);
      mesh = new THREE.Mesh(merged, [this._mat(type), this.frameMat]);
    } else {
      mesh = new THREE.Mesh(this.geo, this._mat(type));
    }
    mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh);
    g.position.set(x, y + SIZE/2, z);
    this.scene.add(g);
    const col = this.world.addBox(x, y, z, SIZE, SIZE, SIZE, 'solid', 'crate');
    const crate = { type, x, y, z, group:g, col, broken:false, bounceCount:0, tntT:-1,
      top: y + SIZE, wobble:0, flash:0 };
    col.data = crate;
    this.crates.push(crate);
    if (!['iron','checkpoint'].includes(type)) this.total++;
    return crate;
  }
  stack(type, x, y, z, n){ for (let i=0;i<n;i++) this.add(type, x, y+i*SIZE, z); }

  breakCrate(c, cause='spin', player=null){
    if (c.broken) return;
    if (c.type === 'iron') return;
    if (c.type === 'slam' && cause !== 'slam' && cause !== 'explosion') return;
    if (c.type === 'checkpoint'){
      c.broken = true; c.col.disabled = true;
      c.group.visible = false;
      this.ev.emit('checkpoint', { x:c.x, y:c.top, z:c.z });
      this.fx.sparkle(new THREE.Vector3(c.x, c.top+0.5, c.z), 18, 0xffe45e);
      audio.checkpoint();
      return;
    }
    if (c.type === 'tnt' && cause !== 'explosion'){
      if (c.tntT < 0){ c.tntT = 3.05; audio.tntFuse(); }
      return;
    }
    if (c.type === 'nitro'){ this._explode(c); return; }
    c.broken = true; c.col.disabled = true;
    this.broken++;
    const p = new THREE.Vector3(c.x, c.y + SIZE/2, c.z);
    this.fx.chips(p, 10, c.type==='bounce' ? 0xd8a0b8 : 0xb0703a, true);
    this.fx.dust(p, 10, 0xd8c8a8);
    audio.crateBreak();
    this.ev.emit('crateBroken', c);
    // rewards
    if (c.type === 'carrot'){ this.ev.emit('carrotBurst', p, 3); }
    else if (c.type === 'life'){ this.ev.emit('lifeUp', p); }
    else if (c.type === 'bounce'){ this.ev.emit('carrotBurst', p, 10); }
    else if (c.type === 'normal'){ if (Math.random() < 0.35) this.ev.emit('carrotBurst', p, 1); }
    c.group.visible = false;
  }

  _explode(c){
    if (c.broken) return;
    c.broken = true; c.col.disabled = true; c.group.visible = false;
    this.broken++;
    const p = new THREE.Vector3(c.x, c.y + SIZE/2, c.z);
    this.fx.fireball(p); this.fx.smoke(p, 12);
    this.fx.shockwave(p, 4, 0xffa63c);
    this.fx.chips(p, 8, 0x555560);
    audio.explosion();
    this.ev.emit('crateBroken', c);
    this.ev.emit('shake', 0.7);
    // chain
    for (const o of this.crates){
      if (o.broken) continue;
      const d = Math.hypot(o.x-c.x, o.y-c.y, o.z-c.z);
      if (d < 2.8){
        if (o.type === 'tnt' || o.type === 'nitro') setTimeout(()=>this._explode(o), 120 + Math.random()*160);
        else this.breakCrate(o, 'explosion');
      }
    }
    this.ev.emit('explosionAt', p, 2.9);
  }

  // player interactions, called per-frame
  update(dt, player, game){
    const pp = player.pos;
    for (const c of this.crates){
      if (c.broken) continue;
      // TNT countdown
      if (c.tntT > 0){
        c.tntT -= dt;
        c.flash += dt*10;
        const fm = c.group.children[0].material;
        if (Array.isArray(fm)) fm[0] = (c.tntT*4|0)%2 ? this._mat('tnt') : this._mat('nitro');
        if (c.tntT <= 0) this._explode(c);
        continue;
      }
      const dx = pp.x - c.x, dz = pp.z - c.z, dy = pp.y - c.y;
      const adx = Math.abs(dx), adz = Math.abs(dz);
      // spin hit
      if (player.spinning && adx < 1.45 && adz < 1.45 && dy > -1.3 && dy < 1.3){
        if (c.type === 'iron') continue;
        if (c.type === 'nitro'){ this._explode(c); if (player.iframes<=0) player.hurt(c.x, c.z); continue; }
        this.breakCrate(c, 'spin', player);
        continue;
      }
      // touch nitro = boom
      if (c.type === 'nitro' && adx < 1.1 && adz < 1.1 && dy > -1.2 && dy < 1.4){
        this._explode(c);
        if (player.iframes <= 0) player.hurt(c.x, c.z);
        continue;
      }
      // bounce logic: standing on crate
      if (player.grounded && player.groundCol === c.col){
        if (c.type === 'bounce'){
          player.vel.y = 10 + Math.min(4, c.bounceCount*0.4);
          player.grounded = false; player.jumps = 1;
          c.bounceCount++; c.wobble = 1;
          audio.bounce(c.bounceCount);
          this.ev.emit('carrotBurst', new THREE.Vector3(c.x, c.top+0.4, c.z), 1);
          if (c.bounceCount >= 10) this.breakCrate(c, 'spin', player);
        } else if (c.type === 'arrow'){
          player.vel.y = 17; player.grounded = false; player.jumps = 1;
          c.wobble = 1; audio.bounce(6);
          this.fx.ring(new THREE.Vector3(c.x, c.top, c.z), 1.4);
        } else if (c.type === 'tnt' && c.tntT < 0 && player.landedHard > 0.3){
          c.tntT = 3.05; audio.tntFuse();
        } else if (c.type === 'checkpoint'){
          this.breakCrate(c, 'touch', player);
        } else if (player.landedHard > 0.55 && (c.type==='normal'||c.type==='carrot'||c.type==='life')){
          this.breakCrate(c, 'stomp', player);
          player.vel.y = 6; player.grounded = false; player.jumps = 1;
        }
      }
      // slam landing near
      // handled by game event slamLand → shockwave check below
      // idle wobble decay + float visuals
      if (c.wobble > 0){
        c.wobble = Math.max(0, c.wobble - dt*4);
        const w = Math.sin(c.wobble*20)*c.wobble*0.12;
        c.group.scale.set(1+w, 1-w, 1+w);
      }
    }
    // gentle bob for arrow/bounce crates
  }
  onSlamLand(pos){
    for (const c of this.crates){
      if (c.broken || c.type === 'iron') continue;
      const d = Math.hypot(pos.x-c.x, pos.z-c.z);
      if (d < 2.4 && Math.abs(pos.y - c.y) < 2){
        if (c.type === 'tnt'){ c.tntT = Math.min(c.tntT < 0 ? 99 : c.tntT, 0.8); if (c.tntT===99) c.tntT=0.8; audio.tntFuse(); }
        else this.breakCrate(c, 'slam');
      }
      // slam breaks entire stack below when on top
      if (Math.abs(pos.x-c.x) < SIZE && Math.abs(pos.z-c.z) < SIZE && c.y < pos.y - 0.5 && d < 1){
        this.breakCrate(c, 'slam');
      }
    }
  }
}
