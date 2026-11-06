// ═══════════════════════════════════════════════════════
// WORLD AIM
// ═══════════════════════════════════════════════════════
function updateAim(){
  if(joyActive){worldAim.x=pl.x+Math.cos(pl.ang)*20;worldAim.z=pl.z+Math.sin(pl.ang)*20;return;}
  if(!REN||!RC||!GP||!CAM)return;
  const rect=document.getElementById('c3d').getBoundingClientRect();
  const nx=((mousePos.x-rect.left)/rect.width)*2-1;
  const ny=-((mousePos.y-rect.top)/rect.height)*2+1;
  RC.setFromCamera({x:nx,y:ny},CAM);const t=new THREE.Vector3();
  if(RC.ray.intersectPlane(GP,t)){worldAim.x=t.x;worldAim.z=t.z;}
}

