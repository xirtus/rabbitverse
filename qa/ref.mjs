import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5186;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:900, height:700 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/ref.html`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2500));
for (let i=0;i<3;i++){
  await page.evaluate(`window.__shot(${i})`);
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path:`qa/shots/ref${i}.png` });
}
console.log('captured');
await browser.close(); server.kill(); process.exit(0);
