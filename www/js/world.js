const T = CONFIG.tile;
let MW = 70, MH = 30, map = new Uint8Array(MW * MH), mapDef = null;
let spawnPoints = [], pickupSpots = [];
const solid = (tx, ty) => tx < 0 || ty < 0 || tx >= MW || ty >= MH ? true : map[ty * MW + tx] === 1;
function rect(x, y, w, h){ for(let j=y;j<y+h;j++) for(let i=x;i<x+w;i++) if(i>=0&&j>=0&&i<MW&&j<MH) map[j*MW+i]=1; }
function hitSolid(x, y, r){
  return solid(Math.floor((x-r)/T),Math.floor((y-r)/T)) || solid(Math.floor((x+r)/T),Math.floor((y-r)/T)) ||
         solid(Math.floor((x-r)/T),Math.floor((y+r)/T)) || solid(Math.floor((x+r)/T),Math.floor((y+r)/T));
}
function dropToGround(x, y, w, h){
  let g = 0;
  while (g++ < 400 && !solid(Math.floor((x+w/2)/T), Math.floor((y+h+1)/T))) y += 4;
  return Math.floor((y+h+1)/T)*T - h;
}
function los(x0, y0, x1, y1){
  const n = Math.ceil(Math.hypot(x1-x0, y1-y0)/8);
  for (let i=1;i<n;i++){ const t=i/n; if (solid(Math.floor((x0+(x1-x0)*t)/T), Math.floor((y0+(y1-y0)*t)/T))) return false; }
  return true;
}
const fighters = [], bullets = [], grenades = [], parts = [], rings = [], pickups = [], feed = [];
const matchState = { over: 0, winner: '' };
let shake = 0, popupT = 0, popupText = '', clock = 0;
function popup(t){ popupText = t; popupT = 1.6; }
function feedAdd(t){ feed.push({ t: 4, text: t }); if (feed.length > 5) feed.shift(); }

function spawnParts(x, y, n, col, spd, life, size){
  for (let i=0;i<n && parts.length < CONFIG.rules.maxParticles;i++){
    const a = Math.random()*6.283, s = spd*(0.3+Math.random()*0.7);
    parts.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s - spd*0.2, life: life*(0.5+Math.random()*0.5), max: life, size: size*(0.6+Math.random()*0.6), col });
  }
}
function updateParts(dt){
  for (let i=parts.length-1;i>=0;i--){
    const p = parts[i];
    p.life -= dt; p.vy += 600*dt; p.x += p.vx*dt; p.y += p.vy*dt;
    if (p.life <= 0) parts.splice(i,1);
  }
  for (let i=rings.length-1;i>=0;i--){ rings[i].t += dt; if (rings[i].t > 0.3) rings.splice(i,1); }
  for (let i=feed.length-1;i>=0;i--){ feed[i].t -= dt; if (feed[i].t <= 0) feed.splice(i,1); }
}

// ---------- pickups ----------
function rollItem(){
  let total = EXTRA_WEIGHTS.ammo + EXTRA_WEIGHTS.nade;
  for (const k in WEAPONS) total += WEAPONS[k].weight;
  let r = Math.random()*total;
  for (const k in WEAPONS){ r -= WEAPONS[k].weight; if (r < 0) return k; }
  r -= EXTRA_WEIGHTS.ammo; if (r < 0) return 'ammo';
  return 'nade';
}
function addPickup(x, y, id, extra){
  const p = { x, y, w:18, h:12, id, active:true, timer:0, temp:false, life:0, mag:null, res:null };
  if (extra) Object.assign(p, extra);
  pickups.push(p); return p;
}
function dropWeapon(slot, x, y){
  if (y > MH*T) return;
  const gy = dropToGround(x, y, 18, 12);
  addPickup(x, gy, slot.id, { temp:true, life:CONFIG.rules.dropLife, mag:slot.mag, res:slot.res });
}
function updatePickups(dt){
  for (let i=pickups.length-1;i>=0;i--){
    const p = pickups[i];
    if (p.active){
      if (p.temp){ p.life -= dt; if (p.life <= 0){ pickups.splice(i,1); continue; } }
      if (p.id==='ammo' || p.id==='nade'){
        for (const f of fighters){
          if (f.dead) continue;
          if (Math.hypot(f.x+f.w/2-(p.x+9), f.y+f.h/2-(p.y+6)) < 36){ if (f.collectAuto(p)) break; }
        }
      }
    } else if (!p.temp){
      p.timer -= dt;
      if (p.timer <= 0){ p.id = rollItem(); p.active = true; }
    }
  }
}

// ---------- physics + explosions ----------
function moveBody(o, dt, rest, r){
  const n = Math.ceil(Math.max(Math.abs(o.vx), Math.abs(o.vy))*dt/6) || 1;
  for (let i=0;i<n;i++){
    const dx = o.vx*dt/n, dy = o.vy*dt/n;
    if (!hitSolid(o.x+dx, o.y, r)) o.x += dx; else { o.vx *= -rest; o.hit = true; }
    if (!hitSolid(o.x, o.y+dy, r)) o.y += dy;
    else { o.vy *= -rest; o.vx *= 0.85; o.hit = true; if (Math.abs(o.vy) < 30) o.vy = 0; }
  }
}
function explode(x, y, ex, owner){
  rings.push({ x, y, r: ex.r, t: 0 });
  spawnParts(x, y, 22, '#ff8c1a', 380, 0.5, 4);
  spawnParts(x, y, 10, '#444444', 160, 0.9, 5);
  shake = Math.max(shake, Math.min(14, ex.r/9));
  for (const f of fighters){
    if (f.dead) continue;
    const cx = f.x+f.w/2, cy = f.y+f.h/2, dist = Math.hypot(cx-x, cy-y);
    if (dist < ex.r && (!CONFIG.rules.losBlocking || los(x,y,cx,cy))){
      const k = 1 - dist/ex.r;
      f.takeDamage(ex.dmg*k*(f===owner ? CONFIG.rules.selfDamage : 1), owner);
      const dx = dist < 1 ? 0 : (cx-x)/dist, dy = dist < 1 ? -1 : (cy-y)/dist;
      f.vx += dx*ex.knock*k; f.vy += dy*ex.knock*k - 80*k; f.grounded = false;
    }
  }
}
function hitFighter(x, y, owner){
  for (const f of fighters) if (f!==owner && !f.dead && x>f.x-2 && x<f.x+f.w+2 && y>f.y-2 && y<f.y+f.h+2) return f;
  return null;
}
function updateBullets(dt){
  for (let i = bullets.length-1; i >= 0; i--){
    const b = bullets[i], w = b.w;
    let dead = false, hitPos = null;
    b.life -= dt;
    if (w.bounce !== undefined){
      b.vy += w.grav*dt;
      moveBody(b, dt, w.bounce, 3);
      if (hitFighter(b.x, b.y, b.owner) || b.life <= 0){ dead = true; hitPos = { x:b.x, y:b.y }; }
    } else {
      const steps = Math.ceil(Math.hypot(b.vx, b.vy)*dt/8) || 1;
      for (let s=0; s<steps && !dead; s++){
        b.px = b.x; b.py = b.y;
        b.x += b.vx*dt/steps; b.y += b.vy*dt/steps;
        b.dist += Math.hypot(b.vx, b.vy)*dt/steps;
        if (solid(Math.floor(b.x/T), Math.floor(b.y/T))){
          dead = true; hitPos = { x:b.px, y:b.py };
          spawnParts(b.px, b.py, 3, '#bbbbbb', 120, 0.25, 2);
        } else {
          const f = hitFighter(b.x, b.y, b.owner);
          if (f){
            dead = true; hitPos = { x:b.x, y:b.y };
            if (!w.exp){
              const k = w.falloff ? 1 - 0.6*Math.min(1, b.dist/(w.speed*w.life)) : 1;
              f.takeDamage(w.dmg*k, b.owner);
              spawnParts(b.x, b.y, 4, '#c0392b', 140, 0.3, 2);
            }
          }
        }
      }
      if (!dead && b.life <= 0){ dead = true; hitPos = { x:b.x, y:b.y }; }
    }
    if (dead){
      if (w.exp && hitPos) explode(hitPos.x, hitPos.y, w.exp, b.owner);
      bullets.splice(i, 1);
    }
  }
}
function updateGrenades(dt){
  const N = CONFIG.rules.nade;
  for (let i = grenades.length-1; i >= 0; i--){
    const g = grenades[i];
    g.vy += CONFIG.gravity*dt; g.t -= dt;
    moveBody(g, dt, N.bounce, 5);
    if (g.t <= 0){ explode(g.x, g.y, { r:N.r, dmg:N.dmg, knock:N.knock }, g.owner); grenades.splice(i, 1); }
  }
}
