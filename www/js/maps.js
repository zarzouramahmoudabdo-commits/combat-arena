const MAPS = [
  { name:'Military Base', desc:'Tiers, bridges, tunnels', w:120, h:40,
    sky:['#6fa8d6','#cfe6f5'], top:'#7a8b5a', dirt:'#5a5f4a', rects:[
    [8,30,14,1],[30,30,16,1],[60,30,16,1],[90,30,16,1],
    [2,24,10,1],[20,24,12,1],[44,24,14,1],[68,24,12,1],[92,24,12,1],[108,24,10,1],
    [10,18,12,1],[30,18,10,1],[50,18,20,1],[78,18,10,1],[98,18,12,1],
    [4,12,10,1],[24,12,12,1],[44,12,8,1],[68,12,8,1],[84,12,12,1],[106,12,10,1],
    [34,7,14,1],[72,7,14,1],
    [14,33,25,1],[78,33,22,1],[56,35,6,3],[100,34,3,4],[28,31,2,2],[74,31,2,2] ] },

  { name:'Jungle Outpost', desc:'Cliffs, branches, rocks', w:130, h:40,
    sky:['#4a9e6e','#cfeec0'], top:'#2e8b3a', dirt:'#5b3d22', rects:[
    [0,26,14,12],[116,24,14,12],[30,30,10,8],[52,34,8,4],[78,28,12,10],[104,32,8,6],
    [16,22,10,1],[34,18,12,1],[52,24,10,1],[66,16,14,1],[86,20,10,1],[100,14,12,1],
    [20,12,10,1],[44,10,10,1],[72,8,12,1],[96,8,10,1],[6,16,8,1],[118,16,8,1],
    [60,29,8,1],[40,25,6,1] ] },

  { name:'Secret Laboratory', desc:'Rooms and corridors', w:110, h:44,
    sky:['#1b2a3a','#2d4a63'], top:'#7fd1e8', dirt:'#2c3e50', rects:[
    [2,14,38,1],[56,14,52,1],[2,23,22,1],[40,23,30,1],[86,23,22,1],
    [10,32,40,1],[64,32,44,1],[24,24,2,8],[70,24,2,8],[40,4,1,10],[68,4,1,10],
    [54,15,2,6],[98,33,6,3],[6,38,8,1] ] },

  { name:'Desert Ruins', desc:'Towers and sniper lanes', w:140, h:40,
    sky:['#f2c27b','#fbe7c0'], top:'#d9b36c', dirt:'#a67c3d', rects:[
    [20,20,3,18],[50,16,3,22],[90,18,3,20],[118,22,3,16],
    [17,20,9,1],[47,16,9,1],[87,18,9,1],[115,22,9,1],
    [34,30,2,8],[66,32,2,6],[104,30,2,8],
    [28,26,10,1],[58,24,12,1],[74,28,10,1],[98,26,12,1],
    [6,10,30,1],[104,10,30,1],[56,6,28,1],
    [40,35,6,3],[80,35,8,3],[8,34,10,4],[126,32,8,6] ] }
];

// builds the level: walls + rects, then spawn points and pickup spots are generated
// automatically on free spots above platforms (so they are never inside walls)
function loadMap(i){
  mapDef = MAPS[i]; MW = mapDef.w; MH = mapDef.h; map = new Uint8Array(MW*MH);
  rect(0,MH-2,MW,2); rect(0,0,2,MH); rect(MW-2,0,2,MH); rect(0,0,MW,2);
  for (const r of mapDef.rects) rect(r[0],r[1],r[2],r[3]);
  spawnPoints = []; pickupSpots = []; pickups.length = 0;
  const all = mapDef.rects.concat([[2,MH-2,MW-4,1]]);
  for (const r of all){
    if (r[2] < 4) continue;
    const n = Math.max(1, Math.floor(r[2]/12));
    for (let j=0;j<n;j++){
      const tx = Math.floor(r[0] + (j+0.5)*r[2]/n);
      if (solid(tx,r[1]-1) || solid(tx,r[1]-2) || solid(tx,r[1]-3)) continue;
      spawnPoints.push({ x: tx*T + 6, y: r[1]*T - 60 });
    }
  }
  spawnPoints.forEach((s, k) => { if (k % 2 === 0 && pickupSpots.length < 28) pickupSpots.push(s); });
  for (const s of pickupSpots){ const hi = s.y < MH*T*0.4; addPickup(s.x, dropToGround(s.x, s.y, 18, 12), rollItem(hi), { high: hi }); }
  spawnProps();
}
