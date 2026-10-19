import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5173+40;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2200));
const spots = { 'w1-2':'mossjaw', 'w2-1':'prismspider', 'w3-1':'datacore', 'w4-1':'lavadjinn', 'w5-1':'frostronin' };
for (const [id, name] of Object.entries(spots)){
  await page.evaluate(`window.__qa.load('${id}')`);
  await new Promise(r => setTimeout(r, 400));
  // start the boss directly near its arena
  await page.evaluate(`(()=>{ const g=window.__game;
    g.level.startBoss();
    const bp = g.level.bossSpawn.pos;
    g.player.respawn(new (g.player.pos.constructor)(bp.x, bp.y+0.3, bp.z-10), 0);
    g.camRig.yaw = 0; g.camRig.snap(); })()`);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path:`qa/shots/boss-${name}.png` });
}
console.log('boss shots done');
await browser.close(); server.kill(); process.exit(0);
