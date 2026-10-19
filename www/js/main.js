// ---------- canvas ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let SW, SH, scale;
function resize(){
  const d = window.devicePixelRatio || 1;
  SW = cv.width = innerWidth * d; SH = cv.height = innerHeight * d;
  scale = SH / CONFIG.viewH;
}
addEventListener('resize', resize); resize();

// ---------- input ----------
const keys = {};
addEventListener('keydown', e => {
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  if (!keys[e.code]){
    if (e.code==='Escape') doAction('menu');
    if (e.code==='KeyR') doAction('reload');
    if (e.code==='KeyQ') doAction('swap');
    if (e.code==='KeyG') doAction('nade');
    if (e.code==='KeyE') doAction('pick');
    if (e.code==='Digit1') doAction('slot0');
    if (e.code==='Digit2') doAction('slot1');
  }
  keys[e.code] = true;
});
addEventListener('keyup', e => keys[e.code] = false);
const mouse = { x: 0, y: 0, down: false, active: false };
cv.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
cv.addEventListener('mousedown', e => { if (state === 'menu') menuTap(e.clientX, e.clientY); else mouse.down = true; });
addEventListener('mouseup', () => mouse.down = false);

const stick = {
  L: { id: null, ox: 0, oy: 0, x: 0, y: 0 },
  R: { id: null, ox: 0, oy: 0, x: 0, y: 0 }
};
const STICK_R = 60;
function stickVec(s){
  let dx = s.x - s.ox, dy = s.y - s.oy;
  const len = Math.hypot(dx, dy);
  if (len > STICK_R){ dx = dx/len*STICK_R; dy = dy/len*STICK_R; }
  return { x: dx/STICK_R, y: dy/STICK_R };
}
const BTN = [ {k:'nade',l:'G'}, {k:'reload',l:'R'}, {k:'swap',l:'SW'}, {k:'pick',l:'E'}, {k:'menu',l:'M'} ];
const btnFlash = [0,0,0,0,0];
function btnPos(i){ return i === 4 ? { x: innerWidth - 102, y: 112, r: 24 } : { x: innerWidth - 44, y: 112 + i*58, r: 24 }; }
function hitButton(x, y){
  for (let i=0;i<BTN.length;i++){ const b = btnPos(i); if (Math.hypot(x-b.x, y-b.y) <= b.r+8) return i; }
  return -1;
}
function touchHandler(e){
  e.preventDefault();
  if (state === 'menu'){ if (e.type === 'touchstart') for (const t of e.changedTouches) menuTap(t.clientX, t.clientY); return; }
  for (const t of e.changedTouches){
    if (e.type === 'touchstart'){
      const bi = hitButton(t.clientX, t.clientY);
      if (bi >= 0){ btnFlash[bi] = 0.15; doAction(BTN[bi].k); continue; }
      const s = t.clientX < innerWidth/2 ? stick.L : stick.R;
      if (s.id === null){ s.id = t.identifier; s.ox = s.x = t.clientX; s.oy = s.y = t.clientY; }
    } else if (e.type === 'touchmove'){
      for (const k of [stick.L, stick.R]) if (k.id === t.identifier){ k.x = t.clientX; k.y = t.clientY; }
    } else {
      for (const k of [stick.L, stick.R]) if (k.id === t.identifier) k.id = null;
    }
  }
}
['touchstart','touchmove','touchend','touchcancel'].forEach(n => cv.addEventListener(n, touchHandler, {passive:false}));
function doAction(k){
  if (k === 'menu'){ state = 'menu'; return; }
  if (!player || player.dead) return;
  if (k==='reload') player.reload();
  else if (k==='swap') player.switchTo(1 - player.cur);
  else if (k==='slot0') player.switchTo(0);
  else if (k==='slot1') player.switchTo(1);
  else if (k==='nade') player.throwNade();
  else if (k==='pick') player.tryPickup();
}

// ---------- fighters ----------
let player = null, state = 'menu';
function startMatch(i){
  loadMap(i);
  fighters.length = 0; bullets.length = 0; grenades.length = 0; parts.length = 0; rings.length = 0; feed.length = 0;
  matchState.over = 0;
  player = new Fighter({ name: CONFIG.match.playerName, col: UNIFORMS[0], human: true });
  fighters.push(player);
  for (let k=0;k<CONFIG.match.bots;k++) fighters.push(new Fighter({ name: NAMES[k % NAMES.length], col: UNIFORMS[(k+1) % UNIFORMS.length], ai: true, skill: CONFIG.match.botSkill }));
  cam.x = player.x - 200; cam.y = player.y - 200;
  state = 'play';
}
const cam = { x: 0, y: 0 };
function resetMatch(){
  for (const f of fighters){ f.kills = 0; f.deaths = 0; f.spawn(); }
  matchState.over = 0; matchState.winner = '';
}

function updateCamera(dt){
  const vw = SW/scale, vh = CONFIG.viewH;
  const tx = player.x + player.w/2 - vw/2 + (player.dead ? 0 : Math.cos(player.aim)*40);
  const ty = player.y + player.h/2 - vh/2 + (player.dead ? 0 : Math.sin(player.aim)*20);
  const k = 1 - Math.pow(0.001, dt);
  cam.x += (tx - cam.x)*k; cam.y += (ty - cam.y)*k;
  cam.x = Math.max(0, Math.min(MW*T - vw, cam.x));
  cam.y = Math.max(0, Math.min(MH*T - vh, cam.y));
  shake = Math.max(0, shake - dt*30);
}

// ---------- render ----------
const RARITY = { smg:'#ffffff', ar:'#ffffff', shotgun:'#ffffff', sniper:'#4aa3ff', glauncher:'#4aa3ff', hmg:'#b266ff', rocket:'#b266ff', energy:'#b266ff', pistol:'#ffffff' };
function drawPickups(){
  ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
  for (const p of pickups){
    if (!p.active) continue;
    const bob = Math.sin(clock*3 + p.x)*2, x = p.x, y = p.y + bob;
    let fill, border, label;
    if (p.id === 'ammo'){ fill = '#2d6a2d'; border = '#7CFC00'; label = 'AMMO'; }
    else if (p.id === 'nade'){ fill = '#333'; border = '#ff6633'; label = 'GRN'; }
    else { fill = WEAPONS[p.id].col; border = RARITY[p.id]; label = WEAPONS[p.id].short; }
    ctx.fillStyle = fill; ctx.fillRect(x, y, p.w, p.h);
    ctx.strokeStyle = border; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, p.w, p.h);
    ctx.fillStyle = '#fff'; ctx.fillText(label, x+p.w/2, y-3);
  }
  const np = player.nearPickup;
  if (np && np.active){
    ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 2; ctx.strokeRect(np.x-3, np.y-3, np.w+6, np.h+6);
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#ffeb3b';
    ctx.fillText('E: ' + WEAPONS[np.id].name, np.x+np.w/2, np.y-16);
  }
}
function drawFighter(p){
  if (p.dead) return;
  if (p.protect > 0 && Math.floor(clock*12) % 2 === 0) return;
  const cx = p.x+p.w/2, cy = p.y+p.h/2, w = WEAPONS[p.slots[p.cur].id];
  if (p.jetting){
    ctx.fillStyle = '#ffb020';
    ctx.beginPath(); ctx.moveTo(cx-p.facing*10-4,cy+8); ctx.lineTo(cx-p.facing*10+4,cy+8);
    ctx.lineTo(cx-p.facing*10,cy+22+Math.random()*10); ctx.fill();
  }
  ctx.fillStyle = '#555'; ctx.fillRect(cx-p.facing*14-4, cy-8, 8, 18);
  ctx.fillStyle = p.dmgFlash > 0 ? '#ff6666' : p.col; ctx.fillRect(p.x, p.y+8, p.w, p.h-8);
  ctx.fillStyle = '#e8c39e'; ctx.fillRect(p.x+3, p.y, p.w-6, 10);
  ctx.fillStyle = '#222'; ctx.fillRect(p.x+2, p.y-2, p.w-4, 5);
  ctx.save(); ctx.translate(cx, cy-2); ctx.rotate(p.aim);
  if (p.facing < 0) ctx.scale(1, -1);
  ctx.rotate(-p.recoil*0.1);
  ctx.fillStyle = w.col; ctx.fillRect(0, -3, w.len - p.recoil*3, 6);
  if (p.flash > 0){ ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.arc(w.len+4, 0, 6, 0, 7); ctx.fill(); }
  ctx.restore();
  // name tag + kills badge + health
  ctx.font = 'bold 10px sans-serif';
  const kt = String(p.kills), tw = ctx.measureText(p.name).width, bw = 10 + kt.length*6, W = tw + bw + 10, X = cx - W/2, Y = p.y - 30;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; rr(X, Y, W, 14, 7);
  ctx.fillStyle = p.col; rr(X+1, Y+1, bw, 12, 6);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(kt, X+1+bw/2, Y+10.5);
  ctx.textAlign = 'left'; ctx.fillStyle = p.human ? '#ffeb3b' : '#ffffff'; ctx.fillText(p.name, X+bw+5, Y+10.5);
  ctx.fillStyle = '#0008'; ctx.fillRect(p.x-2, p.y-12, p.w+4, 4);
  ctx.fillStyle = '#2ecc71'; ctx.fillRect(p.x-2, p.y-12, (p.w+4)*Math.max(0,p.hp)/100, 4);
}
function drawHUD(){
  ctx.setTransform(1,0,0,1,0,0);
  const u = SH/540, pad = 16*u, d = window.devicePixelRatio||1, p = player;
  if (p.dmgFlash > 0){ ctx.fillStyle = 'rgba(255,0,0,' + (p.dmgFlash*0.6) + ')'; ctx.fillRect(0,0,SW,SH); }
  ctx.fillStyle='#0008'; ctx.fillRect(pad,pad,200*u,14*u);
  ctx.fillStyle='#e33'; ctx.fillRect(pad,pad,200*u*Math.max(0,p.hp)/100,14*u);
  ctx.fillStyle='#0008'; ctx.fillRect(pad,pad+20*u,200*u,10*u);
  ctx.fillStyle='#3af'; ctx.fillRect(pad,pad+20*u,200*u*p.fuel/CONFIG.jet.fuel,10*u);
  ctx.fillStyle='#fff'; ctx.font = 'bold ' + (16*u) + 'px sans-serif'; ctx.textAlign='left';
  ctx.fillText('K ' + p.kills + '   D ' + p.deaths, pad, pad+54*u);
  // kill feed
  ctx.font = 'bold ' + (13*u) + 'px sans-serif';
  for (let i=0;i<feed.length;i++){
    ctx.globalAlpha = Math.min(1, feed[i].t); ctx.fillText(feed[i].text, pad, pad+76*u + i*16*u);
  }
  ctx.globalAlpha = 1;
  // scoreboard (top 3)
  const top = fighters.slice().sort((a,b) => b.kills - a.kills).slice(0,3);
  ctx.textAlign = 'center'; ctx.font = 'bold ' + (13*u) + 'px sans-serif';
  for (let i=0;i<top.length;i++){
    ctx.fillStyle = top[i]===p ? '#ffeb3b' : '#fff';
    ctx.fillText((i+1) + '. ' + top[i].name + '  ' + top[i].kills, SW/2, pad + 12*u + i*16*u);
  }
  // weapon info
  const s = p.slots[p.cur], w = WEAPONS[s.id], inf = CONFIG.rules.infiniteAmmo;
  ctx.textAlign='right'; ctx.font = 'bold ' + (22*u) + 'px sans-serif'; ctx.fillStyle='#fff';
  ctx.fillText(p.reloadT>0 ? 'RELOADING...' : (w.name + '  ' + (inf?'INF':s.mag) + ' / ' + (inf?'INF':s.res)), SW-pad, pad+22*u);
  ctx.font = 'bold ' + (14*u) + 'px sans-serif';
  ctx.fillStyle = p.cur===0 ? '#ffeb3b' : '#bbb'; ctx.fillText('[1] ' + WEAPONS[p.slots[0].id].short, SW-pad-120*u, pad+44*u);
  ctx.fillStyle = p.cur===1 ? '#ffeb3b' : '#bbb'; ctx.fillText('[2] ' + WEAPONS[p.slots[1].id].short, SW-pad, pad+44*u);
  ctx.fillStyle = '#fff'; ctx.fillText('Grenades: ' + p.nades, SW-pad, pad+62*u);
  if (p.reloadT > 0){
    ctx.fillStyle='#0008'; ctx.fillRect(SW-pad-160*u, pad+68*u, 160*u, 6*u);
    ctx.fillStyle='#fff'; ctx.fillRect(SW-pad-160*u, pad+68*u, 160*u*(1 - p.reloadT/w.reload), 6*u);
  }
  if (popupT > 0){
    ctx.globalAlpha = Math.min(1, popupT); ctx.textAlign='center'; ctx.fillStyle='#fff';
    ctx.font = 'bold ' + (20*u) + 'px sans-serif'; ctx.fillText(popupText, SW/2, SH-40*u); ctx.globalAlpha = 1;
  }
  if (p.dead && !matchState.over){
    ctx.fillStyle = 'rgba(120,0,0,0.35)'; ctx.fillRect(0,0,SW,SH);
    ctx.fillStyle = '#fff'; ctx.textAlign='center'; ctx.font = 'bold ' + (34*u) + 'px sans-serif';
    ctx.fillText('YOU DIED', SW/2, SH/2 - 10*u);
    ctx.font = 'bold ' + (20*u) + 'px sans-serif';
    ctx.fillText('Respawn in ' + Math.ceil(Math.max(0,p.respawnT)), SW/2, SH/2 + 24*u);
  }
  if (matchState.over){
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0,0,SW,SH);
    ctx.fillStyle = '#ffeb3b'; ctx.textAlign='center'; ctx.font = 'bold ' + (36*u) + 'px sans-serif';
    ctx.fillText(matchState.winner + ' wins!', SW/2, SH/2);
  }
  for (let i=0;i<BTN.length;i++){
    const bp = btnPos(i);
    ctx.globalAlpha = btnFlash[i] > 0 ? 0.85 : 0.4;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bp.x*d, bp.y*d, bp.r*d, 0, 7); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.textAlign='center'; ctx.font = 'bold ' + (16*d) + 'px sans-serif';
    ctx.fillText(BTN[i].l, bp.x*d, bp.y*d + 6*d);
    if (btnFlash[i] > 0) btnFlash[i] -= 0.016;
  }
  for (const st of [stick.L, stick.R]) if (st.id !== null){
    const v = stickVec(st);
    ctx.globalAlpha=0.35; ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(st.ox*d, st.oy*d, STICK_R*d, 0, 7); ctx.fill();
    ctx.globalAlpha=0.7;
    ctx.beginPath(); ctx.arc((st.ox+v.x*STICK_R)*d, (st.oy+v.y*STICK_R)*d, 26*d, 0, 7); ctx.fill();
    ctx.globalAlpha=1;
  }
}
function render(){
  ctx.setTransform(1,0,0,1,0,0);
  const g = ctx.createLinearGradient(0,0,0,SH); g.addColorStop(0, mapDef.sky[0]); g.addColorStop(1, mapDef.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0,0,SW,SH);
  const sx = (Math.random()-0.5)*shake, sy = (Math.random()-0.5)*shake;
  ctx.setTransform(scale,0,0,scale,(-cam.x+sx)*scale,(-cam.y+sy)*scale);
  const vw = SW/scale, vh = CONFIG.viewH;
  const x0=Math.max(0,Math.floor(cam.x/T)), x1=Math.min(MW-1,Math.floor((cam.x+vw)/T));
  const y0=Math.max(0,Math.floor(cam.y/T)), y1=Math.min(MH-1,Math.floor((cam.y+vh)/T));
  for (let ty=y0; ty<=y1; ty++) for (let tx=x0; tx<=x1; tx++) if (map[ty*MW+tx]){
    ctx.fillStyle = solid(tx,ty-1) ? mapDef.dirt : mapDef.top; ctx.fillRect(tx*T,ty*T,T,T);
    ctx.fillStyle='#0002'; ctx.fillRect(tx*T,ty*T+T-3,T,3);
  }
  drawPickups();
  for (const gr of grenades){
    ctx.fillStyle = '#2f4f2f'; ctx.beginPath(); ctx.arc(gr.x, gr.y, 5, 0, 7); ctx.fill();
    if (Math.floor(gr.t*6) % 2 === 0){ ctx.fillStyle = '#f33'; ctx.beginPath(); ctx.arc(gr.x, gr.y-5, 2, 0, 7); ctx.fill(); }
  }
  for (const f of fighters) drawFighter(f);
  for (const b of bullets){
    const w = b.w;
    if (w.bounce !== undefined || w.exp){
      ctx.fillStyle = w.trail; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, 7); ctx.fill();
    } else {
      ctx.strokeStyle = w.trail; ctx.lineWidth = w.dmg > 50 ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x-b.vx*0.02,b.y-b.vy*0.02); ctx.stroke();
    }
  }
  for (const p of parts){
    ctx.globalAlpha = Math.max(0, p.life/p.max); ctx.fillStyle = p.col;
    ctx.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  for (const r of rings){
    const k = r.t/0.3; ctx.strokeStyle = 'rgba(255,200,80,' + (1-k) + ')'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r*k, 0, 7); ctx.stroke();
  }
  drawHUD();
}

// ---------- map menu ----------
function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.fill(); }
function menuRect(i){ const w = Math.min(280, innerWidth*0.42), h = 70, g = 14; return { x: innerWidth/2 - w - g/2 + (i%2)*(w+g), y: innerHeight*0.36 + Math.floor(i/2)*(h+g), w, h }; }
function menuTap(x, y){
  for (let i=0;i<MAPS.length;i++){ const r = menuRect(i); if (x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h){ startMatch(i); return; } }
}
function drawMenu(){
  const d = window.devicePixelRatio || 1;
  ctx.setTransform(d,0,0,d,0,0);
  const g = ctx.createLinearGradient(0,0,0,innerHeight); g.addColorStop(0,'#1d2b3a'); g.addColorStop(1,'#0e141b');
  ctx.fillStyle = g; ctx.fillRect(0,0,innerWidth,innerHeight);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffeb3b'; ctx.font = 'bold 34px sans-serif';
  ctx.fillText(CONFIG.gameName, innerWidth/2, innerHeight*0.2);
  ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
  ctx.fillText('Tap a map to start  -  ' + (CONFIG.match.bots+1) + ' fighters', innerWidth/2, innerHeight*0.28);
  MAPS.forEach((m, i) => {
    const r = menuRect(i);
    const gg = ctx.createLinearGradient(r.x, r.y, r.x, r.y+r.h); gg.addColorStop(0, m.sky[0]); gg.addColorStop(1, m.sky[1]);
    ctx.fillStyle = gg; rr(r.x, r.y, r.w, r.h, 12);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; rr(r.x, r.y, r.w, r.h, 12);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.fillText(m.name, r.x+14, r.y+30);
    ctx.font = '12px sans-serif'; ctx.fillText(m.desc + '  (' + m.w + 'x' + m.h + ')', r.x+14, r.y+52);
  });
}

// ---------- loop ----------
let last = performance.now();
function loop(now){
  const dt = Math.min(0.033, (now-last)/1000); last = now; clock += dt;
  if (state === 'menu'){ drawMenu(); requestAnimationFrame(loop); return; }
  if (popupT > 0) popupT -= dt;
  if (matchState.over > 0){ matchState.over -= dt; if (matchState.over <= 0) resetMatch(); }
  for (const f of fighters) f.update(dt, cam);
  updateBullets(dt); updateGrenades(dt); updatePickups(dt); updateParts(dt); updateCamera(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
