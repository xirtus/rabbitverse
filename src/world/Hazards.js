// ═══ HAZARDS — swinging logs, spinners (time-slowable) ═══
import * as THREE from 'three';

export class Hazards {
  constructor(scene, world, fx){
    this.scene = scene; this.world = world; this.fx = fx;
    this.items = [];
  }
  // rotating spiked bar around a pivot — classic timing hazard
  spinner(x, y, z, len=3.4, speed=1.6, phase=0){
    const g = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.5,10),
      new THREE.MeshStandardMaterial({ color:0x8a5a33, roughness:0.8 }));
    const armM = new THREE.MeshStandardMaterial({ color:0xb0703a, roughness:0.75 });
    const spikeM = new THREE.MeshStandardMaterial({ color:0xe8e8f0, roughness:0.35 });
    const arm = new THREE.Mesh(new THREE.BoxGeometry(len*2, 0.22, 0.22), armM);
    arm.castShadow = true;
    g.add(hub, arm);
    for (let i=0;i<8;i++){
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 6), spikeM);
      const s = i%2 ? 1 : -1;
      sp.position.set(-len + 0.4 + i*(len*2-0.8)/7, 0.26*s, 0);
      if (s<0) sp.rotation.x = Math.PI;
      g.add(sp);
    }
    g.position.set(x, y, z);
    this.scene.add(g);
    this.items.push({ kind:'spinner', g, x, y, z, len, speed, phase, a:phase });
  }
  // pendulum log
  pendulum(x, y, z, len=4, speed=1.2, phase=0){
    const g = new THREE.Group();
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,len,6),
      new THREE.MeshStandardMaterial({ color:0x6e4520 }));
    rope.position.y = -len/2;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.34,1.6,10),
      new THREE.MeshStandardMaterial({ color:0x8a5a33, roughness:0.85 }));
    log.rotation.z = Math.PI/2; log.position.y = -len;
    log.castShadow = true;
    g.add(rope, log);
    g.position.set(x, y, z);
    this.scene.add(g);
    this.items.push({ kind:'pendulum', g, x, y, z, len, speed, phase, log, a:phase });
  }
  // falling icicle: telegraph shake → drop → shatter → respawn
  icicle(x, y, z, groundY, triggerR=2.6){
    const g = new THREE.Group();
    const ice = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.3, 7),
      new THREE.MeshStandardMaterial({ color:0xbfe8ff, roughness:0.15, metalness:0.05,
        emissive:0x2a6a9a, emissiveIntensity:0.3, transparent:true, opacity:0.95 }));
    ice.rotation.x = Math.PI; // point down
    g.add(ice);
    g.position.set(x, y, z);
    this.scene.add(g);
    this.items.push({ kind:'icicle', g, ice, x, y, z, groundY, triggerR, state:'idle', t:0, vy:0 });
  }
  // timed fire jet: off → warn glow → erupt (damage) → off; phase-offset clocks
  fireJet(x, y, z, phase=0, period=3.4){
    const g = new THREE.Group();
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.3, 8),
      new THREE.MeshStandardMaterial({ color:0x3a2a22, roughness:0.8, emissive:0xff5a00, emissiveIntensity:0.15 }));
    nozzle.position.y = 0.15;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.7, 8),
      new THREE.MeshBasicMaterial({ color:0xff7a1e, transparent:true, opacity:0,
        blending:THREE.AdditiveBlending, depthWrite:false }));
    flame.position.y = 1.1;
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.5, 7),
      new THREE.MeshBasicMaterial({ color:0xfff0b0, transparent:true, opacity:0,
        blending:THREE.AdditiveBlending, depthWrite:false }));
    core.position.y = 1.0;
    g.add(nozzle, flame, core);
    g.position.set(x, y, z);
    this.scene.add(g);
    this.items.push({ kind:'firejet', g, flame, core, nozzle, x, y, z, phase, period, t:phase });
  }
  // track saw: slides between two points, menacing spin
  saw(x0, y0, z0, x1, y1, z1, speed=1.6){
    const g = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 18),
      new THREE.MeshStandardMaterial({ color:0xb8c4d8, roughness:0.25, metalness:0.6 }));
    blade.rotation.x = Math.PI/2;
    g.add(blade);
    for (let i=0;i<8;i++){
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 4),
        new THREE.MeshStandardMaterial({ color:0x8a94a8, metalness:0.6, roughness:0.3 }));
      const a = i/8*Math.PI*2;
      tooth.position.set(Math.cos(a)*0.68, 0, Math.sin(a)*0.68);
      tooth.rotation.set(0, 0, -Math.PI/2);
      tooth.rotation.y = -a;
      g.add(tooth);
    }
    g.position.set(x0, y0, z0);
    this.scene.add(g);
    this.items.push({ kind:'saw', g, blade, x0,y0,z0, x1,y1,z1, speed, t:Math.random() });
  }
  update(dt, t, player, game){
    const slowK = player.timeSlow > 0 ? 0.25 : 1;
    const pp = player.pos;
    for (const h of this.items){
      if (h.kind === 'icicle'){
        const dxz = Math.hypot(pp.x-h.x, pp.z-h.z);
        if (h.state === 'idle'){
          if (dxz < h.triggerR && pp.y < h.y){ h.state = 'shake'; h.t = 0; }
        } else if (h.state === 'shake'){
          h.t += dt*slowK;
          h.g.position.x = h.x + Math.sin(h.t*44)*0.05*Math.min(1, h.t*2);
          if (h.t > 0.55){ h.state = 'fall'; h.vy = 0; }
        } else if (h.state === 'fall'){
          h.vy += 34*dt*slowK;
          h.g.position.y -= h.vy*dt*slowK;
          if (!player.dead && dxz < 0.75 && Math.abs(pp.y + 0.6 - h.g.position.y) < 1.1){
            if (player.hurt(h.x, h.z)) game.camRig.impulse(0.5);
          }
          if (h.g.position.y <= h.groundY + 0.2){
            h.state = 'gone'; h.t = 0;
            h.g.visible = false;
            this.fx.shards ? this.fx.shards(h.g.position) : null;
            this.fx.dust(h.g.position, 6, 0xbfe8ff);
            this.fx.sparkle(h.g.position, 6, 0xbfe8ff);
          }
        } else if (h.state === 'gone'){
          h.t += dt;
          if (h.t > 4){ h.state = 'idle'; h.g.visible = true; h.g.position.set(h.x, h.y, h.z); }
        }
        continue;
      }
      if (h.kind === 'firejet'){
        h.t += dt*slowK;
        const cyc = (h.t % h.period) / h.period;   // 0..1
        // 0-0.5 off, 0.5-0.68 warn, 0.68-1 erupt
        const warn = cyc > 0.5 && cyc <= 0.68;
        const erupt = cyc > 0.68;
        h.nozzle.material.emissiveIntensity = warn ? 1.4 + Math.sin(t*30)*0.5 : (erupt ? 0.8 : 0.15);
        const target = erupt ? 0.92 : 0;
        h.flame.material.opacity += (target - h.flame.material.opacity)*Math.min(1, dt*14);
        h.core.material.opacity = h.flame.material.opacity*0.9;
        if (erupt){
          h.flame.scale.y = 1 + Math.sin(t*26 + h.phase)*0.14;
          h.core.scale.y = 1 + Math.cos(t*22 + h.phase)*0.1;
          if (Math.random() < dt*20*slowK)
            this.fx.spawn(h.x, h.y+1.2, h.z, (Math.random()-0.5)*1.4, 3+Math.random()*2, (Math.random()-0.5)*1.4,
              { color: Math.random()<0.5?0xff8c2e:0xffd23e, size:0.3, life:0.5, grav:-2, drag:1 });
          if (!player.dead && Math.hypot(pp.x-h.x, pp.z-h.z) < 0.85 && pp.y - h.y < 1.9 && pp.y > h.y - 0.5){
            if (player.hurt(h.x, h.z)) game.camRig.impulse(0.5);
          }
        }
        continue;
      }
      if (h.kind === 'saw'){
        h.t += dt*h.speed*slowK*0.5;
        const k = (Math.sin(h.t)+1)/2;
        h.g.position.set(h.x0+(h.x1-h.x0)*k, h.y0+(h.y1-h.y0)*k, h.z0+(h.z1-h.z0)*k);
        h.g.rotation.z += dt*14*slowK;
        if (!player.dead){
          const d = Math.hypot(pp.x-h.g.position.x, pp.z-h.g.position.z);
          if (d < 0.95 && Math.abs(pp.y + 0.6 - h.g.position.y) < 0.95){
            if (player.hurt(h.g.position.x, h.g.position.z)) game.camRig.impulse(0.5);
          }
        }
        continue;
      }
      h.a += dt * h.speed * slowK;
      if (h.kind === 'spinner'){
        h.g.rotation.y = h.a;
        // hit check: player near arm line
        const pp = player.pos;
        const dx = pp.x - h.x, dz = pp.z - h.z;
        const d = Math.hypot(dx, dz);
        if (d < h.len + 0.3 && d > 0.3 && Math.abs(pp.y + 0.6 - h.y) < 0.75){
          // angle of arm vs angle of player
          const armA = h.a % Math.PI;
          let pa = Math.atan2(dz, dx);
          let diff = ((pa + armA) % Math.PI + Math.PI) % Math.PI;
          const perp = Math.abs(Math.sin(diff)) * d;
          if (perp < 0.42 && !player.dead){
            if (player.hurt(h.x + Math.cos(pa)*d, h.z + Math.sin(pa)*d)) game.camRig.impulse(0.5);
          }
        }
      } else if (h.kind === 'pendulum'){
        h.g.rotation.x = Math.sin(h.a)*0.9;
        const log = h.log;
        const wp = log.getWorldPosition(_tmpV);
        const pp = player.pos;
        if (Math.hypot(wp.x-pp.x, wp.z-pp.z) < 1.15 && Math.abs(wp.y-(pp.y+0.6)) < 1.0 && !player.dead){
          if (player.hurt(wp.x, wp.z)) game.camRig.impulse(0.5);
        }
      }
    }
  }
}
import * as THREE2 from 'three';
const _tmpV = new THREE2.Vector3();
