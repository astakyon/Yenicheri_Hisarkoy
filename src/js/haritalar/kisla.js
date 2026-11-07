// ═══════════════════════════════════════════════════════
// KIŞLA HARİTASI
// ═══════════════════════════════════════════════════════

// Kışla bölgeleri (Hisarköy blueprint'ine birebir sadık)
// Sol yarı = Yeniçeri Kışlası, Orta = Cadde, Sağ yarı = Sivil alan
// Kapı (dx,dz) = binadan biraz önde, etkileşim noktası
const ZONES=[
  // ── SOL YARI: KIŞLA ──
  {id:'armory',   name:'⚔ Armory',         icon:'⚔', x:-19,z:-15, w:13,d:11, dx:-19,dz:-8,  desc:'Silah yükselt'},
  {id:'camii',    name:'🕌 Orta Camii',     icon:'🕌', x:-5, z:-17, w:9, d:9,  dx:-5, dz:-11, desc:'Kaydet & buff'},
  {id:'drill',    name:'⚡ Drill Ground',    icon:'⚡', x:-19,z:2,   w:17,d:15, dx:-19,dz:10,  desc:'Yetenek geliştir'},
  {id:'cebehaneUst',name:'🛡 Cebehane',     icon:'🛡', x:-3, z:-2,  w:14,d:8,  dx:-3, dz:2,   desc:'Zırh & ekipman'},
  {id:'cebehane', name:'🛡 Cebehane',       icon:'🛡', x:-3, z:8,   w:14,d:10, dx:-3, dz:13,  desc:'Zırh & ekipman'},
  {id:'demirKapi',name:'🚪 Göreve Çık',     icon:'🚪', x:-13,z:24,  w:12,d:2,  dx:-13,dz:20,  desc:'Hisarköy Devriye'},
  // ── SAĞ YARI: SİVİL ALAN ──
  {id:'hamam',    name:'💧 Sultan Hamamı',  icon:'💧', x:13, z:-13, w:16,d:16, dx:13, dz:-3,  desc:'Can yenile & artır'},
  {id:'kervansaray',name:'🏠 Kervansaray',  icon:'🏠', x:32, z:-15, w:25,d:14, dx:32, dz:-6,  desc:'Tüccar & harita'},
  {id:'carsi',    name:'🛒 Çarşı Meydanı', icon:'🛒', x:13, z:8,   w:16,d:20, dx:13, dz:19,  desc:'Market'},
  {id:'konut',    name:'🏘 Konut Bölgesi',  icon:'🏘', x:32, z:8,   w:25,d:10, dx:32, dz:14,  desc:null}, // dekoratif, kapısız
  {id:'artisanKapi',name:'🚪 Artisan Kapı', icon:'🚪', x:23, z:24,  w:12,d:2,  dx:23, dz:20,  desc:'Yan çıkış'},
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
  const sun=new THREE.DirectionalLight(0xFFF5E0,3.2);sun.position.set(10,30,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-55;sun.shadow.camera.right=55;sun.shadow.camera.top=55;sun.shadow.camera.bottom=-55;S3.add(sun);
  S3.add(new THREE.AmbientLight(0xE8F4FF,1.5));S3.add(new THREE.HemisphereLight(0x87CEEB,0xC8B870,1.0));
  const fill=new THREE.DirectionalLight(0xFFE8A0,.6);fill.position.set(-8,10,-5);S3.add(fill);

  // Zemin
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshLambertMaterial({color:0xD4B870}));gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;S3.add(gnd);
  for(let i=-12;i<=12;i++)for(let j=-12;j<=12;j++)if((i+j)%2===0){const st=new THREE.Mesh(new THREE.BoxGeometry(4.6,.05,4.6),new THREE.MeshLambertMaterial({color:0xC8A850}));st.position.set(i*5,.01,j*5);st.receiveShadow=true;S3.add(st);}
  const grass=new THREE.Mesh(new THREE.PlaneGeometry(240,240),new THREE.MeshLambertMaterial({color:0x6aaa40}));grass.rotation.x=-Math.PI/2;grass.position.y=-.05;S3.add(grass);

  // Tunç Nehri (kuzeyde, blueprint'teki gibi)
  const river=new THREE.Mesh(new THREE.PlaneGeometry(110,12),new THREE.MeshLambertMaterial({color:0x2050A0}));river.rotation.x=-Math.PI/2;river.position.set(0,.05,-54);S3.add(river);
  // Nehir parıltısı
  for(let i=-50;i<=50;i+=10){const sp=new THREE.Mesh(new THREE.PlaneGeometry(6,1.5),new THREE.MeshBasicMaterial({color:0x80C0FF,transparent:true,opacity:.3}));sp.rotation.x=-Math.PI/2;sp.position.set(i,.06,-54+Math.sin(i)*2);S3.add(sp);}

  // ── DIŞ SUR (tüm Hisarköy'ü çevreler) ──
  bx(0,2.5,-46,98,5,2.5,0xC8A870,0x8B6914);   // kuzey sur
  bx(0,2.5,46,98,5,2.5,0xC8A870,0x8B6914);    // güney sur
  bx(-47,2.5,0,2.5,5,98,0xC8A870,0x8B6914);   // batı sur
  bx(47,2.5,0,2.5,5,98,0xC8A870,0x8B6914);    // doğu sur
  // Köşe kuleleri (Kule 1-4)
  [[-46,-46],[46,-46],[-46,46],[46,46]].forEach(([cx,cz])=>{
    const k=bx(cx,3.5,cz,6,7,6,0xB09060,0x8B6914);
    for(let i=0;i<4;i++){const mg=new THREE.Mesh(new THREE.BoxGeometry(.8,1.2,.3),new THREE.MeshLambertMaterial({color:0x3a2800}));mg.position.set(-1.3+i*0.9,3.2,3.05);k.add(mg);}
  });

  // ── ORTA CADDE (Street) — kışla ile sivil alanı ayıran yol ──
  // Cadde alanı collider içermez (geçilebilir), sadece görsel
  const streetMat=new THREE.MeshLambertMaterial({color:0xC0A870});
  const street=new THREE.Mesh(new THREE.PlaneGeometry(7,90),streetMat);street.rotation.x=-Math.PI/2;street.position.set(0,.03,0);S3.add(street);
  // Cadde taş döşeme deseni
  for(let j=-42;j<=42;j+=4){const cs=new THREE.Mesh(new THREE.BoxGeometry(6,.04,3.4),new THREE.MeshLambertMaterial({color:0xB89858}));cs.position.set(0,.04,j);S3.add(cs);}

  // ═══════════ SOL YARI — YENİÇERİ KIŞLASI ═══════════
  // Kışla alt-sur (sol yarıyı çevreler, cadde tarafı açık)
  bx(-23.5,2.2,-23,1.5,4.4,46,0x9a8050,0x6B4A0C,false); // iç ayraç (görsel, geçilebilir değil ama ince)

  // Armory (sol üst köşe — blueprint'te "بصطني / Armory")
  buildZoneBuilding('armory',-19,-15,13,11,0x8B6048,0x8B6914,'flat');
  // Orta Camii (Armory sağında, blueprint'teki "Orta Camii" konumunda — sol yarının üst-orta kısmı)
  buildZoneBuilding('camii',-5,-17,9,9,0x303060,0x8B6914,'dome-minaret');
  // Drill Ground (sol alt — büyük açık talim alanı, blueprint'teki "Acemi Ocağı / Drill Ground")
  buildDrillGroundZone(-19,2,17,15);
  // Cebehane Üst (toplam alanı — blueprint'teki "توصل Cebehane")
  buildZoneBuilding('cebehaneUst',-3,-2,14,8,0x4a3018,0x8B6914,'flat');
  // Cebehane Alt (blueprint'teki "سرحقي Cebehane")
  buildZoneBuilding('cebehane',-3,8,14,10,0x4a3018,0x8B6914,'flat');

  // Demir Kapı (güney — sol yarının çıkışı, blueprint'teki "Demir Kapı / الندين")
  bx(-13,1.8,25,13,3.6,1,0x2a1400,0x8B0000,false);
  const dkSign=new THREE.Mesh(new THREE.BoxGeometry(6,1,.2),new THREE.MeshLambertMaterial({color:0x8B0000}));dkSign.position.set(-13,4.4,24.9);S3.add(dkSign);
  const dkLight=new THREE.PointLight(0xFF6600,2,10);dkLight.position.set(-13,4,23);S3.add(dkLight);
  torches.push({light:dkLight,phase:Math.random()*Math.PI*2});

  // ═══════════ SAĞ YARI — SİVİL ALAN ═══════════
  // Sultan Hamamı (sol üst, sivil alanın — blueprint'teki "مثارنة Sultan Hamamı")
  buildHamamBuilding(13,-13,16,16);
  // Kervansaray (sağ üst — blueprint'teki "امارهم نديمي Kervansaray")
  buildKervansarayBuilding(32,-15,25,14);
  // Çarşı Meydanı (sol alt — blueprint'teki "Çarşı Meydanı")
  buildCarsiBuilding(13,8,16,20);
  // Konut Bölgesi (sağ alt — dekoratif, kapısız)
  buildKonutBuilding(32,8,25,10);

  // Artisan Kapı (sağ yarının çıkışı — blueprint'teki "Artisan Kapı")
  bx(23,1.8,25,13,3.6,1,0x2a1400,0x8B6914,false);
  const akSign=new THREE.Mesh(new THREE.BoxGeometry(6,1,.2),new THREE.MeshLambertMaterial({color:0x5a3800}));akSign.position.set(23,4.4,24.9);S3.add(akSign);

  // ── Etkileşim kapı işaretleri (tüm bölgeler için ortak ışık+levha) ──
  ZONES.forEach(z=>{
    if(z.id==='demirKapi'||z.id==='artisanKapi')return;
    const zl=new THREE.PointLight(0xFFCC66,1.3,9);zl.position.set(z.dx,3.5,z.dz);S3.add(zl);
    torches.push({light:zl,phase:Math.random()*Math.PI*2});
  });

  // ── NPC yeniçeriler ──
  const npcDefs=[
    {x:-19,z:-7,col:0x1a3060},{x:-3,z:5,col:0x602010},{x:13,z:-3,col:0x106020},
    {x:-5,z:-11,col:0x303060},{x:32,z:-6,col:0x4a2000},{x:13,z:19,col:0x2a4010},
    {x:-13,z:18,col:0x1a3060},{x:32,z:14,col:0x602010}
  ];
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
    const pt=new THREE.PointLight(0xFF9933,2.2,11);pt.position.set(x,3.2,z);S3.add(pt);
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
    yapiKoy('yapi_kisla',cx,cz,{w:w,d:d,duvar:wallCol,kapiX:z.dx-cx},[w,d]);
  }
}

// ── Drill Ground (Acemi Ocağı) — açık talim alanı, dış çit collider ──
function buildDrillGroundZone(cx,cz,w,d){
  const z=ZONES.find(zz=>zz.id==='drill');
  // Düşük çit (collider — içeri girilir ama dış sınır var)
  bx(cx,1.2,cz-d/2,w,2.4,.6,0x6B4A0C,0x4a2800,true);
  bx(cx,1.2,cz+d/2,w,2.4,.6,0x6B4A0C,0x4a2800,true);
  bx(cx-w/2,1.2,cz,.6,2.4,d,0x6B4A0C,0x4a2800,true);
  // Giriş açıklığı (sağ taraf — collider yok)
  // (sağ kenar bilerek collider eklenmedi, oyuncu girebilsin)
  // İç talim kuklaları
  const baseX=cx-w/3, baseZ=cz-d/4;
  [[baseX,baseZ],[baseX+5,baseZ],[baseX+10,baseZ],[baseX,baseZ+6],[baseX+5,baseZ+6]].forEach(([x,zz])=>{
    yapiKoy('yapi_talim',x,zz);
    addCircleCollider(x,zz,0.4); // kuklalar da çarpışmalı
  });
  // Levha
  const sign=new THREE.Mesh(new THREE.BoxGeometry(3.6,.7,.15),new THREE.MeshLambertMaterial({color:0x5a2800}));sign.position.set(z.dx,3.2,z.dz);S3.add(sign);
}

// ── Sultan Hamamı — kubbeli yapı ──
function buildHamamBuilding(cx,cz,w,d){
  const z=ZONES.find(zz=>zz.id==='hamam');
  yapiKoy('yapi_hamam',cx,cz,{w:w,d:d,kapiX:z.dx-cx},[w,d]);
}

// ── Kervansaray — iç avlulu büyük yapı ──
function buildKervansarayBuilding(cx,cz,w,d){
  yapiKoy('yapi_kervansaray',cx,cz,{w:w,d:d});
  // Dış U-şekli çarpışmaları (4 duvar, iç avlu boş)
  addCollider(cx,cz-d/2+0.75,w,1.5);addCollider(cx,cz+d/2-0.75,w,1.5);
  addCollider(cx-w/2+0.75,cz,1.5,d);addCollider(cx+w/2-0.75,cz,1.5,d);
}

// ── Çarşı Meydanı — dükkan sırası ──
function buildCarsiBuilding(cx,cz,w,d){
  const z=ZONES.find(zz=>zz.id==='carsi');
  const stallW=w/4-0.4, rows=3;
  for(let r=0;r<rows;r++){
    const rz=cz-d/2+2+r*(d/rows);
    for(let c=0;c<4;c++){
      const sx=cx-w/2+stallW/2+0.4+c*(w/4);
      yapiKoy('yapi_dukkan',sx,rz,{w:stallW,d:1.8,renk:(r+c)%2?[0x2a5a9a,0xE8DCC0]:[0xB02020,0xE8DCC0]},[stallW,1.8]);
    }
  }
  const doorZ=cz+(d/2);
  const sign=new THREE.Mesh(new THREE.BoxGeometry(4,.7,.15),new THREE.MeshLambertMaterial({color:0x5a2800}));sign.position.set(z.dx,4,doorZ+.15);S3.add(sign);
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

