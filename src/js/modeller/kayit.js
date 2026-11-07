// ═══════════════════════════════════════════════════════
// MODEL KAYDI — oyundaki bütün 3B modellerin tek listesi
// Her model önce KODLA çizilir (indirme gerekmez, her zaman çalışır). assets/models.json ya da bu cihazdaki
// Model Kütüphanesi bir .glb tanımlarsa o kullanılır; yüklenemezse kod modeliyle devam edilir.
// Yeni model: modelTanimla('kimlik',{ad,grup,boy,yap,bar}) → kütüphanede, oyunda ve çok oyunculu istemcide görünür.
// Belge: docs/MODELLER.md, docs/MODEL-EKLEME.md
// ═══════════════════════════════════════════════════════
const MODEL_KAYIT={liste:[],harita:{},glb:{},glbDosya:{},kaynak:{}};

function modelTanimla(id,tanim){
  tanim.id=id;
  if(MODEL_KAYIT.harita[id]){MODEL_KAYIT.liste[MODEL_KAYIT.liste.indexOf(MODEL_KAYIT.harita[id])]=tanim;}
  else MODEL_KAYIT.liste.push(tanim);
  MODEL_KAYIT.harita[id]=tanim;
}

// Sağlık çubuğu yer bilgisi (genişlik, yükseklik, renk) — oyun ve istemci aynı yerden alır
function modelHpCubuk(id){
  const t=MODEL_KAYIT.harita[id];
  const b=(t&&t.bar)||{w:1.1,y:2.9,renk:0x22cc55};
  const bg=new THREE.Mesh(new THREE.PlaneGeometry(b.w,.14),new THREE.MeshBasicMaterial({color:0x330000,side:THREE.DoubleSide,depthTest:false}));
  bg.position.set(0,b.y,0);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(b.w,.14),new THREE.MeshBasicMaterial({color:b.renk,side:THREE.DoubleSide,depthTest:false}));
  fl.position.set(0,b.y,.01);
  return {bg:bg,fl:fl};
}

// Not: tek parçalı modeller (mermi, ganimet) sarmalayıcı Group olmadan döner. THREE nesne kimliği (UUID) Math.random
// kullandığı için fazladan nesne, tek kişilik altın testin rastgele sayı akışını kaydırır.
// Modeli üretir. opsiyon: {cubuk:true} → sağlık çubuğunu ekler ve g.userData.hpBg/hpFl verir
function modelYap(id,opsiyon){
  const t=MODEL_KAYIT.harita[id];
  if(!t)throw new Error('Bilinmeyen model: '+id);
  let g;
  const glb=MODEL_KAYIT.glb[id];
  if(glb)g=glbKopya(id,glb,t);
  else{g=t.yap();g.userData.kaynak='kod';}
  if(!g.userData.govde){let ilk=null;g.traverse(function(o){if(!ilk&&o.isMesh&&o.material&&o.material.color)ilk=o;});g.userData.govde=ilk;}
  if(opsiyon&&opsiyon.cubuk&&t.bar){const c=modelHpCubuk(id);g.add(c.bg);g.add(c.fl);g.userData.hpBg=c.bg;g.userData.hpFl=c.fl;}
  return g;
}

// .glb'den gelen sahneyi gerçek boyuna ölçekleyip sarar
function glbKopya(id,glb,t){
  const g=new THREE.Group();
  const kopya=glb.scene.clone(true);
  kopya.traverse(function(o){if(o.isMesh&&o.material){o.material=o.material.clone();o.castShadow=true;}});
  const kutu=new THREE.Box3().setFromObject(kopya);
  const yuk=Math.max(.001,kutu.max.y-kutu.min.y),olcek=(t.boy||yuk)/yuk;
  const r=MODEL_KAYIT.glbAyar&&MODEL_KAYIT.glbAyar[id];
  kopya.scale.multiplyScalar(olcek);
  if(r&&r.rotY)kopya.rotation.y=r.rotY*Math.PI/180;
  const k2=new THREE.Box3().setFromObject(kopya);
  kopya.position.y-=k2.min.y;                    // ayaklar zeminde
  g.add(kopya);g.userData.kaynak='glb';
  let ilk=null;kopya.traverse(function(o){if(!ilk&&o.isMesh)ilk=o;});g.userData.govde=ilk;
  return g;
}

// Vuruş parlaması: kod modelinde gövde rengini kırmızıya çevirir; .glb'de doku bozulmasın diye emissive kullanır
function modelVurus(govde,aktif,tabanRenk){
  if(!govde||!govde.material)return;
  const glb=govde.parent&&govde.parent.parent&&govde.parent.parent.userData&&govde.parent.parent.userData.kaynak==='glb';
  if(glb&&govde.material.emissive){govde.material.emissive.setHex(aktif?0x661111:0x000000);return;}
  if(aktif)govde.material.color.setHex(0xff3333);else if(tabanRenk!==undefined)govde.material.color.setHex(tabanRenk);
}

// ── Kod modelleri ──
function _kutu(w,h,d,renk,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:renk}));m.position.set(x||0,y||0,z||0);return m;}

modelTanimla('yeniceri',{ad:'Yeniçeri (oyuncu)',grup:'Karakter',boy:3.0,yap:function(){return createPlayerMesh();}});

function _dusmanGovde(boss){
  const g=new THREE.Group();
  const bw=boss?1.3:.88,bh=boss?1.7:1.35;
  const body=_kutu(bw,bh,boss?.75:.48,boss?0x7B0000:0x4a2000,0,boss?1.25:1,0);body.castShadow=true;g.add(body);
  const head=_kutu(boss?.78:.58,boss?.65:.52,boss?.65:.5,0xA06840,0,boss?2.25:2,0);g.add(head);
  if(boss){const crown=new THREE.Mesh(new THREE.ConeGeometry(.5,.5,6),new THREE.MeshLambertMaterial({color:0xFFD700}));crown.position.y=.75;head.add(crown);}
  g.userData.govde=body;
  return g;
}
modelTanimla('dusman',{ad:'Düşman askeri',grup:'Düşman',boy:2.3,bar:{w:1.1,y:2.9,renk:0x22cc55},yap:function(){return _dusmanGovde(false);}});
modelTanimla('dusman_boss',{ad:'Düşman komutanı (boss)',grup:'Düşman',boy:2.7,bar:{w:1.6,y:3.1,renk:0xFFD700},yap:function(){return _dusmanGovde(true);}});

function _eskiyaGovde(boss){
  const size=boss?1.3:1,g=new THREE.Group();
  const body=_kutu(.9*size,1.4*size,.5*size,boss?0x5a1010:0x4a3828,0,1*size,0);body.castShadow=true;g.add(body);
  const head=_kutu(.6*size,.55*size,.55*size,0x8a6048,0,2*size,0);g.add(head);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.32*size,8,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:0x2a2018}));
  helmet.position.y=.25*size;head.add(helmet);
  if(boss){const crown=new THREE.Mesh(new THREE.ConeGeometry(.45,.5,6),new THREE.MeshLambertMaterial({color:0xFFD700}));crown.position.y=.7*size;head.add(crown);}
  g.userData.govde=body;
  return g;
}
modelTanimla('eskiya',{ad:'Eşkıya madenci',grup:'Düşman',boy:2.4,bar:{w:1.0,y:2.6,renk:0x22cc55},yap:function(){return _eskiyaGovde(false);}});
modelTanimla('eskiya_boss',{ad:'Ocakbaşı eşkıyası (boss)',grup:'Düşman',boy:3.1,bar:{w:1.7,y:3.38,renk:0xFFD700},yap:function(){return _eskiyaGovde(true);}});

function _hayvanGovde(col,s,boss){
  const g=new THREE.Group();
  const body=_kutu(1.1*s,.8*s,1.7*s,col,0,.7*s,0);body.castShadow=true;g.add(body);
  const head=_kutu(.6*s,.55*s,.6*s,col,0,.85*s,.9*s);g.add(head);
  [-0.35*s,0.35*s].forEach(function(ox){[-0.5*s,0.5*s].forEach(function(oz){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.08*s,.08*s,.65*s,6),new THREE.MeshLambertMaterial({color:col}));
    leg.position.set(ox,.32*s,oz);g.add(leg);
  });});
  if(boss){const crown=new THREE.Mesh(new THREE.ConeGeometry(.5,.6,6),new THREE.MeshLambertMaterial({color:0xFFD700}));crown.position.set(0,1.3*s,.9*s);head.add(crown);}
  g.userData.govde=body;
  return g;
}
modelTanimla('geyik',{ad:'Geyik',grup:'Hayvan',boy:1.5,bar:{w:1.0,y:1.36,renk:0x22cc55},yap:function(){return _hayvanGovde(0x8B6030,.85,false);}});
modelTanimla('kurt',{ad:'Kurt',grup:'Hayvan',boy:1.6,bar:{w:1.0,y:1.52,renk:0x22cc55},yap:function(){return _hayvanGovde(0x4a4a4a,.95,false);}});
modelTanimla('domuz',{ad:'Yaban domuzu',grup:'Hayvan',boy:1.7,bar:{w:1.0,y:1.68,renk:0x22cc55},yap:function(){return _hayvanGovde(0x5a3a20,1.05,false);}});
modelTanimla('ayi',{ad:'Koca Ayı (boss)',grup:'Hayvan',boy:2.9,bar:{w:1.8,y:2.72,renk:0xFFD700},yap:function(){return _hayvanGovde(0x3a2810,1.7,true);}});

// Mermi ve ganimet
modelTanimla('mermi_tufek',{ad:'Tüfek mermisi',grup:'Eşya',boy:.2,yap:function(){return new THREE.Mesh(new THREE.SphereGeometry(.1,5,4),new THREE.MeshBasicMaterial({color:0xFFFDE7}));}});
modelTanimla('mermi_ok',{ad:'Ok',grup:'Eşya',boy:.18,yap:function(){return new THREE.Mesh(new THREE.SphereGeometry(.09,5,4),new THREE.MeshBasicMaterial({color:0x8B4513}));}});
[['akce','Akçe',0xFFD700],['deri','Deri',0x8B4513],['metal','Metal',0xAAAAAA]].forEach(function(a){
  modelTanimla('ganimet_'+a[0],{ad:'Ganimet: '+a[1],grup:'Eşya',boy:.4,yap:function(){return new THREE.Mesh(new THREE.SphereGeometry(.2,7,5),new THREE.MeshLambertMaterial({color:a[2],emissive:a[2],emissiveIntensity:.6}));}});
});

// Oyundaki "tür" adından model kimliği (özet paketindeki k alanı için)
function modelKimligi(tur,boss){
  if(tur==='d')return boss?'dusman_boss':'dusman';
  if(tur==='eskiya')return boss?'eskiya_boss':'eskiya';
  if(tur==='ayi')return 'ayi';
  return MODEL_KAYIT.harita[tur]?tur:'dusman';
}
