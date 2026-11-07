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
  // Kaya yığınları ve damarlar: madenDamarYenile() ile kazılabilir düğüm olarak konur.

  // Cevher ve taşlar toplanabilir ganimettir (madenCevherYenile); her dalgada yenilenir.

  // ── Meşaleler (her odada en az bir tane) ──
  madenTorches=[];
  [[0,30],[0,16],[0,6],[-10,-6],[10,-6],[0,-18],[-22,-5],[22,-5],[-31,-12],[31,-12],[-22,-28],[22,-28],[-9,-31],[9,-31]].forEach(function(p){
    yapiKoy('cevre_mesale',p[0],p[1]);
    const pt=fenerLight(p[0],3,p[1],0xFF7722,2.2,11);
    madenTorches.push({light:pt,phase:Math.random()*Math.PI*2});
  });

  // ── ÇIKIŞ: giriş koridorunun ucunda yeşil halka; yaklaşınca [E] ile Kışla'ya dönülür ──
  const halka=new THREE.Mesh(new THREE.RingGeometry(1.7,2.4,32),new THREE.MeshBasicMaterial({color:0x66ff99,transparent:true,opacity:.65,side:THREE.DoubleSide}));
  halka.rotation.x=-Math.PI/2;halka.position.set(0,.06,MADEN_CIKIS.z);S3.add(halka);window._madenHalka=halka;
  S3.add(madenYaziSprite('⬇ ÇIKIŞ — KIŞLA',0x66ff99,0,3.4,MADEN_CIKIS.z));
  madenTorches.push({light:fenerLight(0,3,MADEN_CIKIS.z-1,0x66ff99,1.8,9),phase:0});

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
  [-10,-30,'akce'],[6,-32,'akce'],[10,-30,'akce'],[-4,-27,'akce'],[0,-18,'akce']
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


// ═══════════ ÇIKIŞ ═══════════
const MADEN_CIKIS={id:'madenCikis',icon:'🏰',name:'Madenden Çık',x:0,z:34.5};
function madenYaziSprite(t,renk,x,y,z){
  const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');
  g.font='bold 44px Cinzel, Georgia, serif';g.textAlign='center';g.textBaseline='middle';
  g.lineWidth=8;g.strokeStyle='rgba(0,0,0,.85)';g.strokeText(t,256,50);g.fillStyle='#'+('000000'+renk.toString(16)).slice(-6);g.fillText(t,256,50);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));
  sp.scale.set(6.4,1.2,1);sp.position.set(x,y,z);sp.renderOrder=20;return sp;
}
function madenCik(){
  if(currentMap!=='maden'||pl.hp<=0)return;
  transferPool();   // sağ çıkınca kazanılan akçe kışlaya aktarılır
  BEGIN('kisla');
}

// ═══════════ KAZILABİLİR DAMARLAR (kazma = yakın saldırı) ═══════════
// tip: kaya → akçe, bakır → bakır (deri), demir → demir (metal), gümüş/altın → akçe (çok)
const DAMAR_TUR={
  kaya: {ad:'Kaya',        hp:3,renk:0x8a8478,damar:0,       em:0,       ganimet:'akce', adet:1},
  bakir:{ad:'Bakır Damarı',hp:4,renk:0x6a5a4a,damar:0xD0782C,em:0x7a4410,ganimet:'deri', adet:3},
  demir:{ad:'Demir Damarı',hp:5,renk:0x5a5e66,damar:0xB8C4D4,em:0x4a5262,ganimet:'metal',adet:3},
  gumus:{ad:'Gümüş Damarı',hp:5,renk:0x5e6064,damar:0xF0F4FF,em:0x8890a8,ganimet:'akce', adet:3},
  altin:{ad:'Altın Damarı',hp:7,renk:0x5a5040,damar:0xFFD24A,em:0xC89010,ganimet:'akce', adet:6}
};
const MADEN_DAMAR=[
  // koridor kenarı kayaları
  [-4.8,22,'kaya'],[4.8,19,'kaya'],[-4.8,13,'kaya'],[4.8,8,'kaya'],[-4.8,4,'kaya'],[-11,-12,'kaya'],[11,-12,'kaya'],[-33,-14,'kaya'],[33,-14,'kaya'],
  // bakır (batı) ve demir (doğu)
  [-20,-9,'bakir'],[-27,-3,'bakir'],[-33,-24,'bakir'],[-33,-5,'bakir'],
  [20,-9,'demir'],[27,-3,'demir'],[33,-24,'demir'],[33,-5,'demir'],
  // gümüş: kavşak ve kuzey geçidi
  [-14,-12.5,'gumus'],[14,-12.5,'gumus'],[-3,-20,'gumus'],
  // altın: gizli oda
  [-12,-34,'altin'],[12,-34,'altin'],[0,-35,'altin']
];
let madenDamarlar=[];
function madenDamarYenile(){
  if(!S3)return;
  madenDamarlar.forEach(function(n){S3.remove(n.mesh);const i=colliders.indexOf(n.col);if(i>-1)colliders.splice(i,1);});
  madenDamarlar=[];
  MADEN_DAMAR.forEach(function(d,k){
    const t=DAMAR_TUR[d[2]],g=new THREE.Group();
    const kaya=modelYap('cevre_kaya',{s:1.15});g.add(kaya);
    kaya.traverse(function(o){if(o.isMesh&&o.material&&o.material.color){o.material=o.material.clone();o.material.color.setHex(t.renk);}});
    if(t.damar){   // kristaller tek bir mesh'te birleştirilir (mesh bütçesi)
      const pos=[];
      for(let i=0;i<5;i++){
        const kg=new THREE.OctahedronGeometry(.2+(i%3)*.06,0);const a=i*1.26+k;
        kg.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a)*.55,.55+(i%2)*.35,Math.sin(a)*.55),new THREE.Quaternion().setFromEuler(new THREE.Euler(a,a*.7,0)),new THREE.Vector3(1,1,1)));
        const ng=kg.index?kg.toNonIndexed():kg;const pa=ng.attributes.position.array;for(let q=0;q<pa.length;q++)pos.push(pa[q]);
      }
      const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));bg.computeVertexNormals();
      g.add(new THREE.Mesh(bg,new THREE.MeshLambertMaterial({color:t.damar,emissive:t.em,emissiveIntensity:.8})));
    }
    g.position.set(d[0],0,d[1]);g.rotation.y=k*1.7;S3.add(g);
    const col={x:d[0],z:d[1],r:.95};colliders.push(col);
    madenDamarlar.push({x:d[0],z:d[1],tur:d[2],ad:t.ad,hp:t.hp,maxHp:t.hp,mesh:g,col:col,pulse:0});
  });
}
// Yakın saldırı (doMelee) kazma gibi damara vurur
function madenKaz(ax,az,p){
  madenDamarlar.forEach(function(n){
    if(n.hp<=0||Math.hypot(n.x-ax,n.z-az)>2.9)return;
    n.hp--;n.pulse=8;addFX(n.x,n.z,n.tur==='kaya'?0x9a9488:(DAMAR_TUR[n.tur].damar||0x9a9488),6);
    if(n.hp<=0){
      S3.remove(n.mesh);const i=colliders.indexOf(n.col);if(i>-1)colliders.splice(i,1);
      const t=DAMAR_TUR[n.tur];madenGanimet(n.x,n.z,t.ganimet,t.adet);
      lootPop('⛏ '+n.ad+' kazıldı!');
    }
  });
  madenDamarlar=madenDamarlar.filter(function(n){return n.hp>0;});
}
function madenGanimet(x,z,tip,adet){
  const col=tip==='akce'?0xFFD700:tip==='deri'?0xB87333:0xAAAAAA;
  for(let i=0;i<adet;i++){const m=modelYap('ganimet_'+tip);m.position.set(x+(Math.random()-.5)*2,.3,z+(Math.random()-.5)*2);S3.add(m);
    loots.push({id:newNetId(),mesh:m,type:tip,col:col,x:m.position.x,z:m.position.z,vx:(Math.random()-.5)*.1,vz:(Math.random()-.5)*.1,collected:false});}
}
// Her karede: çıkış ve damar ipuçları, vuruş titreşimi
function madenEtkilesim(){
  const intH=document.getElementById('intH'),zBtn=document.getElementById('zoneBtn');
  if(window._madenHalka)window._madenHalka.material.opacity=.5+Math.sin(gt*.08)*.2;
  madenDamarlar.forEach(function(n){if(n.pulse>0){n.pulse--;n.mesh.scale.setScalar(1+Math.sin(n.pulse*.9)*.09);}else if(n.mesh.scale.x!==1)n.mesh.scale.setScalar(1);});
  if(Math.hypot(pl.x-MADEN_CIKIS.x,pl.z-MADEN_CIKIS.z)<3.8){
    pl.nearZone=MADEN_CIKIS;intH.textContent='[ E ] 🏰 Madenden Çık — kazanç kışlaya aktarılır';intH.style.display='block';zBtn.innerHTML='🏰<br>Çık';zBtn.style.display='flex';return;
  }
  pl.nearZone=null;zBtn.style.display='none';
  let yakin=null,yd=3.4;madenDamarlar.forEach(function(n){const d=Math.hypot(pl.x-n.x,pl.z-n.z);if(d<yd){yd=d;yakin=n;}});
  if(yakin){intH.textContent='⛏ '+yakin.ad+' — saldırıyla kaz ('+yakin.hp+'/'+yakin.maxHp+')';intH.style.display='block';}else intH.style.display='none';
}
