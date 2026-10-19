import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5194;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2000));
await page.evaluate(`window.__qa.start()`);
await new Promise(r => setTimeout(r, 400));
// walk to the S2 auto-checkpoint zone
const r1 = await page.evaluate(`(()=>{ const g=window.__game;
  g.player.pos.set(48, 0.4, -74);   // inside T([40,-2,-80],[54,8,-70])
  return g.level.currentCP ? g.level.currentCP.pos.toArray() : null; })()`);
await new Promise(r => setTimeout(r, 300));
const r2 = await page.evaluate(`(()=>{ const g=window.__game;
  return { cp: g.level.currentCP ? g.level.currentCP.pos.toArray() : null,
           fired: g.level.triggers.filter(t=>t.fired).length }; })()`);
// kill player, check respawn
await page.evaluate(`window.__game.player.kill('fall')`);
await new Promise(r => setTimeout(r, 1800));
const r3 = await page.evaluate(`(()=>{ const g=window.__game;
  return { pos: g.player.pos.toArray().map(v=>+v.toFixed(1)), state: g.state }; })()`);
console.log(JSON.stringify({ before:r1, after:r2, respawn:r3 }));
await browser.close(); server.kill(); process.exit(0);
