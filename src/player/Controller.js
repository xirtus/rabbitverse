// ═══ CONTROLLER — AAA platforming feel: coyote, buffer, slide, slam, spin ═══
import * as THREE from 'three';
import { audio } from '../core/Audio.js';

const G = 30;               // gravity (snappy, not floaty)
const RUN = 9.2;            // top run speed
const ACCEL = 52, DECEL = 46;
const AIR_CTL = 0.62;
const JUMP_V = 12.2;        // ~2.5m jump
const DJUMP_V = 10.5;
const COYOTE = 0.12, BUFFER = 0.14;
const SLIDE_V = 13.2, SLIDE_T = 0.62;
const SLAM_V = -30;

export class Controller {
  constructor(rabbit, world, fx, events){
    this.rabbit = rabbit; this.world = world; this.fx = fx; this.ev = events;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.half = new THREE.Vector3(0.34, 0.62, 0.34);   // collision half extents
    this.facing = 0;              // yaw
    this.grounded = false;
    this.groundCol = null;
    this.coyote = 0; this.buffer = 0;
    this.jumps = 0;               // 0 = grounded, 1 = jumped, 2 = double jumped
    this.state = 'idle';
    this.spinT = 0; this.spinCD = 0;
    this.slideT = 0;
    this.slamPhase = 0;           // 0 none, 1 hang, 2 drop
    this.hurtT = 0; this.iframes = 0;
    this.dead = false;
    this.deaths = 0;
    this.unlocks = { doubleJump:true, slide:true, slam:true, spin:true };
    this.moveX = 0;               // strafe for anim
    this._wish = new THREE.Vector3();
    this._tmp = new THREE.Vector3();
    this.timeSlow = 0;            // reality power timer
    this.frozen = false;          // cutscene / results lock
    this.landedHard = 0;
  }
  get spinning(){ return this.spinT > 0; }
  get slamming(){ return this.slamPhase === 2; }
  get speed(){ return Math.hypot(this.vel.x, this.vel.z); }
  get center(){ return this._tmp.set(this.pos.x, this.pos.y+this.half.y, this.pos.z); }

  respawn(p, facing=0){
    this.pos.copy(p); this.vel.set(0,0,0);
    this.facing = facing;
    this.dead = false; this.frozen = false; this.state = 'idle';
    this.iframes = 1.5; this.hurtT = 0; this.spinT = 0; this.slideT = 0; this.slamPhase = 0;
    this.jumps = 0;
    this.rabbit.root.visible = true;
  }
  kill(cause='fall'){
    if (this.dead) return;
    this.dead = true; this.deaths++;
    this.state = 'dead';
    audio.death();
    this.ev.emit('playerDied', cause);
  }
  hurt(fromX, fromZ){
    if (this.iframes > 0 || this.dead) return false;
    this.iframes = 1.4; this.hurtT = 0.55;
    this.state = 'hurt';
    const dx = this.pos.x-fromX, dz = this.pos.z-fromZ;
    const l = Math.hypot(dx,dz)||1;
    this.vel.x = dx/l*8.5; this.vel.z = dz/l*8.5; this.vel.y = 7;
    this.rabbit.onHurt();
    audio.hurt();
    this.ev.emit('playerHurt');
    return true;
  }

  update(dt, input, camYaw){
    const R = this.rabbit;
    if (this.dead || this.frozen){
      // still fall if dead in pit? keep frozen; anim update only
      R.update({ dt, speed:0, grounded:true, vy:0, state:this.state, moveX:0 });
      return;
    }
    // timers
    this.coyote -= dt; this.buffer -= dt; this.spinCD -= dt;
    this.iframes -= dt; this.hurtT -= dt;
    if (this.timeSlow > 0) this.timeSlow -= dt;

    // ── wish dir (camera relative) ──
    const ax = input.axis;
    const sin = Math.sin(camYaw), cos = Math.cos(camYaw);
    this._wish.set(-ax.x*cos - ax.y*sin, 0, ax.x*sin - ax.y*cos);
    const wishLen = Math.min(1, this._wish.length());
    this.moveX = ax.x;

    // ── horizontal accel ──
    const ctl = this.grounded ? 1 : AIR_CTL;
    const hurtK = this.hurtT > 0 ? 0.25 : 1;
    let maxV = RUN;
    if (this.slideT > 0) maxV = SLIDE_V;
    if (wishLen > 0.01){
      this.vel.x += this._wish.x * ACCEL * ctl * hurtK * dt * wishLen;
      this.vel.z += this._wish.z * ACCEL * ctl * hurtK * dt * wishLen;
    } else if (this.grounded && this.slideT <= 0){
      const sp = this.speed;
      if (sp > 0.01){
        const drop = Math.min(sp, DECEL*dt);
        this.vel.x -= this.vel.x/sp*drop; this.vel.z -= this.vel.z/sp*drop;
      }
    }
    // clamp
    const sp = this.speed;
    if (sp > maxV && this.slideT <= 0){
      const k = Math.max(maxV, sp - DECEL*0.5*dt) / sp;
      this.vel.x *= k; this.vel.z *= k;
    } else if (this.slideT > 0 && sp > SLIDE_V){
      const k = Math.max(SLIDE_V, sp - 6*dt) / sp;
      this.vel.x *= k; this.vel.z *= k;
    }

    // ── facing follows velocity ──
    if (sp > 0.6 && this.hurtT <= 0){
      const target = Math.atan2(this.vel.x, this.vel.z);
      let d = target - this.facing;
      while (d > Math.PI) d -= Math.PI*2;
      while (d < -Math.PI) d += Math.PI*2;
      this.facing += d * Math.min(1, dt*14);
    }

    // ── jump: buffer + coyote + variable ──
    if (input.jumpPressed) this.buffer = BUFFER;
    const canGround = this.grounded || this.coyote > 0;
    if (this.buffer > 0 && this.hurtT <= 0){
      if (canGround && this.jumps === 0){
        this.buffer = 0;
        const boost = this.slideT > 0 ? 1.06 : 1;    // slide-jump keeps speed + tiny boost
        this.vel.y = JUMP_V * boost;
        if (this.slideT > 0){ const s=Math.max(this.speed, SLIDE_V*0.96); const a=this.facing;
          this.vel.x = Math.sin(a)*s; this.vel.z = Math.cos(a)*s; }
        this.jumps = 1; this.grounded = false; this.coyote = 0;
        this.slideT = 0;
        R.onJump(); audio.jump();
        this.fx.dust(this.pos, 6);
        this.ev.emit('jump');
      } else if (!this.grounded && this.jumps === 1 && this.unlocks.doubleJump){
        this.buffer = 0;
        this.vel.y = DJUMP_V;
        this.jumps = 2;
        R.onDoubleJump(); audio.doubleJump();
        this.fx.ring(this.pos, 1.2);
        this.fx.sparkle(this.pos, 8, 0x9feaff);
        this.ev.emit('doubleJump');
      }
    }
    // variable jump height
    if (!input.jumpHeld && this.vel.y > 4.5 && this.jumps >= 1) this.vel.y = 4.5;

    // ── spin ──
    if (input.spinPressed && this.spinCD <= 0 && this.hurtT <= 0 && this.unlocks.spin){
      this.spinT = 0.5; this.spinCD = 0.62;
      R.onSpin(); audio.spin();
      this.ev.emit('spin');
    }
    if (this.spinT > 0) this.spinT -= dt;

    // ── slide / slam ──
    if (input.slidePressed && this.hurtT <= 0){
      if (this.grounded && this.speed > 3.5 && this.slideT <= 0 && this.unlocks.slide){
        this.slideT = SLIDE_T;
        const a = this.facing;
        this.vel.x = Math.sin(a)*Math.max(this.speed, SLIDE_V);
        this.vel.z = Math.cos(a)*Math.max(this.speed, SLIDE_V);
        audio.slide(); this.fx.dust(this.pos, 5, 0xcdb894);
        this.ev.emit('slide');
      } else if (!this.grounded && this.slamPhase === 0 && this.unlocks.slam){
        this.slamPhase = 1; this.slamHang = 0.10;
        this.vel.set(0,0,0);
        audio.slamStart();
        this.ev.emit('slamStart');
      }
    }
    if (this.slideT > 0){
      this.slideT -= dt;
      if (Math.random() < dt*30) this.fx.dust(this.pos, 1, 0xcdb894);
      if (!this.grounded || this.speed < 2.5) this.slideT = 0;
    }
    if (this.slamPhase === 1){
      this.slamHang -= dt;
      if (this.slamHang <= 0){ this.slamPhase = 2; this.vel.y = SLAM_V; }
    }

    // ── gravity ──
    let g = G;
    if (this.spinT > 0 && !this.grounded && this.vel.y < 0) g *= 0.55;  // spin float
    if (this.slamPhase === 1) g = 0;
    this.vel.y -= g*dt;
    if (this.vel.y < -32) this.vel.y = -32;

    // ── move & collide ──
    const wasGrounded = this.grounded;
    const fallSpeed = -this.vel.y;
    this._move(dt);

    // landing
    if (this.grounded && !wasGrounded){
      const hard = Math.min(1, fallSpeed/28);
      this.landedHard = hard;
      R.onLand(hard);
      audio.land(hard);
      this.fx.dust(this.pos, 4 + (hard*8|0));
      if (this.slamPhase === 2){
        this.slamPhase = 0;
        audio.slamLand();
        this.fx.shockwave(this.pos, 3.2, 0xfff1a8);
        this.fx.dust(this.pos, 18, 0xcdb894);
        this.ev.emit('slamLand', this.pos);
      }
      this.jumps = 0;
    }
    if (this.grounded) this.jumps = 0;

    // ── state select ──
    let st;
    if (this.hurtT > 0.25) st = 'hurt';
    else if (this.slamPhase > 0) st = 'slam';
    else if (this.slideT > 0) st = 'slide';
    else if (this.spinT > 0) st = 'spin';
    else if (!this.grounded) st = this.vel.y > 0.5 ? 'jump' : 'fall';
    else if (this.speed > 0.5) st = 'run';
    else st = 'idle';
    this.state = st;

    // ── apply to rabbit ──
    this.rabbit.root.position.copy(this.pos);
    this.rabbit.root.rotation.y = this.facing;
    // i-frame blink
    this.rabbit.root.visible = this.iframes <= 0 || (this.iframes*14|0)%2===0;
    this.rabbit.update({
      dt, speed:this.speed, grounded:this.grounded, vy:this.vel.y,
      vx:this.vel.x, vz:this.vel.z, state:st, moveX:this.moveX,
    });
  }

  _move(dt){
    const W = this.world;
    // ride moving platform
    if (this.grounded && this.groundCol && this.groundCol.delta){
      this.pos.x += this.groundCol.delta.x;
      this.pos.y += this.groundCol.delta.y;
      this.pos.z += this.groundCol.delta.z;
    }
    const h = this.half;
    // Y
    const prevY = this.pos.y;
    this.pos.y += this.vel.y*dt;
    this.grounded = false;
    let cols = W.query(this.pos, h);
    for (const c of cols){
      // oneway: land only if feet were above the surface BEFORE this move
      if (c.kind === 'oneway' && (this.vel.y > 0.01 || prevY < c.max.y - 0.02)) continue;
      if (this.vel.y <= 0 && this.pos.y < c.max.y && this.pos.y > c.max.y - 2.0){
        this.pos.y = c.max.y; this.vel.y = 0;
        this.grounded = true; this.groundCol = c; this.coyote = COYOTE;
      } else if (this.vel.y > 0 && this.pos.y + h.y*2 > c.min.y && this.pos.y < c.min.y){
        this.pos.y = c.min.y - h.y*2 - 0.001; this.vel.y = 0;
      }
    }
    if (!this.grounded && this.groundCol) this.groundCol = null;
    // X
    this.pos.x += this.vel.x*dt;
    cols = W.query(this.pos, h);
    for (const c of cols){
      if (c.kind === 'oneway') continue;
      if (this.pos.x + h.x > c.min.x && this.pos.x - h.x < c.max.x &&
          this.pos.y + h.y*2 > c.min.y + 0.02 && this.pos.y < c.max.y + 0.02 &&
          this.pos.z + h.z > c.min.z && this.pos.z - h.z < c.max.z){
        // step-up assist
        if (c.max.y - this.pos.y <= 0.34 && this.vel.y <= 0.1){ this.pos.y = c.max.y; this.grounded = true; this.groundCol = c; continue; }
        if (this.vel.x > 0) this.pos.x = c.min.x - h.x; else if (this.vel.x < 0) this.pos.x = c.max.x + h.x;
        else this.pos.x = (this.pos.x < (c.min.x+c.max.x)/2) ? c.min.x - h.x : c.max.x + h.x;
        this.vel.x = 0;
      }
    }
    // Z
    this.pos.z += this.vel.z*dt;
    cols = W.query(this.pos, h);
    for (const c of cols){
      if (c.kind === 'oneway') continue;
      if (this.pos.x + h.x > c.min.x && this.pos.x - h.x < c.max.x &&
          this.pos.y + h.y*2 > c.min.y + 0.02 && this.pos.y < c.max.y + 0.02 &&
          this.pos.z + h.z > c.min.z && this.pos.z - h.z < c.max.z){
        if (c.max.y - this.pos.y <= 0.34 && this.vel.y <= 0.1){ this.pos.y = c.max.y; this.grounded = true; this.groundCol = c; continue; }
        if (this.vel.z > 0) this.pos.z = c.min.z - h.z; else if (this.vel.z < 0) this.pos.z = c.max.z + h.z;
        else this.pos.z = (this.pos.z < (c.min.z+c.max.z)/2) ? c.min.z - h.z : c.max.z + h.z;
        if (typeof window !== 'undefined') window.__lastClamp = { tag:c.tag, min:c.min.toArray(), max:c.max.toArray(), py:this.pos.y, vy:this.vel.y, cx:(c.data&&c.data.type)||null };
        this.vel.z = 0;
      }
    }
  }
}
