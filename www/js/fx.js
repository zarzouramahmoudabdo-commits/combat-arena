const PU = {
  health: { name:'+50 Health',  short:'HEAL', col:'#2ecc71' },
  shield: { name:'Shield +50',  short:'SHLD', col:'#3498db' },
  speed:  { name:'Speed Boost', short:'SPD',  col:'#f1c40f' },
  damage: { name:'Damage x1.5', short:'DMG',  col:'#e74c3c' }
};
const nums = [], props = [];
const BANNER = { t:0, text:'' };
function banner(t){ BANNER.text = t; BANNER.t = 2.2; }

// ---------- floating damage numbers (only for hits you give or take) ----------
function dmgNumber(x, y, d, head, owner, f){
  if (!player || (owner !== player && f !== player)) return;
  if (nums.length > 30) nums.shift();
  nums.push({ x: x + (Math.random()-0.5)*8, y: y - 8, t: 0.9, txt: Math.round(d) + (head ? '!' : ''), head,
              col: f === player ? '#ff8080' : (head ? '#ff4040' : '#ffeb3b') });
}
function drawNums(){
  ctx.textAlign = 'center';
  for (const n of nums){
    ctx.globalAlpha = Math.min(1, n.t*2); ctx.font = 'bold ' + (n.head ? 16 : 11) + 'px sans-serif';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(n.txt, n.x, n.y);
    ctx.fillStyle = n.col; ctx.fillText(n.txt, n.x, n.y);
  }
  ctx.globalAlpha = 1;
}

// ---------- kill streaks / multi kills / headshots ----------
function killFx(by, v){
  by.streak = (by.streak || 0) + 1;
  by.multi = (clock - (by.lastKillT || -99) < 4) ? (by.multi || 0) + 1 : 1;
  by.lastKillT = clock;
  const head = by.lastHead; by.lastHead = false;
  if (by !== player) return;
  const lines = [];
  if (head) lines.push('HEADSHOT!');
  if (by.multi === 2) lines.push('DOUBLE KILL'); else if (by.multi === 3) lines.push('TRIPLE KILL'); else if (by.multi >= 4) lines.push('MULTI KILL x' + by.multi);
  const S = { 3:'KILLING SPREE', 5:'RAMPAGE', 7:'UNSTOPPABLE', 10:'LEGENDARY' };
  if (S[by.streak]) lines.push(S[by.streak]);
  if (lines.length){ banner(lines.join('  -  ')); sfxTone('ui', 500, 1000, 0.2, 0.4, 'square'); }
}
function updateFx(dt){
  if (BANNER.t > 0) BANNER.t -= dt;
  for (let i=nums.length-1;i>=0;i--){ const n = nums[i]; n.t -= dt; n.y -= 36*dt; if (n.t <= 0) nums.splice(i,1); }
  for (const p of props) if (p.flash > 0) p.flash -= dt;
}
function drawFxHUD(d){
  if (!player) return;
  const u = SH/540, pad = 16*u;
  if (player.shield > 0){ ctx.fillStyle = '#3498db'; ctx.fillRect(pad, pad-5*u, 200*u*Math.min(1, player.shield/50), 4*u); }
  let t = '';
  if (player.speedT > 0) t += 'SPEED ' + Math.ceil(player.speedT) + 's  ';
  if (player.dmgT > 0) t += 'DAMAGE ' + Math.ceil(player.dmgT) + 's';
  if (t){ ctx.fillStyle = '#ffeb3b'; ctx.textAlign = 'left'; ctx.font = 'bold ' + (12*u) + 'px sans-serif'; ctx.fillText(t, pad+210*u, pad+12*u); }
  if (BANNER.t > 0){
    const s = 1 + Math.max(0, BANNER.t - 1.9)*3;
    ctx.globalAlpha = Math.min(1, BANNER.t); ctx.textAlign = 'center'; ctx.font = 'bold ' + (30*u*s) + 'px sans-serif';
    ctx.lineWidth = 5*u; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(BANNER.text, SW/2, SH*0.3);
    ctx.fillStyle = '#ffeb3b'; ctx.fillText(BANNER.text, SW/2, SH*0.3); ctx.globalAlpha = 1;
  }
}

// ---------- power-up icons on the ground ----------
function drawPowerItem(k, cx, cy){
  ctx.fillStyle = PU[k].col; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 7); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 1.5;
  if (k === 'health'){ ctx.fillRect(cx-1.5, cy-5, 3, 10); ctx.fillRect(cx-5, cy-1.5, 10, 3); }
  else if (k === 'shield'){ ctx.beginPath(); ctx.moveTo(cx-5, cy-5); ctx.lineTo(cx+5, cy-5); ctx.lineTo(cx+5, cy+1); ctx.lineTo(cx, cy+6); ctx.lineTo(cx-5, cy+1); ctx.closePath(); ctx.fill(); }
  else if (k === 'speed'){ ctx.beginPath(); ctx.moveTo(cx+2, cy-6); ctx.lineTo(cx-4, cy+1); ctx.lineTo(cx, cy+1); ctx.lineTo(cx-2, cy+6); ctx.lineTo(cx+4, cy-1); ctx.lineTo(cx, cy-1); ctx.closePath(); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(cx, cy-6); ctx.lineTo(cx+5, cy+4); ctx.lineTo(cx-5, cy+4); ctx.closePath(); ctx.fill(); }
}

// ---------- barrels and crates (shootable cover; you walk through them) ----------
function spawnProps(){
  props.length = 0; nums.length = 0;
  const all = mapDef.rects.concat([[2, MH-2, MW-4, 1]]);
  all.forEach((r, i) => {
    if (r[2] < 6 || (i % 2 === 1 && r[2] < 30)) return;
    const n = Math.max(2, Math.floor(r[2]/20));
    for (let j=0;j<n;j++){
      const tx = Math.floor(r[0] + r[2]*(j+0.5)/n);
      if (solid(tx, r[1]-1) || solid(tx, r[1]-2)) continue;
      const barrel = ((tx*31 + i) % 3) !== 0, w = barrel ? 18 : 24, h = barrel ? 26 : 24;
      props.push({ type: barrel ? 'barrel' : 'crate', x: tx*T + 16 - w/2, y: r[1]*T - h, w, h, hp: barrel ? 40 : 60, flash: 0 });
    }
  });
}
function drawProps(){
  for (const p of props){
    const fl = p.flash > 0;
    if (p.type === 'barrel'){
      ctx.fillStyle = fl ? '#ffffff' : '#b8372a'; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(p.x, p.y+5, p.w, 3); ctx.fillRect(p.x, p.y+p.h-8, p.w, 3);
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(p.x+p.w/2-3, p.y+10, 6, 6);
      ctx.strokeStyle = '#fbfaf1'; ctx.lineWidth = 1.5; ctx.strokeRect(p.x, p.y, p.w, p.h);
    } else {
      ctx.fillStyle = fl ? '#ffffff' : '#a77b45'; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2; ctx.strokeRect(p.x+1, p.y+1, p.w-2, p.h-2);
      ctx.beginPath(); ctx.moveTo(p.x+2, p.y+2); ctx.lineTo(p.x+p.w-2, p.y+p.h-2); ctx.moveTo(p.x+p.w-2, p.y+2); ctx.lineTo(p.x+2, p.y+p.h-2); ctx.stroke();
    }
  }
}
function hurtProp(p, d, owner){
  p.hp -= d; p.flash = 0.08;
  if (p.hp > 0) return;
  const i = props.indexOf(p); if (i >= 0) props.splice(i, 1);
  const cx = p.x + p.w/2, cy = p.y + p.h/2;
  if (p.type === 'barrel') explode(cx, cy, { r:105, dmg:80, knock:550 }, owner);
  else {
    spawnParts(cx, cy, 14, '#a77b45', 220, 0.6, 4);
    addPickup(cx-9, p.y+p.h-12, Math.random() < 0.4 ? 'pu_health' : rollItem(false), { temp:true, life:20 });
  }
}
function hitProp(b, x, y){
  for (const p of props) if (x > p.x && x < p.x+p.w && y > p.y && y < p.y+p.h){
    if (!b.w.exp) hurtProp(p, b.w.dmg * (b.owner && b.owner.dmgT > 0 ? 1.5 : 1), b.owner);
    return true;
  }
  return false;
}
function damagePropsAt(x, y, r, dmg, owner){
  for (const p of props.slice()){
    const d = Math.hypot(p.x+p.w/2-x, p.y+p.h/2-y);
    if (d < r) hurtProp(p, dmg*(1-d/r) + 10, owner);
  }
}
