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
  REN.toneMapping=THREE.ACESFilmicToneMapping;REN.toneMappingExposure=1.6;
  CLK=new THREE.Clock();RC=new THREE.Raycaster();GP=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  window.addEventListener('resize',()=>{const W2=window.innerWidth,H2=window.innerHeight;REN.setSize(W2,H2);CAM.aspect=W2/H2;CAM.updateProjectionMatrix();});
  const cv3=document.getElementById('c3d');
  cv3.addEventListener('mousedown',e=>{mousePos.x=e.clientX;mousePos.y=e.clientY;if(!playing||paused)return;if(currentMap==='gorev'||currentMap==='orman'||currentMap==='maden'||(currentMap&&currentMap.startsWith('custom_'))){if(selWeapon===0)doMelee();else{pwrOn=true;pwr=0;}}});
  cv3.addEventListener('mouseup',()=>{if(!playing||paused)return;if(pwrOn){doRanged();pwrOn=false;pwr=0;document.getElementById('pwrW').style.display='none';}});
  cv3.addEventListener('mousemove',e=>{mousePos.x=e.clientX;mousePos.y=e.clientY;});
  // Kamera zoom — fare tekerleği
  cv3.addEventListener('wheel',e=>{
    if(!playing||paused)return;
    e.preventDefault();
    camZoom=Math.max(.5,Math.min(2.2,camZoom+(e.deltaY>0?.08:-.08)));
  },{passive:false});
  // Kamera zoom — pinch (iki parmak)
  let camPinchStartDist=0,camPinchStartZoom=1;
  cv3.addEventListener('touchstart',e=>{
    if(e.touches.length===2){
      camPinchStartDist=Math.hypot(e.touches[1].clientX-e.touches[0].clientX,e.touches[1].clientY-e.touches[0].clientY);
      camPinchStartZoom=camZoom;
    }
  },{passive:true});
  cv3.addEventListener('touchmove',e=>{
    if(!playing||paused)return;
    if(e.touches.length===2){
      e.preventDefault();
      const d=Math.hypot(e.touches[1].clientX-e.touches[0].clientX,e.touches[1].clientY-e.touches[0].clientY);
      const ratio=camPinchStartDist>0?camPinchStartDist/d:1;
      camZoom=Math.max(.5,Math.min(2.2,camPinchStartZoom*ratio));
    }
  },{passive:false});
}

// ── BOX YARDIMCISI ──
// solid: true ise otomatik AABB collider eklenir (duvar/bina gibi geçilemez objeler için)
