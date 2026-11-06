// ═══════════════════════════════════════════════════════
// MADEN TÜNELİ — Eşkıya Madenci AI + Patlama Tuzakları
// ═══════════════════════════════════════════════════════
function spawnEskiya(isBoss){
  const hp=isBoss?260:30+wave*4;
  const size=isBoss?1.3:1;
  const col=isBoss?0x5a1010:0x4a3828;
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(.9*size,1.4*size,.5*size),new THREE.MeshLambertMaterial({color:col}));
  body.position.y=1*size;body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.BoxGeometry(.6*size,.55*size,.55*size),new THREE.MeshLambertMaterial({color:0x8a6048}));
  head.position.y=2*size;g.add(head);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.32*size,8,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:0x2a2018}));
  helmet.position.y=.25*size;head.add(helmet);
  if(isBoss){const crown=new THREE.Mesh(new THREE.ConeGeometry(.45,.5,6),new THREE.MeshLambertMaterial({color:0xFFD700}));crown.position.y=.7*size;head.add(crown);}
  const hpBg=new THREE.Mesh(new THREE.PlaneGeometry(isBoss?1.7:1.0,.13),new THREE.MeshBasicMaterial({color:0x330000,side:THREE.DoubleSide,depthTest:false}));
  hpBg.position.set(0,2.6*size,0);g.add(hpBg);
  const hpFl=new THREE.Mesh(new THREE.PlaneGeometry(isBoss?1.7:1.0,.13),new THREE.MeshBasicMaterial({color:isBoss?0xFFD700:0x22cc55,side:THREE.DoubleSide,depthTest:false}));
  hpFl.position.set(0,2.6*size,.01);g.add(hpFl);

  const spots=isBoss?[[0,-30]]:[[0,18],[0,-4],[-22,-10],[-34,-8],[22,6],[34,8],[-9,4]];
  const sp=spots[Math.floor(Math.random()*spots.length)];
  const ex=sp[0]+(Math.random()-.5)*4,ez=sp[1]+(Math.random()-.5)*4;
  g.position.set(ex,0,ez);S3.add(g);
  enemies.push({id:newNetId(),mesh:g,hpFl,hpBg,hp,maxHp:hp,x:ex,z:ez,spd:isBoss?.045:.05+wave*.004,isBoss,hurtT:0,animalType:'eskiya',aggressive:true,atkDmg:isBoss?10:3,state:'idle',wanderAng:Math.random()*Math.PI*2,wanderT:0,xpReward:isBoss?320:18,goldReward:[10,18]});
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
          if(pl.hp<=0){playing=false;showDeath();}
        }
      });
      trap.mesh.material.opacity=.4;trap.mesh.material.color.setHex(0x1a0a00);
      trap.rearmAt=gt+480;
    }
  });
}


