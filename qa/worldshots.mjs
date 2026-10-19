import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5182;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2200));
await page.screenshot({ path:'qa/shots/w-hub-title.png' });
await page.evaluate(`window.__qa.start()`);
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path:'qa/shots/w-hub.png' });
const spots = { 'w2-1':'fractal', 'w3-1':'neon', 'w4-1':'tropic', 'w5-1':'edo' };
for (const [id, name] of Object.entries(spots)){
  await page.evaluate(`window.__qa.load('${id}')`);
  await new Promise(r => setTimeout(r, 700));
  await page.evaluate(`(()=>{ const g=window.__game;
    g.input.poll = function(){ this.axis.x=0; this.axis.y=-1; this.camAxis.x=0; this.camAxis.y=0; }; })()`);
  await new Promise(r => setTimeout(r, 1700));
  await page.screenshot({ path:`qa/shots/w-${name}.png` });
}
console.log('world shots done');
await browser.close(); server.kill(); process.exit(0);
