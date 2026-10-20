const SKINS = ['#e8c39e','#c68642','#8d5524','#f1c27d','#ffdbac'];
const HELMETS = ['Cap','Helmet','Beret','Hair'];
const MASKS = ['None','Bandana','Goggles'];
const JETS = ['#555555','#c0392b','#2980b9','#f1c40f','#27ae60'];
const SET = { lefty:false, btnScale:1, btnOpacity:0.45, zoom:540, shake:true, quality:1, bots:9, skill:0.6, infAmmo:true, infJet:true, killLimit:0 };
const PROFILE = { name:'You', uniform:0, skin:0, helmet:0, mask:0, jet:0 };
const TABS = ['Character','Controls','Screen','Game'];
let prevState = 'menu', stab = 0;

function randomLook(){
  const r = n => Math.floor(Math.random()*n);
  return { skin:r(SKINS.length), helmet:r(HELMETS.length), mask:r(MASKS.length), jet:r(JETS.length) };
}
function applySettings(){
  CONFIG.viewH = SET.zoom; CONFIG.match.bots = SET.bots; CONFIG.match.botSkill = SET.skill;
  CONFIG.rules.infiniteAmmo = SET.infAmmo; CONFIG.jet.infinite = SET.infJet; CONFIG.match.killLimit = SET.killLimit;
  CONFIG.match.playerName = PROFILE.name; CONFIG.rules.maxParticles = [120,350,600][SET.quality];
}
function saveSettings(){ try { localStorage.setItem('pca_save', JSON.stringify({ set:SET, profile:PROFILE })); } catch(e){} }
function loadSettings(){
  try { const j = JSON.parse(localStorage.getItem('pca_save') || '{}'); Object.assign(SET, j.set || {}); Object.assign(PROFILE, j.profile || {}); } catch(e){}
  applySettings();
}
loadSettings();

function optRow(l, obj, key, vals, labels){
  return { l, v: () => labels[Math.max(0, vals.indexOf(obj[key]))], t: () => { obj[key] = vals[(vals.indexOf(obj[key]) + 1) % vals.length]; } };
}
function tabRows(){
  const cyc = (k, n) => () => { PROFILE[k] = (PROFILE[k] + 1) % n; };
  if (stab === 0) return [
    { l:'Name', v: () => PROFILE.name, t: () => { const n = prompt('Player name', PROFILE.name); if (n && n.trim()) PROFILE.name = n.trim().slice(0,10); } },
    { l:'Uniform', v: () => '', sw: () => UNIFORMS[PROFILE.uniform], t: cyc('uniform', UNIFORMS.length) },
    { l:'Skin', v: () => '', sw: () => SKINS[PROFILE.skin], t: cyc('skin', SKINS.length) },
    { l:'Headgear', v: () => HELMETS[PROFILE.helmet], t: cyc('helmet', HELMETS.length) },
    { l:'Face', v: () => MASKS[PROFILE.mask], t: cyc('mask', MASKS.length) },
    { l:'Jetpack', v: () => '', sw: () => JETS[PROFILE.jet], t: cyc('jet', JETS.length) }
  ];
  if (stab === 1) return [
    optRow('Layout', SET, 'lefty', [false,true], ['Right-handed','Left-handed']),
    optRow('Button size', SET, 'btnScale', [0.8,1,1.2], ['Small','Medium','Large']),
    optRow('Button opacity', SET, 'btnOpacity', [0.25,0.45,0.7], ['Low','Medium','High'])
  ];
  if (stab === 2) return [
    optRow('Zoom', SET, 'zoom', [440,540,640], ['Close','Normal','Wide']),
    optRow('Screen shake', SET, 'shake', [true,false], ['On','Off']),
    optRow('Effects', SET, 'quality', [0,1,2], ['Low','Medium','High'])
  ];
  return [
    optRow('Bots (next match)', SET, 'bots', [3,5,9,11], ['3','5','9','11']),
    optRow('Bot skill', SET, 'skill', [0.35,0.6,0.85], ['Easy','Normal','Hard']),
    optRow('Infinite ammo', SET, 'infAmmo', [true,false], ['On','Off']),
    optRow('Infinite jetpack', SET, 'infJet', [true,false], ['On','Off']),
    optRow('Kill limit (next match)', SET, 'killLimit', [0,10,20,30], ['Off','10','20','30'])
  ];
}
function settingsLayout(){
  return { tabW: (innerWidth-40)/TABS.length, rowH: Math.min(44, (innerHeight-100)/6),
           rx: stab === 0 ? innerWidth*0.42 : 20, rw: stab === 0 ? innerWidth*0.58-20 : innerWidth-40, ry: 86 };
}
function drawSettings(){
  const d = window.devicePixelRatio || 1;
  ctx.setTransform(d,0,0,d,0,0);
  const g = ctx.createLinearGradient(0,0,0,innerHeight); g.addColorStop(0,'#1d2b3a'); g.addColorStop(1,'#0e141b');
  ctx.fillStyle = g; ctx.fillRect(0,0,innerWidth,innerHeight);
  ctx.textAlign = 'left'; ctx.fillStyle = '#ffeb3b'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('Settings', 20, 32);
  ctx.fillStyle = '#2e7d32'; rr(innerWidth-100, 10, 84, 32, 8);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Back', innerWidth-58, 31);
  const L = settingsLayout();
  for (let i=0;i<TABS.length;i++){
    ctx.fillStyle = i === stab ? '#ffeb3b' : 'rgba(255,255,255,0.12)'; rr(20+i*L.tabW, 46, L.tabW-6, 28, 8);
    ctx.fillStyle = i === stab ? '#000' : '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(TABS[i], 20+i*L.tabW+(L.tabW-6)/2, 65);
  }
  tabRows().forEach((r, i) => {
    const y = L.ry + i*L.rowH, h = L.rowH-5;
    ctx.fillStyle = 'rgba(255,255,255,0.09)'; rr(L.rx, y, L.rw, h, 8);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(r.l, L.rx+12, y+h/2+5);
    if (r.sw){
      ctx.fillStyle = r.sw(); ctx.beginPath(); ctx.arc(L.rx+L.rw-24, y+h/2, 10, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    } else { ctx.fillStyle = '#ffeb3b'; ctx.textAlign = 'right'; ctx.fillText(r.v(), L.rx+L.rw-12, y+h/2+5); }
  });
  if (stab === 0){
    const s = d*3.2;
    const pf = { x:0, y:34, w:20, h:36, col:UNIFORMS[PROFILE.uniform], look:PROFILE, facing:1, aim:0.1, recoil:0, flash:0, dmgFlash:0, protect:0,
                 dead:false, jetting:false, grounded:true, vx:0, slots:[{id:'pistol'}], cur:0, kills:0, name:PROFILE.name, human:true };
    ctx.setTransform(s,0,0,s, d*innerWidth*0.2 - 10*s, d*innerHeight*0.5 - 52*s);
    drawFighter(pf);
  }
}
function settingsTap(x, y){
  if (x >= innerWidth-100 && x <= innerWidth-16 && y >= 10 && y <= 42){
    saveSettings(); applySettings(); resize(); state = prevState; return;
  }
  const L = settingsLayout();
  if (y >= 46 && y <= 76){ const i = Math.floor((x-20)/L.tabW); if (i >= 0 && i < TABS.length) stab = i; return; }
  const rows = tabRows();
  for (let i=0;i<rows.length;i++){
    const ry = L.ry + i*L.rowH;
    if (x >= L.rx && x <= L.rx+L.rw && y >= ry && y <= ry+L.rowH-5){
      rows[i].t(); applySettings(); saveSettings(); resize();
      if (player){ player.col = UNIFORMS[PROFILE.uniform]; player.look = PROFILE; player.name = PROFILE.name; }
      return;
    }
  }
}
function settingsBtnRect(){ return { x: innerWidth/2-100, y: innerHeight*0.36 + 2*84 + 4, w: 200, h: 40 }; }
function drawMenuExtras(){
  const r = settingsBtnRect();
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; rr(r.x, r.y, r.w, r.h, 10);
  ctx.fillStyle = '#ffeb3b'; ctx.textAlign = 'center'; ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Settings / Character', r.x+r.w/2, r.y+26);
}

// ---------- weapon wheel (hold the gun button, drag to a weapon, release) ----------
const wheel = { open:false, id:null, sel:null };
function wheelItems(){
  const b = btnPos(1), n = player.slots.length, R = 92, out = [];
  for (let i=0;i<n;i++){
    const t = n === 1 ? 0.5 : i/(n-1), a = SET.lefty ? -t*Math.PI/2 : Math.PI + t*Math.PI/2;
    out.push({ x: b.x + Math.cos(a)*R, y: b.y + Math.sin(a)*R });
  }
  return out;
}
function wheelMove(x, y){
  if (!player) return;
  let best = null, bd = 44;
  wheelItems().forEach((it, i) => { const d = Math.hypot(x-it.x, y-it.y); if (d < bd){ bd = d; best = i; } });
  wheel.sel = best;
}
function wheelEnd(){
  if (wheel.sel !== null && player && !player.dead) player.switchTo(wheel.sel);
  wheel.open = false; wheel.id = null; wheel.sel = null;
}
function drawWheel(d){
  if (!wheel.open || !player) return;
  const items = wheelItems();
  items.forEach((it, i) => {
    const w = WEAPONS[player.slots[i].id], on = wheel.sel === i, cur = player.cur === i;
    ctx.globalAlpha = 0.92; ctx.fillStyle = on ? '#ffeb3b' : (cur ? '#9be37a' : '#222');
    ctx.beginPath(); ctx.arc(it.x*d, it.y*d, 30*d, 0, 7); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = w.col; ctx.fillRect((it.x - w.len*0.4)*d, (it.y-9)*d, w.len*0.8*d, 8*d);
    ctx.fillStyle = on ? '#000' : '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold ' + (11*d) + 'px sans-serif';
    ctx.fillText(w.short, it.x*d, (it.y+14)*d);
  });
}
function drawBtnIcon(k, X, Y, R, p){
  ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.strokeStyle = '#000';
  if (k === 'nade'){
    ctx.fillStyle = NADE[p.nadeType].col; ctx.beginPath(); ctx.arc(X, Y+R*0.12, R*0.52, 0, 7); ctx.fill();
    ctx.fillStyle = '#1d3d1d'; ctx.fillRect(X-R*0.22, Y-R*0.55, R*0.44, R*0.2);
    ctx.strokeStyle = '#555'; ctx.lineWidth = R*0.1; ctx.beginPath(); ctx.moveTo(X+R*0.05, Y-R*0.5); ctx.lineTo(X+R*0.6, Y-R*0.35); ctx.stroke();
    ctx.fillStyle = '#e33'; ctx.beginPath(); ctx.arc(X+R*0.75, Y-R*0.7, R*0.32, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold ' + (R*0.5) + 'px sans-serif'; ctx.fillText(p.nades[p.nadeType], X+R*0.75, Y-R*0.52);
  } else if (k === 'wheel'){
    ctx.fillRect(X-R*0.55, Y-R*0.2, R*0.95, R*0.3); ctx.fillRect(X-R*0.2, Y+R*0.05, R*0.25, R*0.5);
  } else if (k === 'gear'){
    ctx.lineWidth = R*0.18; ctx.beginPath(); ctx.arc(X, Y, R*0.38, 0, 7); ctx.stroke();
    for (let a=0;a<8;a++){ ctx.save(); ctx.translate(X, Y); ctx.rotate(a*Math.PI/4); ctx.fillRect(-R*0.09, -R*0.64, R*0.18, R*0.24); ctx.restore(); }
  } else {
    ctx.font = 'bold ' + (R*0.7) + 'px sans-serif'; ctx.fillText(k === 'pick' ? 'E' : 'M', X, Y+R*0.25);
  }
}
