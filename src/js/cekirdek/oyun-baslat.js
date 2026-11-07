// ═══════════════════════════════════════════════════════
// OYUN BAŞLAT
// ═══════════════════════════════════════════════════════
function BEGIN(mapId){
  document.getElementById('menuLayer').style.display='none';
  document.getElementById('gameLayer').style.display='block';
  document.getElementById('hudLayer').style.display='block';
  document.getElementById('topBar').style.display='flex';document.getElementById('mmBox').style.display='block';document.getElementById('topLeftHud').style.display='flex';
  initThree();
  if(mapId==='kisla')startKisla();else if(mapId==='orman')startOrman();else if(mapId==='maden')startMaden();else if(mapId==='tarim')startTarim();else startGorev();
  setTimeout(()=>{ initTouch(); applyAllSettings(); },100);
  updateGoldHud();
  updateXPHud();
  updateCharHud();
  updateAbilityHUD();
}

// Editörden çıkan özel haritayı tam ekran başlatır
function BEGIN_CUSTOM(mapId){
  document.getElementById('menuLayer').style.display='none';
  document.getElementById('mapEditorBox').style.display='none';
  document.getElementById('gameLayer').style.display='block';
  document.getElementById('hudLayer').style.display='block';
  document.getElementById('topBar').style.display='flex';document.getElementById('mmBox').style.display='block';document.getElementById('topLeftHud').style.display='flex';
  document.getElementById('testExitBtn').style.display='block';
  isTestMode=true;
  initThree();
  startCustomMap(mapId);
  setTimeout(()=>{ initTouch(); applyAllSettings(); },100);
  updateGoldHud();
  updateXPHud();
  updateCharHud();
  updateAbilityHUD();
}

// Test modundan tek tıkla çıkış — direkt editöre (harita düzenleme ekranına) geri döner
function exitTestMode(){
  isTestMode=false;
  document.getElementById('testExitBtn').style.display='none';
  ['pauseBox','deathBox','milestoneBox','zoneMenuBox','hudLayer','gameLayer','touchLayer','worldMapBox','bigMapBox'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.display='none';
  });
  document.getElementById('topBar').style.display='none';document.getElementById('mmBox').style.display='none';document.getElementById('topLeftHud').style.display='none';
  losePool();playing=false;paused=false;clearAll();
  // Editöre geri dön (eğer hangi haritayı test ettiğimizi biliyorsak ona, yoksa listeye)
  document.getElementById('mapEditorBox').style.display='flex';
  if(meCurrentMapId){
    document.getElementById('meListView').style.display='none';
    document.getElementById('meEditView').style.display='flex';
    requestAnimationFrame(()=>{meResetView();meDrawGrid();});
  }else{
    meBackToList();
  }
}

function startKisla(){
  currentMap='kisla';
  clearAll();
  buildKisla();
  pl.x=0;pl.z=22; // Cadde üzerinde, Demir Kapı/Artisan Kapı arası
  pl.maxHp=getBaseMaxHp();pl.hp=pl.maxHp;
  pl.maxEn=getBaseMaxEn();pl.en=pl.maxEn;
  pl.spd=getBaseSpd();pl.rspd=pl.spd*1.8;
  buildPlayer();
  playing=true;paused=false;
  document.getElementById('mapIndicator').textContent='🏰 KIŞLA — Ana Üs';
  document.getElementById('gorevB').style.display='block';
  document.getElementById('scoreWrap').style.display='none';
  const wsK=document.getElementById('wepSel'),wfK=document.getElementById('wepFan');
  if(wsK)wsK.style.display='none';if(wfK)wfK.style.display='none';
  document.getElementById('pwrW').style.display='none';
  document.getElementById('wvAnn').style.display='none';
  document.getElementById('poolRow').style.display='none';
  updateGoldHud();
}

function startGorev(){
  currentMap='gorev';
  clearAll();
  MAP_HALF=28; // Görev haritası standart boyut
  buildGorev();
  pl.x=0;pl.z=8;
  pl.maxHp=getBaseMaxHp();pl.hp=pl.maxHp;
  pl.maxEn=getBaseMaxEn();pl.en=pl.maxEn;
  pl.spd=getBaseSpd();pl.rspd=pl.spd*1.8;
  buildPlayer();
  akce=0;kills=0;wave=1;waveTimer=170;waveActive=false;gt=0;
  poolGold=0;updateGoldHud();
  document.getElementById('akceV').textContent=0;
  document.getElementById('killV').textContent=0;
  playing=true;paused=false;
  document.getElementById('mapIndicator').textContent='⚔ GÖREV — Hisarköy Devriye';
  const btmBarEl=document.getElementById('btmBar');if(btmBarEl)btmBarEl.style.display='flex';
  // Görev sistemi başlat
  refreshDailyIfNeeded();
  questTracker={kills:0,waves:0,bossKills:0};
  updateQuestHUD();
  // Aktif hikaye görevi varsa kısaca göster
  const aq=getActiveStoryQuest();
  if(aq) setTimeout(()=>lootPop('📜 Görev: '+aq.obj),1500);
  spawnWave(1);
}

function startOrman(){
  currentMap='orman';
  clearAll();
  buildOrman(); // içinde MAP_HALF=46 set ediliyor
  pl.x=-22;pl.z=22; // Avcı Kulübesi yakını (giriş)
  pl.maxHp=getBaseMaxHp();pl.hp=pl.maxHp;
  pl.maxEn=getBaseMaxEn();pl.en=pl.maxEn;
  pl.spd=getBaseSpd();pl.rspd=pl.spd*1.8;
  buildPlayer();
  akce=0;kills=0;wave=1;waveTimer=170;waveActive=false;gt=0;
  poolGold=0;updateGoldHud();
  document.getElementById('akceV').textContent=0;
  document.getElementById('killV').textContent=0;
  playing=true;paused=false;
  document.getElementById('mapIndicator').textContent='🏹 AV ORMANI — Anadolu Ormanı';
  const btmBarEl=document.getElementById('btmBar');if(btmBarEl)btmBarEl.style.display='flex';
  questTracker={kills:0,waves:0,bossKills:0};
  setTimeout(()=>lootPop('🤫 Sessiz hareket et — koşmak hayvanları ürkütür!'),1500);
  spawnOrmanWave(1);
}

function startMaden(){
  currentMap='maden';
  clearAll();
  buildMaden(); // içinde MAP_HALF=38 set ediliyor
  pl.x=0;pl.z=28; // Giriş yakını (güney)
  pl.maxHp=getBaseMaxHp();pl.hp=pl.maxHp;
  pl.maxEn=getBaseMaxEn();pl.en=pl.maxEn;
  pl.spd=getBaseSpd();pl.rspd=pl.spd*1.8;
  buildPlayer();
  akce=0;kills=0;wave=1;waveTimer=170;waveActive=false;gt=0;
  poolGold=0;updateGoldHud();
  document.getElementById('akceV').textContent=0;
  document.getElementById('killV').textContent=0;
  playing=true;paused=false;
  document.getElementById('mapIndicator').textContent='⛏ DEMİR MADENİ — Karanlık Tünel';
  const btmBarEl=document.getElementById('btmBar');if(btmBarEl)btmBarEl.style.display='flex';
  questTracker={kills:0,waves:0,bossKills:0};
  setTimeout(()=>lootPop('🔦 Karanlık tünel — fenerden uzaklaşma, tuzaklara dikkat!'),1500);
  spawnMadenWave(1);
}


function startTarim(){
  currentMap='tarim';
  clearAll();
  buildTarim(); // içinde MAP_HALF=46 set ediliyor
  tarimKoyluDogur();
  pl.x=0;pl.z=36; // Köy yolu (güney)
  pl.maxHp=getBaseMaxHp();pl.hp=pl.maxHp;
  pl.maxEn=getBaseMaxEn();pl.en=pl.maxEn;
  pl.spd=getBaseSpd();pl.rspd=pl.spd*1.8;
  buildPlayer();
  akce=0;kills=0;wave=1;waveTimer=170;waveActive=false;gt=0;
  poolGold=0;updateGoldHud();
  document.getElementById('akceV').textContent=0;
  document.getElementById('killV').textContent=0;
  playing=true;paused=false;
  document.getElementById('mapIndicator').textContent='🌾 TARIM OVASI — Hisarköy Çiftlikleri';
  const btmBarEl=document.getElementById('btmBar');if(btmBarEl)btmBarEl.style.display='flex';
  questTracker={kills:0,waves:0,bossKills:0};
  setTimeout(()=>lootPop('🌾 Köylüleri koru, tarlalardan tahıl topla!'),1500);
  spawnTarimWave(1);
}
