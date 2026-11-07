// ═══════════════════════════════════════════════════════
// MADEN TÜNELİ — Eşkıya Madenci AI + Patlama Tuzakları
// ═══════════════════════════════════════════════════════
function spawnEskiya(isBoss){
  const hp=isBoss?260:30+wave*4;
  const g=modelYap(isBoss?'eskiya_boss':'eskiya',{cubuk:true});const hpBg=g.userData.hpBg,hpFl=g.userData.hpFl;

  const spots=isBoss?[[0,-30]]:[[0,22],[0,6],[-8,-6],[8,-6],[-22,-6],[-31,-12],[22,-6],[31,-12],[-22,-28],[22,-28]];
  const sp=spots[Math.floor(Math.random()*spots.length)];
  const ex=sp[0]+(Math.random()-.5)*4,ez=sp[1]+(Math.random()-.5)*4;
  g.position.set(ex,0,ez);S3.add(g);
  enemies.push({id:newNetId(),mesh:g,hpFl,hpBg,govde:g.userData.govde,mid:isBoss?'eskiya_boss':'eskiya',hp,maxHp:hp,x:ex,z:ez,spd:isBoss?.045:.05+wave*.004,isBoss,hurtT:0,animalType:'eskiya',aggressive:true,atkDmg:isBoss?10:3,state:'idle',wanderAng:Math.random()*Math.PI*2,wanderT:0,xpReward:isBoss?320:18,goldReward:[10,18]});
}

function spawnMadenWave(n){
  waveActive=true;
  const isBoss=n%5===0;
  const cnt=isBoss?1:3+Math.floor(n*1.4);
  showWave(isBoss?'⚠ OCAKBAŞI EŞKIYA UYANDI!':'⛏ Dalga '+n+' — '+cnt+' Eşkıya');
  for(let i=0;i<cnt;i++)spawnEskiya(isBoss&&i===0);
}

function checkMadenTraps(){
  madenTraps.forEach(function(trap){
    if(trap.triggered){
      // 8 sn sonra (480 tik) yeniden kurulur; tik sayacı duraklatmada da durur
      if(gt>=trap.rearmAt){trap.triggered=false;trap.mesh.material.opacity=0;}
      return;
    }
    // Menzildeki herhangi bir oyuncu tuzağı tetikler; patlama menzildeki herkese hasar verir
    const hit=[];
    WORLD.players.forEach(function(p){if(p.hp>0&&Math.hypot(p.x-trap.x,p.z-trap.z)<trap.r)hit.push(p);});
    if(hit.length){
      trap.triggered=true;
      addFX(trap.x,trap.z,0xFF6600,16);
      const flash=new THREE.PointLight(0xFF6600,8,12);flash.position.set(trap.x,1,trap.z);S3.add(flash);
      setTimeout(()=>S3.remove(flash),200);
      hit.forEach(function(p){
        const dmg=18*(1-getArmorDef(p));
        p.hp=Math.max(0,p.hp-dmg);
        if(p===pl){
          lootPop('💥 Patlama tuzağı! -'+Math.round(dmg)+' Can');
        }
        if(p.hp<=0)oyuncuOldu(p);
      });
      trap.mesh.material.opacity=.4;trap.mesh.material.color.setHex(0x1a0a00);
      trap.rearmAt=gt+480;
    }
  });
}


