import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5187;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
await page.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2000));
await page.evaluate(`window.__qa.start()`);
await new Promise(r => setTimeout(r, 300));
// side-view closeup of the static carrot line at (0,0.8,-5)
await page.evaluate(`window.__qa.cam(2.5, 1.2, -5, 0, 0.8, -5, 36)`);
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path:'qa/shots/carrot.png' });
await browser.close(); server.kill(); process.exit(0);
