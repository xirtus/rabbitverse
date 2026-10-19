import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5178;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2200));
await page.evaluate(`window.__qa.load('w1-1')`);
await new Promise(r => setTimeout(r, 600));
// warp to arena, force boss down → gem spawns
await page.evaluate(`(()=>{ const g=window.__game;
  window.__qa.warp(49.5, 0.4, -152, Math.PI);
  g.events.emit('bossDown'); })()`);
await new Promise(r => setTimeout(r, 500));
const gemInfo = await page.evaluate(`(()=>{ const g=window.__game;
  const gm = g.collect.gems[0];
  return gm ? { x:gm.x, y:gm.y, z:gm.z, got:gm.got, meshPos: gm.m.position.toArray().map(v=>+v.toFixed(2)) } : null; })()`);
console.log('gem:', JSON.stringify(gemInfo));
// walk into the gem: place player right at it
await page.evaluate(`(()=>{ const g=window.__game; const gm=g.collect.gems[0];
  g.player.pos.set(gm.x, 0.1, gm.z); })()`);
await new Promise(r => setTimeout(r, 400));
const after = await page.evaluate(`(()=>{ const g=window.__game;
  return { got:g.collect.gems[0].got, pos:g.player.pos.toArray().map(v=>+v.toFixed(2)),
    gemY: g.collect.gems[0].m.position.y }; })()`);
console.log('after touch:', JSON.stringify(after));
await browser.close(); server.kill(); process.exit(0);
