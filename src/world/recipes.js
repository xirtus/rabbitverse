// ═══ RECIPES — the Warp Station + 5 worlds × 5 levels ═══
// All original level designs using the LevelKit section grammar.
import * as THREE from 'three';
import { Portal } from './Portal.js';
import { PrimevalLevel } from './levels/primeval.js';

// ─── world dressing helpers ───
function fractalPillar(rt, x, y, z, s=1){
  const m = new THREE.MeshStandardMaterial({ color:0x7a3adf, roughness:0.4, emissive:0x3a0a6a, emissiveIntensity:0.4 });
  for (let i=0;i<4;i++){
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.6*s/Math.pow(1.4,i), 1.6*s/Math.pow(1.4,i), 1.6*s/Math.pow(1.4,i)), m);
    b.position.set(x, y + i*1.15*s, z);
    b.rotation.set(i*0.4, i*0.6, i*0.3);
    rt.scene.add(b);
  }
}
function neonTower(rt, x, y, z, h, hue){
  const cnv = document.createElement('canvas'); cnv.width = 64; cnv.height = 128;
  const g2 = cnv.getContext('2d');
  g2.fillStyle = '#05070f'; g2.fillRect(0,0,64,128);
  for (let y=0;y<16;y++) for (let x=0;x<6;x++){
    g2.fillStyle = Math.random() < 0.4 ? `hsl(${hue*360},90%,${45+Math.random()*25}%)` : '#0a0f1e';
    g2.fillRect(x*10+3, y*8+2, 6, 5);
  }
  const wtx = new THREE.CanvasTexture(cnv); wtx.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ color:0x8a9ac8, roughness:0.6,
    emissive:0xffffff, emissiveMap:wtx, emissiveIntensity:0.9, map:wtx });
  const t = new THREE.Mesh(new THREE.BoxGeometry(2.6, h, 2.6), m);
  t.position.set(x, y+h/2, z); rt.scene.add(t);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(2.7, h*0.9, 0.2),
    new THREE.MeshBasicMaterial({ color:new THREE.Color().setHSL(hue, 1, 0.6) }));
  strip.position.set(x, y+h/2, z+1.31); rt.scene.add(strip);
}
function palmNeon(rt, x, y, z, s=1, hue=0.85){
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14*s, 0.24*s, 3.4*s, 6),
    new THREE.MeshStandardMaterial({ color:0x4a2a5a, roughness:0.8 }));
  trunk.position.set(x, y+1.7*s, z); trunk.rotation.z = 0.12; rt.scene.add(trunk);
  for (let i=0;i<6;i++){
    const a = i/6*Math.PI*2;
    const lf = new THREE.Mesh(new THREE.ConeGeometry(0.3*s, 2.2*s, 5, 1, true),
      new THREE.MeshBasicMaterial({ color:new THREE.Color().setHSL((hue+i*0.02)%1, 0.9, 0.55), side:THREE.DoubleSide }));
    lf.position.set(x + Math.cos(a)*0.8*s, y+3.4*s, z + Math.sin(a)*0.8*s);
    lf.rotation.set(Math.sin(a)*1.0, 0, -Math.cos(a)*1.0);
    lf.rotation.z += Math.PI;
    rt.scene.add(lf);
  }
}
function torii(rt, x, y, z, s=1, red=0xd83a2a){
  const m = new THREE.MeshStandardMaterial({ color:red, roughness:0.55 });
  const g = new THREE.Group();
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18*s,0.22*s,3.4*s,8), m); p1.position.set(-1.5*s,1.7*s,0);
  const p2 = p1.clone(); p2.position.x = 1.5*s;
  const beam = new THREE.Mesh(new THREE.BoxGeometry(4.4*s, 0.34*s, 0.4*s), m); beam.position.y = 3.4*s;
  const beam2 = new THREE.Mesh(new THREE.BoxGeometry(3.6*s, 0.26*s, 0.34*s), m); beam2.position.y = 2.7*s;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(4.8*s, 0.22*s, 0.5*s),
    new THREE.MeshStandardMaterial({ color:0x1a1014, roughness:0.7 }));
  cap.position.y = 3.65*s;
  g.add(p1, p2, beam, beam2, cap);
  g.position.set(x, y, z);
  g.traverse(o=>{ if (o.isMesh) o.castShadow = true; });
  rt.scene.add(g);
}
function waterTower(rt, x, y, z, s=1){
  const wood = new THREE.MeshStandardMaterial({ color:0x6a4526, roughness:0.85 });
  const g = new THREE.Group();
  for (const [lx,lz] of [[-0.9,-0.9],[0.9,-0.9],[-0.9,0.9],[0.9,0.9]]){
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09*s,0.11*s,3.4*s,6), wood);
    leg.position.set(lx*s, 1.7*s, lz*s); g.add(leg);
  }
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.3*s,1.15*s,2.0*s,10), wood);
  tank.position.y = 4.4*s; g.add(tank);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5*s, 0.9*s, 10), new THREE.MeshStandardMaterial({ color:0x2a1a14 }));
  roof.position.y = 5.8*s; g.add(roof);
  g.position.set(x, y, z);
  g.traverse(o=>{ if (o.isMesh) o.castShadow = true; });
  rt.scene.add(g);
}

// generic per-level chaser update (boulder rolls toward player along path dir)
function chaserUpdate(rt, dt){
  const c = rt._chaser; if (!c || !c.active || c.done) return;
  const g = rt.game, p = g.player;
  const r = [[0,-1],[1,0],[0,1],[-1,0]][c.dir];
  c.speed = Math.min(9.5, c.speed + dt*0.3);
  c.mesh.position.x += r[0]*c.speed*dt;
  c.mesh.position.z += r[1]*c.speed*dt;
  c.mesh.rotation.x -= dt*c.speed/c.radius;
  if (Math.random() < dt*20) g.fx.dust(c.mesh.position, 2, 0xbbaa99);
  const d = Math.hypot(p.pos.x-c.mesh.position.x, p.pos.z-c.mesh.position.z);
  if (d < c.radius+0.4 && !p.dead){ p.kill('crush'); g.camRig.impulse(1); }
  if (Math.abs(p.pos.x-c.mesh.position.x) + Math.abs(p.pos.z-c.mesh.position.z) > 60){ c.done = true; c.mesh.visible = false; }
}

// ═══════════ THE WARP STATION (hub) ═══════════
export const HUB = {
  id:'hub', name:'THE WARP STATION', theme:'fractal', water:false, killY:-20,
  build(rt){
    const { B, K, D, W } = rt;
    const g = rt.game;
    // floating dais rings (psych station floor — no grass in space)
    rt.builders.groundKind = 'psych';
    B.ground(0, -3, 0, 26, 3, 26);            // main dais
    B.path(0, 0, 0, 8, 25);
    // energy rail keeps the rabbit on the station (falls in hub = no)
    const railM = new THREE.MeshBasicMaterial({ color:0x9a5aff, transparent:true, opacity:0.55 });
    const railG = new THREE.TorusGeometry(12.9, 0.09, 8, 64);
    const rail1 = new THREE.Mesh(railG, railM); rail1.rotation.x = Math.PI/2; rail1.position.y = 0.55;
    const rail2 = new THREE.Mesh(railG, railM.clone()); rail2.rotation.x = Math.PI/2; rail2.position.y = 0.12;
    rail2.material.opacity = 0.3;
    rt.scene.add(rail1, rail2);
    rt._hubRails = [rail1, rail2];
    W.addBox(0, 0, -13.2, 27, 3, 0.8, 'solid', 'hubrail');
    W.addBox(0, 0, 13.2, 27, 3, 0.8, 'solid', 'hubrail');
    W.addBox(-13.2, 0, 0, 0.8, 3, 27, 'solid', 'hubrail');
    W.addBox(13.2, 0, 0, 0.8, 3, 27, 'solid', 'hubrail');
    rt.deco.vista();
    // rim sculptures between doors (never block the sightlines)
    fractalPillar(rt, 0, 0, -12.6, 1.1);
    fractalPillar(rt, 11.5, 0, 5.8, 0.9);
    fractalPillar(rt, -11.5, 0, 5.8, 0.9);
    const title = rt.kit.sign('THE WARP STATION', 'repair the multiverse', 0.75);
    title.position.set(0, 5.2, -12.4);
    // doors around the ring
    const doors = g.WORLDS;
    const R = 10.2;
    doors.forEach((w, i)=>{
      const a = (i/doors.length)*Math.PI*2 + Math.PI/2;
      const x = Math.sin(a)*R, z = Math.cos(a)*R;
      // door arch
      const frame = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.3, 10, 28),
        new THREE.MeshStandardMaterial({ color:new THREE.Color().setHSL(w.hue, 0.6, 0.4), roughness:0.5,
          emissive:new THREE.Color().setHSL(w.hue, 0.8, 0.25), emissiveIntensity:0.7 }));
      frame.position.set(x, 2.1, z); frame.rotation.y = a;
      frame.castShadow = true;
      rt.scene.add(frame);
      const portal = new Portal(rt.scene, g.fx, x, 2.1, z, { hue:w.hue });
      portal.group.rotation.y = a + Math.PI;      // face the dais center
      rt.scene.add(portal.group);
      const open = g.progress.worldOpen(i, w.gemsNeeded);
      portal.setOpen(open);
      // sign: name + live progress / requirement (facing center)
      const done = w.levels.filter(l => g.progress.hasGem(l.id)).length;
      const next = w.levels.find(l => !g.progress.hasGem(l.id));
      const sub = !open ? `LOCKED — ${w.gemsNeeded} GEMS`
        : next ? `${done}/5 ▶ ${next.name}` : `★ 5/5 COMPLETE`;
      const sign = rt.kit.sign(w.name, sub, w.hue);
      sign.position.set(x, 4.6, z);
      sign.rotation.y = a + Math.PI;
      w._door = { portal, x, z, sign };
    });
    rt.kit.checkpoints.push({ pos:new THREE.Vector3(0, 0.2, 6), facing:Math.PI, id:0 });
    // hub rail: gentle pull-back cam
    rt.kit.rail.push({ at:[0,0,8], cam:[0,3.6,14], fov:52 });
    rt.kit.rail.push({ at:[0,0,0], cam:[0,4.2,8.5], fov:52 });
    rt.kit.rail.push({ at:[0,0,-8], cam:[0,4.2,-1], fov:52 });
    rt.kit.rail.push({ at:[8,0,0], cam:[14,4.2,0], fov:52 });
    rt.kit.rail.push({ at:[-8,0,0], cam:[-14,4.2,0], fov:52 });
    rt.kit.rail.push({ at:[8,0,8], cam:[12,4.2,12], fov:52 });
    rt.kit.rail.push({ at:[-8,0,8], cam:[-12,4.2,12], fov:52 });
    rt.kit.rail.push({ at:[8,0,-8], cam:[12,4.2,-12], fov:52 });
    rt.kit.rail.push({ at:[-8,0,-8], cam:[-12,4.2,-12], fov:52 });
    // starfield
    const starGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(900*3);
    for (let i=0;i<900;i++){
      const a = Math.random()*Math.PI*2, e = Math.random()*Math.PI - Math.PI/2, r = 300+Math.random()*200;
      sp[i*3] = Math.cos(a)*Math.cos(e)*r; sp[i*3+1] = Math.sin(e)*r*0.6+40; sp[i*3+2] = Math.sin(a)*Math.cos(e)*r;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    rt.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color:0xffffff, size:1.6, sizeAttenuation:false, fog:false })));
  },
  update(rt, dt, t){
    // hub rail shimmer
    if (rt._hubRails) rt._hubRails.forEach((r,i)=>{ r.material.opacity = 0.4 + Math.sin(t*2+i*2)*0.15; });
    // door enter check + door labels refresh
    const g = rt.game;
    g.WORLDS.forEach((w, i)=>{
      const d = w._door; if (!d) return;
      const open = g.progress.worldOpen(i, w.gemsNeeded);
      if (open && !d.portal.open) d.portal.setOpen(true);
      if (d.portal.update(dt, g.player.pos)){
        // enter world's next unplayed level
        const lvl = w.levels.find(l => !g.progress.hasGem(l.id)) || w.levels[w.levels.length-1];
        d.portal.entered = false;
        g.loadLevel(lvl.id);
      }
    });
  },
};

// ═══════════ WORLD 1 — PRIMEVAL BURROW (garden) ═══════════
// Every level: multiple distinct parts, twists, hazard gauntlets, setpieces.
const G2 = { id:'w1-2', name:'FERN GULLY', theme:'garden', build(rt){
  const k = rt.kit;
  // P1: gully floor — teach + rats
  k.railNode(); k.lane(16, 14, { grass:36, flowers:12, ferns:6 }).cratesRow(['normal','carrot','stack']);
  k.enemy('snarlrat', 0, { patrol:3.5 }); k.lane(8, 14, { grass:20 });
  k.railNode(); k.gap(3, 8).enemy('darterfly', 0, { y:1.9 });
  // P2: charger paddock
  k.railNode(); k.checkpoint(); k.lane(12, 13, { grass:24 }).charger(-2).charger(2.5);
  k.K.arc(k.x-4, k.y+1, k.z-3, k.x+4, k.y+1, k.z-9, 6, 1.2);
  k.lane(6, 13, { grass:14 }).cratesRow(['tnt','normal']);
  // P3: pendulum ridge
  k.railNode(); k.checkpoint(); k.lane(9, 12, { grass:16 }).pendulum().lane(7, 12, { grass:10 }).pendulum();
  // P4: collapse + time room
  k.railNode(); k.lane(6, 12, { grass:10 }); k.timeCrystal(); k.collapse(16);
  k.railNode(); k.checkpoint(); k.lane(8, 12, { grass:16 }).spinner(1.5).lane(6, 12, { grass:8 });
  k.cratesRow(['bounce','nitro']); k.lane(8, 14, { grass:18 })
  // bonus beats
  k.railNode(); k.checkpoint(); k.lane(10,13,{grass:20}).charger(0); k.gap(3.5,6); k.lane(8,12,{grass:14});
  k.bossArena({ model:'mossjaw', name:'MOSSJAW', attacks:['rings','seeds'] });
  D_forests(rt);
} };
const G3 = { id:'w1-3', name:'RAPID FALLS', theme:'garden', build(rt){
  const k = rt.kit;
  // P1: waterfall shelf, 2.5D
  k.railSide(); k.lane(10, 12, { grass:20 }).turn(1);
  k.railSide(); k.lane(12, 9, { grass:16 }).enemy('snarlrat', 0, { patrol:2.6, axis:'z' });
  k.railSide(); k.moverHop(1, 'y', 1.3); k.lane(8, 9, { grass:12 });
  k.railSide(); k.gap(3.5, 6, 9).enemy('darterfly', 0, { y:2.1 });
  // P2: falls crossing
  k.railSide(); k.checkpoint(); k.moverHop(1, 'fwd', 1.25); k.lane(8, 9, { grass:12 });
  k.railSide(); k.pendulum(); k.lane(8, 9, { grass:10 });
  // P3: icicle cavern mouth
  k.railNode(); k.turn(0); k.checkpoint(); k.lane(10, 12, { grass:18 }).icicles(4, 5);
  k.railNode(); k.lane(8, 12, { grass:14 }).cratesRow(['normal','carrot','stack']);
  // P4: charger hollow + finale
  k.railNode(); k.checkpoint(); k.lane(12, 13, { grass:20 }).charger(0);
  k.gap(3.5, 6); k.lane(8, 12, { grass:14 })
  // bonus beats
  k.railSide(); k.turn(1); k.icicles(3,5.5); k.lane(8,9,{grass:12}); k.turn(0); k.railNode(); k.lane(8,12,{grass:16}).enemy('snarlrat',0,{patrol:3});
  k.bossArena({ model:'mossjaw', name:'GNAWJAW', attacks:['rings','charge'], speed:1.05, tint:0.05 });
  D_forests(rt);
  rt.deco.waterfall(-8, 4, -24, 5, 18); rt.deco.waterfall(-8, 3, -46, 4, 14);
} };
const G4 = { id:'w1-4', name:'BOULDER BLUFF', theme:'garden', build(rt){
  const k = rt.kit;
  // P1: bluff approach
  k.railNode(); k.lane(18, 13, { grass:30, ferns:6 }).cratesRow(['carrot','normal','stack']);
  k.enemy('snarlrat', 0, { patrol:3 });
  // P2: THE CHASE (long run: gaps + crates + jets)
  k.checkpoint(); k.lane(4, 12);
  const rock = k.chaseRock(2.3, 7.4);
  rt.trigger([-8,-4,-24],[8,6,-19], ()=>{ rock.active = true; rt.game.setMusic('chase'); });
  k.railFront(); k.lane(11, 9, { grass:0 });
  k.railFront(); k.gap(3.5, 6, 9);
  k.railFront(); k.lane(10, 9, { grass:0 }).cratesRow(['normal','carrot']);
  k.railFront(); k.fireJets(3); k.lane(8, 9, { grass:0 });
  k.railFront(); k.gap(4, 6, 9); k.lane(9, 10, { grass:6 });
  rt.trigger([-8,-4,-76],[8,6,-70], ()=>{ rock.done = true; rock.sink = 0; rock.mesh.visible = false; rt.game.setMusic('level'); });
  // P3: spinner gauntlet
  k.railNode(); k.checkpoint(); k.lane(8, 12, { grass:14 }).spinner(1.5).lane(6, 12, { grass:8 }).spinner(1.9);
  // P4: bounce sky route
  k.railNode(); k.checkpoint(); k.bouncePair().gap(3.5, 5).bouncePair().lane(8, 12, { grass:12 });
  k.nitroField(3); k.lane(8, 14, { grass:16 })
  // bonus beats
  k.railNode(); k.checkpoint(); k.lane(10,12,{grass:18}).charger(-2).charger(2.5); k.gap(4,6);
  k.bossArena({ model:'mossjaw', name:'OLD ROOTMAW', attacks:['rings','seeds','charge'], speed:1.1, tint:0.08 });
  D_forests(rt);
}, update: (rt, dt)=> chaserUpdate(rt, dt) };
const G5 = { id:'w1-5', name:'ANCIENT CANOPY', theme:'garden', killY:-30, build(rt){
  const k = rt.kit;
  // P1: climb the ancestor tree (ascending pads)
  k.railNode(); k.lane(12, 13, { grass:24, ferns:8 });
  for (let i=0;i<4;i++){
    rt.builders.ground(k.x + (i%2?2.6:-2.6), k.y-3+i*1.7, k.z-6-i*4.6, 7.5, 3, 6);
    k.K.arc(k.x, k.y+1.2, k.z-2.5-i*4.6, k.x+(i%2?2.6:-2.6), k.y+1.7+i*1.7, k.z-6-i*4.6, 4, 0.9);
    k.railAt(k.x + (i%2?2.6:-2.6), k.y+i*1.7, k.z-6-i*4.6, 4.4, 8.4);
  }
  k.y += 1.7*4; k.z -= 24;
  // P2: bat hollow
  k.railNode(0, 4.4, 8.4); k.checkpoint(); k.lane(10, 12, { grass:18 }).bat(-2.5).bat(2.5);
  k.lane(8, 12, { grass:14 }).cratesRow(['normal','carrot']);
  // P3: canopy movers
  k.railNode(0, 4.4, 8.4); k.moverHop(2, 'y', 1.4); k.lane(8, 11, { grass:14 });
  k.railNode(0, 4.4, 8.4); k.checkpoint(); k.gap(4, 6).enemy('darterfly', 0, { y:2.2 });
  // P4: time collapse descent
  k.railNode(0, 4.4, 8.4); k.timeCrystal(); k.collapse(19);
  k.railNode(0, 4.4, 8.4); k.checkpoint(); k.lane(8, 12, { grass:14 }).spinner(1.7).lane(8, 12, { grass:10 })
  // bonus beats
  k.railNode(); k.checkpoint(); k.lane(10,12,{grass:18}).charger(-2).charger(2.5); k.gap(4,6);
  k.bossArena({ model:'mossjaw', name:'THE GARDENER', attacks:['rings','charge','summon'], hp:4, speed:1.1, tint:0.12 });
  D_forests(rt);
} };

function D_forests(rt){
  const spots = [];
  for (let i=0;i<26;i++) spots.push([Math.sin(i*2.7)*9+((i%2)?14:-14), 0, -i*7-4]);
  for (const [x,y,z] of spots) rt.deco.tree(x, y, z, 1+(Math.abs(x*z)%10)/14, Math.sin(z)*0.5);
  for (let i=0;i<12;i++) rt.deco.bigFern(((i%2)?9:-9)+Math.sin(i*5), 0, -i*11-6, 1+(i%5)/6);
  rt.deco.butterflies(6, 0, 1.5, -30, 30);
  rt.deco.vista();
}

// ═══════════ WORLD 2 — FRACTAL MINDSCAPE (psychedelic) ═══════════
function F_dress(rt, n=10){
  for (let i=0;i<n;i++)
    fractalPillar(rt, ((i%2)?10:-10)+Math.sin(i*3)*3, -2+Math.sin(i)*2, -i*9-5, 0.8+(i%4)*0.4);
}
const F1 = { id:'w2-1', name:'KALEIDOSCOPE STEPS', theme:'fractal', build(rt){
  const k = rt.kit;
  // P1: dream approach
  k.railNode(); k.lane(14, 13, { grass:20 }).cratesRow(['normal','carrot']);
  k.enemy('darterfly', 0, { y:2 });
  // P2: zigzag risers
  k.railNode(); k.moverHop(2, 'y', 1.5); k.lane(8, 11, { grass:14 });
  // P3: mandala spinners (2.5D turn)
  k.railSide(); k.turn(1); k.checkpoint(); k.lane(10, 9, { grass:12 }).spinner(1.8);
  k.railSide(); k.lane(6, 9, { grass:8 }).spinner(2.3);
  // P4: time-fold bridge + bats
  k.railNode(); k.turn(0); k.checkpoint(); k.timeCrystal(); k.collapse(16);
  k.railNode(); k.lane(8, 12, { grass:12 }).bat(0);
  k.cratesRow(['bounce','tnt']); k.lane(8, 13, { grass:14 })
  // bonus beats
  k.railNode(); k.checkpoint(); k.spinner(2.0).lane(6,11,{grass:10}); k.enemy('darterfly',0,{y:2.2});
  k.bossArena({ model:'prismspider', name:'PRISM WIDOW', attacks:['seeds','rain'] });
  F_dress(rt);
} };
const F2 = { id:'w2-2', name:'INFINITE DESCENT', theme:'fractal', killY:-30, build(rt){
  const k = rt.kit;
  // P1: the drop (descending spiral pads)
  k.railNode(); k.lane(10, 13, { grass:18 });
  for (let i=0;i<5;i++){
    rt.builders.ground(k.x + (i%2?2.2:-2.2), k.y-3.5-i*2.2, k.z-6.5-i*4.5, 7, 3, 5.5);
    k.K.arc(k.x, k.y+0.5, k.z-3-i*4.5, k.x + (i%2?2.2:-2.2), k.y-1.6-i*2.2, k.z-6.5-i*4.5, 4, 0.6);
    k.railAt(k.x + (i%2?2.2:-2.2), k.y-0.5-i*2.2, k.z-6.5-i*4.5, 4.2, 8);
  }
  k.y -= 2.2*5; k.z -= 25.5;
  // P2: spinner shelf
  k.railNode(0, 4.4, 8.4); k.checkpoint(); k.lane(10, 12, { grass:16 }).enemy('snarlrat', 0, { patrol:3 });
  k.railNode(); k.spinner(1.7).lane(6, 12, { grass:10 }).spinner(2.2);
  // P3: mover drop
  k.railNode(); k.checkpoint(); k.moverHop(2, 'y', 1.6); k.lane(8, 11, { grass:12 });
  // P4: collapse to the core
  k.railNode(); k.timeCrystal(); k.collapse(19);
  k.railNode(); k.checkpoint(); k.cratesRow(['normal','carrot','stack']); k.lane(8, 13, { grass:14 })
  // bonus beats
  k.railNode(); k.bat(0); k.gap(4,6); k.lane(8,12,{grass:12});
  k.bossArena({ model:'prismspider', name:'FRACTURE QUEEN', attacks:['rain','charge'], speed:1.05 });
  F_dress(rt, 14);
} };
const F3 = { id:'w2-3', name:'MANDALA RUN', theme:'fractal', build(rt){
  const k = rt.kit;
  // P1: side mandala shelf
  k.railSide(); k.lane(10, 10, { grass:14 }).turn(1);
  k.railSide(); k.lane(10, 9, { grass:12 }).spinner(2.0);
  k.railSide(); k.lane(6, 9, { grass:8 }).spinner(2.5);
  // P2: holo hops
  k.railSide(); k.checkpoint(); k.moverHop(1, 'fwd', 1.4); k.lane(8, 9, { grass:10 });
  k.railSide(); k.gap(3.5, 6, 9).enemy('darterfly', 0, { y:2.2 });
  // P3: bat bridge
  k.railNode(); k.turn(0); k.checkpoint(); k.lane(10, 12, { grass:14 }).bat(-2).bat(2);
  k.railNode(); k.gap(4, 6).gap(4, 6);
  // P4: recursion gauntlet
  k.railNode(); k.checkpoint(); k.timeCrystal(); k.collapse(16);
  k.railNode(); k.spinner(2.4); k.lane(8, 12, { grass:12 })
  // bonus beats
  k.railNode(); k.checkpoint(); k.collapse(13); k.lane(6,11,{grass:10}); k.enemy('snarlrat',0,{patrol:3,speed:2.2});
  k.bossArena({ model:'prismspider', name:'THE TESSELLATOR', attacks:['rain','seeds','sweep'], speed:1.1, tint:0.06 });
  F_dress(rt, 12);
} };
const F4 = { id:'w2-4', name:'ZOOM SPIRAL', theme:'fractal', build(rt){
  const k = rt.kit;
  // P1: twin spinners
  k.railNode(); k.lane(10, 13, { grass:18 }).spinner(1.6);
  k.railNode(); k.lane(6, 13, { grass:10 }).spinner(2.1).checkpoint();
  // P2: bat gaps
  k.railNode(); k.gap(4, 6).bat(0).gap(4.5, 6);
  k.railNode(); k.lane(8, 12, { grass:12 }).enemy('snarlrat', 0, { patrol:3.5, speed:2 });
  // P3: time-fold
  k.railNode(); k.checkpoint(); k.timeCrystal(); k.collapse(19);
  // P4: nitro spiral finale
  k.railNode(); k.cratesRow(['nitro','normal','tnt']); k.lane(8, 12, { grass:12 });
  k.enemy('spitter', 3.5); k.enemy('spitter', -3.5);
  k.railNode(); k.lane(8, 13, { grass:14 })
  // bonus beats
  k.railNode(); k.moverHop(1,'y',1.6); k.lane(8,11,{grass:12});
  k.bossArena({ model:'prismspider', name:'MANDALA MOTHER', attacks:['rain','charge','summon'], speed:1.1, tint:-0.05 });
  F_dress(rt, 14);
} };
const F5 = { id:'w2-5', name:'THE RECURSION', theme:'fractal', build(rt){
  const k = rt.kit;
  // P1: riser movers
  k.railNode(); k.lane(10, 13, { grass:16 }).cratesRow(['carrot','normal']);
  k.railNode(); k.moverHop(2, 'y', 1.6); k.checkpoint(); k.lane(6, 11, { grass:10 });
  // P2: spinner shelf
  k.railNode(); k.spinner(2.2); k.lane(6, 11, { grass:8 }).spinner(2.6);
  // P3: side gaps
  k.railSide(); k.turn(1); k.checkpoint(); k.gap(4, 6, 9).gap(4.5, 6, 9).enemy('darterfly', 0, { y:2.4 });
  // P4: double collapse + nitro maze
  k.railNode(); k.turn(0); k.checkpoint(); k.timeCrystal(); k.collapse(13); k.lane(3, 10); k.collapse(13);
  k.railNode(); k.nitroField(4); k.lane(8, 13, { grass:12 }).cratesRow(['slam','stack','tnt']);
  k.lane(6, 13, { grass:10 })
  // bonus beats
  k.railNode(); k.spinner(2.4).lane(6,11,{grass:8}); k.checkpoint();
  k.bossArena({ model:'prismspider', name:'THE RECURSOR', attacks:['rain','seeds','charge','sweep'], hp:4, speed:1.15, tint:0.1 });
  F_dress(rt, 16);
} };

// ═══════════ WORLD 3 — NEON 2099 (futuristic) ═══════════
function N_dress(rt, n=12){
  for (let i=0;i<n;i++)
    neonTower(rt, ((i%2)?13:-13)+Math.sin(i*7)*3, -4, -i*8-4, 8+(i*5%14), (i*0.13)%1);
}
const N1 = { id:'w3-1', name:'SKYLINE SPRINT', theme:'neon', build(rt){
  const k = rt.kit;
  // P1: rooftop runway
  k.railNode(); k.grid(15).lane(15, 13, { grass:0 }).cratesRow(['normal','carrot']);
  k.enemy('snarlrat', 0, { patrol:3, speed:2.2 });
  // P2: saw track
  k.railNode(); k.gap(3.5, 8).grid(8).sawTrack(7);
  k.railNode(); k.lane(6, 11, { grass:0 }).grid(6);
  // P3: holo side (2.5D)
  k.railSide(); k.turn(1); k.checkpoint(); k.lane(10, 9, { grass:0 }).grid(10);
  k.railSide(); k.moverHop(1, 'fwd', 1.4); k.lane(8, 9, { grass:0 }).grid(8);
  // P4: gap city + saw finale
  k.railNode(); k.turn(0); k.checkpoint(); k.gap(4, 6).grid(6).gap(4.5, 6).grid(6);
  k.railNode(); k.sawTrack(7).lane(8, 12, { grass:0 }).grid(8).spinner(2.0);
  k.cratesRow(['bounce','tnt']); k.lane(8, 13, { grass:0 }).grid(8)
  // bonus beats
  k.railNode(); k.sawTrack(6); k.lane(8,11,{grass:0}).grid(8); k.enemy('darterfly',0,{y:2.2});
  k.bossArena({ model:'datacore', name:'GRIDWARDEN', attacks:['seeds','sweep'] });
  N_dress(rt);
} };
const N2 = { id:'w3-2', name:'HOLO HIGHWAY', theme:'neon', build(rt){
  const k = rt.kit;
  // P1: side highway
  k.railSide(); k.lane(10, 10, { grass:0 }).grid(10).turn(1);
  k.railSide(); k.lane(12, 9, { grass:0 }).grid(12).enemy('snarlrat', 0, { patrol:2.4, speed:2.4 });
  // P2: saw overpass
  k.railSide(); k.sawTrack(7); k.lane(8, 9, { grass:0 }).grid(8);
  k.railSide(); k.checkpoint(); k.moverHop(1, 'fwd', 1.5); k.lane(8, 9, { grass:0 }).grid(8);
  // P3: vertical saw shaft
  k.railNode(); k.turn(0); k.gap(4, 6).grid(6).sawTrack(5, true);
  k.railNode(); k.checkpoint(); k.lane(8, 11, { grass:0 }).grid(8);
  // P4: data collapse
  k.railNode(); k.timeCrystal(); k.collapse(16);
  k.railNode(); k.lane(8, 13, { grass:0 }).grid(8).cratesRow(['bounce','carrot'])
  // bonus beats
  k.railNode(); k.checkpoint(); k.spinner(2.2); k.grid(6).lane(6,11,{grass:0});
  k.bossArena({ model:'datacore', name:'THE FIREWALL', attacks:['sweep','rain'], speed:1.05, tint:0.05 });
  N_dress(rt, 14);
} };
const N3 = { id:'w3-3', name:'DATA STREAM', theme:'neon', build(rt){
  const k = rt.kit;
  // P1: calm before
  k.railNode(); k.grid(12).lane(12, 13, { grass:0 }).enemy('darterfly', 0, { y:2.2 });
  k.checkpoint(); k.lane(4, 12);
  // P2: THE STREAM (chase, saws mid-run)
  const rock = k.chaseRock(2.3, 7.6);
  rt.trigger([-8,-4,-18],[8,6,-13], ()=>{ rock.active = true; rt.game.setMusic('chase'); });
  k.railFront(); k.grid(11).lane(11, 9, { grass:0 });
  k.railFront(); k.gap(3.5, 6, 9).grid(6);
  k.railFront(); k.sawTrack(6); k.lane(8, 9, { grass:0 }).grid(8);
  k.railFront(); k.gap(4, 6, 9).grid(6); k.cratesRow(['normal','carrot']);
  k.railFront(); k.lane(9, 10, { grass:0 }).grid(9);
  rt.trigger([-8,-4,-62],[8,6,-56], ()=>{ rock.done = true; rock.mesh.visible = false; rt.game.setMusic('level'); });
  // P3: cooldown spinners
  k.railNode(); k.checkpoint(); k.spinner(2.2); k.lane(8, 12, { grass:0 }).grid(8);
  // P4: roof-to-roof
  k.railNode(); k.moverHop(2, 'y', 1.7); k.lane(8, 12, { grass:0 }).grid(8)
  // bonus beats
  k.railNode(); k.sawTrack(7); k.grid(8).lane(8,11,{grass:0});
  k.bossArena({ model:'datacore', name:'PACKETSTORM', attacks:['charge','seeds'], speed:1.1, tint:-0.05 });
  N_dress(rt, 12);
}, update: (rt, dt)=> chaserUpdate(rt, dt) };
const N4 = { id:'w3-4', name:'GRIDLOCK', theme:'neon', build(rt){
  const k = rt.kit;
  // P1: spinner junction
  k.railNode(); k.grid(10).lane(10, 13, { grass:0 });
  k.railNode(); k.spinner(1.8); k.grid(6).lane(6, 11, { grass:0 }).spinner(2.2);
  // P2: saw avenue
  k.railNode(); k.checkpoint(); k.sawTrack(7); k.grid(8).lane(8, 11, { grass:0 });
  k.enemy('spitter', 3.5);
  // P3: risers
  k.railNode(); k.moverHop(2, 'y', 1.7); k.lane(8, 11, { grass:0 }).grid(8);
  // P4: time collapse + nitro
  k.railNode(); k.checkpoint(); k.timeCrystal(); k.collapse(19);
  k.railNode(); k.nitroField(4); k.cratesRow(['slam','stack','tnt']);
  k.lane(8, 13, { grass:0 }).grid(8)
  // bonus beats
  k.railNode(); k.sawTrack(7); k.grid(8).lane(8,11,{grass:0});
  k.bossArena({ model:'datacore', name:'KERNEL PANIC', attacks:['sweep','seeds','summon'], speed:1.1, tint:0.08 });
  N_dress(rt, 16);
} };
const N5 = { id:'w3-5', name:'OVERDRIVE', theme:'neon', build(rt){
  const k = rt.kit;
  // P1: gap city
  k.railNode(); k.grid(12).lane(12, 13, { grass:0 }).cratesRow(['carrot','normal']);
  k.railNode(); k.gap(4, 6).grid(6).gap(4.5, 6).grid(6).checkpoint();
  // P2: saw gauntlet
  k.railNode(); k.sawTrack(7); k.lane(8, 11, { grass:0 }).grid(8).sawTrack(5, true);
  // P3: side movers
  k.railSide(); k.turn(1); k.lane(8, 9, { grass:0 }).grid(8).moverHop(1, 'fwd', 1.6);
  k.railSide(); k.lane(8, 9, { grass:0 }).grid(8);
  // P4: overdrive finale
  k.railNode(); k.turn(0); k.checkpoint(); k.timeCrystal(); k.collapse(19);
  k.railNode(); k.spinner(2.6); k.lane(6, 11, { grass:0 }).grid(6).spinner(3.0);
  k.enemy('spitter', 3.5); k.enemy('spitter', -3.5); k.cratesRow(['slam','tnt','nitro']);
  k.lane(8, 13, { grass:0 }).grid(8)
  // bonus beats
  k.railNode(); k.nitroField(3); k.lane(8,12,{grass:0}).grid(8);
  k.bossArena({ model:'datacore', name:'OVERLORD.EXE', attacks:['sweep','rain','charge'], hp:4, speed:1.15, tint:0.12 });
  N_dress(rt, 18);
} };

// ═══════════ WORLD 4 — TROPIC PLASMA JUNGLE ═══════════
function T_dress(rt, n=14){
  for (let i=0;i<n;i++)
    palmNeon(rt, ((i%2)?10.5:-10.5)+Math.sin(i*4)*2.5, 0, -i*7-4, 0.9+(i%4)*0.25, 0.8+(i%5)*0.04);
}
const T1 = { id:'w4-1', name:'SUNSET CANOPY', theme:'tropic', build(rt){
  const k = rt.kit;
  // P1: sunset beachhead
  k.railNode(); k.lane(16, 13, { grass:28, ferns:8 }).cratesRow(['normal','carrot']);
  k.enemy('snarlrat', 0, { patrol:3 });
  // P2: first flames
  k.railNode(); k.fireJets(3); k.lane(8, 12, { grass:16 });
  // P3: vine pendulums
  k.railNode(); k.checkpoint(); k.pendulum(); k.lane(7, 12, { grass:12 }).pendulum();
  // P4: movers over the lagoon + flame finale
  k.railNode(); k.moverHop(1, 'y', 1.4); k.lane(8, 11, { grass:14 });
  k.railNode(); k.checkpoint(); k.fireJets(4); k.lane(8, 12, { grass:14 });
  k.cratesRow(['bounce','tnt']); k.lane(8, 13, { grass:16 })
  // bonus beats
  k.railNode(); k.checkpoint(); k.pendulum(); k.lane(8,12,{grass:14}); k.enemy('snarlrat',0,{patrol:3});
  k.bossArena({ model:'lavadjinn', name:'EMBER DUCHESS', attacks:['seeds','rings'] });
  T_dress(rt);
} };
const T2 = { id:'w4-2', name:'GLOWFALL', theme:'tropic', build(rt){
  const k = rt.kit;
  // P1: falls shelf (2.5D)
  k.railSide(); k.lane(10, 10, { grass:16 }).turn(1);
  k.railSide(); k.lane(10, 9, { grass:12 }).pendulum();
  // P2: lagoon hops
  k.railSide(); k.gap(3.5, 6, 9).moverHop(1, 'y', 1.5); k.lane(8, 9, { grass:10 });
  k.railSide(); k.checkpoint(); k.enemy('darterfly', 0, { y:2.2 });
  k.railSide(); k.moverHop(1, 'fwd', 1.3); k.lane(8, 9, { grass:10 });
  // P3: flame geysers
  k.railNode(); k.turn(0); k.checkpoint(); k.fireJets(4); k.lane(8, 12, { grass:14 });
  // P4: glowfall collapse
  k.railNode(); k.timeCrystal(); k.collapse(16);
  k.railNode(); k.bat(0); k.lane(8, 13, { grass:14 }).cratesRow(['bounce','carrot'])
  // bonus beats
  k.railNode(); k.fireJets(3); k.lane(8,12,{grass:14});
  k.bossArena({ model:'lavadjinn', name:'THE SMOLDER', attacks:['rings','rain'], speed:1.05, tint:0.04 });
  T_dress(rt, 12);
  rt.deco.waterfall(-8, 4, -20, 5, 16); rt.deco.waterfall(-8, 4, -52, 4, 14);
} };
const T3 = { id:'w4-3', name:'ORCHID HOP', theme:'tropic', build(rt){
  const k = rt.kit;
  // P1: bounce orchards
  k.railNode(); k.lane(10, 13, { grass:22 });
  k.railNode(); k.bouncePair().gap(3.5, 4).bouncePair().gap(3.5, 6);
  // P2: flame path
  k.railNode(); k.checkpoint(); k.fireJets(3); k.lane(8, 12, { grass:14 });
  k.enemy('snarlrat', 0, { patrol:3, speed:2.2 });
  // P3: canopy movers
  k.railNode(); k.moverHop(2, 'y', 1.6); k.lane(8, 11, { grass:12 });
  // P4: charger grove
  k.railNode(); k.checkpoint(); k.lane(12, 13, { grass:18 }).charger(-2).charger(2.5);
  k.railNode(); k.timeCrystal(); k.collapse(13);
  k.spinner(1.8); k.lane(8, 13, { grass:14 })
  // bonus beats
  k.railNode(); k.bat(-2); k.bat(2); k.gap(4,6); k.lane(8,12,{grass:12});
  k.bossArena({ model:'lavadjinn', name:'MAGMA MATRIARCH', attacks:['seeds','charge'], speed:1.1, tint:0.08 });
  T_dress(rt, 14);
} };
const T4 = { id:'w4-4', name:'FIREFLY RUN', theme:'tropic', build(rt){
  const k = rt.kit;
  // P1: fireflies gather
  k.railNode(); k.lane(12, 13, { grass:22 }).enemy('darterfly', 0, { y:2 });
  k.checkpoint(); k.lane(4, 12);
  // P2: THE RUN (chase through flame jets)
  const rock = k.chaseRock(2.3, 7.4);
  rt.trigger([-8,-4,-18],[8,6,-13], ()=>{ rock.active = true; rt.game.setMusic('chase'); });
  k.railFront(); k.lane(11, 9, { grass:0 });
  k.railFront(); k.fireJets(3); k.lane(6, 9, { grass:0 });
  k.railFront(); k.gap(3.5, 6, 9);
  k.railFront(); k.lane(10, 9, { grass:0 }).cratesRow(['normal','carrot']);
  k.railFront(); k.gap(4, 6, 9); k.lane(9, 10, { grass:6 });
  rt.trigger([-8,-4,-62],[8,6,-56], ()=>{ rock.done = true; rock.mesh.visible = false; rt.game.setMusic('level'); });
  // P3: pendulum grove
  k.railNode(); k.checkpoint(); k.pendulum(); k.lane(7, 12, { grass:12 }).pendulum();
  // P4: jets remix
  k.railNode(); k.fireJets(4); k.lane(8, 12, { grass:12 })
  // bonus beats
  k.railNode(); k.checkpoint(); k.charger(0); k.lane(10,13,{grass:16});
  k.bossArena({ model:'lavadjinn', name:'WILDFIRE', attacks:['charge','rings','summon'], speed:1.1, tint:-0.04 });
  T_dress(rt, 12);
}, update: (rt, dt)=> chaserUpdate(rt, dt) };
const T5 = { id:'w4-5', name:'PLASMA PALMS', theme:'tropic', build(rt){
  const k = rt.kit;
  // P1: spinner beach
  k.railNode(); k.lane(12, 13, { grass:22 }).cratesRow(['carrot','stack']);
  k.railNode(); k.spinner(2.0); k.lane(6, 12, { grass:10 }).spinner(2.4);
  // P2: flame canyon
  k.railNode(); k.checkpoint(); k.fireJets(4); k.lane(8, 12, { grass:14 });
  // P3: palm movers
  k.railNode(); k.moverHop(2, 'y', 1.7); k.lane(8, 11, { grass:12 });
  // P4: double collapse + spitters
  k.railNode(); k.checkpoint(); k.timeCrystal(); k.collapse(13); k.lane(3, 10); k.collapse(13);
  k.railNode(); k.enemy('spitter', 3.5); k.enemy('spitter', -3.5); k.cratesRow(['slam','tnt','nitro']);
  k.lane(8, 13, { grass:14 })
  // bonus beats
  k.railNode(); k.checkpoint(); k.charger(0); k.lane(10,13,{grass:16});
  k.bossArena({ model:'lavadjinn', name:'THE CONFLAGRATION', attacks:['seeds','rain','charge'], hp:4, speed:1.15, tint:0.1 });
  T_dress(rt, 16);
} };

// ═══════════ WORLD 5 — EDO FRONTIER (Edo × Old West) ═══════════
function E_dress(rt, n=10){
  for (let i=0;i<n;i++){
    if (i%2) torii(rt, 9.5+Math.sin(i*3)*2, 0, -i*9-5, 1+(i%3)*0.15);
    else waterTower(rt, -9.5-Math.sin(i*3)*2, 0, -i*9-5, 0.9+(i%3)*0.2);
  }
}
const E1 = { id:'w5-1', name:'MOONLIT GATE', theme:'edo', build(rt){
  const k = rt.kit;
  // P1: torii approach
  k.railNode(); k.lane(16, 13, { grass:20 }).cratesRow(['normal','carrot']);
  torii(rt, 0, 0, -9, 1.25);
  k.enemy('snarlrat', 0, { patrol:3 });
  // P2: icicle overhang
  k.railNode(); k.icicles(4, 5); k.lane(8, 12, { grass:14 });
  // P3: temple pendulum
  k.railNode(); k.checkpoint(); k.pendulum(); k.lane(8, 12, { grass:14 });
  // P4: ridge movers + finale
  k.railNode(); k.moverHop(1, 'y', 1.4); k.gap(3.5, 6);
  k.railNode(); k.checkpoint(); k.lane(8, 12, { grass:14 }).cratesRow(['bounce','tnt']);
  k.lane(8, 13, { grass:16 })
  // bonus beats
  k.railNode(); k.icicles(3,5); k.lane(8,12,{grass:14}); k.enemy('snarlrat',0,{patrol:3,speed:2.2});
  k.bossArena({ model:'frostronin', name:'RONIN FROSTBITE', attacks:['rain','charge'] });
  E_dress(rt);
} };
const E2 = { id:'w5-2', name:'TUMBLEWEED TEMPLE', theme:'edo', build(rt){
  const k = rt.kit;
  // P1: side shelf
  k.railSide(); k.lane(10, 10, { grass:14 }).turn(1);
  k.railSide(); k.lane(10, 9, { grass:12 }).pendulum();
  // P2: icicle gallery
  k.railSide(); k.icicles(3, 5.5); k.lane(8, 9, { grass:10 });
  k.railSide(); k.checkpoint(); k.moverHop(1, 'fwd', 1.4); k.lane(8, 9, { grass:10 });
  // P3: bat belltower
  k.railNode(); k.turn(0); k.lane(10, 12, { grass:14 }).bat(-2).bat(2);
  // P4: temple collapse
  k.railNode(); k.checkpoint(); k.timeCrystal(); k.collapse(16);
  k.railNode(); k.lane(8, 13, { grass:14 }).cratesRow(['bounce','carrot'])
  // bonus beats
  k.railNode(); k.checkpoint(); k.bat(0); k.gap(4,6); k.lane(8,12,{grass:12});
  k.bossArena({ model:'frostronin', name:'SHADOW DAIMYO', attacks:['charge','sweep'], speed:1.05, tint:0.05 });
  E_dress(rt, 12);
} };
const E3 = { id:'w5-3', name:'RONIN RIDGE', theme:'edo', build(rt){
  const k = rt.kit;
  // P1: ridge walk
  k.railNode(); k.lane(12, 13, { grass:18 }).enemy('snarlrat', 0, { patrol:3.5, speed:2.2 });
  k.checkpoint(); k.lane(4, 12);
  // P2: THE STAMPEDE (chase + icicles at rest points)
  const rock = k.chaseRock(2.3, 7.6);
  rt.trigger([-8,-4,-18],[8,6,-13], ()=>{ rock.active = true; rt.game.setMusic('chase'); });
  k.railFront(); k.lane(11, 9, { grass:0 });
  k.railFront(); k.gap(3.5, 6, 9);
  k.railFront(); k.lane(10, 9, { grass:0 }).cratesRow(['normal','carrot']);
  k.railFront(); k.icicles(3, 5); k.lane(6, 9, { grass:0 });
  k.railFront(); k.gap(4, 6, 9); k.lane(9, 10, { grass:6 });
  rt.trigger([-8,-4,-62],[8,6,-56], ()=>{ rock.done = true; rock.mesh.visible = false; rt.game.setMusic('level'); });
  // P3: spinner shrine
  k.railNode(); k.checkpoint(); k.spinner(1.9); k.lane(8, 12, { grass:12 });
  // P4: moon gate finale
  torii(rt, 0, 0, -66, 1.3);
  k.railNode(); k.gap(4, 6); k.lane(8, 13, { grass:14 })
  // bonus beats
  k.railNode(); k.spinner(2.2).lane(6,12,{grass:10}); k.checkpoint();
  k.bossArena({ model:'frostronin', name:'BLIZZARD BLADE', attacks:['rain','sweep'], speed:1.1, tint:-0.05 });
  E_dress(rt, 12);
}, update: (rt, dt)=> chaserUpdate(rt, dt) };
const E4 = { id:'w5-4', name:'SAKURA STEPS', theme:'edo', killY:-30, build(rt){
  const k = rt.kit;
  // P1: the climb (alternating steps)
  k.railNode(); k.lane(10, 13, { grass:16 });
  for (let i=0;i<5;i++){
    rt.builders.ground(k.x + (i%2?2.4:-2.4), k.y-3+i*1.6, k.z-6.5-i*4.5, 7, 3, 5.5);
    k.K.arc(k.x, k.y+1.2, k.z-3-i*4.5, k.x + (i%2?2.4:-2.4), k.y+1.6+i*1.6, k.z-6.5-i*4.5, 4, 0.8);
    k.railAt(k.x + (i%2?2.4:-2.4), k.y+i*1.6, k.z-6.5-i*4.5, 4.2, 8);
  }
  k.y += 1.6*5; k.z -= 25.5;
  // P2: icicle terrace
  k.railNode(0, 4.4, 8.4); k.checkpoint(); k.lane(10, 12, { grass:16 }).icicles(4, 5.5);
  // P3: moon movers
  k.railNode(0, 4.4, 8.4); k.moverHop(2, 'y', 1.6); k.lane(8, 11, { grass:12 });
  // P4: shrine collapse
  k.railNode(0, 4.4, 8.4); k.checkpoint(); k.timeCrystal(); k.collapse(16);
  k.railNode(0, 4.4, 8.4); k.cratesRow(['normal','carrot','stack']); k.lane(8, 13, { grass:14 })
  // bonus beats
  k.railNode(); k.spinner(2.2).lane(6,12,{grass:10}); k.checkpoint();
  k.bossArena({ model:'frostronin', name:'MOONLIT SHOGUN', attacks:['charge','rain','summon'], speed:1.1, tint:0.08 });
  E_dress(rt, 14);
} };
const E5 = { id:'w5-5', name:'SHOGUN SHOWDOWN', theme:'edo', build(rt){
  const k = rt.kit;
  // P1: twin spinners
  k.railNode(); k.lane(12, 13, { grass:18 }).cratesRow(['carrot','stack']);
  torii(rt, 0, 0, -7, 1.3);
  k.railNode(); k.spinner(2.2); k.lane(6, 12, { grass:10 }).spinner(2.6);
  // P2: icicle hall
  k.railNode(); k.checkpoint(); k.icicles(5, 5); k.lane(8, 12, { grass:14 });
  // P3: gap ridge + bats
  k.railNode(); k.gap(4, 6).bat(0).gap(4.5, 6);
  k.railNode(); k.moverHop(2, 'y', 1.8); k.lane(8, 11, { grass:12 });
  // P4: showdown gauntlet
  k.railNode(); k.checkpoint(); k.timeCrystal(); k.collapse(19);
  k.railNode(); k.charger(-2); k.charger(2.5); k.cratesRow(['slam','tnt','nitro']);
  k.lane(8, 13, { grass:14 })
  // bonus beats
  k.railNode(); k.checkpoint(); k.icicles(4,5.5); k.lane(8,12,{grass:14});
  k.bossArena({ model:'frostronin', name:'THE FROST SHOGUN', attacks:['charge','sweep','rain','seeds'], hp:4, speed:1.15, tint:0.12 });
  E_dress(rt, 16);
} };

// ═══════════ WORLD REGISTRY ═══════════
export const WORLDS = [
  { key:'w1', name:'PRIMEVAL BURROW', subtitle:'the rabbit garden', hue:0.32, gemsNeeded:0,
    levels:[{ id:'w1-1', name:'JURASSIC CARROT', primeval:true }, G2, G3, G4, G5] },
  { key:'w2', name:'FRACTAL MINDSCAPE', subtitle:'the infinite garden of eating', hue:0.78, gemsNeeded:1,
    levels:[F1, F2, F3, F4, F5] },
  { key:'w3', name:'NEON 2099', subtitle:'city of electric dreams', hue:0.52, gemsNeeded:3,
    levels:[N1, N2, N3, N4, N5] },
  { key:'w4', name:'TROPIC PLASMA', subtitle:'jungle of neon rain', hue:0.9, gemsNeeded:6,
    levels:[T1, T2, T3, T4, T5] },
  { key:'w5', name:'EDO FRONTIER', subtitle:'east of the neon moon', hue:0.02, gemsNeeded:9,
    levels:[E1, E2, E3, E4, E5] },
];
export const RECIPES = { hub: HUB };
for (const w of WORLDS) for (const l of w.levels) RECIPES[l.id] = l;
