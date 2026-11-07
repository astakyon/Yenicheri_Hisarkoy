// ═══════════════════════════════════════════════════════
// ANA GÜNCELLEME
// ═══════════════════════════════════════════════════════
// Kamera: oyuncunun etrafında döner (camYaw). Klavye Z/C döndürür, X sıfırlar; fare sağ tuş sürükleme ve iki parmak burma da camYaw'ı değiştirir.
// Bakış: hareket ederken hareket yönüne, saldırı kilidi sırasında (aimLock) nişan yönüne döner. Saldırı yönü her zaman p.ang (nişan).
function yuzGuncelle(p){
  if(p.face===undefined)p.face=p.ang||0;
  let hedef=null;
  if(p.aimLock>0){p.aimLock--;hedef=p.ang;}else if(p.mdx||p.mdz)hedef=Math.atan2(p.mdz,p.mdx);
  if(hedef!==null){
    let d=hedef-p.face;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
    p.face+=Math.abs(d)<.35?d:(d>0?.35:-.35);
  }
  if(p.mesh)p.mesh.rotation.y=-p.face+Math.PI/2;
}
// Bir oyuncunun görünümü: bakış + yürüyüş/koşu adımı (adım, kat edilen mesafeyle senkron) + saldırı savurması
function oyuncuGoruntuGuncelle(p){
  if(!p.mesh||p.hp<=0)return;
  yuzGuncelle(p);
  const dd=Math.hypot(p.x-(p.lx===undefined?p.x:p.lx),p.z-(p.lz===undefined?p.z:p.lz));p.lx=p.x;p.lz=p.z;
  p.faz=(p.faz||0)+dd*2.6;
  modelAnim(p.mesh,p.faz,dd>.0005?Math.min(1.7,dd/Math.max(.001,p.spd*TIK)):0,p.atkCd>0?1-p.atkCd/22:0,p.ifr>20?(p.ifr-20)/8:0);
}
function kameraGuncelle(){
  if(keys['z'])camYaw-=.035;if(keys['c'])camYaw+=.035;if(keys['x'])camYaw=0;
  const fark=camYaw-camYawS;camYawS+=fark*.25;
  const smooth=Math.max(joyActive?.18:.09,Math.abs(fark)>.01?.3:0);
  const camDist=15*camZoom,camHeight=14*camZoom;
  CAM.position.x+=(pl.x+Math.sin(camYawS)*camDist-CAM.position.x)*smooth;
  CAM.position.y+=(camHeight-CAM.position.y)*smooth;
  CAM.position.z+=((pl.z+Math.cos(camYawS)*camDist)-CAM.position.z)*smooth;
  CAM.lookAt(pl.x,0,pl.z);
  kapatanGuncelle();fenerAta();
}
function update(dt){
  if(!playing||paused||!pl.mesh)return;
  gt++;
  if(currentMap==='gorev'){updateGorev(dt);}
  else if(currentMap==='orman'){updateOrman(dt);}
  else if(currentMap==='maden'){updateMaden(dt);}
  else if(currentMap&&currentMap.startsWith('custom_')){updateCustomMap(dt);}
  else{updateKisla(dt);}
  updateAim();
  WORLD.players.forEach(function(p){if(p.atkCd>0)p.atkCd--;if(p.ifr>0)p.ifr--;});
  // Bakış yönü ve model animasyonu (yalnızca görüntü; simülasyonu etkilemez)
  WORLD.players.forEach(function(p){oyuncuGoruntuGuncelle(p);});
  enemies.forEach(function(e){const dd=Math.hypot(e.x-(e.lx===undefined?e.x:e.lx),e.z-(e.lz===undefined?e.z:e.lz));e.lx=e.x;e.lz=e.z;e.faz=(e.faz||e.id)+dd*3.2;modelAnim(e.mesh,e.faz,Math.min(1.6,dd/Math.max(.001,e.spd||.05)),0,e.hurtT>0?e.hurtT/9:0);});
  const wpnM=pl.mesh.getObjectByName('wpn');if(wpnM)wpnM.material.color.setHex([0xD0D0D0,0x505050,0x8B4513][selWeapon]);
  if(pwrOn){pwr=Math.min(100,pwr+2.4);document.getElementById('pwrFl').style.width=pwr+'%';document.getElementById('pwrW').style.display='block';}
  torches.forEach(function(t){t.phase+=.06;t.light.intensity=2.4+Math.sin(t.phase)*.5+Math.sin(t.phase*1.8)*.2;});
  // Kamera (zoom destekli — camZoom çarpanı yükseklik+mesafeyi orantılı değiştirir)
  kameraGuncelle();
  // HUD
  SESSION.afterTick();
  if(SESSION.peers.size>0){canlandirmaTik();dususGoster(pl.hp<=0,pl.rev||0);}
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
  if(camYawS!==0&&(dx||dz)){const c=Math.cos(camYawS),s=Math.sin(camYawS),wx=dx*c+dz*s,wz=-dx*s+dz*c;dx=wx;dz=wz;}   // W = kameranın baktığı yön (ağa dünya koordinatı gider)
  return {dx:dx,dz:dz,run:!!keys['shift'],aimX:worldAim.x,aimZ:worldAim.z};
}

function movePlayer(p,cmd,dt){
  if(p.hp<=0)return;
  const run=cmd.run&&p.en>1,sp=(run?p.rspd:p.spd)*dt;
  let dx=cmd.dx,dz=cmd.dz;
  const mov=dx||dz;if(mov){const l=Math.hypot(dx,dz);dx/=l;dz/=l;}
  p.mdx=mov?dx:0;p.mdz=mov?dz:0;
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
  if(Math.abs(adx)+Math.abs(adz)>.4){p.ang=Math.atan2(adz,adx);}
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
function clearColliders(){colliders=[];kapatanlar=[];FENER.liste=[];}
// ── Fener havuzu: sahnede en çok FENER_N gerçek PointLight olur (telefonda her ışık her pikseli yavaşlatır).
//    Haritadaki bütün fenerler "sanal" ışıktır; oyuncuya en yakın FENER_N tanesi gerçek ışığa aktarılır.
const FENER_N=5;
const FENER={liste:[],havuz:[]};
function fenerLight(x,y,z,renk,siddet,mesafe){
  const f={x:x,y:y,z:z,color:renk,intensity:siddet,distance:mesafe};FENER.liste.push(f);return f;
}
function fenerAta(){
  if(!S3)return;
  if(FENER.havuz.length!==FENER_N||FENER.havuz[0].parent!==S3){
    FENER.havuz.forEach(function(l){if(l.parent)l.parent.remove(l);});FENER.havuz=[];
    for(let i=0;i<FENER_N;i++){const l=new THREE.PointLight(0xFF9933,0,10);S3.add(l);FENER.havuz.push(l);}
  }
  const L=FENER.liste;
  const sirali=L.length>FENER_N?L.slice().sort(function(a,b){return (a.x-pl.x)*(a.x-pl.x)+(a.z-pl.z)*(a.z-pl.z)-((b.x-pl.x)*(b.x-pl.x)+(b.z-pl.z)*(b.z-pl.z));}):L;
  for(let i=0;i<FENER_N;i++){
    const l=FENER.havuz[i],f=sirali[i];
    if(!f){l.intensity=0;continue;}
    l.position.set(f.x,f.y,f.z);l.color.setHex(f.color);l.intensity=f.intensity;l.distance=f.distance;
  }
}
// ── Bina arkasında saydamlaşma: kamera ile oyuncu arasına giren yüksek yapılar solar ──
let kapatanlar=[];
const _kRay=new THREE.Ray(),_kHedef=new THREE.Vector3(),_kYon=new THREE.Vector3(),_kNokta=new THREE.Vector3();
function kapatanKaydet(o,minH){
  if(!o||!S3)return;
  const b=new THREE.Box3().setFromObject(o);
  if(b.max.y-b.min.y<(minH||3))return;
  const mats=[];o.traverse(function(m){if(m.material&&!m.isSprite)mats.push(m.material);});
  b.expandByVector(new THREE.Vector3(-.2,0,-.2));
  kapatanlar.push({box:b,mats:mats,a:1});
}
function kapatanGuncelle(){
  if(!kapatanlar.length||!CAM||!pl)return;
  _kHedef.set(pl.x,1.4,pl.z);_kYon.subVectors(_kHedef,CAM.position);const L=_kYon.length();_kYon.divideScalar(L||1);
  _kRay.set(CAM.position,_kYon);
  for(let i=0;i<kapatanlar.length;i++){
    const k=kapatanlar[i];
    const hit=_kRay.intersectBox(k.box,_kNokta);
    const hedef=(hit&&CAM.position.distanceTo(_kNokta)<L-.5)?.2:1;
    if(Math.abs(hedef-k.a)<.01)continue;
    k.a+=(hedef-k.a)*.2;
    const sey=k.a<.99;
    for(let j=0;j<k.mats.length;j++){const m=k.mats[j];m.transparent=sey;m.opacity=k.a;m.depthWrite=!sey;}
  }
}

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
  lootGuncelle(magDist,'+Deri 🟤','+Metal ⚙',false);
  loots=loots.filter(function(l){return!l.collected;});
  // Mermiler
  bullets.forEach(function(b){b.mesh.position.x+=b.vx;b.mesh.position.z+=b.vz;b.life--;const bx2=b.mesh.position.x,bz2=b.mesh.position.z;enemies.forEach(function(en){if(Math.hypot(en.x-bx2,en.z-bz2)<1.1&&b.life>0){en.hp-=b.dmg;b.life=0;en.hurtT=9;addFX(en.x,en.z,0xcc2222,4);}});if(b.life<=0)S3.remove(b.mesh);});
  bullets=bullets.filter(function(b){return b.life>0;});
  // Düşmanlar
  enemies.forEach(function(en){
    if(en.hurtT>0){en.hurtT--;modelVurus(en.govde,true);}else modelVurus(en.govde,false,en.isBoss?0x7B0000:0x4a2000);
    const tp=nearestPlayer(en.x,en.z);
    const ex2=tp.x-en.x,ez2=tp.z-en.z,d2=Math.hypot(ex2,ez2);
    if(d2>.5){en.x+=ex2/d2*en.spd;en.z+=ez2/d2*en.spd;en.mesh.position.set(en.x,0,en.z);}
    en.mesh.rotation.y=Math.atan2(ex2,ez2);
    en.hpFl.scale.x=en.hp/en.maxHp;en.hpFl.position.x=(en.hp/en.maxHp-1)*(en.isBoss?.8:.55);
    en.hpBg.lookAt(CAM.position);en.hpFl.lookAt(CAM.position);
    if(d2<1.1&&tp.ifr===0){
      if(tp.ab&&tp.ab.active.f){
        // Demir Kalkan aktif — hasar engeli
        addFX(tp.x,tp.z,0x3498db,4);
      } else {
        const def=getArmorDef(tp);const dmg=(en.isBoss?6:2)*(1-def);
        tp.hp=Math.max(0,tp.hp-dmg);tp.ifr=28;addFX(tp.x,tp.z,0xcc2222,5);
        if(tp.hp<=0)oyuncuOldu(tp);
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
      addXP(xpAmt);kazancDagit(xpAmt);addFame(fameAmt);
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

