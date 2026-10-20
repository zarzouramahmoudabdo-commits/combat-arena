const AUDIO = { ctx:null, bus:{}, noise:null, jetG:null, windG:null, lastShot:0, step:0, mt:0 };
const BUSES = ['music','weapons','explosions','move','ui','ambient'];

function loopNoise(c, bus, freq, gain){
  const s = c.createBufferSource(); s.buffer = AUDIO.noise; s.loop = true;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
  const g = c.createGain(); g.gain.value = gain;
  s.connect(f); f.connect(g); g.connect(AUDIO.bus[bus]); s.start(); return g;
}
function applyVolumes(){
  if (!AUDIO.ctx) return;
  for (const b of BUSES) AUDIO.bus[b].gain.value = SET.vol[b];
}
function audioInit(){
  try {
    if (!AUDIO.ctx){
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const c = AUDIO.ctx = new AC();
      for (const b of BUSES){ const g = c.createGain(); g.connect(c.destination); AUDIO.bus[b] = g; }
      const n = c.createBuffer(1, c.sampleRate, c.sampleRate), d = n.getChannelData(0);
      for (let i=0;i<d.length;i++) d[i] = Math.random()*2 - 1;
      AUDIO.noise = n;
      AUDIO.jetG = loopNoise(c, 'move', 700, 0);
      AUDIO.windG = loopNoise(c, 'ambient', 350, 0);
      applyVolumes();
      setInterval(musicTick, 300);
    }
    if (AUDIO.ctx.state === 'suspended') AUDIO.ctx.resume();
  } catch(e){}
}
['touchstart','touchend','mousedown','click','keydown'].forEach(n => addEventListener(n, audioInit, { passive:true }));

function sfxNoise(bus, dur, gain, f0, f1, type){
  const c = AUDIO.ctx; if (!c || gain <= 0.01) return;
  const s = c.createBufferSource(); s.buffer = AUDIO.noise;
  const f = c.createBiquadFilter(); f.type = type || 'lowpass';
  f.frequency.setValueAtTime(f0, c.currentTime); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), c.currentTime + dur);
  const g = c.createGain(); g.gain.setValueAtTime(gain, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  s.connect(f); f.connect(g); g.connect(AUDIO.bus[bus]); s.start(); s.stop(c.currentTime + dur + 0.02);
}
function sfxTone(bus, f0, f1, dur, gain, type){
  const c = AUDIO.ctx; if (!c || gain <= 0.01) return;
  const o = c.createOscillator(); o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, c.currentTime); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), c.currentTime + dur);
  const g = c.createGain(); g.gain.setValueAtTime(gain, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g); g.connect(AUDIO.bus[bus]); o.start(); o.stop(c.currentTime + dur + 0.02);
}
function near(o){ if (!player || !o) return 1; return Math.max(0.12, 1 - Math.hypot(o.x-player.x, o.y-player.y)/1400); }

function sfxShot(w, who){
  if (!AUDIO.ctx) return;
  const now = performance.now(); if (now - AUDIO.lastShot < 25) return; AUDIO.lastShot = now;   // limits overlapping sounds
  const k = near(who);
  if (w.short === 'NRG') sfxTone('weapons', 1100, 200, 0.15, 0.25*k, 'sawtooth');
  else if (w.exp){ sfxNoise('weapons', 0.35, 0.5*k, 1500, 200); sfxTone('weapons', 120, 40, 0.2, 0.4*k); }
  else if (w.pellets > 1){ sfxNoise('weapons', 0.2, 0.7*k, 2500, 200); sfxTone('weapons', 150, 50, 0.15, 0.4*k); }
  else if (w.dmg >= 90){ sfxNoise('weapons', 0.3, 0.7*k, 4000, 300); sfxTone('weapons', 200, 50, 0.25, 0.4*k); }
  else sfxNoise('weapons', w.rate < 0.1 ? 0.05 : 0.09, 0.35*k, 3500, 500, 'bandpass');
}
function sfxExplode(x, y, r){
  if (!AUDIO.ctx) return;
  const k = near({ x, y });
  sfxNoise('explosions', 0.8, 0.9*k, 900, 60); sfxTone('explosions', 90, 30, 0.5, 0.8*k);
}
function sfxPickup(){ sfxTone('ui', 600, 900, 0.08, 0.3, 'square'); setTimeout(() => sfxTone('ui', 900, 1200, 0.08, 0.3, 'square'), 70); }
function sfxHurt(){ sfxTone('ui', 220, 120, 0.12, 0.4, 'square'); }
function sfxClick(){ sfxTone('ui', 800, 600, 0.04, 0.3, 'square'); }
function sfxThrow(k){ sfxNoise('weapons', k === 'gas' ? 0.5 : 0.2, 0.3, 2500, 600, 'bandpass'); }

function audioUpdate(dt){
  const c = AUDIO.ctx; if (!c || !player) return;
  const t = c.currentTime;
  AUDIO.jetG.gain.setTargetAtTime(player.jetting && !player.dead ? 0.35 : 0, t, 0.08);
  AUDIO.windG.gain.setTargetAtTime(0.25, t, 0.5);
  AUDIO.step -= dt;
  if (player.grounded && !player.dead && Math.abs(player.vx) > 80 && AUDIO.step <= 0){ AUDIO.step = 0.28; sfxNoise('move', 0.05, 0.25, 1800, 400); }
}
const BASS = [55, 55, 82.4, 55, 65.4, 55, 98, 82.4];
function musicTick(){
  if (!AUDIO.ctx || AUDIO.ctx.state !== 'running' || SET.vol.music <= 0) return;
  const n = BASS[AUDIO.mt % BASS.length]; AUDIO.mt++;
  sfxTone('music', n, n*0.98, 0.25, 0.18, 'triangle');
  if (AUDIO.mt % 2 === 0) sfxNoise('music', 0.04, 0.08, 8000, 6000, 'highpass');
}
