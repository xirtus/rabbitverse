// ═══ LEVEL 1 — PRIMEVAL BURROW: "JURASSIC CARROT" ═══
// Sections: Clearing → Jungle Lane → Side Cliff → Time Ruins → Boulder Chase → Boss
import * as THREE from 'three';
import { Portal } from '../Portal.js';
import { Boss } from '../Boss.js';

export class PrimevalLevel {
  constructor(game){
    this.g = game;
    const { builders:B, world:W, crates:C, collect:K, enemies:E, hazards:H, deco:D } = game;
    this.B=B; this.W=W; this.C=C; this.K=K; this.E=E; this.H=H; this.D=D;
    this.checkpoints = [];
    this.currentCP = null;
    this.triggers = [];
    this.time = 0;
    this.boulder = null;
    this.portal = null;
    this.boss = null;
    this.gemSpawned = false;
    this.resultsShown = false;
    this.startPos = new THREE.Vector3(0, 0.2, 2);
    this.rail = [   // authored camera rail: player anchor → camera position
      // ── lane (camera trails behind, frames the path forward) ──
      { at:[0,0,6],      cam:[0,3.4,11],     fov:55 },
      { at:[0,0,-6],     cam:[0,3.6,0.5],    fov:55 },
      { at:[0,0,-20],    cam:[0,3.7,-13],    fov:55 },
      { at:[0,0,-34],    cam:[0,3.7,-27],    fov:55 },
      { at:[0,0,-48],    cam:[0,3.8,-41],    fov:55 },
      { at:[0,0,-60],    cam:[0,3.6,-53.5],  fov:55 },
      { at:[0,0,-68],    cam:[0,3.6,-61.8],  fov:55 },
      // ── corner swing into the side-scroll shelf ──
      { at:[3,0,-72.5],  cam:[0.5,3.8,-64],  fov:52 },
      { at:[7,0,-74],    cam:[6,3.7,-62.5],  fov:50 },
      // ── side-scroll: camera glides on a parallel track ──
      { at:[13,0,-74],   cam:[12,3.5,-61.8], fov:48 },
      { at:[21,1,-74],   cam:[20,3.7,-61.8], fov:48 },
      { at:[27,1.6,-74], cam:[26,3.9,-61.8], fov:48 },
      { at:[34,2,-74],   cam:[33.5,4.1,-61.8], fov:48 },
      { at:[40,3.4,-74], cam:[39.5,4.4,-61.8], fov:48 },
      { at:[44,3.4,-74], cam:[43.5,4.5,-61.8], fov:48 },
      { at:[49.5,0,-74], cam:[48.5,3.8,-62.5], fov:50 },
      // ── ruins: swing behind, through the canyon gate ──
      { at:[49.5,0,-79], cam:[49.5,3.7,-71.5], fov:54 },
      { at:[49.5,0,-87], cam:[49.5,3.7,-79.5], fov:54 },
      { at:[49.5,0,-95], cam:[49.5,3.7,-87.5], fov:54 },
      { at:[49.5,0,-103],cam:[49.5,3.7,-95.5], fov:54 },
      { at:[49.5,0,-109],cam:[49.5,3.7,-102],  fov:56 },
      // ── chase: camera runs AHEAD, looking back at the boulder ──
      { at:[49.5,0,-113],cam:[49.5,3.1,-120.5], fov:62 },
      { at:[49.5,0,-124],cam:[49.5,3.1,-131.5], fov:62 },
      { at:[49.5,0,-136],cam:[49.5,3.1,-143.5], fov:62 },
      { at:[49.5,0,-145],cam:[49.5,3.4,-152.5], fov:60 },
      // ── arena approach ──
      { at:[49.5,0,-151],cam:[49.5,4.4,-142],  fov:55 },
      { at:[49.5,0,-160],cam:[49.5,4.6,-149],  fov:55 },
      { at:[49.5,0,-170],cam:[49.5,4.0,-158],  fov:55 },
    ];
  }
  cp(name, x, y, z, facing=Math.PI){
    const c = { pos:new THREE.Vector3(x,y,z), facing, id:this.checkpoints.length };
    this.checkpoints.push(c);
    (this.named ??= {})[name] = c;
    return c;
  }
  trigger(min, max, fn, once=true){
    this.triggers.push({ min:new THREE.Vector3(...min), max:new THREE.Vector3(...max), fn, once, fired:false });
  }

  build(){
    const { B, W, C, K, E, H, D } = this;
    W.killY = -10;

    // ════════ S0 — START CLEARING ════════
    B.ground(0, -3, 0, 16, 3, 20);            // top y=0
    B.path(0, 0, 0, 4.6, 19);
    K.line(0, 0.8, -1, 0, 0.8, -9, 6);
    C.add('normal', -3, 0, -4);
    C.add('carrot', 3, 0, -4);
    C.stack('normal', 3, 0, -6.5, 2);
    C.add('life', 0, 0, -8);
    this.cp('start', 0, 0.2, 2, Math.PI);
    // dino bone arch — vista landmark
    const boneM = new THREE.MeshStandardMaterial({ color:0xf0e8d8, roughness:0.8 });
    for (let i=0;i<7;i++){
      const rib = new THREE.Mesh(new THREE.TorusGeometry(6-i*0.5, 0.28, 8, 20, Math.PI), boneM);
      rib.position.set(-12, -0.5, -8 - i*3.2);
      rib.rotation.y = Math.PI/2;
      rib.castShadow = true;
      this.g.levelGroup.add(rib);
    }

    // ════════ S1 — JUNGLE LANE (z -10 → -64) ════════
    B.ground(0, -3, -17, 12, 3, 14);          // -10..-24
    B.path(0, 0, -17, 4.2, 13);
    K.arc(0, 0.8, -8, 0, 0.8, -13, 5, 2);     // over the first gap… wait gap:
    // gap -24..-27
    B.ground(0, -3, -36, 12, 3, 18);          // -27..-45
    B.path(0, 0, -36, 4.2, 17);
    K.arc(0, 1, -23, 0, 1, -28.5, 5, 2.2);
    E.add('snarlrat', 0, 0.42, -33, { patrol:3.5, axis:'x', speed:1.4 });
    C.add('bounce', -3.4, 0, -38);
    C.add('bounce', 3.4, 0, -38);
    C.stack('normal', 0, 0, -40, 2);
    C.add('carrot', 0, 2*0.92, -40);
    // secret high route: arrow crate → ledges
    C.add('arrow', 5, 0, -31);
    B.rock(9.5, 0, -34, 4, 3.2, 4);           // top y=3.2
    K.line(9.5, 4, -34, 9.5, 4, -40, 4);
    B.rock(9.5, 0, -44, 4, 4.2, 4);           // top y=4.2
    K.placeShard(9.5, 5.2, -44);
    K.addCarrot(9.5, 5, -46.5);
    // main path continues
    B.ground(0, -3, -52, 12, 3, 14);          // -45..-59
    B.path(0, 0, -52, 4.2, 13);
    E.add('spitter', -4.5, 0, -50, {});
    C.add('tnt', 3.6, 0, -48);
    C.add('normal', 3.6, 0, -49.2);
    C.add('nitro', 5.2, 0, -54);
    K.line(-2, 0.8, -46, -2, 0.8, -56, 6);
    // gap -59..-61.5 with darterfly over it
    E.add('darterfly', 0, 1.6, -60.3, {});
    K.arc(0, 1, -58, 0, 1, -63, 5, 2);
    B.ground(0, -3, -66.5, 12, 3, 10);        // -61.5..-71.5
    B.path(0, 0, -65, 4.2, 8);
    B.rock(-5.2, 0, -66, 1.8, 7.0, 2.2);      // gallows post (off the camera corridor)
    B.rock(-0.6, 6.2, -66, 9.6, 1.5, 2.2);    // cantilever beam
    H.pendulum(0, 6.2, -66, 4.2, 1.35);
    C.add('checkpoint', 4, 0, -69);
    this.cp('lane', 0, 0.2, -64, Math.PI);

    // ════════ S2 — SIDE CLIFF (turn west: +X at z=-74, x 2 → 46) ════════
    B.ground(6, -3, -74, 12, 3, 6);           // x 0..12
    B.ground(9, -3, -68, 6, 3, 10);           // filler: no void notch at the turn
    K.line(2, 0.8, -74, 10, 0.8, -74, 5);
    // canyon: backdrop cliff rises from the depths, WITH A GATE for the ruins path
    B.rock(18, -30, -80.5, 48, 50, 8);        // backdrop cliff face (west of gate)
    B.rock(67, -30, -80.5, 20, 50, 8);        // backdrop cliff face (east of gate)
    B.rockDecor(24, -30, -68.5, 60, 24, 6);   // near rim: decor only — falling = death
    // gate pillars framing the exit to the ruins
    B.rock(42.5, -6, -80.5, 3.5, 26, 7);
    B.rock(56.5, -6, -80.5, 3.5, 26, 7);
    B.rock(49.5, 16, -80.5, 17.5, 4, 7);      // gate lintel
    // stepped buttresses + ledges break up the cliff silhouette
    B.rock(2, -8, -78.5, 8, 22, 5);
    B.rock(14, -14, -79.5, 7, 26, 6);
    B.rock(30, -6, -78.8, 9, 18, 5);
    B.rock(8, 16, -80, 10, 4, 7);             // top steps
    B.rock(26, 18, -80.5, 12, 4, 8);
    D.tree(8, 20, -80, 1.3); D.tree(26, 22, -80.5, 1.5);
    B.rock(16.5, -12, -74, 4.5, 12, 4.5);     // pillar under ledge
    B.rock(33.5, -12, -74, 4.5, 10, 4.5);     // pillar under high ledge
    B.rock(49.5, -12, -74, 6.5, 12, 5.5);     // pillar under end platform
    D.waterfall(20, 8, -76.4, 5, 24);
    D.waterfall(34, 6, -76.4, 4, 20);
    // ledges with gaps
    B.ground(15.5, -3, -74, 5, 3, 5);         // x 13..18
    B.woodPlatform(21.5, 1.2, -74, 4.2, 4.4);
    B.movingPlatform(25.8, 1.6, -74, 4.2, 4.4, { axis:'y', dist:1.3, speed:1.4 });
    B.ground(33.5, -2, -74, 5, 4, 5);         // top y=2, x 31..36
    E.add('darterfly', 24, 3, -74, {});
    K.arc(19, 2.4, -74, 30, 3.2, -74, 7, 1.4);
    E.add('snarlrat', 33.5, 2.42, -74, { patrol:1.6, axis:'z', speed:1.9 });
    B.woodPlatform(39.5, 3.4, -74, 4.0, 4.4);
    B.movingPlatform(44, 3.4, -74, 4.2, 4.4, { axis:'x', dist:2.6, speed:1.15, phase:2 });
    B.ground(49.5, -3, -74, 7, 3, 6);         // x 46..53
    E.add('spitter', 51.5, 0, -74, { face:-Math.PI/2 });
    C.add('checkpoint', 48, 0, -72.5);
    K.line(38, 4.4, -74, 47, 4.4, -74, 6);
    this.cp('sideEnd', 48, 0.2, -74, Math.PI/2*3);
    this.cp('side', 6, 0.2, -74, Math.PI/2);          // side-section start
    this.cp('movers', 33.5, 2.2, -74, Math.PI/2);     // after the movers

    // ════════ S3 — TIME RUINS (x=49.5, z -77 → -116) ════════
    B.ground(49.5, -3, -80, 10, 3, 7);       // ruins entry platform -76.5..-83.5
    B.path(49.5, 0, -80, 4, 6);
    K.placeTimeCrystal(49.5, 1.2, -80);
    C.add('carrot', 46.5, 0, -80);
    // ruined stone pillars + arch framing the bridge
    const pilM = null;
    B.rock(45.5, 0, -81, 1.6, 5.2, 1.6);
    B.rock(53.5, 0, -81, 1.6, 4.2, 1.6);
    B.rock(45.5, 5.0, -81, 1.9, 0.9, 1.9);
    B.rock(53.5, 4.0, -81, 1.9, 0.9, 1.9);
    // collapsing bridge over chasm z -83..-97 (straight rhythm hopper)
    for (let i=0;i<5;i++)
      B.collapsingPlatform(49.5, 0, -84.8 - i*3.2, 3.2, 2.6, this.g);
    K.arc(49.5, 1.2, -83, 49.5, 1.2, -96, 6, 0.6);
    B.ground(49.5, -3, -102.5, 10, 3, 11);    // -97.5..-108
    B.path(49.5, 0, -102.5, 4, 10);
    B.rock(45, 0, -100, 1.5, 3.4, 1.5);       // more ruins
    B.rock(54, 0, -105, 1.5, 2.6, 1.5);
    H.spinner(49.5, 0.75, -101, 3.2, 1.5);
    H.spinner(49.5, 0.75, -105.5, 3.2, 1.9, 2);
    C.add('nitro', 46.5, 0, -103);
    C.stack('normal', 52.5, 0, -103, 2);
    C.add('slam', 52.5, 2*0.92, -103);
    K.line(47, 0.8, -99, 52, 0.8, -107, 6);
    this.cp('ruins', 49.5, 0.2, -98.5, Math.PI);

    // ════════ S4 — BOULDER CHASE (x=49.5, z -108 → -146) ════════
    B.ground(49.5, -3, -109.7, 10, 3, 3.4);   // connector -108.4..-111.4
    B.ground(49.5, -3, -116, 9, 3, 8);        // -112..-120
    B.path(49.5, 0, -116, 4, 7);
    B.ground(49.5, -3, -127.5, 9, 3, 7);      // -124..-131
    B.ground(49.5, -3, -140, 9, 3, 10);       // -135..-145
    C.add('normal', 47, 0, -116);
    C.add('carrot', 52, 0, -127.5);
    E.add('snarlrat', 49.5, 0.42, -140, { patrol:2.6, axis:'x', speed:2.2 });
    K.line(49.5, 0.8, -113, 49.5, 0.8, -144, 12);
    // boulder
    const boul = new THREE.Mesh(new THREE.SphereGeometry(2.3, 24, 18),
      new THREE.MeshStandardMaterial({ map:this.g.tex.rock, roughness:0.9, color:0xbbaaa0 }));
    boul.castShadow = true;
    boul.position.set(49.5, 2.3, -100);
    this.g.levelGroup.add(boul);
    this.boulder = { mesh:boul, z:-100, active:false, speed:7.2, done:false };

    // ════════ S5 — BOSS ARENA (x=49.5, z -146 → -174) ════════
    B.ground(49.5, -3, -160, 26, 3, 28);      // arena floor
    // walls
    B.rock(49.5-14, -3, -160, 3, 12, 30);
    B.rock(49.5+14, -3, -160, 3, 12, 30);
    B.rock(49.5, -3, -175.5, 30, 12, 3);
    B.rock(49.5-9, -3, -145.5, 12, 12, 3);
    B.rock(49.5+9, -3, -145.5, 12, 12, 3);
    D.waterfall(36.2, 4, -160, 6, 14);
    // worn dirt fighting circle
    const dirtCircle = new THREE.Mesh(new THREE.CircleGeometry(9, 36),
      new THREE.MeshStandardMaterial({ map:this.g.tex.dirt, roughness:0.95 }));
    dirtCircle.rotation.x = -Math.PI/2;
    dirtCircle.position.set(49.5, 0.02, -160);
    dirtCircle.receiveShadow = true;
    this.g.levelGroup.add(dirtCircle);
    // gnarled roots on the walls + scattered bones
    const rootM = new THREE.MeshStandardMaterial({ color:0x6e4520, roughness:0.9 });
    for (let i=0;i<9;i++){
      const root = new THREE.Mesh(new THREE.TorusGeometry(2.2+Math.random()*2, 0.3, 6, 12, Math.PI*0.8), rootM);
      const side = i%2 ? 1 : -1;
      root.position.set(49.5 + side*12.4, 0, -148 - i*3);
      root.rotation.set(0, side>0?-Math.PI/2:Math.PI/2, Math.random()*0.6);
      this.g.levelGroup.add(root);
    }
    const boneM2 = new THREE.MeshStandardMaterial({ color:0xf0e8d8, roughness:0.8 });
    for (let i=0;i<6;i++){
      const bone = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.9, 4, 8), boneM2);
      bone.position.set(49.5 + Math.sin(i*2.3)*7, 0.12, -152 - i*3.4);
      bone.rotation.set(Math.PI/2, 0, i*1.3);
      bone.castShadow = true;
      this.g.levelGroup.add(bone);
    }
    this.boss = new Boss(this.g.levelGroup, W, this.g.fx, this.g.events, 49.5, 0, -168);
    this.portal = new Portal(this.g.levelGroup, this.g.fx, 49.5, 2.2, -169.5, { hue:0.52 });
    this.portal.setOpen(false);
    this.cp('arena', 49.5, 0.2, -148, Math.PI);

    // ════════ TRIGGERS ════════
    const T = this.trigger.bind(this);
    T([-9,-2,-79],[14,8,-70], ()=>{ this.g.setCamera('rail'); });
    T([40,-2,-80],[54,8,-70], ()=>{ this.g.setCamera('rail'); this.g.setMusic('level'); });
    T([44,-2,-114],[55,6,-110.5], ()=>{ // chase start
      this.g.setCamera('rail'); this.g.setMusic('chase');
      this.boulder.active = true;
      this.g.events.emit('toast','RUN!');
      this.g.audio.roar();
    });
    T([44,-2,-150],[55,6,-145], ()=>{ // chase end → boss
      this.boulder.done = true;
      this.g.setCamera('boss'); this.g.setMusic('boss');
      this.g.camRig.setMode('boss', { bossTarget:new THREE.Vector3(49.5, 3, -168) });
      this.boss.start();
      this.g.events.emit('bossStart', 'KING SNARLTOOTH');
    });
    // auto-checkpoints on entering later sections
    T([-6,-2,-78],[14,6,-69], ()=>{ this._setCP(this.named.lane); });
    T([40,-2,-79],[55,6,-70], ()=>{ this._setCP(this.named.sideEnd); });
    T([1,-2,-77],[14,6,-71],  ()=>{ this._setCP(this.named.side); });
    T([31,0,-77],[37,8,-71],  ()=>{ this._setCP(this.named.movers); });
    T([44,-2,-100],[55,6,-97],  ()=>{ this._setCP(this.named.ruins); });
    T([44,-2,-147],[55,6,-145], ()=>{ this._setCP(this.named.arena); });
    // camera safety: leaving side section backwards


    // ════════ DECO ════════
    const treeSpots = [
      [-7,0,4], [7,0,2], [-8,0,-6], [8,0,-14], [-7,0,-20], [7.5,0,-30],
      [-8,0,-36], [8,0,-44], [-7,0,-52], [7,0,-58], [-8,0,-66],
      [1,0,-78], [12,0,-78], [30,2,-78.5], [44,0,-78], [54,0,-78],
      [43,0,-86], [56,0,-92], [43.5,0,-100], [56,0,-106], [44,0,-114], [55,0,-122],
      [43.5,0,-134], [55.5,0,-142], [40,0,-152], [60,0,-152], [40,0,-170], [60,0,-168],
    ];
    for (const [x,y,z] of treeSpots) D.tree(x + (Math.sin(x*7)*1.2), y, z, 1.1 + (Math.abs(x*z)%10)/14, Math.sin(z)*0.5);
    const fernSpots = [[-6,0,8],[6,0,-2],[-6.5,0,-12],[6,0,-22],[-6,0,-42],[6.5,0,-50],
      [-6,0,-62],[3,0,-72],[16,0,-76],[42,0,-76],[53,0,-80],[44,0,-96],[55,0,-100],
      [44,0,-118],[55,0,-130],[44.5,0,-144],[38,0,-148],[62,0,-160]];
    for (const [x,y,z] of fernSpots) D.bigFern(x, y, z, 1 + (Math.abs(x+z)%5)/6);
    for (let i=0;i<40;i++){
      const z = 6 - i*4.4;
      D.rockD(-7.5 + Math.sin(i*13)*1.4, 0, z, 0.5 + (i%3)*0.35);
      if (i%2) D.rockD(7.5 + Math.cos(i*7)*1.4, 0, z-2, 0.4 + (i%4)*0.3);
    }
    // grass scatter on each major ground block
    B.scatter('grass', 0, 0, 0, 14, 18, 90, 0.8, 1.5);
    B.scatter('grass', 0, 0, -17, 10, 12, 60);
    B.scatter('grass', 0, 0, -36, 10, 16, 80);
    B.scatter('flower', 0, 0, -36, 10, 16, 14);
    B.scatter('grass', 0, 0, -52, 10, 12, 60);
    B.scatter('grass', 0, 0, -66.5, 10, 8, 40);
    B.scatter('grass', 6, 0, -74, 10, 4, 30);
    B.scatter('grass', 49.5, 0, -74, 6, 5, 25);
    B.scatter('flower', 6, 0, -74, 10, 4, 10);
    B.scatter('grass', 49.5, 0, -102.5, 8, 9, 40);
    B.scatter('fern', 49.5, 0, -160, 22, 24, 60, 0.8, 1.6);
    B.scatter('flower', 49.5, 0, -160, 20, 20, 20);
    B.scatter('fern', 0, 0, -20, 12, 100, 50, 1, 2);
    B.buildFoliage(this.g.tex);
    D.build(this.g.tex);
    D.butterflies(7, 0, 1.5, -20, 30);
    D.butterflies(5, 49.5, 2, -100, 16);
    D.vista();

    // events
    const ev = this.g.events;
    ev.on('checkpoint', p => {
      this._setCP({ pos:new THREE.Vector3(p.x, p.y+0.1, p.z), facing:this.g.player.facing });
      ev.emit('toast', 'CHECKPOINT!');
    });
    ev.on('bossDown', ()=>{
      this.g.setMusic('level');
      this.g.setCamera('rail');
      this.g.events.emit('bossEnd');
      const g = K.placeGem(49.5, 1.4, -160, 0x41e6ff);
      this.portal.setOpen(true);
      ev.emit('toast', 'REALITY GEM!');
      this.gemSpawned = true;
    });
  }
  _setCP(c){ this.currentCP = c; }

  update(dt, t){
    const g = this.g, p = g.player;
    // triggers
    for (const tr of this.triggers){
      if (tr.fired && tr.once) continue;
      if (p.pos.x>tr.min.x && p.pos.x<tr.max.x && p.pos.y>tr.min.y && p.pos.y<tr.max.y && p.pos.z>tr.min.z && p.pos.z<tr.max.z){
        tr.fired = true; tr.fn();
      }
    }
    // kill plane
    if (p.pos.y < this.W.killY && !p.dead) p.kill('fall');
    // boulder
    if (this.boulder && this.boulder.done && this.boulder.sink > 0 && this.boulder.sink < 1){
      // boulder dramatically sinks into the pit at the arena gate
      this.boulder.sink = Math.min(1, this.boulder.sink + dt*1.4);
      this.boulder.mesh.position.y = 2.3 - this.boulder.sink*8;
      this.boulder.mesh.rotation.x -= dt*2;
      if (Math.random() < dt*30) g.fx.dust(this.boulder.mesh.position, 2, 0x998877);
      if (this.boulder.sink >= 1) this.boulder.mesh.visible = false;
    }
    if (this.boulder && this.boulder.active && !this.boulder.done){
      const b = this.boulder;
      b.z -= b.speed*dt;
      b.mesh.position.z = b.z;
      b.mesh.rotation.x -= dt*b.speed/2.3;
      b.speed = Math.min(9.5, b.speed + dt*0.35);
      // boulder y follows ground approx (sections at y=0)
      b.mesh.position.y = 2.3;
      if (Math.random() < dt*20) g.fx.dust(b.mesh.position, 2, 0xbbaa99);
      const d = Math.hypot(p.pos.x-b.mesh.position.x, p.pos.z-b.z);
      if (d < 2.6 && !p.dead){ p.kill('crush'); g.camRig.impulse(1); }
      if (b.z < -146){ b.done = true; b.sink = 0.001; }
    }
    // portal enter → results
    if (this.portal && !this.resultsShown){
      if (this.portal.update(dt, p.pos)){
        this.resultsShown = true;
        g.events.emit('levelComplete');
      }
    }
    if (this.boss) this.boss.update(dt, t, p, g);
  }
}
