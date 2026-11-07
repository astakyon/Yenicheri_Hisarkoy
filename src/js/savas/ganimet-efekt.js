// ═══════════════════════════════════════════════════════
// LOOT & FX
// ═══════════════════════════════════════════════════════
function dropLoot(x,z,n){n=n||2;const types=['akce','deri','metal','akce','akce'];for(let i=0;i<n;i++){const t=types[Math.floor(Math.random()*types.length)];const lCol=t==='akce'?0xFFD700:t==='deri'?0x8B4513:0xAAAAAA;const m=modelYap('ganimet_'+t);m.position.set(x+(Math.random()-.5)*2,.3,z+(Math.random()-.5)*2);S3.add(m);loots.push({id:newNetId(),mesh:m,type:t,col:lCol,x:m.position.x,z:m.position.z,vx:(Math.random()-.5)*.08,vz:(Math.random()-.5)*.08,collected:false});}}
function addFX(x,z,fxCol,n){n=n||7;for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.07+Math.random()*.07,4,4),new THREE.MeshBasicMaterial({color:fxCol}));m.position.set(x,.4+Math.random()*.5,z);S3.add(m);const a=Math.random()*Math.PI*2;parts.push({mesh:m,vx:Math.cos(a)*.11,vy:.1+Math.random()*.08,vz:Math.sin(a)*.11,life:20,maxLife:20});}}


// Ganimet: en yakın canlı oyuncu toplar / mıknatıs ona çeker. Yerel oyuncuda eski davranış aynen korunur;
// uzak oyuncunun payı oyuncuya yazılır (p.akce/deri/metal) ve özetle ona bildirilir.
function lootAl(p,l,dY,mY,deriMetal){
  if(l.type==='akce'){const amt=4+Math.floor(Math.random()*7);
    if(p===pl){addPoolGold(amt);akce+=amt;document.getElementById('akceV').textContent=akce;lootPop('+Akçe 🪙');}
    else p.akce=(p.akce||0)+amt;}
  else if(l.type==='deri'){
    if(p===pl){if(deriMetal)metal++;else deri++;lootPop(dY);}
    else if(deriMetal)p.metal=(p.metal||0)+1;else p.deri=(p.deri||0)+1;}
  else{if(p===pl){metal++;lootPop(mY);}else p.metal=(p.metal||0)+1;}
}
function lootGuncelle(magDist,dY,mY,deriMetal){
  loots.forEach(function(l){if(l.collected)return;
    const p=nearestPlayer(l.x,l.z);const d=Math.hypot(p.x-l.x,p.z-l.z);
    if(d<1.3){S3.remove(l.mesh);l.collected=true;lootAl(p,l,dY,mY,deriMetal);addFX(l.x,l.z,l.col,4);}
    else if(d<magDist){l.vx+=(p.x-l.x)/d*.1;l.vz+=(p.z-l.z)/d*.1;l.vx*=.82;l.vz*=.82;}else{l.vx*=.9;l.vz*=.9;}
    l.x+=l.vx;l.z+=l.vz;l.mesh.position.set(l.x,.28+Math.sin(gt*.09+l.x)*.07,l.z);l.mesh.rotation.y+=.05;});
  loots=loots.filter(function(l){return!l.collected;});
}
// Öldürme XP'si uzak oyunculara da yazılır (host kendi SAVE'ine addXP ile alır)
function kazancDagit(xp){WORLD.players.forEach(function(p){if(p!==pl)p.xp=(p.xp||0)+xp;});}
