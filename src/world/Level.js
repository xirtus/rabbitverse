// ═══ WORLD — collision registry, queries, painted-canvas materials, builders ═══
import * as THREE from 'three';

// ─── painterly canvas textures ───
function canvasTex(size, painter, repX=1, repY=1){
  const c = document.createElement('canvas'); c.width = c.height = size;
  painter(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repX, repY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function splotch(g, s, n, colors, rMin, rMax, alpha=1){
  for (let i=0;i<n;i++){
    g.globalAlpha = alpha*(0.5+Math.random()*0.5);
    g.fillStyle = colors[Math.random()*colors.length|0];
    const r = rMin+Math.random()*(rMax-rMin);
    g.beginPath(); g.arc(Math.random()*s, Math.random()*s, r, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
}
export function makeTextures(){
  const T = {};
  T.grass = canvasTex(256, (g,s)=>{
    g.fillStyle = '#58a83c'; g.fillRect(0,0,s,s);
    splotch(g,s,260,['#4c9634','#66bb47','#7ecb54','#3f8a2e'],3,14,0.8);
    // blade speckles
    for (let i=0;i<900;i++){
      g.strokeStyle = Math.random()<0.5?'#7ed058':'#3c7f2b';
      g.globalAlpha = 0.5; g.lineWidth = 1.4;
      const x=Math.random()*s, y=Math.random()*s;
      g.beginPath(); g.moveTo(x,y); g.lineTo(x+(Math.random()-0.5)*4, y-3-Math.random()*4); g.stroke();
    }
    g.globalAlpha = 1;
  });
  T.dirt = canvasTex(256, (g,s)=>{
    g.fillStyle = '#8a5a33'; g.fillRect(0,0,s,s);
    splotch(g,s,220,['#7a4d2a','#9c6a3d','#6b4225','#a87a4a'],4,18,0.8);
    splotch(g,s,60,['#5d3a20'],2,5,0.9);
  });
  T.rock = canvasTex(256, (g,s)=>{
    g.fillStyle = '#9395a0'; g.fillRect(0,0,s,s);
    // horizontal strata
    for (let y=0;y<s;y+=18+Math.random()*14){
      g.fillStyle = ['#86888f','#9fa1ab','#8d8f9a','#a8aab4'][Math.random()*4|0];
      g.globalAlpha = 0.55;
      g.fillRect(0, y, s, 8+Math.random()*10);
    }
    g.globalAlpha = 1;
    splotch(g,s,320,['#7c7e88','#a2a4ae','#71737d','#b4b6be'],2,7,0.7);
    // cracks
    g.strokeStyle = '#63656e'; g.lineWidth = 1.6; g.globalAlpha = 0.5;
    for (let i=0;i<10;i++){
      g.beginPath(); let x=Math.random()*s, y=Math.random()*s; g.moveTo(x,y);
      for (let j=0;j<4;j++){ x+=(Math.random()-0.5)*40; y+=Math.random()*22; g.lineTo(x,y); }
      g.stroke();
    }
    g.globalAlpha = 1;
  });
  T.wood = canvasTex(256, (g,s)=>{
    g.fillStyle = '#b07a42'; g.fillRect(0,0,s,s);
    for (let p=0;p<4;p++){
      const y0 = p*s/4;
      g.fillStyle = ['#b07a42','#a06a36','#bd854c','#9c6533'][p];
      g.fillRect(0,y0,s,s/4);
      g.strokeStyle = 'rgba(60,35,15,.55)'; g.lineWidth = 3;
      g.strokeRect(-2,y0,s+4,s/4);
      g.lineWidth = 1.2; g.globalAlpha = 0.4;
      for (let i=0;i<7;i++){
        const y = y0 + 6 + Math.random()*(s/4-12);
        g.beginPath(); g.moveTo(0,y);
        for (let x=0;x<=s;x+=32) g.lineTo(x, y + Math.sin(x*0.05+i)*2);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
  });
  T.leaf = canvasTex(128, (g,s)=>{
    g.fillStyle = '#3f9b3a'; g.fillRect(0,0,s,s);
    splotch(g,s,140,['#4cb244','#2f8a2e','#66cc55','#277027'],3,12,0.85);
  });
  T.path = canvasTex(256, (g,s)=>{
    g.clearRect(0,0,s,s);
    g.fillStyle = 'rgba(150,104,58,0.9)';
    g.beginPath();
    g.roundRect(6, 0, s-12, s, 30);
    g.fill();
    for (let i=0;i<240;i++){
      g.globalAlpha = 0.35*Math.random()+0.1;
      g.fillStyle = ['#8a5a33','#b8834f','#6f4626','#c99a63'][Math.random()*4|0];
      g.beginPath(); g.arc(20+Math.random()*(s-40), Math.random()*s, 2+Math.random()*6, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    // soft edge fade
    const gr = g.createLinearGradient(0,0,s,0);
    // keep center opaque, feather sides via destination-out
    g.globalCompositeOperation = 'destination-out';
    const eg = g.createLinearGradient(0,0,s,0);
    eg.addColorStop(0,'rgba(0,0,0,1)'); eg.addColorStop(0.12,'rgba(0,0,0,0)');
    eg.addColorStop(0.88,'rgba(0,0,0,0)'); eg.addColorStop(1,'rgba(0,0,0,1)');
    g.fillStyle = eg; g.fillRect(0,0,s,s);
    g.globalCompositeOperation = 'source-over';
  }, 1, 4);
  T.roof = canvasTex(256, (g,s)=>{   // dark rooftop panels (neon city)
    g.fillStyle = '#141a30'; g.fillRect(0,0,s,s);
    for (let y=0;y<4;y++) for (let x=0;x<4;x++){
      g.fillStyle = ['#171e36','#121830','#1a2140'][Math.random()*3|0];
      g.fillRect(x*64+2, y*64+2, 60, 60);
    }
    g.strokeStyle = 'rgba(0,255,204,0.16)'; g.lineWidth = 2;
    for (let i=0;i<=4;i++){ g.beginPath(); g.moveTo(i*64,0); g.lineTo(i*64,s); g.stroke();
      g.beginPath(); g.moveTo(0,i*64); g.lineTo(s,i*64); g.stroke(); }
    splotch(g,s,40,['#232c4a'],2,8,0.5);
  });
  T.sand = canvasTex(256, (g,s)=>{   // dusty raked sand (edo frontier)
    g.fillStyle = '#c8a878'; g.fillRect(0,0,s,s);
    splotch(g,s,200,['#bb9a68','#d8b888','#a88858'],3,12,0.6);
    g.strokeStyle = 'rgba(120,90,50,.25)'; g.lineWidth = 2;
    for (let i=0;i<16;i++){ g.beginPath(); g.moveTo(0,i*16); 
      for (let x=0;x<=s;x+=32) g.lineTo(x, i*16 + Math.sin(x*0.05+i)*3); g.stroke(); }
  });
  T.psych = canvasTex(256, (g,s)=>{  // psychedelic marble (fractal world)
    g.fillStyle = '#3a1a6a'; g.fillRect(0,0,s,s);
    splotch(g,s,140,['#5a2a9a','#7a3adf','#ff6ad5','#2a0a4a'],6,26,0.55);
    splotch(g,s,60,['#ff9ae5','#8a4aff'],2,8,0.5);
  });
  T.blob = canvasTex(128, (g,s)=>{
    const r = g.createRadialGradient(s/2,s/2,4,s/2,s/2,s/2);
    r.addColorStop(0,'rgba(20,10,5,0.55)'); r.addColorStop(0.7,'rgba(20,10,5,0.28)'); r.addColorStop(1,'rgba(20,10,5,0)');
    g.fillStyle = r; g.fillRect(0,0,s,s);
  });
  T.glow = canvasTex(64, (g,s)=>{
    const r = g.createRadialGradient(s/2,s/2,1,s/2,s/2,s/2);
    r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(0.4,'rgba(255,255,255,.5)'); r.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0,0,s,s);
  });
  return T;
}

export function makeMaterials(T){
  const std = (map, extra={}) => new THREE.MeshStandardMaterial({ map, roughness:0.85, metalness:0, ...extra });
  const ground = [ std(T.dirt), std(T.dirt), std(T.grass,{roughness:0.9}),
                   std(T.dirt), std(T.dirt), std(T.dirt) ];
  const rockSet = [ std(T.rock), std(T.rock), std(T.rock), std(T.rock), std(T.rock), std(T.rock) ];
  const roofSet = [ std(T.roof), std(T.roof), std(T.roof,{roughness:0.6}), std(T.roof), std(T.roof), std(T.roof) ];
  const sandSet = [ std(T.sand), std(T.sand), std(T.sand), std(T.sand), std(T.sand), std(T.sand) ];
  const psychSet = [ std(T.psych), std(T.psych), std(T.psych,{roughness:0.5}), std(T.psych), std(T.psych), std(T.psych) ];
  return {
    wood: std(T.wood, { roughness:0.75 }),
    leaf: std(T.leaf, { roughness:0.9 }),
    rock: std(T.rock, { roughness:0.95 }),
    set(kind){
      return { ground, rock:rockSet, roof:roofSet, sand:sandSet, psych:psychSet }[kind] || ground;
    },
  };
}

// ─── WORLD ───
export class World {
  constructor(scene){
    this.scene = scene;
    this.colliders = [];       // {min,max,kind,delta,tag,data}
    this.updaters = [];        // fn(dt,t)
    this.killY = -14;
    this._q = [];
    this.movers = [];
  }
  addCollider(min, max, kind='solid', tag='', data=null){
    const c = { min:min.clone(), max:max.clone(), kind, tag, data,
      delta:new THREE.Vector3(), baseMin:min.clone(), baseMax:max.clone() };
    this.colliders.push(c);
    return c;
  }
  addBox(cx, cy, cz, w, h, d, kind='solid', tag='', data=null){
    return this.addCollider(
      new THREE.Vector3(cx-w/2, cy, cz-d/2),
      new THREE.Vector3(cx+w/2, cy+h, cz+d/2), kind, tag, data);
  }
  query(pos, half){
    this._q.length = 0;
    const minx=pos.x-half.x, maxx=pos.x+half.x;
    const miny=pos.y, maxy=pos.y+half.y*2;
    const minz=pos.z-half.z, maxz=pos.z+half.z;
    for (const c of this.colliders){
      if (c.disabled) continue;
      if (maxx>c.min.x && minx<c.max.x && maxy>c.min.y && miny<c.max.y && maxz>c.min.z && minz<c.max.z)
        this._q.push(c);
    }
    return this._q;
  }
  // ray vs AABB slabs; returns nearest distance or null
  raycast(origin, dir, maxDist){
    let best = null;
    for (const c of this.colliders){
      if (c.disabled || c.kind==='oneway') continue;
      let t0 = 0, t1 = maxDist, ok = true;
      for (const ax of ['x','y','z']){
        const o = origin[ax], d = dir[ax];
        if (Math.abs(d) < 1e-8){ if (o < c.min[ax] || o > c.max[ax]){ ok=false; break; } continue; }
        let ta = (c.min[ax]-o)/d, tb = (c.max[ax]-o)/d;
        if (ta > tb){ const tt=ta; ta=tb; tb=tt; }
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        if (t0 > t1){ ok = false; break; }
      }
      if (ok && t0 < maxDist && t0 > 0 && (best===null || t0 < best)) best = t0;
    }
    return best;
  }
  // distance straight down to nearest surface (for blob shadow)
  groundDist(pos, maxD=30){
    let best = null;
    for (const c of this.colliders){
      if (c.disabled) continue;
      if (pos.x > c.min.x && pos.x < c.max.x && pos.z > c.min.z && pos.z < c.max.z &&
          c.max.y <= pos.y + 0.05){
        const d = pos.y - c.max.y;
        if (d < maxD && (best===null || d < best)) best = d;
      }
    }
    return best;
  }
  onUpdate(fn){ this.updaters.push(fn); }
  update(dt, t){ for (const u of this.updaters) u(dt, t); }
}
