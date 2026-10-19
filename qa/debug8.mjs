import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5183;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:640, height:360 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2200));
const info = await page.evaluate(`(()=>{ const g=window.__game;
  return { level:g.levelId, ncolliders:g.world.colliders.length,
    c0: g.world.colliders[0] ? { min:g.world.colliders[0].min.toArray(), max:g.world.colliders[0].max.toArray() } : null,
    playerPos: g.player.pos.toArray().map(v=>+v.toFixed(2)),
    respawn: g._respawnPoint ? g._respawnPoint.pos.toArray() : null,
    cp: g.level.currentCP ? g.level.currentCP.pos.toArray() : null,
    grounded: g.player.grounded }; })()`);
console.log(JSON.stringify(info, null, 1));
await browser.close(); server.kill(); process.exit(0);
