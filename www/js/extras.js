// ---------- grenade types ----------
const NADE = {
  frag: { name:'Frag',     short:'FRAG', col:'#3f7a3f', edge:'#9be37a' },
  gas:  { name:'Tear Gas', short:'GAS',  col:'#c9b21c', edge:'#fff176' },
  mine: { name:'Mine',     short:'MINE', col:'#b5442a', edge:'#ff8a65' }
};
const NTYPES = ['frag','gas','mine'];

function updateMines(dt){
  for (let i=mines.length-1;i>=0;i--){
    const m = mines[i]; m.arm -= dt; m.life -= dt;
    if (m.life <= 0){ mines.splice(i,1); continue; }
    if (m.arm > 0) continue;
    for (const f of fighters){
      if (f.dead || f === m.owner) continue;
      if (Math.abs(f.x+f.w/2-m.x) < 26 && Math.abs(f.y+f.h-m.y) < 30){
        explode(m.x, m.y-8, { r:85, dmg:95, knock:480 }, m.owner); mines.splice(i,1); break;
      }
    }
  }
}
function updateClouds(dt){
  for (let i=clouds.length-1;i>=0;i--){
    const c = clouds[i]; c.t -= dt;
    if (c.t <= 0){ clouds.splice(i,1); continue; }
    for (const f of fighters){
      if (f.dead) continue;
      if (Math.hypot(f.x+f.w/2-c.x, f.y+f.h/2-c.y) < c.r){ f.gas = 0.5; f.takeDamage(9*dt, c.owner); }
    }
  }
}
function drawWorldExtras(){
  for (const c of clouds){
    const a = Math.min(1, c.t/1.5)*0.3;
    for (let k=0;k<3;k++){
      const ox = Math.cos(clock*0.8+k*2.1)*c.r*0.25, oy = Math.sin(clock*0.7+k*1.7)*c.r*0.2;
      ctx.fillStyle = 'rgba(205,220,57,' + a + ')'; ctx.beginPath(); ctx.arc(c.x+ox, c.y+oy, c.r*(0.75+0.1*k), 0, 7); ctx.fill();
    }
  }
  for (const m of mines){
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(m.x-8, m.y-4, 16, 4);
    ctx.fillStyle = '#6b6b6b'; ctx.fillRect(m.x-5, m.y-7, 10, 3);
    ctx.fillStyle = (m.arm <= 0 && Math.floor(clock*3) % 2 === 0) ? '#ff3030' : '#661111'; ctx.fillRect(m.x-1, m.y-9, 2, 2);
  }
}
function drawGas(d){
  if (player && player.gas > 0){ ctx.fillStyle = 'rgba(205,220,57,0.25)'; ctx.fillRect(0, 0, SW, SH); }
}

// ---------- weapon bar (tap a weapon to equip it) ----------
function weaponBarRects(){
  const n = player.slots.length, w = 78, h = 40, g = 6, tot = n*w + (n-1)*g, x0 = innerWidth/2 - tot/2, y = innerHeight - h - 12;
  return player.slots.map((s, i) => ({ x: x0 + i*(w+g), y, w, h }));
}
function weaponBarTap(x, y){
  if (!player || player.dead || state !== 'play') return false;
  const rs = weaponBarRects();
  for (let i=0;i<rs.length;i++){ const r = rs[i]; if (x >= r.x && x <= r.x+r.w && y >= r.y && y <= r.y+r.h){ player.switchTo(i); return true; } }
  return false;
}
function drawWeaponBar(d){
  if (!player || player.dead) return;
  weaponBarRects().forEach((r, i) => {
    const w = WEAPONS[player.slots[i].id], on = i === player.cur;
    ctx.globalAlpha = 0.9; ctx.fillStyle = on ? '#ffeb3b' : 'rgba(0,0,0,0.55)'; rr(r.x*d, r.y*d, r.w*d, r.h*d, 8*d);
    ctx.globalAlpha = 1; ctx.save(); ctx.translate((r.x+14)*d, (r.y+14)*d); ctx.scale(1.5*d, 1.5*d); drawGun(player.slots[i].id); ctx.restore();
    ctx.fillStyle = on ? '#000' : '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold ' + (11*d) + 'px sans-serif';
    ctx.fillText(w.short, (r.x+r.w/2)*d, (r.y+r.h-7)*d);
    ctx.textAlign = 'right'; ctx.fillText(String(i+1), (r.x+r.w-6)*d, (r.y+13)*d);
  });
}

// ---------- grenade dial (drag around the circle to pick a type, tap to cycle) ----------
const DIAL = { id:null, sx:0, sy:0, moved:false };
function dialPos(){ const b = btnPos(1); return { x: b.x, y: b.y + 66*SET.btnScale, r: 30*SET.btnScale }; }
function cycleNade(){
  if (!player) return;
  const i = NTYPES.indexOf(player.nadeType);
  for (let s=1;s<=3;s++){ const ty = NTYPES[(i+s) % 3]; if (player.nades[ty] > 0){ player.nadeType = ty; break; } }
}
function dialStart(t){
  if (!player || player.dead || state !== 'play') return false;
  const d = dialPos();
  if (Math.hypot(t.clientX-d.x, t.clientY-d.y) > d.r+8) return false;
  DIAL.id = t.identifier; DIAL.sx = t.clientX; DIAL.sy = t.clientY; DIAL.moved = false; return true;
}
function dialMove(t){
  if (DIAL.id !== t.identifier || !player) return;
  const d = dialPos(), dx = t.clientX-d.x, dy = t.clientY-d.y;
  if (Math.hypot(t.clientX-DIAL.sx, t.clientY-DIAL.sy) > 8) DIAL.moved = true;
  if (DIAL.moved && Math.hypot(dx, dy) > 10){
    const a = (Math.atan2(dy, dx) + Math.PI/2 + 2*Math.PI) % (2*Math.PI);
    const ty = NTYPES[Math.floor(a/(2*Math.PI/3)) % 3];
    if (player.nades[ty] > 0) player.nadeType = ty;
  }
}
function dialEnd(t){
  if (DIAL.id !== t.identifier) return;
  if (!DIAL.moved) cycleNade();
  DIAL.id = null;
}
function drawDial(d){
  if (!player || player.dead) return;
  const p = dialPos(), X = p.x*d, Y = p.y*d, R = p.r*d;
  ctx.globalAlpha = Math.min(1, SET.btnOpacity+0.35); ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.arc(X, Y, R, 0, 7); ctx.fill();
  NTYPES.forEach((ty, i) => {
    const a0 = -Math.PI/2 + i*2*Math.PI/3 + 0.1, a1 = a0 + 2*Math.PI/3 - 0.2, on = player.nadeType === ty, has = player.nades[ty] > 0;
    ctx.globalAlpha = has ? 1 : 0.3; ctx.strokeStyle = NADE[ty].col; ctx.lineWidth = (on ? 9 : 5)*d;
    ctx.beginPath(); ctx.arc(X, Y, R*0.74, a0, a1); ctx.stroke();
    const am = (a0+a1)/2; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold ' + (10*d) + 'px sans-serif';
    ctx.fillText(player.nades[ty], X + Math.cos(am)*R*0.74, Y + Math.sin(am)*R*0.74 + 3*d);
  });
  ctx.globalAlpha = 1; ctx.fillStyle = NADE[player.nadeType].col; ctx.beginPath(); ctx.arc(X, Y, R*0.3, 0, 7); ctx.fill();
}

// ---------- map look (beige / olive, white outlines, pebble edges) ----------
const LOOK = [
  { sky:['#8e8e72','#aba98c'], dirt:'#c9c1a2', top:'#d9d2b6', edge:'#fbfaf1', stone:'#d6d3c4' },
  { sky:['#7b8f6b','#a9ba91'], dirt:'#a8b88e', top:'#bccaa2', edge:'#f4f7e9', stone:'#d5dcc4' },
  { sky:['#5e6c79','#8695a2'], dirt:'#a2b3c0', top:'#b8c8d4', edge:'#eff7fb', stone:'#cfdbe3' },
  { sky:['#b59b6f','#d4c095'], dirt:'#dac491', top:'#e8d6a8', edge:'#fff9e8', stone:'#eadfc2' }
];
MAPS.forEach((m, i) => Object.assign(m, LOOK[i]));

function drawTerrain(x0, x1, y0, y1){
  const L = mapDef, peb = [];
  ctx.fillStyle = L.dirt;
  for (let ty=y0; ty<=y1; ty++) for (let tx=x0; tx<=x1; tx++) if (map[ty*MW+tx]) ctx.fillRect(tx*T, ty*T, T+0.5, T+0.5);
  ctx.fillStyle = L.top;
  for (let ty=y0; ty<=y1; ty++) for (let tx=x0; tx<=x1; tx++) if (map[ty*MW+tx] && !solid(tx, ty-1)) ctx.fillRect(tx*T, ty*T, T+0.5, 9);
  ctx.strokeStyle = L.edge; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
  for (let ty=y0; ty<=y1; ty++) for (let tx=x0; tx<=x1; tx++) if (map[ty*MW+tx]){
    const px = tx*T, py = ty*T, h = ((tx*73856093) ^ (ty*19349663)) >>> 0;
    if (!solid(tx, ty-1)){ ctx.moveTo(px, py); ctx.lineTo(px+T, py); if (h % 3 === 0) peb.push(px+8+(h%16), py-3, 3+(h%3)); }
    if (!solid(tx, ty+1)){ ctx.moveTo(px, py+T); ctx.lineTo(px+T, py+T); if (h % 4 === 0) peb.push(px+10+(h%12), py+T+3, 3+(h%2)); }
    if (!solid(tx-1, ty)){ ctx.moveTo(px, py); ctx.lineTo(px, py+T); if (h % 3 === 1) peb.push(px-3, py+8+(h%16), 3); }
    if (!solid(tx+1, ty)){ ctx.moveTo(px+T, py); ctx.lineTo(px+T, py+T); if (h % 3 === 2) peb.push(px+T+3, py+8+(h%16), 3); }
  }
  ctx.stroke(); ctx.lineCap = 'butt';
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let ty=y0; ty<=y1; ty++) for (let tx=x0; tx<=x1; tx++) if (map[ty*MW+tx] && !solid(tx, ty-1)){ ctx.moveTo(tx*T+2, ty*T+6); ctx.lineTo(tx*T+T-2, ty*T+6); }
  ctx.stroke();
  ctx.fillStyle = L.stone; ctx.strokeStyle = L.edge; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i=0;i<peb.length;i+=3){ ctx.moveTo(peb[i]+peb[i+2], peb[i+1]); ctx.arc(peb[i], peb[i+1], peb[i+2], 0, 7); }
  ctx.fill(); ctx.stroke();
}
