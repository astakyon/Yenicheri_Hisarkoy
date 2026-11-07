// ═══════════════════════════════════════════════════════
// MODEL KÜTÜPHANESİ — oyundaki bütün modelleri incele, test et, .glb indir / içe aktar
// Ana menü → 🧰 MODEL KÜTÜPHANESİ. Önizleme kendi küçük WebGL sahnesinde çalışır, oyunu etkilemez.
// ═══════════════════════════════════════════════════════
const KUT={acik:false,ren:null,sahne:null,kam:null,secili:null,nesne:null,aci:0.6,mesafe:6,otoDon:true,yuru:false,tel:false,cubuk:true,karsilastir:false,raf:0,vurus:0,zaman:0,hedefY:1,yaziBekle:null};

function kutuphaneKur(){
  if(KUT.ren)return true;
  const cv=document.getElementById('libCanvas');
  try{KUT.ren=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});}catch(e){return false;}
  KUT.sahne=new THREE.Scene();
  KUT.kam=new THREE.PerspectiveCamera(40,1,.1,100);
  KUT.sahne.add(new THREE.AmbientLight(0xffffff,.75));
  const gun=new THREE.DirectionalLight(0xfff0d8,.9);gun.position.set(5,9,6);KUT.sahne.add(gun);
  const zemin=new THREE.Mesh(new THREE.CircleGeometry(3.2,40),new THREE.MeshLambertMaterial({color:0x3a2a18}));
  zemin.rotation.x=-Math.PI/2;zemin.position.y=-.01;KUT.sahne.add(zemin);
  KUT.sahne.userData.zemin=zemin;
  // sürükle: döndür, tekerlek / sıkıştır: yakınlaştır
  let surukle=false,sx=0;
  cv.addEventListener('pointerdown',function(e){surukle=true;sx=e.clientX;KUT.otoDon=false;try{cv.setPointerCapture(e.pointerId);}catch(x){}});
  cv.addEventListener('pointermove',function(e){if(!surukle)return;KUT.aci+=(e.clientX-sx)*.012;sx=e.clientX;});
  cv.addEventListener('pointerup',function(){surukle=false;});
  cv.addEventListener('wheel',function(e){e.preventDefault();KUT.mesafe=Math.max(1.5,Math.min(30,KUT.mesafe*(e.deltaY>0?1.08:.92)));},{passive:false});
  return true;
}

function kutuphaneAc(){
  document.getElementById('libBox').style.display='flex';
  KUT.acik=true;
  if(!kutuphaneKur()){libMesaj('Bu cihazda 3B önizleme açılamadı.');return;}
  kutuphaneListele();
  if(!KUT.secili)kutuphaneSec(MODEL_KAYIT.liste[0].id);
  else kutuphaneSec(KUT.secili);
  cancelAnimationFrame(KUT.raf);KUT.raf=requestAnimationFrame(kutuphaneCiz);
}
function kutuphaneKapat(){
  document.getElementById('libBox').style.display='none';
  KUT.acik=false;cancelAnimationFrame(KUT.raf);
}

function kutuphaneListele(){
  const el=document.getElementById('libListe');el.innerHTML='';
  const gruplar={};
  MODEL_KAYIT.liste.forEach(function(t){(gruplar[t.grup]=gruplar[t.grup]||[]).push(t);});
  Object.keys(gruplar).forEach(function(g){
    const b=document.createElement('div');b.className='libGrup';b.textContent=g;el.appendChild(b);
    gruplar[g].forEach(function(t){
      const d=document.createElement('button');d.className='libOge';d.id='libOge_'+t.id;d.type='button';
      d.textContent=t.ad+(MODEL_KAYIT.glb[t.id]?'  ●':'');
      d.onclick=function(){kutuphaneSec(t.id);};
      el.appendChild(d);
    });
  });
}

function libMesaj(t){const e=document.getElementById('libMesaj');if(e){e.textContent=t;clearTimeout(KUT.yaziBekle);KUT.yaziBekle=setTimeout(function(){e.textContent='';},4000);}}

function modelIstatistik(g){
  let ucgen=0,parca=0;const malz=new Set();
  g.traverse(function(o){
    if(!o.isMesh)return;parca++;
    const geo=o.geometry;ucgen+=geo.index?geo.index.count/3:(geo.attributes.position?geo.attributes.position.count/3:0);
    (Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){malz.add(m.uuid);});
  });
  return {ucgen:Math.round(ucgen),parca:parca,malz:malz.size};
}

function kutuphaneSec(id){
  KUT.secili=id;
  document.querySelectorAll('.libOge').forEach(function(b){b.classList.toggle('sec',b.id==='libOge_'+id);});
  if(KUT.nesne){KUT.sahne.remove(KUT.nesne);KUT.nesne=null;}
  if(KUT.ref){KUT.sahne.remove(KUT.ref);KUT.ref=null;}
  const t=MODEL_KAYIT.harita[id];
  let g;try{g=modelYap(id,{cubuk:KUT.cubuk});}catch(e){libMesaj('Model çizilemedi: '+e.message);return;}
  KUT.nesne=g;KUT.sahne.add(g);
  const kutu=new THREE.Box3().setFromObject(g),boyut=kutu.getSize(new THREE.Vector3());
  KUT.hedefY=Math.max(.3,boyut.y*.55);
  KUT.mesafe=Math.max(2.4,Math.max(boyut.y*1.9,Math.max(boyut.x,boyut.z)*2.2));
  KUT.sahne.userData.zemin.scale.setScalar(Math.max(.3,Math.max(boyut.x,boyut.z)/2.2));
  if(KUT.karsilastir&&id!=='yeniceri'){KUT.ref=modelYap('yeniceri');KUT.ref.position.x=-(boyut.x/2+1.1);KUT.sahne.add(KUT.ref);}
  KUT.tel=KUT.tel;kutuphaneTelUygula();
  const ist=modelIstatistik(g.userData.kaynak==='glb'?g:modelYap(id));
  const kaynak=MODEL_KAYIT.glb[id]?(MODEL_KAYIT.kaynak[id]==='cihaz'?'.glb — bu cihazda':'.glb — assets/models.json'):'kod modeli';
  document.getElementById('libBilgi').innerHTML=
    '<b>'+t.ad+'</b><br>Kimlik: <code>'+id+'</code><br>Grup: '+t.grup+'<br>Kaynak: '+kaynak+
    '<br>Boy: '+boyut.y.toFixed(2)+' m (hedef '+(t.boy||0).toFixed(2)+')<br>Genişlik × derinlik: '+boyut.x.toFixed(2)+' × '+boyut.z.toFixed(2)+' m'+
    '<br>Üçgen: '+ist.ucgen+' · Parça: '+ist.parca+' · Malzeme: '+ist.malz;
  document.getElementById('libBoy').value=(t.boy||'').toString();
  document.getElementById('libSifirla').style.display=MODEL_KAYIT.glb[id]?'':'none';
}

function kutuphaneTelUygula(){
  if(!KUT.nesne)return;
  KUT.nesne.traverse(function(o){if(o.isMesh&&o.material&&!(o.userData&&o.userData.cubuk)){(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.wireframe=KUT.tel;});}});
}

function kutuphaneCiz(){
  if(!KUT.acik)return;
  KUT.raf=requestAnimationFrame(kutuphaneCiz);
  const cv=document.getElementById('libCanvas'),w=cv.clientWidth,h=cv.clientHeight;
  if(w<2||h<2)return;
  if(cv.width!==Math.round(w*Math.min(2,window.devicePixelRatio||1))){KUT.ren.setPixelRatio(Math.min(2,window.devicePixelRatio||1));KUT.ren.setSize(w,h,false);KUT.kam.aspect=w/h;KUT.kam.updateProjectionMatrix();}
  KUT.zaman+=1/60;
  if(KUT.otoDon)KUT.aci+=.012;
  const g=KUT.nesne;
  if(g){
    // yürüme denemesi: hafif sıçrama ve sallanma; vuruş denemesi: gövde kırmızıya döner
    g.position.y=KUT.yuru?Math.abs(Math.sin(KUT.zaman*7))*.12:0;
    g.rotation.z=KUT.yuru?Math.sin(KUT.zaman*7)*.05:0;
    if(KUT.vurus>0){KUT.vurus--;modelVurus(g.userData.govde,true);if(KUT.vurus===0)modelVurus(g.userData.govde,false,KUT.govdeRenk);}
    if(g.userData.hpBg){g.userData.hpBg.lookAt(KUT.kam.position);g.userData.hpFl.lookAt(KUT.kam.position);}
  }
  KUT.kam.position.set(Math.sin(KUT.aci)*KUT.mesafe,KUT.hedefY+KUT.mesafe*.28,Math.cos(KUT.aci)*KUT.mesafe);
  KUT.kam.lookAt(0,KUT.hedefY,0);
  KUT.ren.render(KUT.sahne,KUT.kam);
}

// ── Düğmeler ──
function libYuruDegis(){KUT.yuru=!KUT.yuru;document.getElementById('libYuru').classList.toggle('acik',KUT.yuru);}
function libVurusDene(){const g=KUT.nesne;if(!g||!g.userData.govde||!g.userData.govde.material)return;KUT.govdeRenk=g.userData.govde.material.color.getHex();KUT.vurus=18;}
function libTelDegis(){KUT.tel=!KUT.tel;document.getElementById('libTel').classList.toggle('acik',KUT.tel);kutuphaneTelUygula();}
function libCubukDegis(){KUT.cubuk=!KUT.cubuk;document.getElementById('libCubuk').classList.toggle('acik',KUT.cubuk);kutuphaneSec(KUT.secili);}
function libKarsilastirDegis(){KUT.karsilastir=!KUT.karsilastir;document.getElementById('libKars').classList.toggle('acik',KUT.karsilastir);kutuphaneSec(KUT.secili);}
function libDonmeDegis(){KUT.otoDon=!KUT.otoDon;}

function libGlbIndir(){
  const id=KUT.secili,t=MODEL_KAYIT.harita[id];
  gltfDisaAktarHazir().then(function(){
    const g=modelYap(id);                      // sağlık çubuğu olmadan
    new THREE.GLTFExporter().parse(g,function(sonuc){
      const blob=new Blob([sonuc],{type:'model/gltf-binary'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=id+'.glb';
      document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href);},4000);
      libMesaj(id+'.glb indirildi ('+Math.round(blob.size/1024)+' KB)');
    },{binary:true});
  }).catch(function(e){libMesaj('İndirilemedi: '+e.message);});
}

function libGlbIceAktar(dosya){
  if(!dosya)return;
  const id=KUT.secili;
  if(!/\.glb$/i.test(dosya.name)){libMesaj('Şimdilik yalnızca .glb dosyası (Blender: Dışa aktar → glTF Binary).');return;}
  const okuyucu=new FileReader();
  okuyucu.onload=function(){
    const veri=okuyucu.result;
    glbCoz(veri).then(function(g){
      const t=MODEL_KAYIT.harita[id];
      glbUygula(id,g,{boy:t.boy,rotY:0},'cihaz');
      return modelDbKaydet({id:id,ad:dosya.name,boy:t.boy,rotY:0,veri:veri});
    }).then(function(){kutuphaneListele();kutuphaneSec(id);libMesaj(dosya.name+' bu cihaza kaydedildi. Oyunda yeni doğan '+MODEL_KAYIT.harita[id].ad+' bu modeli kullanır.');})
      .catch(function(e){glbKaldir(id);libMesaj('Model okunamadı: '+(e&&e.message||e));});
  };
  okuyucu.readAsArrayBuffer(dosya);
}

function libBoyUygula(){
  const id=KUT.secili,t=MODEL_KAYIT.harita[id],v=parseFloat(document.getElementById('libBoy').value);
  if(!(v>0.05&&v<30)){libMesaj('Boy 0,05 ile 30 metre arasında olmalı.');return;}
  t.boy=v;
  if(MODEL_KAYIT.glb[id]&&MODEL_KAYIT.kaynak[id]==='cihaz'){
    const a=MODEL_KAYIT.glbAyar[id];a.boy=v;
    modelDbIslem('readonly',function(st){return st.get(id);}).then(function(k){if(k){k.boy=v;return modelDbKaydet(k);}});
  }
  kutuphaneSec(id);
}
function libDon90(){
  const id=KUT.secili;if(!MODEL_KAYIT.glb[id])return;
  const a=MODEL_KAYIT.glbAyar[id];a.rotY=((a.rotY||0)+90)%360;
  if(MODEL_KAYIT.kaynak[id]==='cihaz')modelDbIslem('readonly',function(st){return st.get(id);}).then(function(k){if(k){k.rotY=a.rotY;return modelDbKaydet(k);}});
  kutuphaneSec(id);
}
function libSifirla(){
  const id=KUT.secili;glbKaldir(id);
  modelDbSil(id).catch(function(){});
  kutuphaneListele();kutuphaneSec(id);libMesaj('Bu cihazdaki model silindi, kod modeline dönüldü.');
}
function libJsonKopyala(){
  const id=KUT.secili,t=MODEL_KAYIT.harita[id];
  const txt='"'+id+'": { "file": "assets/models/'+id+'.glb", "boy": '+(t.boy||1)+', "rotY": '+(((MODEL_KAYIT.glbAyar||{})[id]||{}).rotY||0)+' }';
  const bitti=function(){libMesaj('models.json satırı kopyalandı. Dosyayı assets/models/'+id+'.glb olarak koy.');};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(bitti,function(){libMesaj(txt);});else libMesaj(txt);
}
