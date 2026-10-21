// ================= defaults for new settings =================
SET.layout = SET.layout || {};
for (const k of ['runMul','jumpMul','jetMul','gravMul']) SET[k] = SET[k] || 1;
PROFILE.pattern = PROFILE.pattern || 0; PROFILE.vest = PROFILE.vest || 0;
const BASE = { run: CONFIG.runSpeed, jump: CONFIG.jumpVel, thrust: CONFIG.jet.thrust, maxUp: CONFIG.jet.maxUp, g: CONFIG.gravity };
const PATTERNS = ['Plain','Camo','Stripes'], VESTS = ['None','Plate','Tactical'];
TABS.push('Move');
const _as = window.applySettings;
window.applySettings = function(){
  _as();
  CONFIG.runSpeed = BASE.run*SET.runMul; CONFIG.jumpVel = BASE.jump*SET.jumpMul;
  CONFIG.jet.thrust = BASE.thrust*SET.jetMul; CONFIG.jet.maxUp = BASE.maxUp*SET.jetMul; CONFIG.gravity = BASE.g*SET.gravMul;
};
const _rl = window.randomLook;
window.randomLook = function(){ const l = _rl(); l.pattern = Math.floor(Math.random()*3); l.vest = Math.floor(Math.random()*3); return l; };

// ================= new weapons =================
Object.assign(WEAPONS, {
  revolver:{ name:'Revolver',     short:'RVL', dmg:55, rate:0.55, speed:950,  life:0.8,  spread:0.01,  pellets:1, mag:6,   reserve:36,  reload:1.6, kick:70,  len:18, col:'#7a4a24', trail:'#ffe066', weight:7, falloff:false, shake:2 },
  dmr:    { name:'DMR',          short:'DMR', dmg:38, rate:0.28, speed:1700, life:1,    spread:0.004, pellets:1, mag:10,  reserve:40,  reload:2.0, kick:45,  len:32, col:'#3b3b2f', trail:'#ffffff', weight:5, falloff:false, shake:1 },
  minigun:{ name:'Minigun',      short:'MNG', dmg:9,  rate:0.035,speed:950,  life:0.8,  spread:0.12,  pellets:1, mag:200, reserve:400, reload:4,   kick:5,   len:28, col:'#3d3d3d', trail:'#ffb347', weight:2, falloff:true,  shake:1 },
  flame:  { name:'Flamethrower', short:'FLM', dmg:5,  rate:0.03, speed:380,  life:0.42, spread:0.28,  pellets:1, mag:150, reserve:300, reload:3,   kick:2,   len:24, col:'#7a1f1f', trail:'#ff7a1a', weight:3, falloff:false, shake:0, fire:true },
  railgun:{ name:'Railgun',      short:'RLG', dmg:80, rate:1.4,  speed:3000, life:0.6,  spread:0,     pellets:1, mag:4,   reserve:16,  reload:2.4, kick:160, len:30, col:'#8b97a3', trail:'#2ee6ff', weight:2, falloff:false, shake:4, hitscan:true }
});
Object.assign(RARITY, { revolver:'#ffffff', dmr:'#4aa3ff', minigun:'#b266ff', flame:'#ff8c1a', railgun:'#b266ff' });
POWER.push('dmr', 'minigun', 'railgun');

const _dg = window.drawGun;
window.drawGun = function(id){
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  if (id === 'revolver'){ R(2,-4,10,4,'#4a4f57'); R(12,-3,7,2,'#2a2a2a'); ctx.fillStyle = '#6d737d'; ctx.beginPath(); ctx.arc(7,-1,4,0,7); ctx.fill(); R(3,0,4,7,'#7a4a24'); }
  else if (id === 'dmr'){ R(-8,-3,9,5,'#3b3b2f'); R(1,-4,13,5,'#33373d'); R(14,-3,18,2,'#1d1d1d'); R(6,-8,9,3,'#111111'); R(6,-8,2,3,'#3388cc'); R(5,1,3,8,'#222222'); }
  else if (id === 'minigun'){ R(-4,-5,10,8,'#3d3d3d'); for (let i=0;i<4;i++) R(6,-5+i*2.5,22,1.6,'#9aa0a8'); R(26,-6,3,11,'#2a2a2a'); R(6,3,8,6,'#5a6b3a'); R(-2,-8,6,3,'#222222'); }
  else if (id === 'flame'){ R(0,-4,14,6,'#7a1f1f'); R(14,-3,10,3,'#444444'); R(23,-4,3,5,'#ff8c1a'); ctx.fillStyle = '#8a8a8a'; ctx.beginPath(); ctx.arc(6,5,6,0,7); ctx.fill(); R(2,-2,8,2,'#c9b21c'); }
  else if (id === 'railgun'){ R(-6,-4,12,7,'#d7dde2'); R(6,-3,24,5,'#8b97a3'); R(6,-1,24,1,'#2ee6ff'); R(2,-1,4,2,'#2ee6ff'); R(28,-4,3,7,'#2a6f8a'); R(0,3,4,6,'#455a64'); }
  else _dg(id);
};

// ---- hitscan (railgun), beams, burning (flamethrower) ----
const beams = [];
function hitscanShot(o, w, mx, my){
  const dx = Math.cos(o.aim), dy = Math.sin(o.aim), hit = [];
  let x = mx, y = my;
  for (let len = 0; len < 1600; len += 6){
    x = mx + dx*len; y = my + dy*len;
    if (solid(Math.floor(x/T), Math.floor(y/T))) break;
    if (hitProp({ w:{ dmg:w.dmg, exp:false }, owner:o }, x, y)) break;
    const f = hitFighter(x, y, o);
    if (f && !hit.includes(f)){
      hit.push(f);
      const head = y < f.y + 11, dmg = w.dmg*(head ? 2 : 1)*(o.dmgT > 0 ? 1.5 : 1);
      o.lastHead = head; f.takeDamage(dmg, o); dmgNumber(x, y, dmg, head, o, f);
    }
  }
  beams.push({ x0:mx, y0:my, x1:x, y1:y, t:0.18, col:w.trail });
}
function drawBeams(){
  for (let i=beams.length-1;i>=0;i--){
    const b = beams[i]; b.t -= 0.016;
    if (b.t <= 0){ beams.splice(i,1); continue; }
    ctx.globalAlpha = Math.min(1, b.t*6); ctx.strokeStyle = b.col; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(b.x0, b.y0); ctx.lineTo(b.x1, b.y1); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
const _dnm = window.drawNums;
window.drawNums = function(){ drawBeams(); _dnm(); };

const _shoot = Fighter.prototype.shoot;
Fighter.prototype.shoot = function(s, w){
  if (w.hitscan){
    this.cool = w.rate; this.recoil = 1; this.flash = 0.08;
    if (!CONFIG.rules.infiniteAmmo) s.mag--;
    sfxShot(w, this);
    hitscanShot(this, w, this.x + this.w/2 + Math.cos(this.aim)*(w.len+6), this.y + this.h/2 - 2 + Math.sin(this.aim)*(w.len+6));
    this.vx -= Math.cos(this.aim)*w.kick; this.vy -= Math.sin(this.aim)*w.kick*0.4;
    if (this.human) shake = Math.max(shake, w.shake);
  } else _shoot.call(this, s, w);
  if (w.fire) spawnParts(this.x + this.w/2 + Math.cos(this.aim)*(w.len+8), this.y + this.h/2 - 2 + Math.sin(this.aim)*(w.len+8), 2, '#ff8c1a', 120, 0.35, 4);
};
const _td = Fighter.prototype.takeDamage;
Fighter.prototype.takeDamage = function(d, by){
  if (by && by !== this && by.slots && WEAPONS[by.slots[by.cur].id].fire && d < 12){ this.burn = 2.5; this.burnBy = by; }
  _td.call(this, d, by);
};
const _up = Fighter.prototype.update;
Fighter.prototype.update = function(dt, cam){
  _up.call(this, dt, cam);
  if (this.burn > 0 && !this.dead){
    this.burn -= dt; _td.call(this, 7*dt, this.burnBy);
    if (Math.random() < 0.5) spawnParts(this.x + this.w/2, this.y + 10, 1, '#ff8c1a', 70, 0.4, 3);
  }
};
const _spawn = Fighter.prototype.spawn;
Fighter.prototype.spawn = function(){ _spawn.call(this); this.burn = 0; };

// ---- random weapons scattered on the ground ----
function scatterPickups(){
  const all = mapDef.rects.concat([[2, MH-2, MW-4, 1]]);
  let tries = 0, made = 0;
  while (made < 16 && tries++ < 300){
    const r = all[Math.floor(Math.random()*all.length)];
    if (r[2] < 3) continue;
    const tx = r[0] + Math.floor(Math.random()*r[2]);
    if (solid(tx, r[1]-1) || solid(tx, r[1]-2)) continue;
    const x = tx*T + 7, hi = r[1]*T < MH*T*0.4, y = dropToGround(x, r[1]*T - 40, 18, 12);
    if (pickups.some(p => Math.hypot(p.x - x, p.y - y) < 70)) continue;
    addPickup(x, y, rollItem(hi), { high: hi }); made++;
  }
}
const _sp = window.spawnProps;
window.spawnProps = function(){ _sp(); scatterPickups(); };

// ================= sound =================
const SAMPLES = {};
const SAMPLE_NAMES = ['shot_pst','shot_smg','shot_ar','shot_shg','shot_snp','shot_hmg','shot_rkt','shot_gl','shot_nrg','shot_rvl','shot_dmr','shot_mng','shot_flm','shot_rlg','explosion','death','throw'];
function loadSamples(){
  if (!AUDIO.ctx || AUDIO.sampleLoad) return;
  AUDIO.sampleLoad = true;
  for (const n of SAMPLE_NAMES)
    fetch('audio/' + n + '.ogg').then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(b => AUDIO.ctx.decodeAudioData(b)).then(buf => { SAMPLES[n] = buf; }).catch(() => {});
}
function playSample(name, bus, gain, rate){
  const b = SAMPLES[name], c = AUDIO.ctx; if (!b || !c) return false;
  const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = rate || 1;
  const g = c.createGain(); g.gain.value = gain; s.connect(g); g.connect(AUDIO.bus[bus]); s.start(); return true;
}
function revFor(bus){
  const c = AUDIO.ctx; AUDIO.revs = AUDIO.revs || {};
  if (!AUDIO.revs[bus]){
    if (!AUDIO.impulse){
      const len = Math.floor(c.sampleRate*1.2), b = c.createBuffer(2, len, c.sampleRate);
      for (let ch=0; ch<2; ch++){ const d = b.getChannelData(ch); for (let i=0;i<len;i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/len, 3); }
      AUDIO.impulse = b;
    }
    const cv2 = c.createConvolver(); cv2.buffer = AUDIO.impulse; cv2.connect(AUDIO.bus[bus]); AUDIO.revs[bus] = cv2;
  }
  return AUDIO.revs[bus];
}
function sfxNoise(bus, dur, gain, f0, f1, type, rev, delay){
  const c = AUDIO.ctx; if (!c || gain <= 0.01) return;
  const t0 = c.currentTime + (delay || 0);
  const s = c.createBufferSource(); s.buffer = AUDIO.noise;
  const f = c.createBiquadFilter(); f.type = type || 'lowpass';
  f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
  const g = c.createGain(); g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(AUDIO.bus[bus]);
  if (rev){ const sg = c.createGain(); sg.gain.value = rev; g.connect(sg); sg.connect(revFor(bus)); }
  s.start(t0); s.stop(t0 + dur + 0.02);
}
function sfxTone(bus, f0, f1, dur, gain, type, rev, delay){
  const c = AUDIO.ctx; if (!c || gain <= 0.01) return;
  const t0 = c.currentTime + (delay || 0);
  const o = c.createOscillator(); o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  const g = c.createGain(); g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(AUDIO.bus[bus]);
  if (rev){ const sg = c.createGain(); sg.gain.value = rev; g.connect(sg); sg.connect(revFor(bus)); }
  o.start(t0); o.stop(t0 + dur + 0.02);
}
// c = crack [highpass freq, dur, gain], b = body [f0, f1, dur, gain], t = thump [f0, f1, dur, gain], r = reverb amount
const SHOT = {
  PST:{ c:[3500,.04,.5], b:[2500,300,.09,.5],  t:[180,60,.08,.4],  r:.18 },
  SMG:{ c:[4200,.03,.35],b:[3000,500,.05,.35], t:[220,90,.05,.3],  r:.1 },
  AR: { c:[3000,.05,.5], b:[2200,200,.12,.55], t:[140,50,.1,.5],   r:.22 },
  SHG:{ c:[2000,.08,.6], b:[1800,120,.25,.8],  t:[100,35,.18,.7],  r:.35 },
  SNP:{ c:[5000,.06,.7], b:[3500,150,.35,.8],  t:[90,30,.25,.7],   r:.5 },
  HMG:{ c:[2500,.05,.5], b:[1800,150,.1,.6],   t:[110,45,.1,.6],   r:.2 },
  RKT:{ c:[1500,.1,.3],  b:[1200,100,.6,.6],   t:[90,30,.3,.6],    r:.35 },
  GL: { c:[1200,.05,.2], b:[900,150,.15,.4],   t:[160,60,.15,.6],  r:.2 },
  NRG:{ c:[6000,.03,.2], b:[3000,500,.05,.1],  t:[0,0,0,0], r:.2, x: k => sfxTone('weapons', 1600, 250, 0.18, 0.3*k, 'sawtooth', 0.2) },
  RVL:{ c:[3000,.06,.7], b:[2000,150,.3,.8],   t:[100,40,.2,.7],   r:.35 },
  DMR:{ c:[4000,.05,.6], b:[2800,200,.2,.6],   t:[130,45,.15,.5],  r:.3 },
  MNG:{ c:[2800,.03,.35],b:[2000,200,.06,.45], t:[130,50,.05,.4],  r:.1 },
  FLM:{ c:[2000,.04,.1], b:[900,300,.14,.45],  t:[0,0,0,0], r:.1 },
  RLG:{ c:[6000,.1,.4],  b:[4000,300,.3,.5],   t:[80,25,.35,.8],   r:.5, x: k => { sfxTone('weapons', 3200, 120, 0.4, 0.35*k, 'sawtooth', 0.4); } }
};
function sfxShot(w, who){
  if (!AUDIO.ctx) return;
  loadSamples();
  const now = performance.now(); if (now - AUDIO.lastShot < 22) return; AUDIO.lastShot = now;   // limits overlapping sounds
  const k = near(who), key = w.short;
  if (playSample('shot_' + key.toLowerCase(), 'weapons', 0.9*k, 0.97 + Math.random()*0.06)) return;
  const P = SHOT[key];
  if (!P){ sfxNoise('weapons', 0.08, 0.4*k, 3500, 500, 'bandpass'); return; }
  const j = 0.9 + Math.random()*0.2;
  sfxNoise('weapons', P.c[1], P.c[2]*k, P.c[0]*j, P.c[0]*0.4, 'highpass', P.r);
  sfxNoise('weapons', P.b[2], P.b[3]*k, P.b[0]*j, P.b[1], 'lowpass', P.r);
  sfxTone('weapons', Math.max(20, P.t[0]*j), Math.max(20, P.t[1]), Math.max(0.01, P.t[2]), P.t[3]*k, 'sine');
  if (P.x) P.x(k);
}
function sfxExplode(x, y, r){
  if (!AUDIO.ctx) return;
  loadSamples();
  const k = near({ x, y }), s = Math.min(1.3, r/100);
  if (playSample('explosion', 'explosions', k, 0.9 + Math.random()*0.2)) return;
  sfxNoise('explosions', 0.12, 0.8*k, 6000, 800, 'highpass', 0.3);
  sfxTone('explosions', 85, 24, 0.9*s, 1.0*k, 'sine', 0.35);
  sfxNoise('explosions', 1.3*s, 0.9*k, 700, 40, 'lowpass', 0.5);
  for (let i=0;i<4;i++) sfxNoise('explosions', 0.08, 0.35*k, 3000, 600, 'bandpass', 0.2, 0.15 + i*0.12 + Math.random()*0.1);
}
function sfxThrow(k){
  if (!AUDIO.ctx) return;
  loadSamples();
  if (playSample('throw', 'weapons', 0.7, 1)) return;
  sfxTone('weapons', 2600, 1800, 0.03, 0.25, 'square');
  if (k === 'mine'){ sfxTone('weapons', 1500, 1400, 0.06, 0.3, 'square', 0, 0.12); sfxTone('weapons', 1500, 1400, 0.06, 0.3, 'square', 0, 0.3); return; }
  sfxNoise('weapons', 0.3, 0.35, 2500, 500, 'bandpass', 0.1, 0.05);
  if (k === 'gas') sfxNoise('weapons', 0.9, 0.35, 7000, 4000, 'highpass', 0.2, 1.2);
}
function sfxDeath(f){
  if (!AUDIO.ctx) return;
  loadSamples();
  const k = near(f);
  if (playSample('death', 'weapons', k, 0.95 + Math.random()*0.1)) return;
  sfxTone('weapons', 260, 90, 0.4, 0.35*k, 'sawtooth', 0.2); sfxTone('weapons', 190, 70, 0.4, 0.2*k, 'square', 0.1);
  sfxNoise('move', 0.2, 0.35*k, 900, 120, 'lowpass', 0, 0.25);
}
const _die = Fighter.prototype.die;
Fighter.prototype.die = function(by, drop){ const was = this.dead; _die.call(this, by, drop); if (!was) sfxDeath(this); };
const _sw = Fighter.prototype.switchTo;
Fighter.prototype.switchTo = function(i){ const c = this.cur; _sw.call(this, i); if (this.human && this.cur !== c) sfxTone('ui', 700, 500, 0.05, 0.3, 'square'); };
const _dn = window.dmgNumber;
window.dmgNumber = function(x, y, d, head, owner, f){
  _dn(x, y, d, head, owner, f);
  if (owner === player && f !== player) sfxTone('ui', head ? 1900 : 1300, head ? 1500 : 1000, 0.05, head ? 0.35 : 0.2, 'square');
};

// ================= better character model =================
function drawFighter(p){
  if (p.dead) return;
  if (p.protect > 0 && Math.floor(clock*12) % 2 === 0) return;
  const cx = p.x + p.w/2, f = p.facing, w = WEAPONS[p.slots[p.cur].id], L = p.look, y0 = p.y;
  const skin = SKINS[L.skin], body = p.dmgFlash > 0 ? '#ff6666' : p.col;
  const run = p.grounded ? Math.sin(p.x*0.16)*Math.min(1, Math.abs(p.vx)/160) : 0, air = !p.grounded;
  if (p.grounded){ ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(cx, y0+p.h+1, 9, 2.5, 0, 0, 7); ctx.fill(); }
  const jx = cx - f*10;
  if (p.jetting){ ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.moveTo(jx-4, y0+30); ctx.lineTo(jx+4, y0+30); ctx.lineTo(jx, y0+42+Math.random()*10); ctx.fill(); }
  ctx.fillStyle = JETS[L.jet]; ctx.fillRect(jx-5, y0+10, 9, 17);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(jx-4, y0+11, 2, 15);
  ctx.fillStyle = '#222222'; ctx.fillRect(jx-3, y0+27, 6, 3);
  // legs (hip, knee, foot) + boots
  ctx.lineCap = 'round'; ctx.lineWidth = 4.5;
  for (const sg of [-1, 1]){
    const ph = run*sg, hx = cx + sg*2.5, kx = hx + ph*4 + (air ? f*3 : 0), ky = y0 + 31 - (ph > 0 ? ph*2 : 0);
    const fx = hx + ph*7 - (air ? f : 0), fy = y0 + 35.5 - (ph < 0 ? -ph*2 : 0);
    ctx.strokeStyle = sg < 0 ? '#262a30' : '#2f343b';
    ctx.beginPath(); ctx.moveTo(hx, y0+25); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.fillStyle = '#141414'; ctx.fillRect(fx - 3 + f*1.5, fy - 1.5, 7, 3.5);
  }
  // rear arm
  ctx.strokeStyle = body; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - f*3, y0+13); ctx.lineTo(cx - f*5, y0+21); ctx.stroke();
  ctx.strokeStyle = skin; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - f*5, y0+21); ctx.lineTo(cx - f*5.5, y0+23); ctx.stroke();
  ctx.lineCap = 'butt';
  // torso, pattern, vest, belt
  ctx.fillStyle = body; rr(cx-7, y0+10, 14, 16, 3);
  const pat = L.pattern || 0;
  if (pat === 1){ ctx.fillStyle = 'rgba(15,30,10,0.35)'; ctx.fillRect(cx-6, y0+12, 5, 4); ctx.fillRect(cx+1, y0+16, 5, 5); ctx.fillRect(cx-5, y0+20, 6, 3); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(cx+1, y0+11, 4, 3); ctx.fillRect(cx-6, y0+17, 4, 3); }
  else if (pat === 2){ ctx.fillStyle = 'rgba(255,255,255,0.2)'; for (let i=0;i<3;i++) ctx.fillRect(cx-7, y0+13+i*4, 14, 1.6); }
  const vest = L.vest || 0;
  if (vest){ ctx.fillStyle = '#2b3139'; ctx.fillRect(cx-6, y0+11, 12, 11); ctx.fillStyle = '#3b4450'; ctx.fillRect(cx-5, y0+12, 10, 2); if (vest === 2){ ctx.fillRect(cx-5, y0+18, 4, 4); ctx.fillRect(cx+1, y0+18, 4, 4); } }
  ctx.fillStyle = '#1b1b1b'; ctx.fillRect(cx-7, y0+23, 14, 3); ctx.fillStyle = '#c9b21c'; ctx.fillRect(cx-1.5, y0+23.5, 3, 2);
  // head
  const hx = cx + f*0.5, hy = y0 + 6;
  ctx.fillStyle = skin; ctx.fillRect(cx-2, y0+9, 4, 3); ctx.beginPath(); ctx.arc(hx, hy, 6, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(hx + f*3 - 1.2, hy - 1.4, 2.8, 2.4); ctx.fillStyle = '#111111'; ctx.fillRect(hx + f*3.6 - 0.6, hy - 1, 1.4, 1.6);
  if (L.mask === 1){ ctx.fillStyle = '#b03a2f'; ctx.fillRect(hx-6, hy+1.5, 12, 4.5); }
  if (L.mask === 2){ ctx.fillStyle = '#2a2a2a'; ctx.fillRect(hx-6.5, hy-3, 13, 2); ctx.fillStyle = 'rgba(80,220,255,0.85)'; ctx.fillRect(hx + (f > 0 ? 0 : -6), hy-3.5, 6, 3.5); ctx.fillStyle = '#ffffff'; ctx.fillRect(hx + (f > 0 ? 1 : -3), hy-3, 1.5, 1); }
  if (L.helmet === 0){ ctx.fillStyle = '#3d5a2a'; ctx.beginPath(); ctx.arc(hx, hy-1, 6.5, Math.PI, 0); ctx.fill(); ctx.fillRect(f > 0 ? hx : hx-8, hy-2, 8, 2); }
  else if (L.helmet === 1){ ctx.fillStyle = '#4b5320'; ctx.beginPath(); ctx.arc(hx, hy-1, 7.5, Math.PI, 0); ctx.lineTo(hx+7.5, hy+2); ctx.lineTo(hx-7.5, hy+2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(hx-7, hy-3, 14, 2); ctx.strokeStyle = '#222222'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx-6, hy+2); ctx.lineTo(hx-3, hy+7); ctx.stroke(); }
  else if (L.helmet === 2){ ctx.fillStyle = '#8e1b1b'; ctx.beginPath(); ctx.ellipse(hx - f*2, hy-6, 8, 3.5, -f*0.2, 0, 7); ctx.fill(); }
  else { ctx.fillStyle = '#2b1d0e'; ctx.beginPath(); ctx.arc(hx, hy-2, 6, Math.PI, 0); ctx.fill(); ctx.fillRect(hx - f*6 - 1, hy-2, 2, 5); }
  // front arm + weapon (two hands on long guns)
  ctx.save(); ctx.translate(cx, y0+15); ctx.rotate(p.aim); if (f < 0) ctx.scale(1, -1); ctx.rotate(-p.recoil*0.1);
  ctx.lineCap = 'round';
  ctx.strokeStyle = body; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, 1); ctx.stroke();
  ctx.save(); ctx.translate(4 - p.recoil*3, 0); drawGun(p.slots[p.cur].id); ctx.restore();
  ctx.strokeStyle = skin; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(6, 1); ctx.lineTo(9, 1); ctx.stroke();
  if (w.len >= 20){
    ctx.strokeStyle = body; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(2, 3); ctx.lineTo(w.len*0.55, 2); ctx.stroke();
    ctx.strokeStyle = skin; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(w.len*0.55 - 2, 2); ctx.lineTo(w.len*0.55 + 1, 2); ctx.stroke();
  }
  ctx.lineCap = 'butt';
  if (p.flash > 0){ ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.arc(w.len+8, 0, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.arc(w.len+8, 0, 3, 0, 7); ctx.fill(); }
  ctx.restore();
  if (p.shield > 0){ ctx.strokeStyle = 'rgba(80,170,255,' + (0.5 + (p.shieldFlash > 0 ? 0.4 : 0)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, y0+18, 22, 0, 7); ctx.stroke(); }
  if (p.dmgT > 0){ ctx.fillStyle = 'rgba(255,60,60,0.14)'; ctx.beginPath(); ctx.arc(cx, y0+18, 20, 0, 7); ctx.fill(); }
  // name + kills badge + health
  ctx.font = 'bold 10px sans-serif';
  const kt = String(p.kills), tw = ctx.measureText(p.name).width, bw = 10 + kt.length*6, W = tw + bw + 10, X = cx - W/2, Y = y0 - 30;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; rr(X, Y, W, 14, 7);
  ctx.fillStyle = p.col; rr(X+1, Y+1, bw, 12, 6);
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.fillText(kt, X+1+bw/2, Y+10.5);
  ctx.textAlign = 'left'; ctx.fillStyle = p.human ? '#ffeb3b' : '#ffffff'; ctx.fillText(p.name, X+bw+5, Y+10.5);
  if (p.hp !== undefined){ ctx.fillStyle = '#0008'; ctx.fillRect(p.x-2, y0-12, p.w+4, 4); ctx.fillStyle = '#2ecc71'; ctx.fillRect(p.x-2, y0-12, (p.w+4)*Math.max(0, p.hp)/100, 4); }
}

// ================= control buttons: icons, movable layout =================
function btnPos(i){
  const s = SET.btnScale, r = 24*s, k = BTN[i].k, l = SET.layout[k];
  if (l) return { x: l.x*innerWidth, y: l.y*innerHeight, r };
  const col = i >= 2 ? 1 : 0, row = i >= 2 ? i - 2 : i;
  return { x: SET.lefty ? 44 + col*(r*2+10) : innerWidth - 44 - col*(r*2+10), y: 112 + row*(r*2+10), r };
}
function dialPos(){
  const s = SET.btnScale, l = SET.layout.dial;
  if (l) return { x: l.x*innerWidth, y: l.y*innerHeight, r: 30*s };
  const b = btnPos(1); return { x: b.x, y: b.y + 66*s, r: 30*s };
}
function barRects(n){
  const w = 78, h = 40, g = 6, tot = n*w + (n-1)*g, l = SET.layout.bar;
  const c = l ? { x: l.x*innerWidth, y: l.y*innerHeight } : { x: innerWidth/2, y: innerHeight - h/2 - 12 };
  const out = []; for (let i=0;i<n;i++) out.push({ x: c.x - tot/2 + i*(w+g), y: c.y - h/2, w, h }); return out;
}
function weaponBarRects(){ return barRects(player.slots.length); }
function drawDial(d, pl){
  const P = pl || player; if (!P || P.dead) return;
  const p = dialPos(), X = p.x*d, Y = p.y*d, R = p.r*d;
  ctx.globalAlpha = Math.min(1, SET.btnOpacity+0.35); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(X, Y, R, 0, 7); ctx.fill();
  NTYPES.forEach((ty, i) => {
    const a0 = -Math.PI/2 + i*2*Math.PI/3 + 0.1, a1 = a0 + 2*Math.PI/3 - 0.2, on = P.nadeType === ty, has = P.nades[ty] > 0;
    ctx.globalAlpha = has ? 1 : 0.3; ctx.strokeStyle = NADE[ty].col; ctx.lineWidth = (on ? 9 : 5)*d;
    ctx.beginPath(); ctx.arc(X, Y, R*0.74, a0, a1); ctx.stroke();
    const am = (a0+a1)/2; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.font = 'bold ' + (10*d) + 'px sans-serif';
    ctx.fillText(P.nades[ty], X + Math.cos(am)*R*0.74, Y + Math.sin(am)*R*0.74 + 3*d);
  });
  ctx.globalAlpha = 1; ctx.fillStyle = NADE[P.nadeType].col; ctx.beginPath(); ctx.arc(X, Y, R*0.3, 0, 7); ctx.fill();
}
function drawBtnIcon(k, X, Y, R, p){
  ctx.textAlign = 'center'; ctx.fillStyle = '#000000'; ctx.strokeStyle = '#000000'; ctx.lineCap = 'round';
  if (k === 'nade'){
    ctx.fillStyle = NADE[p.nadeType].col; ctx.beginPath(); ctx.arc(X, Y+R*0.12, R*0.52, 0, 7); ctx.fill();
    ctx.fillStyle = '#1d3d1d'; ctx.fillRect(X-R*0.22, Y-R*0.55, R*0.44, R*0.2);
    ctx.strokeStyle = '#555555'; ctx.lineWidth = R*0.1; ctx.beginPath(); ctx.moveTo(X+R*0.05, Y-R*0.5); ctx.lineTo(X+R*0.6, Y-R*0.35); ctx.stroke();
    ctx.fillStyle = '#ee3333'; ctx.beginPath(); ctx.arc(X+R*0.75, Y-R*0.7, R*0.32, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold ' + (R*0.5) + 'px sans-serif'; ctx.fillText(p.nades[p.nadeType], X+R*0.75, Y-R*0.52);
  } else if (k === 'pick'){
    ctx.lineWidth = R*0.16; ctx.beginPath(); ctx.moveTo(X, Y-R*0.5); ctx.lineTo(X, Y+R*0.05); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X-R*0.3, Y-R*0.22); ctx.lineTo(X, Y+R*0.1); ctx.lineTo(X+R*0.3, Y-R*0.22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X-R*0.5, Y+R*0.15); ctx.lineTo(X-R*0.5, Y+R*0.5); ctx.lineTo(X+R*0.5, Y+R*0.5); ctx.lineTo(X+R*0.5, Y+R*0.15); ctx.stroke();
  } else if (k === 'gear'){
    ctx.lineWidth = R*0.18; ctx.beginPath(); ctx.arc(X, Y, R*0.38, 0, 7); ctx.stroke();
    for (let a=0;a<8;a++){ ctx.save(); ctx.translate(X, Y); ctx.rotate(a*Math.PI/4); ctx.fillRect(-R*0.09, -R*0.64, R*0.18, R*0.24); ctx.restore(); }
  } else {
    ctx.lineWidth = R*0.16; for (let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(X-R*0.45, Y+i*R*0.32); ctx.lineTo(X+R*0.45, Y+i*R*0.32); ctx.stroke(); }
  }
  ctx.lineCap = 'butt';
}

// ---- layout editor (Controls tab > Button layout) ----
const LAYOUT = { on:false, drag:null };
function layoutItems(){
  const out = BTN.map((b, i) => { const p = btnPos(i); return { k:b.k, x:p.x, y:p.y, r:p.r+8 }; });
  const d = dialPos(); out.push({ k:'dial', x:d.x, y:d.y, r:d.r+8 });
  const rs = barRects(3), a = rs[0], z = rs[2];
  out.push({ k:'bar', rect:{ x:a.x, y:a.y, w:z.x+z.w-a.x, h:a.h } });
  return out;
}
function layoutTap(x, y){
  if (x >= innerWidth-110 && x <= innerWidth-14 && y >= 12 && y <= 46){ LAYOUT.on = false; LAYOUT.drag = null; saveSettings(); return; }
  if (x >= innerWidth-220 && x <= innerWidth-124 && y >= 12 && y <= 46){ SET.layout = {}; return; }
  for (const it of layoutItems()){
    const hit = it.rect ? (x >= it.rect.x && x <= it.rect.x+it.rect.w && y >= it.rect.y && y <= it.rect.y+it.rect.h) : Math.hypot(x-it.x, y-it.y) <= it.r;
    if (hit){ LAYOUT.drag = it.k; return; }
  }
}
function layoutMove(e){
  if (!LAYOUT.on || !LAYOUT.drag) return;
  const t = e.changedTouches ? e.changedTouches[0] : e;
  SET.layout[LAYOUT.drag] = { x: Math.max(0.04, Math.min(0.96, t.clientX/innerWidth)), y: Math.max(0.06, Math.min(0.94, t.clientY/innerHeight)) };
  e.preventDefault();
}
['touchmove','mousemove'].forEach(n => window.addEventListener(n, layoutMove, { passive:false }));
['touchend','touchcancel','mouseup'].forEach(n => window.addEventListener(n, () => { LAYOUT.drag = null; }));
function drawLayoutEditor(){
  const d = window.devicePixelRatio || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#10161d'; ctx.fillRect(0, 0, SW, SH);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x=0;x<innerWidth;x+=50){ ctx.moveTo(x*d, 0); ctx.lineTo(x*d, SH); }
  for (let y=0;y<innerHeight;y+=50){ ctx.moveTo(0, y*d); ctx.lineTo(SW, y*d); }
  ctx.stroke();
  const fake = { nades:{ frag:3, gas:1, mine:2 }, nadeType:'frag', dead:false };
  BTN.forEach((b, i) => {
    const p = btnPos(i); ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(p.x*d, p.y*d, p.r*d, 0, 7); ctx.fill();
    ctx.globalAlpha = 1; drawBtnIcon(b.k, p.x*d, p.y*d, p.r*d, fake);
  });
  drawDial(d, fake);
  barRects(3).forEach(r => { ctx.globalAlpha = 0.8; ctx.fillStyle = 'rgba(255,255,255,0.25)'; rr(r.x*d, r.y*d, r.w*d, r.h*d, 8*d); });
  ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.fillStyle = '#ffeb3b'; ctx.font = 'bold ' + (16*d) + 'px sans-serif';
  ctx.fillText('Drag any control to move it', SW/2, 34*d);
  ctx.fillStyle = '#c0392b'; rr((innerWidth-220)*d, 12*d, 96*d, 34*d, 8*d); ctx.fillStyle = '#2e7d32'; rr((innerWidth-110)*d, 12*d, 96*d, 34*d, 8*d);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold ' + (14*d) + 'px sans-serif';
  ctx.fillText('Reset', (innerWidth-172)*d, 34*d); ctx.fillText('Done', (innerWidth-62)*d, 34*d);
}
const _ds = window.drawSettings;
window.drawSettings = function(){ if (LAYOUT.on) drawLayoutEditor(); else _ds(); };
const _st = window.settingsTap;
window.settingsTap = function(x, y){ if (LAYOUT.on){ layoutTap(x, y); return; } _st(x, y); };

// ---- settings tabs: character extras, controls layout row, movement tab ----
const _tr = window.tabRows;
window.tabRows = function(){
  if (stab === 5) return [
    optRow('Run speed', SET, 'runMul', [0.8,1,1.2,1.4], ['Slow','Normal','Fast','Very fast']),
    optRow('Jump height', SET, 'jumpMul', [0.9,1,1.15], ['Low','Normal','High']),
    optRow('Jetpack power', SET, 'jetMul', [0.8,1,1.3], ['Weak','Normal','Strong']),
    optRow('Gravity', SET, 'gravMul', [0.8,1,1.2], ['Low','Normal','High'])
  ];
  const rows = _tr();
  if (stab === 0){
    rows.push({ l:'Pattern', v: () => PATTERNS[PROFILE.pattern || 0], t: () => { PROFILE.pattern = ((PROFILE.pattern || 0) + 1) % 3; } });
    rows.push({ l:'Vest', v: () => VESTS[PROFILE.vest || 0], t: () => { PROFILE.vest = ((PROFILE.vest || 0) + 1) % 3; } });
  }
  if (stab === 1) rows.push({ l:'Button layout', v: () => 'Edit', t: () => { LAYOUT.on = true; LAYOUT.drag = null; } });
  return rows;
};
function settingsLayout(){
  const n = Math.max(6, tabRows().length);
  return { tabW: (innerWidth-40)/TABS.length, rowH: Math.min(44, (innerHeight-96)/n),
           rx: stab === 0 ? innerWidth*0.42 : 20, rw: stab === 0 ? innerWidth*0.58-20 : innerWidth-40, ry: 86 };
}
window.applySettings(); resize();
