const MODES = {
  ffa:      { name:'Free For All' },
  tdm:      { name:'Team Deathmatch' },
  survival: { name:'Endless Survival' },
  sandbox:  { name:'Sandbox' }
};
const MODE_KEYS = ['ffa','tdm','survival','sandbox'];
const TEAM_COL = ['#2f6fb0','#b03a2f'], TEAM_NAME = ['BLUE','RED'];
const GAME = { mode:'ffa', wave:0, waveT:0, lives:3, teamScore:[0,0] };

// one shared rules object: every mode just sets values here
function setupMode(){
  applySettings();
  const m = SET.mode, R = CONFIG.rules;
  GAME.mode = m; GAME.wave = 0; GAME.waveT = 2; GAME.lives = 3; GAME.teamScore = [0,0];
  R.respawnDelay = 3; R.pickupRespawn = 15; R.friendlyFire = false; R.god = false;
  if (m === 'sandbox'){
    R.respawnDelay = 0.3; R.pickupRespawn = 3; R.god = true; R.infiniteAmmo = true; CONFIG.jet.infinite = true;
  }
}
function modeKill(by){
  const L = CONFIG.match.killLimit;
  if (L <= 0 || matchState.over) return;
  if (GAME.mode === 'ffa' && by.kills >= L){ matchState.over = 5; matchState.winner = by.name; }
  if (GAME.mode === 'tdm' && by.team >= 0 && GAME.teamScore[by.team] >= L){ matchState.over = 5; matchState.winner = TEAM_NAME[by.team] + ' TEAM'; }
}
function modeHumanDied(){
  if (GAME.mode !== 'survival') return;
  GAME.lives--;
  if (GAME.lives <= 0){ matchState.over = 6; matchState.text = 'GAME OVER - Wave ' + GAME.wave; }
}
function startWave(){
  GAME.wave++; GAME.waveT = 4;
  for (let i=fighters.length-1;i>=0;i--) if (fighters[i].ai) fighters.splice(i,1);
  const n = Math.min(11, 2 + GAME.wave), skill = Math.min(0.9, 0.3 + GAME.wave*0.07);
  for (let k=0;k<n;k++){
    const b = new Fighter({ name: NAMES[(GAME.wave*3 + k) % NAMES.length], col: TEAM_COL[1], ai: true, skill });
    b.team = 1; fighters.push(b);
  }
  popup('Wave ' + GAME.wave);
  if (player && !player.dead) player.hp = Math.min(100, player.hp + 30);
}
function modeUpdate(dt){
  if (GAME.mode !== 'survival' || matchState.over) return;
  if (fighters.filter(f => f.ai && !f.dead).length === 0){
    GAME.waveT -= dt;
    if (GAME.waveT <= 0) startWave();
  }
}
function modeReset(){
  GAME.teamScore = [0,0]; GAME.lives = 3; GAME.wave = 0; GAME.waveT = 2; matchState.text = '';
  if (GAME.mode === 'survival') for (let i=fighters.length-1;i>=0;i--) if (fighters[i].ai) fighters.splice(i,1);
}
function drawModeHUD(d){
  if (!player) return;
  const u = SH/540, y = 16*u + 76*u;
  ctx.textAlign = 'center'; ctx.font = 'bold ' + (15*u) + 'px sans-serif';
  if (GAME.mode === 'tdm'){
    ctx.fillStyle = TEAM_COL[0]; ctx.fillText('BLUE ' + GAME.teamScore[0], SW/2 - 70*u, y);
    ctx.fillStyle = '#fff'; ctx.fillText('-', SW/2, y);
    ctx.fillStyle = TEAM_COL[1]; ctx.fillText(GAME.teamScore[1] + ' RED', SW/2 + 70*u, y);
  } else if (GAME.mode === 'survival'){
    const en = fighters.filter(f => f.ai && !f.dead).length;
    ctx.fillStyle = '#fff'; ctx.fillText('Wave ' + GAME.wave + '   Lives ' + GAME.lives + '   Enemies ' + en, SW/2, y);
  } else if (GAME.mode === 'sandbox'){
    ctx.fillStyle = '#9be37a'; ctx.fillText('SANDBOX', SW/2, y);
  }
}
