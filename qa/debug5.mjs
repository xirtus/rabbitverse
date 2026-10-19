import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5192;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:640, height:360 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 1800));
await page.evaluate(`window.__qa.start()`);
await new Promise(r => setTimeout(r, 300));
// teleport to just before the seam and walk -Z
await page.evaluate(`(()=>{ const g=window.__game;
  g.player.respawn(new (g.player.pos.constructor)(50, 0.2, -73), Math.PI);
  g.input.poll = function(){ this.axis.x=0; this.axis.y=0; this.camAxis.x=0; this.camAxis.y=0;
    if (this.keys.has('KeyW')) this.axis.y -= 1; };
  g.input.keys.add('KeyW');
  g.camRig.yaw = Math.PI; })()`);
for (let i=0;i<8;i++){
  await new Promise(r => setTimeout(r, 700));
  const st = await page.evaluate(`(()=>{ const g=window.__game;
    return { pos:g.player.pos.toArray().map(v=>+v.toFixed(3)), vel:[+g.player.vel.y.toFixed(2)],
      grounded:g.player.grounded, clamp:window.__lastClamp||null }; })()`);
  console.log(JSON.stringify(st));
}
await browser.close(); server.kill(); process.exit(0);
