import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5196;
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
await new Promise(r => setTimeout(r, 600));
await page.evaluate(`window.__qa.cam(0.4, 1.3, 4.6, 0, 1.0, 2, 40)`);
await new Promise(r => setTimeout(r, 500));
const info = await page.evaluate(`(()=>{
  const g = window.__game;
  return { cam: g.stage.camera.position.toArray().map(v=>+v.toFixed(2)),
    qaCam: !!window.__qaCam,
    rabbit: g.rabbit.root.position.toArray().map(v=>+v.toFixed(2)),
    state: g.state };
})()`);
console.log(JSON.stringify(info));
await page.screenshot({ path:'qa/shots/d2.png' });
await browser.close(); server.kill(); process.exit(0);
