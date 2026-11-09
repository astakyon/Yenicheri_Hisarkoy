// ═══════════════════════════════════════════════════════
// AV ORMANI GÜNCELLEME — Sessiz Yaklaşma + İz Takibi AI
// ═══════════════════════════════════════════════════════
function updateOrman(dt){
  const wasRunning=keys['shift']&&pl.en>1;
  const moved=keys['w']||keys['s']||keys['a']||keys['d']||keys['arrowup']||keys['arrowdown']||keys['arrowleft']||keys['arrowright'];
  updateMovement(dt);

  // Gürültü: koşmak/saldırmak arttırır, durmak/yürümek azaltır
  if(wasRunning&&moved) makeNoise(0.012);
  else if(moved) makeNoise(0.003);
  huntNoise=Math.max(0,huntNoise-0.004);

  // İz bırak (sadece hareket halindeyken)
  if(moved) dropTrack(pl.x,pl.z);
  animalTracks=animalTracks.filter(function(t){t.life--;if(t.mesh.material)t.mesh.material.opacity=Math.max(0,t.life/240*0.5);if(t.life<=0){S3.remove(t.mesh);return false;}return true;});

  // Loot manyeti (aynı görev sistemi)
  const magDist=getMagnetDist();
  lootGuncelle(magDist,'+Deri 🟤','+Et 🍖',false);
  loots=loots.filter(function(l){return!l.collected;});

  // Mermiler (ok-yay öncelikli av silahı)
  bullets.forEach(function(b){b.mesh.position.x+=b.vx;b.mesh.position.z+=b.vz;b.life--;const bx2=b.mesh.position.x,bz2=b.mesh.position.z;enemies.forEach(function(en){if(Math.hypot(en.x-bx2,en.z-bz2)<1.1&&b.life>0){en.hp-=b.dmg;b.life=0;en.hurtT=9;en.state='fleeing';addFX(en.x,en.z,0xcc2222,4);makeNoise(0.08);}});if(b.life<=0)S3.remove(b.mesh);});
  bullets=bullets.filter(function(b){return b.life>0;});

  // ── Hayvan AI ──
  enemies.forEach(function(en){
    if(en.hurtT>0){en.hurtT--;modelVurus(en.govde,true);}
    else {
      const def=ANIMAL_DEFS[en.animalType]||{col:0x3a2810};
      modelVurus(en.govde,false,en.isBoss?0x3a2810:def.col);
    }
    const tp=nearestPlayer(en.x,en.z);const dx=tp.x-en.x,dz=tp.z-en.z,dist=Math.hypot(dx,dz);

    // Durum makinesi
    if(en.isBoss){
      // Boss her zaman saldırgan, gürültüden etkilenmez
      en.state=dist<24?'attacking':'idle';
    } else if(en.aggressive){
      // Saldırgan hayvanlar (kurt/domuz): yakına gelince saldırır
      if(dist<5.5) en.state='attacking';
      else if(dist<en.fleeRange+huntNoise*8&&Math.random()<en.detectNoise*0.04) en.state='alert';
      else if(en.state==='alert'&&dist>en.fleeRange+4) en.state='idle';
    } else {
      // Ürkek hayvanlar (geyik): gürültü+mesafeye göre kaçar
      const detectDist=en.fleeRange+huntNoise*10;
      if(dist<detectDist){en.state='fleeing';}
      else if(en.state==='fleeing'&&dist>detectDist+5){en.state='idle';}
    }

    // Hareket
    if(en.state==='attacking'){
      if(dist>1.3){en.x+=dx/dist*en.spd*1.3;en.z+=dz/dist*en.spd*1.3;}
      en.mesh.rotation.y=Math.atan2(dx,dz);
    } else if(en.state==='fleeing'){
      if(dist>0.1){en.x-=dx/dist*en.fleeSpd;en.z-=dz/dist*en.fleeSpd;}
      en.mesh.rotation.y=Math.atan2(-dx,-dz);
    } else if(en.state==='alert'){
      // Tetikte — dur, izle
      en.mesh.rotation.y=Math.atan2(dx,dz);
    } else {
      // idle — rastgele dolaş
      en.wanderT--;
      if(en.wanderT<=0){en.wanderAng=Math.random()*Math.PI*2;en.wanderT=60+Math.random()*120;}
      en.x+=Math.cos(en.wanderAng)*en.spd*0.3;
      en.z+=Math.sin(en.wanderAng)*en.spd*0.3;
      en.mesh.rotation.y=-en.wanderAng+Math.PI/2;
    }
    // Sınır içinde tut
    en.x=Math.max(-44,Math.min(44,en.x));en.z=Math.max(-44,Math.min(44,en.z));
    en.mesh.position.set(en.x,0,en.z);

    en.hpFl.scale.x=en.hp/en.maxHp;en.hpFl.position.x=(en.hp/en.maxHp-1)*en.hpFl.geometry.parameters.width/2;
    en.hpBg.lookAt(CAM.position);

    // Saldırı hasarı
    if(en.state==='attacking'&&dist<1.6&&tp.ifr===0){
      if(tp.ab&&tp.ab.active.f){addFX(tp.x,tp.z,0x3498db,4);}
      else{
        const armorDef=getArmorDef(tp);const dmg=(en.atkDmg||3)*(1-armorDef);
        tp.hp=Math.max(0,tp.hp-dmg);tp.ifr=28;addFX(tp.x,tp.z,0xcc2222,5);
        if(tp.hp<=0)oyuncuOldu(tp);
      }
      tp.ifr=28;
    }
  });

  // Ölen hayvanlar
  enemies=enemies.filter(function(en){
    if(en.hp<=0){
      S3.remove(en.mesh);
      dropLoot(en.x,en.z,en.isBoss?6:2);
      kills++;document.getElementById('killV').textContent=kills;
      SAVE.stats.kills=(SAVE.stats.kills||0)+1;
      SAVE.stats.animalsHunted=(SAVE.stats.animalsHunted||0)+1;hikayeOrtakKredi('av');
      addXP(en.xpReward||14);kazancDagit(en.xpReward||14);addFame(en.isBoss?25:1);
      trackQuest('kills',1);checkAchievements('kills');
      if(en.isBoss){
        SAVE.stats.bossKills=(SAVE.stats.bossKills||0)+1;
        trackQuest('bossKills',1);checkAchievements('bossKills');
        transferPool();lootPop('Koca Ayı Avlandı! Akçeler kışlaya aktarıldı! 🐻');
        showDlg('Koca Ayı Avlandı!','Bu ormanın en tehlikeli avı\nartık tarihe karıştı!\n\nAkçeler kışlaya aktarıldı!','Devam Et',hideDlg);
      }
      return false;
    }
    return true;
  });

  // Partiküller
  parts=parts.filter(function(p){p.mesh.position.x+=p.vx;p.mesh.position.y+=p.vy;p.mesh.position.z+=p.vz;p.vy-=.006;p.vx*=.9;p.vz*=.9;p.life--;p.mesh.material.opacity=p.life/p.maxLife;p.mesh.material.transparent=true;if(p.life<=0){S3.remove(p.mesh);return false;}return true;});

  // Dalga
  if(enemies.length===0&&waveActive){
    waveActive=false;
    if(wave>(SAVE.stats.highWave||0)){SAVE.stats.highWave=wave;saveGame();}
    trackQuest('waves',1);checkAchievements('waves');
    if(wave%5===0){playing=false;showMilestone();}
    else{waveTimer=170;}
  }
  if(!waveActive&&waveTimer>0){waveTimer--;if(waveTimer===0){wave++;spawnOrmanWave(wave);}}

  updateAbilities();
  const noiseLbl=huntNoise>0.5?'🔴 Gürültülü':huntNoise>0.2?'🟡 Dikkatli':'🟢 Sessiz';
  document.getElementById('gorevT').textContent='Av '+wave+' — '+kills+' avlandı — '+noiseLbl;
  document.getElementById('akceV').textContent=akce;
}

