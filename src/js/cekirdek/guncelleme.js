// ═══════════════════════════════════════════════════════
// ANA GÜNCELLEME
// ═══════════════════════════════════════════════════════
function update(dt){
  if(!playing||paused||!pl.mesh)return;
  gt++;
  if(currentMap==='gorev'){updateGorev(dt);}
  else if(currentMap==='orman'){updateOrman(dt);}
  else if(currentMap==='maden'){updateMaden(dt);}
  else if(currentMap&&currentMap.startsWith('custom_')){updateCustomMap(dt);}
  else{updateKisla(dt);}
  updateAim();
  if(pl.atkCd>0)pl.atkCd--;if(pl.ifr>0)pl.ifr--;
  const wpnM=pl.mesh.getObjectByName('wpn');if(wpnM)wpnM.material.color.setHex([0xD0D0D0,0x505050,0x8B4513][selWeapon]);
  if(pwrOn){pwr=Math.min(100,pwr+2.4);document.getElementById('pwrFl').style.width=pwr+'%';document.getElementById('pwrW').style.display='block';}
  torches.forEach(function(t){t.phase+=.06;t.light.intensity=2.4+Math.sin(t.phase)*.5+Math.sin(t.phase*1.8)*.2;});
  // Kamera (zoom destekli — camZoom çarpanı yükseklik+mesafeyi orantılı değiştirir)
  const smooth=joyActive?.18:.09;
  const camDist=15*camZoom,camHeight=14*camZoom;
  CAM.position.x+=(pl.x-CAM.position.x)*smooth;
  CAM.position.y+=(camHeight-CAM.position.y)*smooth;
  CAM.position.z+=((pl.z+camDist)-CAM.position.z)*smooth;
  CAM.lookAt(pl.x,0,pl.z);
  // HUD
  SESSION.afterTick();
  document.getElementById('hpf').style.width=(pl.hp/pl.maxHp*100)+'%';document.getElementById('enf').style.width=(pl.en/pl.maxEn*100)+'%';document.getElementById('hpn').textContent=Math.ceil(pl.hp);document.getElementById('enn').textContent=Math.ceil(pl.en);
  drawMM();
}

// Çizim güncellemeden ayrıdır: simülasyon sabit tikle (TIK) çalışır, çizim ekran hızında (ana-dongu.js)
function renderFrame(){REN.render(S3,CAM);}

// Girdi komutu: bir oyuncunun bir tikteki isteği. Yerel oyuncu için klavye/joystick'ten okunur;
// çok oyunculuda uzak oyuncuların komutları ağdan gelecek ve aynı movePlayer'dan geçecek.
function readLocalInput(){
  let dx=0,dz=0;
  if(keys['w']||keys['arrowup'])dz=-1;if(keys['s']||keys['arrowdown'])dz=1;if(keys['a']||keys['arrowleft'])dx=-1;if(keys['d']||keys['arrowright'])dx=1;
  return {dx:dx,dz:dz,run:!!keys['shift'],aimX:worldAim.x,aimZ:worldAim.z};
}

function movePlayer(p,cmd,dt){
  const run=cmd.run&&p.en>1,sp=(run?p.rspd:p.spd)*dt;
  let dx=cmd.dx,dz=cmd.dz;
  const mov=dx||dz;if(mov){const l=Math.hypot(dx,dz);dx/=l;dz/=l;}
  // Önerilen yeni konum
  let nx=Math.max(-(MAP_HALF||28),Math.min((MAP_HALF||28),p.x+dx*sp));
  let nz=Math.max(-(MAP_HALF||28),Math.min((MAP_HALF||28),p.z+dz*sp));
  // Çarpışma kontrolü — X ve Z ekseni ayrı ayrı (duvar boyunca kayma için)
  const r=p.radius||0.45;
  if(!checkCollision(nx,p.z,r)) p.x=nx;
  if(!checkCollision(p.x,nz,r)) p.z=nz;
  if(p.mesh)p.mesh.position.set(p.x,0,p.z);
  if(run&&mov)p.en=Math.max(0,p.en-.42);else if(!mov)p.en=Math.min(p.maxEn,p.en+.48);else p.en=Math.min(p.maxEn,p.en+.20);
  const adx=cmd.aimX-p.x,adz=cmd.aimZ-p.z;
  if(Math.abs(adx)+Math.abs(adz)>.4){p.ang=Math.atan2(adz,adx);if(p.mesh)p.mesh.rotation.y=-p.ang+Math.PI/2;}
}

function updateMovement(dt){
  SESSION.submitLocal(readLocalInput());
  SESSION.step(dt);
  if(joyActive){worldAim.x=pl.x+Math.cos(pl.ang)*20;worldAim.z=pl.z+Math.sin(pl.ang)*20;}
}

// ── ÇARPIŞMA SİSTEMİ (AABB — Axis-Aligned Bounding Box) ──
let colliders=[]; // {x,z,hw,hd} -- merkez + yarı genişlik/derinlik (dikdörtgen) veya {x,z,r} (daire)
function addCollider(x,z,w,d){
  colliders.push({x:x,z:z,hw:w/2,hd:d/2});
}
function addCircleCollider(x,z,r){
  colliders.push({x:x,z:z,r:r});
}
function checkCollision(px,pz,pr){
  for(let i=0;i<colliders.length;i++){
    const c=colliders[i];
    if(c.r!==undefined){
      // Daire-daire çarpışma
      if(Math.hypot(px-c.x,pz-c.z)<(pr+c.r))return true;
    }else{
      // AABB — en yakın noktayı bul, oyuncu yarıçapıyla karşılaştır
      const closestX=Math.max(c.x-c.hw,Math.min(px,c.x+c.hw));
      const closestZ=Math.max(c.z-c.hd,Math.min(pz,c.z+c.hd));
      const distX=px-closestX,distZ=pz-closestZ;
      if((distX*distX+distZ*distZ)<(pr*pr))return true;
    }
  }
  return false;
}
function clearColliders(){colliders=[];}

// ── KIŞLA GÜNCELLEME ──
function updateKisla(dt){
  updateMovement(dt);
  // NPC hafif sallanma
  npcArr.forEach(function(n,i){n.rotation.y=Math.sin(gt*.01+i)*0.15;});
  // Bölge yakınlık kontrolü (sadece etkileşimli bölgeler)
  let nearZ=null;const NEAR=4.5;
  ZONES.forEach(function(z){
    if(!INTERACTABLE_ZONES.includes(z.id))return;
    if(Math.hypot(pl.x-z.dx,pl.z-z.dz)<NEAR)nearZ=z;
  });
  pl.nearZone=nearZ;
  const intH=document.getElementById('intH');
  const zBtn=document.getElementById('zoneBtn');
  if(nearZ){
    intH.textContent='[ E ] '+nearZ.icon+' '+nearZ.name;intH.style.display='block';
    zBtn.innerHTML=nearZ.icon+'<br>Gir';zBtn.style.display='flex';
  }else{intH.style.display='none';zBtn.style.display='none';}
  document.getElementById('gorevT').textContent='Kışla — Geliştir & Hazırlan';
  document.getElementById('gorevB').style.display='block';
}

// ── ÖZEL HARİTA (Editörden çıkan haritalar) — Serbest Keşif Modu ──
function updateCustomMap(dt){
  updateMovement(dt);
  npcArr.forEach(function(n,i){n.rotation.y=Math.sin(gt*.01+i)*0.15;});
  torches.forEach(function(t){t.phase+=.06;t.light.intensity=2.4+Math.sin(t.phase)*.5;});
  document.getElementById('gorevT').textContent='Serbest Keşif Modu';
  document.getElementById('gorevB').style.display='block';
  const intH=document.getElementById('intH');if(intH)intH.style.display='none';
  const zBtn=document.getElementById('zoneBtn');if(zBtn)zBtn.style.display='none';
}

// ── GÖREV GÜNCELLEME ──
function updateGorev(dt){
  updateMovement(dt);
  // Loot manyeti
  const magDist=getMagnetDist();
  loots.forEach(function(l){if(l.collected)return;const d=Math.hypot(pl.x-l.x,pl.z-l.z);
    if(d<1.3){S3.remove(l.mesh);l.collected=true;
      if(l.type==='akce'){const amt=4+Math.floor(Math.random()*7);addPoolGold(amt);akce+=amt;document.getElementById('akceV').textContent=akce;lootPop('+Akçe 🪙');}
      else if(l.type==='deri'){deri++;lootPop('+Deri 🟤');}else{metal++;lootPop('+Metal ⚙');}
      addFX(l.x,l.z,l.col,4);
    }else if(d<magDist){l.vx+=(pl.x-l.x)/d*.1;l.vz+=(pl.z-l.z)/d*.1;l.vx*=.82;l.vz*=.82;}else{l.vx*=.9;l.vz*=.9;}
    l.x+=l.vx;l.z+=l.vz;l.mesh.position.set(l.x,.28+Math.sin(gt*.09+l.x)*.07,l.z);l.mesh.rotation.y+=.05;});
  loots=loots.filter(function(l){return!l.collected;});
  // Mermiler
  bullets.forEach(function(b){b.mesh.position.x+=b.vx;b.mesh.position.z+=b.vz;b.life--;const bx2=b.mesh.position.x,bz2=b.mesh.position.z;enemies.forEach(function(en){if(Math.hypot(en.x-bx2,en.z-bz2)<1.1&&b.life>0){en.hp-=b.dmg;b.life=0;en.hurtT=9;addFX(en.x,en.z,0xcc2222,4);}});if(b.life<=0)S3.remove(b.mesh);});
  bullets=bullets.filter(function(b){return b.life>0;});
  // Düşmanlar
  enemies.forEach(function(en){
    if(en.hurtT>0){en.hurtT--;en.mesh.children[0].material.color.setHex(0xff3333);}else en.mesh.children[0].material.color.setHex(en.isBoss?0x7B0000:0x4a2000);
    const tp=nearestPlayer(en.x,en.z);
    const ex2=tp.x-en.x,ez2=tp.z-en.z,d2=Math.hypot(ex2,ez2);
    if(d2>.5){en.x+=ex2/d2*en.spd;en.z+=ez2/d2*en.spd;en.mesh.position.set(en.x,0,en.z);}
    en.mesh.rotation.y=Math.atan2(ex2,ez2);
    en.hpFl.scale.x=en.hp/en.maxHp;en.hpFl.position.x=(en.hp/en.maxHp-1)*(en.isBoss?.8:.55);
    en.mesh.children[2].lookAt(CAM.position);en.mesh.children[3].lookAt(CAM.position);
    if(d2<1.1&&tp.ifr===0){
      if(tp.ab&&tp.ab.active.f){
        // Demir Kalkan aktif — hasar engeli
        addFX(tp.x,tp.z,0x3498db,4);
      } else {
        const def=getArmorDef(tp);const dmg=(en.isBoss?6:2)*(1-def);
        tp.hp=Math.max(0,tp.hp-dmg);tp.ifr=28;addFX(tp.x,tp.z,0xcc2222,5);
        if(tp.hp<=0&&tp===pl){playing=false;showDeath();}
      }
      tp.ifr=28;
    }
  });
  enemies=enemies.filter(function(en){
    if(en.hp<=0){S3.remove(en.mesh);dropLoot(en.x,en.z,en.isBoss?5:2);kills++;document.getElementById('killV').textContent=kills;
      SAVE.stats.kills=(SAVE.stats.kills||0)+1;
      SAVE.stats.totalGoldEarned=(SAVE.stats.totalGoldEarned||0);
      // XP ve Ün ver
      const xpAmt=en.isBoss?200:10+wave*2;
      const fameAmt=en.isBoss?20:1;
      addXP(xpAmt); addFame(fameAmt);
      // Görev takibi
      trackQuest('kills',1);
      checkAchievements('kills');
      if(en.isBoss){
        SAVE.stats.bossKills=(SAVE.stats.bossKills||0)+1;
        trackQuest('bossKills',1);
        checkAchievements('bossKills');
        transferPool();lootPop('İsyancı Reis Yenildi! Akçeler kışlaya aktarıldı! ✦');
        showDlg('İsyancı Reis Yenildi!','Hisarköy halkı kahramanlığını\nilelebet anacak!\n\nAkçeler kışlaya aktarıldı!','Devam Et',hideDlg);
      }
      return false;}return true;});
  // Partiküller
  parts=parts.filter(function(p){p.mesh.position.x+=p.vx;p.mesh.position.y+=p.vy;p.mesh.position.z+=p.vz;p.vy-=.006;p.vx*=.9;p.vz*=.9;p.life--;p.mesh.material.opacity=p.life/p.maxLife;p.mesh.material.transparent=true;if(p.life<=0){S3.remove(p.mesh);return false;}return true;});
  // Dalga
  if(enemies.length===0&&waveActive){waveActive=false;
    if(wave>(SAVE.stats.highWave||0)){SAVE.stats.highWave=wave;saveGame();}
    // Dalga takibi
    trackQuest('waves',1);
    checkAchievements('waves');
    if(wave%5===0){playing=false;showMilestone();}
    else{waveTimer=170;}
  }
  if(!waveActive&&waveTimer>0){waveTimer--;if(waveTimer===0){wave++;spawnWave(wave);}}
  // Aktif yetenekler güncelle
  updateAbilities();
  document.getElementById('gorevT').textContent='Dalga '+wave+' — '+kills+'/'+(kills+enemies.length)+' Haydut';
  document.getElementById('akceV').textContent=akce;
}

