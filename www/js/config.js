const CONFIG = {
  gameName: "Project Combat Arena",
  tile: 32, viewH: 540,
  gravity: 1400, maxFall: 800,
  runSpeed: 260, groundAccel: 2600, airAccel: 1500, jumpVel: 500,
  jet: { thrust: 2000, maxUp: 380, fuel: 100, drain: 40, regen: 35, startDelay: 0.15, infinite: true },
  match: { bots: 5, botSkill: 0.6, killLimit: 0, playerName: 'You' },
  rules: {
    respawnDelay: 3, spawnProtect: 2, selfDamage: 0.6, infiniteAmmo: false,
    dropOnDeath: true, pickupRespawn: 15, dropLife: 20,
    maxNades: 5, startNades: 3, losBlocking: true, maxParticles: 350,
    nade: { fuse: 2.4, speed: 520, r: 95, dmg: 100, knock: 600, bounce: 0.5 }
  }
};

const WEAPONS = {
  pistol:  { name:'Pistol',  short:'PST', dmg:25, rate:0.28, speed:800,  life:0.8,  spread:0.02, pellets:1, mag:12, reserve:48,  reload:1.0, kick:15,  len:16, col:'#cccccc', trail:'#ffe066', weight:0,  falloff:false, shake:0 },
  smg:     { name:'SMG',     short:'SMG', dmg:12, rate:0.06, speed:850,  life:0.7,  spread:0.09, pellets:1, mag:35, reserve:140, reload:1.5, kick:8,   len:20, col:'#e0a040', trail:'#ffd27a', weight:10, falloff:true,  shake:0 },
  ar:      { name:'AR',      short:'AR',  dmg:20, rate:0.10, speed:950,  life:0.9,  spread:0.04, pellets:1, mag:30, reserve:120, reload:1.7, kick:10,  len:26, col:'#555555', trail:'#ffe066', weight:8,  falloff:false, shake:0 },
  shotgun: { name:'Shotgun', short:'SHG', dmg:12, rate:0.80, speed:750,  life:0.35, spread:0.16, pellets:8, mag:6,  reserve:30,  reload:2.0, kick:130, len:26, col:'#8a5a2b', trail:'#ffb347', weight:8,  falloff:true,  shake:3 },
  sniper:  { name:'Sniper',  short:'SNP', dmg:90, rate:1.10, speed:2200, life:1.0,  spread:0.0,  pellets:1, mag:5,  reserve:20,  reload:2.2, kick:80,  len:34, col:'#2c3e50', trail:'#ffffff', weight:4,  falloff:false, shake:3 },
  hmg:     { name:'HMG',     short:'HMG', dmg:15, rate:0.07, speed:900,  life:1.0,  spread:0.07, pellets:1, mag:80, reserve:160, reload:3.2, kick:14,  len:30, col:'#6b2d2d', trail:'#ff9966', weight:3,  falloff:false, shake:1 },
  rocket:  { name:'Rocket',  short:'RKT', dmg:0,  rate:1.00, speed:520,  life:2.0,  spread:0.0,  pellets:1, mag:1,  reserve:6,   reload:1.8, kick:200, len:30, col:'#3d5c3d', trail:'#ff8844', weight:3,  falloff:false, shake:4, exp:{ r:110, dmg:90, knock:650 } },
  glauncher:{name:'Grenade L.',short:'GL', dmg:0,  rate:0.70, speed:600,  life:1.6,  spread:0.02, pellets:1, mag:4,  reserve:12,  reload:2.0, kick:60,  len:24, col:'#4b4b2a', trail:'#cccc66', weight:4,  falloff:false, shake:2, grav:900, bounce:0.45, exp:{ r:90, dmg:70, knock:500 } },
  energy:  { name:'Energy',  short:'NRG', dmg:28, rate:0.22, speed:1300, life:0.8,  spread:0.0,  pellets:1, mag:25, reserve:75,  reload:1.6, kick:5,   len:24, col:'#00c3ff', trail:'#66f0ff', weight:3,  falloff:false, shake:0 }
};
const EXTRA_WEIGHTS = { ammo: 12, nade: 6 };

const NAMES = ['Falcon','Viper','Ghost','Rhino','Shadow','Blaze','Hawk','Wolf','Cobra','Titan','Raven','Storm'];
const UNIFORMS = ['#3b7a3b','#2f6fb0','#b03a2f','#c9a227','#7b3fa0','#2a9d8f','#d2691e','#555b66','#c2185b','#6d8b2f','#1e88a8','#8d6e63'];
