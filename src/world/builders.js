// ═══ BUILDERS — art-directed level construction kit ═══
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// box with WORLD-SCALED UVs (consistent texel density on every block)
function worldUVBox(w, h, d, s=3.4){
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]]; // +x,-x,+y,-y,+z,-z
  for (let f=0; f<6; f++){
    const [du,dv] = dims[f];
    for (let i=0;i<4;i++){
      const idx = f*4+i;
      uv.setXY(idx, uv.getX(idx)*du/s, uv.getY(idx)*dv/s);
    }
  }
  return g;
}

export class Builders {
  constructor(scene, world, mats, fx){
    this.scene = scene; this.world = world; this.mats = mats; this.fx = fx;
    this.foliageReq = [];   // {type, matrix}
    this.resetters = [];    // platform state restore fns (called on respawn)
    this._m4 = new THREE.Matrix4(); this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3(); this._p = new THREE.Vector3();
  }
  // ── terrain blocks (grass-topped dirt) ──
  ground(cx, cy, cz, w, h, d, matSet=null){
    const geo = worldUVBox(w, h, d);
    const mesh = new THREE.Mesh(geo, matSet || this.mats.set(this.groundKind || 'ground', 1));
    mesh.position.set(cx, cy + h/2, cz);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);
    const col = this.world.addBox(cx, cy, cz, w, h, d, 'solid', 'ground');
    return { mesh, col, top: cy + h };
  }
  rock(cx, cy, cz, w, h, d){
    return this.ground(cx, cy, cz, w, h, d, this.mats.set('rock', 1));
  }
  // visual-only rock: NO collider (falls through = kill plane does its job)
  rockDecor(cx, cy, cz, w, h, d){
    const geo = worldUVBox(w, h, d);
    const mesh = new THREE.Mesh(geo, this.mats.set('rock', 1));
    mesh.position.set(cx, cy + h/2, cz);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);
    return { mesh, top: cy + h };
  }
  // ── one-way wooden platform ──
  woodPlatform(cx, cy, cz, w, d){
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, 0.3, d, 1, 0.1), this.mats.wood);
    mesh.position.set(cx, cy-0.15, cz);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);
    const col = this.world.addBox(cx, cy-0.3, cz, w, 0.3, d, 'oneway', 'wood');
    return { mesh, col, top: cy };
  }
  // ── moving platform (carries player via collider delta) ──
  movingPlatform(cx, cy, cz, w, d, { axis='x', dist=4, speed=1.2, phase=0, mat=null }={}){
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, 0.4, d, 1, 0.12), mat || this.mats.wood);
    mesh.position.set(cx, cy-0.2, cz);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);
    const col = this.world.addBox(cx, cy-0.4, cz, w, 0.4, d, 'solid', 'mover');
    const base = new THREE.Vector3(cx, cy, cz);
    let prev = 0;
    this.world.onUpdate((dt, t)=>{
      const s = Math.sin(t*speed + phase) * dist;
      const delta = s - prev; prev = s;
      const off = col.baseMin.x*0; // silence
      if (axis==='x'){ col.min.x = col.baseMin.x + s; col.max.x = col.baseMax.x + s; col.delta.set(delta,0,0); mesh.position.x = base.x + s; }
      if (axis==='y'){ col.min.y = col.baseMin.y + s; col.max.y = col.baseMax.y + s; col.delta.set(0,delta,0); mesh.position.y = base.y - 0.2 + s; }
      if (axis==='z'){ col.min.z = col.baseMin.z + s; col.max.z = col.baseMax.z + s; col.delta.set(0,0,delta); mesh.position.z = base.z + s; }
    });
    return { mesh, col };
  }
  // ── collapsing platform (falls after stepped on; time-slow slows it) ──
  collapsingPlatform(cx, cy, cz, w, d, game){
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, 0.35, d, 1, 0.1), this.mats.rock);
    mesh.position.set(cx, cy-0.17, cz);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);
    const col = this.world.addBox(cx, cy-0.35, cz, w, 0.35, d, 'oneway', 'collapse');
    const st = { t:-1, vy:0, y:cy };
    this.resetters.push(()=>{
      st.t = -1; st.vy = 0; st.y = cy;
      mesh.position.y = cy-0.17; mesh.rotation.z = 0;
      mesh.visible = true; col.disabled = false;
      col.min.y = cy-0.35; col.max.y = cy;
    });
    this.world.onUpdate((dt)=>{
      const slow = game && game.player.timeSlow > 0 ? 0.22 : 1;
      if (st.t >= 0) st.t += dt*slow;
      if (game && st.t < 0 && game.player.grounded && game.player.groundCol === col) st.t = 0;
      if (st.t > 0.55 && st.t < 10){
        st.vy += 26*dt*slow;
        st.y -= st.vy*dt*slow;
        mesh.position.y = st.y - 0.17;
        col.min.y = st.y - 0.35; col.max.y = st.y;
        mesh.rotation.z = Math.sin(st.t*30)*0.03*Math.min(1,st.t);
        if (st.y < this.world.killY - 4){ col.disabled = true; mesh.visible = false; st.t = 99; }
      } else if (st.t > 0.05 && st.t < 0.55){
        mesh.rotation.z = Math.sin(st.t*55)*0.02;
      }
    });
    return { mesh, col, top: cy };
  }
  // ── dirt path ribbon (readability: this is where you run) ──
  path(cx, y, cz, w, d){
    const t = this.pathTex.clone();
    t.needsUpdate = true; t.repeat.set(Math.max(1,w/7), Math.max(1, d/7));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ map:t, transparent:true, opacity:0.9,
        roughness:0.95, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2 }));
    m.rotation.x = -Math.PI/2;
    m.position.set(cx, y+0.02, cz);
    m.receiveShadow = true;
    this.scene.add(m);
  }
  // ── foliage instancing ──
  tuft(x, y, z, s=1, type='grass'){ this.foliageReq.push({ type, x, y, z, s, r:Math.random()*6.28 }); }
  scatter(type, cx, cy, cz, w, d, n, sMin=0.8, sMax=1.4, avoid=null){
    let placed = 0, tries = 0;
    while (placed < n && tries < n*6){
      tries++;
      const x = cx + (Math.random()-0.5)*w, z = cz + (Math.random()-0.5)*d;
      // keep a clear runway down the middle (readability!)
      if (Math.abs(x-cx) < 2.2) continue;
      if (avoid && Math.abs(x-avoid.x) < avoid.r && Math.abs(z-avoid.z) < avoid.r) continue;
      this.tuft(x, cy, z, sMin+Math.random()*(sMax-sMin), type);
      placed++;
    }
  }
  buildFoliage(T){
    const byType = {};
    for (const f of this.foliageReq){ (byType[f.type] ??= []).push(f); }
    const defs = {
      grass:  { geo:grassGeo(),  mat:leafMat(T.grassBlade ?? T.leaf, 0x69c04a, true) },
      fern:   { geo:fernGeo(),   mat:leafMat(T.leaf, 0x3fae5a, true) },
      flower: { geo:flowerGeo(), mat:leafMat(T.leaf, 0xffffff, true) },
    };
    for (const [type, list] of Object.entries(byType)){
      const def = defs[type]; if (!def) continue;
      const im = new THREE.InstancedMesh(def.geo, def.mat, list.length);
      im.castShadow = type!=='grass'; im.receiveShadow = false;
      list.forEach((f,i)=>{
        this._q.setFromAxisAngle(this._p.set(0,1,0), f.r);
        this._m4.compose(new THREE.Vector3(f.x, f.y, f.z), this._q, this._s.set(f.s,f.s,f.s));
        im.setMatrixAt(i, this._m4);
      });
      im.instanceMatrix.needsUpdate = true;
      this.scene.add(im);
    }
    this.foliageReq.length = 0;
  }
}
// stylized SOLID blade geometry (no alpha cards) w/ vertex-gradient color + wind sway
function blade(p, c, n, cx, rot, lean, h, w, colBase, colTip){
  // one tapered blade = 2 tris (quad narrowed at top), bent by lean
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const R = (x,z)=>[cx + x*cs - z*sn, x*sn + z*cs];
  const bendX = lean;
  const v = [];
  const b0 = R(-w, 0), b1 = R(w, 0);
  const t0 = R(-w*0.35 + bendX, 0), t1 = R(w*0.35 + bendX, 0);
  const y0 = 0, y1 = h;
  const quad = [...b0, y0, 0, ...b1, y0, 0, ...t1, y1, 0,
                ...b0, y0, 0, ...t1, y1, 0, ...t0, y1, 0];
  // wait — order: R returns [x,z]; compose vec3(x, y, z)
  const mk = (rx, rz, y)=>[rx, y, rz];
  const verts = [
    mk(b0[0], b0[1], y0), mk(b1[0], b1[1], y0), mk(t1[0], t1[1], y1),
    mk(b0[0], b0[1], y0), mk(t1[0], t1[1], y1), mk(t0[0], t0[1], y1),
  ];
  for (let i=0;i<6;i++){
    const [x,y,z] = verts[i];
    p.push(x,y,z);
    n.push(0,1,0);
    const k = y/h;
    c.push(colBase[0]+(colTip[0]-colBase[0])*k, colBase[1]+(colTip[1]-colBase[1])*k, colBase[2]+(colTip[2]-colBase[2])*k);
  }
}
function grassGeo(){
  const g = new THREE.BufferGeometry();
  const p = [], n = [], c = [];
  const base = [0.14, 0.42, 0.09], tip = [0.38, 0.72, 0.20];
  blade(p,c,n, 0, 0, 0.06, 0.34, 0.05, base, tip);
  blade(p,c,n, 0.05, 2.1, 0.12, 0.42, 0.055, base, tip);
  blade(p,c,n, -0.05, 4.2, 0.1, 0.38, 0.05, base, tip);
  g.setAttribute('position', new THREE.Float32BufferAttribute(p,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(n,3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(c,3));
  return g;
}
function fernGeo(){
  const g = new THREE.BufferGeometry();
  const p = [], n = [], c = [];
  const base = [0.12, 0.42, 0.17], tip = [0.30, 0.66, 0.32];
  for (let k=0;k<6;k++){
    const a = k/6*Math.PI*2;
    blade(p,c,n, 0, a, 0.35, 0.75, 0.09, base, tip);
    blade(p,c,n, 0, a+0.26, 0.42, 0.6, 0.07, base, tip);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(n,3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(c,3));
  return g;
}
function flowerGeo(){
  const g = new THREE.BufferGeometry();
  const p = [], n = [], c = [];
  const stemB = [0.1,0.4,0.12], stemT = [0.3,0.6,0.2];
  blade(p,c,n, 0, 0, 0.02, 0.5, 0.035, stemB, stemT);
  // bloom: 5 petal blades, warm colors
  const petB = [1.0,0.75,0.3], petT = [1.0,0.95,0.75];
  for (let k=0;k<5;k++){
    const a = k/5*Math.PI*2;
    blade(p,c,n, Math.cos(a)*0.02, a+Math.PI/2, 0.5, 0.16, 0.09, petB, petT);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(n,3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(c,3));
  return g;
}
export function leafMat(tex, tint=0xffffff, wind=false){
  const m = new THREE.MeshLambertMaterial({ vertexColors:true, side:THREE.DoubleSide });
  m.map = null;
  if (wind){
    m.onBeforeCompile = (sh)=>{
      sh.uniforms.uTime = { value: 0 };
      m.userData.shader = sh;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 wp0 = instanceMatrix * vec4(0.,0.,0.,1.);
          float sway = sin(uTime*1.7 + wp0.x*0.8 + wp0.z*0.9) * 0.06 * position.y;
          transformed.x += sway; transformed.z += sway*0.6;
        #endif`);
    };
  }
  return m;
}
export function updateWind(mats, t){
  for (const m of mats) if (m.userData.shader) m.userData.shader.uniforms.uTime.value = t;
}
