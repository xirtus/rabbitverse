// ═══ INPUT — keyboard + gamepad, camera-relative friendly ═══
export class Input {
  constructor(){
    this.keys = new Set();
    this.pressed = new Set();      // edge-triggered, cleared each frame
    this.released = new Set();
    this.axis = { x:0, y:0 };      // move stick
    this.camAxis = { x:0, y:0 };   // right stick
    this.pad = null;
    this._prevButtons = [];
    addEventListener('keydown', e=>{
      if (e.repeat) return;
      this.keys.add(e.code); this.pressed.add(e.code);
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', e=>{ this.keys.delete(e.code); this.released.add(e.code); });
    addEventListener('blur', ()=> this.keys.clear());
  }
  poll(){
    // gamepad
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    this.pad = null;
    for (const p of pads){ if (p && p.connected){ this.pad = p; break; } }
    this.axis.x = 0; this.axis.y = 0; this.camAxis.x = 0; this.camAxis.y = 0;
    const dz = v => Math.abs(v) < 0.18 ? 0 : v;
    if (this.pad){
      const b = this.pad.buttons, ax = this.pad.axes;
      this.axis.x = dz(ax[0]||0); this.axis.y = dz(ax[1]||0);
      this.camAxis.x = dz(ax[2]||0); this.camAxis.y = dz(ax[3]||0);
      const map = { jump:0, spin:2, slide:1, pause:9, slam:1 }; // A, X, B, start
      const edge=(i,name)=>{
        const now = !!b[i]?.pressed, was = !!this._prevButtons[i];
        if (now && !was) this.pressed.add('Pad'+name);
        if (!now && was) this.released.add('Pad'+name);
        if (now) this.keys.add('Pad'+name); else this.keys.delete('Pad'+name);
      };
      edge(map.jump,'Jump'); edge(map.spin,'Spin'); edge(map.slide,'Slide'); edge(map.pause,'Pause');
      edge(7,'Jump'); // RT also jump? no—keep
      this._prevButtons = b.map(x=>x.pressed);
    }
    // keyboard axes
    if (this.keys.has('KeyA')||this.keys.has('ArrowLeft'))  this.axis.x -= 1;
    if (this.keys.has('KeyD')||this.keys.has('ArrowRight')) this.axis.x += 1;
    if (this.keys.has('KeyW')||this.keys.has('ArrowUp'))    this.axis.y -= 1;
    if (this.keys.has('KeyS')||this.keys.has('ArrowDown'))  this.axis.y += 1;
    if (this.keys.has('KeyQ')) this.camAxis.x -= 1;
    if (this.keys.has('KeyE')) this.camAxis.x += 1;
    const len = Math.hypot(this.axis.x, this.axis.y);
    if (len > 1){ this.axis.x/=len; this.axis.y/=len; }
  }
  get jumpHeld(){ return this.keys.has('Space')||this.keys.has('PadJump'); }
  get jumpPressed(){ return this.pressed.has('Space')||this.pressed.has('PadJump'); }
  get spinPressed(){ return this.pressed.has('KeyJ')||this.pressed.has('KeyX')||this.pressed.has('PadSpin'); }
  get slidePressed(){ return this.pressed.has('KeyK')||this.pressed.has('KeyC')||this.pressed.has('ShiftLeft')||this.pressed.has('PadSlide'); }
  get slideHeld(){ return this.keys.has('KeyK')||this.keys.has('KeyC')||this.keys.has('ShiftLeft')||this.keys.has('PadSlide'); }
  get pausePressed(){ return this.pressed.has('Escape')||this.pressed.has('KeyP')||this.pressed.has('PadPause'); }
  endFrame(){ this.pressed.clear(); this.released.clear(); }
}
