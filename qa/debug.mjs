import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
const PORT = 5197;
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
const info = await page.evaluate(`(()=>{
  const g = window.__game;
  const rp = g.rabbit.root.position;
  const rpWorld = new (Object.getPrototypeOf(g.rabbit.root.position).constructor)();
  g.rabbit.root.getWorldPosition(rpWorld);
  return {
    playerPos: g.player.pos.toArray().map(v=>+v.toFixed(2)),
    rabbitRoot: rp.toArray().map(v=>+v.toFixed(2)),
    rabbitWorld: rpWorld.toArray().map(v=>+v.toFixed(2)),
    rabbitVisible: g.rabbit.root.visible,
    camPos: g.stage.camera.position.toArray().map(v=>+v.toFixed(2)),
    state: g.state,
    inScene: (()=>{ let p=g.rabbit.root; while(p.parent) p=p.parent; return p.type; })(),
  };
})()`);
console.log(JSON.stringify(info, null, 1));
await browser.close(); server.kill(); process.exit(0);
