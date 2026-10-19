// ═══ POST — bloom + vignette + grade: the "real game" multiplier ═══
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const GradeShader = {
  uniforms: { tDiffuse:{ value:null }, uVig:{ value:0.32 }, uSat:{ value:1.09 }, uLift:{ value:0.012 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: /*glsl*/`
    uniform sampler2D tDiffuse; uniform float uVig, uSat, uLift;
    varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      // gentle saturation boost
      float l = dot(c.rgb, vec3(0.2126,0.7152,0.0722));
      c.rgb = mix(vec3(l), c.rgb, uSat);
      // slight warm lift in shadows (filmic cheer)
      c.rgb += uLift * vec3(1.0, 0.9, 0.75) * (1.0 - l);
      // vignette
      vec2 q = vUv - 0.5;
      c.rgb *= 1.0 - uVig * smoothstep(0.28, 0.72, dot(q,q)*2.0);
      gl_FragColor = c;
    }`
};

export class Post {
  constructor(stage){
    this.stage = stage;
    const { renderer, scene, camera } = stage;
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.21, 0.5, 0.9);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
    this.enabled = true;
    stage.onResize = ()=> this.composer.setSize(innerWidth, innerHeight);
  }
  render(){
    if (this.enabled) this.composer.render();
    else this.stage.renderer.render(this.stage.scene, this.stage.camera);
  }
}
