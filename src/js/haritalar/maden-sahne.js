// ═══════════════════════════════════════════════════════
// MADEN TÜNELİ — 3D Sahne (Faz 5)
// Blueprint: Giriş (güney), Ana Koridor (dikey), Bakır Damarı
// (batı kolu), Eski Ocak (sol tali), Demir Ocağı (doğu kolu),
// Yeni Kanal (sağ tali), Gizli Oda/Boss (kuzey)
// ═══════════════════════════════════════════════════════
let madenTorches=[]; // fener ışıkları (oyuncu hareketiyle titreşir)
let madenTraps=[];   // patlama tuzakları

function buildMaden(){
  clearScene();
  // Çok karanlık atmosfer — sadece fenerler aydınlatır
  S3.fog=new THREE.Fog(0x0a0806,12,50);S3.background=new THREE.Color(0x0a0806);
  S3.add(new THREE.AmbientLight(0x6a5a48,1.0)); // çok düşük ambient — karanlık his
  const dim=new THREE.DirectionalLight(0x6a5238,0.6);dim.position.set(10,20,10);S3.add(dim);

  // Kaya zemin — koyu, pürüzlü doku hissi
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshLambertMaterial({color:0x3a342c}));
  gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;S3.add(gnd);
  for(let i=0;i<35;i++){const px=(Math.random()-.5)*70,pz=(Math.random()-.5)*70;const pm=new THREE.Mesh(new THREE.CircleGeometry(1+Math.random()*1.8,7),new THREE.MeshLambertMaterial({color:0x2a241c}));pm.rotation.x=-Math.PI/2;pm.position.set(px,.01,pz);S3.add(pm);}

  // Dış sınır
  MAP_HALF=38;
  bx(0,3,-38,76,6,1.5,0x1a1612,null,true);bx(0,3,38,76,6,1.5,0x1a1612,null,true);
  bx(-38,3,0,1.5,6,76,0x1a1612,null,true);bx(38,3,0,1.5,6,76,0x1a1612,null,true);

  // ── Giriş (güney) ──
  // Giriş açık bir geçit (dolu blok kamerayı karakterin önünde kapatıyordu) — sadece kemer var
  const entranceArch=new THREE.Mesh(new THREE.TorusGeometry(5,1.4,8,16,Math.PI),new THREE.MeshLambertMaterial({color:0x2a241c}));
  entranceArch.rotation.set(0,0,0);entranceArch.position.set(0,4,28);S3.add(entranceArch);

  // ── Ana Koridor (dikey, merkez) ──
  bx(-9,4,0,1.5,8,64,0x2a241c,null,true);  // sol duvar
  bx(9,4,0,1.5,8,64,0x2a241c,null,true);   // sağ duvar
  // Koridor tabanında kaya yığınları (süs)
  for(let kz=-28;kz<=28;kz+=7){[-1,1].forEach(function(sg){const kk=modelYap('cevre_kaya',{s:.5+((kz+30)%3)*.25});kk.position.set(sg*7.6,0,kz+sg*1.5);kk.rotation.y=kz*sg;S3.add(kk);});}
  // Kiriş desteği (görsel, dekoratif)
  for(let cz=-26;cz<=26;cz+=8){
    yapiKoy('cevre_destek',0,cz,{w:17,h:7});
  }

  // ── Bakır Damarı (batı kolu) ──
  bx(-22,4,-8,26,8,8,0x2a241c,null,true);
  // Cevher parçaları (görsel)
  [[-16,-6],[-20,-9],[-26,-7],[-30,-5]].forEach(([x,z])=>{
    const ore=new THREE.Mesh(new THREE.DodecahedronGeometry(.6,0),new THREE.MeshLambertMaterial({color:0xB87333,emissive:0x5a3010,emissiveIntensity:.3}));
    ore.position.set(x,1,z);S3.add(ore);
  });

  // ── Eski Ocak (sol tali, batı kolun ucu) ──
  bx(-34,3.5,-8,8,7,12,0x221e18,null,true);

  // ── Demir Ocağı (doğu kolu) ──
  bx(22,4,8,26,8,8,0x2a241c,null,true);
  [[16,6],[20,9],[26,7],[30,5]].forEach(([x,z])=>{
    const ore=new THREE.Mesh(new THREE.DodecahedronGeometry(.6,0),new THREE.MeshLambertMaterial({color:0x9aa0a8,emissive:0x303438,emissiveIntensity:.3}));
    ore.position.set(x,1,z);S3.add(ore);
  });

  // ── Yeni Kanal (sağ tali, doğu kolun ucu) ──
  bx(34,3.5,8,8,7,12,0x221e18,null,true);

  // ── Gizli Oda — BOSS alanı (kuzey, en uç) ──
  bx(0,4,-34,20,8,10,0x1a1612,null,true);
  // Nadir taş parıltıları (görsel ipucu, boss odası)
  [[-6,-34],[0,-36],[6,-34],[-3,-32]].forEach(([x,z])=>{
    const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.5,0),new THREE.MeshLambertMaterial({color:0x9b59b6,emissive:0x6c3483,emissiveIntensity:.6}));
    gem.position.set(x,1.2,z);S3.add(gem);
  });

  // ── Meşaleler (fener noktaları, koridor boyunca) ──
  madenTorches=[];
  [[0,28],[0,16],[0,0],[0,-16],[-22,-8],[-34,-8],[22,8],[34,8],[0,-30]].forEach(([x,z])=>{
    yapiKoy('cevre_mesale',x,z);
    const pt=fenerLight(x,3,z,0xFF7722,2.2,11);
    madenTorches.push({light:pt,phase:Math.random()*Math.PI*2});
  });

  // ── Oyuncunun Kendi Feneri (spot light, takip eder) ──
  const playerLight=new THREE.PointLight(0xFFCC88,2.6,18);
  S3.add(playerLight);
  window._madenPlayerLight=playerLight;

  // ── Patlama Tuzakları (görünmez, yere basınca tetiklenir) ──
  madenTraps=[];
  [[0,22],[-3,10],[3,-6],[-22,-12],[22,4],[0,-26]].forEach(([x,z])=>{
    const marker=new THREE.Mesh(new THREE.CircleGeometry(.7,8),new THREE.MeshLambertMaterial({color:0x3a2818,transparent:true,opacity:.0}));
    marker.rotation.x=-Math.PI/2;marker.position.set(x,.02,z);S3.add(marker);
    madenTraps.push({x,z,r:1.0,mesh:marker,triggered:false});
  });
}

