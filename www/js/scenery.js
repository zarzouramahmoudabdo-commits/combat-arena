const hash2 = (a, b) => ((a*73856093) ^ (b*19349663)) >>> 0;

const THEME = [
  { theme:'base',   sky:['#7fa7c9','#d6e4ea'], dirt:'#8a6b49', top:'#6f9a3a', rock:'#5d4b36', edge:'rgba(0,0,0,0.35)' },
  { theme:'jungle', sky:['#6fb58a','#d5eec3'], dirt:'#6b4a2c', top:'#2f9a3b', rock:'#4a3420', edge:'rgba(0,0,0,0.4)' },
  { theme:'lab',    sky:['#16222e','#2c4558'], dirt:'#55687a', top:'#8fdcf0', rock:'#364555', edge:'rgba(0,0,0,0.45)' },
  { theme:'desert', sky:['#f0c47a','#fbe9c6'], dirt:'#c9a266', top:'#e6cc90', rock:'#a07c45', edge:'rgba(0,0,0,0.3)' }
];
MAPS.forEach((m, i) => Object.assign(m, THEME[i]));

const DECOR = {
  base:   ['pine','bush','rock','tires','sandbags','jeep','tent','fence','sign','pine'],
  jungle: ['jtree','palm','bush','fern','rock','log','jtree','palm'],
  lab:    ['terminal','tube','lamp','pipe','terminal','tube'],
  desert: ['cactus','column','rock','cactus','jeep','tires','tent','column']
};
const COVERS = { base:['sandbags','barrier','tires'], jungle:['log','boulder','tires'], lab:['barrier','barrier'], desert:['sandbags','boulder','tires'] };
const CSIZE = { sandbags:[48,18], tires:[26,27], barrier:[36,20], log:[48,12], boulder:[32,20] };
const decor = [];

// ---------- scenery models ----------
function drawDecorItem(d){
  ctx.save(); ctx.translate(d.x, d.y); ctx.scale(d.s, d.s);
  switch (d.k){
    case 'pine':
      ctx.fillStyle = '#5a3d22'; ctx.fillRect(-3, -14, 6, 14);
      for (let i=0;i<3;i++){ ctx.fillStyle = i === 1 ? '#2f6b2f' : '#2a5f2a'; ctx.beginPath(); ctx.moveTo(-17+i*3, -12-i*16); ctx.lineTo(0, -36-i*16); ctx.lineTo(17-i*3, -12-i*16); ctx.fill(); }
      break;
    case 'jtree':
      ctx.fillStyle = '#4e3520'; ctx.fillRect(-4, -40, 8, 40);
      ctx.fillStyle = '#2a7a35'; for (const c of [[0,-54,26],[-18,-42,18],[18,-42,18]]){ ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, 7); ctx.fill(); }
      ctx.fillStyle = '#44b050'; ctx.beginPath(); ctx.arc(-6, -60, 12, 0, 7); ctx.fill(); break;
    case 'palm':
      ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -30, 2, -62); ctx.stroke();
      ctx.strokeStyle = '#3c9a3c'; ctx.lineWidth = 4;
      for (const a of [-2.6,-2,-1.4,-0.7,0,0.7]){ ctx.beginPath(); ctx.moveTo(2, -62); ctx.quadraticCurveTo(2+Math.cos(a)*18, -62+Math.sin(a)*18-10, 2+Math.cos(a)*36, -62+Math.sin(a)*30+8); ctx.stroke(); }
      break;
    case 'bush':
      for (const c of [[-9,-8,9,'#3f8a3a'],[0,-12,11,'#4ea04a'],[9,-8,9,'#3f8a3a']]){ ctx.fillStyle = c[3]; ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, 7); ctx.fill(); }
      break;
    case 'fern':
      ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 3;
      for (let a=-1.3;a<=1.3;a+=0.43){ ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.sin(a)*14, -18, Math.sin(a)*26, -14+Math.abs(a)*8); ctx.stroke(); }
      break;
    case 'rock': case 'boulder':
      ctx.fillStyle = '#8d8d86'; ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-13, -12); ctx.lineTo(-2, -19); ctx.lineTo(10, -14); ctx.lineTo(17, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#a9a9a1'; ctx.beginPath(); ctx.moveTo(-13, -12); ctx.lineTo(-2, -19); ctx.lineTo(2, -9); ctx.lineTo(-8, -5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-13, -12); ctx.lineTo(-2, -19); ctx.lineTo(10, -14); ctx.lineTo(17, 0); ctx.stroke();
      break;
    case 'tires':
      rrc(-13, -9, 26, 9, 4, '#1c1c1c'); rrc(-12, -8, 24, 3, 2, '#3d3d3d'); rrc(-13, -18, 26, 9, 4, '#222222'); rrc(-12, -17, 24, 3, 2, '#454545'); rrc(-9, -27, 18, 9, 4, '#1c1c1c'); rrc(-8, -26, 16, 3, 2, '#3d3d3d');
      break;
    case 'sandbags':
      for (let i=0;i<3;i++){ rrc(-24+i*16, -9, 18, 9, 4, '#c8b27a'); rrc(-23+i*16, -8, 16, 3, 2, '#dcc68d'); }
      for (let i=0;i<2;i++){ rrc(-16+i*16, -18, 18, 9, 4, '#bfa86f'); rrc(-15+i*16, -17, 16, 3, 2, '#d3bd84'); }
      break;
    case 'barrier':
      ctx.fillStyle = '#b9b9b2'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-13, -20); ctx.lineTo(13, -20); ctx.lineTo(18, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c0392b'; ctx.fillRect(-15, -14, 30, 5); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(-13, -20, 26, 20);
      break;
    case 'log':
      rrc(-24, -10, 48, 10, 5, '#6b4a2b'); ctx.fillStyle = '#a77b45'; ctx.beginPath(); ctx.arc(22, -5, 5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#4a321c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-20, -6); ctx.lineTo(14, -6); ctx.stroke(); break;
    case 'jeep':
      rrc(-30, -18, 60, 12, 3, '#6b5a3a'); rrc(-14, -31, 30, 14, 3, '#5d4d30'); ctx.fillStyle = '#1d1d1d'; ctx.fillRect(-10, -28, 10, 8); ctx.fillRect(4, -28, 10, 8);
      for (const wx of [18]){ ctx.fillStyle = '#111111'; ctx.beginPath(); ctx.arc(wx, -6, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#555555'; ctx.beginPath(); ctx.arc(wx, -6, 3, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-30, -10, 22, 4); break;
    case 'tent':
      ctx.fillStyle = '#6b7a4a'; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(0, -34); ctx.lineTo(26, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3d4a2a'; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(0, -18); ctx.lineTo(7, 0); ctx.closePath(); ctx.fill(); break;
    case 'fence':
      ctx.fillStyle = '#6b5538'; for (let i=0;i<4;i++) ctx.fillRect(-24+i*16, -18, 3, 18);
      ctx.fillRect(-24, -14, 51, 2); ctx.fillRect(-24, -7, 51, 2); break;
    case 'sign':
      ctx.fillStyle = '#555555'; ctx.fillRect(-1, -30, 3, 30); rrc(-10, -34, 20, 14, 3, '#c0392b'); ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, -28, 12, 3); break;
    case 'terminal':
      rrc(-10, -22, 20, 22, 3, '#2b3947'); ctx.fillStyle = (Math.floor(clock*2) % 3 === 0) ? '#7be8ff' : '#27d3ff'; ctx.fillRect(-7, -19, 14, 9);
      ctx.fillStyle = '#9fb3c4'; ctx.fillRect(-7, -7, 14, 2); break;
    case 'tube':
      rrc(-8, -40, 16, 40, 8, 'rgba(155,228,255,0.45)'); rrc(-6, -30, 12, 28, 6, 'rgba(53,224,161,0.6)'); ctx.fillStyle = '#334455'; ctx.fillRect(-10, -4, 20, 4); ctx.fillRect(-10, -42, 20, 3); break;
    case 'lamp':
      ctx.fillStyle = '#444444'; ctx.fillRect(-1, -50, 3, 50); rrc(-8, -56, 16, 7, 3, '#555555');
      ctx.fillStyle = 'rgba(255,246,160,0.16)'; ctx.beginPath(); ctx.arc(0, -46, 30, 0, 7); ctx.fill(); break;
    case 'pipe':
      ctx.fillStyle = '#6f7f8c'; ctx.fillRect(-30, -14, 60, 6); ctx.fillStyle = '#4a5864'; ctx.fillRect(-12, -16, 4, 10); ctx.fillRect(10, -16, 4, 10); break;
    case 'cactus':
      rrc(-4, -40, 8, 40, 4, '#3a8a4a'); rrc(-14, -26, 12, 5, 2, '#3a8a4a'); rrc(-14, -33, 5, 12, 2, '#3a8a4a'); rrc(2, -22, 12, 5, 2, '#3a8a4a'); rrc(9, -30, 5, 12, 2, '#3a8a4a'); break;
    case 'column':
      rrc(-8, -44, 16, 44, 2, '#c9b17a'); ctx.fillStyle = '#b79f68'; ctx.fillRect(-3, -44, 2, 44); ctx.fillRect(3, -44, 2, 44);
      ctx.fillStyle = '#c9b17a'; ctx.fillRect(-11, -4, 22, 4); break;
  }
  ctx.restore();
}
function rrc(x, y, w, h, r, c){ ctx.fillStyle = c; rr(x, y, w, h, r); }

// ---------- terrain with a natural skin (collision is still tile based) ----------
function drawTerrain(x0, x1, y0, y1){
  const L = mapDef, lab = L.theme === 'lab';
  for (let ty=y0; ty<=y1; ty++) for (let tx=x0; tx<=x1; tx++){
    if (!map[ty*MW+tx]) continue;
    const px = tx*T, py = ty*T, h = hash2(tx, ty);
    ctx.fillStyle = L.dirt; ctx.fillRect(px, py, T+0.5, T+0.5);
    ctx.fillStyle = (h & 1) ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(px + (h%22), py + ((h>>5)%22), 5 + (h%6), 3 + ((h>>9)%3));
    if (solid(tx, ty-1) && solid(tx, ty-2)){ ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(px, py, T+0.5, T+0.5); }
    if (lab){
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1; ctx.strokeRect(px+0.5, py+0.5, T-1, T-1);
      ctx.fillStyle = '#9fb3c4'; ctx.fillRect(px+3, py+3, 2, 2); ctx.fillRect(px+T-5, py+3, 2, 2);
    }
  }
  const cap = new Path2D(), tuft = new Path2D(), rock = new Path2D(), out = new Path2D();
  for (let ty=y0; ty<=y1; ty++) for (let tx=x0; tx<=x1; tx++){
    if (!map[ty*MW+tx]) continue;
    const px = tx*T, py = ty*T, h = hash2(tx, ty);
    if (!solid(tx, ty-1)){
      if (lab) cap.rect(px, py, T+0.5, 4);
      else {
        cap.moveTo(px, py+9);
        for (let i=0;i<=4;i++){ const x = px + i*8; cap.lineTo(x, py - 2 + Math.sin(x*0.28 + ty)*2); }
        cap.lineTo(px+T+0.5, py+9); cap.closePath();
        for (let k=0;k<3;k++){
          const x = px + 5 + k*10 + ((h>>(k*3))%4), hh = 4 + ((h>>(k*2+1))%5);
          tuft.moveTo(x-2, py+1); tuft.lineTo(x, py-hh); tuft.lineTo(x+2, py+1);
        }
      }
    }
    if (!solid(tx, ty+1)){
      for (let k=0;k<3;k++){ const x = px + 5 + k*11, hh = 4 + (hash2(tx+k, ty) % 8); rock.moveTo(x-5, py+T-1); rock.lineTo(x, py+T+hh); rock.lineTo(x+5, py+T-1); }
      out.moveTo(px, py+T); out.lineTo(px+T, py+T);
    }
    if (!solid(tx-1, ty)){ rock.moveTo(px+1, py+4); rock.lineTo(px-5-(h%3), py+15); rock.lineTo(px+1, py+26); out.moveTo(px, py); out.lineTo(px, py+T); }
    if (!solid(tx+1, ty)){ rock.moveTo(px+T-1, py+4); rock.lineTo(px+T+5+(h%3), py+15); rock.lineTo(px+T-1, py+26); out.moveTo(px+T, py); out.lineTo(px+T, py+T); }
  }
  ctx.fillStyle = L.rock; ctx.fill(rock);
  ctx.fillStyle = L.top; ctx.fill(cap); ctx.fill(tuft);
  ctx.strokeStyle = L.edge; ctx.lineWidth = 2; ctx.stroke(out);
  // scenery models
  for (const d of decor) if (d.x > x0*T - 60 && d.x < (x1+1)*T + 60) drawDecorItem(d);
}

// ---------- parallax backdrop ----------
function drawBackdrop(){
  const L = mapDef, th = L.theme, vw = SW/scale, vh = CONFIG.viewH;
  const cf = cam.y / Math.max(1, MH*T - vh), dy = (0.5 - cf)*26;
  const ridge = (f, base, amp, color, seed) => {
    ctx.setTransform(scale, 0, 0, scale, -cam.x*f*scale, 0);
    const a = cam.x*f - 40, b = cam.x*f + vw + 40, step = 24;
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(a, vh+10);
    for (let x = Math.floor(a/step)*step; x <= b; x += step)
      ctx.lineTo(x, base + dy - amp*(0.5 + 0.5*Math.sin(x*0.004+seed)) - amp*0.5*Math.sin(x*0.011+seed*2) - amp*0.25*Math.sin(x*0.029+seed*3));
    ctx.lineTo(b, vh+10); ctx.closePath(); ctx.fill();
  };
  const scatter = (f, base, gap, fn) => {
    ctx.setTransform(scale, 0, 0, scale, -cam.x*f*scale, 0);
    const a = cam.x*f - gap, b = cam.x*f + vw + gap;
    for (let i = Math.floor(a/gap); i*gap <= b; i++){ const h = hash2(i, 11); fn(i*gap + (h%gap)*0.6, base + dy, h); }
  };
  const clouds = (alpha) => {
    const f = 0.12, drift = clock*6;
    ctx.setTransform(scale, 0, 0, scale, -cam.x*f*scale, 0);
    for (let i = Math.floor((cam.x*f - drift - 300)/320); i <= Math.floor((cam.x*f + vw - drift)/320); i++){
      const h = hash2(i, 7), x = i*320 + (h%200) + drift, y = 40 + ((h>>3)%120);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      for (let k=0;k<4;k++){ ctx.beginPath(); ctx.arc(x + k*26, y + (k%2)*6, 22 + ((k === 1 || k === 2) ? 8 : 0), 0, 7); ctx.fill(); }
    }
  };
  if (th === 'base'){
    clouds(0.7); ridge(0.18, vh*0.62, 80, '#9bb3c6', 1); ridge(0.35, vh*0.78, 50, '#7f9a86', 2.2);
    scatter(0.55, vh*0.9, 380, (x, y, h) => { ctx.fillStyle = '#4f5d66'; ctx.fillRect(x, y-60-(h%40), 26, 60+(h%40)); ctx.fillRect(x+10, y-90-(h%40), 3, 30); ctx.fillStyle = '#ffd27a'; ctx.fillRect(x+6, y-48, 4, 4); });
    ridge(0.7, vh*0.97, 30, '#5f7f5a', 3.5);
  } else if (th === 'jungle'){
    clouds(0.5); ridge(0.15, vh*0.6, 90, '#86b79a', 4); ridge(0.3, vh*0.76, 60, '#5f9a72', 5);
    scatter(0.5, vh*0.98, 70, (x, y, h) => { ctx.fillStyle = '#3a2a18'; ctx.fillRect(x-4, y-70-(h%30), 8, 70+(h%30)); ctx.fillStyle = '#2a6b3a'; ctx.beginPath(); ctx.arc(x, y-78-(h%30), 28+(h%14), 0, 7); ctx.fill(); });
    scatter(0.75, vh*1.02, 46, (x, y, h) => { ctx.fillStyle = '#1f5230'; ctx.fillRect(x-3, y-50, 6, 50); ctx.beginPath(); ctx.arc(x, y-56, 20+(h%10), 0, 7); ctx.fill(); });
  } else if (th === 'lab'){
    scatter(0.25, vh*0.7, 220, (x, y, h) => {
      ctx.fillStyle = 'rgba(15,28,40,0.9)'; ctx.fillRect(x, y-300, 150, 320);
      ctx.fillStyle = 'rgba(60,200,255,0.18)'; for (let k=0;k<6;k++) ctx.fillRect(x+10, y-290+k*48, 130, 3);
      if (h % 3 === 0){ ctx.fillStyle = 'rgba(120,230,255,0.35)'; ctx.fillRect(x+20, y-250, 40, 26); }
    });
    scatter(0.45, vh*0.45, 300, (x, y, h) => { ctx.fillStyle = '#2b3a4a'; ctx.fillRect(x, y, 260, 10); ctx.fillStyle = 'rgba(120,230,255,0.6)'; ctx.fillRect(x + ((clock*60 + h) % 260), y+3, 14, 4); });
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createRadialGradient(SW*0.75, SH*0.22, 10, SW*0.75, SH*0.22, SH*0.35);
    g.addColorStop(0, 'rgba(255,250,220,0.95)'); g.addColorStop(0.25, 'rgba(255,230,160,0.5)'); g.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    clouds(0.3); ridge(0.2, vh*0.72, 40, '#e2b97a', 1.3); ridge(0.45, vh*0.86, 36, '#d3a45f', 2.7);
    scatter(0.6, vh*0.95, 300, (x, y, h) => { ctx.fillStyle = '#a98756'; ctx.fillRect(x, y-50-(h%60), 12, 50+(h%60)); ctx.fillRect(x-3, y-52-(h%60), 18, 5); });
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ---------- props: barrels, crates, and real covers ----------
function spawnProps(){
  props.length = 0; nums.length = 0; decor.length = 0;
  const L = mapDef, all = L.rects.concat([[2, MH-2, MW-4, 1]]);
  all.forEach((r, i) => {
    if (r[2] < 4) return;
    let lastX = -999;
    for (let tx=r[0]; tx<r[0]+r[2]; tx++){
      const h = hash2(tx, r[1]);
      if (h % 5 !== 0 || (tx*T - lastX) < 56) continue;
      if (solid(tx, r[1]-1) || solid(tx, r[1]-2) || solid(tx, r[1]-3)) continue;
      const list = DECOR[L.theme];
      decor.push({ k: list[(h>>4) % list.length], x: tx*T + 16, y: r[1]*T, s: 0.85 + ((h>>9)%40)/100, v: (h>>13)%3 });
      lastX = tx*T;
    }
    if (r[2] < 6 || (i % 2 === 1 && r[2] < 30)) return;
    const n = Math.max(2, Math.floor(r[2]/20));
    for (let j=0;j<n;j++){
      const tx = Math.floor(r[0] + r[2]*(j+0.5)/n);
      if (solid(tx, r[1]-1) || solid(tx, r[1]-2)) continue;
      const kind = (tx*31 + i) % 6;
      let o;
      if (kind === 0 || kind === 3) o = { type:'barrel', w:18, h:26, hp:40 };
      else if (kind === 1) o = { type:'crate', w:24, h:24, hp:60 };
      else { const cl = COVERS[L.theme], c = cl[(tx + i) % cl.length], sz = CSIZE[c]; o = { type:'cover', c, w:sz[0], h:sz[1], hp:1e9 }; }
      o.x = tx*T + 16 - o.w/2; o.y = r[1]*T - o.h; o.flash = 0;
      props.push(o);
    }
  });
}
function drawProps(){
  for (const p of props){
    if (p.type === 'cover'){ drawDecorItem({ k:p.c, x:p.x+p.w/2, y:p.y+p.h, s:1, v:0 }); continue; }
    const fl = p.flash > 0;
    if (p.type === 'barrel'){
      ctx.fillStyle = fl ? '#ffffff' : '#b8372a'; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(p.x+3, p.y, 3, p.h);
      ctx.fillStyle = '#5a1f18'; ctx.fillRect(p.x, p.y+5, p.w, 3); ctx.fillRect(p.x, p.y+p.h-8, p.w, 3);
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(p.x+p.w/2-3, p.y+10, 6, 6);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(p.x, p.y, p.w, p.h);
    } else {
      ctx.fillStyle = fl ? '#ffffff' : '#a77b45'; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(p.x, p.y+8, p.w, 2); ctx.fillRect(p.x, p.y+16, p.w, 2);
      ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2; ctx.strokeRect(p.x+1, p.y+1, p.w-2, p.h-2);
      ctx.beginPath(); ctx.moveTo(p.x+2, p.y+2); ctx.lineTo(p.x+p.w-2, p.y+p.h-2); ctx.moveTo(p.x+p.w-2, p.y+2); ctx.lineTo(p.x+2, p.y+p.h-2); ctx.stroke();
    }
  }
}
function hitProp(b, x, y){
  for (const p of props) if (x > p.x && x < p.x+p.w && y > p.y && y < p.y+p.h){
    if (p.type === 'cover'){ spawnParts(x, y, 2, '#ffe9a0', 150, 0.2, 2); return true; }
    if (!b.w.exp) hurtProp(p, b.w.dmg * (b.owner && b.owner.dmgT > 0 ? 1.5 : 1), b.owner);
    return true;
  }
  return false;
}
