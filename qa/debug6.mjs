import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5191;
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
// walk -Z across the bridge manually (simple: hold W with yaw pi)
await page.evaluate(`(()=>{ const g=window.__game;
  g.player.respawn(new (g.player.pos.constructor)(49.5, 0.4, -79), Math.PI);
  g.level._setCP({ pos:new (g.player.pos.constructor)(49.5, 0.4, -79), facing:Math.PI });
  g.camRig.yaw = Math.PI; g.camRig.snap();
  g.input.poll = function(){ this.axis.x=0; this.axis.y=0; this.camAxis.x=0; this.camAxis.y=0;
    if (this.keys.has('KeyW')) this.axis.y -= 1; };
  g.input.keys.add('KeyW'); })()`);
for (let i=0;i<24;i++){
  await new Promise(r => setTimeout(r, 300));
  const st = await page.evaluate(`(()=>{ const g=window.__game;
    const c = g.player.groundCol;
    return { z:+g.player.pos.z.toFixed(2), y:+g.player.pos.y.toFixed(2),
      g:g.player.grounded?1:0, tag:c?c.tag:'-', slow:+g.player.timeSlow.toFixed(1) }; })()`);
  console.log(JSON.stringify(st));
}
await browser.close(); server.kill(); process.exit(0);
