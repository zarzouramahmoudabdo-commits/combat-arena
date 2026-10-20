// draws a weapon with its back at (0,0), barrel pointing to +x
function drawGun(id){
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  switch (id){
    case 'pistol':
      R(2,-4,12,4,'#3b3f46'); R(2,-4,12,1,'#6d737d'); R(13,-3,3,2,'#1a1a1a'); R(3,0,4,7,'#6b4423'); R(7,0,3,2,'#2a2a2a'); break;
    case 'smg':
      R(0,-4,16,5,'#34373d'); R(0,-4,16,1,'#6d737d'); R(16,-3,5,2,'#1a1a1a'); R(6,1,3,8,'#222222'); R(2,1,3,6,'#222222'); R(-3,-3,3,3,'#34373d'); R(11,-6,3,2,'#222222'); break;
    case 'ar':
      R(-7,-3,8,5,'#5e3d22'); R(1,-4,11,5,'#3b4048'); R(1,-4,11,1,'#757c87'); R(12,-3,8,4,'#6b4a2b'); R(20,-2,7,2,'#1a1a1a'); R(8,1,3,8,'#262626'); R(3,1,3,5,'#262626'); R(8,-6,4,2,'#222222'); break;
    case 'shotgun':
      R(-8,-3,9,5,'#8a5a2b'); R(1,-3,9,4,'#3b3f46'); R(10,-3,17,2,'#222222'); R(10,0,17,1,'#333333'); R(13,-1,8,3,'#6b4a2b'); break;
    case 'sniper':
      R(-9,-3,10,5,'#2f3b2f'); R(1,-3,11,4,'#2b2f35'); R(12,-2,24,2,'#1a1a1a'); R(8,-9,11,3,'#111111'); R(8,-9,2,3,'#3388cc'); R(18,-9,1,3,'#3388cc');
      R(10,-6,2,3,'#222222'); R(30,0,1,4,'#222222'); R(32,0,1,4,'#222222'); break;
    case 'hmg':
      R(0,-4,18,6,'#3d3d3d'); R(0,-4,18,1,'#777777'); R(18,-3,12,3,'#222222'); R(21,-3,1,3,'#555555'); R(24,-3,1,3,'#555555');
      R(6,2,10,7,'#5a6b3a'); R(7,3,8,1,'#c9b21c'); R(-4,-3,4,4,'#333333'); R(3,-8,10,2,'#222222'); break;
    case 'rocket':
      R(-5,-5,33,8,'#4d5b3a'); R(-5,-5,33,2,'#6f8057'); R(-7,-6,3,10,'#2a2a2a'); R(28,-6,3,10,'#2a2a2a');
      R(8,3,3,6,'#222222'); R(12,-8,5,3,'#222222'); R(2,-1,6,2,'#c9b21c'); break;
    case 'glauncher':
      R(-4,-3,6,4,'#5e3d22'); R(1,-4,12,5,'#4b4b2a'); R(13,-3,13,4,'#222222');
      ctx.fillStyle = '#3a3a22'; ctx.beginPath(); ctx.arc(8,3,5,0,7); ctx.fill(); ctx.strokeStyle = '#777777'; ctx.lineWidth = 1; ctx.stroke();
      R(3,1,3,6,'#222222'); break;
    case 'energy':
      R(0,-4,17,6,'#e8eef2'); R(0,1,17,1,'#9fb3bf'); R(17,-3,8,3,'#2a6f8a'); R(5,-2,7,2,'#2ee6ff'); R(13,-6,3,2,'#9fb3bf'); R(3,2,3,6,'#455a64');
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#2ee6ff'; ctx.beginPath(); ctx.arc(9,-1,8,0,7); ctx.fill(); ctx.globalAlpha = 1; break;
    default: R(0,-3,16,6,'#555555');
  }
}
function drawNadeItem(kind, cx, cy){
  if (kind === 'frag'){
    ctx.fillStyle = '#3f7a3f'; ctx.beginPath(); ctx.arc(cx, cy+1, 5.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a4d2a'; ctx.fillRect(cx-2, cy-7, 4, 3);
    ctx.strokeStyle = '#bbbbbb'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx+1, cy-6); ctx.lineTo(cx+7, cy-3); ctx.stroke();
  } else if (kind === 'gas'){
    ctx.fillStyle = '#c9b21c'; ctx.fillRect(cx-4, cy-6, 8, 12); ctx.fillStyle = '#444444'; ctx.fillRect(cx-4, cy-8, 8, 3); ctx.fillStyle = '#222222'; ctx.fillRect(cx-4, cy-1, 8, 2);
  } else {
    ctx.fillStyle = '#4a4a4a'; ctx.beginPath(); ctx.ellipse(cx, cy+3, 8, 3.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#b5442a'; ctx.fillRect(cx-5, cy, 10, 3); ctx.fillStyle = '#ff3030'; ctx.fillRect(cx-1, cy-3, 2, 2);
  }
}
