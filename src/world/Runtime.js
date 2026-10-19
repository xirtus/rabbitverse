// ═══ LEVEL RUNTIME — build/teardown a level from a recipe ═══
import * as THREE from 'three';
import { World, makeMaterials } from './Level.js';
import { Builders, updateWind } from './builders.js';
import { Deco } from './Deco.js';
import { CrateSystem } from './Crates.js';
import { Collectibles } from './Collectibles.js';
import { EnemySystem } from './Enemies.js';
import { Hazards } from './Hazards.js';
import { Portal } from './Portal.js';
import { Water } from './Water.js';
import { LevelKit } from './LevelKit.js';
import { ArchetypeBoss } from './BossKit.js';
import { THEMES } from './Themes.js';

export class LevelRuntime {
  constructor(game, recipe){
    this.game = game;
    this.recipe = recipe;
    this.group = new THREE.Group();      // everything level-owned lives here
    game.stage.scene.add(this.group);
    this.scene = this.group;
    this.theme = THEMES[recipe.theme] || THEMES.garden;
    this.world = new World(this.group);
    this.world.killY = recipe.killY ?? -10;
    this.mats = makeMaterials(game.tex);
    this.builders = new Builders(this.group, this.world, this.mats, game.fx);
    this.builders.groundKind = this.theme.ground || 'ground';
    this.builders.pathTex = game.tex.path;
    this.deco = new Deco(this.group, this.mats);
    this.crates = new CrateSystem(this.group, this.world, game.fx, game.events);
    this.collect = new Collectibles(this.group, game.fx, game.events);
    this.enemies = new EnemySystem(this.group, game.fx, game.events);
    this.enemies.killY = this.world.killY;
    this.hazards = new Hazards(this.group, this.world, game.fx);
    // recipe-friendly aliases
    this.B = this.builders; this.W = this.world; this.C = this.crates;
    this.K = this.collect; this.E = this.enemies; this.H = this.hazards; this.D = this.deco;
    this.PortalClass = Portal;
    this.portal = null;
    this.water = null;
    this.kit = new LevelKit(this);
    this.checkpoints = [];
    this.triggers = [];
    this.currentCP = null;
    this.boss = null;
    this.bossSpawn = null;
    this._portalPlaced = false;
  }
  startBoss(){
    if (!this.bossSpawn || this.boss) return;
    const g = this.game, bs = this.bossSpawn;
    this.boss = new ArchetypeBoss(this.scene, this.world, g.fx, g.events, bs.pos.x, bs.pos.y, bs.pos.z, bs.cfg);
    this.boss.start();
    g.camRig.setMode('boss', { bossTarget:new THREE.Vector3(bs.pos.x, bs.pos.y + 3, bs.pos.z) });
    g.setMusic('boss');
    g.events.emit('bossStart', bs.cfg.name);
    g.events.emit('toast', bs.cfg.name + '!');
    const onSummon = ()=>{
      // adds pour in from the arena edges
      for (let i=0;i<2;i++){
        const a = Math.random()*Math.PI*2;
        this.enemies.add('snarlrat', bs.pos.x - 6 + Math.cos(a)*3, bs.pos.y + 0.42, bs.pos.z - 6 + Math.sin(a)*3, { patrol:2.5, speed:2 });
      }
    };
    g.events.on('bossSummon', onSummon);
    const onDown = ()=>{
      g.events.off('bossSummon', onSummon);
      g.setMusic('level');
      g.camRig.setMode('rail');
      g.events.emit('bossEnd');
      g.events.emit('toast', 'REALITY GEM!');
      this.collect.placeGem(bs.pos.x - 2, this.currentCP ? this.currentCP.pos.y : bs.pos.y + 1.4, bs.pos.z - 4, 0x41e6ff);
      // exit portal opens where the boss fell
      this.portal = new this.PortalClass(this.scene, g.fx, bs.pos.x, bs.pos.y + 2.0, bs.pos.z, { hue:0.52 });
      this.portal.setOpen(true);
      this._portalPlaced = true;
      g.events.off('bossDown', onDown);
    };
    g.events.on('bossDown', onDown);
  }
  applyTheme(){
    const t = this.theme, g = this.game;
    g.stage.setSkyMood({
      top:t.sky.top, mid:t.sky.mid, bottom:t.sky.bottom,
      sun:t.sun, hemiSky:t.hemiSky, hemiGround:t.hemiGround,
      fog:t.fog, fogNear:t.fogNear, fogFar:t.fogFar, exposure:t.exposure,
    });
    if (t.water && this.recipe.water !== false){
      this.water = new Water(this.group, this.recipe.waterY ?? -7.5);
      this.water.uniforms.uDeep.value.set(t.water.deep);
      this.water.uniforms.uShallow.value.set(t.water.shallow);
    }
  }
  build(){
    this.applyTheme();
    this.recipe.build(this);
    // foliage instancing must come after level geometry
    this.builders.buildFoliage(this.game.tex);
    this.deco.build(this.game.tex);
    if (!this.checkpoints.length && this.kit.checkpoints.length)
      this.checkpoints = this.kit.checkpoints;
    if (this.kit.checkpoints.length) this.checkpoints = this.kit.checkpoints;
  }
  trigger(min, max, fn, once=true){
    this.triggers.push({ min:new THREE.Vector3(...min), max:new THREE.Vector3(...max), fn, once, fired:false });
  }
  _setCP(c){ this.currentCP = c; }
  update(dt, t){
    const g = this.game, p = g.player;
    for (const tr of this.triggers){
      if (tr.fired && tr.once) continue;
      if (p.pos.x>tr.min.x && p.pos.x<tr.max.x && p.pos.y>tr.min.y && p.pos.y<tr.max.y && p.pos.z>tr.min.z && p.pos.z<tr.max.z){
        tr.fired = true; tr.fn();
      }
    }
    if (p.pos.y < this.world.killY && !p.dead) p.kill('fall');
    if (this.portal){
      if (this.portal.update(dt, p.pos)){
        if (this.recipe.onPortal) this.recipe.onPortal(g, this);
        else g.events.emit('levelComplete');
      }
    }
    if (this.boss) this.boss.update(dt, t, p, g);
    if (this.water) this.water.update(t);
    this.deco.update(dt, t);
    if (this.recipe.update) this.recipe.update(this, dt, t);
  }
  teardown(){
    const scene = this.game.stage.scene;
    scene.remove(this.group);
    this.group.traverse(o=>{
      if (o.geometry && !o.geometry._shared) o.geometry.dispose?.();
      if (o.material){
        for (const m of Array.isArray(o.material) ? o.material : [o.material]){
          if (m.map && m.map._shared) continue;
          m.dispose?.();
        }
      }
    });
  }
}
