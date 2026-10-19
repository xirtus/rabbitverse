// ═══ GAMEPLAY QA AGENT — actually plays the level start → portal ═══
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5195;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2000));
await page.evaluate(`window.__secName = '${process.argv[2] || 'lane'}'`);
await page.evaluate(`window.__qa.start()`);
await new Promise(r => setTimeout(r, 500));

// inject the bot
await page.evaluate(`(()=>{
  const g = window.__game;
  const SECTIONS = {
    lane:  { from:[0,0.4,2,Math.PI], wps:[[0,0,-6],[0,0,-16],[0,0,-26],[0,0,-36],[0,0,-42],[0,0,-52],[0,0,-58],[0,0,-64],[0,0,-69],[4,0,-72],[8,0,-74]] },
    side:  { from:[6,0.4,-74,Math.PI/2], wps:[[12,0,-74],[16,0,-74],[18.5,0,-74],[21.5,1.2,-74],[26,1.6,-74,'plat'],[33.5,2,-74],[39.5,3.4,-74],[44,3.4,-74,'plat'],[49.5,0,-74]] },
    ruins: { from:[49.5,0.4,-79,Math.PI], wps:[[49.5,0,-80],[49.5,0,-84.8,'bridge'],[49.5,0,-88,'bridge'],[49.5,0,-91.2,'bridge'],[49.5,0,-94.4,'bridge'],[49.5,0,-97.6,'bridge'],[49.5,0,-102],[49.5,0,-107]] },
    chase: { from:[49.5,0.4,-109.7,Math.PI], wps:[[49.5,0,-116],[49.5,0,-127.5],[49.5,0,-140],[49.5,0,-148]] },
    boss:  { from:[49.5,0.4,-148,Math.PI], wps:[[49.5,0,-156],[49.5,0,-158,'boss'],[49.5,0,-169.5,'portal']] },
  };
  SECTIONS.full = { from:[0,0.4,2,Math.PI], wps:[
    ...SECTIONS.lane.wps, ...SECTIONS.side.wps.slice(1), ...SECTIONS.ruins.wps.slice(1),
    ...SECTIONS.chase.wps.slice(1), ...SECTIONS.boss.wps ] };
  const secName = window.__secName || 'lane';
  const SEC = SECTIONS[secName];
  const WP = SEC.wps;
  window.__qa.warp && null;
  // move player to section start
  { const g0 = window.__game;
    g0.player.respawn(new (g0.player.pos.constructor)(SEC.from[0],SEC.from[1],SEC.from[2]), SEC.from[3]);
    g0.level._setCP({ pos:new (g0.player.pos.constructor)(SEC.from[0],SEC.from[1],SEC.from[2]), facing:SEC.from[3] });
    g0.camRig.yaw = SEC.from[3]; g0.camRig.snap(); }
  const B = window.__bot = {
    i:0, log:[], deaths0:0, stuckT:0, lastPos:[0,0,0], done:false, t:0,
    spinCD:0, jumpCD:0, waitT:0, startT:performance.now(),
  };
  const keys = g.input.keys, pressed = g.input.pressed;
  function press(c, hold=130){ pressed.add(c); keys.add(c); setTimeout(()=>keys.delete(c), hold); }
  function jump(hold=340){ pressed.add('Space'); keys.add('Space'); setTimeout(()=>keys.delete('Space'), hold); }
  B.rec = [];
  window.__botStep = (dt)=>{
    if (B.done) return;
    B.t += dt; B.spinCD -= dt; B.jumpCD -= dt;
    
    const p = g.player.pos;
    const wp = WP[B.i];
    if (!wp){ B.done = true; return; }
    // pure pursuit: steer to a lookahead point on the segment prev→wp
    const pv = B.i > 0 ? WP[B.i-1] : [0,0,2];
    let tx = wp[0], tz = wp[2];
    if (wp[3] !== 'plat' && wp[3] !== 'boss'){
      const sx = wp[0]-pv[0], sz = wp[2]-pv[2];
      const sl = Math.hypot(sx, sz) || 1;
      const ux = sx/sl, uz = sz/sl;
      const t = Math.max(0, Math.min(sl, (p.x-pv[0])*ux + (p.z-pv[2])*uz)) + 2.0;
      tx = pv[0] + ux*Math.min(t, sl); tz = pv[2] + uz*Math.min(t, sl);
      if (t >= sl){ tx = wp[0]; tz = wp[2]; }
    }
    const dx = tx-p.x, dz = tz-p.z;
    const d = Math.hypot(wp[0]-p.x, wp[2]-p.z);
    const dd = Math.hypot(dx, dz) || 1;
    // waypoint reached?
    const reach = wp[3]==='plat' ? 1.8 : 2.2;
    const bossHold = wp[3]==='boss' && g.level.boss && g.level.boss.active && !g.level.boss.dead;
    if (!bossHold && d < reach && Math.abs(p.y - wp[1]) < 2.5){
      B.log.push([+B.t.toFixed(1), 'wp'+B.i, wp[0], wp[2]]);
      B.i++; B.stuckT = 0; B.waitT = 0;
      return;
    }
    // spinner gates: wait for the arm to swing away before crossing
    let gateHold = false;
    for (const h of (g.hazards ? g.hazards.items : [])){
      if (h.kind !== 'spinner') continue;
      const dh = Math.hypot(p.x-h.x, p.z-h.z);
      if (dh < h.len + 1.6){
        const pa = Math.atan2(p.z-h.z, p.x-h.x);
        let diff = ((pa + h.a) % Math.PI + Math.PI) % Math.PI;
        if (Math.abs(Math.sin(diff)) * Math.max(dh,1) < 1.1) gateHold = true;
      }
    }
    if (gateHold && (!g.player.groundCol || g.player.groundCol.tag !== 'collapse')){
      g.input.axis.x = 0; g.input.axis.y = 0; return;   // never wait on a collapsing plank!
    }
    // steer in RAIL-CAMERA space: convert world dir → input axis
    const cy = g.camRig.yaw;
    const fwX = Math.sin(cy), fwZ = Math.cos(cy), rtX = -Math.cos(cy), rtZ = Math.sin(cy);
    const dir = { x:dx/dd, z:dz/dd };
    g.input.axis.x = dir.x*rtX + dir.z*rtZ;
    g.input.axis.y = -(dir.x*fwX + dir.z*fwZ);
    const al = Math.hypot(g.input.axis.x, g.input.axis.y);
    if (al > 1){ g.input.axis.x/=al; g.input.axis.y/=al; }
    // boss logic
    const boss = g.level.boss;
    if (wp[3] === 'boss' && boss){
      if (!boss.active) { /* walk in */ }
      else if (!boss.dead){
        g.input.axis.x = 0; g.input.axis.y = 0;
        // dodge shockwaves
        let danger = false;
        for (const s of boss.shockwaves){
          const sd = Math.hypot(p.x-s.x, p.z-s.z);
          if (Math.abs(sd - s.r) < 1.6 && g.player.grounded) danger = true;
        }
        if (danger && B.jumpCD <= 0){ jump(); B.jumpCD = 0.4; }
        if (boss.state === 'tired'){
          const hw = boss.head.getWorldPosition(new g.stage.camera.position.constructor());
          const hd = Math.hypot(hw.x-p.x, hw.z-p.z);
          // approach the drooped head in camera space
          const cy2 = g.camRig.yaw;
          const fw2 = { x:Math.sin(cy2), z:Math.cos(cy2) }, rt2 = { x:-Math.cos(cy2), z:Math.sin(cy2) };
          const dd = Math.hypot(hw.x-p.x, hw.z-p.z) || 1;
          const wx = (hw.x-p.x)/dd, wz = (hw.z-p.z)/dd;
          g.input.axis.x = wx*rt2.x + wz*rt2.z;
          g.input.axis.y = -(wx*fw2.x + wz*fw2.z);
          if (hd < 2.4 && B.spinCD <= 0){ press('KeyJ'); B.spinCD = 0.7; }
        } else {
          // orbit away from seeds
          if (p.z > -152) g.input.axis.y = 1;
        }
        return;
      }
    }
    // gap detection: no ground ahead → jump (double jump if wide)
    const ahead = { x:p.x+dir.x*1.5, y:p.y, z:p.z+dir.z*1.5 };
    const gd = g.world.groundDist(ahead, 30);
    const gdFar = g.world.groundDist({ x:p.x+dir.x*3.2, y:p.y, z:p.z+dir.z*3.2 }, 30);
    const grounded = g.player.grounded;
    const gapAhead = gd === null || gd > 2.5;
    // precise edge distance + gap width (micro-gaps are just run across)
    let edgeDist = 99, gapWidth = 0;
    for (let k=1;k<=9;k++){
      const gdd = g.world.groundDist({ x:p.x+dir.x*k*0.5, y:p.y, z:p.z+dir.z*k*0.5 }, 30);
      if (gdd === null || gdd > 2.5){ if (edgeDist===99) edgeDist = k*0.5; gapWidth += 0.5; }
      else if (edgeDist < 99) break;
    }
    if (grounded && edgeDist < 99 && wp[3] !== 'bridge' && wp[3] !== 'plat'){
      const onMover = g.player.groundCol && g.player.groundCol.tag === 'mover';
      const tooLow = onMover && wp[1] > p.y + 0.9;   // only gate jumps while riding a mover up
      // riding a y-mover: only dismount near the TOP of the stroke
      if (onMover && g.player.groundCol.baseMax && edgeDist < 3.5){
        const c = g.player.groundCol;
        const nearTop = c.max.y > c.baseMax.y + 0.8 && c.delta.y > -0.25;
        const yMover = Math.abs(c.delta.y) > 0.001 || c.baseMax.y !== c.baseMin.y + 0.4;
        if (yMover && !nearTop){ g.input.axis.x = 0; g.input.axis.y = 0; return; }
      }
      if (tooLow && edgeDist < 1.1){ g.input.axis.x = 0; g.input.axis.y = 0; }
      else if (!tooLow && gapWidth >= 0.9 && B.jumpCD <= 0 && ((g.player.speed > 5.5 && edgeDist < 2.2) || edgeDist < 0.8)){
        jump(); B.jumpCD = 0.45;
        B.needDouble = (gdFar === null || gdFar > 2.5) && edgeDist > 1.2;
      }
    }
    if (B.needDouble && !grounded && g.player.vel.y < 1.5 && g.player.jumps === 1 && B.jumpCD <= 0){
      jump(); B.jumpCD = 0.5; B.needDouble = false;
    }
    // hop up if waypoint higher
    if (grounded && wp[1] > p.y + 0.7 && d < 3.4 && B.jumpCD <= 0){ jump(); B.jumpCD = 0.5; }
    // moving platforms: stand by until the mover is close AND at a good height
    if (wp[3] === 'plat' && d > 1.6 && d < 6.5){
      let go = false;
      for (const c of g.world.colliders){
        if (c.tag !== 'mover') continue;
        const cx = (c.min.x+c.max.x)/2, cz = (c.min.z+c.max.z)/2, cy = c.max.y;
        if (Math.hypot(cx-wp[0], cz-wp[2]) < 2.0){
          const ex = Math.max(Math.abs(p.x-cx) - (c.max.x-c.min.x)/2, 0);
          const ez = Math.max(Math.abs(p.z-cz) - (c.max.z-c.min.z)/2, 0);
          const approaching = Math.abs(c.delta.x) < 0.3 || c.delta.x < 0 || Math.abs(c.delta.z) < 0.3 || c.delta.z < 0;
          if (Math.hypot(ex, ez) < 0.3 && cy - p.y < 0.4 && cy - p.y > -1.4 && approaching) go = true;
        }
      }
      if (!go){ g.input.axis.x = 0; g.input.axis.y = 0;
        if (g.player.speed > 1.2){ g.input.axis.x = 0; g.input.axis.y = 1; }
        return; }
    }
    // bridge: keep moving, no stop
    // spin crates/enemies in range
    if (B.spinCD <= 0 && grounded){
      for (const c of g.crates.crates){
        if (c.broken || c.type==='iron' || c.type==='nitro') continue;
        if (Math.hypot(c.x-p.x, c.z-p.z) < 1.5 && Math.abs(c.y-p.y) < 1.4){ press('KeyJ'); B.spinCD = 0.7; break; }
      }
      for (const e of g.enemies.enemies){
        if (!e.alive || e.type==='spikeback') continue;
        const ed = Math.hypot(e.mesh.position.x-p.x, e.mesh.position.z-p.z);
        if (ed < 1.7){ press('KeyJ'); B.spinCD = 0.7; break; }
      }
    }
    // respawn resync: big teleport = death respawn → snap to nearest wp within 16m
    if (B.lastPos && Math.hypot(p.x-B.lastPos[0], p.z-B.lastPos[2]) > 10){
      let best=-1, bd=1e9;
      for (let k=0;k<WP.length;k++){
        const dd = Math.hypot(WP[k][0]-p.x, WP[k][2]-p.z);
        if (dd < bd){ bd = dd; best = k; }
      }
      if (bd < 24){ B.i = best; B.log.push([+B.t.toFixed(1),'resync→wp'+best]); }
    }
    // skip waypoints we're already past (next is closer than current)
    if (B.i < WP.length-1 && WP[B.i][3] !== 'plat'){
      const dNext = Math.hypot(WP[B.i+1][0]-p.x, WP[B.i+1][2]-p.z);
      if (dNext < d - 1.5 && d < 7){ B.i++; return; }
    }
    // flight recorder (play frames only; freezes on death)
    if (g.state === 'play'){
      B.rec.push([+p.x.toFixed(2), +p.z.toFixed(2), +p.y.toFixed(2), +g.camRig.yaw.toFixed(2), +g.input.axis.x.toFixed(2), +g.input.axis.y.toFixed(2),
        g.player.groundCol?g.player.groundCol.tag:'-', gateHold?1:0, g.player.state]);
      if (B.rec.length > 160) B.rec.shift();
    }
    // stuck detection
    B.stuckT += (Math.hypot(p.x-B.lastPos[0], p.z-B.lastPos[2]) < 0.05) ? dt : 0;
    B.lastPos = [p.x, p.y, p.z];
    if (B.stuckT > 5){
      B.log.push([+B.t.toFixed(1), 'STUCK at', +p.x.toFixed(1), +p.z.toFixed(1), 'wp'+B.i]);
      B.stuckT = 0;
      // hop, don't cheat
      jump();
    }
    if (g.state === 'results'){ B.done = true; B.log.push([+B.t.toFixed(1), 'RESULTS']); }
  };
  g.input.poll = function(){ /* rail cam: bot drives axis directly */ this.camAxis.x = 0; this.camAxis.y = 0; };
  const iv = setInterval(()=>{ if (window.__botStep) window.__botStep(1/60); }, 1000/60);
})()`);

// watch progress
let lastI = -1, sameT = 0, final = null;
for (let s = 0; s < 240; s++){
  await new Promise(r => setTimeout(r, 1000));
  const st = await page.evaluate(`(()=>{ const g=window.__game, B=window.__bot;
    return { i:B.i, done:B.done, t:+B.t.toFixed(1), pos:g.player.pos.toArray().map(v=>+v.toFixed(1)),
      deaths:g.player.deaths, crates:g.crates.broken, total:g.crates.total, carrots:g.collect.count,
      lives:g.collect.lives, state:g.state, bossHp:g.level.boss ? g.level.boss.hp : null,
      log:B.log.slice(-4) }; })()`);
  if (st.i !== lastI){ lastI = st.i; sameT = 0; console.log(`t=${st.t}s wp${st.i} pos=${st.pos} deaths=${st.deaths} crates=${st.crates}/${st.total} boss=${st.bossHp} ${st.state}`); }
  else { sameT++; }
  if (st.done || st.state === 'results'){ final = st; break; }
  if (s === 30){ await page.screenshot({ path:'qa/shots/31-stuck.png' }); console.log('stuck-shot saved'); }
  if (sameT > 40){ console.log('NO PROGRESS 40s — last log:', JSON.stringify(st.log)); final = st; break; }
}
const log = await page.evaluate(`window.__bot.log`);
console.log('LOG:', JSON.stringify(log));
console.log('REC:', JSON.stringify(await page.evaluate(`window.__bot.rec||[]`)));
console.log('FINAL:', JSON.stringify(final));
console.log('ERRORS:', errors.length ? errors : 'none');
await page.screenshot({ path:'qa/shots/30-final.png' });
await browser.close(); server.kill(); process.exit(0);
