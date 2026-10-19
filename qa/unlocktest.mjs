import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5177;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://localhost:${PORT}/?unlock=1`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2400));
const st = await page.evaluate(`(()=>{ const g=window.__game;
  return { gems:g.progress.gems,
    doors: g.WORLDS.map(w => g.progress.worldOpen(g.WORLDS.indexOf(w), w.gemsNeeded)) }; })()`);
console.log('unlock-all:', JSON.stringify(st));
await page.evaluate(`window.__qa.start()`);
await new Promise(r => setTimeout(r, 700));
await page.screenshot({ path:'qa/shots/w-hub-unlocked.png' });
await browser.close(); server.kill(); process.exit(0);
