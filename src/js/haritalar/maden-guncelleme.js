// ═══════════════════════════════════════════════════════
// MADEN TÜNELİ GÜNCELLEME — Karanlık + Fener + Tuzaklar
// ═══════════════════════════════════════════════════════
function updateMaden(dt){
  updateMovement(dt);

  // Oyuncunun feneri her zaman onu takip eder
  if(window._madenPlayerLight){
    window._madenPlayerLight.position.set(pl.x,4.2,pl.z+1.5);
  }

  // Meşale titreşimi
  madenTorches.forEach(function(t){t.phase+=.07;t.light.intensity=2.0+Math.sin(t.phase)*.6+Math.sin(t.phase*2.1)*.3;});

  // Patlama tuzağı kontrolü
  checkMadenTraps();
  madenEtkilesim();

  // Loot manyeti
  const magDist=getMagnetDist();
  lootGuncelle(magDist,'+Bakır ⛏','+Demir ⚙',true);
  loots=loots.filter(function(l){return!l.collected;});

  // Mermiler
  bullets.forEach(function(b){b.mesh.position.x+=b.vx;b.mesh.position.z+=b.vz;b.life--;const bx2=b.mesh.position.x,bz2=b.mesh.position.z;enemies.forEach(function(en){if(Math.hypot(en.x-bx2,en.z-bz2)<1.1&&b.life>0){en.hp-=b.dmg;b.life=0;en.hurtT=9;addFX(en.x,en.z,0xcc2222,4);}});if(b.life<=0)S3.remove(b.mesh);});
  bullets=bullets.filter(function(b){return b.life>0;});

  // ── Eşkıya AI — her zaman saldırgan, karanlıkta oyuncuyu arar ──
  enemies.forEach(function(en){
    if(en.hurtT>0){en.hurtT--;modelVurus(en.govde,true);}
    else{modelVurus(en.govde,false,en.isBoss?0x5a1010:0x4a3828);}
    const tp=nearestPlayer(en.x,en.z);const dx=tp.x-en.x,dz=tp.z-en.z,dist=Math.hypot(dx,dz);
    const detectRange=en.isBoss?30:10; // dar tünellerde sınırlı görüş

    if(dist<detectRange)en.state='attacking';
    else if(en.state==='attacking'&&dist>detectRange+4)en.state='idle';

    if(en.state==='attacking'){
      if(dist>1.4){en.x+=dx/dist*en.spd*1.2;en.z+=dz/dist*en.spd*1.2;}
      en.mesh.rotation.y=Math.atan2(dx,dz);
    }else{
      en.wanderT--;
      if(en.wanderT<=0){en.wanderAng=Math.random()*Math.PI*2;en.wanderT=50+Math.random()*100;}
      en.x+=Math.cos(en.wanderAng)*en.spd*0.25;
      en.z+=Math.sin(en.wanderAng)*en.spd*0.25;
      en.mesh.rotation.y=-en.wanderAng+Math.PI/2;
    }
    en.x=Math.max(-37,Math.min(37,en.x));en.z=Math.max(-37,Math.min(37,en.z));
    en.mesh.position.set(en.x,0,en.z);

    en.hpFl.scale.x=en.hp/en.maxHp;en.hpFl.position.x=(en.hp/en.maxHp-1)*en.hpFl.geometry.parameters.width/2;
    en.hpBg.lookAt(CAM.position);

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

  // Ölen eşkıyalar
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
        transferPool();lootPop('Ocakbaşı Eşkıya Yenildi! Akçeler kışlaya aktarıldı! ⛏');
        showDlg('Ocakbaşı Eşkıya Yenildi!','Madenin en tehlikeli haydudu\nartık tarihe karıştı!\n\nAkçeler kışlaya aktarıldı!','Devam Et',hideDlg);
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
  if(!waveActive&&waveTimer>0){waveTimer--;if(waveTimer===0){wave++;spawnMadenWave(wave);}}

  updateAbilities();
  document.getElementById('gorevT').textContent='Maden '+wave+' — '+kills+' eşkıya — ⛏ Demir+Bakır topla';
  document.getElementById('akceV').textContent=akce;
}


function clearAll(){
  enemies.forEach(function(e){if(S3)S3.remove(e.mesh);});enemies=[];
  bullets.forEach(function(b){if(S3)S3.remove(b.mesh);});bullets=[];
  loots.forEach(function(l){if(S3)S3.remove(l.mesh);});loots=[];
  parts.forEach(function(p){if(S3)S3.remove(p.mesh);});parts=[];
  if(pl.mesh&&S3){S3.remove(pl.mesh);pl.mesh=null;}
}

