import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5176;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2200));
const spots = [
  ['w5-1', 0, 0.4, -18, 'haz-icicles'],   // icicle overhang
  ['w4-1', 0, 0.4, -18, 'haz-firejets'],  // flame jets
  ['w3-1', 0, 0.4, -26, 'haz-saw'],       // saw track
  ['w1-2', 0, 0.4, -40, 'haz-charger'],   // charger paddock
  ['w1-5', 0, 3.4, -26, 'haz-bats'],      // bat hollow
];
for (const [id, x, y, z, name] of spots){
  await page.evaluate(`window.__qa.load('${id}')`);
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(`window.__qa.warp(${x}, ${y}, ${z}, Math.PI)`);
  await new Promise(r => setTimeout(r, 1300));
  await page.screenshot({ path:`qa/shots/${name}.png` });
}
console.log('hazard shots done');
await browser.close(); server.kill(); process.exit(0);
