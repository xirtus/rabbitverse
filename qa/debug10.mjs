import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5174;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:640, height:360 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2200));
await page.evaluate(`window.__qa.load('w1-2')`);
await new Promise(r => setTimeout(r, 500));
await page.evaluate(`window.__qa.warp(0, 0.4, -13, Math.PI)`);
await page.evaluate(`(()=>{ const g=window.__game;
  g.input.poll = function(){ this.axis.x=0; this.axis.y=-1; this.camAxis.x=0; this.camAxis.y=0; }; })()`);
for (let i=0;i<6;i++){
  await new Promise(r => setTimeout(r, 400));
  const st = await page.evaluate(`(()=>{ const g=window.__game;
    const near = g.crates.crates.filter(c=>!c.broken && Math.hypot(c.x-g.player.pos.x, c.z-g.player.pos.z)<3)
      .map(c=>({t:c.type, x:+c.x.toFixed(1), z:+c.z.toFixed(1)}));
    return { pos:g.player.pos.toArray().map(v=>+v.toFixed(2)), st:g.player.state, near,
      vel:[+g.player.vel.x.toFixed(2), +g.player.vel.z.toFixed(2)] }; })()`);
  console.log(JSON.stringify(st));
}
await browser.close(); server.kill(); process.exit(0);
