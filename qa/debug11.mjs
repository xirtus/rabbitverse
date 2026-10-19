import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5172;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2200));
await page.evaluate(`window.__qa.load('w1-5')`);
await new Promise(r => setTimeout(r, 500));
const cols = await page.evaluate(`(()=>{ const g=window.__game; const out=[];
  const px=0, py=3.4, pz=-28.5, h=0.5;
  for (const c of g.world.colliders){
    if (px+h>c.min.x && px-h<c.max.x && py+1.3>c.min.y && py<c.max.y && pz+h>c.min.z && pz-h<c.max.z)
      out.push({tag:c.tag, kind:c.kind, min:c.min.toArray().map(v=>+v.toFixed(1)), max:c.max.toArray().map(v=>+v.toFixed(1))});
  } return out; })()`);
console.log(JSON.stringify(cols, null, 1));
await page.evaluate(`window.__qa.warp(0, 3.8, -28.5, Math.PI)`);
await new Promise(r => setTimeout(r, 300));
await page.evaluate(`window.__qa.cam(-7, 7, -22, 0, 4, -28.5, 48)`);
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path:'qa/shots/d11.png' });
await browser.close(); server.kill(); process.exit(0);
