// ═══ QA AGENT — boots the game headless, captures critic screenshots ═══
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import fs from 'fs';

const PORT = 5199;
const shots = process.argv.slice(2);
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio:'pipe' });
await new Promise(r => {
  server.stdout.on('data', d => { if (String(d).includes('Local:')) r(); });
  setTimeout(r, 6000);
});

const browser = await puppeteer.launch({
  headless: 'shell' === 'x' ? false : true,
  args: ['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=metal','--window-size=1280,720','--hide-scrollbars'],
  defaultViewport: { width:1280, height:720 },
});
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil:'networkidle0', timeout:30000 });
await new Promise(r => setTimeout(r, 2500));

const snap = async name => {
  await page.screenshot({ path:`qa/shots/${name}.png` });
  console.log('shot:', name);
};
const qa = (expr) => page.evaluate(expr);

fs.mkdirSync('qa/shots', { recursive:true });

await snap('00-title');

// start game
await qa(`window.__qa.start()`);
await new Promise(r => setTimeout(r, 800));
await qa(`window.__qa.load('w1-1')`);
await new Promise(r => setTimeout(r, 500));

await qa(`window.__qa.load('w1-1')`);
await new Promise(r => setTimeout(r, 700));
const spots = { start:[0,0.4,2,Math.PI], lane:[0,0.4,-30,Math.PI], secret:[9.5,4.4,-40,Math.PI],
  side:[6,0.4,-74,-Math.PI/2], time:[49.5,0.4,-79.5,Math.PI], ruins:[49.5,0.4,-100,Math.PI],
  chase:[49.5,0.4,-112,Math.PI], boss:[49.5,0.4,-150,Math.PI], portal:[49.5,0.4,-155,Math.PI] };
const pick = shots.length ? shots : Object.keys(spots);
for (const s of pick){
  const w = spots[s];
  await qa(`window.__qa.warp(${w[0]},${w[1]},${w[2]},${w[3]})`);
  await new Promise(r => setTimeout(r, 1400));
  await snap(`10-${s}`);
  if (s === 'boss'){
    await new Promise(r => setTimeout(r, 2600));
    await snap('11-boss-fight');
  }
}

// gameplay sim: run forward + jump for a few seconds from start
await qa(`window.__qa.warp(0,0.4,2,Math.PI)`);
await new Promise(r => setTimeout(r, 500));
await qa(`window.__qa.key('KeyW', true)`);
await new Promise(r => setTimeout(r, 1400));
await snap('20-run');
await qa(`window.__qa.key('Space', true)`);
await new Promise(r => setTimeout(r, 250));
await snap('21-jump');
await qa(`window.__qa.key('Space', false)`);
await qa(`window.__qa.key('KeyJ', true)`);
await new Promise(r => setTimeout(r, 300));
await snap('22-spin');
await qa(`window.__qa.key('KeyJ', false)`);
await qa(`window.__qa.clearKeys()`);

// action poses + portal + results
await qa(`window.__qa.warp(0,0.4,-30,Math.PI)`);
await new Promise(r => setTimeout(r, 600));
await qa(`window.__qa.key('KeyW', true)`);
await new Promise(r => setTimeout(r, 900));
await qa(`window.__qa.key('KeyK', true)`);
await new Promise(r => setTimeout(r, 320));
await snap('40-slide');
await qa(`window.__qa.key('KeyK', false)`);
await qa(`window.__qa.key('Space', true)`);
await new Promise(r => setTimeout(r, 260));
await qa(`window.__qa.key('KeyK', true)`);   // slam in air
await new Promise(r => setTimeout(r, 200));
await snap('41-slam');
await qa(`window.__qa.clearKeys()`);
// portal open
await qa(`window.__qa.warp(49.5,0.4,-155,Math.PI)`);
await qa(`(()=>{ const g=window.__game; g.level.primeval.portal.setOpen(true); })()`);
await new Promise(r => setTimeout(r, 1600));
await snap('50-portal');
// results screen
await qa(`(()=>{ const g=window.__game; g.events.emit('levelComplete'); })()`);
await new Promise(r => setTimeout(r, 1800));
await snap('60-results');

const stats = await qa(`window.__qa.stats()`);
console.log('STATS:', JSON.stringify(stats));
console.log('ERRORS:', errors.length ? errors.slice(0,12) : 'none');

await browser.close();
server.kill();
process.exit(0);
