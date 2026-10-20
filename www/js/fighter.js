class Fighter {
  constructor(o){
    this.w = 20; this.h = 36;
    this.name = o.name; this.col = o.col; this.look = o.look || randomLook(); this.human = !!o.human; this.ai = !!o.ai; this.skill = o.skill || 0.6;
    this.team = -1; this.kills = 0; this.deaths = 0; this.dead = false; this.respawnT = 0; this.nearPickup = null;
    this.target = null; this.aiT = 0; this.reactT = 0; this.aimErr = 0; this.strafe = 1;
    this.spawn();
  }
  loadout(){
    this.slots = [ {id:'pistol', mag:WEAPONS.pistol.mag, res:WEAPONS.pistol.reserve} ];
    this.cur = 0; this.nades = { frag: CONFIG.rules.startNades, gas: 0, mine: 0 }; this.nadeType = 'frag'; this.gas = 0; this.shield = 0; this.speedT = 0; this.dmgT = 0; this.shieldFlash = 0; this.streak = 0;
  }
  spawn(){
    let best = spawnPoints[0], bd = -1e9;
    for (const sp of spawnPoints){
      let md = 1e9;
      for (const f of fighters) if (f !== this && !f.dead) md = Math.min(md, Math.hypot(sp.x-f.x, sp.y-f.y));
      for (const r of rings) md = Math.min(md, Math.hypot(sp.x-r.x, sp.y-r.y) - r.r);
      md += Math.random()*120;
      if (md > bd){ bd = md; best = sp; }
    }
    this.x = best.x; this.y = dropToGround(best.x, best.y, this.w, this.h);
    this.vx = this.vy = 0; this.hp = 100; this.fuel = CONFIG.jet.fuel;
    this.grounded = false; this.airTime = 0; this.jetting = false; this.prevUp = false;
    this.aim = 0; this.facing = 1; this.reloadT = 0; this.cool = 0; this.recoil = 0;
    this.flash = 0; this.dmgFlash = 0; this.throwCool = 0;
    this.protect = CONFIG.rules.spawnProtect; this.dead = false;
    this.loadout();
  }
  takeDamage(d, by){
    if (this.dead || this.protect > 0) return;
    if (CONFIG.rules.god && this.human) return;
    if (by && by !== this && this.team >= 0 && by.team === this.team && !CONFIG.rules.friendlyFire) return;
    if (this.shield > 0){ const a = Math.min(this.shield, d); this.shield -= a; d -= a; this.shieldFlash = 0.2; if (d <= 0) return; }
    this.hp -= d; this.dmgFlash = 0.35; if (this.human && d > 1) sfxHurt();
    if (this.hp <= 0) this.die(by, true);
  }
  die(by, drop){
    this.dead = true; this.respawnT = CONFIG.rules.respawnDelay; this.deaths++; this.streak = 0;
    if (drop && CONFIG.rules.dropOnDeath && this.slots[this.cur].id !== 'pistol') dropWeapon(this.slots[this.cur], this.x, this.y);
    spawnParts(this.x+this.w/2, this.y+this.h/2, 26, this.col, 300, 0.8, 4);
    spawnParts(this.x+this.w/2, this.y+this.h/2, 10, '#c0392b', 260, 0.7, 3);
    if (this.human) shake = Math.max(shake, 6);
    if (this.human) modeHumanDied();
    if (by && by !== this){
      by.kills++; if (by.team >= 0) GAME.teamScore[by.team]++;
      feedAdd(by.name.toUpperCase() + ' KILLED ' + this.name.toUpperCase() + ' [' + WEAPONS[by.slots[by.cur].id].short + ']' + (by.lastHead ? ' HEADSHOT' : ''));
      const L = CONFIG.match.killLimit;
      modeKill(by); killFx(by, this);
    } else feedAdd(this.name + ' died');
  }
  switchTo(i){
    if (i === this.cur || i >= this.slots.length) return;
    this.cur = i; this.reloadT = 0; this.cool = 0.2;
    if (this.human) popup(WEAPONS[this.slots[i].id].name);
  }
  reload(){
    const s = this.slots[this.cur], w = WEAPONS[s.id];
    if (CONFIG.rules.infiniteAmmo || this.reloadT > 0 || s.mag === w.mag || s.res <= 0) return;
    this.reloadT = w.reload;
  }
  finishReload(){
    const s = this.slots[this.cur], w = WEAPONS[s.id];
    const take = Math.min(w.mag - s.mag, s.res);
    s.mag += take; s.res -= take; this.reloadT = 0;
  }
  throwNade(){
    const k = this.nadeType;
    if (this.nades[k] <= 0 || this.throwCool > 0) return;
    if (k === 'mine' && !this.grounded){ if (this.human) popup('Plant mines on the ground'); return; }
    this.nades[k]--; this.throwCool = 0.4; sfxThrow(k);
    if (k === 'mine'){
      const cx = this.x + this.w/2, gy = dropToGround(cx-5, this.y, 10, 6) + 6;
      mines.push({ x: cx, y: gy, arm: 1.2, life: 90, owner: this });
      if (this.human) popup('Mine planted');
    } else {
      const N = CONFIG.rules.nade;
      grenades.push({
        x: this.x+this.w/2+Math.cos(this.aim)*14, y: this.y+this.h/2+Math.sin(this.aim)*14,
        vx: Math.cos(this.aim)*N.speed + this.vx*0.5, vy: Math.sin(this.aim)*N.speed - 120 + this.vy*0.3,
        t: k === 'gas' ? 1.2 : N.fuse, owner: this, kind: k
      });
    }
    if (this.nades[k] <= 0 && this.human){ for (const t of ['frag','gas','mine']) if (this.nades[t] > 0){ this.nadeType = t; break; } }
  }
  tryPickup(){
    const it = this.nearPickup;
    if (!it || !it.active) return;
    const def = WEAPONS[it.id];
    if (this.slots.some(s => s.id === it.id)){ if (this.human) popup('You already have ' + def.name); return; }
    const slot = { id: it.id, mag: it.mag != null ? it.mag : def.mag, res: it.res != null ? it.res : def.reserve };
    if (this.slots.length < CONFIG.rules.maxWeapons){ this.slots.push(slot); this.cur = this.slots.length - 1; }
    else { dropWeapon(this.slots[this.cur], this.x, this.y); this.slots[this.cur] = slot; }
    this.reloadT = 0; this.cool = 0.2;
    if (this.human){ popup('Picked up ' + def.name); sfxPickup(); }
    spawnParts(it.x+9, it.y+6, 10, '#ffffff', 160, 0.4, 2);
    if (it.temp){ const i = pickups.indexOf(it); if (i >= 0) pickups.splice(i,1); }
    else { it.active = false; it.timer = CONFIG.rules.pickupRespawn; }
    this.nearPickup = null;
  }
  usePowerup(it){
    const k = it.id.slice(3);
    if (k === 'health'){ if (this.hp >= 100) return false; this.hp = Math.min(100, this.hp + 50); }
    else if (k === 'shield') this.shield = 50;
    else if (k === 'speed') this.speedT = 10;
    else this.dmgT = 10;
    if (this.human){ popup(PU[k].name); sfxPickup(); }
    spawnParts(it.x+9, it.y+6, 12, PU[k].col, 200, 0.5, 3);
    if (it.temp){ const i = pickups.indexOf(it); if (i >= 0) pickups.splice(i,1); }
    else { it.active = false; it.timer = CONFIG.rules.pickupRespawn; }
    return true;
  }
  collectAuto(it){
    if (it.id === 'ammo') return false;
    if (it.id.startsWith('pu_')) return this.usePowerup(it);
    const t = it.id.slice(5);
    if (this.nades[t] >= CONFIG.rules.maxNades) return false;
    this.nades[t] = Math.min(CONFIG.rules.maxNades, this.nades[t] + 2);
    if (this.human){ popup('+ ' + NADE[t].name); sfxPickup(); }
    if (this.nades[this.nadeType] <= 0) this.nadeType = t;
    spawnParts(it.x+9, it.y+6, 8, '#ffffff', 160, 0.4, 2);
    if (it.temp){ const i = pickups.indexOf(it); if (i >= 0) pickups.splice(i,1); }
    else { it.active = false; it.timer = CONFIG.rules.pickupRespawn; }
    return true;
  }
  moveX(dx){
    this.x += dx;
    const x0 = Math.floor(this.x/T), x1 = Math.floor((this.x+this.w-0.01)/T);
    const y0 = Math.floor(this.y/T), y1 = Math.floor((this.y+this.h-0.01)/T);
    for (let ty=y0; ty<=y1; ty++) for (let tx=x0; tx<=x1; tx++) if (solid(tx,ty)){
      if (dx > 0) this.x = tx*T - this.w; else if (dx < 0) this.x = (tx+1)*T;
      this.vx = 0; return;
    }
  }
  moveY(dy){
    this.y += dy; this.grounded = false;
    const x0 = Math.floor(this.x/T), x1 = Math.floor((this.x+this.w-0.01)/T);
    const y0 = Math.floor(this.y/T), y1 = Math.floor((this.y+this.h-0.01)/T);
    for (let ty=y0; ty<=y1; ty++) for (let tx=x0; tx<=x1; tx++) if (solid(tx,ty)){
      if (dy > 0){ this.y = ty*T - this.h; this.grounded = true; }
      else if (dy < 0){ this.y = (ty+1)*T; }
      this.vy = 0; return;
    }
  }
  shoot(s, w){
    this.cool = w.rate; this.recoil = 1; this.flash = 0.05; sfxShot(w, this);
    if (!w.exp) spawnParts(this.x+this.w/2, this.y+this.h/2-2, 1, '#d4a017', 90, 0.5, 2);
    if (!CONFIG.rules.infiniteAmmo) s.mag--;
    const cx = this.x+this.w/2, cy = this.y+this.h/2-2;
    const mx = cx + Math.cos(this.aim)*(w.len+6), my = cy + Math.sin(this.aim)*(w.len+6);
    for (let i=0;i<w.pellets;i++){
      const a = this.aim + (Math.random()-0.5)*2*w.spread + (this.gas > 0 ? (Math.random()-0.5)*0.5 : 0);
      bullets.push({ x:mx, y:my, px:mx, py:my, vx:Math.cos(a)*w.speed, vy:Math.sin(a)*w.speed, life:w.life, w, dist:0, owner:this });
    }
    this.vx -= Math.cos(this.aim)*w.kick; this.vy -= Math.sin(this.aim)*w.kick*0.4;
    if (this.human) shake = Math.max(shake, w.shake);
  }

  // ---------- input sources ----------
  humanInput(cam){
    let ax = 0, up = false, fire = false, aim = this.aim, aimSet = false;
    if (keys.KeyA || keys.ArrowLeft) ax -= 1;
    if (keys.KeyD || keys.ArrowRight) ax += 1;
    if (keys.KeyW || keys.Space || keys.ArrowUp) up = true;
    if (keys.KeyF || mouse.down) fire = true;
    if (mouse.active){
      const d = window.devicePixelRatio||1;
      const sx = (this.x + this.w/2 - cam.x) * scale / d, sy = (this.y + this.h/2 - cam.y) * scale / d;
      aim = Math.atan2(mouse.y - sy, mouse.x - sx); aimSet = true;
    }
    if (stick.L.id !== null){
      const v = stickVec(stick.L);
      if (Math.abs(v.x) > 0.2) ax = v.x;
      if (v.y < -0.5) up = true;
    }
    if (stick.R.id !== null){
      const v = stickVec(stick.R);
      if (Math.hypot(v.x, v.y) > 0.25){ aim = Math.atan2(v.y, v.x); aimSet = true; fire = true; }
    }
    if (!aimSet) aim = this.facing > 0 ? 0 : Math.PI;
    return { ax, up, fire, aim };
  }
  think(dt){
    const me = this, cx = me.x+me.w/2, cy = me.y+me.h/2;
    const s = me.slots[me.cur], w = WEAPONS[s.id];
    me.aiT -= dt;
    if (me.aiT <= 0){
      me.aiT = 0.35 + Math.random()*0.2;
      me.aimErr = (Math.random()-0.5)*(1-me.skill)*0.5;
      me.strafe = Math.random() < 0.5 ? -1 : 1;
      let best = null, bd = 1e9;
      for (const f of fighters){
        if (f === me || f.dead || (me.team >= 0 && f.team === me.team)) continue;
        const d = Math.hypot(f.x-me.x, f.y-me.y) + (los(cx,cy,f.x+f.w/2,f.y+f.h/2) ? 0 : 600);
        if (d < bd){ bd = d; best = f; }
      }
      me.target = best;
    }
    const t = me.target;
    let ax = 0, up = false, fire = false, aim = me.aim, nade = false, pick = false, reload = false, engaged = false;
    if (t && !t.dead){
      const tx = t.x+t.w/2, ty = t.y+t.h/2, dx = tx-cx, dy = ty-cy, dist = Math.hypot(dx, dy);
      const vis = los(cx, cy, tx, ty);
      const tt = dist / w.speed, lead = 0.5*me.skill;
      aim = Math.atan2(dy + (w.grav ? -dist*0.25 : 0) + t.vy*tt*lead, dx + t.vx*tt*lead) + me.aimErr;
      const want = (w.spread > 0.08 || w.pellets > 1) ? 140 : (w.exp ? 260 : 320);
      if (dist > want*1.2) ax = Math.sign(dx); else if (dist < want*0.6) ax = -Math.sign(dx); else ax = me.strafe*0.6;
      if (ty < cy - 50) up = true;
      if (vis){
        me.reactT += dt;
        if (dist < w.speed*w.life*0.85 && me.reactT > 0.25*(1.3-me.skill)) fire = true;
        if (dist > 150 && dist < 420 && Math.random() < 0.8*dt*me.skill) nade = true;
        engaged = dist < 300;
      } else me.reactT = 0;
    }
    // look for weapons / ammo when not in a close fight
    if (!engaged){
      const low = (s.mag + s.res) < w.mag;
      let pk = null, pd = 600;
      for (const p of pickups){
        if (!p.active) continue;
        const want = (p.id === 'pu_health' && me.hp < 60) || (WEAPONS[p.id] && me.slots.length < 3 && !me.slots.some(s => s.id === p.id));
        if (!want) continue;
        const d = Math.hypot(cx-(p.x+9), cy-(p.y+6));
        if (d < pd){ pd = d; pk = p; }
      }
      if (pk){
        const dx = pk.x+9-cx;
        ax = Math.abs(dx) > 14 ? Math.sign(dx) : 0;
        if (pk.y+6 < cy - 30) up = true;
        if (pd < 40 && pk.id !== 'ammo') pick = true;
      }
    }
    if (!fire && s.mag < w.mag*0.3 && me.reloadT <= 0) reload = true;
    // obstacle ahead -> jump / fly
    if (ax !== 0){
      const px = Math.floor((me.x + (ax > 0 ? me.w+6 : -6))/T), py = Math.floor((me.y+me.h-8)/T);
      if (solid(px, py)) up = true;
    }
    if (up && me.grounded && Math.random() < 0.5) up = false;
    return { ax, up, fire, aim, nade, pick, reload };
  }

  update(dt, cam){
    if (this.dead){
      this.respawnT -= dt;
      if (this.respawnT <= 0 && !matchState.over && !(this.ai && GAME.mode === 'survival')) this.spawn();
      return;
    }
    const C = CONFIG, J = C.jet;
    this.protect = Math.max(0, this.protect-dt); this.dmgFlash = Math.max(0, this.dmgFlash-dt);
    this.flash = Math.max(0, this.flash-dt); this.throwCool = Math.max(0, this.throwCool-dt);

    const inp = this.ai ? this.think(dt) : this.humanInput(cam);
    this.aim = inp.aim; this.facing = Math.cos(this.aim) >= 0 ? 1 : -1;
    if (inp.nade) this.throwNade();
    if (inp.reload) this.reload();
    if (inp.pick) this.tryPickup();
    const ax = inp.ax, up = inp.up, fire = inp.fire;

    this.gas = Math.max(0, this.gas - dt); this.speedT = Math.max(0, this.speedT - dt); this.dmgT = Math.max(0, this.dmgT - dt); this.shieldFlash = Math.max(0, this.shieldFlash - dt); const target = ax * C.runSpeed * (this.gas > 0 ? 0.55 : 1) * (this.speedT > 0 ? 1.4 : 1), acc = this.grounded ? C.groundAccel : C.airAccel;
    if (this.vx < target) this.vx = Math.min(target, this.vx + acc*dt);
    else if (this.vx > target) this.vx = Math.max(target, this.vx - acc*dt);

    if (up && !this.prevUp && this.grounded){ this.vy = -C.jumpVel; this.grounded = false; }
    if (!up && this.vy < -220 && this.vy > -C.jumpVel-1) this.vy += 2400*dt;
    this.airTime = this.grounded ? 0 : this.airTime + dt;
    this.jetting = up && !this.grounded && this.airTime > J.startDelay && (J.infinite || this.fuel > 0);
    if (this.jetting){
      this.vy = Math.max(-J.maxUp, this.vy - J.thrust*dt);
      if (!J.infinite) this.fuel = Math.max(0, this.fuel - J.drain*dt);
      if (Math.random() < 0.6) spawnParts(this.x+this.w/2-this.facing*10, this.y+this.h/2+10, 1, '#ffb020', 90, 0.25, 2);
    } else this.fuel = Math.min(J.fuel, this.fuel + (this.grounded ? J.regen : J.regen*0.3)*dt);
    this.prevUp = up;

    this.vy = Math.min(C.maxFall, this.vy + C.gravity*dt);
    const steps = Math.ceil(Math.max(Math.abs(this.vx), Math.abs(this.vy))*dt / 8) || 1;
    for (let i=0;i<steps;i++){ this.moveX(this.vx*dt/steps); this.moveY(this.vy*dt/steps); }

    const s = this.slots[this.cur], w = WEAPONS[s.id], inf = C.rules.infiniteAmmo;
    this.cool -= dt; this.recoil = Math.max(0, this.recoil - dt*8);
    if (this.reloadT > 0){
      this.reloadT -= dt;
      if (this.reloadT <= 0) this.finishReload();
    } else if (s.mag <= 0 && !inf) this.reload();
    if (fire && this.cool <= 0 && this.reloadT <= 0 && (s.mag > 0 || inf)) this.shoot(s, w);

    let near = null, nd = 50;
    for (const p of pickups){
      if (!p.active || !WEAPONS[p.id]) continue;
      const d = Math.hypot(this.x+this.w/2-(p.x+9), this.y+this.h/2-(p.y+6));
      if (d < nd){ nd = d; near = p; }
    }
    this.nearPickup = near;

    if (this.y > MH*T + 200) this.die(null, false);
  }
}
