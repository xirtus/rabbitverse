import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5188;
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
await new Promise(r => setTimeout(r, 300));
await page.evaluate(`window.__qa.warp('chase')`);
await page.evaluate(`(()=>{ const g=window.__game;
  g.input.poll = function(){ this.axis.x=0; this.axis.y=0; this.camAxis.x=0; this.camAxis.y=0;
    if (this.keys.has('KeyW')) this.axis.y -= 1; };
  g.input.keys.add('KeyW'); })()`);
await new Promise(r => setTimeout(r, 1100));
await page.screenshot({ path:'qa/shots/c1.png' });
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path:'qa/shots/c2.png' });
const st = await page.evaluate(`(()=>{ const g=window.__game;
  return { pos:g.player.pos.toArray().map(v=>+v.toFixed(1)), boulder:g.level.boulder.mesh.position.toArray().map(v=>+v.toFixed(1)),
    dead:g.player.dead, mode:g.camRig.mode }; })()`);
console.log(JSON.stringify(st));
await browser.close(); server.kill(); process.exit(0);
