const fs = require('fs');
const load = f => fs.readFileSync(f, 'utf8');
function rep(f, a, b){
  const s = load(f), n = s.split(a).length - 1;
  if (n !== 1){ console.log('FAILED in', f, '->', a.slice(0, 60), '| found', n); process.exit(1); }
  fs.writeFileSync(f, s.replace(a, () => b));
}
function cut(f, a, b, neu){
  const s = load(f), i = s.indexOf(a), j = i < 0 ? -1 : s.indexOf(b, i + 1);
  if (i < 0 || j < 0){ console.log('FAILED cut in', f, '->', a.slice(0, 60)); process.exit(1); }
  fs.writeFileSync(f, s.slice(0, i) + neu + s.slice(j));
}
const C = 'www/js/config.js', F = 'www/js/fighter.js', M = 'www/js/main.js';

rep('www/index.html', '<script src="js/config.js"></script>', '<script src="js/config.js"></script>\n<script src="js/settings.js"></script>');

// ---- config ----
rep(C, 'maxNades: 5, startNades: 3,', 'maxNades: 5, startNades: 3, maxWeapons: 4,');
rep(C, 'const EXTRA_WEIGHTS = { ammo: 12, nade: 6 };', 'const EXTRA_WEIGHTS = { ammo: 0, nade: 8 };');
rep(C, 'infiniteAmmo: false', 'infiniteAmmo: true');

// ---- fighter: pistol only, inventory list, looks ----
rep(F, 'this.name = o.name; this.col = o.col;', 'this.name = o.name; this.col = o.col; this.look = o.look || randomLook();');
cut(F, '  loadout(){', '  spawn(){',
`  loadout(){
    this.slots = [ {id:'pistol', mag:WEAPONS.pistol.mag, res:WEAPONS.pistol.reserve} ];
    this.cur = 0; this.nades = CONFIG.rules.startNades;
  }
`);
rep(F, '    if (i === this.cur) return;', '    if (i === this.cur || i >= this.slots.length) return;');
rep(F, 'if (drop && CONFIG.rules.dropOnDeath) dropWeapon(this.slots[this.cur], this.x, this.y);', "if (drop && CONFIG.rules.dropOnDeath && this.slots[this.cur].id !== 'pistol') dropWeapon(this.slots[this.cur], this.x, this.y);");
rep(F, "feedAdd(by.name + '  >  ' + this.name);", "feedAdd(by.name.toUpperCase() + ' KILLED ' + this.name.toUpperCase() + ' [' + WEAPONS[by.slots[by.cur].id].short + ']');");
cut(F, '  tryPickup(){', '  collectAuto(it){',
`  tryPickup(){
    const it = this.nearPickup;
    if (!it || !it.active) return;
    const def = WEAPONS[it.id];
    if (this.slots.some(s => s.id === it.id)){ if (this.human) popup('You already have ' + def.name); return; }
    const slot = { id: it.id, mag: it.mag != null ? it.mag : def.mag, res: it.res != null ? it.res : def.reserve };
    if (this.slots.length < CONFIG.rules.maxWeapons){ this.slots.push(slot); this.cur = this.slots.length - 1; }
    else { dropWeapon(this.slots[this.cur], this.x, this.y); this.slots[this.cur] = slot; }
    this.reloadT = 0; this.cool = 0.2;
    if (this.human) popup('Picked up ' + def.name);
    spawnParts(it.x+9, it.y+6, 10, '#ffffff', 160, 0.4, 2);
    if (it.temp){ const i = pickups.indexOf(it); if (i >= 0) pickups.splice(i,1); }
    else { it.active = false; it.timer = CONFIG.rules.pickupRespawn; }
    this.nearPickup = null;
  }
`);
rep(F, "const want = (p.id==='ammo' && low) || (p.id!=='ammo' && p.id!=='nade' && me.slots[me.cur].id==='pistol');",
        "const want = p.id!=='ammo' && p.id!=='nade' && me.slots.length < 3 && !me.slots.some(s => s.id === p.id);");

// ---- main: buttons, wheel, settings state ----
rep(M, "const BTN = [ {k:'nade',l:'G'}, {k:'reload',l:'R'}, {k:'swap',l:'SW'}, {k:'pick',l:'E'}, {k:'menu',l:'M'} ];",
       "const BTN = [ {k:'nade'}, {k:'wheel'}, {k:'pick'}, {k:'gear'}, {k:'menu'} ];");
rep(M, 'function btnPos(i){ return i === 4 ? { x: innerWidth - 102, y: 112, r: 24 } : { x: innerWidth - 44, y: 112 + i*58, r: 24 }; }',
`function btnPos(i){
  const s = SET.btnScale, r = 24*s, col = i >= 3 ? 1 : 0, row = i >= 3 ? i - 3 : i;
  return { x: SET.lefty ? 44 + col*(r*2+10) : innerWidth - 44 - col*(r*2+10), y: 112 + row*(r*2+10), r };
}`);
rep(M, "const s = t.clientX < innerWidth/2 ? stick.L : stick.R;", "const s = ((t.clientX < innerWidth/2) !== SET.lefty) ? stick.L : stick.R;");
rep(M, "if (bi >= 0){ btnFlash[bi] = 0.15; doAction(BTN[bi].k); continue; }",
       "if (bi >= 0){ btnFlash[bi] = 0.15; if (BTN[bi].k === 'wheel'){ if (player && !player.dead){ wheel.open = true; wheel.id = t.identifier; wheel.sel = null; } } else doAction(BTN[bi].k); continue; }");
rep(M, "for (const k of [stick.L, stick.R]) if (k.id === t.identifier){ k.x = t.clientX; k.y = t.clientY; }",
       "for (const k of [stick.L, stick.R]) if (k.id === t.identifier){ k.x = t.clientX; k.y = t.clientY; }\n      if (wheel.open && wheel.id === t.identifier) wheelMove(t.clientX, t.clientY);");
rep(M, "for (const k of [stick.L, stick.R]) if (k.id === t.identifier) k.id = null;",
       "if (wheel.open && wheel.id === t.identifier) wheelEnd();\n      for (const k of [stick.L, stick.R]) if (k.id === t.identifier) k.id = null;");
rep(M, "if (state === 'menu'){ if (e.type === 'touchstart') for (const t of e.changedTouches) menuTap(t.clientX, t.clientY); return; }",
       "if (state === 'menu'){ if (e.type === 'touchstart') for (const t of e.changedTouches) menuTap(t.clientX, t.clientY); return; }\n  if (state === 'settings'){ if (e.type === 'touchstart') for (const t of e.changedTouches) settingsTap(t.clientX, t.clientY); return; }");
rep(M, "if (state === 'menu') menuTap(e.clientX, e.clientY); else mouse.down = true;",
       "if (state === 'menu') menuTap(e.clientX, e.clientY); else if (state === 'settings') settingsTap(e.clientX, e.clientY); else mouse.down = true;");
rep(M, "  if (k === 'menu'){ state = 'menu'; return; }", "  if (k === 'menu'){ state = 'menu'; return; }\n  if (k === 'gear'){ prevState = 'play'; state = 'settings'; return; }");
rep(M, "else if (k==='swap') player.switchTo(1 - player.cur);", "else if (k==='swap') player.switchTo((player.cur + 1) % player.slots.length);");
rep(M, "function menuTap(x, y){\n", "function menuTap(x, y){\n  const sb = settingsBtnRect();\n  if (x >= sb.x && x <= sb.x+sb.w && y >= sb.y && y <= sb.y+sb.h){ prevState = 'menu'; state = 'settings'; return; }\n");
rep(M, "if (state === 'menu'){ drawMenu(); requestAnimationFrame(loop); return; }",
       "if (state === 'menu'){ drawMenu(); drawMenuExtras(); requestAnimationFrame(loop); return; }\n  if (state === 'settings'){ drawSettings(); requestAnimationFrame(loop); return; }");
rep(M, "col: UNIFORMS[0], human: true }", "col: UNIFORMS[PROFILE.uniform], look: PROFILE, human: true }");
rep(M, "name: CONFIG.match.playerName,", "name: PROFILE.name,");
rep(M, "UNIFORMS[(k+1) % UNIFORMS.length]", "UNIFORMS[(PROFILE.uniform+1+k) % UNIFORMS.length]");
rep(M, "const sx = (Math.random()-0.5)*shake, sy = (Math.random()-0.5)*shake;", "const sh = SET.shake ? shake : 0, sx = (Math.random()-0.5)*sh, sy = (Math.random()-0.5)*sh;");
rep(M, "  // kill feed\n", "  // kill feed\n  ctx.fillStyle = '#ff5050';\n");
cut(M, "  ctx.fillStyle = p.cur===0 ? '#ffeb3b' : '#bbb';", "  ctx.fillStyle = '#fff'; ctx.fillText('Grenades: '", '');
cut(M, "  for (let i=0;i<BTN.length;i++){\n    const bp = btnPos(i);", "  for (const st of [stick.L, stick.R]) if (st.id !== null){",
`  for (let i=0;i<BTN.length;i++){
    const bp = btnPos(i), k = BTN[i].k, X = bp.x*d, Y = bp.y*d, R = bp.r*d;
    ctx.globalAlpha = btnFlash[i] > 0 ? Math.min(1, SET.btnOpacity+0.4) : SET.btnOpacity;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X, Y, R, 0, 7); ctx.fill();
    ctx.globalAlpha = Math.min(1, SET.btnOpacity+0.4);
    drawBtnIcon(k, X, Y, R, p);
    if (btnFlash[i] > 0) btnFlash[i] -= 0.016;
  }
  ctx.globalAlpha = 1;
  drawWheel(d);
`);

// ---- main: better looking character ----
cut(M, 'function drawFighter(p){', 'function drawHUD(){',
`function drawFighter(p){
  if (p.dead) return;
  if (p.protect > 0 && Math.floor(clock*12) % 2 === 0) return;
  const cx = p.x+p.w/2, f = p.facing, w = WEAPONS[p.slots[p.cur].id], L = p.look;
  const skin = SKINS[L.skin], body = p.dmgFlash > 0 ? '#ff6666' : p.col;
  if (p.jetting){
    ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.moveTo(cx-f*12-4, p.y+28); ctx.lineTo(cx-f*12+4, p.y+28);
    ctx.lineTo(cx-f*12, p.y+40+Math.random()*10); ctx.fill();
  }
  ctx.fillStyle = JETS[L.jet]; ctx.fillRect(cx-f*12-5, p.y+11, 10, 17);
  ctx.fillStyle = '#222'; ctx.fillRect(cx-f*12-3, p.y+28, 6, 3);
  const sw = p.grounded ? Math.sin(p.x*0.18)*Math.min(1, Math.abs(p.vx)/150)*6 : 3;
  ctx.strokeStyle = '#2f343b'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx-3, p.y+25); ctx.lineTo(cx-3+sw, p.y+35); ctx.moveTo(cx+3, p.y+25); ctx.lineTo(cx+3-sw, p.y+35); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#111'; ctx.fillRect(cx-6+sw, p.y+34, 6, 2); ctx.fillRect(cx+sw*-1, p.y+34, 6, 2);
  ctx.fillStyle = body; ctx.fillRect(p.x+3, p.y+10, 14, 16);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(p.x+3, p.y+10, 14, 4); ctx.fillRect(p.x+3, p.y+23, 14, 3);
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(cx, p.y+6, 6, 0, 7); ctx.fill();
  ctx.fillStyle = '#111'; ctx.fillRect(cx+f*3-1, p.y+5, 2, 2);
  if (L.mask === 1){ ctx.fillStyle = '#b03a2f'; ctx.fillRect(cx-6, p.y+7, 12, 4); }
  if (L.mask === 2){ ctx.fillStyle = '#f1c40f'; ctx.fillRect(cx-6, p.y+3, 12, 4); ctx.fillStyle = '#111'; ctx.fillRect(cx+f*3-1, p.y+4, 2, 2); }
  if (L.helmet === 0){ ctx.fillStyle = '#3d5a2a'; ctx.beginPath(); ctx.arc(cx, p.y+5, 6.5, Math.PI, 0); ctx.fill(); ctx.fillRect(f > 0 ? cx : cx-8, p.y+4, 8, 2); }
  else if (L.helmet === 1){ ctx.fillStyle = '#4b5320'; ctx.beginPath(); ctx.arc(cx, p.y+5, 7.5, Math.PI, 0); ctx.lineTo(cx+7.5, p.y+8); ctx.lineTo(cx-7.5, p.y+8); ctx.fill(); }
  else if (L.helmet === 2){ ctx.fillStyle = '#8e1b1b'; ctx.beginPath(); ctx.ellipse(cx-f*2, p.y, 8, 3.5, -f*0.2, 0, 7); ctx.fill(); }
  else { ctx.fillStyle = '#2b1d0e'; ctx.beginPath(); ctx.arc(cx, p.y+4, 6, Math.PI, 0); ctx.fill(); }
  ctx.save(); ctx.translate(cx, p.y+16); ctx.rotate(p.aim);
  if (f < 0) ctx.scale(1, -1);
  ctx.rotate(-p.recoil*0.1);
  ctx.strokeStyle = skin; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, 0); ctx.stroke();
  ctx.fillStyle = w.col; ctx.fillRect(4, -3, w.len - p.recoil*3, 6);
  if (p.flash > 0){ ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.arc(w.len+8, 0, 6, 0, 7); ctx.fill(); }
  ctx.restore();
  ctx.font = 'bold 10px sans-serif';
  const kt = String(p.kills), tw = ctx.measureText(p.name).width, bw = 10 + kt.length*6, W = tw + bw + 10, X = cx - W/2, Y = p.y - 30;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; rr(X, Y, W, 14, 7);
  ctx.fillStyle = p.col; rr(X+1, Y+1, bw, 12, 6);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(kt, X+1+bw/2, Y+10.5);
  ctx.textAlign = 'left'; ctx.fillStyle = p.human ? '#ffeb3b' : '#ffffff'; ctx.fillText(p.name, X+bw+5, Y+10.5);
  if (p.hp !== undefined){
    ctx.fillStyle = '#0008'; ctx.fillRect(p.x-2, p.y-12, p.w+4, 4);
    ctx.fillStyle = '#2ecc71'; ctx.fillRect(p.x-2, p.y-12, (p.w+4)*Math.max(0,p.hp)/100, 4);
  }
}
`);
console.log('PATCH OK');
