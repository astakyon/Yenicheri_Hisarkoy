// ═══════════════════════════════════════════════════════
// KIŞLA HARİTASI
// ═══════════════════════════════════════════════════════

// Kışla bölgeleri (Hisarköy blueprint'ine birebir sadık)
// Sol yarı = Yeniçeri Kışlası, Orta = Cadde, Sağ yarı = Sivil alan
// Kapı (dx,dz) = binadan biraz önde, etkileşim noktası
const ZONES=[
  // Hisarköy yerleşimi (v1.54): binalar ORTA CADDEYE (x≈0, 11 birim geniş) bakar; kapı caddeye açılır, görevli kapının önünde durur.
  // x,z = bina merkezi; w = X boyu, d = Z boyu (dünya ölçüsü); rot = model dönüşü (π/2: kapı doğuya, -π/2: batıya, yok: güneye)
  // dx,dz = etkileşim noktası (kapının önü, caddede).
  // ── BATI SÜTUNU: KIŞLA (kapılar doğuya, caddeye) ──
  {id:'armory',   name:'⚔ Armory',         icon:'⚔', x:-19.5,z:-30, w:11,d:13, rot:Math.PI/2, dx:-12,dz:-30, desc:'Silah yükselt'},
  {id:'cebehaneUst',name:'🛡 Cebehane',     icon:'🛡', x:-18,z:-10, w:8,d:14,  rot:Math.PI/2, dx:-12,dz:-10, desc:'Zırh & ekipman'},
  {id:'cebehane', name:'🛡 Cebehane',       icon:'🛡', x:-19,z:6,   w:10,d:14, rot:Math.PI/2, dx:-12,dz:6,   desc:'Zırh & ekipman'},
  {id:'drill',    name:'⚡ Drill Ground',    icon:'⚡', x:-22.5,z:28,  w:17,d:15, dx:-12,dz:28,   desc:'Yetenek geliştir'},
  // ── ORTA: CAMİ VE ÇARŞI ──
  {id:'camii',    name:'🕌 Orta Camii',     icon:'🕌', x:0,  z:-32, w:9, d:9,  dx:0,  dz:-24,  desc:'Kaydet & buff'},
  {id:'carsi',    name:'🛒 Çarşı Meydanı', icon:'🛒', x:0,  z:16,  w:20,d:26, dx:0,  dz:31,   desc:'Market'},
  // ── DOĞU SÜTUNU: SİVİL ALAN (kapılar batıya, caddeye) ──
  {id:'hamam',    name:'💧 Sultan Hamamı',  icon:'💧', x:22, z:-30, w:16,d:16, rot:-Math.PI/2, dx:12, dz:-30,  desc:'Can yenile & artır'},
  {id:'kervansaray',name:'🏠 Kervansaray',  icon:'🏠', x:21, z:-8,  w:14,d:25, rot:-Math.PI/2, dx:12, dz:-8,   desc:'Tüccar & harita'},
  {id:'konut',    name:'🏘 Konut Bölgesi',  icon:'🏘', x:28, z:20,  w:25,d:10, dx:28, dz:27,   desc:null}, // dekoratif, kapısız
  // ── KAPILAR (güney sur içinde) ──
  {id:'demirKapi',name:'🚪 Göreve Çık',     icon:'🚪', x:-14,z:43,  w:12,d:3,  dx:-14,dz:39,   desc:'Hisarköy Devriye'},
  {id:'artisanKapi',name:'🚪 Artisan Kapı', icon:'🚪', x:14, z:43,  w:12,d:3,  dx:14, dz:39,   desc:'Yan çıkış'},
];

// Etkileşim için geçerli (kapısı olan) bölgeler
const INTERACTABLE_ZONES=['armory','camii','drill','cebehaneUst','cebehane','demirKapi','hamam','kervansaray','carsi'];

function clearScene(){
  if(!S3)return;
  // Sadece dinamik nesneleri temizle
  [...enemies,...bullets,...loots,...parts].forEach(o=>S3.remove(o.mesh||o));
  enemies=[];bullets=[];loots=[];parts=[];
  if(pl.mesh){S3.remove(pl.mesh);pl.mesh=null;}
  npcArr.forEach(n=>S3.remove(n));npcArr=[];
  // Sahneyi tamamen temizle (duvarlar vb)
  while(S3.children.length>0)S3.remove(S3.children[0]);
  torches=[];barrelsArr=[];animalTracks=[];huntNoise=0;
  clearColliders();
}

function buildKisla(){
  clearScene();
  S3.fog=new THREE.Fog(0x8ab4d8,45,110);
  S3.background=new THREE.Color(0x8ab4d8);
  MAP_HALF=48; // Hisarköy genişlemiş harita yarı boyutu

  // Işıklar — gündüz, parlak
  const sun=new THREE.DirectionalLight(0xFFF5E0,2.0);sun.position.set(10,30,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-55;sun.shadow.camera.right=55;sun.shadow.camera.top=55;sun.shadow.camera.bottom=-55;S3.add(sun);
  S3.add(new THREE.AmbientLight(0xE8F4FF,.75));S3.add(new THREE.HemisphereLight(0x87CEEB,0xC8B870,.6));
  const fill=new THREE.DirectionalLight(0xFFE8A0,.6);fill.position.set(-8,10,-5);S3.add(fill);

  // Zemin
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshLambertMaterial({color:0xD4B870}));gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;S3.add(gnd);
  S3.add(modelYap('zemin_tas',{n:12,adim:5,kare:4.6,yuk:.05,y:.01,renk:0xC8A850}));
  const grass=new THREE.Mesh(new THREE.PlaneGeometry(240,240),new THREE.MeshLambertMaterial({color:0x6aaa40}));grass.rotation.x=-Math.PI/2;grass.position.y=-.05;S3.add(grass);

  // Tunç Nehri (kuzeyde, blueprint'teki gibi)
  const river=new THREE.Mesh(new THREE.PlaneGeometry(110,12),new THREE.MeshLambertMaterial({color:0x2050A0}));river.rotation.x=-Math.PI/2;river.position.set(0,.05,-54);S3.add(river);
  // Nehir parıltısı
  for(let i=-50;i<=50;i+=10){const sp=new THREE.Mesh(new THREE.PlaneGeometry(6,1.5),new THREE.MeshBasicMaterial({color:0x80C0FF,transparent:true,opacity:.3}));sp.rotation.x=-Math.PI/2;sp.position.set(i,.06,-54+Math.sin(i)*2);S3.add(sp);}

  // ── DIŞ SUR (tüm Hisarköy'ü çevreler) ──
  {const sw=yapiKoy('yapi_sur',0,-46,{w:98,h:5,d:2.5},[98,2.5]);}   // kuzey sur
  {const sw=yapiKoy('yapi_sur',0,46,{w:98,h:5,d:2.5},[98,2.5]);}    // güney sur
  {const sw=yapiKoy('yapi_sur',-47,0,{w:98,h:5,d:2.5},[2.5,98]);sw.rotation.y=Math.PI/2;}   // batı sur
  {const sw=yapiKoy('yapi_sur',47,0,{w:98,h:5,d:2.5},[2.5,98]);sw.rotation.y=Math.PI/2;}    // doğu sur
  // Köşe kuleleri (Kule 1-4)
  [[-46,-46],[46,-46],[-46,46],[46,46]].forEach(([cx,cz])=>{
    const k=bx(cx,3.5,cz,6,7,6,0xB09060,0x8B6914);
    for(let i=0;i<4;i++){const mg=new THREE.Mesh(new THREE.BoxGeometry(.8,1.2,.3),new THREE.MeshLambertMaterial({color:0x3a2800}));mg.position.set(-1.3+i*0.9,3.2,3.05);k.add(mg);}
  });

  // ── ORTA CADDE: kuzey-güney ana yol ──
  S3.add(modelYap('zemin_sokak',{w:11,L:90}));
  // Çarşı meydanının kaldırım taşı
  const Z=function(id){return ZONES.find(zz=>zz.id===id);};
  const meydan=modelYap('zemin_tas',{n:2,adim:5,kare:4.6,yuk:.05,y:.045,renk:0xB89858});meydan.position.set(0,0,16);S3.add(meydan);

  // ═══════════ BATI SÜTUNU — YENİÇERİ KIŞLASI ═══════════
  [['armory',0x8B6048],['cebehaneUst',0x4a3018],['cebehane',0x4a3018]].forEach(([id,col])=>{const q=Z(id);buildZoneBuilding(id,q.x,q.z,q.w,q.d,col,0x8B6914,'flat');});
  { const q=Z('camii'); buildZoneBuilding('camii',q.x,q.z,q.w,q.d,0x303060,0x8B6914,'dome-minaret'); }
  { const q=Z('drill'); buildDrillGroundZone(q.x,q.z,q.w,q.d); }

  // ═══════════ DOĞU SÜTUNU — SİVİL ALAN ═══════════
  { const q=Z('hamam'); buildHamamBuilding(q.x,q.z,q.w,q.d); }
  { const q=Z('kervansaray'); buildKervansarayBuilding(q.x,q.z,q.w,q.d); }
  { const q=Z('carsi'); buildCarsiBuilding(q.x,q.z,q.w,q.d); }
  { const q=Z('konut'); buildKonutBuilding(q.x,q.z,q.w,q.d); }

  // ═══════════ GÜNEY SUR KAPILARI ═══════════
  [['demirKapi',true],['artisanKapi',false]].forEach(([id,demir])=>{
    const q=Z(id);
    const kp=yapiKoy('yapi_kapi',q.x,q.z,{w:6,h:6,demir:demir},[12,3]);
    const lv=modelYap('cevre_levha',{w:6,h:1,d:.2,renk:demir?0x8B0000:0x5a3800});lv.position.set(q.x,7.6,q.z-1.6);S3.add(lv);
    const dl=fenerLight(q.x,5,q.z-2,demir?0xFF6600:0xFFAA44,2,10);
    torches.push({light:dl,phase:Math.random()*Math.PI*2});
  });

  // ── Etkileşim kapı işaretleri (tüm bölgeler için ortak ışık) ──
  ZONES.forEach(z=>{
    if(z.id==='demirKapi'||z.id==='artisanKapi')return;
    const zl=fenerLight(z.dx,3.5,z.dz,0xFFCC66,1.3,9);
    torches.push({light:zl,phase:Math.random()*Math.PI*2});
  });

  // ── NPC yeniçeriler ──
  // Her bölgenin kapısının yanında bir görevli; kapılarda nöbetçi; çarşıda satıcılar
  // Her bölgenin kapısının önünde, cadde tarafında bir görevli (kapı hattını kapatmaz); kapılarda nöbetçi; çarşıda satıcılar
  const npcDefs=[];
  [['armory',0x1a3060],['cebehaneUst',0x602010],['cebehane',0x303060],['drill',0x106020],['camii',0x4a2000],['hamam',0x1a3060],['kervansaray',0x602010]].forEach(([id,col])=>{
    const q=Z(id);const yon=q.dx<-1?1:(q.dx>1?-1:0); // cadde yönü
    npcDefs.push({x:q.dx+yon*1.6+(yon?0:3),z:q.dz+(yon?2.4:0),col:col});
  });
  npcDefs.push({x:3,z:30,col:0x2a4010},{x:-17,z:40,col:0x602010},{x:-11,z:40,col:0x602010},{x:11,z:40,col:0x1a3060},{x:17,z:40,col:0x1a3060});
  npcDefs.forEach(n=>{
    const g=modelYap('npc_halk',{col:n.col});
    g.position.set(n.x,0,n.z);S3.add(g);npcArr.push(g);
  });

  // ── Ağaçlar (sur kenarlarında, dekoratif) ──
  [[-44,-40],[-44,40],[44,-40],[44,40],[-30,-44],[30,-44],[-30,44],[30,44],[44,0],[-44,18]].forEach(([x,z])=>{
    const ag=modelYap('cevre_agac',{h:4.5});ag.position.set(x,0,z);ag.rotation.y=x*.37+z;S3.add(ag);
  });

  // ── Fenerler (cadde boyunca + meydanlarda) ──
  [[0,-40],[0,-20],[0,0],[0,20],[0,40],[-23,-30],[-23,28],[23,-30],[23,28]].forEach(([x,z])=>{
    yapiKoy('cevre_mesale',x,z);
    const pt=fenerLight(x,3.2,z,0xFF9933,2.2,11);
    torches.push({light:pt,phase:Math.random()*Math.PI*2});
  });
}

// ── Genel amaçlı bölge binası — duvarlar + çatı + kapı + levha, çarpışmalı ──
function buildZoneBuilding(zoneId,cx,cz,w,d,wallCol,edgeCol,roofType){
  const z=ZONES.find(zz=>zz.id===zoneId);
  // Görünüm model kütüphanesinden (modeller/yapilar.js); çarpışma kutuları eskisiyle aynı
  if(roofType==='dome-minaret'){
    yapiKoy('yapi_cami',cx,cz,{w:w,d:d,kapiX:z.dx-cx},[w,d]);
    addCollider(cx-w/2-1.5,cz,1.2,1.2);          // minare
  } else {
    const r=z.rot||0;
    yapiKoy('yapi_kisla',cx,cz,{w:r?d:w,d:r?w:d,duvar:wallCol,kapiX:r?0:z.dx-cx},[w,d],r);
  }
}

// ── Drill Ground (Acemi Ocağı) — açık talim alanı, dış çit collider ──
function buildDrillGroundZone(cx,cz,w,d){
  const z=ZONES.find(zz=>zz.id==='drill');
  // Çit: dört kenar kapalı; caddeye bakan doğu kenarında 5 birimlik kapı boşluğu (iki yanda yüksek direk)
  const KOL=0x6B4A0C,KEN=0x4a2800,kap=5,yarim=(d-kap)/2;
  bx(cx,1.2,cz-d/2,w,2.4,.6,KOL,KEN,true);
  bx(cx,1.2,cz+d/2,w,2.4,.6,KOL,KEN,true);
  bx(cx-w/2,1.2,cz,.6,2.4,d,KOL,KEN,true);
  bx(cx+w/2,1.2,cz-kap/2-yarim/2,.6,2.4,yarim,KOL,KEN,true);
  bx(cx+w/2,1.2,cz+kap/2+yarim/2,.6,2.4,yarim,KOL,KEN,true);
  [-1,1].forEach(sg=>bx(cx+w/2,2.1,cz+sg*(kap/2),.9,4.2,.9,0x4a2c08,0x2a1400,true));   // kapı direkleri
  bx(cx+w/2,4.0,cz,.8,.5,kap+.9,0x4a2c08,0x2a1400,false);                                 // kapı kirişi
  // İç talim kuklaları
  const baseX=cx-w/3, baseZ=cz-d/4;
  [[baseX,baseZ],[baseX+5,baseZ],[baseX+10,baseZ],[baseX,baseZ+6],[baseX+5,baseZ+6]].forEach(([x,zz])=>{
    yapiKoy('yapi_talim',x,zz);
    addCircleCollider(x,zz,0.4); // kuklalar da çarpışmalı
  });
  // Levha
}

// ── Sultan Hamamı — kubbeli yapı ──
function buildHamamBuilding(cx,cz,w,d){
  const z=ZONES.find(zz=>zz.id==='hamam');
  yapiKoy('yapi_hamam',cx,cz,{w:d,d:w,kapiX:0},[w,d],z.rot||0);
}

// ── Kervansaray — iç avlulu büyük yapı ──
function buildKervansarayBuilding(cx,cz,w,d){
  yapiKoy('yapi_kervansaray',cx,cz,{w:d,d:w},null,ZONES.find(zz=>zz.id==='kervansaray').rot||0);
  // Dış U-şekli çarpışmaları (4 duvar, iç avlu boş)
  addCollider(cx,cz-d/2+0.75,w,1.5);addCollider(cx,cz+d/2-0.75,w,1.5);
  addCollider(cx-w/2+0.75,cz,1.5,d);addCollider(cx+w/2-0.75,cz,1.5,d);
}

// ── Çarşı Meydanı — dükkan sırası ──
function buildCarsiBuilding(cx,cz,w,d){
  // Tezgâhlar caddeyi iki yandan çevreler (yüzleri caddeye bakar); cadde ortası 11 birim boş
  const z=ZONES.find(zz=>zz.id==='carsi');
  const n=5,adim=4.6,x0=cz-(n-1)*adim/2-1;
  for(let sg=-1;sg<=1;sg+=2){
    for(let i=0;i<n;i++){
      const rz=cz-d/2+3.5+i*adim;
      const g=yapiKoy('yapi_dukkan',cx+sg*8,rz,{w:3.4,d:1.8,renk:(i+(sg>0?1:0))%2?[0x2a5a9a,0xE8DCC0]:[0xB02020,0xE8DCC0]},[1.8,3.4]);
      g.rotation.y=sg>0?-Math.PI/2:Math.PI/2;
    }
  }
  const levha=modelYap('cevre_levha',{w:4.4,h:.9,d:.2,renk:0x5a2800,ayak:2.2});levha.position.set(-7,0,z.dz+1);S3.add(levha);
}

// ── Konut Bölgesi — dekoratif binalar (kapısız, sadece görsel + collider) ──
function buildKonutBuilding(cx,cz,w,d){
  const cols=3,rows=2;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const sx=cx-w/2+w/cols/2+c*(w/cols);
    const sz=cz-d/2+d/rows/2+r*(d/rows);
    yapiKoy('yapi_ev',sx,sz,{w:w/cols-1.5,d:d/rows-1.5,duvar:(r+c)%2?0xE2CFA6:0xD9C39A,cati:(r+c)%3?0x9a3a1a:0x8a4a22},[w/cols-1.5,d/rows-1.5]);
  }
}

