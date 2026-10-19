// ═══ AUDIO — 100% synthesized WebAudio: SFX + adaptive music, zero assets ═══
export class AudioBus {
  constructor(){
    this.ctx = null; this.master = null; this.musicGain = null; this.sfxGain = null;
    this.chain = 0; this.chainT = 0; this.musicMode = 'none'; this._musicNodes = [];
    this._step = 0; this._nextT = 0; this._timer = null;
  }
  init(){
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.9; this.sfxGain.connect(this.master);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.34; this.musicGain.connect(this.master);
    // gentle master compressor for glue
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 22; comp.ratio.value = 5;
    this.master.disconnect(); this.master.connect(comp); comp.connect(this.ctx.destination);
  }
  resume(){ this.init(); if (this.ctx.state === 'suspended') this.ctx.resume(); }
  now(){ return this.ctx ? this.ctx.currentTime : 0; }
  env(g, t, a, peak, d, sustain=0){
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t+a);
    g.gain.exponentialRampToValueAtTime(Math.max(sustain,0.0001), t+a+d);
  }
  osc(type, f0, f1, t, dur, peak=0.3, dest=null){
    if (!this.ctx) return null;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1,f1), t+dur);
    this.env(g, t, 0.008, peak, dur);
    o.connect(g); g.connect(dest||this.sfxGain); o.start(t); o.stop(t+dur+0.08);
    return {o,g};
  }
  noise(t, dur, peak=0.3, hp=0, lp=18000, dest=null){
    if (!this.ctx) return;
    const len = Math.max(1, (dur+0.05)*this.ctx.sampleRate|0);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    let node = src;
    if (lp<18000){ const f=this.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=lp; node.connect(f); node=f; }
    if (hp>0){ const f=this.ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp; node.connect(f); node=f; }
    const g = this.ctx.createGain(); this.env(g, t, 0.005, peak, dur);
    node.connect(g); g.connect(dest||this.sfxGain); src.start(t); src.stop(t+dur+0.06);
  }
  // ─── SFX vocabulary ───
  jump(){ const t=this.now(); this.osc('triangle', 300, 640, t, 0.16, 0.28); this.noise(t,0.08,0.06,800); }
  doubleJump(){ const t=this.now(); this.osc('triangle', 420, 900, t, 0.18, 0.3); this.osc('sine', 840, 1500, t+0.02, 0.16, 0.12); }
  land(hard=0){ const t=this.now(); this.noise(t, 0.07+hard*0.06, 0.12+hard*0.2, 200, 2400); if(hard>0.5) this.osc('sine',140,60,t,0.12,0.3); }
  spin(){ const t=this.now(); this.noise(t,0.22,0.16,900,6000); this.osc('sawtooth',220,440,t,0.18,0.05); }
  slide(){ const t=this.now(); this.noise(t,0.3,0.14,300,3000); }
  slamStart(){ const t=this.now(); this.osc('sine',700,180,t,0.2,0.2); }
  slamLand(){ const t=this.now(); this.noise(t,0.25,0.4,60,900); this.osc('sine',110,38,t,0.3,0.5); }
  bounce(hi=0){ const t=this.now(); this.osc('sine',260+hi*80,560+hi*160,t,0.14,0.3); }
  collect(){
    const t=this.now(); const scale=[0,3,5,7,10,12,15,17,19,22,24];
    const st = scale[Math.min(this.chain, scale.length-1)];
    const f = 660*Math.pow(2, st/12);
    this.osc('sine', f, f*1.01, t, 0.14, 0.22); this.osc('triangle', f*2, f*2, t, 0.09, 0.06);
    this.chain++; this.chainT = t;
  }
  crateBreak(){ const t=this.now(); this.noise(t,0.16,0.34,300,4200); this.osc('triangle',180,70,t,0.14,0.22); this.noise(t+0.03,0.1,0.2,700,6000); }
  tntFuse(){ const t=this.now(); for(let i=0;i<3;i++) this.osc('square',1100,1100,t+i*0.42,0.07,0.12); }
  explosion(){ const t=this.now(); this.noise(t,0.5,0.55,40,1600); this.osc('sine',90,26,t,0.5,0.55); this.noise(t+0.02,0.3,0.3,800,7000); }
  checkpoint(){ const t=this.now(); [523,659,784,1047].forEach((f,i)=>this.osc('sine',f,f,t+i*0.07,0.24,0.16)); }
  gem(){ const t=this.now(); [880,1109,1319,1760].forEach((f,i)=>this.osc('triangle',f,f,t+i*0.09,0.3,0.18)); }
  hurt(){ const t=this.now(); this.osc('sawtooth',300,90,t,0.25,0.3); this.noise(t,0.12,0.2,400,3000); }
  death(){ const t=this.now(); const s=this.osc('sine',900,120,t,0.7,0.25); this.osc('triangle',450,60,t,0.7,0.15); }
  life(){ const t=this.now(); [660,880,990,1320].forEach((f,i)=>this.osc('sine',f,f,t+i*0.06,0.2,0.15)); }
  enemyPop(){ const t=this.now(); this.noise(t,0.12,0.25,500,5000); this.osc('square',400,900,t,0.12,0.08); }
  reflect(){ const t=this.now(); this.osc('square',800,1400,t,0.1,0.12); }
  portal(){ const t=this.now(); this.osc('sine',200,1600,t,0.9,0.16); this.osc('sine',203,1610,t,0.9,0.16); this.noise(t,0.9,0.1,1500,9000); }
  power(){ const t=this.now(); this.osc('sine',440,1760,t,0.5,0.2); this.osc('triangle',220,880,t,0.5,0.14); }
  timeSlowOn(){ const t=this.now(); this.osc('sine',1200,180,t,0.6,0.2); }
  uiMove(){ const t=this.now(); this.osc('sine',700,900,t,0.06,0.08); }
  uiSelect(){ const t=this.now(); this.osc('sine',600,900,t,0.1,0.14); this.osc('sine',900,1350,t+0.06,0.12,0.12); }
  bossHit(){ const t=this.now(); this.noise(t,0.2,0.4,200,2400); this.osc('sawtooth',200,60,t,0.3,0.3); }
  roar(){ const t=this.now(); this.osc('sawtooth',90,50,t,0.8,0.4); this.osc('sawtooth',95,55,t,0.8,0.35); this.noise(t,0.7,0.2,80,900); }
  // ─── adaptive procedural music ───
  setMusic(mode){
    if (this.musicMode === mode) return;
    this.musicMode = mode;
    if (!this.ctx) return;
    if (this._timer){ clearInterval(this._timer); this._timer = null; }
    this._musicNodes.forEach(n=>{ try{n.stop&&n.stop()}catch(e){}; try{n.disconnect()}catch(e){} });
    this._musicNodes = [];
    if (mode === 'none') return;
    this._step = 0; this._nextT = this.now()+0.1;
    this._timer = setInterval(()=>this._schedule(), 40);
  }
  _schedule(){
    const bpmMap = { title:92, level:118, chase:138, boss:132, hub:96 };
    const bpm = bpmMap[this.musicMode] || 110;
    const spb = 60/bpm/2; // 8th notes
    while (this._nextT < this.now()+0.18){
      this._playStep(this._step, this._nextT, spb);
      this._nextT += spb; this._step = (this._step+1)%64;
    }
  }
  _playStep(s, t, spb){
    const g = this.musicGain;
    const root = 110; // A
    const minor = [0,3,5,7,10,12,15];
    const bassPat = { level:[0,0,7,0, 5,5,0,3], chase:[0,0,3,0,5,0,7,0], boss:[0,0,1,0,0,1,0,2], title:[0,5,7,3], hub:[0,7,5,3] }[this.musicMode]||[0];
    const bStep = bassPat[(s>>1)%bassPat.length];
    const melPats = {
      level:[0,-1,3,-1, 7,-1,5,3, 2,-1,0,-1, 3,5,-1,-1],
      chase:[0,3,-1,5, 7,-1,10,7, 5,-1,3,-1, 0,-1,3,-1],
      boss:[0,-1,1,-1, 3,-1,2,-1, 0,1,-1,3, -1,2,-1,-1],
      title:[0,-1,-1,3, -1,-1,7,-1, 5,-1,-1,3, -1,-1,-1,-1],
      hub:[0,-1,-1,-1, 3,-1,-1,-1, 5,-1,3,-1, -1,-1,-1,-1],
    };
    const pat = melPats[this.musicMode]||melPats.level;
    // drums
    const intense = this.musicMode==='chase'||this.musicMode==='boss';
    if (s%4===0){ this.osc('sine',120,40,t,0.1, intense?0.5:0.34, g); }                       // kick
    if (s%8===4){ this.noise(t,0.09,intense?0.25:0.15,1200,9000,g); }                          // snare-ish
    if (s%2===1){ this.noise(t,0.03,0.05,6000,18000,g); }                                      // hat
    // bass
    if (s%2===0){ const f=root*Math.pow(2,minor[bStep%minor.length]/12)/2;
      this.osc('triangle',f,f,t,spb*1.7,0.22,g); }
    // melody (marimba-ish)
    const m = pat[s%16];
    if (m>=0){ const idx=((m%7)+7)%7, oct=Math.floor(m/7);
      const f=root*2*Math.pow(2,(minor[idx]+oct*12)/12);
      this.osc('sine',f,f*0.995,t,spb*1.5,0.13,g);
      this.osc('triangle',f*2,f*2,t,spb*0.8,0.03,g); }
    // sparkle pad on title
    if (this.musicMode==='title' && s%16===0){
      [0,3,7].forEach(iv=>{ const f=root*2*Math.pow(2,iv/12);
        this.osc('sine',f,f,t,spb*14,0.04,g); });
    }
  }
  update(){
    if (this.ctx && this.chainT && this.now()-this.chainT > 0.9) { this.chain = 0; this.chainT = 0; }
  }
}
export const audio = new AudioBus();
