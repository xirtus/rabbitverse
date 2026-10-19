// ═══ DECO — instanced trees, giant ferns, waterfalls, mountains, critters ═══
import * as THREE from 'three';

export class Deco {
  constructor(scene, mats){
    this.scene = scene; this.mats = mats;
    this.trees = []; this.bigFerns = []; this.rocks = [];
    this.updaters = [];
  }
  tree(x, y, z, s=1, hue=0){ this.trees.push({x,y,z,s,hue}); }
  bigFern(x, y, z, s=1){ this.bigFerns.push({x,y,z,s}); }
  rockD(x, y, z, s=1){ this.rocks.push({x,y,z,s}); }

  build(T){
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    // ── trees: instanced trunks + two-tone canopies ──
    if (this.trees.length){
      const trunkG = new THREE.CylinderGeometry(0.26, 0.5, 3.0, 7);
      const trunkM = new THREE.MeshStandardMaterial({ map:T.bark ?? null, color:0x8a5a33, roughness:0.95 });
      const trunks = new THREE.InstancedMesh(trunkG, trunkM, this.trees.length);
      const canG = new THREE.IcosahedronGeometry(1.5, 1);
      const canM = new THREE.MeshLambertMaterial({ color:0xffffff });
      const cans = new THREE.InstancedMesh(canG, canM, this.trees.length*2);
      const col = new THREE.Color();
      this.trees.forEach((t,i)=>{
        q.setFromAxisAngle(p.set(0,1,0), Math.random()*6.28);
        m4.compose(p.set(t.x, t.y+1.5*t.s, t.z).clone(), q, sc.set(t.s,t.s,t.s));
        trunks.setMatrixAt(i, m4);
        col.setHSL(0.26 + t.hue*0.05 + Math.random()*0.06, 0.66, 0.34+Math.random()*0.12);
        m4.compose(p.set(t.x, t.y+(3.0+1.1)*t.s, t.z).clone(), q, sc.set(t.s*1.5,t.s*1.2,t.s*1.5));
        cans.setMatrixAt(i*2, m4); cans.setColorAt(i*2, col);
        col.offsetHSL(0.03, 0, 0.09);
        m4.compose(p.set(t.x+0.7*t.s, t.y+(3.0+1.9)*t.s, t.z+0.4*t.s).clone(), q, sc.set(t.s*0.95,t.s*0.85,t.s*0.95));
        cans.setMatrixAt(i*2+1, m4); cans.setColorAt(i*2+1, col);
      });
      trunks.castShadow = true; cans.castShadow = true;
      trunks.instanceMatrix.needsUpdate = cans.instanceMatrix.needsUpdate = true;
      if (cans.instanceColor) cans.instanceColor.needsUpdate = true;
      this.scene.add(trunks, cans);
    }
    // ── giant prehistoric ferns ──
    if (this.bigFerns.length){
      const g = new THREE.ConeGeometry(0.5, 3.2, 5, 1, true);
      g.translate(0, 1.6, 0);
      const m = new THREE.MeshLambertMaterial({ color:0x55c988, side:THREE.DoubleSide });
      const im = new THREE.InstancedMesh(g, m, this.bigFerns.length*6);
      const col = new THREE.Color();
      let k = 0;
      for (const f of this.bigFerns){
        for (let i=0;i<6;i++){
          const a = i/6*Math.PI*2 + f.x;
          q.setFromEuler(new THREE.Euler(0.55, a, 0, 'YXZ'));
          m4.compose(p.set(f.x, f.y, f.z).clone(), q, sc.set(f.s,f.s,f.s));
          im.setMatrixAt(k, m4);
          col.setHSL(0.38+Math.random()*0.06, 0.5, 0.38+Math.random()*0.14);
          im.setColorAt(k, col); k++;
        }
      }
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      this.scene.add(im);
    }
    // ── rocks ──
    if (this.rocks.length){
      const g = new THREE.IcosahedronGeometry(0.6, 0);
      const m = new THREE.MeshStandardMaterial({ map:T.rock, roughness:0.95 });
      const im = new THREE.InstancedMesh(g, m, this.rocks.length);
      this.rocks.forEach((r,i)=>{
        q.setFromEuler(new THREE.Euler(Math.random(), Math.random()*6, Math.random()));
        m4.compose(p.set(r.x, r.y+0.2*r.s, r.z).clone(), q, sc.set(r.s, r.s*0.7, r.s));
        im.setMatrixAt(i, m4);
      });
      im.instanceMatrix.needsUpdate = true;
      im.castShadow = true; im.receiveShadow = true;
      this.scene.add(im);
    }
  }
  // ── animated waterfall ──
  waterfall(x, y, z, w, h){
    const uniforms = { uTime:{ value:0 } };
    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, side:THREE.DoubleSide,
      uniforms,
      vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`
        varying vec2 vUv; uniform float uTime;
        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
        void main(){
          vec2 uv = vUv;
          float n = noise(vec2(uv.x*8.0, uv.y*3.0 - uTime*1.4));
          n += noise(vec2(uv.x*20.0, uv.y*8.0 - uTime*2.6))*0.5;
          float streak = smoothstep(0.35, 0.9, n);
          vec3 col = mix(vec3(0.55,0.8,0.95), vec3(1.0), streak);
          float edge = smoothstep(0.0,0.12,uv.x)*smoothstep(1.0,0.88,uv.x);
          float a = (0.55 + streak*0.45) * edge * smoothstep(0.0,0.06,uv.y)*smoothstep(1.0,0.94,uv.y);
          gl_FragColor = vec4(col, a);
        }`
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    const foam = new THREE.Mesh(new THREE.CircleGeometry(w*0.75, 24),
      new THREE.MeshBasicMaterial({ color:0xeafcff, transparent:true, opacity:0.75 }));
    foam.rotation.x = -Math.PI/2;
    foam.position.set(x, y - h/2 + 0.06, z + 0.4);
    this.scene.add(foam);
    this.updaters.push((dt,t)=>{
      uniforms.uTime.value = t;
      foam.scale.setScalar(1 + Math.sin(t*2.2)*0.06);
      foam.material.opacity = 0.6 + Math.sin(t*3.1)*0.12;
    });
    return mesh;
  }
  // ── distant vista: painted mountain cones + volcano ──
  vista(){
    const g = new THREE.ConeGeometry(1, 1, 6);
    const m = new THREE.MeshLambertMaterial({ color:0x7a9cc8, fog:true });
    const im = new THREE.InstancedMesh(g, m, 26);
    const caps = new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,6),
      new THREE.MeshLambertMaterial({ color:0xfff4ea, fog:true }), 26);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    const col = new THREE.Color();
    for (let i=0;i<26;i++){
      const a = i/26*Math.PI*2 + Math.sin(i*7)*0.35;
      const r = 330 + (i%5)*52 + Math.sin(i*3)*26;
      const h = 60 + (i*37%85);
      q.identity();
      m4.compose(p.set(Math.cos(a)*r, h/2-14, Math.sin(a)*r), q, sc.set(46+(i%4)*20, h, 46+(i%4)*20));
      im.setMatrixAt(i, m4);
      col.setHSL(0.52+(i%3)*0.03, 0.42, 0.45 + (i%3)*0.06);
      im.setColorAt(i, col);
      const ch = h*0.24;
      m4.compose(p.set(Math.cos(a)*r, (h-14)-ch/2+2, Math.sin(a)*r), q, sc.set((46+(i%4)*20)*0.30, ch, (46+(i%4)*20)*0.30));
      caps.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true; caps.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    this.scene.add(im, caps);
    // volcano with smoke glow
    const vol = new THREE.Mesh(new THREE.ConeGeometry(60, 90, 8, 1, true),
      new THREE.MeshLambertMaterial({ color:0x8a6a7a }));
    vol.position.set(160, 20, -260);
    const crater = new THREE.Mesh(new THREE.CylinderGeometry(14, 18, 6, 8),
      new THREE.MeshBasicMaterial({ color:0xff6a3c }));
    crater.position.set(160, 66, -260);
    this.scene.add(vol, crater);
  }
  // ── butterflies ──
  butterflies(n, cx, cy, cz, range){
    const g = new THREE.PlaneGeometry(0.09, 0.07);
    const cols = [0xffd23e, 0xff8ad8, 0x8af4ff, 0xffa63c];
    const m = new THREE.MeshBasicMaterial({ color:cols[0], side:THREE.DoubleSide });
    const group = new THREE.Group();
    const items = [];
    for (let i=0;i<n;i++){
      const b = new THREE.Group();
      const bm = new THREE.MeshBasicMaterial({ color:cols[i%cols.length], side:THREE.DoubleSide });
      const w1 = new THREE.Mesh(g, bm), w2 = new THREE.Mesh(g, bm);
      w1.position.x = -0.045; w2.position.x = 0.045;
      b.add(w1, w2); group.add(b);
      items.push({ b, w1, w2, ph:Math.random()*9,
        c:new THREE.Vector3(cx+(Math.random()-0.5)*range, cy+Math.random()*2.5, cz+(Math.random()-0.5)*range) });
    }
    this.scene.add(group);
    this.updaters.push((dt,t)=>{
      for (const it of items){
        it.b.position.set(
          it.c.x + Math.sin(t*0.7+it.ph)*1.6,
          it.c.y + Math.sin(t*1.3+it.ph*2)*0.7,
          it.c.z + Math.cos(t*0.5+it.ph)*1.6);
        const f = Math.sin(t*18+it.ph)*0.9;
        it.w1.rotation.y = f; it.w2.rotation.y = -f;
        it.b.rotation.y = t*0.5+it.ph;
      }
    });
  }
  update(dt, t){ for (const u of this.updaters) u(dt, t); }
}
