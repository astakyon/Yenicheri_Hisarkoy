// ═══════════════════════════════════════════════════════
// THREE.JS BAŞLAT
// ═══════════════════════════════════════════════════════
function initThree(){
  if(S3)return;
  const W=window.innerWidth,H=window.innerHeight;
  S3=new THREE.Scene();
  CAM=new THREE.PerspectiveCamera(52,W/H,.1,120);
  CAM.position.set(0,14,16);CAM.lookAt(0,0,0);
  const cv=document.getElementById('c3d');
  cv.width=W;cv.height=H;
  REN=new THREE.WebGLRenderer({antialias:true,canvas:cv});
  REN.setSize(W,H);REN.shadowMap.enabled=true;REN.shadowMap.type=THREE.PCFSoftShadowMap;
  REN.toneMapping=THREE.ACESFilmicToneMapping;REN.toneMappingExposure=1.15;
  CLK=new THREE.Clock();RC=new THREE.Raycaster();GP=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  window.addEventListener('resize',()=>{const W2=window.innerWidth,H2=window.innerHeight;REN.setSize(W2,H2);CAM.aspect=W2/H2;CAM.updateProjectionMatrix();});
  const cv3=document.getElementById('c3d');
  let camSurukle=false,camSurukleX=0;
  cv3.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('mousemove',e=>{if(camSurukle){camYaw-=(e.clientX-camSurukleX)*.008;camSurukleX=e.clientX;}});
  window.addEventListener('mouseup',e=>{if(e.button===1||e.button===2)camSurukle=false;});
  cv3.addEventListener('mousedown',e=>{mousePos.x=e.clientX;mousePos.y=e.clientY;if(e.button===1||e.button===2){e.preventDefault();camSurukle=true;camSurukleX=e.clientX;return;}if(e.button!==0)return;if(!playing||paused)return;if(currentMap==='gorev'||currentMap==='orman'||currentMap==='maden'||currentMap==='tarim'||(currentMap&&currentMap.startsWith('custom_'))){if(selWeapon===0)doMelee();else{pwrOn=true;pwr=0;}}});
  cv3.addEventListener('mouseup',()=>{if(!playing||paused)return;if(pwrOn){doRanged();pwrOn=false;pwr=0;document.getElementById('pwrW').style.display='none';}});
  cv3.addEventListener('mousemove',e=>{mousePos.x=e.clientX;mousePos.y=e.clientY;});
  // Kamera zoom — fare tekerleği
  cv3.addEventListener('wheel',e=>{
    if(!playing||paused)return;
    e.preventDefault();
    camZoom=Math.max(.5,Math.min(2.2,camZoom+(e.deltaY>0?.08:-.08)));
  },{passive:false});
  // Kamera zoom — pinch (iki parmak)
  let camPinchStartDist=0,camPinchStartZoom=1,camTwistStart=0,camTwistYaw=0;
  const _tw=t=>Math.atan2(t[1].clientY-t[0].clientY,t[1].clientX-t[0].clientX);
  let tek={x:0,id:-1,surukle:false};
  cv3.addEventListener('touchstart',e=>{
    const t=e.targetTouches;
    if(t.length===1){tek.x=t[0].clientX;tek.id=t[0].identifier;tek.surukle=false;}
    if(t.length===2){tek.id=-1;
      camPinchStartDist=Math.hypot(t[1].clientX-t[0].clientX,t[1].clientY-t[0].clientY);
      camPinchStartZoom=camZoom;camTwistStart=_tw(t);camTwistYaw=camYaw;
    }
  },{passive:true});
  cv3.addEventListener('touchmove',e=>{
    if(!playing||paused)return;
    const t=e.targetTouches;
    // Tek parmak sürükleme: kamerayı döndürür (kısa dokunuş saldırı/nişan olarak kalır)
    if(t.length===1&&t[0].identifier===tek.id){
      const dx=t[0].clientX-tek.x;
      if(tek.surukle||Math.abs(dx)>10){tek.surukle=true;camYaw-=dx*.008;tek.x=t[0].clientX;e.preventDefault();}
    }
    if(t.length===2){
      e.preventDefault();
      const d=Math.hypot(t[1].clientX-t[0].clientX,t[1].clientY-t[0].clientY);
      const ratio=camPinchStartDist>0?camPinchStartDist/d:1;
      camZoom=Math.max(.5,Math.min(2.2,camPinchStartZoom*ratio));
      camYaw=camTwistYaw-(_tw(t)-camTwistStart);
    }
  },{passive:false});
}

// ── BOX YARDIMCISI ──
// solid: true ise otomatik AABB collider eklenir (duvar/bina gibi geçilemez objeler için)
