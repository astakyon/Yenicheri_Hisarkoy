// ═══════════════════════════════════════════════════════
// MADEN TÜNELİ — 3D Sahne (Faz 5)
// Blueprint: Giriş (güney), Ana Koridor (dikey), Bakır Damarı
// (batı kolu), Eski Ocak (sol tali), Demir Ocağı (doğu kolu),
// Yeni Kanal (sağ tali), Gizli Oda/Boss (kuzey)
// ═══════════════════════════════════════════════════════
let madenTorches=[]; // fener ışıkları (oyuncu hareketiyle titreşir)
let madenTraps=[];   // patlama tuzakları
// Açık alanlar (dünya koordinatı, 2'nin katları); kalan her yer dolu kaya. Büyük harita çizimi ve düşman doğma noktaları da buradan okur.
const MADEN_ODALAR=[
  {id:'giris',  ad:'Giriş ve Ana Koridor',x0:-6, x1:6,  z0:2,  z1:37},
  {id:'kavsak', ad:'Ana Kavşak',          x0:-16,x1:16, z0:-14,z1:2},
  {id:'bakir',  ad:'Bakır Damarı',        x0:-30,x1:-14,z0:-10,z1:-2},
  {id:'eski',   ad:'Eski Ocak',           x0:-36,x1:-26,z0:-30,z1:4},
  {id:'demir',  ad:'Demir Ocağı',         x0:14, x1:30, z0:-10,z1:-2},
  {id:'yeni',   ad:'Yeni Kanal',          x0:26, x1:36, z0:-30,z1:4},
  {id:'kuzey',  ad:'Kuzey Geçidi',        x0:-4, x1:4,  z0:-24,z1:-14},
  {id:'gizli',  ad:'Gizli Oda (Ocakbaşı)',x0:-14,x1:14, z0:-36,z1:-24},
  {id:'bagB',   ad:'Batı Bağlantısı',     x0:-30,x1:-14,z0:-30,z1:-26},
  {id:'bagD',   ad:'Doğu Bağlantısı',     x0:14, x1:30, z0:-30,z1:-26}
];

function buildMaden(){
  clearScene();
  // Çok karanlık atmosfer — sadece fenerler aydınlatır
  S3.fog=new THREE.Fog(0x0a0806,12,50);S3.background=new THREE.Color(0x0a0806);
  S3.add(new THREE.AmbientLight(0x8a7458,1.9)); // çok düşük ambient — karanlık his
  const dim=new THREE.DirectionalLight(0x8a6a48,1.1);dim.position.set(10,20,10);S3.add(dim);

  // Kaya zemin — koyu, pürüzlü doku hissi
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshLambertMaterial({color:0x3a342c}));
  gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;S3.add(gnd);
  for(let i=0;i<35;i++){const px=(Math.random()-.5)*70,pz=(Math.random()-.5)*70;const pm=new THREE.Mesh(new THREE.CircleGeometry(1+Math.random()*1.8,7),new THREE.MeshLambertMaterial({color:0x2a241c}));pm.rotation.x=-Math.PI/2;pm.position.set(px,.01,pz);S3.add(pm);}

  // Dış sınır: kaya dolgusu zaten her yeri kapatır (aşağıda)
  MAP_HALF=38;

  // ── Giriş (güney) — kemer ──
  const entranceArch=new THREE.Mesh(new THREE.TorusGeometry(5,1.4,8,16,Math.PI),new THREE.MeshLambertMaterial({color:0x2a241c}));
  entranceArch.rotation.set(0,0,0);entranceArch.position.set(0,4,28);S3.add(entranceArch);

  // ── KAYA DOLGUSU: odalar dışındaki her 2×2'lik hücre dolu kaya (yatayda ve dikeyde birleştirilir) ──
  const acik=function(cx,cz){return MADEN_ODALAR.some(function(o){return cx>o.x0&&cx<o.x1&&cz>o.z0&&cz<o.z1;});};
  const N=38,hucre=[];
  for(let j=0;j<N;j++){hucre.push([]);for(let i=0;i<N;i++)hucre[j].push(!acik(-38+i*2+1,-38+j*2+1));}
  const kullan=hucre.map(function(r){return r.map(function(){return false;});});
  const kayaRenk=[0x2a241c,0x241f18,0x2e2820];let kri=0;
  for(let j=0;j<N;j++){for(let i=0;i<N;i++){
    if(!hucre[j][i]||kullan[j][i])continue;
    let w=0;while(i+w<N&&hucre[j][i+w]&&!kullan[j][i+w])w++;
    let h=1;
    while(j+h<N){let ok=true;for(let k=0;k<w;k++)if(!hucre[j+h][i+k]||kullan[j+h][i+k]){ok=false;break;}if(!ok)break;h++;}
    for(let a2=0;a2<h;a2++)for(let k=0;k<w;k++)kullan[j+a2][i+k]=true;
    bx(-38+i*2+w,2.3,-38+j*2+h,w*2,4.6,h*2,kayaRenk[(kri++)%3],0x14100c,true);
  }}

  // ── Kiriş destekleri (görsel; koridor boyunca ve kollarda) ──
  for(let cz=26;cz>=6;cz-=8)yapiKoy('cevre_destek',0,cz,{w:13,h:6});
  [-1,1].forEach(function(sg){[22,28].forEach(function(x){yapiKoy('cevre_destek',sg*x,-6,{w:9,h:6},null,Math.PI/2);});});
  // Koridor tabanında kaya yığınları (süs; duvar dibinde)
  for(let kz=22;kz>=-2;kz-=6){[-1,1].forEach(function(sg){const kk=modelYap('cevre_kaya',{s:.5+((kz+30)%3)*.25});kk.position.set(sg*5,0,kz+sg*1.5);kk.rotation.y=kz*sg;S3.add(kk);});}

  // Cevher ve taşlar toplanabilir ganimettir (madenCevherYenile); her dalgada yenilenir.

  // ── Meşaleler (her odada en az bir tane) ──
  madenTorches=[];
  [[0,30],[0,16],[0,6],[-10,-6],[10,-6],[0,-18],[-22,-5],[22,-5],[-31,-12],[31,-12],[-22,-28],[22,-28],[-9,-31],[9,-31]].forEach(function(p){
    yapiKoy('cevre_mesale',p[0],p[1]);
    const pt=fenerLight(p[0],3,p[1],0xFF7722,2.2,11);
    madenTorches.push({light:pt,phase:Math.random()*Math.PI*2});
  });

  // ── Oyuncunun Kendi Feneri (spot light, takip eder) ──
  const playerLight=new THREE.PointLight(0xFFCC88,2.6,18);
  S3.add(playerLight);
  window._madenPlayerLight=playerLight;

  // ── Patlama Tuzakları (görünmez, yere basınca tetiklenir) ──
  madenTraps=[];
  [[0,22],[-3,10],[3,-6],[-22,-6],[22,-6],[0,-19]].forEach(([x,z])=>{
    const marker=new THREE.Mesh(new THREE.CircleGeometry(.7,8),new THREE.MeshLambertMaterial({color:0x3a2818,transparent:true,opacity:.0}));
    marker.rotation.x=-Math.PI/2;marker.position.set(x,.02,z);S3.add(marker);
    madenTraps.push({x,z,r:1.0,mesh:marker,triggered:false});
  });
}



// ── Toplanabilir cevherler: bakır (deri→Bakır), demir (metal→Demir), mor taş (akçe). Her dalgada yenilenir. ──
const MADEN_CEVHER=[
  [-18,-4,'deri'],[-22,-8,'deri'],[-26,-5,'deri'],[-31,-3,'deri'],[-31,-12,'deri'],[-31,-22,'deri'],[-22,-28,'deri'],[-10,-8,'deri'],[-3,16,'deri'],
  [18,-4,'metal'],[22,-8,'metal'],[26,-5,'metal'],[31,-3,'metal'],[31,-12,'metal'],[31,-22,'metal'],[22,-28,'metal'],[10,-8,'metal'],[3,12,'metal'],
  [-10,-30,'akce'],[0,-34,'akce'],[10,-30,'akce'],[-4,-27,'akce'],[0,-18,'akce']
];
function madenCevherYenile(){
  if(!S3)return;
  loots=loots.filter(function(l){if(l.cevher){S3.remove(l.mesh);return false;}return true;});
  MADEN_CEVHER.forEach(function(c){
    let geo,mat,col;
    if(c.length&&c[2]==='deri'){col=0xB87333;geo=new THREE.DodecahedronGeometry(.62,0);mat=new THREE.MeshLambertMaterial({color:col,emissive:0x7a4410,emissiveIntensity:.55});}
    else if(c[2]==='metal'){col=0xAAB4C0;geo=new THREE.DodecahedronGeometry(.62,0);mat=new THREE.MeshLambertMaterial({color:col,emissive:0x4a5260,emissiveIntensity:.55});}
    else{col=0xC070FF;geo=new THREE.OctahedronGeometry(.55,0);mat=new THREE.MeshLambertMaterial({color:col,emissive:0x8a3cc8,emissiveIntensity:.9});}
    const m=new THREE.Mesh(geo,mat);m.position.set(c[0],.35,c[1]);S3.add(m);
    loots.push({id:newNetId(),mesh:m,type:c[2],col:col,x:c[0],z:c[1],vx:0,vz:0,collected:false,cevher:true});
  });
}
