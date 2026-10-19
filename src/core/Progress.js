// ═══ PROGRESS — save data, gem economy, unlock rules ═══
const KEY = 'rabbitverse-save-v1';
export class Progress {
  constructor(){
    this.data = { levels:{} };
    try { Object.assign(this.data, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch(e){}
  }
  save(){ try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch(e){} }
  record(levelId, { gem, crates, cratesTotal, carrots, deaths, time }){
    const cur = this.data.levels[levelId] || {};
    this.data.levels[levelId] = {
      gem:        cur.gem || gem,
      crates:     Math.max(cur.crates ?? 0, crates),
      cratesTotal,
      carrots:    Math.max(cur.carrots ?? 0, carrots),
      bestDeaths: cur.bestDeaths === undefined ? deaths : Math.min(cur.bestDeaths, deaths),
      bestTime:   cur.bestTime === undefined ? time : Math.min(cur.bestTime, time),
      done: true,
    };
    this.save();
  }
  hasGem(id){ return !!(this.data.levels[id] && this.data.levels[id].gem); }
  get gems(){ return Object.values(this.data.levels).filter(l=>l.gem).length; }
  levelOpen(id, worldIndex, levelIndex){
    if (levelIndex > 0) return this.hasGem(prevId(id));
    return true;
  }
  worldOpen(worldIndex, gemsNeeded){ return this.gems >= gemsNeeded; }
}
function prevId(id){ const [w, l] = id.split('-'); return `${w}-${+l-1}`; }
