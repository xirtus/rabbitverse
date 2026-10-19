// ═══ HUD + SCREENS ═══
import { audio } from '../core/Audio.js';

const ICONS = {
  carrot:`<svg viewBox="0 0 24 24"><path d="M14 4c-3 1-7 6-8 12-.2 1.4 1 2.4 2.2 1.8C13 15 16 10 16 5c2-1 3-2.5 3.4-4-1.6.3-3.4 1.2-4.4 2 .5-1.2.4-2.4.2-3-1 .6-1.8 2.4-2 4z" fill="#ff8c2e"/><path d="M15 5c1-2 3-3.5 5-4-.5 2-2 4-4 5z" fill="#4ecb56"/></svg>`,
  crate:`<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#c88a4a" stroke="#8a5a2a" stroke-width="2.4"/><path d="M4 4l16 16M20 4L4 20" stroke="#8a5a2a" stroke-width="2"/></svg>`,
  bun:`<svg viewBox="0 0 24 24"><ellipse cx="8" cy="5" rx="2.6" ry="4.6" fill="#d9985a"/><ellipse cx="16" cy="5" rx="2.6" ry="4.6" fill="#d9985a"/><circle cx="12" cy="14" r="7.4" fill="#d9985a"/><circle cx="9.4" cy="13" r="1.2" fill="#2b1a12"/><circle cx="14.6" cy="13" r="1.2" fill="#2b1a12"/><ellipse cx="12" cy="16" rx="1.6" ry="1.2" fill="#ff9db4"/></svg>`,
  clock:`<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8.4" fill="#9feaff" stroke="#2bb8ff" stroke-width="2"/><path d="M12 8v5l3.4 2" stroke="#1d5a80" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="9.4" y="1.4" width="5.2" height="3" rx="1.2" fill="#2bb8ff"/></svg>`,
};

export class UI {
  constructor(events){
    this.ev = events;
    this.$ = id => document.getElementById(id);
    document.querySelectorAll('[data-ic]').forEach(el=>{ el.innerHTML = ICONS[el.dataset.ic] || ''; });
    this.hud = this.$('hud');
    this.toastEl = this.$('toast');
    this.dmgT = 0;
    this._bind();
    events.on('carrot', n => { this.$('vCarrots').textContent = n; this._pop('hudCarrots'); });
    events.on('crateBroken', ()=> this._pop('hudCrates'));
    events.on('life', ()=> this._pop('hudLives'));
    events.on('toast', t => { if (t) this.toast(t); });
    events.on('playerHurt', ()=>{ this.dmgT = 1; });
    events.on('timeSlow', ()=>{ this.$('hudPower').classList.add('on'); this.$('slow').style.opacity = 1; });
    events.on('bossStart', name=>{
      this.$('hudBoss').classList.add('on');
      this.$('bossName').textContent = name;
      this.$('bossFill').style.width = '100%';
    });
    events.on('bossHp', (hp, max)=>{ this.$('bossFill').style.width = (hp/max*100)+'%'; });
    events.on('bossEnd', ()=>{ this.$('hudBoss').classList.remove('on'); });
    events.on('gem', ()=>{ this.$('gem0').classList.add('got'); });
  }
  _bind(){
    const on = (id, fn)=> this.$(id).addEventListener('click', ()=>{ audio.resume(); audio.uiSelect(); fn(); });
    on('btnPlay', ()=> this.ev.emit('uiPlay'));
    on('btnHow', ()=>{ const p=this.$('howPanel'); p.style.display = p.style.display==='none'?'block':'none'; });
    on('btnResume', ()=> this.ev.emit('uiResume'));
    on('btnRestart', ()=> this.ev.emit('uiRestart'));
    on('btnQuit', ()=> this.ev.emit('uiQuit'));
    on('btnAgain', ()=> this.ev.emit('uiRestart'));
    on('btnTitle2', ()=> this.ev.emit('uiQuit'));
    on('btnRetry', ()=> this.ev.emit('uiRestart'));
  }
  _pop(id){
    const el = this.$(id);
    el.style.transform = 'scale(1.18)';
    clearTimeout(el._pt);
    el._pt = setTimeout(()=> el.style.transform = '', 140);
    el.style.transition = 'transform .14s';
  }
  toast(t){
    this.toastEl.textContent = t;
    this.toastEl.classList.remove('pop');
    void this.toastEl.offsetWidth;
    this.toastEl.classList.add('pop');
  }
  setCrates(b, t){ this.$('vCrates').textContent = `${b}/${t}`; }
  setLives(n){ this.$('vLives').textContent = n; }
  showHUD(){ this.hud.classList.add('on'); }
  show(name){ this.$('scr'+name).classList.add('on'); }
  hide(name){ this.$('scr'+name).classList.remove('on'); }
  hideAll(){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on')); }
  results({carrots, cratesB, cratesT, deaths, time, gems}){
    this.$('rCarrots').textContent = carrots;
    this.$('rCrates').textContent = `${cratesB}/${cratesT}`;
    this.$('rDeaths').textContent = deaths;
    this.$('rTime').textContent = `${time/60|0}:${String(time%60|0).padStart(2,'0')}`;
    this.$('rGems').textContent = gems;
    if (cratesB >= cratesT) this.$('gem1').classList.add('got');
    if (deaths === 0) this.$('gem2').classList.add('got');
    this.show('Results');
  }
  update(dt, player){
    if (this.dmgT > 0){ this.dmgT = Math.max(0, this.dmgT - dt*2); }
    this.$('dmg').style.opacity = this.dmgT;
    if (player && player.timeSlow <= 0){
      this.$('hudPower').classList.remove('on');
      this.$('slow').style.opacity = 0;
    }
  }
}
