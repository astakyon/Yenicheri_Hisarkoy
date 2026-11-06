// ═══════════════════════════════════════════════════════
// HARİTA EDİTÖRÜ — Ana menüden doğrudan erişilir
// ═══════════════════════════════════════════════════════

// ── Editör durumu ──
let meCurrentMapId=null;
let meCurrentMapData=null;
let meActiveCategory='bina';
let meActiveAsset=null;
let meEraserMode=false;
let meSpawnMode=false;
let meZoomLvl=1,mePanX=0,mePanY=0,meFitScale=1;
const ME_CELL_PX=24; // ızgara karesi piksel boyutu (taban ölçek)
const ME_DEFAULT_SIZE=40; // varsayılan yeni harita boyutu (40x40 kare)

function openMapEditor(){
  document.getElementById('menuLayer').style.display='none';
  document.getElementById('mapEditorBox').style.display='flex';
  meBackToList();
}
function closeMapEditor(){
  document.getElementById('mapEditorBox').style.display='none';
  document.getElementById('menuLayer').style.display='block';
}

// ── Harita Listesi ──
function meBackToList(){
  document.getElementById('meListView').style.display='flex';
  document.getElementById('meEditView').style.display='none';
  meCurrentMapId=null;meCurrentMapData=null;
  meBuildMapList();
}
function meBuildMapList(){
  const wrap=document.getElementById('meMapList');
  if(!wrap)return;
  const maps=loadCustomMaps();
  const ids=Object.keys(maps);
  wrap.innerHTML='';
  if(ids.length===0){
    wrap.innerHTML='<div style="color:#888;font-size:10px;text-align:center;padding:20px;">Henüz harita yok. "+ Yeni Harita" ile başla.</div>';
    return;
  }
  ids.forEach(function(id){
    const m=maps[id];
    const cellCount=Object.keys(m.cells||{}).length;
    const card=document.createElement('div');
    card.className='meMapCard';
    const srcBadge=m.sourceMap?`<span style="font-size:8px;color:#5dade2;border:1px solid #3498db;border-radius:3px;padding:1px 5px;margin-left:4px;">otomatik</span>`:'';
    card.innerHTML=`
      <div style="flex:1;">
        <div class="mmcName">${m.name||'İsimsiz'}${srcBadge}</div>
        <div class="mmcInfo">${m.size||40}×${m.size||40} kare — ${cellCount} obje</div>
      </div>
      <div class="mmcBtns">
        <button class="meSmallBtn" data-act="edit">✏️</button>
        <button class="meSmallBtn" data-act="test">▶</button>
        <button class="meSmallBtn red" data-act="del">🗑</button>
      </div>`;
    card.querySelector('[data-act="edit"]').onclick=()=>meOpenMap(id);
    card.querySelector('[data-act="test"]').onclick=()=>BEGIN_CUSTOM(id);
    card.querySelector('[data-act="del"]').onclick=()=>meDeleteMapConfirm(id);
    wrap.appendChild(card);
  });
}
function meDeleteMapConfirm(id){
  const maps=loadCustomMaps();
  const name=maps[id]?.name||'bu harita';
  showDlg('🗑 Haritayı Sil','"'+name+'" silinsin mi?\n\nBu işlem geri alınamaz.','Evet, Sil',function(){
    deleteCustomMap(id);
    hideDlg();
    meBuildMapList();
  });
  setTimeout(()=>{
    const b=document.getElementById('dlgB');
    if(b){
      // Önceki ekstra butonları temizle
      let n=b.nextSibling;while(n){const next=n.nextSibling;if(n.nodeType===1)n.remove();n=next;}
      const cancel=b.cloneNode();cancel.textContent='İptal';cancel.onclick=hideDlg;cancel.style.marginLeft='8px';
      b.parentNode.insertBefore(cancel,b.nextSibling);
    }
  },50);
}

function meCreateNewMap(){
  const id='map_'+Date.now();
  const data={name:'Yeni Harita',size:ME_DEFAULT_SIZE,cells:{},spawn:{x:0,z:0}};
  setCustomMap(id,data);
  meOpenMap(id);
}

// ── Editör Çalışma Alanı ──
function meOpenMap(id){
  meCurrentMapId=id;
  meCurrentMapData=getCustomMap(id)||{name:'Yeni Harita',size:ME_DEFAULT_SIZE,cells:{},spawn:{x:0,z:0}};
  document.getElementById('meListView').style.display='none';
  document.getElementById('meEditView').style.display='flex';
  document.getElementById('meMapName').value=meCurrentMapData.name||'';
  meBuildCategoryTabs();
  meBuildAssetPalette();
  requestAnimationFrame(()=>{
    meResetView();
    meDrawGrid();
    meInitTouch();
  });
}
function meSaveMap(){
  if(!meCurrentMapId)return;
  meCurrentMapData.name=document.getElementById('meMapName').value||'İsimsiz Harita';
  setCustomMap(meCurrentMapId,meCurrentMapData);
  lootPop('💾 Harita kaydedildi!');
}
function meTestMap(){
  meSaveMap();
  BEGIN_CUSTOM(meCurrentMapId);
}

// ── Kategori Sekmeleri ──
function meBuildCategoryTabs(){
  const wrap=document.getElementById('meCategoryTabs');
  if(!wrap)return;
  wrap.innerHTML='';
  ASSET_CATEGORIES.forEach(function(c){
    const tab=document.createElement('div');
    tab.className='meCatTab'+(c.id===meActiveCategory?' on':'');
    tab.textContent=c.icon+' '+c.name;
    tab.onclick=()=>{meActiveCategory=c.id;meActiveAsset=null;meBuildCategoryTabs();meBuildAssetPalette();};
    wrap.appendChild(tab);
  });
}
function meBuildAssetPalette(){
  const wrap=document.getElementById('meAssetPalette');
  if(!wrap)return;
  wrap.innerHTML='';
  Object.keys(ASSET_DEFS).forEach(function(key){
    const def=ASSET_DEFS[key];
    if(def.cat!==meActiveCategory)return;
    const btn=document.createElement('div');
    btn.className='meAssetBtn'+(meActiveAsset===key?' on':'');
    btn.innerHTML=`<div class="maIcon">${def.icon}</div><div class="maName">${def.name}</div>`;
    btn.onclick=()=>{
      meActiveAsset=key;meEraserMode=false;meSpawnMode=false;
      document.getElementById('meEraserBtn').classList.remove('on');
      document.getElementById('meSpawnBtn').classList.remove('on');
      meBuildAssetPalette();
      document.getElementById('meSelectedInfo').textContent='Seçili: '+def.icon+' '+def.name+' — ızgaraya dokun';
    };
    wrap.appendChild(btn);
  });
}
function meToggleEraser(){
  meEraserMode=!meEraserMode;meSpawnMode=false;meActiveAsset=null;
  document.getElementById('meEraserBtn').classList.toggle('on',meEraserMode);
  document.getElementById('meSpawnBtn').classList.remove('on');
  document.getElementById('meSelectedInfo').textContent=meEraserMode?'🗑 Silgi modu — ızgaraya dokunup sil':'Bir araç seçin';
}
function meSetSpawn(){
  meSpawnMode=!meSpawnMode;meEraserMode=false;meActiveAsset=null;
  document.getElementById('meSpawnBtn').classList.toggle('on',meSpawnMode);
  document.getElementById('meEraserBtn').classList.remove('on');
  document.getElementById('meSelectedInfo').textContent=meSpawnMode?'🚩 Başlangıç noktası — ızgaraya dokun':'Bir araç seçin';
}

// ── Izgara Çizimi (2D kuşbakışı canvas) ──
function meDrawGrid(){
  const cv=document.getElementById('meGridCanvas');
  if(!cv||!meCurrentMapData)return;
  const ctx=cv.getContext('2d');
  const size=meCurrentMapData.size||ME_DEFAULT_SIZE;
  const W=size*ME_CELL_PX,H=W;
  cv.width=W;cv.height=H;
  meGridCanvasW=W;meGridCanvasH=H;

  ctx.fillStyle='#f0e8d0';ctx.fillRect(0,0,W,H);
  // Izgara çizgileri
  ctx.strokeStyle='rgba(42,58,92,.25)';ctx.lineWidth=1;
  for(let i=0;i<=size;i++){
    ctx.beginPath();ctx.moveTo(i*ME_CELL_PX,0);ctx.lineTo(i*ME_CELL_PX,H);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,i*ME_CELL_PX);ctx.lineTo(W,i*ME_CELL_PX);ctx.stroke();
  }
  // Merkez çizgileri (0,0 ekseni)
  ctx.strokeStyle='rgba(139,20,20,.4)';ctx.lineWidth=1.5;
  const cx=Math.floor(size/2)*ME_CELL_PX,cy=Math.floor(size/2)*ME_CELL_PX;
  ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(W,cy);ctx.stroke();

  // Yerleştirilmiş objeler — gerçek boyutlarına göre çiz (üst üste binmeyi görsel olarak da yansıtır)
  const cells=meCurrentMapData.cells||{};
  const half=Math.floor(size/2);
  const drawnAnchors=new Set(); // her objeyi sadece bir kez (anchor hücresinde) çiz
  Object.keys(cells).forEach(function(key){
    const cell=cells[key];
    const def=ASSET_DEFS[cell.asset];
    if(!def)return;
    if(!cell.anchor)return; // sadece anchor hücreleri çizilir, kaplanan diğer hücreler atlanır
    const [gx,gz]=key.split(',').map(Number);
    const cw=Math.max(1,Math.round(def.w||1)),cd=Math.max(1,Math.round(def.d||1));
    const px=(gx+half)*ME_CELL_PX,py=(gz+half)*ME_CELL_PX;
    const boxW=cw*ME_CELL_PX,boxH=cd*ME_CELL_PX;
    ctx.fillStyle=meCategoryColor(def.cat);
    ctx.fillRect(px-ME_CELL_PX/2,py-ME_CELL_PX/2,boxW,boxH);
    ctx.strokeStyle='rgba(42,58,92,.55)';ctx.lineWidth=1.2;
    ctx.strokeRect(px-ME_CELL_PX/2,py-ME_CELL_PX/2,boxW,boxH);
    ctx.font=(Math.min(boxW,boxH)*0.55)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#1c0e00';
    ctx.fillText(def.icon,px-ME_CELL_PX/2+boxW/2,py-ME_CELL_PX/2+boxH/2);
  });

  // Spawn noktası
  const spawn=meCurrentMapData.spawn||{x:0,z:0};
  const sx=(spawn.x+half)*ME_CELL_PX,sy=(spawn.z+half)*ME_CELL_PX;
  ctx.font=(ME_CELL_PX*0.9)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🚩',sx,sy);

  ctx.strokeStyle='#2a3a5c';ctx.lineWidth=2;ctx.strokeRect(0,0,W,H);
}
function meCategoryColor(cat){
  const colors={bina:'rgba(200,160,80,.45)',doga:'rgba(80,160,60,.35)',aydinlatma:'rgba(255,150,30,.35)',gecis:'rgba(139,90,20,.4)',npc:'rgba(70,110,200,.35)',su:'rgba(48,112,176,.4)',zemin:'rgba(150,150,150,.25)'};
  return colors[cat]||'rgba(139,105,20,.3)';
}
let meGridCanvasW=0,meGridCanvasH=0;

function meApplyTransform(){
  const inner=document.getElementById('meGridCanvas');
  if(!inner)return;
  inner.style.transform=`translate(${mePanX}px,${mePanY}px) scale(${meFitScale*meZoomLvl})`;
  inner.style.transformOrigin='0 0';
}
function meResetView(){
  const wrap=document.getElementById('meGridWrap');
  if(!wrap||!meGridCanvasW){
    // canvas henüz çizilmemiş, boyut hesabı için tahmini kullan
    const size=(meCurrentMapData&&meCurrentMapData.size)||ME_DEFAULT_SIZE;
    meGridCanvasW=size*ME_CELL_PX;meGridCanvasH=meGridCanvasW;
  }
  const ww=wrap.clientWidth,wh=wrap.clientHeight;
  if(ww<10||wh<10)return;
  meFitScale=Math.min(ww/meGridCanvasW,wh/meGridCanvasH,1.5);
  meZoomLvl=1;
  const drawnW=meGridCanvasW*meFitScale,drawnH=meGridCanvasH*meFitScale;
  mePanX=(ww-drawnW)/2;mePanY=(wh-drawnH)/2;
  meApplyTransform();
}
function meZoom(delta){
  const wrap=document.getElementById('meGridWrap');
  if(!wrap)return;
  const oldTotal=meFitScale*meZoomLvl;
  meZoomLvl=Math.max(0.3,Math.min(4,meZoomLvl+delta));
  const newTotal=meFitScale*meZoomLvl;
  const cx=wrap.clientWidth/2,cy=wrap.clientHeight/2;
  const worldX=(cx-mePanX)/oldTotal,worldY=(cy-mePanY)/oldTotal;
  mePanX=cx-worldX*newTotal;mePanY=cy-worldY*newTotal;
  meApplyTransform();
}

// ── Dokunma/Tıklama: hücreye obje yerleştirme veya silme ──
function meHandleCellTap(clientX,clientY){
  const wrap=document.getElementById('meGridWrap');
  const cv=document.getElementById('meGridCanvas');
  if(!wrap||!cv||!meCurrentMapData)return;
  const rect=wrap.getBoundingClientRect();
  const localX=clientX-rect.left-mePanX,localY=clientY-rect.top-mePanY;
  const totalScale=meFitScale*meZoomLvl;
  const canvasX=localX/totalScale,canvasY=localY/totalScale;
  const size=meCurrentMapData.size||ME_DEFAULT_SIZE;
  const half=Math.floor(size/2);
  const gx=Math.floor(canvasX/ME_CELL_PX)-half;
  const gz=Math.floor(canvasY/ME_CELL_PX)-half;
  if(gx<-half||gx>=size-half||gz<-half||gz>=size-half)return;

  const key=gx+','+gz;
  if(meSpawnMode){
    meCurrentMapData.spawn={x:gx,z:gz};
    meDrawGrid();
    return;
  }
  if(meEraserMode){
    meEraseCellGroup(gx,gz);
    meDrawGrid();
    return;
  }
  if(meActiveAsset){
    const def=ASSET_DEFS[meActiveAsset];
    const cw=Math.max(1,Math.round(def.w||1)),cd=Math.max(1,Math.round(def.d||1));
    // Bu obje hangi hücreleri kaplayacak (anchor sol-üstte, obje sağa-aşağı doğru büyür)
    const footprint=[];
    for(let dx=0;dx<cw;dx++)for(let dz=0;dz<cd;dz++)footprint.push([gx+dx,gz+dz]);
    // Sınır kontrolü
    for(const [fx,fz] of footprint){if(fx<-half||fx>=size-half||fz<-half||fz>=size-half){meSelectedInfoMsg('⚠ Harita sınırı dışına taşıyor!');return;}}
    // Çakışma kontrolü — kaplanacak hücrelerden herhangi biri doluysa engelle
    meCurrentMapData.cells=meCurrentMapData.cells||{};
    for(const [fx,fz] of footprint){
      const fKey=fx+','+fz;
      if(meCurrentMapData.cells[fKey]){meSelectedInfoMsg('⚠ Buraya zaten bir obje yerleşmiş, önce silin');return;}
    }
    // Tüm footprint hücrelerine kayıt — sadece ilk hücre (anchor) görsel/silinme referansı taşır
    footprint.forEach(function([fx,fz],i){
      const fKey=fx+','+fz;
      meCurrentMapData.cells[fKey]={type:def.cat,asset:meActiveAsset,rot:0,anchor:(i===0),anchorKey:key};
    });
    meDrawGrid();
  }
}

// Bir hücreye dokunulduğunda, o hücrenin ait olduğu objenin TÜM kapladığı hücreleri siler
function meEraseCellGroup(gx,gz){
  const key=gx+','+gz;
  const cell=meCurrentMapData.cells&&meCurrentMapData.cells[key];
  if(!cell)return;
  const groupAnchor=cell.anchor?key:cell.anchorKey;
  if(!groupAnchor){delete meCurrentMapData.cells[key];return;}
  // Aynı anchorKey'e sahip tüm hücreleri bul ve sil
  Object.keys(meCurrentMapData.cells).forEach(function(k){
    const c=meCurrentMapData.cells[k];
    const cAnchor=c.anchor?k:c.anchorKey;
    if(cAnchor===groupAnchor)delete meCurrentMapData.cells[k];
  });
}
function meSelectedInfoMsg(msg){
  const el=document.getElementById('meSelectedInfo');
  if(el){const prev=el.textContent;el.textContent=msg;el.style.color='#ff6b6b';setTimeout(()=>{el.style.color='';el.textContent=prev;},1200);}
}

// ── Dokunmatik + Fare etkileşimi (pan/zoom + tıklama ayrımı) ──
let meTouchState={mode:null,lastX:0,lastY:0,startDist:0,startZoom:1,startX:0,startY:0,moved:false};
function meDist(t1,t2){return Math.hypot(t2.clientX-t1.clientX,t2.clientY-t1.clientY);}
function meInitTouch(){
  const wrap=document.getElementById('meGridWrap');
  if(!wrap||wrap._meInit)return;
  wrap._meInit=true;

  wrap.addEventListener('touchstart',function(e){
    if(e.touches.length===1){
      meTouchState.mode='pan';meTouchState.moved=false;
      meTouchState.lastX=e.touches[0].clientX;meTouchState.lastY=e.touches[0].clientY;
      meTouchState.startX=e.touches[0].clientX;meTouchState.startY=e.touches[0].clientY;
    }else if(e.touches.length===2){
      meTouchState.mode='pinch';
      meTouchState.startDist=meDist(e.touches[0],e.touches[1]);
      meTouchState.startZoom=meZoomLvl;
    }
  },{passive:true});

  wrap.addEventListener('touchmove',function(e){
    e.preventDefault();
    if(meTouchState.mode==='pan'&&e.touches.length===1){
      const dx=e.touches[0].clientX-meTouchState.lastX;
      const dy=e.touches[0].clientY-meTouchState.lastY;
      if(Math.abs(e.touches[0].clientX-meTouchState.startX)>6||Math.abs(e.touches[0].clientY-meTouchState.startY)>6)meTouchState.moved=true;
      mePanX+=dx;mePanY+=dy;
      meTouchState.lastX=e.touches[0].clientX;meTouchState.lastY=e.touches[0].clientY;
      meApplyTransform();
    }else if(meTouchState.mode==='pinch'&&e.touches.length===2){
      const d=meDist(e.touches[0],e.touches[1]);
      const ratio=d/(meTouchState.startDist||1);
      const oldTotal=meFitScale*meZoomLvl;
      meZoomLvl=Math.max(0.3,Math.min(4,meTouchState.startZoom*ratio));
      const newTotal=meFitScale*meZoomLvl;
      const rect=wrap.getBoundingClientRect();
      const midX=(e.touches[0].clientX+e.touches[1].clientX)/2-rect.left;
      const midY=(e.touches[0].clientY+e.touches[1].clientY)/2-rect.top;
      const worldX=(midX-mePanX)/oldTotal,worldY=(midY-mePanY)/oldTotal;
      mePanX=midX-worldX*newTotal;mePanY=midY-worldY*newTotal;
      meApplyTransform();
    }
  },{passive:false});

  wrap.addEventListener('touchend',function(e){
    if(meTouchState.mode==='pan'&&!meTouchState.moved){
      meHandleCellTap(meTouchState.startX,meTouchState.startY);
    }
    if(e.touches.length===0)meTouchState.mode=null;
  },{passive:true});

  // Masaüstü
  let mouseDown=false,mLastX=0,mLastY=0,mMoved=false,mStartX=0,mStartY=0;
  wrap.addEventListener('mousedown',e=>{mouseDown=true;mLastX=e.clientX;mLastY=e.clientY;mStartX=e.clientX;mStartY=e.clientY;mMoved=false;});
  window.addEventListener('mouseup',e=>{
    if(mouseDown&&!mMoved&&wrap.contains(e.target))meHandleCellTap(mStartX,mStartY);
    mouseDown=false;
  });
  window.addEventListener('mousemove',e=>{
    if(!mouseDown)return;
    if(Math.abs(e.clientX-mStartX)>4||Math.abs(e.clientY-mStartY)>4)mMoved=true;
    mePanX+=e.clientX-mLastX;mePanY+=e.clientY-mLastY;
    mLastX=e.clientX;mLastY=e.clientY;
    meApplyTransform();
  });
  wrap.addEventListener('wheel',e=>{e.preventDefault();meZoom(e.deltaY<0?0.15:-0.15);},{passive:false});
}



function bx(x,y,z,w,h,d,col,edgeCol,solid){
  const geo=new THREE.BoxGeometry(w,h,d);
  const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:col}));
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;S3.add(m);
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:edgeCol||0x6B4A0C})));
  if(solid!==false) addCollider(x,z,w,d);
  return m;
}

