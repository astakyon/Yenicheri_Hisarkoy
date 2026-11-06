// ═══════════════════════════════════════════════════════
// HARİTA EDİTÖRÜ — ASSET KÜTÜPHANESİ
// Her asset: 2D editör simgesi + 3D üretim fonksiyonu
// Izgara birimi = 1 oyun-dünyası birimi (karakterin yaklaşık genişliği)
// ═══════════════════════════════════════════════════════
const GRID_UNIT=1; // 1 ızgara karesi = 1 dünya birimi

const ASSET_DEFS={
  // ── BİNALAR ──
  bina_kucuk:{cat:'bina',name:'Küçük Bina',icon:'🏠',w:4,d:4,color:'#C8A050',
    build3D:(x,z,rot,opt)=>{const g=new THREE.Group();const b=bx(x,2,z,4,4,4,opt?.color||0xC8A050,null,true);const roof=new THREE.Mesh(new THREE.ConeGeometry(3,2,4),new THREE.MeshLambertMaterial({color:0x8B3010}));roof.rotation.y=Math.PI/4;roof.position.set(x,5,z);roof.castShadow=true;S3.add(roof);return b;}},
  bina_orta:{cat:'bina',name:'Orta Bina',icon:'🏛',w:8,d:7,color:'#B8A060',
    build3D:(x,z,rot,opt)=>{const b=bx(x,2.8,z,8,5.6,7,opt?.color||0xB8A060,null,true);const roof=new THREE.Mesh(new THREE.ConeGeometry(5.5,2.5,4),new THREE.MeshLambertMaterial({color:0x8B3010}));roof.rotation.y=Math.PI/4;roof.position.set(x,6,z);roof.castShadow=true;S3.add(roof);return b;}},
  bina_buyuk:{cat:'bina',name:'Büyük Bina',icon:'🏰',w:12,d:10,color:'#E0D0A0',
    build3D:(x,z,rot,opt)=>{const b=bx(x,3.5,z,12,7,10,opt?.color||0xE0D0A0,null,true);const dome=new THREE.Mesh(new THREE.SphereGeometry(5,20,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:0xC0B080}));dome.position.set(x,7,z);S3.add(dome);return b;}},
  kulube:{cat:'bina',name:'Kulübe',icon:'🛖',w:9,d:7,color:'#C8A050',
    build3D:(x,z,rot,opt)=>{const b=bx(x,2,z,9,4,7,opt?.color||0xC8A050,null,true);const roof=new THREE.Mesh(new THREE.ConeGeometry(7,3,4),new THREE.MeshLambertMaterial({color:0x6B3A15}));roof.rotation.y=Math.PI/4;roof.position.set(x,5,z);roof.castShadow=true;S3.add(roof);return b;}},

  // ── KIŞLA ÖZEL YAPILARI (Hisarköy blueprint'inden dönüştürülen binalar) ──
  yapi_armory:{cat:'bina',name:'Armory',icon:'⚔',w:13,d:11,color:'#B8A060',
    build3D:(x,z,rot,opt)=>{const b=bx(x,2.8,z,13,5.6,11,0xB8A060,null,true);const roof=new THREE.Mesh(new THREE.ConeGeometry(8,2.5,4),new THREE.MeshLambertMaterial({color:0x8B3010}));roof.rotation.y=Math.PI/4;roof.position.set(x,6,z);S3.add(roof);return b;}},
  yapi_camii:{cat:'bina',name:'Cami',icon:'🕌',w:9,d:9,color:'#E0D0A0',
    build3D:(x,z)=>{const b=bx(x,3.5,z,9,7,9,0xE0D0A0,null,true);const dome=new THREE.Mesh(new THREE.SphereGeometry(4.5,20,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:0xC0B080}));dome.position.set(x,7,z);S3.add(dome);const minare=new THREE.Mesh(new THREE.CylinderGeometry(.4,.5,9,8),new THREE.MeshLambertMaterial({color:0xE0D0A0}));minare.position.set(x+5,4.5,z-4);S3.add(minare);return b;}},
  yapi_meydan:{cat:'bina',name:'Meydan/Alan',icon:'🏟',w:16,d:14,color:'#D4C090',
    build3D:(x,z)=>{const f=new THREE.Mesh(new THREE.PlaneGeometry(16,14),new THREE.MeshLambertMaterial({color:0xD4C090}));f.rotation.x=-Math.PI/2;f.position.set(x,.02,z);f.receiveShadow=true;S3.add(f);return f;}},
  yapi_cebehane:{cat:'bina',name:'Cebehane',icon:'🛡',w:14,d:9,color:'#B8A060',
    build3D:(x,z)=>{const b=bx(x,2.5,z,14,5,9,0xB8A060,null,true);const roof=new THREE.Mesh(new THREE.ConeGeometry(9,2,4),new THREE.MeshLambertMaterial({color:0x8B3010}));roof.rotation.y=Math.PI/4;roof.position.set(x,5.5,z);S3.add(roof);return b;}},
  yapi_kapi:{cat:'gecis',name:'Büyük Kapı',icon:'🚪',w:12,d:2,color:'#3a1800',
    build3D:(x,z)=>{const d=bx(x,1.6,z,3,3.2,1.5,0x3a1800,null,false);return d;}},
  yapi_hamam:{cat:'bina',name:'Hamam',icon:'💧',w:16,d:16,color:'#C8D8E0',
    build3D:(x,z)=>{const b=bx(x,3,z,16,6,16,0xC8D8E0,null,true);const dome=new THREE.Mesh(new THREE.SphereGeometry(7,20,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:0xA0C0D0}));dome.position.set(x,6,z);S3.add(dome);return b;}},
  yapi_kervansaray:{cat:'bina',name:'Kervansaray',icon:'🏠',w:25,d:14,color:'#C8A050',
    build3D:(x,z)=>{const b=bx(x,3.2,z,25,6.4,14,0xC8A050,null,true);const roof=new THREE.Mesh(new THREE.ConeGeometry(15,2.5,4),new THREE.MeshLambertMaterial({color:0x8B3010}));roof.rotation.y=Math.PI/4;roof.position.set(x,7,z);S3.add(roof);return b;}},
  yapi_konut:{cat:'bina',name:'Konut Bloğu',icon:'🏘',w:25,d:10,color:'#D4B890',
    build3D:(x,z)=>{const b=bx(x,2.5,z,25,5,10,0xD4B890,null,true);return b;}},
  yapi_magara:{cat:'doga',name:'Mağara',icon:'⛰',w:10,d:12,color:'#6B6258',
    build3D:(x,z)=>{const b=bx(x,3,z,10,7,12,0x6B6258,null,true);return b;}},
  yapi_nehir_buyuk:{cat:'su',name:'Büyük Nehir',icon:'🌊',w:96,d:6,color:'#3070b0',
    build3D:(x,z)=>{const r=new THREE.Mesh(new THREE.PlaneGeometry(96,6),new THREE.MeshLambertMaterial({color:0x3070b0,transparent:true,opacity:.75}));r.rotation.x=-Math.PI/2;r.rotation.z=Math.PI/2;r.position.set(x,.05,z);S3.add(r);return r;}},

  // ── DOĞA ──
  agac:{cat:'doga',name:'Ağaç',icon:'🌳',w:1,d:1,
    build3D:(x,z)=>{const tr=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,1.2,8),new THREE.MeshLambertMaterial({color:0x5a3800}));tr.position.set(x,.6,z);tr.castShadow=true;S3.add(tr);const lv=new THREE.Mesh(new THREE.SphereGeometry(.85,10,8),new THREE.MeshLambertMaterial({color:0x3a7030}));lv.position.set(x,1.7,z);lv.castShadow=true;S3.add(lv);addCircleCollider(x,z,0.4);return tr;}},
  cam_agac:{cat:'doga',name:'Çam',icon:'🌲',w:1,d:1,
    build3D:(x,z)=>{const tr=new THREE.Mesh(new THREE.CylinderGeometry(.1,.15,1.0,7),new THREE.MeshLambertMaterial({color:0x4a3018}));tr.position.set(x,.5,z);tr.castShadow=true;S3.add(tr);const lv=new THREE.Mesh(new THREE.ConeGeometry(.7,1.4,8),new THREE.MeshLambertMaterial({color:0x2d5a20}));lv.position.set(x,1.4,z);lv.castShadow=true;S3.add(lv);addCircleCollider(x,z,0.4);return tr;}},
  kaya:{cat:'doga',name:'Kaya',icon:'🪨',w:1.6,d:1.6,
    build3D:(x,z)=>{const s=1.5;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),new THREE.MeshLambertMaterial({color:0x787068}));rock.position.set(x,s*.6,z);rock.castShadow=true;S3.add(rock);addCircleCollider(x,z,s*.8);return rock;}},
  cali:{cat:'doga',name:'Çalı',icon:'🌿',w:1,d:1,
    build3D:(x,z)=>{const b=new THREE.Mesh(new THREE.SphereGeometry(.8,8,6),new THREE.MeshLambertMaterial({color:0x4a7a3a}));b.position.set(x,.6,z);b.castShadow=true;S3.add(b);return b;}},

  // ── AYDINLATMA ──
  mesale:{cat:'aydinlatma',name:'Meşale',icon:'🔥',w:1,d:1,
    build3D:(x,z)=>{const pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,1.8,7),new THREE.MeshLambertMaterial({color:0x4a2800}));pole.position.set(x,1.4,z);S3.add(pole);const pt=new THREE.PointLight(0xFF9933,3,10);pt.position.set(x,2.9,z);S3.add(pt);torches.push({light:pt,phase:Math.random()*Math.PI*2});const fl=new THREE.Mesh(new THREE.SphereGeometry(.2,6,4),new THREE.MeshLambertMaterial({color:0xFF8800,emissive:0xFF5500,emissiveIntensity:2}));fl.position.set(x,2.9,z);S3.add(fl);return pole;}},

  // ── GEÇİŞLER ──
  kapi:{cat:'gecis',name:'Kapı',icon:'🚪',w:2,d:1,
    build3D:(x,z,rot)=>{const d=bx(x,1.4,z,1.6,2.8,.3,0x3a1800,null,false);return d;}},

  // ── NPC ──
  npc_asker:{cat:'npc',name:'Asker NPC',icon:'💂',w:1,d:1,
    build3D:(x,z)=>{const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(.85,1.4,.5),new THREE.MeshLambertMaterial({color:0x1a3060}));body.position.y=1;g.add(body);const head=new THREE.Mesh(new THREE.BoxGeometry(.58,.52,.5),new THREE.MeshLambertMaterial({color:0xC8956C}));head.position.y=2;g.add(head);g.position.set(x,0,z);S3.add(g);npcArr.push(g);return g;}},

  // ── SU ──
  nehir_parca:{cat:'su',name:'Nehir Parçası',icon:'🌊',w:4,d:4,
    build3D:(x,z)=>{const r=new THREE.Mesh(new THREE.PlaneGeometry(4,4),new THREE.MeshLambertMaterial({color:0x3070b0,transparent:true,opacity:.75}));r.rotation.x=-Math.PI/2;r.position.set(x,.05,z);S3.add(r);return r;}},

  // ── ZEMİN ──
  zemin_tas:{cat:'zemin',name:'Taş Döşeme',icon:'🟫',w:4,d:4,
    build3D:(x,z)=>{const st=new THREE.Mesh(new THREE.BoxGeometry(4.6,.05,4.6),new THREE.MeshLambertMaterial({color:0xC8A850}));st.position.set(x,.01,z);st.receiveShadow=true;S3.add(st);return st;}},
  zemin_cim:{cat:'zemin',name:'Çim',icon:'🟩',w:4,d:4,
    build3D:(x,z)=>{const g=new THREE.Mesh(new THREE.PlaneGeometry(4,4),new THREE.MeshLambertMaterial({color:0x5a8c3a}));g.rotation.x=-Math.PI/2;g.position.set(x,.005,z);g.receiveShadow=true;S3.add(g);return g;}},
};
const ASSET_CATEGORIES=[
  {id:'bina',name:'Binalar',icon:'🏠'},
  {id:'doga',name:'Doğa',icon:'🌳'},
  {id:'aydinlatma',name:'Aydınlatma',icon:'🔥'},
  {id:'gecis',name:'Geçişler',icon:'🚪'},
  {id:'npc',name:'NPC',icon:'💂'},
  {id:'su',name:'Su',icon:'🌊'},
  {id:'zemin',name:'Zemin',icon:'🟫'},
];

// ── ÖZEL HARİTA DEPOLAMA ──
const CUSTOM_MAPS_KEY='yenicheri_custom_maps';
function loadCustomMaps(){try{const d=localStorage.getItem(CUSTOM_MAPS_KEY);return d?JSON.parse(d):{};}catch(e){return{};}}
function saveCustomMaps(maps){try{localStorage.setItem(CUSTOM_MAPS_KEY,JSON.stringify(maps));}catch(e){}}
function getCustomMap(id){return loadCustomMaps()[id]||null;}
function setCustomMap(id,data){const m=loadCustomMaps();m[id]=data;saveCustomMaps(m);}
function deleteCustomMap(id){const m=loadCustomMaps();delete m[id];saveCustomMaps(m);}

