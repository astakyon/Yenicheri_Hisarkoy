// ═══════════════════════════════════════════════════════
// MODEL KAYDI — oyundaki bütün 3B modellerin tek listesi
// Her model önce KODLA çizilir (indirme gerekmez, her zaman çalışır). assets/models.json ya da bu cihazdaki
// Model Kütüphanesi bir .glb tanımlarsa o kullanılır; yüklenemezse kod modeliyle devam edilir.
// Yeni model: modelTanimla('kimlik',{ad,grup,boy,yap,bar}) → kütüphanede, oyunda ve çok oyunculu istemcide görünür.
// Belge: docs/MODELLER.md, docs/MODEL-EKLEME.md
// ═══════════════════════════════════════════════════════
const MODEL_KAYIT={liste:[],harita:{},glb:{},glbDosya:{},kaynak:{}};

function modelTanimla(id,tanim){
  tanim.id=id;tanim.boy0=tanim.boy;
  try{const ob=JSON.parse(localStorage.getItem('yc_model_boy')||'{}');if(ob[id]>0)tanim.boy=ob[id];}catch(e){}
  if(MODEL_KAYIT.harita[id]){MODEL_KAYIT.liste[MODEL_KAYIT.liste.indexOf(MODEL_KAYIT.harita[id])]=tanim;}
  else MODEL_KAYIT.liste.push(tanim);
  MODEL_KAYIT.harita[id]=tanim;
}

// Sağlık çubuğu yer bilgisi (genişlik, yükseklik, renk) — oyun ve istemci aynı yerden alır
function modelHpCubuk(id){
  const t=MODEL_KAYIT.harita[id];
  const b=(t&&t.bar)||{w:1.1,y:2.9,renk:0x22cc55};
  const w=b.w*1.45,h=.3;                                              // telefonda da okunsun diye büyük
  const bg=new THREE.Mesh(new THREE.PlaneGeometry(w+.1,h+.1),new THREE.MeshBasicMaterial({color:0x120804,side:THREE.DoubleSide,depthTest:false}));
  bg.position.set(0,b.y+.1,0);bg.renderOrder=20;
  const ic=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0x4a0e0e,side:THREE.DoubleSide,depthTest:false}));
  ic.position.z=.004;ic.renderOrder=21;bg.add(ic);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:b.renk,side:THREE.DoubleSide,depthTest:false}));
  fl.position.z=.008;fl.renderOrder=22;bg.add(fl);                     // dolgu çerçevenin çocuğu: kamera dönse de hizalı kalır
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
  else{g=t.yap(opsiyon||{});g.userData.kaynak='kod';}
  if(t.boy0&&t.boy&&Math.abs(t.boy/t.boy0-1)>.001&&g.userData.kaynak==='kod')g.scale.multiplyScalar(t.boy/t.boy0);
  if(!g.userData.govde){let ilk=null;g.traverse(function(o){if(!ilk&&o.isMesh&&o.material&&o.material.color)ilk=o;});g.userData.govde=ilk;}
  if(opsiyon&&opsiyon.cubuk&&t.bar){const c=modelHpCubuk(id);g.add(c.bg);g.userData.hpBg=c.bg;g.userData.hpFl=c.fl;}
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
  if((glb||govde.material.vertexColors)&&govde.material.emissive){govde.material.emissive.setHex(aktif?0x661111:0x000000);return;}
  if(aktif)govde.material.color.setHex(0xff3333);else if(tabanRenk!==undefined)govde.material.color.setHex(tabanRenk);
}

// ── Kod modelleri ──
// Parçalar tek geometride birleştirilir (köşe renkli); bir model ~5 çizim çağrısıdır: gövde, iki bacak, iki kol.
// Birleşik geometri tipe göre önbelleklenir, malzeme her kopyada ayrıdır (vuruş parlaması için).
const _GC={};
function _g(tip){const a=Array.prototype.slice.call(arguments,1),k=tip+a.join(',');
  return _GC[k]||(_GC[k]=new THREE[tip](...a));}
// p: [geo, hex, x,y,z, rx,ry,rz, sx,sy,sz]
function _birles(liste){
  const pos=[],nor=[],col=[],m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),c=new THREE.Color();
  liste.forEach(function(p){
    const gg=p[0].index?p[0].toNonIndexed():p[0].clone();
    e.set(p[5]||0,p[6]||0,p[7]||0);q.setFromEuler(e);
    m.compose(new THREE.Vector3(p[2]||0,p[3]||0,p[4]||0),q,new THREE.Vector3(p[8]||1,p[9]||1,p[10]||1));
    gg.applyMatrix4(m);c.setHex(p[1]);
    const pa=gg.attributes.position.array,na=gg.attributes.normal.array;
    for(let i=0;i<pa.length;i+=3){pos.push(pa[i],pa[i+1],pa[i+2]);nor.push(na[i],na[i+1],na[i+2]);col.push(c.r,c.g,c.b);}
  });
  const bg=new THREE.BufferGeometry();
  bg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  bg.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  bg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  return bg;
}
function _vm(){return new THREE.MeshLambertMaterial({vertexColors:true});}
function _parca(geo,x,y,z){const m=new THREE.Mesh(geo,_vm());m.position.set(x||0,y||0,z||0);m.castShadow=true;return m;}
function _pivot(g,x,y,z){const p=new THREE.Group();p.position.set(x,y,z);g.add(p);return p;}

// Animasyon (yalnızca görüntü). model.userData.anim kurulur; çağıran her tik çağırır.
//  t: yürüyüş fazı (kat edilen mesafeyle artırılırsa ayak kaymaz)   h: hareket (0 dur, 1 yürü, ~1.7 koş)
//  u: saldırı ilerlemesi (0 yok; 0→1 hazırlık, savurma, toparlanma)   v: vuruş tepkisi (0..1)
function modelAnim(g,t,h,u,v){
  const a=g&&g.userData&&g.userData.anim;if(!a||!(a.bs||a.ca)||!(a.bs||a.ca).rotation)return;   // clone() userData'yı düz nesneye çevirir
  h=h||0;u=u||0;v=v||0;
  const amp=h>0?Math.min(1.25,.55*h+.2):0,sw=Math.sin(t)*amp,hm=Math.min(1.2,h);
  a.n=(a.n||0)+.045;const nefes=Math.sin(a.n),dur=1-Math.min(1,h),ic=a.govde;
  if(a.tip==='insan'){
    a.bs.rotation.x=sw;a.bg.rotation.x=-sw;
    a.ks.rotation.x=-sw*.85+nefes*.04*dur;
    let kg=sw*.85-.35+nefes*.04*dur,burma=0;
    if(u>0){      // hazırlık (kol geri) → hızlı savurma (ileri-yukarı) → toparlanma
      if(u<.3){kg=-.35+(u/.3)*1.55;burma=-(u/.3)*.35;}
      else if(u<.6){const k=(u-.3)/.3;kg=1.2-k*3.4;burma=-.35+k*.8;}
      else{const k=(u-.6)/.4;kg=-2.2+k*1.85;burma=.45*(1-k);}
    }
    a.kg.rotation.x=kg;
    if(ic){
      ic.rotation.y=burma;ic.rotation.x=.07*hm-v*.3;ic.rotation.z=Math.sin(t)*.035*hm;
      ic.position.y=Math.abs(Math.sin(t))*.075*hm;
      ic.scale.y=a.s*(1+nefes*.012*dur);
    }
  }else if(a.tip==='hayvan'){
    a.ca.rotation.x=sw*.8;a.cb.rotation.x=-sw*.8;
    if(ic){
      ic.rotation.x=Math.sin(t*2)*.025*hm-v*.3;ic.rotation.z=Math.sin(t)*.03*hm;
      ic.position.y=Math.abs(Math.sin(t))*.05*hm;
      ic.scale.y=a.s*(1+nefes*.014*dur);
    }
  }
}

// ── İnsan ──
const _TEN=0xC8956C;
function _insanGeo(o){
  const k='insan_'+o.id;if(_GC[k])return _GC[k];
  const cyl=function(a,b,h,n){return _g('CylinderGeometry',a,b,h,n||10);},sph=function(r,w,h){return _g('SphereGeometry',r,w||10,h||8);},box=function(w,h,d){return _g('BoxGeometry',w,h,d);};
  const G=[];
  G.push([cyl(.40,.56,.72),o.etek,0,.80,0]);                       // kaftan eteği
  G.push([cyl(.36,.42,.78),o.gov,0,1.43,0]);                       // gövde
  G.push([cyl(.45,.45,.16),o.sash,0,1.10,0]);                      // kuşak
  G.push([cyl(.20,.31,.12),o.yaka||o.sash,0,1.86,0]);              // yaka
  G.push([cyl(.10,.10,.14,6),o.ten||_TEN,0,1.93,0]);               // boyun
  G.push([sph(.27),o.ten||_TEN,0,2.14,0,0,0,0,1,1.05,1]);          // baş
  G.push([box(.06,.05,.04),0x1a1008,-.1,2.17,.24]);G.push([box(.06,.05,.04),0x1a1008,.1,2.17,.24]);   // gözler
  G.push([box(.05,.08,.08),o.ten||_TEN,0,2.1,.27,.2]);                // burun
  G.push([box(.1,.025,.03),o.kas||o.biyik||o.sakal||0x1a1008,-.1,2.24,.25]);G.push([box(.1,.025,.03),o.kas||o.biyik||o.sakal||0x1a1008,.1,2.24,.25]);   // kaşlar
  G.push([sph(.06,6,5),o.ten||_TEN,-.27,2.13,0,0,0,0,.6,1,.8]);G.push([sph(.06,6,5),o.ten||_TEN,.27,2.13,0,0,0,0,.6,1,.8]);   // kulaklar
  G.push([cyl(.575,.575,.06,12),o.yaka||o.sash,0,.47,0]);               // etek şeridi
  G.push([box(.1,.42,.05),o.sash,.3,.9,.44,0,0,.15]);G.push([box(.1,.36,.05),o.sash,.22,.92,.45,0,0,-.2]);   // kuşak uçları
  G.push([box(.12,.12,.05),o.tokaC||0xD4A82A,0,1.1,.46]);                        // kemer tokası
  [1.62,1.48,1.34].forEach(function(yy){G.push([sph(.028,5,4),o.dugmeC||o.yaka||0xD4A82A,0,yy,.385]);});   // düğmeler
  if(o.fisek){G.push([box(.09,.95,.05),0x5a3a1a,0,1.45,.4,0,0,.62]);for(let i=0;i<4;i++)G.push([box(.07,.09,.07),0xC8B070,-.2+i*.13,1.28+i*.17,.43,0,0,.62]);}   // fişeklik
  if(o.biyik){const bt=o.biyikTip||'klasik',bc2=o.biyik;
    if(bt==='klasik')G.push([box(.3,.06,.08),bc2,0,2.05,.25]);
    else if(bt==='kalin'){G.push([box(.36,.1,.1),bc2,0,2.05,.25]);}
    else if(bt==='sivri'){G.push([box(.22,.06,.08),bc2,0,2.05,.25]);G.push([box(.14,.05,.07),bc2,-.17,2.09,.25,0,0,.5]);G.push([box(.14,.05,.07),bc2,.17,2.09,.25,0,0,-.5]);}
    else if(bt==='uzun'){G.push([box(.2,.06,.08),bc2,0,2.05,.25]);G.push([box(.05,.2,.06),bc2,-.14,1.96,.25]);G.push([box(.05,.2,.06),bc2,.14,1.96,.25]);}
    else if(bt==='sakal'){G.push([box(.3,.06,.08),bc2,0,2.05,.25]);G.push([box(.3,.26,.1),bc2,0,1.93,.2,.2]);}
  }
  if(o.sakal)G.push([box(.3,.22,.1),o.sakal,0,1.95,.2,.2]);
  const sp=o.sapka;
  if(sp==='bork'){
    const keçe=o.sapkaC||0xEFE6CE,altin=0xD4A82A;
    G.push([cyl(.31,.33,.2,14),0xD8C9A0,0,2.33,0]);                                  // alt kıvrım (keçe pabuç)
    G.push([cyl(.335,.335,.06,14),altin,0,2.43,0]);                                  // altın şerit
    G.push([cyl(.22,.3,.52,14),keçe,0,2.7,-.02,-.05]);                               // gövde: yukarı daralan, hafif geriye yatık
    G.push([sph(.23,12,8),keçe,0,2.98,-.06,0,0,0,1,.5,1]);                           // yuvarlak tepe
    G.push([cyl(.17,.2,.14,12),0xD8C9A0,0,2.95,-.05,-.05]);                          // tepe kıvrımı
    if(o.borkTip!=='kisa'){G.push([cyl(.09,.2,.9,8),keçe,0,2.2,-.36,.14,0,0,1,1,.38]);G.push([cyl(.215,.215,.05,12),altin,0,1.78,-.4,.14,0,0,1,.4,.45]);}   // sırta sarkan uzun kuyruk (yeniçeri börkü)
    G.push([box(.22,.28,.06),altin,0,2.42,.33]);                                     // kaşıklık yuvası (altın plaka)
    G.push([box(.14,.2,.04),0x8a6a14,0,2.42,.365]);                                  // plaka kabartması
    G.push([cyl(.025,.025,.3,6),o.kasikC||0xC8C8CC,.05,2.66,.34,.18,0,-.12]);                  // kaşık sapı
    G.push([sph(.065,8,6),o.kasikC||0xC8C8CC,.075,2.84,.33,0,0,0,1,1.4,.5]);                   // kaşık yuvarlağı
  }else if(sp==='fes'){
    const fc=o.sapkaC||0xB02020;G.push([cyl(.27,.31,.34,14),fc,0,2.46,0]);G.push([cyl(.27,.27,.03,14),0x2a1a0a,0,2.64,0]);G.push([cyl(.012,.012,.3,5),0xD4A82A,.1,2.62,0,0,0,.3]);G.push([sph(.045,6,5),0xD4A82A,.19,2.46,0]);
  }else if(sp==='kask'){
    G.push([_g('SphereGeometry',.32,10,6,0,Math.PI*2,0,Math.PI/2),o.sapkaC,0,2.26,0]);G.push([_g('ConeGeometry',.05,.28,6),0xC0C0C0,0,2.66,0]);
    G.push([box(.06,.22,.04),o.sapkaC,0,2.12,.3]);
  }else if(sp==='sarik'){
    G.push([sph(.34),o.sapkaC,0,2.44,0,0,0,0,1,.62,1]);G.push([cyl(.3,.3,.09),o.sapkaC2||0xB89B5E,0,2.3,0]);
    G.push([box(.1,.3,.06),o.sapkaC,.28,2.2,-.05,0,0,.3]);
  }else if(sp==='kasket'){
    G.push([cyl(.3,.32,.2),o.sapkaC,0,2.36,0]);G.push([box(.42,.04,.24),o.sapkaC,0,2.28,.28]);G.push([sph(.07,6,5),0xFFD27A,0,2.4,.33]);
  }
  if(o.omuz){G.push([sph(.2,8,6),o.omuz,-.52,1.82,0,0,0,0,1,.7,1.1]);G.push([sph(.2,8,6),o.omuz,.52,1.82,0,0,0,0,1,.7,1.1]);}
  if(o.pelerin)G.push([box(.8,1.25,.05),o.pelerin,0,1.4,-.34,.1]);
  if(o.taç)G.push([_g('ConeGeometry',.26,.3,6),0xFFD700,0,2.8,0]);
  const govde=_birles(G);
  const bc=[[cyl(.2,.15,.55,8),o.sal,0,-.28,0],[cyl(.12,.11,.34,8),o.sal2||o.sal,0,-.62,0],[cyl(.15,.15,.12,8),o.bot,0,-.72,0],[box(.27,.18,.42),o.bot,0,-.82,.06],[box(.25,.1,.16),0x1a0e04,0,-.86,.22],[box(.29,.04,.44),0x1a0e04,0,-.92,.06]];
  const bacak=_birles(bc);
  const kolA=[[cyl(.1,.09,.5,8),o.gov,0,-.25,0],[cyl(.105,.105,.07,8),o.yaka||o.sash,0,-.47,0],[sph(.09,6,5),_TEN,0,-.55,0]];
  const kolSol=kolA.slice();
  if(o.kalkan){kolSol.push([cyl(.34,.34,.06,12),o.kalkan,-.14,-.38,.12,0,0,Math.PI/2]);kolSol.push([sph(.09,6,5),0xD4A82A,-.19,-.38,.12]);}
  let kolSag=kolA.slice();
  const si=o.silah;
  if(si==='yatagan'||si==='kilic'){kolSag.push([box(.05,.1,.05),0x6a4a1a,0,-.58,.0]);kolSag.push([box(.16,.04,.05),0xD4A82A,0,-.52,0]);}
  else if(si==='tufek'){kolSag.push([box(.07,.07,1.0),0x5a3a1a,0,-.55,.4]);kolSag.push([box(.05,.05,.5),0x888888,0,-.55,.9]);}
  else if(si==='kazma'){kolSag.push([cyl(.04,.04,1.15,6),0x6a4a2a,0,-.1,0]);kolSag.push([box(.6,.07,.07),0x777777,0,.48,0]);kolSag.push([_g('ConeGeometry',.05,.2,5),0x777777,.38,.48,0,0,0,-Math.PI/2]);kolSag.push([_g('ConeGeometry',.05,.2,5),0x777777,-.38,.48,0,0,0,Math.PI/2]);}
  else if(si==='balta'){kolSag.push([cyl(.04,.04,1.0,6),0x6a4a2a,0,-.05,0]);kolSag.push([box(.34,.3,.05),0x888888,.12,.42,0]);}
  return _GC[k]={govde:govde,bacak:bacak,kolSol:_birles(kolSol),kolSag:_birles(kolSag)};
}
function _insanYap(o,s){
  s=s||1;const gm=_insanGeo(o),g=new THREE.Group(),ic=new THREE.Group();g.add(ic);
  const gv=_parca(gm.govde);ic.add(gv);
  const bs=_pivot(ic,-.2,.92,0),bg=_pivot(ic,.2,.92,0);bs.add(_parca(gm.bacak));bg.add(_parca(gm.bacak));
  const ks=_pivot(ic,-.5,1.74,0),kg=_pivot(ic,.5,1.74,0);ks.add(_parca(gm.kolSol));kg.add(_parca(gm.kolSag));
  kg.rotation.x=-.35;
  if(o.adliBicak){   // oyuncunun silahları BAĞIMSIZ modellerdir (silah_*): kemerdeki yatağan/hançer, sırttaki tüfek/yay; savaşta ya da seçilince ele gelir
    const altin=o.tokaC||0xD4A82A,kem=o.kemer||'ikisi',yat=kem==='ikisi'||kem==='yatagan',han=kem==='ikisi'||kem==='hancer';
    const q={};
    if(yat){
      q.elYat=modelYap('silah_yatagan',{altin:altin});q.elYat.position.set(0,-.55,.05);q.elYat.rotation.x=-.12;kg.add(q.elYat);q.elYat.name='wpn';
      q.kinYat=modelYap('silah_yatagan',{altin:altin,kinda:true});q.kinYat.position.set(-.47,1.12,-.2);q.kinYat.rotation.set(.25,0,Math.PI-.1);q.kinYat.scale.setScalar(.8);ic.add(q.kinYat);
    }
    if(han){
      q.kinHan=modelYap('silah_hancer',{altin:altin,kinda:true});q.kinHan.position.set(-.1,1.19,.46);q.kinHan.rotation.set(0,.5,Math.PI-1.3);q.kinHan.scale.setScalar(.62);ic.add(q.kinHan);
      if(!yat){q.elHan=modelYap('silah_hancer',{altin:altin});q.elHan.position.set(0,-.55,.05);q.elHan.rotation.x=-.12;kg.add(q.elHan);}
    }
    q.elTufek=modelYap('silah_tufek');q.elTufek.position.set(0,-.55,0);kg.add(q.elTufek);
    q.elYay=modelYap('silah_yay');q.elYay.position.set(0,-.55,.3);kg.add(q.elYay);
    q.sirtTufek=modelYap('silah_tufek',{sirt:true});ic.add(q.sirtTufek);
    q.sirtYay=modelYap('silah_yay',{sirt:true});ic.add(q.sirtYay);
    g.userData.silah=q;
    modelSilahGoster(g,0,false);
  }
  ic.scale.setScalar(s);
  g.userData.govde=gv;g.userData.anim={tip:'insan',bs:bs,bg:bg,ks:ks,kg:kg,govde:ic,s:s};
  return g;
}

// Oyuncunun görünümü (SAVE.gorunum) — renkler ve bıyık/börk tipleri; karakter menüsünden değişir
const GORUNUM_VARSAYILAN={gov:0x9B2020,sash:0x2a3f8a,yaka:0xD4A82A,dugme:0xD4A82A,toka:0xD4A82A,bork:0xE8DCC0,kasik:0xC8C8CC,sal:0x2a3f8a,biyik:0x3a2000,biyikTip:'klasik',borkTip:'klasik',kemer:'ikisi'};
function gorunumOku(){let s=null;try{s=SAVE.gorunum;}catch(e){}return Object.assign({},GORUNUM_VARSAYILAN,s||{});}
function _koyult(c,k){return(Math.round(((c>>16)&255)*k)<<16)|(Math.round(((c>>8)&255)*k)<<8)|Math.round((c&255)*k);}
function _oyuncuOpt(){
  const g=gorunumOku(),t=g.borkTip;
  return{id:'yeniceri_'+[g.gov,g.sash,g.yaka,g.dugme,g.toka,g.bork,g.kasik,g.sal,g.biyik,g.biyikTip,g.borkTip,g.kemer].join('_'),
    etek:_koyult(g.gov,.9),gov:g.gov,sash:g.sash,yaka:g.yaka,dugmeC:g.dugme,tokaC:g.toka,kasikC:g.kasik,sal:g.sal,sal2:0xE8E0D0,bot:0x2a1000,
    biyik:g.biyikTip==='yok'?0:g.biyik,biyikTip:g.biyikTip,sapka:t==='sarik'?'sarik':t==='fes'?'fes':'bork',sapkaC:g.bork,sapkaC2:g.yaka,borkTip:t,kemer:g.kemer,adliBicak:true};
}
// Silah gösterimi: kılıç kınında; tüfek/yay seçiliyken sırtta; savaşta (cekili) seçili silah elde
function modelSilahGoster(g,w,cekili){
  const q=g&&g.userData&&g.userData.silah;if(!q)return;
  const el0=q.elYat||q.elHan;   // yakın dövüş silahı: yatağan, yoksa hançer
  if(q.elYat)q.elYat.visible=cekili&&w===0;
  if(q.elHan)q.elHan.visible=cekili&&w===0;
  if(q.kinYat)q.kinYat.visible=!(cekili&&w===0);
  if(q.kinHan)q.kinHan.visible=!(cekili&&w===0&&!q.elYat);
  q.elTufek.visible=cekili&&w===1;q.elYay.visible=cekili&&w===2;
  q.sirtTufek.visible=!(cekili&&w===1)&&w===1;q.sirtYay.visible=!(cekili&&w===2)&&w===2;
}
function _yeniceriYap(){const g=_insanYap(_oyuncuOpt(),1);return g;}
modelTanimla('yeniceri',{ad:'Yeniçeri (oyuncu)',grup:'Karakter',boy:2.82,yap:_yeniceriYap});

const _OD={id:'dusman',etek:0x3a1800,gov:0x4a2000,sash:0x7a1a1a,sal:0x3a3a3a,bot:0x1a1008,biyik:0x1a1008,sapka:'sarik',sapkaC:0x8a7a5a,sapkaC2:0x5a1a1a,silah:'kilic',kalkan:0x6a4a2a};
const _ODB={id:'dusman_boss',etek:0x5a0000,gov:0x7B0000,sash:0x1a1a1a,yaka:0xFFD700,sal:0x2a2a2a,bot:0x1a1008,sakal:0x1a1008,sapka:'kask',sapkaC:0x4a4a52,omuz:0x8a8a92,pelerin:0x3a0000,silah:'kilic',kalkan:0x555560,taç:true};
// Halk / nöbetçi (haritalardaki NPC'ler): renk seçenekle gelir
function _npcYap(op){
  const c=(op&&op.col)||0x1a3060;
  return _insanYap({id:'npc_'+c,etek:c,gov:c,sash:0x3a2810,yaka:0xD4A82A,sal:0x3a3a3a,bot:0x2a1808,biyik:0x2a1808,sapka:'bork',sapkaC:0xD4B050},.95);
}
modelTanimla('npc_halk',{ad:'Halk / nöbetçi (NPC)',grup:'Karakter',boy:2.6,varsayilan:{col:0x1a3060},yap:_npcYap});
modelTanimla('dusman',{ad:'Düşman askeri',grup:'Düşman',boy:2.7,bar:{w:1.1,y:3.1,renk:0x22cc55},yap:function(){return _insanYap(_OD,.82);}});
modelTanimla('dusman_boss',{ad:'Düşman komutanı (boss)',grup:'Düşman',boy:3.65,bar:{w:1.6,y:3.95,renk:0xFFD700},yap:function(){return _insanYap(_ODB,1.15);}});

const _OE={id:'eskiya',etek:0x3a2c1c,gov:0x4a3828,sash:0x2a1c10,yaka:0x2a1c10,sal:0x4a4a40,bot:0x2a1c10,biyik:0x2a1808,sapka:'kasket',sapkaC:0x2a2018,silah:'kazma'};
const _OEB={id:'eskiya_boss',etek:0x3a0a0a,gov:0x5a1010,sash:0x1a1a1a,yaka:0x8a2020,sal:0x2a2a2a,bot:0x1a1008,sakal:0x2a1808,sapka:'kask',sapkaC:0x2a2018,omuz:0x4a4a4a,silah:'balta',taç:true};
modelTanimla('eskiya',{ad:'Eşkıya madenci',grup:'Düşman',boy:2.55,bar:{w:1.0,y:2.9,renk:0x22cc55},yap:function(){return _insanYap(_OE,.85);}});
modelTanimla('eskiya_boss',{ad:'Ocakbaşı eşkıyası (boss)',grup:'Düşman',boy:3.55,bar:{w:1.7,y:3.85,renk:0xFFD700},yap:function(){return _insanYap(_OEB,1.2);}});

// ── Dört ayaklı ──
function _hayvanGeo(o){
  const k='hayvan_'+o.id;if(_GC[k])return _GC[k];
  const sph=function(r){return _g('SphereGeometry',r,10,8);},cone=function(r,h,n){return _g('ConeGeometry',r,h,n||6);},cyl=function(a,b,h,n){return _g('CylinderGeometry',a,b,h,n||7);},box=function(w,h,d){return _g('BoxGeometry',w,h,d);};
  const L=o.lh,by=L+.3;
  const G=[];
  G.push([sph(.5),o.col,0,by,0,0,0,0,o.gen||1,.85,1.6]);                                        // gövde
  G.push([sph(.4),o.alt||o.col,0,by-.12,.15,0,0,0,.95,.8,1.4]);                                  // karın
  G.push([cyl(.2,.3,.55),o.col,0,by+.28,.62,.9]);                                                // boyun
  G.push([sph(.27),o.col,0,by+.52,.98,0,0,0,.9,.9,1.15]);                                         // kafa
  G.push([box(.2,.18,.34),o.burun||0x2a2018,0,by+.42,1.3,.15]);                                    // burun/namlu
  G.push([sph(.05),0x111111,-.16,by+.6,1.1]);G.push([sph(.05),0x111111,.16,by+.6,1.1]);          // gözler
  G.push([cone(.07,.24),o.col,-.15,by+.86,.9,-.2,0,.15]);G.push([cone(.07,.24),o.col,.15,by+.86,.9,-.2,0,-.15]); // kulaklar
  G.push([cone(.1,.5),o.kuyruk||o.col,0,by+.1,-.95,-1.3]);                                      // kuyruk
  if(o.boynuz){[-1,1].forEach(function(sg){G.push([cyl(.025,.04,.6,5),0xC9B08A,sg*.14,by+1.15,.86,-.2,0,-sg*.35]);G.push([cyl(.02,.03,.35,5),0xC9B08A,sg*.28,by+1.35,.8,-.2,0,-sg*.9]);G.push([cyl(.02,.03,.3,5),0xC9B08A,sg*.2,by+1.2,.78,-.5,0,-sg*.2]);});}
  if(o.diş){[-1,1].forEach(function(sg){G.push([cone(.04,.22,5),0xF0EAD6,sg*.12,by+.4,1.38,-.3,0,sg*.4]);});}
  if(o.kil){for(let i=0;i<5;i++)G.push([cone(.06,.2,4),o.kil,0,by+.45,.5-i*.26]);}
  if(o.hörgüç)G.push([sph(.4),o.col,0,by+.42,.3,0,0,0,1,.8,1]);
  if(o.yuvarlakKulak){G.push([sph(.1),o.col,-.18,by+.78,.9]);G.push([sph(.1),o.col,.18,by+.78,.9]);}
  if(o.taç)G.push([cone(.22,.35,6),0xFFD700,0,by+.98,.95]);
  const bacak=function(pts){const q=[];pts.forEach(function(p){q.push([cyl(.1*(o.kal||1),.07*(o.kal||1),L,7),o.col,p[0],-L/2,p[1]]);q.push([box(.12*(o.kal||1),.07,.16*(o.kal||1)),0x1a1208,p[0],-L+.03,p[1]+.03]);});return _birles(q);};
  return _GC[k]={govde:_birles(G),ca:bacak([[-.3,.55],[.3,-.55]]),cb:bacak([[.3,.55],[-.3,-.55]]),L:L};
}
function _hayvanYap(o,s){
  s=s||1;const gm=_hayvanGeo(o),g=new THREE.Group(),ic=new THREE.Group();g.add(ic);
  const gv=_parca(gm.govde);ic.add(gv);
  const ca=_pivot(ic,0,gm.L,0),cb=_pivot(ic,0,gm.L,0);ca.add(_parca(gm.ca));cb.add(_parca(gm.cb));
  ic.scale.setScalar(s);
  g.userData.govde=gv;g.userData.anim={tip:'hayvan',ca:ca,cb:cb,govde:ic,s:s};
  return g;
}
const _HGEYIK={id:'geyik',col:0x8B6030,alt:0xD8C39A,lh:.75,kal:.8,boynuz:true,kuyruk:0xF0EAD6,gen:.85};
const _HKURT={id:'kurt',col:0x4a4a4a,alt:0x8a8a8a,lh:.55,kal:.85,kuyruk:0x3a3a3a,burun:0x111111,gen:.8};
const _HDOMUZ={id:'domuz',col:0x5a3a20,alt:0x7a5a40,lh:.4,kal:1.1,diş:true,kil:0x2a1808,gen:1.15};
const _HAYI={id:'ayi',col:0x3a2810,alt:0x5a4028,lh:.65,kal:1.5,hörgüç:true,yuvarlakKulak:true,burun:0x8a6a48,gen:1.25,taç:true};
modelTanimla('geyik',{ad:'Geyik',grup:'Hayvan',boy:2.5,bar:{w:1.0,y:2.8,renk:0x22cc55},yap:function(){return _hayvanYap(_HGEYIK,1);}});
modelTanimla('kurt',{ad:'Kurt',grup:'Hayvan',boy:1.8,bar:{w:1.0,y:2.2,renk:0x22cc55},yap:function(){return _hayvanYap(_HKURT,1);}});
modelTanimla('domuz',{ad:'Yaban domuzu',grup:'Hayvan',boy:1.75,bar:{w:1.0,y:2.1,renk:0x22cc55},yap:function(){return _hayvanYap(_HDOMUZ,1);}});
modelTanimla('ayi',{ad:'Koca Ayı (boss)',grup:'Hayvan',boy:3.6,bar:{w:1.8,y:4.0,renk:0xFFD700},yap:function(){return _hayvanYap(_HAYI,1.7);}});

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

// ── Bağımsız silah modelleri (karaktere takılıp çıkarılır; model kütüphanesinde ayrı görünür) ──
// Yeniçeri silahları: yatağan (tek ağızlı, öne eğimli, kulaklı kabzalı kısa kılıç), kemerde hançer, tüfek ve yay.
// Kökeni kabzanın ortasıdır; bıçak +y'ye uzanır. {kinda:true} → bıçak yerine kın (kemere ters takılır).
function _silahMesh(anahtar,parcalar){
  if(!_GC[anahtar])_GC[anahtar]=_birles(parcalar());
  const g=new THREE.Group();g.add(_parca(_GC[anahtar]));return g;   // Group: modelYap'ın govde işaretçisi kendine dönmesin (clone/JSON döngüsü)
}
function _yataganYap(op){
  const altin=op.altin||0xD4A82A,kin=!!op.kinda,bx2=function(w,h,d){return _g('BoxGeometry',w,h,d);};
  return _silahMesh('silah_yatagan_'+altin+(kin?'k':''),function(){
    const P=[],kemik=0xE8DFC4;
    P.push([bx2(.07,.24,.07),kemik,0,0,0]);P.push([bx2(.2,.05,.07),kemik,0,-.15,0]);   // sap ve kabzabaşı
    P.push([bx2(.06,.1,.06),kemik,-.1,-.2,0,0,0,.4]);P.push([bx2(.06,.1,.06),kemik,.1,-.2,0,0,0,-.4]);   // kulaklar
    P.push([bx2(.1,.04,.09),altin,0,.13,0]);                                            // halka
    let y=.15,z=0;
    for(let i=0;i<6;i++){
      const a=i*.075,len=.16,cy=y+len/2*Math.cos(a),cz=z+len/2*Math.sin(a);
      if(kin)P.push([bx2(.095,len+.01,.055),0x2a1a0a,0,cy,cz,a]);
      else P.push([bx2(.05+i*.012,len+.01,.025),0xC9CED8,0,cy,cz,a]);
      y+=len*Math.cos(a);z+=len*Math.sin(a);
    }
    if(kin){P.push([bx2(.11,.07,.07),altin,0,y,z]);P.push([bx2(.11,.035,.07),altin,0,.2,0]);}
    return P;
  });
}
function _hancerYap(op){
  const altin=op.altin||0xD4A82A,kin=!!op.kinda,bx2=function(w,h,d){return _g('BoxGeometry',w,h,d);};
  return _silahMesh('silah_hancer_'+altin+(kin?'k':''),function(){
    const P=[],kemik=0xE8DFC4;
    P.push([bx2(.06,.17,.06),kemik,0,0,0]);P.push([bx2(.09,.04,.07),kemik,0,-.11,0]);P.push([bx2(.14,.03,.06),altin,0,.1,0]);
    if(kin){P.push([bx2(.075,.4,.05),0x2a1a0a,0,.31,0]);P.push([bx2(.08,.05,.055),altin,0,.52,0]);P.push([bx2(.08,.03,.055),altin,0,.14,0]);}
    else{P.push([bx2(.055,.2,.02),0xC9CED8,0,.22,0]);P.push([bx2(.045,.16,.02),0xC9CED8,0,.4,0]);P.push([bx2(.03,.1,.02),0xC9CED8,0,.53,0]);}
    return P;
  });
}
function _tufekYap(op){
  const bx2=function(w,h,d){return _g('BoxGeometry',w,h,d);},cy=function(a,b,h){return _g('CylinderGeometry',a,b,h,6);};
  return _silahMesh('silah_tufek'+(op.sirt?'_s':''),function(){
    if(op.sirt)return[[bx2(.09,.2,.62),0x5a3a1a,.16,1.2,-.38,0,0,.62],[cy(.025,.025,1.25),0x6b6b72,-.12,1.85,-.4,0,0,.62],[bx2(.07,.07,.5),0x4a2c12,0,1.62,-.38,0,0,.62],[bx2(.06,.9,.03),0x3a2410,0,1.5,.39,0,0,.65]];
    return[[bx2(.07,.07,1.0),0x5a3a1a,0,0,.4],[bx2(.05,.05,.5),0x888888,0,0,.9]];
  });
}
function _yayYap(op){
  return _silahMesh('silah_yay'+(op.sirt?'_s':''),function(){
    const ry=op.sirt?Math.PI/2:-Math.PI/2,y0=op.sirt?1.5:0,z0=op.sirt?-.42:0;
    return[[_g('TorusGeometry',.5,.025,6,16,Math.PI),0x6a4a2a,0,y0,z0,0,ry,-Math.PI/2,1,.55,1],[_g('BoxGeometry',.012,1.0,.012),0xE8E0D0,0,y0,z0]];
  });
}
modelTanimla('silah_yatagan',{ad:'Yatağan',grup:'Silah',boy:1.2,yap:_yataganYap});
modelTanimla('silah_hancer',{ad:'Hançer',grup:'Silah',boy:.6,yap:_hancerYap});
modelTanimla('silah_tufek',{ad:'Yeniçeri tüfeği',grup:'Silah',boy:1.4,yap:_tufekYap});
modelTanimla('silah_yay',{ad:'Yay',grup:'Silah',boy:1.0,yap:_yayYap});
