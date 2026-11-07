// ═══════════════════════════════════════════════════════
// AV ORMANI — 3D Sahne (Faz 5)
// Blueprint: Avcı Kulübesi (giriş/GB), Sık Orman (merkez),
// Akarsu (batı), Mağara/Boss (doğu), Sulak Alan (GD), Açık Ova (güney)
// ═══════════════════════════════════════════════════════
function buildOrman(){
  clearScene();
  S3.fog=new THREE.Fog(0x6a8050,28,76);S3.background=new THREE.Color(0x9bc4e0);
  const sun=new THREE.DirectionalLight(0xFFF8E0,2.6);sun.position.set(18,32,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-50;sun.shadow.camera.right=50;sun.shadow.camera.top=50;sun.shadow.camera.bottom=-50;S3.add(sun);
  S3.add(new THREE.AmbientLight(0xC8E8C0,1.1));S3.add(new THREE.HemisphereLight(0x9bc4e0,0x4a7030,1.0));

  // Zemin — orman çimi
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshLambertMaterial({color:0x5a8c3a}));
  gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;S3.add(gnd);
  // Toprak yama dokusu
  for(let i=0;i<40;i++){const px=(Math.random()-.5)*90,pz=(Math.random()-.5)*90;const pm=new THREE.Mesh(new THREE.CircleGeometry(1.5+Math.random()*2,8),new THREE.MeshLambertMaterial({color:0x6a9048}));pm.rotation.x=-Math.PI/2;pm.position.set(px,.01,pz);S3.add(pm);}

  // Dış sınır (görünmez duvar — collider)
  MAP_HALF=46;
  bx(0,2.5,-46,96,5,1.5,0x3a5a28,null,true);bx(0,2.5,46,96,5,1.5,0x3a5a28,null,true);
  bx(-46,2.5,0,1.5,5,96,0x3a5a28,null,true);bx(46,2.5,0,1.5,5,96,0x3a5a28,null,true);

  // ── Akarsu (batı kenar) ──
  yapiKoy('cevre_nehir',-30,0,{L:96,w:6}).rotation.y=0;

  // ── Sık Orman (merkez — yoğun ağaç kümesi) ──
  const ormanTrees=[];
  for(let i=0;i<55;i++){
    const a=Math.random()*Math.PI*2,r=Math.random()*22;
    const tx=Math.cos(a)*r,tz=Math.sin(a)*r;
    if(Math.hypot(tx,tz)<4)continue; // merkez boş kalsın (oyuncu spawn)
    const th=1.8+Math.random()*1.2;
    Math.random();   // (eski yaprak boyu çekilişi: altın test sırası değişmesin)
    const agac=modelYap(i%3===0?'cevre_cam':'cevre_agac',{h:th+2.2});agac.position.set(tx,0,tz);agac.rotation.y=i*2.4;S3.add(agac);
    addCircleCollider(tx,tz,0.5);
    ormanTrees.push({x:tx,z:tz});
  }

  // ── Avcı Kulübesi (giriş, güneybatı) ──
  yapiKoy('yapi_ev',-32,32,{w:9,d:7});

  // ── Mağara (doğu — Boss alanı) ──
  yapiKoy('cevre_magara',34,0,{w:10,d:12,h:7},[10,12]);
  // Mağara içi karanlık zemin
  const caveFloor=new THREE.Mesh(new THREE.CircleGeometry(5,16),new THREE.MeshLambertMaterial({color:0x2a2620}));
  caveFloor.rotation.x=-Math.PI/2;caveFloor.position.set(34,.02,0);S3.add(caveFloor);

  // ── Sulak Alan (güneydoğu — loot bölgesi) ──
  const wetland=new THREE.Mesh(new THREE.CircleGeometry(10,20),new THREE.MeshLambertMaterial({color:0x4a7a5a,transparent:true,opacity:.6}));
  wetland.rotation.x=-Math.PI/2;wetland.position.set(20,.03,28);S3.add(wetland);
  for(let i=0;i<8;i++){const a=Math.random()*Math.PI*2,r=4+Math.random()*5;const rx=20+Math.cos(a)*r,rz=28+Math.sin(a)*r;const reed=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,1.4,5),new THREE.MeshLambertMaterial({color:0x6a8a3a}));reed.position.set(rx,.7,rz);S3.add(reed);}

  // ── Açık Ova (güney) ──
  const ova=new THREE.Mesh(new THREE.PlaneGeometry(36,16),new THREE.MeshLambertMaterial({color:0x7aa850}));
  ova.rotation.x=-Math.PI/2;ova.position.set(-5,.02,38);S3.add(ova);

  // Kayalar (dekoratif, bazı collider'lı)
  [[10,-10,1.6],[-8,15,1.3],[15,-25,1.8],[5,25,1.4],[-20,-15,1.5]].forEach(([x,z,s])=>{
    Math.random();Math.random();Math.random();   // eski dönüş çekilişleri
    const rock=modelYap('cevre_kaya',{s:s*.85});rock.position.set(x,0,z);rock.rotation.y=x+z;S3.add(rock);
    addCircleCollider(x,z,s*0.8);
  });

  // Atmosfer ışığı (orman içi puslu ışınlar hissi)
  [[0,0],[-15,10],[15,-10]].forEach(([x,z])=>{const pt=new THREE.PointLight(0xAFFFA0,1.2,18);pt.position.set(x,8,z);S3.add(pt);});
}

