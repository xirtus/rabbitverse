// ═══ STAGE — renderer, lighting rig, procedural sky, fog ═══
import * as THREE from 'three';

export class Stage {
  constructor(container){
    this.renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, innerWidth/innerHeight, 0.1, 900);
    this.camera.position.set(0,3,8);

    // ── lighting rig: warm key sun + cool sky fill + bounce ──
    this.sun = new THREE.DirectionalLight(0xfff2d8, 3.1);
    this.sun.position.set(18, 30, 12);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1; this.sun.shadow.camera.far = 140;
    const S = 42;
    Object.assign(this.sun.shadow.camera, { left:-S, right:S, top:S, bottom:-S });
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun, this.sun.target);

    this.hemi = new THREE.HemisphereLight(0x9fd8ff, 0x6a9f5e, 1.05);
    this.scene.add(this.hemi);
    this.bounce = new THREE.DirectionalLight(0xffd9a8, 0.65);
    this.bounce.position.set(-14, 8, -18);
    this.scene.add(this.bounce);

    // ── procedural sky dome (gradient + sun glow + drifting clouds) ──
    this.sky = this._makeSky();
    this.scene.add(this.sky);

    this.scene.fog = new THREE.Fog(0xcfe4f2, 60, 320);
    addEventListener('resize', ()=>this._resize());
  }
  _makeSky(){
    const geo = new THREE.SphereGeometry(780, 32, 20);
    this.skyUniforms = {
      topColor:    { value: new THREE.Color(0x2f7fe0) },
      midColor:    { value: new THREE.Color(0x8fd4ff) },
      bottomColor: { value: new THREE.Color(0xffe9c4) },
      sunDir:      { value: new THREE.Vector3(0.45,0.55,0.3).normalize() },
      sunColor:    { value: new THREE.Color(0xfff3c8) },
      uTime:       { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite:false, fog:false,
      uniforms: this.skyUniforms,
      vertexShader:/*glsl*/`
        varying vec3 vDir;
        void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader:/*glsl*/`
        varying vec3 vDir;
        uniform vec3 topColor, midColor, bottomColor, sunColor, sunDir;
        uniform float uTime;
        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
        float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.1; a*=.5; } return v; }
        void main(){
          float h = clamp(vDir.y, -0.08, 1.0);
          vec3 col = mix(bottomColor, midColor, smoothstep(-0.08, 0.22, h));
          col = mix(col, topColor, smoothstep(0.18, 0.75, h));
          float sd = max(dot(vDir, sunDir), 0.0);
          col += sunColor * (pow(sd, 900.0)*1.6 + pow(sd, 24.0)*0.28 + pow(sd,4.0)*0.10);
          // stylized flat-ish clouds
          vec2 cuv = vDir.xz/(0.25+vDir.y);
          float cl = fbm(cuv*1.4 + vec2(uTime*0.008, 0.0));
          float mask = smoothstep(0.58, 0.72, cl) * smoothstep(0.02, 0.24, vDir.y);
          col = mix(col, vec3(1.0,0.98,0.95), mask*0.85);
          // horizon warmth
          col += vec3(1.0,0.75,0.45)*pow(1.0-abs(vDir.y),6.0)*0.18;
          gl_FragColor = vec4(col, 1.0);
        }`
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    return mesh;
  }
  setSkyMood({top, mid, bottom, sun, hemiSky, hemiGround, fog, fogNear, fogFar, exposure}){
    const U = this.skyUniforms;
    if (top) U.topColor.value.set(top);
    if (mid) U.midColor.value.set(mid);
    if (bottom) U.bottomColor.value.set(bottom);
    if (sun) this.sun.color.set(sun);
    if (hemiSky) this.hemi.color.set(hemiSky);
    if (hemiGround) this.hemi.groundColor.set(hemiGround);
    if (fog){ this.scene.fog.color.set(fog); }
    if (fogNear!==undefined) this.scene.fog.near = fogNear;
    if (fogFar!==undefined) this.scene.fog.far = fogFar;
    if (exposure!==undefined) this.renderer.toneMappingExposure = exposure;
  }
  followShadow(target){
    // glue shadow frustum to player, snapped to texel grid (no shimmer)
    const S = 42, texel = (S*2)/2048;
    const qx = Math.round(target.x/texel)*texel;
    const qz = Math.round(target.z/texel)*texel;
    this.sun.position.set(qx+18, target.y+30, qz+12);
    this.sun.target.position.set(qx, target.y, qz);
  }
  update(t){ this.skyUniforms.uTime.value = t; if (this.sky) this.sky.position.copy(this.camera.position); }
  _resize(){
    this.camera.aspect = innerWidth/innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    if (this.onResize) this.onResize();
  }
  render(){ this.renderer.render(this.scene, this.camera); }
}
