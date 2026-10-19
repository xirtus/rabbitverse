import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5185;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.stack || e.message));
page.on('console', m => { if (m.type()==='error') console.log('CONSOLE:', m.text()); });
await page.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2000));
// simulate REAL user: click Play, then press W
await page.click('#btnPlay');
await new Promise(r => setTimeout(r, 500));
await page.keyboard.down('KeyW');
await new Promise(r => setTimeout(r, 1500));
const st = await page.evaluate(`(()=>{ const g=window.__game;
  return { state:g.state, pos:g.player.pos.toArray().map(v=>+v.toFixed(2)),
    axis:[g.input.axis.x, g.input.axis.y], camMode:g.camRig.mode,
    cam:g.stage.camera.position.toArray().map(v=>+v.toFixed(1)) }; })()`);
console.log('STATE:', JSON.stringify(st));
await page.keyboard.up('KeyW');
await page.screenshot({ path:'qa/shots/err.png' });
await browser.close(); server.kill(); process.exit(0);
