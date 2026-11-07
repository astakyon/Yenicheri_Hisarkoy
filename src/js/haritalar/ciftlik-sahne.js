// ═══════════════════════════════════════════════════════
// ÇİFTLİK — sadece tarım haritası (v1.63): ek, büyümesini bekle, biç, pazarda sat
// Parseller SAVE.ciftlik içinde gerçek zamanla büyür (oyundan çıksan da büyümeye devam eder).
// ═══════════════════════════════════════════════════════
const CIFTLIK_EKIN={
  arpa:   {ad:'Arpa',   simge:'🌾',tohum:3, sure:30, deger:8,  renk:0xC9B458},
  bugday: {ad:'Buğday', simge:'🌾',tohum:5, sure:60, deger:16, renk:0xE2B94C},
  pamuk:  {ad:'Pamuk',  simge:'☁',tohum:9, sure:100,deger:30, renk:0xF4F4EC},
  uzum:   {ad:'Üzüm',   simge:'🍇',tohum:14,sure:150,deger:48, renk:0x7A2C9C}
};
const CIFTLIK_SIRA=['arpa','bugday','pamuk','uzum'];
// Parsel merkezleri: 4 sütun × 3 sıra, her biri 7×7
const CIFTLIK_PARSELLER=(function(){const a=[];[-14,-4,6].forEach(function(z){[-13.5,-4.5,4.5,13.5].forEach(function(x){a.push({x:x,z:z,w:7,d:7});});});return a;})();
const CIFTLIK_RAF={id:'ciftlikRaf',icon:'🌰',name:'Tohum Rafı',x:-9,z:22};
const CIFTLIK_PAZAR={id:'ciftlikPazar',icon:'💰',name:'Pazar Tezgâhı',x:9,z:22};
const CIFTLIK_CIKIS={id:'ciftlikCikis',icon:'🏰',name:'Çiftlikten Çık',x:0,z:33.5};
let ciftlikMeshler=[];   // parsel başına ekin meshi

function ciftlikHazirla(){
  const c=SAVE.ciftlik||(SAVE.ciftlik={});
  if(!c.parsel||c.parsel.length!==CIFTLIK_PARSELLER.length)c.parsel=CIFTLIK_PARSELLER.map(function(){return{e:null,t:0};});
  c.depo=Object.assign({arpa:0,bugday:0,pamuk:0,uzum:0},c.depo||{});
  if(!CIFTLIK_EKIN[c.secili])c.secili='arpa';
  return c;
}
// 0..1 büyüme oranı (boş parselde -1)
function ciftlikOran(p){
  if(!p.e)return -1;
  return Math.min(1,Math.max(0,(Date.now()-p.t)/(CIFTLIK_EKIN[p.e].sure*1000)));
}
function ciftlikEkinGeo(ekin,olgun){
  const key='ekin_'+ekin+(olgun?'_o':'_y');if(_GC[key])return _GC[key];
  const col=olgun?CIFTLIK_EKIN[ekin].renk:0x5a9a3a,G=[];
  for(let i=0;i<5;i++)for(let j=0;j<5;j++){
    const x=-2.4+i*1.2+((j%2)?.25:0),z=-2.4+j*1.2;
    G.push([_g('ConeGeometry',.38,1.5,5),col,x,.75,z]);
    if(olgun&&ekin==='pamuk')G.push([_g('SphereGeometry',.28,5,4),0xFFFFFF,x,1.55,z]);
    if(olgun&&ekin==='uzum')G.push([_g('SphereGeometry',.24,5,4),0x4a1a6a,x+.2,.55,z]);
  }
  return _GC[key]=_birles(G);
}
function ciftlikGorselYenile(){
  const c=ciftlikHazirla();
  ciftlikMeshler.forEach(function(m,i){
    const p=c.parsel[i],o=ciftlikOran(p);
    if(o<0){m.visible=false;return;}
    const olgun=o>=1;
    if(m.userData.durum!==p.e+(olgun?'o':'y')){m.geometry=ciftlikEkinGeo(p.e,olgun);m.userData.durum=p.e+(olgun?'o':'y');}
    m.visible=true;m.scale.set(1,.25+.75*o,1);
  });
}

function buildCiftlik(){
  clearScene();
  S3.fog=new THREE.Fog(0xb4cf98,40,100);S3.background=new THREE.Color(0xa8d0ec);
  const sun=new THREE.DirectionalLight(0xFFF2D0,1.8);sun.position.set(-20,34,14);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;S3.add(sun);
  S3.add(new THREE.AmbientLight(0xE8F0D0,.75));S3.add(new THREE.HemisphereLight(0xa8d0ec,0x6a8a38,.5));
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshLambertMaterial({color:0x6a9434}));
  gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;S3.add(gnd);
  MAP_HALF=38;
  bx(0,2.5,-38,78,5,1.5,0x5a7a30,null,true);bx(0,2.5,38,78,5,1.5,0x5a7a30,null,true);
  bx(-38,2.5,0,1.5,5,78,0x5a7a30,null,true);bx(38,2.5,0,1.5,5,78,0x5a7a30,null,true);
  // Patikalar
  const yolMat=new THREE.MeshLambertMaterial({color:0x9c8250});
  [[0,10,5,52],[0,-4,64,3]].forEach(function(r){const y=new THREE.Mesh(new THREE.PlaneGeometry(r[2],r[3]),yolMat);y.rotation.x=-Math.PI/2;y.position.set(r[0],.015,r[1]);y.receiveShadow=true;S3.add(y);});
  // Parseller
  const c=ciftlikHazirla();ciftlikMeshler=[];
  const toprakMat=new THREE.MeshLambertMaterial({color:0x5a3e1c});
  CIFTLIK_PARSELLER.forEach(function(p){
    const t=new THREE.Mesh(new THREE.PlaneGeometry(p.w,p.d),toprakMat);t.rotation.x=-Math.PI/2;t.position.set(p.x,.03,p.z);t.receiveShadow=true;S3.add(t);
    const m=new THREE.Mesh(ciftlikEkinGeo('arpa',false),new THREE.MeshLambertMaterial({vertexColors:true}));
    m.position.set(p.x,0,p.z);m.visible=false;S3.add(m);ciftlikMeshler.push(m);
  });
  // Çiftlik evi, ambar, raf, pazar
  yapiKoy('yapi_ev',-24,-26,{w:7,d:5.5},[7,5.5]);
  yapiKoy('yapi_ev',24,-26,{w:7,d:5.5},[7,5.5]);
  yapiKoy('yapi_dukkan',CIFTLIK_PAZAR.x,CIFTLIK_PAZAR.z+3.2,{w:6,d:3},[6,2.6]);
  [[-9,25],[-7,25]].forEach(function(p){const g=modelYap('cevre_sandik');g.position.set(p[0],0,p[1]);S3.add(g);addCircleCollider(p[0],p[1],.8);});
  const raf=modelYap('cevre_varil');raf.position.set(CIFTLIK_RAF.x,0,CIFTLIK_RAF.z+1.6);S3.add(raf);addCircleCollider(CIFTLIK_RAF.x,CIFTLIK_RAF.z+1.6,.8);
  [[-5,18],[5,18],[-5,-30],[5,-30]].forEach(function(p){yapiKoy('cevre_mesale',p[0],p[1]);});
  [[-34,-34],[-34,-10],[-34,14],[34,-34],[34,-10],[34,14],[-20,-34],[20,-34],[-34,30],[34,30]].forEach(function(p,i){
    const a=modelYap(i%3===0?'cevre_cam':'cevre_agac',{h:4.2+(i%3)*.5});a.position.set(p[0],0,p[1]);a.rotation.y=i*2.1;S3.add(a);addCircleCollider(p[0],p[1],.6);
  });
  // Çıkış halkası
  const halka=new THREE.Mesh(new THREE.RingGeometry(1.7,2.4,32),new THREE.MeshBasicMaterial({color:0x66ff99,transparent:true,opacity:.65,side:THREE.DoubleSide}));
  halka.rotation.x=-Math.PI/2;halka.position.set(CIFTLIK_CIKIS.x,.06,CIFTLIK_CIKIS.z);S3.add(halka);window._ciftlikHalka=halka;
  S3.add(madenYaziSprite('⬇ ÇIKIŞ — KIŞLA',0x66ff99,0,3.4,CIFTLIK_CIKIS.z));
  S3.add(madenYaziSprite('TOHUM RAFI',0xE8C060,CIFTLIK_RAF.x,3.2,CIFTLIK_RAF.z));
  S3.add(madenYaziSprite('PAZAR',0xE8C060,CIFTLIK_PAZAR.x,3.2,CIFTLIK_PAZAR.z));
  ciftlikGorselYenile();
}
