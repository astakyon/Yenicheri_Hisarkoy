// ═══════════════════════════════════════════════════════
// MEVCUT HARİTALARI EDİTÖR FORMATINA DÖNÜŞTÜRME
// Kışla ve Av Ormanı zaten kodla (build3D fonksiyonları) inşa
// edildiği için, bu fonksiyonlar ZONES/sabit verilerden okuyup
// editörün anlayacağı {cells:{...}} formatına çevirir.
// ═══════════════════════════════════════════════════════

// Bir dikdörtgen alanı (cx,cz merkez, w,d boyut) tek bir asset ile editör
// ızgarasına kaydeder. cw/cd asset'in doğal hücre boyutuysa footprint hesaplanır.
function meRegisterFootprint(cells,asset,cx,cz,w,d){
  const def=ASSET_DEFS[asset];if(!def)return;
  const cw=Math.max(1,Math.round(w/GRID_UNIT)),cd=Math.max(1,Math.round(d/GRID_UNIT));
  const gx=Math.round(cx-cw/2),gz=Math.round(cz-cd/2);
  for(let dx=0;dx<cw;dx++)for(let dz=0;dz<cd;dz++){
    const key=(gx+dx)+','+(gz+dz);
    cells[key]={type:def.cat,asset:asset,rot:0,anchor:(dx===0&&dz===0),anchorKey:gx+','+gz};
  }
}

// Kışla'yı (ZONES verisinden) editör formatına çevirir.
function convertKislaToEditorMap(){
  const cells={};
  const zoneAssetMap={
    armory:'yapi_armory', camii:'yapi_camii', drill:'yapi_meydan',
    cebehaneUst:'yapi_cebehane', cebehane:'yapi_cebehane',
    demirKapi:'yapi_kapi', hamam:'yapi_hamam', kervansaray:'yapi_kervansaray',
    carsi:'yapi_meydan', konut:'yapi_konut', artisanKapi:'yapi_kapi',
  };
  ZONES.forEach(function(z){
    const asset=zoneAssetMap[z.id];
    if(!asset)return;
    meRegisterFootprint(cells,asset,z.x,z.z,z.w,z.d);
  });
  // Tunç Nehri (kuzey kenar, görsel referans)
  meRegisterFootprint(cells,'yapi_nehir_buyuk',0,-47,90,4);
  // Meşaleler (görsel referans, Kışla'daki fener noktaları)
  [[-29,-29],[29,-29],[-29,29],[29,29],[0,-20],[0,20],[-20,0],[20,0]].forEach(function(p){
    meRegisterFootprint(cells,'mesale',p[0],p[1],1,1);
  });
  const data={name:'Hisarköy Kışlası (Otomatik)',size:100,cells:cells,spawn:{x:0,z:22},sourceMap:'kisla'};
  setCustomMap('converted_kisla',data);
  return data;
}

// Av Ormanı'nı sabit-seed rastgelelikle editör formatına çevirir.
function convertOrmanToEditorMap(){
  const cells={};
  // Sabit seed ile aynı ağaç dağılımını üret (Math.random yerine basit LCG)
  let seed=42;
  function srand(){seed=(seed*9301+49297)%233280;return seed/233280;}
  for(let i=0;i<55;i++){
    const a=srand()*Math.PI*2,r=srand()*22;
    const tx=Math.round(Math.cos(a)*r),tz=Math.round(Math.sin(a)*r);
    if(Math.hypot(tx,tz)<4)continue;
    const asset=srand()<0.5?'agac':'cam_agac';
    meRegisterFootprint(cells,asset,tx,tz,1,1);
  }
  // Avcı Kulübesi
  meRegisterFootprint(cells,'kulube',-32,32,9,7);
  // Mağara
  meRegisterFootprint(cells,'yapi_magara',34,0,10,12);
  // Akarsu (batı kenar, basitleştirilmiş düz şerit)
  meRegisterFootprint(cells,'yapi_nehir_buyuk',-30,0,4,90);
  // Kayalar
  [[10,-10],[-8,15],[15,-25],[5,25],[-20,-15]].forEach(function(p){
    meRegisterFootprint(cells,'kaya',p[0],p[1],2,2);
  });
  const data={name:'Av Ormanı (Otomatik)',size:96,cells:cells,spawn:{x:-22,z:22},sourceMap:'orman'};
  setCustomMap('converted_orman',data);
  return data;
}

// Her iki haritayı da dönüştürüp editör listesine ekler (bir kerelik, ana menüde çağrılır).
function convertExistingMapsToEditor(){
  if(!getCustomMap('converted_kisla'))convertKislaToEditorMap();
  if(!getCustomMap('converted_orman'))convertOrmanToEditorMap();
  if(!getCustomMap('converted_maden'))convertMadenToEditorMap();
}

// Maden Tüneli'ni (buildMaden verisinden) editör formatına çevirir.
function convertMadenToEditorMap(){
  const cells={};
  // Ana koridor (dikey, dar tünel — mağara asset'iyle temsil edilir)
  meRegisterFootprint(cells,'yapi_magara',0,0,18,64);
  // Bakır Damarı (batı kolu)
  meRegisterFootprint(cells,'yapi_magara',-22,-8,26,8);
  // Eski Ocak (sol tali)
  meRegisterFootprint(cells,'yapi_magara',-34,-8,8,12);
  // Demir Ocağı (doğu kolu)
  meRegisterFootprint(cells,'yapi_magara',22,8,26,8);
  // Yeni Kanal (sağ tali)
  meRegisterFootprint(cells,'yapi_magara',34,8,8,12);
  // Gizli Oda — Boss
  meRegisterFootprint(cells,'yapi_magara',0,-34,20,10);
  // Giriş
  meRegisterFootprint(cells,'yapi_kapi',0,32,14,2);
  // Meşaleler (fener noktaları)
  [[0,28],[0,16],[0,0],[0,-16],[-22,-8],[-34,-8],[22,8],[34,8],[0,-30]].forEach(function(p){
    meRegisterFootprint(cells,'mesale',p[0],p[1],1,1);
  });
  const data={name:'Demir Madeni (Otomatik)',size:80,cells:cells,spawn:{x:0,z:28},sourceMap:'maden'};
  setCustomMap('converted_maden',data);
  return data;
}

