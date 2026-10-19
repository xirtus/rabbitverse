// ═══ PORTAL — dimensional rift: swirl shader, suction particles, traversal ═══
import * as THREE from 'three';
import { audio } from '../core/Audio.js';

export class Portal {
  constructor(scene, fx, x, y, z, { hue=0.52, label='' }={}){
    this.fx = fx;
    this.pos = new THREE.Vector3(x, y, z);
    this.group = new THREE.Group();
    this.group.position.copy(this.pos);
    this.uniforms = {
      uTime:{ value:0 },
      uHue:{ value:hue },
      uOpen:{ value:0 },
    };
    // swirl disc
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.7, 48),
      new THREE.ShaderMaterial({
        transparent:true, side:THREE.DoubleSide, depthWrite:false,
        uniforms:this.uniforms,
        vertexShader:`varying vec2 vUv; void main(){ vUv=uv*2.-1.; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`
          varying vec2 vUv; uniform float uTime, uHue, uOpen;
          vec3 hsv(vec3 c){ vec4 K=vec4(1.,2./3.,1./3.,3.);
            vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);
            return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y); }
          void main(){
            float r = length(vUv);
            if (r > 1.0) discard;
            float a = atan(vUv.y, vUv.x);
            float swirl = sin(a*4.0 - uTime*3.0 + r*14.0)*0.5+0.5;
            float swirl2 = sin(a*7.0 + uTime*2.0 - r*20.0)*0.5+0.5;
            vec3 col = hsv(vec3(uHue + swirl*0.08 - r*0.1, 0.75, 0.4 + swirl*0.6));
            col += hsv(vec3(uHue+0.12, 0.9, 1.0)) * swirl2 * (1.0-r) * 0.7;
            float core = smoothstep(0.32, 0.0, r);
            col = mix(col, vec3(1.0), core*0.85);
            float edge = smoothstep(1.0, 0.86, r);
            float alpha = (0.75 + swirl*0.25) * edge * uOpen;
            gl_FragColor = vec4(col, alpha);
          }`
      }));
    // rocky/energy frame
    const frame = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.22, 10, 40),
      new THREE.MeshStandardMaterial({ color:0x6a4a9a, roughness:0.5, emissive:0x2a1a5a, emissiveIntensity:0.5 }));
    const glow = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.06, 8, 40),
      new THREE.MeshBasicMaterial({ color:0x9feaff }));
    this.group.add(disc, frame, glow);
    // orbiting shards
    this.shards = new THREE.Group();
    const sg = new THREE.TetrahedronGeometry(0.14);
    const sm = new THREE.MeshBasicMaterial({ color:0xc09fff });
    for (let i=0;i<7;i++){
      const s = new THREE.Mesh(sg, sm);
      s.userData.a = i/7*Math.PI*2;
      this.shards.add(s);
    }
    this.group.add(this.shards);
    scene.add(this.group);
    this.t = 0; this.open = false; this.entered = false;
    this.baseY = y;
    this.group.visible = false;
    this._pop = 0;
  }
  setOpen(v){
    this.open = v;
    if (v && !this.group.visible){
      this.group.visible = true; this._pop = 0.001;
      if (this.fx) this.fx.shockwave(this.pos, 4, 0x9feaff, 0.6);
    }
  }
  update(dt, playerPos=null){
    this.t += dt;
    this.uniforms.uTime.value = this.t;
    const target = this.open ? 1 : 0;
    const u = this.uniforms.uOpen;
    u.value += (target - u.value)*Math.min(1, dt*2.5);
    if (this._pop > 0 && this._pop < 1){
      this._pop = Math.min(1, this._pop + dt*1.8);
      const e = 1 - Math.pow(1-this._pop, 3);
      this.group.scale.setScalar(0.2 + e*0.8);
    }
    this.group.position.y = this.baseY + Math.sin(this.t*1.4)*0.15;
    this.group.rotation.z = Math.sin(this.t*0.6)*0.04;
    for (const s of this.shards.children){
      const a = s.userData.a + this.t*0.9;
      const r = 2.25 + Math.sin(this.t*2 + s.userData.a)*0.12;
      s.position.set(Math.cos(a)*r, Math.sin(a)*r, 0);
      s.rotation.x = this.t*2; s.rotation.y = this.t*1.3;
      s.scale.setScalar(u.value);
    }
    // suction particles
    if (this.open && Math.random() < dt*40 && this.fx){
      const a = Math.random()*6.28, r = 2+Math.random()*2;
      this.fx.spawn(
        this.pos.x + Math.cos(a)*r, this.pos.y + Math.sin(a)*r, this.pos.z + (Math.random()-0.5)*0.5,
        -Math.cos(a)*r*1.4, -Math.sin(a)*r*1.4, 0,
        { color:0x9feaff, size:0.22, life:0.7, grav:0, drag:0.2 });
    }
    // enter check: horizontal ring distance, tolerant vertically
    if (this.open && !this.entered && playerPos){
      const dh = Math.hypot(playerPos.x - this.pos.x, playerPos.z - this.pos.z);
      const dv = Math.abs(playerPos.y + 0.8 - this.pos.y);
      if (dh < 1.7 && dv < 2.6){
        this.entered = true;
        audio.portal();
        return true;
      }
    }
    return false;
  }
}
