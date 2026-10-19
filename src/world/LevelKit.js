// ═══ LEVEL KIT — themed section grammar for mass level production ═══
// Each level = curated sequence of sections. The kit lays geometry, carrots,
// crates, enemies, hazards, checkpoints — AND auto-authors the camera rail.
import * as THREE from 'three';

export class LevelKit {
  constructor(rt){ // rt: level runtime (builders, world, crates, collect, enemies, hazards, deco, game)
    this.rt = rt; this.B = rt.builders; this.W = rt.world; this.C = rt.crates;
    this.K = rt.collect; this.E = rt.enemies; this.H = rt.hazards; this.D = rt.deco;
    this.rail = []; this.checkpoints = [{ pos:new THREE.Vector3(0, 0.2, -1), facing:Math.PI, id:0 }];
    this.x = 0; this.y = 0; this.z = 0;   // cursor (path center)
    this.dir = 0;                          // 0 = -Z, 1 = +X, 2 = +Z, 3 = -X
    this.theme = null;
  }
  // ── cursor helpers ──
  fwd(d){ const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir]; this.x += r[0]*d; this.z += r[1]*d; }
  side(){ return [[1,0],[0,-1],[-1,0],[0,1]][this.dir]; } // right vector of travel
  pos(){ return [this.x, this.y, this.z]; }
  cp(){
    const c = { pos:new THREE.Vector3(this.x, this.y+0.2, this.z), facing:[[Math.PI],[ -Math.PI/2],[0],[Math.PI/2]][this.dir][0], id:this.checkpoints.length };
    this.checkpoints.push(c); return c;
  }
  railNode(ahead=0, up=3.7, back=7.2, fov=55){
    // camera trails 'back' behind the path direction, 'up' above
    const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    this.rail.push({ at:[this.x, this.y, this.z],
      cam:[this.x - r[0]*-back*0 + -r[0]*back, this.y+up, this.z - r[1]*back], fov });
  }
  railAt(x, y, z, up=4.2, back=8, fov=55){ // explicit anchor (staircases etc.)
    const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    this.rail.push({ at:[x, y, z], cam:[x - r[0]*back, y+up, z - r[1]*back], fov });
  }
  railFront(ahead=7.4, up=3.1, fov=62){ // chase-style: camera ahead looking back
    const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    this.rail.push({ at:[this.x, this.y, this.z], cam:[this.x + r[0]*ahead, this.y+up, this.z + r[1]*ahead], fov });
  }
  railSide(off=12.5, up=3.4, fov=48){ // 2.5D: camera off to the right side
    const s = this.side();
    this.rail.push({ at:[this.x, this.y, this.z], cam:[this.x + s[0]*off, this.y+up, this.z + s[1]*off], fov });
  }
  // ── SECTIONS ──
  // plain run of ground with path + optional dressing
  lane(len, w=12, opts={}){
    const { B } = this;
    const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    const cx = this.x + r[0]*len/2, cz = this.z + r[1]*len/2;
    const wx = this.dir%2===0 ? w : len, wz = this.dir%2===0 ? len : w;
    B.ground(cx, this.y-3, cz, wx, 3, wz);
    B.path(cx, this.y, cz, Math.min(4.2, w*0.4), Math.max(4, Math.max(wx,wz)-1));
    const s = this.side();
    // carrots down the middle
    if (opts.carrots !== false)
      this.K.line(this.x + r[0]*2, this.y+0.8, this.z + r[1]*2,
                  this.x + r[0]*(len-2), this.y+0.8, this.z + r[1]*(len-2), Math.max(3, len/3|0));
    // foliage at edges
    this.B.scatter('grass', cx, this.y, cz, wx, wz, opts.grass ?? (len*w/9|0), 0.8, 1.5);
    if (opts.flowers) this.B.scatter('flower', cx, this.y, cz, wx, wz, opts.flowers);
    if (opts.ferns) this.B.scatter('fern', cx, this.y, cz, wx, wz, opts.ferns, 1, 2);
    this.fwd(len);
    return this;
  }
  gap(width=3, len=4, w=12){ // gap then landing pad
    const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    this.K.arc(this.x + r[0]*-1, this.y+1, this.z + r[1]*-1,
               this.x + r[0]*(width+1), this.y+1, this.z + r[1]*(width+1), 5, 2);
    this.fwd(width);
    return this.lane(len, w);
  }
  cratesRow(types){ // spread crates across the path
    const s = this.side();
    const n = types.length;
    types.forEach((t, i)=>{
      const o = (i - (n-1)/2) * 1.6;
      if (t === 'stack') this.C.stack('normal', this.x + s[0]*o, this.y, this.z + s[1]*o, 2);
      else this.C.add(t, this.x + s[0]*o, this.y, this.z + s[1]*o);
    });
    return this;
  }
  enemy(type, off=0, opts={}){
    const s = this.side();
    this.E.add(type, this.x + s[0]*off, this.y + (opts.y ?? 0.42), this.z + s[1]*off, opts);
    return this;
  }
  pendulum(){ const r=[[0,-1],[1,0],[0,1],[-1,0]][this.dir]; this.H.pendulum(this.x, this.y+6.2, this.z, 4.2, 1.35); this.B.rock(this.x - r[0]*0 - this.side()[0]*5.2, this.y, this.z - r[1]*0 - this.side()[1]*5.2, 1.8, 7, 2.2); this.B.rock(this.x - this.side()[0]*-0.6 + -this.side()[0]*0, this.y+6.2, this.z - this.side()[1]*0, 9.6, 1.5, 2.2); return this; }
  spinner(speed=1.5){ this.H.spinner(this.x, this.y+0.75, this.z, 3.2, speed); return this; }
  mover(dist=4, axis='y', speed=1.3){ // single mover floating ahead (legacy)
    const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    this.B.movingPlatform(this.x + r[0]*dist, this.y + 0.4, this.z + r[1]*dist, 4.6, 4.8,
      { axis: axis==='fwd' ? (this.dir%2===0?'z':'x') : axis, dist:1.4, speed });
    return this;
  }
  moverHop(n=2, axis='y', speed=1.4){ // a HOP CHAIN of movers over real void
    const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    for (let i=0;i<n;i++){
      const d = 3.4 + i*6;
      this.B.movingPlatform(this.x + r[0]*d, this.y + 0.4, this.z + r[1]*d, 4.6, 4.8,
        { axis: axis==='fwd' ? (this.dir%2===0?'z':'x') : axis,
          dist: axis==='y' ? 1.5 : 1.8, speed, phase:i*1.7 });
      this.K.arc(this.x + r[0]*(d-3), this.y+1, this.z + r[1]*(d-3),
                 this.x + r[0]*d, this.y+1.2, this.z + r[1]*d, 3, 0.8);
    }
    this.fwd(3.4 + (n-1)*6 + 2.6);   // cursor lands just past the last platform
    return this;
  }
  collapse(len=14){ // collapsing bridge forward
    const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    const n = Math.floor(len/3.2);
    for (let i=0;i<n;i++)
      this.B.collapsingPlatform(this.x + r[0]*(1.8+i*3.2), this.y, this.z + r[1]*(1.8+i*3.2), 3.2, 2.6, this.rt.game);
    this.fwd(len);
    return this;
  }
  timeCrystal(off=0){ const s=this.side(); this.K.placeTimeCrystal(this.x+s[0]*off, this.y+1.2, this.z+s[1]*off); return this; }
  checkpoint(){ this.C.add('checkpoint', this.x + this.side()[0]*3.4, this.y, this.z + this.side()[1]*3.4); this.cp(); return this; }
  bouncePair(){ const s=this.side(); this.C.add('bounce', this.x-s[0]*2.4, this.y, this.z-s[1]*2.4); this.C.add('bounce', this.x+s[0]*2.4, this.y, this.z+s[1]*2.4); return this; }
  nitroField(n=4){ const s=this.side(); const r=[[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    for (let i=0;i<n;i++) this.C.add('nitro', this.x + s[0]*(Math.sin(i*2.3)*3.4) + r[0]*(i%2), this.y, this.z + s[1]*(Math.sin(i*2.3)*3.4) + r[1]*(i%2));
    return this; }
  turn(newDir){ this.dir = newDir; return this; }
  icicles(n=3, ceilY=5){ // row of falling icicles across the path ahead
    const s = this.side(); const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    for (let i=0;i<n;i++){
      const o = (i - (n-1)/2) * 1.8;
      this.H.icicle(this.x + s[0]*o + r[0]*(i%2), this.y + ceilY + (i%2)*0.8, this.z + s[1]*o + r[1]*(i%2), this.y);
    }
    // overhang they hang from
    this.B.rock(this.x + r[0]*0.5, this.y + ceilY + 1.1, this.z + r[1]*0.5,
      this.dir%2===0 ? n*2.2 : 2.4, 1.2, this.dir%2===0 ? 2.4 : n*2.2);
    return this;
  }
  fireJets(n=3){ // timed flames across the path
    const s = this.side();
    for (let i=0;i<n;i++){
      const o = (i - (n-1)/2) * 1.7;
      this.H.fireJet(this.x + s[0]*o, this.y, this.z + s[1]*o, i*0.55);
    }
    return this;
  }
  sawTrack(fwd=6, vertical=false){ // saw sliding along the path (or vertically)
    const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    if (vertical)
      this.H.saw(this.x + r[0]*fwd/2, this.y+0.4, this.z + r[1]*fwd/2, this.x + r[0]*fwd/2, this.y+2.6, this.z + r[1]*fwd/2, 1.8);
    else
      this.H.saw(this.x + r[0]*1, this.y+0.7, this.z + r[1]*1, this.x + r[0]*fwd, this.y+0.7, this.z + r[1]*fwd, 1.8);
    return this;
  }
  charger(off=0){ const s=this.side(); this.E.add('charger', this.x+s[0]*off, this.y+0.45, this.z+s[1]*off, {}); return this; }
  bat(off=0, h=4){ const s=this.side(); this.E.add('divebat', this.x+s[0]*off, this.y+h, this.z+s[1]*off, {}); return this; }
  grid(len, w=12){ // neon emissive grid strip (over ground laid by lane)
    const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    const cx = this.x + r[0]*len/2, cz = this.z + r[1]*len/2;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(this.dir%2===0?w:len, this.dir%2===0?len:w),
      new THREE.MeshBasicMaterial({ color:0x00ffcc, transparent:true, opacity:0.16,
        blending:THREE.AdditiveBlending, depthWrite:false }));
    g.rotation.x = -Math.PI/2;
    if (this.dir%2===1) g.rotation.z = Math.PI/2;
    g.position.set(cx, this.y+0.03, cz);
    // grid lines via canvas
    const cnv = document.createElement('canvas'); cnv.width = cnv.height = 128;
    const c2 = cnv.getContext('2d');
    c2.strokeStyle = '#0ff'; c2.lineWidth = 2; c2.globalAlpha = 0.9;
    for (let i=0;i<=4;i++){ c2.beginPath(); c2.moveTo(i*32,0); c2.lineTo(i*32,128); c2.stroke();
      c2.beginPath(); c2.moveTo(0,i*32); c2.lineTo(128,i*32); c2.stroke(); }
    const tx = new THREE.CanvasTexture(cnv);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(len/4, w/4);
    g.material.map = tx; g.material.needsUpdate = true;
    this.rt.scene.add(g);
    return this;
  }
  sign(text, sub, hue=0.5){ // floating canvas label at cursor
    const cnv = document.createElement('canvas'); cnv.width = 512; cnv.height = 192;
    const g = cnv.getContext('2d');
    g.fillStyle = 'rgba(20,10,40,0.85)'; g.beginPath(); g.roundRect(6,6,500,180,28); g.fill();
    g.strokeStyle = `hsl(${hue*360},90%,65%)`; g.lineWidth = 8; g.stroke();
    g.textAlign = 'center';
    g.fillStyle = '#fff'; g.font = '900 54px ui-rounded,system-ui';
    g.fillText(text, 256, 82);
    g.fillStyle = `hsl(${hue*360},90%,72%)`; g.font = '800 34px ui-rounded,system-ui';
    g.fillText(sub, 256, 140);
    const tx = new THREE.CanvasTexture(cnv); tx.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.65),
      new THREE.MeshBasicMaterial({ map:tx, transparent:true, side:THREE.DoubleSide }));
    m.position.set(this.x, this.y + 3.4, this.z);
    this.rt.scene.add(m);
    this._signs ??= []; this._signs.push(m);
    return m;
  }
  chaseRock(radius=2.2, speed=7.2){ // generic boulder; call update via recipe
    const boul = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 18),
      new THREE.MeshStandardMaterial({ map:this.rt.game.tex.rock, roughness:0.9, color:0xbbaaa0 }));
    boul.castShadow = true;
    const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    boul.position.set(this.x - r[0]*10, this.y + radius, this.z - r[1]*10);
    this.rt.scene.add(boul);
    const rock = { mesh:boul, active:false, speed, radius, dir:this.dir, done:false };
    this.rt._chaser = rock;
    return rock;
  }
  // ═══ BOSS ARENA: walled arena → villain → gem + portal on victory ═══
  bossArena(bossCfg){
    const { B, W } = this;
    const r = [[0,-1],[1,0],[0,1],[-1,0]][this.dir];
    // approach neck
    this.lane(6, 10, { grass:10 });
    this.cp();
    const ax = this.x + r[0]*12, az = this.z + r[1]*12;
    // arena floor
    const w = 24, dpt = 26;
    B.ground(ax + r[0]*13, this.y-3, az + r[1]*13, this.dir%2===0?w:dpt, 3, this.dir%2===0?dpt:w);
    // dirt fight circle
    const dirt = new THREE.Mesh(new THREE.CircleGeometry(8.5, 36),
      new THREE.MeshStandardMaterial({ map:this.rt.game.tex.dirt, roughness:0.95 }));
    dirt.rotation.x = -Math.PI/2;
    dirt.position.set(ax + r[0]*13, this.y+0.02, az + r[1]*13);
    dirt.receiveShadow = true;
    this.rt.scene.add(dirt);
    // walls
    const cx0 = ax + r[0]*13, cz0 = az + r[1]*13;
    B.rock(cx0 - this.side()[0]*13, this.y-3, cz0 - this.side()[1]*13, this.dir%2===0?2.4:26, 10, this.dir%2===0?26:2.4);
    B.rock(cx0 + this.side()[0]*13, this.y-3, cz0 + this.side()[1]*13, this.dir%2===0?2.4:26, 10, this.dir%2===0?26:2.4);
    B.rock(cx0 + r[0]*13, this.y-3, cz0 + r[1]*13, this.dir%2===0?26:2.4, 10, this.dir%2===0?2.4:26);
    // boss spawn far side; portal + gem appear on victory
    const bx = cx0 + r[0]*8, bz = cz0 + r[1]*8;
    this.rail.push({ at:[cx0 - r[0]*2, this.y, cz0 - r[1]*2], cam:[cx0 - r[0]*12, this.y+4.4, cz0 - r[1]*12], fov:56 });
    const bossPos = new THREE.Vector3(bx, this.y, bz);
    this.rt.bossSpawn = { pos:bossPos, cfg:bossCfg, arena:{ x:cx0, z:cz0 } };
    // trigger zone across the arena mouth
    const tr = [[cx0 - r[0]*1, this.y-2, cz0 - r[1]*1], [cx0 + r[0]*5, this.y+6, cz0 + r[1]*5]];
    const lo = [Math.min(...tr.map(v=>v[0])), Math.min(...tr.map(v=>v[1])), Math.min(...tr.map(v=>v[2]))];
    const hi = [Math.max(...tr.map(v=>v[0])), Math.max(...tr.map(v=>v[1])), Math.max(...tr.map(v=>v[2]))];
    this.rt.trigger(lo, hi, ()=>{
      this.rt.startBoss();
    });
    this.fwd(26);
    return this;
  }
  // gem + exit portal at level end
  finish(){
    this.K.placeGem(this.x, this.y+1.4, this.z, 0x41e6ff);
    this.rt.portal = new (this.rt.PortalClass)(this.rt.scene, this.rt.fx, this.x, this.y+2.0, this.z - 0, { hue:0.52 });
    this.rt.portal.setOpen(true);
    this.railNode(0, 3.4, 7.5, 52);
    return this;
  }
}
