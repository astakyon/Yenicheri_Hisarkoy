// ═══════════════════════════════════════════════════════
// ZOOM / PAN SİSTEMİ — pencere boyutu sabit, harita içinde
// yakınlaştırma + sürükleme. CSS transform:scale kullanır,
// canvas'ın kendi piksel boyutu hiç değişmez.
// ═══════════════════════════════════════════════════════
function applyBmTransform(){
  const inner=document.getElementById('bmCanvasInner');
  if(!inner)return;
  inner.style.transform=`translate(${bmPanX}px,${bmPanY}px) scale(${bmFitScale*bmZoomLvl})`;
}

// Haritayı, mevcut #bmCanvasWrap alanına TAM SIĞACAK şekilde ölçekleyip ortalar.
function bmResetView(){
  const wrap=document.getElementById('bmCanvasWrap');
  if(!wrap||!bmCanvasW)return;
  const ww=wrap.clientWidth,wh=wrap.clientHeight;
  if(ww<10||wh<10)return; // henüz layout oturmamış
  bmFitScale=Math.min(ww/bmCanvasW,wh/bmCanvasH);
  bmZoomLvl=1;
  // Ortala
  const drawnW=bmCanvasW*bmFitScale,drawnH=bmCanvasH*bmFitScale;
  bmPanX=(ww-drawnW)/2;
  bmPanY=(wh-drawnH)/2;
  applyBmTransform();
}

function bmZoom(delta){
  const wrap=document.getElementById('bmCanvasWrap');
  if(!wrap)return;
  const oldTotal=bmFitScale*bmZoomLvl;
  bmZoomLvl=Math.max(0.5,Math.min(4,bmZoomLvl+delta));
  const newTotal=bmFitScale*bmZoomLvl;
  // Zoom merkezini wrap'in ortasında sabit tutmaya çalış
  const cx=wrap.clientWidth/2,cy=wrap.clientHeight/2;
  const worldX=(cx-bmPanX)/oldTotal,worldY=(cy-bmPanY)/oldTotal;
  bmPanX=cx-worldX*newTotal;
  bmPanY=cy-worldY*newTotal;
  applyBmTransform();
}

// ── Dokunmatik pan + pinch-zoom ──
let bmTouchState={mode:null,lastX:0,lastY:0,startDist:0,startZoom:1};
function bmDist(t1,t2){return Math.hypot(t2.clientX-t1.clientX,t2.clientY-t1.clientY);}
function initBmTouch(){
  const wrap=document.getElementById('bmCanvasWrap');
  if(!wrap||wrap._bmTouchInit)return;
  wrap._bmTouchInit=true;

  wrap.addEventListener('touchstart',function(e){
    if(e.touches.length===1){
      bmTouchState.mode='pan';
      bmTouchState.lastX=e.touches[0].clientX;
      bmTouchState.lastY=e.touches[0].clientY;
    } else if(e.touches.length===2){
      bmTouchState.mode='pinch';
      bmTouchState.startDist=bmDist(e.touches[0],e.touches[1]);
      bmTouchState.startZoom=bmZoomLvl;
    }
  },{passive:true});

  wrap.addEventListener('touchmove',function(e){
    e.preventDefault();
    if(bmTouchState.mode==='pan'&&e.touches.length===1){
      const dx=e.touches[0].clientX-bmTouchState.lastX;
      const dy=e.touches[0].clientY-bmTouchState.lastY;
      bmPanX+=dx;bmPanY+=dy;
      bmTouchState.lastX=e.touches[0].clientX;
      bmTouchState.lastY=e.touches[0].clientY;
      applyBmTransform();
    } else if(bmTouchState.mode==='pinch'&&e.touches.length===2){
      const d=bmDist(e.touches[0],e.touches[1]);
      const ratio=d/(bmTouchState.startDist||1);
      const oldTotal=bmFitScale*bmZoomLvl;
      bmZoomLvl=Math.max(0.5,Math.min(4,bmTouchState.startZoom*ratio));
      const newTotal=bmFitScale*bmZoomLvl;
      // İki parmağın orta noktasını zoom merkezi yap
      const rect=wrap.getBoundingClientRect();
      const midX=(e.touches[0].clientX+e.touches[1].clientX)/2-rect.left;
      const midY=(e.touches[0].clientY+e.touches[1].clientY)/2-rect.top;
      const worldX=(midX-bmPanX)/oldTotal,worldY=(midY-bmPanY)/oldTotal;
      bmPanX=midX-worldX*newTotal;
      bmPanY=midY-worldY*newTotal;
      applyBmTransform();
    }
  },{passive:false});

  wrap.addEventListener('touchend',function(e){
    if(e.touches.length===0)bmTouchState.mode=null;
    else if(e.touches.length===1){
      bmTouchState.mode='pan';
      bmTouchState.lastX=e.touches[0].clientX;
      bmTouchState.lastY=e.touches[0].clientY;
    }
  },{passive:true});

  // Masaüstü: fare tekerleği zoom + sürükle-pan
  let mouseDown=false,mLastX=0,mLastY=0;
  wrap.addEventListener('mousedown',e=>{mouseDown=true;mLastX=e.clientX;mLastY=e.clientY;});
  window.addEventListener('mouseup',()=>mouseDown=false);
  window.addEventListener('mousemove',e=>{
    if(!mouseDown)return;
    bmPanX+=e.clientX-mLastX;bmPanY+=e.clientY-mLastY;
    mLastX=e.clientX;mLastY=e.clientY;
    applyBmTransform();
  });
  wrap.addEventListener('wheel',e=>{
    e.preventDefault();
    bmZoom(e.deltaY<0?0.15:-0.15);
  },{passive:false});
}

function drawBlueprintLocked(ctx,info,W,H){
  ctx.save();
  ctx.fillStyle='#2a3a5c';ctx.globalAlpha=.08;
  ctx.fillRect(20,60,W-40,H-80);
  ctx.globalAlpha=1;
  ctx.textAlign='center';
  ctx.font='44px serif';ctx.fillText('🔒',W/2,H/2-20);
  ctx.font='bold 15px Georgia,serif';ctx.fillStyle='#2a3a5c';
  ctx.fillText(info.name+' Henüz Kilitli',W/2,H/2+20);
  ctx.font='10px Georgia,serif';ctx.fillStyle='#5a6a8c';
  ctx.fillText('Bu bölge gelecek güncellemede açılacak',W/2,H/2+38);
  ctx.restore();
}

// Tek bir bölgeyi (ZONES verisinden) blueprint üzerine gerçek dünya koordinatlarıyla çizer.
function drawZoneRect(ctx,mapId,zone,label,opts){
  opts=opts||{};
  const hw=zone.w/2,hd=zone.d/2;
  const p1=worldToBlueprint(mapId,zone.x-hw,zone.z-hd);
  const p2=worldToBlueprint(mapId,zone.x+hw,zone.z+hd);
  const x=Math.min(p1.x,p2.x),y=Math.min(p1.y,p2.y);
  const w=Math.abs(p2.x-p1.x),h=Math.abs(p2.y-p1.y);
  ctx.lineWidth=opts.lw||1.6;
  ctx.strokeStyle='#2a3a5c';
  if(opts.fill){ctx.fillStyle=opts.fill;ctx.fillRect(x,y,w,h);}
  ctx.strokeRect(x,y,w,h);
  if(label){
    ctx.font=(opts.bold?'bold ':'')+(opts.fontSize||10)+'px Georgia,serif';
    ctx.fillStyle='#2a3a5c';ctx.textAlign='center';
    ctx.fillText(label,x+w/2,y+h/2+(opts.fontSize||10)/3);
  }
  return{x,y,w,h,cx:x+w/2,cy:y+h/2};
}

function drawBlueprintKisla(ctx,W,H){
  // Tunç Nehri (kuzey kenar)
  const riverY=worldToBlueprint('kisla',0,-48).y;
  ctx.strokeStyle='#2a3a5c';ctx.globalAlpha=.4;ctx.lineWidth=W*0.012;
  ctx.beginPath();ctx.moveTo(10,riverY+8);ctx.quadraticCurveTo(W*0.25,riverY-6,W*0.55,riverY+2);ctx.stroke();
  ctx.globalAlpha=1;
  ctx.font='bold 11px Georgia,serif';ctx.textAlign='center';ctx.fillStyle='#2a3a5c';
  ctx.fillText('Tunç Nehri',W*0.28,riverY-10);

  // Dış sur (tüm Hisarköy)
  const surP1=worldToBlueprint('kisla',-47,-47),surP2=worldToBlueprint('kisla',47,47);
  ctx.lineWidth=2.5;ctx.strokeRect(surP1.x,surP1.y,surP2.x-surP1.x,surP2.y-surP1.y);

  // Köşe kuleleri
  [[-46,-46],[46,-46],[-46,46],[46,46]].forEach(([x,z])=>{
    const p=worldToBlueprint('kisla',x,z);
    const s=6*BM_SCALE;
    ctx.lineWidth=1.8;ctx.strokeRect(p.x-s/2,p.y-s/2,s,s);
  });

  // Orta cadde (Street) — kışla/sivil ayraç
  const stP1=worldToBlueprint('kisla',-3.5,-45),stP2=worldToBlueprint('kisla',3.5,45);
  ctx.lineWidth=1.2;ctx.strokeRect(stP1.x,stP1.y,stP2.x-stP1.x,stP2.y-stP1.y);

  // ── ZONES'tan otomatik bina çizimi (gerçek 3D koordinatlarla birebir) ──
  ZONES.forEach(z=>{
    if(z.id==='demirKapi'||z.id==='artisanKapi'){
      // Kapılar — küçük, dolgulu
      drawZoneRect(ctx,'kisla',z,z.name.replace(/^[^ ]+ /,''),{fill:'#f0e8d0',lw:2,fontSize:9});
      return;
    }
    drawZoneRect(ctx,'kisla',z,z.name.replace(/^[^ ]+ /,''),{bold:true,fontSize:10});
  });
  // Orta Camii kubbe işareti
  const camiiZ=ZONES.find(z=>z.id==='camii');
  if(camiiZ){const p=worldToBlueprint('kisla',camiiZ.x,camiiZ.z);ctx.beginPath();ctx.ellipse(p.x,p.y-8,camiiZ.w*BM_SCALE*0.32,camiiZ.d*BM_SCALE*0.22,0,0,Math.PI*2);ctx.lineWidth=1.3;ctx.stroke();}
  // Drill Ground talim hedefi
  const drillZ=ZONES.find(z=>z.id==='drill');
  if(drillZ){const p=worldToBlueprint('kisla',drillZ.x+2,drillZ.z+2);ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.lineWidth=1;ctx.stroke();}
  // Hamam kubbe işareti
  const hamamZ=ZONES.find(z=>z.id==='hamam');
  if(hamamZ){const p=worldToBlueprint('kisla',hamamZ.x,hamamZ.z);ctx.beginPath();ctx.ellipse(p.x,p.y-6,hamamZ.w*BM_SCALE*0.28,hamamZ.d*BM_SCALE*0.2,0,0,Math.PI*2);ctx.lineWidth=1.3;ctx.stroke();}

  drawNorthArrow(ctx,W-30,28);
}

function drawBlueprintGorev(ctx,W,H){
  ctx.strokeStyle='#2a3a5c';ctx.fillStyle='#2a3a5c';
  // Dış sur (buildGorev: ±30 birim)
  const sP1=worldToBlueprint('gorev',-30,-30),sP2=worldToBlueprint('gorev',30,30);
  ctx.lineWidth=2;ctx.strokeRect(sP1.x,sP1.y,sP2.x-sP1.x,sP2.y-sP1.y);
  ctx.font='bold 11px Georgia,serif';ctx.textAlign='center';
  ctx.fillText('Hisarköy Devriye Alanı',W/2,sP1.y-10);

  // Köşe kuleleri (buildGorev: ±29)
  [[-29,-29],[29,-29],[-29,29],[29,29]].forEach(([x,z])=>{
    const p=worldToBlueprint('gorev',x,z);
    const s=5*BM_SCALE;
    ctx.lineWidth=1.5;ctx.strokeRect(p.x-s/2,p.y-s/2,s,s);
  });

  // Gerçek 3D binalar (GOREV_BUILDINGS — birebir buildGorev'den)
  GOREV_BUILDINGS.forEach(b=>{
    drawZoneRect(ctx,'gorev',b,b.name,{fontSize:9});
  });
  // Orta Camii kubbe
  const camii=GOREV_BUILDINGS.find(b=>b.name==='Orta Camii');
  if(camii){const p=worldToBlueprint('gorev',camii.x,camii.z);ctx.beginPath();ctx.ellipse(p.x,p.y-6,camii.w*BM_SCALE*0.3,camii.d*BM_SCALE*0.22,0,0,Math.PI*2);ctx.lineWidth=1.2;ctx.stroke();}

  // Küçük kulübeler (loot/dekoratif yapılar)
  ctx.globalAlpha=.6;
  GOREV_HUTS.forEach(([x,z,w,d])=>{
    drawZoneRect(ctx,'gorev',{x,z,w,d},null,{lw:1});
  });
  ctx.globalAlpha=1;

  // Tunç Nehri kenarı (kuzey — görsel referans, buildGorev'de yok ama tema tutarlılığı için)
  const riverY=worldToBlueprint('gorev',0,-30).y;
  ctx.globalAlpha=.3;ctx.lineWidth=W*0.012;
  ctx.beginPath();ctx.moveTo(sP1.x,riverY-4);ctx.quadraticCurveTo(W/2,riverY-14,sP2.x,riverY-4);ctx.stroke();
  ctx.globalAlpha=1;

  drawNorthArrow(ctx,W-30,28);
}

function drawBlueprintOrman(ctx,W,H){
  // Dış sınır
  const sP1=worldToBlueprint('orman',-46,-46),sP2=worldToBlueprint('orman',46,46);
  ctx.strokeStyle='#2a3a5c';ctx.lineWidth=2;ctx.strokeRect(sP1.x,sP1.y,sP2.x-sP1.x,sP2.y-sP1.y);

  // Akarsu (batı kenar, ~x=-30)
  const rTop=worldToBlueprint('orman',-30,-46),rBot=worldToBlueprint('orman',-30,46);
  ctx.globalAlpha=.45;ctx.lineWidth=W*0.025;ctx.strokeStyle='#3070b0';
  ctx.beginPath();ctx.moveTo(rTop.x,rTop.y);ctx.lineTo(rBot.x,rBot.y);ctx.stroke();
  ctx.globalAlpha=1;ctx.strokeStyle='#2a3a5c';
  ctx.font='10px Georgia,serif';ctx.textAlign='center';ctx.fillStyle='#2a3a5c';
  ctx.fillText('Akarsu',rTop.x,rTop.y+24);

  // Sık Orman (merkez — daire alan)
  const center=worldToBlueprint('orman',0,0);
  ctx.beginPath();ctx.arc(center.x,center.y,22*BM_SCALE,0,Math.PI*2);ctx.lineWidth=1.4;ctx.setLineDash([6,4]);ctx.stroke();ctx.setLineDash([]);
  ctx.font='bold 11px Georgia,serif';ctx.fillText('Sık Orman',center.x,center.y);

  // Avcı Kulübesi (giriş, GB)
  drawZoneRect(ctx,'orman',{x:-32,z:32,w:9,d:7},'Avcı Kulübesi',{bold:true,fontSize:9});

  // Mağara (doğu — boss)
  const cave=drawZoneRect(ctx,'orman',{x:34,z:0,w:10,d:12},null,{lw:1.8});
  ctx.font='bold 10px Georgia,serif';ctx.fillText('Mağara',cave.cx,cave.cy-6);
  ctx.font='9px Georgia,serif';ctx.fillText('(Koca Ayı)',cave.cx,cave.cy+8);

  // Sulak Alan (GD)
  const wet=worldToBlueprint('orman',20,28);
  ctx.beginPath();ctx.arc(wet.x,wet.y,10*BM_SCALE,0,Math.PI*2);ctx.lineWidth=1.2;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);
  ctx.font='10px Georgia,serif';ctx.fillText('Sulak Alan',wet.x,wet.y);

  // Açık Ova (güney)
  drawZoneRect(ctx,'orman',{x:-5,z:38,w:36,d:16},'Açık Ova',{fontSize:10});

  ctx.textAlign='left';
  drawNorthArrow(ctx,W-30,28);
}

function drawBlueprintMaden(ctx,W,H){
  const sP1=worldToBlueprint('maden',-38,-38),sP2=worldToBlueprint('maden',38,38);
  ctx.strokeStyle='#2a3a5c';ctx.lineWidth=2;ctx.strokeRect(sP1.x,sP1.y,sP2.x-sP1.x,sP2.y-sP1.y);
  ctx.fillStyle='#2a3a5c';ctx.font='bold 11px Georgia,serif';ctx.textAlign='center';
  ctx.fillText('Demir Madeni — Karanlık Tünel',W/2,sP1.y-8);

  MADEN_ODALAR.forEach(function(o){
    const r=drawZoneRect(ctx,'maden',{x:(o.x0+o.x1)/2,z:(o.z0+o.z1)/2,w:o.x1-o.x0,d:o.z1-o.z0},null,{lw:o.id==='gizli'?1.8:1.2});
    ctx.font=(o.id==='gizli'||o.id==='kavsak'?'bold ':'')+'9px Georgia,serif';ctx.fillText(o.ad,r.cx,r.cy);
  });
  drawZoneRect(ctx,'maden',{x:0,z:36,w:12,d:2},'Giriş',{bold:true,fontSize:9});

  ctx.textAlign='left';
  drawNorthArrow(ctx,W-30,28);
}

function drawNorthArrow(ctx,x,y){
  ctx.save();
  ctx.fillStyle='#2a3a5c';ctx.font='bold 13px Georgia,serif';ctx.textAlign='center';
  ctx.fillText('K',x,y);
  ctx.beginPath();ctx.moveTo(x,y+4);ctx.lineTo(x,y+20);ctx.strokeStyle='#2a3a5c';ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-5,y+10);ctx.lineTo(x,y-4);ctx.lineTo(x+5,y+10);ctx.fill();
  ctx.restore();
}

// Harita ekranı açıkken oyuncu konumu canlı güncellensin (her ~500ms)
let bmRefreshTimer=null;
function startBmRefresh(){
  if(bmRefreshTimer)clearInterval(bmRefreshTimer);
  bmRefreshTimer=setInterval(()=>{
    if(document.getElementById('bigMapBox').style.display==='flex')drawBlueprintMap(bmActiveTab);
  },500);
}
startBmRefresh();

