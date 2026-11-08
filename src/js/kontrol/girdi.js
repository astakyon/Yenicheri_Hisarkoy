// ═══════════════════════════════════════════════════════
// KLAVYE & DOKUNMATIK
// ═══════════════════════════════════════════════════════
document.addEventListener('keydown',function(e){
  keys[e.key.toLowerCase()]=true;
  if(e.key==='1')selW(0);if(e.key==='2')selW(1);if(e.key==='3')selW(2);
  if(e.key==='q'||e.key==='Q')useAbility('q');
  if(e.key==='f'||e.key==='F')useAbility('f');
  if(e.key==='r'&&!e.ctrlKey)useAbility('r');
  if(e.key==='Escape'||e.key==='p'||e.key==='P'){if(document.getElementById('dlgLayer').style.display==='flex'){hideDlg();return;}if(document.getElementById('zoneMenuBox').style.display==='flex'){closeZoneMenu();return;}if(playing)doPause();else if(paused)doResume();}
  if((e.key==='i'||e.key==='I')&&currentMap==='ciftlik'&&playing){if(ciftlikPanelTur==='envanter')ciftlikPanelKapat();else ciftlikPanelAc('envanter');}
  if((e.key==='e'||e.key==='E')){
    if(pl.nearZone){
      if(pl.nearZone.id==='madenCikis')madenCik();else if(pl.nearZone.id==='tarimCikis')tarimCik();else if(pl.nearZone.id==='dalgaCikis')dmCik();else if(String(pl.nearZone.id).indexOf('ciftlik')===0)ciftlikEtkilesim(pl.nearZone);
      else if(pl.nearZone.id==='demirKapi')BEGIN('gorev');
      else openZone(pl.nearZone.id);
    }
  }
});
document.addEventListener('keyup',function(e){keys[e.key.toLowerCase()]=false;});
document.addEventListener('mousemove',function(e){mousePos.x=e.clientX;mousePos.y=e.clientY;});

let touchInitDone=false;
function initTouch(){
  const joyZone=document.getElementById('joyZone');const knob=document.getElementById('joyKnob');const base=document.getElementById('joyBase');
  document.getElementById('touchLayer').style.display='block';
  if(touchInitDone)return; // event listener'lar zaten bağlı, tekrar ekleme
  touchInitDone=true;
  function getCenter(){const r=base.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};}
  function joyMove(cx,cy){const c=getCenter();const dx=cx-c.x,dy=cy-c.y;const dist=Math.sqrt(dx*dx+dy*dy);const cl=Math.min(dist,JOY_MAX);const ang=Math.atan2(dy,dx);knob.style.transform='translate('+(Math.cos(ang)*cl)+'px,'+(Math.sin(ang)*cl)+'px)';keys['w']=dy<-JOY_DEAD;keys['s']=dy>JOY_DEAD;keys['a']=dx<-JOY_DEAD;keys['d']=dx>JOY_DEAD;if(dist>JOY_DEAD){const cy=Math.cos(camYawS),sy=Math.sin(camYawS),ux=Math.cos(ang),uz=Math.sin(ang),wx=ux*cy+uz*sy,wz=-ux*sy+uz*cy;worldAim.x=pl.x+wx*20;worldAim.z=pl.z+wz*20;pl.ang=Math.atan2(wz,wx);}}
  function joyEnd(){keys['w']=keys['s']=keys['a']=keys['d']=false;knob.style.transform='translate(0px,0px)';joyId=-1;joyActive=false;}
  joyZone.addEventListener('touchstart',function(e){e.preventDefault();if(joyId===-1){const t=e.changedTouches[0];joyId=t.identifier;joyActive=true;joyMove(t.clientX,t.clientY);}},{passive:false});
  document.addEventListener('touchmove',function(e){
    if(joyId===-1)return; // joystick aktif değilse dokunuşu engelleme — menüler kaydırılabilsin
    for(var i=0;i<e.changedTouches.length;i++){
      if(e.changedTouches[i].identifier===joyId){e.preventDefault();joyMove(e.changedTouches[i].clientX,e.changedTouches[i].clientY);}
    }
  },{passive:false});
  document.addEventListener('touchend',function(e){for(var i=0;i<e.changedTouches.length;i++){if(e.changedTouches[i].identifier===joyId)joyEnd();}});
  document.addEventListener('touchcancel',function(e){for(var i=0;i<e.changedTouches.length;i++){if(e.changedTouches[i].identifier===joyId)joyEnd();}});
  const atkBtn=document.getElementById('atkBtn');
  atkBtn.addEventListener('touchstart',function(e){e.preventDefault();e.stopPropagation();atkBtn.classList.add('pr');if(!playing||paused)return;if(currentMap==='gorev'||currentMap==='orman'||currentMap==='maden'||currentMap==='tarim'||currentMap==='sehir'||currentMap==='saray'||(currentMap&&currentMap.startsWith('custom_'))){if(selWeapon===0)doMelee();else{pwrOn=true;pwr=0;}}else if(pl.nearZone){if(pl.nearZone.id==='madenCikis')madenCik();else if(pl.nearZone.id==='tarimCikis')tarimCik();else if(pl.nearZone.id==='dalgaCikis')dmCik();else if(String(pl.nearZone.id).indexOf('ciftlik')===0)ciftlikEtkilesim(pl.nearZone);else if(pl.nearZone.id==='demirKapi')BEGIN('gorev');else openZone(pl.nearZone.id);}},{passive:false});
  atkBtn.addEventListener('touchend',function(e){e.preventDefault();atkBtn.classList.remove('pr');if(pwrOn){doRanged();pwrOn=false;pwr=0;document.getElementById('pwrW').style.display='none';}},{passive:false});
  const runBtn=document.getElementById('runBtn');
  runBtn.addEventListener('touchstart',function(e){e.preventDefault();e.stopPropagation();runBtn.classList.add('pr');keys['shift']=true;},{passive:false});
  runBtn.addEventListener('touchend',function(e){e.preventDefault();runBtn.classList.remove('pr');keys['shift']=false;},{passive:false});
  const zBtn=document.getElementById('zoneBtn');
  zBtn.addEventListener('touchstart',function(e){e.preventDefault();if(pl.nearZone){if(pl.nearZone.id==='demirKapi')BEGIN('gorev');else openZone(pl.nearZone.id);}},{passive:false});
}


// Kamera döndürme düğmeleri (basılı tut)
(function(){
  document.querySelectorAll('.camB').forEach(function(b){
    const d=+b.dataset.d;let iv=0;
    const bas=function(e){e.preventDefault();e.stopPropagation();b.classList.add('pr');clearInterval(iv);camYaw+=d*.05;iv=setInterval(function(){camYaw+=d*.035;},16);};
    const birak=function(){b.classList.remove('pr');clearInterval(iv);};
    b.addEventListener('touchstart',bas,{passive:false});b.addEventListener('mousedown',bas);
    b.addEventListener('touchend',birak);b.addEventListener('touchcancel',birak);b.addEventListener('mouseup',birak);b.addEventListener('mouseleave',birak);
  });
})();
