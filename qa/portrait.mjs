// quick portrait diagnosis of the rabbit
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5198;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal','--window-size=1280,720'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2000));
await page.evaluate(`window.__qa.load('w1-1')`);
await page.evaluate(`window.__game.player.iframes = 0`);
await new Promise(r => setTimeout(r, 400));
// front portrait (rabbit faces +Z when facing=0; set facing 0 and cam at +Z)
await page.evaluate(`(()=>{ const g=window.__game; g.player.facing = 0; g.camRig.yaw = 0;
  window.__qa.cam(0.5, 1.7, 6.8, 0, 1.15, 2, 42); })()`);
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path:'qa/shots/p-front.png' });
// side profile
await page.evaluate(`(()=>{ window.__qa.cam(6.2, 1.7, 2.2, 0, 1.15, 2, 42); })()`);
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path:'qa/shots/p-side.png' });
// running side profile
await page.evaluate(`(()=>{ const g=window.__game; window.__qa.key('KeyD', true);
  window.__qaCam = null; })()`);
await new Promise(r => setTimeout(r, 500));
await page.evaluate(`(()=>{ const g=window.__game; const p=g.player.pos;
  window.__qa.cam(p.x+5.5, p.y+1.6, p.z, p.x, p.y+1.1, p.z, 42); })()`);
await new Promise(r => setTimeout(r, 250));
await page.screenshot({ path:'qa/shots/p-run.png' });
await page.evaluate(`window.__qa.clearKeys()`);
// jump portrait
await page.evaluate(`(()=>{ window.__qa.key('KeyD', true); window.__qa.key('Space', true); })()`);
await new Promise(r => setTimeout(r, 350));
await page.screenshot({ path:'qa/shots/p-jump.png' });
await browser.close(); server.kill(); process.exit(0);
