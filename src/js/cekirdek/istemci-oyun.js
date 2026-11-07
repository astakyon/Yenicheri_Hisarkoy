// ═══════════════════════════════════════════════════════
// İSTEMCİ OYUNU (çok oyunculuda odaya katılan taraf)
// İstemci dünyayı kendisi simüle etmez: haritayı kurar, girdisini host'a yollar, kendi karakterini tahmin eder
// ve host'un yolladığı özetten (snapshot) öbür oyuncuları, düşmanları, mermileri ve ganimeti çizer.
// ═══════════════════════════════════════════════════════
const CLIENT={aktif:false,id:null,tr:null,seq:0,bekleyen:[],gorunum:null,zaman:0,hayalet:{p:new Map(),e:new Map(),b:new Map(),l:new Map()},sonOzet:null,kopuk:false};

function CLIENT_eylem(kind,data){
  if(!CLIENT.tr)return;
  CLIENT.tr.send(Object.assign({t:'act',k:kind},data||{}));
}

// Odaya katılınca: host'un haritasını kur, kendi karakterini koy
function joinAsClient(transport,hos){
  const harita=hos.map;
  if(['kisla','gorev','orman','maden'].indexOf(harita)<0){showDlg('Katılınamadı','Bu oda "'+harita+'" haritasında; şimdilik yalnızca Kışla, Devriye, Av Ormanı ve Demir Madeni odalarına katılabilirsin.','Tamam',hideDlg);return false;}
  CLIENT.aktif=true;CLIENT.kopuk=false;CLIENT.tr=transport;CLIENT.id=hos.id;CLIENT.seq=0;CLIENT.bekleyen=[];CLIENT.sonOzet=null;
  CLIENT.gorunum=new ClientView(transport);CLIENT.zaman=0;
  ['p','e','b','l'].forEach(function(k){CLIENT.hayalet[k].clear();});
  document.getElementById('menuLayer').style.display='none';
  document.getElementById('gameLayer').style.display='block';
  document.getElementById('hudLayer').style.display='block';
  document.getElementById('topBar').style.display='flex';document.getElementById('mmBox').style.display='block';document.getElementById('topLeftHud').style.display='flex';
  initThree();
  currentMap=harita;clearAll();
  if(harita==='kisla')buildKisla();else if(harita==='gorev')buildGorev();else if(harita==='orman')buildOrman();else buildMaden();
  pl.x=hos.x;pl.z=hos.z;pl.maxHp=getBaseMaxHp();pl.hp=pl.maxHp;pl.maxEn=getBaseMaxEn();pl.en=pl.maxEn;
  pl.spd=hos.spd;pl.rspd=hos.rspd;                         // tahmin host ile aynı hızla yürümeli
  buildPlayer();
  playing=true;paused=false;
  document.getElementById('mapIndicator').textContent='👥 ODA — '+harita.toUpperCase();
  setTimeout(function(){initTouch();applyAllSettings();},100);
  updateGoldHud();updateXPHud();updateCharHud();
  return true;
}

function leaveClient(){
  CLIENT.aktif=false;
  if(CLIENT.tr&&CLIENT.tr.close)try{CLIENT.tr.close();}catch(e){}
  CLIENT.tr=null;CLIENT.gorunum=null;
}

function clientUpdate(dt){
  if(!playing||paused||!pl.mesh)return;
  CLIENT.zaman+=dt*1000;
  gt++;
  updateAim();
  // 1) girdi: yerel tahmin + host'a gönder
  const cmd=readLocalInput();
  CLIENT.seq++;
  CLIENT.tr.send({t:'input',seq:CLIENT.seq,cmd:cmd});
  CLIENT.bekleyen.push({seq:CLIENT.seq,cmd:cmd});
  if(CLIENT.bekleyen.length>120)CLIENT.bekleyen.shift();
  movePlayer(pl,cmd,dt);
  if(joyActive){worldAim.x=pl.x+Math.cos(pl.ang)*20;worldAim.z=pl.z+Math.sin(pl.ang)*20;}
  if(pl.atkCd>0)pl.atkCd--;
  // 2) host'tan gelenler
  const onceki=CLIENT.gorunum.last;
  CLIENT.gorunum.poll(CLIENT.zaman);
  const yeni=CLIENT.gorunum.last;
  if(yeni&&yeni!==onceki)clientUzlastir(yeni);
  if((CLIENT.tr.kapali||CLIENT.tr.kapaliMi)&&!CLIENT.kopuk){CLIENT.kopuk=true;clientBaglantiKoptu();return;}
  // 3) görüntü
  const v=CLIENT.gorunum.view(CLIENT.zaman);
  if(v)clientCiz(v);
  // 4) kamera
  const smooth=joyActive?.18:.09,camDist=15*camZoom,camHeight=14*camZoom;
  CAM.position.x+=(pl.x-CAM.position.x)*smooth;
  CAM.position.y+=(camHeight-CAM.position.y)*smooth;
  CAM.position.z+=((pl.z+camDist)-CAM.position.z)*smooth;
  CAM.lookAt(pl.x,0,pl.z);
}

// Host'un onayladığı konumdan başla, henüz onaylanmamış girdileri yeniden uygula
function clientUzlastir(o){
  const ben=o.p.find(function(q){return q.id===CLIENT.id;});
  if(!ben)return;
  CLIENT.bekleyen=CLIENT.bekleyen.filter(function(c){return c.seq>ben.q;});
  const px=pl.x,pz=pl.z,pe=pl.en;
  pl.x=ben.x;pl.z=ben.z;pl.en=ben.en;
  CLIENT.bekleyen.forEach(function(c){movePlayer(pl,c.cmd,TIK);});
  // küçük farkta tahmini koru (titreme olmasın), büyük farkta host'a uy
  if(Math.hypot(pl.x-px,pl.z-pz)<.05){pl.x=px;pl.z=pz;}
  pl.mesh.position.set(pl.x,0,pl.z);
  pl.hp=ben.hp;pl.maxHp=ben.mh;pl.en=Math.abs(pl.en-pe)<2?pe:pl.en;
  CLIENT.sonOzet=o;
  const hpf=document.getElementById('hpf'),enf=document.getElementById('enf');
  if(hpf)hpf.style.width=(pl.hp/pl.maxHp*100)+'%';if(enf)enf.style.width=(pl.en/pl.maxEn*100)+'%';
  const hpn=document.getElementById('hpn'),enn=document.getElementById('enn');
  if(hpn)hpn.textContent=Math.ceil(pl.hp);if(enn)enn.textContent=Math.ceil(pl.en);
  const kv=document.getElementById('killV');if(kv)kv.textContent=o.kills;
}

function hayaletEsitle(harita,liste,yarat,guncelle){
  const goruldu=new Set();
  liste.forEach(function(o){
    goruldu.add(o.id);
    let g=harita.get(o.id);
    if(!g){g=yarat(o);S3.add(g);harita.set(o.id,g);g.position.set(o.x,g.userData.y||0,o.z);}
    guncelle(g,o);
  });
  harita.forEach(function(g,id){if(!goruldu.has(id)){S3.remove(g);harita.delete(id);}});
}
function clientCiz(v){
  const H=CLIENT.hayalet;
  hayaletEsitle(H.p,v.p.filter(function(q){return q.id!==CLIENT.id;}),function(){return modelYap('yeniceri');},function(g,o){
    const dx=o.x-g.position.x,dz=o.z-g.position.z;
    if(dx*dx+dz*dz>1e-4)g.rotation.y=Math.atan2(dx,dz);
    g.position.set(o.x,0,o.z);
  });
  hayaletEsitle(H.e,v.e,function(o){return modelYap(modelKimligi(o.k,o.b),{cubuk:true});},function(g,o){
    const dx=o.x-g.position.x,dz=o.z-g.position.z;
    if(dx*dx+dz*dz>1e-4)g.rotation.y=Math.atan2(dx,dz);
    g.position.set(o.x,0,o.z);
    if(g.userData.hpFl){
      const f=Math.max(.001,o.hp/o.mh),w=((MODEL_KAYIT.harita[modelKimligi(o.k,o.b)]||{}).bar||{w:1}).w;
      g.userData.hpFl.scale.x=f;g.userData.hpFl.position.x=(f-1)*w/2;
      g.userData.hpBg.lookAt(CAM.position);g.userData.hpFl.lookAt(CAM.position);
    }
  });
  hayaletEsitle(H.b,v.b,function(){const g=modelYap('mermi_tufek');g.userData.y=1.1;return g;},function(g,o){g.position.set(o.x,1.1,o.z);});
  hayaletEsitle(H.l,v.l,function(o){const g=modelYap('ganimet_'+o.k);g.userData.y=.3;return g;},function(g,o){g.position.set(o.x,.3,o.z);});
}

function clientBaglantiKoptu(){
  leaveClient();
  playing=false;
  showDlg('🔌 Bağlantı koptu','Odayla bağlantı kesildi. Ana menüye dönüyorsun.','Ana Menü',function(){hideDlg();toMenu();});
}
