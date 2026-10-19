// ═══ WATER — animated cartoon ocean filling the void ═══
import * as THREE from 'three';

export class Water {
  constructor(scene, y=-8){
    this.uniforms = {
      uTime:{ value:0 },
      uDeep:{ value: new THREE.Color(0x1a6ab8) },
      uShallow:{ value: new THREE.Color(0x3fd4d8) },
      uSun:{ value: new THREE.Vector3(0.45,0.55,0.3).normalize() },
    };
    const geo = new THREE.PlaneGeometry(1400, 1400, 90, 90);
    geo.rotateX(-Math.PI/2);
    const mat = new THREE.ShaderMaterial({
      transparent: true, fog:false,
      uniforms: this.uniforms,
      vertexShader:/*glsl*/`
        uniform float uTime;
        varying vec3 vPos; varying float vWave;
        void main(){
          vec3 p = position;
          float w = sin(p.x*0.08 + uTime*1.1) * cos(p.z*0.06 + uTime*0.9) * 0.7
                  + sin(p.x*0.02 + uTime*0.5) * 1.1;
          p.y += w;
          vWave = w;
          vPos = (modelMatrix * vec4(p,1.)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.);
        }`,
      fragmentShader:/*glsl*/`
        uniform float uTime; uniform vec3 uDeep, uShallow, uSun;
        varying vec3 vPos; varying float vWave;
        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        void main(){
          float k = smoothstep(-1.4, 1.6, vWave);
          vec3 col = mix(uDeep, uShallow, k);
          // stylized crest caps
          float cap = smoothstep(0.86, 1.05, vWave);
          col = mix(col, vec3(0.95,1.0,1.0), cap*0.5);
          // sun glint sparkles
          vec2 gp = floor(vPos.xz*2.0);
          float sp = hash(gp + floor(uTime*3.0)*0.13);
          if (sp > 0.994) col += vec3(1.0,0.95,0.7)*0.65;
          // distance fade into horizon
          float d = length(vPos.xz);
          col = mix(col, vec3(0.85,0.93,1.0), smoothstep(150.0, 600.0, d));
          gl_FragColor = vec4(col, 0.94);
        }`
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.y = y;
    scene.add(this.mesh);
  }
  update(t){ this.uniforms.uTime.value = t; }
}
