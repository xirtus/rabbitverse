// ═══ PARTICLES — pooled point sprites + pooled mesh debris + shockwaves ═══
import * as THREE from 'three';

const VERT = /*glsl*/`
attribute float aSize; attribute vec3 aColor; attribute float aAlpha; attribute float aSpin;
varying vec3 vColor; varying float vAlpha; varying float vSpin;
void main(){
  vColor = aColor; vAlpha = aAlpha; vSpin = aSpin;
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  gl_PointSize = aSize * (240.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /*glsl*/`
varying vec3 vColor; varying float vAlpha; varying float vSpin;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float c = cos(vSpin), s = sin(vSpin);
  uv = mat2(c,-s,s,c)*uv;
  float d = length(uv);
  float a = smoothstep(0.5, 0.12, d) * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}`;

export class Particles {
  constructor(scene, max = 2600){
    this.max = max;
    this.pos = new Float32Array(max*3);
    this.vel = new Float32Array(max*3);
    this.col = new Float32Array(max*3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.spin = new Float32Array(max);
    this.spinV = new Float32Array(max);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.baseSize = new Float32Array(max);
    this.head = 0; this.alive = 0;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aSpin', new THREE.BufferAttribute(this.spin, 1).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.ShaderMaterial({ vertexShader:VERT, fragmentShader:FRAG,
      transparent:true, depthWrite:false, blending:THREE.NormalBlending });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this._c = new THREE.Color();

    // pooled debris meshes (wood chips, rocks)
    this.debrisPool = [];
    this.debris = [];
    const dgeo = new THREE.BoxGeometry(0.16,0.16,0.05);
    for (let i=0;i<120;i++){
      const m = new THREE.Mesh(dgeo, new THREE.MeshStandardMaterial({ color:0xb0703a, roughness:0.9 }));
      m.visible = false; m.castShadow = false; scene.add(m);
      this.debrisPool.push(m);
    }
    // pooled shockwave rings
    this.rings = [];
    const rgeo = new THREE.TorusGeometry(1, 0.07, 8, 40);
    for (let i=0;i<8;i++){
      const m = new THREE.Mesh(rgeo, new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0 }));
      m.rotation.x = -Math.PI/2; m.visible = false; scene.add(m);
      this.rings.push({ mesh:m, t:1, dur:1, maxR:1 });
    }
  }
  spawn(x,y,z, vx,vy,vz, { color=0xffffff, size=0.3, life=0.8, grav=9, drag=1.5, spin=0 }={}){
    const i = this.head; this.head = (this.head+1)%this.max;
    this.pos[i*3]=x; this.pos[i*3+1]=y; this.pos[i*3+2]=z;
    this.vel[i*3]=vx; this.vel[i*3+1]=vy; this.vel[i*3+2]=vz;
    this._c.set(color);
    this.col[i*3]=this._c.r; this.col[i*3+1]=this._c.g; this.col[i*3+2]=this._c.b;
    this.baseSize[i]=size; this.size[i]=size;
    this.life[i]=life; this.maxLife[i]=life; this.alpha[i]=1;
    this.grav[i]=grav; this.drag[i]=drag;
    this.spin[i]=Math.random()*6.28; this.spinV[i]=spin*(Math.random()-0.5)*2;
  }
  burst(p, n, opt={}){
    const { speed=4, up=2, spread=1 } = opt;
    for (let i=0;i<n;i++){
      const a = Math.random()*6.283, r = (0.3+Math.random()*0.7)*speed;
      this.spawn(p.x, p.y, p.z,
        Math.cos(a)*r*spread, up*(0.4+Math.random()*0.9), Math.sin(a)*r*spread, opt);
    }
  }
  dust(p, n=8, color=0xd8c8a8){ this.burst(p,n,{ color, size:0.42, life:0.55, speed:2.2, up:1.6, grav:2.5, drag:3.2, spread:1 }); }
  sparkle(p, n=10, color=0xffd23e){ this.burst(p,n,{ color, size:0.3, life:0.7, speed:3, up:2.4, grav:4, drag:1.2 }); }
  starBurst(p, n=14, color=0xfff1a8){ this.burst(p,n,{ color, size:0.5, life:0.8, speed:5, up:3.4, grav:7, drag:1, spin:9 }); }
  smoke(p, n=10, color=0x777788){ this.burst(p,n,{ color, size:0.7, life:1.1, speed:1.6, up:2.6, grav:-1.2, drag:2.4 }); }
  fireball(p, n=16){ this.burst(p,n,{ color:0xff7a2e, size:0.65, life:0.5, speed:6, up:3, grav:2, drag:2.6 }); this.burst(p,8,{ color:0xffe45e, size:0.4, life:0.4, speed:8, up:4, grav:2, drag:2 }); }
  confetti(p, n=24){
    const cols=[0xff5d8e,0xffd23e,0x4fe3ff,0x8dff5e,0xc08bff];
    for (let i=0;i<n;i++) this.burst(p,1,{ color:cols[i%cols.length], size:0.34, life:1.3, speed:5.5, up:5, grav:8, drag:1.4, spin:14 });
  }
  chips(p, n=8, color=0xb0703a, big=false){
    for (let i=0;i<n;i++){
      const m = this.debrisPool.find(d=>!d.visible); if (!m) return;
      m.material.color.set(color);
      const s = big ? 0.8+Math.random()*1.4 : 0.5+Math.random()*0.8;
      m.scale.set(s,s,s); m.position.copy(p); m.visible = true;
      const a = Math.random()*6.283;
      this.debris.push({ m, vx:Math.cos(a)*(2+Math.random()*4), vy:3+Math.random()*4, vz:Math.sin(a)*(2+Math.random()*4),
        rx:(Math.random()-0.5)*12, ry:(Math.random()-0.5)*12, t:1.4+Math.random()*0.5 });
    }
  }
  ring(p, r=1.2, color=0x9feaff){ this.shockwave(p, r*1.5, color, 0.32); }
  shockwave(p, maxR=3, color=0xffffff, dur=0.45){
    const r = this.rings.find(r=>r.t>=r.dur); if (!r) return;
    r.mesh.material.color.set(color);
    r.mesh.position.copy(p); r.mesh.position.y += 0.12;
    r.t = 0; r.dur = dur; r.maxR = maxR; r.mesh.visible = true;
  }
  update(dt){
    // points
    for (let i=0;i<this.max;i++){
      if (this.life[i] <= 0){ this.alpha[i]=0; continue; }
      this.life[i] -= dt;
      const k = Math.max(0, this.life[i]/this.maxLife[i]);
      const d = Math.max(0, 1 - this.drag[i]*dt);
      this.vel[i*3]*=d; this.vel[i*3+2]*=d;
      this.vel[i*3+1] -= this.grav[i]*dt;
      this.pos[i*3]   += this.vel[i*3]*dt;
      this.pos[i*3+1] += this.vel[i*3+1]*dt;
      this.pos[i*3+2] += this.vel[i*3+2]*dt;
      this.alpha[i] = k*k; this.size[i] = this.baseSize[i]*(0.6+0.4*k);
      this.spin[i] += this.spinV[i]*dt;
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aColor.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;
    g.attributes.aSpin.needsUpdate = true;
    // debris
    for (let i=this.debris.length-1;i>=0;i--){
      const d = this.debris[i];
      d.t -= dt; d.vy -= 16*dt;
      d.m.position.x += d.vx*dt; d.m.position.y += d.vy*dt; d.m.position.z += d.vz*dt;
      d.m.rotation.x += d.rx*dt; d.m.rotation.y += d.ry*dt;
      if (d.t <= 0 || d.m.position.y < -30){ d.m.visible = false; this.debris.splice(i,1); }
    }
    // rings
    for (const r of this.rings){
      if (r.t >= r.dur){ r.mesh.visible = false; continue; }
      r.t += dt;
      const k = Math.min(1, r.t/r.dur);
      const e = 1-Math.pow(1-k,3);
      r.mesh.scale.setScalar(0.2+e*r.maxR);
      r.mesh.material.opacity = (1-k)*0.85;
    }
  }
}
