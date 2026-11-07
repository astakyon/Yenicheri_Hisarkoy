// ═══════════════════════════════════════════════════════
// TARIM OVASI — 3D Sahne (v1.61)
// Köylüleri eşkıya baskınlarından koru, tarlalardan tahıl topla.
// Harita, alan verisinden (TARIM_TARLALAR / TARIM_EVLER) üretilir; ulaşılabilirlik testi aynı veriyi okur.
// ═══════════════════════════════════════════════════════
const TARIM_TARLALAR=[
  {id:'kb',ad:'Kuzeybatı Tarlası',x0:-40,x1:-12,z0:-40,z1:-16},
  {id:'kd',ad:'Kuzeydoğu Tarlası',x0:12, x1:40, z0:-40,z1:-16},
  {id:'b', ad:'Batı Tarlası',     x0:-40,x1:-14,z0:-10,z1:10},
  {id:'d', ad:'Doğu Tarlası',     x0:14, x1:40, z0:-10,z1:10}
];
const TARIM_KOY={ad:'Hisarköy Çiftliği',x0:-24,x1:24,z0:14,z1:36};
// Köy evleri (yapi_ev 6×5) — hepsi yola bakar, aralarında geçit var
const TARIM_EVLER=[[-12,19],[12,19],[-12,31],[12,31],[-21,19],[21,19]];
const TARIM_CIKIS={id:'tarimCikis',icon:'🏰',name:'Ovadan Çık',x:0,z:41.5};
// Eşkıyaların ovaya girdiği kenar noktaları
const TARIM_BASKIN=[[-40,-43],[0,-43],[40,-43],[-43,-4],[43,-4],[-43,12],[43,12]];
let tarimTahillar=[];   // toplanabilir tahıl demetleri
let tarimKoyluler=[];   // korunacak köylüler
let tarimTahilSayac=0;  // bu seferde toplanan demet

function tarimYaziSprite(t,renk,x,y,z){return madenYaziSprite(t,renk,x,y,z);}

function buildTarim(){
  clearScene();
  S3.fog=new THREE.Fog(0xb4cf98,45,110);S3.background=new THREE.Color(0xa8d0ec);
  const sun=new THREE.DirectionalLight(0xFFF2D0,1.8);sun.position.set(-20,34,14);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-50;sun.shadow.camera.right=50;sun.shadow.camera.top=50;sun.shadow.camera.bottom=-50;S3.add(sun);
  S3.add(new THREE.AmbientLight(0xE8F0D0,.7));S3.add(new THREE.HemisphereLight(0xa8d0ec,0x6a8a38,.5));

  // Zemin: otlak + yol
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshLambertMaterial({color:0x6a9434}));
  gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;S3.add(gnd);
  const yolMat=new THREE.MeshLambertMaterial({color:0x9c8250});
  [[0,0,6,92],[0,25,48,5]].forEach(function(r){
    const y=new THREE.Mesh(new THREE.PlaneGeometry(r[2],r[3]),yolMat);y.rotation.x=-Math.PI/2;y.position.set(r[0],.015,r[1]);y.receiveShadow=true;S3.add(y);
  });

  // Dış sınır (görünmez duvar)
  MAP_HALF=46;
  bx(0,2.5,-46,96,5,1.5,0x5a7a30,null,true);bx(0,2.5,46,96,5,1.5,0x5a7a30,null,true);
  bx(-46,2.5,0,1.5,5,96,0x5a7a30,null,true);bx(46,2.5,0,1.5,5,96,0x5a7a30,null,true);

  // ── Tarlalar: sürülmüş toprak + tek parça (instanced) buğday sırası ──
  const sapGeo=new THREE.BoxGeometry(.1,.75,.1),sapMat=new THREE.MeshLambertMaterial({color:0xd9a93a});
  TARIM_TARLALAR.forEach(function(f){
    const w=f.x1-f.x0,d=f.z1-f.z0,cx=(f.x0+f.x1)/2,cz=(f.z0+f.z1)/2;
    const toprak=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshLambertMaterial({color:0x8a6a3a}));
    toprak.rotation.x=-Math.PI/2;toprak.position.set(cx,.025,cz);toprak.receiveShadow=true;S3.add(toprak);
    const cols=Math.floor(w/.8),rows=Math.floor(d/.6);
    const im=new THREE.InstancedMesh(sapGeo,sapMat,cols*rows);
    const m4=new THREE.Matrix4(),c=new THREE.Color();let k=0;
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
      const px=f.x0+.4+i*.8+((j%2)?.2:0),pz=f.z0+.3+j*.6;
      m4.makeTranslation(px,.38,pz);im.setMatrixAt(k,m4);
      c.setHex(0xd9a93a);c.offsetHSL(0,0,((i*7+j*13)%9-4)*.012);im.setColorAt(k,c);k++;
    }
    im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;S3.add(im);
    // Yola bakan kenarda çit (ortada 6 birimlik geçit)
    const yolKenar=f.x0<0?f.x1:f.x0;
    for(let z=f.z0+3;z<f.z1;z+=6){
      if(Math.abs(z-cz)<4)continue;
      yapiKoy('yapi_cit',yolKenar,z,{w:6},[.7,6],Math.PI/2);
    }
  });

  // ── Köy: evler, kuyu, sandık/varil ──
  TARIM_EVLER.forEach(function(e){yapiKoy('yapi_ev',e[0],e[1],{w:6,d:5},[6,5]);});
  const kuyu=modelYap('cevre_kaya',{s:1.6});kuyu.position.set(0,0,25);S3.add(kuyu);addCircleCollider(0,25,1.7);
  [[-5,36],[5,36],[-4,14],[4,14]].forEach(function(p,i){
    const g=modelYap(i%2?'cevre_sandik':'cevre_varil');g.position.set(p[0],0,p[1]);S3.add(g);addCircleCollider(p[0],p[1],.7);
  });
  // Meşaleler (köy içi + çıkış)
  [[-7,22],[7,22],[-7,34],[7,34],[0,12]].forEach(function(p){yapiKoy('cevre_mesale',p[0],p[1]);});

  // ── Ağaçlar (kenarlarda, sabit yerler) ──
  [[-44,-30],[-44,-20],[-44,20],[-44,40],[44,-30],[44,-20],[44,20],[44,40],[-30,-44],[-18,-44],[18,-44],[30,-44],[-30,44],[-16,44],[16,44],[30,44],[-30,14],[30,14],[-28,36],[28,36]].forEach(function(p,i){
    const a=modelYap(i%3===0?'cevre_cam':'cevre_agac',{h:4.2+(i%3)*.5});a.position.set(p[0],0,p[1]);a.rotation.y=i*2.1;S3.add(a);addCircleCollider(p[0],p[1],.6);
  });

  // ── Çıkış: yolun güney ucunda yeşil halka; [E] ile Kışla'ya dönülür ──
  const halka=new THREE.Mesh(new THREE.RingGeometry(1.7,2.4,32),new THREE.MeshBasicMaterial({color:0x66ff99,transparent:true,opacity:.65,side:THREE.DoubleSide}));
  halka.rotation.x=-Math.PI/2;halka.position.set(TARIM_CIKIS.x,.06,TARIM_CIKIS.z);S3.add(halka);window._tarimHalka=halka;
  S3.add(tarimYaziSprite('⬇ ÇIKIŞ — KIŞLA',0x66ff99,0,3.4,TARIM_CIKIS.z));

  tarimTahillar=[];tarimKoyluler=[];tarimTahilSayac=0;
  tarimTahilYenile();
}

// Her tarlada 3×3 sabit konumda tahıl demeti (dalga başında yenilenir; var olan tekrar eklenmez)
function tarimTahilNoktalari(){
  const n=[];
  TARIM_TARLALAR.forEach(function(f,fi){
    for(let i=0;i<3;i++)for(let j=0;j<3;j++){
      n.push({k:fi*9+i*3+j,x:f.x0+(f.x1-f.x0)*(i+.5)/3,z:f.z0+(f.z1-f.z0)*(j+.5)/3});
    }
  });
  return n;
}
let _tarimDemetGeo=null,_tarimDemetMat=null;
function tarimTahilYenile(){
  if(!_tarimDemetGeo){_tarimDemetGeo=new THREE.ConeGeometry(.45,1.1,6);_tarimDemetMat=new THREE.MeshLambertMaterial({color:0xF0A818,emissive:0x8a4a00,emissiveIntensity:.35});}
  const var_=new Set(tarimTahillar.filter(function(t){return!t.alindi;}).map(function(t){return t.k;}));
  tarimTahilNoktalari().forEach(function(p){
    if(var_.has(p.k))return;
    const m=new THREE.Mesh(_tarimDemetGeo,_tarimDemetMat);m.position.set(p.x,.9,p.z);S3.add(m);
    tarimTahillar.push({k:p.k,x:p.x,z:p.z,mesh:m,alindi:false});
  });
}

// Köylüler: her biri bir tarlanın kenarında/köyde dolaşır
const TARIM_KOYLU_EV=[[-9,8],[9,8],[-9,-13],[9,-13],[-4,22],[4,28]];
function tarimKoyluDogur(){
  const renk=[0x8a6a3a,0x6a5a8a,0x4a7a4a,0x9a4a3a,0x5a6a8a,0x8a7a3a];
  tarimKoyluler=TARIM_KOYLU_EV.map(function(h,i){
    const g=modelYap('npc_halk',{col:renk[i%renk.length]});g.position.set(h[0],0,h[1]);S3.add(g);
    const bg=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.16),new THREE.MeshBasicMaterial({color:0x222222,depthTest:false}));
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.16),new THREE.MeshBasicMaterial({color:0x4ade80,depthTest:false}));
    bg.position.set(0,3.2,0);fl.position.set(0,3.2,.01);bg.renderOrder=fl.renderOrder=30;g.add(bg);g.add(fl);
    return{mesh:g,bg:bg,fl:fl,x:h[0],z:h[1],hx:h[0],hz:h[1],hp:40,maxHp:40,ang:Math.random()*6.28,t:0,ayak:0};
  });
}
