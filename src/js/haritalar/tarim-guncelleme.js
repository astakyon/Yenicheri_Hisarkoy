// ═══════════════════════════════════════════════════════
// TARIM OVASI — Köylü + Eşkıya baskını AI ve güncelleme (v1.61)
// ═══════════════════════════════════════════════════════
function tarimCik(){
  if(currentMap!=='tarim'||pl.hp<=0)return;
  transferPool();
  BEGIN('kisla');
}

function spawnTarimEskiya(isBoss,kenar){
  const hp=isBoss?260:30+wave*4;
  const g=modelYap(isBoss?'eskiya_boss':'eskiya',{cubuk:true});const hpBg=g.userData.hpBg,hpFl=g.userData.hpFl;
  const sp=kenar||TARIM_BASKIN[Math.floor(Math.random()*TARIM_BASKIN.length)];
  const ex=sp[0]+(Math.random()-.5)*3,ez=sp[1]+(Math.random()-.5)*3;
  g.position.set(ex,0,ez);S3.add(g);
  enemies.push({id:newNetId(),mesh:g,hpFl,hpBg,govde:g.userData.govde,mid:isBoss?'eskiya_boss':'eskiya',hp,maxHp:hp,x:ex,z:ez,spd:isBoss?.036:.03+wave*.002,isBoss,hurtT:0,animalType:'eskiya',aggressive:true,atkDmg:isBoss?10:3,state:'attacking',wanderAng:0,wanderT:0,xpReward:isBoss?320:18,goldReward:[10,18]});
}

const TARIM_YON=['kuzeybatıdan','kuzeyden','kuzeydoğudan','batıdan','doğudan','güneybatıdan','güneydoğudan'];
// Baskın uyarıyla ve tek tek gelir: ilk eşkıya 4 sn sonra, sonrakiler ~1.7 sn arayla aynı yönden
function spawnTarimWave(n){
  waveActive=true;
  tarimTahilYenile();
  const isBoss=n%5===0;
  const cnt=isBoss?3:2+Math.floor(n*.8);
  const yon=Math.floor(Math.random()*TARIM_BASKIN.length);
  showWave(isBoss?'⚠ EŞKIYA BAŞI '+TARIM_YON[yon]+' geliyor!':'🌾 Baskın '+n+' — '+cnt+' eşkıya '+TARIM_YON[yon]+' geliyor');
  for(let i=0;i<cnt;i++)tarimKuyruk.push({t:240+i*100,boss:isBoss&&i===0,nokta:TARIM_BASKIN[yon]});
}

function tarimKoyluGuncelle(){
  const canli=tarimKoyluler.filter(function(k){return k.hp>0;});
  tarimKoyluler.forEach(function(k){
    if(k.hp<=0)return;
    // en yakın eşkıya
    let en0=null,ed=7;enemies.forEach(function(en){const d=Math.hypot(en.x-k.x,en.z-k.z);if(d<ed){ed=d;en0=en;}});
    // köylü de kendini savunur: yanındaki eşkıyaya tırmıkla vurur
    if(en0&&ed<2){k.vurT=(k.vurT||0)-1;if(k.vurT<=0){k.vurT=40;en0.hp-=2;en0.hurtT=9;addFX(en0.x,en0.z,0xFFD24A,3);}}
    let vx=0,vz=0;
    if(k.donuk){/* köşeye sıkışmış / test */}
    else if(en0){const dx=k.x-en0.x,dz=k.z-en0.z,d=Math.hypot(dx,dz)||1;vx=dx/d*.075;vz=dz/d*.075;k.ang=Math.atan2(vz,vx);}   // kaç
    else{
      k.t--;if(k.t<=0){k.ang=Math.random()*Math.PI*2;k.t=60+Math.random()*90;}
      const hd=Math.hypot(k.hx-k.x,k.hz-k.z);
      if(hd>5){k.ang=Math.atan2(k.hz-k.z,k.hx-k.x);}
      vx=Math.cos(k.ang)*.02;vz=Math.sin(k.ang)*.02;
    }
    const nx=k.x+vx,nz=k.z+vz;
    if(!tarimCarpisir(nx,k.z))k.x=nx;
    if(!tarimCarpisir(k.x,nz))k.z=nz;
    k.x=Math.max(-44,Math.min(44,k.x));k.z=Math.max(-44,Math.min(44,k.z));
    k.mesh.position.set(k.x,0,k.z);if(vx||vz)k.mesh.rotation.y=Math.atan2(vx,vz);
    k.fl.scale.x=Math.max(.001,k.hp/k.maxHp);k.fl.position.x=(k.hp/k.maxHp-1)*.6;
    k.bg.lookAt(CAM.position);k.fl.lookAt(CAM.position);
  });
  return canli.length;
}
// Köylü için basit çarpışma sınaması (colliders: kutu {x,z,w,d} ya da daire {x,z,r})
function tarimCarpisir(x,z){
  for(let i=0;i<colliders.length;i++){
    const c=colliders[i];
    if(c.r!==undefined){if(Math.hypot(x-c.x,z-c.z)<c.r+.4)return true;}
    else if(Math.abs(x-c.x)<c.w/2+.4&&Math.abs(z-c.z)<c.d/2+.4)return true;
  }
  return false;
}

function tarimEtkilesim(){
  const intH=document.getElementById('intH'),zBtn=document.getElementById('zoneBtn');
  if(window._tarimHalka)window._tarimHalka.material.opacity=.5+Math.sin(gt*.08)*.2;
  tarimTahillar.forEach(function(t){if(!t.alindi){t.mesh.rotation.y+=.04;t.mesh.position.y=.9+Math.sin(gt*.07+t.x)*.1;}});
  if(Math.hypot(pl.x-TARIM_CIKIS.x,pl.z-TARIM_CIKIS.z)<3.8){
    pl.nearZone=TARIM_CIKIS;intH.textContent='[ E ] 🏰 Ovadan Çık — kazanç kışlaya aktarılır';intH.style.display='block';zBtn.innerHTML='🏰<br>Çık';zBtn.style.display='flex';return;
  }
  pl.nearZone=null;zBtn.style.display='none';intH.style.display='none';
}

function tarimTahilTopla(){
  tarimTahillar.forEach(function(t){
    if(t.alindi)return;
    const p=nearestPlayer(t.x,t.z);
    if(Math.hypot(p.x-t.x,p.z-t.z)<1.6){
      t.alindi=true;S3.remove(t.mesh);addFX(t.x,t.z,0xFFD24A,5);
      if(p===pl){
        const amt=3+Math.floor(Math.random()*4);
        addPoolGold(amt);akce+=amt;tarimTahilSayac++;
        SAVE.stats.tahil=(SAVE.stats.tahil||0)+1;
        document.getElementById('akceV').textContent=akce;lootPop('+Tahıl 🌾');
      }else p.akce=(p.akce||0)+3;
    }
  });
  tarimTahillar=tarimTahillar.filter(function(t){return!t.alindi;});
}

function tarimKoyYandi(){
  playing=false;losePool();
  showDlg('Köy Yandı!','Tüm köylüler düştü.\nBu seferki akçeler kaybedildi.\nBir dahaki sefere daha erken müdahale et.','Kışlaya Dön',function(){hideDlg();BEGIN('kisla');});
}

function updateTarim(dt){
  updateMovement(dt);
  tarimEtkilesim();
  tarimTahilTopla();
  const canli=tarimKoyluGuncelle();
  tarimKuyruk=tarimKuyruk.filter(function(q){q.t--;if(q.t<=0){spawnTarimEskiya(q.boss,q.nokta);return false;}return true;});

  const magDist=getMagnetDist();
  lootGuncelle(magDist,'+Deri','+Metal',false);
  loots=loots.filter(function(l){return!l.collected;});

  bullets.forEach(function(b){b.mesh.position.x+=b.vx;b.mesh.position.z+=b.vz;b.life--;const bx2=b.mesh.position.x,bz2=b.mesh.position.z;enemies.forEach(function(en){if(Math.hypot(en.x-bx2,en.z-bz2)<1.1&&b.life>0){en.hp-=b.dmg;b.life=0;en.hurtT=9;addFX(en.x,en.z,0xcc2222,4);}});if(b.life<=0)S3.remove(b.mesh);});
  bullets=bullets.filter(function(b){return b.life>0;});

  // ── Eşkıya AI: en yakın köylüye ya da oyuncuya saldırır ──
  enemies.forEach(function(en){
    if(en.hurtT>0){en.hurtT--;modelVurus(en.govde,true);}
    else{modelVurus(en.govde,false,en.isBoss?0x5a1010:0x4a3828);}
    const tp=nearestPlayer(en.x,en.z);
    let hedefK=null,hd=1e9;
    tarimKoyluler.forEach(function(k){if(k.hp<=0)return;const d=Math.hypot(k.x-en.x,k.z-en.z);if(d<hd){hd=d;hedefK=k;}});
    const pd=Math.hypot(tp.x-en.x,tp.z-en.z);
    const oyuncuHedef=!hedefK||(pd<hd&&pd<10);
    const tx=oyuncuHedef?tp.x:hedefK.x,tz=oyuncuHedef?tp.z:hedefK.z;
    const dx=tx-en.x,dz=tz-en.z,dist=Math.hypot(dx,dz)||1;
    if(dist>1.4){
      const nx=en.x+dx/dist*en.spd*1.2,nz=en.z+dz/dist*en.spd*1.2;
      if(!tarimCarpisir(nx,en.z))en.x=nx;if(!tarimCarpisir(en.x,nz))en.z=nz;
      // engele takılırsa yana kay
      if(tarimCarpisir(en.x+dx/dist*.2,en.z+dz/dist*.2)){en.x+=-dz/dist*en.spd;en.z+=dx/dist*en.spd;}
    }
    en.mesh.rotation.y=Math.atan2(dx,dz);
    en.x=Math.max(-45,Math.min(45,en.x));en.z=Math.max(-45,Math.min(45,en.z));
    en.mesh.position.set(en.x,0,en.z);
    en.hpFl.scale.x=en.hp/en.maxHp;en.hpFl.position.x=(en.hp/en.maxHp-1)*en.hpFl.geometry.parameters.width/2;
    en.hpBg.lookAt(CAM.position);

    if(dist<1.7){
      en.vurT=(en.vurT||0)-1;
      if(oyuncuHedef){
        if(tp.ifr===0){
          if(tp.ab&&tp.ab.active.f){addFX(tp.x,tp.z,0x3498db,4);}
          else{const dmg=(en.atkDmg||3)*(1-getArmorDef(tp));tp.hp=Math.max(0,tp.hp-dmg);addFX(tp.x,tp.z,0xcc2222,5);if(tp.hp<=0)oyuncuOldu(tp);}
          tp.ifr=28;
        }
      }else if(en.vurT<=0){
        en.vurT=50;hedefK.hp-=(en.atkDmg||3);addFX(hedefK.x,hedefK.z,0xcc2222,5);
        if(hedefK.hp<=0){S3.remove(hedefK.mesh);lootPop('☠ Bir köylü düştü! ('+(tarimKoyluler.filter(function(k){return k.hp>0;}).length)+' kaldı)');}
      }
    }
  });

  enemies=enemies.filter(function(en){
    if(en.hp<=0){
      S3.remove(en.mesh);
      dropLoot(en.x,en.z,en.isBoss?6:2);
      kills++;document.getElementById('killV').textContent=kills;
      SAVE.stats.kills=(SAVE.stats.kills||0)+1;
      addXP(en.xpReward||18);kazancDagit(en.xpReward||18);addFame(en.isBoss?25:1);
      trackQuest('kills',1);checkAchievements('kills');
      if(en.isBoss){
        SAVE.stats.bossKills=(SAVE.stats.bossKills||0)+1;
        trackQuest('bossKills',1);checkAchievements('bossKills');
        transferPool();lootPop('Eşkıya Başı Yenildi! Akçeler kışlaya aktarıldı! 🌾');
        showDlg('Eşkıya Başı Yenildi!','Ova artık güvende.\nKöylüler sana minnettar!\n\nAkçeler kışlaya aktarıldı!','Devam Et',hideDlg);
      }
      return false;
    }
    return true;
  });

  parts=parts.filter(function(p){p.mesh.position.x+=p.vx;p.mesh.position.y+=p.vy;p.mesh.position.z+=p.vz;p.vy-=.006;p.vx*=.9;p.vz*=.9;p.life--;p.mesh.material.opacity=p.life/p.maxLife;p.mesh.material.transparent=true;if(p.life<=0){S3.remove(p.mesh);return false;}return true;});

  if(canli===0&&playing){tarimKoyYandi();return;}

  if(enemies.length===0&&tarimKuyruk.length===0&&waveActive){
    waveActive=false;
    // Hayatta kalan her köylü için şükran armağanı
    const bonus=canli*6;if(bonus>0){addPoolGold(bonus);akce+=bonus;lootPop('🌾 '+canli+' köylü hayatta: +'+bonus+' Akçe');}
    tarimKoyluler.forEach(function(k){if(k.hp>0)k.hp=Math.min(k.maxHp,k.hp+15);});
    if(wave>(SAVE.stats.highWave||0)){SAVE.stats.highWave=wave;saveGame();}
    trackQuest('waves',1);checkAchievements('waves');
    if(wave%5===0){playing=false;showMilestone();}
    else{waveTimer=170;}
  }
  if(!waveActive&&waveTimer>0){waveTimer--;if(waveTimer===0){wave++;spawnTarimWave(wave);}}

  updateAbilities();
  document.getElementById('gorevT').textContent='Ova '+wave+' — 🧑‍🌾 '+canli+'/'+tarimKoyluler.length+' köylü — 🌾 '+tarimTahilSayac+' tahıl';
  document.getElementById('akceV').textContent=akce;
}
