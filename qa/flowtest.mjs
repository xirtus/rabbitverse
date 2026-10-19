import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5181;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => { server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); }); setTimeout(r, 5000); });
const browser = await puppeteer.launch({ headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal'],
  defaultViewport:{ width:1280, height:720 } });
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle0' });
await new Promise(r => setTimeout(r, 2200));
await page.evaluate(`window.__qa.load('w1-1')`);
await new Promise(r => setTimeout(r, 700));
// simulate beating the level
await page.evaluate(`window.__game.events.emit('levelComplete')`);
await new Promise(r => setTimeout(r, 1800));
let st = await page.evaluate(`window.__game.state`);
console.log('after complete:', st);
// click "Title" (should go to hub AND be playable)
await page.click('#btnTitle2');
await new Promise(r => setTimeout(r, 800));
st = await page.evaluate(`(()=>{ const g=window.__game; return { state:g.state, level:g.levelId, frozen:g.player.frozen }; })()`);
console.log('after title click:', JSON.stringify(st));
// move with W
await page.keyboard.down('KeyW');
await new Promise(r => setTimeout(r, 1200));
await page.keyboard.up('KeyW');
st = await page.evaluate(`(()=>{ const g=window.__game; return { pos:g.player.pos.toArray().map(v=>+v.toFixed(1)), state:g.state }; })()`);
console.log('after W:', JSON.stringify(st));
// walk into world-1 door should load a level — teleport to door ring
const door = await page.evaluate(`(()=>{ const g=window.__game; const d=g.WORLDS[0]._door; return [d.x, d.z]; })()`);
await page.evaluate(`window.__qa.warp(${door[0]}, 0.4, ${door[1]}, 0)`);
await new Promise(r => setTimeout(r, 1500));
st = await page.evaluate(`(()=>{ const g=window.__game; return { level:g.levelId, state:g.state }; })()`);
console.log('after door enter:', JSON.stringify(st));
// fractal door should now be OPEN (gem granted on completion)
const w2 = await page.evaluate(`(()=>{ const g=window.__game;
  return { gems:g.progress.gems, w2open:g.progress.worldOpen(1, 1) }; })()`);
console.log('progression:', JSON.stringify(w2));
// return to hub and walk into the fractal door
await page.evaluate(`(()=>{ const g=window.__game; if (g.levelId!=='hub') g.loadLevel('hub'); })()`);
await new Promise(r => setTimeout(r, 600));
const d2 = await page.evaluate(`(()=>{ const g=window.__game; const d=g.WORLDS[1]._door; return [d.x, d.z, d.portal.open]; })()`);
console.log('fractal door open:', d2[2]);
await page.evaluate(`window.__qa.warp(${d2[0]}, 0.4, ${d2[1]}, 0)`);
await new Promise(r => setTimeout(r, 1500));
const st2 = await page.evaluate(`(()=>{ const g=window.__game; return { level:g.levelId, state:g.state }; })()`);
console.log('after fractal door:', JSON.stringify(st2));
await browser.close(); server.kill(); process.exit(0);
