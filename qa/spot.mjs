import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5180;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2200));
await page.evaluate(`window.__qa.load('w5-4')`);
await new Promise(r => setTimeout(r, 600));
await page.evaluate(`window.__qa.warp(0, 6.6, -30, Math.PI)`);
await new Promise(r => setTimeout(r, 400));
await page.evaluate(`window.__qa.cam(-8, 9, -24, 0, 6.5, -32, 50)`);
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path:'qa/shots/spot.png' });
// dump colliders around (0,6,-32)
const cols = await page.evaluate(`(()=>{ const g=window.__game; const out=[];
  for (const c of g.world.colliders){
    if (c.max.x>-6 && c.min.x<6 && c.max.z>-40 && c.min.z<-24 && c.max.y>4)
      out.push({tag:c.tag, kind:c.kind, min:c.min.toArray().map(v=>+v.toFixed(1)), max:c.max.toArray().map(v=>+v.toFixed(1))});
  } return out; })()`);
console.log(JSON.stringify(cols, null, 0));
await browser.close(); server.kill(); process.exit(0);
