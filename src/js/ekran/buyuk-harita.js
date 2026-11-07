// ═══════════════════════════════════════════════════════
// GERÇEK HARİTA (Big Blueprint Map) — oyun içinde, bulunduğun
// bölgenin tam krokisini gösterir, sekmeyle diğerlerine bakılır
// ═══════════════════════════════════════════════════════
const BLUEPRINT_MAPS=[
  {id:'kisla',name:'Hisarköy Kışlası',icon:'🏰',unlocked:true},
  {id:'gorev', name:'Hisarköy Devriye',icon:'⚔',unlocked:true},
  {id:'orman', name:'Av Ormanı',      icon:'🏹',unlockKey:'orman'},
  {id:'maden', name:'Demir Madeni',   icon:'⛏', unlockKey:'maden'},
  {id:'ciftlik', name:'Çiftlik',       icon:'🌱',unlockKey:'ciftlik'},
  {id:'tarim', name:'Tarım Ovası',    icon:'🌾',unlockKey:'tarim'},
  {id:'sehir', name:'Yabancı Şehir',  icon:'🏙',unlocked:false},
  {id:'saray', name:'Osmanlı Sarayı', icon:'👑',unlocked:false},
];
let bmActiveTab='kisla';
let wasPlayingBeforeMap=false;
// Zoom/Pan durumu
let bmZoomLvl=1, bmPanX=0, bmPanY=0;
let bmCanvasW=0, bmCanvasH=0; // çizilen canvas'ın gerçek piksel boyutu (W=H, kare)
let bmFitScale=1; // pencereye sığdırma için temel ölçek

function openBigMap(){
  if(!playing&&!paused)return; // sadece oyun içindeyken
  wasPlayingBeforeMap=playing;
  playing=false;
  bmActiveTab=currentMap||'kisla';
  document.getElementById('bigMapBox').style.display='flex';
  buildBmTabs();
  // Panel önce DOM'a yerleşsin, sonra gerçek ölçülebilir boyutları al
  requestAnimationFrame(()=>{
    sizeBigMapPanel();
    drawBlueprintMap(bmActiveTab);
    bmResetView();
    initBmTouch();
  });
}
function closeBigMap(){
  document.getElementById('bigMapBox').style.display='none';
  if(wasPlayingBeforeMap&&!paused)playing=true;
}

// Panelin yüksekliğini, gerçek tarayıcı görünür alanına (window.innerHeight) göre JS ile hesaplar.
// CSS vh/dvh/svh tutarsızlıklarından tamamen bağımsız, en güvenilir yöntem.
function sizeBigMapPanel(){
  const panel=document.getElementById('bmPanel');
  if(!panel)return;
  const vh=window.innerHeight;
  const vw=window.innerWidth;
  const targetH=Math.round(vh*0.92);
  const targetW=Math.round(Math.min(vw*0.96,820));
  panel.style.height=targetH+'px';
  panel.style.width=targetW+'px';
}
window.addEventListener('resize',()=>{
  if(document.getElementById('bigMapBox').style.display==='flex'){
    sizeBigMapPanel();
    applyBmTransform();
  }
});

function switchBmTab(id){
  const m=BLUEPRINT_MAPS.find(x=>x.id===id);
  if(!m||!isMapUnlocked(m))return;
  bmActiveTab=id;
  buildBmTabs();
  drawBlueprintMap(id);
  bmResetView();
}
function buildBmTabs(){
  const wrap=document.getElementById('bmTabs');
  if(!wrap)return;
  wrap.innerHTML='';
  BLUEPRINT_MAPS.forEach(function(m){
    const unlocked=isMapUnlocked(m);
    const tab=document.createElement('div');
    tab.className='bmTab'+(m.id===bmActiveTab?' on':'')+(!unlocked?' lk':'');
    tab.textContent=m.icon+' '+m.name;
    if(unlocked)tab.onclick=()=>switchBmTab(m.id);
    wrap.appendChild(tab);
  });
}

// Görev haritasındaki sabit binaların gerçek 3D konumları (buildGorev'den birebir alınmıştır)
const GOREV_BUILDINGS=[
  {name:'Köşk',     x:18, z:-18, w:9, d:8},
  {name:'Orta Camii',x:0, z:0,   w:12,d:12},
  {name:'Han',      x:-19,z:-8,  w:10,d:10},
  {name:'Yapı',     x:12, z:20,  w:14,d:9},
  {name:'Yapı',     x:-18,z:-20, w:11,d:7},
];
const GOREV_HUTS=[[-10,-15,5,4],[5,-20,4,4],[-20,5,4,5],[15,8,5,4],[20,-8,4,4],[-5,15,5,4]];

// Oyun-dünyası koordinatını (x,z) blueprint piksel koordinatına çevirir.
// Tek ölçek kullanır (BM_SCALE) — 3D dünya ile %100 birebir orantılı, hiç çarpıtma yok.
let BM_SCALE=7.6;       // 1 dünya birimi = N piksel (drawBlueprintMap içinde haritaya göre ayarlanır)
let BM_CENTER_X=450;    // canvas merkezi x (her çizimde güncellenir)
let BM_CENTER_Y=300;    // canvas merkezi y (her çizimde güncellenir)
function worldToBlueprint(mapId,x,z){
  return{x:BM_CENTER_X+x*BM_SCALE,y:BM_CENTER_Y+z*BM_SCALE};
}

// Canvas'ı gerçek 3D dünya sınırlarına göre sabit piksel boyutunda çizer (zoom CSS transform ile yapılır).
function drawBlueprintMap(mapId){
  const cv=document.getElementById('bmCanvas');
  if(!cv)return;
  const ctx=cv.getContext('2d');
  const half=(mapId==='kisla')?48:(mapId==='orman'||mapId==='tarim')?46:(mapId==='maden'||mapId==='ciftlik')?38:28;
  BM_SCALE=(mapId==='kisla')?7.2:(mapId==='orman'||mapId==='tarim')?7.6:(mapId==='maden'||mapId==='ciftlik')?8.4:11;
  const W=Math.round(half*2*BM_SCALE+50),H=W; // kare canvas — dünya zaten kare
  cv.width=W;cv.height=H;
  bmCanvasW=W;bmCanvasH=H;
  BM_CENTER_X=W/2;BM_CENTER_Y=H/2;

  // Zemin
  ctx.fillStyle='#f0e8d0';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#2a3a5c';ctx.lineWidth=2.5;ctx.strokeRect(6,6,W-12,H-12);
  ctx.lineWidth=0.7;ctx.strokeRect(10,10,W-20,H-20);

  ctx.fillStyle='#2a3a5c';ctx.textAlign='left';
  ctx.font='bold 17px Georgia,serif';
  const info=BLUEPRINT_MAPS.find(m=>m.id===mapId)||BLUEPRINT_MAPS[0];
  ctx.fillText(info.icon+' '+info.name,18,30);
  ctx.font='9px Georgia,serif';
  ctx.fillText('Yeniçeri: Hisarköy Muhafızı — Bölge Haritası',18,44);

  const mInfo=BLUEPRINT_MAPS.find(m=>m.id===mapId);
  if(mapId==='kisla')        drawBlueprintKisla(ctx,W,H);
  else if(mapId==='gorev')   drawBlueprintGorev(ctx,W,H);
  else if(mapId==='orman'&&mInfo&&isMapUnlocked(mInfo)) drawBlueprintOrman(ctx,W,H);
  else if(mapId==='maden'&&mInfo&&isMapUnlocked(mInfo)) drawBlueprintMaden(ctx,W,H);
  else if(mapId==='ciftlik'&&mInfo&&isMapUnlocked(mInfo)) drawBlueprintCiftlik(ctx,W,H);
  else if(mapId==='tarim'&&mInfo&&isMapUnlocked(mInfo)) drawBlueprintTarim(ctx,W,H);
  else                       drawBlueprintLocked(ctx,info,W,H);

  // Oyuncu konumu + bakış yönü (sadece şu an o haritadaysak)
  if(currentMap===mapId&&pl&&pl.mesh){
    const pt=worldToBlueprint(mapId,pl.x,pl.z);
    if(pt){
      const t=Date.now()/300;
      const pulse=2+Math.sin(t)*1.5;
      ctx.beginPath();ctx.arc(pt.x,pt.y,10+pulse,0,Math.PI*2);
      ctx.strokeStyle='rgba(39,174,96,.5)';ctx.lineWidth=1.5;ctx.stroke();
      const ang=pl.ang||0;
      ctx.save();ctx.translate(pt.x,pt.y);ctx.rotate(ang);
      ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-5,5);ctx.lineTo(-5,-5);ctx.closePath();
      ctx.fillStyle='#27ae60';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.stroke();
      ctx.restore();
      ctx.font='bold 9px Georgia,serif';ctx.fillStyle='#27ae60';ctx.textAlign='center';
      ctx.fillText('SEN',pt.x,pt.y-16);
    }
  }

  // Lejant
  const lg=document.getElementById('bmLegend');
  if(lg)lg.textContent=currentMap===mapId?'🟢 Yeşil ok şu anki konumun ve baktığın yön':'Bu haritada değilsin — konum gösterilmiyor';
}

