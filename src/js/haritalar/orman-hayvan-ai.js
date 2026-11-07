// ═══════════════════════════════════════════════════════
// HAYVAN AI — Sessiz Yaklaşma + İz Takibi
// ═══════════════════════════════════════════════════════
const ANIMAL_DEFS={
  geyik:{name:'Geyik',hp:24,spd:.04,fleeSpd:.11,col:0x8B6030,size:.85,xp:14,gold:[6,12],fleeRange:9,detectNoise:0.4},
  kurt:{name:'Kurt',hp:40,spd:.05,fleeSpd:.09,col:0x4a4a4a,size:.95,xp:22,gold:[8,16],fleeRange:7,detectNoise:0.55,aggressive:true,atkDmg:3},
  domuz:{name:'Yaban Domuzu',hp:55,spd:.045,fleeSpd:.085,col:0x5a3a20,size:1.05,xp:28,gold:[10,20],fleeRange:6,detectNoise:0.6,aggressive:true,atkDmg:4},
};
let huntNoise=0; // 0-1 arası, hareket/saldırı arttırır, zamanla azalır
let animalTracks=[]; // İz parçacıkları

function spawnAnimal(type,isBoss){
  type=type||['geyik','geyik','kurt','domuz'][Math.floor(Math.random()*4)];
  const def=isBoss?{name:'Koca Ayı',hp:220,spd:.05,fleeSpd:.05,col:0x3a2810,size:1.7,xp:300,gold:[80,140],fleeRange:0,detectNoise:1,aggressive:true,atkDmg:9}:ANIMAL_DEFS[type];
  const mid=isBoss?'ayi':type;
  const g=modelYap(mid,{cubuk:true});const hpBg=g.userData.hpBg,hpFl=g.userData.hpFl;

  const a=Math.random()*Math.PI*2,dist=20+Math.random()*18;
  const ex=Math.cos(a)*dist,ez=Math.sin(a)*dist;
  g.position.set(ex,0,ez);S3.add(g);
  enemies.push({id:newNetId(),
    mesh:g,hpFl:hpFl,hpBg:hpBg,govde:g.userData.govde,mid:mid,hp:def.hp,maxHp:def.hp,x:ex,z:ez,
    spd:def.spd,fleeSpd:def.fleeSpd,isBoss:!!isBoss,hurtT:0,
    animalType:isBoss?'ayi':type,aggressive:!!def.aggressive,atkDmg:def.atkDmg||0,
    state:'idle', // idle | alert | fleeing | attacking
    fleeRange:def.fleeRange,detectNoise:def.detectNoise,
    xpReward:def.xp,goldReward:def.gold,
    wanderAng:Math.random()*Math.PI*2,wanderT:0,
  });
}

function spawnOrmanWave(n){
  waveActive=true;
  const isBoss=n%5===0;
  const cnt=isBoss?1:3+Math.floor(n*1.5);
  showWave(isBoss?'⚠ BÜYÜK AV — Koca Ayı Uyandı!':'🏹 Av '+n+' — '+cnt+' Hayvan');
  for(let i=0;i<cnt;i++)spawnAnimal(null,isBoss&&i===0);
}

// Gürültü üret (koşma/saldırı) — hayvanları uyarır
function makeNoise(amount){huntNoise=Math.min(1,huntNoise+amount);}

// İz bırak (oyuncunun yakınındaki hayvanlar için görsel ipucu)
function dropTrack(x,z){
  if(Math.random()>0.3)return; // her adımda değil, ara sıra
  const t=new THREE.Mesh(new THREE.CircleGeometry(.12,6),new THREE.MeshBasicMaterial({color:0x3a2818,transparent:true,opacity:.5}));
  t.rotation.x=-Math.PI/2;t.position.set(x+(Math.random()-.5)*.6,.02,z+(Math.random()-.5)*.6);
  S3.add(t);animalTracks.push({mesh:t,life:240});
}

