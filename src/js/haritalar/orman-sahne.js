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
  const riverShape=[];for(let t=-46;t<=46;t+=4){riverShape.push(new THREE.Vector3(-30+Math.sin(t*0.08)*4,0.05,t));}
  const riverGeo=new THREE.BufferGeometry().setFromPoints(riverShape);
  const river=new THREE.Mesh(new THREE.PlaneGeometry(6,96),new THREE.MeshLambertMaterial({color:0x3070b0,transparent:true,opacity:.75}));
  river.rotation.x=-Math.PI/2;river.position.set(-30,0.05,0);S3.add(river);

  // ── Sık Orman (merkez — yoğun ağaç kümesi) ──
  const ormanTrees=[];
  for(let i=0;i<55;i++){
    const a=Math.random()*Math.PI*2,r=Math.random()*22;
    const tx=Math.cos(a)*r,tz=Math.sin(a)*r;
    if(Math.hypot(tx,tz)<4)continue; // merkez boş kalsın (oyuncu spawn)
    const th=1.8+Math.random()*1.2;
    const tr=new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,th,7),new THREE.MeshLambertMaterial({color:0x4a3018}));
    tr.position.set(tx,th/2,tz);tr.castShadow=true;S3.add(tr);
    const lv=new THREE.Mesh(new THREE.SphereGeometry(1.6+Math.random()*.8,9,7),new THREE.MeshLambertMaterial({color:0x2d5a20}));
    lv.position.set(tx,th+1.3,tz);lv.castShadow=true;S3.add(lv);
    addCircleCollider(tx,tz,0.5);
    ormanTrees.push({x:tx,z:tz});
  }

  // ── Avcı Kulübesi (giriş, güneybatı) ──
  bx(-32,2,32,9,4,7,0xC8A050);
  const hutRoof=new THREE.Mesh(new THREE.ConeGeometry(7,3,4),new THREE.MeshLambertMaterial({color:0x6B3A15}));
  hutRoof.rotation.y=Math.PI/4;hutRoof.position.set(-32,5,32);hutRoof.castShadow=true;S3.add(hutRoof);
  const hutDoor=new THREE.Mesh(new THREE.BoxGeometry(1.6,2.6,.2),new THREE.MeshLambertMaterial({color:0x3a1800}));
  hutDoor.position.set(-32,1.3,28.5);S3.add(hutDoor);

  // ── Mağara (doğu — Boss alanı) ──
  bx(34,3,0,10,7,12,0x6B6258,null,true);
  const caveArch=new THREE.Mesh(new THREE.TorusGeometry(4,1.2,8,16,Math.PI),new THREE.MeshLambertMaterial({color:0x4a4438}));
  caveArch.rotation.set(0,Math.PI/2,Math.PI);caveArch.position.set(29,4,0);S3.add(caveArch);
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
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),new THREE.MeshLambertMaterial({color:0x787068}));
    rock.position.set(x,s*.6,z);rock.rotation.set(Math.random(),Math.random(),Math.random());rock.castShadow=true;S3.add(rock);
    addCircleCollider(x,z,s*0.8);
  });

  // Atmosfer ışığı (orman içi puslu ışınlar hissi)
  [[0,0],[-15,10],[15,-10]].forEach(([x,z])=>{const pt=new THREE.PointLight(0xAFFFA0,1.2,18);pt.position.set(x,8,z);S3.add(pt);});
}

