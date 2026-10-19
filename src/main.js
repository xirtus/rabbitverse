// ═══ RABBITVERSE — main orchestration: warp station + level manager ═══
import * as THREE from 'three';
import { Stage } from './render/Stage.js';
import { Post } from './render/Post.js';
import { Input } from './core/Input.js';
import { audio } from './core/Audio.js';
import { Particles } from './fx/Particles.js';
import { Rabbit } from './player/RabbitV2.js';   // V1 preserved in Rabbit.js
import { Controller } from './player/Controller.js';
import { CameraRail } from './player/CameraRail.js';
import { makeTextures } from './world/Level.js';
import { updateWind } from './world/builders.js';
import { PrimevalLevel } from './world/levels/primeval.js';
import { LevelRuntime } from './world/Runtime.js';
import { RECIPES, WORLDS } from './world/recipes.js';
import { Progress } from './core/Progress.js';
import { UI } from './ui/HUD.js';

class Emitter {
  constructor(){ this.map = {}; }
  on(e, f){ (this.map[e] ??= []).push(f); }
  off(e, f){ const l = this.map[e]; if (l){ const i = l.indexOf(f); if (i>=0) l.splice(i,1); } }
  emit(e, ...a){ (this.map[e]||[]).forEach(f=>f(...a)); }
}

class Game {
  constructor(){
    this.qa = new URLSearchParams(location.search);
    this.stage = new Stage(document.getElementById('app'));
    this.scene = this.stage.scene;
    this.input = new Input();
    this.events = new Emitter();
    this.fx = new Particles(this.scene);
    this.tex = makeTextures();
    this.rabbit = new Rabbit(this.scene);
    this.camRig = new CameraRail(this.stage.camera);
    this.ui = new UI(this.events);
    this.audio = audio;
    this.progress = new Progress();
    this.WORLDS = WORLDS;
    this.RECIPES = RECIPES;
    this.player = null;      // bound after first runtime exists
    this.level = null;       // active LevelRuntime
    this.post = new Post(this.stage);
    this.post.enabled = !this.qa.has('nopost');

    this.state = 'title';
    this.levelTime = 0;
    this.deathT = 0;
    this.windMats = [];

    this._wireEvents();
    if (this.qa.has('unlock')){
      for (const w of WORLDS) for (const l of w.levels)
        this.progress.record(l.id, { gem:true, crates:0, cratesTotal:0, carrots:0, deaths:0, time:0 });
      console.log('%c[DEBUG] all levels unlocked', 'color:#8f8');
    }
    this.loadLevel('hub');            // hub is the title backdrop
    this._bindPlayer();

    document.getElementById('load').style.opacity = 0;
    setTimeout(()=> document.getElementById('load').remove(), 600);
    this.ui.show('Title');
    audio.setMusic('none');

    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.fpsAcc = 0; this.fpsN = 0; this.fpsT = 0;
    this.renderer = this.stage.renderer;
    this.renderer.info.autoReset = false;
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  // ═══ level manager ═══
  loadLevel(id){
    if (this.level){ this.level.teardown(); }
    const recipe = RECIPES[id] || RECIPES.hub;
    const rt = new LevelRuntime(this, recipe);
    this.level = rt;
    if (recipe.primeval){
      const facade = {
        builders:rt.builders, world:rt.world, crates:rt.crates, collect:rt.collect,
        enemies:rt.enemies, hazards:rt.hazards, deco:rt.deco, tex:this.tex, fx:this.fx,
        stage:this.stage, events:this.events, player:this.player, camRig:this.camRig,
        audio:this.audio, levelGroup:rt.group,
        setCamera:m=>this.setCamera(m), setMusic:m=>this.setMusic(m),
      };
      const pl = new PrimevalLevel(facade);
      pl.build();
      rt.primeval = pl;
      Object.defineProperty(rt, 'boss', { get:()=> pl.boss });
      Object.defineProperty(rt, 'currentCP', { get:()=> pl.currentCP, set:v=>{ pl.currentCP = v; } });
      Object.defineProperty(rt, 'boulder', { get:()=> pl.boulder });
      rt.recipe.update = (r, dt, t)=> pl.update(dt, t);
      rt.applyTheme();
      this.camRig.setNodes(pl.rail);
      this._respawnPoint = { pos:pl.startPos.clone(), facing:Math.PI };
      pl._setCP({ pos:pl.startPos.clone(), facing:Math.PI });
    } else {
      rt.build();
      this.camRig.setNodes(rt.kit.rail);
      const cp0 = rt.checkpoints[0] || rt.kit.checkpoints[0];
      this._respawnPoint = cp0 ? { pos:cp0.pos.clone(), facing:cp0.facing } : { pos:new THREE.Vector3(0,0.4,0), facing:Math.PI };
      rt._setCP(cp0 || { pos:new THREE.Vector3(0,0.4,0), facing:Math.PI });
    }
    // live aliases used by the loop
    this.world = rt.world; this.crates = rt.crates; this.collect = rt.collect;
    this.enemies = rt.enemies; this.hazards = rt.hazards; this.builders = rt.builders;
    if (this.player){
      this.player.frozen = false;
      this.player.world = rt.world;
      this.player.respawn(this._respawnPoint.pos, this._respawnPoint.facing);
      this.player.deaths = 0;
      this.camRig.yaw = this._respawnPoint.facing;
      this.camRig.snap();
    }
    this.levelId = id;
    this.levelTime = 0;
    this.windMats = [];
    this._collectWind(rt.group);
    this.ui.setCrates(0, rt.crates.total);
    this.events.emit('levelLoaded', id);
  }
  _bindPlayer(){
    this.player = new Controller(this.rabbit, this.world, this.fx, this.events);
    this.player.respawn(this._respawnPoint.pos, this._respawnPoint.facing);
    this.camRig.yaw = this._respawnPoint.facing;
    this.camRig.snap();
    // blob shadow
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.MeshBasicMaterial({ map:this.tex.blob, transparent:true, depthWrite:false }));
    this.blob.rotation.x = -Math.PI/2;
    this.scene.add(this.blob);
  }
  _collectWind(o){
    o.traverse(m=>{ if (m.material && m.material.userData) this.windMats.push(m.material); });
  }
  _wireEvents(){
    const ev = this.events;
    ev.on('uiPlay', ()=> this.startPlay());
    ev.on('uiResume', ()=> this.togglePause(false));
    ev.on('uiRestart', ()=> this.loadLevel(this.levelId) || (this.state = 'play', this.ui.hideAll(), audio.setMusic('level')));
    ev.on('uiQuit', ()=> this.loadLevel('hub') || (this.state='play', this.ui.hideAll()));
    ev.on('shake', s => this.camRig.impulse(s));
    ev.on('carrotBurst', (p,n)=> this.collect.burst(p,n));
    ev.on('lifeUp', p => { this.collect.lives++; this.ui.setLives(this.collect.lives); audio.life(); ev.emit('toast','1UP!'); this.fx.starBurst(p, 16, 0xff5d8e); });
    ev.on('crateBroken', ()=> this.ui.setCrates(this.crates.broken, this.crates.total));
    ev.on('slamLand', pos => { this.crates.onSlamLand(pos); this.camRig.impulse(0.45); });
    ev.on('playerHurt', ()=> this.camRig.impulse(0.55));
    ev.on('explosionAt', (p, r)=>{
      const d = Math.hypot(this.player.pos.x-p.x, this.player.pos.z-p.z);
      if (d < r && Math.abs(this.player.pos.y - p.y) < 2.4 && this.player.iframes <= 0){
        this.player.hurt(p.x, p.z); this.camRig.impulse(0.8);
      }
      for (const e of this.enemies.enemies)
        if (e.alive && e.mesh.position.distanceTo(p) < r+0.5) this.enemies.kill(e, 'explosion');
    });
    ev.on('playerDied', ()=>{
      this.state = 'dead'; this.deathT = 0;
      this.collect.lives--;
      this.ui.setLives(this.collect.lives);
    });
    ev.on('levelComplete', ()=>{
      if (this.state === 'results') return;
      this.state = 'results';
      this.player.frozen = true;
      this.rabbit.onWin();
      const isHub = this.levelId === 'hub';
      // completing the level grants its Reality Gem (no missable progression tokens)
      let gemGot = this.collect.gems.some(g=>g.got);
      if (!isHub && !gemGot){
        const g0 = this.collect.gems[0];
        if (g0){ g0.got = true; g0.m.visible = false; }
        gemGot = true;
        this.fx.starBurst(this.player.pos, 24, 0x9feaff);
      }
      if (!isHub){
        this.progress.record(this.levelId, {
          gem:gemGot, crates:this.crates.broken, cratesTotal:this.crates.total,
          carrots:this.collect.count, deaths:this.player.deaths, time:this.levelTime|0 });
      }
      audio.setMusic('none'); audio.gem();
      setTimeout(()=>{
        if (this.state !== 'results') return;
        this.ui.results({
          carrots:this.collect.count, cratesB:this.crates.broken, cratesT:this.crates.total,
          deaths:this.player.deaths, time:this.levelTime|0, gems: gemGot ? '💎' : '—' });
        if (this.state === 'results') audio.setMusic('title');
      }, 1200);
    });
  }
  startPlay(){
    this.ui.hideAll();
    this.ui.showHUD();
    this.state = 'play';
    audio.resume();
    audio.setMusic(this.levelId === 'hub' ? 'hub' : 'level');
    this.ui.toast(this.level.recipe.name);
  }
  togglePause(v){
    if (this.state !== 'play' && this.state !== 'pause') return;
    this.state = v ? 'pause' : 'play';
    if (v){ this.ui.show('Pause'); audio.setMusic('none'); }
    else { this.ui.hideAll(); audio.setMusic(this._musicForZone()); }
  }
  _musicForZone(){
    const chase = this.level._chaser || this.level.boulder;
    if (this.level.boss && this.level.boss.active && !this.level.boss.dead) return 'boss';
    if (this.level.primeval && this.level.primeval.boss && this.level.primeval.boss.active && !this.level.primeval.boss.dead) return 'boss';
    if (chase && chase.active && !chase.done) return 'chase';
    return this.levelId === 'hub' ? 'hub' : 'level';
  }
  setCamera(mode){ this.camRig.setMode(mode === 'boss' ? 'boss' : 'rail'); }
  setMusic(m){ audio.setMusic(m); }

  _loop(){
    requestAnimationFrame(this._loop);
    const rawDt = Math.min(this.clock.getDelta(), 0.05);
    const dt = rawDt;
    this.elapsed += dt;
    const t = this.elapsed;
    this.input.poll();

    if (this.input.pausePressed){
      if (this.state === 'play') this.togglePause(true);
      else if (this.state === 'pause') this.togglePause(false);
    }
    audio.update();

    if (this.state === 'play' || this.state === 'dead'){
      const playing = this.state === 'play';
      if (playing) this.levelTime += dt;
      if (playing) this.player.update(dt, this.input, this.camRig.yaw);
      else this.player.update(0, this.input, this.camRig.yaw);

      const worldDt = playing ? dt : 0;
      this.world.update(worldDt, t);
      this.level.update(worldDt, t);
      if (playing){
        this.crates.update(dt, this.player, this);
        this.collect.update(dt, t, this.player, this);
        this.enemies.update(dt, t, this.player, this);
        this.hazards.update(dt, t, this.player, this);
      }
      this.fx.update(dt);

      if (this.state === 'dead'){
        this.deathT += dt;
        if (this.deathT > 1.15){
          if (this.collect.lives < 0){
            this.state = 'gameover';
            this.ui.show('GameOver');
            audio.setMusic('none');
          } else {
            for (const r of this.builders.resetters) r();
            const cp = this.level.currentCP;
            this.player.respawn(cp.pos, cp.facing ?? Math.PI);
            this.camRig.yaw = this.player.facing;
            this.camRig.snap();
            this.state = 'play';
          }
        }
      }
    } else if (this.state === 'results'){
      this.rabbit.update({ dt, speed:0, grounded:true, vy:0, state:'win', moveX:0 });
      this.fx.update(dt);
      this.level.update(dt, t);
    } else {
      this.fx.update(dt);
      if (this.level) this.level.update(dt * 0 + (this.state==='pause'?0:dt), this.state==='pause' ? t : t);
      this.rabbit.update({ dt, speed:0, grounded:true, vy:0, state:'idle', moveX:0 });
      if (this.state === 'title'){
        // slow cinematic drift framing the station (never clips the dais)
        const a = Math.sin(t*0.07)*0.35;
        this.stage.camera.position.set(Math.sin(a)*8, 5.8 + Math.sin(t*0.11)*0.6, 16.5 + Math.cos(t*0.09)*1.2);
        this.stage.camera.lookAt(0, 1.8, -1);
        this.stage.camera.fov = 52; this.stage.camera.updateProjectionMatrix();
      }
    }

    if (window.__qaCam){
      const c = window.__qaCam;
      this.stage.camera.position.set(...c.pos);
      this.stage.camera.lookAt(...c.look);
      this.stage.camera.fov = c.fov ?? 45; this.stage.camera.updateProjectionMatrix();
    } else if (this.state === 'play' || this.state === 'dead' || this.state === 'pause' || this.state === 'results'){
      this.camRig.update(dt, this.player, this.input);
    }

    // blob shadow
    const gd = this.world.groundDist(this.player.pos);
    if (gd !== null && gd < 12 && this.rabbit.root.visible){
      this.blob.visible = true;
      this.blob.position.set(this.player.pos.x, this.player.pos.y - gd + 0.03, this.player.pos.z);
      const s = THREE.MathUtils.clamp(1.15 - gd*0.05, 0.35, 1.15);
      this.blob.scale.setScalar(s);
      this.blob.material.opacity = THREE.MathUtils.clamp(0.85 - gd*0.06, 0.15, 0.85);
    } else this.blob.visible = false;

    this.renderer.info.reset();
    this.stage.followShadow(this.player.pos);
    this.stage.update(t);
    updateWind(this.windMats, t);
    this.ui.update(rawDt, this.player);

    this.post.render();
    this.input.endFrame();

    this.fpsAcc += rawDt; this.fpsN++;
    if ((this.fpsT += rawDt) > 0.5){
      const fps = this.fpsN/this.fpsAcc;
      this.fpsAcc = 0; this.fpsN = 0; this.fpsT = 0;
      const el = document.getElementById('fps');
      if (this.qa.has('debug')){
        el.style.display = 'block';
        const i = this.renderer.info;
        el.textContent = `${fps.toFixed(0)} fps  draws:${i.render.calls}  tris:${(i.render.triangles/1000).toFixed(0)}k  ${this.levelId}`;
      }
      window.__fps = fps;
    }
  }
}

const game = new Game();
window.__game = game;
window.__qa = {
  start(){ game.ui.hideAll(); game.startPlay(); },
  load(id){ game.loadLevel(id); if (game.state !== 'play') game.startPlay(); },
  warp(x, y, z, facing=Math.PI){
    game.player.respawn(new THREE.Vector3(x, y, z), facing);
    game.level._setCP({ pos:new THREE.Vector3(x, y, z), facing });
    game.camRig.yaw = facing; game.camRig.snap();
  },
  pos(){ const p = game.player.pos; return [p.x, p.y, p.z]; },
  key(code, down=true){
    if (down) game.input.pressed.add(code), game.input.keys.add(code);
    else { game.input.keys.delete(code); game.input.released.add(code); }
  },
  clearKeys(){ game.input.keys.clear(); },
  axis(x, y){ game.input.axis.x = x; game.input.axis.y = y; },
  cam(px,py,pz, lx,ly,lz, fov=45){ window.__qaCam = { pos:[px,py,pz], look:[lx,ly,lz], fov }; },
  camOff(){ window.__qaCam = null; },
  stats(){
    const i = game.renderer.info;
    return { fps:window.__fps, draws:i.render.calls, tris:i.render.triangles,
      pos:this.pos(), state:game.state, level:game.levelId, gems:game.progress.gems,
      carrots:game.collect.count, crates:game.crates.broken, total:game.crates.total,
      deaths:game.player.deaths, lives:game.collect.lives };
  },
  god(){ game.player.iframes = 1e9; },
  grantGems(n){ // QA: fake completions to open doors
    game.WORLDS.forEach((w,wi)=> w.levels.forEach((l,li)=>{ if (wi*10+li < n) game.progress.record(l.id, { gem:true, crates:0, cratesTotal:0, carrots:0, deaths:0, time:0 }); }));
  },
};
