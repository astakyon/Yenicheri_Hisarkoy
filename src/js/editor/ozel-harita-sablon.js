// ═══════════════════════════════════════════════════════
// ŞABLON: Yeni bir harita kodla (build3D) inşa edilirken
// AYNI ANDA editör formatına da kaydetmek için kullanılacak yardımcı.
// Yeni harita eklerken: 1) buildXXX() fonksiyonunu yaz (mevcut akış)
// 2) convertXXXToEditorMap() fonksiyonunu bu şablona göre yaz
// 3) convertExistingMapsToEditor() içine ekle
// ═══════════════════════════════════════════════════════
// Örnek kullanım (Maden Tüneli için ileride):
// function convertMadenToEditorMap(){
//   const cells={};
//   meRegisterFootprint(cells,'yapi_magara',0,0,20,30); // ana tünel
//   ... // her yapısal eleman için meRegisterFootprint çağrısı
//   const data={name:'Demir Madeni (Otomatik)',size:80,cells:cells,spawn:{x:0,z:35},sourceMap:'maden'};
//   setCustomMap('converted_maden',data);
//   return data;
// }

// ── ÖZEL HARİTAYI GERÇEK 3D SAHNEYE DÖNÜŞTÜR ──
// mapData: {name, size, cells:{"x,z":{type,asset,rot,color}}, spawn:{x,z}}
function buildCustomMap(mapData){
  clearScene();
  S3.fog=new THREE.Fog(0x6a8050,28,76);S3.background=new THREE.Color(0x9bc4e0);
  const sun=new THREE.DirectionalLight(0xFFF8E0,2.6);sun.position.set(18,32,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-60;sun.shadow.camera.right=60;sun.shadow.camera.top=60;sun.shadow.camera.bottom=-60;S3.add(sun);
  S3.add(new THREE.AmbientLight(0xC8E8C0,1.1));S3.add(new THREE.HemisphereLight(0x9bc4e0,0x4a7030,1.0));

  // Varsayılan zemin (kareler arası boşluk için)
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshLambertMaterial({color:0x5a8c3a}));
  gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;S3.add(gnd);

  const half=Math.ceil((mapData.size||40)/2);
  MAP_HALF=half;
  // Dış sınır duvarı (görünmez collider)
  bx(0,2.5,-half,half*2,5,1.5,0x3a5a28,null,true);bx(0,2.5,half,half*2,5,1.5,0x3a5a28,null,true);
  bx(-half,2.5,0,1.5,5,half*2,0x3a5a28,null,true);bx(half,2.5,0,1.5,5,half*2,0x3a5a28,null,true);

  // Izgaradaki her hücreyi inşa et — sadece anchor hücreler (çoklu hücre kaplayan objeler bir kez inşa edilir)
  const cells=mapData.cells||{};
  Object.keys(cells).forEach(function(key){
    const cell=cells[key];
    if(!cell||!cell.type)return;
    // Geriye dönük uyumluluk: eski haritalarda 'anchor' alanı yok, her hücre kendi başına anchor sayılır
    if(cell.anchor===false)return; // bu hücre bir objenin parçası ama anchor değil → atla
    const [gx,gz]=key.split(',').map(Number);
    const def=ASSET_DEFS[cell.asset];
    if(!def)return;
    const cw=Math.max(1,Math.round(def.w||1)),cd=Math.max(1,Math.round(def.d||1));
    // Objeyi kapladığı alanın merkezine yerleştir (anchor sol-üst köşe, obje sağa-aşağı büyür)
    const worldX=(gx+(cw-1)/2)*GRID_UNIT,worldZ=(gz+(cd-1)/2)*GRID_UNIT;
    try{def.build3D(worldX,worldZ,cell.rot||0,{color:cell.color});}catch(e){console.warn('Asset inşa hatası:',cell.asset,e);}
  });

  return{spawn:mapData.spawn||{x:0,z:0}};
}

// ── ÖZEL HARİTAYI OYUNA BAŞLAT ──
function startCustomMap(mapId){
  const mapData=getCustomMap(mapId);
  if(!mapData){lootPop('⚠ Harita bulunamadı!');return;}
  currentMap='custom_'+mapId;
  clearAll();
  const result=buildCustomMap(mapData);
  const safeSpawn=findSafeSpawn(result.spawn.x,result.spawn.z);
  pl.x=safeSpawn.x;pl.z=safeSpawn.z;
  pl.maxHp=getBaseMaxHp();pl.hp=pl.maxHp;
  pl.maxEn=getBaseMaxEn();pl.en=pl.maxEn;
  pl.spd=getBaseSpd();pl.rspd=pl.spd*1.8;
  buildPlayer();
  akce=0;kills=0;wave=1;waveTimer=170;waveActive=false;gt=0;
  poolGold=0;updateGoldHud();
  document.getElementById('akceV').textContent=0;
  document.getElementById('killV').textContent=0;
  playing=true;paused=false;
  document.getElementById('mapIndicator').textContent='🗺 '+(mapData.name||'Özel Harita');
  const btmBarEl=document.getElementById('btmBar');if(btmBarEl)btmBarEl.style.display='flex';
  document.getElementById('gorevT').textContent='Serbest Keşif';
}

// Spawn noktası bir collider'ın içindeyse (örn. ağaç/bina üstüne denk gelmişse),
// oyuncu hiç hareket edemez — bu yüzden etrafında güvenli bir nokta arar.
function findSafeSpawn(x,z){
  const r=pl.radius||0.45;
  if(!checkCollision(x,z,r))return{x,z};
  // Genişleyen daireler halinde etrafı tara
  for(let radius=1;radius<=20;radius+=1){
    for(let angle=0;angle<360;angle+=30){
      const rad=angle*Math.PI/180;
      const tx=x+Math.cos(rad)*radius,tz=z+Math.sin(rad)*radius;
      if(!checkCollision(tx,tz,r))return{x:tx,z:tz};
    }
  }
  return{x:0,z:0}; // son çare — hiçbir güvenli nokta bulunamazsa harita merkezi
}

