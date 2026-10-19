// ═══ SMOKE TEST — every level loads + completable via rail-anchor bot ═══
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5184;
const only = process.argv[2] || null;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 6000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:960, height:540 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => { errors.push(e.message); console.log('PAGEERR:', e.message.slice(0,140)); });
await page.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2200));

const ids = await page.evaluate(`Object.keys(window.__game.RECIPES || {})`);
const levels = ids.filter(i => i !== 'hub' && (!only || i === only));
console.log('levels:', levels.join(' '));

for (const id of levels){
  await page.evaluate(`window.__qa.load('${id}')`);
  await page.evaluate(`window.__qa.god()`);
  await page.evaluate(`window.__game.collect.lives = 99;`);
  await new Promise(r => setTimeout(r, 600));
  // drive: follow rail anchors with gap-jumps
  await page.evaluate(`(()=>{ try{
    const g = window.__game;
    const anchors = g.camRig.nodes.map(n => [n.a.x, n.a.y, n.a.z]);
    const B = window.__smoke = { i:0, done:false, t:0, jumpCD:0, rec:[] };
    const keys = g.input.keys, pressed = g.input.pressed;
    g.input.poll = function(){ this.camAxis.x = 0; this.camAxis.y = 0; };
    window.__smokeStep = (dt)=>{
      if (B.done) return;
      B.t += dt; B.jumpCD -= dt;
      const p = g.player.pos;
      const wp = anchors[B.i];
      if (!wp){ B.done = true; return; }
      const dx = wp[0]-p.x, dz = wp[2]-p.z;
      const d = Math.hypot(dx, dz);
      if (d < 2.6 && Math.abs(wp[1]-p.y) < 1.4){ B.i++; return; }
      // ══ boss engagement ══
      const boss = g.level.boss;
      if (boss && boss.active && !boss.dead){
        let danger = false;
        for (const sw of boss.shockwaves){
          const sd = Math.hypot(p.x-sw.x, p.z-sw.z);
          if (Math.abs(sd - sw.r) < 1.6 && g.player.grounded) danger = true;
        }
        if (danger && B.jumpCD <= 0){
          pressed.add('Space'); keys.add('Space');
          setTimeout(()=>keys.delete('Space'), 320); B.jumpCD = 0.45;
        }
        if (boss.state === 'tired'){
          const hw = boss.hitPos();
          const hd = Math.hypot(hw.x-p.x, hw.z-p.z);
          const cy0 = g.camRig.yaw;
          const fw0 = { x:Math.sin(cy0), z:Math.cos(cy0) }, rt0 = { x:-Math.cos(cy0), z:Math.sin(cy0) };
          const dd = hd || 1;
          const wx = (hw.x-p.x)/dd, wz = (hw.z-p.z)/dd;
          g.input.axis.x = wx*rt0.x + wz*rt0.z;
          g.input.axis.y = -(wx*fw0.x + wz*fw0.z);
          if (hd < 2.6){ pressed.add('KeyJ'); keys.add('KeyJ'); setTimeout(()=>keys.delete('KeyJ'), 120); }
        } else {
          g.input.axis.x = 0;
          g.input.axis.y = p.z > (boss.pos ? boss.pos.z : 0) - 6 ? 0.6 : 0;  // hover mid-arena
        }
        B.rec.push(['boss', boss.hp, boss.state]);
        return;
      }
      const cy = g.camRig.yaw;
      const fwX = Math.sin(cy), fwZ = Math.cos(cy), rtX = -Math.cos(cy), rtZ = Math.sin(cy);
      const ux = dx/d, uz = dz/d;
      g.input.axis.x = ux*rtX + uz*rtZ;
      g.input.axis.y = -(ux*fwX + uz*fwZ);
      // spin crates/enemies blocking the way (grounded only)
      if (g.player.grounded && (B.spinCD = (B.spinCD ?? 0) - dt) <= 0){
        for (const c of g.crates.crates){
          if (c.broken || c.type === 'iron' || c.type === 'nitro') continue;
          if (Math.hypot(c.x-p.x, c.z-p.z) < 1.6 && Math.abs(c.y-p.y) < 1.5){
            pressed.add('KeyJ'); keys.add('KeyJ'); setTimeout(()=>keys.delete('KeyJ'), 120);
            B.spinCD = 0.7; break;
          }
        }
        if (B.spinCD <= 0) for (const e of g.enemies.enemies){
          if (!e.alive || e.type === 'spikeback') continue;
          if (Math.hypot(e.mesh.position.x-p.x, e.mesh.position.z-p.z) < 1.7){
            pressed.add('KeyJ'); keys.add('KeyJ'); setTimeout(()=>keys.delete('KeyJ'), 120);
            B.spinCD = 0.7; break;
          }
        }
      }
      // jump gaps & rises
      let edge = 99, wide = 0;
      for (let k=1;k<=8;k++){
        const gd = g.world.groundDist({ x:p.x+ux*k*0.5, y:p.y, z:p.z+uz*k*0.5 }, 30);
        if (gd === null || gd > 2.5){ if (edge===99) edge = k*0.5; wide += 0.5; } else if (edge < 99) break;
      }
      if (g.player.grounded && B.jumpCD <= 0){
        if (wp[1] > p.y - 0.6 && ((edge < 2.0 && wide >= 0.9) || (wp[1] > p.y + 0.7 && d < 5.2))){
          pressed.add('Space'); keys.add('Space');
          setTimeout(()=>keys.delete('Space'), 320);
          B.jumpCD = 0.5;
        }
      }
      // double jump if falling short
      if (!g.player.grounded && g.player.vel.y < -1.5 && g.player.jumps === 1 && B.jumpCD <= 0){
        const gd2 = g.world.groundDist({ x:p.x+ux*2.2, y:p.y, z:p.z+uz*2.2 }, 30);
        if (gd2 === null || gd2 > 2.5){
          pressed.add('Space'); keys.add('Space');
          setTimeout(()=>keys.delete('Space'), 300);
          B.jumpCD = 0.5;
        }
      }
      if (g.state === 'results'){ B.done = true; }
      B.dbg = { i:B.i, wp, grounded:g.player.grounded, jumpCD:+B.jumpCD.toFixed(2), edge, wide };
    };
    const iv = setInterval(()=> window.__smokeStep && window.__smokeStep(1/60), 1000/60);
    }catch(err){ console.log('INJECT-FAIL', err.message); } })()`);
  let last = null, stillT = 0;
  for (let s = 0; s < 75; s++){
    await new Promise(r => setTimeout(r, 1000));
    const st = await page.evaluate(`(()=>{ const g=window.__game, B=window.__smoke;
      if (!B) return { i:-1, done:false, state:'nobot', deaths:-1 }; return { i:B.i, done:B.done, state:g.state, deaths:g.player.deaths,
        pos:g.player.pos.toArray().map(v=>+v.toFixed(1)), n:g.camRig.nodes.length }; })()`);
    if (!last || st.i !== last.i){ stillT = 0; last = st; }
    else if (++stillT > 22){
      console.log('  DBG:', JSON.stringify(await page.evaluate(`window.__smoke.dbg||{}`)));
      break;
    }
    if (st.done || st.state === 'results') break;
  }
  const fin = await page.evaluate(`(()=>{ const g=window.__game, B=window.__smoke;
    return B ? { i:B.i, n:g.camRig.nodes.length, done:B.done, state:g.state, deaths:g.player.deaths,
      pos:g.player.pos.toArray().map(v=>+v.toFixed(1)) } : { i:-2, n:0, done:false, state:'nobot', deaths:-1, pos:[] }; })()`);
  const warps = await page.evaluate(`window.__warps||0`);
  await page.evaluate(`window.__warps = 0`);
  const verdict = (fin.state === 'results' || fin.done) ? (warps ? 'PASS('+warps+' skips)' : 'PASS') : (fin.i >= fin.n-2 ? 'NEAR' : 'STUCK');
  console.log(`${id}: ${verdict}  anchors ${fin.i}/${fin.n} deaths=${fin.deaths} state=${fin.state} pos=${fin.pos}`);
}
console.log('ERRORS:', errors.length ? errors.slice(0,8) : 'none');
await browser.close(); server.kill(); process.exit(0);
