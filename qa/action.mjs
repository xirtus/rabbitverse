import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5189;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2000));
await page.evaluate(`window.__qa.start()`);
await new Promise(r => setTimeout(r, 400));
await page.evaluate(`window.__game.player.iframes = 0`);
// SPIN closeup: tracking cam ahead-side of player
await page.evaluate(`(()=>{ const g=window.__game;
  g.player.facing = -0.6; window.__qa.key('KeyJ', true); })()`);
await new Promise(r => setTimeout(r, 260));
await page.evaluate(`(()=>{ const g=window.__game; const p=g.player.pos;
  window.__qa.cam(p.x+2.6, p.y+1.5, p.z+2.6, p.x, p.y+0.9, p.z, 42); })()`);
await new Promise(r => setTimeout(r, 120));
await page.screenshot({ path:'qa/shots/a-spin.png' });
await page.evaluate(`window.__qa.clearKeys()`);
// SLIDE closeup while running toward camera-ish
await page.evaluate(`(()=>{ window.__qa.camOff(); window.__qa.key('KeyW', true); })()`);
await new Promise(r => setTimeout(r, 900));
await page.evaluate(`(()=>{ const g=window.__game; window.__qa.key('KeyK', true);
  const p=g.player.pos; window.__qa.cam(p.x+3.2, p.y+1.2, p.z-1.4, p.x, p.y+0.5, p.z, 44); })()`);
await new Promise(r => setTimeout(r, 240));
await page.screenshot({ path:'qa/shots/a-slide.png' });
await page.evaluate(`window.__qa.clearKeys()`);
// JUMP apex with stretch
await page.evaluate(`(()=>{ window.__qa.camOff(); window.__qa.key('KeyW', true); })()`);
await new Promise(r => setTimeout(r, 500));
await page.evaluate(`(()=>{ window.__qa.key('Space', true); })()`);
await new Promise(r => setTimeout(r, 300));
await page.evaluate(`(()=>{ const g=window.__game; const p=g.player.pos;
  window.__qa.cam(p.x+3.4, p.y+0.8, p.z, p.x, p.y+0.9, p.z, 44); })()`);
await new Promise(r => setTimeout(r, 100));
await page.screenshot({ path:'qa/shots/a-jump.png' });
await browser.close(); server.kill(); process.exit(0);
