// ═══════════════════════════════════════════════════════
// YABANCI ŞEHİR + OSMANLI SARAYI — dalga/boss haritaları (v1.73)
// Şehir: sokak çetelerini dağıt, hazine sandıklarını topla, Çete Reisi'ni yen.
// Saray: saray muhafızı dalgalarını püskürt, Hain Vezir'i durdur.
// İki harita da aynı motoru kullanır; fark DM_AYAR içindedir.
// ═══════════════════════════════════════════════════════
const DM_AYAR={
  sehir:{ad:'Yabancı Şehir',ikon:'🏙',ust:'🏙 YABANCI ŞEHİR — Tehlikeli Sokaklar',gorev:'Sokak çetelerini dağıt, Çete Reisi\'ni yen!',
    dalga:5,kapilar:[[-34,-34],[34,-34],[-35,2],[35,2],[0,-36]],bas:[0,32],cikis:{id:'dalgaCikis',icon:'🏰',name:'Şehirden Çık',x:0,z:35.5},
    renk:0x4a3a6a,bossRenk:0x2a1a4a,bossAd:'Çete Reisi',hp:function(w){return 24+w*4;},bossHp:260,dmg:3,bossDmg:9,say:function(n){return 2+n;},
    xp:20,bossXp:400,hazine:[[-30,18],[30,18],[-30,-14],[30,-14],[0,-24],[-18,-30]],hazineAltin:[15,30],fame:30},
  saray:{ad:'Osmanlı Sarayı',ikon:'👑',ust:'👑 OSMANLI SARAYI — Hain Vezir',gorev:'Muhafızları püskürt, Hain Vezir\'i durdur!',
    dalga:6,kapilar:[[-30,-34],[30,-34],[0,-36],[-35,-10],[35,-10]],bas:[0,32],cikis:{id:'dalgaCikis',icon:'🏰',name:'Saraydan Çık',x:0,z:35.5},
    renk:0x8a1a2a,bossRenk:0x1a1a3a,bossAd:'Hain Vezir',hp:function(w){return 30+w*4;},bossHp:450,dmg:3.5,bossDmg:11,say:function(n){return 3+Math.floor(n*1.2);},
    xp:26,bossXp:900,hazine:[[-30,28],[30,28],[-30,-26],[30,-26]],hazineAltin:[25,45],fame:60}
};
let dmKuyruk=[],dmHazine=[],dmBitti=false,dmSayac=0,dmHalka=null;
function dmAyar(){return DM_AYAR[currentMap];}

function dmCarpisir(x,z){return tarimCarpisir(x,z);}

// ── SAHNE ──
function dmIsik(gokRenk,sisRenk,sis0,sis1,gunes){
  clearScene();
  S3.fog=new THREE.Fog(sisRenk,sis0,sis1);S3.background=new THREE.Color(gokRenk);
  const sun=new THREE.DirectionalLight(gunes,.8);sun.position.set(-20,34,14);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;S3.add(sun);
  S3.add(new THREE.AmbientLight(0xE8DCC8,.38));S3.add(new THREE.HemisphereLight(gokRenk,0x6a5a40,.2));
}
function dmZemin(renk){
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshLambertMaterial({color:renk}));
  gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;S3.add(gnd);
}
function dmDuz(x,z,w,d,renk,y){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshLambertMaterial({color:renk}));m.rotation.x=-Math.PI/2;m.position.set(x,y||.015,z);m.receiveShadow=true;S3.add(m);return m;}
function dmSinir(renk){
  MAP_HALF=38;
  bx(0,2.5,-38,78,5,1.5,renk,null,true);bx(0,2.5,38,78,5,1.5,renk,null,true);
  bx(-38,2.5,0,1.5,5,78,renk,null,true);bx(38,2.5,0,1.5,5,78,renk,null,true);
}
function dmCikisHalka(c){
  const h=new THREE.Mesh(new THREE.RingGeometry(1.7,2.4,32),new THREE.MeshBasicMaterial({color:0x66ff99,transparent:true,opacity:.65,side:THREE.DoubleSide}));
  h.rotation.x=-Math.PI/2;h.position.set(c.x,.06,c.z);S3.add(h);dmHalka=h;
  S3.add(madenYaziSprite('⬇ ÇIKIŞ — KIŞLA',0x66ff99,c.x,3.4,c.z));
}
function dmHazineKur(){
  dmHazine=[];
  const a=dmAyar(),geo=new THREE.BoxGeometry(1.1,.8,.8),mat=new THREE.MeshLambertMaterial({color:0xD4A82A,emissive:0x6a4a00,emissiveIntensity:.45});
  a.hazine.forEach(function(p){const m=new THREE.Mesh(geo,mat);m.position.set(p[0],.5,p[1]);S3.add(m);dmHazine.push({x:p[0],z:p[1],mesh:m,alindi:false});});
}

function buildSehir(){
  dmIsik(0xe6c79a,0xd9b98a,40,105,0xFFE2B0);
  dmZemin(0x7a7260);
  dmDuz(0,0,9,76,0x6e685c);dmDuz(0,-4,76,8,0x6e685c);dmDuz(0,-8,16,16,0x9a927e,.02);
  dmDuz(0,-37,80,6,0x2a6a9a,.03);   // liman suyu
  dmSinir(0x6a5a48);
  [[-14,24],[14,24],[-26,24],[26,24],[-14,12],[14,12],[-26,12],[26,12],[-14,-22],[14,-22],[-26,-22],[26,-22],[-27,-4],[27,-4]].forEach(function(e){yapiKoy('yapi_ev',e[0],e[1],{w:6,d:5},[6,5]);});
  [[-9,-14],[9,-14],[-9,-2],[9,-2]].forEach(function(p){yapiKoy('yapi_dukkan',p[0],p[1],{w:6,d:3},[6,2.6]);});
  const cesme=modelYap('cevre_kaya',{s:2});cesme.position.set(0,0,-8);S3.add(cesme);addCircleCollider(0,-8,2.3);
  [[-5,28],[5,28],[-20,0],[20,0],[-6,-30],[6,-30],[-33,30],[33,30]].forEach(function(p,i){const g=modelYap(i%2?'cevre_sandik':'cevre_varil');g.position.set(p[0],0,p[1]);S3.add(g);addCircleCollider(p[0],p[1],.8);});
  [[-4,22],[4,22],[-4,6],[4,6],[-8,-8],[8,-8],[-4,-20],[4,-20]].forEach(function(p){yapiKoy('cevre_mesale',p[0],p[1]);});
  dmCikisHalka(DM_AYAR.sehir.cikis);
  dmHazineKur();
}
function buildSaray(){
  dmIsik(0xbcd4ee,0xe0dcd0,45,110,0xFFF4DC);
  dmZemin(0x9c9078);
  dmDuz(0,0,7,76,0x8a1c1c,.02);          // kırmızı halı
  dmSinir(0xc8b890);
  // taht kürsüsü
  bx(0,.4,-31,16,.8,7,0xb89a50,null,false);bx(0,1,-32,10,.8,4,0xc8aa60,null,false);
  bx(0,2.2,-34,2.2,2.6,1.4,0xD4A82A,null,false);bx(0,3.9,-34.6,2.8,1.8,.5,0xD4A82A,null,false);
  addCollider(0,-33,16,5);
  // sütunlar
  const sutunGeo=new THREE.CylinderGeometry(.6,.7,6,12),sutunMat=new THREE.MeshLambertMaterial({color:0xb8a888});
  [-9,9].forEach(function(x){[26,14,2,-10,-22].forEach(function(z){
    const s=new THREE.Mesh(sutunGeo,sutunMat);s.position.set(x,3,z);s.castShadow=true;S3.add(s);addCircleCollider(x,z,.8);
    yapiKoy('cevre_mesale',x*1.35,z);
  });});
  [[-22,18],[22,18],[-22,-12],[22,-12]].forEach(function(p){const g=modelYap('cevre_kaya',{s:1.5});g.position.set(p[0],0,p[1]);S3.add(g);addCircleCollider(p[0],p[1],1.6);});
  [[-5,34],[5,34]].forEach(function(p){const g=modelYap('cevre_sandik');g.position.set(p[0],0,p[1]);S3.add(g);addCircleCollider(p[0],p[1],.8);});
  dmCikisHalka(DM_AYAR.saray.cikis);
  dmHazineKur();
}

// ── DALGA ──
function dmCik(){
  if((currentMap!=='sehir'&&currentMap!=='saray')||pl.hp<=0)return;
  transferPool();BEGIN('kisla');
}
function dmDalgaBaslat(n){
  const a=dmAyar();waveActive=true;
  const son=n>=a.dalga,say=son?Math.max(2,Math.floor(a.say(n)/2)):a.say(n);
  const k=a.kapilar[Math.floor(Math.random()*a.kapilar.length)];
  showWave(son?'⚠ '+a.bossAd.toUpperCase()+' ve adamları geliyor!':a.ikon+' Dalga '+n+'/'+a.dalga+' — '+say+' düşman');
  if(son)dmKuyruk.push({t:200,boss:true,nokta:k});
  for(let i=0;i<say;i++)dmKuyruk.push({t:240+i*120,boss:false,nokta:a.kapilar[(Math.floor(Math.random()*a.kapilar.length)+i)%a.kapilar.length]});
}
function dmDusmanDogur(boss,nokta){
  const a=dmAyar(),w=wave,hp=boss?a.bossHp:a.hp(w);
  const g=modelYap(boss?'dusman_boss':'dusman',{cubuk:true});const hpBg=g.userData.hpBg,hpFl=g.userData.hpFl;
  const ex=nokta[0]+(Math.random()-.5)*3,ez=nokta[1]+(Math.random()-.5)*3;
  g.position.set(ex,0,ez);S3.add(g);
  enemies.push({id:newNetId(),mesh:g,hpFl:hpFl,hpBg:hpBg,govde:g.userData.govde,mid:boss?'dusman_boss':'dusman',hp:hp,maxHp:hp,x:ex,z:ez,spd:boss?.036:.029+w*.002,isBoss:boss,hurtT:0,animalType:'dusman',aggressive:true,atkDmg:boss?a.bossDmg:a.dmg,state:'attacking',wanderAng:0,wanderT:0,xpReward:boss?a.bossXp:a.xp,goldReward:[8,16]});
}
function dmZafer(){
  const a=dmAyar();dmBitti=true;waveActive=false;
  transferPool();SAVE.stats[currentMap+'Zafer']=(SAVE.stats[currentMap+'Zafer']||0)+1;hikayeOrtakKredi('zafer');
  addFame(a.fame);saveGame();
  showDlg(a.bossAd+' Yenildi!',currentMap==='saray'?'Hain Vezir devrildi, saray kurtuldu.\nPadişah sana minnettar!\n\nAkçeler kışlaya aktarıldı.':'Sokaklar yeniden güvende.\nÇete dağıldı, şehir sana teşekkür ediyor.\n\nAkçeler kışlaya aktarıldı.','Devam Et',hideDlg);
}
function dmEtkilesim(){
  const a=dmAyar(),intH=document.getElementById('intH'),zBtn=document.getElementById('zoneBtn');
  if(dmHalka)dmHalka.material.opacity=.5+Math.sin(gt*.08)*.2;
  dmHazine.forEach(function(t){if(!t.alindi){t.mesh.rotation.y+=.03;t.mesh.position.y=.5+Math.sin(gt*.07+t.x)*.08;}});
  if(Math.hypot(pl.x-a.cikis.x,pl.z-a.cikis.z)<3.8){
    pl.nearZone=a.cikis;intH.textContent='[ E ] 🏰 Çık — kazanç kışlaya aktarılır';intH.style.display='block';zBtn.innerHTML='🏰<br>Çık';zBtn.style.display='flex';return;
  }
  pl.nearZone=null;zBtn.style.display='none';intH.style.display='none';
}
function dmHazineTopla(){
  const a=dmAyar();
  dmHazine.forEach(function(t){
    if(t.alindi)return;
    const p=nearestPlayer(t.x,t.z);
    if(Math.hypot(p.x-t.x,p.z-t.z)<1.7){
      t.alindi=true;S3.remove(t.mesh);addFX(t.x,t.z,0xFFD700,6);
      const amt=a.hazineAltin[0]+Math.floor(Math.random()*(a.hazineAltin[1]-a.hazineAltin[0]+1));
      if(p===pl){addPoolGold(amt);akce+=amt;dmSayac++;SAVE.stats.hazine=(SAVE.stats.hazine||0)+1;document.getElementById('akceV').textContent=akce;lootPop('💎 Hazine sandığı +'+amt+' Akçe');}
      else p.akce=(p.akce||0)+amt;
    }
  });
  dmHazine=dmHazine.filter(function(t){return!t.alindi;});
}
function updateDalga(dt){
  updateMovement(dt);
  const a=dmAyar();
  dmEtkilesim();dmHazineTopla();
  dmKuyruk=dmKuyruk.filter(function(q){q.t--;if(q.t<=0){dmDusmanDogur(q.boss,q.nokta);return false;}return true;});
  lootGuncelle(getMagnetDist(),'+Deri','+Metal',false);
  loots=loots.filter(function(l){return!l.collected;});
  bullets.forEach(function(b){b.mesh.position.x+=b.vx;b.mesh.position.z+=b.vz;b.life--;const bx2=b.mesh.position.x,bz2=b.mesh.position.z;enemies.forEach(function(en){if(Math.hypot(en.x-bx2,en.z-bz2)<1.1&&b.life>0){en.hp-=b.dmg;b.life=0;en.hurtT=9;addFX(en.x,en.z,0xFFD24A,3);}});});
  bullets=bullets.filter(function(b){return b.life>0;});
  enemies.forEach(function(en){
    if(en.hurtT>0){en.hurtT--;modelVurus(en.govde,true);}else modelVurus(en.govde,false,en.isBoss?a.bossRenk:a.renk);
    const tp=nearestPlayer(en.x,en.z),dx=tp.x-en.x,dz=tp.z-en.z,dist=Math.hypot(dx,dz)||1;
    if(dist>1.5){
      const nx=en.x+dx/dist*en.spd*1.2,nz=en.z+dz/dist*en.spd*1.2;
      if(!dmCarpisir(nx,en.z))en.x=nx;if(!dmCarpisir(en.x,nz))en.z=nz;
      if(dmCarpisir(en.x+dx/dist*.2,en.z+dz/dist*.2)){en.x+=-dz/dist*en.spd;en.z+=dx/dist*en.spd;}
    }
    en.mesh.rotation.y=Math.atan2(dx,dz);
    en.x=Math.max(-37,Math.min(37,en.x));en.z=Math.max(-37,Math.min(37,en.z));
    en.mesh.position.set(en.x,0,en.z);
    en.hpFl.scale.x=Math.max(.001,en.hp/en.maxHp);en.hpFl.position.x=(en.hp/en.maxHp-1)*en.hpFl.geometry.parameters.width/2;en.hpBg.lookAt(CAM.position);
    if(dist<1.8&&tp.ifr===0){
      if(tp.ab&&tp.ab.active.f){addFX(tp.x,tp.z,0x3498db,4);}
      else{const dmg=(en.atkDmg||3)*(1-getArmorDef(tp));tp.hp=Math.max(0,tp.hp-dmg);addFX(tp.x,tp.z,0xcc2222,5);if(tp.hp<=0)oyuncuOldu(tp);}
      tp.ifr=28;
    }
  });
  enemies=enemies.filter(function(en){
    if(en.hp<=0){
      S3.remove(en.mesh);dropLoot(en.x,en.z,en.isBoss?7:2);
      kills++;document.getElementById('killV').textContent=kills;SAVE.stats.kills=(SAVE.stats.kills||0)+1;
      addXP(en.xpReward||20);kazancDagit(en.xpReward||20);addFame(en.isBoss?25:1);
      trackQuest('kills',1);checkAchievements('kills');
      if(en.isBoss){SAVE.stats.bossKills=(SAVE.stats.bossKills||0)+1;trackQuest('bossKills',1);checkAchievements('bossKills');dmKuyruk=[];}
      return false;
    }
    return true;
  });
  parts=parts.filter(function(p){p.mesh.position.x+=p.vx;p.mesh.position.y+=p.vy;p.mesh.position.z+=p.vz;p.vy-=.006;p.vx*=.9;p.vz*=.9;p.life--;p.mesh.material.opacity=p.life/p.maxLife;p.mesh.material.transparent=true;if(p.life<=0){S3.remove(p.mesh);return false;}return true;});
  if(!dmBitti&&waveActive&&enemies.length===0&&dmKuyruk.length===0){
    waveActive=false;
    if(wave>=a.dalga){dmZafer();}
    else{if(wave>(SAVE.stats.highWave||0)){SAVE.stats.highWave=wave;saveGame();}trackQuest('waves',1);checkAchievements('waves');waveTimer=170;}
  }
  if(!dmBitti&&!waveActive&&waveTimer>0){waveTimer--;if(waveTimer===0){wave++;dmDalgaBaslat(wave);}}
  updateAbilities();
  document.getElementById('gorevT').textContent=dmBitti?a.ad+' — ✔ Tamamlandı, çıkışa gidebilirsin':a.ad+' — Dalga '+wave+'/'+a.dalga+(a.hazine.length?' — 💎 '+dmSayac+'/'+a.hazine.length:'');
  document.getElementById('akceV').textContent=akce;
}
