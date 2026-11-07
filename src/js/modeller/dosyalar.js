// ═══════════════════════════════════════════════════════
// MODEL DOSYALARI — assets/models.json ve bu cihazdaki (IndexedDB) .glb modelleri
// Öncelik: bu cihaz > assets/models.json > kod modeli. Hiçbiri yüklenemezse oyun kod modeliyle devam eder.
// ═══════════════════════════════════════════════════════
const MODEL_YUKLEYICI='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';
const _betikSozu={};
function betikYukle(ad){
  if(_betikSozu[ad])return _betikSozu[ad];
  _betikSozu[ad]=new Promise(function(coz,red){
    const s=document.createElement('script');s.src=MODEL_YUKLEYICI+ad;
    s.onload=coz;s.onerror=function(){delete _betikSozu[ad];red(new Error(ad+' yüklenemedi'));};
    document.head.appendChild(s);
  });
  return _betikSozu[ad];
}
function gltfYukleyiciHazir(){return THREE.GLTFLoader?Promise.resolve():betikYukle('loaders/GLTFLoader.js');}
function gltfDisaAktarHazir(){return THREE.GLTFExporter?Promise.resolve():betikYukle('exporters/GLTFExporter.js');}

// ── IndexedDB: bu cihazdaki modeller ──
function modelDb(){
  return new Promise(function(coz,red){
    if(!window.indexedDB){red(new Error('IndexedDB yok'));return;}
    const r=indexedDB.open('yenicheri-modeller',1);
    r.onupgradeneeded=function(){r.result.createObjectStore('modeller',{keyPath:'id'});};
    r.onsuccess=function(){coz(r.result);};r.onerror=function(){red(r.error);};
  });
}
function modelDbIslem(mod,fn){
  return modelDb().then(function(db){return new Promise(function(coz,red){
    const tx=db.transaction('modeller',mod),st=tx.objectStore('modeller'),r=fn(st);
    tx.oncomplete=function(){coz(r&&r.result);};tx.onerror=function(){red(tx.error);};
  });});
}
function modelDbKaydet(kayit){return modelDbIslem('readwrite',function(st){return st.put(kayit);});}
function modelDbSil(id){return modelDbIslem('readwrite',function(st){return st.delete(id);});}
function modelDbHepsi(){return modelDbIslem('readonly',function(st){return st.getAll();});}

function glbCoz(veri){
  return gltfYukleyiciHazir().then(function(){return new Promise(function(coz,red){
    new THREE.GLTFLoader().parse(veri,'',coz,red);
  });});
}
function glbUygula(id,gltf,ayar,kaynak){
  MODEL_KAYIT.glb[id]=gltf;
  MODEL_KAYIT.glbAyar=MODEL_KAYIT.glbAyar||{};
  MODEL_KAYIT.glbAyar[id]=ayar||{};
  MODEL_KAYIT.kaynak[id]=kaynak;
  const t=MODEL_KAYIT.harita[id];
  if(t&&ayar&&ayar.boy>0){t._boyAyar=t.boy;t.boy=ayar.boy;}
}
function glbKaldir(id){
  delete MODEL_KAYIT.glb[id];delete MODEL_KAYIT.kaynak[id];
  if(MODEL_KAYIT.glbAyar)delete MODEL_KAYIT.glbAyar[id];
  const t=MODEL_KAYIT.harita[id];if(t&&t._boyAyar){t.boy=t._boyAyar;delete t._boyAyar;}
}

// Açılışta: models.json + bu cihazın modelleri. Hata verirse sessizce kod modelleriyle devam.
function modelDosyalariniYukle(){
  const manifest=fetch('assets/models.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null;}).then(function(j){
    if(!j||!j.models)return;
    return Promise.all(Object.keys(j.models).map(function(id){
      const m=j.models[id];
      if(id.charAt(0)==='_'||!m||!m.file||!MODEL_KAYIT.harita[id])return null;
      return gltfYukleyiciHazir().then(function(){return new Promise(function(coz,red){new THREE.GLTFLoader().load(m.file,coz,undefined,red);});})
        .then(function(g){if(!MODEL_KAYIT.glb[id])glbUygula(id,g,{boy:m.boy,rotY:m.rotY},'models.json');}).catch(function(){});
    }));
  }).catch(function(){});
  const cihaz=modelDbHepsi().then(function(liste){
    return Promise.all((liste||[]).map(function(k){
      if(!MODEL_KAYIT.harita[k.id])return null;
      return glbCoz(k.veri).then(function(g){glbUygula(k.id,g,{boy:k.boy,rotY:k.rotY},'cihaz');}).catch(function(){});
    }));
  }).catch(function(){});
  // bu cihazdaki model models.json'dakinden önceliklidir: sırayla uygula
  return manifest.then(function(){return cihaz;});
}
