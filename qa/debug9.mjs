import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5175;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2200));
await page.evaluate(`window.__qa.load('w2-1')`);
await new Promise(r => setTimeout(r, 500));
await page.evaluate(`window.__qa.warp(0, 0.4, -12, Math.PI)`);
await page.evaluate(`(()=>{ const g=window.__game;
  g.input.poll = function(){ this.axis.x=0; this.axis.y=-1; this.camAxis.x=0; this.camAxis.y=0; }; })()`);
for (let i=0;i<8;i++){
  await new Promise(r => setTimeout(r, 500));
  const st = await page.evaluate(`(()=>{ const g=window.__game;
    return { pos:g.player.pos.toArray().map(v=>+v.toFixed(2)), grounded:g.player.grounded,
      col: g.player.groundCol ? g.player.groundCol.tag : '-' }; })()`);
  console.log(JSON.stringify(st));
}
await page.screenshot({ path:'qa/shots/d9.png' });
await browser.close(); server.kill(); process.exit(0);
