import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5193;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:640, height:360 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 1800));
const out = await page.evaluate(`(()=>{
  const g = window.__game;
  const res = [];
  const px=50, py=-0.08, pz=-76.0, h=0.4;
  for (const c of g.world.colliders){
    if (px+h>c.min.x && px-h<c.max.x && py+1.2>c.min.y && py<c.max.y && pz+h>c.min.z && pz-h<c.max.z)
      res.push({ tag:c.tag, kind:c.kind, min:c.min.toArray().map(v=>+v.toFixed(2)), max:c.max.toArray().map(v=>+v.toFixed(2)) });
  }
  return res;
})()`);
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.kill(); process.exit(0);
